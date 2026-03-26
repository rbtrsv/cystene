"""
Test SurrealDB connection.
Run with: python -m apps.nexotype.surrealdb.tests.connection_test
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from apps.nexotype.surrealdb.db import (
    get_surreal, close_surreal,
    SURREAL_URL, SURREAL_NAMESPACE, SURREAL_DATABASE
)


async def test_connection():
    """Test SurrealDB connection"""
    try:
        print("Testing SurrealDB connection...")
        print(f"URL: {SURREAL_URL}")
        print(f"Namespace: {SURREAL_NAMESPACE}")
        print(f"Database: {SURREAL_DATABASE}")

        db = await get_surreal()

        # Test basic query
        result = await db.query("RETURN 1")
        print(f"✅ Connection successful!")
        print(f"   Query result type: {type(result)}")
        print(f"   Query result: {result}")

        # Test database info
        result = await db.query("INFO FOR DB")
        print(f"✅ Database info retrieved")
        print(f"   Result type: {type(result)}")

        # Handle different result formats
        if isinstance(result, dict):
            tables = result.get("tables", result.get("tb", {}))
            if tables:
                print(f"✅ Tables in database: {len(tables)}")
                for table_name in list(tables.keys())[:10]:
                    print(f"     - {table_name}")
            else:
                print(f"   DB Info: {result}")
        elif isinstance(result, list) and len(result) > 0:
            db_info = result[0] if isinstance(result[0], dict) else result
            print(f"   DB Info: {db_info}")
        else:
            print(f"   DB Info: {result}")

        # Test namespace info
        result = await db.query("INFO FOR NS")
        print(f"✅ Namespace info retrieved")

        print("\n🎉 All tests passed! SurrealDB is connected and ready.")

    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\nTroubleshooting:")
        print("1. Check if SurrealDB container is running")
        print("2. Verify environment variables:")
        print(f"   SURREAL_URL={SURREAL_URL}")
        print(f"   SURREAL_NAMESPACE={SURREAL_NAMESPACE}")
        print(f"   SURREAL_DATABASE={SURREAL_DATABASE}")
        print("3. Check port 8001 is accessible")
        print("4. Verify credentials are correct")

    finally:
        await close_surreal()


if __name__ == "__main__":
    asyncio.run(test_connection())
