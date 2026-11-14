'use server';

import { revalidatePath } from 'next/cache';
import { all, get, run, nowIso } from '@/lib/server/database';
import { guard, field, intField, boolField, done, fail } from '@/lib/server/action-utils';
import { importProducts, publishProduct, setCategoryActive, setPrice, unpublishProduct, updateProductField, upsertSpec } from '@/lib/server/catalogue';
import { slugify } from '@/lib/core/identity';
import { validateMetadata } from '@/lib/core/seo-rules';

export async function activateCategoryAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.edit');
  const id = intField(fd, 'categoryId');
  const active = boolField(fd, 'active');
  if (!id) fail('/admin/catalogue', 'Category id is missing.');
  await setCategoryActive(id, active, user.id);
  revalidatePath('/admin/catalogue');
  done('/admin/catalogue', active ? 'Category activated. It now requires at least 15 distinct verified models.' : 'Category deactivated.');
}

export async function createProductAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.edit');
  const modelName = field(fd, 'modelName');
  const sku = field(fd, 'sku');
  const mpn = field(fd, 'mpn');
  const brandId = intField(fd, 'brandId');
  const categoryId = intField(fd, 'categoryId');
  const sourceName = field(fd, 'sourceName');
  const sourceUrl = field(fd, 'sourceUrl');
  const isDemo = boolField(fd, 'isDemo');
  if (!modelName || !sku || !brandId || !categoryId) fail('/admin/products', 'Model name, SKU, brand and category are required.');
  if (get('SELECT id FROM products WHERE sku = ?', [sku])) fail('/admin/products', 'That SKU already exists (duplicate detection).');
  const slug = slugify(modelName);
  if (get('SELECT id FROM products WHERE slug = ?', [slug])) fail('/admin/products', 'That model name produces a duplicate slug.');
  const result = run(`INSERT INTO products (slug, brand_id, category_id, model_name, sku, mpn, status, is_demo, verification_status, source_url, source_name, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, 'unverified', ?, ?, ?, ?, ?)`,
    [slug, brandId, categoryId, modelName, sku, mpn, isDemo ? 1 : 0, sourceUrl, sourceName, user.id, nowIso(), nowIso()]);
  const id = Number(result.lastInsertRowid);
  run('INSERT INTO product_seo (product_id, canonical_path, indexable) VALUES (?, ?, 0)', [id, `/products/${slug}`]);
  revalidatePath('/admin/products');
  done(`/admin/products/${id}`, isDemo ? 'Demonstration record created (excluded from live catalogue).' : 'Draft created. Add verified specs, licensed media, price source and SEO before publishing.');
}

export async function updateProductAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.edit');
  const id = intField(fd, 'productId');
  const name = field(fd, 'field');
  const value = field(fd, 'value');
  if (!id || !name) fail('/admin/products', 'Product and field are required.');
  try {
    await updateProductField(id, name, value || null, user.id);
  } catch (error) {
    fail(`/admin/products/${id}`, error instanceof Error ? error.message : 'Update failed.');
  }
  revalidatePath(`/admin/products/${id}`);
  done(`/admin/products/${id}`, 'Product updated and revision recorded.');
}

export async function setPriceAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'pricing.approve');
  const id = intField(fd, 'productId');
  const raw = field(fd, 'priceBdt');
  const amount = raw === '' ? null : Math.round(Number(raw) * 100);
  if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) fail(`/admin/products/${id}`, 'Enter a valid BDT price.');
  const result = await setPrice(id, amount, field(fd, 'priceSourceUrl'), field(fd, 'priceSourceName'), user.id);
  if (!result.ok) fail(`/admin/products/${id}`, result.error || 'Price rejected.');
  revalidatePath(`/admin/products/${id}`);
  done(`/admin/products/${id}`, 'Price change logged with its authorized source.');
}

