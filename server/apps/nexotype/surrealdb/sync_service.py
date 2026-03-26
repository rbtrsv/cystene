"""
SurrealDB sync service for Nexotype.
Syncs PostgreSQL entities and relationships to SurrealDB graph database.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from sqlalchemy import select
from ..models import (
    Gene, Protein, Peptide, Treatment, Disease, Enhancement,
    Pathway, Variant, Phenotype, Biomarker, BioActivity,
    # Relationship tables
    Encodes, Contains, HasActivity, Treats, Enhances,
    AssociatedWith, InteractsWith, Causes, Indicates,
    GeneParticipatesIn, ProteinParticipatesIn, IsPartOf
)

logger = logging.getLogger(__name__)


class SurrealSyncService:
    """
    Service for syncing PostgreSQL data to SurrealDB.
    Handles both entity and relationship synchronization.
    """

    def __init__(self, pg_session: AsyncSession, surreal_client: Any):
        """
        Initialize sync service.

        Args:
            pg_session: SQLAlchemy async session for PostgreSQL
            surreal_client: SurrealDB async client
        """
        self.pg = pg_session
        self.surreal = surreal_client

    async def sync_entity(self, entity: Any, table: str) -> None:
        """
        Sync a single entity to SurrealDB.
        Uses db.create() SDK method for record creation.

        Args:
            entity: SQLAlchemy model instance
            table: SurrealDB table name (lowercase)
        """
        properties = {
            'uid': entity.uid,
            'name': entity.name,
            'created_at': entity.created_at.isoformat() if entity.created_at else None
        }

        # Add entity-specific properties for biotech models
        if isinstance(entity, Gene):
            properties.update({
                'ensembl_id': entity.ensembl_id,
                'chromosome': entity.chromosome,
                'gene_type': entity.gene_type,
                'start_position': entity.start_position,
                'end_position': entity.end_position,
                'species': entity.species
            })
        elif isinstance(entity, Protein):
            properties.update({
                'uniprot_id': entity.uniprot_id,
                'molecular_weight': entity.molecular_weight,
                'isoelectric_point': entity.isoelectric_point,
                'pdb_id': getattr(entity, 'pdb_id', None),
                'binding_sites': getattr(entity, 'binding_sites', None)
            })
        elif isinstance(entity, Treatment):
            properties.update({
                'treatment_type': entity.treatment_type,
                'availability': getattr(entity, 'availability', None),
                'synthesis_difficulty': getattr(entity, 'synthesis_difficulty', None),
                'typical_dosage': getattr(entity, 'typical_dosage', None)
            })
        elif isinstance(entity, Disease):
            properties.update({
                'omim_id': entity.omim_id,
                'disease_class': entity.disease_class
            })
        elif isinstance(entity, Enhancement):
            properties.update({
                'enhancement_type': entity.enhancement_type
            })
        elif isinstance(entity, Peptide):
            properties.update({
                'sequence': entity.sequence,
                'length': entity.length,
                'molecular_weight': entity.molecular_weight,
                'synthesis_difficulty': entity.synthesis_difficulty,
                'stability_score': entity.stability_score
            })
        elif isinstance(entity, Pathway):
            properties.update({
                'kegg_id': entity.kegg_id,
                'pathway_type': entity.pathway_type
            })
        elif isinstance(entity, Variant):
            properties.update({
                'rs_id': entity.rs_id,
                'chromosome': entity.chromosome,
                'position': entity.position,
                'reference_allele': entity.reference_allele,
                'alternate_allele': entity.alternate_allele
            })
        elif isinstance(entity, Phenotype):
            properties.update({
                'description': entity.description
            })
        elif isinstance(entity, Biomarker):
            properties.update({
                'biomarker_type': entity.biomarker_type,
                'normal_range': getattr(entity, 'normal_range', None)
            })
        elif isinstance(entity, BioActivity):
            properties.update({
                'activity_type': entity.activity_type,
                'description': entity.description
            })

        # Remove None values
        properties = {k: v for k, v in properties.items() if v is not None}

        # Use SDK create method with record ID
        record_id = f"{table}:{entity.uid}"
        await self.surreal.create(record_id, properties)

    async def sync_relationship(
        self,
        source_uid: str,
        source_table: str,
        target_uid: str,
        target_table: str,
        rel_type: str,
        properties: Optional[Dict] = None
    ) -> None:
        """
        Sync a relationship to SurrealDB using RELATE syntax.

        Args:
            source_uid: UID of source entity
            source_table: SurrealDB table name for source
            target_uid: UID of target entity
            target_table: SurrealDB table name for target
            rel_type: Relationship type (edge table name)
            properties: Optional relationship properties
        """
        # Filter out None values from properties
        if properties:
            properties = {k: v for k, v in properties.items() if v is not None}

        # SurrealQL RELATE syntax creates edge records
        query = f"RELATE {source_table}:{source_uid} -> {rel_type} -> {target_table}:{target_uid}"
        if properties:
            query += " CONTENT $props"
            await self.surreal.query(query, {"props": properties})
        else:
            await self.surreal.query(query)

    async def full_sync(self) -> Dict[str, int]:
        """
        Perform complete sync from PostgreSQL to SurrealDB.
        Clears existing data and syncs all entities and relationships.

        Returns:
            Dict with counts of synced entities and relationships
        """
        counts = {}

        # Clear SurrealDB tables
        logger.info("Clearing existing SurrealDB data...")
        tables = [
            'gene', 'protein', 'peptide', 'treatment', 'disease', 'enhancement',
            'pathway', 'variant', 'phenotype', 'biomarker', 'bioactivity',
            'encodes', 'contains', 'treats', 'enhances', 'associated_with',
            'interacts_with', 'causes', 'has_activity', 'participates_in',
            'is_part_of', 'indicates'
        ]
        for table in tables:
            await self.surreal.query(f"DELETE {table}")

        # Sync entities
        logger.info("Syncing entities...")

        # Genes
        result = await self.pg.execute(select(Gene))
        genes = result.scalars().all()
        for gene in genes:
            await self.sync_entity(gene, "gene")
        counts['genes'] = len(genes)

        # Proteins
        result = await self.pg.execute(select(Protein))
        proteins = result.scalars().all()
        for protein in proteins:
            await self.sync_entity(protein, "protein")
        counts['proteins'] = len(proteins)

        # Peptides
        result = await self.pg.execute(select(Peptide))
        peptides = result.scalars().all()
        for peptide in peptides:
            await self.sync_entity(peptide, "peptide")
        counts['peptides'] = len(peptides)

        # Treatments
        result = await self.pg.execute(select(Treatment))
        treatments = result.scalars().all()
        for treatment in treatments:
            await self.sync_entity(treatment, "treatment")
        counts['treatments'] = len(treatments)

        # Diseases
        result = await self.pg.execute(select(Disease))
        diseases = result.scalars().all()
        for disease in diseases:
            await self.sync_entity(disease, "disease")
        counts['diseases'] = len(diseases)

        # Enhancements
        result = await self.pg.execute(select(Enhancement))
        enhancements = result.scalars().all()
        for enhancement in enhancements:
            await self.sync_entity(enhancement, "enhancement")
        counts['enhancements'] = len(enhancements)

        # Pathways
        result = await self.pg.execute(select(Pathway))
        pathways = result.scalars().all()
        for pathway in pathways:
            await self.sync_entity(pathway, "pathway")
        counts['pathways'] = len(pathways)

        # Variants
        result = await self.pg.execute(select(Variant))
        variants = result.scalars().all()
        for variant in variants:
            await self.sync_entity(variant, "variant")
        counts['variants'] = len(variants)

        # Phenotypes
        result = await self.pg.execute(select(Phenotype))
        phenotypes = result.scalars().all()
        for phenotype in phenotypes:
            await self.sync_entity(phenotype, "phenotype")
        counts['phenotypes'] = len(phenotypes)

        # Biomarkers
        result = await self.pg.execute(select(Biomarker))
        biomarkers = result.scalars().all()
        for biomarker in biomarkers:
            await self.sync_entity(biomarker, "biomarker")
        counts['biomarkers'] = len(biomarkers)

        # BioActivities
        result = await self.pg.execute(select(BioActivity))
        bioactivities = result.scalars().all()
        for bioactivity in bioactivities:
            await self.sync_entity(bioactivity, "bioactivity")
        counts['bioactivities'] = len(bioactivities)

        # Sync relationships
        logger.info("Syncing relationships...")

        # Gene → Protein (encodes)
        result = await self.pg.execute(
            select(Encodes).options(
                selectinload(Encodes.gene),
                selectinload(Encodes.protein)
            )
        )
        encodes = result.scalars().all()
        for encode in encodes:
            await self.sync_relationship(
                encode.gene.uid, "gene",
                encode.protein.uid, "protein",
                "encodes"
            )
        counts['encodes'] = len(encodes)

        # Protein → Peptide (contains)
        result = await self.pg.execute(
            select(Contains).options(
                selectinload(Contains.protein),
                selectinload(Contains.peptide)
            )
        )
        contains = result.scalars().all()
        for contain in contains:
            props = {}
            if hasattr(contain, 'start_position'):
                props['start_position'] = contain.start_position
            if hasattr(contain, 'end_position'):
                props['end_position'] = contain.end_position

            await self.sync_relationship(
                contain.protein.uid, "protein",
                contain.peptide.uid, "peptide",
                "contains",
                props if props else None
            )
        counts['contains'] = len(contains)

        # Treatment → Disease (treats)
        result = await self.pg.execute(
            select(Treats).options(
                selectinload(Treats.treatment),
                selectinload(Treats.disease)
            )
        )
        treats = result.scalars().all()
        for treat in treats:
            await self.sync_relationship(
                treat.treatment.uid, "treatment",
                treat.disease.uid, "disease",
                "treats",
                {
                    'mechanism_type': treat.mechanism_type,
                    'efficacy_score': getattr(treat, 'efficacy_score', None)
                }
            )
        counts['treats'] = len(treats)

        # Treatment → Enhancement (enhances)
        result = await self.pg.execute(
            select(Enhances).options(
                selectinload(Enhances.treatment),
                selectinload(Enhances.enhancement)
            )
        )
        enhances = result.scalars().all()
        for enhance in enhances:
            await self.sync_relationship(
                enhance.treatment.uid, "treatment",
                enhance.enhancement.uid, "enhancement",
                "enhances",
                {
                    'mechanism_type': enhance.mechanism_type,
                    'efficacy_score': getattr(enhance, 'efficacy_score', None),
                    'typical_timeline': getattr(enhance, 'typical_timeline', None)
                }
            )
        counts['enhances'] = len(enhances)

        # Gene → Disease (associated_with)
        result = await self.pg.execute(
            select(AssociatedWith).options(
                selectinload(AssociatedWith.gene),
                selectinload(AssociatedWith.disease)
            )
        )
        associations = result.scalars().all()
        for assoc in associations:
            await self.sync_relationship(
                assoc.gene.uid, "gene",
                assoc.disease.uid, "disease",
                "associated_with",
                {
                    'association_type': assoc.association_type,
                    'odds_ratio': getattr(assoc, 'odds_ratio', None),
                    'p_value': getattr(assoc, 'p_value', None)
                }
            )
        counts['associated_with'] = len(associations)

        # Protein ↔ Protein (interacts_with)
        result = await self.pg.execute(
            select(InteractsWith).options(
                selectinload(InteractsWith.source_protein),
                selectinload(InteractsWith.target_protein)
            )
        )
        interactions = result.scalars().all()
        for interaction in interactions:
            await self.sync_relationship(
                interaction.source_protein.uid, "protein",
                interaction.target_protein.uid, "protein",
                "interacts_with",
                {
                    'interaction_strength': interaction.interaction_strength,
                    'interaction_type': getattr(interaction, 'interaction_type', None)
                }
            )
        counts['interacts_with'] = len(interactions)

        # Variant → Phenotype (causes)
        result = await self.pg.execute(
            select(Causes).options(
                selectinload(Causes.variant),
                selectinload(Causes.phenotype)
            )
        )
        causes = result.scalars().all()
        for cause in causes:
            await self.sync_relationship(
                cause.variant.uid, "variant",
                cause.phenotype.uid, "phenotype",
                "causes",
                {
                    'effect_size': getattr(cause, 'effect_size', None),
                    'p_value': getattr(cause, 'p_value', None)
                }
            )
        counts['causes'] = len(causes)

        # Peptide → BioActivity (has_activity)
        result = await self.pg.execute(
            select(HasActivity).options(
                selectinload(HasActivity.peptide),
                selectinload(HasActivity.bioactivity)
            )
        )
        has_activities = result.scalars().all()
        for activity in has_activities:
            await self.sync_relationship(
                activity.peptide.uid, "peptide",
                activity.bioactivity.uid, "bioactivity",
                "has_activity",
                {'potency': getattr(activity, 'potency', None)}
            )
        counts['has_activity'] = len(has_activities)

        # Gene → Pathway (participates_in)
        result = await self.pg.execute(
            select(GeneParticipatesIn).options(
                selectinload(GeneParticipatesIn.gene),
                selectinload(GeneParticipatesIn.pathway)
            )
        )
        gene_pathways = result.scalars().all()
        for gp in gene_pathways:
            await self.sync_relationship(
                gp.gene.uid, "gene",
                gp.pathway.uid, "pathway",
                "participates_in",
                {'role': getattr(gp, 'role', None)}
            )
        counts['gene_participates'] = len(gene_pathways)

        # Protein → Pathway (participates_in)
        result = await self.pg.execute(
            select(ProteinParticipatesIn).options(
                selectinload(ProteinParticipatesIn.protein),
                selectinload(ProteinParticipatesIn.pathway)
            )
        )
        protein_pathways = result.scalars().all()
        for pp in protein_pathways:
            await self.sync_relationship(
                pp.protein.uid, "protein",
                pp.pathway.uid, "pathway",
                "participates_in",
                {'role': getattr(pp, 'role', None)}
            )
        counts['protein_participates'] = len(protein_pathways)

        # Pathway → Pathway (is_part_of)
        result = await self.pg.execute(
            select(IsPartOf).options(
                selectinload(IsPartOf.child),
                selectinload(IsPartOf.parent)
            )
        )
        pathway_hierarchy = result.scalars().all()
        for hierarchy in pathway_hierarchy:
            await self.sync_relationship(
                hierarchy.child.uid, "pathway",
                hierarchy.parent.uid, "pathway",
                "is_part_of"
            )
        counts['is_part_of'] = len(pathway_hierarchy)

        # Biomarker → Disease (indicates)
        result = await self.pg.execute(
            select(Indicates).options(
                selectinload(Indicates.biomarker),
                selectinload(Indicates.disease)
            )
        )
        indicates = result.scalars().all()
        for indicate in indicates:
            await self.sync_relationship(
                indicate.biomarker.uid, "biomarker",
                indicate.disease.uid, "disease",
                "indicates",
                {
                    'sensitivity': getattr(indicate, 'sensitivity', None),
                    'specificity': getattr(indicate, 'specificity', None)
                }
            )
        counts['indicates'] = len(indicates)

        logger.info(f"Sync complete: {counts}")
        return counts

    async def incremental_sync(self, since_datetime: datetime) -> Dict[str, int]:
        """
        Sync only records created/updated since given datetime.

        Args:
            since_datetime: Sync records created after this datetime

        Returns:
            Dict with counts of synced entities
        """
        counts = {}

        # Query only recent Genes
        result = await self.pg.execute(
            select(Gene).where(Gene.created_at >= since_datetime)
        )
        recent_genes = result.scalars().all()

        for gene in recent_genes:
            await self.sync_entity(gene, "gene")
        counts['genes'] = len(recent_genes)

        # Query only recent Proteins
        result = await self.pg.execute(
            select(Protein).where(Protein.created_at >= since_datetime)
        )
        recent_proteins = result.scalars().all()

        for protein in recent_proteins:
            await self.sync_entity(protein, "protein")
        counts['proteins'] = len(recent_proteins)

        logger.info(f"Incremental sync completed: {counts} since {since_datetime}")
        return counts

    # Graph query methods for discovery endpoints

    async def get_gene_network(self, gene_uid: str, depth: int = 2) -> List[Dict]:
        """
        Get gene interaction network from SurrealDB.
        Traverses relationships up to specified depth.

        Args:
            gene_uid: UID of the starting gene
            depth: Maximum traversal depth (default 2)

        Returns:
            List of connected entities with distance info
        """
        network = []

        # Get pathways the gene participates in
        pathways = await self.surreal.query(
            f"SELECT ->participates_in->pathway.* FROM gene:{gene_uid}"
        )
        if pathways and isinstance(pathways, list) and len(pathways) > 0:
            pathway_data = pathways[0]
            if isinstance(pathway_data, dict):
                try:
                    items = pathway_data['->participates_in']['->pathway']
                    for item in (items if isinstance(items, list) else [items]):
                        if item:
                            network.append({
                                "uid": str(item.get("id", "")).split(":")[-1],
                                "name": item.get("name"),
                                "type": "pathway",
                                "distance": 1
                            })
                except (KeyError, TypeError):
                    pass

        # Get proteins the gene encodes
        proteins = await self.surreal.query(
            f"SELECT ->encodes->protein.* FROM gene:{gene_uid}"
        )
        if proteins and isinstance(proteins, list) and len(proteins) > 0:
            protein_data = proteins[0]
            if isinstance(protein_data, dict):
                try:
                    items = protein_data['->encodes']['->protein']
                    for item in (items if isinstance(items, list) else [items]):
                        if item:
                            network.append({
                                "uid": str(item.get("id", "")).split(":")[-1],
                                "name": item.get("name"),
                                "type": "protein",
                                "distance": 1
                            })
                except (KeyError, TypeError):
                    pass

        # Get diseases associated with the gene
        diseases = await self.surreal.query(
            f"SELECT ->associated_with->disease.* FROM gene:{gene_uid}"
        )
        if diseases and isinstance(diseases, list) and len(diseases) > 0:
            disease_data = diseases[0]
            if isinstance(disease_data, dict):
                try:
                    items = disease_data['->associated_with']['->disease']
                    for item in (items if isinstance(items, list) else [items]):
                        if item:
                            network.append({
                                "uid": str(item.get("id", "")).split(":")[-1],
                                "name": item.get("name"),
                                "type": "disease",
                                "distance": 1
                            })
                except (KeyError, TypeError):
                    pass

        return network

    async def find_treatment_paths(self, gene_uid: str) -> List[Dict]:
        """
        Find all treatments connected to a gene through any path.
        Traverses gene → disease → treatment relationships.

        Args:
            gene_uid: UID of the gene

        Returns:
            List of treatments with connection distance
        """
        treatments = []

        # Traverse: gene -> associated_with -> disease <- treats <- treatment
        result = await self.surreal.query(
            f"SELECT ->associated_with->disease<-treats<-treatment.* FROM gene:{gene_uid}"
        )

        if result and isinstance(result, list) and len(result) > 0:
            data = result[0]
            if isinstance(data, dict):
                try:
                    items = data['->associated_with']['->disease']['<-treats']['<-treatment']
                    for item in (items if isinstance(items, list) else [items]):
                        if item:
                            treatments.append({
                                "uid": str(item.get("id", "")).split(":")[-1],
                                "name": item.get("name"),
                                "type": item.get("treatment_type"),
                                "availability": item.get("availability"),
                                "distance": 2
                            })
                except (KeyError, TypeError):
                    pass

        return treatments

    async def find_similar_treatments(self, treatment_uid: str) -> List[Dict]:
        """
        Find treatments with similar biological targets.
        Identifies treatments that target the same diseases or enhancements.

        Args:
            treatment_uid: UID of the treatment

        Returns:
            List of similar treatments with common target count
        """
        similar = []

        # Get all diseases this treatment treats
        diseases_result = await self.surreal.query(
            f"SELECT ->treats->disease.id FROM treatment:{treatment_uid}"
        )

        disease_ids = []
        if diseases_result and isinstance(diseases_result, list) and len(diseases_result) > 0:
            data = diseases_result[0]
            if isinstance(data, dict):
                try:
                    items = data['->treats']['->disease']['id']
                    disease_ids = items if isinstance(items, list) else [items]
                except (KeyError, TypeError):
                    pass

        # For each disease, find other treatments
        other_treatments = {}
        for disease_id in disease_ids:
            if disease_id:
                result = await self.surreal.query(
                    f"SELECT <-treats<-treatment.* FROM {disease_id}"
                )
                if result and isinstance(result, list) and len(result) > 0:
                    data = result[0]
                    if isinstance(data, dict):
                        try:
                            items = data['<-treats']['<-treatment']
                            for item in (items if isinstance(items, list) else [items]):
                                if item:
                                    uid = str(item.get("id", "")).split(":")[-1]
                                    if uid != treatment_uid:
                                        if uid not in other_treatments:
                                            other_treatments[uid] = {
                                                "uid": uid,
                                                "name": item.get("name"),
                                                "type": item.get("treatment_type"),
                                                "common_targets": 0
                                            }
                                        other_treatments[uid]["common_targets"] += 1
                        except (KeyError, TypeError):
                            pass

        # Sort by common targets
        similar = sorted(
            other_treatments.values(),
            key=lambda x: x["common_targets"],
            reverse=True
        )[:10]

        return similar
