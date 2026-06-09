import { writable } from 'svelte/store';
import { base } from '$app/paths';
import type { CpiObservation, DataIndex } from '$lib/types/cpi';

export interface HistoricalState {
	index: DataIndex | null;
	/** raw observations by country id */
	series: Record<string, CpiObservation[]>;
	loaded: boolean;
	error: string | null;
}

const INITIAL: HistoricalState = {
	index: null,
	series: {},
	loaded: false,
	error: null
};

function createHistoricalDataStore() {
	const { subscribe, set, update } = writable<HistoricalState>(INITIAL);
	let started = false;

	async function initialize() {
		if (started) return;
		started = true;
		try {
			const indexRes = await fetch(`${base}/data/index.json`);
			if (!indexRes.ok) throw new Error(`index.json ${indexRes.status}`);
			const index: DataIndex = await indexRes.json();

			// Load every country's series in parallel.
			const entries = await Promise.all(
				index.countries.map(async (c) => {
					try {
						const res = await fetch(`${base}/data/${c.id}.json`);
						if (!res.ok) throw new Error(`${c.id}.json ${res.status}`);
						const json = await res.json();
						return [c.id, json.data as CpiObservation[]] as const;
					} catch (e) {
						console.error(`Failed to load series for ${c.id}`, e);
						return [c.id, [] as CpiObservation[]] as const;
					}
				})
			);

			const series: Record<string, CpiObservation[]> = {};
			for (const [id, data] of entries) series[id] = data;

			set({ index, series, loaded: true, error: null });
		} catch (error) {
			console.error('Failed to load historical data index:', error);
			set({ ...INITIAL, loaded: true, error: String(error) });
		}
	}

	return { subscribe, initialize, _reset: () => { started = false; set(INITIAL); } };
}

export const historicalData = createHistoricalDataStore();
