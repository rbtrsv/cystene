from fastapi import APIRouter, Depends, HTTPException
from ..db import get_neo4j
from datetime import datetime, timezone
import logging

router = APIRouter(tags=["Neo4j Indexes"], prefix="/indexes")
logger = logging.getLogger(__name__)

@router.post("/create-all")
async def create_all_indexes(
    neo4j = Depends(get_neo4j)
):
    """Create all performance indexes on Neo4j"""
    
    indexes = [
        "CREATE INDEX gene_uid IF NOT EXISTS FOR (g:Gene) ON (g.uid)",
        "CREATE INDEX protein_uid IF NOT EXISTS FOR (p:Protein) ON (p.uid)",
        "CREATE INDEX treatment_uid IF NOT EXISTS FOR (t:Treatment) ON (t.uid)",
        "CREATE INDEX disease_uid IF NOT EXISTS FOR (d:Disease) ON (d.uid)",
        "CREATE INDEX enhancement_uid IF NOT EXISTS FOR (e:Enhancement) ON (e.uid)",
        "CREATE INDEX peptide_uid IF NOT EXISTS FOR (p:Peptide) ON (p.uid)",
        "CREATE INDEX pathway_uid IF NOT EXISTS FOR (p:Pathway) ON (p.uid)",
        "CREATE INDEX variant_uid IF NOT EXISTS FOR (v:Variant) ON (v.uid)",
        "CREATE INDEX phenotype_uid IF NOT EXISTS FOR (p:Phenotype) ON (p.uid)",
        "CREATE INDEX biomarker_uid IF NOT EXISTS FOR (b:Biomarker) ON (b.uid)",
        "CREATE INDEX bioactivity_uid IF NOT EXISTS FOR (b:BioActivity) ON (b.uid)",
        
        # Additional useful indexes
        "CREATE INDEX gene_name IF NOT EXISTS FOR (g:Gene) ON (g.name)",
        "CREATE INDEX protein_uniprot IF NOT EXISTS FOR (p:Protein) ON (p.uniprot_id)",
        "CREATE INDEX treatment_type IF NOT EXISTS FOR (t:Treatment) ON (t.treatment_type)",
        "CREATE INDEX disease_class IF NOT EXISTS FOR (d:Disease) ON (d.disease_class)",
        "CREATE INDEX variant_rs IF NOT EXISTS FOR (v:Variant) ON (v.rs_id)"
    ]
    
    try:
        created_indexes = []
        failed_indexes = []
        
        async with neo4j.session() as session:
            for index_query in indexes:
                try:
                    await session.run(index_query)
                    created_indexes.append(index_query)
                    logger.info(f"Created index: {index_query}")
                except Exception as e:
                    failed_indexes.append({"query": index_query, "error": str(e)})
                    logger.error(f"Failed to create index: {index_query} - {str(e)}")
        
        return {
            "success": True,
            "message": f"Created {len(created_indexes)} indexes",
            "created_count": len(created_indexes),
            "failed_count": len(failed_indexes),
            "created_indexes": created_indexes,
            "failed_indexes": failed_indexes,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Index creation failed: {str(e)}")
        raise HTTPException(500, f"Index creation failed: {str(e)}")

@router.get("/list")
async def list_indexes(
    neo4j = Depends(get_neo4j)
):
    """List all existing indexes in Neo4j"""
    try:
        async with neo4j.session() as session:
            result = await session.run("SHOW INDEXES")
            
            indexes = []
            async for record in result:
                indexes.append({
                    "name": record.get("name"),
                    "state": record.get("state"),
                    "type": record.get("type"),
                    "labels": record.get("labelsOrTypes"),
                    "properties": record.get("properties")
                })
        
        return {
            "success": True,
            "indexes": indexes,
            "count": len(indexes),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"List indexes failed: {str(e)}")
        raise HTTPException(500, f"List indexes failed: {str(e)}")

@router.delete("/drop-all")
async def drop_all_indexes(
    confirm: bool = False,
    neo4j = Depends(get_neo4j)
):
    """Drop all indexes from Neo4j (requires confirmation)"""
    if not confirm:
        raise HTTPException(400, "Must set confirm=true to drop all indexes")
    
    try:
        async with neo4j.session() as session:
            # Get all index names first
            result = await session.run("SHOW INDEXES")
            index_names = []
            async for record in result:
                if record.get("name"):
                    index_names.append(record["name"])
            
            # Drop each index
            dropped_indexes = []
            failed_drops = []
            
            for index_name in index_names:
                try:
                    await session.run(f"DROP INDEX {index_name}")
                    dropped_indexes.append(index_name)
                    logger.info(f"Dropped index: {index_name}")
                except Exception as e:
                    failed_drops.append({"name": index_name, "error": str(e)})
                    logger.error(f"Failed to drop index: {index_name} - {str(e)}")
        
        logger.warning("All Neo4j indexes dropped manually")
        return {
            "success": True,
            "message": f"Dropped {len(dropped_indexes)} indexes",
            "dropped_count": len(dropped_indexes),
            "failed_count": len(failed_drops),
            "dropped_indexes": dropped_indexes,
            "failed_drops": failed_drops,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Drop indexes failed: {str(e)}")
        raise HTTPException(500, f"Drop indexes failed: {str(e)}")

@router.post("/optimize")
async def optimize_indexes(
    neo4j = Depends(get_neo4j)
):
    """Run index optimization and statistics update"""
    try:
        async with neo4j.session() as session:
            # Update statistics
            await session.run("CALL db.stats.collect()")
            
            # Get index statistics
            result = await session.run("""
                SHOW INDEXES
                YIELD name, state, type, labelsOrTypes, properties
                RETURN name, state, type, labelsOrTypes, properties
            """)
            
            index_stats = []
            async for record in result:
                index_stats.append({
                    "name": record["name"],
                    "state": record["state"],
                    "type": record["type"],
                    "labels": record["labelsOrTypes"],
                    "properties": record["properties"]
                })
        
        return {
            "success": True,
            "message": "Index optimization completed",
            "statistics_updated": True,
            "index_count": len(index_stats),
            "index_stats": index_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Index optimization failed: {str(e)}")
        raise HTTPException(500, f"Index optimization failed: {str(e)}")