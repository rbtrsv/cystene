from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Pathway, Gene, Protein
from ..schemas.pathway_schemas import (
    PathwayCreate, PathwayUpdate, PathwayDetail, 
    PathwaySearchParams, PathwayResponse, PathwayListResponse
)
from ..utils.neo4j_utils import (
    get_neo4j_connection, execute_cypher, paginate_results
)

router = Router(tags=["Neo4j Pathways"])

@router.get("/", response=PathwayListResponse)
def list_pathways(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List pathways with optional pagination
    
    This endpoint:
    1. Retrieves pathways from the Neo4j database
    2. Returns a paginated list of pathways
    """
    try:
        pathways = Pathway.nodes.all()[offset:offset+limit]
        count = len(Pathway.nodes.all())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id,
                    "description": p.description,
                    "pathway_type": p.pathway_type,
                    "created_at": p.created_at
                }
                for p in pathways
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in list_pathways: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{pathway_id}", response=PathwayResponse)
def get_pathway(request: HttpRequest, pathway_id: str):
    """
    Get details for a specific pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns the pathway details
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(pathway.uid),
                "name": pathway.name,
                "kegg_id": pathway.kegg_id,
                "description": pathway.description,
                "pathway_type": pathway.pathway_type,
                "created_at": pathway.created_at
            }
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in get_pathway: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/", response=PathwayResponse)
def create_pathway(request: HttpRequest, data: PathwayCreate):
    """
    Create a new pathway
    
    This endpoint:
    1. Creates a new pathway with the provided data
    2. Returns the created pathway details
    """
    try:
        # Check if pathway already exists
        existing = Pathway.nodes.filter(kegg_id=data.kegg_id)
        if existing:
            return {
                "success": False,
                "data": None,
                "error": f"Pathway with KEGG ID {data.kegg_id} already exists"
            }
        
        # Create pathway
        pathway = Pathway(
            name=data.name,
            kegg_id=data.kegg_id,
            description=data.description,
            pathway_type=data.pathway_type
        ).save()
        
        return {
            "success": True,
            "data": {
                "uid": str(pathway.uid),
                "name": pathway.name,
                "kegg_id": pathway.kegg_id,
                "description": pathway.description,
                "pathway_type": pathway.pathway_type,
                "created_at": pathway.created_at
            }
        }
    except Exception as e:
        print(f"Error in create_pathway: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.put("/{pathway_id}", response=PathwayResponse)
def update_pathway(request: HttpRequest, pathway_id: str, data: PathwayUpdate):
    """
    Update a pathway
    
    This endpoint:
    1. Updates a pathway with the provided data
    2. Returns the updated pathway details
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        
        if data.name:
            pathway.name = data.name
        if data.kegg_id:
            pathway.kegg_id = data.kegg_id
        if data.description:
            pathway.description = data.description
        if data.pathway_type:
            pathway.pathway_type = data.pathway_type
        
        pathway.save()
        
        return {
            "success": True,
            "data": {
                "uid": str(pathway.uid),
                "name": pathway.name,
                "kegg_id": pathway.kegg_id,
                "description": pathway.description,
                "pathway_type": pathway.pathway_type,
                "created_at": pathway.created_at
            }
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in update_pathway: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.delete("/{pathway_id}", response=Dict[str, Any])
def delete_pathway(request: HttpRequest, pathway_id: str):
    """
    Delete a pathway
    
    This endpoint:
    1. Deletes a pathway from the database
    2. Returns a success message
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        name = pathway.name
        pathway.delete()
        
        return {
            "success": True,
            "message": f"Pathway {name} has been deleted"
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in delete_pathway: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/search", response=PathwayListResponse)
def search_pathways(request: HttpRequest, search_params: PathwaySearchParams):
    """
    Search for pathways with specific criteria
    
    This endpoint:
    1. Searches for pathways matching the criteria
    2. Returns a list of matching pathways
    """
    try:
        query_parts = []
        params = {}
        
        if search_params.name:
            query_parts.append("p.name =~ $name")
            params["name"] = f".*{search_params.name}.*"
        
        if search_params.kegg_id:
            query_parts.append("p.kegg_id =~ $kegg_id")
            params["kegg_id"] = f".*{search_params.kegg_id}.*"
        
        if search_params.pathway_type:
            query_parts.append("p.pathway_type = $pathway_type")
            params["pathway_type"] = search_params.pathway_type
        
        if search_params.has_gene:
            query_parts.append("(p)<-[:PARTICIPATES_IN]-(:Gene {ensembl_id: $gene_id})")
            params["gene_id"] = search_params.has_gene
        
        if search_params.has_protein:
            query_parts.append("(p)<-[:PARTICIPATES_IN]-(:Protein {uniprot_id: $protein_id})")
            params["protein_id"] = search_params.has_protein
        
        if not query_parts:
            return {
                "success": False,
                "data": None,
                "count": 0,
                "error": "No search criteria provided"
            }
        
        query = "MATCH (p:Pathway) WHERE " + " AND ".join(query_parts) + " RETURN p"
        
        results, _ = execute_cypher(query, params)
        
        pathways = [Pathway.inflate(result[0]) for result in results]
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id,
                    "description": p.description,
                    "pathway_type": p.pathway_type,
                    "created_at": p.created_at
                }
                for p in pathways
            ],
            "count": len(pathways)
        }
    except Exception as e:
        print(f"Error in search_pathways: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{pathway_id}/genes", response=Dict[str, Any])
