# 🏗️ Nudgio — Architecture & System Overview (Gemini Audit)

This document provides a technical map of the Nudgio ecosystem, explaining how data flows from ecommerce platforms into our engine and finally to the storefront widgets.

---

## 1. Core Philosophy: The V3 Unified Architecture
Nudgio operates on a **"Three Sync Sources, One Read Path"** model. 

### The Data Split:
*   **Sync Path (The Input):** We pull or receive data from Shopify, WooCommerce, and Custom APIs. This data is normalized and saved in our local PostgreSQL tables: `ingested_products`, `ingested_orders`, and `ingested_order_items`.
*   **Read Path (The Output):** ALL widgets (Shopify, WordPress, JS) read exclusively from these local tables via the `IngestAdapter`.
*   **Why:** This ensures sub-50ms response times and high availability. If Shopify is down, Nudgio keeps working using the local copy of the data.

---

## 2. Backend Organization (`server/apps/ecommerce/`)

### Key Components:
*   **`adapters/`**: Translators for different platforms.
    *   `base.py`: The standard interface (Abstract Base Class).
    *   `factory.py`: The "Smart Switch". It decides whether to use a live platform API (for syncing) or the local DB (for rendering widgets).
    *   `ingest.py`: The high-performance adapter that queries our Postgres tables.
    *   `shopify/api.py` & `woocommerce/api.py`: Connectors to external store APIs.
*   **`engine/`**: The recommendation brain (`engine.py`). Calculates Bestsellers, Cross-sell, Upsell, and Similar products based on local data.
*   **`subrouters/`**: Feature-based API endpoints.
    *   `shopify_app_proxy_subrouter.py`: Handles Shopify storefront requests.
    *   `woocommerce_sync_subrouter.py`: Receives data "pushed" by the WordPress plugin.
    *   `widget_subrouter.py`: Serves signed requests for universal JS widgets.
*   **`utils/`**: Logic for Caching (5-min infrastructure cache), HMAC Security, and Sync Orchestration (`sync_utils.py`).

---

## 3. Frontend Architecture (`client/src/modules/ecommerce/`)

*   **`hooks/`**: Shared logic, like `use-components.ts` for generating the HTML snippet.
*   **`services/`**: API clients for both standalone and Shopify embedded contexts.
*   **`schemas/`**: Zod/Pydantic parity. We use the same field names (snake_case) across the whole stack to prevent mapping errors.

---

## 4. Authentication Handshake Summary

| Platform | Auth Type | Storage |
| :--- | :--- | :--- |
| **Shopify** | OAuth 2.0 / JWT | Offline Access Token (Encrypted in DB). |
| **WooCommerce** | Auto-Auth / REST | Consumer Key & Secret (Encrypted in DB). |
| **Custom** | Widget API Key | HMAC-SHA256 signature using a one-time shown Secret. |

---

## 5. The "Auto-Sync" Logic (How data is saved)

*   **Shopify (Pull):** A background scheduler (`sync_scheduler.py`) queries Shopify GraphQL every few hours (configurable per connection).
*   **WooCommerce (Push):** The WordPress plugin (v1.3.0+) uses real-time hooks. When a product is updated or an order is placed, WP pushes the data to Nudgio immediately.
*   **Logic:** We use **PostgreSQL Upsert** (`ON CONFLICT DO UPDATE`). If a product exists, we update its price/stock; if not, we create it.

---

## 6. The Design System (35 Configurable Settings)
Widget styling is managed via 8 groups of settings (Container, Title, Layout, Card, Image, Typography, Price, CTA).

**The Fallback Chain:**
1.  **URL Params:** Overrides everything (used by Shopify Theme Editor / WP Shortcode).
2.  **DB Defaults:** Brand identity saved in `RecommendationSettings`.
3.  **Hardcoded:** The "Blue Nudgio" style as a final safety net.

---

## 7. Debugging & Maintenance Guide

### 1. Inspecting the Database (via `psql`):
*   **Check sync volume:** `SELECT count(*) FROM ingested_products WHERE connection_id = X;`
*   **Check sync health:** `SELECT last_sync_status, last_synced_at FROM ecommerce_connections;`

### 2. Common Errors:
*   **422 Unprocessable Entity:** Usually a missing boolean or an empty string where a specific enum is expected. Check `schemas.py`.
*   **403 Forbidden:** HMAC mismatch. Check if the URL was tampered with or if the API Secret was changed.
*   **"Partial Errors" (Shopify):** Permission (Scope) issues in `shopify.app.toml`.

### 3. Deployment:
*   **Backend:** Coolify (automatic on git push).
*   **Shopify Extension:** Requires `shopify app deploy`.
*   **WordPress:** Requires a new ZIP export (v1.3.1+) after any URL or Auth changes.
