# Cystene — Cybersecurity Domain Architecture

Stable reference document. Defines all entities, fields, relationships, enums, scanner architecture, and directory structure for the cybersecurity domain.

**Product type:** Enterprise Security Posture Management (ESPM) platform — NOT just a scanner.
**What this means:** Cystene scans from the outside (network/web) AND from the inside (SSH, API keys, domain credentials). Users describe their infrastructure, scan it, get findings with business context, compliance mapping, and actionable remediation. Reports are audit-ready for SOC2, ISO27001, NIS2.

**App name:** `cybersecurity`
**URL prefix:** `/cybersecurity/*`
**Backend:** `server/apps/cybersecurity/`
**Frontend:** `client/src/modules/cybersecurity/`, `client/src/app/(cybersecurity)/`

**Reference material:** Lessons built from Black Hat Python (Seitz/Arnold, 2nd Ed) and Black Hat Rust (Kerkour). Full coverage map: `support/cystene/lessons-coverage-map.md`.

---

## 0. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      UTILIZATOR                         │
│          (login, descrie infrastructura, scanez)         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                Infrastructure (optional)                 │
│    (ce detine userul: server, aplicatie, baza de date)   │
│    environment, criticality, owner → BUSINESS CONTEXT    │
└─────────────────────┬───────────────────────────────────┘
                      │ infrastructure_id (optional FK)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   ScanTarget                            │
│         (domeniu/IP/URL pe care vrea sa-l scaneze)       │
└───────┬──────────────┬──────────────────────────────────┘
        │              │
        ▼              ▼
  ScanTemplate    ScanSchedule
  (CE scanezi:    (CAND scanezi:
   port, dns,      daily, weekly,
   ssl, web +      cron expression)
   parametri)          │
        │              │
        └──────┬───────┘
               │ creeaza
               ▼
         ┌───────────┐
         │  ScanJob   │  pending → running → completed/failed
         └─────┬─────┘                    + security_score (0-100)
               │ ruleaza scannerele selectate
               │
    ┌──────────┼──────────────────────┐
    │          │          │           │
    ▼          ▼          ▼           ▼
 scan_ports  scan_dns  scan_ssl  scan_web
    │          │          │           │
    └──────────┴──────────┴───────────┘
               │ scriu rezultate in DB
        ┌──────┴──────┐
        ▼             ▼
    Findings       Assets
  (vulnerabi-   (ce a descoperit:
   litati,       porturi, servicii,
   fingerprint,  certificate, DNS)
   dedup)             │
               │
               ▼
           Reports
      (PDF/JSON export,
       executive summary)
```

**Fluxul:**
1. Optional: User descrie **Infrastructure** (ex: "Production Web Server", critical, owned by Backend Team)
2. User creeaza **ScanTarget** (ex: `cystene.com`) — optional legat de Infrastructure pentru business context
3. User creeaza **ScanTemplate** (ex: port scan + DNS scan, top 1000 ports, timeout 3s)
4. Optional: **ScanSchedule** (ruleaza saptamanal)
5. User apasa "Start Scan" → se creeaza un **ScanJob**
6. Subrouter-ul ia `scan_types` din template → cheama `SCANNERS["port_scan"]`, `SCANNERS["dns_scan"]` in paralel cu `asyncio.gather()`
7. Fiecare scanner scrie **Findings** (cu fingerprint pentru dedup) + **Assets** (infrastructura descoperita)
8. ScanJob calculeaza **security_score** (0-100) la completare
9. User genereaza **Report** din rezultate — cu business context din Infrastructure

---

## 1. Entity Overview

9 domain entities. Build order follows FK dependency (parent before child).

| # | Entity | Table | BaseMixin | Why BaseMixin / No BaseMixin |
|---|---|---|---|---|
| 1 | Infrastructure | `infrastructure` | YES | CRUD entity — users describe their infrastructure (servers, apps, databases, cloud accounts) with business context (environment, criticality, owner). Same pattern as Entity in FinPy (Organization → Entity → children). |
| 2 | Credential | `credentials` | YES | CRUD entity — encrypted credentials (SSH keys, cloud API keys, domain passwords) for internal scanning. Fernet encryption (same pattern as ecommerce WidgetAPIKey). Linked to Infrastructure. |
| 3 | ScanTarget | `scan_targets` | YES | CRUD entity — users create, update, soft-delete targets. Optional FK to Infrastructure for business context. |
| 4 | ScanTemplate | `scan_templates` | YES | CRUD entity — users create, update, soft-delete reusable scan configs |
| 5 | ScanSchedule | `scan_schedules` | YES | CRUD entity — users create, update, soft-delete recurring schedules |
| 6 | ScanJob | `scan_jobs` | YES | Mutable lifecycle — status transitions (pending → running → completed/failed), users can cancel (soft-delete). Includes security_score (0-100) and execution_point (cloud/remote_agent). |
| 7 | Finding | `findings` | NO | Append-only — scanner writes once, never edited. Status field tracks triage workflow but no soft delete needed. Includes fingerprint for deduplication, compliance metadata (CWE/OWASP/MITRE), and remediation_script. |
| 8 | Asset | `assets` | NO | Append-only — scanner discovers infrastructure, writes once. Includes service_metadata for deep discovery. Upsert by (scan_job_id, asset_type, value). |
| 9 | Report | `reports` | YES | CRUD entity — users generate, rename, soft-delete reports |

---

## 2. FK Relationship Map

Determines build order. Parent entities must exist before children.

```
users (accounts)
  └── organizations (accounts)
        └── infrastructure (organization_id) — what the user owns
              ├── credentials (infrastructure_id?, organization_id) — encrypted SSH keys, API keys, passwords
              └── scan_targets (infrastructure_id?, user_id, organization_id)
                    ├── scan_templates (target_id)
                    ├── scan_schedules (target_id, template_id)
                    ├── scan_jobs (target_id, template_id, schedule_id?)
                    │     ├── findings (scan_job_id, first_found_job_id?)
                    │     └── assets (scan_job_id)
                    └── reports (target_id, scan_job_id?)
```

**Build order:** Infrastructure → Credential → ScanTarget → ScanTemplate → ScanSchedule → ScanJob → Finding → Asset → Report

---

## 3. Entity Definitions

### 3.1 Infrastructure (BaseMixin)

**Purpose:** What the user owns — a server, application, database, network device, or cloud service. Provides business context (environment, criticality, owner) that makes scan findings actionable.
**Scope:** Per-organization. Users describe their infrastructure BEFORE scanning.
**Usage:** "Production Web Server (critical, Backend Team, Hetzner eu-central)", "Customer Database (critical, Data Team, AWS eu-west-1)".

**Why this entity exists:** Without business context, a finding is just "port 3306 open on 91.98.44.218". With Infrastructure, the same finding becomes "port 3306 open on Production Database Server (critical, owned by Data Team)" — actionable, prioritizable, and reportable to executives. This is the difference between a $20/mo scanner tool and a $500/mo security platform. Same pattern as Entity in FinPy (Organization → Entity → Holdings).

```python
# ==========================================
# 1. INFRASTRUCTURE
# ==========================================

class Infrastructure(BaseMixin, Base):
    __tablename__ = "infrastructure"

    id                  Integer, PK, index
    organization_id     Integer, FK("organizations.id", ondelete="CASCADE"), not null
    # Why organization-scoped: infrastructure belongs to the team, not an individual user

    # What it is
    name                String(255), not null           # "Production Web Server", "Customer Database"
    infra_type          String(50), not null             # "server", "application", "database", "network_device", "cloud_service"
    description         Text, nullable                   # Freeform description of what this infrastructure does

    # Business context — THIS IS THE VALUE
    # Why these fields: enables risk prioritization, contextual reports, compliance audits
    environment         String(50), default="production" # "production", "staging", "development", "testing"
    criticality         String(50), default="medium"     # "critical", "high", "medium", "low"
    owner               String(255), nullable            # "Backend Team", "DevOps", a person's name
    # Why owner is String not FK: teams/people change, owner is descriptive context not a strict relationship

    # Technical identifiers (optional — user fills in what they know)
    # Why all nullable: not all infrastructure has all fields (a cloud service has no IP, a network device has no URL)
    ip_address          String(255), nullable            # "91.98.44.218", "10.0.1.0/24"
    hostname            String(255), nullable            # "prod-web-01.internal"
    url                 String(500), nullable            # "https://app.cystene.com"
    cloud_provider      String(100), nullable            # "aws", "hetzner", "gcp", "azure", "digitalocean"
    region              String(100), nullable            # "eu-central-1", "fsn1", "us-east-1"

    # Metadata
    tags                String(500), nullable            # Comma-separated tags ("production,web,critical,pci")
    notes               Text, nullable                   # Freeform notes
    is_active           Boolean, default=True            # Soft toggle

    # Relationships
    credentials         relationship → Credential (back_populates="infrastructure", cascade="all, delete-orphan")
    scan_targets        relationship → ScanTarget (back_populates="infrastructure", cascade="all, delete-orphan")
```

**Enum — InfraType:**
```python
class InfraType(str, Enum):
    SERVER = "server"                   # Physical or virtual server
    APPLICATION = "application"         # Web app, API, microservice
    DATABASE = "database"               # PostgreSQL, MySQL, MongoDB, Redis
    NETWORK_DEVICE = "network_device"   # Router, switch, firewall, load balancer
    CLOUD_SERVICE = "cloud_service"     # AWS S3, CloudFront, Lambda, Azure Functions
    CLOUD_ACCOUNT = "cloud_account"     # Entire AWS/Azure/GCP account — for cloud_audit_scan
```

**Enum — Environment:**
```python
class Environment(str, Enum):
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"
    TESTING = "testing"
```

**Enum — Criticality:**
```python
class Criticality(str, Enum):
    CRITICAL = "critical"       # Business-critical — downtime or breach causes immediate revenue/data loss
    HIGH = "high"               # Important — significant impact if compromised
    MEDIUM = "medium"           # Standard — normal business operations
    LOW = "low"                 # Non-essential — minimal impact if compromised
```

---

### 3.2 Credential (BaseMixin)

**Purpose:** Encrypted credentials for internal scanning — SSH keys, cloud API keys, domain passwords.
**Scope:** Per-organization, optionally linked to Infrastructure. One credential can be used across multiple scan jobs.
**Usage:** "Production SSH Key (for host_audit_scan)", "AWS Prod API Key (for cloud_audit_scan)", "corp.local\admin (for ad_audit_scan)".

**Why separate entity (not fields on Infrastructure):** A credential may be used for multiple pieces of infrastructure. Storing credentials directly on Infrastructure would require duplicating sensitive data. Same decoupling pattern as ecommerce's WidgetAPIKey (separate from EcommerceConnection).

**Security:** All credential values MUST be encrypted using Fernet symmetric encryption (same pattern as ecommerce WidgetAPIKey.api_key_encrypted). Decryption happens only at scan time — scanners receive already-decrypted values (same pattern as ecommerce adapter factory).

```python
# ==========================================
# 2. CREDENTIALS
# ==========================================

class Credential(BaseMixin, Base):
    __tablename__ = "credentials"

    id                  Integer, PK, index
    organization_id     Integer, FK("organizations.id", ondelete="CASCADE"), not null
    infrastructure_id   Integer, FK("infrastructure.id", ondelete="SET NULL"), nullable
    # Why FK to infrastructure: credential is tied to a piece of infrastructure.
    # Why SET NULL: credential survives infrastructure deletion (can be reassigned).
    # Why nullable: credential can be created before linking to infrastructure.

    # Credential identification
    name                String(255), not null           # "Production SSH Key", "AWS Prod API Key"
    cred_type           String(50), not null             # "ssh_key", "ssh_password", "api_key", "domain_credentials", "service_account"

    # Encrypted value — Fernet symmetric encryption
    encrypted_value     Text, not null                  # Fernet-encrypted credential value
    # Why Text not String: encrypted values are base64 strings, SSH private keys can be very long
    # Why Fernet: same encryption pattern as ecommerce WidgetAPIKey.api_key_encrypted

    # Metadata (unencrypted — safe to store in plain text)
    username            String(255), nullable           # SSH username, API key ID, domain\username
    metadata            Text, nullable                  # JSON string: {"port": 22, "region": "eu-central-1", "domain": "corp.local"}
    # Why metadata as JSON text: flexible per-credential-type context without adding columns for each type

    # Status
    is_active           Boolean, default=True           # Soft toggle
    last_used_at        DateTime(timezone=True), nullable  # When last used for a scan
    last_verified_at    DateTime(timezone=True), nullable  # When last verified working (connectivity test)

    # Relationships
    infrastructure      relationship → Infrastructure (back_populates="credentials")
    templates           relationship → ScanTemplate (back_populates="credential")
