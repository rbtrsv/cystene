# Neo4j Hybrid Architecture Explanation

## The Universal Pattern (Polyglot Persistence)

**PostgreSQL stores everything permanently as your source of truth. Specialized databases act as read-only caches for specific query types.**

This is **Polyglot Persistence** - using the right database for each job instead of forcing one to handle everything.

This works for:
- **Graph queries** → Sync to Neo4j
- **Time series** → Sync to TimescaleDB or InfluxDB  
- **Vector search** → Sync to Pinecone or Weaviate
- **Full-text search** → Sync to Elasticsearch
- **Analytics** → Sync to ClickHouse

## The Simple Process

1. **Write everything to PostgreSQL first** (it's reliable, ACID-compliant, handles transactions)
2. **Background sync copies relevant data** to specialized database
3. **Complex queries go to specialized DB**, simple queries stay in PostgreSQL
4. **If specialized DB fails, app still works** with PostgreSQL

## Database Responsibilities

### PostgreSQL (Primary Database)
- **Stores**: All biotech data permanently
- **Handles**: CRUD operations, data integrity, foreign keys, transactions
- **Query Types**: Simple lookups, filtering, reporting, validation

### Neo4j (Graph Analytics)  
- **Stores**: Copy of biological relationships only
- **Handles**: Complex graph traversals for drug discovery
- **Query Types**: 
  - "Find all treatments within N hops of gene X"
  - "Discover proteins in same pathways as target"
  - "Calculate shortest path from variant to treatment"

## What We Built

```
apps/nexotype/neo4j/
├── db.py                           # Neo4j connection
├── sync_service.py                 # Sync PostgreSQL → Neo4j
├── schemas/discovery_schemas.py    # Graph query responses
└── subrouters/
    ├── discovery_subrouter.py      # Graph discovery endpoints
    ├── health_subrouter.py         # Monitor both databases
    ├── sync_subrouter.py           # Manual sync operations
    ├── indexes_subrouter.py        # Neo4j performance indexes
    └── crud_sync_subrouter.py      # CRUD with automatic sync
```

## Why This Works

**PostgreSQL guarantees your data is safe.** Specialized databases are just performance optimizations for specific query patterns. You can add or remove them without breaking your core application.

Think of PostgreSQL as your **filing cabinet** with all documents, and Neo4j as a **specialized index** for graph searches. Neo4j handles complex traversals that are painful in SQL (multi-hop paths, k-hop neighborhoods, path scoring). Companies like Netflix and Amazon use this same pattern.

## Transferable to Any Project

This architecture pattern means you can:
- **Start simple** with just PostgreSQL
- **Add specialized databases as needed** when you hit performance limits  
- **Never lose data** because PostgreSQL is always the source of truth
- **Remove specialized DBs** without breaking anything

The same pattern works for any FastAPI project that needs specialized query performance while maintaining data reliability.