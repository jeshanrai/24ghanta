/**
 * Newsletter digest + per-article alert service.
 *
 * Two send paths:
 *   - sendDigest()          weekly roundup (cron-driven or admin-triggered)
 *   - sendArticleAlert()    one-off blast when an article is published
 *
 * Both use personalised one-click unsubscribe links and the shared batched
 * SMTP sender so bursts stay within consumer-relay limits.
 */

import crypto from 'crypto';
import pool from '../db';
import { sendMail, sendPersonalizedBulkMail } from './email';

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface EmailSettings {
  id: 1;
  weekly_digest_enabled: boolean;
  weekly_digest_day_of_week: number; // 0–6, Sunday=0
  weekly_digest_hour: number;        // 0–23 in Asia/Kathmandu
  digest_curation_mode: 'auto' | 'manual';
  weekly_digest_last_sent_at: string | null;
  weekly_digest_last_sent_count: number;
  updated_at: string;
}

export interface DigestArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  category_name: string | null;
  author_name: string | null;
  published_at: string | null;
}

interface Recipient {
  id: number;
  email: string;
  unsubscribe_token: string;
}

/* ─── Configuration ─────────────────────────────────────────────────── */

/**
 * Hard cap on what a single digest is allowed to carry. Picked low because
 * emails longer than ~5 cards tank click-through rates — Substack, Beehiiv
 * and major newsletter platforms cap weekly digests around this size for
 * the same reason. Manual picks obey the same cap via LIMIT.
 */
const MAX_ARTICLES_PER_DIGEST = 5;
const AUTO_DIGEST_WINDOW_DAYS = 7;

export async function getEmailSettings(): Promise<EmailSettings> {
  const { rows } = await pool.query<EmailSettings>(
    'SELECT * FROM email_settings WHERE id = 1'
  );
  if (rows.length > 0) return rows[0];
  return {
    id: 1,
    weekly_digest_enabled: false,
    weekly_digest_day_of_week: 1,
    weekly_digest_hour: 6,
    digest_curation_mode: 'auto',
    weekly_digest_last_sent_at: null,
    weekly_digest_last_sent_count: 0,
    updated_at: new Date().toISOString(),
  };
}

/* ─── Article fetching ──────────────────────────────────────────────── */

const ARTICLE_SELECT = `
  SELECT a.id, a.title, a.slug, a.excerpt, a.image_url, a.published_at,
         c.name AS category_name, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN authors au   ON au.id = a.author_id`;

export async function getDigestArticles(): Promise<DigestArticle[]> {
  const settings = await getEmailSettings();

  if (settings.digest_curation_mode === 'manual') {
    const { rows } = await pool.query<DigestArticle>(
      `${ARTICLE_SELECT}
        JOIN newsletter_picks p ON p.article_id = a.id
       WHERE a.is_published = TRUE
       ORDER BY p.sort_order ASC, p.added_at ASC
       LIMIT $1`,
      [MAX_ARTICLES_PER_DIGEST]
    );
    return rows;
  }

  // Auto mode picks the *highlights* of the week, not every article published.
  // Ordering:
  //   1. featured stories first (admin-flagged "this matters most")
  //   2. then breaking news
  //   3. then most-viewed (best signal of reader interest when nothing is flagged)
  //   4. finally newest
  // This stops the digest from devolving into a dump when the desk publishes
  // 30+ items in a week.
  const { rows } = await pool.query<DigestArticle>(
    `${ARTICLE_SELECT}
      WHERE a.is_published = TRUE
        AND a.published_at >= NOW() - INTERVAL '${AUTO_DIGEST_WINDOW_DAYS} days'
      ORDER BY a.is_featured DESC,
               a.is_breaking DESC,
               a.views DESC NULLS LAST,
               a.published_at DESC NULLS LAST,
               a.id DESC
      LIMIT $1`,
    [MAX_ARTICLES_PER_DIGEST]
  );
  return rows;
}

/* ─── HTML rendering ────────────────────────────────────────────────── */

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function frontendBase(): string {
  const raw = (process.env.FRONTEND_URL || '').split(',')[0].trim();
  return raw.replace(/\/+$/, '') || 'http://localhost:3000';
}