```

**Enum — CredentialType:**
```python
class CredentialType(str, Enum):
    SSH_KEY = "ssh_key"                     # SSH private key (for host_audit_scan — Lesson 4, 10)
    SSH_PASSWORD = "ssh_password"           # SSH username + password
    API_KEY = "api_key"                     # Cloud API key: AWS Access Key, Azure Client Secret, GCP Service Account (for cloud_audit_scan — Lesson 11)
    DOMAIN_CREDENTIALS = "domain_credentials"  # Active Directory domain\username + password (for ad_audit_scan — Lesson 9)
    SERVICE_ACCOUNT = "service_account"     # Service account JSON file (GCP) or similar
```

---

### 3.3 ScanTarget (BaseMixin)

**Purpose:** What we scan — a domain, IP address, IP range, or URL that the user owns and wants to assess.
**Scope:** Per-user, per-organization. One target = one scannable endpoint. Optionally linked to Infrastructure for business context.
**Usage:** "example.com", "192.168.1.0/24", "https://app.example.com".

```python
# ==========================================
# 1. SCAN TARGETS
# ==========================================

class ScanTarget(BaseMixin, Base):
    __tablename__ = "scan_targets"

    id                  Integer, PK, index
    user_id             Integer, FK("users.id", ondelete="CASCADE"), not null
    organization_id     Integer, FK("organizations.id", ondelete="CASCADE"), not null
    infrastructure_id   Integer, FK("infrastructure.id", ondelete="SET NULL"), nullable
    # Why nullable: user can scan without describing infrastructure first. SET NULL: target survives infrastructure deletion.
    # Why this FK: links scan results to business context (environment, criticality, owner) for reports and prioritization.

    # Target identification
    name                String(255), not null          # Human-readable label ("Production API", "Corporate Website")
    target_type         String(50), not null           # "domain", "ip", "ip_range", "url"
    target_value        String(500), not null          # The actual target ("example.com", "192.168.1.0/24")

    # Verification — proves ownership before allowing scans
    # Why: prevents scanning targets you don't own (legal + ethical requirement)
    is_verified         Boolean, default=False         # True after ownership verification completes
    verification_method String(50), nullable           # "dns_txt", "file_upload", "meta_tag", None
    verification_token  String(255), nullable          # Token to place in DNS TXT or file for verification

    # Metadata
    notes               Text, nullable                 # Freeform notes ("Staging environment, scan weekly")
    tags                String(500), nullable          # Comma-separated tags ("production,web,critical")
    is_active           Boolean, default=True          # Soft toggle — False disables scheduling without deleting

    # Relationships
    infrastructure      relationship → Infrastructure (back_populates="scan_targets")
    templates           relationship → ScanTemplate (back_populates="target", cascade="all, delete-orphan")
    schedules           relationship → ScanSchedule (back_populates="target", cascade="all, delete-orphan")
    jobs                relationship → ScanJob (back_populates="target", cascade="all, delete-orphan")
    reports             relationship → Report (back_populates="target", cascade="all, delete-orphan")
```

**Enum — TargetType:**
```python
class TargetType(str, Enum):
    DOMAIN = "domain"           # "example.com" — DNS + SSL + web scan
    IP = "ip"                   # "192.168.1.1" — port scan + service detection
    IP_RANGE = "ip_range"       # "192.168.1.0/24" — network sweep
    URL = "url"                 # "https://app.example.com/api" — web-specific scan
```

**Enum — VerificationMethod:**
```python
class VerificationMethod(str, Enum):
    DNS_TXT = "dns_txt"         # Add TXT record with verification token
    FILE_UPLOAD = "file_upload" # Place .txt file at /.well-known/cystene-verify.txt
    META_TAG = "meta_tag"       # Add <meta name="cystene-verify" content="token"> to homepage
```

---

### 3.4 ScanTemplate (BaseMixin)

**Purpose:** How we scan — reusable configuration defining which scan types to run and with what parameters.
**Scope:** Per-target. One template can be reused across many jobs.
**Usage:** "Quick port scan (top 100)", "Full web assessment", "SSL-only check".

```python
# ==========================================
# 2. SCAN TEMPLATES
# ==========================================

class ScanTemplate(BaseMixin, Base):
    __tablename__ = "scan_templates"

    id                  Integer, PK, index
    target_id           Integer, FK("scan_targets.id", ondelete="CASCADE"), not null

    # Template identification
    name                String(255), not null          # "Quick Port Scan", "Full Assessment"
    description         Text, nullable                 # Freeform description of what this template does

    # Scan type selection — which engines to run
    # Why: comma-separated string, not array column — keeps PostgreSQL simple, no PG array needed
    scan_types          String(500), not null           # Comma-separated: "port_scan,dns_enum,ssl_check,web_scan"

    # Port scan parameters (only used when scan_types includes "port_scan")
    port_range          String(255), default="top_100"  # "top_100", "top_1000", "full", "1-1024", "80,443,8080"
    scan_speed          String(50), default="normal"    # "slow" (stealth), "normal", "fast" (aggressive)

    # Web scan parameters (only used when scan_types includes "web_scan")
    follow_redirects    Boolean, default=True           # Follow HTTP redirects
    max_depth           Integer, default=3              # Max crawl depth for web scanning
    check_headers       Boolean, default=True           # Check security headers (CSP, HSTS, X-Frame-Options, etc.)

    # DNS scan parameters (only used when scan_types includes "dns_enum")
    dns_brute_force     Boolean, default=False          # Attempt subdomain brute-force
    dns_wordlist        String(50), default="small"     # "small" (100 subdomains), "medium" (1000), "large" (10000)

    # General parameters
    timeout_seconds     Integer, default=300            # Max scan duration in seconds (5 min default)
    max_concurrent      Integer, default=50             # Max concurrent connections/threads

    # Active scanning consent — legal requirement
    active_scan_consent Boolean, default=False
    # Why: Active scanning (SQLi, XSS detection) sends payloads to the target.
    # Can trigger WAF blocks, security alerts, or in extreme cases affect production.
    # User must explicitly authorize active testing. Required when scan_types includes "active_web_scan".

    # Custom engine parameters — per-scanner flexibility
    engine_params       Text, nullable                  # JSON string with scanner-specific overrides
    # Why: Enables custom wordlists, custom headers, custom payloads per scan.
    # Example: {"custom_paths": ["/api/internal", "/legacy"], "custom_headers": {"X-Auth": "token"}}
    # API scanning (lesson 17) requires custom headers and target-specific paths.

    # Credential for internal scanners
    credential_id       Integer, FK("credentials.id", ondelete="SET NULL"), nullable
    # Why: Internal scanners (host_audit, cloud_audit, ad_audit) need a specific credential.
    # User selects which credential to use when creating the template.
    # Nullable: external scanners (port, dns, ssl, web) don't need credentials.
    # SET NULL: template survives credential deletion (user can reassign later).
    # Why here and not traversing Infrastructure→Credential: avoids 3-JOIN ambiguity.
    # Infrastructure can have multiple credentials (SSH + AWS + domain). This field is explicit.

    # Relationships
    target              relationship → ScanTarget (back_populates="templates")
    credential          relationship → Credential (back_populates="templates")
    schedules           relationship → ScanSchedule (back_populates="template", cascade="all, delete-orphan")
    jobs                relationship → ScanJob (back_populates="template", cascade="all, delete-orphan")
```

**Enum — ScanType:**
```python
class ScanType(str, Enum):
    # MVP — 4 scan types, each maps to one ScanEngine implementation
    PORT_SCAN = "port_scan"     # TCP connect scan, service banner grabbing
    DNS_ENUM = "dns_enum"       # DNS record enumeration, subdomain discovery
    SSL_CHECK = "ssl_check"     # SSL/TLS certificate validation, cipher analysis
    WEB_SCAN = "web_scan"       # HTTP security headers, common misconfigurations, directory/file discovery
    VULN_SCAN = "vuln_scan"     # CVE matching against detected service versions (network_scanner.py pattern)
    API_SCAN = "api_scan"       # JWT analysis, GraphQL introspection, CORS, rate limiting (lesson 17)
    ACTIVE_WEB_SCAN = "active_web_scan"  # Safe detection-only: SQLi, XSS, LFI, command injection (lessons 2, 17). Requires active_scan_consent=True.
    PASSWORD_AUDIT = "password_audit"   # Brute force, default credentials, weak passwords (Lesson 6, BHP Ch5-6)
    HOST_AUDIT = "host_audit"           # Privilege escalation, SUID, cron, permissions via SSH (Lesson 4, 10, BHP Ch2, Ch10)
    CLOUD_AUDIT = "cloud_audit"         # S3 buckets, IAM, security groups via cloud API keys (Lesson 11)
    AD_AUDIT = "ad_audit"              # AD enumeration, Kerberoasting, stale accounts via domain credentials (Lesson 9, BHP Ch10)
    MOBILE_SCAN = "mobile_scan"         # APK analysis — hardcoded creds, insecure storage, SSL pinning (Lesson 8). File upload, scan & delete.

    # Future expansion
    TECH_DETECT = "tech_detect" # Technology stack fingerprinting (Wappalyzer-style)
    WAF_DETECT = "waf_detect"   # Web Application Firewall detection
    WHOIS = "whois"             # WHOIS record lookup
    CLOUD_SCAN = "cloud_scan"   # S3 bucket checks, metadata service exposure (lesson 11)
    SMB_SCAN = "smb_scan"       # SMB enumeration, shares, null sessions (lesson 5, smb_exploit.py)
    AD_SCAN = "ad_scan"         # Active Directory enumeration (lesson 9)
```

**Enum — PortRange:**
```python
class PortRange(str, Enum):
    TOP_100 = "top_100"         # Nmap top 100 ports
    TOP_1000 = "top_1000"       # Nmap top 1000 ports
    FULL = "full"               # All 65535 ports
    # Custom ranges like "1-1024" or "80,443,8080" are free-text, not enum values
```

**Enum — ScanSpeed:**
```python
class ScanSpeed(str, Enum):
    SLOW = "slow"               # 1 connection/sec — stealth mode
    NORMAL = "normal"           # 50 concurrent — balanced
    FAST = "fast"               # 200 concurrent — aggressive, may trigger IDS
```

---

### 3.5 ScanSchedule (BaseMixin)

**Purpose:** When we scan — recurring schedule configuration tied to a target + template pair.
**Scope:** Per-target. Multiple schedules per target allowed (different templates at different intervals).
**Usage:** "Run 'Full Assessment' on example.com every Monday at 02:00 UTC".

```python
# ==========================================
# 3. SCAN SCHEDULES
# ==========================================

class ScanSchedule(BaseMixin, Base):
    __tablename__ = "scan_schedules"

    id                  Integer, PK, index
    target_id           Integer, FK("scan_targets.id", ondelete="CASCADE"), not null
    template_id         Integer, FK("scan_templates.id", ondelete="CASCADE"), not null

    # Schedule configuration
    name                String(255), not null           # "Weekly Full Scan", "Daily SSL Check"
    frequency           String(50), not null            # "hourly", "daily", "weekly", "monthly"
    cron_expression     String(100), nullable           # Optional cron override: "0 2 * * 1" (Mon 02:00)
    # Why cron_expression: frequency covers common cases, cron covers advanced ("every 6 hours on weekdays")

    # Schedule state
    is_active           Boolean, default=True           # Toggle without deleting
    last_run_at         DateTime(timezone=True), nullable  # When last scan was triggered
    next_run_at         DateTime(timezone=True), nullable  # When next scan will trigger
    last_run_status     String(50), nullable            # "success", "failed", "cancelled"

    # Relationships
    target              relationship → ScanTarget (back_populates="schedules")
    template            relationship → ScanTemplate (back_populates="schedules")
    jobs                relationship → ScanJob (back_populates="schedule", cascade="all, delete-orphan")
