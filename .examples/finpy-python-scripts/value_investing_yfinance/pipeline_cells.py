#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Pipeline Cells - One cell per pipeline step
"""

# %% Stock Screener - Market cap range screener to get ALL stocks
import yfscreen as yfs
import pandas as pd
from tqdm import tqdm
import time

sectors = ['Basic Materials', 'Consumer Cyclical', 'Financial Services', 'Real Estate',
           'Consumer Defensive', 'Healthcare', 'Utilities', 'Communication Services',
           'Energy', 'Industrials', 'Technology']

# Valid region values:
#   ar, at, au, be, br, ca, ch, cl, cn, co, cz,
#   de, dk, ee, eg, es, fi, fr, gb, gr, hk, hu,
#   id, ie, il, in, is, it, jp, kr, kw, lk, lt,
#   lv, mx, my, nl, no, nz, pe, ph, pk, pl, pt,
#   qa, ro, ru, sa, se, sg, sr, sw, th, tr, tw,
#   us, ve, vn, za

# US: specific_exchanges = ['NASDAQ', 'NYSE', 'NasdaqGS', 'NasdaqGM', 'NasdaqCM', 'NYSEAmerican']
# UK: specific_exchanges = ['LSE', 'London', 'FTSE']
# Japan: specific_exchanges = ['Tokyo', 'JPX', 'TSE']
# Germany: specific_exchanges = ['Frankfurt', 'XETRA', 'FRA']
# Poland: specific_exchanges = ['Warsaw', 'WSE']
# Romania: specific_exchanges = ['Bucharest', 'BVB']
# France: specific_exchanges = ['Paris', 'Euronext Paris', 'PAR']
# South Korea: specific_exchanges = ['Korea Stock Exchange', 'KRX', 'Seoul', 'KSE']
# Australia: specific_exchanges = ['ASX', 'Sydney', 'Australian Securities Exchange']
specific_exchanges = ['ASX', 'Sydney', 'Australian Securities Exchange']

market_cap_ranges = [
    # (500000000, 1000000000),         # $500M - $1B (used for smaller markets such as Romania)
    # (1000000000, 5000000000),        # $1B - $5B (used for smaller markets such as Romania)
    (5000000000, 20000000000),       # $5B - $20B
    (20000000000, 100000000000),     # $20B - $100B
    (100000000000, 10000000000000)   # $100B - $10T
]

all_stocks = []

for sector in tqdm(sectors, desc="Processing sectors"):
    for min_cap, max_cap in tqdm(market_cap_ranges, desc=f"{sector}", leave=False):
        try:
            filters = [
                ["eq", ["region", "au"]],  # US: "us" | UK: "gb" | Japan: "jp" | Germany: "de" | Poland: "pl" | Romania: "ro" | France: "fr" | South Korea: "kr" | Australia: "au"
                ["eq", ["sector", sector]],
                ["btwn", ["intradaymarketcap", min_cap, max_cap]]
            ]

            query = yfs.create_query(filters)
            payload = yfs.create_payload("equity", query, size=250)
            data = yfs.get_data(payload)

            if data is None or data.empty:
                continue

            data['code'] = data['symbol'] if 'symbol' in data.columns else ''
            data['sector'] = sector

            if 'marketCap.raw' in data.columns:
                data['market_capitalization'] = data['marketCap.raw']
            elif 'intradaymarketcap.raw' in data.columns:
                data['market_capitalization'] = data['intradaymarketcap.raw']
            else:
                data['market_capitalization'] = 0

            if 'longName' in data.columns:
                data['name'] = data['longName']
            elif 'shortName' in data.columns:
                data['name'] = data['shortName']

            if 'fullExchangeName' in data.columns:
                mask = data['fullExchangeName'].apply(
                    lambda x: any(exch.lower() in str(x).lower() for exch in specific_exchanges)
                )
                data = data[mask]

            if not data.empty:
                all_stocks.extend(data.to_dict('records'))
                print(f"{sector} [{min_cap/1e9:.1f}B-{max_cap/1e9:.1f}B]: {len(data)} stocks. Total: {len(all_stocks)}")

            time.sleep(0.1)

        except Exception as e:
            print(f"Error {sector} [{min_cap/1e9:.1f}B-{max_cap/1e9:.1f}B]: {e}")

all_stocks_df = pd.DataFrame(all_stocks)
all_stocks_df = all_stocks_df.drop_duplicates(subset=['code'])
all_stocks_df = all_stocks_df.sort_values('market_capitalization', ascending=False).reset_index(drop=True)

# Reorder columns to put important ones first
important_cols = ['code', 'name', 'sector', 'market_capitalization']
other_cols = [col for col in all_stocks_df.columns if col not in important_cols]
all_stocks_df = all_stocks_df[important_cols + other_cols]

all_stocks_df.to_csv("extracted_data/screener_output_au_all.csv", index=False)  # US: screener_output_us_all.csv | Japan: screener_output_jp_all.csv | UK: screener_output_uk_all.csv | Poland: screener_output_pl_all.csv | Romania: screener_output_ro_all.csv | France: screener_output_fr_all.csv | South Korea: screener_output_kr_all.csv | Australia: screener_output_au_all.csv
print(f"\nTotal unique stocks: {len(all_stocks_df)}")
print(f"Saved to extracted_data/screener_output_au_all.csv")

# %% Fundamentals Downloader - Download fundamentals (batch)
from fundamentals_downloader import download_fundamentals

download_fundamentals(
    csv_file="extracted_data/screener_output_au_all.csv",  # US: screener_output_us_all.csv | Japan: screener_output_jp_all.csv | UK: screener_output_uk_all.csv | Poland: screener_output_pl_all.csv | Romania: screener_output_ro_all.csv | France: screener_output_fr_all.csv | South Korea: screener_output_kr_all.csv | Australia: screener_output_au_all.csv
    output_dir="extracted_data/ticker_market_jsons/AU",  # US: ticker_market_jsons/US | Japan: ticker_market_jsons/JP | UK: ticker_market_jsons/UK | Poland: ticker_market_jsons/PL | Romania: ticker_market_jsons/RO | France: ticker_market_jsons/FR | South Korea: ticker_market_jsons/AU | Australia: ticker_market_jsons/AU
    limit=250,
    start_from=0,
    overwrite=False
)

# %% Fundamentals Downloader - Download all missing
from fundamentals_downloader import download_fundamentals

# Download all stocks from start - will skip existing files and only download missing ones
download_fundamentals(
    csv_file="extracted_data/screener_output_au_all.csv",  # US: screener_output_us_all.csv | Japan: screener_output_jp_all.csv | UK: screener_output_uk_all.csv | Poland: screener_output_pl_all.csv | Romania: screener_output_ro_all.csv | France: screener_output_fr_all.csv | South Korea: screener_output_kr_all.csv | Australia: screener_output_au_all.csv
    output_dir="extracted_data/ticker_market_jsons/AU",  # US: ticker_market_jsons/US | Japan: ticker_market_jsons/JP | UK: ticker_market_jsons/UK | Poland: ticker_market_jsons/PL | Romania: ticker_market_jsons/RO | France: ticker_market_jsons/FR | South Korea: ticker_market_jsons/AU | Australia: ticker_market_jsons/AU
    start_from=0,
    overwrite=False
)

################################################################################
# TRADITIONAL VALUE INVESTING WORKFLOW (5 Sectors)
# Analyzes: Industrials, Basic Materials, Consumer Cyclical, Energy, Financial Services
################################################################################

# %% Value Analysis - Run batch analysis
from value_analysis import run_batch_analysis
import pandas as pd

print('🚀 Starting batch analysis...')
df_results = run_batch_analysis(
    fundamentals_dir="extracted_data/ticker_market_jsons/AU",  # US: ticker_market_jsons/US | Japan: ticker_market_jsons/JP | UK: ticker_market_jsons/UK | Poland: ticker_market_jsons/PL | Romania: ticker_market_jsons/RO | France: ticker_market_jsons/FR | South Korea: ticker_market_jsons/KR | Australia: ticker_market_jsons/AU
    output_excel="extracted_data/batch_analysis_results_au_temp.xlsx",  # US: batch_analysis_results_us_temp.xlsx | Japan: batch_analysis_results_jp_temp.xlsx | UK: batch_analysis_results_uk_temp.xlsx | Poland: batch_analysis_results_pl_temp.xlsx | Romania: batch_analysis_results_ro_temp.xlsx | France: batch_analysis_results_fr_temp.xlsx | South Korea: batch_analysis_results_kr_temp.xlsx | Australia: batch_analysis_results_au_temp.xlsx
    min_ratio=1.0,
    min_market_cap=5_000_000_000,
    min_roi=0.0,
    apply_filters=True
)

print(f'\n✅ Generated {len(df_results)} stocks')

# CRITICAL: Set analysis_date to financial_statements_date, NOT today's date
df_results['analysis_date'] = df_results['financial_statements_date']

# Save to CSV
df_results.to_csv('extracted_data/batch_analysis_results_au.csv', index=False)  # US: batch_analysis_results_us.csv | Japan: batch_analysis_results_jp.csv | UK: batch_analysis_results_uk.csv | Poland: batch_analysis_results_pl.csv | Romania: batch_analysis_results_ro.csv | France: batch_analysis_results_fr.csv | South Korea: batch_analysis_results_kr.csv | Australia: batch_analysis_results_au.csv
print(f'💾 Saved to extracted_data/batch_analysis_results_au.csv')

# %% Backtest Validation - Validate historical returns
# NOTE: Before running this cell, manually change 'analysis_date' column to equal 'financial_statements_date'
from backtesting.validate_backtest import calculate_returns_from_picks

df_backtest = calculate_returns_from_picks(
    picks_csv="extracted_data/batch_analysis_results_au.csv",  # US: batch_analysis_results_us.csv | Japan: batch_analysis_results_jp.csv | UK: batch_analysis_results_uk.csv | Poland: batch_analysis_results_pl.csv | Romania: batch_analysis_results_ro.csv | France: batch_analysis_results_fr.csv | South Korea: batch_analysis_results_au.csv
    output_csv="extracted_data/historical_backtest_results_au.csv",  # US: historical_backtest_results_us.csv | Japan: historical_backtest_results_jp.csv | UK: historical_backtest_results_uk.csv | Poland: historical_backtest_results_pl.csv | Romania: historical_backtest_results_ro.csv | France: historical_backtest_results_fr.csv | South Korea: historical_backtest_results_au.csv
    holding_period_years=None
)

# %% Portfolio Performance Analysis - Analyze different portfolio sizes
from backtesting.analyze_portfolio_performance import run_portfolio_analysis
from contextlib import redirect_stdout

with open("extracted_data/portfolio_performance_au.txt", "w") as f:  # US: portfolio_performance_us.txt | Japan: portfolio_performance_jp.txt | UK: portfolio_performance_uk.txt | Poland: portfolio_performance_pl.txt | Romania: portfolio_performance_ro.txt | France: portfolio_performance_fr.txt | South Korea: portfolio_performance_au.txt
    with redirect_stdout(f):
        run_portfolio_analysis(
            results_csv="extracted_data/historical_backtest_results_au.csv",  # US: historical_backtest_results_us.csv | Japan: historical_backtest_results_jp.csv | UK: historical_backtest_results_uk.csv | Poland: historical_backtest_results_pl.csv | Romania: historical_backtest_results_ro.csv | France: historical_backtest_results_fr.csv | South Korea: historical_backtest_results_au.csv
            portfolio_sizes=[10, 15, 20, 25, 30, 50, 75, 100]  # For large markets (US, JP, DE)
        )

# %% Portfolio Performance Analysis - SMALL MARKETS (use this for markets with few stocks)
from backtesting.analyze_portfolio_performance import run_portfolio_analysis
from contextlib import redirect_stdout

with open("extracted_data/portfolio_performance_au.txt", "w") as f:  # FR: portfolio_performance_fr_small.txt | PL: portfolio_performance_pl_small.txt | UK: portfolio_performance_uk_small.txt | KR: portfolio_performance_au_small.txt
    with redirect_stdout(f):
        run_portfolio_analysis(
            results_csv="extracted_data/historical_backtest_results_au.csv",  # FR: 4 stocks | PL: 10 stocks | UK: 7 stocks | KR: adjust based on results
            portfolio_sizes=[2, 3, 4]  # Adjust based on how many stocks passed the backtest
        )

# %% Sector/Industry Performance Analysis - Analyze sector and industry breakdown
from backtesting.analyze_sector_industry_performance import analyze_sector_industry_performance
from contextlib import redirect_stdout

with open("extracted_data/sector_industry_performance_au.txt", "w") as f:  # US: sector_industry_performance_us.txt | Japan: sector_industry_performance_jp.txt | Germany: sector_industry_performance_de.txt | France: sector_industry_performance_fr.txt | South Korea: sector_industry_performance_au.txt
    with redirect_stdout(f):
        analyze_sector_industry_performance(
            results_csv="extracted_data/historical_backtest_results_au.csv"  # US: historical_backtest_results_us.csv | Japan: historical_backtest_results_jp.csv | Germany: historical_backtest_results_de.csv | France: historical_backtest_results_fr.csv | South Korea: historical_backtest_results_au.csv
        )

################################################################################
# TECH-SPECIFIC VALUE INVESTING WORKFLOW (2 Sectors + Institutional Filters)
# Analyzes: Technology, Communication Services
# Special filters: FCFF can fail, R&D add-back, 4 institutional quality filters
################################################################################

# %% Tech Value Analysis - Run tech batch analysis (Technology & Communication Services only)
from tech_value_analysis import run_batch_analysis
import pandas as pd

print('🚀 Starting tech batch analysis...')
df_tech = run_batch_analysis(
    fundamentals_dir='extracted_data/ticker_market_jsons/AU',  # US: ticker_market_jsons/US | Japan: ticker_market_jsons/JP | UK: ticker_market_jsons/UK | Germany: ticker_market_jsons/DE | France: ticker_market_jsons/FR | South Korea: ticker_market_jsons/KR | Australia: ticker_market_jsons/AU
    output_excel='extracted_data/batch_analysis_results_au_tech_temp.xlsx',  # US: batch_analysis_results_us_tech_temp.xlsx | Japan: batch_analysis_results_jp_tech_temp.xlsx | Germany: batch_analysis_results_de_tech_temp.xlsx | France: batch_analysis_results_fr_tech_temp.xlsx | South Korea: batch_analysis_results_kr_tech_temp.xlsx | Australia: batch_analysis_results_au_tech_temp.xlsx
    min_ratio=1.0,
    min_market_cap=5_000_000_000,
    min_roi=0.0,
    apply_filters=True
)

print(f'\n✅ Generated {len(df_tech)} tech stocks')

# CRITICAL: Set analysis_date to financial_statements_date, NOT today's date
df_tech['analysis_date'] = df_tech['financial_statements_date']

# Save to CSV with _tech suffix
df_tech.to_csv('extracted_data/batch_analysis_results_au_tech.csv', index=False)  # US: batch_analysis_results_us_tech.csv | Japan: batch_analysis_results_jp_tech.csv | Germany: batch_analysis_results_de_tech.csv | France: batch_analysis_results_fr_tech.csv | South Korea: batch_analysis_results_kr_tech.csv | Australia: batch_analysis_results_au_tech.csv
print(f'💾 Saved to extracted_data/batch_analysis_results_au_tech.csv')

# %% Tech Backtest Validation - Validate historical returns for tech stocks
# NOTE: analysis_date is already set correctly in the tech batch analysis cell
from backtesting.validate_backtest import calculate_returns_from_picks

df_backtest_tech = calculate_returns_from_picks(
    picks_csv="extracted_data/batch_analysis_results_au_tech.csv",  # US: batch_analysis_results_us_tech.csv | Japan: batch_analysis_results_jp_tech.csv | Germany: batch_analysis_results_de_tech.csv | France: batch_analysis_results_fr_tech.csv | South Korea: batch_analysis_results_au_tech.csv
    output_csv="extracted_data/historical_backtest_results_au_tech.csv",  # US: historical_backtest_results_us_tech.csv | Japan: historical_backtest_results_jp_tech.csv | Germany: historical_backtest_results_de_tech.csv | France: historical_backtest_results_fr_tech.csv | South Korea: historical_backtest_results_au_tech.csv
    holding_period_years=None
)

# %% Tech Portfolio Performance Analysis - Analyze different portfolio sizes for tech stocks
from backtesting.analyze_portfolio_performance import run_portfolio_analysis
from contextlib import redirect_stdout

with open("extracted_data/portfolio_performance_au_tech.txt", "w") as f:  # US: portfolio_performance_us_tech.txt | Japan: portfolio_performance_jp_tech.txt | Germany: portfolio_performance_de_tech.txt | France: portfolio_performance_fr_tech.txt | South Korea: portfolio_performance_au_tech.txt
    with redirect_stdout(f):
        run_portfolio_analysis(
            results_csv="extracted_data/historical_backtest_results_au_tech.csv",  # US: historical_backtest_results_us_tech.csv | Japan: historical_backtest_results_jp_tech.csv | Germany: historical_backtest_results_de_tech.csv | France: historical_backtest_results_fr_tech.csv | South Korea: historical_backtest_results_au_tech.csv
            portfolio_sizes=[10, 15, 20, 25, 30, 50, 75, 100]  # For large markets (US: 14 stocks, JP: 87 stocks). Adjust for smaller markets.
        )

# %% Tech Portfolio Performance Analysis - SMALL MARKETS (use this for tech markets with few stocks)
from backtesting.analyze_portfolio_performance import run_portfolio_analysis
from contextlib import redirect_stdout

with open("extracted_data/portfolio_performance_au_tech.txt", "w") as f:  # FR: portfolio_performance_fr_tech_small.txt | DE: portfolio_performance_de_tech_small.txt | KR: portfolio_performance_au_tech_small.txt
    with redirect_stdout(f):
        run_portfolio_analysis(
            results_csv="extracted_data/historical_backtest_results_au_tech.csv",  # FR: 0-2 stocks | DE: 1 stock | KR: adjust based on results
            portfolio_sizes=[1, 2, 3]  # Adjust based on how many tech stocks passed the backtest
        )

# %% Tech Sector/Industry Performance Analysis - Analyze sector and industry breakdown for tech stocks
from backtesting.analyze_sector_industry_performance import analyze_sector_industry_performance
from contextlib import redirect_stdout

with open("extracted_data/sector_industry_performance_au_tech.txt", "w") as f:  # US: sector_industry_performance_us_tech.txt | Japan: sector_industry_performance_jp_tech.txt | Germany: sector_industry_performance_de_tech.txt | France: sector_industry_performance_fr_tech.txt | South Korea: sector_industry_performance_au_tech.txt
    with redirect_stdout(f):
        analyze_sector_industry_performance(
            results_csv="extracted_data/historical_backtest_results_au_tech.csv"  # US: historical_backtest_results_us_tech.csv | Japan: historical_backtest_results_jp_tech.csv | Germany: historical_backtest_results_de_tech.csv | France: historical_backtest_results_fr_tech.csv | South Korea: historical_backtest_results_au_tech.csv
        )

# %% Orchestrator - Run complete pipeline
from orchestrator import run_complete_value_investing_pipeline

run_complete_value_investing_pipeline()
