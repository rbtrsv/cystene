#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Generate Technology Stock Valuation Framework PDF
Comprehensive guide for analyzing tech stocks using institutional methods
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.colors import HexColor

def create_tech_valuation_pdf():
    """Create comprehensive technology stock valuation framework PDF"""

    # Create PDF
    pdf_path = "TECHNOLOGY_STOCK_VALUATION_FRAMEWORK.pdf"
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

    warning_style = ParagraphStyle(
        'Warning',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#d32f2f'),
        spaceAfter=8,
        leftIndent=10,
        fontName='Helvetica-Bold'
    )

    # Title page
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("Technology Stock Valuation Framework", title_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("Institutional-Grade Methods for Value Investors", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Supplement to Value Investing Strategy<br/>Generated: October 17, 2025", supplement_style))

    # Executive Summary
    elements.append(Paragraph("EXECUTIVE SUMMARY", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("The Challenge", h2_style))
    elements.append(Paragraph(
        "Technology stocks fundamentally fail traditional FCFF-based valuation. "
        "Backtest results show Tech/Telecom sectors underperform baseline by <b>-5.19% to -2.41%</b> with R&D adjustments. "
        "The problem isn't the formula—it's the business model mismatch.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("The Solution: Two-Track Approach", h2_style))
    elements.append(Paragraph("<b>Track 1: Mature Tech (Conservative)</b>", body_style))
    elements.append(Paragraph("• Use existing FCFF framework with additional quality filters", bullet_style))
    elements.append(Paragraph("• Target: Profitable, cash-generative tech companies (IBM, Intel, Cisco)", bullet_style))
    elements.append(Paragraph("• Expected returns: Similar to baseline value strategy", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Track 2: High-Growth Tech (Separate System)</b>", body_style))
    elements.append(Paragraph("• Use revenue multiples and unit economics", bullet_style))
    elements.append(Paragraph("• Target: Growth companies with strong fundamentals", bullet_style))
    elements.append(Paragraph("• Expected returns: Higher volatility, higher potential upside", bullet_style))

    elements.append(PageBreak())

    # SECTION 1: WHY FCFF FAILS FOR TECH
    elements.append(Paragraph("SECTION 1: WHY FCFF FAILS FOR TECH", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("1.1 The Fundamental Mismatch", h2_style))

    elements.append(Paragraph("<b>Issue #1: Intangible Capital</b>", h3_style))
    elements.append(Paragraph(
        "Tech companies invest in R&D (expensed immediately) rather than factories (capitalized). "
        "FCFF penalizes R&D spending as a cash outflow, but <b>R&D is tech's CapEx</b>—it builds moats "
        "through software, patents, and network effects.",
        body_style
    ))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Issue #2: Optionality Value</b>", h3_style))
    elements.append(Paragraph(
        "Tech companies sacrifice current profits for market share and platform dominance. "
        "Traditional DCF assumes steady-state cash flows. Tech is about buying growth options "
        "that may pay off 5-10 years out.",
        body_style
    ))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Issue #3: Winner-Take-Most Dynamics</b>", h3_style))
    elements.append(Paragraph(
        "Tech markets tend toward monopolies (Google search, Facebook social, AWS cloud). "
        "The intrinsic value of the #1 player is 10x the #2 player, but fundamentals look similar early on. "
        "FCFF can't capture this network effect premium.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("1.2 Backtest Evidence", h2_style))

    backtest_data = [
        ['Modification', 'US Top 10', 'US Top 25', 'Germany Top 10', 'Germany Top 25'],
        ['Baseline (No Tech)', '+14.79%', '+14.79%', '+19.51%', '+17.23%'],
        ['R&D Add-Back', '-5.19%', '-4.37%', '-2.41%', '-1.99%'],
        ['CapEx Adjustment', '-2.09%', '-0.87%', 'Not Tested', 'Not Tested'],
    ]

    backtest_table = Table(backtest_data, colWidths=[1.7*inch, 1.1*inch, 1.1*inch, 1.2*inch, 1.4*inch])
    backtest_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#c8e6c9')),
        ('BACKGROUND', (0, 2), (-1, 3), colors.HexColor('#ffcdd2')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(backtest_table)
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph(
        "<b>Conclusion:</b> All tech modifications underperformed baseline. Excluding tech entirely "
        "delivers superior returns (+14.79% to +19.51%).",
        warning_style
    ))

    elements.append(PageBreak())

    # SECTION 2: TRACK 1 - MATURE TECH
    elements.append(Paragraph("SECTION 2: TRACK 1 - MATURE TECH VALUE", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("2.1 Philosophy", h2_style))
    elements.append(Paragraph(
        "Target tech stocks that <b>behave like value stocks</b>: profitable, cash-generative, "
        "with stable business models. Use existing FCFF framework with additional quality filters.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("2.2 Mature Tech Filter Criteria", h2_style))

    elements.append(Paragraph("<b>Financial Filters:</b>", h3_style))
    elements.append(Paragraph("✅ P/E < 20 (value territory)", bullet_style))
    elements.append(Paragraph("✅ FCF positive for 3+ consecutive years", bullet_style))
    elements.append(Paragraph("✅ FCF/Net Income > 0.8 (cash-generative)", bullet_style))
    elements.append(Paragraph("✅ Revenue growth 5-15% (mature, not hyper-growth)", bullet_style))
    elements.append(Paragraph("✅ R&D/Revenue declining or flat (efficiency phase)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Quality Filters:</b>", h3_style))
    elements.append(Paragraph("✅ Gross margins > 60% (software-like economics)", bullet_style))
    elements.append(Paragraph("✅ Operating leverage visible (margins expanding as revenue grows)", bullet_style))
    elements.append(Paragraph("✅ ROIC > 15%, ROE > 20% sustained", bullet_style))
    elements.append(Paragraph("✅ Debt/Equity < 0.5 (conservative balance sheet)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("2.3 Valuation Method", h2_style))
    elements.append(Paragraph("<b>Use Existing 3-Model Framework:</b>", body_style))
    elements.append(Paragraph("1. Greenwald EPV (Earnings Power Value)", bullet_style))
    elements.append(Paragraph("2. 15-Year Profit Projections", bullet_style))
    elements.append(Paragraph("3. 15-Year FCFF Projections", bullet_style))
    elements.append(Paragraph("4. Average the 3 values = Intrinsic Value", bullet_style))
    elements.append(Paragraph("5. Ratio = Intrinsic Value / Market Cap", bullet_style))
    elements.append(Paragraph("6. Buy if Ratio > 1.3x", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("2.4 Example Mature Tech Stocks", h2_style))

    mature_tech_data = [
        ['Stock', 'Profile', 'Why Qualifies'],
        ['IBM', 'Enterprise software/services', 'Profitable, stable cash flow, low growth'],
        ['Intel', 'Semiconductor manufacturing', 'Mature market, high FCF, value P/E'],
        ['Cisco', 'Networking equipment', 'Cash cow, dividend payer, slow growth'],
        ['Oracle', 'Database software', 'Stable revenue, high margins, mature'],
        ['HP Inc', 'Hardware/printing', 'Profitable, low P/E, stable business'],
    ]

    mature_table = Table(mature_tech_data, colWidths=[1.2*inch, 2.2*inch, 3.1*inch])
    mature_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(mature_table)

    elements.append(PageBreak())

    # SECTION 3: TRACK 2 - HIGH-GROWTH TECH
    elements.append(Paragraph("SECTION 3: TRACK 2 - HIGH-GROWTH TECH", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("3.1 Philosophy", h2_style))
    elements.append(Paragraph(
        "<b>Don't try to value growth—RANK growth companies by quality.</b> "
        "Use revenue multiples, unit economics, and quality metrics instead of DCF. "
        "This is a <b>separate system</b> from your value framework.",
        warning_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("3.2 Revenue Multiple Method", h2_style))

    elements.append(Paragraph("<b>Formula:</b>", body_style))
    elements.append(Paragraph("Intrinsic Value = Annual Revenue × P/S Multiple", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>P/S Multiple Rules:</b>", body_style))
    elements.append(Paragraph("• P/S should be < Growth Rate (e.g., 30% growth → P/S < 30x)", bullet_style))
    elements.append(Paragraph("• Conservative: P/S = Growth Rate / 2 (e.g., 30% growth → P/S = 15x)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    ps_guide_data = [
        ['Revenue Growth', 'Max P/S', 'Conservative P/S'],
        ['50% or more', '50x', '25x'],
        ['30-50%', '40x', '20x'],
        ['20-30%', '25x', '12x'],
        ['10-20%', '15x', '8x'],
        ['0-10%', '10x', '5x'],
    ]

    ps_guide_table = Table(ps_guide_data, colWidths=[2*inch, 2*inch, 2.5*inch])
    ps_guide_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(ps_guide_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("3.3 Unit Economics (SaaS-Specific)", h2_style))

    elements.append(Paragraph("<b>Key Metrics:</b>", body_style))
    elements.append(Paragraph("• <b>LTV/CAC > 3x</b> (Customer Lifetime Value / Customer Acquisition Cost)", bullet_style))
    elements.append(Paragraph("  - Measures if customers are worth more than cost to acquire them", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("• <b>Payback Period < 12 months</b>", bullet_style))
    elements.append(Paragraph("  - How long to recover customer acquisition cost", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("• <b>Net Revenue Retention > 110%</b>", bullet_style))
    elements.append(Paragraph("  - Existing customers spend more each year (expansion revenue)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("• <b>Rule of 40: Growth% + Margin% > 40%</b>", bullet_style))
    elements.append(Paragraph("  - Balances growth and profitability", bullet_style))
    elements.append(Paragraph("  - Example: 30% growth + 15% margin = 45% ✅", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("3.4 Reverse DCF (Overvaluation Check)", h2_style))
    elements.append(Paragraph("<b>Purpose:</b> Identify overvalued stocks, not undervalued ones", body_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Method:</b>", body_style))
    elements.append(Paragraph("1. Take current stock price", bullet_style))
    elements.append(Paragraph("2. Back-solve for implied growth rate needed to justify that price", bullet_style))
    elements.append(Paragraph("3. Ask: 'Is 25% growth for 10 years realistic given TAM?'", bullet_style))
    elements.append(Paragraph("4. If implied growth is unrealistic → <b>AVOID</b>", bullet_style))

    elements.append(PageBreak())

    # SECTION 4: QUALITY SCORING SYSTEM
    elements.append(Paragraph("SECTION 4: TECH QUALITY SCORING SYSTEM", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("4.1 Ranking Framework (0-100 Points)", h2_style))

    elements.append(Paragraph("<b>Profitability (25 points):</b>", h3_style))
    elements.append(Paragraph("• Gross margin >70%: 15 pts", bullet_style))
    elements.append(Paragraph("• Operating margin >20%: 10 pts", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Growth (25 points):</b>", h3_style))
    elements.append(Paragraph("• Revenue growth >20%: 15 pts", bullet_style))
    elements.append(Paragraph("• Earnings growth >15%: 10 pts", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Balance Sheet (25 points):</b>", h3_style))
    elements.append(Paragraph("• Net cash position: 15 pts", bullet_style))
    elements.append(Paragraph("• Debt/Equity <0.3: 10 pts", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Efficiency (25 points):</b>", h3_style))
    elements.append(Paragraph("• Rule of 40 >50: 15 pts (Growth% + Margin%)", bullet_style))
    elements.append(Paragraph("• R&D/Sales <25%: 10 pts (efficiency)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("4.2 Valuation Check", h2_style))
    elements.append(Paragraph("<b>Only buy if:</b>", body_style))
    elements.append(Paragraph("1. Quality Score >60 points (minimum quality threshold)", bullet_style))
    elements.append(Paragraph("2. P/S < (Growth Rate / 2)", bullet_style))
    elements.append(Paragraph("3. Rule of 40 >40%", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("4.3 Worked Example: Growth Tech Stock", h2_style))

    elements.append(Paragraph("<b>Example: FastCloud Inc (Fictional SaaS)</b>", body_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Metrics:</b>", body_style))
    elements.append(Paragraph("• Revenue: $500M, Growth: 35%", bullet_style))
    elements.append(Paragraph("• Gross Margin: 75%, Operating Margin: 18%", bullet_style))
    elements.append(Paragraph("• Net Cash: $100M (no debt)", bullet_style))
    elements.append(Paragraph("• R&D/Sales: 22%", bullet_style))
    elements.append(Paragraph("• Current Market Cap: $8B", bullet_style))
    elements.append(Paragraph("• Current P/S: 16x", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Quality Score:</b>", body_style))
    elements.append(Paragraph("• Profitability: 15 + 0 = 15 pts (good margins, but <20% operating)", bullet_style))
    elements.append(Paragraph("• Growth: 15 pts (>20% revenue growth)", bullet_style))
    elements.append(Paragraph("• Balance Sheet: 15 + 10 = 25 pts (net cash, no debt)", bullet_style))
    elements.append(Paragraph("• Efficiency: 15 + 10 = 25 pts (Rule of 40 = 53%, R&D 22%)", bullet_style))
    elements.append(Paragraph("• <b>Total: 80/100 ✅</b>", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Valuation Check:</b>", body_style))
    elements.append(Paragraph("• P/S = 16x", bullet_style))
    elements.append(Paragraph("• Growth Rate / 2 = 35% / 2 = 17.5x", bullet_style))
    elements.append(Paragraph("• 16x < 17.5x ✅ (within reasonable range)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>DECISION: BUY</b> (High quality, reasonable valuation)", body_style))

    elements.append(PageBreak())

    # SECTION 5: BARBELL STRATEGY
    elements.append(Paragraph("SECTION 5: RECOMMENDED BARBELL STRATEGY", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("5.1 Philosophy", h2_style))
    elements.append(Paragraph(
        "Combine <b>80% proven value strategy</b> (FCFF-based, 5 winning sectors) with "
        "<b>20% quality growth</b> (tech stocks ranked by quality score). "
        "This captures upside while maintaining downside protection.",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("5.2 Portfolio Allocation", h2_style))

    allocation_data = [
        ['Bucket', 'Allocation', 'Method', 'Hold Period', 'Rebalance'],
        ['Value (Traditional)', '80%', 'FCFF-based (5 sectors)', '1-2 years', 'Annual'],
        ['Tech (Quality Growth)', '20%', 'Quality Score + P/S', '3-6 months', 'Quarterly'],
    ]

    allocation_table = Table(allocation_data, colWidths=[1.5*inch, 1*inch, 1.5*inch, 1*inch, 1.5*inch])
    allocation_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(allocation_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("5.3 Implementation Steps", h2_style))

    elements.append(Paragraph("<b>Step 1: Value Bucket (80 stocks)</b>", body_style))
    elements.append(Paragraph("1. Run existing value analysis on 5 sectors (Materials, Healthcare, Consumer, Energy, Finance)", bullet_style))
    elements.append(Paragraph("2. Apply filters: Market Cap >$5B, ROI >0%, intrinsic/market >1.3x", bullet_style))
    elements.append(Paragraph("3. Rank by intrinsic/market ratio", bullet_style))
    elements.append(Paragraph("4. Select top 80 stocks", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 2: Tech Bucket (20 stocks)</b>", body_style))
    elements.append(Paragraph("1. Screen all tech stocks (Technology + Communication Services sectors)", bullet_style))
    elements.append(Paragraph("2. Calculate Quality Score for each (0-100 points)", bullet_style))
    elements.append(Paragraph("3. Filter: Quality Score >60, P/S < (Growth/2), Rule of 40 >40%", bullet_style))
    elements.append(Paragraph("4. Rank by Quality Score", bullet_style))
    elements.append(Paragraph("5. Select top 20 stocks", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Step 3: Rebalancing</b>", body_style))
    elements.append(Paragraph("• Value bucket: Annual rebalance (same as current strategy)", bullet_style))
    elements.append(Paragraph("• Tech bucket: Quarterly rebalance (tech changes faster)", bullet_style))
    elements.append(Paragraph("• Review quality scores quarterly, replace declining stocks", bullet_style))

    elements.append(PageBreak())

    # SECTION 6: DECISION MATRIX
    elements.append(Paragraph("SECTION 6: DECISION MATRIX", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("6.1 Which Approach to Use?", h2_style))

    decision_comparison = [
        ['Approach', 'When to Use', 'Pros', 'Cons'],
        ['Current Strategy\n(No Tech)', 'Want proven results', '• Backtested 14.79% return\n• Simple\n• Lower volatility', '• Miss tech upside\n• Less diversified'],
        ['Mature Tech Only', 'Conservative tech exposure', '• Use existing framework\n• Quality stocks', '• Limited options\n• Still miss growth'],
        ['Barbell Strategy\n(Recommended)', 'Balanced approach', '• Captures tech upside\n• 80% downside protection\n• Diversified', '• More complex\n• Quarterly rebalance\n• Higher volatility'],
        ['Full Growth Tech', 'High risk tolerance', '• Maximum tech exposure\n• High upside potential', '• Unproven\n• High volatility\n• No backtest'],
    ]

    decision_table = Table(decision_comparison, colWidths=[1.3*inch, 1.5*inch, 2*inch, 1.7*inch])
    decision_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 3), (0, 3), colors.HexColor('#c8e6c9')),
    ]))
    elements.append(decision_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("6.2 Implementation Recommendation", h2_style))
    elements.append(Paragraph(
        "<b>Start with Barbell Strategy (80/20 split)</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Rationale:</b>", body_style))
    elements.append(Paragraph("• Keeps 80% in proven value strategy (downside protection)", bullet_style))
    elements.append(Paragraph("• Gets 20% tech exposure (upside potential)", bullet_style))
    elements.append(Paragraph("• Can adjust allocation based on results (increase/decrease tech %)", bullet_style))
    elements.append(Paragraph("• Quality Score filters for fundamentally sound tech stocks", bullet_style))
    elements.append(Paragraph("• Quarterly rebalance keeps tech holdings fresh", bullet_style))

    elements.append(PageBreak())

    # SECTION 7: QUICK REFERENCE
    elements.append(Paragraph("SECTION 7: QUICK REFERENCE", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Mature Tech Filter Checklist", h2_style))
    elements.append(Paragraph("✅ P/E < 20", bullet_style))
    elements.append(Paragraph("✅ FCF positive for 3+ years", bullet_style))
    elements.append(Paragraph("✅ FCF/Net Income > 0.8", bullet_style))
    elements.append(Paragraph("✅ Revenue growth 5-15%", bullet_style))
    elements.append(Paragraph("✅ R&D/Revenue declining or flat", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Growth Tech Quality Score", h2_style))
    elements.append(Paragraph("Profitability: Gross margin >70% (15 pts) + Operating margin >20% (10 pts)", bullet_style))
    elements.append(Paragraph("Growth: Revenue growth >20% (15 pts) + Earnings growth >15% (10 pts)", bullet_style))
    elements.append(Paragraph("Balance Sheet: Net cash position (15 pts) + Debt/Equity <0.3 (10 pts)", bullet_style))
    elements.append(Paragraph("Efficiency: Rule of 40 >50 (15 pts) + R&D/Sales <25% (10 pts)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Minimum: 60 points to qualify</b>", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Valuation Rules", h2_style))
    elements.append(Paragraph("• Revenue Multiple: P/S < (Growth Rate / 2)", bullet_style))
    elements.append(Paragraph("• Unit Economics: LTV/CAC > 3x, Payback < 12 months, NRR > 110%", bullet_style))
    elements.append(Paragraph("• Rule of 40: Growth% + Margin% > 40%", bullet_style))
    elements.append(Paragraph("• Reverse DCF: Check if implied growth is realistic", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Barbell Portfolio", h2_style))
    elements.append(Paragraph("• 80 stocks: Traditional value (FCFF-based, 5 sectors, annual rebalance)", bullet_style))
    elements.append(Paragraph("• 20 stocks: Quality growth tech (scored + ranked, quarterly rebalance)", bullet_style))

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
    elements.append(Paragraph("<b>Document Version:</b> 1.0 | <b>Last Updated:</b> October 17, 2025", footer_style))
    elements.append(Paragraph("<b>END OF DOCUMENT</b>", footer_style))

    # Build PDF
    doc.build(elements)

    print(f"✅ PDF created successfully: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_tech_valuation_pdf()
