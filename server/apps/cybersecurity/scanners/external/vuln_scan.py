"""
Vulnerability Scanner — CVE Matching Against Detected Service Versions

Takes a target, performs a lightweight port scan (reusing port_scan functions),
then matches detected service versions against a local vulnerability database.

Why independent from port_scan: Scanners are stateless, decoupled functions.
vuln_scan does its own mini-scan instead of reading port_scan results from DB.
This ensures it can run independently and be extended to work with SBOMs or
package lists in the future.

Why reuse port_scan functions: We import scan_port, grab_banner, identify_service
from port_scan.py and service_signatures.py — no duplicated I/O code.
Only the analysis logic (CVE matching) is new.

References:
- network_scanner.py check_vulnerabilities() (lesson 05 — CVE matching pattern)
- BHR Ch6 (CWE vs CVE, vulnerability taxonomy)
- common_vulnerabilities.md (OWASP Top 10, CVSS scoring)
- domain-architecture.md §4.2 (vuln_scan specification)
"""

import asyncio
import hashlib
import logging
import socket
import time

from .port_scan import scan_port, grab_banner, parse_port_range, SPEED_SETTINGS
from .service_signatures import identify_service
from .vuln_database import KNOWN_VULNS, DEPRECATED_PROTOCOLS

logger = logging.getLogger(__name__)

# Why TOP_100 not full: vuln_scan only needs open ports with services.
# Scanning all 65535 ports for CVE matching is wasteful — most are closed.
DEFAULT_PORTS = "top_100"


# ==========================================
# CVE MATCHING
# ==========================================

def match_vulnerabilities(service_name: str, service_version: str, banner: str = "") -> list[dict]:
    """
    Match a detected service+version against the local vulnerability database.

    Why substring match: Banners report versions inconsistently.
    "OpenSSH_7.2p1", "OpenSSH 7.2", "7.2p2" all match version_match="7.2".

    Why include banner: port_scan returns service_name="ssh" but the raw banner
    contains "OpenSSH_6.6.1p1". The vuln DB keys are "openssh", "apache", "nginx".
    Without the banner, "openssh" never matches "ssh".

    Args:
        service_name: Service name (e.g., "ssh", "http", "ftp")
        service_version: Version string extracted from banner
        banner: Raw banner text from the service

    Returns:
        List of matching vulnerability entries from KNOWN_VULNS
    """
    if not service_version:
        return []

    matches = []
    version_lower = service_version.lower()

    # Why combine all three: port_scan returns service_name="ssh", version="6.6.1p1",
    # but banner="SSH-2.0-OpenSSH_6.6.1p1". Vuln DB key "openssh" only matches in the banner.
    combined = f"{service_name} {service_version} {banner}".lower()

    for db_service, vulns in KNOWN_VULNS.items():
        if db_service in combined:
            for vuln in vulns:
                if vuln["version_match"].lower() in version_lower:
                    matches.append(vuln)

    return matches


# ==========================================
# FINDING BUILDERS
# ==========================================

def build_vuln_finding(host: str, port: int, service_name: str, service_version: str, vuln: dict) -> dict:
    """Build a finding dict for a matched CVE."""
    cve_str = f" ({vuln['cve_id']})" if vuln["cve_id"] else ""
    fp_input = f"known_vulnerability|{vuln.get('cve_id', vuln['title'])}|{host}|{port}|tcp|"

    return {
        "fingerprint": hashlib.sha256(fp_input.encode()).hexdigest(),
        "is_new": True,
        "severity": vuln["severity"],
        "category": "known_vulnerability",
        "finding_type": "cve_match",
        "title": f"{vuln['title']}{cve_str} on {host}:{port}",
        "description": vuln["description"],
        "remediation": f"Update {service_name} to the latest version. Current: {service_version}.",
        "remediation_script": None,
        "evidence": f"Service: {service_name}/{service_version} on port {port}/tcp",
        "host": host,
        "port": port,
        "protocol": "tcp",
        "url": None,
        "cve_id": vuln.get("cve_id"),
        "cvss_score": vuln.get("cvss_score"),
        "cwe_id": vuln.get("cwe_id"),
        "owasp_category": "A06:2021-Vulnerable and Outdated Components",
        "mitre_tactic": "Initial Access",
        "mitre_technique": "T1190",  # Exploit Public-Facing Application
        "status": "open",
    }


def build_deprecated_finding(host: str, port: int, protocol_info: dict) -> dict:
    """Build a finding dict for a deprecated/insecure protocol."""
    fp_input = f"outdated_service|{protocol_info['service']}_deprecated|{host}|{port}|tcp|"

    return {
        "fingerprint": hashlib.sha256(fp_input.encode()).hexdigest(),
        "is_new": True,
        "severity": protocol_info["severity"],
        "category": "outdated_service",
        "finding_type": f"{protocol_info['service']}_deprecated",
        "title": protocol_info["title"],
        "description": protocol_info["description"],
        "remediation": protocol_info["remediation"],
        "remediation_script": protocol_info.get("remediation_script"),
        "evidence": f"Port {port}/tcp is open — {protocol_info['service']} service detected",
        "host": host,
        "port": port,
        "protocol": "tcp",
        "url": None,
        "cve_id": protocol_info.get("cve_id"),
        "cvss_score": protocol_info.get("cvss_score"),
        "cwe_id": protocol_info.get("cwe_id"),
        "owasp_category": "A06:2021-Vulnerable and Outdated Components",
        "mitre_tactic": "Initial Access",
        "mitre_technique": "T1190",
        "status": "open",
    }


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute vulnerability scan against target.

    Performs a lightweight port scan, then matches detected services against
    the local CVE database.

    Args:
        target: IP or domain to scan
        params: Scanner parameters from ScanTemplate:
            - port_range: "top_100" (default for vuln scan — only needs service ports)
            - scan_speed: "normal"
            - max_concurrent: 50

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    # Parse parameters
    port_range = params.get("port_range", DEFAULT_PORTS)
    scan_speed = params.get("scan_speed", "normal")
    speed = SPEED_SETTINGS.get(scan_speed, SPEED_SETTINGS["normal"])
    timeout = speed["timeout"]
    max_concurrent = params.get("max_concurrent", speed["concurrent"])

    # Parse ports
    try:
        ports = parse_port_range(port_range)
    except Exception as e:
        errors.append(f"Invalid port_range: {e}")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    # Resolve hostname
    try:
        host_ip = socket.gethostbyname(target)
    except socket.gaierror as e:
        errors.append(f"DNS resolution failed for '{target}': {e}")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    logger.info(f"Vuln scan starting: target={target} ({host_ip}), ports={len(ports)}")

    # 1. Lightweight port scan — find open ports
    # Why reuse port_scan.scan_port: Same TCP connect logic, no code duplication
    semaphore = asyncio.Semaphore(max_concurrent)
    open_ports = []

    async def scan_with_semaphore(port):
        async with semaphore:
            is_open = await scan_port(host_ip, port, timeout)
            return (port, is_open)

    tasks = [scan_with_semaphore(p) for p in ports]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            continue
        port, is_open = result
        if is_open:
            open_ports.append(port)

    logger.info(f"Vuln scan port phase: {len(open_ports)} open ports found")

    # 2. Banner grab + service identification + CVE matching
    for port in sorted(open_ports):
        # Reuse port_scan's banner grabbing and service identification
        banner = await grab_banner(host_ip, port, timeout=2.0)
        service_info = identify_service(port, banner)
        service_name = service_info["service_name"]
        service_version = service_info["service_version"]

        # Check for deprecated protocols (port-based)
        for proto in DEPRECATED_PROTOCOLS:
            if port == proto["port"]:
                findings.append(build_deprecated_finding(host_ip, port, proto))
                break

        # CVE matching (version-based)
        # Why after deprecated check: a port can be both deprecated AND have CVEs
        # Why pass banner: service_name="ssh" but banner contains "OpenSSH" which matches vuln DB key
        if service_version:
            matched_vulns = match_vulnerabilities(service_name, service_version, banner)
            for vuln in matched_vulns:
                findings.append(build_vuln_finding(host_ip, port, service_name, service_version, vuln))

    duration = round(time.time() - start_time, 1)
    logger.info(f"Vuln scan complete: target={target}, findings={len(findings)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,  # Vuln scan doesn't discover new assets — port_scan does that
        "errors": errors,
        "duration_seconds": duration,
    }
