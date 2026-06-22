# Product Overview — ElectionTracker

ElectionTracker is a European election-data platform. It aggregates Westminster voting-intention polls, projects seat outcomes, and provides structural political analysis. The UK is the only live country; other European nations are in a "coming soon" state.

---

## Site Structure

```
/                          Homepage — Europe overview
/uk                        UK section (shared layout + sub-nav)
  /uk/                     UK Trend (default)
  /uk/polls                All polls + institute reliability
  /uk/political-parties    Party directory
  /uk/political-parties/$party   Individual party profile
  /uk/elections            Historic election results
  /uk/projection           Interactive seat projection + coalition builder
  /uk/analysis             Long-term structural analysis
  /uk/methodology          Methodology reference
/about                     About page
```

---

## Pages

### `/` — Homepage

**Purpose:** Entry point. Orients the user to ElectionTracker's European scope and routes them into the one live country.

**Content:**
- Hero — live count of active countries and a one-sentence mission statement.
- **Interactive Europe map** — an SVG polygon map covering ~27 countries. Countries are coloured by status (`active` in brand blue, `coming-soon` in centre-right amber, `unavailable` in grey). Hovering a country shows a tooltip with its flag, name, leading party (if active), and next election date. Clicking an active country navigates to its section.
- **Featured countries grid** — six hand-picked country cards (UK, Germany, France, Sweden, Poland, Greece) showing flag, name, election year, leading party/percentage if live, or "coming soon" otherwise.
- **Why ElectionTracker** — a three-column blurb covering Methodology, Coverage, and Analysis.

---

### `/uk` — UK Section Layout

A persistent sub-navigation bar sits below the global header for all UK pages, linking to: Trend · Polls · Parties · Elections · Projection · Analysis · Methodology.

---

### `/uk/` — UK Trend

**Purpose:** The primary dashboard. One-stop summary of the current UK political picture.

**Content:**
1. **Hero** — dynamic headline ("Reform UK leading at 29.0% in the UK polling trend"), sourced from the live weighted average. Shows the `as-of` date and poll count.
2. **Current voting intention card** — `TrendBar` showing all tracked parties with their weighted average, ±MoE band, and Δ vs. the July 2024 general election. Links to Methodology.
3. **Government & outlook trio** — three stat cards: governing party seat share on current trend (with majority verdict), the party with the largest 90-day gain, and the party with the steepest 30-day decline.
4. **Next election** — date countdown to the scheduled 2029 election, key political facts (head of state, PM, government type, memberships), and a projected seat bar (`SeatBar`).
5. **FPTP explainer + coalition scenarios** — brief text on the first-past-the-post system and a card listing every two-party combination that clears 326 seats on the current projection.
6. **Latest polls at a glance** — a grid of the five most recent poll cards, each showing institute, date, sample size, and a mini bar chart of the top five parties.
7. **Ideology legend** — a grid mapping each bloc label to its meaning and colour, used throughout the site.

---

### `/uk/polls` — All Polls

**Purpose:** Full database view. Every Westminster voting-intention poll, with metadata and institute reliability.

**Content:**
1. **Poll table** — all polls sorted by most recent fieldwork, paginated in increments of 10. Columns: Institute · Fieldwork end · Sample size · LAB · CON · REF · LD · GRN · SNP · PC · OTH. "More…" button reveals the next batch.
2. **Institute reliability** — a ranked list of polling firms, each showing name, most recent poll date, a labelled accuracy tier ("Highly Accurate" / "Reliable" / "Average" / "Low Accuracy"), a progress bar, and the raw PolitPro Score out of 100.
3. **Poll notification CTA** — disabled "Notify me on new poll releases" button, flagged as coming soon.

---

### `/uk/political-parties` — Party Directory

**Purpose:** Index of all tracked UK parties. Acts as a routing outlet; the actual list rendering lives in the index child route.

The index (`/uk/political-parties/`) shows a grid/list of party cards linking to individual party profiles.

---

### `/uk/political-parties/$party` — Party Profile

**Purpose:** Deep-dive on a single party.

