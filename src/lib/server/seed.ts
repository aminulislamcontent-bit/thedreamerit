import type { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { BUSINESS, CATEGORIES, slugify } from '../core/identity';
import { PERMISSIONS, ROLES } from '../core/permissions';
import { generatePassword, hashPassword } from '../core/password';

/**
 * Baseline configuration seed.
 *
 * It contains NO real product models, specifications, prices, stock figures,
 * customer reviews or ratings. The three demonstration records are explicitly
 * flagged is_demo=1, kept as drafts, and excluded from the live catalogue.
 */

export type SeedResult = { adminEmail: string; bootstrapPasswordPath: string | null; categories: number };

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

export function seedBaseline(d: DatabaseSync, dbFile?: string): SeedResult {
  const ts = new Date().toISOString();
  d.exec('BEGIN IMMEDIATE');
  try {
    // --- Access control ---
    const insertPermission = d.prepare('INSERT INTO permissions (slug, description) VALUES (?, ?)');
    for (const slug of PERMISSIONS) insertPermission.run(slug, `Allows: ${slug}`);
    const permIds = new Map<string, number>();
    for (const row of d.prepare('SELECT id, slug FROM permissions').all() as Array<{ id: number; slug: string }>) permIds.set(row.slug, row.id);

    const insertRole = d.prepare('INSERT INTO roles (slug, name, description, is_system) VALUES (?, ?, ?, 1)');
    for (const role of ROLES) {
      insertRole.run(role.slug, role.name, role.description);
      const roleRow = d.prepare('SELECT id FROM roles WHERE slug = ?').get(role.slug) as { id: number };
      const link = d.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
      for (const permission of role.permissions) {
        const id = permIds.get(permission);
        if (id) link.run(roleRow.id, id);
      }
    }

    // --- Bootstrap super admin ---
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@thedreamerit.local';
    let bootstrapPasswordPath: string | null = null;
    let password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
    if (!password) {
      password = generatePassword(24);
      // Each database gets its own credentials file so test/scratch databases
      // never overwrite the credentials of the live database.
      const defaultFile = path.join(process.cwd(), 'data', 'app.db');
      const isDefault = !dbFile || path.resolve(dbFile) === path.resolve(defaultFile);
      bootstrapPasswordPath = isDefault
        ? path.join(process.cwd(), 'data', 'bootstrap-credentials.txt')
        : `${dbFile}.credentials.txt`;
      fs.mkdirSync(path.dirname(bootstrapPasswordPath), { recursive: true });
      fs.writeFileSync(bootstrapPasswordPath, `# Local bootstrap credentials — keep private, delete after first login.\n# database: ${dbFile ?? defaultFile}\n${adminEmail}\n${password}\n`, { mode: 0o600 });
    }
    const { hash, salt } = hashPassword(password);
    d.prepare('INSERT INTO users (email, name, password_hash, password_salt, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(adminEmail, 'Platform Super Admin', hash, salt, 'active', ts);
    const adminId = Number((d.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as { id: number }).id);
    const adminRoleId = Number((d.prepare("SELECT id FROM roles WHERE slug = 'super_admin'").get() as { id: number }).id);
    d.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(adminId, adminRoleId);

    // --- Taxonomy (all proposed, none activated without owner confirmation) ---
    const insertCategory = d.prepare('INSERT INTO categories (slug, name_en, name_bn, group_name, spec_template, is_active, min_models, sort_order, description) VALUES (?, ?, ?, ?, ?, 0, 15, ?, ?)');
    CATEGORIES.forEach((c, index) => {
      insertCategory.run(slugify(c.name), c.name, c.nameBn ?? '', c.group, c.template, index + 1,
        'Proposed retail taxonomy. Activating this category requires 15 distinct verified real models.');
    });

    const insertBrand = d.prepare('INSERT INTO brands (slug, name, verification_status) VALUES (?, ?, ?)');
    for (const name of BRAND_NAMES) insertBrand.run(slugify(name), name, 'unverified');

    // --- Explicitly labelled demonstration records (excluded from live catalogue) ---
    const categoryId = (name: string) => Number((d.prepare('SELECT id FROM categories WHERE slug = ?').get(slugify(name)) as { id: number }).id);
    const brandId = (name: string) => Number((d.prepare('SELECT id FROM brands WHERE slug = ?').get(slugify(name)) as { id: number }).id);
    const demoProducts: Array<[string, string, string, string]> = [
      ['DEMO ONLY — Placeholder business laptop (not a real model)', slugify('DEMO ONLY Placeholder business laptop'), 'DEMO-BL-001', 'Business laptops'],
      ['DEMO ONLY — Placeholder desktop PC (not a real model)', slugify('DEMO ONLY Placeholder desktop PC'), 'DEMO-DT-001', 'Desktop computers'],
      ['DEMO ONLY — Placeholder office monitor (not a real model)', slugify('DEMO ONLY Placeholder office monitor'), 'DEMO-MN-001', 'Office monitors'],
    ];
    const insertProduct = d.prepare(`INSERT INTO products
      (slug, brand_id, category_id, model_name, sku, status, is_demo, verification_status, created_by, created_at, updated_at, overview)
      VALUES (?, ?, ?, ?, ?, 'draft', 1, 'unverified', ?, ?, ?, ?)`);
    for (const [name, slug, sku, cat] of demoProducts) {
      const result = insertProduct.run(slug, brandId('Lenovo'), categoryId(cat), name, sku, adminId, ts, ts,
        'DEMONSTRATION RECORD ONLY. Not a real product, not verified, unpublished, and excluded from the live catalogue.');
      const id = Number(result.lastInsertRowid);
      d.prepare('INSERT INTO product_seo (product_id, title, meta_description, canonical_path, indexable) VALUES (?, ?, ?, ?, 0)')
        .run(id, '', '', `/products/${slug}`);
    }

    // --- Branches / warehouses from the owner-provided business identity ---
    d.prepare('INSERT INTO branches (code, name, address, phone, is_active) VALUES (?, ?, ?, ?, 1)')
      .run('ICT-104-105', 'ICT Bhaban — Shops 104 & 105', `${BUSINESS.addressBn} / ${BUSINESS.addressEn}`, BUSINESS.phone);
    d.prepare('INSERT INTO warehouses (branch_id, code, name, is_active) VALUES (?, ?, ?, 1)')
      .run(1, 'MAIN-104-105', 'Primary shop stock room');
    // No inventory_balances rows are seeded: stock is never invented.

    // --- HR / commission defaults (configurable templates, no claims about real staff) ---
    d.prepare('INSERT INTO employees (user_id, employee_code, department, designation, branch_id, joined_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(adminId, 'DRM-001', 'Administration', 'Platform Super Admin', 1, ts.slice(0, 10), 'active');
    d.prepare('INSERT INTO commission_rules (name, basis, rate_bps, flat_amount, min_margin_bps, applies_to_returns, active) VALUES (?, ?, ?, ?, ?, 0, 1)')
      .run('Default margin share (template)', 'line_margin', 500, 0, 0);
    d.prepare('INSERT INTO shifts (name, starts_at, ends_at) VALUES (?, ?, ?)').run('Shop hours', '10:00', '20:00');

    // --- Integration placeholders: nothing is reported as connected ---
    const insertIntegration = d.prepare('INSERT INTO integration_status (name, status, detail, last_checked_at) VALUES (?, ?, ?, ?)');
    for (const [name, detail] of INTEGRATIONS) insertIntegration.run(name, 'not_configured', detail, ts);
    const insertChannel = d.prepare('INSERT INTO social_channels (platform, status) VALUES (?, ?)');
    for (const platform of ['facebook', 'instagram', 'youtube', 'whatsapp']) insertChannel.run(platform, 'not_connected');

    d.prepare('INSERT INTO app_logs (level, message, context_json, created_at) VALUES (?, ?, ?, ?)')
      .run('info', 'Baseline configuration seeded. No live products, prices or stock were created.', JSON.stringify({ categories: CATEGORIES.length }), ts);

    d.exec('COMMIT');
    return { adminEmail, bootstrapPasswordPath, categories: CATEGORIES.length };
  } catch (error) {
    d.exec('ROLLBACK');
    throw error;
  }
}
