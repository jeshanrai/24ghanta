/**
 * Newsletter scheduler.
 *
 * Reads email_settings and arms a single node-cron task that fires at the
 * configured weekday + hour (Asia/Kathmandu). Idempotent — call
 * `applyEmailSettings()` after any settings mutation to reschedule.
 */

import cron, { type ScheduledTask } from 'node-cron';
import { getEmailSettings, sendDigest } from './newsletter';

let activeTask: ScheduledTask | null = null;
let currentSpec: string | null = null;

function buildCronExpression(dayOfWeek: number, hour: number): string {
  // minute hour dayOfMonth month dayOfWeek
  return `0 ${hour} * * ${dayOfWeek}`;
}

export async function applyEmailSettings(): Promise<void> {
  const settings = await getEmailSettings();

  if (!settings.weekly_digest_enabled) {
    if (activeTask) {
      activeTask.stop();
      activeTask = null;
      currentSpec = null;
      console.log('[newsletter] Weekly digest disabled — scheduler stopped.');
    }
    return;
  }

  const spec = buildCronExpression(settings.weekly_digest_day_of_week, settings.weekly_digest_hour);

  // No-op if nothing changed.
  if (activeTask && currentSpec === spec) return;

  if (activeTask) {
    activeTask.stop();
    activeTask = null;
  }

  if (!cron.validate(spec)) {
    console.error(`[newsletter] Invalid cron expression "${spec}" — scheduler not started.`);
    return;
  }

  activeTask = cron.schedule(
    spec,
    async () => {
      console.log('[newsletter] Cron fired — building weekly digest.');
      try {
        const result = await sendDigest();
        if (result.reason) {
          console.log(`[newsletter] Skipped: ${result.reason}`);
        } else {
          console.log(
            `[newsletter] Digest sent: ${result.sent}/${result.total} recipients, ${result.articles} articles.`
          );
        }
      } catch (err) {
        console.error('[newsletter] Send failed:', (err as Error).message);
      }
    },
    { timezone: 'Asia/Kathmandu' }
  );

  currentSpec = spec;
  console.log(
    `[newsletter] Scheduler armed — cron "${spec}" Asia/Kathmandu (day ${settings.weekly_digest_day_of_week}, hour ${settings.weekly_digest_hour}).`
  );
}

export function describeSchedule(dayOfWeek: number, hour: number, enabled: boolean): string {
  if (!enabled) return 'Disabled';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hh = hour.toString().padStart(2, '0');
  return `${days[dayOfWeek]} ${hh}:00 NPT`;
}
