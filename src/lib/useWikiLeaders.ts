import { useState, useEffect } from "react";

export type WikiLeaders = {
  monarch: string | null;
  pm: string | null;
};

async function fetchWikiLeaders(): Promise<WikiLeaders> {
  const endpoint =
    "https://en.wikipedia.org/w/api.php" +
    "?action=parse" +
    "&page=United_Kingdom" +
    "&prop=text" +
    "&section=0" +
    "&format=json" +
    "&origin=*";

  const res = await fetch(endpoint);
  if (!res.ok) return { monarch: null, pm: null };

  const json = (await res.json()) as { parse?: { text?: { "*"?: string } } };
  const html = json?.parse?.text?.["*"];
  if (!html) return { monarch: null, pm: null };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const leaders: WikiLeaders = { monarch: null, pm: null };

  for (const row of Array.from(doc.querySelectorAll(".infobox tr"))) {
    const th = row.querySelector("th");
    const td = row.querySelector("td");
    if (!th || !td) continue;
    const label = th.textContent?.trim() ?? "";
    const value = (td.querySelector("a")?.textContent || td.textContent || "")
      .replace(/\[.*?\]/g, "")
      .trim();
    if (/monarch/i.test(label) && !leaders.monarch) leaders.monarch = value || null;
    if (/prime\s+minister/i.test(label) && !leaders.pm) leaders.pm = value || null;
  }

  return leaders;
}

const CACHE_KEY = "et_wiki_leaders";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useWikiLeaders(): WikiLeaders {
  const [leaders, setLeaders] = useState<WikiLeaders>({ monarch: null, pm: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: WikiLeaders; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setLeaders(data);
          return;
        }
      }
    } catch {}

    fetchWikiLeaders()
      .then((data) => {
        setLeaders(data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return leaders;
}

export function pmNamesMatch(wikiName: string, seedName: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/^(sir|dame|lord|baroness)\s+/i, "")
      .trim();
  const a = norm(wikiName);
  const b = norm(seedName);
  return a === b || b.includes(a) || a.includes(b);
}
