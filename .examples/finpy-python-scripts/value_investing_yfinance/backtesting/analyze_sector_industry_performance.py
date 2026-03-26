#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Sector and Industry Performance Analysis

Analyzes historical backtest results by sector and industry to identify
which sectors/industries perform best with the value investing strategy.
"""

import pandas as pd
import argparse
from pathlib import Path


def analyze_sector_industry_performance(results_csv: str):
    """
    Analyze returns by sector and industry from historical backtest results.

    Args:
        results_csv: Path to historical backtest results CSV file
    """
    # Read the CSV file
    df = pd.read_csv(results_csv)

    # Check if sector and industry columns exist
    if 'sector' not in df.columns:
        print("Error: 'sector' column not found in CSV file")
        return

    print("=" * 80)
    print("SECTOR AND INDUSTRY PERFORMANCE ANALYSIS")
    print("=" * 80)
    print(f"\nAnalyzing: {results_csv}")
    print(f"Total stocks: {len(df)}")
    print()

    # ========================================================================
    # SECTOR ANALYSIS
    # ========================================================================

    print("=" * 80)
    print("PERFORMANCE BY SECTOR")
    print("=" * 80)
    print()

    sector_stats = df.groupby('sector').agg({
        'ticker': 'count',
        'annualized_return_pct': ['mean', 'median', 'min', 'max', 'std'],
        'total_return_pct': ['mean', 'median']
    }).round(4)

    # Calculate win rate per sector
    sector_win_rate = df.groupby('sector').apply(
        lambda x: (x['annualized_return_pct'] > 0).sum() / len(x) * 100,
        include_groups=False
    ).round(2)

    # Combine statistics
    sector_summary = pd.DataFrame({
        'Stocks': df.groupby('sector')['ticker'].count(),
        'Avg Annual Return (%)': df.groupby('sector')['annualized_return_pct'].mean().round(2),
        'Median Annual Return (%)': df.groupby('sector')['annualized_return_pct'].median().round(2),
        'Win Rate (%)': sector_win_rate,
        'Best Stock (%)': df.groupby('sector')['annualized_return_pct'].max().round(2),
        'Worst Stock (%)': df.groupby('sector')['annualized_return_pct'].min().round(2),
        'Std Dev (%)': df.groupby('sector')['annualized_return_pct'].std().round(2)
    })

    # Sort by average annual return
    sector_summary = sector_summary.sort_values('Avg Annual Return (%)', ascending=False)

    print(sector_summary.to_string())
    print()

    # ========================================================================
    # INDUSTRY ANALYSIS
    # ========================================================================

    if 'industry' in df.columns:
        print("=" * 80)
        print("PERFORMANCE BY INDUSTRY (Top 20)")
        print("=" * 80)
        print()

        # Calculate industry statistics
        industry_summary = pd.DataFrame({
            'Stocks': df.groupby('industry')['ticker'].count(),
            'Avg Annual Return (%)': df.groupby('industry')['annualized_return_pct'].mean().round(2),
            'Median Annual Return (%)': df.groupby('industry')['annualized_return_pct'].median().round(2),
            'Win Rate (%)': df.groupby('industry').apply(
                lambda x: (x['annualized_return_pct'] > 0).sum() / len(x) * 100,
                include_groups=False
            ).round(2),
            'Best Stock (%)': df.groupby('industry')['annualized_return_pct'].max().round(2),
            'Worst Stock (%)': df.groupby('industry')['annualized_return_pct'].min().round(2)
        })

        # Filter industries with at least 2 stocks for meaningful analysis
        industry_summary = industry_summary[industry_summary['Stocks'] >= 2]

        # Sort by average annual return and show top 20
        industry_summary = industry_summary.sort_values('Avg Annual Return (%)', ascending=False)

        print(industry_summary.head(20).to_string())
        print()

        # Bottom 10 industries
        print("=" * 80)
        print("WORST PERFORMING INDUSTRIES")
        print("=" * 80)
        print()
        print(industry_summary.tail(10).to_string())
        print()

    # ========================================================================
    # SECTOR BREAKDOWN WITH TOP STOCKS
    # ========================================================================

    print("=" * 80)
    print("TOP 3 STOCKS PER SECTOR")
    print("=" * 80)
    print()

    for sector in sector_summary.index:
        sector_df = df[df['sector'] == sector].sort_values('annualized_return_pct', ascending=False)

        print(f"\n{sector}")
        print("-" * 80)

        top_3 = sector_df.head(3)[['ticker', 'name', 'annualized_return_pct', 'total_return_pct', 'years_held']]

        for idx, row in top_3.iterrows():
            name = str(row['name'])[:40] if pd.notna(row['name']) else row['ticker']
            print(f"  {row['ticker']:6s} - {name:40s} | "
                  f"{row['annualized_return_pct']:7.2f}% annual | "
                  f"{row['total_return_pct']:7.2f}% total | "
                  f"{row['years_held']:.2f} years")

    print()

    # ========================================================================
    # KEY INSIGHTS
    # ========================================================================

    print("=" * 80)
    print("KEY INSIGHTS")
    print("=" * 80)
    print()

    # Best performing sector
    best_sector = sector_summary.index[0]
    best_sector_return = sector_summary.iloc[0]['Avg Annual Return (%)']
    best_sector_win_rate = sector_summary.iloc[0]['Win Rate (%)']
    best_sector_stocks = sector_summary.iloc[0]['Stocks']

    print(f"Best Sector: {best_sector}")
    print(f"  - Average Annual Return: {best_sector_return:.2f}%")
    print(f"  - Win Rate: {best_sector_win_rate:.2f}%")
    print(f"  - Number of Stocks: {int(best_sector_stocks)}")
    print()

    # Worst performing sector
    worst_sector = sector_summary.index[-1]
    worst_sector_return = sector_summary.iloc[-1]['Avg Annual Return (%)']
    worst_sector_win_rate = sector_summary.iloc[-1]['Win Rate (%)']
    worst_sector_stocks = sector_summary.iloc[-1]['Stocks']

    print(f"Worst Sector: {worst_sector}")
    print(f"  - Average Annual Return: {worst_sector_return:.2f}%")
    print(f"  - Win Rate: {worst_sector_win_rate:.2f}%")
    print(f"  - Number of Stocks: {int(worst_sector_stocks)}")
    print()

    # Most consistent sector (lowest standard deviation)
    most_consistent_sector = sector_summary['Std Dev (%)'].idxmin()
    most_consistent_std = sector_summary.loc[most_consistent_sector, 'Std Dev (%)']
    most_consistent_return = sector_summary.loc[most_consistent_sector, 'Avg Annual Return (%)']

    print(f"Most Consistent Sector: {most_consistent_sector}")
    print(f"  - Standard Deviation: {most_consistent_std:.2f}%")
    print(f"  - Average Annual Return: {most_consistent_return:.2f}%")
    print()

    # Sectors with 100% win rate
    perfect_sectors = sector_summary[sector_summary['Win Rate (%)'] == 100.0]
    if len(perfect_sectors) > 0:
        print("Sectors with 100% Win Rate:")
        for sector in perfect_sectors.index:
            stocks = perfect_sectors.loc[sector, 'Stocks']
            avg_return = perfect_sectors.loc[sector, 'Avg Annual Return (%)']
            print(f"  - {sector}: {int(stocks)} stocks, {avg_return:.2f}% avg return")
        print()

    print("=" * 80)
    print("✅ Analysis complete")
    print("=" * 80)
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Analyze sector and industry performance from historical backtest results'
    )
    parser.add_argument(
        '--results-csv',
        type=str,
        required=True,
        help='Path to historical backtest results CSV file'
    )

    args = parser.parse_args()

    # Validate file exists
    csv_path = Path(args.results_csv)
    if not csv_path.exists():
        print(f"Error: File not found: {args.results_csv}")
        exit(1)

    analyze_sector_industry_performance(args.results_csv)
