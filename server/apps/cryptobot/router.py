"""
Crypto Bot App Router
Main router that includes crypto bot strategies:
- Kraken Modular Bot (Support/Resistance strategy)
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import APIRouter

from .subrouters.kraken_subrouter import router as kraken_subrouter, kraken_bot_manager

@asynccontextmanager
async def lifespan(app):
    """Lifespan event handler for auto-starting crypto bots"""
    # Startup

    # Auto-start Kraken bot
    kraken_bot_manager.task = asyncio.create_task(kraken_bot_manager.run_bot())

    yield

    # Shutdown
    if kraken_bot_manager.running:
        kraken_bot_manager.stop_bot()

# Main cryptobot app router with lifespan
router = APIRouter(lifespan=lifespan)

# Include modular bot subrouter
router.include_router(kraken_subrouter)  # /kraken endpoints (modular support/resistance bot)