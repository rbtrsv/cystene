#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Profit Projection Analysis using Return on Investment
Multi-year profit analysis, Return on Investment-based projections, and intrinsic value calculations

METHODOLOGY & FORMULAS:

1. MULTI-YEAR GROWTH CALCULATION:
   - Extract up to 3 years of Net Income data
   - Calculate growth rates: Y1/Y0-1 and Y2/Y1-1 (if available)
   - Weighted Growth Rate:
     * If 3 years: (Recent Growth × 0.6) + (Previous Growth × 0.4)
     * If 2 years: Single growth rate Y1/Y0-1

2. ROI-BASED GROWTH ADJUSTMENT:
   - If ROI > 20%: Add +2% to weighted growth
   - If ROI > 15%: Add +1% to weighted growth
   - If ROI > 10%: No adjustment to weighted growth
   - If ROI > 7%: Subtract -1% from weighted growth
   - If ROI < 7%: Subtract -2% from weighted growth

   Final Adjusted Growth Rate = Weighted Growth Rate + ROI Adjustment

3. TERMINAL GROWTH RATE:
   Terminal Growth Rate = Adjusted Growth Rate × 0.6

4. PROFIT PROJECTIONS (15 years):

   EXPLICIT PERIOD (Years 1-5):
   Year 1 Profit = Base Net Income × (1 + Adjusted Growth Rate)
   Year 2 Profit = Year 1 Profit × (1 + Adjusted Growth Rate)
   ... continue for Years 3, 4, 5

   TERMINAL PERIOD (Years 6-15):
   Year 6 Profit = Year 5 Profit × (1 + Terminal Growth Rate)
   Year N Profit = Year 6 Profit × (1 + Terminal Growth Rate)^(N-6)

5. PRESENT VALUE CALCULATIONS:
   Year N PV = Year N Profit / (1 + WACC)^N

   ExplicitProfits = Σ(Year 1-5 PV)
   ProfitTerminalValue = Σ(Year 6-15 PV)

6. TOTAL INTRINSIC VALUE:
   Profit Growth Total Value = ExplicitProfits + ProfitTerminalValue
   Profit Growth Total Intrinsic Value = Profit Growth Total Value + Greenwald Asset Value

INPUT SOURCES:
- Net Income: Extracted from financial statements by LLM (up to 3 years)
- Growth Rates: Calculated by LLM with weighted averaging
- ROI: Imported from greenwald_epv_growth_value.json
- WACC: Imported from wacc.json
- Asset Value: Imported from greenwald_asset_value.json

