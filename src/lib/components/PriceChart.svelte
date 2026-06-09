<script lang="ts">
	import { config } from '$lib/stores/config';
	import { simulation } from '$lib/stores/simulation';
	import { historicalData } from '$lib/stores/historical-data';
	import { normalizeSeries, findNearest, annualizedRate, totalChange } from '$lib/util/normalize';
	import type { SeriesPoint, CountryMeta } from '$lib/types/cpi';
	import { scaleLinear, scaleLog, scaleTime } from 'd3-scale';
	import { line, curveMonotoneX } from 'd3-shape';

	// ─── Layout constants ─────────────────────────────────────────────────────
	const LEFT_MARGIN = 64;
	const RIGHT_MARGIN = 44; // room for the leading-edge labels
	const TOP_MARGIN = 24;
	const BOTTOM_MARGIN = 36;
	const CHART_HEIGHT = 400;

	// "Driving along": the current moment is pinned at the right edge and the
	// x-axis shows a trailing look-back window that scrolls as time advances.
	const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
	const MONTH_MS = YEAR_MS / 12;
	const WINDOW_YEARS = 25;

	// Clip points to [leftTs, rightTs], keeping the last point just before the
	// window so the line reaches the left edge instead of stepping in.
	function clipWindow(pts: SeriesPoint[], leftTs: number, rightTs: number): SeriesPoint[] {
		const out: SeriesPoint[] = [];
		let before: SeriesPoint | null = null;
		for (const p of pts) {
			if (p.timestamp < leftTs) {
				before = p;
				continue;
			}
			if (p.timestamp > rightTs) break;
			out.push(p);
		}
		if (before && (out.length === 0 || out[0].timestamp > leftTs)) out.unshift(before);
		return out;
	}

	// ─── Responsive width ─────────────────────────────────────────────────────
	let width = 0;

	// ─── Scale toggle (local state) ───────────────────────────────────────────
	let scaleType: 'linear' | 'log' = 'linear';

	// ─── Full normalized series (recomputed only when config / data changes) ──
	interface CountrySeries {
		meta: CountryMeta;
		full: SeriesPoint[];
	}

	let series: CountrySeries[] = [];

	$: {
		const hd = $historicalData;
		const cfg = $config;
		if (hd.loaded && hd.index && cfg.selectedCountryIds.length > 0) {
			series = cfg.selectedCountryIds
				.map((id) => {
					const meta = hd.index!.countries.find((c) => c.id === id);
					const obs = hd.series[id] ?? [];
					if (!meta || obs.length === 0) return null;
					const full = normalizeSeries(obs, cfg.startDate, cfg.endDate);
					if (full.length === 0) return null;
					return { meta, full } as CountrySeries;
				})
				.filter((s): s is CountrySeries => s !== null);
		} else {
			series = [];
		}
	}

	// ─── Trailing window bounds (the leading edge is windowRightTs) ───────────
	$: windowRightTs = $simulation.currentDate.getTime();
	$: windowLeftTs = Math.min(
		Math.max($config.startDate.getTime(), windowRightTs - WINDOW_YEARS * YEAR_MS),
		windowRightTs - MONTH_MS
	);

	// ─── Visible slices (per animation tick) ──────────────────────────────────
	interface VisibleSeries {
		meta: CountryMeta;
		visible: SeriesPoint[];
	}

	let visibleSeries: VisibleSeries[] = [];

	$: {
		visibleSeries = series.map(({ meta, full }) => ({
			meta,
			visible: clipWindow(full, windowLeftTs, windowRightTs)
		}));
	}

	// Simulated path, clipped to the same trailing window.
	$: simPoints = clipWindow($simulation.dataPoints, windowLeftTs, windowRightTs);

	// ─── Y-domain (stable — over full period, not just visible) ──────────────
	// True max/min across every selected series plus the simulated projection.
	// Scaled to the VISIBLE window so the plot accommodates as it scrolls.
	$: dataMax = (() => {
		let max = 1;
		for (const { visible } of visibleSeries)
			for (const p of visible) if (p.value > max) max = p.value;
		for (const p of simPoints) if (p.value > max) max = p.value;
		return max;
	})();

	$: dataMin = (() => {
		let min = 1;
		for (const { visible } of visibleSeries)
			for (const p of visible) if (p.value > 0 && p.value < min) min = p.value;
		for (const p of simPoints) if (p.value > 0 && p.value < min) min = p.value;
		return min;
	})();

	// Linear: cap extreme outliers so one hyperinflation line doesn't crush the
	// rest (the user can switch to log). Log: use the true range so the whole
	// hyperinflation story is visible across orders of magnitude.
	$: yMax =
		scaleType === 'log'
			? Math.pow(10, Math.ceil(Math.log10(Math.max(dataMax, 10))))
			: (() => {
					let max = dataMax;
					if (max > 30) max = Math.min(max, 50);
					if (max <= 2) return Math.ceil(max * 10) / 10 + 0.2;
					if (max <= 5) return Math.ceil(max) + 0.5;
					return Math.ceil(max / 5) * 5 + 2;
				})();

	$: yMin =
		scaleType === 'log' ? Math.pow(10, Math.floor(Math.log10(Math.min(dataMin, 0.9)))) : 0;

	// ─── Scales ───────────────────────────────────────────────────────────────
	$: xScale =
		width > 0
			? scaleTime()
					.domain([windowLeftTs, windowRightTs])
					.range([LEFT_MARGIN, width - RIGHT_MARGIN])
			: null;

	$: yScale =
		width > 0
			? scaleType === 'log'
				? scaleLog()
						.domain([Math.max(yMin, 0.01), yMax])
						.range([CHART_HEIGHT - BOTTOM_MARGIN, TOP_MARGIN])
						.clamp(true)
				: scaleLinear()
						.domain([0, yMax])
						.range([CHART_HEIGHT - BOTTOM_MARGIN, TOP_MARGIN])
			: null;

	// ─── Path generator ───────────────────────────────────────────────────────
	$: pathGen =
		xScale && yScale
			? line<SeriesPoint>()
					.x((d) => xScale!(d.timestamp))
					.y((d) => yScale!(d.value))
					.curve(curveMonotoneX)
					.defined((d) => d.value > 0)
			: null;

	// ─── X-axis ticks ─────────────────────────────────────────────────────────
	$: xTicks = (() => {
		if (!xScale || width === 0) return [];
		const spanYears = (windowRightTs - windowLeftTs) / YEAR_MS;
		const availWidth = width - LEFT_MARGIN - RIGHT_MARGIN;
		// Aim for labels every ~60px
		let interval = Math.max(1, Math.round(spanYears / (availWidth / 60)));
		if (interval > 3) interval = Math.ceil(interval / 5) * 5;
		// Calendar-aligned year ticks so they scroll leftward like mile markers.
		const leftYear = new Date(windowLeftTs).getUTCFullYear();
		const rightYear = new Date(windowRightTs).getUTCFullYear();
		const ticks: Date[] = [];
		for (let y = leftYear; y <= rightYear; y++) {
			if (y % interval !== 0) continue;
			const ts = Date.UTC(y, 0, 1);
			if (ts >= windowLeftTs && ts <= windowRightTs) ticks.push(new Date(ts));
		}
		return ticks;
	})();

	// ─── Y-axis ticks ─────────────────────────────────────────────────────────
	$: yTicks = (() => {
		if (!yScale) return [];
		if (scaleType === 'log') {
			// Clean decade ticks (powers of 10) across the range.
			const ticks: number[] = [];
			const startE = Math.floor(Math.log10(yMin));
			const endE = Math.ceil(Math.log10(yMax));
			for (let e = startE; e <= endE; e++) {
				const v = Math.pow(10, e);
				if (v >= yMin * 0.999 && v <= yMax * 1.001) ticks.push(v);
			}
			return ticks;
		}
		return yScale.ticks(5);
	})();

	function formatMoney(v: number): string {
		if (v >= 1e12) return `$${(v / 1e12).toFixed(v >= 1e13 ? 0 : 1)}T`;
		if (v >= 1e9) return `$${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)}B`;
		if (v >= 1e6) return `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
		if (v >= 1e3) return `$${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K`;
		if (v >= 100) return `$${Math.round(v)}`;
		if (v >= 10) return `$${v.toFixed(1)}`;
		return `$${v.toFixed(2)}`;
	}

	function formatYear(d: Date): string {
		return d.getUTCFullYear().toString();
	}

	// ─── End-of-line labels ───────────────────────────────────────────────────
	interface EndLabel {
		x: number;
		y: number;
		text: string;
		color: string;
	}

	$: endLabels = (() => {
		if (!xScale || !yScale) return [];
		const labels: EndLabel[] = [];
		for (const { meta, visible } of visibleSeries) {
			if (visible.length === 0) continue;
			const last = visible[visible.length - 1];
			labels.push({
				x: xScale!(last.timestamp),
				y: yScale!(last.value),
				text: meta.id.toUpperCase(),
				color: meta.color
			});
		}
		// Simulated end label
		if (simPoints.length > 0) {
			const last = simPoints[simPoints.length - 1];
			labels.push({
				x: xScale!(last.timestamp),
				y: yScale!(last.value),
				text: 'SIM',
				color: 'var(--orange)'
			});
		}
		// Simple deduplication/offset: sort by y, push overlapping ones apart
		labels.sort((a, b) => a.y - b.y);
		for (let i = 1; i < labels.length; i++) {
			if (labels[i].y - labels[i - 1].y < 14) {
				labels[i].y = labels[i - 1].y + 14;
			}
		}
		return labels;
	})();

	// ─── Hover tooltip ────────────────────────────────────────────────────────
	interface HoverEntry {
		meta: CountryMeta | null; // null = simulated
		value: number;
		timestamp: number;
	}

	let mouseX = 0;
	let mouseY = 0;
	let hoveredTs: number | null = null;
	let hoverEntries: HoverEntry[] = [];
	let lastHoveredNearestTs: number | null = null;

	function handleMouseMove(e: MouseEvent) {
		if (!xScale || !yScale) return;
		// Coordinates must be relative to the SVG origin (not the inset overlay
		// rect, which starts at LEFT_MARGIN) so xScale.invert and margin checks line up.
		const svgEl = (e.currentTarget as SVGElement).ownerSVGElement;
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const svgX = e.clientX - rect.left;
		const svgY = e.clientY - rect.top;
		mouseX = svgX;
		mouseY = svgY;

		// ── Handle drag-select movement ──────────────────────────────────
		if (isSelecting) {
			selEnd = Math.min(Math.max(svgX, LEFT_MARGIN), width - RIGHT_MARGIN);
			updateSelectionStats();
		}

		// ── Hover tooltip ──────────────────────────────────────────────
		// The lastHoveredNearestTs guard (update only when the nearest point
		// changes) is what prevents flicker — no RAF needed, so it also stays
		// responsive in background tabs.
		const ts = (xScale.invert(svgX) as Date).getTime();
		let nearestTs: number | null = null;
		if (simPoints.length > 0) {
			const pt = findNearest(simPoints, ts);
			if (pt) nearestTs = pt.timestamp;
		}
		if (nearestTs === null) {
			for (const { visible } of visibleSeries) {
				if (visible.length > 0) {
					const pt = findNearest(visible, ts);
					if (pt) { nearestTs = pt.timestamp; break; }
				}
			}
		}
		if (nearestTs === null) return;
		if (nearestTs === lastHoveredNearestTs) return;
		lastHoveredNearestTs = nearestTs;
		hoveredTs = nearestTs;

		const entries: HoverEntry[] = [];
		if (simPoints.length > 0) {
			const pt = findNearest(simPoints, nearestTs);
			if (pt) entries.push({ meta: null, value: pt.value, timestamp: pt.timestamp });
		}
		for (const { meta, visible } of visibleSeries) {
			if (visible.length === 0) continue;
			const pt = findNearest(visible, nearestTs);
			if (pt) entries.push({ meta, value: pt.value, timestamp: pt.timestamp });
		}
		hoverEntries = entries;
	}

	function handleMouseLeave() {
		hoveredTs = null;
		hoverEntries = [];
		lastHoveredNearestTs = null;
	}

	$: hoveredX = hoveredTs !== null && xScale ? xScale(hoveredTs) : null;

	function tooltipDate(ts: number): string {
		return new Date(ts).toLocaleDateString('en-US', {
			month: 'short',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}

	// Tooltip positioning (avoid right / bottom edge)
	$: tooltipLeft = (() => {
		if (hoveredX === null) return 0;
		return hoveredX + 12 > width - 160 ? hoveredX - 168 : hoveredX + 12;
	})();

	// ─── Drag-select range ────────────────────────────────────────────────────
	let isSelecting = false;
	let selStart: number | null = null; // pixel x
	let selEnd: number | null = null;   // pixel x

	interface SelectionStats {
		label: string;
		color: string;
		code: string;
		startVal: number;
		endVal: number;
		total: number;
		cagr: number;
		startTs: number;
		endTs: number;
	}

	let selectionStats: SelectionStats[] = [];

	function handleMouseDown(e: MouseEvent) {
		if (!xScale) return;
		const svgEl = (e.currentTarget as SVGElement).ownerSVGElement;
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const svgX = e.clientX - rect.left;
		if (svgX < LEFT_MARGIN || svgX > width - RIGHT_MARGIN) return;
		simulation.pause();
		isSelecting = true;
		selStart = svgX;
		selEnd = svgX;
		selectionStats = [];
	}

	// Selection drag movement is merged into handleMouseMove below — no separate handler needed.

	function handleMouseUp(e: MouseEvent) {
		if (!isSelecting) return;
		const wasDrag = selStart !== null && selEnd !== null && Math.abs(selEnd - selStart) > 4;
		isSelecting = false;
		if (!wasDrag) {
			// Click without drag: clear selection
			selStart = null;
			selEnd = null;
			selectionStats = [];
		}
	}

	function updateSelectionStats() {
		if (!xScale || selStart === null || selEnd === null) return;
		const t1 = (xScale.invert(Math.min(selStart, selEnd)) as Date).getTime();
		const t2 = (xScale.invert(Math.max(selStart, selEnd)) as Date).getTime();
		const stats: SelectionStats[] = [];

		// Simulated
		if (simPoints.length > 0) {
			const p1 = findNearest(simPoints, t1);
			const p2 = findNearest(simPoints, t2);
			if (p1 && p2 && p1.timestamp !== p2.timestamp) {
				stats.push({
					label: 'Simulated',
					color: '#F78A01',
					code: '',
					startVal: p1.value,
					endVal: p2.value,
					total: totalChange(p1.value, p2.value),
					cagr: annualizedRate(p1.value, p2.value, p1.timestamp, p2.timestamp),
					startTs: p1.timestamp,
					endTs: p2.timestamp
				});
			}
		}
		// Countries
		for (const { meta, visible } of visibleSeries) {
			if (visible.length === 0) continue;
			const p1 = findNearest(visible, t1);
			const p2 = findNearest(visible, t2);
			if (p1 && p2 && p1.timestamp !== p2.timestamp) {
				stats.push({
					label: meta.name,
					color: meta.color,
					code: meta.id.toUpperCase(),
					startVal: p1.value,
					endVal: p2.value,
					total: totalChange(p1.value, p2.value),
					cagr: annualizedRate(p1.value, p2.value, p1.timestamp, p2.timestamp),
					startTs: p1.timestamp,
					endTs: p2.timestamp
				});
			}
		}
		selectionStats = stats;
	}

	// Selection rect geometry
	$: selRect =
		selStart !== null && selEnd !== null
			? {
					x: Math.min(selStart, selEnd),
					w: Math.abs(selEnd - selStart),
					y: TOP_MARGIN,
					h: CHART_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
				}
			: null;

	// ─── Legend live values ───────────────────────────────────────────────────
	interface LegendEntry {
		meta: CountryMeta | null;
		label: string;
		color: string;
		code: string;
		currentValue: number;
	}

	$: legendEntries = (() => {
		const entries: LegendEntry[] = [];
		// Simulated first
		const simLast = simPoints.length > 0 ? simPoints[simPoints.length - 1].value : 1;
		entries.push({
			meta: null,
			label: `Simulated (${$simulation.inflationRate}%/yr)`,
			color: '#F78A01',
			code: '',
			currentValue: simLast
		});
		// Countries
		for (const { meta, visible } of visibleSeries) {
			const last = visible.length > 0 ? visible[visible.length - 1].value : null;
			if (last === null) continue;
			entries.push({
				meta,
				label: meta.name,
				color: meta.color,
				code: meta.id.toUpperCase(),
				currentValue: last
			});
		}
		return entries;
	})();
</script>

<!-- ─── Root ─────────────────────────────────────────────────────────────── -->
<div class="chart-root">

	<!-- ─── States: loading / empty / error ─────────────────────────────── -->
	{#if !$historicalData.loaded}
		<div class="state-msg">Loading data…</div>
	{:else if $historicalData.error}
		<div class="state-msg error">{$historicalData.error}</div>
	{:else if $config.selectedCountryIds.length === 0}
		<div class="state-msg">Select one or more countries to compare.</div>
	{:else}

		<!-- ─── Legend + toggle ──────────────────────────────────────────── -->
		<div class="chart-header">
			<div class="legend">
				{#each legendEntries as entry}
					<div class="legend-entry">
						<span
							class="legend-swatch"
							style="background: {entry.color}; {entry.meta === null ? 'border: 1.5px dashed ' + entry.color + '; background: transparent;' : ''}"
						></span>
						{#if entry.code}
							<span class="legend-code">{entry.code}</span>
						{/if}
						<span class="legend-name">{entry.label}</span>
						<span class="legend-value">{formatMoney(entry.currentValue)}</span>
					</div>
				{/each}
			</div>
			<button
				class="scale-toggle"
				on:click={() => (scaleType = scaleType === 'linear' ? 'log' : 'linear')}
				aria-label="Toggle scale between linear and logarithmic"
			>
				{scaleType === 'linear' ? 'Linear' : 'Log'}
			</button>
		</div>

		<!-- ─── Chart area ───────────────────────────────────────────────── -->
		<div class="chart-container" bind:clientWidth={width}>
			{#if width > 0 && xScale && yScale && pathGen}
				<svg
					{width}
					height={CHART_HEIGHT}
					aria-label="Price level chart"
					role="img"
				>
					<!-- Grid lines -->
					{#each yTicks as tick}
						{#if yScale(tick) >= TOP_MARGIN && yScale(tick) <= CHART_HEIGHT - BOTTOM_MARGIN}
							<line
								x1={LEFT_MARGIN}
								x2={width - RIGHT_MARGIN}
								y1={yScale(tick)}
								y2={yScale(tick)}
								class="grid-line"
							/>
						{/if}
					{/each}

					<!-- Y-axis -->
					{#each yTicks as tick}
						{#if yScale(tick) >= TOP_MARGIN && yScale(tick) <= CHART_HEIGHT - BOTTOM_MARGIN}
							<text
								x={LEFT_MARGIN - 6}
								y={yScale(tick)}
								class="axis-text"
								text-anchor="end"
								dominant-baseline="middle">{formatMoney(tick)}</text
							>
						{/if}
					{/each}

					<!-- X-axis line -->
					<line
						x1={LEFT_MARGIN}
						x2={width - RIGHT_MARGIN}
						y1={CHART_HEIGHT - BOTTOM_MARGIN}
						y2={CHART_HEIGHT - BOTTOM_MARGIN}
						class="axis-line"
					/>

					<!-- X-axis ticks + labels -->
					{#each xTicks as d}
						<g transform="translate({xScale(d)}, {CHART_HEIGHT - BOTTOM_MARGIN})">
							<line y1="0" y2="4" class="axis-tick" />
							<text y="16" class="axis-text" text-anchor="middle">{formatYear(d)}</text>
						</g>
					{/each}

					<!-- Country lines -->
					{#each visibleSeries as { meta, visible }}
						{#if visible.length > 1}
							<path
								d={pathGen(visible) ?? ''}
								fill="none"
								stroke={meta.color}
								stroke-width="1.5"
								stroke-linejoin="round"
							/>
						{/if}
					{/each}

					<!-- Simulated line -->
					{#if simPoints.length > 1}
						<path
							d={pathGen(simPoints) ?? ''}
							fill="none"
							stroke="var(--orange)"
							stroke-width="2"
							stroke-dasharray="5 3"
							stroke-linejoin="round"
						/>
					{/if}

					<!-- End-of-line labels -->
					{#each endLabels as lbl}
						<text
							x={lbl.x + 5}
							y={lbl.y}
							class="end-label"
							fill={lbl.color}
							dominant-baseline="middle"
						>{lbl.text}</text
						>
					{/each}

					<!-- Selection rect -->
					{#if selRect}
						<rect
							x={selRect.x}
							y={selRect.y}
							width={selRect.w}
							height={selRect.h}
							class="selection-rect"
						/>
					{/if}

					<!-- Hover guide line -->
					{#if hoveredTs !== null && hoveredX !== null}
						<line
							x1={hoveredX}
							x2={hoveredX}
							y1={TOP_MARGIN}
							y2={CHART_HEIGHT - BOTTOM_MARGIN}
							class="hover-line"
						/>
					{/if}

					<!-- Hover dots -->
					{#if hoveredTs !== null && xScale && yScale}
						{#each hoverEntries as entry}
							{#if entry.value > 0}
								<circle
									cx={xScale(entry.timestamp)}
									cy={yScale(entry.value)}
									r="4"
									class="hover-dot"
									stroke={entry.meta ? entry.meta.color : '#F78A01'}
								/>
							{/if}
						{/each}
					{/if}

					<!-- Transparent interaction overlay (single rect — no per-line handlers) -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<rect
						x={LEFT_MARGIN}
						y={TOP_MARGIN}
						width={width - LEFT_MARGIN - RIGHT_MARGIN}
						height={CHART_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN}
						fill="transparent"
						class="interaction-layer"
						on:mousemove={handleMouseMove}
						on:mouseleave={handleMouseLeave}
						on:mousedown={handleMouseDown}
						on:mouseup={handleMouseUp}
					/>
				</svg>

				<!-- Hover tooltip (HTML overlay) -->
				{#if hoveredTs !== null && hoverEntries.length > 0}
					<div
						class="tooltip"
						style="left: {tooltipLeft}px; top: {Math.min(mouseY - 16, CHART_HEIGHT - 120)}px;"
					>
						<div class="tooltip-date">{tooltipDate(hoverEntries[0].timestamp)}</div>
						{#each hoverEntries as entry}
							<div class="tooltip-row">
								<span
									class="tooltip-swatch"
									style="background:{entry.meta ? entry.meta.color : '#F78A01'}; {entry.meta === null ? 'border: 1.5px dashed #F78A01; background: transparent;' : ''}"
								></span>
								<span class="tooltip-label"
									>{entry.meta ? entry.meta.id.toUpperCase() : 'SIM'}</span
								>
								<span class="tooltip-val">{formatMoney(entry.value)}</span>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>

		<!-- ─── Selection range panel ────────────────────────────────────── -->
		{#if selectionStats.length > 0 && selRect && selRect.w > 4}
			<div class="selection-panel">
				<div class="sel-header">
					{#if selectionStats.length > 0}
						<span class="sel-dates">
							{tooltipDate(selectionStats[0].startTs)} — {tooltipDate(selectionStats[0].endTs)}
						</span>
					{/if}
				</div>
				<div class="sel-rows">
					{#each selectionStats as stat}
						<div class="sel-row">
							<div class="sel-label" style="color:{stat.color}">
								{#if stat.code}<span class="sel-code">{stat.code}</span>{/if}
								<span>{stat.label}</span>
							</div>
							<div class="sel-data">
								<span class="sel-change"
									>{formatMoney(stat.startVal)} → {formatMoney(stat.endVal)}</span
								>
								<span class="sel-total" title="Total change"
									>{stat.total >= 0 ? '+' : ''}{stat.total.toFixed(1)}%</span
								>
								<span class="sel-cagr" title="Annualized (CAGR)"
									>{stat.cagr >= 0 ? '+' : ''}{stat.cagr.toFixed(1)}%/yr</span
								>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.chart-root {
		width: 100%;
		font-family: var(--mono-font);
	}

	/* ─── State messages ───────────────────────────────────────────────────── */
	.state-msg {
		padding: 2rem;
		text-align: center;
		font-size: 0.75rem;
		color: var(--black);
		opacity: 0.5;
		border: 1px solid var(--gray);
		background: var(--light-gray);
	}
	.state-msg.error {
		color: #c00;
		opacity: 1;
	}

	/* ─── Header: legend + toggle ──────────────────────────────────────────── */
	.chart-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}

	.legend-entry {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.65rem;
		color: var(--black);
	}

	.legend-swatch {
		display: inline-block;
		width: 14px;
		height: 3px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.legend-code {
		font-weight: 600;
		font-size: 0.6rem;
		letter-spacing: 0.05em;
	}

	.legend-name {
		opacity: 0.75;
	}

	.legend-value {
		font-weight: 600;
	}

	/* ─── Scale toggle ─────────────────────────────────────────────────────── */
	.scale-toggle {
		font-family: var(--mono-font);
		font-size: 0.6rem;
		padding: 0.2rem 0.5rem;
		border: 1px solid var(--black);
		background: var(--white);
		color: var(--black);
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		flex-shrink: 0;
		transition: background 0.1s, color 0.1s;
	}
	.scale-toggle:hover {
		background: var(--black);
		color: var(--white);
	}

	/* ─── Chart container ──────────────────────────────────────────────────── */
	.chart-container {
		width: 100%;
		position: relative;
		border: 1px solid var(--black);
		background: var(--white);
		box-sizing: border-box;
	}

	/* ─── SVG elements ─────────────────────────────────────────────────────── */
	.grid-line {
		stroke: var(--black);
		stroke-opacity: 0.08;
		stroke-width: 0.5;
	}

	.axis-line {
		stroke: var(--black);
		stroke-width: 0.75;
	}

	.axis-tick {
		stroke: var(--black);
		stroke-width: 0.75;
	}

	.axis-text {
		font-size: 0.6rem;
		fill: var(--black);
		font-family: var(--mono-font);
		user-select: none;
	}

	.end-label {
		font-size: 0.6rem;
		font-family: var(--mono-font);
		user-select: none;
		pointer-events: none;
	}

	.hover-line {
		stroke: var(--black);
		stroke-width: 0.75;
		stroke-dasharray: 3 3;
		opacity: 0.35;
		pointer-events: none;
	}

	.hover-dot {
		fill: var(--white);
		stroke-width: 2;
		pointer-events: none;
	}

	.selection-rect {
		fill: var(--orange);
		opacity: 0.1;
		pointer-events: none;
	}

	.interaction-layer {
		cursor: crosshair;
		user-select: none;
	}

	/* ─── Hover tooltip ────────────────────────────────────────────────────── */
	.tooltip {
		position: absolute;
		background: var(--white);
		border: 1px solid var(--black);
		box-shadow: 2px 2px 0 var(--black);
		padding: 0.4rem 0.6rem;
		font-family: var(--mono-font);
		font-size: 0.65rem;
		pointer-events: none;
		z-index: 10;
		min-width: 140px;
	}

	.tooltip-date {
		font-weight: 600;
		margin-bottom: 0.3rem;
		opacity: 0.7;
		font-size: 0.6rem;
		letter-spacing: 0.03em;
	}

	.tooltip-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.1rem 0;
	}

	.tooltip-swatch {
		display: inline-block;
		width: 10px;
		height: 2px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.sel-code {
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.tooltip-label {
		flex: 1;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 90px;
	}

	.tooltip-val {
		font-weight: 600;
		margin-left: auto;
	}

	/* ─── Selection range panel ────────────────────────────────────────────── */
	.selection-panel {
		margin-top: 0.75rem;
		border: 1px solid var(--black);
		background: var(--light-gray);
		padding: 0.75rem 1rem;
		font-family: var(--mono-font);
		font-size: 0.65rem;
	}

	.sel-header {
		margin-bottom: 0.5rem;
	}

	.sel-dates {
		font-weight: 600;
		font-size: 0.7rem;
		letter-spacing: 0.02em;
	}

	.sel-rows {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.sel-row {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
		border-top: 1px solid rgba(26, 26, 26, 0.1);
		padding-top: 0.35rem;
	}

	.sel-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-weight: 600;
		min-width: 8rem;
	}

	.sel-data {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.sel-change {
		opacity: 0.75;
	}

	.sel-total {
		font-weight: 600;
	}

	.sel-cagr {
		opacity: 0.85;
	}
</style>
