"""
BaaS Scanner — Backend-as-a-Service Data Exposure (Supabase + Firebase)

Detects the single most-cited vibe-coded vulnerability: an app ships a public
anon Backend-as-a-Service key in its client-side JavaScript, and with Row-Level
Security off/permissive, anyone can read the database tables → PII leaks.

General by design (not vendor-locked): Supabase + Firebase today, extensible to
other BaaS providers by adding a signature + a probe helper.

References:
- Wiz Research "1-in-5 vibe-coded apps" — misconfig #3 (Supabase RLS), methodology
  (anon key → /rest/v1/ → probe tables → flag sensitive fields).
- support/cystene/market-vibe-scanners.md §4.3 + §5
- web_scan.py (the HTTP-fetch + per-check-probe pattern this mirrors)
- BHR Ch4 modular HTTP checks (probe endpoint → Optional finding)

Why probe a wordlist, not just enumerate: Supabase deprecated anon-key access to
the OpenAPI schema at /rest/v1/ root on 2026-03-11 ("Access to schema is forbidden").
Schema enumeration now fails on migrated projects, but the vuln is unchanged — with
RLS off, querying a KNOWN table via the anon key still returns data. So we probe a
wordlist of common table names; OpenAPI enumeration is a bonus fallback for unmigrated projects.

Why data minimization: evidence keeps table/collection name + field NAMES + row count
only — never row values. We confirm exposure without pulling the user's PII into our DB.

Why no consent gate: read-only recon using the app's OWN public anon key — no payloads,
no writes. Same risk class as web_scan reading /.env. Legal cover is Cystene's existing
target ownership verification, enforced on POST /scan-jobs/start.

Why httpx not requests: async native. Why verify=False: TLS validity is ssl_scan's job —
this scanner must work even on targets with invalid certs.
"""

import asyncio
import base64
import hashlib
import json
import logging
import re
import time
from urllib.parse import urljoin

import httpx

logger = logging.getLogger(__name__)


# ==========================================
# DETECTION SIGNATURES
# ==========================================

# Why these regexes: match how the platforms' client SDKs embed config in JS bundles.
# Supabase project URL is always <ref>.supabase.co where ref is 20 lowercase alphanumerics.
SUPABASE_URL_RE = re.compile(r"https://([a-z0-9]{20})\.supabase\.co")
# Any JWT-shaped token; we confirm it's an anon key by decoding its payload role below.
JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}")
# Firebase Realtime Database URL (two TLDs in use) + Google API key + projectId.
FIREBASE_DB_RE = re.compile(r"https://([a-z0-9-]+)\.(?:firebaseio\.com|firebasedatabase\.app)")
FIREBASE_APIKEY_RE = re.compile(r"AIza[0-9A-Za-z_\-]{35}")
FIREBASE_PROJECT_RE = re.compile(r"projectId[\"'\s:]+[\"']([a-z0-9-]+)[\"']")
# Extract <script src="..."> from HTML to fetch the bundles that hold the config.
SCRIPT_SRC_RE = re.compile(r"<script[^>]+src=[\"']([^\"']+)[\"']", re.IGNORECASE)


# ==========================================
# WORDLISTS
# ==========================================

# Why a wordlist: schema enumeration is blocked post-2026-03-11 (see module docstring).
# These are the table/collection names vibe-coded apps create most often.
COMMON_TABLE_NAMES = [
    "users", "profiles", "accounts", "customers", "members", "contacts", "leads",
    "orders", "products", "payments", "invoices", "transactions", "subscriptions",
    "posts", "comments", "messages", "chats", "notifications", "reviews", "feedback",
    "todos", "notes", "tasks", "projects", "items", "files", "documents", "images",
    "bookings", "reservations", "tickets", "events", "sessions", "logs",
    "waitlist", "signups", "submissions", "applications", "emails", "settings",
]

# Why these keywords: presence of any in a readable table's field names escalates
# the finding to critical — it means real PII/secrets are exposed, not just data.
SENSITIVE_FIELD_KEYWORDS = [
    "email", "phone", "password", "passwd", "pwd", "token", "secret", "api_key",
    "apikey", "ssn", "social_security", "credit", "card", "cvv", "iban", "address",
    "dob", "birth", "ip_address", "passport", "license", "salary", "bank",
]

