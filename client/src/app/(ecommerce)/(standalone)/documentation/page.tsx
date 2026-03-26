/**
 * Standalone Dashboard — Documentation Page
 *
 * Static content page with shadcn Card sections.
 * No API calls, no hooks, no backend interaction.
 *
 * Sections:
 * 1. Quick Start — 3-step overview
 * 2. Data Ingestion (Push API) — endpoints + curl examples for custom integrations
 * 3. Widget API Keys — how to generate HMAC signing keys
 * 4. Embedding on Custom Sites — widget.js snippet + data-* attributes
 * 5. WordPress Plugin — Gutenberg block + shortcode
 * 6. Widget Types — bestsellers, cross-sell, upsell, similar
 * 7. Visual Settings — 8 groups overview
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Everything you need to integrate Nudgio into your store or custom website.
        </p>
      </div>

      {/* ==========================================
          Quick Start — 3-step overview
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get product recommendations on your site in three steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
              <div>
                <p className="font-medium">Create a Connection</p>
                <p className="text-sm text-muted-foreground">
                  Go to Connections → New Connection. Choose Shopify, WooCommerce, Magento, or Custom.
                  Platform connections sync your catalog and orders automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
              <div>
                <p className="font-medium">Sync or Push Data</p>
                <p className="text-sm text-muted-foreground">
                  Platform connections (Shopify, WooCommerce, Magento) sync automatically after OAuth.
                  For custom integrations, push products, orders, and order items via the Push API (see below).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</span>
              <div>
                <p className="font-medium">Embed the Widget</p>
                <p className="text-sm text-muted-foreground">
                  Go to Components → configure your widget → Copy Snippet.
                  Paste the snippet into your HTML, or use the WordPress plugin.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          Data Ingestion (Push API) — custom integrations
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Data Ingestion (Push API)</CardTitle>
          <CardDescription>
            For custom integrations — push your product catalog, orders, and order items via REST API.
            Platform connections (Shopify, WooCommerce, Magento) sync automatically and do not need this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Authentication</h3>
            <p className="text-sm text-muted-foreground mb-2">
              All Push API requests require a Bearer token (your JWT from login).
              Include it in the Authorization header:
            </p>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`Authorization: Bearer <your-jwt-token>`}
            </pre>
          </div>

          {/* POST /ecommerce/data/import/products */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Import Products</h3>
            <p className="text-sm text-muted-foreground mb-2">
              <code className="bg-muted px-1 py-0.5 rounded text-xs">POST /ecommerce/data/import/products</code>
            </p>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`curl -X POST https://nudgio.com/ecommerce/data/import/products \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "connection_id": "your-connection-uuid",
    "products": [
      {
        "platform_id": "SKU-001",
        "title": "Classic T-Shirt",
        "price": 29.99,
        "image_url": "https://example.com/images/tshirt.jpg",
        "vendor": "Acme Clothing",
        "sku": "SKU-001",
        "handle": "classic-t-shirt"
      },
      {
        "platform_id": "SKU-002",
        "title": "Premium Hoodie",
        "price": 59.99,
        "image_url": "https://example.com/images/hoodie.jpg",
        "vendor": "Acme Clothing",
        "sku": "SKU-002",
        "handle": "premium-hoodie"
      }
    ]
  }'`}
            </pre>
            <p className="text-xs text-muted-foreground mt-1">
              Required: <code className="bg-muted px-1 py-0.5 rounded">platform_id</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">title</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">price</code>.
              Optional: <code className="bg-muted px-1 py-0.5 rounded">image_url</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">vendor</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">sku</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">handle</code>.
            </p>
          </div>

          {/* POST /ecommerce/data/import/orders */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Import Orders</h3>
            <p className="text-sm text-muted-foreground mb-2">
              <code className="bg-muted px-1 py-0.5 rounded text-xs">POST /ecommerce/data/import/orders</code>
            </p>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`curl -X POST https://nudgio.com/ecommerce/data/import/orders \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "connection_id": "your-connection-uuid",
    "orders": [
      {
        "platform_id": "ORD-1001",
        "order_number": "1001",
        "total_price": 89.98,
        "currency": "USD",
        "created_at": "2026-03-01T14:30:00Z"
      },
      {
        "platform_id": "ORD-1002",
        "order_number": "1002",
        "total_price": 59.99,
        "currency": "USD",
        "created_at": "2026-03-02T10:15:00Z"
      }
    ]
  }'`}
            </pre>
            <p className="text-xs text-muted-foreground mt-1">
              Required: <code className="bg-muted px-1 py-0.5 rounded">platform_id</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">total_price</code>.
              Optional: <code className="bg-muted px-1 py-0.5 rounded">order_number</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">currency</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">created_at</code>.
            </p>
          </div>

          {/* POST /ecommerce/data/import/order-items */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Import Order Items</h3>
            <p className="text-sm text-muted-foreground mb-2">
              <code className="bg-muted px-1 py-0.5 rounded text-xs">POST /ecommerce/data/import/order-items</code>
            </p>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`curl -X POST https://nudgio.com/ecommerce/data/import/order-items \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "connection_id": "your-connection-uuid",
    "order_items": [
      {
        "order_platform_id": "ORD-1001",
        "product_platform_id": "SKU-001",
        "quantity": 1,
        "unit_price": 29.99
      },
      {
        "order_platform_id": "ORD-1001",
        "product_platform_id": "SKU-002",
        "quantity": 1,
        "unit_price": 59.99
      }
    ]
  }'`}
            </pre>
            <p className="text-xs text-muted-foreground mt-1">
              All fields required: <code className="bg-muted px-1 py-0.5 rounded">order_platform_id</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">product_platform_id</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">quantity</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded">unit_price</code>.
            </p>
          </div>

          {/* Note about connection_id */}
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3">
            <p className="text-sm">
              <span className="font-medium">Note:</span> The <code className="bg-muted px-1 py-0.5 rounded text-xs">connection_id</code> is
              your connection&apos;s UUID, visible on the connection&apos;s Overview page.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          Widget API Keys
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Widget API Keys</CardTitle>
          <CardDescription>
            Generate HMAC signing keys for secure widget embedding on your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
            <p className="text-sm">
              Go to your connection → <strong>API Keys</strong> tab.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
            <p className="text-sm">
              Click <strong>Generate Key</strong> — enter a name and optional allowed domains (comma-separated).
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</span>
            <p className="text-sm">
              <strong>Save the secret immediately</strong> — it is shown once and encrypted in the database.
              You cannot retrieve it later.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">4</span>
            <p className="text-sm">
              Use the <strong>Key ID</strong> and <strong>API Secret</strong> for HMAC-signed widget URLs
              (used by widget.js and the WordPress plugin).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          Embedding on Custom Sites
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Embedding on Custom Sites</CardTitle>
          <CardDescription>
            Add the Nudgio widget to any HTML page using a simple snippet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steps */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
              <p className="text-sm">
                Go to <strong>Components</strong> → configure your widget type, colors, and layout.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
              <p className="text-sm">
                Click <strong>Copy Snippet</strong> to copy the embed code.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</span>
              <p className="text-sm">
                Paste the snippet into your HTML where you want recommendations to appear.
              </p>
            </div>
          </div>

          {/* Snippet example */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Snippet Example</h3>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`<div class="nudgio-widget"
  data-type="bestsellers"
  data-count="4"
  data-lookback-days="30"
  data-method="volume"
></div>

<script src="https://nudgio.com/widget.js"
  data-key-id="your-key-id"
  data-api-secret="your-api-secret"
></script>`}
            </pre>
          </div>

          {/* data-* attributes reference */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Available data-* Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-type</code> — bestsellers, cross-sell, upsell, similar</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-count</code> — number of products to show</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-product-id</code> — product ID (for cross-sell, upsell, similar)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-lookback-days</code> — order history window (days)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-method</code> — volume, value, or balanced (bestsellers only)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-min-price-increase-percent</code> — minimum % increase (upsell only)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-widget-bg-color</code> — widget background color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-widget-padding</code> — none, sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-widget-title</code> — heading text</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-title-color</code> — heading text color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-title-size</code> — sm, md, lg, xl</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-title-alignment</code> — left, center</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-widget-style</code> — grid or carousel</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-widget-columns</code> — 2, 3, 4, 5, 6</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-gap</code> — sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-bg-color</code> — card background color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-border-radius</code> — border radius (e.g. 8px)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-border-width</code> — border width (e.g. 0, 1)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-border-color</code> — border color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-shadow</code> — none, sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-padding</code> — sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-card-hover</code> — none, lift, glow, shadow</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-image-aspect</code> — square, portrait, landscape</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-image-fit</code> — cover, contain</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-image-radius</code> — border radius (e.g. 8px)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-product-title-color</code> — product title color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-product-title-size</code> — xs, sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-product-title-weight</code> — normal, medium, semibold, bold</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-product-title-lines</code> — max lines (1, 2, 3)</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-product-title-alignment</code> — left, center</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-show-price</code> — true or false</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-price-color</code> — price text color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-price-size</code> — sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-text</code> — CTA button label</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-bg-color</code> — button background color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-text-color</code> — button text color</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-radius</code> — button border radius</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-size</code> — sm, md, lg</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-variant</code> — solid, outline, ghost</p>
              <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded">data-button-full-width</code> — true or false</p>
            </div>
          </div>

          {/* How widget.js works */}
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3">
            <p className="text-sm">
              <span className="font-medium">How it works:</span> widget.js finds all <code className="bg-muted px-1 py-0.5 rounded text-xs">.nudgio-widget</code> divs
              on the page, sends an HMAC signing request to our server, and renders each widget as a secure iframe.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          WordPress Plugin
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress Plugin</CardTitle>
          <CardDescription>
            Add Nudgio recommendations to WordPress using the Gutenberg block or shortcode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Installation */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Installation</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Install from the WordPress Plugin Directory (search &ldquo;Nudgio&rdquo;) or upload the plugin zip
                via Plugins → Add New → Upload Plugin.
              </p>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Go to <strong>Settings → Nudgio Technologies</strong> and enter your <strong>Key ID</strong> and <strong>API Secret</strong> from
              the Widget API Keys section above.
            </p>
          </div>

          {/* Gutenberg Block (recommended) */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Gutenberg Block (Recommended)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              In the block editor, click <strong>+</strong> → search &ldquo;Nudgio Technologies&rdquo; → add the <strong>Nudgio Recommendations</strong> block.
              Configure widget type, product ID, and visual settings in the block sidebar.
            </p>
          </div>

          {/* Shortcode */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Shortcode</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Use the <code className="bg-muted px-1 py-0.5 rounded text-xs">[nudgio]</code> shortcode in any post, page, or widget area:
            </p>
            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`[nudgio type="bestsellers" count="4" method="volume" lookback_days="30"]

[nudgio type="cross-sell" product_id="SKU-001" count="4"]

[nudgio type="upsell" product_id="SKU-001" count="4" min_price_increase_percent="10"]

[nudgio type="similar" product_id="SKU-001" count="4"]`}
            </pre>
            <p className="text-xs text-muted-foreground mt-1">
              All shortcode attributes mirror the data-* attributes listed above (using underscores instead of hyphens).
              See the plugin readme for the full attribute reference.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          Widget Types
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Widget Types</CardTitle>
          <CardDescription>
            Four recommendation algorithms to match different use cases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bestsellers */}
            <div className="rounded-md border p-4 space-y-1">
              <h3 className="text-sm font-semibold">Bestsellers</h3>
              <p className="text-sm text-muted-foreground">
                Top-selling products ranked by volume (units sold), value (revenue), or a balanced score.
                Works on any page — no product context required.
              </p>
            </div>

            {/* Cross-Sell */}
            <div className="rounded-md border p-4 space-y-1">
              <h3 className="text-sm font-semibold">Cross-Sell</h3>
              <p className="text-sm text-muted-foreground">
                Products frequently bought together with the current product.
                Requires a product ID — place on product pages.
              </p>
            </div>

            {/* Upsell */}
            <div className="rounded-md border p-4 space-y-1">
              <h3 className="text-sm font-semibold">Upsell</h3>
              <p className="text-sm text-muted-foreground">
                Higher-priced alternatives to the current product, filtered by a minimum price increase percentage.
                Requires a product ID — place on product pages.
              </p>
            </div>

            {/* Similar */}
            <div className="rounded-md border p-4 space-y-1">
              <h3 className="text-sm font-semibold">Similar</h3>
              <p className="text-sm text-muted-foreground">
                Products with matching attributes (vendor, category, tags) to the current product.
                Requires a product ID — place on product pages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          Visual Settings — 8 groups overview
          ========================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Settings</CardTitle>
          <CardDescription>
            Customize widget appearance across 8 groups. Set defaults in Settings, override per-widget via Components, shortcode attributes, or data-* attributes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Widget Container</h4>
              <p className="text-xs text-muted-foreground">Background color, padding</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Widget Title</h4>
              <p className="text-xs text-muted-foreground">Heading text, color, size, alignment</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Layout</h4>
              <p className="text-xs text-muted-foreground">Grid or carousel, columns, gap</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Product Card</h4>
              <p className="text-xs text-muted-foreground">Background, border, shadow, padding, hover effect</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Product Image</h4>
              <p className="text-xs text-muted-foreground">Aspect ratio, object fit, border radius</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Product Title</h4>
              <p className="text-xs text-muted-foreground">Color, size, weight, max lines, alignment</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">Price</h4>
              <p className="text-xs text-muted-foreground">Show/hide, color, size</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <h4 className="text-sm font-semibold">CTA Button</h4>
              <p className="text-xs text-muted-foreground">Label, colors, border radius, size, style (solid/outline/ghost), full width</p>
            </div>
          </div>

          {/* Hierarchy note */}
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3 mt-4">
            <p className="text-sm">
              <span className="font-medium">Priority order:</span> Per-widget overrides (data-* attributes, shortcode attributes, or Components page)
              take priority over defaults saved in the Settings page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