export async function upsertSpecAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.verify');
  const id = intField(fd, 'productId');
  const result = await upsertSpec(id, {
    specKey: field(fd, 'specKey'), specValue: field(fd, 'specValue'), unit: field(fd, 'unit'),
    groupName: field(fd, 'groupName') || 'General', verified: boolField(fd, 'verified'),
    sourceUrl: field(fd, 'sourceUrl'), sourceName: field(fd, 'sourceName'),
  }, user.id);
  if (!result.ok) fail(`/admin/products/${id}`, result.error || 'Specification rejected.');
  revalidatePath(`/admin/products/${id}`);
  done(`/admin/products/${id}`, 'Specification saved with verification state.');
}

export async function saveSeoAction(fd: FormData): Promise<void> {
  await guard(fd, 'seo.manage');
  const id = intField(fd, 'productId');
  const title = field(fd, 'title');
  const description = field(fd, 'metaDescription');
  const canonicalPath = field(fd, 'canonicalPath');
  const check = validateMetadata({ title, description, canonicalPath });
  run(`INSERT INTO product_seo (product_id, title, meta_description, canonical_path, indexable, reviewed_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET title = excluded.title, meta_description = excluded.meta_description,
    canonical_path = excluded.canonical_path, indexable = excluded.indexable, reviewed_at = excluded.reviewed_at`,
    [id, title, description, canonicalPath, boolField(fd, 'indexable') ? 1 : 0, check.valid ? nowIso() : null]);
  revalidatePath(`/admin/products/${id}`);
  if (!check.valid) fail(`/admin/products/${id}`, check.blockers.join(' '));
  done(`/admin/products/${id}`, 'SEO fields reviewed and recorded.');
}

export async function publishProductAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.publish');
  const id = intField(fd, 'productId');
  const result = await publishProduct(id, user.id);
  revalidatePath('/products');
  revalidatePath('/admin/catalogue');
  if (!result.ok) fail(`/admin/products/${id}`, `Publication blocked: ${result.blockers.join(' | ')}`);
  done(`/admin/products/${id}`, 'Published: every publication gate passed and approval was recorded.');
}

export async function unpublishProductAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.publish');
  const id = intField(fd, 'productId');
  await unpublishProduct(id, user.id);
  revalidatePath('/products');
  done(`/admin/products/${id}`, 'Product unpublished.');
}

export async function importProductsAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.edit');
  let records: unknown[];
  try {
    const parsed = JSON.parse(field(fd, 'json'));
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array of import records.');
    records = parsed;
  } catch (error) {
    fail('/admin/products', `Invalid JSON: ${error instanceof Error ? error.message : 'parse error'}`);
  }
  const result = await importProducts(records!, user.id);
  revalidatePath('/admin/products');
  done('/admin/products', `Imported ${result.imported}; rejected ${result.rejected.length}; duplicates ${result.duplicates.length}. All imports remain drafts until verified.`);
}

export async function addBrandAction(fd: FormData): Promise<void> {
  await guard(fd, 'catalogue.edit');
  const name = field(fd, 'name');
  if (!name) fail('/admin/products', 'Brand name required.');
  const slug = slugify(name);
  if (!get('SELECT id FROM brands WHERE slug = ?', [slug])) run('INSERT INTO brands (slug, name, verification_status) VALUES (?, ?, ?)', [slug, name, 'unverified']);
  revalidatePath('/admin/products');
  done('/admin/products', `Brand "${name}" added as unverified taxonomy.`);
}

export async function verifyProductAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.verify');
  const id = intField(fd, 'productId');
  const sourceUrl = field(fd, 'sourceUrl');
  const sourceName = field(fd, 'sourceName');
  if (!sourceUrl || !sourceName) fail(`/admin/products/${id}`, 'A named manufacturer/distributor source URL is required for verification.');
  run("UPDATE products SET verification_status = 'verified', source_url = ?, source_name = ?, verified_by = ?, verified_at = ?, updated_at = ? WHERE id = ?",
    [sourceUrl, sourceName, user.id, nowIso(), nowIso(), id]);
  revalidatePath(`/admin/products/${id}`);
  done(`/admin/products/${id}`, 'Model verification recorded.');
}

export async function seedSpecTemplateAction(fd: FormData): Promise<void> {
  await guard(fd, 'catalogue.verify');
  const id = intField(fd, 'productId');
  const template = get<{ spec_template: string }>('SELECT c.spec_template FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?', [id]);
  const required: Record<string, string[]> = {
    laptop: ['Processor and generation', 'Core and thread count', 'RAM capacity and type', 'Storage capacity and type', 'Graphics processor', 'Display size and resolution', 'Refresh rate', 'Operating system', 'Battery information', 'Ports and connectivity', 'Dimensions and weight', 'Warranty and included accessories'],
    desktop: ['CPU', 'Motherboard', 'RAM', 'Storage', 'Graphics card', 'Power supply', 'Cooling', 'Case', 'Operating system', 'Upgrade options', 'Component compatibility'],
  };
  const fields = required[template?.spec_template ?? ''] ?? [];
  const existing = new Set(all<{ spec_key: string }>('SELECT spec_key FROM product_specs WHERE product_id = ?', [id]).map((s) => s.spec_key));
  for (const key of fields) {
    if (!existing.has(key)) run('INSERT INTO product_specs (product_id, group_name, spec_key, spec_value, verified, source_url) VALUES (?, ?, ?, ?, 0, ?)', [id, 'Required template', key, '', '']);
  }
  revalidatePath(`/admin/products/${id}`);
  done(`/admin/products/${id}`, `${fields.length} category-specific specification rows created as unverified placeholders.`);
}

export async function createVariantAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.edit');
  const productId = intField(fd, 'productId');
  const sku = field(fd, 'sku');
  const name = field(fd, 'name');
  if (!productId || !sku || !name) fail(`/admin/products/${productId}`, 'Variant name and SKU are required.');
  if (get('SELECT id FROM product_variants WHERE sku = ?', [sku])) fail(`/admin/products/${productId}`, 'Duplicate variant SKU.');
  run(`INSERT INTO product_variants (product_id, sku, name, attributes_json, barcode, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?)`, [productId, sku, name, field(fd, 'attributes') || '{}', field(fd, 'barcode'), nowIso()]);
  run('UPDATE products SET updated_at = ? WHERE id = ?', [nowIso(), productId]);
  void user;
  revalidatePath(`/admin/products/${productId}`);
  done(`/admin/products/${productId}`, 'Variant created. Variants never count as separate models.');
}

export async function setMinimumPriceAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'pricing.approve');
  const productId = intField(fd, 'productId');
  const amount = Math.round(Number(field(fd, 'minimumBdt')) * 100);
  if (!Number.isFinite(amount) || amount <= 0) fail(`/admin/products/${productId}`, 'Enter a valid minimum price.');
  const current = get<{ price_amount: number | null }>('SELECT price_amount FROM products WHERE id = ?', [productId]);
  if (current?.price_amount !== null && current?.price_amount !== undefined && current.price_amount < amount) {
    fail(`/admin/products/${productId}`, 'The current verified price is already below this floor; adjust the price first.');
  }
  run('UPDATE products SET minimum_selling_amount = ?, updated_at = ? WHERE id = ?', [amount, nowIso(), productId]);
  void user;
  revalidatePath(`/admin/products/${productId}`);
  done(`/admin/products/${productId}`, 'Authorized minimum selling price saved; below-floor discounts now require approval.');
}

export async function archiveProductAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'catalogue.edit');
  const productId = intField(fd, 'productId');
  const restore = boolField(fd, 'restore');
  run('UPDATE products SET status = ?, updated_at = ? WHERE id = ?', [restore ? 'draft' : 'archived', nowIso(), productId]);
  run('INSERT INTO product_revisions (product_id, changed_by, change_json, created_at) VALUES (?, ?, ?, ?)',
    [productId, user.id, JSON.stringify({ status: restore ? 'restored' : 'archived' }), nowIso()]);
  revalidatePath('/admin/products');
  done(`/admin/products/${productId}`, restore ? 'Product restored to draft.' : 'Product archived (restorable).');
}
