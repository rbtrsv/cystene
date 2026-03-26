# Value Investing Backtest CSV/TXT Creation Process

This document outlines the complete process for generating value investing backtest results and portfolio performance analysis for multiple markets.

## Overview

The process consists of 3 steps:
1. Generate batch analysis CSV files with filtered stocks
2. Run backtest validation to calculate historical returns
3. Generate portfolio performance analysis in text format

All output files are stored in: `/Users/rbtrsv/Developer/main/finpy-python-scripts/api_stock_analysis/value_investing_yfinance/extracted_data/`

## Step 1: Generate Batch Analysis CSV Files

### Purpose
Create CSV files containing stocks that pass value investing filters for each market.

### Command
```python
from value_analysis import run_batch_analysis
import pandas as pd

# For each market (de, jp, us, pl, uk):
df = run_batch_analysis(
    fundamentals_dir='extracted_data/ticker_market_jsons/XX',  # Replace XX with market code
    output_excel='extracted_data/batch_analysis_results_xx_temp.xlsx',
    min_ratio=1.0,
    min_market_cap=5_000_000_000,
    min_roi=0.0,
    apply_filters=True
)

# CRITICAL: Set analysis_date to financial_statements_date, NOT today's date
df['analysis_date'] = df['financial_statements_date']

# Save to CSV
df.to_csv('extracted_data/batch_analysis_results_xx.csv', index=False)
```

### OPTIONAL: Using Quarterly Data Analysis

Instead of `value_analysis.py`, you can use `value_analysis_with_quarters.py` to incorporate quarterly financial data into the growth calculations.

**Differences**:
- **value_analysis.py**: Uses only annual financial data for growth calculations
- **value_analysis_with_quarters.py**: Incorporates quarterly trends (20% weight) into growth calculations using weighted formula: `(50% × recent annual) + (30% × previous annual) + (20% × quarterly)`

**When to use**:
- Use quarterly analysis to capture more recent business trends
- Useful for companies with significant quarter-over-quarter changes
- May produce different stock selections based on recent quarterly performance

**Command for Quarterly Analysis**:
```python
from value_analysis_with_quarters import run_batch_analysis
import pandas as pd

# For each market (de, jp, us, pl, uk):
df = run_batch_analysis(
    fundamentals_dir='extracted_data/ticker_market_jsons/XX',  # Replace XX with market code
    output_excel='extracted_data/batch_analysis_results_xx_quarterly_temp.xlsx',
    min_ratio=1.0,
    min_market_cap=5_000_000_000,
    min_roi=0.0,
    apply_filters=True
)

# CRITICAL: Set analysis_date to financial_statements_date, NOT today's date
df['analysis_date'] = df['financial_statements_date']

# Save to CSV with _quarterly suffix
df.to_csv('extracted_data/batch_analysis_results_xx_quarterly.csv', index=False)
```

**File Naming Convention**:
- Add `_quarterly` suffix to all output files
- Example: `batch_analysis_results_us_quarterly.csv`
- Then follow Steps 2 and 3 with `_quarterly` suffix in all filenames

**Example US Quarterly Analysis Results**:
- Stocks: 110 (vs 113 in annual analysis)
- Win Rate: 64.5%
- Avg Annualized Return: 14.52%
- Top 10 Portfolio: 40.19% return, 80% win rate

### OPTIONAL: Using Tech-Specific Analysis

Instead of `value_analysis.py`, you can use `tech_value_analysis.py` to focus exclusively on technology stocks with specialized filters.

**Differences**:
- **value_analysis.py**: Analyzes all 5 traditional sectors (Industrials, Basic Materials, Consumer Cyclical, Energy, Financial Services)
- **tech_value_analysis.py**: Analyzes only Technology & Communication Services sectors with tech-specific adjustments:
  - **Tech Sectors Only**: Technology and Communication Services (2 sectors vs 5 traditional)
  - **FCFF Can Fail**: Profit projection must pass, but FCFF projection can fail (tech companies often have negative free cash flow)
  - **R&D Add-back**: 50% of R&D expenses added back to FCFF as intangible asset investment
  - **4 Institutional Filters**: All must pass:
    - Operating Margin > 10%
    - Revenue Growth > 10%
    - Net Cash Position > -30%
    - Operating Efficiency > 25%

**When to use**:
- Focus on technology and communication services companies
- Capture tech companies with high R&D investment but negative FCFF
- Apply institutional-grade quality filters for tech stocks
- Compare tech sector performance vs traditional value sectors

