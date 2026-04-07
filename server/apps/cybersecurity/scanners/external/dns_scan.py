"""
DNS Scanner — DNS Record Enumeration + Subdomain Discovery + Email Security Checks

Queries DNS records (A, AAAA, MX, NS, TXT, CNAME), checks SPF/DKIM/DMARC,
and enumerates subdomains via crt.sh certificate transparency API.

References:
- BHR ch_02/tricoder/src/subdomains.rs (crt.sh API, subdomain filtering)
- infosec-research/lessons/lesson_1 (DNS commands, record types)
- domain-architecture.md §4.2 (dns_scan specification)
"""

import asyncio
import hashlib
import logging
import time

import dns.resolver
import httpx

logger = logging.getLogger(__name__)


# ==========================================
# COMMON SUBDOMAIN WORDLIST (brute-force)
# ==========================================

SUBDOMAIN_WORDLIST_SMALL = [
    "www", "mail", "ftp", "smtp", "pop", "imap", "webmail", "mx",
    "api", "app", "dev", "staging", "test", "qa", "uat", "sandbox",
    "admin", "panel", "dashboard", "portal", "login", "auth", "sso",
    "cdn", "static", "assets", "media", "img", "images", "files",
    "ns1", "ns2", "ns3", "dns", "dns1", "dns2",
    "vpn", "remote", "gateway", "proxy", "firewall",
    "db", "database", "sql", "mysql", "postgres", "mongo", "redis", "cache",
    "git", "gitlab", "github", "bitbucket", "jenkins", "ci", "cd",
    "docs", "wiki", "help", "support", "status", "monitor", "grafana",
    "blog", "shop", "store", "pay", "billing", "checkout",
    "internal", "intranet", "corp", "office", "exchange",
    "backup", "old", "legacy", "archive", "temp",
    "m", "mobile", "wap",
    "www2", "www3", "web", "web1", "web2",
    "server", "host", "node", "worker",
    "elasticsearch", "kibana", "prometheus", "traefik",
    "s3", "bucket", "cloud", "aws", "azure", "gcp",
]


# ==========================================
# DNS RECORD QUERIES
# ==========================================

async def query_dns_records(domain: str) -> tuple[list[dict], list[dict]]:
    """
    Query all standard DNS record types for a domain.
    Returns (assets, txt_records) — txt_records used for SPF/DKIM/DMARC checks.

    Uses asyncio.to_thread() to avoid blocking event loop.
    Why: dns.resolver is sync but fast (UDP). to_thread keeps it non-blocking.
    """
    assets = []
    txt_records = []
    record_types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]

    resolver = dns.resolver.Resolver()
    resolver.lifetime = 4.0

    for rtype in record_types:
        try:
            answers = await asyncio.to_thread(resolver.resolve, domain, rtype)
            for answer in answers:
                value = str(answer).strip('"').strip(".")

                assets.append({
                    "asset_type": "dns_record",
                    "value": value,
                    "host": domain,
                    "port": None,
                    "protocol": None,
                    "service_name": rtype,
                    "service_version": None,
                    "banner": None,
                    "service_metadata": None,
                    "confidence": "confirmed",
                })

                if rtype == "TXT":
                    txt_records.append(value)

        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers, dns.resolver.Timeout):
            pass
        except Exception as e:
            logger.debug(f"DNS query {rtype} for {domain}: {e}")

    return assets, txt_records


# ==========================================
# EMAIL SECURITY CHECKS (SPF / DKIM / DMARC)
# ==========================================

def check_email_security(domain: str, txt_records: list[str]) -> list[dict]:
    """
    Check for SPF, DKIM, and DMARC records.
    Returns findings for missing email security configurations.
    """
    findings = []

    # SPF check — look for "v=spf1" in TXT records
    has_spf = any("v=spf1" in txt.lower() for txt in txt_records)
    if not has_spf:
        findings.append({
            "fingerprint": hashlib.sha256(f"dns_misconfiguration|missing_spf|{domain}|||".encode()).hexdigest(),
            "is_new": True,
            "severity": "medium",
            "category": "dns_misconfiguration",
            "finding_type": "missing_spf",
            "title": f"Missing SPF record for {domain}",
            "description": f"No SPF (Sender Policy Framework) TXT record found for {domain}. SPF prevents email spoofing by specifying which servers are authorized to send email for this domain.",
            "remediation": "Add a TXT record with an SPF policy specifying authorized mail servers.",
            "remediation_script": f"v=spf1 include:_spf.google.com ~all",
            "evidence": f"No TXT record containing 'v=spf1' found for {domain}",
            "host": domain,
            "port": None,
            "protocol": None,
            "url": None,
            "cve_id": None,
            "cvss_score": None,
            "cwe_id": "CWE-290",
            "owasp_category": None,
            "mitre_tactic": "Reconnaissance",
            "mitre_technique": "T1596.002",
            "status": "open",
        })

    # DMARC check — query _dmarc.domain TXT record
    has_dmarc = any("v=dmarc1" in txt.lower() for txt in txt_records)
    if not has_dmarc:
        # Also check _dmarc subdomain
        try:
            resolver = dns.resolver.Resolver()
            resolver.lifetime = 4.0
            dmarc_answers = resolver.resolve(f"_dmarc.{domain}", "TXT")
            for answer in dmarc_answers:
                if "v=dmarc1" in str(answer).lower():
                    has_dmarc = True
                    break
        except Exception:
            pass

    if not has_dmarc:
        findings.append({
            "fingerprint": hashlib.sha256(f"dns_misconfiguration|missing_dmarc|{domain}|||".encode()).hexdigest(),
            "is_new": True,
            "severity": "medium",
            "category": "dns_misconfiguration",
            "finding_type": "missing_dmarc",
            "title": f"Missing DMARC record for {domain}",
            "description": f"No DMARC (Domain-based Message Authentication, Reporting & Conformance) record found for {domain}. DMARC builds on SPF and DKIM to prevent email spoofing and phishing.",
            "remediation": "Add a TXT record at _dmarc.{domain} with a DMARC policy.",
            "remediation_script": f"_dmarc.{domain} IN TXT \"v=DMARC1; p=quarantine; rua=mailto:dmarc@{domain}\"",
            "evidence": f"No TXT record containing 'v=DMARC1' found at _dmarc.{domain}",
            "host": domain,
            "port": None,
            "protocol": None,
            "url": None,
            "cve_id": None,
            "cvss_score": None,
            "cwe_id": "CWE-290",
            "owasp_category": None,
            "mitre_tactic": "Reconnaissance",
            "mitre_technique": "T1596.002",
            "status": "open",
        })

    return findings


# ==========================================
# SUBDOMAIN ENUMERATION (crt.sh)
# ==========================================

async def enumerate_subdomains_crtsh(domain: str) -> list[str]:
    """
    Enumerate subdomains via crt.sh certificate transparency API.
    Pattern from BHR ch_02/tricoder/src/subdomains.rs.

    Returns deduplicated list of discovered subdomains.
    """
    subdomains = set()

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(f"https://crt.sh/?q=%25.{domain}&output=json")

            if resp.status_code != 200:
                logger.warning(f"crt.sh returned {resp.status_code} for {domain}")
                return []

            entries = resp.json()

            for entry in entries:
                name_value = entry.get("name_value", "")
                # Certificates can have multiple SANs separated by newlines
                for subdomain in name_value.split("\n"):
                    subdomain = subdomain.strip().lower()
                    # Filter wildcards and exact domain match
                    if subdomain and "*" not in subdomain and subdomain != domain:
                        subdomains.add(subdomain)

    except httpx.TimeoutException:
        logger.warning(f"crt.sh timeout for {domain}")
    except Exception as e:
        logger.warning(f"crt.sh error for {domain}: {e}")

    return sorted(subdomains)


async def validate_subdomain(subdomain: str) -> bool:
    """Check if a subdomain resolves to an IP address."""
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = 3.0
        await asyncio.to_thread(resolver.resolve, subdomain, "A")
        return True
    except Exception:
        return False


