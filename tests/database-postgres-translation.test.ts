import test from 'node:test';
import assert from 'node:assert/strict';
import { sqlLiteToPostgres } from '../src/lib/server/database';

test('PostgreSQL migration translation gives plain SQLite id primary keys generated defaults', () => {
  const sql = sqlLiteToPostgres(`CREATE TABLE example (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );`);
  assert.match(sql, /id SERIAL PRIMARY KEY/i);
});

test('PostgreSQL migration translation preserves foreign-key primary keys', () => {
  const sql = sqlLiteToPostgres(`CREATE TABLE customer_profile (
    customer_id INTEGER PRIMARY KEY REFERENCES customers(id),
    note TEXT
  );`);
  assert.match(sql, /customer_id INTEGER PRIMARY KEY REFERENCES customers\(id\)/i);
  assert.doesNotMatch(sql, /customer_id SERIAL PRIMARY KEY/i);
});

test('PostgreSQL migration translation keeps existing AUTOINCREMENT conversion', () => {
  const sql = sqlLiteToPostgres('CREATE TABLE example (id INTEGER PRIMARY KEY AUTOINCREMENT);');
  assert.match(sql, /id SERIAL PRIMARY KEY/i);
});
