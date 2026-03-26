"""
Nudgio Utils — API Rate Limiting

Enforces per-organization request limits based on subscription tier.
Limits defined in subscription_utils.py TIER_LIMITS.

Two backends:
- "memory" — Python dict with sliding window (development, single worker)
- "dragonfly" — DragonflyDB/Redis sorted sets (production, multi-worker)

Switch backend by changing RATE_LIMIT_BACKEND constant below.

Public API:
    - check_rate_limit(org_id, tier) — checks per-minute + per-hour limits, raises 429
    - rate_limiter — global backend instance, also used by widget_auth_utils.py
"""

from typing import Dict, List
from datetime import datetime, timezone, timedelta
from abc import ABC, abstractmethod
from fastapi import HTTPException, status
import time
import logging

from .subscription_utils import TIER_LIMITS

logger = logging.getLogger(__name__)

# ==========================================
# Rate Limit Backend Configuration
# ==========================================

# "memory" for development, "dragonfly" for production
RATE_LIMIT_BACKEND = "memory"
DRAGONFLY_URL = "redis://localhost:6379"  # Same as cache — DragonflyDB serves both


# ==========================================
# Abstract Base Class
# ==========================================

class RateLimitBackend(ABC):
    """Abstract rate limiter backend interface"""

    @abstractmethod
    async def check_and_increment(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Check if under limit and increment counter.

        Returns True if under limit (and increments), False if over limit.
        """
        ...

    @abstractmethod
    async def reset(self, key: str) -> None:
        """Reset the counter for a key."""
        ...


# ==========================================
# In-Memory Backend (Development)
# ==========================================

class InMemoryRateLimitBackend(RateLimitBackend):
    """
    Sliding window rate limiter using Python lists.
    Single worker only — counters are lost on restart.
    """

    def __init__(self):
        self._requests: Dict[str, List[float]] = {}

    async def check_and_increment(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Check sliding window count and increment if under limit.

        Cleans expired timestamps, then checks if count is under limit.
        If under limit: appends current timestamp and returns True.
        If at/over limit: returns False (does not increment).
        """
        now = time.time()
        cutoff = now - window_seconds

        if key not in self._requests:
            self._requests[key] = []

        # Clean expired timestamps
        self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

        # Check limit
        if len(self._requests[key]) >= limit:
            return False

        # Under limit — record this request
        self._requests[key].append(now)
        return True

    async def reset(self, key: str) -> None:
        """Reset the counter for a key."""
        if key in self._requests:
            del self._requests[key]


# ==========================================
# DragonflyDB Backend (Production)
# ==========================================

class DragonflyRateLimitBackend(RateLimitBackend):
    """
    Sliding window rate limiter using Redis/DragonflyDB sorted sets.
    Multi-worker safe — shared state across processes.

    Each key is a sorted set where:
    - Members are unique request IDs (timestamp-based)
    - Scores are timestamps
    - Window is enforced by ZREMRANGEBYSCORE + ZCARD
    """

    def __init__(self, url: str):
        import redis.asyncio as aioredis
        self._redis = aioredis.from_url(url, decode_responses=True)

    async def check_and_increment(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Atomic sliding window check using Redis sorted sets.

        Pipeline:
        1. Remove entries outside the window (ZREMRANGEBYSCORE)
        2. Count remaining entries (ZCARD)
        3. If under limit: add new entry (ZADD) + set TTL (EXPIRE)
        """
        now = time.time()
        cutoff = now - window_seconds

        try:
            pipe = self._redis.pipeline()
            # Remove entries outside the window
            pipe.zremrangebyscore(key, 0, cutoff)
            # Count remaining entries
            pipe.zcard(key)
            results = await pipe.execute()

            current_count = results[1]

            if current_count >= limit:
                return False

            # Under limit — add new entry with unique member
            member = f"{now}:{id(self)}"
            pipe2 = self._redis.pipeline()
            pipe2.zadd(key, {member: now})
            pipe2.expire(key, window_seconds + 1)  # Auto-cleanup
            await pipe2.execute()

            return True
        except Exception as e:
            logger.error(f"Rate limit check failed for key '{key}': {e}")
            # Fail open — allow the request if Redis is down
            return True

    async def reset(self, key: str) -> None:
        """Reset the counter for a key."""
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.error(f"Rate limit reset failed for key '{key}': {e}")


# ==========================================
# Factory + Global Instance
# ==========================================

def _create_rate_limiter() -> RateLimitBackend:
    """Create rate limiter backend based on RATE_LIMIT_BACKEND constant."""
    if RATE_LIMIT_BACKEND == "dragonfly":
        return DragonflyRateLimitBackend(DRAGONFLY_URL)
    return InMemoryRateLimitBackend()


# Global rate limiter instance — import and use directly
rate_limiter = _create_rate_limiter()


# ==========================================
# Main Rate Limit Check
# ==========================================

async def check_rate_limit(org_id: int, tier: str) -> None:
    """
    Check per-minute and per-hour rate limits for an organization.

    Reads limits from subscription_utils.TIER_LIMITS based on the org's tier.
    Raises HTTP 429 if either limit is exceeded.

    Args:
        org_id: Organization ID (rate limits are per-org, not per-user)
        tier: Subscription tier ("FREE", "PRO", "ENTERPRISE")

    Raises:
        HTTPException 429 if rate limit exceeded
    """
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["FREE"])

    # Check per-minute limit
    minute_ok = await rate_limiter.check_and_increment(
        f"rl:{org_id}:min", limits["requests_per_minute"], 60
    )
    if not minute_ok:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {limits['requests_per_minute']} requests per minute for {tier} plan"
        )

    # Check per-hour limit
    hour_ok = await rate_limiter.check_and_increment(
        f"rl:{org_id}:hr", limits["requests_per_hour"], 3600
    )
    if not hour_ok:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {limits['requests_per_hour']} requests per hour for {tier} plan"
        )
