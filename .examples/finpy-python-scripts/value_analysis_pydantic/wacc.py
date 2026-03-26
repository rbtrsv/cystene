#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
WACC (Weighted Average Cost of Capital) Calculation
Calculates cost of equity, cost of debt, and weighted average cost of capital
"""

def run_wacc_analysis():
    """Run complete WACC analysis"""

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

    with open("extracted_data/extracted_markdown.md", 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    currency = financial_data['metadata']['currency']
    scale = financial_data['metadata']['scale']

    print(f"✅ Data loaded - {currency} {scale}")

    # %%
    # CELL 3: PYDANTIC MODELS
    # ========================
    class WACCComponents(BaseModel):
        """Only extract raw data from financial statements - no calculations"""
        risk_free_rate: float = Field(description="Risk-free rate (decimal, e.g., 0.045 for 4.5%)")
        risk_free_rate_source: str = Field(description="Source and reasoning for risk-free rate")

        equity_risk_premium: float = Field(description="Market equity risk premium (decimal)")
        equity_risk_premium_source: str = Field(description="Source and reasoning for equity risk premium")

        beta: float = Field(description="Company's beta coefficient")
        beta_source: str = Field(description="Source and reasoning for beta estimate")

        cost_of_debt_pretax: float = Field(description="Pre-tax cost of debt (decimal)")
        cost_of_debt_reasoning: str = Field(description="How pre-tax cost of debt was determined")

        effective_tax_rate: float = Field(description="Effective corporate tax rate (decimal)")
        tax_rate_calculation: str = Field(description="How tax rate was calculated from financial statements")

        market_value_of_equity: float = Field(description="Market value of equity")
        market_value_of_debt: float = Field(description="Market value of debt")

    class WACCAnalysis(BaseModel):
        """Only extract data and reasoning - no calculations"""
        currency: str = Field(description="Currency of analysis")
        scale: str = Field(description="Scale (millions, thousands)")
        analysis_date: str = Field(description="Date of analysis")

        components: WACCComponents = Field(description="Raw WACC components for calculation")

        calculation_notes: str = Field(description="Key assumptions and methodological notes")
        data_limitations: str = Field(description="Any limitations or assumptions in the analysis")

    # %%
    # CELL 4: WACC CALCULATION ANALYSIS
    # =================================
    print("🚀 Starting WACC Analysis...")

    latest_period = list(financial_data['balance_sheet'].keys())[0]
    balance_sheet = financial_data['balance_sheet'][latest_period]
    income_statement = financial_data['income_statement']
    cash_flow = financial_data['cash_flow']

    # Prepare financial data for analysis
    financial_summary = []
    financial_summary.append(f"BALANCE SHEET ({latest_period}):")
    for line_item, value in balance_sheet.items():
        if value is not None:
            financial_summary.append(f"{line_item}: {value:,.0f}")
        else:
            financial_summary.append(f"{line_item}: [Section Header]")

    financial_summary.append(f"\nINCOME STATEMENT DATA:")
    for period, data in income_statement.items():
        financial_summary.append(f"\n{period}:")
        for line_item, value in data.items():
            if value is not None and 'income' in line_item.lower() or 'tax' in line_item.lower():
                financial_summary.append(f"  {line_item}: {value:,.0f}")

    financial_summary.append(f"\nCASH FLOW DATA:")
    for period, data in cash_flow.items():
        financial_summary.append(f"\n{period}:")
        for line_item, value in data.items():
            if value is not None and ('tax' in line_item.lower() or 'interest' in line_item.lower()):
                financial_summary.append(f"  {line_item}: {value:,.0f}")

    financial_text = "\n".join(financial_summary)

    wacc_agent = Agent(
        'gemini-2.5-pro',
        output_type=WACCAnalysis,
        system_prompt=f'''Extract WACC components from financial statements ONLY - do NOT calculate anything.

TASK: Extract raw data ONLY - do NOT calculate WACC, cost of equity, cost of debt, or weights.

REQUIREMENTS:
1. MARKET PARAMETERS:
   - Estimate reasonable risk-free rate for government bonds
   - Estimate beta based on business characteristics
   - Estimate equity risk premium (standard market estimates 5-7%)
   - Provide clear sources and reasoning for estimates

2. FINANCIAL DATA EXTRACTION:
   - Extract effective tax rate from "Provision for income taxes" / "Income before taxes"
   - Extract pre-tax cost of debt from interest expense and debt balances
   - Extract market values of equity and debt (use book values as proxy if needed)
   - Provide clear reasoning for all estimates and assumptions

3. DATA REQUIREMENTS:
   - Use ONLY the financial data provided - do not make up market data
   - For market values you cannot determine, use book values as proxy
   - Be explicit about all assumptions and data limitations
   - DO NOT calculate cost of equity, after-tax cost of debt, weights, or WACC - Python will do this

Currency: {currency}
Scale: {scale}
Analysis Date: {datetime.now().isoformat()}'''
    )

    analysis_result = wacc_agent.run_sync(f'''Extract WACC components from this company's financial data.

FINANCIAL DATA:
{financial_text}

ADDITIONAL CONTEXT FROM FINANCIAL DISCLOSURES:
{markdown_text}

Extract all WACC component data with detailed reasoning for estimates and clear documentation of all assumptions.''')

    wacc_analysis = analysis_result.output

    print("✅ WACC component extraction completed")

    # %%
    # CELL 4.5: PYTHON CALCULATIONS FOR WACC
    # =======================================
    print("\n🔢 Calculating WACC components...")

    comp = wacc_analysis.components

    # Formula: Cost of Equity = Risk-Free Rate + Beta × Equity Risk Premium
    cost_of_equity = comp.risk_free_rate + (comp.beta * comp.equity_risk_premium)

    # Formula: After-Tax Cost of Debt = Pre-Tax Cost of Debt × (1 - Tax Rate)
    cost_of_debt_aftertax = comp.cost_of_debt_pretax * (1 - comp.effective_tax_rate)

    # Formula: Total Market Value = Market Value of Equity + Market Value of Debt
    total_market_value = comp.market_value_of_equity + comp.market_value_of_debt

    # Formula: Equity Weight = Market Value of Equity / Total Market Value
    equity_weight = comp.market_value_of_equity / total_market_value if total_market_value > 0 else 0

    # Formula: Debt Weight = Market Value of Debt / Total Market Value
    debt_weight = comp.market_value_of_debt / total_market_value if total_market_value > 0 else 0

    # Formula: Weighted Average Cost of Capital (WACC) = (Equity Weight × Cost of Equity) + (Debt Weight × After-Tax Cost of Debt)
    wacc = (equity_weight * cost_of_equity) + (debt_weight * cost_of_debt_aftertax)

    print("✅ WACC calculations completed")

    # %%
    # CELL 5: RESULTS DISPLAY & EXPORT
    # =================================
    print(f"\n" + "="*80)
    print("WACC (WEIGHTED AVERAGE COST OF CAPITAL) ANALYSIS")
    print("="*80)

    print(f"\n📊 COST OF EQUITY CALCULATION:")
    print(f"Risk-free rate: {comp.risk_free_rate:.2%}")
    print(f"Beta: {comp.beta:.2f}")
    print(f"Equity risk premium: {comp.equity_risk_premium:.2%}")
    print(f"Cost of Equity = {comp.risk_free_rate:.2%} + {comp.beta:.2f} × {comp.equity_risk_premium:.2%} = {cost_of_equity:.2%}")

    print(f"\n💰 COST OF DEBT CALCULATION:")
    print(f"Pre-tax cost of debt: {comp.cost_of_debt_pretax:.2%}")
    print(f"Effective tax rate: {comp.effective_tax_rate:.2%}")
    print(f"After-tax cost of debt: {cost_of_debt_aftertax:.2%}")

    print(f"\n⚖️ CAPITAL STRUCTURE:")
    print(f"Market value of equity: {comp.market_value_of_equity:,.0f} {wacc_analysis.currency} {wacc_analysis.scale}")
    print(f"Market value of debt: {comp.market_value_of_debt:,.0f} {wacc_analysis.currency} {wacc_analysis.scale}")
    print(f"Total market value: {total_market_value:,.0f} {wacc_analysis.currency} {wacc_analysis.scale}")
    print(f"Equity weight: {equity_weight:.1%}")
    print(f"Debt weight: {debt_weight:.1%}")

    print(f"\n🎯 WACC CALCULATION:")
    print(f"WACC = ({equity_weight:.1%} × {cost_of_equity:.2%}) + ({debt_weight:.1%} × {cost_of_debt_aftertax:.2%})")
    print(f"WACC = {wacc:.2%}")

    print(f"\n📋 KEY ASSUMPTIONS:")
    print(f"• {comp.risk_free_rate_source}")
    print(f"• {comp.equity_risk_premium_source}")
    print(f"• {comp.beta_source}")
    print(f"• {comp.cost_of_debt_reasoning}")
    print(f"• {comp.tax_rate_calculation}")

    if wacc_analysis.data_limitations:
        print(f"\n⚠️ DATA LIMITATIONS:")
        print(f"• {wacc_analysis.data_limitations}")

    # Export results
    export_data = {
        'metadata': {
            'analysis_date': wacc_analysis.analysis_date,
            'currency': wacc_analysis.currency,
            'scale': wacc_analysis.scale,
            'methodology': 'WACC Analysis'
        },
        'wacc': wacc,
        'components': {
            'cost_of_equity': cost_of_equity,
            'cost_of_debt_aftertax': cost_of_debt_aftertax,
            'equity_weight': equity_weight,
            'debt_weight': debt_weight,
            'total_market_value': total_market_value,
            'risk_free_rate': comp.risk_free_rate,
            'beta': comp.beta,
            'equity_risk_premium': comp.equity_risk_premium,
            'cost_of_debt_pretax': comp.cost_of_debt_pretax,
            'effective_tax_rate': comp.effective_tax_rate,
            'market_value_of_equity': comp.market_value_of_equity,
            'market_value_of_debt': comp.market_value_of_debt
        },
        'assumptions': {
            'risk_free_rate_source': comp.risk_free_rate_source,
            'equity_risk_premium_source': comp.equity_risk_premium_source,
            'beta_source': comp.beta_source,
            'cost_of_debt_reasoning': comp.cost_of_debt_reasoning,
            'tax_rate_calculation': comp.tax_rate_calculation
        },
        'notes': {
            'calculation_notes': wacc_analysis.calculation_notes,
            'data_limitations': wacc_analysis.data_limitations
        }
    }

    output_path = Path("extracted_data/wacc.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results exported to: {output_path}")
    print(f"✅ WACC Analysis completed!")
    print(f"🎯 Final WACC: {wacc:.2%}")

    return export_data

if __name__ == "__main__":
    run_wacc_analysis()

# %% Test cell for Jupyter/VSCode
# Test WACC analysis
# from wacc import run_wacc_analysis

# result = run_wacc_analysis()