import type { Institute, Poll } from "@/data/types";

const PARTY_COL_MAP: Record<string, string> = {
  con: "conservative",
  lab: "labour",
  ld: "liberal-democrats",
  "lib dem": "liberal-democrats",
  libdem: "liberal-democrats",
  reform: "reform-uk",
  ref: "reform-uk",
  "reform uk": "reform-uk",
  grn: "green-party",
  green: "green-party",
  greens: "green-party",
  snp: "snp",
  pc: "plaid-cymru",
  plaid: "plaid-cymru",
  rb: "restore-britain",
  oth: "others",
  others: "others",
  other: "others",
};

const INST_MAP: Record<string, { id: string; reliability: number }> = {
  yougov: { id: "yougov", reliability: 88 },
  opinium: { id: "opinium", reliability: 84 },
  ipsos: { id: "ipsos", reliability: 86 },
  "more in common": { id: "moreincommon", reliability: 80 },
  deltapoll: { id: "deltapoll", reliability: 78 },
  "find out now": { id: "findoutnow", reliability: 76 },
  savanta: { id: "savanta", reliability: 79 },
  "redfield & wilton": { id: "redfield", reliability: 74 },
  "techne uk": { id: "techne", reliability: 70 },
  techne: { id: "techne", reliability: 70 },
  "people polling": { id: "people-polling", reliability: 68 },
  survation: { id: "survation", reliability: 76 },
  "bmg research": { id: "bmg", reliability: 74 },
  bmg: { id: "bmg", reliability: 74 },
  kantar: { id: "kantar", reliability: 78 },
  "jl partners": { id: "jlpartners", reliability: 72 },
  norstat: { id: "norstat", reliability: 72 },
  "electoral calculus": { id: "electoral-calculus", reliability: 70 },
  focaldata: { id: "focaldata", reliability: 72 },
  panelbase: { id: "panelbase", reliability: 74 },
};

function cleanText(el: Element): string {
  return (el.textContent ?? "").replace(/\[[\w\s\d]+\]/g, "").trim();
}

/**
 * Parse a fieldwork date string into ISO "YYYY-MM-DD".
 * Wikipedia uses formats like "17–19 Jun" (no year) and "27–29 May 2026" (with year).
 * When no year is present, infer it: try current year first, then previous years.
 */
function parseFieldworkEnd(dateStr: string): string | null {
  const s = dateStr
    .replace(/\[.*?\]/g, "")
    .replace(/–|—/g, "-")
    .trim();

  const toISO = (day: string, month: string, year: string): string | null => {
    const d = new Date(`${day} ${month} ${year}`);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };

  // "1-7 Jan 2026" → end date "7 Jan 2026"
  const rangeYear = s.match(/\d+\s*-\s*(\d+)\s+([A-Za-z]+)\s+(\d{4})/);
  if (rangeYear) return toISO(rangeYear[1], rangeYear[2], rangeYear[3]);

  // "7 Jan 2026"
  const singleYear = s.match(/(\d+)\s+([A-Za-z]+)\s+(\d{4})/);
  if (singleYear) return toISO(singleYear[1], singleYear[2], singleYear[3]);

  // "Jan 2026" → last day of that month
  const monthYear = s.match(/([A-Za-z]+)\s+(\d{4})/);
  if (monthYear) {
    const d = new Date(`1 ${monthYear[1]} ${monthYear[2]}`);
    if (!isNaN(d.getTime())) {
      d.setMonth(d.getMonth() + 1, 0);
      return d.toISOString().slice(0, 10);
    }
  }

  // No year — infer: try current year, then up to 2 years back
  const now = new Date();
  const inferYear = (day: string, month: string): string | null => {
    for (let offset = 0; offset <= 2; offset++) {
      const year = now.getFullYear() - offset;
      const iso = toISO(day, month, String(year));
      if (!iso) continue;
      const diff = (now.getTime() - new Date(iso).getTime()) / 86400000;
      // Accept dates in the past or today only, up to 14 months back
      if (diff >= 0 && diff <= 425) return iso;
    }
    return null;
  };

  // "1-7 Jun" (range, no year)
  const rangeNoYear = s.match(/\d+\s*-\s*(\d+)\s+([A-Za-z]+)/);
  if (rangeNoYear) return inferYear(rangeNoYear[1], rangeNoYear[2]);

  // "7 Jun" (single, no year)
  const singleNoYear = s.match(/(\d+)\s+([A-Za-z]+)/);
  if (singleNoYear) return inferYear(singleNoYear[1], singleNoYear[2]);

  return null;
}

function parseNum(s: string): number | null {
  const c = s.replace(/[,%]/g, "").trim();
  if (!c || /^[-–—n\/a]+$/i.test(c)) return null;
  const n = parseFloat(c);
  return isNaN(n) ? null : n;
}

function resolveInstitute(rawName: string): { id: string; name: string; reliability: number } {
  const name = rawName.replace(/\s+for\s+.*/i, "").trim();
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(INST_MAP)) {
    if (lower === key || lower.startsWith(key)) return { ...val, name };
  }
  const id = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { id, name, reliability: 72 };
}

function headerCols(headerRow: Element): string[] {
  const cols: string[] = [];
  for (const th of Array.from(headerRow.querySelectorAll("th"))) {
    const span = parseInt(th.getAttribute("colspan") ?? "1");
    const text = cleanText(th).toLowerCase().trim();
    cols.push(text);
    for (let i = 1; i < span; i++) cols.push("");
  }
  return cols;
}

