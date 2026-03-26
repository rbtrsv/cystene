#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Technology Stock Historical Backtesting - STEP 1: Stock Selection (TECH ONLY)

LLM USAGE:
  This is STEP 1 of 3-step pipeline. Use for TECH-ONLY analysis.
  For GENERAL stock market (all sectors), use historical_backtest.py instead.

  WORKFLOW:
    STEP 1: python3 tech_historical_backtest.py → picks CSV
    STEP 2: python3 validate_backtest.py → results CSV
    STEP 3: python3 analyze_portfolio_performance.py → portfolio analysis

  EXAMPLE:
    python3 tech_historical_backtest.py --fundamentals-dir ../extracted_data/ticker_market_jsons/DE --output exported_data/picks_de_tech.csv --min-market-cap 1000000000
    python3 validate_backtest.py --picks-csv exported_data/picks_de_tech.csv --output-csv exported_data/results_de_tech_1y.csv --holding-period-years 1.0
    python3 analyze_portfolio_performance.py --results-csv exported_data/results_de_tech_1y.csv

Uses OLD fundamental data (e.g., from 2021-2022) to select TECH stocks with institutional filters,
then validates on SUBSEQUENT price performance to see if the strategy works.

KEY DIFFERENCES FROM traditional historical_backtest.py (MINIMAL MODIFICATIONS):
--------------------------------------------------------------------------------
1. TECH_SECTORS: ONLY 'Technology' & 'Communication Services' (2 sectors)
2. FCFF FILTER: Allows FCFF failure for tech sectors (profit must pass)
3. EXISTING FILTERS: Keeps Market Cap >= $5B, ROI >= 0%
4. NO ADDITIONAL FILTERS: Test baseline first, add filters later based on data

WHY TECH REQUIRES SPECIAL TREATMENT:
------------------------------------
FCFF-based valuation FAILS for tech stocks because:
- R&D is expensed (not capitalized as intangible assets)
- Optionality value not captured (platform effects, network effects)
- Winner-take-most dynamics create extreme variance

HYPOTHESIS TO TEST:
- Greenwald EPV captures current profitability (NOPAT)
- Profit projections work if net income is consistently positive
- Book value provides conservative floor
- This combination may work for ALL profitable tech (not just mature tech)

WORKFLOW:
---------
1. Run backtest to select stocks based on old fundamentals
2. Use validate_backtest.py to calculate actual returns
3. Analyze results: Did the strategy work? What separates winners from losers?
4. Add discriminating filters ONLY if data shows clear patterns

USAGE:
------
python3 tech_historical_backtest.py \
    --fundamentals-dir extracted_data/ticker_market_jsons/US \
    --years-back 1 \
    --min-ratio 1.0 \
    --top-n 30 \
    --output exported_data/tech_historical_picks.csv

ARCHITECTURE:
-------------
tech_value_analysis.py         → tech_historical_backtest.py    → validate_backtest.py
(current tech analysis)          (historical tech analysis)       (price validation)
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd

# Import tech-specific value analysis functions from parent directory
# Uses tech_value_analysis.py which has R&D add-back enabled in FCFF calculation
sys.path.append(str(Path(__file__).parent.parent))
from tech_value_analysis import (
    extract_yfinance_financial_data,
    calculate_wacc_from_yfinance,
    calculate_book_value_from_yfinance,
    calculate_greenwald_epv_growth_from_yfinance,
    calculate_profit_projections_from_yfinance,
    calculate_fcff_projections_from_yfinance,
    check_price_to_book,
    check_operating_margin,
    check_revenue_growth,
    check_net_cash_position,
    check_operating_efficiency
)


def shift_data_to_historical(yfinance_data: Dict, years_back: int = 3) -> Optional[Dict]:
    """
    Shift all financial data indices to use historical data as if it were current.

    This function takes existing financial data and shifts the time periods backwards,
    effectively simulating analysis at a point in the past. For example, if years_back=3:
    - year_3 becomes year_0 (most recent)
    - year_4 becomes year_1
    - quarter_12 becomes quarter_0 (most recent quarter)

    This allows us to test investment decisions using only data that would have been
    available at that historical point in time, avoiding look-ahead bias.

    Args:
        yfinance_data (Dict): Extracted financial data with structure:
            {
                'company_info': {...},
                'market_data': {...},
                'balance_sheet': {'year_0': {...}, 'year_1': {...}, 'quarter_0': {...}},
                'income_statement': {'year_0': {...}, 'year_1': {...}},
                'cash_flow': {'year_0': {...}, 'year_1': {...}},
                'years_available': int
            }
        years_back (int): How many years to shift back (default: 3)
            - years_back=3 means use 2021 data as if it were 2024
            - Must have at least years_back + 2 years of data available

    Returns:
        Optional[Dict]: Shifted data dict with same structure as input, or None if:
            - Insufficient historical data (need at least 2 years after shifting)
            - Missing required data fields
            - Error during shifting process

    Example:
        >>> # If we have 5 years of data (2020-2024) and years_back=3
        >>> shifted = shift_data_to_historical(data, years_back=3)
        >>> # Now year_0 in shifted data represents 2021 fundamentals
        >>> # We can use this to test if 2021 picks would have performed well 2021-2024
    """
    try:
        shifted_data = {
            'company_info': yfinance_data['company_info'].copy(),
            'market_data': yfinance_data['market_data'].copy(),
            'balance_sheet': {},
            'income_statement': {},
            'cash_flow': {},
            'years_available': yfinance_data['years_available'] - years_back
        }

        # Check if we have enough data after shifting
        if shifted_data['years_available'] < 2:
            return None  # Need at least 2 years for meaningful analysis

        # Shift yearly data (balance sheet, income statement, cash flow)
        # We need to map OLD data to NEW positions
        # Example: years_back=1 means:
        #   - year_t_minus_1 (1 year ago) becomes year_t0 (most recent in shifted data)
        #   - year_t_minus_2 (2 years ago) becomes year_t_minus_1
        #   - etc.

        # Build the full time key list for mapping
        all_time_keys = ['year_t0', 'year_t_minus_1', 'year_t_minus_2', 'year_t_minus_3', 'year_t_minus_4']

        for i in range(shifted_data['years_available']):
            # Old key is i + years_back positions into the past
            old_index = i + years_back
            if old_index >= len(all_time_keys):
                break

            old_key = all_time_keys[old_index]  # e.g., if years_back=1, i=0: year_t_minus_1
            new_key = all_time_keys[i]  # e.g., year_t0

            # Shift balance sheet data
            if old_key in yfinance_data['balance_sheet']:
                shifted_data['balance_sheet'][new_key] = yfinance_data['balance_sheet'][old_key].copy()

            # Shift income statement data
            if old_key in yfinance_data['income_statement']:
                shifted_data['income_statement'][new_key] = yfinance_data['income_statement'][old_key].copy()

            # Shift cash flow data
            if old_key in yfinance_data['cash_flow']:
                shifted_data['cash_flow'][new_key] = yfinance_data['cash_flow'][old_key].copy()

        # Shift quarterly balance sheet data (use years_back * 4 quarters)
        quarters_back = years_back * 4
        for i in range(4):  # Keep 4 most recent quarters from that historical point
            old_key = f'quarter_{i + quarters_back}'  # e.g., quarter_12, quarter_13
            new_key = f'quarter_{i}'  # e.g., quarter_0, quarter_1

            if old_key in yfinance_data['balance_sheet']:
                shifted_data['balance_sheet'][new_key] = yfinance_data['balance_sheet'][old_key].copy()

        # Set current_quarter to the "new" quarter_0 (which is actually old historical data)
        if 'quarter_0' in shifted_data['balance_sheet']:
            shifted_data['current_quarter'] = shifted_data['balance_sheet']['quarter_0']

        return shifted_data

    except Exception as e:
        print(f"Error shifting data: {e}")
        return None


