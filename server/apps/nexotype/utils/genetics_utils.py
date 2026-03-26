from typing import Dict, Any, List
import re
from collections import Counter

# ==========================================
# AMINO ACID DATA
# ==========================================

# Amino acid molecular weights (Da)
AA_WEIGHTS = {
    'A': 71.08, 'R': 156.19, 'N': 114.10, 'D': 115.09,
    'C': 103.15, 'Q': 128.13, 'E': 129.12, 'G': 57.05,
    'H': 137.14, 'I': 113.16, 'L': 113.16, 'K': 128.17,
    'M': 131.19, 'F': 147.18, 'P': 97.12, 'S': 87.08,
    'T': 101.11, 'W': 186.21, 'Y': 163.18, 'V': 99.13
}

# pKa values for amino acids
PKA_VALUES = {
    'C-term': 3.1, 'D': 3.9, 'E': 4.3, 'H': 6.0,
    'C': 8.3, 'Y': 10.1, 'K': 10.5, 'R': 12.5,
    'N-term': 8.0
}

# Kyte-Doolittle hydrophobicity scale
HYDROPHOBICITY_SCALE = {
    'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5,
    'C': 2.5, 'Q': -3.5, 'E': -3.5, 'G': -0.4,
    'H': -3.2, 'I': 4.5, 'L': 3.8, 'K': -3.9,
    'M': 1.9, 'F': 2.8, 'P': -1.6, 'S': -0.8,
    'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
}

# ==========================================
# PEPTIDE PROPERTY CALCULATIONS
# ==========================================

def calculate_peptide_properties(sequence: str) -> Dict[str, Any]:
    """
    Calculate various properties of a peptide sequence
    
    Args:
        sequence: The amino acid sequence of the peptide
        
    Returns:
        Dictionary with calculated properties including:
        - sequence: Original sequence
        - length: Number of amino acids
        - molecular_weight: Molecular weight in Da
        - isoelectric_point: Isoelectric point (pI)
        - composition: Amino acid composition
        - hydrophobicity: Average hydrophobicity
        
    Raises:
        ValueError: If sequence contains invalid amino acids
    """
    # Validate sequence
    sequence = sequence.upper().strip()
    if not sequence:
        raise ValueError("Sequence cannot be empty")
    
    if not all(aa in AA_WEIGHTS for aa in sequence):
        invalid_aa = [aa for aa in sequence if aa not in AA_WEIGHTS]
        raise ValueError(f"Invalid amino acids in sequence: {', '.join(invalid_aa)}")
    
    # Calculate molecular weight (subtract water molecules from peptide bonds)
    mw = 18.02  # Initial water molecule
    for aa in sequence:
        mw += AA_WEIGHTS[aa]
    
    # Subtract water for each peptide bond (n-1 bonds for n amino acids)
    mw -= 18.02 * (len(sequence) - 1)
    
    # Calculate length
    length = len(sequence)
    
    # Calculate amino acid composition
    composition = Counter(sequence)
    
    # Calculate isoelectric point
    pi = calculate_isoelectric_point(sequence)
    
    # Calculate hydrophobicity
    hydrophobicity = calculate_hydrophobicity(sequence)
    
    return {
        'sequence': sequence,
        'length': length,
        'molecular_weight': round(mw, 2),
        'isoelectric_point': pi,
        'composition': dict(composition),
        'hydrophobicity': hydrophobicity
    }

def calculate_isoelectric_point(sequence: str, precision: float = 0.01) -> float:
    """
    Calculate the isoelectric point of a peptide using Henderson-Hasselbalch equation
    
    Args:
        sequence: The amino acid sequence
        precision: The precision of the calculation (default: 0.01)
        
    Returns:
        The isoelectric point (pI)
    """
    # Count the number of ionizable groups
    n_term = 1
    c_term = 1
    aa_count = Counter(sequence)
    
    def calculate_charge(ph: float) -> float:
        """Calculate net charge at given pH"""
        charge = 0.0
        
        # N-terminus (positively charged at low pH)
        charge += n_term * (10 ** (PKA_VALUES['N-term'] - ph)) / (1 + 10 ** (PKA_VALUES['N-term'] - ph))
        
        # C-terminus (negatively charged at high pH)
        charge -= c_term * (1 / (1 + 10 ** (ph - PKA_VALUES['C-term'])))
        
        # Ionizable side chains
        for aa, count in aa_count.items():
            if aa in PKA_VALUES:
                if aa in ['D', 'E', 'C', 'Y']:  # Acidic residues
                    charge -= count * (1 / (1 + 10 ** (ph - PKA_VALUES[aa])))
                elif aa in ['K', 'R', 'H']:  # Basic residues
                    charge += count * (10 ** (PKA_VALUES[aa] - ph)) / (1 + 10 ** (PKA_VALUES[aa] - ph))
        
        return charge
    
    # Binary search to find pH where net charge is zero
    ph_min = 0.0
    ph_max = 14.0
    
    while ph_max - ph_min > precision:
        ph_mid = (ph_min + ph_max) / 2
        charge = calculate_charge(ph_mid)
        
        if charge > 0:
            ph_min = ph_mid
        else:
            ph_max = ph_mid
    
    return round((ph_min + ph_max) / 2, 2)

def calculate_hydrophobicity(sequence: str) -> float:
    """
    Calculate the hydrophobicity of a peptide using the Kyte-Doolittle scale
    
    Args:
        sequence: The amino acid sequence
        
    Returns:
        Average hydrophobicity score
    """
    if not sequence:
        return 0.0
    
    total = sum(HYDROPHOBICITY_SCALE.get(aa, 0.0) for aa in sequence.upper())
    return round(total / len(sequence), 2)

# ==========================================
# PROTEIN DOMAIN ANALYSIS
# ==========================================

def find_protein_domains(sequence: str) -> List[Dict[str, Any]]:
    """
    Identify potential protein domains and motifs in a sequence
    This uses simple pattern matching - real implementation would use domain databases like Pfam
    
    Args:
        sequence: The protein sequence
        
    Returns:
        List of potential domains with their positions and descriptions
    """
    domains = []
    sequence = sequence.upper()
    
    # Common protein motifs and domains
    motifs = {
        'Nuclear Localization Signal': r'[KR]{3,}',
        'SH3 binding domain': r'P..P',  # PxxP motif
        'Kinase phosphorylation site': r'[ST]P',
        'Zinc finger motif': r'C.{2,4}C.{12}H.{3,5}H',
        'Leucine zipper': r'L.{6}L.{6}L',
        'Helix-turn-helix': r'[RK].{15,20}[RK]',
        'Signal peptide': r'^M[AILV].{15,25}[GA]',
        'Transmembrane domain': r'[AILMFWYV]{15,25}',
        'Death domain': r'[FL].{50,100}[FL]',
        'EF-hand calcium binding': r'D.{12}[FHWY]'
    }
    
    for name, pattern in motifs.items():
        for match in re.finditer(pattern, sequence):
            domains.append({
                'name': name,
                'start': match.start() + 1,  # 1-based positioning
                'end': match.end(),
                'sequence': match.group(),
                'length': len(match.group())
            })
    
    return domains

# ==========================================
# SEQUENCE ANALYSIS
# ==========================================

def calculate_peptide_similarity(seq1: str, seq2: str) -> float:
    """
    Calculate similarity between two peptide sequences using identity percentage
    
    Args:
        seq1: First peptide sequence
        seq2: Second peptide sequence
        
    Returns:
        Similarity score between 0 and 1
    """
    seq1 = seq1.upper().strip()
    seq2 = seq2.upper().strip()
    
    if not seq1 or not seq2:
        return 0.0
    
    # Use simple identity percentage for sequences of different lengths
    min_length = min(len(seq1), len(seq2))
    max_length = max(len(seq1), len(seq2))
    
    # Count matching positions up to the shorter sequence length
    matching_positions = sum(1 for i in range(min_length) if seq1[i] == seq2[i])
    
    # Calculate similarity considering length differences
    similarity = matching_positions / max_length
    
    return round(similarity, 3)

def predict_peptide_activities(sequence: str) -> List[str]:
    """
    Predict potential biological activities of a peptide based on sequence patterns
    This uses simple heuristics - real implementation would use ML models
    
    Args:
        sequence: The peptide sequence
        
    Returns:
        List of predicted activities
    """
    activities = []
    sequence = sequence.upper()
    length = len(sequence)
    
    # Antimicrobial peptide characteristics
    if ('KK' in sequence or 'RR' in sequence or 
        sequence.count('K') + sequence.count('R') >= length * 0.3):
        activities.append('Antimicrobial')
    
    # Cell penetrating peptide characteristics
    if (sequence.count('W') >= 2 or sequence.count('F') >= 2 or 
        'TAT' in sequence or 'RRRR' in sequence):
        activities.append('Cell penetrating')
    
    # Cyclic or constrained peptides (stable)
    if ('CYC' in sequence or sequence.count('C') >= 2 or 
        len(set(sequence)) < len(sequence) * 0.6):
        activities.append('Stable/Cyclic')
    
    # Enzyme inhibitor characteristics
    if length <= 15 and ('P' in sequence or 'W' in sequence):
        activities.append('Potential enzyme inhibitor')
    
    # Antioxidant activity
    if ('HH' in sequence or 'YY' in sequence or 'WW' in sequence):
        activities.append('Antioxidant')
    
    # Hormone-like activity
    if length <= 50 and ('FF' in sequence or 'YY' in sequence):
        activities.append('Hormone-like')
    
    return activities

