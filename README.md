# The Dreamer IT Express — platform

A real, integrated e-commerce + ERP application for **The Dreamer IT Express** (সুবাস্তু আর্কেড, আইসিটি ভবন, লেভেল ১, দোকান নং ১০৪ ও ১০৫, বাংলাদেশ), built to the supplied master build specification.

> **Read this first.** This repository contains a working application, database, admin/ERP modules, media viewers, publication gates, tests and deployment configuration. It does **not** contain invented products, prices, stock, warranties, customer reviews, licensed manufacturer media or registered domains. The live catalogue therefore currently has **0 published products** — that is the intended, enforced behaviour, not an unfinished homepage. See [FINAL_REPORT.md](FINAL_REPORT.md) for the exact status of every feature.

## Quick start (Node.js ≥ 22.5)

```bash
npm install
cp .env.example .env.local         # set APP_SECRET and other values
npm run db:setup                   # apply migrations + seed baseline config
npm run dev                        # http://localhost:3000
```

The database is created automatically at `DATABASE_PATH` (default `./data/app.db`) on first use — no external database service is required for local development. On first seed, a super-admin account is created:

- email: `admin@thedreamerit.local` (override with `BOOTSTRAP_ADMIN_EMAIL`)
- password: `BOOTSTRAP_ADMIN_PASSWORD`, or a random password written to `data/bootstrap-credentials.txt` (mode 0600, git-ignored)

Change that password at **Admin → Security** immediately and enable TOTP MFA there.

Production:

```bash
npm run build && npm run start -- -p 3000
curl http://localhost:3000/api/health
```

## What is actually implemented

| Area | Where |
| --- | --- |
| 74-table relational schema, migrations, indexes, FKs, constraints | `db/migrations/001_schema.sql`, `src/lib/server/database.ts` |
| Authentication, scrypt hashing, sessions, RBAC (8 roles / 35 permissions), CSRF, rate limiting, TOTP MFA, audit log | `src/lib/server/auth.ts`, `src/lib/core/password.ts`, `src/lib/core/totp.ts` |
| Catalogue rules: 15 distinct verified models per activated category, duplicate/variant handling, publication gate | `src/lib/core/catalogue-rules.ts`, `src/lib/server/catalogue.ts` |
| Product admin: specs, variants, SKU/barcode, bulk JSON import/export, revisions, archive, price floor & approval, SEO validation | `src/app/(admin)/admin/products/**`, `src/app/actions/catalogue.ts` |
| Media admin: validated uploads, GLB/glTF, 360° frames, video, provenance, licensing, permission, review, primary/reorder, failed jobs | `src/app/(admin)/admin/media/page.tsx`, `src/app/actions/media.ts`, `src/app/media/[file]/route.ts` |
| Real Three.js/WebGL 3D viewer and drag/swipe 360° viewer, full-screen, zoom, keyboard/touch, lazy loading, explicit fallback | `src/components/three-viewer.tsx`, `src/components/spin-360-viewer.tsx`, `src/components/product-media-gallery.tsx` |
| 9-section individual product page with Product/Breadcrumb structured data, canonical, OG, reviews/Q&A empty states, trust & support | `src/app/(site)/products/[slug]/page.tsx` |
| Public storefront: catalogue, categories, brands, filters/sort/compare/search, cart, checkout, accounts, orders, wishlist, warranty, returns, policies, contact, FAQ | `src/app/(site)/**` |
| Inventory with `BEGIN IMMEDIATE` transactions (no overselling), branches, warehouses, transfers, receipts, serials, low-stock, valuation | `src/lib/server/inventory.ts`, `src/app/(admin)/admin/inventory/page.tsx` |
| Procurement, suppliers, purchase orders, invoices, landed cost, outstanding balances | `src/app/(admin)/admin/operations/page.tsx` |
| POS, order state machine, verified payments, refunds, returns, commissions, cash reconciliation | `src/lib/server/orders.ts`, `src/app/(admin)/admin/pos/**`, `src/app/(admin)/admin/orders/**` |
| Employees, attendance, shifts, commission rules, payroll exports | `src/app/(admin)/admin/employees/page.tsx` |
| CRM: customers, leads, tickets, follow-ups, communications, consent, segments, preferences | `src/app/(admin)/admin/crm/page.tsx` |
| AI Content Studio (Bangla/English), verified-field-only drafts, optional AI provider, no-fabrication check, revision history, human approval | `src/lib/core/content-rules.ts`, `src/lib/server/content.ts`, `src/app/(admin)/admin/content/page.tsx` |
| SEO automation: sitemap, robots, canonical, metadata validation, duplicate/broken-link checks, redirects | `src/lib/server/seo.ts`, `src/app/(admin)/admin/seo/page.tsx` |
| Social publishing workflow: approval → submit → **platform confirmation required** before `published` | `src/lib/server/social.ts`, `src/app/(admin)/admin/social/page.tsx` |
| Super Admin dashboard computed from actual DB records, health endpoint, failed-job monitoring, backups with checksum + tested restore | `src/lib/server/dashboard.ts`, `src/lib/server/monitoring.ts`, `src/lib/server/backup.ts`, `scripts/` |

