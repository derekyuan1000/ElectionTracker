import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Card, CardHeader } from "@/components/site/Card";
import { BlocTag } from "@/components/site/BlocTag";
import { partyById, parties } from "@/data/seed";
import { computeTrend, deltaSinceLastElection, momentum90d } from "@/lib/trend";
import { usePollsContext } from "@/contexts/PollsContext";
import { POLICY_CATEGORIES, BLOC_COLOR, type PolicyCategory, type FullParty } from "@/data/types";
import { partyColor } from "@/lib/partyColor";
import { Delta } from "@/components/site/Delta";

export const Route = createFileRoute("/political-parties/$party")({
  loader: ({ params }) => {
    const p = partyById(params.party);
    if (!p) throw notFound();
    return { party: p };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.party.name} — UK party profile` },
            {
              name: "description",
              content: `${loaderData.party.name}: positioning, policy spider, election history and EU stance.`,
            },
            { property: "og:title", content: `${loaderData.party.name} — UK party profile` },
            {
              property: "og:description",
              content: `Positioning, policy spider and election history.`,
            },
          ],
        }
      : {},
  component: PartyDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-3xl">Party not found</h1>
      <p className="mt-3 text-body-ink">We don't track this party — yet.</p>
      <Link to="/political-parties" className="mt-6 inline-block text-sm text-brand">
        ← Back to directory
      </Link>
    </div>
  ),
});

function PartyDetail() {
  const { party } = Route.useLoaderData() as { party: FullParty };
  const { polls } = usePollsContext();
  const trendMap = new Map(computeTrend(undefined, polls).map((t) => [t.partyId, t.pct]));
  const deltaMap = new Map(
    deltaSinceLastElection(undefined, polls).map((d) => [d.partyId, d.delta]),
  );
  const momMap = new Map(momentum90d(undefined, polls).map((m) => [m.partyId, m.swing]));
  const pct = trendMap.get(party.id);
  const delta = deltaMap.get(party.id);
  const mom = momMap.get(party.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-12">
      <div>
        <Link to="/political-parties" className="text-sm text-brand">
          ← All parties
        </Link>
      </div>

      {/* Overview */}
      <header className="border-b border-hairline pb-8">
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-ink">
              {party.spectrumLabel} · 🇬🇧 United Kingdom
            </div>
            <h1 className="text-5xl mt-2">{party.name}</h1>
            <div className="mt-2 text-sm text-body-ink">
              <span className="font-mono text-ink">{party.abbr}</span>
              {party.leader !== "—" && (
                <>
                  {" "}
                  · Leader: <span className="text-ink">{party.leader}</span>
                </>
              )}
              <>
                {" "}
                · EP group: <span className="text-ink">{party.euGroup}</span>
              </>
            </div>
          </div>
          <BlocTag bloc={party.bloc} className="text-sm" />
        </div>
        <p className="mt-5 text-body-ink leading-relaxed max-w-3xl">{party.description}</p>
      </header>

      {/* Key metrics */}
      {party.inPolls && pct != null ? (
        <section className="grid sm:grid-cols-3 gap-4">
          <Metric
            label="Current poll standing"
            value={`${pct.toFixed(1)}%`}
            hint="weighted trend"
          />
          <Metric
            label="Change since 2024"
            value={<Delta value={delta ?? 0} />}
            hint="vs. July 2024 general election"
          />
          <Metric
            label="3-month momentum"
            value={<Delta value={mom ?? 0} />}
            hint="vs. 60–120 days ago"
          />
        </section>
      ) : (
        <Card className="p-5 text-sm text-muted-ink">
          This party is not included in the topline Westminster voting-intention breakdown — its
          support is aggregated into "Others" on poll cards.
        </Card>
      )}

      {/* Compass + EU stance */}
      <section className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Political compass position" />
          <div className="p-6 flex items-center justify-center">
            <MiniCompass party={party} />
          </div>
        </Card>
        <Card>
          <CardHeader title="EU stance" />
          <div className="p-6">
            <div className="relative h-2 bg-canvas-soft rounded">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{
                  left: `${((party.euStanceScore + 10) / 20) * 100}%`,
                  backgroundColor: "var(--brand)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-ink font-mono">
              <span>Anti-EU</span>
              <span>Neutral</span>
              <span>Pro-EU</span>
            </div>
            <div className="mt-6 text-sm text-body-ink">
              Editorial classification: <span className="text-ink">{party.euStance}</span> (score{" "}
              <span className="font-mono">
                {party.euStanceScore > 0 ? "+" : ""}
                {party.euStanceScore}
              </span>{" "}
              on a −10 to +10 scale).
            </div>
          </div>
        </Card>
      </section>

      {/* Policy radar + per-category */}
      <section>
        <Card>
          <CardHeader
            title="Policy positions"
            subtitle="Scores 0 (left/progressive) … 100 (right/conservative). Δ vs. prior cycle where known."
          />
          <div className="p-6 grid lg:grid-cols-[280px_1fr] gap-8">
            <Radar party={party} />
            <div className="space-y-4">
              {POLICY_CATEGORIES.map((cat) => {
                const v = party.policy[cat];
                const prev = party.policyPrev?.[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink">{cat}</span>
                      <span className="font-mono text-muted-ink">
                        {v}
                        {prev != null && (
                          <span
                            className={`ml-2 ${v - prev > 0 ? "text-down" : v - prev < 0 ? "text-up" : ""}`}
                          >
                            ({v - prev > 0 ? "+" : ""}
                            {v - prev} vs prev)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2 bg-canvas-soft rounded">
                      <div
                        className="h-full rounded"
                        style={{ width: `${v}%`, backgroundColor: partyColor(party) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* Target voter */}
      <section>
        <Card className="p-6">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-ink">
            Target voter profile
          </div>
          <p className="mt-2 text-body-ink leading-relaxed">{party.targetVoter}</p>
        </Card>
      </section>

      {/* Election history */}
      {party.historicResults && party.historicResults.length > 0 && (
        <section>
          <Card>
            <CardHeader
              title="Election results"
              subtitle="Vote share and seats across past UK General Elections."
            />
            <div className="p-6">
              <ResultsChart results={party.historicResults} color={partyColor(party)} />
              <table className="w-full mt-6 text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-muted-ink">
                  <tr className="border-b border-hairline-soft">
                    <th className="text-left py-2">Year</th>
                    <th className="text-right py-2">Vote share</th>
                    <th className="text-right py-2">Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {party.historicResults.map((r) => (
                    <tr key={r.year} className="border-b border-hairline-soft last:border-b-0">
                      <td className="py-2 font-mono text-ink">{r.year}</td>
                      <td className="py-2 text-right font-mono text-ink">{r.pct.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono text-ink">{r.seats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {party.govShareLifetime != null && (
                <p className="mt-4 text-sm text-muted-ink">
                  Estimated share of time in government, post-war era:{" "}
                  <span className="font-mono text-ink">{party.govShareLifetime}%</span>.
                </p>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Cross-links */}
      <section className="grid sm:grid-cols-3 gap-3 text-sm">
        <Link
          to="/political-parties"
          className="px-4 py-3 border border-hairline rounded-md hover:border-hairline-strong text-body-ink hover:text-ink"
        >
          ← Back to directory
        </Link>
        <Link
          to="/elections"
          className="px-4 py-3 border border-hairline rounded-md hover:border-hairline-strong text-body-ink hover:text-ink"
        >
          Election results →
        </Link>
        <Link
          to="/"
          className="px-4 py-3 border border-hairline rounded-md hover:border-hairline-strong text-body-ink hover:text-ink"
        >
          Current poll trend →
        </Link>
      </section>

      <div className="text-xs text-muted-ink">
        {parties.length} parties tracked. Coordinates and policy scores are editorial estimates.
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-mono uppercase tracking-wider text-muted-ink">{label}</div>
      <div className="mt-2 font-display text-3xl text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-ink">{hint}</div>}
    </Card>
  );
}

function MiniCompass({ party }: { party: FullParty }) {
  const SIZE = 220;
  const cx = SIZE / 2 + (party.compassX / 10) * (SIZE / 2 - 12);
  const cy = SIZE / 2 - (party.compassY / 10) * (SIZE / 2 - 12);
  return (
    <svg width={SIZE} height={SIZE}>
      <rect x="0" y="0" width={SIZE} height={SIZE} fill="var(--canvas-soft)" />
      <line x1={SIZE / 2} y1="0" x2={SIZE / 2} y2={SIZE} stroke="var(--hairline-strong)" />
      <line x1="0" y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="var(--hairline-strong)" />
      <text x={SIZE / 2} y="10" fontSize="9" textAnchor="middle" fill="var(--muted-ink)">
        progressive
      </text>
      <text x={SIZE / 2} y={SIZE - 2} fontSize="9" textAnchor="middle" fill="var(--muted-ink)">
        conservative
      </text>
      <text x="2" y={SIZE / 2 - 4} fontSize="9" fill="var(--muted-ink)">
        social
      </text>
      <text x={SIZE - 2} y={SIZE / 2 - 4} fontSize="9" textAnchor="end" fill="var(--muted-ink)">
        market
      </text>
      <circle cx={cx} cy={cy} r="9" fill={partyColor(party)} stroke="white" strokeWidth="2" />
    </svg>
  );
}

function Radar({ party }: { party: FullParty }) {
  const SIZE = 260;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = SIZE / 2 - 32;
  const n = POLICY_CATEGORIES.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, v: number) => {
    const r = (v / 100) * R;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };
  const path =
    POLICY_CATEGORIES.map((c, i) => {
      const [x, y] = pt(i, party.policy[c] ?? 50);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ") + " Z";
  return (
    <svg width={SIZE} height={SIZE} className="block mx-auto">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={POLICY_CATEGORIES.map((_, i) => {
            const x = cx + Math.cos(angle(i)) * R * s;
            const y = cy + Math.sin(angle(i)) * R * s;
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke="var(--hairline)"
        />
      ))}
      {POLICY_CATEGORIES.map((c: PolicyCategory, i) => {
        const [x, y] = pt(i, 110);
        return (
          <text key={c} x={x} y={y} fontSize="9" textAnchor="middle" fill="var(--muted-ink)">
            {c.split(" ")[0]}
          </text>
        );
      })}
      <path
        d={path}
        fill={partyColor(party)}
        fillOpacity="0.35"
        stroke={partyColor(party)}
        strokeWidth="2"
      />
    </svg>
  );
}

function ResultsChart({
  results,
  color,
}: {
  results: { year: number; pct: number; seats: number }[];
  color: string;
}) {
  const sorted = results.slice().sort((a, b) => a.year - b.year);
  const max = Math.max(...sorted.map((r) => r.pct), 50);
  const W = 520,
    H = 140,
    PAD = 24;
  const xs = (i: number) => PAD + (i / Math.max(1, sorted.length - 1)) * (W - PAD * 2);
  const ys = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const d = sorted.map((r, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(r.pct)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--hairline-strong)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
      {sorted.map((r, i) => (
        <g key={r.year}>
          <circle cx={xs(i)} cy={ys(r.pct)} r="3.5" fill={color} />
          <text x={xs(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--muted-ink)">
            {r.year}
          </text>
          <text x={xs(i)} y={ys(r.pct) - 8} fontSize="9" textAnchor="middle" fill="var(--ink)">
            {r.pct.toFixed(1)}%
          </text>
        </g>
      ))}
    </svg>
  );
}
