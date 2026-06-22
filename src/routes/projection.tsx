import { useState, useMemo, memo, useDeferredValue, useCallback, useEffect, useRef } from "react";
import { Lock, LockOpen } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { computeTrend } from "@/lib/trend";
import { partyById, country } from "@/data/seed";
import { usePollsContext } from "@/contexts/PollsContext";
import { partyColor } from "@/lib/partyColor";
import { Card, CardHeader } from "@/components/site/Card";
import { SeatBar } from "@/components/site/SeatBar";

export const Route = createFileRoute("/projection")({
  head: () => ({
    meta: [
      { title: "Seat Projection — UK | ElectionTracker" },
      {
        name: "description",
        content: "Adjust national vote shares and see how the House of Commons would change.",
      },
    ],
  }),
  component: ProjectionPage,
});

const TOTAL = country.parliamentSize;
const MAJORITY = country.majorityThreshold;

// ── Canvas hemicycle ──────────────────────────────────────────────────────────
// 10 rows x 65 cols = 650 seats. Column-major fill, left -> right by spectrum.
// Canvas logical size 640 x 295; dots drawn via 2D context (no SVG elements).
const C_W = 640;
const C_H = 295;
const C_CX = 320;
const C_CY = 280;
const C_INNER = 140;
const C_STEP = 12;
const C_ROWS = 10;
const C_COLS = 65;
const C_DOT_R = 3;
const C_OUTER = C_INNER + (C_ROWS - 1) * C_STEP; // 248

// All 650 positions computed once at module load.
// angle = PI -> PI/2 -> 0 (left to right over the top);
// canvas y-coord: y = cy - r*sin(a)  (y-down coordinate system)
const C_POS: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < 650; i++) {
    const col = Math.floor(i / C_ROWS);
    const row = i % C_ROWS;
    const r = C_INNER + row * C_STEP;
    const a = Math.PI - (col / (C_COLS - 1)) * Math.PI;
    out.push({ x: C_CX + r * Math.cos(a), y: C_CY - r * Math.sin(a) });
  }
  return out;
})();
// ─────────────────────────────────────────────────────────────────────────────

const BLOC_SPECTRUM: Record<string, number> = {
  farleft: 0,
  left: 1,
  centerleft: 2,
  green: 3,
  regional: 4,
  liberal: 5,
  center: 6,
  centerright: 7,
  right: 8,
  farright: 9,
  other: 10,
};

function customProjection(shares: Record<string, number>): Record<string, number> {
  const entries = Object.entries(shares)
    .filter(([, pct]) => pct > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!entries.length) return {};
  const lead = entries[0][0];
  const totalAdj = entries.reduce((s, [id, pct]) => s + (id === lead ? pct * 1.35 : pct * 0.92), 0);
  const out: Record<string, number> = {};
  let used = 0;
  for (const [id, pct] of entries) {
    const adj = id === lead ? pct * 1.35 : pct * 0.92;
    const seats = Math.round((adj / totalAdj) * TOTAL);
    out[id] = seats;
    used += seats;
  }
  if (lead) out[lead] = (out[lead] ?? 0) + (TOTAL - used);
  return out;
}

function buildDotColors(seats: Record<string, number>): string[] {
  const ordered = Object.entries(seats)
    .filter(([, s]) => s > 0)
    .map(([id, s]) => ({ id, seats: s, party: partyById(id)! }))
    .filter((x) => x.party != null)
    .sort((a, b) => (BLOC_SPECTRUM[a.party.bloc] ?? 10) - (BLOC_SPECTRUM[b.party.bloc] ?? 10));
  const colors: string[] = [];
  for (const { seats: count, party } of ordered) {
    const c = partyColor(party);
    for (let i = 0; i < count; i++) colors.push(c);
  }
  return colors;
}

// Canvas parliament — drawing 650 dots directly is ~10x faster than 650 SVG circles.
const ParliamentCanvas = memo(function ParliamentCanvas({
  seats,
}: {
  seats: Record<string, number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useMemo(() => buildDotColors(seats), [seats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, C_W, C_H);

    // Faint arc guides (CCW from PI -> 0 goes over the top in canvas y-down coords)
    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 0.7;
    for (let row = 0; row < C_ROWS; row++) {
      ctx.beginPath();
      ctx.arc(C_CX, C_CY, C_INNER + row * C_STEP, Math.PI, 0, true);
      ctx.stroke();
    }

    // Seat dots
    for (let i = 0; i < C_POS.length; i++) {
      ctx.beginPath();
      ctx.arc(C_POS[i].x, C_POS[i].y, C_DOT_R, 0, Math.PI * 2);
      ctx.fillStyle = colors[i] ?? "#e5e7eb";
      ctx.fill();
    }

    // Majority dashed line at top-centre
    const majY1 = C_CY - C_INNER + 4;
    const majY2 = C_CY - C_OUTER - 10;
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(C_CX, majY1);
    ctx.lineTo(C_CX, majY2);
    ctx.stroke();
    ctx.restore();

    // "326" label
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("326", C_CX, majY2 - 5);

    // Spectrum tip labels
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.textAlign = "left";
    ctx.fillText("← Left", 10, C_CY + 14);
    ctx.textAlign = "right";
    ctx.fillText("Right →", C_W - 10, C_CY + 14);
  }, [colors]);

  return (
    <canvas ref={canvasRef} width={C_W} height={C_H} style={{ width: "100%", display: "block" }} />
  );
});

