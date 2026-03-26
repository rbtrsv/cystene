from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Peptide, Protein, BioActivity
from ..schemas.peptide_schemas import (
    PeptideCreate, PeptideUpdate, PeptideDetail, 
    PeptideSearchParams, PeptideResponse, PeptideListResponse,
    SimilarPeptideDetail
)
from ..utils.neo4j_utils import (
    get_neo4j_connection, execute_cypher, paginate_results
)
from ..utils.genomics_utils import (
    calculate_peptide_properties, predict_peptide_activities,
    estimate_synthesis_difficulty, calculate_peptide_similarity
)

router = Router(tags=["Neo4j Peptides"])

@router.get("/", response=PeptideListResponse)
def list_peptides(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List peptides with optional pagination
    
    This endpoint:
    1. Retrieves peptides from the Neo4j database
    2. Returns a paginated list of peptides
    """
    try:
        peptides = Peptide.nodes.all()[offset:offset+limit]
        count = len(Peptide.nodes.all())
        
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
                    "created_at": p.created_at
                }
                for p in peptides
            ],
            "count": count
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
        peptide = Peptide.nodes.get(uid=peptide_id)
        
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
                "created_at": peptide.created_at
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
        # Check if peptide already exists
        existing = Peptide.nodes.filter(sequence=data.sequence)
        if existing:
            return {
                "success": False,
                "data": None,
                "error": f"Peptide with sequence {data.sequence} already exists"
            }
        
        # Calculate properties if not provided
        if not data.molecular_weight or not data.length:
            properties = calculate_peptide_properties(data.sequence)
            molecular_weight = properties.get('molecular_weight', 0.0) if not data.molecular_weight else data.molecular_weight
            length = properties.get('length', len(data.sequence)) if not data.length else data.length
            isoelectric_point = properties.get('isoelectric_point') if not data.isoelectric_point else data.isoelectric_point
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
        peptide = Peptide(
            sequence=data.sequence,
            length=length,
            molecular_weight=molecular_weight,
            isoelectric_point=isoelectric_point,
            predicted_activities=predicted_activities,
            synthesis_difficulty=synthesis_difficulty,
            stability_score=data.stability_score
        ).save()
        
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
                "created_at": peptide.created_at
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
        peptide = Peptide.nodes.get(uid=peptide_id)
        
        if data.sequence:
            peptide.sequence = data.sequence
        if data.length:
            peptide.length = data.length
        if data.molecular_weight:
            peptide.molecular_weight = data.molecular_weight
        if data.isoelectric_point:
            peptide.isoelectric_point = data.isoelectric_point
        if data.predicted_activities:
            peptide.predicted_activities = data.predicted_activities
        if data.synthesis_difficulty is not None:
            peptide.synthesis_difficulty = data.synthesis_difficulty
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
                "created_at": peptide.created_at
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

@router.delete("/{peptide_id}", response=Dict[str, Any])
def delete_peptide(request: HttpRequest, peptide_id: str):
    """
    Delete a peptide
    
    This endpoint:
    1. Deletes a peptide from the database
    2. Returns a success message
    """
    try:
        peptide = Peptide.nodes.get(uid=peptide_id)
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
        query_parts = []
        params = {}
        
        if search_params.sequence_pattern:
            query_parts.append("p.sequence =~ $sequence_pattern")
            params["sequence_pattern"] = f".*{search_params.sequence_pattern}.*"
        
        if search_params.min_length:
            query_parts.append("p.length >= $min_length")
            params["min_length"] = search_params.min_length
        
        if search_params.max_length:
            query_parts.append("p.length <= $max_length")
            params["max_length"] = search_params.max_length
        
        if search_params.min_molecular_weight:
            query_parts.append("p.molecular_weight >= $min_mw")
            params["min_mw"] = search_params.min_molecular_weight
        
        if search_params.max_molecular_weight:
            query_parts.append("p.molecular_weight <= $max_mw")
            params["max_mw"] = search_params.max_molecular_weight
        
        if search_params.min_stability:
            query_parts.append("p.stability_score >= $min_stability")
            params["min_stability"] = search_params.min_stability
        
        if search_params.has_activity:
            query_parts.append("$activity IN p.predicted_activities")
            params["activity"] = search_params.has_activity
        
        if search_params.from_protein:
            query_parts.append("(p)<-[:CONTAINS]-(:Protein {uniprot_id: $protein_id})")
            params["protein_id"] = search_params.from_protein
        
        if not query_parts:
            return {
                "success": False,
                "data": None,
                "count": 0,
                "error": "No search criteria provided"
            }
        
        query = "MATCH (p:Peptide) WHERE " + " AND ".join(query_parts) + " RETURN p"
        
        results, _ = execute_cypher(query, params)
        
        peptides = [Peptide.inflate(result[0]) for result in results]
        
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
                    "created_at": p.created_at
                }
                for p in peptides
            ],
            "count": len(peptides)
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
    1. Finds peptides with similarity relationships to the given peptide
    2. Returns a list of similar peptides
    """
    try:
        peptide = Peptide.nodes.get(uid=peptide_id)
        
        query = """
        MATCH (p:Peptide {uid: $peptide_id})-[r:SIMILAR_TO]->(similar:Peptide)
        WHERE r.similarity_score >= $threshold
        RETURN similar, r.similarity_score as score
        ORDER BY score DESC
        LIMIT $limit
        """
        
        params = {
            "peptide_id": peptide_id,
            "threshold": similarity_threshold,
            "limit": limit
        }
        
        results, _ = execute_cypher(query, params)
        
        similar_peptides = []
        for result in results:
            similar = Peptide.inflate(result[0])
            score = result[1]
            similar_peptides.append({
                "peptide": {
                    "uid": str(similar.uid),
                    "sequence": similar.sequence,
                    "length": similar.length,
                    "molecular_weight": similar.molecular_weight,
                    "isoelectric_point": similar.isoelectric_point,
                    "predicted_activities": similar.predicted_activities,
                    "synthesis_difficulty": similar.synthesis_difficulty,
                    "stability_score": similar.stability_score,
                    "created_at": similar.created_at
                },
                "similarity_score": score
            })
        
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

@router.post("/{peptide_id}/activity/{activity_id}", response=Dict[str, Any])
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
        peptide = Peptide.nodes.get(uid=peptide_id)
        activity = BioActivity.nodes.get(uid=activity_id)
        
        # Create relationship
        rel = peptide.activities.connect(activity)
        if strength is not None:
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

@router.post("/{peptide_id}/similarity_to/{other_peptide_id}", response=Dict[str, Any])
def add_peptide_similarity(
    request: HttpRequest, 
    peptide_id: str, 
    other_peptide_id: str,
    similarity_score: float = None
):
    """
    Add a similarity relationship between two peptides
    
    This endpoint:
    1. Retrieves the two peptides by ID
    2. Creates a SIMILAR_TO relationship
    3. Returns a success message
    """
    try:
        peptide = Peptide.nodes.get(uid=peptide_id)
        other_peptide = Peptide.nodes.get(uid=other_peptide_id)
        
        # Calculate similarity if not provided
        if similarity_score is None:
            similarity_score = calculate_peptide_similarity(peptide.sequence, other_peptide.sequence)
        
        # Create relationship
        rel = peptide.similar_peptides.connect(other_peptide)
        rel.similarity_score = similarity_score
        rel.save()
        
        return {
            "success": True,
            "message": f"Relationship created: Peptide {peptide.sequence} SIMILAR_TO {other_peptide.sequence} with score {similarity_score}"
        }
    except Peptide.DoesNotExist:
        return {
            "success": False,
            "error": f"One of the peptides was not found"
        }
    except Exception as e:
        print(f"Error in add_peptide_similarity: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }