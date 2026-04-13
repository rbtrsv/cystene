"""
Export Utilities

Shared PDF and CSV generation for Cystene export endpoints.
Each subrouter defines its own ExportColumn list and calls generate_csv() or generate_pdf().

PDF uses ReportLab — pure Python, zero system dependencies.
CSV uses Python's built-in csv module.

Usage in a subrouter:
    from ..utils.export_utils import ExportColumn, SummaryCard, generate_csv, generate_pdf

    columns = [
        ExportColumn(key="severity", label="Severity"),
        ExportColumn(key="title", label="Title"),
        ExportColumn(key="host", label="Host"),
    ]

    return generate_pdf(
        rows=data_as_dicts,
        columns=columns,
        title="Findings",
        subtitle="Security Vulnerabilities — All Severities",
        summary_cards=[SummaryCard(label="Total Findings", value="42")],
    )
"""

import csv
import io
from dataclasses import dataclass
from typing import Callable, Any
from datetime import datetime

from fastapi.responses import StreamingResponse

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


# ==========================================
# Data Classes
# ==========================================

@dataclass
class ExportColumn:
    """Defines a column for export (both PDF and CSV)."""
    key: str                                        # dict key to extract from row
    label: str                                      # column header label
    align: str = "LEFT"                             # PDF alignment: "LEFT", "RIGHT", "CENTER"
    formatter: Callable[[Any], str] | None = None   # optional value formatter


@dataclass
class SummaryCard:
    """A key-value pair displayed in the PDF header area."""
    label: str
    value: str


@dataclass
class ReportSection:
    """A section in a multi-section report PDF."""
    title: str                                      # section heading
    rows: list[dict]                                # data rows
    columns: list[ExportColumn]                     # column definitions
    summary_cards: list[SummaryCard] | None = None  # optional summary cards above table


# ==========================================
# Branding Colors (Cystene — green accent + zinc base)
# Why green-600: #3AFF00 (neon green from website) is too bright on white paper.
# #16a34a is the closest readable green that matches the Cystene brand.
# ==========================================

# Table header
COLOR_HEADER_BG = colors.HexColor('#16a34a')        # green-600
COLOR_HEADER_TEXT = colors.white

# Alternating row backgrounds
COLOR_ROW_EVEN = colors.white
COLOR_ROW_ODD = colors.HexColor('#f0fdf4')           # green-50

# Grid lines
COLOR_GRID = colors.HexColor('#d4d4d8')              # zinc-300

# Text
COLOR_TEXT = colors.HexColor('#18181b')               # zinc-900
COLOR_TEXT_MUTED = colors.HexColor('#71717a')         # zinc-500

# Summary card
COLOR_SUMMARY_BG = colors.HexColor('#f4f4f5')        # zinc-100


# ==========================================
# ReportLab Styles
# ==========================================

STYLE_TITLE = ParagraphStyle(
    'ExportTitle',
    fontSize=18,
    textColor=COLOR_TEXT,
    spaceAfter=12,
    fontName='Helvetica-Bold',
)

STYLE_SUBTITLE = ParagraphStyle(
    'ExportSubtitle',
    fontSize=10,
    textColor=COLOR_TEXT_MUTED,
    spaceAfter=16,
    fontName='Helvetica',
)

STYLE_FOOTER = ParagraphStyle(
    'ExportFooter',
    fontSize=7,
    textColor=COLOR_TEXT_MUTED,
    alignment=TA_CENTER,
    fontName='Helvetica',
)

STYLE_SECTION = ParagraphStyle(
    'ExportSection',
    fontSize=13,
    textColor=COLOR_TEXT,
    spaceAfter=8,
    spaceBefore=20,
    fontName='Helvetica-Bold',
)


# ==========================================
# CSV Generation
# ==========================================

def generate_csv(
    rows: list[dict],
    columns: list[ExportColumn],
    title: str,
) -> StreamingResponse:
    """
    Generate a CSV file from rows and column definitions.

    Returns a StreamingResponse with Content-Disposition header for download.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([col.label for col in columns])

    # Data rows
    for row in rows:
        csv_row = []
        for col in columns:
            value = row.get(col.key, "")
            if col.formatter and value is not None:
                value = col.formatter(value)
            csv_row.append(value)
        writer.writerow(csv_row)

    output.seek(0)
    filename = _sanitize_filename(title) + ".csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ==========================================
# PDF Generation
# ==========================================

def generate_pdf(
    rows: list[dict],
    columns: list[ExportColumn],
    title: str,
    subtitle: str | None = None,
    summary_cards: list[SummaryCard] | None = None,
) -> StreamingResponse:
    """
    Generate a PDF file from rows and column definitions using ReportLab.

    Layout:
    - Title + subtitle
    - Optional summary cards (key-value pairs in a grid)
    - Data table with header, alternating rows, grid lines
    - Footer with generation date

    Returns a StreamingResponse with Content-Disposition header for download.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    elements = []

    # -- Title --
    elements.append(Paragraph(title, STYLE_TITLE))

    # -- Subtitle --
    if subtitle:
        elements.append(Paragraph(subtitle, STYLE_SUBTITLE))
    else:
        elements.append(Spacer(1, 12))

    # -- Summary Cards --
    if summary_cards:
        elements.extend(_build_summary_cards(summary_cards))
        elements.append(Spacer(1, 16))

    # -- Data Table --
    if rows and columns:
        elements.extend(_build_data_table(rows, columns))

    # -- Footer --
    elements.append(Spacer(1, 24))
    generated_at = datetime.now().strftime("%B %d, %Y at %H:%M")
    elements.append(Paragraph(f"Generated by Cystene on {generated_at}", STYLE_FOOTER))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    filename = _sanitize_filename(title) + ".pdf"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ==========================================
# Multi-Section Report PDF
# ==========================================

