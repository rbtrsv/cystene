"""
Rate Limiter Utils

Simple in-memory rate limiter for assetmanager endpoints.
Flat limit per user — no subscription tiers.
"""

from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status


class SimpleRateLimiter:
    """In-memory rate limiter keyed by user_id + endpoint."""

    def __init__(self):
        self._requests: dict[str, list[datetime]] = {}

    def check(self, user_id: int, endpoint: str, max_requests: int = 5, window_seconds: int = 60) -> None:
        """
        Check if user has exceeded rate limit for a specific endpoint.
        Raises 429 if exceeded.
        """
        key = f"{user_id}:{endpoint}"
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=window_seconds)

        # Clean old requests
        if key in self._requests:
            self._requests[key] = [t for t in self._requests[key] if t > cutoff]
        else:
            self._requests[key] = []

        # Check limit
        if len(self._requests[key]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds"
            )

        # Record request
        self._requests[key].append(now)


# Global instance
rate_limiter = SimpleRateLimiter()
