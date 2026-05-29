# ChartMark — Design Document

**Version 1.0 · May 29, 2026**

-----

## 🧠 Concept Summary

ChartMark is a next-generation clinical note editor that replaces Epic's static text box with a live, chart-aware writing environment. Providers type `@losartan` and get a dynamic pill showing the current dose and frequency — sourced directly from the active medication list. Labs trend. Vitals resolve. Problem lists link. Every `@mention` is a live data token that locks to its value at signing, creating documentation that is simultaneously faster to write, harder to get wrong, and genuinely readable by the next provider. Designed to be pitched to hospital systems and sold to Epic as a native editor upgrade or third-party integration layer.

-----

## 🎯 Problem Statement

Epic's current note editor is a glorified word processor from 2008. Providers copy-paste lab values by hand, misquote medication doses, perpetuate copy-forward notes bloated with outdated data, and spend an average of 4–6 hours per shift on documentation. Every manually transcribed value is a potential error — and Joint Commission and CMS are increasingly scrutinizing the accuracy of what's in the chart. The result: slower care, burned-out clinicians, and documentation that reads like it was written by a different patient's provider. The tools to fix this have existed in knowledge management software (Notion, Roam, Obsidian) for years. No one has brought them to the EHR.

-----

## ✨ Core Features (MVP)

**1. `@mention` Data Tokens**
Type `@` anywhere in the note to open a smart search palette. Resolves to a locked, formatted chip on signing. Different token styles by data type. This is the entire product — everything else supports it.

**2. Adaptive Token Rendering by Data Type**

- **Medications** → Inline colored pill: `💊 Furosemide 80mg IV BID`
- **Labs** → Expandable block: collapses to `K⁺ 3.1 ↓` with click-to-expand showing full result, reference range, and trend sparkline
- **Vitals** → Inline pill: `BP 142/88 (1h ago)`
- **Problem List** → Linked token that opens the problem detail panel
- **Imaging / Procedures** → Expandable block with impression preview
- **Allergies** → Red pill: `⚠ PCN → Anaphylaxis`
- **Consult Recs** → Expandable block with linked note summary

**3. Time-of-Signing Value Lock**
Every token freezes its displayed value at the moment the note is signed. The underlying chart continues to update, but the signed note is a permanent historical artifact. A subtle locked indicator distinguishes signed tokens from live draft tokens.

**4. Live Draft Mode**
While the note is unsigned, all tokens show live chart data with a subtle draft pulse animation. If a value changes while writing, the token updates in real time with a flash — you always know you're documenting the current chart state.

**5. `@` Search Palette**
Notion-style floating command palette triggered by `@`. Searches across all 7 data types simultaneously with real fuzzy search and clinical alias support (`@lasix` finds Furosemide, `@bmp` expands to all BMP components, `@k` finds potassium). Shows category icons, most-recent values, and timestamps in the dropdown before selecting. Tab cycles through category filters.

**6. Token Staleness Indicators**
Tokens drawn >24h ago (acute labs) or >72h (routine labs) desaturate toward grey. The semantic color identity is preserved but muted state is immediately legible as "this data is old." A tooltip on hover shows exact draw time.

**7. Abnormal Value Arrows**
Tokens for abnormal values display directional arrows (`↑`, `↓`, `↑↑`) by default. Disableable at the provider or system level. No color beyond the stale/fresh indicator — just arrows.

**8. Note-to-Note Token Linking**
`@nephrology` pulls in a linked reference to the Nephrology consult note with a one-line summary preview on hover. Directly addresses the "go read the 8-page consult note yourself" problem.

**9. Rolling Date Tokens**
`@today` → `May 29, 2026`. `@yesterday` → `May 28, 2026`. Both lock to a static date at the moment of signing — a rolling date token in a signed note would be a documentation integrity violation. `@admitdate` and `@hospitalday` also available.

