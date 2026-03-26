from django.db import models

class Gene(models.Model):
    """
    Represents a genomic region encoding a functional product.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    ensembl_id = models.CharField(max_length=100, db_index=True)
    chromosome = models.CharField(max_length=10)
    start_position = models.IntegerField()
    end_position = models.IntegerField()
    species = models.CharField(max_length=100, default="Homo sapiens")
    gene_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Protein(models.Model):
    """
    Represents a protein encoded by genes.
    """
    uid = models.CharField(max_length=100, unique=True)
    uniprot_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    sequence = models.TextField()
    molecular_weight = models.FloatField()
    isoelectric_point = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    genes = models.ManyToManyField(Gene, through='Encodes', related_name='proteins')

    def __str__(self):
        return self.name


class Encodes(models.Model):
    """
    Through table representing Gene -> Protein relationship.
    """
    gene = models.ForeignKey(Gene, on_delete=models.CASCADE)
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Peptide(models.Model):
    """
    Represents a peptide (short chain of amino acids).
    """
    uid = models.CharField(max_length=100, unique=True)
    sequence = models.CharField(max_length=1024, unique=True)
    length = models.IntegerField()
    molecular_weight = models.FloatField()
    isoelectric_point = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    predicted_activities = models.JSONField(default=list)
    synthesis_difficulty = models.IntegerField()
    stability_score = models.FloatField()

    proteins = models.ManyToManyField(Protein, through='Contains', related_name='peptides')

    def __str__(self):
        return self.sequence


class Contains(models.Model):
    """
    Through table: Protein CONTAINS Peptide.
    """
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE)
    peptide = models.ForeignKey(Peptide, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class BioActivity(models.Model):
    """
    Represents biological activity or function.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    activity_type = models.CharField(max_length=100)

    peptides = models.ManyToManyField(Peptide, through='HasActivity', related_name='activities')

    def __str__(self):
        return self.name


class HasActivity(models.Model):
    """
    Through table: Peptide HAS_ACTIVITY BioActivity.
    """
    peptide = models.ForeignKey(Peptide, on_delete=models.CASCADE)
    bio_activity = models.ForeignKey(BioActivity, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class ProteinDomain(models.Model):
    """
    Represents functional regions within proteins.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    pfam_id = models.CharField(max_length=100, db_index=True)

    proteins = models.ManyToManyField(Protein, through='HasDomain', related_name='domains')

    def __str__(self):
        return self.name


class HasDomain(models.Model):
    """
    Through table: Protein HAS_DOMAIN ProteinDomain.
    """
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE)
    domain = models.ForeignKey(ProteinDomain, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Pathway(models.Model):
    """
    Represents biological processes and pathways.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    kegg_id = models.CharField(max_length=100, db_index=True)
    description = models.TextField()
    pathway_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    genes = models.ManyToManyField(Gene, through='GeneParticipatesIn', related_name='pathways')
    proteins = models.ManyToManyField(Protein, through='ProteinParticipatesIn', related_name='pathways')
    parent_pathways = models.ManyToManyField('self', symmetrical=False, through='IsPartOf', related_name='child_pathways')

    def __str__(self):
        return self.name


class GeneParticipatesIn(models.Model):
    """
    Through table: Gene PARTICIPATES_IN Pathway.
    """
    gene = models.ForeignKey(Gene, on_delete=models.CASCADE)
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class ProteinParticipatesIn(models.Model):
    """
    Through table: Protein PARTICIPATES_IN Pathway.
    """
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE)
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class IsPartOf(models.Model):
    """
    Through table: Pathway IS_PART_OF Pathway.
    """
    parent = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name='is_parent_of')
    child = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name='is_child_of')
    created_at = models.DateTimeField(auto_now_add=True)


class Disease(models.Model):
    """
    Represents a pathological condition.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    omim_id = models.CharField(max_length=100, db_index=True)
    description = models.TextField()
    disease_class = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    genes = models.ManyToManyField(Gene, through='AssociatedWith', related_name='diseases')

    def __str__(self):
        return self.name


class AssociatedWith(models.Model):
    """
    Through table: Gene ASSOCIATED_WITH Disease.
    """
    gene = models.ForeignKey(Gene, on_delete=models.CASCADE)
    disease = models.ForeignKey(Disease, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Treatment(models.Model):
    """
    Represents a treatment or intervention.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    treatment_type = models.CharField(max_length=100)

    diseases = models.ManyToManyField(Disease, through='Treats', related_name='treatments')

    def __str__(self):
        return self.name


class Treats(models.Model):
    """
    Through table: Treatment TREATS Disease.
    """
    treatment = models.ForeignKey(Treatment, on_delete=models.CASCADE)
    disease = models.ForeignKey(Disease, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Biomarker(models.Model):
    """
    Represents a measurable indicator of a condition or disease.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    biomarker_type = models.CharField(max_length=100)

    diseases = models.ManyToManyField(Disease, through='Indicates', related_name='biomarkers')

    def __str__(self):
        return self.name


class Indicates(models.Model):
    """
    Through table: Biomarker INDICATES Disease.
    """
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE)
    disease = models.ForeignKey(Disease, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Variant(models.Model):
    """
    Represents a genetic variation.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    rs_id = models.CharField(max_length=100, db_index=True)
    chromosome = models.CharField(max_length=10)
    position = models.IntegerField()
    reference_allele = models.CharField(max_length=10)
    alternate_allele = models.CharField(max_length=10)

    gene = models.ForeignKey(Gene, on_delete=models.CASCADE, related_name='variants')
    phenotypes = models.ManyToManyField('Phenotype', through='Causes', related_name='variants')

    def __str__(self):
        return self.name


class Phenotype(models.Model):
    """
    Represents an observable characteristic or trait.
    """
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()

    def __str__(self):
        return self.name


class Causes(models.Model):
    """
    Through table: Variant CAUSES Phenotype.
    """
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE)
    phenotype = models.ForeignKey(Phenotype, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class InteractsWith(models.Model):
    """
    Self-referential many-to-many table for Protein INTERACTS_WITH Protein.
    """
    source_protein = models.ForeignKey(Protein, on_delete=models.CASCADE, related_name='interacts_out')
    target_protein = models.ForeignKey(Protein, on_delete=models.CASCADE, related_name='interacts_in')
    interaction_strength = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
