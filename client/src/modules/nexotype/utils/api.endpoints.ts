/**
 * API endpoints for Nexotype module
 *
 * All endpoints under /nexotype prefix
 */

/**
 * Base API URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:8000';

/**
 * API endpoints for permissions
 * Backend: /server/apps/nexotype/subrouters/shared/permissions_subrouter.py
 */
export const PERMISSIONS_ENDPOINTS = {
  GET: `${API_BASE_URL}/nexotype/permissions/`,
};

/**
 * API endpoints for ontology terms
 * Backend: /server/apps/nexotype/subrouters/ontology_term_subrouter.py
 */
export const ONTOLOGY_TERM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/ontology-terms/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/ontology-terms/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/ontology-terms/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/ontology-terms/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/ontology-terms/${id}`,
};

/**
 * API endpoints for units of measure
 * Backend: /server/apps/nexotype/subrouters/standardization/unit_of_measure_subrouter.py
 */
export const UNIT_OF_MEASURE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/units-of-measure/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/units-of-measure/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/units-of-measure/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/units-of-measure/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/units-of-measure/${id}`,
};

/**
 * API endpoints for external references
 * Backend: /server/apps/nexotype/subrouters/standardization/external_reference_subrouter.py
 */
export const EXTERNAL_REFERENCE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/external-references/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/external-references/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/external-references/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/external-references/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/external-references/${id}`,
};

/**
 * API endpoints for market organizations
 * Backend: /server/apps/nexotype/subrouters/market_organization_subrouter.py
 */
export const MARKET_ORGANIZATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/market-organizations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/market-organizations/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/market-organizations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/market-organizations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/market-organizations/${id}`,
};

/**
 * API endpoints for therapeutic assets
 * Backend: /server/apps/nexotype/subrouters/therapeutic_asset_subrouter.py
 */
export const THERAPEUTIC_ASSET_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/therapeutic-assets/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-assets/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/therapeutic-assets/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-assets/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-assets/${id}`,
};

/**
 * API endpoints for indications
 * Backend: /server/apps/nexotype/subrouters/indication_subrouter.py
 */
export const INDICATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/indications/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/indications/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/indications/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/indications/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/indications/${id}`,
};

/**
 * API endpoints for patents
 * Backend: /server/apps/nexotype/subrouters/patent_subrouter.py
 */
export const PATENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/patents/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/patents/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/patents/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/patents/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/patents/${id}`,
};

/**
 * API endpoints for pathways
 * Backend: /server/apps/nexotype/subrouters/pathway_subrouter.py
 */
export const PATHWAY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/pathways/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/pathways/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/pathways/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/pathways/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/pathways/${id}`,
};

/**
 * API endpoints for phenotypes
 * Backend: /server/apps/nexotype/subrouters/phenotype_subrouter.py
 */
export const PHENOTYPE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/phenotypes/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/phenotypes/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/phenotypes/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/phenotypes/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/phenotypes/${id}`,
};

/**
 * API endpoints for biomarkers
 * Backend: /server/apps/nexotype/subrouters/biomarker_subrouter.py
 */
export const BIOMARKER_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/biomarkers/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/biomarkers/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/biomarkers/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/biomarkers/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/biomarkers/${id}`,
};

/**
 * API endpoints for organisms
 * Backend: /server/apps/nexotype/subrouters/organism_subrouter.py
 */
export const ORGANISM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/organisms/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/organisms/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/organisms/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/organisms/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/organisms/${id}`,
};

/**
 * API endpoints for genes
 * Backend: /server/apps/nexotype/subrouters/gene_subrouter.py
 */
export const GENE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/genes/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/genes/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/genes/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/genes/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/genes/${id}`,
};

/**
 * API endpoints for transcripts
 * Backend: /server/apps/nexotype/subrouters/transcript_subrouter.py
 */
export const TRANSCRIPT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/transcripts/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/transcripts/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/transcripts/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/transcripts/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/transcripts/${id}`,
};

/**
 * API endpoints for proteins
 * Backend: /server/apps/nexotype/subrouters/protein_subrouter.py
 */
export const PROTEIN_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/proteins/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/proteins/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/proteins/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/proteins/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/proteins/${id}`,
};

/**
 * API endpoints for exons
 * Backend: /server/apps/nexotype/subrouters/exon_subrouter.py
 */
