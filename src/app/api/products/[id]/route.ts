// GET    /api/products/[id] - get single product with full details
// PUT    /api/products/[id] - update product (admin)
// DELETE /api/products/[id] - soft delete (set status to ARCHIVED)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();

  const product = await db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: {
        include: { attributes: { orderBy: { displayOrder: 'asc' } } },
      },
      images: { orderBy: { displayOrder: 'asc' } },
      videos: true,
      attributeValues: { include: { categoryAttribute: true } },
      inventory: { include: { branch: true, warehouse: true } },
      suppliers: { include: { supplier: true } },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      configuratorParts: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!product) return notFound('Product not found');

  // Public users can only see published products
  if (product.status !== 'PUBLISHED') {
    if (!user || !hasPermission(user, 'products.view' as any)) {
      return notFound('Product not found');
    }
  }

  // Hide sensitive cost information from non-authorized users
  const canSeeCost = user && hasPermission(user, 'products.pricing.edit' as any);
  const canSeeInventory = user && hasPermission(user, 'inventory.view' as any);

  return ok({
    product: {
      ...product,
      costPrice: canSeeCost ? product.costPrice : undefined,
      landedCost: canSeeCost ? product.landedCost : undefined,
      minSellingPrice: canSeeCost ? product.minSellingPrice : undefined,
      suppliers: canSeeCost ? product.suppliers : product.suppliers.map((s) => ({ ...s, costPrice: undefined, supplier: { id: s.supplier.id, name: s.supplier.name } })),
      inventory: canSeeInventory
        ? product.inventory
        : product.inventory.map((i) => ({ branchId: i.branchId, quantityAvailable: i.quantityAvailable })),
    },
  });
});

export const PUT = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'products.edit' as any)) return forbidden();

  const body = await req.json();
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound('Product not found');

  // Price floor enforcement
  if (body.sellingPrice !== undefined && product.minSellingPrice > 0 && body.sellingPrice < product.minSellingPrice) {
    return badRequest('Selling price cannot be below minimum selling price (price floor)');
  }

  // Determine what fields can be updated
  const canEditPricing = hasPermission(user, 'products.pricing.edit' as any);
  const updateData: any = {};
  const editableFields = ['name', 'barcode', 'model', 'manufacturerPartNumber', 'shortDescription',
                          'fullDescription', 'warrantyMonths', 'metaTitle', 'metaDescription',
                          'seoKeywords', 'trackSerialNumbers', 'trackInventory', 'reorderThreshold',
                          'isFeatured', 'supportsConfigurator', 'has3dModel', 'model3dUrl'];

  for (const f of editableFields) {
    if (body[f] !== undefined) updateData[f] = body[f];
  }

  // Pricing requires separate permission
  if (canEditPricing) {
    if (body.sellingPrice !== undefined) updateData.sellingPrice = body.sellingPrice;
    if (body.compareAtPrice !== undefined) updateData.compareAtPrice = body.compareAtPrice;
    if (body.promotionalPrice !== undefined) updateData.promotionalPrice = body.promotionalPrice;
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice;
    if (body.landedCost !== undefined) updateData.landedCost = body.landedCost;
    if (body.minSellingPrice !== undefined) updateData.minSellingPrice = body.minSellingPrice;
    if (body.taxRate !== undefined) updateData.taxRate = body.taxRate;
  }

  if (body.brandSlug !== undefined) {
    const brand = body.brandSlug ? await db.brand.findUnique({ where: { slug: body.brandSlug } }) : null;
    updateData.brandId = brand?.id || null;
  }

  if (body.categorySlug !== undefined) {
    const category = await db.category.findUnique({ where: { slug: body.categorySlug } });
    if (!category) return badRequest('Invalid category');
    updateData.categoryId = category.id;
  }

  const updated = await db.product.update({
    where: { id },
    data: updateData,
    include: { brand: true, category: true },
  });

  // Update images if provided
  if (body.images && Array.isArray(body.images)) {
    await db.productImage.deleteMany({ where: { productId: id } });
    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      await db.productImage.create({
        data: {
          productId: id,
          url: img.url,
          altText: img.altText || updated.name,
          isPrimary: i === 0,
          displayOrder: i,
        },
      });
    }
  }

  // Update attribute values
  if (body.attributeValues && Array.isArray(body.attributeValues)) {
    for (const av of body.attributeValues) {
      const attr = await db.categoryAttribute.findFirst({
        where: { categoryId: updated.categoryId, code: av.code },
      });
      if (!attr) continue;
      await db.productAttributeValue.upsert({
        where: {
          productId_categoryAttributeId: { productId: id, categoryAttributeId: attr.id },
        },
        update: {
          valueString: av.valueString || null,
          valueNumber: av.valueNumber || null,
          valueBoolean: av.valueBoolean || null,
        },
        create: {
          productId: id,
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
    action: 'product.update',
    entityType: 'Product',
    entityId: id,
    metadata: { updatedFields: Object.keys(updateData) },
    ipAddress: getClientIp(req),
  });

  return ok({ product: updated });
});

export const DELETE = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'products.delete' as any)) return forbidden();

  // Soft delete - archive instead of hard delete
  const product = await db.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  await logAudit({
    userId: user.id,
    action: 'product.archive',
    entityType: 'Product',
    entityId: id,
    metadata: { sku: product.sku, name: product.name },
    ipAddress: getClientIp(req),
  });

  return ok({ success: true });
});
