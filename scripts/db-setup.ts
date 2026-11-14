/** Apply migrations and seed baseline configuration. Safe to run repeatedly. */
import { initializeDatabase } from '../src/lib/server/database';

const result = initializeDatabase();
const count = (sql: string) => Number((result.db.prepare(sql).get() as { n: number }).n);
console.log('Database ready.');
console.log('  migrations applied:', result.migrationsApplied.length ? result.migrationsApplied.join(', ') : 'none');
console.log('  baseline seeded   :', result.seeded);
console.log('  categories        :', count('SELECT COUNT(*) AS n FROM categories'));
console.log('  products          :', count('SELECT COUNT(*) AS n FROM products'));
console.log('  live published    :', count("SELECT COUNT(*) AS n FROM products WHERE status = 'published' AND is_demo = 0"));
console.log('  users             :', count('SELECT COUNT(*) AS n FROM users'));
if (result.seeded) {
  console.log('\nBootstrap admin credentials: data/bootstrap-credentials.txt (or BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD env vars).');
  console.log('No real products, prices, stock levels or reviews were created.');
}
