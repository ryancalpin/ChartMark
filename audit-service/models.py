"""Pydantic request models mirroring the frontend AuditService payloads."""

from typing import Any, Optional
from pydantic import BaseModel


class TokenAuditRecord(BaseModel):
    noteId: str
    tokenId: str
    type: str
    event: str
    dataSource: Optional[str] = None
    fhirResourceId: Optional[str] = None
    fhirResourceVersion: Optional[str] = None
    fetchedAt: Optional[str] = None
    valueAtFirstRender: Optional[Any] = None
    valueAtSigning: Optional[Any] = None
    changedBetweenDraftAndSigning: bool = False
    manuallyOverridden: bool = False
    actor: str
    createdAt: str


class SigningBatch(BaseModel):
    records: list[TokenAuditRecord]


class AckRecord(BaseModel):
    noteId: str
    tokenId: str
    flagReason: str
    acknowledged: bool = True
    actor: str
    createdAt: str
