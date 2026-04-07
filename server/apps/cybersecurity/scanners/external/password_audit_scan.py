"""
Password Audit Scanner — Default Credential Detection for SSH and FTP

Tests detected services for default/common credentials. NOT a brute-force tool —
uses a short list of 11 common default pairs. If any of these work, it's a critical finding.

Why only 11 pairs: This is default credential detection, not password cracking.
The goal is to find the obvious misconfigurations (admin/admin, root/root, anonymous FTP).
Brute-force with large wordlists requires separate authorization and is a different scanner class.

Why SSH + FTP only: These are the most common services with default credentials that are
directly exploitable from the internet. HTTP basic auth is tested by active_web_scan.

References:
- Lesson 1 Step 12 (hydra default credential testing — admin/password combos)
- Lesson 6 (password attacks methodology — hash cracking, brute force, wordlists)
- hash_cracker.py (password pattern analysis)
- domain-architecture.md §4.2 (password_audit specification)

Safety:
- Target ownership must be verified via ScanTarget.is_verified (legal requirement)
- Scanner tests ONLY default credentials, not dictionary/brute-force attacks
- Stops after FIRST successful login per service (doesn't enumerate further)
"""

import asyncio
import hashlib
import logging
import socket
import time

import asyncssh

from .port_scan import scan_port

logger = logging.getLogger(__name__)


# ==========================================
# DEFAULT CREDENTIALS
# ==========================================

# Why this list: Most commonly found default credentials across IoT devices,
# servers, and network equipment. Source: Lesson 1 Step 12 (hydra testing),
# OWASP default credentials project, real-world penetration testing experience.
DEFAULT_CREDS = [
    ("admin", "admin"),
    ("admin", "password"),
    ("admin", "123456"),
    ("root", "root"),
    ("root", "toor"),
    ("root", "password"),
    ("test", "test"),
    ("user", "user"),
    ("guest", "guest"),
    ("admin", ""),       # Empty password — shockingly common on IoT devices
    ("root", ""),        # Empty password
]


# ==========================================
# SSH CREDENTIAL TESTING
# ==========================================

async def test_ssh_login(host: str, port: int, username: str, password: str, timeout: float = 5.0) -> bool:
    """
    Attempt SSH login with given credentials.

    Why asyncssh: Native async SSH library — no thread pool needed.
    Why known_hosts=None: We're scanning, not establishing trust. Host key
    verification would block all connections to new hosts.
    Why connect_timeout: Prevents hanging on filtered ports or slow responses.

    Returns True if login succeeded, False otherwise.
    """
    try:
        async with asyncssh.connect(
            host,
            port=port,
            username=username,
            password=password,
            known_hosts=None,           # Don't verify host keys (scanning, not connecting)
            connect_timeout=timeout,
            login_timeout=timeout,
        ):
            return True
    except asyncssh.PermissionDenied:
        # Expected — credentials are wrong. Not an error.
        return False
    except (asyncssh.DisconnectError, OSError, asyncio.TimeoutError, ConnectionRefusedError):
        # Connection failed — service unavailable or filtered
        return False
    except Exception as e:
        logger.debug(f"SSH login test {username}@{host}:{port}: {e}")
        return False


async def check_ssh_defaults(host: str, port: int = 22) -> list[dict]:
    """
    Test SSH service for default credentials.

    Why stop after first match: One working default credential is enough to
    prove the vulnerability. Testing all remaining pairs is unnecessary
    and could trigger account lockout.
    """
    findings = []

    for username, password in DEFAULT_CREDS:
        success = await test_ssh_login(host, port, username, password)

        if success:
            pwd_display = f"'{password}'" if password else "(empty)"
            findings.append({
                "fingerprint": hashlib.sha256(f"weak_password|ssh_default_creds|{host}|{port}|tcp|{username}".encode()).hexdigest(),
                "is_new": True,
                "severity": "critical",
                "category": "weak_password",
                "finding_type": "ssh_default_creds",
                "title": f"SSH default credentials: {username}:{pwd_display} on {host}:{port}",
                "description": f"SSH login succeeded with default credentials ({username}:{pwd_display}). Attackers can gain full shell access to this server.",
                "remediation": f"Change the password for user '{username}' immediately. Disable password authentication and use SSH keys instead.",
                "remediation_script": f"passwd {username}  # Change password\n# Then in /etc/ssh/sshd_config:\nPasswordAuthentication no",
                "evidence": f"SSH login successful with {username}:{pwd_display} on port {port}",
                "host": host,
                "port": port,
                "protocol": "tcp",
                "url": None,
                "cve_id": None,
                "cvss_score": 9.8,  # Default creds = network-accessible, no auth needed, full impact
                "cwe_id": "CWE-798",  # Use of Hard-coded Credentials
                "owasp_category": "A07:2021-Identification and Authentication Failures",
                "mitre_tactic": "Initial Access",
                "mitre_technique": "T1078",  # Valid Accounts
                "status": "open",
            })
            # Stop after first successful login — one is enough to prove the vuln
            break

    return findings


