'use client';

import { useState, useCallback } from 'react';
import { type WidgetParams } from '../schemas/components.schemas';
import {
  getBestsellersWidget,
  getCrossSellWidget,
  getUpsellWidget,
  getSimilarWidget,
} from '../service/components.service';

/**
 * Widget type identifier for selecting which component to fetch
 */
export type WidgetType = 'bestsellers' | 'cross-sell' | 'upsell' | 'similar';

/**
 * Default values — only include data attributes that differ from these.
 * Keys use kebab-case for data-* attribute names.
 */
const EMBED_DEFAULTS: Record<string, string> = {
  // Algorithm / data
  top: '4',
  'lookback-days': '30',
  method: 'volume',
  'min-price-increase': '10',
  // Group 1: Widget Container
  'widget-bg-color': '#FFFFFF',
  'widget-padding': '16',
  // Group 2: Widget Title
  'title-color': '#111827',
  'title-size': '24',
  'title-alignment': 'left',
  // Group 3: Layout
  'widget-style': 'grid',
  'widget-columns': '4',
  gap: '16',
  'card-min-width': '200',
  'card-max-width': '0',
  // Group 4: Product Card
  'card-bg-color': '#FFFFFF',
  'card-border-radius': '8',
  'card-border-width': '0',
  'card-border-color': '#E5E7EB',
  'card-shadow': 'md',
  'card-padding': '16',
  'card-hover': 'lift',
  // Group 5: Product Image
  'image-aspect-w': '1',
  'image-aspect-h': '1',
  'image-fit': 'cover',
  'image-radius': '8',
  // Group 6: Product Title in Card
  'product-title-color': '#1F2937',
  'product-title-size': '14',
  'product-title-weight': '600',
  'product-title-lines': '2',
  'product-title-alignment': 'left',
  // Group 7: Price
  'show-price': 'true',
  'price-color': '#111827',
  'price-size': '18',
  // Group 8: CTA Button
  'button-text': 'View',
  'button-bg-color': '#3B82F6',
  'button-text-color': '#FFFFFF',
  'button-radius': '6',
  'button-size': '14',
  'button-variant': 'solid',
  'button-full-width': 'false',
};

/**
 * Stateless hook for fetching embeddable HTML widget components
 *
 * No store/provider needed — uses local useState for loading/error/html.
 * Wraps service calls and provides a clean API.
 */
