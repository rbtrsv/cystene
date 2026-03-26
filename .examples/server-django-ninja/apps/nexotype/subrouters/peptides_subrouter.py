from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from typing import List, Optional, Dict, Any
import uuid

from ..models import Peptide, Protein, BioActivity, HasActivity
from ..schemas.peptide_schemas import (
    PeptideCreate, PeptideUpdate, PeptideDetail, 
    PeptideSearchParams, PeptideResponse, PeptideListResponse,
    SimilarPeptideDetail
)
from ..utils.genomics_utils import (
    calculate_peptide_properties, predict_peptide_activities,
    estimate_synthesis_difficulty, calculate_peptide_similarity
)

router = Router(tags=["Peptides"])

@router.get("/", response=PeptideListResponse)
def list_peptides(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List peptides with optional pagination
    
    This endpoint:
    1. Retrieves peptides from the database
    2. Returns a paginated list of peptides
    """
    try:
        # Retrieve peptides with pagination
        peptides = Peptide.objects.all().order_by('sequence')[offset:offset+limit]
        total_count = Peptide.objects.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "sequence": p.sequence,
                    "length": p.length,
                    "molecular_weight": p.molecular_weight,
                    "isoelectric_point": p.isoelectric_point,
                    "predicted_activities": p.predicted_activities,
                    "synthesis_difficulty": p.synthesis_difficulty,
                    "stability_score": p.stability_score,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in peptides
            ],
            "count": total_count
        }
    except Exception as e:
        print(f"Error in list_peptides: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{peptide_id}", response=PeptideResponse)
def get_peptide(request: HttpRequest, peptide_id: str):
    """
    Get details for a specific peptide
    
    This endpoint:
    1. Retrieves a peptide by ID
    2. Returns the peptide details
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(peptide.uid),
                "sequence": peptide.sequence,
                "length": peptide.length,
                "molecular_weight": peptide.molecular_weight,
                "isoelectric_point": peptide.isoelectric_point,
                "predicted_activities": peptide.predicted_activities,
                "synthesis_difficulty": peptide.synthesis_difficulty,
                "stability_score": peptide.stability_score,
                "created_at": peptide.created_at.isoformat() if peptide.created_at else None
            }
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except Exception as e:
        print(f"Error in get_peptide: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/", response=PeptideResponse)