**10. Token Change Audit Trail (Backend)**
Every token at signing records: data source, FHIR resource ID, FHIR resource version, timestamp of data fetch, and whether value changed between first render and signing. Never shown to providers — lives in the backend for medicolegal review.

**11. Pre-Sign Token Review Panel**
A non-blocking bottom drawer that surfaces only when there is actually something worth knowing. Silent signing when all tokens are current and unchanged.

**12. Manual Token Override with Audit Flag**
Provider can click a token and type a manual value. The override is flagged in the backend audit trail but allowed. ChartMark cannot block documentation.

**13. Print / PDF Rendering**
Tokens render cleanly in print view — pills and expandable blocks collapse to clean plain text with the locked value. No metadata labels on the printed note; those live in the backend.

-----

## 🔮 Future Features

**AI Layer (Post-MVP)**

- `/draft` — AI drafts the entire Assessment & Plan from chart context
- `/summarize` — Pulls the last 24h of chart data into a one-paragraph narrative
- Smart token suggestions — AI proactively suggests `@` tokens as you type
- AI assist is suggest-only — providers must explicitly accept every AI-generated sentence in Assessment/Plan

**Collaboration**

- Co-signing with live token visibility for supervising attendings
- Comment threads on specific tokens
- Token diff view between prior note version and current

**Analytics & Pitch Metrics**

- Time-to-sign dashboard (per provider, per note type)
- Token accuracy report (manually overridden tokens = documentation errors averted)
- Copy-forward detection and scoring

**Smart Templates**

- Note templates with pre-wired `@` slots: "HF Admission Note" with `@BNP`, `@weight`, `@furosemide` already wired in
- Department-specific token libraries (Cardiology, ICU, General Medicine)

**Interoperability**

- FHIR R4 export of token-linked notes
- CDS Hooks integration for real-time decision support embedded in token context

-----

## 🗺️ UX Flow

### Primary Flow — Writing a Note with Tokens

1. Provider opens a new progress note. ChartMark editor loads — clean canvas, familiar formatting toolbar, section headers auto-populated from note template.
2. Typing begins. Provider writes "Patient is a 67 y/o male with" — then types `@hf` — the `@` palette fires instantly.
3. **`@` Palette appears** — floating below the cursor. Fuzzy-matches "hf" to show:
   - `◈ HFrEF, EF 35%` — Active, onset 2019
   - `◈ ADHF` — This admission
   Provider selects HFrEF → linked token inserted: `[◈ HFrEF, EF 35%]`
4. Provider continues: "admitted for ADHF. Today's BNP is" → types `@bnp`
   - Palette shows: `⬡ BNP — 4,820 pg/mL ↑↑ · Today 06:14`
   → Expandable lab token inserted: `[⬡ BNP 4,820 pg/mL ↑↑]` — click expands to full result with 7-day sparkline.
5. Provider types `@lasix` → alias resolves to Furosemide → `[💊 Furosemide 80mg IV BID]`
6. All tokens glow subtly in draft mode. If the Lasix order changes while note is open, the token flashes and updates.
7. Provider hits **Sign**. If zero review triggers: note signs immediately, all tokens lock.
8. Downstream provider reads the note. Every token is scannable without hunting other chart sections. Hovering a locked token shows: "Value at signing: 4,820 pg/mL — Current value: 2,104 pg/mL."

### Secondary Flows

- **Empty `@` palette** (no match): offers "Search all chart data" with broader scope
- **Token conflict** (ordered med discontinued before signing): token highlights in yellow — "This medication was discontinued. Update or remove token before signing."
- **Template flow**: provider picks "HF Admission Note" — loads with pre-wired token slots waiting to be resolved
- **Manual override**: click any token → inline edit → overridden value shown with subtle flag; logged in audit trail

-----

## 🏗️ Technical Architecture

### Demo Prototype Stack

| Layer            | Choice                              | Why                                                                   |
|------------------|-------------------------------------|-----------------------------------------------------------------------|
| Frontend         | React + TypeScript                  | Component ecosystem, ProseMirror integration                          |
| Rich Text Engine | ProseMirror                         | Industry standard for custom editor nodes — used by Notion, Atlassian |
| Token Rendering  | Custom ProseMirror NodeViews        | Each token type is its own React component embedded in the editor     |
| Fuzzy Search     | Fuse.js (client-side)               | Pre-fetched index on note open — no API call per keystroke            |
| Mock Data Layer  | JSON fixtures + React context       | Simulates FHIR R4 responses — swap for real API in production         |
| Styling          | Tailwind CSS + custom design tokens | Fast, consistent, component-level                                     |
| Demo Hosting     | Vercel                              | Instant deploy, shareable URL for pitches                             |

### Production Epic Architecture

| Layer             | Choice                                  | Why                                                      |
|-------------------|-----------------------------------------|----------------------------------------------------------|
| Integration       | Epic FHIR R4 API + Hyperspace SDK       | Only sanctioned path into Epic data                      |
| Auth              | OAuth 2.0 via Epic MyApps / App Orchard | Required for Epic certification                          |
| Token Data        | CDS Hooks + FHIR resource subscriptions | Live data + real-time updates                            |
| Editor Embed      | Epic Hyperdrive (Hyperspace web layer)  | Modern Epic runs in Chromium — inject as a web component |
| Backend           | FastAPI on Azure/AWS (HIPAA-compliant)  | Token metadata, audit trail, analytics                   |
| Database          | PostgreSQL (encrypted, HIPAA BAA)       | Token lock records, audit events                         |
| AI Layer          | Azure OpenAI (HIPAA-eligible)           | Required for healthcare; not standard OpenAI             |
| Real-time updates | FHIR R4 Subscriptions + polling fallback| Subscriptions not universally enabled — fallback required|

### Data Model Sketch

```
Patient
  └── Chart
        ├── Medications[]     → MedToken { drugName, dose, freq, orderId, status }
        ├── Labs[]            → LabToken { name, value, unit, refRange, trend[], resultId, drawnAt }
        ├── Vitals[]          → VitalToken { type, value, unit, timestamp }
        ├── ProblemList[]     → ProblemToken { name, icdCode, onset, status }
        ├── Imaging[]         → ImagingToken { modality, date, impression, reportId }
        ├── Allergies[]       → AllergyToken { allergen, reaction, severity }
        └── Consults[]        → ConsultToken { service, date, noteId, summary }

Note
  ├── status: draft | signed
  ├── signedAt: timestamp
  ├── signedBy: providerId
  ├── content: ProseMirror JSON doc
  └── tokens[]: TokenSnapshot {
        tokenId, type,
        draftValue, signedValue,
        fhirResourceId, fhirResourceVersion,
        fetchedAt, changedBetweenDraftAndSigning: bool,
        manuallyOverridden: bool
      }
```

### API / Integration Surface

- **Epic FHIR R4** — MedicationRequest, Observation, Condition, DiagnosticReport, AllergyIntolerance, DocumentReference
- **Epic CDS Hooks** — `patient-view` hook fires on note open, pre-fetches all token data
- **FHIR Subscriptions (R4B/R5)** — Real-time push when medication orders change during active draft; polling fallback for instances without subscriptions
- **Azure OpenAI** — AI draft and suggest features (post-MVP)

-----

## 🎨 Design System

### Token Color Semantics