```

**Enum — ScheduleFrequency:**
```python
class ScheduleFrequency(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
```

---

### 3.6 ScanJob (BaseMixin)

**Purpose:** Tracks a single scan execution — what was scanned, when it started/ended, status, and results summary.
**Scope:** Per-target. Created manually (user clicks "Scan Now") or automatically (scheduler triggers).
**Usage:** "Port scan of example.com started 2024-03-15 14:30, completed in 45s, found 12 open ports".

```python
# ==========================================
# 4. SCAN JOBS
# ==========================================

class ScanJob(BaseMixin, Base):
    __tablename__ = "scan_jobs"

    id                  Integer, PK, index
    target_id           Integer, FK("scan_targets.id", ondelete="CASCADE"), not null
    template_id         Integer, FK("scan_templates.id", ondelete="CASCADE"), not null
    schedule_id         Integer, FK("scan_schedules.id", ondelete="SET NULL"), nullable
    # Why SET NULL on schedule: if schedule is deleted, keep historical job records

    # Job lifecycle
    status              String(50), not null, default="pending"  # "pending", "running", "completed", "failed", "cancelled"
    started_at          DateTime(timezone=True), nullable
    completed_at        DateTime(timezone=True), nullable
    duration_seconds    Integer, nullable               # Computed: completed_at - started_at

    # Execution details
    scan_types_run      String(500), nullable           # Comma-separated list of scan types actually executed
    # Why separate from template.scan_types: template may change after job runs, this preserves what actually ran

    # Results summary — denormalized counts for quick display without joining findings/assets
    total_findings      Integer, default=0
    critical_count      Integer, default=0
    high_count          Integer, default=0
    medium_count        Integer, default=0
    low_count           Integer, default=0
    info_count          Integer, default=0
    total_assets        Integer, default=0

    # Execution context
    execution_point     String(50), default="cloud"     # "cloud" or "remote_agent"
    # Why: "cloud" = scanned from Cystene servers (default, all external scanners).
    # "remote_agent" = scanned from agent installed in client's network (future — needed for
    # wireless scanning Lesson 7, internal network scanning). Prepares architecture for agent model.

    # Security score — executive dashboard metric
    security_score      Integer, nullable               # 0-100, computed at scan completion
    # Why: executives need a single number for board reporting and trend tracking.
    # Formula: start at 100, deduct weighted points per finding (critical=-40, high=-20, medium=-5, low=-1, info=0). Floor at 0.
    # Why cached here: avoids recomputation on every dashboard load. Snapshot of score at scan time.

    # Error tracking
    error_message       Text, nullable                  # Error details if status = "failed"
    # Why Text not String: stack traces and error details can be long

    # Relationships
    target              relationship → ScanTarget (back_populates="jobs")
    template            relationship → ScanTemplate (back_populates="jobs")
    schedule            relationship → ScanSchedule (back_populates="jobs")
    findings            relationship → Finding (back_populates="scan_job", cascade="all, delete-orphan")
    assets              relationship → Asset (back_populates="scan_job", cascade="all, delete-orphan")
    reports             relationship → Report (back_populates="scan_job")
```

**Enum — JobStatus:**
```python
class JobStatus(str, Enum):
    PENDING = "pending"         # Created, waiting to start
    RUNNING = "running"         # Scan engine actively executing
    COMPLETED = "completed"     # All scan types finished successfully
    FAILED = "failed"           # One or more scan types failed (error_message has details)
    CANCELLED = "cancelled"     # User manually cancelled or timeout reached
```

---

### 3.7 Finding (NO BaseMixin)

**Purpose:** A vulnerability, misconfiguration, or security issue discovered during a scan.
**Scope:** Per-scan-job. Each scan job produces 0..N findings.
**Usage:** "Port 22 running OpenSSH 7.2 — CVE-2016-6210 username enumeration (HIGH severity)".

**Why no BaseMixin:** Findings are append-only scanner output. They are never user-edited or soft-deleted — they represent a point-in-time discovery. Status field tracks triage workflow (open → acknowledged → resolved → false_positive) but that is a business state, not a CRUD lifecycle. Same pattern as `APIUsageTracking` and `RecommendationAnalytics` in ecommerce.

```python
# ==========================================
# 5. FINDINGS
# ==========================================

class Finding(Base):
    __tablename__ = "findings"

    id                  Integer, PK, index
    scan_job_id         Integer, FK("scan_jobs.id", ondelete="CASCADE"), not null

    # Deduplication — tracks recurring findings across scans
    fingerprint         String(255), not null, index
    # Why: SHA-256 hash of (category + finding_type + host + port + protocol + url).
    # Enables "new vs recurring" distinction: when writing findings, check if same fingerprint
    # exists in a previous scan for the same target. Without this, recurring scans produce
    # duplicate noise and dashboard counts are meaningless. Powers the "New Vulnerabilities"
    # dashboard card (Intrudify pattern: "New: 9" vs "All: 612").

    is_new              Boolean, default=True
    # Why: False if same fingerprint existed in a previous scan for this target.
    # Computed at scan time by checking previous findings. Enables dashboard filtering.

    first_found_job_id  Integer, FK("scan_jobs.id", ondelete="SET NULL"), nullable
    # Why: Links back to the FIRST scan that discovered this vulnerability.
    # Enables "age of vulnerability" tracking — how long has this been open?
    # SET NULL: original scan job can be deleted without breaking current finding.

    # Classification
    severity            String(50), not null            # "critical", "high", "medium", "low", "info"
    category            String(100), not null           # "open_port", "ssl_weakness", "missing_header", "dns_exposure", ...
    finding_type        String(100), not null           # Specific finding within category
    # Why both category and finding_type: category groups findings in UI, finding_type is the specific check

    # Finding details
    title               String(500), not null           # Human-readable title: "SSH Server Running Outdated Version"
    description         Text, not null                  # Detailed explanation of what was found
    remediation         Text, nullable                  # How to fix this finding (text explanation)
    remediation_script  Text, nullable                  # Copiable fix command/snippet
    # Why separate from remediation: remediation is explanation, remediation_script is actionable.
    # Ex: "chmod 600 ~/.ssh/authorized_keys", "add_header X-Frame-Options DENY;",
    # "aws s3api put-bucket-acl --bucket NAME --acl private". User copies and applies directly.
    evidence            Text, nullable                  # Raw evidence (banner text, response headers, DNS records)

    # Location — where the finding was discovered
    host                String(255), nullable           # IP or hostname where found
    port                Integer, nullable               # Port number (for port/service findings)
    protocol            String(20), nullable            # "tcp", "udp"
    url                 String(1000), nullable          # Full URL (for web findings)
    # Why all nullable: not all findings have all location fields (DNS finding has host but no port)

    # CVE reference (if applicable)
    cve_id              String(50), nullable            # "CVE-2016-6210"
    cvss_score          Float, nullable                 # 0.0 - 10.0

    # Compliance mapping — necesare pentru rapoarte SOC2/ISO27001
    cwe_id              String(50), nullable            # "CWE-89" (SQL Injection), "CWE-79" (XSS)
    # Why: CWE (Common Weakness Enumeration) — standard industry classification.
    # Rapoartele de compliance cer mapping la CWE. Fara asta, auditorul nu poate valida.

    owasp_category      String(100), nullable           # "A03:2021-Injection", "A05:2021-Security Misconfiguration"
    # Why: OWASP Top 10 — cel mai recunoscut standard de web security.
    # Clientii enterprise intreaba "suntem conformi OWASP?". Acest camp raspunde direct.

    mitre_tactic        String(100), nullable           # "Initial Access", "Credential Access", "Discovery"
    # Why: MITRE ATT&CK framework — standard folosit de SOC teams si threat intelligence.
    # Leaga findings de kill chain phases. Necesar pentru rapoarte avansate.

    mitre_technique     String(100), nullable           # "T1190" (Exploit Public-Facing Application)
    # Why: MITRE ATT&CK technique ID — granularitate sub-tactic.
    # Permite mapping precis la framework-ul de threat intelligence.

    # Triage status — user workflow for handling findings
    status              String(50), default="open"      # "open", "acknowledged", "resolved", "false_positive"
    # Why status on append-only: this is business state (triage), not CRUD lifecycle (no soft delete needed)

    # Accountability
    resolved_by         Integer, nullable               # User ID who marked finding as resolved
    # Why: audit trail for compliance reports. Answers "who fixed what and when" for NIS2/SOC2/ISO27001.
    # status_changed_at already tracks when, this tracks who.

    # Timestamps
    discovered_at       DateTime(timezone=True), server_default=func.now()  # When scanner found it
    status_changed_at   DateTime(timezone=True), nullable                    # When triage status last changed

    # Relationships
    scan_job            relationship → ScanJob (back_populates="findings")
    first_found_job     relationship → ScanJob (foreign_keys=[first_found_job_id])
```

**Enum — Severity:**
```python
class Severity(str, Enum):
    CRITICAL = "critical"       # Immediate exploitation risk (RCE, default creds, etc.)
    HIGH = "high"               # Significant risk (known CVEs, weak crypto)
    MEDIUM = "medium"           # Moderate risk (missing headers, info disclosure)
    LOW = "low"                 # Minor risk (verbose errors, version exposure)
    INFO = "info"               # Informational (open ports, DNS records, tech stack)
```

**Enum — FindingStatus:**
```python
class FindingStatus(str, Enum):
    OPEN = "open"                   # Newly discovered, not yet reviewed
    ACKNOWLEDGED = "acknowledged"   # Reviewed, will fix later
    RESOLVED = "resolved"          # Fixed by user
    FALSE_POSITIVE = "false_positive"  # Not a real issue
```

**Enum — FindingCategory:**
Derived from attack taxonomy (16 categories filtered to scanner-relevant categories):
```python
class FindingCategory(str, Enum):
    # Port & Service findings (from PortScanEngine)
    OPEN_PORT = "open_port"                     # Open TCP/UDP port discovered
    SERVICE_EXPOSURE = "service_exposure"       # Exposed service (SSH, FTP, RDP, SMB, etc.)
    OUTDATED_SERVICE = "outdated_service"       # Service running known-vulnerable version
    DEFAULT_CREDENTIALS = "default_credentials" # Service accessible with default/no credentials

    # DNS findings (from DNSScanEngine)
    DNS_EXPOSURE = "dns_exposure"               # Sensitive DNS records exposed (AXFR, internal records)
    SUBDOMAIN_DISCOVERY = "subdomain_discovery" # Discovered subdomains (potential attack surface)
    DNS_MISCONFIGURATION = "dns_misconfiguration"  # Missing SPF/DKIM/DMARC, open resolver, etc.

    # SSL/TLS findings (from SSLScanEngine)
    SSL_WEAKNESS = "ssl_weakness"               # Weak cipher, expired cert, self-signed cert
    CERTIFICATE_ISSUE = "certificate_issue"     # Hostname mismatch, chain incomplete, near expiry
    PROTOCOL_VULNERABILITY = "protocol_vulnerability"  # SSLv3, TLS 1.0/1.1 enabled

    # Web findings (from WebScanEngine)
    MISSING_HEADER = "missing_header"           # Missing security header (CSP, HSTS, X-Frame-Options, etc.)
    WEB_MISCONFIGURATION = "web_misconfiguration"  # Directory listing, debug mode, server info disclosure
    INFORMATION_DISCLOSURE = "information_disclosure"  # Version strings, stack traces, error details

    # Vuln scanner findings (from vuln_scan.py — CVE matching)
    KNOWN_VULNERABILITY = "known_vulnerability" # Service version matched against CVE database

    # API scanner findings (from api_scan.py)
    API_VULNERABILITY = "api_vulnerability"     # JWT weakness, GraphQL introspection, IDOR, rate limiting bypass

    # Active web scanner findings (from active_web_scan.py — detection only)
    INJECTION_DETECTED = "injection_detected"   # SQLi, command injection, XSS confirmed via safe payloads

    # Web scanner extended findings (from directory/file discovery)
    FILE_EXPOSURE = "file_exposure"             # .git, .env, backup files, config files accessible
    DIRECTORY_LISTING = "directory_listing"     # Directory indexing enabled on web server
    CORS_MISCONFIGURATION = "cors_misconfiguration"  # Permissive CORS policy (wildcard origin, credentials allowed)
    OPEN_REDIRECT = "open_redirect"            # Unvalidated redirect allowing phishing

    # Host audit findings (from host_audit_scan — Lesson 4, 10)
    PRIVILEGE_ESCALATION = "privilege_escalation"       # SUID binary, weak sudo config, writable cron
    WEAK_FILE_PERMISSIONS = "weak_file_permissions"     # World-readable sensitive files, weak SSH key permissions
    EXPOSED_CREDENTIALS = "exposed_credentials"         # Credentials in config files, env vars, shell history
    INSECURE_SERVICE_CONFIG = "insecure_service_config" # Dangerous service configurations found via SSH audit

    # Cloud audit findings (from cloud_audit_scan — Lesson 11)
    CLOUD_MISCONFIGURATION = "cloud_misconfiguration"   # Public S3 bucket, open security group, IMDSv1 enabled
    IAM_ISSUE = "iam_issue"                             # Overprivileged IAM role, stale access keys, no MFA

    # AD audit findings (from ad_audit_scan — Lesson 9)
    AD_WEAKNESS = "ad_weakness"                         # Kerberoastable accounts, unconstrained delegation, stale accounts

    # Password audit findings (from password_audit_scan — Lesson 6)
    WEAK_PASSWORD = "weak_password"                     # Default credentials, brute-forceable service passwords

    # Mobile findings (from mobile_scan — Lesson 8)
    MOBILE_VULNERABILITY = "mobile_vulnerability"       # Hardcoded credentials, insecure storage, missing SSL pinning

    # General categories
    WEAK_AUTHENTICATION = "weak_authentication" # Weak auth mechanisms detected
    CONFIGURATION_ERROR = "configuration_error" # General misconfiguration
```

---

### 3.8 Asset (NO BaseMixin)

**Purpose:** Discovered infrastructure — an IP, hostname, service, or technology found during scanning.
**Scope:** Per-scan-job. Each scan job discovers 0..N assets.
**Usage:** "Discovered host 192.168.1.10 running nginx/1.24.0 on port 443".

**Why no BaseMixin:** Assets are append-only scanner output, same reasoning as Finding. The scanner writes discovered infrastructure — it is never user-edited or soft-deleted. Upsert pattern prevents duplicates within a scan job.

```python
# ==========================================
# 6. ASSETS
# ==========================================

class Asset(Base):
    __tablename__ = "assets"

    id                  Integer, PK, index
    scan_job_id         Integer, FK("scan_jobs.id", ondelete="CASCADE"), not null

    # Asset classification
    asset_type          String(50), not null            # "host", "service", "technology", "certificate", "dns_record"
    value               String(500), not null           # The asset value ("192.168.1.10", "nginx/1.24.0", "TLS 1.3")

    # Context — where/how the asset was discovered
    host                String(255), nullable           # IP or hostname
    port                Integer, nullable               # Port number (for service assets)
    protocol            String(20), nullable            # "tcp", "udp"

    # Service details (for asset_type = "service")
    service_name        String(100), nullable           # "http", "ssh", "ftp", "smtp"
    service_version     String(255), nullable           # "OpenSSH 8.9", "nginx/1.24.0"
    banner              Text, nullable                  # Raw service banner

    # Deep discovery metadata — detalii complete pentru blast radius analysis
    service_metadata    Text, nullable                  # JSON string with full discovery data
    # Why: Nu stocam doar "nginx/1.24.0". Stocam bannerul SSH complet, cipher suites SSL,
    # headerele HTTP expuse, certificat chain details. Aceasta e baza pentru analiza de tip
    # "Blast Radius" din SurrealDB graph layer.
    # Exemplu: {"banner": "SSH-2.0-OpenSSH_8.9", "ciphers": [...], "key_exchange": [...]}
    # Text not JSONB: consistent cu restul proiectului (no PG-specific types).

    # Metadata
    confidence          String(50), default="confirmed" # "confirmed", "probable", "possible"
    first_seen_at       DateTime(timezone=True), server_default=func.now()  # When first discovered

    # Upsert by (scan_job_id, asset_type, value) — prevents duplicates within a scan
    __table_args__ = (UniqueConstraint("scan_job_id", "asset_type", "value", name="uq_assets_job_type_value"),)

    # Relationships
    scan_job            relationship → ScanJob (back_populates="assets")
```

**Enum — AssetType:**
```python
class AssetType(str, Enum):
    HOST = "host"                   # IP address or hostname
    SERVICE = "service"             # Running service (HTTP, SSH, FTP, etc.)
    TECHNOLOGY = "technology"       # Technology/framework (nginx, Apache, WordPress, etc.)
    CERTIFICATE = "certificate"     # SSL/TLS certificate
    DNS_RECORD = "dns_record"       # DNS record (A, AAAA, MX, NS, TXT, CNAME, etc.)
```

**Enum — AssetConfidence:**
```python
class AssetConfidence(str, Enum):
    CONFIRMED = "confirmed"     # Directly observed (connected and verified)
    PROBABLE = "probable"       # High confidence from indirect evidence (banner matching)
    POSSIBLE = "possible"       # Low confidence (heuristic/inference)
```

---

### 3.9 Report (BaseMixin)

**Purpose:** A generated report document summarizing scan results for a target.
**Scope:** Per-target, optionally linked to a specific scan job.
**Usage:** "Full Security Assessment Report for example.com — March 2024 (PDF, 15 pages)".

```python
# ==========================================
# 7. REPORTS
# ==========================================

class Report(BaseMixin, Base):
    __tablename__ = "reports"

    id                  Integer, PK, index
    target_id           Integer, FK("scan_targets.id", ondelete="CASCADE"), not null
    scan_job_id         Integer, FK("scan_jobs.id", ondelete="SET NULL"), nullable
    # Why SET NULL: report survives even if the source scan job is deleted

    # Report identification
    name                String(255), not null           # "March 2024 Security Assessment"
    report_type         String(50), not null             # "full", "executive_summary", "compliance", "delta"
    format              String(50), default="pdf"       # "pdf", "html", "json"

    # Report content
    # Why Text not file path: store generated content directly in DB for MVP.
    # File storage (S3/local) is a Phase 4 optimization.
    content             Text, nullable                  # HTML content or JSON data
    summary             Text, nullable                  # Executive summary text

    # Report statistics — snapshot at generation time
    total_findings      Integer, default=0
    critical_count      Integer, default=0
    high_count          Integer, default=0
    medium_count        Integer, default=0
    low_count           Integer, default=0
    info_count          Integer, default=0

    # Generation metadata
    generated_at        DateTime(timezone=True), server_default=func.now()
    generated_by        Integer, nullable               # User ID who triggered generation

    # Relationships
    target              relationship → ScanTarget (back_populates="reports")
    scan_job            relationship → ScanJob (back_populates="reports")
```

**Enum — ReportType:**
```python
class ReportType(str, Enum):
    FULL = "full"                       # Complete technical report with all findings
    EXECUTIVE_SUMMARY = "executive_summary"  # High-level overview for management
    COMPLIANCE = "compliance"           # Compliance-focused (OWASP, CIS benchmarks)
    DELTA = "delta"                     # Changes between two scan jobs
```

**Enum — ReportFormat:**
```python
class ReportFormat(str, Enum):
    PDF = "pdf"
    HTML = "html"
    JSON = "json"
```

---

## 4. Scanners

### 4.1 Overview

Plain async functions — no ABC, no orchestrator, no strategy pattern, no factory.

**What was removed (previous version had `engine/` directory):**
The original plan used a full engine pattern with 5 components: (1) `base.py` — an ABC (`ScanEngine`) forcing all scanners to inherit and implement `scan()` + `engine_type()`, (2) `orchestrator.py` — a `ScanOrchestrator` class that loaded jobs, selected engines, ran them, and wrote results, (3) strategy pattern — each scanner was a subclass of the ABC, swappable at runtime, (4) factory pattern — a function to instantiate the correct engine class based on scan type, (5) `parsers/` directory — parser classes for external tool output (nmap XML, nuclei JSON). All 5 were removed in favor of plain async functions in a flat `scanners/` directory, because 4 scanners we fully control don't justify the abstraction layers. The subrouter calls them directly via a dict mapping.

**Why no ABC (Abstract Base Class):** An ABC forces subclasses to implement specific methods via a shared interface. Useful when you have multiple implementations that must be swappable at runtime (like ecommerce's `PlatformAdapter` with Shopify/WooCommerce/Magento). We have 4 scanners that we fully control — a dict + for loop achieves the same thing without the abstraction overhead.

**Why no orchestrator:** An orchestrator is a coordinator class that picks which strategies to run, runs them in order, and collects results. With 4 scanners, the `scan_job_subrouter.py` can do this directly in ~10 lines. No need for a separate class.

**Why no strategy pattern:** The strategy pattern swaps algorithms at runtime via a shared interface. Each scanner would be a "strategy" — same interface, different behavior. Overkill when a simple dict mapping does the job.

**Why no factory:** A factory decides which implementation to return based on input. Ecommerce needs this because it routes between 3 platforms × 2 connection methods × 1 ingest fallback = real complexity. We have a 1:1 mapping from scan_type string → scanner module.

### 4.2 Scanner Modules (12)

Each scanner is a single async function in its own file. Same input, same output — just convention, not enforced by inheritance.

| Scanner | ScanType | Python Libraries | What It Does | Source Material |
|---|---|---|---|---|
| `port_scan.run()` | `port_scan` | `socket`, `asyncio` | TCP connect scan, banner grabbing, service identification | Lesson 1, port_scanner.py, network_scanner.py, BHP ch2, BHR ch2 |
| `dns_scan.run()` | `dns_enum` | `dns.resolver` (dnspython) | A/AAAA/MX/NS/TXT/CNAME records, subdomain brute-force via crt.sh API, SPF/DKIM/DMARC checks | Lesson 1, Lesson 12 (OSINT), BHR ch2 subdomains.rs |
| `ssl_scan.run()` | `ssl_check` | `ssl`, `socket`, `cryptography` | Certificate validation, cipher enumeration, protocol version checks, expiry detection, chain completeness | cryptography_basics.md, BHP ch2 |
| `web_scan.run()` | `web_scan` | `httpx` | Security header checks (CSP, HSTS, X-Frame-Options, etc.), redirect analysis, server info disclosure, **directory/file discovery** (/.git/HEAD, /.env, /backup, /admin, /api/, /swagger, /wp-admin, /phpmyadmin, /server-status, robots.txt parsing) | Lesson 1, dir_buster.sh, BHR ch4 (14 HTTP modules), web_technologies.md |
| `vuln_scan.run()` | `vuln_scan` | `httpx` | CVE matching — takes service versions from port_scan output, compares against local database of known vulnerable versions. Produces KNOWN_VULNERABILITY findings with cve_id, cvss_score, cwe_id | Lesson 5, network_scanner.py (KNOWN_VULNERABILITIES dict), common_vulnerabilities.md |
| `api_scan.run()` | `api_scan` | `httpx`, `pyjwt` | JWT analysis (weak signing, expired tokens, none algorithm), GraphQL introspection detection, CORS misconfiguration, common API paths (/api/v1/, /swagger/, /openapi.json), rate limiting detection, OpenAPI/Swagger exposure | Lesson 17, web_technologies.md |
| `active_web_scan.run()` | `active_web_scan` | `httpx` | **Detection-only** (safe payloads, NOT exploitation): SQLi detection (inject `'`, check SQL errors), reflected XSS detection (inject harmless marker, check reflection), command injection detection (inject `; echo MARKER`, check output), LFI detection (test `../../../etc/passwd`), open redirect detection. **Requires active_scan_consent=True on ScanTemplate.** | Lesson 2, sql_injector.py, cmd_injector.py, Lesson 17 |
| `password_audit_scan.run()` | `password_audit` | `asyncssh`, `httpx` | Brute force on detected services (SSH, FTP, HTTP login), default credentials check (admin/admin, root/root), weak password detection. Tests against common wordlist. | Lesson 6, hash_cracker.py, BHP Ch5-6 |
| `host_audit_scan.run()` | `host_audit` | `asyncssh` | Connects via SSH (Credential entity). Checks: SUID binaries, weak file permissions, cron jobs, sudo config, exposed credentials in config/env/history, SIP status (macOS), FileVault (macOS), LaunchAgents (macOS). OS-aware (Linux vs macOS). | Lesson 4, 10, privesc_scanner.py, BHP Ch2, Ch10 |
| `cloud_audit_scan.run()` | `cloud_audit` | `boto3` (AWS), `azure-mgmt` (Azure) | Uses cloud API keys (Credential entity). Checks: S3 bucket exposure, IAM overprivileged roles, security groups, metadata service (IMDSv1), unencrypted storage, public snapshots, stale access keys. | Lesson 11 |
| `ad_audit_scan.run()` | `ad_audit` | `ldap3` | Uses domain credentials (Credential entity). 11 LDAP checks: Kerberoastable accounts (SPN), ASREPRoastable (no preauth), unconstrained delegation, constrained delegation to sensitive services, stale accounts (90+ days), disabled accounts, privileged group membership, password policy, password never expires, orphaned admins (adminCount=1), reversible encryption. No impacket — detection only via LDAP queries, no Kerberos ticket attacks. | Lesson 9, BHP Ch10 |
| `mobile_scan.run()` | `mobile_scan` | `androguard` | User uploads APK. Analyzes: hardcoded credentials, insecure data storage, missing SSL pinning, exported components, manifest permissions, debuggable flag. **File deleted immediately after scan.** | Lesson 8, apk_analyzer.py |

### 4.3 Scanner Function Signature

Every scanner follows the same convention — not enforced by ABC, just consistent by design:

```python
# server/apps/cybersecurity/scanners/port_scan.py

async def run(target: str, params: dict) -> dict:
    """
    Execute port scan against target.

    Args:
        target: The target value (IP, domain, URL)
        params: Scanner-specific parameters from ScanTemplate

    Returns:
        dict with keys:
            "findings": list[dict]  — vulnerability/issue dicts (→ Finding rows)
            "assets": list[dict]    — discovered infrastructure dicts (→ Asset rows)
            "errors": list[str]     — non-fatal errors encountered
            "duration_seconds": int — how long this scanner took
    """
    ...
```

### 4.4 How scan_job_subrouter Calls Scanners (IMPLEMENTED)

No orchestrator class. Scanner registry in `scanners/__init__.py`, dispatcher in `scan_job_subrouter.py`.

**Scanner registry** (`scanners/__init__.py`):
```python
from .external import port_scan, dns_scan, ssl_scan, web_scan, vuln_scan, api_scan, active_web_scan, password_audit_scan
from .internal import host_audit_scan, cloud_audit_scan, ad_audit_scan
from .upload import mobile_scan

SCANNERS = {
    "port_scan": port_scan.run, "dns_enum": dns_scan.run, "ssl_check": ssl_scan.run,
    "web_scan": web_scan.run, "vuln_scan": vuln_scan.run, "api_scan": api_scan.run,
    "active_web_scan": active_web_scan.run, "password_audit": password_audit_scan.run,
    "host_audit": host_audit_scan.run, "cloud_audit": cloud_audit_scan.run,
    "ad_audit": ad_audit_scan.run, "mobile_scan": mobile_scan.run,
}
```

**Dispatcher** (`scan_job_subrouter.py` → `run_scan_job(job_id)`):
```
POST /start → create ScanJob(status=pending) → asyncio.create_task(run_scan_job(job.id)) → return immediately

run_scan_job(job_id):
  1. Open own DB session (async_session() — not the request session)
  2. Load job + template + target + credential
  3. Set status = "running", started_at = now
  4. Parse scan_types (comma-separated) from template
  5. Build params dict: template fields + engine_params JSON + credential params
  6. Credential → params mapping (build_credential_params):
     - ssh_password → {ssh_username, ssh_password, ssh_port}
     - api_key → {aws_access_key_id, aws_secret_access_key, aws_region}
     - domain_credentials → {domain, dc_host, username, password, use_ssl}
  7. Pre-flight checks per scanner:
     - active_web_scan blocked without active_scan_consent=True
     - host_audit/cloud_audit/ad_audit blocked without Credential
     - mobile_scan: supports apk_file_path (upload) + apk_url (URL download)
  8. asyncio.gather(*tasks, return_exceptions=True) — parallel, partial results
  9. Fingerprint deduplication: query existing fingerprints for target →
     set is_new=False + first_found_job_id for recurring findings
  10. Bulk insert Finding + Asset rows
  11. Compute security_score (100 - penalties: critical=-15, high=-10, medium=-5, low=-2)
  12. Update severity counts + total_assets + duration_seconds
  13. Set status = "completed" (or "failed" if all scanners errored)
  14. Cleanup: delete temp APK file if downloaded from URL
```

---

## 5. Directory Structure

### 5.1 Backend

```
server/apps/cybersecurity/
├── __init__.py
├── router.py                          → Main router, ungated + gated split
├── models/                            → FISIERE pe domeniu (pattern nexotype — evita circular imports SQLAlchemy)
│   ├── __init__.py                    → Re-exports all models: from .infrastructure_models import * etc.
│   ├── mixin_models.py                → BaseMixin (imported from nexotype or local copy)
│   ├── infrastructure_models.py       → Infrastructure + Credential + ScanTarget (3 clase cu FK intre ele)
│   ├── execution_models.py            → ScanTemplate + ScanSchedule + ScanJob (3 clase cu FK intre ele)
│   ├── discovery_models.py            → Finding + Asset + Report (3 clase)
│   └── audit_models.py               → CybersecurityAuditLog (NO BaseMixin, immutable, pattern from nexotype)
│
├── schemas/                           → SUBFOLDERE pe domeniu (pattern nexotype — fisiere separate per entitate)
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   ├── infrastructure_schemas.py  → Create, Update, Detail, ListResponse, Response
│   │   ├── credential_schemas.py      → Create, Update, Detail (encrypted_value NEVER returned)
│   │   └── scan_target_schemas.py     → Create, Update, Detail + TargetType, VerificationMethod enums
│   ├── execution/
│   │   ├── __init__.py
│   │   ├── scan_template_schemas.py   → Create, Update, Detail + ScanType, PortRange, ScanSpeed enums
│   │   ├── scan_schedule_schemas.py   → Create, Update, Detail + ScheduleFrequency enum
│   │   └── scan_job_schemas.py        → Detail, ListResponse + JobStatus enum (no Create — jobs created via /start)
│   └── discovery/
│       ├── __init__.py
│       ├── finding_schemas.py         → Detail, StatusUpdate + Severity, FindingStatus, FindingCategory enums
│       ├── asset_schemas.py           → Detail + AssetType, AssetConfidence enums
│       └── report_schemas.py          → Create, Detail + ReportType, ReportFormat enums
│
├── subrouters/                        → SUBFOLDERE pe domeniu (pattern nexotype — fisiere separate per entitate)
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   ├── infrastructure_subrouter.py → CRUD (list, detail, create, update, soft-delete)
│   │   ├── credential_subrouter.py     → CRUD + POST /{id}/verify (test SSH/API key connectivity)
│   │   └── scan_target_subrouter.py    → CRUD + POST /{id}/verify (target ownership verification)
│   ├── execution/
│   │   ├── __init__.py
│   │   ├── scan_template_subrouter.py  → CRUD, filter by target_id
│   │   ├── scan_schedule_subrouter.py  → CRUD + activate/deactivate
│   │   └── scan_job_subrouter.py       → POST /start, POST /{id}/cancel, list/detail + scanner dispatcher
│   └── discovery/
│       ├── __init__.py
│       ├── finding_subrouter.py        → List/detail + PATCH /{id}/status (triage). Filters: severity, category, status.
│       ├── asset_subrouter.py          → List/detail (read-only). Filters: asset_type, scan_job_id.
│       └── report_subrouter.py         → POST /generate, list, detail, DELETE (soft delete)
├── scanners/                          → Plain async functions, organized by scan category
│   ├── __init__.py                    → SCANNERS dict registry (all 12 scanners)
│   ├── external/                      → Scanners that work from outside, no credentials needed
│   │   ├── port_scan.py               → TCP connect, banner grabbing, service ID (Lesson 1, BHP Ch2-3, BHR Ch2-3)
│   │   ├── dns_scan.py                → DNS records, subdomain brute-force, SPF/DKIM/DMARC (Lesson 1, 12)
│   │   ├── ssl_scan.py                → Certificate, ciphers, TLS versions, chain validation (BHR Ch11)
│   │   ├── web_scan.py                → Security headers, server disclosure, directory/file discovery (Lesson 1, BHP Ch5, BHR Ch4)
│   │   ├── vuln_scan.py               → CVE matching against detected service versions (Lesson 5, BHR Ch6)
│   │   ├── api_scan.py                → JWT analysis, GraphQL, CORS, rate limiting (Lesson 17, BHR Ch5-6)
│   │   ├── active_web_scan.py         → Detection-only: SQLi, XSS, LFI, cmd injection (Lesson 2, BHP Ch5-6, BHR Ch6)
│   │   └── password_audit_scan.py     → Brute force, default credentials, weak passwords (Lesson 6, BHP Ch5-6)
│   ├── internal/                      → Scanners that need credentials (SSH, API keys, domain)
│   │   ├── host_audit_scan.py         → Privilege escalation, SUID, cron, permissions via SSH (Lesson 4, 10, BHP Ch2, Ch10)
│   │   ├── cloud_audit_scan.py        → S3 buckets, IAM, security groups via cloud API keys (Lesson 11)
│   │   └── ad_audit_scan.py           → AD enumeration, Kerberoasting via domain credentials (Lesson 9)
│   └── upload/                        → Scanners that analyze uploaded files
│       └── mobile_scan.py             → APK analysis — upload, scan, delete immediately (Lesson 8)
├── surrealdb/                         → Graph layer — polyglot persistence (nexotype pattern)
│   ├── db.py                          → SurrealDB connection management
│   ├── sync_service.py                → PostgreSQL → SurrealDB entity + relationship sync
│   └── subrouters/
│       ├── discovery_subrouter.py     → Graph traversal queries (attack paths, blast radius)
│       ├── sync_subrouter.py          → Manual full/incremental sync triggers
│       └── health_subrouter.py        → Connection health + sync status
├── utils/
│   ├── dependency_utils.py            → get_user_target(), require_active_subscription
│   ├── subscription_utils.py          → Tier constants, limits, is_service_active()
│   └── encryption_utils.py            → Fernet encrypt/decrypt for Credential.encrypted_value
│                                        Same pattern as ecommerce/utils/encryption_utils.py:
│                                        get_encryption_key() → SHA-256(SECRET_KEY)
│                                        encrypt_value(plaintext) → Fernet encrypt → base64
│                                        decrypt_value(encrypted) → base64 → Fernet decrypt
│                                        Used by: credential_subrouter (encrypt on create/update),
│                                        scanner dispatcher (decrypt before passing to internal scanners)
└── rust/                              → Rust modules via PyO3 for heavy computing (future)
    └── README.md                      → Architecture: Rust functions compiled as Python modules
                                         via PyO3/maturin. Same function signature as Python scanners.
                                         Candidates for Rust rewrite:
                                         - Port scanning (asyncio.open_connection → tokio TcpStream)
                                         - Password brute force (hash computation)
                                         - Banner parsing (regex on large datasets)
                                         Pattern: Python scanner calls Rust module if available,
                                         falls back to pure Python if not compiled.
                                         Reference: BHR Ch2-3 (rayon, tokio), domain-architecture §4D.
```

### 5.2 Frontend

```
client/src/modules/cybersecurity/
├── schemas/
│   ├── scan-targets.schemas.ts
│   ├── scan-templates.schemas.ts
│   ├── scan-schedules.schemas.ts
│   ├── scan-jobs.schemas.ts
│   ├── findings.schemas.ts
│   ├── assets.schemas.ts
│   └── reports.schemas.ts
├── utils/
│   └── api.endpoints.ts               → URL constants: /cybersecurity/scan-targets, etc.
├── service/
│   ├── scan-targets.service.ts
│   ├── scan-templates.service.ts
│   ├── scan-schedules.service.ts
│   ├── scan-jobs.service.ts
│   ├── findings.service.ts
│   ├── assets.service.ts
│   └── reports.service.ts
├── store/
│   ├── scan-targets.store.ts
│   ├── scan-templates.store.ts
│   ├── scan-schedules.store.ts
│   ├── scan-jobs.store.ts
│   ├── findings.store.ts
│   ├── assets.store.ts
│   └── reports.store.ts
├── providers/
│   ├── scan-targets-provider.tsx
│   ├── scan-templates-provider.tsx
│   ├── scan-schedules-provider.tsx
│   ├── scan-jobs-provider.tsx
│   ├── findings-provider.tsx
│   ├── assets-provider.tsx
│   └── reports-provider.tsx
└── hooks/
    ├── use-scan-targets.ts
    ├── use-scan-templates.ts
    ├── use-scan-schedules.ts
    ├── use-scan-jobs.ts
    ├── use-findings.ts
    ├── use-assets.ts
    └── use-reports.ts

client/src/app/(cybersecurity)/
├── layout.tsx                          → CybersecurityProviders + sidebar + breadcrumbs
├── scan-targets/
│   └── page.tsx
├── scan-templates/
│   └── page.tsx
├── scan-schedules/
│   └── page.tsx
├── scan-jobs/
│   └── page.tsx
├── findings/
│   └── page.tsx
├── assets/
│   └── page.tsx
├── reports/
│   └── page.tsx
└── dashboard/
    └── page.tsx                        → Summary dashboard (Phase 4)
```

---

## 6. Router Gating Pattern

Replicates the ecommerce pattern: ungated + gated split.

```python
# server/apps/cybersecurity/router.py

router = APIRouter(prefix="/cybersecurity")

# Ungated — no subscription check (none needed for MVP, all endpoints are authenticated)
# Reserved for future: webhook receivers, public report sharing, etc.

# Gated — everything requires active subscription
# Why no enforce_rate_limit here: Rate limiting is per-endpoint on write operations only.
# GET requests (list, detail, dashboard) are NOT rate limited — users must navigate freely.
# Rate limit applied inline on: POST /scan-jobs/start, POST /reports/generate.
# Pattern: assetmanager rate_limiter.check() per-endpoint, not router-level.
gated = APIRouter(dependencies=[Depends(require_active_subscription)])

# Target management
gated.include_router(scan_targets_router)
gated.include_router(scan_templates_router)
gated.include_router(scan_schedules_router)

# Scan execution
gated.include_router(scan_jobs_router)

# Results
gated.include_router(findings_router)
gated.include_router(assets_router)

# Reports
gated.include_router(reports_router)

router.include_router(gated)
```

**Key difference from ecommerce:** No ungated routes in MVP. Ecommerce needed ungated routes for OAuth callbacks, webhook receivers, and public widget delivery. Cybersecurity has no external platform integrations — all endpoints are authenticated + subscription-gated.

---

## 7. Design Decisions Summary

| Decision | Choice | Why |
|---|---|---|
| App name | `cybersecurity` | Clear, descriptive. Matches domain language. |
| Finding has no BaseMixin | Append-only bulk data | Scanner writes once, never user-edited. Same pattern as ecommerce's APIUsageTracking. |
| Asset has no BaseMixin | Append-only bulk data | Scanner discovers infrastructure, writes once. Upsert prevents duplicates. |
| No PG enums in DB | String(50) columns | Consistent with all sibling projects. Python enums in Pydantic schemas only. |
| scan_types as comma-separated string | Not PG array | Keeps PostgreSQL simple. Parsed in Python. |
| Report content in DB (Text) | Not file storage | MVP simplicity. S3/local file storage is a Phase 4 optimization. |
| Verification before scanning | Legal/ethical requirement | Cannot allow scanning targets you don't own. DNS TXT, file upload, or meta tag verification. |
| ScanJob.schedule_id SET NULL on delete | Preserve history | Deleted schedules should not cascade-delete historical scan results. |
| Separate Finding.category and Finding.finding_type | UI grouping vs specific check | Category groups findings in lists/charts, finding_type is the specific vulnerability ID. |
| ScanTemplate per-target, not global | Isolation | Templates are target-specific because scan parameters depend on target type (domain vs IP vs URL). |
| Plain scanner functions, no engine pattern | Simple > complex | 4 scanners we fully control don't need ABC/orchestrator/factory. A dict + for loop in the subrouter does the same job. |
| Polyglot persistence (PostgreSQL + SurrealDB) | Graph queries for attack paths | PostgreSQL is source of truth for CRUD. SurrealDB is a read-only graph cache for complex traversals that are expensive/awkward in SQL. Same pattern as nexotype. |
| SurrealDB sync, not dual-write | Data consistency | Write to PostgreSQL first, then sync to SurrealDB. Never write to SurrealDB directly. If SurrealDB sync fails, PostgreSQL still has the data — graph cache can be rebuilt at any time. |
| Rust via PyO3 (future) | Performance optimization | Port scanning is the most I/O + CPU intensive scanner. When Python's asyncio becomes a bottleneck, rewrite `port_scan.py` as a Rust module exposed via PyO3. Same function signature (`async def run(target, params) → dict`), just faster internals. Not needed for MVP — pure Python handles it fine at initial scale. |
| Infrastructure entity | Business context layer | Same pattern as Entity in FinPy (Organization → Entity → children). Without it, findings are raw technical data. With it, findings have environment, criticality, and owner — enabling risk prioritization, contextual compliance reports, and executive dashboards. Optional FK from ScanTarget — user can scan without describing infrastructure first. |
| Infrastructure.infrastructure_id nullable on ScanTarget | Gradual adoption | Users can start scanning immediately without describing infrastructure. They can add business context later. SET NULL on delete — targets survive infrastructure cleanup. |
| Finding fingerprint for dedup | SHA-256 hash of location + type | Recurring scans need "new vs recurring" distinction. Without this, scan counts balloon and dashboards are noise. Powers "New Vulnerabilities" vs "All Vulnerabilities" dashboard cards. |
| Security score on ScanJob | 0-100, computed at completion | Executives need a single number for board reporting. Cached on ScanJob to avoid recomputation. Enables trend tracking across scans. |
| Finding.resolved_by | Audit trail | Compliance audits (NIS2, SOC2, ISO27001) require proof of who fixed what and when. status_changed_at tracks when, resolved_by tracks who. |
| No RemediationTask entity | Finding.status is sufficient | Task tracking belongs in JIRA/Linear. Building task management inside a security platform duplicates existing tools. Finding triage (open → acknowledged → resolved → false_positive) handles the core workflow. |
| No Knowledge Base entity | Finding.description + remediation | Per-finding guidance is more actionable than a generic article library. Content management is a separate product. |
| No AssetInventory entity (CMDB) | Infrastructure + scan-discovered Asset | Infrastructure entity captures what user OWNS (manual, business context). Asset entity captures what scanner FINDS (automatic, technical). Together they cover what Intrudify calls "Assets Management" without building a full CMDB. |
| 7 production scanners | Port, DNS, SSL, Web, Vuln, API, Active Web | Production product needs comprehensive coverage. 4 scanners = discovery tool. 7 scanners = security platform. Based on lessons 1, 2, 5, 17, BHP, BHR, and Intrudify competitor analysis. |
| Active scanning requires consent | active_scan_consent Boolean on ScanTemplate | Active payloads (SQLi, XSS, cmd injection) can trigger WAF blocks, security alerts, or affect production. User must explicitly authorize. Detection-only approach — confirms vulnerability exists without exploiting it. |
| Compliance metadata on Finding | cwe_id, owasp_category, mitre_tactic, mitre_technique | SOC2/ISO27001 audits require standard vulnerability classification. CWE maps to Common Weakness Enumeration. OWASP maps to Top 10. MITRE ATT&CK maps to kill chain. Without these, reports are not audit-ready. |
| Deep discovery metadata on Asset | service_metadata (Text/JSON) | Full banners, cipher suites, SSH key fingerprints, HTTP headers enable blast radius analysis in SurrealDB graph layer. A port number and service name alone are not actionable. |
| Detection not exploitation | Active web scanner confirms vuln exists, does not exploit | Exploitation risks breaking production systems, corrupting data, or triggering legal issues. Safe payloads (inject `'`, check for SQL error response) are sufficient for vulnerability confirmation in reports. |
| engine_params on ScanTemplate | JSON text for scanner-specific overrides | Custom wordlists, headers, and paths needed for API scanning and enterprise use cases. Enables flexibility without adding new fields for every scanner parameter. |
| Credential entity separate from Infrastructure | Fernet-encrypted, reusable across infrastructure | Credentials can apply to multiple infrastructure items. Storing on Infrastructure would duplicate sensitive data. Same pattern as ecommerce WidgetAPIKey (separate from EcommerceConnection). |
| 12 production scanners | 7 external + 1 password + 3 internal (SSH/API/domain) + 1 upload (mobile) | ESPM platform needs comprehensive coverage: external scanning, internal audit, cloud audit, AD audit, mobile analysis. |
| ScanJob.execution_point | "cloud" (default) or "remote_agent" (future) | Prepares architecture for agent-based scanning (wireless Lesson 7, internal network). No agent infrastructure yet but DB schema is ready. |
| Finding.remediation_script | Copiable fix command separate from remediation text | Remediation is explanation, remediation_script is actionable (chmod, nginx config, AWS CLI). User copies and applies directly. |
| Mobile scan: upload, scan, delete | No permanent file storage | APK uploaded for analysis, findings extracted, file deleted immediately. Legal and storage simplicity — no user data retention. |
| encryption_utils.py | Fernet (AES-128-CBC), key from SHA-256(SECRET_KEY) | Same exact pattern as ecommerce/utils/encryption_utils.py. Single encrypt/decrypt point. Credential subrouter encrypts on create/update, scanner dispatcher decrypts before passing to internal scanners. |
| Scanner folder structure | external/ internal/ upload/ | Organized by scan category (needs no credentials, needs credentials, needs file upload). Not by lesson number. Clear separation of security boundaries. |
| credential_id on ScanTemplate | Direct FK instead of traversing Infrastructure→Credential | Explicit credential selection per template. Avoids 3-JOIN traversal (ScanJob→ScanTarget→Infrastructure→Credential) and ambiguity when Infrastructure has multiple credentials of different types. User picks "which SSH key" when creating template. |
| v1 Modular Monolith over v2 Microservices | FastAPI + PostgreSQL + SurrealDB | PostgreSQL handles tens of millions of rows with proper indexes. asyncio handles thousands of concurrent I/O connections. scanner_map[type]() can be replaced with redis_queue.publish() in 5 lines when needed. v2 (Kafka, Elasticsearch, worker nodes) would take 4-6 months of infra setup for zero benefit at current scale. |
| Rust via PyO3 (future) | Optional performance modules | Port scanning, password brute force, banner parsing — CPU/IO intensive. Rust module compiled via maturin, imported in Python. Same function signature. Python fallback if Rust not compiled. Reference: BHR Ch2-3 (rayon, tokio). |

---

## 8. SurrealDB Graph Layer

### 8.1 Overview — Polyglot Persistence

Same architecture as `nexotype/surrealdb/` and `nexotype/neo4j/`:
- **PostgreSQL:** Source of truth. All CRUD operations write here. Simple queries (list findings by severity, get scan job details) run here.
- **SurrealDB:** Read-only graph cache. Complex traversals (attack paths, blast radius, attack surface mapping) run here. Rebuilt from PostgreSQL at any time.
- **Sync direction:** PostgreSQL → SurrealDB. Never the reverse. If SurrealDB is empty or corrupted, full sync rebuilds it.

**Why SurrealDB over Neo4j:** SurrealDB is already used in nexotype. Same connection patterns, same SDK, same team familiarity. SurrealDB also supports document + graph in one — no need for separate document store.

**Why graph for cybersecurity:** Scanning data is inherently a graph. Hosts run services, services have vulnerabilities, vulnerabilities lead to other vulnerabilities (attack chains). Graph traversals answer questions that require recursive JOINs in SQL — "if this SSH service is compromised, what else can the attacker reach?" is a 1-line graph query vs a CTE in PostgreSQL.

### 8.2 Node Types (PostgreSQL entities → SurrealDB tables)

Not all 9 entities become nodes. Only the ones that participate in graph relationships:

| PostgreSQL Entity | SurrealDB Table | Why Node / Not Node |
|---|---|---|
| Infrastructure | `infrastructure` | Node — business context anchor. Links technical findings to environment, criticality, owner. Enables "show me critical findings on production infrastructure" queries. |
| ScanTarget | `scan_target` | Node — scan entry point. All scans start from a target. |
| ScanJob | `scan_job` | Node — connects targets to their discovered findings/assets. |
| Finding | `finding` | Node — vulnerabilities are the primary query subject in graph traversals. |
| Asset | `asset` | Node — hosts, services, technologies, certs, DNS records form the infrastructure graph. |
| Credential | — | **NEVER a node — sensitive data (encrypted keys, passwords) MUST NOT enter SurrealDB.** |
| ScanTemplate | — | Not a node — configuration data, not part of the infrastructure graph. |
| ScanSchedule | — | Not a node — scheduling metadata, not part of the infrastructure graph. |
| Report | — | Not a node — generated output, not part of the infrastructure graph. |

### 8.3 Edge Types (Relationships between nodes)

```
infrastructure ──OWNS_TARGET──→ scan_target
    Properties: linked_at (DateTime)
    Why: Visualize which scan targets belong to which piece of infrastructure.
    Example: Infrastructure("Production Web Server") ──OWNS_TARGET──→ ScanTarget("cystene.com")

finding ──CRITICAL_FOR──→ infrastructure
    Properties: severity (String), environment (String), criticality (String)
    Why: Direct correlation between a technical vulnerability and business impact.
    Enables: "Show me all critical findings affecting production infrastructure owned by Backend Team"
    Example: Finding("OpenSSH CVE-2016-6210") ──CRITICAL_FOR──→ Infrastructure("Production Web Server", critical, Backend Team)

scan_target ──SCANNED_BY──→ scan_job
    Properties: triggered_at (DateTime)

scan_job ──DISCOVERED──→ asset
    Properties: discovered_at (DateTime)

scan_job ──FOUND──→ finding
    Properties: discovered_at (DateTime)

finding ──AFFECTS──→ asset
    Properties: severity (String), confidence (String)
    Why: Links a vulnerability to the specific infrastructure it affects.
    Example: Finding("OpenSSH 7.2 CVE-2016-6210") ──AFFECTS──→ Asset(service:"OpenSSH 7.2" on port 22)

asset(host) ──RUNS──→ asset(service)
    Properties: port (Integer), protocol (String)
    Why: Maps which services run on which hosts.
    Example: Asset(host:"192.168.1.10") ──RUNS──→ Asset(service:"nginx/1.24.0")

asset(service) ──USES──→ asset(technology)
    Properties: detected_by (String)
    Why: Maps technology dependencies.
    Example: Asset(service:"nginx") ──USES──→ Asset(technology:"OpenSSL 3.0.2")

asset(host) ──HAS_CERT──→ asset(certificate)
    Properties: port (Integer)
    Why: Maps which SSL certificates are served by which hosts.
    Example: Asset(host:"example.com") ──HAS_CERT──→ Asset(certificate:"*.example.com expires 2025-06-01")

asset(host) ──HAS_RECORD──→ asset(dns_record)
    Properties: record_type (String)
    Why: Maps DNS resolution.
    Example: Asset(host:"example.com") ──HAS_RECORD──→ Asset(dns_record:"A → 93.184.216.34")

finding ──LEADS_TO──→ finding
    Properties: attack_step (Integer), description (String)
    Why: Attack chain modeling — one vulnerability enables exploitation of another.
    Example: Finding("exposed SSH") ──LEADS_TO──→ Finding("privilege escalation via sudo misconfiguration")
```

### 8.4 Graph Relationship Diagram

```
┌──────────────────┐
│  infrastructure   │ ← business context (environment, criticality, owner)
└────────┬─────────┘
         │ OWNS_TARGET
         ▼
  ┌──────────────┐
  │  scan_target  │
  └──────┬───────┘
         │ SCANNED_BY
         ▼
  ┌──────────────┐
  │   scan_job    │
  └──┬────────┬──┘
     │        │
FOUND│        │DISCOVERED
     ▼        ▼
┌────────┐  ┌────────┐
│finding  │  │ asset   │
└──┬──┬──┘  └──┬──┬──┘
   │  │        │  │
   │  │AFFECTS │  │RUNS/USES/HAS_CERT/HAS_RECORD
   │  └───────→│  └──→ asset (subtypes: host, service, tech, cert, dns)
   │           │
   │LEADS_TO   │
   └──→finding │
               │
   CRITICAL_FOR│
   ┌───────────┘
   ▼
┌──────────────────┐
│  infrastructure   │ ← finding loops back to business impact
└──────────────────┘
```

### 8.5 Sync Service

Follows the exact pattern from `nexotype/surrealdb/sync_service.py`:

```python
# server/apps/cybersecurity/surrealdb/sync_service.py

class CyberSyncService:
    """
    Syncs cybersecurity entities from PostgreSQL → SurrealDB.
    Read-only cache — SurrealDB is never the source of truth.
    """

    # --- Entity sync ---
    async def sync_entity(self, entity_type: str, entity: dict) -> None:
        """Sync a single entity to SurrealDB. Creates or updates the node."""
        # SurrealDB SDK: await surreal.create(f"{table}:{uid}", properties)

    # --- Relationship sync ---
    async def sync_relationship(self, from_type: str, from_id: int, rel_type: str, to_type: str, to_id: int, properties: dict) -> None:
        """Create an edge between two nodes using SurrealQL RELATE."""
        # SurrealQL: RELATE scan_target:1 -> SCANNED_BY -> scan_job:5

    # --- Full sync ---
    async def full_sync(self, db: AsyncSession) -> dict:
        """
        Complete PostgreSQL → SurrealDB migration.
        1. Clear all SurrealDB data
        2. Sync all scan_targets, scan_jobs, findings, assets
        3. Sync all relationships (SCANNED_BY, FOUND, DISCOVERED, AFFECTS, RUNS, USES, etc.)
        4. Return counts per entity type
        """

    # --- Incremental sync ---
    async def incremental_sync(self, db: AsyncSession, since: datetime) -> dict:
        """Sync only records created/modified since given datetime."""

    # --- Graph queries ---
    async def get_attack_surface(self, target_id: int, depth: int = 3) -> dict:
        """
        Traverse from scan_target through all discovered assets and findings.
        Returns the full attack surface graph for a target.
        SurrealQL: SELECT ->SCANNED_BY->scan_job->DISCOVERED->asset, ->SCANNED_BY->scan_job->FOUND->finding FROM scan_target:id FETCH ...
        """

    async def get_blast_radius(self, finding_id: int, depth: int = 2) -> dict:
        """
        From a finding, traverse AFFECTS → asset → RUNS → asset to find all
        infrastructure impacted by this vulnerability.
        """

    async def find_attack_paths(self, target_id: int) -> list:
        """
        Find chains of findings connected by LEADS_TO edges.
        Each chain represents a potential multi-step attack path.
        """

    async def find_shared_certificates(self, cert_value: str) -> list:
        """
        Find all hosts that share a given SSL certificate (certificate reuse detection).
        Reverse traversal: asset(certificate) ←HAS_CERT← asset(host)
        """

    async def find_recurring_findings(self, target_id: int) -> list:
        """
        Compare findings across multiple scan_jobs for the same target.
        Identifies vulnerabilities that persist across scans (not being fixed).
        """

    # --- Infrastructure-aware queries (business context) ---

    async def get_critical_production_findings(self, organization_id: int) -> list:
        """
        Find all critical/high findings on production infrastructure.
        Traversal: infrastructure(environment=production, criticality=critical)
            ←CRITICAL_FOR← finding(severity=critical OR high)
        This is the executive dashboard query — "what needs fixing NOW".
        """

    async def get_infrastructure_risk_map(self, organization_id: int) -> dict:
        """
        For each infrastructure item, count findings by severity.
        Returns: {infrastructure_id: {name, environment, criticality, owner, findings: {critical: N, high: N, ...}}}
        Enables risk heatmap visualization on dashboard.
        """

    async def get_owner_exposure(self, owner: str) -> list:
        """
        Find all findings affecting infrastructure owned by a specific team/person.
        Traversal: infrastructure(owner=X) ──OWNS_TARGET──→ scan_target ──SCANNED_BY──→ scan_job ──FOUND──→ finding
        Enables: "Backend Team has 12 critical findings across 3 servers"
        """
```

### 8.6 Discovery Subrouter — Graph Query Endpoints

```python
# server/apps/cybersecurity/surrealdb/subrouters/discovery_subrouter.py

# GET /cybersecurity/graph/attack-surface/{target_id}?depth=3
#   → Full attack surface visualization for a target

# GET /cybersecurity/graph/blast-radius/{finding_id}?depth=2
#   → All infrastructure affected by a specific vulnerability

# GET /cybersecurity/graph/attack-paths/{target_id}
#   → Multi-step attack chains (finding → finding → finding)

# GET /cybersecurity/graph/shared-certs/{cert_value}
#   → All hosts sharing a certificate

# GET /cybersecurity/graph/recurring-findings/{target_id}
#   → Findings that appear across multiple scans (not being remediated)

# GET /cybersecurity/graph/critical-production
#   → All critical/high findings on production infrastructure (executive dashboard)

# GET /cybersecurity/graph/risk-map
#   → Per-infrastructure findings count by severity (risk heatmap)

# GET /cybersecurity/graph/owner-exposure/{owner}
#   → All findings affecting infrastructure owned by a specific team/person
```

### 8.7 When SurrealDB Sync Happens

| Event | Sync Action |
|---|---|
| Infrastructure created/updated | Sync infrastructure node + OWNS_TARGET edges to SurrealDB |
| ScanTarget linked to Infrastructure | Create/update OWNS_TARGET edge |
| Scan job completes | Sync new findings + assets + relationships + CRITICAL_FOR edges to SurrealDB |
| Finding triage status changes | Update finding node properties in SurrealDB |
| Manual sync trigger (admin) | Full or incremental sync via sync_subrouter |
| SurrealDB data loss/corruption | Full sync rebuilds everything from PostgreSQL |

### 8.8 What SurrealDB Does NOT Do

- **No writes originate from SurrealDB** — it is always a cache of PostgreSQL data
- **No CRUD operations** — creating/updating/deleting entities always goes through PostgreSQL subrouters first
- **No scan execution** — scanners write to PostgreSQL, sync service propagates to SurrealDB
- **No auth/user management** — graph queries are gated by the same subscription middleware as all other endpoints
- **No Credential data** — encrypted credentials (SSH keys, API keys, passwords) MUST NEVER be synced to SurrealDB. Only Infrastructure metadata (name, type, environment, criticality, owner) is synced — never sensitive credential values.

---

## 9. Architecture Notes — v1 vs v2

### 9.1 Current Architecture (v1 — Modular Monolith)

```
Client (Next.js) → FastAPI Server → PostgreSQL (source of truth)
                                   → SurrealDB (graph cache, read-only)
                                   → DragonflyDB (cache, rate limiting)
```

- **Scanners run in-process** — asyncio.create_task() in FastAPI background
- **All data in PostgreSQL** — findings, assets, credentials, everything
- **SurrealDB** — read-only graph cache for attack paths, blast radius
- **DragonflyDB** — Redis-compatible cache (already used in ecommerce for recommendations + rate limiting). 25x faster than Redis, drop-in replacement, same `redis.asyncio` library.

### 9.2 Hypothetical v2 (Hyper-Scale — Event-Driven Microservices)

```
Client → FastAPI (API Gateway only) → Message Broker (DragonflyDB Streams / custom queue)
                                           ↓
                                     Scanner Workers (Rust/Go containers)
                                           ↓
                                     PostgreSQL (metadata) + Elasticsearch (findings/assets full-text)
                                           ↓
                                     SurrealDB (graph)
```

- **FastAPI becomes API gateway only** — writes ScanJob status='pending', publishes ScanRequested event to queue
- **Scanner Workers** — separate containers consuming from queue, running scans, publishing FindingsDiscovered events back
- **Elasticsearch/OpenSearch** — replaces PostgreSQL for Finding/Asset storage. Optimized for full-text search across millions of banners, headers, certificates
- **DragonflyDB Streams** — replaces Kafka as message broker. We already have DragonflyDB in the stack. DragonflyDB supports Redis Streams (XADD/XREAD) which work like a lightweight Kafka — ordered, persistent, consumer groups. No need for separate Kafka cluster.

### 9.3 Why v1 is Correct Now

| Argument | Why v1 wins |
|---|---|
| **PostgreSQL handles the scale** | Tens of millions of rows with proper indexes (fingerprint, scan_job_id, severity). Partitioning by scan_job_id if needed later. No need for Elasticsearch. |
| **asyncio handles the concurrency** | Scanning is 99% I/O bound (waiting for network responses). One Python process with asyncio holds thousands of concurrent connections. Not CPU bound — no need for worker containers. |
| **DragonflyDB already in stack** | Already used in ecommerce (cache_utils.py). If we need a message queue later, DragonflyDB Streams (XADD/XREAD) give us Kafka-like semantics without a new service. Same Coolify container. |
| **SurrealDB gives us graph intelligence** | Attack paths, blast radius, shared certificates — enterprise-level queries without microservices. Already proven in nexotype. |
| **Operational simplicity** | v1: 1 FastAPI + 1 PostgreSQL + 1 SurrealDB + 1 DragonflyDB = 4 services on Coolify. v2: + Elasticsearch cluster + N worker containers + monitoring = 10+ services. |
| **5-line migration path** | When v1 hits limits, replace `scanner_map[type](target)` with `dragonfly.xadd("scan_queue", {"type": type, "target": target})`. Scanner code stays the same — just runs in a worker instead of in-process. |

### 9.4 Why NOT v2 Now

| Argument | Why v2 would hurt |
|---|---|
| **4-6 months of infra setup** | Kubernetes/Docker orchestration, worker auto-scaling, dead letter queues, retry logic, health checks, log aggregation — all before writing a single scanner. |
| **Zero customers** | Optimizing for 10,000 companies when you have zero is the definition of premature optimization. |
| **Elasticsearch is redundant** | SurrealDB already supports full-text search (SEARCH analyzer). PostgreSQL has GIN indexes for text search. Adding a third search engine is waste. |
| **Kafka is overkill** | DragonflyDB Streams (already in our stack) provide ordered, persistent message delivery with consumer groups. Kafka adds ZooKeeper, schema registry, partition management — operational nightmare for a small team. |

### 9.5 When to Migrate to v2

Migrate when ANY of these happen:
- asyncio event loop becomes CPU bottleneck (port scanning > 10,000 concurrent targets)
- PostgreSQL Finding/Asset tables exceed 100M rows and queries slow down despite indexes
- Customer requires on-premise scanning (needs agent/worker architecture)
- Team grows to 5+ backend engineers who can own separate services

**Migration is surgical, not a rewrite:**
1. Add DragonflyDB Stream consumer (scanner worker) — same scanner code, different entry point
2. Replace `asyncio.create_task(scanner())` with `dragonfly.xadd("scan_queue", job_data)`
3. Move Finding/Asset writes to batch inserts from worker
4. Done — FastAPI stays the same, scanners stay the same, just the orchestration changes

### 9.6 Technology Stack Summary

| Component | v1 (Now) | v2 (Future if needed) | Already in Stack? |
|---|---|---|---|
| API Server | FastAPI (in-process scanners) | FastAPI (API gateway only) | ✅ Yes |
| Database | PostgreSQL (all data) | PostgreSQL (metadata only) | ✅ Yes |
| Graph | SurrealDB (read-only cache) | SurrealDB (same) | ✅ Yes (nexotype) |
| Cache + Rate Limiting | DragonflyDB | DragonflyDB (same) | ✅ Yes (ecommerce cache_utils.py) |
| Message Queue | — (not needed) | DragonflyDB Streams (XADD/XREAD) | ✅ DragonflyDB already deployed |
| Full-text Search | PostgreSQL GIN / SurrealDB SEARCH | Elasticsearch/OpenSearch | ❌ Not needed — SurrealDB covers it |
| Scanner Workers | — (in-process asyncio) | Rust/Go containers | ❌ Not needed — asyncio is sufficient |
| Encryption | Fernet (ecommerce pattern) | Fernet (same) | ✅ Yes (encryption_utils.py) |

---

## 10. Subscription, Pricing & Access Control

### 10.1 Tier Model

Hybrid: monthly subscription (access + feature gating) + scan credits (usage). Prices are starting points — structure matters more than exact numbers.

| Tier | Price | Targets | Scans/month | Scanners | Scheduled Scans | Reports | Rate Limit |
|---|---|---|---|---|---|---|---|
| **FREE** | $0 | 1 | 20 | External only (port, dns, ssl, web, vuln, api, active_web, password) | ❌ | Basic HTML | 10 req/min |
| **PRO** | $49/mo | 10 | 500 | + internal (host_audit, cloud_audit, mobile_scan) | ✅ daily/weekly | PDF + compliance | 60 req/min |
| **ENTERPRISE** | $199/mo | Unlimited | 5,000 | + ad_audit (all 12 scanners) | ✅ hourly/daily/weekly/monthly | All + delta + executive | 300 req/min |
| **CUSTOM** | Contact | Custom | Custom | Custom | Custom | Custom | Custom |

**What is a scan credit?** 1 scanner execution = 1 credit. A ScanJob with scan_types="port_scan,dns_enum,ssl_check" = 3 credits. Monthly reset on 1st of each month.

**Why these choices:**
- FREE has ALL external scanners — the hook is seeing findings, not being limited on what you can scan. If user can't run vuln_scan or ssl_check, they don't understand the product's value.
- PRO unlocks internal scanning (SSH, cloud) — this is what makes customers pay. External scanning is commodity, internal scanning is value.
- AD audit = ENTERPRISE only — most sensitive (domain credentials), most valuable, enterprise-only use case.
- 1 target on FREE — forces upgrade quickly for real usage. 20 scans/month = enough for 4-5 complete scans to evaluate.
- Prices are intentionally low to start — easier to raise than lower.

### 10.2 Feature Gating by Tier

| Feature | FREE | PRO | ENTERPRISE |
|---|---|---|---|
| External scanners (port, dns, ssl, web, vuln, api, active_web, password) | ✅ | ✅ | ✅ |
| Internal scanners (host_audit, cloud_audit) | ❌ | ✅ | ✅ |
| AD audit scanner | ❌ | ❌ | ✅ |
| Mobile scanner (APK upload) | ❌ | ✅ | ✅ |
| Credential management | ❌ | ✅ | ✅ |
| Infrastructure items | 1 | 10 | Unlimited |
| Scheduled scans | ❌ | ✅ daily/weekly | ✅ all frequencies |
| Compliance reports (SOC2, ISO27001, NIS2) | ❌ | ✅ | ✅ |
| Executive summary reports | ❌ | ❌ | ✅ |
| Delta reports (diff between scans) | ❌ | ❌ | ✅ |
| SurrealDB graph queries (attack paths, blast radius) | ❌ | ✅ | ✅ |
| API access (programmatic scanning) | ❌ | ✅ | ✅ |
| Scan result caching (DragonflyDB) | Basic | Full | Full |

### 10.3 Utils to Implement

4 utility files, each following established patterns from sibling modules:

**`subscription_utils.py`** — Pattern: ecommerce/utils/subscription_utils.py
```python
TIER_ORDER = ["FREE", "PRO", "ENTERPRISE", "CUSTOM"]

TIER_LIMITS = {
    "FREE": {
        "monthly_scan_credits": 20,
        "max_infrastructure": 1,
        "max_targets": 1,
        "max_credentials": 0,
        "max_schedules": 0,
        "requests_per_minute": 10,
        "requests_per_hour": 200,
        "allowed_scan_types": ["port_scan", "dns_enum", "ssl_check", "web_scan", "vuln_scan", "api_scan", "active_web_scan", "password_audit"],
        "allowed_report_types": ["full"],
        "allowed_schedule_frequencies": [],
    },
    "PRO": { ... },      # 500 credits, 10 targets, + internal scanners, daily/weekly scheduling
    "ENTERPRISE": { ... }, # 5000 credits, unlimited, all scanners, all frequencies
}

# Functions:
# get_org_subscription(org_id, db) → Subscription
# get_org_tier(subscription) → str
# tier_is_sufficient(current, required) → bool
# get_tier_limits(tier) → dict
# get_monthly_scan_credits_used(org_id, db) → int
# is_service_active(org_id, db) → bool
# is_scan_type_allowed(scan_type, tier) → bool
```

**`rate_limiting_utils.py`** — Pattern: exact copy ecommerce/utils/rate_limiting_utils.py
- Dual backend: "memory" (dev) / "dragonfly" (production)
- Sliding window: per-minute + per-hour
- `check_rate_limit(org_id, tier)` → True or raises 429
- DragonflyDB already deployed on Coolify
- **NOT applied at router level** — only called inline on resource-heavy POST endpoints (start scan, generate report). Pattern: assetmanager per-endpoint rate_limiter.check().

**`dependency_utils.py`** — Pattern: ecommerce + assetmanager combined
```python
# Router-level dependencies:
# require_active_subscription() — blocks ALL requests when inactive. 7-day grace period.
# enforce_scan_credit_limit() — blocks POST /start if monthly credits exceeded
# enforce_scan_type_access(scan_types) — blocks if scan_type not in tier's allowed list
#
# NOTE: enforce_rate_limit() exists but is NOT used at router level.
# Rate limiting is per-endpoint on POST /scan-jobs/start and POST /reports/generate.
# Why: GET requests (dashboard, list, detail) must not be rate limited — user navigates freely.
# get_user_organization_id(user, db) → int
# get_user_target(user, target_id, db) → ScanTarget (ownership + soft-delete check)
```

**`audit_utils.py`** — Pattern: exact copy assetmanager/utils/audit_utils.py + nexotype/utils/audit_utils.py
```python
# model_to_dict(instance) → JSON-serializable dict (handles Decimal, datetime, date)
# log_audit(db, org_id, user_id, table_name, record_id, action, old_data, new_data, ip_address)
# get_record_audit_logs(db, table_name, record_id) → list
# get_organization_audit_logs(db, org_id) → list
```

### 10.4 CybersecurityAuditLog

Separate model in `models/audit_models.py`. Same pattern as `NexotypeAuditLog` and `AssetManagerAuditLog`.

```python
class CybersecurityAuditLog(Base):
    """
    Tracks all data changes across cybersecurity models.
    No BaseMixin — audit rows are immutable. No soft delete, no updated_by.
    Loose coupling to accounts (integer IDs, no FKs).

    Why separate from AccountsAuditLog: cybersecurity audit is more sensitive
    (who added SSH key, who deleted credential, who marked finding as resolved).
    Must be queryable independently for SOC2/ISO27001 compliance.
    """
    __tablename__ = "cybersecurity_audit_logs"

    id                  Integer, PK, index
    organization_id     Integer, nullable              # Loose coupling — no FK to accounts
    user_id             Integer, nullable              # Loose coupling — no FK to accounts
    table_name          String(50), nullable           # "infrastructure", "credentials", "scan_targets"
    record_id           Integer, nullable              # ID of affected record
    action              Text, not null                 # "INSERT", "UPDATE", "DELETE"
    old_data            JSON, nullable                 # State before change
    new_data            JSON, nullable                 # State after change
    timestamp           DateTime(timezone=True), server_default=func.now()
    ip_address          String(45), nullable
```

**Used by subrouters:** infrastructure, credential, scan_target (CRUD operations that modify sensitive data)
**NOT used by:** finding, asset (append-only scanner writes — no user edits to audit)
**Also used by:** scan_template, scan_schedule (configuration changes), report (generation/deletion)

### 10.5 Stripe Integration — How Billing Works

**Stripe is handled entirely by the accounts module.** Cybersecurity never touches Stripe directly.

```
Flow:
1. User clicks "Upgrade to Pro" on frontend
2. Frontend calls accounts API → POST /accounts/subscriptions/checkout (price_id)
3. accounts/utils/stripe_utils.py → creates Stripe Checkout Session
4. User pays on Stripe hosted page → redirected back
5. Stripe fires webhook → POST /accounts/subscriptions/webhook
6. accounts/utils/stripe_utils.py → handle_subscription_change()
   → reads product.metadata.tier (e.g. "PRO")
   → saves Subscription.plan_name = "PRO", subscription_status = "ACTIVE"
7. Next cybersecurity API call:
   → cybersecurity/utils/dependency_utils.py → require_active_subscription()
   → cybersecurity/utils/subscription_utils.py → reads Subscription.plan_name
   → looks up TIER_LIMITS["PRO"] → applies limits (10 targets, 500 scans/mo, etc.)
```

**Billing model comparison across modules:**

| Module | Billing Model | How it reads tier |
|---|---|---|
| Ecommerce | Tier-based (FREE/PRO/ENTERPRISE) | Subscription.plan_name → TIER_LIMITS dict |
| AssetManager | Quantity-based (per entity) | Stripe quantity = entity_count - free_limit. Auto-sync. |
| Nexotype | Domain-gated tiers | Subscription.plan_name → DOMAIN_TIER_MAP |
| **Cybersecurity** | **Tier-based (like ecommerce)** | **Subscription.plan_name → TIER_LIMITS dict** |

**Why tier-based like ecommerce (not quantity-based like assetmanager):**
- AssetManager charges per entity because each entity (fund, company) has similar cost to serve
- Cybersecurity charges per tier because scan complexity varies wildly (port scan = cheap, AD audit = expensive). Flat per-target pricing wouldn't reflect actual cost.

**Stripe Dashboard setup for Cystene (one-time config):**
1. Products → Create 2 products:
   - "Cystene Pro" — recurring $49/month. Metadata: `tier=PRO, tier_order=1, features=10 targets,500 scans/mo,Internal scanners,Compliance reports`
   - "Cystene Enterprise" — recurring $199/month. Metadata: `tier=ENTERPRISE, tier_order=2, features=Unlimited targets,5000 scans/mo,All scanners,All reports`
2. Webhook endpoint: `https://server.cystene.com/accounts/subscriptions/webhook` (already configured in accounts)
3. Customer Portal: enable plan switching + proration + cancellation

**FREE tier has no Stripe product** — it's the default when no subscription exists. `subscription_utils.is_service_active()` returns True if within free tier limits (1 target, 20 scans/mo), even without a Subscription record.

### 10.6 Design Decisions

| Decision | Choice | Why |
|---|---|---|
| Hybrid pricing (subscription + credits) | Not pure per-scan, not pure flat rate | Pure per-scan scares users. Pure flat rate doesn't scale with usage. Credits give predictability. |
| FREE tier has all external scanners | 8 out of 12 scanners available for free | External scanning is the hook — user must see findings to understand value. Limiting scanners at FREE would cripple the demo experience. |
| Internal scanners gated behind PRO | host_audit, cloud_audit, mobile_scan require payment | Internal scanning requires Credential management (trust, security). This is the premium value proposition. |
| AD audit = ENTERPRISE only | Most expensive scanner for most sensitive use case | Active Directory credentials = highest trust level. Kerberoasting detection = enterprise-only concern. |
| 1 credit = 1 scanner execution | Not per job, not per target | User controls cost by choosing what to scan. A job with 3 scan_types costs 3 credits. Transparent. |
| Reads always allowed post-expiry | Even after subscription lapses | Users must always access their findings and reports. Only new scans and writes blocked. |
| Grace period 7 days | Same as ecommerce | Industry standard. Prevents accidental lockout during payment issues. |
| CybersecurityAuditLog separate per module | Not shared with AccountsAuditLog | SOC2 auditors need "show me all credential changes" — separate table makes this query instant. Same pattern as NexotypeAuditLog, AssetManagerAuditLog. |
| audit_models.py separate from domain models | Not in infrastructure_models.py or discovery_models.py | Audit log is infrastructure util, not domain entity. Same separation as nexotype and assetmanager. |

### 10.7 Future Extensions (Not Required — Architecture Ready)

**AI Remediation Guidance:** LLM-powered step-by-step fix instructions per finding. Fields already exist (Finding.remediation, Finding.remediation_script). Implementation: an endpoint that takes a finding, sends context (title, description, evidence, category, cwe_id) to an LLM (Claude API), returns structured remediation steps. No model changes needed — just an API endpoint + LLM call. Can be added anytime without touching existing architecture.

**Business Logic Flaw Testing:** Automated detection of price manipulation, race conditions, workflow bypass. Requires the scanner to "understand" the application's business logic — hardest thing to automate. Possible approach: user describes expected behavior, active_web_scan tests deviations. Future extension of active_web_scan.py, not a new scanner.

**CI/CD Integration:** Trigger scans on every deploy. Already possible — external system calls POST /cybersecurity/scan-jobs/start with API key. A webhook/GitHub Action wrapper is a thin layer on top of existing API. No architecture changes.

**Jira/Linear Integration:** Auto-create tickets from findings. A webhook that fires on Finding creation, POSTs to Jira/Linear API. Could be a simple notification system — Finding created → webhook URL → external tool. Fields available: title, severity, description, remediation, remediation_script.