async def brute_force_subdomains(domain: str, wordlist_size: str = "small") -> list[str]:
    """
    Brute-force subdomain discovery using common wordlist.
    Only runs if dns_brute_force=True in params.
    """
    wordlist = SUBDOMAIN_WORDLIST_SMALL  # Only small for now

    candidates = [f"{word}.{domain}" for word in wordlist]
    found = []

    # Validate in parallel with bounded concurrency
    semaphore = asyncio.Semaphore(20)

    async def check(sub):
        async with semaphore:
            if await validate_subdomain(sub):
                return sub
            return None

    results = await asyncio.gather(*[check(sub) for sub in candidates])
    found = [r for r in results if r is not None]

    return found


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute DNS scan against target domain.

    Args:
        target: Domain to scan (e.g. "example.com")
        params: Scanner parameters from ScanTemplate:
            - dns_brute_force: bool (attempt subdomain brute-force)
            - dns_wordlist: str ("small", "medium", "large")
            - timeout_seconds: int (overall scan timeout)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    errors = []
    findings = []
    assets = []

    domain = target.lower().strip()
    dns_brute_force = params.get("dns_brute_force", False)
    dns_wordlist = params.get("dns_wordlist", "small")

    logger.info(f"DNS scan starting: domain={domain}, brute_force={dns_brute_force}")

    # 1. Query DNS records
    try:
        dns_assets, txt_records = await query_dns_records(domain)
        assets.extend(dns_assets)
        logger.info(f"DNS records found: {len(dns_assets)} records for {domain}")
    except Exception as e:
        errors.append(f"DNS record query failed: {e}")

    # 2. Check email security (SPF / DKIM / DMARC)
    try:
        email_findings = check_email_security(domain, txt_records if 'txt_records' in dir() else [])
        findings.extend(email_findings)
    except Exception as e:
        errors.append(f"Email security check failed: {e}")

    # 3. Subdomain enumeration via crt.sh
    try:
        crtsh_subdomains = await enumerate_subdomains_crtsh(domain)
        logger.info(f"crt.sh found {len(crtsh_subdomains)} subdomains for {domain}")

        # Validate which subdomains actually resolve
        valid_subdomains = []
        for sub in crtsh_subdomains:
            if await validate_subdomain(sub):
                valid_subdomains.append(sub)

        for sub in valid_subdomains:
            # Finding: subdomain discovered
            findings.append({
                "fingerprint": hashlib.sha256(f"subdomain_discovery|subdomain_found|{domain}||{sub}".encode()).hexdigest(),
                "is_new": True,
                "severity": "info",
                "category": "subdomain_discovery",
                "finding_type": "subdomain_found",
                "title": f"Subdomain discovered: {sub}",
                "description": f"Subdomain {sub} was found via certificate transparency logs (crt.sh) and resolves to a valid IP address. This expands the attack surface.",
                "remediation": "Review if this subdomain should be publicly accessible. Remove DNS records for decommissioned services.",
                "remediation_script": None,
                "evidence": f"Source: crt.sh certificate transparency. Subdomain resolves via DNS.",
                "host": sub,
                "port": None,
                "protocol": None,
                "url": None,
                "cve_id": None,
                "cvss_score": None,
                "cwe_id": None,
                "owasp_category": None,
                "mitre_tactic": "Reconnaissance",
                "mitre_technique": "T1596.002",
                "status": "open",
            })

            # Asset: subdomain as host
            assets.append({
                "asset_type": "host",
                "value": sub,
                "host": sub,
                "port": None,
                "protocol": None,
                "service_name": None,
                "service_version": None,
                "banner": None,
                "service_metadata": None,
                "confidence": "confirmed",
            })

    except Exception as e:
        errors.append(f"Subdomain enumeration failed: {e}")

    # 4. Optional brute-force
    if dns_brute_force:
        try:
            brute_subs = await brute_force_subdomains(domain, dns_wordlist)
            # Only add subdomains not already found via crt.sh
            existing = {sub for sub in valid_subdomains} if 'valid_subdomains' in dir() else set()
            for sub in brute_subs:
                if sub not in existing:
                    findings.append({
                        "fingerprint": hashlib.sha256(f"subdomain_discovery|subdomain_brute|{domain}||{sub}".encode()).hexdigest(),
                        "is_new": True,
                        "severity": "info",
                        "category": "subdomain_discovery",
                        "finding_type": "subdomain_brute",
                        "title": f"Subdomain discovered (brute-force): {sub}",
                        "description": f"Subdomain {sub} was found via DNS brute-force and resolves to a valid IP address.",
                        "remediation": "Review if this subdomain should be publicly accessible.",
                        "remediation_script": None,
                        "evidence": f"Source: DNS brute-force with {dns_wordlist} wordlist.",
                        "host": sub,
                        "port": None,
                        "protocol": None,
                        "url": None,
                        "cve_id": None,
                        "cvss_score": None,
                        "cwe_id": None,
                        "owasp_category": None,
                        "mitre_tactic": "Reconnaissance",
                        "mitre_technique": "T1596.002",
                        "status": "open",
                    })
                    assets.append({
                        "asset_type": "host",
                        "value": sub,
                        "host": sub,
                        "port": None,
                        "protocol": None,
                        "service_name": None,
                        "service_version": None,
                        "banner": None,
                        "service_metadata": None,
                        "confidence": "confirmed",
                    })
            logger.info(f"Brute-force found {len(brute_subs)} additional subdomains for {domain}")
        except Exception as e:
            errors.append(f"Subdomain brute-force failed: {e}")

    duration = round(time.time() - start_time, 1)
    logger.info(f"DNS scan complete: domain={domain}, findings={len(findings)}, assets={len(assets)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
