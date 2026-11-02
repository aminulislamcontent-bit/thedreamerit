# Deployment instructions

## Prerequisites

- Node.js **≥ 22.5** (Node 22.22.3 in this sandbox; `node:sqlite` is used)
- npm ≥ 10
- A reverse proxy with TLS (Caddy/nginx)
- Persistent writable volume for `data/` and `uploads/`
- A process manager (systemd, PM2, or a container orchestrator)

## 1. Environment

```bash
git clone <repo> && cd thedreamerit
npm ci
cp .env.example .env.local
# EDIT .env.local:
#   APP_SECRET=<openssl rand -hex 32>
#   BOOTSTRAP_ADMIN_PASSWORD=<strong unique password>
#   NEXT_PUBLIC_SITE_URL=https://<your-domain>
#   DATABASE_PATH=/var/lib/dreamerit/app.db
npm run db:setup
```

Verify the seed: 105 categories, 0 live published products, 1 super admin. Delete `data/bootstrap-credentials.txt` after the first login.

## 2. Build & run

```bash
npm run build
npm run start -- -p 3000        # binds 0.0.0.0
curl -fsS http://127.0.0.1:3000/api/health | jq .
```

systemd unit example (`/etc/systemd/system/dreamerit.service`):

```ini
[Unit]
Description=The Dreamer IT Express
After=network.target

[Service]
Type=simple
User=dreamerit
WorkingDirectory=/srv/dreamerit
EnvironmentFile=/srv/dreamerit/.env.local
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`EnvironmentFile` lines must be plain `KEY=VALUE` (no `export`).

## 3. Reverse proxy

A `Caddyfile` is provided. Replace the placeholder domain (and verify domain availability/registration first — see `docs/OUTSTANDING_DEPENDENCIES.md`).

```bash
caddy validate --config Caddyfile
caddy run --config Caddyfile
```

Caddy terminates TLS and proxies to `127.0.0.1:3000`; the app itself binds `0.0.0.0` so container/preview hosts work too. Add security headers (HSTS, CSP, Referrer-Policy, Permissions-Policy) at the proxy before launch.

## 4. Scheduled jobs

```cron
0 2 * * *  cd /srv/dreamerit && npm run backup >> /var/log/dreamerit-backup.log 2>&1
5 2 * * *  cd /srv/dreamerit && npm run verify:backup -- "$(ls -t backups/app-*.db | head -1)" >> /var/log/dreamerit-backup.log 2>&1
*/15 * * * * cd /srv/dreamerit && npm run check:health >> /var/log/dreamerit-health.log 2>&1
0 8 * * *  cd /srv/dreamerit && npm run check:links >> /var/log/dreamerit-links.log 2>&1
```

Low-stock notifications, social scheduling and failed-job alerts are surfaced in the admin dashboards; wiring them to email/SMS requires the owner's SMTP/API credentials.

## 5. Health, monitoring, rollback

- Health: `GET /api/health` (DB, failed jobs, last verified backup, integrations).
- Logs: `app_logs` table + stdout of the process manager; `Admin → Security` / `Admin → Backups`.
- Rollback: stop the app → `npm run restore -- <verified-backup> --apply` → redeploy the previous build/commit → re-run `/api/health` and check `/`, `/products`, `/admin`.

Full backup/restore procedure: [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md).

## 6. Before going live (checklist)

- [ ] Domain availability verified at an authoritative registrar and registered (owner action; **not done**)
- [ ] TLS + security headers + `Secure` cookies (`NODE_ENV=production`)
- [ ] `APP_SECRET`, `BOOTSTRAP_ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` set to production values
- [ ] Bootstrap password changed, MFA enabled, bootstrap file deleted
- [ ] Off-site encrypted backup target configured and a restore rehearsed on the production host
- [ ] Postgres/Supabase port completed if multi-writer/high availability is required (local SQLite is single-node)
- [ ] Authorized product data + licensed media imported, verified, reviewed and approved; 15 verified models per activated category
- [ ] Payment, email and social platform credentials configured and verified with real API calls
- [ ] Browser E2E run of 3D/360°/video/lightbox/checkout with real assets
- [ ] Owner-approved delivery/return/terms/privacy text and operating-expense records entered

## Container note

A `Dockerfile` is intentionally **not** provided: the current build uses `node:sqlite` with a local file and no multi-stage image has been tested. A container image must mount a persistent volume for `data/` and `uploads/` and must be tested before being called production-ready.
