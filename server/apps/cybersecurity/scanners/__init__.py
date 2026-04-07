"""
Cybersecurity Scanners Package

Registry of all available scanners. Each scanner is a plain async function
with the signature: async def run(target: str, params: dict) -> dict

Scanner dispatcher in scan_job_subrouter uses this dict to call scanners.
"""

from .external import port_scan, dns_scan, ssl_scan, web_scan, vuln_scan, api_scan, active_web_scan, password_audit_scan

# Scanner registry — scan_type string → async function
# Additional scanners will be added as they are implemented
SCANNERS = {
    "port_scan": port_scan.run,
    "dns_enum": dns_scan.run,
    "ssl_check": ssl_scan.run,
    "web_scan": web_scan.run,
    "vuln_scan": vuln_scan.run,
    "api_scan": api_scan.run,
    "active_web_scan": active_web_scan.run,
    "password_audit": password_audit_scan.run,
}