| Type                 | Color              | Background | Use                            |
|----------------------|--------------------|------------|--------------------------------|
| Medication           | `#1A5C9E` blue     | `#EBF2FB`  | All active med orders          |
| Lab — Normal         | `#1A7A4A` green    | `#EAF5EF`  | In-range results               |
| Lab — High           | `#9E1A1A` red      | `#FBEBEB`  | Above reference range          |
| Lab — Low            | `#1A5C9E` blue     | `#EBF2FB`  | Below reference range          |
| Vitals               | `#6B35A8` purple   | `#F3EDF9`  | All vital signs                |
| Problem List         | `#9E5C1A` amber    | `#FBF2EB`  | Active diagnoses               |
| Allergy              | `#9E1A1A` red      | `#FBEBEB`  | All allergies (bold weight)    |
| Consult              | `#2D5A8A` slate    | `#EBF0F7`  | Consult notes and recs         |
| Date                 | `#5A5550` charcoal | `#F0EFED`  | Date tokens                    |
| **Stale (any type)** | `#A09C94` grey     | `#F2F0EB`  | Any token >staleness threshold |

### Staleness Thresholds

| Data Type                            | Stale After                    |
|--------------------------------------|--------------------------------|
| Acute labs (BMP, BNP, CBC, troponin) | 24 hours                       |
| Routine labs (lipids, HbA1c, etc.)   | 72 hours                       |
| Vitals                               | 4 hours                        |
| Medications                          | Never (order status is binary) |
| Problem list                         | Never (always current)         |

### Token Rendering by Type

- **Pill** (meds, vitals, allergies, dates, problems): single-line, icon + text, optional arrow
- **Expandable block** (labs, imaging, consult recs): collapses to one line, click to expand full result with trend sparkline
- **Linked token** (problem list, consults): opens detail sidebar panel on click

### Typography

- Body: DM Sans (400, 500, 600)
- Monospace values: DM Mono (400, 500)
- Note titles: Playfair Display (600)

-----

## 🔔 Pre-Sign Token Review Panel

**Philosophy: earn the provider's attention by only asking for it when it matters.**

### Triggers (show the panel)

| Condition                                | Threshold                     |
|------------------------------------------|-------------------------------|
| Token value changed since note opened    | Any change                    |
| Stale lab token in note                  | >24h (acute) / >72h (routine) |
| Stale vital token in note                | >4h                           |
| Medication token with discontinued order | Any                           |
| Unresolved token (`[@x — unavailable]`)  | Any                           |

### Does NOT trigger for

- Values that are current and unchanged
- Normal vs. abnormal status (arrows handle that inline)
- Clinically appropriate old values (e.g. prior echo result) — staleness thresholds configurable per institution

### Panel Behavior

- Appears as a **bottom drawer** — non-blocking, note still visible
- Lists only flagged tokens, one line each with Acknowledge button
- Acknowledged = logged in audit trail, signing proceeds
- Zero triggers = panel never appears, note signs immediately
- No wall of text. No color-coded severity. No mandatory free-text justification.
- Lock at **first signature by anyone with signing authority** — not attending cosign

-----

## ⚖️ Medicolegal Framework

### Core Problem

ChartMark creates a system where a data source populates a legal medical record automatically. If a token shows the wrong value, the question becomes: was it the provider's error, the system's error, or Epic's FHIR data error? This ambiguity is the liability exposure.

### Required Safeguards

**A — Token Provenance Metadata (backend only)**
Every token at signing records: data source, FHIR resource ID, FHIR resource version, timestamp of data fetch, value at first render, value at signing. Legal defense — proof of exactly what the system showed the provider and when.

**B — Pre-Sign Token Review Panel**
Catches grossly wrong or stale items before signing. Designed to minimize alert fatigue — fires only for values that changed or are stale, not for normal/abnormal status.

**C — Plain UI Language**
Note footer: *"Dynamic tokens reflect chart data at the time of signing. Review your note before signing."* Same standard of care as reviewing any note before signing.

**D — No Auto-Population of Assessment/Plan**
AI draft feature (post-MVP) suggests but never silently inserts into Assessment or Plan. Providers must explicitly accept every AI-generated sentence in clinical reasoning sections. HPI and objective data sections — token insertion is fine.

**E — Amendment Workflow**
Re-opening a signed note creates a formal addendum with timestamp and reason — not in-place editing. Required for CMS/Joint Commission compliance.

