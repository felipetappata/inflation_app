<script lang="ts">
    import { simulation } from '$lib/stores/simulation';
    import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-svelte';  // Add RotateCcw import

    let inflationRate: number;
    let isRunning: boolean;
    let hyperModeEnabled: boolean;  // Changed from argentinaModeEnabled

    simulation.subscribe(state => {
        inflationRate = state.inflationRate;
        isRunning = state.isRunning;
        hyperModeEnabled = state.hyperModeEnabled;  // Changed from argentinaModeEnabled
    });

    function handleRateChange(event: Event) {
        const value = +(event.target as HTMLInputElement).value;
        simulation.setInflationRate(value);
    }
</script>

<div class="controls">
    <div class="slider-container">
        <label for="inflation-rate">Annual Inflation Rate: {inflationRate.toFixed(1)}%</label>
        <input
            type="range"
            id="inflation-rate"
            min={-3}
            max={hyperModeEnabled ? 300 : 18}
            step={0.1}
            value={inflationRate}
            on:input={handleRateChange}
        />
    </div>

    <div class="buttons">
        <button 
            class="toggle-btn" 
            on:click={() => simulation.toggleRunning()}
            aria-label={isRunning ? "Pause simulation" : "Resume simulation"}
        >
            {#if isRunning}
                <PauseCircle size={24} />
            {:else}
                <PlayCircle size={24} />
            {/if}
        </button>

        <button 
            class="toggle-btn" 
            on:click={() => simulation.reset()}
            aria-label="Reset simulation"
        >
            <RotateCcw size={24} />
        </button>

        <label class="hyper-toggle">
            <input
                type="checkbox"
                checked={hyperModeEnabled}
                on:change={() => simulation.toggleHyperMode()}
            />
            Hyper Mode
        </label>
    </div>
</div>

<style>
    .controls {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-bottom: 2rem;
        background: var(--light-gray);
        padding: 1.5rem;
        border: 1px solid var(--black);
    }

    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        font-family: var(--mono-font);
    }

    .slider-container label {
        font-weight: 500;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 1px;
        background: var(--black);
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 14px;
        width: 14px;
        border: 2px solid var(--black);
        border-radius: 50%;
        background: var(--orange);
        cursor: pointer;
    }

    .buttons {
        display: flex;
        gap: 1rem;
        align-items: center;
        font-family: var(--mono-font);
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--black);
        background: var(--white);
        color: var(--black);
        font-weight: 500;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle-btn:hover {
        background: var(--orange);
    }

    .hyper-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border: 1px solid var(--black);
        background: var(--white);
        cursor: pointer;
    }

    input[type="checkbox"]:checked {
        background: var(--orange);
    }
</style>
