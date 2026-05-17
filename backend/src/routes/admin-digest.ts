import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import {
  getEmailSettings,
  getDigestArticles,
  renderDigestHtml,
  sendDigest,
} from '../services/newsletter';
import { applyEmailSettings, describeSchedule } from '../services/newsletterScheduler';

const router = Router();
router.use(requireAdmin);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /settings — current schedule + counts
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getEmailSettings();
    res.json({
      ...settings,
      schedule_label: describeSchedule(
        settings.weekly_digest_day_of_week,
        settings.weekly_digest_hour,
        settings.weekly_digest_enabled
      ),
    });
  } catch (err) {
    console.error('Get email settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /settings — patch any field; reschedules cron
router.put('/settings', async (req: AuthRequest, res: Response) => {
  const enabled = req.body?.weekly_digest_enabled;
  const dayRaw = req.body?.weekly_digest_day_of_week;
  const hourRaw = req.body?.weekly_digest_hour;
  const mode = req.body?.digest_curation_mode;

  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (typeof enabled === 'boolean') {
    fields.push(`weekly_digest_enabled = $${idx++}`);
    params.push(enabled);
  }
  if (dayRaw !== undefined) {
    const n = parseInt(String(dayRaw), 10);
    if (!Number.isFinite(n) || n < 0 || n > 6) {
      return res.status(400).json({ error: 'weekly_digest_day_of_week must be 0–6' });
    }
    fields.push(`weekly_digest_day_of_week = $${idx++}`);
    params.push(n);
  }
  if (hourRaw !== undefined) {
    const n = parseInt(String(hourRaw), 10);
    if (!Number.isFinite(n) || n < 0 || n > 23) {
      return res.status(400).json({ error: 'weekly_digest_hour must be 0–23' });
    }
    fields.push(`weekly_digest_hour = $${idx++}`);
    params.push(n);
  }
  if (mode !== undefined) {
    if (mode !== 'auto' && mode !== 'manual') {
      return res.status(400).json({ error: "digest_curation_mode must be 'auto' or 'manual'" });
    }
    fields.push(`digest_curation_mode = $${idx++}`);
    params.push(mode);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    fields.push(`updated_at = NOW()`);
    params.push(1);
    const { rows } = await pool.query(
      `UPDATE email_settings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    // Reschedule cron with the new spec.
    await applyEmailSettings();
    res.json({
      ...rows[0],
      schedule_label: describeSchedule(
        rows[0].weekly_digest_day_of_week,
        rows[0].weekly_digest_hour,
        rows[0].weekly_digest_enabled
      ),
    });
  } catch (err) {
    console.error('Update email settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /preview — articles selected for the next digest + rendered HTML
router.get('/preview', async (_req: AuthRequest, res: Response) => {
  try {
    const articles = await getDigestArticles();
    const { html } = renderDigestHtml({
      articles,
      unsubscribeUrl: '#preview',
      previewBanner: 'PREVIEW — this is what subscribers will see.',
    });
    res.json({ articles, html });
  } catch (err) {
    console.error('Digest preview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /send-test — admin sends a preview to a single address
router.post('/send-test', async (req: AuthRequest, res: Response) => {
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  try {
    const result = await sendDigest({ testRecipients: [email] });
    res.json(result);
  } catch (err) {
    console.error('Send test digest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /send-now — immediate live broadcast (same code path as the cron tick)
router.post('/send-now', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await sendDigest();
    res.json(result);
  } catch (err) {
    console.error('Send digest now error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── Manual curation: newsletter_picks ───────────────────────────── */

// GET /picks — current manual selection (joined with article fields)
router.get('/picks', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.image_url, a.published_at,
              c.name AS category_name,
              p.sort_order
         FROM newsletter_picks p
         JOIN articles a ON a.id = p.article_id
         LEFT JOIN categories c ON c.id = a.category_id
        WHERE a.is_published = TRUE
        ORDER BY p.sort_order ASC, p.added_at ASC`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Get picks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /picks — replace picks atomically. Body: { article_ids: number[] } (ordered).
router.put('/picks', async (req: AuthRequest, res: Response) => {
  const ids = Array.isArray(req.body?.article_ids) ? req.body.article_ids : [];
  const cleaned: number[] = [];
  const seen = new Set<number>();
  for (const v of ids) {
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    if (Number.isFinite(n) && n > 0 && !seen.has(n)) {
      seen.add(n);
      cleaned.push(n);
    }
    if (cleaned.length >= 20) break;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM newsletter_picks');
    if (cleaned.length) {
      const values = cleaned.map((_, i) => `($${i + 1}, ${i})`).join(',');
      await client.query(
        `INSERT INTO newsletter_picks (article_id, sort_order) VALUES ${values}`,
        cleaned
      );
    }
    await client.query('COMMIT');
    res.json({ count: cleaned.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update picks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /articles/search — picker source for the manual curation UI
router.get('/articles/search', async (req: AuthRequest, res: Response) => {
  const search = (req.query.search as string | undefined)?.trim();
  const limit = Math.min(parseInt(String(req.query.limit ?? '30'), 10) || 30, 100);

  let where = 'WHERE a.is_published = TRUE';
  const params: any[] = [];
  let idx = 1;
  if (search) {
    where += ` AND a.title ILIKE $${idx++}`;
    params.push(`%${search}%`);
  }

  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.slug, a.image_url, a.published_at,
              c.name AS category_name
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         ${where}
        ORDER BY a.published_at DESC NULLS LAST, a.id DESC
        LIMIT $${idx}`,
      [...params, limit]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Article search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
