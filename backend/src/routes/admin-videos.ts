import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

async function ensureOwnership(req: AuthRequest, id: string | number): Promise<boolean> {
  if (req.role !== 'author') return true;
  const { rows } = await pool.query('SELECT author_id FROM videos WHERE id = $1', [id]);
  if (rows.length === 0) return false;
  return rows[0].author_id === req.authorId;
}

// GET / — list videos (authors only see their own)
router.get('/', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (req.role === 'author') {
    where += ` AND v.author_id = $${idx}`;
    params.push(req.authorId);
    idx++;
  }
  if (search) {
    where += ` AND v.title ILIKE $${idx}`;
    params.push(`%${search}%`);
    idx++;
  }

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM videos v ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query(
      `SELECT v.*, c.name AS category_name, au.name AS author_name
         FROM videos v
         LEFT JOIN categories c ON v.category_id = c.id
         LEFT JOIN authors au ON v.author_id = au.id
         ${where}
         ORDER BY v.id DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('List videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id — single video
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, c.name AS category_name, au.name AS author_name
         FROM videos v
         LEFT JOIN categories c ON v.category_id = c.id
         LEFT JOIN authors au ON v.author_id = au.id
         WHERE v.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Video not found' });
    if (req.role === 'author' && rows[0].author_id !== req.authorId) {
      return res.status(403).json({ error: 'You can only access your own videos' });
    }
    const tagRes = await pool.query(
      `SELECT t.id, t.name, t.slug FROM tags t INNER JOIN video_tags vt ON t.id = vt.tag_id WHERE vt.video_id = $1`,
      [req.params.id]
    );
    res.json({ ...rows[0], tags: tagRes.rows });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — create video (authors forced to self)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, slug, description, thumbnail_url, video_url, embed_url, duration_seconds, category_id, author_id, type, is_published, meta_title, meta_description, meta_keywords, tag_ids, published_at } = req.body;
  if (!title || !slug || !thumbnail_url) return res.status(400).json({ error: 'Title, slug, and thumbnail_url are required' });

  const effectiveAuthorId = req.role === 'author' ? req.authorId : (author_id || null);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO videos
         (title, slug, description, thumbnail_url, video_url, embed_url, duration_seconds,
          category_id, author_id, published_at, type, is_published,
          meta_title, meta_description, meta_keywords)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        title, slug, description, thumbnail_url, video_url || null, embed_url || null,
        duration_seconds || 0, category_id || null, effectiveAuthorId,
        published_at || new Date().toISOString(), type || 'video', is_published || false,
        meta_title || null, meta_description || null, meta_keywords || null,
      ]
    );
    if (tag_ids?.length) {
      const vals = tag_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO video_tags (video_id, tag_id) VALUES ${vals}`, [rows[0].id, ...tag_ids]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /:id — update video
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { title, slug, description, thumbnail_url, video_url, embed_url, duration_seconds, category_id, author_id, type, is_published, meta_title, meta_description, meta_keywords, tag_ids, published_at } = req.body;
  if (!title || !slug || !thumbnail_url) return res.status(400).json({ error: 'Title, slug, and thumbnail_url are required' });

  if (!(await ensureOwnership(req, req.params.id))) {
    return res.status(403).json({ error: 'You can only edit your own videos' });
  }

  const effectiveAuthorId = req.role === 'author' ? req.authorId : (author_id || null);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE videos SET
         title=$1, slug=$2, description=$3, thumbnail_url=$4,
         video_url=$5, embed_url=$6, duration_seconds=$7,
         category_id=$8, author_id=$9, published_at=$10, type=$11,
         is_published=$12, meta_title=$13, meta_description=$14, meta_keywords=$15
       WHERE id=$16 RETURNING *`,
      [
        title, slug, description, thumbnail_url, video_url || null, embed_url || null,
        duration_seconds || 0, category_id || null, effectiveAuthorId,
        published_at || null, type || 'video', is_published || false,
        meta_title || null, meta_description || null, meta_keywords || null, req.params.id,
      ]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Video not found' });
    }
    await client.query('DELETE FROM video_tags WHERE video_id = $1', [req.params.id]);
    if (tag_ids?.length) {
      const vals = tag_ids.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(`INSERT INTO video_tags (video_id, tag_id) VALUES ${vals}`, [req.params.id, ...tag_ids]);
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await ensureOwnership(req, req.params.id))) {
    return res.status(403).json({ error: 'You can only delete your own videos' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM videos WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Video not found' });
    res.json({ message: 'Video deleted' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
