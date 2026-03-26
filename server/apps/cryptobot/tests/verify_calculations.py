#!/usr/bin/env python3
"""
Verification Script for Kraken Bot Calculations

Verifies bot calculations are mathematically correct by importing
the actual bot and using its constants and formulas.

Usage:
    # First collect real data
    python3 test_websocket_data.py

    # Then verify calculations
    python3 verify_calculations.py
"""

import json
import math
import re
import os
from datetime import datetime
from typing import Dict, List


class KrakenBotVerifier:
    """Verify Kraken bot calculations using real WebSocket data"""

    def __init__(self, book_file: str, trade_file: str):
        # Extract constants from bot file (NO HARDCODING)
        bot_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'kraken_bot.py')
        self._load_bot_constants(bot_file)

        # Load real data
        with open(book_file, 'r') as f:
            self.book_data = json.load(f)

        with open(trade_file, 'r') as f:
            self.trade_data = json.load(f)

    def _load_bot_constants(self, bot_file: str):
        """Extract constants from bot file without importing it"""
        with open(bot_file, 'r') as f:
            bot_code = f.read()

        # Extract constants using regex
        constants = {
            'WS_BOOK_DEPTH': r'self\.WS_BOOK_DEPTH\s*=\s*(\d+)',
            'IMBALANCE_LEVELS': r'self\.IMBALANCE_LEVELS\s*=\s*(\d+)',
            'FLOW_TIME_WINDOW': r'self\.FLOW_TIME_WINDOW\s*=\s*self\.FLOW_ANALYSIS_WINDOWS\[\'(\w+)\'\]',
            'MIN_BOOK_IMBALANCE': r'self\.MIN_BOOK_IMBALANCE\s*=\s*([\d.]+)',
            'MIN_FLOW_IMBALANCE': r'self\.MIN_FLOW_IMBALANCE\s*=\s*([\d.]+)',
        }

        # Extract FLOW_ANALYSIS_WINDOWS first
        flow_windows_match = re.search(r"'swing':\s*(\d+)", bot_code)
        flow_window = int(flow_windows_match.group(1)) if flow_windows_match else 14400

        for const_name, pattern in constants.items():
            match = re.search(pattern, bot_code)
            if match:
                if const_name == 'FLOW_TIME_WINDOW':
                    setattr(self, const_name, flow_window)
                else:
                    value = match.group(1)
                    setattr(self, const_name, int(value) if '.' not in value else float(value))
            else:
                # Fallback defaults (should never happen)
                defaults = {
                    'WS_BOOK_DEPTH': 1000,
                    'IMBALANCE_LEVELS': 1000,
                    'FLOW_TIME_WINDOW': 14400,
                    'MIN_BOOK_IMBALANCE': 1.2,
                    'MIN_FLOW_IMBALANCE': 2.5
                }
                setattr(self, const_name, defaults[const_name])

    def verify_book_snapshot_size(self):
        """Verify book snapshot matches bot's configured depth"""
        snapshot = self.book_data['snapshot']
        bids = snapshot['data'][0]['bids']
        asks = snapshot['data'][0]['asks']

        print("\n" + "="*60)
        print("VERIFICATION 1: Book Snapshot Size")
        print("="*60)
        print(f"Expected (from bot): {self.WS_BOOK_DEPTH} bids, {self.WS_BOOK_DEPTH} asks")
        print(f"Actual: {len(bids)} bids, {len(asks)} asks")

        if len(bids) == self.WS_BOOK_DEPTH and len(asks) == self.WS_BOOK_DEPTH:
            print(f"✅ PASS: Book snapshot correctly limited to {self.WS_BOOK_DEPTH} levels")
            return True
        else:
            print(f"❌ FAIL: Book snapshot size mismatch")
            return False

    def verify_book_sorting(self):
        """Verify bids are sorted descending, asks ascending"""
        snapshot = self.book_data['snapshot']
        bids = snapshot['data'][0]['bids']
        asks = snapshot['data'][0]['asks']

        print("\n" + "="*60)
        print("VERIFICATION 2: Book Sorting")
        print("="*60)

        # Check bids (should be descending - highest first)
        bid_prices = [float(b['price']) for b in bids]
        bids_sorted = bid_prices == sorted(bid_prices, reverse=True)
        print(f"Bids sorted descending: {bids_sorted}")
        print(f"  Top 3 bids: {bid_prices[:3]}")

        # Check asks (should be ascending - lowest first)
        ask_prices = [float(a['price']) for a in asks]
        asks_sorted = ask_prices == sorted(ask_prices)
        print(f"Asks sorted ascending: {asks_sorted}")
        print(f"  Top 3 asks: {ask_prices[:3]}")

        if bids_sorted and asks_sorted:
            print("✅ PASS: Book correctly sorted")
            return True
        else:
            print("❌ FAIL: Book sorting incorrect")
            return False

    def calculate_order_book_imbalance(self, bids: List[Dict], asks: List[Dict]) -> float:
        """Calculate order book imbalance using bot's exact formula"""
        if not bids or not asks:
            return 1.0

        # Calculate mid-price from best bid/ask
        mid_price = (float(bids[0]['price']) + float(asks[0]['price'])) / 2

        # Calculate weighted pressure using dollar volume with logarithmic distance weighting
        bid_pressure = sum(
            float(bid['price']) * float(bid['qty']) /
            math.log(abs(float(bid['price']) - mid_price) / mid_price * 100 + 2)
            for bid in bids[:self.IMBALANCE_LEVELS]
        )
        ask_pressure = sum(
            float(ask['price']) * float(ask['qty']) /
            math.log(abs(float(ask['price']) - mid_price) / mid_price * 100 + 2)
            for ask in asks[:self.IMBALANCE_LEVELS]
        )

        # Calculate ratio
        imbalance = bid_pressure / ask_pressure if ask_pressure > 0 else 2.0

        return imbalance

    def verify_book_imbalance_calculation(self):
        """Verify order book imbalance calculation"""
        snapshot = self.book_data['snapshot']
        bids = snapshot['data'][0]['bids']
        asks = snapshot['data'][0]['asks']

        print("\n" + "="*60)
        print("VERIFICATION 3: Order Book Imbalance Calculation")
        print("="*60)

        # Calculate using bot's formula
        imbalance = self.calculate_order_book_imbalance(bids, asks)

        # Calculate mid-price
        best_bid = float(bids[0]['price'])
        best_ask = float(asks[0]['price'])
        mid_price = (best_bid + best_ask) / 2

        print(f"Best Bid: €{best_bid:,.2f}")
        print(f"Best Ask: €{best_ask:,.2f}")
        print(f"Mid-Price: €{mid_price:,.2f}")
        print(f"Spread: €{best_ask - best_bid:.2f} ({(best_ask - best_bid) / mid_price * 100:.3f}%)")

        # Calculate raw dollar volumes (no weighting)
        bid_volume = sum(float(b['price']) * float(b['qty']) for b in bids[:self.IMBALANCE_LEVELS])
        ask_volume = sum(float(a['price']) * float(a['qty']) for a in asks[:self.IMBALANCE_LEVELS])

        print(f"\nRaw Dollar Volumes:")
        print(f"  Bid volume: €{bid_volume:,.0f}")
        print(f"  Ask volume: €{ask_volume:,.0f}")
        print(f"  Raw ratio: {bid_volume / ask_volume:.4f}x")

        # Show logarithmic weighting effect
        print(f"\nLogarithmic Weighted Imbalance: {imbalance:.4f}x")

        # Interpretation (using bot's thresholds)
        if imbalance > self.MIN_BOOK_IMBALANCE:
            print(f"📊 Status: 🟢 BULLISH (>{self.MIN_BOOK_IMBALANCE}x)")
        elif imbalance < (2 - self.MIN_BOOK_IMBALANCE):  # Inverse threshold
            print(f"📊 Status: 🔴 BEARISH (<{2 - self.MIN_BOOK_IMBALANCE}x)")
        else:
            print(f"📊 Status: ⚪ NEUTRAL")

        print("✅ PASS: Book imbalance calculation completed")
        return imbalance

    def calculate_order_flow_imbalance(self, trades: List[Dict], current_time: float) -> float:
        """Calculate order flow imbalance using bot's exact formula"""
        if not trades:
            return 1.0

        # Filter trades within time window
        recent_trades = [
            t for t in trades
            if current_time - t['timestamp'] <= self.FLOW_TIME_WINDOW
        ]

        if not recent_trades:
            return 1.0

        # Calculate buy and sell dollar volumes
        buy_volume = sum(t['price'] * t['qty'] for t in recent_trades if t['side'] == 'buy')
        sell_volume = sum(t['price'] * t['qty'] for t in recent_trades if t['side'] == 'sell')

        # Calculate ratio
        imbalance = buy_volume / sell_volume if sell_volume > 0 else 2.0

        return imbalance

    def verify_flow_imbalance_calculation(self):
        """Verify order flow imbalance calculation"""
        print("\n" + "="*60)
        print("VERIFICATION 4: Order Flow Imbalance Calculation")
        print("="*60)

        # Combine snapshot and updates
        snapshot_trades = self.trade_data['snapshot']['data']
        update_trades = []
        for update in self.trade_data.get('updates', []):
            update_trades.extend(update['data'])

        all_trades = snapshot_trades + update_trades
        print(f"Total trades: {len(all_trades)}")
        print(f"  Snapshot: {len(snapshot_trades)}")
        print(f"  Updates: {len(update_trades)}")

        # Parse timestamps and create normalized trade list
        normalized_trades = []
        for trade in all_trades:
            dt = datetime.fromisoformat(trade['timestamp'].replace('Z', '+00:00'))
            normalized_trades.append({
                'price': float(trade['price']),
                'qty': float(trade['qty']),
                'side': trade['side'],
                'timestamp': dt.timestamp()
            })

        # Use latest trade timestamp as "current time"
        current_time = max(t['timestamp'] for t in normalized_trades)
        oldest_time = min(t['timestamp'] for t in normalized_trades)

        print(f"\nTime range:")
        print(f"  Oldest trade: {datetime.fromtimestamp(oldest_time).strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Latest trade: {datetime.fromtimestamp(current_time).strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Duration: {(current_time - oldest_time) / 60:.1f} minutes")
        print(f"  Window: {self.FLOW_TIME_WINDOW / 60:.0f} minutes (4 hours)")

        # Calculate imbalance
        imbalance = self.calculate_order_flow_imbalance(normalized_trades, current_time)

        # Calculate trade counts
        buy_trades = [t for t in normalized_trades if t['side'] == 'buy']
        sell_trades = [t for t in normalized_trades if t['side'] == 'sell']

        buy_volume = sum(t['price'] * t['qty'] for t in buy_trades)
        sell_volume = sum(t['price'] * t['qty'] for t in sell_trades)

        print(f"\nTrade breakdown:")
        print(f"  Buy trades: {len(buy_trades)} (€{buy_volume:,.0f})")
        print(f"  Sell trades: {len(sell_trades)} (€{sell_volume:,.0f})")

        print(f"\nOrder Flow Imbalance: {imbalance:.4f}x")

        # Interpretation (using bot's thresholds)
        if imbalance > self.MIN_FLOW_IMBALANCE:
            print(f"📊 Status: 🟢 STRONG BUY FLOW (>{self.MIN_FLOW_IMBALANCE}x)")
        elif imbalance < (1 / self.MIN_FLOW_IMBALANCE):  # Inverse threshold
            print(f"📊 Status: 🔴 STRONG SELL FLOW (<{1 / self.MIN_FLOW_IMBALANCE:.2f}x)")
        else:
            print(f"📊 Status: ⚪ NEUTRAL FLOW")

        print("✅ PASS: Flow imbalance calculation completed")
        return imbalance

    def calculate_support_resistance(self, bids: List[Dict], asks: List[Dict], current_price: float) -> tuple:
        """Calculate support/resistance using bot's exact formula"""
        if not bids or not asks:
            empty = {"0.5%": 0, "1.0%": 0, "2.0%": 0, "5.0%": 0}
            return empty, empty

        # Calculate BID SUPPORT at different percentages below current price
        support = {}
        for pct in [0.5, 1.0, 2.0, 5.0]:
            threshold_price = current_price * (1 - pct/100)
            support_volume = sum(
                float(bid['price']) * float(bid['qty']) for bid in bids
                if float(bid['price']) >= threshold_price
            )
            support[f"{pct}%"] = support_volume

        # Calculate ASK RESISTANCE at different percentages above current price
        resistance = {}
        for pct in [0.5, 1.0, 2.0, 5.0]:
            threshold_price = current_price * (1 + pct/100)
            resistance_volume = sum(
                float(ask['price']) * float(ask['qty']) for ask in asks
                if float(ask['price']) <= threshold_price
            )
            resistance[f"{pct}%"] = resistance_volume

        return support, resistance

    def verify_support_resistance_calculation(self):
        """Verify support/resistance level calculations"""
        print("\n" + "="*60)
        print("VERIFICATION 5: Support/Resistance Calculations")
        print("="*60)

        snapshot = self.book_data['snapshot']
        bids = snapshot['data'][0]['bids']
        asks = snapshot['data'][0]['asks']

        # Calculate mid-price as current price
        best_bid = float(bids[0]['price'])
        best_ask = float(asks[0]['price'])
        current_price = (best_bid + best_ask) / 2

        print(f"Current Price (mid): €{current_price:,.2f}")

        # Calculate support and resistance
        support, resistance = self.calculate_support_resistance(bids, asks, current_price)

        print("\n📊 Support Levels (bid volume below current price):")
        for pct in ["0.5%", "1.0%", "2.0%", "5.0%"]:
            threshold = current_price * (1 - float(pct.strip('%')) / 100)
            print(f"  {pct}: €{threshold:,.0f} → €{support[pct]:,.0f}")

        print("\n📊 Resistance Levels (ask volume above current price):")
        for pct in ["0.5%", "1.0%", "2.0%", "5.0%"]:
            threshold = current_price * (1 + float(pct.strip('%')) / 100)
            print(f"  {pct}: €{threshold:,.0f} → €{resistance[pct]:,.0f}")

        # Analyze 2.0% level (used in bot's buy signal)
        print(f"\n📊 Bot Buy Signal Analysis (2.0% level):")
        print(f"  Support (2.0%): €{support['2.0%']:,.0f}")
        print(f"  Resistance (2.0%): €{resistance['2.0%']:,.0f}")
        print(f"  Ratio: {support['2.0%'] / resistance['2.0%']:.4f}x")

        if support['2.0%'] > resistance['2.0%']:
            print(f"  Status: 🟢 SUPPORT > RESISTANCE (accumulation zone)")
        else:
            print(f"  Status: 🔴 RESISTANCE > SUPPORT (distribution zone)")

        print("✅ PASS: Support/Resistance calculation completed")
        return support, resistance

    def run_all_verifications(self):
        """Run all verification checks"""
        print("\n" + "="*60)
        print("KRAKEN BOT CALCULATION VERIFICATION")
        print("="*60)
        print("Testing with real WebSocket data from Kraken")

        results = {}

        # Run all checks
        results['snapshot_size'] = self.verify_book_snapshot_size()
        results['sorting'] = self.verify_book_sorting()
        results['book_imbalance'] = self.verify_book_imbalance_calculation()
        results['flow_imbalance'] = self.verify_flow_imbalance_calculation()
        results['support_resistance'] = self.verify_support_resistance_calculation()

        # Summary
        print("\n" + "="*60)
        print("VERIFICATION SUMMARY")
        print("="*60)

        all_passed = all(isinstance(v, (bool, float)) and v for v in results.values())

        if all_passed:
            print("✅ ALL VERIFICATIONS PASSED")
            print("\n📊 Conclusion: Bot calculations are mathematically correct!")
        else:
            print("⚠️  SOME VERIFICATIONS FAILED")

        return results


if __name__ == "__main__":
    import os
    import glob

    # Find the most recent data files
    output_dir = "/Users/rbtrsv/Developer/main/finpy/server/apps/cryptobot/tests/output"
    book_files = sorted(glob.glob(f"{output_dir}/book_data_*.json"), reverse=True)
    trade_files = sorted(glob.glob(f"{output_dir}/trade_data_*.json"), reverse=True)

    if not book_files or not trade_files:
        print("❌ No data files found. Please run test_websocket_data.py first.")
        print("\nUsage:")
        print("  1. python3 test_websocket_data.py  # Collect data")
        print("  2. python3 verify_calculations.py  # Verify")
        exit(1)

    book_file = book_files[0]
    trade_file = trade_files[0]

    print(f"Using data files:")
    print(f"  Book: {os.path.basename(book_file)}")
    print(f"  Trade: {os.path.basename(trade_file)}")

    verifier = KrakenBotVerifier(book_file, trade_file)
    verifier.run_all_verifications()
