---
name: xpfirm-universal-dashboard
version: 1.1.0
description: >
  Design, scaffold, audit, or adapt premium SaaS dashboards with Soft Aurora Minimalism or institutional
  XpFirm-inspired Paper/Obsidian design language. Use for admin portals, analytics,
  commerce, service operations, CRM, finance operations, or multi-tenant B2B apps.
  Business semantics, authorization, and data models must be supplied per project.
license: Proprietary starter; redistribute only with owner's permission.
---

# XpFirm Universal Dashboard Skill

## Mission

Build an evidence-first, premium, fast, accessible dashboard for **any business domain**.
Reuse the XpFirm Operations Desk design *principles* (density, surface hierarchy,
workflow ordering, navigation, provenance, semantic status, responsive structure),
not XpFirm's financial/account entities, API payloads, backend policies or logo.

**Definition of success:** The person can answer, in order, (1) What is happening?
(2) What needs attention? (3) Why? (4) What can I do about it?

**This package is a new, generic implementation.** Its sample dataset is synthetic
and its built-in interactive preview is not a connected production application.
The older XpFirm `.agents/skills/xpfirm-ui-template/SKILL.md` describes an earlier
Obsidian/Gold marketing design; do not treat it as current canonical dashboard
runtime styling. In the XpFirm project, actual runtime token ownership remains
with `app/dashboard/dashboard-v3.css` and global/marketing with `app/globals.css`.
Do not overwrite the product repository's canonical files based on this skill.

## When to activate

Trigger on requests such as:

- "Use the XpFirm dashboard design for my SaaS / ecommerce / agency / CRM"
- "Create a dashboard starter / reusable admin template"
- "Redesign a business control panel with XpFirm's operations UX"
- "Turn this screen into a premium responsive analytics desk"
- "Audit my dashboard for density, accessibility, and data integrity"

Do **not** use this skill to transplant XpFirm trading behavior, bypass existing
business rules, create real-looking unverifiable account metrics, or silently
replace a product's branding.

## Step 0 — Project discovery

Inspect existing routes, design tokens, components, account/tenant boundaries,
backend response contracts, loading/error states, data provenance, and tests.
If the project already has shared primitives, use them; don't create duplicate
buttons/dialogs/selects/alerts. Ask only for genuinely missing critical context;
otherwise propose reasonable adapters and explicitly label assumptions.

Produce a brief implementation contract before coding:

```yaml
brand: "<Business name>"
domain: "<SaaS | Ecommerce | Services | Custom>"
primary_persona: "<Who acts on this dashboard?>"
primary_question: "<What should the user know within 5 seconds?>"
primary_action: "<What can the user actually do?>"
theme: "aurora | light | dark | system (resolve to a concrete theme)"
accent_role: "brand/navigation/focus only"
locale: "en-US"
timezone: "source-specific; not silently assumed"
currency: "USD, if supported by the business"
auth_scope: "<tenant/customer/site/project ownership>"
source_of_truth: "<API or explicit demo dataset>"
required_states: [loading, empty, success, stale, partial, error, unknown]
```

## Visual DNA — XpFirm operations + original Soft Aurora adaptation

**Default for new, general-purpose businesses: Soft Aurora.** This is a new,
independent presentation layer inspired by the user's pastel blue/lavender/pink
reference; it is **not** an assertion that the live XpFirm dashboard uses it.
Maintain the XpFirm-derived evidence-first data hierarchy and authoritative
status semantics. Keep data cards and forms opaque. No glass, false live
telemetry or text placed over saturated color.

Paper and Obsidian remain explicitly selectable faithful adaptations of the
XpFirm institutional operations principles. Public/marketing can choose its own
brand register; authenticated records stay readable in all three themes.

| Role | Dark | Light | Usage |
| --- | --- | --- | --- |
| Canvas | `#0B0B0B` | `#F2F3F1` | Entire workspace |
| Panel | `#141716` | `#FFFFFF` | KPI, chart, table containers |
| Inset | `#1B201D` | `#F7F8F6` | Subtle table head/fields |
| Ink | `#EEF0EC` | `#1C2421` | Readable foreground |
| Secondary ink | `#C4CEC7` | `#4D5A53` | Explanations |
| Muted ink | `#A0AFA5` | `#5A6860` | Metadata |
| Border | `#343C37` | `#D1D6D2` | Solid 1px separation |
| Brand/focus accent | `#BDA16A` | `#7D632E` | Navigation, focus only |
| Selected navigation | `#29241B` | `#F3ECDF` | 2px accent rail |
| Safe text | `#83BEA1` | `#21664F` | Verified good state |
| Warning text | `#D7B778` | `#885B18` | Verified caution |
| Critical text | `#DF999A` | `#A52A35` | Verified serious state |
| Optional public Coral | `#FF8982` brand dark | `#C13E31` brand light | Public marketing only |

### Soft Aurora Minimalism (new default)

