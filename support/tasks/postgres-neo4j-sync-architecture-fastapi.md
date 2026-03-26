# PostgreSQL + Neo4j Hybrid Architecture for FastAPI Nexotype

## Overview

This document describes the hybrid database architecture adapted for the FastAPI biotech longevity platform with `apps/nexotype` structure, using PostgreSQL as the source of truth and Neo4j for complex graph queries.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                         │
│                                                                 │
│  apps/nexotype/                                                │
│  ├── models.py          ┌──────────────┐ ┌──────────────┐      │
│  ├── schemas/           │   Pydantic   │ │  SQLAlchemy  │      │
│  ├── subrouters/        │   Schemas    │ │    Models    │      │
│  └── services/          └──────────────┘ └──────────────┘      │
│      └── neo4j_sync.py                                         │
└─────────────────┬──────────────────────────────┬───────────────┘
                  │                              │
                  ▼                              ▼
        ┌──────────────────┐          ┌──────────────────┐
        │   PostgreSQL     │          │     Neo4j        │
        │  (Source of      │  ──────> │  (Read-only      │
        │    Truth)        │   Sync   │   Graph Cache)   │
        └──────────────────┘          └──────────────────┘
```

## Database Responsibilities

### PostgreSQL (Primary Database)
- **Stores**: All biotech data permanently
- **Handles**: 
  - Gene, Protein, Peptide, Treatment, Disease entities
  - Transactional operations via your existing models
  - Data integrity with foreign keys and constraints
  - Audit trails (created_at timestamps)
  - User accounts, research data, clinical data
  - RelationshipEvidence from AI extraction
- **Query Types**: 
  - CRUD operations via your subrouters
  - Simple lookups and filtering
  - Reporting queries
  - Data validation and integrity checks

### Neo4j (Graph Analytics)
- **Stores**: Copy of biological relationships only
- **Handles**:
  - Complex graph traversals for drug discovery
  - Pathway analysis and network effects
  - Treatment discovery and biomarker patterns
  - Gene-disease-treatment relationship mapping
- **Query Types**:
  - "Find all treatments within N hops of gene X"
  - "Discover proteins in same pathways as target"
  - "Calculate shortest path from variant to treatment"
  - "Find similar therapeutic patterns"

## Implementation Steps

### Step 1: Extend Database Connections

```python
# core/db.py (extend your existing file)
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from neo4j import GraphDatabase
from typing import AsyncGenerator
import os

# PostgreSQL setup (your existing setup)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/biotech")
engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession)

# Neo4j setup (new addition)
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

