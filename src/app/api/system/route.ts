// System API - integrations, backups, settings
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'system.settings' as any)) return forbidden();

  const url = new URL(req.url);
  const section = url.searchParams.get('section');

  if (section === 'integrations') {
    const integrations = await db.integrationConfig.findMany({ orderBy: { name: 'asc' } });
    return ok({ integrations });
  }

  if (section === 'backups') {
    const backups = await db.backupLog.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
    return ok({ backups });
  }

  if (section === 'settings') {
    const settings = await db.systemSetting.findMany({ orderBy: { key: 'asc' } });
    return ok({ settings: settings.map(s => ({ ...s, value: s.isEncrypted ? '••••••' : s.value })) });
  }

  if (section === 'health') {
    // System health checks
    const checks: Array<{ name: string; status: 'OK' | 'WARN' | 'ERROR'; detail?: string }> = [];

    // Database check
    try {
      await db.$queryRaw`SELECT 1`;
      checks.push({ name: 'Database', status: 'OK' });
    } catch (e) {
      checks.push({ name: 'Database', status: 'ERROR', detail: String(e) });
    }

    // Active sessions count
    const activeSessions = await db.session.count({
      where: { expiresAt: { gt: new Date() }, revokedAt: null },
    });
    checks.push({ name: 'Active Sessions', status: 'OK', detail: `${activeSessions} active` });

    // Pending failed jobs
    const failedJobs = await db.publishingJob.count({ where: { status: 'FAILED' } });
    checks.push({
      name: 'Failed Jobs',
      status: failedJobs > 0 ? 'WARN' : 'OK',
      detail: failedJobs > 0 ? `${failedJobs} failed publishing jobs` : undefined,
    });

    // Low stock count
    const lowStock = await db.inventory.count({ where: { quantityAvailable: { lte: 5 } } });
    checks.push({
      name: 'Low Stock Items',
      status: lowStock > 10 ? 'WARN' : 'OK',
      detail: `${lowStock} items at or below threshold`,
    });

    return ok({ checks });
  }

  return ok({ success: true });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'system.settings' as any)) return forbidden();

  const body = await req.json();
  const { action } = body;

  if (action === 'backup') {
    // Create database backup
    const backupDir = path.join(process.cwd(), 'backups');
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `db-backup-${timestamp}.db`);

    const backupLog = await db.backupLog.create({
      data: {
        type: 'DATABASE',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    try {
      // SQLite backup via cp
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './db/custom.db';
      await execAsync(`cp ${dbPath} ${backupFile}`);

      const stats = await import('fs/promises').then(fs => fs.stat(backupFile));

      await db.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'SUCCESS',
          fileUrl: backupFile,
          fileSizeBytes: stats.size,
          completedAt: new Date(),
        },
      });

      // Update system setting
      await db.systemSetting.upsert({
        where: { key: 'platform.lastBackupAt' },
        update: { value: new Date().toISOString() },
        create: { key: 'platform.lastBackupAt', value: new Date().toISOString() },
      });

      await logAudit({
        userId: user.id,
        action: 'system.backup_created',
        entityType: 'BackupLog',
        entityId: backupLog.id,
        metadata: { file: backupFile, size: stats.size },
        ipAddress: getClientIp(req),
      });

      return ok({ backup: { id: backupLog.id, file: backupFile, size: stats.size, completedAt: new Date() } });
    } catch (err: any) {
      await db.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });
      return badRequest(`Backup failed: ${err.message}`);
    }
  }

  if (action === 'update_setting') {
    const { key, value } = body;
    if (!key) return badRequest('Setting key is required');

    const setting = await db.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await logAudit({
      userId: user.id,
      action: 'system.setting_updated',
      entityType: 'SystemSetting',
      entityId: setting.id,
      metadata: { key },
      ipAddress: getClientIp(req),
    });

    return ok({ setting });
  }

  if (action === 'update_integration') {
    const { name, type, credentials, status } = body;
    if (!name) return badRequest('Integration name is required');

    const integration = await db.integrationConfig.upsert({
      where: { name },
      update: {
        type: type || undefined,
        credentials: credentials ? JSON.stringify(credentials) : undefined,
        status: status || undefined,
      },
      create: {
        name,
        type: type || 'OTHER',
        credentials: credentials ? JSON.stringify(credentials) : null,
        status: status || 'PENDING_AUTH',
      },
    });

    await logAudit({
      userId: user.id,
      action: 'system.integration_updated',
      entityType: 'IntegrationConfig',
      entityId: integration.id,
      metadata: { name, status },
      ipAddress: getClientIp(req),
    });

    return ok({ integration });
  }

  return badRequest('Unknown action');
});
