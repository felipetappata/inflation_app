// Pure helpers shared by the chart, tooltips and controls.
// No Svelte / DOM dependencies so they are trivially testable.

import type { CpiObservation, SeriesPoint } from '$lib/types/cpi';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Parse a 'YYYY-MM-DD' (or ISO) date string to a UTC timestamp. */
export function parseDate(date: string): number {
	// Treat plain 'YYYY-MM-DD' as UTC midnight so all clients agree.
	return new Date(date.length === 10 ? `${date}T00:00:00Z` : date).getTime();
}

/**
 * Normalize raw observations so the value equals 1.0 at the observation
 * on/closest to startDate, clipped to [startDate, endDate]. Returns an
 * ascending SeriesPoint[]. If no baseline can be found, returns [].
 */
export function normalizeSeries(
	obs: CpiObservation[],
	startDate: Date,
	endDate: Date
): SeriesPoint[] {
	if (!obs || obs.length === 0) return [];
	const startTs = startDate.getTime();
	const endTs = endDate.getTime();

	// Build timestamped points once.
	const points = obs.map((o) => ({ timestamp: parseDate(o.date), value: o.value }));
	points.sort((a, b) => a.timestamp - b.timestamp);

	// Find baseline = observation closest to startTs (prefer on/after, else nearest).
	let baseline: number | null = null;
	let bestDelta = Infinity;
	for (const p of points) {
		const delta = Math.abs(p.timestamp - startTs);
		if (delta < bestDelta) {
			bestDelta = delta;
			baseline = p.value;
		}
	}
	if (!baseline || baseline === 0) return [];

	const result: SeriesPoint[] = [];
	for (const p of points) {
		if (p.timestamp < startTs || p.timestamp > endTs) continue;
		result.push({ timestamp: p.timestamp, value: p.value / baseline });
	}
	return result;
}

/** Binary search for the point nearest to a timestamp. Points must be ascending. */
export function findNearest(points: SeriesPoint[], ts: number): SeriesPoint | null {
	if (!points || points.length === 0) return null;
	let lo = 0;
	let hi = points.length - 1;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (points[mid].timestamp === ts) return points[mid];
		if (points[mid].timestamp < ts) lo = mid + 1;
		else hi = mid;
	}
	const left = points[Math.max(0, lo - 1)];
	const right = points[Math.min(points.length - 1, lo)];
	return Math.abs(left.timestamp - ts) <= Math.abs(right.timestamp - ts) ? left : right;
}

/** Compound annual growth rate (%) between two normalized values. */
export function annualizedRate(
	startVal: number,
	endVal: number,
	startTs: number,
	endTs: number
): number {
	const years = (endTs - startTs) / MS_PER_YEAR;
	if (years <= 0 || startVal <= 0) return 0;
	return (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
}

/** Total percentage change between two normalized values. */
export function totalChange(startVal: number, endVal: number): number {
	if (startVal === 0) return 0;
	return (endVal / startVal - 1) * 100;
}
