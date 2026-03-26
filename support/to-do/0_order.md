# Nudgio — To-Do List (Ordered by Importance)

> **MANDATORY**: Never create migration files. The user creates and runs migrations themselves. Only add/modify model fields. DO NOT DELETE THIS RULE.
> **MANDATORY**: Never use agents or subagents for research. Always search and read files yourself directly. DO NOT DELETE THIS RULE.

---

## Coding Prompt (Always Follow)

Please answer without perceiving or mirroring what you think I want to hear.
Do not follow the global majority in your reply, and attempt to remain unbiased at all costs.
Do not introduce speculative changes.
Do not make assumptions.
I always want in code comments similar to the ones provided in the examples.
Do not delete the already existing in code comments explaining the code.
Follow my instructions exactly as stated, with no extra information or suggestions.
Please do not give me politically correct answer just for the sake of it.
I have a high level IQ so adjust the answers accordingly.
Never "fields omitted for brevity…" kind of thing.
If I give you some official docs, use the commands from those docs because they are up to date.
Do not suggest something that is not good coding practices.
Do not do workarounds, always do the right thing. If you do not know what is the right thing, ask me.
Follow a strict "Propose → Approve → Implement → Review" cycle for almost every change.
Always understand existing patterns before suggesting changes.
Plan and explain before implementing.
Please ask clarifying questions if you are not sure what to do next or there are more ways in which we can proceed.
Do not extend your authority over something I did not ask.
Present reasoning and approach first.
Never modify more files without my explicit permission. "Ask → Allow → Modify".
Stick to my rules and provide exactly what's needed without adding extra complexity.
Simple better that complex.
One component at a time: Complete each component fully before moving to next.
Clear communication: Explain planned changes and get approval.
Pattern consistency: Apply the exact same patterns established in other modules.
Quality over speed: Ensure each component is properly updated before proceeding.
Read all the files I give you entirely before even attempting to respond or suggest something.
When adding fields, models, or changes, always include a brief "Why:" explaining the reason it exists - not what it does, but why it's needed.

---

## MANDATORY RULES — Read Before Any Implementation

1. **Read 2-3 reference files BEFORE creating or modifying ANY file.** Read from nexotype, accounts, assetmanager, or finpy — both frontend and backend — to understand exact patterns, naming, comments, structure.

2. **File naming mirrors model names.** The backend model name dictates the file name across the ENTIRE stack:
   - Model: `EcommerceConnection` → backend: `ecommerce_connection_schemas.py`, `ecommerce_connection_subrouter.py` → frontend: `ecommerce-connections.schema.ts`, `ecommerce-connections.service.ts`, `ecommerce-connections.store.ts`, `ecommerce-connections-provider.tsx`, `use-ecommerce-connections.ts`
   - Model: `RecommendationSettings` → backend: `recommendation_settings_schemas.py`, `recommendation_settings_subrouter.py` → frontend: `recommendation-settings.schema.ts`, `recommendation-settings.service.ts`, `recommendation-settings.store.ts`, `recommendation-settings-provider.tsx`, `use-recommendation-settings.ts`
   - Model: `RecommendationResult` → backend: `recommendation_schemas.py`, `recommendation_subrouter.py` → frontend: `recommendations.schema.ts`, `recommendations.service.ts`, `use-recommendations.ts`
   - Model: `ConnectionStats` → backend: `data_schemas.py`, `data_subrouter.py` → frontend: `data.schema.ts`, `data.service.ts`, `data.store.ts`, `data-provider.tsx`, `use-data.ts`
   - Model: components → backend: `components_subrouter.py` → frontend: `components.schema.ts`, `components.service.ts`, `use-components.ts`
   - This applies to ALL file types: schemas, subrouters, services, stores, providers, hooks, pages.

3. **Frontend schema fields MUST match backend response fields exactly.** Same field names (snake_case), same types, same enum values.

4. **Never guess patterns.** If unsure how a file should look, find and read a working example first.

---

## Platform Authentication Summary

