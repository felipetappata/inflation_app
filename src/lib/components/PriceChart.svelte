<script lang="ts">
    import { simulation } from '$lib/stores/simulation';
    import { historicalData } from '$lib/stores/historical-data';
    import { scaleLinear, scaleTime } from 'd3-scale';
    import { line, curveBasis } from 'd3-shape';
    import { extent } from 'd3-array';
    import { START_DATE } from '$lib/stores/config';
    
    let chartData = [];
    let width = 0;
    let height = 252; // Reduced from 256 to account for borders
    let historicalPoints = [];
    let visibleHistoricalPoints = [];

    let mouseX = 0;
    let mouseY = 0;
    let hoveredSimulated: DataPoint | null = null;
    let hoveredHistorical: DataPoint | null = null;

    // Selection state
    let isSelecting = false;
    let selectionStart: number | null = null;
    let selectionEnd: number | null = null;
    
    // Selection data
    let selectionBounds = {
        start: { simulated: null, historical: null },
        end: { simulated: null, historical: null }
    };

    // Subscribe to simulation data
    simulation.subscribe(state => {
        chartData = state.dataPoints;
        // Filter historical points to match simulation window
        if (historicalPoints.length > 0) {
            const currentDate = state.currentDate.getTime();
            const windowStart = new Date(state.currentDate);
            windowStart.setFullYear(windowStart.getFullYear() - 25);
            
            visibleHistoricalPoints = historicalPoints.filter(point => 
                point.timestamp >= windowStart.getTime() &&
                point.timestamp <= currentDate
            );
        }
    });

    // Make historicalPoints reactive to $historicalData changes
    $: {
        if ($historicalData.length > 0) {
            const country = $historicalData[0];
            
            historicalPoints = country.data
                .filter(point => new Date(point.date) >= START_DATE)
                .map(point => ({
                    timestamp: new Date(point.date).getTime(),
                    value: point.value
                }));
        }
    }

    // Adjust scales to consider both datasets
    $: xScale = scaleTime()
        .domain(extent([...chartData, ...visibleHistoricalPoints], d => d.timestamp))
        .range([70, width - 50]); // Increased right margin to accommodate label

    $: yScale = scaleLinear()
        .domain([0, Math.max(
            ...chartData.map(d => d.simulatedPrice),
            ...visibleHistoricalPoints.map(d => d.value),
            5
        )])
        .range([height - 30, 20]); // Increased bottom margin

    $: simulatedLine = line<any>()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d.simulatedPrice))
        .curve(curveBasis)(chartData);

    $: historicalLine = line<any>()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d.value))
        .curve(curveBasis)(visibleHistoricalPoints);

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

    function findNearestPoint(points: any[], xDate: number) {
        if (points.length === 0) return null;
        
        // Binary search for the closest point
        let left = 0;
        let right = points.length - 1;
        
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (points[mid].timestamp === xDate) return points[mid];
            
            if (points[mid].timestamp < xDate) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        // Find the closest point between left-1 and left
        const leftPoint = points[Math.max(0, left - 1)];
        const rightPoint = points[Math.min(points.length - 1, left)];
        
        return Math.abs(leftPoint.timestamp - xDate) < Math.abs(rightPoint.timestamp - xDate)
            ? leftPoint
            : rightPoint;
    }

    function handleMouseMove(event: MouseEvent) {
        const rect = (event.target as SVGElement).getBoundingClientRect();
        const svgX = event.clientX - rect.left;
        
        if (isSelecting) {
            selectionEnd = Math.min(Math.max(svgX, 70), width - 50);
            updateSelectionData();
        } else {
            // Only update if within the chart area
            if (svgX < 70 || svgX > width - 20) {
                hoveredSimulated = null;
                hoveredHistorical = null;
                return;
            }

            mouseX = svgX;
            const xDate = xScale.invert(mouseX).getTime();

            hoveredSimulated = findNearestPoint(chartData, xDate);
            hoveredHistorical = findNearestPoint(visibleHistoricalPoints, xDate);
        }
    }

    function handleMouseLeave() {
        hoveredSimulated = null;
        hoveredHistorical = null;
        isSelecting = false;
    }

    function handleMouseDown(event: MouseEvent) {
        const rect = (event.target as SVGElement).getBoundingClientRect();
        const svgX = event.clientX - rect.left;
        
        if (svgX < 70 || svgX > width - 50) return;
        
        // Pause simulation when selection starts
        simulation.pause();
        
        isSelecting = true;
        selectionStart = svgX;
        selectionEnd = svgX;
    }

    function handleMouseUp() {
        isSelecting = false;
    }

    function calculateAnnualizedRate(start: number, end: number, startDate: Date, endDate: Date): number {
        const totalChange = end / start - 1;
        const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return (Math.pow(1 + totalChange, 1 / years) - 1) * 100;
    }

    function updateSelectionData() {
        if (!selectionStart || !selectionEnd) return;

        const startDate = xScale.invert(Math.min(selectionStart, selectionEnd));
        const endDate = xScale.invert(Math.max(selectionStart, selectionEnd));

        const startSimulated = findNearestPoint(chartData, startDate.getTime());
        const endSimulated = findNearestPoint(chartData, endDate.getTime());
        const startHistorical = findNearestPoint(visibleHistoricalPoints, startDate.getTime());
        const endHistorical = findNearestPoint(visibleHistoricalPoints, endDate.getTime());

        selectionBounds = {
            start: { simulated: startSimulated, historical: startHistorical },
            end: { simulated: endSimulated, historical: endHistorical }
        };
    }

    function formatTooltipDate(timestamp: number) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    }