function LockIcon({ locked }: { locked: boolean }) {
  return locked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />;
}

// Per-party slider row — memoised so only changed rows re-render on each drag tick.
const PartyRow = memo(function PartyRow({
  id,
  pct,
  seats,
  baselinePct,
  color,
  abbr,
  name,
  isLocked,
  onSlider,
  onLock,
}: {
  id: string;
  pct: number;
  seats: number;
  baselinePct: number;
  color: string;
  abbr: string;
  name: string;
  isLocked: boolean;
  onSlider: (id: string, val: number) => void;
  onLock: (id: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const displayVal = draft !== null ? draft : pct.toFixed(1);
  const delta = +(pct - baselinePct).toFixed(1);

  return (
    <div className={`space-y-1.5 ${isLocked ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-mono text-ink w-9 flex-shrink-0">{abbr}</span>
        <span className="text-xs text-muted-ink flex-1 min-w-0 truncate hidden sm:block">
          {name}
        </span>

        {Math.abs(delta) >= 0.2 && (
          <span
            className="text-[11px] font-mono flex-shrink-0"
            style={{ color: delta > 0 ? "#16a34a" : "#dc2626" }}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
        )}

        <button
          onClick={() => onLock(id)}
          title={isLocked ? "Unlock" : "Lock"}
          className={`p-1 rounded transition-colors flex-shrink-0 ${isLocked ? "text-brand" : "text-muted-ink hover:text-ink"}`}
        >
          <LockIcon locked={isLocked} />
        </button>

        <div className="relative flex items-center flex-shrink-0">
          <input
            type="text"
            inputMode="decimal"
            disabled={isLocked}
            value={displayVal}
            onFocus={() => setDraft(pct.toFixed(1))}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              const p = parseFloat(e.target.value);
              if (!isNaN(p)) onSlider(id, Math.min(60, Math.max(0, p)));
              setDraft(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-14 text-right text-xs font-mono text-ink bg-canvas border border-hairline rounded px-1 py-0.5 pr-4 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 disabled:cursor-not-allowed"
          />
          <span className="absolute right-1 text-xs font-mono text-muted-ink pointer-events-none">
            %
          </span>
        </div>

        <span className="text-xs font-mono font-semibold text-ink w-8 text-right flex-shrink-0">
          {seats}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={60}
        step={0.1}
        value={pct}
        disabled={isLocked}
        onChange={(e) => onSlider(id, +e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-hairline disabled:cursor-not-allowed"
        style={{ accentColor: color }}
      />
    </div>
  );
});

function ProjectionPage() {
  const { polls } = usePollsContext();
  const trend = useMemo(() => computeTrend(undefined, polls), [polls]);

  const baseline = useMemo<Record<string, number>>(() => {
    const sum = trend.reduce((s, t) => s + t.pct, 0) || 1;
    const raw: Record<string, number> = {};
    for (const t of trend) raw[t.partyId] = +((t.pct / sum) * 100).toFixed(1);
    const keys = Object.keys(raw);
    const diff = +(100 - Object.values(raw).reduce((s, v) => s + v, 0)).toFixed(1);
    if (keys.length) raw[keys[0]] = +(raw[keys[0]] + diff).toFixed(1);
    return raw;
  }, [trend]);

  const partyOrder = useMemo(
    () =>
      Object.keys(baseline)
        .map((id) => ({ id, party: partyById(id)! }))
        .filter((x) => x.party != null),
    [baseline],
  );

  const [shares, setShares] = useState<Record<string, number>>(baseline);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [coalition, setCoalition] = useState<Set<string>>(new Set());

  const projectedSeats = useMemo(() => customProjection(shares), [shares]);
  const deferredSeats = useDeferredValue(projectedSeats);

  const coalitionSeats = useMemo(
    () => Array.from(coalition).reduce((s, id) => s + (projectedSeats[id] ?? 0), 0),
    [coalition, projectedSeats],
  );

  const totalShares = +Object.values(shares)
    .reduce((s, v) => s + v, 0)
    .toFixed(1);
  const isModified = Object.keys(shares).some(
    (id) => Math.abs((shares[id] ?? 0) - (baseline[id] ?? 0)) > 0.05,
  );

  // Stable ref for locked set so applyChange callback is never recreated.
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const applyChange = useCallback((id: string, rawVal: number) => {
    setShares((prev) => {
      const lk = lockedRef.current;
      const lockedOthersTotal = Object.entries(prev)
        .filter(([k]) => k !== id && lk.has(k))
        .reduce((s, [, v]) => s + v, 0);
      const maxVal = Math.max(0, 100 - lockedOthersTotal);
      const clamped = Math.min(60, Math.max(0, rawVal), maxVal);
      const delta = +(clamped - (prev[id] ?? 0)).toFixed(2);
      if (Math.abs(delta) < 0.001) return prev;
      const targets = Object.entries(prev).filter(([k]) => k !== id && !lk.has(k));
      const targetsTotal = targets.reduce((s, [, v]) => s + v, 0);
      const next: Record<string, number> = { ...prev, [id]: clamped };
      if (targetsTotal > 0) {
        for (const [k, v] of targets)
          next[k] = Math.max(0, +(v - (v / targetsTotal) * delta).toFixed(2));
      }
      return next;
    });
  }, []);

  const toggleLock = useCallback((id: string) => {
    setLocked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const toggleCoalition = useCallback((id: string) => {
    setCoalition((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const reset = useCallback(() => {
    setShares(baseline);
    setLocked(new Set());
  }, [baseline]);

  const sortedSeats = Object.entries(projectedSeats)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  const govSeats = country.governingParties.reduce((s, id) => s + (projectedSeats[id] ?? 0), 0);
  const govHolds = govSeats >= MAJORITY;
  const leadParty = sortedSeats[0] ? partyById(sortedSeats[0][0]) : null;

  const majorityPct = (MAJORITY / TOTAL) * 100;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      {/* Page title */}
      <div>
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-ink mb-3">
          <span className="text-brand">●</span>
          <span>Projection · House of Commons · 650 seats</span>
        </div>
        <h1 className="text-4xl font-display leading-tight text-ink">Vote Share Projection</h1>
        <p className="mt-2 text-body-ink max-w-2xl leading-relaxed">
          Adjust vote-share sliders and see how seat totals shift. Lock a party to keep its share
          fixed. Shares always sum to 100%.
        </p>
      </div>

      {/* Status banner */}
      <div
        className="flex items-center justify-between rounded-lg border px-5 py-3 text-sm gap-4 flex-wrap"
        style={{
          borderColor: leadParty ? partyColor(leadParty) + "44" : "var(--hairline)",
          backgroundColor: leadParty ? partyColor(leadParty) + "0a" : "var(--canvas-soft)",
        }}
      >
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {leadParty && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: partyColor(leadParty) }}
            />
          )}
          <span className="text-ink font-medium">
            {leadParty?.name ?? "—"} largest with{" "}
            <span className="font-mono">{sortedSeats[0]?.[1] ?? 0}</span> seats
          </span>
          <span className="text-muted-ink hidden sm:inline">&middot;</span>
          <span className="hidden sm:inline text-body-ink">
            Government holds <span className="font-mono text-ink">{govSeats}</span> seats &mdash;{" "}
            <span className={govHolds ? "text-green-600" : "text-red-600"}>
              {govHolds ? "majority" : "no majority"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isModified && (
            <button
              onClick={reset}
              className="text-xs font-mono text-brand hover:text-brand/70 border border-brand/30 hover:border-brand/50 rounded px-3 py-1.5 transition-colors whitespace-nowrap"
            >
              Reset to latest poll
            </button>
          )}
          <span className="font-mono text-xs text-muted-ink">
            <span className={Math.abs(totalShares - 100) > 0.5 ? "text-amber-600" : "text-ink"}>
              {totalShares.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      {/* Main two-column layout: sliders left, parliament right */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* ── Sliders ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Vote Shares"
            subtitle="Drag or type · lock to pin"
            right={
              <div className="flex gap-3 items-center text-[10px] font-mono text-muted-ink uppercase tracking-wider">
                <span>Share</span>
                <span className="w-7 text-right">Seats</span>
              </div>
            }
          />
          <div className="p-4 space-y-4">
            {partyOrder.map(({ id, party }) => (
              <PartyRow
                key={id}
                id={id}
                pct={shares[id] ?? 0}
                seats={projectedSeats[id] ?? 0}
                baselinePct={baseline[id] ?? 0}
                color={partyColor(party)}
                abbr={party.abbr}
                name={party.name}
                isLocked={locked.has(id)}
                onSlider={applyChange}
                onLock={toggleLock}
              />
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-hairline bg-canvas-soft rounded-b-lg text-xs text-muted-ink">
            Lock a party to exclude it from redistribution. Max 60% per party.
          </div>
        </Card>

        {/* ── Parliament + Seat bar ───────────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Parliament — 650 Seats"
              subtitle="Left → right by political spectrum · dashed = majority (326)"
            />
            <div className="px-3 pt-1 pb-3">
              <ParliamentCanvas seats={deferredSeats} />
              {/* Compact legend */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {sortedSeats.map(([id, s]) => {
                  const p = partyById(id);
                  if (!p) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 text-[11px]">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: partyColor(p) }}
                      />
                      <span className="text-ink">{p.abbr}</span>
                      <span className="font-mono text-muted-ink">{s}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Projected House of Commons"
              subtitle="FPTP first-order proxy — leading party +35% seat bonus"
            />
            <div className="px-6 pb-6">
              <SeatBar seats={projectedSeats} total={TOTAL} majority={MAJORITY} />
            </div>
          </Card>

          <p className="text-xs text-muted-ink leading-relaxed px-1">
            <span className="text-ink font-medium">Model note:</span> Leading party ×1.35, others
            ×0.92, rounded with remainder to the leader. Indicative only.
          </p>
        </div>
      </div>

      {/* ── Coalition Builder ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Coalition Builder"
          subtitle="Click parties to include them in a coalition"
          right={
            coalition.size > 0 ? (
              <button
                onClick={() => setCoalition(new Set())}
                className="text-xs font-mono text-muted-ink hover:text-ink border border-hairline rounded px-2.5 py-1 transition-colors"
              >
                Clear
              </button>
            ) : null
          }
        />

        <div className="p-5 space-y-6">
          {/* Party chips — colored left stripe, abbr, seat count */}
          <div className="flex flex-wrap gap-2">
            {sortedSeats.map(([id, seats]) => {
              const p = partyById(id);
              if (!p) return null;
              const inCoal = coalition.has(id);
              const color = partyColor(p);
              return (
                <button
                  key={id}
                  onClick={() => toggleCoalition(id)}
                  title={`${p.name} — ${seats} seats`}
                  className={`inline-flex items-stretch overflow-hidden rounded-md border transition-all duration-150 ${
                    inCoal
                      ? "shadow-sm"
                      : "border-hairline opacity-50 hover:opacity-90 hover:border-hairline-strong"
                  }`}
                  style={inCoal ? { borderColor: color, backgroundColor: color + "12" } : {}}
                >
                  <span className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="px-2.5 py-1.5 flex items-center gap-1.5">
                    <span
                      className="font-mono font-semibold text-xs"
                      style={inCoal ? { color } : { color: "var(--ink)" }}
                    >
                      {p.abbr}
                    </span>
                    <span className="font-mono text-[11px] text-muted-ink">{seats}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Proportional seat bar + counter — always visible */}
          <div className="space-y-1">
            {/* Majority tick label */}
            <div className="relative h-4">
              <span
                className="absolute text-[9px] font-mono text-muted-ink whitespace-nowrap -translate-x-1/2"
                style={{ left: `${majorityPct}%` }}
              >
                majority · {MAJORITY}
              </span>
            </div>

            {/* Bar */}
            <div className="relative">
              <div className="h-16 w-full bg-canvas-soft border border-hairline rounded-lg overflow-hidden flex">
                {sortedSeats.map(([id, seats]) => {
                  const p = partyById(id);
                  if (!p) return null;
                  const inCoal = coalition.has(id);
                  const w = (seats / TOTAL) * 100;
                  return (
                    <div
                      key={id}
                      style={{
                        width: inCoal ? `${w}%` : "0%",
                        backgroundColor: partyColor(p),
                        transition: "width 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                      title={`${p.abbr} — ${seats} seats`}
                    >
                      {inCoal && w > 5 && (
                        <div className="h-full flex items-center justify-center text-[10px] font-mono text-white/90 select-none">
                          {p.abbr}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Majority dashed line — overlaid outside overflow:hidden */}
              <div
                className="absolute inset-y-0 pointer-events-none z-10"
                style={{
                  left: `${majorityPct}%`,
                  width: "1.5px",
                  background:
                    "repeating-linear-gradient(to bottom, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 5px, transparent 5px, transparent 9px)",
                }}
              />
            </div>

            {/* Seat counter */}
            <div className="pt-4 pb-2 text-center">
              <div className="font-mono tabular-nums leading-none">
                <span className="text-5xl font-bold text-ink">{coalitionSeats}</span>
                <span className="text-xl font-normal text-muted-ink"> / {TOTAL}</span>
              </div>
              <div className="mt-2 h-5 flex items-center justify-center">
                {coalitionSeats >= MAJORITY ? (
                  <span className="text-sm font-medium text-green-600">✓ majority</span>
                ) : coalition.size > 0 ? (
                  <span className="text-sm font-mono text-muted-ink">
                    <span className="text-ink font-medium">{MAJORITY - coalitionSeats}</span> short
                    of majority
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-ink">
                    Select parties above
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
