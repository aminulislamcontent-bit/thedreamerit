/** Internal link integrity + SEO metadata checks. */
import { openDatabase } from '../src/lib/server/database';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/app.db');
if (!fs.existsSync(dbPath)) { console.error('Database not found. Run npm run db:setup first.'); process.exit(1); }
const d = openDatabase(dbPath);
const products = d.prepare('SELECT slug FROM products').all() as Array<{ slug: string }>;
const categories = d.prepare('SELECT slug FROM categories').all() as Array<{ slug: string }>;
const known = new Set<string>(['/', '/products', '/categories', '/compare', '/search', '/about', '/contact', '/faq', '/guides', '/blog']);
products.forEach((p) => known.add(`/products/${p.slug}`));
categories.forEach((c) => known.add(`/categories/${c.slug}`));
const refs = d.prepare('SELECT canonical_path FROM product_seo').all() as Array<{ canonical_path: string }>;
const broken = refs.filter((r) => r.canonical_path && !known.has(r.canonical_path));
console.log(`Checked ${refs.length} canonical paths; ${broken.length} unresolved internal links.`);
broken.forEach((b) => console.log('  BROKEN:', b.canonical_path));
d.close();
process.exitCode = broken.length ? 1 : 0;
