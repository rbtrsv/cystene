from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from core.db import get_session
from ..db import get_neo4j
from ..sync_service import Neo4jSyncService
from ..schemas.discovery_schemas import (
    NetworkResponse, TreatmentPathsResponse, SimilarTreatmentsResponse
)
import logging

router = APIRouter(tags=["Discovery"], prefix="/discovery")
logger = logging.getLogger(__name__)

@router.get("/genes/{gene_uid}/network", response_model=NetworkResponse)
async def get_gene_network(
    gene_uid: str,
    depth: int = 2,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Get gene interaction network from Neo4j"""
    sync_service = Neo4jSyncService(db, neo4j)
    
    try:
        network = await sync_service.get_gene_network(gene_uid, depth)
        
        if not network:
            raise HTTPException(404, "Gene not found or no network available")
        
        return NetworkResponse(
            entity_uid=gene_uid,
            entity_type="Gene",
            network=network
        )
    except Exception as e:
        logger.error(f"Network query failed: {str(e)}")
        raise HTTPException(500, f"Network query failed: {str(e)}")

@router.get("/genes/{gene_uid}/treatment-paths", response_model=TreatmentPathsResponse)
async def find_treatment_paths(
    gene_uid: str,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Find all treatments connected to a gene through any path"""
    sync_service = Neo4jSyncService(db, neo4j)
    
    try:
        treatments = await sync_service.find_treatment_paths(gene_uid)
        
        return TreatmentPathsResponse(
            gene_uid=gene_uid,
            treatments=treatments
        )
    except Exception as e:
        logger.error(f"Treatment path query failed: {str(e)}")
        raise HTTPException(500, f"Treatment path query failed: {str(e)}")

@router.get("/treatments/{treatment_uid}/similar", response_model=SimilarTreatmentsResponse)
async def find_similar_treatments(
    treatment_uid: str,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Find treatments with similar biological targets"""
    sync_service = Neo4jSyncService(db, neo4j)
    
    try:
        similar = await sync_service.find_similar_treatments(treatment_uid)
        
        return SimilarTreatmentsResponse(
            treatment_uid=treatment_uid,
            similar_treatments=similar
        )
    except Exception as e:
        logger.error(f"Similar treatments query failed: {str(e)}")
        raise HTTPException(500, f"Similar treatments query failed: {str(e)}")