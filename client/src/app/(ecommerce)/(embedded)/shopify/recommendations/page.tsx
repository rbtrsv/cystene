/**
 * Shopify Embedded App — Recommendations Page
 *
 * Polaris web component version of (standalone)/recommendations/page.tsx.
 * Runs inside the Shopify Admin iframe.
 *
 * 4 recommendation types:
 * - Bestsellers — top selling products (volume, value, balanced)
 * - Cross-Sell — frequently bought together
 * - Upsell — higher-priced alternatives
 * - Similar — similar products by purchase patterns
 *
 * No connection selector — connection is auto-resolved from Shopify session token.
 * Uses s-button-group for type switching (no s-tabs in Polaris web components).
 *
 * Backend: /server/apps/ecommerce/subrouters/shopify_embedded_subrouter.py
 * - POST /shopify/embedded/recommendations/bestsellers
 * - POST /shopify/embedded/recommendations/cross-sell
 * - POST /shopify/embedded/recommendations/upsell
 * - POST /shopify/embedded/recommendations/similar
 */

'use client';

import { useState } from 'react';
import { useEmbedded } from '../layout';
import {
  getBestsellers,
  getCrossSell,
  getUpsell,
  getSimilar,
  type EmbeddedRecommendationResult,
} from '@/modules/ecommerce/service/shopify-embedded.service';

// ==========================================
// Types
// ==========================================

type RecommendationType = 'bestsellers' | 'cross-sell' | 'upsell' | 'similar';

// ==========================================
// Results Display
// ==========================================

function ResultsSection({ result }: { result: EmbeddedRecommendationResult }) {
  return (
    <s-section heading="Results">
      <s-box padding="base">
        <s-stack direction="block" gap="base">

          {/* Result metadata */}
          <s-stack direction="inline" gap="base">
            <s-text type="strong">{result.count} recommendations</s-text>
            {result.method && (
              <s-badge tone="info">{result.method}</s-badge>
            )}
            {result.base_product_id && (
              <s-text>Base: {result.base_product_id}</s-text>
            )}
            <s-text>Lookback: {result.lookback_days} days</s-text>
          </s-stack>

          {/* Results list */}
          {result.recommendations.length === 0 ? (
            <s-text>No recommendations found for these parameters.</s-text>
          ) : (
            result.recommendations.map((rec) => (
              <s-box
                key={`${rec.product_id}-${rec.position}`}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">#{rec.position}</s-text>
                  <s-stack direction="block" gap="small">
                    <s-text type="strong">{rec.title}</s-text>
                    <s-stack direction="inline" gap="small">
                      <s-text>${rec.price.toFixed(2)}</s-text>
                      {rec.vendor && <s-text>{rec.vendor}</s-text>}
                      {rec.sku && <s-text>SKU: {rec.sku}</s-text>}
                    </s-stack>
                    <s-stack direction="inline" gap="small">
                      <s-text>ID: {rec.product_id}</s-text>
                      {rec.similarity_score != null && (
                        <s-badge tone="success">{(rec.similarity_score * 100).toFixed(1)}%</s-badge>
                      )}
                      {rec.co_occurrence_count != null && (
                        <s-badge tone="info">{rec.co_occurrence_count} co-occ</s-badge>
                      )}
                      {rec.price_increase_percent != null && (
                        <s-badge tone="warning">+{rec.price_increase_percent.toFixed(1)}%</s-badge>
                      )}
                    </s-stack>
                  </s-stack>
                </s-stack>
              </s-box>
            ))
          )}

        </s-stack>
      </s-box>
    </s-section>
  );
}

// ==========================================
// Recommendations Page
// ==========================================

