from fastapi import APIRouter, Depends

from .utils.dependency_utils import require_domain_access

# Import subrouters

# Shared (cross-cutting endpoints not tied to a specific domain)
from .subrouters.shared.permissions_subrouter import router as permissions_router

# Standardization
from .subrouters.standardization.ontology_term_subrouter import router as ontology_terms_router
from .subrouters.standardization.unit_of_measure_subrouter import router as units_of_measure_router
from .subrouters.standardization.external_reference_subrouter import router as external_references_router

# Omics Registry
from .subrouters.omics.organism_subrouter import router as organisms_router
from .subrouters.omics.gene_subrouter import router as genes_router
from .subrouters.omics.transcript_subrouter import router as transcripts_router
from .subrouters.omics.exon_subrouter import router as exons_router
from .subrouters.omics.protein_subrouter import router as proteins_router
from .subrouters.omics.protein_domain_subrouter import router as protein_domains_router
from .subrouters.omics.variant_subrouter import router as variants_router
from .subrouters.omics.peptide_fragment_subrouter import router as peptide_fragments_router

# Clinical & Phenotypic
from .subrouters.clinical.indication_subrouter import router as indications_router
from .subrouters.clinical.phenotype_subrouter import router as phenotypes_router
from .subrouters.clinical.biomarker_subrouter import router as biomarkers_router
from .subrouters.clinical.pathway_subrouter import router as pathways_router

# Asset Management
from .subrouters.asset.therapeutic_asset_subrouter import router as therapeutic_assets_router
from .subrouters.asset.small_molecule_subrouter import router as small_molecules_router
from .subrouters.asset.biologic_subrouter import router as biologics_router
from .subrouters.asset.therapeutic_peptide_subrouter import router as therapeutic_peptides_router
from .subrouters.asset.oligonucleotide_subrouter import router as oligonucleotides_router

# R&D Engineering
from .subrouters.engineering.candidate_subrouter import router as candidates_router
from .subrouters.engineering.design_mutation_subrouter import router as design_mutations_router
from .subrouters.engineering.construct_subrouter import router as constructs_router

# LIMS & Empirical Data
from .subrouters.lims.subject_subrouter import router as subjects_router
from .subrouters.lims.biospecimen_subrouter import router as biospecimens_router
from .subrouters.lims.assay_protocol_subrouter import router as assay_protocols_router
from .subrouters.lims.assay_run_subrouter import router as assay_runs_router
from .subrouters.lims.assay_readout_subrouter import router as assay_readouts_router

# User & Personalization
from .subrouters.user.user_profile_subrouter import router as user_profiles_router
from .subrouters.user.data_source_subrouter import router as data_sources_router
from .subrouters.user.genomic_file_subrouter import router as genomic_files_router
from .subrouters.user.user_variant_subrouter import router as user_variants_router
from .subrouters.user.user_biomarker_reading_subrouter import router as user_biomarker_readings_router
from .subrouters.user.user_treatment_log_subrouter import router as user_treatment_logs_router
from .subrouters.user.pathway_score_subrouter import router as pathway_scores_router
from .subrouters.user.recommendation_subrouter import router as recommendations_router

# Knowledge Graph
from .subrouters.knowledge_graph.drug_target_mechanism_subrouter import router as drug_target_mechanisms_router
from .subrouters.knowledge_graph.bioactivity_subrouter import router as bioactivities_router
from .subrouters.knowledge_graph.therapeutic_efficacy_subrouter import router as therapeutic_efficacies_router
from .subrouters.knowledge_graph.drug_interaction_subrouter import router as drug_interactions_router
from .subrouters.knowledge_graph.biomarker_association_subrouter import router as biomarker_associations_router
from .subrouters.knowledge_graph.genomic_association_subrouter import router as genomic_associations_router
from .subrouters.knowledge_graph.variant_phenotype_subrouter import router as variant_phenotypes_router
from .subrouters.knowledge_graph.pathway_membership_subrouter import router as pathway_memberships_router
from .subrouters.knowledge_graph.biological_relationship_subrouter import router as biological_relationships_router
from .subrouters.knowledge_graph.source_subrouter import router as sources_router
from .subrouters.knowledge_graph.evidence_assertion_subrouter import router as evidence_assertions_router
from .subrouters.knowledge_graph.context_attribute_subrouter import router as context_attributes_router

