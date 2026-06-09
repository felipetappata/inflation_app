import { writable } from 'svelte/store';
import { DEFAULT_START, DEFAULT_END } from './config';
import type { SeriesPoint } from '$lib/types/cpi';

export interface SimState {
	/** The live, instantaneous annual inflation rate (%). A policy lever. */
	inflationRate: number;
	isRunning: boolean;
	speed: number; // months advanced per real second
	startDate: Date;
	endDate: Date;
	currentDate: Date;
	currentValue: number; // running price level, starts at 1.0
	dataPoints: SeriesPoint[]; // the REALIZED path — past growth is locked in
	done: boolean;
}

const DEFAULT_RATE = 2;
const DEFAULT_SPEED = 24;
export const SPEED_PRESETS = [6, 12, 24, 60];

function monthlyFactor(annualRate: number): number {
	return Math.pow(1 + annualRate / 100, 1 / 12);
}

function seed(start: Date): { currentValue: number; dataPoints: SeriesPoint[] } {
	return { currentValue: 1, dataPoints: [{ timestamp: start.getTime(), value: 1 }] };
}

function createSimulationStore() {
	const INITIAL: SimState = {
		inflationRate: DEFAULT_RATE,
		isRunning: false,
		speed: DEFAULT_SPEED,
		startDate: DEFAULT_START,
		endDate: DEFAULT_END,
		currentDate: DEFAULT_START,
		...seed(DEFAULT_START),
		done: false
	};

	const { subscribe, update } = writable<SimState>(INITIAL);

	// The store owns its own ticker so playback is robust and self-contained.
	let timer: ReturnType<typeof setInterval> | null = null;
	let speed = DEFAULT_SPEED;

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	// One month forward: grow the price by the CURRENT instantaneous rate and
	// append it. The rate at this instant is what shapes this step — change it
	// mid-flight and only future steps are affected. Past growth stays put.
	function advance() {
		update((s) => {
			if (!s.isRunning || s.done) return s;
			const next = new Date(s.currentDate.getTime());
			next.setUTCMonth(next.getUTCMonth() + 1);
			const newValue = s.currentValue * monthlyFactor(s.inflationRate);
			const dataPoints = [...s.dataPoints, { timestamp: next.getTime(), value: newValue }];
			const atEnd = next.getTime() >= s.endDate.getTime();
			if (atEnd) stopTimer();
			return {
				...s,
				currentDate: next,
				currentValue: newValue,
				dataPoints,
				isRunning: !atEnd && s.isRunning,
				done: atEnd
			};
		});
	}

	function startTimer() {
		stopTimer();
		const interval = Math.max(8, Math.round(1000 / Math.max(1, speed)));
		timer = setInterval(advance, interval);
	}

	function restart(s: SimState): SimState {
		return {
			...s,
			currentDate: s.startDate,
			...seed(s.startDate),
			done: false
		};
	}

	function play() {
		update((s) => (s.done ? { ...restart(s), isRunning: true } : { ...s, isRunning: true }));
		startTimer();
	}

	function pause() {
		stopTimer();
		update((s) => ({ ...s, isRunning: false }));
	}

	return {
		subscribe,

		/** Set the period bounds and reset playback to the start (paused). */
		configure: (startDate: Date, endDate: Date) => {
			stopTimer();
			update((s) => ({
				...s,
				startDate,
				endDate,
				currentDate: startDate,
				...seed(startDate),
				isRunning: false,
				done: false
			}));
		},

		/** Move the live policy lever. Only affects FUTURE growth. */
		setInflationRate: (rate: number) => update((s) => ({ ...s, inflationRate: rate })),

		setSpeed: (monthsPerSec: number) => {
			speed = monthsPerSec;
			update((s) => ({ ...s, speed: monthsPerSec }));
			if (timer) startTimer();
		},

		play,
		pause,
		toggle: () => {
			let running = false;
			update((s) => {
				running = s.isRunning;
				return s;
			});
			if (running) pause();
			else play();
		},

		reset: () => {
			stopTimer();
			update((s) => ({ ...restart(s), isRunning: false }));
		},

		/**
		 * Rewind to a past point and discard everything after it, so playback can
		 * resume from there under a new policy. Clamps to [start, current] — you
		 * can only rewind into realized history, never scrub into the future.
		 */
		rewindTo: (date: Date) => {
			stopTimer();
			update((s) => {
				const t = Math.max(
					s.startDate.getTime(),
					Math.min(date.getTime(), s.currentDate.getTime())
				);
				const dataPoints = s.dataPoints.filter((p) => p.timestamp <= t);
				const last = dataPoints[dataPoints.length - 1] ?? {
					timestamp: s.startDate.getTime(),
					value: 1
				};
				return {
					...s,
					isRunning: false,
					done: false,
					currentDate: new Date(last.timestamp),
					currentValue: last.value,
					dataPoints
				};
			});
		},

		/** Clean up the timer (call from onDestroy). */
		destroy: stopTimer
	};
}

export const simulation = createSimulationStore();