export function useComponents() {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Backend status for non-error states (e.g., "waiting_for_data" for ingest connections with no data)
  const [status, setStatus] = useState<string | null>(null);

  /**
   * Fetch a widget by type
   * @param type Widget type
   * @param params Widget parameters
   */
  const fetchWidget = useCallback(async (type: WidgetType, params: WidgetParams) => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      let response;

      switch (type) {
        case 'bestsellers':
          response = await getBestsellersWidget(params);
          break;
        case 'cross-sell':
          response = await getCrossSellWidget(params);
          break;
        case 'upsell':
          response = await getUpsellWidget(params);
          break;
        case 'similar':
          response = await getSimilarWidget(params);
          break;
      }

      if (response.success && response.html) {
        setHtml(response.html);
      } else if (response.status === 'waiting_for_data') {
        // Ingest connection with no data — not an error, just a state
        setStatus('waiting_for_data');
        setHtml(null);
      } else {
        setError(response.error || 'Failed to fetch widget');
        setHtml(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setHtml(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generate a universal embed code snippet using data-attribute based widget.js loader.
   *
   * Takes widget config + API key ID + server URL. Returns a <div> + <script> snippet
   * that works on any website (no platform plugin required).
   *
   * Only includes data attributes that differ from defaults to minimize snippet size.
   * product_id is intentionally omitted — user adds per page.
   *
   * @param keyId Widget API key ID (from WidgetAPIKey model)
   * @param serverUrl Nudgio server URL (e.g., "https://server.nudgio.tech")
   * @param widgetType Widget type: bestsellers, cross-sell, upsell, similar
   * @param config Widget configuration values
   * @returns Embed code string
   */
  const generateEmbedCode = useCallback((
    keyId: number,
    serverUrl: string,
    widgetType: WidgetType,
    config: {
      // Algorithm / data
      top?: number;
      lookbackDays?: number;
      method?: string;
      minPriceIncrease?: number;
      // Group 1: Widget Container
      widgetBgColor?: string;
      widgetPadding?: number;
      // Group 2: Widget Title
      widgetTitle?: string;
      titleColor?: string;
      titleSize?: number;
      titleAlignment?: string;
      // Group 3: Layout
      widgetStyle?: string;
      widgetColumns?: number;
      gap?: number;
      cardMinWidth?: number;
      cardMaxWidth?: number;
      // Group 4: Product Card
      cardBgColor?: string;
      cardBorderRadius?: number;
      cardBorderWidth?: number;
      cardBorderColor?: string;
      cardShadow?: string;
      cardPadding?: number;
      cardHover?: string;
      // Group 5: Product Image
      imageAspectW?: number;
      imageAspectH?: number;
      imageFit?: string;
      imageRadius?: number;
      // Group 6: Product Title in Card
      productTitleColor?: string;
      productTitleSize?: number;
      productTitleWeight?: number;
      productTitleLines?: number;
      productTitleAlignment?: string;
      // Group 7: Price
      showPrice?: boolean;
      priceColor?: string;
      priceSize?: number;
      // Group 8: CTA Button
      buttonText?: string;
      buttonBgColor?: string;
      buttonTextColor?: string;
      buttonRadius?: number;
      buttonSize?: number;
      buttonVariant?: string;
      buttonFullWidth?: boolean;
    },
  ): string => {
    // Build data attributes — only include non-default values
    const attrs: string[] = [
      `data-key-id="${keyId}"`,
      `data-type="${widgetType}"`,
    ];

    // Map camelCase config keys → kebab-case data-* attribute names
    const attrMap: Record<string, string> = {
      // Algorithm / data
      top: String(config.top ?? 4),
      'lookback-days': String(config.lookbackDays ?? 30),
      method: config.method ?? 'volume',
      'min-price-increase': String(config.minPriceIncrease ?? 10),
      // Group 1: Widget Container
      'widget-bg-color': config.widgetBgColor ?? '#FFFFFF',
      'widget-padding': String(config.widgetPadding ?? 16),
      // Group 2: Widget Title
      'title-color': config.titleColor ?? '#111827',
      'title-size': String(config.titleSize ?? 24),
      'title-alignment': config.titleAlignment ?? 'left',
      // Group 3: Layout
      'widget-style': config.widgetStyle ?? 'grid',
      'widget-columns': String(config.widgetColumns ?? 4),
      gap: String(config.gap ?? 16),
      'card-min-width': String(config.cardMinWidth ?? 200),
      'card-max-width': String(config.cardMaxWidth ?? 0),
      // Group 4: Product Card
      'card-bg-color': config.cardBgColor ?? '#FFFFFF',
      'card-border-radius': String(config.cardBorderRadius ?? 8),
      'card-border-width': String(config.cardBorderWidth ?? 0),
      'card-border-color': config.cardBorderColor ?? '#E5E7EB',
      'card-shadow': config.cardShadow ?? 'md',
      'card-padding': String(config.cardPadding ?? 16),
      'card-hover': config.cardHover ?? 'lift',
      // Group 5: Product Image
      'image-aspect-w': String(config.imageAspectW ?? 1),
      'image-aspect-h': String(config.imageAspectH ?? 1),
      'image-fit': config.imageFit ?? 'cover',
      'image-radius': String(config.imageRadius ?? 8),
      // Group 6: Product Title in Card
      'product-title-color': config.productTitleColor ?? '#1F2937',
      'product-title-size': String(config.productTitleSize ?? 14),
      'product-title-weight': String(config.productTitleWeight ?? 600),
      'product-title-lines': String(config.productTitleLines ?? 2),
      'product-title-alignment': config.productTitleAlignment ?? 'left',
      // Group 7: Price
      'show-price': String(config.showPrice ?? true),
      'price-color': config.priceColor ?? '#111827',
      'price-size': String(config.priceSize ?? 18),
      // Group 8: CTA Button
      'button-text': config.buttonText ?? 'View',
      'button-bg-color': config.buttonBgColor ?? '#3B82F6',
      'button-text-color': config.buttonTextColor ?? '#FFFFFF',
      'button-radius': String(config.buttonRadius ?? 6),
      'button-size': String(config.buttonSize ?? 14),
      'button-variant': config.buttonVariant ?? 'solid',
      'button-full-width': String(config.buttonFullWidth ?? false),
    };

    // widget-title has no default (empty = auto) — only include if user set one
    if (config.widgetTitle) {
      attrs.push(`data-widget-title="${config.widgetTitle}"`);
    }

    for (const [key, value] of Object.entries(attrMap)) {
      if (value !== EMBED_DEFAULTS[key]) {
        attrs.push(`data-${key}="${value}"`);
      }
    }

    const attrStr = attrs.join('\n     ');

    return `<!-- Nudgio Recommendation Widget -->\n<div class="nudgio-widget"\n     ${attrStr}>\n</div>\n<script src="${serverUrl}/ecommerce/static/widget.js" async defer></script>`;
  }, []);

  return {
    html,
    isLoading,
    error,
    status,
    fetchWidget,
    generateEmbedCode,
  };
}

export default useComponents;