**F — Formal Review Before Go-Live**
Before any real patient data: healthcare attorney review, institution Risk Management sign-off, CMIO/Clinical Informatics approval. At Wake Forest Baptist, framed as a QI initiative.

-----

## 🚩 Missing Features vs. Dot Phrases

**Does dot phrase functionality already cover templates?**
Yes, largely. Epic dot phrases (`.hfplan`, `.ros`) already do structural template insertion. ChartMark's differentiation: **token slots inside templates** — a dot phrase drops in static text you fill manually vs. a ChartMark template that drops in live-wired `@` slots that auto-populate from the chart. Frame in pitch as: *"Dot phrases, but the values pull from the chart instead of being placeholders."*

**Additional features beyond MVP that matter:**

- Token disambiguation UI for same-name items (multiple K+ draws with timestamps)
- `@today` / `@yesterday` rolling dates that lock at signing
- Note-to-note linking (`@nephrologynote` → linked reference with hover summary)
- Cosignature token inheritance (tokens stay live until signing authority signs)
- Offline degraded mode (tokens show `[data unavailable]` gracefully, never block signing)
- Manual override with audit flag
- Print/PDF rendering (tokens collapse to clean plain text, no metadata)

-----

## ⚠️ Risks & Gotchas

### 🔴 Critical

**Epic's competitive posture**
Epic may decline or slow-walk App Orchard certification for a feature they plan to build natively. The play: get to pilot adoption fast, or position for acquisition before Epic announces "Smart Notes 2.0."

**FHIR R4 in Epic is non-standard**
Epic's implementation has Epic-specific extensions, non-standard status codes, and pagination quirks. MedicationRequest in particular requires significant normalization work. Budget for this.

**FHIR Subscriptions not universally available**
Real-time push updates require Epic to have this feature enabled. Many hospital instances are 1–3 versions behind. Polling fallback is required — the live-update draft feature will silently not work at some sites without it.

**Medicolegal exposure from token lock mechanism**
A locked token that was wrong at signing creates a documentation error baked into the legal record with a data source attribution. Worse than a manual typo because it implies institutional validation. Requires legal review and robust conflict-warning UX before go-live.

### 🟡 Significant

**Copy-paste destroys token integrity**
Copying a ChartMark note to a plain text area orphans all tokens. Serialize tokens to formatted plain text on copy. Clear UI policy: "Copying this note will flatten all dynamic tokens to their current values."

**`@` palette performance at scale**
A complex patient with 40 meds + 200 labs + 15 problems = 300+ searchable items. Requires client-side indexing (Fuse.js) pre-fetched at note open — not a live API call per keystroke.

**Role-aware token filtering**
Nursing notes have different scope-of-practice constraints than provider notes. Token system needs role-aware filtering — this is a compliance issue if ignored.

**Amendment workflow complexity**
CMS and Joint Commission require amendments to signed notes to be clearly marked as addenda with timestamp and reason. In-place editing of a signed note is non-compliant.

**Lab name normalization per institution**
"BNP" at Wake Forest Baptist may be "NT-proBNP" at Duke with a different LOINC code. Per-customer LOINC/RxNorm mapping is a configuration cost at each deployment.

### 🟢 Manageable

**Browser rendering differences in Hyperdrive** — Epic's Chromium version lags; test ProseMirror NodeViews on it specifically.

**Provider training curve** — The `@` paradigm is intuitive for Slack/Notion users. Beachhead with one progressive cardiology group (Wake Forest Baptist Cardiology is ideal).

**ProseMirror NodeView complexity** — Signed/locked state transitions, undo/redo with tokens, and copy-paste handling are the hardest engineering problems. Not blockers, just real work.

-----

## 💸 Monetization

**Primary: Enterprise SaaS — per-provider/per-year seat licensing**

- ~$300–600/provider/year (consistent with Epic orbit tooling)
- 500-provider hospital = $150K–$300K ARR per customer

**Exit paths:**

