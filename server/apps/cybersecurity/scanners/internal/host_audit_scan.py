"""
Host Audit Scanner — Internal Privilege Escalation & Configuration Audit via SSH

Connects to a target via SSH and runs read-only audit commands to detect
privilege escalation vectors, weak file permissions, exposed credentials,
and insecure configurations.

This is an INTERNAL scanner — requires SSH credentials (Credential entity).
Goes in scanners/internal/ because it needs authenticated access.

Why asyncssh not paramiko: asyncssh is native async — no asyncio.to_thread
needed. Already installed for password_audit_scan.

Why read-only commands: We audit, not modify. All commands are non-destructive
(find, ls, cat, grep, uname). No writes, no deletes, no chmod.

References:
- privesc_scanner.py (Lesson 4 — exact commands for Linux/macOS enumeration)
- BHP Ch2 (SSH with Paramiko — connection pattern, command execution)
- BHP Ch10 (Windows privilege escalation — adapted for Linux/macOS)
- Lesson 10 (macOS security — SIP, TCC, FileVault, LaunchAgents)
- domain-architecture.md §4.2 (host_audit specification)
"""

import asyncio
import hashlib
import logging
import time

import asyncssh

logger = logging.getLogger(__name__)


# ==========================================
# DANGEROUS SUID BINARIES
# ==========================================

# Why these: Each of these binaries can be exploited for privilege escalation
# when they have the SUID bit set. For example, `find` with SUID can execute
# arbitrary commands as root via `-exec`. Source: GTFOBins project.
DANGEROUS_SUID_BINARIES = [
    "vim", "vi", "nano", "find", "python", "python3", "perl", "ruby",
    "nmap", "less", "more", "awk", "bash", "sh", "dash", "env",
    "cp", "mv", "tar", "zip", "gcc", "gdb", "strace", "ltrace",
    "node", "php", "lua", "wish", "tclsh",
]


# ==========================================
# SSH COMMAND EXECUTION
# ==========================================

async def run_ssh_command(conn: asyncssh.SSHClientConnection, command: str, timeout: float = 10.0) -> str:
    """
    Run a single command via SSH and return stdout.

    Why timeout: Some commands (find /) can run indefinitely on large filesystems.
    10 seconds is enough for most audit commands. If it times out, we get partial
    results or empty string — not a failure.

    Args:
        conn: Active SSH connection
        command: Shell command to execute
        timeout: Max seconds to wait for output

    Returns:
        stdout as string, or empty string on failure/timeout
    """
    try:
        result = await asyncio.wait_for(conn.run(command, check=False), timeout=timeout)
        return result.stdout.strip() if result.stdout else ""
    except asyncio.TimeoutError:
        logger.debug(f"SSH command timed out ({timeout}s): {command[:50]}")
        return ""
    except Exception as e:
        logger.debug(f"SSH command failed: {command[:50]} — {e}")
        return ""


# ==========================================
# FINDING BUILDER
# ==========================================

def _fingerprint(category: str, finding_type: str, host: str, detail: str = "") -> str:
    return hashlib.sha256(f"{category}|{finding_type}|{host}|||{detail}".encode()).hexdigest()


def _finding(host, severity, category, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, cwe_id=None):
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
        "url": None,
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": cwe_id,
        "owasp_category": None,
        "mitre_tactic": "Privilege Escalation",
        "mitre_technique": "T1548",  # Abuse Elevation Control Mechanism
        "status": "open",
    }


# ==========================================
# AUDIT CHECKS
# ==========================================

