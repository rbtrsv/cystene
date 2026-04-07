"""
Port Scanner — TCP Connect Scan with Banner Grabbing

First scanner implementation for Cystene. Scans target for open TCP ports,
grabs service banners, identifies services, and produces findings + assets.

References:
- infosec-research/scripts/lesson_01_recon/port_scanner.py (basic TCP connect)
- infosec-research/scripts/lesson_05_network_service/network_scanner.py (banner grabbing, service ID)
- BHR ch_02/tricoder/src/ports.rs (rayon parallel scan)
- BHR ch_03/tricoder/src/ports.rs (async scan with tokio + bounded concurrency)

Concurrency: asyncio.Semaphore (Python equivalent of BHR's bounded channels).
"""

import asyncio
import hashlib
import logging
import socket
import time

from .common_ports import TOP_100_PORTS, TOP_1000_PORTS
from .service_signatures import get_probe_for_port, identify_service

logger = logging.getLogger(__name__)


# ==========================================
# SCAN SPEED → SETTINGS
# ==========================================

SPEED_SETTINGS = {
    "slow":   {"timeout": 5.0, "concurrent": 10},
    "normal": {"timeout": 3.0, "concurrent": 50},
    "fast":   {"timeout": 1.0, "concurrent": 200},
}


# ==========================================
# PORT RANGE PARSING
# ==========================================

def parse_port_range(port_range: str) -> list[int]:
    """
    Parse port_range string from ScanTemplate into a list of port numbers.

    Supports:
    - "top_100" → 100 most common ports
    - "top_1000" → 1000 most common ports
    - "full" → all 65535 ports
    - "1-1024" → range
    - "80,443,8080" → explicit list
    """
    if port_range == "top_100":
        return TOP_100_PORTS
    if port_range == "top_1000":
        return TOP_1000_PORTS
    if port_range == "full":
        return list(range(1, 65536))
    if "-" in port_range and "," not in port_range:
        start, end = port_range.split("-", 1)
        return list(range(int(start.strip()), int(end.strip()) + 1))
    return [int(p.strip()) for p in port_range.split(",")]


# ==========================================
# TCP CONNECT SCAN
# ==========================================

async def scan_port(host: str, port: int, timeout: float) -> bool:
    """
    TCP connect scan for a single port.
    Returns True if port is open (connection established), False otherwise.
    """
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=timeout,
        )
        writer.close()
        await writer.wait_closed()
        return True
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return False


# ==========================================
# BANNER GRABBING
# ==========================================

async def grab_banner(host: str, port: int, timeout: float = 2.0) -> str:
    """
    Connect to an open port, send a protocol-specific probe, read the response.

    Some services send a banner immediately (SSH, FTP). Others need a request (HTTP).
    Returns raw banner text or empty string on failure.
    """
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=timeout,
        )

        # Send probe if service needs it
        probe = get_probe_for_port(port, host)
        if probe:
            writer.write(probe)
            await writer.drain()

        # Read response
        data = await asyncio.wait_for(reader.read(1024), timeout=timeout)

        writer.close()
        await writer.wait_closed()

        return data.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


# ==========================================
# FINDING BUILDER
# ==========================================

def build_finding(host: str, port: int, service_info: dict) -> dict:
    """
    Build a finding dict from an open port + service info.
    Keys match Finding model fields exactly for direct DB insertion.
    """
    service_name = service_info["service_name"]
    service_version = service_info["service_version"]
    banner = service_info["banner"]

    # Display name: "http" → "HTTP", "ssh" → "SSH"
    display_name = service_name.upper() if service_name != "unknown" else "Unknown"
    version_str = f" ({service_version})" if service_version else ""

    title = f"Open port {port}/tcp — {display_name}{version_str}"

    # Fingerprint for deduplication across scans
    # Why: same open port on same host should not create duplicate findings
    fingerprint_input = f"open_port|open_tcp_port|{host}|{port}|tcp|"
    fingerprint = hashlib.sha256(fingerprint_input.encode()).hexdigest()

    return {
        "fingerprint": fingerprint,
        "is_new": True,  # Caller updates this by checking previous scan fingerprints
        "severity": "info",
        "category": "open_port",
        "finding_type": "open_tcp_port",
        "title": title,
        "description": f"TCP port {port} is open on {host}. Service: {display_name}{version_str}.",
        "remediation": f"Review if port {port} ({display_name}) needs to be publicly accessible. Close unnecessary ports.",
        "evidence": banner[:500] if banner else None,
        "host": host,
        "port": port,
        "protocol": "tcp",
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": None,
        "owasp_category": None,
        "mitre_tactic": "Discovery",
        "mitre_technique": "T1046",  # Network Service Discovery
        "status": "open",
    }


