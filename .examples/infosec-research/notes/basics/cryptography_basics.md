# Cryptography Fundamentals for Cybersecurity

## Hash Functions

### What is Hashing?
- **Purpose**: Create unique fixed-size fingerprints of data
- **One-way function**: Easy to compute hash, computationally infeasible to reverse
- **Deterministic**: Same input always produces same hash
- **Avalanche effect**: Small input change drastically changes output

### Common Hash Algorithms

#### MD5 (Message Digest 5)
```bash
# 128-bit hash (32 hex characters)
echo "hello" | md5sum
# Output: 5d41402abc4b2a76b9719d911017c592

# Security: BROKEN - Do not use for security
# Vulnerabilities: Collision attacks, rainbow tables
# Still used for: File integrity checks (non-security)
```

#### SHA-1 (Secure Hash Algorithm 1)
```bash
# 160-bit hash (40 hex characters)
echo "hello" | sha1sum
# Output: aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d

# Security: DEPRECATED - Collision attacks demonstrated
# Legacy use: Git commits, older certificates
```

#### SHA-256 (SHA-2 family)
```bash
# 256-bit hash (64 hex characters)
echo "hello" | sha256sum
# Output: 2cf24dba4f21d4288094e678c35259e732c8e7c9a98b0a05f1b3b4b2e5e8b2dd

# Security: Currently secure
# Use cases: Bitcoin, TLS certificates, password storage
```

#### SHA-3
```bash
# Latest standard (2015)
# Different construction from SHA-2
# More resistant to length extension attacks
```

#### NTLM (Windows)
```bash
# Windows password hashing
# MD4-based, weak against rainbow tables
# Hash format: 32 hex characters
# Example: 8846f7eaee8fb117ad06bdd830b7586c
```

### Password Hashing (Slow Hashes)

#### bcrypt
```python
import bcrypt

# Generate salt and hash password
password = "mypassword"
salt = bcrypt.gensalt(rounds=12)  # Cost factor
hashed = bcrypt.hashpw(password.encode(), salt)

# Verify password
is_valid = bcrypt.checkpw(password.encode(), hashed)
```

#### PBKDF2
```python
from hashlib import pbkdf2_hmac

# Password-Based Key Derivation Function 2
password = "mypassword"
salt = b"randomsalt"
iterations = 100000

hash = pbkdf2_hmac('sha256', password.encode(), salt, iterations)
```

#### Argon2
```bash
# Winner of password hashing competition
# Resistant to GPU/ASIC attacks
# Memory-hard function
# Three variants: Argon2d, Argon2i, Argon2id
```

### Hash Attack Methods

#### Rainbow Tables
- **Concept**: Precomputed hash-to-plaintext lookup tables
- **Defense**: Use salts (random data added to password)
- **Tools**: RainbowCrack, Ophcrack

#### Dictionary Attacks
- **Method**: Hash common passwords and compare
- **Tools**: Hashcat, John the Ripper
- **Defense**: Strong, unique passwords

#### Brute Force
- **Method**: Try all possible combinations
- **Time**: Exponentially increases with length/complexity
- **Defense**: Sufficient length and complexity

## Symmetric Encryption

### Advanced Encryption Standard (AES)
```python
from cryptography.fernet import Fernet

# AES-256 in practice (Fernet uses AES-128 in CBC mode)
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt
plaintext = b"Secret message"
ciphertext = cipher.encrypt(plaintext)

# Decrypt  
decrypted = cipher.decrypt(ciphertext)
```

### Block Ciphers vs Stream Ciphers
| Block Ciphers | Stream Ciphers |
|---------------|----------------|
| Fixed-size blocks (128-bit) | One bit/byte at a time |
| AES, DES, 3DES | RC4, ChaCha20 |
| Need padding | No padding needed |
| Multiple modes of operation | Simpler operation |

### AES Modes of Operation

#### ECB (Electronic Codebook) - INSECURE
```bash
# Same plaintext block = same ciphertext block
# Reveals patterns in data
# Never use for anything important
```

#### CBC (Cipher Block Chaining) - Common
```bash
# Each block depends on previous ciphertext block
# Requires Initialization Vector (IV)
# Padding required for last block
# Vulnerable to padding oracle attacks if not implemented correctly
```

#### GCM (Galois/Counter Mode) - Recommended
```bash
# Provides both encryption and authentication
# No padding required
# Parallel processing possible
# Authenticated encryption
```

### Key Sizes and Security
```bash
AES-128: 128-bit key (16 bytes) - Secure
AES-192: 192-bit key (24 bytes) - Secure  
AES-256: 256-bit key (32 bytes) - Secure

DES:     56-bit key (8 bytes)  - BROKEN
3DES:    112/168-bit key       - DEPRECATED
```

## Asymmetric Encryption (Public Key)

