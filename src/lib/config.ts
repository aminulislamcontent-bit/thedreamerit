// The Dreamer IT Express - Business Configuration
// Single source of truth for business identity, roles, permissions, and platform constants.

export const BUSINESS = {
  name: "The Dreamer IT Express",
  shortName: "Dreamer IT",
  legalName: "The Dreamer IT Express",
  shops: ["104", "105"],
  address: {
    line1: "The New Elephant Road 1205, Suvastu Arcade, ICT Bhaban",
    line2: "Level 1, Shop Nos. 104 and 105",
    city: "Dhaka",
    district: "Dhaka",
    postalCode: "1205",
    country: "Bangladesh",
  },
  phone: "01610111688",
  phoneAlternate: "01753943788", // Additional contact from Facebook
  phoneAlternate2: "01911111688", // Additional contact from Facebook
  whatsapp: "8801610111688",
  email: "thedreameritexpress@gmail.com",
  domain: "thedreamerit.com",
  altDomain: "dreamerit.com.bd",
  currency: "BDT",
  currencySymbol: "৳",
  defaultLanguage: "bn",
  supportedLanguages: ["bn", "en"],
  timezone: "Asia/Dhaka",
  market: "Bangladesh",
  hours: {
    bn: "সকাল ১১টা থেকে সন্ধ্যা ৮টা",
    en: "11 AM to 8 PM",
    days: "Saturday - Thursday", // Friday closed in BD
  },
  vatRate: 0, // Bangladesh VAT for retail - configurable later
  // Social Media (from Facebook page)
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61565139640111",
    facebookPageId: "61565139640111",
    facebookFollowers: 931, // As of latest check
    instagram: "", // To be configured
    youtube: "", // To be configured
    tiktok: "", // To be configured
    whatsapp: "https://wa.me/8801610111688",
  },
  businessCategory: "Business Center / Technology Retailer",
  primaryCategories: [
    "Laptops", "Desktop PCs", "Gaming PCs", "All-in-One", "Processors",
    "Motherboards", "Graphics Cards", "RAM", "Storage", "Monitors",
    "Keyboards", "Mice", "Headphones", "Speakers", "Printers",
    "Routers", "Networking", "UPS", "Power Supplies", "Cases",
    "Cooling", "Cables & Adapters", "Accessories",
  ],
  // Specializations based on Facebook page
  specializations: [
    "Premium used & refurbished laptops (HP EliteBook, Dell Latitude, Lenovo ThinkPad)",
    "Brand new laptops (Apple MacBook, Microsoft Surface, ASUS, Acer, MSI)",
    "Gaming & graphics laptops",
    "2-in-1 & x360 convertible laptops",
    "Custom PC builds for office, freelancing & business",
    "Genuine accessories & components",
  ],
} as const;

// All system roles - matches the 15-role spec
export const SYSTEM_ROLES = [
  "SUPER_ADMIN",
  "ADMINISTRATOR",
  "BRANCH_MANAGER",
  "INVENTORY_MANAGER",
  "PRODUCT_MANAGER",
  "SALESPERSON",
  "CASHIER",
  "PROCUREMENT_OFFICER",
  "ACCOUNTANT",
  "HR_MANAGER",
  "MARKETING_MANAGER",
  "CONTENT_REVIEWER",
  "CUSTOMER_SUPPORT",
  "WAREHOUSE_OPERATOR",
  "CUSTOMER",
] as const;

export type SystemRole = typeof SYSTEM_ROLES[number];

// Permissions catalog - grouped by module
export const PERMISSIONS = {
  // Products
  "products.view": "View products catalog and details",
  "products.create": "Create new products",
  "products.edit": "Edit existing products",
  "products.delete": "Delete products",
  "products.approve": "Approve products for publication",
  "products.publish": "Publish products to website",
  "products.pricing.edit": "Edit product prices",

  // Inventory
  "inventory.view": "View inventory levels",
  "inventory.adjust": "Adjust stock levels (with audit)",
  "inventory.transfer": "Initiate/accept stock transfers",
  "inventory.reconcile": "Reconcile cash registers and cycle counts",

  // Orders
  "orders.view": "View orders",
  "orders.create": "Create new orders",
  "orders.process": "Process orders through fulfillment states",
  "orders.cancel": "Cancel orders",
  "orders.refund": "Approve refunds",

  // POS
  "pos.sell": "Use POS to make sales",
  "pos.discount": "Apply discounts (subject to price floor)",

  // Price approvals
  "pricing.approve": "Approve below-floor price sales",

  // Procurement
  "procurement.view": "View suppliers and purchase orders",
  "procurement.create": "Create purchase orders",
  "procurement.approve": "Approve purchase orders",
  "procurement.receive": "Receive goods (GRN)",

  // HR
  "hr.view": "View employee records",
  "hr.manage": "Manage employees, attendance, leave",
  "hr.salary.view": "View salary information (restricted)",

  // Commissions
  "commission.view": "View commission transactions",
  "commission.configure": "Configure commission rules",
  "commission.approve": "Approve commission payouts",

  // Finance
  "finance.view": "View financial reports",
  "finance.export": "Export financial data",
  "expense.manage": "Manage operating expenses",

  // CRM
  "crm.view": "View customer records",
  "crm.manage": "Manage customers and leads",

  // Content
  "content.view": "View content drafts",
  "content.create": "Create AI content drafts",
  "content.review": "Review and approve content",
  "content.publish": "Publish content",

  // Marketing
  "marketing.view": "View marketing campaigns",
  "marketing.manage": "Create/edit campaigns",
  "marketing.publish": "Publish to social media",

  // Support
  "support.view": "View support tickets",
  "support.respond": "Respond to tickets",
  "support.manage": "Manage ticket assignments and priorities",

  // SEO
  "seo.view": "View SEO dashboard",
  "seo.manage": "Manage redirects, sitemap, metadata",

  // Reports
  "reports.view": "View operational reports",
  "reports.export": "Export reports",

  // System
  "system.settings": "Manage system settings",
  "system.users": "Manage users and roles",
  "system.integrations": "Manage third-party integrations",
  "system.backups": "Manage backups",
  "system.audit": "View audit logs",
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

// Role -> Permission mapping (least privilege)
export const ROLE_PERMISSIONS: Record<SystemRole, PermissionCode[]> = {
  SUPER_ADMIN: Object.keys(PERMISSIONS) as PermissionCode[],

  ADMINISTRATOR: [
    "products.view", "products.create", "products.edit", "products.approve", "products.publish", "products.pricing.edit",
    "inventory.view", "inventory.adjust", "inventory.transfer", "inventory.reconcile",
    "orders.view", "orders.create", "orders.process", "orders.cancel", "orders.refund",
    "pos.sell", "pos.discount",
    "pricing.approve",
    "procurement.view", "procurement.create", "procurement.approve", "procurement.receive",
    "hr.view", "hr.manage",
    "commission.view", "commission.configure", "commission.approve",
    "finance.view", "finance.export", "expense.manage",
    "crm.view", "crm.manage",
    "content.view", "content.create", "content.review", "content.publish",
    "marketing.view", "marketing.manage", "marketing.publish",
    "support.view", "support.respond", "support.manage",
    "seo.view", "seo.manage",
    "reports.view", "reports.export",
    "system.users", "system.audit", "system.integrations",
  ],

  BRANCH_MANAGER: [
    "products.view",
    "inventory.view", "inventory.adjust", "inventory.transfer", "inventory.reconcile",
    "orders.view", "orders.create", "orders.process", "orders.cancel",
    "pos.sell", "pos.discount",
    "procurement.view", "procurement.create",
    "hr.view",
    "commission.view",
    "finance.view",
    "crm.view",
    "reports.view", "reports.export",
    "support.view", "support.respond",
  ],

  INVENTORY_MANAGER: [
    "products.view",
    "inventory.view", "inventory.adjust", "inventory.transfer", "inventory.reconcile",
    "procurement.view", "procurement.receive",
    "reports.view",
  ],

  PRODUCT_MANAGER: [
    "products.view", "products.create", "products.edit", "products.pricing.edit",
    "content.view", "content.create",
    "seo.view",
  ],

  SALESPERSON: [
    "products.view",
    "inventory.view",
    "orders.view", "orders.create", "orders.process",
    "pos.sell", "pos.discount",
    "crm.view", "crm.manage",
    "commission.view",
    "support.view", "support.respond",
  ],

  CASHIER: [
    "products.view",
    "inventory.view",
    "orders.view", "orders.create",
    "pos.sell",
    "inventory.reconcile",
  ],

  PROCUREMENT_OFFICER: [
    "products.view",
    "procurement.view", "procurement.create", "procurement.receive",
    "inventory.view",
    "reports.view",
  ],

  ACCOUNTANT: [
    "finance.view", "finance.export", "expense.manage",
    "orders.view",
    "commission.view",
    "reports.view", "reports.export",
  ],

  HR_MANAGER: [
    "hr.view", "hr.manage",
    "commission.view", "commission.configure", "commission.approve",
    "reports.view",
  ],

  MARKETING_MANAGER: [
    "content.view", "content.create", "content.review", "content.publish",
    "marketing.view", "marketing.manage", "marketing.publish",
    "seo.view", "seo.manage",
    "products.view",
    "reports.view",
  ],

  CONTENT_REVIEWER: [
    "content.view", "content.review", "content.publish",
    "products.view",
  ],

  CUSTOMER_SUPPORT: [
    "support.view", "support.respond", "support.manage",
    "orders.view",
    "crm.view",
    "products.view",
  ],

  WAREHOUSE_OPERATOR: [
    "inventory.view", "inventory.adjust", "inventory.transfer",
    "procurement.view", "procurement.receive",
    "products.view",
  ],

  CUSTOMER: [], // Customers have no admin permissions
};

// Bangladesh districts for address dropdowns
export const BANGLADESH_DISTRICTS = [
  "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh",
  "Gazipur", "Narayanganj", "Comilla", "Cox's Bazar", "Bogura", "Jessore", "Dinajpur",
  "Tangail", "Narsingdi", "Kushtia", "Pabna", "Noakhali", "Faridpur", "Jashore",
];

// Payment methods supported in Bangladesh
export const PAYMENT_METHODS = [
  { code: "CASH", label: "Cash", labelBn: "ক্যাশ" },
  { code: "CARD", label: "Card (Debit/Credit)", labelBn: "কার্ড" },
  { code: "BKASH", label: "bKash", labelBn: "বিকাশ" },
  { code: "NAGAD", label: "Nagad", labelBn: "নগদ" },
  { code: "ROCKET", label: "Rocket", labelBn: "রকেট" },
  { code: "BANK_TRANSFER", label: "Bank Transfer", labelBn: "ব্যাংক ট্রান্সফার" },
];

// Order status flow
export const ORDER_STATUS_FLOW = {
  PENDING: ["CONFIRMED", "CANCELLED", "PAYMENT_FAILED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["DISPATCHED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  PAYMENT_FAILED: ["PENDING", "CANCELLED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
} as const;

export const ORDER_STATUS_LABELS: Record<string, { en: string; bn: string; color: string }> = {
  PENDING: { en: "Pending", bn: "অপেক্ষমাণ", color: "amber" },
  CONFIRMED: { en: "Confirmed", bn: "নিশ্চিত", color: "blue" },
  PROCESSING: { en: "Processing", bn: "প্রসেসিং", color: "violet" },
  PACKED: { en: "Packed", bn: "প্যাক করা", color: "cyan" },
  DISPATCHED: { en: "Dispatched", bn: "প্রেরিত", color: "teal" },
  DELIVERED: { en: "Delivered", bn: "ডেলিভার হয়েছে", color: "emerald" },
  PAYMENT_FAILED: { en: "Payment Failed", bn: "পেমেন্ট ব্যর্থ", color: "red" },
  CANCELLED: { en: "Cancelled", bn: "বাতিল", color: "rose" },
  RETURNED: { en: "Returned", bn: "ফেরত", color: "orange" },
  REFUNDED: { en: "Refunded", bn: "রিফান্ড", color: "slate" },
};
