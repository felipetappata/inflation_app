<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { config, DEFAULT_START, DEFAULT_END } from '$lib/stores/config';
	import { simulation } from '$lib/stores/simulation';
	import { historicalData } from '$lib/stores/historical-data';
	import PriceChart from '$lib/components/PriceChart.svelte';
	import PlaybackControls from '$lib/components/PlaybackControls.svelte';
	import CountrySelector from '$lib/components/CountrySelector.svelte';
	import PeriodSelector from '$lib/components/PeriodSelector.svelte';

	let initialized = false;
	let urlReady = false;

	onMount(async () => {
		await historicalData.initialize();

		if (initialized) return;
		initialized = true;

		const hd = $historicalData;
		if (!hd.loaded || !hd.index) return;

		const countries = hd.index.countries;
		const validIds = new Set(countries.map((c) => c.id));
		const params = new URLSearchParams(location.search);

		// Countries: from the URL if valid, else the defaultSelected set.
		const urlCountries = (params.get('c') || '')
			.split(',')
			.map((s) => s.trim())
			.filter((id) => validIds.has(id));
		const selected =
			urlCountries.length > 0
				? urlCountries
				: countries.filter((c) => c.defaultSelected).map((c) => c.id);
		config.setCountries(selected.length > 0 ? selected : ['usa', 'gbr', 'deu']);

		// Period: from URL years if present, else defaults — clamped to data range.
		const latestEnd = countries.reduce<Date | null>((acc, c) => {
			const d = new Date(c.end);
			return acc === null || d > acc ? d : acc;
		}, null);
		const maxYear = latestEnd ? latestEnd.getUTCFullYear() : DEFAULT_END.getUTCFullYear();
		let startYear = parseInt(params.get('from') || '', 10) || DEFAULT_START.getUTCFullYear();
		let endYear =
			parseInt(params.get('to') || '', 10) || Math.min(DEFAULT_END.getUTCFullYear(), maxYear);
		startYear = Math.max(1955, Math.min(startYear, maxYear - 1));
		endYear = Math.max(startYear + 1, Math.min(endYear, maxYear));
		const start = new Date(Date.UTC(startYear, 0, 1));
		const end = new Date(Date.UTC(endYear, 0, 1));
		config.setPeriod(start, end);
		simulation.configure(start, end);

		// Rate from URL if present.
		const rate = parseFloat(params.get('rate') || '');
		if (!Number.isNaN(rate)) simulation.setInflationRate(Math.max(-5, Math.min(50, rate)));

		// Auto-play so the lines immediately sweep in and "race" — otherwise the
		// chart starts empty (every series has a single point at the start date).
		simulation.play();

		urlReady = true;
	});

	onDestroy(() => {
		simulation.destroy();
	});

	// Keyboard shortcuts: Space toggles play/pause, R resets. Ignored while a
	// form control is focused so sliders/dropdowns keep their native behavior.
	function handleKey(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
		if (e.code === 'Space') {
			e.preventDefault();
			simulation.toggle();
		} else if (e.key === 'r' || e.key === 'R') {
			simulation.reset();
		}
	}

	// Reactive derived values for the footer.
	$: index = $historicalData.index;
	$: selectedCitations =
		index !== null
			? index.countries.filter((c) => $config.selectedCountryIds.includes(c.id))
			: [];

	// Keep the URL in sync so views are shareable. This block re-runs on every
	// tick (because it reads $simulation), but only writes when the meaningful
	// state — countries / period / rate — actually changes.
	let lastUrl = '';
	function buildShareUrl(ids: string[], s: Date, e: Date, rate: number): string {
		const p = new URLSearchParams();
		if (ids.length) p.set('c', ids.join(','));
		p.set('from', String(s.getUTCFullYear()));
		p.set('to', String(e.getUTCFullYear()));
		p.set('rate', String(rate));
		return `${location.pathname}?${p.toString()}`;
	}
	$: if (urlReady && $config && $simulation) {
		const u = buildShareUrl(
			$config.selectedCountryIds,
			$config.startDate,
			$config.endDate,
			$simulation.inflationRate
		);
		if (u !== lastUrl) {
			lastUrl = u;
			try {
				replaceState(u, {});
			} catch {
				/* replaceState can throw if called before hydration; ignore */
			}
		}
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="page-wrapper">
	<header class="page-header">
		<div class="header-inner">
			<h1>Rates and Levels</h1>
		</div>
	</header>

	{#if $historicalData.error}
		<div class="error-banner" role="alert">
			<span class="error-label">Data error</span>
			{$historicalData.error}
		</div>
	{/if}

	<section class="controls-section">
		<PlaybackControls />
	</section>

	<section class="chart-section">
		{#if $historicalData.loaded}
			<PriceChart />
		{:else}
			<div class="chart-placeholder" aria-busy="true" aria-label="Loading chart data">
				<span class="loading-text">Loading data&hellip;</span>
			</div>
		{/if}
	</section>

	<section class="selectors-row">
		<div class="selector-panel">
			<CountrySelector />
		</div>
		<div class="selector-panel">
			<PeriodSelector />
		</div>
	</section>

	<footer class="page-footer">
		{#if index !== null && selectedCitations.length > 0}
			<ol class="citation-list">
				{#each selectedCitations as country, i (country.id)}
					<li class="citation-item">
						<!-- Split at the trailing URL to linkify it -->
						{#if country.fredUrl && country.citation.includes(country.fredUrl)}
							{@const beforeUrl = country.citation.slice(
								0,
								country.citation.indexOf(country.fredUrl)
							)}
							{beforeUrl}<a
								href={country.fredUrl}
								target="_blank"
								rel="noopener noreferrer">{country.fredUrl}</a
							>{country.citation.slice(
								country.citation.indexOf(country.fredUrl) + country.fredUrl.length
							)}
						{:else}
							{country.citation}
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</footer>
</div>

<style>
	.page-wrapper {
		max-width: 60rem;
		margin: 0 auto;
		padding: 3rem var(--space-md) 4rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	/* ---- Header ---- */
	.page-header {
		border-bottom: 1px solid var(--border);
		padding-bottom: var(--space-lg);
	}

	.header-inner {
		max-width: 48rem;
	}

	h1 {
		font-size: 2.25rem;
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1.1;
		margin: 0 0 0.5rem;
		color: var(--black);
	}

	/* ---- Error banner ---- */
	.error-banner {
		background: #fff3f0;
		border: 1px solid #ffc0b3;
		border-left: 3px solid #e04040;
		border-radius: 3px;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: #5c1a1a;
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}

	.error-label {
		font-family: var(--mono-font);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #e04040;
		flex-shrink: 0;
	}

	.chart-placeholder {
		height: 20rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--light-gray);
	}

	.loading-text {
		font-family: var(--mono-font);
		font-size: 0.8125rem;
		color: var(--muted);
		letter-spacing: 0.02em;
	}

	/* ---- Selectors row ---- */
	.selectors-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
		align-items: start;
	}

	@media (max-width: 40rem) {
		.selectors-row {
			grid-template-columns: 1fr;
		}
	}

	/* ---- Footer / citations ---- */
	.page-footer {
		border-top: 1px solid var(--border);
		padding-top: var(--space-lg);
	}

	.citation-list {
		list-style: decimal;
		padding-left: 1.5rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.citation-item {
		font-family: var(--mono-font);
		font-size: 0.7rem;
		color: var(--muted);
		line-height: 1.6;
	}

	.citation-item a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.citation-item a:hover {
		color: var(--orange);
	}
</style>
