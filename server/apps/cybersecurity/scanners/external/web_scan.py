"""
Web Scanner — Security Headers + Server Disclosure + Sensitive File Discovery

Checks HTTP security headers, detects server/technology info leaks, tests for
exposed sensitive files (.git, .env, admin panels, backups), and verifies HTTPS redirect.

References:
- BHR Ch4 (14 modular HTTP checks: GitHeadDisclosure, DotEnvDisclosure, DirectoryListing, etc.)
- dir_buster.sh (50+ common paths)
- web_technologies.md (security headers list)
- Lesson 1 (curl headers, robots.txt)
- domain-architecture.md §4.2 (web_scan specification)

Why httpx not requests: httpx supports async natively, no need for asyncio.to_thread().
Why verify=False: SSL validity is handled by ssl_scan. Web scanner must work even on targets
with invalid/self-signed certs — otherwise half the checks would fail before they start.
"""

import asyncio
import hashlib
import logging
import time

import httpx

logger = logging.getLogger(__name__)


# ==========================================
# SECURITY HEADERS TO CHECK
# ==========================================

# Why these headers: OWASP Secure Headers Project recommends all of these.
# Missing any of them is a finding — severity based on exploitability.
REQUIRED_HEADERS = {
    "content-security-policy": {
        "finding_type": "missing_csp",
        "severity": "medium",
        "title": "Missing Content-Security-Policy header",
        "description": "No CSP header found. CSP prevents XSS and data injection attacks by restricting resource loading sources.",
        "remediation": "Add a Content-Security-Policy header to restrict resource loading.",
        "remediation_script": "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'\" always;",
        "cwe_id": "CWE-693",
    },
    "x-frame-options": {
        "finding_type": "missing_xfo",
        "severity": "medium",
        "title": "Missing X-Frame-Options header",
        "description": "No X-Frame-Options header found. Without it, the page can be embedded in iframes, enabling clickjacking attacks.",
        "remediation": "Add X-Frame-Options header set to DENY or SAMEORIGIN.",
        "remediation_script": 'add_header X-Frame-Options "DENY" always;',
        "cwe_id": "CWE-1021",
    },
    "x-content-type-options": {
        "finding_type": "missing_xcto",
        "severity": "low",
        "title": "Missing X-Content-Type-Options header",
        "description": "No X-Content-Type-Options header found. Without it, browsers may MIME-sniff responses, leading to XSS.",
        "remediation": "Add X-Content-Type-Options: nosniff header.",
        "remediation_script": 'add_header X-Content-Type-Options "nosniff" always;',
        "cwe_id": "CWE-693",
    },
    "referrer-policy": {
        "finding_type": "missing_referrer_policy",
        "severity": "low",
        "title": "Missing Referrer-Policy header",
        "description": "No Referrer-Policy header found. Sensitive URL parameters may leak to third-party sites via Referer header.",
        "remediation": "Add Referrer-Policy header (recommended: strict-origin-when-cross-origin).",
        "remediation_script": 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
        "cwe_id": None,
    },
    "permissions-policy": {
        "finding_type": "missing_permissions_policy",
        "severity": "low",
        "title": "Missing Permissions-Policy header",
        "description": "No Permissions-Policy header found. Browser features (camera, microphone, geolocation) are not explicitly restricted.",
        "remediation": "Add Permissions-Policy header to restrict browser feature access.",
        "remediation_script": 'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
        "cwe_id": None,
    },
}


# ==========================================
# SENSITIVE FILE PATHS
# ==========================================