def create_peptide(request: HttpRequest, data: PeptideCreate):
    """
    Create a new peptide
    
    This endpoint:
    1. Creates a new peptide with the provided data
    2. Returns the created peptide details
    """
    try:
        # Check if peptide already exists with the same sequence
        if Peptide.objects.filter(sequence=data.sequence).exists():
            return {
                "success": False,
                "data": None,
                "error": f"Peptide with sequence {data.sequence} already exists"
            }
        
        # Calculate properties if not provided
        if not data.molecular_weight or not data.length or not data.isoelectric_point:
            properties = calculate_peptide_properties(data.sequence)
            
            molecular_weight = data.molecular_weight or properties.get('molecular_weight')
            length = data.length or properties.get('length')
            isoelectric_point = data.isoelectric_point or properties.get('isoelectric_point')
        else:
            molecular_weight = data.molecular_weight
            length = data.length
            isoelectric_point = data.isoelectric_point
        
        # Predict activities if not provided
        predicted_activities = data.predicted_activities
        if not predicted_activities:
            predicted_activities = predict_peptide_activities(data.sequence)
        
        # Estimate synthesis difficulty if not provided
        synthesis_difficulty = data.synthesis_difficulty
        if synthesis_difficulty is None:
            synthesis_difficulty = estimate_synthesis_difficulty(data.sequence)
        
        # Create peptide
        peptide = Peptide.objects.create(
            uid=uuid.uuid4(),
            sequence=data.sequence,
            length=length,
            molecular_weight=molecular_weight,
            isoelectric_point=isoelectric_point,
            predicted_activities=predicted_activities,
            synthesis_difficulty=synthesis_difficulty,
            stability_score=data.stability_score
        )
        
        return {
            "success": True,
            "data": {
                "uid": str(peptide.uid),
                "sequence": peptide.sequence,
                "length": peptide.length,
                "molecular_weight": peptide.molecular_weight,
                "isoelectric_point": peptide.isoelectric_point,
                "predicted_activities": peptide.predicted_activities,
                "synthesis_difficulty": peptide.synthesis_difficulty,
                "stability_score": peptide.stability_score,
                "created_at": peptide.created_at.isoformat() if peptide.created_at else None
            }
        }
    except Exception as e:
        print(f"Error in create_peptide: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.put("/{peptide_id}", response=PeptideResponse)
def update_peptide(request: HttpRequest, peptide_id: str, data: PeptideUpdate):
    """
    Update a peptide
    
    This endpoint:
    1. Updates a peptide with the provided data
    2. Returns the updated peptide details
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        
        # Update fields if provided
        if data.sequence:
            # Check if the new sequence is already in use by another peptide
            if Peptide.objects.exclude(uid=peptide_id).filter(sequence=data.sequence).exists():
                return {
                    "success": False,
                    "data": None,
                    "error": f"Sequence {data.sequence} is already in use by another peptide"
                }
            peptide.sequence = data.sequence
            
            # Recalculate properties when sequence changes
            properties = calculate_peptide_properties(data.sequence)
            peptide.length = properties.get('length')
            peptide.molecular_weight = properties.get('molecular_weight')
            peptide.isoelectric_point = properties.get('isoelectric_point')
            peptide.synthesis_difficulty = estimate_synthesis_difficulty(data.sequence)
        else:
            # Individual property updates when sequence doesn't change
            if data.length:
                peptide.length = data.length
            if data.molecular_weight:
                peptide.molecular_weight = data.molecular_weight
            if data.isoelectric_point:
                peptide.isoelectric_point = data.isoelectric_point
            if data.synthesis_difficulty is not None:
                peptide.synthesis_difficulty = data.synthesis_difficulty
                
        # These are always updatable regardless of sequence change
        if data.predicted_activities:
            peptide.predicted_activities = data.predicted_activities
        if data.stability_score is not None:
            peptide.stability_score = data.stability_score
        
        peptide.save()
        
        return {
            "success": True,
            "data": {
                "uid": str(peptide.uid),
                "sequence": peptide.sequence,
                "length": peptide.length,
                "molecular_weight": peptide.molecular_weight,
                "isoelectric_point": peptide.isoelectric_point,
                "predicted_activities": peptide.predicted_activities,
                "synthesis_difficulty": peptide.synthesis_difficulty,
                "stability_score": peptide.stability_score,
                "created_at": peptide.created_at.isoformat() if peptide.created_at else None
            }
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except Exception as e:
        print(f"Error in update_peptide: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.delete("/{peptide_id}")
def delete_peptide(request: HttpRequest, peptide_id: str):
    """
    Delete a peptide
    
    This endpoint:
    1. Deletes a peptide from the database
    2. Returns a success message
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        sequence = peptide.sequence
        peptide.delete()
        
        return {
            "success": True,
            "message": f"Peptide with sequence {sequence} has been deleted"
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except Exception as e:
        print(f"Error in delete_peptide: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/search", response=PeptideListResponse)
def search_peptides(request: HttpRequest, search_params: PeptideSearchParams):
    """
    Search for peptides with specific criteria
    
    This endpoint:
    1. Searches for peptides matching the criteria
    2. Returns a list of matching peptides
    """
    try:
        # Start with all peptides
        query = Peptide.objects.all()
        
        # Apply filters based on search parameters
        if search_params.sequence_pattern:
            query = query.filter(sequence__icontains=search_params.sequence_pattern)
        
        if search_params.min_length:
            query = query.filter(length__gte=search_params.min_length)
            
        if search_params.max_length:
            query = query.filter(length__lte=search_params.max_length)
        
        if search_params.min_molecular_weight:
            query = query.filter(molecular_weight__gte=search_params.min_molecular_weight)
            
        if search_params.max_molecular_weight:
            query = query.filter(molecular_weight__lte=search_params.max_molecular_weight)
            
        if search_params.min_stability:
            query = query.filter(stability_score__gte=search_params.min_stability)
        
        # Search in activities array field
        if search_params.has_activity:
            # This assumes predicted_activities is stored as a JSONField
            query = query.filter(predicted_activities__contains=[search_params.has_activity])
        
        # Handle relationships
        if search_params.from_protein:
            protein = Protein.objects.filter(uniprot_id=search_params.from_protein).first()
            if protein:
                query = query.filter(proteins=protein)
        
        # Execute query
        peptides = query.distinct().order_by('sequence')
        count = peptides.count()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "sequence": p.sequence,
                    "length": p.length,
                    "molecular_weight": p.molecular_weight,
                    "isoelectric_point": p.isoelectric_point,
                    "predicted_activities": p.predicted_activities,
                    "synthesis_difficulty": p.synthesis_difficulty,
                    "stability_score": p.stability_score,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in peptides
            ],
            "count": count
        }
    except Exception as e:
        print(f"Error in search_peptides: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{peptide_id}/similar", response=Dict[str, Any])
