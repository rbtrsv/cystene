#!/usr/bin/env python3
"""
WebSocket Data Collection Test

Collects real order book and trade data from Kraken WebSocket API
for verification testing.
"""

import asyncio
import json
import websockets
from datetime import datetime


async def collect_websocket_data(duration_seconds=30):
    """Collect order book and trade data from Kraken WebSocket"""

    WS_URL = "wss://ws.kraken.com/v2"
    symbol = "BTC/EUR"

    # Storage for collected data
    book_data = {
        'snapshot': None,
        'updates': [],
        'total_updates': 0
    }

    trade_data = {
        'snapshot': None,
        'updates': [],
        'total_updates': 0
    }

    stats = {
        'book_snapshot_received': False,
        'book_snapshot_size': {'bids': 0, 'asks': 0},
        'book_updates_count': 0,
        'trade_snapshot_received': False,
        'trade_snapshot_size': 0,
        'trade_updates_count': 0,
        'start_time': None,
        'end_time': None
    }

    print(f"\n🚀 Starting data collection for {duration_seconds} seconds (quick test)...\n")

    # Task to collect order book data
    async def collect_book_data():
        try:
            print("📊 Connecting to Kraken WebSocket for order book...")
            async with websockets.connect(WS_URL) as ws:
                # Subscribe to order book
                book_sub = {
                    "method": "subscribe",
                    "params": {
                        "channel": "book",
                        "symbol": [symbol],
                        "depth": 1000,
                        "snapshot": True
                    }
                }
                await ws.send(json.dumps(book_sub))
                print(f"✅ Subscribed to book channel for {symbol} (depth=1000)")

                update_count = 0
                start_time = datetime.now()
                stats['start_time'] = start_time.isoformat()

                async for message in ws:
                    data = json.loads(message)

                    # Handle subscription confirmation
                    if data.get('method') == 'subscribe':
                        print(f"📋 Subscription confirmed: {data}")
                        continue

                    if data.get('channel') == 'book':
                        if data['type'] == 'snapshot':
                            book_data['snapshot'] = data
                            stats['book_snapshot_received'] = True
                            bids = len(data['data'][0]['bids'])
                            asks = len(data['data'][0]['asks'])
                            stats['book_snapshot_size'] = {'bids': bids, 'asks': asks}
                            print(f"📸 Book snapshot received: {bids} bids, {asks} asks")

                        elif data['type'] == 'update':
                            book_data['updates'].append(data)
                            update_count += 1
                            stats['book_updates_count'] = update_count

                            # Print progress every 10 updates
                            if update_count % 10 == 0:
                                print(f"📊 Received {update_count} book updates...")

                    # Stop after duration
                    if (datetime.now() - start_time).total_seconds() >= duration_seconds:
                        print(f"\n⏰ {duration_seconds} seconds elapsed. Stopping order book collection.")
                        stats['end_time'] = datetime.now().isoformat()
                        book_data['total_updates'] = update_count
                        break

        except Exception as e:
            print(f"❌ Error collecting book data: {e}")

    # Task to collect trade data
    async def collect_trade_data():
        try:
            print("📊 Connecting to Kraken WebSocket for order flow...")
            async with websockets.connect(WS_URL) as ws:
                # Subscribe to trades
                trade_sub = {
                    "method": "subscribe",
                    "params": {
                        "channel": "trade",
                        "symbol": [symbol],
                        "snapshot": True
                    }
                }
                await ws.send(json.dumps(trade_sub))
                print(f"✅ Subscribed to trade channel for {symbol} (snapshot=true)")

                update_count = 0
                start_time = datetime.now()

                async for message in ws:
                    data = json.loads(message)

                    # Handle subscription confirmation
                    if data.get('method') == 'subscribe':
                        print(f"📋 Subscription confirmed: {data}")
                        continue

                    if data.get('channel') == 'trade':
                        if data['type'] == 'snapshot':
                            trade_data['snapshot'] = data
                            stats['trade_snapshot_received'] = True
                            trade_count = len(data['data'])
                            stats['trade_snapshot_size'] = trade_count
                            print(f"📸 Trade snapshot received: {trade_count} trades")

                            # Verify timestamp format
                            if trade_count > 0:
                                sample_trade = data['data'][0]
                                print(f"   ⚠️  VERIFY TIMESTAMP FORMAT:")
                                print(f"      Sample trade: {json.dumps(sample_trade, indent=2)}")
                                print(f"      Has 'timestamp' field: {'timestamp' in sample_trade}")
                                if 'timestamp' in sample_trade:
                                    print(f"      Timestamp value: {sample_trade['timestamp']}")
                                    print(f"      Timestamp type: {type(sample_trade['timestamp'])}")

                        elif data['type'] == 'update':
                            trade_data['updates'].append(data)
                            update_count += 1
                            stats['trade_updates_count'] = update_count

                            # Print progress every 10 updates
                            if update_count % 10 == 0:
                                print(f"📊 Received {update_count} trade updates...")

                    # Stop after duration
                    if (datetime.now() - start_time).total_seconds() >= duration_seconds:
                        print(f"\n⏰ {duration_seconds} seconds elapsed. Stopping order flow collection.")
                        trade_data['total_updates'] = update_count
                        break

        except Exception as e:
            print(f"❌ Error collecting trade data: {e}")

    # Run both collectors in parallel
    await asyncio.gather(
        collect_book_data(),
        collect_trade_data()
    )

    # Save collected data
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = "/Users/rbtrsv/Developer/main/finpy/server/apps/cryptobot/tests/output"

    book_file = f"{output_dir}/book_data_{timestamp}.json"
    trade_file = f"{output_dir}/trade_data_{timestamp}.json"
    stats_file = f"{output_dir}/stats_{timestamp}.json"

    with open(book_file, 'w') as f:
        json.dump(book_data, f, indent=2)
    print(f"💾 Book data saved to: {book_file}")

    with open(trade_file, 'w') as f:
        json.dump(trade_data, f, indent=2)
    print(f"💾 Trade data saved to: {trade_file}")

    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    print(f"💾 Statistics saved to: {stats_file}")

    # Print summary
    print("\n" + "="*60)
    print("📊 DATA COLLECTION SUMMARY")
    print("="*60)
    print(f"Symbol: {symbol}")
    print(f"Duration: {stats['start_time']} → {stats['end_time']}")
    print(f"\n📖 Order Book:")
    print(f"  Snapshot received: {stats['book_snapshot_received']}")
    print(f"  Snapshot size: {stats['book_snapshot_size']['bids']} bids, {stats['book_snapshot_size']['asks']} asks")
    print(f"  Updates received: {stats['book_updates_count']}")
    print(f"\n💹 Order Flow:")
    print(f"  Snapshot received: {stats['trade_snapshot_received']}")
    print(f"  Snapshot size: {stats['trade_snapshot_size']} trades")
    print(f"  Updates received: {stats['trade_updates_count']}")

    # Check for issues
    print(f"\n⚠️  POTENTIAL ISSUES:")
    if stats['book_snapshot_size']['bids'] != 1000 or stats['book_snapshot_size']['asks'] != 1000:
        print(f"  ❌ Book snapshot size incorrect (expected 1000/1000)")
    else:
        print(f"  ✅ Book snapshot size within limits")

    if stats['trade_snapshot_size'] != 50:
        print(f"  ⚠️  Trade snapshot size is {stats['trade_snapshot_size']} (expected 50)")
    else:
        print(f"  ✅ Trade snapshot size correct (50 trades)")

    print("="*60)


if __name__ == "__main__":
    asyncio.run(collect_websocket_data(duration_seconds=30))
