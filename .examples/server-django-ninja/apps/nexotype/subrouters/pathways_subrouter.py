from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from typing import List, Optional, Dict, Any
import uuid

from ..models import Pathway, Gene, Protein, IsPartOf
from ..schemas.pathway_schemas import (
    PathwayCreate, PathwayUpdate, PathwayDetail, 
    PathwaySearchParams, PathwayResponse, PathwayListResponse
)

router = Router(tags=["Pathways"])

@router.get("/", response=PathwayListResponse)
def list_pathways(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List pathways with optional pagination
    
    This endpoint:
    1. Retrieves pathways from the database
    2. Returns a paginated list of pathways
    """
    try:
        # Retrieve pathways with pagination
        pathways = Pathway.objects.all().order_by('name')[offset:offset+limit]
        total_count = Pathway.objects.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id,
                    "description": p.description,
                    "pathway_type": p.pathway_type,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in pathways
            ],
            "count": total_count
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
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(pathway.uid),
                "name": pathway.name,
                "kegg_id": pathway.kegg_id,
                "description": pathway.description,
                "pathway_type": pathway.pathway_type,
                "created_at": pathway.created_at.isoformat() if pathway.created_at else None
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
        # Check if pathway already exists with the same KEGG ID
        if data.kegg_id and Pathway.objects.filter(kegg_id=data.kegg_id).exists():
            return {
                "success": False,
                "data": None,
                "error": f"Pathway with KEGG ID {data.kegg_id} already exists"
            }
        
        # Create pathway
        pathway = Pathway.objects.create(
            uid=uuid.uuid4(),
            name=data.name,
            kegg_id=data.kegg_id,
            description=data.description,
            pathway_type=data.pathway_type
        )
        
        return {
            "success": True,
            "data": {
                "uid": str(pathway.uid),
                "name": pathway.name,
                "kegg_id": pathway.kegg_id,
                "description": pathway.description,
                "pathway_type": pathway.pathway_type,
                "created_at": pathway.created_at.isoformat() if pathway.created_at else None
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
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        
        # Update fields if provided
        if data.name:
            pathway.name = data.name
        if data.kegg_id:
            # Check if the new KEGG ID is already in use by another pathway
            if Pathway.objects.exclude(uid=pathway_id).filter(kegg_id=data.kegg_id).exists():
                return {
                    "success": False,
                    "data": None,
                    "error": f"KEGG ID {data.kegg_id} is already in use by another pathway"
                }
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
                "created_at": pathway.created_at.isoformat() if pathway.created_at else None
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

@router.delete("/{pathway_id}")
def delete_pathway(request: HttpRequest, pathway_id: str):
    """
    Delete a pathway
    
    This endpoint:
    1. Deletes a pathway from the database
    2. Returns a success message
    """
    try:
        pathway = get_object_or_404(Pathway, uid=pathway_id)
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
        # Start with all pathways
        query = Pathway.objects.all()
        
        # Apply filters based on search parameters
        if search_params.name:
            query = query.filter(name__icontains=search_params.name)
        
        if search_params.kegg_id:
            query = query.filter(kegg_id__icontains=search_params.kegg_id)
        
        if search_params.pathway_type:
            query = query.filter(pathway_type=search_params.pathway_type)
        
        # Handle relationships
        if search_params.has_gene:
            gene = Gene.objects.filter(ensembl_id=search_params.has_gene).first()
            if gene:
                query = query.filter(genes=gene)
        
        if search_params.has_protein:
            protein = Protein.objects.filter(uniprot_id=search_params.has_protein).first()
            if protein:
                query = query.filter(proteins=protein)
        
        # Execute query
        pathways = query.distinct().order_by('name')
        count = pathways.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "name": p.name,
                    "kegg_id": p.kegg_id,
                    "description": p.description,
                    "pathway_type": p.pathway_type,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in pathways
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in search_pathways: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{pathway_id}/genes")
def get_pathway_genes(request: HttpRequest, pathway_id: str):
    """
    Get genes that participate in this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns the genes that participate in it
    """
    try:
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        genes = pathway.genes.all()
        
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

@router.get("/{pathway_id}/proteins")
def get_pathway_proteins(request: HttpRequest, pathway_id: str):
    """
    Get proteins that participate in this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns the proteins that participate in it
    """
    try:
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        proteins = pathway.proteins.all()
        
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
            "count": proteins.count()
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

@router.post("/{pathway_id}/add_gene/{gene_id}")
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
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        gene = get_object_or_404(Gene, uid=gene_id)
        
        # Add relationship
        gene.pathways.add(pathway)
        
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

@router.post("/{pathway_id}/add_protein/{protein_id}")
def add_pathway_protein(
    request: HttpRequest, 
    pathway_id: str, 
    protein_id: str
):
    """
    Add a protein to a pathway
    
    This endpoint:
    1. Retrieves a pathway and protein by ID
    2. Creates a PARTICIPATES_IN relationship
    3. Returns a success message
    """
    try:
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        protein = get_object_or_404(Protein, uid=protein_id)
        
        # Add relationship
        protein.pathways.add(pathway)
        
        return {
            "success": True,
            "message": f"Protein {protein.name} added to pathway {pathway.name}"
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in add_pathway_protein: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{parent_id}/add_child_pathway/{child_id}")
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
        parent_pathway = get_object_or_404(Pathway, uid=parent_id)
        child_pathway = get_object_or_404(Pathway, uid=child_id)
        
        # Create the relationship using the through model
        IsPartOf.objects.create(
            parent=parent_pathway,
            child=child_pathway
        )
        
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

@router.get("/{pathway_id}/parent_pathways")
def get_parent_pathways(request: HttpRequest, pathway_id: str):
    """
    Get parent pathways of this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns its parent pathways
    """
    try:
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        
        # Get parent pathways using the through model
        parent_relations = IsPartOf.objects.filter(child=pathway)
        parents = [rel.parent for rel in parent_relations]
        
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

@router.get("/{pathway_id}/child_pathways")
def get_child_pathways(request: HttpRequest, pathway_id: str):
    """
    Get child pathways of this pathway
    
    This endpoint:
    1. Retrieves a pathway by ID
    2. Returns its child pathways
    """
    try:
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        
        # Get child pathways using the through model
        child_relations = IsPartOf.objects.filter(parent=pathway)
        children = [rel.child for rel in child_relations]
        
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