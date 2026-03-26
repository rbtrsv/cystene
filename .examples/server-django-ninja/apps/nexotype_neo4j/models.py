from neomodel import (
    StructuredNode, StringProperty, IntegerProperty, FloatProperty,
    RelationshipTo, RelationshipFrom, ArrayProperty, UniqueIdProperty,
    One, ZeroOrMore
)
from neomodel import adb
from django.conf import settings
import datetime

class Gene(StructuredNode):
    """Gene node representing a genomic region encoding a functional product"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    ensembl_id = StringProperty(index=True)
    chromosome = StringProperty()
    start_position = IntegerProperty()
    end_position = IntegerProperty()
    species = StringProperty(default="Homo sapiens")
    gene_type = StringProperty()
    created_at = StringProperty(default=lambda: datetime.datetime.now().isoformat())
    
    # Relationships
    proteins = RelationshipTo('Protein', 'ENCODES', cardinality=ZeroOrMore)
    pathways = RelationshipTo('Pathway', 'PARTICIPATES_IN', cardinality=ZeroOrMore)
    diseases = RelationshipTo('Disease', 'ASSOCIATED_WITH', cardinality=ZeroOrMore)
    variants = RelationshipFrom('Variant', 'VARIANT_OF', cardinality=ZeroOrMore)
    
    async def get_encoded_proteins(self):
        """Get all proteins encoded by this gene"""
        return await self.proteins.all()
    
    async def get_pathways(self):
        """Get all pathways this gene participates in"""
        return await self.pathways.all()
    
    async def get_associated_diseases(self):
        """Get all diseases associated with this gene"""
        return await self.diseases.all()
    
    async def find_related_genes(self, max_distance=2):
        """Find genes related through pathways within a certain distance"""
        query = f"""
        MATCH (this:Gene {{uid: $uid}})-[:PARTICIPATES_IN]->(p:Pathway)<-[:PARTICIPATES_IN]-(related:Gene)
        WHERE related.uid <> this.uid
        RETURN DISTINCT related
        LIMIT 100
        """
        results, meta = await adb.cypher_query(query, {"uid": self.uid})
        return [Gene.inflate(row[0]) for row in results]


class Protein(StructuredNode):
    """Protein node representing a functional product encoded by genes"""
    uid = UniqueIdProperty()
    uniprot_id = StringProperty(unique_index=True)
    name = StringProperty(index=True)
    sequence = StringProperty()
    molecular_weight = FloatProperty()
    isoelectric_point = FloatProperty()
    created_at = StringProperty(default=lambda: datetime.datetime.now().isoformat())
    
    # Relationships
    genes = RelationshipFrom('Gene', 'ENCODES', cardinality=ZeroOrMore)
    interactions = RelationshipTo('Protein', 'INTERACTS_WITH', cardinality=ZeroOrMore)
    domains = RelationshipTo('ProteinDomain', 'HAS_DOMAIN', cardinality=ZeroOrMore)
    peptides = RelationshipTo('Peptide', 'CONTAINS', cardinality=ZeroOrMore)
    pathways = RelationshipTo('Pathway', 'PARTICIPATES_IN', cardinality=ZeroOrMore)
    
    async def get_encoding_genes(self):
        """Get all genes that encode this protein"""
        return await self.genes.all()
    
    async def get_interacting_proteins(self):
        """Get all proteins that interact with this protein"""
        return await self.interactions.all()
    
    async def get_peptides(self):
        """Get all peptides contained in this protein"""
        return await self.peptides.all()
    
    async def get_interaction_network(self, depth=2):
        """Get the protein-protein interaction network up to a certain depth"""
        query = f"""
        MATCH path = (this:Protein {{uid: $uid}})-[:INTERACTS_WITH*1..{depth}]-(other:Protein)
        RETURN DISTINCT other
        LIMIT 100
        """
        results, meta = await adb.cypher_query(query, {"uid": self.uid})
        return [Protein.inflate(row[0]) for row in results]


class Peptide(StructuredNode):
    """Peptide node representing a short chain of amino acids"""
    uid = UniqueIdProperty()
    sequence = StringProperty(unique_index=True)
    length = IntegerProperty()
    molecular_weight = FloatProperty()
    isoelectric_point = FloatProperty()
    created_at = StringProperty(default=lambda: datetime.datetime.now().isoformat())
    
    # Relationships
    parent_proteins = RelationshipFrom('Protein', 'CONTAINS', cardinality=ZeroOrMore)
    activities = RelationshipTo('BioActivity', 'HAS_ACTIVITY', cardinality=ZeroOrMore)
    similar_peptides = RelationshipTo('Peptide', 'SIMILAR_TO', cardinality=ZeroOrMore)
    
    # Properties for peptide discovery
    predicted_activities = ArrayProperty()
    synthesis_difficulty = IntegerProperty()
    stability_score = FloatProperty()
    
    async def get_parent_proteins(self):
        """Get all proteins that contain this peptide"""
        return await self.parent_proteins.all()
    
    async def get_activities(self):
        """Get all biological activities of this peptide"""
        return await self.activities.all()
    
    async def get_similar_peptides(self, similarity_threshold=0.7):
        """Get peptides similar to this one above a certain threshold"""
        query = """
        MATCH (this:Peptide {uid: $uid})-[r:SIMILAR_TO]->(similar:Peptide)
        WHERE r.similarity_score >= $threshold
        RETURN similar, r.similarity_score as score
        ORDER BY score DESC
        """
        results, meta = await adb.cypher_query(query, {"uid": self.uid, "threshold": similarity_threshold})
        return [(Peptide.inflate(row[0]), row[1]) for row in results]
    
    async def add_similar_peptide(self, peptide, similarity_score):
        """Add a similarity relationship to another peptide"""
        rel = await self.similar_peptides.connect(peptide)
        rel.similarity_score = similarity_score
        await rel.save()
        return rel


class Pathway(StructuredNode):
    """Pathway node representing biological processes"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    kegg_id = StringProperty(index=True)
    description = StringProperty()
    pathway_type = StringProperty()
    created_at = StringProperty(default=lambda: datetime.datetime.now().isoformat())
    
    # Relationships
    genes = RelationshipFrom('Gene', 'PARTICIPATES_IN', cardinality=ZeroOrMore)
    proteins = RelationshipFrom('Protein', 'PARTICIPATES_IN', cardinality=ZeroOrMore)
    parent_pathways = RelationshipTo('Pathway', 'IS_PART_OF', cardinality=ZeroOrMore)
    child_pathways = RelationshipFrom('Pathway', 'IS_PART_OF', cardinality=ZeroOrMore)
    
    async def get_genes(self):
        """Get all genes involved in this pathway"""
        return await self.genes.all()
    
    async def get_proteins(self):
        """Get all proteins involved in this pathway"""
        return await self.proteins.all()
    
    async def get_parent_pathways(self):
        """Get all parent pathways this pathway is part of"""
        return await self.parent_pathways.all()
    
    async def get_child_pathways(self):
        """Get all child pathways that are part of this pathway"""
        return await self.child_pathways.all()


