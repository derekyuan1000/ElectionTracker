import {
  country as UK,
  elections,
  institutes as ALL_INST,
  partyById,
  polledParties,
  polls as ALL_POLLS,
} from "@/data/seed";
import type { Country, Poll } from "@/data/types";

function today(): Date {
  return new Date();
}

function ageDays(iso: string): number {
  const d = new Date(iso);
  return Math.max(0, (today().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export type TrendPoint = { partyId: string; pct: number; moe: number };

/**
 * Weighted polling average.
 *   weight(poll) = exp(-age_days / 21) * (reliability / 100)
 *   trend(party) = Σ(weight_i * pct_i) / Σ(weight_i)
 *   moe(party)   = 1.96 * stddev(pct_i, weighted) / sqrt(effective_n)
 */
export function computeTrend(_country?: string, customPolls?: Poll[]): TrendPoint[] {
  const ps = polledParties();
  const inst = Object.fromEntries(ALL_INST.map((i) => [i.id, i]));
  const ps_polls = customPolls ?? ALL_POLLS;
  const out: TrendPoint[] = [];
  for (const p of ps) {
    let wsum = 0;
    let wxsum = 0;
    const vals: { v: number; w: number }[] = [];
    for (const poll of ps_polls) {
      const v = poll.results[p.id];
      if (v == null) continue;
      const reliability = inst[poll.instituteId]?.reliability ?? 72;
      const w = Math.exp(-ageDays(poll.fieldworkEnd) / 21) * (reliability / 100);
      wsum += w;
      wxsum += w * v;
      vals.push({ v, w });
    }
    const mean = wsum ? wxsum / wsum : 0;
    let varSum = 0;
    for (const { v, w } of vals) varSum += w * (v - mean) ** 2;
    const variance = wsum ? varSum / wsum : 0;
    const effectiveN = vals.length;
    const moe = effectiveN ? 1.96 * Math.sqrt(variance / Math.max(1, effectiveN)) : 0;
    out.push({ partyId: p.id, pct: +mean.toFixed(2), moe: +moe.toFixed(2) });
  }
  return out.sort((a, b) => b.pct - a.pct);
}

export function lastElection(_country?: string) {
  return elections["united-kingdom"][0];
}

export function deltaSinceLastElection(_country?: string, customPolls?: Poll[]) {
  const trend = computeTrend(_country, customPolls);
  const last = lastElection();
  const map = new Map(last?.results.map((r) => [r.partyId, r.pct]) ?? []);
  return trend.map((t) => ({
    partyId: t.partyId,
    pct: t.pct,
    delta: +(t.pct - (map.get(t.partyId) ?? t.pct)).toFixed(1),
  }));
}

function trendAtAgeWindow(minDays: number, maxDays: number, customPolls?: Poll[]) {
  const ps = polledParties();
  const inst = Object.fromEntries(ALL_INST.map((i) => [i.id, i]));
  const polls = (customPolls ?? ALL_POLLS).filter((p) => {
    const a = ageDays(p.fieldworkEnd);
    return a >= minDays && a <= maxDays;
  });
  const out: Record<string, number> = {};
  for (const p of ps) {
    let wsum = 0,
      wxsum = 0;
    for (const poll of polls) {
      const v = poll.results[p.id];
      if (v == null) continue;
      const reliability = inst[poll.instituteId]?.reliability ?? 72;
      const w = reliability / 100;
      wsum += w;
      wxsum += w * v;
    }
    out[p.id] = wsum ? wxsum / wsum : 0;
  }
  return out;
}

export function momentum30d(_country?: string, customPolls?: Poll[]) {
  const now = trendAtAgeWindow(0, 30, customPolls);
  const before = trendAtAgeWindow(30, 60, customPolls);
  const ps = polledParties();
  return ps
    .map((p) => ({ partyId: p.id, swing: +((now[p.id] ?? 0) - (before[p.id] ?? 0)).toFixed(2) }))
    .sort((a, b) => b.swing - a.swing);
}

export function momentum90d(_country?: string, customPolls?: Poll[]) {
  const now = trendAtAgeWindow(0, 30, customPolls);
  const before = trendAtAgeWindow(60, 120, customPolls);
  const ps = polledParties();
  return ps
    .map((p) => ({ partyId: p.id, swing: +((now[p.id] ?? 0) - (before[p.id] ?? 0)).toFixed(2) }))
    .sort((a, b) => b.swing - a.swing);
}

/** D'Hondt seat allocation given vote shares and total seats; ignores parties below threshold. */
export function dhondt(
  shares: { partyId: string; pct: number }[],
  totalSeats: number,
  thresholdPct: number,
): Record<string, number> {
  const eligible = shares.filter((s) => s.pct >= thresholdPct);
  const seats: Record<string, number> = Object.fromEntries(eligible.map((e) => [e.partyId, 0]));
  for (let i = 0; i < totalSeats; i++) {
    let best = eligible[0];
    let bestQ = -1;
    for (const e of eligible) {
      const q = e.pct / (seats[e.partyId] + 1);
      if (q > bestQ) {
        bestQ = q;
        best = e;
      }
    }
    seats[best.partyId] += 1;
  }
  return seats;
}

/**
 * Seat projection.
 * For NL: D'Hondt at the one-seat quota.
 * For UK / FR (single-member districts) we use a transparent demo proxy:
 * proportional with a 5% effective bonus to the leading party, rounded to integers
 * — explicitly labelled as a "first-order proxy" on the methodology page.
 */
export function seatProjection(_country?: string, customPolls?: Poll[]) {
  const country = UK;
  const trend = computeTrend(_country, customPolls);
  const eligible = trend.filter(
    (t) => t.pct >= country.electoralThreshold || country.electoralThreshold === 0,
  );
  const lead = eligible[0]?.partyId;
  const totalAdj = eligible.reduce(
    (s, t) => s + (t.partyId === lead ? t.pct * 1.35 : t.pct * 0.92),
    0,
  );
  const out: Record<string, number> = {};
  let used = 0;
  for (const t of eligible) {
    const adj = t.partyId === lead ? t.pct * 1.35 : t.pct * 0.92;
    const seats = Math.round((adj / totalAdj) * country.parliamentSize);
    out[t.partyId] = seats;
    used += seats;
  }
  if (lead) out[lead] += country.parliamentSize - used;
  return out;
}

export function governmentSeatTotal(_country?: string, customPolls?: Poll[]) {
  const seats = seatProjection(_country, customPolls);
  return UK.governingParties.reduce((s, id) => s + (seats[id] ?? 0), 0);
}

export function wouldGovHoldMajority(_country?: string, customPolls?: Poll[]) {
  const country = UK;
  const total = governmentSeatTotal(_country, customPolls);
  return { total, threshold: country.majorityThreshold, holds: total >= country.majorityThreshold };
}

/** Time-series of weighted trend, monthly bins, for the last ~12 months. */
export function trendSeries(_country?: string, customPolls?: Poll[]) {
  const ps = polledParties();
  const inst = Object.fromEntries(ALL_INST.map((i) => [i.id, i]));
  const polls = customPolls ?? ALL_POLLS;
  const bins: { label: string; minAge: number; maxAge: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    bins.push({ label: monthLabel(i), minAge: i * 30, maxAge: (i + 1) * 30 });
  }
  return bins.map((b) => {
    const row: Record<string, number | string> = { month: b.label };
    for (const p of ps) {
      let wsum = 0,
        wxsum = 0;
      for (const poll of polls) {
        const a = ageDays(poll.fieldworkEnd);
        if (a < b.minAge || a >= b.maxAge) continue;
        const v = poll.results[p.id];
        if (v == null) continue;
        const reliability = inst[poll.instituteId]?.reliability ?? 72;
        const w = reliability / 100;
        wsum += w;
        wxsum += w * v;
      }
      if (wsum) row[p.id] = +(wxsum / wsum).toFixed(2);
    }
    return row;
  });
}

function monthLabel(monthsAgo: number): string {
  const d = today();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleString("en", { month: "short", year: "2-digit" });
}

export function partyTrendSeries(partyId: string, customPolls?: Poll[]) {
  return trendSeries(undefined, customPolls).map((row) => ({
    month: row.month,
    pct: (row[partyId] as number) ?? null,
  }));
}

/** Institute reliability = stored score (transparent: based on past-election accuracy + cross-institute deviation). */
export function instituteAccuracyLabel(score: number): string {
  if (score >= 84) return "Highly Accurate";
  if (score >= 78) return "Reliable";
  if (score >= 72) return "Mixed";
  return "Low Accuracy";
}

// Left-right positions used to score ideological proximity between coalition partners.
// "other" is placed at centre (5) so it doesn't artificially inflate or deflate scores.
const BLOC_ORDER: Record<string, number> = {
  farleft: 0,
  left: 1,
  centerleft: 2,
  green: 3,
  regional: 4,
  liberal: 5,
  center: 5,
  other: 5,
  centerright: 7,
  right: 8,
  farright: 9,
};

export type CoalitionScenario = {
  ids: string[];
  seats: number;
  share: number;
  bloc: string;
  likelihood: "high" | "medium" | "low";
};

/** Coalition ranking: enumerate 2- and 3-party combos that reach majority.
 *  Sorted by likelihood (ideological compatibility + poll-leader bonus) then
 *  by seats descending so the biggest viable coalition shows first within each tier. */
export function coalitionScenarios(_country?: string, customPolls?: Poll[]): CoalitionScenario[] {
  const country = UK;
  const seats = seatProjection(_country, customPolls);
  const trend = computeTrend(_country, customPolls);
  const leadPartyId = trend[0]?.partyId;

  const entries = Object.entries(seats)
    .filter(([, s]) => s > 0)
    .map(([partyId, s]) => ({ partyId, seats: s }))
    .sort((a, b) => b.seats - a.seats);

  const scored: (CoalitionScenario & { _score: number })[] = [];

  const push = (ids: string[]) => {
    const seatsSum = ids.reduce((s, id) => s + (seats[id] ?? 0), 0);
    if (seatsSum < country.majorityThreshold) return;
    const key = ids.slice().sort().join("|");
    if (scored.some((c) => c.ids.slice().sort().join("|") === key)) return;

    // Ideological proximity: 10 = same bloc, 0 = maximum spectrum distance
    const positions = ids.map((id) => BLOC_ORDER[partyById(id)?.bloc ?? "other"] ?? 5);
    const maxDist = Math.max(...positions) - Math.min(...positions);
    const ideologyScore = Math.max(0, 10 - maxDist);

    // Poll bonus: +2 if this coalition includes the current polling leader
    const leadBonus = ids.includes(leadPartyId) ? 2 : 0;

    const score = ideologyScore + leadBonus;
    const likelihood: CoalitionScenario["likelihood"] =
      score >= 9 ? "high" : score >= 6 ? "medium" : "low";

    scored.push({
      ids,
      seats: seatsSum,
      share: +((seatsSum / country.parliamentSize) * 100).toFixed(1),
      bloc: coalitionBlocLabel(ids),
      likelihood,
      _score: score,
    });
  };

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      push([entries[i].partyId, entries[j].partyId]);
      for (let k = j + 1; k < entries.length; k++) {
        push([entries[i].partyId, entries[j].partyId, entries[k].partyId]);
      }
    }
  }

  return scored
    .sort((a, b) => (b._score !== a._score ? b._score - a._score : b.seats - a.seats))
    .slice(0, 8)
    .map(({ _score: _s, ...rest }) => rest);
}

function coalitionBlocLabel(ids: string[]): string {
  const blocs = ids.map((id) => partyById(id)?.bloc).filter(Boolean) as string[];
  const set = new Set(blocs);
  if (set.size === 1) return blocs[0];
  const hasLeft = blocs.some((b) => ["farleft", "left", "centerleft", "green"].includes(b));
  const hasRight = blocs.some((b) => ["right", "centerright", "farright"].includes(b));
  if (hasLeft && hasRight) return "Grand";
  if (hasLeft) return "Left-led";
  if (hasRight) return "Right-led";
  return "Centrist";
}

export type { Country, Poll };
