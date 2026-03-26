#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Technology Stock Value Analysis

Analyzes Technology & Communication Services sectors using:
- Greenwald EPV + Profit projections (primary valuation)
- FCFF projections with R&D add-back (can fail, not required)
- Minimal filters: Tech sectors only, Market Cap >= $5B, ROI >= 0%

================================================================================
CRITICAL DEVELOPMENT RULE: NEVER USE ARBITRARY CAPS OR ASSUMPTIONS
================================================================================
DO NOT add arbitrary caps, limits, or filters to "fix" large valuations.
DO NOT assume data is wrong just because results seem extreme.
DO NOT cap growth rates, valuations, or any calculated values.

The calculations are mathematically correct. If the data shows 993% growth,
that IS the reality based on the actual financial statements. Extreme valuations
can result from real business volatility (e.g., working capital swings).

ONLY reject calculations for LOGICAL reasons:
  - Negative base values (can't project negative cash flows)
  - Division by zero
  - Mathematical impossibilities (e.g., negative^even creating positive)

Results are results. Calculations are calculations. Do not filter reality.
================================================================================

================================================================================
CRITICAL BUG FIXES IMPLEMENTED
================================================================================
This file contains multiple rejection filters to prevent mathematical errors
that create absurd valuations (e.g., $881 quadrillion). Each filter is marked
with "REJECTION FILTER" comments explaining WHY it exists.

BUG 1: EXPONENTIAL EXPLOSION FROM NEGATIVE GROWTH RAISED TO EVEN POWERS
  - DISCOVERED: VTLE stock with -2100% FCFF growth created $881 quadrillion valuation
  - ROOT CAUSE: base * ((1 + negative_growth) ** even_year) creates positive values
  - EXAMPLE: $10M * ((1 - 21) ** 2) = $10M * 400 = $4B (should be negative!)
  - FIX: Require ALL 3 YEARS to have positive values (profit or FCFF)
  - WHY BETTER: Prevents negative growth calculations entirely by filtering at source
  - LOCATION: Profit function line ~500, FCFF function line ~770

BUG 2: NEGATIVE DIVIDED BY NEGATIVE EQUALS POSITIVE
  - ISSUE: (-$50M / -$100M) = 0.5 makes losses look like "50% growth"
  - REALITY: Both periods are losing money; declining losses ≠ profitability
  - FIX: Reject if both dividend and divisor are negative in growth calculations
  - LOCATION: Profit function line ~525, FCFF function line ~790

BUG 3: COMPOUNDING NEGATIVE BASE VALUES
  - ISSUE: Projecting negative net income or FCFF for 15 years compounds losses
  - EXAMPLE: -$10M at 5% "growth" becomes -$20.8M after 15 years
  - FIX: Reject any stock with negative current net income or FCFF
  - LOCATION: Profit function line ~500, FCFF function line ~770

BUG 4: INCORRECT TAX RATE FOR LOSSES
  - ISSUE: Used 25% default tax rate for unprofitable companies
  - REALITY: Companies pay 0% tax on losses (no income to tax)
  - EXAMPLE: EBIT=-$100M at 25% tax → NOPAT=-$75M (understated loss!)
  - FIX: Use 0% tax rate when income_before_tax ≤ 0
  - LOCATION: Greenwald function line ~370, FCFF function line ~675

BUG 5: NEGATIVE NOPAT (NET OPERATING PROFIT AFTER TAX)
  - ISSUE: Companies with negative operating profit would get negative EPV
  - FIX: Reject any stock with NOPAT ≤ 0
  - LOCATION: Greenwald function line ~380

All rejection filters return book value as intrinsic value (conservative floor).
================================================================================
"""

import json
import pandas as pd
from typing import Dict, Any

# yfinance field lists - actual field names from yfinance JSON
BALANCE_SHEET_FIELDS = [
    'TotalAssets', 'TotalLiabilitiesNetMinorityInterest', 'StockholdersEquity', 'NetPPE',
    'TotalDebt', 'WorkingCapital', 'CashAndCashEquivalents', 'CurrentAssets',
    'CurrentLiabilities', 'NetDebt', 'OrdinarySharesNumber', 'OtherIntangibleAssets'
]

INCOME_STATEMENT_FIELDS = [
    'NetIncome', 'NormalizedIncome', 'OperatingIncome', 'EBITDA', 'PretaxIncome',
    'TaxProvision', 'ResearchAndDevelopment', 'TotalRevenue', 'GrossProfit',
    'NetInterestIncome'  # For banks/financials that don't report OperatingIncome
]

CASH_FLOW_FIELDS = [
    'CapitalExpenditure', 'NetIncomeFromContinuingOperations', 'DepreciationAndAmortization',
    'ChangeInWorkingCapital', 'FreeCashFlow'
]


def safe_float(value: Any) -> float:
    """Convert string or numeric value to float, return 0 if conversion fails"""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def extract_yfinance_financial_data(yfinance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract 5 years and 4 quarters of ALL financial data from yfinance raw JSON
    Simple structure: yfinance_data['balance_sheet']['year_t0'] or ['quarter_0']
    Time-based naming: year_t0 = most recent, year_t_minus_1 = 1 year ago, etc.

    ONLY processes USD stocks - rejects any stock with non-USD financial currency
    """
    try:
        # Extract currency information
        market_currency = yfinance_data['info'].get('currency', 'USD')
        financial_currency = yfinance_data['info'].get('financialCurrency', 'USD')

        # REJECT: Only process stocks where market currency matches financial currency
        # This avoids currency conversion errors and ensures data consistency
        # EXCEPTION: UK stocks use GBp (pence) for market pricing but GBP (pounds) for financials
        # This is standard LSE convention: 1 GBP = 100 GBp (100 pence = 1 pound)
        if financial_currency != market_currency:
            # Allow UK pence/pound conversion
            if not (financial_currency == 'GBP' and market_currency == 'GBp'):
                return {}
            else:
                # UK stocks: Calculate GBP → USD conversion rate
                # Yahoo Finance gives us:
                #   - marketCap in USD (already converted)
                #   - currentPrice in GBp (pence)
                #   - financials in GBP (pounds)
                # Financials are in GBP, so we need USD → GBP conversion rate
                # Code uses: extracted_value = raw_value_GBP / conversion_rate
                # So conversion_rate must be USD_per_GBP (e.g., 1.28 means 1 GBP = 1.28 USD)
                try:
                    current_price_gbp = yfinance_data['info'].get('currentPrice', 0) / 100.0  # Convert pence to pounds
                    shares_outstanding = yfinance_data['info'].get('sharesOutstanding', 0)
                    market_cap_usd = yfinance_data['info'].get('marketCap', 0)

                    # Calculate market cap in GBP
                    if current_price_gbp > 0 and shares_outstanding > 0 and market_cap_usd > 0:
                        market_cap_gbp = current_price_gbp * shares_outstanding
                        # Derive USD/GBP exchange rate (how many USD per 1 GBP)
                        # Since code does raw_value_GBP / conversion_rate = value_USD
                        # We need: GBP / (USD/GBP) = USD
                        # So: conversion_rate = GBP / USD = 1 / (USD/GBP)
                        usd_per_gbp = market_cap_usd / market_cap_gbp  # e.g., 1.03 USD per 1 GBP
                        conversion_rate = 1.0 / usd_per_gbp  # Invert to get GBP per USD (e.g., 0.97 GBP per 1 USD)
                    else:
                        # Missing data - reject stock
                        return {}
                except Exception:
                    # Calculation failed - reject stock
                    return {}
        else:
            # No conversion needed - currencies match
            conversion_rate = 1.0

        extracted_data = {
            'company_info': {
                'code': yfinance_data['symbol'],
                'name': yfinance_data['info'].get('longName', ''),
                'exchange': yfinance_data['info'].get('exchange', ''),
                'currency': market_currency,
                'financial_currency': financial_currency,
                'sector': yfinance_data['info'].get('sector', ''),
                'industry': yfinance_data['info'].get('industry', '')
            },
            'market_data': {
                'market_capitalization': yfinance_data['info'].get('marketCap', 0),
                'shares_outstanding': yfinance_data['info'].get('sharesOutstanding', 0),
                'beta': yfinance_data['info'].get('beta', 1.0),
                'current_pe': yfinance_data['info'].get('trailingPE', 0)
            },
            'balance_sheet': {},
            'income_statement': {},
            'cash_flow': {},
            'years_available': 5,
            'currency_conversion_rate': conversion_rate
        }

        # ==================================================================
        # BALANCE SHEET: 4 quarters + 5 years
        # ==================================================================

        # 4 quarters of balance sheet
        quarterly_balance = yfinance_data.get('balance_sheet_quarterly', {})
        quarter_keys = list(quarterly_balance.keys())[:4]
        for i, quarter_key in enumerate(quarter_keys):
            period_key = f'quarter_{i}'  # quarter_0 = most recent
            quarter_data = quarterly_balance[quarter_key]
            extracted_data['balance_sheet'][period_key] = {'date': quarter_key}

            for field in BALANCE_SHEET_FIELDS:
                raw_value = safe_float(quarter_data.get(field))
                # Convert from local currency to USD
                extracted_data['balance_sheet'][period_key][field] = raw_value / conversion_rate

        # 5 years of balance sheet
        yearly_balance = yfinance_data.get('balance_sheet_yearly', {})
        year_keys = list(yearly_balance.keys())[:5]
        # Use time-based naming: year_t0 = most recent, year_t_minus_4 = oldest
        time_keys = ['year_t0', 'year_t_minus_1', 'year_t_minus_2', 'year_t_minus_3', 'year_t_minus_4']
        for time_key, year_key in zip(time_keys, year_keys):
            year_data = yearly_balance[year_key]
            extracted_data['balance_sheet'][time_key] = {'date': year_key}

            for field in BALANCE_SHEET_FIELDS:
                raw_value = safe_float(year_data.get(field))
                # Convert from local currency to USD
                extracted_data['balance_sheet'][time_key][field] = raw_value / conversion_rate

        # ==================================================================
        # INCOME STATEMENT: 4 quarters + 5 years
        # ==================================================================

        # 4 quarters of income statement
        quarterly_income = yfinance_data.get('income_statement_quarterly', {})
        quarter_keys = list(quarterly_income.keys())[:4]
        for i, quarter_key in enumerate(quarter_keys):
            period_key = f'quarter_{i}'  # quarter_0 = most recent
            quarter_data = quarterly_income[quarter_key]
            extracted_data['income_statement'][period_key] = {'date': quarter_key}

            for field in INCOME_STATEMENT_FIELDS:
                raw_value = safe_float(quarter_data.get(field))
                # Convert from local currency to USD
                extracted_data['income_statement'][period_key][field] = raw_value / conversion_rate

        # 5 years of income statement
        yearly_income = yfinance_data.get('income_statement_yearly', {})
        year_keys = list(yearly_income.keys())[:5]
        # Use time-based naming: year_t0 = most recent, year_t_minus_4 = oldest
        time_keys = ['year_t0', 'year_t_minus_1', 'year_t_minus_2', 'year_t_minus_3', 'year_t_minus_4']
        for time_key, year_key in zip(time_keys, year_keys):
            year_data = yearly_income[year_key]
            extracted_data['income_statement'][time_key] = {'date': year_key}

            for field in INCOME_STATEMENT_FIELDS:
                raw_value = safe_float(year_data.get(field))
                # Convert from local currency to USD
                extracted_data['income_statement'][time_key][field] = raw_value / conversion_rate

        # ==================================================================
        # CASH FLOW: 4 quarters + 5 years
        # ==================================================================

        # 4 quarters of cash flow
        quarterly_cashflow = yfinance_data.get('cash_flow_quarterly', {})
        quarter_keys = list(quarterly_cashflow.keys())[:4]
        for i, quarter_key in enumerate(quarter_keys):
            period_key = f'quarter_{i}'  # quarter_0 = most recent
            quarter_data = quarterly_cashflow[quarter_key]
            extracted_data['cash_flow'][period_key] = {'date': quarter_key}

            for field in CASH_FLOW_FIELDS:
                raw_value = safe_float(quarter_data.get(field))
                # Convert from local currency to USD
                extracted_data['cash_flow'][period_key][field] = raw_value / conversion_rate

        # 5 years of cash flow
        yearly_cashflow = yfinance_data.get('cash_flow_yearly', {})
        year_keys = list(yearly_cashflow.keys())[:5]
        # Use time-based naming: year_t0 = most recent, year_t_minus_4 = oldest
        time_keys = ['year_t0', 'year_t_minus_1', 'year_t_minus_2', 'year_t_minus_3', 'year_t_minus_4']
        for time_key, year_key in zip(time_keys, year_keys):
            year_data = yearly_cashflow[year_key]
            extracted_data['cash_flow'][time_key] = {'date': year_key}

            for field in CASH_FLOW_FIELDS:
                raw_value = safe_float(year_data.get(field))
                # Convert from local currency to USD
                extracted_data['cash_flow'][time_key][field] = raw_value / conversion_rate

        # Add convenience alias for current quarter (most recent quarter balance sheet)
        if 'quarter_0' in extracted_data['balance_sheet']:
            extracted_data['current_quarter'] = extracted_data['balance_sheet']['quarter_0']

        return extracted_data

    except Exception as e:
        print(f"Error extracting yfinance financial data: {e}")
        return {}


def calculate_wacc_from_yfinance(yfinance_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate WACC using yfinance data"""
    try:
        # Risk-free rate and market risk premium (typical estimates)
        risk_free_rate = 0.045  # 4.5% current treasury rate
        market_risk_premium = 0.06  # 6% market risk premium

        # Beta from yfinance data
        beta = yfinance_data['market_data']['beta']

        # Calculate cost of equity using CAPM
        cost_of_equity = risk_free_rate + (beta * market_risk_premium)

        # Debt from most recent quarter (more current than yearly)
        if 'current_quarter' in yfinance_data and yfinance_data['current_quarter']:
            total_debt = yfinance_data['current_quarter']['TotalDebt']
        else:
            # Fallback to yearly data (year_t0 = most recent)
            total_debt = yfinance_data['balance_sheet']['year_t0']['TotalDebt']

        # Calculate tax rate from most recent year (year_t0 = most recent)
        income_before_tax = yfinance_data['income_statement']['year_t0']['PretaxIncome']
        tax_expense = yfinance_data['income_statement']['year_t0']['TaxProvision']

        if income_before_tax > 0 and tax_expense > 0:
            tax_rate = tax_expense / income_before_tax
        else:
            tax_rate = 0.25  # Default corporate tax rate

        # Cost of debt estimation (year_t0 = most recent)
        ebit = yfinance_data['income_statement']['year_t0']['OperatingIncome']
        if total_debt > 0 and ebit > income_before_tax:
            interest_expense = ebit - income_before_tax
            pre_tax_cost_of_debt = interest_expense / total_debt
            cost_of_debt = pre_tax_cost_of_debt * (1 - tax_rate)
        else:
            cost_of_debt = 0.04  # Default 4% cost of debt

        # Market values
        market_cap = yfinance_data['market_data']['market_capitalization']
        market_value_debt = total_debt  # Assume book value approximates market value
        total_value = market_cap + market_value_debt

        # WACC calculation
        if total_value > 0:
            equity_weight = market_cap / total_value
            debt_weight = market_value_debt / total_value
            wacc = (equity_weight * cost_of_equity) + (debt_weight * cost_of_debt)
        else:
            wacc = cost_of_equity  # If no debt, WACC = cost of equity

        return {
            'wacc': wacc,
            'cost_of_equity': cost_of_equity,
            'cost_of_debt': cost_of_debt,
            'beta': beta,
            'tax_rate': tax_rate,
            'debt_weight': debt_weight if total_value > 0 else 0,
            'equity_weight': equity_weight if total_value > 0 else 1
        }

    except Exception as e:
        print(f"Error calculating WACC: {e}")
        return {
            'wacc': 0.10,  # Default 10% WACC
            'cost_of_equity': 0.10,
            'cost_of_debt': 0.04,
            'beta': 1.0,
            'tax_rate': 0.25,
            'debt_weight': 0.3,
            'equity_weight': 0.7
        }


def calculate_book_value_from_yfinance(yfinance_data: Dict[str, Any]) -> float:
    """Calculate book value using yfinance data"""
    try:
        # Use current quarter data for most recent book value
        if 'current_quarter' in yfinance_data and yfinance_data['current_quarter']:
            total_assets = yfinance_data['current_quarter']['TotalAssets']
            total_liabilities = yfinance_data['current_quarter']['TotalLiabilitiesNetMinorityInterest']
            book_value = total_assets - total_liabilities
            return book_value
        else:
            # Fallback to yearly data if quarterly not available (year_t0 = most recent)
            total_assets = yfinance_data['balance_sheet']['year_t0']['TotalAssets']
            total_liabilities = yfinance_data['balance_sheet']['year_t0']['TotalLiabilitiesNetMinorityInterest']
            book_value = total_assets - total_liabilities
            return book_value

    except Exception as e:
        print(f"Error calculating book value: {e}")
        return 0.0


def calculate_greenwald_epv_growth_from_yfinance(yfinance_data: Dict[str, Any], wacc_rate: float, book_value: float) -> Dict[str, Any]:
    """Calculate Greenwald EPV and Growth Value using yfinance data"""
    try:
        # Current year data (year_t0 = most recent)
        current_income = yfinance_data['income_statement']['year_t0']
        current_balance = yfinance_data['balance_sheet']['year_t0']

        # NOPAT = EBIT × (1 - Tax Rate)
        # For Financial Services (banks), use NetInterestIncome when OperatingIncome is not available
        #
        # BANK EBIT: NetInterestIncome vs PretaxIncome Backtesting (2025-10-17)
        # TESTED: PretaxIncome (accounting correct) vs NetInterestIncome (empirically superior)
        # US: NetInterestIncome +2.5% avg return (21.4% vs 18.9%), 96.3% vs 92.5% win rate
        # Germany Top 10-20: NetInterestIncome +9-11% higher returns (concentrated portfolios)
        # Germany Top 30: PretaxIncome +2.4% higher returns (diversified portfolios)
        # RESULT: NetInterestIncome better in 3/4 scenarios - KEEP NetInterestIncome
        #
        # WHY: PretaxIncome removed 3 high-flying US banks (82→79 stocks), losing best performers
        #      NetInterestIncome captures lending scale/revenue growth over margin efficiency
        #      Market rewards revenue expansion in banking - empirically validated
        ebit_current = current_income['OperatingIncome']
        if ebit_current == 0 and yfinance_data['company_info']['sector'] == 'Financial Services':
            ebit_current = current_income.get('NetInterestIncome', 0)
        income_before_tax = current_income['PretaxIncome']
        tax_expense = current_income['TaxProvision']

        # TAX RATE CALCULATION
        # WHY: Need accurate tax rate for NOPAT = EBIT × (1 - Tax Rate) calculation
        # LOGIC:
        #   - If profitable (income_before_tax > 0): Use actual tax rate from financials
        #   - If unprofitable (income_before_tax ≤ 0): Use 0% tax rate
        # REASON FOR 0% ON LOSSES: Companies don't pay taxes on losses (tax expense = $0)
        # PREVIOUS BUG: Used 25% default for losses, which UNDERSTATED the loss
        #   Example: EBIT = -$100M, tax_rate = 25% → NOPAT = -$100M × 0.75 = -$75M
        #            But actual: EBIT = -$100M, tax_rate = 0% → NOPAT = -$100M × 1.0 = -$100M
        # Calculate tax rate (use 0% for negative income - no taxes on losses)
        if income_before_tax > 0:
            tax_rate = tax_expense / income_before_tax if tax_expense > 0 else 0.25
        else:
            tax_rate = 0.0  # No taxes on losses
        nopat_current = ebit_current * (1 - tax_rate)

        # REJECTION FILTER: Negative NOPAT (Operating Profit After Tax)
        # WHY: Companies with negative operating profit are unprofitable at core operations
        # MATH ISSUE: Negative NOPAT would create negative EPV (Earnings Power Value)
        # BUSINESS LOGIC: No value investor would project negative earnings indefinitely
        if nopat_current <= 0:
            return {
                'epv_total': 0,
                'growth_value_total': 0,
                'greenwald_total_intrinsic_value': book_value,
                'nopat_current': nopat_current,
                'roi': 0,
                'tax_rate': tax_rate,
                'ebit_current': ebit_current
            }

        # EPV = NOPAT / WACC
        epv_total = nopat_current / wacc_rate if wacc_rate > 0 else 0

        # Growth Value calculation (simplified)
        growth_value_total = 0
        roi = 0

        if yfinance_data['years_available'] >= 2:
            # Calculate Growth CapEx = ΔPPE + ΔIntangibles + R&D
            # NOTE: OtherIntangibleAssets excludes Goodwill (patents/IP only, not M&A premium)
            # EMPIRICAL: Including ΔIntangibles improved Top 10 returns: US Tech +14.40% (68.89%→83.29%), Japan Tech Top 25 +1.58% (71.05%→72.63%)
            # Use quarterly data for current PP&E and intangibles (more recent)
            if 'current_quarter' in yfinance_data and yfinance_data['current_quarter']:
                ppe_current = yfinance_data['current_quarter']['NetPPE']
                intangibles_current = yfinance_data['current_quarter'].get('OtherIntangibleAssets', 0)
            else:
                ppe_current = current_balance['NetPPE']
                intangibles_current = current_balance.get('OtherIntangibleAssets', 0)

            ppe_previous = yfinance_data['balance_sheet']['year_t_minus_1']['NetPPE']
            intangibles_previous = yfinance_data['balance_sheet']['year_t_minus_1'].get('OtherIntangibleAssets', 0)
            rd_expense = current_income['ResearchAndDevelopment']

            delta_ppe = ppe_current - ppe_previous
            delta_intangibles = intangibles_current - intangibles_previous
            growth_capex = delta_ppe + delta_intangibles + rd_expense

            if growth_capex > 0:
                # Calculate previous NOPAT (year_t_minus_1 = 1 year ago)
                previous_income = yfinance_data['income_statement']['year_t_minus_1']
                ebit_previous = previous_income['OperatingIncome']
                # For Financial Services (banks), use NetInterestIncome (see bank EBIT explanation above)
                if ebit_previous == 0 and yfinance_data['company_info']['sector'] == 'Financial Services':
                    ebit_previous = previous_income.get('NetInterestIncome', 0)
                nopat_previous = ebit_previous * (1 - tax_rate)

                # ROI = ΔNOPAT / Growth CapEx
                delta_nopat = nopat_current - nopat_previous
                roi = delta_nopat / growth_capex

                # MARKET CAP FILTER (>= $5B):
                # ISOLATED: +0.57% return (Top 25: 17.15% → 17.72%), reduces 200 → 113 stocks
                # COMBINED WITH ROI >= 0%: +4.91% return (Top 25: 17.15% → 22.06%), 84% → 96% win rate
                # SYNERGY: Filters amplify each other (expected +0.49%, actual +4.91% for Top 25)
                # WHY: Large cap + positive ROI = quality + execution (82 stocks pass both)
                # NOTE: This parameter remains flexible - adjust based on portfolio size and risk tolerance
                #
                # ROI FILTER (>= 0%):
                # ISOLATED: -0.08% return (Top 25: 17.15% → 17.07%), reduces 200 → 200 stocks (weak alone)
                # COMBINED WITH MCAP >= $5B: +4.34% return (Top 25: 17.72% → 22.06%), +12.0% win rate
                # SYNERGY: Both filters together create +4.42% beyond expected additive effect
                # WHY SYNERGY WORKS: Market cap filters for stability, ROI filters for capital efficiency

                # Growth Value = [Growth CapEx × (ROI - WACC)] / WACC (if ROI > WACC)
                if roi > wacc_rate:
                    growth_value_total = (growth_capex * (roi - wacc_rate)) / wacc_rate

        # Greenwald Total = EPV + Growth Value + Book Value
        greenwald_total_intrinsic_value = epv_total + growth_value_total + book_value

        return {
            'epv_total': epv_total,
            'growth_value_total': growth_value_total,
            'greenwald_total_intrinsic_value': greenwald_total_intrinsic_value,
            'nopat_current': nopat_current,
            'roi': roi,
            'tax_rate': tax_rate,
            'ebit_current': ebit_current
        }

    except Exception as e:
        print(f"Error calculating Greenwald EPV and Growth Value: {e}")
        return {
            'epv_total': 0,
            'growth_value_total': 0,
            'greenwald_total_intrinsic_value': book_value,
            'nopat_current': 0,
            'roi': 0,
            'tax_rate': 0.25,
            'ebit_current': 0
        }


def calculate_profit_projections_from_yfinance(yfinance_data: Dict[str, Any], roi: float, cost_of_equity: float, book_value: float) -> Dict[str, Any]:
    """
    Calculate 15-year profit projections using yfinance data

    CRITICAL FILTER: ALL 3 YEARS OF NET INCOME MUST BE POSITIVE
    - Current year (Y0) > 0
    - Previous year (Y-1) > 0
    - Oldest year (Y-2) > 0

    WHY: We only project growth from consistently profitable companies.
    Volatile profit swings (negative → positive) create unrealistic growth rates.
    """

    # Default return for failed calculations
    def _failed_result(base_net_income=0):
        return {
            'profit_growth_total_value': 0,
            'profit_growth_total_intrinsic_value': book_value,
            'explicit_profits_pv': 0,
            'profit_terminal_value_pv': 0,
            'base_net_income': base_net_income,
            'adjusted_growth_rate': 0,
            'projections': {
                'explicit_period': {},
                'terminal_period': {
                    'terminal_growth_rate': None,
                    'year_6_starting_profit': None,
                    'total_pv': None
                }
            }
        }

    try:
        years_available = yfinance_data['years_available']

        if years_available < 2:
            return _failed_result()

        # Extract Net Income data (year_t0 = most recent, year_t_minus_1 = 1 year ago)
        # Use Normalized Income (excludes special items) instead of Net Income
        # WHY: Profit projections should use sustainable earnings, not one-time events
        # EXAMPLES: FCNCA ($124T), THC ($9.31Q), SHLS ($6.25Q) had special items
        # BACKTEST: US +7.02% returns (20.58%→27.60%)
        #           DE Top15: 100% win rate (93.3%→100%) but lower returns (67%→55%)
        # NOTE: If extreme growth, compare NetIncome vs NormalizedIncome in JSON (CADE 2023: Net $542M steady, Normalized $17M = outlier from special items)
        net_income_current = yfinance_data['income_statement']['year_t0'].get('NormalizedIncome') or yfinance_data['income_statement']['year_t0']['NetIncome']
        net_income_previous = yfinance_data['income_statement']['year_t_minus_1'].get('NormalizedIncome') or yfinance_data['income_statement']['year_t_minus_1']['NetIncome']

        # REJECTION FILTER: Negative Current Net Income
        # WHY: Company is currently unprofitable (losing money)
        # MATH ISSUE: Compounding negative base value for 15 years creates massive negative valuations
        # EXAMPLE: -$10M * ((1.05) ** 15) = -$20.8M (grows losses, not profits!)
        # BUSINESS LOGIC: Cannot project profitability from an unprofitable base
        if net_income_current <= 0:
            return _failed_result(net_income_current)

        # REJECTION FILTER: Any Historical Net Income is Negative
        # WHY: We only want consistently profitable companies
        # ENSURES: All profit values used in growth calculation are positive
        # PREVENTS: Volatile profit swings creating extreme growth rates
        if net_income_previous <= 0:
            return _failed_result(net_income_current)

        if years_available >= 3:
            net_income_oldest = yfinance_data['income_statement']['year_t_minus_2'].get('NormalizedIncome') or yfinance_data['income_statement']['year_t_minus_2']['NetIncome']

            # REJECTION FILTER: Any Historical Net Income is Negative (3-year check)
            # WHY: We only want consistently profitable companies
            # ENSURES: All profit values used in growth calculation are positive
            # PREVENTS: Volatile profit swings creating extreme growth rates
            if net_income_oldest <= 0:
                return _failed_result(net_income_current)

            # REJECTION FILTER: Both values in division are negative
            # WHY: Prevents "negative divided by negative = positive" bug
            # MATH ISSUE: (-$50M / -$100M) - 1 = 0.5 - 1 = -50% BUT this looks like "recovery"
            #             when actually losses are SHRINKING (company getting worse slower)
            # EXAMPLE: Loss of $100M → Loss of $50M looks like 50% decline, but it's still losing money!
            # BUSINESS LOGIC: Declining losses ≠ growing profits; both are unprofitable
            # Growth calc we're checking: (Y0/Y1 - 1) and (Y1/Y2 - 1)
            if (net_income_current < 0 and net_income_previous < 0) or (net_income_previous < 0 and net_income_oldest < 0):
                return _failed_result(net_income_current)

            # NO YoY VOLATILITY CAP (e.g., reject if growth > 200%):
            # WHY: NVDA had 581% YoY growth (AI boom $4.4B→$29.8B) and gained +197% (+89% annualized)
            #      A 200% cap would reject the BEST stock. SHLS had 5,335% spike and lost -34%,
            #      but that's acceptable false positive vs rejecting real transformations.
            #      Weighted growth (60% recent + 40% previous) already dampens extreme spikes.

            # Multi-year weighted growth (60% recent, 40% previous) - work with actual values
            if net_income_previous != 0 and net_income_oldest != 0:
                growth_recent = (net_income_current / net_income_previous) - 1
                growth_previous = (net_income_previous / net_income_oldest) - 1
                weighted_growth = (growth_recent * 0.6) + (growth_previous * 0.4)
            else:
                # Cannot calculate growth - division by zero
                return _failed_result()
        else:
            # Two years: simple growth
            # REJECTION FILTER: Both values in division are negative (2-year version)
            # WHY: Same as 3-year check above - prevents negative/negative = positive bug
            if net_income_current < 0 and net_income_previous < 0:
                return _failed_result(net_income_current)

            if net_income_previous != 0:
                weighted_growth = (net_income_current / net_income_previous) - 1
            else:
                # Cannot calculate growth - division by zero
                return _failed_result()

        # ROI-based growth adjustments
        roi_adjustment = 0
        if roi > 0.20:
            roi_adjustment = 0.02  # +2%
        elif roi > 0.15:
            roi_adjustment = 0.01  # +1%
        elif roi > 0.10:
            roi_adjustment = 0.00  # No adjustment
        elif roi > 0.07:
            roi_adjustment = -0.01  # -1%
        else:
            roi_adjustment = -0.02  # -2%

        adjusted_growth = weighted_growth + roi_adjustment  # NO CAPS - use actual growth

        terminal_growth = adjusted_growth * 0.6  # Terminal growth = 60% of adjusted

        # Calculate projections with detailed breakdown - work with positive net_income only
        explicit_profits_pv = 0
        profit_terminal_pv = 0
        explicit_period = {}
        terminal_period = {}

        # Calculate projections regardless of positive/negative net_income
        # Explicit period (Years 1-5)
        for year in range(1, 6):
            year_profit = net_income_current * ((1 + adjusted_growth) ** year)
            year_pv = year_profit / ((1 + cost_of_equity) ** year)
            explicit_profits_pv += year_pv

            # Store detailed breakdown
            explicit_period[f'year_{year}'] = {
                'profit': year_profit,
                'pv': year_pv
            }

        # Terminal period (Years 6-15)
        year_5_profit = net_income_current * ((1 + adjusted_growth) ** 5)
        year_6_starting_profit = year_5_profit * (1 + terminal_growth)

        for year in range(6, 16):
            terminal_year = year - 5
            year_profit = year_5_profit * ((1 + terminal_growth) ** terminal_year)
            year_pv = year_profit / ((1 + cost_of_equity) ** year)
            profit_terminal_pv += year_pv

        # Store terminal period data
        terminal_period = {
            'year_6_starting_profit': year_6_starting_profit,
            'terminal_growth_rate': terminal_growth,
            'total_pv': profit_terminal_pv
        }

        profit_growth_total_value = explicit_profits_pv + profit_terminal_pv
        profit_growth_total_intrinsic_value = profit_growth_total_value + book_value

        return {
            'profit_growth_total_value': profit_growth_total_value,
            'profit_growth_total_intrinsic_value': profit_growth_total_intrinsic_value,
            'explicit_profits_pv': explicit_profits_pv,
            'profit_terminal_value_pv': profit_terminal_pv,
            'base_net_income': net_income_current,
            'adjusted_growth_rate': adjusted_growth,
            'projections': {
                'explicit_period': explicit_period,
                'terminal_period': terminal_period
            }
        }

    except Exception as e:
        print(f"Error calculating profit projections: {e}")
        return _failed_result()


def calculate_fcff_projections_from_yfinance(yfinance_data: Dict[str, Any], roi: float, wacc_rate: float, book_value: float) -> Dict[str, Any]:
    """
    Calculate 15-year FCFF projections using yfinance data

    CRITICAL FILTER: ALL 3 YEARS MUST HAVE POSITIVE EBIT AND POSITIVE FCFF
    - Current year (Y0): EBIT > 0 AND FCFF > 0
    - Previous year (Y-1): EBIT > 0 AND FCFF > 0
    - Oldest year (Y-2): EBIT > 0 AND FCFF > 0

    WHY: We only project growth from consistently cash-generating companies.
    Volatile FCFF swings (negative → positive) create unrealistic growth rates.
    FCFF can be positive from depreciation even when EBIT=0, so we check both.
    """

    # Default return for failed calculations
    def _failed_result(base_fcff=0):
        return {
            'fcff_growth_total_value': 0,
            'fcff_growth_total_intrinsic_value': book_value,
            'explicit_fcff_pv': 0,
            'fcff_terminal_value_pv': 0,
            'base_fcff': base_fcff,
            'adjusted_growth_rate': 0,
            'projections': {
                'explicit_period': {},
                'terminal_period': {
                    'terminal_growth_rate': None,
                    'year_6_starting_fcff': None,
                    'total_pv': None
                }
            }
        }

    try:
        years_available = yfinance_data['years_available']

        if years_available < 2:
            return _failed_result()

        # Calculate FCFF for available years
        fcff_values = []

        # Map time-based keys: Build dynamically based on years_available
        # Need at least 3 years to calculate 2 FCFF values (need year i+1 for ΔNWC)
        # But with years_available=4, we can calculate 3 FCFF values (year_t0, year_t_minus_1, year_t_minus_2)
        all_time_keys = ['year_t0', 'year_t_minus_1', 'year_t_minus_2', 'year_t_minus_3', 'year_t_minus_4']

        # Only use keys that exist in the data
        num_fcff_to_calculate = min(3, years_available)

        for i in range(num_fcff_to_calculate):
            year_key = all_time_keys[i]

            # Check if this key exists in the data
            if year_key not in yfinance_data['income_statement'] or year_key not in yfinance_data['balance_sheet']:
                break

            income_data = yfinance_data['income_statement'][year_key]
            balance_data = yfinance_data['balance_sheet'][year_key]

            ebit = income_data['OperatingIncome']
            # For Financial Services (banks), use NetInterestIncome (see bank EBIT explanation above)
            if ebit == 0 and yfinance_data['company_info']['sector'] == 'Financial Services':
                ebit = income_data.get('NetInterestIncome', 0)
            income_before_tax = income_data['PretaxIncome']
            tax_expense = income_data['TaxProvision']

            # TAX RATE CALCULATION (same logic as Greenwald function above)
            # Use 0% for losses, actual rate for profits
            if income_before_tax > 0:
                tax_rate = tax_expense / income_before_tax if tax_expense > 0 else 0.25
            else:
                tax_rate = 0.0  # No taxes on losses

            # Get depreciation from cash flow statement
            depreciation = yfinance_data['cash_flow'][year_key]['DepreciationAndAmortization']

            # CapEx (make positive for calculation)
            capex = abs(yfinance_data['cash_flow'][year_key]['CapitalExpenditure'])

            # Get next year's key for ΔNWC and ΔPP&E calculations
            # Need i+1 key to exist for year-over-year comparisons
            next_key = all_time_keys[i+1] if i+1 < len(all_time_keys) else None

            if next_key and next_key in yfinance_data['balance_sheet']:
                nwc_current = balance_data['WorkingCapital']
                nwc_previous = yfinance_data['balance_sheet'][next_key]['WorkingCapital']
                delta_nwc = nwc_current - nwc_previous
            else:
                delta_nwc = 0

            # REJECTION FILTER: Any Historical EBIT is Non-Positive
            # WHY: EBIT=$0 means no operating income, FCFF is only from depreciation (non-operating)
            # EXAMPLE: OR stock had EBIT=$0 in Y1, FCFF=$46.9M (only depreciation), then EBIT recovered to $90M
            #          This created 326% "growth" but it's actually "recovery" not sustainable growth
            # PREVENTS: False extreme valuations from operationally unprofitable periods
            # ROOT CAUSE: FCFF can be positive (from depreciation) even when operations generate $0
            if ebit <= 0:
                return _failed_result()

            # REJECTION FILTER: Working Capital Volatility Creating False FCFF Growth
            # PREVENTS: False extreme growth rates from one-time balance sheet restructuring events
            # WHY: Large working capital swings create one-time cash events, not sustainable operating cash
            # EXAMPLE: BFH had ΔNWC=-$600M (released cash) vs EBIT=$1,044M (57% ratio)
            #          This inflated FCFF from $340M → $1,436M, creating false 323% growth rate
            # LOGIC: If |ΔNWC| > 50% of EBIT, the FCFF is dominated by non-operating working capital changes
            # BUSINESS: FCFF should come from operations (EBIT), not balance sheet restructuring
            # NOT A CAP: This rejects non-operating cash events, doesn't limit actual operating growth
            # SECTOR EXCLUSION: Real Estate (REITs) fail this filter due to extreme working capital
            #                   volatility from property acquisitions/disposals (ΔNWC often >100% of EBIT)
            #
            # ⚠️ CRITICAL: 50% THRESHOLD EMPIRICALLY VALIDATED ⚠️
            # BACKTEST EVIDENCE (tested 45%, 50%, 55%, 60%, 65%):
            #   50% Threshold: 21.39% return, 86.7% win rate (Top 15) - BEST RETURNS
            #                  13.48% return, 81.0% win rate (Top 100) - BEST DIVERSIFIED
            #   60% Threshold: 19.64% return, 80.0% win rate (Top 25) - Strong alternative
            #                  11.84% return, 75.0% win rate (Top 100) - Lower consistency
            #
            # WHY 50% IS OPTIMAL: Achieves highest returns (21.39% at Top 15) AND highest
            # win rates (80-90%) across ALL portfolio sizes. The 60% threshold performs
            # better only at Top 10/20/25 but sacrifices win rate consistency. The 50%
            # threshold is the sweet spot - strict enough to filter false FCFF signals
            # from working capital volatility, but not so strict it rejects quality stocks.
            if abs(delta_nwc) > abs(ebit) * 0.50:
                return _failed_result()

            # FCFF = EBIT × (1 - Tax Rate) + Depreciation - CapEx - ΔNWC
            #
            # TECH/COMM MODIFICATION #1 (NOT IMPLEMENTED - BACKTEST FAILED):
            # Tested maintenance CapEx adjustment for Tech/Comm sectors
            # Formula: FCFF = EBIT(1-Tax) + Depreciation - CapEx + ΔPP&E + R&D - ΔNWC
            # Result: Returns -0.87 to -2.09%, Win rates -2.7 to -4.0%
            # Reason: CapEx adjustment doesn't solve Tech/Comm fundamental issues
            #
            # TECH/COMM MODIFICATION #2: R&D ADD-BACK (NOT IMPLEMENTED - BACKTEST FAILED)
            # Tested R&D add-back for intangible asset creation (25%, 50%, 75% - all identical)
            # Formula: FCFF = EBIT(1-Tax) + Depreciation - CapEx - ΔNWC + (R&D × % × (1-Tax))
            # US Results: Top 10: -5.19% return, -10% win rate | Top 25: -4.37% return, -4% win rate
            # Germany Results: Top 10: -2.41% return, +10% win rate | Top 25: -1.99% return, +8% win rate
            # Verdict: US failed on both metrics; Germany improved win rates but hurt returns
            # Decision: Exclude Tech/Comm sectors entirely - baseline configuration superior
            #
            # Standard FCFF calculation (no sector-specific adjustments)
            fcff = ebit * (1 - tax_rate) + depreciation - capex - delta_nwc

            # ========================================================================
            # TECH-SPECIFIC FCFF CALCULATION (ENABLED)
            # ========================================================================
            # R&D ADD-BACK: Add back 50% of R&D as intangible asset investment
            # This treats R&D like CapEx (building intangible assets)
            # NOTE: Standard FCFF = ebit * (1 - tax_rate) + depreciation - capex - delta_nwc
            # ========================================================================
            research_dev = income_data.get('ResearchAndDevelopment', 0)
            rd_addback = research_dev * 0.50 * (1 - tax_rate)
            fcff = ebit * (1 - tax_rate) + depreciation - capex - delta_nwc + rd_addback

            fcff_values.append(fcff)

        # REJECTION FILTER: Negative Current FCFF (Free Cash Flow to Firm)
        # WHY: Company's operations are burning cash, not generating it
        # MATH ISSUE: Compounding negative FCFF for 15 years creates massive negative valuations
        # FORMULA: FCFF = EBIT(1-Tax) + Depreciation - CapEx - ΔNWC
        # BUSINESS LOGIC: Cannot project positive cash flows from negative cash flow base
        # SECTOR IMPACT: This filter excludes Real Estate and Utilities sectors:
        #   - Real Estate (REITs): Extreme working capital volatility from property transactions
        #     fails ΔNWC filter (>50% of EBIT). High CapEx (68-105% of EBIT).
        #   - Utilities: Massive infrastructure CapEx (220-264% of EBIT) creates consistently
        #     negative FCFF. These sectors are incompatible with FCFF-based valuation.
        if len(fcff_values) > 0 and fcff_values[0] <= 0:
            return _failed_result(fcff_values[0])

        # REJECTION FILTER: Any Historical FCFF is Negative
        # WHY: We only want consistently cash-generating companies
        # ENSURES: All FCFF values used in growth calculation are positive
        # PREVENTS: Volatile FCFF swings (negative → positive) creating extreme growth rates
        # EXAMPLE: FCFF going from -$10M → $50M creates 600% growth (unrealistic for projection)
        if len(fcff_values) >= 2 and fcff_values[1] <= 0:
            return _failed_result(fcff_values[0])
        if len(fcff_values) >= 3 and fcff_values[2] <= 0:
            return _failed_result(fcff_values[0])

        # REJECTION FILTER: Both values in division are negative
        # WHY: Prevents "negative divided by negative = positive" bug
        # MATH ISSUE: (-$20M / -$50M) - 1 = 0.4 - 1 = -40% BUT this misrepresents reality
        #             Cash burn of $50M → Cash burn of $20M looks like improvement
        #             but BOTH are still burning cash (negative cash flow)
        # EXAMPLE: FCFF of -$50M → FCFF of -$20M shows "60% growth" mathematically,
        #          but both periods are LOSING money operationally
        # BUSINESS LOGIC: Improving cash burn ≠ generating cash; both are unprofitable
        # Growth calc we're checking: (Y0/Y1 - 1) and (Y1/Y2 - 1)
        if len(fcff_values) >= 3:
            if (fcff_values[0] < 0 and fcff_values[1] < 0) or (fcff_values[1] < 0 and fcff_values[2] < 0):
                return _failed_result(fcff_values[0])
        elif len(fcff_values) >= 2:
            if fcff_values[0] < 0 and fcff_values[1] < 0:
                return _failed_result(fcff_values[0])

        # Calculate growth rates - work with actual values (positive or negative)
        if len(fcff_values) >= 3 and fcff_values[1] != 0 and fcff_values[2] != 0:
            growth_recent = (fcff_values[0] / fcff_values[1]) - 1
            growth_previous = (fcff_values[1] / fcff_values[2]) - 1
            weighted_growth = (growth_recent * 0.6) + (growth_previous * 0.4)
        elif len(fcff_values) >= 2 and fcff_values[1] != 0:
            weighted_growth = (fcff_values[0] / fcff_values[1]) - 1
        else:
            # Cannot calculate growth - insufficient data or division by zero
            return _failed_result()

        # ROI-based growth adjustments
        roi_adjustment = 0
        if roi > 0.20:
            roi_adjustment = 0.02
        elif roi > 0.15:
            roi_adjustment = 0.01
        elif roi > 0.10:
            roi_adjustment = 0.00
        elif roi > 0.07:
            roi_adjustment = -0.01
        else:
            roi_adjustment = -0.02

        adjusted_growth = weighted_growth + roi_adjustment  # NO CAPS - use actual growth

        terminal_growth = adjusted_growth * 0.6

        # Calculate projections with detailed breakdown - work with positive base_fcff only
        base_fcff = fcff_values[0]
        explicit_fcff_pv = 0
        fcff_terminal_pv = 0
        explicit_period = {}
        terminal_period = {}

        # Calculate projections regardless of positive/negative base_fcff
        # Explicit period (Years 1-5)
        for year in range(1, 6):
            year_fcff = base_fcff * ((1 + adjusted_growth) ** year)
            year_pv = year_fcff / ((1 + wacc_rate) ** year)
            explicit_fcff_pv += year_pv

            # Store detailed breakdown
            explicit_period[f'year_{year}'] = {
                'fcff': year_fcff,
                'pv': year_pv
            }

        # Terminal period (Years 6-15)
        year_5_fcff = base_fcff * ((1 + adjusted_growth) ** 5)
        year_6_starting_fcff = year_5_fcff * (1 + terminal_growth)

        for year in range(6, 16):
            terminal_year = year - 5
            year_fcff = year_5_fcff * ((1 + terminal_growth) ** terminal_year)
            year_pv = year_fcff / ((1 + wacc_rate) ** year)
            fcff_terminal_pv += year_pv

        # Store terminal period data
        terminal_period = {
            'year_6_starting_fcff': year_6_starting_fcff,
            'terminal_growth_rate': terminal_growth,
            'total_pv': fcff_terminal_pv
        }

        fcff_growth_total_value = explicit_fcff_pv + fcff_terminal_pv
        fcff_growth_total_intrinsic_value = fcff_growth_total_value + book_value

        return {
            'fcff_growth_total_value': fcff_growth_total_value,
            'fcff_growth_total_intrinsic_value': fcff_growth_total_intrinsic_value,
            'explicit_fcff_pv': explicit_fcff_pv,
            'fcff_terminal_value_pv': fcff_terminal_pv,
            'base_fcff': base_fcff,
            'adjusted_growth_rate': adjusted_growth,
            'projections': {
                'explicit_period': explicit_period,
                'terminal_period': terminal_period
            }
        }

    except Exception as e:
        print(f"Error calculating FCFF projections: {e}")
        return _failed_result()


# ================================================================================
# ================================================================================
#
#                    QUALITY FACTORS & SCREENING RATIOS
#
# ================================================================================
# ================================================================================
#
# Separate from main valuation (Greenwald/Profit/FCFF remain UNTOUCHED).
# Each function returns dict with 'passes' boolean for filtering.
#
# BACKTEST RESULTS (1-year historical):
#   NO FILTERS:              6.88% return, 56.7% win rate (top 30)
#   Quality Filters:         5.89% return, 53.3% win rate (worse than baseline)
#   Leverage Filters:       -5.13% return, 39.1% win rate (terrible)
#   Price-to-Book Filter:   -6.50% return, 43.3% win rate (terrible)
#
# OPTIMAL CONFIGURATION (5 sectors):
#   Top 10:                 12.67% return,  90% win rate (9/1)
#   Top 15:                 21.38% return,  86.7% win rate (13/2) ✓✓✓ BEST RETURNS
#   Top 20:                 19.41% return,  85% win rate (17/3) ✓✓✓ EXCELLENT
#   Top 25:                 16.75% return,  84% win rate (21/4) ✓✓ STRONG
#   Top 30:                 13.92% return,  80% win rate (24/6)
#   Top 50:                 14.22% return,  84% win rate (42/8) ✓
#   Top 75:                 13.52% return,  84% win rate (63/12)
#   Top 100:                14.79% return,  85% win rate (85/15) ✓✓ BEST DIVERSIFICATION
#
# KEY INSIGHT: Top 15-20 stocks deliver exceptional returns (19-21% annualized),
# significantly outperforming larger portfolios. Top 25 still strong at 16.75%.
# Top 100 provides best diversification with solid returns (14.79%).
# Sweet spot depends on risk tolerance:
#   - Maximum returns: Top 15 (21.38%)
#   - Excellent balanced: Top 20 (19.41%)
#   - Good balanced: Top 25 (16.75%)
#   - Diversified: Top 100 (14.79%)
#
# FILTER IMPACT COMPARISON (Market Cap >= $5B + ROI >= 0%):
# ────────────────────────────────────────────────────────────────────────────────────────
#  Size    │ SECTOR ONLY          │ SECTOR + MCAP + ROI   │ Improvement
#          │ Return    Win%  W/L  │ Return    Win%  W/L   │ Return    Win%   Risk ↓
# ────────────────────────────────────────────────────────────────────────────────────────
#  Top 10  │  13.28%   90%   9/1  │  29.22%   90%   9/1   │ +15.94%    +0%   Same
#  Top 15  │  21.39%   87%  13/2  │  23.77%   93%  14/1   │  +2.38%   +6.3%  -50% losers
#  Top 20  │  19.51%   85%  17/3  │  21.99%   95%  19/1   │  +2.48%  +10.0%  -67% losers
#  Top 25  │  17.23%   84%  21/4  │  22.06%   96%  24/1   │  +4.83%  +12.0%  -75% losers ✓✓
#  Top 30  │  14.47%   80%  24/6  │  21.84%   97%  29/1   │  +7.37%  +16.7%  -83% losers
#  Top 50  │  14.94%   84%  42/8  │  19.23%   98%  49/1   │  +4.29%  +14.0%  -88% losers
#  Top 75  │  14.19%   84%  63/12 │  19.85%   99%  74/1   │  +5.66%  +14.7%  -92% losers
#  Top 100 │  15.66%   86%  86/14 │    N/A     N/A   N/A  │    N/A      N/A  (only 82 stocks)
# ────────────────────────────────────────────────────────────────────────────────────────
#
# FILTER VALUE SUMMARY:
#   Market Cap + ROI filters provide EXCEPTIONAL value across all portfolio sizes:
#   • Returns: +2.38% to +15.94% improvement (28% average boost at Top 25)
#   • Win Rate: +6% to +17% improvement (more consistent winners)
#   • Risk Reduction: 50-92% fewer losers (Top 25: 4 losers → 1 loser)
#   • Quality: 200 stocks → 82 stocks (quality over quantity wins)
#   • Synergy: +4.42% return beyond expected additive effect (empirically validated)
#
#   WHY IT WORKS: Market cap filters for stability/liquidity, ROI filters for capital
#                 efficiency. Together they create 98%+ win rates while boosting returns.
#                 The filters are ESPECIALLY powerful for larger portfolios (Top 30-75).
#
# TESTED RATIOS:
#   Ratio                                Source      Correlation    Backtest Result
#   ─────────────────────────────────────────────────────────────────────────────────
#   Sector Filter (4 sectors):           Historical  N/A           +14.98% return, 73% win ✓
#     Basic Materials, Healthcare,
#     Consumer Cyclical, Energy
#   Sector Filter (5 sectors):           Historical  N/A           +14.22% return, 84% win ✓ (top 50)
#     + Financial Services added                                    +14.79% return, 85% win ✓✓ (top 100)
#                                                                    Top 100 slightly better than top 50
#   Gross Margin Slope (3-yr)            Empirical   +0.12         -5.13% return
#   Interest Coverage (EBIT/Interest)    Piotroski   N/A           -5.13% return, 39% win
#   Current Ratio (Assets/Liabilities)   Piotroski   N/A           -5.13% return, 39% win
#   Share Dilution (ΔShares %)           Piotroski   N/A           +5.89% return, 53% win
#   Accrual Quality (OCF-NI)/Assets      Piotroski   N/A           +5.89% return, 53% win
#   Price-to-Book (Market Cap / Book)    Graham      N/A           -6.50% return, 43% win
#   Debt-to-Assets                       Empirical   -0.15         Not tested
#   Debt-to-Equity                       Empirical   -0.08         Not tested
#   Net Debt-to-Equity                   Empirical   -0.03         Not tested
#
# WHY SECTOR FILTER WORKS: Historical data shows certain sectors consistently
#                          outperform (Basic Materials +26%, Healthcare +25%,
#                          Consumer Cyclical +17%, Energy +9%), while others fail
#                          (Consumer Defensive -15%, Industrials -16%, Telecom -10%).
#                          Sector performance driven by structural industry dynamics
#                          that valuation models don't capture.
#
# WHY RATIO FILTERS FAIL: Valuation models already capture business quality via ROI
#                         and growth rates. Additional ratio filters reduce portfolio
#                         size and harm returns by removing good stocks based on
#                         single metrics that don't predict performance.
#
# PIOTROSKI F-SCORE COVERAGE:
#   Already in Models: ROA>0, OCF>0, ΔROA, ΔDebt, ΔAsset Turnover (via ROI/growth)
#   Tested/Failed: ΔCurrent Ratio, ΔGross Margin, Interest Coverage
#   Tested/Worse: ΔShares, Accruals (better than leverage but worse than baseline)
#
# ================================================================================


def check_price_to_book(yfinance_data: Dict[str, Any], book_value: float) -> Dict[str, Any]:
    """
    Price-to-Book (P/B) ratio filter for entry price discipline.

    WHY: Provides downside protection - measures what you pay vs tangible assets.
    FORMULA: Market Cap / Book Value
    THRESHOLD: > 3.0 (reject if paying >3x book value)
    """
    try:
        market_cap = yfinance_data['market_data']['market_capitalization']

        # Handle missing or invalid data
        if market_cap <= 0 or book_value <= 0:
            return {
                'passes': False,
                'price_to_book': 0.0,
                'market_cap': market_cap,
                'book_value': book_value,
                'reason': 'Invalid market cap or book value'
            }

        # Calculate P/B ratio
        price_to_book = market_cap / book_value

        # Check threshold: P/B <= 3.0
        passes = price_to_book <= 3.0

        if price_to_book <= 1.0:
            reason = f'Excellent entry: P/B = {price_to_book:.2f}x (trading below book value)'
        elif price_to_book <= 2.0:
            reason = f'Good entry: P/B = {price_to_book:.2f}x (reasonable premium)'
        elif price_to_book <= 3.0:
            reason = f'Acceptable entry: P/B = {price_to_book:.2f}x (threshold: 3.0x)'
        else:
            reason = f'Expensive entry: P/B = {price_to_book:.2f}x (paying >{price_to_book:.1f}x book value)'

        return {
            'passes': passes,
            'price_to_book': price_to_book,
            'market_cap': market_cap,
            'book_value': book_value,
            'reason': reason
        }

    except Exception as e:
        return {
            'passes': False,
            'price_to_book': 0.0,
            'market_cap': 0,
            'book_value': 0,
            'reason': f'Error calculating P/B ratio: {str(e)}'
        }


def check_operating_margin(yfinance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Operating margin filter - STRONGEST PREDICTOR of tech stock performance.

    WHY: Measures operational efficiency before financial engineering. Separates
    operationally excellent from broken companies.

    BACKTEST (69 tech stocks, 2025-10-17):
    - Winners: 30.94% avg margin (NVDA 62%, IDCC 51%)
    - Losers: 8.64% avg margin (GLOB 10%, ENPH 7%, GTM 8%)
    - Gap: +22.3pp (strongest predictor)
    - Eliminates 4 of 5 catastrophic losers (-43% to -75% returns)

    FORMULA: OperatingIncome / TotalRevenue
    THRESHOLD: > 10% (profitable at scale, works globally)

    UPDATED 2025-10-17: Reduced from 15% → 10% for global applicability.
    15% was top-quartile (US tech optimized). 10% = "real business profitability"
    that works across US, Europe, Asia. Filters disasters without overfitting.
    """
    try:
        # Get most recent year data (year_t0 = most recent)
        income_data = yfinance_data['income_statement']['year_t0']

        operating_income = income_data.get('OperatingIncome', 0)
        total_revenue = income_data.get('TotalRevenue', 0)

        # Handle missing or invalid data
        if total_revenue <= 0:
            return {
                'passes': False,
                'operating_margin': 0.0,
                'operating_income': operating_income,
                'revenue': total_revenue,
                'reason': 'Revenue data missing or invalid'
            }

        # Calculate operating margin
        operating_margin = operating_income / total_revenue

        # Check threshold: operating margin > 10%
        passes = operating_margin > 0.10

        if operating_margin > 0.30:
            reason = f'Excellent efficiency: {operating_margin*100:.1f}% operating margin (threshold: 10%)'
        elif operating_margin > 0.10:
            reason = f'Good efficiency: {operating_margin*100:.1f}% operating margin (threshold: 10%)'
        else:
            reason = f'Poor efficiency: {operating_margin*100:.1f}% operating margin (unprofitable at scale, threshold: 10%)'

        return {
            'passes': passes,
            'operating_margin': operating_margin,
            'operating_income': operating_income,
            'revenue': total_revenue,
            'reason': reason
        }

    except Exception as e:
        return {
            'passes': False,
            'operating_margin': 0.0,
            'operating_income': 0,
            'revenue': 0,
            'reason': f'Error calculating operating margin: {str(e)}'
        }


def check_revenue_growth(yfinance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Revenue growth filter - captures market demand momentum (harder to fake than profits).

    WHY: Companies manipulate profits via cost-cutting while revenue collapses.
    Revenue growth shows genuine market acceptance.

    BACKTEST (69 tech stocks, 2025-10-17):
    - Winners: +40.25% avg growth (NVDA +114%, IDCC +58%)
    - Losers: +4.24% avg growth (ENPH -42%, GTM -2%)
    - Gap: +36pp (second strongest predictor)
    - Declining revenue = death spiral even with positive profit growth

    FORMULA: (Revenue_Y0 - Revenue_Y-1) / Revenue_Y-1
    THRESHOLD: > 10% (real growth above inflation + market, works globally)

    UPDATED 2025-10-17: Reduced from 20% → 10% for global applicability.
    20% is hypergrowth (VC-backed startups). 10% = "actually growing faster than
    inflation + GDP" (2-4%) while beating market average (5-7%). Works across markets.
    """
    try:
        # Need at least 2 years of data
        if yfinance_data.get('years_available', 0) < 2:
            return {
                'passes': False,
                'revenue_growth': 0.0,
                'revenue_current': 0,
                'revenue_previous': 0,
                'reason': 'Insufficient data (need 2 years)'
            }

        # Get current and previous year revenue (year_t0 = most recent)
        revenue_current = yfinance_data['income_statement']['year_t0'].get('TotalRevenue', 0)
        revenue_previous = yfinance_data['income_statement']['year_t_minus_1'].get('TotalRevenue', 0)

        # Handle missing or invalid data
        if revenue_previous <= 0 or revenue_current <= 0:
            return {
                'passes': False,
                'revenue_growth': 0.0,
                'revenue_current': revenue_current,
                'revenue_previous': revenue_previous,
                'reason': 'Revenue data missing or invalid'
            }

        # Calculate revenue growth
        revenue_growth = (revenue_current - revenue_previous) / revenue_previous

        # Check threshold: revenue growth > 10%
        passes = revenue_growth > 0.10

        if revenue_growth > 0.50:
            reason = f'Exceptional growth: {revenue_growth*100:.1f}% revenue growth (threshold: 10%)'
        elif revenue_growth > 0.10:
            reason = f'Strong growth: {revenue_growth*100:.1f}% revenue growth (threshold: 10%)'
        elif revenue_growth > 0:
            reason = f'Weak growth: {revenue_growth*100:.1f}% revenue growth (below 10% threshold)'
        else:
            reason = f'Declining revenue: {revenue_growth*100:.1f}% growth (death spiral, threshold: 10%)'

        return {
            'passes': passes,
            'revenue_growth': revenue_growth,
            'revenue_current': revenue_current,
            'revenue_previous': revenue_previous,
            'reason': reason
        }

    except Exception as e:
        return {
            'passes': False,
            'revenue_growth': 0.0,
            'revenue_current': 0,
            'revenue_previous': 0,
            'reason': f'Error calculating revenue growth: {str(e)}'
        }


def check_net_cash_position(yfinance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Net cash filter - detects overleveraged companies (debt amplifies revenue problems).

    WHY: High leverage kills companies when revenue stalls. Overleveraged firms
    can't invest in growth, face refinancing risk, burn runway quickly.

    BACKTEST (69 tech stocks, 2025-10-17):
    - Winners: -6.56% avg net cash (modest leverage)
    - Losers: -21.82% avg net cash (CNXC -49%, GTM -39%)
    - Gap: +15.3pp
    - Overleveraged companies spiral when operations falter

    FORMULA: (Cash - TotalDebt) / MarketCap × 100
    THRESHOLD: > -30% (reasonable leverage, bankruptcy risk at -50%+)

    UPDATED 2025-10-17: Relaxed from -15% → -30% for global applicability.
    -15% was too strict (normal debt ratios 20-40%). -30% = "reasonable leverage
    without bankruptcy risk". European companies often more levered (bank financing).
    Real danger starts at -50% to -70% debt/market cap.
    """
    try:
        # Get current quarter data (most recent)
        if 'current_quarter' in yfinance_data and yfinance_data['current_quarter']:
            cash = yfinance_data['current_quarter'].get('CashAndCashEquivalents', 0)
            debt = yfinance_data['current_quarter'].get('TotalDebt', 0)
        else:
            # Fallback to yearly data (year_t0 = most recent)
            cash = yfinance_data['balance_sheet']['year_t0'].get('CashAndCashEquivalents', 0)
            debt = yfinance_data['balance_sheet']['year_t0'].get('TotalDebt', 0)

        market_cap = yfinance_data['market_data'].get('market_capitalization', 0)

        # Handle missing or invalid data
        if market_cap <= 0:
            return {
                'passes': False,
                'net_cash_pct': 0.0,
                'cash': cash,
                'debt': debt,
                'market_cap': market_cap,
                'reason': 'Market cap data missing or invalid'
            }

        # Calculate net cash position as % of market cap
        net_cash = cash - debt
        net_cash_pct = (net_cash / market_cap) * 100

        # Check threshold: net cash > -30%
        passes = net_cash_pct > -30.0

        if net_cash_pct > 0:
            reason = f'Net cash positive: {net_cash_pct:.1f}% of market cap (strong balance sheet)'
        elif net_cash_pct > -30.0:
            reason = f'Reasonable leverage: {net_cash_pct:.1f}% net cash (acceptable, threshold: -30%)'
        else:
            reason = f'Overleveraged: {net_cash_pct:.1f}% net cash (bankruptcy risk, threshold: -30%)'

        return {
            'passes': passes,
            'net_cash_pct': net_cash_pct,
            'cash': cash,
            'debt': debt,
            'market_cap': market_cap,
            'reason': reason
        }

    except Exception as e:
        return {
            'passes': False,
            'net_cash_pct': 0.0,
            'cash': 0,
            'debt': 0,
            'market_cap': 0,
            'reason': f'Error calculating net cash position: {str(e)}'
        }


def check_operating_efficiency(yfinance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Operating efficiency filter - detects operational bloat (high gross, low operating).

    WHY: High gross margins mean nothing if operating margins are low. Indicates
    excessive SG&A spending that won't scale.

    BACKTEST (69 tech stocks, 2025-10-17):
    - COUNTER-INTUITIVE: Losers had HIGHER gross margins (57.1% vs 53.6%)
    - Losers with bloat: GTM 84% gross/8% op (9.5% eff) → -43% return
                         DV 82% gross/13% op (15% eff) → -70% return
    - Winners efficient: NVDA 75% gross/62% op (83% eff) → +196% return
                         IDCC 81% gross/51% op (63% eff) → +254% return

    FORMULA: Operating Margin / Gross Margin
    THRESHOLD: > 25% (detects excessive SG&A overhead)

    UPDATED 2025-10-17: Reduced from 30% → 25% for global applicability.
    30% was arbitrary. 25% = "not grossly inefficient" (75% of gross margin lost
    to overhead). NOTE: This filter is partially redundant with operating margin
    filter but catches high-gross/low-operating bloat scenarios.
    """
    try:
        # Get most recent year data (year_t0 = most recent)
        income_data = yfinance_data['income_statement']['year_t0']

        operating_income = income_data.get('OperatingIncome', 0)
        gross_profit = income_data.get('GrossProfit', 0)
        total_revenue = income_data.get('TotalRevenue', 0)

        # Handle missing or invalid data
        if total_revenue <= 0 or gross_profit <= 0:
            return {
                'passes': False,
                'efficiency_ratio': 0.0,
                'operating_margin': 0.0,
                'gross_margin': 0.0,
                'reason': 'Revenue or gross profit data missing'
            }

        # Calculate margins
        operating_margin = operating_income / total_revenue
        gross_margin = gross_profit / total_revenue

        # Prevent division by zero
        if gross_margin <= 0:
            return {
                'passes': False,
                'efficiency_ratio': 0.0,
                'operating_margin': operating_margin,
                'gross_margin': gross_margin,
                'reason': 'Gross margin is zero or negative'
            }

        # Calculate efficiency ratio
        efficiency_ratio = operating_margin / gross_margin

        # Check threshold: efficiency > 25%
        passes = efficiency_ratio > 0.25

        if efficiency_ratio > 0.60:
            reason = f'Exceptional efficiency: {efficiency_ratio*100:.1f}% (operating/gross, threshold: 25%)'
        elif efficiency_ratio > 0.25:
            reason = f'Good efficiency: {efficiency_ratio*100:.1f}% (operating/gross, threshold: 25%)'
        else:
            reason = f'Operational bloat: {efficiency_ratio*100:.1f}% efficiency (excessive SG&A, threshold: 25%)'

        return {
            'passes': passes,
            'efficiency_ratio': efficiency_ratio,
            'operating_margin': operating_margin,
            'gross_margin': gross_margin,
            'reason': reason
        }

    except Exception as e:
        return {
            'passes': False,
            'efficiency_ratio': 0.0,
            'operating_margin': 0.0,
            'gross_margin': 0.0,
            'reason': f'Error calculating operating efficiency: {str(e)}'
        }


# ================================================================================
# MULTI-MARKET BACKTEST VALIDATION (2025-10-17): 21 STOCKS, 4 MARKETS, 1-YEAR
# ================================================================================
# OBJECTIVE: Validate 10% institutional filter thresholds across global markets
# MARKETS: Poland (5), US (6), Germany (7), UK (3) - All tech sectors
# METHOD: 1-year holding period, equal-weighted portfolios
#
# RESULTS BY MARKET:
#   Poland:  41.52% avg return, 80% win rate (4/5 winners) ⭐ BEST
#   US:      30.49% avg return, 50% win rate (3/6 winners) - NVDA +103% carried
#   Germany: 20.46% avg return, 57% win rate (4/7 winners)
#   UK:      -6.16% avg return, 67% win rate (2/3 winners) - 1 major loser
#
# FILTER VALIDATION (Operating >10%, Revenue >10%, NetCash >-30%, Efficiency >25%):
#   ✅ Operating Margin: Winners 28% avg vs Losers 9% avg (captures profitability)
#   ✅ Revenue Growth: Winners 22-126% vs Losers 11-15% (momentum indicator)
#   ✅ Net Cash: No return correlation but detects bankruptcy risk (-49% losers)
#   ✅ Operating Efficiency: Catches high-gross/low-operating bloat scenarios
#
# KEY FINDINGS:
#   1. LOW P/E IN TECH = VALUE TRAP (market prices in problems):
#      - Losers: P/E 7.8-14.1 → TXT.WA -38%, MONY.L -29%, IFX.DE -1.5%
#      - Winners: P/E 39-157 → NVDA +103%, CBF.WA +77%, CDR.WA +74%
#      - DO NOT add P/E minimum filter (contradicts value investing principles)
#
#   2. PEG RATIO <2.0 FILTER REJECTED (would exclude 6 winners, keep 4 losers):
#      - Excluded winners: IDCC +87%, CBF +77%, G24 +38%, PCTY +38%, ABS +26%
#      - Kept losers: TXT -38%, MONY -29%, IFX -1.5%, NXT -23%
#      - Empirical test proves PEG<2.0 is counterproductive for stock selection
#
#   3. REVENUE GROWTH >15% FILTER REJECTED (overfitting risk):
#      - Would exclude: G24.DE +38.6%, G24.F +36.5%, ABS.WA +25.7% (3 winners)
#      - Sample size (21 stocks) too small to validate threshold increases
#      - 10% threshold works globally: filters disasters without overfitting
#
#   4. GLOBAL APPLICABILITY CONFIRMED:
#      - 10% thresholds work across US, Europe, Poland (not US-optimized)
#      - Filters capture "real business profitability" beyond cultural norms
#      - Accept ~30% losers as normal variance in value investing
#
# DECISION: Keep all institutional filters UNCHANGED at 10% thresholds
#   - Operating Margin: >10% (profitable at scale)
#   - Revenue Growth: >10% (real growth above inflation+GDP)
#   - Net Cash: >-30% (reasonable leverage without bankruptcy risk)
#   - Operating Efficiency: >25% (not grossly inefficient)
#   - ROI: >=0% (minimum quality gate, not performance predictor)
#
# WHY NO CHANGES: Sample size too small (21 stocks) for robust pattern detection.
# Current filters empirically derived from 69-stock US dataset, validated globally.
# Avoid overfitting to 1-year cross-market sample. Trust the data.
# ================================================================================


def run_complete_yfinance_analysis(yfinance_json_path: str, return_results: bool = False) -> Dict[str, Any]:
    """
    Run complete financial analysis using yfinance data

    Args:
        yfinance_json_path: Path to yfinance JSON file
        return_results: If True, return results dict; if False, print results only

    Returns:
        Dictionary containing all analysis results or None if return_results=False
    """
    try:
        # Load yfinance data
        with open(yfinance_json_path, 'r') as f:
            yfinance_data_raw = json.load(f)

        print("🚀 Starting complete yfinance financial analysis...")

        # Extract financial data using simple approach
        yfinance_data = extract_yfinance_financial_data(yfinance_data_raw)

        print(f"✅ Extracted {yfinance_data['years_available']} years and 4 quarters of data")
        print(f"🏢 Company: {yfinance_data['company_info']['name']} ({yfinance_data['company_info']['code']})")

        # Calculate WACC
        wacc_results = calculate_wacc_from_yfinance(yfinance_data)
        wacc_rate = wacc_results['wacc']
        cost_of_equity = wacc_results['cost_of_equity']

        print(f"💰 WACC: {wacc_rate:.2%}, Cost of Equity: {cost_of_equity:.2%}")

        # Calculate Book Value
        book_value = calculate_book_value_from_yfinance(yfinance_data)
        print(f"📚 Book Value: {book_value:,.0f} {yfinance_data['company_info']['currency']}")

        # Calculate Greenwald EPV and Growth Value
        greenwald_results = calculate_greenwald_epv_growth_from_yfinance(yfinance_data, wacc_rate, book_value)
        print(f"🎯 Greenwald Total Intrinsic Value: {greenwald_results['greenwald_total_intrinsic_value']:,.0f}")

        # Calculate Profit Projections
        profit_results = calculate_profit_projections_from_yfinance(yfinance_data, greenwald_results['roi'], cost_of_equity, book_value)
        print(f"📈 Profit Growth Total Intrinsic Value: {profit_results['profit_growth_total_intrinsic_value']:,.0f}")

        # Calculate FCFF Projections
        fcff_results = calculate_fcff_projections_from_yfinance(yfinance_data, greenwald_results['roi'], wacc_rate, book_value)
        print(f"🚀 FCFF Growth Total Intrinsic Value: {fcff_results['fcff_growth_total_intrinsic_value']:,.0f}")

        # Calculate average intrinsic value
        intrinsic_values = [
            greenwald_results['greenwald_total_intrinsic_value'],
            profit_results['profit_growth_total_intrinsic_value'],
            fcff_results['fcff_growth_total_intrinsic_value']
        ]
        average_intrinsic_value = sum(intrinsic_values) / len(intrinsic_values)

        print(f"\n🎯 SUMMARY:")
        print(f"Average Intrinsic Value: {average_intrinsic_value:,.0f} {yfinance_data['company_info']['currency']}")
        print(f"Market Cap: {yfinance_data['market_data']['market_capitalization']:,.0f}")

        # Extract financial statements date (most recent annual data - same date for balance sheet, income statement, cash flow)
        financial_statements_date = yfinance_data.get('balance_sheet', {}).get('year_t0', {}).get('date', '')

        # Compile complete results
        complete_results = {
            'company_info': yfinance_data['company_info'],
            'market_data': yfinance_data['market_data'],
            'financial_statements_date': financial_statements_date,
            'wacc_analysis': wacc_results,
            'book_value': book_value,
            'greenwald_analysis': greenwald_results,
            'profit_projections': profit_results,
            'fcff_projections': fcff_results,
            'summary': {
                'average_intrinsic_value': average_intrinsic_value,
                'intrinsic_values': intrinsic_values,
                'market_capitalization': yfinance_data['market_data']['market_capitalization'],
                'margin_of_safety': (average_intrinsic_value - yfinance_data['market_data']['market_capitalization']) / average_intrinsic_value if average_intrinsic_value > 0 else 0
            }
        }

        if return_results:
            return complete_results
        else:
            print("✅ Complete yfinance analysis finished!")
            return complete_results

    except Exception as e:
        print(f"Error in complete yfinance analysis: {e}")
        return {}


def analyze_single_stock(json_file_path: str, verbose: bool = True) -> Dict[str, Any]:
    """
    Analyze a single stock and return results for orchestrator use

    Args:
        json_file_path: Path to yfinance JSON file
        verbose: Whether to print progress information

    Returns:
        Dictionary containing analysis results
    """
    if verbose:
        print(f"📊 Analyzing: {json_file_path}")

    result = run_complete_yfinance_analysis(json_file_path, return_results=True)

    if result and 'summary' in result:
        if verbose:
            ticker = result.get('company_info', {}).get('code', 'Unknown')
            avg_value = result['summary']['average_intrinsic_value']
            market_cap = result.get('market_data', {}).get('market_capitalization', 0)
            ratio = avg_value / market_cap if market_cap > 0 else 0
            print(f"✅ {ticker}: Intrinsic Value: {avg_value:,.0f}, Ratio: {ratio:.2f}")

    return result


def run_batch_analysis(
    fundamentals_dir: str,
    output_excel: str = "yfinance_batch_analysis.xlsx",
    min_ratio: float = 1.0,
    min_market_cap: float = 5_000_000_000,
    min_roi: float = 0.0,
    apply_filters: bool = True
) -> pd.DataFrame:
    """
    Run analysis on all JSON files in a directory and export to Excel

    Parameters:
    -----------
    fundamentals_dir : str
        Directory containing JSON files (e.g., "extracted_data/ticker_market_jsons")
    output_excel : str
        Excel file path to save results
    min_ratio : float
        Minimum intrinsic/market ratio (default: 1.0)
    min_market_cap : float
        Minimum market cap filter in USD (default: $5B)
    min_roi : float
        Minimum ROI filter (default: 0.0 = 0%)
    apply_filters : bool
        Whether to apply sector/market cap/ROI filters (default: True)

    Returns:
    --------
    pd.DataFrame
        Results for all stocks
    """
    import pandas as pd
    from pathlib import Path

    fundamentals_path = Path(fundamentals_dir)
    json_files = sorted(fundamentals_path.glob("*.json"))

    print(f"🚀 Found {len(json_files)} JSON files to analyze")

    all_results = []
    successful = 0
    failed = 0

    for json_file in json_files:
        try:
            print(f"📊 Analyzing {json_file.name}...")

            # Run analysis for this stock
            result = run_complete_yfinance_analysis(str(json_file))

            if result and 'company_info' in result:
                # Flatten the results for DataFrame
                flat_result = {
                    'ticker': result['company_info']['code'],
                    'name': result['company_info']['name'],
                    'exchange': result['company_info']['exchange'],
                    'currency': result['company_info']['currency'],
                    'sector': result['company_info']['sector'],
                    'industry': result['company_info']['industry'],
                    'financial_statements_date': result.get('financial_statements_date', ''),

                    # Summary - Key Investment Metrics
                    'average_intrinsic_value': result['summary']['average_intrinsic_value'],
                    'margin_of_safety': result['summary']['margin_of_safety'],
                    'intrinsic_to_market_ratio': result['summary']['average_intrinsic_value'] / result['market_data']['market_capitalization'] if result['market_data']['market_capitalization'] > 0 else 0,

                    # Market data
                    'market_cap': result['market_data']['market_capitalization'],
                    'shares_outstanding': result['market_data']['shares_outstanding'],
                    'beta': result['market_data']['beta'],
                    'current_pe': result['market_data']['current_pe'],

                    # WACC analysis
                    'wacc': result['wacc_analysis']['wacc'],
                    'cost_of_equity': result['wacc_analysis']['cost_of_equity'],
                    'cost_of_debt': result['wacc_analysis']['cost_of_debt'],
                    'debt_weight': result['wacc_analysis']['debt_weight'],
                    'equity_weight': result['wacc_analysis']['equity_weight'],

                    # Book value
                    'book_value': result['book_value'],

                    # Greenwald analysis
                    'epv_total': result['greenwald_analysis']['epv_total'],
                    'growth_value_total': result['greenwald_analysis']['growth_value_total'],
                    'greenwald_total_intrinsic_value': result['greenwald_analysis']['greenwald_total_intrinsic_value'],
                    'roi': result['greenwald_analysis']['roi'],
                    'nopat_current': result['greenwald_analysis']['nopat_current'],

                    # Profit projections
                    'profit_growth_total_intrinsic_value': result['profit_projections']['profit_growth_total_intrinsic_value'],
                    'profit_base_net_income': result['profit_projections']['base_net_income'],
                    'profit_adjusted_growth_rate': result['profit_projections']['adjusted_growth_rate'],
                    'profit_terminal_growth_rate': result['profit_projections']['projections']['terminal_period'].get('terminal_growth_rate'),
                    'profit_projection_failed': result['profit_projections']['projections']['terminal_period'].get('terminal_growth_rate') is None,

                    # FCFF projections
                    'fcff_growth_total_intrinsic_value': result['fcff_projections']['fcff_growth_total_intrinsic_value'],
                    'fcff_base_fcff': result['fcff_projections']['base_fcff'],
                    'fcff_adjusted_growth_rate': result['fcff_projections']['adjusted_growth_rate'],
                    'fcff_terminal_growth_rate': result['fcff_projections']['projections']['terminal_period'].get('terminal_growth_rate'),
                    'fcff_projection_failed': result['fcff_projections']['projections']['terminal_period'].get('terminal_growth_rate') is None,

                    # Profit projections - Explicit Period
                    'profit_year_1': result['profit_projections']['projections']['explicit_period'].get('year_1', {}).get('profit'),
                    'profit_year_1_pv': result['profit_projections']['projections']['explicit_period'].get('year_1', {}).get('pv'),
                    'profit_year_2': result['profit_projections']['projections']['explicit_period'].get('year_2', {}).get('profit'),
                    'profit_year_2_pv': result['profit_projections']['projections']['explicit_period'].get('year_2', {}).get('pv'),
                    'profit_year_3': result['profit_projections']['projections']['explicit_period'].get('year_3', {}).get('profit'),
                    'profit_year_3_pv': result['profit_projections']['projections']['explicit_period'].get('year_3', {}).get('pv'),
                    'profit_year_4': result['profit_projections']['projections']['explicit_period'].get('year_4', {}).get('profit'),
                    'profit_year_4_pv': result['profit_projections']['projections']['explicit_period'].get('year_4', {}).get('pv'),
                    'profit_year_5': result['profit_projections']['projections']['explicit_period'].get('year_5', {}).get('profit'),
                    'profit_year_5_pv': result['profit_projections']['projections']['explicit_period'].get('year_5', {}).get('pv'),

                    # Profit projections - Terminal Period
                    'profit_year_6_starting': result['profit_projections']['projections']['terminal_period'].get('year_6_starting_profit'),
                    'profit_terminal_pv': result['profit_projections']['projections']['terminal_period'].get('total_pv'),

                    # FCFF projections - Explicit Period
                    'fcff_year_1': result['fcff_projections']['projections']['explicit_period'].get('year_1', {}).get('fcff'),
                    'fcff_year_1_pv': result['fcff_projections']['projections']['explicit_period'].get('year_1', {}).get('pv'),
                    'fcff_year_2': result['fcff_projections']['projections']['explicit_period'].get('year_2', {}).get('fcff'),
                    'fcff_year_2_pv': result['fcff_projections']['projections']['explicit_period'].get('year_2', {}).get('pv'),
                    'fcff_year_3': result['fcff_projections']['projections']['explicit_period'].get('year_3', {}).get('fcff'),
                    'fcff_year_3_pv': result['fcff_projections']['projections']['explicit_period'].get('year_3', {}).get('pv'),
                    'fcff_year_4': result['fcff_projections']['projections']['explicit_period'].get('year_4', {}).get('fcff'),
                    'fcff_year_4_pv': result['fcff_projections']['projections']['explicit_period'].get('year_4', {}).get('pv'),
                    'fcff_year_5': result['fcff_projections']['projections']['explicit_period'].get('year_5', {}).get('fcff'),
                    'fcff_year_5_pv': result['fcff_projections']['projections']['explicit_period'].get('year_5', {}).get('pv'),

                    # FCFF projections - Terminal Period
                    'fcff_year_6_starting': result['fcff_projections']['projections']['terminal_period'].get('year_6_starting_fcff'),
                    'fcff_terminal_pv': result['fcff_projections']['projections']['terminal_period'].get('total_pv')
                }

                all_results.append(flat_result)
                successful += 1

            else:
                print(f"❌ Failed to analyze {json_file.name}")
                failed += 1

        except Exception as e:
            print(f"❌ Error analyzing {json_file.name}: {e}")
            failed += 1

    print(f"\n✅ Batch analysis completed!")
    print(f"📊 Successful: {successful}, Failed: {failed}")

    if not all_results:
        print("❌ No results to export")
        return pd.DataFrame()

    # Create DataFrame
    df = pd.DataFrame(all_results)

    # Apply filters if enabled
    if apply_filters:
        print(f"\n📊 Applying filters to {len(df)} analyzed stocks...")

        # Filter by minimum ratio
        df_filtered = df[df['intrinsic_to_market_ratio'] >= min_ratio].copy()
        print(f"✅ Stocks meeting criteria (ratio >= {min_ratio}): {len(df_filtered)}")

        # ============================================================================
        # TECH MODIFICATION #2: Allow FCFF failure for tech sectors
        # ============================================================================
        # WHY: FCFF-based valuation fails for tech (R&D expensed not capitalized)
        # LOGIC: Profit projection MUST pass (tech must be profitable)
        #        FCFF can fail (expected for tech, they use Greenwald + Profit only)
        # RESULT: Tech stocks valued on Greenwald EPV + Profit (no FCFF component)
        # ============================================================================
        TECH_SECTORS = ['Technology', 'Communication Services']
        df_no_failures = df_filtered[
            (df_filtered['profit_projection_failed'] == False) &
            ((df_filtered['fcff_projection_failed'] == False) |
             (df_filtered['sector'].isin(TECH_SECTORS)))  # ← Allow FCFF fail for tech
        ].copy()
        print(f"✅ Stocks with profit projection successful (FCFF can fail for tech): {len(df_no_failures)}")

        # ============================================================================
        # TECH MODIFICATION #1: ONLY Technology & Communication Services sectors
        # ============================================================================
        # Original value_analysis.py analyzes 5 traditional sectors
        # This file analyzes ONLY tech sectors (2 sectors)
        # Use value_analysis.py for traditional value stocks
        # ============================================================================
        TECH_SECTORS = ['Technology', 'Communication Services']
        df_quality = df_no_failures[df_no_failures['sector'].isin(TECH_SECTORS)].copy()
        print(f"✅ Stocks passing Tech Sector filter: {len(df_quality)}")
        print(f"   - Tech sectors only: {', '.join(TECH_SECTORS)}")
        print(f"   (Rejected {len(df_no_failures) - len(df_quality)} non-tech stocks)")

        # Market cap filter
        if min_market_cap > 0:
            df_market_cap = df_quality[df_quality['market_cap'] >= min_market_cap].copy()
            print(f"✅ Stocks passing Market Cap filter (>= ${min_market_cap:,.0f}): {len(df_market_cap)}")
            print(f"   (Rejected {len(df_quality) - len(df_market_cap)} stocks below threshold)")
        else:
            df_market_cap = df_quality.copy()

        # ============================================================================
        # ROI FILTER: MINIMUM QUALITY GATE (NOT A PERFORMANCE PREDICTOR)
        # ============================================================================
        # BACKTEST FINDING (69 tech stocks, 2025-10-17):
        # - ROI correlation with returns: 0.0105 (near zero - NOT predictive)
        # - Losers median ROI: 0.1539 vs Winners median ROI: 0.1341 (losers HIGHER!)
        # - ROI >= 20%: 8.74% return but 44.4% win rate (WORSE than 0% threshold)
        #
        # WHY KEEP >= 0%? Filters negative ROI (destroying capital) but high ROI
        # doesn't guarantee success. Operational filters (margin, growth, leverage)
        # are FAR stronger predictors. ROI is minimum floor, not selection tool.
        # ============================================================================
        # ROI filter
        if min_roi is not None:
            df_roi = df_market_cap[df_market_cap['roi'] >= min_roi].copy()
            print(f"✅ Stocks passing ROI filter (>= {min_roi:.1%}): {len(df_roi)}")
            print(f"   (Rejected {len(df_market_cap) - len(df_roi)} stocks below threshold)")
            print(f"   NOTE: ROI is minimum quality gate (0.0105 correlation with returns)")
        else:
            df_roi = df_market_cap.copy()

        # ============================================================================
        # INSTITUTIONAL-GRADE QUALITY FILTERS (BACKTEST-VALIDATED 2025-10-17)
        # ============================================================================
        # SOURCE: Deep-dive analysis of 69 tech stocks, 1-year historical returns
        # FINDING: Current model selects cheap valuations but misses operational health
        # PROBLEM: 49.3% win rate, median return -0.81% (negative!), extreme dispersion
        # SOLUTION: Add 4 operational health filters to complement valuation filters
        #
        # BACKTEST EVIDENCE: Top 5 winners vs top 5 losers
        # - Operating Margin: Winners 30.94% vs Losers 8.64% (+22.3pp - STRONGEST)
        # - Revenue Growth: Winners +40.25% vs Losers +4.24% (+36pp - MOMENTUM)
        # - Net Cash: Winners -6.56% vs Losers -21.82% (+15.3pp - LEVERAGE RISK)
        # - Efficiency: High gross + Low operating = Operational bloat (DV, GTM failed)
        #
        # WHY IT WORKS:
        # Current model: Finds undervalued assets (valuation-driven)
        # Missing: Operational excellence (quality-driven)
        # Pattern: Winners = High operating margin + Revenue growth + Reasonable leverage
        #          Losers = Low operating margin + Weak/negative revenue + High debt
        # ============================================================================

        print(f"\n📊 Applying institutional-grade operational health filters...")
        print(f"   Starting with {len(df_roi)} stocks after ROI filter\n")

        # Calculate institutional metrics for all remaining stocks
        institutional_results = []

        for _, row in df_roi.iterrows():
            ticker = row['ticker']

            # Load yfinance data for this stock
            json_file_path = fundamentals_path / f"{ticker}.json"
            if not json_file_path.exists():
                continue

            try:
                with open(json_file_path, 'r') as f:
                    yfinance_data_raw = json.load(f)

                yfinance_data = extract_yfinance_financial_data(yfinance_data_raw)

                if not yfinance_data:
                    continue

                # Apply 4 institutional filters
                op_margin = check_operating_margin(yfinance_data)
                rev_growth = check_revenue_growth(yfinance_data)
                net_cash = check_net_cash_position(yfinance_data)
                op_efficiency = check_operating_efficiency(yfinance_data)

                # Stock passes if ALL 4 filters pass
                passes_all = (
                    op_margin['passes'] and
                    rev_growth['passes'] and
                    net_cash['passes'] and
                    op_efficiency['passes']
                )

                institutional_results.append({
                    'ticker': ticker,
                    'passes_institutional': passes_all,
                    'operating_margin': op_margin['operating_margin'],
                    'operating_margin_passes': op_margin['passes'],
                    'operating_margin_reason': op_margin['reason'],
                    'revenue_growth': rev_growth['revenue_growth'],
                    'revenue_growth_passes': rev_growth['passes'],
                    'revenue_growth_reason': rev_growth['reason'],
                    'net_cash_pct': net_cash['net_cash_pct'],
                    'net_cash_passes': net_cash['passes'],
                    'net_cash_reason': net_cash['reason'],
                    'efficiency_ratio': op_efficiency['efficiency_ratio'],
                    'efficiency_passes': op_efficiency['passes'],
                    'efficiency_reason': op_efficiency['reason']
                })

            except Exception as e:
                print(f"   ⚠️  Error processing {ticker}: {e}")
                continue

        # Create DataFrame from institutional results
        df_institutional_metrics = pd.DataFrame(institutional_results)

        # Merge with existing data
        df_with_institutional = df_roi.merge(df_institutional_metrics, on='ticker', how='left')

        # Filter to stocks that pass ALL institutional filters
        df_institutional = df_with_institutional[df_with_institutional['passes_institutional'] == True].copy()

        print(f"\n📊 INSTITUTIONAL FILTER RESULTS:")
        print(f"   ✅ Stocks passing ALL 4 institutional filters: {len(df_institutional)}")
        print(f"   ❌ Rejected: {len(df_roi) - len(df_institutional)} stocks")
        print(f"\n   Filter Breakdown (stocks that failed):")

        # Show breakdown by filter
        failed_stocks = df_with_institutional[df_with_institutional['passes_institutional'] != True]
        if len(failed_stocks) > 0:
            op_margin_fails = len(failed_stocks[failed_stocks['operating_margin_passes'] == False])
            rev_growth_fails = len(failed_stocks[failed_stocks['revenue_growth_passes'] == False])
            net_cash_fails = len(failed_stocks[failed_stocks['net_cash_passes'] == False])
            efficiency_fails = len(failed_stocks[failed_stocks['efficiency_passes'] == False])

            print(f"   - Operating Margin (<10%): {op_margin_fails} stocks")
            print(f"   - Revenue Growth (<10%): {rev_growth_fails} stocks")
            print(f"   - Net Cash (<-30%): {net_cash_fails} stocks")
            print(f"   - Operating Efficiency (<25%): {efficiency_fails} stocks")

        print(f"\n🎯 Final Result: {len(df_institutional)} tech stocks qualified")
        print(f"   (Institutional filters: Operating margin, Revenue growth, Net cash, Efficiency)")

        df = df_institutional
    else:
        print(f"\n📊 Filters disabled - using all {len(df)} analyzed stocks")

    # Sort by intrinsic to market ratio (best values first)
    df = df.sort_values('intrinsic_to_market_ratio', ascending=False)

    # Export to Excel and CSV
    df.to_excel(output_excel, index=False)
    output_csv = output_excel.replace('.xlsx', '.csv')
    df.to_csv(output_csv, index=False)
    print(f"💾 Results exported to: {output_excel}")
    print(f"💾 CSV exported to: {output_csv}")

    # Show top 10 results
    print(f"\n🏆 TOP 10 UNDERVALUED STOCKS:")
    print(df[['ticker', 'name', 'market_cap', 'average_intrinsic_value', 'intrinsic_to_market_ratio']].head(10))

    return df


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Yahoo Finance Value Analysis")
    parser.add_argument("--fundamentals-dir", dest="fundamentals_dir",
                       default="extracted_data/ticker_market_jsons",
                       help="Directory containing yfinance JSON files")
    parser.add_argument("--output-excel", dest="output_excel",
                       default="batch_analysis_results.xlsx",
                       help="Output Excel file path")

    args = parser.parse_args()

    run_batch_analysis(args.fundamentals_dir, args.output_excel)