| Platform | Method | User Provides | Where to Get It |
|---|---|---|---|
| Shopify | OAuth 2.0 | Click "Connect with Shopify" | Automatic via OAuth consent screen |
| Shopify | Manual API | Store domain + Access token | Shopify Admin > Apps > Develop apps > Create an app > API credentials |
| WooCommerce | Auto-Auth (wc-auth) | Click "Connect WooCommerce" → approve | Automatic via `/wc-auth/v1/authorize` endpoint (built into WooCommerce) |
| WooCommerce | Manual REST API | Store URL + Consumer key + Consumer secret | WooCommerce > Settings > Advanced > REST API > Add Key |
| WooCommerce | Database | MySQL host, name, user, password, port | wp-config.php or hosting panel (advanced) |
| Magento | REST API | Store URL + Integration access token | Magento Admin > System > Integrations > Add New > Activate |
| Magento | Database | MySQL host, name, user, password, port | env.php or hosting panel (advanced) |
| Custom Integration | Ingest (Push API) | Connection name only | No credentials — data pushed via Data Ingestion API |

---

## Architecture Reference

### Models (`server/apps/ecommerce/models.py`)

- `EcommerceConnection(BaseMixin)` — id, user_id, organization_id, platform, connection_name, connection_method (api/database/ingest), store_url, api_key, api_secret, db_* fields, is_active, sync fields (auto_sync_enabled, sync_interval, last_synced_at, next_sync_at, last_sync_status)
- `RecommendationSettings(BaseMixin)` — id, connection_id (unique FK), algorithm fields (bestseller_method, lookback days, max_recommendations, min_price_increase_percent), shop URLs (shop_base_url, product_url_template), 11 brand identity visual fields (widget_style, widget_columns, widget_size, primary_color, text_color, bg_color, border_radius, cta_text, show_price, image_aspect, widget_title)
- `WidgetAPIKey(BaseMixin)` — id, connection_id, name, api_key_prefix, encrypted_secret, allowed_domains, is_active
- `ShopifyBilling(BaseMixin)` — id, organization_id, shop_domain, charge_id, plan_name, status, activated_on, cancelled_on
- `IngestedProduct`, `IngestedOrder`, `IngestedOrderItem` — local storage tables per connection_id
- `APIUsageTracking`, `RecommendationAnalytics` — append-only logs (no BaseMixin)

### Adapters (`server/apps/ecommerce/adapters/`)

```
adapters/
├── base.py           → PlatformAdapter ABC
├── factory.py        → get_adapter(connection, db) — routes by platform + connection_method
├── ingest.py         → IngestAdapter — reads from ingested tables
├── shopify/api.py    → ShopifyAdapter (GraphQL Admin API 2026-01)
├── woocommerce/api.py      → WooCommerceApiAdapter (REST API v3, HTTP Basic Auth)
├── woocommerce/database.py → WooCommerceAdapter (direct MySQL)
├── magento/api.py           → MagentoApiAdapter (REST API, Bearer token)
└── magento/database.py      → MagentoAdapter (direct MySQL, EAV)
```

### Subrouters (`server/apps/ecommerce/subrouters/`) — 12 subrouters, 69+ routes

- `ecommerce_connection_subrouter.py` — CRUD + test connection
- `recommendation_settings_subrouter.py` — CRUD per connection
- `recommendation_subrouter.py` — bestsellers, cross-sell, up-sell, similar
- `components_subrouter.py` — HTML widget generation + `apply_visual_defaults()` helper
- `data_subrouter.py` — raw product/order data + import + sync
- `woocommerce_sync_subrouter.py` — WooCommerce plugin data push (HMAC body signing auth)
- `shopify_oauth_subrouter.py` — Shopify OAuth 2.0 flow
- `woocommerce_auth_subrouter.py` — WooCommerce auto-auth
- `widget_api_key_subrouter.py` — JWT-gated CRUD for widget API keys
- `widget_subrouter.py` — Public widget endpoints (HMAC signed URL auth)
- `widget_sign_subrouter.py` — HMAC URL signing for widget.js
- `shopify_embedded_subrouter.py` — Embedded app endpoints (session token auth)
- `shopify_app_proxy_subrouter.py` — App Proxy widget endpoints (HMAC hex auth)
- `shopify_billing_subrouter.py` — Billing subscribe/cancel/status/callback