| Semantic role | Soft Aurora | Use |
| --- | --- | --- |
| Canvas | `#F7F9FC` | Quiet workspace surrounding data |
| Sidebar / panels | `#FDFEFF` / `#FFFFFF` | Opaque high-readability surfaces |
| Ink / secondary / muted | `#20232D` / `#505B6D` / `#636E81` | Actual text, not gradient text |
| Hairline | `#E0E5ED` | Soft boundaries |
| Focus and brand | `#584AA1` | Navigation, focus and chart accent; not status |
| Soft sky | `#E9F9FF` | Decorative hero only |
| Soft lavender | `#F2EEFF` | Decorative hero only |
| Soft blush | `#FBE9FD` | Decorative hero only |
| Action fill | `#27243B` with white text | Verified foreground contrast |

Hero background: layer radial gradients with pale blue edges, a lavender center
and a faint pink bloom near the lower middle; use the `--desk-hero-gradient`
role in `styles.css`. If reducing effects or rendering for print, replace the
background with one pastel solid; preserve dark heading contrast.

- Aurora hero: generous whitespace, black/graphite headline, subtitle, optional
  light context selectors, no fake-live claims.
- Aurora shell: 232px sidebar, ~72px topbar, cards 17px radius, hero 23px;
  mobile layout remains scrollable with accessible nav drawer.
- White data panels are solid, separate from the pastel hero; subtle flat
  borders or *very restrained* ambient shadows are allowed in Aurora only.
- Charts and status pills keep independent meaning. Lavender is **not** a
  success, warning, critical, or authorization status.
- Typography: clean modern sans, controlled negative tracking in hero only,
  all figures tabular and contrast verified in both themes.
- Theme selection: accessible native select with `aurora`, `light`, `dark`;
  default is `aurora` when no valid saved preference exists. Persist preference
  when possible; if storage is unavailable, remain functional in-memory.
- Use one gradient as a focal feature, not gradient buttons/metrics/tables.

### Institutional Paper and Obsidian (retained)

Core measurements:

- Sidebar width 208px desktop; sticky topbar minimum height 64px.
- Four KPI cells in an overview, then 8:4 / 7:5 bento emphasis as appropriate.
- Card/control radius 4px, table frame/sidebar links 2px, shell square.
- Dashboard labels ~11px uppercase letter spacing 0.08–0.12em.
- Body/headings: IBM Plex Sans **if properly installed**; fallback system sans.
- Data, IDs, timestamps: tabular numerals; restrained mono for metadata.
- Real semantic states have text + (optional) icon + color, never color alone.
- Brand gold is **not** a warning state or authorization/safety confirmation.
- In Paper/Obsidian, no gradients, blur, glow, decorative telemetry, card shadows,
  or filler charts. Aurora may have one subtle decorative pastel hero gradient
  and soft card elevation; never use effects as evidence or status.
- Hover states should not imply new data or actions.

For a specific non-XpFirm brand, expose theme aliases (CSS custom properties)
so accent can change independently without changing safe/warning/critical roles.
Do not copy third-party assets, layouts pixel-for-pixel, or XpFirm marks.

## Information architecture

Use this order for a standard operations overview:

1. **Scope**: clear tenant/project/site selection, source freshness, time basis.
2. **Status**: critical blockers / unknown first, no fabricated green checks.
3. **Top 4 KPIs**: current business outcomes, not vanity metrics.
4. **Primary analysis**: one dominant trend or task table.
5. **Actionable ledger**: real records with visible status and timestamps.
6. **Recent activity / supporting context**: compact and secondary.
7. **Deep analysis**: its own route; don't overload overview.

Canonical shell:

```text
┌──────────────┬──────────────────────────────────────────────┐
│ Brand        │ Breadcrumbs / Search / Privacy / Theme      │
│ Workspace    ├──────────────────────────────────────────────┤
│              │ Title + context + chart date range           │
│ Overview     │ Data quality / source freshness              │
│ Analytics    │                                              │
│ Records      │ KPI 1   KPI 2   KPI 3   KPI 4                │
│              │                                              │
│ System       │ Primary chart           Operational status   │
│ Settings     │                                              │
│              │ Main records            Recent activity      │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

For mobile, preserve the **primary task** before summary cards or secondary
explanations. Use a labelled nav drawer, sensible touch targets, scrollable
records, and alternatives to hover-only controls. Never remove essential
status, scope, timestamps or errors to make a screenshot look neat.

## Core component contracts

| Component | Required behavior |
| --- | --- |
| `AppShell` | Desktop navigation, responsive drawer, skip link, keyboard, focus restore |
| `SidebarNav` | Only routes that exist, active `aria-current`, labelled groups |
| `Topbar` | Breadcrumbs, real search, theme & privacy controls, scope context |
| `MetricCard` | Label, value, unit, period, source, change sign; null renders `—` |
| `StatusBadge` | safe/warning/critical/unknown + human label + accessible text |
| `TrendChart` | Correct time axis, correct units, range, sources, privacy masking |
| `DataTable` | Native semantics, labelled sort, readable numeric alignment, empty/failure states |
| `ActivityFeed` | Actual event semantics + timestamp + relevance, no fake activity |
| `FilterBar` | Scope and date filters map to real data queries or are clearly chart-only |
| `ConfirmationDialog` | Pessimistic final acknowledgement for serious mutations, focus restored |
| `FeedbackState` | Distinct loading / empty / no results / stale / error / unknown |
| `PrivacyMask` | Consistent masks in every data representation; no data security claim |

Domain adapters must provide data and wording. Do not hardcode `balance`,
`drawdown`, `MT5`, `accounts`, `payout` into generic UI primitives.

```ts
type DataState<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; data: T; source: string; observedAt: string }
  | { kind: 'stale'; data: T; source: string; observedAt: string }
  | { kind: 'empty'; source: string; observedAt: string }
  | { kind: 'partial'; data: Partial<T>; missing: string[]; source: string }
  | { kind: 'error'; message: string; retryable: boolean }
  | { kind: 'unknown'; reason: string };

