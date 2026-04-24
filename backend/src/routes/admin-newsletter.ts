import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

// GET / — list all subscribers with pagination, search, filters
router.get('/', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const status = req.query.status as string; // 'active' | 'inactive'

  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (search) {
    where += ` AND email ILIKE $${idx}`;
    params.push(`%${search}%`);
    idx++;
  }

  if (status === 'active') where += ' AND is_active = TRUE';
  else if (status === 'inactive') where += ' AND is_active = FALSE';

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM newsletter_subscribers ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT id, email, is_active, created_at
         FROM newsletter_subscribers
         ${where}
         ORDER BY created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    // Also return summary counts
    const statsRes = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(CASE WHEN is_active = TRUE THEN 1 END) AS active,
         COUNT(CASE WHEN is_active = FALSE THEN 1 END) AS inactive
       FROM newsletter_subscribers`
    );

    res.json({
      data: result.rows,
      stats: {
        total: parseInt(statsRes.rows[0].total),
        active: parseInt(statsRes.rows[0].active),
        inactive: parseInt(statsRes.rows[0].inactive),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List subscribers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /:id/toggle — toggle active/inactive
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE newsletter_subscribers
          SET is_active = NOT is_active
        WHERE id = $1
        RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Subscriber not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Toggle subscriber error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id — permanently remove a subscriber
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM newsletter_subscribers WHERE id = $1',
      [req.params.id]
    );
    if (rowCount === 0)
      return res.status(404).json({ error: 'Subscriber not found' });
    res.json({ message: 'Subscriber deleted' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /add — admin manually adds a subscriber
router.post('/add', async (req: AuthRequest, res: Response) => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO newsletter_subscribers (email, is_active)
       VALUES ($1, TRUE)
       ON CONFLICT (email)
       DO UPDATE SET is_active = TRUE
       RETURNING *`,
      [email]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Add subscriber error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /export — export all active subscriber emails as CSV
router.get('/export', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT email, is_active, created_at
         FROM newsletter_subscribers
         ORDER BY created_at DESC`
    );
    const csv = [
      'Email,Status,Subscribed At',
      ...rows.map(
        (r) =>
          `${r.email},${r.is_active ? 'Active' : 'Inactive'},${new Date(r.created_at).toISOString()}`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="subscribers.csv"'
    );
    res.send(csv);
  } catch (error) {
    console.error('Export subscribers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
