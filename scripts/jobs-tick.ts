/** One maintenance-job tick; suitable for cron/systemd or manual verification. */
import { runDueJobs } from '../src/lib/server/jobs';

(async () => {
  const result = await runDueJobs();
  console.log(JSON.stringify({ result }, null, 2));
  if (result.failed.length) process.exitCode = 1;
})().catch((err) => { console.error(err); process.exit(1); });
