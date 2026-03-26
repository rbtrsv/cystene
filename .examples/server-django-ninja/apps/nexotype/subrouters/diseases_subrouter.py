from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from typing import List, Optional, Dict, Any
import uuid

from ..models import Disease, Gene, Treatment, Biomarker
from ..schemas.disease_schemas import (
    DiseaseCreate, DiseaseUpdate, DiseaseDetail, 
    DiseaseSearchParams, DiseaseResponse, DiseaseListResponse
)

router = Router(tags=["Diseases"])

@router.get("/", response=DiseaseListResponse)
def list_diseases(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List diseases with optional pagination
    
    This endpoint:
    1. Retrieves diseases from the database
    2. Returns a paginated list of diseases
    """
    try:
        # Retrieve diseases with pagination
        diseases = Disease.objects.all().order_by('name')[offset:offset+limit]
        total_count = Disease.objects.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(d.uid),
                    "name": d.name,
                    "omim_id": d.omim_id,
                    "description": d.description,
                    "disease_class": d.disease_class,
                    "created_at": d.created_at.isoformat() if d.created_at else None
                }
                for d in diseases
            ],
            "count": total_count
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
        disease = get_object_or_404(Disease, uid=disease_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(disease.uid),
                "name": disease.name,
                "omim_id": disease.omim_id,
                "description": disease.description,
                "disease_class": disease.disease_class,
                "created_at": disease.created_at.isoformat() if disease.created_at else None
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
        # Check if disease already exists with the same OMIM ID
        if data.omim_id and Disease.objects.filter(omim_id=data.omim_id).exists():
            return {
                "success": False,
                "data": None,
                "error": f"Disease with OMIM ID {data.omim_id} already exists"
            }
        
        # Create disease
        disease = Disease.objects.create(
            uid=uuid.uuid4(),
            name=data.name,
            omim_id=data.omim_id,
            description=data.description,
            disease_class=data.disease_class
        )
        
        return {
            "success": True,
            "data": {
                "uid": str(disease.uid),
                "name": disease.name,
                "omim_id": disease.omim_id,
                "description": disease.description,
                "disease_class": disease.disease_class,
                "created_at": disease.created_at.isoformat() if disease.created_at else None
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
        disease = get_object_or_404(Disease, uid=disease_id)
        
        # Update fields if provided
        if data.name:
            disease.name = data.name
        if data.omim_id:
            # Check if the new OMIM ID is already in use by another disease
            if Disease.objects.exclude(uid=disease_id).filter(omim_id=data.omim_id).exists():
                return {
                    "success": False,
                    "data": None,
                    "error": f"OMIM ID {data.omim_id} is already in use by another disease"
                }
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
                "created_at": disease.created_at.isoformat() if disease.created_at else None
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

@router.delete("/{disease_id}")
def delete_disease(request: HttpRequest, disease_id: str):
    """
    Delete a disease
    
    This endpoint:
    1. Deletes a disease from the database
    2. Returns a success message
    """
    try:
        disease = get_object_or_404(Disease, uid=disease_id)
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
        # Start with all diseases
        query = Disease.objects.all()
        
        # Apply filters based on search parameters
        if search_params.name:
            query = query.filter(name__icontains=search_params.name)
        
        if search_params.omim_id:
            query = query.filter(omim_id__icontains=search_params.omim_id)
        
        if search_params.disease_class:
            query = query.filter(disease_class=search_params.disease_class)
        
        # Handle relationships
        if search_params.associated_gene:
            gene = Gene.objects.filter(ensembl_id=search_params.associated_gene).first()
            if gene:
                query = query.filter(genes=gene)
        
        if search_params.has_biomarker:
            biomarker = Biomarker.objects.filter(name=search_params.has_biomarker).first()
            if biomarker:
                query = query.filter(biomarkers=biomarker)
        
        # Execute query
        diseases = query.distinct().order_by('name')
        count = diseases.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(d.uid),
                    "name": d.name,
                    "omim_id": d.omim_id,
                    "description": d.description,
                    "disease_class": d.disease_class,
                    "created_at": d.created_at.isoformat() if d.created_at else None
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

@router.get("/{disease_id}/genes")
def get_disease_genes(request: HttpRequest, disease_id: str):
    """
    Get genes associated with this disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the genes associated with it
    """
    try:
        disease = get_object_or_404(Disease, uid=disease_id)
        genes = disease.genes.all()
        
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
            "count": genes.count()
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

@router.get("/{disease_id}/biomarkers")
def get_disease_biomarkers(request: HttpRequest, disease_id: str):
    """
    Get biomarkers that indicate this disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the biomarkers that indicate it
    """
    try:
        disease = get_object_or_404(Disease, uid=disease_id)
        biomarkers = disease.biomarkers.all()
        
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
            "count": biomarkers.count()
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

@router.get("/{disease_id}/treatments")
def get_disease_treatments(request: HttpRequest, disease_id: str):
    """
    Get treatments for this disease
    
    This endpoint:
    1. Retrieves a disease by ID
    2. Returns the treatments for it
    """
    try:
        disease = get_object_or_404(Disease, uid=disease_id)
        treatments = disease.treatments.all()
        
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
            "count": treatments.count()
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

@router.post("/{disease_id}/add_gene/{gene_id}")
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
        disease = get_object_or_404(Disease, uid=disease_id)
        gene = get_object_or_404(Gene, uid=gene_id)
        
        # Add relationship
        gene.diseases.add(disease)
        
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

@router.post("/{disease_id}/add_biomarker/{biomarker_id}")
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
        disease = get_object_or_404(Disease, uid=disease_id)
        biomarker = get_object_or_404(Biomarker, uid=biomarker_id)
        
        # Add relationship
        biomarker.diseases.add(disease)
        
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

@router.post("/{disease_id}/add_treatment/{treatment_id}")
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
        disease = get_object_or_404(Disease, uid=disease_id)
        treatment = get_object_or_404(Treatment, uid=treatment_id)
        
        # Add relationship
        treatment.diseases.add(disease)
        
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