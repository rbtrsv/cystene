"""
Nexotype Models — Section 3: Clinical & Phenotypic

Disease targets, observable traits, biomarkers, biological pathways.
"""

from __future__ import annotations
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 3. CLINICAL & PHENOTYPIC
# ==========================================

class Indication(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Pathology
    Purpose: Disease target.
    Scope: Clinical.
    Usage: "Alzheimer's Disease" (ICD-10).
    Type: NODE
    """
    __tablename__ = "indications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    icd_10_code: Mapped[str | None] = mapped_column(String(20))
    meddra_id: Mapped[str | None] = mapped_column(String(20))


class Phenotype(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Trait / Feature
    Purpose: Observable metric or characteristic.
    Scope: Enhancement & Longevity.
    Usage: "Grip Strength", "VO2 Max".
    Type: NODE
    """
    __tablename__ = "phenotypes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    hpo_id: Mapped[str | None] = mapped_column(String(20))  # Human Phenotype Ontology


class Biomarker(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Surrogate Endpoint
    Purpose: Proxy indicator for health.
    Scope: Diagnostics & Longevity.
    Usage: "NAD+ Levels", "HbA1c".
    Type: NODE
    """
    __tablename__ = "biomarkers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    loinc_code: Mapped[str | None] = mapped_column(String(20))


class Pathway(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Biological Network
    Purpose: Groups proteins/genes by system.
    Scope: Systems Biology & Longevity Algorithm.
    Usage: "mTOR Signaling Pathway".
    Type: NODE
    """
    __tablename__ = "pathways"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    kegg_id: Mapped[str | None] = mapped_column(String(20))

    # Static pathway importance ranking for recommendation prioritization
    longevity_tier: Mapped[str | None] = mapped_column(String(5))  # "S", "A", "B", "C"
