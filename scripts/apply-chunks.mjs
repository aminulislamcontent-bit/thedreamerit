import fs from 'node:fs';
// Output JSON ready to be passed via the tool - I'll do it one at a time.
for (let i = 0; i < 8; i++) {
  const sql = fs.readFileSync(`/tmp/pg-chunk-${i}.sql`, 'utf8');
  fs.writeFileSync(`/tmp/pg-chunk-${i}.json`, JSON.stringify({
    input: {
      name: `dreamerit_chunk_${i}`,
      project_ref: 'trlbampbmqisunbfyroy',
      query: sql,
    }
  }));
}
console.log('ready');