def get_pathway_genes(request: HttpRequest, pathway_id: str):
    """
    Get genes that participate in this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns the genes that participate in it
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        genes = pathway.get_genes()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(g.uid),
                    "name": g.name,
                    "ensembl_id": g.ensembl_id
                }
                for g in genes
            ],
            "count": len(genes)
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in get_pathway_genes: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{pathway_id}/proteins", response=Dict[str, Any])
def get_pathway_proteins(request: HttpRequest, pathway_id: str):
    """
    Get proteins that participate in this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns the proteins that participate in it
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        proteins = pathway.get_proteins()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "uniprot_id": p.uniprot_id
                }
                for p in proteins
            ],
            "count": len(proteins)
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in get_pathway_proteins: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{pathway_id}/add_gene/{gene_id}", response=Dict[str, Any])
def add_pathway_gene(
    request: HttpRequest, 
    pathway_id: str, 
    gene_id: str
):
    """
    Add a gene to a pathway
    
    This endpoint:
    1. Retrieves a pathway and gene by ID
    2. Creates a PARTICIPATES_IN relationship
    3. Returns a success message
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        gene = Gene.nodes.get(uid=gene_id)
        
        # Create relationship
        gene.pathways.connect(pathway)
        
        return {
            "success": True,
            "message": f"Gene {gene.name} added to pathway {pathway.name}"
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in add_pathway_gene: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{parent_id}/add_child_pathway/{child_id}", response=Dict[str, Any])
def add_child_pathway(
    request: HttpRequest, 
    parent_id: str, 
    child_id: str
):
    """
    Add a child pathway to a parent pathway
    
    This endpoint:
    1. Retrieves both pathways by ID
    2. Creates an IS_PART_OF relationship from child to parent
    3. Returns a success message
    """
    try:
        parent_pathway = Pathway.nodes.get(uid=parent_id)
        child_pathway = Pathway.nodes.get(uid=child_id)
        
        # Create relationship
        child_pathway.parent_pathways.connect(parent_pathway)
        
        return {
            "success": True,
            "message": f"Pathway {child_pathway.name} added as child of {parent_pathway.name}"
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"One of the pathways was not found"
        }
    except Exception as e:
        print(f"Error in add_child_pathway: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{pathway_id}/parent_pathways", response=Dict[str, Any])
def get_parent_pathways(request: HttpRequest, pathway_id: str):
    """
    Get parent pathways of this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns its parent pathways
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        parents = pathway.get_parent_pathways()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id
                }
                for p in parents
            ],
            "count": len(parents)
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in get_parent_pathways: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{pathway_id}/child_pathways", response=Dict[str, Any])
def get_child_pathways(request: HttpRequest, pathway_id: str):
    """
    Get child pathways of this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns its child pathways
    """
    try:
        pathway = Pathway.nodes.get(uid=pathway_id)
        children = pathway.get_child_pathways()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id
                }
                for p in children
            ],
            "count": len(children)
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in get_child_pathways: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }