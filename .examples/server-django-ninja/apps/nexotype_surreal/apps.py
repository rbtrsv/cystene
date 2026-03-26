# server/apps/nexotype_surreal/apps.py

from django.apps import AppConfig

class NexotypeSurrealConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.nexotype_surreal'
    verbose_name = 'Nexotype - SurrealDB Graph Database'
    
    def ready(self):
        # No automatic migrations on startup
        pass