# Cystene — Cybersecurity Domain Architecture

Stable reference document. Defines all entities, fields, relationships, enums, scan engine architecture, and directory structure for the cybersecurity scanning domain.

**App name:** `cybersecurity`
**URL prefix:** `/cybersecurity/*`
**Backend:** `server/apps/cybersecurity/`
**Frontend:** `client/src/modules/cybersecurity/`, `client/src/app/(cybersecurity)/`

---

## 1. Entity Overview

7 domain entities. Build order follows FK dependency (parent before child).

| # | Entity | Table | BaseMixin | Why BaseMixin / No BaseMixin |
|---|---|---|---|---|
| 1 | ScanTarget | `scan_targets` | YES | CRUD entity — users create, update, soft-delete targets |
| 2 | ScanTemplate | `scan_templates` | YES | CRUD entity — users create, update, soft-delete reusable scan configs |
| 3 | ScanSchedule | `scan_schedules` | YES | CRUD entity — users create, update, soft-delete recurring schedules |
| 4 | ScanJob | `scan_jobs` | YES | Mutable lifecycle — status transitions (pending → running → completed/failed), users can cancel (soft-delete) |
| 5 | Finding | `findings` | NO | Append-only — scanner writes once, never edited. Status field tracks triage workflow but no soft delete needed. Bulk data table, same pattern as APIUsageTracking/RecommendationAnalytics in ecommerce. |
| 6 | Asset | `assets` | NO | Append-only — scanner discovers infrastructure, writes once. Upsert by (scan_job_id, asset_type, value). Bulk data table. |
| 7 | Report | `reports` | YES | CRUD entity — users generate, rename, soft-delete reports |

---

## 2. FK Relationship Map

Determines build order. Parent entities must exist before children.

```
users (accounts)
  └── scan_targets (user_id, organization_id)
        ├── scan_templates (target_id)
        ├── scan_schedules (target_id, template_id)
        ├── scan_jobs (target_id, template_id, schedule_id?)
        │     ├── findings (scan_job_id)
        │     └── assets (scan_job_id)
        └── reports (target_id, scan_job_id?)
```

**Build order:** ScanTarget → ScanTemplate → ScanSchedule → ScanJob → Finding → Asset → Report

---

## 3. Entity Definitions

### 3.1 ScanTarget (BaseMixin)

**Purpose:** What we scan — a domain, IP address, IP range, or URL that the user owns and wants to assess.
**Scope:** Per-user, per-organization. One target = one scannable endpoint.
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

### 3.2 ScanTemplate (BaseMixin)

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

    # Relationships
    target              relationship → ScanTarget (back_populates="templates")
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
    WEB_SCAN = "web_scan"       # HTTP security headers, common misconfigurations

    # Future expansion — each maps to a new ScanEngine implementation
    VULN_SCAN = "vuln_scan"     # Known vulnerability matching (CVE database)
    WAF_DETECT = "waf_detect"   # Web Application Firewall detection
    WHOIS = "whois"             # WHOIS record lookup
    TECH_DETECT = "tech_detect" # Technology stack fingerprinting (Wappalyzer-style)
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

### 3.3 ScanSchedule (BaseMixin)

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

### 3.4 ScanJob (BaseMixin)

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

### 3.5 Finding (NO BaseMixin)

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

    # Classification
    severity            String(50), not null            # "critical", "high", "medium", "low", "info"
    category            String(100), not null           # "open_port", "ssl_weakness", "missing_header", "dns_exposure", ...
    finding_type        String(100), not null           # Specific finding within category
    # Why both category and finding_type: category groups findings in UI, finding_type is the specific check

    # Finding details
    title               String(500), not null           # Human-readable title: "SSH Server Running Outdated Version"
    description         Text, not null                  # Detailed explanation of what was found
    remediation         Text, nullable                  # How to fix this finding
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

    # Triage status — user workflow for handling findings
    status              String(50), default="open"      # "open", "acknowledged", "resolved", "false_positive"
    # Why status on append-only: this is business state (triage), not CRUD lifecycle (no soft delete needed)

    # Timestamps
    discovered_at       DateTime(timezone=True), server_default=func.now()  # When scanner found it
    status_changed_at   DateTime(timezone=True), nullable                    # When triage status last changed

    # Relationships
    scan_job            relationship → ScanJob (back_populates="findings")
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

    # Future categories (when VulnScanEngine, etc. are added)
    KNOWN_VULNERABILITY = "known_vulnerability" # Matched against CVE database
    WEAK_AUTHENTICATION = "weak_authentication" # Weak auth mechanisms detected
    CONFIGURATION_ERROR = "configuration_error" # General misconfiguration
```

---

### 3.6 Asset (NO BaseMixin)

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

### 3.7 Report (BaseMixin)

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

## 4. Scan Engine Architecture

### 4.1 Overview

Hybrid architecture:
- **Custom Python core:** 4 MVP scan engines implemented in pure Python (socket, ssl, dns.resolver, httpx)
- **External tool parsers (optional):** Parse output from nmap XML, nuclei JSON — not required for MVP
- **Rust via PyO3 (future):** Port-intensive operations (port scanning) rewritten in Rust for performance

### 4.2 ScanEngine ABC

```python
# server/apps/cybersecurity/engine/base.py

from abc import ABC, abstractmethod
from typing import Any

class ScanEngine(ABC):
    """
    Abstract base class for all scan engines.
    Each engine performs one type of scan and returns findings + assets.

    Pattern: Strategy pattern — orchestrator selects engines based on template.scan_types.
    """

    @abstractmethod
    async def scan(self, target: str, params: dict) -> dict:
        """
        Execute scan against target with given parameters.

        Args:
            target: The target value (IP, domain, URL)
            params: Engine-specific parameters from ScanTemplate

        Returns:
            dict with keys:
                "findings": list[dict]  — vulnerability/issue dicts (→ Finding rows)
                "assets": list[dict]    — discovered infrastructure dicts (→ Asset rows)
                "errors": list[str]     — non-fatal errors encountered
                "duration_seconds": int — how long this engine took
        """
        pass

    @abstractmethod
    def engine_type(self) -> str:
        """Returns the ScanType enum value this engine handles."""
        pass
```

### 4.3 MVP Scan Engines (4)

| Engine | ScanType | Python Libraries | What It Does |
|---|---|---|---|
| `PortScanEngine` | `port_scan` | `socket`, `asyncio` | TCP connect scan, banner grabbing, service identification |
| `DNSScanEngine` | `dns_enum` | `dns.resolver` (dnspython) | A/AAAA/MX/NS/TXT/CNAME records, subdomain brute-force, SPF/DKIM/DMARC checks |
| `SSLScanEngine` | `ssl_check` | `ssl`, `socket`, `cryptography` | Certificate validation, cipher enumeration, protocol version checks, expiry detection |
| `WebScanEngine` | `web_scan` | `httpx` | Security header checks (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.), redirect analysis, server info disclosure |

### 4.4 Orchestrator

```python
# server/apps/cybersecurity/engine/orchestrator.py

class ScanOrchestrator:
    """
    Coordinates scan execution. Called by the scan_job_subrouter when a user
    starts a scan or the scheduler triggers one.

    Steps:
    1. Load ScanJob + ScanTemplate + ScanTarget from DB
    2. Parse template.scan_types → list of ScanType enums
    3. Instantiate corresponding ScanEngine for each type
    4. Run engines sequentially (or concurrently with asyncio.gather)
    5. Write findings + assets to DB
    6. Update ScanJob status + summary counts
    """

    def __init__(self):
        self.engines = {
            "port_scan": PortScanEngine(),
            "dns_enum": DNSScanEngine(),
            "ssl_check": SSLScanEngine(),
            "web_scan": WebScanEngine(),
        }

    async def execute(self, job_id: int, db: AsyncSession) -> None:
        """Execute all scan types for a given job."""
        pass
```

### 4.5 Engine Directory Structure

```
server/apps/cybersecurity/engine/
├── __init__.py
├── base.py              → ScanEngine ABC
├── orchestrator.py      → ScanOrchestrator
├── port_scan.py         → PortScanEngine
├── dns_scan.py          → DNSScanEngine
├── ssl_scan.py          → SSLScanEngine
├── web_scan.py          → WebScanEngine
└── parsers/             → External tool output parsers (future)
    ├── __init__.py
    ├── nmap_parser.py   → Parse nmap XML output → Finding/Asset dicts
    └── nuclei_parser.py → Parse nuclei JSON output → Finding/Asset dicts
```

---

## 5. Directory Structure

### 5.1 Backend

```
server/apps/cybersecurity/
├── __init__.py
├── router.py                          → Main router, ungated + gated split
├── models/
│   ├── __init__.py                    → Re-exports all models (nexotype pattern)
│   ├── mixin_models.py                → BaseMixin (imported from nexotype or local copy)
│   ├── scan_target_models.py          → ScanTarget
│   ├── scan_template_models.py        → ScanTemplate
│   ├── scan_schedule_models.py        → ScanSchedule
│   ├── scan_job_models.py             → ScanJob
│   ├── finding_models.py              → Finding
│   ├── asset_models.py                → Asset
│   └── report_models.py              → Report
├── schemas/
│   ├── scan_target_schemas.py         → Create, Update, Detail, ListResponse, Response
│   ├── scan_template_schemas.py
│   ├── scan_schedule_schemas.py
│   ├── scan_job_schemas.py
│   ├── finding_schemas.py
│   ├── asset_schemas.py
│   └── report_schemas.py
├── subrouters/
│   ├── scan_target_subrouter.py       → CRUD + verify ownership
│   ├── scan_template_subrouter.py     → CRUD
│   ├── scan_schedule_subrouter.py     → CRUD + activate/deactivate
│   ├── scan_job_subrouter.py          → Start scan, cancel scan, list/detail
│   ├── finding_subrouter.py           → List/detail + update triage status
│   ├── asset_subrouter.py             → List/detail (read-only)
│   └── report_subrouter.py            → Generate, list, detail, delete
├── engine/
│   ├── __init__.py
│   ├── base.py
│   ├── orchestrator.py
│   ├── port_scan.py
│   ├── dns_scan.py
│   ├── ssl_scan.py
│   ├── web_scan.py
│   └── parsers/
│       ├── __init__.py
│       ├── nmap_parser.py
│       └── nuclei_parser.py
└── utils/
    ├── dependency_utils.py            → get_user_target(), require_active_subscription
    ├── subscription_utils.py          → Tier constants, limits, is_service_active()
    └── scan_scheduler.py              → Background scheduler for ScanSchedule execution
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
gated = APIRouter(dependencies=[Depends(require_active_subscription), Depends(enforce_rate_limit)])

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
| Hybrid scan engine | Custom Python + optional external parsers | Pure Python for control and portability. External tool parsing is additive, not required. |
