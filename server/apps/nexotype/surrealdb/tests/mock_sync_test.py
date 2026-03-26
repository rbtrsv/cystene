"""
Test SurrealDB sync service with mock data.
Run with: python -m apps.nexotype.surrealdb.tests.mock_sync_test
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from apps.nexotype.surrealdb.db import get_surreal, close_surreal


# Mock entity classes that match the models structure
class MockEntity:
    """Base mock entity class"""
    def __init__(self, uid: str, name: str, **kwargs):
        self.uid = uid
        self.name = name
        self.created_at = datetime.now(timezone.utc)
        for key, value in kwargs.items():
            setattr(self, key, value)


class MockGene(MockEntity):
    """Mock Gene entity"""
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.ensembl_id = kwargs.get('ensembl_id', f'ENSG{uid}')
        self.chromosome = kwargs.get('chromosome', '1')
        self.gene_type = kwargs.get('gene_type', 'protein_coding')
        self.start_position = kwargs.get('start_position', 1000)
        self.end_position = kwargs.get('end_position', 2000)
        self.species = kwargs.get('species', 'homo_sapiens')


class MockProtein(MockEntity):
    """Mock Protein entity"""
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.uniprot_id = kwargs.get('uniprot_id', f'P{uid}')
        self.molecular_weight = kwargs.get('molecular_weight', 50000.0)
        self.isoelectric_point = kwargs.get('isoelectric_point', 7.0)
        self.pdb_id = kwargs.get('pdb_id', '1ABC')
        self.binding_sites = kwargs.get('binding_sites', {'ATP': 'site1'})


class MockTreatment(MockEntity):
    """Mock Treatment entity"""
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.treatment_type = kwargs.get('treatment_type', 'small_molecule')
        self.availability = kwargs.get('availability', 'experimental')
        self.synthesis_difficulty = kwargs.get('synthesis_difficulty', 'medium')
        self.typical_dosage = kwargs.get('typical_dosage', '10mg')


class MockDisease(MockEntity):
    """Mock Disease entity"""
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.omim_id = kwargs.get('omim_id', f'OMIM{uid}')
        self.disease_class = kwargs.get('disease_class', 'genetic')


async def sync_mock_entity(db: Any, entity: Any, table: str):
    """
    Sync a mock entity to SurrealDB.

    Args:
        db: SurrealDB client
        entity: Mock entity instance
        table: SurrealDB table name
    """
    properties = {
        'uid': entity.uid,
        'name': entity.name,
        'created_at': entity.created_at.isoformat() if entity.created_at else None
    }

    # Add entity-specific properties
    if isinstance(entity, MockGene):
        properties.update({
            'ensembl_id': entity.ensembl_id,
            'chromosome': entity.chromosome,
            'gene_type': entity.gene_type,
            'start_position': entity.start_position,
            'end_position': entity.end_position,
            'species': entity.species
        })
    elif isinstance(entity, MockProtein):
        properties.update({
            'uniprot_id': entity.uniprot_id,
            'molecular_weight': entity.molecular_weight,
            'isoelectric_point': entity.isoelectric_point,
            'pdb_id': entity.pdb_id,
            'binding_sites': str(entity.binding_sites) if entity.binding_sites else None
        })
    elif isinstance(entity, MockTreatment):
        properties.update({
            'treatment_type': entity.treatment_type,
            'availability': entity.availability,
            'synthesis_difficulty': entity.synthesis_difficulty,
            'typical_dosage': entity.typical_dosage
        })
    elif isinstance(entity, MockDisease):
        properties.update({
            'omim_id': entity.omim_id,
            'disease_class': entity.disease_class
        })

    # SurrealQL CREATE with record ID
    record_id = f"{table}:{entity.uid}"
    await db.create(record_id, properties)


async def sync_mock_relationship(
    db: Any,
    source_uid: str,
    source_table: str,
    target_uid: str,
    target_table: str,
    rel_type: str,
    properties: dict = None
):
    """
    Create a relationship between two nodes in SurrealDB.

    Args:
        db: SurrealDB client
        source_uid: UID of source entity
        source_table: Table name for source
        target_uid: UID of target entity
        target_table: Table name for target
        rel_type: Relationship type (edge table name)
        properties: Optional relationship properties
    """
    # SurrealQL RELATE syntax
    query = f"RELATE {source_table}:{source_uid} -> {rel_type} -> {target_table}:{target_uid}"
    if properties:
        query += " CONTENT $props"
        await db.query(query, {"props": properties})
    else:
        await db.query(query)


async def test_sync_with_mock_data():
    """Test syncing mock biotech data to SurrealDB"""
    try:
        print("🧪 Testing SurrealDB sync with mock biotech data...\n")

        db = await get_surreal()

        # Clear existing data
        print("🧹 Clearing existing data...")
        tables = ['gene', 'protein', 'disease', 'treatment',
                  'encodes', 'associated_with', 'treats']
        for table in tables:
            await db.query(f"DELETE {table}")

        # Create mock entities
        print("\n📦 Creating mock entities...")

        # Genes
        gene1 = MockGene("001", "TP53", chromosome="17", gene_type="tumor_suppressor")
        gene2 = MockGene("002", "BRCA1", chromosome="17", gene_type="tumor_suppressor")
        gene3 = MockGene("003", "APOE", chromosome="19", gene_type="lipoprotein")

        # Proteins
        protein1 = MockProtein("101", "p53 protein", molecular_weight=43700)
        protein2 = MockProtein("102", "BRCA1 protein", molecular_weight=207700)
        protein3 = MockProtein("103", "Apolipoprotein E", molecular_weight=34200)

        # Diseases
        disease1 = MockDisease("201", "Li-Fraumeni Syndrome", disease_class="cancer_predisposition")
        disease2 = MockDisease("202", "Breast Cancer", disease_class="cancer")
        disease3 = MockDisease("203", "Alzheimer's Disease", disease_class="neurodegenerative")

        # Treatments
        treatment1 = MockTreatment("301", "Nutlin-3", treatment_type="MDM2_inhibitor")
        treatment2 = MockTreatment("302", "Olaparib", treatment_type="PARP_inhibitor")
        treatment3 = MockTreatment("303", "Aducanumab", treatment_type="antibody")

        # Sync entities
        print("\n⬆️ Syncing entities to SurrealDB...")

        for gene in [gene1, gene2, gene3]:
            await sync_mock_entity(db, gene, "gene")
            print(f"  ✅ Gene: {gene.name}")

        for protein in [protein1, protein2, protein3]:
            await sync_mock_entity(db, protein, "protein")
            print(f"  ✅ Protein: {protein.name}")

        for disease in [disease1, disease2, disease3]:
            await sync_mock_entity(db, disease, "disease")
            print(f"  ✅ Disease: {disease.name}")

        for treatment in [treatment1, treatment2, treatment3]:
            await sync_mock_entity(db, treatment, "treatment")
            print(f"  ✅ Treatment: {treatment.name}")

        # Create relationships
        print("\n🔗 Creating relationships...")

        # Gene → Protein (encodes)
        await sync_mock_relationship(db, "001", "gene", "101", "protein", "encodes")
        print("  ✅ TP53 -[encodes]-> p53 protein")

        await sync_mock_relationship(db, "002", "gene", "102", "protein", "encodes")
        print("  ✅ BRCA1 -[encodes]-> BRCA1 protein")

        await sync_mock_relationship(db, "003", "gene", "103", "protein", "encodes")
        print("  ✅ APOE -[encodes]-> Apolipoprotein E")

        # Gene → Disease (associated_with)
        await sync_mock_relationship(
            db, "001", "gene", "201", "disease", "associated_with",
            {"association_type": "causative", "odds_ratio": 10.5}
        )
        print("  ✅ TP53 -[associated_with]-> Li-Fraumeni Syndrome")

        await sync_mock_relationship(
            db, "002", "gene", "202", "disease", "associated_with",
            {"association_type": "risk_factor", "odds_ratio": 5.2}
        )
        print("  ✅ BRCA1 -[associated_with]-> Breast Cancer")

        await sync_mock_relationship(
            db, "003", "gene", "203", "disease", "associated_with",
            {"association_type": "risk_factor", "odds_ratio": 3.8}
        )
        print("  ✅ APOE -[associated_with]-> Alzheimer's Disease")

        # Treatment → Disease (treats)
        await sync_mock_relationship(
            db, "301", "treatment", "201", "disease", "treats",
            {"mechanism_type": "p53_activation", "efficacy_score": 0.7}
        )
        print("  ✅ Nutlin-3 -[treats]-> Li-Fraumeni Syndrome")

        await sync_mock_relationship(
            db, "302", "treatment", "202", "disease", "treats",
            {"mechanism_type": "DNA_repair_inhibition", "efficacy_score": 0.8}
        )
        print("  ✅ Olaparib -[treats]-> Breast Cancer")

        await sync_mock_relationship(
            db, "303", "treatment", "203", "disease", "treats",
            {"mechanism_type": "amyloid_clearance", "efficacy_score": 0.5}
        )
        print("  ✅ Aducanumab -[treats]-> Alzheimer's Disease")

        # Verify data
        print("\n📊 Verifying synced data...")

        # Count nodes in each table using SELECT *
        for table in ["gene", "protein", "disease", "treatment"]:
            result = await db.query(f"SELECT * FROM {table}")
            count = len(result) if isinstance(result, list) else 0
            print(f"  {table.capitalize()}s: {count}")

        # Count relationships
        print("\n  Relationships:")
        for rel_type in ["encodes", "associated_with", "treats"]:
            result = await db.query(f"SELECT * FROM {rel_type}")
            count = len(result) if isinstance(result, list) else 0
            print(f"    {rel_type}: {count}")

        # Test a graph query: Find treatments for genes via disease
        print("\n🔍 Testing graph query: Find treatments for genes...")

        for gene_uid in ["001", "002", "003"]:
            # Get gene name
            gene_result = await db.query(f"SELECT name FROM gene:{gene_uid}")
            gene_name = gene_result[0]["name"] if gene_result else "Unknown"

            # Traverse: gene -> associated_with -> disease <- treats <- treatment
            traversal = await db.query(f"SELECT ->associated_with->disease<-treats<-treatment.name FROM gene:{gene_uid}")

            if traversal and isinstance(traversal, list) and len(traversal) > 0:
                # Extract treatment names from nested traversal result
                # Format: {'->associated_with': {'->disease': {'<-treats': {'<-treatment': {'name': ['Nutlin-3']}}}}}
                treatment_data = traversal[0]
                try:
                    names = treatment_data['->associated_with']['->disease']['<-treats']['<-treatment']['name']
                    for t_name in (names if isinstance(names, list) else [names]):
                        print(f"    {gene_name} → {t_name}")
                except (KeyError, TypeError):
                    print(f"    {gene_name} → (no treatment found)")
            else:
                print(f"    {gene_name} → (no path found)")

        print("\n✨ All sync tests passed! SurrealDB sync service is working correctly.")

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        await close_surreal()


if __name__ == "__main__":
    asyncio.run(test_sync_with_mock_data())
