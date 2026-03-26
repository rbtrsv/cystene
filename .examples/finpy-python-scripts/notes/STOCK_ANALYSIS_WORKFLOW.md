# STOCK ANALYSIS WORKFLOW

**Date:** October 2025

---

## STEP 1: EXTRACT ALL FUNDAMENTALS (ALWAYS START HERE)

### 1.1 Market Cap + ALL Intrinsic Values (from CSV)

Extract the complete CSV line for the ticker from `batch_analysis_results_us_normalized.csv`:

```
Market Cap: $19,864,868,864

Greenwald: $22,730,217,251 (1.14x)
Profit: $67,290,731,639 (3.39x)
FCFF: $184,565,186,606,910 (9,290,000x)

Intrinsic/Market Ratio (overall): 3098.52x
ROI: 29.58%
```

**CSV Columns:**
- Market Cap: column 10 `market_cap`
- Greenwald: column 22 `greenwald_total_intrinsic_value`
- Profit: column 25 `profit_growth_total_intrinsic_value`
- FCFF: column 30 `fcff_growth_total_intrinsic_value`
- Intrinsic/Market Ratio: column 9 `intrinsic_to_market_ratio`
- ROI: column 23 `roi`

**Calculate individual ratios:**
- Greenwald/Market = Greenwald ÷ Market Cap
- Profit/Market = Profit ÷ Market Cap
- FCFF/Market = FCFF ÷ Market Cap

### 1.2 PROFIT - ALL YEARS (from JSON)

**Location:** `/extracted_data/ticker_market_jsons/US/{TICKER}.json`

**Source:** `NormalizedIncome` (NOT NetIncome)

```
T-0: $1,815M  → Growth: +13.2%
T-1: $1,603M  → Growth: +44.4%
T-2: $1,110M  → Growth: +10.3%
T-3: $1,006M  → Growth: +171.1%
T-4: $371M
```

**Calculate Growth:**
- T-0 Growth = (T-0 / T-1 - 1) × 100%
- T-1 Growth = (T-1 / T-2 - 1) × 100%
- T-2 Growth = (T-2 / T-3 - 1) × 100%
- T-3 Growth = (T-3 / T-4 - 1) × 100%

### 1.3 FCFF - ALL YEARS (from CSV + calculated)

```
T-0: $1,811M  → Growth: +237.2%
T-1: $537M    → Growth: +77.2%
T-2: $303M
```

**Calculate Growth:**
- T-0 Growth = (T-0 / T-1 - 1) × 100%
- T-1 Growth = (T-1 / T-2 - 1) × 100%

**Note:** Cannot calculate T-3 (WorkingCapital 2020 is None for all companies)

---

## HOW TO CALCULATE FCFF

**T-0 FCFF:** Get from CSV column 31 `fcff_base_fcff`

**T-1 and T-2 FCFF:** Calculate from JSON

### Extract from JSON for each year:
- `OperatingIncome` (EBIT)
- `PretaxIncome`
- `TaxProvision`
- `DepreciationAndAmortization`
- `CapitalExpenditure`
- `WorkingCapital`

### Formula for each year:

```
Tax Rate = TaxProvision / PretaxIncome
ΔNWC = WorkingCapital(current year) - WorkingCapital(previous year)
FCFF = EBIT × (1 - Tax Rate) + Depreciation - CapEx - ΔNWC
```

### Example Calculation (LULU T-1):

```
Data from JSON:
  EBIT: $2,207M
  PretaxIncome: $2,176M
  TaxProvision: $626M
  Depreciation: $379M
  CapEx: $652M
  WorkingCapital T-1: $2,141M
  WorkingCapital T-2: $2,429M

Calculation:
  Tax Rate = $626M / $2,176M = 28.76%
  ΔNWC = $2,141M - $2,429M = -$288M (released)

  FCFF = $2,207M × (1 - 0.2876) + $379M - $652M - (-$288M)
       = $2,207M × 0.7124 + $379M - $652M + $288M
       = $1,572M + $379M - $652M + $288M
       = $1,587M
```

---
