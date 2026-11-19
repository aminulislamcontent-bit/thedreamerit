/**
 * Baseline configuration seed for Postgres.
 *
 * Mirrors ./seed.ts (SQLite) but uses async pg queries so we don't have to
 * fight the sync/async boundary at bootstrap. Contains NO real product models,
 * prices, stock figures, reviews or ratings — same invariants as the SQLite
 * version.
 */
import type pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { BUSINESS, CATEGORIES, slugify } from '../core/identity';
import { PERMISSIONS, ROLES } from '../core/permissions';
import { generatePassword, hashPassword } from '../core/password';

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

export async function seedBaselinePgImpl(pool: pg.Pool): Promise<{ adminEmail: string }> {
  const ts = new Date().toISOString();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Access control ---
    for (const slug of PERMISSIONS) {
      await client.query('INSERT INTO permissions (slug, description) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
        [slug, `Allows: ${slug}`]);
    }
    const permRes = await client.query<{ id: number; slug: string }>('SELECT id, slug FROM permissions');
    const permIds = new Map<string, number>();
    for (const row of permRes.rows) permIds.set(row.slug, row.id);

    for (const role of ROLES) {
      await client.query(
        'INSERT INTO roles (slug, name, description, is_system) VALUES ($1, $2, $3, 1) ON CONFLICT (slug) DO NOTHING',
        [role.slug, role.name, role.description],
      );
      const roleRow = await client.query<{ id: number }>('SELECT id FROM roles WHERE slug = $1', [role.slug]);
      const rid = roleRow.rows[0]?.id;
      if (!rid) continue;
      for (const permission of role.permissions) {
        const pid = permIds.get(permission);
        if (pid) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [rid, pid],
          );
        }
      }
    }

    // --- Bootstrap super admin ---
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@thedreamerit.local';
    let password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
    if (!password) {
      password = generatePassword(24);
      const credPath = path.join(process.cwd(), 'data', 'bootstrap-credentials.txt');
      fs.mkdirSync(path.dirname(credPath), { recursive: true });
      fs.writeFileSync(
        credPath,
        `# Local bootstrap credentials — keep private, delete after first login.\n${adminEmail}\n${password}\n`,
        { mode: 0o600 },
      );
    }
    const { hash, salt } = hashPassword(password);
    await client.query(
      `INSERT INTO users (email, name, password_hash, password_salt, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', $5)
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, 'Platform Super Admin', hash, salt, ts],
    );
    const adminRes = await client.query<{ id: number }>('SELECT id FROM users WHERE email = $1', [adminEmail]);
    const adminId = adminRes.rows[0]?.id;
    const adminRoleRes = await client.query<{ id: number }>("SELECT id FROM roles WHERE slug = 'super_admin'");
    const adminRoleId = adminRoleRes.rows[0]?.id;
    if (adminId && adminRoleId) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [adminId, adminRoleId],
      );
    }

    // --- Taxonomy ---
    for (let i = 0; i < CATEGORIES.length; i++) {
      const c = CATEGORIES[i];
      await client.query(
        `INSERT INTO categories (slug, name_en, name_bn, group_name, spec_template, is_active, min_models, sort_order, description)
         VALUES ($1, $2, $3, $4, $5, 0, 15, $6, $7) ON CONFLICT (slug) DO NOTHING`,
        [slugify(c.name), c.name, c.nameBn ?? '', c.group, c.template, i + 1,
          'Proposed retail taxonomy. Activating this category requires 15 distinct verified real models.'],
      );
    }
    for (const name of BRAND_NAMES) {
      await client.query(
        'INSERT INTO brands (slug, name, verification_status) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
        [slugify(name), name, 'unverified'],
      );
    }

    // --- Demo products (explicitly excluded from live catalogue) ---
    const catId = async (n: string) => {
      const r = await client.query<{ id: number }>('SELECT id FROM categories WHERE slug = $1', [slugify(n)]);
      return r.rows[0]?.id;
    };
    const brId = async (n: string) => {
      const r = await client.query<{ id: number }>('SELECT id FROM brands WHERE slug = $1', [slugify(n)]);
      return r.rows[0]?.id;
    };
    const demoProducts: Array<[string, string, string, string]> = [
      ['DEMO ONLY — Placeholder business laptop (not a real model)', slugify('DEMO ONLY Placeholder business laptop'), 'DEMO-BL-001', 'Business laptops'],
      ['DEMO ONLY — Placeholder desktop PC (not a real model)', slugify('DEMO ONLY Placeholder desktop PC'), 'DEMO-DT-001', 'Desktop computers'],
      ['DEMO ONLY — Placeholder office monitor (not a real model)', slugify('DEMO ONLY Placeholder office monitor'), 'DEMO-MN-001', 'Office monitors'],
    ];
    const lenovoBrand = await brId('Lenovo');
    for (const [name, slug, sku, cat] of demoProducts) {
      const cid = await catId(cat);
      if (!cid || !lenovoBrand) continue;
      const ins = await client.query<{ id: number }>(
        `INSERT INTO products
          (slug, brand_id, category_id, model_name, sku, status, is_demo, verification_status, created_by, created_at, updated_at, overview)
         VALUES ($1,$2,$3,$4,$5,'draft',1,'unverified',$6,$7,$8,$9)
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [slug, lenovoBrand, cid, name, sku, adminId ?? null, ts, ts,
          'DEMONSTRATION RECORD ONLY. Not a real product, not verified, unpublished, and excluded from the live catalogue.'],
      );
      const id = ins.rows[0]?.id;
      if (id) {
        await client.query(
          `INSERT INTO product_seo (product_id, title, meta_description, canonical_path, indexable)
           VALUES ($1, '', '', $2, 0) ON CONFLICT (product_id) DO NOTHING`,
          [id, `/products/${slug}`],
        );
      }
    }

    // --- Branch / warehouse ---
    await client.query(
      `INSERT INTO branches (code, name, address, phone, is_active)
       VALUES ($1,$2,$3,$4,1) ON CONFLICT (code) DO NOTHING`,
      ['ICT-104-105', 'ICT Bhaban — Shops 104 & 105', `${BUSINESS.addressBn} / ${BUSINESS.addressEn}`, BUSINESS.phone],
    );
    const branchRes = await client.query<{ id: number }>("SELECT id FROM branches WHERE code = 'ICT-104-105'");
    const branchId = branchRes.rows[0]?.id;
    if (branchId) {
      await client.query(
        'INSERT INTO warehouses (branch_id, code, name, is_active) VALUES ($1,$2,$3,1) ON CONFLICT (code) DO NOTHING',
        [branchId, 'MAIN-104-105', 'Primary shop stock room'],
      );
    }

    // --- HR / commission defaults ---
    if (adminId && branchId) {
      await client.query(
        `INSERT INTO employees (user_id, employee_code, department, designation, branch_id, joined_at, status)
         VALUES ($1,$2,'Administration','Platform Super Admin',$3,$4,'active') ON CONFLICT (employee_code) DO NOTHING`,
        [adminId, 'DRM-001', branchId, ts.slice(0, 10)],
      );
    }
    await client.query(
      `INSERT INTO commission_rules (name, basis, rate_bps, flat_amount, min_margin_bps, applies_to_returns, active)
       VALUES ($1,'line_margin',500,0,0,0,1) ON CONFLICT DO NOTHING`,
      ['Default margin share (template)'],
    );
    // Shifts table has no UNIQUE constraint, so avoid duplicate seeding with a check.
    const existingShift = await client.query<{ id: number }>("SELECT id FROM shifts WHERE name = 'Shop hours'");
    if (existingShift.rowCount === 0) {
      await client.query(
        `INSERT INTO shifts (name, starts_at, ends_at) VALUES ($1,'10:00','20:00')`,
        ['Shop hours'],
      );
    }

    // --- Integrations ---
    for (const [name, detail] of INTEGRATIONS) {
      await client.query(
        'INSERT INTO integration_status (name, status, detail, last_checked_at) VALUES ($1,$2,$3,$4) ON CONFLICT (name) DO NOTHING',
        [name, 'not_configured', detail, ts],
      );
    }
    for (const platform of ['facebook', 'instagram', 'youtube', 'whatsapp']) {
      await client.query(
        'INSERT INTO social_channels (platform, status) VALUES ($1,$2) ON CONFLICT (platform) DO NOTHING',
        [platform, 'not_connected'],
      );
    }
    await client.query(
      `INSERT INTO app_logs (level, message, context_json, created_at) VALUES ('info',$1,$2,$3)`,
      [
        'Baseline configuration seeded. No live products, prices or stock were created.',
        JSON.stringify({ categories: CATEGORIES.length }),
        ts,
      ],
    );

    await client.query('COMMIT');
    return { adminEmail };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
export { seedBaselinePgImpl as seedBaselinePg };
