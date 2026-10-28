# দ্য ড্রিমার আইটি এক্সপ্রেস — ডিপ্লয়মেন্ট প্ল্যান

> `thedreamerit.com` ডোমেইনে প্রজেক্ট লাইভ করার সম্পূর্ণ গাইড

## 📋 সারাংশ

এই ডকুমেন্টে বর্ণিত আছে কীভাবে The Dreamer IT Express প্ল্যাটফর্মটি `thedreamerit.com` ডোমেইনে লাইভ করবেন, কোন হোস্টিং ব্যবহার করবেন, এবং AI এজেন্টগুলো কীভাবে কাজ করবে।

---

## 🏗️ হোস্টিং অপশন তুলনা

### অপশন ১: Vercel (সর্বাধিক সুপারিশকৃত) ⭐

**সুবিধা:**
- ✅ Next.js এর জন্য সবচেয়ে ভালো (Vercel ই Next.js এর নির্মাতা)
- ✅ ফ্রি SSL সার্টিফিকেট (স্বয়ংক্রিয়)
- ✅ গ্লোবাল CDN (দ্রুত লোডিং)
- ✅ Git থেকে অটো-ডিপ্লয়
- ✅ প্রিভিউ ডিপ্লয়মেন্ট (প্রতিটি PR এর জন্য)
- ✅ ফ্রি টিয়ারে পর্যাপ্ত (Hobby plan)
- ✅ কোনো সার্ভার ম্যানেজমেন্ট লাগে না

**অসুবিধা:**
- ❌ SQLite সাপোর্ট করে না (PostgreSQL ব্যবহার করতে হবে)
- ❌ ফাইল আপলোড স্টোরেজ নেই (S3/Cloudinary লাগবে)
- ❌ লং-রানিং প্রসেস (AI ভিডিও জেনারেশন) টাইমআউট হতে পারে

**খরচ:**
- Hobby (ফ্রি): পর্যাপ্ত শুরুর জন্য
- Pro ($20/মাস): বেশি ট্রাফিকের জন্য

**যাদের জন্য:** যারা টেকনিক্যালি সাবলীল নন, ঝামেলা ছাড়াই দ্রুত লাইভ করতে চান

---

### অপশন ২: VPS (ভার্চুয়াল প্রাইভেট সার্ভার) ⭐⭐

**সুবিধা:**
- ✅ সম্পূর্ণ নিয়ন্ত্রণ
- ✅ SQLite বা PostgreSQL যেকোনো ডাটাবেস
- ✅ ফাইল আপলোড লোকাল স্টোরেজ
- ✅ AI এজেন্টগুলো ব্যাকগ্রাউন্ডে চলতে পারে
- ✅ কাস্টম ক্রন জব (ব্যাকআপ, সিঙ্ক)
- ✅ কম খরচে বেশি রিসোর্স

