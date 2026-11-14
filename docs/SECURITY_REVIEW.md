# Security review

Date: 2026-11-02. Scope: the code in this repository, its dependencies and the executed checks. This is not a third-party penetration test.

## Controls implemented and verified

| Control | Implementation | Verification |
| --- | --- | --- |
| Password hashing | `scryptSync` with 16-byte random salt, 64-byte key (N=16384, r=8, p=1), constant-time comparison | unit tests (`hashPassword`/`verifyPassword`) |
| Sessions | Random 256-bit token, only SHA-256 stored, httpOnly + SameSite=Lax + Secure in production, 12h expiry, revocation, IP/user-agent recorded | admin smoke test with a real session; login action |
| RBAC | 8 roles, 35 permissions, `role_permissions` join, `requirePermission()` on every privileged server action, admin layout gate | `/admin` 307 for anonymous; 18 admin pages 200 for super admin |
| CSRF | Double-submit cookie (`dit_csrf`) checked by `requireCsrf()` on privileged actions, plus Next.js server-action origin checks | real multipart POST with valid/invalid tokens; Next logged missing-origin warnings for raw curl posts |
| Rate limiting | Persisted fixed windows for login (8/15min), contact (5/hour), cart (60/min) in `rate_limit_hits` | code + `checkRateLimit` used by tested flows |
| Account protection | Failed-login counter, `locked_until` column, status checks, MFA requirement | login flow |
| MFA | RFC 6238 TOTP (HMAC-SHA1, 30s, ±1 window), provisioning URI, enable/disable actions | unit tests including drift windows |
| Input validation | Zod 4 schemas for product imports, login, media metadata, orders, addresses; strlen/type/URL checks; MIME + size + filename sanitization on uploads | unit tests + `npm audit` 0 vulnerabilities |
| Upload security | Allow-listed MIME/size per media kind, filename sanitization, files stored outside public source (`uploads/`), served via `/media/[file]` only when approved+licensed or staff-permissioned, `X-Content-Type-Options: nosniff` | unit tests + route code |
| SQL safety | All queries parameterized via prepared statements; no string interpolation of user values (only allow-listed column names in `updateProductField`) | code review + integration tests |
| Audit | `audit_events` records actor, action, entity, detail JSON, IP, timestamp for auth, catalogue, media, inventory, pricing, orders, content, social actions | smoke test: content action produced audit rows; publish-gate rejection recorded |
| Secrets | No private keys in frontend/source control; settings page shows presence only; `.env*`, `data/`, `uploads/`, `backups/` git-ignored | `.gitignore`, secret pattern scan |
| Data isolation | Customer pages filter by `user_id`; admin pages require permissions; media route checks approval before public serving | `/account/orders/[id]` ownership check; `/media/[file]` gate |
| Dependency security | `npm audit --omit=dev` → 0 vulnerabilities after `postcss` override and `zod` upgrade | executed 2026-11-02 |
| Integrity | Backups SHA-256 + `PRAGMA integrity_check` + scratch restore | executed successfully |
| Response hardening (continuation) | Per-request nonce CSP (`strict-dynamic`, no script `unsafe-inline`), HSTS on HTTPS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP; JSON-LD script carries the nonce | `tests/security-headers.test.ts` + HTTP header smoke after production build |

## Residual risks / not yet done

1. **No TLS in the dev/preview setup.** Production must terminate TLS at a reverse proxy and set `NODE_ENV=production` so cookies are `Secure`.
2. **Bootstrap credentials.** If `BOOTSTRAP_ADMIN_PASSWORD` is not set, a random password is written to `data/bootstrap-credentials.txt`. That file must be deleted after first login; the password must be changed and MFA enabled.
3. **SQLite for local runtime.** `node:sqlite` is marked experimental in Node 22 and single-file SQLite is not a multi-writer production database. A Postgres/Supabase port is outstanding (see `docs/BACKUP_RESTORE.md`).
4. **No automated browser security testing** (XSS/CSRF in rendered DOM, CSP enforcement in a real browser, clickjacking behaviour). CSP/HSTS and the other headers are now implemented and unit-tested, but a browser E2E/DAST run is still required before launch.
5. **Session/CSRF cookies are not rotated on privilege change**; session invalidation on role change is manual (delete sessions rows).
6. **No WAF, no IP allow-list for `/admin`, no brute-force alerting beyond audit rows.**
7. **External integrations unconfigured** — no credential was requested, stored or transmitted. Any future integration must use official APIs and server-side secret storage.
8. **Sensitive HR data**: `employees`/`attendance` are permission-gated by RBAC, but field-level encryption and a formal retention policy are not implemented.
9. **No independent review of licence/permission claims** for future media: the app records provenance and requires human approval, but it cannot verify a third party's legal permission.

## Checks not performed

No penetration test, no SAST/DAST tool run, no load test, no third-party audit, no browser-based E2E security test. The continuation run verified CSP/HSTS at HTTP-header level and with unit tests, and found no committed real secrets (only two intentional placeholder `APP_SECRET` lines), but that does **not** replace browser CSP enforcement testing or a DAST/pentest. These remain outstanding, not claimed as passed.
