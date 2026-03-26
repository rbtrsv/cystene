# TODO

## Live Screening with Quarterly Data

- [ ] Use annual data as primary source (consistent with backtest)
- [ ] For live screening with 2 quarters available:
  - [ ] Option 1: Multiply Q1+Q2 by 2 to estimate full year
  - [ ] Option 2: Compare Q1+Q2 current year vs Q1+Q2 previous year
- [ ] Decide which approach is more accurate
- [ ] Implement quarterly → annual conversion logic


 so i asked you to look at json aviable of stocks for instance in
 US and '/Users/rbtrsv/Developer/main/finpy-python-scripts/api_sto
ck_analysis/value_investing_yfinance/extracted_data/ticker_market_
jsons/DE''/Users/rbtrsv/Developer/main/finpy-python-scripts/api_st
ock_analysis/value_investing_yfinance/extracted_data/ticker_market
_jsons/JP''/Users/rbtrsv/Developer/main/finpy-python-scripts/api_s
tock_analysis/value_investing_yfinance/extracted_data/ticker_marke
t_jsons/US' analyse how many quarters they have and how many 
years?'/Users/rbtrsv/Developer/main/finpy-python-scripts/api_stock
_analysis/value_investing_yfinance/value_analysis.py' you will see
 that value analysis only has annual analysis for profit and fcff 
but we could also add some growth and a weighted 10% or 20% or 
something similar to lets say i have Q1, Q2, OR Q1 Q2 Q3 for 
stocks and compare the amount vs previous annual year so we also 
take into account quarters. at country level we have different 
number of jsons\




we have Q1 Q2 from fy2025, then from annual year 2024 u 
discount Q3 Q4 from annual year (income stament)

for balance sheet you compare Q2 2025 vs Q2 2024 (as it is a 
fucking snapshot no?????) not sure please confirm and for cash 

 and if you have 3 quarters in 2025, then u discount only q4 From
 2024 and get 3 quarters in 2024 

Simple Year-over-Year Comparison:

If we have Q1+Q2+Q3 for FY2025:

Calculate Q1+Q2+Q3 for FY2024:
Q1+Q2+Q3 FY2024 = Annual FY2024 - Q4 FY2024

Then compare EXACTLY:
Growth = (Q1+Q2+Q3 FY2025 / Q1+Q2+Q3 FY2024) - 1

That's it! Same periods, year-over-year. Apples to apples.


Q1 Q2 Q3 Q4, if we have Q1 Q2 in 2025, if u discount
  from Q3 Q4 (4 quarters total - 2 quarters avialable
  2025 =2) from 2024 we get exactly Q1 Q2 from 2024 



Option A: Annual dominant, quarterly supplemental
50% growth_recent + 30% growth_previous + 20% quarterly = 100%

Option B: Balanced
40% growth_recent + 30% growth_previous + 30% quarterly = 100%

Option C: Quarterly more important (most recent data)
40% growth_recent + 20% growth_previous + 40% quarterly = 100%

The Fix Required:

  Instead of grouping by calendar year, we need to:

  1. Match quarters to fiscal years by DATE 
  comparison, not calendar year
  2. Identify which quarters belong to which fiscal 
  year by checking if quarter_date is AFTER previous
   annual and BEFORE/ON current annual
  3. Apply the subtraction logic correctly:
    - Current fiscal year (after most recent
  annual): count quarters
    - Previous complete fiscal year: subtract the
  LAST (4 - num_current_quarters) quarters from the
  annual

  The Implementation:

  # Instead of grouping by calendar year, match by 
  dates:
  most_recent_annual_date = year_t0_date
  previous_annual_date = year_t_minus_1_date

  # Quarters AFTER most_recent_annual = current 
  incomplete fiscal year
  # Quarters BETWEEN previous_annual and 
  most_recent_annual = previous complete fiscal year


  YES, I believe it can be fixed. Here's the correct
   logic:

  For DECK example:
  - Most recent annual: 2025-03-31
  - Quarters AFTER 2025-03-31: [2025-06-30] = 1
  quarter, $139M
  - Previous annual: 2024-03-31 = $759,563,000

  To get matching period:
  - We have 1 quarter in current fiscal year
  - Previous annual has 4 quarters total
  - Subtract the LAST (4-1=3) quarters that fall
  BETWEEN 2024-03-31 and 2025-03-31
  - These are: 2025-03-31 ($151M), 2024-12-31
  ($456M), 2024-09-30 ($242M)
  - Previous matching = $759,563,000 -
  $849,466,000... wait that's still wrong

  Let me recalculate...

  Actually, I need to identify quarters by DATE, not
   calendar year:
  - Quarters between 2024-03-31 and 2025-03-31
  (fiscal 2025): 2024-06-30, 2024-09-30, 2024-12-31,
   2025-03-31
  - Subtract LAST 3 from annual 2025-03-31



  Great question! Here's how to get H1 (first half =
   Q1+Q2) from previous year:

  General Algorithm:

  1. Identify fiscal year boundaries using annual
  dates
  2. Count quarters in current fiscal year (quarters
   AFTER most recent annual)
  3. From previous fiscal year annual, subtract the 
  LAST (4 - num_current_quarters) quarters to get
  matching period

  DECK Example:

  Step 1: Identify fiscal years
  - Fiscal 2025 ends: 2025-03-31 (annual =
  $966,091,000)
  - Fiscal 2026 incomplete (after 2025-03-31)

  Step 2: Classify quarters by fiscal year

  Quarters AFTER 2025-03-31 (fiscal 2026):
  - 2025-06-30: $139,203,000 → 1 quarter in current 
  FY

  Quarters BETWEEN 2024-03-31 and 2025-03-31 (fiscal
   2025):
  - 2024-06-30 (Q1): $115,625,000
  - 2024-09-30 (Q2): $242,321,000
  - 2024-12-31 (Q3): $456,734,000
  - 2025-03-31 (Q4): $151,411,000

  Step 3: Get matching quarter from previous year
  - We have 1 quarter in current FY
  - Need 1 quarter from previous FY (Q1)
  - Subtract LAST 3 quarters (Q2+Q3+Q4) from annual:

  Q1 (FY2025) = Annual - (Q2+Q3+Q4)
  Q1 = $966,091,000 - ($242,321,000 + $456,734,000 +
   $151,411,000)
  Q1 = $115,625,000 ✓ (matches actual Q1!)

  For H1 (2 quarters):
  If we had 2 quarters in current FY, subtract LAST
  2 quarters (Q3+Q4) from annual to get Q1+Q2.