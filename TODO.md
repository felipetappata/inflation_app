# TODO

## Done

- [x] Fix tooltip flickering in PriceChart component
  - Addressed in the revamp: chart uses stable pointer-event handling and avoids
    rapid DOM re-mounts that caused flicker.
- [x] Make historical data accessible in deployed version
  - Data pipeline writes to `static/data/` at build time via `scripts/fetch-fred-data.mjs`;
    `prebuild` runs it automatically before every `npm run build`.
- [x] Update range selection information box
  - Text color, "Annualized" label, and show-while-dragging all addressed in
    the PlaybackControls / PriceChart revamp.

---

## Active / Backlog

### Bug Fixes

- [ ] Venezuela and Argentina: chart label should note data coverage gaps
  (Venezuela ends 2016, Argentina starts 2016-12).
- [ ] PeriodSelector: clamping the end date to the latest available series
  can push it before some countries' start dates — show a per-country
  "no data in this range" indicator in CountrySelector.

### UI Enhancements

- [ ] Add a color-swatch indicator next to each country chip in CountrySelector.
- [ ] Show current simulated value ("$1 grew to $X.XX") as a live readout
  alongside the playback controls.
- [ ] Improve mobile layout of PlaybackControls — rate slider and speed
  selector stack poorly on narrow viewports.

---

## Future Ideas

- [ ] **Per-capita / PPP normalization** — option to view CPI adjusted for
  purchasing-power parity or expressed in a common currency.
- [ ] **More countries** — add Euro-area aggregate, India, South Korea,
  South Africa, etc.
- [ ] **Shareable URL state** — encode selected countries + period in the
  URL hash so links reproduce a specific view.
- [ ] **Log scale default for hyperinflation** — when Argentina, Venezuela, or
  Turkey are selected the linear scale compresses other series; offer a
  log-scale toggle (or auto-enable it).
- [ ] **Annotations** — mark notable events (oil shocks, financial crises,
  COVID) on the time axis.
- [ ] **Export** — download the visible chart as SVG or PNG.
