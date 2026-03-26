from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Pathway, Gene, Protein
from ..schemas.pathway_schemas import (
    PathwayCreate, PathwayUpdate, PathwayDetail, 
    PathwaySearchParams, PathwayResponse, PathwayListResponse
)
from ..utils.surreal_connection_utils import (
    get_surreal_connection, run_async, execute_query,
    paginate_results, create_record, update_record, delete_record
)

router = Router(tags=["SurrealDB Pathways"])

@router.get("/", response=PathwayListResponse)
def list_pathways(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List pathways with optional pagination
    
    This endpoint:
    1. Retrieves pathways from the SurrealDB database
    2. Returns a paginated list of pathways
    """
    try:
        async def get_pathways():
            db = await get_surreal_connection()
            result, total = await paginate_results(
                "SELECT * FROM pathway", 
                {"limit": limit, "offset": offset},
                page=1,
                page_size=limit
            )
            
            pathways = []
            if result and result[0].get('result'):
                pathways = result[0]['result']
            
            return pathways, total
        
        pathways, count = run_async(get_pathways())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": p.get('id', '').replace('pathway:', ''),
                    "name": p.get('name', ''),
                    "kegg_id": p.get('kegg_id', ''),
                    "description": p.get('description', ''),
                    "pathway_type": p.get('pathway_type', ''),
                    "created_at": p.get('created_at', '')
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
        async def get_pathway_by_id():
            db = await get_surreal_connection()
            result = await db.select(f"pathway:{pathway_id}")
            if not result:
                return None
            return result
        
        pathway = run_async(get_pathway_by_id())
        
        if not pathway:
            return {
                "success": False,
                "data": None,
                "error": f"Pathway with ID {pathway_id} not found"
            }
        
        return {
            "success": True,
            "data": {
                "uid": pathway_id,
                "name": pathway.get('name', ''),
                "kegg_id": pathway.get('kegg_id', ''),
                "description": pathway.get('description', ''),
                "pathway_type": pathway.get('pathway_type', ''),
                "created_at": pathway.get('created_at', '')
            }
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
        async def do_create_pathway():
            db = await get_surreal_connection()
            
            # Check if pathway already exists
            result = await db.query(
                "SELECT * FROM pathway WHERE kegg_id = $kegg_id",
                {"kegg_id": data.kegg_id}
            )
            
            if result and result[0].get('result') and len(result[0]['result']) > 0:
                return None, f"Pathway with KEGG ID {data.kegg_id} already exists"
            
            # Create pathway data
            pathway_data = {
                "name": data.name,
                "kegg_id": data.kegg_id,
                "description": data.description,
                "pathway_type": data.pathway_type
            }
            
            # Create pathway
            created = await db.create("pathway", pathway_data)
            return created, None
        
        pathway, error = run_async(do_create_pathway())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        pathway_id = pathway.get('id', '').replace('pathway:', '')
        
        return {
            "success": True,
            "data": {
                "uid": pathway_id,
                "name": pathway.get('name', ''),
                "kegg_id": pathway.get('kegg_id', ''),
                "description": pathway.get('description', ''),
                "pathway_type": pathway.get('pathway_type', ''),
                "created_at": pathway.get('created_at', '')
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
        async def do_update_pathway():
            db = await get_surreal_connection()
            
            # Check if pathway exists
            existing = await db.select(f"pathway:{pathway_id}")
            if not existing:
                return None, f"Pathway with ID {pathway_id} not found"
            
            # Prepare update data
            update_data = {}
            if data.name:
                update_data["name"] = data.name
            if data.kegg_id:
                update_data["kegg_id"] = data.kegg_id
            if data.description:
                update_data["description"] = data.description
            if data.pathway_type:
                update_data["pathway_type"] = data.pathway_type
            
            # Update pathway
            updated = await db.update(f"pathway:{pathway_id}", update_data)
            return updated, None
        
        pathway, error = run_async(do_update_pathway())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        return {
            "success": True,
            "data": {
                "uid": pathway_id,
                "name": pathway.get('name', ''),
                "kegg_id": pathway.get('kegg_id', ''),
                "description": pathway.get('description', ''),
                "pathway_type": pathway.get('pathway_type', ''),
                "created_at": pathway.get('created_at', '')
            }
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
        async def do_delete_pathway():
            db = await get_surreal_connection()
            
            # Check if pathway exists
            existing = await db.select(f"pathway:{pathway_id}")
            if not existing:
                return None, f"Pathway with ID {pathway_id} not found"
            
            name = existing.get('name', '')
            
            # Delete pathway
            await db.delete(f"pathway:{pathway_id}")
            
            return name, None
        
        name, error = run_async(do_delete_pathway())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Pathway {name} has been deleted"
        }
    except Exception as e:
        print(f"Error in delete_pathway: {str(e)}")
        return {
            "success": False,
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
        async def do_get_genes():
            db = await get_surreal_connection()
            
            # Check if pathway exists
            existing = await db.select(f"pathway:{pathway_id}")
            if not existing:
                return None, f"Pathway with ID {pathway_id} not found"
            
            # Get genes
            result = await db.query("""
                SELECT <-gene_participates_in<-gene.* as genes
                FROM pathway:$pathway_id
                FETCH genes;
            """, {"pathway_id": pathway_id})
            
            genes = []
            if result and result[0].get('result') and result[0]['result'][0].get('genes'):
                genes = result[0]['result'][0]['genes']
            
            return genes, None
        
        genes, error = run_async(do_get_genes())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "uid": g.get('id', '').replace('gene:', ''),
                    "name": g.get('name', ''),
                    "ensembl_id": g.get('ensembl_id', '')
                }
                for g in genes
            ],
            "count": len(genes)
        }
    except Exception as e:
        print(f"Error in get_pathway_genes: {str(e)}")
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
        async def do_add_gene():
            db = await get_surreal_connection()
            
            # Check if pathway exists
            pathway = await db.select(f"pathway:{pathway_id}")
            if not pathway:
                return None, f"Pathway with ID {pathway_id} not found"
            
            # Check if gene exists
            gene = await db.select(f"gene:{gene_id}")
            if not gene:
                return None, f"Gene with ID {gene_id} not found"
            
            # Create relationship
            await db.query(
                "RELATE gene:$gene_id->gene_participates_in->pathway:$pathway_id;",
                {"gene_id": gene_id, "pathway_id": pathway_id}
            )
            
            return {
                "pathway_name": pathway.get('name', ''),
                "gene_name": gene.get('name', '')
            }, None
        
        result, error = run_async(do_add_gene())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Gene {result['gene_name']} added to pathway {result['pathway_name']}"
        }
    except Exception as e:
        print(f"Error in add_pathway_gene: {str(e)}")
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
        async def do_get_proteins():
            db = await get_surreal_connection()
            
            # Check if pathway exists
            existing = await db.select(f"pathway:{pathway_id}")
            if not existing:
                return None, f"Pathway with ID {pathway_id} not found"
            
            # Get proteins
            result = await db.query("""
                SELECT <-protein_participates_in<-protein.* as proteins
                FROM pathway:$pathway_id
                FETCH proteins;
            """, {"pathway_id": pathway_id})
            
            proteins = []
            if result and result[0].get('result') and result[0]['result'][0].get('proteins'):
                proteins = result[0]['result'][0]['proteins']
            
            return proteins, None
        
        proteins, error = run_async(do_get_proteins())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "uid": p.get('id', '').replace('protein:', ''),
                    "name": p.get('name', ''),
                    "uniprot_id": p.get('uniprot_id', '')
                }
                for p in proteins
            ],
            "count": len(proteins)
        }
    except Exception as e:
        print(f"Error in get_pathway_proteins: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }
