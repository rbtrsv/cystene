from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Gene, Protein, Pathway, Disease
from ..schemas.gene_schemas import (
    GeneCreate, GeneUpdate, GeneDetail, 
    GeneSearchParams, GeneResponse, GeneListResponse
)
from ..utils.neo4j_utils import (
    get_neo4j_connection, execute_cypher, paginate_results
)

router = Router(tags=["Neo4j Genes"])

@router.get("/", response=GeneListResponse)
def list_genes(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List genes with optional pagination
    
    This endpoint:
    1. Retrieves genes from the Neo4j database
    2. Returns a paginated list of genes
    """
    try:
        genes = Gene.nodes.all()[offset:offset+limit]
        count = len(Gene.nodes.all())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(g.uid),
                    "name": g.name,
                    "ensembl_id": g.ensembl_id,
                    "chromosome": g.chromosome,
                    "start_position": g.start_position,
                    "end_position": g.end_position,
                    "species": g.species,
                    "gene_type": g.gene_type,
                    "created_at": g.created_at
                }
                for g in genes
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in list_genes: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{gene_id}", response=GeneResponse)
def get_gene(request: HttpRequest, gene_id: str):
    """
    Get details for a specific gene
    
    This endpoint:
    1. Retrieves a gene by ID
    2. Returns the gene details
    """
    try:
        gene = Gene.nodes.get(uid=gene_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(gene.uid),
                "name": gene.name,
                "ensembl_id": gene.ensembl_id,
                "chromosome": gene.chromosome,
                "start_position": gene.start_position,
                "end_position": gene.end_position,
                "species": gene.species,
                "gene_type": gene.gene_type,
                "created_at": gene.created_at
            }
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in get_gene: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/", response=GeneResponse)
def create_gene(request: HttpRequest, data: GeneCreate):
    """
    Create a new gene
    
    This endpoint:
    1. Creates a new gene with the provided data
    2. Returns the created gene details
    """
    try:
        # Check if gene already exists
        existing = Gene.nodes.filter(ensembl_id=data.ensembl_id)
        if existing:
            return {
                "success": False,
                "data": None,
                "error": f"Gene with Ensembl ID {data.ensembl_id} already exists"
            }
        
        # Create gene
        gene = Gene(
            name=data.name,
            ensembl_id=data.ensembl_id,
            chromosome=data.chromosome,
            start_position=data.start_position,
            end_position=data.end_position,
            species=data.species,
            gene_type=data.gene_type
        ).save()
        
        return {
            "success": True,
            "data": {
                "uid": str(gene.uid),
                "name": gene.name,
                "ensembl_id": gene.ensembl_id,
                "chromosome": gene.chromosome,
                "start_position": gene.start_position,
                "end_position": gene.end_position,
                "species": gene.species,
                "gene_type": gene.gene_type,
                "created_at": gene.created_at
            }
        }
    except Exception as e:
        print(f"Error in create_gene: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.put("/{gene_id}", response=GeneResponse)
def update_gene(request: HttpRequest, gene_id: str, data: GeneUpdate):
    """
    Update a gene
    
    This endpoint:
    1. Updates a gene with the provided data
    2. Returns the updated gene details
    """
    try:
        gene = Gene.nodes.get(uid=gene_id)
        
        if data.name:
            gene.name = data.name
        if data.ensembl_id:
            gene.ensembl_id = data.ensembl_id
        if data.chromosome:
            gene.chromosome = data.chromosome
        if data.start_position:
            gene.start_position = data.start_position
        if data.end_position:
            gene.end_position = data.end_position
        if data.species:
            gene.species = data.species
        if data.gene_type:
            gene.gene_type = data.gene_type
        
        gene.save()
        
        return {
            "success": True,
            "data": {
                "uid": str(gene.uid),
                "name": gene.name,
                "ensembl_id": gene.ensembl_id,
                "chromosome": gene.chromosome,
                "start_position": gene.start_position,
                "end_position": gene.end_position,
                "species": gene.species,
                "gene_type": gene.gene_type,
                "created_at": gene.created_at
            }
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in update_gene: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.delete("/{gene_id}", response=Dict[str, Any])
def delete_gene(request: HttpRequest, gene_id: str):
    """
    Delete a gene
    
    This endpoint:
    1. Deletes a gene from the database
    2. Returns a success message
    """
    try:
        gene = Gene.nodes.get(uid=gene_id)
        name = gene.name
        gene.delete()
        
        return {
            "success": True,
            "message": f"Gene {name} has been deleted"
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in delete_gene: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/search", response=GeneListResponse)
def search_genes(request: HttpRequest, search_params: GeneSearchParams):
    """
    Search for genes with specific criteria
    
    This endpoint:
    1. Searches for genes matching the criteria
    2. Returns a list of matching genes
    """
    try:
        query_parts = []
        params = {}
        
        if search_params.name:
            query_parts.append("g.name =~ $name")
            params["name"] = f".*{search_params.name}.*"
        
        if search_params.ensembl_id:
            query_parts.append("g.ensembl_id =~ $ensembl_id")
            params["ensembl_id"] = f".*{search_params.ensembl_id}.*"
        
        if search_params.chromosome:
            query_parts.append("g.chromosome = $chromosome")
            params["chromosome"] = search_params.chromosome
        
        if search_params.start_position_min:
            query_parts.append("g.start_position >= $start_position_min")
            params["start_position_min"] = search_params.start_position_min
        
        if search_params.start_position_max:
            query_parts.append("g.start_position <= $start_position_max")
            params["start_position_max"] = search_params.start_position_max
        
        if search_params.end_position_min:
            query_parts.append("g.end_position >= $end_position_min")
            params["end_position_min"] = search_params.end_position_min
        
        if search_params.end_position_max:
            query_parts.append("g.end_position <= $end_position_max")
            params["end_position_max"] = search_params.end_position_max
        
        if search_params.species:
            query_parts.append("g.species = $species")
            params["species"] = search_params.species
        
        if search_params.gene_type:
            query_parts.append("g.gene_type = $gene_type")
            params["gene_type"] = search_params.gene_type
        
        if search_params.associated_disease:
            query_parts.append("(g)-[:ASSOCIATED_WITH]->(:Disease {name: $disease_name})")
            params["disease_name"] = search_params.associated_disease
        
        if search_params.in_pathway:
            query_parts.append("(g)-[:PARTICIPATES_IN]->(:Pathway {name: $pathway_name})")
            params["pathway_name"] = search_params.in_pathway
        
        if not query_parts:
            return {
                "success": False,
                "data": None,
                "count": 0,
                "error": "No search criteria provided"
            }
        
        query = "MATCH (g:Gene) WHERE " + " AND ".join(query_parts) + " RETURN g"
        
        results, _ = execute_cypher(query, params)
        
        genes = [Gene.inflate(result[0]) for result in results]
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(g.uid),
                    "name": g.name,
                    "ensembl_id": g.ensembl_id,
                    "chromosome": g.chromosome,
                    "start_position": g.start_position,
                    "end_position": g.end_position,
                    "species": g.species,
                    "gene_type": g.gene_type,
                    "created_at": g.created_at
                }
                for g in genes
            ],
            "count": len(genes)
        }
    except Exception as e:
        print(f"Error in search_genes: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{gene_id}/proteins", response=Dict[str, Any])
def get_gene_proteins(request: HttpRequest, gene_id: str):
    """
    Get proteins encoded by a gene
    
    This endpoint:
    1. Retrieves a gene by ID
    2. Returns the proteins encoded by the gene
    """
    try:
        gene = Gene.nodes.get(uid=gene_id)
        proteins = gene.get_encoded_proteins()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "uniprot_id": p.uniprot_id,
                    "name": p.name
                }
                for p in proteins
            ],
            "count": len(proteins)
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in get_gene_proteins: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{gene_id}/diseases", response=Dict[str, Any])
def get_gene_diseases(request: HttpRequest, gene_id: str):
    """
    Get diseases associated with a gene
    
    This endpoint:
    1. Retrieves a gene by ID
    2. Returns the diseases associated with the gene
    """
    try:
        gene = Gene.nodes.get(uid=gene_id)
        diseases = gene.get_associated_diseases()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(d.uid),
                    "name": d.name,
                    "omim_id": d.omim_id
                }
                for d in diseases
            ],
            "count": len(diseases)
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in get_gene_diseases: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{gene_id}/encode_protein/{protein_id}", response=Dict[str, Any])
def add_gene_protein_relationship(
    request: HttpRequest, 
    gene_id: str, 
    protein_id: str
):
    """
    Create an ENCODES relationship between a gene and a protein
    
    This endpoint:
    1. Retrieves a gene and protein by ID
    2. Creates an ENCODES relationship from gene to protein
    3. Returns a success message
    """
    try:
        gene = Gene.nodes.get(uid=gene_id)
        protein = Protein.nodes.get(uid=protein_id)
        
        # Create relationship
        gene.proteins.connect(protein)
        
        return {
            "success": True,
            "message": f"Relationship created: Gene {gene.name} ENCODES Protein {protein.name}"
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in add_gene_protein_relationship: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }