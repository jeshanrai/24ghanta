import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

function parseDisplayOrder(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// GET / — list all polls with options
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows: polls } = await pool.query(
      'SELECT * FROM polls ORDER BY display_order ASC, id DESC'
    );
    const ids = polls.map((p) => p.id);
    let options: any[] = [];
    if (ids.length > 0) {
      const optRes = await pool.query(
        'SELECT * FROM poll_options WHERE poll_id = ANY($1::int[]) ORDER BY id ASC',
        [ids]
      );
      options = optRes.rows;
    }

    const data = polls.map((p) => ({
      id: p.id,
      question: p.question,
      image_url: p.image_url,
      total_votes: p.total_votes,
      ends_at: p.ends_at,
      is_active: p.is_active,
      display_order: p.display_order ?? 0,
      options: options
        .filter((o) => o.poll_id === p.id)
        .map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
    }));

    res.json({ data });
  } catch (error) {
    console.error('List polls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id — single poll with options
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rows: polls } = await pool.query(
      'SELECT * FROM polls WHERE id = $1',
      [req.params.id]
    );
    if (polls.length === 0)
      return res.status(404).json({ error: 'Poll not found' });

    const { rows: options } = await pool.query(
      'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
      [req.params.id]
    );

    res.json({
      ...polls[0],
      options: options.map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — create poll with options
router.post('/', async (req: AuthRequest, res: Response) => {
  const { question, options, ends_at, is_active, image_url, display_order } = req.body;
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res
      .status(400)
      .json({ error: 'Question and at least 2 options are required' });
  }
  if (typeof image_url !== 'string' || !image_url.trim()) {
    return res.status(400).json({ error: 'Poll image is required' });
  }

  // Multiple polls can be active at once now (homepage slider).
  // Default new polls to the end of the order so they don't shove others around.
  const order = parseDisplayOrder(display_order);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO polls (question, image_url, total_votes, ends_at, is_active, display_order)
       VALUES ($1, $2, 0, $3, $4, $5) RETURNING *`,
      [question, image_url.trim(), ends_at || null, is_active ?? true, order]
    );
    const pollId = rows[0].id;

    for (const opt of options) {
      if (typeof opt === 'string' && opt.trim()) {
        await client.query(
          'INSERT INTO poll_options (poll_id, text, votes) VALUES ($1, $2, 0)',
          [pollId, opt.trim()]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch back with options
    const { rows: optRows } = await client.query(
      'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
      [pollId]
    );

    res.status(201).json({
      ...rows[0],
      options: optRows.map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /:id — update poll question/options/active status/display order
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { question, options, ends_at, is_active, image_url, display_order } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  if (typeof image_url !== 'string' || !image_url.trim()) {
    return res.status(400).json({ error: 'Poll image is required' });
  }

  const order = parseDisplayOrder(display_order);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Note: options replacement also resets total_votes to 0 (since old options
    // would otherwise be orphaned). poll_votes rows cascade away via FK when
    // their option_id rows are deleted, so dedupe history is correctly wiped
    // alongside the count reset — voters can vote on the rewritten poll.
    const updateQuery = options && Array.isArray(options) && options.length >= 2
      ? `UPDATE polls SET question = $1, image_url = $2, ends_at = $3, is_active = $4, display_order = $5, total_votes = 0
         WHERE id = $6 RETURNING *`
      : `UPDATE polls SET question = $1, image_url = $2, ends_at = $3, is_active = $4, display_order = $5
         WHERE id = $6 RETURNING *`;

    const { rows } = await client.query(updateQuery, [
      question,
      image_url.trim(),
      ends_at || null,
      is_active ?? true,
      order,
      req.params.id,
    ]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Replace options if provided
    if (options && Array.isArray(options) && options.length >= 2) {
      await client.query('DELETE FROM poll_options WHERE poll_id = $1', [
        req.params.id,
      ]);
      for (const opt of options) {
        const text = typeof opt === 'string' ? opt : opt.text;
        if (text && text.trim()) {
          await client.query(
            'INSERT INTO poll_options (poll_id, text, votes) VALUES ($1, $2, 0)',
            [req.params.id, text.trim()]
          );
        }
      }
    }

    await client.query('COMMIT');

    const { rows: optRows } = await pool.query(
      'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
      [req.params.id]
    );

    res.json({
      ...rows[0],
      options: optRows.map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PATCH /:id/toggle — toggle active/inactive
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: current } = await client.query(
      'SELECT is_active FROM polls WHERE id = $1',
      [req.params.id]
    );
    if (current.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Poll not found' });
    }

    const newActive = !current[0].is_active;

    // Multiple polls can be active simultaneously now — no sibling deactivation.
    const { rows } = await client.query(
      'UPDATE polls SET is_active = $1 WHERE id = $2 RETURNING *',
      [newActive, req.params.id]
    );

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Toggle poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PATCH /:id/reset — reset all vote counts AND voter dedupe history
router.patch('/:id/reset', async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Wipe per-voter records too — otherwise a "reset" would still block
    // previous voters from voting again, which isn't what an admin expects.
    await client.query('DELETE FROM poll_votes WHERE poll_id = $1', [req.params.id]);
    await client.query(
      'UPDATE poll_options SET votes = 0 WHERE poll_id = $1',
      [req.params.id]
    );
    const { rows } = await client.query(
      'UPDATE polls SET total_votes = 0 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Poll not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Votes reset', poll: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM polls WHERE id = $1', [
      req.params.id,
    ]);
    if (rowCount === 0)
      return res.status(404).json({ error: 'Poll not found' });
    res.json({ message: 'Poll deleted' });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
