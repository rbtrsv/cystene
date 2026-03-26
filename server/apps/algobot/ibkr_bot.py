#!/usr/bin/env python3
"""
IBKR Bot
"""

import asyncio
import time
from datetime import datetime
from typing import Dict, Optional, List
from ib_async import *
import yfinance as yf


class IBKRBot:
    def __init__(self):
        # Web logging function - set by subrouter
        self._web_log = None

        # Tickers Configuration
        # IMPORTANT: Each field serves different IBKR API requirements:
        # - Ticker Key: Internal identifier for tracking
        # - 'name': Human readable name (display only)
        # - 'symbol': Symbol for Contract creation
        # - 'contract_type': Type of contract (Stock, Forex, Future, Option, Index, Bond)
        # - 'exchange': Primary exchange for Contract (for stocks/options)
        # - 'currency': Trading currency
        # - 'max_order': Position limits in USD (risk management)
        # - 'contract': IB Contract object (created during initialization)
        self.TICKERS = {
            # US Stocks - Free real-time via IBKR-PRO (non-consolidated)
            'TSLA': {
                'name': 'Tesla',
                'display': 'TSLA/USD',
                'max_order': 500,
                'contract': Stock('TSLA', 'SMART', 'USD'),
                'index_symbol': '^GSPC'
            },
            # 'SPY': {
            #     'name': 'SPDR S&P 500 ETF',
            #     'display': 'SPY/USD',
            #     'min_order': 100,
            #     'contract': Stock('SPY', 'SMART', 'USD')
            # },
            # 'QQQ': {
            #     'name': 'Invesco QQQ Trust',
            #     'display': 'QQQ/USD',
            #     'min_order': 100,
            #     'contract': Stock('QQQ', 'SMART', 'USD')
            # },

            # Forex - FREE with IDEALPRO subscription
            # 'EURUSD': {
            #     'name': 'Euro/US Dollar',
            #     'display': 'EUR/USD',
            #     'min_order': 100,  # 24/7 trading like crypto
            #     'contract': Forex('EURUSD')
            # },
            # 'EURNOK': {
            #     'name': 'Euro/Norwegian Krone',
            #     'display': 'EUR/NOK',
            #     'min_order': 100,  # European regional pair
            #     'contract': Forex('EURNOK')
            # },

            # UK Stocks - FREE 15-minute delayed data
            'LLOY': {
                'name': 'Lloyds Banking Group',
                'display': 'LLOY/GBP',
                'max_order': 200,  # UK major bank - FREE 15min delayed LSE
                'contract': Stock('LLOY', 'LSE', 'GBP'),
                'index_symbol': '^FTSE'
            },
            'TSCO': {
                'name': 'Tesco PLC',
                'display': 'TSCO/GBP',
                'max_order': 200,  # UK retail giant - FREE 15min delayed LSE
                'contract': Stock('TSCO', 'LSE', 'GBP'),
                'index_symbol': '^FTSE'
            },

        }

        # Data Storage
        self.positions = {}  # Track what we own: ticker -> {'quantity': X, 'avg_cost': Y} or None

        # Web Interface Data (real-time attributes used by subrouter)
        self.account_balance = 0.0  # Available cash balance
        self.portfolio_value = 0.0  # Total portfolio value (cash + positions)
        self.current_prices = {}  # Current market prices: ticker -> price

        # YFinance Cache (1 hour expiry)
        self.index_data = {}  # symbol -> {'rsi': float, 'current': float, 'last_updated': timestamp}
        self.CACHE_EXPIRY = 3600  # 1 hour in seconds

        # IB Connection Object
        self.ib = IB()
        self.connected = False

        # API Configuration
        # Connection options - Choose your setup
        self.CONNECTION_MODE = 'external'  # Options: 'local' or 'external'

        if self.CONNECTION_MODE == 'local':
            # Local IB Gateway (Docker or local installation)
            self.IB_HOST = '127.0.0.1'
            self.IB_PORT = 7497
        elif self.CONNECTION_MODE == 'external':
            # External IB Gateway server
            self.IB_HOST = '91.98.44.218'
            self.IB_PORT = 4001

        # Additional API settings
        self.CLIENT_ID = 2   # Unique client identifier
        self.CONNECTION_TIMEOUT = 10  # Connection timeout in seconds
        self.RATE_LIMIT_DELAY = 0.5   # Rate limiting protection

    
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
    # CONNECTION MANAGEMENT
    # ==========================================

    async def connect_to_ib(self) -> bool:
        """Connect to Interactive Brokers Gateway/TWS"""
        try:
            await self.ib.connectAsync(
                host=self.IB_HOST,
                port=self.IB_PORT,
                clientId=self.CLIENT_ID,
                timeout=self.CONNECTION_TIMEOUT
            )
            self.connected = True

            # Market data types:
            # 1=Real-time (requires subscription)
            # 3=Delayed (free)
            # 4=Delayed frozen (free)
            self.ib.reqMarketDataType(1)

            self.log(f"✅ Connected to IB Gateway at {self.IB_HOST}:{self.IB_PORT}")
            return True
        except Exception as e:
            self.log(f"❌ Failed to connect to IB: {e}")
            self.connected = False
            return False

    async def disconnect_from_ib(self):
        """Disconnect from Interactive Brokers"""
        if self.connected:
            self.ib.disconnect()
            self.connected = False
            print("🔌 Disconnected from IB Gateway")

    # Account Data
    # ============
    async def get_account_summary(self) -> Dict:
        """Get account summary from Interactive Brokers"""
        if not self.connected:
            raise Exception("Not connected to IB")

        # Get account summary (async version)
        summary = await self.ib.accountSummaryAsync()

        # Convert to dictionary
        result = {}
        for item in summary:
            result[item.tag] = {
                'value': item.value,
                'currency': item.currency
            }

        print(f"💰 Account Summary: {result}")
        return result

    # Account Balance
    # ===============
    async def get_account_balance(self) -> float:
        """Get account cash balance from Interactive Brokers"""
        if not self.connected:
            raise Exception("Not connected to IB")

        # Get account values directly
        account = self.ib.managedAccounts()[0]
        account_values = self.ib.accountValues(account)

        # Find available funds
        available_funds = 0.0
        for value in account_values:
            if value.tag == 'AvailableFunds' and value.currency == 'USD':
                available_funds = float(value.value)
                break

        print(f"💰 Available Funds: ${available_funds:.2f}")
        return available_funds

    async def get_positions(self) -> Dict:
        """Get current positions from Interactive Brokers"""
        if not self.connected:
            raise Exception("Not connected to IB")

        positions = self.ib.positions()

        result = {}
        for pos in positions:
            symbol = pos.contract.symbol
            result[symbol] = {
                'quantity': pos.position,
                'avg_cost': pos.avgCost
            }

        return result

    # ==========================================
    # MARKET DATA FUNCTIONS
    # ==========================================

    # Current Price Data
    # ==================
    async def get_current_price(self, ticker: str) -> float:
        """Get current price using latest minute bar"""
        if not self.connected:
            raise Exception("Not connected to IB")

        if ticker not in self.TICKERS:
            raise Exception(f"Unknown ticker: {ticker}")

        # Try 1-minute bars first
        bars = await self.get_historical_data(ticker, '300 S', '1 min')
        if bars:
            return float(bars[-1].close)

        # Try 5-minute bars
        bars = await self.get_historical_data(ticker, '1800 S', '5 mins')
        if bars:
            return float(bars[-1].close)

        return None

    # Historical Data
    # ===============
    async def get_historical_data(self, ticker: str, duration: str = '90 D', bar_size: str = '1 day') -> List:
        """Get historical OHLCV data from Interactive Brokers

        Args:
            ticker: Ticker symbol from self.TICKERS
            duration: Time period ('1 D', '30 D', '90 D', '1 Y')
            bar_size: Bar size ('1 min', '5 mins', '1 hour', '1 day')

        Returns:
            List[BarData]: Historical bars with OHLCV data
        """
        if not self.connected:
            raise Exception("Not connected to IB")

        if ticker not in self.TICKERS:
            raise Exception(f"Unknown ticker: {ticker}")

        try:
            contract = self.TICKERS[ticker]['contract']

            bars = await self.ib.reqHistoricalDataAsync(
                contract,
                endDateTime='',
                durationStr=duration,
                barSizeSetting=bar_size,
                whatToShow='TRADES',
                useRTH=True,
                formatDate=1
            )

            return bars

        except Exception as e:
            print(f"❌ Error getting historical data for {ticker}: {e}")
            return []

    # ==========================================
    # ORDER MANAGEMENT
    # ==========================================

    # Open Orders
    # ===========
    async def get_open_orders(self) -> List:
        """Get all open orders from Interactive Brokers"""
        if not self.connected:
            raise Exception("Not connected to IB")

        open_trades = self.ib.openTrades()

        result = []
        for trade in open_trades:
            result.append({
                'order_id': trade.order.orderId,
                'symbol': trade.contract.symbol,
                'action': trade.order.action,
                'quantity': trade.order.totalQuantity,
                'order_type': trade.order.orderType,
                'status': trade.orderStatus.status
            })

        print(f"📋 Open Orders: {len(result)} orders")
        return result

    # Order Status
    # ============
    async def get_order_status(self, order_id: int) -> dict:
        """Get order status from Interactive Brokers"""
        if not self.connected:
            raise Exception("Not connected to IB")

        # Find the trade by order ID
        open_trades = self.ib.openTrades()
        for trade in open_trades:
            if trade.order.orderId == order_id:
                return {
                    'filled': trade.orderStatus.status == 'Filled',
                    'status': trade.orderStatus.status,
                    'filled_qty': trade.orderStatus.filled,
                    'remaining_qty': trade.orderStatus.remaining,
                    'avg_fill_price': trade.orderStatus.avgFillPrice
                }

        # Order not found in open trades - might be filled or cancelled
        return {
            'filled': False,
            'status': 'NotFound',
            'filled_qty': 0,
            'remaining_qty': 0,
            'avg_fill_price': 0
        }

    # Cancel Order
    # ============
    async def cancel_order(self, order_id: int) -> bool:
        """Cancel an open order"""
        if not self.connected:
            raise Exception("Not connected to IB")

        try:
            # Find the trade by order ID
            open_trades = self.ib.openTrades()
            for trade in open_trades:
                if trade.order.orderId == order_id:
                    self.ib.cancelOrder(trade.order)
                    print(f"🗑️ Cancelled order {order_id}")
                    return True

            print(f"⚠️ Order {order_id} not found")
            return False

        except Exception as e:
            print(f"❌ Failed to cancel order {order_id}: {e}")
            return False

    # ==========================================
    # TRADING FUNCTIONS
    # ==========================================

    # Buy Execution
    # =============
    async def execute_buy(self, ticker: str, current_price: float) -> tuple:
        """Execute buy order for specific ticker with validation"""
        try:
            # Safety check: Don't buy if we already have a position
            positions = await self.get_positions()
            if ticker in positions and positions[ticker]['quantity'] > 0:
                return False, f"Already holding {ticker} ({positions[ticker]['quantity']:.0f} shares)"

            # Cancel stale/mispriced orders before placing new one
            open_orders = self.ib.openOrders()
            new_limit_price = current_price * 0.998  # -0.2% below current

            for order in open_orders:
                if (order.contract.symbol == ticker and
                    order.action == 'BUY' and
                    order.orderState.status in ['Submitted', 'PreSubmitted']):

                    # Check price difference (>0.1%) or time (>30 minutes)
                    price_diff = abs((order.lmtPrice - new_limit_price) / new_limit_price) * 100
                    order_time = order.orderState.submittedTime
                    if order_time:
                        order_age_minutes = (datetime.now() - order_time).total_seconds() / 60
                    else:
                        order_age_minutes = 0

                    if price_diff > 0.1 or order_age_minutes > 30:
                        print(f"🗑️ Cancelling stale buy order for {ticker}: Price diff {price_diff:.2f}% | Age {order_age_minutes:.1f} min")
                        self.ib.cancelOrder(order)
                        await asyncio.sleep(1)  # Wait for cancellation
                    else:
                        return False, f"Recent buy order exists for {ticker} (Price diff: {price_diff:.2f}%, Age: {order_age_minutes:.1f} min)"

            # Get configuration
            config = self.TICKERS[ticker]
            usd_amount = config['max_order']

            # Check account balance
            try:
                available_funds = await self.get_account_balance()
                if available_funds < usd_amount:
                    return False, f"Insufficient funds: ${available_funds:.2f} < ${usd_amount}"
                print(f"💰 Executing buy for {ticker}: ${usd_amount} (Available: ${available_funds:.2f})")
            except Exception as e:
                return False, f"Could not verify account balance: {e}"

            # Use the limit price we calculated earlier
            limit_price = new_limit_price

            # Calculate quantity based on USD amount
            quantity = int(usd_amount / limit_price)
            if quantity <= 0:
                return False, f"Calculated quantity too small: {quantity}"

            # Create IBKR contract and order
            contract = config['contract']
            order = LimitOrder('BUY', quantity, round(limit_price, 2))

            # Place the order
            trade = self.ib.placeOrder(contract, order)
            order_id = trade.order.orderId

            return True, f"Order {order_id} placed: BUY {quantity} {ticker} at ${limit_price:.2f}"

        except Exception as e:
            return False, f"Buy failed for {ticker}: {e}"

    # Sell Execution
    # ==============
    async def execute_sell(self, ticker: str, current_price: float) -> tuple:
        """Execute sell order for specific ticker with validation"""
        try:
            # Safety check: Only sell if we have a position to sell
            positions = await self.get_positions()
            if ticker not in positions or positions[ticker]['quantity'] <= 0:
                return False, f"No position to sell for {ticker}"

            # Get quantity from position data
            quantity = int(positions[ticker]['quantity'])

            # SAFETY CHECK: Cancel stale or badly priced sell orders
            open_orders = self.ib.openOrders()
            new_limit_price = current_price * 1.001  # +0.1% above current

            for order in open_orders:
                if (order.contract.symbol == ticker and
                    order.action == 'SELL' and
                    order.orderState.status in ['Submitted', 'PreSubmitted']):

                    # Check price difference (>0.1%) or time (>30 minutes)
                    price_diff = abs((order.lmtPrice - new_limit_price) / new_limit_price) * 100
                    order_time = order.orderState.submittedTime
                    if order_time:
                        order_age_minutes = (datetime.now() - order_time).total_seconds() / 60
                    else:
                        order_age_minutes = 0

                    if price_diff > 0.1 or order_age_minutes > 30:
                        print(f"🗑️ Cancelling stale sell order for {ticker}: Price diff {price_diff:.2f}% | Age {order_age_minutes:.1f} min")
                        self.ib.cancelOrder(order)
                        await asyncio.sleep(1)  # Wait for cancellation
                    else:
                        return False, f"Recent sell order exists for {ticker} (Price diff: {price_diff:.2f}%, Age: {order_age_minutes:.1f} min)"

            # Use the limit price we calculated earlier
            limit_price = new_limit_price

            # Create IBKR contract and order
            config = self.TICKERS[ticker]
            contract = config['contract']
            order = LimitOrder('SELL', quantity, round(limit_price, 2))

            # Place the order
            trade = self.ib.placeOrder(contract, order)
            order_id = trade.order.orderId

            return True, f"Order {order_id} placed: SELL {quantity} {ticker} at ${limit_price:.2f}"

        except Exception as e:
            return False, f"Sell failed for {ticker}: {e}"

    # ==========================================
    # TRADING ANALYSIS
    # ==========================================

    # VWAP Calculation
    # ================
    def calculate_vwap(self, bars: List) -> float:
        """Calculate Volume Weighted Average Price from historical bars

        VWAP Formula: Σ(typical_price × volume) / Σ(volume)
        where typical_price = (high + low + close) / 3

        Args:
            bars: List of BarData objects with OHLCV data

        Returns:
            float: VWAP value
        """
        if not bars:
            return 0.0

        total_pv = 0.0  # price * volume sum
        total_volume = 0.0

        for bar in bars:
            # Calculate typical price (institutional standard)
            typical_price = (bar.high + bar.low + bar.close) / 3

            # Add to weighted sum
            pv = typical_price * bar.volume
            total_pv += pv
            total_volume += bar.volume

        # Return VWAP or 0 if no volume
        vwap = total_pv / total_volume if total_volume > 0 else 0.0
        return vwap

    # RSI Calculation
    # ===============
    def calculate_rsi(self, bars: List, period: int = 14) -> float:
        """Calculate Relative Strength Index from historical bars

        RSI Formula:
        RSI = 100 - (100 / (1 + RS))
        where RS = Average Gain / Average Loss over period

        Args:
            bars: List of BarData objects with OHLCV data
            period: RSI period (default 14 days, institutional standard)

        Returns:
            float: RSI value (0-100 scale)
        """
        if len(bars) < period + 1:
            return 50.0  # Neutral RSI when insufficient data

        # Calculate price changes
        price_changes = []
        for i in range(1, len(bars)):
            change = bars[i].close - bars[i-1].close
            price_changes.append(change)

        # Split into gains and losses
        gains = [change if change > 0 else 0 for change in price_changes]
        losses = [-change if change < 0 else 0 for change in price_changes]

        # Calculate initial averages (first period)
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        # Calculate RSI using Wilder's smoothing for remaining periods
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        # Calculate final RSI
        if avg_loss == 0:
            return 100.0  # No losses = maximum RSI

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return rsi

    # ==========================================
    # TRADING SIGNALS
    # ==========================================

    async def enhanced_buy_signal(self, ticker: str) -> tuple:
        """
        Pure signal logic for buy conditions.

        Buy Signal:
        - Price < VWAP (quarterly 90-day VWAP)
        - Stock RSI < Index RSI - 5

        Returns:
            tuple: (bool, str) - (signal_active, reason)
        """
        try:
            # Gather required data
            current_price = await self.get_current_price(ticker)
            if current_price is None:
                return False, "No price data available"

            # Get quarterly historical data for calculations (90 days)
            bars = await self.get_historical_data(ticker, '90 D', '1 day')
            if not bars:
                return False, "No historical data available"

            # Calculate VWAP on quarterly data (3-month period)
            vwap = self.calculate_vwap(bars)
            if vwap is None:
                return False, "No VWAP data available"

            # Calculate RSI on quarterly data (14-period)
            stock_rsi = self.calculate_rsi(bars, 14)
            if stock_rsi is None:
                return False, "No RSI data available"

            # Get index RSI for comparison
            ticker_config = self.TICKERS[ticker]
            if 'index_symbol' not in ticker_config:
                return False, "No index symbol configured"

            index_symbol = ticker_config['index_symbol']
            if index_symbol not in self.index_data:
                return False, "Index data not available"

            index_rsi = self.index_data[index_symbol]['rsi']

            # Apply buy signal logic: BOTH conditions must be true
            price_below_vwap = current_price < vwap
            rsi_oversold = stock_rsi < (index_rsi - 5)

            # Return detailed reason for decision
            if price_below_vwap and rsi_oversold:
                return True, f"Price ${current_price:.2f} < VWAP ${vwap:.2f} & Stock RSI {stock_rsi:.1f} < Index RSI-5 {index_rsi-5:.1f}"
            elif not price_below_vwap and not rsi_oversold:
                return False, f"Price ${current_price:.2f} > VWAP ${vwap:.2f} & Stock RSI {stock_rsi:.1f} > Index RSI-5 {index_rsi-5:.1f}"
            elif not price_below_vwap:
                return False, f"Price ${current_price:.2f} > VWAP ${vwap:.2f}"
            else:
                return False, f"Stock RSI {stock_rsi:.1f} > Index RSI-5 {index_rsi-5:.1f}"

        except Exception as e:
            return False, f"Signal error: {e}"

    async def enhanced_sell_signal(self, ticker: str) -> tuple:
        """
        Pure signal logic for sell conditions.

        Sell Signal:
        - Profit >= 1.0% from entry price

        Returns:
            tuple: (bool, str) - (signal_active, reason)
        """
        try:
            # Find our position for this ticker
            positions = await self.get_positions()
            if ticker not in positions or positions[ticker]['quantity'] <= 0:
                return False, "No long position to sell"

            # Get current market price
            current_price = await self.get_current_price(ticker)
            if current_price is None:
                return False, "No price data available"

            # Calculate profit vs entry price
            entry_price = float(positions[ticker]['avg_cost'])
            profit_pct = ((current_price - entry_price) / entry_price) * 100

            # Check if profit target reached
            if profit_pct >= 1.0:
                return True, f"Profit target reached: {profit_pct:.2f}% (Entry: ${entry_price:.2f} → Current: ${current_price:.2f})"
            else:
                return False, f"Profit {profit_pct:.2f}% < 1.0% target (Entry: ${entry_price:.2f} → Current: ${current_price:.2f})"

        except Exception as e:
            return False, f"Signal error: {e}"

    # ==========================================
    # YFINANCE DATA FUNCTIONS
    # ==========================================

    def get_yf_historical_data(self, symbol: str, period: str = '90d'):
        """Get historical data using yfinance

        Args:
            symbol: Symbol (e.g., '^FTSE', 'AAPL', '^GSPC')
            period: Period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')

        Returns:
            pandas.DataFrame: Historical OHLCV data
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)

            if hist.empty:
                raise Exception(f"No data found for {symbol}")

            return hist

        except Exception as e:
            raise Exception(f"Error fetching data for {symbol}: {e}")

    def calculate_yf_rsi(self, close_prices: list, period: int = 14) -> float:
        """Calculate RSI from yfinance close price list

        Args:
            close_prices: List of close prices
            period: RSI period (default 14)

        Returns:
            float: RSI value (0-100 scale)
        """
        if len(close_prices) < period + 1:
            return 50.0

        # Calculate price changes
        price_changes = []
        for i in range(1, len(close_prices)):
            change = close_prices[i] - close_prices[i-1]
            price_changes.append(change)

        # Split into gains and losses
        gains = [change if change > 0 else 0 for change in price_changes]
        losses = [-change if change < 0 else 0 for change in price_changes]

        # Calculate initial averages (first period)
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        # Calculate RSI using Wilder's smoothing for remaining periods
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        # Calculate final RSI
        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return rsi

    # ==========================================
    # COMPOSED FUNCTIONS
    # ==========================================

    async def update_index_rsi(self) -> Dict:
        """Update RSI for configured stock indices with 1-hour caching

        Updates RSI values for all configured major stock indices.
        Uses 1-hour cache expiry to avoid excessive API calls.

        Returns:
            Dict: Updated index data with current prices and RSI values
        """
        print("📋 Updating Index RSI Data...")

        indices = ['^GSPC', '^IXIC', '^FTSE', '^GDAXI']
        index_names = ['S&P 500', 'NASDAQ', 'FTSE', 'DAX']

        for symbol, name in zip(indices, index_names):
            print(f"Testing {name}...")

            # Check cache first
            current_time = time.time()
            if symbol in self.index_data:
                cache_age = current_time - self.index_data[symbol]['last_updated']
                if cache_age < self.CACHE_EXPIRY:
                    print(f"📋 Using cached data for {name} (age: {cache_age/60:.1f} min)")
                    cached = self.index_data[symbol]
                    print(f"📊 {name} - Current: {cached['current']:.2f} | RSI(14): {cached['rsi']:.2f}")
                    continue

            # Fetch fresh data
            print(f"📋 Fetching fresh data for {name}")
            try:
                data = self.get_yf_historical_data(symbol, '90d')
                if not data.empty:
                    rsi = self.calculate_yf_rsi(data['Close'].tolist(), 14)
                    current = data['Close'].iloc[-1]

                    # Cache the results
                    self.index_data[symbol] = {
                        'rsi': rsi,
                        'current': current,
                        'last_updated': current_time
                    }

                    print(f"📊 {name} - Current: {current:.2f} | RSI(14): {rsi:.2f}")
            except Exception as e:
                print(f"❌ Error updating {name}: {e}")

        return self.index_data


    # ==========================================
    # BOT ORCHESTRATION
    # ==========================================

    # Main Coordination Logic
    # ======================
    async def orchestrator(self):
        """Orchestrator function that coordinates all bot functions"""
        self.log("🤖 Starting IBKR Bot Orchestrator")
        self.log("=" * 50)

        # Step 1: Connect to IB
        self.log("📋 Step 1: Connecting to Interactive Brokers...")
        if not await self.connect_to_ib():
            self.log("❌ Failed to connect to IB - exiting")
            return

        try:
            # Step 2: Test account functions
            self.log("📋 Step 2: Testing Account Functions...")

            self.log("📋 Testing Account Summary...")
            await self.get_account_summary()

            self.log("📋 Testing Account Balance...")
            balance = await self.get_account_balance()
            self.log(f"💵 Account Balance: ${balance:.2f}")

            self.log("📋 Testing Positions...")
            positions = await self.get_positions()
            self.log(f"📊 Found {len(positions)} positions")

            self.log("📋 Testing Tickers Configuration...")
            for ticker, config in self.TICKERS.items():
                self.log(f"💰 {ticker}: {config['name']} - Contract: {config['contract']}")

            self.log("📋 Testing Market Data Functions...")

            # Test current price first
            self.log("Testing get_current_price()...")
            lloy_current = await self.get_current_price('LLOY')
            self.log(f"💰 LLOY Current Price: {lloy_current if lloy_current else 'No data'} GBP")

            tsla_current = await self.get_current_price('TSLA')
            self.log(f"💰 TSLA Current Price: {tsla_current if tsla_current else 'No data'} USD")

            # Test historical data
            self.log("Testing get_historical_data()...")
            lloy_bars = await self.get_historical_data('LLOY', '90 D', '1 day')
            self.log(f"📊 LLOY Historical: {len(lloy_bars)} bars (90 D)")

            if lloy_bars:
                lloy_vwap = self.calculate_vwap(lloy_bars)
                lloy_rsi = self.calculate_rsi(lloy_bars, 14)
                self.log(f"📊 LLOY - Quarterly VWAP: {lloy_vwap:.4f} GBP | RSI(14): {lloy_rsi:.2f}")

            # Show first few bars of LLOY data
            if lloy_bars:
                self.log(f"📊 LLOY Sample Data (first 3 bars):")
                for i, bar in enumerate(lloy_bars[:3]):
                    self.log(f"   Bar {i+1}: Date={bar.date} Open={bar.open:.4f} High={bar.high:.4f} Low={bar.low:.4f} Close={bar.close:.4f} Volume={bar.volume}")

            self.log("✅ All functions tested successfully")

            # Step 3: Start Trading Strategy Loop (every 5 minutes)
            self.log("📋 Step 3: Starting Trading Strategy Loop...")
            self.log("🚀 Strategy: Price < VWAP AND Stock RSI < Index RSI - 5 (BUY)")
            self.log("🚀 Strategy: Profit >= 1.0% from entry (SELL)")
            self.log("⏰ Checking signals every 5 minutes...")

            try:
                while True:
                    self.log(f"🔄 Trading Signal Check - {datetime.now().strftime('%H:%M:%S')}")

                    # Update index RSI data (cached for 1 hour)
                    await self.update_index_rsi()

                    # Print account status
                    balance = await self.get_account_balance()
                    positions = await self.get_positions()
                    position_count = len(positions) if positions else 0

                    # Store account balance and positions for web interface
                    self.account_balance = balance
                    self.positions = positions

                    # Get total portfolio value from account summary
                    try:
                        summary = await self.get_account_summary()
                        if 'NetLiquidation' in summary:
                            self.portfolio_value = float(summary['NetLiquidation']['value'])
                        else:
                            self.portfolio_value = balance  # Fallback to cash only
                    except Exception as e:
                        self.log(f"❌ Could not get portfolio value: {e}")
                        self.portfolio_value = balance

                    self.log(f"💵 Account Balance: ${balance:.2f} | Available: ${balance:.2f} | Positions: {position_count} stocks")

                    # Check trading signals for each ticker
                    for ticker, config in self.TICKERS.items():
                        try:
                            # Get market data for status display
                            current_price = await self.get_current_price(ticker)
                            if current_price is None:
                                self.log(f"❌ {config['display']} - No price data available")
                                continue

                            # Cache current price for web interface
                            self.current_prices[ticker] = current_price

                            # Get historical data for calculations
                            bars = await self.get_historical_data(ticker, '90 D', '1 day')
                            if not bars:
                                self.log(f"❌ {config['display']} - No historical data available")
                                continue

                            vwap = self.calculate_vwap(bars)
                            stock_rsi = self.calculate_rsi(bars, 14)

                            # Get index data
                            index_symbol = config['index_symbol']
                            index_data = self.index_data.get(index_symbol, {})
                            index_rsi = index_data.get('rsi', 0)

                            # Determine index name and format indicators
                            index_names = {'^GSPC': 'S&P 500', '^FTSE': 'FTSE', '^GDAXI': 'DAX', '^IXIC': 'NASDAQ'}
                            index_name = index_names.get(index_symbol, index_symbol)

                            vwap_status = "🟢 BELOW" if current_price < vwap else "🔴 ABOVE"
                            rsi_diff = stock_rsi - index_rsi
                            rsi_status = "🟢 OVERSOLD" if stock_rsi < (index_rsi - 5) else "🔴 OVERBOUGHT" if stock_rsi > (index_rsi + 5) else "⚪ NEUTRAL"

                            # Check signals
                            should_buy, _ = await self.enhanced_buy_signal(ticker)
                            should_sell, _ = await self.enhanced_sell_signal(ticker)

                            # Format overall signal status
                            if should_buy:
                                signal_status = "🟢 BUY SIGNAL"
                            elif should_sell:
                                signal_status = "🔴 SELL SIGNAL"
                            else:
                                signal_status = "⚪ NO SIGNAL"

                            # Print status line
                            self.log(f"💰 {config['display']}: Price ${current_price:.2f} {vwap_status} VWAP ${vwap:.2f} ◆ Stock RSI: {stock_rsi:.1f} vs {index_name}: {index_rsi:.1f} ({rsi_diff:+.1f}) {rsi_status} ◆ {signal_status}")

                            # Execute trading actions
                            if should_buy:
                                self.log(f"🚀 {config['display']} BUY SIGNAL ACTIVE!")
                                success, message = await self.execute_buy(ticker, current_price)
                                if success:
                                    self.log(f"✅ {config['display']} buy order placed: {message}")
                                else:
                                    self.log(f"❌ {config['display']} buy failed: {message}")
                            elif should_sell:
                                self.log(f"🔴 {config['display']} SELL SIGNAL ACTIVE!")
                                success, message = await self.execute_sell(ticker, current_price)
                                if success:
                                    self.log(f"✅ {config['display']} sell order placed: {message}")
                                else:
                                    self.log(f"❌ {config['display']} sell failed: {message}")

                        except Exception as e:
                            self.log(f"❌ Error checking signals for {ticker}: {e}")

                    self.log("⏰ Next signal check in 30 seconds...")
                    await asyncio.sleep(30)  # 30 seconds

            except KeyboardInterrupt:
                print("\n🛑 Trading loop stopped by user")

        except Exception as e:
            print(f"❌ Error in orchestrator: {e}")
        finally:
            # Step 4: Disconnect
            print("\n📋 Step 4: Disconnecting...")
            await self.disconnect_from_ib()


if __name__ == "__main__":
    bot = IBKRBot()

    # Run the orchestrator
    asyncio.run(bot.orchestrator())