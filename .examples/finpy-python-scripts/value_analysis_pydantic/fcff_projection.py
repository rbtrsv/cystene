#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Free Cash Flow to Firm (FCFF) Projection Analysis using Return on Investment
Multi-year FCFF analysis, Return on Investment-based projections, and intrinsic value calculations

METHODOLOGY & FORMULAS:

1. FCFF CALCULATION:
   FCFF = EBIT × (1 - Tax Rate) + Depreciation - CapEx - ΔNWC

   Where:
   ΔNWC = Δ(Accounts Receivable + Inventory + Prepaid) - Δ(Accounts Payable + Accrued Expenses)

2. MULTI-YEAR GROWTH CALCULATION:
   - Extract up to 3 years of FCFF components data
   - Calculate FCFF for each period
   - Calculate growth rates: Y1/Y0-1 and Y2/Y1-1 (if available)
   - Weighted Growth Rate:
     * If 3 years: (Recent Growth × 0.6) + (Previous Growth × 0.4)
     * If 2 years: Single growth rate Y1/Y0-1

3. ROI-BASED GROWTH ADJUSTMENT:
   - If ROI > 20%: Add +2% to weighted growth
   - If ROI > 15%: Add +1% to weighted growth
   - If ROI > 10%: No adjustment to weighted growth
   - If ROI > 7%: Subtract -1% from weighted growth
   - If ROI < 7%: Subtract -2% from weighted growth

   Final Adjusted Growth Rate = Weighted Growth Rate + ROI Adjustment

4. TERMINAL GROWTH RATE:
   Terminal Growth Rate = Adjusted Growth Rate × 0.6

5. FCFF PROJECTIONS (15 years):

   EXPLICIT PERIOD (Years 1-5):
   Year 1 FCFF = Base FCFF × (1 + Adjusted Growth Rate)
   Year 2 FCFF = Year 1 FCFF × (1 + Adjusted Growth Rate)
   ... continue for Years 3, 4, 5

   TERMINAL PERIOD (Years 6-15):
   Year 6 FCFF = Year 5 FCFF × (1 + Terminal Growth Rate)
   Year N FCFF = Year 6 FCFF × (1 + Terminal Growth Rate)^(N-6)

6. PRESENT VALUE CALCULATIONS:
   Year N PV = Year N FCFF / (1 + WACC)^N

   ExplicitFCFF = Σ(Year 1-5 PV)
   FCFFTerminalValue = Σ(Year 6-15 PV)

7. TOTAL INTRINSIC VALUE:
   FCFF Growth Total Value = ExplicitFCFF + FCFFTerminalValue
   FCFF Growth Total Intrinsic Value = FCFF Growth Total Value + Greenwald Asset Value

INPUT SOURCES:
- FCFF Components: Extracted from financial statements by LLM (up to 3 years)
- Growth Rates: Calculated by LLM with weighted averaging
- ROI: Imported from greenwald_epv_growth_value.json
- WACC: Imported from wacc.json (enterprise discount rate)
- Asset Value: Imported from greenwald_asset_value.json

