# AutomationFinder — Architecture Overview

## What It Is

AutomationFinder is a **FinOps automation readiness assessor**. It takes an organization through a structured 4-step survey, scores each FinOps process against the org's specific context and readiness, and produces a prioritized automation roadmap — including AI-generated implementation plans, tool recommendations, and cost estimates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + React Router 6 |
| Styling | Tailwind CSS v4 (zero-config, via `@tailwindcss/vite`) |
| Build | Vite 6 |
| State | React Context API (no external store) |
| AI | Groq API — `llama-3.3-70b-versatile` (primary) |
| Document parsing | `pdfjs-dist` (PDF), `mammoth` (DOCX), native `FileReader` (TXT) |
| Hosting | Static SPA — deployable to Firebase, Vercel, etc. |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │Screen 1  │→ │Screen 2  │→ │Screen 3  │→ │Screen 4   │  │
│  │Org Setup │  │Processes │  │Readiness │  │Results    │  │
│  └──────────┘  └─────┬────┘  └─────┬────┘  └───────────┘  │
│                      │             │                        │
│              ┌───────▼─────────────▼───────┐               │
│              │      AppContext (state)      │               │
│              │  orgContext, processAnswers, │               │
│              │  readinessAnswers, scored    │               │
│              │  Results, summary            │               │
│              └───────────────┬─────────────┘               │
│                              │                              │
│              ┌───────────────▼─────────────┐               │
│              │        scoringEngine.js      │               │
│              │   normalize → score →        │               │
│              │   tier → sort               │               │
│              └─────────────────────────────┘               │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
                 ┌────────────▼────────────┐
                 │      Groq API           │
                 │  llama-3.3-70b-versatile│
                 │                         │
                 │  • parseDocument()      │
                 │  • generateSummary()    │
                 └─────────────────────────┘
```

---

## User Journey & Screen Flow

```
Screen 1 — Org Context
  6 questions: industry, size, cloud platform, pain point, risk tolerance
  → stored as orgContext{}
        ↓
Screen 2 — Process Survey
  12 FinOps processes (from processLibrary.json)
  User selects relevant ones, rates each on 5 dimensions (1–3 scale)
  Optional: upload PDF/DOCX → AI auto-fills selections + scores
        ↓
Screen 3 — Readiness Check
  4 org readiness dimensions (1–3 scale):
  data availability, process maturity, tooling, compliance strictness
  → triggers scoreAll() + async generateSummary()
        ↓
Screen 4 — Results
  ├── Opportunity Matrix (SVG scatter plot)
  ├── Executive Summary (AI-generated)
  ├── Prioritized Roadmap (table)
  └── Action Plan (expandable cards with phases, tools, costs)
```

---

## Data Layer

### `processLibrary.json` — 12 FinOps Processes

Each process has a fixed risk level and effort size baked in:

| Process | Effort | Risk |
|---|---|---|
| Cost Allocation & Tagging | M | Low |
| Spend Anomaly Detection | M | Low |
| Budget Alerting | S | Low |
| Invoice Reconciliation | S | Medium |
| Showback & Chargeback | M | Low |
| Cost Forecasting | M | Low |
| Idle Resource Cleanup | M | Medium |
| Resource Rightsizing | L | Medium |
| Unit Economics Reporting | L | Low |
| Vendor Negotiation Support | L | Low |
| Policy Enforcement | L | High |
| Commitment Management | L | High |

### `scoringConfig.json` — All Weights & Thresholds

```
Value weights (what makes a process worth automating):
  frequency        25%   How often it runs
  rule_clarity     25%   How well-defined the logic is
  volume           20%   How many transactions per run
  error_cost       15%   Cost of a mistake
  input_consistency 15%  How consistent the inputs are

Readiness weights (is the org able to automate it):
  data_availability  30%  Is billing data accessible & clean?
  process_maturity   25%  Is the process documented?
  tooling            25%  Do existing tools support automation?
  risk_compliance    20%  How strict is the regulatory environment?
                          (inverted — high compliance = lower readiness)

Effort modifiers:
  S (small)  ×1.15  (feasibility boost for low-complexity work)
  M (medium) ×1.00
  L (large)  ×0.80  (feasibility penalty for large implementations)