**Content:**
1. **Header** — party name, abbreviation, leader, European Parliament group, bloc tag, and a one-paragraph description.
2. **Key metrics** (if the party appears in the topline polls) — three stat cards: current poll standing, change since the 2024 general election, and 90-day momentum.
3. **Political compass** — a 220×220 SVG quadrant (social ↔ market, progressive ↔ conservative) with the party plotted as a coloured circle.
4. **EU stance** — a horizontal slider showing the party's position on a −10 (anti-EU) to +10 (pro-EU) scale, with a prose label.
5. **Policy positions radar + bars** — a polygon radar chart across policy categories (Economy, Immigration, Healthcare, Climate, Foreign Policy, Social issues…), plus per-category bars showing the 0–100 score and Δ vs. the prior cycle.
6. **Target voter profile** — a prose paragraph describing the party's core electorate.
7. **Election results** — an SVG line chart of historic vote share across past general elections, plus a table (year / vote share / seats) and an optional "share of time in government" footnote.
8. **Cross-links** — back to directory, elections page, current trend.

---

### `/uk/elections` — Election Results

**Purpose:** Historic record of UK general elections.

**Content:**
1. **Current government composition** — head of state and PM card.
2. **Past elections** — one card per election showing year, date, turnout, and the party/parties that formed government. Each card includes a proportional seat strip (coloured by party) and a table of vote share and seats by party, with links to individual party profiles.

---

### `/uk/projection` — Seat Projection

**Purpose:** Interactive "what if" tool. Users adjust vote shares and immediately see how the House of Commons would change.

**Content:**
1. **Status banner** — dynamic: shows the largest party, its projected seat total, and whether the current government retains its majority. Includes a "Reset to central projection" button when shares have been modified.
2. **Vote shares panel (left column)** — one slider row per party. Each row has: colour dot, abbreviation, party name, Δ from baseline, lock toggle, numeric input (editable directly), seat count. Shares are always kept summing to 100%; adjusting one party redistributes proportionally across unlocked others. Locked parties are excluded from redistribution.
3. **Parliament canvas (right column)** — a 640×295 HTML `<canvas>` rendering 650 dots in a hemicycle arc, coloured by party and ordered left → right by political spectrum. Arc guide rings and a dashed majority line at centre are drawn via the 2D canvas API. Updates are deferred via `useDeferredValue` to keep the slider interaction fluid.
4. **Projected seat bar** — a `SeatBar` beneath the canvas.
5. **Coalition Builder** — below the main layout. Party chips (toggleable); selecting parties builds a proportional coalition bar and displays the combined seat total with a majority verdict.

---

### `/uk/analysis` — Long-Term Analysis

**Purpose:** Structural context behind the polling numbers. Not cycle-by-cycle commentary but multi-year forces.

**Content:**
1. **Six pillars grid** — each pillar is a card with a "Pillar" eyebrow, a title, and a paragraph of editorial analysis:
   - Economy & Economic Trends
   - Migration & Identity
   - Geopolitics & Alliances
   - Government Stability & Political Culture
   - Energy, Climate & Infrastructure
   - Social Cohesion & Intergenerational Issues
2. **Lived impact table** — seven cohort rows (Youth & students, Families, Retirees, Workforce, Entrepreneurs, LGBTQ+ & minorities, Immigrants & expats), each with a brief summary of how current politics materially affects them.

---

### `/uk/methodology` — Methodology

**Purpose:** Transparency reference. Explains every formula and score used across the site.

**Content (five cards):**
1. **Per-poll weight** — formula: `exp(-age_days / 21) × (institute.reliability / 100)`. Explains 21-day exponential decay and institute reliability scaling.
2. **Per-party trend** — weighted mean formula and 95% CI calculation.
3. **Institute reliability score** — how the PolitPro Score combines pre-election absolute error and cross-institute trend deviation.
4. **Seat projection (FPTP)** — explains the first-order proxy: leading party ×1.35, others ×0.92, normalised to 650 seats.
5. **Data caveat** — states explicitly that all poll percentages in this build are synthetic demo data generated by the seeder.

---

## Data Model (summary)

- **Polls** — per-poll records: institute ID, fieldwork end date, publish date, sample size, per-party percentages.
- **Institutes** — name, reliability score (0–100).
- **Parties** — full profile: name, abbreviation, leader, bloc, compass coordinates, EU stance score, policy scores per category, historic results, target voter description.
- **Country** — parliament size (650), majority threshold (326), governing parties, head of government, next election date, memberships.
- **Elections** — array of past general election objects: date, turnout, per-party vote share + seats, coalition formed.

The `AS_OF` constant in `seed.ts` is the reference date used for recency weighting and the "as of" display on the trend page.