### RSA (Rivest-Shamir-Adleman)
```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

# Generate key pair
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048  # Minimum secure size
)
public_key = private_key.public_key()

# Encrypt with public key
message = b"Secret message"
ciphertext = public_key.encrypt(
    message,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Decrypt with private key
plaintext = private_key.decrypt(
    ciphertext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
```

### RSA Key Sizes
```bash
512-bit:  BROKEN (factored)
1024-bit: WEAK (avoid)
2048-bit: Secure (minimum recommended)
4096-bit: Very secure (slower)
```

### Elliptic Curve Cryptography (ECC)
```bash
# Smaller key sizes for equivalent security
# ECC-256 ≈ RSA-3072
# ECC-384 ≈ RSA-7680  
# Faster operations
# Used in: Bitcoin, modern TLS, mobile devices
```

## Digital Signatures

### RSA Signatures
```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

# Sign with private key
message = b"Document to sign"
signature = private_key.sign(
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)

# Verify with public key
try:
    public_key.verify(
        signature,
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    print("Signature valid")
except:
    print("Signature invalid")
```

### Digital Signature Process
1. **Hash** the document
2. **Encrypt** hash with private key (creates signature)
3. **Send** document + signature
4. **Decrypt** signature with public key  
5. **Compare** decrypted hash with document hash

## TLS/SSL Certificates

### Certificate Components
```bash
# X.509 certificate contains:
- Public key
- Identity information (Common Name, Organization)
- Digital signature from Certificate Authority (CA)
- Validity period
- Serial number
- Key usage extensions
```

### Certificate Chain
```bash
Root CA (Self-signed)
    ↓
Intermediate CA (Signed by Root)
    ↓  
End Entity Certificate (Signed by Intermediate)
```

### Certificate Formats
```bash
.pem  # Base64 encoded, human readable
.der  # Binary encoded
.p12  # PKCS#12, contains private key + certificate
.jks  # Java KeyStore
.crt  # Certificate only
.key  # Private key only
```

### OpenSSL Commands
```bash
# View certificate details
openssl x509 -in certificate.crt -text -noout

# Check certificate against private key
openssl x509 -noout -modulus -in certificate.crt | openssl md5
openssl rsa -noout -modulus -in private.key | openssl md5

# Connect and view server certificate
openssl s_client -connect example.com:443 -showcerts

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

## Key Management

### Key Generation Best Practices
```bash
# Use cryptographically secure random number generators
# Sufficient entropy during generation
# Appropriate key lengths for security requirements
# Regular key rotation
```

### Key Storage
```bash
# Hardware Security Modules (HSMs)
# Key management services (AWS KMS, Azure Key Vault)
# Secure key stores (password managers)
# Never hardcode keys in source code
# Use environment variables or config files with restricted access
```

### Key Exchange Protocols

#### Diffie-Hellman Key Exchange
```bash
# Allows two parties to establish shared secret over insecure channel
# Based on discrete logarithm problem
# Vulnerable to man-in-the-middle attacks without authentication
# Used in: TLS, IPSec, SSH
```

#### ECDH (Elliptic Curve Diffie-Hellman)
```bash
# More efficient version using elliptic curves
# Smaller key sizes for equivalent security
# Forward secrecy when ephemeral keys used
```

## Common Cryptographic Attacks

### Weak Random Number Generation
```bash
# Predictable seeds lead to predictable keys
# Use cryptographically secure PRNGs
# Examples: /dev/urandom on Unix, CryptGenRandom on Windows
```

### Timing Attacks
```bash
# Attack based on time differences in cryptographic operations
# Defense: Constant-time implementations
# Example: String comparison should take same time regardless of input
```

### Side-Channel Attacks
```bash
# Power analysis, electromagnetic analysis
# Fault injection attacks
# Defense: Hardware countermeasures, secure implementations
```

### Padding Oracle Attacks
```bash
# Attack on CBC mode padding validation
# Can decrypt ciphertext without knowing key
# Defense: Use authenticated encryption (GCM mode)
```

## Practical Cryptography Guidelines

### DO:
- Use well-tested, standard libraries
- Use authenticated encryption when possible
- Generate keys with proper entropy
- Implement proper key rotation
- Use appropriate key sizes for current threat models
- Validate all cryptographic inputs

### DON'T:
- Implement your own cryptographic algorithms
- Use deprecated algorithms (MD5, SHA-1, DES)
- Reuse keys across different purposes
- Store keys in plaintext
- Use ECB mode for block ciphers
- Ignore certificate validation errors

### Password Storage Best Practices
```python
# GOOD: Use slow hash functions
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))

# BAD: Fast hash functions
import hashlib
bad_hash = hashlib.sha256(password.encode()).hexdigest()  # Too fast!
```

### Random Number Generation
```python
# GOOD: Cryptographically secure
import secrets
secure_random = secrets.token_bytes(32)

# BAD: Predictable
import random
bad_random = random.randint(1, 1000000)  # Not cryptographically secure!
```

This cryptography foundation will help you understand how security tools work and why certain attacks are possible against weak cryptographic implementations.