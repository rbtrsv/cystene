"""
Nudgio Utils — Recommendation Cache

Caches recommendation results to avoid re-querying platform APIs on every request.

Two backends:
- "memory" — Python dict with TTL (development, single worker)
- "dragonfly" — DragonflyDB/Redis via redis.asyncio (production, multi-worker)

Switch backend by changing CACHE_BACKEND constant below.

Public API:
    - get_cached_recommendations(connection_id, rec_type, **params) → cached list or None
    - set_cached_recommendations(connection_id, rec_type, recommendations, ttl, **params)

Cache key = MD5 of prefix + sorted params → deterministic, collision-safe.
"""

from typing import Any, Dict, List
from datetime import datetime, timezone, timedelta
from abc import ABC, abstractmethod
import json
import hashlib
import logging

logger = logging.getLogger(__name__)

# ==========================================
# Cache Backend Configuration
# ==========================================

# "memory" for development, "dragonfly" for production
CACHE_BACKEND = "memory"
DRAGONFLY_URL = "redis://localhost:6379"


# ==========================================
# Abstract Base Class
# ==========================================

class CacheBackend(ABC):
    """Abstract cache backend interface"""

    @abstractmethod
    async def get(self, key: str) -> Any | None:
        """Get cached value by key. Returns None if not found or expired."""
        ...

    @abstractmethod
    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Set cached value with TTL in seconds."""
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete a cached entry by key."""
        ...

    @abstractmethod
    async def clear(self) -> None:
        """Clear all cached entries."""
        ...


# ==========================================
# In-Memory Backend (Development)
# ==========================================

class InMemoryCacheBackend(CacheBackend):
    """
    Python dict with TTL expiration.
    Single worker only — cache is lost on restart.
    """

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    async def get(self, key: str) -> Any | None:
        """Get cached value. Removes entry if expired."""
        if key in self._cache:
            entry = self._cache[key]
            if datetime.now(timezone.utc) < entry["expires_at"]:
                return entry["data"]
            else:
                # Remove expired entry
                del self._cache[key]
        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Set cached value with TTL in seconds."""
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
        self._cache[key] = {
            "data": value,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }

    async def delete(self, key: str) -> None:
        """Delete cached entry."""
        if key in self._cache:
            del self._cache[key]

    async def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()


# ==========================================
# DragonflyDB Backend (Production)
# ==========================================

class DragonflyCacheBackend(CacheBackend):
    """
    DragonflyDB/Redis backend via redis.asyncio.
    Multi-worker safe — shared state across processes.
    Uses JSON serialization for stored values.
    """

    def __init__(self, url: str):
        import redis.asyncio as aioredis
        self._redis = aioredis.from_url(url, decode_responses=True)

    async def get(self, key: str) -> Any | None:
        """Get cached value from DragonflyDB. Returns None if not found or expired."""
        try:
            raw = await self._redis.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as e:
            logger.error(f"Cache GET failed for key '{key}': {e}")
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Set cached value in DragonflyDB with TTL via SETEX."""
        try:
            serialized = json.dumps(value)
            await self._redis.setex(key, ttl_seconds, serialized)
        except Exception as e:
            logger.error(f"Cache SET failed for key '{key}': {e}")

    async def delete(self, key: str) -> None:
        """Delete cached entry from DragonflyDB."""
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.error(f"Cache DELETE failed for key '{key}': {e}")

    async def clear(self) -> None:
        """Flush all keys from DragonflyDB. Use with caution in production."""
        try:
            await self._redis.flushdb()
        except Exception as e:
            logger.error(f"Cache CLEAR failed: {e}")


# ==========================================
# Factory + Global Instance
# ==========================================

def _create_cache() -> CacheBackend:
    """Create cache backend based on CACHE_BACKEND constant."""
    if CACHE_BACKEND == "dragonfly":
        return DragonflyCacheBackend(DRAGONFLY_URL)
    return InMemoryCacheBackend()


# Global cache instance — import and use directly
cache = _create_cache()


# ==========================================
# Helper Functions
# ==========================================

def _generate_key(prefix: str, **kwargs) -> str:
    """Generate a deterministic cache key from prefix and parameters."""
    key_data = f"{prefix}:" + ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()


async def get_cached_recommendations(
    connection_id: int,
    rec_type: str,
    **params
) -> List[Dict[str, Any]] | None:
    """
    Get cached recommendations for a connection + recommendation type.

    Args:
        connection_id: Connection ID
        rec_type: Recommendation type (e.g. "bestseller", "cross_sell")
        **params: Additional parameters that affect cache key (e.g. product_id, limit)

    Returns:
        Cached recommendation list, or None if not cached
    """
    key = _generate_key(f"recs_{rec_type}", connection_id=connection_id, **params)
    result = await cache.get(key)
    if result is not None:
        logger.debug("Cache HIT — rec_type=%s connection_id=%s params=%s", rec_type, connection_id, params)
    else:
        logger.debug("Cache MISS — rec_type=%s connection_id=%s params=%s", rec_type, connection_id, params)
    return result


