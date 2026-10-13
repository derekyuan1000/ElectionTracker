# Improvements

Small changes, each touching exactly one file, so each can be its own PR.

| Done | Change | File |
|---|---|---|
| [ ] | Add a CI workflow: `npm ci`, `npm run lint`, `npm run build` on every PR | `.github/workflows/ci.yml` (new) |
| [ ] | Add the MIT licence the README claims | `LICENSE` (new) |
| [ ] | Add Dependabot for weekly npm updates | `.github/dependabot.yml` (new) |
| [ ] | Add a robots.txt pointing at the sitemap | `public/robots.txt` (new) |
| [ ] | Pin the Node version for contributors and Vercel | `.nvmrc` (new) |
| [ ] | Rename the package from `tanstack_start_ts` and add an `engines` field | `package.json` |
| [ ] | Catch network errors in the Wikipedia fetch (only `!res.ok` is handled, so an offline fetch throws) | `src/lib/useWikiLeaders.ts` |
| [ ] | Add `aria-label`s to the Recharts charts | `src/routes/projection.tsx` |
| [ ] | Add a pull request template | `.github/pull_request_template.md` (new) |
| [ ] | Keep the README in sync with the code (in progress on this branch) | `README.md` |

Already in place, so not on the list: per-route page titles, Open Graph tags, a 404 page and a React Query `staleTime` for the Wikipedia lookups.
