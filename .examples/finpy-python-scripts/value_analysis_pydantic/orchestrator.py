#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Value Analysis Orchestrator - Simplified Pydantic Version
Orchestrates complete financial analysis pipeline in sequential steps
"""

# %% Keep this cell for Jupyter compatibility
def run_complete_value_analysis():
    """Run complete value analysis pipeline"""

    # Import all analysis functions
    from financial_statements import run_financial_statements_extraction
    from wacc import run_wacc_analysis
    from greenwald_asset_value import run_greenwald_asset_value
    from greenwald_epv_growth_value import run_greenwald_epv_growth_value_analysis
    from profit_projection import run_profit_projection_analysis
    from fcff_projection import run_fcff_projection_analysis
    from summary import get_complete_analysis_summary

    print("🚀 STARTING COMPLETE VALUE ANALYSIS PIPELINE")
    print("=" * 80)

    # Run all analyses in sequence
    run_financial_statements_extraction()
    run_wacc_analysis()
    run_greenwald_asset_value()
    run_greenwald_epv_growth_value_analysis()
    run_profit_projection_analysis()
    run_fcff_projection_analysis()

    # Generate complete summary
    get_complete_analysis_summary()

    print("\n✅ COMPLETE VALUE ANALYSIS PIPELINE FINISHED!")
    print("🗂️ All results exported to extracted_data/ directory")

if __name__ == "__main__":
    run_complete_value_analysis()