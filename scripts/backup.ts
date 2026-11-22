/** Consistent backup + uploaded-media snapshot, with checksum and registry entry. */
import { performBackup } from '../src/lib/server/backup';

(async () => {
  const result = await performBackup();
  console.log(`Backup #${result.id} created: ${result.file}`);
  console.log(`SHA-256: ${result.checksum}`);
  console.log(`Size: ${result.size} bytes`);
  if (result.uploadsSnapshot) console.log(`Media snapshot: ${result.uploadsSnapshot}`);
  console.log(`Run "npm run verify:backup -- ${result.file}" to verify integrity and a test restore.`);
})().catch((err) => { console.error(err); process.exit(1); });
