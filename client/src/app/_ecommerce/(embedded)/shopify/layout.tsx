/**
 * Shopify Embedded App Layout
 *
 * Root layout for the embedded Shopify app (/shopify/*).
 * Runs inside the Shopify Admin iframe — completely separate from
 * the standalone ecommerce layout ((standalone)/*).
 *
 * This layout:
 * 1. Loads App Bridge + Polaris web components via CDN scripts
 * 2. On mount: gets session token via shopify.idToken()
 * 3. Calls POST /shopify/embedded/init to initialize/auto-provision
 * 4. Provides EmbeddedContext to all child pages
 *
 * No sidebar, no breadcrumb, no AccountsProviders, no EcommerceProviders.
 * Auth is handled via Shopify session tokens, not our JWT cookies.
 * UI uses Polaris web components (s-page, s-card, etc.), not shadcn.
 *
 * WHY CDN scripts instead of npm imports:
 * - App Bridge CDN is Shopify's 2025-2026 recommended approach for non-Remix apps.
 * - Polaris web components (s-page, s-card) are framework-agnostic custom elements
 *   loaded via CDN. They replace the deprecated @shopify/polaris React library.
 * - @shopify/app-bridge-react is Remix-only — does not work with Next.js.
 * - Polaris web components have zero CSS conflict with our Tailwind/shadcn setup
 *   because they use shadow DOM isolation.
 * - Types are provided by @shopify/polaris-types (npm devDependency) and
 *   modules/ecommerce/types/shopify.d.ts (App Bridge global).
 *
 * See: https://shopify.dev/docs/api/app-bridge-library
 * See: https://shopify.dev/docs/api/app-home/using-polaris-components
 */

'use client';

import Script from 'next/script';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  initEmbedded,
  type EmbeddedConnection,
  type EmbeddedStats,
  type EmbeddedBilling,
} from '@/modules/ecommerce/service/shopify-embedded.service';

// ==========================================
// Context Types
// ==========================================

interface EmbeddedContextValue {
  /** Connection info (shop domain, platform, active status) */
  connection: EmbeddedConnection | null;
  /** Product/order count stats */
  stats: EmbeddedStats | null;
  /** Shopify billing status (plan, subscription) */
  billing: EmbeddedBilling | null;
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error message if init failed */
  error: string | null;
  /** Get a fresh session token from App Bridge */
  getSessionToken: () => Promise<string>;
  /** Refresh dashboard data (re-calls POST /init) */
  refresh: () => Promise<void>;
}

// ==========================================
// Context
// ==========================================

const EmbeddedContext = createContext<EmbeddedContextValue>({
  connection: null,
  stats: null,
  billing: null,
  isLoading: true,
  error: null,
  getSessionToken: () => Promise.reject(new Error('EmbeddedContext not initialized')),
  refresh: () => Promise.reject(new Error('EmbeddedContext not initialized')),
});

/**
 * Hook to access embedded app context.
 * Must be used within ShopifyEmbeddedLayout.
 */
export const useEmbedded = () => useContext(EmbeddedContext);

// ==========================================
// Layout Component
// ==========================================

export default function ShopifyEmbeddedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Dashboard state
  const [connection, setConnection] = useState<EmbeddedConnection | null>(null);
  const [stats, setStats] = useState<EmbeddedStats | null>(null);
  const [billing, setBilling] = useState<EmbeddedBilling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether App Bridge script has loaded
  const [bridgeReady, setBridgeReady] = useState(false);

  /**
   * Get a fresh session token from App Bridge.
   * Tokens expire after ~1 minute, so always get a fresh one before API calls.
   */
  const getSessionToken = useCallback(async (): Promise<string> => {
    if (typeof window === 'undefined' || !window.shopify) {
      throw new Error('App Bridge not loaded');
    }
    return window.shopify.idToken();
  }, []);

  /**
   * Initialize or refresh the embedded app.
   * Gets a fresh session token → calls POST /init → updates state.
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getSessionToken();
      const response = await initEmbedded(token);

      setConnection(response.connection);
      setStats(response.stats);
      setBilling(response.billing);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize embedded app';
      setError(message);
      console.error('Embedded init error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getSessionToken]);

  /**
   * Initialize on mount — wait for App Bridge to be ready, then call /init.
   * App Bridge script loads via beforeInteractive, so it should be available
   * by the time React hydrates. We poll briefly in case of race conditions.
   */
  // Force light mode — Polaris handles its own theming, our dark mode CSS must not interfere.
  // Without this, macOS dark appearance causes body background to go dark in Safari.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    // Check if App Bridge is already available
    if (typeof window !== 'undefined' && window.shopify) {
      setBridgeReady(true);
      return;
    }

    // Poll for App Bridge availability (script may still be loading)
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.shopify) {
        setBridgeReady(true);
        clearInterval(interval);
      }
    }, 100);

    // Stop polling after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.shopify) {
        setError('App Bridge failed to load. Please refresh the page.');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Once App Bridge is ready, initialize the embedded app
  useEffect(() => {
    if (bridgeReady) {
      refresh();
    }
  }, [bridgeReady, refresh]);

  // ==========================================
  // Context value
  // ==========================================

  const contextValue: EmbeddedContextValue = {
    connection,
    stats,
    billing,
    isLoading,
    error,
    getSessionToken,
    refresh,
  };

  return (
    <>
      {/* Polaris web components — Shopify UI design system (s-page, s-card, etc.)
          App Bridge is loaded in root layout.tsx <head> (must be first sync script). */}
      <Script
        src="https://cdn.shopify.com/shopifycloud/polaris.js"
        strategy="beforeInteractive"
      />

      {/* Shopify Admin sidebar navigation — renders automatically in Admin sidebar (desktop)
          and as dropdown from TitleBar (mobile). Links must use href, not onClick.
          First link with rel="home" defines the home route (not rendered as nav item). */}
      <s-app-nav>
        <s-link href="/shopify" rel="home">Dashboard</s-link>
        <s-link href="/shopify/settings">Settings</s-link>
        <s-link href="/shopify/recommendations">Recommendations</s-link>
        <s-link href="/shopify/components">Components</s-link>
        <s-link href="/shopify/documentation">Documentation</s-link>
        <s-link href="/shopify/billing">Billing</s-link>
      </s-app-nav>

      <EmbeddedContext.Provider value={contextValue}>
        {children}
      </EmbeddedContext.Provider>
    </>
  );
}