async def check_suid_binaries(conn, host: str) -> list[dict]:
    """
    Find SUID binaries and flag dangerous ones.

    Why dangerous: A SUID binary runs as its owner (usually root) regardless
    of who executes it. If vim has SUID, any user can open a root shell via
    `:!bash`. Source: GTFOBins, privesc_scanner.py.
    """
    findings = []

    output = await run_ssh_command(conn, "find / -perm -4000 -type f 2>/dev/null", timeout=15)
    if not output:
        return findings

    binaries = output.strip().split("\n")
    dangerous_found = []

    for binary_path in binaries:
        binary_name = binary_path.split("/")[-1].lower()
        for dangerous in DANGEROUS_SUID_BINARIES:
            if dangerous == binary_name:
                dangerous_found.append(binary_path)

    if dangerous_found:
        findings.append(_finding(
            host, "high", "privilege_escalation", "suid_dangerous_binary",
            f"Dangerous SUID binaries found ({len(dangerous_found)})",
            f"The following SUID binaries can be exploited for privilege escalation: {', '.join(dangerous_found[:5])}. These binaries allow shell escape or arbitrary command execution as root.",
            "Remove SUID bit from unnecessary binaries: chmod u-s /path/to/binary",
            f"chmod u-s {dangerous_found[0]}",
            "\n".join(dangerous_found),
            "CWE-269",
        ))

    return findings


async def check_writable_dirs(conn, host: str) -> list[dict]:
    """
    Check for writable system directories.

    Why dangerous: Writable /etc, /usr/bin, or /sbin means any user can replace
    system binaries or config files — instant privilege escalation.
    """
    findings = []

    output = await run_ssh_command(conn, "find /etc /usr /bin /sbin -writable -type d 2>/dev/null", timeout=10)
    if not output:
        return findings

    writable_dirs = [d for d in output.strip().split("\n") if d]
    if writable_dirs:
        findings.append(_finding(
            host, "high", "weak_file_permissions", "writable_system_dir",
            f"Writable system directories found ({len(writable_dirs)})",
            f"System directories with world-writable permissions: {', '.join(writable_dirs[:5])}. Any user can modify system files.",
            "Fix permissions on system directories.",
            f"chmod 755 {writable_dirs[0]}",
            "\n".join(writable_dirs[:10]),
            "CWE-276",
        ))

    return findings


async def check_shadow_readable(conn, host: str) -> list[dict]:
    """
    Check if /etc/shadow is readable by current user.

    Why critical: /etc/shadow contains password hashes. If readable, any user
    can extract and crack all system passwords offline.
    """
    findings = []

    output = await run_ssh_command(conn, "cat /etc/shadow 2>/dev/null | head -3")
    if output and ":" in output:
        findings.append(_finding(
            host, "critical", "weak_file_permissions", "shadow_readable",
            "/etc/shadow is readable",
            "/etc/shadow file is readable by the current user. Password hashes can be extracted and cracked offline.",
            "Fix permissions: chmod 640 /etc/shadow && chown root:shadow /etc/shadow",
            "chmod 640 /etc/shadow",
            output[:200],
            "CWE-276",
        ))

    return findings


async def check_cron_jobs(conn, host: str) -> list[dict]:
    """
    Check for writable cron job scripts.

    Why dangerous: If a cron job runs a script that's writable by our user,
    we can replace the script content and it will execute as root next time cron runs.
    """
    findings = []

    # Check system crontab
    crontab = await run_ssh_command(conn, "cat /etc/crontab 2>/dev/null")
    if crontab and "no crontab" not in crontab.lower():
        # Extract script paths from crontab and check if writable
        for line in crontab.split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and "/" in line:
                # Try to find script path in the line
                parts = line.split()
                for part in parts:
                    if part.startswith("/"):
                        writable = await run_ssh_command(conn, f"test -w {part} && echo WRITABLE", timeout=3)
                        if "WRITABLE" in writable:
                            findings.append(_finding(
                                host, "high", "privilege_escalation", "writable_cron",
                                f"Writable cron job script: {part}",
                                f"Cron job script {part} is writable by current user. An attacker can replace the script to execute commands as root.",
                                f"Fix permissions on {part} to prevent unauthorized modification.",
                                f"chmod 755 {part} && chown root:root {part}",
                                f"Crontab line: {line}",
                                "CWE-732",
                            ))
                            break

    return findings


