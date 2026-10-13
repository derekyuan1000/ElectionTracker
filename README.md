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
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js |
| Data | JSON / CSV sources, cached locally |
| Hosting | Vercel |

## Getting started

```bash
git clone https://github.com/derekyuan1000/election-tracker.git
cd election-tracker
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## Configuration

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3000`) |
| `DATA_SOURCE_URL` | Base URL of the results/polling data feed |
| `CACHE_TTL` | Seconds to cache upstream data (default `300`) |

## Project structure

```
election-tracker/
├── public/        # Static frontend
├── src/           # Server and data-processing code
├── data/          # Cached and historical datasets
└── .env.example
```

## How projections work

Seat projections are calculated from vote share using uniform national swing applied to the previous election's constituency results. This is a simple model: it ignores tactical voting, local candidate effects and regional variation, so treat output as indicative rather than predictive.

## Roadmap

- [ ] Constituency-level maps
- [ ] Proportional swing and regional swing models
- [ ] Exportable CSV/JSON endpoints
- [ ] Historical results back to 1945

## Contributing

Open an issue first for anything sizeable. Then branch, make one focused change per pull request, and open the PR against `main`.

## Data sources

Credit upstream sources here (electoral commission, polling organisations, etc.) and check their licence terms before redistributing.

## Licence

MIT © [Derek Yuan](https://www.derekyuan.co.uk)