### Utils (`server/apps/ecommerce/utils/`)

- `dependency_utils.py` — `get_user_connection()`, `get_active_connection()`, `require_active_subscription`, `get_user_organization_id()`
- `subscription_utils.py` — tier constants, limits, grace period, query helpers, `is_service_active()`
- `cache_utils.py` — ABC + `InMemoryCacheBackend` + `DragonflyCacheBackend`
- `encryption_utils.py` — Fernet symmetric encryption for credentials
- `rate_limiting_utils.py` — ABC + `InMemoryRateLimitBackend` + `DragonflyRateLimitBackend`
- `widget_auth_utils.py` — HMAC-SHA256 for public widget endpoints + `verify_woocommerce_sync_signature()` for POST body signing
- `sync_utils.py` — shared upsert helpers + `sync_connection_data()` + ghost row pruning
- `shopify_session_utils.py` — session token verify + Token Exchange API
- `shopify_billing_utils.py` — Shopify Billing API helpers

### Router (`server/apps/ecommerce/router.py`)

Prefix: `/ecommerce`. Split into ungated and gated:
- **Ungated**: Shopify OAuth + WooCommerce auth + webhooks + billing + embedded (session token) + App Proxy (HMAC) + Widget (HMAC signed URL) + WooCommerce Sync (HMAC body signing)
- **Gated**: Everything else via `require_active_subscription` dependency

### Custom Integration — Tab Layout

| Connection | Tabs |
|---|---|
| Shopify (API) | Overview, Data Sync, Settings |
| WooCommerce/Magento (API/DB) | Overview, Data Sync, Settings, API Keys |
| Custom Integration (ingest) | Overview, Settings, API Keys |

Key decisions: Data Sync tab hidden for ingest connections (data is pushed). API Keys tab shows Push API Integration Guide for ingest connections.

---

## Widget / Visual Fields — Parity Checklist

When adding or modifying visual widget fields (e.g. colors, border_radius, cta_text, image_aspect, show_price, widget_title, etc.), **ALL of these files must be updated in sync**:

### Backend
- [ ] `server/apps/ecommerce/models.py` — RecommendationSettings model columns
- [ ] `server/apps/ecommerce/schemas/recommendation_settings_schemas.py` — Create, Update, Detail schemas
- [ ] `server/apps/ecommerce/subrouters/components_subrouter.py` — `VISUAL_DEFAULTS` + `_URL_TO_DB_MAP` + `apply_visual_defaults()`
- [ ] `server/apps/ecommerce/subrouters/components_subrouter.py` — 4 standalone endpoints
- [ ] `server/apps/ecommerce/subrouters/widget_subrouter.py` — 4 public widget endpoints
- [ ] `server/apps/ecommerce/subrouters/shopify_embedded_subrouter.py` — 4 embedded component endpoints + PUT settings create block
- [ ] `server/apps/ecommerce/subrouters/shopify_app_proxy_subrouter.py` — 4 app proxy endpoints
- [ ] `server/apps/ecommerce/subrouters/recommendation_settings_subrouter.py` — create block
- [ ] `server/apps/ecommerce/engine/engine.py` — `generate_recommendation_html()` if new params affect rendering

### Frontend — Standalone Dashboard
- [ ] `client/src/modules/ecommerce/schemas/recommendation-settings.schemas.ts` — both schemas
- [ ] `client/src/app/(ecommerce)/(standalone)/settings/page.tsx` — state, populate, save payload, UI
- [ ] `client/src/app/(ecommerce)/(standalone)/components/page.tsx` — state, generate params, save brand defaults

### Frontend — Shopify Embedded
- [ ] `client/src/modules/ecommerce/service/shopify-embedded.service.ts` — EmbeddedSettingsDetail + EmbeddedSettingsPayload
- [ ] `client/src/app/(ecommerce)/(embedded)/shopify/settings/page.tsx` — state, populate, save payload, UI
- [ ] `client/src/app/(ecommerce)/(embedded)/shopify/components/page.tsx` — state, generate params, save brand defaults

### Frontend — Shopify Theme Extension
- [ ] `client/extensions/nudgio-widget/blocks/nudgio-recommendations.liquid` — schema settings + URL params

