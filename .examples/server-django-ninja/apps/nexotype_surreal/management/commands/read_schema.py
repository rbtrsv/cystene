import asyncio
from django.core.management.base import BaseCommand
from apps.nexotype_surreal.utils.surreal_schema_diff_utils import read_db_schema
import json


class Command(BaseCommand):
    help = 'Read current schema from SurrealDB database'

    def handle(self, *args, **options):
        self.stdout.write('Reading schema from SurrealDB...')
        
        try:
            schema = asyncio.run(read_db_schema())
            
            # Pretty print the schema
            self.stdout.write(json.dumps(schema, indent=2))
            
            self.stdout.write(self.style.SUCCESS(f"Successfully read schema for {len(schema)} tables"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error reading schema: {str(e)}"))