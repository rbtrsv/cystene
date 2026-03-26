#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Portfolio Performance Analysis - STEP 3: Compare Portfolio Sizes

LLM USAGE:
  This is STEP 3 of 3-step pipeline. Run AFTER validate_backtest.py.

  WORKFLOW:
    STEP 1: historical_backtest.py or tech_historical_backtest.py → picks CSV
    STEP 2: validate_backtest.py → results CSV
    STEP 3: analyze_portfolio_performance.py → portfolio analysis (THIS FILE)

  WHAT THIS DOES:
    Compares different portfolio SIZES (Top 5 vs Top 10 vs Top 20) from SAME backtest.
    Does NOT compare different TIME PERIODS - that's done by running STEP 2 multiple times.

  EXAMPLE:
    python3 analyze_portfolio_performance.py --results-csv exported_data/results_de_tech_1y.csv --sizes 5 8

  IMPORTANT:
    - This analyzes ONE results CSV at a time
    - To compare 1-year vs 2-year holding, you need TWO separate results CSVs
    - Use --sizes to specify which portfolio sizes to analyze (e.g., 5 8 for Top 5 and Top 8)

Analyzes backtest results across different portfolio sizes.
"""

import pandas as pd
from typing import Dict, List


def calculate_portfolio_metrics(results_csv: str, portfolio_sizes: List[int] = [10, 15, 20, 25, 30, 50, 75, 100]) -> Dict[int, Dict]:
    """
    Calculate performance metrics for different portfolio sizes.

    Args:
        results_csv: Path to backtest results CSV (sorted by intrinsic_to_market_ratio)
        portfolio_sizes: List of Top N sizes to analyze

    Returns:
        Dictionary mapping portfolio size to metrics:
        {
            10: {'avg_return': 12.67, 'winners': 9, 'losers': 1, 'win_rate': 90.0},
            15: {'avg_return': 21.38, 'winners': 13, 'losers': 2, 'win_rate': 86.7},
            ...
        }
    """
    df = pd.read_csv(results_csv)

    results = {}

    for n in portfolio_sizes:
        if n > len(df):
            print(f"  ⚠️  Top {n}: Not enough stocks (only {len(df)} available)")
            continue

        # Get top N stocks (already sorted by intrinsic_to_market_ratio)
        top_n = df.head(n)

        # Calculate metrics
        avg_return = top_n['annualized_return_pct'].mean()
        winners = (top_n['total_return_pct'] > 0).sum()
        losers = (top_n['total_return_pct'] <= 0).sum()
        win_rate = (winners / n) * 100

        results[n] = {
            'avg_return': avg_return,
            'winners': winners,
            'losers': losers,
            'win_rate': win_rate
        }

    return results




def print_performance_summary(results: Dict[int, Dict]):
    """
    Print portfolio performance summary.

    Args:
        results: Dictionary from calculate_portfolio_metrics()
    """
    print("\n" + "="*80)
    print("PORTFOLIO PERFORMANCE BY SIZE")
    print("="*80)
    print(f"\n{'Portfolio':<12} {'Return':<10} {'Win Rate':<12} {'Winners/Losers':<18}")
    print("-" * 80)

    for n in sorted(results.keys()):
        data = results[n]
        print(f"Top {n:<7} {data['avg_return']:6.2f}%    {data['win_rate']:4.1f}%       ({data['winners']:2d}/{data['losers']:2d})")




def print_insights(results: Dict[int, Dict]):
    """
    Print key insights from portfolio analysis.

    Args:
        results: Dictionary from calculate_portfolio_metrics()
    """
    print("\n" + "="*80)
    print("KEY INSIGHTS")
    print("="*80)

    # Find best performing portfolio size
    best_n = max(results.items(), key=lambda x: x[1]['avg_return'])
    print(f"\nBest Returns: Top {best_n[0]} ({best_n[1]['avg_return']:.2f}%, {best_n[1]['win_rate']:.1f}% win rate)")

    # Find best win rate
    best_win_n = max(results.items(), key=lambda x: x[1]['win_rate'])
    print(f"Best Win Rate: Top {best_win_n[0]} ({best_win_n[1]['win_rate']:.1f}%, {best_win_n[1]['avg_return']:.2f}% return)")

    # Portfolio recommendations
    print("\nPortfolio Recommendations:")

    # Find Top 15-20 average (aggressive)
    aggressive_returns = [results[n]['avg_return'] for n in [15, 20] if n in results]
    if aggressive_returns:
        print(f"  • Aggressive (max returns): Top 15-20 (~{sum(aggressive_returns)/len(aggressive_returns):.1f}% annualized)")

    # Top 25 (balanced)
    if 25 in results:
        print(f"  • Balanced: Top 25 ({results[25]['avg_return']:.2f}% annualized, {results[25]['win_rate']:.1f}% win rate)")

    # Top 100 (conservative)
    if 100 in results:
        print(f"  • Conservative (diversified): Top 100 ({results[100]['avg_return']:.2f}% annualized, {results[100]['win_rate']:.1f}% win rate)")


def run_portfolio_analysis(results_csv: str, portfolio_sizes: List[int] = [10, 15, 20, 25, 30, 50, 75, 100]):
    """
    Run complete portfolio performance analysis.

    Args:
        results_csv: Path to backtest results CSV
        portfolio_sizes: List of Top N sizes to analyze
    """
    print("\n" + "="*80)
    print("PORTFOLIO PERFORMANCE ANALYSIS")
    print("="*80)
    print(f"\nAnalyzing: {results_csv}")

    # Calculate actual results
    results = calculate_portfolio_metrics(results_csv, portfolio_sizes)

    # Print summary
    print_performance_summary(results)

    # Print insights
    print_insights(results)

    print("\n" + "="*80)
    print("✅ Portfolio analysis complete")
    print("="*80)

    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Analyze portfolio performance across different Top N sizes"
    )
    parser.add_argument(
        "--results-csv",
        default="exported_data/historical_backtest_results.csv",
        help="Path to backtest results CSV"
    )
    parser.add_argument(
        "--sizes",
        nargs="+",
        type=int,
        default=[10, 15, 20, 25, 30, 50, 75, 100],
        help="Portfolio sizes to analyze (e.g., --sizes 10 15 20 25 30 50 75 100)"
    )

    args = parser.parse_args()

    run_portfolio_analysis(args.results_csv, args.sizes)
