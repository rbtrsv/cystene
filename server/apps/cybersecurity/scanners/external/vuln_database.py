"""
Vulnerability Database — Known CVEs by Service and Version

Local database of known vulnerable service versions. Each entry maps a service name
to a list of vulnerable version patterns with CVE IDs, CVSS scores, and CWE IDs.

Why local dict and not API: Speed and reliability. No network dependency during scan.
In Phase 4, this can be supplemented with NVD (National Vulnerability Database) API calls.

Why version_match is substring: Banners report versions inconsistently ("OpenSSH_7.2p1",
"OpenSSH 7.2", "7.2p2"). Substring match catches all variants.

Sources:
- network_scanner.py check_vulnerabilities() (lesson 05)
- BHR Ch6 (CWE vs CVE, vulnerability taxonomy)
- common_vulnerabilities.md (OWASP Top 10, CVSS scoring)
- NVD (cvedetails.com) for actual CVE data
"""


# ==========================================
# KNOWN VULNERABLE SERVICE VERSIONS
# ==========================================

# Format: service_name (lowercase) → list of vulnerability entries
# Each entry: version_match (substring), cve_id, cvss_score, severity, title, description, cwe_id
KNOWN_VULNS: dict[str, list[dict]] = {

    # ==========================================
    # OpenSSH Vulnerabilities
    # ==========================================
    "openssh": [
        {
            "version_match": "7.2",
            "cve_id": "CVE-2016-6210",
            "cvss_score": 5.3,
            "severity": "medium",
            "title": "OpenSSH username enumeration",
            "description": "OpenSSH before 7.3 allows remote attackers to enumerate valid usernames via timing differences in authentication responses.",
            "cwe_id": "CWE-200",
        },
        {
            "version_match": "7.6",
            "cve_id": "CVE-2018-15473",
            "cvss_score": 5.3,
            "severity": "medium",
            "title": "OpenSSH username enumeration",
            "description": "OpenSSH through 7.7 allows username enumeration via malformed authentication requests.",
            "cwe_id": "CWE-200",
        },
        {
            "version_match": "7.7",
            "cve_id": "CVE-2018-15473",
            "cvss_score": 5.3,
            "severity": "medium",
            "title": "OpenSSH username enumeration",
            "description": "OpenSSH through 7.7 allows username enumeration via malformed authentication requests.",
            "cwe_id": "CWE-200",
        },
        {
            "version_match": "6.6",
            "cve_id": "CVE-2016-6515",
            "cvss_score": 7.5,
            "severity": "high",
            "title": "OpenSSH password length DoS",
            "description": "OpenSSH before 7.3 allows remote attackers to cause denial of service via crafted password lengths.",
            "cwe_id": "CWE-20",
        },
        {
            "version_match": "8.5",
            "cve_id": "CVE-2021-41617",
            "cvss_score": 7.0,
            "severity": "high",
            "title": "OpenSSH privilege escalation",
            "description": "sshd in OpenSSH 6.2 through 8.7 has a privilege escalation vulnerability when AuthorizedKeysCommand or AuthorizedPrincipalsCommand is configured.",
            "cwe_id": "CWE-269",
        },
    ],

    # ==========================================
    # Apache HTTP Server Vulnerabilities
    # ==========================================
    "apache": [
        {
            "version_match": "2.4.49",
            "cve_id": "CVE-2021-41773",
            "cvss_score": 7.5,
            "severity": "high",
            "title": "Apache path traversal and RCE",
            "description": "Apache 2.4.49 path traversal allows reading files outside document root. With mod_cgi enabled, allows remote code execution.",
            "cwe_id": "CWE-22",
        },
        {
            "version_match": "2.4.50",
            "cve_id": "CVE-2021-42013",
            "cvss_score": 9.8,
            "severity": "critical",
            "title": "Apache path traversal bypass (incomplete fix for CVE-2021-41773)",
            "description": "Apache 2.4.50 contains incomplete fix for CVE-2021-41773, still allowing path traversal and RCE.",
            "cwe_id": "CWE-22",
        },
        {
            "version_match": "2.2.",
            "cve_id": None,
            "cvss_score": None,
            "severity": "high",
            "title": "Apache 2.2.x is end-of-life",
            "description": "Apache HTTP Server 2.2.x has reached end of life and no longer receives security updates. Multiple known vulnerabilities exist.",
            "cwe_id": "CWE-1104",
        },
    ],

    # ==========================================
    # nginx Vulnerabilities
    # ==========================================
    "nginx": [
        {
            "version_match": "1.0.",
            "cve_id": None,
            "cvss_score": None,
            "severity": "high",
            "title": "nginx 1.0.x is severely outdated",
            "description": "nginx 1.0.x has multiple known vulnerabilities and is no longer maintained.",
            "cwe_id": "CWE-1104",
        },
        {
            "version_match": "1.16.",
            "cve_id": "CVE-2019-9511",
            "cvss_score": 7.5,
            "severity": "high",
            "title": "nginx HTTP/2 DoS (Data Dribble)",
            "description": "nginx before 1.17.3 is vulnerable to HTTP/2 denial of service via manipulated window size and stream priority.",
            "cwe_id": "CWE-400",
        },
    ],

    # ==========================================
    # Microsoft IIS Vulnerabilities
    # ==========================================
    "iis": [
        {
            "version_match": "6.0",
            "cve_id": "CVE-2017-7269",
            "cvss_score": 9.8,
            "severity": "critical",
            "title": "IIS 6.0 WebDAV buffer overflow RCE",
            "description": "Buffer overflow in IIS 6.0 WebDAV allows remote code execution.",
            "cwe_id": "CWE-119",
        },
        {
            "version_match": "7.5",
            "cve_id": "CVE-2014-4078",
            "cvss_score": 5.3,
            "severity": "medium",
            "title": "IIS 7.5 authentication bypass",
            "description": "IIS 7.5 with IP-based access restrictions can be bypassed with specific request headers.",
            "cwe_id": "CWE-284",
        },
    ],

    # ==========================================
    # FTP Server Vulnerabilities
    # ==========================================
    "vsftpd": [
        {
            "version_match": "2.3.4",
            "cve_id": "CVE-2011-2523",
            "cvss_score": 9.8,
            "severity": "critical",
            "title": "vsftpd 2.3.4 backdoor",
            "description": "vsftpd 2.3.4 contains a backdoor that opens a shell on port 6200 when a smiley face is sent as username.",
            "cwe_id": "CWE-506",
        },
    ],
    "proftpd": [
        {
            "version_match": "1.3.5",
            "cve_id": "CVE-2015-3306",
            "cvss_score": 10.0,
            "severity": "critical",
            "title": "ProFTPD mod_copy arbitrary file copy",
            "description": "ProFTPD 1.3.5 mod_copy allows unauthenticated arbitrary file copy leading to remote code execution.",
            "cwe_id": "CWE-284",
        },
    ],

    # ==========================================
    # Database Vulnerabilities
    # ==========================================
    "mysql": [
        {
            "version_match": "5.5.",
            "cve_id": None,
            "cvss_score": None,
            "severity": "high",
            "title": "MySQL 5.5.x is end-of-life",
            "description": "MySQL 5.5.x reached end of life in December 2018 and no longer receives security updates.",
            "cwe_id": "CWE-1104",
        },
    ],
    "postgresql": [
        {
            "version_match": "9.3.",
            "cve_id": None,
            "cvss_score": None,
            "severity": "high",
            "title": "PostgreSQL 9.3.x is end-of-life",
            "description": "PostgreSQL 9.3.x reached end of life in November 2018.",
            "cwe_id": "CWE-1104",
        },
    ],
}


