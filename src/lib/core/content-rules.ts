/**
 * AI Content Studio rule layer.
 *
 * The local draft engine composes copy ONLY from fields that are verified and sourced.
 * It never invents a specification, price, availability, certification, warranty,
 * testimonial, aggregate rating or discount. When a fact is missing, the draft says
 * so explicitly. An external AI provider may replace the wording, but the same
 * no-fabrication check and human approval gate still apply.
 */

export type VerifiedSpec = { key: string; value: string; sourceUrl: string };

export type VerifiedProductBundle = {
  productName: string;
  brand: string;
  model: string;
  sku: string;
  mpn: string;
  category: string;
  overview: string;
  verifiedSpecs: VerifiedSpec[];
  priceBdt: string | null; // formatted, only when verified + sourced
  availability: string | null; // only when a verified inventory record exists
  warranty: string | null; // only when sourced
  mediaTier: string;
};

export type DraftKind = 'description' | 'features' | 'technical_explainer' | 'buying_guide' | 'comparison' | 'seo_title' | 'meta_description' | 'social_caption' | 'video_script' | 'campaign' | 'faq';

export const DRAFT_KINDS: DraftKind[] = ['description', 'features', 'technical_explainer', 'buying_guide', 'comparison', 'seo_title', 'meta_description', 'social_caption', 'video_script', 'campaign', 'faq'];

export type GeneratedDraft = {
  kind: DraftKind;
  locale: 'bn' | 'en';
  body: string;
  sourceFields: string[];
  missingClaims: string[];
  generatedBy: 'template' | 'ai' | 'human';
  requiresHumanReview: boolean;
};

const T = {
  bn: {
    intro: (name: string) => `${name} সম্পর্কে যাচাইকৃত তথ্য নিচে দেওয়া হলো।`,
    specs: 'যাচাইকৃত প্রযুক্তিগত তথ্য',
    source: 'তথ্যসূত্র',
    price: 'যাচাইকৃত মূল্য',
    availability: 'প্রাপ্যতা',
    warranty: 'ওয়ারেন্টি',
    missing: 'এই তথ্যটি এখনো যাচাই করা হয়নি, তাই এখানে দাবি করা হয়নি।',
    noPrice: 'অনুমোদিত মূল্য উৎস না থাকায় মূল্য প্রদর্শন করা হয়নি।',
    noStock: 'যাচাইকৃত ইনভেন্টরি না থাকায় স্টক দাবি করা হয়নি।',
    disclaimer: 'কোনো গ্রাহক পর্যালোচনা, রেটিং বা প্রস্তুতকারকের দাবি এই খসড়ায় তৈরি করা হয়নি।',
  },
  en: {
    intro: (name: string) => `Verified information about ${name} is listed below.`,
    specs: 'Verified technical specifications',
    source: 'Source',
    price: 'Verified price',
    availability: 'Availability',
    warranty: 'Warranty',
    missing: 'This fact has not been verified, so no claim is made here.',
    noPrice: 'Price is not displayed because no authorized price source is recorded.',
    noStock: 'Stock is not claimed because no verified inventory record exists.',
    disclaimer: 'No customer reviews, ratings or manufacturer claims were invented for this draft.',
  },
} as const;

