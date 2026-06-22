# Design Philosophy — ElectionTracker

## Core Principle

Data should speak first. Every design decision subordinates chrome to content: numbers are large, labels are small, decorative elements are absent. The aesthetic is closer to a financial terminal or a serious newspaper data desk than a consumer app.

---

## Colour System

The palette has two layers.

**Neutral base** — almost the entire UI lives in a greyscale range defined by CSS variables:

| Token | Role |
|---|---|
| `--canvas` | Page background (white) |
| `--canvas-soft` | Recessed surface (e.g. table zebra, code blocks) |
| `--ink` | Primary text, numbers, headings |
| `--body-ink` | Body copy — slightly muted |
| `--muted-ink` | Labels, metadata, eyebrows |
| `--hairline` / `--hairline-soft` / `--hairline-strong` | Border hierarchy |

**Brand accent** — a single blue (`--brand`, `--brand-active`) used sparingly: the logo dot, active nav links, methodology links, progress bars. It never competes with data.

**Political spectrum colours** — the one place colour carries semantic weight. Every party is assigned a bloc (`farleft` → `farright`, `green`, `regional`) which maps to a fixed colour used consistently in seat bars, trend bars, parliament dots, and party profile headers. These colours are editorial classifications, not decorative choices.

---

## Typography

Three typefaces, each with a distinct semantic role:

- **Inter** — UI body text, labels, navigation. Clean, neutral.
- **Inter Tight** — Display headings (`font-display`). Slightly narrower tracking for large numbers and hero text.
- **JetBrains Mono** (`font-mono`) — All data: percentages, seat counts, dates, abbreviations, scores. Monospace ensures columns align and numbers feel precise rather than decorative.

Type scale is deliberately two-speed: hero figures run 5xl–6xl, body text runs sm–base. There is no mid-range decorative type.

---

## Layout

All pages share a `max-w-6xl px-6` container centred on the viewport.

Vertical rhythm is built from `border-hairline` section dividers rather than spacing tokens — sections feel like rows in a ledger. Each section has a consistent `py-12` padding.

Grid patterns:
- Three-column `md:grid-cols-3` for stat trios (government outlook, methodology blurbs)
- Two-column `md:grid-cols-2` or `md:grid-cols-[1fr_1.3fr]` for content + data panel pairs
- `lg:grid-cols-[380px_1fr]` for the projection sliders + parliament canvas pair

---

## Components

**Card** — the primary data container. Thin `border-hairline` border, no shadow by default. `CardHeader` provides a consistent title / subtitle / right-slot structure with an internal hairline separator.

**TrendBar** — horizontal percentage bars with a party colour dot, abbreviation, value, delta chip, and ±MoE whisker. All numbers in mono.

**SeatBar** — a proportional seat strip showing party colours, a majority marker, and a legend row. Used on the trend page and within the projection tool.

**SectionTitle** — eyebrow (small mono uppercase) + heading + optional lead paragraph. Every major section opens with this.

**BlocTag / Delta** — small inline atoms: bloc classification pill and a coloured ±N.N% delta figure.

---

## Interaction Model

The site is predominantly read-only. The only interactive surface with real complexity is the Projection page, where sliders and coalition chips update a Canvas-rendered parliament in real time. Even there the interaction is deliberately constrained: the parliament is drawn on a `<canvas>` (not SVG) precisely because 650 individual SVG elements are too slow; performance is non-negotiable on a tool people will drag sliders on.

Hover states are subtle (`hover:text-ink`, `hover:border-brand/50`). The Europe map on the homepage uses polygon hover with a tooltip overlay — the only map-level interactivity in the site.

---

## Voice and Tone

Labels are terse and uppercase: "LIVE", "SOON", "Δ shown vs. 4 Jul 2024 GE.", "weighted trend". Prose where it appears (Analysis page, Methodology cards, party descriptions) is precise and factual — no hedging language, no exclamation marks. Numbers are always formatted with a decimal place.

The brand name appears as `● ElectionTracker` — the pulsing dot is the only animation on the header.

---

## What the Design Avoids

- No illustrations, icons beyond lucide-react utility icons, or decorative imagery
- No gradients or drop shadows on data elements
- No dark mode (not implemented)
- No modal dialogs — all navigation is page-level
- No skeletons or loading states (data is static / seeded)
