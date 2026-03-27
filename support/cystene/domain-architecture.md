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

## 4. Scanners

### 4.1 Overview

Plain async functions — no ABC, no orchestrator, no strategy pattern, no factory.

**What was removed (previous version had `engine/` directory):**
The original plan used a full engine pattern with 5 components: (1) `base.py` — an ABC (`ScanEngine`) forcing all scanners to inherit and implement `scan()` + `engine_type()`, (2) `orchestrator.py` — a `ScanOrchestrator` class that loaded jobs, selected engines, ran them, and wrote results, (3) strategy pattern — each scanner was a subclass of the ABC, swappable at runtime, (4) factory pattern — a function to instantiate the correct engine class based on scan type, (5) `parsers/` directory — parser classes for external tool output (nmap XML, nuclei JSON). All 5 were removed in favor of plain async functions in a flat `scanners/` directory, because 4 scanners we fully control don't justify the abstraction layers. The subrouter calls them directly via a dict mapping.

**Why no ABC (Abstract Base Class):** An ABC forces subclasses to implement specific methods via a shared interface. Useful when you have multiple implementations that must be swappable at runtime (like ecommerce's `PlatformAdapter` with Shopify/WooCommerce/Magento). We have 4 scanners that we fully control — a dict + for loop achieves the same thing without the abstraction overhead.

**Why no orchestrator:** An orchestrator is a coordinator class that picks which strategies to run, runs them in order, and collects results. With 4 scanners, the `scan_job_subrouter.py` can do this directly in ~10 lines. No need for a separate class.

**Why no strategy pattern:** The strategy pattern swaps algorithms at runtime via a shared interface. Each scanner would be a "strategy" — same interface, different behavior. Overkill when a simple dict mapping does the job.

**Why no factory:** A factory decides which implementation to return based on input. Ecommerce needs this because it routes between 3 platforms × 2 connection methods × 1 ingest fallback = real complexity. We have a 1:1 mapping from scan_type string → scanner module.

### 4.2 Scanner Modules (4)

Each scanner is a single async function in its own file. Same input, same output — just convention, not enforced by inheritance.

| Scanner | ScanType | Python Libraries | What It Does |
|---|---|---|---|
| `port_scan.run()` | `port_scan` | `socket`, `asyncio` | TCP connect scan, banner grabbing, service identification |
| `dns_scan.run()` | `dns_enum` | `dns.resolver` (dnspython) | A/AAAA/MX/NS/TXT/CNAME records, subdomain brute-force, SPF/DKIM/DMARC checks |
| `ssl_scan.run()` | `ssl_check` | `ssl`, `socket`, `cryptography` | Certificate validation, cipher enumeration, protocol version checks, expiry detection |
| `web_scan.run()` | `web_scan` | `httpx` | Security header checks (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.), redirect analysis, server info disclosure |

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

### 4.4 How scan_job_subrouter Calls Scanners

No orchestrator class. The subrouter imports scanner modules and calls them directly:

```python
# server/apps/cybersecurity/subrouters/scan_job_subrouter.py

from cybersecurity.scanners import port_scan, dns_scan, ssl_scan, web_scan

# Simple dict mapping — replaces factory + strategy pattern + orchestrator
scanner_map = {
    "port_scan": port_scan.run,
    "dns_enum": dns_scan.run,
    "ssl_check": ssl_scan.run,
    "web_scan": web_scan.run,
}

# In the "start scan" endpoint:
for scan_type in template.scan_types.split(","):
    scanner = scanner_map[scan_type.strip()]
    result = await scanner(target.target_value, params)
    # write result["findings"] + result["assets"] to DB
    # update ScanJob summary counts
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
│   ├── scan_job_subrouter.py          → Start scan, cancel scan, list/detail + calls scanners directly
│   ├── finding_subrouter.py           → List/detail + update triage status
│   ├── asset_subrouter.py             → List/detail (read-only)
│   └── report_subrouter.py            → Generate, list, detail, delete
├── scanners/                          → Plain async functions, no ABC, no orchestrator
│   ├── port_scan.py                   → async def run(target, params) → findings + assets
│   ├── dns_scan.py                    → async def run(target, params) → findings + assets
│   ├── ssl_scan.py                    → async def run(target, params) → findings + assets
│   └── web_scan.py                    → async def run(target, params) → findings + assets
├── surrealdb/                         → Graph layer — polyglot persistence (nexotype pattern)
│   ├── db.py                          → SurrealDB connection management
│   ├── sync_service.py                → PostgreSQL → SurrealDB entity + relationship sync
│   └── subrouters/
│       ├── discovery_subrouter.py     → Graph traversal queries (attack paths, blast radius)
│       ├── sync_subrouter.py          → Manual full/incremental sync triggers
│       └── health_subrouter.py        → Connection health + sync status
└── utils/
    ├── dependency_utils.py            → get_user_target(), require_active_subscription
    └── subscription_utils.py          → Tier constants, limits, is_service_active()
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
| Plain scanner functions, no engine pattern | Simple > complex | 4 scanners we fully control don't need ABC/orchestrator/factory. A dict + for loop in the subrouter does the same job. |
| Polyglot persistence (PostgreSQL + SurrealDB) | Graph queries for attack paths | PostgreSQL is source of truth for CRUD. SurrealDB is a read-only graph cache for complex traversals that are expensive/awkward in SQL. Same pattern as nexotype. |
| SurrealDB sync, not dual-write | Data consistency | Write to PostgreSQL first, then sync to SurrealDB. Never write to SurrealDB directly. If SurrealDB sync fails, PostgreSQL still has the data — graph cache can be rebuilt at any time. |
| Rust via PyO3 (future) | Performance optimization | Port scanning is the most I/O + CPU intensive scanner. When Python's asyncio becomes a bottleneck, rewrite `port_scan.py` as a Rust module exposed via PyO3. Same function signature (`async def run(target, params) → dict`), just faster internals. Not needed for MVP — pure Python handles it fine at initial scale. |

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

Not all 7 entities become nodes. Only the ones that participate in graph relationships:

| PostgreSQL Entity | SurrealDB Table | Why Node / Not Node |
|---|---|---|
| ScanTarget | `scan_target` | Node — root of the graph. All scans start from a target. |
| ScanJob | `scan_job` | Node — connects targets to their discovered findings/assets. |
| Finding | `finding` | Node — vulnerabilities are the primary query subject in graph traversals. |
| Asset | `asset` | Node — hosts, services, technologies, certs, DNS records form the infrastructure graph. |
| ScanTemplate | — | Not a node — configuration data, not part of the infrastructure graph. |
| ScanSchedule | — | Not a node — scheduling metadata, not part of the infrastructure graph. |
| Report | — | Not a node — generated output, not part of the infrastructure graph. |

### 8.3 Edge Types (Relationships between nodes)

```
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
                                    ┌──────────────┐
                                    │  scan_target  │
                                    └──────┬───────┘
                                           │ SCANNED_BY
                                           ▼
                                    ┌──────────────┐
                               ┌────│   scan_job    │────┐
                               │    └──────────────┘     │
                          FOUND │                         │ DISCOVERED
                               ▼                         ▼
                        ┌────────────┐            ┌────────────┐
                   ┌────│  finding    │──AFFECTS──→│   asset     │────┐
                   │    └────────────┘            └────────────┘     │
              LEADS_TO                              │    │    │      │
                   │                             RUNS  HAS_  HAS_   USES
                   ▼                               │  CERT  RECORD   │
                ┌────────────┐                     ▼    ▼     ▼      ▼
                │  finding    │               ┌────────────────────────┐
                └────────────┘               │   asset (subtypes)      │
                                              │  host, service, tech,  │
                                              │  certificate, dns_rec  │
                                              └────────────────────────┘
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
```

### 8.7 When SurrealDB Sync Happens

| Event | Sync Action |
|---|---|
| Scan job completes | Sync new findings + assets + relationships to SurrealDB |
| Finding triage status changes | Update finding node properties in SurrealDB |
| Manual sync trigger (admin) | Full or incremental sync via sync_subrouter |
| SurrealDB data loss/corruption | Full sync rebuilds everything from PostgreSQL |

### 8.8 What SurrealDB Does NOT Do

- **No writes originate from SurrealDB** — it is always a cache of PostgreSQL data
- **No CRUD operations** — creating/updating/deleting entities always goes through PostgreSQL subrouters first
- **No scan execution** — scanners write to PostgreSQL, sync service propagates to SurrealDB
- **No auth/user management** — graph queries are gated by the same subscription middleware as all other endpoints