### Frontend — WordPress Plugin
- [ ] `client/plugins/wordpress/nudgio/blocks/recommendations/block.json` — block attributes
- [ ] `client/plugins/wordpress/nudgio/blocks/recommendations/index.js` — Gutenberg editor controls
- [ ] `client/plugins/wordpress/nudgio/blocks/recommendations/render.php` — block-to-shortcode mapping
- [ ] `client/plugins/wordpress/nudgio/includes/class-nudgio-shortcode.php` — shortcode_atts + signed params

### Frontend — Custom Integration (widget.js)
- [ ] `server/apps/ecommerce/static/widget.js` — DEFAULTS + ATTR_MAP
- [ ] `client/src/modules/ecommerce/hooks/use-components.ts` — EMBED_DEFAULTS + generateEmbedCode

---

## Lessons Learned / Gotchas (From Official Docs)

### Shopify
- **HMAC encoding differs by context**: OAuth callback = **hex** digest. Webhooks / GDPR = **Base64** digest. App Proxy = **hex** but with decoded values, no separator join, duplicate keys joined with comma. Three different HMAC verification implementations.
- **REST API deprecated for new public apps** (April 2025): Must use **GraphQL Admin API** exclusively. OAuth endpoints (`/admin/oauth/authorize`, `/admin/oauth/access_token`) are NOT affected.
- **GraphQL rate limits are points-based**: Standard 100 pts/sec (1,000 bucket), Plus 1,000 pts/sec. Different from REST leaky bucket (40 requests, 2/sec leak).
- **Use non-expiring offline tokens**: Don't opt into expiring tokens (`expiring=1`) — it's **irreversible per shop** and adds unnecessary complexity. Non-expiring is the default.
- **Verify granted scopes after token exchange**: Merchant could have modified scope during authorization. Compare `response.scope` with what you requested.
- **Session tokens expire in 1 minute**: Shopify JWT (HS256, signed with CLIENT_SECRET). Token Exchange API converts session token to offline access token.
- **`id_token` not `id-token`**: The Token Exchange grant type parameter uses underscore, not hyphen.

### WooCommerce
- **Auto-auth callback uses raw JSON body**: `callback_url` receives POST with JSON — use raw body parsing, NOT form parsing.
- **No built-in rate limiting**: Hosting provider may impose limits. Recommend max 5 req/sec.
- **Max `per_page` is 100**: Pagination via `X-WP-TotalPages` header.
- **Some stores use custom permalink structure**: If `/wp-json/` doesn't work, try `/?rest_route=/wc/v3`.

### Magento
- **2.4.4+ Bearer token breaking change**: Integration tokens disabled as standalone Bearer tokens by default. Merchant must enable: Stores > Configuration > Services > OAuth → "Allow OAuth Access Tokens to be used as standalone Bearer tokens" → Yes. Error when disabled: `"The consumer isn't authorized to access %resources."`.
- **Single product lookup uses SKU, not numeric ID**: `GET /rest/default/V1/products/{sku}`.
- **searchCriteria filter logic**: Filter groups are AND'd together. Filters within a group are OR'd.
- **No built-in rate limiting**: Recommend max 5 req/sec. `input_limit` defaults: max 20 items per bulk PUT/POST.
- **`default` in URL = default store view**: Can be replaced with specific store code (e.g., `rest/us_en/V1`).

### WooCommerce Data Flow
- **Two data paths for WooCommerce**: (1) WooCommerce API connection (`connection_method="api"`) → `WooCommerceApiAdapter` queries store REST API **live** on every widget request — no ingested data needed, bestsellers/cross-sell/upsell/similar all work immediately. (2) WooCommerce plugin push sync → pushes data to `ingested_products`/`ingested_orders`/`ingested_order_items` via `woocommerce_sync_subrouter.py`. After first successful sync, the adapter factory automatically switches to `IngestAdapter` (local PostgreSQL reads) for all widget/recommendation requests — reducing latency vs. live REST API calls.
- **Plugin auto-sync triggers**: WP-Cron every 6 hours + real-time hooks on product/order changes + manual "Sync Data" button. First sync after credential entry requires manual button click (cron first run is up to 6 hours away).

