import Link from 'next/link';
import { csrfToken } from '@/lib/server/auth';
import { getCartView } from '@/lib/server/cart';
import { cartRemoveAction } from '@/app/actions/customer';
import { Crumbs, EmptyState, PageHead, PageNotices, Table } from '@/components/ui';
import { moneyToBdt } from '@/lib/core/identity';

export const dynamic = 'force-dynamic';

export default async function CartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cart = await getCartView();
  const csrf = await csrfToken();
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'কার্ট' }]} />
      <PageNotices searchParams={sp} />
      <PageHead title="শপিং কার্ট" subtitle="কার্টে শুধুমাত্র প্রকাশিত পণ্য, যাচাইকৃত দাম ও প্রকৃত স্টক থেকে আইটেম যোগ করা যায়।" />
      {!cart || !cart.items.length ? <EmptyState title="আপনার কার্ট খালি"><p>কোনো যাচাইকৃত পণ্য এখনো প্রকাশিত হয়নি। <Link href="/products">পণ্য দেখুন</Link>।</p></EmptyState> : (
        <>
          <Table headers={['পণ্য', 'পরিমাণ', 'একক মূল্য', 'মোট', '']}>
            {cart.items.map((i) => <tr key={i.id}><td><Link href={`/products/${i.slug}`}>{i.model_name}</Link><br /><span className="muted">{i.sku}</span></td><td>{i.quantity}</td><td>৳ {moneyToBdt(i.unit_price)}</td><td>৳ {moneyToBdt(i.unit_price * i.quantity)}</td>
              <td><form action={cartRemoveAction}><input type="hidden" name="_csrf" value={csrf} /><input type="hidden" name="itemId" value={i.id} /><button className="btn btn-sm btn-danger" type="submit">সরান</button></form></td></tr>)}
          </Table>
          <div className="spread" style={{ marginTop: 18 }}><strong>সাবটোটাল: ৳ {moneyToBdt(cart.subtotal)}</strong><Link className="btn btn-primary" href="/checkout">চেকআউট →</Link></div>
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 12 }}>চেকআউটে অর্ডার তৈরি হয় কিন্তু যাচাইকৃত পেমেন্ট ইভেন্ট ছাড়া অর্ডার "paid" হয় না।</p>
        </>
      )}
    </>
  );
}
