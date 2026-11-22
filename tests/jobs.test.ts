import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const testDb = path.join(process.cwd(), 'data', `jobs-${process.pid}.db`);
const priorSchedulerEnv = process.env.ENABLE_INTERNAL_SCHEDULER;
process.env.DATABASE_PATH = testDb;
process.env.ENABLE_INTERNAL_SCHEDULER = '1';

test.after(async () => {
  await new Promise((r) => setTimeout(r, 50));
  for (const suffix of ['', '-shm', '-wal']) fs.rmSync(`${testDb}${suffix}`, { force: true });
  fs.rmSync(`${testDb}.credentials.txt`, { force: true });
  if (priorSchedulerEnv === undefined) delete process.env.ENABLE_INTERNAL_SCHEDULER;
  else process.env.ENABLE_INTERNAL_SCHEDULER = priorSchedulerEnv;
});

test('scheduler claims each due job once and performs real maintenance', async () => {
  const { initializeDatabase, run, scalar } = await import('../src/lib/server/database');
  await initializeDatabase();
  const { ensureScheduledJobs, runDueJobs, schedulerStatus } = await import('../src/lib/server/jobs');
  const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const token = `expired-session-${process.pid}`;
  const subject = `old-rate-hit-${process.pid}`;
  await run('INSERT INTO sessions (user_id, token_hash, csrf_token, expires_at, created_at) VALUES (1, ?, ?, ?, ?)', [token, 'csrf', past, past]);
  await run('INSERT INTO rate_limit_hits (bucket, subject, created_at) VALUES (?, ?, ?)', ['login', subject, past]);

  const first = await runDueJobs();
  assert.ok(first.due >= 6, `expected at least six due jobs, got ${first.due}`);
  assert.equal(first.failed.length, 0);
  assert.equal(first.ran.length, first.due);
  assert.equal(await scalar('SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?', [token]), 0);
  assert.equal(await scalar('SELECT COUNT(*) AS n FROM rate_limit_hits WHERE subject = ?', [subject]), 0);
  await ensureScheduledJobs();

  const second = await runDueJobs();
  assert.equal(second.due, 0);
  assert.equal(second.ran.length, 0);

  const status = await schedulerStatus();
  assert.ok(status.jobs.length >= 6);
  assert.equal(status.internalEnabled, true);
  assert.equal(status.lastRun?.status, 'succeeded');

  process.env.ENABLE_INTERNAL_SCHEDULER = '0';
  const disabledStatus = await schedulerStatus();
  assert.equal(disabledStatus.internalEnabled, false);
  process.env.ENABLE_INTERNAL_SCHEDULER = '1';

  await run("UPDATE scheduled_jobs SET next_run_at = ? WHERE name IN ('expired_session_cleanup','rate_limit_cleanup')", [new Date(Date.now() - 60_000).toISOString()]);
  await run('INSERT INTO sessions (user_id, token_hash, csrf_token, expires_at, created_at) VALUES (1, ?, ?, ?, ?)', [`${token}-2`, 'csrf', past, new Date().toISOString()]);
  const third = await runDueJobs();
  assert.deepEqual(third.ran.sort(), ['expired_session_cleanup', 'rate_limit_cleanup']);
  assert.equal(await scalar('SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?', [`${token}-2`]), 0);
});
