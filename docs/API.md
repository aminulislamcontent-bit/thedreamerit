# API, server actions & data contracts

## HTTP endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Health JSON: DB reachability, open failed jobs, last backup, integration status, and `scheduler` job/last-run state |
| POST | `/api/cart` | public, rate limited (60/min/IP) | `{productId, quantity}` — adds only published products with a verified price and real stock |
| POST | `/api/wishlist` | session | `{productId}` — saves to the signed-in user's wishlist |
| POST | `/api/logout` | session | Revokes the session, clears cookies, 303 → `/` |
| GET | `/media/[file]` | public only when the original media record is `approved` + permission `granted`; otherwise `media.view` permission | Serves uploaded product media and generated WebP derivatives with strict filename validation and `nosniff`; a derivative inherits its original record's approval |
| GET | `/sitemap.xml` | public | Static paths + published & indexable products only |
| GET | `/robots.txt` | public | Disallows `/admin/`, `/account/`, `/api/`; advertises sitemap |

All JSON endpoints validate input, return structured errors, and never expose secrets.

## Server actions

Every privileged action calls `guard(formData, permission)` → `requirePermission()` (server-side RBAC) + `requireCsrf()` (double-submit cookie), records an audit event, and redirects with `?ok=` / `?error=`. Public forms are rate limited and honeypot-checked.

| Group | File | Actions |
| --- | --- | --- |
| Auth | `src/app/actions/auth.ts` | `loginAction`, `registerAction`, `logoutAction`, `setupMfaAction`, `disableMfaAction`, `changePasswordAction` |
| Catalogue | `src/app/actions/catalogue.ts` | create/update/verify/archive product, seed spec template, upsert spec, set price, set minimum price, save SEO, publish/unpublish (gated), JSON bulk import, add brand, activate category, create variant |
| Media | `src/app/actions/media.ts` | upload file, import URL, grant permission, approve/reject, set primary, remove |
| Inventory / operations | `src/app/actions/operations.ts` | goods receiving, branch transfer, adjustment, reorder threshold, branch/warehouse/supplier/purchase order/invoice creation |
| Orders / HR | `src/app/actions/orders.ts` | POS order, verified payment, state transition, return/refund, attendance, employee, commission rule, payroll export |
| Content / SEO / social / backups / CRM | `src/app/actions/content.ts` | draft generation, review, publishing job create/approve/submit/confirm, SEO checks, redirects, backup create/verify, failed-job resolution, lead/ticket/consent |
| Customer | `src/app/actions/customer.ts` | cart add/remove, checkout, wishlist, warranty/return/support requests, preferences, contact enquiry, admin order note |

## Bulk import contract (JSON array)

Each record is validated by `productImportSchema` (`src/lib/core/validation.ts`) before insertion:

```json
[{
  "slug": "example-model-14",
  "brandSlug": "lenovo",
  "categorySlug": "business-laptops",
  "modelName": "Example Model 14",
  "sku": "EX-14-001",
  "mpn": "EX14-001",
  "sourceName": "Manufacturer product documentation",
  "sourceUrl": "https://manufacturer.example/specs/ex-14",
  "verificationStatus": "unverified",
  "priceAmount": null,
  "priceSourceUrl": "",
  "isDemo": false,
  "specs": [
    { "specKey": "Processor and generation", "specValue": "…", "unit": "", "verified": false, "sourceUrl": "" }
  ]
}]
```

Rules:

- `sourceUrl` and `sourceName` are mandatory; a verified spec requires its own `sourceUrl`.
- `priceAmount` is integer **poysha** (100 = 1 BDT); a non-null price requires an authorized `priceSourceUrl`.
- Imported records always start as `status=draft`, `verification_status=unverified`, and are never auto-published.
- Duplicate SKUs or duplicate `(brand, model)` pairs are rejected and reported.
- `isDemo: true` records are explicitly labelled and excluded from the live catalogue and from the 15-model count.

`npm run export:catalogue` writes `data/catalogue-export.csv` with verification state, source fields, verified-spec count and approved-media count for review.

## Order / payment rules

- `POST /api/cart` accepts only published, non-demo products with a verified, sourced price and verified stock.
- Order creation reserves stock with `BEGIN IMMEDIATE`; an oversell attempt throws and rolls back.
- `verifyPaymentAction` requires a gateway event id or an authorized cash reconciliation; the order becomes `paid` only when verified payments cover the total.
- Returns/cancellations/refunds release reservations and reverse accrued commissions.
- Valid transitions: `draft → pending_payment|cancelled`, `pending_payment → paid|cancelled`, `paid → processing|refunded|cancelled`, `processing → shipped|cancelled|refunded`, `shipped → delivered|returned`, `delivered → returned`, `returned → refunded`.

## Public page routes

`/`, `/products`, `/products/[slug]`, `/categories`, `/categories/[slug]`, `/brands/[slug]`, `/compare`, `/search`, `/configurator`, `/cart`, `/checkout`, `/login`, `/register`, `/account`, `/account/orders`, `/account/orders/[id]`, `/account/wishlist`, `/account/warranty`, `/account/returns`, `/contact`, `/about`, `/guides`, `/blog`, `/faq`, `/policies/{delivery,returns,terms,privacy}`.

`/admin/**` (18 pages) requires a session with at least one staff permission.