### General
- **Nudgio server has NO `/api/v1/` prefix**: Routes are directly at `/ecommerce/...`. Never add `/api/v1/` to billing callbacks, webhook URIs, auth redirects, app proxy, etc.
- **No PG enums in DB**: Use `String(50)` columns, Python `(str, Enum)` in schemas only, `.value` when writing to DB.
- **Engine `image_url` mapping**: Shopify returns `image_url` (string), WooCommerce returns `images` (list). Engine handles both.
- **Liquid template URL encoding**: Color values must be encoded separately before appending to URL. Encoding the full query string would triple-encode `?`, `&`, `=`.
- **Extensions deploy to Shopify CDN** via `shopify app deploy`, NOT to Coolify. Coolify ignores `extensions/` entirely.

---

## ✅ Done

### Repo Setup & Infrastructure
- ✅ Nudgio repo, server config (port 8002/3002), Coolify PostgreSQL, .env files, initial migration (11 tables)
- ✅ Client ecommerce route group, organization pages, sidebar, providers

### Branding & Landing Page
- ✅ Branding rename nexotype → nudgio, brand colors `#2631f7`, logo (SVG dark + light), favicon
- ✅ Landing page — Next.js 16 on Vercel (`www.nudgio.tech`), hero, features, how-it-works, contact form, blog, legal pages

### Build & Deployment
- ✅ Coolify: Server + Client + PostgreSQL deployed, frontend build passing

### Ecommerce Backend (Phases A–F)
- ✅ Models, schemas, subrouters — all nexotype patterns (BaseMixin, Field descriptions, section headers, two-tier except)
- ✅ All 6 adapters: Shopify GraphQL, WooCommerce API + DB, Magento API + DB, IngestAdapter
- ✅ Adapter factory — routes by platform + connection_method
- ✅ Shopify OAuth + WooCommerce auto-auth subrouters
- ✅ Utils: dependency, subscription, cache (InMemory + Dragonfly), encryption (Fernet), rate limiting

### Ecommerce Router & Frontend
- ✅ Router split: ungated (OAuth/auth/webhooks/billing/embedded/widget) + gated (require_active_subscription)
- ✅ All frontend files (schemas, services, stores, providers, hooks, pages) — mirror backend naming
- ✅ Connections CRUD, settings, recommendations (product dropdown), components, data sync

### Backend Bug Fixes
- ✅ Token Exchange typo (`id-token` → `id_token`), GraphQL error parsing, image_url mapping (Shopify vs WooCommerce)
- ✅ Removed `/api/v1/` prefix from all server URLs
- ✅ App Proxy HMAC verification rewritten (decoded values, no separator, comma duplicates)
- ✅ Liquid template URL encoding fix (was triple-encoding)
- ✅ Responsive widget grid — CSS `auto-fill` + `minmax()` replaces Tailwind breakpoints (broken inside iframes)

### Stripe / Billing
- ✅ Stripe sandbox, Pro + Enterprise products, Customer Portal, production webhook, tested end-to-end

---

## ❌ To Do

### 1. Production DragonflyDB (⏸️ On Hold)
- ❌ Provision DragonflyDB in Coolify
- ❌ Switch `CACHE_BACKEND` and `RATE_LIMIT_BACKEND` to `"dragonfly"`
- ❌ Configure `DRAGONFLY_URL` env var

### 2. Shopify App Store Submission Blockers ✅
- ✅ GDPR webhooks, GraphQL migration, Shopify Billing API, Partner Dashboard registration, `shopify.app.toml`

### 3. Shopify Embedded App UI ✅
- ✅ App Bridge + Polaris web components, session token auth, Token Exchange API
- ✅ 5 embedded pages (dashboard, settings, recommendations, components, billing), 16 endpoints
- ✅ Storefront widget delivery — App Proxy (HMAC hex), Theme App Extension (Liquid + JS on Shopify CDN)
- ✅ Managed Pricing billing, product dropdown, Liquid template guards
- ✅ Responsive columns + size params (full stack, 17 files)
- ✅ Embedded documentation page

