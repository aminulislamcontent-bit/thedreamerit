import fs from 'node:fs';
// We will write raw SQL that uses subqueries instead of captured IDs.
// The captured SQL has hardcoded id=1; we'll fix by replacing the second-pass INSERTs to use subqueries.
// Strategy: do not mock return IDs; just render a seed script.
import { PERMISSIONS, ROLES } from '../src/lib/core/permissions.ts';
import { CATEGORIES, BUSINESS, slugify } from '../src/lib/core/identity.ts';

const BRAND_NAMES = [
  'Lenovo', 'HP', 'Dell', 'ASUS', 'Acer', 'MSI', 'Gigabyte', 'Apple', 'Samsung',
  'Intel', 'AMD', 'NVIDIA', 'Corsair', 'Kingston', 'Western Digital', 'Seagate',
  'Logitech', 'Razer', 'Canon', 'Epson', 'TP-Link', 'Ubiquiti', 'APC', 'Synology',
];
const INTEGRATIONS: Array<[string, string]> = [
  ['Facebook Pages API', 'Requires an owner-authorized Page access token and app review.'],
  ['Instagram Graph API', 'Requires an owner-authorized professional account and token.'],
  ['YouTube Data API', 'Requires owner OAuth credentials for an authorized channel.'],
  ['WhatsApp Business Cloud API', 'Requires an owner-authorized business account and phone number.'],
  ['Payment gateway', 'Requires merchant credentials; no payment is simulated as verified.'],
  ['SMTP / email delivery', 'Requires an authorized mail transport.'],
  ['Google Search Console', 'Requires owner-verified property and service credentials.'],
  ['Google Analytics', 'Requires a measurement ID supplied by the owner.'],
  ['AI content provider', 'Optional. Without a key, drafts are produced locally from verified fields only.'],
  ['Off-site backup target', 'Requires owner-provided encrypted storage destination.'],
  ['Domain registrar / DNS', 'Domain availability and registration require an owner check and purchase.'],
  ['Authorized product data sources', 'Manufacturer documentation, authorized distributor feeds and licensed media are required before publication.'],
];
const ts = new Date().toISOString();
const adminEmail = 'admin@thedreamerit.local';
const password = 'DreamerIT!2026#TempPass';
// We'll use bcrypt? No, the existing hash function uses simple SHA-based. Instead of hashing, just skip password hashing (requires crypto) - import it.
const { hashPassword } = await import('../src/lib/core/password.ts');
const { hash, salt } = hashPassword(password);

