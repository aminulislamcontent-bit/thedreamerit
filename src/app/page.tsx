// Main App Page - routes between storefront, admin, and POS based on app state
'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { StorefrontHeader } from '@/components/storefront/header';
import { StorefrontFooter } from '@/components/storefront/footer';
import { HomePage } from '@/components/storefront/home-page-v2';
import { CatalogPage } from '@/components/storefront/catalog-page';
import { ProductDetailPage } from '@/components/storefront/product-detail-page';
import { CartPage } from '@/components/storefront/cart-page';
import { CheckoutPage } from '@/components/storefront/checkout-page';
import { OrderSuccessPage } from '@/components/storefront/order-success-page';
import { TrackOrderPage } from '@/components/storefront/track-order-page';
import { CustomerAuthPage } from '@/components/storefront/customer-auth-page';
import { PcConfiguratorPage } from '@/components/storefront/pc-configurator-page-v3';
import { ComparePage } from '@/components/storefront/compare-page';
import {
  AboutPage, ContactPage, FaqPage, PrivacyPage, TermsPage,
  WarrantyPage, ReturnsPage, DeliveryPage, SupportPage, BlogPage,
} from '@/components/storefront/info-pages';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { PosTerminal } from '@/components/pos/pos-terminal';
import { WhatsAppWidget } from '@/components/storefront/whatsapp-widget';
import { useAuth } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const view = useAppStore((s) => s.view);
  const { user } = useAuth();
  const isAdminView = view.name === 'admin' || view.name === 'pos';

  // Apply theme class to body
  useEffect(() => {
    document.documentElement.classList.toggle('dark', false);
  }, []);

  // Admin and POS views don't use storefront layout
  if (view.name === 'admin') {
    return (
      <>
        <AdminDashboard />
        <Toaster position="top-right" richColors />
      </>
    );
  }
  if (view.name === 'pos') {
    return (
      <>
        <PosTerminal />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  // Storefront layout with WhatsApp widget
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StorefrontHeader />
      <main className="flex-1">
        {renderView(view, user)}
      </main>
      <StorefrontFooter />
      <WhatsAppWidget />
      <Toaster position="top-right" richColors />
    </div>
  );
}

function renderView(view: any, user: any) {
  switch (view.name) {
    case 'home': return <HomePage />;
    case 'catalog': return <CatalogPage initialCategory={view.category} initialBrand={view.brand} initialQuery={view.query} />;
    case 'product': return <ProductDetailPage productId={view.productId} />;
    case 'cart': return <CartPage />;
    case 'checkout': return <CheckoutPage />;
    case 'order-success': return <OrderSuccessPage orderId={view.orderId} />;
    case 'track-order': return <TrackOrderPage />;
    case 'customer-auth': return <CustomerAuthPage />;
    case 'pc-configurator': return <PcConfiguratorPage />;
    case 'compare': return <ComparePage />;
    case 'about': return <AboutPage />;
    case 'contact': return <ContactPage />;
    case 'faq': return <FaqPage />;
    case 'privacy': return <PrivacyPage />;
    case 'terms': return <TermsPage />;
    case 'warranty': return <WarrantyPage />;
    case 'returns': return <ReturnsPage />;
    case 'delivery': return <DeliveryPage />;
    case 'support': return <SupportPage />;
    case 'blog': return <BlogPage />;
    default: return <HomePage />;
  }
}
