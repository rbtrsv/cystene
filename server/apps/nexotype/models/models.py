"""
Nexotype Models - Graph Structure in PostgreSQL

1. NODEs are things
   - Peptides (BPC-157, TB-500), Phenotypes (Tissue Healing), Pathways (VEGF)
   - Standalone entities stored in their own tables

2. RELATIONs are connections
   - DrugInteraction, TherapeuticEfficacy, BioActivity
   - Junction tables that link NODEs together using ForeignKeys

3. Edge types come from field values
   - interaction_type field stores "Synergy" or "Contraindication"
   - direction field stores "Increases" or "Decreases"
   - These are columns on RELATION tables, not separate tables

4. Graph queries = SQL JOINs
   - To find "what synergizes with BPC-157?" → JOIN drug_interactions with therapeutic_assets
   - No graph database needed

5. Example: BPC-157 + TB-500 combo
   - BPC-157 and TB-500 linked via DrugInteraction (interaction_type = 'Synergy')
   - Each peptide links to phenotypes via TherapeuticEfficacy (BPC-157 → Tissue Healing +60%)
   - Each peptide links to pathways via BioActivity (BPC-157 activates VEGF)
"""

from __future__ import annotations
from datetime import datetime, date
from typing import List
from sqlalchemy import Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Float, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
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


# ==========================================
# 2. OMICS REGISTRY
# ==========================================

