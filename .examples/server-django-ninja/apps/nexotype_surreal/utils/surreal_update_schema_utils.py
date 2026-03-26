import asyncio # Added import
from .surreal_connection_utils import get_surreal_connection


async def update_schema(): # Added async
    """
    Update the SurrealDB schema with explicit definitions for genomic data models.
    """
    db = await get_surreal_connection() # Added await
    print("Updating schema in SurrealDB...")

    # Schema definitions for tables, fields, and relations
    schema_definitions = [
        # Gene table
        """
        DEFINE TABLE gene SCHEMAFULL;
        DEFINE FIELD uid ON gene TYPE string;
        DEFINE FIELD name ON gene TYPE string;
        DEFINE FIELD ensembl_id ON gene TYPE string;
        DEFINE FIELD chromosome ON gene TYPE string;
        DEFINE FIELD start_position ON gene TYPE int;
        DEFINE FIELD end_position ON gene TYPE int;
        DEFINE FIELD species ON gene TYPE string DEFAULT "Homo sapiens";
        DEFINE FIELD gene_type ON gene TYPE string;
        DEFINE FIELD created_at ON gene TYPE datetime DEFAULT time::now();
        """,
        
        # Protein table
        """
        DEFINE TABLE protein SCHEMAFULL;
        DEFINE FIELD uid ON protein TYPE string;
        DEFINE FIELD uniprot_id ON protein TYPE string;
        DEFINE FIELD name ON protein TYPE string;
        DEFINE FIELD sequence ON protein TYPE string;
        DEFINE FIELD molecular_weight ON protein TYPE float;
        DEFINE FIELD isoelectric_point ON protein TYPE float;
        DEFINE FIELD created_at ON protein TYPE datetime DEFAULT time::now();
        """,
        
        # Peptide table
        """
        DEFINE TABLE peptide SCHEMAFULL;
        DEFINE FIELD uid ON peptide TYPE string;
        DEFINE FIELD sequence ON peptide TYPE string;
        DEFINE FIELD length ON peptide TYPE int;
        DEFINE FIELD molecular_weight ON peptide TYPE float;
        DEFINE FIELD isoelectric_point ON peptide TYPE float;
        DEFINE FIELD created_at ON peptide TYPE datetime DEFAULT time::now();
        DEFINE FIELD predicted_activities ON peptide TYPE array;
        DEFINE FIELD synthesis_difficulty ON peptide TYPE int;
        DEFINE FIELD stability_score ON peptide TYPE float;
        """,
        
        # Pathway table
        """
        DEFINE TABLE pathway SCHEMAFULL;
        DEFINE FIELD uid ON pathway TYPE string;
        DEFINE FIELD name ON pathway TYPE string;
        DEFINE FIELD kegg_id ON pathway TYPE string;
        DEFINE FIELD description ON pathway TYPE string;
        DEFINE FIELD pathway_type ON pathway TYPE string;
        DEFINE FIELD created_at ON pathway TYPE datetime DEFAULT time::now();
        """,
        
        # Disease table
        """
        DEFINE TABLE disease SCHEMAFULL;
        DEFINE FIELD uid ON disease TYPE string;
        DEFINE FIELD name ON disease TYPE string;
        DEFINE FIELD omim_id ON disease TYPE string;
        DEFINE FIELD description ON disease TYPE string;
        DEFINE FIELD disease_class ON disease TYPE string;
        DEFINE FIELD created_at ON disease TYPE datetime DEFAULT time::now();
        """,
        
        # BioActivity table
        """
        DEFINE TABLE bio_activity SCHEMAFULL;
        DEFINE FIELD uid ON bio_activity TYPE string;
        DEFINE FIELD name ON bio_activity TYPE string;
        DEFINE FIELD description ON bio_activity TYPE string;
        DEFINE FIELD activity_type ON bio_activity TYPE string;
        """,
        
        # ProteinDomain table
        """
        DEFINE TABLE protein_domain SCHEMAFULL;
        DEFINE FIELD uid ON protein_domain TYPE string;
        DEFINE FIELD name ON protein_domain TYPE string;
        DEFINE FIELD description ON protein_domain TYPE string;
        DEFINE FIELD pfam_id ON protein_domain TYPE string;
        """,
        
        # Variant table
        """
        DEFINE TABLE variant SCHEMAFULL;
        DEFINE FIELD uid ON variant TYPE string;
        DEFINE FIELD name ON variant TYPE string;
        DEFINE FIELD rs_id ON variant TYPE string;
        DEFINE FIELD chromosome ON variant TYPE string;
        DEFINE FIELD position ON variant TYPE int;
        DEFINE FIELD reference_allele ON variant TYPE string;
        DEFINE FIELD alternate_allele ON variant TYPE string;
        """,
        
        # Phenotype table
        """
        DEFINE TABLE phenotype SCHEMAFULL;
        DEFINE FIELD uid ON phenotype TYPE string;
        DEFINE FIELD name ON phenotype TYPE string;
        DEFINE FIELD description ON phenotype TYPE string;
        """,
        
        # Treatment table
        """
        DEFINE TABLE treatment SCHEMAFULL;
        DEFINE FIELD uid ON treatment TYPE string;
        DEFINE FIELD name ON treatment TYPE string;
        DEFINE FIELD description ON treatment TYPE string;
        DEFINE FIELD treatment_type ON treatment TYPE string;
        """,
        
        # Biomarker table
        """
        DEFINE TABLE biomarker SCHEMAFULL;
        DEFINE FIELD uid ON biomarker TYPE string;
        DEFINE FIELD name ON biomarker TYPE string;
        DEFINE FIELD description ON biomarker TYPE string;
        DEFINE FIELD biomarker_type ON biomarker TYPE string;
        """,
        
        # Indexes
        """
        DEFINE INDEX gene_name_idx ON gene FIELDS name UNIQUE;
        DEFINE INDEX gene_ensembl_idx ON gene FIELDS ensembl_id;
        
        DEFINE INDEX protein_uniprot_idx ON protein FIELDS uniprot_id UNIQUE;
        DEFINE INDEX protein_name_idx ON protein FIELDS name;
        
        DEFINE INDEX peptide_sequence_idx ON peptide FIELDS sequence UNIQUE;
        
        DEFINE INDEX pathway_name_idx ON pathway FIELDS name UNIQUE;
        DEFINE INDEX pathway_kegg_idx ON pathway FIELDS kegg_id;
        
        DEFINE INDEX disease_name_idx ON disease FIELDS name UNIQUE;
        DEFINE INDEX disease_omim_idx ON disease FIELDS omim_id;
        
        DEFINE INDEX bio_activity_name_idx ON bio_activity FIELDS name UNIQUE;
        
        DEFINE INDEX protein_domain_name_idx ON protein_domain FIELDS name UNIQUE;
        DEFINE INDEX protein_domain_pfam_idx ON protein_domain FIELDS pfam_id;
        
        DEFINE INDEX variant_rs_idx ON variant FIELDS rs_id;
        
        DEFINE INDEX phenotype_name_idx ON phenotype FIELDS name UNIQUE;
        
        DEFINE INDEX treatment_name_idx ON treatment FIELDS name UNIQUE;
        
        DEFINE INDEX biomarker_name_idx ON biomarker FIELDS name UNIQUE;
        """,
        
        # Relations
        """
        DEFINE TABLE encodes TYPE RELATION
            IN gene
            OUT protein;
        DEFINE FIELD created_at ON encodes TYPE datetime DEFAULT time::now();

        # Split 'participates_in' into two relations
        DEFINE TABLE gene_participates_in TYPE RELATION
            IN gene
            OUT pathway;
        DEFINE FIELD created_at ON gene_participates_in TYPE datetime DEFAULT time::now();

        DEFINE TABLE protein_participates_in TYPE RELATION
            IN protein
            OUT pathway;
        DEFINE FIELD created_at ON protein_participates_in TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE associated_with TYPE RELATION
            IN gene
            OUT disease;
        DEFINE FIELD created_at ON associated_with TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE variant_of TYPE RELATION
            IN variant
            OUT gene;
        DEFINE FIELD created_at ON variant_of TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE interacts_with TYPE RELATION
            IN protein
            OUT protein;
        DEFINE FIELD created_at ON interacts_with TYPE datetime DEFAULT time::now();
        DEFINE FIELD interaction_strength ON interacts_with TYPE float;
        
        DEFINE TABLE has_domain TYPE RELATION
            IN protein
            OUT protein_domain;
        DEFINE FIELD created_at ON has_domain TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE contains TYPE RELATION
            IN protein
            OUT peptide;
        DEFINE FIELD created_at ON contains TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE has_activity TYPE RELATION
            IN peptide
            OUT bio_activity;
        DEFINE FIELD created_at ON has_activity TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE similar_to TYPE RELATION
            IN peptide
            OUT peptide;
        DEFINE FIELD similarity_score ON similar_to TYPE float;
        DEFINE FIELD created_at ON similar_to TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE is_part_of TYPE RELATION
            IN pathway
            OUT pathway;
        DEFINE FIELD created_at ON is_part_of TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE causes TYPE RELATION
            IN variant
            OUT phenotype;
        DEFINE FIELD created_at ON causes TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE treats TYPE RELATION
            IN treatment
            OUT disease;
        DEFINE FIELD created_at ON treats TYPE datetime DEFAULT time::now();
        
        DEFINE TABLE indicates TYPE RELATION
            IN biomarker
            OUT disease;
        DEFINE FIELD created_at ON indicates TYPE datetime DEFAULT time::now();
        """
    ]
    
    # Execute each schema definition
    for definition in schema_definitions:
        try:
            # Strip whitespace and split into individual statements
            statements = [stmt.strip() for stmt in definition.strip().split(';') if stmt.strip()]
            
            for stmt in statements:
                result = await db.query(stmt + ';') # Added await
                print(f"Successfully executed: {stmt[:60]}..." if len(stmt) > 60 else f"Successfully executed: {stmt}")
        except Exception as e:
            first_line = definition.strip().split('\n')[0]
            print(f"Error executing: {first_line}")
            print(f"Error message: {str(e)}")
    
    print("Schema update completed.")


if __name__ == "__main__":
    asyncio.run(update_schema()) # Use asyncio.run
