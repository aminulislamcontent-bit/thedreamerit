import fs from 'node:fs';

type Q = { sql: string; params: unknown[] };
const queries: Q[] = [];

function makeClient() {
  return {
    async query(sql: string, params: unknown[] = []) {
      queries.push({ sql, params });
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
    release() {},
  };
}
const mockPool = { connect: async () => makeClient() } as any;

process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@thedreamerit.local';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'DreamerIT!2026#TempPass';

const mod: any = await import('../src/lib/server/seed-pg.ts');
await mod.seedBaselinePg(mockPool);

function render({ sql, params }: Q): string {
  const rendered = sql.replace(/\$(\d+)/g, (_, n) => {
    const v = params[Number(n)-1];
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return `'${String(v).replace(/'/g,"''")}'`;
  });
  return rendered.trim() + ';';
}

fs.writeFileSync('/tmp/seed-pg.sql', queries.map(render).join('\n'));
console.log('Wrote', queries.length, 'queries');
