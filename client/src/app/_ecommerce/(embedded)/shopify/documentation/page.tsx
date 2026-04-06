/**
 * Shopify Embedded App — Documentation Page
 *
 * Polaris web component version for Shopify merchants.
 * Runs inside the Shopify Admin iframe.
 *
 * Static content page — no API calls, no backend interaction.
 * Uses less technical language focused on visual customization.
 *
 * Sections:
 * 1. Adding Widget to Your Storefront — Theme Editor steps
 * 2. Widget Types — bestsellers, cross-sell, upsell, similar
 * 3. Settings vs Theme Editor — how defaults and overrides work
 * 4. Components Preview — how to preview before publishing
 * 5. Widget Configuration — 8 visual groups overview
 *
 * No connection selector — connection is auto-resolved from Shopify session token.
 */

'use client';

import { useEmbedded } from '../layout';

// ==========================================
// Documentation Page
// ==========================================

export default function ShopifyDocumentationPage() {
  // Access context for page wrapper consistency (loading/error states)
  const { isLoading: contextLoading, error: contextError } = useEmbedded();

  // ==========================================
  // Loading / Error — context level
  // ==========================================

  if (contextLoading) {
    return (
      <s-page heading="Documentation">
        <s-section heading="Loading...">
          <s-spinner />
        </s-section>
      </s-page>
    );
  }

  if (contextError) {
    return (
      <s-page heading="Documentation">
        <s-section>
          <s-banner tone="critical" heading="Error">
            <s-paragraph>{contextError}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Documentation">

      {/* Top spacer — breathing room between page heading and first section */}
      <s-box paddingBlockStart="base" />

      {/* ==========================================
          Adding Widget to Your Storefront
          ========================================== */}
      <s-section heading="Adding Widget to Your Storefront">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Follow these steps to add Nudgio recommendations to your store:
            </s-paragraph>
            <s-stack direction="block" gap="small">
              <s-paragraph>1. Go to <s-text type="strong">Online Store → Themes → Customize</s-text> in your Shopify admin.</s-paragraph>
              <s-paragraph>2. Navigate to the page where you want to show recommendations (e.g. product page, homepage).</s-paragraph>
              <s-paragraph>3. Click <s-text type="strong">Add block</s-text> and search for &ldquo;Nudgio Technologies&rdquo;.</s-paragraph>
              <s-paragraph>4. Select the <s-text type="strong">Nudgio Technologies</s-text> block.</s-paragraph>
              <s-paragraph>5. Choose your widget type, colors, and layout in the sidebar panel.</s-paragraph>
              <s-paragraph>6. Click <s-text type="strong">Save</s-text> to publish your changes.</s-paragraph>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      {/* ==========================================
          Widget Types
          ========================================== */}
      <s-section heading="Widget Types">
        <s-stack direction="block" gap="base">

          {/* Bestsellers */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Bestsellers</s-text>
              <s-paragraph>
                Shows your top-selling products based on order history. Ranks by volume (units sold),
                value (revenue), or a balanced mix of both. Works on any page — homepage,
                collection pages, or even your cart page.
              </s-paragraph>
            </s-stack>
          </s-box>

          {/* Cross-Sell */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Cross-Sell</s-text>
              <s-paragraph>
                Shows products that customers frequently buy together with the product being viewed.
                Best placed on product pages — the widget automatically detects which product the
                customer is looking at. On non-product pages, it will show a &ldquo;requires product page&rdquo; message.
              </s-paragraph>
            </s-stack>
          </s-box>

          {/* Upsell */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Upsell</s-text>
              <s-paragraph>
                Shows higher-priced alternatives to the product being viewed — encouraging customers to
                upgrade. Like Cross-Sell, it auto-detects the current product on product pages.
                On non-product pages, it will show a &ldquo;requires product page&rdquo; message.
              </s-paragraph>
            </s-stack>
          </s-box>

          {/* Similar */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Similar</s-text>
              <s-paragraph>
                Shows products with matching attributes (same vendor, category, or tags) to the
                product being viewed. Great for helping customers explore related items.
                Auto-detects the current product on product pages.
                On non-product pages, it will show a &ldquo;requires product page&rdquo; message.
              </s-paragraph>
            </s-stack>
          </s-box>

        </s-stack>
      </s-section>

      {/* ==========================================
          Settings vs Theme Editor
          ========================================== */}
      <s-section heading="Settings vs Theme Editor">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              There are two places to customize how your widgets look:
            </s-paragraph>

            <s-stack direction="block" gap="small">
              <s-text type="strong">Settings page (in this app)</s-text>
              <s-paragraph>
                Saves your brand defaults — colors, layout, typography — that apply to
                ALL widgets across your entire storefront. Set your brand colors here first.
              </s-paragraph>
            </s-stack>

            <s-stack direction="block" gap="small">
              <s-text type="strong">Theme Editor (in Shopify admin)</s-text>
              <s-paragraph>
                Per-block overrides that take priority over your defaults. Use the Theme Editor
                to fine-tune individual widget blocks on specific pages without changing your
                global brand settings.
              </s-paragraph>
            </s-stack>

            <s-banner tone="info">
              <s-paragraph>
                Recommendation: Set your brand colors and layout in the Settings page first,
                then use the Theme Editor only when you need a specific widget to look different.
              </s-paragraph>
            </s-banner>
          </s-stack>
        </s-box>
      </s-section>

      {/* ==========================================
          Components Preview
          ========================================== */}
      <s-section heading="Components Preview">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Use the <s-text type="strong">Components</s-text> page in this app to preview how your
              widget will look before adding it to your storefront.
            </s-paragraph>
            <s-stack direction="block" gap="small">
              <s-paragraph>1. Select a widget type (Bestsellers, Cross-Sell, Upsell, or Similar).</s-paragraph>
              <s-paragraph>2. Choose a product from the dropdown to see product-specific recommendations.</s-paragraph>
              <s-paragraph>3. See a live preview of how the widget will render with your current settings.</s-paragraph>
            </s-stack>
            <s-banner tone="warning">
              <s-paragraph>
                Note: The preview is for testing purposes only. Settings from the Components preview
                do not automatically apply to your storefront. Use the Settings page or Theme Editor
                to update your live widgets.
              </s-paragraph>
            </s-banner>
          </s-stack>
        </s-box>
      </s-section>

      {/* ==========================================
          Widget Configuration — 8 visual groups
          ========================================== */}
      <s-section heading="Visual Customization">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Every widget can be customized across 8 visual groups, either from the Settings page
            (brand defaults) or the Theme Editor (per-block overrides):
          </s-paragraph>

          {/* Widget Container */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Widget Container</s-text>
              <s-paragraph>Background color and padding around the entire widget.</s-paragraph>
            </s-stack>
          </s-box>

          {/* Widget Title */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Widget Title</s-text>
              <s-paragraph>The heading text displayed above your products — customize the text, color, size, and alignment.</s-paragraph>
            </s-stack>
          </s-box>

          {/* Layout */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Layout</s-text>
              <s-paragraph>Choose between grid or carousel display, set the number of columns, and control spacing between product cards.</s-paragraph>
            </s-stack>
          </s-box>

          {/* Product Card */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Product Card</s-text>
              <s-paragraph>Each product&apos;s card background, border, shadow, padding, and hover effect (lift, glow, or shadow on mouse over).</s-paragraph>
            </s-stack>
          </s-box>

          {/* Product Image */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Product Image</s-text>
              <s-paragraph>Aspect ratio (square, portrait, landscape), how images fill the space (cover vs contain), and corner rounding.</s-paragraph>
            </s-stack>
          </s-box>

          {/* Product Title */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Product Title</s-text>
              <s-paragraph>Color, size, weight, maximum number of lines, and alignment for each product&apos;s name.</s-paragraph>
            </s-stack>
          </s-box>

          {/* Price */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">Price</s-text>
              <s-paragraph>Show or hide the price, and customize its color and size.</s-paragraph>
            </s-stack>
          </s-box>

          {/* CTA Button */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text type="strong">CTA Button</s-text>
              <s-paragraph>The call-to-action button on each card — customize the label, colors, corner radius, size, style (solid, outline, or ghost), and width.</s-paragraph>
            </s-stack>
          </s-box>

        </s-stack>
      </s-section>

      {/* Bottom spacer — breathing room after last section */}
      <s-box paddingBlockEnd="base" />

    </s-page>
  );
}
