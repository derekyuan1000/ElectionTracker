import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader } from "@/components/site/Card";
import { BlocTag } from "@/components/site/BlocTag";
import { SectionTitle } from "@/components/site/SectionTitle";
import { activeParties, historicalParties, partyById } from "@/data/seed";
import { partyColor } from "@/lib/partyColor";
import { computeTrend } from "@/lib/trend";
import type { FullParty } from "@/data/types";

export const Route = createFileRoute("/political-parties/")({
  head: () => ({
    meta: [
      { title: "UK Political Parties Directory — ElectionTracker" },
      {
        name: "description",
        content:
          "Every active and historical UK political party, plotted on the political compass and ranked by policy position.",
      },
      { property: "og:title", content: "UK Political Parties Directory" },
      { property: "og:description", content: "Every UK political party on the political compass." },
    ],
  }),
  component: PartiesIndex,
});

const COMPASS_TOGGLES = [
  "conservative",
  "labour",
  "liberal-democrats",
  "snp",
  "plaid-cymru",
  "green-party",
  "reform-uk",
];

const REGIONAL_IDS = new Set(["dup", "sinn-fein", "sdlp", "alliance"]);

function PartiesIndex() {
  const trend = new Map(computeTrend().map((t) => [t.partyId, t.pct]));
  const active = activeParties();
  const historical = historicalParties();

  const majorParties = active.filter((p) => p.inPolls && p.id !== "others");
  const regionalParties = active.filter((p) => !p.inPolls && REGIONAL_IDS.has(p.id));
  const smallerParties = active.filter(
    (p) => !p.inPolls && !REGIONAL_IDS.has(p.id) && p.id !== "others",
  );

  const [enabled, setEnabled] = useState<Set<string>>(new Set(COMPASS_TOGGLES));
  const toggle = (id: string) =>
    setEnabled((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const [showRegional, setShowRegional] = useState(false);
  const [showSmaller, setShowSmaller] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-16">
      <SectionTitle
        eyebrow="Parties directory"
        title="Every UK party, plotted and compared."
        lead="Active Westminster parties and the major historical ones. Click any party for a full positioning profile, policy spider and election history."
      />

      {/* Political compass */}
      <Card>
        <CardHeader
          title="Political compass"
          subtitle="Vertical · Progressive ↔ Conservative · Horizontal · Social ↔ Market-oriented"
        />
        <div className="p-6 grid lg:grid-cols-[1fr_220px] gap-8">
          <Compass
            parties={active.filter((p) => COMPASS_TOGGLES.includes(p.id))}
            enabled={enabled}
          />
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-ink mb-2">
              Toggle parties
            </div>
            <div className="flex flex-wrap gap-2">
              {COMPASS_TOGGLES.map((id) => {
                const p = partyById(id)!;
                const on = enabled.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    className={`px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                      on
                        ? "bg-ink text-canvas border-ink"
                        : "bg-canvas text-body-ink border-hairline-strong"
                    }`}
                  >
                    {p.abbr}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 text-xs text-muted-ink leading-relaxed">
              Coordinates are editorial estimates and not derived from poll data.
            </div>
          </div>
        </div>
      </Card>

      {/* Party listings */}
      <div className="space-y-10">
        {/* Major parties — always visible */}
        <div>
          <SectionTitle eyebrow="Major parties" title="Currently contesting UK elections." />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {majorParties.map((p) => (
              <PartyCard key={p.id} party={p} trend={trend} />
            ))}
          </div>
        </div>

        {/* Regional parties — toggle */}
        <div>
          <button
            onClick={() => setShowRegional((s) => !s)}
            className="text-sm text-brand hover:text-brand-active"
          >
            {showRegional ? "− Hide" : "+ Show"} regional parties ({regionalParties.length})
          </button>
          {showRegional && (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionalParties.map((p) => (
                <PartyCard key={p.id} party={p} trend={trend} />
              ))}
            </div>
          )}
        </div>

        {/* Smaller parties — toggle */}
        <div>
          <button
            onClick={() => setShowSmaller((s) => !s)}
            className="text-sm text-brand hover:text-brand-active"
          >
            {showSmaller ? "− Hide" : "+ Show"} smaller parties ({smallerParties.length})
          </button>
          {showSmaller && (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {smallerParties.map((p) => (
                <PartyCard key={p.id} party={p} trend={trend} />
              ))}
            </div>
          )}
        </div>

        {/* Historical — toggle */}
        <div>
          <button
            onClick={() => setShowHistorical((s) => !s)}
            className="text-sm text-brand hover:text-brand-active"
          >
            {showHistorical ? "− Hide" : "+ Show"} historical parties ({historical.length})
          </button>
          {showHistorical && (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {historical.map((p) => (
                <Link
                  key={p.id}
                  to="/political-parties/$party"
                  params={{ party: p.id }}
                  className="block"
                >
                  <Card className="p-5 h-full hover:border-hairline-strong transition-colors">
                    <div className="font-mono text-ink">{p.abbr}</div>
                    <div className="mt-2 font-display text-lg text-ink leading-tight">{p.name}</div>
                    <div className="mt-1 text-xs text-muted-ink">{p.spectrumLabel}</div>
                    <p className="mt-3 text-sm text-body-ink leading-relaxed line-clamp-3">
                      {p.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PartyCard({ party: p, trend }: { party: FullParty; trend: Map<string, number> }) {
  return (
    <Link to="/political-parties/$party" params={{ party: p.id }} className="block group">
      <Card className="p-5 h-full border-hairline group-hover:border-hairline-strong group-hover:shadow-sm transition-all duration-150 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="font-mono text-ink">{p.abbr}</div>
          <div className="flex items-center gap-2">
            {trend.get(p.id) != null && (
              <span className="font-mono text-ink">{trend.get(p.id)!.toFixed(1)}%</span>
            )}
            <span className="text-muted-ink group-hover:text-ink group-hover:translate-x-0.5 transition-all duration-150">
              →
            </span>
          </div>
        </div>
        <div className="mt-2 font-display text-lg text-ink leading-tight">{p.name}</div>
        <div className="mt-1 text-xs text-muted-ink">{p.spectrumLabel}</div>
        <div className="mt-3 flex items-center justify-between">
          <BlocTag bloc={p.bloc} />
          <span className="text-xs text-muted-ink">{p.euStance}</span>
        </div>
        <p className="mt-3 text-sm text-body-ink leading-relaxed line-clamp-3">{p.description}</p>
      </Card>
    </Link>
  );
}

function Compass({
  parties,
  enabled,
}: {
  parties: ReturnType<typeof activeParties>;
  enabled: Set<string>;
}) {
  const SIZE = 360;
  const toX = (x: number) => SIZE / 2 + (x / 10) * (SIZE / 2 - 20);
  const toY = (y: number) => SIZE / 2 - (y / 10) * (SIZE / 2 - 20);
  return (
    <svg width={SIZE} height={SIZE} className="block mx-auto">
      <rect x="0" y="0" width={SIZE} height={SIZE} fill="var(--canvas-soft)" />
      <rect
        x="0"
        y="0"
        width={SIZE / 2}
        height={SIZE / 2}
        fill="var(--bloc-green)"
        opacity="0.08"
      />
      <rect
        x={SIZE / 2}
        y="0"
        width={SIZE / 2}
        height={SIZE / 2}
        fill="var(--bloc-liberal)"
        opacity="0.08"
      />
      <rect
        x="0"
        y={SIZE / 2}
        width={SIZE / 2}
        height={SIZE / 2}
        fill="var(--bloc-left)"
        opacity="0.08"
      />
      <rect
        x={SIZE / 2}
        y={SIZE / 2}
        width={SIZE / 2}
        height={SIZE / 2}
        fill="var(--bloc-farright)"
        opacity="0.08"
      />
      <line
        x1={SIZE / 2}
        y1="0"
        x2={SIZE / 2}
        y2={SIZE}
        stroke="var(--hairline-strong)"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1={SIZE / 2}
        x2={SIZE}
        y2={SIZE / 2}
        stroke="var(--hairline-strong)"
        strokeWidth="1"
      />
      <text x={SIZE / 2} y="12" fontSize="10" textAnchor="middle" fill="var(--muted-ink)">
        progressive
      </text>
      <text x={SIZE / 2} y={SIZE - 4} fontSize="10" textAnchor="middle" fill="var(--muted-ink)">
        conservative
      </text>
      <text x="4" y={SIZE / 2 - 4} fontSize="10" fill="var(--muted-ink)">
        social
      </text>
      <text x={SIZE - 4} y={SIZE / 2 - 4} fontSize="10" textAnchor="end" fill="var(--muted-ink)">
        market
      </text>
      {parties.map((p) => (
        <g
          key={p.id}
          style={{ opacity: enabled.has(p.id) ? 1 : 0, transition: "opacity 0.25s ease" }}
        >
          <circle
            cx={toX(p.compassX)}
            cy={toY(p.compassY)}
            r="11"
            fill={partyColor(p)}
            stroke="white"
            strokeWidth="1.5"
          />
          <text
            x={toX(p.compassX)}
            y={toY(p.compassY) + 4}
            fontSize="8"
            fontFamily="ui-monospace,monospace"
            fontWeight="700"
            textAnchor="middle"
            fill="white"
          >
            {p.abbr}
          </text>
        </g>
      ))}
    </svg>
  );
}
