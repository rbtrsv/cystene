from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Disease, Gene, Treatment, Biomarker
from ..schemas.disease_schemas import (
    DiseaseCreate, DiseaseUpdate, DiseaseDetail, 
    DiseaseSearchParams, DiseaseResponse, DiseaseListResponse
)
from ..utils.surreal_connection_utils import (
    get_surreal_connection, run_async, execute_query,
    paginate_results, create_record, update_record, delete_record
)

router = Router(tags=["SurrealDB Diseases"])

@router.get("/", response=DiseaseListResponse)
def list_diseases(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List diseases with optional pagination
    
    This endpoint:
    1. Retrieves diseases from the SurrealDB database
    2. Returns a paginated list of diseases
    """
    try:
        async def get_diseases():
            db = await get_surreal_connection()
            result, total = await paginate_results(
                "SELECT * FROM disease", 
                {"limit": limit, "offset": offset},
                page=1,
                page_size=limit
            )
            
            diseases = []
            if result and result[0].get('result'):
                diseases = result[0]['result']
            
            return diseases, total
        
        diseases, count = run_async(get_diseases())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": d.get('id', '').replace('disease:', ''),
                    "name": d.get('name', ''),
                    "omim_id": d.get('omim_id', ''),
                    "description": d.get('description', ''),
                    "disease_class": d.get('disease_class', ''),
                    "created_at": d.get('created_at', '')
                }
                for d in diseases
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in list_diseases: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{disease_id}", response=DiseaseResponse)
def get_disease(request: HttpRequest, disease_id: str):
    """
    Get details for a specific disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the disease details
    """
    try:
        async def get_disease_by_id():
            db = await get_surreal_connection()
            result = await db.select(f"disease:{disease_id}")
            if not result:
                return None
            return result
        
        disease = run_async(get_disease_by_id())
        
        if not disease:
            return {
                "success": False,
                "data": None,
                "error": f"Disease with ID {disease_id} not found"
            }
        
        return {
            "success": True,
            "data": {
                "uid": disease_id,
                "name": disease.get('name', ''),
                "omim_id": disease.get('omim_id', ''),
                "description": disease.get('description', ''),
                "disease_class": disease.get('disease_class', ''),
                "created_at": disease.get('created_at', '')
            }
        }
    except Exception as e:
        print(f"Error in get_disease: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/", response=DiseaseResponse)
def create_disease(request: HttpRequest, data: DiseaseCreate):
    """
    Create a new disease
    
    This endpoint:
    1. Creates a new disease with the provided data
    2. Returns the created disease details
    """
    try:
        async def do_create_disease():
            db = await get_surreal_connection()
            
            # Check if disease already exists by name or OMIM ID
            query = "SELECT * FROM disease WHERE name = $name"
            params = {"name": data.name}
            
            if data.omim_id:
                query = "SELECT * FROM disease WHERE name = $name OR omim_id = $omim_id"
                params["omim_id"] = data.omim_id
            
            result = await db.query(query, params)
            
            if result and result[0].get('result') and len(result[0]['result']) > 0:
                existing = result[0]['result'][0]
                if existing.get('name') == data.name:
                    return None, f"Disease with name {data.name} already exists"
                else:
                    return None, f"Disease with OMIM ID {data.omim_id} already exists"
            
            # Create disease data
            disease_data = {
                "name": data.name,
                "omim_id": data.omim_id,
                "description": data.description,
                "disease_class": data.disease_class
            }
            
            # Create disease
            created = await db.create("disease", disease_data)
            return created, None
        
        disease, error = run_async(do_create_disease())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        disease_id = disease.get('id', '').replace('disease:', '')
        
        return {
            "success": True,
            "data": {
                "uid": disease_id,
                "name": disease.get('name', ''),
                "omim_id": disease.get('omim_id', ''),
                "description": disease.get('description', ''),
                "disease_class": disease.get('disease_class', ''),
                "created_at": disease.get('created_at', '')
            }
        }
    except Exception as e:
        print(f"Error in create_disease: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.put("/{disease_id}", response=DiseaseResponse)
def update_disease(request: HttpRequest, disease_id: str, data: DiseaseUpdate):
    """
    Update a disease
    
    This endpoint:
    1. Updates a disease with the provided data
    2. Returns the updated disease details
    """
    try:
        async def do_update_disease():
            db = await get_surreal_connection()
            
            # Check if disease exists
            existing = await db.select(f"disease:{disease_id}")
            if not existing:
                return None, f"Disease with ID {disease_id} not found"
            
            # Prepare update data
            update_data = {}
            if data.name:
                update_data["name"] = data.name
            if data.omim_id:
                update_data["omim_id"] = data.omim_id
            if data.description:
                update_data["description"] = data.description
            if data.disease_class:
                update_data["disease_class"] = data.disease_class
            
            # Update disease
            updated = await db.update(f"disease:{disease_id}", update_data)
            return updated, None
        
        disease, error = run_async(do_update_disease())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        return {
            "success": True,
            "data": {
                "uid": disease_id,
                "name": disease.get('name', ''),
                "omim_id": disease.get('omim_id', ''),
                "description": disease.get('description', ''),
                "disease_class": disease.get('disease_class', ''),
                "created_at": disease.get('created_at', '')
            }
        }
    except Exception as e:
        print(f"Error in update_disease: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.delete("/{disease_id}", response=Dict[str, Any])
def delete_disease(request: HttpRequest, disease_id: str):
    """
    Delete a disease
    
    This endpoint:
    1. Deletes a disease from the database
    2. Returns a success message
    """
    try:
        async def do_delete_disease():
            db = await get_surreal_connection()
            
            # Check if disease exists
            existing = await db.select(f"disease:{disease_id}")
            if not existing:
                return None, f"Disease with ID {disease_id} not found"
            
            name = existing.get('name', '')
            
            # Delete disease
            await db.delete(f"disease:{disease_id}")
            
            return name, None
        
        name, error = run_async(do_delete_disease())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Disease {name} has been deleted"
        }
    except Exception as e:
        print(f"Error in delete_disease: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/search", response=DiseaseListResponse)
def search_diseases(request: HttpRequest, search_params: DiseaseSearchParams):
    """
    Search for diseases with specific criteria
    
    This endpoint:
    1. Searches for diseases matching the criteria
    2. Returns a list of matching diseases
    """
    try:
        async def do_search_diseases():
            db = await get_surreal_connection()
            
            # Build query
            query_parts = []
            params = {}
            
            if search_params.name:
                query_parts.append("string::lowercase(name) CONTAINS string::lowercase($name)")
                params["name"] = search_params.name
            
            if search_params.omim_id:
                query_parts.append("omim_id CONTAINS $omim_id")
                params["omim_id"] = search_params.omim_id
            
            if search_params.disease_class:
                query_parts.append("disease_class = $disease_class")
                params["disease_class"] = search_params.disease_class
            
            if search_params.associated_gene:
                query_parts.append("<-associated_with<-gene.ensembl_id = $gene_id")
                params["gene_id"] = search_params.associated_gene
            
            if search_params.has_biomarker:
                query_parts.append("<-indicates<-biomarker.name = $biomarker_name")
                params["biomarker_name"] = search_params.has_biomarker
            
            if not query_parts:
                return [], 0, "No search criteria provided"
            
            # Construct final query
            query = "SELECT * FROM disease"
            if query_parts:
                query += " WHERE " + " AND ".join(query_parts)
            
            result, total = await paginate_results(query, params)
            
            diseases = []
            if result and result[0].get('result'):
                diseases = result[0]['result']
            
            return diseases, total, None
        
        diseases, count, error = run_async(do_search_diseases())
        
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
                    "uid": d.get('id', '').replace('disease:', ''),
                    "name": d.get('name', ''),
                    "omim_id": d.get('omim_id', ''),
                    "description": d.get('description', ''),
                    "disease_class": d.get('disease_class', ''),
                    "created_at": d.get('created_at', '')
                }
                for d in diseases
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in search_diseases: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{disease_id}/genes", response=Dict[str, Any])
def get_disease_genes(request: HttpRequest, disease_id: str):
    """
    Get genes associated with this disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the genes associated with it
    """
    try:
        async def do_get_genes():
            db = await get_surreal_connection()
            
            # Check if disease exists
            existing = await db.select(f"disease:{disease_id}")
            if not existing:
                return None, f"Disease with ID {disease_id} not found"
            
            # Get genes
            result = await db.query("""
                SELECT <-associated_with<-gene.* as genes
                FROM disease:$disease_id
                FETCH genes;
            """, {"disease_id": disease_id})
            
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
        print(f"Error in get_disease_genes: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{disease_id}/add_gene/{gene_id}", response=Dict[str, Any])
def add_disease_gene(
    request: HttpRequest, 
    disease_id: str, 
    gene_id: str
):
    """
    Associate a gene with a disease
    
    This endpoint:
    1. Retrieves a disease and gene by ID
    2. Creates an ASSOCIATED_WITH relationship
    3. Returns a success message
    """
    try:
        async def do_add_gene():
            db = await get_surreal_connection()
            
            # Check if disease exists
            disease = await db.select(f"disease:{disease_id}")
            if not disease:
                return None, f"Disease with ID {disease_id} not found"
            
            # Check if gene exists
            gene = await db.select(f"gene:{gene_id}")
            if not gene:
                return None, f"Gene with ID {gene_id} not found"
            
            # Create relationship
            await db.query(
                "RELATE gene:$gene_id->associated_with->disease:$disease_id;",
                {"gene_id": gene_id, "disease_id": disease_id}
            )
            
            return {
                "disease_name": disease.get('name', ''),
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
            "message": f"Gene {result['gene_name']} associated with disease {result['disease_name']}"
        }
    except Exception as e:
        print(f"Error in add_disease_gene: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{disease_id}/biomarkers", response=Dict[str, Any])
def get_disease_biomarkers(request: HttpRequest, disease_id: str):
    """
    Get biomarkers that indicate this disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the biomarkers that indicate it
    """
    try:
        async def do_get_biomarkers():
            db = await get_surreal_connection()
            
            # Check if disease exists
            existing = await db.select(f"disease:{disease_id}")
            if not existing:
                return None, f"Disease with ID {disease_id} not found"
            
            # Get biomarkers
            result = await db.query("""
                SELECT <-indicates<-biomarker.* as biomarkers
                FROM disease:$disease_id
                FETCH biomarkers;
            """, {"disease_id": disease_id})
            
            biomarkers = []
            if result and result[0].get('result') and result[0]['result'][0].get('biomarkers'):
                biomarkers = result[0]['result'][0]['biomarkers']
            
            return biomarkers, None
        
        biomarkers, error = run_async(do_get_biomarkers())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "uid": b.get('id', '').replace('biomarker:', ''),
                    "name": b.get('name', ''),
                    "biomarker_type": b.get('biomarker_type', '')
                }
                for b in biomarkers
            ],
            "count": len(biomarkers)
        }
    except Exception as e:
        print(f"Error in get_disease_biomarkers: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{disease_id}/treatments", response=Dict[str, Any])
def get_disease_treatments(request: HttpRequest, disease_id: str):
    """
    Get treatments for this disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the treatments for it
    """
    try:
        async def do_get_treatments():
            db = await get_surreal_connection()
            
            # Check if disease exists
            existing = await db.select(f"disease:{disease_id}")
            if not existing:
                return None, f"Disease with ID {disease_id} not found"
            
            # Get treatments
            result = await db.query("""
                SELECT <-treats<-treatment.* as treatments
                FROM disease:$disease_id
                FETCH treatments;
            """, {"disease_id": disease_id})
            
            treatments = []
            if result and result[0].get('result') and result[0]['result'][0].get('treatments'):
                treatments = result[0]['result'][0]['treatments']
            
            return treatments, None
        
        treatments, error = run_async(do_get_treatments())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "uid": t.get('id', '').replace('treatment:', ''),
                    "name": t.get('name', ''),
                    "treatment_type": t.get('treatment_type', '')
                }
                for t in treatments
            ],
            "count": len(treatments)
        }
    except Exception as e:
        print(f"Error in get_disease_treatments: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{disease_id}/related_diseases", response=Dict[str, Any])
def get_related_diseases(
    request: HttpRequest, 
    disease_id: str,
    min_common_genes: int = 1
):
    """
    Find diseases related to this one through common genes
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Finds other diseases that share genes with it
    3. Returns a list of related diseases
    """
    try:
        async def do_get_related_diseases():
            db = await get_surreal_connection()
            
            # Check if disease exists
            existing = await db.select(f"disease:{disease_id}")
            if not existing:
                return None, f"Disease with ID {disease_id} not found"
            
            # Find related diseases
            result = await db.query("""
                SELECT 
                    <-associated_with<-gene->associated_with->disease.* as related_diseases,
                    count(<-associated_with<-gene->associated_with->disease) as common_genes
                FROM disease:$disease_id
                WHERE related_diseases.id != $disease_id
                GROUP BY related_diseases
                HAVING common_genes >= $min_common
                ORDER BY common_genes DESC;
            """, {"disease_id": disease_id, "min_common": min_common_genes})
            
            related = []
            if result and result[0].get('result'):
                for item in result[0]['result']:
                    if 'related_diseases' in item and 'common_genes' in item:
                        for disease in item['related_diseases']:
                            related.append((disease, item['common_genes']))
            
            return related, None
        
        related_diseases, error = run_async(do_get_related_diseases())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "disease": {
                        "uid": d.get('id', '').replace('disease:', ''),
                        "name": d.get('name', ''),
                        "omim_id": d.get('omim_id', '')
                    },
                    "common_genes_count": count
                }
                for d, count in related_diseases
            ],
            "count": len(related_diseases)
        }
    except Exception as e:
        print(f"Error in get_related_diseases: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }