# ChartMark Audit Service

Append-only token-provenance trail for medicolegal review. **Never** surfaced
in the provider UI — it exists so that, after the fact, you can prove exactly
what the system showed the provider and when, and whether any token value
changed between first render and signing.

## Run

```bash
cd audit-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then point the frontend at it:

```bash
# in the project root
echo "VITE_USE_REAL_AUDIT=true" >> .env
npm run dev
```

The Vite dev server proxies `/api/audit/*` to `http://localhost:8000`.

## Endpoints

| Method | Path                          | Purpose                                  |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/audit/tokens`           | created / live_change / override events  |
| POST   | `/api/audit/signing`          | batch of per-token records at signing    |
| POST   | `/api/audit/acks`             | pre-sign review acknowledgements         |
| GET    | `/api/audit/notes/{note_id}`  | debug retrieval of a note's full trail   |

There are deliberately **no** update/delete endpoints — the trail is immutable.

When `VITE_USE_REAL_AUDIT` is unset/false (the default), the frontend writes to
an in-browser `MockAuditService` (localStorage key `chartmark.audit`) instead,
so the app runs with zero backend setup.
