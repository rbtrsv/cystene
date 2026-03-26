#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Backtest Pipeline Cells - Historical Backtesting Workflow

This file contains pipeline cells for running historical backtests using old fundamental data
to validate the value investing strategy. Similar structure to pipeline_cells.py.

WORKFLOW:
1. Select stocks using historical fundamentals (1+ years ago)
2. Calculate actual returns from that point forward
3. Analyze portfolio performance
4. Analyze sector/industry performance

TWO SEPARATE WORKFLOWS:
- Traditional Value Investing (5 sectors: Basic Materials, Healthcare, Consumer Cyclical, Energy, Financial Services)
- Tech-Specific Value Investing (2 sectors: Technology, Communication Services + 4 institutional filters)
"""

################################################################################
# TRADITIONAL VALUE INVESTING WORKFLOW (5 Sectors)
# Analyzes: Basic Materials, Healthcare, Consumer Cyclical, Energy, Financial Services
################################################################################

# %% Cell 1: Select Top 100 Stocks (Historical Fundamentals)
"""
Select top 100 undervalued stocks using 1-year-old fundamental data.
Applies market cap >= $5B and ROI >= 0% filters.

Output: exported_data/historical_fundamental_picks.csv
"""

from historical_backtest import run_historical_backtest

df_picks = run_historical_backtest(
    fundamentals_dir="../extracted_data/ticker_market_jsons/US",
    years_back=1,
    min_ratio=1.0,
    top_n=100,
    output_csv="exported_data/historical_fundamental_picks.csv",
    min_market_cap=5_000_000_000,
    min_roi=0.0
)

print(f"\n✅ Selected {len(df_picks)} stocks")

# %% Cell 2: Calculate Actual Returns
"""
Download price data and calculate what the actual returns were.

Output: exported_data/historical_backtest_results.csv
"""

from validate_backtest import calculate_returns_from_picks

df_results = calculate_returns_from_picks(
    picks_csv="exported_data/historical_fundamental_picks.csv",
    output_csv="exported_data/historical_backtest_results.csv"
)

print(f"\n✅ Calculated returns for {len(df_results)} stocks")

# %% Cell 3: Portfolio Performance Analysis (Top 10-100)
"""
Analyze performance across different portfolio sizes.
Compare expected vs actual returns for Top 10, 15, 20, 25, 30, 50, 75, 100.

Output: exported_data/portfolio_performance_us.txt
"""

from analyze_portfolio_performance import run_portfolio_analysis
from contextlib import redirect_stdout

with open("exported_data/portfolio_performance_us.txt", "w") as f:  # US: portfolio_performance_us.txt | JP: portfolio_performance_jp.txt
    with redirect_stdout(f):
        run_portfolio_analysis(
            results_csv="exported_data/historical_backtest_results.csv",
            portfolio_sizes=[10, 15, 20, 25, 30, 50, 75, 100]
        )

print("✅ Portfolio performance analysis saved")

# %% Cell 4: Sector/Industry Performance Analysis
"""
Analyze sector and industry performance in the backtest.
Shows which sectors/industries performed best/worst.

Output: exported_data/sector_industry_performance_us.txt
"""

from analyze_sector_industry_performance import analyze_sector_industry_performance
from contextlib import redirect_stdout

with open("exported_data/sector_industry_performance_us.txt", "w") as f:  # US: sector_industry_performance_us.txt | JP: sector_industry_performance_jp.txt
    with redirect_stdout(f):
        analyze_sector_industry_performance(
            results_csv="exported_data/historical_backtest_results.csv"
        )

print("✅ Sector/industry performance analysis saved")

################################################################################
# TECH-SPECIFIC VALUE INVESTING WORKFLOW (2 Sectors + Institutional Filters)
# Analyzes: Technology, Communication Services
# Special filters: FCFF can fail, R&D add-back, 4 institutional quality filters
################################################################################

# %% Tech Cell 1: Select Tech Stocks (Historical Fundamentals)
"""
Select top undervalued tech stocks using 1-year-old fundamental data.

Uses tech_historical_backtest.py which:
- Only includes Technology & Communication Services sectors
- Allows FCFF projection to fail (common for tech)
- Requires profit projection to succeed
- Applies 4 institutional filters: Operating Margin (≥10%), Revenue Growth (≥10%),
  Net Cash (≥-30%), Operating Efficiency (≥25%)

Output: exported_data/historical_fundamental_picks_us_tech.csv
"""

from tech_historical_backtest import run_historical_backtest as run_tech_backtest

df_tech_picks = run_tech_backtest(
    fundamentals_dir="../extracted_data/ticker_market_jsons/US",
    years_back=1,
    min_ratio=1.0,
    top_n=100,
    output_csv="exported_data/historical_fundamental_picks_us_tech.csv",
    min_market_cap=5_000_000_000,
    min_roi=0.0
)

print(f"\n✅ Selected {len(df_tech_picks)} tech stocks")

# %% Tech Cell 2: Calculate Actual Returns (Tech)
"""
Download price data and calculate actual returns for tech stocks.

Output: exported_data/historical_backtest_results_us_tech.csv
"""

from validate_backtest import calculate_returns_from_picks

df_tech_results = calculate_returns_from_picks(
    picks_csv="exported_data/historical_fundamental_picks_us_tech.csv",
    output_csv="exported_data/historical_backtest_results_us_tech.csv"
)

print(f"\n✅ Calculated returns for {len(df_tech_results)} tech stocks")

# %% Tech Cell 3: Portfolio Performance Analysis (Tech)
"""
Analyze performance across different portfolio sizes for tech stocks.

Output: exported_data/portfolio_performance_us_tech.txt
"""

from analyze_portfolio_performance import run_portfolio_analysis
from contextlib import redirect_stdout

with open("exported_data/portfolio_performance_us_tech.txt", "w") as f:  # US: portfolio_performance_us_tech.txt | JP: portfolio_performance_jp_tech.txt
    with redirect_stdout(f):
        run_portfolio_analysis(
            results_csv="exported_data/historical_backtest_results_us_tech.csv",
            portfolio_sizes=[10, 15, 20, 25, 30, 50, 75, 100]  # Adjust based on how many stocks were selected
        )

print("✅ Tech portfolio performance analysis saved")

# %% Tech Cell 4: Sector/Industry Performance Analysis (Tech)
"""
Analyze sector and industry performance for tech stocks in the backtest.
Shows which tech industries performed best/worst.

Output: exported_data/sector_industry_performance_us_tech.txt
"""

from analyze_sector_industry_performance import analyze_sector_industry_performance
from contextlib import redirect_stdout

with open("exported_data/sector_industry_performance_us_tech.txt", "w") as f:  # US: sector_industry_performance_us_tech.txt | JP: sector_industry_performance_jp_tech.txt
    with redirect_stdout(f):
        analyze_sector_industry_performance(
            results_csv="exported_data/historical_backtest_results_us_tech.csv"
        )

print("✅ Tech sector/industry performance analysis saved")
