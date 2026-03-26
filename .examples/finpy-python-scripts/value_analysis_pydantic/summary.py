#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Value Analysis Summary - Complete Results Dictionary
Loads all analysis results and calculates averages of Total Intrinsic Values
"""

def get_complete_analysis_summary():
    """Load all analysis results and create comprehensive summary with averages"""

    import json
    from pathlib import Path

    print("📊 Loading all analysis results...")

    # Load all JSON files
    with open("extracted_data/financial_statements.json", 'r', encoding='utf-8') as f:
        financial_data = json.load(f)

    with open("extracted_data/wacc.json", 'r', encoding='utf-8') as f:
        wacc_data = json.load(f)

    with open("extracted_data/greenwald_asset_value.json", 'r', encoding='utf-8') as f:
        asset_data = json.load(f)

    with open("extracted_data/greenwald_epv_growth_value.json", 'r', encoding='utf-8') as f:
        epv_growth_data = json.load(f)

    with open("extracted_data/profit_projection.json", 'r', encoding='utf-8') as f:
        profit_data = json.load(f)

    with open("extracted_data/fcff_projection.json", 'r', encoding='utf-8') as f:
        fcff_data = json.load(f)

    print("✅ All files loaded successfully")

    # Extract key metadata
    currency = financial_data['metadata']['currency']
    scale = financial_data['metadata']['scale']

    # Extract the 3 Total Intrinsic Values
    greenwald_total_intrinsic_value = epv_growth_data['summary']['greenwald_total_intrinsic_value']
    profit_growth_total_intrinsic_value = profit_data['summary']['profit_growth_total_intrinsic_value']
    fcff_growth_total_intrinsic_value = fcff_data['summary']['fcff_growth_total_intrinsic_value']

    # Formula: Average Intrinsic Value = Sum of All Intrinsic Values / Number of Methods
    intrinsic_values = [greenwald_total_intrinsic_value, profit_growth_total_intrinsic_value, fcff_growth_total_intrinsic_value]
    average_intrinsic_value = sum(intrinsic_values) / len(intrinsic_values)

    print(f"\n🎯 TOTAL INTRINSIC VALUES ({currency} {scale}):")
    print(f"   Greenwald Total Intrinsic Value: {greenwald_total_intrinsic_value:,.0f}")
    print(f"   Profit Growth Total Intrinsic Value: {profit_growth_total_intrinsic_value:,.0f}")
    print(f"   FCFF Growth Total Intrinsic Value: {fcff_growth_total_intrinsic_value:,.0f}")
    print(f"   AVERAGE: {average_intrinsic_value:,.0f}")

    # Create comprehensive summary dictionary
    complete_summary = {
        'metadata': {
            'currency': currency,
            'scale': scale,
            'analysis_date': epv_growth_data['metadata']['analysis_date']
        },

        'financial_statements': {
            'balance_sheet': financial_data['balance_sheet'],
            'income_statement': financial_data['income_statement'],
            'cash_flow': financial_data['cash_flow'],
            'extraction_date': financial_data['metadata']['extraction_date']
        },

        'wacc_analysis': wacc_data,

        'greenwald_asset_value': asset_data,

        'greenwald_epv_growth': epv_growth_data,

        'profit_projection': profit_data,

        'fcff_projection': fcff_data,

        'valuation_summary': {
            'total_intrinsic_values': {
                'greenwald_total_intrinsic_value': greenwald_total_intrinsic_value,
                'profit_growth_total_intrinsic_value': profit_growth_total_intrinsic_value,
                'fcff_growth_total_intrinsic_value': fcff_growth_total_intrinsic_value,
                'average_intrinsic_value': average_intrinsic_value
            },
            'key_metrics': {
                'wacc': wacc_data['wacc'],
                'cost_of_equity': wacc_data['components']['cost_of_equity'],
                'roi': epv_growth_data['growth_components']['roi'],
                'profit_adjusted_growth_rate': profit_data['parameters']['profit_adjusted_growth_rate'],
                'fcff_adjusted_growth_rate': fcff_data['parameters']['fcff_adjusted_growth_rate'],
                'greenwald_asset_value': asset_data['summary']['greenwald_asset_value']
            },
            'comparison': {
                'highest_value': max(intrinsic_values),
                'lowest_value': min(intrinsic_values),
                # Formula: Range = Maximum Value - Minimum Value
                'range': max(intrinsic_values) - min(intrinsic_values),
                # Formula: Standard Deviation = √(Σ(x - μ)² / N)
                'standard_deviation': (sum([(x - average_intrinsic_value)**2 for x in intrinsic_values]) / len(intrinsic_values))**0.5
            }
        }
    }

    # Save complete summary
    output_path = Path("extracted_data/complete_summary.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(complete_summary, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Complete summary saved to: {output_path}")

    print(f"\n📋 VALUATION COMPARISON:")
    print(f"   Highest Value: {max(intrinsic_values):,.0f} {currency} {scale}")
    print(f"   Lowest Value: {min(intrinsic_values):,.0f} {currency} {scale}")
    print(f"   Range: {max(intrinsic_values) - min(intrinsic_values):,.0f} {currency} {scale}")
    print(f"   Standard Deviation: {complete_summary['valuation_summary']['comparison']['standard_deviation']:,.0f} {currency} {scale}")

    print(f"\n🔍 KEY METRICS:")
    print(f"   WACC: {wacc_data['wacc']:.2%}")
    print(f"   Cost of Equity: {wacc_data['components']['cost_of_equity']:.2%}")
    print(f"   ROI: {epv_growth_data['growth_components']['roi']:.1%}")
    print(f"   Asset Value: {asset_data['summary']['greenwald_asset_value']:,.0f} {currency} {scale}")

    print(f"\n✅ Complete analysis summary ready!")

    return complete_summary

if __name__ == "__main__":
    summary = get_complete_analysis_summary()

# %% Test cell for Jupyter/VSCode
# Test Complete Analysis Summary
# from summary import get_complete_analysis_summary

# result = get_complete_analysis_summary()