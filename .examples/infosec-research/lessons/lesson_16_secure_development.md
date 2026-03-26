# LESSON 16: Secure Development & DevSecOps

## Objective
Master secure development practices and DevSecOps integration. Learn to implement security throughout the software development lifecycle, from secure coding to automated security testing and deployment.

## Prerequisites
- Lessons 1-15 completed
- Software development experience
- Understanding of CI/CD pipelines
- Knowledge of containerization

## Phase 1: Secure Coding Fundamentals

### Step 1: Input Validation and Sanitization
```python
# Secure input validation examples
import re
import html
import hashlib
import secrets

class SecureInput:
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email)) and len(email) <= 254
    
    @staticmethod
    def validate_integer(value, min_val=None, max_val=None):
        """Safely validate integer input"""
        try:
            num = int(value)
            if min_val is not None and num < min_val:
                return False, "Value too small"
            if max_val is not None and num > max_val:
                return False, "Value too large"
            return True, num
        except ValueError:
            return False, "Invalid integer"
    
    @staticmethod
    def sanitize_html(input_string):
        """Sanitize HTML to prevent XSS"""
        return html.escape(input_string, quote=True)
    
    @staticmethod
    def validate_filename(filename):
        """Validate filename to prevent path traversal"""
        # Remove path components and dangerous characters
        safe_chars = re.compile(r'^[a-zA-Z0-9._-]+$')
        basename = filename.split('/')[-1].split('\\')[-1]
        
        if not basename or len(basename) > 255:
            return False
        if not safe_chars.match(basename):
            return False
        if basename.startswith('.'):
            return False
            
        return True

# SQL injection prevention
import sqlite3
from contextlib import contextmanager

class SecureDatabase:
    def __init__(self, db_path):
        self.db_path = db_path
    
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()
    
    def get_user_by_id(self, user_id):
        """Safe parameterized query"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Use parameterized query to prevent SQL injection
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            return cursor.fetchone()
    
    def search_users(self, search_term):
        """Safe search with parameterized query"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Use LIKE with parameterized query
            safe_term = f"%{search_term}%"
            cursor.execute("SELECT id, username FROM users WHERE username LIKE ?", (safe_term,))
            return cursor.fetchall()
```

### Step 2: Authentication and Session Management
```python
# Secure authentication implementation
import bcrypt
import jwt
from datetime import datetime, timedelta
import secrets

class SecureAuth:
    def __init__(self, secret_key):
        self.secret_key = secret_key
        self.algorithm = 'HS256'
        self.token_expiry = timedelta(hours=24)
    
    def hash_password(self, password):
        """Hash password with bcrypt"""
        # Generate salt and hash password
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password, hashed):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_token(self, user_id, permissions=None):
        """Generate JWT token"""
        payload = {
            'user_id': user_id,
            'permissions': permissions or [],
            'exp': datetime.utcnow() + self.token_expiry,
            'iat': datetime.utcnow(),
            'jti': secrets.token_hex(16)  # JWT ID for revocation
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token):
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, "Token expired"
        except jwt.InvalidTokenError:
            return False, "Invalid token"
    
    def generate_csrf_token(self):
        """Generate CSRF token"""
        return secrets.token_urlsafe(32)

# Session management with secure cookies
class SecureSession:
    def __init__(self, app):
        self.app = app
        # Configure secure session settings
        app.config['SESSION_COOKIE_SECURE'] = True      # HTTPS only
        app.config['SESSION_COOKIE_HTTPONLY'] = True    # No JavaScript access
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'   # CSRF protection
        app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)
```

### Step 3: Cryptographic Implementation
```python
# Secure cryptographic practices
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import base64

class SecureCrypto:
    @staticmethod
    def generate_key():
        """Generate a secure encryption key"""
        return Fernet.generate_key()
    
    @staticmethod
    def derive_key_from_password(password, salt=None):
        """Derive encryption key from password using PBKDF2"""
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key, salt
    
    @staticmethod
    def encrypt_data(data, key):
        """Encrypt data using Fernet (AES)"""
        f = Fernet(key)
        return f.encrypt(data.encode())
    
    @staticmethod
    def decrypt_data(encrypted_data, key):
        """Decrypt data using Fernet"""
        f = Fernet(key)
        return f.decrypt(encrypted_data).decode()
    
    @staticmethod
    def generate_rsa_keypair():
        """Generate RSA key pair"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        public_key = private_key.public_key()
        return private_key, public_key
    
    @staticmethod
    def rsa_encrypt(data, public_key):
        """Encrypt data with RSA public key"""
        encrypted = public_key.encrypt(
            data.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.b64encode(encrypted).decode()
    
    @staticmethod
    def rsa_decrypt(encrypted_data, private_key):
        """Decrypt data with RSA private key"""
        encrypted_bytes = base64.b64decode(encrypted_data)
        decrypted = private_key.decrypt(
            encrypted_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted.decode()
```

