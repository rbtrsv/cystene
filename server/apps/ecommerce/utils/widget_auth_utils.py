"""
Nudgio Utils — Widget Authentication

HMAC-SHA256 signature verification for public widget endpoints.
Used by non-Shopify platforms (WooCommerce, Magento, custom sites).

Security model:
- WordPress plugin (or JS snippet) holds the API secret
- Iframe URLs use signed parameters: key_id + ts + nonce + sig
- Signature covers ALL query params (not just auth params) — prevents tampering
- Server verifies signature on each request using Fernet-decrypted secret

Canonical query for signing:
    Take all query params except 'sig', sort by key alphabetically,
    join as key=value&key=value, then HMAC-SHA256 with the API secret.

Rate limiting:
    Dedicated limits for public widget endpoints (separate from gated router):
    - Per key_id: 60 req/min (sustained)
    - Per IP: 120 req/min (prevents abuse even with valid key)
"""

import hmac as hmac_mod
import hashlib
import time
import logging
from urllib.parse import urlencode

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..models import WidgetAPIKey, EcommerceConnection
from .encryption_utils import decrypt_password
from .rate_limiting_utils import rate_limiter

logger = logging.getLogger(__name__)

# ==========================================
# Widget Rate Limit Constants
# ==========================================

# Per key_id: 60 requests per minute (sustained widget traffic)
WIDGET_KEY_RATE_LIMIT = 60
WIDGET_KEY_RATE_WINDOW = 60  # seconds

# Per IP: 120 requests per minute (prevents abuse even with valid key)
WIDGET_IP_RATE_LIMIT = 120
WIDGET_IP_RATE_WINDOW = 60  # seconds

# Signature timestamp expiry: 5 minutes
SIGNATURE_MAX_AGE_SECONDS = 300


# ==========================================
# HMAC Signature Verification
# ==========================================

