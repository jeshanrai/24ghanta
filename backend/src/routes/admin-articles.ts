import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { parsePagination } from '../utils/pagination';
import { loadAuthorPerms } from '../utils/authorPerms';
import { sendArticleAlert } from '../services/newsletter';

const router = Router();
router.use(requireAuth);

/**
 * Fire-and-forget article alert. Decouples email I/O from the HTTP response so
 * a slow SMTP relay (or hundreds of subscribers) never blocks the admin's save.
 * Errors are swallowed and logged; the article was already persisted.
 */
function dispatchArticleAlert(articleId: number): void {
  setImmediate(() => {
    sendArticleAlert(articleId).catch((err) => {
      console.error(`[admin-articles] Article ${articleId} alert dispatch failed:`, err);
    });
  });
}

/** Returns { where, params } that scope to author_id when the caller is an author. */
async function ensureOwnership(req: AuthRequest, id: string | number): Promise<boolean> {
  if (req.role !== 'author') return true;
  const { rows } = await pool.query('SELECT author_id FROM articles WHERE id = $1', [id]);
  if (rows.length === 0) return false;
  return rows[0].author_id === req.authorId;
}

// GET / — list articles with pagination, search, filters
router.get('/', async (req: AuthRequest, res: Response) => {
  const { page, limit, offset } = parsePagination(req.query);
  const search = req.query.search as string;
  const categoryId = req.query.category_id as string;
  const status = req.query.status as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  // Authors only ever see their own articles
  if (req.role === 'author') {
    where += ` AND a.author_id = $${idx}`;
    params.push(req.authorId);
    idx++;
  }

  if (search) { where += ` AND (a.title ILIKE $${idx} OR a.excerpt ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
  if (categoryId) { where += ` AND a.category_id = $${idx}`; params.push(parseInt(categoryId)); idx++; }
  if (status === 'published') where += ' AND a.is_published = true';
  else if (status === 'draft') where += ' AND a.is_published = false';

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM articles a ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query(
      `SELECT a.*, c.name as category_name, au.name as author_name
       FROM articles a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN authors au ON a.author_id = au.id
       ${where} ORDER BY a.id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { console.error('List articles error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /:id — single article with tags
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, c.name as category_name, au.name as author_name FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN authors au ON a.author_id = au.id WHERE a.id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    if (req.role === 'author' && rows[0].author_id !== req.authorId) {
      return res.status(403).json({ error: 'You can only access your own articles' });
    }
    const tagRes = await pool.query(`SELECT t.id, t.name, t.slug FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = $1`, [req.params.id]);
    // Extra (non-primary) categories so the edit form can preload its chips.
    const catRes = await pool.query(
      `SELECT c.id, c.name, c.slug
         FROM article_categories ac
         JOIN categories c ON c.id = ac.category_id
        WHERE ac.article_id = $1
        ORDER BY c.name ASC`,
      [req.params.id]
    );
    res.json({ ...rows[0], tags: tagRes.rows, extra_categories: catRes.rows });
  } catch (error) { console.error('Get article error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

function parseDisplayOrder(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Sanitises a category_ids[] payload from the article form. Drops anything
 * non-numeric, dedupes, removes the primary (which lives on articles.category_id
 * — we don't want to double-count it in article_categories), caps the list.
 */
function parseCategoryIds(raw: unknown, primaryId: number | null): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const v of raw) {
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (primaryId && n === primaryId) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 10) break;
  }
  return out;
}

/**
 * Sanitises a gallery payload: must be an array of { url, caption? }.
 * Drops anything malformed; caps to 24 items.
 */
function parseGallery(v: unknown): { url: string; caption: string | null }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const url = (item as { url?: unknown }).url;
      if (typeof url !== 'string' || !url.trim()) return null;
      const trimmed = url.trim();
      // Only allow http(s) URLs and server-relative paths — blocks javascript:, data:, etc.
      if (!/^(https?:\/\/|\/)/i.test(trimmed)) return null;
      const caption = (item as { caption?: unknown }).caption;
      return {
        url: trimmed.slice(0, 500),
        caption: typeof caption === 'string' ? caption.trim().slice(0, 240) || null : null,
      };
    })
    .filter((g): g is { url: string; caption: string | null } => g !== null)
    .slice(0, 24);
}

// POST / — create article
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, slug, excerpt, content, category_id, category_ids, author_id, image_url, image_alt, is_featured, is_breaking, is_published, display_order, meta_title, meta_description, meta_keywords, tag_ids, published_at, gallery, notify_subscribers } = req.body;
  if (!title || !slug || !image_url) return res.status(400).json({ error: 'Title, slug, and image_url are required' });
  // Author permission gates
  const perms = req.role === 'author' ? await loadAuthorPerms(req.authorId!) : null;
  if (req.role === 'author' && !perms?.can_create_articles) {
    return res.status(403).json({ error: 'You do not have permission to create articles' });
  }
  // Authors can only write as themselves; admins can pick any author
  const effectiveAuthorId = req.role === 'author' ? req.authorId : (author_id || null);
  // Authors gated by per-account toggles for feature / breaking / publish; pin position is admin-only
  const effectiveFeatured = req.role === 'author' ? (perms?.can_feature_articles ? !!is_featured : false) : (is_featured || false);
  const effectiveBreaking = req.role === 'author' ? (perms?.can_mark_breaking ? !!is_breaking : false) : (is_breaking || false);
  const effectiveDisplayOrder = req.role === 'author' ? null : parseDisplayOrder(display_order);
  const effectivePublished = req.role === 'author' ? (perms?.can_publish ? !!is_published : false) : !!is_published;
  // Newsletter alert is admin-by-default, authors require explicit can_send_newsletter.
  const canNotify = req.role === 'admin' || !!perms?.can_send_newsletter;
  const shouldNotify = !!notify_subscribers && canNotify && effectivePublished;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const readTime = Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));
    const pubAt = effectivePublished ? (published_at || new Date().toISOString()) : published_at || null;
    const galleryJson = JSON.stringify(parseGallery(gallery));
    const { rows } = await client.query(
      `INSERT INTO articles (title, slug, excerpt, content, category_id, author_id, image_url, image_alt, published_at, updated_at, read_time_minutes, is_featured, is_breaking, is_published, display_order, meta_title, meta_description, meta_keywords, gallery)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb) RETURNING *`,
      [title, slug, excerpt, content, category_id || null, effectiveAuthorId, image_url, image_alt || '', pubAt, readTime, effectiveFeatured, effectiveBreaking, effectivePublished, effectiveDisplayOrder, meta_title || null, meta_description || null, meta_keywords || null, galleryJson]
    );
    if (tag_ids?.length) {
      const vals = tag_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO article_tags (article_id, tag_id) VALUES ${vals}`, [rows[0].id, ...tag_ids]);
    }
    const extraCats = parseCategoryIds(category_ids, rows[0].category_id);
    if (extraCats.length) {
      const vals = extraCats.map((_, i) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO article_categories (article_id, category_id) VALUES ${vals}`, [rows[0].id, ...extraCats]);
    }
    await client.query('COMMIT');
    if (shouldNotify) dispatchArticleAlert(rows[0].id);
    res.status(201).json({ ...rows[0], notified: shouldNotify });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Create article error:', error); res.status(500).json({ error: 'Internal server error' });
  } finally { client.release(); }
});

