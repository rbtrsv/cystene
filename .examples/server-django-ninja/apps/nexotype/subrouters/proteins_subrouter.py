from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from typing import List, Optional, Dict, Any
import uuid

from ..models import Protein, Gene, Peptide, Pathway, ProteinDomain, InteractsWith, Contains, HasDomain
from ..schemas.protein_schemas import (
    ProteinCreate, ProteinUpdate, ProteinDetail, 
    ProteinSearchParams, ProteinResponse, ProteinListResponse
)

router = Router(tags=["Proteins"])

@router.get("/", response=ProteinListResponse)
def list_proteins(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List proteins with optional pagination
    
    This endpoint:
    1. Retrieves proteins from the database
    2. Returns a paginated list of proteins
    """
    try:
        # Retrieve proteins with pagination
        proteins = Protein.objects.all().order_by('name')[offset:offset+limit]
        total_count = Protein.objects.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "uniprot_id": p.uniprot_id,
                    "name": p.name,
                    "sequence": p.sequence,
                    "molecular_weight": p.molecular_weight,
                    "isoelectric_point": p.isoelectric_point,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in proteins
            ],
            "count": total_count
        }
    except Exception as e:
        print(f"Error in list_proteins: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}", response=ProteinResponse)
def get_protein(request: HttpRequest, protein_id: str):
    """
    Get details for a specific protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the protein details
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(protein.uid),
                "uniprot_id": protein.uniprot_id,
                "name": protein.name,
                "sequence": protein.sequence,
                "molecular_weight": protein.molecular_weight,
                "isoelectric_point": protein.isoelectric_point,
                "created_at": protein.created_at.isoformat() if protein.created_at else None
            }
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in get_protein: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/", response=ProteinResponse)
def create_protein(request: HttpRequest, data: ProteinCreate):
    """
    Create a new protein
    
    This endpoint:
    1. Creates a new protein with the provided data
    2. Returns the created protein details
    """
    try:
        # Check if protein already exists with the same UniProt ID
        if Protein.objects.filter(uniprot_id=data.uniprot_id).exists():
            return {
                "success": False,
                "data": None,
                "error": f"Protein with UniProt ID {data.uniprot_id} already exists"
            }
        
        # Create protein
        protein = Protein.objects.create(
            uid=uuid.uuid4(),
            uniprot_id=data.uniprot_id,
            name=data.name,
            sequence=data.sequence,
            molecular_weight=data.molecular_weight,
            isoelectric_point=data.isoelectric_point
        )
        
        # Connect to genes if provided
        if data.gene_ids:
            for gene_id in data.gene_ids:
                try:
                    gene = Gene.objects.get(uid=gene_id)
                    gene.proteins.add(protein)
                except Gene.DoesNotExist:
                    print(f"Gene with ID {gene_id} not found, skipping")
        
        return {
            "success": True,
            "data": {
                "uid": str(protein.uid),
                "uniprot_id": protein.uniprot_id,
                "name": protein.name,
                "sequence": protein.sequence,
                "molecular_weight": protein.molecular_weight,
                "isoelectric_point": protein.isoelectric_point,
                "created_at": protein.created_at.isoformat() if protein.created_at else None
            }
        }
    except Exception as e:
        print(f"Error in create_protein: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.put("/{protein_id}", response=ProteinResponse)
def update_protein(request: HttpRequest, protein_id: str, data: ProteinUpdate):
    """
    Update a protein
    
    This endpoint:
    1. Updates a protein with the provided data
    2. Returns the updated protein details
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        
        # Update fields if provided
        if data.uniprot_id:
            # Check if the new UniProt ID is already in use by another protein
            if Protein.objects.exclude(uid=protein_id).filter(uniprot_id=data.uniprot_id).exists():
                return {
                    "success": False,
                    "data": None,
                    "error": f"UniProt ID {data.uniprot_id} is already in use by another protein"
                }
            protein.uniprot_id = data.uniprot_id
        if data.name:
            protein.name = data.name
        if data.sequence:
            protein.sequence = data.sequence
        if data.molecular_weight:
            protein.molecular_weight = data.molecular_weight
        if data.isoelectric_point:
            protein.isoelectric_point = data.isoelectric_point
        
        protein.save()
        
        return {
            "success": True,
            "data": {
                "uid": str(protein.uid),
                "uniprot_id": protein.uniprot_id,
                "name": protein.name,
                "sequence": protein.sequence,
                "molecular_weight": protein.molecular_weight,
                "isoelectric_point": protein.isoelectric_point,
                "created_at": protein.created_at.isoformat() if protein.created_at else None
            }
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in update_protein: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.delete("/{protein_id}")
def delete_protein(request: HttpRequest, protein_id: str):
    """
    Delete a protein
    
    This endpoint:
    1. Deletes a protein from the database
    2. Returns a success message
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        name = protein.name
        protein.delete()
        
        return {
            "success": True,
            "message": f"Protein {name} has been deleted"
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in delete_protein: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/search", response=ProteinListResponse)
def search_proteins(request: HttpRequest, search_params: ProteinSearchParams):
    """
    Search for proteins with specific criteria
    
    This endpoint:
    1. Searches for proteins matching the criteria
    2. Returns a list of matching proteins
    """
    try:
        # Start with all proteins
        query = Protein.objects.all()
        
        # Apply filters based on search parameters
        if search_params.name:
            query = query.filter(name__icontains=search_params.name)
        
        if search_params.uniprot_id:
            query = query.filter(uniprot_id__icontains=search_params.uniprot_id)
        
        if search_params.min_molecular_weight:
            query = query.filter(molecular_weight__gte=search_params.min_molecular_weight)
        
        if search_params.max_molecular_weight:
            query = query.filter(molecular_weight__lte=search_params.max_molecular_weight)
        
        # Handle relationships - these require joins
        if search_params.from_gene:
            gene = Gene.objects.filter(ensembl_id=search_params.from_gene).first()
            if gene:
                query = query.filter(genes=gene)
        
        if search_params.has_domain:
            domain = ProteinDomain.objects.filter(name=search_params.has_domain).first()
            if domain:
                query = query.filter(domains=domain)
        
        if search_params.in_pathway:
            pathway = Pathway.objects.filter(name=search_params.in_pathway).first()
            if pathway:
                query = query.filter(pathways=pathway)
        
        # Execute query
        proteins = query.distinct().order_by('name')
        count = proteins.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "uniprot_id": p.uniprot_id,
                    "name": p.name,
                    "sequence": p.sequence,
                    "molecular_weight": p.molecular_weight,
                    "isoelectric_point": p.isoelectric_point,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in proteins
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in search_proteins: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/genes")
def get_protein_genes(request: HttpRequest, protein_id: str):
    """
    Get genes that encode this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the genes that encode this protein
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        genes = protein.genes.all()
        
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
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in get_protein_genes: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/peptides")
def get_protein_peptides(request: HttpRequest, protein_id: str):
    """
    Get peptides that are part of this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the peptides that are part of this protein
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        peptides = protein.peptides.all()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "sequence": p.sequence,
                    "length": p.length,
                    "molecular_weight": p.molecular_weight
                }
                for p in peptides
            ],
            "count": peptides.count()
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in get_protein_peptides: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{protein_id}/add_peptide")
def add_protein_peptide(
    request: HttpRequest, 
    protein_id: str,
    peptide_sequence: str,
    start_position: int = None
):
    """
    Add a peptide to a protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Creates a peptide if it doesn't exist
    3. Creates a CONTAINS relationship
    4. Returns a success message
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        
        # Check if peptide already exists
        peptide = Peptide.objects.filter(sequence=peptide_sequence).first()
        
        if not peptide:
            # Calculate peptide properties
            from ..utils.genomics_utils import calculate_peptide_properties
            properties = calculate_peptide_properties(peptide_sequence)
            
            # Create peptide
            peptide = Peptide.objects.create(
                uid=uuid.uuid4(),
                sequence=peptide_sequence,
                length=properties['length'],
                molecular_weight=properties['molecular_weight'],
                isoelectric_point=properties.get('isoelectric_point'),
                stability_score=properties.get('hydrophobicity')
            )
        
        # Add relationship
        protein.peptides.add(peptide)
        
        # If start_position provided, store it in the relation (using through table)
        if start_position is not None:
            contains_rel = Contains.objects.get(protein=protein, peptide=peptide)
            contains_rel.start_position = start_position
            contains_rel.save()
        
        return {
            "success": True,
            "message": f"Peptide {peptide_sequence} added to protein {protein.name}",
            "peptide_id": str(peptide.uid)
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in add_protein_peptide: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{protein_id}/pathway/{pathway_id}")
def add_protein_pathway(
    request: HttpRequest, 
    protein_id: str, 
    pathway_id: str
):
    """
    Add a protein to a pathway
    
    This endpoint:
    1. Retrieves a protein and pathway by ID
    2. Creates a PARTICIPATES_IN relationship
    3. Returns a success message
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        pathway = get_object_or_404(Pathway, uid=pathway_id)
        
        # Add relationship
        protein.pathways.add(pathway)
        
        return {
            "success": True,
            "message": f"Protein {protein.name} added to pathway {pathway.name}"
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Pathway.DoesNotExist:
        return {
            "success": False,
            "error": f"Pathway with ID {pathway_id} not found"
        }
    except Exception as e:
        print(f"Error in add_protein_pathway: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{protein_id}/domain/{domain_id}")
def add_protein_domain(
    request: HttpRequest, 
    protein_id: str, 
    domain_id: str,
    start_position: int = None,
    end_position: int = None
):
    """
    Add a domain to a protein
    
    This endpoint:
    1. Retrieves a protein and domain by ID
    2. Creates a HAS_DOMAIN relationship
    3. Returns a success message
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        domain = get_object_or_404(ProteinDomain, uid=domain_id)
        
        # Add relationship
        protein.domains.add(domain)
        
        # If position information provided, store it in the relation (using through table)
        if start_position is not None or end_position is not None:
            rel = HasDomain.objects.get(protein=protein, domain=domain)
            if start_position is not None:
                rel.start_position = start_position
            if end_position is not None:
                rel.end_position = end_position
            rel.save()
        
        return {
            "success": True,
            "message": f"Domain {domain.name} added to protein {protein.name}"
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except ProteinDomain.DoesNotExist:
        return {
            "success": False,
            "error": f"ProteinDomain with ID {domain_id} not found"
        }
    except Exception as e:
        print(f"Error in add_protein_domain: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{protein_id}/interact/{other_protein_id}")
def add_protein_interaction(
    request: HttpRequest, 
    protein_id: str, 
    other_protein_id: str,
    interaction_strength: float = None,
    interaction_type: str = None
):
    """
    Create an interaction between two proteins
    
    This endpoint:
    1. Retrieves both proteins by ID
    2. Creates an INTERACTS_WITH relationship
    3. Returns a success message
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        other_protein = get_object_or_404(Protein, uid=other_protein_id)
        
        # Create the interaction record
        interaction = InteractsWith.objects.create(
            source_protein=protein,
            target_protein=other_protein,
            interaction_strength=interaction_strength if interaction_strength else 0.5
        )
        
        # Add type if provided
        if interaction_type:
            interaction.interaction_type = interaction_type
            interaction.save()
        
        return {
            "success": True,
            "message": f"Interaction created between {protein.name} and {other_protein.name}"
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"One of the proteins was not found"
        }
    except Exception as e:
        print(f"Error in add_protein_interaction: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/interactions")
def get_protein_interactions(request: HttpRequest, protein_id: str):
    """
    Get proteins that interact with this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the proteins that interact with it
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        
        # Get outgoing interactions (source_protein is this protein)
        outgoing = InteractsWith.objects.filter(source_protein=protein)
        
        # Get incoming interactions (target_protein is this protein)
        incoming = InteractsWith.objects.filter(target_protein=protein)
        
        interactions = []
        
        # Process outgoing interactions
        for interaction in outgoing:
            interactions.append({
                "protein": {
                    "uid": str(interaction.target_protein.uid),
                    "name": interaction.target_protein.name,
                    "uniprot_id": interaction.target_protein.uniprot_id
                },
                "direction": "outgoing",
                "strength": interaction.interaction_strength,
                "type": interaction.interaction_type
            })
        
        # Process incoming interactions
        for interaction in incoming:
            interactions.append({
                "protein": {
                    "uid": str(interaction.source_protein.uid),
                    "name": interaction.source_protein.name,
                    "uniprot_id": interaction.source_protein.uniprot_id
                },
                "direction": "incoming",
                "strength": interaction.interaction_strength,
                "type": interaction.interaction_type
            })
        
        return {
            "success": True,
            "data": interactions,
            "count": len(interactions)
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in get_protein_interactions: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/domains")
def get_protein_domains(request: HttpRequest, protein_id: str):
    """
    Get domains that are part of this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the domains that are part of this protein
    """
    try:
        protein = get_object_or_404(Protein, uid=protein_id)
        domains = protein.domains.all()
        
        domain_data = []
        for domain in domains:
            # Get the relationship data
            try:
                rel = HasDomain.objects.get(protein=protein, domain=domain)
                start_pos = rel.start_position
                end_pos = rel.end_position
            except HasDomain.DoesNotExist:
                start_pos = None
                end_pos = None
            
            domain_data.append({
                "uid": str(domain.uid),
                "name": domain.name,
                "pfam_id": domain.pfam_id,
                "start_position": start_pos,
                "end_position": end_pos
            })
        
        return {
            "success": True,
            "data": domain_data,
            "count": len(domain_data)
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in get_protein_domains: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }