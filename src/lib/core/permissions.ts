/** Server-side RBAC catalogue. Every privileged action maps to one of these slugs. */

export const PERMISSIONS = [
  'catalogue.view', 'catalogue.edit', 'catalogue.verify', 'catalogue.publish',
  'media.view', 'media.upload', 'media.review',
  'inventory.view', 'inventory.adjust', 'inventory.transfer',
  'procurement.view', 'procurement.edit',
  'pricing.view', 'pricing.approve',
  'pos.use', 'orders.view', 'orders.manage', 'payments.verify',
  'customers.view', 'customers.edit', 'crm.manage',
  'employees.view', 'employees.edit', 'commission.manage',
  'content.view', 'content.generate', 'content.approve',
  'seo.view', 'seo.manage', 'marketing.view', 'marketing.publish',
  'reports.view', 'security.view', 'security.manage', 'backups.manage',
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type RoleDefinition = {
  slug: string;
  name: string;
  description: string;
  permissions: readonly Permission[];
};

const ALL = PERMISSIONS;

export const ROLES: RoleDefinition[] = [
  {
    slug: 'super_admin',
    name: 'Super Admin',
    description: 'Full platform control, including security, publication approval and backups.',
    permissions: ALL,
  },
  {
    slug: 'catalogue_manager',
    name: 'Catalogue Manager',
    description: 'Products, verification, media review, SEO and content.',
    permissions: ['catalogue.view', 'catalogue.edit', 'catalogue.verify', 'catalogue.publish', 'media.view', 'media.upload', 'media.review', 'content.view', 'content.generate', 'content.approve', 'seo.view', 'seo.manage', 'pricing.view', 'reports.view'],
  },
  {
    slug: 'inventory_manager',
    name: 'Inventory Manager',
    description: 'Branches, warehouses, stock movements, purchase orders and suppliers.',
    permissions: ['inventory.view', 'inventory.adjust', 'inventory.transfer', 'procurement.view', 'procurement.edit', 'catalogue.view', 'pricing.view', 'reports.view'],
  },
  {
    slug: 'sales_pos',
    name: 'Sales / POS',
    description: 'Point of sale, orders, customers and CRM follow-up.',
    permissions: ['pos.use', 'orders.view', 'orders.manage', 'catalogue.view', 'inventory.view', 'pricing.view', 'customers.view', 'customers.edit', 'crm.manage'],
  },
  {
    slug: 'accountant',
    name: 'Accountant',
    description: 'Payment verification, price approval, reports and payroll exports.',
    permissions: ['payments.verify', 'pricing.view', 'pricing.approve', 'orders.view', 'reports.view', 'commission.manage', 'procurement.view'],
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    description: 'Content drafts, SEO and scheduled social publishing workflows.',
    permissions: ['content.view', 'content.generate', 'seo.view', 'seo.manage', 'marketing.view', 'marketing.publish', 'catalogue.view', 'reports.view'],
  },
  {
    slug: 'support',
    name: 'Customer Support',
    description: 'Tickets, warranty and return requests.',
    permissions: ['customers.view', 'crm.manage', 'orders.view'],
  },
  {
    slug: 'customer',
    name: 'Customer',
    description: 'Public storefront account: own orders, wishlist, warranty and returns only.',
    permissions: [],
  },
];

export function permissionsForRole(slug: string): readonly Permission[] {
  return ROLES.find((r) => r.slug === slug)?.permissions ?? [];
}

export function can(granted: readonly string[], required: Permission): boolean {
  return granted.includes(required);
}
