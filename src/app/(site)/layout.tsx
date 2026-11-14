import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container" style={{ minHeight: '60vh', paddingTop: 28 }}>{children}</main>
      <SiteFooter />
    </>
  );
}
