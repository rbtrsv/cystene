import bcrypt
import re

# ==========================================
# Password Hashing & Verification
# ==========================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Convert bytes back to string for storage
    return hashed.decode('utf-8')


def compare_passwords(plain_password: str, hashed_password: str) -> bool:
    """
    Compare a plain text password with a hashed password
    
    Args:
        plain_password: Plain text password to check
        hashed_password: Hashed password from database
        
    Returns:
        True if the passwords match, False otherwise
    """
    # Convert passwords to bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    
    # Compare password with hash
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ==========================================
# Password Validation
# ==========================================

def is_strong_password(password: str) -> bool:
    """
    Validates password strength
    
    A strong password must:
    - Be at least 8 characters long
    - Contain at least one uppercase letter
    - Contain at least one lowercase letter
    - Contain at least one number
    
    Args:
        password: The password to validate
        
    Returns:
        True if the password is strong, False otherwise
    """
    # Check length
    if len(password) < 8:
        return False
    
    # Check for uppercase letter
    if not re.search(r'[A-Z]', password):
        return False
    
    # Check for lowercase letter
    if not re.search(r'[a-z]', password):
        return False
    
    # Check for number
    if not re.search(r'[0-9]', password):
        return False
    
    # All checks passed
    return True