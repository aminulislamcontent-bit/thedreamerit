import Link from 'next/link';
import { all } from '@/lib/server/database';
import { mediaQueue } from '@/lib/server/media';
import { addMediaUrlAction, grantPermissionAction, removeMediaAction, reviewMediaAction, setPrimaryAction, uploadMediaAction } from '@/app/actions/media';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, Notice, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function MediaAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const products = all<{ id: number; model_name: string }>('SELECT id, model_name FROM products ORDER BY model_name');
  const queue = mediaQueue();
  const options = products.map((p) => <option key={p.id} value={p.id}>{p.model_name}</option>);
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="পণ্য মিডিয়া অ্যাডমিনিস্ট্রেশন" subtitle="আপলোড, ভিডিও, GLB/glTF, অনুমোদিত URL আমদানি, ক্রম পরিবর্তন, প্রধান ছবি, ভ্যারিয়েন্ট-নির্দিষ্ট মিডিয়া, alt text, ক্যাপশন, উৎস, লাইসেন্স, প্রিভিউ, প্রতিস্থাপন, গুণমান পর্যালোচনা ও ব্যর্থ প্রক্রিয়াকরণ।" />
      <div className="grid grid-2">
        <Card><h2>ফাইল আপলোড</h2>
          <form action={uploadMediaAction} className="stack"><CsrfInput />
            <div className="form-grid">
              <div className="field"><label htmlFor="fileProduct">পণ্য *</label><select id="fileProduct" name="productId" required>{options}</select></div>
              <div className="field"><label htmlFor="fileKind">ধরন *</label><select id="fileKind" name="kind"><option value="image">ছবি (JPEG/PNG/WebP/AVIF ≤15MB)</option><option value="spin_frame">360° ফ্রেম</option><option value="video">ভিডিও (MP4/WebM ≤250MB)</option><option value="model_3d">3D মডেল (.glb/.gltf ≤80MB)</option><option value="document">নথি (PDF ≤20MB)</option></select></div>
              <div className="field" style={{ gridColumn: '1/-1' }}><label htmlFor="file">ফাইল *</label><input id="file" name="file" type="file" required /></div>
              <div className="field"><label htmlFor="fileAlt">Alt text</label><input id="fileAlt" name="altText" /></div>
              <div className="field"><label htmlFor="fileCaption">ক্যাপশন</label><input id="fileCaption" name="caption" /></div>
              <div className="field"><label htmlFor="fileSource">উৎস URL</label><input id="fileSource" name="sourceUrl" type="url" /></div>
              <div className="field"><label htmlFor="fileSourceName">উৎসের নাম</label><input id="fileSourceName" name="sourceName" /></div>
              <div className="field"><label htmlFor="fileLicense">লাইসেন্স</label><input id="fileLicense" name="license" /></div>
              <div className="field"><label htmlFor="fileSequence">360° সিকোয়েন্স কী</label><input id="fileSequence" name="sequenceKey" placeholder="spin-front" /></div>
              <div className="field"><label htmlFor="fileOrder">ক্রম</label><input id="fileOrder" name="sortOrder" type="number" min="0" defaultValue="0" /></div>
            </div>
            <button className="btn btn-primary" type="submit">ভ্যালিডেট + আপলোড</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>ফাইলের নাম স্যানিটাইজ করা হয়, MIME ও সাইজ যাচাই করা হয়, কনটেন্ট <code>uploads/</code>-এ আলাদাভাবে রাখা হয় এবং <code>/media/[file]</code> শুধুমাত্র অনুমোদিত/অনুমতিপ্রাপ্ত মিডিয়াই পাবলিক করে।</p>
        </Card>
        <Card><h2>বাহ্যিক URL আমদানি</h2><p className="muted">বাহ্যিক ছবি/ভিডিও স্বয়ংক্রিয়ভাবে প্রকাশ হয় না — উৎস, ব্যবহারের অনুমতি ও মানব পর্যালোচনা আবশ্যক।</p>
          <form action={addMediaUrlAction} className="stack"><CsrfInput />
            <div className="form-grid">
              <div className="field"><label htmlFor="urlProduct">পণ্য *</label><select id="urlProduct" name="productId" required>{options}</select></div>
              <div className="field"><label htmlFor="urlKind">ধরন *</label><select id="urlKind" name="kind"><option value="image">ছবি</option><option value="video">ভিডিও</option><option value="model_3d">3D মডেল</option><option value="spin_frame">360° ফ্রেম</option><option value="document">নথি</option></select></div>
              <div className="field" style={{ gridColumn: '1/-1' }}><label htmlFor="url">URL *</label><input id="url" name="url" required /></div>
              <div className="field"><label htmlFor="urlAlt">Alt text</label><input id="urlAlt" name="altText" /></div>
              <div className="field"><label htmlFor="urlSource">উৎস URL</label><input id="urlSource" name="sourceUrl" /></div>
              <div className="field"><label htmlFor="urlSourceName">উৎসের নাম</label><input id="urlSourceName" name="sourceName" /></div>
              <div className="field"><label htmlFor="urlLicense">লাইসেন্স</label><input id="urlLicense" name="license" /></div>
              <div className="field"><label htmlFor="urlPermission">অনুমতি</label><select id="urlPermission" name="permissionStatus"><option value="unknown">অজানা</option><option value="pending">অপেক্ষমাণ</option><option value="granted">অনুমোদিত</option><option value="denied">প্রত্যাখ্যাত</option></select></div>
            </div>
            <button className="btn btn-primary" type="submit">পেন্ডিং রিভিউতে যোগ করুন</button>
          </form>
        </Card>
      </div>

      <Notice tone="warn">মিডিয়া অগ্রাধিকার: ১) যাচাইকৃত পণ্য-নির্দিষ্ট 3D মডেল, ২) প্রকৃত 360° ছবির ধারাবাহিকতা (≥৮টি ক্রমিক ফ্রেম), ৩) বহু-কোণের ছবি + পণ্য ভিডিও, ৪) শুধু বহু-কোণের ছবি। স্থির গ্যালারিকে কখনোই 3D/360° বলা হয় না। মিডিয়া চেক পাস না হলে চূড়ান্ত প্রকাশনা অনুমোদন দেওয়া যায় না।</Notice>

      <h2 style={{ marginTop: 24 }}>মিডিয়া কিউ ({queue.length})</h2>
      {queue.length ? <Table headers={['পণ্য', 'ধরন', 'URL', 'উৎস', 'অনুমতি', 'পর্যালোচনা', 'জব', 'অ্যাকশন']}>
        {queue.map((m) => (
          <tr key={m.id}>
            <td><Link href={`/admin/products/${m.product_id}`}>{m.model_name}</Link></td><td>{m.kind}</td><td className="muted">{m.url.slice(0, 48)}</td><td className="muted">{m.source_url.slice(0, 32) || '—'}</td>
            <td><Badge tone={m.permission_status === 'granted' ? 'ok' : 'warn'}>{m.permission_status}</Badge></td>
            <td><Badge tone={m.review_status === 'approved' ? 'ok' : m.review_status === 'rejected' ? 'danger' : 'warn'}>{m.review_status}</Badge></td>
            <td>{m.job_status}{m.error ? ` — ${m.error}` : ''}</td>
            <td>
              <div className="row">
                <form action={grantPermissionAction}><CsrfInput /><input type="hidden" name="mediaId" value={m.id} /><input type="hidden" name="license" value={m.license || 'Authorized reseller use'} /><input type="hidden" name="sourceUrl" value={m.source_url || 'internal-upload'} /><button className="btn btn-sm" type="submit">অনুমতি</button></form>
                <form action={reviewMediaAction}><CsrfInput /><input type="hidden" name="mediaId" value={m.id} /><input type="hidden" name="decision" value="approved" /><button className="btn btn-sm btn-primary" type="submit">অনুমোদন</button></form>
                <form action={reviewMediaAction}><CsrfInput /><input type="hidden" name="mediaId" value={m.id} /><input type="hidden" name="decision" value="rejected" /><button className="btn btn-sm" type="submit">প্রত্যাখ্যান</button></form>
                <form action={setPrimaryAction}><CsrfInput /><input type="hidden" name="mediaId" value={m.id} /><button className="btn btn-sm" type="submit">প্রধান</button></form>
                <form action={removeMediaAction}><CsrfInput /><input type="hidden" name="mediaId" value={m.id} /><button className="btn btn-sm btn-danger" type="submit">মুছুন</button></form>
              </div>
            </td>
          </tr>
        ))}
      </Table> : <p className="muted">কোনো মিডিয়া রেকর্ড নেই।</p>}
    </>
  );
}