# Commercial Intelligence
from .subrouters.commercial.market_organization_subrouter import router as market_organizations_router
from .subrouters.commercial.patent_subrouter import router as patents_router
from .subrouters.commercial.patent_claim_subrouter import router as patent_claims_router
from .subrouters.commercial.patent_assignee_subrouter import router as patent_assignees_router
from .subrouters.commercial.asset_ownership_subrouter import router as asset_ownerships_router
from .subrouters.commercial.transaction_subrouter import router as transactions_router
from .subrouters.commercial.licensing_agreement_subrouter import router as licensing_agreements_router
from .subrouters.commercial.development_pipeline_subrouter import router as development_pipelines_router
from .subrouters.commercial.regulatory_approval_subrouter import router as regulatory_approvals_router
from .subrouters.commercial.technology_platform_subrouter import router as technology_platforms_router
from .subrouters.commercial.asset_technology_platform_subrouter import router as asset_technology_platforms_router
from .subrouters.commercial.organization_technology_platform_subrouter import router as organization_technology_platforms_router

# ==========================================
# MAIN NEXOTYPE ROUTER
# ==========================================

router = APIRouter(prefix="/nexotype")

# ==========================================
# Shared — no domain gate (tells frontend what the user CAN access)
# ==========================================

router.include_router(permissions_router, prefix="/permissions")

# ==========================================
# Standardization — Pro read+write (infrastructure/reference data curation)
# ==========================================

router.include_router(ontology_terms_router, prefix="/ontology-terms",
    dependencies=[Depends(require_domain_access("standardization"))])
router.include_router(units_of_measure_router, prefix="/units-of-measure",
    dependencies=[Depends(require_domain_access("standardization"))])
router.include_router(external_references_router, prefix="/external-references",
    dependencies=[Depends(require_domain_access("standardization"))])

# ==========================================
# Omics Registry — domain default Pro, Gene+Variant overridden to Personal read
# ==========================================

router.include_router(organisms_router, prefix="/organisms",
    dependencies=[Depends(require_domain_access("omics"))])
router.include_router(genes_router, prefix="/genes",
    dependencies=[Depends(require_domain_access("omics", entity="gene"))])
router.include_router(transcripts_router, prefix="/transcripts",
    dependencies=[Depends(require_domain_access("omics"))])
router.include_router(exons_router, prefix="/exons",
    dependencies=[Depends(require_domain_access("omics"))])
router.include_router(proteins_router, prefix="/proteins",
    dependencies=[Depends(require_domain_access("omics"))])
router.include_router(protein_domains_router, prefix="/protein-domains",
    dependencies=[Depends(require_domain_access("omics"))])
router.include_router(variants_router, prefix="/variants",
    dependencies=[Depends(require_domain_access("omics", entity="variant"))])
router.include_router(peptide_fragments_router, prefix="/peptide-fragments",
    dependencies=[Depends(require_domain_access("omics"))])

# ==========================================
# Clinical & Phenotypic — domain default Pro, Biomarker+Pathway overridden to Personal read
# ==========================================

router.include_router(indications_router, prefix="/indications",
    dependencies=[Depends(require_domain_access("clinical"))])
router.include_router(phenotypes_router, prefix="/phenotypes",
    dependencies=[Depends(require_domain_access("clinical"))])
router.include_router(biomarkers_router, prefix="/biomarkers",
    dependencies=[Depends(require_domain_access("clinical", entity="biomarker"))])
router.include_router(pathways_router, prefix="/pathways",
    dependencies=[Depends(require_domain_access("clinical", entity="pathway"))])

# ==========================================
# Asset Management — Personal read, Pro write
# ==========================================

router.include_router(therapeutic_assets_router, prefix="/therapeutic-assets",
    dependencies=[Depends(require_domain_access("asset"))])
router.include_router(small_molecules_router, prefix="/small-molecules",
    dependencies=[Depends(require_domain_access("asset"))])
router.include_router(biologics_router, prefix="/biologics",
    dependencies=[Depends(require_domain_access("asset"))])
router.include_router(therapeutic_peptides_router, prefix="/therapeutic-peptides",
    dependencies=[Depends(require_domain_access("asset"))])
router.include_router(oligonucleotides_router, prefix="/oligonucleotides",
    dependencies=[Depends(require_domain_access("asset"))])

# ==========================================
# R&D Engineering — Pro read+write (lab operations)
# ==========================================

router.include_router(candidates_router, prefix="/candidates",
    dependencies=[Depends(require_domain_access("engineering"))])
router.include_router(design_mutations_router, prefix="/design-mutations",
    dependencies=[Depends(require_domain_access("engineering"))])
router.include_router(constructs_router, prefix="/constructs",
    dependencies=[Depends(require_domain_access("engineering"))])

# ==========================================
# LIMS & Empirical Data — domain default Pro, Subject overridden to Personal read+write
# ==========================================

router.include_router(subjects_router, prefix="/subjects",
    dependencies=[Depends(require_domain_access("lims", entity="subject"))])
router.include_router(biospecimens_router, prefix="/biospecimens",
    dependencies=[Depends(require_domain_access("lims"))])
router.include_router(assay_protocols_router, prefix="/assay-protocols",
    dependencies=[Depends(require_domain_access("lims"))])
router.include_router(assay_runs_router, prefix="/assay-runs",
    dependencies=[Depends(require_domain_access("lims"))])
router.include_router(assay_readouts_router, prefix="/assay-readouts",
    dependencies=[Depends(require_domain_access("lims"))])

# ==========================================
# User & Personalization — Personal read+write (biohacker's own data)
# ==========================================

router.include_router(user_profiles_router, prefix="/user-profiles",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(data_sources_router, prefix="/data-sources",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(genomic_files_router, prefix="/genomic-files",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(user_variants_router, prefix="/user-variants",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(user_biomarker_readings_router, prefix="/user-biomarker-readings",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(user_treatment_logs_router, prefix="/user-treatment-logs",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(pathway_scores_router, prefix="/pathway-scores",
    dependencies=[Depends(require_domain_access("user"))])
router.include_router(recommendations_router, prefix="/recommendations",
    dependencies=[Depends(require_domain_access("user"))])

# ==========================================
# Knowledge Graph — domain default Pro, DrugInteraction+GenomicAssociation overridden to Personal read
# ==========================================

router.include_router(drug_target_mechanisms_router, prefix="/drug-target-mechanisms",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(bioactivities_router, prefix="/bioactivities",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(therapeutic_efficacies_router, prefix="/therapeutic-efficacies",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(drug_interactions_router, prefix="/drug-interactions",
    dependencies=[Depends(require_domain_access("knowledge_graph", entity="drug_interaction"))])
router.include_router(biomarker_associations_router, prefix="/biomarker-associations",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(genomic_associations_router, prefix="/genomic-associations",
    dependencies=[Depends(require_domain_access("knowledge_graph", entity="genomic_association"))])
router.include_router(variant_phenotypes_router, prefix="/variant-phenotypes",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(pathway_memberships_router, prefix="/pathway-memberships",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(biological_relationships_router, prefix="/biological-relationships",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(sources_router, prefix="/sources",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(evidence_assertions_router, prefix="/evidence-assertions",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])
router.include_router(context_attributes_router, prefix="/context-attributes",
    dependencies=[Depends(require_domain_access("knowledge_graph"))])

# ==========================================
# Commercial Intelligence — Enterprise read+write (patents, M&A, licensing, etc.)
# ==========================================

router.include_router(market_organizations_router, prefix="/market-organizations",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(patents_router, prefix="/patents",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(patent_claims_router, prefix="/patent-claims",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(patent_assignees_router, prefix="/patent-assignees",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(asset_ownerships_router, prefix="/asset-ownerships",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(transactions_router, prefix="/transactions",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(licensing_agreements_router, prefix="/licensing-agreements",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(development_pipelines_router, prefix="/development-pipelines",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(regulatory_approvals_router, prefix="/regulatory-approvals",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(technology_platforms_router, prefix="/technology-platforms",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(asset_technology_platforms_router, prefix="/asset-technology-platforms",
    dependencies=[Depends(require_domain_access("commercial"))])
router.include_router(organization_technology_platforms_router, prefix="/organization-technology-platforms",
    dependencies=[Depends(require_domain_access("commercial"))])
