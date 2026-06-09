// Core data types for the Rates & Levels app.
// See CONTRACT.md for the full data-shape specification.

/** One raw CPI observation as stored in static/data/<id>.json */
export interface CpiObservation {
	/** ISO date, 'YYYY-MM-DD' */
	date: string;
	/** Raw CPI index value (units vary by series, e.g. Index 2015=100) */
	value: number;
}

/** Metadata for one country's CPI series (from static/data/index.json) */
export interface CountryMeta {
	id: string;
	name: string;
	flag: string;
	seriesId: string;
	sourceAgency: string;
	fredTitle: string;
	units: string;
	frequency: string;
	seasonalAdjustment: string;
	fredUrl: string;
	/** First observation date 'YYYY-MM-DD' */
	start: string;
	/** Last observation date 'YYYY-MM-DD' */
	end: string;
	/** Full Chicago-style footnote citation string */
	citation: string;
	/** Hex line color */
	color: string;
	/** Whether selected on first load */
	defaultSelected: boolean;
	/** Optional caveat about data coverage (e.g. limited range) */
	note?: string;
}

/** Top-level data index (static/data/index.json) */
export interface DataIndex {
	generatedAt: string;
	accessedDate: string;
	source: string;
	countries: CountryMeta[];
}

/** A country's full series file (static/data/<id>.json) */
export interface CountrySeries {
	id: string;
	seriesId: string;
	data: CpiObservation[];
}

/** Runtime point used by the chart: normalized value (≈1.0 at period start) */
export interface SeriesPoint {
	timestamp: number;
	value: number;
}
