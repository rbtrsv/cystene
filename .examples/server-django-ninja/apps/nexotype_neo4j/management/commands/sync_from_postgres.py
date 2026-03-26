import logging
import time
import sys
from decimal import Decimal
from datetime import datetime, date

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import models as django_db_models # For type checking
from django.db import transaction as django_db_transaction # Alias to avoid clash

# Import Django models (source)
from apps.nexotype import models as django_models

# Import Neomodel models (target)
from apps.nexotype_neo4j import models as neo4j_models

# Import Neomodel config and transaction tools
from neomodel import db as neo4j_db, config, NeomodelException, DoesNotExist

# Optional: tqdm for progress bars
try:
    from tqdm import tqdm
except ImportError:
    tqdm = None # Define tqdm as None if not installed

# --- Configuration ---
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define the mapping from Django model fields to Neomodel properties
# Basic direct mapping assumed for most fields with the same name.
# Node Class Name, Django Source Model, Neo4j Target Model, Unique Field
NODE_SYNC_PLAN = [
    ("Gene", django_models.Gene, neo4j_models.Gene, "uid"),
    ("Protein", django_models.Protein, neo4j_models.Protein, "uid"),
    ("Peptide", django_models.Peptide, neo4j_models.Peptide, "uid"),
    ("Pathway", django_models.Pathway, neo4j_models.Pathway, "uid"),
    ("Disease", django_models.Disease, neo4j_models.Disease, "uid"),
    ("BioActivity", django_models.BioActivity, neo4j_models.BioActivity, "uid"),
    ("ProteinDomain", django_models.ProteinDomain, neo4j_models.ProteinDomain, "uid"),
    ("Variant", django_models.Variant, neo4j_models.Variant, "uid"),
    ("Phenotype", django_models.Phenotype, neo4j_models.Phenotype, "uid"),
    ("Treatment", django_models.Treatment, neo4j_models.Treatment, "uid"),
    ("Biomarker", django_models.Biomarker, neo4j_models.Biomarker, "uid"),
]

# Define the relationship sync plan based on Django's "through" models or M2M fields
# Rel Name, Django Relation Model, Neo4j Source Node Cls, Neo4j Target Node Cls, Rel Mgr Attr on Source, Key Map, Rel Props List (optional)
RELATIONSHIP_SYNC_PLAN = [
    # Relationship Name, Django Model, Source Neo4j, Target Neo4j, Relationship Manager Attribute on Source, {django_source_key: uid_field, django_target_key: uid_field}, [rel_prop_names]
    ("ENCODES", django_models.Encodes, neo4j_models.Gene, neo4j_models.Protein, "proteins", {'gene': 'uid', 'protein': 'uid'}, []),
    ("CONTAINS", django_models.Contains, neo4j_models.Protein, neo4j_models.Peptide, "peptides", {'protein': 'uid', 'peptide': 'uid'}, []),
    ("HAS_ACTIVITY", django_models.HasActivity, neo4j_models.Peptide, neo4j_models.BioActivity, "activities", {'peptide': 'uid', 'bio_activity': 'uid'}, []),
    ("HAS_DOMAIN", django_models.HasDomain, neo4j_models.Protein, neo4j_models.ProteinDomain, "domains", {'protein': 'uid', 'domain': 'uid'}, []),
    ("GENE_PARTICIPATES_IN", django_models.GeneParticipatesIn, neo4j_models.Gene, neo4j_models.Pathway, "pathways", {'gene': 'uid', 'pathway': 'uid'}, []),
    ("PROTEIN_PARTICIPATES_IN", django_models.ProteinParticipatesIn, neo4j_models.Protein, neo4j_models.Pathway, "pathways", {'protein': 'uid', 'pathway': 'uid'}, []),
    ("IS_PART_OF", django_models.IsPartOf, neo4j_models.Pathway, neo4j_models.Pathway, "parent_pathways", {'child': 'uid', 'parent': 'uid'}, []), # Child connects TO Parent via 'parent_pathways'
    ("ASSOCIATED_WITH", django_models.AssociatedWith, neo4j_models.Gene, neo4j_models.Disease, "diseases", {'gene': 'uid', 'disease': 'uid'}, []),
    ("TREATS", django_models.Treats, neo4j_models.Treatment, neo4j_models.Disease, "diseases", {'treatment': 'uid', 'disease': 'uid'}, []),
    ("INDICATES", django_models.Indicates, neo4j_models.Biomarker, neo4j_models.Disease, "diseases", {'biomarker': 'uid', 'disease': 'uid'}, []),
    ("CAUSES", django_models.Causes, neo4j_models.Variant, neo4j_models.Phenotype, "phenotypes", {'variant': 'uid', 'phenotype': 'uid'}, []),
    # Special cases handled separately: VARIANT_OF (FK), INTERACTS_WITH (M2M self with props)
]

# --- Helper Functions ---

def serialize_value(value):
    """Converts Django model field values to Neo4j compatible types."""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    elif isinstance(value, Decimal):
        return float(value)
    # Add other conversions if needed (e.g., UUID)
    return value

def get_node_properties(django_obj, neo4j_model_cls):
    """Extracts properties from a Django object compatible with the Neomodel definition."""
    properties = {}
    for prop_name in neo4j_model_cls.defined_properties(aliases=False, rels=False):
        if hasattr(django_obj, prop_name) and prop_name != 'id': # Exclude neomodel's internal id
            value = getattr(django_obj, prop_name)
            # Handle specific Django field types -> Neomodel property types
            django_field = django_obj._meta.get_field(prop_name)
            if isinstance(django_field, django_db_models.JSONField):
                # Ensure JSONField becomes a list/dict as expected by Neomodel ArrayProperty/JSONProperty
                properties[prop_name] = value if isinstance(value, (list, dict)) else [] if value is None else list(value) # Basic list conversion
            else:
                 properties[prop_name] = serialize_value(value)
    return properties


# --- Main Command Class ---

class Command(BaseCommand):
    help = 'Synchronizes data from Django PostgreSQL models to Neo4j using Neomodel.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete ALL existing data in Neo4j before syncing. USE WITH CAUTION!',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Number of objects to process in each batch.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate the process without writing to Neo4j.',
        )

    def handle(self, *args, **options):
        self.clear = options['clear']
        self.batch_size = options['batch_size']
        self.dry_run = options['dry_run']
        self.stats = {'nodes': {}, 'rels': {}, 'errors': 0}

        start_time = time.time()
        logger.info(f"Starting synchronization (Batch size: {self.batch_size}, Dry run: {self.dry_run})")

        if self.dry_run:
            logger.warning("--- DRY RUN MODE: No changes will be written to Neo4j ---")

        try:
            self._configure_neo4j()

            if self.clear:
                self._clear_neo4j()

            self._sync_nodes_batched()
            self._sync_relationships()
            self._sync_variant_gene_rels()
            self._sync_protein_interactions()

        except Exception as e:
            logger.exception("An critical error occurred during synchronization.")
            self.stats['errors'] += 1
            raise CommandError(f"Synchronization failed critically: {e}")
        finally:
            end_time = time.time()
            duration = end_time - start_time
            logger.info(f"\n--- Synchronization Summary ---")
            for model_name, counts in self.stats['nodes'].items():
                 logger.info(f"Nodes - {model_name}: Found={counts['found']}, Created={counts['created']}, Updated={counts['updated']}, Failed={counts['failed']}")
            for rel_name, counts in self.stats['rels'].items():
                 logger.info(f"Rels - {rel_name}: Found={counts['found']}, Connected={counts['connected']}, PropsUpdated={counts['props_updated']}, Failed={counts['failed']}")

            total_errors = self.stats['errors'] + sum(c['failed'] for c in self.stats['nodes'].values()) + sum(c['failed'] for c in self.stats['rels'].values())
            logger.info(f"Total Errors encountered: {total_errors}")
            logger.info(f"Synchronization finished in {duration:.2f} seconds.")
            if self.dry_run:
                logger.warning("--- Reminder: DRY RUN MODE was active. No actual changes were made. ---")

    def _configure_neo4j(self):
        """Configure Neomodel connection."""
        logger.info("Configuring Neo4j connection...")
        try:
            if not settings.NEOMODEL_NEO4J_BOLT_URL:
                 raise ValueError("NEOMODEL_NEO4J_BOLT_URL is not set in Django settings.")
            config.DATABASE_URL = settings.NEOMODEL_NEO4J_BOLT_URL
            # Test connection
            if not self.dry_run:
                neo4j_db.cypher_query("RETURN 1")
            logger.info(self.style.SUCCESS("Neo4j connection configured successfully (or skipped for dry run)."))
        except (AttributeError, ValueError, NeomodelException) as e:
            logger.error(f"Neo4j connection failed: {e}")
            raise CommandError(f"Cannot connect to Neo4j: {e}")

    def _clear_neo4j(self):
        """Deletes all nodes and relationships in the Neo4j database."""
        logger.warning(self.style.WARNING("--- CLEARING ALL DATA IN NEO4J DATABASE ---"))
        if self.dry_run:
            logger.warning("[Dry Run] Skipping database clear.")
            return

        confirm = input("Are you absolutely sure you want to delete EVERYTHING in Neo4j? (yes/no): ")
        if confirm.lower() == 'yes':
            logger.info("Executing DETACH DELETE...")
            try:
                with neo4j_db.transaction:
                    neo4j_db.cypher_query("MATCH (n) DETACH DELETE n")
                logger.info(self.style.SUCCESS("Neo4j database cleared successfully."))
            except Exception as e:
                 logger.error(f"Failed to clear Neo4j database: {e}")
                 raise CommandError(f"Failed to clear Neo4j: {e}")
        else:
            logger.error("Database clear aborted by user.")
            sys.exit(1) # Exit if user doesn't confirm clear

    def _sync_nodes_batched(self):
        """Synchronize nodes using batched Cypher queries."""
        logger.info(self.style.HTTP_INFO("\n--- Starting Node Synchronization (Batched) ---"))

        for model_name, django_model, neo4j_model, unique_field in NODE_SYNC_PLAN:
            logger.info(f"\nSyncing {model_name} nodes...")
            self.stats['nodes'][model_name] = {'found': 0, 'created': 0, 'updated': 0, 'failed': 0}
            node_label = neo4j_model.__label__ # Get the actual label used by Neomodel

            try:
                total_count = django_model.objects.count()
                self.stats['nodes'][model_name]['found'] = total_count
                logger.info(f"Found {total_count} {model_name} objects in Django.")

                # Use iterator for memory efficiency
                iterator = django_model.objects.iterator(chunk_size=self.batch_size)
                processed_count = 0

                # Prepare tqdm progress bar if available
                pbar = None
                if tqdm and total_count > 0:
                    pbar = tqdm(total=total_count, desc=f"Syncing {model_name}", unit="node")

                batch_num = 0
                while True:
                    batch_start_time = time.time()
                    # Get the next batch using slicing on the iterator (less standard but works)
                    # A more typical pattern involves `itertools.islice` or explicit batch building
                    # Let's build the batch explicitly:
                    current_batch = []
                    try:
                        for _ in range(self.batch_size):
                            current_batch.append(next(iterator))
                    except StopIteration:
                        pass # End of iterator

                    if not current_batch:
                        break # Exit loop if batch is empty

                    batch_num += 1
                    props_list = []
                    for obj in current_batch:
                        try:
                            props = get_node_properties(obj, neo4j_model)
                            props[unique_field] = getattr(obj, unique_field) # Ensure unique field is present
                            props_list.append(props)
                        except Exception as e:
                            uid_val = getattr(obj, unique_field, 'UNKNOWN_UID')
                            logger.error(f"Error processing Django {model_name} with {unique_field}={uid_val}: {e}")
                            self.stats['nodes'][model_name]['failed'] += 1


                    if not props_list: # Skip if batch processing yielded no valid properties
                         if pbar: pbar.update(len(current_batch))
                         processed_count += len(current_batch)
                         continue

                    # Cypher query to MERGE nodes based on unique_field and SET properties
                    # MERGE creates if not exists, ON CREATE sets initial props, ON MATCH updates props
                    cypher = f"""
                    UNWIND $props_list AS properties
                    MERGE (n:{node_label} {{ {unique_field}: properties.{unique_field} }})
                    ON CREATE SET n = properties, n._created_in_batch = {batch_num}
                    ON MATCH SET n += properties, n._updated_in_batch = {batch_num}
                    RETURN n.{unique_field} AS uid, n._created_in_batch = {batch_num} AS created, n._updated_in_batch = {batch_num} AS updated
                    """

                    if self.dry_run:
                        logger.info(f"[Dry Run] Would execute Cypher for {model_name} batch {batch_num} ({len(props_list)} nodes)")
                        # Simulate counts for dry run
                        # This is an approximation - real merge might differ
                        for props in props_list:
                             # Assume update unless we can query, which we avoid in dry run
                             self.stats['nodes'][model_name]['updated'] += 1
                    else:
                        try:
                            results, meta = neo4j_db.cypher_query(cypher, {'props_list': props_list})
                            # Process results to count created vs updated accurately
                            for record in results:
                                if record[1]: # created flag is true
                                    self.stats['nodes'][model_name]['created'] += 1
                                elif record[2]: # updated flag is true
                                    self.stats['nodes'][model_name]['updated'] += 1
                        except Exception as e:
                            logger.error(f"Cypher query failed for {model_name} batch {batch_num}: {e}")
                            self.stats['nodes'][model_name]['failed'] += len(props_list) # Assume all in batch failed

                    batch_duration = time.time() - batch_start_time
                    logger.debug(f"Processed {model_name} batch {batch_num} ({len(current_batch)} nodes) in {batch_duration:.2f}s")
                    processed_count += len(current_batch)
                    if pbar: pbar.update(len(current_batch))

                if pbar: pbar.close()

            except Exception as e:
                logger.exception(f"Error during synchronization of {model_name} nodes.")
                self.stats['nodes'][model_name]['failed'] += total_count - processed_count # Mark remaining as failed
                self.stats['errors'] += 1

            logger.info(f"Finished syncing {model_name} nodes. "
                        f"Created: {self.stats['nodes'][model_name]['created']}, "
                        f"Updated: {self.stats['nodes'][model_name]['updated']}, "
                        f"Failed: {self.stats['nodes'][model_name]['failed']}")


    def _sync_relationships(self):
        """Synchronize relationships based on Django 'through' models."""
        logger.info(self.style.HTTP_INFO("\n--- Starting Relationship Synchronization ---"))

        for rel_name, django_rel_model, neo4j_source_cls, neo4j_target_cls, rel_manager_attr, key_map, rel_prop_names in RELATIONSHIP_SYNC_PLAN:
            logger.info(f"\nSyncing {rel_name} relationships ({neo4j_source_cls.__name__} -> {neo4j_target_cls.__name__})...")
            self.stats['rels'][rel_name] = {'found': 0, 'connected': 0, 'props_updated': 0, 'failed': 0}

            # Identify the actual foreign key field names on the Django relation model
            source_fk_name = list(key_map.keys())[0]
            target_fk_name = list(key_map.keys())[1]
            # Make sure to select related fields for efficiency when iterating
            related_fields = [source_fk_name, target_fk_name]

            try:
                total_count = django_rel_model.objects.count()
                self.stats['rels'][rel_name]['found'] = total_count
                logger.info(f"Found {total_count} {rel_name} relationships in Django.")

                iterator = django_rel_model.objects.select_related(*related_fields).iterator(chunk_size=self.batch_size)
                processed_count = 0

                pbar = None
                if tqdm and total_count > 0:
                    pbar = tqdm(total=total_count, desc=f"Syncing {rel_name}", unit="rel")

                while True:
                     current_batch = []
                     try:
                         for _ in range(self.batch_size):
                             current_batch.append(next(iterator))
                     except StopIteration:
                         pass

                     if not current_batch:
                         break

                     batch_connected = 0
                     batch_props_updated = 0
                     batch_failed = 0

                     # Process batch within a single transaction if not dry run
                     transaction = None
                     if not self.dry_run:
                         transaction = neo4j_db.transaction # Start transaction context

                     try:
                          if transaction: transaction.__enter__() # Manually enter context

                          for rel_instance in current_batch:
                              try:
                                  source_obj = getattr(rel_instance, source_fk_name)
                                  target_obj = getattr(rel_instance, target_fk_name)

                                  if source_obj is None or target_obj is None:
                                        logger.warning(f"Skipping {rel_name} for instance {rel_instance.pk}: Missing source or target object.")
                                        batch_failed += 1
                                        continue

                                  source_uid = getattr(source_obj, key_map[source_fk_name])
                                  target_uid = getattr(target_obj, key_map[target_fk_name])

                                  if self.dry_run:
                                      logger.debug(f"[Dry Run] Would connect {rel_name}: {source_uid} -> {target_uid}")
                                      # Simulate connection
                                      batch_connected += 1
                                      # Simulate property update if props exist
                                      if rel_prop_names:
                                           batch_props_updated +=1
                                  else:
                                      # Find the corresponding Neo4j nodes (MUST exist after node sync)
                                      source_node = neo4j_source_cls.nodes.get(uid=source_uid)
                                      target_node = neo4j_target_cls.nodes.get(uid=target_uid)

                                      # Connect them using the relationship manager
                                      rel_manager = getattr(source_node, rel_manager_attr)
                                      rel = rel_manager.connect(target_node) # Creates if not exists

                                      # Handle relationship properties if any
                                      props_updated_flag = False
                                      if rel_prop_names:
                                          props_to_set = {}
                                          needs_save = False
                                          for prop_name in rel_prop_names:
                                              new_value = serialize_value(getattr(rel_instance, prop_name))
                                              if getattr(rel, prop_name, None) != new_value:
                                                  setattr(rel, prop_name, new_value)
                                                  needs_save = True
                                          if needs_save:
                                              rel.save() # Save relationship properties
                                              props_updated_flag = True

                                      batch_connected += 1
                                      if props_updated_flag:
                                          batch_props_updated += 1

                              except DoesNotExist as e:
                                  logger.warning(f"Skipping {rel_name} for instance {rel_instance.pk}: Node not found. "
                                                 f"(SourceUID: {source_uid}, TargetUID: {target_uid}). Error: {e}")
                                  batch_failed += 1
                              except Exception as e:
                                  logger.error(f"Failed to sync {rel_name} for instance {rel_instance.pk} "
                                               f"(SourceUID: {source_uid}, TargetUID: {target_uid}): {e}")
                                  batch_failed += 1

                          # Commit transaction if not dry run
                          if transaction: transaction.__exit__(None, None, None)

                     except Exception as batch_e: # Catch errors during transaction commit/context exit
                          logger.error(f"Error processing batch for {rel_name}: {batch_e}")
                          if transaction: transaction.__exit__(type(batch_e), batch_e, batch_e.__traceback__) # Ensure exit
                          # Mark all in batch as failed if transaction fails
                          batch_failed = len(current_batch)
                          batch_connected = 0
                          batch_props_updated = 0
                     finally:
                          # Update global stats
                          self.stats['rels'][rel_name]['connected'] += batch_connected
                          self.stats['rels'][rel_name]['props_updated'] += batch_props_updated
                          self.stats['rels'][rel_name]['failed'] += batch_failed
                          processed_count += len(current_batch)
                          if pbar: pbar.update(len(current_batch))

                if pbar: pbar.close()

            except Exception as e:
                logger.exception(f"Error during synchronization of {rel_name} relationships.")
                self.stats['rels'][rel_name]['failed'] += total_count - processed_count # Mark remaining as failed
                self.stats['errors'] += 1

            logger.info(f"Finished syncing {rel_name}. Connected: {self.stats['rels'][rel_name]['connected']}, "
                        f"Props Updated: {self.stats['rels'][rel_name]['props_updated']}, "
                        f"Failed: {self.stats['rels'][rel_name]['failed']}")


    # --- Special Case Sync Functions (adapt batching/transaction logic as above) ---

    def _sync_variant_gene_rels(self):
        """Sync VARIANT_OF (Variant -> Gene) FK relationship."""
        rel_name = "VARIANT_OF"
        logger.info(f"\nSyncing {rel_name} relationships (Variant -> Gene)...")
        self.stats['rels'][rel_name] = {'found': 0, 'connected': 0, 'props_updated': 0, 'failed': 0}

        try:
            # Filter for variants that HAVE a gene assigned
            queryset = django_models.Variant.objects.filter(gene__isnull=False).select_related('gene')
            total_count = queryset.count()
            self.stats['rels'][rel_name]['found'] = total_count
            logger.info(f"Found {total_count} Variants with associated Genes in Django.")

            iterator = queryset.iterator(chunk_size=self.batch_size)
            processed_count = 0
            pbar = None
            if tqdm and total_count > 0:
                pbar = tqdm(total=total_count, desc=f"Syncing {rel_name}", unit="rel")

            while True:
                current_batch = []
                try:
                    for _ in range(self.batch_size):
                        current_batch.append(next(iterator))
                except StopIteration:
                    pass
                if not current_batch: break

                batch_connected = 0
                batch_failed = 0
                transaction = None
                if not self.dry_run: transaction = neo4j_db.transaction

                try:
                     if transaction: transaction.__enter__()
                     for variant_instance in current_batch:
                         try:
                             variant_uid = variant_instance.uid
                             gene_uid = variant_instance.gene.uid # Assumes gene is not None due to filter

                             if self.dry_run:
                                 logger.debug(f"[Dry Run] Would connect {rel_name}: {variant_uid} -> {gene_uid}")
                                 batch_connected += 1
                             else:
                                 neo4j_variant = neo4j_models.Variant.nodes.get(uid=variant_uid)
                                 neo4j_gene = neo4j_models.Gene.nodes.get(uid=gene_uid)
                                 neo4j_variant.gene.connect(neo4j_gene) # Use the 'gene' RelationshipTo
                                 batch_connected += 1

                         except DoesNotExist as e:
                             logger.warning(f"Skipping {rel_name}: Node not found for Variant {variant_uid} or Gene {gene_uid}. Error: {e}")
                             batch_failed += 1
                         except Exception as e:
                             logger.error(f"Failed to sync {rel_name} for Variant {variant_uid}: {e}")
                             batch_failed += 1

                     if transaction: transaction.__exit__(None, None, None)
                except Exception as batch_e:
                     logger.error(f"Error processing batch for {rel_name}: {batch_e}")
                     if transaction: transaction.__exit__(type(batch_e), batch_e, batch_e.__traceback__)
                     batch_failed = len(current_batch)
                     batch_connected = 0
                finally:
                     self.stats['rels'][rel_name]['connected'] += batch_connected
                     self.stats['rels'][rel_name]['failed'] += batch_failed
                     processed_count += len(current_batch)
                     if pbar: pbar.update(len(current_batch))

            if pbar: pbar.close()
        except Exception as e:
             logger.exception(f"Error during synchronization of {rel_name} relationships.")
             self.stats['rels'][rel_name]['failed'] += total_count - processed_count
             self.stats['errors'] += 1

        logger.info(f"Finished syncing {rel_name}. Connected: {self.stats['rels'][rel_name]['connected']}, Failed: {self.stats['rels'][rel_name]['failed']}")


    def _sync_protein_interactions(self):
        """Sync INTERACTS_WITH (Protein <-> Protein) M2M self-relationship with properties."""
        rel_name = "INTERACTS_WITH"
        logger.info(f"\nSyncing {rel_name} relationships (Protein <-> Protein)...")
        self.stats['rels'][rel_name] = {'found': 0, 'connected': 0, 'props_updated': 0, 'failed': 0}
        prop_name = 'interaction_strength' # Specific property for this relationship

        try:
            queryset = django_models.InteractsWith.objects.select_related('source_protein', 'target_protein')
            total_count = queryset.count()
            self.stats['rels'][rel_name]['found'] = total_count
            logger.info(f"Found {total_count} {rel_name} relationships in Django.")

            iterator = queryset.iterator(chunk_size=self.batch_size)
            processed_count = 0
            pbar = None
            if tqdm and total_count > 0:
                 pbar = tqdm(total=total_count, desc=f"Syncing {rel_name}", unit="rel")

            while True:
                current_batch = []
                try:
                    for _ in range(self.batch_size):
                        current_batch.append(next(iterator))
                except StopIteration:
                    pass
                if not current_batch: break

                batch_connected = 0
                batch_props_updated = 0
                batch_failed = 0
                transaction = None
                if not self.dry_run: transaction = neo4j_db.transaction

                try:
                    if transaction: transaction.__enter__()
                    for rel_instance in current_batch:
                        try:
                            source_uid = rel_instance.source_protein.uid
                            target_uid = rel_instance.target_protein.uid
                            new_prop_value = serialize_value(getattr(rel_instance, prop_name))

                            if self.dry_run:
                                logger.debug(f"[Dry Run] Would connect {rel_name}: {source_uid} -> {target_uid} with {prop_name}={new_prop_value}")
                                batch_connected += 1
                                batch_props_updated += 1 # Assume update
                            else:
                                source_node = neo4j_models.Protein.nodes.get(uid=source_uid)
                                target_node = neo4j_models.Protein.nodes.get(uid=target_uid)

                                # Use connect which returns the relationship object
                                rel = source_node.interactions.connect(target_node)
                                batch_connected += 1

                                # Check and update property if needed
                                if getattr(rel, prop_name, None) != new_prop_value:
                                    setattr(rel, prop_name, new_prop_value)
                                    rel.save()
                                    batch_props_updated += 1

                        except DoesNotExist as e:
                            logger.warning(f"Skipping {rel_name}: Node not found for interaction {rel_instance.pk}. (Source: {source_uid}, Target: {target_uid}). Error: {e}")
                            batch_failed += 1
                        except Exception as e:
                            logger.error(f"Failed to sync {rel_name} for interaction {rel_instance.pk} (Source: {source_uid}, Target: {target_uid}): {e}")
                            batch_failed += 1

                    if transaction: transaction.__exit__(None, None, None)
                except Exception as batch_e:
                    logger.error(f"Error processing batch for {rel_name}: {batch_e}")
                    if transaction: transaction.__exit__(type(batch_e), batch_e, batch_e.__traceback__)
                    batch_failed = len(current_batch)
                    batch_connected = 0
                    batch_props_updated = 0
                finally:
                     self.stats['rels'][rel_name]['connected'] += batch_connected
                     self.stats['rels'][rel_name]['props_updated'] += batch_props_updated
                     self.stats['rels'][rel_name]['failed'] += batch_failed
                     processed_count += len(current_batch)
                     if pbar: pbar.update(len(current_batch))

            if pbar: pbar.close()
        except Exception as e:
             logger.exception(f"Error during synchronization of {rel_name} relationships.")
             self.stats['rels'][rel_name]['failed'] += total_count - processed_count
             self.stats['errors'] += 1

        logger.info(f"Finished syncing {rel_name}. Connected: {self.stats['rels'][rel_name]['connected']}, "
                    f"Props Updated: {self.stats['rels'][rel_name]['props_updated']}, "
                    f"Failed: {self.stats['rels'][rel_name]['failed']}")
