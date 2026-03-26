import asyncio
from django.core.management.base import BaseCommand
from apps.nexotype_surreal.utils.surreal_schema_diff_utils import surreal_clean_schema
from apps.nexotype_surreal.utils.surreal_connection_utils import get_surreal_connection


class Command(BaseCommand):
    help = 'Clean orphaned schema elements from SurrealDB (remove fields/tables not in models)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Only show what would be removed, do not execute',
        )

    def handle(self, *args, **options):
        self.stdout.write('Cleaning orphaned schema elements...')
        
        try:
            cleanup_result = asyncio.run(surreal_clean_schema())
            statements = cleanup_result['statements']
            
            if not statements:
                self.stdout.write(self.style.SUCCESS("No orphaned schema elements found"))
                return
            
            self.stdout.write(f"Found {len(statements)} orphaned schema elements:")
            for stmt in statements:
                self.stdout.write(f"  {stmt}")
            
            if options['dry_run']:
                self.stdout.write(self.style.WARNING("DRY RUN - No changes applied"))
                return
            
            # Ask for confirmation
            confirm = input("\nApply these REMOVE statements? (y/N): ")
            if confirm.lower() != 'y':
                self.stdout.write("Cancelled")
                return
            
            # Execute the statements
            asyncio.run(self._execute_statements(statements))
            self.stdout.write(self.style.SUCCESS("Schema cleanup completed"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cleaning schema: {str(e)}"))

    async def _execute_statements(self, statements):
        """Execute the REMOVE statements"""
        db = await get_surreal_connection()
        
        for stmt in statements:
            try:
                await db.query(stmt)
                self.stdout.write(f"✓ {stmt}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ {stmt}"))
                self.stdout.write(self.style.ERROR(f"  Error: {str(e)}"))