function backendBase(): string {
  const raw = (process.env.BACKEND_URL || '').trim();
  if (raw) return raw.replace(/\/+$/, '');
  // Fallback: assemble from PORT. The frontend origin is the WRONG fallback
  // here — clicking an unsubscribe link sent there hits Next.js, which 404s
  // because /api/newsletter/* lives on the Express backend, not the frontend.
  // For prod, ALWAYS set BACKEND_URL to the public Render URL.
  const port = process.env.PORT || '5000';
  return `http://localhost:${port}`;
}

function absolutize(url: string | null | undefined, base: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return `${base}${url}`;
  return url;
}

function articleUrl(slug: string): string {
  return `${frontendBase()}/article/${encodeURIComponent(slug)}`;
}

/**
 * Logo block used in every email header. Linked to the homepage.
 *
 * Hard rules for email-client compatibility (Gmail in particular):
 *   - Use a plain static path, NEVER Next.js `/_next/image?url=…` — Gmail's
 *     image proxy refuses query-string image URLs.
 *   - URL must be fully absolute and publicly reachable; Gmail fetches via
 *     ggpht.com proxy and will silently drop localhost / private hosts.
 *   - Spaces in filenames MUST be percent-encoded.
 *   - Set width + height attributes (Outlook 2019 ignores CSS sizing).
 *
 * Override with `EMAIL_LOGO_URL` env if you want to host the logo on a CDN
 * (recommended for production — image proxies cache better than first-party).
 */
function logoBlock(): string {
  const base = frontendBase();
  // Filename has spaces → encode each path segment; do NOT touch the origin.
  const defaultLogo = `${base}/${encodeURIComponent('24 GHANTA BLACK.png')}`;
  const logoUrl = process.env.EMAIL_LOGO_URL || defaultLogo;
  return `<a href="${base}" style="display:inline-block;text-decoration:none;" target="_blank" rel="noopener">
    <img src="${esc(logoUrl)}" alt="24 Ghanta" width="160" height="45" style="display:inline-block;width:160px;height:45px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
  </a>`;
}

