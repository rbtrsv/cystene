#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Fundamentals Downloader using Yahoo Finance

This module downloads fundamental data using yfinance and saves it as raw JSON files.
"""

import json
import time
import pandas as pd
import yfinance as yf
from tqdm import tqdm
from pathlib import Path

def create_fundamentals_json(ticker_obj, symbol):
    """
    Create a JSON structure with raw yfinance data.

    Parameters:
    -----------
    ticker_obj : yfinance.Ticker
        The yfinance ticker object
    symbol : str
        The stock symbol

    Returns:
    --------
    dict
        Dictionary containing raw yfinance data as JSON
    """
    try:
        # Get all data from yfinance - both yearly and quarterly
        info = ticker_obj.info
        income_stmt_yearly = ticker_obj.get_income_stmt(freq='yearly')
        balance_sheet_yearly = ticker_obj.get_balance_sheet(freq='yearly')
        cash_flow_yearly = ticker_obj.get_cashflow(freq='yearly')

        income_stmt_quarterly = ticker_obj.get_income_stmt(freq='quarterly')
        balance_sheet_quarterly = ticker_obj.get_balance_sheet(freq='quarterly')
        cash_flow_quarterly = ticker_obj.get_cashflow(freq='quarterly')

        # Convert DataFrames to JSON-serializable format
        def df_to_dict(df):
            """Convert DataFrame to dictionary with string keys"""
            if df.empty:
                return {}
            result = {}
            for col in df.columns:
                col_key = col.strftime('%Y-%m-%d') if hasattr(col, 'strftime') else str(col)
                result[col_key] = {}
                for idx in df.index:
                    value = df.loc[idx, col]
                    # Convert numpy/pandas types to native Python types
                    if pd.isna(value):
                        result[col_key][str(idx)] = None
                    elif isinstance(value, (int, float)):
                        result[col_key][str(idx)] = float(value) if not value == int(value) else int(value)
                    else:
                        result[col_key][str(idx)] = str(value)
            return result

        # Create raw data structure
        raw_data = {
            'symbol': symbol,
            'info': info,
            'income_statement_yearly': df_to_dict(income_stmt_yearly),
            'balance_sheet_yearly': df_to_dict(balance_sheet_yearly),
            'cash_flow_yearly': df_to_dict(cash_flow_yearly),
            'income_statement_quarterly': df_to_dict(income_stmt_quarterly),
            'balance_sheet_quarterly': df_to_dict(balance_sheet_quarterly),
            'cash_flow_quarterly': df_to_dict(cash_flow_quarterly)
        }

        return raw_data

    except Exception as e:
        print(f"Error creating JSON for {symbol}: {e}")
        return None

def fetch_and_save_fundamentals(stocks_df, output_dir, delay=0.1, overwrite=False):
    """
    Fetch fundamental data for stocks and save as JSON files.

    Parameters:
    -----------
    stocks_df : pandas.DataFrame
        DataFrame containing stock information with 'code' column
    output_dir : str
        Directory to save JSON files
    delay : float, optional
        Delay between API requests in seconds (default: 0.1)
    overwrite : bool, optional
        Whether to overwrite existing files (default: False)

    Returns:
    --------
    list
        List of successfully downloaded ticker symbols
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    successful_downloads = []

    for _, row in tqdm(stocks_df.iterrows(), total=len(stocks_df), desc="Downloading fundamentals"):
        symbol = row['code']

        # Define the output file path
        json_filename = f"{symbol}.json"
        json_filepath = output_dir / json_filename

        # Skip if file already exists and overwrite is False
        if not overwrite and json_filepath.exists():
            print(f"⏭️ Skipping {symbol} - file already exists")
            successful_downloads.append(symbol)
            continue

        try:
            # Create yfinance ticker object
            ticker = yf.Ticker(symbol)

            # Get fundamental data
            fundamentals_data = create_fundamentals_json(ticker, symbol)

            if fundamentals_data:
                # Save to JSON file
                with open(json_filepath, 'w') as f:
                    json.dump(fundamentals_data, f, indent=2, default=str)

                print(f"✅ Downloaded {symbol}")
                successful_downloads.append(symbol)
            else:
                print(f"❌ Failed to get data for {symbol}")

        except Exception as e:
            print(f"❌ Error downloading {symbol}: {e}")
            continue

        # Delay to avoid hitting rate limits
        time.sleep(delay)

    return successful_downloads

def download_fundamentals(csv_file=None, output_dir="fundamentals_data_json",
                         limit=None, start_from=0, delay=0.1, overwrite=False,
                         tickers=None):
    """
    Download fundamental data for stocks from a CSV file or ticker list.

    Parameters:
    -----------
    csv_file : str, optional
        Path to CSV file containing stock data
    output_dir : str, optional
        Directory to save JSON files (default: "fundamentals_data_json")
    limit : int, optional
        Number of stocks to process
    start_from : int, optional
        Index to start processing from (default: 0)
    delay : float, optional
        Delay between API requests in seconds (default: 0.1)
    overwrite : bool, optional
        Whether to overwrite existing files (default: False)
    tickers : list, optional
        List of ticker symbols to process

    Returns:
    --------
    list
        List of successfully downloaded ticker symbols
    """
    # Handle ticker list input
    if tickers:
        stocks_df = pd.DataFrame({'code': tickers})
    else:
        if not csv_file:
            raise ValueError("Must provide either csv_file or tickers list")

        # Read the CSV file
        stocks_df = pd.read_csv(csv_file)

        if 'code' not in stocks_df.columns:
            raise ValueError("CSV file must contain 'code' column with ticker symbols")

    # Apply start_from and limit filtering
    if limit is not None or start_from > 0:
        if limit is not None:
            if start_from > 0:
                stocks_df_subset = stocks_df.iloc[start_from:start_from + limit]
            else:
                stocks_df_subset = stocks_df.iloc[:limit]
        else:
            if start_from > 0:
                stocks_df_subset = stocks_df.iloc[start_from:]
            else:
                stocks_df_subset = stocks_df

        # Use subset for processing
        stocks_df = stocks_df_subset

    # Display the first few rows and processing information
    print(f"Processing {len(stocks_df)} stocks starting from index {start_from}")
    print(stocks_df.head())

    # Fetch and save fundamental data
    successful_downloads = fetch_and_save_fundamentals(stocks_df, output_dir, delay, overwrite)

    print(f"Process completed. Downloaded {len(successful_downloads)} out of {len(stocks_df)} files.")

    return successful_downloads

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fundamentals Downloader - Download fundamental data using Yahoo Finance")
    parser.add_argument("--csv-file", dest="csv_file", help="CSV file containing stock data")
    parser.add_argument("--output-dir", dest="output_dir", default="fundamentals_data_json",
                      help="Output directory for JSON files (default: fundamentals_data_json)")
    parser.add_argument("--limit", type=int, help="Number of stocks to process")
    parser.add_argument("--start-from", dest="start_from", type=int, default=0,
                      help="Index to start processing from (default: 0)")
    parser.add_argument("--delay", type=float, default=0.1,
                      help="Delay between API requests in seconds (default: 0.1)")
    parser.add_argument("--no-overwrite", dest="overwrite", action="store_false",
                      help="Do not overwrite existing JSON files")
    parser.add_argument("--tickers", nargs="+", help="List of ticker symbols")

    args = parser.parse_args()

    # Run the downloader with provided arguments
    download_fundamentals(
        csv_file=args.csv_file,
        output_dir=args.output_dir,
        limit=args.limit,
        start_from=args.start_from,
        delay=args.delay,
        overwrite=args.overwrite,
        tickers=args.tickers
    )