export const EXON_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/exons/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/exons/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/exons/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/exons/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/exons/${id}`,
};

/**
 * API endpoints for protein domains
 * Backend: /server/apps/nexotype/subrouters/protein_domain_subrouter.py
 */
export const PROTEIN_DOMAIN_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/protein-domains/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/protein-domains/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/protein-domains/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/protein-domains/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/protein-domains/${id}`,
};

/**
 * API endpoints for variants
 * Backend: /server/apps/nexotype/subrouters/variant_subrouter.py
 */
export const VARIANT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/variants/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/variants/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/variants/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/variants/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/variants/${id}`,
};

/**
 * API endpoints for peptide fragments
 * Backend: /server/apps/nexotype/subrouters/peptide_fragment_subrouter.py
 */
export const PEPTIDE_FRAGMENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/peptide-fragments/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/peptide-fragments/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/peptide-fragments/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/peptide-fragments/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/peptide-fragments/${id}`,
};

/**
 * API endpoints for small molecules
 * Backend: /server/apps/nexotype/subrouters/small_molecule_subrouter.py
 */
export const SMALL_MOLECULE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/small-molecules/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/small-molecules/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/small-molecules/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/small-molecules/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/small-molecules/${id}`,
};

/**
 * API endpoints for biologics
 * Backend: /server/apps/nexotype/subrouters/asset/biologic_subrouter.py
 */
export const BIOLOGIC_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/biologics/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/biologics/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/biologics/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/biologics/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/biologics/${id}`,
};

/**
 * API endpoints for therapeutic peptides
 * Backend: /server/apps/nexotype/subrouters/asset/therapeutic_peptide_subrouter.py
 */
export const THERAPEUTIC_PEPTIDE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/therapeutic-peptides/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-peptides/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/therapeutic-peptides/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-peptides/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-peptides/${id}`,
};

/**
 * API endpoints for oligonucleotides
 * Backend: /server/apps/nexotype/subrouters/asset/oligonucleotide_subrouter.py
 */
export const OLIGONUCLEOTIDE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/oligonucleotides/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/oligonucleotides/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/oligonucleotides/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/oligonucleotides/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/oligonucleotides/${id}`,
};

/**
 * API endpoints for candidates
 * Backend: /server/apps/nexotype/subrouters/engineering/candidate_subrouter.py
 */
export const CANDIDATE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/candidates/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/candidates/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/candidates/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/candidates/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/candidates/${id}`,
};

/**
 * API endpoints for constructs
 * Backend: /server/apps/nexotype/subrouters/engineering/construct_subrouter.py
 */
export const CONSTRUCT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/constructs/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/constructs/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/constructs/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/constructs/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/constructs/${id}`,
};

/**
 * API endpoints for design mutations
 * Backend: /server/apps/nexotype/subrouters/engineering/design_mutation_subrouter.py
 */
export const DESIGN_MUTATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/design-mutations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/design-mutations/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/design-mutations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/design-mutations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/design-mutations/${id}`,
};

/**
 * API endpoints for subjects
 * Backend: /server/apps/nexotype/subrouters/lims/subject_subrouter.py
 */
export const SUBJECT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/subjects/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/subjects/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/subjects/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/subjects/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/subjects/${id}`,
};

/**
 * API endpoints for biospecimens
 * Backend: /server/apps/nexotype/subrouters/lims/biospecimen_subrouter.py
 */
export const BIOSPECIMEN_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/biospecimens/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/biospecimens/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/biospecimens/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/biospecimens/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/biospecimens/${id}`,
};

/**
 * API endpoints for assay protocols
 * Backend: /server/apps/nexotype/subrouters/lims/assay_protocol_subrouter.py
 */
export const ASSAY_PROTOCOL_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/assay-protocols/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/assay-protocols/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/assay-protocols/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/assay-protocols/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/assay-protocols/${id}`,
};

/**
 * API endpoints for assay runs
 * Backend: /server/apps/nexotype/subrouters/lims/assay_run_subrouter.py
 */
export const ASSAY_RUN_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/assay-runs/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/assay-runs/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/assay-runs/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/assay-runs/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/assay-runs/${id}`,
};

/**
 * API endpoints for assay readouts
 * Backend: /server/apps/nexotype/subrouters/lims/assay_readout_subrouter.py
 */
export const ASSAY_READOUT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/assay-readouts/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/assay-readouts/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/assay-readouts/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/assay-readouts/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/assay-readouts/${id}`,
};

/**
 * API endpoints for user profiles
 * Backend: /server/apps/nexotype/subrouters/user/user_profile_subrouter.py
 */
