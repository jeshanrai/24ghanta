import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET / — list articles with pagination, search, filters
router.get('/', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const categoryId = req.query.category_id as string;
  const status = req.query.status as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

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
    const tagRes = await pool.query(`SELECT t.id, t.name, t.slug FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = $1`, [req.params.id]);
    res.json({ ...rows[0], tags: tagRes.rows });
  } catch (error) { console.error('Get article error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

function parseDisplayOrder(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

// POST / — create article
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, slug, excerpt, content, category_id, author_id, image_url, image_alt, is_featured, is_breaking, is_published, display_order, meta_title, meta_description, meta_keywords, tag_ids, published_at } = req.body;
  if (!title || !slug || !image_url) return res.status(400).json({ error: 'Title, slug, and image_url are required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const readTime = Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));
    const pubAt = is_published ? (published_at || new Date().toISOString()) : published_at || null;
    const { rows } = await client.query(
      `INSERT INTO articles (title, slug, excerpt, content, category_id, author_id, image_url, image_alt, published_at, updated_at, read_time_minutes, is_featured, is_breaking, is_published, display_order, meta_title, meta_description, meta_keywords)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [title, slug, excerpt, content, category_id || null, author_id || null, image_url, image_alt || '', pubAt, readTime, is_featured || false, is_breaking || false, is_published || false, parseDisplayOrder(display_order), meta_title || null, meta_description || null, meta_keywords || null]
    );
    if (tag_ids?.length) {
      const vals = tag_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO article_tags (article_id, tag_id) VALUES ${vals}`, [rows[0].id, ...tag_ids]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Create article error:', error); res.status(500).json({ error: 'Internal server error' });
  } finally { client.release(); }
});

// PUT /:id — update article
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { title, slug, excerpt, content, category_id, author_id, image_url, image_alt, is_featured, is_breaking, is_published, display_order, meta_title, meta_description, meta_keywords, tag_ids, published_at } = req.body;
  if (!title || !slug || !image_url) return res.status(400).json({ error: 'Title, slug, and image_url are required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const readTime = Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));
    const { rows } = await client.query(
      `UPDATE articles SET title=$1, slug=$2, excerpt=$3, content=$4, category_id=$5, author_id=$6, image_url=$7, image_alt=$8, published_at=$9, updated_at=NOW(), read_time_minutes=$10, is_featured=$11, is_breaking=$12, is_published=$13, display_order=$14, meta_title=$15, meta_description=$16, meta_keywords=$17 WHERE id=$18 RETURNING *`,
      [title, slug, excerpt, content, category_id || null, author_id || null, image_url, image_alt || '', published_at || null, readTime, is_featured || false, is_breaking || false, is_published || false, parseDisplayOrder(display_order), meta_title || null, meta_description || null, meta_keywords || null, req.params.id]
    );
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Article not found' }); }
    await client.query('DELETE FROM article_tags WHERE article_id = $1', [req.params.id]);
    if (tag_ids?.length) {
      const vals = tag_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO article_tags (article_id, tag_id) VALUES ${vals}`, [req.params.id, ...tag_ids]);
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Update article error:', error); res.status(500).json({ error: 'Internal server error' });
  } finally { client.release(); }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (error) { console.error('Delete article error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// PATCH /:id/toggle — toggle publish
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE articles SET is_published = NOT is_published, published_at = CASE WHEN NOT is_published THEN COALESCE(published_at, NOW()) ELSE published_at END, updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json(rows[0]);
  } catch (error) { console.error('Toggle article error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