# Bounds — don't hammer the target. Mirrors web_scan's Semaphore(10) ethos.
MAX_SCRIPTS = 15          # JS bundles fetched per scan
MAX_SCRIPT_BYTES = 2_000_000  # per-bundle size cap
MAX_TABLES = 60           # table/collection probes per provider
PROBE_CONCURRENCY = 10


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str) -> str:
    """Generate SHA-256 fingerprint for deduplication across scans."""
    return hashlib.sha256(f"{category}|{finding_type}|{host}|||".encode()).hexdigest()


def _finding(host, severity, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, url=None):
    """
    Build a finding dict matching Finding model fields exactly.

    Compliance fields are fixed for this scanner: BaaS data exposure is broken
    access control (OWASP A01, CWE-284), discovered by reading data repositories
    (MITRE Collection / T1213).
    """
    category = "baas_exposure"
    return {
        "fingerprint": _fingerprint(category, finding_type, host),
        "is_new": True,
        "severity": severity,
        "category": category,
        "finding_type": finding_type,
        "title": title,
        "description": description,
        "remediation": remediation,
        "remediation_script": remediation_script,
        "evidence": evidence[:500] if evidence else None,
        "host": host,
        "port": None,
        "protocol": None,
        "url": url,
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": "CWE-284",
        "owasp_category": "A01:2021-Broken Access Control",
        "mitre_tactic": "Collection",
        "mitre_technique": "T1213",
        "status": "open",
    }


def _asset(value, host, service_name, metadata):
    """Build an asset dict matching Asset model fields exactly."""
    return {
        "asset_type": "service",
        "value": value,
        "host": host,
        "port": None,
        "protocol": None,
        "service_name": service_name,
        "service_version": None,
        "banner": None,
        "service_metadata": json.dumps(metadata) if metadata else None,
        "confidence": "confirmed",
    }


def _normalize_url(target: str) -> str:
    """
    Normalize target into a base HTTPS URL for fetching.

    Why: user may pass "example.com", "http://…", or "https://…". BaaS config lives
    in the served app, so we fetch over HTTPS.
    """
    target = target.strip().rstrip("/")
    if target.startswith(("http://", "https://")):
        return target
    return f"https://{target}"


def _anon_role(jwt: str) -> bool:
    """
    Decode a JWT's payload and check role == "anon".

    Why: confirms a JWT-shaped string is actually a Supabase anon key (not a session
    token or unrelated JWT), avoiding false positives. No signature verification needed —
    we only read the public claims.
    """
    try:
        payload_b64 = jwt.split(".")[1]
        padding = "=" * (-len(payload_b64) % 4)  # base64url needs padding restored
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding))
        return payload.get("role") == "anon"
    except Exception:
        return False


def _sensitive_fields(keys) -> list[str]:
    """Return the field names that look sensitive (PII/secrets)."""
    out = []
    for key in keys:
        lowered = key.lower()
        if any(kw in lowered for kw in SENSITIVE_FIELD_KEYWORDS):
            out.append(key)
    return out


def _extract_script_urls(html: str, base_url: str) -> list[str]:
    """Extract <script src> URLs from HTML, resolved to absolute http(s) URLs."""
    urls = []
    for src in SCRIPT_SRC_RE.findall(html):
        absolute = urljoin(base_url, src)
        if absolute.startswith(("http://", "https://")) and absolute not in urls:
            urls.append(absolute)
    return urls[:MAX_SCRIPTS]


async def _fetch_scripts(client: httpx.AsyncClient, urls: list[str]) -> str:
    """Fetch JS bundles concurrently and return their concatenated text (bounded)."""
    semaphore = asyncio.Semaphore(PROBE_CONCURRENCY)

    async def fetch_one(url: str) -> str:
        async with semaphore:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.text[:MAX_SCRIPT_BYTES]
            except Exception:
                pass
            return ""

    chunks = await asyncio.gather(*[fetch_one(u) for u in urls])
    return "\n".join(chunks)


# ==========================================
# SUPABASE DETECTION + PROBE
# ==========================================

def _detect_supabase(text: str) -> tuple[str, str] | None:
    """
    Find a Supabase project URL + anon key in page/JS text.
    Returns (project_url, anon_key) or None.
    """
    url_match = SUPABASE_URL_RE.search(text)
    if not url_match:
        return None
    # Pick the first JWT whose payload role is "anon" (the public client key).
    for token in JWT_RE.findall(text):
        if _anon_role(token):
            return url_match.group(0), token
    return None


async def _enumerate_supabase_tables(client: httpx.AsyncClient, base: str, headers: dict) -> list[str]:
    """
    Bonus enumeration via the OpenAPI schema (PostgREST "definitions").

    Why try/except + empty fallback: blocked on Supabase projects migrated after
    2026-03-11 (403 "Access to schema is forbidden"). Still works on older projects.
    """
    try:
        resp = await client.get(f"{base}/rest/v1/", headers=headers)
        if resp.status_code == 200:
            schema = resp.json()
            if isinstance(schema, dict) and isinstance(schema.get("definitions"), dict):
                return list(schema["definitions"].keys())
    except Exception:
        pass
    return []


async def _probe_supabase_table(client: httpx.AsyncClient, base: str, headers: dict, table: str) -> dict | None:
    """
    Probe one table with the anon key. Returns exposure info if readable, else None.

    Why Prefer: count=exact: PostgREST returns the total row count in the Content-Range
    header — lets us report blast radius (row_count) without fetching the data.
    Why limit=1 + field names only: data minimization — confirm exposure, don't exfiltrate.
    """
    try:
        probe_headers = dict(headers)
        probe_headers["Prefer"] = "count=exact"
        resp = await client.get(f"{base}/rest/v1/{table}?select=*&limit=1", headers=probe_headers)
        if resp.status_code != 200:
            return None
        rows = resp.json()
        if not isinstance(rows, list) or not rows:
            return None  # readable but empty — not a useful exposure to report

        fields = list(rows[0].keys())
        # Content-Range looks like "0-0/123" — total after the slash.
        row_count = None
        content_range = resp.headers.get("content-range", "")
        if "/" in content_range:
            tail = content_range.split("/")[-1]
            row_count = int(tail) if tail.isdigit() else None

        return {"table": table, "fields": fields, "row_count": row_count}
    except Exception:
        return None


async def _probe_supabase(client: httpx.AsyncClient, host: str, project_url: str, anon_key: str) -> tuple[list, list]:
    """Run the full Supabase check. Returns (findings, assets)."""
    findings = []
    assets = []
    headers = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}"}

    # Candidate tables = bonus enumeration ∪ wordlist (deduped, bounded).
    enumerated = await _enumerate_supabase_tables(client, project_url, headers)
    candidates = list(dict.fromkeys(enumerated + COMMON_TABLE_NAMES))[:MAX_TABLES]

    semaphore = asyncio.Semaphore(PROBE_CONCURRENCY)

    async def probe(table: str) -> dict | None:
        async with semaphore:
            return await _probe_supabase_table(client, project_url, headers, table)

    results = await asyncio.gather(*[probe(t) for t in candidates])
    exposed = [r for r in results if r]

    for item in exposed:
        sensitive = _sensitive_fields(item["fields"])
        severity = "critical" if sensitive else "high"
        count_str = f"{item['row_count']} rows" if item["row_count"] is not None else "rows"
        sensitive_str = f" Exposed sensitive fields: {', '.join(sensitive)}." if sensitive else ""
        findings.append(_finding(
            host, severity, "supabase_rls_missing",
            f"Supabase table '{item['table']}' readable with the public anon key",
            f"The table '{item['table']}' ({count_str}) is readable using the app's public anon key, "
            f"meaning Row-Level Security is missing or permissive. Anyone who views the site can read this data.{sensitive_str}",
            "Enable RLS on the table and add deny-by-default policies that grant access only to the authenticated owner.",
            f"ALTER TABLE {item['table']} ENABLE ROW LEVEL SECURITY;\n"
            f"CREATE POLICY \"owner_can_read\" ON {item['table']} FOR SELECT\n"
            f"  USING (auth.uid() = user_id);",
            f"Anon-readable. Fields: {', '.join(item['fields'][:20])}",  # names only — no values
            url=f"{project_url}/rest/v1/{item['table']}",
        ))

    # One asset for the discovered backend (whether or not tables were exposed).
    assets.append(_asset(
        project_url, host, "supabase",
        {"exposed_tables": [r["table"] for r in exposed], "exposed_count": len(exposed)},
    ))
    return findings, assets


