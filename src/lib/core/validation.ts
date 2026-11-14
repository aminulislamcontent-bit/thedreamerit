/** Shared input validation. Import records must carry provenance; nothing is auto-verified. */

import { z } from 'zod';

export const productImportSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(120),
  brandSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  modelName: z.string().min(2).max(180),
  sku: z.string().min(2).max(80),
  mpn: z.string().min(1).max(120),
  sourceName: z.string().min(2),
  sourceUrl: z.string().url(),
  verificationStatus: z.enum(['unverified', 'pending', 'verified']).default('unverified'),
  priceAmount: z.number().int().positive().nullable().default(null),
  priceSourceUrl: z.string().url().or(z.literal('')).default(''),
  isDemo: z.boolean().default(false),
  specs: z.array(z.object({
    specKey: z.string().min(1),
    specValue: z.string().min(1),
    unit: z.string().default(''),
    verified: z.boolean().default(false),
    sourceUrl: z.string().url().or(z.literal('')).default(''),
  })).max(200).default([]),
});

export type ProductImport = z.infer<typeof productImportSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
  totp: z.string().regex(/^\d{6}$/).optional(),
});

export const mediaMetadataSchema = z.object({
  kind: z.enum(['image', 'video', 'model_3d', 'spin_frame', 'document']),
  url: z.string().min(1).max(2000),
  altText: z.string().max(300).default(''),
  caption: z.string().max(1000).default(''),
  sourceUrl: z.string().max(2000).default(''),
  sourceName: z.string().max(200).default(''),
  license: z.string().max(300).default(''),
  permissionStatus: z.enum(['unknown', 'pending', 'granted', 'denied']).default('unknown'),
  sequenceKey: z.string().max(120).default(''),
  sortOrder: z.number().int().min(0).default(0),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
});

export const orderLineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().min(0).default(0),
  quantity: z.number().int().positive().max(999),
  discountAmount: z.number().int().min(0).default(0),
});

export const addressSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().min(6).max(30),
  email: z.string().email().or(z.literal('')).default(''),
  address: z.string().min(5).max(500),
});