export const USER_PROFILE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/user-profiles/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/user-profiles/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/user-profiles/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/user-profiles/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/user-profiles/${id}`,
};

/**
 * API endpoints for data sources
 * Backend: /server/apps/nexotype/subrouters/user/data_source_subrouter.py
 */
export const DATA_SOURCE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/data-sources/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/data-sources/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/data-sources/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/data-sources/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/data-sources/${id}`,
};

/**
 * API endpoints for genomic files
 * Backend: /server/apps/nexotype/subrouters/user/genomic_file_subrouter.py
 */
export const GENOMIC_FILE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/genomic-files/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/genomic-files/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/genomic-files/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/genomic-files/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/genomic-files/${id}`,
};

/**
 * API endpoints for user variants
 * Backend: /server/apps/nexotype/subrouters/user/user_variant_subrouter.py
 */
export const USER_VARIANT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/user-variants/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/user-variants/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/user-variants/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/user-variants/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/user-variants/${id}`,
};

/**
 * API endpoints for user biomarker readings
 * Backend: /server/apps/nexotype/subrouters/user/user_biomarker_reading_subrouter.py
 */
export const USER_BIOMARKER_READING_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/user-biomarker-readings/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/user-biomarker-readings/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/user-biomarker-readings/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/user-biomarker-readings/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/user-biomarker-readings/${id}`,
};

/**
 * API endpoints for user treatment logs
 * Backend: /server/apps/nexotype/subrouters/user/user_treatment_log_subrouter.py
 */
export const USER_TREATMENT_LOG_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/user-treatment-logs/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/user-treatment-logs/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/user-treatment-logs/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/user-treatment-logs/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/user-treatment-logs/${id}`,
};

/**
 * API endpoints for pathway scores
 * Backend: /server/apps/nexotype/subrouters/user/pathway_score_subrouter.py
 */
export const PATHWAY_SCORE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/pathway-scores/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/pathway-scores/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/pathway-scores/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/pathway-scores/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/pathway-scores/${id}`,
};

/**
 * API endpoints for recommendations
 * Backend: /server/apps/nexotype/subrouters/user/recommendation_subrouter.py
 */
export const RECOMMENDATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/recommendations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/recommendations/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/recommendations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/recommendations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/recommendations/${id}`,
};

/**
 * API endpoints for pathway memberships
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/pathway_membership_subrouter.py
 */
export const PATHWAY_MEMBERSHIP_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/pathway-memberships/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/pathway-memberships/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/pathway-memberships/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/pathway-memberships/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/pathway-memberships/${id}`,
};

/**
 * API endpoints for biological relationships
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/biological_relationship_subrouter.py
 */
export const BIOLOGICAL_RELATIONSHIP_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/biological-relationships/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/biological-relationships/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/biological-relationships/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/biological-relationships/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/biological-relationships/${id}`,
};

/**
 * API endpoints for sources
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/source_subrouter.py
 */
export const SOURCE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/sources/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/sources/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/sources/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/sources/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/sources/${id}`,
};

/**
 * API endpoints for evidence assertions
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/evidence_assertion_subrouter.py
 */
export const EVIDENCE_ASSERTION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/evidence-assertions/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/evidence-assertions/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/evidence-assertions/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/evidence-assertions/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/evidence-assertions/${id}`,
};

/**
 * API endpoints for context attributes
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/context_attribute_subrouter.py
 */
export const CONTEXT_ATTRIBUTE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/context-attributes/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/context-attributes/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/context-attributes/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/context-attributes/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/context-attributes/${id}`,
};

/**
 * API endpoints for drug target mechanisms
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/drug_target_mechanism_subrouter.py
 */
export const DRUG_TARGET_MECHANISM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/drug-target-mechanisms/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/drug-target-mechanisms/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/drug-target-mechanisms/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/drug-target-mechanisms/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/drug-target-mechanisms/${id}`,
};

/**
 * API endpoints for bioactivities
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/bioactivity_subrouter.py
 */
export const BIOACTIVITY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/bioactivities/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/bioactivities/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/bioactivities/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/bioactivities/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/bioactivities/${id}`,
};

/**
 * API endpoints for therapeutic efficacies
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/therapeutic_efficacy_subrouter.py
 */
export const THERAPEUTIC_EFFICACY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/therapeutic-efficacies/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-efficacies/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/therapeutic-efficacies/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-efficacies/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/therapeutic-efficacies/${id}`,
};