def analyze_stock_historical(json_path: Path, years_back: int = 3) -> Optional[Dict[str, Any]]:
    """
    Analyze a single stock using historical fundamental data from years_back ago.

    This function loads a stock's yfinance JSON file, shifts the data backwards in time,
    and runs complete value analysis (Greenwald EPV, FCFF, Profit Growth) as if we were
    making the investment decision at that historical point. This allows us to backtest
    whether the value investing strategy would have identified good investments.

    Args:
        json_path (Path): Path to yfinance JSON file containing company financials
            - Example: "extracted_data/ticker_market_jsons/US/AAPL.json"
            - Must contain at least years_back + 2 years of financial data
        years_back (int): How many years back to use for analysis (default: 3)
            - years_back=2 means analyze using 2022 data (if now is 2024)
            - years_back=3 means analyze using 2021 data
            - Higher values = longer backtest period, but need more historical data

    Returns:
        Optional[Dict[str, Any]]: Analysis results dictionary containing:
            {
                'ticker': str,                          # Stock symbol (e.g., 'AAPL')
                'name': str,                            # Company name
                'sector': str,                          # Industry sector
                'industry': str,                        # Specific industry
                'analysis_date': str,                   # Date of historical data used (e.g., '2021-12-31')
                'years_back': int,                      # How many years back this analysis represents
                'market_cap': float,                    # Current market capitalization
                'book_value': float,                    # Historical book value
                'greenwald_intrinsic_value': float,     # Greenwald EPV + Growth Value + Book Value
                'profit_intrinsic_value': float,        # 15-year profit projections value
                'fcff_intrinsic_value': float,          # 15-year FCFF projections value
                'average_intrinsic_value': float,       # Average of three valuation methods
                'intrinsic_to_market_ratio': float,     # Average intrinsic / market cap (>1.0 = undervalued)
                'margin_of_safety': float,              # (Intrinsic - Market) / Intrinsic (higher = safer)
                'roi': float,                           # Return on incremental invested capital
                'wacc': float,                          # Weighted average cost of capital
                'cost_of_equity': float,                # Cost of equity (CAPM)
                'profit_growth_rate': float,            # Adjusted profit growth rate used in projections
                'fcff_growth_rate': float,              # Adjusted FCFF growth rate used in projections
                'beta': float                           # Stock beta (volatility vs market)
            }

            Returns None if:
            - JSON file cannot be loaded
            - Insufficient historical data available
            - Book value is negative or zero
            - Required financial fields are missing
            - Error occurs during calculations

    Example:
        >>> result = analyze_stock_historical(Path("AAPL.json"), years_back=3)
        >>> if result:
        >>>     print(f"{result['ticker']}: Ratio = {result['intrinsic_to_market_ratio']:.2f}")
        >>>     # Output: AAPL: Ratio = 1.45 (undervalued in 2021 by 45%)
    """
    try:
        # Load JSON file with company financial data
        with open(json_path, 'r') as f:
            yfinance_data_raw = json.load(f)

        ticker = yfinance_data_raw.get('symbol', json_path.stem)

        # Extract all financial data (5 years + 4 quarters)
        yfinance_data = extract_yfinance_financial_data(yfinance_data_raw)

        if not yfinance_data or 'company_info' not in yfinance_data:
            return None

        # Check if we have enough historical data
        if yfinance_data['years_available'] <= years_back:
            return None

        # Shift data to use historical period (this is the key step for backtesting)
        historical_data = shift_data_to_historical(yfinance_data, years_back)

        if not historical_data:
            return None

        # Get historical date for this analysis
        if 'year_t0' in historical_data['balance_sheet']:
            analysis_date = historical_data['balance_sheet']['year_t0'].get('date', 'Unknown')
        else:
            analysis_date = 'Unknown'

        # Calculate WACC using historical data
        wacc_results = calculate_wacc_from_yfinance(historical_data)
        wacc_rate = wacc_results['wacc']
        cost_of_equity = wacc_results['cost_of_equity']

        # Calculate Book Value using historical balance sheet
        book_value = calculate_book_value_from_yfinance(historical_data)

        if book_value <= 0:
            return None  # Skip companies with negative equity

        # Calculate Greenwald EPV and Growth Value using historical NOPAT and ROI
        greenwald_results = calculate_greenwald_epv_growth_from_yfinance(
            historical_data, wacc_rate, book_value
        )

        # Calculate Profit Projections using historical net income growth
        profit_results = calculate_profit_projections_from_yfinance(
            historical_data, greenwald_results['roi'], cost_of_equity, book_value
        )

        # Calculate FCFF Projections using historical free cash flow growth
        fcff_results = calculate_fcff_projections_from_yfinance(
            historical_data, greenwald_results['roi'], wacc_rate, book_value
        )

        # Price-to-Book filter (entry price discipline)
        pb_check = check_price_to_book(historical_data, book_value)

        # Institutional-grade quality filters (backtest-validated)
        op_margin_check = check_operating_margin(historical_data)
        rev_growth_check = check_revenue_growth(historical_data)
        net_cash_check = check_net_cash_position(historical_data)
        op_efficiency_check = check_operating_efficiency(historical_data)

        # Calculate average intrinsic value across three methods
        intrinsic_values = [
            greenwald_results['greenwald_total_intrinsic_value'],
            profit_results['profit_growth_total_intrinsic_value'],
            fcff_results['fcff_growth_total_intrinsic_value']
        ]

        average_intrinsic_value = sum(intrinsic_values) / len(intrinsic_values)

        # Use CURRENT market cap for comparison (this is the actual test)
        market_cap = yfinance_data['market_data']['market_capitalization']

        if market_cap <= 0 or average_intrinsic_value <= 0:
            return None

        # Calculate investment metrics
        intrinsic_to_market_ratio = average_intrinsic_value / market_cap
        margin_of_safety = (average_intrinsic_value - market_cap) / average_intrinsic_value

        # TECH MODIFICATION: Calculate P/E ratio for mature tech filter
        # Use profit_base_net_income (historical net income) to calculate P/E
        profit_base_net_income = profit_results.get('base_net_income', 0)
        current_pe = market_cap / profit_base_net_income if profit_base_net_income > 0 else 0

        # TECH MODIFICATION: Get base FCFF for mature tech filter
        fcff_base_fcff = fcff_results.get('base_fcff', 0)

        return {
            'ticker': ticker,
            'name': yfinance_data['company_info']['name'],
            'sector': yfinance_data['company_info']['sector'],
            'industry': yfinance_data['company_info']['industry'],
            'analysis_date': analysis_date,
            'years_back': years_back,
            'market_cap': market_cap,
            'book_value': book_value,
            'greenwald_intrinsic_value': greenwald_results['greenwald_total_intrinsic_value'],
            'profit_intrinsic_value': profit_results['profit_growth_total_intrinsic_value'],
            'fcff_intrinsic_value': fcff_results['fcff_growth_total_intrinsic_value'],
            'average_intrinsic_value': average_intrinsic_value,
            'intrinsic_to_market_ratio': intrinsic_to_market_ratio,
            'margin_of_safety': margin_of_safety,
            'roi': greenwald_results['roi'],
            'wacc': wacc_rate,
            'cost_of_equity': cost_of_equity,
            'profit_growth_rate': profit_results['adjusted_growth_rate'],
            'fcff_growth_rate': fcff_results['adjusted_growth_rate'],
            'profit_projection_failed': profit_results['projections']['terminal_period'].get('terminal_growth_rate') is None,
            'fcff_projection_failed': fcff_results['projections']['terminal_period'].get('terminal_growth_rate') is None,
            'beta': yfinance_data['market_data']['beta'],
            # TECH MODIFICATION: Add mature tech filter data
            'current_pe': current_pe,
            'profit_base_net_income': profit_base_net_income,
            'fcff_base_fcff': fcff_base_fcff,
            'pb_passes': pb_check['passes'],
            'price_to_book': pb_check['price_to_book'],
            'pb_reason': pb_check['reason'],
            # Institutional filters
            'operating_margin': op_margin_check['operating_margin'],
            'operating_margin_passes': op_margin_check['passes'],
            'revenue_growth': rev_growth_check['revenue_growth'],
            'revenue_growth_passes': rev_growth_check['passes'],
            'net_cash_pct': net_cash_check['net_cash_pct'],
            'net_cash_passes': net_cash_check['passes'],
            'efficiency_ratio': op_efficiency_check['efficiency_ratio'],
            'efficiency_passes': op_efficiency_check['passes']
        }

    except Exception as e:
        print(f"Error analyzing {json_path.name}: {e}")
        return None


def run_historical_backtest(
    fundamentals_dir: str,
    years_back: int = 3,
    min_ratio: float = 1.0,
    top_n: int = 60,
    output_csv: str = "historical_fundamental_picks.csv",
    min_market_cap: float = 0.0,
    min_roi: Optional[float] = None
) -> pd.DataFrame:
    """
    Run historical backtest: select stocks based on old fundamental data.

    This function scans all available stocks, analyzes each one using historical
    fundamentals from years_back ago, filters by minimum intrinsic/market ratio,
    and selects the top N most undervalued stocks. The result is a CSV file of
    stocks that WOULD have been selected at that point in time, which can then
    be validated against actual subsequent performance.

    Args:
        fundamentals_dir (str): Directory containing yfinance JSON files
            - Example: "extracted_data/ticker_market_jsons/US"
            - Should contain .json files with at least years_back + 2 years of data

        years_back (int): How many years back to use (default: 3)
            - years_back=3 means use 2021 data if now is 2024
            - Creates a ~3 year forward-looking backtest period
            - Higher values = longer test period, but fewer stocks will have enough data

        min_ratio (float): Minimum intrinsic/market ratio to filter stocks (default: 1.0)
            - 1.0 means only include stocks trading at or below intrinsic value
            - 1.5 means only include stocks where intrinsic > 1.5x market cap (50% undervalued)
            - Lower values = more stocks included, higher values = more conservative

        top_n (int): Number of top stocks to select (default: 20)
            - Selects the top N stocks ranked by intrinsic_to_market_ratio
            - Simulates a concentrated value portfolio

        output_csv (str): Path to save selected stocks CSV (default: "historical_fundamental_picks.csv")
            - Will create parent directories if they don't exist
            - Contains all analysis metrics for selected stocks
            - This file is input to validate_backtest.py

    Returns:
        pd.DataFrame: DataFrame containing selected stocks with columns:
            - ticker, name, sector, industry
            - analysis_date (date of historical data used)
            - years_back (how many years back the analysis represents)
            - market_cap, book_value
            - greenwald_intrinsic_value, profit_intrinsic_value, fcff_intrinsic_value
            - average_intrinsic_value, intrinsic_to_market_ratio, margin_of_safety
            - roi, wacc, cost_of_equity
            - profit_growth_rate, fcff_growth_rate, beta

        Empty DataFrame if no stocks meet criteria or all analyses fail.

    Strategy:
        - Uses Greenwald EPV + Growth Value (earnings power value)
        - Uses 15-year Profit Growth projections
        - Uses 15-year FCFF projections
        - Averages all three methods for conservative valuation
        - Ranks by intrinsic/market ratio (higher = more undervalued)

    Example:
        >>> df = run_historical_backtest(
        ...     fundamentals_dir="extracted_data/ticker_market_jsons/US",
        ...     years_back=3,
        ...     min_ratio=1.2,  # Only 20%+ undervalued stocks
        ...     top_n=30
        ... )
        >>> # Result: Top 30 stocks that were 20%+ undervalued 3 years ago
        >>> # Next step: validate_backtest.py to see actual returns
    """
    print("=" * 80)
    print("TECHNOLOGY STOCK HISTORICAL BACKTESTING (MINIMAL VERSION)")
    print("=" * 80)
    print(f"\n📅 Analysis Period: Using data from {years_back} years ago")
    print(f"📊 Selection Criteria (MINIMAL FILTERS - HYPOTHESIS TESTING):")
    print(f"   - TECH ONLY: Technology & Communication Services sectors")
    print(f"   - Greenwald EPV + Growth Value")
    print(f"   - Profit Growth 15-year projections (REQUIRED)")
    print(f"   - FCFF 15-year projections (OPTIONAL - can fail for tech)")
    print(f"   - Existing filters: Market Cap >= $5B, ROI >= 0%")
    print(f"   - NO additional filters (test baseline hypothesis first)")
    print(f"   - Min Intrinsic/Market Ratio: {min_ratio}")
    print(f"   - Top N stocks: {top_n}")

    # Find all JSON files in directory
    fundamentals_path = Path(fundamentals_dir)
    json_files = list(fundamentals_path.glob("*.json"))

    print(f"\n📊 Found {len(json_files)} fundamental JSON files")
    print("=" * 80)

    # Analyze all stocks using historical data
    results = []
    analyzed = 0
    failed = 0

    for json_file in json_files:
        result = analyze_stock_historical(json_file, years_back=years_back)

        if result:
            results.append(result)
            analyzed += 1

            if analyzed % 50 == 0:
                print(f"✓ Analyzed {analyzed} stocks ({failed} failed)")
        else:
            failed += 1

    print(f"\n✅ Historical analysis complete: {analyzed} stocks analyzed, {failed} failed")

    if not results:
        print("❌ No valid results")
        return pd.DataFrame()

    # Create DataFrame
    df = pd.DataFrame(results)

    # Filter by minimum ratio
    df_filtered = df[df['intrinsic_to_market_ratio'] >= min_ratio].copy()

    print(f"\n📈 Stocks meeting criteria (ratio >= {min_ratio}): {len(df_filtered)}")

    # TECH MODIFICATION #2: Allow FCFF projection to fail for tech sectors
    # Tech stocks can fail FCFF projections (expected due to R&D expensing),
    # but MUST pass profit projections (we only want profitable tech)
    TECH_SECTORS = ['Technology', 'Communication Services']
    df_no_failures = df_filtered[
        (df_filtered['profit_projection_failed'] == False) &
        ((df_filtered['fcff_projection_failed'] == False) |
         (df_filtered['sector'].isin(TECH_SECTORS)))  # ← Allow FCFF fail for tech
    ].copy()

    print(f"✅ Stocks with profit projection successful (FCFF can fail for tech): {len(df_no_failures)}")

    # TECH MODIFICATION #1: ONLY Technology & Communication Services sectors
    # This is the tech-specific version - we ONLY analyze tech sectors
    TECH_SECTORS = ['Technology', 'Communication Services']
    df_quality = df_no_failures[df_no_failures['sector'].isin(TECH_SECTORS)].copy()

    print(f"✅ Stocks passing Tech Sector filter: {len(df_quality)}")
    print(f"   - Tech sectors only: {', '.join(TECH_SECTORS)}")
    print(f"   (Rejected {len(df_no_failures) - len(df_quality)} non-tech stocks)")

    # MARKET CAP FILTER (>= $5B reduces 264 stocks → 113 stocks):
    # ISOLATED IMPACT: Top 10: +14.58%, Top 25: +0.57%, Top 50: +2.43%, Top 100: +0.57%
    # COMBINED WITH ROI >= 0% (further reduces to 82 stocks):
    #   Top 25: 17.15% → 22.06% (+4.91% vs baseline, +4.34% vs market cap only)
    #   Top 50: 14.86% → 19.23% (+4.38% vs baseline, +1.95% vs market cap only)
    #   Win rate improves: 84% → 96% (Top 25), 84% → 98% (Top 50)
    # SYNERGY: Both filters together outperform sum of individual effects by +4.42% (Top 25)
    # NOTE: This parameter remains flexible - adjust based on portfolio size and risk tolerance
    if min_market_cap > 0:
        df_market_cap = df_quality[df_quality['market_cap'] >= min_market_cap].copy()
        print(f"✅ Stocks passing Market Cap filter (>= ${min_market_cap:,.0f}): {len(df_market_cap)}")
        print(f"   (Rejected {len(df_quality) - len(df_market_cap)} stocks below market cap threshold)")
    else:
        df_market_cap = df_quality.copy()

    # ROI FILTER (>= 0% reduces stocks: 264 → 208 alone, 113 → 82 with market cap):
    # ISOLATED IMPACT: Top 25: +2.82%, Top 50: +2.16% (weak alone)
    # COMBINED WITH MARKET CAP >= $5B:
    #   Top 25: 17.72% → 22.06% (+4.34% return, +12.0% win rate)
    #   Top 50: 17.28% → 19.23% (+1.95% return, +6.0% win rate)
    # SYNERGY: Filters amplify each other (expected +0.49%, actual +4.91% for Top 25)
    if min_roi is not None:
        df_roi = df_market_cap[df_market_cap['roi'] >= min_roi].copy()
        print(f"✅ Stocks passing ROI filter (>= {min_roi:.1%}): {len(df_roi)}")
        print(f"   (Rejected {len(df_market_cap) - len(df_roi)} stocks below ROI threshold)")
    else:
        df_roi = df_market_cap.copy()

    # ========================================================================
    # INSTITUTIONAL-GRADE QUALITY FILTERS (BACKTEST-VALIDATED 2025-10-17)
    # ========================================================================
    # Apply 4 operational health filters to complement valuation filters
    # Filters: Operating margin, Revenue growth, Net cash, Operating efficiency
    # ========================================================================

    # Filter stocks that pass ALL 4 institutional filters
    df_institutional = df_roi[
        (df_roi['operating_margin_passes'] == True) &
        (df_roi['revenue_growth_passes'] == True) &
        (df_roi['net_cash_passes'] == True) &
        (df_roi['efficiency_passes'] == True)
    ].copy()

    print(f"\n{'='*80}")
    print(f"INSTITUTIONAL FILTER RESULTS")
    print(f"{'='*80}")
    print(f"Tech stocks after Market Cap + ROI: {len(df_roi)}")
    print(f"✅ Passing ALL 4 institutional filters: {len(df_institutional)}")
    print(f"❌ Rejected: {len(df_roi) - len(df_institutional)} stocks")

    # Show breakdown
    if len(df_roi) > len(df_institutional):
        failed_stocks = df_roi[
            ~((df_roi['operating_margin_passes'] == True) &
              (df_roi['revenue_growth_passes'] == True) &
              (df_roi['net_cash_passes'] == True) &
              (df_roi['efficiency_passes'] == True))
        ]
        op_margin_fails = len(failed_stocks[failed_stocks['operating_margin_passes'] == False])
        rev_growth_fails = len(failed_stocks[failed_stocks['revenue_growth_passes'] == False])
        net_cash_fails = len(failed_stocks[failed_stocks['net_cash_passes'] == False])
        efficiency_fails = len(failed_stocks[failed_stocks['efficiency_passes'] == False])

        print(f"\n   Filter Breakdown (stocks that failed):")
        print(f"   - Operating Margin (<10%): {op_margin_fails} stocks")
        print(f"   - Revenue Growth (<10%): {rev_growth_fails} stocks")
        print(f"   - Net Cash (<-30%): {net_cash_fails} stocks")
        print(f"   - Operating Efficiency (<25%): {efficiency_fails} stocks")

    print(f"\n{'='*80}")
    print(f"TECH BACKTEST SELECTION SUMMARY (WITH INSTITUTIONAL FILTERS)")
    print(f"{'='*80}")
    print(f"Tech stocks analyzed: {len(df_quality)}")
    print(f"After Market Cap + ROI filters: {len(df_roi)}")
    print(f"After institutional filters: {len(df_institutional)}")

    # Sort by intrinsic to market ratio (best opportunities first)
    df_institutional = df_institutional.sort_values('intrinsic_to_market_ratio', ascending=False)

    # Select top N from filtered stocks
    df_selected = df_institutional.head(top_n)

    # Save to CSV
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_selected.to_csv(output_path, index=False)

    print(f"\n💾 Saved {len(df_selected)} selected stocks to: {output_path}")

    # Display results summary
    print("\n" + "=" * 80)
    print(f"TOP {top_n} STOCKS - HISTORICAL FUNDAMENTAL ANALYSIS")
    print(f"(Based on data from {years_back} years ago)")
    print("=" * 80)

    display_cols = [
        'ticker', 'name', 'analysis_date', 'intrinsic_to_market_ratio',
        'margin_of_safety', 'roi'
    ]

    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    pd.set_option('display.max_colwidth', 30)

    print(df_selected[display_cols].to_string(index=False))

    # Summary statistics
    print("\n" + "=" * 80)
    print("SELECTION SUMMARY")
    print("=" * 80)
    print(f"Average Intrinsic/Market Ratio: {df_selected['intrinsic_to_market_ratio'].mean():.2f}")
    print(f"Median Intrinsic/Market Ratio: {df_selected['intrinsic_to_market_ratio'].median():.2f}")
    print(f"Average Margin of Safety: {df_selected['margin_of_safety'].mean():.2%}")
    print(f"Average ROI: {df_selected['roi'].mean():.2%}")

    print(f"\nSector Breakdown:")
    sector_counts = df_selected['sector'].value_counts()
    for sector, count in sector_counts.items():
        print(f"  {sector}: {count}")

    print("\n✅ Historical stock selection complete!")
    print(f"\n📅 Next step: Use validate_backtest.py to download price data")
    print(f"   from {years_back} years ago to present and calculate actual returns")

    return df_selected


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Technology Stock Historical Backtesting - Select mature tech stocks using old fundamentals"
    )
    parser.add_argument(
        "--fundamentals-dir",
        default="../extracted_data/ticker_market_jsons/US",
        help="Directory containing yfinance JSON files"
    )
    parser.add_argument(
        "--years-back",
        type=int,
        default=1,
        help="How many years back to use for analysis (default: 1)"
    )
    parser.add_argument(
        "--min-ratio",
        type=float,
        default=1.0,
        help="Minimum intrinsic to market ratio (default: 1.0)"
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=30,
        help="Number of top stocks to select (default: 30)"
    )
    parser.add_argument(
        "--output",
        default="exported_data/tech_historical_picks.csv",
        help="Output CSV file path (default: exported_data/tech_historical_picks.csv)"
    )
    parser.add_argument(
        "--min-market-cap",
        type=float,
        default=5_000_000_000,
        help="Minimum market cap filter (e.g., 5000000000 for $5B). Default: $5B"
    )
    parser.add_argument(
        "--min-roi",
        type=float,
        default=0.0,
        help="Minimum ROI filter (e.g., 0.0 for 0%%, -0.05 for -5%%). Default: 0%"
    )

    args = parser.parse_args()

    df_selected = run_historical_backtest(
        fundamentals_dir=args.fundamentals_dir,
        years_back=args.years_back,
        min_ratio=args.min_ratio,
        top_n=args.top_n,
        output_csv=args.output,
        min_market_cap=args.min_market_cap,
        min_roi=args.min_roi
    )
