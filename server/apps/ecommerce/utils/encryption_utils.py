"""
Nudgio Utils — Credential Encryption

Fernet symmetric encryption (AES-128-CBC) for storing sensitive credentials
in the EcommerceConnection model: Shopify access tokens, WooCommerce API secrets,
and database passwords.

Key is derived from settings.SECRET_KEY via SHA-256.

Usage:
    - encrypt_password() — call before saving credentials to the database
    - decrypt_password() — call when reading credentials from the database for adapter use

Integration points:
    - ecommerce_connection_subrouter.py — encrypt on create/update, decrypt on test connection
    - adapters (shopify, woocommerce, magento) — decrypt before API/DB calls

Status: Not yet integrated — credentials currently saved as plain text.
"""

from cryptography.fernet import Fernet
from core.config import settings
import base64
import hashlib


def get_encryption_key() -> bytes:
    """Generate encryption key from secret key"""
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_password(password: str) -> str:
    """Encrypt database password for storage"""
    f = Fernet(get_encryption_key())
    encrypted = f.encrypt(password.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_password(encrypted_password: str) -> str:
    """Decrypt database password for use"""
    try:
        f = Fernet(get_encryption_key())
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_password.encode())
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception:
        # If decryption fails, assume password is not encrypted
        return encrypted_password