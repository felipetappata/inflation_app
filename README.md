# Rates and Levels

Inflation simulator highlighting the difference between the inflation *rate* and the price *level*.

Hosted at [https://felipetappata.github.io/inflation_app/](https://felipetappata.github.io/inflation_app/)

## Quick Start

```bash
npm install
npm run dev
```

## Data

CPI series are pulled from FRED at build time by `scripts/fetch-fred-data.mjs` and written to
`static/data/`. The `prebuild` script runs it automatically; run it manually with
`npm run fetch-data`.

- With a `FRED_API_KEY` (see `.env.example`) it uses the FRED API; without one it falls back to
  the public `fredgraph.csv` endpoint (throttled).
- Countries and series IDs are defined in `scripts/fred-registry.mjs`.

## Scripts

- `npm run dev` — dev server (fetches data if missing)
- `npm run build` — production build (refetches data)
- `npm run fetch-data` — refresh `static/data/`
- `npm run deploy` — build and publish to GitHub Pages
- `npm run check` / `npm run lint` / `npm run format`

## Stack

Svelte 5 · SvelteKit · D3 · TypeScript · Tailwind

## License

MIT
