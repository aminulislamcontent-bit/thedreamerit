# Worklog — 2026-11-02

## Context

The user supplied a terminal log showing a failed `git push` from their Mac:

```
remote: Permission to aminulislamcontent-bit/thedreamerit.git denied to alaminiubateee969-cmd.
fatal: ... 403
```

Diagnosis from this sandbox: the remote repo is owned by `aminulislamcontent-bit` with that account as its only collaborator, while the Mac's git credential was for the different account `alaminiubateee969-cmd`. The GitHub repo contained only GitHub's auto-created `Initial commit` README. The user then supplied the full master build specification for The Dreamer IT Express.

## Work performed (in the specified implementation order)

1. **Environment inspection** — Node 22.22.3, npm 10.9.8, `node:sqlite` available, npm registry reachable; Supabase connector inspected (existing projects belong to other apps, so left untouched); GitHub auth verified as repo owner (ADMIN), `git push --dry-run` successful. Domain WHOIS lookups attempted; results recorded as non-definitive.
2. **Architecture & data models** — Next.js 15 App Router + TypeScript + Zod 4 + Three.js. `db/migrations/001_schema.sql` with 74 normalized tables (users/roles/permissions, catalogue/specs/media/SEO, inventory/procurement, orders/payments, HR/commission, CRM, content/SEO/social, ops) with FKs, CHECK constraints and indexes. Idempotent migration runner and baseline seed (105 proposed categories, 3 labelled demo records, 12 integration placeholders, 0 stock/price/review rows).
3. **Auth & permissions** — scrypt hashing, hashed sessions, 8 roles / 35 permissions, CSRF double-submit, persisted rate limiting, TOTP MFA, audit log, secure media route.
4. **Catalogue & product template** — pure rule layer (`src/lib/core/catalogue-rules.ts`) with the 15-model rule, media tiers, publication gate; DB services; product editor; 9-section public product page with Product/Breadcrumb JSON-LD.
5. **Media & viewers** — Three.js GLB/glTF viewer (OrbitControls, resize, keyboard, touch, fullscreen, lazy, error fallback), 360° drag/swipe viewer, dynamic gallery with zoom/lightbox and explicit media honesty labels; media admin with validated uploads, provenance/licensing/review.
6. **Completeness reporting** — 105-row progress dashboard with exact shortfall, activation toggles, publication-approval recording; catalogue is never marked complete when an active category is short.
7. **Inventory** — `BEGIN IMMEDIATE` reservations (oversell prevention test), receiving/transfers/adjustments/serials/low-stock/valuation, branches/warehouses.
8. **Procurement / POS / orders** — suppliers, POs, invoices; POS UI; order state machine; verified-payment gate; refunds/returns; commission reversal.
9. **Employees & commission** — configurable rules, attendance, shifts, payroll export.
10. **Public website & checkout** — 25 public routes including policies, FAQ, guides, configurator, accounts, cart/checkout.
11. **Super Admin Dashboard** — 16 KPI cards computed from real rows, category/order/integration/audit panels.
12. **SEO & AI Content Studio** — sitemap/robots/canonical/structured data/metadata/duplicate/link checks/redirects; 11 draft kinds in Bangla/English from verified fields only, no-fabrication validator, revision history, human approval, optional AI provider with explicit fallback.
13. **Social workflow** — approval → submission → platform-confirmation-only `published` state; missing credentials produce recorded failed jobs, never fake successes.
14. **CRM & support** — customers/leads/tickets/consent/preferences/follow-ups; warranty/return requests.
15. **Security, backups, monitoring** — health endpoint, app logs, failed jobs, backup registry with SHA-256 and scratch restore test, CLI scripts, security review doc.
16. **Tests & defects** — 24 node:test tests; fixed 2 initial failures (discount approval semantics, negation false-positives in the no-fabrication checker); typecheck/lint/build clean; `npm audit` initially found postcss/zod advisories → upgraded `zod@4.6.7` and overrode `postcss@8.5.32`, re-verified 0 vulnerabilities, tests and build.
17. **Deployment & documentation** — README, DEPLOYMENT.md, DEPLOYMENT_PLAN.md, Caddyfile, API/env/backup/security/dependencies/readiness docs, TEST_RESULTS.md, FINAL_REPORT.md.
18. **Final verification** — production build + runtime smoke test (24 public/system URLs, 18 admin pages, preview, health, sitemap/robots), real CSRF-protected server-action POSTs (draft creation success; publication gate rejection), all CLI scripts executed, backup integrity and scratch restore verified.

## Deliberate non-actions

- Did not invent any real product model, specification, price, stock quantity, warranty, review, rating, image or video.
- Did not activate any of the 105 proposed categories without owner confirmation about real stock.
- Did not mark the catalogue complete, mark an order paid, or mark a social post published without the corresponding verification.
- Did not register or claim availability of any domain; did not claim any external integration is connected.
- Did not request, store or commit any credential, token or private key.

