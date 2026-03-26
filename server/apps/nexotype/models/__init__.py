"""
Nexotype Models Package

Re-exports all models so existing imports continue to work:
    from ..models import Gene, Protein, ...
"""

# Mixins
from .mixin_models import BaseMixin, OwnableMixin

# Audit
from .audit_models import NexotypeAuditLog

# 1. Standardization
from .standardization_models import (
    OntologyTerm,
    UnitOfMeasure,
    ExternalReference,
)

# 2. Omics Registry
from .omics_models import (
    Organism,
    Gene,
    Transcript,
    Exon,
    Protein,
    ProteinDomain,
    Variant,
    PeptideFragment,
)

# 3. Clinical & Phenotypic
from .clinical_models import (
    Indication,
    Phenotype,
    Biomarker,
    Pathway,
)

# 4. Asset Management (Polymorphic)
from .asset_models import (
    TherapeuticAsset,
    SmallMolecule,
    Biologic,
    TherapeuticPeptide,
    Oligonucleotide,
)

# 5. R&D Engineering
from .engineering_models import (
    Candidate,
    DesignMutation,
    Construct,
)

# 6. LIMS & Empirical Data
from .lims_models import (
    Subject,
    Biospecimen,
    AssayProtocol,
    AssayRun,
    AssayReadout,
)

# 7. User Bridge
# 8. Personalization & SaaS
from .user_models import (
    UserProfile,
    DataSource,
    GenomicFile,
    UserVariant,
    UserBiomarkerReading,
    UserTreatmentLog,
    PathwayScore,
    Recommendation,
)

# 9. Knowledge Graph
from .knowledge_graph_models import (
    DrugTargetMechanism,
    BioActivity,
    TherapeuticEfficacy,
    DrugInteraction,
    BiomarkerAssociation,
    GenomicAssociation,
    VariantPhenotype,
    PathwayMembership,
    BiologicalRelationship,
    Source,
    EvidenceAssertion,
    ContextAttribute,
)

# 10. Commercial Intelligence (IP & Deals)
from .commercial_models import (
    MarketOrganization,
    Patent,
    PatentClaim,
    PatentAssignee,
    AssetOwnership,
    Transaction,
    LicensingAgreement,
    DevelopmentPipeline,
    RegulatoryApproval,
    TechnologyPlatform,
    AssetTechnologyPlatform,
    OrganizationTechnologyPlatform,
)