def estimate_synthesis_difficulty(sequence: str) -> Dict[str, Any]:
    """
    Estimate the difficulty and considerations for peptide synthesis
    
    Args:
        sequence: The peptide sequence
        
    Returns:
        Dictionary with difficulty score (1-10) and detailed analysis
    """
    sequence = sequence.upper()
    length = len(sequence)
    difficulty = 1
    considerations = []
    
    # Length factor
    if length <= 5:
        difficulty += 1
        considerations.append("Short peptide - standard synthesis")
    elif length <= 15:
        difficulty += 2
        considerations.append("Medium length - routine synthesis")
    elif length <= 30:
        difficulty += 4
        considerations.append("Long peptide - may require special conditions")
    elif length <= 50:
        difficulty += 6
        considerations.append("Very long peptide - consider fragment coupling")
    else:
        difficulty += 8
        considerations.append("Extremely long - recombinant expression recommended")
    
    # Problematic amino acids
    if 'C' in sequence:
        cys_count = sequence.count('C')
        difficulty += min(cys_count, 3)
        considerations.append(f"Contains {cys_count} cysteine(s) - disulfide bond formation needed")
    
    if sequence.count('W') > 1:
        difficulty += 1
        considerations.append("Multiple tryptophans - difficult coupling reactions")
    
    if sequence.count('M') > 0:
        difficulty += 1
        considerations.append("Contains methionine - oxidation sensitive")
    
    # Difficult coupling sequences
    difficult_couples = ['DP', 'PG', 'PN', 'PP', 'FP', 'WP']
    for couple in difficult_couples:
        if couple in sequence:
            difficulty += 1
            considerations.append(f"Contains {couple} - difficult coupling")
    
    # Aggregation-prone sequences
    if ('FF' in sequence or 'WW' in sequence or 'II' in sequence or
        sequence.count('F') + sequence.count('W') + sequence.count('I') >= length * 0.4):
        difficulty += 2
        considerations.append("Hydrophobic/aggregation-prone sequence")
    
    # Racemization-prone sequences
    if sequence.count('H') > 0 or sequence.count('C') > 0:
        difficulty += 1
        considerations.append("Contains racemization-prone residues")
    
    # Cap difficulty at 10
    final_difficulty = min(difficulty, 10)
    
    return {
        'difficulty_score': final_difficulty,
        'difficulty_level': _get_difficulty_level(final_difficulty),
        'considerations': considerations,
        'length': length,
        'estimated_yield': _estimate_yield(final_difficulty),
        'recommended_method': _recommend_synthesis_method(final_difficulty, length)
    }

def _get_difficulty_level(score: int) -> str:
    """Convert difficulty score to descriptive level"""
    if score <= 3:
        return "Easy"
    elif score <= 5:
        return "Moderate"
    elif score <= 7:
        return "Difficult"
    else:
        return "Very Difficult"

def _estimate_yield(difficulty: int) -> str:
    """Estimate synthesis yield based on difficulty"""
    if difficulty <= 3:
        return "80-95%"
    elif difficulty <= 5:
        return "60-80%"
    elif difficulty <= 7:
        return "40-60%"
    else:
        return "20-40%"

def _recommend_synthesis_method(difficulty: int, length: int) -> str:
    """Recommend synthesis method based on difficulty and length"""
    if length > 50:
        return "Recombinant expression"
    elif difficulty <= 5:
        return "Standard SPPS (Solid Phase Peptide Synthesis)"
    elif difficulty <= 7:
        return "SPPS with microwave assistance"
    else:
        return "Fragment coupling or recombinant expression"

# ==========================================
# GENOMIC COORDINATE UTILITIES
# ==========================================

def validate_genomic_coordinates(chromosome: str, start: int, end: int) -> bool:
    """
    Validate genomic coordinates
    
    Args:
        chromosome: Chromosome identifier (e.g., "1", "X", "MT")
        start: Start position
        end: End position
        
    Returns:
        True if coordinates are valid
    """
    # Valid human chromosomes
    valid_chromosomes = set(map(str, range(1, 23))) | {"X", "Y", "MT", "M"}
    
    if chromosome not in valid_chromosomes:
        return False
    
    if start < 1 or end < 1:
        return False
    
    if start > end:
        return False
    
    # Basic chromosome length validation (approximate)
    max_lengths = {
        "1": 249250621, "2": 243199373, "3": 198022430, "4": 191154276,
        "5": 180915260, "6": 171115067, "7": 159138663, "8": 146364022,
        "9": 141213431, "10": 135534747, "11": 135006516, "12": 133851895,
        "13": 115169878, "14": 107349540, "15": 102531392, "16": 90354753,
        "17": 81195210, "18": 78077248, "19": 59128983, "20": 63025520,
        "21": 48129895, "22": 51304566, "X": 155270560, "Y": 59373566,
        "MT": 16569, "M": 16569
    }
    
    max_length = max_lengths.get(chromosome, float('inf'))
    return end <= max_length

def calculate_gene_length(start: int, end: int) -> int:
    """
    Calculate gene length from coordinates
    
    Args:
        start: Start position
        end: End position
        
    Returns:
        Gene length in base pairs
    """
    return abs(end - start) + 1