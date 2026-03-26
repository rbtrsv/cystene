from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from neo4j import AsyncDriver
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

class Neo4jSyncService:
    def __init__(self, pg_session: AsyncSession, neo4j_driver: AsyncDriver):
        self.pg = pg_session
        self.neo4j = neo4j_driver
    
    async def sync_entity(self, entity: Any, label: str) -> None:
        """Sync a single entity to Neo4j"""
        async with self.neo4j.session() as session:
            query = f"""
            MERGE (n:{label} {{uid: $uid}})
            SET n += $properties
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
            
            await session.run(query, uid=entity.uid, properties=properties)
    
    async def sync_relationship(self, 
                               source_uid: str, 
                               source_label: str,
                               target_uid: str, 
                               target_label: str,
                               rel_type: str,
                               properties: Optional[Dict] = None) -> None:
        """Sync a relationship to Neo4j"""
        async with self.neo4j.session() as session:
            query = f"""
            MATCH (a:{source_label} {{uid: $source_uid}})
            MATCH (b:{target_label} {{uid: $target_uid}})
            MERGE (a)-[r:{rel_type}]->(b)
            """
            params = {
                'source_uid': source_uid,
                'target_uid': target_uid
            }
            
            if properties:
                # Filter out None values
                properties = {k: v for k, v in properties.items() if v is not None}
                if properties:
                    query += " SET r += $properties"
                    params['properties'] = properties
            
            await session.run(query, **params)
    
    async def full_sync(self) -> Dict[str, int]:
        """Perform complete sync from PostgreSQL to Neo4j"""
        counts = {}
        
        # Clear Neo4j
        async with self.neo4j.session() as session:
            await session.run("MATCH (n) DETACH DELETE n")
        
        # Sync entities using your existing models
        logger.info("Syncing entities...")
        
        # Genes
        result = await self.pg.execute(select(Gene))
        genes = result.scalars().all()
        for gene in genes:
            await self.sync_entity(gene, "Gene")
        counts['genes'] = len(genes)
        
        # Proteins
        result = await self.pg.execute(select(Protein))
        proteins = result.scalars().all()
        for protein in proteins:
            await self.sync_entity(protein, "Protein")
        counts['proteins'] = len(proteins)
        
        # Peptides
        result = await self.pg.execute(select(Peptide))
        peptides = result.scalars().all()
        for peptide in peptides:
            await self.sync_entity(peptide, "Peptide")
        counts['peptides'] = len(peptides)
        
        # Treatments
        result = await self.pg.execute(select(Treatment))
        treatments = result.scalars().all()
        for treatment in treatments:
            await self.sync_entity(treatment, "Treatment")
        counts['treatments'] = len(treatments)
        
        # Diseases
        result = await self.pg.execute(select(Disease))
        diseases = result.scalars().all()
        for disease in diseases:
            await self.sync_entity(disease, "Disease")
        counts['diseases'] = len(diseases)
        
        # Enhancements
        result = await self.pg.execute(select(Enhancement))
        enhancements = result.scalars().all()
        for enhancement in enhancements:
            await self.sync_entity(enhancement, "Enhancement")
        counts['enhancements'] = len(enhancements)
        
        # Pathways
        result = await self.pg.execute(select(Pathway))
        pathways = result.scalars().all()
        for pathway in pathways:
            await self.sync_entity(pathway, "Pathway")
        counts['pathways'] = len(pathways)
        
        # Variants
        result = await self.pg.execute(select(Variant))
        variants = result.scalars().all()
        for variant in variants:
            await self.sync_entity(variant, "Variant")
        counts['variants'] = len(variants)
        
        # Phenotypes
        result = await self.pg.execute(select(Phenotype))
        phenotypes = result.scalars().all()
        for phenotype in phenotypes:
            await self.sync_entity(phenotype, "Phenotype")
        counts['phenotypes'] = len(phenotypes)
        
        # Biomarkers
        result = await self.pg.execute(select(Biomarker))
        biomarkers = result.scalars().all()
        for biomarker in biomarkers:
            await self.sync_entity(biomarker, "Biomarker")
        counts['biomarkers'] = len(biomarkers)
        
        # BioActivities
        result = await self.pg.execute(select(BioActivity))
        bioactivities = result.scalars().all()
        for bioactivity in bioactivities:
            await self.sync_entity(bioactivity, "BioActivity")
        counts['bioactivities'] = len(bioactivities)
        
        # Sync relationships using your junction tables
        logger.info("Syncing relationships...")
        
        # Gene → Protein (Encodes)
        result = await self.pg.execute(
            select(Encodes).options(
                selectinload(Encodes.gene),
                selectinload(Encodes.protein)
            )
        )
        encodes = result.scalars().all()
        for encode in encodes:
            await self.sync_relationship(
                encode.gene.uid, "Gene",
                encode.protein.uid, "Protein",
                "ENCODES"
            )
        counts['encodes'] = len(encodes)
        
        # Protein → Peptide (Contains)
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
                contain.protein.uid, "Protein",
                contain.peptide.uid, "Peptide",
                "CONTAINS",
                props if props else None
            )
        counts['contains'] = len(contains)
        
        # Treatment → Disease (Treats)
        result = await self.pg.execute(
            select(Treats).options(
                selectinload(Treats.treatment),
                selectinload(Treats.disease)
            )
        )
        treats = result.scalars().all()
        for treat in treats:
            await self.sync_relationship(
                treat.treatment.uid, "Treatment",
                treat.disease.uid, "Disease",
                "TREATS",
                {
                    'mechanism_type': treat.mechanism_type,
                    'efficacy_score': getattr(treat, 'efficacy_score', None)
                }
            )
        counts['treats'] = len(treats)
        
        # Treatment → Enhancement (Enhances)
        result = await self.pg.execute(
            select(Enhances).options(
                selectinload(Enhances.treatment),
                selectinload(Enhances.enhancement)
            )
        )
        enhances = result.scalars().all()
        for enhance in enhances:
            await self.sync_relationship(
                enhance.treatment.uid, "Treatment",
                enhance.enhancement.uid, "Enhancement",
                "ENHANCES",
                {
                    'mechanism_type': enhance.mechanism_type,
                    'efficacy_score': getattr(enhance, 'efficacy_score', None),
                    'typical_timeline': getattr(enhance, 'typical_timeline', None)
                }
            )
        counts['enhances'] = len(enhances)
        
        # Gene → Disease (AssociatedWith)
        result = await self.pg.execute(
            select(AssociatedWith).options(
                selectinload(AssociatedWith.gene),
                selectinload(AssociatedWith.disease)
            )
        )
        associations = result.scalars().all()
        for assoc in associations:
            await self.sync_relationship(
                assoc.gene.uid, "Gene",
                assoc.disease.uid, "Disease",
                "ASSOCIATED_WITH",
                {
                    'association_type': assoc.association_type,
                    'odds_ratio': getattr(assoc, 'odds_ratio', None),
                    'p_value': getattr(assoc, 'p_value', None)
                }
            )
        counts['associated_with'] = len(associations)
        
        # Protein ↔ Protein (InteractsWith)
        result = await self.pg.execute(
            select(InteractsWith).options(
                selectinload(InteractsWith.source_protein),
                selectinload(InteractsWith.target_protein)
            )
        )
        interactions = result.scalars().all()
        for interaction in interactions:
            await self.sync_relationship(
                interaction.source_protein.uid, "Protein",
                interaction.target_protein.uid, "Protein",
                "INTERACTS_WITH",
                {
                    'interaction_strength': interaction.interaction_strength,
                    'interaction_type': getattr(interaction, 'interaction_type', None)
                }
            )
        counts['interacts_with'] = len(interactions)
        
        # Variant → Phenotype (Causes)
        result = await self.pg.execute(
            select(Causes).options(
                selectinload(Causes.variant),
                selectinload(Causes.phenotype)
            )
        )
        causes = result.scalars().all()
        for cause in causes:
            await self.sync_relationship(
                cause.variant.uid, "Variant",
                cause.phenotype.uid, "Phenotype",
                "CAUSES",
                {
                    'effect_size': getattr(cause, 'effect_size', None),
                    'p_value': getattr(cause, 'p_value', None)
                }
            )
        counts['causes'] = len(causes)
        
        # Peptide → BioActivity (HasActivity)
        result = await self.pg.execute(
            select(HasActivity).options(
                selectinload(HasActivity.peptide),
                selectinload(HasActivity.bioactivity)
            )
        )
        has_activities = result.scalars().all()
        for activity in has_activities:
            await self.sync_relationship(
                activity.peptide.uid, "Peptide",
                activity.bioactivity.uid, "BioActivity",
                "HAS_ACTIVITY",
                {'potency': getattr(activity, 'potency', None)}
            )
        counts['has_activity'] = len(has_activities)
        
        # Gene → Pathway (GeneParticipatesIn)
        result = await self.pg.execute(
            select(GeneParticipatesIn).options(
                selectinload(GeneParticipatesIn.gene),
                selectinload(GeneParticipatesIn.pathway)
            )
        )
        gene_pathways = result.scalars().all()
        for gp in gene_pathways:
            await self.sync_relationship(
                gp.gene.uid, "Gene",
                gp.pathway.uid, "Pathway",
                "PARTICIPATES_IN",
                {'role': getattr(gp, 'role', None)}
            )
        counts['gene_participates'] = len(gene_pathways)
        
        # Protein → Pathway (ProteinParticipatesIn)
        result = await self.pg.execute(
            select(ProteinParticipatesIn).options(
                selectinload(ProteinParticipatesIn.protein),
                selectinload(ProteinParticipatesIn.pathway)
            )
        )
        protein_pathways = result.scalars().all()
        for pp in protein_pathways:
            await self.sync_relationship(
                pp.protein.uid, "Protein",
                pp.pathway.uid, "Pathway",
                "PARTICIPATES_IN",
                {'role': getattr(pp, 'role', None)}
            )
        counts['protein_participates'] = len(protein_pathways)
        
        # Pathway → Pathway (IsPartOf)
        result = await self.pg.execute(
            select(IsPartOf).options(
                selectinload(IsPartOf.child),
                selectinload(IsPartOf.parent)
            )
        )
        pathway_hierarchy = result.scalars().all()
        for hierarchy in pathway_hierarchy:
            await self.sync_relationship(
                hierarchy.child.uid, "Pathway",
                hierarchy.parent.uid, "Pathway",
                "IS_PART_OF"
            )
        counts['is_part_of'] = len(pathway_hierarchy)
        
        # Biomarker → Disease (Indicates)
        result = await self.pg.execute(
            select(Indicates).options(
                selectinload(Indicates.biomarker),
                selectinload(Indicates.disease)
            )
        )
        indicates = result.scalars().all()
        for indicate in indicates:
            await self.sync_relationship(
                indicate.biomarker.uid, "Biomarker",
                indicate.disease.uid, "Disease",
                "INDICATES",
                {
                    'sensitivity': getattr(indicate, 'sensitivity', None),
                    'specificity': getattr(indicate, 'specificity', None)
                }
            )
        counts['indicates'] = len(indicates)
        
        logger.info(f"Sync complete: {counts}")
        return counts
    
    async def incremental_sync(self, since_datetime: datetime):
        """Sync only records created/updated since given datetime"""
        counts = {}
        
        # Query only recent records
        result = await self.pg.execute(
            select(Gene).where(Gene.created_at >= since_datetime)
        )
        recent_genes = result.scalars().all()
        
        for gene in recent_genes:
            await self.sync_entity(gene, "Gene")
        counts['genes'] = len(recent_genes)
        
        # Continue for other entities...
        result = await self.pg.execute(
            select(Protein).where(Protein.created_at >= since_datetime)
        )
        recent_proteins = result.scalars().all()
        
        for protein in recent_proteins:
            await self.sync_entity(protein, "Protein")
        counts['proteins'] = len(recent_proteins)
        
        logger.info(f"Incremental sync completed: {counts} since {since_datetime}")
        return counts

    # Graph query methods for your subrouters
    async def get_gene_network(self, gene_uid: str, depth: int = 2) -> List[Dict]:
        """Get gene interaction network from Neo4j"""
        async with self.neo4j.session() as session:
            # Build query with literal depth value (Neo4j doesn't allow parameters in relationship patterns)
            query = f"""
            MATCH path = (g:Gene {{uid: $uid}})-[*1..{depth}]-(connected)
            WHERE connected:Gene OR connected:Protein OR connected:Pathway OR connected:Disease
            RETURN DISTINCT connected.uid as uid, 
                   connected.name as name,
                   labels(connected)[0] as type,
                   length(path) as distance
            ORDER BY distance
            LIMIT 100
            """
            result = await session.run(query, uid=gene_uid)
            
            network = []
            async for record in result:
                network.append({
                    "uid": record["uid"],
                    "name": record["name"],
                    "type": record["type"],
                    "distance": record["distance"]
                })
            
            return network

    async def find_treatment_paths(self, gene_uid: str) -> List[Dict]:
        """Find all treatments connected to a gene through any path"""
        async with self.neo4j.session() as session:
            query = """
            MATCH path = (g:Gene {uid: $uid})-[*]-(t:Treatment)
            WITH t, min(length(path)) as minDistance
            RETURN DISTINCT t.uid as uid,
                   t.name as name,
                   t.treatment_type as type,
                   t.availability as availability,
                   minDistance as distance
            ORDER BY distance
            LIMIT 50
            """
            result = await session.run(query, uid=gene_uid)
            
            treatments = []
            async for record in result:
                treatments.append({
                    "uid": record["uid"],
                    "name": record["name"],
                    "type": record["type"],
                    "availability": record["availability"],
                    "distance": record["distance"]
                })
            
            return treatments

    async def find_similar_treatments(self, treatment_uid: str) -> List[Dict]:
        """Find treatments with similar biological targets"""
        async with self.neo4j.session() as session:
            query = """
            MATCH (t1:Treatment {uid: $uid})-[:TREATS|ENHANCES]->()<-[:TREATS|ENHANCES]-(t2:Treatment)
            WHERE t1 <> t2
            WITH t2, COUNT(*) as common_targets
            RETURN t2.uid as uid, t2.name as name, 
                   t2.treatment_type as type, common_targets
            ORDER BY common_targets DESC
            LIMIT 10
            """
            result = await session.run(query, uid=treatment_uid)
            
            similar = []
            async for record in result:
                similar.append({
                    "uid": record["uid"],
                    "name": record["name"],
                    "type": record["type"],
                    "common_targets": record["common_targets"]
                })
            
            return similar