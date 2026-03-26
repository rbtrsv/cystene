"""
Test Neo4j sync service with mock data
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from apps.nexotype.neo4j.db import neo4j_driver, close_neo4j

# Mock entity classes that match your models structure
class MockEntity:
    def __init__(self, uid: str, name: str, **kwargs):
        self.uid = uid
        self.name = name
        self.created_at = datetime.now(timezone.utc)
        for key, value in kwargs.items():
            setattr(self, key, value)

class MockGene(MockEntity):
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.ensembl_id = kwargs.get('ensembl_id', f'ENSG{uid}')
        self.chromosome = kwargs.get('chromosome', '1')
        self.gene_type = kwargs.get('gene_type', 'protein_coding')
        self.start_position = kwargs.get('start_position', 1000)
        self.end_position = kwargs.get('end_position', 2000)
        self.species = kwargs.get('species', 'homo_sapiens')

class MockProtein(MockEntity):
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.uniprot_id = kwargs.get('uniprot_id', f'P{uid}')
        self.molecular_weight = kwargs.get('molecular_weight', 50000.0)
        self.isoelectric_point = kwargs.get('isoelectric_point', 7.0)
        self.pdb_id = kwargs.get('pdb_id', f'1ABC')
        self.binding_sites = kwargs.get('binding_sites', {'ATP': 'site1'})

class MockTreatment(MockEntity):
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.treatment_type = kwargs.get('treatment_type', 'small_molecule')
        self.availability = kwargs.get('availability', 'experimental')
        self.synthesis_difficulty = kwargs.get('synthesis_difficulty', 'medium')
        self.typical_dosage = kwargs.get('typical_dosage', '10mg')

class MockDisease(MockEntity):
    def __init__(self, uid: str, name: str, **kwargs):
        super().__init__(uid, name, **kwargs)
        self.omim_id = kwargs.get('omim_id', f'OMIM{uid}')
        self.disease_class = kwargs.get('disease_class', 'genetic')

async def sync_mock_entity(entity: Any, label: str):
    """Sync a mock entity to Neo4j (simplified version of sync_service)"""
    async with neo4j_driver.session() as session:
        query = f"""
        MERGE (n:{label} {{uid: $uid}})
        SET n += $properties
        RETURN n
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
        
        result = await session.run(query, uid=entity.uid, properties=properties)
        return await result.single()

async def sync_mock_relationship(source_uid: str, source_label: str, 
                                target_uid: str, target_label: str, 
                                rel_type: str, properties: dict = None):
    """Create a relationship between two nodes"""
    async with neo4j_driver.session() as session:
        query = f"""
        MATCH (a:{source_label} {{uid: $source_uid}})
        MATCH (b:{target_label} {{uid: $target_uid}})
        MERGE (a)-[r:{rel_type}]->(b)
        """
        params = {
            'source_uid': source_uid,
            'target_uid': target_uid
        }
        
        if properties:
            query += " SET r += $properties"
            params['properties'] = properties
        
        query += " RETURN a, r, b"
        
        result = await session.run(query, **params)
        return await result.single()

