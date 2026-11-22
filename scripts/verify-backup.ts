/** Verify checksum + database integrity and perform a real test restore into a scratch file. */
import { verifyBackup } from '../src/lib/server/backup';

const file = process.argv[2];
if (!file) { console.error('Usage: npm run verify:backup -- backups/app-<timestamp>.db'); process.exit(1); }

(async () => {
  const result = await verifyBackup(file);
  if (!result.ok) { console.error('VERIFICATION FAILED:', result.reason); process.exit(1); }
  console.log(`Verified: checksum matches.${result.tables != null ? ` integrity_check=ok, ${result.tables} tables restored.` : ''}`);
  console.log('A test restore succeeded for this backup. Full production restore is documented in docs/BACKUP_RESTORE.md.');
})().catch((err) => { console.error(err); process.exit(1); });