neo4j_driver = GraphDatabase.driver(
    NEO4J_URI, 
    auth=(NEO4J_USER, NEO4J_PASSWORD)
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get PostgreSQL session (your existing function)"""
    async with async_session_maker() as session:
        yield session

def get_neo4j():
    """Get Neo4j driver"""
    return neo4j_driver

async def close_neo4j():
    """Close Neo4j connections"""
    await neo4j_driver.close()
```

### Step 2: Create Sync Service

```python
# apps/nexotype/services/neo4j_sync.py
from sqlalchemy.ext.asyncio import AsyncSession
from neo4j import AsyncDriver
from typing import Dict, Any, List
import logging
from ..models import (
    Gene, Protein, Peptide, Treatment, Disease, Enhancement,
    Pathway, Variant, Phenotype, Biomarker, BioActivity,
    # Relationship tables
    Encodes, Contains, HasActivity, Treats, Enhances,
    AssociatedWith, InteractsWith, Causes, Indicates,
    GeneParticipatesIn, ProteinParticipatesIn, IsPartOf
)
from sqlalchemy import select

logger = logging.getLogger(__name__)

class Neo4jSyncService:
    def __init__(self, pg_session: AsyncSession, neo4j_driver: AsyncDriver):
        self.pg = pg_session
        self.neo4j = neo4j_driver
    
    async def sync_entity(self, entity: Any, label: str) -> None:
        """Sync a single entity to Neo4j"""
        async with self.neo4j.session() as session:
            query = f"""
            MERGE (n:{label} {{uid: $uid}})
            SET n += $properties
            """
            properties = {
                'uid': entity.uid,
                'name': entity.name,
                'created_at': entity.created_at.isoformat()
            }
            
            # Add entity-specific properties for biotech models
            if isinstance(entity, Gene):
                properties.update({
                    'ensembl_id': entity.ensembl_id,
                    'chromosome': entity.chromosome,
                    'gene_type': entity.gene_type,
                    'start_position': entity.start_position,
                    'end_position': entity.end_position,
                    'species': entity.species
                })
            elif isinstance(entity, Protein):
                properties.update({
                    'uniprot_id': entity.uniprot_id,
                    'molecular_weight': entity.molecular_weight,
                    'isoelectric_point': entity.isoelectric_point,
                    'pdb_id': entity.pdb_id,
                    'binding_sites': entity.binding_sites
                })
            elif isinstance(entity, Treatment):
                properties.update({
                    'treatment_type': entity.treatment_type,
                    'availability': entity.availability,
                    'synthesis_difficulty': entity.synthesis_difficulty,
                    'typical_dosage': entity.typical_dosage
                })
            elif isinstance(entity, Disease):
                properties.update({
                    'omim_id': entity.omim_id,
                    'disease_class': entity.disease_class
                })
            elif isinstance(entity, Enhancement):
                properties.update({
                    'enhancement_type': entity.enhancement_type
                })
            elif isinstance(entity, Peptide):
                properties.update({
                    'sequence': entity.sequence,
                    'length': entity.length,
                    'molecular_weight': entity.molecular_weight,
                    'synthesis_difficulty': entity.synthesis_difficulty,
                    'stability_score': entity.stability_score
                })
            elif isinstance(entity, Pathway):
                properties.update({
                    'kegg_id': entity.kegg_id,
                    'pathway_type': entity.pathway_type
                })
            
            await session.run(query, properties=properties)
    
    async def sync_relationship(self, 
                               source_uid: str, 
                               source_label: str,
                               target_uid: str, 
                               target_label: str,
                               rel_type: str,
                               properties: Dict = None) -> None:
        """Sync a relationship to Neo4j"""
        async with self.neo4j.session() as session:
            query = f"""
            MATCH (a:{source_label} {{uid: $source_uid}})
            MATCH (b:{target_label} {{uid: $target_uid}})
            MERGE (a)-[r:{rel_type}]->(b)
            """
            if properties:
                query += " SET r += $properties"
                await session.run(query, 
                                 source_uid=source_uid,
                                 target_uid=target_uid,
                                 properties=properties)
            else:
                await session.run(query,
                                 source_uid=source_uid,
                                 target_uid=target_uid)
    
    async def full_sync(self) -> Dict[str, int]:
        """Perform complete sync from PostgreSQL to Neo4j"""
        counts = {}
        
        # Clear Neo4j
        async with self.neo4j.session() as session:
            await session.run("MATCH (n) DETACH DELETE n")
        
        # Sync entities using your existing models
        logger.info("Syncing entities...")
        
        # Genes
        result = await self.pg.execute(select(Gene))
        genes = result.scalars().all()
        for gene in genes:
            await self.sync_entity(gene, "Gene")
        counts['genes'] = len(genes)
        
        # Proteins
        result = await self.pg.execute(select(Protein))
        proteins = result.scalars().all()
        for protein in proteins:
            await self.sync_entity(protein, "Protein")
        counts['proteins'] = len(proteins)
        
        # Treatments
        result = await self.pg.execute(select(Treatment))
        treatments = result.scalars().all()
        for treatment in treatments:
            await self.sync_entity(treatment, "Treatment")
        counts['treatments'] = len(treatments)
        
        # Diseases
        result = await self.pg.execute(select(Disease))
        diseases = result.scalars().all()
        for disease in diseases:
            await self.sync_entity(disease, "Disease")
        counts['diseases'] = len(diseases)
        
        # Enhancements
        result = await self.pg.execute(select(Enhancement))
        enhancements = result.scalars().all()
        for enhancement in enhancements:
            await self.sync_entity(enhancement, "Enhancement")
        counts['enhancements'] = len(enhancements)
        
        # Peptides
        result = await self.pg.execute(select(Peptide))
        peptides = result.scalars().all()
        for peptide in peptides:
            await self.sync_entity(peptide, "Peptide")
        counts['peptides'] = len(peptides)
        
        # Pathways
        result = await self.pg.execute(select(Pathway))
        pathways = result.scalars().all()
        for pathway in pathways:
            await self.sync_entity(pathway, "Pathway")
        counts['pathways'] = len(pathways)
        
        # Sync relationships using your junction tables
        logger.info("Syncing relationships...")
        
        # Gene → Protein (Encodes)
        result = await self.pg.execute(
            select(Encodes).options(
                selectinload(Encodes.gene),
                selectinload(Encodes.protein)
            )
        )
        encodes = result.scalars().all()
        for encode in encodes:
            await self.sync_relationship(
                encode.gene.uid, "Gene",
                encode.protein.uid, "Protein",
                "ENCODES"
            )
        counts['encodes'] = len(encodes)
        
        # Treatment → Disease (Treats)
        result = await self.pg.execute(
            select(Treats).options(
                selectinload(Treats.treatment),
                selectinload(Treats.disease)
            )
        )
        treats = result.scalars().all()
        for treat in treats:
            await self.sync_relationship(
                treat.treatment.uid, "Treatment",
                treat.disease.uid, "Disease",
                "TREATS",
                {'mechanism_type': treat.mechanism_type,
                 'efficacy_score': treat.efficacy_score}
            )
        counts['treats'] = len(treats)
        
        # Treatment → Enhancement (Enhances)
        result = await self.pg.execute(
            select(Enhances).options(
                selectinload(Enhances.treatment),
                selectinload(Enhances.enhancement)
            )
        )
        enhances = result.scalars().all()
        for enhance in enhances:
            await self.sync_relationship(
                enhance.treatment.uid, "Treatment",
                enhance.enhancement.uid, "Enhancement",
                "ENHANCES",
                {'efficacy_score': enhance.efficacy_score,
                 'typical_timeline': enhance.typical_timeline}
            )
        counts['enhances'] = len(enhances)
        
        # Gene → Disease (AssociatedWith)
        result = await self.pg.execute(
            select(AssociatedWith).options(
                selectinload(AssociatedWith.gene),
                selectinload(AssociatedWith.disease)
            )
        )
        associations = result.scalars().all()
        for assoc in associations:
            await self.sync_relationship(
                assoc.gene.uid, "Gene",
                assoc.disease.uid, "Disease",
                "ASSOCIATED_WITH",
                {'association_type': assoc.association_type,
                 'odds_ratio': assoc.odds_ratio,
                 'p_value': assoc.p_value}
            )
        counts['associated_with'] = len(associations)
        
        # Protein ↔ Protein (InteractsWith)
        result = await self.pg.execute(
            select(InteractsWith).options(
                selectinload(InteractsWith.source_protein),
                selectinload(InteractsWith.target_protein)
            )
        )
        interactions = result.scalars().all()
        for interaction in interactions:
            await self.sync_relationship(
                interaction.source_protein.uid, "Protein",
                interaction.target_protein.uid, "Protein",
                "INTERACTS_WITH",
                {'interaction_strength': interaction.interaction_strength,
                 'interaction_type': interaction.interaction_type}
            )
        counts['interacts_with'] = len(interactions)
        
        logger.info(f"Sync complete: {counts}")
        return counts
    
    async def incremental_sync(self, since_datetime):
        """Sync only records created/updated since given datetime"""
        # Query only recent records
        result = await self.pg.execute(
            select(Gene).where(Gene.created_at >= since_datetime)
        )
        recent_genes = result.scalars().all()
        
        for gene in recent_genes:
            await self.sync_entity(gene, "Gene")
        
        # Continue for other entities...
        logger.info(f"Incremental sync completed for {len(recent_genes)} genes since {since_datetime}")

    # Graph query methods for your subrouters
    async def get_gene_network(self, gene_uid: str, depth: int = 2) -> List[Dict]:
        """Get gene interaction network from Neo4j"""
        async with self.neo4j.session() as session:
            query = """
            MATCH path = (g:Gene {uid: $uid})-[*1..$depth]-(connected)
            WHERE connected:Gene OR connected:Protein OR connected:Pathway OR connected:Disease
            RETURN DISTINCT connected.uid as uid, 
                   connected.name as name,
                   labels(connected)[0] as type,
                   length(path) as distance
            ORDER BY distance
            LIMIT 100
            """
            result = await session.run(query, uid=gene_uid, depth=depth)
            
            network = []
            async for record in result:
                network.append({
                    "uid": record["uid"],
                    "name": record["name"],
                    "type": record["type"],
                    "distance": record["distance"]
                })
            
            return network

    async def find_treatment_paths(self, gene_uid: str) -> List[Dict]:
        """Find all treatments connected to a gene through any path"""
        async with self.neo4j.session() as session:
            query = """
            MATCH path = (g:Gene {uid: $uid})-[*]-(t:Treatment)
            WITH t, min(length(path)) as minDistance
            RETURN DISTINCT t.uid as uid,
                   t.name as name,
                   t.treatment_type as type,
                   t.availability as availability,
                   minDistance as distance
            ORDER BY distance
            LIMIT 50
            """
            result = await session.run(query, uid=gene_uid)
            
            treatments = []
            async for record in result:
                treatments.append({
                    "uid": record["uid"],
                    "name": record["name"],
                    "type": record["type"],
                    "availability": record["availability"],
                    "distance": record["distance"]
                })
            
            return treatments

    async def find_similar_treatments(self, treatment_uid: str) -> List[Dict]:
        """Find treatments with similar biological targets"""
        async with self.neo4j.session() as session:
            query = """
            MATCH (t1:Treatment {uid: $uid})-[:TREATS|ENHANCES]->()<-[:TREATS|ENHANCES]-(t2:Treatment)
            WHERE t1 <> t2
            WITH t2, COUNT(*) as common_targets
            RETURN t2.uid as uid, t2.name as name, 
                   t2.treatment_type as type, common_targets
            ORDER BY common_targets DESC
            LIMIT 10
            """
            result = await session.run(query, uid=treatment_uid)
            
            similar = []
            async for record in result:
                similar.append({
                    "uid": record["uid"],
                    "name": record["name"],
                    "type": record["type"],
                    "common_targets": record["common_targets"]
                })
            
            return similar
```

### Step 3: Add Discovery Subrouters

```python
# apps/nexotype/subrouters/discovery_subrouter.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from core.db import get_session, get_neo4j
from ..services.neo4j_sync import Neo4jSyncService
from ..schemas.discovery_schemas import (
    NetworkResponse, TreatmentPathsResponse, SimilarTreatmentsResponse
)

router = APIRouter(tags=["Discovery"], prefix="/discovery")

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
        raise HTTPException(500, f"Similar treatments query failed: {str(e)}")
```

### Step 4: Extend Existing Subrouters

```python
# apps/nexotype/subrouters/gene_subrouter.py (extend your existing file)
# Add these imports to your existing gene subrouter
from ..services.neo4j_sync import Neo4jSyncService

# Add these endpoints to your existing router

@router.post("/", response_model=GeneDetailResponse)
async def create_gene(
    gene: GeneCreate,
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Create gene in PostgreSQL and sync to Neo4j"""
    try:
        # 1. Create in PostgreSQL (your existing logic)
        new_gene = Gene(
            uid=str(uuid.uuid4()),
            name=gene.name,
            ensembl_id=gene.ensembl_id,
            chromosome=gene.chromosome,
            start_position=gene.start_position,
            end_position=gene.end_position,
            species=gene.species,
            gene_type=gene.gene_type
        )
        
        db.add(new_gene)
        await db.commit()
        await db.refresh(new_gene)
        
        # 2. Sync to Neo4j (new)
        sync_service = Neo4jSyncService(db, neo4j)
        await sync_service.sync_entity(new_gene, "Gene")
        
        return GeneDetailResponse(
            success=True,
            data=GeneResponse(
                id=new_gene.id,
                uid=new_gene.uid,
                name=new_gene.name,
                ensembl_id=new_gene.ensembl_id,
                chromosome=new_gene.chromosome,
                start_position=new_gene.start_position,
                end_position=new_gene.end_position,
                species=new_gene.species,
                gene_type=new_gene.gene_type,
                created_at=new_gene.created_at
            )
        )
    except Exception as e:
        await db.rollback()
        return GeneDetailResponse(
            success=False,
            data=None,
            error=f"An error occurred: {str(e)}"
        )
```

### Step 5: Add Discovery Schemas

```python
# apps/nexotype/schemas/discovery_schemas.py
from pydantic import BaseModel
from typing import List, Optional

class NetworkNode(BaseModel):
    uid: str
    name: str
    type: str
    distance: int

class NetworkResponse(BaseModel):
    entity_uid: str
    entity_type: str
    network: List[NetworkNode]

class TreatmentPath(BaseModel):
    uid: str
    name: str
    type: str
    availability: Optional[str] = None
    distance: int

class TreatmentPathsResponse(BaseModel):
    gene_uid: str
    treatments: List[TreatmentPath]

class SimilarTreatment(BaseModel):
    uid: str
    name: str
    type: str
    common_targets: int

class SimilarTreatmentsResponse(BaseModel):
    treatment_uid: str
    similar_treatments: List[SimilarTreatment]
```

### Step 6: Background Sync Tasks

```python
# apps/nexotype/tasks/sync_tasks.py
from celery import Celery
from datetime import datetime, timedelta
from core.db import async_session_maker, neo4j_driver
from ..services.neo4j_sync import Neo4jSyncService
import logging
import asyncio

logger = logging.getLogger(__name__)

celery_app = Celery('nexotype_sync', broker='redis://localhost:6379')

@celery_app.task
def sync_recent_changes():
    """Sync changes from last 15 minutes"""
    async def _sync():
        async with async_session_maker() as db:
            sync_service = Neo4jSyncService(db, neo4j_driver)
            
            try:
                since = datetime.utcnow() - timedelta(minutes=15)
                await sync_service.incremental_sync(since)
                logger.info(f"Synced changes since {since}")
            except Exception as e:
                logger.error(f"Sync failed: {e}")
    
    asyncio.run(_sync())

@celery_app.task
def full_sync():
    """Perform complete resync"""
    async def _sync():
        async with async_session_maker() as db:
            sync_service = Neo4jSyncService(db, neo4j_driver)
            
            try:
                counts = await sync_service.full_sync()
                logger.info(f"Full sync complete: {counts}")
            except Exception as e:
                logger.error(f"Full sync failed: {e}")
    
    asyncio.run(_sync())

# Schedule periodic syncs
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'incremental-sync': {
        'task': 'apps.nexotype.tasks.sync_tasks.sync_recent_changes',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'full-sync': {
        'task': 'apps.nexotype.tasks.sync_tasks.full_sync',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
}
```

### Step 7: Update Main Router

```python
# apps/nexotype/router.py (extend your existing file)
from .subrouters.discovery_subrouter import router as discovery_router

# Add to your existing router includes
router.include_router(discovery_router)
```

## Deployment

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finpy
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/password
      NEO4J_PLUGINS: '["graph-data-science"]'
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"  # Browser
      - "7687:7687"  # Bolt
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  
  app:
    build: .
    depends_on:
      - postgres
      - neo4j
      - redis
    environment:
      DATABASE_URL: postgresql+asyncpg://user:password@postgres/finpy
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: password
      REDIS_URL: redis://redis:6379
    ports:
      - "8000:8000"
  
  celery:
    build: .
    command: celery -A apps.nexotype.tasks.sync_tasks worker --loglevel=info
    depends_on:
      - postgres
      - neo4j
      - redis
    environment:
      DATABASE_URL: postgresql+asyncpg://user:password@postgres/finpy
      NEO4J_URI: bolt://neo4j:7687
      REDIS_URL: redis://redis:6379
  
  celery-beat:
    build: .
    command: celery -A apps.nexotype.tasks.sync_tasks beat --loglevel=info
    depends_on:
      - redis
    environment:
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
  neo4j_data:
```

## Health Checks for Your Architecture

```python
# apps/nexotype/subrouters/health_subrouter.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_session, get_neo4j
from ..services.neo4j_sync import Neo4jSyncService
from ..models import Gene

router = APIRouter(tags=["Health"], prefix="/health")

@router.get("/")
async def health_check(
    db: AsyncSession = Depends(get_session),
    neo4j = Depends(get_neo4j)
):
    """Check both database connections"""
    health = {"status": "healthy", "databases": {}}
    
    # Check PostgreSQL
    try:
        await db.execute("SELECT 1")
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
    sync_service = Neo4jSyncService(db, neo4j)
    
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
        "in_sync": pg_genes == neo4j_genes
    }
```

## Integration with Your Existing Structure

### Your Current Structure (Preserved)
```
apps/nexotype/
├── models.py           # ✅ Keep unchanged - PostgreSQL source of truth
├── schemas/            # ✅ Keep all existing schemas
│   ├── gene_schemas.py
│   ├── protein_schemas.py
│   └── ...
├── subrouters/         # ✅ Extend existing subrouters
│   ├── gene_subrouter.py    # Add sync calls to create/update
│   ├── protein_subrouter.py # Add sync calls to create/update
│   └── ...
```

### New Additions
```
apps/nexotype/
├── services/           # 🆕 Add Neo4j services
│   └── neo4j_sync.py
├── schemas/            # 🆕 Add discovery schemas
│   └── discovery_schemas.py
├── subrouters/         # 🆕 Add discovery endpoints
│   ├── discovery_subrouter.py
│   └── health_subrouter.py
└── tasks/              # 🆕 Add background sync
    └── sync_tasks.py
```

## Best Practices for Your Architecture

1. **Keep your existing models untouched** - PostgreSQL remains source of truth
2. **Add sync calls to your existing create/update endpoints** - Don't break existing API
3. **Neo4j failures don't break core functionality** - Always handle gracefully
4. **Use discovery endpoints for graph queries** - Keep complex queries separate
5. **Monitor sync lag** - Alert if databases diverge significantly
6. **Background sync only** - Never block API responses for sync

## Benefits for Your Biotech Platform

- **Your existing FastAPI structure preserved** - No breaking changes
- **PostgreSQL handles critical biotech data integrity** - Foreign keys, constraints work
- **Neo4j powers advanced discovery features** - "Find treatments for genetic profile"
- **Easy to add/remove** - Neo4j is additive, not foundational
- **Scales with your research needs** - Add more graph queries as needed

This architecture keeps your reliable PostgreSQL foundation while adding powerful graph discovery capabilities specifically optimized for biotech research and drug discovery workflows.