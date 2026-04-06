/**
 * Shopify Embedded App — Components Page
 *
 * Polaris web component version of (standalone)/components/page.tsx.
 * Runs inside the Shopify Admin iframe.
 *
 * Widget type selector + configuration inputs + generate button.
 * Live preview via iframe (srcdoc) — NOT dangerouslySetInnerHTML
 * (Polaris shadow DOM may interfere with widget styles).
 *
 * Preview only — no embed code section.
 * Embed code / storefront delivery is deferred to Stage 3
 * (requires App Proxy + HMAC verification + Theme App Extension).
 *
 * No connection selector — connection is auto-resolved from Shopify session token.
 *
 * Backend: /server/apps/ecommerce/subrouters/shopify_embedded_subrouter.py
 * - GET /shopify/embedded/components/bestsellers
 * - GET /shopify/embedded/components/cross-sell
 * - GET /shopify/embedded/components/upsell
 * - GET /shopify/embedded/components/similar
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useEmbedded } from '../layout';
import {
  getComponentHtml,
  getProducts,
  updateSettings,
  type EmbeddedProduct,
} from '@/modules/ecommerce/service/shopify-embedded.service';

// ==========================================
// Types
// ==========================================

type WidgetType = 'bestsellers' | 'cross-sell' | 'upsell' | 'similar';

// ==========================================
// Color Field — swatch + text input (matches Settings page pattern)
// ==========================================

function ColorField({ label, value, details, onChange }: {
  label: string;
  value: string;
  details: string;
  onChange: (val: string) => void;
}) {
  // Validate hex for the native color input (requires #RRGGBB format)
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <input
        type="color"
        value={isValidHex ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '36px',
          height: '36px',
          marginTop: '22px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '2px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <s-text-field
          label={label}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          details={details}
        />
      </div>
    </div>
  );
}

// ==========================================
// Components Page
// ==========================================

export default function ShopifyComponentsPage() {
  const { getSessionToken, isLoading: contextLoading, error: contextError } = useEmbedded();

  // Widget config state
  const [widgetType, setWidgetType] = useState<WidgetType>('bestsellers');
  const [productId, setProductId] = useState('');
  const [top, setTop] = useState(4);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [method, setMethod] = useState<'volume' | 'value' | 'balanced'>('volume');
  const [minPriceIncrease, setMinPriceIncrease] = useState(10);
  // Group 1: Widget Container
  const [widgetBgColor, setWidgetBgColor] = useState('#FFFFFF');
  const [widgetPadding, setWidgetPadding] = useState(16);
  // Group 2: Widget Title
  const [widgetTitle, setWidgetTitle] = useState('');
  const [titleColor, setTitleColor] = useState('#111827');
  const [titleSize, setTitleSize] = useState(24);
  const [titleAlignment, setTitleAlignment] = useState('left');
  // Group 3: Layout
  const [widgetStyle, setWidgetStyle] = useState<'grid' | 'carousel'>('grid');
  const [widgetColumns, setWidgetColumns] = useState(4);
  const [gap, setGap] = useState(16);
  const [cardMinWidth, setCardMinWidth] = useState(200);
  const [cardMaxWidth, setCardMaxWidth] = useState(0);
  // Group 4: Product Card
  const [cardBgColor, setCardBgColor] = useState('#FFFFFF');
  const [cardBorderRadius, setCardBorderRadius] = useState(8);
  const [cardBorderWidth, setCardBorderWidth] = useState(1);
  const [cardBorderColor, setCardBorderColor] = useState('#E5E7EB');
  const [cardShadow, setCardShadow] = useState('sm');
  const [cardPadding, setCardPadding] = useState(16);
  const [cardHover, setCardHover] = useState('lift');
  // Group 5: Product Image
  const [imageAspectW, setImageAspectW] = useState(1);
  const [imageAspectH, setImageAspectH] = useState(1);
  const [imageFit, setImageFit] = useState('cover');
  const [imageRadius, setImageRadius] = useState(8);
  // Group 6: Product Title in Card
  const [productTitleColor, setProductTitleColor] = useState('#1F2937');
  const [productTitleSize, setProductTitleSize] = useState(14);
  const [productTitleWeight, setProductTitleWeight] = useState(500);
  const [productTitleLines, setProductTitleLines] = useState(2);
  const [productTitleAlignment, setProductTitleAlignment] = useState('left');
  // Group 7: Price
  const [showPrice, setShowPrice] = useState(true);
  const [priceColor, setPriceColor] = useState('#111827');
  const [priceSize, setPriceSize] = useState(18);
  // Group 8: CTA Button
  const [buttonText, setButtonText] = useState('View');
  const [buttonBgColor, setButtonBgColor] = useState('#3B82F6');
  const [buttonTextColor, setButtonTextColor] = useState('#FFFFFF');
  const [buttonRadius, setButtonRadius] = useState(6);
  const [buttonSize, setButtonSize] = useState(14);
  const [buttonVariant, setButtonVariant] = useState('solid');
  const [buttonFullWidth, setButtonFullWidth] = useState(false);

  // Product dropdown state
  const [products, setProducts] = useState<EmbeddedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);
  // Ref guard to prevent duplicate fetch calls during render cycles
  const fetchingRef = useRef(false);

  // Preview state
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save as Brand Defaults state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Derived flags
  const needsProductId = widgetType !== 'bestsellers';
  const needsMethod = widgetType === 'bestsellers';
  const needsMinPriceIncrease = widgetType === 'upsell';

  // ==========================================
  // Fetch products for dropdown (once, when first needed)
  // ==========================================

  // ⚠️ Product fetch must surface errors to the UI — never silently swallow.
  // A silent catch leaves the dropdown stuck on "Loading products..." forever.
  // Fetch products when a product-specific widget type is selected
  useEffect(() => {
    if (!needsProductId || productsFetched || fetchingRef.current) return;

    const fetchProducts = async () => {
      fetchingRef.current = true;
      setProductsLoading(true);
      try {
        const token = await getSessionToken();
        const result = await getProducts(token);
        setProducts(result.products);
        setProductsFetched(true);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setProductsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchProducts();
  }, [needsProductId, productsFetched, getSessionToken]);

  // ==========================================
  // Generate preview
  // ==========================================

  const handleGenerate = async () => {
    if (needsProductId && !productId) {
      setError('Product ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getSessionToken();
      const result = await getComponentHtml(token, widgetType, {
        product_id: needsProductId ? productId : undefined,
        top,
        lookback_days: lookbackDays,
        method: needsMethod ? method : undefined,
        min_price_increase_percent: needsMinPriceIncrease ? minPriceIncrease : undefined,
        // Group 1: Widget Container
        widget_bg_color: widgetBgColor,
        widget_padding: widgetPadding,
        // Group 2: Widget Title
        widget_title: widgetTitle || undefined,
        title_color: titleColor,
        title_size: titleSize,
        title_alignment: titleAlignment,
        // Group 3: Layout
        widget_style: widgetStyle,
        widget_columns: widgetColumns,
        gap,
        card_min_width: cardMinWidth,
        card_max_width: cardMaxWidth,
        // Group 4: Product Card
        card_bg_color: cardBgColor,
        card_border_radius: cardBorderRadius,
        card_border_width: cardBorderWidth,
        card_border_color: cardBorderColor,
        card_shadow: cardShadow,
        card_padding: cardPadding,
        card_hover: cardHover,
        // Group 5: Product Image
        image_aspect_w: imageAspectW,
        image_aspect_h: imageAspectH,
        image_fit: imageFit,
        image_radius: imageRadius,
        // Group 6: Product Title in Card
        product_title_color: productTitleColor,
        product_title_size: productTitleSize,
        product_title_weight: productTitleWeight,
        product_title_lines: productTitleLines,
        product_title_alignment: productTitleAlignment,
        // Group 7: Price
        show_price: showPrice,
        price_color: priceColor,
        price_size: priceSize,
        // Group 8: CTA Button
        button_text: buttonText,
        button_bg_color: buttonBgColor,
        button_text_color: buttonTextColor,
        button_radius: buttonRadius,
        button_size: buttonSize,
        button_variant: buttonVariant,
        button_full_width: buttonFullWidth,
      });

      setHtml(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate widget';
      setError(message);
      console.error('Component generate error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Save as Brand Defaults
  // ==========================================

  const handleSaveBrandDefaults = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const token = await getSessionToken();
      await updateSettings(token, {
        bestseller_method: method,
        bestseller_lookback_days: lookbackDays,
        crosssell_lookback_days: lookbackDays,
        max_recommendations: top,
        min_price_increase_percent: minPriceIncrease,
        // Group 1: Widget Container
        widget_bg_color: widgetBgColor,
        widget_padding: widgetPadding,
        // Group 2: Widget Title
        widget_title: widgetTitle || null,
        title_color: titleColor,
        title_size: titleSize,
        title_alignment: titleAlignment,
        // Group 3: Layout
        widget_style: widgetStyle,
        widget_columns: widgetColumns,
        gap,
        card_min_width: cardMinWidth,
        card_max_width: cardMaxWidth,
        // Group 4: Product Card
        card_bg_color: cardBgColor,
        card_border_radius: cardBorderRadius,
        card_border_width: cardBorderWidth,
        card_border_color: cardBorderColor,
        card_shadow: cardShadow,
        card_padding: cardPadding,
        card_hover: cardHover,
        // Group 5: Product Image
        image_aspect_w: imageAspectW,
        image_aspect_h: imageAspectH,
        image_fit: imageFit,
        image_radius: imageRadius,
        // Group 6: Product Title in Card
        product_title_color: productTitleColor,
        product_title_size: productTitleSize,
        product_title_weight: productTitleWeight,
        product_title_lines: productTitleLines,
        product_title_alignment: productTitleAlignment,
        // Group 7: Price
        show_price: showPrice,
        price_color: priceColor,
        price_size: priceSize,
        // Group 8: CTA Button
        button_text: buttonText,
        button_bg_color: buttonBgColor,
        button_text_color: buttonTextColor,
        button_radius: buttonRadius,
        button_size: buttonSize,
        button_variant: buttonVariant,
        button_full_width: buttonFullWidth,
      });
      setSaveMessage('Brand defaults saved');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // Loading / Error — context level
  // ==========================================

  if (contextLoading) {
    return (
      <s-page heading="Components">
        <s-section heading="Loading...">
          <s-spinner />
        </s-section>
      </s-page>
    );
  }

  if (contextError) {
    return (
      <s-page heading="Components">
        <s-section>
          <s-banner tone="critical" heading="Error">
            <s-paragraph>{contextError}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Components">

      {/* Top spacer — breathing room between page heading and first section */}
      <s-box paddingBlockStart="base" />

      {/* Widget Configuration Section */}
      <s-section heading="Widget Configuration">
        <s-box padding="base">
          <s-stack direction="block" gap="base">

            {/* Widget Type */}
            <s-select
              label="Widget Type"
              value={widgetType}
              onChange={(e) => setWidgetType(e.currentTarget.value as WidgetType)}
            >
              <s-option value="bestsellers">Bestsellers</s-option>
              <s-option value="cross-sell">Cross-Sell</s-option>
              <s-option value="upsell">Upsell</s-option>
              <s-option value="similar">Similar Products</s-option>
            </s-select>

            {/* Product dropdown — shown for cross-sell, upsell, similar */}
            {needsProductId && (
              <>
                <s-banner tone="info">
                  <s-paragraph>
                    On your storefront, this widget type automatically detects the current product
                    via Theme Editor. The dropdown below is for preview purposes only.
                  </s-paragraph>
                </s-banner>

                <s-select
                  label="Product"
                  value={productId}
                  onChange={(e) => setProductId(e.currentTarget.value)}
                  disabled={productsLoading || undefined}
                >
                  <s-option value="">
                    {productsLoading ? 'Loading products...' : productsFetched ? 'Select a product' : 'Failed to load — retry'}
                  </s-option>
                  {products.map((p) => (
                    <s-option key={p.product_id} value={p.product_id}>
                      {p.title}
                    </s-option>
                  ))}
                </s-select>
              </>
            )}

            {/* Items to Show */}
            <s-number-field
              label="Items to Show"
              min={1}
              max={20}
              step={1}
              value={String(top)}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                if (!isNaN(val)) setTop(val);
              }}
            />

            {/* Lookback Days */}
            <s-number-field
              label="Lookback Days"
              min={1}
              max={3650}
              step={1}
              value={String(lookbackDays)}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                if (!isNaN(val)) setLookbackDays(val);
              }}
            />

            {/* Method — only for bestsellers */}
            {needsMethod && (
              <s-select
                label="Method"
                value={method}
                onChange={(e) => setMethod(e.currentTarget.value as 'volume' | 'value' | 'balanced')}
              >
                <s-option value="volume">Volume</s-option>
                <s-option value="value">Value</s-option>
                <s-option value="balanced">Balanced</s-option>
              </s-select>
            )}

            {/* Min Price Increase — only for upsell */}
            {needsMinPriceIncrease && (
              <s-number-field
                label="Min Price Increase (%)"
                min={0}
                max={500}
                step={1}
                value={String(minPriceIncrease)}
                onChange={(e) => {
                  const val = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(val)) setMinPriceIncrease(val);
                }}
              />
            )}

          </s-stack>
        </s-box>
      </s-section>

      {/* Group 1: Widget Container */}
      <s-section heading="Widget Container">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <ColorField label="Background Color" value={widgetBgColor} onChange={setWidgetBgColor} details="Hex color (e.g. #FFFFFF)" />
            <s-number-field label="Padding (px)" min={0} max={48} step={2} value={String(widgetPadding)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setWidgetPadding(val); }} details="Widget container padding in pixels." />
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 2: Widget Title */}
      <s-section heading="Widget Title">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text-field label="Title Text" value={widgetTitle} onChange={(e) => setWidgetTitle(e.currentTarget.value)} details="Leave empty for auto-default based on widget type." />
            <ColorField label="Title Color" value={titleColor} onChange={setTitleColor} details="Hex color (e.g. #111827)" />
            <s-number-field label="Title Size (px)" min={8} max={48} step={1} value={String(titleSize)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setTitleSize(val); }} details="Font size in pixels." />
            <s-select label="Title Alignment" value={titleAlignment} onChange={(e) => setTitleAlignment(e.currentTarget.value)}>
              <s-option value="left">Left</s-option>
              <s-option value="center">Center</s-option>
            </s-select>
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 3: Layout */}
      <s-section heading="Layout">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-select label="Layout Style" value={widgetStyle} onChange={(e) => setWidgetStyle(e.currentTarget.value as 'grid' | 'carousel')}>
              <s-option value="grid">Grid Cards</s-option>
              <s-option value="carousel">Carousel</s-option>
            </s-select>
            <s-number-field label="Columns" min={1} max={6} step={1} value={String(widgetColumns)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setWidgetColumns(val); }} details="Max columns at full width. Responsive: 1 col mobile → 2 col tablet → N col desktop." />
            <s-number-field label="Card Gap (px)" min={0} max={48} step={2} value={String(gap)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setGap(val); }} details="Gap between cards in pixels." />
            <s-number-field label="Card Min Width (px)" min={100} max={500} step={10} value={String(cardMinWidth)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setCardMinWidth(val); }} details="Cards won't shrink below this — overflow scrolls instead." />
            <s-number-field label="Card Max Width (px)" min={0} max={800} step={10} value={String(cardMaxWidth)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setCardMaxWidth(val); }} details="0 = no limit. Cards fill available space." />
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 4: Product Card */}
      <s-section heading="Product Card">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <ColorField label="Card Background" value={cardBgColor} onChange={setCardBgColor} details="Hex color (e.g. #FFFFFF)" />
            <s-number-field label="Card Border Radius (px)" min={0} max={50} step={1} value={String(cardBorderRadius)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setCardBorderRadius(val); }} details="Border radius in pixels." />
            <s-number-field label="Card Border Width (px)" min={0} max={10} step={1} value={String(cardBorderWidth)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setCardBorderWidth(val); }} details="Border width in pixels. 0 = no border." />
            <ColorField label="Card Border Color" value={cardBorderColor} onChange={setCardBorderColor} details="Hex color (e.g. #E5E7EB)" />
            <s-select label="Card Shadow" value={cardShadow} onChange={(e) => setCardShadow(e.currentTarget.value)}>
              <s-option value="none">None</s-option>
              <s-option value="sm">Small</s-option>
              <s-option value="md">Medium</s-option>
              <s-option value="lg">Large</s-option>
            </s-select>
            <s-number-field label="Card Padding (px)" min={0} max={48} step={2} value={String(cardPadding)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setCardPadding(val); }} details="Card content padding in pixels." />
            <s-select label="Card Hover Effect" value={cardHover} onChange={(e) => setCardHover(e.currentTarget.value)}>
              <s-option value="none">None</s-option>
              <s-option value="lift">Lift</s-option>
              <s-option value="shadow">Shadow</s-option>
              <s-option value="glow">Glow</s-option>
            </s-select>
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 5: Product Image */}
      <s-section heading="Product Image">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-number-field label="Aspect Ratio Width" min={1} max={20} step={1} value={String(imageAspectW)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setImageAspectW(val); }} details="e.g. 1 for square, 16 for widescreen." />
            <s-number-field label="Aspect Ratio Height" min={1} max={20} step={1} value={String(imageAspectH)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setImageAspectH(val); }} details="e.g. 1 for square, 9 for widescreen." />
            <s-select label="Image Fit" value={imageFit} onChange={(e) => setImageFit(e.currentTarget.value)}>
              <s-option value="cover">Cover (crop)</s-option>
              <s-option value="contain">Contain (fit)</s-option>
            </s-select>
            <s-number-field label="Image Border Radius (px)" min={0} max={50} step={1} value={String(imageRadius)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setImageRadius(val); }} details="Image border radius in pixels." />
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 6: Product Title */}
      <s-section heading="Product Title">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <ColorField label="Title Color" value={productTitleColor} onChange={setProductTitleColor} details="Hex color (e.g. #1F2937)" />
            <s-number-field label="Title Size (px)" min={8} max={36} step={1} value={String(productTitleSize)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setProductTitleSize(val); }} details="Font size in pixels." />
            <s-number-field label="Title Weight" min={100} max={900} step={100} value={String(productTitleWeight)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setProductTitleWeight(val); }} details="CSS font-weight (100–900)." />
            <s-number-field label="Max Lines" min={1} max={3} step={1} value={String(productTitleLines)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setProductTitleLines(val); }} details="Product title truncation after N lines." />
            <s-select label="Title Alignment" value={productTitleAlignment} onChange={(e) => setProductTitleAlignment(e.currentTarget.value)}>
              <s-option value="left">Left</s-option>
              <s-option value="center">Center</s-option>
            </s-select>
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 7: Price */}
      <s-section heading="Price">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-checkbox label="Show Price" checked={showPrice || undefined} onChange={(e) => setShowPrice(e.currentTarget.checked)} />
            <ColorField label="Price Color" value={priceColor} onChange={setPriceColor} details="Hex color (e.g. #111827)" />
            <s-number-field label="Price Size (px)" min={8} max={36} step={1} value={String(priceSize)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setPriceSize(val); }} details="Font size in pixels." />
          </s-stack>
        </s-box>
      </s-section>

      {/* Group 8: CTA Button */}
      <s-section heading="CTA Button">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text-field label="Button Text" value={buttonText} onChange={(e) => setButtonText(e.currentTarget.value)} details="e.g. View, Shop Now, Add to Cart" />
            <ColorField label="Button Color" value={buttonBgColor} onChange={setButtonBgColor} details="Hex color (e.g. #3B82F6)" />
            <ColorField label="Button Text Color" value={buttonTextColor} onChange={setButtonTextColor} details="Hex color (e.g. #FFFFFF)" />
            <s-number-field label="Button Border Radius (px)" min={0} max={50} step={1} value={String(buttonRadius)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setButtonRadius(val); }} details="Button border radius in pixels." />
            <s-number-field label="Button Size (px)" min={8} max={24} step={1} value={String(buttonSize)} onChange={(e) => { const val = parseInt(e.currentTarget.value, 10); if (!isNaN(val)) setButtonSize(val); }} details="Font size in pixels." />
            <s-select label="Button Style" value={buttonVariant} onChange={(e) => setButtonVariant(e.currentTarget.value)}>
              <s-option value="solid">Solid (filled)</s-option>
              <s-option value="outline">Outline (border)</s-option>
              <s-option value="ghost">Ghost (transparent)</s-option>
            </s-select>
            <s-checkbox label="Full Width Button" checked={buttonFullWidth || undefined} onChange={(e) => setButtonFullWidth(e.currentTarget.checked)} />
          </s-stack>
        </s-box>
      </s-section>

      {/* Actions */}
      <s-section>
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-button
              variant="primary"
              onClick={handleGenerate}
              disabled={isLoading || (needsProductId && !productId) || undefined}
            >
              {isLoading ? 'Generating...' : 'Generate Preview'}
            </s-button>

            <s-button
              onClick={handleSaveBrandDefaults}
              disabled={isSaving || undefined}
            >
              {isSaving ? 'Saving...' : 'Save as Brand Defaults'}
            </s-button>

            {saveMessage && (
              <s-banner tone="info" onDismiss={() => setSaveMessage(null)}>
                <s-paragraph>{saveMessage}</s-paragraph>
              </s-banner>
            )}
          </s-stack>
        </s-box>
      </s-section>

      {/* Error Banner */}
      {error && (
        <s-section>
          <s-banner tone="critical" heading="Error">
            <s-paragraph>{error}</s-paragraph>
          </s-banner>
        </s-section>
      )}

      {/* Live Preview — rendered in iframe to isolate widget styles */}
      {html && (
        <s-section heading="Live Preview">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <iframe
              srcDoc={html}
              style={{
                width: '100%',
                minHeight: '400px',
                border: 'none',
              }}
              title="Widget Preview"
            />
          </s-box>

          {/* Storefront delivery instructions */}
          <s-banner tone="info" heading="Add to Your Storefront">
            <s-paragraph>
              To display this widget on your storefront, go to Online Store → Customize,
              then add the &quot;Nudgio Recommendations&quot; block to any section on your product or collection pages.
            </s-paragraph>
          </s-banner>
        </s-section>
      )}

      {/* Bottom spacer — breathing room after last section */}
      <s-box paddingBlockEnd="base" />

    </s-page>
  );
}