</script>

<div class="chart-wrapper">
    <div class="chart-container" bind:clientWidth={width}>
        <!-- Interactive wrapper div -->
        <button
            class="chart-interactive-area"
            aria-label="Interactive price chart comparing simulated inflation with historical US data"
            on:mousedown={handleMouseDown}
            on:mousemove={handleMouseMove}
            on:mouseup={handleMouseUp}
            on:mouseleave={handleMouseLeave}
        >
            <svg 
                {width} 
                {height}
                aria-hidden="true"
            >
                <!-- Selection overlay (moved to top for proper layering) -->
                {#if isSelecting && selectionStart && selectionEnd}
                    <rect
                        x={Math.min(selectionStart, selectionEnd)}
                        y={20}
                        width={Math.abs(selectionEnd - selectionStart)}
                        height={height - 50}
                        class="selection-area"
                    />
                {/if}

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

                <!-- Tooltip vertical line -->
                {#if hoveredSimulated}
                    <line
                        x1={xScale(hoveredSimulated.timestamp)}
                        x2={xScale(hoveredSimulated.timestamp)}
                        y1={20}
                        y2={height - 30}
                        class="tooltip-line"
                    />
                {/if}

                <!-- Historical line -->
                {#if historicalLine && visibleHistoricalPoints.length > 0}
                    <path 
                        d={historicalLine} 
                        class="historical-line"
                    />
                    <text 
                        x={xScale(visibleHistoricalPoints[visibleHistoricalPoints.length - 1].timestamp) + 30}
                        y={yScale(visibleHistoricalPoints[visibleHistoricalPoints.length - 1].value)}
                        class="historical-label"
                    >
                        USA
                    </text>
                {/if}

                <!-- Simulated line -->
                {#if simulatedLine}
                    <path 
                        d={simulatedLine} 
                        class="simulation-line"
                    />
                {/if}

                <!-- Tooltip dots -->
                {#if hoveredSimulated}
                    <circle 
                        cx={xScale(hoveredSimulated.timestamp)}
                        cy={yScale(hoveredSimulated.simulatedPrice)}
                        r="4"
                        class="tooltip-dot simulated-dot"
                    />
                {/if}

                {#if hoveredHistorical}
                    <circle 
                        cx={xScale(hoveredHistorical.timestamp)}
                        cy={yScale(hoveredHistorical.value)}
                        r="4"
                        class="tooltip-dot historical-dot"
                    />
                {/if}

                <!-- Current point -->
                {#if chartData.length}
                    <circle 
                        cx={xScale(chartData[chartData.length - 1].timestamp)}
                        cy={yScale(chartData[chartData.length - 1].simulatedPrice)}
                        r="4"
                        class="current-point"
                    />
                {/if}
            </svg>
        </button>

        <!-- Tooltip boxes -->
        {#if hoveredSimulated || hoveredHistorical}
            <div 
                class="tooltip-container"
                style="left: {Math.min(mouseX, width - 200)}px; bottom: 40px"
            >
                {#if hoveredSimulated}
                    <div class="tooltip simulated">
                        <span class="tooltip-label">Simulated</span>
                        <span class="tooltip-value">${hoveredSimulated.simulatedPrice.toFixed(2)}</span>
                        <span class="tooltip-date">{formatTooltipDate(hoveredSimulated.timestamp)}</span>
                    </div>
                {/if}
                {#if hoveredHistorical}
                    <div class="tooltip historical">
                        <span class="tooltip-label">Historical</span>
                        <span class="tooltip-value">${hoveredHistorical.value.toFixed(2)}</span>
                        <span class="tooltip-date">{formatTooltipDate(hoveredHistorical.timestamp)}</span>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Move selection info outside the chart container -->
    {#if selectionBounds.start.simulated && selectionBounds.end.simulated}
        <div class="selection-info">
            <div class="selection-header">
                <span class="dates">
                    {formatTooltipDate(selectionBounds.start.simulated.timestamp)}
                    —
                    {formatTooltipDate(selectionBounds.end.simulated.timestamp)}
                </span>
            </div>
            
            <div class="selection-grid">
                <div class="selection-column simulated">
                    <h3>Simulated</h3>
                    <div class="data-row">
                        <span>Change</span>
                        <span>${selectionBounds.start.simulated.simulatedPrice.toFixed(2)} → ${selectionBounds.end.simulated.simulatedPrice.toFixed(2)}</span>
                    </div>
                    <div class="data-row">
                        <span>Total</span>
                        <span>{((selectionBounds.end.simulated.simulatedPrice / selectionBounds.start.simulated.simulatedPrice - 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="data-row">
                        <span>Annual</span>
                        <span>{calculateAnnualizedRate(
                            selectionBounds.start.simulated.simulatedPrice,
                            selectionBounds.end.simulated.simulatedPrice,
                            new Date(selectionBounds.start.simulated.timestamp),
                            new Date(selectionBounds.end.simulated.timestamp)
                        ).toFixed(1)}%</span>
                    </div>
                </div>

                {#if selectionBounds.start.historical && selectionBounds.end.historical}
                    <div class="selection-column historical">
                        <h3>Historical</h3>
                        <div class="data-row">
                            <span>Change</span>
                            <span>${selectionBounds.start.historical.value.toFixed(2)} → ${selectionBounds.end.historical.value.toFixed(2)}</span>
                        </div>
                        <div class="data-row">
                            <span>Total</span>
                            <span>{((selectionBounds.end.historical.value / selectionBounds.start.historical.value - 1) * 100).toFixed(1)}%</span>
                        </div>
                        <div class="data-row">
                            <span>Annual</span>
                            <span>{calculateAnnualizedRate(
                                selectionBounds.start.historical.value,
                                selectionBounds.end.historical.value,
                                new Date(selectionBounds.start.historical.timestamp),
                                new Date(selectionBounds.end.historical.timestamp)
                            ).toFixed(1)}%</span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .chart-wrapper {
        position: relative;
        margin-bottom: 1rem;
    }

    .chart-container {
        width: 100%;
        height: 16rem;
        background: var(--white);
        border: 1px solid var(--black);
        padding: 0;
        box-sizing: border-box; /* Add this to include borders in element's total size */
        position: relative;
    }

    text {
        font-size: 0.65rem;
        fill: var(--black);
        font-family: var(--mono-font);
    }

    line {
        stroke: var(--black);
        stroke-width: 0.5;
    }

    .grid-line {
        stroke: var(--black);
        stroke-opacity: 0.1;
    }

    .simulation-line {
        fill: none;
        stroke: var(--orange);
        stroke-width: 1.5;
    }

    .historical-line {
        fill: none;
        stroke: var(--black);
        stroke-width: 1;
        stroke-opacity: 0.3;
    }

    .current-point {
        fill: var(--black);
    }

    .tooltip-line {
        stroke: var(--black);
        stroke-width: 1;
        stroke-dasharray: 2 2;
        opacity: 0.3;
    }

    .tooltip-container {
        position: absolute;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
        bottom: 0;  /* Add this */
        transform-origin: bottom left;  /* Add this */
        transition: transform 0.1s ease;  /* Add smooth transition */
    }

    .tooltip {
        background: var(--white);
        border: 1px solid var(--black);
        padding: 0.5rem;
        font-size: 0.65rem;
        font-family: var(--mono-font);
        box-shadow: 2px 2px 0 var(--black);
    }

    .tooltip.simulated {
        border-left: 2px solid var(--orange);
    }

    .tooltip.historical {
        border-left: 3px solid #666666;
    }

    .tooltip-label {
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        grid-column: 1 / -1;
    }

    .tooltip-value {
        font-weight: bold;
    }

    .tooltip-date {
        text-align: right;
        opacity: 0.7;
    }

    .tooltip-dot {
        fill: var(--white);
        stroke-width: 2px;
    }

    .simulated-dot {
        stroke: var(--orange);
        stroke-width: 2px;
    }

    .historical-dot {
        stroke: #666666;
    }

    .historical-label {
        font-size: 12px;
        font-weight: 500;
        font-family: var(--mono-font);
        fill: var(--black);
        text-anchor: middle;
        alignment-baseline: middle;
    }

    .selection-area {
        fill: var(--orange);
        opacity: 0.1;
        pointer-events: none;
        mix-blend-mode: multiply; /* This prevents highlighting text */
    }

    .selection-info {
        margin-top: 1rem;
        padding: 1rem;
        border: 1px solid var(--black);
        font-family: var(--mono-font);
        font-size: 0.75rem;
        background: var(--light-gray);
    }

    .selection-header {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .selection-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .selection-column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .selection-column h3 {
        margin: 0;
        font-size: 1rem;
        border-bottom: 1px solid var(--black);
        padding-bottom: 0.25rem;
    }

    .data-row {
        display: flex;
        justify-content: space-between;
    }

    .selection-column.simulated {
        color: var(--orange);
    }

    .selection-column.historical {
        color: #666666;
    }

    .chart-interactive-area {
        position: relative;
        cursor: crosshair;
        user-select: none;  /* Prevent text selection */
        appearance: none;
        border: none;
        background: none;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
    }

    svg text {
        font-size: 0.75rem;
        fill: var(--black);
        font-family: var(--mono-font);
        user-select: none;  /* Prevent text selection */
        -webkit-user-select: none;  /* For Safari */
    }
</style>