class Disease(StructuredNode):
    """Disease node representing pathological conditions"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    omim_id = StringProperty(index=True)
    description = StringProperty()
    disease_class = StringProperty()
    created_at = StringProperty(default=lambda: datetime.datetime.now().isoformat())
    
    # Relationships
    associated_genes = RelationshipFrom('Gene', 'ASSOCIATED_WITH', cardinality=ZeroOrMore)
    biomarkers = RelationshipFrom('Biomarker', 'INDICATES', cardinality=ZeroOrMore)
    treatments = RelationshipFrom('Treatment', 'TREATS', cardinality=ZeroOrMore)
    
    async def get_associated_genes(self):
        """Get all genes associated with this disease"""
        return await self.associated_genes.all()
    
    async def get_biomarkers(self):
        """Get all biomarkers that indicate this disease"""
        return await self.biomarkers.all()
    
    async def get_treatments(self):
        """Get all treatments for this disease"""
        return await self.treatments.all()
    
    async def find_related_diseases(self):
        """Find diseases related through common genes"""
        query = """
        MATCH (this:Disease {uid: $uid})<-[:ASSOCIATED_WITH]-(g:Gene)-[:ASSOCIATED_WITH]->(related:Disease)
        WHERE related.uid <> this.uid
        RETURN DISTINCT related, count(g) as common_genes
        ORDER BY common_genes DESC
        """
        results, meta = await adb.cypher_query(query, {"uid": self.uid})
        return [(Disease.inflate(row[0]), row[1]) for row in results]


class BioActivity(StructuredNode):
    """BioActivity node representing biological functions"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    activity_type = StringProperty()
    
    # Relationships
    peptides = RelationshipFrom('Peptide', 'HAS_ACTIVITY', cardinality=ZeroOrMore)
    
    async def get_peptides(self):
        """Get all peptides with this activity"""
        return await self.peptides.all()


class ProteinDomain(StructuredNode):
    """ProteinDomain node representing functional regions in proteins"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    pfam_id = StringProperty(index=True)
    
    # Relationships
    proteins = RelationshipFrom('Protein', 'HAS_DOMAIN', cardinality=ZeroOrMore)
    
    async def get_proteins(self):
        """Get all proteins with this domain"""
        return await self.proteins.all()


class Variant(StructuredNode):
    """Variant node representing genetic variations"""
    uid = UniqueIdProperty()
    name = StringProperty()
    rs_id = StringProperty(index=True)
    chromosome = StringProperty()
    position = IntegerProperty()
    reference_allele = StringProperty()
    alternate_allele = StringProperty()
    
    # Relationships
    gene = RelationshipTo('Gene', 'VARIANT_OF', cardinality=One)
    phenotypes = RelationshipTo('Phenotype', 'CAUSES', cardinality=ZeroOrMore)
    
    async def get_gene(self):
        """Get the gene this variant is associated with"""
        return await self.gene.single()
    
    async def get_phenotypes(self):
        """Get all phenotypes caused by this variant"""
        return await self.phenotypes.all()


class Phenotype(StructuredNode):
    """Phenotype node representing observable characteristics"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    
    # Relationships
    variants = RelationshipFrom('Variant', 'CAUSES', cardinality=ZeroOrMore)
    
    async def get_variants(self):
        """Get all variants that cause this phenotype"""
        return await self.variants.all()


class Treatment(StructuredNode):
    """Treatment node representing therapeutic interventions"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    treatment_type = StringProperty()
    
    # Relationships
    diseases = RelationshipTo('Disease', 'TREATS', cardinality=ZeroOrMore)
    
    async def get_diseases(self):
        """Get all diseases treated by this treatment"""
        return await self.diseases.all()


class Biomarker(StructuredNode):
    """Biomarker node representing indicators of biological states"""
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    biomarker_type = StringProperty()
    
    # Relationships
    diseases = RelationshipTo('Disease', 'INDICATES', cardinality=ZeroOrMore)
    
    async def get_diseases(self):
        """Get all diseases indicated by this biomarker"""
        return await self.diseases.all()