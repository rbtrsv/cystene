# Shopify Embedded App — Testing Report

**Date:** 2026-03-09
**Store:** nudgio-dev-store (Shopify Plus dev store)
**App:** nudgio-8

---

## Partner Dashboard — Automated Checks

**URL:** https://partners.shopify.com/4786160/apps/331071979521/edit

- All preliminary steps (app name, URLs, redirects, scopes, etc.): **PASS**
- Embedded app checks (App Bridge CDN + Session Tokens): **NOT PASSING** (grey spinners)
  - These checks run automatically every ~2 hours after app interaction
  - Interacted with all 5 embedded pages during this session to generate traffic
  - May need additional time / repeat visits for Shopify to detect and validate

---

## Embedded App Pages (Admin UI)

### 1. Dashboard (`/shopify/dashboard`)

**Status: WORKING**

- Connection status: Active (green badge)
- Stats displayed: 17 synced products, 4 orders, FREE plan
- Layout renders correctly with Polaris web components
- Spacer padding present at top

### 2. Settings (`/shopify/settings`)

**Status: WORKING**

- 5 algorithm configuration fields render correctly
- Save Settings button present
- Reset to Defaults button present
- All fields interactive (dropdowns, inputs)
- Spacer padding present at top

### 3. Recommendations (`/shopify/recommendations`)

**Status: PARTIAL — UI BUG**

- **Bug:** "Recommendation Type" button group is empty / not rendering
  - The `<s-button-group>` for selecting widget type (bestsellers, cross-sell, upsell, similar) appears blank
  - Likely a Polaris web component rendering issue with `<s-button>` variant attributes
- **Working:** "Fetch Bestsellers" button works — returns 7 product results with images, titles, prices
- **Working:** Results display correctly in a product grid

### 4. Components (`/shopify/components`)

**Status: WORKING**

- Widget Configuration form renders
- Product dropdown (`<s-select>`) populated with store products
- Live Preview section renders an iframe with real product recommendations
- Products display with images, titles, prices
- Info banner present ("Add the Nudgio widget to your storefront...")
- Spacer padding present at top and bottom

### 5. Billing (`/shopify/billing`)

**Status: WORKING**

- Current plan: FREE (displayed correctly)
- 3 plan cards rendered (Free, Pro, Enterprise — or similar tiers)
- "Manage Plan on Shopify" button present
  - Links to Shopify Managed Pricing page
  - **Note:** Managed Pricing shows "This feature isn't currently available for your store" on dev stores — this is expected Shopify behavior, not a bug

---

## Theme Editor — Storefront Widget

**URL:** https://admin.shopify.com/store/nudgio-dev-store/themes/185263948089/editor

### Block Settings Panel

The Nudgio Recommendations block has a full settings panel in Theme Editor:
- **Widget Type** dropdown: Bestsellers, Cross-sell, Upsell, Similar Products
- **Number of Products**: slider (2–8), default 4
- **Layout Style**: Grid Cards / Carousel toggle
- **Columns**: slider (2–6), default 4
- **Size**: Compact / Default / Spacious
- **Primary Color**: color picker (#3B82F6)
- **Text Color**: color picker (#1F2937)
- **Background Color**: color picker (#FFFFFF)
- **"Manage app"** link at bottom
- **"Remove block"** at bottom

### Bestsellers Widget (Home Page)

**Status: WORKING**

- "Nudgio Recommendations" block available under Apps section
- Widget renders with heading "Popular now"
- Multiple products displayed with:
  - Product images (high quality, correct aspect ratio)
  - Product titles (e.g., "The Out of Stock Snowboard", "The Multi-location Snowboard", "The Collection Snowboard: Oxygen", "The Multi-managed Snowboard")
  - Prices (e.g., $885.95, $729.95, $1025.0, $629.95)
  - "View" buttons (blue, linking to product pages)
- Widget auto-resizes within the iframe
- Clean separation from other sections (Image banner, Featured collection, etc.)

### Non-Product Page Guard

**Status: WORKING**

- When a product-page widget type (cross-sell/upsell/similar) is placed on a non-product page, the Liquid template shows: "This widget type requires a product page. Move this block to a product page template, or switch the widget type to Bestsellers for non-product pages."

### Cross-sell / Upsell / Similar (Product Pages)

**Status: NOT WORKING — "No recommendations available"**

- Tested on "Default product" template (The 3p Fulfilled Snowboard)
- All 3 product-page widget types return "No recommendations available":
  - **Cross-sell** (Frequently Bought Together): empty
  - **Upsell** (was labeled "You Might Like"): empty
  - **Similar Products**: empty

**Root Cause Analysis:**
- The Shopify adapter uses the LIVE Shopify GraphQL API (not ingested tables)
- Bestsellers works (7 products returned) — so the API pipeline is functional
- Product-page types fail silently — the engine's `try/except` catches all exceptions and returns `[]`
- Possible causes:
  1. Shopify test data products may have empty `product_type` fields (affects upsell + similar matching)
  2. Only 4 test orders — the specific product may not appear in any order (affects cross-sell)
  3. A silent API error in `get_products()` or `get_order_items()` when called from product-page endpoints
  4. Cached empty results from a previous failed call (cache TTL = 1 hour)

---

## Fixes Applied

### 1. Liquid Schema Labels (nudgio-recommendations.liquid)

Changed widget type labels to match actual API type names:
- ~~"Frequently Bought Together"~~ → "Cross-sell"
- ~~"You Might Like"~~ → "Upsell"
- "Bestsellers" and "Similar Products" kept as-is

### 2. Empty-State Widget Behavior (components_subrouter.py)

Changed `generate_recommendation_html()` empty-state from:
- ~~`<div class='text-center text-gray-500 p-4'>No recommendations available</div>`~~
- → `<div style='display:none'></div>`

On the actual storefront, customers now see nothing when there are no recommendations.

### 3. Engine Debug Logging (engine.py)

Added `logger.info()` to `get_cross_sell`, `get_upsell`, `get_similar` with:
- Product count, order item count
- Whether base product was found in catalog
- product_type and vendor values for base product
- Number of candidates found
- `exc_info=True` on all exception handlers for full stack traces

---

## Summary

| Component | Status | Notes |
|---|---|---|
| Dashboard | **PASS** | All stats and connection info correct |
| Settings | **PASS** | All fields render and save |
| Recommendations | **PARTIAL** | Button group empty (UI bug), but fetch works |
| Components | **PASS** | Live Preview renders real products |
| Billing | **PASS** | Plan cards + Managed Pricing link work |
| Theme Widget (Bestsellers) | **PASS** | Full product cards with images, prices, View buttons |
| Theme Widget (Block Settings) | **PASS** | Full settings panel with 8 configurable fields |
| Theme Widget (Non-Product Guard) | **PASS** | Correct informative message shown |
| Theme Widget (Cross-sell/Upsell/Similar) | **FAIL** | "No recommendations available" for all 3 types |
| Partner Dashboard Checks | **PENDING** | Grey spinners, needs time to auto-verify |

---

## Action Items

1. **Deploy server with logging** — redeploy to see engine debug logs and identify exact cause of empty product-page recommendations
2. **Deploy Liquid label fix** — `shopify app deploy` to push updated widget type labels
3. **Fix Recommendations page button group** — Investigate why `<s-button-group>` is not rendering
4. **Re-check Partner Dashboard checks** — After 2-4 hours of app interaction, revisit
5. **Clear cache after fix** — If cached empty results are the issue, clear DragonflyDB/in-memory cache after deploying
