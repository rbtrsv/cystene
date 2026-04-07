"""
Active Directory Audit Scanner — AD Security Configuration Audit via LDAP

Authenticates to a Domain Controller using domain credentials and audits
Active Directory for security misconfigurations: Kerberoastable accounts,
ASREPRoastable accounts, unconstrained delegation, stale accounts, weak
password policy, orphaned admin accounts, reversible encryption.

This is an INTERNAL scanner — requires domain credentials (Credential entity).
Goes in scanners/internal/ because it needs authenticated access to AD.

Why ldap3: Pure Python LDAP v3 implementation. Well-maintained, supports
SSL/TLS (LDAPS), and works on all platforms. No C dependencies.

Why not impacket: Impacket is for Kerberos ticket attacks (exploitation).
We do detection only — LDAP queries are sufficient to identify Kerberoastable
and ASREPRoastable users by checking their userAccountControl flags and SPN
attributes, without actually requesting or cracking tickets.

Why asyncio.to_thread: ldap3 is synchronous. Wrap all calls in to_thread
to avoid blocking the event loop. Same pattern as cloud_audit_scan (boto3).

Why read-only: All operations are LDAP search queries. No modifications
to Active Directory. Scanner only reads configuration state.

References:
- Lesson 9 (Active Directory Attacks — domain enumeration, Kerberos attacks,
  credential harvesting, lateral movement, persistence)
- BHP Ch10 (Windows privilege escalation — AD concepts in Windows context)
- domain-architecture.md §4.2 (ad_audit specification)
- MITRE ATT&CK: T1558 (Steal or Forge Kerberos Tickets), T1078 (Valid Accounts)
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(finding_type: str, detail: str = "") -> str:
    """
    Deterministic SHA-256 fingerprint for deduplication across scans.
    Same finding on same domain → same fingerprint → no duplicate in DB.
    """
    return hashlib.sha256(f"ad_misconfiguration|{finding_type}|{detail}".encode()).hexdigest()


def _finding(severity, category, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, cwe_id=None,
             mitre_tactic="Discovery", mitre_technique="T1087.002"):
    """
    Build a finding dict matching the schema expected by scan_job_subrouter.

    Default MITRE: T1087.002 (Account Discovery: Domain Account) — most AD
    audit findings are about discovering misconfigured accounts.
    """
    return {
        "fingerprint": _fingerprint(finding_type, title),
        "is_new": True,
        "severity": severity,
        "category": category,
        "finding_type": finding_type,
        "title": title,
        "description": description,
        "remediation": remediation,
        "remediation_script": remediation_script,
        "evidence": evidence[:500] if evidence else None,
        "host": None,
        "port": None,
        "protocol": None,
        "url": None,
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": cwe_id,
        "owasp_category": None,
        "mitre_tactic": mitre_tactic,
        "mitre_technique": mitre_technique,
        "status": "open",
    }


def _build_base_dn(domain: str) -> str:
    """
    Convert domain name to LDAP base DN.

    Example: "corp.example.com" → "DC=corp,DC=example,DC=com"
    """
    return ",".join(f"DC={part}" for part in domain.split("."))


def _filetime_to_datetime(filetime: int) -> datetime:
    """
    Convert Windows FILETIME (100-nanosecond intervals since 1601-01-01)
    to Python datetime.

    Why: AD stores lastLogonTimestamp and pwdLastSet as Windows FILETIME integers.
    The epoch difference between Windows (1601) and Unix (1970) is 11644473600 seconds.
    """
    # Windows FILETIME: 100-nanosecond intervals since 1601-01-01
    # Convert to Unix timestamp: subtract Windows epoch offset, convert to seconds
    WINDOWS_EPOCH_DIFF = 11644473600
    timestamp = (filetime / 10_000_000) - WINDOWS_EPOCH_DIFF
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


# ==========================================
# UAC FLAG CONSTANTS
# ==========================================

# Why these constants: Active Directory stores account properties as a bitmask
# in the userAccountControl attribute. Each flag is a power of 2.
# Source: Microsoft docs — "User-Account-Control attribute"

UAC_ACCOUNTDISABLE = 0x0002              # Account is disabled
UAC_DONT_EXPIRE_PASSWORD = 0x10000       # Password never expires (65536)
UAC_DONT_REQ_PREAUTH = 0x400000         # Do not require Kerberos preauthentication (4194304)
UAC_TRUSTED_FOR_DELEGATION = 0x80000    # Unconstrained delegation (524288)
UAC_ENCRYPTED_TEXT_PWD_ALLOWED = 0x0080  # Store password with reversible encryption (128)


# ==========================================
# CHECK: KERBEROASTABLE ACCOUNTS
# ==========================================

def check_kerberoastable(conn, base_dn: str) -> list[dict]:
    """
    Find user accounts with SPNs set (Kerberoastable).

    Why critical: Any domain user can request a Kerberos service ticket (TGS)
    for accounts with SPNs. The ticket is encrypted with the account's password
    hash — if the password is weak, it can be cracked offline with hashcat.
    This is Kerberoasting (MITRE T1558.003).

    Source: Lesson 9 Step 5 (Kerberoasting), domain-architecture.md §4.2
    """
    findings = []

    # Why this filter: Find users (not computers) with SPN set, excluding krbtgt
    # (krbtgt always has SPN — it's the Kerberos service account, not a vulnerability)
    conn.search(
        base_dn,
        "(&(objectClass=user)(objectCategory=person)(servicePrincipalName=*)(!(cn=krbtgt)))",
        attributes=["sAMAccountName", "servicePrincipalName", "adminCount", "memberOf"],
    )

    kerberoastable = []
    for entry in conn.entries:
        username = str(entry.sAMAccountName)
        spns = entry.servicePrincipalName.values if hasattr(entry.servicePrincipalName, "values") else [str(entry.servicePrincipalName)]
        is_admin = bool(entry.adminCount) if hasattr(entry, "adminCount") and entry.adminCount.value else False
        kerberoastable.append({"user": username, "spns": spns, "is_admin": is_admin})

    if kerberoastable:
        # Separate admin vs non-admin — admin accounts with weak SPNs are critical
        admin_accounts = [a for a in kerberoastable if a["is_admin"]]
        regular_accounts = [a for a in kerberoastable if not a["is_admin"]]

        if admin_accounts:
            usernames = ", ".join(a["user"] for a in admin_accounts[:10])
            findings.append(_finding(
                "critical", "ad_misconfiguration", "kerberoastable_admin",
                f"{len(admin_accounts)} admin account(s) with SPN (Kerberoastable)",
                f"Admin accounts with SPNs can be Kerberoasted — any domain user can request a service ticket and crack the password offline. "
                f"Accounts: {usernames}",
                "Remove unnecessary SPNs from admin accounts. Use Group Managed Service Accounts (gMSA) instead of regular accounts for services.",
                None,
                f"Admin accounts with SPN: {usernames}. SPNs: {', '.join(a['spns'][0] for a in admin_accounts[:5])}",
                "CWE-916",
                "Credential Access", "T1558.003",
            ))

        if regular_accounts:
            usernames = ", ".join(a["user"] for a in regular_accounts[:10])
            findings.append(_finding(
                "high", "ad_misconfiguration", "kerberoastable_user",
                f"{len(regular_accounts)} service account(s) with SPN (Kerberoastable)",
                f"Service accounts with SPNs can be Kerberoasted — any domain user can request a service ticket and crack the password offline. "
                f"Accounts: {usernames}",
                "Use Group Managed Service Accounts (gMSA) with automatic password rotation. If not possible, ensure service accounts have 25+ character passwords.",
                None,
                f"Accounts with SPN: {usernames}",
                "CWE-916",
                "Credential Access", "T1558.003",
            ))

    return findings


# ==========================================
# CHECK: ASREPROASTABLE ACCOUNTS
# ==========================================

def check_asreproastable(conn, base_dn: str) -> list[dict]:
    """
    Find accounts with "Do not require Kerberos preauthentication" flag.

    Why critical: Without preauthentication, anyone can request an AS-REP for
    the account without knowing the password. The response contains a hash that
    can be cracked offline. This is ASREPRoasting (MITRE T1558.004).

    Source: Lesson 9 Step 6 (ASREPRoasting)
    """
    findings = []

    # Why LDAP matching rule 1.2.840.113556.1.4.803: This is a bitwise AND operator
    # for AD. It checks if the UAC_DONT_REQ_PREAUTH bit (4194304) is set.
    conn.search(
        base_dn,
        f"(&(objectClass=user)(objectCategory=person)(userAccountControl:1.2.840.113556.1.4.803:={UAC_DONT_REQ_PREAUTH}))",
        attributes=["sAMAccountName", "adminCount"],
    )

    if conn.entries:
        usernames = ", ".join(str(e.sAMAccountName) for e in conn.entries[:10])
        findings.append(_finding(
            "high", "ad_misconfiguration", "asreproastable",
            f"{len(conn.entries)} account(s) with Kerberos preauthentication disabled (ASREPRoastable)",
            f"Accounts without preauthentication can be attacked by anyone — no domain credentials needed to start the attack. "
            f"Accounts: {usernames}",
            "Enable Kerberos preauthentication on all accounts. Uncheck 'Do not require Kerberos preauthentication' in AD Users & Computers.",
            # PowerShell remediation command
            f"Get-ADUser -Filter {{DoesNotRequirePreAuth -eq $true}} | Set-ADAccountControl -DoesNotRequirePreAuth $false",
            f"ASREPRoastable accounts: {usernames}",
            "CWE-287",
            "Credential Access", "T1558.004",
        ))

    return findings


# ==========================================
# CHECK: UNCONSTRAINED DELEGATION
# ==========================================

def check_unconstrained_delegation(conn, base_dn: str) -> list[dict]:
    """
    Find computers/users trusted for unconstrained delegation.

    Why critical: Unconstrained delegation means the account can impersonate
    ANY user to ANY service. If an attacker compromises a machine with unconstrained
    delegation, they get the TGT of every user that authenticates to it — including
    Domain Admins.

    Source: Lesson 9 Step 4 (Computer Enumeration — unconstrained delegation)
    """
    findings = []

    # Find accounts with TRUSTED_FOR_DELEGATION flag, excluding domain controllers
    # Why exclude DCs: Domain controllers inherently have unconstrained delegation — that's by design.
    conn.search(
        base_dn,
        f"(&(userAccountControl:1.2.840.113556.1.4.803:={UAC_TRUSTED_FOR_DELEGATION})(!(primaryGroupID=516)))",
        attributes=["sAMAccountName", "objectClass", "dNSHostName"],
    )

    if conn.entries:
        accounts = []
        for entry in conn.entries:
            name = str(entry.sAMAccountName)
            hostname = str(entry.dNSHostName) if hasattr(entry, "dNSHostName") and entry.dNSHostName.value else None
            accounts.append(hostname or name)

        account_list = ", ".join(accounts[:10])
        findings.append(_finding(
            "high", "ad_misconfiguration", "unconstrained_delegation",
            f"{len(conn.entries)} non-DC account(s) with unconstrained delegation",
            f"Accounts with unconstrained delegation cache TGTs of all authenticating users. "
            f"If compromised, attacker gets Domain Admin access. Accounts: {account_list}",
            "Replace unconstrained delegation with constrained delegation or resource-based constrained delegation (RBCD).",
            None,
            f"Unconstrained delegation accounts: {account_list}",
            "CWE-269",
            "Credential Access", "T1187",
        ))

    return findings


# ==========================================
# CHECK: CONSTRAINED DELEGATION MISCONFIGURATION
# ==========================================

def check_constrained_delegation(conn, base_dn: str) -> list[dict]:
    """
    Find accounts with constrained delegation to sensitive services.

    Why: Constrained delegation to LDAP or CIFS on a DC is effectively
    unconstrained delegation — the account can perform DCSync or access
    any file share on the DC.

    Source: Lesson 9 (Kerberos Delegation abuse)
    """
    findings = []

    conn.search(
        base_dn,
        "(msDS-AllowedToDelegateTo=*)",
        attributes=["sAMAccountName", "msDS-AllowedToDelegateTo"],
    )

    # Why these services are dangerous: LDAP delegation → DCSync capability,
    # CIFS delegation → file share access on DCs, HTTP delegation → web app impersonation
    dangerous_services = ["ldap", "cifs", "http", "host", "rpcss"]

    for entry in conn.entries:
        username = str(entry.sAMAccountName)
        delegations = entry["msDS-AllowedToDelegateTo"].values if hasattr(entry["msDS-AllowedToDelegateTo"], "values") else [str(entry["msDS-AllowedToDelegateTo"])]

        dangerous_delegations = []
        for delegation in delegations:
            service_type = delegation.split("/")[0].lower() if "/" in delegation else delegation.lower()
            if service_type in dangerous_services:
                dangerous_delegations.append(delegation)

        if dangerous_delegations:
            findings.append(_finding(
                "medium", "ad_misconfiguration", "constrained_delegation_sensitive",
                f"Constrained delegation to sensitive service: {username}",
                f"Account '{username}' has constrained delegation to sensitive services: {', '.join(dangerous_delegations[:5])}. "
                f"Delegation to LDAP/CIFS on a DC is effectively unconstrained — enables DCSync or file share access.",
                f"Review delegation configuration for '{username}'. Use resource-based constrained delegation (RBCD) with minimal scope.",
                None,
                f"Account: {username}, Delegations: {', '.join(dangerous_delegations[:5])}",
                "CWE-269",
                "Credential Access", "T1134.001",
            ))

    return findings


# ==========================================
# CHECK: STALE ACCOUNTS (>90 DAYS)
# ==========================================

def check_stale_accounts(conn, base_dn: str) -> list[dict]:
    """
    Find user accounts that haven't logged in for 90+ days.

    Why: Stale accounts are prime targets for attackers. Nobody monitors them,
    password may be weak or leaked, and they provide persistent access.

    Source: domain-architecture.md §4.2 (ad_audit — stale accounts detection)
    """
    findings = []

    # Why lastLogonTimestamp not lastLogon: lastLogon is per-DC (not replicated).
    # lastLogonTimestamp is replicated (with ~14 day delay) — good enough for 90-day check.
    conn.search(
        base_dn,
        "(&(objectClass=user)(objectCategory=person)(lastLogonTimestamp=*))",
        attributes=["sAMAccountName", "lastLogonTimestamp", "userAccountControl"],
    )

    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    stale_users = []

    for entry in conn.entries:
        uac = int(entry.userAccountControl.value) if entry.userAccountControl.value else 0
        # Skip disabled accounts — they're already flagged in check_disabled_accounts
        if uac & UAC_ACCOUNTDISABLE:
            continue

        last_logon_raw = entry.lastLogonTimestamp.value
        if last_logon_raw:
            try:
                # ldap3 may return as datetime directly or as int (FILETIME)
                if isinstance(last_logon_raw, datetime):
                    last_logon = last_logon_raw
                elif isinstance(last_logon_raw, int):
                    last_logon = _filetime_to_datetime(last_logon_raw)
                else:
                    continue

                if last_logon < cutoff:
                    days_inactive = (datetime.now(timezone.utc) - last_logon).days
                    stale_users.append({"user": str(entry.sAMAccountName), "days": days_inactive})
            except (ValueError, OverflowError):
                continue

    if stale_users:
        # Sort by most inactive first
        stale_users.sort(key=lambda u: u["days"], reverse=True)
        usernames = ", ".join(f"{u['user']} ({u['days']}d)" for u in stale_users[:10])
        findings.append(_finding(
            "medium", "ad_misconfiguration", "stale_accounts",
            f"{len(stale_users)} active account(s) with no login in 90+ days",
            f"Active accounts that haven't logged in for 90+ days are prime targets for attackers. "
            f"They may have weak/leaked passwords and nobody monitors their activity. Accounts: {usernames}",
            "Disable or delete stale accounts. Implement an automated account lifecycle policy.",
            "Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 | Disable-ADAccount",
            f"Stale accounts (most inactive first): {usernames}",
            "CWE-262",
            "Persistence", "T1078.002",
        ))

    return findings


# ==========================================
# CHECK: DISABLED BUT NOT DELETED ACCOUNTS
# ==========================================

def check_disabled_accounts(conn, base_dn: str) -> list[dict]:
    """
    Find disabled accounts still present in AD.

    Why info: Disabled accounts aren't directly exploitable, but they clutter AD
    and may still have group memberships or delegations that could be re-enabled
    by an attacker with sufficient privileges.
    """
    findings = []

    conn.search(
        base_dn,
        f"(&(objectClass=user)(objectCategory=person)(userAccountControl:1.2.840.113556.1.4.803:={UAC_ACCOUNTDISABLE}))",
        attributes=["sAMAccountName"],
    )

    if len(conn.entries) > 10:
        usernames = ", ".join(str(e.sAMAccountName) for e in conn.entries[:10])
        findings.append(_finding(
            "info", "ad_misconfiguration", "disabled_accounts_clutter",
            f"{len(conn.entries)} disabled account(s) still in Active Directory",
            f"Large number of disabled accounts. These clutter AD and may retain group memberships or delegations. "
            f"First 10: {usernames}",
            "Delete disabled accounts that are no longer needed. Remove group memberships from accounts that must be kept.",
            None,
            f"Disabled accounts (sample): {usernames}",
            None,
        ))

    return findings


# ==========================================
# CHECK: PRIVILEGED GROUP MEMBERSHIP
# ==========================================

def check_privileged_groups(conn, base_dn: str) -> list[dict]:
    """
    Enumerate members of high-privilege AD groups.

    Why: Knowing who has Domain Admin, Enterprise Admin, or Schema Admin
    is the first step in reducing attack surface. More admins = more targets.

    Source: Lesson 9 Step 3 (Group Enumeration — high-privilege groups)
    """
    findings = []

    # Why these groups: These are the "keys to the kingdom" in Active Directory.
    # Domain Admins: full control of domain. Enterprise Admins: full control of forest.
    # Schema Admins: can modify AD schema. Administrators: built-in admin group.
    privileged_groups = [
        "Domain Admins",
        "Enterprise Admins",
        "Schema Admins",
        "Administrators",
        "Account Operators",
        "Backup Operators",
    ]

    total_privileged = 0
    group_details = []

    for group_name in privileged_groups:
        conn.search(
            base_dn,
            f"(&(objectClass=group)(cn={group_name}))",
            attributes=["member"],
        )

        if conn.entries:
            members = conn.entries[0].member.values if hasattr(conn.entries[0].member, "values") else []
            if members:
                # Extract just the CN from full DN for readability
                # "CN=John Smith,OU=Users,DC=corp,DC=com" → "John Smith"
                member_names = []
                for dn in members:
                    cn_part = str(dn).split(",")[0]
                    if cn_part.upper().startswith("CN="):
                        member_names.append(cn_part[3:])
                    else:
                        member_names.append(str(dn)[:50])

                total_privileged += len(members)
                group_details.append(f"{group_name}: {', '.join(member_names[:5])}" +
                                     (f" (+{len(members)-5} more)" if len(members) > 5 else ""))

    if group_details:
        findings.append(_finding(
            "info", "ad_misconfiguration", "privileged_group_audit",
            f"{total_privileged} member(s) in privileged AD groups",
            f"Audit of privileged group membership. Excessive admin accounts increase attack surface. "
            f"Each admin account is a potential target for Kerberoasting, credential theft, or social engineering.",
            "Apply least-privilege principle. Remove unnecessary admin memberships. Use Just-In-Time (JIT) admin access.",
            None,
            "\n".join(group_details),
            None,
        ))

    return findings


# ==========================================
# CHECK: PASSWORD POLICY
# ==========================================

def check_password_policy(conn, base_dn: str) -> list[dict]:
    """
    Audit the domain password policy.

    Why: Weak password policies enable password spraying, brute force, and
    Kerberos ticket cracking. A 25+ character policy for service accounts
    makes Kerberoasting impractical.

    Source: Lesson 9 (credential attacks), domain-architecture.md §4.2
    """
    findings = []

    # Why query base_dn with scope BASE: The Default Domain Policy attributes
    # (minPwdLength, lockoutThreshold, etc.) are stored on the domain root object.
    conn.search(
        base_dn,
        "(objectClass=domain)",
        attributes=[
            "minPwdLength", "minPwdAge", "maxPwdAge",
            "pwdHistoryLength", "lockoutThreshold", "lockoutDuration",
            "pwdProperties",
        ],
        search_scope="BASE",
    )

    if conn.entries:
        policy = conn.entries[0]
        issues = []

        # Check minimum password length
        min_length = int(policy.minPwdLength.value) if policy.minPwdLength.value else 0
        if min_length < 12:
            issues.append(f"Min length: {min_length} (should be ≥12)")

        # Check lockout threshold
        lockout_threshold = int(policy.lockoutThreshold.value) if policy.lockoutThreshold.value else 0
        if lockout_threshold == 0:
            issues.append("No account lockout policy (lockoutThreshold=0)")
        elif lockout_threshold > 10:
            issues.append(f"Lockout threshold too high: {lockout_threshold} (should be ≤10)")

        # Check password history
        history = int(policy.pwdHistoryLength.value) if policy.pwdHistoryLength.value else 0
        if history < 12:
            issues.append(f"Password history: {history} (should be ≥12)")

        # Check password complexity (pwdProperties bit 1 = DOMAIN_PASSWORD_COMPLEX)
        pwd_props = int(policy.pwdProperties.value) if policy.pwdProperties.value else 0
        if not (pwd_props & 1):
            issues.append("Password complexity not enforced")

        if issues:
            severity = "high" if (min_length < 8 or lockout_threshold == 0) else "medium"
            findings.append(_finding(
                severity, "ad_misconfiguration", "weak_password_policy",
                f"Domain password policy has {len(issues)} weakness(es)",
                f"Password policy issues: {'; '.join(issues)}. Weak policies enable password spraying and brute force attacks.",
                "Strengthen domain password policy: minimum 12 chars, complexity enabled, lockout after 5-10 attempts, history ≥12.",
                None,
                "; ".join(issues),
                "CWE-521",
                "Credential Access", "T1110",
            ))

    return findings


# ==========================================
# CHECK: PASSWORD NEVER EXPIRES
# ==========================================

def check_password_never_expires(conn, base_dn: str) -> list[dict]:
    """
    Find accounts with "Password never expires" flag.

    Why: Accounts with non-expiring passwords may have old, weak, or leaked
    passwords indefinitely. Service accounts are the most common — they often
    have weak passwords AND never-expiring flag.
    """
    findings = []

    conn.search(
        base_dn,
        f"(&(objectClass=user)(objectCategory=person)(userAccountControl:1.2.840.113556.1.4.803:={UAC_DONT_EXPIRE_PASSWORD}))",
        attributes=["sAMAccountName", "adminCount"],
    )

    if conn.entries:
        # Separate admin vs regular for severity
        admin_count = sum(1 for e in conn.entries if hasattr(e, "adminCount") and e.adminCount.value)
        usernames = ", ".join(str(e.sAMAccountName) for e in conn.entries[:10])
        severity = "high" if admin_count > 0 else "medium"

        findings.append(_finding(
            severity, "ad_misconfiguration", "password_never_expires",
            f"{len(conn.entries)} account(s) with password set to never expire",
            f"Accounts with non-expiring passwords may retain old, weak, or leaked credentials indefinitely. "
            f"{'Includes admin accounts. ' if admin_count > 0 else ''}"
            f"Accounts: {usernames}",
            "Enable password expiration for all accounts. Use Group Managed Service Accounts (gMSA) for services — they rotate passwords automatically.",
            f"Get-ADUser -Filter {{PasswordNeverExpires -eq $true}} | Set-ADUser -PasswordNeverExpires $false",
            f"Accounts with non-expiring passwords: {usernames}",
            "CWE-262",
            "Persistence", "T1078.002",
        ))

    return findings


# ==========================================
# CHECK: ORPHANED ADMIN ACCOUNTS
# ==========================================

def check_orphaned_admins(conn, base_dn: str) -> list[dict]:
    """
    Find accounts with adminCount=1 that are NOT in any admin group.

    Why: When an account is added to a privileged group, AD sets adminCount=1
    and applies AdminSDHolder ACLs. When removed from the group, adminCount
    stays at 1 but the SDProp process stops updating ACLs. These "orphaned"
    accounts may have residual elevated permissions.

    Source: Lesson 9 Step 14 (AdminSDHolder abuse)
    """
    findings = []

    # Find all accounts with adminCount=1
    conn.search(
        base_dn,
        "(&(objectClass=user)(objectCategory=person)(adminCount=1))",
        attributes=["sAMAccountName", "memberOf"],
    )

    privileged_group_dns = set()
    # Get DNs of privileged groups for comparison
    for group_name in ["Domain Admins", "Enterprise Admins", "Schema Admins", "Administrators",
                        "Account Operators", "Backup Operators"]:
        conn.search(base_dn, f"(&(objectClass=group)(cn={group_name}))", attributes=["distinguishedName"])
        for entry in conn.entries:
            privileged_group_dns.add(str(entry.distinguishedName).lower())

    # Re-query adminCount=1 users (connection state reset by group queries)
    conn.search(
        base_dn,
        "(&(objectClass=user)(objectCategory=person)(adminCount=1))",
        attributes=["sAMAccountName", "memberOf"],
    )

    orphaned = []
    for entry in conn.entries:
        member_of = entry.memberOf.values if hasattr(entry.memberOf, "values") else []
        member_of_lower = {str(g).lower() for g in member_of}

        # Check if user is in any privileged group
        if not member_of_lower.intersection(privileged_group_dns):
            orphaned.append(str(entry.sAMAccountName))

    if orphaned:
        usernames = ", ".join(orphaned[:10])
        findings.append(_finding(
            "medium", "ad_misconfiguration", "orphaned_admin",
            f"{len(orphaned)} orphaned admin account(s) (adminCount=1 but not in admin groups)",
            f"These accounts were previously in privileged groups but were removed. They retain adminCount=1 "
            f"and may have residual elevated ACLs from AdminSDHolder. Accounts: {usernames}",
            "Clear adminCount and reset ACL inheritance for orphaned accounts.",
            # PowerShell: reset adminCount and enable inheritance
            None,
            f"Orphaned admin accounts: {usernames}",
            "CWE-269",
            "Persistence", "T1078.002",
        ))

    return findings


# ==========================================
# CHECK: REVERSIBLE ENCRYPTION
# ==========================================

def check_reversible_encryption(conn, base_dn: str) -> list[dict]:
    """
    Find accounts with "Store password using reversible encryption" flag.

    Why: Reversible encryption means the password is stored in a way that
    can be decrypted — effectively plaintext. If an attacker gets the AD
    database (ntds.dit), they can recover all affected passwords instantly
    without cracking.

    Source: Lesson 9 (Credential Harvesting — DCSync attack extracts hashes)
    """
    findings = []

    conn.search(
        base_dn,
        f"(&(objectClass=user)(objectCategory=person)(userAccountControl:1.2.840.113556.1.4.803:={UAC_ENCRYPTED_TEXT_PWD_ALLOWED}))",
        attributes=["sAMAccountName"],
    )

    if conn.entries:
        usernames = ", ".join(str(e.sAMAccountName) for e in conn.entries[:10])
        findings.append(_finding(
            "high", "ad_misconfiguration", "reversible_encryption",
            f"{len(conn.entries)} account(s) storing password with reversible encryption",
            f"Reversible encryption means passwords can be decrypted from the AD database (ntds.dit). "
            f"If an attacker performs DCSync or steals ntds.dit, these passwords are recovered instantly. "
            f"Accounts: {usernames}",
            "Disable 'Store password using reversible encryption' on all accounts. Reset affected passwords after disabling.",
            f"Get-ADUser -Filter {{AllowReversiblePasswordEncryption -eq $true}} | Set-ADUser -AllowReversiblePasswordEncryption $false",
            f"Accounts with reversible encryption: {usernames}",
            "CWE-327",
            "Credential Access", "T1003",
        ))

    return findings


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute Active Directory audit scan.

    Authenticates to a Domain Controller via LDAP(S) using domain credentials
    and checks AD configuration for security misconfigurations.

    Args:
        target: Domain controller hostname or IP (can also be in params as dc_host)
        params: Scanner parameters including AD credentials:
            - domain: AD domain name (e.g. "corp.example.com")
            - dc_host: Domain controller hostname/IP (overrides target)
            - username: Domain username (e.g. "CORP\\auditor" or "auditor@corp.example.com")
            - password: Domain password
            - use_ssl: Whether to use LDAPS (default True, port 636)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    domain = params.get("domain")
    dc_host = params.get("dc_host") or target
    username = params.get("username")
    password = params.get("password")
    use_ssl = params.get("use_ssl", True)

    if not domain:
        errors.append("AD audit requires 'domain' parameter (e.g. 'corp.example.com')")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    if not dc_host:
        errors.append("AD audit requires a domain controller target (dc_host in params or target)")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    if not username or not password:
        errors.append("AD audit requires domain credentials (username + password in params)")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    base_dn = _build_base_dn(domain)
    port = 636 if use_ssl else 389

    logger.info(f"AD audit starting: domain={domain}, dc={dc_host}, port={port}, user={username}")

    def do_audit():
        """
        Run all AD checks synchronously (ldap3 is sync).
        Wrapped in asyncio.to_thread by caller.
        """
        import ldap3

        try:
            # Create LDAP server and connection
            # Why auto_bind=True: Immediately binds (authenticates) on connection.
            # Why get_info=ALL: Retrieves server info (supported controls, naming contexts).
            server = ldap3.Server(
                dc_host,
                port=port,
                use_ssl=use_ssl,
                get_info=ldap3.ALL,
                connect_timeout=15,
            )

            conn = ldap3.Connection(
                server,
                user=username,
                password=password,
                auto_bind=True,
                raise_exceptions=True,
                receive_timeout=30,
            )

            logger.info(f"LDAP authenticated: server={dc_host}, bound as={username}")

            # Domain controller as asset
            server_info = server.info
            assets.append({
                "asset_type": "technology",
                "value": f"Active Directory Domain Controller: {dc_host}",
                "host": dc_host,
                "port": port,
                "protocol": "ldaps" if use_ssl else "ldap",
                "service_name": "active_directory",
                "service_version": str(server_info.supported_ldap_versions) if server_info and server_info.supported_ldap_versions else None,
                "banner": f"Domain: {domain}, Base DN: {base_dn}",
                "service_metadata": None,
                "confidence": "confirmed",
            })

        except ldap3.core.exceptions.LDAPBindError as e:
            errors.append(f"LDAP bind failed (wrong credentials?): {e}")
            return
        except ldap3.core.exceptions.LDAPSocketOpenError as e:
            errors.append(f"Cannot connect to DC {dc_host}:{port} — {e}")
            return
        except Exception as e:
            errors.append(f"LDAP connection failed: {e}")
            return

        # Run all checks — each one handles its own exceptions
        # Why sequential: Each check is a separate LDAP search on same connection.
        # Parallel queries on one LDAP connection are not safe.
        checks = [
            ("kerberoastable", check_kerberoastable),
            ("asreproastable", check_asreproastable),
            ("unconstrained_delegation", check_unconstrained_delegation),
            ("constrained_delegation", check_constrained_delegation),
            ("stale_accounts", check_stale_accounts),
            ("disabled_accounts", check_disabled_accounts),
            ("privileged_groups", check_privileged_groups),
            ("password_policy", check_password_policy),
            ("password_never_expires", check_password_never_expires),
            ("orphaned_admins", check_orphaned_admins),
            ("reversible_encryption", check_reversible_encryption),
        ]

        for check_name, check_fn in checks:
            try:
                findings.extend(check_fn(conn, base_dn))
            except Exception as e:
                logger.debug(f"AD check '{check_name}' failed: {e}")
                errors.append(f"Check '{check_name}' failed: {e}")

        # Clean up LDAP connection
        try:
            conn.unbind()
        except Exception:
            pass

    await asyncio.to_thread(do_audit)

    duration = round(time.time() - start_time, 1)
    logger.info(f"AD audit complete: findings={len(findings)}, errors={len(errors)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
