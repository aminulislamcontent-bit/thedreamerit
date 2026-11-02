# Environment & secrets

Copy `.env.example` to `.env.local`. **Never commit `.env`, `.env.local`, `data/*.db`, `data/bootstrap-credentials.txt`, `uploads/` or `backups/`** — all are in `.gitignore`.

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `DATABASE_PATH` | no | SQLite file path (absolute or relative to the app root) | `./data/app.db` |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical/sitemap/structured-data base URL | `http://localhost:3000` |
| `APP_SECRET` | production | Server-side integrity token seed; generate with `openssl rand -hex 32` | unset (dev fallback) |
| `CATALOGUE_MODE` | no | `live` keeps drafts/demo records off the public site | `live` |
| `BOOTSTRAP_ADMIN_EMAIL` | no | Email of the first super admin | `admin@thedreamerit.local` |
| `BOOTSTRAP_ADMIN_PASSWORD` | production | Password of the first super admin. If unset, a random password is written to `data/bootstrap-credentials.txt` (mode 0600) | random |
| `AI_PROVIDER_API_KEY`, `AI_PROVIDER_MODEL`, `AI_PROVIDER_BASE_URL` | no | Optional OpenAI-compatible rewording of verified facts. Without a key, the local verified-field-only template engine is used and drafts are labelled `template` | unset |
| `FACEBOOK_PAGE_TOKEN` | no | Facebook Pages Graph API publishing | unset → jobs fail explicitly |
| `INSTAGRAM_BUSINESS_TOKEN` | no | Instagram Graph API publishing | unset → jobs fail explicitly |
| `YOUTUBE_API_KEY` | no | YouTube Data API publishing | unset → jobs fail explicitly |
| `WHATSAPP_BUSINESS_TOKEN` | no | WhatsApp Business Cloud API | unset → jobs fail explicitly |
| `PAYMENT_GATEWAY_KEY`, `PAYMENT_GATEWAY_SECRET` | no | Merchant payment gateway | unset |
| `SMTP_URL` | no | Transactional email | unset |
| `GOOGLE_SEARCH_CONSOLE_CREDENTIALS`, `GA_MEASUREMENT_ID` | no | Search Console / Analytics | unset |
| `OFFSITE_BACKUP_TARGET` | no | Encrypted external backup target | unset |

## Secret handling rules

1. No private key, database credential or privileged token is placed in frontend code, `NEXT_PUBLIC_*` variables, source control, logs or the audit log.
2. `GET /admin/settings` shows **only whether** a variable is set, never its value.
3. Passwords are scrypt-hashed with a per-user random salt; sessions store only a SHA-256 hash of the token.
4. Uploaded files live in `uploads/`; public delivery goes through `/media/[file]`, which requires an approved + permission-granted media record or a `media.view` permission.
5. The bootstrap credentials file must be deleted after first login; `Admin → Security` supports password change and TOTP MFA.
6. Production must set a strong unique `APP_SECRET`, `BOOTSTRAP_ADMIN_PASSWORD`, a real `NEXT_PUBLIC_SITE_URL` and TLS termination before exposing the app.
