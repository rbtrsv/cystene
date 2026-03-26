from ninja import Router, Schema
from ninja.errors import HttpError
from django.http import HttpRequest
from typing import List, Optional, Dict, Any

from ..models import Protein, Gene, Peptide, Pathway, ProteinDomain
from ..schemas.protein_schemas import (
    ProteinCreate, ProteinUpdate, ProteinDetail, 
    ProteinSearchParams, ProteinResponse, ProteinListResponse
)
from ..utils.neo4j_utils import (
    get_neo4j_connection, execute_cypher, paginate_results
)

router = Router(tags=["Neo4j Proteins"])

@router.get("/", response=ProteinListResponse)
def list_proteins(
    request: HttpRequest, 
    limit: int = 100, 
    offset: int = 0
):
    """
    List proteins with optional pagination
    
    This endpoint:
    1. Retrieves proteins from the Neo4j database
    2. Returns a paginated list of proteins
    """
    try:
        proteins = Protein.nodes.all()[offset:offset+limit]
        count = len(Protein.nodes.all())
        
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
                    "created_at": p.created_at
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
        protein = Protein.nodes.get(uid=protein_id)
        
        return {
            "success": True,
            "data": {
                "uid": str(protein.uid),
                "uniprot_id": protein.uniprot_id,
                "name": protein.name,
                "sequence": protein.sequence,
                "molecular_weight": protein.molecular_weight,
                "isoelectric_point": protein.isoelectric_point,
                "created_at": protein.created_at
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
        # Check if protein already exists
        existing = Protein.nodes.filter(uniprot_id=data.uniprot_id)
        if existing:
            return {
                "success": False,
                "data": None,
                "error": f"Protein with UniProt ID {data.uniprot_id} already exists"
            }
        
        # Create protein
        protein = Protein(
            uniprot_id=data.uniprot_id,
            name=data.name,
            sequence=data.sequence,
            molecular_weight=data.molecular_weight,
            isoelectric_point=data.isoelectric_point
        ).save()
        
        # Connect to genes if provided
        if data.gene_ids:
            for gene_id in data.gene_ids:
                try:
                    gene = Gene.nodes.get(uid=gene_id)
                    gene.proteins.connect(protein)
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
                "created_at": protein.created_at
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
        protein = Protein.nodes.get(uid=protein_id)
        
        if data.uniprot_id:
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
                "created_at": protein.created_at
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

@router.delete("/{protein_id}", response=Dict[str, Any])
def delete_protein(request: HttpRequest, protein_id: str):
    """
    Delete a protein
    
    This endpoint:
    1. Deletes a protein from the database
    2. Returns a success message
    """
    try:
        protein = Protein.nodes.get(uid=protein_id)
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
        query_parts = []
        params = {}
        
        if search_params.name:
            query_parts.append("p.name =~ $name")
            params["name"] = f".*{search_params.name}.*"
        
        if search_params.uniprot_id:
            query_parts.append("p.uniprot_id =~ $uniprot_id")
            params["uniprot_id"] = f".*{search_params.uniprot_id}.*"
        
        if search_params.min_molecular_weight:
            query_parts.append("p.molecular_weight >= $min_mw")
            params["min_mw"] = search_params.min_molecular_weight
        
        if search_params.max_molecular_weight:
            query_parts.append("p.molecular_weight <= $max_mw")
            params["max_mw"] = search_params.max_molecular_weight
        
        if search_params.from_gene:
            query_parts.append("(p)<-[:ENCODES]-(:Gene {ensembl_id: $gene_id})")
            params["gene_id"] = search_params.from_gene
        
        if search_params.has_domain:
            query_parts.append("(p)-[:HAS_DOMAIN]->(:ProteinDomain {name: $domain_name})")
            params["domain_name"] = search_params.has_domain
        
        if search_params.in_pathway:
            query_parts.append("(p)-[:PARTICIPATES_IN]->(:Pathway {name: $pathway_name})")
            params["pathway_name"] = search_params.in_pathway
        
        if not query_parts:
            return {
                "success": False,
                "data": None,
                "count": 0,
                "error": "No search criteria provided"
            }
        
        query = "MATCH (p:Protein) WHERE " + " AND ".join(query_parts) + " RETURN p"
        
        results, _ = execute_cypher(query, params)
        
        proteins = [Protein.inflate(result[0]) for result in results]
        
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
                    "created_at": p.created_at
                }
                for p in proteins
            ],
            "count": len(proteins)
        }
    except Exception as e:
        print(f"Error in search_proteins: {str(e)}")
        return {
            "success": False,
            "data": None,
            "count": 0,
            "error": f"An error occurred: {str(e)}"
        }

