import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHeader } from "@/components/site/Card";
import { SectionTitle } from "@/components/site/SectionTitle";
import { country, elections, partyById } from "@/data/seed";
import { partyColor } from "@/lib/partyColor";
import { fmtDate } from "@/lib/format";
import { useWikiLeaders, pmNamesMatch } from "@/lib/useWikiLeaders";

export const Route = createFileRoute("/elections")({
  head: () => ({
    meta: [
      { title: "UK Election Results & History — ElectionTracker" },
      {
        name: "description",
        content:
          "Vote share, seat outcomes and government formation for recent and historic UK General Elections.",
      },
      { property: "og:title", content: "UK Election Results & History" },
      {
        property: "og:description",
        content: "Vote share, seat outcomes and government formation across UK general elections.",
      },
    ],
  }),
  component: ElectionsPage,
});

function ElectionsPage() {
  const uk = elections["united-kingdom"];
  const wikiLeaders = useWikiLeaders();
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 space-y-12">
      <SectionTitle
        eyebrow="Elections & history"
        title="Latest election results and historic outcomes."
        lead="Vote share, seat outcomes and the coalition that ultimately formed government."
      />

      {/* Composition of current government */}
      <Card>
        <CardHeader title="Composition of the current UK government" />
        <div className="p-6 grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-ink">
              Head of State
            </div>
            <div className="mt-1 text-ink font-display text-xl">
              {wikiLeaders.monarch ?? "King Charles III"}
            </div>
            <div className="mt-1 text-body-ink">Acceded 8 September 2022.</div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-ink">
              Prime Minister
            </div>
            <div className="mt-1 text-ink font-display text-xl">
              {(() => {
                const seed = country.headOfGovernment;
                const wiki = wikiLeaders.pm;
                const wikiIsNew = wiki && !pmNamesMatch(wiki, seed.name);
                if (wikiIsNew) return wiki;
                return seed.name;
              })()}{" "}
              {(() => {
                const seed = country.headOfGovernment;
                const wiki = wikiLeaders.pm;
                const wikiIsNew = wiki && !pmNamesMatch(wiki, seed.name);
                if (!wikiIsNew && seed.resignedDate) {
                  return <span className="text-down text-base font-mono">(resigned)</span>;
                }
                return (
                  <span className="text-muted-ink text-base">
                    ({partyById(seed.partyId)?.name})
                  </span>
                );
              })()}
            </div>
            <div className="mt-1 text-body-ink">
              {(() => {
                const seed = country.headOfGovernment;
                const wiki = wikiLeaders.pm;
                const wikiIsNew = wiki && !pmNamesMatch(wiki, seed.name);
                if (wikiIsNew) return `Current Prime Minister.`;
                if (seed.resignedDate)
                  return `In office ${fmtDate(seed.since)} – ${fmtDate(seed.resignedDate)}.`;
                return `In office since ${fmtDate(seed.since)}.`;
              })()}
            </div>
          </div>
        </div>
      </Card>

      {/* Past elections */}
      <div className="space-y-8">
        {uk.map((e) => (
          <Card key={e.date}>
            <CardHeader
              title={`General Election ${new Date(e.date).getFullYear()}`}
              subtitle={`${fmtDate(e.date)} · turnout ${e.turnout}%`}
              right={
                <div className="text-xs font-mono text-muted-ink">
                  Government formed:{" "}
                  <span className="text-ink">
                    {e.coalitionFormed.map((id) => partyById(id)?.abbr).join(" + ")}
                  </span>
                </div>
              }
            />
            <div className="p-6">
              <ResultBars results={e.results} total={country.parliamentSize} />
            </div>
          </Card>
        ))}
      </div>

      <div className="text-sm">
        <Link to="/" className="text-brand">
          ← Back to the trend
        </Link>
      </div>
    </div>
  );
}

function ResultBars({
  results,
  total,
}: {
  results: { partyId: string; pct: number; seats: number }[];
  total: number;
}) {
  const sorted = results.slice().sort((a, b) => b.seats - a.seats);
  return (
    <div>
      {/* Seat strip */}
      <div className="h-8 w-full bg-canvas-soft border border-hairline rounded overflow-hidden flex">
        {sorted.map((r) => {
          const p = partyById(r.partyId);
          if (!p) return null;
          return (
            <div
              key={r.partyId}
              style={{ width: `${(r.seats / total) * 100}%`, backgroundColor: partyColor(p) }}
              className="border-r border-white/40 last:border-r-0 text-[10px] font-mono text-ink/80 flex items-center justify-center"
              title={`${p.abbr} — ${r.seats} seats`}
            >
              {(r.seats / total) * 100 > 6 ? p.abbr : ""}
            </div>
          );
        })}
      </div>
      <table className="w-full mt-6 text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-muted-ink">
          <tr className="border-b border-hairline-soft">
            <th className="text-left py-2">Party</th>
            <th className="text-right py-2">Vote share</th>
            <th className="text-right py-2">Seats</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const p = partyById(r.partyId);
            if (!p) return null;
            return (
              <tr key={r.partyId} className="border-b border-hairline-soft last:border-b-0">
                <td className="py-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: partyColor(p) }}
                  />
                  <Link
                    to="/political-parties/$party"
                    params={{ party: p.id }}
                    className="text-ink hover:text-brand"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="py-2 text-right font-mono text-ink">{r.pct.toFixed(1)}%</td>
                <td className="py-2 text-right font-mono text-ink">{r.seats}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