PYTHON CALCULATIONS:
- ROI-based growth adjustments (+2%, +1%, 0%, -1%, -2%)
- All 15-year profit projections and present value calculations
- Integration with existing Greenwald analysis results
"""

def run_profit_projection_analysis():
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
    cost_of_equity = wacc_data['components']['cost_of_equity']
    return_on_investment = epv_growth_data['growth_components']['roi']
    asset_value = asset_data['summary']['greenwald_asset_value']

    print(f"✅ Data loaded - {currency} {scale}")
    print(f"📊 WACC: {wacc_rate:.2%}")
    print(f"💰 Cost of Equity: {cost_of_equity:.2%}")
    print(f"📈 Return on Investment: {return_on_investment:.1%}")
    print(f"🏛️ Asset Value: {asset_value:,.0f} {currency} {scale}")

    # %%
    # CELL 3: PYDANTIC MODEL FOR NET INCOME EXTRACTION
    # =================================================
    class NetIncomeExtraction(BaseModel):
        most_recent_period: str = Field(description="Most recent period name (Year 0)")
        most_recent_net_income: float = Field(description="Net income for most recent period")

        second_recent_period: str = Field(description="Second most recent period name (Year 1)")
        second_recent_net_income: float = Field(description="Net income for second most recent period")

        third_recent_period: str = Field(description="Third most recent period name (Year 2), if available", default="")
        third_recent_net_income: float = Field(description="Net income for third most recent period, if available", default=0.0)

        years_available: int = Field(description="Number of years of data available (2 or 3)")

    # %%
    # CELL 4: EXTRACT NET INCOME DATA (LLM TASK)
    # ===========================================
    print("🔍 Extracting Net Income data from financial statements...")

    # Prepare income statement data for LLM
    income_data = []
    for period, data in financial_data['income_statement'].items():
        income_data.append(f"\n{period}:")
        for line_item, value in data.items():
            if value is not None:
                income_data.append(f"  {line_item}: {value:,.0f}")

    financial_text = "\n".join(income_data)

    # Simple LLM agent for Net Income extraction only
    extraction_agent = Agent(
        'gemini-2.5-pro',
        output_type=NetIncomeExtraction,
        system_prompt=f'''Extract Net Income data from financial statements.

    TASK: Extract Net Income values ONLY - do NOT calculate anything.

    REQUIREMENTS:
    - Find Net Income for up to 3 most recent periods (if available)
    - Extract the EXACT values as shown in the financial statements
    - Set years_available to 2 or 3 based on how many years you find
    - DO NOT calculate growth rates - Python will do this
    - DO NOT calculate weighted averages - Python will do this
    - Just extract the raw Net Income values for each period

    Currency: {currency}
    Scale: {scale}'''
    )

    extraction_result = extraction_agent.run_sync(f'''Extract Net Income data from these financial statements:

    {financial_text}

    Find Net Income for up to 3 most recent periods and return the exact values.''')

    net_income_data = extraction_result.output

    print(f"✅ Net Income extraction completed")
    print(f"📊 Years available: {net_income_data.years_available}")
    print(f"📅 {net_income_data.most_recent_period}: {net_income_data.most_recent_net_income:,.0f} {currency} {scale}")
    print(f"📅 {net_income_data.second_recent_period}: {net_income_data.second_recent_net_income:,.0f} {currency} {scale}")
    if net_income_data.years_available == 3 and net_income_data.third_recent_period:
        print(f"📅 {net_income_data.third_recent_period}: {net_income_data.third_recent_net_income:,.0f} {currency} {scale}")

    # %%
    # CELL 4.5: PYTHON CALCULATIONS FOR GROWTH RATES
    # ===============================================
    print("\n🔢 Calculating growth rates and weighted averages...")

    # Formula: Net Income Growth Rate = (Year_N / Year_N-1) - 1
    net_income_growth_y1_y0 = (net_income_data.most_recent_net_income / net_income_data.second_recent_net_income) - 1 if net_income_data.second_recent_net_income != 0 else 0

    net_income_growth_y2_y1 = 0
    if net_income_data.years_available == 3 and net_income_data.third_recent_net_income != 0:
        # Formula: Net Income Growth Rate = (Year_1 / Year_2) - 1
        net_income_growth_y2_y1 = (net_income_data.second_recent_net_income / net_income_data.third_recent_net_income) - 1

    # Formula: Weighted Growth Rate = (Recent × 60%) + (Previous × 40%) for 3 years, else just recent growth
    if net_income_data.years_available == 3 and net_income_data.third_recent_net_income != 0:
        weighted_growth_rate = (net_income_growth_y1_y0 * 0.6) + (net_income_growth_y2_y1 * 0.4)
    else:
        weighted_growth_rate = net_income_growth_y1_y0

    # Formula: Weighted Average Base Net Income = (Most Recent × 60%) + (Second Recent × 40%)
    weighted_average_base_net_income = (net_income_data.most_recent_net_income * 0.6) + (net_income_data.second_recent_net_income * 0.4)

    print(f"📈 Growth Y1→Y0: {net_income_growth_y1_y0:.1%}")
    if net_income_data.years_available == 3:
        print(f"📈 Growth Y2→Y1: {net_income_growth_y2_y1:.1%}")
    print(f"⚖️ Weighted Growth Rate: {weighted_growth_rate:.1%}")
    print(f"⚖️ Weighted Average Base Net Income: {weighted_average_base_net_income:,.0f} {currency} {scale}")

    # %%
    # CELL 5: PROFIT PROJECTIONS (PYTHON CALCULATIONS)
    # =================================================
    print(f"\n" + "="*80)
    print("PROFIT PROJECTION ANALYSIS - RETURN ON INVESTMENT ADJUSTED")
    print("="*80)

    # Use Python-calculated weighted growth rate
    historical_growth_rate = weighted_growth_rate

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

    profit_adjusted_growth_rate = calculate_roi_adjustment(historical_growth_rate, return_on_investment)
    terminal_growth_rate = profit_adjusted_growth_rate * 0.6

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

    print(f"\n📊 GROWTH RATE CALCULATION:")
    print(f"Multi-year Weighted Growth Rate: {historical_growth_rate:.1%} ({net_income_data.years_available} years)")
    if net_income_data.years_available == 3:
        print(f"  - Recent Growth (60%): {net_income_growth_y1_y0:.1%}")
        print(f"  - Previous Growth (40%): {net_income_growth_y2_y1:.1%}")
    else:
        print(f"  - Single Growth Rate: {net_income_growth_y1_y0:.1%}")
    print(f"Return on Investment: {return_on_investment:.1%}")
    print(f"ROI Adjustment: {roi_adjustment:+.1%}")
    print(f"Final Profit Adjusted Growth Rate: {historical_growth_rate:.1%} + {roi_adjustment:+.1%} = {profit_adjusted_growth_rate:.1%}")
    print(f"Terminal Growth Rate: {profit_adjusted_growth_rate:.1%} × 0.6 = {terminal_growth_rate:.1%}")
    print(f"Note: {sustainability_note}")

    print(f"\n📊 PROJECTION PARAMETERS:")
    print(f"Weighted Average Base Net Income: {weighted_average_base_net_income:,.0f} {currency} {scale}")
    print(f"Profit Adjusted Growth Rate: {profit_adjusted_growth_rate:.1%}")
    print(f"Terminal Growth Rate: {terminal_growth_rate:.1%}")
    print(f"Cost of Equity Discount Rate: {cost_of_equity:.2%}")

    # Years 1-5 Explicit Projections
    print(f"\n📈 EXPLICIT PERIOD (Years 1-5):")
    year_1_profit = weighted_average_base_net_income * (1 + profit_adjusted_growth_rate)
    year_2_profit = year_1_profit * (1 + profit_adjusted_growth_rate)
    year_3_profit = year_2_profit * (1 + profit_adjusted_growth_rate)
    year_4_profit = year_3_profit * (1 + profit_adjusted_growth_rate)
    year_5_profit = year_4_profit * (1 + profit_adjusted_growth_rate)

    print(f"Year 1: {year_1_profit:,.0f} {currency} {scale}")
    print(f"Year 2: {year_2_profit:,.0f} {currency} {scale}")
    print(f"Year 3: {year_3_profit:,.0f} {currency} {scale}")
    print(f"Year 4: {year_4_profit:,.0f} {currency} {scale}")
    print(f"Year 5: {year_5_profit:,.0f} {currency} {scale}")

    # Present Value of Explicit Period
    year_1_pv = year_1_profit / (1 + cost_of_equity)**1
    year_2_pv = year_2_profit / (1 + cost_of_equity)**2
    year_3_pv = year_3_profit / (1 + cost_of_equity)**3
    year_4_pv = year_4_profit / (1 + cost_of_equity)**4
    year_5_pv = year_5_profit / (1 + cost_of_equity)**5

    explicit_profits_pv = year_1_pv + year_2_pv + year_3_pv + year_4_pv + year_5_pv

    print(f"\n💰 PRESENT VALUES (Explicit Period):")
    print(f"Year 1 PV: {year_1_pv:,.0f} {currency} {scale}")
    print(f"Year 2 PV: {year_2_pv:,.0f} {currency} {scale}")
    print(f"Year 3 PV: {year_3_pv:,.0f} {currency} {scale}")
    print(f"Year 4 PV: {year_4_pv:,.0f} {currency} {scale}")
    print(f"Year 5 PV: {year_5_pv:,.0f} {currency} {scale}")
    print(f"ExplicitProfits Total: {explicit_profits_pv:,.0f} {currency} {scale}")

    # Years 6-15 Terminal Period
    print(f"\n⏳ TERMINAL PERIOD (Years 6-15):")
    year_6_profit = year_5_profit * (1 + terminal_growth_rate)
    print(f"Year 6 Starting Profit: {year_6_profit:,.0f} {currency} {scale}")

    # Calculate terminal period present value
    profit_terminal_value_pv = 0
    for year in range(6, 16):  # Years 6 through 15
        year_profit = year_6_profit * (1 + terminal_growth_rate)**(year - 6)
        year_pv = year_profit / (1 + cost_of_equity)**year
        profit_terminal_value_pv += year_pv
        if year <= 8:  # Show first few years
            print(f"Year {year}: Profit={year_profit:,.0f}, PV={year_pv:,.0f} {currency} {scale}")

    print(f"... (Years 9-15 calculated)")
    print(f"ProfitTerminalValue Total: {profit_terminal_value_pv:,.0f} {currency} {scale}")

    # Total Values
    profit_growth_total_value = explicit_profits_pv + profit_terminal_value_pv
    profit_growth_total_intrinsic_value = profit_growth_total_value + asset_value

    print(f"\n🎯 TOTAL VALUES:")
    print(f"ExplicitProfits (Years 1-5): {explicit_profits_pv:,.0f} {currency} {scale}")
    print(f"ProfitTerminalValue (Years 6-15): {profit_terminal_value_pv:,.0f} {currency} {scale}")
    print(f"Profit Growth Total Value: {profit_growth_total_value:,.0f} {currency} {scale}")
    print(f"Asset Value: {asset_value:,.0f} {currency} {scale}")
    print(f"Profit Growth Total Intrinsic Value: {profit_growth_total_intrinsic_value:,.0f} {currency} {scale}")

    print(f"\n📋 CALCULATION VERIFICATION:")
    print(f"• Weighted Average Base Net Income: {weighted_average_base_net_income:,.0f}")
    print(f"• Return on Investment: {return_on_investment:.1%}")
    print(f"• Terminal Growth: {terminal_growth_rate:.1%}")
    print(f"• Cost of Equity: {cost_of_equity:.2%}")
    print(f"• ExplicitProfits + ProfitTerminalValue = {explicit_profits_pv:,.0f} + {profit_terminal_value_pv:,.0f} = {profit_growth_total_value:,.0f}")
    print(f"• Total Intrinsic Value = {profit_growth_total_value:,.0f} + {asset_value:,.0f} = {profit_growth_total_intrinsic_value:,.0f}")

    # %%
    # CELL 6: EXPORT RESULTS
    # =======================
    export_data = {
        'metadata': {
            'analysis_date': datetime.now().isoformat(),
            'currency': currency,
            'scale': scale,
            'methodology': 'Profit Projection Analysis - Return on Investment Based'
        },
        'summary': {
            'profit_growth_total_value': profit_growth_total_value,
            'asset_value': asset_value,
            'profit_growth_total_intrinsic_value': profit_growth_total_intrinsic_value,
            'explicit_profits_pv': explicit_profits_pv,
            'profit_terminal_value_pv': profit_terminal_value_pv
        },
        'parameters': {
            'weighted_average_base_net_income': weighted_average_base_net_income,
            'return_on_investment': return_on_investment,
            'historical_growth_rate': historical_growth_rate,
            'roi_adjustment': roi_adjustment,
            'profit_adjusted_growth_rate': profit_adjusted_growth_rate,
            'sustainability_note': sustainability_note,
            'terminal_growth_rate': terminal_growth_rate,
            'wacc_rate': wacc_rate,
            'cost_of_equity': cost_of_equity
        },
        'net_income_data': {
            'most_recent_period': net_income_data.most_recent_period,
            'most_recent_net_income': net_income_data.most_recent_net_income,
            'second_recent_period': net_income_data.second_recent_period,
            'second_recent_net_income': net_income_data.second_recent_net_income,
            'weighted_average_base_net_income': weighted_average_base_net_income,
            'net_income_growth_y1_y0': net_income_growth_y1_y0,
            'net_income_growth_y2_y1': net_income_growth_y2_y1,
            'weighted_growth_rate': weighted_growth_rate
        },
        'projections': {
            'explicit_period': {
                'year_1': {'profit': year_1_profit, 'pv': year_1_pv},
                'year_2': {'profit': year_2_profit, 'pv': year_2_pv},
                'year_3': {'profit': year_3_profit, 'pv': year_3_pv},
                'year_4': {'profit': year_4_profit, 'pv': year_4_pv},
                'year_5': {'profit': year_5_profit, 'pv': year_5_pv}
            },
            'terminal_period': {
                'year_6_starting_profit': year_6_profit,
                'terminal_growth_rate': terminal_growth_rate,
                'total_pv': profit_terminal_value_pv
            }
        }
    }

    output_path = Path("extracted_data/profit_projection.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results exported to: {output_path}")
    print(f"✅ Profit Projection Analysis completed!")
    print(f"🎯 Profit Growth Total Intrinsic Value: {profit_growth_total_intrinsic_value:,.0f} {currency} {scale}")
    print(f"📈 ROI-Adjusted Growth: {profit_adjusted_growth_rate:.1%} (Historical: {historical_growth_rate:.1%})")
    print(f"💡 ExplicitProfits: {explicit_profits_pv:,.0f} {currency} {scale}")
    print(f"⏳ ProfitTerminalValue: {profit_terminal_value_pv:,.0f} {currency} {scale}")

    return export_data

if __name__ == "__main__":
    run_profit_projection_analysis()

# %% Test cell for Jupyter/VSCode
# Test Profit Projection analysis
# from profit_projection import run_profit_projection_analysis

# result = run_profit_projection_analysis()