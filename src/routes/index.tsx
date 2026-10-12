import { Link, createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader } from "@/components/site/Card";
import { TrendBar } from "@/components/site/TrendBar";
import { SeatBar } from "@/components/site/SeatBar";
import { Delta } from "@/components/site/Delta";
import { SectionTitle } from "@/components/site/SectionTitle";
import { TrendChart } from "@/components/site/TrendChart";
import { Reveal } from "@/components/site/Reveal";
import { CountUp } from "@/components/site/CountUp";
import {
  computeTrend,
  deltaSinceLastElection,
  lastElection,
  momentum30d,
  momentum90d,
  governmentSeatTotal,
  seatProjection,
  coalitionScenarios,
} from "@/lib/trend";
import { AS_OF, country, partyById } from "@/data/seed";
import { usePollsContext } from "@/contexts/PollsContext";
import { BLOC_LABEL, BLOC_COLOR, type Bloc } from "@/data/types";
import { partyColor } from "@/lib/partyColor";
import { fmtCountdown, fmtDate } from "@/lib/format";
import { useWikiLeaders, pmNamesMatch } from "@/lib/useWikiLeaders";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UK Polling Trend — ElectionTracker" },
      {
        name: "description",
        content:
          "Weighted polling average, seat projection, momentum and coalition scenarios for the United Kingdom.",
      },
      { property: "og:title", content: "UK Polling Trend — ElectionTracker" },
      {
        property: "og:description",
        content:
          "Weighted polling average, seat projection and coalition scenarios for the United Kingdom.",
      },
    ],
  }),
  component: Home,
});

function spectrumGroup(bloc: string): "left" | "grand" | "right" {
  if (["farleft", "left", "centerleft", "green", "Left-led"].includes(bloc)) return "left";
  if (["farright", "right", "centerright", "Right-led"].includes(bloc)) return "right";
  return "grand";
}

const BLOC_LEGEND: { bloc: Bloc; meaning: string }[] = [
  { bloc: "farleft", meaning: "Hard left economic & social policy" },
  { bloc: "left", meaning: "Left-wing" },
  { bloc: "centerleft", meaning: "Moderate left" },
  { bloc: "center", meaning: "Centrist" },
  { bloc: "liberal", meaning: "Liberal / big-tent" },
  { bloc: "centerright", meaning: "Moderate right" },
  { bloc: "right", meaning: "Right-wing" },
  { bloc: "farright", meaning: "Hard right" },
  { bloc: "green", meaning: "Green / ecologist" },
  { bloc: "regional", meaning: "Regional / nationalist" },
];

