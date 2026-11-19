require('tsx/cjs');
const { PERMISSIONS, ROLES } = require('../src/lib/core/permissions.ts');
const { CATEGORIES, BUSINESS, slugify } = require('../src/lib/core/identity.ts');
const { hashPassword } = require('../src/lib/core/password.ts');
const fs = require('node:fs');

function sqlStr(s) { return `'${String(s).replace(/'/g, "''")}'`; }

const BRAND_NAMES = ['Lenovo','HP','Dell','ASUS','Acer','MSI','Gigabyte','Apple','Samsung','Intel','AMD','NVIDIA','Corsair','Kingston','Western Digital','Seagate','Logitech','Razer','Canon','Epson','TP-Link','Ubiquiti','APC','Synology'];
const INTEGRATIONS = [
  ['Facebook Pages API','Requires an owner-authorized Page access token and app review.'],
  ['Instagram Graph API','Requires an owner-authorized professional account and token.'],
  ['YouTube Data API','Requires owner OAuth credentials for an authorized channel.'],
  ['WhatsApp Business Cloud API','Requires an owner-authorized business account and phone number.'],
  ['Payment gateway','Requires merchant credentials; no payment is simulated as verified.'],
  ['SMTP / email delivery','Requires an authorized mail transport.'],
  ['Google Search Console','Requires owner-verified property and service credentials.'],
  ['Google Analytics','Requires a measurement ID supplied by the owner.'],
  ['AI content provider','Optional. Without a key, drafts are produced locally from verified fields only.'],
  ['Off-site backup target','Requires owner-provided encrypted storage destination.'],
  ['Domain registrar / DNS','Domain availability and registration require an owner check and purchase.'],
  ['Authorized product data sources','Manufacturer documentation, authorized distributor feeds and licensed media are required before publication.'],
];
const ts = new Date().toISOString();
const adminEmail = 'admin@thedreamerit.local';
const password = 'DreamerIT!2026#TempPass';
const { hash, salt } = hashPassword(password);

