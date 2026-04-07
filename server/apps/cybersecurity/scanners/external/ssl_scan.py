"""
SSL/TLS Scanner — Certificate Validation + Cipher Analysis + Protocol Detection

Checks SSL certificates, TLS versions, cipher strength, and HSTS header.

References:
- BHR Ch11 (cryptography, TLS, cipher suites)
- infosec-research/notes/basics/cryptography_basics.md
- domain-architecture.md §4.2 (ssl_scan specification)
"""

import asyncio
import hashlib
import json
import logging
import socket
import ssl
import time
from datetime import datetime, timezone

import httpx
from cryptography import x509
from cryptography.hazmat.primitives import hashes

logger = logging.getLogger(__name__)


# ==========================================
# WEAK CIPHER PATTERNS
# ==========================================

WEAK_CIPHERS = {
    "RC4", "DES", "3DES", "NULL", "EXPORT", "anon", "MD5",
}


# ==========================================
# CERTIFICATE EXTRACTION
# ==========================================

def _get_cert_info(host: str, port: int = 443, timeout: float = 5.0) -> dict:
    """
    Connect to host:port via TLS, extract certificate and connection details.
    Synchronous — called via asyncio.to_thread().

    Returns dict with: cert (x509), cipher, version, cert_pem, error
    """
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # Inspect even invalid certs

        with socket.create_connection((host, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert_der = ssock.getpeercert(binary_form=True)
                cert_pem = ssock.getpeercert()
                cipher = ssock.cipher()  # (name, protocol, bits)
                version = ssock.version()  # "TLSv1.2", "TLSv1.3"

        cert = x509.load_der_x509_certificate(cert_der)
        return {
            "cert": cert,
            "cert_pem": cert_pem,
            "cipher": cipher,
            "version": version,
            "error": None,
        }
    except Exception as e:
        return {"cert": None, "cert_pem": None, "cipher": None, "version": None, "error": str(e)}


# ==========================================
# PROTOCOL VERSION TESTING
# ==========================================

def _test_tls_version(host: str, port: int, min_ver, max_ver, timeout: float = 3.0) -> bool:
    """Test if a specific TLS version is accepted by the server."""
    try:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.minimum_version = min_ver
        ctx.maximum_version = max_ver

        with socket.create_connection((host, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                return True
    except Exception:
        return False


# ==========================================
# HSTS CHECK
# ==========================================

async def _check_hsts(host: str) -> str | None:
    """Check if Strict-Transport-Security header is present."""
    try:
        async with httpx.AsyncClient(timeout=5, verify=False, follow_redirects=True) as client:
            resp = await client.get(f"https://{host}")
            return resp.headers.get("strict-transport-security")
    except Exception:
        return None


# ==========================================
# FINDING BUILDERS
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str) -> str:
    return hashlib.sha256(f"{category}|{finding_type}|{host}|||".encode()).hexdigest()


def _finding(host, severity, category, finding_type, title, description, remediation, remediation_script=None, evidence=None, cwe_id=None):
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
        "port": 443,
        "protocol": "tcp",
        "url": None,
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": cwe_id,
        "owasp_category": "A02:2021-Cryptographic Failures",
        "mitre_tactic": "Reconnaissance",
        "mitre_technique": "T1596.003",
        "status": "open",
    }


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute SSL/TLS scan against target.

    Args:
        target: Domain or IP to scan
        params: Scanner parameters (port can be overridden via params)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    host = target.lower().strip()
    port = 443

    logger.info(f"SSL scan starting: host={host}:{port}")

    # 1. Get certificate and connection info
    info = await asyncio.to_thread(_get_cert_info, host, port)

    if info["error"]:
        errors.append(f"SSL connection failed: {info['error']}")
        duration = round(time.time() - start_time, 1)
        return {"findings": findings, "assets": assets, "errors": errors, "duration_seconds": duration}

    cert = info["cert"]
    cipher = info["cipher"]
    version = info["version"]

    # Extract certificate fields
    subject = cert.subject.rfc4514_string()
    issuer = cert.issuer.rfc4514_string()
    not_before = cert.not_valid_before_utc
    not_after = cert.not_valid_after_utc
    serial = str(cert.serial_number)
    now = datetime.now(timezone.utc)

    # Try to get CN from subject
    try:
        cn = cert.subject.get_attributes_for_oid(x509.oid.NameOID.COMMON_NAME)[0].value
    except (IndexError, Exception):
        cn = subject

    cipher_name = cipher[0] if cipher else "unknown"
    cipher_bits = cipher[2] if cipher else 0

    # 2. Certificate asset
    assets.append({
        "asset_type": "certificate",
        "value": f"{cn} (expires {not_after.strftime('%Y-%m-%d')})",
        "host": host,
        "port": port,
        "protocol": "tcp",
        "service_name": "tls",
        "service_version": version,
        "banner": None,
        "service_metadata": json.dumps({
            "issuer": issuer,
            "subject": subject,
            "not_before": not_before.isoformat(),
            "not_after": not_after.isoformat(),
            "serial_number": serial,
            "cipher": cipher_name,
            "cipher_bits": cipher_bits,
        }),
        "confidence": "confirmed",
    })

    # 3. Certificate expiry check
    if now > not_after:
        findings.append(_finding(
            host, "critical", "certificate_issue", "cert_expired",
            f"SSL certificate expired for {host}",
            f"Certificate for {cn} expired on {not_after.strftime('%Y-%m-%d')}. Expired certificates cause browser warnings and break trust.",
            "Renew the SSL certificate immediately.",
            f"certbot certonly --nginx -d {host}",
            f"Expired: {not_after.isoformat()}",
            "CWE-295",
        ))
    else:
        days_left = (not_after - now).days
        if days_left < 30:
            findings.append(_finding(
                host, "high", "certificate_issue", "cert_near_expiry",
                f"SSL certificate expires in {days_left} days for {host}",
                f"Certificate for {cn} expires on {not_after.strftime('%Y-%m-%d')} ({days_left} days). Renew before expiry to avoid downtime.",
                "Renew the SSL certificate before it expires.",
                f"certbot renew",
                f"Expires: {not_after.isoformat()}, days left: {days_left}",
                "CWE-295",
            ))
        elif days_left < 90:
            findings.append(_finding(
                host, "medium", "certificate_issue", "cert_near_expiry",
                f"SSL certificate expires in {days_left} days for {host}",
                f"Certificate for {cn} expires on {not_after.strftime('%Y-%m-%d')} ({days_left} days). Plan renewal.",
                "Set up automatic certificate renewal (e.g., certbot with cron).",
                f"certbot renew --deploy-hook 'systemctl reload nginx'",
                f"Expires: {not_after.isoformat()}, days left: {days_left}",
            ))

    # 4. Self-signed check
    if issuer == subject:
        findings.append(_finding(
            host, "medium", "certificate_issue", "cert_self_signed",
            f"Self-signed certificate detected for {host}",
            f"Certificate for {cn} is self-signed (issuer equals subject). Browsers will show security warnings.",
            "Replace with a certificate from a trusted Certificate Authority (e.g., Let's Encrypt).",
            f"certbot certonly --nginx -d {host}",
            f"Issuer: {issuer}",
            "CWE-295",
        ))

    # 5. Hostname mismatch check
    hostname_match = False
    try:
        # Check SANs
        san_ext = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
        dns_names = san_ext.value.get_values_for_type(x509.DNSName)
        for name in dns_names:
            if name == host or (name.startswith("*.") and host.endswith(name[1:])):
                hostname_match = True
                break
    except x509.ExtensionNotFound:
        # No SAN — check CN
        if cn == host or (cn.startswith("*.") and host.endswith(cn[1:])):
            hostname_match = True

    if not hostname_match:
        findings.append(_finding(
            host, "high", "certificate_issue", "cert_hostname_mismatch",
            f"Certificate hostname mismatch for {host}",
            f"Certificate is issued for {cn} but accessed via {host}. This causes browser warnings.",
            f"Issue a certificate that includes {host} in Subject Alternative Names.",
            None,
            f"Certificate CN: {cn}, accessed as: {host}",
            "CWE-295",
        ))

    # 6. Weak cipher check
    if cipher_name:
        is_weak = any(weak in cipher_name.upper() for weak in WEAK_CIPHERS)
        if is_weak:
            findings.append(_finding(
                host, "medium", "ssl_weakness", "weak_cipher",
                f"Weak cipher negotiated: {cipher_name}",
                f"Server negotiated a weak cipher ({cipher_name}, {cipher_bits} bits). This may allow eavesdropping.",
                "Configure the server to only accept strong ciphers (AES-GCM, ChaCha20).",
                "ssl_ciphers 'ECDHE+AESGCM:ECDHE+CHACHA20:!aNULL:!MD5:!RC4:!3DES';",
                f"Cipher: {cipher_name}, bits: {cipher_bits}",
                "CWE-326",
            ))

    # 7. Old TLS version checks
    for tls_ver, label, severity in [
        (ssl.TLSVersion.TLSv1, "TLS 1.0", "high"),
        (ssl.TLSVersion.TLSv1_1, "TLS 1.1", "medium"),
    ]:
        try:
            enabled = await asyncio.to_thread(_test_tls_version, host, port, tls_ver, tls_ver)
            if enabled:
                findings.append(_finding(
                    host, severity, "protocol_vulnerability", f"tls_{label.replace(' ', '_').replace('.', '_').lower()}_enabled",
                    f"{label} is enabled on {host}",
                    f"Server accepts {label} connections. {label} is deprecated and has known vulnerabilities.",
                    f"Disable {label} in server configuration. Use TLS 1.2+ only.",
                    f"ssl_protocols TLSv1.2 TLSv1.3;",
                    f"{label} connection successful",
                    "CWE-326",
                ))
        except Exception:
            pass

    # 8. HSTS check
    hsts = await _check_hsts(host)
    if not hsts:
        findings.append(_finding(
            host, "medium", "missing_header", "missing_hsts",
            f"Missing HSTS header for {host}",
            f"No Strict-Transport-Security header found. Without HSTS, users can be redirected to HTTP and exposed to MITM attacks.",
            "Add Strict-Transport-Security header with a long max-age.",
            'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
            "No Strict-Transport-Security header in HTTPS response",
            "CWE-319",
        ))

    duration = round(time.time() - start_time, 1)
    logger.info(f"SSL scan complete: host={host}, findings={len(findings)}, assets={len(assets)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
