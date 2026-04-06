"""
Asset Schemas

Pydantic schemas for the Asset model following simplified schema guidelines.
Read-only — no Create/Update. Scanner discovers assets, user views them.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class AssetType(str, Enum):
    """Discovered asset type options"""
    HOST = "host"
    SERVICE = "service"
    TECHNOLOGY = "technology"
    CERTIFICATE = "certificate"
    DNS_RECORD = "dns_record"


class AssetConfidence(str, Enum):
    """Asset discovery confidence level"""
    CONFIRMED = "confirmed"
    PROBABLE = "probable"
    POSSIBLE = "possible"


# ==========================================
# Asset Schema (Full Representation)
# ==========================================

class AssetDetail(BaseModel):
    """Asset schema - full representation. Read-only."""
    id: int
    scan_job_id: int = Field(description="Scan job that discovered this")
    asset_type: AssetType = Field(description="Type of discovered asset")
    value: str = Field(description="Asset value (IP, service name, technology, etc.)")
    host: str | None = None
    port: int | None = None
    protocol: str | None = None
    service_name: str | None = None
    service_version: str | None = None
    banner: str | None = None
    service_metadata: str | None = Field(None, description="Deep discovery data (JSON)")
    confidence: AssetConfidence = Field(description="Discovery confidence level")
    first_seen_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Response Types
# ==========================================

class AssetResponse(BaseModel):
    """Response containing a single asset"""
    success: bool
    data: AssetDetail | None = None
    error: str | None = None


class AssetsResponse(BaseModel):
    """Response containing multiple assets"""
    success: bool
    data: list[AssetDetail] | None = None
    error: str | None = None
