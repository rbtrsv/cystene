"""
Nudgio Ecommerce Router

Mounts all ecommerce subrouters under the /ecommerce prefix.

Split into two groups:
- Ungated: platform auth callbacks (Shopify OAuth, WooCommerce auth) — merchant
  connecting for the first time, no subscription check needed.
- Gated: everything else requires an active subscription. The
  require_active_subscription dependency blocks ALL requests (reads + writes)
  when the organization's service is inactive.
"""

from fastapi import APIRouter, Depends

from .utils.dependency_utils import require_active_subscription, enforce_rate_limit

# Connection management
from .subrouters.ecommerce_connection_subrouter import router as connections_router
from .subrouters.recommendation_settings_subrouter import router as settings_router

# Recommendation engine
from .subrouters.recommendation_subrouter import router as recommendations_router
from .subrouters.components_subrouter import router as components_router

# Data management
from .subrouters.data_subrouter import router as data_router

# Platform auth flows
from .subrouters.shopify_oauth_subrouter import router as shopify_oauth_router
from .subrouters.woocommerce_auth_subrouter import router as woocommerce_auth_router

# Shopify webhooks (GDPR compliance + billing status)
from .subrouters.shopify_webhooks_subrouter import router as shopify_webhooks_router

# Shopify App Proxy (storefront widget delivery via HMAC auth)
from .subrouters.shopify_app_proxy_subrouter import router as shopify_app_proxy_router

# Shopify billing
from .subrouters.shopify_billing_subrouter import router as shopify_billing_router

# Shopify embedded app API (session token auth)
from .subrouters.shopify_embedded_subrouter import router as shopify_embedded_router

# Public widget delivery (HMAC signed URL auth — non-Shopify platforms)
from .subrouters.widget_subrouter import router as widget_router

# WooCommerce sync (HMAC body signing auth — WooCommerce plugin data push)
from .subrouters.woocommerce_sync_subrouter import router as woocommerce_sync_router

# Widget API key management (JWT-gated CRUD)
from .subrouters.widget_api_key_subrouter import router as widget_api_key_router

# Widget sign endpoint (public — generates HMAC-signed URLs for JS loader)
from .subrouters.widget_sign_subrouter import router as widget_sign_router


router = APIRouter(prefix="/ecommerce")

# Ungated — auth callbacks + platform webhooks + billing + embedded + app proxy (HMAC auth handled internally)
router.include_router(shopify_oauth_router)
router.include_router(woocommerce_auth_router)
router.include_router(shopify_webhooks_router)
router.include_router(shopify_billing_router)  # Mixed gating handled internally
router.include_router(shopify_embedded_router)  # Session token auth handled internally
router.include_router(shopify_app_proxy_router)  # HMAC auth handled internally
router.include_router(widget_router)  # HMAC signed URL auth handled internally
router.include_router(widget_sign_router)  # Public sign endpoint (generates signed URLs for widget.js)
router.include_router(woocommerce_sync_router)  # HMAC body signing auth handled internally

# Gated — everything else requires active service
# See require_active_subscription in dependency_utils.py for details.
gated = APIRouter(dependencies=[Depends(require_active_subscription), Depends(enforce_rate_limit)])

# Connection management
gated.include_router(connections_router)
gated.include_router(settings_router)

# Recommendation engine
gated.include_router(recommendations_router)
gated.include_router(components_router)

# Data management
gated.include_router(data_router)

# Widget API key management
gated.include_router(widget_api_key_router)

router.include_router(gated)
