"""
Nexotype Models — Section 2: Omics Registry

Reference biology: organisms, genes, transcripts, exons, proteins, domains, variants, peptide fragments.
"""

from __future__ import annotations
from typing import List
from sqlalchemy import Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


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