export function generateDraft(kind: DraftKind, locale: 'bn' | 'en', bundle: VerifiedProductBundle, generatedBy: 'template' | 'ai' | 'human' = 'template'): GeneratedDraft {
  const t = T[locale];
  const lines: string[] = [t.intro(bundle.productName)];
  const sourceFields: string[] = [];
  const missingClaims: string[] = [];

  const push = (field: string, label: string, value: string | null, missingNote: string) => {
    if (value && value.trim()) {
      lines.push(`${label}: ${value}`);
      sourceFields.push(field);
    } else {
      lines.push(missingNote);
      missingClaims.push(field);
    }
  };

  if (bundle.brand) { lines.push(`${locale === 'bn' ? 'ব্র্যান্ড' : 'Brand'}: ${bundle.brand}`); sourceFields.push('brand'); }
  if (bundle.model) { lines.push(`${locale === 'bn' ? 'মডেল' : 'Model'}: ${bundle.model}`); sourceFields.push('model'); }
  if (bundle.category) { lines.push(`${locale === 'bn' ? 'ক্যাটাগরি' : 'Category'}: ${bundle.category}`); sourceFields.push('category'); }
  if (bundle.overview.trim()) { lines.push(bundle.overview); sourceFields.push('overview'); }

  if (bundle.verifiedSpecs.length) {
    lines.push(`\n${t.specs}:`);
    for (const spec of bundle.verifiedSpecs) {
      lines.push(`- ${spec.key}: ${spec.value} (${t.source}: ${spec.sourceUrl})`);
      sourceFields.push(`spec:${spec.key}`);
    }
  } else {
    lines.push(t.missing);
    missingClaims.push('verifiedSpecs');
  }

  push('price', t.price, bundle.priceBdt, t.noPrice);
  push('availability', t.availability, bundle.availability, t.noStock);
  push('warranty', t.warranty, bundle.warranty, t.missing);

  if (kind === 'seo_title') {
    lines.length = 0;
    lines.push(`${bundle.brand} ${bundle.model} | ${bundle.category} | The Dreamer IT Express`);
  } else if (kind === 'meta_description') {
    lines.length = 0;
    const specSummary = bundle.verifiedSpecs.slice(0, 2).map((s) => `${s.key} ${s.value}`).join(', ');
    lines.push(`${bundle.brand} ${bundle.model} — ${specSummary || t.missing} ${bundle.priceBdt ? `| ${bundle.priceBdt}` : ''} | ${t.source}: যাচাইকৃত তথ্য`.slice(0, 158));
  } else if (kind === 'faq') {
    lines.push(`\n${locale === 'bn' ? 'প্রশ্ন: এই পণ্যের দাম কত?' : 'Q: What is the price?'} ${bundle.priceBdt ? (locale === 'bn' ? `উত্তর: যাচাইকৃত মূল্য ${bundle.priceBdt}।` : `A: The verified price is ${bundle.priceBdt}.`) : t.noPrice}`);
    lines.push(`${locale === 'bn' ? 'প্রশ্ন: পণ্যটি স্টকে আছে কি?' : 'Q: Is it in stock?'} ${bundle.availability ? bundle.availability : t.noStock}`);
  } else if (kind === 'social_caption') {
    lines.push(`\n${locale === 'bn' ? 'যাচাইকৃত তথ্য ছাড়া কোনো দাবি নেই।' : 'No claims beyond verified data.'}`);
  } else if (kind === 'video_script') {
    lines.push(`\n${locale === 'bn' ? 'ভিডিওতে শুধুমাত্র যাচাইকৃত ছবি ও তথ্য ব্যবহার করুন; পণ্য-নির্দিষ্ট ভিডিও না থাকলে তা স্পষ্টভাবে উল্লেখ করুন।' : 'Use only verified product media and facts; label any category demonstration clearly.'}`);
  }

  lines.push(`\n${t.disclaimer}`);
  lines.push(`${locale === 'bn' ? 'মিডিয়া উপস্থাপনা' : 'Media presentation'}: ${bundle.mediaTier}`);

  return {
    kind,
    locale,
    body: lines.join('\n').trim(),
    sourceFields: [...new Set(sourceFields)],
    missingClaims: [...new Set(missingClaims)],
    generatedBy,
    requiresHumanReview: true, // commercially sensitive claims always need human review
  };
}

const FORBIDDEN_PATTERNS: Array<{ re: RegExp; claim: string; field: keyof VerifiedProductBundle }> = [
  { re: /(?:৳|tk\.?|bdt)\s*[\d,]+/i, claim: 'a price', field: 'priceBdt' },
  { re: /\b(?:in stock|স্টকে আছে|এখনই পাবেন|available now)\b/i, claim: 'availability', field: 'availability' },
  { re: /\b(?:5[-\s]?star|★★★★★|\d(?:\.\d)?\s*\/\s*5\s*(?:rating|stars?))\b/i, claim: 'an aggregate rating', field: 'overview' },
  { re: /\b(?:customer review|verified buyer|গ্রাহক পর্যালোচনা)\b/i, claim: 'a customer review', field: 'overview' },
  { re: /\b(?:certified by|সার্টিফাইড|award[- ]winning)\b/i, claim: 'a certification', field: 'overview' },
];

/** Reject any draft that asserts a commercial claim the verified bundle cannot support. */
export function assertNoFabrication(body: string, bundle: VerifiedProductBundle): { allowed: boolean; violations: string[] } {
  const violations: string[] = [];
  // Explicit negations/disclaimers ("no customer reviews were invented") are not claims.
  const negation = /\b(no|not|never|without|unverified|hidden|unavailable)\b|কোনো|নেই|হয়নি|না |প্রদর্শন করা হয়নি|দাবি করা হয়নি/i;
  const claimLines = body.split('\n').filter((line) => !negation.test(line));
  const claimText = claimLines.join('\n');
  for (const { re, claim, field } of FORBIDDEN_PATTERNS) {
    if (!re.test(claimText)) continue;
    const supported = field === 'overview' ? false : Boolean(bundle[field]);
    if (!supported) violations.push(`Draft asserts ${claim} without a verified source field.`);
  }
  // Every specification value in the draft must appear in the verified bundle.
  for (const match of claimText.matchAll(/\b\d{2,}\s?(?:GB|TB|W|Hz|inch|core|mm)\b/gi)) {
    const token = match[0].toLowerCase().replace(/\s/g, '');
    const found = bundle.verifiedSpecs.some((s) => `${s.value}`.toLowerCase().replace(/\s/g, '').includes(token));
    if (!found) violations.push(`Draft mentions an unverified specification value "${match[0]}".`);
  }
  return { allowed: violations.length === 0, violations: [...new Set(violations)] };
}
