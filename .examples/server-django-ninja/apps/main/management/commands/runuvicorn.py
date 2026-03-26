from django.core.management.base import BaseCommand
from uvicorn import run

class Command(BaseCommand):
    help = 'Run UVicorn server with auto-reload'

    def handle(self, *args, **options):
        run("core.asgi:application", reload=True)