/** Build a digest HTML email (weekly roundup). */
export function renderDigestHtml(opts: {
  articles: DigestArticle[];
  unsubscribeUrl: string;
  previewBanner?: string;
}): { html: string; text: string } {
  const base = frontendBase();
  const mediaBase = backendBase();
  const { articles, unsubscribeUrl, previewBanner } = opts;

  // Plaintext fallback — keeps spam scores down.
  const textLines = ['24 Ghanta Nepal — Weekly Digest', '', "Here's what's been happening this week:", ''];
  for (const a of articles) {
    textLines.push(`• ${a.title}`);
    if (a.excerpt) textLines.push(`  ${a.excerpt}`);
    textLines.push(`  Read: ${articleUrl(a.slug)}`);
    textLines.push('');
  }
  textLines.push(`Unsubscribe: ${unsubscribeUrl}`);
  textLines.push('24 Ghanta Nepal');
  const text = textLines.join('\n');

  const cards = articles
    .map((a) => {
      const link = articleUrl(a.slug);
      const heroUrl = absolutize(a.image_url, mediaBase);
      const hero = heroUrl
        ? `<img src="${esc(heroUrl)}" alt="${esc(a.title)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:8px;margin-bottom:12px;border:0;">`
        : '';
      return `
        <tr><td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
          ${hero}
          ${a.category_name ? `<div style="font-size:11px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${esc(a.category_name)}</div>` : ''}
          <a href="${link}" style="text-decoration:none;color:#111827;">
            <div style="font-size:30px;font-weight:700;line-height:1.35;margin-bottom:8px;">${esc(a.title)}</div>
          </a>
          ${a.excerpt ? `<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 12px;">${esc(a.excerpt)}</p>` : ''}
          <a href="${link}" style="font-size:13px;font-weight:600;color:#dc2626;text-decoration:none;">Read article →</a>
        </td></tr>`;
    })
    .join('');

  const banner = previewBanner
    ? `<div style="background:#fef3c7;border:1px solid #f59e0b;color:#92400e;padding:12px 16px;font-size:13px;border-radius:6px;margin-bottom:16px;">⚠ ${esc(previewBanner)}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>24 Ghanta Nepal — Weekly Digest</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;padding:32px 24px;">
      <tr><td>
        ${banner}
        <div style="text-align:center;margin-bottom:24px;">
          ${logoBlock()}
          <div style="font-size:13px;color:#6b7280;margin-top:8px;">Weekly Digest</div>
        </div>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 8px;">Here are the top stories from 24 Ghanta Nepal this week.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${cards || `<tr><td style="padding:32px 0;text-align:center;color:#9ca3af;">No new stories this week.</td></tr>`}
        </table>
        <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <a href="${base}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Visit 24 Ghanta Nepal</a>
        </div>
        <div style="margin-top:32px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.6;">
          <p style="margin:0 0 4px;">You're receiving this because you subscribed at 24ghanta.com.</p>
          <p style="margin:0;">
            <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            &nbsp;·&nbsp;
            <a href="${base}" style="color:#9ca3af;text-decoration:underline;">Visit site</a>
          </p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  return { html, text };
}

/** Single-article alert email used by the "send to subscribers" toggle on publish. */
export function renderArticleAlertHtml(opts: {
  article: DigestArticle;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const base = frontendBase();
  const mediaBase = backendBase();
  const { article: a, unsubscribeUrl } = opts;
  const link = articleUrl(a.slug);
  const heroUrl = absolutize(a.image_url, mediaBase);

  const text = [
    `24 Ghanta Nepal: ${a.title}`,
    '',
    a.excerpt || '',
    '',
    `Read: ${link}`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(a.title)}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:24px 24px 0;text-align:center;">
        ${logoBlock()}
      </td></tr>
      ${heroUrl ? `<tr><td style="padding:20px 24px 0;"><img src="${esc(heroUrl)}" alt="${esc(a.title)}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border-radius:8px;border:0;"></td></tr>` : ''}
      <tr><td style="padding:20px 24px 8px;">
        ${a.category_name ? `<div style="font-size:11px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${esc(a.category_name)}</div>` : ''}
        <a href="${link}" style="text-decoration:none;color:#111827;">
          <h1 style="margin:0 0 12px;font-size:30px;font-weight:700;line-height:1.3;">${esc(a.title)}</h1>
        </a>
        ${a.excerpt ? `<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 20px;">${esc(a.excerpt)}</p>` : ''}
        <a href="${link}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:11px 22px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Read full article</a>
        ${a.author_name ? `<p style="margin:18px 0 0;font-size:12px;color:#9ca3af;">By ${esc(a.author_name)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:24px;margin-top:16px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb;">
        <p style="margin:0;">
          <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="${base}" style="color:#9ca3af;text-decoration:underline;">Visit site</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  return { html, text };
}

/* ─── Recipient resolution ─────────────────────────────────────────── */

async function getActiveRecipients(): Promise<Recipient[]> {
  const { rows } = await pool.query<Recipient>(
    `SELECT id, email, unsubscribe_token
       FROM newsletter_subscribers
      WHERE is_active = TRUE
        AND email IS NOT NULL
        AND unsubscribe_token IS NOT NULL`
  );
  return rows;
}

/**
 * Ensures every active subscriber has an unsubscribe_token, generating one
 * for any legacy rows that pre-date the column. Cheap to call before a send.
 */
async function backfillTokens(): Promise<void> {
  const { rows } = await pool.query<{ id: number }>(
    `SELECT id FROM newsletter_subscribers
      WHERE is_active = TRUE AND (unsubscribe_token IS NULL OR unsubscribe_token = '')`
  );
  for (const r of rows) {
    const token = newUnsubscribeToken();
    await pool.query(
      'UPDATE newsletter_subscribers SET unsubscribe_token = $1 WHERE id = $2',
      [token, r.id]
    );
  }
}

export function newUnsubscribeToken(): string {
  return 'u_' + crypto.randomBytes(24).toString('base64url');
}

export function unsubscribeUrlFor(token: string): string {
  return `${backendBase()}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/* ─── Send: digest ─────────────────────────────────────────────────── */

export interface SendDigestResult {
  sent: number;
  failed: number;
  total: number;
  articles: number;
  reason?: string;
}

export interface SendDigestOptions {
  /** Send only to these addresses (test/preview); placeholder unsubscribe URL. */
  testRecipients?: string[];
  previewBanner?: string;
}

function buildDigestSubject(): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  });
  return `24 Ghanta Nepal Weekly Digest — ${fmt.format(new Date())}`;
}

export async function sendDigest(opts: SendDigestOptions = {}): Promise<SendDigestResult> {
  const articles = await getDigestArticles();
  if (articles.length === 0) {
    return {
      sent: 0,
      failed: 0,
      total: 0,
      articles: 0,
      reason: 'No articles available for the digest window — nothing was sent.',
    };
  }

  const subject = buildDigestSubject();

  // Test path
  if (opts.testRecipients && opts.testRecipients.length > 0) {
    const previewUnsub = `${frontendBase()}/?preview=unsubscribe`;
    const { html, text } = renderDigestHtml({
      articles,
      unsubscribeUrl: previewUnsub,
      previewBanner: opts.previewBanner ?? 'PREVIEW — this is a test send, not a live broadcast.',
    });
    let sent = 0;
    let failed = 0;
    for (const addr of opts.testRecipients) {
      const ok = await sendMail({ to: addr, subject: `[Preview] ${subject}`, html, text });
      ok ? sent++ : failed++;
    }
    return { sent, failed, total: opts.testRecipients.length, articles: articles.length };
  }

  // Live path
  await backfillTokens();
  const recipients = await getActiveRecipients();
  if (recipients.length === 0) {
    return {
      sent: 0,
      failed: 0,
      total: 0,
      articles: articles.length,
      reason: 'No active subscribers — nothing was sent.',
    };
  }

  const personalized = recipients.map((r) => {
    const { html, text } = renderDigestHtml({
      articles,
      unsubscribeUrl: unsubscribeUrlFor(r.unsubscribe_token),
    });
    return { email: r.email, ref: r.id, html, text };
  });

  const { sent, failed } = await sendPersonalizedBulkMail(personalized, subject);

  // Audit columns updated even on partial failure to avoid double-sends after relay outages.
  await pool.query(
    `UPDATE email_settings
        SET weekly_digest_last_sent_at = NOW(),
            weekly_digest_last_sent_count = $1,
            updated_at = NOW()
      WHERE id = 1`,
    [sent]
  );
  await pool.query(
    'UPDATE newsletter_subscribers SET last_emailed_at = NOW() WHERE id = ANY($1::int[])',
    [recipients.map((r) => r.id)]
  );

  // Manual picks are single-use — clear them so the next cycle starts fresh.
  const settings = await getEmailSettings();
  if (settings.digest_curation_mode === 'manual') {
    await pool.query('DELETE FROM newsletter_picks');
  }

  return { sent, failed, total: recipients.length, articles: articles.length };
}

/* ─── Send: single-article alert ────────────────────────────────────── */

export interface SendAlertResult {
  sent: number;
  failed: number;
  total: number;
}

/**
 * One-off blast for a freshly-published article. Loads the full article from
 * the DB (rather than trusting the caller's payload), so the email reflects
 * what's actually stored. Fire-and-forget compatible — never throws.
 */
export async function sendArticleAlert(articleId: number): Promise<SendAlertResult> {
  const { rows } = await pool.query<DigestArticle>(
    `${ARTICLE_SELECT} WHERE a.id = $1 AND a.is_published = TRUE LIMIT 1`,
    [articleId]
  );
  if (rows.length === 0) {
    console.warn(`[newsletter] sendArticleAlert skipped — article ${articleId} not found or unpublished.`);
    return { sent: 0, failed: 0, total: 0 };
  }
  const article = rows[0];

  await backfillTokens();
  const recipients = await getActiveRecipients();
  if (recipients.length === 0) {
    console.log(`[newsletter] sendArticleAlert: no active subscribers for article ${articleId}.`);
    return { sent: 0, failed: 0, total: 0 };
  }

  const subject = `📰 ${article.title} — 24 Ghanta Nepal`;
  const personalized = recipients.map((r) => {
    const { html, text } = renderArticleAlertHtml({
      article,
      unsubscribeUrl: unsubscribeUrlFor(r.unsubscribe_token),
    });
    return { email: r.email, ref: r.id, html, text };
  });

  const { sent, failed } = await sendPersonalizedBulkMail(personalized, subject);

  await pool.query(
    'UPDATE newsletter_subscribers SET last_emailed_at = NOW() WHERE id = ANY($1::int[])',
    [recipients.map((r) => r.id)]
  );

  console.log(`[newsletter] Article alert ${articleId}: sent=${sent} failed=${failed} total=${recipients.length}`);
  return { sent, failed, total: recipients.length };
}
