import { writable } from 'svelte/store';

interface DataPoint {
    timestamp: number;
    simulatedPrice: number;
}

interface SimulationState {
    inflationRate: number;
    isRunning: boolean;
    argentinaModeEnabled: false;
    currentPrice: number;
    dataPoints: DataPoint[];
    currentDate: Date;
}

const INITIAL_STATE: SimulationState = {
    inflationRate: 2,
    isRunning: true,
    argentinaModeEnabled: false,
    currentPrice: 1.00,  // Start with $1.00
    dataPoints: [],
    currentDate: new Date(2000, 0, 1) // Start from January 2000
};

function createSimulationStore() {
    const { subscribe, set, update } = writable<SimulationState>(INITIAL_STATE);

    const simulateMonth = (price: number, annualRate: number) => {
        return price * (1 + annualRate / 100 / 12);
    };

    const WINDOW_YEARS = 25;

    return {
        subscribe,
        setInflationRate: (rate: number) => update(state => ({ ...state, inflationRate: rate })),
        toggleRunning: () => update(state => ({ ...state, isRunning: !state.isRunning })),
        toggleArgentinaMode: () => update(state => ({ 
            ...state, 
            argentinaModeEnabled: !state.argentinaModeEnabled,
            inflationRate: !state.argentinaModeEnabled && state.inflationRate > 18 ? 18 : state.inflationRate
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
        reset: () => set(INITIAL_STATE)
    };
}

export const simulation = createSimulationStore();