Risk penalty (applied when process risk exceeds org's risk tolerance):
  medium risk process → −0.05
  high risk process   → −0.15

Tier thresholds:
  Quick Win  priority ≥ 0.65  AND  readiness ≥ 0.55
  Plan Now   priority ≥ 0.45
  Backlog    everything else
```

---

## Scoring Engine (`scoringEngine.js`)

Every dimension answer (1–3) is normalized to 0–1 before weighting:

```
normalize(val) = (val − 1) / (3 − 1)
```

Then for each selected process:

```
valueScore     = Σ (normalize(dimension) × value_weight)
readinessScore = Σ (normalize(readiness_dim) × readiness_weight)
                   note: risk_compliance is inverted before normalizing

feasibility    = readinessScore × effortModifier[process.effort]

riskMod        = risk_penalty[process.risk_level]
                 (only applied if process risk > org's risk tolerance)

priorityScore  = (valueScore × 0.5 + feasibility × 0.5) − riskMod

tier           = assignTier(priorityScore, readinessScore)
```

Results are sorted descending by `priorityScore`. All scoring is **deterministic and runs client-side** — no network call needed.

---

## AI Integration (`aiClient.js`)

The app makes two distinct AI calls, both to the Groq API:

### 1. `parseDocument(extractedText, processLibrary)`
**When:** User uploads a PDF, DOCX, or TXT on Screen 2.

The model reads up to 4,000 characters of document text and maps content to the 12 FinOps processes. It returns dimension scores (1–3) with a confidence level (`high` = explicitly mentioned, `inferred` = implied). These pre-fill the survey; users can edit any prefilled value.

### 2. `generateSummary(scoredResults, orgContext)`
**When:** User submits Screen 3. Runs async while Screen 4 loads.

The model receives the full org profile and all scored processes, then returns structured JSON covering:
- 2–3 sentence executive summary
- Per-process: industry standards, 3–5 recommended tools (with license type), implementation cost estimate, phased action steps, success metrics
- Readiness recommendations

**Reliability:** `callGroq()` includes 2 retries, a 20-second timeout, and a `Retry-After`-aware 429 handler. If all retries fail, `buildFallbackSummary()` generates a rule-based summary from the scored data with generic defaults — the UI is always populated.

---

## State Management

A single React Context (`AppContext`) holds all app state. No external store.

```
AppContext {
  step                  1–4, controls which screen renders
  orgContext            { industry, size, platform, pain_point, risk_tolerance, ... }
  selectedProcesses     string[]  — process IDs the user checked
  processAnswers        { [processId]: { frequency, volume, rule_clarity, ... } }
  readinessAnswers      { data_availability, process_maturity, tooling, risk_compliance }
  scoredResults         ScoredProcess[]  — output of scoreAll()
  summary               AI summary object | null
  summaryLoading        boolean
}
```

State is never persisted to localStorage — a page refresh starts over. The "Start over" button on Screen 4 resets all slices back to their initial values.

---

## Component Map

```
App.jsx
└── AppProvider (context)
    └── Screen router (step 1–4)
        ├── Screen1Context      ← RadioGroup ×6
        ├── Screen2Processes    ← ProcessCard ×12  (+ document upload)
        ├── Screen3Readiness    ← RadioGroup ×4
        └── Screen4Results
            ├── ProgressBar
            ├── ScoreMatrix     ← SVG scatter plot (value vs. readiness)
            ├── SummaryCard     ← AI executive summary + recommendations
            ├── RoadmapTable    ← Grouped table by tier
            └── ActionPlan      ← Expandable cards per process
                                   industry standards
                                   recommended tools (license-badged)
                                   cost estimate (impl + licensing)
                                   phased action steps
                                   success metrics
```

---

## Connected Mode: Plugging Into Real Client Environments

### What would change

The POC collects dimension scores through a manual survey — humans estimate frequency, volume, rule clarity, etc. on a 1–3 scale. In a production version connected to a real client environment, those estimates are replaced by **signals pulled directly from cloud APIs and billing data**. The scoring engine, AI layer, tier thresholds, and output format are completely unchanged. Only the data collection layer is different.

The manual survey becomes a fallback and override layer, not the primary input.

---

### Where the signals come from

Each of the 9 scored dimensions maps to concrete, queryable data that already exists in every cloud environment:

#### Value dimensions (per FinOps process)

| Dimension | Signal source | How it's scored |
|---|---|---|
| **Frequency** | CloudTrail / Azure Activity Logs / GCP Audit Logs | Count how often the related operation was performed manually per month. Low (<4×) → 1, moderate → 2, high (daily+) → 3 |
| **Volume** | Cost & Usage Report (CUR), Azure Cost Export, BigQuery billing | Count of cost line items, resources, or transactions per run. Thresholded to 1/2/3 based on percentile across all processes |
| **Rule clarity** | Proxy signals: tag coverage rate, existence of IaC templates (Terraform/CFN), presence of runbooks in linked ticketing system | High coverage + IaC present → 3, partial → 2, ad hoc → 1 |
| **Error cost** | Historical anomaly detection results, support/incident ticket volume, cost variance reports | High variance or frequent incidents → 3, occasional → 2, stable → 1 |
| **Input consistency** | Tag schema completeness, billing export field null rates, CUR consistency across months | >90% complete and consistent → 3, partial → 2, fragmented → 1 |

#### Readiness dimensions (org-wide)

| Dimension | Signal source | How it's scored |
|---|---|---|
| **Data availability** | Does a CUR/billing export exist? Is it in a queryable store (S3, BigQuery, Synapse)? What is the overall tag coverage rate? | Automated pipelines to warehouse → 3, some exports → 2, spreadsheets only → 1 |
| **Process maturity** | Presence of existing automation artifacts: Lambda functions, Azure Functions, Terraform modules, scheduled jobs, runbooks in Confluence/ServiceNow | Documented + partially automated → 3, documented only → 2, ad hoc → 1 |
| **Tooling** | Detect installed FinOps platforms via API (Apptio, CloudHealth, native Cost Management), check for IaC state files, tagging enforcement policies | Full platform + IaC → 3, native tools only → 2, spreadsheets → 1 |
| **Risk/compliance** | AWS Config rules enabled, Azure Policy assignments, active SOC2/PCI/HIPAA compliance frameworks detected, GuardDuty/Defender status | Flexible/no frameworks → 1 (high readiness), standard → 2, strict/regulated → 3 (low readiness — inverted as today) |

---

### Architecture with connected adapters

```
┌──────────────────────────────────────────────────────────┐
│               AutomationFinder (browser)                 │
│                                                          │
│  Screen 1: Org Setup  →  Screen 2: Processes             │
│                           [Connect environment]          │
│                           ↓ auto-populated dimensions    │
│  Screen 3: Readiness  →  Screen 4: Results               │
│            ↓ auto-populated                              │
└──────────────────────┬───────────────────────────────────┘
                       │  HTTPS
        ┌──────────────▼──────────────────────┐
        │        Connector API (new)           │
        │  - Credential / token management     │
        │  - Per-cloud adapter registry        │
        │  - Signal extraction engine          │
        │  - Normalizes signals → 1/2/3 scores │
        └────────┬──────────────┬─────────────┘
                 │              │
   ┌─────────────▼──┐    ┌──────▼──────────────┐    ┌──────────────────┐
   │   AWS Adapter  │    │   Azure Adapter      │    │   GCP Adapter    │
   │                │    │                      │    │                  │
   │ Cost Explorer  │    │ Cost Management API  │    │ Billing Export   │
   │ CUR (S3)       │    │ Resource Graph       │    │ (BigQuery)       │
   │ CloudTrail     │    │ Activity Logs        │    │ Asset Inventory  │
   │ Config         │    │ Azure Policy         │    │ Cloud Audit Logs │
   │ Trusted Advisor│    │ Advisor              │    │ Recommender API  │
   └────────────────┘    └──────────────────────┘    └──────────────────┘
```

---

### What the connector API does

The connector API is a thin backend (a few serverless functions would suffice) that sits between the browser and the cloud provider APIs. It handles three things:

**1. Authentication**
- **AWS:** The client creates a read-only IAM role with a trust policy allowing the connector to assume it (`sts:AssumeRole`). No long-lived credentials are stored — the connector gets a temporary session token per assessment.
- **Azure:** The client registers an app in their Entra ID tenant, grants it the `Cost Management Reader` and `Reader` roles, and passes the client ID + secret. OAuth 2.0 client credentials flow.
- **GCP:** Service account with `Billing Account Viewer` and `Cloud Asset Viewer` roles; JSON key file uploaded.

All credentials are used per-session and never persisted.

**2. Signal queries**
Each adapter runs a fixed set of read-only API queries — no writes, no mutations. Examples:
```
AWS:
  GET /costexplorer → GetCostAndUsage (last 90 days, grouped by service + tag)
  GET /cloudtrail   → LookupEvents (manual cost operations, last 30 days)
  GET /config       → DescribeComplianceByResource (tag compliance rate)
  GET /trustedadvisor → GetChecks (rightsizing, idle resources, reserved coverage)

Azure:
  GET /providers/Microsoft.CostManagement/query → usage last 90 days
  GET /providers/Microsoft.ResourceGraph/resources → resource inventory + tags
  GET /providers/microsoft.insights/activitylogs → manual operations last 30 days
  GET /providers/Microsoft.PolicyInsights/policyStates → compliance state
```

**3. Signal → score normalization**
Raw API values (counts, percentages, dollar amounts) are converted to 1/2/3 scores using thresholds derived from the client's own data distribution — relative to their own environment, not absolute industry benchmarks. This avoids penalizing small orgs for low absolute volume.

---

### What the user experience looks like

Screen 2 gains a "Connect your environment" step before the manual survey:

```
┌─────────────────────────────────────────────────┐
│  Connect your cloud environment (optional)       │
│                                                  │
│  ○ AWS   ○ Azure   ○ GCP   ○ Skip — manual entry │
│                                                  │
│  [Connect] → OAuth flow or role ARN entry        │
└─────────────────────────────────────────────────┘
```

After a successful connection, the 12 FinOps processes are pre-evaluated. Detected processes are auto-selected with dimension scores populated and confidence indicators (same pattern as the existing AI document upload flow). Users can still override any score before proceeding.

Screen 3 readiness dimensions auto-populate the same way, with a "why this score" tooltip explaining which signal drove the value.

---

### What stays exactly the same

| Component | Change required |
|---|---|
| `scoringEngine.js` | None — consumes the same 1/2/3 scores regardless of source |
| `aiClient.js` | None — receives the same `scoredResults` and `orgContext` |
| Screen 4 output | None — matrix, roadmap, and action plan are unchanged |
| Tier thresholds | None |
| Process library | None — same 12 processes |

The scoring engine's transparency is an advantage here: you can show a client exactly which API call produced a score of 2 for "data availability" and why.

---

### Minimum viable integration path

For a first real engagement without building a full multi-cloud connector:

1. **Ask the client to run a read-only data export** — AWS CUR to S3, Azure billing CSV, GCP BigQuery export. Upload to the tool instead of a live connection. Avoids credential management entirely for the POC.
2. **Parse the export** — extend the existing `parseDocument()` flow to handle structured billing CSVs, deriving frequency/volume/tag coverage signals directly.
3. **Keep the survey for dimensions that can't be inferred from billing data** — rule clarity and process maturity still need human input; billing data alone can't tell you whether a process is well-documented.

This gives you 60–70% of the signal value with zero backend infrastructure, and it's achievable before a live demo.

---

## Scoring Engine Design Rationale

### The core question the engine answers

Every process gets rated on two independent axes: **how much value would automation deliver?** and **is this org actually ready to do it?** These are deliberately separate. A process can be extremely valuable to automate but the org has no clean data to feed it — that's not a Quick Win, it's a future investment. Conflating the two produces misleading rankings.

The Priority Score combines both axes equally (50/50) and then penalizes for risk misalignment. The tier a process lands in depends on where it sits in both dimensions, not just overall score.

---

### Why these five value dimensions?

The five dimensions are the smallest set that captures all three sources of automation ROI: **time saved**, **error reduction**, and **feasibility of encoding the logic**.

**Frequency (25%)** — The most direct driver of time savings. A process that runs daily at 30 minutes of manual work saves ~130 hours/year at automation. One that runs quarterly saves 2 hours. Frequency is the multiplier on everything else, so it shares the top weight alongside rule clarity.

**Rule clarity (25%)** — The single most critical filter for *whether* a process can actually be automated. If the logic can't be written down as a set of conditions and actions, it can't be encoded — you'd be automating judgment, not work. Rule clarity is weighted equally to frequency because a high-frequency process with murky logic is a risk, not an opportunity.

**Volume (20%)** — Distinct from frequency: a process might run once a month but process 50,000 line items. High volume creates both scale benefit (automation handles the bulk) and error surface (more rows = more chances for a mistake). Weighted slightly below frequency and rule clarity because volume without rule clarity still produces an unusable automation.

**Error cost (15%)** — The cost of a mistake in the manual process. This matters in two ways: it justifies automation as an error-reduction measure, and it signals where manual review steps are adding latency today. Lower weight because it's more of a tiebreaker — high error cost reinforces the case for an already strong candidate rather than elevating a weak one.

**Input consistency (15%)** — Automation requires predictable inputs. Consistent data formats, reliable data sources, and stable schemas keep exception rates low. Inconsistent inputs don't prevent automation but they do increase the ongoing maintenance burden. Weighted equally to error cost as a secondary consideration.

> What's intentionally excluded: team buy-in, executive sponsorship, vendor support. These are real-world factors but they're organizational readiness signals, not process value signals. Mixing them into the value score would make value depend on politics rather than on the process itself.

---

### Why these four readiness dimensions?

Readiness captures the org's current ability to support automation. These four were chosen because together they cover the three ways an automation project fails: **no data to automate against**, **no documented process to encode**, and **no path to deploy and maintain it**.

**Data availability (30% — highest weight)** — FinOps automation is data-dependent by definition. If billing exports are fragmented across spreadsheets, if tagging is inconsistent, if there's no central data store — no amount of engineering talent makes the automation work. This is a hard prerequisite, so it carries the highest readiness weight. A score of 1 here (fragmented/manual) is effectively a blocker regardless of the other dimensions.

**Process maturity (25%)** — Automating an undocumented process doesn't eliminate the chaos, it just runs the chaos at machine speed. A well-documented, consistently followed process can be encoded; an ad-hoc one cannot. Process maturity determines whether there's anything concrete to build.

**Tooling (25%)** — Existing platforms (FinOps tools, IaC pipelines, monitoring infrastructure) dramatically reduce the cost and risk of automation. Building on top of Terraform or an existing FinOps platform is a very different project than building from scratch. Tooling maturity is weighted equally to process maturity because it affects cost, not just feasibility.

**Risk/compliance (20%, inverted)** — This dimension is scored in reverse: higher compliance strictness lowers readiness. Heavily regulated environments add change control, approval gates, and audit trails that increase implementation effort and timeline. It doesn't mean don't automate — it means the readiness bar is higher and the plan needs to account for it. Weighted slightly lower than the others because compliance affects pace, not viability.

---

### Why a 1–3 scale instead of 1–5 or 1–10?

A 3-point scale was chosen deliberately for two reasons.

First, **forced signal**. A 5-point scale invites people to anchor in the middle and give everything a 3. With only three options, each answer requires a genuine judgment: low, medium, or high. The descriptions on each option (e.g., "fragmented and manual" vs. "some automation" vs. "fully automated pipelines") make the choices concrete rather than abstract.

Second, **survey fatigue**. The process survey asks respondents to rate up to 12 processes across 5 dimensions — that's up to 60 individual answers. A 3-point scale keeps each decision fast. The marginal information from 5 points isn't worth doubling the cognitive load.

---

### Why these specific weights?

The weights reflect the relative diagnostic power of each dimension in the FinOps automation context, not equal weighting by default.

For value: frequency and rule clarity are weighted at 25% each because they're the two gatekeeping questions — "is this worth automating?" (frequency) and "can it be automated?" (rule clarity). Volume, error cost, and input consistency are secondary amplifiers at 15–20%.

For readiness: data availability is highest at 30% because it's the only hard binary — either the data exists in usable form or it doesn't. The other three dimensions are more gradual and recoverable, so they're weighted equally at 20–25%.

The effort modifiers (S: ×1.15, M: ×1.0, L: ×0.80) are intentionally modest — they tilt the rankings toward easier work without overriding value signal. A genuinely high-value large effort still outranks a low-value small effort.

---

### Why separate process risk from org risk tolerance?

Process risk and org risk tolerance operate independently and interact in one specific way: when the process is riskier than the org's stated tolerance, a penalty is applied. When the process risk is at or below tolerance, no adjustment is made.

This means the tool never suppresses a recommendation purely because a process carries some risk — it only does so when there's a mismatch with what that specific org has said they're comfortable with. A conservative org doesn't automatically avoid commitment management forever; they just need a higher priority score to offset the penalty. The penalty values (0.05 for medium, 0.15 for high) are calibrated to deprioritize — not eliminate — risky processes for conservative orgs.

---

## Key Design Decisions

**Why client-side scoring?** Keeps the tool fast, offline-capable, and free of a backend. The scoring formula is transparent and auditable — a consultant can walk a client through exactly how a score was derived.

**Why Groq (llama-3.3-70b)?** Speed. Groq's inference hardware returns structured JSON in 2–4 seconds, which keeps the results page snappy. The model is capable enough for FinOps domain prompts with a well-specified JSON schema.

**Why a fallback summary?** The AI output enriches the experience but is not load-bearing. Scored results, the matrix, and the roadmap table all come from the deterministic engine. If the API is down or slow, the user still gets a complete, useful deliverable.

**Why no backend?** The app is a static SPA — zero infrastructure to maintain, deployable anywhere, and the only sensitive asset (the API key) is scoped to the browser via `VITE_` env vars. For a production deployment the Groq call would move to a thin serverless function to keep the key server-side.
