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
