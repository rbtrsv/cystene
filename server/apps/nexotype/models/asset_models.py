"""
Nexotype Models — Section 4: Asset Management (Polymorphic)

Therapeutic assets and their modality subtypes.
"""

from __future__ import annotations
from sqlalchemy import Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 4. ASSET MANAGEMENT (Polymorphic)
# ==========================================
# NOTE: "Technology" has two dimensions in biotech/pharma:
#
# 1. MODALITY (what form the drug takes) — handled by asset_type discriminator:
#   - TherapeuticAsset + modality models (Domain 4) → what it is and how it works
#   - Candidate / DesignMutation / Construct (Domain 5) → how it's engineered
#   - DevelopmentPipeline (Domain 10) → how mature it is (regulatory phase per indication)
#   - Patent / PatentClaim (Domain 10) → how it's protected
#   Pharma modalities require deep characterization (sequences, formulations, mechanisms)
#   rather than flat categorization, making a single Technology table a lossy abstraction.
#
# 2. PLATFORM TECHNOLOGY (the methodology used to create it) — handled by TechnologyPlatform (Domain 10):
#   - TechnologyPlatform → "mRNA", "CRISPR", "CAR-T", "AI Drug Discovery"
#   - AssetTechnologyPlatform → links assets to platforms (many-to-many)
#   - OrganizationTechnologyPlatform → links companies to platforms (many-to-many)
#   An AI-designed mRNA drug has modality "oligonucleotide" but platforms "AI" + "mRNA".

class TherapeuticAsset(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Pipeline Candidate
    Purpose: Global wrapper for any intervention (Drug, Peptide, Biologic).
    Scope: Inventory & R&D.
    Usage: "CTX-001", "Rapamycin".
    Type: NODE
    """
    __tablename__ = "therapeutic_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    uid: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    asset_type: Mapped[str] = mapped_column(String(50))  # Discriminator

    __mapper_args__ = {
        "polymorphic_identity": "asset",
        "polymorphic_on": "asset_type",
    }


class SmallMolecule(TherapeuticAsset):
    """
    Professional Term: NME (New Molecular Entity)
    Purpose: Chemical agents.
    Scope: Pharma & Geroprotectors.
    Usage: "Rapamycin", "Metformin".
    Type: NODE
    """
    __tablename__ = "small_molecules"

    id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"), primary_key=True)
    smiles: Mapped[str] = mapped_column(Text)  # Chemical structure
    inchi_key: Mapped[str | None] = mapped_column(String(27), index=True)

    __mapper_args__ = {"polymorphic_identity": "small_molecule"}


class Biologic(TherapeuticAsset):
    """
    Professional Term: Large Molecule
    Purpose: Biological agents.
    Scope: Pharma.
    Usage: "Adalimumab" (Antibody).
    Type: NODE
    """
    __tablename__ = "biologics"

    id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"), primary_key=True)
    sequence_aa: Mapped[str] = mapped_column(Text)
    biologic_type: Mapped[str] = mapped_column(String(50))  # "Antibody", "Enzyme"

    __mapper_args__ = {"polymorphic_identity": "biologic"}


class TherapeuticPeptide(TherapeuticAsset):
    """
    Professional Term: Synthetic Peptide
    Purpose: Manufactured peptide product.
    Scope: Biohacking / Longevity.
    Usage: "BPC-157", "Epitalon".
    Type: NODE
    """
    __tablename__ = "therapeutic_peptides"

    id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"), primary_key=True)
    sequence_aa: Mapped[str] = mapped_column(Text)
    purity_grade: Mapped[str | None] = mapped_column(String(20))  # "99.8%"

    __mapper_args__ = {"polymorphic_identity": "therapeutic_peptide"}


class Oligonucleotide(TherapeuticAsset):
    """
    Professional Term: ASO / Gene Therapy
    Purpose: Nucleic acid therapeutics.
    Scope: Advanced Therapies.
    Usage: "mRNA Vaccine", "siRNA".
    Type: NODE
    """
    __tablename__ = "oligonucleotides"

    id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"), primary_key=True)
    sequence_na: Mapped[str] = mapped_column(Text)  # Nucleotide sequence
    modification_type: Mapped[str | None] = mapped_column(String(50))

    __mapper_args__ = {"polymorphic_identity": "oligonucleotide"}
