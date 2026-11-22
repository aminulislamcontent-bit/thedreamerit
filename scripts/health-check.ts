/** Local health probe using the same snapshot and scheduler state as /api/health. */
import { healthSnapshot } from '../src/lib/server/monitoring';
import { schedulerStatus } from '../src/lib/server/jobs';

(async () => {
  const [snap, sched] = await Promise.all([await healthSnapshot(), await schedulerStatus()]);
  const snapshot = { ...snap, scheduler: sched };
  console.log(JSON.stringify(snapshot, null, 2));
  if (snapshot.status !== 'ok') process.exitCode = 1;
})().catch((err) => { console.error(err); process.exit(1); });
