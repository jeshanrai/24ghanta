import nodemailer from 'nodemailer';
import pool from './db';

/* ─── SMTP transporter (lazy-created) ────────────────────────── */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️  SMTP not configured — emails will be logged to console instead of sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/* ─── Public helpers ─────────────────────────────────────────── */

const FROM_NAME = process.env.SMTP_FROM_NAME || '24 Ghanta Nepal';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@24ghanta.com';
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// How many subscribers to fetch + BCC at a time. Keep this <= the SMTP
// provider's per-message recipient limit (Gmail 500, SES 50, SendGrid 1000).
const BATCH = 50;
// Safety stop in case of a runaway loop (e.g. id column corruption).
const MAX_ITERATIONS = 10_000;
// Tiny pause between batches to be polite to the SMTP server.
const INTER_BATCH_DELAY_MS = 200;

interface ArticlePayload {
  title: string;
  slug: string;
  excerpt?: string;
  image_url?: string;
  category_name?: string;
  author_name?: string;
}

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Builds a clean, responsive HTML email for the newsletter.
 * All article fields are HTML-escaped so a malicious title cannot inject markup.
 */
function buildNewsletterHtml(article: ArticlePayload): string {
  const title = escapeHtml(article.title || 'New article');
  const slug = encodeURIComponent(article.slug || '');
  const excerpt = article.excerpt ? escapeHtml(article.excerpt) : '';
  const imageUrl = article.image_url ? escapeHtml(article.image_url) : '';
  const categoryName = article.category_name ? escapeHtml(article.category_name) : '';
  const authorName = article.author_name ? escapeHtml(article.author_name) : '';
  const articleUrl = `${SITE_URL}/article/${slug}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">📰 24 Ghanta Nepal</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Breaking News Alert</p>
          </td>
        </tr>
        ${imageUrl ? `
        <tr><td style="padding:0;">
          <img src="${imageUrl}" alt="${title}" style="width:100%;height:auto;display:block;max-height:300px;object-fit:cover;" />
        </td></tr>` : ''}
        <tr>
          <td style="padding:28px 32px;">
            ${categoryName ? `<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">${categoryName}</span>` : ''}
            <h2 style="margin:12px 0 8px;font-size:20px;font-weight:700;color:#111;line-height:1.35;">${title}</h2>
            ${excerpt ? `<p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">${excerpt}</p>` : ''}
            ${authorName ? `<p style="margin:0 0 16px;font-size:12px;color:#888;">By <strong style="color:#333;">${authorName}</strong></p>` : ''}
            <a href="${articleUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
              Read Full Article →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#999;line-height:1.6;">
              You received this because you subscribed to 24 Ghanta Nepal.<br/>
              <a href="${SITE_URL}" style="color:#dc2626;text-decoration:none;">Visit Website</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}/unsubscribe" style="color:#999;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send newsletter email to all active subscribers about a newly published article.
 *
 * Streams subscribers in batches via keyset pagination (`id > lastId`) so the
 * full list is *never* held in Node memory. Memory footprint stays at one
 * BATCH-sized window regardless of total subscriber count.
 *
 * Resolves quietly on failure — never throws. Caller may use `.catch()` as a
 * safety net but it should normally not be needed.
 */
export async function notifySubscribers(article: ArticlePayload): Promise<void> {
  let html: string;
  let subject: string;
  try {
    html = buildNewsletterHtml(article);
    subject = `📰 ${article?.title ?? 'New article'} — 24 Ghanta Nepal`;
  } catch (err) {
    console.error('❌ Newsletter HTML build failed:', err);
    return;
  }

  const smtp = getTransporter();
  let lastId = 0;
  let totalSent = 0;
  let batchNum = 0;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let batch: { id: number; email: string }[];
    try {
      const { rows } = await pool.query<{ id: number; email: string }>(
        `SELECT id, email
           FROM newsletter_subscribers
          WHERE is_active = TRUE AND id > $1
          ORDER BY id ASC
          LIMIT $2`,
        [lastId, BATCH]
      );
      batch = rows;
    } catch (err) {
      console.error('❌ Newsletter subscriber fetch failed:', err);
      return;
    }

    if (batch.length === 0) break;
    lastId = batch[batch.length - 1].id;
    batchNum++;
    const emails = batch.map((r) => r.email);

    if (!smtp) {
      // Dev fallback — log instead of sending
      console.log(`📧 [DEV] Would email batch ${batchNum} (${emails.length} recipients): ${emails.join(', ')}`);
      totalSent += emails.length;
    } else {
      try {
        await smtp.sendMail({
          from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
          bcc: emails,
          subject,
          html,
        });
        totalSent += emails.length;
        console.log(`✉️  Sent newsletter batch ${batchNum} (${emails.length} recipients)`);
      } catch (err) {
        // One failed batch shouldn't abort the entire send.
        console.error(`❌ Newsletter batch ${batchNum} failed (${emails.length} recipients):`, err);
      }
      // Be polite to the SMTP server between batches
      if (batch.length === BATCH) await sleep(INTER_BATCH_DELAY_MS);
    }

    // If we got fewer than BATCH rows we're done (avoids a final empty query)
    if (batch.length < BATCH) break;
  }

  if (totalSent === 0) {
    console.log('📭 No active subscribers to notify.');
  } else {
    console.log(`✅ Newsletter complete: ${totalSent} subscriber(s) for: ${article.title}`);
  }
}
