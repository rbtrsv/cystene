"""
API Scanner — GraphQL Introspection + CORS Misconfiguration + Rate Limiting + API Discovery

Checks for API-specific vulnerabilities: exposed GraphQL schemas, permissive CORS policies,
missing rate limiting, and publicly accessible API documentation.

References:
- Lesson 17 (API attacks — JWT, GraphQL, CORS, rate limiting, IDOR)
- BHR Ch6 (SSRF, CSRF, open redirect)
- web_technologies.md (CORS, API security, authentication)
- domain-architecture.md §4.2 (api_scan specification)

Why separate from web_scan: web_scan checks generic HTTP security (headers, files).
api_scan checks API-specific issues (GraphQL, CORS origin reflection, rate limiting).
Different concerns, different expertise, different finding categories.
"""

import asyncio
import hashlib
import logging
import time

import httpx

logger = logging.getLogger(__name__)


# ==========================================
# COMMON API PATHS TO DISCOVER
# ==========================================

# Why these paths: Standard API framework defaults. If accessible without auth, it's a finding.
# Swagger/OpenAPI exposure reveals entire API surface to attackers.
API_PATHS = [
    # API root endpoints
    ("/api/", "info", "api_endpoint_found", "API root endpoint accessible"),
    ("/api/v1/", "info", "api_endpoint_found", "API v1 endpoint accessible"),
    ("/api/v2/", "info", "api_endpoint_found", "API v2 endpoint accessible"),
    # GraphQL
    ("/graphql", None, None, None),  # Handled separately by GraphQL introspection check
    ("/graphql/", None, None, None),
    # Documentation — these should not be public in production
    ("/swagger.json", "low", "openapi_exposed", "Swagger JSON schema publicly accessible"),
    ("/openapi.json", "low", "openapi_exposed", "OpenAPI JSON schema publicly accessible"),
    ("/api-docs", "low", "openapi_exposed", "API documentation publicly accessible"),
    ("/swagger-ui.html", "low", "openapi_exposed", "Swagger UI publicly accessible"),
    ("/redoc", "low", "openapi_exposed", "ReDoc API documentation publicly accessible"),
    ("/docs", "low", "openapi_exposed", "API docs endpoint publicly accessible"),
    # Health/status — info leak about internals
    ("/api/health", "info", "api_health_exposed", "API health endpoint accessible"),
    ("/api/status", "info", "api_status_exposed", "API status endpoint accessible"),
    ("/healthz", "info", "api_health_exposed", "Kubernetes health endpoint accessible"),
    ("/.well-known/openid-configuration", "info", "oidc_config_exposed", "OpenID Connect config accessible"),
]


# ==========================================
# GRAPHQL INTROSPECTION QUERY
# ==========================================

# Why this specific query: Standard GraphQL introspection. If the server returns __schema,
# the entire API schema is exposed — types, fields, queries, mutations.
# Attackers use this to map the entire API surface without guessing.
GRAPHQL_INTROSPECTION_QUERY = '{"query": "{ __schema { queryType { name } types { name fields { name type { name } } } } }"}'


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str) -> str:
    return hashlib.sha256(f"{category}|{finding_type}|{host}|||".encode()).hexdigest()


def _finding(host, severity, category, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, cwe_id=None, url=None):
    """Build finding dict matching Finding model fields exactly."""
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
        "owasp_category": "A01:2021-Broken Access Control",
        "mitre_tactic": "Reconnaissance",
        "mitre_technique": "T1595.002",
        "status": "open",
    }


def _normalize_url(target: str) -> str:
    """Ensure target has https:// prefix."""
    target = target.strip().rstrip("/")
    if not target.startswith("http://") and not target.startswith("https://"):
        return f"https://{target}"
    return target


# ==========================================
# GRAPHQL INTROSPECTION CHECK
# ==========================================