async def verify_widget_signature(
    query_params: dict[str, str], db: AsyncSession
) -> tuple[WidgetAPIKey, EcommerceConnection]:
    """
    Verify HMAC-signed widget request using canonical query string.

    This function:
    1. Extract sig from query_params, remove it
    2. Validate required params (key_id, ts, nonce) are present
    3. Check ts not expired (within 5 minutes)
    4. Look up key_id in DB (active + not deleted)
    5. Eagerly load the connection relationship
    6. Decrypt api_key_encrypted using Fernet (encryption_utils.py)
    7. Sort remaining params alphabetically, rebuild canonical query string
    8. Compute HMAC-SHA256(canonical_query, decrypted_key)
    9. Compare with sig (hmac.compare_digest — constant-time)
    10. Return (key, connection)

    Args:
        query_params: All query parameters from the request (dict-like)
        db: Database session

    Returns:
        Tuple of (WidgetAPIKey, EcommerceConnection)

    Raises:
        WidgetAuthError with descriptive message on any failure
    """
    # Step 1: Extract sig from query params
    params = dict(query_params)
    sig = params.pop("sig", None)
    if not sig:
        raise WidgetAuthError("Missing signature")

    # Step 2: Validate required params
    key_id_str = params.get("key_id")
    ts_str = params.get("ts")
    nonce = params.get("nonce")

    if not key_id_str or not ts_str or not nonce:
        raise WidgetAuthError("Missing required parameters")

    try:
        key_id = int(key_id_str)
    except ValueError:
        raise WidgetAuthError("Invalid key_id")

    # Step 3: Check timestamp not expired
    try:
        ts = int(ts_str)
    except ValueError:
        raise WidgetAuthError("Invalid timestamp")

    now = int(time.time())
    if abs(now - ts) > SIGNATURE_MAX_AGE_SECONDS:
        raise WidgetAuthError("Signature expired")

    # Step 4: Look up key_id in DB (active + not deleted)
    result = await db.execute(
        select(WidgetAPIKey).where(
            and_(
                WidgetAPIKey.id == key_id,
                WidgetAPIKey.is_active == True,
                WidgetAPIKey.deleted_at.is_(None),
            )
        )
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise WidgetAuthError("Invalid or inactive API key")

    # Step 5: Load the connection (active + not deleted)
    conn_result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.id == api_key.connection_id,
                EcommerceConnection.is_active == True,
                EcommerceConnection.deleted_at.is_(None),
            )
        )
    )
    connection = conn_result.scalar_one_or_none()
    if not connection:
        raise WidgetAuthError("Connection not found or inactive")

    # Step 6: Decrypt the stored API secret
    try:
        decrypted_secret = decrypt_password(api_key.api_key_encrypted)
    except Exception:
        logger.error(f"Widget auth: failed to decrypt API key id={key_id}")
        raise WidgetAuthError("Internal authentication error")

    # Step 7: Sort remaining params alphabetically, rebuild canonical query string
    # Use urlencode to match PHP's http_build_query (URL-encodes values like # → %23)
    sorted_params = sorted(params.items())
    canonical = urlencode(sorted_params)

    # Step 8: Compute HMAC-SHA256(canonical_query, decrypted_key)
    computed = hmac_mod.new(
        decrypted_secret.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Step 9: Constant-time compare
    if not hmac_mod.compare_digest(computed, sig):
        raise WidgetAuthError("Invalid signature")

    # Step 10: Return (key, connection)
    return api_key, connection


# ==========================================
# Domain Restriction Check
# ==========================================

def check_domain_restriction(key: WidgetAPIKey, referer: str | None) -> bool:
    """
    Secondary signal — check referer against allowed_domains.
    Allow all if allowed_domains is not set.

    This is defense-in-depth only — not primary auth.
    The HMAC signature is the primary authentication mechanism.

    Args:
        key: The WidgetAPIKey instance
        referer: The Referer header value (or None)

    Returns:
        True if allowed, False if blocked
    """
    # No domain restriction configured — allow all
    if not key.allowed_domains:
        return True

    # No referer header — allow (some browsers strip it)
    if not referer:
        return True

    # Parse allowed domains from comma-separated string
    allowed = [d.strip().lower() for d in key.allowed_domains.split(",") if d.strip()]
    if not allowed:
        return True

    # Extract domain from referer URL
    try:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        referer_domain = parsed.hostname or ""
        referer_domain = referer_domain.lower()
    except Exception:
        return True  # Malformed referer — allow (defense-in-depth, not primary auth)

    # Check if referer domain matches any allowed domain
    for domain in allowed:
        if referer_domain == domain or referer_domain.endswith(f".{domain}"):
            return True

    return False


# ==========================================
# Widget Rate Limiting
# ==========================================

async def check_widget_rate_limit(key_id: int, client_ip: str) -> bool:
    """
    Dedicated rate limiting for public widget endpoints.

    Per key_id: 60 req/min (sustained widget traffic from one store).
    Per IP: 120 req/min (prevents abuse even with valid key).

    Uses existing rate_limiting_utils backend (InMemory or Dragonfly).

    Args:
        key_id: The widget API key ID
        client_ip: Client IP address

    Returns:
        True if within limits, False if rate limited
    """
    # Check per-key rate limit
    key_ok = await rate_limiter.check_and_increment(
        f"wrl:key:{key_id}:min", WIDGET_KEY_RATE_LIMIT, WIDGET_KEY_RATE_WINDOW
    )
    if not key_ok:
        return False

    # Check per-IP rate limit
    ip_ok = await rate_limiter.check_and_increment(
        f"wrl:ip:{client_ip}:min", WIDGET_IP_RATE_LIMIT, WIDGET_IP_RATE_WINDOW
    )
    if not ip_ok:
        return False

    return True


# ==========================================
# Widget Auth Error
# ==========================================

class WidgetAuthError(Exception):
    """Raised when widget HMAC signature verification fails."""
    pass


# ==========================================
# WooCommerce Sync HMAC Verification (POST Body)
# ==========================================

async def verify_woocommerce_sync_signature(
    headers: dict[str, str], body_bytes: bytes, db: AsyncSession
) -> tuple[WidgetAPIKey, EcommerceConnection]:
    """
    Verify HMAC-signed WooCommerce sync POST request using raw body signing.

    Same security model as verify_widget_signature but for POST requests:
    - Headers carry auth params instead of query string
    - HMAC covers the raw request body instead of canonical query string

    Headers:
        X-Nudgio-Key-Id — the widget API key ID
        X-Nudgio-Timestamp — Unix timestamp
        X-Nudgio-Nonce — random hex string
        X-Nudgio-Signature — HMAC-SHA256(request_body_raw, api_secret)

    This function:
    1. Extract key_id, timestamp, nonce, signature from headers
    2. Validate all required headers are present
    3. Check timestamp not expired (within 5 minutes)
    4. Look up key_id in DB (active + not deleted)
    5. Load the connection (active + not deleted)
    6. Decrypt the stored API secret using Fernet (encryption_utils.py)
    7. Compute HMAC-SHA256(body_bytes, decrypted_secret)
    8. Compare with signature (hmac.compare_digest — constant-time)
    9. Return (key, connection)

    Args:
        headers: Request headers dict
        body_bytes: Raw request body bytes
        db: Database session

    Returns:
        Tuple of (WidgetAPIKey, EcommerceConnection)

    Raises:
        WidgetAuthError with descriptive message on any failure
    """
    # Step 1: Extract auth headers
    key_id_str = headers.get("x-nudgio-key-id")
    ts_str = headers.get("x-nudgio-timestamp")
    nonce = headers.get("x-nudgio-nonce")
    signature = headers.get("x-nudgio-signature")

    # Step 2: Validate all required headers are present
    if not key_id_str or not ts_str or not nonce or not signature:
        raise WidgetAuthError("Missing required authentication headers")

    try:
        key_id = int(key_id_str)
    except ValueError:
        raise WidgetAuthError("Invalid key_id")

    # Step 3: Check timestamp not expired
    try:
        ts = int(ts_str)
    except ValueError:
        raise WidgetAuthError("Invalid timestamp")

    now = int(time.time())
    if abs(now - ts) > SIGNATURE_MAX_AGE_SECONDS:
        raise WidgetAuthError("Signature expired")

    # Step 4: Look up key_id in DB (active + not deleted)
    result = await db.execute(
        select(WidgetAPIKey).where(
            and_(
                WidgetAPIKey.id == key_id,
                WidgetAPIKey.is_active == True,
                WidgetAPIKey.deleted_at.is_(None),
            )
        )
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise WidgetAuthError("Invalid or inactive API key")

    # Step 5: Load the connection (active + not deleted)
    conn_result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.id == api_key.connection_id,
                EcommerceConnection.is_active == True,
                EcommerceConnection.deleted_at.is_(None),
            )
        )
    )
    connection = conn_result.scalar_one_or_none()
    if not connection:
        raise WidgetAuthError("Connection not found or inactive")

    # Step 6: Decrypt the stored API secret
    try:
        decrypted_secret = decrypt_password(api_key.api_key_encrypted)
    except Exception:
        logger.error(f"WooCommerce sync auth: failed to decrypt API key id={key_id}")
        raise WidgetAuthError("Internal authentication error")

    # Step 7: Compute HMAC-SHA256(body_bytes, decrypted_secret)
    computed = hmac_mod.new(
        decrypted_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    # Step 8: Constant-time compare
    if not hmac_mod.compare_digest(computed, signature):
        raise WidgetAuthError("Invalid signature")

    # Step 9: Return (key, connection)
    return api_key, connection
