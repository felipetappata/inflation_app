import { writable } from 'svelte/store';

// Default period: a long, instructive sweep. End is reconciled to the latest
// available observation once data loads (see historical-data + page).
export const DEFAULT_START = new Date(Date.UTC(1980, 0, 1));
export const DEFAULT_END = new Date(Date.UTC(2025, 0, 1));

// Earliest the user can dial the start back to (most OECD CPI series begin 1955-ish).
export const MIN_START = new Date(Date.UTC(1955, 0, 1));

export interface ConfigState {
	startDate: Date;
	endDate: Date;
	/** order = draw / legend order */
	selectedCountryIds: string[];
}

const INITIAL: ConfigState = {
	startDate: DEFAULT_START,
	endDate: DEFAULT_END,
	selectedCountryIds: []
};

function createConfigStore() {
	const { subscribe, update, set } = writable<ConfigState>(INITIAL);

	return {
		subscribe,
		set,
		setPeriod: (startDate: Date, endDate: Date) =>
			update((s) => ({ ...s, startDate, endDate })),
		setStart: (startDate: Date) => update((s) => ({ ...s, startDate })),
		setEnd: (endDate: Date) => update((s) => ({ ...s, endDate })),
		setCountries: (ids: string[]) => update((s) => ({ ...s, selectedCountryIds: [...ids] })),
		toggleCountry: (id: string) =>
			update((s) => {
				const has = s.selectedCountryIds.includes(id);
				return {
					...s,
					selectedCountryIds: has
						? s.selectedCountryIds.filter((x) => x !== id)
						: [...s.selectedCountryIds, id]
				};
			}),
		reset: () => set(INITIAL)
	};
}

export const config = createConfigStore();
