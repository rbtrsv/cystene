#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Validate Historical Fundamental Picks - STEP 2: Calculate Actual Returns

LLM USAGE:
  This is STEP 2 of 3-step pipeline. Run AFTER historical_backtest.py or tech_historical_backtest.py.

  WORKFLOW:
    STEP 1: historical_backtest.py or tech_historical_backtest.py → picks CSV
    STEP 2: validate_backtest.py → results CSV (THIS FILE)
    STEP 3: analyze_portfolio_performance.py → portfolio analysis

  EXAMPLE:
    # After running STEP 1 (historical_backtest.py), run this:
    python3 validate_backtest.py --picks-csv exported_data/picks_de_tech.csv --output-csv exported_data/results_de_tech_1y.csv --holding-period-years 1.0

  KEY PARAMETER:
    --holding-period-years: Fixed holding period (1.0 = 1 year, 2.0 = 2 years)
                           If omitted, holds until today (~1.7-2.0 years typically)

  IMPORTANT:
    - Run this MULTIPLE TIMES with SAME picks CSV to test different holding periods
    - Don't re-run STEP 1 for each holding period - that would select different stocks!

Downloads price data from the analysis date forward and calculates
actual returns to see if the strategy identified stocks that outperformed.
"""

import pandas as pd
import yfinance as yf
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional


def download_price_data(
    ticker: str,
    start_date: datetime,
    end_date: datetime,
    buffer_days: int = 30
) -> Optional[pd.DataFrame]:
    """
    Download historical price data for a single ticker using yfinance.

    Downloads OHLCV (Open, High, Low, Close, Volume) data from Yahoo Finance
    for the specified date range. Includes a buffer before start_date to ensure
    we capture the first available trading day after the analysis date.

    Args:
        ticker (str): Stock ticker symbol
            - Example: 'AAPL', 'MSFT', 'TSLA'
            - Must be valid Yahoo Finance ticker

        start_date (datetime): Start date for price data
            - Typically the analysis_date from historical backtest
            - Example: datetime(2021, 12, 31)

        end_date (datetime): End date for price data
            - Typically today's date for full backtest period
            - Example: datetime(2024, 10, 13)

        buffer_days (int): Days before start_date to begin download (default: 30)
            - Ensures we capture the first trading day after start_date
            - Accounts for weekends, holidays, trading halts

    Returns:
        Optional[pd.DataFrame]: DataFrame with columns:
            - Date (index): Trading dates
            - Open: Opening price
            - High: Highest price
            - Low: Lowest price
            - Close: Closing price (adjusted for splits/dividends)
            - Volume: Trading volume

        Returns None if:
        - Ticker not found on Yahoo Finance
        - No data available for date range
        - Network error or API failure

    Example:
        >>> prices = download_price_data('AAPL', datetime(2021, 12, 31), datetime(2024, 10, 13))
        >>> if prices is not None:
        >>>     print(f"Downloaded {len(prices)} trading days")
        >>>     print(f"First price: ${prices.iloc[0]['Close']:.2f}")
    """
    try:
        # Add buffer before start date to ensure we catch the first trading day
        buffer_start = start_date - timedelta(days=buffer_days)

        # Download price data
        stock = yf.Ticker(ticker)
        df_price = stock.history(
            start=buffer_start.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d')
        )

        if df_price.empty:
            return None

        # Remove timezone info for easier date comparison
        df_price.index = pd.to_datetime(df_price.index).tz_localize(None)

        return df_price

    except Exception as e:
        print(f"   ❌ Error downloading {ticker}: {e}")
        return None


def calculate_stock_returns(
    ticker: str,
    analysis_date: str,
    df_price: pd.DataFrame,
    holding_period_years: Optional[float] = None
) -> Optional[Dict]:
    """
    Calculate actual investment returns for a single stock.

    Given historical price data and an analysis date (when the stock would have
    been selected), calculates buy/sell prices and returns. Simulates buying on
    the first trading day after analysis_date.

    Args:
        ticker (str): Stock ticker symbol
            - Example: 'AAPL'

        analysis_date (str): Date when stock was selected (from historical backtest)
            - Format: 'YYYY-MM-DD' (e.g., '2021-12-31')
            - Typically the date of the last available financial statements

        df_price (pd.DataFrame): Price data from download_price_data()
            - Must have 'Close' column and datetime index
            - Must cover period from analysis_date to sell date

        holding_period_years (Optional[float]): Fixed holding period in years
            - If specified, sells exactly N years after buy date
            - If None, sells on most recent date in df_price (default)
            - Example: 1.0 for 1-year hold, 2.0 for 2-year hold

    Returns:
        Optional[Dict]: Dictionary containing:
            {
                'ticker': str,                      # Stock symbol
                'analysis_date': str,               # Original selection date
                'buy_date': str,                    # Actual buy date (first trading day after analysis)
                'sell_date': str,                   # Actual sell date
                'buy_price': float,                 # Buy price (close)
                'sell_price': float,                # Sell price (close)
                'days_held': int,                   # Number of calendar days held
                'years_held': float,                # Years held (days / 365.25)
                'total_return_pct': float,          # Total return percentage
                'annualized_return_pct': float      # Annualized return (CAGR)
            }

        Returns None if:
        - No price data after analysis_date
        - Invalid dates or prices
        - Calculation error

    Example:
        >>> returns = calculate_stock_returns('AAPL', '2021-12-31', prices_df, holding_period_years=1.0)
        >>> if returns:
        >>>     print(f"{returns['ticker']}: {returns['annualized_return_pct']:.2f}% per year")
        >>>     # Output: AAPL: 15.34% per year
    """
    try:
        # Parse analysis date
        analysis_dt = pd.to_datetime(analysis_date)

        # Find first trading day on or after analysis date
        price_dates = df_price.index[df_price.index >= analysis_dt]

        if len(price_dates) == 0:
            return None

        # Buy on first available trading day
        buy_date = price_dates[0]
        buy_price = df_price.loc[buy_date, 'Close']

        # Determine sell date
        if holding_period_years is not None:
            # Sell after fixed holding period
            target_sell_date = buy_date + timedelta(days=int(holding_period_years * 365.25))
            # Find first trading day on or after target sell date
            sell_dates = df_price.index[df_price.index >= target_sell_date]
            if len(sell_dates) == 0:
                # Not enough data for this holding period
                return None
            sell_date = sell_dates[0]
        else:
            # Sell on most recent date (original behavior)
            sell_date = df_price.index[-1]

        sell_price = df_price.loc[sell_date, 'Close']

        # Calculate returns
        total_return = (sell_price - buy_price) / buy_price
        total_return_pct = total_return * 100

        # Calculate holding period
        days_held = (sell_date - buy_date).days
        years_held = days_held / 365.25

        # Annualized return (CAGR formula)
        if years_held > 0:
            annualized_return = ((1 + total_return) ** (1 / years_held) - 1) * 100
        else:
            annualized_return = 0

        return {
            'ticker': ticker,
            'analysis_date': analysis_date,
            'buy_date': buy_date.strftime('%Y-%m-%d'),
            'sell_date': sell_date.strftime('%Y-%m-%d'),
            'buy_price': buy_price,
            'sell_price': sell_price,
            'days_held': days_held,
            'years_held': years_held,
            'total_return_pct': total_return_pct,
            'annualized_return_pct': annualized_return
        }

    except Exception as e:
        print(f"   ❌ Error calculating returns: {e}")
        return None


def calculate_returns_from_picks(
    picks_csv: str = "exported_data/historical_fundamental_picks.csv",
    output_csv: str = "exported_data/historical_backtest_results.csv",
    holding_period_years: Optional[float] = None
) -> pd.DataFrame:
    """
    Calculate actual returns for all historically selected stocks.

    This function takes the output from historical_backtest.py (stocks selected
    using old fundamentals), downloads actual price data for each stock, and
    calculates what the returns would have been if we had invested at that time.
    This validates whether the fundamental analysis strategy works in practice.

    Args:
        picks_csv (str): Path to CSV with selected stocks from historical_backtest.py
            - Default: "exported_data/historical_fundamental_picks.csv"
            - Must contain columns: ticker, name, sector, analysis_date,
              intrinsic_to_market_ratio, margin_of_safety, roi

        output_csv (str): Path to save validation results
            - Default: "exported_data/historical_backtest_results.csv"
            - Will contain all original columns plus actual return data
            - Used for performance analysis and reporting

        holding_period_years (Optional[float]): Fixed holding period in years
            - If specified, sells exactly N years after buy date for all stocks
            - If None, sells on most recent date (default behavior)
            - Example: 1.0 for 1-year hold, 2.0 for 2-year hold

    Returns:
        pd.DataFrame: DataFrame with all picks plus actual performance:
            Original columns from picks_csv, PLUS:
            - buy_date: First trading day after analysis
            - sell_date: Most recent trading day
            - buy_price: Entry price
            - sell_price: Exit price
            - days_held: Calendar days held
            - years_held: Years held
            - total_return_pct: Total return percentage
            - annualized_return_pct: CAGR (compound annual growth rate)

        Sorted by annualized_return_pct (best performers first)

        Empty DataFrame if no picks file found or all downloads fail.

    Process:
        1. Load historically selected stocks from picks_csv
        2. For each stock:
           - Download price data from analysis_date to present
           - Find first trading day after analysis_date (buy date)
           - Calculate returns to present (sell date)
        3. Compile all results and calculate portfolio statistics
        4. Save to output_csv and display summary

    Portfolio Statistics Calculated:
        - Average/Median total returns
        - Average/Median annualized returns
        - Best/Worst performers
        - Win rate (% of positive returns)
        - Returns by sector

    Example:
        >>> df = calculate_returns_from_picks(
        ...     picks_csv="exported_data/historical_fundamental_picks.csv"
        ... )
        >>> # Shows actual returns from investing in fundamentally undervalued stocks
        >>> print(f"Average annualized return: {df['annualized_return_pct'].mean():.2f}%")
        >>> print(f"Win rate: {(df['total_return_pct'] > 0).mean() * 100:.1f}%")
    """
    print("=" * 80)
    print("VALIDATING HISTORICAL FUNDAMENTAL STRATEGY")
    print("=" * 80)

    # Load picks from historical backtest
    df_picks = pd.read_csv(picks_csv)

    print(f"\n📊 Loaded {len(df_picks)} stock picks")
    print(f"📅 Analysis dates range: {df_picks['analysis_date'].min()} to {df_picks['analysis_date'].max()}")

    # Get earliest analysis date (this is our "buy" date reference)
    analysis_dates = pd.to_datetime(df_picks['analysis_date'])
    start_date = analysis_dates.min()

    # Calculate holding period (from earliest analysis date until now)
    end_date = datetime.now()
    backtest_period_days = (end_date - start_date).days
    backtest_period_years = backtest_period_days / 365.25

    print(f"\n📅 Backtest Period:")
    print(f"   Start: {start_date.strftime('%Y-%m-%d')}")
    print(f"   End: {end_date.strftime('%Y-%m-%d')}")
    if holding_period_years is not None:
        print(f"   Fixed Holding Period: {holding_period_years} years")
    else:
        print(f"   Holding Period: {backtest_period_days} days ({backtest_period_years:.2f} years)")

    print(f"\n💰 Calculating actual returns...")
    print("=" * 80)

    results = []
    successful = 0
    failed = 0

    for idx, row in df_picks.iterrows():
        ticker = row['ticker']
        analysis_date = row['analysis_date']

        try:
            print(f"\n📈 {ticker} ({successful + 1}/{len(df_picks)})")

            # Determine download end date
            if holding_period_years is not None:
                # Download data until holding period + buffer
                download_end_date = pd.to_datetime(analysis_date) + timedelta(days=int((holding_period_years + 0.5) * 365.25))
            else:
                download_end_date = end_date

            # Download price data
            df_price = download_price_data(
                ticker,
                pd.to_datetime(analysis_date),
                download_end_date
            )

            if df_price is None or df_price.empty:
                print(f"   ❌ No price data available")
                failed += 1
                continue

            # Calculate returns
            return_data = calculate_stock_returns(ticker, analysis_date, df_price, holding_period_years)

            if return_data is None:
                print(f"   ❌ Could not calculate returns")
                failed += 1
                continue

            # Merge with original pick data
            result = {
                **row.to_dict(),  # All original columns
                **return_data     # Add return data
            }

            print(f"   Buy: ${return_data['buy_price']:.2f} on {return_data['buy_date']}")
            print(f"   Sell: ${return_data['sell_price']:.2f} on {return_data['sell_date']}")
            print(f"   Return: {return_data['total_return_pct']:.2f}% ({return_data['annualized_return_pct']:.2f}% annualized)")

            results.append(result)
            successful += 1

        except Exception as e:
            print(f"   ❌ Error: {e}")
            failed += 1

    print("\n" + "=" * 80)
    print("CALCULATION SUMMARY")
    print("=" * 80)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")

    if not results:
        print("❌ No results to analyze")
        return pd.DataFrame()

    # Create DataFrame
    df_results = pd.DataFrame(results)

    # IMPORTANT: Preserve original intrinsic_to_market_ratio ranking from historical_backtest.py
    # DO NOT sort by performance - this would cherry-pick winners instead of validating the strategy
    # The picks CSV is already sorted by intrinsic_to_market_ratio (descending) from historical_backtest.py
    # We maintain this order to properly validate whether high intrinsic/market ratios predict returns

    # Save to CSV
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_results.to_csv(output_path, index=False)

    print(f"\n💾 Saved results to: {output_path}")

    # Display summary statistics
    print("\n" + "=" * 80)
    print("BACKTEST RESULTS - ACTUAL PERFORMANCE")
    print("=" * 80)

    print(f"\n📊 Portfolio Statistics:")
    print(f"   Average Total Return: {df_results['total_return_pct'].mean():.2f}%")
    print(f"   Median Total Return: {df_results['total_return_pct'].median():.2f}%")
    print(f"   Average Annualized Return: {df_results['annualized_return_pct'].mean():.2f}%")
    print(f"   Median Annualized Return: {df_results['annualized_return_pct'].median():.2f}%")
    best_idx = df_results['annualized_return_pct'].idxmax()
    worst_idx = df_results['annualized_return_pct'].idxmin()
    print(f"   Best Performer: {df_results.loc[best_idx, 'ticker']} ({df_results.loc[best_idx, 'annualized_return_pct']:.2f}%)")
    print(f"   Worst Performer: {df_results.loc[worst_idx, 'ticker']} ({df_results.loc[worst_idx, 'annualized_return_pct']:.2f}%)")

    # Winners vs losers
    winners = len(df_results[df_results['total_return_pct'] > 0])
    losers = len(df_results[df_results['total_return_pct'] <= 0])
    win_rate = (winners / len(df_results)) * 100

    print(f"\n📈 Win/Loss:")
    print(f"   Winners: {winners}")
    print(f"   Losers: {losers}")
    print(f"   Win Rate: {win_rate:.1f}%")

    # Display top 10 by performance and by intrinsic/market ratio
    print(f"\n🏆 TOP 10 BEST RETURNS:")
    top_cols = ['ticker', 'total_return_pct', 'annualized_return_pct', 'intrinsic_to_market_ratio']
    best_returns = df_results.nlargest(10, 'annualized_return_pct')
    print(best_returns[top_cols].to_string(index=False))

    print(f"\n📉 TOP 10 WORST RETURNS:")
    worst_returns = df_results.nsmallest(10, 'annualized_return_pct')
    print(worst_returns[top_cols].to_string(index=False))

    print(f"\n🎯 TOP 10 BY SELECTION CRITERIA (Highest Intrinsic/Market Ratio):")
    print(df_results.head(10)[top_cols].to_string(index=False))

    print("\n✅ Historical backtest validation complete!")

    return df_results


def generate_performance_report(
    results_csv: str = "exported_data/historical_backtest_results.csv",
    output_report: str = "exported_data/backtest_performance_report.txt"
) -> None:
    """
    Generate detailed performance analysis report from backtest results.

    Analyzes backtest results and creates a comprehensive text report with:
    - Overall portfolio performance metrics
    - Performance by sector
    - Performance by initial valuation metrics
    - Correlation analysis between fundamentals and returns
    - Risk metrics (volatility, drawdowns)

    Args:
        results_csv (str): Path to backtest results CSV from calculate_returns_from_picks()
            - Default: "exported_data/historical_backtest_results.csv"
            - Must contain columns: ticker, sector, total_return_pct, annualized_return_pct,
              intrinsic_to_market_ratio, margin_of_safety, roi

        output_report (str): Path to save text report
            - Default: "exported_data/backtest_performance_report.txt"
            - Human-readable performance analysis

    Returns:
        None (prints report to console and saves to file)

    Report Sections:
        1. Executive Summary
           - Total stocks, time period, overall returns
        2. Return Statistics
           - Mean, median, std dev, min, max
           - Percentile breakdowns
        3. Sector Analysis
           - Returns by sector
           - Best/worst sectors
        4. Fundamental Metrics Analysis
           - Correlation between initial metrics and returns
           - Performance by valuation buckets
        5. Risk Analysis
           - Return volatility
           - Max drawdown (if available)

    Example:
        >>> generate_performance_report(
        ...     results_csv="exported_data/historical_backtest_results.csv"
        ... )
        >>> # Creates detailed performance report file
    """
    try:
        df = pd.read_csv(results_csv)

        report = []
        report.append("=" * 80)
        report.append("HISTORICAL BACKTEST PERFORMANCE REPORT")
        report.append("=" * 80)
        report.append("")

        # Executive Summary
        report.append("EXECUTIVE SUMMARY")
        report.append("-" * 80)
        report.append(f"Total Stocks: {len(df)}")
        report.append(f"Analysis Period: {df['analysis_date'].min()} to {df['sell_date'].max()}")
        report.append(f"Average Holding Period: {df['years_held'].mean():.2f} years")
        report.append("")

        # Return Statistics
        report.append("RETURN STATISTICS")
        report.append("-" * 80)
        report.append(f"Average Total Return: {df['total_return_pct'].mean():.2f}%")
        report.append(f"Median Total Return: {df['total_return_pct'].median():.2f}%")
        report.append(f"Std Dev Total Return: {df['total_return_pct'].std():.2f}%")
        report.append(f"Min Return: {df['total_return_pct'].min():.2f}%")
        report.append(f"Max Return: {df['total_return_pct'].max():.2f}%")
        report.append("")
        report.append(f"Average Annualized Return: {df['annualized_return_pct'].mean():.2f}%")
        report.append(f"Median Annualized Return: {df['annualized_return_pct'].median():.2f}%")
        report.append("")

        # Win Rate
        winners = (df['total_return_pct'] > 0).sum()
        win_rate = (winners / len(df)) * 100
        report.append(f"Win Rate: {win_rate:.1f}% ({winners}/{len(df)})")
        report.append("")

        # Sector Analysis
        report.append("PERFORMANCE BY SECTOR")
        report.append("-" * 80)
        sector_perf = df.groupby('sector')['annualized_return_pct'].agg(['mean', 'median', 'count'])
        sector_perf = sector_perf.sort_values('mean', ascending=False)
        report.append(sector_perf.to_string())
        report.append("")

        # Valuation Metrics Analysis
        report.append("CORRELATION: FUNDAMENTALS vs RETURNS")
        report.append("-" * 80)
        corr_cols = ['intrinsic_to_market_ratio', 'margin_of_safety', 'roi']
        for col in corr_cols:
            if col in df.columns:
                corr = df[col].corr(df['annualized_return_pct'])
                report.append(f"{col} vs Annualized Return: {corr:.3f}")
        report.append("")

        # Print and save report
        report_text = "\n".join(report)
        print(report_text)

        output_path = Path(output_report)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            f.write(report_text)

        print(f"\n💾 Report saved to: {output_path}")

    except Exception as e:
        print(f"❌ Error generating report: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate Historical Fundamental Picks - Calculate actual returns"
    )
    parser.add_argument(
        "--picks-csv",
        default="exported_data/historical_fundamental_picks.csv",
        help="Path to historical picks CSV"
    )
    parser.add_argument(
        "--output-csv",
        default="exported_data/historical_backtest_results.csv",
        help="Path to save results CSV"
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate detailed performance report"
    )
    parser.add_argument(
        "--holding-period-years",
        type=float,
        default=None,
        help="Fixed holding period in years (e.g., 1.0 for 1-year, 2.0 for 2-year). If not specified, holds until today."
    )

    args = parser.parse_args()

    # Calculate returns
    df_results = calculate_returns_from_picks(
        picks_csv=args.picks_csv,
        output_csv=args.output_csv,
        holding_period_years=args.holding_period_years
    )

    # Generate report if requested
    if args.report and not df_results.empty:
        generate_performance_report(results_csv=args.output_csv)
