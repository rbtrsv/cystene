#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Financial Statements Extraction - Simplified Single Request
Extracts ALL financial data (currency, balance sheet, income statement, cash flow) in one request
"""

def run_financial_statements_extraction():
    """Run complete financial statements extraction from PDFs"""

    # %%
    # CELL 1: IMPORTS
    # ==================
    import os
    from pathlib import Path
    from datetime import datetime
    import pymupdf4llm
    from pydantic_ai import Agent
    from pydantic import BaseModel, Field
    import nest_asyncio
    import json

    nest_asyncio.apply()
    print("✅ Imports completed")

    # %%
    # CELL 2: CONFIGURATION
    # ======================
    OPENAI_API_KEY = "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"
    GOOGLE_API_KEY = "AIzaSyBeex8YHyPt-3Rwj5HO_2rHLG1-QTG9cGw"
    PDF_DIRECTORY = "stock_data"

    os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY
    os.environ['GOOGLE_API_KEY'] = GOOGLE_API_KEY
    print("✅ Configuration set - OpenAI + Google Gemini available")

    # %%
    # CELL 3: EXTRACT PDF TEXT AS MARKDOWN
    # =====================================
    pdf_path = Path(PDF_DIRECTORY)
    pdf_files = list(pdf_path.glob("*.pdf"))
    print(f"📄 Found {len(pdf_files)} PDF files")

    all_text = ""
    for pdf_file in pdf_files:
        print(f"🔄 Extracting markdown from {pdf_file.name}...")
        md_text = pymupdf4llm.to_markdown(str(pdf_file))
        all_text += f"\n\n# Document: {pdf_file.name}\n\n" + md_text + "\n\n"

    print(f"✅ Extracted {len(all_text)} characters of markdown text")

    # Save extracted markdown
    Path("extracted_data").mkdir(exist_ok=True)
    with open("extracted_data/extracted_markdown.md", 'w', encoding='utf-8') as f:
        f.write(all_text)
    print("💾 Saved as extracted_data/extracted_markdown.md")

    # %%
    # CELL 4: PYDANTIC MODELS
    # =========================
    class CurrencyMetadata(BaseModel):
        currency: str = Field(description="Primary currency (USD, EUR, RON, etc.)")
        scale: str = Field(description="Scale of amounts (units, thousands, millions)")
        scale_factor: int = Field(description="Multiplication factor (1, 1000, 1000000)")

    class DateValue(BaseModel):
        date: str = Field(description="Date or period")
        value: float | None = Field(description="Financial value, None if not available")

    class FinancialLineItem(BaseModel):
        line_item: str = Field(description="Name of the financial line item")
        values: list[DateValue] = Field(description="List of date/value pairs")

    class BalanceSheet(BaseModel):
        line_items: list[FinancialLineItem] = Field(description="ALL balance sheet line items in document order")

    class IncomeStatement(BaseModel):
        line_items: list[FinancialLineItem] = Field(description="ALL income statement line items in document order")

    class CashFlowStatement(BaseModel):
        line_items: list[FinancialLineItem] = Field(description="ALL cash flow statement line items in document order")

    class FinancialStatements(BaseModel):
        currency: CurrencyMetadata = Field(description="Currency and scale information")
        balance_sheet: BalanceSheet = Field(description="Complete balance sheet data")
        income_statement: IncomeStatement = Field(description="Complete income statement data")
        cash_flow: CashFlowStatement = Field(description="Complete cash flow statement data")

    # %%
    # CELL 5: SINGLE REQUEST FINANCIAL EXTRACTION
    # =============================================
    agent = Agent(
        'gemini-2.5-pro',
        output_type=FinancialStatements,
        system_prompt='''Extract ALL financial statements data from the document in ONE REQUEST.

    EXTRACT COMPLETE DATA FOR:

    1. CURRENCY & SCALE:
       - Identify currency (USD, EUR, RON, etc.)
       - Identify scale ("millions", "thousands", "units")
       - Calculate scale factor (1000000 for millions, 1000 for thousands, 1 for units)

    2. BALANCE SHEET:
       - Extract ALL line items in EXACT document order including section headers
       - Include ALL section headers and subsection headers as they appear
       - Include ALL individual line items (assets, liabilities, equity, totals, subtotals)
       - Preserve exact line item names as they appear in the document
       - Extract values for ALL available periods/dates
       - Use null for section headers and items without numerical values

    3. INCOME STATEMENT:
       - Extract ALL line items in EXACT document order including section headers
       - Include ALL section headers and subsection headers as they appear
       - Include ALL individual line items (revenue, expenses, income, ratios, share data)
       - Preserve exact line item names as they appear in the document
       - Extract values for ALL available periods
       - Use null for section headers and items without numerical values

    4. CASH FLOW STATEMENT:
       - Extract ALL line items in EXACT document order including section headers
       - Include ALL section headers and subsection headers as they appear
       - Include ALL individual line items from all cash flow sections
       - Preserve exact line item names as they appear in the document
       - Extract values for ALL available periods
       - Use null for section headers and items without numerical values

    CRITICAL RULES:
    - Extract COMPLETE data - do not truncate or summarize
    - Preserve EXACT line item names from document INCLUDING all headers and subheaders
    - Extract ALL numerical values for ALL periods
    - Use null for headers, subheaders, and missing values (not 0)
    - Maintain exact document order for all line items
    - Convert amounts to numbers (remove commas, symbols, parentheses)
    '''
    )

    print("🚀 Starting comprehensive financial extraction...")
    result = agent.run_sync(f"Extract ALL financial statements from this document:\n\n{all_text}")
    financial_data = result.output

    print("✅ Financial extraction completed!")

    # %%
    # CELL 6: EXPORT TO JSON
    # =======================
    # Convert to exportable format - group by date first
    # Collect all dates
    all_dates = set()
    for item in financial_data.balance_sheet.line_items:
        for dv in item.values:
            all_dates.add(dv.date)
    for item in financial_data.income_statement.line_items:
        for dv in item.values:
            all_dates.add(dv.date)
    for item in financial_data.cash_flow.line_items:
        for dv in item.values:
            all_dates.add(dv.date)

    # Group by date
    balance_sheet_by_date = {}
    income_statement_by_date = {}
    cash_flow_by_date = {}

    for date in sorted(all_dates):
        balance_sheet_by_date[date] = {}
        income_statement_by_date[date] = {}
        cash_flow_by_date[date] = {}

    # Fill balance sheet data
    for item in financial_data.balance_sheet.line_items:
        for dv in item.values:
            if dv.date in balance_sheet_by_date:
                balance_sheet_by_date[dv.date][item.line_item] = dv.value

    # Fill income statement data
    for item in financial_data.income_statement.line_items:
        for dv in item.values:
            if dv.date in income_statement_by_date:
                income_statement_by_date[dv.date][item.line_item] = dv.value

    # Fill cash flow data
    for item in financial_data.cash_flow.line_items:
        for dv in item.values:
            if dv.date in cash_flow_by_date:
                cash_flow_by_date[dv.date][item.line_item] = dv.value

    # Remove empty date entries
    balance_sheet_by_date = {k: v for k, v in balance_sheet_by_date.items() if v}
    income_statement_by_date = {k: v for k, v in income_statement_by_date.items() if v}
    cash_flow_by_date = {k: v for k, v in cash_flow_by_date.items() if v}

    export_data = {
        "metadata": {
            "extraction_date": datetime.now().isoformat(),
            "currency": financial_data.currency.currency,
            "scale": financial_data.currency.scale,
            "scale_factor": financial_data.currency.scale_factor
        },
        "balance_sheet": balance_sheet_by_date,
        "income_statement": income_statement_by_date,
        "cash_flow": cash_flow_by_date
    }

    # Save to extracted_data/financial_statements.json
    with open("extracted_data/financial_statements.json", "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print("💾 Complete financial data exported to extracted_data/financial_statements.json")

    # Print summary
    print(f"""
    📊 EXTRACTION SUMMARY:
    💰 Currency: {financial_data.currency.currency} (scale: {financial_data.currency.scale})
    🏦 Balance Sheet: {len(financial_data.balance_sheet.line_items)} line items
    📈 Income Statement: {len(financial_data.income_statement.line_items)} line items
    💸 Cash Flow: {len(financial_data.cash_flow.line_items)} line items
    """)

    print("🎉 ALL FINANCIAL STATEMENTS EXTRACTED AND EXPORTED!")

    return {
        "status": "completed",
        "currency": financial_data.currency.currency,
        "scale": financial_data.currency.scale,
        "balance_sheet_items": len(financial_data.balance_sheet.line_items),
        "income_statement_items": len(financial_data.income_statement.line_items),
        "cash_flow_items": len(financial_data.cash_flow.line_items)
    }

    # Save structured data to JSON
    output_path = Path("extracted_data/financial_statements.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Financial data exported to: {output_path}")
    print(f"✅ Financial Statements Analysis completed!")

    return export_data

if __name__ == "__main__":
    run_financial_statements_extraction()

# %% Test cell for Jupyter/VSCode
# Test Financial Statements extraction
# from financial_statements import run_financial_statements_analysis

# result = run_financial_statements_analysis()