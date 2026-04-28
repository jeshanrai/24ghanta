import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

interface PollRow {
  id: number;
  question: string;
  image_url: string | null;
  total_votes: number;
  ends_at: string | null;
  is_active: boolean;
}

interface PollOptionRow {
  id: number;
  poll_id: number;
  text: string;
  votes: number;
}

function formatPoll(poll: PollRow, options: PollOptionRow[]) {
  return {
    id: String(poll.id),
    question: poll.question,
    imageUrl: poll.image_url ?? undefined,
    totalVotes: poll.total_votes,
    endsAt: poll.ends_at ?? undefined,
    isActive: poll.is_active,
    options: options
      .filter((o) => o.poll_id === poll.id)
      .map((o) => ({ id: String(o.id), text: o.text, votes: o.votes })),
  };
}

// GET /api/polls
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows: polls } = await pool.query('SELECT * FROM polls ORDER BY id DESC');
    const ids = polls.map((p) => p.id);
    const { rows: options } = await pool.query(
      'SELECT * FROM poll_options WHERE poll_id = ANY($1::int[]) ORDER BY id ASC',
      [ids]
    );
    res.json({ data: polls.map((p) => formatPoll(p, options)) });
  } catch (error) {
    console.error('List polls error:', error);
    res.status(500).json({ error: 'Failed to load polls' });
  }
});

// GET /api/polls/active
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const { rows: polls } = await pool.query(
      `SELECT * FROM polls WHERE is_active = TRUE ORDER BY id DESC LIMIT 1`
    );
    if (polls.length === 0) return res.status(404).json({ error: 'No active poll found' });
    const { rows: options } = await pool.query(
      'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
      [polls[0].id]
    );
    res.json({ data: formatPoll(polls[0], options) });
  } catch (error) {
    console.error('Active poll error:', error);
    res.status(500).json({ error: 'Failed to load active poll' });
  }
});

// GET /api/polls/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid poll id' });
  try {
    const { rows: polls } = await pool.query('SELECT * FROM polls WHERE id = $1', [id]);
    if (polls.length === 0) return res.status(404).json({ error: 'Poll not found' });
    const { rows: options } = await pool.query(
      'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
      [id]
    );
    res.json({ data: formatPoll(polls[0], options) });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Failed to load poll' });
  }
});

// POST /api/polls/:id/vote
router.post('/:id/vote', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const optionId = parseInt(req.body?.optionId, 10);
  if (isNaN(id) || isNaN(optionId)) {
    return res.status(400).json({ error: 'Invalid poll or option id' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const opt = await client.query(
      'SELECT poll_id FROM poll_options WHERE id = $1 FOR UPDATE',
      [optionId]
    );
    if (opt.rows.length === 0 || opt.rows[0].poll_id !== id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Option not found on this poll' });
    }
    await client.query('UPDATE poll_options SET votes = votes + 1 WHERE id = $1', [optionId]);
    await client.query('UPDATE polls SET total_votes = total_votes + 1 WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Vote recorded' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  } finally {
    client.release();
  }
});

export default router;