function Home() {
  const { polls, institutes, lastUpdated, isFetching } = usePollsContext();
  const wikiLeaders = useWikiLeaders();
  const trend = computeTrend(undefined, polls);
  const deltas = deltaSinceLastElection(undefined, polls);
  const mom30 = momentum30d(undefined, polls);
  const mom90 = momentum90d(undefined, polls);
  const seats = seatProjection(undefined, polls);
  const govSeats = governmentSeatTotal(undefined, polls);
  const govPct = +((govSeats / country.parliamentSize) * 100).toFixed(1);
  const leader = trend[0];
  const leaderParty = partyById(leader.partyId)!;
  const lastEl = lastElection()!;
  const gainer = mom90.filter((m) => m.partyId !== "others")[0];
  const loser = mom30.filter((m) => m.partyId !== "others").slice(-1)[0];
  const coalitions = coalitionScenarios(undefined, polls);
  const recentPolls = polls.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="pt-16 pb-10 border-b border-hairline stagger">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-ink">
          <span className="text-brand animate-pulse-dot inline-block">●</span>
          <span>As of: {fmtDate(lastUpdated ?? AS_OF)}</span>
          <span className="text-hairline-strong">·</span>
          <span>{polls.length} polls in trend</span>
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[1.05] max-w-4xl">
          <span className="text-ink">
            <Link
              to="/political-parties/$party"
              params={{ party: leader.partyId }}
              className="hover:text-brand transition-colors"
            >
              {leaderParty.name}
            </Link>{" "}
            leading
          </span>
          <span className="text-muted-ink">
            {" "}
            at <CountUp value={leader.pct} decimals={1} />% in the UK polling trend.
          </span>
        </h1>
        <p className="mt-5 text-lg text-body-ink max-w-3xl leading-relaxed">
          ElectionTracker aggregates Westminster voting-intention polls from {institutes.length} UK
          institutes, weights them by recency and methodological reliability, and projects what the
          House of Commons would look like if a general election happened today.
        </p>
      </section>

      {/* Trend */}
      <Reveal as="section" className="py-12 border-b border-hairline space-y-6">
        <Card>
          <CardHeader
            title="Current voting intention"
            subtitle="Weighted average of polls fielded in the last ~90 days. Bars show ±MoE."
          />
          <TrendBar trend={trend} deltas={deltas} />
          <div className="px-6 py-3 border-t border-hairline-soft text-xs font-mono text-muted-ink">
            Δ shown vs. {fmtDate(lastEl.date)} General Election.
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Polling trend over time"
            subtitle="Smoothed, reliability-weighted average. Hover a party to isolate it."
            right={<LiveBadge fetching={isFetching} lastUpdated={lastUpdated} />}
          />
          <TrendChart polls={polls} partyIds={trend.map((t) => t.partyId).filter((id) => id !== "others")} />
        </Card>
      </Reveal>

      {/* Government & outlook */}
      <Reveal as="section" className="py-12 border-b border-hairline grid md:grid-cols-3 gap-6 stagger">
        <Card className="p-6 card-lift">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-ink">
            Governing parties
          </div>
          <div className="mt-1 text-ink font-display text-xl">
            {country.governingParties.map((id, idx) => {
              const p = partyById(id);
              return (
                <span key={id}>
                  {idx > 0 && " + "}
                  <Link
                    to="/political-parties/$party"
                    params={{ party: id }}
                    className="hover:text-brand transition-colors"
                  >
                    {p?.name}
                  </Link>
                </span>
              );
            })}
          </div>
          <div className="mt-5 font-mono text-4xl text-ink">
            <CountUp value={govPct} decimals={1} />%
          </div>
          <div className="text-sm text-body-ink mt-1">
            of seats on current trend — <span className="font-mono">{govSeats}</span> of{" "}
            {country.parliamentSize}
          </div>
          <div className="mt-4 text-xs text-muted-ink leading-relaxed">
            Majority threshold is{" "}
            <span className="font-mono text-ink">{country.majorityThreshold}</span> seats. On these
            numbers the government would{" "}
            <strong className={govSeats >= country.majorityThreshold ? "text-up" : "text-down"}>
              {govSeats >= country.majorityThreshold ? "retain" : "lose"}
            </strong>{" "}
            its majority.
          </div>
        </Card>
        <Card className="p-6 card-lift">
          <div className="text-xs font-mono uppercase tracking-wider text-up">
            Gaining momentum · 90d
          </div>
          <div className="mt-1 text-ink font-display text-xl">
            <Link
              to="/political-parties/$party"
              params={{ party: gainer.partyId }}
              className="hover:text-brand transition-colors"
            >
              {partyById(gainer.partyId)?.name}
            </Link>
          </div>
          <div className="mt-5 text-4xl">
            <Delta value={gainer.swing} />
          </div>
          <div className="text-sm text-body-ink mt-1">points vs. 60–120 days ago</div>
          <div className="mt-4 text-xs text-muted-ink">
            Largest weighted gain across the eight topline parties.
          </div>
        </Card>
        <Card className="p-6 card-lift">
          <div className="text-xs font-mono uppercase tracking-wider text-down">
            Losing ground · 30d
          </div>
          <div className="mt-1 text-ink font-display text-xl">
            <Link
              to="/political-parties/$party"
              params={{ party: loser.partyId }}
              className="hover:text-brand transition-colors"
            >
              {partyById(loser.partyId)?.name}
            </Link>
          </div>
          <div className="mt-5 text-4xl">
            <Delta value={loser.swing} />
          </div>
          <div className="text-sm text-body-ink mt-1">points vs. 30–60 days ago</div>
          <div className="mt-4 text-xs text-muted-ink">
            Steepest short-term decline among the topline parties.
          </div>
        </Card>
      </Reveal>

      {/* Next election */}
      <Reveal as="section" className="py-12 border-b border-hairline grid md:grid-cols-[1fr_1.3fr] gap-10 items-center">
        <div>
          <SectionTitle eyebrow="Election outlook" title="Next General Election: 2029." />
          <p className="mt-4 text-body-ink leading-relaxed">
            Scheduled by the Dissolution and Calling of Parliament Act for{" "}
            <span className="font-mono text-ink">{fmtDate(country.nextElection)}</span> —{" "}
            {fmtCountdown(country.nextElection)}. The Prime Minister retains the prerogative to call
            an earlier poll.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-ink">Head of State</dt>
            <dd className="text-ink">{wikiLeaders.monarch ?? "King Charles III"}</dd>
            <dt className="text-muted-ink">Prime Minister</dt>
            <dd className="text-ink">
              {(() => {
                const seed = country.headOfGovernment;
                const wiki = wikiLeaders.pm;
                const seedResigned = !!seed.resignedDate;
                const wikiIsNew = wiki && !pmNamesMatch(wiki, seed.name);
                if (wikiIsNew) {
                  return (
                    <>
                      {wiki}{" "}
                      <span className="text-xs text-muted-ink font-mono">
                        (prev: {seed.name} — resigned)
                      </span>
                    </>
                  );
                }
                return (
                  <>
                    {seed.name}{" "}
                    {seedResigned && (
                      <span className="text-xs text-down font-mono">(resigned)</span>
                    )}{" "}
                    (
                    <Link
                      to="/political-parties/$party"
                      params={{ party: seed.partyId }}
                      className="text-brand hover:text-brand-active transition-colors"
                    >
                      {partyById(seed.partyId)?.abbr}
                    </Link>
                    )
                  </>
                );
              })()}
            </dd>
            <dt className="text-muted-ink">Government type</dt>
            <dd className="text-ink">{country.governmentType}</dd>
            <dt className="text-muted-ink">Memberships</dt>
            <dd className="text-ink font-mono text-xs">{country.memberships.join(" · ")}</dd>
          </dl>
        </div>
        <Card>
          <CardHeader
            title="Projected House of Commons"
            subtitle="On the current trend, allocated by the FPTP proxy."
          />
          <div className="px-6 pb-6 pt-4">
            <SeatBar
              seats={seats}
              total={country.parliamentSize}
              majority={country.majorityThreshold}
            />
          </div>
          <div className="px-6 pb-5 flex items-center justify-between gap-4">
            <Link to="/projection" className="text-sm text-brand hover:text-brand-active">
              Full projection →
            </Link>
            <Link to="/elections" className="text-sm text-brand hover:text-brand-active">
              Past elections →
            </Link>
          </div>
        </Card>
      </Reveal>

      {/* Coalitions & FPTP explainer */}
      <Reveal as="section" className="py-12 border-b border-hairline space-y-8">
        <div className="max-w-xl">
          <SectionTitle eyebrow="Electoral system" title="First-past-the-post." />
          <p className="mt-4 text-body-ink leading-relaxed">
            The UK uses First-Past-The-Post: 650 constituencies each elect one MP, and whichever
            candidate gets the most votes wins — no majority required. Parties rarely need to share
            power; since 1945, formal coalitions have been the exception, not the rule.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-500 via-purple-300 to-blue-600" />
          <CardHeader
            title="Possible coalitions"
            subtitle="Grouped by ideological lean · adjusts with the current poll trend."
          />
          {coalitions.length === 0 ? (
            <p className="px-6 py-5 text-sm text-muted-ink">
              No combination currently clears a Commons majority.
            </p>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-hairline-soft">
              {(["left", "grand", "right"] as const).map((group) => {
                const filtered = coalitions.filter((c) => spectrumGroup(c.bloc) === group);
                const label =
                  group === "left"
                    ? "← Left-leaning"
                    : group === "grand"
                      ? "Grand coalition"
                      : "Right-leaning →";
                const labelClass =
                  group === "left"
                    ? "text-rose-600"
                    : group === "right"
                      ? "text-blue-600"
                      : "text-muted-ink text-center";
                return (
                  <div key={group}>
                    <div
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider border-b border-hairline-soft ${labelClass}`}
                    >
                      {label}
                    </div>
                    {filtered.length === 0 ? (
                      <div className="px-4 py-4 text-xs text-muted-ink">None viable</div>
                    ) : (
                      <ul className="divide-y divide-hairline-soft">
                        {filtered.map((c, i) => (
                          <li key={i} className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mb-0.5">
                              {c.ids.map((id, idx) => {
                                const p = partyById(id);
                                if (!p) return null;
                                return (
                                  <span key={id} className="inline-flex items-center gap-1">
                                    {idx > 0 && <span className="text-muted-ink text-xs">+</span>}
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: partyColor(p) }}
                                    />
                                    <Link
                                      to="/political-parties/$party"
                                      params={{ party: id }}
                                      className="font-mono text-sm hover:text-brand transition-colors"
                                    >
                                      {p.abbr}
                                    </Link>
                                  </span>
                                );
                              })}
                            </div>
                            <div className="text-[10px] font-mono text-muted-ink">
                              {c.seats} seats · {c.share}%
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Reveal>

      {/* Latest polls */}
      <Reveal as="section" className="py-12 border-b border-hairline">
        <div className="flex items-end justify-between gap-6 mb-6">
          <SectionTitle
            eyebrow="Latest polls at a glance"
            title="The six most recent fieldwork dates."
          />
          <Link
            to="/polls"
            className="text-sm text-brand hover:text-brand-active whitespace-nowrap"
          >
            More polls →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {recentPolls.map((p) => {
            const inst = institutes.find((i) => i.id === p.instituteId)!;
            const top = Object.entries(p.results)
              .filter(([id]) => id !== "others")
              .sort((a, b) => (b[1] as number) - (a[1] as number));
            return (
              <Card key={p.id} className="p-5 card-lift">
                <div className="flex items-baseline justify-between">
                  <Link
                    to="/polls"
                    className="font-display text-lg text-ink hover:text-brand transition-colors"
                  >
                    {inst.name}
                  </Link>
                  <div className="font-mono text-xs text-muted-ink">{fmtDate(p.fieldworkEnd)}</div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {top.slice(0, 5).map(([id, pct]) => {
                    const party = partyById(id)!;
                    return (
                      <div
                        key={id}
                        className="grid grid-cols-[14px_50px_1fr_42px] items-center gap-2 text-sm"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: partyColor(party) }}
                        />
                        <Link
                          to="/political-parties/$party"
                          params={{ party: id }}
                          className="font-mono text-ink hover:text-brand transition-colors"
                        >
                          {party.abbr}
                        </Link>
                        <div className="h-1.5 bg-canvas-soft rounded overflow-hidden">
                          <div
                            className="h-full rounded bar-grow"
                            style={{
                              width: `${Math.min(100, (pct as number) * 2.6)}%`,
                              backgroundColor: partyColor(party),
                              opacity: 0.85,
                            }}
                          />
                        </div>
                        <span className="font-mono text-ink text-right">
                          {(pct as number).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-ink">
                  Sample {p.sampleSize.toLocaleString()} · published {fmtDate(p.publishDate)}
                </div>
              </Card>
            );
          })}
        </div>
      </Reveal>

      {/* Ideology legend */}
      <Reveal as="section" className="py-12 border-b border-hairline">
        <SectionTitle eyebrow="Key" title="Orientation legend." />
        <p className="mt-3 text-body-ink max-w-2xl leading-relaxed">
          Each party is classified on a single primary axis, used to colour bars and seat strips
          throughout the site. Full positioning lives on each{" "}
          <Link to="/political-parties" className="text-brand hover:text-brand-active">
            party page
          </Link>
          .
        </p>

        {/* Left–right spectrum cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 stagger">
          {BLOC_LEGEND.filter(({ bloc }) => !["green", "regional"].includes(bloc)).map(
            ({ bloc, meaning }) => (
              <div key={bloc} className="rounded border border-hairline overflow-hidden card-lift">
                <div className="h-2" style={{ backgroundColor: BLOC_COLOR[bloc] }} />
                <div className="p-2.5">
                  <div className="text-[11px] font-medium text-ink leading-tight">
                    {BLOC_LABEL[bloc]}
                  </div>
                  <div className="text-[10px] text-muted-ink leading-snug mt-0.5">{meaning}</div>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Spectrum bar + axis labels */}
        <div className="mt-3 flex h-1.5 rounded-full overflow-hidden">
          {BLOC_LEGEND.filter(({ bloc }) => !["green", "regional"].includes(bloc)).map(
            ({ bloc }) => (
              <div key={bloc} className="flex-1" style={{ backgroundColor: BLOC_COLOR[bloc] }} />
            ),
          )}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-ink mt-1">
          <span>← Left</span>
          <span>Right →</span>
        </div>

        {/* Other categories */}
        <div className="mt-5 flex flex-wrap gap-2">
          {BLOC_LEGEND.filter(({ bloc }) => ["green", "regional"].includes(bloc)).map(
            ({ bloc, meaning }) => (
              <div
                key={bloc}
                className="flex items-stretch rounded border border-hairline overflow-hidden"
              >
                <div
                  className="w-1.5 flex-shrink-0"
                  style={{ backgroundColor: BLOC_COLOR[bloc] }}
                />
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-ink">{BLOC_LABEL[bloc]}</span>
                  <span className="text-[10px] text-muted-ink">{meaning}</span>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-5 text-xs text-muted-ink">
          Additional category tags used: Liberal · Green · Regional · Animal Welfare · Satire.
        </div>
      </Reveal>
    </div>
  );
}

function LiveBadge({ fetching, lastUpdated }: { fetching: boolean; lastUpdated: string | null }) {
  if (!lastUpdated && !fetching) {
    return <span className="text-[10px] font-mono uppercase tracking-wider text-muted-ink">Offline · seed data</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-ink whitespace-nowrap">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-up opacity-60 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
      </span>
      {fetching
        ? "Updating…"
        : `Live · ${new Date(lastUpdated!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
    </span>
  );
}