**Command for Tech Analysis**:
```python
from tech_value_analysis import run_batch_analysis
import pandas as pd

# For each market (de, jp, us, pl, uk):
df = run_batch_analysis(
    fundamentals_dir='extracted_data/ticker_market_jsons/XX',  # Replace XX with market code
    output_excel='extracted_data/batch_analysis_results_xx_tech_temp.xlsx',
    min_ratio=1.0,
    min_market_cap=5_000_000_000,
    min_roi=0.0,
    apply_filters=True
)

# CRITICAL: Set analysis_date to financial_statements_date, NOT today's date
df['analysis_date'] = df['financial_statements_date']

# Save to CSV with _tech suffix
df.to_csv('extracted_data/batch_analysis_results_xx_tech.csv', index=False)
```

**File Naming Convention**:
- Add `_tech` suffix to all output files
- Example: `batch_analysis_results_us_tech.csv`
- Then follow Steps 2-4 with `_tech` suffix in all filenames

**Step 2: Run Backtest Validation for Tech Stocks**:
```bash
cd /Users/rbtrsv/Developer/main/finpy-python-scripts/api_stock_analysis/value_investing_yfinance/backtesting

/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_XX_tech.csv \
  --output-csv ../extracted_data/historical_backtest_results_XX_tech.csv
```

**Step 3: Generate Portfolio Performance for Tech Stocks**:
```bash
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_XX_tech.csv \
  > ../extracted_data/portfolio_performance_XX_tech.txt
```

**Step 4: Generate Sector/Industry Performance for Tech Stocks**:
```bash
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_sector_industry_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_XX_tech.csv \
  > ../extracted_data/sector_industry_performance_XX_tech.txt
```

**Example Tech Analysis Results**:

**United States (US) Tech**:
- Stocks: 14
- Win Rate: 64.3%
- Avg Annualized Return: 76.29%
- Best Performer: UI (+429.08% annualized)

**Japan (JP) Tech**:
- Stocks: 87
- Win Rate: 83.9%
- Avg Annualized Return: 63.28%
- Best Performer: 3692.T (+728.38% annualized)

**Germany (DE) Tech**:
- Stocks: 1 (insufficient for portfolio analysis)

**Expected Output Files for Tech Analysis**:
- batch_analysis_results_XX_tech.csv
- historical_backtest_results_XX_tech.csv
- portfolio_performance_XX_tech.txt
- sector_industry_performance_XX_tech.txt

**Note**: Tech analysis may produce very few stocks in smaller markets (e.g., Germany had only 1 tech stock). This is expected due to the strict combination of tech sector focus + $5B market cap + 4 institutional filters.

### Markets and Parameters

| Market | Code | Fundamentals Dir | Output CSV |
|--------|------|------------------|------------|
| Germany | de | ticker_market_jsons/de | batch_analysis_results_de.csv |
| Japan | jp | ticker_market_jsons/jp | batch_analysis_results_jp.csv |
| United States | us | ticker_market_jsons/us | batch_analysis_results_us.csv |
| Poland | pl | ticker_market_jsons/pl | batch_analysis_results_pl.csv |
| United Kingdom | uk | ticker_market_jsons/uk | batch_analysis_results_uk.csv |

### Filter Parameters
- **min_ratio**: 1.0 (intrinsic value / market cap ratio)
- **min_market_cap**: $5,000,000,000 ($5 billion)
- **min_roi**: 0.0%
- **apply_filters**: True

### CRITICAL NOTES
- **analysis_date MUST be set to financial_statements_date**
- DO NOT use today's date ('2025-10-23') for analysis_date
- This is essential for backtesting to calculate returns from the correct starting point
- This rule applies to BOTH annual analysis (value_analysis.py) and quarterly analysis (value_analysis_with_quarters.py)

### Expected Outputs
- batch_analysis_results_de.csv (~54K) - ~56 stocks
- batch_analysis_results_jp.csv (~139K) - ~147 stocks
- batch_analysis_results_us.csv (~107K) - ~113 stocks
- batch_analysis_results_pl.csv (~10K) - ~10 stocks
- batch_analysis_results_uk.csv (~7.6K) - ~7 stocks

## Step 2: Run Backtest Validation

### Purpose
Calculate historical returns for each stock by simulating buy/hold strategy from analysis_date to today.

### Command
```bash
cd /Users/rbtrsv/Developer/main/finpy-python-scripts/api_stock_analysis/value_investing_yfinance/backtesting

/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_XX.csv \
  --output-csv ../extracted_data/historical_backtest_results_XX.csv
```

### CRITICAL NOTES
- **DO NOT add --holding-period parameter**
- Script defaults to holding until today when no period is specified
- This is the correct behavior for backtesting

### Commands for Each Market

```bash
# Germany
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_de.csv \
  --output-csv ../extracted_data/historical_backtest_results_de.csv

# Japan
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_jp.csv \
  --output-csv ../extracted_data/historical_backtest_results_jp.csv

# United States
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_us.csv \
  --output-csv ../extracted_data/historical_backtest_results_us.csv

# Poland
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_pl.csv \
  --output-csv ../extracted_data/historical_backtest_results_pl.csv

# United Kingdom
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 validate_backtest.py \
  --picks-csv ../extracted_data/batch_analysis_results_uk.csv \
  --output-csv ../extracted_data/historical_backtest_results_uk.csv
```

### Expected Outputs
- historical_backtest_results_de.csv (~60K)
- historical_backtest_results_jp.csv (~152K)
- historical_backtest_results_us.csv (~119K)
- historical_backtest_results_pl.csv (~11K)
- historical_backtest_results_uk.csv (~8.4K)

### Backtest Results Summary

| Market | Stocks | Win Rate | Avg Annualized Return |
|--------|--------|----------|----------------------|
| Germany (DE) | 56 | 92.9% | 72.32% |
| Japan (JP) | 147 | 89.1% | 39.55% |
| United States (US) | 113 | 65.5% | 15.88% |
| Poland (PL) | 10 | 100.0% | 45.11% |
| United Kingdom (UK) | 7 | 100.0% | 54.88% |

## Step 3: Generate Portfolio Performance Analysis

### Purpose
Analyze backtest results across different portfolio sizes (Top 5, Top 10, etc.) to determine optimal portfolio size.

### Standard Command
```bash
cd /Users/rbtrsv/Developer/main/finpy-python-scripts/api_stock_analysis/value_investing_yfinance/backtesting

/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_XX.csv \
  > ../extracted_data/portfolio_performance_XX.txt
```

### Default Portfolio Sizes
[10, 15, 20, 25, 30, 50, 75, 100]

### Commands for Large Markets (Germany, Japan, US)

```bash
# Germany
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_de.csv \
  > ../extracted_data/portfolio_performance_de.txt

# Japan
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_jp.csv \
  > ../extracted_data/portfolio_performance_jp.txt

# United States
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_us.csv \
  > ../extracted_data/portfolio_performance_us.txt
```

### Commands for Small Markets (Poland, UK)

For markets with fewer stocks, use custom portfolio sizes with `--sizes` parameter:

```bash
# Poland (10 stocks available)
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_pl.csv \
  --sizes 5 10 \
  > ../extracted_data/portfolio_performance_pl.txt

# United Kingdom (7 stocks available)
/Users/rbtrsv/Developer/main/finpy-python-scripts/venv313/bin/python3 analyze_portfolio_performance.py \
  --results-csv ../extracted_data/historical_backtest_results_uk.csv \
  --sizes 5 7 \
  > ../extracted_data/portfolio_performance_uk.txt
```

### Expected Outputs
- portfolio_performance_de.txt (~1.5K)
- portfolio_performance_jp.txt (~1.6K)
- portfolio_performance_us.txt (~1.6K)
- portfolio_performance_pl.txt (~1.1K)
- portfolio_performance_uk.txt (~1.1K)

## File Naming Conventions

All files must follow these naming patterns:

1. **Batch Analysis CSV**: `batch_analysis_results_{country}.csv`
2. **Historical Backtest CSV**: `historical_backtest_results_{country}.csv`
3. **Portfolio Performance TXT**: `portfolio_performance_{country}.txt`
4. **Sector/Industry Performance TXT**: `sector_industry_performance_{country}.txt` (only for tech analysis)

Where `{country}` is the lowercase market code: de, jp, us, pl, uk

**For Quarterly Analysis**: Add `_quarterly` suffix before file extension:
- `batch_analysis_results_{country}_quarterly.csv`
- `historical_backtest_results_{country}_quarterly.csv`
- `portfolio_performance_{country}_quarterly.txt`

**For Tech Analysis**: Add `_tech` suffix before file extension:
- `batch_analysis_results_{country}_tech.csv`
- `historical_backtest_results_{country}_tech.csv`
- `portfolio_performance_{country}_tech.txt`
- `sector_industry_performance_{country}_tech.txt`

