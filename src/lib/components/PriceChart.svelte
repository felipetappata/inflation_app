<script lang="ts">
    import { simulation } from '$lib/stores/simulation';
    import { scaleLinear, scaleTime } from 'd3-scale';
    import { line, curveBasis } from 'd3-shape';
    import { extent } from 'd3-array';
    
    let chartData = [];
    let width = 0;
    let height = 252; // Reduced from 256 to account for borders

    simulation.subscribe(state => {
        chartData = state.dataPoints;
    });

    $: xScale = scaleTime()
        .domain(extent(chartData, d => d.timestamp))
        .range([70, width - 20]); // Increased left margin, added right margin

    $: yScale = scaleLinear()
        .domain([0, Math.max(...chartData.map(d => d.simulatedPrice), 5)])
        .range([height - 30, 20]); // Increased bottom margin

    $: pathD = line<any>()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d.simulatedPrice))
        .curve(curveBasis)(chartData);

    // Calculate the minimum width needed per year label (in pixels)
    const MIN_LABEL_WIDTH = 50;

    // Dynamic year interval calculation
    $: yearInterval = Math.max(
        1,
        Math.ceil(
            (chartData.length / 12 * MIN_LABEL_WIDTH) / // total years * width per label
            (width - 90) // available width (subtracting margins)
        )
    );

    // Updated xAxisTicks calculation
    $: xAxisTicks = chartData.reduce((acc, point) => {
        const date = new Date(point.timestamp);
        // Include only January AND only if the year is divisible by our interval
        if (date.getMonth() === 0 && date.getFullYear() % yearInterval === 0) {
            acc.push(point);
        }
        return acc;
    }, []);

    function formatDate(timestamp: number) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric'  // Only show year
        });
    }
</script>

<div class="chart-container" bind:clientWidth={width}>
    <svg {width} {height}>
        <!-- Grid lines -->
        {#each yScale.ticks(5) as tick}
            <line 
                x1="70" 
                x2={width - 20} 
                y1={yScale(tick)} 
                y2={yScale(tick)}
                class="grid-line"
            />
        {/each}

        <!-- Y-axis ticks -->
        {#each yScale.ticks(5) as tick}
            <g transform="translate(65, {yScale(tick)})">
                <line x1="0" x2="5" stroke="var(--black)" />
                <text x="-5" dy=".32em" text-anchor="end">
                    ${tick.toFixed(2)}
                </text>
            </g>
        {/each}

        <!-- X-axis line -->
        <line 
            x1="70" 
            x2={width - 20} 
            y1={height - 30} 
            y2={height - 30}
            stroke="var(--black)"
        />

        <!-- X-axis ticks -->
        {#each xAxisTicks as point}
            <g transform="translate({xScale(point.timestamp)}, {height - 30})">
                <line y1="0" y2="5" stroke="var(--black)" />
                <text y="20" text-anchor="middle" font-size="12">
                    {formatDate(point.timestamp)}
                </text>
            </g>
        {/each}

        <!-- Price line -->
        {#if pathD}
            <path 
                d={pathD} 
                fill="none" 
                stroke="var(--orange)" 
                stroke-width="2"
            />
        {/if}

        <!-- Current point -->
        {#if chartData.length}
            <circle 
                cx={xScale(chartData[chartData.length - 1].timestamp)}
                cy={yScale(chartData[chartData.length - 1].simulatedPrice)}
                r="4"
                fill="var(--black)"
            />
        {/if}
    </svg>
</div>

<style>
    .chart-container {
        width: 100%;
        height: 16rem;
        margin-bottom: 1rem;
        background: var(--white);
        border: 2px solid var(--black);
        padding: 0;
        box-sizing: border-box; /* Add this to include borders in element's total size */
    }

    svg {
        background: var(--white);
    }

    text {
        font-size: 0.75rem;
        fill: var(--black);
        font-family: Helvetica, Arial, sans-serif;
    }

    line {
        stroke: var(--black);
        stroke-width: 0.5;
    }

    .grid-line {
        stroke: var(--black);
        stroke-opacity: 0.1;
    }
</style>
