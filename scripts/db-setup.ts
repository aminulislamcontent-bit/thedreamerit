/** Apply migrations and seed baseline configuration. Safe to run repeatedly. */
import { initializeDatabase } from '../src/lib/server/database';

(async () => {
  const result = await initializeDatabase();
  console.log('Database ready.');
  console.log('  driver            :', result.driver);
  console.log('  migrations applied:', result.migrationsApplied.length ? result.migrationsApplied.join(', ') : 'none');
  console.log('  baseline seeded   :', result.seeded);
  if (result.seeded) {
    console.log('\nBootstrap admin credentials: data/bootstrap-credentials.txt (or BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD env vars).');
    console.log('No real products, prices, stock levels or reviews were created.');
  }
})().catch((err) => { console.error(err); process.exit(1); });