def get_similar_peptides(
    request: HttpRequest, 
    peptide_id: str, 
    similarity_threshold: float = 0.7,
    limit: int = 10
):
    """
    Find peptides similar to the given peptide
    
    This endpoint:
    1. Finds peptides with sequence similarity to the given peptide
    2. Returns a list of similar peptides
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        
        # Get all other peptides
        other_peptides = Peptide.objects.exclude(uid=peptide_id)
        
        # Calculate similarity for each peptide
        similar_peptides = []
        for other in other_peptides:
            similarity = calculate_peptide_similarity(peptide.sequence, other.sequence)
            if similarity >= similarity_threshold:
                similar_peptides.append({
                    "peptide": {
                        "uid": str(other.uid),
                        "sequence": other.sequence,
                        "length": other.length,
                        "molecular_weight": other.molecular_weight,
                        "isoelectric_point": other.isoelectric_point,
                        "predicted_activities": other.predicted_activities,
                        "synthesis_difficulty": other.synthesis_difficulty,
                        "stability_score": other.stability_score,
                        "created_at": other.created_at.isoformat() if other.created_at else None
                    },
                    "similarity_score": similarity
                })
        
        # Sort by similarity score (highest first) and limit results
        similar_peptides.sort(key=lambda x: x["similarity_score"], reverse=True)
        similar_peptides = similar_peptides[:limit]
        
        return {
            "success": True,
            "data": similar_peptides,
            "count": len(similar_peptides)
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "data": None,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except Exception as e:
        print(f"Error in get_similar_peptides: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{peptide_id}/activity/{activity_id}")
def add_peptide_activity(
    request: HttpRequest, 
    peptide_id: str, 
    activity_id: str,
    strength: float = None
):
    """
    Add a bioactivity to a peptide
    
    This endpoint:
    1. Retrieves a peptide and bioactivity by ID
    2. Creates a HAS_ACTIVITY relationship
    3. Returns a success message
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        activity = get_object_or_404(BioActivity, uid=activity_id)
        
        # Add relationship
        peptide.activities.add(activity)
        
        # If strength provided, update the through table
        if strength is not None:
            rel = HasActivity.objects.get(peptide=peptide, bio_activity=activity)
            rel.strength = strength
            rel.save()
        
        return {
            "success": True,
            "message": f"Relationship created: Peptide {peptide.sequence} HAS_ACTIVITY {activity.name}"
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except BioActivity.DoesNotExist:
        return {
            "success": False,
            "error": f"BioActivity with ID {activity_id} not found"
        }
    except Exception as e:
        print(f"Error in add_peptide_activity: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{peptide_id}/activities")
def get_peptide_activities(request: HttpRequest, peptide_id: str):
    """
    Get bioactivities of a peptide
    
    This endpoint:
    1. Retrieves a peptide by ID
    2. Returns its bioactivities
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        activities = peptide.activities.all()
        
        # Get strength from through table
        activity_data = []
        for activity in activities:
            try:
                rel = HasActivity.objects.get(peptide=peptide, bio_activity=activity)
                strength = rel.strength
            except HasActivity.DoesNotExist:
                strength = None
            
            activity_data.append({
                "uid": str(activity.uid),
                "name": activity.name,
                "activity_type": activity.activity_type,
                "strength": strength
            })
        
        return {
            "success": True,
            "data": activity_data,
            "count": len(activity_data)
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except Exception as e:
        print(f"Error in get_peptide_activities: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{peptide_id}/proteins")
def get_peptide_proteins(request: HttpRequest, peptide_id: str):
    """
    Get proteins that contain this peptide
    
    This endpoint:
    1. Retrieves a peptide by ID
    2. Returns proteins that contain it
    """
    try:
        peptide = get_object_or_404(Peptide, uid=peptide_id)
        proteins = peptide.proteins.all()
        
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
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "error": f"Peptide with ID {peptide_id} not found"
        }
    except Exception as e:
        print(f"Error in get_peptide_proteins: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }