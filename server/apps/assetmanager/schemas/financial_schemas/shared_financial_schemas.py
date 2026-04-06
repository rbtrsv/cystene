"""
Shared Financial Schemas

Reusable enum types and shared schemas for financial models (income statements,
balance sheets, cash flow statements, financial metrics, KPI values).

These enums validate constrained string fields per schema-guidelines.md.
DB stores plain strings — Pydantic validates against enum values.
"""

from enum import Enum


class Scenario(str, Enum):
    """Scenario type options"""
    ACTUAL = "actual"
    FORECAST = "forecast"
    BUDGET = "budget"


class Quarter(str, Enum):
    """Fiscal quarter options"""
    Q1 = "Q1"
    Q2 = "Q2"
    Q3 = "Q3"
    Q4 = "Q4"


class Semester(str, Enum):
    """Fiscal semester options"""
    H1 = "H1"
    H2 = "H2"


class Month(str, Enum):
    """Month options"""
    JANUARY = "January"
    FEBRUARY = "February"
    MARCH = "March"
    APRIL = "April"
    MAY = "May"
    JUNE = "June"
    JULY = "July"
    AUGUST = "August"
    SEPTEMBER = "September"
    OCTOBER = "October"
    NOVEMBER = "November"
    DECEMBER = "December"
