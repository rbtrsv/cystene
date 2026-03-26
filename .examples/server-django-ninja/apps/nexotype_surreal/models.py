import datetime
from typing import List, Optional
from pydantic import BaseModel
from .utils.surreal_connection_utils import get_surreal_connection 


class Gene(BaseModel):
    """Gene model representing a genomic region encoding a functional product"""
    uid: str
    name: str
    ensembl_id: str
    chromosome: str
    start_position: int
    end_position: int
    species: str = "Homo sapiens"
    gene_type: str
    created_at: Optional[str] = None
    
    def __init__(self, **data):
        if "created_at" not in data or data["created_at"] is None:
            data["created_at"] = datetime.datetime.now().isoformat()
        super().__init__(**data)
    
    @classmethod
    async def create(cls, **data):
        """Create a gene record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        # Assuming db.create is async in AsyncSurreal
        result = await db.create("gene", instance.dict()) 
        # Assuming result is a dict or list of dicts
        return cls(**(result[0] if isinstance(result, list) else result)) 
    
    @classmethod
    async def get(cls, id: str):
        """Get a gene by ID"""
        db = await get_surreal_connection() # Added await
        # Assuming db.select is async
        result = await db.select(f"gene:{id}") 
        if result:
             # Assuming result is a list containing the record dict
            return cls(**result[0])
        return None
    
    async def get_encoded_proteins(self):
        """Get all proteins encoded by this gene"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->encodes->protein 
        FROM gene:{self.uid}
        """
        # Assuming db.query is async
        result = await db.query(query) 
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_pathways(self):
        """Get all pathways this gene participates in"""
        db = await get_surreal_connection() # Added await
        # Use the corrected relation name
        query = f"""
        SELECT ->gene_participates_in->pathway 
        FROM gene:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_associated_diseases(self):
        """Get all diseases associated with this gene"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->associated_with->disease 
        FROM gene:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def find_related_genes(self, max_distance=2):
        """Find genes related through pathways within a certain distance"""
        db = await get_surreal_connection() # Added await
        # Use the corrected relation name
        query = f"""
        SELECT related 
        FROM (
            SELECT gene AS related
            FROM (
                SELECT <-gene_participates_in<-gene AS gene 
                FROM (
                    SELECT ->gene_participates_in->pathway AS pathway 
                    FROM gene:{self.uid}
                )
            )
        )
        WHERE related.id != gene:{self.uid}
        LIMIT 100
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Protein(BaseModel):
    """Protein model representing a functional product encoded by genes"""
    uid: str
    uniprot_id: str
    name: str
    sequence: str
    molecular_weight: float
    isoelectric_point: float
    created_at: Optional[str] = None
    
    def __init__(self, **data):
        if "created_at" not in data or data["created_at"] is None:
            data["created_at"] = datetime.datetime.now().isoformat()
        super().__init__(**data)
    
    @classmethod
    async def create(cls, **data):
        """Create a protein record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("protein", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a protein by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"protein:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_encoding_genes(self):
        """Get all genes that encode this protein"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-encodes<-gene 
        FROM protein:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_interacting_proteins(self):
        """Get all proteins that interact with this protein"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->interacts_with->protein 
        FROM protein:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_peptides(self):
        """Get all peptides contained in this protein"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->contains->peptide 
        FROM protein:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_interaction_network(self, depth=2):
        """Get the protein-protein interaction network up to a certain depth"""
        db = await get_surreal_connection() # Added await
        # Note: K-hop path queries might have different syntax/support in async
        query = f"""
        SELECT * FROM protein WHERE id IN (
            SELECT VALUE out FROM (SELECT ->interacts_with^{depth} FROM protein:{self.uid})
        )
        """ # Rewrote query for potentially better compatibility
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Peptide(BaseModel):
    """Peptide model representing a short chain of amino acids"""
    uid: str
    sequence: str
    length: int
    molecular_weight: float
    isoelectric_point: float
    created_at: Optional[str] = None
    predicted_activities: List[str] = []
    synthesis_difficulty: int
    stability_score: float
    
    def __init__(self, **data):
        if "created_at" not in data or data["created_at"] is None:
            data["created_at"] = datetime.datetime.now().isoformat()
        super().__init__(**data)
    
    @classmethod
    async def create(cls, **data):
        """Create a peptide record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("peptide", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a peptide by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"peptide:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_parent_proteins(self):
        """Get all proteins that contain this peptide"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-contains<-protein 
        FROM peptide:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_activities(self):
        """Get all biological activities of this peptide"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->has_activity->bio_activity 
        FROM peptide:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_similar_peptides(self, similarity_threshold=0.7):
        """Get peptides similar to this one above a certain threshold"""
        db = await get_surreal_connection() # Added await
        # Using LET for threshold might be safer
        query = f"""
        LET $th = {similarity_threshold};
        SELECT ->similar_to[WHERE similarity_score >= $th]->peptide.* AS similar, 
               ->similar_to[WHERE similarity_score >= $th].similarity_score AS score
        FROM peptide:{self.uid}
        ORDER BY score DESC;
        """ # Rewrote query slightly
        result = await db.query(query) # Added await
        # Result format might differ slightly with LET
        return result[0]["result"] if result and result[0]["result"] else [] 
    
    async def add_similar_peptide(self, peptide_id: str, similarity_score: float):
        """Add a similarity relationship to another peptide"""
        db = await get_surreal_connection() # Added await
        query = f"""
        RELATE peptide:{self.uid}->similar_to->peptide:{peptide_id}
        SET similarity_score = {similarity_score}
        """
        result = await db.query(query) # Added await
        return result


class Pathway(BaseModel):
    """Pathway model representing biological processes"""
    uid: str
    name: str
    kegg_id: str
    description: str
    pathway_type: str
    created_at: Optional[str] = None
    
    def __init__(self, **data):
        if "created_at" not in data or data["created_at"] is None:
            data["created_at"] = datetime.datetime.now().isoformat()
        super().__init__(**data)
    
    @classmethod
    async def create(cls, **data):
        """Create a pathway record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("pathway", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a pathway by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"pathway:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_genes(self):
        """Get all genes involved in this pathway"""
        db = await get_surreal_connection() # Added await
        # Use corrected relation name
        query = f"""
        SELECT <-gene_participates_in<-gene 
        FROM pathway:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_proteins(self):
        """Get all proteins involved in this pathway"""
        db = await get_surreal_connection() # Added await
         # Use corrected relation name
        query = f"""
        SELECT <-protein_participates_in<-protein 
        FROM pathway:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_parent_pathways(self):
        """Get all parent pathways this pathway is part of"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->is_part_of->pathway 
        FROM pathway:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_child_pathways(self):
        """Get all child pathways that are part of this pathway"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-is_part_of<-pathway 
        FROM pathway:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Disease(BaseModel):
    """Disease model representing pathological conditions"""
    uid: str
    name: str
    omim_id: str
    description: str
    disease_class: str
    created_at: Optional[str] = None
    
    def __init__(self, **data):
        if "created_at" not in data or data["created_at"] is None:
            data["created_at"] = datetime.datetime.now().isoformat()
        super().__init__(**data)
    
    @classmethod
    async def create(cls, **data):
        """Create a disease record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("disease", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a disease by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"disease:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_associated_genes(self):
        """Get all genes associated with this disease"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-associated_with<-gene 
        FROM disease:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_biomarkers(self):
        """Get all biomarkers that indicate this disease"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-indicates<-biomarker 
        FROM disease:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def get_treatments(self):
        """Get all treatments for this disease"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-treats<-treatment 
        FROM disease:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
    
    async def find_related_diseases(self):
        """Find diseases related through common genes"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT related, count() AS common_genes
        FROM (SELECT <-associated_with<-gene->associated_with->disease AS related FROM disease:{self.uid})
        WHERE related != disease:{self.uid}
        GROUP BY related
        ORDER BY common_genes DESC;
        """ # Simplified query
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class BioActivity(BaseModel):
    """BioActivity model representing biological functions"""
    uid: str
    name: str
    description: str
    activity_type: str
    
    @classmethod
    async def create(cls, **data):
        """Create a bioactivity record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("bio_activity", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a bioactivity by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"bio_activity:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_peptides(self):
        """Get all peptides with this activity"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-has_activity<-peptide 
        FROM bio_activity:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class ProteinDomain(BaseModel):
    """ProteinDomain model representing functional regions in proteins"""
    uid: str
    name: str
    description: str
    pfam_id: str
    
    @classmethod
    async def create(cls, **data):
        """Create a protein domain record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("protein_domain", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a protein domain by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"protein_domain:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_proteins(self):
        """Get all proteins with this domain"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-has_domain<-protein 
        FROM protein_domain:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Variant(BaseModel):
    """Variant model representing genetic variations"""
    uid: str
    name: str
    rs_id: str
    chromosome: str
    position: int
    reference_allele: str
    alternate_allele: str
    
    @classmethod
    async def create(cls, **data):
        """Create a variant record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("variant", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a variant by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"variant:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_gene(self):
        """Get the gene this variant is associated with"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->variant_of->gene 
        FROM variant:{self.uid}
        """
        result = await db.query(query) # Added await
        # Assuming only one gene per variant
        return result[0]["result"][0] if result and result[0]["result"] else None 
    
    async def get_phenotypes(self):
        """Get all phenotypes caused by this variant"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->causes->phenotype 
        FROM variant:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Phenotype(BaseModel):
    """Phenotype model representing observable characteristics"""
    uid: str
    name: str
    description: str
    
    @classmethod
    async def create(cls, **data):
        """Create a phenotype record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("phenotype", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a phenotype by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"phenotype:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_variants(self):
        """Get all variants that cause this phenotype"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT <-causes<-variant 
        FROM phenotype:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Treatment(BaseModel):
    """Treatment model representing therapeutic interventions"""
    uid: str
    name: str
    description: str
    treatment_type: str
    
    @classmethod
    async def create(cls, **data):
        """Create a treatment record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("treatment", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a treatment by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"treatment:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_diseases(self):
        """Get all diseases treated by this treatment"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->treats->disease 
        FROM treatment:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []


class Biomarker(BaseModel):
    """Biomarker model representing indicators of biological states"""
    uid: str
    name: str
    description: str
    biomarker_type: str
    
    @classmethod
    async def create(cls, **data):
        """Create a biomarker record in SurrealDB"""
        db = await get_surreal_connection() # Added await
        instance = cls(**data)
        result = await db.create("biomarker", instance.dict()) # Added await
        return cls(**(result[0] if isinstance(result, list) else result))
    
    @classmethod
    async def get(cls, id: str):
        """Get a biomarker by ID"""
        db = await get_surreal_connection() # Added await
        result = await db.select(f"biomarker:{id}") # Added await
        if result:
            return cls(**result[0])
        return None
    
    async def get_diseases(self):
        """Get all diseases indicated by this biomarker"""
        db = await get_surreal_connection() # Added await
        query = f"""
        SELECT ->indicates->disease 
        FROM biomarker:{self.uid}
        """
        result = await db.query(query) # Added await
        return result[0]["result"] if result and result[0]["result"] else []
