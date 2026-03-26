"""
Nexotype Models — Section 1: Standardization

Controlled vocabularies, units, and cross-references.
"""

from __future__ import annotations
from sqlalchemy import Integer, String, Text, Float, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 1. STANDARDIZATION
# ==========================================

class OntologyTerm(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Controlled Vocabulary
    Purpose: Master dictionary for standardized terms (GO, HPO, CHEBI).
    Scope: System-wide.
    Usage: "GO:0005515" for Protein Binding.
    Type: NODE
    """
    __tablename__ = "ontology_terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(50))  # "GO", "HPO", "ICD-10"
    accession: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    definition: Mapped[str | None] = mapped_column(Text)


class UnitOfMeasure(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: UOM
    Purpose: Ensures dimensional consistency in lab data.
    Scope: LIMS and Clinical.
    Usage: "nM", "mg/kg", "IU/mL".
    Type: NODE
    """
    __tablename__ = "units_of_measure"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    si_conversion_factor: Mapped[float | None] = mapped_column(Float)  # Multiplier to base SI unit


class ExternalReference(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: XRef / Alias
    Purpose: Maps internal entities to external databases.
    Scope: Interoperability.
    Usage: Linking a Protein to PDB:4F5S.
    Type: RELATION
    Connects: Any Entity → External DB
    """
    __tablename__ = "external_references"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50))  # "protein", "gene", "asset"
    entity_id: Mapped[int] = mapped_column(Integer)  # Polymorphic ID
    source: Mapped[str] = mapped_column(String(50))  # "PDB", "ClinVar"
    external_id: Mapped[str] = mapped_column(String(100))

    __table_args__ = (
        Index("ix_external_ref_entity", "entity_type", "entity_id"),
        UniqueConstraint("entity_type", "entity_id", "source", "external_id", name="uq_external_reference"),
    )
