# CI Operations · Plus Jakarta Sans & Open Sans Typography System

Establish a structured 2+1 typographic hierarchy across the CI Operations Runner Console by pairing **Plus Jakarta Sans** for display headings and structural navigation with **Open Sans** for high-legibility body prose and dense data tables, while preserving tabular monospace for commit SHAs, live timers, and numeric telemetry.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following typographic decisions were confirmed during Phase 1 and govern this update:

- **Confirmed Decision 1 (Font Pairing & Role Assignment)**: Use **Plus Jakarta Sans** (`500`, `600`, `700`) for display titles, section headers, brand identity, and interactive segmented controls, paired with **Open Sans** (`400`, `500`, `600`) for body copy, runner descriptions, queue metadata, and table rows.
- **Confirmed Decision 2 (Numeric & Telemetry Styling)**: Preserve the dedicated tabular monospace stack (`font-variant-numeric: tabular-nums`) for commit SHAs, live elapsed timers, durations, and KPI metric counters so vertical alignment and live counter stability remain intact.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the console's typography from a single sans-serif variable to an intentional dual-font system (`--display` for **Plus Jakarta Sans**, `--sans` for **Open Sans`, and `--mono` for tabular telemetry), complete with Google Fonts webfont loading and graceful local system fallbacks.
- **Target Audience / Persona**: DevOps engineers, release managers, and infrastructure operators monitoring live GitHub Actions runner fleets and step-level reliability.
- **Key Value**: Sharpens visual hierarchy between structural section headings (`Plus Jakarta Sans`) and dense operational records (`Open Sans`) while maintaining strict `>= 14px` legibility across both Light and Dark themes.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Immediate Visual Hierarchy on Load**: When opening the console, operators immediately distinguish structural landmarks (Sidebar Brand, Page Title, Panel Headers, Drawer Titles) rendered in crisp geometric **Plus Jakarta Sans** from high-density operational rows (Runner Cards, Queue Items, Recent Runs Table, Failing Steps) rendered in **Open Sans**.
  2. **Chart & Inspector Readability**: Hovering over the Recharts Reliability Trend chart or opening the slide-over Job & Step Inspector applies the same **Plus Jakarta Sans** header / **Open Sans** body / **Monospace** duration hierarchy.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Utilitarian Modern Slate observability console with high-contrast typographic rhythm.
  - *Color Palette & Mood*: Preserves the 60-30-10 Modern Slate Light (`#f4f6f8` canvas, `#ffffff` panels, `#0f172a` ink) and Dark (`#0b0f19` canvas, `#111827` panels, `#f8fafc` ink) theme tokens with semantic status accents (`#059669` nominal, `#d97706` active/busy, `#e11d48` alert).
  - *Typography & Hierarchy*:
    - **Display & Headings (`--display: "Plus Jakarta Sans"`)**: Page heading (`30px`, weight `700`, `-0.8px` tracking, `text-wrap: balance`), panel headers (`15px`, weight `600`), brand wordmark (`16px`, weight `700`), inspector drawer title (`18px`, weight `700`), and interactive filter/action buttons (`14px`, weight `600`).
    - **Body & Dense Operational Prose (`--sans: "Open Sans"`)**: Document body (`14px/1.55`, weight `400`), runner context labels, table cells, workflow names, search/select inputs, and Recharts tooltip descriptions (`>= 14px`).
    - **Telemetry & Identifiers (`--mono: "JetBrains Mono", "Cascadia Code", Consolas, monospace`)**: KPI values (`28px`, `tabular-nums`), commit SHAs, live elapsed timers, poll intervals, and step durations.
  - *Component Styling & Layout*: Full-viewport sidebar + main workspace layout with single-elevation bordered panels and responsive data grids.
- **Interactive Feedback & Motion**: Smooth `150ms` theme and hover transitions; zero layout shift during live timer ticks thanks to `tabular-nums`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dedicated `--display` and `--sans` CSS Custom Properties**
  - *Chosen Approach*: Introduce `--display` (`"Plus Jakarta Sans", ...`) alongside `--sans` (`"Open Sans", ...`) and `--mono` in `:root`, mapping structural headings and navigation controls to `--display` while keeping `body` and tabular prose on `--sans`.
  - *Why*: Gives every component a clean, declarative token for its typographic role without inline font overrides, and automatically propagates to Light/Dark themes and Recharts SVG labels.
  - *Alternatives Considered*: Applying a single font to the entire document was rejected because pairing geometric headings (`Plus Jakarta Sans`) with humanist body text (`Open Sans`) significantly improves scannability in dense tables.
- **Decision 2: CSP-Compliant Google Fonts Stylesheet Loading with Offline Fallbacks**
  - *Chosen Approach*: Load `Plus Jakarta Sans` (`500;600;700`) and `Open Sans` (`400;500;600`) via Google Fonts `<link rel="stylesheet">` allowed by the server's `style-src` and `font-src` Content Security Policy directives, backed by local system fallbacks (`-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`).
  - *Why*: Ensures authentic rendering when online in the browser preview while guaranteeing zero errors in hermetic or offline test suites.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Typographic Token Flow**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Google Fonts Stylesheet & CSP                        │
│     Plus Jakarta Sans (500, 600, 700)  +  Open Sans (400, 500, 600)      │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      Root CSS Custom Properties (:root)                  │
│  • --display : "Plus Jakarta Sans", -apple-system, "Segoe UI", sans-serif│
│  • --sans    : "Open Sans", -apple-system, "Segoe UI", Arial, sans-serif │
│  • --mono    : "JetBrains Mono", "Cascadia Code", Consolas, monospace    │
└───────────┬───────────────────────────────┬──────────────────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────────────────┐ ┌────────────────────────────────────┐
│   Display & Structural Surface    │ │    Body, Tables & Telemetry        │
│        (Plus Jakarta Sans)        │ │    (Open Sans + Tabular Mono)      │
├───────────────────────────────────┤ ├────────────────────────────────────┤
│ • Sidebar Brand & Workspace Title │ │ • Runner Context & Repo Labels     │
│ • Page Heading (h1) & Panel (h2)  │ │ • Queue & Recent Runs Table Cells  │
│ • Segmented Filter & Theme Buttons│ │ • Recharts Axis & Tooltip Copy     │
│ • Job & Step Inspector Headings   │ │ • .mono SHAs, Timers & KPI Metrics │
└───────────────────────────────────┘ └────────────────────────────────────┘
```

- **Data Model & State**: No changes to backend state schemas; typography tokens bind directly to existing DOM views, Recharts SVG text props, and the slide-over Job & Step Inspector.
- **Interactive Component & State Mapping**:
  - **Theme Toggle (`#theme-toggle`)**: Preserves typographic weights and optical contrast across Light and Dark modes.
  - **Reliability Trend Chart (`#reliability-chart`)**: Uses `--sans` (`Open Sans`) for tooltip descriptions and `--mono` for axis percentages and run counts.
  - **Job & Step Inspector (`#job-drawer`)**: Renders the job title and section headers in `--display` (`Plus Jakarta Sans`), step names in `--sans` (`Open Sans`), and step durations/SHAs in `--mono`.
