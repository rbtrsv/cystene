/**
 * Shopify App Bridge — Global Type Declarations
 *
 * Declares the `shopify` global object injected by the App Bridge CDN script:
 * <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
 *
 * Only the APIs used by the embedded app are declared here.
 * Polaris web component types (s-page, s-card, etc.) come from
 * @shopify/polaris-types (npm devDependency + tsconfig.json types).
 *
 * App Bridge API reference:
 * https://shopify.dev/docs/api/app-bridge-library/apis
 *
 * WHY CDN + this file instead of npm packages:
 * - App Bridge CDN (`app-bridge.js`) is Shopify's 2025-2026 recommended approach.
 * - `@shopify/app-bridge-react` (npm) is designed for Remix/React Router only,
 *   not Next.js. Shopify deprecated `@shopify/shopify-app-nextjs`.
 * - Polaris web component types come from `@shopify/polaris-types` (npm),
 *   same approach as the official Shopify CLI template.
 * - `@shopify/polaris` (React components, npm) is deprecated in favor of
 *   Polaris web components (s-page, s-card, etc.) which are framework-agnostic.
 * - This file only declares the App Bridge global — Polaris types are automatic
 *   via `@shopify/polaris-types` in tsconfig.json `types` array.
 *
 * DEPRECATED alternatives (do NOT use):
 * - `@shopify/app-bridge-react` — Remix-only, not compatible with Next.js
 * - `@shopify/polaris` — deprecated React component library, CSS conflicts with Tailwind
 * - `@shopify/app-bridge-types` — not needed, this file covers the CDN global
 * - `shopify.getSessionToken()` — old API, replaced by `shopify.idToken()`
 */

// ==========================================
// App Bridge Global Object
// ==========================================

interface ShopifyAppBridge {
  /**
   * Asynchronously retrieves an OpenID Connect ID Token (session token)
   * from Shopify. Used to authenticate requests to our backend.
   *
   * The token is a JWT signed with SHOPIFY_CLIENT_SECRET (HS256),
   * audience = SHOPIFY_CLIENT_ID, expires in ~1 minute.
   *
   * NOTE: This replaces the deprecated `getSessionToken()` from older
   * App Bridge versions. Always use `shopify.idToken()`.
   *
   * https://shopify.dev/docs/api/app-bridge-library/apis/id-token
   */
  idToken(): Promise<string>;

  /**
   * App configuration — synchronously retrieved from App Bridge.
   * Populated automatically when the app loads in the Shopify Admin iframe.
   *
   * https://shopify.dev/docs/api/app-bridge-library/apis/config
   */
  config: {
    /** Shopify app API key (same as SHOPIFY_CLIENT_ID) */
    apiKey: string;
    /** Shop domain (e.g., "mystore.myshopify.com") */
    shop: string;
    /** Base64-encoded host for Shopify Admin URL context */
    host: string;
    /** Current locale (e.g., "en") */
    locale: string;
  };

  /**
   * Environment utilities — information about where the app is running.
   *
   * https://shopify.dev/docs/api/app-bridge-library/apis/environment
   */
  environment: {
    /** Whether the app is running in a mobile context */
    mobile: boolean;
    /** Whether the app is running embedded in Shopify Admin */
    embedded: boolean;
  };

  /**
   * Toast API — displays non-disruptive feedback messages
   * at the bottom of the Shopify Admin interface.
   *
   * https://shopify.dev/docs/api/app-bridge-library/apis/toast
   */
  toast: {
    show(message: string, options?: { duration?: number; isError?: boolean }): void;
  };

  /**
   * Loading API — shows/hides a loading bar at the top
   * of the Shopify Admin iframe.
   *
   * https://shopify.dev/docs/api/app-bridge-library/apis/loading
   */
  loading(show: boolean): void;
}

// ==========================================
// Global Declaration
// ==========================================

declare global {
  /** Shopify App Bridge global — available after app-bridge.js CDN script loads */
  const shopify: ShopifyAppBridge;

  interface Window {
    /** Shopify App Bridge global — available after app-bridge.js CDN script loads */
    shopify: ShopifyAppBridge;
  }
}

// ==========================================
// App Bridge Web Component Types
// ==========================================

/**
 * <s-app-nav> — Shopify Admin sidebar navigation.
 *
 * App Bridge web component (NOT a Polaris component — not in @shopify/polaris-types).
 * Renders automatically as left sidebar (desktop) and TitleBar dropdown (mobile).
 * Children are <s-link> elements defining navigation items.
 *
 * https://shopify.dev/docs/api/app-bridge-library/web-components/ui-nav-menu
 */
interface AppNavProps {
  children?: React.ReactNode;
}

/**
 * Augment <s-link> with `rel` prop.
 *
 * The `rel` attribute is used by <s-app-nav> to identify the home route
 * (rel="home"). This prop is App Bridge-specific and not included in
 * @shopify/polaris-types LinkProps.
 */
interface LinkRelProps {
  rel?: 'home' | (string & {});
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      's-app-nav': AppNavProps;
      's-link': IntrinsicElements['s-link'] & LinkRelProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      's-app-nav': AppNavProps;
      's-link': IntrinsicElements['s-link'] & LinkRelProps;
    }
  }
}

export {};
