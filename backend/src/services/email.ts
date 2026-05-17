/**
 * Email delivery service — thin wrapper around nodemailer.
 *
 * Configuration (all optional — if SMTP_HOST is absent the service logs a
 * warning and silently no-ops every send call, so the app boots and runs
 * without email configured):
 *
 *   SMTP_HOST            — e.g. smtp.gmail.com
 *   SMTP_PORT            — default 587 (STARTTLS); use 465 for implicit TLS
 *   SMTP_USER            — SMTP login username
 *   SMTP_PASS            — SMTP login password / app-password
 *   SMTP_FROM_EMAIL      — From: address; falls back to SMTP_USER
 *   SMTP_FROM_NAME       — Display name; defaults to "24 Ghanta Nepal"
 *
 * The From: address MUST be a domain you own with valid SPF/DKIM records, or
 * Gmail/Outlook will silently drop the message or route it to spam.
 */

import nodemailer, { Transporter } from 'nodemailer';

let _transport: Transporter | null = null;
let _warned = false;

function getTransport(): Transporter | null {
  if (_transport) return _transport;

  const host = process.env.SMTP_HOST;
  if (!host) {
    if (!_warned) {
      console.warn(
        '[email] SMTP_HOST is not configured — email delivery is disabled. ' +
        'Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM_EMAIL to enable.'
      );
      _warned = true;
    }
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  _transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transport;
}

function getFromAddress(): string {
  const name = process.env.SMTP_FROM_NAME || '24 Ghanta Nepal';
  const email =
    process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@24ghanta.com';
  return `"${name}" <${email}>`;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a single email. Returns true on success, false otherwise. Errors are
 * logged but never thrown — callers don't have to handle them specially.
 */
export async function sendMail(opts: MailOptions): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;

  const toStr = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;
  const fromStr = getFromAddress();

  try {
    const info = await transport.sendMail({
      from: fromStr,
      to: toStr,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(
      `[email] send to=${toStr} from=${fromStr} | ` +
      `accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} ` +
      `messageId=${info.messageId}`
    );
    if (info.rejected && info.rejected.length > 0) {
      console.warn('[email] Some recipients rejected by relay:', info.rejected);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send to ${toStr}:`, (err as Error).message);
    return false;
  }
}

/**
 * Send the same message to a list of recipients, batched. All addresses in a
 * batch are placed in the BCC field so they don't see each other.
 *
 * Use only for messages where every recipient gets the *exact* same body. For
 * personalised content (e.g. per-recipient unsubscribe links), use
 * `sendPersonalizedBulkMail` instead.
 */
export async function sendBulkMail(
  recipients: string[],
  subject: string,
  html: string,
  text?: string,
  batchSize = 50
): Promise<{ sent: number; failed: number }> {
  const transport = getTransport();
  if (!transport) return { sent: 0, failed: recipients.length };

  const fromStr = getFromAddress();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    try {
      // BCC so addresses don't leak to other recipients.
      const info = await transport.sendMail({
        from: fromStr,
        bcc: batch,
        subject,
        html,
        text,
      });
      if (info.rejected && info.rejected.length > 0) {
        failed += info.rejected.length;
        sent += batch.length - info.rejected.length;
      } else {
        sent += batch.length;
      }
    } catch (err) {
      console.error(`[email] Bulk batch failed (${batch.length} recipients):`, (err as Error).message);
      failed += batch.length;
    }
    // Small pause between batches to be polite to the relay.
    if (i + batchSize < recipients.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { sent, failed };
}

export interface PersonalizedRecipient {
  email: string;
  /** Opaque caller-supplied marker (typically subscriber id) — used for logging on failure. */
  ref?: string | number;
  html: string;
  text?: string;
}

/**
 * Send one personalised message per recipient — required when each message has
 * unique content (e.g. a personalised unsubscribe link). Uses the same batching
 * + inter-batch throttle as `sendBulkMail`.
 *
 * Within a batch, messages are sent sequentially (not in parallel) — Gmail SMTP
 * rejects fast-fire bursts as suspected spam. Realistic ceiling on consumer
 * relays is ~5–10 msgs/sec.
 *
 * Returns { sent, failed, failedRefs } so callers can persist suppression
 * info (e.g. mark hard-bounced rows inactive).
 */
export async function sendPersonalizedBulkMail(
  recipients: PersonalizedRecipient[],
  subject: string,
  batchSize = 50
): Promise<{ sent: number; failed: number; failedRefs: (string | number)[] }> {
  let sent = 0;
  let failed = 0;
  const failedRefs: (string | number)[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    for (const r of batch) {
      const ok = await sendMail({
        to: r.email,
        subject,
        html: r.html,
        text: r.text,
      });
      if (ok) sent++;
      else {
        failed++;
        failedRefs.push(r.ref ?? r.email);
      }
    }
    if (i + batchSize < recipients.length) {
      await new Promise((res) => setTimeout(res, 300));
    }
  }

  return { sent, failed, failedRefs };
}
