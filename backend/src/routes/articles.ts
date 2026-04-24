import { Router, Request, Response } from 'express';
import pool from '../db';
import { mapArticleRow, ARTICLE_SELECT, ARTICLE_JOIN } from '../mappers';

const router = Router();

// Admin-controlled order first, then publication recency.
// Lower display_order = earlier. NULLs sort last so ordered picks float to top.
const ORDER_BY = `
  ORDER BY
    a.display_order ASC NULLS LAST,
    a.published_at DESC NULLS LAST,
    a.id DESC
`;

// GET /api/articles?category=slug&limit=20
router.get('/', async (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : null;
  const limit = Math.min(parseInt((req.query.limit as string) ?? '10', 10) || 10, 100);

  try {
    const params: unknown[] = [];
    let where = 'WHERE a.is_published = TRUE';
    if (category) {
      params.push(category);
      where += ` AND c.slug = $${params.length}`;
    }
    params.push(limit);

    const { rows } = await pool.query(
      `SELECT ${ARTICLE_SELECT}
       FROM articles a
       ${ARTICLE_JOIN}
       ${where}
       ${ORDER_BY}
       LIMIT $${params.length}`,
      params
    );
    res.json({ data: rows.map(mapArticleRow), total: rows.length });
  } catch (error) {
    console.error('List articles error:', error);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/articles/featured — the one marked featured, or fall back to latest
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${ARTICLE_SELECT}
       FROM articles a
       ${ARTICLE_JOIN}
       WHERE a.is_published = TRUE AND a.is_featured = TRUE
       ${ORDER_BY}
       LIMIT 1`
    );
    if (rows.length === 0) {
      const fallback = await pool.query(
        `SELECT ${ARTICLE_SELECT}
         FROM articles a
         ${ARTICLE_JOIN}
         WHERE a.is_published = TRUE
         ${ORDER_BY}
         LIMIT 1`
      );
      if (fallback.rows.length === 0) {
        return res.status(404).json({ error: 'No articles published yet' });
      }
      return res.json({ data: mapArticleRow(fallback.rows[0]) });
    }
    res.json({ data: mapArticleRow(rows[0]) });
  } catch (error) {
    console.error('Featured article error:', error);
    res.status(500).json({ error: 'Failed to load featured article' });
  }
});

// GET /api/articles/search?q=keyword&limit=20
router.get('/search', async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10) || 20, 50);

  if (!q) return res.json({ data: [], total: 0 });

  try {
    const { rows } = await pool.query(
      `SELECT ${ARTICLE_SELECT}
       FROM articles a
       ${ARTICLE_JOIN}
       WHERE a.is_published = TRUE
         AND (a.title ILIKE $1 OR a.excerpt ILIKE $1 OR a.content ILIKE $1 OR c.name ILIKE $1)
       ${ORDER_BY}
       LIMIT $2`,
      [`%${q}%`, limit]
    );
    res.json({ data: rows.map(mapArticleRow), total: rows.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/articles/slugs — for Next.js generateStaticParams
router.get('/slugs', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT slug FROM articles WHERE is_published = TRUE ORDER BY id DESC`
    );
    res.json({ data: rows.map((r) => r.slug) });
  } catch (error) {
    console.error('Slugs error:', error);
    res.status(500).json({ error: 'Failed to load slugs' });
  }
});

// GET /api/articles/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${ARTICLE_SELECT}
       FROM articles a
       ${ARTICLE_JOIN}
       WHERE a.slug = $1 AND a.is_published = TRUE
       LIMIT 1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });

    // Fire-and-forget view increment
    pool.query('UPDATE articles SET views = views + 1 WHERE id = $1', [rows[0].id]).catch(() => {});

    res.json({ data: mapArticleRow(rows[0]) });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to load article' });
  }
});

// GET /api/articles/:slug/related?limit=4
router.get('/:slug/related', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '4', 10) || 4, 20);
  try {
    const target = await pool.query(
      'SELECT id, category_id FROM articles WHERE slug = $1 AND is_published = TRUE LIMIT 1',
      [req.params.slug]
    );
    if (target.rows.length === 0) return res.status(404).json({ error: 'Article not found' });

    const { rows } = await pool.query(
      `SELECT ${ARTICLE_SELECT}
       FROM articles a
       ${ARTICLE_JOIN}
       WHERE a.is_published = TRUE
         AND a.id != $1
         AND ($2::int IS NULL OR a.category_id = $2)
       ${ORDER_BY}
       LIMIT $3`,
      [target.rows[0].id, target.rows[0].category_id, limit]
    );
    res.json({ data: rows.map(mapArticleRow) });
  } catch (error) {
    console.error('Related articles error:', error);
    res.status(500).json({ error: 'Failed to load related articles' });
  }
});

export default router;
