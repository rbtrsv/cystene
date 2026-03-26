"""
Algo Bot App Router
Main router that includes algorithmic trading bot strategies:
- IBKR Bot (VWAP & RSI strategy)
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import APIRouter

from .subrouters.ibkr_subrouter import router as ibkr_subrouter, ibkr_bot_manager

@asynccontextmanager
async def lifespan(app):
    """Lifespan event handler for auto-starting algo bots"""
    # Startup

    # Auto-start IBKR bot
    ibkr_bot_manager.task = asyncio.create_task(ibkr_bot_manager.run_bot())

    yield

    # Shutdown
    if ibkr_bot_manager.running:
        ibkr_bot_manager.stop_bot()

# Main algobot app router with lifespan
router = APIRouter(lifespan=lifespan)

# Include modular bot subrouter
router.include_router(ibkr_subrouter)  # /ibkr endpoints (VWAP & RSI stock trading bot)