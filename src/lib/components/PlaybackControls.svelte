<script lang="ts">
	import { simulation, SPEED_PRESETS } from '$lib/stores/simulation';
	import { PlayCircle, PauseCircle, RotateCcw, Lock, LockOpen } from 'lucide-svelte';

	const SPEED_LABELS: Record<number, string> = { 6: '0.5×', 12: '1×', 24: '2×', 60: '5×' };

	const NORM_MIN = -2;
	const NORM_MAX = 2;
	const HYPER_MIN = -10;
	const HYPER_MAX = 100;

	let hyper = false;
	$: rateMin = hyper ? HYPER_MIN : NORM_MIN;
	$: rateMax = hyper ? HYPER_MAX : NORM_MAX;
	$: rateStep = hyper ? 0.5 : 0.1;

	function toggleHyper() {
		hyper = !hyper;
		const r = $simulation.inflationRate;
		if (r < rateMin) simulation.setInflationRate(rateMin);
		else if (r > rateMax) simulation.setInflationRate(rateMax);
	}

	function formatDate(d: Date): string {
		return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
	}

	function handleRateSlider(e: Event) {
		simulation.setInflationRate(+(e.target as HTMLInputElement).value);
	}

	$: span = $simulation.endDate.getTime() - $simulation.startDate.getTime();
	$: progress = span > 0 ? ($simulation.currentDate.getTime() - $simulation.startDate.getTime()) / span : 0;

	function rewindFromEvent(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		simulation.rewindTo(new Date($simulation.startDate.getTime() + f * span));
	}
</script>

<div class="playback">
	<section class="control-group lever">
		<div class="lever-head">
			<span class="label">Inflation rate <strong>{$simulation.inflationRate.toFixed(1)}%</strong></span>
			<button
				class="hyper-btn"
				class:active={hyper}
				on:click={toggleHyper}
				aria-pressed={hyper}
			>
				{#if hyper}<LockOpen size={12} />{:else}<Lock size={12} />{/if}
				Hyperinflation
			</button>
		</div>
		<input
			type="range"
			min={rateMin}
			max={rateMax}
			step={rateStep}
			value={$simulation.inflationRate}
			on:input={handleRateSlider}
			aria-label="Inflation rate"
		/>
		<div class="scale-ends">
			<span>{rateMin}%</span>
			<span>{rateMax}%</span>
		</div>
	</section>

	<section class="control-group transport">
		<button
			class="icon-btn primary"
			on:click={() => simulation.toggle()}
			aria-label={$simulation.isRunning ? 'Pause' : $simulation.done ? 'Replay' : 'Play'}
		>
			{#if $simulation.isRunning}
				<PauseCircle size={22} /><span>Pause</span>
			{:else if $simulation.done}
				<RotateCcw size={22} /><span>Replay</span>
			{:else}
				<PlayCircle size={22} /><span>Play</span>
			{/if}
		</button>

		<button class="icon-btn" on:click={() => simulation.reset()} aria-label="Reset to start">
			<RotateCcw size={18} /><span>Reset</span>
		</button>

		<div class="speed-group" role="group" aria-label="Playback speed">
			<span class="label speed-label">Speed</span>
			{#each SPEED_PRESETS as v}
				<button
					class="speed-btn"
					class:active={$simulation.speed === v}
					on:click={() => simulation.setSpeed(v)}
					aria-pressed={$simulation.speed === v}
				>
					{SPEED_LABELS[v]}
				</button>
			{/each}
		</div>
	</section>

	<section class="control-group">
		<div class="timeline-header">
			<span class="label">{formatDate($simulation.startDate)}</span>
			<span class="date-label">{formatDate($simulation.currentDate)}</span>
			<span class="label end">{formatDate($simulation.endDate)}</span>
		</div>
		<button
			class="progress-track"
			on:click={rewindFromEvent}
			aria-label="Timeline — click to rewind"
		>
			<span class="progress-fill" style="width: {progress * 100}%"></span>
			<span class="progress-thumb" style="left: {progress * 100}%"></span>
		</button>
	</section>
</div>

<style>
	.playback {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		background: var(--light-gray);
		border: 1px solid var(--black);
		padding: 1.25rem 1.5rem;
		font-family: var(--mono-font);
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 500;
		color: var(--black);
	}

	.label strong {
		font-weight: 600;
		color: var(--orange);
		font-size: 0.8rem;
		margin-left: 0.15rem;
	}

	.lever-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.hyper-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.55rem;
		font-family: var(--mono-font);
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border: 1px solid var(--black);
		background: var(--white);
		color: var(--black);
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}
	.hyper-btn:hover {
		background: var(--gray);
	}
	.hyper-btn.active {
		background: var(--orange);
		border-color: var(--orange);
		color: var(--white);
	}

	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 3px;
		background: var(--black);
		cursor: pointer;
		outline: none;
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--orange);
		border: 2px solid var(--black);
		cursor: grab;
	}
	input[type='range']::-webkit-slider-thumb:active {
		cursor: grabbing;
	}
	input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--orange);
		border: 2px solid var(--black);
		cursor: grab;
	}

	.scale-ends {
		display: flex;
		justify-content: space-between;
		font-size: 0.6rem;
		opacity: 0.5;
	}

	.transport {
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.icon-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.4rem 0.875rem;
		border: 1px solid var(--black);
		background: var(--white);
		color: var(--black);
		font-family: var(--mono-font);
		font-size: 0.65rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}
	.icon-btn:hover {
		background: var(--gray);
	}
	.icon-btn.primary {
		background: var(--black);
		color: var(--white);
	}
	.icon-btn.primary:hover {
		background: var(--orange);
		border-color: var(--orange);
	}

	.speed-group {
		display: flex;
		align-items: center;
		gap: 0;
		margin-left: auto;
	}
	.speed-label {
		margin-right: 0.5rem;
	}
	.speed-btn {
		padding: 0.4rem 0.6rem;
		font-size: 0.65rem;
		font-family: var(--mono-font);
		letter-spacing: 0.04em;
		border: 1px solid var(--black);
		border-right: none;
		background: var(--white);
		color: var(--black);
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}
	.speed-btn:last-child {
		border-right: 1px solid var(--black);
	}
	.speed-btn:hover {
		background: var(--gray);
	}
	.speed-btn.active {
		background: var(--black);
		color: var(--white);
	}

	.timeline-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.date-label {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--orange);
	}
	.label.end {
		text-align: right;
	}
	.progress-track {
		position: relative;
		width: 100%;
		height: 14px;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
	}
	.progress-track::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 3px;
		transform: translateY(-50%);
		background: var(--gray);
	}
	.progress-fill {
		position: absolute;
		left: 0;
		top: 50%;
		height: 3px;
		transform: translateY(-50%);
		background: var(--black);
	}
	.progress-thumb {
		position: absolute;
		top: 50%;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--orange);
		border: 2px solid var(--black);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
</style>
