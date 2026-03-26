from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Peptide, Protein, BioActivity
from ..schemas.peptide_schemas import (
    PeptideCreate, PeptideUpdate, PeptideDetail, 
    PeptideSearchParams, PeptideResponse, PeptideListResponse
)
from ..utils.surreal_connection_utils import (
    get_surreal_connection, run_async, execute_query,
    paginate_results, create_record, update_record, delete_record
)
from ..utils.genomics_utils import (
    calculate_peptide_properties, predict_peptide_activities,
    estimate_synthesis_difficulty, calculate_peptide_similarity
)

router = Router(tags=["SurrealDB Peptides"])

@router.get("/", response=PeptideListResponse)
def list_peptides(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List peptides with optional pagination
    
    This endpoint:
    1. Retrieves peptides from the SurrealDB database
    2. Returns a paginated list of peptides
    """
    try:
        async def get_peptides():
            db = await get_surreal_connection()
            result, total = await paginate_results(
                "SELECT * FROM peptide", 
                {"limit": limit, "offset": offset},
                page=1,
                page_size=limit
            )
            
            peptides = []
            if result and result[0].get('result'):
                peptides = result[0]['result']
            
            return peptides, total
        
        peptides, count = run_async(get_peptides())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": p.get('id', '').replace('peptide:', ''),
                    "sequence": p.get('sequence', ''),
                    "length": p.get('length', 0),
                    "molecular_weight": p.get('molecular_weight', 0.0),
                    "isoelectric_point": p.get('isoelectric_point', None),
                    "predicted_activities": p.get('predicted_activities', []),
                    "synthesis_difficulty": p.get('synthesis_difficulty', None),
                    "stability_score": p.get('stability_score', None),
                    "created_at": p.get('created_at', '')
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
        async def get_peptide_by_id():
            db = await get_surreal_connection()
            result = await db.select(f"peptide:{peptide_id}")
            if not result:
                return None
            return result
        
        peptide = run_async(get_peptide_by_id())
        
        if not peptide:
            return {
                "success": False,
                "data": None,
                "error": f"Peptide with ID {peptide_id} not found"
            }
        
        return {
            "success": True,
            "data": {
                "uid": peptide_id,
                "sequence": peptide.get('sequence', ''),
                "length": peptide.get('length', 0),
                "molecular_weight": peptide.get('molecular_weight', 0.0),
                "isoelectric_point": peptide.get('isoelectric_point', None),
                "predicted_activities": peptide.get('predicted_activities', []),
                "synthesis_difficulty": peptide.get('synthesis_difficulty', None),
                "stability_score": peptide.get('stability_score', None),
                "created_at": peptide.get('created_at', '')
            }
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
        async def do_create_peptide():
            db = await get_surreal_connection()
            
            # Check if peptide already exists
            result = await db.query(
                "SELECT * FROM peptide WHERE sequence = $sequence",
                {"sequence": data.sequence}
            )
            
            if result and result[0].get('result') and len(result[0]['result']) > 0:
                return None, f"Peptide with sequence {data.sequence} already exists"
            
            # Calculate properties if not provided
            properties = calculate_peptide_properties(data.sequence)
            
            # Create peptide data
            peptide_data = {
                "sequence": data.sequence,
                "length": data.length if data.length else properties['length'],
                "molecular_weight": data.molecular_weight if data.molecular_weight else properties['molecular_weight'],
                "isoelectric_point": data.isoelectric_point if data.isoelectric_point else properties.get('isoelectric_point'),
                "predicted_activities": data.predicted_activities if data.predicted_activities else predict_peptide_activities(data.sequence),
                "synthesis_difficulty": data.synthesis_difficulty if data.synthesis_difficulty is not None else estimate_synthesis_difficulty(data.sequence),
                "stability_score": data.stability_score
            }
            
            # Create peptide
            created = await db.create("peptide", peptide_data)
            return created, None
        
        peptide, error = run_async(do_create_peptide())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        peptide_id = peptide.get('id', '').replace('peptide:', '')
        
        return {
            "success": True,
            "data": {
                "uid": peptide_id,
                "sequence": peptide.get('sequence', ''),
                "length": peptide.get('length', 0),
                "molecular_weight": peptide.get('molecular_weight', 0.0),
                "isoelectric_point": peptide.get('isoelectric_point', None),
                "predicted_activities": peptide.get('predicted_activities', []),
                "synthesis_difficulty": peptide.get('synthesis_difficulty', None),
                "stability_score": peptide.get('stability_score', None),
                "created_at": peptide.get('created_at', '')
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
        async def do_update_peptide():
            db = await get_surreal_connection()
            
            # Check if peptide exists
            existing = await db.select(f"peptide:{peptide_id}")
            if not existing:
                return None, f"Peptide with ID {peptide_id} not found"
            
            # Prepare update data
            update_data = {}
            if data.sequence:
                update_data["sequence"] = data.sequence
                # Recalculate properties if sequence changes
                properties = calculate_peptide_properties(data.sequence)
                update_data["length"] = properties['length']
                update_data["molecular_weight"] = properties['molecular_weight']
                update_data["isoelectric_point"] = properties.get('isoelectric_point')
            else:
                if data.length:
                    update_data["length"] = data.length
                if data.molecular_weight:
                    update_data["molecular_weight"] = data.molecular_weight
                if data.isoelectric_point:
                    update_data["isoelectric_point"] = data.isoelectric_point
                
            if data.predicted_activities:
                update_data["predicted_activities"] = data.predicted_activities
            if data.synthesis_difficulty is not None:
                update_data["synthesis_difficulty"] = data.synthesis_difficulty
            if data.stability_score is not None:
                update_data["stability_score"] = data.stability_score
            
            # Update peptide
            updated = await db.update(f"peptide:{peptide_id}", update_data)
            return updated, None
        
        peptide, error = run_async(do_update_peptide())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        return {
            "success": True,
            "data": {
                "uid": peptide_id,
                "sequence": peptide.get('sequence', ''),
                "length": peptide.get('length', 0),
                "molecular_weight": peptide.get('molecular_weight', 0.0),
                "isoelectric_point": peptide.get('isoelectric_point', None),
                "predicted_activities": peptide.get('predicted_activities', []),
                "synthesis_difficulty": peptide.get('synthesis_difficulty', None),
                "stability_score": peptide.get('stability_score', None),
                "created_at": peptide.get('created_at', '')
            }
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
        async def do_delete_peptide():
            db = await get_surreal_connection()
            
            # Check if peptide exists
            existing = await db.select(f"peptide:{peptide_id}")
            if not existing:
                return None, f"Peptide with ID {peptide_id} not found"
            
            sequence = existing.get('sequence', '')
            
            # Delete peptide
            await db.delete(f"peptide:{peptide_id}")
            
            return sequence, None
        
        sequence, error = run_async(do_delete_peptide())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Peptide with sequence {sequence} has been deleted"
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
        async def do_search_peptides():
            db = await get_surreal_connection()
            
            # Build query
            query_parts = []
            params = {}
            
            if search_params.sequence_pattern:
                query_parts.append("sequence CONTAINS $sequence_pattern")
                params["sequence_pattern"] = search_params.sequence_pattern
            
            if search_params.min_length:
                query_parts.append("length >= $min_length")
                params["min_length"] = search_params.min_length
            
            if search_params.max_length:
                query_parts.append("length <= $max_length")
                params["max_length"] = search_params.max_length
            
            if search_params.min_molecular_weight:
                query_parts.append("molecular_weight >= $min_mw")
                params["min_mw"] = search_params.min_molecular_weight
            
            if search_params.max_molecular_weight:
                query_parts.append("molecular_weight <= $max_mw")
                params["max_mw"] = search_params.max_molecular_weight
            
            if search_params.min_stability:
                query_parts.append("stability_score >= $min_stability")
                params["min_stability"] = search_params.min_stability
            
            if search_params.has_activity:
                query_parts.append("$activity IN predicted_activities")
                params["activity"] = search_params.has_activity
            
            if search_params.from_protein:
                query_parts.append("<-contains<-protein.uniprot_id = $protein_id")
                params["protein_id"] = search_params.from_protein
            
            if not query_parts:
                return [], 0, "No search criteria provided"
            
            # Construct final query
            query = "SELECT * FROM peptide"
            if query_parts:
                query += " WHERE " + " AND ".join(query_parts)
            
            result, total = await paginate_results(query, params)
            
            peptides = []
            if result and result[0].get('result'):
                peptides = result[0]['result']
            
            return peptides, total, None
        
        peptides, count, error = run_async(do_search_peptides())
        
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
                    "uid": p.get('id', '').replace('peptide:', ''),
                    "sequence": p.get('sequence', ''),
                    "length": p.get('length', 0),
                    "molecular_weight": p.get('molecular_weight', 0.0),
                    "isoelectric_point": p.get('isoelectric_point', None),
                    "predicted_activities": p.get('predicted_activities', []),
                    "synthesis_difficulty": p.get('synthesis_difficulty', None),
                    "stability_score": p.get('stability_score', None),
                    "created_at": p.get('created_at', '')
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

@router.post("/{peptide_id}/similarity_to/{other_peptide_id}", response=Dict[str, Any])
def add_peptide_similarity(
    request: HttpRequest, 
    peptide_id: str, 
    other_peptide_id: str,
    similarity_score: Optional[float] = None
):
    """
    Add a similarity relationship between two peptides
    
    This endpoint:
    1. Retrieves both peptides by ID
    2. Creates a SIMILAR_TO relationship
    3. Returns a success message
    """
    try:
        async def do_add_similarity():
            db = await get_surreal_connection()
            
            # Check if peptides exist
            peptide = await db.select(f"peptide:{peptide_id}")
            if not peptide:
                return None, f"Peptide with ID {peptide_id} not found"
            
            other_peptide = await db.select(f"peptide:{other_peptide_id}")
            if not other_peptide:
                return None, f"Peptide with ID {other_peptide_id} not found"
            
            # Calculate similarity score if not provided
            score = similarity_score
            if score is None:
                score = calculate_peptide_similarity(peptide.get('sequence', ''), other_peptide.get('sequence', ''))
            
            # Create relationship
            await db.query(
                "RELATE peptide:$peptide_id->similar_to->peptide:$other_id SET similarity_score = $score;",
                {"peptide_id": peptide_id, "other_id": other_peptide_id, "score": score}
            )
            
            return {
                "peptide_sequence": peptide.get('sequence', ''),
                "other_peptide_sequence": other_peptide.get('sequence', ''),
                "similarity_score": score
            }, None
        
        result, error = run_async(do_add_similarity())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Similarity relationship created between peptides with score {result['similarity_score']}"
        }
    except Exception as e:
        print(f"Error in add_peptide_similarity: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }