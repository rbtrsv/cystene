"""
Secret Scanner — Exposed Secrets in JS Bundles + Source Maps

Detects the second most-cited vibe-coded vulnerability: API keys and secrets
hardcoded into client-side JavaScript (and original source leaked via .map files).
Fetches the served bundles + their source maps and greps them for high-signal
secret patterns.

References:
- BHR Ch4 (modular HTTP checks — dotenv_disclosure: fetch + match + finding)
- gitleaks / trufflehog secret rulesets (curated subset — quality over quantity)
- support/cystene/market-vibe-scanners.md §4.2
- web_scan.py / baas_scan.py (the HTTP-fetch + per-check-probe pattern this mirrors)

Why curate ~30 patterns, not 2000: most public rulesets are false-positive-prone.
We keep high-signal, anchored patterns (sk-, AKIA, AIza, ghp_, -----BEGIN … KEY-----)
plus an entropy-gated generic catch. Fewer, better findings beat noise.

Why no live verification: trufflehog confirms a key by authenticating with it. We do
NOT — using a found key is heavier (ethics, rate, latency). Detection is enough for a report.

Why redact evidence: we store first4…last4 with the middle masked — never the full
secret. Same data-minimization rule as baas_scan: confirm exposure without hoarding it.

Why the Rust engine: matching ~30 patterns across large bundles is CPU-bound. We use
engine.bulk_banner_match (rayon, parallel) when compiled, and fall back to pure-Python
re when it is not. Same pattern as port_scan.py / dns_scan.py.

Why httpx + verify=False: async native; TLS validity is ssl_scan's job — this must work
even on targets with invalid certs.
"""

import asyncio
import hashlib
import logging
import math
import re
import time
from urllib.parse import urljoin

import httpx

# Optional Rust acceleration — pure-Python fallback when not compiled.
# Why: engine.bulk_banner_match runs the regex sweep in parallel (rayon). Same
# try/import pattern as port_scan.py and dns_scan.py.
try:
    import engine  # type: ignore
    _HAS_ENGINE = True
except ImportError:
    engine = None
    _HAS_ENGINE = False

logger = logging.getLogger(__name__)


# ==========================================
# SECRET PATTERNS
# ==========================================

