#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Greenwald EPV (Earnings Power Value) and Growth Value Analysis
Implements Greenwald's EPV methodology and growth value calculations
"""

def run_greenwald_epv_growth_value_analysis():
    # %%
    # CELL 1: IMPORTS & CONFIGURATION
    # ================================
    import os
    import json
    from pathlib import Path
    from datetime import datetime
    from typing import Optional
    from pydantic import BaseModel, Field
    from pydantic_ai import Agent
    import nest_asyncio

    nest_asyncio.apply()
    print("✅ Imports completed")

    # Configuration
    OPENAI_API_KEY = "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"
    GOOGLE_API_KEY = "AIzaSyBeex8YHyPt-3Rwj5HO_2rHLG1-QTG9cGw"

    os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY
    os.environ['GOOGLE_API_KEY'] = GOOGLE_API_KEY
    print("✅ Configuration set")

    # %%
    # CELL 2: LOAD FINANCIAL DATA
    # ============================
    with open("extracted_data/financial_statements.json", 'r', encoding='utf-8') as f:
        financial_data = json.load(f)

    with open("extracted_data/wacc.json", 'r', encoding='utf-8') as f:
        wacc_data = json.load(f)

    with open("extracted_data/greenwald_asset_value.json", 'r', encoding='utf-8') as f:
        asset_data = json.load(f)

    with open("extracted_data/extracted_markdown.md", 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    currency = financial_data['metadata']['currency']
    scale = financial_data['metadata']['scale']
    wacc_rate = wacc_data['wacc']
    greenwald_asset_value = asset_data['summary']['greenwald_asset_value']

    print(f"✅ Data loaded - {currency} {scale}, WACC: {wacc_rate:.2%}")
    print(f"🏛️ Greenwald Asset Value: {greenwald_asset_value:,.0f} {currency} {scale}")

    # %%
    # CELL 3: PYDANTIC MODELS
    # ========================
    class FinancialDataExtraction(BaseModel):
        """Only extract raw data from financial statements - no calculations"""
        # Income Statement Items
        ebit_current: float = Field(description="Current period EBIT (Operating Income)")
        ebit_previous: float = Field(description="Previous period EBIT (Operating Income)")

        income_before_tax_current: float = Field(description="Current period Income Before Tax")
        tax_expense_current: float = Field(description="Current period Tax Expense")

        income_before_tax_previous: float = Field(description="Previous period Income Before Tax")
        tax_expense_previous: float = Field(description="Previous period Tax Expense")

        rd_expense: float = Field(description="R&D expense for the current period")

        # Balance Sheet Items
        ppe_current: float = Field(description="Current period PP&E net")
        ppe_previous: float = Field(description="Previous period PP&E net")

        intangibles_current: float = Field(description="Current period intangible assets", default=0)
        intangibles_previous: float = Field(description="Previous period intangible assets", default=0)

    # %%
    # CELL 4: EPV AND GROWTH ANALYSIS
    # ================================
    print("🚀 Starting Greenwald EPV and Growth Value Analysis...")

    # Prepare income statement data
    income_data = []
    for period, data in financial_data['income_statement'].items():
        income_data.append(f"\n{period}:")
        for line_item, value in data.items():
            if value is not None:
                income_data.append(f"  {line_item}: {value:,.0f}")
            else:
                income_data.append(f"  {line_item}: [Section Header]")

    # Prepare balance sheet data (latest period)
    latest_period = list(financial_data['balance_sheet'].keys())[0]
    balance_sheet = financial_data['balance_sheet'][latest_period]

    balance_data = [f"BALANCE SHEET ({latest_period}):"]
    for line_item, value in balance_sheet.items():
        if value is not None:
            balance_data.append(f"  {line_item}: {value:,.0f}")
        else:
            balance_data.append(f"  {line_item}: [Section Header]")

    financial_text = "\n".join(income_data + balance_data)

    epv_growth_agent = Agent(
        'gemini-2.5-pro',
        output_type=FinancialDataExtraction,
        system_prompt=f'''Extract financial data from statements for EPV and Growth Value analysis.

    TASK: Extract raw data ONLY - do NOT calculate anything.

    REQUIREMENTS:
    - Find Operating Income (EBIT) for current and previous periods
    - Find Income Before Tax and Tax Expense for both periods
    - Find R&D expense for current period
    - Find PP&E (Property, Plant & Equipment) net for current and previous periods
    - Find intangible assets for both periods (if available, otherwise 0)
    - Extract EXACT values as shown in financial statements
    - DO NOT calculate NOPAT, EPV, ROI or any derived values - Python will do this

    Currency: {currency}
    Scale: {scale}'''
    )

    analysis_result = epv_growth_agent.run_sync(f'''Extract financial data from these statements:

    {financial_text}

    Find Operating Income (EBIT), Income Before Tax, Tax Expense, PP&E values, R&D expense, and intangible assets.''')

    extracted_data = analysis_result.output

    print("✅ Data extraction completed")

    # %%
    # CELL 4.5: PYTHON CALCULATIONS FOR EPV AND GROWTH
    # =================================================
    print("\n🔢 Calculating EPV and Growth Value...")

    # Formula: Tax Rate = Tax Expense / Income Before Tax
    tax_rate_current = extracted_data.tax_expense_current / extracted_data.income_before_tax_current if extracted_data.income_before_tax_current != 0 else 0.25
    tax_rate_previous = extracted_data.tax_expense_previous / extracted_data.income_before_tax_previous if extracted_data.income_before_tax_previous != 0 else 0.25

    # Formula: NOPAT = EBIT × (1 - Tax Rate)
    nopat_current = extracted_data.ebit_current * (1 - tax_rate_current)
    nopat_previous = extracted_data.ebit_previous * (1 - tax_rate_previous)

    # Formula: Earnings Power Value (EPV) = NOPAT / WACC
    epv_total = nopat_current / wacc_rate if wacc_rate > 0 else 0

    # Formula: Change in Property Plant & Equipment (ΔPPE) = Current PP&E - Previous PP&E
    delta_ppe = extracted_data.ppe_current - extracted_data.ppe_previous

    # Formula: Change in Intangible Assets (ΔIntangibles) = Current Intangibles - Previous Intangibles
    delta_intangibles = extracted_data.intangibles_current - extracted_data.intangibles_previous

    # Formula: Growth Capital Expenditure = ΔPPE + ΔIntangibles + R&D
    growth_capex = delta_ppe + delta_intangibles + extracted_data.rd_expense

    # Formula: Change in Net Operating Profit After Tax (ΔNOPAT) = Current NOPAT - Previous NOPAT
    delta_nopat = nopat_current - nopat_previous

    # Formula: Return on Investment (ROI) = ΔNOPAT / Growth CapEx
    roi = delta_nopat / growth_capex if growth_capex != 0 else 0

    # Formula: Growth Value = [Growth CapEx × (ROI - WACC)] / WACC (if ROI > WACC)
    growth_value_total = (growth_capex * (roi - wacc_rate)) / wacc_rate if roi > wacc_rate and wacc_rate > 0 else 0

    # Formula: Greenwald Total Intrinsic Value = EPV + Growth Value + Asset Value
    greenwald_total_intrinsic_value = epv_total + growth_value_total + greenwald_asset_value

    print(f"✅ Calculations completed")

    # %%
    # CELL 5: RESULTS DISPLAY & EXPORT
    # =================================
    print(f"\n" + "="*80)
    print("GREENWALD EPV (EARNINGS POWER VALUE) AND GROWTH VALUE ANALYSIS")
    print("="*80)

    print(f"\n💰 EARNINGS POWER VALUE (EPV):")
    print(f"EBIT (Operating Income): {extracted_data.ebit_current:,.0f} {currency} {scale}")
    print(f"Tax Rate: {tax_rate_current:.1%}")
    print(f"NOPAT = EBIT × (1 - Tax Rate): {nopat_current:,.0f} {currency} {scale}")
    print(f"WACC: {wacc_rate:.2%}")
    print(f"EPV = NOPAT / WACC: {epv_total:,.0f} {currency} {scale}")

    print(f"\n📈 GROWTH VALUE ANALYSIS:")
    print(f"ΔPPE: {delta_ppe:,.0f} {currency} {scale}")
    print(f"ΔIntangibles: {delta_intangibles:,.0f} {currency} {scale}")
    print(f"R&D Expense: {extracted_data.rd_expense:,.0f} {currency} {scale}")
    print(f"Growth CapEx = ΔPPE + ΔIntangibles + R&D: {growth_capex:,.0f} {currency} {scale}")
    print(f"ΔNOPAT: {delta_nopat:,.0f} {currency} {scale}")
    print(f"ROI = ΔNOPAT / Growth CapEx: {roi:.1%}")
    print(f"WACC: {wacc_rate:.2%}")
    print(f"Growth Value = [Growth CapEx × (ROI - WACC)] / WACC: {growth_value_total:,.0f} {currency} {scale}")

    print(f"\n🎯 GREENWALD TOTAL INTRINSIC VALUE:")
    print(f"EPV: {epv_total:,.0f} {currency} {scale}")
    print(f"Growth Value: {growth_value_total:,.0f} {currency} {scale}")
    print(f"Greenwald Asset Value: {greenwald_asset_value:,.0f} {currency} {scale}")
    print(f"Greenwald Total Intrinsic Value: {greenwald_total_intrinsic_value:,.0f} {currency} {scale}")

    print(f"\n📋 CALCULATION SUMMARY:")
    print(f"\nFormula Verification:")
    print(f"• NOPAT = {extracted_data.ebit_current:,.0f} × (1 - {tax_rate_current:.1%}) = {nopat_current:,.0f}")
    print(f"• EPV = {nopat_current:,.0f} / {wacc_rate:.3f} = {epv_total:,.0f}")
    print(f"• Growth CapEx = {delta_ppe:,.0f} + {delta_intangibles:,.0f} + {extracted_data.rd_expense:,.0f} = {growth_capex:,.0f}")
    print(f"• ROI = {delta_nopat:,.0f} / {growth_capex:,.0f} = {roi:.1%}")
    if roi > wacc_rate:
        print(f"• Growth Value = [{growth_capex:,.0f} × ({roi:.1%} - {wacc_rate:.1%})] / {wacc_rate:.1%} = {growth_value_total:,.0f}")
    else:
        print(f"• Growth Value = 0 (ROI {roi:.1%} < WACC {wacc_rate:.1%})")
    print(f"• Greenwald Total = {epv_total:,.0f} + {growth_value_total:,.0f} + {greenwald_asset_value:,.0f} = {greenwald_total_intrinsic_value:,.0f}")

    # Export results
    export_data = {
        'metadata': {
            'analysis_date': datetime.now().isoformat(),
            'currency': currency,
            'scale': scale,
            'methodology': 'Precise Greenwald EPV and Growth Value Analysis - Total Company Valuation'
        },
        'summary': {
            'greenwald_total_intrinsic_value': greenwald_total_intrinsic_value,
            'epv_total': epv_total,
            'growth_value_total': growth_value_total,
            'greenwald_asset_value': greenwald_asset_value
        },
        'epv_components': {
            'ebit_current': extracted_data.ebit_current,
            'tax_rate': tax_rate_current,
            'nopat_current': nopat_current,
            'wacc_used': wacc_rate
        },
        'growth_components': {
            'ppe_current': extracted_data.ppe_current,
            'ppe_previous': extracted_data.ppe_previous,
            'delta_ppe': delta_ppe,
            'rd_expense': extracted_data.rd_expense,
            'delta_intangibles': delta_intangibles,
            'growth_capex': growth_capex,
            'nopat_current': nopat_current,
            'nopat_previous': nopat_previous,
            'delta_nopat': delta_nopat,
            'roi': roi,
            'wacc_used': wacc_rate
        }
    }

    output_path = Path("extracted_data/greenwald_epv_growth_value.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results exported to: {output_path}")
    print(f"✅ Precise Greenwald EPV and Growth Analysis completed!")
    print(f"🎯 Greenwald Total Intrinsic Value: {greenwald_total_intrinsic_value:,.0f} {currency} {scale}")
    print(f"📈 EPV Contribution: {epv_total:,.0f} {currency} {scale}")
    print(f"🚀 Growth Contribution: {growth_value_total:,.0f} {currency} {scale}")
    print(f"🏛️ Greenwald Asset Contribution: {greenwald_asset_value:,.0f} {currency} {scale}")

    return export_data

if __name__ == "__main__":
    run_greenwald_epv_growth_value_analysis()

# %% Test cell for Jupyter/VSCode
# Test Greenwald EPV and Growth Value analysis
# from greenwald_epv_growth_value import run_greenwald_epv_growth_value_analysis

# result = run_greenwald_epv_growth_value_analysis()