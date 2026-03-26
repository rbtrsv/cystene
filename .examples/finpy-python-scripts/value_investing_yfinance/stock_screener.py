#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Stock Screener Module using Yahoo Finance (yfscreen)

This module provides functionality to screen stocks using Yahoo Finance's
screener API through the yfscreen package. No API key required.
"""

import time
import pandas as pd
from tqdm import tqdm
from pathlib import Path
import yfscreen as yfs

def fetch_stocks(sectors, exchanges, min_market_cap=1000000000, limit=100, delay=0.1,
                 specific_exchanges=None):
    """
    Fetch stocks based on sectors and exchanges with a given market capitalization threshold.

    Parameters:
    -----------
    sectors : list
        List of sectors to include
    exchanges : list
        List of exchanges to include (for yfscreen, this is regions: us, gb, de, etc.)
    min_market_cap : int, optional
        Minimum market capitalization in USD (default: 1,000,000,000)
    limit : int, optional
        Number of results per API request (default: 100)
    delay : float, optional
        Delay between API requests in seconds to avoid rate limiting (default: 0.1)
    specific_exchanges : list, optional
        List of specific exchange names to filter (e.g., ['NASDAQ', 'NYSE', 'NasdaqGS'])
        If provided, only stocks from these exchanges will be included

    Returns:
    --------
    pandas.DataFrame
        DataFrame containing all fetched stocks
    """
    all_stocks = []

    # Loop over each exchange (region in Yahoo Finance terms)
    for exchange in tqdm(exchanges, desc="Processing exchanges"):
        # Loop over each sector within the current exchange
        for sector in tqdm(sectors, desc=f"Processing sectors in {exchange}", leave=False):
            try:
                # Create filters for Yahoo Finance screener
                filters = [
                    ["eq", ["region", exchange]],
                    ["eq", ["sector", sector]],
                    ["gt", ["intradaymarketcap", min_market_cap]]
                ]

                # Create query and payload
                query = yfs.create_query(filters)
                payload = yfs.create_payload("equity", query, size=250)

                # Get data from Yahoo Finance
                data = yfs.get_data(payload)

                if data is None or data.empty:
                    print(f"No data for {sector} in {exchange}")
                    continue

                # Standardize column names to match EODHD format
                data['code'] = data['symbol'] if 'symbol' in data.columns else ''
                data['exchange'] = exchange.upper()

                # Get market cap
                if 'marketCap.raw' in data.columns:
                    data['market_capitalization'] = data['marketCap.raw']
                elif 'intradaymarketcap.raw' in data.columns:
                    data['market_capitalization'] = data['intradaymarketcap.raw']
                else:
                    data['market_capitalization'] = 0

                # Get name
                if 'longName' in data.columns:
                    data['name'] = data['longName']
                elif 'shortName' in data.columns:
                    data['name'] = data['shortName']
                else:
                    data['name'] = data['symbol'] if 'symbol' in data.columns else ''

                # Add sector
                data['sector'] = sector

                # Filter by specific exchanges if provided
                if specific_exchanges:
                    if 'fullExchangeName' in data.columns:
                        # Filter to only include stocks from specified exchanges
                        # Check if any of the specific_exchanges match (case-insensitive, partial match)
                        mask = data['fullExchangeName'].apply(
                            lambda x: any(exch.lower() in str(x).lower() for exch in specific_exchanges)
                        )
                        data = data[mask]

                        if data.empty:
                            print(f"No stocks found for {sector} in {exchange} matching exchanges: {specific_exchanges}")
                            continue

                # Limit results if needed
                if len(data) > limit:
                    data = data.head(limit)

                batch = data
                all_stocks.extend(batch.to_dict('records'))

                # Log the progress
                print(f"Fetched {len(batch)} stocks for {sector} in {exchange}. Total: {len(all_stocks)}")

                time.sleep(delay)  # Delay to avoid hitting rate limits

            except Exception as e:
                # Print any errors that occur and continue
                print(f"Error occurred while fetching {sector} in {exchange}: {e}")
                continue

    # Convert the list of all stocks to a pandas DataFrame
    return pd.DataFrame(all_stocks)

def run_screener(api_key=None, sectors=None, exchanges=None, min_market_cap=1000000000,
                 limit=100, delay=0.1, output_file=None, specific_exchanges=None):
    """
    Run the stock screener and save results to a CSV file.

    Parameters:
    -----------
    api_key : str, optional
        Not needed for Yahoo Finance, kept for compatibility
    sectors : list, optional
        List of sectors to include. If None, default sectors will be used.
    exchanges : list, optional
        List of exchanges (regions) to include. If None, defaults to 'us'.
    min_market_cap : int, optional
        Minimum market capitalization in USD (default: 1,000,000,000)
    limit : int, optional
        Number of results per API request (default: 100)
    delay : float, optional
        Delay between API requests in seconds (default: 0.1)
    output_file : str, optional
        Path to save the output CSV file. If None, uses "all_stocks_by_sector_and_exchange.csv"
    specific_exchanges : list, optional
        List of specific exchange names to filter (e.g., ['NASDAQ', 'NYSE'])

    Returns:
    --------
    pandas.DataFrame
        DataFrame containing all fetched stocks
    """
    # Set default output file if not provided
    if output_file is None:
        output_file = "all_stocks_by_sector_and_exchange.csv"

    # Use default sectors if none are provided
    if sectors is None:
        sectors = [
            'Technology', 'Healthcare', 'Financial Services',
            'Consumer Cyclical', 'Industrials', 'Consumer Defensive',
            'Energy', 'Communication Services', 'Basic Materials',
            'Real Estate', 'Utilities'
        ]

    # Use default exchanges if none are provided (Yahoo Finance regions)
    if exchanges is None:
        exchanges = ['us']  # Default to US market

    # Fetch stocks based on the specified sectors and exchanges
    stocks_df = fetch_stocks(sectors, exchanges, min_market_cap, limit, delay, specific_exchanges)

    # Sort by market capitalization in descending order (only if data exists)
    if not stocks_df.empty and 'market_capitalization' in stocks_df.columns:
        stocks_df = stocks_df.sort_values('market_capitalization', ascending=False).reset_index(drop=True)
    else:
        print("⚠️ No stocks found or missing market capitalization data")

    # Print the total number of stocks fetched and display the first few rows
    print(f"Total stocks fetched: {len(stocks_df)}")
    if not stocks_df.empty:
        print(stocks_df.head())
    else:
        print("No data to display")

    # Convert output_file to Path object
    output_file = Path(output_file)

    # Create parent directories if they don't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Save to CSV
    if not stocks_df.empty:
        stocks_df.to_csv(output_file, index=False)
        print(f"Data saved to '{output_file}'")
    else:
        print(f"No data to save")

    return stocks_df

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Stock Screener - Screen stocks using Yahoo Finance")
    parser.add_argument("--min-cap", dest="min_market_cap", type=int, default=1000000000,
                      help="Minimum market capitalization in USD (default: 1,000,000,000)")
    parser.add_argument("--limit", type=int, default=100,
                      help="Number of results per API request (default: 100)")
    parser.add_argument("--delay", type=float, default=0.1,
                      help="Delay between API requests in seconds (default: 0.1)")
    parser.add_argument("--output", dest="output_file", default="all_stocks_by_sector_and_exchange.csv",
                      help="Output CSV file path (default: all_stocks_by_sector_and_exchange.csv)")
    parser.add_argument("--sectors", nargs="+", help="List of sectors to include (space-separated)")
    parser.add_argument("--exchanges", nargs="+", help="List of exchanges/regions to include (space-separated)")
    parser.add_argument("--specific-exchanges", dest="specific_exchanges", nargs="+",
                      help="Filter by specific exchange names (e.g., NASDAQ NYSE NasdaqGS)")

    args = parser.parse_args()

    # Run the screener with provided arguments
    run_screener(
        sectors=args.sectors,
        exchanges=args.exchanges,
        min_market_cap=args.min_market_cap,
        limit=args.limit,
        delay=args.delay,
        output_file=args.output_file,
        specific_exchanges=args.specific_exchanges
    )