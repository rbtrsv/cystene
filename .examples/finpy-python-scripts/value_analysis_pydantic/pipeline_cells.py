#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Value Analysis Pipeline - Interactive Cells for Jupyter/VSCode

Run these cells in order to perform complete Pydantic-based value analysis:
1. Extract financial statements from PDFs
2. Calculate WACC
3. Calculate Greenwald Asset Value
4. Calculate Greenwald EPV and Growth Value
5. Calculate Profit Projections (15 years)
6. Calculate FCFF Projections (15 years)
7. Generate Complete Summary

Prerequisites:
- Place PDF financial statements in /stock_data/ directory
- PDFs should contain balance sheet, income statement, and cash flow statement
"""

# %% Cell 1: Extract Financial Statements from PDFs
"""
Extract all financial data (balance sheet, income statement, cash flow) from PDFs.

Input: stock_data/*.pdf
Output: extracted_data/financial_statements.json
        extracted_data/extracted_markdown.md
"""

from financial_statements import run_financial_statements_extraction

result = run_financial_statements_extraction()

print("\n✅ Financial Statements Extraction Complete")
print(f"Currency: {result['currency']}")
print(f"Scale: {result['scale']}")
print(f"Balance Sheet Items: {result['balance_sheet_items']}")
print(f"Income Statement Items: {result['income_statement_items']}")
print(f"Cash Flow Items: {result['cash_flow_items']}")

# %% Cell 2: Calculate WACC (Weighted Average Cost of Capital)
"""
Calculate cost of equity, cost of debt, and WACC.

Input: extracted_data/financial_statements.json
       extracted_data/extracted_markdown.md
Output: extracted_data/wacc.json
"""

from wacc import run_wacc_analysis

wacc_result = run_wacc_analysis()

print("\n✅ WACC Analysis Complete")
print(f"WACC: {wacc_result['wacc']:.2%}")
print(f"Cost of Equity: {wacc_result['components']['cost_of_equity']:.2%}")
print(f"Cost of Debt (After-Tax): {wacc_result['components']['cost_of_debt_aftertax']:.2%}")
print(f"Equity Weight: {wacc_result['components']['equity_weight']:.1%}")
print(f"Debt Weight: {wacc_result['components']['debt_weight']:.1%}")

# %% Cell 3: Calculate Greenwald Asset Value
"""
Calculate liquidation and reproduction values for all balance sheet items.

Input: extracted_data/financial_statements.json
       extracted_data/extracted_markdown.md
Output: extracted_data/greenwald_asset_value.json
"""

from greenwald_asset_value import run_greenwald_asset_value

asset_result = run_greenwald_asset_value()

print("\n✅ Greenwald Asset Value Complete")
print(f"Currency: {asset_result['metadata']['currency']} {asset_result['metadata']['scale']}")
print(f"Net Asset Value (Book): {asset_result['summary']['net_asset_value_book']:,.0f}")
print(f"Net Asset Value (Liquidation): {asset_result['summary']['net_asset_value_liquidation']:,.0f}")
print(f"Net Asset Value (Reproduction): {asset_result['summary']['net_asset_value_reproduction']:,.0f}")
print(f"Greenwald Asset Value: {asset_result['summary']['greenwald_asset_value']:,.0f}")

# %% Cell 4: Calculate Greenwald EPV and Growth Value
"""
Calculate Earnings Power Value (EPV) and Growth Value.

Input: extracted_data/financial_statements.json
       extracted_data/wacc.json
       extracted_data/greenwald_asset_value.json
       extracted_data/extracted_markdown.md
Output: extracted_data/greenwald_epv_growth_value.json
"""

from greenwald_epv_growth_value import run_greenwald_epv_growth_value_analysis

epv_result = run_greenwald_epv_growth_value_analysis()

print("\n✅ Greenwald EPV and Growth Value Complete")
print(f"Currency: {epv_result['metadata']['currency']} {epv_result['metadata']['scale']}")
print(f"EPV: {epv_result['summary']['epv_total']:,.0f}")
print(f"Growth Value: {epv_result['summary']['growth_value_total']:,.0f}")
print(f"Asset Value: {epv_result['summary']['greenwald_asset_value']:,.0f}")
print(f"Greenwald Total Intrinsic Value: {epv_result['summary']['greenwald_total_intrinsic_value']:,.0f}")
print(f"ROI: {epv_result['growth_components']['roi']:.1%}")

# %% Cell 5: Calculate Profit Projections (15 Years)
"""
Calculate 15-year profit projections with ROI-based growth adjustments.

Input: extracted_data/financial_statements.json
       extracted_data/wacc.json
       extracted_data/greenwald_epv_growth_value.json
       extracted_data/greenwald_asset_value.json
Output: extracted_data/profit_projection.json
"""

from profit_projection import run_profit_projection_analysis

profit_result = run_profit_projection_analysis()

print("\n✅ Profit Projection Analysis Complete")
print(f"Currency: {profit_result['metadata']['currency']} {profit_result['metadata']['scale']}")
print(f"Historical Growth Rate: {profit_result['parameters']['historical_growth_rate']:.1%}")
print(f"ROI Adjustment: {profit_result['parameters']['roi_adjustment']:+.1%}")
print(f"Profit Adjusted Growth Rate: {profit_result['parameters']['profit_adjusted_growth_rate']:.1%}")
print(f"Terminal Growth Rate: {profit_result['parameters']['terminal_growth_rate']:.1%}")
print(f"ExplicitProfits (Years 1-5): {profit_result['summary']['explicit_profits_pv']:,.0f}")
print(f"ProfitTerminalValue (Years 6-15): {profit_result['summary']['profit_terminal_value_pv']:,.0f}")
print(f"Profit Growth Total Intrinsic Value: {profit_result['summary']['profit_growth_total_intrinsic_value']:,.0f}")

# %% Cell 6: Calculate FCFF Projections (15 Years)
"""
Calculate 15-year FCFF projections with ROI-based growth adjustments.

Input: extracted_data/financial_statements.json
       extracted_data/wacc.json
       extracted_data/greenwald_epv_growth_value.json
       extracted_data/greenwald_asset_value.json
Output: extracted_data/fcff_projection.json
"""

from fcff_projection import run_fcff_projection_analysis

fcff_result = run_fcff_projection_analysis()

print("\n✅ FCFF Projection Analysis Complete")
print(f"Currency: {fcff_result['metadata']['currency']} {fcff_result['metadata']['scale']}")
print(f"Historical Growth Rate: {fcff_result['parameters']['historical_growth_rate']:.1%}")
print(f"ROI Adjustment: {fcff_result['parameters']['roi_adjustment']:+.1%}")
print(f"FCFF Adjusted Growth Rate: {fcff_result['parameters']['fcff_adjusted_growth_rate']:.1%}")
print(f"Terminal Growth Rate: {fcff_result['parameters']['terminal_growth_rate']:.1%}")
print(f"ExplicitFCFF (Years 1-5): {fcff_result['summary']['explicit_fcff_pv']:,.0f}")
print(f"FCFFTerminalValue (Years 6-15): {fcff_result['summary']['fcff_terminal_value_pv']:,.0f}")
print(f"FCFF Growth Total Intrinsic Value: {fcff_result['summary']['fcff_growth_total_intrinsic_value']:,.0f}")

# %% Cell 7: Generate Complete Summary
"""
Load all analysis results and calculate average intrinsic value.

Input: All extracted_data/*.json files
Output: extracted_data/complete_summary.json
"""

from summary import get_complete_analysis_summary

summary_result = get_complete_analysis_summary()

print("\n" + "="*80)
print("COMPLETE VALUE ANALYSIS SUMMARY")
print("="*80)

valuation = summary_result['valuation_summary']['total_intrinsic_values']
metrics = summary_result['valuation_summary']['key_metrics']
comparison = summary_result['valuation_summary']['comparison']

print(f"\n🎯 TOTAL INTRINSIC VALUES ({summary_result['metadata']['currency']} {summary_result['metadata']['scale']}):")
print(f"   1. Greenwald Total Intrinsic Value: {valuation['greenwald_total_intrinsic_value']:,.0f}")
print(f"   2. Profit Growth Total Intrinsic Value: {valuation['profit_growth_total_intrinsic_value']:,.0f}")
print(f"   3. FCFF Growth Total Intrinsic Value: {valuation['fcff_growth_total_intrinsic_value']:,.0f}")
print(f"\n   📊 AVERAGE INTRINSIC VALUE: {valuation['average_intrinsic_value']:,.0f}")

print(f"\n📈 VALUATION COMPARISON:")
print(f"   Highest Value: {comparison['highest_value']:,.0f}")
print(f"   Lowest Value: {comparison['lowest_value']:,.0f}")
print(f"   Range: {comparison['range']:,.0f}")
print(f"   Standard Deviation: {comparison['standard_deviation']:,.0f}")

print(f"\n🔍 KEY METRICS:")
print(f"   WACC: {metrics['wacc']:.2%}")
print(f"   Cost of Equity: {metrics['cost_of_equity']:.2%}")
print(f"   ROI: {metrics['roi']:.1%}")
print(f"   Profit Adjusted Growth: {metrics['profit_adjusted_growth_rate']:.1%}")
print(f"   FCFF Adjusted Growth: {metrics['fcff_adjusted_growth_rate']:.1%}")
print(f"   Asset Value: {metrics['greenwald_asset_value']:,.0f}")

print("\n✅ Complete Value Analysis Pipeline Finished!")
print("📁 All results saved to extracted_data/ directory")

# %% Cell 8: Run Complete Pipeline (All Steps at Once)
"""
Run all analysis steps in sequence automatically.

This cell is equivalent to running cells 1-7 sequentially.
Use this for automated execution.
"""

from orchestrator import run_complete_value_analysis

print("🚀 Running Complete Value Analysis Pipeline...")
print("="*80)

run_complete_value_analysis()

print("\n✅ All analysis steps completed!")
print("📁 Check extracted_data/ directory for all JSON outputs")
