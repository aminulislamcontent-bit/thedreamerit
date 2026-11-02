# Test & verification results

Recorded on **2026-11-02** (Asia/Dhaka) in this sandbox. All commands were actually executed; unexecuted checks are listed explicitly in the "Not executed" section. Sections 1–7 preserve the initial handover run; **section 8 records the continuation run** after the scheduler, CSP, derivative, backups-page and container/CI additions.

## 1. Automated unit + integration tests

Command: `npm test` (`tsx --test tests/*.test.ts`, Node's built-in test runner)

```
1..24
# tests 24
# suites 0
# pass 24
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1251.85
```

Coverage of the 24 tests:

| Test file | What it proves |
| --- | --- |
| `tests/catalogue-rules.test.ts` (5) | 15 distinct verified models; demo/unverified/duplicate SKU/case-variant exclusion; static gallery never reported as 3D or 360°; 360° requires ≥8 ordered, licensed, approved frames; publication gate blocks demo/no-media/fake price/no approval/no inventory/unverified specs and allows a complete dossier; exact shortfall reporting; catalogue never complete when an active category is short or no category is active |
| `tests/commerce-rules.test.ts` (6) | price hidden unless verified/sourced/above floor; below-floor discounts require recorded authorization; revenue ≠ profit; invalid order transitions rejected; `paid` requires a verified payment event covering the total; margin-based commission, split attribution, reversal on cancel/return/refund; PC compatibility (socket, RAM, PSU, GPU clearance, form factor) |
| `tests/content-seo-auth.test.ts` (6) | drafts never fabricate price/availability/rating/review/certification/spec values; structured data omits price, availability and `aggregateRating` unless verified; sitemap only published+indexable; metadata/duplicate validation; scrypt salted hashing; RFC-style TOTP rolling windows; upload MIME/size/extension checks; external media permission gating; full 105-category taxonomy and domain claim policy |
| `tests/integration.test.ts` (7) | real DB migrations (74 tables), seed (105 categories, 0 live products, 0 stock, 0 reviews, 0 payments, 12 unconfigured integrations); publication gate refuses a demo record end-to-end; goods receiving creates balances + serials + movements and a second reservation cannot oversell; orders cannot be built from unpublished products; social jobs never become `published` without platform confirmation; content drafts come from verified fields only; dashboard aggregates come from real records and the catalogue is reported incomplete |

## 2. Type checking, lint, build, dependency audit

| Command | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`, strict) | exit 0, no diagnostics |
| `npm run lint` (`next lint`, ESLint 9 flat config) | `✔ No ESLint warnings or errors` |
| `npm run build` (`next build`, Next.js 15.5.28) | `✓ Compiled successfully`, `✓ Generating static pages (15/15)`, 50+ app/API routes emitted |
| `npm audit --omit=dev --audit-level=moderate` | `found 0 vulnerabilities` (after overriding `postcss` to 8.5.32 and upgrading `zod` to 4.6.7) |

## 3. CLI scripts (all executed successfully)

| Command | Actual output |
| --- | --- |
| `npm run db:setup` | migrations applied: none (already current); categories 105; products 3; live published 0; users 1 |
| `npm run backup` | Backup #1 created, 581632 bytes, SHA-256 `8fb43e76…`, uploads snapshot created |
| `npm run verify:backup -- backups/app-…db` | `Verified: checksum matches, integrity_check=ok, 74 tables restored into a scratch database` |
| `npm run restore -- backups/app-…db` | `Restore validation passed: integrity ok, categories 105` (dry run; `--apply` not executed) |
| `npm run check:links` | `Checked 3 canonical paths; 0 unresolved internal links` |
| `npm run check:health` | `status: ok`, database reachable, openFailedJobs 0, lastBackup verified |
| `npm run export:catalogue` | `Exported 3 catalogue records to data/catalogue-export.csv` |

## 4. Runtime smoke test against the production build

`npm run start -- -p 3000` (bound to `0.0.0.0`), HTTP requests via curl.

Public / system URLs — **all HTTP 200** except where noted:

```
/ /api/health /products /products?demo=1 /categories /categories/business-laptops
/compare?ids=1 /search?q=test /cart /checkout /login /register /contact /about
/guides /blog /faq /configurator /policies/delivery /policies/privacy
/sitemap.xml /robots.txt
```

- `/admin` → **307 redirect to `/login`** for an anonymous visitor (expected RBAC behaviour).
- `/products/demo-only-placeholder-business-laptop` → **404** for the public (unpublished demo record correctly hidden).
- `/products/demo-only-placeholder-business-laptop?preview=1` → **200** only with an authenticated catalogue-privileged session.
- `/api/health` → `{"status":"ok","database":"reachable","openFailedJobs":0,…}`.
- `/robots.txt` disallows `/admin/`, `/account/`, `/api/` and advertises the sitemap; `/sitemap.xml` contains static paths only (no unpublished products).

Authenticated admin pages — **all HTTP 200** (session cookie created directly in the DB for the smoke test):

```
/admin /admin/catalogue /admin/products /admin/products/1 /admin/media
/admin/inventory /admin/operations /admin/pos /admin/orders /admin/employees
/admin/crm /admin/content /admin/seo /admin/social /admin/security
/admin/backups /admin/settings
```

## 5. Server-action pipeline (executed end-to-end)

The CSRF-protected server action `generateDraftAction` was submitted as a real multipart POST to `/admin/content` with a valid session + CSRF cookie:

- Response: `HTTP/1.1 303 See Other`, `Location: /admin/content?ok=Draft+created+from+verified+fields+only…`
- Database afterwards: `content_drafts` 2 rows (`description/bn` and `seo_title/en`, both `status=draft`, `generated_by=template`), `content_revisions` 2 rows, `audit_events` 2 rows.

The publication action was submitted for the demo product:

- Response: `303` → `/admin/products/1?error=Publication+blocked%3A+Not+demonstration+data+%7C+Model+verified…`
- Confirms the gate refuses an unverified/demo/no-media product over the real HTTP path.

## 6. Login flow (executed end-to-end)

A real login was submitted through the rendered `LoginForm` server action (progressive-enhancement hidden fields `$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_1:1`, `$ACTION_KEY` plus email/password/next):

```
HTTP/1.1 303 See Other
Set-Cookie: dit_session=<64-hex>; Path=/; Secure; HttpOnly; SameSite=lax
Set-Cookie: dit_csrf=<40-hex>; Path=/; Secure; SameSite=lax
Location: /admin
```

Reusing that session token returned HTTP 200 for `/admin`, `/admin/catalogue` and `/admin/products/1`. A wrong password returns the rendered form with `role="alert"` = `Invalid email or password.` and increments `failed_login_count`. Sessions created by the login flow are hashed in the DB.

## 7. Not executed / not claimed

- No automated browser/E2E run: interactive WebGL rendering of a real GLB/glTF asset, drag/swipe 360° gesture behaviour, video playback, zoom/fullscreen and image lightbox were implemented and type-checked but **not** verified in a browser, because no licensed product-specific 3D/360°/video assets exist.
- No external API calls were made or verified: payment gateway, Facebook/Instagram/YouTube/WhatsApp APIs, SMTP, Search Console, Analytics and AI provider all lack owner credentials.
- No `--apply` production restore was performed (only a validated scratch restore).
- No domain registration, DNS change, deployment to a server, or load/performance testing was performed.
- No real product model, specification, price, stock figure, warranty term or customer review was created or verified against a manufacturer source; the live catalogue is intentionally empty.
- No container image was built/run and no remote CI result was observed during this initial handover run; see section 8 for the later configuration and local checks.
- No browser-based CSP enforcement/DAST run was performed; the later header-level verification is recorded in section 8.

## 8. Continuation verification (after initial handover)

The local Git metadata was realigned to the remote branch commit `14b96f8` without changing the working tree. `main` was found to contain a separate 221-file Next.js 16 / Prisma project (`4a90c8b`, author `alaminiubateee969-cmd`), so PR #1 is `CONFLICTING` / `DIRTY`; no codebase was overwritten.

### Commands actually executed

| Command | Result |
| --- | --- |
| `npm test` | `1..28`, `# tests 28`, `# pass 28`, `# fail 0` |
| `npm run typecheck` | exit 0, no diagnostics |
| `npm run lint` | `✔ No ESLint warnings or errors` |
| `npm run build` | `✓ Compiled successfully`; 51 route entries (50 dynamic + 1 static); `ƒ Middleware 34.9 kB` |
| `npm audit --omit=dev --audit-level=moderate` | `found 0 vulnerabilities` |
| `npm run db:setup` | migrations applied: `001_schema.sql, 002_scheduled_jobs.sql, 003_media_derivatives.sql`; 105 categories, 3 demo products, 0 live published, 1 user |
| `npm run jobs:tick` | `due: 6`, `ran: 6`, `failed: []`; first-tick registration/claim fixed and retested |
| `npm run media:derivatives` | live DB: `processed: 0, created: 0, skipped: 0, errors: []` — no approved licensed product image exists |
| `npm run check:health` | `status: ok`, `database: reachable`, `openFailedJobs: 0`, scheduler object with 6 jobs and a succeeded `lastRun` |
| `npm run check:links` | `Checked 3 canonical paths; 0 unresolved internal links` |
| `npm run export:catalogue` | `Exported 3 catalogue records to data/catalogue-export.csv` |
| `npm run backup` | `backups/app-2026-11-02T15-40-39-946Z.db`, SHA-256 `f6ad787b926d48438f0c8275c52d7e5c6c00804eb3612e87cbc790e2583235f9`, 626688 bytes |
| `npm run verify:backup -- backups/app-2026-11-02T15-40-39-946Z.db` | `checksum matches, integrity_check=ok, 77 tables restored into a scratch database` |
| `npm run restore -- backups/app-2026-11-02T15-40-39-946Z.db` | `Restore validation passed` (dry run only; `--apply` not executed) |

### New automated tests

- `tests/security-headers.test.ts` (2): nonce CSP contains the generated nonce and `strict-dynamic`, never falls back to script `unsafe-inline`, allows local `img`/`media`/`worker` sources, and HSTS is sent only for HTTPS.
- `tests/jobs.test.ts` (1): first tick registers and claims 6 due jobs, cleans expired sessions and old rate-limit hits, does not re-run them immediately, and repeats cleanup on a forced due time.
- `tests/derivatives.test.ts` (1): a generated solid-colour **non-product** fixture produces three deterministic WebP derivatives with matching SHA-256 checks; a second run creates 0 and skips 3.

### Production-runtime smoke (rebuilt app, port 3000, `0.0.0.0`)

- `GET /` → 200. `Content-Security-Policy` present with a per-request nonce; the same nonce appears in the rendered HTML and its script/link tags. `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, COOP and CORP present.
- Plain HTTP → no HSTS. `X-Forwarded-Proto: https` → `Strict-Transport-Security: max-age=31536000`.
- Anonymous `/admin` → `307 /login?next=/admin`.
- Full `useActionState` login with rendered hidden fields → `303 /admin`, `Set-Cookie: dit_session` and `dit_csrf`; 17 authenticated admin pages (including the new `/admin/backups`) → HTTP 200 with CSP on all.
- 29 public/system URLs → HTTP 200. Unpublished demo product → 404. `/account/orders/1` and `/admin/orders/1` → 404 because no order was fabricated (correct empty-state behaviour, not a failure).
- `/api/health` → `status: ok`, `database: reachable`, `openFailedJobs: 0`, `scheduler.internalEnabled: true`, 6 jobs, `lastRun.status: succeeded`. With 6 jobs forcibly set due before startup, the in-process `src/instrumentation.ts` hook executed them and recorded a fresh succeeded run.
- Process log contained only `✓ Ready` plus the expected Node 22 `SQLite is an experimental feature` warning.

### Added to "not executed / not claimed"

- Docker is not installed in the sandbox: `Dockerfile`, `.dockerignore` and `docker-compose.yml` were **not built or run**.
- The GitHub Actions workflow in `.github/workflows/ci.yml` is committed but its remote run was not observed at the time of this local report.
- No browser E2E/DAST run verified CSP enforcement or WebGL/360°/video interactions with real licensed assets; no production cron/systemd timer, WAF, off-site backup upload or production-host restore rehearsal was executed.

### Secret hygiene

A repeat scan over `src/`, `scripts/`, `db/`, `docs/`, `tests/`, `.github/` and the top-level config/report files found **2 obvious-pattern hits**, both intentional non-secret placeholders: `APP_SECRET=replace-with-a-random-32-byte-hex-string` in `.env.example` and `APP_SECRET: ci-only-placeholder-not-used-for-authentication` in the CI workflow. No private key, API token, database credential, payment/social secret or real password was committed. `git diff --check` is clean.
