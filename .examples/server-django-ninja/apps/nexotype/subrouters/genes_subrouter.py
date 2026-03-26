from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from typing import List, Optional, Dict, Any
import uuid

from ..models import Gene, Protein, Pathway, Disease
from ..schemas.gene_schemas import (
    GeneCreate, GeneUpdate, GeneDetail, 
    GeneSearchParams, GeneResponse, GeneListResponse
)

router = Router(tags=["Genes"])

@router.get("/", response=GeneListResponse)
def list_genes(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List genes with optional pagination
    
    This endpoint:
    1. Retrieves genes from the database
    2. Returns a paginated list of genes
    """
    try:
        # Retrieve genes with pagination
        genes = Gene.objects.all().order_by('name')[offset:offset+limit]
        total_count = Gene.objects.count()
        
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
                    "created_at": g.created_at.isoformat() if g.created_at else None
                }
                for g in genes
            ],
            "count": total_count
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
        gene = get_object_or_404(Gene, uid=gene_id)
        
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
                "created_at": gene.created_at.isoformat() if gene.created_at else None
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
        # Check if gene already exists with the same Ensembl ID
        if Gene.objects.filter(ensembl_id=data.ensembl_id).exists():
            return {
                "success": False,
                "data": None,
                "error": f"Gene with Ensembl ID {data.ensembl_id} already exists"
            }
        
        # Create gene
        gene = Gene.objects.create(
            uid=uuid.uuid4(),
            name=data.name,
            ensembl_id=data.ensembl_id,
            chromosome=data.chromosome,
            start_position=data.start_position,
            end_position=data.end_position,
            species=data.species,
            gene_type=data.gene_type
        )
        
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
                "created_at": gene.created_at.isoformat() if gene.created_at else None
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
        gene = get_object_or_404(Gene, uid=gene_id)
        
        # Update fields if provided
        if data.name:
            gene.name = data.name
        if data.ensembl_id:
            # Check if the new Ensembl ID is already in use by another gene
            if Gene.objects.exclude(uid=gene_id).filter(ensembl_id=data.ensembl_id).exists():
                return {
                    "success": False,
                    "data": None,
                    "error": f"Ensembl ID {data.ensembl_id} is already in use by another gene"
                }
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
                "created_at": gene.created_at.isoformat() if gene.created_at else None
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

@router.delete("/{gene_id}")
def delete_gene(request: HttpRequest, gene_id: str):
    """
    Delete a gene
    
    This endpoint:
    1. Deletes a gene from the database
    2. Returns a success message
    """
    try:
        gene = get_object_or_404(Gene, uid=gene_id)
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
        # Start with all genes
        query = Gene.objects.all()
        
        # Apply filters based on search parameters
        if search_params.name:
            query = query.filter(name__icontains=search_params.name)
        
        if search_params.ensembl_id:
            query = query.filter(ensembl_id__icontains=search_params.ensembl_id)
        
        if search_params.chromosome:
            query = query.filter(chromosome=search_params.chromosome)
        
        if search_params.start_position_min:
            query = query.filter(start_position__gte=search_params.start_position_min)
        
        if search_params.start_position_max:
            query = query.filter(start_position__lte=search_params.start_position_max)
        
        if search_params.end_position_min:
            query = query.filter(end_position__gte=search_params.end_position_min)
        
        if search_params.end_position_max:
            query = query.filter(end_position__lte=search_params.end_position_max)
        
        if search_params.species:
            query = query.filter(species=search_params.species)
        
        if search_params.gene_type:
            query = query.filter(gene_type=search_params.gene_type)
        
        # Handle relationships - these require joins
        if search_params.associated_disease:
            query = query.filter(diseases__name=search_params.associated_disease)
        
        if search_params.in_pathway:
            query = query.filter(pathways__name=search_params.in_pathway)
        
        # Execute query
        genes = query.distinct().order_by('name')
        count = genes.count()
        
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
                    "created_at": g.created_at.isoformat() if g.created_at else None
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

@router.get("/{gene_id}/proteins")
def get_gene_proteins(request: HttpRequest, gene_id: str):
    """
    Get proteins encoded by a gene
    
    This endpoint:
    1. Retrieves a gene by ID
    2. Returns the proteins encoded by the gene
    """
    try:
        gene = get_object_or_404(Gene, uid=gene_id)
        proteins = gene.proteins.all()
        
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
            "count": proteins.count()
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

@router.get("/{gene_id}/diseases")
def get_gene_diseases(request: HttpRequest, gene_id: str):
    """
    Get diseases associated with a gene
    
    This endpoint:
    1. Retrieves a gene by ID
    2. Returns the diseases associated with the gene
    """
    try:
        gene = get_object_or_404(Gene, uid=gene_id)
        diseases = gene.diseases.all()
        
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
            "count": diseases.count()
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

@router.post("/{gene_id}/encode_protein/{protein_id}")
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
        gene = get_object_or_404(Gene, uid=gene_id)
        protein = get_object_or_404(Protein, uid=protein_id)
        
        # Add relationship
        gene.proteins.add(protein)
        
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

@router.post("/{gene_id}/add_to_pathway/{pathway_id}")
def add_gene_pathway_relationship(
    request: HttpRequest, 
    gene_id: str, 
    pathway_id: str
):
    """
    Add a gene to a pathway
    
    This endpoint:
    1. Retrieves a gene and pathway by ID
    2. Creates a PARTICIPATES_IN relationship
    3. Returns a success message
    """
    try:
        gene = get_object_or_404(Gene, uid=gene_id)
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        
        # Add relationship
        gene.pathways.add(pathway)
        
        return {
            "success": True,
            "message": f"Gene {gene.name} added to pathway {pathway.name}"
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in add_gene_pathway_relationship: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{gene_id}/associate_with_disease/{disease_id}")
def add_gene_disease_relationship(
    request: HttpRequest, 
    gene_id: str, 
    disease_id: str
):
    """
    Associate a gene with a disease
    
    This endpoint:
    1. Retrieves a gene and disease by ID
    2. Creates an ASSOCIATED_WITH relationship
    3. Returns a success message
    """
    try:
        gene = get_object_or_404(Gene, uid=gene_id)
        disease = get_object_or_404(Disease, uid=disease_id)
        
        # Add relationship
        gene.diseases.add(disease)
        
        return {
            "success": True,
            "message": f"Gene {gene.name} associated with disease {disease.name}"
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Disease.DoesNotExist:
        return {
            "success": False,
            "error": f"Disease with ID {disease_id} not found"
        }
    except Exception as e:
        print(f"Error in add_gene_disease_relationship: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{gene_id}/pathways")
def get_gene_pathways(request: HttpRequest, gene_id: str):
    """
    Get pathways that this gene participates in
    
    This endpoint:
    1. Retrieves a gene by ID
    2. Returns the pathways the gene participates in
    """
    try:
        gene = get_object_or_404(Gene, uid=gene_id)
        pathways = gene.pathways.all()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id
                }
                for p in pathways
            ],
            "count": pathways.count()
        }
    except Gene.DoesNotExist:
        return {
            "success": False,
            "error": f"Gene with ID {gene_id} not found"
        }
    except Exception as e:
        print(f"Error in get_gene_pathways: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }