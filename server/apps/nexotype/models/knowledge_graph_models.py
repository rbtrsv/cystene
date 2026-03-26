"""
Nexotype Models — Section 9: Knowledge Graph

Drug-target mechanisms, bioactivities, therapeutic efficacies, drug interactions,
biomarker associations, genomic associations, variant phenotypes, pathway memberships,
biological relationships, sources, evidence assertions, context attributes.
"""

from __future__ import annotations
from datetime import date
from sqlalchemy import Integer, String, ForeignKey, Text, Float, Date, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 9. KNOWLEDGE GRAPH
# ==========================================

class DrugTargetMechanism(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: DTI (Drug-Target Interaction)
    Purpose: Defines Mechanism of Action.
    Scope: Pharmacology.
    Usage: "Rapamycin Inhibits mTOR".
    Type: RELATION
    Connects: Asset → Protein
    """
    __tablename__ = "drug_target_mechanisms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    protein_id: Mapped[int] = mapped_column(ForeignKey("proteins.id"))

    mechanism: Mapped[str] = mapped_column(String(50))  # "Inhibitor", "Agonist"
    affinity_value: Mapped[float | None] = mapped_column(Float)  # Kd/Ki

    __table_args__ = (
        UniqueConstraint("asset_id", "protein_id", name="uq_drug_target_mechanism"),
    )


class BioActivity(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Pharmacodynamics
    Purpose: Functional effect on a system.
    Scope: Pharmacology.
    Usage: "Activates AMPK Pathway".
    Type: RELATION
    Connects: Asset → Pathway
    """
    __tablename__ = "bio_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    pathway_id: Mapped[int] = mapped_column(ForeignKey("pathways.id"))
    activity_type: Mapped[str] = mapped_column(String(100))  # "Activator", "Senolytic"

    __table_args__ = (
        UniqueConstraint("asset_id", "pathway_id", name="uq_bio_activity"),
    )


class TherapeuticEfficacy(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Intervention Vector
    Purpose: Causal impact on Outcome (Disease or Trait).
    Scope: Clinical & Longevity Logic.
    Usage: "Increases NAD+", "Treats Diabetes".
    Type: RELATION
    Connects: Asset → Indication | Phenotype | Biomarker
    """
    __tablename__ = "therapeutic_efficacies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))

    # Explicit nullable FKs (exactly one should be set)
    indication_id: Mapped[int | None] = mapped_column(ForeignKey("indications.id"))
    phenotype_id: Mapped[int | None] = mapped_column(ForeignKey("phenotypes.id"))
    biomarker_id: Mapped[int | None] = mapped_column(ForeignKey("biomarkers.id"))

    direction: Mapped[str] = mapped_column(String(20))  # "Increases", "Decreases", "Ameliorates"
    magnitude: Mapped[str | None] = mapped_column(String(50))  # "+50%"

    # Ensures exactly one target FK is set
    __table_args__ = (
        CheckConstraint(
            "(CASE WHEN indication_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN phenotype_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN biomarker_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_therapeutic_efficacy_one_target"
        ),
    )


class DrugInteraction(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Synergy / DDI
    Purpose: Interaction between two assets.
    Scope: Safety & Stacking.
    Usage: "Rapamycin + Metformin = Synergy".
    Type: RELATION
    Connects: Asset ↔ Asset
    """
    __tablename__ = "drug_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_a_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    asset_b_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    interaction_type: Mapped[str] = mapped_column(String(50))  # "Synergy", "Contraindication"

    # Canonical ordering: always store smaller ID first
    __table_args__ = (
        UniqueConstraint("asset_a_id", "asset_b_id", name="uq_drug_interaction_pair"),
        CheckConstraint("asset_a_id < asset_b_id", name="ck_drug_interaction_order"),
    )


class BiomarkerAssociation(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Diagnostic Indicator
    Purpose: Interpretation of lab data.
    Scope: Diagnostics.
    Usage: "High CRP indicates Inflammation".
    Type: RELATION
    Connects: Biomarker → Indication | Phenotype
    """
    __tablename__ = "biomarker_associations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    biomarker_id: Mapped[int] = mapped_column(ForeignKey("biomarkers.id"))

    # Explicit nullable FKs (exactly one should be set)
    indication_id: Mapped[int | None] = mapped_column(ForeignKey("indications.id"))
    phenotype_id: Mapped[int | None] = mapped_column(ForeignKey("phenotypes.id"))

    correlation: Mapped[str] = mapped_column(String(50))  # "Positive", "Negative"

    # Ensures exactly one target FK is set
    __table_args__ = (
        CheckConstraint(
            "(CASE WHEN indication_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN phenotype_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_biomarker_association_one_target"
        ),
    )


class GenomicAssociation(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: GWAS Risk
    Purpose: Genetic risk factors for disease.
    Scope: Pharmacogenomics.
    Usage: "APOE4 increases Alzheimer's risk".
    Type: RELATION
    Connects: Variant → Indication
    """
    __tablename__ = "genomic_associations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"))
    indication_id: Mapped[int] = mapped_column(ForeignKey("indications.id"))
    odds_ratio: Mapped[float | None] = mapped_column(Float)

    __table_args__ = (
        UniqueConstraint("variant_id", "indication_id", name="uq_genomic_association"),
    )


class VariantPhenotype(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Trait Association
    Purpose: Genetic impact on traits (Enhancement).
    Scope: Personalization.
    Usage: "ACTN3 causes Fast-Twitch Muscle".
    Type: RELATION
    Connects: Variant → Phenotype
    """
    __tablename__ = "variant_phenotypes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"))
    phenotype_id: Mapped[int] = mapped_column(ForeignKey("phenotypes.id"))
    effect_size: Mapped[str | None] = mapped_column(String(50))

    __table_args__ = (
        UniqueConstraint("variant_id", "phenotype_id", name="uq_variant_phenotype"),
    )


class PathwayMembership(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Participation
    Purpose: Defining system composition.
    Scope: Systems Biology.
    Usage: "mTOR participates in Autophagy Pathway".
    Type: RELATION
    Connects: Protein → Pathway
    """
    __tablename__ = "pathway_memberships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protein_id: Mapped[int] = mapped_column(ForeignKey("proteins.id"))
    pathway_id: Mapped[int] = mapped_column(ForeignKey("pathways.id"))
    role: Mapped[str | None] = mapped_column(String(100))

    __table_args__ = (
        UniqueConstraint("protein_id", "pathway_id", name="uq_pathway_membership"),
    )


class BiologicalRelationship(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Interactome
    Purpose: Natural protein-protein interactions.
    Scope: Basic Science.
    Usage: "mTOR interacts with Raptor".
    Type: RELATION
    Connects: Protein ↔ Protein
    """
    __tablename__ = "biological_relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protein_a_id: Mapped[int] = mapped_column(ForeignKey("proteins.id"))
    protein_b_id: Mapped[int] = mapped_column(ForeignKey("proteins.id"))
    interaction_type: Mapped[str] = mapped_column(String(50))

    # Canonical ordering: always store smaller ID first
    __table_args__ = (
        UniqueConstraint("protein_a_id", "protein_b_id", name="uq_biological_relationship_pair"),
        CheckConstraint("protein_a_id < protein_b_id", name="ck_biological_relationship_order"),
    )


class Source(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Bibliography / Citation
    Purpose: Metadata for external evidence (Papers, Patents, Trials).
    Scope: Provenance.
    Usage: "Nature, 2024, Smith et al."
    Type: NODE
    """
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Type of Source
    source_type: Mapped[str] = mapped_column(String(50))  # "PubMed", "Patent", "ClinicalTrial"

    # The External ID (The Link)
    external_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)  # "PMID:345678", "US112233"

    # The Human Data (Display)
    title: Mapped[str | None] = mapped_column(Text)
    authors: Mapped[str | None] = mapped_column(Text)
    journal: Mapped[str | None] = mapped_column(String(255))
    publication_date: Mapped[date | None] = mapped_column(Date)
    url: Mapped[str | None] = mapped_column(String(500))


class EvidenceAssertion(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Provenance / Reference
    Purpose: The AI Layer. Links relationships to Source entries.
    Scope: Logic Validation.
    Usage: "PubMed ID 12345 supports this link".
    Type: RELATION
    Connects: Any Relation → Source
    """
    __tablename__ = "evidence_assertions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Polymorphic Link to any relationship table above
    relationship_table: Mapped[str] = mapped_column(String(50))
    relationship_id: Mapped[int] = mapped_column(Integer)

    # FK to Source table instead of string
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    confidence_score: Mapped[float] = mapped_column(Float)  # 0.0 - 1.0

    __table_args__ = (
        Index("ix_evidence_relationship", "relationship_table", "relationship_id"),
        UniqueConstraint("relationship_table", "relationship_id", "source_id", name="uq_evidence_dedup"),
    )


class ContextAttribute(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Conditions
    Purpose: Adds nuance/context to evidence.
    Scope: Logic.
    Usage: "Dose: 5mg", "Species: Mouse".
    Type: NODE
    """
    __tablename__ = "context_attributes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence_assertions.id"))
    key: Mapped[str] = mapped_column(String(50))
    value: Mapped[str] = mapped_column(String(255))