async def check_graphql(client: httpx.AsyncClient, base_url: str, host: str) -> list[dict]:
    """
    Check if GraphQL introspection is enabled.

    Why this matters: Introspection exposes the entire API schema — all types, fields,
    queries, and mutations. Attackers use this to find hidden endpoints and sensitive data.
    Production GraphQL APIs should disable introspection.
    """
    findings = []

    # Try common GraphQL endpoints
    for path in ["/graphql", "/graphql/", "/query", "/api/graphql"]:
        try:
            resp = await client.post(
                f"{base_url}{path}",
                content=GRAPHQL_INTROSPECTION_QUERY,
                headers={"Content-Type": "application/json"},
            )

            if resp.status_code == 200 and "__schema" in resp.text:
                # Count discovered types for evidence
                try:
                    data = resp.json()
                    types = data.get("data", {}).get("__schema", {}).get("types", [])
                    type_names = [t["name"] for t in types if not t["name"].startswith("__")]
                    evidence = f"GraphQL introspection enabled at {path}. {len(type_names)} types exposed: {', '.join(type_names[:10])}"
                except Exception:
                    evidence = f"GraphQL introspection enabled at {path}"

                findings.append(_finding(
                    host, "medium", "api_vulnerability", "graphql_introspection_enabled",
                    f"GraphQL introspection enabled at {path}",
                    "GraphQL introspection is enabled, exposing the entire API schema (types, fields, queries, mutations). Attackers can map the full API surface without guessing.",
                    "Disable GraphQL introspection in production.",
                    "# Apollo Server\nnew ApolloServer({ introspection: false })\n# Strawberry (Python)\nschema = strawberry.Schema(query=Query, enable_introspection=False)",
                    evidence,
                    "CWE-200",
                    f"{base_url}{path}",
                ))
                break  # Found GraphQL, no need to check other paths

        except Exception:
            pass

    return findings


# ==========================================
# CORS MISCONFIGURATION CHECK
# ==========================================

async def check_cors(client: httpx.AsyncClient, base_url: str, host: str) -> list[dict]:
    """
    Check for CORS misconfigurations.

    Why this matters:
    - Wildcard origin (*) allows any site to read responses — bad for authenticated APIs.
    - Origin reflection (reflecting whatever Origin header is sent) is even worse —
      enables credential theft via cross-site requests.
    """
    findings = []

    try:
        # Send request with a clearly evil Origin header
        # Why "evil.attacker.com": If the server reflects this back, it reflects ANY origin
        resp = await client.get(base_url, headers={"Origin": "https://evil.attacker.com"})
        acao = resp.headers.get("access-control-allow-origin", "")
        acac = resp.headers.get("access-control-allow-credentials", "")

        if acao == "*":
            # Wildcard origin — any website can read responses
            findings.append(_finding(
                host, "medium", "cors_misconfiguration", "cors_wildcard_origin",
                f"CORS wildcard origin (*) on {host}",
                "Access-Control-Allow-Origin is set to '*', allowing any website to read API responses. This is dangerous for APIs that handle sensitive data.",
                "Set Access-Control-Allow-Origin to specific trusted domains instead of wildcard.",
                f'Access-Control-Allow-Origin: https://{host}',
                f"Access-Control-Allow-Origin: *",
                "CWE-942",
                base_url,
            ))

        elif acao == "https://evil.attacker.com":
            # Origin reflection — server reflects whatever Origin is sent
            # Why high: Combined with credentials, this allows full session hijacking
            severity = "high" if acac.lower() == "true" else "medium"
            findings.append(_finding(
                host, severity, "cors_misconfiguration", "cors_origin_reflection",
                f"CORS reflects arbitrary origin on {host}",
                f"Server reflects the Origin header back in Access-Control-Allow-Origin without validation. {'Combined with Allow-Credentials: true, this enables credential theft via cross-site requests.' if acac else 'An attacker can read API responses from any website.'}",
                "Validate the Origin header against a whitelist of trusted domains. Never reflect untrusted origins.",
                None,
                f"Sent Origin: https://evil.attacker.com, Got ACAO: {acao}, ACAC: {acac or 'not set'}",
                "CWE-942",
                base_url,
            ))

    except Exception:
        pass

    return findings


# ==========================================
# RATE LIMITING DETECTION
# ==========================================