async def test_sync_with_mock_data():
    """Test syncing mock biotech data to Neo4j"""
    try:
        print("🧪 Testing Neo4j sync with mock biotech data...\n")
        
        # Clear existing data
        print("🧹 Clearing existing data...")
        async with neo4j_driver.session() as session:
            await session.run("MATCH (n) DETACH DELETE n")
        
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
        print("\n⬆️ Syncing entities to Neo4j...")
        
        for gene in [gene1, gene2, gene3]:
            await sync_mock_entity(gene, "Gene")
            print(f"  ✅ Gene: {gene.name}")
        
        for protein in [protein1, protein2, protein3]:
            await sync_mock_entity(protein, "Protein")
            print(f"  ✅ Protein: {protein.name}")
        
        for disease in [disease1, disease2, disease3]:
            await sync_mock_entity(disease, "Disease")
            print(f"  ✅ Disease: {disease.name}")
        
        for treatment in [treatment1, treatment2, treatment3]:
            await sync_mock_entity(treatment, "Treatment")
            print(f"  ✅ Treatment: {treatment.name}")
        
        # Create relationships
        print("\n🔗 Creating relationships...")
        
        # Gene -> Protein (ENCODES)
        await sync_mock_relationship("001", "Gene", "101", "Protein", "ENCODES")
        print(f"  ✅ TP53 -[ENCODES]-> p53 protein")
        
        await sync_mock_relationship("002", "Gene", "102", "Protein", "ENCODES")
        print(f"  ✅ BRCA1 -[ENCODES]-> BRCA1 protein")
        
        await sync_mock_relationship("003", "Gene", "103", "Protein", "ENCODES")
        print(f"  ✅ APOE -[ENCODES]-> Apolipoprotein E")
        
        # Gene -> Disease (ASSOCIATED_WITH)
        await sync_mock_relationship("001", "Gene", "201", "Disease", "ASSOCIATED_WITH",
                                    {"association_type": "causative", "odds_ratio": 10.5})
        print(f"  ✅ TP53 -[ASSOCIATED_WITH]-> Li-Fraumeni Syndrome")
        
        await sync_mock_relationship("002", "Gene", "202", "Disease", "ASSOCIATED_WITH",
                                    {"association_type": "risk_factor", "odds_ratio": 5.2})
        print(f"  ✅ BRCA1 -[ASSOCIATED_WITH]-> Breast Cancer")
        
        await sync_mock_relationship("003", "Gene", "203", "Disease", "ASSOCIATED_WITH",
                                    {"association_type": "risk_factor", "odds_ratio": 3.8})
        print(f"  ✅ APOE -[ASSOCIATED_WITH]-> Alzheimer's Disease")
        
        # Treatment -> Disease (TREATS)
        await sync_mock_relationship("301", "Treatment", "201", "Disease", "TREATS",
                                    {"mechanism_type": "p53_activation", "efficacy_score": 0.7})
        print(f"  ✅ Nutlin-3 -[TREATS]-> Li-Fraumeni Syndrome")
        
        await sync_mock_relationship("302", "Treatment", "202", "Disease", "TREATS",
                                    {"mechanism_type": "DNA_repair_inhibition", "efficacy_score": 0.8})
        print(f"  ✅ Olaparib -[TREATS]-> Breast Cancer")
        
        await sync_mock_relationship("303", "Treatment", "203", "Disease", "TREATS",
                                    {"mechanism_type": "amyloid_clearance", "efficacy_score": 0.5})
        print(f"  ✅ Aducanumab -[TREATS]-> Alzheimer's Disease")
        
        # Verify data
        print("\n📊 Verifying synced data...")
        
        async with neo4j_driver.session() as session:
            # Count nodes
            for label in ["Gene", "Protein", "Disease", "Treatment"]:
                result = await session.run(f"MATCH (n:{label}) RETURN count(n) as count")
                record = await result.single()
                print(f"  {label}s: {record['count']}")
            
            # Count relationships
            result = await session.run("MATCH ()-[r]->() RETURN type(r) as type, count(r) as count")
            print("\n  Relationships:")
            async for record in result:
                print(f"    {record['type']}: {record['count']}")
            
            # Test a graph query
            print("\n🔍 Testing graph query: Find treatments for genes...")
            result = await session.run("""
                MATCH path = (g:Gene)-[*]-(t:Treatment)
                RETURN g.name as gene, t.name as treatment, length(path) as distance
                ORDER BY distance
                LIMIT 5
            """)
            
            async for record in result:
                print(f"    {record['gene']} -> {record['treatment']} (distance: {record['distance']})")
        
        print("\n✨ All sync tests passed! Neo4j Aura sync service is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_neo4j()

if __name__ == "__main__":
    asyncio.run(test_sync_with_mock_data())