## Continuation — 2026-11-02 (after initial handover)

19. **Workspace/Git reconciliation** — the local checkout had been reset to `cd7eabd` while `origin/arena/fbf9ad17-thedreamerit` still held `14b96f8`. `git fetch` + `git reset --mixed origin/arena/fbf9ad17-thedreamerit` restored the branch and upstream tracking without altering the 133 working-tree files. `origin/main` was found to be `4a90c8b` — a separate 221-file Next.js 16 / Prisma project by `alaminiubateee969-cmd`, with unrelated history and overlapping paths. PR #1 became `CONFLICTING` / `DIRTY`. **Neither project was overwritten**; a canonical-codebase decision is required before merging.
20. **Response hardening** — added `src/lib/core/security-headers.ts`, `src/middleware.ts`, root-layout dynamic rendering, a nonce on the product JSON-LD script, and a dynamic policies route. Implemented per-request CSP (`script-src` nonce + `strict-dynamic`, no script `unsafe-inline`), HSTS on HTTPS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP and `nosniff`. First build failed because an early-return instrumentation guard still left Node-only imports in the Edge bundle; fixed with the positive `NEXT_RUNTIME === 'nodejs'` block. Header/nonce behaviour was verified over HTTP.
21. **Scheduled jobs** — added `db/migrations/002_scheduled_jobs.sql`, `src/lib/server/jobs.ts`, `src/instrumentation.ts`, `scripts/jobs-tick.ts`, `docs/SCHEDULER.md`, health/admin status, and `tests/jobs.test.ts`. Six maintenance jobs are claimed inside `BEGIN IMMEDIATE`, with a run ledger and failure retry backoff. Fixed a first-tick off-by-one-millisecond issue by passing the same timestamp to `ensureScheduledJobs()` and `runDueJobs()`. Verified 6/6 jobs via CLI and a forced due in-process startup tick.
22. **Media derivatives** — added `sharp` as a direct dependency, `db/migrations/003_media_derivatives.sql`, `src/lib/server/derivatives.ts`, `scripts/media-derivatives.ts`, derivative-aware permission checking in `/media/[file]`, and `tests/derivatives.test.ts`. Generates deterministic WebP `thumb`/`medium`/`large` files only for approved, permission-granted local images. Tested with a generated non-product fixture (3 derivatives, checksum/idempotency); live DB correctly has 0 eligible sources.
23. **Missing admin page** — the sidebar already linked to `/admin/backups`, but the route did not exist. Added `src/app/(admin)/admin/backups/page.tsx` with backup records, verify/resolve actions, failed jobs, health and scheduler state. Admin page count is now 18; 17 renderable without a fabricated order returned 200.
24. **Container & CI** — added `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/ci.yml`, and updated `DEPLOYMENT.md`, `docs/ENVIRONMENT.md`, `docs/API.md`, `docs/SECURITY_REVIEW.md`, `docs/OUTSTANDING_DEPENDENCIES.md`, `docs/PRODUCTION_READINESS.md`, `README.md`, `FINAL_REPORT.md`, `TEST_RESULTS.md`. Docker is unavailable in the sandbox, so the image was not built; CI is committed for the remote runner.
25. **Final continuation verification** — `npm test` 28/28, typecheck clean, lint clean, production build succeeded (51 route entries, 50 dynamic + 1 static), `npm audit --omit=dev` 0 vulnerabilities, 3 migrations / 77 tables, CLI scripts all passed, backup SHA-256 + scratch restore of 77 tables passed, 29 public/system + 17 authenticated admin URLs HTTP 200, CSP nonce in HTML, HSTS on forwarded HTTPS, full login 303 → `/admin`, internal scheduler executed, unpublished demo product 404, dynamic order routes 404 as expected. Production launch remains **NO-GO**.

## Decision still needed from the owner

- Choose the canonical codebase for `main`: (A) keep this branch's no-fabrication/verification-gated implementation and archive the other project under a clearly labelled `legacy/` path, (B) keep the `main` project and port these gates/tests into it, or (C) keep both as separate products/branches. Until that decision is made, PR #1 should not be merged with a blind conflict resolution.
- Supply authorized product/media/price/stock data, domain decision, payment/social/email/analytics credentials, off-site backup storage, and a production Postgres/Supabase decision. Then run browser E2E with licensed 3D/360°/video assets, a container build, production cron, WAF/CSP validation and an off-site restore rehearsal.

26. **Remote CI verification and fix** — the first GitHub Actions run `41475988697` failed because `tests/jobs.test.ts` asserted `schedulerStatus().internalEnabled === true` while the workflow sets `ENABLE_INTERNAL_SCHEDULER=0`. The test now sets a deterministic value, verifies both enabled and disabled status, and restores the prior environment. Commit `7c2f959` was pushed; rerun `41476959953` passed all steps (tests, typecheck, lint, build, CLI verification, audit). Reports and the PR were updated accordingly.
