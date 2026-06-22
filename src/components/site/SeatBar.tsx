import { partyColor } from "@/lib/partyColor";
import { partyById } from "@/data/seed";

export function SeatBar({
  seats,
  total,
  majority,
}: {
  seats: Record<string, number>;
  total: number;
  majority: number;
}) {
  const sorted = Object.entries(seats)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  const majorityPct = (majority / total) * 100;
  return (
    <div className="pt-8">
      <div className="relative">
        <div className="absolute -top-5 text-[10px] font-mono text-ink whitespace-nowrap -translate-x-1/2" style={{ left: `${majorityPct}%` }}>
          majority · {majority}
        </div>
      <div className="relative h-10 w-full bg-canvas-soft border border-hairline rounded-md overflow-hidden flex">
        {sorted.map(([id, s]) => {
          const p = partyById(id);
          if (!p) return null;
          const w = (s / total) * 100;
          return (
            <div
              key={id}
              style={{ width: `${w}%`, backgroundColor: partyColor(p) }}
              title={`${p.abbr} — ${s} seats`}
              className="border-r border-white/40 last:border-r-0 flex items-center justify-center text-[10px] font-mono text-ink/80"
            >
              {w > 6 ? p.abbr : ""}
            </div>
          );
        })}
      </div>
        <div
          className="absolute top-0 bottom-0 w-px bg-ink pointer-events-none"
          style={{ left: `${majorityPct}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body-ink">
        {sorted.map(([id, s]) => {
          const p = partyById(id);
          if (!p) return null;
          return (
            <span key={id} className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: partyColor(p) }} />
              <span className="text-ink">{p.abbr}</span>
              <span className="font-mono text-muted-ink">{s}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

