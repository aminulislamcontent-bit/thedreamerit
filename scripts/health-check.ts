/** Local health probe using the same snapshot and scheduler state as /api/health. */
import { healthSnapshot } from '../src/lib/server/monitoring';
import { schedulerStatus } from '../src/lib/server/jobs';

const snapshot = { ...healthSnapshot(), scheduler: schedulerStatus() };
console.log(JSON.stringify(snapshot, null, 2));
if (snapshot.status !== 'ok') process.exitCode = 1;
