"""
Finding Schemas

Pydantic schemas for the Finding model following simplified schema guidelines.
No Create/Update — scanner writes findings. User only updates triage status via PATCH.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class Severity(str, Enum):
    """Finding severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingStatus(str, Enum):
    """Finding triage status options"""
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class FindingCategory(str, Enum):
    """Finding category options — groups findings in UI"""
    # Port & Service findings (from port_scan)
    OPEN_PORT = "open_port"
    SERVICE_EXPOSURE = "service_exposure"
    OUTDATED_SERVICE = "outdated_service"
    DEFAULT_CREDENTIALS = "default_credentials"
    # DNS findings (from dns_scan)
    DNS_EXPOSURE = "dns_exposure"
    SUBDOMAIN_DISCOVERY = "subdomain_discovery"
    DNS_MISCONFIGURATION = "dns_misconfiguration"
    # SSL/TLS findings (from ssl_scan)
    SSL_WEAKNESS = "ssl_weakness"
    CERTIFICATE_ISSUE = "certificate_issue"
    PROTOCOL_VULNERABILITY = "protocol_vulnerability"
    # Web findings (from web_scan)
    MISSING_HEADER = "missing_header"
    WEB_MISCONFIGURATION = "web_misconfiguration"
    INFORMATION_DISCLOSURE = "information_disclosure"
    # Vuln scanner findings (from vuln_scan)
    KNOWN_VULNERABILITY = "known_vulnerability"
    # API scanner findings (from api_scan)
    API_VULNERABILITY = "api_vulnerability"
    # Active web scanner findings (from active_web_scan)
    INJECTION_DETECTED = "injection_detected"
    # Web scanner extended findings
    FILE_EXPOSURE = "file_exposure"
    DIRECTORY_LISTING = "directory_listing"
    CORS_MISCONFIGURATION = "cors_misconfiguration"
    OPEN_REDIRECT = "open_redirect"
    # Host audit findings (from host_audit_scan)
    PRIVILEGE_ESCALATION = "privilege_escalation"
    WEAK_FILE_PERMISSIONS = "weak_file_permissions"
    EXPOSED_CREDENTIALS = "exposed_credentials"
    INSECURE_SERVICE_CONFIG = "insecure_service_config"
    # Cloud audit findings (from cloud_audit_scan)
    CLOUD_MISCONFIGURATION = "cloud_misconfiguration"
    IAM_ISSUE = "iam_issue"
    # AD audit findings (from ad_audit_scan)
    AD_WEAKNESS = "ad_weakness"
    # Password audit findings (from password_audit_scan)
    WEAK_PASSWORD = "weak_password"
    # Mobile findings (from mobile_scan)
    MOBILE_VULNERABILITY = "mobile_vulnerability"
    # General categories
    WEAK_AUTHENTICATION = "weak_authentication"
    CONFIGURATION_ERROR = "configuration_error"


# ==========================================
# Finding Schema (Full Representation)
# ==========================================

class FindingDetail(BaseModel):
    """Finding schema - full representation"""
    id: int
    scan_job_id: int = Field(description="Scan job that discovered this")
    fingerprint: str = Field(description="SHA-256 hash for deduplication")
    is_new: bool = Field(description="True if first time seen for this target")
    first_found_job_id: int | None = Field(None, description="First scan that found this")
    severity: Severity = Field(description="Finding severity")
    category: FindingCategory = Field(description="Finding category")
    finding_type: str = Field(description="Specific finding within category")
    title: str = Field(description="Human-readable title")
    description: str = Field(description="Detailed explanation")
    remediation: str | None = Field(None, description="How to fix (explanation)")
    remediation_script: str | None = Field(None, description="Copiable fix command/snippet")
    evidence: str | None = Field(None, description="Raw evidence")
    host: str | None = None
    port: int | None = None
    protocol: str | None = None
    url: str | None = None
    cve_id: str | None = None
    cvss_score: float | None = None
    cwe_id: str | None = None
    owasp_category: str | None = None
    mitre_tactic: str | None = None
    mitre_technique: str | None = None
    status: FindingStatus = Field(description="Triage status")
    resolved_by: int | None = Field(None, description="User ID who resolved")
    discovered_at: datetime
    status_changed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Action Schemas
# ==========================================

class FindingStatusUpdate(BaseModel):
    """Schema for updating finding triage status via PATCH /{id}/status"""
    status: FindingStatus = Field(description="New triage status")


# ==========================================
# Response Types
# ==========================================

class FindingResponse(BaseModel):
    """Response containing a single finding"""
    success: bool
    data: FindingDetail | None = None
    error: str | None = None


class FindingsResponse(BaseModel):
    """Response containing multiple findings"""
    success: bool
    data: list[FindingDetail] | None = None
    error: str | None = None
