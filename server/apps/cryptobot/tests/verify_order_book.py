#!/usr/bin/env python3
"""
Order Book Imbalance Verification - Complete Analysis

This script:
1. Downloads a fresh order book snapshot from Kraken (1000 levels)
2. Saves it as JSON
3. Calculates order book imbalance using the same formula as the bot
4. Performs deep analysis: raw volumes, weighted volumes, layer-by-layer breakdown
5. Verifies calculations are aligned with the bot

Formula (from kraken_bot.py lines 864-906):
- Uses logarithmic distance weighting: weight = 1 / log(distance_pct + 2)
- Uses dollar volume: price × qty
- Imbalance = weighted_bid_volume / weighted_ask_volume
"""

import asyncio
import websockets
import json
import math
from datetime import datetime
from pathlib import Path


class OrderBookVerifier:
    """Verifies order book imbalance calculations match the bot's implementation"""

    def __init__(self):
        self.WS_URL = "wss://ws.kraken.com/v2"
        self.IMBALANCE_LEVELS = 1000  # Same as bot
        self.order_book = None

    async def download_order_book_snapshot(self, symbol: str = "BTC/EUR"):
        """Download fresh 1000-level order book snapshot from Kraken"""
        print(f"🔌 Connecting to Kraken WebSocket...")

        async with websockets.connect(self.WS_URL) as ws:
            # Subscribe to 1000-level order book
            subscribe_msg = {
                "method": "subscribe",
                "params": {
                    "channel": "book",
                    "symbol": [symbol],
                    "depth": 1000,  # Request 1000 levels
                    "snapshot": True
                }
            }
            await ws.send(json.dumps(subscribe_msg))
            print(f"📊 Subscribed to {symbol} order book (1000 levels)")

            # Wait for snapshot message
            async for message in ws:
                data = json.loads(message)

                # Look for snapshot message
                if data.get('channel') == 'book' and data.get('type') == 'snapshot':
                    book_data = data['data'][0]

                    if book_data['symbol'] == symbol:
                        self.order_book = {
                            'symbol': symbol,
                            'timestamp': datetime.now().isoformat(),
                            'bids': book_data['bids'][:self.IMBALANCE_LEVELS],
                            'asks': book_data['asks'][:self.IMBALANCE_LEVELS]
                        }

                        print(f"✅ Received snapshot: {len(self.order_book['bids'])} bids, {len(self.order_book['asks'])} asks")
                        return self.order_book

    def save_snapshot(self, filename: str = None):
        """Save order book snapshot to JSON file"""
        if not self.order_book:
            print("❌ No order book data to save")
            return None

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"order_book_snapshot_{timestamp}.json"

        filepath = Path(__file__).parent / "output" / filename
        filepath.parent.mkdir(exist_ok=True)

        with open(filepath, 'w') as f:
            json.dump(self.order_book, f, indent=2)

        print(f"💾 Saved snapshot to: {filepath}")
        return filepath

    def load_snapshot(self, filepath: str):
        """Load order book snapshot from JSON file"""
        with open(filepath, 'r') as f:
            self.order_book = json.load(f)

        print(f"📂 Loaded snapshot: {len(self.order_book['bids'])} bids, {len(self.order_book['asks'])} asks")
        return self.order_book

    def analyze_order_book(self, detailed: bool = True):
        """
        Perform comprehensive analysis of order book

        Includes:
        1. Raw volumes (no weighting)
        2. Weighted volumes (bot's method)
        3. Layer-by-layer breakdown (if detailed=True)
        4. Distance distribution (if detailed=True)
        """
        if not self.order_book:
            print("❌ No order book data loaded")
            return None

        bids = self.order_book['bids']
        asks = self.order_book['asks']

        # Calculate mid price
        best_bid = float(bids[0]['price'])
        best_ask = float(asks[0]['price'])
        mid_price = (best_bid + best_ask) / 2

        print("\n" + "=" * 80)
        print("ORDER BOOK ANALYSIS")
        print("=" * 80)
        print(f"\n📊 Market Info:")
        print(f"   Symbol: {self.order_book['symbol']}")
        print(f"   Timestamp: {self.order_book['timestamp']}")
        print(f"   Best Bid: €{best_bid:,.2f}")
        print(f"   Best Ask: €{best_ask:,.2f}")
        print(f"   Mid Price: €{mid_price:,.2f}")
        print(f"   Spread: €{best_ask - best_bid:.2f} ({((best_ask - best_bid) / mid_price * 100):.4f}%)")
        print(f"   Levels: {len(bids)} bids, {len(asks)} asks")

        # =====================================================================
        # ANALYSIS 1: RAW VOLUMES (No weighting)
        # =====================================================================
        print("\n" + "=" * 80)
        print("1️⃣  RAW VOLUMES (Simple Sum - No Weighting)")
        print("=" * 80)

        total_bid_btc = sum(float(bid['qty']) for bid in bids)
        total_ask_btc = sum(float(ask['qty']) for ask in asks)
        total_bid_eur = sum(float(bid['price']) * float(bid['qty']) for bid in bids)
        total_ask_eur = sum(float(ask['price']) * float(ask['qty']) for ask in asks)

        raw_imbalance_eur = total_bid_eur / total_ask_eur if total_ask_eur > 0 else 0

        print(f"\n📈 BTC Volume:")
        print(f"   Total Bid Volume: {total_bid_btc:.8f} BTC")
        print(f"   Total Ask Volume: {total_ask_btc:.8f} BTC")
        print(f"   Raw Imbalance (BTC): {total_bid_btc / total_ask_btc:.2f}x" if total_ask_btc > 0 else "   N/A")

        print(f"\n💰 EUR Volume:")
        print(f"   Total Bid Volume: €{total_bid_eur:,.2f}")
        print(f"   Total Ask Volume: €{total_ask_eur:,.2f}")
        print(f"   Raw Imbalance (EUR): {raw_imbalance_eur:.2f}x")

        # =====================================================================
        # ANALYSIS 2: LOGARITHMIC WEIGHTED VOLUMES (Bot's method)
        # =====================================================================
        print("\n" + "=" * 80)
        print("2️⃣  LOGARITHMIC WEIGHTED VOLUMES (Bot's Method)")
        print("=" * 80)

        weighted_bid_volume = 0
        weighted_ask_volume = 0

        # Calculate weighted bid volume
        for bid in bids:
            bid_price = float(bid['price'])
            bid_qty = float(bid['qty'])
            distance_pct = abs(bid_price - mid_price) / mid_price * 100
            weight = 1 / math.log(distance_pct + 2)
            weighted_bid_volume += bid_price * bid_qty * weight

        # Calculate weighted ask volume
        for ask in asks:
            ask_price = float(ask['price'])
            ask_qty = float(ask['qty'])
            distance_pct = abs(ask_price - mid_price) / mid_price * 100
            weight = 1 / math.log(distance_pct + 2)
            weighted_ask_volume += ask_price * ask_qty * weight

        weighted_imbalance = weighted_bid_volume / weighted_ask_volume if weighted_ask_volume > 0 else 0

        print(f"\n💰 Weighted EUR Volume:")
        print(f"   Weighted Bid Volume: €{weighted_bid_volume:,.2f}")
        print(f"   Weighted Ask Volume: €{weighted_ask_volume:,.2f}")
        print(f"   Weighted Imbalance: {weighted_imbalance:.2f}x")

        # Interpret result
        if weighted_imbalance > 1.2:
            sentiment = "🟢 BULLISH"
        elif weighted_imbalance < 0.8:
            sentiment = "🔴 BEARISH"
        else:
            sentiment = "⚪ NEUTRAL"

        print(f"   Sentiment: {sentiment}")

        # =====================================================================
        # ANALYSIS 3: COMPARISON
        # =====================================================================
        print("\n" + "=" * 80)
        print("3️⃣  COMPARISON: Raw vs Weighted")
        print("=" * 80)

        print(f"\n   Raw Imbalance (EUR):      {raw_imbalance_eur:.2f}x")
        print(f"   Weighted Imbalance (EUR): {weighted_imbalance:.2f}x")
        print(f"   Difference: {abs(raw_imbalance_eur - weighted_imbalance):.2f}x")

        if raw_imbalance_eur < 1.0 and weighted_imbalance < 1.0:
            print(f"\n   ✅ Both methods agree: MORE SELL PRESSURE (asks > bids)")
        elif raw_imbalance_eur > 1.0 and weighted_imbalance > 1.0:
            print(f"\n   ✅ Both methods agree: MORE BUY PRESSURE (bids > asks)")
        else:
            print(f"\n   ⚠️  Methods disagree - weighting is significantly changing the result!")

        # =====================================================================
        # DETAILED ANALYSIS (if requested)
        # =====================================================================
        if detailed:
            # Layer-by-layer breakdown
            print("\n" + "=" * 80)
            print("4️⃣  LAYER-BY-LAYER BREAKDOWN (First 10 Levels)")
            print("=" * 80)

            print("\n📊 BIDS (Buy Orders):")
            print(f"{'Level':<6} {'Price':<12} {'Qty':<12} {'EUR Vol':<15} {'Distance%':<12} {'Weight':<10} {'Weighted':<15}")
            print("-" * 100)

            for i in range(min(10, len(bids))):
                bid_price = float(bids[i]['price'])
                bid_qty = float(bids[i]['qty'])
                eur_vol = bid_price * bid_qty
                distance_pct = abs(bid_price - mid_price) / mid_price * 100
                weight = 1 / math.log(distance_pct + 2)
                weighted = eur_vol * weight

                print(f"{i+1:<6} €{bid_price:<11,.2f} {bid_qty:<12.8f} €{eur_vol:<14,.2f} {distance_pct:<11.3f}% {weight:<9.4f} €{weighted:<14,.2f}")

            print("\n📊 ASKS (Sell Orders):")
            print(f"{'Level':<6} {'Price':<12} {'Qty':<12} {'EUR Vol':<15} {'Distance%':<12} {'Weight':<10} {'Weighted':<15}")
            print("-" * 100)

            for i in range(min(10, len(asks))):
                ask_price = float(asks[i]['price'])
                ask_qty = float(asks[i]['qty'])
                eur_vol = ask_price * ask_qty
                distance_pct = abs(ask_price - mid_price) / mid_price * 100
                weight = 1 / math.log(distance_pct + 2)
                weighted = eur_vol * weight

                print(f"{i+1:<6} €{ask_price:<11,.2f} {ask_qty:<12.8f} €{eur_vol:<14,.2f} {distance_pct:<11.3f}% {weight:<9.4f} €{weighted:<14,.2f}")

            # Distance distribution
            print("\n" + "=" * 80)
            print("5️⃣  DISTANCE DISTRIBUTION (How far are orders from mid price?)")
            print("=" * 80)

            buckets = [
                (0, 0.5, "0-0.5%"),
                (0.5, 1.0, "0.5-1.0%"),
                (1.0, 2.0, "1.0-2.0%"),
                (2.0, 5.0, "2.0-5.0%"),
                (5.0, float('inf'), ">5.0%")
            ]

            print("\n📊 BIDS Distribution:")
            for min_dist, max_dist, label in buckets:
                count = 0
                total_eur = 0

                for bid in bids:
                    bid_price = float(bid['price'])
                    bid_qty = float(bid['qty'])
                    distance_pct = abs(bid_price - mid_price) / mid_price * 100

                    if min_dist <= distance_pct < max_dist:
                        count += 1
                        total_eur += bid_price * bid_qty

                print(f"   {label:<10}: {count:>4} levels, €{total_eur:>15,.2f}")

            print("\n📊 ASKS Distribution:")
            for min_dist, max_dist, label in buckets:
                count = 0
                total_eur = 0

                for ask in asks:
                    ask_price = float(ask['price'])
                    ask_qty = float(ask['qty'])
                    distance_pct = abs(ask_price - mid_price) / mid_price * 100

                    if min_dist <= distance_pct < max_dist:
                        count += 1
                        total_eur += ask_price * ask_qty

                print(f"   {label:<10}: {count:>4} levels, €{total_eur:>15,.2f}")

        # =====================================================================
        # FINAL VERDICT
        # =====================================================================
        print("\n" + "=" * 80)
        print("✅ FINAL VERDICT")
        print("=" * 80)

        print(f"\n📊 Result: Book Imbalance = {weighted_imbalance:.2f}x {sentiment}")

        if weighted_imbalance < 1.0:
            print(f"   This means: {weighted_ask_volume / weighted_bid_volume:.2f}x more weighted sell volume than buy volume")
        elif weighted_imbalance > 1.0:
            print(f"   This means: {weighted_bid_volume / weighted_ask_volume:.2f}x more weighted buy volume than sell volume")

        print(f"\n💡 Interpretation:")
        print(f"   - Raw EUR imbalance: {raw_imbalance_eur:.2f}x")
        print(f"   - Weighted EUR imbalance: {weighted_imbalance:.2f}x")

        if abs(raw_imbalance_eur - weighted_imbalance) > 0.2:
            print(f"   ⚠️  Logarithmic weighting significantly changes the result!")
            print(f"   This is EXPECTED - weighting gives more importance to orders closer to mid price.")
        else:
            print(f"   ✅ Logarithmic weighting has moderate effect - results are consistent.")

        print(f"\n🤖 Compare with bot output:")
        print(f"   Bot shows: 'Book 0.XX x' - should match: {weighted_imbalance:.2f}x")
        print(f"   If values match within ±0.05x, calculations are aligned! ✅")

        print("\n" + "=" * 80)

        return {
            'mid_price': mid_price,
            'best_bid': best_bid,
            'best_ask': best_ask,
            'spread': best_ask - best_bid,
            'spread_pct': (best_ask - best_bid) / mid_price * 100,
            'raw_bid_volume': total_bid_eur,
            'raw_ask_volume': total_ask_eur,
            'raw_imbalance': raw_imbalance_eur,
            'weighted_bid_volume': weighted_bid_volume,
            'weighted_ask_volume': weighted_ask_volume,
            'weighted_imbalance': weighted_imbalance,
            'sentiment': sentiment
        }


async def main():
    """Main function to download snapshot and perform analysis"""

    print("=" * 80)
    print("ORDER BOOK IMBALANCE VERIFICATION - COMPLETE ANALYSIS")
    print("=" * 80)

    verifier = OrderBookVerifier()

    # Download fresh snapshot from Kraken
    print("\n1️⃣  Downloading fresh order book snapshot from Kraken...")
    await verifier.download_order_book_snapshot(symbol="BTC/EUR")

    # Save snapshot
    filepath = verifier.save_snapshot()

    # Perform complete analysis
    print("\n2️⃣  Performing complete order book analysis...")
    result = verifier.analyze_order_book(detailed=True)

    # Optional: Load from existing file instead
    # verifier.load_snapshot("output/order_book_snapshot_20251006_200000.json")
    # result = verifier.analyze_order_book(detailed=True)


if __name__ == "__main__":
    asyncio.run(main())
