// GET  /api/products - list products (public catalog: only PUBLISHED; admin: all)
// POST /api/products - create product (admin only)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission, hasAnyPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';
import { slugify } from '@/lib/format';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '24'), 100);
  const q = url.searchParams.get('q')?.trim();
  const categorySlug = url.searchParams.get('category');
  const brandSlug = url.searchParams.get('brand');
  const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '0');
  const sort = url.searchParams.get('sort') || 'newest';
  const status = url.searchParams.get('status'); // admin filter
  const branchId = url.searchParams.get('branchId'); // admin filter for inventory

  const user = await getSession();
  const isAdminView = url.searchParams.get('admin') === '1' && user && hasAnyPermission(user, ['products.view', 'products.edit', 'products.approve', 'products.publish'] as any);

  const where: Prisma.ProductWhereInput = {};

  // Public catalog: only published products
  if (!isAdminView) {
    where.status = 'PUBLISHED';
  } else if (status) {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { barcode: { contains: q } },
      { shortDescription: { contains: q } },
      { model: { contains: q } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (brandSlug) {
    where.brand = { slug: brandSlug };
  }

  if (minPrice > 0 || maxPrice > 0) {
    where.sellingPrice = {};
    if (minPrice > 0) where.sellingPrice.gte = minPrice;
    if (maxPrice > 0) where.sellingPrice.lte = maxPrice;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price_asc' ? { sellingPrice: 'asc' }
    : sort === 'price_desc' ? { sellingPrice: 'desc' }
    : sort === 'name' ? { name: 'asc' }
    : { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
        inventory: branchId ? { where: { branchId } } : true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return ok({
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
      category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
      shortDescription: p.shortDescription,
      sellingPrice: p.sellingPrice,
      compareAtPrice: p.compareAtPrice,
      promotionalPrice: p.promotionalPrice,
      minSellingPrice: p.minSellingPrice,
      costPrice: p.costPrice,
      status: p.status,
      isFeatured: p.isFeatured,
      has3dModel: p.has3dModel,
      supportsConfigurator: p.supportsConfigurator,
      model3dUrl: p.model3dUrl,
      warrantyMonths: p.warrantyMonths,
      primaryImage: p.images[0]?.url || null,
      totalStock: branchId
        ? p.inventory.reduce((s, i) => s + i.quantityAvailable, 0)
        : p.inventory.reduce((s, i) => s + i.quantityAvailable, 0),
      createdAt: p.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'products.create' as any)) return forbidden();

  const body = await req.json();
  const {
    name, sku, barcode, brandSlug, categorySlug, model, manufacturerPartNumber,
    shortDescription, fullDescription, warrantyMonths,
    sellingPrice, costPrice, landedCost, minSellingPrice, compareAtPrice,
    taxRate, metaTitle, metaDescription, seoKeywords,
    trackSerialNumbers, trackInventory, reorderThreshold,
    attributeValues, images,
  } = body;

  if (!name || !sku || !categorySlug) {
    return badRequest('Name, SKU, and category are required');
  }

  if (sellingPrice < 0 || costPrice < 0) {
    return badRequest('Prices cannot be negative');
  }

  // Price floor validation
  if (minSellingPrice > 0 && sellingPrice < minSellingPrice) {
    return badRequest('Selling price cannot be below minimum selling price (price floor)');
  }

  // Check SKU uniqueness
  const existing = await db.product.findUnique({ where: { sku } });
  if (existing) return badRequest('SKU already exists');

  // Resolve brand and category
  const brand = brandSlug ? await db.brand.findUnique({ where: { slug: brandSlug } }) : null;
  const category = await db.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return badRequest('Invalid category');

  const slug = slugify(`${name}-${sku}`);

  const product = await db.product.create({
    data: {
      name,
      sku,
      barcode: barcode || null,
      slug,
      brandId: brand?.id || null,
      categoryId: category.id,
      model: model || null,
      manufacturerPartNumber: manufacturerPartNumber || null,
      shortDescription: shortDescription || null,
      fullDescription: fullDescription || null,
      warrantyMonths: warrantyMonths || 0,
      status: 'DRAFT', // All new products start as draft - require approval
      sellingPrice,
      costPrice: costPrice || 0,
      landedCost: landedCost || 0,
      minSellingPrice: minSellingPrice || 0,
      compareAtPrice: compareAtPrice || null,
      promotionalPrice: null,
      taxRate: taxRate || 0,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      seoKeywords: seoKeywords || null,
      trackSerialNumbers: trackSerialNumbers || false,
      trackInventory: trackInventory !== false,
      reorderThreshold: reorderThreshold || 5,
    },
    include: { brand: true, category: true },
  });

  // Create images
  if (images && Array.isArray(images) && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          altText: img.altText || name,
          isPrimary: i === 0,
          displayOrder: i,
        },
      });
    }
  }

  // Create attribute values
  if (attributeValues && Array.isArray(attributeValues)) {
    for (const av of attributeValues) {
      const attr = await db.categoryAttribute.findFirst({
        where: { categoryId: category.id, code: av.code },
      });
      if (!attr) continue;
      await db.productAttributeValue.create({
        data: {
          productId: product.id,
          categoryAttributeId: attr.id,
          valueString: av.valueString || null,
          valueNumber: av.valueNumber || null,
          valueBoolean: av.valueBoolean || null,
        },
      }).catch(() => {});
    }
  }

  await logAudit({
    userId: user.id,
    action: 'product.create',
    entityType: 'Product',
    entityId: product.id,
    metadata: { sku, name },
    ipAddress: getClientIp(req),
  });

  return ok({ product });
});
