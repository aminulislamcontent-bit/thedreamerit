/** Local health probe using the same snapshot as /api/health. */
import { healthSnapshot } from '../src/lib/server/monitoring';
const snapshot = healthSnapshot();
console.log(JSON.stringify(snapshot, null, 2));
if (snapshot.status !== 'ok') process.exitCode = 1;
