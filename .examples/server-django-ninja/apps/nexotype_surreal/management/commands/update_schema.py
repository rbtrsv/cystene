import asyncio
from django.core.management.base import BaseCommand
from apps.nexotype_surreal.utils.surreal_update_schema_utils import update_schema
import traceback

class Command(BaseCommand):
    help = 'Update SurrealDB schema using the predefined definitions'

    def handle(self, *args, **options):
        self.stdout.write('Updating SurrealDB schema using predefined definitions...')
        
        try:
            # Run the async update_schema function using asyncio.run()
            asyncio.run(update_schema()) 
            # Note: The update_schema function prints its own progress and completion message.
            # We might not need additional success messages here unless update_schema returns a status.
            self.stdout.write(self.style.SUCCESS("✅ Management command finished executing update_schema."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error executing update_schema from management command: {str(e)}"))
            self.stdout.write(self.style.ERROR(f"   Type: {type(e).__name__}"))
            self.stdout.write(self.style.ERROR(f"   Args: {e.args}"))
            self.stdout.write(self.style.ERROR(f"   Traceback:\n{traceback.format_exc()}"))
