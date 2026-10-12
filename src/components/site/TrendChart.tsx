import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { partyById } from "@/data/seed";
import { partyColor } from "@/lib/partyColor";
import { rollingTrendSeries } from "@/lib/trend";
import type { Poll } from "@/data/types";

const RANGES = [
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
] as const;

function fmtTick(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Line chart of the smoothed polling average per party. */
export function TrendChart({ polls, partyIds }: { polls: Poll[]; partyIds: string[] }) {
  const [days, setDays] = useState<number>(180);
  const [focus, setFocus] = useState<string | null>(null);
  // Only animate the initial draw; range switches and live refreshes redraw instantly.
  const [firstDraw, setFirstDraw] = useState(true);
  // Compute the full year once per data refresh; range switches just slice it.
  const fullYear = useMemo(() => rollingTrendSeries(polls, 365, 2), [polls]);
  const data = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const from = cutoff.toISOString().slice(0, 10);
    return fullYear.filter((r) => String(r.date) >= from);
  }, [fullYear, days]);
  // Tight y-axis ceiling so movements fill the plot.
  const yMax = useMemo(() => {
    let max = 0;
    for (const row of data)
      for (const id of partyIds) max = Math.max(max, Number(row[id] ?? 0));
    return Math.ceil((max + 1) / 2) * 2;
  }, [data, partyIds]);
  const parties = partyIds.map((id) => partyById(id)).filter((p) => !!p);

  return (
    <div className="px-4 sm:px-6 pt-4 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {parties.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setFocus(p.id)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(p.id)}
              onBlur={() => setFocus(null)}
              className={`inline-flex items-center gap-1.5 text-xs font-mono transition-opacity ${
                focus && focus !== p.id ? "opacity-40" : "opacity-100"
              }`}
            >
              <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: partyColor(p) }} />
              <span className="text-ink">{p.abbr}</span>
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-hairline p-0.5 text-[11px] font-mono">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => {
                setFirstDraw(false);
                setDays(r.days);
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                days === r.days ? "bg-ink text-canvas" : "text-muted-ink hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[28rem] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtTick}
              minTickGap={40}
              tick={{ fontSize: 10, fill: "var(--muted-ink)", fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--hairline)" }}
              tickLine={false}
            />
            <YAxis
              width={34}
              unit="%"
              domain={[0, yMax]}
              tickCount={8}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "var(--muted-ink)", fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: "var(--hairline-strong)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const rows = [...payload].sort((a, b) => Number(b.value) - Number(a.value));
                return (
                  <div className="rounded-md border border-hairline bg-white px-3 py-2 shadow-lg text-xs">
                    <div className="font-mono text-muted-ink mb-1">
                      {new Date(String(label)).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    {rows.map((r) => {
                      const p = partyById(String(r.dataKey));
                      return (
                        <div key={String(r.dataKey)} className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          <span className="font-mono text-ink w-10">{p?.abbr}</span>
                          <span className="font-mono text-ink ml-auto">
                            {Number(r.value).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {parties.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                stroke={partyColor(p)}
                strokeWidth={focus === p.id ? 3 : 2}
                strokeOpacity={focus && focus !== p.id ? 0.2 : 1}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={firstDraw}
                animationDuration={700}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
