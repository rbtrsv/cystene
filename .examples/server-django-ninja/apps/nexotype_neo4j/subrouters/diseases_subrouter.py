from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Disease, Gene, Treatment, Biomarker
from ..schemas.disease_schemas import (
    DiseaseCreate, DiseaseUpdate, DiseaseDetail, 
    DiseaseSearchParams, DiseaseResponse, DiseaseListResponse
)
from ..utils.neo4j_utils import (
    get_neo4j_connection, execute_cypher, paginate_results
)

router = Router(tags=["Neo4j Diseases"])

@router.get("/", response=DiseaseListResponse)
def list_diseases(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List diseases with optional pagination
    
    This endpoint:
    1. Retrieves diseases from the Neo4j database
    2. Returns a paginated list of diseases
    """
    try:
        diseases = Disease.nodes.all()[offset:offset+limit]
        count = len(Disease.nodes.all())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(d.uid),
                    "name": d.name,
                    "omim_id": d.omim_id,
                    "description": d.description,
                    "disease_class": d.disease_class,
                    "created_at": d.created_at
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
        disease = Disease.nodes.get(uid=disease_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(disease.uid),
                "name": disease.name,
                "omim_id": disease.omim_id,
                "description": disease.description,
                "disease_class": disease.disease_class,
                "created_at": disease.created_at
            }
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Disease with ID {disease_id} not found"
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
        # Check if disease already exists
        if data.omim_id:
            existing = Disease.nodes.filter(omim_id=data.omim_id)
            if existing:
                return {
                    "success": False,
                    "data": None,
                    "error": f"Disease with OMIM ID {data.omim_id} already exists"
                }
        
        # Create disease
        disease = Disease(
            name=data.name,
            omim_id=data.omim_id,
            description=data.description,
            disease_class=data.disease_class
        ).save()
        
        return {
            "success": True,
            "data": {
                "uid": str(disease.uid),
                "name": disease.name,
                "omim_id": disease.omim_id,
                "description": disease.description,
                "disease_class": disease.disease_class,
                "created_at": disease.created_at
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
        disease = Disease.nodes.get(uid=disease_id)
        
        if data.name:
            disease.name = data.name
        if data.omim_id:
            disease.omim_id = data.omim_id
        if data.description:
            disease.description = data.description
        if data.disease_class:
            disease.disease_class = data.disease_class
        
        disease.save()
        
        return {
            "success": True,
            "data": {
                "uid": str(disease.uid),
                "name": disease.name,
                "omim_id": disease.omim_id,
                "description": disease.description,
                "disease_class": disease.disease_class,
                "created_at": disease.created_at
            }
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Disease with ID {disease_id} not found"
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
        disease = Disease.nodes.get(uid=disease_id)
        name = disease.name
        disease.delete()
        
        return {
            "success": True,
            "message": f"Disease {name} has been deleted"
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
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
        query_parts = []
        params = {}
        
        if search_params.name:
            query_parts.append("d.name =~ $name")
            params["name"] = f".*{search_params.name}.*"
        
        if search_params.omim_id:
            query_parts.append("d.omim_id =~ $omim_id")
            params["omim_id"] = f".*{search_params.omim_id}.*"
        
        if search_params.disease_class:
            query_parts.append("d.disease_class = $disease_class")
            params["disease_class"] = search_params.disease_class
        
        if search_params.associated_gene:
            query_parts.append("(d)<-[:ASSOCIATED_WITH]-(:Gene {ensembl_id: $gene_id})")
            params["gene_id"] = search_params.associated_gene
        
        if search_params.has_biomarker:
            query_parts.append("(d)<-[:INDICATES]-(:Biomarker {name: $biomarker_name})")
            params["biomarker_name"] = search_params.has_biomarker
        
        if not query_parts:
            return {
                "success": False,
                "data": None,
                "count": 0,
                "error": "No search criteria provided"
            }
        
        query = "MATCH (d:Disease) WHERE " + " AND ".join(query_parts) + " RETURN d"
        
        results, _ = execute_cypher(query, params)
        
        diseases = [Disease.inflate(result[0]) for result in results]
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(d.uid),
                    "name": d.name,
                    "omim_id": d.omim_id,
                    "description": d.description,
                    "disease_class": d.disease_class,
                    "created_at": d.created_at
                }
                for d in diseases
            ],
            "count": len(diseases)
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
        disease = Disease.nodes.get(uid=disease_id)
        genes = disease.get_associated_genes()
        
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
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Exception as e:
        print(f"Error in get_disease_genes: {str(e)}")
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
        disease = Disease.nodes.get(uid=disease_id)
        biomarkers = disease.get_biomarkers()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(b.uid),
                    "name": b.name,
                    "biomarker_type": b.biomarker_type
                }
                for b in biomarkers
            ],
            "count": len(biomarkers)
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
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
        disease = Disease.nodes.get(uid=disease_id)
        treatments = disease.get_treatments()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(t.uid),
                    "name": t.name,
                    "treatment_type": t.treatment_type
                }
                for t in treatments
            ],
            "count": len(treatments)
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Exception as e:
        print(f"Error in get_disease_treatments: {str(e)}")
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
        disease = Disease.nodes.get(uid=disease_id)
        gene = Gene.nodes.get(uid=gene_id)
        
        # Create relationship
        gene.diseases.connect(disease)
        
        return {
            "success": True,
            "message": f"Gene {gene.name} associated with disease {disease.name}"
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in add_disease_gene: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{disease_id}/add_biomarker/{biomarker_id}", response=Dict[str, Any])
def add_disease_biomarker(
    request: HttpRequest, 
    disease_id: str, 
    biomarker_id: str
):
    """
    Add a biomarker that indicates a disease
    
    This endpoint:
    1. Retrieves a disease and biomarker by ID
    2. Creates an INDICATES relationship
    3. Returns a success message
    """
    try:
        disease = Disease.nodes.get(uid=disease_id)
        biomarker = Biomarker.nodes.get(uid=biomarker_id)
        
        # Create relationship
        biomarker.diseases.connect(disease)
        
        return {
            "success": True,
            "message": f"Biomarker {biomarker.name} added as indicator of disease {disease.name}"
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Biomarker.DoesNotExist:
        return {
            "success": False,
            "error": f"Biomarker with ID {biomarker_id} not found"
        }
    except Exception as e:
        print(f"Error in add_disease_biomarker: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{disease_id}/add_treatment/{treatment_id}", response=Dict[str, Any])
def add_disease_treatment(
    request: HttpRequest, 
    disease_id: str, 
    treatment_id: str
):
    """
    Add a treatment for a disease
    
    This endpoint:
    1. Retrieves a disease and treatment by ID
    2. Creates a TREATS relationship
    3. Returns a success message
    """
    try:
        disease = Disease.nodes.get(uid=disease_id)
        treatment = Treatment.nodes.get(uid=treatment_id)
        
        # Create relationship
        treatment.diseases.connect(disease)
        
        return {
            "success": True,
            "message": f"Treatment {treatment.name} added for disease {disease.name}"
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Treatment.DoesNotExist:
        return {
            "success": False,
            "error": f"Treatment with ID {treatment_id} not found"
        }
    except Exception as e:
        print(f"Error in add_disease_treatment: {str(e)}")
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
        disease = Disease.nodes.get(uid=disease_id)
        related = disease.find_related_diseases()
        
        # Filter by minimum number of common genes
        filtered_related = [(d, count) for d, count in related if count >= min_common_genes]
        
        return {
            "success": True,
            "data": [
                {
                    "disease": {
                        "uid": str(d.uid),
                        "name": d.name,
                        "omim_id": d.omim_id
                    },
                    "common_genes_count": count
                }
                for d, count in filtered_related
            ],
            "count": len(filtered_related)
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Exception as e:
        print(f"Error in get_related_diseases: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }