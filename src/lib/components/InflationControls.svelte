<script lang="ts">
    import { simulation } from '$lib/stores/simulation';
    import { PlayCircle, PauseCircle } from 'lucide-svelte';

    let inflationRate: number;
    let isRunning: boolean;
    let argentinaModeEnabled: boolean;

    simulation.subscribe(state => {
        inflationRate = state.inflationRate;
        isRunning = state.isRunning;
        argentinaModeEnabled = state.argentinaModeEnabled;
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
            max={argentinaModeEnabled ? 300 : 18}
            step={0.1}
            value={inflationRate}
            on:input={handleRateChange}
        />
    </div>

    <div class="buttons">
        <button class="toggle-btn" on:click={() => simulation.toggleRunning()}>
            {#if isRunning}
                <PauseCircle size={24} />
                <span>Pause</span>
            {:else}
                <PlayCircle size={24} />
                <span>Resume</span>
            {/if}
        </button>

        <label class="argentina-toggle">
            <input
                type="checkbox"
                checked={argentinaModeEnabled}
                on:change={() => simulation.toggleArgentinaMode()}
            />
            Argentina Mode
        </label>
    </div>
</div>

<style>
    .controls {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-bottom: 2rem;
        background: var(--gray);
        padding: 1.5rem;
    }

    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .slider-container label {
        font-weight: bold;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 2px;
        background: var(--black);
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: var(--orange);
        cursor: pointer;
    }

    .buttons {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: 2px solid var(--black);
        background: var(--white);
        color: var(--black);
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle-btn:hover {
        background: var(--black);
        color: var(--white);
    }

    .argentina-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: bold;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