# Why (name, regex, severity, entropy_check): name → finding_type, regex → match,
# severity by blast radius (live provider creds = critical), entropy_check = apply a
# Shannon-entropy floor to the match before reporting (kills CSS/minified false positives).
# Why anchored prefixes: AKIA / sk-ant- / AIza / ghp_ / sk-proj- have near-zero FP rates,
# so they need no entropy gate. The looser/word-prone ones (openai legacy, mailgun, generic) do.
# Why the OpenAI split: a bare "sk-...{20,}" with dashes also matches CSS class runs like
# "sk-inset-0...color" (real live FP on client.nexotype.com). Real keys are either a 48-char
# no-separator legacy body OR carry a proj-/svcacct-/admin- anchor.
SECRET_PATTERNS = [
    ("openai_api_key", r"sk-[A-Za-z0-9]{48}", "critical", True),
    ("openai_project_key", r"sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{40,}", "critical", False),
    ("anthropic_api_key", r"sk-ant-[A-Za-z0-9_-]{20,}", "critical", False),
    ("aws_access_key_id", r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "critical", False),
    ("aws_secret_access_key", r"aws_secret_access_key[\"'\s:=]+[A-Za-z0-9/+]{40}", "critical", False),
    ("google_api_key", r"AIza[0-9A-Za-z_-]{35}", "high", False),
    ("gcp_service_account", r"\"type\":\s*\"service_account\"", "critical", False),
    ("github_token", r"gh[pousr]_[A-Za-z0-9]{36,}", "critical", False),
    ("github_fine_grained", r"github_pat_[A-Za-z0-9_]{60,}", "critical", False),
    ("slack_token", r"xox[baprs]-[A-Za-z0-9-]{10,}", "high", False),
    ("slack_webhook", r"https://hooks\.slack\.com/services/T[A-Za-z0-9_/]+", "high", False),
    ("stripe_secret_live", r"(?:sk|rk)_live_[A-Za-z0-9]{24,}", "critical", False),
    ("stripe_publishable_live", r"pk_live_[A-Za-z0-9]{24,}", "low", False),
    ("twilio_api_key", r"SK[0-9a-fA-F]{32}", "high", True),
    ("twilio_account_sid", r"AC[0-9a-fA-F]{32}", "high", True),
    ("sendgrid_api_key", r"SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}", "critical", False),
    ("mailgun_api_key", r"key-[0-9a-zA-Z]{32}", "high", True),
    ("private_key", r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----", "critical", False),
    ("jwt_token", r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", "low", False),
    ("supabase_service_role", r"service_role[\"'\s:]+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "critical", False),
    ("firebase_db_secret", r"[\"']databaseAuthVariableOverride[\"']", "high", False),
    ("generic_api_key", r"(?:api[_-]?key|apikey|secret|token|passwd|password)[\"'\s:=]{1,4}[\"']([A-Za-z0-9_\-]{16,64})[\"']", "high", True),
]

# Why placeholders: bundles are full of "YOUR_API_KEY"-style template strings. Skip them
# to avoid noise — these are not real leaks.
PLACEHOLDER_MARKERS = (
    "your_", "yourapi", "example", "changeme", "placeholder", "dummy", "xxxx",
    "<your", "insert", "todo", "replace", "<<", "test_key", "sk-xxxx", "abc123",
)

# Why entropy gate (generic pattern only): a real key looks random. The anchored
# patterns are trustworthy on their own; the generic catch needs an entropy floor.
ENTROPY_THRESHOLD = 3.5

# Bounds — don't hammer the target (mirrors web_scan / baas_scan).
MAX_SCRIPTS = 15
MAX_SCRIPT_BYTES = 2_000_000
PROBE_CONCURRENCY = 10

# sourceMappingURL comment → the .map sibling that may carry original source.
SOURCEMAP_RE = re.compile(r"//[#@]\s*sourceMappingURL=([^\s'\"]+)")
SCRIPT_SRC_RE = re.compile(r"<script[^>]+src=[\"']([^\"']+)[\"']", re.IGNORECASE)


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str, extra: str = "") -> str:
    """Generate SHA-256 fingerprint for deduplication across scans."""
    return hashlib.sha256(f"{category}|{finding_type}|{host}|{extra}||".encode()).hexdigest()


def _finding(host, severity, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, url=None, cwe_id="CWE-798", fp_extra=""):
    """
    Build a finding dict matching Finding model fields exactly.

    Compliance is fixed for this scanner: hard-coded credentials (CWE-798) /
    source disclosure (CWE-540), cryptographic failures (OWASP A02), credential
    access (MITRE T1552.001 — credentials in files).
    """
    category = "exposed_secret"
    return {
        "fingerprint": _fingerprint(category, finding_type, host, fp_extra),
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
        "cwe_id": cwe_id,
        "owasp_category": "A02:2021-Cryptographic Failures",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "T1552.001",
        "status": "open",
    }


def _normalize_url(target: str) -> str:
    """Normalize target into a base HTTPS URL for fetching."""
    target = target.strip().rstrip("/")
    if target.startswith(("http://", "https://")):
        return target
    return f"https://{target}"


def _redact(secret: str) -> str:
    """
    Mask the middle of a secret, keeping first/last 4 chars for identification.

    Why: data minimization — we prove a real key leaked without storing it in our DB.
    """
    secret = secret.strip()
    if len(secret) <= 12:
        return secret[:2] + "…" + secret[-2:]
    return f"{secret[:4]}…{secret[-4:]} ({len(secret)} chars)"


def _is_placeholder(value: str) -> bool:
    """True if the matched value is an obvious template/placeholder, not a real secret."""
    lowered = value.lower()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def _extract_value(name: str, raw: str) -> str:
    """
    Pull the secret value out of a keyword-prefixed whole-match.

    Why: the generic pattern matches `api_key":"<secret>"` as a whole (both the Rust engine
    and the Python fallback return the whole match). The real secret is the quoted token —
    extract it so placeholder/entropy/redaction operate on the secret, not the prefix.
    Anchored patterns already are the secret, so they pass through unchanged.
    """
    if name == "generic_api_key":
        m = re.search(r"[\"']([A-Za-z0-9_\-]{16,64})[\"']", raw)
        if m:
            return m.group(1)
    return raw


def _shannon_entropy(s: str) -> float:
    """Shannon entropy (bits/char). Real secrets are high-entropy; words are not."""
    if not s:
        return 0.0
    counts = {c: s.count(c) for c in set(s)}
    length = len(s)
    return -sum((n / length) * math.log2(n / length) for n in counts.values())


def _extract_script_urls(html: str, base_url: str) -> list[str]:
    """Extract <script src> URLs from HTML, resolved to absolute http(s) URLs."""
    urls = []
    for src in SCRIPT_SRC_RE.findall(html):
        absolute = urljoin(base_url, src)
        if absolute.startswith(("http://", "https://")) and absolute not in urls:
            urls.append(absolute)
    return urls[:MAX_SCRIPTS]


def _find_sourcemaps(js_text: str, bundle_url: str) -> list[str]:
    """Resolve sourceMappingURL comments in a bundle to absolute .map URLs."""
    out = []
    for ref in SOURCEMAP_RE.findall(js_text):
        if ref.startswith("data:"):
            continue  # inline map — already in the bundle text we scan
        absolute = urljoin(bundle_url, ref)
        if absolute.startswith(("http://", "https://")):
            out.append(absolute)
    return out


def _extract_sources_content(map_json: dict) -> str:
    """Concatenate sourcesContent (original source) from a parsed source map."""
    sources = map_json.get("sourcesContent")
    if isinstance(sources, list):
        return "\n".join(s for s in sources if isinstance(s, str))
    return ""


def _match_secrets(chunks: list[str]) -> list[tuple[int, str]]:
    """
    Match every chunk against every SECRET_PATTERNS regex.
    Returns list of (pattern_index, matched_string).

    Why engine first: bulk regex over large bundles is CPU-bound — engine.bulk_banner_match
    runs it in parallel (rayon). Pure-Python re is the fallback when the engine is not compiled.
    """
    patterns = [p[1] for p in SECRET_PATTERNS]

    if _HAS_ENGINE:
        # engine returns (chunk_idx, pattern_idx, match_str); we only need (pattern_idx, match).
        try:
            results = engine.bulk_banner_match(chunks, patterns)
            return [(pat_idx, match) for (_chunk_idx, pat_idx, match) in results]
        except Exception:
            pass  # fall through to pure Python on any engine error

    out = []
    compiled = [re.compile(p) for p in patterns]
    for chunk in chunks:
        for idx, rx in enumerate(compiled):
            for m in rx.finditer(chunk):
                # Why group(0) (whole match): the Rust engine's bulk_banner_match returns the
                # whole match (regex.find, no capture groups). Keep both paths identical — the
                # inner secret is pulled out later by _extract_value for parity.
                out.append((idx, m.group(0)))
    return out


async def _fetch_text(client: httpx.AsyncClient, url: str) -> str:
    """GET a URL and return its (size-capped) text, or '' on any failure."""
    try:
        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.text[:MAX_SCRIPT_BYTES]
    except Exception:
        pass
    return ""


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute secret-exposure scan against target.

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

    logger.info(f"Secret scan starting: target={host}, engine={'rust' if _HAS_ENGINE else 'python'}")

    async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:

        # 1. Fetch the served page + its JS bundles
        html = await _fetch_text(client, base_url)
        if not html:
            errors.append(f"Could not fetch {base_url}")
            return {"findings": findings, "assets": assets, "errors": errors,
                    "duration_seconds": round(time.time() - start_time, 1)}

        script_urls = _extract_script_urls(html, base_url)
        semaphore = asyncio.Semaphore(PROBE_CONCURRENCY)

        async def fetch_bundle(url: str) -> tuple[str, str]:
            async with semaphore:
                return url, await _fetch_text(client, url)

        bundles = await asyncio.gather(*[fetch_bundle(u) for u in script_urls])

        # 2. Follow source maps (original source) + flag their exposure
        corpus = [html] + [text for _u, text in bundles]

        async def fetch_map(map_url: str) -> tuple[str, str]:
            async with semaphore:
                return map_url, await _fetch_text(client, map_url)

        map_urls = []
        for url, text in bundles:
            map_urls.extend(_find_sourcemaps(text, url))
        map_urls = list(dict.fromkeys(map_urls))  # dedup

        maps = await asyncio.gather(*[fetch_map(m) for m in map_urls]) if map_urls else []
        for map_url, map_text in maps:
            if not map_text:
                continue
            try:
                import json as _json
                src = _extract_sources_content(_json.loads(map_text))
            except Exception:
                src = ""
            if src:
                corpus.append(src)
                findings.append(_finding(
                    host, "low", "source_map_exposed",
                    f"Source map exposes original source for {host}",
                    f"A JavaScript source map ({map_url}) is publicly reachable and includes the original "
                    "source code (sourcesContent). This reveals app internals and may contain secrets.",
                    "Stop publishing source maps to production, or restrict access to .map files.",
                    f'location ~ \\.map$ {{ deny all; return 404; }}',
                    f"{map_url} contains sourcesContent",
                    url=map_url, cwe_id="CWE-540", fp_extra=map_url,
                ))

        # 3. Sweep the corpus for secrets (engine or pure-Python)
        hits = _match_secrets(corpus)

        # 4. Build findings — dedup by (finding_type, redacted), skip placeholders/low-entropy
        seen = set()
        for pat_idx, match in hits:
            name, _regex, severity, entropy_check = SECRET_PATTERNS[pat_idx]
            # Normalize to the actual secret (parity across engine + Python paths).
            value = _extract_value(name, match)
            if _is_placeholder(value):
                continue
            # Entropy floor for loose/word-prone patterns; anchored ones are trusted as-is.
            # Why: kills CSS/minified false positives (e.g. "sk-inset-0...color") that look key-shaped.
            if entropy_check and _shannon_entropy(value) < ENTROPY_THRESHOLD:
                continue
            redacted = _redact(value)
            key = (name, redacted)
            if key in seen:
                continue
            seen.add(key)

            findings.append(_finding(
                host, severity, name,
                f"Exposed secret in client-side code: {name.replace('_', ' ')}",
                f"A {name.replace('_', ' ')} was found in the site's client-side JavaScript/source maps. "
                "Anyone who loads the page can read it. Client-side code is public — secrets must never live there.",
                "Rotate this credential immediately, then move it server-side and proxy the call through a backend.",
                "# 1) Revoke/rotate the key in the provider dashboard.\n"
                "# 2) Move it to a server env var; never ship it to the browser.",
                f"Match ({name}): {redacted}",
                url=base_url, fp_extra=redacted,
            ))

    duration = round(time.time() - start_time, 1)
    logger.info(f"Secret scan complete: host={host}, findings={len(findings)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