- **Sell to Epic directly** — Epic has acquired several App Orchard partners when a feature became strategic. A high-adoption note tool is exactly that.
- **Sell to clinical documentation company** — Nuance (Microsoft), MModal, Iodine Software are active acquirers in this space
- **License the token engine** — Sell the ProseMirror + FHIR token library to other EHR vendors (Oracle Cerner, Meditech, Athena)

-----

## 🚀 Build Sequence

### Phase 1 — Demo (2–3 weeks)

- React + ProseMirror editor scaffold
- `@` palette with fuzzy search (Fuse.js) over JSON mock chart data
- Three working token types: Medication pill, Lab expandable, Vital pill
- Sign note → all tokens lock with visual transition
- Fake patient "John Doe, 67M, HFrEF/CKD IV/AFib" pre-loaded with realistic chart
- Deployed to Vercel with shareable URL

### Phase 2 — Pitch-Ready Demo (weeks 4–6)

- All 7 token types implemented
- Pre-sign token review panel (bottom drawer)
- Token change conflict warning
- Hover states, locked state transitions, sparkline trends on lab tokens
- Disambiguation UI for same-name items (multiple draw times)
- Mobile-responsive for tablet demo at conferences
- Recorded walkthrough video + one-page pitch leave-behind

### Phase 3 — Real Integration (months 3–9)

- Epic FHIR R4 sandbox connection (Epic on FHIR developer program)
- App Orchard application
- HIPAA infrastructure (Azure HITRUST, BAA)
- Pilot at one department (Cardiology at Wake Forest Baptist)
- Time-motion study data collection — this becomes the anchor of the pitch deck

-----

## 🗓️ Pitch Strategy

**Beachhead:** Inpatient Cardiology at Atrium Health Wake Forest Baptist. Existing CMIO relationship, author is practicing AGACNP in the target department, domain expertise in HF documentation.

**Pilot framing:** QI initiative — "reducing documentation errors in heart failure admissions." This framing gets through Clinical Informatics and Risk Management without requiring full App Orchard certification for internal use.

**Data to collect during pilot:**

- Time-to-sign (before vs. after ChartMark)
- Token override rate (proxy for documentation accuracy)
- Provider satisfaction survey (NPS-style)
- Copy-forward rate reduction

**Pitch deck core argument:**

1. The problem: providers spend 4–6h/shift on documentation; copy-forward notes are a patient safety issue
2. The solution: `@mention` tokens that pull live chart data
3. The demo: John Doe progress note, live in the room
4. The data: time-motion study results from the pilot
5. The market: 400,000+ Epic-credentialed providers in the US
6. The ask: partnership, investment, or acquisition discussion

-----

## 🔗 Related / Inspiration

- **Notion `@mentions`** — The exact mental model. Dynamic page links, date tokens, person mentions. ChartMark is "Notion for the chart."
- **Roam Research block references** — Bidirectional linking mental model for clinical concepts
- **Nuance DAX** — Ambient documentation, different approach (voice → note), same underlying problem. Acquired by Microsoft for $1.9B — the market is validated.
- **Epic SmartText / SmartLinks** — Epic's existing (weak) version. Static template insertion, no live data binding. ChartMark is what SmartLinks should have become.
- **Caduceus (Ryan's own work)** — The HMAC-signed FastAPI bridge pattern built for Hermes is directly reusable for the ChartMark token audit backend. Same shape: real-time data, signed records, SQLite persistence for audit events.

-----

## 📁 Implementation Notes

This repository contains the **v1 application** implementing the MVP feature set
against a swappable mock-FHIR data layer (see `README.md` for the architecture
and `audit-service/README.md` for the provenance backend). The original static
HTML mockups (`chartmark-ui.html`, `chartmark-palette.html`) referenced in early
design sessions are superseded by the live React + ProseMirror app.

-----

*Built with ChartMark design session · Ryan Calpin, MSN AGACNP-BC · May 29, 2026*