function dataCells(row: Element): string[] {
  const cells: string[] = [];
  for (const td of Array.from(row.querySelectorAll("td"))) {
    const span = parseInt(td.getAttribute("colspan") ?? "1");
    cells.push(cleanText(td));
    for (let i = 1; i < span; i++) cells.push("");
  }
  return cells;
}

// Area values accepted as GB-level national polls
const GB_AREAS = new Set(["gb", "uk", "gbni", "england", "e&w", "eng", "gb+"]);

export type WikiPollResult = {
  polls: Poll[];
  institutes: Institute[];
  fetchedAt: string;
};

export async function fetchWikipolls(): Promise<WikiPollResult> {
  const endpoint =
    "https://en.wikipedia.org/w/api.php" +
    "?action=parse" +
    "&page=Opinion_polling_for_the_next_United_Kingdom_general_election" +
    "&prop=text" +
    "&format=json" +
    "&origin=*";

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Wikipedia fetch failed: ${res.status}`);

  const json = (await res.json()) as { parse?: { text?: { "*"?: string } } };
  const html = json?.parse?.text?.["*"];
  if (!html) throw new Error("No HTML in Wikipedia response");

  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table.wikitable"));

  const polls: Poll[] = [];
  const instituteMap = new Map<string, Institute>();
  let pollIdx = 0;

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr"));

    let headerRow: Element | null = null;
    for (const row of rows) {
      if (row.querySelectorAll("th").length >= 4) {
        headerRow = row;
        break;
      }
    }
    if (!headerRow) continue;

    const cols = headerCols(headerRow);

    let firmCol = -1;
    let datesCol = -1;
    let sampleCol = -1;
    let areaCol = -1;
    const partyMap: Record<number, string> = {};

    for (let ci = 0; ci < cols.length; ci++) {
      const h = cols[ci].trim();
      if (!h) continue;
      if (/polling|firm|pollster/.test(h) && firmCol < 0) {
        firmCol = ci;
        continue;
      }
      if (/date|fieldwork|conducted/.test(h) && datesCol < 0) {
        datesCol = ci;
        continue;
      }
      if (/\barea\b/.test(h) && areaCol < 0) {
        areaCol = ci;
        continue;
      }
      if (/sample|size/.test(h) && !/lead/.test(h) && sampleCol < 0) {
        sampleCol = ci;
        continue;
      }
      const partyId = PARTY_COL_MAP[h];
      if (partyId) partyMap[ci] = partyId;
    }

    // Only process tables that have date, firm, and Area columns.
    // Tables without Area are sub-national (Scotland/Wales) or non-poll tables.
    if (firmCol < 0 || datesCol < 0 || areaCol < 0 || Object.keys(partyMap).length < 3) continue;

    for (const row of rows) {
      if (row.querySelectorAll("td").length < 3) continue;
      const cells = dataCells(row);

      // Only include GB/UK national polls; non-GB areas are always excluded
      const area = (cells[areaCol] ?? "").toLowerCase().trim();
      if (area && !GB_AREAS.has(area)) continue;

      const rawFirm = (cells[firmCol] ?? "").split("\n")[0].trim();
      if (!rawFirm || rawFirm.length < 2) continue;
      // Reject event rows (by-elections, political announcements etc.)
      if (/\belection\b|\bannounce|\bresign|\bhold\b|\bgain\b/i.test(rawFirm)) continue;

      const fieldworkEnd = parseFieldworkEnd(cells[datesCol] ?? "");
      if (!fieldworkEnd) continue;

      const ageDays = (Date.now() - new Date(fieldworkEnd).getTime()) / 86400000;
      if (ageDays < 0 || ageDays > 395) continue;

      const sampleSize = sampleCol >= 0 ? (parseNum(cells[sampleCol] ?? "") ?? 1000) : 1000;

      const results: Record<string, number> = {};
      for (const [ci, partyId] of Object.entries(partyMap)) {
        const v = parseNum(cells[parseInt(ci)] ?? "");
        if (v !== null && v > 0) results[partyId] = v;
      }
      if (Object.keys(results).length < 3) continue;
      // SNP > 20% nationally is impossible — this is a Scotland-only poll
      if ((results["snp"] ?? 0) > 20) continue;

      const inst = resolveInstitute(rawFirm);
      if (!instituteMap.has(inst.id)) {
        instituteMap.set(inst.id, {
          id: inst.id,
          countryCode: "united-kingdom",
          name: inst.name,
          reliability: inst.reliability,
        });
      }

      const publishDate = new Date(fieldworkEnd);
      publishDate.setDate(publishDate.getDate() + 2);

      polls.push({
        id: `wiki-${++pollIdx}`,
        countryCode: "united-kingdom",
        instituteId: inst.id,
        fieldworkEnd,
        publishDate: publishDate.toISOString().slice(0, 10),
        sampleSize: Math.round(sampleSize),
        electionType: "national",
        results,
      });
    }
  }

  return {
    polls: polls.sort((a, b) => b.fieldworkEnd.localeCompare(a.fieldworkEnd)),
    institutes: Array.from(instituteMap.values()),
    fetchedAt: new Date().toISOString(),
  };
}
