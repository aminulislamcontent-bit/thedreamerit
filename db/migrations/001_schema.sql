-- The Dreamer IT Express — relational schema (SQLite, Postgres-portable SQL subset)
-- All monetary amounts are integer poysha (100 poysha = 1 BDT).
-- All timestamps are ISO-8601 UTC strings.
-- Booleans are INTEGER with a 0/1 CHECK constraint.
-- No customer review, rating, price, stock level or product specification is inserted
-- by this schema. Every such record must come from a verified source or be flagged demo.

CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ Identity & access ============================
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0,1))
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  mfa_secret TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (mfa_enabled IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','invited')),
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL,
  mfa_passed INTEGER NOT NULL DEFAULT 0 CHECK (mfa_passed IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_label TEXT NOT NULL DEFAULT 'anonymous',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id INTEGER PRIMARY KEY,
  bucket TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ Catalogue ============================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL DEFAULT '',
  group_name TEXT NOT NULL,
  spec_template TEXT NOT NULL DEFAULT 'generic',
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  min_models INTEGER NOT NULL DEFAULT 15 CHECK (min_models > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','verified')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  brand_id INTEGER NOT NULL REFERENCES brands(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  model_name TEXT NOT NULL,
  mpn TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','published','archived')),
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0,1)),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  source_url TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,
  price_amount INTEGER,
  price_verified INTEGER NOT NULL DEFAULT 0 CHECK (price_verified IN (0,1)),
  price_source_url TEXT NOT NULL DEFAULT '',
  price_source_name TEXT NOT NULL DEFAULT '',
  minimum_selling_amount INTEGER,
  warranty_months INTEGER,
  warranty_source_url TEXT NOT NULL DEFAULT '',
  overview TEXT NOT NULL DEFAULT '',
  limitations TEXT NOT NULL DEFAULT '',
  intended_use TEXT NOT NULL DEFAULT '',
  included_accessories TEXT NOT NULL DEFAULT '',
  publication_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  publication_approved_at TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (brand_id, model_name)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  attributes_json TEXT NOT NULL DEFAULT '{}',
  barcode TEXT NOT NULL DEFAULT '',
  price_amount INTEGER,
  price_verified INTEGER NOT NULL DEFAULT 0 CHECK (price_verified IN (0,1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_specs (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL DEFAULT 'General',
  spec_key TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0,1)),
  source_url TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,
  UNIQUE (product_id, spec_key)
);

CREATE TABLE IF NOT EXISTS product_media (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','video','model_3d','spin_frame','document')),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL DEFAULT '',
  sequence_key TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  mime_type TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  permission_status TEXT NOT NULL DEFAULT 'unknown' CHECK (permission_status IN ('unknown','pending','granted','denied')),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  checksum TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_jobs (
  id INTEGER PRIMARY KEY,
  media_id INTEGER NOT NULL REFERENCES product_media(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS product_seo (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  canonical_path TEXT NOT NULL DEFAULT '',
  indexable INTEGER NOT NULL DEFAULT 0 CHECK (indexable IN (0,1)),
  og_image TEXT NOT NULL DEFAULT '',
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS product_revisions (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  change_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_relations (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'related',
  PRIMARY KEY (product_id, related_product_id, kind)
);

CREATE TABLE IF NOT EXISTS product_questions (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','hidden')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  verified_purchase INTEGER NOT NULL DEFAULT 0 CHECK (verified_purchase IN (0,1)),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS price_change_logs (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_amount INTEGER,
  new_amount INTEGER,
  reason TEXT NOT NULL DEFAULT '',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','active','expired')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ Inventory & procurement ============================
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_received','received','cancelled')),
  ordered_at TEXT,
  expected_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost INTEGER NOT NULL CHECK (unit_cost >= 0),
  received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0)
);

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id INTEGER PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  paid_amount INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  issued_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','paid')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_balances (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL DEFAULT 0,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  damaged INTEGER NOT NULL DEFAULT 0 CHECK (damaged >= 0),
  reorder_threshold INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, variant_id, warehouse_id),
  CHECK (reserved <= on_hand)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL DEFAULT 0,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
  from_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('receipt','reservation','release','dispatch','transfer_in','transfer_out','adjustment','damage','return','sale')),
  reference_type TEXT NOT NULL DEFAULT '',
  reference_id TEXT NOT NULL DEFAULT '',
  serial_numbers_json TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS serial_numbers (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL DEFAULT 0,
  serial TEXT NOT NULL UNIQUE,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock','sold','returned','damaged','warranty')),
  warranty_start TEXT,
  warranty_end TEXT,
  order_id INTEGER
);

CREATE TABLE IF NOT EXISTS stock_reservations (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL DEFAULT 0,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','consumed','expired')),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ Sales & customers ============================
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  consent_marketing INTEGER NOT NULL DEFAULT 0 CHECK (consent_marketing IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id INTEGER PRIMARY KEY,
  cart_key TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted','abandoned')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  price_verified INTEGER NOT NULL DEFAULT 0 CHECK (price_verified IN (0,1)),
  UNIQUE (cart_id, product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web','pos')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_payment','paid','processing','shipped','delivered','cancelled','returned','refunded')),
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0,
  line_total INTEGER NOT NULL,
  price_verified INTEGER NOT NULL DEFAULT 0 CHECK (price_verified IN (0,1)),
  serial_numbers_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('cash','card','bank_transfer','mobile_banking','gateway','reconciliation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed','refunded')),
  reference TEXT NOT NULL DEFAULT '',
  gateway_event_id TEXT UNIQUE,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processed','rejected')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_requests (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','received','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warranty_claims (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  serial_number TEXT NOT NULL DEFAULT '',
  issue TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_state_history (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_tracking (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  business_date TEXT NOT NULL,
  expected_amount INTEGER NOT NULL DEFAULT 0,
  counted_amount INTEGER NOT NULL DEFAULT 0,
  variance INTEGER NOT NULL DEFAULT 0,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ HR & commissions ============================
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  employee_code TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  joined_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'))
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  business_date TEXT NOT NULL,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','leave','late')),
  UNIQUE (employee_id, business_date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS performance_targets (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  target_amount INTEGER NOT NULL DEFAULT 0,
  achieved_amount INTEGER NOT NULL DEFAULT 0,
  UNIQUE (employee_id, period)
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  basis TEXT NOT NULL CHECK (basis IN ('line_margin','revenue','flat_per_unit')),
  rate_bps INTEGER NOT NULL DEFAULT 0 CHECK (rate_bps >= 0),
  flat_amount INTEGER NOT NULL DEFAULT 0 CHECK (flat_amount >= 0),
  min_margin_bps INTEGER NOT NULL DEFAULT 0,
  applies_to_returns INTEGER NOT NULL DEFAULT 0 CHECK (applies_to_returns IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commission_records (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  rule_id INTEGER NOT NULL REFERENCES commission_rules(id),
  base_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued','reversed','paid')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_attributions (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  share_bps INTEGER NOT NULL DEFAULT 10000 CHECK (share_bps BETWEEN 0 AND 10000),
  UNIQUE (order_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payroll_exports (
  id INTEGER PRIMARY KEY,
  period TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '[]',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ CRM ============================
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost')),
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  consent_verified INTEGER NOT NULL DEFAULT 0 CHECK (consent_verified IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  due_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','cancelled'))
);

CREATE TABLE IF NOT EXISTS communications (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('phone','email','sms','whatsapp','in_person')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  summary TEXT NOT NULL DEFAULT '',
  consent_verified INTEGER NOT NULL DEFAULT 0 CHECK (consent_verified IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS segments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  rule_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS consent_records (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  granted INTEGER NOT NULL CHECK (granted IN (0,1)),
  source TEXT NOT NULL DEFAULT '',
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_preferences (
  customer_id INTEGER PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  email INTEGER NOT NULL DEFAULT 0 CHECK (email IN (0,1)),
  sms INTEGER NOT NULL DEFAULT 0 CHECK (sms IN (0,1)),
  whatsapp INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp IN (0,1))
);

-- ============================ Content, SEO & marketing ============================
CREATE TABLE IF NOT EXISTS content_drafts (
  id INTEGER PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('bn','en')),
  body TEXT NOT NULL,
  source_fields_json TEXT NOT NULL DEFAULT '[]',
  generated_by TEXT NOT NULL DEFAULT 'template' CHECK (generated_by IN ('template','ai','human')),
  model TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY,
  draft_id INTEGER NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seo_checks (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass','fail','warning')),
  detail TEXT NOT NULL DEFAULT '',
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redirects (
  id INTEGER PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS broken_links (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  found_on_path TEXT NOT NULL DEFAULT '',
  status_code INTEGER,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_channels (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE CHECK (platform IN ('facebook','instagram','youtube','whatsapp','other')),
  account_handle TEXT NOT NULL DEFAULT '',
  credential_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','connected','error')),
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  budget_amount INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publishing_jobs (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL,
  content_draft_id INTEGER REFERENCES content_drafts(id) ON DELETE SET NULL,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_approval' CHECK (status IN ('awaiting_approval','approved','submitted','failed','published')),
  platform_post_id TEXT NOT NULL DEFAULT '',
  platform_response_json TEXT NOT NULL DEFAULT '',
  failure_reason TEXT NOT NULL DEFAULT '',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================ Operations ============================
CREATE TABLE IF NOT EXISTS failed_jobs (
  id INTEGER PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  error TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','retried','resolved')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY,
  file_path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  integrity_status TEXT NOT NULL DEFAULT 'unchecked' CHECK (integrity_status IN ('unchecked','verified','corrupt')),
  restore_tested_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_logs (
  id INTEGER PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('info','warn','error')),
  message TEXT NOT NULL,
  context_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_status (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','configured','healthy','error')),
  detail TEXT NOT NULL DEFAULT '',
  last_checked_at TEXT
);

-- ============================ Indexes ============================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status, is_demo, verification_status);
CREATE INDEX IF NOT EXISTS idx_specs_product ON product_specs(product_id, verified);
CREATE INDEX IF NOT EXISTS idx_media_product ON product_media(product_id, kind, review_status);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_balances(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit ON rate_limit_hits(bucket, subject, created_at);
CREATE INDEX IF NOT EXISTS idx_commission_order ON commission_records(order_id, status);
CREATE INDEX IF NOT EXISTS idx_content_product ON content_drafts(product_id, status);
CREATE INDEX IF NOT EXISTS idx_publishing_status ON publishing_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reservations_order ON stock_reservations(order_id, status);
