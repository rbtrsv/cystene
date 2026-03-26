#!/usr/bin/env python3
"""
Test script to check IBKR fundamental data for TSCO (Tesco PLC)
Tests all available report types to see what data is accessible.
"""

import asyncio
from ib_async import *
import xml.etree.ElementTree as ET
from xml.dom import minidom

class FundamentalDataTester:
    def __init__(self):
        self.ib = IB()
        self.host = '127.0.0.1'
        self.port = 7497  # Live trading port
        self.client_id = 2  # Different ID from trading bot

        # US stock contract - Apple
        self.stock_contract = Stock('AAPL', 'SMART', 'USD')

        # All available report types
        self.report_types = [
            'ReportsFinSummary',      # Financial summary
            'ReportsOwnership',       # Company's ownership
            'ReportSnapshot',         # Company's financial overview
            'ReportsFinStatements',   # Financial Statements
            'RESC',                  # Analyst Estimates
            'CalendarReport'         # Company's calendar
        ]

    async def connect(self):
        """Connect to IBKR Gateway"""
        try:
            await self.ib.connectAsync(self.host, self.port, clientId=self.client_id)
            print("✅ Connected to IBKR Gateway")

            # Qualify the contract
            qualified = await self.ib.qualifyContractsAsync(self.stock_contract)
            if qualified:
                self.stock_contract = qualified[0]
                print(f"✅ AAPL contract qualified: {self.stock_contract}")
                return True
            else:
                print("❌ Failed to qualify AAPL contract")
                return False

        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False

    def format_xml(self, xml_string):
        """Format XML for better readability"""
        try:
            root = ET.fromstring(xml_string)
            rough_string = ET.tostring(root, 'unicode')
            reparsed = minidom.parseString(rough_string)
            return reparsed.toprettyxml(indent="  ")
        except:
            return xml_string

    async def test_fundamental_data(self):
        """Test all fundamental data report types for AAPL"""
        print("\n🔍 Testing AAPL Fundamental Data Access...")
        print("=" * 60)

        for report_type in self.report_types:
            print(f"\n📊 Testing {report_type}...")
            try:
                # Request fundamental data
                xml_data = await self.ib.reqFundamentalDataAsync(
                    self.stock_contract,
                    report_type
                )

                if xml_data:
                    print(f"✅ {report_type}: Data received ({len(xml_data)} characters)")

                    # Save to file
                    filename = f"aapl_{report_type.lower()}.xml"
                    with open(filename, 'w', encoding='utf-8') as f:
                        formatted_xml = self.format_xml(xml_data)
                        f.write(formatted_xml)
                    print(f"   💾 Saved to {filename}")

                    # Show first 500 characters
                    preview = xml_data[:500].replace('\n', ' ').replace('\r', '')
                    print(f"   📄 Preview: {preview}...")

                else:
                    print(f"❌ {report_type}: No data received")

            except Exception as e:
                print(f"❌ {report_type}: Error - {e}")

            # Small delay between requests
            await asyncio.sleep(1)

    def disconnect(self):
        """Disconnect from IBKR"""
        if self.ib.isConnected():
            self.ib.disconnect()
            print("\n🔌 Disconnected from IBKR")

    async def run_test(self):
        """Run the complete fundamental data test"""
        print("🧪 IBKR Fundamental Data Test for AAPL (Apple Inc)")
        print("=" * 60)

        # Connect
        if not await self.connect():
            return

        try:
            # Test fundamental data
            await self.test_fundamental_data()

            print("\n📋 Test Summary:")
            print("- Check generated .xml files for detailed data")
            print("- If files are empty, fundamental data might require subscription")
            print("- If files contain data, fundamental data is accessible!")

        except Exception as e:
            print(f"❌ Test failed: {e}")

        finally:
            self.disconnect()

async def main():
    """Main function"""
    tester = FundamentalDataTester()
    await tester.run_test()

if __name__ == "__main__":
    asyncio.run(main())