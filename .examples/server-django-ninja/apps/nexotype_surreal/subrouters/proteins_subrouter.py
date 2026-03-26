from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Protein, Gene, Peptide, Pathway, ProteinDomain
from ..schemas.protein_schemas import (
    ProteinCreate, ProteinUpdate, ProteinDetail, 
    ProteinSearchParams, ProteinResponse, ProteinListResponse
)
from ..utils.surreal_connection_utils import (
    get_surreal_connection, run_async, execute_query,
    paginate_results, create_record, update_record, delete_record
)
from ..utils.genomics_utils import calculate_peptide_properties

router = Router(tags=["SurrealDB Proteins"])

@router.get("/", response=ProteinListResponse)
def list_proteins(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List proteins with optional pagination
    
    This endpoint:
    1. Retrieves proteins from the SurrealDB database
    2. Returns a paginated list of proteins
    """
    try:
        async def get_proteins():
            db = await get_surreal_connection()
            result, total = await paginate_results(
                "SELECT * FROM protein", 
                {"limit": limit, "offset": offset},
                page=1,
                page_size=limit
            )
            
            proteins = []
            if result and result[0].get('result'):
                proteins = result[0]['result']
            
            return proteins, total
        
        proteins, count = run_async(get_proteins())
        
        return {
            "success": True,
            "data": [
                {
                    "uid": p.get('id', '').replace('protein:', ''),
                    "uniprot_id": p.get('uniprot_id', ''),
                    "name": p.get('name', ''),
                    "sequence": p.get('sequence', ''),
                    "molecular_weight": p.get('molecular_weight', 0.0),
                    "isoelectric_point": p.get('isoelectric_point', None),
                    "created_at": p.get('created_at', '')
                }
                for p in proteins
            ],
            "count": count
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
        async def get_protein_by_id():
            db = await get_surreal_connection()
            result = await db.select(f"protein:{protein_id}")
            if not result:
                return None
            return result
        
        protein = run_async(get_protein_by_id())
        
        if not protein:
            return {
                "success": False,
                "data": None,
                "error": f"Protein with ID {protein_id} not found"
            }
        
        return {
            "success": True,
            "data": {
                "uid": protein_id,
                "uniprot_id": protein.get('uniprot_id', ''),
                "name": protein.get('name', ''),
                "sequence": protein.get('sequence', ''),
                "molecular_weight": protein.get('molecular_weight', 0.0),
                "isoelectric_point": protein.get('isoelectric_point', None),
                "created_at": protein.get('created_at', '')
            }
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
        async def do_create_protein():
            db = await get_surreal_connection()
            
            # Check if protein already exists
            result = await db.query(
                "SELECT * FROM protein WHERE uniprot_id = $uniprot_id",
                {"uniprot_id": data.uniprot_id}
            )
            
            if result and result[0].get('result') and len(result[0]['result']) > 0:
                return None, f"Protein with UniProt ID {data.uniprot_id} already exists"
            
            # Create protein data
            protein_data = {
                "uniprot_id": data.uniprot_id,
                "name": data.name,
                "sequence": data.sequence,
                "molecular_weight": data.molecular_weight,
                "isoelectric_point": data.isoelectric_point
            }
            
            # Create protein
            created = await db.create("protein", protein_data)
            
            # Connect to genes if provided
            if hasattr(data, 'gene_ids') and data.gene_ids:
                for gene_id in data.gene_ids:
                    # Check if gene exists
                    gene = await db.select(f"gene:{gene_id}")
                    if gene:
                        await db.query(
                            "RELATE gene:$gene_id->encodes->protein:$protein_id;",
                            {"gene_id": gene_id, "protein_id": created['id'].split(':')[1]}
                        )
            
            return created, None
        
        protein, error = run_async(do_create_protein())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        protein_id = protein.get('id', '').replace('protein:', '')
        
        return {
            "success": True,
            "data": {
                "uid": protein_id,
                "uniprot_id": protein.get('uniprot_id', ''),
                "name": protein.get('name', ''),
                "sequence": protein.get('sequence', ''),
                "molecular_weight": protein.get('molecular_weight', 0.0),
                "isoelectric_point": protein.get('isoelectric_point', None),
                "created_at": protein.get('created_at', '')
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
        async def do_update_protein():
            db = await get_surreal_connection()
            
            # Check if protein exists
            existing = await db.select(f"protein:{protein_id}")
            if not existing:
                return None, f"Protein with ID {protein_id} not found"
            
            # Prepare update data
            update_data = {}
            if data.uniprot_id:
                update_data["uniprot_id"] = data.uniprot_id
            if data.name:
                update_data["name"] = data.name
            if data.sequence:
                update_data["sequence"] = data.sequence
            if data.molecular_weight:
                update_data["molecular_weight"] = data.molecular_weight
            if data.isoelectric_point:
                update_data["isoelectric_point"] = data.isoelectric_point
            
            # Update protein
            updated = await db.update(f"protein:{protein_id}", update_data)
            return updated, None
        
        protein, error = run_async(do_update_protein())
        
        if error:
            return {
                "success": False,
                "data": None,
                "error": error
            }
        
        return {
            "success": True,
            "data": {
                "uid": protein_id,
                "uniprot_id": protein.get('uniprot_id', ''),
                "name": protein.get('name', ''),
                "sequence": protein.get('sequence', ''),
                "molecular_weight": protein.get('molecular_weight', 0.0),
                "isoelectric_point": protein.get('isoelectric_point', None),
                "created_at": protein.get('created_at', '')
            }
        }
    except Exception as e:
        print(f"Error in update_protein: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": f"An error occurred: {str(e)}"
        }

@router.delete("/{protein_id}", response=Dict[str, Any])
def delete_protein(request: HttpRequest, protein_id: str):
    """
    Delete a protein
    
    This endpoint:
    1. Deletes a protein from the database
    2. Returns a success message
    """
    try:
        async def do_delete_protein():
            db = await get_surreal_connection()
            
            # Check if protein exists
            existing = await db.select(f"protein:{protein_id}")
            if not existing:
                return None, f"Protein with ID {protein_id} not found"
            
            name = existing.get('name', '')
            
            # Delete protein
            await db.delete(f"protein:{protein_id}")
            
            return name, None
        
        name, error = run_async(do_delete_protein())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Protein {name} has been deleted"
        }
    except Exception as e:
        print(f"Error in delete_protein: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/peptides", response=Dict[str, Any])
def get_protein_peptides(request: HttpRequest, protein_id: str):
    """
    Get peptides that are part of this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the peptides that are part of this protein
    """
    try:
        async def do_get_peptides():
            db = await get_surreal_connection()
            
            # Check if protein exists
            existing = await db.select(f"protein:{protein_id}")
            if not existing:
                return None, f"Protein with ID {protein_id} not found"
            
            # Get peptides
            result = await db.query("""
                SELECT ->contains->peptide.* as peptides
                FROM protein:$protein_id
                FETCH peptides;
            """, {"protein_id": protein_id})
            
            peptides = []
            if result and result[0].get('result') and result[0]['result'][0].get('peptides'):
                peptides = result[0]['result'][0]['peptides']
            
            return peptides, None
        
        peptides, error = run_async(do_get_peptides())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "uid": p.get('id', '').replace('peptide:', ''),
                    "sequence": p.get('sequence', ''),
                    "length": p.get('length', 0),
                    "molecular_weight": p.get('molecular_weight', 0.0)
                }
                for p in peptides
            ],
            "count": len(peptides)
        }
    except Exception as e:
        print(f"Error in get_protein_peptides: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{protein_id}/add_peptide", response=Dict[str, Any])
def add_protein_peptide(
    request: HttpRequest, 
    protein_id: str,
    peptide_sequence: str,
    start_position: Optional[int] = None
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
        async def do_add_peptide():
            db = await get_surreal_connection()
            
            # Check if protein exists
            protein = await db.select(f"protein:{protein_id}")
            if not protein:
                return None, f"Protein with ID {protein_id} not found"
            
            # Check if peptide already exists
            result = await db.query(
                "SELECT * FROM peptide WHERE sequence = $sequence",
                {"sequence": peptide_sequence}
            )
            
            peptide_id = None
            
            if result and result[0].get('result') and len(result[0]['result']) > 0:
                # Use existing peptide
                peptide_id = result[0]['result'][0]['id'].split(':')[1]
            else:
                # Calculate peptide properties
                properties = calculate_peptide_properties(peptide_sequence)
                
                # Create new peptide
                peptide = await db.create("peptide", {
                    "sequence": peptide_sequence,
                    "length": properties['length'],
                    "molecular_weight": properties['molecular_weight'],
                    "isoelectric_point": properties.get('isoelectric_point')
                })
                
                peptide_id = peptide['id'].split(':')[1]
            
            # Create relationship
            if start_position is not None:
                await db.query(
                    "RELATE protein:$protein_id->contains->peptide:$peptide_id SET start_position = $start_position;",
                    {"protein_id": protein_id, "peptide_id": peptide_id, "start_position": start_position}
                )
            else:
                await db.query(
                    "RELATE protein:$protein_id->contains->peptide:$peptide_id;",
                    {"protein_id": protein_id, "peptide_id": peptide_id}
                )
            
            return {
                "protein_name": protein.get('name', ''),
                "peptide_sequence": peptide_sequence,
                "peptide_id": peptide_id,
                "start_position": start_position
            }, None
        
        result, error = run_async(do_add_peptide())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Peptide {result['peptide_sequence']} added to protein {result['protein_name']}",
            "peptide_id": result['peptide_id']
        }
    except Exception as e:
        print(f"Error in add_protein_peptide: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.post("/{protein_id}/interact/{other_protein_id}", response=Dict[str, Any])
def add_protein_interaction(
    request: HttpRequest, 
    protein_id: str, 
    other_protein_id: str,
    interaction_strength: Optional[float] = None,
    interaction_type: Optional[str] = None
):
    """
    Create an interaction between two proteins
    
    This endpoint:
    1. Retrieves both proteins by ID
    2. Creates an INTERACTS_WITH relationship
    3. Returns a success message
    """
    try:
        async def do_add_interaction():
            db = await get_surreal_connection()
            
            # Check if proteins exist
            protein = await db.select(f"protein:{protein_id}")
            if not protein:
                return None, f"Protein with ID {protein_id} not found"
            
            other_protein = await db.select(f"protein:{other_protein_id}")
            if not other_protein:
                return None, f"Protein with ID {other_protein_id} not found"
            
            # Create relationship
            params = {"protein_id": protein_id, "other_id": other_protein_id}
            
            if interaction_strength is not None and interaction_type is not None:
                await db.query(
                    "RELATE protein:$protein_id->interacts_with->protein:$other_id SET strength = $strength, interaction_type = $type;",
                    {**params, "strength": interaction_strength, "type": interaction_type}
                )
            elif interaction_strength is not None:
                await db.query(
                    "RELATE protein:$protein_id->interacts_with->protein:$other_id SET strength = $strength;",
                    {**params, "strength": interaction_strength}
                )
            elif interaction_type is not None:
                await db.query(
                    "RELATE protein:$protein_id->interacts_with->protein:$other_id SET interaction_type = $type;",
                    {**params, "type": interaction_type}
                )
            else:
                await db.query(
                    "RELATE protein:$protein_id->interacts_with->protein:$other_id;",
                    params
                )
            
            return {
                "protein_name": protein.get('name', ''),
                "other_protein_name": other_protein.get('name', '')
            }, None
        
        result, error = run_async(do_add_interaction())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "message": f"Interaction created between {result['protein_name']} and {result['other_protein_name']}"
        }
    except Exception as e:
        print(f"Error in add_protein_interaction: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/interactions", response=Dict[str, Any])
def get_protein_interactions(request: HttpRequest, protein_id: str):
    """
    Get proteins that interact with this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the proteins that interact with it
    """
    try:
        async def do_get_interactions():
            db = await get_surreal_connection()
            
            # Check if protein exists
            existing = await db.select(f"protein:{protein_id}")
            if not existing:
                return None, f"Protein with ID {protein_id} not found"
            
            # Get interacting proteins
            result = await db.query("""
                SELECT ->interacts_with->protein.* as proteins
                FROM protein:$protein_id
                FETCH proteins;
            """, {"protein_id": protein_id})
            
            proteins = []
            if result and result[0].get('result') and result[0]['result'][0].get('proteins'):
                proteins = result[0]['result'][0]['proteins']
            
            return proteins, None
        
        proteins, error = run_async(do_get_interactions())
        
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
        print(f"Error in get_protein_interactions: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/domains", response=Dict[str, Any])
def get_protein_domains(request: HttpRequest, protein_id: str):
    """
    Get domains that are part of this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the domains that are part of this protein
    """
    try:
        async def do_get_domains():
            db = await get_surreal_connection()
            
            # Check if protein exists
            existing = await db.select(f"protein:{protein_id}")
            if not existing:
                return None, f"Protein with ID {protein_id} not found"
            
            # Get domains
            result = await db.query("""
                SELECT ->has_domain->protein_domain.* as domains,
                       ->has_domain->protein_domain<-has_domain.start_position as start_positions,
                       ->has_domain->protein_domain<-has_domain.end_position as end_positions
                FROM protein:$protein_id
                FETCH domains;
            """, {"protein_id": protein_id})
            
            domains = []
            start_positions = []
            end_positions = []
            
            if result and result[0].get('result') and result[0]['result'][0].get('domains'):
                domains = result[0]['result'][0]['domains']
                start_positions = result[0]['result'][0].get('start_positions', [])
                end_positions = result[0]['result'][0].get('end_positions', [])
            
            return list(zip(domains, start_positions, end_positions)), None
        
        domain_data, error = run_async(do_get_domains())
        
        if error:
            return {
                "success": False,
                "error": error
            }
        
        return {
            "success": True,
            "data": [
                {
                    "domain": {
                        "uid": d.get('id', '').replace('protein_domain:', ''),
                        "name": d.get('name', ''),
                        "pfam_id": d.get('pfam_id', ''),
                        "description": d.get('description', '')
                    },
                    "start_position": start,
                    "end_position": end
                }
                for d, start, end in domain_data
            ],
            "count": len(domain_data)
        }
    except Exception as e:
        print(f"Error in get_protein_domains: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }
