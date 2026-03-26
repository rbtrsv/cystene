"""
Nexotype Subscription Utilities

Domain-gated tier system. Each subscription tier unlocks read/write access
to specific domains and entities. Tiers are cumulative — higher tiers
include everything from lower tiers.

Tier model:
- FREE: UI only, no data access (counts/structure visible, not records)
- PERSONAL: B2C biohacker — reads subset of science domains, writes own data
- PRO: B2B biotech — reads+writes everything except Commercial
- ENTERPRISE: full platform access including Commercial intelligence

Pricing:
- FREE: $0/mo
- PERSONAL: $20/mo
- PRO: $120/mo
- ENTERPRISE: $360/mo

Stripe Dashboard setup (required once):
    1. Products → Create products:
       - "Personal" → $20/month recurring,
         description: "Genetic profile analysis, biomarker tracking, and personalized recommendations"
         metadata: tier=PERSONAL, tier_order=0,
         features=Genetic variants,Biomarkers,Therapeutic assets,Drug interactions,Genomic associations,Treatment logs
       - "Pro" → $120/month recurring,
         description: "Full access to omics, clinical, engineering, LIMS, and knowledge graph modules"
         metadata: tier=PRO, tier_order=1,
         features=Full science access,Engineering,LIMS,Knowledge graph curation,All Personal features
       - "Enterprise" → $360/month recurring,
         description: "Complete platform with commercial intelligence, patents, M&A, and licensing"
         metadata: tier=ENTERPRISE, tier_order=2,
         features=Commercial intelligence,Patents,M&A,Licensing,Regulatory,All Pro features
    2. Settings → Billing → Customer Portal:
       - "Customers can switch plans" → ON
         (allows upgrade/downgrade between Personal/Pro/Enterprise)
       - Add all three products to eligible subscription products
       - "When customers change plans" → "Prorate charges and credits"
         (mid-cycle upgrade charges proportionally, not next billing cycle)
       - Cancellations → Allow customers to cancel → ON

Constants:
    - TIER_ORDER: tiers ordered lowest to highest (FREE < PERSONAL < PRO < ENTERPRISE)
    - DOMAIN_TIER_MAP: minimum tier for read/write per domain
      (e.g. "asset" → read: PERSONAL, write: PRO)
    - ENTITY_TIER_MAP: overrides for entities that differ from their domain default
      (e.g. "gene" is in "omics" domain which is PRO, but gene read is PERSONAL)
    - FREE_SAMPLE_LIMIT: how many records FREE tier can see (currently 0)

Query helpers:
    - get_org_subscription(): fetch organization's Subscription from DB

Logic helpers (pure functions, no FastAPI):
    - get_required_tier(domain, entity, is_write): looks up ENTITY_TIER_MAP first,
      falls back to DOMAIN_TIER_MAP, returns minimum tier string
    - tier_is_sufficient(current_tier, required_tier): index-based comparison
      on TIER_ORDER (e.g. PRO index 2 >= PERSONAL index 1 → True)

These are pure helpers — not FastAPI dependencies. The dependency that
uses them lives in dependency_utils.py (require_domain_access).
"""

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.accounts.models import Subscription

logger = logging.getLogger(__name__)

# ==========================================
# Tier Order
# ==========================================

# Subscription tiers from lowest to highest — index-based comparison.
# FREE is implicit (no subscription record needed).
# PERSONAL/PRO/ENTERPRISE match Stripe product metadata "tier" values.
TIER_ORDER = ["FREE", "PERSONAL", "PRO", "ENTERPRISE"]

# ==========================================
# Domain → Tier Mapping
# ==========================================

# Maps each domain to the minimum tier required for read and write access.
# "read" = GET/HEAD requests, "write" = POST/PUT/PATCH/DELETE requests.
#
# Personal (B2C biohacker) reads:
#   - Gene, Variant (understand their variants)
#   - Biomarker, Pathway (track their health)
#   - TherapeuticAsset + subtypes (log treatments)
#   - DrugInteraction, GenomicAssociation (basic context)
#   - User domain (their own data)
#
# Personal does NOT read: deep omics (Organism, Transcript, Exon, Protein,
# ProteinDomain, PeptideFragment), clinical research (Indication, Phenotype),
# standardization, advanced KG, engineering, LIMS, commercial.
# Those are gated at entity level via ENTITY_TIER_MAP below.
#
# Pro (B2B biotech) reads+writes everything except Commercial.
# Enterprise reads+writes everything.
DOMAIN_TIER_MAP = {
    # Standardization — Pro only (infrastructure/reference data curation)
    "standardization": {"read": "PRO", "write": "PRO"},

    # Omics — domain default is Pro (deep omics: Organism, Transcript, Exon,
    # Protein, ProteinDomain, PeptideFragment). Gene and Variant are overridden
    # to Personal via ENTITY_TIER_MAP.
    "omics": {"read": "PRO", "write": "PRO"},

    # Clinical — domain default is Pro (Indication, Phenotype).
    # Biomarker and Pathway are overridden to Personal via ENTITY_TIER_MAP.
    "clinical": {"read": "PRO", "write": "PRO"},

    # Asset — domain default is Personal read (biohacker sees therapeutic assets
    # to log treatments). Write is Pro (only biotech creates assets).
    "asset": {"read": "PERSONAL", "write": "PRO"},

    # Engineering — Pro only (lab operations: candidates, mutations, constructs)
    "engineering": {"read": "PRO", "write": "PRO"},

    # LIMS — Pro only (lab operations: biospecimens, assays, readouts).
    # Subject is overridden to Personal via ENTITY_TIER_MAP.
    "lims": {"read": "PRO", "write": "PRO"},

    # User & Personalization — Personal read+write (biohacker's own data)
    "user": {"read": "PERSONAL", "write": "PERSONAL"},

    # Knowledge Graph — domain default is Pro (advanced KG: DrugTargetMechanism,
    # BioActivity, TherapeuticEfficacy, BiomarkerAssociation, VariantPhenotype,
    # PathwayMembership, BiologicalRelationship, Source, EvidenceAssertion,
    # ContextAttribute). DrugInteraction and GenomicAssociation are overridden
    # to Personal via ENTITY_TIER_MAP.
    "knowledge_graph": {"read": "PRO", "write": "PRO"},

    # Commercial Intelligence — Enterprise only (patents, M&A, licensing, etc.)
    "commercial": {"read": "ENTERPRISE", "write": "ENTERPRISE"},
}

# ==========================================
# Entity → Tier Overrides
# ==========================================

# Overrides for specific entities that need different tier access than their
# domain default. Key = entity name (lowercase), value = {read, write} tiers.
#
# Why these overrides exist:
# - gene/variant: biohacker needs to see their genetic variants (UserVariant → Gene/Variant FK)
# - biomarker/pathway: biohacker tracks biomarkers and pathway scores (UserBiomarkerReading → Biomarker FK)
# - drug_interaction: biohacker needs to see drug interactions for safety
# - genomic_association: biohacker needs to see what their variants mean
# - subject: biohacker IS a subject — needs to create their own clinical profile (UserProfile → Subject FK)
ENTITY_TIER_MAP = {
    # Omics domain overrides — Personal can read (not write) Gene and Variant
    "gene": {"read": "PERSONAL", "write": "PRO"},
    "variant": {"read": "PERSONAL", "write": "PRO"},

    # Clinical domain overrides — Personal can read (not write) Biomarker and Pathway
    "biomarker": {"read": "PERSONAL", "write": "PRO"},
    "pathway": {"read": "PERSONAL", "write": "PRO"},

    # KG domain overrides — Personal can read (not write) DrugInteraction and GenomicAssociation
    "drug_interaction": {"read": "PERSONAL", "write": "PRO"},
    "genomic_association": {"read": "PERSONAL", "write": "PRO"},

    # LIMS domain override — Personal can read+write Subject (biohacker IS a subject)
    "subject": {"read": "PERSONAL", "write": "PERSONAL"},
}

# ==========================================
# Route → Permission Mapping
# ==========================================

# Maps each URL path segment (router prefix without leading slash) to its
# domain, optional entity override, and display name.
#
# This is the queryable form of the implicit mapping in router.py — each
# include_router() call has a prefix and require_domain_access(domain, entity?).
# permissions_subrouter.py uses this to compute per-route access without
# the frontend needing any authorization mapping.
#
# When adding a new route to router.py, add a corresponding entry here.
ROUTE_PERMISSION_MAP = {
    # Standardization — Pro read+write
    "ontology-terms": {"domain": "standardization", "display_name": "Ontology Terms"},
    "units-of-measure": {"domain": "standardization", "display_name": "Units of Measure"},
    "external-references": {"domain": "standardization", "display_name": "External References"},

    # Omics — domain default Pro, Gene+Variant overridden to Personal read
    "organisms": {"domain": "omics", "display_name": "Organisms"},
    "genes": {"domain": "omics", "entity": "gene", "display_name": "Genes"},
    "transcripts": {"domain": "omics", "display_name": "Transcripts"},
    "exons": {"domain": "omics", "display_name": "Exons"},
    "proteins": {"domain": "omics", "display_name": "Proteins"},
    "protein-domains": {"domain": "omics", "display_name": "Protein Domains"},
    "variants": {"domain": "omics", "entity": "variant", "display_name": "Variants"},
    "peptide-fragments": {"domain": "omics", "display_name": "Peptide Fragments"},

    # Clinical — domain default Pro, Biomarker+Pathway overridden to Personal read
    "indications": {"domain": "clinical", "display_name": "Indications"},
    "phenotypes": {"domain": "clinical", "display_name": "Phenotypes"},
    "biomarkers": {"domain": "clinical", "entity": "biomarker", "display_name": "Biomarkers"},
    "pathways": {"domain": "clinical", "entity": "pathway", "display_name": "Pathways"},

    # Asset — Personal read, Pro write
    "therapeutic-assets": {"domain": "asset", "display_name": "Therapeutic Assets"},
    "small-molecules": {"domain": "asset", "display_name": "Small Molecules"},
    "biologics": {"domain": "asset", "display_name": "Biologics"},
    "therapeutic-peptides": {"domain": "asset", "display_name": "Therapeutic Peptides"},
    "oligonucleotides": {"domain": "asset", "display_name": "Oligonucleotides"},

    # Engineering — Pro read+write
    "candidates": {"domain": "engineering", "display_name": "Candidates"},
    "design-mutations": {"domain": "engineering", "display_name": "Design Mutations"},
    "constructs": {"domain": "engineering", "display_name": "Constructs"},

    # LIMS — domain default Pro, Subject overridden to Personal read+write
    "subjects": {"domain": "lims", "entity": "subject", "display_name": "Subjects"},
    "biospecimens": {"domain": "lims", "display_name": "Biospecimens"},
    "assay-protocols": {"domain": "lims", "display_name": "Assay Protocols"},
    "assay-runs": {"domain": "lims", "display_name": "Assay Runs"},
    "assay-readouts": {"domain": "lims", "display_name": "Assay Readouts"},

    # User — Personal read+write
    "user-profiles": {"domain": "user", "display_name": "User Profiles"},
    "data-sources": {"domain": "user", "display_name": "Data Sources"},
    "genomic-files": {"domain": "user", "display_name": "Genomic Files"},
    "user-variants": {"domain": "user", "display_name": "User Variants"},
    "user-biomarker-readings": {"domain": "user", "display_name": "User Biomarker Readings"},
    "user-treatment-logs": {"domain": "user", "display_name": "User Treatment Logs"},
    "pathway-scores": {"domain": "user", "display_name": "Pathway Scores"},
    "recommendations": {"domain": "user", "display_name": "Recommendations"},

    # Knowledge Graph — domain default Pro, DrugInteraction+GenomicAssociation overridden to Personal read
    "drug-target-mechanisms": {"domain": "knowledge_graph", "display_name": "Drug Target Mechanisms"},
    "bioactivities": {"domain": "knowledge_graph", "display_name": "Bioactivities"},
    "therapeutic-efficacies": {"domain": "knowledge_graph", "display_name": "Therapeutic Efficacies"},
    "drug-interactions": {"domain": "knowledge_graph", "entity": "drug_interaction", "display_name": "Drug Interactions"},
    "biomarker-associations": {"domain": "knowledge_graph", "display_name": "Biomarker Associations"},
    "genomic-associations": {"domain": "knowledge_graph", "entity": "genomic_association", "display_name": "Genomic Associations"},
    "variant-phenotypes": {"domain": "knowledge_graph", "display_name": "Variant Phenotypes"},
    "pathway-memberships": {"domain": "knowledge_graph", "display_name": "Pathway Memberships"},
    "biological-relationships": {"domain": "knowledge_graph", "display_name": "Biological Relationships"},
    "sources": {"domain": "knowledge_graph", "display_name": "Sources"},
    "evidence-assertions": {"domain": "knowledge_graph", "display_name": "Evidence Assertions"},
    "context-attributes": {"domain": "knowledge_graph", "display_name": "Context Attributes"},

    # Commercial — Enterprise read+write
    "market-organizations": {"domain": "commercial", "display_name": "Market Organizations"},
    "patents": {"domain": "commercial", "display_name": "Patents"},
    "patent-claims": {"domain": "commercial", "display_name": "Patent Claims"},
    "patent-assignees": {"domain": "commercial", "display_name": "Patent Assignees"},
    "asset-ownerships": {"domain": "commercial", "display_name": "Asset Ownerships"},
    "transactions": {"domain": "commercial", "display_name": "Transactions"},
    "licensing-agreements": {"domain": "commercial", "display_name": "Licensing Agreements"},
    "development-pipelines": {"domain": "commercial", "display_name": "Development Pipelines"},
    "regulatory-approvals": {"domain": "commercial", "display_name": "Regulatory Approvals"},
    "technology-platforms": {"domain": "commercial", "display_name": "Technology Platforms"},
    "asset-technology-platforms": {"domain": "commercial", "display_name": "Asset Tech Platforms"},
    "organization-technology-platforms": {"domain": "commercial", "display_name": "Org Tech Platforms"},
}

# ==========================================
# Free Tier Sample Limit
# ==========================================

# FREE tier sees this many records per entity (ordered by ID).
# Currently 0 = FREE users see no data, just the UpgradeRequired card.
#
# To enable a teaser (e.g. 5 records visible to FREE users):
#   1. Set FREE_SAMPLE_LIMIT = 5
#   2. In dependency_utils.py require_domain_access(): instead of raising 403
#      for FREE tier, pass the limit to the crud query
#   3. In crud_utils.py get_all(): accept an optional max_rows param and apply
#      .limit(max_rows) to the query when set
#   4. Frontend: add a banner on list pages showing "Showing {n} of {total}
#      records — upgrade to see all"
FREE_SAMPLE_LIMIT = 0

# ==========================================
# Query Helpers
# ==========================================

async def get_org_subscription(org_id: int, session: AsyncSession):
    """
    Get the organization's subscription record.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Subscription or None
    """
    result = await session.execute(
        select(Subscription).filter(Subscription.organization_id == org_id)
    )
    return result.scalar_one_or_none()


def get_required_tier(domain: str, entity: str | None, is_write: bool) -> str:
    """
    Determine the minimum tier required for an operation.

    Checks entity-level overrides first, then falls back to domain-level map.

    Args:
        domain: Domain name (e.g. "omics", "clinical", "commercial")
        entity: Entity name for override lookup (e.g. "gene", "subject"), or None
        is_write: True for POST/PUT/PATCH/DELETE, False for GET/HEAD

    Returns:
        Tier string: "FREE", "PERSONAL", "PRO", or "ENTERPRISE"
    """
    access_type = "write" if is_write else "read"

    # Check entity-level override first
    if entity and entity in ENTITY_TIER_MAP:
        return ENTITY_TIER_MAP[entity][access_type]

    # Fall back to domain-level map
    if domain in DOMAIN_TIER_MAP:
        return DOMAIN_TIER_MAP[domain][access_type]

    # Unknown domain — deny access (require highest tier)
    logger.warning(f"Unknown domain '{domain}' requested — defaulting to ENTERPRISE")
    return "ENTERPRISE"


def tier_is_sufficient(current_tier: str, required_tier: str) -> bool:
    """
    Check if current tier meets or exceeds the required tier.

    Uses index-based comparison on TIER_ORDER.

    Args:
        current_tier: User's current tier (e.g. "PRO")
        required_tier: Minimum tier needed (e.g. "PERSONAL")

    Returns:
        True if current_tier >= required_tier
    """
    # Handle unknown tiers defensively
    if current_tier not in TIER_ORDER:
        return False
    if required_tier not in TIER_ORDER:
        return False

    return TIER_ORDER.index(current_tier) >= TIER_ORDER.index(required_tier)
