"""
Cybersecurity Utils — Credential Encryption

Fernet symmetric encryption (AES-128-CBC) for storing sensitive credentials
in the Credential model: SSH keys, cloud API keys, domain passwords.

Key is derived from settings.SECRET_KEY via SHA-256.

Same pattern as ecommerce/utils/encryption_utils.py.

Usage:
    - encrypt_value() — call before saving Credential.encrypted_value to database
    - decrypt_value() — call when reading credentials for scanner use at scan time

Integration points:
    - credential_subrouter.py — encrypt on create/update
    - scan_job_subrouter.py — decrypt before passing to internal scanners (host_audit, cloud_audit, ad_audit)
"""

from cryptography.fernet import Fernet
from core.config import settings
import base64
import hashlib


def get_encryption_key() -> bytes:
    """Generate encryption key from secret key via SHA-256."""
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a credential value for database storage.

    Args:
        plaintext: The raw secret (SSH key, API key, password)

    Returns:
        Base64-encoded encrypted string safe for Text column storage
    """
    f = Fernet(get_encryption_key())
    encrypted = f.encrypt(plaintext.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_value(encrypted_value: str) -> str:
    """
    Decrypt a credential value for scanner use.

    Args:
        encrypted_value: Base64-encoded encrypted string from database

    Returns:
        The original plaintext secret

    Note:
        If decryption fails (e.g., value was stored before encryption was enabled),
        returns the input unchanged. This allows graceful migration from plaintext.
    """
    try:
        f = Fernet(get_encryption_key())
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_value.encode())
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception:
        # If decryption fails, assume value is not encrypted (migration grace)
        return encrypted_value