PYTHON CALCULATIONS:
- ROI-based growth adjustments (+2%, +1%, 0%, -1%, -2%)
- All 15-year FCFF projections and present value calculations
- Integration with existing Greenwald analysis results
"""

def run_fcff_projection_analysis():

    # %%
    # CELL 1: IMPORTS & CONFIGURATION
    # ================================
    import os
    import json
    from pathlib import Path
    from datetime import datetime
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

    with open("extracted_data/greenwald_epv_growth_value.json", 'r', encoding='utf-8') as f:
        epv_growth_data = json.load(f)

    with open("extracted_data/greenwald_asset_value.json", 'r', encoding='utf-8') as f:
        asset_data = json.load(f)

    # Extract key parameters
    currency = financial_data['metadata']['currency']
    scale = financial_data['metadata']['scale']
    wacc_rate = wacc_data['wacc']
    return_on_investment = epv_growth_data['growth_components']['roi']
    asset_value = asset_data['summary']['greenwald_asset_value']

    print(f"✅ Data loaded - {currency} {scale}")
    print(f"📊 WACC: {wacc_rate:.2%}")
    print(f"📈 Return on Investment: {return_on_investment:.1%}")
    print(f"🏛️ Asset Value: {asset_value:,.0f} {currency} {scale}")

    # %%
    # CELL 3: PYDANTIC MODEL FOR FCFF EXTRACTION
    # ===========================================
    class FCFFExtraction(BaseModel):
        """Only extract raw data from financial statements - no calculations"""
        most_recent_period: str = Field(description="Most recent period name (Year 0)")
        most_recent_ebit: float = Field(description="EBIT (Operating Income) for most recent period")
        most_recent_income_before_tax: float = Field(description="Income Before Tax for most recent period")
        most_recent_tax_expense: float = Field(description="Tax Expense for most recent period")
        most_recent_depreciation: float = Field(description="Depreciation and Amortization for most recent period")
        most_recent_capex: float = Field(description="Capital expenditures for most recent period")
        most_recent_nwc: float = Field(description="Net working capital (AR + Inventory + Prepaid - AP - Accrued) for most recent period")

        second_recent_period: str = Field(description="Second most recent period name (Year 1)")
        second_recent_ebit: float = Field(description="EBIT (Operating Income) for second most recent period")
        second_recent_income_before_tax: float = Field(description="Income Before Tax for second most recent period")
        second_recent_tax_expense: float = Field(description="Tax Expense for second most recent period")
        second_recent_depreciation: float = Field(description="Depreciation and Amortization for second most recent period")
        second_recent_capex: float = Field(description="Capital expenditures for second most recent period")
        second_recent_nwc: float = Field(description="Net working capital for second most recent period")

        third_recent_period: str = Field(description="Third most recent period name (Year 2), if available", default="")
        third_recent_ebit: float = Field(description="EBIT (Operating Income) for third most recent period, if available", default=0.0)
        third_recent_income_before_tax: float = Field(description="Income Before Tax for third most recent period, if available", default=0.0)
        third_recent_tax_expense: float = Field(description="Tax Expense for third most recent period, if available", default=0.0)
        third_recent_depreciation: float = Field(description="Depreciation and Amortization for third most recent period, if available", default=0.0)
        third_recent_capex: float = Field(description="Capital expenditures for third most recent period, if available", default=0.0)
        third_recent_nwc: float = Field(description="Net working capital for third most recent period, if available", default=0.0)

        years_available: int = Field(description="Number of years of data available (2 or 3)")

    # %%
    # CELL 4: EXTRACT FCFF DATA (LLM TASK)
    # =====================================
    print("🔍 Extracting FCFF components from financial statements...")

    # Prepare financial data for LLM
    income_data = []
    for period, data in financial_data['income_statement'].items():
        income_data.append(f"\n{period} (Income Statement):")
        for line_item, value in data.items():
            if value is not None:
                income_data.append(f"  {line_item}: {value:,.0f}")

    balance_data = []
    for period, data in financial_data['balance_sheet'].items():
        balance_data.append(f"\n{period} (Balance Sheet):")
        for line_item, value in data.items():
            if value is not None:
                balance_data.append(f"  {line_item}: {value:,.0f}")

    cashflow_data = []
    for period, data in financial_data['cash_flow'].items():
        cashflow_data.append(f"\n{period} (Cash Flow):")
        for line_item, value in data.items():
            if value is not None:
                cashflow_data.append(f"  {line_item}: {value:,.0f}")

    financial_text = "\n".join(income_data + balance_data + cashflow_data)

    # LLM agent for FCFF extraction
    extraction_agent = Agent(
        'gemini-2.5-pro',
        output_type=FCFFExtraction,
        system_prompt=f'''Extract raw FCFF components from financial statements ONLY - do NOT calculate anything.

    TASK: Extract raw data ONLY - do NOT calculate FCFF, growth rates, or weighted averages.

    REQUIREMENTS:
    - Find EBIT (Operating Income) for up to 3 most recent periods
    - Find Income Before Tax and Tax Expense for each period
    - Find Depreciation and Amortization from Cash Flow Statement for each period
    - Find Capital Expenditures from Cash Flow Statement for each period
    - Find Net Working Capital components for each period:
      * NWC = (Accounts Receivable + Inventory + Prepaid) - (Accounts Payable + Accrued Expenses)
    - Extract EXACT values as shown in financial statements
    - Set years_available to 2 or 3 based on how many years you find
    - DO NOT calculate FCFF, growth rates, or weighted averages - Python will do this

    Currency: {currency}
    Scale: {scale}'''
    )

    extraction_result = extraction_agent.run_sync(f'''Extract raw FCFF components from these financial statements:

    {financial_text}

    Find EBIT, Income Before Tax, Tax Expense, Depreciation, CapEx, and Net Working Capital components for up to 3 most recent periods.''')

    fcff_data = extraction_result.output

    print(f"✅ FCFF extraction completed")
    print(f"📊 Years available: {fcff_data.years_available}")

    # %%
    # CELL 4.5: PYTHON CALCULATIONS FOR FCFF VALUES
    # ==============================================
    print("\n🔢 Calculating FCFF values from components...")

    # Formula: Tax Rate = Tax Expense / Income Before Tax
    tax_rate_current = fcff_data.most_recent_tax_expense / fcff_data.most_recent_income_before_tax if fcff_data.most_recent_income_before_tax != 0 else 0.25
    tax_rate_previous = fcff_data.second_recent_tax_expense / fcff_data.second_recent_income_before_tax if fcff_data.second_recent_income_before_tax != 0 else 0.25

    # Formula: Free Cash Flow to Firm (FCFF) = EBIT × (1 - Tax Rate) + Depreciation - CapEx - ΔNWC
    most_recent_fcff = fcff_data.most_recent_ebit * (1 - tax_rate_current) + fcff_data.most_recent_depreciation - fcff_data.most_recent_capex - (fcff_data.most_recent_nwc - fcff_data.second_recent_nwc)
    second_recent_fcff = fcff_data.second_recent_ebit * (1 - tax_rate_previous) + fcff_data.second_recent_depreciation - fcff_data.second_recent_capex - (fcff_data.second_recent_nwc - (fcff_data.third_recent_nwc if fcff_data.years_available == 3 else 0))

    third_recent_fcff = 0
    if fcff_data.years_available == 3 and fcff_data.third_recent_ebit != 0:
        tax_rate_third = fcff_data.third_recent_tax_expense / fcff_data.third_recent_income_before_tax if fcff_data.third_recent_income_before_tax != 0 else 0.25
        # For third year, assume no ΔNWC (baseline)
        third_recent_fcff = fcff_data.third_recent_ebit * (1 - tax_rate_third) + fcff_data.third_recent_depreciation - fcff_data.third_recent_capex

    # Formula: FCFF Growth Rate = (Year_N / Year_N-1) - 1
    fcff_growth_y1_y0 = (most_recent_fcff / second_recent_fcff) - 1 if second_recent_fcff != 0 else 0

    fcff_growth_y2_y1 = 0
    if fcff_data.years_available == 3 and third_recent_fcff != 0:
        # Formula: FCFF Growth Rate = (Year_1 / Year_2) - 1
        fcff_growth_y2_y1 = (second_recent_fcff / third_recent_fcff) - 1

    # Formula: Weighted FCFF Growth Rate = (Recent × 60%) + (Previous × 40%) for 3 years, else just recent growth
    if fcff_data.years_available == 3 and third_recent_fcff != 0:
        weighted_fcff_growth_rate = (fcff_growth_y1_y0 * 0.6) + (fcff_growth_y2_y1 * 0.4)
    else:
        weighted_fcff_growth_rate = fcff_growth_y1_y0

    # Formula: Weighted Average Base FCFF = (Most Recent × 60%) + (Second Recent × 40%)
    weighted_average_base_fcff = (most_recent_fcff * 0.6) + (second_recent_fcff * 0.4)

    print(f"📅 {fcff_data.most_recent_period}: FCFF = {most_recent_fcff:,.0f} {currency} {scale}")
    print(f"📅 {fcff_data.second_recent_period}: FCFF = {second_recent_fcff:,.0f} {currency} {scale}")
    if fcff_data.years_available == 3 and fcff_data.third_recent_period:
        print(f"📅 {fcff_data.third_recent_period}: FCFF = {third_recent_fcff:,.0f} {currency} {scale}")
    print(f"📈 FCFF Growth Y1→Y0: {fcff_growth_y1_y0:.1%}")
    if fcff_data.years_available == 3:
        print(f"📈 FCFF Growth Y2→Y1: {fcff_growth_y2_y1:.1%}")
    print(f"⚖️ Weighted FCFF Growth Rate: {weighted_fcff_growth_rate:.1%}")
    print(f"⚖️ Weighted Average Base FCFF: {weighted_average_base_fcff:,.0f} {currency} {scale}")

    print("✅ FCFF calculations completed")

    # %%
    # CELL 5: FCFF PROJECTIONS (PYTHON CALCULATIONS)
    # ===============================================
    print(f"\n" + "="*80)
    print("FCFF PROJECTION ANALYSIS - RETURN ON INVESTMENT ADJUSTED")
    print("="*80)

    # Use Python-calculated weighted growth rate
    historical_growth_rate = weighted_fcff_growth_rate

    # ROI-based adjustment to historical growth rate
    def calculate_roi_adjustment(base_growth, roi):
        """Adjust historical growth rate based on ROI levels"""
        if roi > 0.20:  # >20% ROI - excellent
            return base_growth + 0.02  # Add 2%
        elif roi > 0.15:  # >15% ROI - very good
            return base_growth + 0.01  # Add 1%
        elif roi > 0.10:  # >10% ROI - good
            return base_growth         # Keep as is
        elif roi > 0.07:  # >7% ROI - decent
            return base_growth - 0.01  # Subtract 1%
        else:  # <7% ROI - poor
            return base_growth - 0.02  # Subtract 2%

    # Apply ROI adjustment to historical growth
    roi_adjustment = 0.02 if return_on_investment > 0.20 else \
                    0.01 if return_on_investment > 0.15 else \
                    0.00 if return_on_investment > 0.10 else \
                    -0.01 if return_on_investment > 0.07 else -0.02

    fcff_adjusted_growth_rate = calculate_roi_adjustment(historical_growth_rate, return_on_investment)
    terminal_growth_rate = fcff_adjusted_growth_rate * 0.6

    # Determine adjustment note
    if return_on_investment > 0.20:
        sustainability_note = f"Excellent ROI (>20%) - Added 2% to historical growth"
    elif return_on_investment > 0.15:
        sustainability_note = f"Very good ROI (>15%) - Added 1% to historical growth"
    elif return_on_investment > 0.10:
        sustainability_note = f"Good ROI (>10%) - No adjustment to historical growth"
    elif return_on_investment > 0.07:
        sustainability_note = f"Decent ROI (>7%) - Reduced 1% from historical growth"
    else:
        sustainability_note = f"Poor ROI (<7%) - Reduced 2% from historical growth"

    base_fcff = weighted_average_base_fcff

    print(f"\n📊 GROWTH RATE CALCULATION:")
    print(f"Multi-year Weighted FCFF Growth Rate: {historical_growth_rate:.1%} ({fcff_data.years_available} years)")
    if fcff_data.years_available == 3:
        print(f"  - Recent Growth (60%): {fcff_growth_y1_y0:.1%}")
        print(f"  - Previous Growth (40%): {fcff_growth_y2_y1:.1%}")
    else:
        print(f"  - Single Growth Rate: {fcff_growth_y1_y0:.1%}")
    print(f"Return on Investment: {return_on_investment:.1%}")
    print(f"ROI Adjustment: {roi_adjustment:+.1%}")
    print(f"Final FCFF Adjusted Growth Rate: {historical_growth_rate:.1%} + {roi_adjustment:+.1%} = {fcff_adjusted_growth_rate:.1%}")
    print(f"Terminal Growth Rate: {fcff_adjusted_growth_rate:.1%} × 0.6 = {terminal_growth_rate:.1%}")
    print(f"Note: {sustainability_note}")

    print(f"\n📊 PROJECTION PARAMETERS:")
    print(f"Weighted Average Base FCFF: {base_fcff:,.0f} {currency} {scale}")
    print(f"FCFF Adjusted Growth Rate: {fcff_adjusted_growth_rate:.1%}")
    print(f"Terminal Growth Rate: {terminal_growth_rate:.1%}")
    print(f"WACC Discount Rate: {wacc_rate:.2%}")

    # Years 1-5 Explicit Projections
    print(f"\n📈 EXPLICIT PERIOD (Years 1-5):")
    year_1_fcff = base_fcff * (1 + fcff_adjusted_growth_rate)
    year_2_fcff = year_1_fcff * (1 + fcff_adjusted_growth_rate)
    year_3_fcff = year_2_fcff * (1 + fcff_adjusted_growth_rate)
    year_4_fcff = year_3_fcff * (1 + fcff_adjusted_growth_rate)
    year_5_fcff = year_4_fcff * (1 + fcff_adjusted_growth_rate)

    print(f"Year 1: {year_1_fcff:,.0f} {currency} {scale}")
    print(f"Year 2: {year_2_fcff:,.0f} {currency} {scale}")
    print(f"Year 3: {year_3_fcff:,.0f} {currency} {scale}")
    print(f"Year 4: {year_4_fcff:,.0f} {currency} {scale}")
    print(f"Year 5: {year_5_fcff:,.0f} {currency} {scale}")

    # Present Value of Explicit Period
    year_1_pv = year_1_fcff / (1 + wacc_rate)**1
    year_2_pv = year_2_fcff / (1 + wacc_rate)**2
    year_3_pv = year_3_fcff / (1 + wacc_rate)**3
    year_4_pv = year_4_fcff / (1 + wacc_rate)**4
    year_5_pv = year_5_fcff / (1 + wacc_rate)**5

    explicit_fcff_pv = year_1_pv + year_2_pv + year_3_pv + year_4_pv + year_5_pv

    print(f"\n💰 PRESENT VALUES (Explicit Period):")
    print(f"Year 1 PV: {year_1_pv:,.0f} {currency} {scale}")
    print(f"Year 2 PV: {year_2_pv:,.0f} {currency} {scale}")
    print(f"Year 3 PV: {year_3_pv:,.0f} {currency} {scale}")
    print(f"Year 4 PV: {year_4_pv:,.0f} {currency} {scale}")
    print(f"Year 5 PV: {year_5_pv:,.0f} {currency} {scale}")
    print(f"ExplicitFCFF Total: {explicit_fcff_pv:,.0f} {currency} {scale}")

    # Years 6-15 Terminal Period
    print(f"\n⏳ TERMINAL PERIOD (Years 6-15):")
    year_6_fcff = year_5_fcff * (1 + terminal_growth_rate)
    print(f"Year 6 Starting FCFF: {year_6_fcff:,.0f} {currency} {scale}")

    # Calculate terminal period present value
    fcff_terminal_value_pv = 0
    for year in range(6, 16):  # Years 6 through 15
        year_fcff = year_6_fcff * (1 + terminal_growth_rate)**(year - 6)
        year_pv = year_fcff / (1 + wacc_rate)**year
        fcff_terminal_value_pv += year_pv
        if year <= 8:  # Show first few years
            print(f"Year {year}: FCFF={year_fcff:,.0f}, PV={year_pv:,.0f} {currency} {scale}")

    print(f"... (Years 9-15 calculated)")
    print(f"FCFFTerminalValue Total: {fcff_terminal_value_pv:,.0f} {currency} {scale}")

    # Total Values
    fcff_growth_total_value = explicit_fcff_pv + fcff_terminal_value_pv
    fcff_growth_total_intrinsic_value = fcff_growth_total_value + asset_value

    print(f"\n🎯 TOTAL VALUES:")
    print(f"ExplicitFCFF (Years 1-5): {explicit_fcff_pv:,.0f} {currency} {scale}")
    print(f"FCFFTerminalValue (Years 6-15): {fcff_terminal_value_pv:,.0f} {currency} {scale}")
    print(f"FCFF Growth Total Value: {fcff_growth_total_value:,.0f} {currency} {scale}")
    print(f"Asset Value: {asset_value:,.0f} {currency} {scale}")
    print(f"FCFF Growth Total Intrinsic Value: {fcff_growth_total_intrinsic_value:,.0f} {currency} {scale}")

    print(f"\n📋 CALCULATION VERIFICATION:")
    print(f"• Weighted Average Base FCFF: {base_fcff:,.0f}")
    print(f"• Return on Investment: {return_on_investment:.1%}")
    print(f"• Terminal Growth: {terminal_growth_rate:.1%}")
    print(f"• WACC: {wacc_rate:.2%}")
    print(f"• ExplicitFCFF + FCFFTerminalValue = {explicit_fcff_pv:,.0f} + {fcff_terminal_value_pv:,.0f} = {fcff_growth_total_value:,.0f}")
    print(f"• Total Intrinsic Value = {fcff_growth_total_value:,.0f} + {asset_value:,.0f} = {fcff_growth_total_intrinsic_value:,.0f}")

    # %%
    # CELL 6: EXPORT RESULTS
    # =======================
    export_data = {
        'metadata': {
            'analysis_date': datetime.now().isoformat(),
            'currency': currency,
            'scale': scale,
            'methodology': 'FCFF Projection Analysis - Return on Investment Based'
        },
        'summary': {
            'fcff_growth_total_value': fcff_growth_total_value,
            'asset_value': asset_value,
            'fcff_growth_total_intrinsic_value': fcff_growth_total_intrinsic_value,
            'explicit_fcff_pv': explicit_fcff_pv,
            'fcff_terminal_value_pv': fcff_terminal_value_pv
        },
        'parameters': {
            'weighted_average_base_fcff': base_fcff,
            'return_on_investment': return_on_investment,
            'historical_growth_rate': historical_growth_rate,
            'roi_adjustment': roi_adjustment,
            'fcff_adjusted_growth_rate': fcff_adjusted_growth_rate,
            'sustainability_note': sustainability_note,
            'terminal_growth_rate': terminal_growth_rate,
            'wacc_rate': wacc_rate
        },
        'fcff_data': {
            'most_recent_period': fcff_data.most_recent_period,
            'most_recent_fcff': most_recent_fcff,
            'second_recent_period': fcff_data.second_recent_period,
            'second_recent_fcff': second_recent_fcff,
            'third_recent_period': fcff_data.third_recent_period,
            'third_recent_fcff': third_recent_fcff,
            'fcff_growth_y1_y0': fcff_growth_y1_y0,
            'fcff_growth_y2_y1': fcff_growth_y2_y1,
            'weighted_fcff_growth_rate': weighted_fcff_growth_rate,
            'weighted_average_base_fcff': weighted_average_base_fcff,
            'years_available': fcff_data.years_available
        },
        'projections': {
            'explicit_period': {
                'year_1': {'fcff': year_1_fcff, 'pv': year_1_pv},
                'year_2': {'fcff': year_2_fcff, 'pv': year_2_pv},
                'year_3': {'fcff': year_3_fcff, 'pv': year_3_pv},
                'year_4': {'fcff': year_4_fcff, 'pv': year_4_pv},
                'year_5': {'fcff': year_5_fcff, 'pv': year_5_pv}
            },
            'terminal_period': {
                'year_6_starting_fcff': year_6_fcff,
                'terminal_growth_rate': terminal_growth_rate,
                'total_pv': fcff_terminal_value_pv
            }
        }
    }

    output_path = Path("extracted_data/fcff_projection.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results exported to: {output_path}")
    print(f"✅ FCFF Projection Analysis completed!")
    print(f"🎯 FCFF Growth Total Intrinsic Value: {fcff_growth_total_intrinsic_value:,.0f} {currency} {scale}")
    print(f"📈 ROI-Adjusted Growth: {fcff_adjusted_growth_rate:.1%} (Historical: {historical_growth_rate:.1%})")
    print(f"💡 ExplicitFCFF: {explicit_fcff_pv:,.0f} {currency} {scale}")
    print(f"⏳ FCFFTerminalValue: {fcff_terminal_value_pv:,.0f} {currency} {scale}")

    return export_data

if __name__ == "__main__":
    run_fcff_projection_analysis()

# %% Test cell for Jupyter/VSCode
# Test FCFF Projection analysis
# from fcff_projection import run_fcff_projection_analysis

# result = run_fcff_projection_analysis()