// AI Content Studio API
// GET  /api/content - list drafts
// POST /api/content - create draft (uses z-ai-web-dev-sdk for AI-generated content)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'content.view' as any)) return forbidden();

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const productId = url.searchParams.get('productId');

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (productId) where.productId = productId;

  const drafts = await db.contentDraft.findMany({
    where,
    include: { product: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return ok({ drafts });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'content.create' as any)) return forbidden();

  const body = await req.json();
  const { type, productId, language = 'bn', customPrompt, generate = true } = body;

  if (!type) return badRequest('Content type is required');

  // If generating with AI, gather product context
  let title = '';
  let content = '';
  let aiModel = '';
  let source = 'AI';

  if (generate) {
    // Get product info for grounding
    const product = productId ? await db.product.findUnique({
      where: { id: productId },
      include: { brand: true, category: { include: { attributes: { include: { values: { where: { productId } } } } } }, attributeValues: { include: { categoryAttribute: true } } },
    }) : null;

    if (productId && !product) return badRequest('Product not found');

    // Build context for AI
    const productContext = product ? {
      name: product.name,
      brand: product.brand?.name,
      category: product.category?.name,
      sku: product.sku,
      model: product.model,
      warranty: product.warrantyMonths,
      attributes: product.attributeValues.map((av) => ({
        name: av.categoryAttribute.name,
        value: av.valueString || av.valueNumber || av.valueBoolean,
        unit: av.categoryAttribute.unit,
      })),
      shortDescription: product.shortDescription,
      price: product.sellingPrice,
    } : null;

    // Use z-ai-web-dev-sdk to generate content
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ZAIModule = require('z-ai-web-dev-sdk');
      const ZAI = ZAIModule.default || ZAIModule;
      const zai = await ZAI.create();

      const prompts: Record<string, string> = {
        PRODUCT_DESC_BN: `প্রোডাক্টের বাংলা বিবরণ লিখুন (300-500 শব্দ): ${JSON.stringify(productContext)}. প্রোডাক্টের সুবিধা, ব্যবহার, এবং কেন ক্রেতা এটি কিনবেন তা বর্ণনা করুন. শুধুমাত্র প্রদত্ত স্পেসিফিকেশন ব্যবহার করুন; কোনো তথ্য বানাবেন না.`,
        PRODUCT_DESC_EN: `Write an English product description (300-500 words) for: ${JSON.stringify(productContext)}. Highlight benefits, use cases, and why customers should buy. Use only the provided specifications; do not invent information.`,
        SEO_TITLE: `Generate an SEO-friendly title (max 60 characters) for product: ${JSON.stringify(productContext)}`,
        META_DESC: `Generate an SEO meta description (max 155 characters) for product: ${JSON.stringify(productContext)}`,
        ALT_TEXT: `Generate descriptive alt text for product image: ${JSON.stringify(productContext)}`,
        BUYING_GUIDE: `Write a comprehensive buying guide for ${productContext?.category || 'this product category'} in ${language === 'bn' ? 'Bangla' : 'English'}. Cover what to look for, key features, and recommendations. (500-800 words)`,
        COMPARISON_ARTICLE: `Write a comparison article for ${productContext?.name || 'this product'} versus alternatives in ${language === 'bn' ? 'Bangla' : 'English'}. (400-600 words)`,
        TECH_EXPLAINER: `Write a technical explainer for ${productContext?.name || 'this product'} in ${language === 'bn' ? 'Bangla' : 'English'}. Cover technical specifications and what they mean for users. (400-600 words)`,
        SOCIAL_CAPTION: `Generate a social media caption for ${productContext?.name} in ${language === 'bn' ? 'Bangla' : 'English'}. Include hashtags. (max 280 chars)`,
        VIDEO_SCRIPT: `Generate a video script for ${productContext?.name} in ${language === 'bn' ? 'Bangla' : 'English'}. Cover intro, features, demo, and outro. (300-500 words)`,
        CAMPAIGN_DRAFT: `Generate a marketing campaign draft for ${productContext?.name || 'this product'} in ${language === 'bn' ? 'Bangla' : 'English'}. Include target audience, messaging, and channels. (300-500 words)`,
        FAQ: `Generate frequently asked questions (5-7 Q&As) for ${productContext?.name} in ${language === 'bn' ? 'Bangla' : 'English'}.`,
      };

      const prompt = customPrompt || prompts[type] || prompts.PRODUCT_DESC_BN;
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert e-commerce content writer for The Dreamer IT Express, a tech retailer in Bangladesh. Write professional, accurate, and engaging content. Always ground your writing in the provided product data. Never fabricate specifications, prices, or features. If information is missing, flag it for review.' },
          { role: 'user', content: prompt },
        ],
      });

      content = completion.choices[0]?.message?.content || '';
      aiModel = 'glm';
      title = `${type.replace(/_/g, ' ')} - ${productContext?.name || 'General'}`;
    } catch (err: any) {
      console.error('AI generation failed:', err);
      return badRequest(`AI generation failed: ${err.message}. Please try again.`);
    }
  } else {
    // Manual draft
    title = body.title || 'Untitled draft';
    content = body.content || '';
    source = 'HUMAN';
  }

  const draft = await db.contentDraft.create({
    data: {
      productId: productId || null,
      type,
      title,
      content,
      language,
      status: 'DRAFT',
      source,
      aiModelUsed: aiModel || null,
      createdBy: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'content.create',
    entityType: 'ContentDraft',
    entityId: draft.id,
    metadata: { type, productId, source },
    ipAddress: getClientIp(req),
  });

  return ok({ draft });
});
