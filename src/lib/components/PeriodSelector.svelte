<script lang="ts">
	import { config, MIN_START } from '$lib/stores/config';
	import { simulation } from '$lib/stores/simulation';
	import { historicalData } from '$lib/stores/historical-data';

	const MIN_YEAR = MIN_START.getUTCFullYear(); // 1955

	// Derive the latest end year from loaded data, falling back to 2025.
	$: maxYear = (() => {
		const countries = $historicalData.index?.countries ?? [];
		if (countries.length === 0) return 2025;
		return Math.max(...countries.map((c) => new Date(c.end).getUTCFullYear()));
	})();

	$: startYear = $config.startDate.getUTCFullYear();
	$: endYear = $config.endDate.getUTCFullYear();

	// Build a full year range array for the selects.
	$: yearRange = Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

	function applyPeriod(sy: number, ey: number) {
		const s = new Date(Date.UTC(sy, 0, 1));
		const e = new Date(Date.UTC(ey, 0, 1));
		config.setPeriod(s, e);
		simulation.configure(s, e);
	}

	function handleStartChange(e: Event) {
		let sy = +(e.target as HTMLSelectElement).value;
		// Clamp: start must be at least 1 year before end
		if (sy >= endYear) sy = endYear - 1;
		applyPeriod(sy, endYear);
	}

	function handleEndChange(e: Event) {
		let ey = +(e.target as HTMLSelectElement).value;
		if (ey <= startYear) ey = startYear + 1;
		applyPeriod(startYear, ey);
	}

	// Presets — computed relative to maxYear.
	interface Preset {
		label: string;
		start: number;
		end: number;
	}

	$: presets = [
		{ label: '1960 — 2025', start: 1960, end: Math.min(2025, maxYear) },
		{ label: '1980 — 2025', start: 1980, end: Math.min(2025, maxYear) },
		{ label: 'Since 2000', start: 2000, end: maxYear },
		{ label: 'Last 25 yrs', start: maxYear - 25, end: maxYear }
	] as Preset[];

	function isActivePreset(p: Preset): boolean {
		return startYear === p.start && endYear === p.end;
	}
</script>

<div class="period-selector">
	<div class="header-row">
		<span class="section-title">Period</span>
		<span class="period-display">{startYear} — {endYear}</span>
	</div>

	<!-- Year select dropdowns -->
	<div class="year-controls">
		<div class="year-field">
			<label for="period-start" class="field-label">Start</label>
			<select
				id="period-start"
				value={startYear}
				on:change={handleStartChange}
			>
				{#each yearRange as y}
					<option value={y} disabled={y >= endYear}>{y}</option>
				{/each}
			</select>
		</div>

		<span class="year-sep" aria-hidden="true">—</span>

		<div class="year-field">
			<label for="period-end" class="field-label">End</label>
			<select
				id="period-end"
				value={endYear}
				on:change={handleEndChange}
			>
				{#each yearRange as y}
					<option value={y} disabled={y <= startYear}>{y}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Preset buttons -->
	<div class="presets" role="group" aria-label="Period presets">
		{#each presets as p}
			<button
				class="preset-btn"
				class:active={isActivePreset(p)}
				on:click={() => applyPeriod(p.start, p.end)}
				aria-pressed={isActivePreset(p)}
			>
				{p.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.period-selector {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		background: var(--light-gray);
		border: 1px solid var(--black);
		padding: 1.25rem 1.5rem;
		font-family: var(--mono-font);
	}

	.header-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.section-title {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 500;
	}

	.period-display {
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--orange);
	}

	/* Year controls */
	.year-controls {
		display: flex;
		align-items: flex-end;
		gap: 0.625rem;
	}

	.year-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.field-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.6;
	}

	select {
		-webkit-appearance: none;
		appearance: none;
		font-family: var(--mono-font);
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.35rem 1.75rem 0.35rem 0.625rem;
		border: 1px solid var(--black);
		background-color: var(--white);
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%231A1A1A'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		color: var(--black);
		cursor: pointer;
		min-width: 5rem;
	}

	select:focus {
		outline: 2px solid var(--orange);
		outline-offset: 1px;
	}

	.year-sep {
		font-size: 0.9rem;
		opacity: 0.4;
		padding-bottom: 0.35rem;
	}

	/* Preset buttons */
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.preset-btn {
		padding: 0.25rem 0.6rem;
		font-size: 0.6rem;
		font-family: var(--mono-font);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		border: 1px solid var(--black);
		background: var(--white);
		color: var(--black);
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}

	.preset-btn:hover {
		background: var(--gray);
	}

	.preset-btn.active {
		background: var(--black);
		color: var(--white);
	}
</style>