# ==========================================
# FTP CREDENTIAL TESTING
# ==========================================

async def check_ftp_anonymous(host: str, port: int = 21, timeout: float = 5.0) -> list[dict]:
    """
    Test if FTP server allows anonymous login.

    Why raw socket instead of ftplib: asyncio-native, no blocking calls.
    FTP protocol is simple enough for raw socket: USER → 331 → PASS → 230 = success.

    Why anonymous FTP is a finding: Anonymous access allows anyone to read (and
    sometimes write) files on the server without authentication.
    """
    findings = []

    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=timeout
        )

        # Read banner
        banner = await asyncio.wait_for(reader.readline(), timeout=timeout)

        # Try anonymous login
        writer.write(b"USER anonymous\r\n")
        await writer.drain()
        resp = await asyncio.wait_for(reader.readline(), timeout=timeout)

        if b"331" in resp or b"230" in resp:
            # 331 = password required (send any email-like password for anonymous)
            # 230 = already logged in
            if b"331" in resp:
                writer.write(b"PASS anonymous@example.com\r\n")
                await writer.drain()
                resp = await asyncio.wait_for(reader.readline(), timeout=timeout)

            if b"230" in resp:
                findings.append({
                    "fingerprint": hashlib.sha256(f"weak_password|ftp_anonymous_access|{host}|{port}|tcp|".encode()).hexdigest(),
                    "is_new": True,
                    "severity": "medium",
                    "category": "weak_password",
                    "finding_type": "ftp_anonymous_access",
                    "title": f"FTP anonymous access enabled on {host}:{port}",
                    "description": "FTP server allows anonymous login. Anyone can read (and possibly write) files without authentication.",
                    "remediation": "Disable anonymous FTP access unless explicitly required. Restrict anonymous access to read-only if needed.",
                    "remediation_script": "# vsftpd: anonymous_enable=NO in /etc/vsftpd.conf",
                    "evidence": f"FTP anonymous login successful. Banner: {banner.decode('utf-8', errors='ignore').strip()[:200]}",
                    "host": host,
                    "port": port,
                    "protocol": "tcp",
                    "url": None,
                    "cve_id": None,
                    "cvss_score": 5.3,
                    "cwe_id": "CWE-284",  # Improper Access Control
                    "owasp_category": "A01:2021-Broken Access Control",
                    "mitre_tactic": "Initial Access",
                    "mitre_technique": "T1078",
                    "status": "open",
                })

        writer.close()
        await writer.wait_closed()

    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        pass  # FTP not available — not an error
    except Exception as e:
        logger.debug(f"FTP anonymous check {host}:{port}: {e}")

    return findings


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute password audit scan against target.

    Tests SSH and FTP services for default/common credentials.
    This is NOT brute-force — only tests 11 common default pairs.

    Args:
        target: IP or domain to scan
        params: Scanner parameters from ScanTemplate

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    # Resolve hostname
    try:
        host_ip = socket.gethostbyname(target)
    except socket.gaierror as e:
        errors.append(f"DNS resolution failed for '{target}': {e}")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    logger.info(f"Password audit starting: target={target} ({host_ip})")

    # 1. Check if SSH is open (port 22)
    ssh_open = await scan_port(host_ip, 22, timeout=3.0)
    if ssh_open:
        logger.info(f"SSH port 22 open on {host_ip} — testing default credentials")
        try:
            ssh_findings = await check_ssh_defaults(host_ip, port=22)
            findings.extend(ssh_findings)
        except Exception as e:
            errors.append(f"SSH credential check failed: {e}")

    # 2. Check if FTP is open (port 21)
    ftp_open = await scan_port(host_ip, 21, timeout=3.0)
    if ftp_open:
        logger.info(f"FTP port 21 open on {host_ip} — testing anonymous access")
        try:
            ftp_findings = await check_ftp_anonymous(host_ip, port=21)
            findings.extend(ftp_findings)
        except Exception as e:
            errors.append(f"FTP anonymous check failed: {e}")

    # 3. Check common alternate SSH ports
    for alt_port in [2222, 22222]:
        alt_open = await scan_port(host_ip, alt_port, timeout=2.0)
        if alt_open:
            logger.info(f"SSH alt port {alt_port} open on {host_ip} — testing default credentials")
            try:
                alt_findings = await check_ssh_defaults(host_ip, port=alt_port)
                findings.extend(alt_findings)
            except Exception as e:
                errors.append(f"SSH credential check on port {alt_port} failed: {e}")

    duration = round(time.time() - start_time, 1)
    logger.info(f"Password audit complete: target={target}, findings={len(findings)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
