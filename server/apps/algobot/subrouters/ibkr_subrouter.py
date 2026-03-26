"""
IBKR Bot Subrouter
FastAPI endpoints for managing the modular IBKR trading bot

NOTE: NEVER make API calls from this subrouter. ONLY use cached data from the bot.
The bot orchestrator handles ALL API calls and caches the data for web interface use.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.templating import Jinja2Templates
import asyncio
import json
from datetime import datetime
from typing import Optional
import logging

from ..ibkr_bot import IBKRBot

# Setup
router = APIRouter(prefix="/ibkr", tags=["IBKR Bot"])
templates = Jinja2Templates(directory="apps/algobot/templates")

# Global bot state
ibkr_connected_clients = []
logger = logging.getLogger(__name__)

class IBKRBotManager:
    def __init__(self):
        self.bot: Optional[IBKRBot] = None
        self.task: Optional[asyncio.Task] = None
        self.running = False
        self.logs = []
        self.max_logs = 100

    def add_log(self, message: str, log_type: str = "info"):
        """Add log message and broadcast to clients"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "message": message,
            "type": log_type
        }
        self.logs.append(log_entry)

        # Keep only last 100 logs
        if len(self.logs) > self.max_logs:
            self.logs = self.logs[-self.max_logs:]

        # Broadcast to all connected clients
        asyncio.create_task(self.broadcast_log(log_entry))

    async def broadcast_log(self, log_entry):
        """Send log to all connected WebSocket clients"""
        disconnected = []
        for client in ibkr_connected_clients:
            try:
                await client.send_text(json.dumps(log_entry))
            except:
                disconnected.append(client)

        # Remove disconnected clients
        for client in disconnected:
            if client in ibkr_connected_clients:
                ibkr_connected_clients.remove(client)

    async def run_bot(self):
        """Run the modular IBKR bot using the orchestrator"""
        try:
            self.bot = IBKRBot()
            self.running = True

            self.add_log(f"🤖 IBKR Bot Started - Using Orchestrator")
            self.add_log(f"📈 Strategy: Price < VWAP AND Stock RSI < Index RSI - 5")
            self.add_log(f"📊 Trading tickers: {', '.join([config['display'] for config in self.bot.TICKERS.values()])}")
            self.add_log("🔑 Using REAL IBKR trading account!")
            self.add_log("⚠️  REAL MONEY MODE - This will trade with actual funds!")
            self.bot._web_log = self.add_log
        except Exception as e:
            self.add_log(f"❌ Failed to start IBKR bot: {e}", "error")
            self.running = False
            return

        try:
            await self.bot.orchestrator()

        except asyncio.CancelledError:
            self.add_log("🛑 IBKR bot stopped by user")
            self.running = False
        except Exception as e:
            self.add_log(f"❌ Bot error: {e}", "error")
            self.running = False

    def stop_bot(self):
        """Stop the IBKR bot"""
        if self.task:
            self.task.cancel()
            self.running = False
            self.add_log("🛑 IBKR bot stopping...")

    def get_status(self):
        """Get current bot status - use actual bot data"""
        try:
            if not self.bot or not self.running:
                return {
                    "running": False,
                    "tickers": {},
                    "total_trades": 0,
                    "total_profit": 0,
                    "account_balance": 0.0,
                    "portfolio_value": 0.0,
                    "ib_connected": False
                }

            # Get cached data from bot - NO API CALLS
            ticker_status = {}
            for ticker in self.bot.TICKERS.keys():
                ticker_info = self.bot.TICKERS[ticker]

                # Get position from bot's positions dict - NO API CALL
                positions = self.bot.positions.get(ticker, None)
                position_quantity = positions.get('quantity', 0) if positions else 0

                # Get current price from bot's cache - NO API CALL
                current_price = self.bot.current_prices.get(ticker, 0)

                ticker_status[ticker] = {
                    "position": position_quantity,
                    "current_price": current_price,
                    "name": ticker_info["name"],
                    "display": ticker_info["display"],
                    "max_order": ticker_info["max_order"],
                    "index_symbol": ticker_info.get("index_symbol", "")
                }

            # Get portfolio value from bot (NetLiquidation from IBKR)
            account_balance = self.bot.account_balance
            portfolio_value = self.bot.portfolio_value

            return {
                "running": self.running,
                "tickers": ticker_status,
                "account_balance": account_balance,
                "portfolio_value": portfolio_value,
                "ib_connected": self.bot.connected
            }

        except Exception as e:
            logger.error(f"Error in get_status: {e}")
            return {
                "running": self.running,
                "tickers": {},
                "account_balance": 0.0,
                "portfolio_value": 0.0,
                "ib_connected": False
            }

# Global bot manager
ibkr_bot_manager = IBKRBotManager()

# ==========================================
# Web Page
# ==========================================

@router.get("/")
async def ibkr_page(request: Request):
    """IBKR bot dashboard page"""
    return templates.TemplateResponse("ibkr.html", {"request": request})

# ==========================================
# Bot Control Endpoints
# ==========================================

@router.post("/start")
async def start_ibkr_bot():
    """Start the IBKR trading bot"""
    global ibkr_bot_manager

    if ibkr_bot_manager.running:
        return {"success": False, "message": "IBKR bot is already running"}

    try:
        ibkr_bot_manager.task = asyncio.create_task(ibkr_bot_manager.run_bot())
        return {"success": True, "message": "IBKR bot started successfully"}
    except Exception as e:
        return {"success": False, "message": f"Failed to start IBKR bot: {e}"}

@router.post("/stop")
async def stop_ibkr_bot():
    """Stop the IBKR trading bot"""
    global ibkr_bot_manager

    if not ibkr_bot_manager.running:
        return {"success": False, "message": "IBKR bot is not running"}

    ibkr_bot_manager.stop_bot()
    return {"success": True, "message": "IBKR bot stopped successfully"}

@router.get("/status")
async def get_ibkr_status():
    """Get IBKR bot status"""
    return ibkr_bot_manager.get_status()

@router.get("/logs")
async def get_ibkr_logs():
    """Get recent IBKR bot logs"""
    return {"logs": ibkr_bot_manager.logs}

# ==========================================
# WebSocket for Real-time Updates
# ==========================================

@router.websocket("/ws")
async def ibkr_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time IBKR bot updates"""
    await websocket.accept()
    ibkr_connected_clients.append(websocket)

    # Send recent logs to new client
    for log_entry in ibkr_bot_manager.logs[-10:]:  # Last 10 logs
        try:
            await websocket.send_text(json.dumps(log_entry))
        except:
            break

    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        if websocket in ibkr_connected_clients:
            ibkr_connected_clients.remove(websocket)