async def check_env_secrets(conn, host: str) -> list[dict]:
    """
    Check for sensitive values in environment variables.

    Why: Developers sometimes set passwords, API keys, and tokens as env vars.
    These are visible to any process running as the same user.
    Source: privesc_scanner.py scan_general().
    """
    findings = []

    output = await run_ssh_command(conn, "env 2>/dev/null")
    if not output:
        return findings

    sensitive_keywords = ["password", "secret", "key", "token", "api_key", "db_pass", "private"]
    sensitive_vars = []

    for line in output.split("\n"):
        for keyword in sensitive_keywords:
            if keyword in line.lower() and "=" in line:
                sensitive_vars.append(line.split("=")[0])  # Only log var name, not value
                break

    if sensitive_vars:
        findings.append(_finding(
            host, "medium", "exposed_credentials", "sensitive_env_vars",
            f"Sensitive environment variables found ({len(sensitive_vars)})",
            f"Environment variables with potentially sensitive names: {', '.join(sensitive_vars[:5])}. May contain passwords or API keys.",
            "Move secrets to a secure vault (HashiCorp Vault, AWS Secrets Manager) instead of environment variables.",
            None,
            f"Variables: {', '.join(sensitive_vars[:10])}",
            "CWE-798",
        ))

    return findings


async def check_history_creds(conn, host: str) -> list[dict]:
    """
    Check for credentials in shell history files.

    Why: Users often type passwords in commands (mysql -p'password', curl with tokens).
    Shell history persists these in plaintext.
    """
    findings = []

    # Check multiple history files
    for hist_file in [".bash_history", ".zsh_history", ".sh_history"]:
        output = await run_ssh_command(
            conn,
            f"grep -i 'password\\|secret\\|token\\|api.key' ~/{hist_file} 2>/dev/null | head -5",
            timeout=5
        )
        if output and len(output) > 5:
            findings.append(_finding(
                host, "high", "exposed_credentials", "creds_in_history",
                f"Potential credentials in {hist_file}",
                f"Shell history file ~/{hist_file} contains lines matching password/secret/token patterns. Commands with credentials are stored in plaintext.",
                f"Clear history: > ~/{hist_file}. Configure HISTIGNORE to exclude sensitive commands.",
                f"HISTIGNORE='*password*:*secret*:*token*'",
                f"Found {len(output.split(chr(10)))} matching lines in {hist_file}",
                "CWE-200",
            ))
            break  # One finding is enough

    return findings


async def check_ssh_keys(conn, host: str) -> list[dict]:
    """
    Check for accessible SSH keys in other users' home directories.

    Why: If we can read another user's private SSH key, we can authenticate
    as that user to any system that trusts their key.
    """
    findings = []

    output = await run_ssh_command(conn, "find /home -name 'id_rsa' -o -name 'id_ed25519' -o -name 'id_ecdsa' 2>/dev/null", timeout=10)
    if output:
        key_files = [f for f in output.strip().split("\n") if f]
        if key_files:
            findings.append(_finding(
                host, "high", "exposed_credentials", "ssh_keys_exposed",
                f"SSH private keys found ({len(key_files)})",
                f"SSH private keys accessible: {', '.join(key_files[:3])}. These can be used to authenticate as the key owner.",
                "Restrict SSH key permissions: chmod 600 on private keys, chmod 700 on .ssh directories.",
                "chmod 600 /home/*/.ssh/id_* && chmod 700 /home/*/.ssh/",
                "\n".join(key_files[:5]),
                "CWE-522",
            ))

    return findings