@router.get("/{protein_id}/genes", response=Dict[str, Any])
def get_protein_genes(request: HttpRequest, protein_id: str):
    """
    Get genes that encode this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the genes that encode this protein
    """
    try:
        protein = Protein.nodes.get(uid=protein_id)
        genes = protein.get_encoding_genes()
        
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

@router.get("/{protein_id}/peptides", response=Dict[str, Any])
def get_protein_peptides(request: HttpRequest, protein_id: str):
    """
    Get peptides that are part of this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the peptides that are part of this protein
    """
    try:
        protein = Protein.nodes.get(uid=protein_id)
        peptides = protein.get_peptides()
        
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
            "count": len(peptides)
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

@router.post("/{protein_id}/add_peptide", response=Dict[str, Any])
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
        protein = Protein.nodes.get(uid=protein_id)
        
        # Check if peptide already exists
        existing_peptides = Peptide.nodes.filter(sequence=peptide_sequence)
        if existing_peptides:
            peptide = existing_peptides[0]
        else:
            # Calculate peptide properties
            from ..utils.genomics_utils import calculate_peptide_properties
            properties = calculate_peptide_properties(peptide_sequence)
            
            # Create peptide
            peptide = Peptide(
                sequence=peptide_sequence,
                length=properties['length'],
                molecular_weight=properties['molecular_weight'],
                isoelectric_point=properties.get('isoelectric_point')
            ).save()
        
        # Create relationship
        rel = protein.peptides.connect(peptide)
        if start_position is not None:
            rel.start_position = start_position
            rel.save()
        
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

@router.post("/{protein_id}/pathway/{pathway_id}", response=Dict[str, Any])
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
        protein = Protein.nodes.get(uid=protein_id)
        pathway = Pathway.nodes.get(uid=pathway_id)
        
        # Create relationship
        protein.pathways.connect(pathway)
        
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

@router.post("/{protein_id}/domain/{domain_id}", response=Dict[str, Any])
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
        protein = Protein.nodes.get(uid=protein_id)
        domain = ProteinDomain.nodes.get(uid=domain_id)
        
        # Create relationship
        rel = protein.domains.connect(domain)
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

@router.post("/{protein_id}/interact/{other_protein_id}", response=Dict[str, Any])
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
        protein = Protein.nodes.get(uid=protein_id)
        other_protein = Protein.nodes.get(uid=other_protein_id)
        
        # Create relationship
        rel = protein.interactions.connect(other_protein)
        if interaction_strength is not None:
            rel.strength = interaction_strength
        if interaction_type is not None:
            rel.interaction_type = interaction_type
        rel.save()
        
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

@router.get("/{protein_id}/interactions", response=Dict[str, Any])
def get_protein_interactions(request: HttpRequest, protein_id: str):
    """
    Get proteins that interact with this protein
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns the proteins that interact with it
    """
    try:
        protein = Protein.nodes.get(uid=protein_id)
        interactions = protein.get_interacting_proteins()
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "uniprot_id": p.uniprot_id,
                    "name": p.name
                }
                for p in interactions
            ],
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

@router.get("/{protein_id}/interaction_network", response=Dict[str, Any])
def get_protein_interaction_network(
    request: HttpRequest, 
    protein_id: str,
    depth: int = 2
):
    """
    Get the protein-protein interaction network
    
    This endpoint:
    1. Retrieves a protein by ID
    2. Returns its interaction network up to a certain depth
    """
    try:
        protein = Protein.nodes.get(uid=protein_id)
        network = protein.get_interaction_network(depth=depth)
        
        return {
            "success": True,
            "data": [
                {
                    "uid": str(p.uid),
                    "uniprot_id": p.uniprot_id,
                    "name": p.name
                }
                for p in network
            ],
            "count": len(network)
        }
    except Protein.DoesNotExist:
        return {
            "success": False,
            "error": f"Protein with ID {protein_id} not found"
        }
    except Exception as e:
        print(f"Error in get_protein_interaction_network: {str(e)}")
        return {
            "success": False,
            "error": f"An error occurred: {str(e)}"
        }