# Why content markers: Prevents false positives from custom 404 pages that return HTTP 200.
# BHR Ch4 pattern: GitHeadDisclosure checks if response starts with "ref:" before reporting.
# (path, content_marker_or_None, finding_type, severity, description)
SENSITIVE_PATHS = [
    ("/.git/HEAD", "ref:", "git_head_exposed", "high",
     "Git repository HEAD file is accessible. Attackers can reconstruct source code."),
    ("/.git/config", "[core]", "git_config_exposed", "high",
     "Git config file is accessible. May contain remote URLs and credentials."),
    ("/.env", "=", "env_file_exposed", "critical",
     "Environment file (.env) is accessible. May contain API keys, database passwords, and secrets."),
    ("/.ds_store", None, "ds_store_exposed", "low",
     "macOS .DS_Store file is accessible. Reveals directory structure."),
    ("/robots.txt", None, "robots_found", "info",
     "robots.txt found. May reveal hidden paths."),
    ("/sitemap.xml", "<?xml", "sitemap_found", "info",
     "sitemap.xml found. Maps site structure."),
    ("/admin", None, "admin_panel_exposed", "medium",
     "Admin panel path is accessible. May expose administrative interface."),
    ("/wp-admin", None, "wp_admin_exposed", "medium",
     "WordPress admin panel is accessible."),
    ("/phpmyadmin", None, "phpmyadmin_exposed", "high",
     "phpMyAdmin is accessible. Database management tool should not be public."),
    ("/swagger", None, "swagger_exposed", "low",
     "Swagger/OpenAPI documentation is publicly accessible."),
    ("/api/docs", None, "api_docs_exposed", "low",
     "API documentation endpoint is publicly accessible."),
    ("/server-status", "Apache", "server_status_exposed", "medium",
     "Apache server-status page is accessible. Exposes server internals."),
    ("/.htaccess", None, "htaccess_exposed", "medium",
     "Apache .htaccess file is accessible. May contain rewrite rules and auth config."),
    ("/backup", None, "backup_dir_exposed", "high",
     "Backup directory is accessible. May contain database dumps or source code."),
    ("/config", None, "config_dir_exposed", "high",
     "Config directory is accessible. May contain application configuration files."),
    ("/phpinfo.php", "phpinfo()", "phpinfo_exposed", "medium",
     "phpinfo() page is accessible. Exposes PHP configuration and server details."),
]


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str) -> str:
    """Generate SHA-256 fingerprint for deduplication across scans."""
    return hashlib.sha256(f"{category}|{finding_type}|{host}|||".encode()).hexdigest()


def _finding(host, severity, category, finding_type, title, description, remediation, remediation_script=None, evidence=None, cwe_id=None, url=None):
    """Build finding dict matching Finding model fields exactly."""
    return {
        "fingerprint": _fingerprint(category, finding_type, host),
        "is_new": True,
        "severity": severity,
        "category": category,
        "finding_type": finding_type,
        "title": f"{title} for {host}" if "for" not in title else title,
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
        "owasp_category": "A05:2021-Security Misconfiguration",
        "mitre_tactic": "Reconnaissance",
        "mitre_technique": "T1595.002",
        "status": "open",
    }