## Phase 2: Secure Architecture Design

### Step 4: Security Design Patterns
```python
# Security design patterns implementation

# 1. Principle of Least Privilege
class PermissionManager:
    def __init__(self):
        self.permissions = {}
    
    def grant_permission(self, user_id, resource, actions):
        """Grant minimal necessary permissions"""
        if user_id not in self.permissions:
            self.permissions[user_id] = {}
        self.permissions[user_id][resource] = actions
    
    def check_permission(self, user_id, resource, action):
        """Check if user has specific permission"""
        user_perms = self.permissions.get(user_id, {})
        resource_perms = user_perms.get(resource, [])
        return action in resource_perms

# 2. Defense in Depth
class SecurityMiddleware:
    def __init__(self):
        self.security_layers = []
    
    def add_layer(self, security_check):
        """Add security layer to the stack"""
        self.security_layers.append(security_check)
    
    def process_request(self, request):
        """Process request through all security layers"""
        for layer in self.security_layers:
            if not layer(request):
                return False, "Security check failed"
        return True, "Request approved"

# 3. Fail Secure Pattern
class SecureFileHandler:
    def read_file(self, filename, user_permissions):
        try:
            # Validate permissions first
            if not self.validate_access(filename, user_permissions):
                raise PermissionError("Access denied")
            
            # Validate file path
            if not self.is_safe_path(filename):
                raise ValueError("Invalid file path")
            
            with open(filename, 'r') as f:
                return f.read()
                
        except Exception as e:
            # Fail securely - don't expose error details
            self.log_security_event(f"File access denied: {filename}")
            return None
    
    def validate_access(self, filename, permissions):
        """Validate user has access to file"""
        # Implementation depends on your permission system
        return True
    
    def is_safe_path(self, filename):
        """Validate file path is safe"""
        # Prevent directory traversal
        if '..' in filename or filename.startswith('/'):
            return False
        return True
```

### Step 5: Secure API Design
```python
# Secure REST API implementation
from flask import Flask, request, jsonify
from functools import wraps
import time
import redis

app = Flask(__name__)
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Rate limiting decorator
def rate_limit(requests_per_minute=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get client IP
            client_ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
            key = f"rate_limit:{client_ip}"
            
            # Check current request count
            current_requests = redis_client.get(key)
            if current_requests is None:
                # First request from this IP
                redis_client.setex(key, 60, 1)
            else:
                current_requests = int(current_requests)
                if current_requests >= requests_per_minute:
                    return jsonify({"error": "Rate limit exceeded"}), 429
                redis_client.incr(key)
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Input validation decorator
def validate_json(*required_fields):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Content-Type must be application/json"}), 400
            
            data = request.get_json()
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Secure API endpoints
@app.route('/api/users', methods=['POST'])
@rate_limit(requests_per_minute=10)  # Lower limit for creation
@validate_json('username', 'email', 'password')
def create_user():
    data = request.get_json()
    
    # Additional validation
    if not SecureInput.validate_email(data['email']):
        return jsonify({"error": "Invalid email format"}), 400
    
    if len(data['password']) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    # Create user logic here
    return jsonify({"message": "User created successfully"}), 201

# CORS configuration
@app.after_request
def after_request(response):
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    
    return response
```

## Phase 3: DevSecOps Integration

