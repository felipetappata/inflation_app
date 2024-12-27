import { writable } from 'svelte/store';
import type { CountryData } from '$lib/types/cpi';
import { START_DATE } from './config';

function createHistoricalDataStore() {
    const { subscribe, set } = writable<CountryData[]>([]);

    return {
        subscribe,
        initialize: async () => {
            try {
                const response = await fetch('data/usa.json');
                const usaData = await response.json();

                // Find the baseline value (closest to START_DATE)
                const baselineValue = usaData.data.find(d => 
                    new Date(d.date).getTime() === START_DATE.getTime()
                )?.value;

                if (!baselineValue) {
                    console.error('Could not find baseline value for normalization');
                    return;
                }

                // Normalize all values relative to the baseline
                const normalizedData = {
                    ...usaData,
                    data: usaData.data.map((d: any) => ({
                        date: new Date(d.date),
                        value: d.value / baselineValue
                    }))
                };

                set([normalizedData]);
            } catch (error) {
                console.error('Failed to load historical data:', error);
                set([]);
            }
        }
    };
}

export const historicalData = createHistoricalDataStore();
