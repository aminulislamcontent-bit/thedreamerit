/** One maintenance-job tick; suitable for cron/systemd or manual verification. */
import { runDueJobs, schedulerStatus } from '../src/lib/server/jobs';

const result = runDueJobs();
console.log(JSON.stringify({ result, status: schedulerStatus() }, null, 2));
if (result.failed.length) process.exitCode = 1;
