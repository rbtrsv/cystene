#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Greenwald Asset Valuation Analysis - Simplified Single Request
Implements Bruce Greenwald's asset valuation methodology using extracted financial statements
"""

def run_greenwald_asset_value():
    import os
    import json
    from pathlib import Path
    from datetime import datetime
    from typing import List
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
    # Load financial statements
    with open("extracted_data/financial_statements.json", 'r', encoding='utf-8') as f:
        financial_data = json.load(f)

    # Load markdown
    with open("extracted_data/extracted_markdown.md", 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    # Extract currency metadata
    currency = financial_data['metadata']['currency']
    scale = financial_data['metadata']['scale']

    print(f"✅ Data loaded - {currency} {scale}")

    # %%
    # CELL 3: PYDANTIC MODELS
    # ========================
    class AssetValuationItem(BaseModel):
        """Only extract raw data from financial statements - no calculations"""
        line_item: str = Field(description="Balance sheet line item name")
        book_value: float = Field(description="Book value from balance sheet")
        item_type: str = Field(description="Asset, Liability, or Equity")
        is_asset: bool = Field(description="True if asset, False if liability/equity")

        liquidation_adjustment_factor: float = Field(description="Liquidation multiplier (0.0 to 1.5+) - how much of book value in forced sale")
        liquidation_reasoning: str = Field(description="Company-specific reasoning for liquidation adjustment")

        reproduction_adjustment_factor: float = Field(description="Reproduction multiplier (0.0 to 2.0+) - replacement cost relative to book")
        reproduction_reasoning: str = Field(description="Company-specific reasoning for reproduction adjustment")

        exact_notes: str = Field(description="Exact quotes from financial notes about this item")
        notes_summary: str = Field(description="Summary of how notes affect valuation")

    class GreenwaldAssetAnalysis(BaseModel):
        """Only extract data and reasoning - no calculations"""
        currency: str = Field(description="Currency of analysis")
        scale: str = Field(description="Scale (millions, thousands)")
        analysis_date: str = Field(description="Date of analysis")

        # Only line items - no totals (Python will calculate)
        line_items: List[AssetValuationItem] = Field(description="Detailed analysis for each line item")

    # %%
    # CELL 4: ASSET VALUATION ANALYSIS
    # =================================
    print("🚀 Starting Greenwald Asset Valuation Analysis...")

    # Get latest balance sheet period
    latest_period = list(financial_data['balance_sheet'].keys())[0]
    balance_sheet = financial_data['balance_sheet'][latest_period]

    # Prepare balance sheet data for analysis
    balance_sheet_lines = []
    for line_item, value in balance_sheet.items():
        if value is not None:
            balance_sheet_lines.append(f"{line_item}: {value:,.0f}")
        else:
            balance_sheet_lines.append(f"{line_item}: [Section Header]")

    balance_sheet_text = "\n".join(balance_sheet_lines)

    # Create comprehensive asset valuation agent
    asset_valuation_agent = Agent(
        'gemini-2.5-pro',
        output_type=GreenwaldAssetAnalysis,
        system_prompt=f'''You are a Greenwald asset valuation expert performing comprehensive analysis of ALL balance sheet items.

    CRITICAL DATA INTEGRITY RULES:
    - ONLY analyze the EXACT line items provided in the balance sheet
    - DO NOT split, combine, or modify any line item names
    - DO NOT add items that are not explicitly listed
    - DO NOT make assumptions about data structure
    - Use the EXACT book values provided for each line item
    - Use the EXACT line item names as provided

    CRITICAL EXCLUSIONS TO AVOID DOUBLE COUNTING:
    - SKIP all items containing the word "Total" (e.g., "Total assets", "Total current assets")
    - SKIP all section headers (items with null values)
    - SKIP all equity items (ownership interests)
    - ONLY analyze individual asset and liability line items

    ANALYSIS REQUIREMENTS:

    1. CLASSIFY each balance sheet item EXACTLY as listed:
    - Asset: Individual resources owned (cash, receivables, inventory, property, investments)
    - Liability: Individual obligations owed (payables, debt, deferred revenue)
    - Equity: Ownership interests (SKIP ENTIRELY)
    - Total/Summary: Items with "Total" in name (SKIP ENTIRELY)

    2. For each INDIVIDUAL ASSET and LIABILITY item (no totals):
    - Extract book_value (EXACT number provided, no modifications)
    - Use EXACT line_item name (no renaming or splitting)
    - Determine item_type (Asset/Liability) and is_asset (true/false)

    3. LIQUIDATION ANALYSIS (forced sale scenario):
    - Estimate liquidation_adjustment_factor as multiplier (0.0 to 1.5+)
    - Examples: 0.8 = 80% of book value, 0.5 = 50% of book value, 1.2 = 120% of book value
    - Provide company-specific reasoning based on financial disclosures
    - DO NOT calculate liquidation values - Python will do this

    4. REPRODUCTION ANALYSIS (replacement cost):
    - Estimate reproduction_adjustment_factor as multiplier (0.0 to 2.0+)
    - Examples: 1.0 = same as book, 1.5 = 150% of book, 0.7 = 70% of book
    - Consider inflation, market conditions, technological changes
    - DO NOT calculate reproduction values - Python will do this

    5. EXTRACT EVIDENCE:
    - Find exact_notes from financial disclosures about each item
    - Summarize how notes_summary affects valuation

    IMPORTANT: ONLY provide individual line item valuations. Do NOT calculate totals or weighted values - Python will handle all calculations.

    MANDATORY VERIFICATION:
    - Your totals MUST NOT include any "Total" line items from the balance sheet
    - Example: If analyzing assets, sum individual items like cash, receivables, etc., but EXCLUDE "Total assets", "Total current assets", etc.
    - The sum of your individual items should approximately match the totals in the balance sheet
    - Every line_item in your response MUST match exactly with the provided balance sheet
    - Every book_value MUST be the exact number from the balance sheet

    Currency: {currency}
    Scale: {scale}
    Analysis Date: {datetime.now().isoformat()}'''
    )

    # Run comprehensive analysis
    analysis_result = asset_valuation_agent.run_sync(f'''Perform Greenwald asset valuation analysis for this company.

    BALANCE SHEET ({latest_period}):
    {balance_sheet_text}

    COMPANY FINANCIAL DISCLOSURES:
    {markdown_text}

    Analyze ALL balance sheet items using the EXACT names and values provided above.''')

    line_item_analysis = analysis_result.output

    print("✅ Analysis completed")

    # %%
    # CELL 4.5: PYTHON CALCULATIONS FOR ASSET VALUES
    # ===============================================
    print("\n🔢 Calculating asset values from adjustment factors...")

    # Calculate values for each line item and store in dictionaries
    line_item_calculations = {}
    for item in line_item_analysis.line_items:
        # Formula: Liquidation Value = Book Value × Liquidation Adjustment Factor
        liquidation_value = item.book_value * item.liquidation_adjustment_factor

        # Formula: Liquidation Adjustment Percentage = (Liquidation Adjustment Factor - 1) × 100
        liquidation_adjustment_pct = (item.liquidation_adjustment_factor - 1) * 100

        # Formula: Reproduction Value = Book Value × Reproduction Adjustment Factor
        reproduction_value = item.book_value * item.reproduction_adjustment_factor

        # Formula: Reproduction Adjustment Percentage = (Reproduction Adjustment Factor - 1) × 100
        reproduction_adjustment_pct = (item.reproduction_adjustment_factor - 1) * 100

        # Store calculations for this line item
        line_item_calculations[item.line_item] = {
            'liquidation_value': liquidation_value,
            'liquidation_adjustment_pct': liquidation_adjustment_pct,
            'reproduction_value': reproduction_value,
            'reproduction_adjustment_pct': reproduction_adjustment_pct
        }

    print("✅ Asset value calculations completed")

    # %%
    # CELL 5: PYTHON CALCULATIONS & RESULTS DISPLAY
    # ==============================================
    print(f"\n" + "="*80)
    print("GREENWALD ASSET VALUATION RESULTS")
    print("="*80)

    # Separate assets and liabilities for calculations
    assets = [item for item in line_item_analysis.line_items if item.is_asset]
    liabilities = [item for item in line_item_analysis.line_items if not item.is_asset and item.item_type == "Liability"]

    # Formula: Total Book Value Assets = Σ(Individual Asset Book Values)
    total_assets_book_value = sum(item.book_value for item in assets)

    # Formula: Total Book Value Liabilities = Σ(Individual Liability Book Values)
    total_liabilities_book_value = sum(item.book_value for item in liabilities)

    # Formula: Net Asset Value Book = Total Assets Book - Total Liabilities Book
    net_asset_value_book = total_assets_book_value - total_liabilities_book_value

    # Formula: Total Liquidation Value Assets = Σ(Individual Asset Liquidation Values)
    total_assets_liquidation_value = sum(line_item_calculations[item.line_item]['liquidation_value'] for item in assets)

    # Formula: Total Liquidation Value Liabilities = Σ(Individual Liability Liquidation Values)
    total_liabilities_liquidation_value = sum(line_item_calculations[item.line_item]['liquidation_value'] for item in liabilities)

    # Formula: Net Asset Value Liquidation = Total Assets Liquidation - Total Liabilities Liquidation
    net_asset_value_liquidation = total_assets_liquidation_value - total_liabilities_liquidation_value

    # Formula: Total Reproduction Value Assets = Σ(Individual Asset Reproduction Values)
    total_assets_reproduction_value = sum(line_item_calculations[item.line_item]['reproduction_value'] for item in assets)

    # Formula: Total Reproduction Value Liabilities = Σ(Individual Liability Reproduction Values)
    total_liabilities_reproduction_value = sum(line_item_calculations[item.line_item]['reproduction_value'] for item in liabilities)

    # Formula: Net Asset Value Reproduction = Total Assets Reproduction - Total Liabilities Reproduction
    net_asset_value_reproduction = total_assets_reproduction_value - total_liabilities_reproduction_value

    # Greenwald weighting methodology
    book_weight = 0.30
    liquidation_weight = 0.30
    reproduction_weight = 0.40

    # Formula: Greenwald Asset Value = (Net Book × 30%) + (Net Liquidation × 30%) + (Net Reproduction × 40%)
    greenwald_asset_value = (
        net_asset_value_book * book_weight +
        net_asset_value_liquidation * liquidation_weight +
        net_asset_value_reproduction * reproduction_weight
    )

    # Display results
    print(f"\n📊 SUMMARY TOTALS ({line_item_analysis.currency} {line_item_analysis.scale}):")
    print(f"{'Method':<15} {'Assets':>15} {'Liabilities':>15} {'Net Value':>15}")
    print("-" * 65)
    print(f"{'Book Value':<15} {total_assets_book_value:>15,.0f} {total_liabilities_book_value:>15,.0f} {net_asset_value_book:>15,.0f}")
    print(f"{'Liquidation':<15} {total_assets_liquidation_value:>15,.0f} {total_liabilities_liquidation_value:>15,.0f} {net_asset_value_liquidation:>15,.0f}")
    print(f"{'Reproduction':<15} {total_assets_reproduction_value:>15,.0f} {total_liabilities_reproduction_value:>15,.0f} {net_asset_value_reproduction:>15,.0f}")

    print(f"\n🎯 GREENWALD ASSET VALUE:")
    print(f"Weighted Average ({book_weight:.0%} book, {liquidation_weight:.0%} liquidation, {reproduction_weight:.0%} reproduction)")
    print(f"Calculation: ({net_asset_value_book:,.0f} × {book_weight}) + ({net_asset_value_liquidation:,.0f} × {liquidation_weight}) + ({net_asset_value_reproduction:,.0f} × {reproduction_weight})")
    print(f"Final Asset Value: {greenwald_asset_value:,.0f} {line_item_analysis.currency} {line_item_analysis.scale}")

    print(f"\n📋 DETAILED LINE ITEM ANALYSIS:")
    print("-" * 120)

    for item in line_item_analysis.line_items:
        calculations = line_item_calculations[item.line_item]
        print(f"\n🔍 {item.line_item}")
        print(f"     📊 Book Value: {item.book_value:,.0f} ({item.item_type})")
        print(f"     ✅ Analysis complete:")
        print(f"        Liquidation Factor: {item.liquidation_adjustment_factor:.2f} → Value: {calculations['liquidation_value']:,.0f} ({calculations['liquidation_adjustment_pct']:+.1f}%)")
        print(f"        💡 Liquidation reasoning: {item.liquidation_reasoning}")
        print(f"        Reproduction Factor: {item.reproduction_adjustment_factor:.2f} → Value: {calculations['reproduction_value']:,.0f} ({calculations['reproduction_adjustment_pct']:+.1f}%)")
        print(f"        🏭 Reproduction reasoning: {item.reproduction_reasoning}")
        if item.notes_summary and len(item.notes_summary.strip()) > 10:
            print(f"        📋 Notes impact: {item.notes_summary}")

    # Export results (with Python-calculated totals)
    export_data = {
        'metadata': {
            'analysis_date': line_item_analysis.analysis_date,
            'currency': line_item_analysis.currency,
            'scale': line_item_analysis.scale,
            'methodology': 'Greenwald Asset Valuation Analysis'
        },
        'summary': {
            'total_assets_book_value': total_assets_book_value,
            'total_liabilities_book_value': total_liabilities_book_value,
            'total_assets_liquidation_value': total_assets_liquidation_value,
            'total_liabilities_liquidation_value': total_liabilities_liquidation_value,
            'total_assets_reproduction_value': total_assets_reproduction_value,
            'total_liabilities_reproduction_value': total_liabilities_reproduction_value,
            'net_asset_value_book': net_asset_value_book,
            'net_asset_value_liquidation': net_asset_value_liquidation,
            'net_asset_value_reproduction': net_asset_value_reproduction,
            'greenwald_asset_value': greenwald_asset_value,
            'weights': {
                'book_weight': book_weight,
                'liquidation_weight': liquidation_weight,
                'reproduction_weight': reproduction_weight
            }
        },
        'line_items': {}
    }

    # Add detailed line items
    for item in line_item_analysis.line_items:
        calculations = line_item_calculations[item.line_item]
        export_data['line_items'][item.line_item] = {
            'book_value': item.book_value,
            'item_type': item.item_type,
            'is_asset': item.is_asset,
            'liquidation_adjustment_factor': item.liquidation_adjustment_factor,
            'liquidation_value': calculations['liquidation_value'],
            'liquidation_adjustment_pct': calculations['liquidation_adjustment_pct'],
            'liquidation_reasoning': item.liquidation_reasoning,
            'reproduction_adjustment_factor': item.reproduction_adjustment_factor,
            'reproduction_value': calculations['reproduction_value'],
            'reproduction_adjustment_pct': calculations['reproduction_adjustment_pct'],
            'reproduction_reasoning': item.reproduction_reasoning,
            'exact_notes': item.exact_notes,
            'notes_summary': item.notes_summary
        }

    # Save results
    output_path = Path("extracted_data/greenwald_asset_value.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results exported to: {output_path}")
    print(f"✅ Greenwald Asset Valuation Analysis completed!")
    print(f"🎯 Final Asset Value: {greenwald_asset_value:,.0f} {line_item_analysis.currency} {line_item_analysis.scale}")

    return export_data

if __name__ == "__main__":
    run_greenwald_asset_value()