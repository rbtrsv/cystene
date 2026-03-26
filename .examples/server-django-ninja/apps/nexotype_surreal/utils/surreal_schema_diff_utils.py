import asyncio
from .surreal_connection_utils import get_surreal_connection
from .surreal_update_schema_utils import schema_definitions


async def read_db_schema():
    """Read the complete current schema from SurrealDB database"""
    db = await get_surreal_connection()
    print("Reading current schema from SurrealDB...")
    
    try:
        result = await db.query("INFO FOR DB;")
        schema_info = result[0] if isinstance(result, list) else result
        
        current_schema = {}
        tables = schema_info.get('tb', {}) if schema_info else {}
        
        for table_name, table_info in tables.items():
            print(f"Processing table: {table_name}")
            
            # Get detailed table information
            table_detail_result = await db.query(f"INFO FOR TABLE {table_name};")
            table_details = table_detail_result[0] if table_detail_result else {}
            
            current_schema[table_name] = {
                'fields': table_details.get('fd', {}),
                'indexes': table_details.get('ix', {}),
            }
        
        print(f"Successfully read schema for {len(current_schema)} tables")
        return current_schema
        
    except Exception as e:
        print(f"Error reading schema from database: {str(e)}")
        raise


def create_schema_from_models():
    """Create schema dictionary from models defined in surreal_update_schema_utils.py"""
    print("Creating schema from model definitions...")
    
    desired_schema = {}
    
    # Parse the schema_definitions to extract table/field info
    for definition in schema_definitions:
        lines = [line.strip() for line in definition.strip().split('\n') if line.strip()]
        
        current_table = None
        
        for line in lines:
            if line.startswith('DEFINE TABLE'):
                # Extract table name: "DEFINE TABLE pathway SCHEMAFULL;"
                parts = line.split()
                if len(parts) >= 3:
                    current_table = parts[2]
                    desired_schema[current_table] = {'fields': {}, 'indexes': {}}
            
            elif line.startswith('DEFINE FIELD') and current_table:
                # Extract field: "DEFINE FIELD name ON pathway TYPE string;"
                parts = line.split()
                if len(parts) >= 6 and parts[3] == 'ON':
                    field_name = parts[2]
                    field_type = parts[5].rstrip(';')
                    desired_schema[current_table]['fields'][field_name] = field_type
            
            elif line.startswith('DEFINE INDEX') and current_table:
                # Extract index info
                parts = line.split()
                if len(parts) >= 3:
                    index_name = parts[2]
                    desired_schema[current_table]['indexes'][index_name] = line
    
    print(f"Created schema for {len(desired_schema)} tables from models")
    return desired_schema


async def surreal_clean_schema():
    """Create REMOVE statements for schema differences between DB and models"""
    
    current_schema = await read_db_schema()
    desired_schema = create_schema_from_models()
    
    remove_statements = []
    
    print("Generating REMOVE statements for schema cleanup...")
    
    # Tables to remove (in DB but not in models)
    for table_name in current_schema:
        if table_name not in desired_schema:
            remove_statements.append(f"REMOVE TABLE {table_name};")
            print(f"  - Remove table: {table_name}")
    
    # Fields to remove (in DB but not in models)
    for table_name, current_table in current_schema.items():
        if table_name in desired_schema:
            desired_table = desired_schema[table_name]
            for field_name in current_table['fields']:
                if field_name not in desired_table['fields']:
                    remove_statements.append(f"REMOVE FIELD {field_name} ON {table_name};")
                    print(f"  - Remove field: {table_name}.{field_name}")
    
    # Indexes to remove (in DB but not in models)
    for table_name, current_table in current_schema.items():
        if table_name in desired_schema:
            desired_table = desired_schema[table_name]
            for index_name in current_table['indexes']:
                if index_name not in desired_table['indexes']:
                    remove_statements.append(f"REMOVE INDEX {index_name} ON {table_name};")
                    print(f"  - Remove index: {table_name}.{index_name}")
    
    print(f"Generated {len(remove_statements)} REMOVE statements")
    
    # Create schema_definitions format with REMOVE statements
    schema_cleanup_definitions = [
        f'''
        # Cleanup - Remove orphaned schema elements
        """
        {chr(10).join(remove_statements)}
        """,
        '''
    ]
    
    return {
        'statements': remove_statements,
        'definitions': schema_cleanup_definitions
    }


if __name__ == "__main__":
    async def test():
        print("=== Reading DB Schema ===")
        db_schema = await read_db_schema()
        
        print("\n=== Creating Schema from Models ===")
        model_schema = create_schema_from_models()
        
        print("\n=== Generating Clean Schema ===")
        cleanup = await surreal_clean_schema()
        
        print("\nREMOVE statements:")
        for stmt in cleanup['statements']:
            print(f"  {stmt}")
    
    asyncio.run(test())