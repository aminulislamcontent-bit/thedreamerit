// Global app navigation store - we use Zustand for client-side state since the platform
// only allows the / route. All "pages" are managed as app views within the single route.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppView =
  | { name: 'home' }
  | { name: 'catalog'; category?: string; brand?: string; query?: string }
  | { name: 'product'; productId: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'track-order' }
  | { name: 'customer-auth' }
  | { name: 'customer-account' }
  | { name: 'about' }
  | { name: 'contact' }
  | { name: 'faq' }
  | { name: 'privacy' }
  | { name: 'terms' }
  | { name: 'warranty' }
  | { name: 'returns' }
  | { name: 'delivery' }
  | { name: 'support' }
  | { name: 'blog' }
  | { name: 'compare' }
  | { name: 'pc-configurator'; productId?: string }
  // Admin / staff
  | { name: 'admin' }
  | { name: 'pos' };

export type AdminModule =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'pos'
  | 'procurement'
  | 'suppliers'
  | 'customers'
  | 'employees'
  | 'commissions'
  | 'finance'
  | 'content-studio'
  | 'seo'
  | 'marketing'
  | 'social'
  | 'support'
  | 'notifications'
  | 'branches'
  | 'transfers'
  | 'returns'
  | 'warranty'
  | 'reviews'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'integrations'
  | 'backups';

interface AppState {
  // Navigation
  view: AppView;
  adminModule: AdminModule;
  navigate: (view: AppView) => void;
  setAdminModule: (m: AdminModule) => void;

  // UI preferences
  theme: 'light' | 'dark';
  language: 'bn' | 'en';
  toggleTheme: () => void;
  setLanguage: (lang: 'bn' | 'en') => void;

  // Cart (client-side cache; server is source of truth)
  cartCount: number;
  setCartCount: (n: number) => void;

  // Comparison list
  compareList: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;

  // Toast
  toast: { title: string; description?: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (toast: { title: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: { name: 'home' },
      adminModule: 'dashboard',
      navigate: (view) => {
        set({ view });
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      },
      setAdminModule: (adminModule) => set({ adminModule }),

      theme: 'light',
      language: 'bn',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),

      cartCount: 0,
      setCartCount: (n) => set({ cartCount: n }),

      compareList: [],
      toggleCompare: (productId) =>
        set((s) => ({
          compareList: s.compareList.includes(productId)
            ? s.compareList.filter((id) => id !== productId)
            : [...s.compareList, productId].slice(0, 4),
        })),
      clearCompare: () => set({ compareList: [] }),

      toast: null,
      showToast: (toast) => {
        set({ toast: { ...toast, type: toast.type || 'info' } });
        setTimeout(() => set({ toast: null }), 4000);
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'dit-app-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        compareList: state.compareList,
      }),
    }
  )
);