def generate_report_pdf(
    title: str,
    subtitle: str | None = None,
    sections: list[ReportSection] | None = None,
) -> StreamingResponse:
    """
    Generate a multi-section report PDF.

    Each section has its own heading, optional summary cards, and data table.
    Used for Report export (Summary + Findings + Assets).

    Returns a StreamingResponse with Content-Disposition header for download.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    elements = []

    # -- Title --
    elements.append(Paragraph(title, STYLE_TITLE))

    # -- Subtitle --
    if subtitle:
        elements.append(Paragraph(subtitle, STYLE_SUBTITLE))
    else:
        elements.append(Spacer(1, 12))

    # -- Sections --
    if sections:
        for section in sections:
            # Section heading
            elements.append(Paragraph(section.title, STYLE_SECTION))

            # Optional summary cards
            if section.summary_cards:
                elements.extend(_build_summary_cards(section.summary_cards))
                elements.append(Spacer(1, 12))

            # Data table
            if section.rows and section.columns:
                elements.extend(_build_data_table(section.rows, section.columns))
            elif not section.rows:
                # Empty state
                no_data_style = ParagraphStyle(
                    'NoData', fontSize=9, textColor=COLOR_TEXT_MUTED,
                    fontName='Helvetica-Oblique',
                )
                elements.append(Paragraph("No data available", no_data_style))

            elements.append(Spacer(1, 8))

    # -- Footer --
    elements.append(Spacer(1, 24))
    generated_at = datetime.now().strftime("%B %d, %Y at %H:%M")
    elements.append(Paragraph(f"Generated by Cystene on {generated_at}", STYLE_FOOTER))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    filename = _sanitize_filename(title) + ".pdf"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ==========================================
# Internal Helpers
# ==========================================

def _build_summary_cards(cards: list[SummaryCard]) -> list:
    """Build a row of summary cards as a ReportLab Table."""
    elements = []

    # Arrange cards in rows (max 4 per row)
    max_per_row = 4
    for i in range(0, len(cards), max_per_row):
        chunk = cards[i:i + max_per_row]

        header_row = [card.label for card in chunk]
        value_row = [card.value for card in chunk]
        table_data = [header_row, value_row]

        # Distribute width evenly
        available_width = 7.0 * inch
        col_width = available_width / len(chunk)
        col_widths = [col_width] * len(chunk)

        summary_table = Table(table_data, colWidths=col_widths)
        summary_table.setStyle(TableStyle([
            # Background
            ('BACKGROUND', (0, 0), (-1, -1), COLOR_SUMMARY_BG),
            # Label row — muted
            ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_TEXT_MUTED),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            # Value row — bold
            ('TEXTCOLOR', (0, 1), (-1, 1), COLOR_TEXT),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            # Layout
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            # Border
            ('BOX', (0, 0), (-1, -1), 1, COLOR_GRID),
            ('INNERGRID', (0, 0), (-1, -1), 1, colors.white),
        ]))
        elements.append(summary_table)

    return elements


def _build_data_table(rows: list[dict], columns: list[ExportColumn]) -> list:
    """Build the main data table as a ReportLab Table."""
    elements = []

    # Alignment map for Paragraph styles
    align_to_reportlab = {"LEFT": TA_LEFT, "RIGHT": TA_RIGHT, "CENTER": TA_CENTER}

    # Create per-column Paragraph styles for word wrap
    header_style = ParagraphStyle(
        'CellHeader', fontSize=8, fontName='Helvetica-Bold',
        textColor=COLOR_HEADER_TEXT, leading=10,
    )
    cell_styles = {}
    for col in columns:
        cell_styles[col.key] = ParagraphStyle(
            f'Cell_{col.key}', fontSize=8, fontName='Helvetica',
            textColor=COLOR_TEXT, leading=10,
            alignment=align_to_reportlab.get(col.align, TA_LEFT),
        )

    # Header row — Paragraph objects for word wrap
    header_row = [Paragraph(col.label, header_style) for col in columns]

    # Data rows — Paragraph objects for word wrap
    data_rows = []
    for row in rows:
        data_row = []
        for col in columns:
            value = row.get(col.key, "")
            if col.formatter and value is not None:
                value = col.formatter(value)
            elif value is None:
                value = "—"
            else:
                value = str(value)
            data_row.append(Paragraph(value, cell_styles[col.key]))
        data_rows.append(data_row)

    table_data = [header_row] + data_rows

    # Column widths — proportional to content length
    col_widths = _calculate_col_widths(table_data, columns)

    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    # Table style — font/color/alignment handled by Paragraph objects inside cells
    style_commands = [
        # Header row — green background
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_HEADER_BG),
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_GRID),
        # Padding
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]

    # Alternating row backgrounds
    for row_idx in range(1, len(table_data)):
        bg_color = COLOR_ROW_EVEN if row_idx % 2 == 1 else COLOR_ROW_ODD
        style_commands.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg_color))

    table.setStyle(TableStyle(style_commands))
    elements.append(table)

    return elements


def _calculate_col_widths(
    table_data: list[list],
    columns: list[ExportColumn],
) -> list[float]:
    """
    Calculate column widths proportionally based on max content length.
    Handles both string and Paragraph cell values.
    Ensures no column is too narrow or too wide.
    """
    available_width = 7.0 * inch
    num_cols = len(columns)
    if num_cols == 0:
        return []

    # Find max content length per column (header + data)
    max_lengths = []
    for col_idx in range(num_cols):
        max_len = 0
        for row in table_data:
            if col_idx < len(row):
                cell = row[col_idx]
                # Extract text from Paragraph objects
                if isinstance(cell, Paragraph):
                    cell_len = len(cell.text)
                else:
                    cell_len = len(str(cell))
                max_len = max(max_len, cell_len)
        max_lengths.append(max(max_len, 5))  # minimum 5 chars

    # Distribute width proportionally
    total_length = sum(max_lengths)
    col_widths = [(length / total_length) * available_width for length in max_lengths]

    # Enforce minimum width per column
    min_width = 0.6 * inch
    for i in range(len(col_widths)):
        if col_widths[i] < min_width:
            col_widths[i] = min_width

    return col_widths


def _sanitize_filename(title: str) -> str:
    """Convert a title to a safe filename."""
    safe = title.lower().replace(" ", "-")
    safe = "".join(c for c in safe if c.isalnum() or c in "-_")
    return safe or "export"
