# Financial Analysis Project - Complete Formulas Documentation

This document contains all formulas and calculations used in the comprehensive financial analysis project.

## 1. WACC (Weighted Average Cost of Capital) Analysis

### Cost of Equity - CAPM Formula
```
Cost of Equity = Risk-free Rate + Beta × Equity Risk Premium
```

**Components:**
- **Risk-free Rate**: Government bond yield (typically 4-5%)
- **Beta**: Company's systematic risk relative to market (estimated based on business characteristics)
- **Equity Risk Premium**: Market risk premium (typically 5-7%)

### Cost of Debt
```
After-tax Cost of Debt = Pre-tax Cost of Debt × (1 - Tax Rate)
```

**Components:**
- **Pre-tax Cost of Debt**: Interest expense / Total debt
- **Tax Rate**: Provision for income taxes / Income before taxes

### WACC Formula
```
WACC = (E/V × Cost of Equity) + (D/V × Cost of Debt × (1 - Tax Rate))
```

**Where:**
- **E** = Market value of equity
- **D** = Market value of debt
- **V** = E + D (total value)
- **E/V** = Equity weight
- **D/V** = Debt weight

---

## 2. Greenwald EPV (Earnings Power Value) and Growth Value

### NOPAT Calculation
```
NOPAT = EBIT × (1 - Tax Rate)
```

**Components:**
- **EBIT**: Operating Income (from income statement)
- **Tax Rate**: Effective corporate tax rate

### Earnings Power Value (EPV)
```
EPV = NOPAT / WACC
```

This represents the value of current earnings in perpetuity with no growth.

### Growth CapEx Calculation
```
Growth CapEx = ΔPPE + ΔIntangibles + R&D Expense
```

**Components:**
- **ΔPPE**: Change in Property, Plant & Equipment (Current - Previous)
- **ΔIntangibles**: Change in intangible assets (Current - Previous)
- **R&D Expense**: Research & Development expenditure

### Return on Investment (ROI)
```
ROI = ΔNOPAT / Growth CapEx
```

**Where:**
- **ΔNOPAT**: Change in NOPAT (Current NOPAT - Previous NOPAT)

### Growth Value
```
Growth Value = [Growth CapEx × (ROI - WACC)] / WACC
```

**Note:** Only calculated if ROI > WACC (value-creating growth)

### Greenwald Total Intrinsic Value
```
Greenwald Total Intrinsic Value = EPV + Growth Value + Greenwald Asset Value
```

---

## 3. Greenwald Asset Valuation

### Net Asset Values by Method
```
Net Asset Value = Total Assets - Total Liabilities
```

**Three Methods:**
1. **Book Value**: Assets and liabilities at book value
2. **Liquidation Value**: Estimated forced sale values
3. **Reproduction Value**: Current replacement cost

### Weighted Greenwald Asset Value
```
Greenwald Asset Value = (Book Value × 30%) + (Liquidation Value × 30%) + (Reproduction Value × 40%)
```

**Weights:**
- Book Value: 30%
- Liquidation Value: 30%
- Reproduction Value: 40%

---

## 4. Profit Projection Analysis

### Multi-Year Growth Rate Calculation

**For 3 years of data:**
```
Weighted Growth Rate = (Recent Growth × 60%) + (Previous Growth × 40%)
```

**For 2 years of data:**
```
Weighted Growth Rate = Single Growth Rate (Y1/Y0 - 1)
```

### ROI-Based Growth Adjustments
```
Final Adjusted Growth Rate = Weighted Growth Rate + ROI Adjustment
```

**ROI Adjustment Rules:**
- ROI > 20%: Add +2%
- ROI > 15%: Add +1%
- ROI > 10%: No adjustment (0%)
- ROI > 7%: Subtract -1%
- ROI < 7%: Subtract -2%

### Terminal Growth Rate
```
Terminal Growth Rate = Adjusted Growth Rate × 60%
```

### Profit Projections (15 Years)

**Explicit Period (Years 1-5):**
```
Year N Profit = Base Net Income × (1 + Adjusted Growth Rate)^N
```

**Terminal Period (Years 6-15):**
```
Year N Profit = Year 6 Profit × (1 + Terminal Growth Rate)^(N-6)
```

### Present Value Calculations
```
Year N Present Value = Year N Profit / (1 + Cost of Equity)^N
```

**Total Values:**
```
Explicit Profits PV = Σ(Years 1-5 Present Values)
Profit Terminal Value PV = Σ(Years 6-15 Present Values)
Profit Growth Total Value = Explicit Profits PV + Profit Terminal Value PV
```

### Final Intrinsic Value
```
Profit Growth Total Intrinsic Value = Profit Growth Total Value + Greenwald Asset Value
```

---

## 5. FCFF (Free Cash Flow to Firm) Projection Analysis

### FCFF Calculation
```
FCFF = EBIT × (1 - Tax Rate) + Depreciation - CapEx - ΔNWC
```

**Where:**
- **EBIT**: Operating Income (Earnings Before Interest and Taxes)
- **Tax Rate**: Income Tax Expense / Income Before Tax
- **Depreciation**: Depreciation and Amortization from Cash Flow Statement
- **CapEx**: Capital Expenditures from Cash Flow Statement
```
ΔNWC = Δ(Accounts Receivable + Inventory + Prepaid) - Δ(Accounts Payable + Accrued Expenses)
```

### FCFF Growth Calculations
**Same growth methodology as Profit Projections:**
- Multi-year weighted growth rates
- ROI-based adjustments
- Terminal growth rate = 60% of adjusted growth

### FCFF Projections (15 Years)

**Explicit Period (Years 1-5):**
```
Year N FCFF = Base FCFF × (1 + Adjusted Growth Rate)^N
```

**Terminal Period (Years 6-15):**
```
Year N FCFF = Year 6 FCFF × (1 + Terminal Growth Rate)^(N-6)
```

### Present Value Calculations
```
Year N Present Value = Year N FCFF / (1 + WACC)^N
```

**Total Values:**
```
Explicit FCFF PV = Σ(Years 1-5 Present Values)
FCFF Terminal Value PV = Σ(Years 6-15 Present Values)
FCFF Growth Total Value = Explicit FCFF PV + FCFF Terminal Value PV
```

### Final Intrinsic Value
```
FCFF Growth Total Intrinsic Value = FCFF Growth Total Value + Greenwald Asset Value
```

---

## 6. Summary and Averaging

### Three Total Intrinsic Values
1. **Greenwald Total Intrinsic Value** = EPV + Growth Value + Greenwald Asset Value
2. **Profit Growth Total Intrinsic Value** = Profit Projections PV + Greenwald Asset Value
3. **FCFF Growth Total Intrinsic Value** = FCFF Projections PV + Greenwald Asset Value

### Average Calculation
```
Average Intrinsic Value = (Greenwald + Profit Growth + FCFF Growth) / 3
```

### Statistical Analysis
```
Range = Highest Value - Lowest Value
Standard Deviation = √[Σ(Xi - Average)² / N]
```

---

## Key Differences in Discount Rates

- **Profit Projections**: Discounted using **Cost of Equity** (equity flows)
- **FCFF Projections**: Discounted using **WACC** (enterprise flows)
- **EPV/Growth Value**: Uses **WACC** for enterprise valuation

---

## Input Data Sources

1. **Financial Statements**: Extracted from PDF using LLM
2. **WACC Components**: Calculated from financial data + market estimates
3. **Asset Values**: LLM analysis of balance sheet items
4. **Growth Rates**: LLM extraction + Python calculations
5. **ROI**: From Greenwald EPV analysis
6. **Projections**: Python-based 15-year modeling

---

## Implementation Notes

- All calculations use decimal format (e.g., 0.064 for 6.4%)
- 15-year projection horizon (5 explicit + 10 terminal)
- Conservative growth assumptions with ROI-based adjustments
- Integration of asset value across all methodologies
- Comprehensive error handling and validation