class Organism(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Taxonomy
    Purpose: Defines the biological system context.
    Scope: Reference Biology.
    Usage: "Homo sapiens" (ID: 9606).
    Type: NODE
    """
    __tablename__ = "organisms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ncbi_taxonomy_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    scientific_name: Mapped[str] = mapped_column(String(100))
    common_name: Mapped[str] = mapped_column(String(100))


class Gene(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Genomic Locus
    Purpose: Master record for a gene.
    Scope: Reference Biology.
    Usage: "TP53" (Tumor Protein 53).
    Type: NODE
    """
    __tablename__ = "genes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organism_id: Mapped[int] = mapped_column(ForeignKey("organisms.id"))
    hgnc_symbol: Mapped[str] = mapped_column(String(50), index=True)
    ensembl_gene_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    chromosome: Mapped[str] = mapped_column(String(10))

    # Relationships
    transcripts: Mapped[List["Transcript"]] = relationship(back_populates="gene")
    variants: Mapped[List["Variant"]] = relationship(back_populates="gene")


class Transcript(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Isoform
    Purpose: Represents specific mRNA splice variants.
    Scope: Reference Biology.
    Usage: "NM_000546" (p53 isoform).
    Type: NODE
    """
    __tablename__ = "transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    gene_id: Mapped[int] = mapped_column(ForeignKey("genes.id"))
    ensembl_transcript_id: Mapped[str] = mapped_column(String(50), unique=True)
    is_canonical: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    gene: Mapped["Gene"] = relationship(back_populates="transcripts")
    protein: Mapped["Protein"] = relationship(back_populates="transcript", uselist=False)
    exons: Mapped[List["Exon"]] = relationship(back_populates="transcript")


class Exon(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Coding Region
    Purpose: Discrete nucleotide sequences within a transcript.
    Scope: Reference Biology & Gene Editing.
    Usage: Targets for CRISPR guides.
    Type: NODE
    """
    __tablename__ = "exons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    transcript_id: Mapped[int] = mapped_column(ForeignKey("transcripts.id"))
    ensembl_exon_id: Mapped[str] = mapped_column(String(50))
    start_position: Mapped[int] = mapped_column(Integer)
    end_position: Mapped[int] = mapped_column(Integer)

    # Relationships
    transcript: Mapped["Transcript"] = relationship(back_populates="exons")


class Protein(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Proteoform
    Purpose: The functional translated machine.
    Scope: Reference Biology. Primary Drug Target.
    Usage: "P04637" (Cellular tumor antigen p53).
    Type: NODE
    """
    __tablename__ = "proteins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    transcript_id: Mapped[int] = mapped_column(ForeignKey("transcripts.id"), unique=True)
    uniprot_accession: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    sequence_aa: Mapped[str] = mapped_column(Text)

    # Relationships
    transcript: Mapped["Transcript"] = relationship(back_populates="protein")
    domains: Mapped[List["ProteinDomain"]] = relationship(back_populates="protein")
    fragments: Mapped[List["PeptideFragment"]] = relationship(back_populates="protein")


class ProteinDomain(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Structural Motif
    Purpose: Functional region within a protein.
    Scope: Drug Discovery (Binding pockets).
    Usage: "Kinase Domain", "SH2 Domain".
    Type: NODE
    """
    __tablename__ = "protein_domains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protein_id: Mapped[int] = mapped_column(ForeignKey("proteins.id"))
    pfam_id: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(100))

    # Relationships
    protein: Mapped["Protein"] = relationship(back_populates="domains")


class Variant(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Genotype / SNV
    Purpose: Natural genetic variation record.
    Scope: Pharmacogenomics & Personalized Medicine.
    Usage: "rs429358" (APOE e4).
    Type: NODE
    """
    __tablename__ = "variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    gene_id: Mapped[int] = mapped_column(ForeignKey("genes.id"))
    db_snp_id: Mapped[str] = mapped_column(String(20), index=True)  # rsID

    # Split Notation
    hgvs_c: Mapped[str | None] = mapped_column(String(50))  # DNA change (c.123A>G)
    hgvs_p: Mapped[str | None] = mapped_column(String(50))  # Protein change (p.Arg123Cys)

    # Relationships
    gene: Mapped["Gene"] = relationship(back_populates="variants")


class PeptideFragment(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Tryptic Peptide
    Purpose: Digested protein marker.
    Scope: Proteomics / Mass Spectrometry. Identification Only.
    Usage: "LVVVLAGR" (Fragment found in Mass Spec).
    Type: NODE
    """
    __tablename__ = "peptide_fragments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protein_id: Mapped[int] = mapped_column(ForeignKey("proteins.id"))
    sequence: Mapped[str] = mapped_column(String(255))

    # Relationships
    protein: Mapped["Protein"] = relationship(back_populates="fragments")


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


# ==========================================
# 6. LIMS & EMPIRICAL DATA
# ==========================================

class Subject(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Donor / Model
    Purpose: The Biological Identity (Patient or Animal).
    Scope: Clinical & Pre-clinical.
    Usage: "Patient 10425" or "Mouse 55".
    Type: NODE
    """
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_identifier: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    organism_id: Mapped[int] = mapped_column(ForeignKey("organisms.id"))
    cohort_name: Mapped[str | None] = mapped_column(String(100))
    sex: Mapped[str | None] = mapped_column(String(10))

    # Relationships
    biospecimens: Mapped[List["Biospecimen"]] = relationship(back_populates="subject")


class Biospecimen(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Aliquot / Sample
    Purpose: Physical biological material custody.
    Scope: LIMS.
    Usage: "Blood Tube - Freezer B".
    Type: NODE
    """
    __tablename__ = "biospecimens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    barcode: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    sample_type: Mapped[str] = mapped_column(String(50))  # "Plasma", "Tissue"
    freezer_location: Mapped[str | None] = mapped_column(String(100))

    # Relationships
    subject: Mapped["Subject"] = relationship(back_populates="biospecimens")


class AssayProtocol(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: SOP
    Purpose: Version-controlled experimental recipe.
    Scope: LIMS / Quality Control.
    Usage: "Horvath Clock v2.0".
    Type: NODE
    """
    __tablename__ = "assay_protocols"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    version: Mapped[str] = mapped_column(String(20))
    method_description: Mapped[str | None] = mapped_column(Text)


class AssayRun(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Batch
    Purpose: The execution event of an experiment.
    Scope: LIMS.
    Usage: "Run 2024-05-12 by Operator X".
    Type: NODE
    """
    __tablename__ = "assay_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protocol_id: Mapped[int] = mapped_column(ForeignKey("assay_protocols.id"))
    run_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    operator_id: Mapped[int | None] = mapped_column(Integer)  # ID of user running it


class AssayReadout(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Raw Data Point
    Purpose: The quantitative result.
    Scope: LIMS Source of Truth.
    Usage: "IC50 = 5.4 nM".
    Type: RELATION
    Connects: AssayRun + Biospecimen + Asset
    """
    __tablename__ = "assay_readouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("assay_runs.id"))
    biospecimen_id: Mapped[int | None] = mapped_column(ForeignKey("biospecimens.id"))

    # Polymorphic target (Candidate or Asset)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("therapeutic_assets.id"))

    raw_value: Mapped[float] = mapped_column(Float)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units_of_measure.id"))


# ==========================================
# 7. USER BRIDGE
# ==========================================

class UserProfile(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Biological Context
    Purpose: Links the external 'accounts.User' to the internal 'nexotype.Subject'.
    Scope: SaaS Integration.
    Usage: Connecting a Login to their DNA/Lab data.
    Type: RELATION
    Connects: User → Subject
    """
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Loose coupling to external Accounts app (not a FK to avoid cross-app dependency)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), unique=True)

    # Relationships
    subject: Mapped["Subject"] = relationship()


# ==========================================
# 8. PERSONALIZATION & SAAS
# ==========================================

class DataSource(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Integration Source
    Purpose: Origin tracker for user data.
    Scope: SaaS.
    Usage: "Oura Ring", "LabCorp", "Manual Entry".
    Type: NODE
    """
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    source_type: Mapped[str] = mapped_column(String(50))  # "Wearable", "Lab", "Genetic"


class GenomicFile(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Raw Data
    Purpose: Reference to uploaded genetic files.
    Scope: SaaS Ingestion.
    Usage: "23andMe_raw_v5.txt".
    Type: NODE
    """
    __tablename__ = "genomic_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    file_url: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50))  # "Processing", "Completed"


class UserVariant(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Detected Genotype
    Purpose: Specific instance of a Variant found in a User.
    Scope: Personalization.
    Usage: "User X has Variant Y".
    Type: RELATION
    Connects: Subject → Variant
    """
    __tablename__ = "user_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"))
    zygosity: Mapped[str] = mapped_column(String(20))  # "Heterozygous"

    __table_args__ = (
        UniqueConstraint("subject_id", "variant_id", name="uq_user_variant"),
    )


class UserBiomarkerReading(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Time-Series Data
    Purpose: Longitudinal history of a biomarker.
    Scope: SaaS / Dashboard.
    Usage: "NAD+ = 45 on Jan 15".
    Type: RELATION
    Connects: Subject → Biomarker
    """
    __tablename__ = "user_biomarker_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    biomarker_id: Mapped[int] = mapped_column(ForeignKey("biomarkers.id"))
    source_id: Mapped[int] = mapped_column(ForeignKey("data_sources.id"))

    value: Mapped[float] = mapped_column(Float)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units_of_measure.id"))
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class UserTreatmentLog(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Adherence Log
    Purpose: Intervention history.
    Scope: SaaS / Dashboard.
    Usage: "Took NMN 500mg".
    Type: RELATION
    Connects: Subject → Asset
    """
    __tablename__ = "user_treatment_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))

    dosage: Mapped[str] = mapped_column(String(100))  # "500 mg"
    started_at: Mapped[date] = mapped_column(Date)
    ended_at: Mapped[date | None] = mapped_column(Date)


class PathwayScore(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Polygenic Score / Health Score
    Purpose: Algorithm output for a system.
    Scope: Dashboard.
    Usage: "mTOR Health: 45/100".
    Type: RELATION
    Connects: Subject → Pathway
    """
    __tablename__ = "pathway_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    pathway_id: Mapped[int] = mapped_column(ForeignKey("pathways.id"))
    score: Mapped[float] = mapped_column(Float)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Recommendation(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Action Plan
    Purpose: Final output of the Graph Engine.
    Scope: SaaS Dashboard.
    Usage: "Take NMN (Priority High)".
    Type: RELATION
    Connects: UserProfile → Asset
    """
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))

    reason: Mapped[str] = mapped_column(Text)  # "Due to NMNAT1 variant"
    priority: Mapped[str] = mapped_column(String(20))  # "High", "Medium"


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


# ==========================================
# 10. COMMERCIAL INTELLIGENCE (IP & Deals)
# ==========================================

class MarketOrganization(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Issuer / Entity
    Purpose: Represents a player in the biotech market (Companies, Universities).
    Scope: Commercial Intelligence. Distinct from SaaS 'Organization' tenants.
    Usage: "Pfizer", "Harvard University".
    Type: NODE
    """
    __tablename__ = "market_organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    legal_name: Mapped[str] = mapped_column(String(255), index=True)

    # Financial Identifiers
    isin: Mapped[str | None] = mapped_column(String(12), unique=True, index=True)  # Global ID
    ticker_symbol: Mapped[str | None] = mapped_column(String(20), index=True)  # "PFE"
    primary_exchange: Mapped[str | None] = mapped_column(String(50))  # "NASDAQ"

    org_type: Mapped[str] = mapped_column(String(50))  # "Public", "Private", "University"
    status: Mapped[str] = mapped_column(String(50), default="Active")  # "Active", "Inactive", "Acquired", "Bankrupt"

    # Operational Data
    founded: Mapped[date | None] = mapped_column(Date)
    headquarters: Mapped[str | None] = mapped_column(String(255))
    website: Mapped[str | None] = mapped_column(String(500))
    employee_count: Mapped[int | None] = mapped_column(Integer)
    revenue_usd: Mapped[float | None] = mapped_column(Float)


class Patent(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: IP Instrument
    Purpose: Legal protection document.
    Scope: Commercial.
    Usage: "US Patent 11,234,567".
    Type: NODE
    """
    __tablename__ = "patents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    jurisdiction: Mapped[str] = mapped_column(String(10))  # "US", "WO", "EP", "CN", "JP"
    patent_number: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="Pending")  # "Pending", "Granted", "Expired", "Abandoned"
    filing_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)

    __table_args__ = (
        UniqueConstraint("jurisdiction", "patent_number", name="uq_patent_jurisdiction_number"),
    )


class PatentClaim(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Coverage Map
    Purpose: Links IP to Assets.
    Scope: Commercial.
    Usage: "Patent X covers Composition of Drug Y".
    Type: RELATION
    Connects: Patent → Asset
    """
    __tablename__ = "patent_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patent_id: Mapped[int] = mapped_column(ForeignKey("patents.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    claim_type: Mapped[str] = mapped_column(String(50))  # "Composition", "Method"

    __table_args__ = (
        UniqueConstraint("patent_id", "asset_id", "claim_type", name="uq_patent_claim"),
    )


class PatentAssignee(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Rights Holder
    Purpose: Multiple organizations can co-own a patent.
    Scope: Commercial.
    Usage: "Pfizer and BioNTech co-own COVID vaccine patent".
    Type: RELATION
    Connects: Patent → Organization
    """
    __tablename__ = "patent_assignees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patent_id: Mapped[int] = mapped_column(ForeignKey("patents.id"))
    organization_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    assignment_date: Mapped[date] = mapped_column(Date)

    # Include assignment_date for ownership history tracking
    __table_args__ = (
        UniqueConstraint("patent_id", "organization_id", "assignment_date", name="uq_patent_assignee"),
    )


class AssetOwnership(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Rights Holder
    Purpose: Tracks current owner of an asset.
    Scope: Commercial.
    Usage: "Pfizer owns Rapamycin (Originator)".
    Type: RELATION
    Connects: Organization → Asset
    """
    __tablename__ = "asset_ownerships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    ownership_type: Mapped[str] = mapped_column(String(50))  # "Originator", "Licensee"

    __table_args__ = (
        UniqueConstraint("organization_id", "asset_id", "ownership_type", name="uq_asset_ownership"),
    )


class Transaction(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Deal / M&A
    Purpose: Commercial events.
    Scope: Commercial Intelligence.
    Usage: "Pfizer acquired Seagen for $43B", "Pfizer licensed Drug X from BioNTech".
    Type: RELATION
    Connects: Organization → Organization (optionally via Asset or Patent)
    """
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    seller_id: Mapped[int | None] = mapped_column(ForeignKey("market_organizations.id"))

    # What was transacted (optional, for asset/patent-specific deals)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("therapeutic_assets.id"))
    patent_id: Mapped[int | None] = mapped_column(ForeignKey("patents.id"))

    transaction_type: Mapped[str] = mapped_column(String(50))  # "Acquisition", "Licensing", "Divestiture"
    value_usd: Mapped[float | None] = mapped_column(Float)
    announced_date: Mapped[date] = mapped_column(Date)


class LicensingAgreement(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Commercial Partnership
    Purpose: Ongoing contractual relationships between organizations.
    Scope: Commercial Intelligence.
    Usage: "BioNTech licenses mRNA technology to Pfizer for COVID vaccine, 2020-2030".
    Type: RELATION
    Connects: Organization → Organization (optionally via Asset or Patent)
    """
    __tablename__ = "licensing_agreements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    licensor_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    licensee_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))

    # What is being licensed (optional)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("therapeutic_assets.id"))
    patent_id: Mapped[int | None] = mapped_column(ForeignKey("patents.id"))

    agreement_type: Mapped[str] = mapped_column(String(50))  # "License", "Co-Development", "Distribution", "CMO", "CRADA"
    territory: Mapped[str | None] = mapped_column(String(100))  # "Global", "US", "EU", "Asia-Pacific"
    value_usd: Mapped[float | None] = mapped_column(Float)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50))  # "Active", "Expired", "Terminated"


class DevelopmentPipeline(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Clinical Status
    Purpose: Tracks asset progress per disease.
    Scope: Commercial Valuation.
    Usage: "Drug X is Phase III for Alzheimer's".
    Type: RELATION
    Connects: Asset → Indication
    """
    __tablename__ = "development_pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    indication_id: Mapped[int] = mapped_column(ForeignKey("indications.id"))

    phase: Mapped[str] = mapped_column(String(50))  # "Phase I", "Phase II", "Phase III"
    status: Mapped[str] = mapped_column(String(50))  # "Active", "Terminated"
    nct_number: Mapped[str | None] = mapped_column(String(20))  # ClinicalTrials.gov ID

    __table_args__ = (
        UniqueConstraint("asset_id", "indication_id", name="uq_development_pipeline"),
    )


class RegulatoryApproval(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Marketing Authorization
    Purpose: Records regulatory approval events for assets.
    Scope: Commercial Intelligence.
    Usage: "Rapamycin received FDA NDA approval for Alzheimer's on 2024-01-15".
    Type: RELATION
    Connects: Asset → Indication (via Agency)
    """
    __tablename__ = "regulatory_approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    indication_id: Mapped[int] = mapped_column(ForeignKey("indications.id"))

    agency: Mapped[str] = mapped_column(String(50))  # "FDA", "EMA", "PMDA", "NMPA", "TGA"
    approval_type: Mapped[str] = mapped_column(String(50))  # "NDA", "BLA", "510(k)", "Accelerated", "Conditional"
    approval_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50))  # "Approved", "Withdrawn", "Tentative"

    __table_args__ = (
        UniqueConstraint("asset_id", "indication_id", "agency", name="uq_regulatory_approval"),
    )


class TechnologyPlatform(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Platform Technology
    Purpose: Strategic categorization of drug development methodologies.
    Scope: Commercial Intelligence.
    Usage: "mRNA", "CRISPR/Cas9", "CAR-T", "ADC", "AI Drug Discovery".
    Type: NODE
    Why: Investors ask "which companies are doing CRISPR?" and "how mature is mRNA?"
         This is distinct from asset_type (modality = what form the drug takes) —
         TechnologyPlatform = the methodology used to create it.
         An AI-designed mRNA drug belongs to both "AI Drug Discovery" and "mRNA" platforms.
    """
    __tablename__ = "technology_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100))  # "Gene Editing", "Cell Therapy", "Nucleic Acid Therapeutics", "Computational", "Drug Delivery"
    readiness_level: Mapped[int | None] = mapped_column(Integer)  # Technology Readiness Level (TRL 1-9)
    description: Mapped[str | None] = mapped_column(Text)


class AssetTechnologyPlatform(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Platform Utilization
    Purpose: Links therapeutic assets to the platform technologies used to create them.
    Scope: Commercial Intelligence.
    Usage: "mRNA-1273 was built on mRNA (Primary) and Lipid Nanoparticle Delivery (Enabling)".
    Type: RELATION
    Connects: Asset → TechnologyPlatform (many-to-many)
    Why: An asset can use multiple platforms. Answers "which drugs use CRISPR?"
         and "what platforms were used to develop this drug?"
    """
    __tablename__ = "asset_technology_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    technology_platform_id: Mapped[int] = mapped_column(ForeignKey("technology_platforms.id"))
    role: Mapped[str] = mapped_column(String(50))  # "Primary", "Secondary", "Enabling"

    __table_args__ = (
        UniqueConstraint("asset_id", "technology_platform_id", name="uq_asset_technology_platform"),
    )


class OrganizationTechnologyPlatform(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Technology Capability
    Purpose: Links market organizations to the platform technologies they utilize.
    Scope: Commercial Intelligence.
    Usage: "Moderna utilizes mRNA (Core) and AI Drug Discovery (Research)".
    Type: RELATION
    Connects: Organization → TechnologyPlatform (many-to-many)
    Why: A company can work with multiple platforms. Answers "which companies are doing CRISPR?"
         and "what is Moderna's technology stack?"
    """
    __tablename__ = "organization_technology_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    technology_platform_id: Mapped[int] = mapped_column(ForeignKey("technology_platforms.id"))
    utilization_type: Mapped[str] = mapped_column(String(50))  # "Core", "Licensed", "Research"

    __table_args__ = (
        UniqueConstraint("organization_id", "technology_platform_id", name="uq_org_technology_platform"),
    )
