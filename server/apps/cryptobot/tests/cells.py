# %%
import sys
import os
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from kraken_bot import KrakenBot

# Get Kraken balance
bot = KrakenBot()
time.sleep(0.1)  # Small delay to ensure unique nonce
balance = bot.get_account_balance()

balance

# %%
# Test the fix: ETH dust should NOT be detected as a position
import sys
import os
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from kraken_bot import KrakenBot

bot = KrakenBot()
time.sleep(0.1)
bot.check_existing_positions()

print("\n" + "=" * 60)
print("POSITION DETECTION RESULTS:")
print("=" * 60)
for ticker, position in bot.positions.items():
    if position:
        print(f"✅ {ticker}: Position detected - Entry: €{position['buy_price']:.2f}")
    else:
        print(f"⚪ {ticker}: No position")

print("\n" + "=" * 60)
print("EXPECTED: Only SOL position, ETH dust should be ignored")
print("=" * 60)

bot.positions
