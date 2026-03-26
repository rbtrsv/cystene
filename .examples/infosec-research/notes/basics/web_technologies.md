# Web Technologies Fundamentals

## HTTP Protocol Basics

### HTTP Request Structure
```http
GET /path/to/resource HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html,application/xhtml+xml
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate
Connection: keep-alive
Cookie: sessionid=abc123; user_pref=dark_mode

[Optional Request Body for POST/PUT]
```

### HTTP Response Structure
```http
HTTP/1.1 200 OK
Date: Wed, 21 Oct 2023 07:28:00 GMT
Server: Apache/2.4.41
Content-Type: text/html; charset=UTF-8
Content-Length: 1234
Set-Cookie: sessionid=xyz789; HttpOnly; Secure
Cache-Control: no-cache
X-Frame-Options: DENY

<!DOCTYPE html>
<html>
<head><title>Example</title></head>
<body>Content here</body>
</html>
```

### HTTP Methods
| Method | Purpose | Idempotent | Safe | Body |
|--------|---------|------------|------|------|
| GET | Retrieve data | Yes | Yes | No |
| POST | Submit data | No | No | Yes |
| PUT | Update/replace resource | Yes | No | Yes |
| PATCH | Partial update | No | No | Yes |
| DELETE | Remove resource | Yes | No | No |
| HEAD | Get headers only | Yes | Yes | No |
| OPTIONS | Get allowed methods | Yes | Yes | No |

### HTTP Status Codes
```bash
# 1xx Informational
100 Continue
101 Switching Protocols

# 2xx Success  
200 OK
201 Created
204 No Content

# 3xx Redirection
301 Moved Permanently  
302 Found (Temporary Redirect)
304 Not Modified

# 4xx Client Error
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
405 Method Not Allowed
429 Too Many Requests

# 5xx Server Error
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

## Web Application Architecture

### Three-Tier Architecture
```
┌─────────────────┐
│  Presentation   │  ← Web Browser (HTML/CSS/JS)
│     Layer       │
└─────────────────┘
         ↓
┌─────────────────┐
│   Application   │  ← Web Server (PHP/Python/Java/Node.js)
│     Layer       │
└─────────────────┘
         ↓
┌─────────────────┐
│     Data        │  ← Database (MySQL/PostgreSQL/MongoDB)
│     Layer       │
└─────────────────┘
```

### Modern Web Application Components

#### Frontend (Client-Side)
```javascript
// JavaScript frameworks/libraries
React.js        // Component-based UI library
Angular         // Full framework by Google  
Vue.js          // Progressive framework
jQuery          // DOM manipulation library

// Security considerations:
// - XSS vulnerabilities in dynamic content
// - Client-side validation bypassing
// - Sensitive data exposure in source
// - CSRF token handling
```

#### Backend (Server-Side)
```python
# Common server-side technologies
Python:   Flask, Django, FastAPI
Node.js:  Express, Koa, NestJS  
PHP:      Laravel, Symfony, CodeIgniter
Java:     Spring Boot, Struts
C#:       ASP.NET Core
Ruby:     Ruby on Rails, Sinatra

# Security considerations:
# - Input validation and sanitization
# - Authentication and authorization
# - Session management
# - Database security
```

#### Databases
```sql
-- Relational databases
MySQL, PostgreSQL, SQLite, Oracle, SQL Server

-- NoSQL databases  
MongoDB, Redis, Cassandra, DynamoDB

-- Security considerations:
-- SQL injection vulnerabilities
-- NoSQL injection attacks
-- Database access controls
-- Encryption at rest and in transit
```

## Cookies and Session Management

### Cookie Attributes
```http
Set-Cookie: sessionid=abc123; 
    Domain=example.com; 
    Path=/; 
    Expires=Wed, 21 Oct 2023 07:28:00 GMT;
    Max-Age=3600;
    HttpOnly;        # Prevents JavaScript access
    Secure;          # HTTPS only
    SameSite=Strict  # CSRF protection
```

### Session Management Types
```bash
# Server-side sessions
- Session ID stored in cookie
- Session data stored on server
- More secure but requires server storage

# Client-side sessions (JWT tokens)
- All data encoded in token
- Stateless server operation  
- Vulnerable if token compromised
```

### Session Security Issues
```bash
# Session fixation
- Attacker sets user's session ID
- User authenticates with known ID
- Attacker hijacks authenticated session

# Session hijacking  
- Steal session cookie via XSS or network sniffing
- Use stolen cookie to impersonate user

# Session replay
- Reuse captured session data
- Exploit lack of proper session timeout
```

## Authentication Methods

### Basic Authentication
```http
# Base64 encoded username:password
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=

# Security issues:
# - Credentials sent with every request
# - Base64 is encoding, not encryption
# - Vulnerable without HTTPS
```

### Bearer Token Authentication
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (JSON Web Token) structure:
# Header.Payload.Signature
# - Contains user claims
# - Can be stateless
# - Vulnerable if secret compromised
```

### OAuth 2.0 Flow
```bash
1. Client redirects user to authorization server
2. User authenticates and grants permission
3. Authorization server redirects back with code
4. Client exchanges code for access token  
5. Client uses token to access protected resources
```

## Web Security Headers

### Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; 
    script-src 'self' https://trusted-cdn.com; 
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;

# Purpose: Prevent XSS by controlling resource loading
# Directives: script-src, style-src, img-src, object-src
```

### Security Headers Reference
```http
# Prevent clickjacking
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN

# XSS protection (legacy browsers)
X-XSS-Protection: 1; mode=block

# MIME type sniffing prevention
X-Content-Type-Options: nosniff

# HTTPS enforcement
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Referrer policy
Referrer-Policy: strict-origin-when-cross-origin

# Feature policy (newer: Permissions-Policy)
Feature-Policy: camera 'none'; microphone 'none'
```

## Common Web Vulnerabilities

### Cross-Site Scripting (XSS)

#### Reflected XSS
```javascript
// Vulnerable code
echo "<p>Welcome " . $_GET['name'] . "</p>";

// Attack URL
http://site.com/welcome.php?name=<script>alert('XSS')</script>

// Secure code
echo "<p>Welcome " . htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8') . "</p>";
```

#### Stored XSS
```javascript
// Vulnerable: Stored comment without sanitization
// Attack: Submit comment with <script>steal_cookies()</script>
// Impact: Every user viewing comments gets payload executed

// Defense: Input validation and output encoding
```

#### DOM-based XSS
```javascript
// Vulnerable JavaScript
document.getElementById('welcome').innerHTML = 
    "Welcome " + document.location.hash.substring(1);

// Attack URL
http://site.com/page.html#<script>alert('XSS')</script>

// Secure version
document.getElementById('welcome').textContent = 
    "Welcome " + document.location.hash.substring(1);
```

### SQL Injection

#### Basic SQL Injection
```sql
-- Vulnerable query
SELECT * FROM users WHERE username = '$username' AND password = '$password'

-- Attack input
Username: admin'--
Password: anything

-- Resulting query
SELECT * FROM users WHERE username = 'admin'--' AND password = 'anything'
```

#### Union-based SQL Injection
```sql
-- Vulnerable
SELECT name, description FROM products WHERE id = $id

-- Attack
1 UNION SELECT username, password FROM users--

-- Result: Extracts user credentials
```

#### Blind SQL Injection
```sql
-- Boolean-based blind injection
1 AND (SELECT SUBSTRING(username,1,1) FROM users WHERE id=1)='a'--

-- Time-based blind injection  
1; IF((SELECT COUNT(*) FROM users)>0,SLEEP(5),NULL)--
```

### Cross-Site Request Forgery (CSRF)
```html
<!-- Attacker's malicious site -->
<form action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker_account">
    <input type="hidden" name="amount" value="10000">
    <input type="submit" value="Click here for free prize!">
</form>

<!-- Auto-submit version -->
<script>
document.forms[0].submit();
</script>
```

#### CSRF Protection
```html
<!-- CSRF token in form -->
<form action="/transfer" method="POST">
    <input type="hidden" name="_token" value="{{csrf_token()}}">
    <input type="text" name="amount">
    <button type="submit">Transfer</button>
</form>
```

## API Security

### REST API Best Practices
```http
# Use proper HTTP methods
GET    /api/users      # List users
POST   /api/users      # Create user
GET    /api/users/123  # Get specific user
PUT    /api/users/123  # Update user
DELETE /api/users/123  # Delete user

# Security considerations
# - Authentication required for all endpoints
# - Input validation on all parameters
# - Rate limiting to prevent abuse
# - Proper error handling (don't leak info)
```

### API Authentication
```bash
# API Key (simple but not ideal)
GET /api/data?api_key=abc123

# Better: Header-based
Authorization: Bearer api_key_here

# Best: OAuth 2.0 or JWT tokens with expiration
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Versioning
```bash
# URL versioning
GET /api/v1/users
GET /api/v2/users

# Header versioning  
Accept: application/vnd.api+json;version=1
```

## Client-Side Security

### JavaScript Security Issues
```javascript
// Dangerous: eval() with user input
eval(userInput); // Never do this!

// Dangerous: innerHTML with user data
element.innerHTML = userData; // XSS risk

// Safe: textContent for text data
element.textContent = userData;

// Safe: Use parameterized API calls
fetch('/api/user/' + encodeURIComponent(userId))
```

### Same-Origin Policy
```javascript
// Browser security model
// Scripts can only access resources from same:
// - Protocol (http/https)
// - Domain (example.com)  
// - Port (80, 443, etc.)

// CORS allows controlled cross-origin access
Access-Control-Allow-Origin: https://trusted-site.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Web Server Configuration

### Apache Security
```apache
# Hide server version
ServerTokens Prod
ServerSignature Off

# Disable dangerous modules
LoadModule rewrite_module modules/mod_rewrite.so
# Don't load: mod_userdir, mod_autoindex

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### Nginx Security  
```nginx
# Hide server version
server_tokens off;

# Security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_req zone=login burst=5;
```

## File Upload Security

### Dangerous File Types
```bash
# Executable files
.exe, .bat, .cmd, .scr, .com, .pif

# Script files  
.php, .asp, .jsp, .py, .rb, .pl

# Archives (can contain malicious files)
.zip, .rar, .tar, .gz

# Documents with macros
.doc, .docm, .xls, .xlsm, .ppt, .pptm
```

### Secure File Upload Implementation
```php
<?php
// Validate file type
$allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($_FILES['upload']['type'], $allowed_types)) {
    die('Invalid file type');
}

// Validate file extension
$filename = $_FILES['upload']['name'];
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif'])) {
    die('Invalid file extension');
}

// Generate safe filename
$safe_filename = bin2hex(random_bytes(16)) . '.' . $ext;

// Store outside web root
$upload_path = '/secure/uploads/' . $safe_filename;
move_uploaded_file($_FILES['upload']['tmp_name'], $upload_path);
?>
```

## Web Application Firewalls (WAF)

### WAF Rule Examples
```bash
# Block SQL injection attempts
SecRule ARGS "@detectSQLi" \
    "id:1001,phase:2,msg:'SQL Injection Attack',logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}',deny"

# Block XSS attempts  
SecRule ARGS "@detectXSS" \
    "id:1002,phase:2,msg:'XSS Attack',deny"

# Rate limiting
SecRule IP:REQUEST_COUNT "@gt 100" \
    "id:1003,phase:1,msg:'Rate limiting',deny,expirevar:IP.REQUEST_COUNT=60"
```

### Common WAF Bypasses
```bash
# Case variation
<ScRiPt>alert(1)</ScRiPt>

# Encoding
%3Cscript%3Ealert(1)%3C/script%3E

# HTML entity encoding  
&lt;script&gt;alert(1)&lt;/script&gt;

# Comments in SQL
SELECT/*comment*/username/*another*/FROM/**/users
```

This web technologies foundation helps you understand how web applications work and where security vulnerabilities commonly occur.