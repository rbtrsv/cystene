from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_session
from ..db import get_neo4j
from ..sync_service import Neo4jSyncService
from datetime import datetime, timezone
import uuid
import logging

router = APIRouter(tags=["Neo4j CRUD Sync"], prefix="/crud")
logger = logging.getLogger(__name__)

# ==========================================
# GENE CRUD WITH NEO4J SYNC
# ==========================================

@router.post("/genes")
async def create_gene_with_sync(
    gene_data: dict,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Create gene in PostgreSQL and sync to Neo4j"""
    from ...models import Gene
    
    try:
        # 1. Create in PostgreSQL
        new_gene = Gene(
            uid=str(uuid.uuid4()),
            **gene_data
        )
        
        db.add(new_gene)
        await db.commit()
        await db.refresh(new_gene)
        
        # 2. Sync to Neo4j (handle failures gracefully)
        try:
            sync_service = Neo4jSyncService(db, neo4j)
            await sync_service.sync_entity(new_gene, "Gene")
        except Exception as neo4j_error:
            logger.error(f"Neo4j sync failed for gene {new_gene.uid}: {str(neo4j_error)}")
        
        return {
            "success": True,
            "data": {
                "id": new_gene.id,
                "uid": new_gene.uid,
                "name": new_gene.name,
                "synced_to_neo4j": True
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Gene creation failed: {str(e)}")
        raise HTTPException(500, f"Gene creation failed: {str(e)}")

@router.put("/genes/{gene_uid}")
async def update_gene_with_sync(
    gene_uid: str,
    gene_data: dict,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Update gene in PostgreSQL and sync to Neo4j"""
    from sqlalchemy import select
    from ...models import Gene
    
    try:
        # 1. Update in PostgreSQL
        result = await db.execute(select(Gene).where(Gene.uid == gene_uid))
        gene = result.scalar_one_or_none()
        
        if not gene:
            raise HTTPException(404, f"Gene with UID {gene_uid} not found")
        
        # Update fields
        for field, value in gene_data.items():
            if hasattr(gene, field):
                setattr(gene, field, value)
        
        await db.commit()
        await db.refresh(gene)
        
        # 2. Sync to Neo4j
        try:
            sync_service = Neo4jSyncService(db, neo4j)
            await sync_service.sync_entity(gene, "Gene")
        except Exception as neo4j_error:
            logger.error(f"Neo4j sync failed for gene {gene.uid}: {str(neo4j_error)}")
        
        return {
            "success": True,
            "data": {
                "id": gene.id,
                "uid": gene.uid,
                "name": gene.name,
                "synced_to_neo4j": True
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Gene update failed: {str(e)}")
        raise HTTPException(500, f"Gene update failed: {str(e)}")

@router.delete("/genes/{gene_uid}")
async def delete_gene_with_sync(
    gene_uid: str,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Delete gene from PostgreSQL and Neo4j"""
    from sqlalchemy import select
    from ...models import Gene
    
    try:
        # 1. Delete from PostgreSQL
        result = await db.execute(select(Gene).where(Gene.uid == gene_uid))
        gene = result.scalar_one_or_none()
        
        if not gene:
            raise HTTPException(404, f"Gene with UID {gene_uid} not found")
        
        gene_name = gene.name
        await db.delete(gene)
        await db.commit()
        
        # 2. Delete from Neo4j
        try:
            async with neo4j.session() as session:
                await session.run(
                    "MATCH (g:Gene {uid: $uid}) DETACH DELETE g",
                    uid=gene_uid
                )
        except Exception as neo4j_error:
            logger.error(f"Neo4j deletion failed for gene {gene_uid}: {str(neo4j_error)}")
        
        return {
            "success": True,
            "message": f"Gene {gene_name} deleted from both databases",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Gene deletion failed: {str(e)}")
        raise HTTPException(500, f"Gene deletion failed: {str(e)}")

# ==========================================
# PROTEIN CRUD WITH NEO4J SYNC
# ==========================================

@router.post("/proteins")
async def create_protein_with_sync(
    protein_data: dict,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Create protein in PostgreSQL and sync to Neo4j"""
    from ...models import Protein
    
    try:
        new_protein = Protein(
            uid=str(uuid.uuid4()),
            **protein_data
        )
        
        db.add(new_protein)
        await db.commit()
        await db.refresh(new_protein)
        
        try:
            sync_service = Neo4jSyncService(db, neo4j)
            await sync_service.sync_entity(new_protein, "Protein")
        except Exception as neo4j_error:
            logger.error(f"Neo4j sync failed for protein {new_protein.uid}: {str(neo4j_error)}")
        
        return {
            "success": True,
            "data": {
                "id": new_protein.id,
                "uid": new_protein.uid,
                "name": new_protein.name,
                "synced_to_neo4j": True
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Protein creation failed: {str(e)}")
        raise HTTPException(500, f"Protein creation failed: {str(e)}")

# ==========================================
# TREATMENT CRUD WITH NEO4J SYNC
# ==========================================

@router.post("/treatments")
async def create_treatment_with_sync(
    treatment_data: dict,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Create treatment in PostgreSQL and sync to Neo4j"""
    from ...models import Treatment
    
    try:
        new_treatment = Treatment(
            uid=str(uuid.uuid4()),
            **treatment_data
        )
        
        db.add(new_treatment)
        await db.commit()
        await db.refresh(new_treatment)
        
        try:
            sync_service = Neo4jSyncService(db, neo4j)
            await sync_service.sync_entity(new_treatment, "Treatment")
        except Exception as neo4j_error:
            logger.error(f"Neo4j sync failed for treatment {new_treatment.uid}: {str(neo4j_error)}")
        
        return {
            "success": True,
            "data": {
                "id": new_treatment.id,
                "uid": new_treatment.uid,
                "name": new_treatment.name,
                "synced_to_neo4j": True
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Treatment creation failed: {str(e)}")
        raise HTTPException(500, f"Treatment creation failed: {str(e)}")

# ==========================================
# RELATIONSHIP CRUD WITH NEO4J SYNC
# ==========================================

@router.post("/relationships/encodes")
async def create_encodes_relationship_with_sync(
    gene_uid: str,
    protein_uid: str,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Create Gene->Protein relationship in PostgreSQL and sync to Neo4j"""
    from sqlalchemy import select
    from ...models import Gene, Protein, Encodes
    
    try:
        # Get entities
        gene_result = await db.execute(select(Gene).where(Gene.uid == gene_uid))
        gene = gene_result.scalar_one_or_none()
        
        protein_result = await db.execute(select(Protein).where(Protein.uid == protein_uid))
        protein = protein_result.scalar_one_or_none()
        
        if not gene:
            raise HTTPException(404, f"Gene with UID {gene_uid} not found")
        if not protein:
            raise HTTPException(404, f"Protein with UID {protein_uid} not found")
        
        # Create relationship in PostgreSQL
        new_encodes = Encodes(
            gene_id=gene.id,
            protein_id=protein.id
        )
        
        db.add(new_encodes)
        await db.commit()
        await db.refresh(new_encodes)
        
        # Sync relationship to Neo4j
        try:
            sync_service = Neo4jSyncService(db, neo4j)
            await sync_service.sync_relationship(
                gene.uid, "Gene",
                protein.uid, "Protein",
                "ENCODES"
            )
        except Exception as neo4j_error:
            logger.error(f"Neo4j relationship sync failed: {str(neo4j_error)}")
        
        return {
            "success": True,
            "data": {
                "gene_uid": gene.uid,
                "protein_uid": protein.uid,
                "relationship": "ENCODES",
                "synced_to_neo4j": True
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Encodes relationship creation failed: {str(e)}")
        raise HTTPException(500, f"Encodes relationship creation failed: {str(e)}")

# ==========================================
# BULK OPERATIONS
# ==========================================

@router.post("/bulk/entities")
async def bulk_create_entities_with_sync(
    entities: list,
    entity_type: str,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Bulk create entities in PostgreSQL and sync to Neo4j"""
    from ...models import Gene, Protein, Treatment, Disease, Enhancement
    
    entity_models = {
        "gene": Gene,
        "protein": Protein,
        "treatment": Treatment,
        "disease": Disease,
        "enhancement": Enhancement
    }
    
    if entity_type.lower() not in entity_models:
        raise HTTPException(400, f"Unknown entity type: {entity_type}")
    
    model_class = entity_models[entity_type.lower()]
    
    try:
        created_entities = []
        
        # Create in PostgreSQL
        for entity_data in entities:
            new_entity = model_class(
                uid=str(uuid.uuid4()),
                **entity_data
            )
            db.add(new_entity)
            created_entities.append(new_entity)
        
        await db.commit()
        
        # Sync to Neo4j
        sync_service = Neo4jSyncService(db, neo4j)
        synced_count = 0
        
        for entity in created_entities:
            try:
                await sync_service.sync_entity(entity, entity_type.capitalize())
                synced_count += 1
            except Exception as neo4j_error:
                logger.error(f"Neo4j sync failed for {entity_type} {entity.uid}: {str(neo4j_error)}")
        
        return {
            "success": True,
            "message": f"Bulk created {len(created_entities)} {entity_type}s",
            "created_count": len(created_entities),
            "synced_count": synced_count,
            "entities": [{"uid": e.uid, "name": e.name} for e in created_entities],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk creation failed: {str(e)}")
        raise HTTPException(500, f"Bulk creation failed: {str(e)}")