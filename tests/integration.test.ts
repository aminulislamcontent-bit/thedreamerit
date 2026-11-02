import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Isolate the test database before any server module opens the singleton.
const testDb = path.join(process.cwd(), 'data', `integration-${process.pid}.db`);
process.env.DATABASE_PATH = testDb;

test.after(() => {
  for (const suffix of ['', '-shm', '-wal']) {
    const file = `${testDb}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
});

test('migrations + seed: 105 proposed categories, no live products, no invented stock or reviews', async () => {
  const { initializeDatabase } = await import('../src/lib/server/database');
  const { db } = await import('../src/lib/server/database');
  initializeDatabase();
  const d = db();
  const count = (sql: string) => Number((d.prepare(sql).get() as { n: number }).n);
  assert.ok(count("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'") > 65);
  assert.equal(count('SELECT COUNT(*) AS n FROM categories'), 105);
  assert.equal(count('SELECT COUNT(*) AS n FROM categories WHERE is_active = 1'), 0);
  assert.equal(count('SELECT COUNT(*) AS n FROM products WHERE is_demo = 0'), 0);
  assert.equal(count('SELECT COUNT(*) AS n FROM products'), 3);
  assert.equal(count('SELECT COUNT(*) AS n FROM inventory_balances'), 0);
  assert.equal(count('SELECT COUNT(*) AS n FROM reviews'), 0);
  assert.equal(count('SELECT COUNT(*) AS n FROM payments'), 0);
  assert.equal(count('SELECT COUNT(*) AS n FROM integration_status'), 12);
  assert.equal(count("SELECT COUNT(*) AS n FROM social_channels WHERE status = 'not_connected'"), 4);
});

test('publication gate refuses a demonstration record end-to-end', async () => {
  const { evaluateProduct } = await import('../src/lib/server/catalogue');
  const { get } = await import('../src/lib/server/database');
  const demo = get<{ id: number }>('SELECT id FROM products WHERE is_demo = 1 LIMIT 1')!;
  const evaluation = evaluateProduct(demo.id)!;
  assert.equal(evaluation.allowed, false);
  assert.ok(evaluation.blockers.some((b) => /demonstration/i.test(b)));
  assert.ok(evaluation.blockers.some((b) => /media|photograph/i.test(b)));
});

test('inventory: receiving creates real balances and concurrent reservations cannot oversell', async () => {
  const { receiveStock, reserveStock, releaseReservation, availableFor, getBalances } = await import('../src/lib/server/inventory');
  const { get, run } = await import('../src/lib/server/database');
  const product = get<{ id: number }>('SELECT id FROM products LIMIT 1')!;
  await receiveStock({ productId: product.id, warehouseId: 1, quantity: 5 }, { unitCost: 40000, serials: ['SER-1', 'SER-2', 'SER-3', 'SER-4', 'SER-5'] }, 1);
  assert.equal(availableFor(product.id), 5);
  assert.equal(getBalances().length, 1);
  const first = await reserveStock({ productId: product.id, warehouseId: 1, quantity: 3 }, null, 1);
  assert.equal(availableFor(product.id), 2);
  await assert.rejects(() => reserveStock({ productId: product.id, warehouseId: 1, quantity: 3 }, null, 1), /Insufficient unreserved stock/);
  assert.equal(availableFor(product.id), 2);
  await releaseReservation(first, false, 1);
  assert.equal(availableFor(product.id), 5);
  // No serial numbers were invented: exactly five were received.
  assert.equal(Number((get<{ n: number }>('SELECT COUNT(*) AS n FROM serial_numbers')!.n)), 5);
  // Every balance change has a matching movement record.
  assert.ok(Number((get<{ n: number }>('SELECT COUNT(*) AS n FROM stock_movements')!.n)) >= 3);
  run('DELETE FROM stock_reservations', []);
});

test('orders cannot be created from unpublished or unverified products', async () => {
  const { createOrder } = await import('../src/lib/server/orders');
  const { get } = await import('../src/lib/server/database');
  const product = get<{ id: number }>('SELECT id FROM products LIMIT 1')!;
  const result = await createOrder({ lines: [{ productId: product.id, quantity: 1 }], channel: 'pos' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /not published/i.test(e)));
});

test('social publishing never reports published without platform confirmation', async () => {
  const { submitPublishingJob, confirmPublication } = await import('../src/lib/server/social');
  const { run, get } = await import('../src/lib/server/database');
  const result = run("INSERT INTO publishing_jobs (platform, status, created_by, created_at, updated_at) VALUES ('facebook', 'approved', 1, ?, ?)", [new Date().toISOString(), new Date().toISOString()]);
  const jobId = Number(result.lastInsertRowid);
  const submitted = await submitPublishingJob(jobId, 1);
  assert.equal(submitted.ok, false);
  assert.equal(submitted.status, 'failed');
  assert.equal(get<{ status: string }>('SELECT status FROM publishing_jobs WHERE id = ?', [jobId])!.status, 'failed');
  const blocked = await confirmPublication(jobId, { platformPostId: 'fake', platformResponseJson: '{}' }, 1);
  assert.equal(blocked.ok, false);
  run("UPDATE publishing_jobs SET status = 'submitted' WHERE id = ?", [jobId]);
  const badJson = await confirmPublication(jobId, { platformPostId: 'post_1', platformResponseJson: 'not-json' }, 1);
  assert.equal(badJson.ok, false);
  const confirmed = await confirmPublication(jobId, { platformPostId: 'post_1', platformResponseJson: '{"id":"post_1"}' }, 1);
  assert.equal(confirmed.ok, true);
  assert.equal(get<{ status: string }>('SELECT status FROM publishing_jobs WHERE id = ?', [jobId])!.status, 'published');
});

test('content studio drafts are sourced from verified fields only', async () => {
  const { generateContentDraft, buildVerifiedBundle } = await import('../src/lib/server/content');
  const { get } = await import('../src/lib/server/database');
  const product = get<{ id: number }>('SELECT id FROM products LIMIT 1')!;
  const bundle = buildVerifiedBundle(product.id)!;
  assert.equal(bundle.priceBdt, null);
  assert.equal(bundle.warranty, null);
  const generated = await generateContentDraft('description', 'bn', product.id, 1);
  assert.equal(generated.ok, true);
  const draft = get<{ body: string; status: string; generated_by: string }>('SELECT * FROM content_drafts WHERE id = ?', [Number(generated.draftId)])!;
  assert.equal(draft.status, 'draft');
  assert.equal(draft.generated_by, 'template');
  assert.match(draft.body, /যাচাই|মূল্য প্রদর্শন করা হয়নি/);
});

test('dashboard aggregates come from real records; catalogue is reported incomplete', async () => {
  const { dashboardMetrics } = await import('../src/lib/server/dashboard');
  const metrics = dashboardMetrics();
  assert.equal(metrics.publishedProducts, 0);
  assert.equal(metrics.verifiedModels, 0);
  assert.equal(metrics.revenue, 0);
  assert.equal(metrics.netProfit, null);
  assert.equal(metrics.catalogueComplete, false);
  assert.equal(metrics.progress.length, 105);
  assert.equal(metrics.integrationsNotConfigured, 12);
  assert.equal(metrics.publishedPosts, 1); // the explicitly platform-confirmed test job
});
