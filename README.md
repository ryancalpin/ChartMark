# ChartMark

A live, chart-aware clinical note editor. Type `@losartan` and get a dynamic
token showing the current dose and frequency, sourced from the active chart.
Labs trend, vitals resolve, problems link. Every `@mention` is a live data
token that **locks to its value at signing**, producing documentation that is
faster to write, harder to get wrong, and genuinely readable by the next
provider.

> Status: **v1 application** — the complete frontend (all 13 MVP features, all
> 7 token types, design system, audit data model) running against a swappable
> mock-FHIR data layer, plus an optional FastAPI + SQLite audit backend. The
> mock layer is shaped so a real Epic FHIR R4 service drops in behind the same
> `ChartDataService` interface.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Open the note, place your cursor, and type `@`. Try:

- `@lasix` → 💊 Furosemide 80mg IV BID (alias resolves to the canonical drug)
- `@k` → ⬡ Potassium 3.1 mEq/L ↓ (expandable — click for range + sparkline)
- `@bmp` → inserts Potassium, Creatinine, eGFR as separate tokens (panel macro)
- `@bp` → ❤ BP 142/88 (1h ago)
- `@pcn` → ⚠ Penicillin → Anaphylaxis (red allergy pill)
- `@hfref` → ◈ HFrEF, EF 30% (linked — click opens the detail side panel)
- `@nephrology` → linked consult with a hover summary
- `@today` / `@hospitalday` → rolling date tokens that lock at signing

Tab cycles the category filter in the palette; ↑/↓ select, Enter inserts, Esc dismisses.

Twelve seconds after load, the seeded chart updates potassium (3.1 → 3.6) — any
`@k` token in your note **flashes** and updates live, and signing will surface a
"value changed" flag in the pre-sign review drawer.

## Scripts

| Script            | What it does                                          |
|-------------------|-------------------------------------------------------|
| `npm run dev`     | Vite dev server                                       |
| `npm run build`   | Type-check + production build to `dist/`              |
| `npm run typecheck` | `tsc --noEmit` over the app                         |
| `npm run smoke`   | Headless assertions over the load-bearing logic       |

## Architecture

- **React + TypeScript + ProseMirror** (raw, with custom NodeViews).
- Tokens are **inline-atom** ProseMirror nodes; their full state (provenance,
  draft/signed values, lock state) lives in node attrs, so the document is the
  single source of truth and undo/redo/copy carry it.
- Token components are real React, rendered into the editor via the **portal
  pattern** (`TokenPortalProvider`) so they inherit all app contexts.
- Copy-out and print **flatten tokens to clean plain text** (no metadata) via
  the schema's `leafText` + a `clipboardTextSerializer`.
- **Fuse.js** indexes the chart once per note open for the `@` palette.
- Live data, note lifecycle, audit, and UI state live in React contexts; the
  audit trail is write-only and never read back into the UI.

```
src/
  editor/      schema, NodeView + portal registry, plugins (@ trigger, lock), commands (insert/sign/override), serialize
  tokens/      TokenRenderer → Pill | Expandable | Linked, theme, plain-text
  palette/     @ command palette, Fuse search
  panels/      detail side panel, pre-sign review drawer
  data/        ChartDataService (mock now / Epic stub later), AuditService (mock / http)
  fixtures/    seeded John Doe chart + clinical aliases
  store/       Chart / Note / Audit / Ui / Editor contexts
  lib/         staleness, abnormal, dates, fhir mappers, presign triggers, value resolution
audit-service/ optional FastAPI + SQLite provenance backend
```

See `chartmark-design-doc.md` for the full product/design/medicolegal/pitch
document, and `audit-service/README.md` to run the backend.

## Production / Epic path

The demo mocks chart data because there is no Epic FHIR sandbox here. For
production, implement `EpicChartDataService` (stubbed in `src/data/`) against
Epic FHIR R4 via the Hyperspace/App Orchard sanctioned path, reusing the FHIR
mappers in `src/lib/fhir.ts`; back `subscribe` with FHIR R4 Subscriptions plus a
polling fallback. Everything above the `ChartDataService` interface is unchanged.
