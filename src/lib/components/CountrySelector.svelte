<script lang="ts">
	import { config } from '$lib/stores/config';
	import { historicalData } from '$lib/stores/historical-data';
	import type { CountryMeta } from '$lib/types/cpi';

	$: countries = $historicalData.index?.countries ?? [];
	$: allIds = countries.map((c) => c.id);

	function coverageYear(c: CountryMeta): number | null {
		const countryStart = new Date(c.start);
		return countryStart > $config.startDate ? countryStart.getUTCFullYear() : null;
	}
</script>

<div class="country-selector">
	<div class="header-row">
		<span class="section-title">Countries</span>
		{#if countries.length > 0}
			<div class="bulk-actions">
				<button
					class="text-btn"
					on:click={() => config.setCountries(allIds)}
					aria-label="Select all countries"
				>
					Select all
				</button>
				<span class="divider" aria-hidden="true">·</span>
				<button
					class="text-btn"
					on:click={() => config.setCountries([])}
					aria-label="Clear all countries"
				>
					Clear
				</button>
			</div>
		{/if}
	</div>

	{#if !$historicalData.loaded}
		<p class="loading">Loading…</p>
	{:else if countries.length === 0}
		<p class="loading">No data available.</p>
	{:else}
		<div class="chips" role="group" aria-label="Country selection">
			{#each countries as c (c.id)}
				{@const selected = $config.selectedCountryIds.includes(c.id)}
				{@const fromYear = coverageYear(c)}
				<button
					class="chip"
					class:selected
					style={selected ? `--country-color: ${c.color}; background: ${c.color}1a; border-color: ${c.color};` : `--country-color: ${c.color};`}
					on:click={() => config.toggleCountry(c.id)}
					aria-pressed={selected}
					title={c.note ?? undefined}
				>
					<span class="swatch" style="background: {c.color}" aria-hidden="true"></span>
					<span class="code">{c.id.toUpperCase()}</span>
					<span class="name">{c.name}</span>
					{#if fromYear}
						<span class="coverage-hint">from {fromYear}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.country-selector {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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

	.bulk-actions {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.text-btn {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--mono-font);
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--black);
		cursor: pointer;
		opacity: 0.55;
		transition: opacity 0.12s;
	}

	.text-btn:hover {
		opacity: 1;
		text-decoration: underline;
	}

	.divider {
		font-size: 0.65rem;
		opacity: 0.35;
	}

	.loading {
		font-size: 0.7rem;
		opacity: 0.5;
		margin: 0;
	}

	/* Chip grid */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.625rem 0.3rem 0.5rem;
		border: 1px solid var(--black);
		background: var(--white);
		color: var(--black);
		font-family: var(--mono-font);
		font-size: 0.65rem;
		letter-spacing: 0.04em;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s;
		text-align: left;
	}

	.chip:hover {
		background: var(--gray);
	}

	.chip.selected {
		font-weight: 500;
	}

	.code {
		font-weight: 600;
		font-size: 0.62rem;
		letter-spacing: 0.06em;
	}

	.swatch {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.name {
		white-space: nowrap;
	}

	.coverage-hint {
		font-size: 0.55rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.6;
		margin-left: 0.15rem;
	}
</style>