## Non-negotiable rules enforced in code

- **15 verified distinct models per activated category**; demo records, duplicate SKUs/models and variants never count. The catalogue is never reported complete when an activated category is short.
- **Publication gate**: model verification + source, SKU/MPN, individual page, licensed & reviewed media, category-appropriate verified specs, verified price source (or no price), real inventory record, reviewed SEO fields and recorded human approval — all must pass.
- **No fabricated facts**: no invented models, specs, prices, stock, warranties, ratings or reviews. Structured data omits price/availability/`aggregateRating` unless verified.
- **Media honesty**: a static gallery is never called a 3D model or a 360° viewer; a 360° sequence is never called a 3D model; a 3D model is never presented as a generic stand-in for an exact manufacturer product.
- **Payments**: an order is only `paid` after a verified payment event (or authorized cash reconciliation). Revenue is never reported as profit.
- **Social posts**: never `published` without a recorded platform response.

## Verification status (short)

| Check | Result |
| --- | --- |
| `npm test` (node:test, 24 tests) | 24 pass, 0 fail |
| `npm run typecheck` | clean |
| `npm run lint` | no warnings or errors |
| `npm run build` | Next.js 15.5.28 production build succeeded, 53 routes |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Runtime smoke test | 25 public + 18 admin routes, `/api/health`, sitemap/robots, CSRF-protected server actions, publication-gate rejection — see `TEST_RESULTS.md` |
| Backup / restore | checksum verified, `PRAGMA integrity_check=ok`, 74 tables restored into a scratch database |

Not verified: browser rendering of a real product-specific GLB/glTF asset or 360° image sequence (no licensed product-specific assets exist yet), and any external platform API behaviour (no owner credentials).

## Documentation

| File | Purpose |
| --- | --- |
| [FINAL_REPORT.md](FINAL_REPORT.md) | Final verification report — every feature, every gap, every owner dependency |
| [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) | Per-feature status matrix |
| [TEST_RESULTS.md](TEST_RESULTS.md) | Actual command output and smoke-test results |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment, reverse proxy, rollback |
| [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) | Phased production plan and owner decisions |
| [docs/API.md](docs/API.md) | HTTP endpoints, server actions and data-import contract |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables and secret handling |
| [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) | Backup, integrity, tested restore |
| [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) | Security controls and residual risks |
| [docs/OUTSTANDING_DEPENDENCIES.md](docs/OUTSTANDING_DEPENDENCIES.md) | Everything needing owner credentials or authorized data |
| [worklog.md](worklog.md) | Implementation log |

## Domain note

Proposed domains: `thedreamerit.com`, `dreamerit.com.bd`. **Neither is registered by this project.** A registrar WHOIS page reported `thedreamerit.com` as unregistered on 2026-11-02, but the page was partly behind a bot check and is not an authoritative registry result; the `.com.bd` zone was not supported by that WHOIS service. Definitive availability checks and registration require the owner.

## Outstanding owner dependencies (summary)

Authorized manufacturer/distributor product data + licensed media (to reach 15 verified models per activated category), domain registration, payment gateway, Facebook/Instagram/YouTube/WhatsApp Business credentials, SMTP, Google Search Console/Analytics, off-site backup storage, AI provider key (optional), and confirmation of which categories/branch stock are real. Full list: [docs/OUTSTANDING_DEPENDENCIES.md](docs/OUTSTANDING_DEPENDENCIES.md).
