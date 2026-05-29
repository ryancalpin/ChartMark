"""
ChartMark audit trail service — append-only token provenance for medicolegal
review. Never read by the provider-facing UI. This is the one genuinely
backend concern in the design: it records exactly what the system showed the
provider and when, plus whether a value changed between first render and signing.

Run:  uvicorn main:app --reload --port 8000
"""

import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import get_connection, init_db
from models import AckRecord, SigningBatch, TokenAuditRecord

app = FastAPI(title="ChartMark Audit Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


def _insert_token(rec: TokenAuditRecord) -> None:
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO token_audit (
                note_id, token_id, type, event, data_source, fhir_resource_id,
                fhir_resource_version, fetched_at, value_at_first_render,
                value_at_signing, changed_between_draft_and_signing,
                manually_overridden, actor, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                rec.noteId,
                rec.tokenId,
                rec.type,
                rec.event,
                rec.dataSource,
                rec.fhirResourceId,
                rec.fhirResourceVersion,
                rec.fetchedAt,
                json.dumps(rec.valueAtFirstRender),
                json.dumps(rec.valueAtSigning),
                int(rec.changedBetweenDraftAndSigning),
                int(rec.manuallyOverridden),
                rec.actor,
                rec.createdAt,
            ),
        )


@app.post("/api/audit/tokens")
def record_token(rec: TokenAuditRecord) -> dict:
    """Created / live_change / override events."""
    _insert_token(rec)
    return {"ok": True}


@app.post("/api/audit/signing")
def record_signing(batch: SigningBatch) -> dict:
    """Batch of per-token records captured at signing."""
    for rec in batch.records:
        _insert_token(rec)
    return {"ok": True, "count": len(batch.records)}


@app.post("/api/audit/acks")
def record_ack(rec: AckRecord) -> dict:
    """Pre-sign review acknowledgements."""
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO ack_audit (note_id, token_id, flag_reason, acknowledged, actor, created_at)
               VALUES (?,?,?,?,?,?)""",
            (rec.noteId, rec.tokenId, rec.flagReason, int(rec.acknowledged), rec.actor, rec.createdAt),
        )
    return {"ok": True}


@app.get("/api/audit/notes/{note_id}")
def get_trail(note_id: str) -> dict:
    """Admin/debug retrieval of a note's provenance trail. Not used by the editor UI."""
    with get_connection() as conn:
        tokens = [dict(r) for r in conn.execute(
            "SELECT * FROM token_audit WHERE note_id = ? ORDER BY id", (note_id,)
        )]
        acks = [dict(r) for r in conn.execute(
            "SELECT * FROM ack_audit WHERE note_id = ? ORDER BY id", (note_id,)
        )]
    return {"noteId": note_id, "tokens": tokens, "acks": acks}