### Step 6: Security in CI/CD Pipelines
```yaml
# .github/workflows/security-pipeline.yml
name: Security CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    # Static Application Security Testing (SAST)
    - name: Run Bandit Security Linter
      run: |
        pip install bandit
        bandit -r . -f json -o bandit-report.json
        bandit -r . -f txt
    
    - name: Run Safety Check
      run: |
        pip install safety
        safety check --json --output safety-report.json
        safety check
    
    # Dependency scanning
    - name: Run pip-audit
      run: |
        pip install pip-audit
        pip-audit --desc --output pip-audit-report.json
    
    # Secret scanning
    - name: Run TruffleHog
      run: |
        docker run --rm -v "$(pwd):/pwd" trufflesecurity/trufflehog:latest filesystem /pwd
    
    # Container scanning (if applicable)
    - name: Build Docker image
      run: docker build -t app:test .
    
    - name: Run Trivy container scan
      run: |
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
          -v $(pwd):/tmp aquasec/trivy image --exit-code 1 --severity HIGH,CRITICAL app:test
    
    # Infrastructure as Code scanning
    - name: Run Checkov
      run: |
        pip install checkov
        checkov -d . --framework dockerfile,terraform --output json --output-file checkov-report.json
    
    # Upload security reports
    - name: Upload security reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-reports
        path: |
          bandit-report.json
          safety-report.json
          pip-audit-report.json
          checkov-report.json
```

### Step 7: Automated Security Testing
```python
# Security test automation framework
import unittest
import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

class SecurityTestSuite(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://localhost:8000"
        self.session = requests.Session()
        
    def test_sql_injection_protection(self):
        """Test SQL injection protection"""
        payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT NULL--",
            "admin'--",
            "' OR 1=1#"
        ]
        
        for payload in payloads:
            response = self.session.post(
                f"{self.base_url}/login",
                data={'username': payload, 'password': 'test'}
            )
            # Should not succeed or expose error details
            self.assertNotIn("mysql_", response.text.lower())
            self.assertNotIn("ora-", response.text.lower())
            self.assertNotEqual(response.status_code, 200)
    
    def test_xss_protection(self):
        """Test Cross-Site Scripting protection"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "'><script>alert('XSS')</script>",
            "\"><script>alert('XSS')</script>"
        ]
        
        for payload in xss_payloads:
            response = self.session.post(
                f"{self.base_url}/search",
                data={'query': payload}
            )
            # Payload should be escaped
            self.assertNotIn("<script>", response.text)
            self.assertNotIn("javascript:", response.text)
    
    def test_csrf_protection(self):
        """Test CSRF protection"""
        # Attempt request without CSRF token
        response = self.session.post(
            f"{self.base_url}/api/sensitive-action",
            data={'action': 'delete_user', 'user_id': '123'}
        )
        self.assertEqual(response.status_code, 403)
    
    def test_rate_limiting(self):
        """Test rate limiting implementation"""
        # Make rapid requests
        start_time = time.time()
        responses = []
        
        for i in range(100):
            response = self.session.get(f"{self.base_url}/api/data")
            responses.append(response.status_code)
            if response.status_code == 429:  # Rate limited
                break
        
        # Should hit rate limit
        self.assertIn(429, responses)
    
    def test_authentication_bypass(self):
        """Test authentication bypass attempts"""
        bypass_attempts = [
            "/admin/../admin/",
            "/admin/%2e%2e/admin/",
            "/admin/..;/admin/",
            "//admin/",
            "/admin//admin/"
        ]
        
        for attempt in bypass_attempts:
            response = self.session.get(f"{self.base_url}{attempt}")
            # Should redirect to login or return 401/403
            self.assertIn(response.status_code, [301, 302, 401, 403])
    
    def test_file_upload_security(self):
        """Test file upload security"""
        malicious_files = [
            ('test.php', b'<?php system($_GET["cmd"]); ?>'),
            ('test.jsp', b'<%Runtime.getRuntime().exec(request.getParameter("cmd"));%>'),
            ('test.exe', b'MZ\x90\x00'),  # PE header
            ('../../../etc/passwd', b'root:x:0:0:root:/root:/bin/bash')
        ]
        
        for filename, content in malicious_files:
            files = {'file': (filename, content)}
            response = self.session.post(f"{self.base_url}/upload", files=files)
            # Should reject malicious files
            self.assertNotEqual(response.status_code, 200)
    
    def test_security_headers(self):
        """Test security headers presence"""
        response = self.session.get(self.base_url)
        
        required_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security',
            'Content-Security-Policy'
        ]
        
        for header in required_headers:
            self.assertIn(header, response.headers)

class WebDriverSecurityTests(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()  # Requires ChromeDriver
        self.base_url = "https://localhost:8000"
    
    def tearDown(self):
        self.driver.quit()
    
    def test_clickjacking_protection(self):
        """Test clickjacking protection"""
        self.driver.get("data:text/html,<iframe src='{}'></iframe>".format(self.base_url))
        # Should not load in iframe due to X-Frame-Options
        iframe = self.driver.find_element(By.TAG_NAME, "iframe")
        # Check if iframe is blocked or shows error
    
    def test_dom_xss(self):
        """Test DOM-based XSS"""
        payload = "#<script>alert('DOM XSS')</script>"
        self.driver.get(f"{self.base_url}/page{payload}")
        
        # Check if script executed (should not)
        alerts = self.driver.switch_to.alert
        try:
            alert_text = alerts.text
            alerts.accept()
            self.fail("DOM XSS vulnerability detected")
        except:
            # No alert means XSS was prevented
            pass

if __name__ == '__main__':
    unittest.main()
```

### Step 8: Container Security
```dockerfile
# Secure Dockerfile example
FROM python:3.9-slim as builder

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -s /bin/false appuser

# Install security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        gcc \
        libc6-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.9-slim

# Install security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -s /bin/false appuser

# Copy Python packages from builder
COPY --from=builder /home/appuser/.local /home/appuser/.local

# Create app directory with proper permissions
WORKDIR /app
RUN chown -R appuser:appgroup /app

# Copy application code
COPY --chown=appuser:appgroup . .

# Remove write permissions from application files
RUN chmod -R 555 /app

# Switch to non-root user
USER appuser

# Set PATH to include user-installed packages
ENV PATH="/home/appuser/.local/bin:$PATH"

# Use specific port (not 80/443)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start application
CMD ["python", "app.py"]
```

```bash
# Container security scanning script
#!/bin/bash

IMAGE_NAME=$1
SCAN_RESULTS_DIR="security-scans"

mkdir -p $SCAN_RESULTS_DIR

echo "Starting container security scan for $IMAGE_NAME"

# 1. Trivy vulnerability scan
echo "Running Trivy scan..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    -v $(pwd)/$SCAN_RESULTS_DIR:/tmp/results \
    aquasec/trivy image --format json --output /tmp/results/trivy-report.json $IMAGE_NAME

# 2. Clair scan (if available)
echo "Running Clair scan..."
# Implementation depends on Clair setup

# 3. Docker Bench for Security
echo "Running Docker Bench for Security..."
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /etc:/etc:ro --label docker_bench_security \
    docker/docker-bench-security > $SCAN_RESULTS_DIR/docker-bench-results.txt

# 4. Image layer analysis
echo "Analyzing image layers..."
docker history $IMAGE_NAME > $SCAN_RESULTS_DIR/image-history.txt

# 5. Check for secrets in image
echo "Scanning for secrets..."
docker run --rm -v $(pwd)/$SCAN_RESULTS_DIR:/tmp/results \
    trufflesecurity/trufflehog:latest docker --image $IMAGE_NAME --json > $SCAN_RESULTS_DIR/secrets-scan.json

echo "Container security scan complete. Results in $SCAN_RESULTS_DIR/"
```

## Phase 4: Infrastructure Security

### Step 9: Infrastructure as Code Security
```hcl
# Secure Terraform configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3 bucket with security best practices
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "my-secure-bucket-${random_string.bucket_suffix.result}"
  
  tags = {
    Environment = var.environment
    Purpose     = "Secure data storage"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Enable versioning
resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS key for encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 7
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Environment = var.environment
  }
}

# Security group with minimal access
resource "aws_security_group" "app_sg" {
  name_prefix = "app-sg-"
  description = "Security group for application"
  vpc_id      = data.aws_vpc.default.id

  # Only allow HTTPS inbound
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound (restrict as needed)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "app-security-group"
    Environment = var.environment
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_vpc" "default" {
  default = true
}
```

### Step 10: Kubernetes Security
```yaml
# secure-pod.yaml - Pod with security constraints
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  labels:
    app: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  
  containers:
  - name: app
    image: secure-app:latest
    imagePullPolicy: Always
    
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      runAsNonRoot: true
      runAsUser: 10001
      capabilities:
        drop:
        - ALL
      seccompProfile:
        type: RuntimeDefault
    
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    
    volumeMounts:
    - name: tmp-volume
      mountPath: /tmp
    - name: cache-volume
      mountPath: /app/cache
  
  volumes:
  - name: tmp-volume
    emptyDir: {}
  - name: cache-volume
    emptyDir: {}
  
  restartPolicy: Always

---
# Network Policy for pod isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: secure-app-netpol
spec:
  podSelector:
    matchLabels:
      app: secure-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          role: database
    ports:
    - protocol: TCP
      port: 5432

---
# Pod Security Policy (deprecated, use Pod Security Standards)
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: secure-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

## Custom Scripts Usage

### secure_code_scanner.py
```bash
# Automated secure code analysis
python3 scripts/lesson_16_secure_development/secure_code_scanner.py --directory ./src --language python --output security_report.json
```

### devsecops_pipeline.py
```bash
# DevSecOps pipeline automation
python3 scripts/lesson_16_secure_development/devsecops_pipeline.py --project ./myapp --scan-all --deploy-staging
```

## Evidence Collection

### Step 11: Security Testing Documentation
```bash
# Generate security test results
pytest security_tests/ --junitxml=security-test-results.xml
bandit -r ./src -f json -o static-analysis-results.json

# Container security evidence
docker run --rm trivy image myapp:latest --format json --output container-scan.json

# Infrastructure security validation
terraform plan -out=tfplan
terraform show -json tfplan > infrastructure-plan.json
```

## Success Criteria

✓ Secure coding practices implemented
✓ Authentication and authorization secured
✓ Cryptographic functions properly implemented
✓ Security testing automated in CI/CD
✓ Container security hardened
✓ Infrastructure as Code secured
✓ Security monitoring integrated
✓ Custom scripts functioning

## Secure Development Principles

### Core Principles
1. **Security by Design**: Build security into architecture
2. **Defense in Depth**: Multiple security layers
3. **Fail Securely**: Fail to a secure state
4. **Least Privilege**: Minimal necessary access
5. **Complete Mediation**: Check every access
6. **Economy of Mechanism**: Simple, auditable design
7. **Open Design**: Security through transparency
8. **Separation of Duties**: No single point of failure

### OWASP Top 10 Mitigation

| Vulnerability | Mitigation Strategy |
|---------------|-------------------|
| Injection | Input validation, parameterized queries |
| Broken Authentication | Strong auth, session management |
| Sensitive Data Exposure | Encryption, proper key management |
| XML External Entities | Disable XML processing, validation |
| Broken Access Control | Proper authorization checks |
| Security Misconfiguration | Secure defaults, hardening |
| XSS | Input validation, output encoding |
| Insecure Deserialization | Avoid untrusted data, integrity checks |
| Known Vulnerabilities | Dependency scanning, updates |
| Insufficient Logging | Comprehensive security logging |

## DevSecOps Tools Ecosystem

### SAST (Static Application Security Testing)
- **SonarQube**: Code quality and security
- **Checkmarx**: Commercial SAST solution
- **Bandit**: Python security linter
- **ESLint Security**: JavaScript security rules

### DAST (Dynamic Application Security Testing)
- **OWASP ZAP**: Web application scanner
- **Burp Suite**: Professional web testing
- **Nikto**: Web server scanner
- **w3af**: Web application attack framework

### Container Security
- **Trivy**: Vulnerability scanner
- **Clair**: Container vulnerability analysis
- **Twistlock/Prisma**: Container security platform
- **Falco**: Runtime security monitoring

### Infrastructure Security
- **Checkov**: Infrastructure as Code scanning
- **Terraform Sentinel**: Policy as Code
- **Cloud Custodian**: Cloud security automation
- **ScoutSuite**: Multi-cloud security auditing

## Course Completion Summary

Congratulations! You have completed all 16 lessons of the comprehensive cybersecurity course. You have learned:

1. **Reconnaissance** - Information gathering and target analysis
2. **Web Exploitation** - Application security testing
3. **Physical Access** - Hardware and social engineering
4. **Post-Exploitation** - Privilege escalation and persistence
5. **Network Services** - Protocol exploitation
6. **Password Attacks** - Cryptographic attacks
7. **Wireless Security** - RF and Bluetooth exploitation
8. **Mobile Security** - Android and iOS testing
9. **Active Directory** - Windows domain attacks
10. **macOS Security** - Apple platform exploitation
11. **Cloud Security** - AWS/Azure/GCP testing
12. **Social Engineering** - Human-based attacks
13. **Red Team Operations** - Advanced persistence
14. **Binary Exploitation** - Low-level attacks
15. **Threat Intelligence** - Incident response
16. **Secure Development** - Building secure systems

Continue practicing these skills in authorized environments and consider pursuing industry certifications like OSCP, CISSP, or specialized cloud security credentials.

**Remember: Use these skills ethically and only in authorized environments!**