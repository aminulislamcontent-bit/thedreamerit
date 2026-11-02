# Outstanding dependencies — what genuinely needs the owner

Everything below is **not configured, not purchased, not registered and not claimed as working**. The application records each item as `not_configured` / `not_connected` and fails loudly rather than pretending.

## 1. Authorized product data (the largest blocker)

| Need | Why it blocks |
| --- | --- |
| Manufacturer documentation or authorized distributor feeds for real model names and specifications | The spec forbids inventing real products/specs. Currently **0 verified models** exist; every activated category needs ≥15 distinct verified models → shortfall **15 per activated category**. |
| Authorized price sources | Prices are hidden until a named source + URL is recorded. |
| Licensed, product-specific high-resolution photographs, product videos, 360° sequences and GLB/glTF assets | Media checks must pass before publication; no such assets exist. |
| Verified warranty/return terms and actual branch stock | No stock or warranty is claimed without a real record. |
| Written confirmation of which of the 105 proposed categories the shop actually sells | All 105 are kept **inactive (proposed)** to avoid claiming stock that may not exist. Activating a category triggers the 15-model requirement. |

Until this data arrives, the honest state is: **0 published products, 105 proposed categories, 0 activated categories, 3 explicitly labelled demo records.**

## 2. Domains, hosting, DNS

- `thedreamerit.com`, `dreamerit.com.bd` — **not registered**. A registrar WHOIS page reported the `.com` name as unregistered on 2026-11-02 but was partly behind a bot check; `.com.bd` was unsupported by that WHOIS service. An authoritative registry/registrar check and the purchase require the owner.
- Hosting/VPS, TLS certificate, `NEXT_PUBLIC_SITE_URL`, DNS records and production secrets are owner decisions.

## 3. External platform credentials (official APIs only)

| Integration | Required authorization |
| --- | --- |
| Facebook Pages | Owner-authorized Page access token + app review |
| Instagram | Owner-authorized professional/business account + Graph API token |
| YouTube | Owner OAuth credentials for the authorized channel |
| WhatsApp Business | Owner-authorized business account + phone number + Cloud API token |
| Payment gateway | Merchant account + API keys; a real gateway event is required before an order is `paid` |
| SMTP / email | Authorized mail transport credentials |
| Google Search Console | Owner-verified property + service credentials |
| Google Analytics | Measurement ID supplied by the owner |
| AI provider | Optional API key; without it, drafts use the local verified-field template engine |
| Off-site backup | Owner-provided encrypted storage destination |

Social jobs currently fail with an explicit reason and are recorded in `failed_jobs`; no post is ever reported as published without a platform response.

## 4. Business confirmations

- Delivery areas, delivery charges, delivery SLAs, opening hours, return windows, shop-level policies and legal text (the current policy pages are clearly labelled as frameworks pending owner approval).
- Employee/HR data, commission policy approval, supplier contracts, purchase records, customer consent records, actual operating expenses (needed before net profit can be reported).

## 5. Technical work still outstanding

- Postgres/Supabase production port + migrations + `pg_dump`/`pg_restore` procedure.
- Automated browser E2E tests for the WebGL/360°/video/lightbox interactions with real licensed assets.
- WAF, IP allow-listing for `/admin`, and a production host with real TLS/DNS. The app now emits nonce CSP/HSTS/security headers, but these still need browser and proxy verification in the real deployment.
- Off-site encrypted backup upload, retention automation, alert delivery and a production-host restore rehearsal. The local backup, integrity check and scratch-restore paths are verified.
- Search Console/Analytics/Click-tracking reporting integrations.
- A built and runtime-tested container image. `Dockerfile`, `.dockerignore` and `docker-compose.yml` are supplied but Docker was unavailable in this sandbox, so the image was not built here.
- Real licensed product media to exercise the verified WebP derivative pipeline beyond its synthetic, non-product test fixture.

Implemented in the continuation: DB-locked scheduled maintenance jobs, internal/external runner options, responsive WebP derivative generation for approved/licensed images, nonce CSP/HSTS response headers, CI workflow and container configuration. Those additions do not supply catalogue data, domains, payment/social credentials or a production database.

## 6. Repository merge decision (owner)

`main` now contains a separate 221-file Next.js 16 / Prisma project pushed by `alaminiubateee969-cmd` (`4a90c8b`) with unrelated Git history. This branch contains the no-fabrication, verification-gated implementation. PR #1 is `CONFLICTING` / `DIRTY`. The owner must choose which codebase is canonical, or explicitly approve archiving one under a labelled `legacy/` path, before any merge. No destructive conflict resolution was performed.
