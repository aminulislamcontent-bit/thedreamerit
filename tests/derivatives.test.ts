import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const testDb = path.join(process.cwd(), 'data', `derivatives-${process.pid}.db`);
process.env.DATABASE_PATH = testDb;
const uploadsDir = path.join(process.cwd(), 'uploads');
const fixture = path.join(uploadsDir, `derivative-fixture-${process.pid}.png`);
const generatedFiles = new Set<string>();

test.after(() => {
  fs.rmSync(fixture, { force: true });
  for (const file of generatedFiles) fs.rmSync(file, { force: true });
  for (const suffix of ['', '-shm', '-wal']) fs.rmSync(`${testDb}${suffix}`, { force: true });
  fs.rmSync(`${testDb}.credentials.txt`, { force: true });
});

test('approved licensed local image generates three deterministic WebP derivatives', async () => {
  const { initializeDatabase, all, get, nowIso, run } = await import('../src/lib/server/database');
  initializeDatabase();
  fs.mkdirSync(uploadsDir, { recursive: true });
  // A generated solid-colour fixture, not a product photograph and never published.
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 20, g: 40, b: 60 } } }).png().toFile(fixture);

  const product = get<{ id: number }>('SELECT id FROM products LIMIT 1')!;
  const url = `/media/${path.basename(fixture)}`;
  const stamp = nowIso();
  const mediaId = Number(run(
    `INSERT INTO product_media (product_id, kind, url, review_status, permission_status, created_at, updated_at)
     VALUES (?, 'image', ?, 'approved', 'granted', ?, ?)`,
    [product.id, url, stamp, stamp],
  ).lastInsertRowid);

  const { generateDerivatives } = await import('../src/lib/server/derivatives');
  const first = await generateDerivatives();
  assert.deepEqual(first.errors, []);
  assert.equal(first.processed, 1);
  assert.equal(first.created, 3);

  const rows = all<{ variant: string; file_name: string; url: string; width: number; height: number; checksum: string; mime_type: string }>(
    'SELECT * FROM media_derivatives WHERE media_id = ? ORDER BY variant', [mediaId],
  );
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.variant).sort(), ['large', 'medium', 'thumb']);
  for (const row of rows) {
    const file = path.join(uploadsDir, row.file_name);
    generatedFiles.add(file);
    assert.ok(fs.existsSync(file), `${row.file_name} should exist`);
    assert.equal(row.mime_type, 'image/webp');
    assert.ok(row.width > 0 && row.height > 0);
    assert.ok(row.url.startsWith('/media/derivative-'));
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), row.checksum);
  }
  const thumb = rows.find((r) => r.variant === 'thumb')!;
  const medium = rows.find((r) => r.variant === 'medium')!;
  assert.ok(thumb.width <= 320);
  assert.ok(medium.width <= 800);

  const second = await generateDerivatives();
  assert.equal(second.created, 0);
  assert.equal(second.skipped, 3);
  assert.deepEqual(second.errors, []);
});
