// POST /api/ai-wizard/process - Main AI processing pipeline
// Input: { photoUrls: string[], voiceText: string, productName?: string, category?: string }
// Process: VLM analyzes photos + LLM generates all marketing content
// Output: { product, marketing, video, social, invoice }
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'content.create' as any)) return forbidden();

  const body = await req.json();
  const { photoUrls, voiceText, productName, category, brandHint } = body;

  if (!voiceText && photoUrls?.length === 0) {
    return badRequest('ভয়েস বা ছবি অন্তত একটি প্রয়োজন');
  }

  // Use z-ai SDK for processing
  let analysisResult: any = null;
  let generatedContent: any = null;
  let marketingContent: any = null;
  let videoScript: any = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ZAIModule = require('z-ai-web-dev-sdk');
    const ZAI = ZAIModule.default || ZAIModule;
    const zai = await ZAI.create();

    // Step 1: Analyze photos using VLM (if photos provided)
    let photoAnalysis = null;
    if (photoUrls && photoUrls.length > 0) {
      try {
        const vlmResponse = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a product analysis AI. Analyze the product photo and extract: brand, model, type, color, condition, visible features. Respond in JSON format.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Analyze this product photo. Extract brand, model, type (laptop/desktop/component), key visible features, condition. Voice context: ${voiceText || 'No voice provided'}. Category hint: ${category || 'auto-detect'}` },
                { type: 'image_url', image_url: { url: photoUrls[0] } },
              ] as any,
            },
          ],
        });
        photoAnalysis = vlmResponse.choices[0]?.message?.content || '';
      } catch (e) {
        console.error('VLM failed:', e);
      }
    }

    // Step 2: Generate full product content using LLM
    const contentPrompt = `আপনি দ্য ড্রিমার আইটি এক্সপ্রেসের AI মার্কেটিং অ্যাসিস্ট্যান্ট। নিম্নলিখিত তথ্য থেকে একটি সম্পূর্ণ প্রোডাক্ট লিস্টিং তৈরি করুন।

ইনপুট তথ্য:
- ভয়েস ট্রান্সক্রিপশন: "${voiceText || 'না দেওয়া'}"
- ছবি বিশ্লেষণ: "${photoAnalysis || 'না দেওয়া'}"
- প্রোডাক্ট নাম (যদি দেওয়া থাকে): "${productName || 'অটো-জেনারেট'}"
- ক্যাটাগরি: "${category || 'অটো-ডিটেক্ট'}"

আপনাকে নিম্নলিখিত কনটেন্ট তৈরি করতে হবে (সব বাংলায়):

১. প্রোডাক্টের নাম (স্পষ্ট, সংক্ষিপ্ত)
২. ব্র্যান্ড
৩. মডেল নাম্বার (যদি শনাক্ত করা যায়)
৪. সংক্ষিপ্ত বিবরণ (১-২ বাক্যে)
৫. বিস্তারিত বর্ণনা (৩০০-৫০০ শব্দ, বাংলায়, সহজ ভাষায়)
৬. মূল স্পেসিফিকেশন (JSON অবজেক্ট হিসেবে)
৭. কেন কিনবেন (৩-৫টি কারণ)
৮. অতিরিক্ত সুবিধা (৩-৫টি)
৯. অন্যান্য ডিভাইস থেকে পার্থক্য (২-৩টি পয়েন্ট)
১০. অনুমানিত দাম (BDT)
১১. সর্বনিম্ন দাম (cost এর ১০% উপরে)
১২. অফার দাম (যদি প্রযোজ্য হয়)

JSON ফরম্যাটে রিটার্ন করুন:
{
  "name": "...",
  "brand": "...",
  "model": "...",
  "shortDescription": "...",
  "fullDescription": "...",
  "specs": { "key": "value", ... },
  "whyBuy": ["...", "..."],
  "keyBenefits": ["...", "..."],
  "differentiators": ["...", "..."],
  "estimatedPrice": 0,
  "minSellingPrice": 0,
  "offerPrice": 0,
  "warrantyMonths": 0,
  "condition": "new|used|refurbished"
}`;

    const contentResponse = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful AI that generates product listings in Bengali. Always respond in valid JSON format.' },
        { role: 'user', content: contentPrompt },
      ],
    });

    let contentText = contentResponse.choices[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = contentText.match(/```(?:json)?\s*([\s\S]*?)```/) || contentText.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      contentText = jsonMatch[1];
    }

    try {
      generatedContent = JSON.parse(contentText);
    } catch {
      generatedContent = {
        name: productName || 'অজানা প্রোডাক্ট',
        brand: brandHint || 'অজানা',
        shortDescription: voiceText?.slice(0, 100) || '',
        fullDescription: voiceText || '',
        specs: {},
        whyBuy: [],
        keyBenefits: [],
        differentiators: [],
        estimatedPrice: 0,
        minSellingPrice: 0,
        offerPrice: 0,
        warrantyMonths: 0,
        condition: 'new',
      };
    }

    // Step 3: Generate platform-specific marketing content
    const marketingPrompt = `এই প্রোডাক্টের জন্য সোশ্যাল মিডিয়া কনটেন্ট তৈরি করুন:

প্রোডাক্ট: ${generatedContent.name}
ব্র্যান্ড: ${generatedContent.brand}
দাম: ৳${generatedContent.estimatedPrice}
অফার দাম: ৳${generatedContent.offerPrice}
কেন কিনবেন: ${generatedContent.whyBuy?.join(', ')}

নিম্নলিখিত প্ল্যাটফর্মের জন্য আলাদা কনটেন্ট তৈরি করুন (JSON ফরম্যাটে):

{
  "facebook": {
    "caption": "আকর্ষণীয় পোস্ট ক্যাপশন (ইমোজি সহ)",
    "hashtags": ["#hashtag1", "#hashtag2", ...]
  },
  "instagram": {
    "caption": "ইনস্টাগ্রাম ক্যাপশন",
    "hashtags": [...]
  },
  "youtube": {
    "title": "ইউটিউব শর্টস টাইটেল",
    "description": "ডেসক্রিপশন",
    "tags": [...]
  },
  "whatsapp": {
    "message": "সংক্ষিপ্ত WhatsApp মেসেজ"
  }
}`;

    const marketingResponse = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a social media marketing AI. Generate engaging content in Bengali. Respond in JSON.' },
        { role: 'user', content: marketingPrompt },
      ],
    });

    let marketingText = marketingResponse.choices[0]?.message?.content || '';
    const mktMatch = marketingText.match(/```(?:json)?\s*([\s\S]*?)```/) || marketingText.match(/(\{[\s\S]*\})/);
    if (mktMatch) marketingText = mktMatch[1];

    try {
      marketingContent = JSON.parse(marketingText);
    } catch {
      marketingContent = {
        facebook: { caption: `${generatedContent.name} - ৳${generatedContent.estimatedPrice}`, hashtags: ['#DreamerIT', '#LaptopBD'] },
        instagram: { caption: generatedContent.shortDescription, hashtags: ['#DreamerIT'] },
        youtube: { title: generatedContent.name, description: generatedContent.shortDescription, tags: [] },
        whatsapp: { message: `${generatedContent.name} - ৳${generatedContent.estimatedPrice}. ইনবক্স করুন!` },
      };
    }

    // Step 4: Generate video script
    const videoPrompt = `এই প্রোডাক্টের জন্য ৩০-৬০ সেকেন্ডের ইউটিউব শর্টস ভিডিও স্ক্রিপ্ট তৈরি করুন (বাংলায়):

প্রোডাক্ট: ${generatedContent.name}
মূল ফিচার: ${generatedContent.whyBuy?.join(', ')}
দাম: ৳${generatedContent.estimatedPrice}

স্ক্রিপ্টে থাকবে:
- শুরু (৩ সেকেন্ডে হুক)
- প্রোডাক্ট পরিচিতি (৫ সেকেন্ড)
- মূল ফিচার (১৫ সেকেন্ড)
- ডেমো পরামর্শ (১০ সেকেন্ড)
- দাম ও কল-টু-অ্যাকশন (৫ সেকেন্ড)

JSON ফরম্যাটে:
{
  "title": "...",
  "duration": "30-60s",
  "scenes": [
    { "time": "0-3s", "visual": "...", "voiceover": "...", "text": "..." },
    ...
  ],
  "backgroundMusic": "upbeat|corporate|cinematic|gaming",
  "callToAction": "..."
}`;

    const videoResponse = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a video script writer for tech products. Write in Bengali. Respond in JSON.' },
        { role: 'user', content: videoPrompt },
      ],
    });

    let videoText = videoResponse.choices[0]?.message?.content || '';
    const vidMatch = videoText.match(/```(?:json)?\s*([\s\S]*?)```/) || videoText.match(/(\{[\s\S]*\})/);
    if (vidMatch) videoText = vidMatch[1];

    try {
      videoScript = JSON.parse(videoText);
    } catch {
      videoScript = {
        title: `${generatedContent.name} রিভিউ`,
        duration: '30-60s',
        scenes: [
          { time: '0-3s', visual: 'প্রোডাক্ট ক্লোজ-আপ', voiceover: 'এই প্রোডাক্টটি আপনার জন্য!', text: generatedContent.name },
          { time: '3-30s', visual: 'ফিচার দেখানো', voiceover: generatedContent.shortDescription, text: '' },
          { time: '30-45s', visual: 'দাম ও অফার', voiceover: `দাম মাত্র ৳${generatedContent.estimatedPrice}`, text: 'অর্ডার করুন' },
        ],
        backgroundMusic: 'upbeat',
        callToAction: 'ইনবক্স করুন বা কল করুন: 01610111688',
      };
    }

    analysisResult = {
      photoAnalysis,
      voiceTranscription: voiceText,
    };
  } catch (err: any) {
    console.error('AI processing failed:', err);
    return badRequest(`AI প্রসেসিং ব্যর্থ: ${err.message}`);
  }

  await logAudit({
    userId: user.id,
    action: 'ai_wizard.process',
    entityType: 'ContentDraft',
    metadata: { productName: generatedContent.name, hasPhotos: photoUrls?.length > 0 },
    ipAddress: getClientIp(req),
  });

  return ok({
    analysis: analysisResult,
    product: generatedContent,
    marketing: marketingContent,
    video: videoScript,
    // Generate invoice preview
    invoice: {
      productName: generatedContent.name,
      estimatedPrice: generatedContent.estimatedPrice,
      minSellingPrice: generatedContent.minSellingPrice,
      offerPrice: generatedContent.offerPrice,
      savings: generatedContent.estimatedPrice - generatedContent.offerPrice,
      currency: 'BDT',
    },
  });
});
