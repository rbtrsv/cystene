"""
SurrealDB connection management for Nexotype.
Provides async client initialization, FastAPI dependency, and context manager.
"""
from surrealdb import AsyncSurreal
from contextlib import asynccontextmanager
from typing import Any, Optional
import os

# SurrealDB settings from environment
SURREAL_URL = os.getenv("SURREAL_URL", "ws://devops.finpy.tech:8001/rpc")
SURREAL_NAMESPACE = os.getenv("SURREAL_NAMESPACE", "nexotype")
SURREAL_DATABASE = os.getenv("SURREAL_DATABASE", "nexotype")
SURREAL_USERNAME = os.getenv("SURREAL_USERNAME", "root")
SURREAL_PASSWORD = os.getenv("SURREAL_PASSWORD", "123890pas")

# Global connection (lazy initialized)
_surreal_client: Optional[Any] = None


async def get_surreal() -> Any:
    """
    Get SurrealDB async client (FastAPI dependency).

    Returns:
        Any: A connected SurrealDB client instance
    """
    global _surreal_client
    if _surreal_client is None:
        _surreal_client = AsyncSurreal(SURREAL_URL)
        await _surreal_client.use(namespace=SURREAL_NAMESPACE, database=SURREAL_DATABASE)
        await _surreal_client.signin({"username": SURREAL_USERNAME, "password": SURREAL_PASSWORD})
    return _surreal_client


async def close_surreal():
    """Close SurrealDB connection"""
    global _surreal_client
    if _surreal_client is not None:
        await _surreal_client.close()
        _surreal_client = None


@asynccontextmanager
async def surreal_session():
    """
    Context manager for SurrealDB session.

    Yields:
        Any: A connected SurrealDB client instance
    """
    db = await get_surreal()
    try:
        yield db
    finally:
        pass  # Connection pooled, don't close
