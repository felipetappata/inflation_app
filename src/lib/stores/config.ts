import { writable } from 'svelte/store';

export const START_DATE = new Date(1980, 0, 1);  // January 1, 2000
export const WINDOW_YEARS = 25;

interface ConfigState {
    startDate: Date;
    windowYears: number;
}

function createConfigStore() {
    const { subscribe } = writable<ConfigState>({
        startDate: START_DATE,
        windowYears: WINDOW_YEARS
    });

    return {
        subscribe
    };
}

export const config = createConfigStore();
