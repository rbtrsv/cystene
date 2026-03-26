from neo4j import AsyncGraphDatabase

# Neo4j Aura settings
NEO4J_URI = "neo4j+s://e16fbc0f.databases.neo4j.io"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "KS_2wZj6M9v1Fzd4HTBTvwawesBCYyCI9YSoFZxEPYI"
NEO4J_DATABASE = "neo4j"

# Create async Neo4j driver for Aura
neo4j_driver = AsyncGraphDatabase.driver(
    NEO4J_URI, 
    auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
    database=NEO4J_DATABASE
)

def get_neo4j():
    """Get Neo4j async driver"""
    return neo4j_driver

async def close_neo4j():
    """Close Neo4j connections"""
    await neo4j_driver.close()