#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Yahoo Finance Value Investing Orchestrator - Simple Version
Orchestrates complete value investing pipeline in sequential steps
"""

# %% Keep this cell for Jupyter compatibility
def run_complete_value_investing_pipeline():
    """Run complete value investing pipeline"""

    # Import all pipeline functions
    from stock_screener import run_screener
    from fundamentals_downloader import download_fundamentals
    from value_analysis import run_batch_analysis

    print("🚀 STARTING COMPLETE VALUE INVESTING PIPELINE")
    print("=" * 80)

    # Step 1: Screen stocks - NYSE, Technology, Top 10 by market cap
    print("📈 Step 1: Screening stocks...")
    run_screener(
        sectors=['Technology'],
        exchanges=['us'],
        limit=10,
        output_file="extracted_data/screener_output.csv"
    )

    # Step 2: Download fundamentals
    print("📥 Step 2: Downloading fundamentals...")
    download_fundamentals(
        csv_file="extracted_data/screener_output.csv",
        output_dir="extracted_data/ticker_market_jsons"
    )

    # Step 3: Run value analysis
    print("📊 Step 3: Running value analysis...")
    run_batch_analysis(
        fundamentals_dir="extracted_data/ticker_market_jsons",
        output_excel="extracted_data/batch_analysis_results.xlsx",
        min_ratio=1.0,
        min_market_cap=5_000_000_000,
        min_roi=0.0,
        apply_filters=True
    )

    print("\n✅ COMPLETE VALUE INVESTING PIPELINE FINISHED!")
    print("🗂️ All results exported to extracted_data/ directory")

if __name__ == "__main__":
    run_complete_value_investing_pipeline()


# %%
