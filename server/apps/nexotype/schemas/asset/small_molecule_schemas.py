from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class SmallMoleculeCreate(BaseModel):
    """Schema for creating a new small molecule"""
    uid: str
    name: str
    project_code: str | None = None
    smiles: str
    inchi_key: str | None = None


class SmallMoleculeUpdate(BaseModel):
    """Schema for updating a small molecule"""
    uid: str = None
    name: str = None
    project_code: str | None = None
    smiles: str = None
    inchi_key: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class SmallMoleculeDetail(BaseModel):
    """Schema for small molecule details"""
    id: int
    uid: str
    name: str
    project_code: str | None = None
    asset_type: str
    smiles: str
    inchi_key: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SmallMoleculeListResponse(BaseModel):
    """Response schema for listing small molecules"""
    success: bool
    data: list[SmallMoleculeDetail] | None = None
    count: int = 0
    error: str | None = None


class SmallMoleculeResponse(BaseModel):
    """Response schema for single small molecule operations"""
    success: bool
    data: SmallMoleculeDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