**অসুবিধা:**
- ❌ সার্ভার ম্যানেজমেন্ট করতে হবে
- ❌ SSL ম্যানুয়ালি সেটআপ (Let's Encrypt)
- ❌ সিকিউরিটি নিজে নিশ্চিত করতে হবে
- ❌ ব্যাকআপ নিজে কনফিগার করতে হবে

**খরচ:**
- DigitalOcean Droplet: $6-12/মাস (১GB RAM)
- Linode/Akamai: $5-12/মাস
- AWS Lightsail: $5-10/মাস
- বাংলাদেশি প্রোভাইডার (HostBD, ExonHost): ৳৫০০-১৫০০/মাস

**যাদের জন্য:** যাদের কাছে টেকনিক্যাল জ্ঞান আছে বা ডেভেলপার ভাড়া করতে পারবেন

**সুপারিশকৃত স্পেকস:**
- Ubuntu 22.04 LTS
- ২GB RAM (ন্যূনতম), ৪GB (সুপারিশকৃত)
- ২ vCPU
- ৫০GB SSD
- ঢাকা বা নিকটবর্তী লোকেশন

---

### অপশন ৩: শেয়ার্ড হোস্টিং ⚠️ (সুপারিশকৃত নয়)

**সুবিধা:**
- ✅ সস্তা (৳২০০-৫০০/মাস)
- ✅ cPanel দিয়ে সহজ ম্যানেজমেন্ট
- ✅ কোনো সার্ভার সেটআপ লাগে না

**অসুবিধা:**
- ❌ **Node.js সাপোর্ট সীমিত** (বেশিরভাগ শেয়ার্ড হোস্টিং PHP-তে ভালো)
- ❌ Next.js সরাসরি চলে না (workaround লাগে)
- ❌ SQLite ফাইল লকিং সমস্যা
- ❌ রিসোর্স লিমিট (CPU, RAM, প্রসেস টাইম)
- ❌ AI এজেন্টগুলো ব্যাকগ্রাউন্ডে চলবে না
- ❌ ক্রন জব সীমিত
- ❌ SSH অ্যাক্সেস সীমিত

**খরচ:** ৳২০০-১০০০/মাস

**যদি শেয়ার্ড হোস্টিং ব্যবহার করতেই হয়:**
- Hostinger VPS প্ল্যান (শেয়ার্ড নয়, কিন্তু সস্তা VPS)
- অথবা Namecheap VPS
- অথবা বাংলাদেশি প্রোভাইডারের VPS প্ল্যান

---

## 🎯 সুপারিশকৃত সেটআপ (আমাদের সাজেশন)

### সেরা অপশন: Vercel + Vercel Postgres + Cloudinary

```
Frontend + API:  Vercel (ফ্রি Hobby plan)
Database:        Vercel Postgres ($10/মাস) অথবা Supabase (ফ্রি)
File Storage:    Cloudinary (ফ্রি 25GB)
Email:           Resend (ফ্রি 3000/মাস)
Domain:          thedreamerit.com (Namecheap থেকে ~$10/বছর)
SSL:             স্বয়ংক্রিয় (Vercel)

মোট মাসিক খরচ: $0-15 (প্রথম বছর)
```

### বিকল্প সেরা অপশন: VPS (DigitalOcean/HostBD)

```
Server:          Ubuntu 22.04 VPS (২GB RAM)
Database:        PostgreSQL 15 (ইনস্টল করা)
File Storage:    লোকাল + S3 ব্যাকআপ
Email:           Resend বা SMTP
Domain:          thedreamerit.com
SSL:             Let's Encrypt (ফ্রি)
Process Mgr:     PM2
Reverse Proxy:   Nginx

মোট মাসিক খরচ: $6-12 (ঢাকা লোকেশন)
```

---

## 📝 ডিপ্লয়মেন্ট ধাপসমূহ

### ধাপ ১: ডোমেইন নিবন্ধন

1. **Namecheap** (namecheap.com) এ যান
2. `thedreamerit.com` সার্চ করো
3. ডোমেইন কেনো (~$10-12/বছর)
4. অথবা **Hostinger** থেকে কিনুন (বাংলাদেশ সাপোর্ট আছে)

**বিকল্প ডোমেইন:**
- `dreamerit.com.bd` (BTCL থেকে, বাংলাদেশি ডোমেইন)
- `dreameritexpress.com`

---

### ধাপ ২: হোস্টিং সেটআপ

#### যদি Vercel ব্যবহার করেন:

1. **vercel.com** এ সাইন আপ করুন (GitHub দিয়ে)
2. **"New Project"** ক্লিক করুন
3. GitHub রিপোজিটরি কানেক্ট করুন
4. ফ্রেমওয়ার্ক: Next.js (অটো-ডিটেক্ট হবে)
5. Environment Variables যোগ করুন (নিচে দেখুন)
6. **"Deploy"** ক্লিক করুন
7. ডিপ্লয় হওয়ার পর Settings → Domains এ যান
8. `thedreamerit.com` যোগ করুন
9. DNS রেকর্ড আপডেট করুন (Vercel নির্দেশনা দেবে)

#### যদি VPS ব্যবহার করেন:

1. **DigitalOcean/Hetzner/HostBD** থেকে VPS ক্রয় করুন
2. Ubuntu 22.04 ইনস্টল করুন
3. SSH দিয়ে কানেক্ট করুন
4. নিচের কমান্ডগুলো চালান:

```bash
# Node.js 20+ ইনস্টল
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Bun ইনস্টল
curl -fsSL https://bun.sh/install | bash

# PostgreSQL ইনস্টল
sudo apt install -y postgresql postgresql-contrib

# Nginx ইনস্টল
sudo apt install -y nginx

# PM2 ইনস্টল
sudo npm install -g pm2

# Certbot (SSL) ইনস্টল
sudo apt install -y certbot python3-certbot-nginx

# প্রজেক্ট ক্লোন
git clone <your-repo-url> /var/www/thedreamerit
cd /var/www/thedreamerit

# ডিপেন্ডেন্সি ইনস্টল
bun install

# Environment সেটআপ
cp .env.production .env
nano .env  # ভ্যালু পূরণ করুন

# ডাটাবেস সেটআপ
sudo -u postgres psql
CREATE DATABASE dreamer_it_prod;
CREATE USER dreamer_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE dreamer_it_prod TO dreamer_user;
\q

# Prisma সেটআপ
bun run db:generate
bun run db:push
bun run scripts/seed.ts

# বিল্ড
bun run build

# PM2 দিয়ে চালু
pm2 start "bun run start" --name dreamer-it
pm2 startup
pm2 save

# Nginx কনফিগ
sudo nano /etc/nginx/sites-available/thedreamerit
```

**Nginx কনফিগ ফাইল:**
```nginx
server {
    listen 80;
    server_name thedreamerit.com www.thedreamerit.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # আপলোড সাইজ (ফাইল আপলোডের জন্য)
    client_max_body_size 50M;
}
```

```bash
# Nginx চালু
sudo ln -s /etc/nginx/sites-available/thedreamerit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL ইনস্টল
sudo certbot --nginx -d thedreamerit.com -d www.thedreamerit.com
```

---

### ধাপ ৩: DNS কনফিগারেশন

আপনার ডোমেইন রেজিস্ট্রারে (Namecheap/Hostinger) যান এবং এই DNS রেকর্ড যোগ করুন:

#### যদি Vercel ব্যবহার করেন:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

#### যদি VPS ব্যবহার করেন:

| Type | Name | Value |
|------|------|-------|
| A | @ | আপনার সার্ভার IP |
| A | www | আপনার সার্ভার IP |
| MX | @ | mail.your-email-provider.com |
| TXT | @ | v=spf1 include:_spf.your-email-provider.com ~all |

---

### ধাপ ৪: Environment Variables

`.env.production` ফাইল তৈরি করুন (নিচের টেমপ্লেট দেখুন) এবং সব ভ্যালু পূরণ করুন।

**গুরুত্বপূর্ণ:** এই ফাইলটি কখনো Git-এ কমিট করবেন না!

---

### ধাপ ৫: ডাটাবেস মাইগ্রেশন

#### SQLite থেকে PostgreSQL-এ মাইগ্রেট

```bash
# SQLite থেকে ডেটা এক্সপোর্ট
sqlite3 db/custom.db .dump > backup.sql

# PostgreSQL-এ schema তৈরি
DATABASE_URL="postgresql://..." bun run db:push

# ডেটা ইম্পোর্ট (ম্যানুয়ালি বা স্ক্রিপ্ট দিয়ে)
psql dreamer_it_prod < backup.sql

# যাচাই করুন
psql dreamer_it_prod -c "SELECT COUNT(*) FROM Product;"
```

---

### ধাপ ৬: প্রথম ডিপ্লয় যাচাই

ডিপ্লয় হওয়ার পর এই চেকলিস্ট অনুসরণ করুন:

- [ ] সাইট `https://thedreamerit.com` এ লোড হচ্ছে
- [ ] SSL সার্টিফিকেট ভ্যালিড (https://www.ssllabs.com/ssltest/)
- [ ] অ্যাডমিন লগইন কাজ করছে
- [ ] কাস্টমার রেজিস্ট্রেশন কাজ করছে
- [ ] প্রোডাক্ট ক্যাটালগ দেখাচ্ছে
- [ ] কার্ট + চেকআউট কাজ করছে
- [ ] WhatsApp উইজেট দেখাচ্ছে
- [ ] Google Maps এম্বেড কাজ করছে
- [ ] মোবাইলে রেসপন্সিভ
- [ ] পেজ স্পিড ৩ সেকেন্ডের নিচে

---

## 🤖 AI এজেন্ট কনফিগারেশন

এই প্ল্যাটফর্মে যে সব AI এজেন্ট আছে, সেগুলো কীভাবে কাজ করবে:

### ১. AI প্রোডাক্ট উইজার্ড
- **কী করে:** ছবি + বাংলা ভয়েস থেকে প্রোডাক্ট লিস্টিং তৈরি
- **প্রয়োজন:** Z.ai SDK (ইনস্টল করা আছে)
- **কনফিগ:** কোনো অতিরিক্ত কনফিগ লাগে না

### ২. SEO AI এজেন্ট
- **কী করে:** Google Maps, Local SEO, কিওয়ার্ড ট্র্যাকিং
- **প্রয়োজন:** Google Search Console ভেরিফিকেশন, Google Business Profile
- **কনফিগ:** `GOOGLE_VERIFICATION_CODE` এনভায়রনমেন্ট ভ্যারিয়েবল

### ৩. Marketing AI এজেন্ট
- **কী করে:** ১২টি ফ্রি চ্যানেলে অটো-পোস্ট
- **প্রয়োজন:** Facebook Page Access Token, Instagram Business Account
- **কনফিগ:** `FACEBOOK_PAGE_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`

### ৪. AI ভিডিও স্টুডিও
- **কী করে:** প্রোডাক্ট ভিডিও স্ক্রিপ্ট ও জেনারেশন
- **প্রয়োজন:** YouTube Data API (ভিডিও আপলোডের জন্য)
- **কনফিগ:** `YOUTUBE_API_KEY`, `YOUTUBE_CLIENT_ID`

### ৫. AI অটোমেশন সার্ভার
- **কী করে:** লিড-টু-ইনভয়েস পাইপলাইন
- **প্রয়োজন:** WhatsApp Business API
- **কনফিগ:** `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`

### ৬. হোস্টিং ড্যাশবোর্ড
- **কী করে:** সার্ভার মনিটরিং
- **শুধু VPS-এ কাজ করবে** (Vercel-এ সার্ভার অ্যাক্সেস নেই)

---

## 🔄 শেয়ার্ড হোস্টিং সীমাবদ্ধতা

যদি শেয়ার্ড হোস্টিং ব্যবহার করেন, এই ফিচারগুলো **কাজ করবে না**:

| ফিচার | শেয়ার্ড হোস্টিং | VPS | Vercel |
|--------|:---:|:---:|:---:|
| ওয়েবসাইট | ⚠️ সীমিত | ✅ | ✅ |
| অ্যাডমিন প্যানেল | ✅ | ✅ | ✅ |
| প্রোডাক্ট ক্যাটালগ | ✅ | ✅ | ✅ |
| কার্ট + চেকআউট | ✅ | ✅ | ✅ |
| AI প্রোডাক্ট উইজার্ড | ❌ টাইমআউট | ✅ | ⚠️ সীমিত |
| AI ভিডিও জেনারেশন | ❌ | ✅ | ❌ |
| ব্যাকগ্রাউন্ড ক্রন জব | ❌ | ✅ | ⚠️ Vercel Cron |
| হোস্টিং ড্যাশবোর্ড | ❌ | ✅ | ❌ |
| ফাইল আপলোড | ⚠️ সীমিত | ✅ | ❌ (S3 লাগবে) |
| SQLite ডাটাবেস | ⚠️ লকিং সমস্যা | ✅ | ❌ |
| SSL | ✅ (cPanel) | ✅ (Let's Encrypt) | ✅ (অটো) |
| কাস্টম ডোমেইন | ✅ | ✅ | ✅ |

---

## 📊 খরচের তুলনা

| উপাদান | Vercel | VPS | শেয়ার্ড |
|--------|--------|-----|---------|
| হোস্টিং | ফ্রি-$20/মাস | $6-12/মাস | ৳২০০-৫০০/মাস |
| ডাটাবেস | $0-10/মাস | ইনক্লুডেড | ইনক্লুডেড |
| SSL | ফ্রি | ফ্রি | ফ্রি |
| ফাইল স্টোরেজ | $0 (Cloudinary ফ্রি) | ইনক্লুডেড | ⚠️ সীমিত |
| ইমেইল | ফ্রি (Resend) | ফ্রি (SMTP) | ইনক্লুডেড |
| ডোমেইন | $10/বছর | $10/বছর | $10/বছর |
| **মোট/মাস** | **$0-30** | **$6-12** | **৳২০০-৫০০** |
| **মোট/বছর** | **$0-360** | **$72-144** | **৳২৪০০-৬০০০** |

---

## ✅ সুপারিশকৃত ডিপ্লয়মেন্ট প্ল্যান

### পর্যায় ১: দ্রুত লাইভ (১-২ দিন)

1. **Vercel ফ্রি প্ল্যানে ডিপ্লয় করুন**
2. `thedreamerit.com` ডোমেইন কানেক্ট করুন
3. Vercel Postgres (ফ্রি টিয়ার) ব্যবহার করুন
4. Cloudinary (ফ্রি) ফাইল স্টোরেজের জন্য
5. বেসিক ফিচার লাইভ: ওয়েবসাইট, ক্যাটালগ, কার্ট, চেকআউট

### পর্যায় ২: AI এজেন্ট চালু (৩-৭ দিন)

1. Google Business Profile যাচাই করুন
2. Facebook Page API কানেক্ট করুন
3. WhatsApp Business API সেটআপ করুন
4. Google Search Console কানেক্ট করুন

### পর্যায় ৩: সম্পূর্ণ অটোমেশন (১-২ সপ্তাহ)

1. VPS-এ মাইগ্রেট করুন (AI ভিডিও জেনারেশনের জন্য)
2. অথবা Vercel Pro-তে আপগ্রেড করুন
3. সব AI এজেন্ট চালু করুন
4. ব্যাকআপ সিস্টেম সেটআপ করুন

---

## 🆘 সাপোর্ট

- **ডিপ্লয়মেন্ট সাহায্য:** thedreameritexpress@gmail.com
- **ফোন:** 01610111688
- **WhatsApp:** wa.me/8801610111688

---

সর্বশেষ আপডেট: 2026-10-28
