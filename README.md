# Election Tracker

A web app for tracking election results, polling and seat projections in one place.

**Live:** [electiontracker.derekyuan.co.uk](https://electiontracker.derekyuan.co.uk)

## Features

- Live results by constituency, party and region
- Polling averages with historical trend lines
- Seat projections from vote share
- Comparison against previous elections (swing, turnout, majority)
- Clean, responsive UI that works on mobile

## Tech stack

| Layer | Tech |
|---|---|
| Framework | TanStack Start (React 19, TanStack Router) |
| Language | TypeScript |
| Build | Vite |
| Styling | Tailwind CSS 4, Radix UI |
| Charts | Recharts |
| Data | Seed data in `src/data/seed.ts` |
| Hosting | Vercel |

## Getting started

Requires Node.js 20+ (or [Bun](https://bun.sh)).

```bash
git clone https://github.com/derekyuan1000/ElectionTracker.git
cd ElectionTracker
npm install
npm run dev
```

Open the local URL printed in the terminal. No environment variables are needed.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (Vercel preset) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Project structure

```
ElectionTracker/
├── public/        # Icons and web manifest
└── src/
    ├── routes/    # File-based routes (elections, polls, projection, parties)
    ├── components/
    ├── data/      # Seed data and types
    ├── lib/       # Formatting, trend and Wikipedia helpers
    └── contexts/
```

## How projections work

Seat projections are calculated from vote share using uniform national swing applied to the previous election's constituency results. This is a simple model: it ignores tactical voting, local candidate effects and regional variation, so treat output as indicative rather than predictive.

## Roadmap

- [ ] Constituency-level maps
- [ ] Proportional swing and regional swing models
- [ ] Exportable CSV/JSON endpoints
- [ ] Historical results back to 1945

## Contributing

Open an issue first for anything sizeable. Then branch, make one focused change per pull request, and open the PR against `master`.

## Data sources

Credit upstream sources here (electoral commission, polling organisations, etc.) and check their licence terms before redistributing.

## Licence

MIT © [Derek Yuan](https://www.derekyuan.co.uk)