def build_asset(host: str, port: int, service_info: dict) -> dict:
    """
    Build an asset dict from a discovered service.
    Keys match Asset model fields exactly for direct DB insertion.
    """
    return {
        "asset_type": "service",
        "value": f"{service_info['service_name']}/{service_info['service_version']}" if service_info["service_version"] else service_info["service_name"],
        "host": host,
        "port": port,
        "protocol": "tcp",
        "service_name": service_info["service_name"],
        "service_version": service_info["service_version"],
        "banner": service_info["banner"][:500] if service_info["banner"] else None,
        "service_metadata": None,
        "confidence": "confirmed",
    }


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute port scan against target.

    Args:
        target: IP address or domain to scan
        params: Scanner parameters from ScanTemplate:
            - port_range: "top_100", "top_1000", "full", "1-1024", "80,443,8080"
            - scan_speed: "slow", "normal", "fast"
            - max_concurrent: int (overrides speed default if provided)
            - timeout_seconds: int (overall scan timeout, not per-port)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    errors = []
    findings = []
    assets = []

    # Parse parameters
    port_range = params.get("port_range", "top_100")
    scan_speed = params.get("scan_speed", "normal")
    speed = SPEED_SETTINGS.get(scan_speed, SPEED_SETTINGS["normal"])
    timeout = speed["timeout"]
    max_concurrent = params.get("max_concurrent", speed["concurrent"])

    # Parse ports
    try:
        ports = parse_port_range(port_range)
    except Exception as e:
        errors.append(f"Invalid port_range '{port_range}': {e}")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    # Resolve hostname to IP
    try:
        host_ip = socket.gethostbyname(target)
    except socket.gaierror as e:
        errors.append(f"DNS resolution failed for '{target}': {e}")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    logger.info(f"Port scan starting: target={target} ({host_ip}), ports={len(ports)}, speed={scan_speed}, concurrent={max_concurrent}")

    # Add host as asset
    assets.append({
        "asset_type": "host",
        "value": host_ip,
        "host": host_ip,
        "port": None,
        "protocol": None,
        "service_name": None,
        "service_version": None,
        "banner": None,
        "service_metadata": None,
        "confidence": "confirmed",
    })

    # Scan ports with bounded concurrency (asyncio.Semaphore — BHR pattern)
    semaphore = asyncio.Semaphore(max_concurrent)
    open_ports = []

    async def scan_with_semaphore(port: int) -> tuple[int, bool]:
        async with semaphore:
            is_open = await scan_port(host_ip, port, timeout)
            return (port, is_open)

    tasks = [scan_with_semaphore(port) for port in ports]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            errors.append(str(result))
            continue
        port, is_open = result
        if is_open:
            open_ports.append(port)

    logger.info(f"Port scan phase complete: {len(open_ports)} open ports found out of {len(ports)} scanned")

    # Banner grab + service identification for open ports
    for port in sorted(open_ports):
        banner = await grab_banner(host_ip, port, timeout=2.0)
        service_info = identify_service(port, banner)

        findings.append(build_finding(host_ip, port, service_info))
        assets.append(build_asset(host_ip, port, service_info))

    duration = round(time.time() - start_time, 1)
    logger.info(f"Port scan complete: target={target}, findings={len(findings)}, assets={len(assets)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
