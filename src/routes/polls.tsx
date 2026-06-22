import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader } from "@/components/site/Card";
import { SectionTitle } from "@/components/site/SectionTitle";
import { usePollsContext } from "@/contexts/PollsContext";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/polls")({
  head: () => ({
    meta: [
      { title: "Latest UK Polls — ElectionTracker" },
      {
        name: "description",
        content:
          "Every recent Westminster voting-intention poll, with fieldwork dates, sample sizes and institute reliability scores.",
      },
      { property: "og:title", content: "Latest UK Polls — ElectionTracker" },
      {
        property: "og:description",
        content: "Recent Westminster voting-intention polls and institute reliability.",
      },
    ],
  }),
  component: PollsPage,
});

function PollsPage() {
  const { polls, institutes, isLoading, lastUpdated } = usePollsContext();
  const [shown, setShown] = useState(10);
  const visible = polls.slice(0, shown);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-14">
      <SectionTitle
        eyebrow="Latest polls"
        title="Every Westminster voting-intention poll in the database."
        lead={
          isLoading
            ? "Fetching live data from Wikipedia…"
            : lastUpdated
              ? `Live data from Wikipedia · last fetched ${new Date(lastUpdated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. Most recent fieldwork first.`
              : "Most recent fieldwork first. Sample sizes vary; weighting in the trend follows the methodology."
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-ink border-b border-hairline-soft">
                <th className="px-4 py-3 font-medium">Institute</th>
                <th className="px-4 py-3 font-medium">Fieldwork end</th>
                <th className="px-4 py-3 font-medium text-right">Sample</th>
                <th className="px-4 py-3 font-medium text-right">LAB</th>
                <th className="px-4 py-3 font-medium text-right">CON</th>
                <th className="px-4 py-3 font-medium text-right">REF</th>
                <th className="px-4 py-3 font-medium text-right">LD</th>
                <th className="px-4 py-3 font-medium text-right">GRN</th>
                <th className="px-4 py-3 font-medium text-right">SNP</th>
                <th className="px-4 py-3 font-medium text-right">PC</th>
                <th className="px-4 py-3 font-medium text-right">OTH</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const inst = institutes.find((i) => i.id === p.instituteId)!;
                const cell = (id: string) =>
                  p.results[id] != null ? p.results[id].toFixed(1) : "—";
                return (
                  <tr
                    key={p.id}
                    className="border-b border-hairline-soft last:border-b-0 hover:bg-canvas-soft"
                  >
                    <td className="px-4 py-3 text-ink">{inst.name}</td>
                    <td className="px-4 py-3 font-mono text-body-ink">{fmtDate(p.fieldworkEnd)}</td>
                    <td className="px-4 py-3 font-mono text-right text-body-ink">
                      {p.sampleSize.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-ink">{cell("labour")}</td>
                    <td className="px-4 py-3 font-mono text-right text-ink">
                      {cell("conservative")}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-ink">{cell("reform-uk")}</td>
                    <td className="px-4 py-3 font-mono text-right text-ink">
                      {cell("liberal-democrats")}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-ink">
                      {cell("green-party")}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-ink">{cell("snp")}</td>
                    <td className="px-4 py-3 font-mono text-right text-ink">
                      {cell("plaid-cymru")}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-muted-ink">
                      {cell("others")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown < polls.length && (
          <div className="px-6 py-4 border-t border-hairline-soft text-center">
            <button
              onClick={() => setShown((s) => Math.min(s + 10, polls.length))}
              className="text-sm text-brand hover:text-brand-active"
            >
              More… ({polls.length - shown} remaining)
            </button>
          </div>
        )}
      </Card>

      <div>
        <SectionTitle
          eyebrow="Polling firm reliability"
          title="Which institutes are the most reliable?"
          lead="Ranked by historical accuracy against final election results, most accurate first."
        />
        <Card className="mt-8">
          <ul className="divide-y divide-hairline-soft">
            {institutes
              .slice()
              .sort((a, b) => b.reliability - a.reliability)
              .map((inst, idx) => {
                const latest = polls.find((p) => p.instituteId === inst.id);
                return (
                  <li key={inst.id} className="flex items-center gap-4 px-6 py-3">
                    <span className="text-xs font-mono text-muted-ink w-5 tabular-nums text-right">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 text-ink">{inst.name}</span>
                    {latest && (
                      <span className="text-xs font-mono text-muted-ink">
                        {fmtDate(latest.fieldworkEnd)}
                      </span>
                    )}
                  </li>
                );
              })}
          </ul>
        </Card>
      </div>

      <div className="text-sm">
        <Link to="/" className="text-brand">
          ← Back to the trend
        </Link>
      </div>
    </div>
  );
}