export default function ShopifyRecommendationsPage() {
  const { getSessionToken, isLoading: contextLoading, error: contextError } = useEmbedded();

  // Active recommendation type
  const [activeType, setActiveType] = useState<RecommendationType>('bestsellers');

  // Input state
  const [productId, setProductId] = useState('');
  const [limit, setLimit] = useState(10);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [method, setMethod] = useState<'volume' | 'value' | 'balanced'>('volume');
  const [minPriceIncrease, setMinPriceIncrease] = useState(10);

  // Result state
  const [result, setResult] = useState<EmbeddedRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // Fetch handler — dispatches to correct service function
  // ==========================================

  const handleFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getSessionToken();

      let response;
      switch (activeType) {
        case 'bestsellers':
          response = await getBestsellers(token, { limit, lookback_days: lookbackDays, method });
          break;
        case 'cross-sell':
          if (!productId) { setError('Product ID is required'); return; }
          response = await getCrossSell(token, { product_id: productId, limit, lookback_days: lookbackDays });
          break;
        case 'upsell':
          if (!productId) { setError('Product ID is required'); return; }
          response = await getUpsell(token, { product_id: productId, limit, lookback_days: lookbackDays, min_price_increase_percent: minPriceIncrease });
          break;
        case 'similar':
          if (!productId) { setError('Product ID is required'); return; }
          response = await getSimilar(token, { product_id: productId, limit, lookback_days: lookbackDays });
          break;
      }

      if (response.success && response.data) {
        setResult(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(message);
      console.error('Recommendation fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear results when switching types
  const switchType = (type: RecommendationType) => {
    setActiveType(type);
    setResult(null);
    setError(null);
  };

  // ==========================================
  // Loading / Error — context level
  // ==========================================

  if (contextLoading) {
    return (
      <s-page heading="Recommendations">
        <s-section heading="Loading...">
          <s-spinner />
        </s-section>
      </s-page>
    );
  }

  if (contextError) {
    return (
      <s-page heading="Recommendations">
        <s-section>
          <s-banner tone="critical" heading="Error">
            <s-paragraph>{contextError}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  // ==========================================
  // Whether current type needs a product_id
  // ==========================================

  const needsProductId = activeType !== 'bestsellers';

  return (
    <s-page heading="Recommendations">

      {/* Top spacer — breathing room between page heading and first section */}
      <s-box paddingBlockStart="base" />

      {/* Type Selector — s-select (button-group onClick doesn't fire in Polaris web components) */}
      <s-section heading="Recommendation Type">
        <s-box padding="base">
          <s-select
            label="Type"
            value={activeType}
            onChange={(e) => switchType(e.currentTarget.value as RecommendationType)}
          >
            <s-option value="bestsellers">Bestsellers</s-option>
            <s-option value="cross-sell">Cross-Sell</s-option>
            <s-option value="upsell">Upsell</s-option>
            <s-option value="similar">Similar Products</s-option>
          </s-select>
        </s-box>
      </s-section>

      {/* Parameters Section */}
      <s-section heading="Parameters">
        <s-box padding="base">
          <s-stack direction="block" gap="base">

            {/* Product ID — shown for cross-sell, upsell, similar */}
            {needsProductId && (
              <s-text-field
                label="Product ID"
                value={productId}
                onChange={(e) => setProductId(e.currentTarget.value)}
                details="Shopify product ID (e.g. 8234567890)"
              />
            )}

            {/* Method — shown only for bestsellers */}
            {activeType === 'bestsellers' && (
              <s-select
                label="Method"
                value={method}
                onChange={(e) => setMethod(e.currentTarget.value as 'volume' | 'value' | 'balanced')}
              >
                <s-option value="volume">Volume (sales count)</s-option>
                <s-option value="value">Value (revenue)</s-option>
                <s-option value="balanced">Balanced</s-option>
              </s-select>
            )}

            {/* Limit */}
            <s-number-field
              label="Limit"
              min={1}
              max={100}
              step={1}
              value={String(limit)}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                if (!isNaN(val)) setLimit(val);
              }}
            />

            {/* Lookback Days */}
            <s-number-field
              label="Lookback Days"
              min={1}
              max={365}
              step={1}
              value={String(lookbackDays)}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                if (!isNaN(val)) setLookbackDays(val);
              }}
            />

            {/* Min Price Increase — shown only for upsell */}
            {activeType === 'upsell' && (
              <s-number-field
                label="Min Price Increase (%)"
                min={0}
                max={1000}
                step={1}
                value={String(minPriceIncrease)}
                onChange={(e) => {
                  const val = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(val)) setMinPriceIncrease(val);
                }}
              />
            )}

            {/* Fetch Button */}
            <s-button
              variant="primary"
              onClick={handleFetch}
              disabled={isLoading || (needsProductId && !productId) || undefined}
            >
              {isLoading ? 'Fetching...' : `Fetch ${activeType === 'cross-sell' ? 'Cross-Sell' : activeType === 'upsell' ? 'Upsell' : activeType === 'similar' ? 'Similar' : 'Bestsellers'}`}
            </s-button>

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

      {/* Results */}
      {result && <ResultsSection result={result} />}

      {/* Bottom spacer — breathing room after last section */}
      <s-box paddingBlockEnd="base" />

    </s-page>
  );
}