## Directory Structure

```
/Users/rbtrsv/Developer/main/finpy-python-scripts/api_stock_analysis/value_investing_yfinance/
├── extracted_data/
│   ├── ticker_market_jsons/
│   │   ├── de/
│   │   ├── jp/
│   │   ├── us/
│   │   ├── pl/
│   │   └── uk/
│   ├── batch_analysis_results_de.csv
│   ├── batch_analysis_results_jp.csv
│   ├── batch_analysis_results_us.csv
│   ├── batch_analysis_results_pl.csv
│   ├── batch_analysis_results_uk.csv
│   ├── historical_backtest_results_de.csv
│   ├── historical_backtest_results_jp.csv
│   ├── historical_backtest_results_us.csv
│   ├── historical_backtest_results_pl.csv
│   ├── historical_backtest_results_uk.csv
│   ├── portfolio_performance_de.txt
│   ├── portfolio_performance_jp.txt
│   ├── portfolio_performance_us.txt
│   ├── portfolio_performance_pl.txt
│   └── portfolio_performance_uk.txt
└── backtesting/
    ├── validate_backtest.py
    └── analyze_portfolio_performance.py
```

## Common Errors and Solutions

### Error 1: Wrong analysis_date Value
**Wrong**: `df['analysis_date'] = '2025-10-23'` (hardcoded today's date)
**Correct**: `df['analysis_date'] = df['financial_statements_date']`

**Why**: Backtesting needs the actual financial statement date to calculate returns from that point forward.

### Error 2: Adding --holding-period Parameter
**Wrong**: `--holding-period 1.0`
**Correct**: Do not add --holding-period parameter at all

**Why**: Script defaults to holding until today, which is the correct behavior for backtesting.

### Error 3: Wrong Output Directory
**Wrong**: `exported_data/de_results.csv`
**Correct**: `extracted_data/historical_backtest_results_de.csv`

**Why**: All outputs must be in `extracted_data/` folder with standardized naming.

### Error 4: Using Default Portfolio Sizes for Small Markets
**Wrong**: Using default sizes [10, 15, 20, 25, 30, 50, 75, 100] for Poland (10 stocks)
**Correct**: Use `--sizes 5 10` for Poland, `--sizes 5 7` for UK

**Why**: Portfolio recommendations section will be empty if portfolio sizes exceed available stocks.

### Error 5: Output to Console Instead of Text File
**Wrong**: Running analyze_portfolio_performance.py without redirecting output
**Correct**: Use `> ../extracted_data/portfolio_performance_XX.txt`

**Why**: Results must be saved to text file in extracted_data/ folder.

## Execution Order

Execute in this exact order for each market:

1. Generate batch_analysis_results_{country}.csv
2. Run validate_backtest.py to create historical_backtest_results_{country}.csv
3. Run analyze_portfolio_performance.py to create portfolio_performance_{country}.txt

**Do not skip steps or change the order.**

## Verification Checklist

After completing all steps, verify:

- [ ] All 5 batch_analysis_results_{country}.csv files exist in extracted_data/
- [ ] All CSV files have analysis_date = financial_statements_date (NOT today's date)
- [ ] All 5 historical_backtest_results_{country}.csv files exist in extracted_data/
- [ ] All 5 portfolio_performance_{country}.txt files exist in extracted_data/
- [ ] File sizes match expected ranges
- [ ] Poland and UK use custom portfolio sizes (5, 10) and (5, 7) respectively
- [ ] Portfolio performance text files contain non-empty recommendations sections

## Performance Results Summary

### Traditional Value Investing (5 Sectors)

Best performing markets by annualized return:
1. Germany: 72.32% (92.9% win rate)
2. United Kingdom: 54.88% (100% win rate)
3. Poland: 45.11% (100% win rate)
4. Japan: 39.55% (89.1% win rate)
5. United States: 15.88% (65.5% win rate)

### Tech-Specific Analysis (2 Sectors with Institutional Filters)

Best performing markets by annualized return:
1. United States: 76.29% (64.3% win rate, 14 stocks)
2. Japan: 63.28% (83.9% win rate, 87 stocks)
3. Germany: Insufficient data (1 stock only)

**Note**: Tech analysis produces significantly fewer stocks due to strict filters but shows higher average returns in markets with adequate tech stock representation (US, JP).
