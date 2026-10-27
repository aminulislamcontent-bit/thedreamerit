# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Domain Registration
Register one of these domains (verify availability at a registrar first):
- **Primary**: `thedreamerit.com`
- **Alternative**: `dreamerit.com.bd`

Recommended registrars for Bangladesh:
- Namecheap (international)
- GoDaddy (international)
- Hostinger BD (local support)
- ExonHost (Bangladesh-based)

### 2. Hosting Options

#### Option A: Vercel (Recommended)
- Best for Next.js apps
- Free SSL certificate
- Auto-deploy from Git
- Global CDN
- Pricing: Free tier sufficient to start, Pro plan $20/month

**Steps:**
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
5. Add custom domain
6. Configure DNS (Vercel provides records)

#### Option B: VPS (DigitalOcean, Linode, AWS Lightsail)
- More control, lower cost at scale
- Requires manual setup
- Pricing: $5-20/month

**Steps:**
1. Provision Ubuntu 22.04+ VPS
2. Install Node.js 20+, Bun, Nginx, PostgreSQL
3. Clone repo, install deps
4. Configure Nginx reverse proxy
5. Set up SSL with Let's Encrypt
6. Configure firewall (ufw)
7. Set up PM2 or systemd for process management

### 3. Database Setup (PostgreSQL for Production)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE dreamer_it_prod;
CREATE USER dreamer_it_user WITH PASSWORD 'strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE dreamer_it_prod TO dreamer_it_user;
ALTER USER dreamer_it_user CREATEDB;
\q
```

Update `.env`:
```env
DATABASE_URL="postgresql://dreamer_it_user:strong-password-here@localhost:5432/dreamer_it_prod?schema=public"
```

### 4. Initial Deployment Steps

```bash
# Clone repo
git clone <your-repo-url>
cd thedreamerit

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push schema to production DB
bun run db:push

# Run seed (creates admin user, branches, roles, categories)
bun run scripts/seed.ts

# IMPORTANT: Change admin password after first login!

# Build for production
bun run build

# Start production server
bun run start
```

### 5. SSL Configuration

#### On Vercel:
- Automatic with Let's Encrypt

#### On VPS (Nginx + Certbot):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d thedreamerit.com -d www.thedreamerit.com
```

### 6. DNS Configuration

Add these DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | Your server IP (or Vercel IP) |
| A | www | Your server IP |
| CNAME | www | thedreamerit.com (if using Vercel) |
| MX | @ | mail.your-email-provider.com (for email) |
| TXT | @ | `v=spf1 include:_spf.your-email-provider.com ~all` (SPF) |
| TXT | _dmarc | `v=DMARC1; p=quarantine; rua=mailto:admin@thedreamerit.com` (DMARC) |

### 7. Email Setup

For transactional emails (order confirmations, password resets):

#### Option A: Resend (Recommended, easy)
1. Sign up at resend.com
2. Verify your domain
3. Get API key
4. Add to `.env`: `RESEND_API_KEY=...`

#### Option B: SendGrid
1. Sign up at sendgrid.com
2. Verify domain (add DNS records)
3. Create API key
4. Add to `.env`: `SENDGRID_API_KEY=...`

### 8. Payment Gateway Integration

#### bKash Merchant
1. Apply at https://merchant.bkash.com/
2. Get merchant account approved (requires business docs)
3. Get API credentials from bKash
4. Add to `.env`: `BKASH_APP_KEY=...`, `BKASH_APP_SECRET=...`

#### Nagad Merchant
1. Apply at Nagad merchant portal
2. Get API credentials
3. Add to `.env`: `NAGAD_MERCHANT_ID=...`

#### SSL Commerz (for cards)
1. Sign up at sslcommerz.com
2. Get Store ID and Password
3. Add to `.env`: `SSLCZ_STORE_ID=...`

### 9. Social Media API Setup

#### Facebook Pages API
1. Go to https://developers.facebook.com/
2. Create a new app
3. Add "Pages" product
4. Get Page Access Token (long-lived)
5. Submit for review (required for publishing permissions)
6. Add to `.env`: `FACEBOOK_APP_ID=...`, `FACEBOOK_PAGE_ACCESS_TOKEN=...`

#### Instagram Business API
1. Connect Instagram Business account to Facebook Page
2. Use Meta Graph API to get access token
3. Submit for review
4. Add to `.env`: `INSTAGRAM_BUSINESS_ACCOUNT_ID=...`

