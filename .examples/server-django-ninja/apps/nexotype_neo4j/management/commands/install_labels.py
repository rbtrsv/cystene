import importlib
from django.core.management.base import BaseCommand
from django.conf import settings
from neomodel import db, config, install_all_labels

class Command(BaseCommand):
    help = 'Install labels and constraints for Neo4j models'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test',
            action='store_true',
            help='Only test the connection without installing labels',
        )
        parser.add_argument(
            '--check',
            action='store_true',
            help='Check existing constraints and indices',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up Neo4j connection...')
        
        # Set the connection URL
        config.DATABASE_URL = settings.NEOMODEL_NEO4J_BOLT_URL
        
        # Test connection
        try:
            results, meta = db.cypher_query("RETURN 1 AS test")
            self.stdout.write(self.style.SUCCESS("Connection successful"))
            
            # Only test connection if requested
            if options['test']:
                return
                
            # Check existing schema if requested
            if options['check']:
                self.check_schema()
                return
                
            # Install labels for all models
            self.stdout.write("Installing labels and constraints...")
            num_models = install_all_labels()
            self.stdout.write(self.style.SUCCESS(f"Successfully installed labels for {num_models} models"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Connection failed: {str(e)}"))
        finally:
            db.close_connection()
    
    def check_schema(self):
        """Check existing constraints and indices in the database"""
        # Query for constraints
        results, meta = db.cypher_query("SHOW CONSTRAINTS")
        self.stdout.write(self.style.SUCCESS(f"Found {len(results)} constraints"))
        
        # Query for indices
        results, meta = db.cypher_query("SHOW INDEXES")
        self.stdout.write(self.style.SUCCESS(f"Found {len(results)} indices"))