# Deployment & completion plan

Phase 0 (done in this repository): architecture, schema, RBAC, catalogue rules, media viewers, publication gates, inventory, procurement, POS/orders, HR/commission, CRM, AI content, SEO, social workflow, dashboards, backups, tests, docs, production build, runtime smoke test.

Phase 1 — Owner decisions (blocking):
1. Verify and register the chosen domain at an authoritative registrar (`thedreamerit.com`, `dreamerit.com.bd`). **Not done.**
2. Confirm which categories the shop actually stocks; activate only those in `Admin → Catalogue`. Each activation creates a hard requirement of 15 distinct verified models.
3. Provide authorized manufacturer/distributor documentation, price lists, licensed media and actual branch stock.
4. Choose production database: single-node SQLite (current) or Postgres/Supabase (port required).
5. Approve delivery, returns, warranty, terms and privacy text, delivery SLAs and charges.

Phase 2 — Data onboarding:
1. Import product records via `Admin → Products → Bulk import` (JSON contract in `docs/API.md`) with source URLs; all records start as unverified drafts.
2. Verify each model, each category-appropriate specification, price source, warranty and SEO field with recorded sources and human approval.
3. Upload/approve licensed media: primary image, multiple angles, ports, video where available, 360° sequence or product-specific GLB/glTF. Record source + licence + review status.
4. Receive real stock into branches/warehouses with serial numbers; no stock is claimed before a receiving record exists.
5. Publish only after the gate passes; confirm `Admin → Catalogue` shows 0 missing models and complete media/SEO for every published product.

Phase 3 — Integrations (each needs owner credentials):
Payment gateway → SMTP → Search Console/Analytics → Facebook/Instagram/YouTube/WhatsApp → optional AI provider → off-site backup. Verify each with a real API call; do not mark a post published without platform confirmation.

Phase 4 — Hardening & launch:
TLS/CSP/HSTS, security headers, process manager, scheduled backups with tested restores, browser E2E tests with real assets, load test, rollback rehearsal, then go-live.

Phase 5 — Reporting:
Update `FINAL_REPORT.md`, `TEST_RESULTS.md` and `docs/PRODUCTION_READINESS.md` with the results of the real-data verification. Until Phase 2 is complete, the catalogue must be reported as incomplete.
