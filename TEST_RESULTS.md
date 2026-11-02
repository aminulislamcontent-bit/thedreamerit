# Test & verification results

Recorded on **2026-11-02** (Asia/Dhaka) in this sandbox. All commands were actually executed; unexecuted checks are listed explicitly in the "Not executed" section.

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