let out = 'BEGIN;\n';
for (const slug of PERMISSIONS) {
  out += `INSERT INTO permissions (slug, description) VALUES ('${slug}', 'Allows: ${slug}') ON CONFLICT (slug) DO NOTHING;\n`;
}
for (const role of ROLES) {
  out += `INSERT INTO roles (slug, name, description, is_system) VALUES ('${role.slug}', '${role.name.replace(/'/g,"''")}', '${role.description.replace(/'/g,"''")}', TRUE) ON CONFLICT (slug) DO NOTHING;\n`;
  for (const perm of role.permissions) {
    out += `INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.slug='${role.slug}' AND p.slug='${perm}' ON CONFLICT DO NOTHING;\n`;
  }
}
out += `INSERT INTO users (email, name, password_hash, password_salt, status, created_at) VALUES ('${adminEmail}', 'Platform Super Admin', '${hash}', '${salt}', 'active', '${ts}') ON CONFLICT (email) DO NOTHING;\n`;
out += `INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email='${adminEmail}' AND r.slug='owner' ON CONFLICT DO NOTHING;\n`;
CATEGORIES.forEach((c, i) => {
  out += `INSERT INTO categories (slug, name_en, name_bn, group_name, spec_template, is_active, min_models, sort_order, description) VALUES ('${slugify(c.name)}', '${c.name.replace(/'/g,"''")}', '${(c.nameBn ?? '').replace(/'/g,"''")}', '${c.group.replace(/'/g,"''")}', '${c.template}', FALSE, 15, ${i+1}, 'Proposed retail taxonomy. Activating this category requires 15 distinct verified real models.') ON CONFLICT (slug) DO NOTHING;\n`;
});
for (const name of BRAND_NAMES) {
  out += `INSERT INTO brands (slug, name, verification_status) VALUES ('${slugify(name)}', '${name.replace(/'/g,"''")}', 'unverified') ON CONFLICT (slug) DO NOTHING;\n`;
}
const demoProducts: Array<[string, string, string, string]> = [
  ['DEMO ONLY — Placeholder business laptop (not a real model)', slugify('DEMO ONLY Placeholder business laptop'), 'DEMO-BL-001', 'Business laptops'],
  ['DEMO ONLY — Placeholder desktop PC (not a real model)', slugify('DEMO ONLY Placeholder desktop PC'), 'DEMO-DT-001', 'Desktop computers'],
  ['DEMO ONLY — Placeholder office monitor (not a real model)', slugify('DEMO ONLY Placeholder office monitor'), 'DEMO-MN-001', 'Office monitors'],
];
for (const [name, slug, sku, cat] of demoProducts) {
  out += `INSERT INTO products (slug, brand_id, category_id, model_name, sku, status, is_demo, verification_status, created_by, created_at, updated_at, overview) SELECT '${slug}', b.id, c.id, '${name.replace(/'/g,"''")}', '${sku}', 'draft', TRUE, 'unverified', u.id, '${ts}', '${ts}', 'DEMONSTRATION RECORD ONLY. Not a real product, not verified, unpublished, excluded from live catalogue.' FROM brands b, categories c, users u WHERE b.slug='lenovo' AND c.slug='${slugify(cat)}' AND u.email='${adminEmail}' ON CONFLICT (slug) DO NOTHING;\n`;
  out += `INSERT INTO product_seo (product_id, title, meta_description, canonical_path, indexable) SELECT p.id, '', '', '/products/${slug}', FALSE FROM products p WHERE p.slug='${slug}' ON CONFLICT (product_id) DO NOTHING;\n`;
}
out += `INSERT INTO branches (code, name, address, phone, is_active) VALUES ('ICT-104-105', 'ICT Bhaban — Shops 104 & 105', '${(BUSINESS.addressBn + ' / ' + BUSINESS.addressEn).replace(/'/g,"''")}', '${BUSINESS.phone.replace(/'/g,"''")}', TRUE) ON CONFLICT (code) DO NOTHING;\n`;
out += `INSERT INTO warehouses (branch_id, code, name, is_active) SELECT b.id, 'MAIN-104-105', 'Primary shop stock room', TRUE FROM branches b WHERE b.code='ICT-104-105' ON CONFLICT (code) DO NOTHING;\n`;
out += `INSERT INTO employees (user_id, employee_code, department, designation, branch_id, joined_at, status) SELECT u.id, 'DRM-001', 'Administration', 'Platform Super Admin', b.id, '${ts.slice(0,10)}', 'active' FROM users u, branches b WHERE u.email='${adminEmail}' AND b.code='ICT-104-105' ON CONFLICT (employee_code) DO NOTHING;\n`;
out += `INSERT INTO commission_rules (name, basis, rate_bps, flat_amount, min_margin_bps, applies_to_returns, active) VALUES ('Default margin share (template)', 'line_margin', 500, 0, 0, FALSE, TRUE) ON CONFLICT DO NOTHING;\n`;
out += `INSERT INTO shifts (name, starts_at, ends_at) SELECT 'Shop hours', '10:00', '20:00' WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name='Shop hours');\n`;
for (const [name, detail] of INTEGRATIONS) {
  out += `INSERT INTO integration_status (name, status, detail, last_checked_at) VALUES ('${name.replace(/'/g,"''")}', 'not_configured', '${detail.replace(/'/g,"''")}', '${ts}') ON CONFLICT (name) DO NOTHING;\n`;
}
for (const platform of ['facebook','instagram','youtube','whatsapp']) {
  out += `INSERT INTO social_channels (platform, status) VALUES ('${platform}', 'not_connected') ON CONFLICT (platform) DO NOTHING;\n`;
}
out += `INSERT INTO app_logs (level, message, context_json, created_at) VALUES ('info', 'Baseline configuration seeded. No live products, prices or stock were created.', '${JSON.stringify({categories: CATEGORIES.length}).replace(/'/g,"''")}', '${ts}');\n`;
out += 'COMMIT;\n';
fs.writeFileSync('/tmp/seed-pg.sql', out);
console.log('Seed SQL bytes:', out.length);