# ==========================================
# DEPRECATED/INSECURE PROTOCOLS
# ==========================================

# Why: These protocols transmit data in plaintext or have known architectural flaws.
# Detection is port-based — if the service is running, it's a finding.
DEPRECATED_PROTOCOLS: list[dict] = [
    {
        "port": 23,
        "service": "telnet",
        "severity": "high",
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": "CWE-319",
        "title": "Telnet service detected — unencrypted protocol",
        "description": "Telnet transmits all data including credentials in plaintext. Any network observer can capture login credentials.",
        "remediation": "Disable Telnet and use SSH instead.",
        "remediation_script": "systemctl disable telnet && systemctl stop telnet",
    },
    {
        "port": 21,
        "service": "ftp",
        "severity": "medium",
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": "CWE-319",
        "title": "FTP service detected — unencrypted protocol",
        "description": "FTP transmits credentials and data in plaintext unless FTPS/SFTP is used. Consider if FTP access is necessary.",
        "remediation": "Replace FTP with SFTP (SSH File Transfer Protocol) or FTPS.",
        "remediation_script": None,
    },
    {
        "port": 445,
        "service": "smb",
        "severity": "medium",
        "cve_id": "CVE-2017-0144",
        "cvss_score": 8.1,
        "cwe_id": "CWE-20",
        "title": "SMB service detected — check for EternalBlue (MS17-010)",
        "description": "SMB exposed to the internet is a high-risk target. The EternalBlue exploit (MS17-010) affected SMBv1 and was used in WannaCry ransomware.",
        "remediation": "Block SMB (port 445) at the firewall. If required internally, disable SMBv1 and apply all patches.",
        "remediation_script": "Set-SmbServerConfiguration -EnableSMB1Protocol $false  # Windows PowerShell",
    },
    {
        "port": 3389,
        "service": "rdp",
        "severity": "medium",
        "cve_id": "CVE-2019-0708",
        "cvss_score": 9.8,
        "cwe_id": "CWE-416",
        "title": "RDP service exposed — check for BlueKeep",
        "description": "RDP exposed to the internet is a frequent attack target. CVE-2019-0708 (BlueKeep) allows unauthenticated RCE on older Windows versions.",
        "remediation": "Restrict RDP access via VPN or firewall rules. Ensure all Windows patches are applied.",
        "remediation_script": None,
    },
]
