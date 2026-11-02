/** AI Content Studio: verified-field-only drafts, revision history and human approval. */

import { all, get, run, nowIso, scalar } from './database';
import { recordAudit } from './auth';
import { recordFailedJob } from './monitoring';
import { generateDraft, assertNoFabrication, type DraftKind, type VerifiedProductBundle } from '../core/content-rules';
import { moneyToBdt } from '../core/identity';
import { evaluateMedia } from '../core/catalogue-rules';
import { getMedia, getProductById, getSpecs } from './catalogue';

export function buildVerifiedBundle(productId: number): VerifiedProductBundle | null {
  const p = getProductById(productId);
  if (!p) return null;
  const priceOk = p.price_amount !== null && !!p.price_verified && !!p.price_source_url;
  const stockRows = scalar('SELECT COUNT(*) AS n FROM inventory_balances WHERE product_id = ?', [productId]);
  const available = stockRows > 0 ? scalar('SELECT COALESCE(SUM(on_hand - reserved), 0) AS n FROM inventory_balances WHERE product_id = ?', [productId]) : null;
  const warrantyOk = p.warranty_months !== null && !!p.warranty_source_url;
  return {
    productName: p.model_name,
    brand: p.brand_name,
    model: p.model_name,
    sku: p.sku,
    mpn: p.mpn,
    category: p.category_name,
    overview: p.overview,
    verifiedSpecs: getSpecs(productId).filter((s) => s.verified && s.source_url).map((s) => ({ key: s.spec_key, value: `${s.spec_value}${s.unit ? ` ${s.unit}` : ''}`, sourceUrl: s.source_url })),
    priceBdt: priceOk ? `BDT ${moneyToBdt(p.price_amount as number)} (${p.price_source_name})` : null,
    availability: available === null ? null : `${available} units across verified inventory records`,
    warranty: warrantyOk ? `${p.warranty_months} months (${p.warranty_source_url})` : null,
    mediaTier: evaluateMedia(getMedia(productId)).label,
  };
}

/**
 * Without an owner-provided AI key, the local template engine writes the draft.
 * With a key, an OpenAI-compatible provider is attempted; on any failure the job is
 * recorded and the verified-field-only template is used instead. The no-fabrication
 * check is applied to every draft regardless of generator.
 */
export async function generateContentDraft(kind: DraftKind, locale: 'bn' | 'en', productId: number, userId: number): Promise<{ ok: boolean; error?: string; draftId?: number }> {
  const bundle = buildVerifiedBundle(productId);
  if (!bundle) return { ok: false, error: 'Product not found.' };
  let generatedBy: 'template' | 'ai' = 'template';
  let model = 'local-verified-field-template-v1';
  let draft = generateDraft(kind, locale, bundle, generatedBy);

  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(process.env.AI_PROVIDER_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.AI_PROVIDER_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Rewrite the user-provided verified product facts in natural marketing language. Never add a specification, price, availability, warranty, certification, review or rating that is not present in the supplied facts. If a fact is missing, say it is not verified.' },
            { role: 'user', content: JSON.stringify({ kind, locale, verifiedFacts: bundle, baseline: draft.body }) },
          ],
          temperature: 0.2,
        }),
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const body = json.choices?.[0]?.message?.content?.trim();
      if (body) {
        draft = { ...draft, body, generatedBy: 'ai' };
        generatedBy = 'ai';
        model = process.env.AI_PROVIDER_MODEL || 'gpt-4o-mini';
      }
    } catch (error) {
      await recordFailedJob('ai_content_generation', { productId, kind, locale }, error instanceof Error ? error.message : String(error));
      // Keep the local, verified-field-only template draft.
    }
  }

  const check = assertNoFabrication(draft.body, bundle);
  if (!check.allowed) {
    await recordAudit('content.fabrication_blocked', 'product', productId, { violations: check.violations }, userId);
    return { ok: false, error: `Draft rejected by the no-fabrication check: ${check.violations.join(' ')}` };
  }
  const result = run(`INSERT INTO content_drafts (product_id, kind, locale, body, source_fields_json, generated_by, model, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [productId, kind, locale, draft.body, JSON.stringify(draft.sourceFields), generatedBy, model, nowIso()]);
  const id = Number(result.lastInsertRowid);
  run('INSERT INTO content_revisions (draft_id, body, changed_by, created_at) VALUES (?, ?, ?, ?)', [id, draft.body, userId, nowIso()]);
  await recordAudit('content.draft_generated', 'content_draft', id, { productId, kind, locale, generatedBy, missingClaims: draft.missingClaims }, userId);
  return { ok: true, draftId: id };
}

export async function reviewDraft(id: number, decision: 'approved' | 'rejected', userId: number): Promise<{ ok: boolean; error?: string }> {
  const draft = get<{ id: number; product_id: number | null; body: string }>('SELECT * FROM content_drafts WHERE id = ?', [id]);
  if (!draft) return { ok: false, error: 'Draft not found.' };
  if (decision === 'approved' && draft.product_id) {
    const bundle = buildVerifiedBundle(draft.product_id);
    if (bundle) {
      const check = assertNoFabrication(draft.body, bundle);
      if (!check.allowed) return { ok: false, error: `Cannot approve: ${check.violations.join(' ')}` };
    }
  }
  run('UPDATE content_drafts SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?', [decision, userId, nowIso(), id]);
  run('INSERT INTO content_revisions (draft_id, body, changed_by, created_at) VALUES (?, ?, ?, ?)', [id, `Review decision: ${decision}`, userId, nowIso()]);
  await recordAudit('content.reviewed', 'content_draft', id, { decision }, userId);
  return { ok: true };
}

export function listDrafts() {
  return all<{ id: number; kind: string; locale: string; body: string; status: string; generated_by: string; created_at: string; model_name: string | null }>(
    `SELECT d.*, p.model_name FROM content_drafts d LEFT JOIN products p ON p.id = d.product_id ORDER BY d.created_at DESC LIMIT 200`);
}
