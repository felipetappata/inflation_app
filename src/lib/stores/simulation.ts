import { writable } from 'svelte/store';
import { START_DATE } from './config';

interface DataPoint {
    timestamp: number;
    simulatedPrice: number;
}

interface SimulationState {
    inflationRate: number;
    isRunning: boolean;
    hyperModeEnabled: false;  // Changed from argentinaModeEnabled
    currentPrice: number;
    dataPoints: DataPoint[];
    currentDate: Date;
}

const INITIAL_STATE: SimulationState = {
    inflationRate: 2,
    isRunning: true,
    hyperModeEnabled: false,  // Changed from argentinaModeEnabled
    currentPrice: 1.00,  // Start with $1.00
    dataPoints: [],
    currentDate: START_DATE
};

function createSimulationStore() {
    const { subscribe, set, update } = writable<SimulationState>(INITIAL_STATE);

    const simulateMonth = (price: number, annualRate: number) => {
        // Current: price * (1 + annualRate / 100 / 12)
        // Should be: price * Math.pow(1 + annualRate / 100, 1/12)
        return price * Math.pow(1 + annualRate / 100, 1/12);
    };

    const WINDOW_YEARS = 25;

    return {
        subscribe,
        setInflationRate: (rate: number) => update(state => ({ ...state, inflationRate: rate })),
        toggleRunning: () => update(state => ({ ...state, isRunning: !state.isRunning })),
        toggleHyperMode: () => update(state => ({  // Changed from toggleArgentinaMode
            ...state, 
            hyperModeEnabled: !state.hyperModeEnabled,
            inflationRate: !state.hyperModeEnabled && state.inflationRate > 18 ? 18 : state.inflationRate
        })),
        tick: () => update(state => {
            if (!state.isRunning) return state;
            
            const newPrice = simulateMonth(state.currentPrice, state.inflationRate);
            const newDate = new Date(state.currentDate);
            newDate.setMonth(newDate.getMonth() + 1);

            const newDataPoint = {
                timestamp: newDate.getTime(),
                simulatedPrice: newPrice
            };

            // Calculate window start (25 years before current date)
            const windowStart = new Date(newDate);
            windowStart.setFullYear(windowStart.getFullYear() - WINDOW_YEARS);

            // Keep only points within the 25-year window
            const dataPoints = [...state.dataPoints, newDataPoint]
                .filter(point => point.timestamp >= windowStart.getTime());

            return {
                ...state,
                currentPrice: newPrice,
                currentDate: newDate,
                dataPoints
            };
        }),
        reset: () => set(INITIAL_STATE),
        pause: () => update(state => ({ ...state, isRunning: false }))
    };
}

export const simulation = createSimulationStore();