#### WhatsApp Business API
1. Apply at https://business.whatsapp.com/
2. Get Meta Business account approved
3. Verify business (requires docs)
4. Get phone number and access token
5. Add to `.env`: `WHATSAPP_PHONE_NUMBER_ID=...`

### 10. Backup Configuration

#### Automated Daily Backups (Cron)
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /home/youruser/thedreamerit && bun run scripts/backup.ts >> /var/log/dreamer-backup.log 2>&1
```

#### Offsite Backup (AWS S3)
```bash
# Install AWS CLI
sudo apt install awscli

# Configure
aws configure

# Add to crontab
30 2 * * * aws s3 sync /home/youruser/thedreamerit/backups s3://your-backup-bucket/dreamer-it/$(date +\%Y/\%m/\%d)/
```

### 11. Monitoring Setup

#### Uptime Monitoring
- Sign up at UptimeRobot (free)
- Add monitor for `https://thedreamerit.com`
- Add monitor for `https://thedreamerit.com/api/health`
- Set up alerts (email/SMS)

#### Error Tracking (Sentry)
1. Sign up at sentry.io
2. Create new Next.js project
3. Get DSN
4. Add to `.env`: `SENTRY_DSN=...`
5. Install Sentry SDK (already configured in Next.js)

### 12. Performance Optimization

#### Enable Compression (Nginx)
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
gzip_min_length 1000;
```

#### Enable Caching (Nginx)
```nginx
location /_next/static/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

#### Image Optimization
- Next.js Image component is used (automatic optimization)
- For uploads, use Sharp (already installed)

### 13. Post-Deployment Verification

After deployment, verify:

- [ ] Site loads at https://thedreamerit.com
- [ ] SSL certificate is valid (https://www.ssllabs.com/ssltest/)
- [ ] Admin login works (admin@thedreamerit.com / changed password)
- [ ] Customer can register and login
- [ ] Product catalog loads
- [ ] Cart and checkout work end-to-end
- [ ] Order confirmation email is received
- [ ] Payment gateway redirect works
- [ ] Admin dashboard shows real data
- [ ] Backup runs on schedule
- [ ] Uptime monitor is reporting
- [ ] Google Search Console can verify domain
- [ ] Sitemap is accessible at /sitemap.xml

### 14. Rollback Procedure

If deployment fails:

```bash
# Stop current server
pm2 stop dreamer-it

# Revert code
git reset --hard HEAD~1

# Revert database (if migrations were run)
psql dreamer_it_prod < backups/pre-deploy-backup.sql

# Restart
bun run build
pm2 start dreamer-it
```

### 15. Maintenance Mode

To temporarily take the site offline:

```bash
# Create maintenance page
echo "Site under maintenance. Back soon." > public/maintenance.html

# Nginx config:
# location / {
#   if -f $document_root/maintenance.html {
#     return 503;
#   }
#   try_files $uri $uri/ /index.html;
# }
# error_page 503 @maintenance;
# location @maintenance {
#   rewrite ^(.*)$ /maintenance.html break;
# }
```

## Security Hardening

### 1. Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw enable
```

### 2. SSH Key Auth
```bash
# Disable password auth
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 3. Fail2Ban (against brute force)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Automatic Security Updates
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 5. Database Security
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Edit pg_hba.conf - require password auth
sudo nano /etc/postgresql/15/main/pg_hba.conf
# host all all 127.0.0.1/32 md5

sudo systemctl restart postgresql
```

## Compliance Notes

### Bangladesh-Specific Requirements
- **VAT Registration**: Register with NBR if annual revenue exceeds BDT 50 lakh
- **Trade License**: Required (already obtained at ICT Bhaban)
- **TIN**: Required for tax filing
- **BIN (Business Identification Number)**: Required for VAT
- **Data Protection**: Currently no comprehensive law, but follow ICT Act 2006

### Recommended: Have an accountant review
- Tax calculation logic
- VAT handling (15% standard rate in Bangladesh)
- Financial reports (P&L, Balance Sheet)
- Invoice format compliance

### Recommended: Have a lawyer review
- Terms & Conditions
- Privacy Policy
- Refund Policy
- Warranty terms

## Support Contacts

- **Email**: thedreameritexpress@gmail.com
- **Phone**: 01610111688
- **Address**: Shop 104 & 105, Subastu Arcade, ICT Bhaban, Dhaka, Bangladesh

---

**This deployment guide is a living document. Update it as you encounter new requirements during actual deployment.**
