/**
 * API endpoints for the ecommerce module
 *
 * All endpoints under /ecommerce prefix.
 * Backend router: /server/apps/ecommerce/router.py
 */

import { API_BASE_URL } from '@/modules/accounts/utils/api.endpoints';

/**
 * API endpoints for connections
 * Backend: /server/apps/ecommerce/subrouters/ecommerce_connection_subrouter.py
 */
export const CONNECTION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/ecommerce/connections/`,
  DETAIL: (id: number) => `${API_BASE_URL}/ecommerce/connections/${id}`,
  CREATE: `${API_BASE_URL}/ecommerce/connections/`,
  UPDATE: (id: number) => `${API_BASE_URL}/ecommerce/connections/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/ecommerce/connections/${id}`,
  TEST: (id: number) => `${API_BASE_URL}/ecommerce/connections/${id}/test`,
};

/**
 * API endpoints for recommendation settings
 * Backend: /server/apps/ecommerce/subrouters/recommendation_settings_subrouter.py
 */
export const SETTINGS_ENDPOINTS = {
  CREATE_OR_UPDATE: (connId: number) => `${API_BASE_URL}/ecommerce/settings/${connId}`,
  DETAIL: (connId: number) => `${API_BASE_URL}/ecommerce/settings/${connId}`,
  LIST: `${API_BASE_URL}/ecommerce/settings/`,
  DELETE: (connId: number) => `${API_BASE_URL}/ecommerce/settings/${connId}`,
  RESET: (connId: number) => `${API_BASE_URL}/ecommerce/settings/${connId}/reset`,
};

/**
 * API endpoints for recommendations
 * Backend: /server/apps/ecommerce/subrouters/recommendation_subrouter.py
 */
export const RECOMMENDATION_ENDPOINTS = {
  BESTSELLERS: `${API_BASE_URL}/ecommerce/recommendations/bestsellers`,
  CROSS_SELL: `${API_BASE_URL}/ecommerce/recommendations/cross-sell`,
  UPSELL: `${API_BASE_URL}/ecommerce/recommendations/upsell`,
  SIMILAR: `${API_BASE_URL}/ecommerce/recommendations/similar`,
};

/**
 * API endpoints for embeddable HTML components
 * Backend: /server/apps/ecommerce/subrouters/components_subrouter.py
 */
export const COMPONENT_ENDPOINTS = {
  BESTSELLERS: `${API_BASE_URL}/ecommerce/components/bestsellers`,
  CROSS_SELL: `${API_BASE_URL}/ecommerce/components/cross-sell`,
  UPSELL: `${API_BASE_URL}/ecommerce/components/upsell`,
  SIMILAR: `${API_BASE_URL}/ecommerce/components/similar`,
};

/**
 * API endpoints for data and analytics
 * Backend: /server/apps/ecommerce/subrouters/data_subrouter.py
 */
export const DATA_ENDPOINTS = {
  STATS: (connId: number) => `${API_BASE_URL}/ecommerce/data/stats/${connId}`,
  PRODUCTS: (connId: number) => `${API_BASE_URL}/ecommerce/data/products/${connId}`,
  SYNC: (connId: number) => `${API_BASE_URL}/ecommerce/data/sync/${connId}`,
};

/**
 * API endpoints for widget API key management
 * Backend: /server/apps/ecommerce/subrouters/widget_api_key_subrouter.py
 */
export const WIDGET_API_KEY_ENDPOINTS = {
  // Trailing slash required on collection endpoints to avoid FastAPI 307 redirect (http:// scheme behind proxy)
  LIST: (connId: number) => `${API_BASE_URL}/ecommerce/connections/${connId}/api-keys/`,
  CREATE: (connId: number) => `${API_BASE_URL}/ecommerce/connections/${connId}/api-keys/`,
  DELETE: (connId: number, keyId: number) => `${API_BASE_URL}/ecommerce/connections/${connId}/api-keys/${keyId}`,
};

/**
 * API endpoints for widget sign (public — generates HMAC-signed URLs for widget.js)
 * Backend: /server/apps/ecommerce/subrouters/widget_sign_subrouter.py
 */
export const WIDGET_SIGN_ENDPOINTS = {
  SIGN: `${API_BASE_URL}/ecommerce/widget/sign`,
};

/**
 * API endpoints for Shopify OAuth
 * Backend: /server/apps/ecommerce/subrouters/shopify_oauth_subrouter.py
 */
export const SHOPIFY_OAUTH_ENDPOINTS = {
  AUTH: (shop: string) => `${API_BASE_URL}/ecommerce/shopify/auth?shop=${encodeURIComponent(shop)}`,
};

/**
 * API endpoints for WooCommerce auto-auth
 * Backend: /server/apps/ecommerce/subrouters/woocommerce_auth_subrouter.py
 */
export const WOOCOMMERCE_AUTH_ENDPOINTS = {
  AUTH: (storeUrl: string) => `${API_BASE_URL}/ecommerce/woocommerce/auth?store_url=${encodeURIComponent(storeUrl)}`,
};