// PUT /:id — update article
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { title, slug, excerpt, content, category_id, category_ids, author_id, image_url, image_alt, is_featured, is_breaking, is_published, display_order, meta_title, meta_description, meta_keywords, tag_ids, published_at, gallery, notify_subscribers } = req.body;
  if (!title || !slug || !image_url) return res.status(400).json({ error: 'Title, slug, and image_url are required' });
  if (!(await ensureOwnership(req, req.params.id))) {
    return res.status(403).json({ error: 'You can only edit your own articles' });
  }
  const perms = req.role === 'author' ? await loadAuthorPerms(req.authorId!) : null;
  // Authors cannot re-assign their articles; feature/break/publish gated by per-account toggles
  const effectiveAuthorId = req.role === 'author' ? req.authorId : (author_id || null);
  const effectiveFeatured = req.role === 'author' ? (perms?.can_feature_articles ? !!is_featured : false) : (is_featured || false);
  const effectiveBreaking = req.role === 'author' ? (perms?.can_mark_breaking ? !!is_breaking : false) : (is_breaking || false);
  const effectiveDisplayOrder = req.role === 'author' ? null : parseDisplayOrder(display_order);
  const effectivePublished = req.role === 'author' ? (perms?.can_publish ? !!is_published : false) : !!is_published;
  const canNotify = req.role === 'admin' || !!perms?.can_send_newsletter;
  const shouldNotify = !!notify_subscribers && canNotify && effectivePublished;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const readTime = Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));
    const galleryJson = JSON.stringify(parseGallery(gallery));
    const { rows } = await client.query(
      `UPDATE articles SET title=$1, slug=$2, excerpt=$3, content=$4, category_id=$5, author_id=$6, image_url=$7, image_alt=$8, published_at=$9, updated_at=NOW(), read_time_minutes=$10, is_featured=$11, is_breaking=$12, is_published=$13, display_order=$14, meta_title=$15, meta_description=$16, meta_keywords=$17, gallery=$18::jsonb WHERE id=$19 RETURNING *`,
      [title, slug, excerpt, content, category_id || null, effectiveAuthorId, image_url, image_alt || '', published_at || null, readTime, effectiveFeatured, effectiveBreaking, effectivePublished, effectiveDisplayOrder, meta_title || null, meta_description || null, meta_keywords || null, galleryJson, req.params.id]
    );
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Article not found' }); }
    await client.query('DELETE FROM article_tags WHERE article_id = $1', [req.params.id]);
    if (tag_ids?.length) {
      const vals = tag_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO article_tags (article_id, tag_id) VALUES ${vals}`, [req.params.id, ...tag_ids]);
    }
    await client.query('DELETE FROM article_categories WHERE article_id = $1', [req.params.id]);
    const extraCats = parseCategoryIds(category_ids, rows[0].category_id);
    if (extraCats.length) {
      const vals = extraCats.map((_, i) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO article_categories (article_id, category_id) VALUES ${vals}`, [req.params.id, ...extraCats]);
    }
    await client.query('COMMIT');
    if (shouldNotify) dispatchArticleAlert(rows[0].id);
    res.json({ ...rows[0], notified: shouldNotify });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Update article error:', error); res.status(500).json({ error: 'Internal server error' });
  } finally { client.release(); }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await ensureOwnership(req, req.params.id))) {
    return res.status(403).json({ error: 'You can only delete your own articles' });
  }
  if (req.role === 'author') {
    const perms = await loadAuthorPerms(req.authorId!);
    if (!perms?.can_delete_own) return res.status(403).json({ error: 'You do not have permission to delete content' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (error) { console.error('Delete article error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// PATCH /:id/toggle — toggle publish
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  if (!(await ensureOwnership(req, req.params.id))) {
    return res.status(403).json({ error: 'You can only toggle your own articles' });
  }
  if (req.role === 'author') {
    const perms = await loadAuthorPerms(req.authorId!);
    if (!perms?.can_publish) return res.status(403).json({ error: 'You do not have permission to publish content' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE articles SET is_published = NOT is_published, published_at = CASE WHEN NOT is_published THEN COALESCE(published_at, NOW()) ELSE published_at END, updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json(rows[0]);
  } catch (error) { console.error('Toggle article error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
