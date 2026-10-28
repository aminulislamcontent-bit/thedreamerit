// POST /api/ai-wizard/publish - Publish generated content to all platforms
// Input: { product, marketing, video, photos, autoPublish }
// Output: { publishedTo: string[], status }
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateOrderNumber, generateInvoiceNumber } from '@/lib/security';

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'content.publish' as any)) return forbidden();

  const body = await req.json();
  const { product, marketing, video, photos, autoPublish = false } = body;

  if (!product?.name) {
    return badRequest('প্রোডাক্টের নাম প্রয়োজন');
  }

  const publishedTo: string[] = [];
  const errors: string[] = [];

  // 1. Create product in database
  try {
    // Check if category exists, else use "Accessories"
    let category = await db.category.findFirst({ where: { name: { contains: product.brand || 'Laptop' } } });
    if (!category) {
      category = await db.category.findUnique({ where: { slug: 'laptops' } });
    }
    if (!category) {
      category = await db.category.findFirst();
    }

    const sku = `AI-${Date.now().toString(36).toUpperCase()}`;
    const slug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`;

    const newProduct = await db.product.create({
      data: {
        name: product.name,
        sku,
        slug,
        categoryId: category!.id,
        brandId: product.brand ? (await db.brand.findFirst({ where: { name: { contains: product.brand, mode: 'insensitive' } } }))?.id : null,
        model: product.model || null,
        shortDescription: product.shortDescription || null,
        fullDescription: product.fullDescription || null,
        warrantyMonths: product.warrantyMonths || 0,
        status: autoPublish ? 'PUBLISHED' : 'DRAFT',
        sellingPrice: product.estimatedPrice || 0,
        costPrice: Math.round((product.minSellingPrice || 0) * 0.9),
        compareAtPrice: product.estimatedPrice || null,
        minSellingPrice: product.minSellingPrice || 0,
        promotionalPrice: product.offerPrice || null,
        trackInventory: true,
        reorderThreshold: 5,
        isFeatured: true,
        has3dModel: false,
      },
    });

    // Add product images
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        await db.productImage.create({
          data: {
            productId: newProduct.id,
            url: photos[i],
            altText: product.name,
            isPrimary: i === 0,
            displayOrder: i,
          },
        });
      }
    }

    publishedTo.push('website');
  } catch (e: any) {
    errors.push(`Website: ${e.message}`);
  }

  // 2. Create content draft for review
  try {
    await db.contentDraft.create({
      data: {
        type: 'PRODUCT_DESC_BN',
        title: `${product.name} - প্রোডাক্ট বর্ণনা`,
        content: product.fullDescription || '',
        language: 'bn',
        status: autoPublish ? 'PUBLISHED' : 'DRAFT',
        source: 'AI',
        aiModelUsed: 'glm-4',
        createdBy: user.id,
      },
    });
    publishedTo.push('content-studio');
  } catch (e: any) {
    errors.push(`Content: ${e.message}`);
  }

  // 3. Create marketing campaign
  try {
    const campaign = await db.marketingCampaign.create({
      data: {
        name: `${product.name} প্রমোশন`,
        description: `AI-জেনারেটেড মার্কেটিং ক্যাম্পেইন`,
        type: 'DISCOUNT',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        budget: 5000,
      },
    });
    publishedTo.push('marketing-campaign');
  } catch (e: any) {
    errors.push(`Campaign: ${e.message}`);
  }

  // 4. Create publishing jobs for social media
  const platforms = [
    { name: 'FACEBOOK', content: marketing?.facebook?.caption || product.shortDescription },
    { name: 'INSTAGRAM', content: marketing?.instagram?.caption || product.shortDescription },
    { name: 'YOUTUBE', content: marketing?.youtube?.title || product.name },
    { name: 'WHATSAPP', content: marketing?.whatsapp?.message || product.shortDescription },
  ];

  for (const platform of platforms) {
    try {
      await db.publishingJob.create({
        data: {
          platform: platform.name,
          title: product.name,
          content: platform.content || '',
          mediaUrls: photos ? JSON.stringify(photos) : null,
          status: autoPublish ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: autoPublish ? new Date(Date.now() + 60 * 1000) : null, // 1 min from now if auto
          createdById: user.id,
        },
      });
      publishedTo.push(platform.name.toLowerCase());
    } catch (e: any) {
      errors.push(`${platform.name}: ${e.message}`);
    }
  }

  // 5. Generate invoice preview
  let invoice = null;
  try {
    const invoiceCount = await db.invoice.count();
    invoice = {
      invoiceNumber: generateInvoiceNumber(invoiceCount + 1),
      productName: product.name,
      quantity: 1,
      unitPrice: product.estimatedPrice || 0,
      minSellingPrice: product.minSellingPrice || 0,
      offerPrice: product.offerPrice || product.estimatedPrice || 0,
      savings: (product.estimatedPrice || 0) - (product.offerPrice || 0),
      tax: 0,
      total: product.offerPrice || product.estimatedPrice || 0,
      currency: 'BDT',
      createdAt: new Date(),
    };
  } catch (e: any) {
    errors.push(`Invoice: ${e.message}`);
  }

  await logAudit({
    userId: user.id,
    action: 'ai_wizard.published',
    entityType: 'Product',
    metadata: {
      productName: product.name,
      publishedTo,
      errors,
      autoPublish,
    },
    ipAddress: getClientIp(req),
  });

  return ok({
    publishedTo,
    errors: errors.length > 0 ? errors : undefined,
    invoice,
    message: autoPublish
      ? `${publishedTo.length}টি প্ল্যাটফর্মে সফলভাবে প্রকাশিত হয়েছে!`
      : `${publishedTo.length}টি প্ল্যাটফর্মে প্রস্তুত করা হয়েছে। অ্যাডমিন অনুমোদনের পরে প্রকাশিত হবে।`,
  });
});
