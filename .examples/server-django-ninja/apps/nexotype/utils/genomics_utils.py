from typing import Dict, Any, List, Tuple
import re
from collections import Counter

# Amino acid molecular weights
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

def calculate_peptide_properties(sequence: str) -> Dict[str, Any]:
    """
    Calculate various properties of a peptide sequence
    
    Args:
        sequence: The amino acid sequence of the peptide
        
    Returns:
        Dictionary with calculated properties
    """
    # Validate sequence
    sequence = sequence.upper()
    if not all(aa in AA_WEIGHTS for aa in sequence):
        invalid_aa = [aa for aa in sequence if aa not in AA_WEIGHTS]
        raise ValueError(f"Invalid amino acids in sequence: {', '.join(invalid_aa)}")
    
    # Calculate molecular weight
    mw = 18.02  # Add water molecule (peptide bond formation loses water)
    for aa in sequence:
        mw += AA_WEIGHTS[aa]
    
    # Calculate length
    length = len(sequence)
    
    # Calculate amino acid composition
    composition = Counter(sequence)
    
    # Calculate isoelectric point (simplified algorithm)
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
    Calculate the isoelectric point of a peptide
    
    Args:
        sequence: The amino acid sequence
        precision: The precision of the calculation
        
    Returns:
        The isoelectric point (pI)
    """
    # Count the number of ionizable groups
    n_term = 1
    c_term = 1
    aa_count = Counter(sequence)
    
    # Function to calculate net charge at a given pH
    def calculate_charge(ph: float) -> float:
        charge = 0.0
        
        # N-terminus
        charge += n_term * (10 ** (PKA_VALUES['N-term'] - ph)) / (1 + 10 ** (PKA_VALUES['N-term'] - ph))
        
        # C-terminus
        charge -= c_term * (1 / (1 + 10 ** (ph - PKA_VALUES['C-term'])))
        
        # Ionizable side chains
        for aa, count in aa_count.items():
            if aa in PKA_VALUES:
                if aa in ['D', 'E', 'C', 'Y']:  # Acidic
                    charge -= count * (1 / (1 + 10 ** (ph - PKA_VALUES[aa])))
                elif aa in ['K', 'R', 'H']:  # Basic
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
        Average hydrophobicity
    """
    # Kyte-Doolittle hydrophobicity scale
    kd_scale = {
        'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5,
        'C': 2.5, 'Q': -3.5, 'E': -3.5, 'G': -0.4,
        'H': -3.2, 'I': 4.5, 'L': 3.8, 'K': -3.9,
        'M': 1.9, 'F': 2.8, 'P': -1.6, 'S': -0.8,
        'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
    }
    
    total = sum(kd_scale[aa] for aa in sequence)
    return round(total / len(sequence), 2)

def find_protein_domains(sequence: str) -> List[Dict[str, Any]]:
    """
    Identify potential protein domains in a sequence
    This is a simplified version and would need to be expanded with real domain data
    
    Args:
        sequence: The protein sequence
        
    Returns:
        List of potential domains
    """
    # This is a placeholder - real implementation would use domain databases
    domains = []
    
    # Example simple motifs
    motifs = {
        'Nuclear Localization Signal': r'[KR]{3,}',
        'SH3 binding domain': r'PxxP',
        'Kinase phosphorylation site': r'[ST]P',
        'Zinc finger motif': r'C.{2,4}C.{12}H.{3,5}H'
    }
    
    for name, pattern in motifs.items():
        for match in re.finditer(pattern, sequence):
            domains.append({
                'name': name,
                'start': match.start(),
                'end': match.end(),
                'sequence': match.group()
            })
    
    return domains

def calculate_peptide_similarity(seq1: str, seq2: str) -> float:
    """
    Calculate similarity between two peptide sequences
    
    Args:
        seq1: First peptide sequence
        seq2: Second peptide sequence
        
    Returns:
        Similarity score between 0 and 1
    """
    # Use Needleman-Wunsch algorithm for sequence alignment
    # This is a simplified version
    
    # Create substitution matrix based on BLOSUM62
    blosum62 = {
        ('A', 'A'): 4, ('A', 'R'): -1, ('A', 'N'): -2, ('A', 'D'): -2,
        ('A', 'C'): 0, ('A', 'Q'): -1, ('A', 'E'): -1, ('A', 'G'): 0,
        ('A', 'H'): -2, ('A', 'I'): -1, ('A', 'L'): -1, ('A', 'K'): -1,
        ('A', 'M'): -1, ('A', 'F'): -2, ('A', 'P'): -1, ('A', 'S'): 1,
        ('A', 'T'): 0, ('A', 'W'): -3, ('A', 'Y'): -2, ('A', 'V'): 0,
        
        # Add remaining pairs...
    }
    
    # For simplicity, let's use a basic identity score
    matching_positions = sum(1 for a, b in zip(seq1, seq2) if a == b)
    max_length = max(len(seq1), len(seq2))
    
    return round(matching_positions / max_length, 2)

def predict_peptide_activities(sequence: str) -> List[str]:
    """
    Predict potential biological activities of a peptide
    This is a simplified model - real implementation would use ML models
    
    Args:
        sequence: The peptide sequence
        
    Returns:
        List of predicted activities
    """
    activities = []
    
    # Simple rules for demonstration
    if 'KK' in sequence or 'RR' in sequence:
        activities.append('Antimicrobial')
    
    if sequence.count('W') >= 2 or sequence.count('F') >= 2:
        activities.append('Cell penetrating')
    
    if 'CYC' in sequence or len(set(sequence)) < len(sequence) * 0.5:
        activities.append('Stable')
    
    if len(sequence) < 10 and 'P' in sequence:
        activities.append('Enzyme inhibitor')
    
    # In a real system, this would use machine learning models trained on known bioactive peptides
    
    return activities

def estimate_synthesis_difficulty(sequence: str) -> int:
    """
    Estimate the difficulty of synthesizing a peptide
    
    Args:
        sequence: The peptide sequence
        
    Returns:
        Difficulty score (1-10)
    """
    difficulty = 0
    
    # Length factor
    if len(sequence) <= 5:
        difficulty += 1
    elif len(sequence) <= 15:
        difficulty += 3
    elif len(sequence) <= 30:
        difficulty += 6
    else:
        difficulty += 8
    
    # Composition factor
    if 'C' in sequence:  # Cysteine can form disulfide bridges
        difficulty += 2
    
    if sequence.count('W') > 1:  # Tryptophan is difficult to couple
        difficulty += 1
    
    if 'DP' in sequence or 'PN' in sequence:  # Difficult couplings
        difficulty += 1
    
    # Cap at 10
    return min(difficulty, 10)