"""
Active Web Scanner — Detection-Only SQLi, XSS, Command Injection, LFI, Open Redirect

Sends safe payloads to detect injection vulnerabilities WITHOUT exploiting them.
This scanner REQUIRES active_scan_consent=True on the ScanTemplate.

Why detection-only:
- SQLi: inject ' → check for SQL error. Does NOT extract data.
- XSS: inject harmless marker → check if reflected unescaped. Does NOT execute JS.
- Command injection: inject echo MARKER → check for marker. Does NOT run destructive cmds.
- LFI: test path traversal → check for known file patterns. Does NOT access sensitive files.
- Open redirect: test redirect param → check Location header. Does NOT redirect users.

Why consent required: Active payloads can trigger WAF blocks, security alerts, and IDS
notifications on the target. User must explicitly authorize before running.

References:
- sql_injector.py (Lesson 2 — SQLi payloads and error patterns)
- cmd_injector.py (Lesson 2 — command injection vectors: ;, &&, |, ||, backticks, $())
- BHR Ch6 (SQLi §6.8, XSS §6.9, SSRF §6.10, CSRF §6.11, Open redirect §6.12)
- common_vulnerabilities.md (OWASP Top 10 A03:2021 — Injection)
- domain-architecture.md §4.2 (active_web_scan specification)
"""

import asyncio
import hashlib
import logging
import time
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

import httpx

logger = logging.getLogger(__name__)


# ==========================================
# DETECTION PAYLOADS
# ==========================================

# Why single quote first: It's the simplest SQL syntax breaker. If the app returns
# an SQL error message, the parameter is injectable — no data extraction needed.
SQLI_PAYLOADS = ["'", "' OR '1'='1", "1' OR '1'='1'--", "1; --"]

# Why these patterns: Each database engine has distinct error messages.
# Matching any of these in the response confirms SQL injection.
SQLI_ERROR_PATTERNS = [
    "sql syntax", "mysql_", "you have an error in your sql",
    "unclosed quotation mark", "syntax error",
    "warning: mysql", "warning: pg_", "warning: sqlite",
    "ora-00933", "ora-01756",  # Oracle errors
    "postgresql", "unterminated string",
    "microsoft ole db", "odbc sql server",
    "sql command not properly ended",
]

# Why unique marker: If this exact string appears in the response body,
# the input was reflected without HTML encoding — XSS is possible.
# Using a unique string avoids false positives from page content.
XSS_MARKER = "cystene_xss_test_42"
XSS_PAYLOAD = f"<{XSS_MARKER}>"

# Why echo with unique marker: If the marker appears in the response,
# the server executed our command. echo is read-only and harmless.
# Pattern from cmd_injector.py: test multiple shell operators.
CMD_MARKER = "CYSTENE_CMD_DETECT_42"
CMD_PAYLOADS = [
    f"; echo {CMD_MARKER}",
    f"| echo {CMD_MARKER}",
    f"&& echo {CMD_MARKER}",
]

# Why /etc/passwd: Universal readable file on Linux. Contains no secrets
# (passwords are in /etc/shadow). Presence of "root:" confirms file read.
LFI_PAYLOADS = ["../../etc/passwd", "../../../etc/passwd", "....//....//etc/passwd"]
LFI_INDICATORS = ["root:", "bin/bash", "bin/sh", "nobody:", "daemon:"]

# Why these param names: Standard redirect parameter names across frameworks.
# If the server redirects to our evil URL, open redirect is confirmed.
REDIRECT_PARAMS = ["redirect", "url", "next", "return", "goto", "continue", "redirect_uri", "return_url"]
REDIRECT_TARGET = "https://evil.cystene-test.com"

# Common injectable parameter names to test when URL has no existing params
TEST_PARAMS = ["id", "search", "q", "page", "name", "user", "file", "path", "url", "redirect"]


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str, param: str = "") -> str:
    return hashlib.sha256(f"{category}|{finding_type}|{host}||{param}".encode()).hexdigest()


def _finding(host, severity, category, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, cwe_id=None, url=None):
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
        "cwe_id": cwe_id,
        "owasp_category": "A03:2021-Injection",
        "mitre_tactic": "Initial Access",
        "mitre_technique": "T1190",
        "status": "open",
    }


def _normalize_url(target: str) -> str:
    target = target.strip().rstrip("/")
    if not target.startswith("http://") and not target.startswith("https://"):
        return f"https://{target}"
    return target


def _inject_param(url: str, param: str, value: str) -> str:
    """Replace or add a query parameter in a URL with the given value."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params[param] = [value]
    new_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


# ==========================================
# SQLI DETECTION
# ==========================================

async def check_sqli(client: httpx.AsyncClient, base_url: str, host: str, params_to_test: list[str]) -> list[dict]:
    """
    Test URL parameters for SQL injection by injecting single quotes
    and checking response for SQL error messages.

    Why error-based detection: Most reliable passive detection method.
    If the app shows SQL errors, the parameter is injectable — confirmed
    without extracting any data.
    """
    findings = []

    for param in params_to_test:
        for payload in SQLI_PAYLOADS:
            try:
                test_url = _inject_param(base_url, param, payload)
                resp = await client.get(test_url)
                body = resp.text.lower()

                for pattern in SQLI_ERROR_PATTERNS:
                    if pattern in body:
                        findings.append(_finding(
                            host, "critical", "injection_detected", "sqli_error_based",
                            f"SQL injection detected in parameter '{param}'",
                            f"Parameter '{param}' is vulnerable to SQL injection. Payload '{payload}' triggered SQL error in response. Attackers can extract, modify, or delete database data.",
                            "Use parameterized queries (prepared statements) instead of string concatenation. Never build SQL from user input.",
                            "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))  # parameterized",
                            f"Payload: {payload}, Error pattern: {pattern}",
                            "CWE-89",
                            test_url,
                        ))
                        return findings  # One SQLi finding per scan is enough
            except Exception:
                pass

    return findings


# ==========================================
# XSS DETECTION
# ==========================================

async def check_xss(client: httpx.AsyncClient, base_url: str, host: str, params_to_test: list[str]) -> list[dict]:
    """
    Test URL parameters for reflected XSS by injecting a unique HTML marker
    and checking if it appears unescaped in the response.

    Why marker not script tag: We don't need to execute JavaScript — we just
    need to confirm the input is reflected without HTML encoding.
    """
    findings = []

    for param in params_to_test:
        try:
            test_url = _inject_param(base_url, param, XSS_PAYLOAD)
            resp = await client.get(test_url)
            body = resp.text

            # Check if our marker appears UNESCAPED (literal <cystene_xss_test_42>)
            # If escaped, it would be &lt;cystene_xss_test_42&gt; — that's safe
            if f"<{XSS_MARKER}>" in body:
                findings.append(_finding(
                    host, "high", "injection_detected", "reflected_xss",
                    f"Reflected XSS detected in parameter '{param}'",
                    f"Parameter '{param}' reflects user input without HTML encoding. Attackers can inject JavaScript to steal sessions, redirect users, or deface the page.",
                    "HTML-encode all user input before rendering. Use Content-Security-Policy header.",
                    "from markupsafe import escape; output = escape(user_input)  # Python/Jinja2",
                    f"Payload reflected unescaped: {XSS_PAYLOAD}",
                    "CWE-79",
                    test_url,
                ))
                return findings  # One XSS finding per scan is enough
        except Exception:
            pass

    return findings


# ==========================================
# COMMAND INJECTION DETECTION
# ==========================================

async def check_cmd_injection(client: httpx.AsyncClient, base_url: str, host: str, params_to_test: list[str]) -> list[dict]:
    """
    Test URL parameters for command injection by injecting echo MARKER
    and checking if the marker appears in the response.

    Why echo: Read-only, harmless, and if the marker appears in response
    body, the server executed our command — confirmed without side effects.
    Pattern from cmd_injector.py: test ;, |, && operators.
    """
    findings = []

    for param in params_to_test:
        for payload in CMD_PAYLOADS:
            try:
                test_url = _inject_param(base_url, param, payload)
                resp = await client.get(test_url)

                if CMD_MARKER in resp.text:
                    findings.append(_finding(
                        host, "critical", "injection_detected", "cmd_injection",
                        f"Command injection detected in parameter '{param}'",
                        f"Parameter '{param}' allows OS command execution. Attackers can run arbitrary commands on the server, leading to full system compromise.",
                        "Never pass user input to shell commands. Use safe APIs that don't invoke a shell.",
                        "subprocess.run(['ping', '-c', '4', host], shell=False)  # safe, no shell",
                        f"Payload: {payload}, Marker found in response",
                        "CWE-78",
                        test_url,
                    ))
                    return findings  # One cmd injection finding is enough
            except Exception:
                pass

    return findings


# ==========================================
# LFI DETECTION
# ==========================================

async def check_lfi(client: httpx.AsyncClient, base_url: str, host: str, params_to_test: list[str]) -> list[dict]:
    """
    Test URL parameters for Local File Inclusion by injecting path traversal
    sequences and checking if /etc/passwd content appears.

    Why /etc/passwd: Universal readable file on Linux, contains no secrets
    (passwords are in /etc/shadow). Presence of "root:" confirms file read
    capability. We never access sensitive files.
    """
    findings = []

    file_params = [p for p in params_to_test if p in ("file", "path", "page", "include", "template", "doc")]
    if not file_params:
        file_params = ["file", "page", "path"]

    for param in file_params:
        for payload in LFI_PAYLOADS:
            try:
                test_url = _inject_param(base_url, param, payload)
                resp = await client.get(test_url)
                body = resp.text.lower()

                for indicator in LFI_INDICATORS:
                    if indicator in body:
                        findings.append(_finding(
                            host, "high", "injection_detected", "lfi_path_traversal",
                            f"Local File Inclusion detected in parameter '{param}'",
                            f"Parameter '{param}' allows reading server files via path traversal. Attackers can read configuration files, source code, and credentials.",
                            "Never use user input to construct file paths. Use a whitelist of allowed files.",
                            None,
                            f"Payload: {payload}, Indicator: {indicator}",
                            "CWE-22",
                            test_url,
                        ))
                        return findings
            except Exception:
                pass

    return findings


# ==========================================
# OPEN REDIRECT DETECTION
# ==========================================

async def check_open_redirect(client: httpx.AsyncClient, base_url: str, host: str) -> list[dict]:
    """
    Test common redirect parameters for open redirect vulnerability.

    Why test redirect params: If the server redirects to an attacker-controlled
    URL without validation, it enables phishing (user trusts the legitimate domain
    but gets sent to evil site).
    """
    findings = []

    for param in REDIRECT_PARAMS:
        try:
            test_url = _inject_param(base_url, param, REDIRECT_TARGET)
            # Why follow_redirects=False: We want to see the raw redirect, not follow it
            resp = await client.get(test_url, follow_redirects=False)

            if resp.status_code in (301, 302, 303, 307, 308):
                location = resp.headers.get("location", "")
                if REDIRECT_TARGET in location or "evil" in location.lower():
                    findings.append(_finding(
                        host, "medium", "open_redirect", "open_redirect",
                        f"Open redirect detected via parameter '{param}'",
                        f"Parameter '{param}' redirects to attacker-controlled URLs without validation. Enables phishing attacks using the trusted domain.",
                        f"Validate redirect URLs against a whitelist of allowed domains. Never redirect to user-supplied URLs.",
                        None,
                        f"Param: {param}, Redirect to: {location}",
                        "CWE-601",
                        test_url,
                    ))
                    return findings
        except Exception:
            pass

    return findings


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute active web vulnerability scan against target.

    REQUIRES active_scan_consent=True in params. If not set, returns empty results
    with an error explaining why.

    Args:
        target: Domain, IP, or URL to scan
        params: Scanner parameters from ScanTemplate:
            - active_scan_consent: bool (REQUIRED — must be True)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    # Safety check — refuse to run without explicit consent
    if not params.get("active_scan_consent", False):
        errors.append("Active web scan requires active_scan_consent=True. This scanner sends payloads to the target.")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    base_url = _normalize_url(target)
    host = base_url.replace("https://", "").replace("http://", "").split("/")[0]

    logger.info(f"Active web scan starting: target={host} (consent=True)")

    # Determine which parameters to test
    # Why parse existing URL params + add common ones: Existing params are the most
    # likely injection points. Common param names catch additional entry points.
    parsed = urlparse(base_url)
    existing_params = list(parse_qs(parsed.query).keys())
    params_to_test = list(set(existing_params + TEST_PARAMS[:5]))  # Limit to 5 common + existing

    async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=False) as client:

        # 1. SQL injection detection
        try:
            sqli_findings = await check_sqli(client, base_url, host, params_to_test)
            findings.extend(sqli_findings)
        except Exception as e:
            errors.append(f"SQLi check failed: {e}")

        # 2. Reflected XSS detection
        try:
            xss_findings = await check_xss(client, base_url, host, params_to_test)
            findings.extend(xss_findings)
        except Exception as e:
            errors.append(f"XSS check failed: {e}")

        # 3. Command injection detection
        try:
            cmd_findings = await check_cmd_injection(client, base_url, host, params_to_test)
            findings.extend(cmd_findings)
        except Exception as e:
            errors.append(f"Command injection check failed: {e}")

        # 4. Local File Inclusion detection
        try:
            lfi_findings = await check_lfi(client, base_url, host, params_to_test)
            findings.extend(lfi_findings)
        except Exception as e:
            errors.append(f"LFI check failed: {e}")

        # 5. Open redirect detection
        try:
            redirect_findings = await check_open_redirect(client, base_url, host)
            findings.extend(redirect_findings)
        except Exception as e:
            errors.append(f"Open redirect check failed: {e}")

    duration = round(time.time() - start_time, 1)
    logger.info(f"Active web scan complete: host={host}, findings={len(findings)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
