from pydantic import BaseModel, ConfigDict
from datetime import datetime

# ==========================================
# Request Schemas
# ==========================================

class OntologyTermCreate(BaseModel):
    """Schema for creating a new ontology term"""
    source: str
    accession: str
    name: str
    definition: str | None = None


class OntologyTermUpdate(BaseModel):
    """Schema for updating an ontology term"""
    source: str = None
    accession: str = None
    name: str = None
    definition: str | None = None


# ==========================================
# Response Schemas
# ==========================================

class OntologyTermDetail(BaseModel):
    """Schema for ontology term details"""
    id: int
    source: str
    accession: str
    name: str
    definition: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class OntologyTermListResponse(BaseModel):
    """Response schema for listing ontology terms"""
    success: bool
    data: list[OntologyTermDetail] | None = None
    count: int = 0
    error: str | None = None


class OntologyTermResponse(BaseModel):
    """Response schema for single ontology term operations"""
    success: bool
    data: OntologyTermDetail | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response"""
    success: bool
    message: str | None = None
    error: str | None = None
