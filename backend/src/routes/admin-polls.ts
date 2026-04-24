import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

// GET / — list all polls with options
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows: polls } = await pool.query(
      'SELECT * FROM polls ORDER BY id DESC'
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
      total_votes: p.total_votes,
      ends_at: p.ends_at,
      is_active: p.is_active,
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
  const { question, options, ends_at, is_active } = req.body;
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res
      .status(400)
      .json({ error: 'Question and at least 2 options are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If this poll is active, deactivate all others
    if (is_active) {
      await client.query('UPDATE polls SET is_active = FALSE');
    }

    const { rows } = await client.query(
      `INSERT INTO polls (question, total_votes, ends_at, is_active)
       VALUES ($1, 0, $2, $3) RETURNING *`,
      [question, ends_at || null, is_active ?? true]
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

// PUT /:id — update poll question/options/active status
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { question, options, ends_at, is_active } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If making this poll active, deactivate all others
    if (is_active) {
      await client.query('UPDATE polls SET is_active = FALSE WHERE id != $1', [
        req.params.id,
      ]);
    }

    const { rows } = await client.query(
      `UPDATE polls SET question = $1, ends_at = $2, is_active = $3
       WHERE id = $4 RETURNING *`,
      [question, ends_at || null, is_active ?? true, req.params.id]
    );
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

    // If activating, deactivate all others first
    if (newActive) {
      await client.query('UPDATE polls SET is_active = FALSE');
    }

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

// PATCH /:id/reset — reset all vote counts to 0
router.patch('/:id/reset', async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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
