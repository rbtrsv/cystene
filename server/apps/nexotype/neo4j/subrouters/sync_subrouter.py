from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_session
from ..db import get_neo4j
from ..sync_service import Neo4jSyncService
from datetime import datetime, timedelta, timezone
import logging

router = APIRouter(tags=["Neo4j Sync"], prefix="/sync")
logger = logging.getLogger(__name__)

@router.post("/full")
async def trigger_full_sync(
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Manually trigger a full sync from PostgreSQL to Neo4j"""
    sync_service = Neo4jSyncService(db, neo4j)
    
    try:
        logger.info("Starting manual full sync...")
        counts = await sync_service.full_sync()
        
        return {
            "success": True,
            "message": "Full sync completed successfully",
            "counts": counts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Full sync failed: {str(e)}")
        raise HTTPException(500, f"Full sync failed: {str(e)}")

@router.post("/incremental")
async def trigger_incremental_sync(
    minutes_back: int = 15,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Manually trigger incremental sync for recent changes"""
    sync_service = Neo4jSyncService(db, neo4j)
    
    try:
        since_datetime = datetime.now(timezone.utc) - timedelta(minutes=minutes_back)
        logger.info(f"Starting incremental sync since {since_datetime}")
        
        counts = await sync_service.incremental_sync(since_datetime)
        
        return {
            "success": True,
            "message": f"Incremental sync completed for last {minutes_back} minutes",
            "counts": counts,
            "since": since_datetime.isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Incremental sync failed: {str(e)}")
        raise HTTPException(500, f"Incremental sync failed: {str(e)}")

@router.post("/entity/{entity_type}/{entity_uid}")
async def sync_single_entity(
    entity_type: str,
    entity_uid: str,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Sync a single entity by UID"""
    from sqlalchemy import select
    from ...models import Gene, Protein, Treatment, Disease, Enhancement, Peptide, Pathway, Variant, Phenotype, Biomarker, BioActivity
    
    # Map entity types to models
    entity_models = {
        "gene": Gene,
        "protein": Protein,
        "treatment": Treatment,
        "disease": Disease,
        "enhancement": Enhancement,
        "peptide": Peptide,
        "pathway": Pathway,
        "variant": Variant,
        "phenotype": Phenotype,
        "biomarker": Biomarker,
        "bioactivity": BioActivity
    }
    
    entity_type_lower = entity_type.lower()
    if entity_type_lower not in entity_models:
        raise HTTPException(400, f"Unknown entity type: {entity_type}")
    
    model_class = entity_models[entity_type_lower]
    sync_service = Neo4jSyncService(db, neo4j)
    
    try:
        # Get entity from PostgreSQL
        result = await db.execute(
            select(model_class).where(model_class.uid == entity_uid)
        )
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise HTTPException(404, f"{entity_type} with UID {entity_uid} not found")
        
        # Sync to Neo4j
        await sync_service.sync_entity(entity, entity_type.capitalize())
        
        return {
            "success": True,
            "message": f"Entity {entity_type}:{entity_uid} synced successfully",
            "entity": {
                "uid": entity.uid,
                "name": entity.name,
                "type": entity_type
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Entity sync failed: {str(e)}")
        raise HTTPException(500, f"Entity sync failed: {str(e)}")

@router.delete("/clear")
async def clear_neo4j(
    confirm: bool = False,
    neo4j = Depends(get_neo4j)
):
    """Clear all data from Neo4j (requires confirmation)"""
    if not confirm:
        raise HTTPException(400, "Must set confirm=true to clear Neo4j database")
    
    try:
        async with neo4j.session() as session:
            await session.run("MATCH (n) DETACH DELETE n")
        
        logger.warning("Neo4j database cleared manually")
        return {
            "success": True,
            "message": "Neo4j database cleared successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Neo4j clear failed: {str(e)}")
        raise HTTPException(500, f"Neo4j clear failed: {str(e)}")

@router.get("/status")
async def get_sync_status(
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Get detailed sync status between databases"""
    from sqlalchemy import select, func
    from ...models import Gene, Protein, Treatment, Disease, Enhancement
    
    try:
        status = {"postgresql": {}, "neo4j": {}, "sync_analysis": {}}
        
        # PostgreSQL counts
        pg_counts = {}
        entities = [
            ("genes", Gene),
            ("proteins", Protein), 
            ("treatments", Treatment),
            ("diseases", Disease),
            ("enhancements", Enhancement)
        ]
        
        for name, model in entities:
            result = await db.execute(select(func.count(model.id)))
            pg_counts[name] = result.scalar()
        
        status["postgresql"] = pg_counts
        
        # Neo4j counts
        neo4j_counts = {}
        async with neo4j.session() as session:
            for name, model in entities:
                label = model.__name__
                result = await session.run(f"MATCH (n:{label}) RETURN count(n) as count")
                record = await result.single()
                neo4j_counts[name] = record["count"] if record else 0
        
        status["neo4j"] = neo4j_counts
        
        # Analysis
        total_pg = sum(pg_counts.values())
        total_neo4j = sum(neo4j_counts.values())
        
        status["sync_analysis"] = {
            "total_postgresql": total_pg,
            "total_neo4j": total_neo4j,
            "total_lag": abs(total_pg - total_neo4j),
            "sync_percentage": round((total_neo4j / total_pg * 100) if total_pg > 0 else 0, 2),
            "is_fully_synced": total_pg == total_neo4j,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Status check failed: {str(e)}")
        raise HTTPException(500, f"Status check failed: {str(e)}")