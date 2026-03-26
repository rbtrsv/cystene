"""
Kraken Bot Subrouter
FastAPI endpoints for managing the modular Kraken crypto trading bot

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

from ..kraken_bot import KrakenBot

# Setup
router = APIRouter(prefix="/kraken", tags=["Kraken Bot"])
templates = Jinja2Templates(directory="apps/cryptobot/templates")

# Global bot state
kraken_connected_clients = []
logger = logging.getLogger(__name__)

class KrakenBotManager:
    def __init__(self):
        self.bot: Optional[KrakenBot] = None
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
        for client in kraken_connected_clients:
            try:
                await client.send_text(json.dumps(log_entry))
            except:
                disconnected.append(client)

        # Remove disconnected clients
        for client in disconnected:
            if client in kraken_connected_clients:
                kraken_connected_clients.remove(client)

    async def run_bot(self):
        """Run the modular Kraken bot using the orchestrator"""
        try:
            self.bot = KrakenBot()
            self.running = True

            self.add_log(f"🤖 Kraken Bot Started - Using Orchestrator")
            self.add_log(f"📈 Strategy: Support/Resistance at 2.0% range")
            self.add_log(f"📊 Trading pairs: {', '.join([config['display'] for config in self.bot.TICKERS.values()])}")
            self.add_log("🔑 Using REAL Kraken trading account!")
            self.add_log("⚠️  REAL MONEY MODE - This will trade with actual funds!")

            # Connect web logging to bot - this makes bot.log() send to web interface
            self.bot._web_log = self.add_log
        except Exception as e:
            self.add_log(f"❌ Failed to start Kraken bot: {e}", "error")
            self.running = False
            return

        try:
            # Run the orchestrator - will use bot.log() for output
            await self.bot.orchestrator()

        except asyncio.CancelledError:
            self.add_log("🛑 Kraken bot stopped by user")
            self.running = False
        except Exception as e:
            self.add_log(f"❌ Bot error: {e}", "error")
            self.running = False

    def stop_bot(self):
        """Stop the Kraken bot"""
        if self.task:
            self.task.cancel()
            self.running = False
            self.add_log("🛑 Kraken bot stopping...")

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
                    "ws_connected": False
                }

            # Get cached data from bot - NO API CALLS
            ticker_status = {}
            for ticker in self.bot.TICKERS.keys():
                ticker_info = self.bot.TICKERS[ticker]

                # Get position quantity from balance (cached in bot)
                # Note: entry_prices dict only stores buy_price, not quantity
                position = self.bot.entry_prices.get(ticker, None)

                # Get quantity from cached balance (no API call)
                asset = ticker_info['asset']
                position_quantity = float(self.bot.cached_balance.get(asset, 0)) if position else 0

                # Get real-time data from orchestrator cache
                current_price = self.bot.current_prices.get(ticker, 0)
                book_imbalance = self.bot.book_imbalances.get(ticker, None)
                flow_imbalance = self.bot.flow_imbalances.get(ticker, None)
                support_2pct = self.bot.support_levels.get(ticker, {}).get("2.0%", 0)
                resistance_2pct = self.bot.resistance_levels.get(ticker, {}).get("2.0%", 0)
                position_value = position_quantity * current_price if current_price and position_quantity else 0

                ticker_status[ticker] = {
                    "position": position_quantity,
                    "current_price": current_price,
                    "position_value": position_value,
                    "book_imbalance": book_imbalance,
                    "flow_imbalance": flow_imbalance,
                    "support_2pct": support_2pct,
                    "resistance_2pct": resistance_2pct,
                    "name": ticker_info["name"],
                    "display": ticker_info["display"],
                    "max_order": ticker_info["max_order"]
                }

            # Calculate total portfolio value
            eur_balance = float(self.bot.cached_balance.get('ZEUR', 0))
            total_portfolio_value = eur_balance
            for ticker_data in ticker_status.values():
                total_portfolio_value += ticker_data["position_value"]

            return {
                "running": self.running,
                "tickers": ticker_status,
                "total_trades": 0,
                "total_profit": 0,
                "account_balance": eur_balance,
                "portfolio_value": total_portfolio_value,
                "ws_connected": self.bot.ws_connected
            }

        except Exception as e:
            logger.error(f"Error in get_status: {e}")
            return {
                "running": self.running,
                "tickers": {},
                "total_trades": 0,
                "total_profit": 0,
                "account_balance": 0.0,
                "portfolio_value": 0.0,
                "ws_connected": False
            }

# Global bot manager
kraken_bot_manager = KrakenBotManager()

# ==========================================
# Web Page
# ==========================================

@router.get("/")
async def kraken_page(request: Request):
    """Kraken bot dashboard page"""
    return templates.TemplateResponse("kraken.html", {"request": request})

# ==========================================
# Bot Control Endpoints
# ==========================================

@router.post("/start")
async def start_kraken_bot():
    """Start the Kraken trading bot"""
    global kraken_bot_manager

    if kraken_bot_manager.running:
        return {"success": False, "message": "Kraken bot is already running"}

    try:
        kraken_bot_manager.task = asyncio.create_task(kraken_bot_manager.run_bot())
        return {"success": True, "message": "Kraken bot started successfully"}
    except Exception as e:
        return {"success": False, "message": f"Failed to start Kraken bot: {e}"}

@router.post("/stop")
async def stop_kraken_bot():
    """Stop the Kraken trading bot"""
    global kraken_bot_manager

    if not kraken_bot_manager.running:
        return {"success": False, "message": "Kraken bot is not running"}

    kraken_bot_manager.stop_bot()
    return {"success": True, "message": "Kraken bot stopped successfully"}

@router.get("/status")
async def get_kraken_status():
    """Get Kraken bot status"""
    return kraken_bot_manager.get_status()

@router.get("/logs")
async def get_kraken_logs():
    """Get recent Kraken bot logs"""
    return {"logs": kraken_bot_manager.logs}

# ==========================================
# WebSocket for Real-time Updates
# ==========================================

@router.websocket("/ws")
async def kraken_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time Kraken bot updates"""
    await websocket.accept()
    kraken_connected_clients.append(websocket)

    # Send recent logs to new client
    for log_entry in kraken_bot_manager.logs[-10:]:  # Last 10 logs
        try:
            await websocket.send_text(json.dumps(log_entry))
        except:
            break

    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        if websocket in kraken_connected_clients:
            kraken_connected_clients.remove(websocket)