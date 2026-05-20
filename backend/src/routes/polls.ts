import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db';
import { pollVoteLimiter } from '../middleware/rateLimiters';

const router = Router();

interface PollRow {
  id: number;
  question: string;
  image_url: string | null;
  total_votes: number;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
}

interface PollOptionRow {
  id: number;
  poll_id: number;
  text: string;
  votes: number;
}

/**
 * Anonymous voter fingerprint. SHA-256 of IP + User-Agent — good enough to
 * stop the same browser from spamming a poll without requiring accounts.
 * Salted with JWT_SECRET so the raw hash isn't trivially correlatable.
 *
 * Not a security measure — anyone with multiple devices / a VPN can still
 * vote multiple times. Industry norm for news-site polls.
 */
function voterKeyFor(req: Request): string {
  // `req.ip` honours `app.set('trust proxy', 1)` (set in server.ts), so behind
  // a Render/Vercel proxy this resolves to the real client IP, not the proxy.
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ua = req.get('user-agent') || 'unknown';
  const salt = process.env.JWT_SECRET || 'poll-salt';
  return crypto.createHash('sha256').update(`${ip}::${ua}::${salt}`).digest('hex');
}

function formatPoll(poll: PollRow, options: PollOptionRow[], userVotedOptionId?: number | null) {
  return {
    id: String(poll.id),
    question: poll.question,
    imageUrl: poll.image_url ?? undefined,
    totalVotes: poll.total_votes,
    endsAt: poll.ends_at ?? undefined,
    isActive: poll.is_active,
    displayOrder: poll.display_order ?? 0,
    userVotedOptionId: userVotedOptionId != null ? String(userVotedOptionId) : null,
    options: options
      .filter((o) => o.poll_id === poll.id)
      .map((o) => ({ id: String(o.id), text: o.text, votes: o.votes })),
  };
}

// GET /api/polls — every poll (admin-style listing)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows: polls } = await pool.query<PollRow>(
      'SELECT * FROM polls ORDER BY display_order ASC, id DESC'
    );
    const ids = polls.map((p) => p.id);
    const { rows: options } = await pool.query<PollOptionRow>(
      'SELECT * FROM poll_options WHERE poll_id = ANY($1::int[]) ORDER BY id ASC',
      [ids]
    );
    res.json({ data: polls.map((p) => formatPoll(p, options)) });
  } catch (error) {
    console.error('List polls error:', error);
    res.status(500).json({ error: 'Failed to load polls' });
  }
});

/**
 * Hard cap on how many polls the homepage slider will show at once. Admins can
 * still create unlimited polls (useful for staging drafts), but readers only
 * see the top N by display_order. News-site UX research shows engagement on
 * carousel slots drops sharply past ~5 items; we cap at 7 to leave a small
 * buffer for special events.
 */
const ACTIVE_POLL_SLIDER_CAP = 7;

/**
 * GET /api/polls/active — top N active polls in display order.
 *
 * Used by the homepage slider. Also resolves whether the current visitor has
 * already voted on each one (so the slider can pre-show results instead of
 * letting them try and bounce off a 409).
 *
 * Response shape: `{ data: Poll[] }` — note this is an ARRAY now. The old
 * single-poll shape would be ambiguous once we support multiples.
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const { rows: polls } = await pool.query<PollRow>(
      `SELECT * FROM polls
        WHERE is_active = TRUE
          AND (ends_at IS NULL OR ends_at > NOW())
        ORDER BY display_order ASC, id DESC
        LIMIT $1`,
      [ACTIVE_POLL_SLIDER_CAP]
    );
    if (polls.length === 0) return res.json({ data: [] });

    const ids = polls.map((p) => p.id);
    const [optRes, voteRes] = await Promise.all([
      pool.query<PollOptionRow>(
        'SELECT * FROM poll_options WHERE poll_id = ANY($1::int[]) ORDER BY id ASC',
        [ids]
      ),
      pool.query<{ poll_id: number; option_id: number }>(
        'SELECT poll_id, option_id FROM poll_votes WHERE poll_id = ANY($1::int[]) AND voter_key = $2',
        [ids, voterKeyFor(req)]
      ),
    ]);

    const votedByPoll = new Map<number, number>();
    for (const v of voteRes.rows) votedByPoll.set(v.poll_id, v.option_id);

    res.json({
      data: polls.map((p) => formatPoll(p, optRes.rows, votedByPoll.get(p.id) ?? null)),
    });
  } catch (error) {
    console.error('Active polls error:', error);
    res.status(500).json({ error: 'Failed to load active polls' });
  }
});

// GET /api/polls/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid poll id' });
  try {
    const { rows: polls } = await pool.query<PollRow>(
      'SELECT * FROM polls WHERE id = $1',
      [id]
    );
    if (polls.length === 0) return res.status(404).json({ error: 'Poll not found' });
    const [optRes, voteRes] = await Promise.all([
      pool.query<PollOptionRow>(
        'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
        [id]
      ),
      pool.query<{ option_id: number }>(
        'SELECT option_id FROM poll_votes WHERE poll_id = $1 AND voter_key = $2',
        [id, voterKeyFor(req)]
      ),
    ]);
    res.json({
      data: formatPoll(polls[0], optRes.rows, voteRes.rows[0]?.option_id ?? null),
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Failed to load poll' });
  }
});

/**
 * POST /api/polls/:id/vote
 *
 * Body: { optionId: number }
 * Returns 409 if this voter has already voted on this poll. The duplicate
 * check is enforced atomically by the PRIMARY KEY on poll_votes — no
 * application-level race window between "check" and "insert".
 */
router.post('/:id/vote', pollVoteLimiter, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const optionId = parseInt(req.body?.optionId, 10);
  if (isNaN(id) || isNaN(optionId)) {
    return res.status(400).json({ error: 'Invalid poll or option id' });
  }
  const voterKey = voterKeyFor(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate the option actually belongs to the poll (lock the row so a
    // concurrent admin reset can't race the vote increment).
    const opt = await client.query(
      'SELECT poll_id FROM poll_options WHERE id = $1 FOR UPDATE',
      [optionId]
    );
    if (opt.rows.length === 0 || opt.rows[0].poll_id !== id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Option not found on this poll' });
    }

    // Atomic dedupe. ON CONFLICT DO NOTHING + rowCount check is the
    // simplest correct way to enforce "one vote per voter per poll".
    const insert = await client.query(
      `INSERT INTO poll_votes (poll_id, voter_key, option_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (poll_id, voter_key) DO NOTHING`,
      [id, voterKey, optionId]
    );

    if (insert.rowCount === 0) {
      await client.query('ROLLBACK');
      // Tell the caller which option they originally picked so the UI can
      // jump straight to results instead of leaving them confused.
      const prev = await pool.query<{ option_id: number }>(
        'SELECT option_id FROM poll_votes WHERE poll_id = $1 AND voter_key = $2',
        [id, voterKey]
      );
      return res.status(409).json({
        error: 'You have already voted on this poll',
        previousOptionId: prev.rows[0]?.option_id ? String(prev.rows[0].option_id) : null,
      });
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
