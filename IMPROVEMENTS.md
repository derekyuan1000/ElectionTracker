# Improvements

Small, self-contained changes, one PR each.

- [ ] **CI workflow:** GitHub Action running `npm ci`, `npm run lint` and `npm run build` on every PR
- [ ] **Page titles and meta descriptions** per route (elections, polls, projection, parties) via TanStack route `head()`
- [ ] **Open Graph and Twitter tags** with a preview image for shared links
- [ ] **Loading and error states** for the Wikipedia leader lookups (`src/lib/useWikiLeaders.ts`), with a fallback when the fetch fails
- [ ] **React Query `staleTime`** on Wikipedia calls to avoid refetching on every navigation
- [ ] **"Last updated" date** on the polls and projection pages, taken from the seed data
- [ ] **Unit tests** for `src/lib/trend.ts` and `src/lib/format.ts`, plus a `test` script
- [ ] **Chart accessibility:** `aria-label`s on Recharts charts and a contrast check on the colours in `src/lib/partyColor.ts`
- [ ] **Remove unused dependencies** (run `npx depcheck`; many Radix packages may be unused)
- [ ] **Custom 404 page** with links back to the main sections