# ==========================================
# FIREBASE DETECTION + PROBE
# ==========================================

def _detect_firebase(text: str) -> dict | None:
    """
    Find Firebase config in page/JS text.
    Returns {database_url?, project_id?} or None.
    """
    db_match = FIREBASE_DB_RE.search(text)
    project_match = FIREBASE_PROJECT_RE.search(text)
    has_apikey = bool(FIREBASE_APIKEY_RE.search(text))
    if not db_match and not (project_match and has_apikey):
        return None
    return {
        "database_url": db_match.group(0) if db_match else None,
        "project_id": project_match.group(1) if project_match else None,
    }


async def _probe_firebase_rtdb(client: httpx.AsyncClient, database_url: str) -> bool:
    """
    Check if a Firebase Realtime Database is world-readable.

    Why shallow=true: returns only top-level keys, not values — data minimization.
    Open DB → 200 with a JSON object. Locked DB → 401 "Permission denied".
    """
    try:
        resp = await client.get(f"{database_url}/.json?shallow=true")
        return resp.status_code == 200 and resp.json() is not None
    except Exception:
        return False


async def _probe_firebase(client: httpx.AsyncClient, host: str, config: dict) -> tuple[list, list]:
    """Run the Firebase check. Returns (findings, assets)."""
    findings = []
    assets = []
    database_url = config.get("database_url")

    if database_url and await _probe_firebase_rtdb(client, database_url):
        findings.append(_finding(
            host, "critical", "firebase_rtdb_open",
            "Firebase Realtime Database is publicly readable",
            f"The Realtime Database at {database_url} returns data without authentication. "
            "Its security rules allow public read access, exposing all stored data.",
            "Set Realtime Database rules to deny-by-default and grant read access only to authenticated owners.",
            '{\n  "rules": {\n    ".read": "auth != null && auth.uid === $uid",\n    ".write": "auth != null && auth.uid === $uid"\n  }\n}',
            f"{database_url}/.json returned data (rules allow public read)",
            url=f"{database_url}/.json",
        ))

    assets.append(_asset(
        database_url or config.get("project_id") or "firebase",
        host, "firebase",
        {"project_id": config.get("project_id"), "database_url": database_url},
    ))
    return findings, assets


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute BaaS data-exposure scan against target.

    Args:
        target: Domain, IP, or URL to scan
        params: Scanner parameters from ScanTemplate (none required — uses defaults)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    base_url = _normalize_url(target)
    host = base_url.replace("https://", "").replace("http://", "").split("/")[0]

    logger.info(f"BaaS scan starting: target={host}")

    # Why verify=False: TLS validity is ssl_scan's job. Why timeout=10: avoid hanging.
    async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:

        # 1. Fetch the served app + its JS bundles (where BaaS config lives)
        combined = ""
        try:
            resp = await client.get(base_url)
            html = resp.text
            script_urls = _extract_script_urls(html, base_url)
            scripts = await _fetch_scripts(client, script_urls)
            combined = f"{html}\n{scripts}"
        except httpx.TimeoutException:
            errors.append(f"Timeout connecting to {base_url}")
        except Exception as e:
            errors.append(f"Error fetching {base_url}: {e}")

        # 2. Supabase — detect config, then probe tables
        if combined:
            supabase = _detect_supabase(combined)
            if supabase:
                project_url, anon_key = supabase
                try:
                    sb_findings, sb_assets = await _probe_supabase(client, host, project_url, anon_key)
                    findings.extend(sb_findings)
                    assets.extend(sb_assets)
                except Exception as e:
                    errors.append(f"Supabase probe error: {e}")

            # 3. Firebase — detect config, then probe RTDB
            firebase = _detect_firebase(combined)
            if firebase:
                try:
                    fb_findings, fb_assets = await _probe_firebase(client, host, firebase)
                    findings.extend(fb_findings)
                    assets.extend(fb_assets)
                except Exception as e:
                    errors.append(f"Firebase probe error: {e}")

    duration = round(time.time() - start_time, 1)
    logger.info(f"BaaS scan complete: host={host}, findings={len(findings)}, assets={len(assets)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
