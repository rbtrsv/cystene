"""
Service Signatures

Port-to-service mapping, protocol-specific probes for banner grabbing,
and version extraction helpers.

Source: lesson_05 network_scanner.py service_signatures + nmap service-probes
"""


# ==========================================
# PORT → SERVICE MAPPING
# ==========================================

SERVICE_SIGNATURES = {
    21:   {"name": "ftp",        "protocol": "tcp"},
    22:   {"name": "ssh",        "protocol": "tcp"},
    23:   {"name": "telnet",     "protocol": "tcp"},
    25:   {"name": "smtp",       "protocol": "tcp"},
    53:   {"name": "dns",        "protocol": "tcp"},
    80:   {"name": "http",       "protocol": "tcp"},
    110:  {"name": "pop3",       "protocol": "tcp"},
    111:  {"name": "rpcbind",    "protocol": "tcp"},
    135:  {"name": "msrpc",      "protocol": "tcp"},
    139:  {"name": "netbios-ssn","protocol": "tcp"},
    143:  {"name": "imap",       "protocol": "tcp"},
    443:  {"name": "https",      "protocol": "tcp"},
    445:  {"name": "microsoft-ds","protocol": "tcp"},
    465:  {"name": "smtps",      "protocol": "tcp"},
    587:  {"name": "submission", "protocol": "tcp"},
    631:  {"name": "ipp",        "protocol": "tcp"},
    993:  {"name": "imaps",      "protocol": "tcp"},
    995:  {"name": "pop3s",      "protocol": "tcp"},
    1433: {"name": "mssql",      "protocol": "tcp"},
    1521: {"name": "oracle",     "protocol": "tcp"},
    2049: {"name": "nfs",        "protocol": "tcp"},
    3306: {"name": "mysql",      "protocol": "tcp"},
    3389: {"name": "rdp",        "protocol": "tcp"},
    5432: {"name": "postgresql", "protocol": "tcp"},
    5900: {"name": "vnc",        "protocol": "tcp"},
    6379: {"name": "redis",      "protocol": "tcp"},
    8080: {"name": "http-proxy", "protocol": "tcp"},
    8443: {"name": "https-alt",  "protocol": "tcp"},
    9200: {"name": "elasticsearch","protocol": "tcp"},
    27017:{"name": "mongodb",    "protocol": "tcp"},
}


# ==========================================
# PROTOCOL-SPECIFIC PROBES
# ==========================================

def get_probe_for_port(port: int, host: str = "") -> bytes | None:
    """
    Get the appropriate probe to send after connecting to a port.
    Some services (FTP, SSH) send a banner immediately — no probe needed.
    Others (HTTP) need a request to get useful info.

    Returns:
        bytes to send, or None if service sends banner first
    """
    if port in (80, 8080, 8000, 8008, 8081, 8443, 443):
        # HTTP — send minimal GET request
        return f"GET / HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n".encode()
    elif port == 25 or port == 587:
        # SMTP — send EHLO
        return b"EHLO scanner\r\n"
    elif port in (21, 22, 110, 143):
        # FTP, SSH, POP3, IMAP — send banner immediately, no probe needed
        return None
    else:
        # Generic probe — send newline to trigger response
        return b"\r\n"


# ==========================================
# SERVICE IDENTIFICATION FROM BANNER
# ==========================================

def identify_service(port: int, banner: str) -> dict:
    """
    Identify service name and version from port number and banner content.

    Args:
        port: Port number
        banner: Raw banner text from the service

    Returns:
        dict with keys: service_name, service_version, banner
    """
    # Start with port-based lookup
    sig = SERVICE_SIGNATURES.get(port, {})
    service_name = sig.get("name", "unknown")
    service_version = ""

    if not banner:
        return {"service_name": service_name, "service_version": "", "banner": ""}

    banner_lower = banner.lower()

    # Refine based on banner content
    if "openssh" in banner_lower:
        service_name = "ssh"
        service_version = _extract_version(banner, "OpenSSH_") or _extract_version(banner, "OpenSSH ")
    elif "apache" in banner_lower:
        service_name = "http"
        service_version = _extract_version(banner, "Apache/")
    elif "nginx" in banner_lower:
        service_name = "http"
        service_version = _extract_version(banner, "nginx/")
    elif "iis" in banner_lower:
        service_name = "http"
        service_version = _extract_version(banner, "IIS/") or _extract_version(banner, "Microsoft-IIS/")
    elif "vsftpd" in banner_lower:
        service_name = "ftp"
        service_version = _extract_version(banner, "vsftpd ")
    elif "proftpd" in banner_lower:
        service_name = "ftp"
        service_version = _extract_version(banner, "ProFTPD ")
    elif "mysql" in banner_lower or port == 3306:
        service_name = "mysql"
        service_version = _extract_version(banner, "mysql_native_password") or ""
    elif "postgresql" in banner_lower or port == 5432:
        service_name = "postgresql"
    elif "redis" in banner_lower or port == 6379:
        service_name = "redis"
        service_version = _extract_version(banner, "redis_version:")
    elif "smtp" in banner_lower or "postfix" in banner_lower:
        service_name = "smtp"
        if "postfix" in banner_lower:
            service_version = "Postfix"
    elif "vnc" in banner_lower or "rfb" in banner_lower:
        service_name = "vnc"
        service_version = _extract_version(banner, "RFB ")
    elif "+ok" in banner_lower:
        service_name = "pop3"
    elif "* ok" in banner_lower:
        service_name = "imap"

    return {
        "service_name": service_name,
        "service_version": service_version,
        "banner": banner[:500],  # Truncate long banners
    }


def _extract_version(banner: str, prefix: str) -> str:
    """
    Extract version string after a prefix.
    Example: _extract_version("OpenSSH_8.9p1", "OpenSSH_") → "8.9p1"
    """
    try:
        idx = banner.find(prefix)
        if idx == -1:
            # Try case-insensitive
            idx = banner.lower().find(prefix.lower())
        if idx == -1:
            return ""

        start = idx + len(prefix)
        end = start
        while end < len(banner) and banner[end] not in (" ", "\r", "\n", "\t", "(", ",", ";"):
            end += 1
        return banner[start:end].strip()
    except Exception:
        return ""
