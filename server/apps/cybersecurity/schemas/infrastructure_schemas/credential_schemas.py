"""
Credential Schemas

Pydantic schemas for the Credential model following simplified schema guidelines.
SECURITY: encrypted_value is accepted in Create/Update but NEVER returned in Detail responses.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# ==========================================
# Enums
# ==========================================

class CredentialType(str, Enum):
    """Credential type options"""
    SSH_KEY = "ssh_key"
    SSH_PASSWORD = "ssh_password"
    API_KEY = "api_key"
    DOMAIN_CREDENTIALS = "domain_credentials"
    SERVICE_ACCOUNT = "service_account"


# ==========================================
# Credential Schema (Full Representation)
# ==========================================

class CredentialDetail(BaseModel):
    """Credential schema - full representation.
    Why no encrypted_value: sensitive data never leaves the server in API responses.
    User sees name, type, username, status — never the actual secret."""
    id: int
    organization_id: int = Field(description="Organization that owns this credential")
    infrastructure_id: int | None = Field(None, description="Linked infrastructure item")
    name: str = Field(description="Credential name")
    cred_type: CredentialType = Field(description="Type of credential")
    username: str | None = Field(None, description="Username associated with this credential")
    extra_metadata: str | None = Field(None, description="Additional metadata (JSON)")
    is_active: bool = True
    last_used_at: datetime | None = None
    last_verified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Input Schemas
# ==========================================

class CredentialCreate(BaseModel):
    """Schema for creating a new credential.
    encrypted_value is the raw secret — encrypted by the server before storage."""
    name: str = Field(min_length=1, max_length=255, description="Credential name")
    cred_type: CredentialType = Field(description="Type of credential")
    encrypted_value: str = Field(min_length=1, description="The secret value (SSH key, password, API key). Encrypted before storage.")
    infrastructure_id: int | None = Field(None, description="Linked infrastructure item")
    username: str | None = Field(None, max_length=255, description="Username")
    extra_metadata: str | None = Field(None, description="Additional metadata (JSON)")
    is_active: bool = True


class CredentialUpdate(BaseModel):
    """Schema for updating a credential.
    encrypted_value can be updated (re-encrypted) or left unchanged (omit field)."""
    name: str | None = Field(None, min_length=1, max_length=255)
    cred_type: CredentialType | None = None
    encrypted_value: str | None = Field(None, min_length=1, description="New secret value. Omit to keep existing.")
    infrastructure_id: int | None = None
    username: str | None = Field(None, max_length=255)
    extra_metadata: str | None = None
    is_active: bool | None = None


# ==========================================
# Response Types
# ==========================================

class CredentialResponse(BaseModel):
    """Response containing a single credential"""
    success: bool
    data: CredentialDetail | None = None
    error: str | None = None


class CredentialsResponse(BaseModel):
    """Response containing multiple credentials"""
    success: bool
    data: list[CredentialDetail] | None = None
    error: str | None = None
