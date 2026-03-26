"""
Centralized adapter factory — maps platform + connection method to the correct adapter class.

Routing priority (top to bottom):
1. force_platform=True → always return platform adapter (for test_connection, sync pulling)
2. db is None → return platform adapter (sync_utils.py convention: passes no db)
3. connection_method == "ingest" → return IngestAdapter (explicit ingest connections)
4. _has_synced_data(connection) → return IngestAdapter (connection has fresh synced data locally)
5. Fallback → return platform adapter (no synced data yet, query live API)

Three sync sources, one read path:
- Auto-Sync (server scheduler in sync_utils.py) → pulls via platform adapter → writes to ingested_*
- Plugin Push (WooCommerce HMAC endpoints) → plugin POSTs data → writes to ingested_*
- Shopify Webhooks (future) → Shopify pushes data → writes to ingested_*
- Read path: ALL widget/recommendation/component endpoints → factory → IngestAdapter → local PostgreSQL
"""

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import EcommerceConnection
from ..schemas.ecommerce_connection_schemas import PlatformType, ConnectionMethod
from ..utils.encryption_utils import decrypt_password
from .shopify import ShopifyAdapter
from .woocommerce import WooCommerceDatabaseAdapter, WooCommerceApiAdapter
from .magento import MagentoDatabaseAdapter, MagentoApiAdapter
from .ingest import IngestAdapter


def _has_synced_data(connection: EcommerceConnection) -> bool:
    """
    Check if this connection has successfully synced data to local ingested_* tables.
    Used by get_adapter() to decide whether to read from local PostgreSQL (IngestAdapter)
    or fall through to the live platform adapter (external API).
    """
    return (
        connection.last_synced_at is not None
        and connection.last_sync_status == "success"
    )


def _build_platform_adapter(
    connection: EcommerceConnection,
    api_key: str | None,
    api_secret: str | None,
    db_password: str | None,
):
    """
    Build the correct platform adapter based on connection.platform and connection_method.
    Extracted to avoid duplicating the platform switch block in multiple code paths.

    Args:
        connection: The EcommerceConnection instance
        api_key: Decrypted API key (or None)
        api_secret: Decrypted API secret / access token (or None)
        db_password: Decrypted database password (or None)
    """
    if connection.platform == PlatformType.SHOPIFY.value:
        # Shopify is always API-based — api_secret = access token
        return ShopifyAdapter(connection, access_token=api_secret)

    elif connection.platform == PlatformType.WOOCOMMERCE.value:
        if connection.connection_method == ConnectionMethod.DATABASE.value:
            return WooCommerceDatabaseAdapter(connection, db_password=db_password)
        return WooCommerceApiAdapter(connection, api_key=api_key, api_secret=api_secret)

    elif connection.platform == PlatformType.MAGENTO.value:
        if connection.connection_method == ConnectionMethod.DATABASE.value:
            return MagentoDatabaseAdapter(connection, db_password=db_password)
        return MagentoApiAdapter(connection, api_key=api_key, api_secret=api_secret)

    else:
        raise ValueError(f"Unsupported platform: {connection.platform}")


def get_adapter(
    connection: EcommerceConnection,
    db: AsyncSession = None,
    force_platform: bool = False,
):
    """
    Centralized adapter factory.
    Returns the correct adapter based on platform, connection_method, and sync state.

    Decrypts credentials before passing to adapter — adapters receive
    already-decrypted values. Single decryption point.

    Args:
        connection: The EcommerceConnection instance
        db: AsyncSession — required for IngestAdapter, ignored for platform adapters
        force_platform: If True, always return the platform adapter (for test_connection,
                        sync pulling). Bypasses synced-data check.

    Note: decrypt_password() handles non-encrypted values gracefully
    (returns input if decryption fails), so existing plaintext credentials
    still work during transition.
    """
    # Priority 1: force_platform=True → always return platform adapter
    # Used by test_connection (must verify live credentials) and any caller
    # that explicitly needs to hit the external API
    if force_platform:
        api_key = decrypt_password(connection.api_key) if connection.api_key else None
        api_secret = decrypt_password(connection.api_secret) if connection.api_secret else None
        db_password = decrypt_password(connection.db_password) if connection.db_password else None
        return _build_platform_adapter(connection, api_key, api_secret, db_password)

    # Priority 2: db is None → return platform adapter
    # sync_utils.py deliberately passes no db (line 183) when pulling fresh data
    # from the external platform — it needs the live adapter, not IngestAdapter
    if db is None:
        api_key = decrypt_password(connection.api_key) if connection.api_key else None
        api_secret = decrypt_password(connection.api_secret) if connection.api_secret else None
        db_password = decrypt_password(connection.db_password) if connection.db_password else None
        return _build_platform_adapter(connection, api_key, api_secret, db_password)

    # Priority 3: Explicit ingest connection → IngestAdapter
    # Manual setting for connections that only receive data via push (no live API)
    if connection.connection_method == ConnectionMethod.INGEST.value:
        return IngestAdapter(connection, db)

    # Priority 4: Connection has successfully synced data → IngestAdapter
    # After first successful sync (auto-sync, plugin push, or future webhooks),
    # all widget/recommendation reads use local PostgreSQL instead of external API
    if _has_synced_data(connection):
        return IngestAdapter(connection, db)

    # Priority 5: Fallback → platform adapter (no synced data yet)
    # Fresh connections that haven't synced yet still query the live API
    api_key = decrypt_password(connection.api_key) if connection.api_key else None
    api_secret = decrypt_password(connection.api_secret) if connection.api_secret else None
    db_password = decrypt_password(connection.db_password) if connection.db_password else None
    return _build_platform_adapter(connection, api_key, api_secret, db_password)
