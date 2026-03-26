"""
Test Neo4j Aura connection
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from apps.nexotype.neo4j.db import neo4j_driver, close_neo4j

async def test_connection():
    """Test Neo4j Aura connection"""
    try:
        print("Testing Neo4j Aura connection...")
        print(f"URI: neo4j+s://e16fbc0f.databases.neo4j.io")
        
        # Test basic connection
        async with neo4j_driver.session() as session:
            result = await session.run("RETURN 1 as test")
            record = await result.single()
            
            if record and record["test"] == 1:
                print("✅ Connection successful!")
            else:
                print("❌ Connection failed: Unexpected result")
                
        # Test database info
        async with neo4j_driver.session() as session:
            result = await session.run("CALL dbms.components()")
            record = await result.single()
            print(f"✅ Neo4j Version: {record['versions'][0]}")
            print(f"✅ Edition: {record['edition']}")
            
        # Count nodes (should be empty initially)
        async with neo4j_driver.session() as session:
            result = await session.run("MATCH (n) RETURN count(n) as count")
            record = await result.single()
            print(f"✅ Total nodes in database: {record['count']}")
            
        print("\n🎉 All tests passed! Neo4j Aura is connected and ready.")
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure you've waited 60 seconds after creating the instance")
        print("2. Check if the instance is active at https://console.neo4j.io")
        print("3. Verify the credentials are correct")
        
    finally:
        await close_neo4j()

if __name__ == "__main__":
    asyncio.run(test_connection())