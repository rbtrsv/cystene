from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Gene
from ..schemas.gene_schemas import (
    GeneCreate, GeneUpdate, GeneDetail, 
    GeneSearchParams, GeneResponse, GeneListResponse
)
from ..utils.surreal_connection_utils import (
    get_surreal_connection, run_async, execute_query,
    paginate_results, create_record, update_record, delete_record
)

router = Router(tags=["SurrealDB Genes"])

@router.get("/", response=GeneListResponse)
def list_genes(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List genes with optional pagination
    
    This endpoint:
    1. Retrieves genes from the SurrealDB database
    2. Returns a paginated list of genes
    """
    try:
        async def get_genes():
            db = await get_surreal_connection()
            query = "SELECT * FROM gene ORDER BY name LIMIT $limit START $offset"
            result, total = await paginate_results(
                "SELECT * FROM gene", 
                {"limit": limit, "offset": offset},
                page=1,
                page_size=limit
            )
            
            genes = []
            if result and result[0].get('result'):
                genes = result[0]['result']
            
            return genes, total
        
        genes, count = run_async(get_genes())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": g.get('id', '').replace('gene:', ''),
                    "name": g.get('name', ''),
                    "ensembl_id": g.get('ensembl_id', ''),
                    "chromosome": g.get('chromosome', ''),
                    "start_position": g.get('start_position', 0),
                    "end_position": g.get('end_position', 0),
                    "species": g.get('species', 'Homo sapiens'),
                    "gene_type": g.get('gene_type', ''),
                    "created_at": g.get('created_at', '')
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
        async def get_gene_by_id():
            db = await get_surreal_connection()
            result = await db.select(f"gene:{gene_id}")
            if not result:
                return None
            return result
        
        gene = run_async(get_gene_by_id())
        
        if not gene:
            return {
                "success": False,
                "data": None,
                "error": f"Gene with ID {gene_id} not found"
            }
        
        return {
            "success": True,
            "data": {
                "uid": gene_id,
                "name": gene.get('name', ''),
                "ensembl_id": gene.get('ensembl_id', ''),
                "chromosome": gene.get('chromosome', ''),
                "start_position": gene.get('start_position', 0),
                "end_position": gene.get('end_position', 0),
                "species": gene.get('species', 'Homo sapiens'),
                "gene_type": gene.get('gene_type', ''),
                "created_at": gene.get('created_at', '')
            }
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
        async def do_create_gene():
            db = await get_surreal_connection()
            
            # Check if gene already exists
            result = await db.query(
                "SELECT * FROM gene WHERE ensembl_id = $ensembl_id",
                {"ensembl_id": data.ensembl_id}
            )
            
            if result and result[0].get('result') and len(result[0]['result']) > 0:
                return None, f"Gene with Ensembl ID {data.ensembl_id} already exists"
            
            # Create gene
            gene_data = {
                "name": data.name,
                "ensembl_id": data.ensembl_id,
                "chromosome": data.chromosome,
                "start_position": data.start_position,
                "end_position": data.end_position,
                "species": data.species,
                "gene_type": data.gene_type
            }
            
            created = await db.create("gene", gene_data)
            return created, None
        
        gene, error = run_async(do_create_gene())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        gene_id = gene.get('id', '').replace('gene:', '')
        
        return {
            "success": True,
            "data": {
                "uid": gene_id,
                "name": gene.get('name', ''),
                "ensembl_id": gene.get('ensembl_id', ''),
                "chromosome": gene.get('chromosome', ''),
                "start_position": gene.get('start_position', 0),
                "end_position": gene.get('end_position', 0),
                "species": gene.get('species', 'Homo sapiens'),
                "gene_type": gene.get('gene_type', ''),
                "created_at": gene.get('created_at', '')
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
        async def do_update_gene():
            db = await get_surreal_connection()
            
            # Check if gene exists
            existing = await db.select(f"gene:{gene_id}")
            if not existing:
                return None, f"Gene with ID {gene_id} not found"
            
            # Prepare update data
            update_data = {}
            if data.name:
                update_data["name"] = data.name
            if data.ensembl_id:
                update_data["ensembl_id"] = data.ensembl_id
            if data.chromosome:
                update_data["chromosome"] = data.chromosome
            if data.start_position:
                update_data["start_position"] = data.start_position
            if data.end_position:
                update_data["end_position"] = data.end_position
            if data.species:
                update_data["species"] = data.species
            if data.gene_type:
                update_data["gene_type"] = data.gene_type
            
            # Update gene
            updated = await db.update(f"gene:{gene_id}", update_data)
            return updated, None
        
        gene, error = run_async(do_update_gene())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        return {
            "success": True,
            "data": {
                "uid": gene_id,
                "name": gene.get('name', ''),
                "ensembl_id": gene.get('ensembl_id', ''),
                "chromosome": gene.get('chromosome', ''),
                "start_position": gene.get('start_position', 0),
                "end_position": gene.get('end_position', 0),
                "species": gene.get('species', 'Homo sapiens'),
                "gene_type": gene.get('gene_type', ''),
                "created_at": gene.get('created_at', '')
            }
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
        async def do_delete_gene():
            db = await get_surreal_connection()
            
            # Check if gene exists
            existing = await db.select(f"gene:{gene_id}")
            if not existing:
                return None, f"Gene with ID {gene_id} not found"
            
            name = existing.get('name', '')
            
            # Delete gene
            await db.delete(f"gene:{gene_id}")
            
            return name, None
        
        name, error = run_async(do_delete_gene())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Gene {name} has been deleted"
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
        async def do_search_genes():
            db = await get_surreal_connection()
            
            # Build query
            query_parts = []
            params = {}
            
            if search_params.name:
                query_parts.append("string::lowercase(name) CONTAINS string::lowercase($name)")
                params["name"] = search_params.name
            
            if search_params.ensembl_id:
                query_parts.append("ensembl_id CONTAINS $ensembl_id")
                params["ensembl_id"] = search_params.ensembl_id
            
            if search_params.chromosome:
                query_parts.append("chromosome = $chromosome")
                params["chromosome"] = search_params.chromosome
            
            if search_params.start_position_min:
                query_parts.append("start_position >= $start_min")
                params["start_min"] = search_params.start_position_min
            
            if search_params.start_position_max:
                query_parts.append("start_position <= $start_max")
                params["start_max"] = search_params.start_position_max
            
            if search_params.end_position_min:
                query_parts.append("end_position >= $end_min")
                params["end_min"] = search_params.end_position_min
            
            if search_params.end_position_max:
                query_parts.append("end_position <= $end_max")
                params["end_max"] = search_params.end_position_max
            
            if search_params.species:
                query_parts.append("species = $species")
                params["species"] = search_params.species
            
            if search_params.gene_type:
                query_parts.append("gene_type = $gene_type")
                params["gene_type"] = search_params.gene_type
            
            if search_params.associated_disease:
                query_parts.append("->associated_with->disease.name = $disease_name")
                params["disease_name"] = search_params.associated_disease
            
            if search_params.in_pathway:
                # Use the corrected relation name
                query_parts.append("->gene_participates_in->pathway.name = $pathway_name")
                params["pathway_name"] = search_params.in_pathway
            
            if not query_parts:
                return [], 0, "No search criteria provided"
            
            # Construct final query
            query = "SELECT * FROM gene"
            if query_parts:
                query += " WHERE " + " AND ".join(query_parts)
            
            result, total = await paginate_results(query, params)
            
            genes = []
            if result and result[0].get('result'):
                genes = result[0]['result']
            
            return genes, total, None
        
        genes, count, error = run_async(do_search_genes())
        
        if error:
            return {
                "success": False,
                "data": None,
                "count": 0,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "uid": g.get('id', '').replace('gene:', ''),
                    "name": g.get('name', ''),
                    "ensembl_id": g.get('ensembl_id', ''),
                    "chromosome": g.get('chromosome', ''),
                    "start_position": g.get('start_position', 0),
                    "end_position": g.get('end_position', 0),
                    "species": g.get('species', 'Homo sapiens'),
                    "gene_type": g.get('gene_type', ''),
                    "created_at": g.get('created_at', '')
                }
                for g in genes
            ],
            "count": count
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
        async def do_get_proteins():
            db = await get_surreal_connection()
            
            # Check if gene exists
            existing = await db.select(f"gene:{gene_id}")
            if not existing:
                return None, f"Gene with ID {gene_id} not found"
            
            # Get proteins
            result = await db.query("""
                SELECT ->encodes->protein.* as proteins
                FROM gene:$gene_id
                FETCH proteins;
            """, {"gene_id": gene_id})
            
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
                    "uniprot_id": p.get('uniprot_id', ''),
                    "name": p.get('name', '')
                }
                for p in proteins
            ],
            "count": len(proteins)
        }
    except Exception as e:
        print(f"Error in get_gene_proteins: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }
