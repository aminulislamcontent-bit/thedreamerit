/** Verify checksum + SQLite integrity and perform a real test restore into a scratch file. */
import { verifyBackup } from '../src/lib/server/backup';

const file = process.argv[2];
if (!file) { console.error('Usage: npm run verify:backup -- backups/app-<timestamp>.db'); process.exit(1); }
const result = verifyBackup(file);
if (!result.ok) { console.error('VERIFICATION FAILED:', result.reason); process.exit(1); }
console.log(`Verified: checksum matches, integrity_check=ok, ${result.tables} tables restored into a scratch database.`);
console.log('A test restore succeeded for this backup. Full production restore is documented in docs/BACKUP_RESTORE.md.');