type Metric = {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  period: string;
  provenance: string;
  observedAt?: string;
  format: 'currency' | 'integer' | 'percent' | 'decimal';
};
```

**Never conflate:** unknown != zero; no events != failed event read; stale != live;
received state != command executed; mocked data != measured operations; local
privacy concealment != authorization; business rule UI != server enforcement.

## Adaptation steps

1. Choose `aurora` (default), `light` (institutional Paper) or `dark`
   (Obsidian) and replace branding: app name, wordmark, locale and copyright.
2. Define one persona, one key decision, <=4 overview metrics, and source owners.
3. Copy one example adapter from `config/presets.js` or implement equivalent
   typed interface for React/Next.js, Vue, Svelte, etc.
4. Map semantic statuses via domain rules (server-computed if authoritative).
   Replace demo random/synthetic series with genuine timestamped observations.
5. Implement real server authorization, tenant scoping and audit boundaries.
6. Implement no-data, auth expired, source offline, partial, stale, retry states.
7. Connect navigation only to implemented routes. Keep operator/admin plane
   separate from customer-facing navigation and permissions.
8. Verify charts, currency/timezone/locale, privacy, mobile table, keyboard,
   contrast, screen readers, reduced motion, and critical confirmations.
9. Run unit, integration, E2E, visual, performance and security checks.
10. Publish only after data provenance, claims and commercial copy are verified.

## Reusable output files (this kit)

- `SKILL.md`: This agent contract.
- `index.html`, `styles.css`, `app.js`: runnable static preview (no NPM dependencies).
- `config/presets.js`: three swappable **fictional** business adapters.
- `lib/format.js`: pure format/filter/CSV/series utilities.
- `docs/DESIGN_TOKENS.md`: implementation tokens and component rules.
- `docs/ADAPTATION_GUIDE.md`: porting into a new business or framework.
- `docs/ACCEPTANCE_CHECKLIST.md`: practical release gate.
- `docs/PROMPT_EXAMPLES.md`: instructions to paste into Codex/Hermes.
- `tests/*.test.mjs`: checks for schema, unknown, formatting, sorting, escaping.

## Tool & coding rules for AI agents

- Prefer existing local project stack; don't require React if the project is Vue.
- Prefer semantic HTML, keyboard-native controls and CSS custom properties.
- Use a single canonical component/token owner; adapters consume it.
- Escape/sanitize data before DOM HTML insertion; prefer safe DOM text nodes.
- Data scopes, role permissions, payment status, risk states, and workflow
  mutations must be checked by the server, not trusted from a client demo.
- Use explicit exact timestamps from the source; label the timezone.
- Charts must not fabricate smooth trends between missing observations.
- Empty/loading/error must be separate; retry failures must be visible.
- Icon-only buttons need names and visible focus; meaningful controls work.
- Never present sample content, placeholder avatars, or simulated alerts as real.
- Do not claim PCI/SOC2/GDPR compliance from a component library alone.
- Do not import XpFirm trade-specific implementation or logo into other brands.

## Acceptance & completion format

Report every delivery as:

```text
GOAL: Which business decision does the new dashboard support?
CONTRACT: Scope, data source, route inventory, and semantics.
IMPLEMENTATION: Which files and shared primitives changed?
STATES: How are loading/unknown/empty/error/stale/privacy handled?
VERIFICATION: Actual build/test/a11y/responsive outputs, not assumptions.
RISKS: What is still mocked, blocked, unverified, or security-sensitive?
NEXT: Safest concrete next integration step.
```

**Block production** without correct source ownership, server authorization,
no fabricated evidence, keyboard/mobile viability, contrast, and verified
mutations. For release specifics use `docs/ACCEPTANCE_CHECKLIST.md`.
