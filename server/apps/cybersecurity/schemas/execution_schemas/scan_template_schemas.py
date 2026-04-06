"""
Scan Template Schemas

Pydantic schemas for the ScanTemplate model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class ScanType(str, Enum):
    """Scan type options — each maps to a scanner module"""
    # Production scanners (12)
    PORT_SCAN = "port_scan"
    DNS_ENUM = "dns_enum"
    SSL_CHECK = "ssl_check"
    WEB_SCAN = "web_scan"
    VULN_SCAN = "vuln_scan"
    API_SCAN = "api_scan"
    ACTIVE_WEB_SCAN = "active_web_scan"
    PASSWORD_AUDIT = "password_audit"
    HOST_AUDIT = "host_audit"
    CLOUD_AUDIT = "cloud_audit"
    AD_AUDIT = "ad_audit"
    MOBILE_SCAN = "mobile_scan"
    # Future expansion
    TECH_DETECT = "tech_detect"
    WAF_DETECT = "waf_detect"
    WHOIS = "whois"
    CLOUD_SCAN = "cloud_scan"
    SMB_SCAN = "smb_scan"
    AD_SCAN = "ad_scan"


class PortRange(str, Enum):
    """Port range preset options (custom ranges are free-text strings)"""
    TOP_100 = "top_100"
    TOP_1000 = "top_1000"
    FULL = "full"


class ScanSpeed(str, Enum):
    """Scan speed options"""
    SLOW = "slow"
    NORMAL = "normal"
    FAST = "fast"


# ==========================================
# ScanTemplate Schema (Full Representation)
# ==========================================

class ScanTemplateDetail(BaseModel):
    """Scan template schema - full representation"""
    id: int
    target_id: int = Field(description="Scan target this template belongs to")
    name: str = Field(description="Template name")
    description: str | None = None
    scan_types: str = Field(description="Comma-separated scan types to run")
    port_range: str = Field(description="Port range preset or custom range")
    scan_speed: ScanSpeed = Field(description="Scan speed")
    follow_redirects: bool = True
    max_depth: int = 3
    check_headers: bool = True
    dns_brute_force: bool = False
    dns_wordlist: str = "small"
    timeout_seconds: int = 300
    max_concurrent: int = 50
    active_scan_consent: bool = False
    engine_params: str | None = None
    credential_id: int | None = Field(None, description="Credential for internal scanners")
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Input Schemas
# ==========================================

class ScanTemplateCreate(BaseModel):
    """Schema for creating a new scan template"""
    target_id: int = Field(description="Scan target this template belongs to")
    name: str = Field(min_length=1, max_length=255, description="Template name")
    description: str | None = None
    scan_types: str = Field(min_length=1, max_length=500, description="Comma-separated scan types")
    port_range: str = Field(default="top_100", max_length=255)
    scan_speed: ScanSpeed = Field(default=ScanSpeed.NORMAL)
    follow_redirects: bool = True
    max_depth: int = Field(default=3, ge=1, le=10)
    check_headers: bool = True
    dns_brute_force: bool = False
    dns_wordlist: str = Field(default="small", max_length=50)
    timeout_seconds: int = Field(default=300, ge=10, le=3600)
    max_concurrent: int = Field(default=50, ge=1, le=500)
    active_scan_consent: bool = False
    engine_params: str | None = None
    credential_id: int | None = Field(None, description="Credential for internal scanners")


class ScanTemplateUpdate(BaseModel):
    """Schema for updating a scan template"""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    scan_types: str | None = Field(None, min_length=1, max_length=500)
    port_range: str | None = Field(None, max_length=255)
    scan_speed: ScanSpeed | None = None
    follow_redirects: bool | None = None
    max_depth: int | None = Field(None, ge=1, le=10)
    check_headers: bool | None = None
    dns_brute_force: bool | None = None
    dns_wordlist: str | None = Field(None, max_length=50)
    timeout_seconds: int | None = Field(None, ge=10, le=3600)
    max_concurrent: int | None = Field(None, ge=1, le=500)
    active_scan_consent: bool | None = None
    engine_params: str | None = None
    credential_id: int | None = None


# ==========================================
# Response Types
# ==========================================

class ScanTemplateResponse(BaseModel):
    """Response containing a single scan template"""
    success: bool
    data: ScanTemplateDetail | None = None
    error: str | None = None


class ScanTemplatesResponse(BaseModel):
    """Response containing multiple scan templates"""
    success: bool
    data: list[ScanTemplateDetail] | None = None
    error: str | None = None
