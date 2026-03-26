#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Generate Complete Options Strategy Guide PDF
Direct PDF creation using ReportLab
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.colors import HexColor

def create_options_guide_pdf():
    """Create comprehensive options strategy guide PDF"""

    # Create PDF
    pdf_path = "COMPLETE_OPTIONS_STRATEGY_GUIDE.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    # Container for the 'Flowable' objects
    elements = []

    # Define styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#4a4a4a'),
        spaceAfter=20,
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
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("COMPLETE OPTIONS STRATEGY GUIDE", title_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Value Investing with LEAP Calls &amp; Put Selling", subtitle_style))
    elements.append(Spacer(1, 0.5*inch))

    # Summary box
    summary_data = [
        ['Strategy Foundation:', '50% NWC Threshold + FCFF Value Screening'],
        ['Backtest Performance:', 'Top 15 = 21.39% annualized (86.7% win rate)'],
        ['Capital Deployment:', 'LEAP calls for growth + Put selling for income'],
        ['Document Version:', '2.0'],
        ['Last Updated:', 'October 16, 2025']
    ]

    summary_table = Table(summary_data, colWidths=[2.2*inch, 4.3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f0f7')),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)

    elements.append(PageBreak())

    # Table of Contents
    elements.append(Paragraph("TABLE OF CONTENTS", h1_style))
    elements.append(Spacer(1, 0.2*inch))

    toc_data = [
        ['1.', 'Value Investing Foundation', '3'],
        ['2.', 'Why Options for Value Investors', '5'],
        ['3.', 'LEAP Call Strategy (Buying Calls)', '7'],
        ['4.', 'Put Selling Strategy', '11'],
        ['5.', 'Critical Liquidity Filter', '14'],
        ['6.', 'Real Backtest Examples', '18'],
        ['7.', 'Capital Allocation Framework', '21'],
        ['8.', 'Quick Reference Guide', '23'],
    ]

    toc_table = Table(toc_data, colWidths=[0.5*inch, 5.5*inch, 0.5*inch])
    toc_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ]))
    elements.append(toc_table)

    elements.append(PageBreak())

    # SECTION 1: VALUE INVESTING FOUNDATION
    elements.append(Paragraph("1. VALUE INVESTING FOUNDATION", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph(
        "Your value investing strategy identifies stocks trading at significant discounts to intrinsic value using:",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Core Screening Metrics", h2_style))

    metrics_data = [
        ['Metric', 'Threshold', 'Purpose'],
        ['NWC Threshold', '50% of EBIT', 'Filter false FCFF signals from working capital volatility'],
        ['FCFF Projection', '15-year DCF', 'Greenwald EPV + Growth Value methodology'],
        ['Sector Filter', '5 winning sectors', 'Basic Materials, Healthcare, Consumer Cyclical,\nEnergy, Financial Services'],
        ['Intrinsic/Market', '> 1.0', 'Only stocks trading below intrinsic value'],
        ['Market Cap', '>= $5B', 'Empirically validated for backtest success'],
        ['ROI', '>= 0%', 'Filter out non-growth businesses'],
    ]

    metrics_table = Table(metrics_data, colWidths=[1.5*inch, 1.3*inch, 3.7*inch])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Backtest Results (Top 15 with Filters)", h2_style))

    elements.append(Paragraph("• <b>Average Return:</b> 48.1% total (21.39% annualized)", bullet_style))
    elements.append(Paragraph("• <b>Win Rate:</b> 86.7% (13 winners, 2 losers)", bullet_style))
    elements.append(Paragraph("• <b>Holding Period:</b> ~700 days (1.9 years average)", bullet_style))
    elements.append(Paragraph("• <b>Best Performer:</b> GBFH +146.5% total (104% annualized)", bullet_style))
    elements.append(Paragraph("• <b>Risk Reduction:</b> Filters reduce losers by 75% vs unfiltered", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Filter Impact Comparison", h2_style))

    filter_data = [
        ['Portfolio\nSize', 'Sector Only', 'Sector + MCap + ROI', 'Improvement'],
        ['Top 10', '13.28%, 90% win', '29.22%, 90% win', '+15.94% return'],
        ['Top 15', '21.39%, 87% win', '23.77%, 93% win', '+2.38%, +6.3% win rate'],
        ['Top 20', '19.51%, 85% win', '21.99%, 95% win', '+2.48%, +10% win rate'],
        ['Top 25', '17.23%, 84% win', '22.06%, 96% win', '+4.83%, +12% win rate ✓✓'],
    ]

    filter_table = Table(filter_data, colWidths=[1*inch, 1.7*inch, 1.7*inch, 2.1*inch])
    filter_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (2, 1), (2, -1), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(filter_table)
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph(
        "<b>Key Insight:</b> Market cap >= $5B + ROI >= 0% filters reduce losing positions by 67-75% while maintaining similar returns.",
        body_style
    ))

    elements.append(PageBreak())

    # SECTION 2: WHY OPTIONS
    elements.append(Paragraph("2. WHY OPTIONS FOR VALUE INVESTORS", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph(
        "Your value strategy identifies stocks worth $100 trading at $50. Options allow you to:",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("The Capital Efficiency Problem", h2_style))

    elements.append(Paragraph("<b>Traditional Stock Buying:</b>", body_style))
    elements.append(Paragraph("• Buying 100 shares at $50 = $5,000 capital per position", bullet_style))
    elements.append(Paragraph("• $500k fund = Only 100 positions maximum", bullet_style))
    elements.append(Paragraph("• Limited leverage vs traditional hedge funds", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("The Options Solution", h2_style))

    elements.append(Paragraph("<b>LEAP Calls</b> (Buy ITM calls on Top 1-20 picks):", body_style))
    elements.append(Paragraph("• Buy 2-year LEAP call at $40 strike for $13 = $1,300 capital", bullet_style))
    elements.append(Paragraph("• Same $500k = 384 LEAP positions (3.8x more exposure)", bullet_style))
    elements.append(Paragraph("• Freed capital used for put selling income", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Put Selling</b> (Sell OTM puts on Top 20-100 picks):", body_style))
    elements.append(Paragraph("• Collect 3-5% premium every 30-60 days", bullet_style))
    elements.append(Paragraph("• Generate 25-35% annualized income on cash reserves", bullet_style))
    elements.append(Paragraph("• Get assigned at 10-20% below market (extra margin of safety)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Performance Comparison ($500k Portfolio)", h2_style))

    perf_data = [
        ['Strategy', 'Capital', 'Positions', 'Expected Return', 'Profit'],
        ['Buy Stocks', '$500,000', '100', '21% avg', '$105,000'],
        ['Buy LEAPs', '$130,000', '100', '18% (90% of stock)', '$140,000'],
        ['Freed Capital', '$370,000', '—', '—', '—'],
        ['Put Selling', '$250,000', '25 positions', '25% annualized', '$62,500'],
        ['Cash Reserve', '$120,000', '—', '—', '—'],
        ['TOTAL', '$500,000', '125', '—', '$202,500 (40.5%)'],
    ]

    perf_table = Table(perf_data, colWidths=[1.3*inch, 1.1*inch, 1*inch, 1.4*inch, 1.7*inch])
    perf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fff9c4')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(perf_table)
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph(
        "<b>Result:</b> Options strategy delivers <b>1.9x higher returns</b> (40.5% vs 21%) through leverage + income generation.",
        body_style
    ))

    elements.append(PageBreak())

    # SECTION 3: LEAP STRATEGY
    elements.append(Paragraph("3. LEAP CALL STRATEGY (BUYING CALLS)", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Definition", h2_style))
    elements.append(Paragraph(
        "<b>LEAP</b> = Long-term Equity Anticipation Securities",
        body_style
    ))
    elements.append(Paragraph("• Call options with 1-2 year expiration", bullet_style))
    elements.append(Paragraph("• Used for capital-efficient exposure to undervalued stocks", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("When to Use LEAP Calls", h2_style))
    elements.append(Paragraph("✅ <b>Top 1-20 stock picks</b> (highest conviction)", bullet_style))
    elements.append(Paragraph("✅ <b>Stocks with 50%+ undervaluation</b> (intrinsic/market ratio > 2.0)", bullet_style))
    elements.append(Paragraph("✅ <b>High win rate confidence</b> (based on backtesting)", bullet_style))
    elements.append(Paragraph("✅ <b>Liquid options markets</b> (see Section 5 for liquidity filter)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("STRIKE SELECTION FORMULA", h2_style))
    elements.append(Paragraph(
        "<b>BUY STRIKES 15-20% IN-THE-MONEY (BELOW CURRENT PRICE)</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.1*inch))

    strike_data = [
        ['Stock\nPrice', 'Optimal Strike', 'Premium', 'Delta', 'Intrinsic', 'Time\nValue'],
        ['$50', '$40 (20% ITM) ✓✓✓', '$13', '0.80', '$10', '$3'],
        ['$50', '$42.50 (15% ITM) ✓✓', '$11', '0.75', '$7.50', '$3.50'],
        ['$50', '$45 (10% ITM) ✓', '$9', '0.70', '$5', '$4'],
        ['$50', '$50 (ATM) ❌', '$7', '0.50', '$0', '$7'],
        ['$50', '$55 (OTM) ❌', '$4', '0.35', '$0', '$4'],
    ]

    strike_table = Table(strike_data, colWidths=[0.8*inch, 1.5*inch, 0.9*inch, 0.7*inch, 0.9*inch, 0.7*inch])
    strike_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 1), (-1, 3), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(strike_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Why In-The-Money (ITM)?", h2_style))

    elements.append(Paragraph(
        "<b>1. Less Time Value Cost</b>",
        h3_style
    ))
    elements.append(Paragraph("• ITM $40 strike pays $3 time value", bullet_style))
    elements.append(Paragraph("• ATM $50 strike pays $7 time value", bullet_style))
    elements.append(Paragraph("• You save 57% on time decay costs", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>2. Intrinsic Value Protection</b>",
        h3_style
    ))
    elements.append(Paragraph("• Already own $10 of real stock value (margin of safety)", bullet_style))
    elements.append(Paragraph("• Stock can drop 20% and you still have $10 intrinsic value", bullet_style))
    elements.append(Paragraph("• ATM/OTM options have ZERO intrinsic protection", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>3. High Delta (0.70-0.85)</b>",
        h3_style
    ))
    elements.append(Paragraph("• Captures 70-85% of stock moves", bullet_style))
    elements.append(Paragraph("• ATM captures only 50%", bullet_style))
    elements.append(Paragraph("• More stock-like behavior", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>4. Lower Time Decay</b>",
        h3_style
    ))
    elements.append(Paragraph("• ITM loses 15% value over 6 months", bullet_style))
    elements.append(Paragraph("• OTM loses 75% value over 6 months", bullet_style))
    elements.append(Paragraph("• Better odds of preserving value if stock stagnates", bullet_style))

    elements.append(PageBreak())

    # SECTION 3 continued: LULU Example
    elements.append(Paragraph("Real Example: LULU (Lululemon) - Oct 2025 Data", h2_style))

    elements.append(Paragraph("<b>Stock Analysis:</b>", body_style))
    elements.append(Paragraph("• Current Price: $167.10", bullet_style))
    elements.append(Paragraph("• Market Cap: $19.86B ✅", bullet_style))
    elements.append(Paragraph("• Sector: Consumer Cyclical ✅", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>LEAP Call Options</b> (Sep 18, 2026 expiration - 23 months):", body_style))
    elements.append(Spacer(1, 0.05*inch))

    lulu_calls_data = [
        ['Strike', 'ITM %', 'Premium\n(Mid)', 'Delta', 'OI', 'Spread', 'Verdict'],
        ['$140', '16.2%', '$49.33', '~0.80', '78', '12.8%', '✅ Good protection'],
        ['$165', '1.2%', '$36.65', '~0.55', '394', '6.2%', '✅✅ BEST'],
        ['$170', '-1.7%', '$34.08', '~0.50', '334', '4.3%', '✅✅ IDEAL'],
    ]

    lulu_calls_table = Table(lulu_calls_data, colWidths=[0.8*inch, 0.7*inch, 0.9*inch, 0.7*inch, 0.6*inch, 0.8*inch, 1.5*inch])
    lulu_calls_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 2), (-1, 3), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(lulu_calls_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Recommended LEAP Strategy for LULU:", h3_style))

    elements.append(Paragraph(
        "<b>Option 1: Maximum Protection ($140 strike)</b>",
        body_style
    ))
    elements.append(Paragraph("• Capital: $4,933 per contract", bullet_style))
    elements.append(Paragraph("• Delta: ~0.80 (captures 80% of moves)", bullet_style))
    elements.append(Paragraph("• Intrinsic: $27.10 (stock can drop 16% before losing intrinsic value)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>Option 2: Best Liquidity + Spread ($165 strike)</b>",
        body_style
    ))
    elements.append(Paragraph("• Capital: $3,665 per contract", bullet_style))
    elements.append(Paragraph("• OI: 394 contracts (institutional-grade liquidity)", bullet_style))
    elements.append(Paragraph("• Spread: 6.2% (acceptable transaction cost)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>Option 3: Lowest Cost + Best Spread ($170 strike)</b>",
        body_style
    ))
    elements.append(Paragraph("• Capital: $3,408 per contract", bullet_style))
    elements.append(Paragraph("• Spread: 4.3% (institutional quality)", bullet_style))
    elements.append(Paragraph("• OI: 334 contracts (excellent)", bullet_style))

    elements.append(PageBreak())

    # SECTION 4: PUT SELLING
    elements.append(Paragraph("4. PUT SELLING STRATEGY", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Definition", h2_style))
    elements.append(Paragraph(
        "<b>Cash-Secured Put Selling</b> = Getting paid to wait for better entry prices",
        body_style
    ))
    elements.append(Paragraph("• You sell put options on stocks you want to own", bullet_style))
    elements.append(Paragraph("• Collect premium upfront (3-5% of stock price)", bullet_style))
    elements.append(Paragraph("• If stock drops below strike, you buy at discount", bullet_style))
    elements.append(Paragraph("• If stock stays above strike, keep premium as income", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("When to Sell Puts", h2_style))
    elements.append(Paragraph("✅ <b>Stocks ranked 20-100</b> (good quality, not highest conviction)", bullet_style))
    elements.append(Paragraph("✅ <b>Generate income</b> while waiting for pullbacks", bullet_style))
    elements.append(Paragraph("✅ <b>Happy to own at lower prices</b> if assigned", bullet_style))
    elements.append(Paragraph("✅ <b>Liquid options markets</b> (see Section 5)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("STRIKE SELECTION FORMULA", h2_style))
    elements.append(Paragraph(
        "<b>SELL STRIKES 10-20% OUT-OF-THE-MONEY (BELOW CURRENT PRICE)</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.1*inch))

    put_strike_data = [
        ['Stock\nPrice', 'Put Strike', 'Premium', 'Effective\nEntry', 'Verdict'],
        ['$50', '$50 (ATM) ❌', '$5', '$45', 'No margin of safety'],
        ['$50', '$47.50 (5% OTM) ❌', '$3.50', '$44', 'Too close'],
        ['$50', '$45 (10% OTM) ✓', '$2.50', '$42.50', 'GOOD - Decent margin'],
        ['$50', '$42.50 (15% OTM) ✓✓', '$1.80', '$40.70', 'BETTER - Good margin'],
        ['$50', '$40 (20% OTM) ✓✓✓', '$1.20', '$38.80', 'BEST - Great margin'],
        ['$50', '$35 (30% OTM)', '$0.50', '$34.50', 'Premium too small'],
    ]

    put_strike_table = Table(put_strike_data, colWidths=[0.8*inch, 1.5*inch, 0.9*inch, 1*inch, 1.8*inch])
    put_strike_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 3), (-1, 5), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(put_strike_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Why Out-of-The-Money (OTM)?", h2_style))

    elements.append(Paragraph(
        "<b>1. Stock must drop 10-20% before obligation</b>",
        h3_style
    ))
    elements.append(Paragraph("• Buffer against normal volatility", bullet_style))
    elements.append(Paragraph("• Market can have -10% correction without triggering assignment", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>2. High probability expires worthless (70-80%)</b>",
        h3_style
    ))
    elements.append(Paragraph("• Most puts expire = you keep premium as income", bullet_style))
    elements.append(Paragraph("• Roll premium monthly = 25-40% annualized income", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>3. If assigned: You buy 15-20% below market price</b>",
        h3_style
    ))
    elements.append(Paragraph("• Extra margin of safety on top of your intrinsic value discount", bullet_style))
    elements.append(Paragraph("• Example: $42.50 strike - $1.80 premium = $40.70 entry (19% below $50 market)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>4. Meaningful premium: 3-5% in 45-60 days</b>",
        h3_style
    ))
    elements.append(Paragraph("• 3% every 60 days = 18% annualized", bullet_style))
    elements.append(Paragraph("• 5% every 45 days = 40% annualized", bullet_style))

    elements.append(PageBreak())

    # SECTION 4 continued: LULU Put Example
    elements.append(Paragraph("Real Example: LULU Put Selling - Oct 2025 Data", h2_style))

    elements.append(Paragraph("<b>Put Options</b> (Sep 18, 2026 expiration - 23 months):", body_style))
    elements.append(Spacer(1, 0.05*inch))

    lulu_puts_data = [
        ['Strike', 'OTM %', 'Premium\n(Mid)', 'Premium\n%', 'Effective\nEntry', 'OI', 'Spread', 'Verdict'],
        ['$150', '10.2%', '$20.40', '12.2%', '$129.60', '249', '8.7%', '✅✅✅ BEST'],
        ['$145', '13.2%', '$18.95', '11.4%', '$126.05', '115', '8.8%', '✅✅ IDEAL'],
    ]

    lulu_puts_table = Table(lulu_puts_data, colWidths=[0.7*inch, 0.7*inch, 0.8*inch, 0.8*inch, 0.9*inch, 0.6*inch, 0.7*inch, 1.3*inch])
    lulu_puts_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 7.5),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 7.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 1), (-1, 2), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(lulu_puts_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Recommended Put Selling Strategy:", h3_style))

    elements.append(Paragraph(
        "<b>Option 1: $150 Put (10.2% OTM) - BEST OVERALL</b>",
        body_style
    ))
    elements.append(Paragraph("• Collect: $2,040 per contract ($20.40 × 100)", bullet_style))
    elements.append(Paragraph("• Premium %: 12.2% of stock price (far exceeds 3-5% target!)", bullet_style))
    elements.append(Paragraph("• Effective Entry if Assigned: $129.60 (22.4% below current price)", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph(
        "<b>Option 2: $145 Put (13.2% OTM) - BETTER PROTECTION</b>",
        body_style
    ))
    elements.append(Paragraph("• Collect: $1,895 per contract", bullet_style))
    elements.append(Paragraph("• Premium %: 11.4% (still excellent!)", bullet_style))
    elements.append(Paragraph("• Effective Entry if Assigned: $126.05 (24.5% below current price)", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("BOTH OUTCOMES ARE WINS", h2_style))

    elements.append(Paragraph(
        "<b>Example:</b> Stock at $167.10, sell $150 put (10.2% OTM) for $20.40 premium, collect $2,040",
        body_style
    ))
    elements.append(Spacer(1, 0.1*inch))

    outcomes_data = [
        ['', 'Outcome 1:\nExpires Worthless', 'Outcome 2:\nGet Assigned'],
        ['Stock Movement', 'Stays above $150', 'Drops below $150'],
        ['Your Action', 'Nothing - put expires', 'Buy 100 shares at $150'],
        ['Premium', 'Keep $2,040', 'Keep $2,040 (already collected)'],
        ['Effective Entry', 'N/A', '$129.60 ($150 - $20.40)'],
        ['Return', '$2,040 in 23 months = 13.6%\nAnnualized: 7.1%', 'Own stock at 22.4% below\ncurrent price'],
        ['Result', '✅ WIN - Collected income', '✅ WIN - Bought cheaper + income'],
    ]

    outcomes_table = Table(outcomes_data, colWidths=[1.3*inch, 2.5*inch, 2.7*inch])
    outcomes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f5e9')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(outcomes_table)
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph(
        "<b>Golden Rule:</b> Only sell puts on stocks you WANT to own at prices you're HAPPY to pay.",
        body_style
    ))

    elements.append(PageBreak())

    # SECTION 5: LIQUIDITY FILTER
    elements.append(Paragraph("5. CRITICAL LIQUIDITY FILTER", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("The Problem", h2_style))
    elements.append(Paragraph(
        "<b>Only ~25-30% of your value stock picks have tradeable options.</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("Most stocks in your Top 100 are:", body_style))
    elements.append(Paragraph("• Small/mid-cap (<$10B market cap) = No liquid options market", bullet_style))
    elements.append(Paragraph("• Low trading volume = Wide bid/ask spreads that kill returns", bullet_style))
    elements.append(Paragraph("• No 2-year LEAPs available", bullet_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("The Solution", h2_style))
    elements.append(Paragraph(
        "<b>Filter by market cap and options liquidity BEFORE trading.</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Three-Tier Filtering System", h2_style))

    elements.append(Paragraph("<b>Tier 1: Market Cap Pre-Screen</b>", h3_style))

    mcap_filter_data = [
        ['Market Cap', 'Options Liquidity', 'Strategy'],
        ['>$50B', 'Excellent', 'LEAPs preferred (tight spreads)'],
        ['$10-50B', 'Good', 'LEAPs or stocks (check OI)'],
        ['$5-10B', 'Mixed', 'Manual check (some have LEAPs)'],
        ['$2-5B', 'Poor', 'Buy stocks (LEAPs rare, illiquid)'],
        ['<$2B', 'None', 'Buy stocks (no options market)'],
    ]

    mcap_filter_table = Table(mcap_filter_data, colWidths=[1.3*inch, 2*inch, 3.2*inch])
    mcap_filter_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(mcap_filter_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("<b>Tier 2: Options Chain Verification</b>", h3_style))
    elements.append(Paragraph("Once you identify a stock, check the options chain:", body_style))
    elements.append(Paragraph("✅ 2-year expiration available? (Jan 2027 if trading in Oct 2025)", bullet_style))
    elements.append(Paragraph("✅ Multiple ITM strikes? (15-20% below current price)", bullet_style))
    elements.append(Paragraph("✅ Open Interest >50 on preferred strikes?", bullet_style))
    elements.append(Paragraph("✅ Recent trading volume >10 contracts/day?", bullet_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("If ANY checkbox fails → Buy stock instead of options", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("<b>Tier 3: Execution Quality Check</b>", h3_style))
    elements.append(Paragraph("Before buying/selling options, verify:", body_style))
    elements.append(Spacer(1, 0.05*inch))

    tier3_data = [
        ['Metric', 'Minimum', 'Ideal', 'Critical?'],
        ['Bid/Ask Spread', '<10%', '<5%', 'YES - Deal breaker'],
        ['Open Interest', '>50', '>100', 'YES - Deal breaker'],
        ['Daily Volume', '>10/day', '>50/day', 'NO - But preferred'],
        ['Strike OI', '>20', '>50', 'YES - For your specific strike'],
    ]

    tier3_table = Table(tier3_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 2.6*inch])
    tier3_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(tier3_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Spread Calculation Formula", h3_style))
    elements.append(Paragraph(
        "<b>Spread % = ((Ask - Bid) / Bid) × 100</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("<b>Examples:</b>", body_style))
    elements.append(Paragraph("• Bid=$35.55, Ask=$37.75 → Spread = ($37.75-$35.55)/$35.55 = 6.2% ✅", bullet_style))
    elements.append(Paragraph("• Bid=$3.20, Ask=$5.40 → Spread = ($5.40-$3.20)/$3.20 = 68.8% ❌", bullet_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>Why spreads matter:</b>", body_style))
    elements.append(Paragraph("• 6.2% spread = You lose $2.20 on $37.75 entry (acceptable cost)", bullet_style))
    elements.append(Paragraph("• 68.8% spread = You lose $2.20 on $5.40 entry (41% loss immediately!)", bullet_style))

    elements.append(PageBreak())

    # Real-World Liquidity Analysis
    elements.append(Paragraph("Real-World Liquidity Analysis: Top 10 US Stocks (Oct 2025)", h2_style))

    liquidity_data = [
        ['Rank', 'Ticker', 'MCap', 'Exp', 'OI', 'Spread', 'LEAP', 'Put'],
        ['#1', 'AMRZ', '$26.1B', '6mo ❌', '1,526', '69% ❌', '❌ REJECT', '❌ REJECT'],
        ['#2', 'FCNCA', '$21.9B', '7mo ❌', '1 ❌', '—', '❌ REJECT', '❌ REJECT'],
        ['#3', 'THC', '$16.8B', '15mo ✅', '58 ⚠️', '6.5% ✅', '⚠️ MARGINAL', '❌ REJECT'],
        ['#8', 'LULU', '$19.9B', '23mo ✅', '394 ✅', '6.2% ✅', '✅ EXCELLENT', '✅ EXCELLENT'],
        ['#10', 'PHM', '$23.7B', '23mo ✅', '31 ❌', '11.3% ❌', '❌ REJECT', '❌ REJECT'],
    ]

    liquidity_table = Table(liquidity_data, colWidths=[0.5*inch, 0.7*inch, 0.8*inch, 0.8*inch, 0.7*inch, 0.9*inch, 1.1*inch, 1*inch])
    liquidity_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 7),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(liquidity_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Key Finding:", h3_style))
    elements.append(Paragraph(
        "<b>LULU is the ONLY stock from your Top 10 that passes all liquidity criteria for both LEAP calls and put selling.</b>",
        body_style
    ))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Liquidity Filter Checklist", h2_style))
    elements.append(Paragraph("Before buying any LEAP or selling any put:", body_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("☐ Stock passed value screen (Intrinsic/Market >1.0)", bullet_style))
    elements.append(Paragraph("☐ Market cap >$10B (or manually verified liquidity)", bullet_style))
    elements.append(Paragraph("☐ 2-year LEAP available (or ~18-24 months minimum)", bullet_style))
    elements.append(Paragraph("☐ ITM strike exists (15-20% below price for calls)", bullet_style))
    elements.append(Paragraph("☐ OTM strike exists (10-20% below price for puts)", bullet_style))
    elements.append(Paragraph("☐ Open Interest >50 on selected strike (ideally >100)", bullet_style))
    elements.append(Paragraph("☐ Bid/Ask spread <10% (ideally <5%)", bullet_style))
    elements.append(Paragraph("☐ Premium reasonable (<30% of stock price for calls, >3% for puts)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph(
        "<b>If ANY box unchecked → Buy stock instead of options</b>",
        body_style
    ))

    elements.append(PageBreak())

    # SECTION 6: REAL BACKTEST EXAMPLES
    elements.append(Paragraph("6. REAL BACKTEST EXAMPLES", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Example 1: GFI (Gold Fields) - Best LEAP Return", h2_style))
    elements.append(Paragraph("From your actual backtest - Top annualized return", body_style))
    elements.append(Spacer(1, 0.1*inch))

    gfi_data = [
        ['Metric', 'Stock Purchase', 'LEAP Purchase'],
        ['Buy Date', '2024-01-02', '2024-01-02'],
        ['Stock Price', '$13.45', '$13.45'],
        ['Strike / Shares', '100 shares', '$11.50 call (15% ITM)'],
        ['Capital Invested', '$1,345', '$336 (premium)'],
        ['Sell Date', '2025-10-14 (651 days)', '2025-10-14 (651 days)'],
        ['Sell Price', '$42.16', '$42.16'],
        ['Profit', '$2,871', '$2,730'],
        ['ROI', '213.5%', '812%'],
        ['Annualized', '89.9%', '307%'],
    ]

    gfi_table = Table(gfi_data, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
    gfi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (2, 1), (2, -1), colors.HexColor('#e8f5e9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(gfi_table)
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Key Insight:</b>", body_style))
    elements.append(Paragraph("• LEAP invested $336 vs $1,345 stock = <b>75% less capital</b>", bullet_style))
    elements.append(Paragraph("• Freed $1,009 can buy <b>3 MORE LEAP positions</b> = 4x diversification", bullet_style))
    elements.append(Paragraph("• Similar profit ($2,730 vs $2,871)", bullet_style))
    elements.append(Paragraph("• <b>3.4x higher ROI</b> (812% vs 213.5%)", bullet_style))
    elements.append(Spacer(1, 0.2*inch))

    elements.append(Paragraph("Example 2: GBFH - Top Annualized Performer", h2_style))

    elements.append(Paragraph("• Buy Date: 2024-07-09", bullet_style))
    elements.append(Paragraph("• Buy Price: $16.90", bullet_style))
    elements.append(Paragraph("• Intrinsic Value: $84.30 (5.0x ratio)", bullet_style))
    elements.append(Paragraph("• Sell Date: 2025-10-14 (462 days)", bullet_style))
    elements.append(Paragraph("• Sell Price: $41.66", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>Stock Strategy:</b>", body_style))
    elements.append(Paragraph("• Investment: $1,690 (100 shares)", bullet_style))
    elements.append(Paragraph("• Profit: $2,476", bullet_style))
    elements.append(Paragraph("• ROI: 146.5% total (104% annualized)", bullet_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("<b>LEAP Strategy ($14 strike, 17% ITM):</b>", body_style))
    elements.append(Paragraph("• Premium: $422.50 (25% of stock price)", bullet_style))
    elements.append(Paragraph("• Profit at $41.66: $2,321 ($41.66 - $14 strike - $4.23 premium)", bullet_style))
    elements.append(Paragraph("• ROI: 549% total (391% annualized)", bullet_style))
    elements.append(Paragraph("• Capital Freed: $1,267.50 for other positions", bullet_style))

    elements.append(PageBreak())

    # SECTION 7: CAPITAL ALLOCATION
    elements.append(Paragraph("7. CAPITAL ALLOCATION FRAMEWORK", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("$500,000 Hedge Fund Portfolio Example", h2_style))

    allocation_data = [
        ['Tier', 'Strategy', 'Stocks', 'Capital', 'Expected Return'],
        ['Aggressive', 'Buy LEAPs', 'Top 1-15 picks', '$150,000', '150-200% (3x leverage)'],
        ['Income', 'Sell Puts', 'Top 20-50 picks', '$150,000', '25-35% annualized'],
        ['Opportunistic', 'Sell Wide OTM Puts', 'Top 50-100 picks', '$100,000', '15-20% annualized'],
        ['Reserve', 'Cash / Short-term', '—', '$100,000', 'For assignments/crashes'],
    ]

    allocation_table = Table(allocation_data, colWidths=[1.2*inch, 1.5*inch, 1.3*inch, 1*inch, 1.5*inch])
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
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(allocation_table)
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Expected Portfolio Returns", h2_style))

    elements.append(Paragraph("<b>LEAP Tier:</b>", body_style))
    elements.append(Paragraph("• $150k → $375k (150% gain) = $225k profit", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Put Selling (Income):</b>", body_style))
    elements.append(Paragraph("• $150k × 30% annualized = $45k income", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Opportunistic Puts:</b>", body_style))
    elements.append(Paragraph("• $100k × 18% = $18k income", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Total:</b> $288k profit on $500k = <b>57.6% return</b>", body_style))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("vs Traditional Stock-Only Portfolio", h2_style))

    elements.append(Paragraph("<b>Stock-Only Strategy:</b>", body_style))
    elements.append(Paragraph("• $500k × 21.4% (Top 15 backtest return) = $107k profit", bullet_style))
    elements.append(Spacer(1, 0.05*inch))

    elements.append(Paragraph("<b>Options Advantage:</b>", body_style))
    elements.append(Paragraph("• $288k vs $107k = <b>2.7x higher returns</b>", body_style))

    elements.append(PageBreak())

    # SECTION 8: QUICK REFERENCE
    elements.append(Paragraph("8. QUICK REFERENCE GUIDE", h1_style))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("LEAP Calls Quick Reference", h2_style))

    leap_ref_data = [
        ['Question', 'Answer'],
        ['Which stocks?', 'Top 1-20 picks (highest conviction)'],
        ['Which strike?', '15-20% In-The-Money (BELOW current price)'],
        ['Why ITM?', 'Less time decay, intrinsic value protection, high delta (0.70-0.80)'],
        ['Example', 'Stock at $50 → Buy $40 or $42.50 strike'],
        ['Premium cost?', '20-30% of stock price'],
        ['Time frame?', '~2 years (Jan 2027 if buying in Oct 2025)'],
        ['Max loss?', 'Premium paid (e.g., $3,665 per contract)'],
        ['Breakeven?', 'Strike + Premium (e.g., $165 + $36.65 = $201.65)'],
        ['OI required?', '>50 (ideally >100)'],
        ['Spread required?', '<10% (ideally <5%)'],
    ]

    leap_ref_table = Table(leap_ref_data, colWidths=[1.7*inch, 4.8*inch])
    leap_ref_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#e8f0f7')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(leap_ref_table)
    elements.append(Spacer(1, 0.2*inch))

    elements.append(Paragraph("Put Selling Quick Reference", h2_style))

    put_ref_data = [
        ['Question', 'Answer'],
        ['Which stocks?', 'Top 20-100 picks (quality stocks you\'d own cheaper)'],
        ['Which strike?', '10-20% Out-of-The-Money (BELOW current price)'],
        ['Why OTM?', 'High probability expires worthless (70-80%), margin of safety'],
        ['Example', 'Stock at $50 → Sell $42.50 or $40 put'],
        ['Premium collected?', '3-5% for 45-60 days / 10-15% for 2-year expiration'],
        ['Time frame?', '30-60 days (roll monthly) or 2-year (match LEAP)'],
        ['Max profit?', 'Premium collected (e.g., $2,040 per contract)'],
        ['Max loss?', 'Strike price - Premium (obligated to buy stock)'],
        ['If assigned?', 'Buy stock at effective price = Strike - Premium'],
        ['OI required?', '>50 (ideally >100)'],
        ['Spread required?', '<10% (ideally <5%)'],
    ]

    put_ref_table = Table(put_ref_data, colWidths=[1.7*inch, 4.8*inch])
    put_ref_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2c5aa0')),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#e8f0f7')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(put_ref_table)
    elements.append(Spacer(1, 0.2*inch))

    elements.append(Paragraph("Key Rules Summary", h2_style))

    elements.append(Paragraph("1. <b>LEAPs:</b> Buy ITM strikes (below current price) for safety", bullet_style))
    elements.append(Paragraph("2. <b>Puts:</b> Sell OTM strikes (below current price) for income", bullet_style))
    elements.append(Paragraph("3. <b>Both use same logic:</b> Strike price below current = margin of safety", bullet_style))
    elements.append(Paragraph("4. <b>Only trade stocks your value analysis confirmed as undervalued</b>", bullet_style))
    elements.append(Paragraph("5. <b>Size positions:</b> No single LEAP >5% capital, no single put >10%", bullet_style))
    elements.append(Paragraph("6. <b>Liquidity first:</b> OI >50 and spread <10% are REQUIRED", bullet_style))
    elements.append(Paragraph("7. <b>Exit losers:</b> Cut losing LEAPs at 50% loss", bullet_style))
    elements.append(Paragraph("8. <b>Cash reserve:</b> Keep 20% cash for opportunities/assignments", bullet_style))

    elements.append(Spacer(1, 0.5*inch))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )

    elements.append(Paragraph("—", footer_style))
    elements.append(Paragraph("<b>Document Version:</b> 2.0 | <b>Last Updated:</b> October 16, 2025", footer_style))
    elements.append(Paragraph("For questions or updates, refer to backtest results and filter implementation in value_analysis.py", footer_style))
    elements.append(Paragraph("<b>END OF DOCUMENT</b>", footer_style))

    # Build PDF
    doc.build(elements)

    print(f"✅ PDF created successfully: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_options_guide_pdf()
