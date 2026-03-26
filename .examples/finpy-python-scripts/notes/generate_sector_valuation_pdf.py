#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Generate Sector-Specific Valuation Methods PDF
Direct PDF creation using ReportLab
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.colors import HexColor

def create_sector_valuation_pdf():
    """Create sector-specific valuation methods PDF"""

    # Create PDF
    pdf_path = "SECTOR_SPECIFIC_VALUATION_GUIDE.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    # Container for flowables
    elements = []

    # Define styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=26,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#4a4a4a'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )

    supplement_style = ParagraphStyle(
        'Supplement',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#666666'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#2c5aa0'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c5aa0'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )

    h3_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#4a4a4a'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6,
        leftIndent=20,
        fontName='Helvetica'
    )

    # Title page
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("Sector-Specific Valuation Methods", title_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("How to Value Tech, Telecom, Utilities and REITs", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Supplement to Value Investing Strategy<br/>Generated: October 15, 2025", supplement_style))

    # Executive Summary box
    elements.append(Paragraph("EXECUTIVE SUMMARY", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("The Problem", h2_style))
    elements.append(Paragraph(
        "Your current FCFF-based valuation excludes 4 major sectors: <b>Technology</b>, <b>Communication Services</b>, <b>Utilities</b>, and <b>Real Estate</b>. "
        "These sectors fail FCFF requirements (negative cash flow, high CapEx, or extreme working capital volatility).",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("The Solution", h2_style))
    elements.append(Paragraph("Use sector-specific valuation models:", body_style))
    elements.append(Paragraph("• <b>Revenue Multiple</b> for Tech/Telecom", bullet_style))
    elements.append(Paragraph("• <b>Dividend Discount</b> for Utilities", bullet_style))
    elements.append(Paragraph("• <b>Cap Rate</b> for REITs", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("This expands your investable universe from <b>100 stocks to 200-300 stocks</b>.", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Quick Reference Table", h2_style))

    quick_ref_data = [
        ['Sector', 'Valuation Method', 'Key Metric', 'Formula'],
        ['Technology', 'Revenue Multiple', 'Revenue Growth', 'Revenue x P/S'],
        ['Communication', 'Revenue Multiple', 'Revenue Growth', 'Revenue x P/S'],
        ['Utilities', 'Dividend Discount', 'Dividend Yield', 'Div / (r - g)'],
        ['Real Estate', 'Cap Rate', 'FFO', 'FFO / Cap Rate'],
    ]

    quick_ref_table = Table(quick_ref_data, colWidths=[1.5*inch, 1.7*inch, 1.5*inch, 1.8*inch])
    quick_ref_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(quick_ref_table)

    elements.append(PageBreak())

    # SECTION 1: TECHNOLOGY AND TELECOM
    elements.append(Paragraph("SECTION 1: TECHNOLOGY AND TELECOM", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("1.1 Why FCFF Fails for Tech", h2_style))
    elements.append(Paragraph("<b>Problem: Negative or minimal FCFF</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph(
        "Tech companies reinvest all cash into R&D, infrastructure, and growth. "
        "FCFF = EBIT(1-Tax) + Depreciation - CapEx - ΔNWC is often negative despite strong revenue growth.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("1.2 Revenue Multiple Method", h2_style))
    elements.append(Paragraph("<b>Formula:</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("Intrinsic Value = Annual Revenue x P/S Multiple", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Where P/S Multiple is based on revenue growth rate:", body_style))
    elements.append(Paragraph("• 50% or more growth = 8-10x P/S", bullet_style))
    elements.append(Paragraph("• 30-50% growth = 6-8x P/S", bullet_style))
    elements.append(Paragraph("• 20-30% growth = 4-6x P/S", bullet_style))
    elements.append(Paragraph("• 10-20% growth = 3-4x P/S", bullet_style))
    elements.append(Paragraph("• 0-10% growth = 2-3x P/S", bullet_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>Quick Formula:</b>", body_style))
    elements.append(Paragraph("P/S = Growth Rate x 20 (capped at 10x)", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("1.3 Step-by-Step Process", h2_style))

    elements.append(Paragraph("<b>Step 1: Check Qualifications</b>", h3_style))
    elements.append(Paragraph("✅ Revenue > $50M (avoid micro-caps)", bullet_style))
    elements.append(Paragraph("✅ Revenue growth > 10% annually", bullet_style))
    elements.append(Paragraph("✅ Gross margin > 40% (high-margin business)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("If fails any check → <b>REJECT</b>", body_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Calculate Growth Rate</b>", h3_style))
    elements.append(Paragraph("Growth = (Revenue Year 0 / Revenue Year -1) - 1", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("For better accuracy, use weighted average:", body_style))
    elements.append(Paragraph("Blended Growth = (60% x Recent Growth) + (40% x Previous Growth)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Determine P/S Multiple</b>", h3_style))
    elements.append(Paragraph("Use growth rate table above, or calculate:", body_style))
    elements.append(Paragraph("P/S = Growth Rate x 20 (capped at 10x)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("Adjust for margin:", body_style))
    elements.append(Paragraph("• High margin (>70%) = Add +1-2x", bullet_style))
    elements.append(Paragraph("• Medium margin (40-70%) = No adjustment", bullet_style))
    elements.append(Paragraph("• Low margin (<40%) = Subtract -1-2x", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 4: Calculate Intrinsic Value</b>", h3_style))
    elements.append(Paragraph("Intrinsic Value = Revenue x P/S", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 5: Compare to Market Cap</b>", h3_style))
    elements.append(Paragraph("Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Decision:</b> Buy if Ratio > 1.3x (30% or more undervalued)", body_style))

    elements.append(PageBreak())

    # Worked Example: Tech Company
    elements.append(Paragraph("1.4 Worked Example: Tech Company", h2_style))
    elements.append(Paragraph("<b>Example:</b> CloudSoft Inc (Fictional SaaS Company)", body_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Company Data:</b>", body_style))
    elements.append(Paragraph("• Annual Revenue: $450M", bullet_style))
    elements.append(Paragraph("• Revenue Growth (Y0/Y-1): 38%", bullet_style))
    elements.append(Paragraph("• Revenue Growth (Y-1/Y-2): 32%", bullet_style))
    elements.append(Paragraph("• Gross Margin: 72%", bullet_style))
    elements.append(Paragraph("• Current Market Cap: $2.1B", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 1: Qualifications</b>", h3_style))
    elements.append(Paragraph("• Revenue $450M > $50M ✅", bullet_style))
    elements.append(Paragraph("• Growth 38% > 10% ✅", bullet_style))
    elements.append(Paragraph("• Margin 72% > 40% ✅", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Calculate Blended Growth</b>", h3_style))
    elements.append(Paragraph("Growth = (38% x 0.6) + (32% x 0.4) = 35.6%", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Determine P/S</b>", h3_style))
    elements.append(Paragraph("35.6% growth falls in 30-50% range = Use 7x P/S (middle of 6-8x)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 4: Calculate Intrinsic Value</b>", h3_style))
    elements.append(Paragraph("Intrinsic Value = $450M x 7 = $3.15B", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 5: Compare to Market</b>", h3_style))
    elements.append(Paragraph("Ratio = $3.15B / $2.1B = 1.5x", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("✅ <b>DECISION: BUY</b> (Undervalued by 50%)", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("1.5 Which Tech Stocks Qualify", h2_style))

    elements.append(Paragraph("<b>Likely PASS ✅:</b>", body_style))
    elements.append(Paragraph("• Microsoft (mature, profitable)", bullet_style))
    elements.append(Paragraph("• Apple (huge revenue, stable)", bullet_style))
    elements.append(Paragraph("• Oracle (enterprise software)", bullet_style))
    elements.append(Paragraph("• Adobe (SaaS model)", bullet_style))
    elements.append(Paragraph("• Salesforce (mature SaaS)", bullet_style))
    elements.append(Paragraph("• ServiceNow (strong growth)", bullet_style))
    elements.append(Paragraph("• Cisco (networking)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Likely FAIL ❌:</b>", body_style))
    elements.append(Paragraph("• Pre-revenue startups", bullet_style))
    elements.append(Paragraph("• SPACs (no business yet)", bullet_style))
    elements.append(Paragraph("• Extreme losses (negative margins)", bullet_style))
    elements.append(Paragraph("• Revenue < $50M", bullet_style))
    elements.append(Paragraph("• Declining revenue", bullet_style))
    elements.append(Paragraph("• Low margins (< 40%)", bullet_style))
    elements.append(Paragraph("• Meme stocks", bullet_style))

    elements.append(PageBreak())

    # SECTION 2: UTILITIES
    elements.append(Paragraph("SECTION 2: UTILITIES", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("2.1 Why FCFF Fails for Utilities", h2_style))
    elements.append(Paragraph("<b>Problem: Massive Infrastructure CapEx</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph(
        "Utilities require continuous infrastructure investment (power plants, grids, pipelines). "
        "CapEx often exceeds 200% of EBIT, creating consistently negative FCFF despite stable operations.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("2.2 Dividend Discount Model (Gordon Growth)", h2_style))
    elements.append(Paragraph("<b>Formula:</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("Intrinsic Value = Next Year Dividend / (Cost of Equity - Growth Rate)", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Where:", body_style))
    elements.append(Paragraph("• Next Year Dividend = Current Dividend x (1 + Growth Rate)", bullet_style))
    elements.append(Paragraph("• Cost of Equity = Risk-free Rate + (Beta x Market Risk Premium)", bullet_style))
    elements.append(Paragraph("• Growth Rate = Historical dividend growth (typically 2-5%)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("2.3 Step-by-Step Process", h2_style))

    elements.append(Paragraph("<b>Step 1: Check Qualifications</b>", h3_style))
    elements.append(Paragraph("✅ Positive dividends for 3+ consecutive years", bullet_style))
    elements.append(Paragraph("✅ Dividend growth rate between -5% and +10% (stable)", bullet_style))
    elements.append(Paragraph("✅ Payout ratio < 90% (sustainable)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Calculate Dividend Growth Rate</b>", h3_style))
    elements.append(Paragraph("Growth = [(Div Y0 / Div Y-1) - 1] x 0.6 + [(Div Y-1 / Div Y-2) - 1] x 0.4", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Check Payout Ratio</b>", h3_style))
    elements.append(Paragraph("Payout Ratio = Total Dividends / Net Income", bullet_style))
    elements.append(Paragraph("Must be less than 90% for sustainability", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 4: Calculate Intrinsic Value</b>", h3_style))
    elements.append(Paragraph("Next Dividend = Current Dividend x (1 + Growth)", bullet_style))
    elements.append(Paragraph("Intrinsic Value = Next Dividend / (Cost of Equity - Growth)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 5: Compare to Market Cap</b>", h3_style))
    elements.append(Paragraph("Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Decision:</b> Buy if Ratio > 1.2x (20% or more undervalued)", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<i>Note: Lower threshold for utilities due to stability</i>", body_style))

    elements.append(PageBreak())

    # Worked Example: Utility Company
    elements.append(Paragraph("2.4 Worked Example: Utility Company", h2_style))
    elements.append(Paragraph("<b>Example:</b> PowerGrid Corp (Fictional Electric Utility)", body_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Company Data:</b>", body_style))
    elements.append(Paragraph("• Total Dividends Paid (Y0): $800M", bullet_style))
    elements.append(Paragraph("• Total Dividends Paid (Y-1): $770M", bullet_style))
    elements.append(Paragraph("• Total Dividends Paid (Y-2): $750M", bullet_style))
    elements.append(Paragraph("• Net Income: $1.2B", bullet_style))
    elements.append(Paragraph("• Cost of Equity: 8.5%", bullet_style))
    elements.append(Paragraph("• Current Market Cap: $15B", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 1: Qualifications</b>", h3_style))
    elements.append(Paragraph("• 3+ years of positive dividends ✅", bullet_style))
    elements.append(Paragraph("• Stable growth (checking next) ✅", bullet_style))
    elements.append(Paragraph("• Payout ratio (checking next) ✅", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Calculate Dividend Growth</b>", h3_style))
    elements.append(Paragraph("Recent Growth = ($800M / $770M) - 1 = 3.9%", bullet_style))
    elements.append(Paragraph("Previous Growth = ($770M / $750M) - 1 = 2.7%", bullet_style))
    elements.append(Paragraph("Blended = (3.9% x 0.6) + (2.7% x 0.4) = 3.4%", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Check Payout Ratio</b>", h3_style))
    elements.append(Paragraph("Payout = $800M / $1,200M = 66.7% < 90% ✅", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 4: Calculate Intrinsic Value</b>", h3_style))
    elements.append(Paragraph("Next Dividend = $800M x (1 + 0.034) = $827M", bullet_style))
    elements.append(Paragraph("Intrinsic Value = $827M / (0.085 - 0.034) = $16.2B", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 5: Compare to Market</b>", h3_style))
    elements.append(Paragraph("Ratio = $16.2B / $15B = 1.08x", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("⚠️ <b>DECISION: HOLD</b> (Slightly undervalued, but below 1.2x threshold)", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("2.5 Important Notes for Utilities", h2_style))
    elements.append(Paragraph("• <b>Lower threshold:</b> Use 1.2x instead of 1.3x (utilities are stable, lower upside expected)", bullet_style))
    elements.append(Paragraph("• <b>Dividend cuts are red flags:</b> If dividends decrease, immediately re-evaluate", bullet_style))
    elements.append(Paragraph("• <b>Regulatory risk:</b> Consider regulatory changes that could impact dividend sustainability", bullet_style))
    elements.append(Paragraph("• <b>Interest rate sensitivity:</b> Utilities underperform when rates rise (compete with bonds)", bullet_style))

    elements.append(PageBreak())

    # SECTION 3: REAL ESTATE (REITs)
    elements.append(Paragraph("SECTION 3: REAL ESTATE (REITs)", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("3.1 Why FCFF Fails for REITs", h2_style))
    elements.append(Paragraph("<b>Problem: Extreme Working Capital Volatility</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph(
        "REITs have huge swings in working capital from property acquisitions/disposals. "
        "ΔNWC can exceed 100% of EBIT, creating false signals in FCFF calculations. "
        "Additionally, depreciation is a non-cash expense that does not reflect property value appreciation.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("3.2 Cap Rate Method (FFO-Based)", h2_style))
    elements.append(Paragraph("<b>Formula:</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("Intrinsic Value = FFO / Cap Rate", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Where:", body_style))
    elements.append(Paragraph("• FFO (Funds From Operations) = Net Income + Depreciation", bullet_style))
    elements.append(Paragraph("• Cap Rate = WACC + 2% (real estate risk premium)", bullet_style))
    elements.append(Paragraph("• Typical Cap Rates: 5-9% depending on property type and location", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("3.3 Step-by-Step Process", h2_style))

    elements.append(Paragraph("<b>Step 1: Check Qualifications</b>", h3_style))
    elements.append(Paragraph("✅ Positive net income (profitable operations)", bullet_style))
    elements.append(Paragraph("✅ Debt-to-Assets ratio < 70% (not over-leveraged)", bullet_style))
    elements.append(Paragraph("✅ Positive FFO growth or stability", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Calculate FFO</b>", h3_style))
    elements.append(Paragraph("FFO = Net Income + Depreciation and Amortization", bullet_style))
    elements.append(Paragraph("<i>Note: Full FFO calculation subtracts gains on property sales, but simplified version is acceptable</i>", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Determine Cap Rate</b>", h3_style))
    elements.append(Paragraph("Cap Rate = WACC + 2%", bullet_style))
    elements.append(Paragraph("Typical range: 5-9% (lower for prime properties, higher for secondary markets)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 4: Calculate Intrinsic Value</b>", h3_style))
    elements.append(Paragraph("Intrinsic Value = FFO / Cap Rate", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 5: Compare to Market Cap</b>", h3_style))
    elements.append(Paragraph("Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Decision:</b> Buy if Ratio > 1.3x (30% or more undervalued)", body_style))

    elements.append(PageBreak())

    # Worked Example: REIT
    elements.append(Paragraph("3.4 Worked Example: REIT", h2_style))
    elements.append(Paragraph("<b>Example:</b> PropertyTrust REIT (Fictional Office REIT)", body_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Company Data:</b>", body_style))
    elements.append(Paragraph("• Net Income: $180M", bullet_style))
    elements.append(Paragraph("• Depreciation and Amortization: $120M", bullet_style))
    elements.append(Paragraph("• Total Assets: $4.5B", bullet_style))
    elements.append(Paragraph("• Total Debt: $2.7B", bullet_style))
    elements.append(Paragraph("• WACC: 5.5%", bullet_style))
    elements.append(Paragraph("• Current Market Cap: $3.2B", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 1: Qualifications</b>", h3_style))
    elements.append(Paragraph("• Net Income $180M > 0 ✅", bullet_style))
    elements.append(Paragraph("• Debt/Assets = $2.7B / $4.5B = 60% < 70% ✅", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Calculate FFO</b>", h3_style))
    elements.append(Paragraph("FFO = $180M + $120M = $300M", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Determine Cap Rate</b>", h3_style))
    elements.append(Paragraph("Cap Rate = 5.5% + 2% = 7.5%", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 4: Calculate Intrinsic Value</b>", h3_style))
    elements.append(Paragraph("Intrinsic Value = $300M / 0.075 = $4.0B", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 5: Compare to Market</b>", h3_style))
    elements.append(Paragraph("Ratio = $4.0B / $3.2B = 1.25x", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>DECISION: HOLD</b> (Undervalued but below 1.3x threshold)", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("3.5 REIT-Specific Considerations", h2_style))
    elements.append(Paragraph("• <b>Property type matters:</b> Industrial/Data Centers (strong) vs Retail/Office (weak)", bullet_style))
    elements.append(Paragraph("• <b>Occupancy rates:</b> Check if properties are 85% or more occupied", bullet_style))
    elements.append(Paragraph("• <b>Debt maturity:</b> Avoid REITs with large debt coming due in high-rate environment", bullet_style))
    elements.append(Paragraph("• <b>FFO vs AFFO:</b> Adjusted FFO (AFFO) subtracts maintenance CapEx - more conservative", bullet_style))
    elements.append(Paragraph("• <b>Distribution yield:</b> REITs must pay 90% or more of income as dividends (tax requirement)", bullet_style))

    elements.append(PageBreak())

    # SECTION 4: IMPLEMENTATION GUIDE
    elements.append(Paragraph("SECTION 4: IMPLEMENTATION GUIDE", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("4.1 Integration with Existing Strategy", h2_style))

    elements.append(Paragraph("<b>Current Strategy (5 Sectors):</b>", body_style))
    elements.append(Paragraph("1. Calculate Greenwald EPV", bullet_style))
    elements.append(Paragraph("2. Calculate 15-Year Profit Projections", bullet_style))
    elements.append(Paragraph("3. Calculate 15-Year FCFF Projections", bullet_style))
    elements.append(Paragraph("4. Average the 3 values = Intrinsic Value", bullet_style))
    elements.append(Paragraph("5. Rank by Intrinsic/Market Ratio", bullet_style))
    elements.append(Paragraph("6. Buy top 100 stocks from 5 sectors", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("<b>Enhanced Strategy (9 Sectors):</b>", body_style))
    elements.append(Paragraph("1. For Traditional Sectors (Materials, Healthcare, Consumer, Energy, Finance):", bullet_style))
    elements.append(Paragraph("   → Use existing 3-model approach", bullet_style))
    elements.append(Paragraph("2. For Tech/Telecom:", bullet_style))
    elements.append(Paragraph("   → Calculate Greenwald EPV", bullet_style))
    elements.append(Paragraph("   → Calculate Revenue x P/S", bullet_style))
    elements.append(Paragraph("   → Average the 2 values", bullet_style))
    elements.append(Paragraph("3. For Utilities:", bullet_style))
    elements.append(Paragraph("   → Calculate Greenwald EPV", bullet_style))
    elements.append(Paragraph("   → Calculate Dividend Discount Model", bullet_style))
    elements.append(Paragraph("   → Average the 2 values", bullet_style))
    elements.append(Paragraph("4. For REITs:", bullet_style))
    elements.append(Paragraph("   → Calculate Greenwald EPV", bullet_style))
    elements.append(Paragraph("   → Calculate FFO/Cap Rate", bullet_style))
    elements.append(Paragraph("   → Average the 2 values", bullet_style))
    elements.append(Paragraph("5. Rank ALL stocks by Intrinsic/Market Ratio", bullet_style))
    elements.append(Paragraph("6. Buy top 100-150 stocks across all 9 sectors", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("4.2 Portfolio Construction Example", h2_style))

    portfolio_data = [
        ['Sector Group', 'Target %', 'Stocks', 'Valuation Method'],
        ['Traditional Value\n(5 sectors)', '60%', '60', 'Greenwald + Profit + FCFF'],
        ['Technology', '20%', '20', 'Greenwald + Revenue x P/S'],
        ['Utilities', '10%', '10', 'Greenwald + Dividend'],
        ['REITs', '10%', '10', 'Greenwald + FFO/Cap'],
        ['TOTAL', '100%', '100', 'Multi-Model Approach'],
    ]

    portfolio_table = Table(portfolio_data, colWidths=[1.8*inch, 1*inch, 1*inch, 2.7*inch])
    portfolio_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fff9c4')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(portfolio_table)

    elements.append(PageBreak())

    # Decision Matrix
    elements.append(Paragraph("4.3 Decision Matrix", h2_style))

    decision_data = [
        ['Sector', 'Primary Model', 'Secondary Model', 'Buy Threshold'],
        ['Basic Materials', 'FCFF', 'Greenwald EPV', '> 1.3x'],
        ['Healthcare', 'FCFF', 'Profit Projections', '> 1.3x'],
        ['Consumer Cyclical', 'FCFF', 'Greenwald EPV', '> 1.3x'],
        ['Energy', 'FCFF', 'Greenwald EPV', '> 1.3x'],
        ['Financial Services', 'Profit Projections', 'Greenwald EPV', '> 1.3x'],
        ['Technology', 'Revenue x P/S', 'Greenwald EPV', '> 1.3x'],
        ['Communication', 'Revenue x P/S', 'Greenwald EPV', '> 1.3x'],
        ['Utilities', 'Dividend Discount', 'Greenwald EPV', '> 1.2x'],
        ['Real Estate', 'FFO/Cap Rate', 'Greenwald EPV', '> 1.3x'],
    ]

    decision_table = Table(decision_data, colWidths=[1.5*inch, 1.7*inch, 1.7*inch, 1.6*inch])
    decision_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 6), (-1, 8), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(decision_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("4.4 Screening Workflow", h2_style))
    elements.append(Paragraph("<b>Universal Steps (All Sectors):</b>", body_style))
    elements.append(Paragraph("1. Calculate Greenwald EPV (always applicable)", bullet_style))
    elements.append(Paragraph("2. Determine sector and select appropriate secondary model", bullet_style))
    elements.append(Paragraph("3. Calculate sector-specific valuation (Revenue x P/S, Dividend, or FFO)", bullet_style))
    elements.append(Paragraph("4. Average the two values = Final Intrinsic Value", bullet_style))
    elements.append(Paragraph("5. Calculate ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Paragraph("6. Filter by threshold (typically >1.3x, except Utilities at >1.2x)", bullet_style))
    elements.append(Paragraph("7. Rank all qualifying stocks by ratio (highest first)", bullet_style))
    elements.append(Paragraph("8. Select top 100-150 stocks for portfolio", bullet_style))

    elements.append(PageBreak())

    # SECTION 5: IMPLEMENTATION OPTIONS
    elements.append(Paragraph("SECTION 5: IMPLEMENTATION OPTIONS", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Option A: Keep Current Strategy", h2_style))
    elements.append(Paragraph("<b>Choose if:</b>", body_style))
    elements.append(Paragraph("• You want proven results (14.79% backtest)", bullet_style))
    elements.append(Paragraph("• You prioritize downside protection", bullet_style))
    elements.append(Paragraph("• You want simplicity (3 models, 5 sectors)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Portfolio:</b> 100 stocks from 5 sectors (Materials, Healthcare, Consumer, Energy, Finance)", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Option B: Hybrid Approach", h2_style))
    elements.append(Paragraph("<b>Choose if:</b>", body_style))
    elements.append(Paragraph("• You want some tech exposure without full commitment", bullet_style))
    elements.append(Paragraph("• You want to test new sectors before full adoption", bullet_style))
    elements.append(Paragraph("• You want balance between safety and growth", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Portfolio:</b>", body_style))
    elements.append(Paragraph("• 80 traditional value stocks (existing strategy)", bullet_style))
    elements.append(Paragraph("• 20 tech stocks (Revenue x P/S method)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Implementation:</b>", body_style))
    elements.append(Paragraph("1. Run current strategy and get top 80 value stocks", bullet_style))
    elements.append(Paragraph("2. Screen tech sector separately and get top 20 tech stocks", bullet_style))
    elements.append(Paragraph("3. Combine into 100-stock portfolio (80/20 split)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Option C: Full Multi-Sector", h2_style))
    elements.append(Paragraph("<b>Choose if:</b>", body_style))
    elements.append(Paragraph("• You want maximum diversification", bullet_style))
    elements.append(Paragraph("• You can tolerate higher volatility", bullet_style))
    elements.append(Paragraph("• You want to capture tech upside", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Portfolio:</b> 100-150 stocks across 9 sectors", body_style))
    elements.append(Paragraph("• 60% Traditional value (60 stocks)", bullet_style))
    elements.append(Paragraph("• 20% Technology (20-30 stocks)", bullet_style))
    elements.append(Paragraph("• 10% Utilities (10-15 stocks)", bullet_style))
    elements.append(Paragraph("• 10% REITs (10-15 stocks)", bullet_style))

    elements.append(PageBreak())

    # SECTION 6: QUICK REFERENCE
    elements.append(Paragraph("SECTION 6: QUICK REFERENCE", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Formula Cheat Sheet", h2_style))

    elements.append(Paragraph("<b>Technology/Telecom:</b>", body_style))
    elements.append(Paragraph("Intrinsic Value = Revenue x (Growth Rate x 20)", bullet_style))
    elements.append(Paragraph("Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Paragraph("Buy if: Ratio >1.3x AND Revenue >$50M AND Growth >10% AND Margin >40%", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Utilities:</b>", body_style))
    elements.append(Paragraph("Intrinsic Value = [Dividend x (1 + Growth)] / (Cost of Equity - Growth)", bullet_style))
    elements.append(Paragraph("Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Paragraph("Buy if: Ratio >1.2x AND 3+ years dividends AND Payout <90%", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>REITs:</b>", body_style))
    elements.append(Paragraph("FFO = Net Income + Depreciation", bullet_style))
    elements.append(Paragraph("Intrinsic Value = FFO / (WACC + 2%)", bullet_style))
    elements.append(Paragraph("Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Paragraph("Buy if: Ratio >1.3x AND Debt/Assets <70%", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("P/S Multiple Quick Reference", h2_style))

    ps_data = [
        ['Growth Rate', 'P/S Multiple'],
        ['50% or more', '10x'],
        ['40-50%', '8x'],
        ['30-40%', '6x'],
        ['20-30%', '5x'],
        ['10-20%', '3x'],
        ['0-10%', '2x'],
    ]

    ps_table = Table(ps_data, colWidths=[3*inch, 3.5*inch])
    ps_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(ps_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Threshold Summary", h2_style))

    threshold_data = [
        ['Sector', 'Buy Threshold', 'Reason'],
        ['Most sectors', '> 1.3x', '30% or more undervalued'],
        ['Utilities', '> 1.2x', 'Lower growth, stable'],
    ]

    threshold_table = Table(threshold_data, colWidths=[2*inch, 2*inch, 2.5*inch])
    threshold_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(threshold_table)

    elements.append(Spacer(1, 0.5*inch))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )

    elements.append(Paragraph("—", footer_style))
    elements.append(Paragraph("<b>Document Version:</b> 1.0 | <b>Last Updated:</b> October 15, 2025", footer_style))
    elements.append(Paragraph("<b>END OF DOCUMENT</b>", footer_style))

    # Build PDF
    doc.build(elements)

    print(f"✅ PDF created successfully: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_sector_valuation_pdf()
