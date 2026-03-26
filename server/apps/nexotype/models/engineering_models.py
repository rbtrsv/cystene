"""
Nexotype Models — Section 5: R&D Engineering

Version control for biological design: candidates, mutations, constructs.
"""

from __future__ import annotations
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 5. R&D ENGINEERING
# ==========================================

class Candidate(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Lead Series
    Purpose: Version control for biological design.
    Scope: Engineering.
    Usage: "Antibody v3.2".
    Type: NODE
    """
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_candidate_id: Mapped[int | None] = mapped_column(ForeignKey("candidates.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    version_number: Mapped[str] = mapped_column(String(20))


class DesignMutation(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Engineering Edit
    Purpose: Tracks specific changes made to a sequence.
    Scope: Engineering.
    Usage: "L234A" (Leucine to Alanine at 234).
    Type: NODE
    """
    __tablename__ = "design_mutations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    position: Mapped[int] = mapped_column(Integer)
    wild_type: Mapped[str] = mapped_column(String(10))
    mutant: Mapped[str] = mapped_column(String(10))


class Construct(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Expression Vector
    Purpose: The manufacturing blueprint.
    Scope: CMC / Lab.
    Usage: "Plasmid-505".
    Type: NODE
    """
    __tablename__ = "constructs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    plasmid_map_url: Mapped[str | None] = mapped_column(String(255))
