/** Exports the catalogue (including verification state) to CSV for authorized review. */
import fs from 'node:fs';
import path from 'node:path';
import { openDatabase } from '../src/lib/server/database';

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/app.db');
const d = openDatabase(dbPath);
const rows = d.prepare(`SELECT p.sku, p.model_name, b.name AS brand, c.name_en AS category, c.is_active AS category_active,
  p.status, p.is_demo, p.verification_status, p.source_name, p.source_url, p.price_amount, p.price_verified,
  p.price_source_url, (SELECT COUNT(*) FROM product_specs s WHERE s.product_id = p.id AND s.verified = 1) AS verified_specs,
  (SELECT COUNT(*) FROM product_media m WHERE m.product_id = p.id AND m.review_status = 'approved') AS approved_media
  FROM products p JOIN brands b ON b.id = p.brand_id JOIN categories c ON c.id = p.category_id ORDER BY c.sort_order, p.sku`).all() as Array<Record<string, unknown>>;
const headers = Object.keys(rows[0] ?? { sku: '' });
const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
const out = path.join(process.cwd(), 'data', 'catalogue-export.csv');
fs.writeFileSync(out, csv);
console.log(`Exported ${rows.length} catalogue records to ${out}`);
d.close();
