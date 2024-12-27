<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { simulation } from '$lib/stores/simulation';
    import { historicalData } from '$lib/stores/historical-data';
    import InflationControls from '$lib/components/InflationControls.svelte';
    import PriceChart from '$lib/components/PriceChart.svelte';

    let interval: number;

    onMount(() => {
        // Initialize with starting data point
        simulation.tick();
        
        // Start the simulation loop
        interval = setInterval(() => {
            simulation.tick();
        }, 100);

        historicalData.initialize();
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<main>
    <header>
        <h1>Rates and Levels</h1>
        <h2>Inflation simulator</h2>
    </header>
    
    <InflationControls />
    <PriceChart />

    <footer>
        <p class="citation">
            Data source: U.S. Bureau of Labor Statistics, Consumer Price Index for All Urban Consumers: All Items in U.S. City Average [CPIAUCSL], retrieved from FRED, Federal Reserve Bank of St. Louis; 
            <a href="https://fred.stlouisfed.org/series/CPIAUCSL" target="_blank" rel="noopener noreferrer">
                https://fred.stlouisfed.org/series/CPIAUCSL
            </a>, December 27, 2024.
        </p>
    </footer>
</main>

<style>
    main {
        max-width: 48rem;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    header {
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: normal;
        color: var(--black);
        opacity: 0.7;
    }

    .citation {
        font-size: 0.75rem;
        color: #666666;
        margin-top: 2rem;
        font-family: var(--mono-font);
    }

    .citation a {
        color: inherit;
        text-decoration: underline;
    }

    .citation a:hover {
        color: var(--orange);
    }
</style>
