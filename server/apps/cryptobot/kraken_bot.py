#!/usr/bin/env python3
"""
Kraken Bot
"""

import requests
import time
import hashlib
import hmac
import base64
import json
import asyncio
import websockets
import math
from typing import Dict
from datetime import datetime
from decimal import Decimal


class KrakenBot:
    def __init__(self):
        # Web logging function - set by subrouter
        self._web_log = None

        # Tickers Configuration
        # IMPORTANT: Each field serves a different Kraken API:
        # - Ticker Key: Used for closed orders API (order history matching)
        # - 'name': Human readable name (display only)
        # - 'display': WebSocket symbol format (for real-time data streams)
        # - 'max_order': Trading limits in EUR (risk management)
        # - 'asset': Balance API key (MUST match what Balance API actually returns)
        # - 'kraken_pair': Trading API pair (place orders, get prices)
        #
        # CRITICAL NOTE ON ASSET NAMES:
        # Kraken Balance API returns DIFFERENT asset names than you might expect:
        # - Bitcoin: 'XXBT' (NOT 'XBT' or 'BTC' or 'XBT.F')
        # - Ethereum: 'XETH' (NOT 'ETH' or 'ETH.F')
        # - Solana: 'SOL' (NOT 'SOL.F' - only if staked)
        # - Litecoin: 'XLTC' (NOT 'LTC')
        #
        # The .F suffix (e.g. 'SOL.F', 'ETH.F', 'XBT.F') is ONLY used when assets
        # are enrolled in Kraken's auto-staking/rewards program (Flex).
        #
        # REGULAR SPOT (no staking): 'SOL', 'XETH', 'XXBT'
        # WITH STAKING ENABLED: 'SOL.F', 'ETH.F', 'XBT.F'
        #
        # If you enable staking rewards, you MUST update the asset names to use .F suffix.
        # For regular spot holdings, use the base asset name that the API returns.
        # Always verify with Balance API response, never assume!
        self.TICKERS = {
            'XBTEUR': {
                'name': 'Bitcoin',
                'display': 'BTC/EUR',
                'max_order': 80,   # Maximum €80 order (40% allocation)
                'asset': 'XXBT',   # Balance API asset name (verified from API response)
                'kraken_pair': 'XXBTZEUR'  # Trading API pair name
            },
            'ETHEUR': {
                'name': 'Ethereum',
                'display': 'ETH/EUR',
                'max_order': 40,   # Maximum €40 order (20% allocation)
                'asset': 'XETH',   # Balance API asset name (verified from API response)
                'kraken_pair': 'XETHZEUR'  # Trading API pair name
            },
            'SOLEUR': {
                'name': 'Solana',
                'display': 'SOL/EUR',
                'max_order': 20,   # Maximum €20 order (10% allocation)
                'asset': 'SOL',    # Balance API asset name (verified from API response)
                'kraken_pair': 'SOLEUR'    # Trading API pair name
            },
            'AAVEEUR': {
                'name': 'Aave',
                'display': 'AAVE/EUR',
                'max_order': 20,   # Maximum €20 order (10% allocation)
                'asset': 'AAVE',   # Balance API asset name (verified from API response)
                'kraken_pair': 'AAVEEUR'   # Price API pair name
            },
            'LINKEUR': {
                'name': 'Chainlink',
                'display': 'LINK/EUR',
                'max_order': 20,   # Maximum €20 order (10% allocation)
                'asset': 'LINK',   # Balance API asset name (verified from API response)
                'kraken_pair': 'LINKEUR'   # Price API pair name
            },
            'LTCEUR': {
                'name': 'Litecoin',
                'display': 'LTC/EUR',
                'max_order': 20,   # Maximum €20 order (10% allocation)
                'asset': 'XLTC',   # Balance API asset name (verified from API response)
                'kraken_pair': 'XLTCZEUR'  # Price API pair name
            }
        }

        # API Configuration
        self.API_KEY = "nUc/IeNUxiTELVz3sP/HObGia0tBkP4WEJkqPN+NsBnVYfZaD0uuYjaf"
        self.PRIVATE_KEY = "9G0nDPkq+wo7mKtycfjW6RNHLpPeq316lskyxTlPQPTZHSWtQIO9gf6udc0bpWGNBI5E5rZXXx4cCUo3k8PvrQ=="
        self.BASE_URL = "https://api.kraken.com"
        self.RATE_LIMIT_DELAY = 1.1  # Slightly over 1 second to be safe (rate limiting protection)

        # WebSocket Configuration
        self.WS_URL = "wss://ws.kraken.com/v2"
        self.ws = None
        self.ws_connected = False

        # Account & Position Data (cached from API, updated every minute)
        # IMPORTANT: Caches are synced every 60s to avoid rate limits
        # - cached_balance: Available EUR + crypto balances (balance - hold_trade)
        # - entry_prices: Entry prices only (quantity comes from live balance)
        # - open_orders: Prevents duplicate orders between balance syncs
        self.cached_balance = {}  # Full account balance (all assets + EUR)
        self.entry_prices = {ticker: None for ticker in self.TICKERS.keys()}  # Initialize with None for all tickers
        self.open_orders = {}  # Cached open orders

        # Market Data (real-time from WebSocket)
        self.order_books = {}  # Level 2 order book data
        self.order_flow = {}  # Recent trades for flow analysis
        self.current_prices = {}  # ticker -> current price

        # Calculated Indicators (updated in real-time)
        self.book_imbalances = {}  # ticker -> book imbalance value
        self.flow_imbalances = {}  # ticker -> flow imbalance value
        self.support_levels = {}  # ticker -> support levels dict
        self.resistance_levels = {}  # ticker -> resistance levels dict

        # WebSocket pair mapping (generate from TICKERS to avoid duplicates)
        self.ws_pair_mapping = {k: v['display'] for k, v in self.TICKERS.items()}
        self.ws_to_rest_mapping = {v: k for k, v in self.ws_pair_mapping.items()}

        # Order Book Configuration
        self.WS_BOOK_DEPTH = 1000  # WebSocket order book subscription depth
        self.IMBALANCE_LEVELS = 1000  # Order book levels used in imbalance calculation

        # Order Flow Configuration
        self.FLOW_ANALYSIS_WINDOWS = {
            'scalp': 300,      # 5 minutes
            'swing': 14400,    # 4 hours
            'position': 86400, # 24 hours
            'trend': 604800    # 7 days
        }
        self.FLOW_TIME_WINDOW = self.FLOW_ANALYSIS_WINDOWS['swing']  # Current: 4 hours

        # Trading Constants (no magic numbers!)
        self.MIN_ORDER_SIZE_EUR = 10.0  # Kraken minimum order size
        self.ORDER_AGE_CANCEL_SEC = 900  # Cancel orders older than 15 minutes
        self.TARGET_PROFIT_PCT = 1.6  # Target profit: 1.5% + 0.1% buffer
        self.MIN_BOOK_IMBALANCE = 1.2  # Minimum book imbalance for buy signal (20% more bid pressure)
        self.MIN_FLOW_IMBALANCE = 1.3  # Minimum flow imbalance for buy signal (30% more buys than sells)

        # Update frequencies (all in seconds)
        self.MAIN_LOOP_INTERVAL = 30        # Main loop sleep - how often to check market conditions
        self.BALANCE_UPDATE_INTERVAL = 60   # How often to sync balance/positions

    # ==========================================
    # LOGGING
    # ==========================================
    def log(self, message: str):
        """Smart logging - web interface if available, console otherwise"""
        if self._web_log:
            # Running via web interface - send to web
            self._web_log(message)
        else:
            # Running directly - print to console
            print(message)

    # ==========================================
    # REST API FUNCTIONS
    # ==========================================

    # Authentication & Signing
    # =========================
    def _get_kraken_signature(self, uri_path: str, json_body: str, nonce: str) -> str:
        """Generate Kraken API signature"""
        message = uri_path.encode() + hashlib.sha256((nonce + json_body).encode()).digest()
        mac = hmac.new(base64.b64decode(self.PRIVATE_KEY), message, hashlib.sha512)
        sigdigest = base64.b64encode(mac.digest())
        return sigdigest.decode()

    def _kraken_request(self, uri_path: str, data: Dict) -> Dict:
        """Make authenticated request to Kraken"""
        nonce = str(int(time.time() * 1000))
        data['nonce'] = int(nonce)

        json_body = json.dumps(data)

        headers = {
            'API-Key': self.API_KEY,
            'API-Sign': self._get_kraken_signature(uri_path, json_body, nonce),
            'Content-Type': 'application/json'
        }

        url = f"{self.BASE_URL}{uri_path}"
        response = requests.post(url, headers=headers, data=json_body, timeout=10)

        if response.status_code != 200:
            raise Exception(f"Kraken API error: {response.status_code}")

        result = response.json()
        if result.get('error'):
            raise Exception(f"Kraken API error: {result['error']}")

        return result['result']

    # Account Data
    # ============
    def get_account_balance(self) -> Dict:
        """Get account balance from Kraken (SPOT ONLY - what you own right now)"""
        result = self._kraken_request('/0/private/Balance', {})
        return result

    def get_extended_balance(self) -> Dict:
        """Get extended account balance with available amounts from Kraken (SPOT ONLY)

        Shows: balance, hold_trade (locked in open orders)
        Available = balance - hold_trade
        """
        result = self._kraken_request('/0/private/BalanceEx', {})
        return result

    def get_open_orders(self) -> Dict:
        """Get all open orders from Kraken (SPOT ONLY - orders waiting to fill)"""
        result = self._kraken_request('/0/private/OpenOrders', {})
        return result

    def get_closed_orders(self, start=None, end=None, ofs=None, trades=True) -> Dict:
        """Get closed orders from Kraken (SPOT ONLY - order history)

        Best method for finding exact entry prices from past trades
        """
        data = {
            'trades': trades  # Include trade info for more details
        }
        if start:
            data['start'] = start
        if end:
            data['end'] = end
        if ofs:
            data['ofs'] = ofs
        return self._kraken_request('/0/private/ClosedOrders', data)

    # Market Data
    # ===========
    def get_current_ticker_price(self, ticker: str) -> float:
        """Get Ticker Information"""
        kraken_pair = self.TICKERS[ticker]['kraken_pair']
        url = f"{self.BASE_URL}/0/public/Ticker"
        params = {'pair': kraken_pair}

        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            raise Exception(f"HTTP {response.status_code}: {response.text}")

        data = response.json()

        if data.get('error'):
            raise Exception(f"Kraken API error: {data['error']}")

        result = data.get('result', {})

        if kraken_pair in result:
            price_data = result[kraken_pair].get('c', [None])
            if price_data and len(price_data) > 0:
                return float(price_data[0])

        raise Exception(f"No price data found for {kraken_pair}")

    # Trading Functions
    # =================
    def place_buy_order(self, pair: str, eur_amount: float, current_price: float) -> dict:
        """Place a limit buy order on Kraken (maker order for lower fees)
        Using limit orders at slightly above market to get instant fills with maker fees (0.16% vs 0.26%)"""

        # BTC precision: 1 decimal (pair is 'XXBTZEUR' from kraken_pair config)
        if 'XBT' in pair:
            current_price_decimal = Decimal(str(current_price)).quantize(Decimal('0.1'))
        else:
            current_price_decimal = Decimal(str(current_price)).quantize(Decimal('0.01'))

        # Set limit price 0.01% above current price for instant fill with maker fees
        limit_price = current_price_decimal * Decimal('1.0001')

        # Calculate crypto quantity from EUR amount
        crypto_quantity = Decimal(str(eur_amount)) / limit_price

        data = {
            'pair': pair,
            'type': 'buy',
            'ordertype': 'limit',
            'price': f"{limit_price.quantize(Decimal('0.1') if 'XBT' in pair else Decimal('0.01'))}",
            'volume': f"{crypto_quantity.quantize(Decimal('0.00000001'))}"
        }

        return self._kraken_request('/0/private/AddOrder', data)

    def place_sell_order(self, pair: str, volume: float, current_price: float) -> dict:
        """Place a limit sell order on Kraken (maker order for lower fees)
        Using limit orders at slightly below market to get instant fills with maker fees (0.16% vs 0.26%)"""
        # BTC precision: 1 decimal (pair is 'XXBTZEUR' from kraken_pair config)
        limit_price = Decimal(str(current_price)) * Decimal('0.9999')

        data = {
            'pair': pair,
            'type': 'sell',
            'ordertype': 'limit',
            'price': f"{limit_price.quantize(Decimal('0.1') if 'XBT' in pair else Decimal('0.01'))}",
            'volume': str(volume)
        }

        return self._kraken_request('/0/private/AddOrder', data)

    def query_order_status(self, order_id: str) -> dict:
        """Get detailed order status using Kraken API

        Returns dict with:
        - filled: bool - whether order fully executed
        - vol_exec: str - actual filled quantity
        - cost: str - total cost in EUR
        - price: str - average execution price
        """
        # Special case for positions loaded from closed orders at startup
        if order_id == 'closed_orders' or order_id == 'filled':
            return {'filled': True, 'vol_exec': '0', 'cost': '0', 'price': '0'}

        try:
            data = {'txid': order_id, 'trades': True}
            result = self._kraken_request('/0/private/QueryOrders', data)
            order_info = result.get(order_id, {})

            status = order_info.get('status')
            vol_exec = order_info.get('vol_exec', '0')
            cost = order_info.get('cost', '0')
            price = order_info.get('price', '0')

            # Status 'closed' means fully executed
            return {
                'filled': status == 'closed',
                'vol_exec': vol_exec,
                'cost': cost,
                'price': price
            }
        except Exception as e:
            print(f"⚠️ Could not query order {order_id}: {e}")
            return {'filled': False, 'vol_exec': '0', 'cost': '0', 'price': '0'}

    def cancel_order(self, order_id: str) -> dict:
        """Cancel an open order"""
        data = {'txid': order_id}
        return self._kraken_request('/0/private/CancelOrder', data)

    def execute_buy(self, ticker: str, current_price: float) -> tuple:
        """Execute buy order for specific ticker - sync_positions() will detect fill and set entry price"""
        try:
            # Check if we already have a position
            if self.entry_prices[ticker] is not None:
                return False, f"Already have position in {ticker}"

            # Use cached balance (no API call needed)
            eur_balance = float(self.cached_balance.get('ZEUR', 0))

            # Execute the buy order
            config = self.TICKERS[ticker]
            eur_amount = config['max_order']

            # Check if we have enough EUR balance
            if eur_balance < self.MIN_ORDER_SIZE_EUR:
                return False, f"Insufficient EUR balance: €{eur_balance:.2f} < €{self.MIN_ORDER_SIZE_EUR} minimum"

            # Use smaller of: max order OR available balance
            eur_amount = min(eur_amount, eur_balance)
            kraken_pair = self.TICKERS[ticker]['kraken_pair']

            order_result = self.place_buy_order(kraken_pair, eur_amount, current_price)
            order_id = order_result['txid'][0]

            return True, f"Order {order_id}"

        except Exception as e:
            return False, f"Buy failed for {ticker}: {e}"

    def execute_sell(self, ticker: str, current_price: float) -> tuple:
        """Execute sell order for specific ticker with validation

        Gets quantity from live Balance API (not from self.entry_prices)
        """
        # Check if we have a position to sell
        if self.entry_prices[ticker] is None:
            return False, f"No position to sell for {ticker}"

        try:
            # Get current balance from cache (updated every minute, no API call)
            asset = self.TICKERS[ticker]['asset']
            volume = float(self.cached_balance.get(asset, 0))

            # Verify we actually have something to sell
            if volume < 0.00001:
                return False, f"No {asset} balance to sell (balance: {volume})"

            # Calculate EUR value to check minimum order size
            eur_value = volume * current_price

            if eur_value < self.MIN_ORDER_SIZE_EUR:
                return False, f"Order size €{eur_value:.2f} below €{self.MIN_ORDER_SIZE_EUR} minimum"

            # Execute the sell order
            kraken_pair = self.TICKERS[ticker]['kraken_pair']

            order_result = self.place_sell_order(kraken_pair, volume, current_price)
            order_id = order_result['txid'][0]

            return True, f"Order {order_id}"

        except Exception as e:
            return False, f"Sell failed for {ticker}: {e}"

    # Composed Functions
    # ==================
    def sync_positions(self):
        """Sync positions from Balance API - checks balance and finds entry prices from closed orders

        IMPORTANT: Balance check comes FIRST, then entry price lookup:
        - If balance > 0: Find entry price from newest closed buy order
        - If balance = 0: Set entry_price = None (ignores old closed orders)

        This ensures unfilled limit orders don't use stale entry prices from previous trades.
        """
        balance = self.get_account_balance()
        self.cached_balance = balance

        # Update EUR balance with available amount
        try:
            extended_balance = self.get_extended_balance()
            eur_data = extended_balance.get('ZEUR', extended_balance.get('EUR', {}))
            if isinstance(eur_data, dict):
                eur_balance = float(eur_data.get('balance', 0))
                eur_hold_trade = float(eur_data.get('hold_trade', 0))
                eur_available = eur_balance - eur_hold_trade
                self.cached_balance['ZEUR'] = str(eur_available)
        except Exception as e:
            self.log(f"⚠️ Could not get extended balance: {e}")

        # Get closed orders once for all tickers
        # NOTE: Kraken returns closed orders in DESCENDING chronological order (newest first)
        # This ensures we always pick the most recent entry price, not old positions
        try:
            closed_orders_data = self.get_closed_orders()
            closed_orders = closed_orders_data.get('closed', {})
        except Exception as e:
            self.log(f"⚠️ Could not get closed orders: {e}")
            closed_orders = {}

        # Sync each ticker
        for ticker in self.TICKERS.keys():
            asset = self.TICKERS[ticker]['asset']
            amount = float(balance.get(asset, 0))

            # ONLY lookup entry price if we actually have crypto balance
            # This prevents using stale entry prices when:
            # 1. Limit order placed but not filled yet (balance = 0)
            # 2. Position was sold (balance = 0)
            if amount > 0.00001:
                current_price = self.get_current_ticker_price(ticker)
                eur_value = amount * current_price

                # Ignore dust
                if eur_value >= self.MIN_ORDER_SIZE_EUR:
                    # Find entry price from most recent buy in closed orders
                    # Loop through closed_orders dict (Kraken returns newest first)
                    # Break on first buy match = newest buy order = correct entry price
                    entry_price = None
                    for _, order in closed_orders.items():
                        if order.get('descr', {}).get('pair') == ticker and order.get('descr', {}).get('type') == 'buy':
                            volume = float(order.get('vol_exec', 0))
                            cost = float(order.get('cost', 0))
                            if volume > 0 and cost > 0:
                                entry_price = cost / volume
                                break  # Stop at first buy = newest buy

                    if self.entry_prices[ticker] is None:
                        # New position
                        self.entry_prices[ticker] = {'buy_price': entry_price}
                        if entry_price:
                            self.log(f"✅ Position detected: {self.TICKERS[ticker]['display']} at €{entry_price:.2f}")
                        else:
                            self.log(f"⚠️ Position detected but no entry found: {self.TICKERS[ticker]['display']}")
                    else:
                        # Update entry if we didn't have it
                        if self.entry_prices[ticker]['buy_price'] is None and entry_price:
                            self.entry_prices[ticker]['buy_price'] = entry_price
                            self.log(f"✅ Entry price found: {self.TICKERS[ticker]['display']} at €{entry_price:.2f}")
                else:
                    # Dust - balance too small to trade
                    if self.entry_prices[ticker] is not None:
                        self.log(f"⚠️ Position became dust: {self.TICKERS[ticker]['display']}")
                    self.entry_prices[ticker] = None
            else:
                # No balance - either position sold OR limit order not filled yet
                # Setting entry_price = None ensures we don't use stale prices from old trades
                if self.entry_prices[ticker] is not None:
                    self.log(f"✅ Position cleared: {self.TICKERS[ticker]['display']}")
                self.entry_prices[ticker] = None

    # ==========================================
    # WEBSOCKET FUNCTIONS
    # ==========================================

    # Real-time Price from Order Book
    # ================================
    def get_current_price(self, ticker: str) -> float:
        """Get real-time mid-price from WebSocket order book

        This is MORE ACCURATE than REST API because:
        - Real-time: Current bid/ask spread
        - No lag: Instant updates from WebSocket
        - Better for trading: Shows where you can actually buy/sell NOW

        Falls back to REST API if WebSocket not connected
        """
        # Check if we have order book data
        if ticker not in self.order_books or not self.order_books[ticker]['bids'] or not self.order_books[ticker]['asks']:
            # Fallback to REST API
            return self.get_current_ticker_price(ticker)

        # Calculate mid-price from best bid/ask
        book = self.order_books[ticker]
        best_bid = float(book['bids'][0]['price'])
        best_ask = float(book['asks'][0]['price'])
        mid_price = (best_bid + best_ask) / 2

        return mid_price

    # Order Book & Trade Data Streaming
    # =================================
    async def _order_book_connection(self):
        """Internal function that handles a single order book WebSocket connection

        Raises exception on disconnect to trigger reconnection in wrapper
        """
        try:
            # Connect to WebSocket
            book_ws = await websockets.connect(self.WS_URL)
            print("✅ WebSocket connected for order book")

            # Subscribe to order book for all pairs
            # KRAKEN DOCS: "book" channel provides snapshot + continuous updates automatically
            # Depth options: 10, 25, 100, 500, 1000 (we use 1000 for MAXIMUM data)
            # Snapshot: true (default) gives initial state, then updates stream automatically
            pairs = list(self.ws_pair_mapping.values())
            book_sub = {
                "method": "subscribe",
                "params": {
                    "channel": "book",
                    "symbol": pairs,
                    "depth": self.WS_BOOK_DEPTH,  # 1000 = MAXIMUM depth available
                    "snapshot": True  # Get initial snapshot, then continuous updates follow
                }
            }
            await book_ws.send(json.dumps(book_sub))
            print(f"📊 Subscribed to order book data for {pairs}")

            # Process messages and just store data
            # THIS LOOP RECEIVES CONTINUOUS UPDATES FOREVER:
            # First message: type='snapshot' with full book state
            # All subsequent messages: type='update' with incremental changes
            async for message in book_ws:
                try:
                    data = json.loads(message)
                    if data.get('channel') == 'book' and data['type'] in ['snapshot', 'update']:
                        book_data = data['data'][0]

                        # Validate required fields
                        if not all(k in book_data for k in ['symbol', 'bids', 'asks']):
                            print(f"⚠️ Invalid book data (missing fields): {list(book_data.keys())}")
                            continue

                        ws_symbol = book_data['symbol']

                        if ws_symbol in self.ws_to_rest_mapping:
                            rest_symbol = self.ws_to_rest_mapping[ws_symbol]

                            if data['type'] == 'snapshot':
                                # Snapshot: Replace entire order book (truncate to subscribed depth)
                                self.order_books[rest_symbol] = {
                                    'bids': book_data.get('bids', [])[:self.WS_BOOK_DEPTH],
                                    'asks': book_data.get('asks', [])[:self.WS_BOOK_DEPTH]
                                }
                                # Set flag after first snapshot - we now have real data
                                if not self.ws_connected:
                                    self.ws_connected = True
                                    print("✅ Order book data ready - trading enabled")
                            elif data['type'] == 'update':
                                # Update: Apply incremental changes to existing order book
                                if rest_symbol not in self.order_books:
                                    self.order_books[rest_symbol] = {'bids': [], 'asks': []}

                                # Process bid updates
                                for bid_update in book_data.get('bids', []):
                                    price = float(bid_update['price'])
                                    qty = float(bid_update['qty'])

                                    if qty == 0:
                                        # Remove price level
                                        self.order_books[rest_symbol]['bids'] = [
                                            bid for bid in self.order_books[rest_symbol]['bids']
                                            if float(bid['price']) != price
                                        ]
                                    else:
                                        # Update or add price level
                                        updated = False
                                        for i, bid in enumerate(self.order_books[rest_symbol]['bids']):
                                            if float(bid['price']) == price:
                                                self.order_books[rest_symbol]['bids'][i] = bid_update
                                                updated = True
                                                break
                                        if not updated:
                                            self.order_books[rest_symbol]['bids'].append(bid_update)
                                            # Re-sort bids (highest first)
                                            self.order_books[rest_symbol]['bids'].sort(key=lambda x: float(x['price']), reverse=True)

                                # Process ask updates
                                for ask_update in book_data.get('asks', []):
                                    price = float(ask_update['price'])
                                    qty = float(ask_update['qty'])

                                    if qty == 0:
                                        # Remove price level
                                        self.order_books[rest_symbol]['asks'] = [
                                            ask for ask in self.order_books[rest_symbol]['asks']
                                            if float(ask['price']) != price
                                        ]
                                    else:
                                        # Update or add price level
                                        updated = False
                                        for i, ask in enumerate(self.order_books[rest_symbol]['asks']):
                                            if float(ask['price']) == price:
                                                self.order_books[rest_symbol]['asks'][i] = ask_update
                                                updated = True
                                                break
                                        if not updated:
                                            self.order_books[rest_symbol]['asks'].append(ask_update)
                                            # Re-sort asks (lowest first)
                                            self.order_books[rest_symbol]['asks'].sort(key=lambda x: float(x['price']))

                                # Truncate to subscribed depth (Kraken does not send deletes for out-of-scope levels)
                                self.order_books[rest_symbol]['bids'] = self.order_books[rest_symbol]['bids'][:self.WS_BOOK_DEPTH]
                                self.order_books[rest_symbol]['asks'] = self.order_books[rest_symbol]['asks'][:self.WS_BOOK_DEPTH]

                except Exception as e:
                    print(f"❌ Error processing message: {e}")

        except Exception as e:
            print(f"❌ WebSocket error: {e}")
            self.ws_connected = False  # Reset flag on error
        finally:
            if book_ws:
                await book_ws.close()
                print("🔌 Order book WebSocket disconnected")
                self.ws_connected = False  # Reset flag on disconnect

    async def get_and_update_order_book_data(self):
        """Get and update order book data from WebSocket with automatic reconnection

        CONTINUOUS UPDATES MECHANISM (per Kraken docs):
        - After subscribing, you receive an initial 'snapshot' message with full order book
        - Then automatically receive continuous 'update' messages for every book change
        - No additional subscription needed - the same subscription provides both!

        AUTOMATIC RECONNECTION:
        - On disconnect/error, waits with exponential backoff (1s, 2s, 4s... max 60s)
        - Retries forever to maintain continuous data stream
        """
        reconnect_delay = 1  # Start with 1 second delay
        max_delay = 60  # Max 60 seconds between retries

        while True:
            try:
                await self._order_book_connection()
                reconnect_delay = 1  # Reset delay after successful connection
            except Exception as e:
                print(f"❌ Order book connection lost: {e}")
                print(f"⏳ Reconnecting order book in {reconnect_delay} seconds...")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_delay)  # Exponential backoff

    async def _order_flow_connection(self):
        """Internal function that handles a single order flow WebSocket connection

        Raises exception on disconnect to trigger reconnection in wrapper
        """
        try:
            # Connect to WebSocket
            flow_ws = await websockets.connect(self.WS_URL)
            print("✅ WebSocket connected for order flow")

            # Subscribe to trades for all pairs
            # KRAKEN DOCS: "trade" channel with snapshot=true gives:
            # 1) Initial snapshot of last 50 trades (this is the MAXIMUM - cannot get more)
            # 2) Then continuous real-time updates for every new trade automatically
            pairs = list(self.ws_pair_mapping.values())
            trade_sub = {
                "method": "subscribe",
                "params": {
                    "channel": "trade",
                    "symbol": pairs,
                    "snapshot": True  # Get last 50 trades (MAX), then continuous updates
                }
            }
            await flow_ws.send(json.dumps(trade_sub))
            print(f"📊 Subscribed to order flow data for {pairs}")

            # Process trade messages and store data
            # THIS LOOP RECEIVES CONTINUOUS UPDATES FOREVER:
            # First message: type='snapshot' with last 50 trades
            # All subsequent messages: type='update' with new trades as they happen
            async for message in flow_ws:
                try:
                    data = json.loads(message)
                    if data.get('channel') == 'trade':
                        if data['type'] == 'update':
                            # Live trade updates - use Kraken's actual timestamp
                            for trade in data.get('data', []):
                                # Validate required fields (timestamp is optional for updates)
                                if not all(k in trade for k in ['symbol', 'price', 'qty', 'side']):
                                    print(f"⚠️ Invalid trade data (missing fields): {trade}")
                                    continue

                                ws_symbol = trade['symbol']

                                if ws_symbol in self.ws_to_rest_mapping:
                                    rest_symbol = self.ws_to_rest_mapping[ws_symbol]

                                    # Initialize list if needed
                                    if rest_symbol not in self.order_flow:
                                        self.order_flow[rest_symbol] = []

                                    # Parse timestamp (Kraken provides RFC3339, verified in real data)
                                    if 'timestamp' in trade:
                                        dt = datetime.fromisoformat(trade['timestamp'].replace('Z', '+00:00'))
                                        trade_timestamp = dt.timestamp()
                                    else:
                                        # Fallback only if Kraken doesn't provide (never seen in practice)
                                        trade_timestamp = time.time()

                                    # Store trade data with actual timestamp
                                    self.order_flow[rest_symbol].append({
                                        'price': float(trade['price']),
                                        'qty': float(trade['qty']),
                                        'side': trade['side'],
                                        'timestamp': trade_timestamp
                                    })

                        elif data['type'] == 'snapshot':
                            # Historical trades - parse actual Kraken timestamps (VERIFIED: always present)
                            for trade in data.get('data', []):
                                # Validate required fields
                                if not all(k in trade for k in ['symbol', 'price', 'qty', 'side', 'timestamp']):
                                    print(f"⚠️ Invalid trade snapshot (missing fields): {trade}")
                                    continue

                                ws_symbol = trade['symbol']

                                if ws_symbol in self.ws_to_rest_mapping:
                                    rest_symbol = self.ws_to_rest_mapping[ws_symbol]

                                    # Initialize list if needed
                                    if rest_symbol not in self.order_flow:
                                        self.order_flow[rest_symbol] = []

                                    # Parse timestamp from Kraken (RFC3339 format)
                                    # Kraken ALWAYS provides this field - verified with real data
                                    dt = datetime.fromisoformat(trade['timestamp'].replace('Z', '+00:00'))
                                    trade_timestamp = dt.timestamp()

                                    # Store trade data with actual timestamp
                                    self.order_flow[rest_symbol].append({
                                        'price': float(trade['price']),
                                        'qty': float(trade['qty']),
                                        'side': trade['side'],
                                        'timestamp': trade_timestamp
                                    })

                            # Set flag after first snapshot - we now have real data
                            if not self.ws_connected:
                                self.ws_connected = True
                                print("✅ Order flow data ready - trading enabled")

                except Exception as e:
                    print(f"❌ Error processing trade message: {e}")

        except Exception as e:
            print(f"❌ WebSocket error: {e}")
            self.ws_connected = False  # Reset flag on error
        finally:
            if flow_ws:
                await flow_ws.close()
                print("🔌 Order flow WebSocket disconnected")
                self.ws_connected = False  # Reset flag on disconnect

    async def get_and_update_order_flow_data(self):
        """Get and update order flow (trades) data from WebSocket with automatic reconnection

        CONTINUOUS UPDATES MECHANISM (per Kraken docs):
        - "The trade channel generates a trade event when orders are matched in the book"
        - With snapshot=true: First receive 'snapshot' with last 50 trades (MAXIMUM available)
        - Then automatically receive continuous 'update' messages for EVERY new trade

        AUTOMATIC RECONNECTION:
        - On disconnect/error, waits with exponential backoff (1s, 2s, 4s... max 60s)
        - Retries forever to maintain continuous data stream
        """
        reconnect_delay = 1  # Start with 1 second delay
        max_delay = 60  # Max 60 seconds between retries

        while True:
            try:
                await self._order_flow_connection()
                reconnect_delay = 1  # Reset delay after successful connection
            except Exception as e:
                print(f"❌ Order flow connection lost: {e}")
                print(f"⏳ Reconnecting order flow in {reconnect_delay} seconds...")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_delay)  # Exponential backoff

    # ==========================================
    # MARKET ANALYSIS
    # ==========================================

    # Order Book Imbalance Analysis
    # =============================
    def calculate_order_book_imbalance(self, ticker: str) -> float:
        """Calculate order book imbalance ratio - measures buying vs selling dollar pressure

        Returns:
        >1.0 = more dollar value in bids (bullish pressure)
        <1.0 = more dollar value in asks (bearish pressure)
        """
        book = self.order_books.get(ticker, {'bids': [], 'asks': []})

        if not book['bids'] or not book['asks']:
            imbalance = 1.0  # Neutral when no book data available
        else:
            # Calculate mid-price from best bid/ask
            mid_price = (float(book['bids'][0]['price']) + float(book['asks'][0]['price'])) / 2

            # Calculate weighted pressure using dollar volume with price-distance logarithmic weighting
            # Uses all 1000 levels with logarithmic decay based on actual price distance for institutional order detection
            #
            # WEIGHTING FORMULA EXPLANATION:
            # - Dollar volume = price * qty (economic impact, not just coin count)
            # - Distance from mid = abs(order_price - mid_price) / mid_price * 100 (percentage distance)
            # - Weight = 1 / log(distance + 2) (closer orders weighted more heavily)
            # - Example: Order 0.1% from mid gets weight 1/log(0.1+2) = 0.42
            #           Order 2.0% from mid gets weight 1/log(2.0+2) = 0.27
            # - This captures institutional flow hiding in deep levels while prioritizing near-market liquidity
            bid_pressure = sum(
                float(bid['price']) * float(bid['qty']) /
                math.log(abs(float(bid['price']) - mid_price) / mid_price * 100 + 2)
                for bid in book['bids'][:self.IMBALANCE_LEVELS]
            )
            ask_pressure = sum(
                float(ask['price']) * float(ask['qty']) /
                math.log(abs(float(ask['price']) - mid_price) / mid_price * 100 + 2)
                for ask in book['asks'][:self.IMBALANCE_LEVELS]
            )

            # Calculate ratio: bid_pressure / ask_pressure
            # >1.0 = more weighted buying pressure (bullish)
            # <1.0 = more weighted selling pressure (bearish)
            imbalance = bid_pressure / ask_pressure if ask_pressure > 0 else 2.0

        # Return without printing (will be printed together)
        return imbalance

    # Order Flow Analysis
    # ===================
    def cleanup_old_trades(self):
        """Remove trades older than FLOW_TIME_WINDOW from order flow data

        Called once per minute in orchestrator to reduce CPU usage
        """
        current_time = time.time()
        for symbol in self.order_flow:
            self.order_flow[symbol] = [
                t for t in self.order_flow[symbol]
                if current_time - t['timestamp'] < self.FLOW_TIME_WINDOW
            ]

    def calculate_order_flow_imbalance(self, ticker: str) -> float:
        """Calculate order flow imbalance ratio - measures actual buying vs selling dollar volume

        Returns:
        >1.0 = more dollar volume bought (bullish flow)
        <1.0 = more dollar volume sold (bearish flow)
        """
        trades = self.order_flow.get(ticker, [])

        if not trades:
            imbalance = 1.0  # Neutral when no trade data available
        else:
            # Calculate buy and sell dollar volumes
            buy_volume = sum(t['price'] * t['qty'] for t in trades if t['side'] == 'buy')
            sell_volume = sum(t['price'] * t['qty'] for t in trades if t['side'] == 'sell')

            # Calculate ratio: buy_volume / sell_volume
            imbalance = buy_volume / sell_volume if sell_volume > 0 else 2.0

        # Print the result
        # Return without printing (will be printed together)
        return imbalance

    # ==========================================
    # TRADING ANALYSIS
    # ==========================================

    # Support & Resistance Levels
    # ===========================
    def calculate_support_resistance(self, ticker: str, current_price: float) -> tuple:
        """Calculate bid support and ask resistance dollar volumes at different percentage distances

        This is the CORE method for trading decisions:
        - BID SUPPORT = Dollar value waiting to buy below current price
        - ASK RESISTANCE = Dollar value waiting to sell above current price

        Returns support and resistance dollar volumes at 0.5%, 1.0%, 2.0%, and 5.0% ranges.

        Example for BTC at €100,000:
        - support_2pct = €10M in bids >= €98,000 (2.0% below)
        - resistance_2pct = €8M in asks <= €102,000 (2.0% above)

        Trading logic:
        - More dollar support than resistance = Institutional accumulation zone
        """
        book = self.order_books.get(ticker, {'bids': [], 'asks': []})

        if not book['bids'] or not book['asks']:
            # Return zeros when no book data available
            empty_support = {"0.5%": 0, "1.0%": 0, "2.0%": 0, "5.0%": 0}
            empty_resistance = {"0.5%": 0, "1.0%": 0, "2.0%": 0, "5.0%": 0}
            return empty_support, empty_resistance

        # Calculate BID SUPPORT at different percentages below current price
        support = {}
        for pct in [0.5, 1.0, 2.0, 5.0]:
            threshold_price = current_price * (1 - pct/100)
            support_volume = sum(
                float(bid['price']) * float(bid['qty']) for bid in book['bids']
                if float(bid['price']) >= threshold_price
            )
            key = f"{pct}%"  # Use decimal format
            support[key] = support_volume

        # Calculate ASK RESISTANCE at different percentages above current price
        resistance = {}
        for pct in [0.5, 1.0, 2.0, 5.0]:
            threshold_price = current_price * (1 + pct/100)
            resistance_volume = sum(
                float(ask['price']) * float(ask['qty']) for ask in book['asks']
                if float(ask['price']) <= threshold_price
            )
            key = f"{pct}%"  # Use decimal format
            resistance[key] = resistance_volume

        return support, resistance

    # Buy Signal Logic
    # ===============
    def enhanced_buy_signal(self, ticker: str, price: float) -> tuple:
        """Triple confirmation buy signal

        Buy when:
        1. Support volume > resistance volume (institutional accumulation zones)
        2. Order book imbalance > 1.01x (slight buying pressure)
        3. Order flow imbalance > 1.2x (real buying in 4-hour window)
        """
        # SAFETY CHECK: Never buy if we already have a position
        if self.entry_prices[ticker] is not None:
            return False, f"Already holding {ticker}"

        # DUPLICATE ORDER PREVENTION: Check for existing open buy orders
        # This prevents placing multiple orders before balance cache updates (which happens every 60s)
        # If recent order exists, wait for it to fill or expire before placing new order
        # Stale orders (>15min old) are auto-canceled to allow re-entry at new price levels
        try:
            open_orders = self.open_orders.get('open', {})
            current_time = time.time()

            for order_id, order_info in open_orders.items():
                order_pair = order_info.get('descr', {}).get('pair', '')
                order_type = order_info.get('descr', {}).get('type', '')
                order_time = float(order_info.get('opentm', 0))

                if order_pair == ticker and order_type == 'buy':
                    # Cancel orders older than configured threshold
                    if current_time - order_time > self.ORDER_AGE_CANCEL_SEC:
                        try:
                            self.cancel_order(order_id)
                            print(f"🗑️ Cancelled stale buy order {order_id} for {ticker}")
                            time.sleep(self.RATE_LIMIT_DELAY)
                        except Exception as e:
                            print(f"⚠️ Failed to cancel order {order_id}: {e}")
                    else:
                        return False, f"Recent buy order exists for {ticker} - waiting for fill or expiry"
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error checking open orders: {e}")
            return False, f"Network error - cannot verify no duplicate orders exist"
        except ValueError as e:
            print(f"⚠️ Invalid response checking open orders: {e}")
            return False, f"Invalid API response - cannot verify no duplicate orders exist"
        except Exception as e:
            print(f"⚠️ Unexpected error checking open orders: {e}")
            return False, f"API error - cannot verify no duplicate orders exist"

        if self.ws_connected:
            # Calculate support/resistance volumes at 2.0% distance
            support, resistance = self.calculate_support_resistance(ticker, price)
            support_volume = support["2.0%"]      # Volume 2.0% below price
            resistance_volume = resistance["2.0%"] # Volume 2.0% above price

            # Get order book and flow imbalances
            book_imbalance = self.calculate_order_book_imbalance(ticker)
            flow_imbalance = self.calculate_order_flow_imbalance(ticker)

            # ENHANCED BUY LOGIC: Need ALL THREE conditions
            if support_volume > resistance_volume and book_imbalance > self.MIN_BOOK_IMBALANCE and flow_imbalance > self.MIN_FLOW_IMBALANCE:
                return True, f"Strong Buy: Support {support_volume:.1f} > Resistance {resistance_volume:.1f} + Book {book_imbalance:.2f}x + Flow {flow_imbalance:.2f}x"
            else:
                return False, f"No buy: Support {support_volume:.1f} vs Resistance {resistance_volume:.1f}, Book {book_imbalance:.2f}x, Flow {flow_imbalance:.2f}x (need >{self.MIN_BOOK_IMBALANCE}x book, >{self.MIN_FLOW_IMBALANCE}x flow)"

        else:
            return False, "No WebSocket connection for order book data"

    # Sell Signal Logic
    # ================
    def enhanced_sell_signal(self, ticker: str, price: float) -> tuple:
        """Simple profit taking sell signal

        Sell when profit >= 1.6% (no volume conditions needed)
        """
        # SAFETY CHECK: Only sell if we have a position
        if self.entry_prices[ticker] is None:
            return False, f"No position to sell for {ticker}"

        # Check for existing open sell orders (prevent duplicates)
        try:
            open_orders = self.open_orders.get('open', {})

            for order_id, order_info in open_orders.items():
                order_pair = order_info.get('descr', {}).get('pair', '')
                order_type = order_info.get('descr', {}).get('type', '')

                if order_pair == ticker and order_type == 'sell':
                    return False, f"Sell order already exists for {ticker} - waiting for fill"
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error checking open orders: {e}")
            return False, f"Network error - cannot verify no duplicate sell orders exist"
        except ValueError as e:
            print(f"⚠️ Invalid response checking open orders: {e}")
            return False, f"Invalid API response - cannot verify no duplicate sell orders exist"
        except Exception as e:
            print(f"⚠️ Unexpected error checking open orders: {e}")
            return False, f"API error - cannot verify no duplicate sell orders exist"

        if self.ws_connected:
            position = self.entry_prices[ticker]
            buy_price = position['buy_price']

            # Check if buy_price is None (unknown entry price)
            if buy_price is None:
                return False, f"Cannot calculate sell signal - unknown entry price for {ticker}"

            # Calculate current profit percentage
            profit_pct = (price - buy_price) / buy_price * 100

            # MINIMUM PROFIT CHECK: Don't sell unless profit > configured target
            if profit_pct < self.TARGET_PROFIT_PCT:
                return False, f"Not profitable: {profit_pct:+.1f}% < {self.TARGET_PROFIT_PCT}% minimum"

            # Simple profit taking - no volume conditions needed
            return True, f"Sell: Profit target reached {profit_pct:+.1f}% ✅"

        else:
            return False, "No WebSocket connection for support analysis"

    # ==========================================
    # BOT ORCHESTRATION
    # ==========================================

    # Main Coordination Logic
    # ======================
    async def orchestrator(self):
        """Orchestrator function that coordinates all bot functions"""
        self.log("🤖 Starting Kraken Bot Orchestrator")
        self.log("=" * 50)

        # Test our functions
        self.log("\n📋 Testing Account Balance...")
        self.get_account_balance()

        self.log("\n📋 Testing Current Ticker Price (REST API)...")
        price = self.get_current_ticker_price('XBTEUR')
        self.log(f"💰 BTC Price (REST): €{price}")

        self.log("\n📋 Testing Open Orders...")
        orders = self.get_open_orders()
        self.log(f"📋 Open Orders: {orders}")

        self.log("\n📋 Testing Closed Orders...")
        closed_orders = self.get_closed_orders()
        self.log(f"📋 Closed Orders: {len(closed_orders.get('closed', {}))} orders")

        self.log("\n📋 Syncing Positions...")
        self.sync_positions()
        self.log(f"📊 Entry Prices: {self.entry_prices}")

        # Step 2: Start collecting order book and order flow data in background
        self.log("\n📋 Step 2: Starting Data Collection...")
        order_book_task = asyncio.create_task(self.get_and_update_order_book_data())
        self.log(f"🚀 Order book task created: {order_book_task}")
        order_flow_task = asyncio.create_task(self.get_and_update_order_flow_data())
        self.log(f"🚀 Order flow task created: {order_flow_task}")
        self.log(f"✅ Both tasks running: book={order_book_task.done()}, flow={order_flow_task.done()}")

        # Wait for initial data to come in
        self.log("\n📋 Waiting for WebSocket data collection...")
        await asyncio.sleep(10)
        self.log("✅ Data collection running in background")

        self.log("\n📋 Testing WebSocket Price (Mid-price from order book)...")
        ws_price = self.get_current_price('XBTEUR')
        self.log(f"💰 BTC Price (WebSocket): €{ws_price}")

        self.log("\n📋 Testing Support/Resistance Calculation...")
        support, resistance = self.calculate_support_resistance('XBTEUR', ws_price)
        self.log(f"📊 Support levels: {support}")
        self.log(f"📊 Resistance levels: {resistance}")

        # Step 3: Start periodic imbalance monitoring (every 5 seconds)
        self.log("\n📋 Step 3: Starting Periodic Imbalance Monitoring...")
        last_balance_update = time.time()
        try:
            while True:
                self.log(f"\n🔄 Imbalance Check - {datetime.now().strftime('%H:%M:%S')}")

                # RATE LIMITING: Update open orders ONCE per cycle for all tickers
                self.log("📋 Updating open orders cache (rate limited)...")
                try:
                    self.open_orders = self.get_open_orders()
                    time.sleep(self.RATE_LIMIT_DELAY)
                except Exception as e:
                    self.log(f"⚠️ Could not fetch open orders: {e}")
                    self.open_orders = {'open': {}}

                # Update balance and positions based on time elapsed
                if time.time() - last_balance_update >= self.BALANCE_UPDATE_INTERVAL:
                    self.sync_positions()
                    self.cleanup_old_trades()  # Clean old order flow trades
                    last_balance_update = time.time()

                # Check order book and flow imbalance for each ticker
                for ticker in self.TICKERS.keys():
                    config = self.TICKERS[ticker]
                    try:
                        # Calculate both imbalances and store for web interface
                        book_imbalance = self.calculate_order_book_imbalance(ticker)
                        flow_imbalance = self.calculate_order_flow_imbalance(ticker)

                        # Store for web interface
                        self.book_imbalances[ticker] = book_imbalance
                        self.flow_imbalances[ticker] = flow_imbalance

                        # Print both on same line
                        book_status = "🟢 BULLISH" if book_imbalance > 1.2 else "🔴 BEARISH" if book_imbalance < 0.8 else "⚪ NEUTRAL"
                        flow_status = "🟢 BULLISH" if flow_imbalance > 1.2 else "🔴 BEARISH" if flow_imbalance < 0.8 else "⚪ NEUTRAL"

                        trades = self.order_flow.get(ticker, [])
                        trade_count = len(trades)

                        self.log(f"💰 {config['display']}: Book {book_imbalance:.2f}x {book_status} | Flow {flow_imbalance:.2f}x {flow_status} ({trade_count} trades)")

                        # Calculate price and support/resistance, store for web interface
                        price = self.get_current_price(ticker)
                        self.current_prices[ticker] = price
                        support, resistance = self.calculate_support_resistance(ticker, price)
                        self.support_levels[ticker] = support
                        self.resistance_levels[ticker] = resistance

                        self.log(f"   🟢 Support: 0.5%=€{price*0.995:,.0f} (€{support['0.5%']:,.0f}) | 1.0%=€{price*0.99:,.0f} (€{support['1.0%']:,.0f}) | 2.0%=€{price*0.98:,.0f} (€{support['2.0%']:,.0f}) | 5.0%=€{price*0.95:,.0f} (€{support['5.0%']:,.0f})")
                        self.log(f"   🔴 Resistance: 0.5%=€{price*1.005:,.0f} (€{resistance['0.5%']:,.0f}) | 1.0%=€{price*1.01:,.0f} (€{resistance['1.0%']:,.0f}) | 2.0%=€{price*1.02:,.0f} (€{resistance['2.0%']:,.0f}) | 5.0%=€{price*1.05:,.0f} (€{resistance['5.0%']:,.0f})")

                        # TRADING SIGNALS AND EXECUTION
                        # =============================

                        # Check buy signal first (using cached orders)
                        try:
                            should_buy, buy_reason = self.enhanced_buy_signal(ticker, price)
                        except Exception as e:
                            self.log(f"❌ Buy signal error for {ticker}: {e}")
                            should_buy = False
                            buy_reason = f"Signal error: {e}"

                        if should_buy:
                            self.log(f"🚀 {config['display']} BUY SIGNAL!")
                            self.log(f"   Reason: {buy_reason}")

                            # Execute buy
                            success, message = self.execute_buy(ticker, price)
                            if success:
                                self.log(f"✅ {config['display']} buy order placed: {message}")
                            else:
                                self.log(f"❌ {config['display']} buy blocked: {message}")

                        # Check sell signal if we have a position (using cached orders)
                        elif self.entry_prices[ticker] is not None:
                            try:
                                should_sell, sell_reason = self.enhanced_sell_signal(ticker, price)
                            except Exception as e:
                                self.log(f"❌ Sell signal error for {ticker}: {e}")
                                should_sell = False
                                sell_reason = f"Signal error: {e}"

                            if should_sell:
                                self.log(f"🔴 {config['display']} SELL SIGNAL!")
                                self.log(f"   Reason: {sell_reason}")

                                # Execute sell
                                success, message = self.execute_sell(ticker, price)
                                if success:
                                    self.log(f"✅ {config['display']} sell order placed: {message}")
                                else:
                                    self.log(f"❌ {config['display']} sell blocked: {message}")

                    except Exception as e:
                        self.log(f"❌ Error calculating imbalances for {ticker}: {e}")

                self.log(f"⏰ Next imbalance check in {self.MAIN_LOOP_INTERVAL} seconds...")
                await asyncio.sleep(self.MAIN_LOOP_INTERVAL)

        except KeyboardInterrupt:
            self.log("\n🛑 Imbalance monitoring stopped")


if __name__ == "__main__":
    bot = KrakenBot()

    # Run the orchestrator
    asyncio.run(bot.orchestrator())