async def set_cached_recommendations(
    connection_id: int,
    rec_type: str,
    recommendations: List[Dict[str, Any]],
    ttl_seconds: int = 3600,
    **params
) -> None:
    """
    Cache recommendations for a connection + recommendation type.

    Args:
        connection_id: Connection ID
        rec_type: Recommendation type (e.g. "bestseller", "cross_sell")
        recommendations: List of recommendation dicts to cache
        ttl_seconds: Cache TTL in seconds (default 1 hour)
        **params: Additional parameters that affect cache key (e.g. product_id, limit)
    """
    key = _generate_key(f"recs_{rec_type}", connection_id=connection_id, **params)
    await cache.set(key, recommendations, ttl_seconds)
    logger.debug("Cache SET — rec_type=%s connection_id=%s ttl=%ss params=%s", rec_type, connection_id, ttl_seconds, params)


# ==========================================
# Infrastructure Cache — Shop Connection
# ==========================================

# TTL for infrastructure lookups (connection, service status, settings)
INFRA_CACHE_TTL = 300  # 5 minutes

async def get_cached_shop_connection(shop: str) -> Dict[str, Any] | None:
    """
    Get cached connection lookup by shop domain.

    Returns dict with connection_id + organization_id, or None if not cached.
    Keyed by shop domain — avoids full WHERE query on every widget render.
    """
    key = f"shop_conn:{shop}"
    result = await cache.get(key)
    if result is not None:
        logger.debug("Cache HIT — shop_connection shop=%s", shop)
    else:
        logger.debug("Cache MISS — shop_connection shop=%s", shop)
    return result


async def set_cached_shop_connection(shop: str, connection_id: int, organization_id: int) -> None:
    """
    Cache connection lookup by shop domain.

    Stores connection_id + organization_id as a dict.
    On cache hit, caller uses db.get(EcommerceConnection, connection_id)
    for an instant PK lookup (uses SQLAlchemy identity map within same request).
    """
    key = f"shop_conn:{shop}"
    data = {"connection_id": connection_id, "organization_id": organization_id}
    await cache.set(key, data, INFRA_CACHE_TTL)
    logger.debug("Cache SET — shop_connection shop=%s connection_id=%s", shop, connection_id)


# ==========================================
# Infrastructure Cache — Service Status
# ==========================================

async def get_cached_service_status(organization_id: int) -> bool | None:
    """
    Get cached service active status by organization ID.

    Returns True/False, or None if not cached.
    Avoids re-querying subscription tables on every widget render.
    """
    key = f"svc_active:{organization_id}"
    result = await cache.get(key)
    if result is not None:
        logger.debug("Cache HIT — service_status org_id=%s active=%s", organization_id, result)
    else:
        logger.debug("Cache MISS — service_status org_id=%s", organization_id)
    return result


async def set_cached_service_status(organization_id: int, is_active: bool) -> None:
    """
    Cache service active status by organization ID.

    Stores a boolean — True if subscription is active or within free tier limits.
    """
    key = f"svc_active:{organization_id}"
    await cache.set(key, is_active, INFRA_CACHE_TTL)
    logger.debug("Cache SET — service_status org_id=%s active=%s", organization_id, is_active)


# ==========================================
# Infrastructure Cache — Recommendation Settings
# ==========================================

async def get_cached_settings(connection_id: int) -> Dict[str, Any] | None:
    """
    Get cached recommendation settings by connection ID.

    Returns a dict of visual + URL settings fields, or None if not cached.
    Caller reconstructs a SimpleNamespace from the dict so getattr() works
    in apply_visual_defaults() and get_default_shop_urls().
    """
    key = f"rec_settings:{connection_id}"
    result = await cache.get(key)
    if result is not None:
        logger.debug("Cache HIT — rec_settings connection_id=%s", connection_id)
    else:
        logger.debug("Cache MISS — rec_settings connection_id=%s", connection_id)
    return result


async def set_cached_settings(connection_id: int, settings_dict: Dict[str, Any] | None) -> None:
    """
    Cache recommendation settings by connection ID.

    Stores a dict of visual + URL fields extracted from RecommendationSettings ORM object.
    Stores None (as empty dict sentinel) if no settings exist for this connection.
    """
    key = f"rec_settings:{connection_id}"
    # Use empty dict as sentinel for "settings row exists but is None" (no row in DB)
    data = settings_dict if settings_dict is not None else {"_empty": True}
    await cache.set(key, data, INFRA_CACHE_TTL)
    logger.debug("Cache SET — rec_settings connection_id=%s", connection_id)