let out = '';
for (const slug of PERMISSIONS) out += `INSERT INTO permissions (slug, description) VALUES (${sqlStr(slug)}, ${sqlStr('Allows: '+slug)}) ON CONFLICT (slug) DO NOTHING;\n`;
for (const role of ROLES) {
  out += `INSERT INTO roles (slug, name, description, is_system) VALUES (${sqlStr(role.slug)}, ${sqlStr(role.name)}, ${sqlStr(role.description)}, TRUE) ON CONFLICT (slug) DO NOTHING;\n`;
  for (const perm of role.permissions) out += `INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.slug=${sqlStr(role.slug)} AND p.slug=${sqlStr(perm)} ON CONFLICT DO NOTHING;\n`;
}
out += `INSERT INTO users (email, name, password_hash, password_salt, status, created_at) VALUES (${sqlStr(adminEmail)}, 'Platform Super Admin', ${sqlStr(hash)}, ${sqlStr(salt)}, 'active', ${sqlStr(ts)}) ON CONFLICT (email) DO NOTHING;\n`;
// Note roles from ROLES defs - let's check what role slugs exist
const ownerSlug = ROLES.find(r => /owner|super/i.test(r.slug))?.slug || 'super_admin';
out += `INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email=${sqlStr(adminEmail)} AND r.slug=${sqlStr(ownerSlug)} ON CONFLICT DO NOTHING;\n`;
CATEGORIES.forEach((c, i) => {
  out += `INSERT INTO categories (slug, name_en, name_bn, group_name, spec_template, is_active, min_models, sort_order, description) VALUES (${sqlStr(slugify(c.name))}, ${sqlStr(c.name)}, ${sqlStr(c.nameBn ?? '')}, ${sqlStr(c.group)}, ${sqlStr(c.template)}, FALSE, 15, ${i+1}, 'Proposed retail taxonomy. Activating this category requires 15 distinct verified real models.') ON CONFLICT (slug) DO NOTHING;\n`;
});
for (const name of BRAND_NAMES) out += `INSERT INTO brands (slug, name, verification_status) VALUES (${sqlStr(slugify(name))}, ${sqlStr(name)}, 'unverified') ON CONFLICT (slug) DO NOTHING;\n`;
const demoProducts = [
  ['DEMO ONLY — Placeholder business laptop (not a real model)', slugify('DEMO ONLY Placeholder business laptop'), 'DEMO-BL-001', 'Business laptops'],
  ['DEMO ONLY — Placeholder desktop PC (not a real model)', slugify('DEMO ONLY Placeholder desktop PC'), 'DEMO-DT-001', 'Desktop computers'],
  ['DEMO ONLY — Placeholder office monitor (not a real model)', slugify('DEMO ONLY Placeholder office monitor'), 'DEMO-MN-001', 'Office monitors'],
];
for (const [name, slug, sku, cat] of demoProducts) {
  out += `INSERT INTO products (slug, brand_id, category_id, model_name, sku, status, is_demo, verification_status, created_by, created_at, updated_at, overview) SELECT ${sqlStr(slug)}, b.id, c.id, ${sqlStr(name)}, ${sqlStr(sku)}, 'draft', TRUE, 'unverified', u.id, ${sqlStr(ts)}, ${sqlStr(ts)}, 'DEMONSTRATION RECORD ONLY.' FROM brands b, categories c, users u WHERE b.slug='lenovo' AND c.slug=${sqlStr(slugify(cat))} AND u.email=${sqlStr(adminEmail)} ON CONFLICT (slug) DO NOTHING;\n`;
  out += `INSERT INTO product_seo (product_id, title, meta_description, canonical_path, indexable) SELECT p.id, '', '', ${sqlStr('/products/'+slug)}, FALSE FROM products p WHERE p.slug=${sqlStr(slug)} ON CONFLICT (product_id) DO NOTHING;\n`;
}
const addr = BUSINESS.addressBn + ' / ' + BUSINESS.addressEn;
out += `INSERT INTO branches (code, name, address, phone, is_active) VALUES ('ICT-104-105', 'ICT Bhaban — Shops 104 & 105', ${sqlStr(addr)}, ${sqlStr(BUSINESS.phone)}, TRUE) ON CONFLICT (code) DO NOTHING;\n`;
out += `INSERT INTO warehouses (branch_id, code, name, is_active) SELECT b.id, 'MAIN-104-105', 'Primary shop stock room', TRUE FROM branches b WHERE b.code='ICT-104-105' ON CONFLICT (code) DO NOTHING;\n`;
out += `INSERT INTO employees (user_id, employee_code, department, designation, branch_id, joined_at, status) SELECT u.id, 'DRM-001', 'Administration', 'Platform Super Admin', b.id, ${sqlStr(ts.slice(0,10))}, 'active' FROM users u, branches b WHERE u.email=${sqlStr(adminEmail)} AND b.code='ICT-104-105' ON CONFLICT (employee_code) DO NOTHING;\n`;
out += `INSERT INTO commission_rules (name, basis, rate_bps, flat_amount, min_margin_bps, applies_to_returns, active) VALUES ('Default margin share (template)', 'line_margin', 500, 0, 0, FALSE, TRUE) ON CONFLICT DO NOTHING;\n`;
out += `INSERT INTO shifts (name, starts_at, ends_at) SELECT 'Shop hours', '10:00', '20:00' WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name='Shop hours');\n`;
for (const [name, detail] of INTEGRATIONS) out += `INSERT INTO integration_status (name, status, detail, last_checked_at) VALUES (${sqlStr(name)}, 'not_configured', ${sqlStr(detail)}, ${sqlStr(ts)}) ON CONFLICT (name) DO NOTHING;\n`;
for (const platform of ['facebook','instagram','youtube','whatsapp']) out += `INSERT INTO social_channels (platform, status) VALUES (${sqlStr(platform)}, 'not_connected') ON CONFLICT (platform) DO NOTHING;\n`;
out += `INSERT INTO app_logs (level, message, context_json, created_at) VALUES ('info', 'Baseline seeded. No live products, prices or stock.', '{}', ${sqlStr(ts)});\n`;
fs.writeFileSync('/tmp/seed-pg.sql', out);
const stmts = out.split('\n').map(s => s.trim()).filter(Boolean);
let groups = {};
for (const s of stmts) {
  const m = s.match(/INSERT INTO (\w+)/);
  const tbl = m ? m[1] : 'other';
  (groups[tbl] = groups[tbl] || []).push(s);
}
for (const k in groups) fs.writeFileSync(`/tmp/seed-${k}.sql`, groups[k].join('\n'));
console.log('wrote', Object.keys(groups).length, 'tables, bytes:', out.length);
