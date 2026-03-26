from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.db import get_session
from ..db import get_neo4j
from ...models import Gene
import logging

router = APIRouter(tags=["Health"], prefix="/health")
logger = logging.getLogger(__name__)

@router.get("/")
async def health_check(
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Check both database connections"""
    health = {"status": "healthy", "databases": {}}
    
    # Check PostgreSQL
    try:
        await db.execute(select(func.count(1)))
        health["databases"]["postgresql"] = "connected"
    except Exception as e:
        health["databases"]["postgresql"] = f"error: {str(e)}"
        health["status"] = "degraded"
    
    # Check Neo4j
    try:
        async with neo4j.session() as session:
            await session.run("RETURN 1")
        health["databases"]["neo4j"] = "connected"
    except Exception as e:
        health["databases"]["neo4j"] = f"error: {str(e)}"
        health["status"] = "degraded"
    
    return health

@router.get("/sync-status")
async def sync_status(
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Check sync status between databases"""
    # Count entities in PostgreSQL
    result = await db.execute(select(func.count(Gene.id)))
    pg_genes = result.scalar()
    
    # Count entities in Neo4j
    async with neo4j.session() as session:
        result = await session.run("MATCH (g:Gene) RETURN count(g) as count")
        record = await result.single()
        neo4j_genes = record["count"]
    
    return {
        "postgresql": {"genes": pg_genes},
        "neo4j": {"genes": neo4j_genes},
        "in_sync": pg_genes == neo4j_genes,
        "sync_lag": abs(pg_genes - neo4j_genes)
    }