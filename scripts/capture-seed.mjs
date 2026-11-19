// Use tsx to import seed-pg and capture queries by providing a mock pool
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const queries = [];
function makeClient() {
  return {
    async query(sql, params) {
      queries.push({ sql, params: params || [] });
      // Return shaped results based on sql content
      if (/SELECT id, slug FROM permissions/.test(sql)) return { rows: [] };
      if (/SELECT id FROM roles WHERE slug = \$1/.test(sql)) return { rows: [{ id: 1 }], rowCount: 1 };
      if (/SELECT id FROM users WHERE email/.test(sql)) return { rows: [{ id: 1 }], rowCount: 1 };
      if (/SELECT id FROM categories WHERE slug/.test(sql)) return { rows: [{ id: 1 }], rowCount: 1 };
      if (/SELECT id FROM brands WHERE slug/.test(sql)) return { rows: [{ id: 1 }], rowCount: 1 };
      if (/SELECT id FROM branches WHERE code/.test(sql)) return { rows: [{ id: 1 }], rowCount: 1 };
      if (/SELECT id FROM shifts WHERE name/.test(sql)) return { rows: [], rowCount: 0 };
      if (/RETURNING id/.test(sql)) return { rows: [{ id: 1 }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    },
    async queryNoArgs(sql) { return this.query(sql); },
    release() {},
  };
}
const mockPool = {
  async connect() { return makeClient(); },
};

process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@thedreamerit.local';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'DreamerIT!2026#TempPass';
process.env.DATABASE_PATH = '/tmp/none.db';

const mod = await import('../src/lib/server/seed-pg.ts?' + Date.now());
// Intercept by providing the mock pool? Can't easily since module uses pg types; run ts-node-style replacement
console.log('loaded, queries collected:', queries.length);