/**
 * API endpoints for drug interactions
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/drug_interaction_subrouter.py
 */
export const DRUG_INTERACTION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/drug-interactions/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/drug-interactions/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/drug-interactions/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/drug-interactions/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/drug-interactions/${id}`,
};

/**
 * API endpoints for biomarker associations
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/biomarker_association_subrouter.py
 */
export const BIOMARKER_ASSOCIATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/biomarker-associations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/biomarker-associations/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/biomarker-associations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/biomarker-associations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/biomarker-associations/${id}`,
};

/**
 * API endpoints for genomic associations
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/genomic_association_subrouter.py
 */
export const GENOMIC_ASSOCIATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/genomic-associations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/genomic-associations/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/genomic-associations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/genomic-associations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/genomic-associations/${id}`,
};

/**
 * API endpoints for variant phenotypes
 * Backend: /server/apps/nexotype/subrouters/knowledge_graph/variant_phenotype_subrouter.py
 */
export const VARIANT_PHENOTYPE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/variant-phenotypes/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/variant-phenotypes/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/variant-phenotypes/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/variant-phenotypes/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/variant-phenotypes/${id}`,
};

/**
 * API endpoints for patent claims
 * Backend: /server/apps/nexotype/subrouters/commercial/patent_claim_subrouter.py
 */
export const PATENT_CLAIM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/patent-claims/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/patent-claims/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/patent-claims/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/patent-claims/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/patent-claims/${id}`,
};

/**
 * API endpoints for patent assignees
 * Backend: /server/apps/nexotype/subrouters/commercial/patent_assignee_subrouter.py
 */
export const PATENT_ASSIGNEE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/patent-assignees/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/patent-assignees/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/patent-assignees/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/patent-assignees/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/patent-assignees/${id}`,
};

/**
 * API endpoints for asset ownerships
 * Backend: /server/apps/nexotype/subrouters/commercial/asset_ownership_subrouter.py
 */
export const ASSET_OWNERSHIP_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/asset-ownerships/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/asset-ownerships/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/asset-ownerships/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/asset-ownerships/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/asset-ownerships/${id}`,
};

/**
 * API endpoints for transactions
 * Backend: /server/apps/nexotype/subrouters/commercial/transaction_subrouter.py
 */
export const TRANSACTION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/transactions/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/transactions/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/transactions/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/transactions/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/transactions/${id}`,
};

/**
 * API endpoints for licensing agreements
 * Backend: /server/apps/nexotype/subrouters/commercial/licensing_agreement_subrouter.py
 */
export const LICENSING_AGREEMENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/licensing-agreements/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/licensing-agreements/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/licensing-agreements/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/licensing-agreements/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/licensing-agreements/${id}`,
};

/**
 * API endpoints for development pipelines
 * Backend: /server/apps/nexotype/subrouters/commercial/development_pipeline_subrouter.py
 */
export const DEVELOPMENT_PIPELINE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/development-pipelines/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/development-pipelines/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/development-pipelines/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/development-pipelines/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/development-pipelines/${id}`,
};

/**
 * API endpoints for regulatory approvals
 * Backend: /server/apps/nexotype/subrouters/commercial/regulatory_approval_subrouter.py
 */
export const REGULATORY_APPROVAL_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/regulatory-approvals/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/regulatory-approvals/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/regulatory-approvals/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/regulatory-approvals/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/regulatory-approvals/${id}`,
};

/**
 * API endpoints for technology platforms
 * Backend: /server/apps/nexotype/subrouters/commercial/technology_platform_subrouter.py
 */
export const TECHNOLOGY_PLATFORM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/technology-platforms/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/technology-platforms/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/technology-platforms/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/technology-platforms/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/technology-platforms/${id}`,
};

/**
 * API endpoints for asset technology platforms
 * Backend: /server/apps/nexotype/subrouters/commercial/asset_technology_platform_subrouter.py
 */
export const ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/asset-technology-platforms/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/asset-technology-platforms/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/asset-technology-platforms/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/asset-technology-platforms/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/asset-technology-platforms/${id}`,
};

/**
 * API endpoints for organization technology platforms
 * Backend: /server/apps/nexotype/subrouters/commercial/organization_technology_platform_subrouter.py
 */
export const ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/organization-technology-platforms/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/organization-technology-platforms/${id}`,
  CREATE: `${API_BASE_URL}/nexotype/organization-technology-platforms/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/organization-technology-platforms/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/organization-technology-platforms/${id}`,
};