### 4. Shopify App Store Submission (⏳ Waiting on Automated Checks)
- ⏳ Automated embedded app checks — auto-checked every 2 hours. **BLOCKER**: "Using latest App Bridge CDN" + "Using session tokens for auth" not yet passing. Must log in and interact with app on dev store to generate session data.
- ✅ App listing: description, screenshots, demo video
- ❌ Submit for Shopify review (2-4 week review process) — blocked by automated checks above

### 5. Legal Pages ✅
- ✅ Privacy policy + Terms of service

### 6. Public Widget API (HMAC-Signed URL Auth) ✅
- ✅ WidgetAPIKey model, 4 public widget endpoints, HMAC-SHA256 auth, key management UI, "Copy Snippet"

### 7. WooCommerce WordPress Plugin ✅
- ✅ `[nudgio]` shortcode, Gutenberg block, WP Admin settings, submitted to Plugin Directory
- ✅ Auto-Sync v1.3.0 — `woocommerce_sync_subrouter.py` (HMAC body signing), `class-nudgio-sync.php`, WP-Cron + real-time hooks

### 8. Custom Integration Platform ✅
- ✅ `CUSTOM_INTEGRATION` platform, ingest-only form, tab layout per platform, Push API Integration Guide

### 9. Data Ingestion + Local Storage (V3) ✅
- ✅ Step 1: `IngestedProduct`/`IngestedOrder`/`IngestedOrderItem` tables, IngestAdapter, Push API import endpoints
- ✅ Step 2: Auto-sync scheduler (`SKIP LOCKED`), per-connection sync settings, Data Sync UI card
- ❌ Step 3 (future): Granular sync filters (category, price range, tags)

### 10. Universal JS Widget Snippet ✅
- ✅ `widget.js` loader (IIFE, iframe, MutationObserver), `widget_sign_subrouter.py`, "Copy Snippet" on Components page

### 11. Magento Adobe Commerce Extension 🚫 Abandoned

### 12. Widget Settings Enhancement → Widget Configuration Overhaul (35 Settings) ✅
- ✅ Started with 5 fields, expanded to 35 settings across 8 groups (full stack: 4 subrouters, Liquid, WordPress plugin, widget.js, frontend)

### 13. Brand Identity Defaults ✅
- ✅ Nullable visual columns on RecommendationSettings, `apply_visual_defaults()` fallback chain, "Save as Brand Defaults" button

### 14. Documentation Pages ✅
- ✅ Standalone (7 sections with curl examples) + Shopify embedded (5 Polaris sections)

### 15. Nice to Have ✅
- ✅ Frontend subscription pages (Shopify: Managed Pricing, Standalone: Stripe)

---

## What's Left

### 🔴 Shopify App Store Submission
- ⏳ Automated embedded app checks — pending (not failed). Must log in and interact with app on dev store to generate session data. Auto-checked every 2 hours.
- ✅ Billing callback 404 fix — `POST /billing/verify-charge` endpoint + client callback page + `charge_id` redirect from dashboard
- ✅ `connection.access_token` → `connection.api_secret` bug fix in verify-charge endpoint
- ✅ App Bridge script confirmed correct: raw sync `<script>` in `<head>` with `eslint-disable` (NOT `next/script beforeInteractive` — that generates `<link rel="preload">` + push array, not a real script tag. Shopify requires sync, no async/defer/module.)
- ✅ All webhooks implemented: `app/uninstalled`, `shop/redact`, `customers/data_request`, `customers/redact`, `app_subscriptions/update` — single dispatcher with HMAC-SHA256 Base64 verification
- ❌ Submit for Shopify review (2-4 week process) — blocked by automated checks above

### 🟡 Production DragonflyDB (⏸️ On Hold)
- ❌ Provision in Coolify, switch cache + rate limit backends

### 🟢 Future
- ❌ Granular sync filters (category, price range, tags, selective sync)
- 💡 (OPTIONAL) Server-side bounce page pattern for Shopify session tokens — if automated embedded app check doesn't pass with client-side-only approach, add server-side `id_token` validation in Next.js `proxy.ts` for `/shopify` routes + minimal bounce page (meta tag + App Bridge script). See: `shopify_session_utils.py` comment block + https://shopify.dev/docs/apps/build/authentication-authorization/set-embedded-app-authorization

