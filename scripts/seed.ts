/** Idempotent seed entry point. */
import { initializeDatabase } from '../src/lib/server/database';

(async () => {
  const { seeded } = await initializeDatabase();
  console.log(seeded ? 'Baseline configuration seeded.' : 'Baseline configuration already present; nothing changed.');
})().catch((err) => { console.error(err); process.exit(1); });
