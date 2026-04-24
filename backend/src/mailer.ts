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

interface ArticlePayload {
  title: string;
  slug: string;
  excerpt?: string;
  image_url?: string;
  category_name?: string;
  author_name?: string;
}

/**
 * Builds a clean, responsive HTML email for the newsletter.
 */
function buildNewsletterHtml(article: ArticlePayload): string {
  const articleUrl = `${SITE_URL}/article/${article.slug}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
              📰 24 Ghanta Nepal
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Breaking News Alert</p>
          </td>
        </tr>
        <!-- Image -->
        ${article.image_url ? `
        <tr>
          <td style="padding:0;">
            <img src="${article.image_url}" alt="${article.title}" style="width:100%;height:auto;display:block;max-height:300px;object-fit:cover;" />
          </td>
        </tr>` : ''}
        <!-- Content -->
        <tr>
          <td style="padding:28px 32px;">
            ${article.category_name ? `<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">${article.category_name}</span>` : ''}
            <h2 style="margin:12px 0 8px;font-size:20px;font-weight:700;color:#111;line-height:1.35;">
              ${article.title}
            </h2>
            ${article.excerpt ? `<p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">${article.excerpt}</p>` : ''}
            ${article.author_name ? `<p style="margin:0 0 16px;font-size:12px;color:#888;">By <strong style="color:#333;">${article.author_name}</strong></p>` : ''}
            <a href="${articleUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
              Read Full Article →
            </a>
          </td>
        </tr>
        <!-- Footer -->
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
 * Runs in the background — caller does NOT need to await this.
 */
export async function notifySubscribers(article: ArticlePayload): Promise<void> {
  try {
    const { rows } = await pool.query(
      'SELECT email FROM newsletter_subscribers WHERE is_active = TRUE'
    );
    if (rows.length === 0) {
      console.log('📭 No active subscribers to notify.');
      return;
    }

    const emails = rows.map((r) => r.email);
    const html = buildNewsletterHtml(article);
    const subject = `📰 ${article.title} — 24 Ghanta Nepal`;

    const smtp = getTransporter();
    if (!smtp) {
      // Graceful dev fallback
      console.log('──────────────────────────────────────────');
      console.log(`📧 [DEV] Would email ${emails.length} subscriber(s):`);
      console.log(`   Subject: ${subject}`);
      console.log(`   To: ${emails.join(', ')}`);
      console.log('──────────────────────────────────────────');
      return;
    }

    // Send in batches of 50 (BCC) to avoid provider limits
    const BATCH = 50;
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH);
      await smtp.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        bcc: batch,
        subject,
        html,
      });
      console.log(`✉️  Sent newsletter batch ${Math.floor(i / BATCH) + 1} (${batch.length} recipients)`);
    }

    console.log(`✅ Newsletter sent to ${emails.length} subscriber(s) for: ${article.title}`);
  } catch (err) {
    // Never crash the publish flow because of email
    console.error('❌ Newsletter send error:', err);
  }
}
