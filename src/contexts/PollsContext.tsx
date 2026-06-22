import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWikipolls } from "@/lib/wikipedia";
import { polls as seedPolls, institutes as seedInstitutes } from "@/data/seed";
import type { Institute, Poll } from "@/data/types";

type PollsContextValue = {
  polls: Poll[];
  institutes: Institute[];
  isLoading: boolean;
  isError: boolean;
  lastUpdated: string | null;
};

const PollsContext = createContext<PollsContextValue>({
  polls: seedPolls,
  institutes: seedInstitutes,
  isLoading: false,
  isError: false,
  lastUpdated: null,
});

export function PollsProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["wiki-polls"],
    queryFn: fetchWikipolls,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  // Merge Wikipedia institutes with seed institutes (seed reliability scores win on conflict)
  const seedInstMap = new Map(seedInstitutes.map((i) => [i.id, i]));
  const mergedInstitutes: Institute[] = [...seedInstitutes];
  if (query.data?.institutes) {
    for (const inst of query.data.institutes) {
      if (!seedInstMap.has(inst.id)) mergedInstitutes.push(inst);
    }
  }

  const value: PollsContextValue = {
    polls: query.data?.polls ?? seedPolls,
    institutes: mergedInstitutes,
    isLoading: query.isLoading,
    isError: query.isError,
    lastUpdated: query.data?.fetchedAt ?? null,
  };

  return <PollsContext.Provider value={value}>{children}</PollsContext.Provider>;
}

export function usePollsContext() {
  return useContext(PollsContext);
}
