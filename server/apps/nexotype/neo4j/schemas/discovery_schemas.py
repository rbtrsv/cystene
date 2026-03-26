from pydantic import BaseModel
from typing import List, Optional

class NetworkNode(BaseModel):
    uid: str
    name: str
    type: str
    distance: int

class NetworkResponse(BaseModel):
    entity_uid: str
    entity_type: str
    network: List[NetworkNode]

class TreatmentPath(BaseModel):
    uid: str
    name: str
    type: str
    availability: Optional[str] = None
    distance: int

class TreatmentPathsResponse(BaseModel):
    gene_uid: str
    treatments: List[TreatmentPath]

class SimilarTreatment(BaseModel):
    uid: str
    name: str
    type: str
    common_targets: int

class SimilarTreatmentsResponse(BaseModel):
    treatment_uid: str
    similar_treatments: List[SimilarTreatment]