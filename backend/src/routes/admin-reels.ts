import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

const PLATFORMS = ['tiktok', 'instagram', 'facebook', 'youtube'] as const;
type Platform = (typeof PLATFORMS)[number];

function isValidPlatform(p: unknown): p is Platform {
  return typeof p === 'string' && (PLATFORMS as readonly string[]).includes(p);
}

function isValidUrl(u: unknown): u is string {
  if (typeof u !== 'string' || u.length === 0 || u.length > 2048) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Per-platform permalink shape. Instagram/Facebook profile/page URLs send
// back X-Frame-Options: deny, so the embed iframe lands on a Chrome error
// page and the real /embed/ URL can never load. We catch that *before*
// hitting the DB so admins can't save a URL that will silently break the
// homepage rail. Keep this list in sync with `validatePermalink` in
// `app/admin/reels/page.tsx`.
function validatePermalink(platform: Platform, rawUrl: string): { ok: true } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'URL is not valid' };
  }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  switch (platform) {
    case 'tiktok': {
      // Accept full post URLs (/@user/video/<id>) and short links (vm./vt.tiktok.com).
      if (
        (/(^|\.)tiktok\.com$/.test(host) && /\/video\/\d+/.test(path)) ||
        /(^|\.)vm\.tiktok\.com$/.test(host) ||
        /(^|\.)vt\.tiktok\.com$/.test(host)
      ) return { ok: true };
      return {
        ok: false,
        reason: 'TikTok URL must be a post link (tiktok.com/@user/video/<id>) or a vm.tiktok.com / vt.tiktok.com short link.',
      };
    }
    case 'instagram': {
      // Only individual posts/reels can be iframed. Profile pages
      // (instagram.com/<handle>) return X-Frame-Options: deny.
      if (!/(^|\.)instagram\.com$/.test(host)) {
        return { ok: false, reason: 'Instagram URL must be on instagram.com.' };
      }
      if (/^\/(p|reel|tv)\/[^/]+\/?$/.test(path)) return { ok: true };
      return {
        ok: false,
        reason: 'Instagram URL must be a reel or post permalink (instagram.com/reel/<id>/ or instagram.com/p/<id>/). Profile pages cannot be embedded.',
      };
    }
    case 'facebook': {
      if (!/(^|\.)facebook\.com$/.test(host) && !/(^|\.)fb\.watch$/.test(host)) {
        return { ok: false, reason: 'Facebook URL must be on facebook.com or fb.watch.' };
      }
      // Page URLs (facebook.com/<page>) without a /videos|/reel|/posts
      // segment refuse to embed. fb.watch short links resolve server-side
      // to a video, so accept those wholesale.
      if (/(^|\.)fb\.watch$/.test(host)) return { ok: true };
      if (/\/(videos|reel|posts|watch)\b/.test(path)) return { ok: true };
      return {
        ok: false,
        reason: 'Facebook URL must point to a specific video, reel, or post (facebook.com/<page>/videos/<id>, /reel/<id>, or /posts/<id>). Page URLs cannot be embedded.',
      };
    }
    case 'youtube': {
      // Already extracted by extractYouTubeId on the frontend — accept any
      // youtube.com / youtu.be URL. Bad shapes fall through to the
      // homepage's id-extraction guard, which renders the fallback.
      if (/(^|\.)youtube\.com$/.test(host) || /(^|\.)youtu\.be$/.test(host) || /(^|\.)youtube-nocookie\.com$/.test(host)) {
        return { ok: true };
      }
      return { ok: false, reason: 'YouTube URL must be on youtube.com or youtu.be.' };
    }
  }
}

// GET /api/admin/reels — all reels (admin view, includes inactive)
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, platform, url, caption, sort_order, is_active, created_at, updated_at
       FROM reels
       ORDER BY sort_order ASC, id DESC`
    );
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

// POST /api/admin/reels — create
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { platform, url, caption, sort_order, is_active } = req.body ?? {};

    if (!isValidPlatform(platform)) {
      return res.status(400).json({ error: 'platform must be tiktok, instagram, facebook, or youtube' });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'url is required and must be a valid http(s) URL (max 2048 chars)' });
    }
    const permalink = validatePermalink(platform, url);
    if (!permalink.ok) {
      return res.status(400).json({ error: permalink.reason });
    }
    if (caption !== undefined && (typeof caption !== 'string' || caption.length > 500)) {
      return res.status(400).json({ error: 'caption must be a string up to 500 chars' });
    }

    let sortOrder = Number.isFinite(Number(sort_order)) ? Number(sort_order) : null;
    if (sortOrder === null) {
      const next = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM reels');
      sortOrder = next.rows[0].n;
    }

    const { rows } = await pool.query(
      `INSERT INTO reels (platform, url, caption, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, platform, url, caption, sort_order, is_active, created_at, updated_at`,
      [platform, url, caption ?? '', sortOrder, is_active !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create reel error:', err);
    res.status(500).json({ error: 'Failed to create reel' });
  }
});

// PATCH /api/admin/reels/:id — partial update
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

    const { platform, url, caption, sort_order, is_active } = req.body ?? {};
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    // If either platform or url is changing, validate them together
    // against the current row so the permalink shape always matches the
    // platform we'll end up storing.
    if (platform !== undefined || url !== undefined) {
      let effectivePlatform: Platform | null = null;
      let effectiveUrl: string | null = null;
      if (platform !== undefined) {
        if (!isValidPlatform(platform)) return res.status(400).json({ error: 'invalid platform' });
        effectivePlatform = platform;
      }
      if (url !== undefined) {
        if (!isValidUrl(url)) return res.status(400).json({ error: 'invalid url' });
        effectiveUrl = url;
      }
      if (effectivePlatform === null || effectiveUrl === null) {
        const existing = await pool.query('SELECT platform, url FROM reels WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'reel not found' });
        if (effectivePlatform === null) effectivePlatform = existing.rows[0].platform as Platform;
        if (effectiveUrl === null) effectiveUrl = existing.rows[0].url as string;
      }
      const permalink = validatePermalink(effectivePlatform, effectiveUrl);
      if (!permalink.ok) return res.status(400).json({ error: permalink.reason });

      if (platform !== undefined) {
        fields.push(`platform = $${idx++}`); values.push(platform);
      }
      if (url !== undefined) {
        fields.push(`url = $${idx++}`); values.push(url);
      }
    }
    if (caption !== undefined) {
      if (typeof caption !== 'string' || caption.length > 500) {
        return res.status(400).json({ error: 'invalid caption' });
      }
      fields.push(`caption = $${idx++}`); values.push(caption);
    }
    if (sort_order !== undefined && Number.isFinite(Number(sort_order))) {
      fields.push(`sort_order = $${idx++}`); values.push(Number(sort_order));
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${idx++}`); values.push(Boolean(is_active));
    }

    if (fields.length === 0) return res.status(400).json({ error: 'no fields to update' });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE reels SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, platform, url, caption, sort_order, is_active, created_at, updated_at`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'reel not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update reel error:', err);
    res.status(500).json({ error: 'Failed to update reel' });
  }
});

// DELETE /api/admin/reels/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await pool.query('DELETE FROM reels WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'reel not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete reel' });
  }
});

export default router;
