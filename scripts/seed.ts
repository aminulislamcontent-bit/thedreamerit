/** Idempotent seed entry point. */
import { initializeDatabase } from '../src/lib/server/database';
const { seeded } = initializeDatabase();
console.log(seeded ? 'Baseline configuration seeded.' : 'Baseline configuration already present; nothing changed.');