async def check_rate_limiting(client: httpx.AsyncClient, base_url: str, host: str) -> list[dict]:
    """
    Check if basic rate limiting is in place.

    Why only 20 requests: More would be disruptive to the target. 20 requests in rapid
    succession is enough to detect basic rate limiting (most implementations trigger
    at 10-100 requests per window). We're detecting the presence of rate limiting,
    not testing its strength.
    """
    findings = []

    try:
        responses = []
        for _ in range(20):
            try:
                resp = await client.get(base_url)
                responses.append(resp.status_code)
            except Exception:
                break

        # Check if any request got rate limited (429)
        has_rate_limiting = 429 in responses

        if not has_rate_limiting and len(responses) >= 15:
            findings.append(_finding(
                host, "medium", "api_vulnerability", "no_rate_limiting",
                f"No rate limiting detected on {host}",
                f"Sent {len(responses)} rapid requests without receiving HTTP 429 (Too Many Requests). Missing rate limiting allows brute-force attacks, credential stuffing, and denial of service.",
                "Implement rate limiting per IP and per user (e.g., 60 requests/minute).",
                "# nginx\nlimit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;\nlimit_req zone=api burst=10 nodelay;",
                f"Sent {len(responses)} requests, received: {dict((s, responses.count(s)) for s in set(responses))}",
                "CWE-770",
                base_url,
            ))

    except Exception:
        pass

    return findings


# ==========================================
# API PATH DISCOVERY
# ==========================================

async def discover_api_paths(client: httpx.AsyncClient, base_url: str, host: str) -> tuple[list[dict], list[dict]]:
    """
    Check for common API paths and documentation endpoints.

    Returns (findings, assets).
    """
    findings = []
    assets = []

    # Why semaphore(5): API endpoints are more sensitive than static files.
    # Lower concurrency to avoid triggering WAF or overloading the API.
    semaphore = asyncio.Semaphore(5)

    async def check_path(path, severity, finding_type, description):
        if severity is None:  # GraphQL paths handled separately
            return None
        async with semaphore:
            try:
                url = f"{base_url}{path}"
                resp = await client.get(url, follow_redirects=False)

                # Only report if 200 OK (not redirects or errors)
                if resp.status_code == 200:
                    # API docs exposure is a finding
                    if finding_type == "openapi_exposed":
                        return _finding(
                            host, severity, "information_disclosure", finding_type,
                            description,
                            f"API documentation at {path} is publicly accessible without authentication. Attackers can use this to understand the full API surface.",
                            f"Restrict access to {path} behind authentication or remove in production.",
                            None,
                            resp.text[:200],
                            "CWE-200",
                            url,
                        )
                    # API endpoints as assets
                    assets.append({
                        "asset_type": "technology",
                        "value": f"API endpoint: {path}",
                        "host": host,
                        "port": None,
                        "protocol": None,
                        "service_name": "api",
                        "service_version": None,
                        "banner": None,
                        "service_metadata": None,
                        "confidence": "confirmed",
                    })
            except Exception:
                pass
            return None

    tasks = [check_path(path, sev, ft, desc) for path, sev, ft, desc in API_PATHS]
    results = await asyncio.gather(*tasks)
    findings.extend([r for r in results if r])

    return findings, assets


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute API scan against target.

    Args:
        target: Domain, IP, or URL to scan
        params: Scanner parameters from ScanTemplate

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    base_url = _normalize_url(target)
    host = base_url.replace("https://", "").replace("http://", "").split("/")[0]

    logger.info(f"API scan starting: target={host}")

    # Why verify=False: SSL is ssl_scan's concern. API scanner must work on all targets.
    # Why timeout=10: Prevents hanging on slow/tarpitting servers.
    async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:

        # 1. GraphQL introspection check
        try:
            gql_findings = await check_graphql(client, base_url, host)
            findings.extend(gql_findings)
        except Exception as e:
            errors.append(f"GraphQL check failed: {e}")

        # 2. CORS misconfiguration check
        try:
            cors_findings = await check_cors(client, base_url, host)
            findings.extend(cors_findings)
        except Exception as e:
            errors.append(f"CORS check failed: {e}")

        # 3. Rate limiting detection
        try:
            rl_findings = await check_rate_limiting(client, base_url, host)
            findings.extend(rl_findings)
        except Exception as e:
            errors.append(f"Rate limiting check failed: {e}")

        # 4. API path discovery + documentation exposure
        try:
            path_findings, path_assets = await discover_api_paths(client, base_url, host)
            findings.extend(path_findings)
            assets.extend(path_assets)
        except Exception as e:
            errors.append(f"API path discovery failed: {e}")

    duration = round(time.time() - start_time, 1)
    logger.info(f"API scan complete: host={host}, findings={len(findings)}, assets={len(assets)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