def _normalize_url(target: str) -> tuple[str, str]:
    """
    Normalize target into base URLs for scanning.
    Returns (https_url, http_url).

    Why: User might provide "example.com", "http://example.com", or "https://example.com".
    We need both forms — HTTPS for main checks, HTTP for redirect test.
    """
    target = target.strip().rstrip("/")
    if target.startswith("https://"):
        host = target[8:]
        return target, f"http://{host}"
    elif target.startswith("http://"):
        host = target[7:]
        return f"https://{host}", target
    else:
        return f"https://{target}", f"http://{target}"


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute web scan against target.

    Args:
        target: Domain, IP, or URL to scan
        params: Scanner parameters from ScanTemplate:
            - check_headers: bool (default True) — check security headers
            - follow_redirects: bool (default True) — follow HTTP redirects

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    check_headers = params.get("check_headers", True)
    follow_redirects = params.get("follow_redirects", True)

    https_url, http_url = _normalize_url(target)
    # Extract hostname for fingerprints and finding titles
    host = https_url.replace("https://", "").replace("http://", "").split("/")[0]

    logger.info(f"Web scan starting: target={host}, check_headers={check_headers}")

    # Why verify=False: SSL validity is ssl_scan's job. Web scanner must work on all targets.
    # Why timeout=10: Prevents hanging on slow/tarpitting servers.
    async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=follow_redirects) as client:

        # 1. Main page request — get headers + detect technologies
        try:
            resp = await client.get(https_url)
            headers = resp.headers
            status_code = resp.status_code

            # Detect server technology from headers → asset
            server = headers.get("server")
            if server:
                assets.append({
                    "asset_type": "technology",
                    "value": server,
                    "host": host,
                    "port": None,
                    "protocol": None,
                    "service_name": "http",
                    "service_version": server,
                    "banner": None,
                    "service_metadata": None,
                    "confidence": "confirmed",
                })

                # Server version disclosure finding
                # Why only if version-like: "nginx" alone is fine, "nginx/1.24.0" leaks version
                if "/" in server:
                    findings.append(_finding(
                        host, "low", "information_disclosure", "server_version_exposed",
                        f"Server header exposes version: {server}",
                        f"Server header reveals software and version ({server}). Attackers use this for targeted exploits.",
                        "Remove or genericize the Server header.",
                        'server_tokens off;  # nginx\nServerTokens Prod  # apache',
                        f"Server: {server}",
                    ))

            # X-Powered-By disclosure
            powered_by = headers.get("x-powered-by")
            if powered_by:
                findings.append(_finding(
                    host, "low", "information_disclosure", "powered_by_exposed",
                    f"X-Powered-By header exposes technology: {powered_by}",
                    f"X-Powered-By header reveals backend technology ({powered_by}).",
                    "Remove the X-Powered-By header from responses.",
                    'Header unset X-Powered-By  # apache\nfastcgi_hide_header X-Powered-By;  # nginx+php',
                    f"X-Powered-By: {powered_by}",
                ))

            # 2. Security headers check
            if check_headers:
                for header_name, info in REQUIRED_HEADERS.items():
                    if header_name not in headers:
                        findings.append(_finding(
                            host, info["severity"], "missing_header", info["finding_type"],
                            info["title"],
                            info["description"],
                            info["remediation"],
                            info["remediation_script"],
                            f"Header '{header_name}' not present in response",
                            info["cwe_id"],
                            https_url,
                        ))

        except httpx.TimeoutException:
            errors.append(f"Timeout connecting to {https_url}")
        except Exception as e:
            errors.append(f"Error fetching {https_url}: {e}")

        # 3. HTTP → HTTPS redirect check
        try:
            # Why follow_redirects=False: We want to see the raw redirect, not follow it
            http_resp = await client.get(http_url, follow_redirects=False)
            location = http_resp.headers.get("location", "")
            if http_resp.status_code not in (301, 302, 307, 308) or "https://" not in location.lower():
                findings.append(_finding(
                    host, "medium", "web_misconfiguration", "no_https_redirect",
                    f"No HTTP to HTTPS redirect for {host}",
                    "HTTP requests are not redirected to HTTPS. Users accessing via HTTP are not protected by TLS encryption.",
                    "Configure a 301 redirect from HTTP to HTTPS.",
                    f"server {{ listen 80; server_name {host}; return 301 https://$host$request_uri; }}",
                    f"HTTP {http_resp.status_code}, Location: {location or 'none'}",
                    "CWE-319",
                    http_url,
                ))
        except Exception:
            pass  # HTTP might not be available — not an error

        # 4. Sensitive file discovery
        # Why semaphore(10): Don't overwhelm the target. WAFs may block mass requests.
        semaphore = asyncio.Semaphore(10)

        async def check_path(path, marker, finding_type, severity, description):
            async with semaphore:
                try:
                    url = f"{https_url}{path}"
                    resp = await client.get(url, follow_redirects=False)

                    # Only report if HTTP 200 and content matches marker (avoids false positives from custom 404s)
                    if resp.status_code == 200:
                        content = resp.text[:2000]

                        # If marker specified, verify content contains it
                        if marker and marker.lower() not in content.lower():
                            return None

                        # Skip info-level findings for robots.txt/sitemap (too noisy)
                        if severity == "info":
                            # For robots.txt, parse disallowed paths as evidence
                            if finding_type == "robots_found":
                                disallowed = [line.split(":")[1].strip() for line in content.split("\n")
                                              if line.strip().lower().startswith("disallow:") and len(line.split(":")) > 1]
                                if disallowed:
                                    return _finding(
                                        host, "info", "information_disclosure", "robots_sensitive_paths",
                                        f"robots.txt reveals {len(disallowed)} disallowed paths",
                                        f"robots.txt contains {len(disallowed)} Disallow entries that may reveal hidden areas.",
                                        "Review robots.txt entries — sensitive paths should be protected by authentication, not obscurity.",
                                        None,
                                        f"Disallowed: {', '.join(disallowed[:10])}",
                                        url=url,
                                    )
                            return None

                        return _finding(
                            host, severity, "file_exposure", finding_type,
                            f"Sensitive file accessible: {path}",
                            description,
                            f"Remove or restrict access to {path}. Add authentication or deny access in web server config.",
                            f'location {path} {{ deny all; return 404; }}',
                            content[:200],
                            "CWE-538",
                            url,
                        )
                except Exception:
                    pass
                return None

        tasks = [check_path(path, marker, ft, sev, desc) for path, marker, ft, sev, desc in SENSITIVE_PATHS]
        results = await asyncio.gather(*tasks)
        for result in results:
            if result:
                findings.append(result)

    duration = round(time.time() - start_time, 1)
    logger.info(f"Web scan complete: host={host}, findings={len(findings)}, assets={len(assets)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
