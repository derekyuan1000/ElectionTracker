import { BLOC_LABEL } from "@/data/types";
import { partyColor } from "@/lib/partyColor";
import { partyById } from "@/data/seed";
import { Link } from "@tanstack/react-router";
import type { TrendPoint } from "@/lib/trend";
import { Delta } from "./Delta";

export function TrendBar({
  trend,
  deltas,
}: {
  trend: TrendPoint[];
  deltas: { partyId: string; delta: number }[];
}) {
  const max = Math.max(...trend.map((t) => t.pct + t.moe), 35);
  const deltaMap = new Map(deltas.map((d) => [d.partyId, d.delta]));
  return (
    <div className="divide-y divide-hairline-soft">
      {trend.map((t) => {
        const p = partyById(t.partyId)!;
        const w = (t.pct / max) * 100;
        const moeLeft = Math.max(0, ((t.pct - t.moe) / max) * 100);
        const moeWidth = ((2 * t.moe) / max) * 100;
        return (
          <Link
            key={t.partyId}
            to="/political-parties/$party"
            params={{ party: p.id }}
            className="grid grid-cols-[90px_1fr_70px_60px] items-center gap-4 px-6 py-3 hover:bg-canvas-soft transition-colors"
          >
            <div className="text-sm">
              <div className="text-ink font-mono">{p.abbr}</div>
              <div className="text-[10px] text-muted-ink uppercase tracking-wider">
                {BLOC_LABEL[p.bloc]}
              </div>
            </div>
            <div className="relative h-6 bg-canvas-soft rounded">
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1 rounded-sm bg-ink/20"
                style={{ left: `${moeLeft}%`, width: `${moeWidth}%` }}
              />
              <div
                className="absolute top-0 bottom-0 rounded"
                style={{ width: `${w}%`, backgroundColor: partyColor(p), opacity: 0.85 }}
              />
            </div>
            <div className="text-right font-mono text-ink">{t.pct.toFixed(1)}%</div>
            <div className="text-right">
              <Delta value={deltaMap.get(p.id) ?? 0} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
