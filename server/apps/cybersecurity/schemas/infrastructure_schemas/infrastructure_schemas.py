"""
Infrastructure Schemas

Pydantic schemas for the Infrastructure model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class InfraType(str, Enum):
    """Infrastructure type options"""
    SERVER = "server"
    APPLICATION = "application"
    DATABASE = "database"
    NETWORK_DEVICE = "network_device"
    CLOUD_SERVICE = "cloud_service"
    CLOUD_ACCOUNT = "cloud_account"


class Environment(str, Enum):
    """Environment options"""
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"
    TESTING = "testing"


class Criticality(str, Enum):
    """Criticality level options"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ==========================================
# Infrastructure Schema (Full Representation)
# ==========================================

class InfrastructureDetail(BaseModel):
    """Infrastructure schema - full representation"""
    id: int
    organization_id: int = Field(description="Organization that owns this infrastructure")
    name: str = Field(description="Infrastructure name")
    infra_type: InfraType = Field(description="Type of infrastructure")
    description: str | None = None
    environment: Environment = Field(description="Deployment environment")
    criticality: Criticality = Field(description="Business criticality level")
    owner: str | None = Field(None, description="Team or person responsible")
    ip_address: str | None = None
    hostname: str | None = None
    url: str | None = None
    cloud_provider: str | None = None
    region: str | None = None
    tags: str | None = None
    notes: str | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Input Schemas
# ==========================================

class InfrastructureCreate(BaseModel):
    """Schema for creating new infrastructure"""
    name: str = Field(min_length=1, max_length=255, description="Infrastructure name")
    infra_type: InfraType = Field(description="Type of infrastructure")
    description: str | None = None
    environment: Environment = Field(default=Environment.PRODUCTION, description="Deployment environment")
    criticality: Criticality = Field(default=Criticality.MEDIUM, description="Business criticality level")
    owner: str | None = Field(None, max_length=255, description="Team or person responsible")
    ip_address: str | None = Field(None, max_length=255)
    hostname: str | None = Field(None, max_length=255)
    url: str | None = Field(None, max_length=500)
    cloud_provider: str | None = Field(None, max_length=100)
    region: str | None = Field(None, max_length=100)
    tags: str | None = Field(None, max_length=500)
    notes: str | None = None
    is_active: bool = True


class InfrastructureUpdate(BaseModel):
    """Schema for updating infrastructure"""
    name: str | None = Field(None, min_length=1, max_length=255)
    infra_type: InfraType | None = None
    description: str | None = None
    environment: Environment | None = None
    criticality: Criticality | None = None
    owner: str | None = Field(None, max_length=255)
    ip_address: str | None = Field(None, max_length=255)
    hostname: str | None = Field(None, max_length=255)
    url: str | None = Field(None, max_length=500)
    cloud_provider: str | None = Field(None, max_length=100)
    region: str | None = Field(None, max_length=100)
    tags: str | None = Field(None, max_length=500)
    notes: str | None = None
    is_active: bool | None = None


# ==========================================
# Response Types
# ==========================================

class InfrastructureResponse(BaseModel):
    """Response containing a single infrastructure item"""
    success: bool
    data: InfrastructureDetail | None = None
    error: str | None = None


class InfrastructuresResponse(BaseModel):
    """Response containing multiple infrastructure items"""
    success: bool
    data: list[InfrastructureDetail] | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