async def check_os_specific(conn, host: str) -> list[dict]:
    """
    OS-specific checks — detect Linux vs macOS and run appropriate audits.

    Why: macOS has unique security features (SIP, TCC, FileVault) that Linux
    doesn't have. Linux has features macOS doesn't (capabilities, SELinux).
    """
    findings = []

    uname = await run_ssh_command(conn, "uname -s")

    if "darwin" in uname.lower():
        # macOS: Check SIP status
        sip = await run_ssh_command(conn, "csrutil status 2>/dev/null")
        if sip and "disabled" in sip.lower():
            findings.append(_finding(
                host, "high", "insecure_service_config", "sip_disabled",
                "System Integrity Protection (SIP) is disabled",
                "macOS SIP is disabled. This removes kernel-level protections against rootkits and system file modification.",
                "Enable SIP: boot into Recovery Mode → Terminal → csrutil enable",
                "csrutil enable",
                sip,
                "CWE-693",
            ))

    return findings


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute host audit scan via SSH.

    Connects to target via SSH, runs read-only audit commands, and generates
    findings for privilege escalation vectors and misconfigurations.

    Args:
        target: IP or hostname (also available as params["ssh_host"])
        params: Scanner parameters including SSH credentials:
            - ssh_host: SSH host (defaults to target)
            - ssh_port: SSH port (default 22)
            - ssh_username: SSH username
            - ssh_password: SSH password (decrypted by dispatcher)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    # SSH connection parameters
    ssh_host = params.get("ssh_host", target)
    ssh_port = params.get("ssh_port", 22)
    ssh_username = params.get("ssh_username")
    ssh_password = params.get("ssh_password")

    if not ssh_username or not ssh_password:
        errors.append("Host audit requires SSH credentials (ssh_username + ssh_password in params)")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    logger.info(f"Host audit starting: {ssh_username}@{ssh_host}:{ssh_port}")

    try:
        # Connect via SSH
        # Why known_hosts=None: We're scanning, not establishing trust
        # Why connect_timeout: Prevents hanging on filtered/slow hosts
        async with asyncssh.connect(
            ssh_host,
            port=ssh_port,
            username=ssh_username,
            password=ssh_password,
            known_hosts=None,
            connect_timeout=10,
            login_timeout=10,
        ) as conn:

            logger.info(f"SSH connected to {ssh_host}:{ssh_port}")

            # System info — detect OS and record as asset
            uname = await run_ssh_command(conn, "uname -a")
            if uname:
                assets.append({
                    "asset_type": "host",
                    "value": ssh_host,
                    "host": ssh_host,
                    "port": ssh_port,
                    "protocol": "tcp",
                    "service_name": "ssh",
                    "service_version": None,
                    "banner": uname[:200],
                    "service_metadata": None,
                    "confidence": "confirmed",
                })

            # Check if running as root
            user_id = await run_ssh_command(conn, "id")
            if user_id and "uid=0" in user_id:
                findings.append(_finding(
                    ssh_host, "info", "privilege_escalation", "running_as_root",
                    "SSH session is running as root",
                    "The SSH user has root (UID 0) privileges. While functional, running services as root increases the blast radius of any compromise.",
                    "Use a non-root user with sudo for specific commands instead of full root access.",
                    None,
                    user_id,
                ))

            # Run all audit checks
            # Why sequential not parallel: SSH multiplexing can handle concurrent commands,
            # but sequential is simpler, more reliable, and avoids overwhelming the target.
            findings.extend(await check_suid_binaries(conn, ssh_host))
            findings.extend(await check_writable_dirs(conn, ssh_host))
            findings.extend(await check_shadow_readable(conn, ssh_host))
            findings.extend(await check_cron_jobs(conn, ssh_host))
            findings.extend(await check_env_secrets(conn, ssh_host))
            findings.extend(await check_history_creds(conn, ssh_host))
            findings.extend(await check_ssh_keys(conn, ssh_host))
            findings.extend(await check_os_specific(conn, ssh_host))

    except asyncssh.PermissionDenied:
        errors.append(f"SSH authentication failed: {ssh_username}@{ssh_host}:{ssh_port}")
    except asyncssh.DisconnectError as e:
        errors.append(f"SSH disconnected: {e}")
    except (OSError, asyncio.TimeoutError) as e:
        errors.append(f"SSH connection failed: {e}")
    except Exception as e:
        errors.append(f"Host audit error: {e}")

    duration = round(time.time() - start_time, 1)
    logger.info(f"Host audit complete: {ssh_host}, findings={len(findings)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
