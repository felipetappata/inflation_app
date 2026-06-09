#!/usr/bin/env node
// Build-time data pipeline: pulls CPI series from FRED and writes
// static/data/<id>.json + static/data/index.json (metadata + Chicago citations).
//
// Uses the FRED API when FRED_API_KEY is set (richer metadata, generous rate
// limit). Otherwise falls back to the public keyless download endpoint
// (fredgraph.csv) with throttling + retries. Per-country failures are tolerated:
// existing data is reused, and the run never destroys good data on a transient
// network error.
//
// Flags:
//   --if-missing   Skip entirely if index.json exists and is < 7 days old
//                  (used by predev so `npm run dev` is fast).
//
// Env:
//   FRED_API_KEY   32-char FRED API key (optional). Get one free at
//                  https://fred.stlouisfed.org/docs/api/api_key.html

import { REGISTRY } from './fred-registry.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'static', 'data');

// ---- tiny .env loader (so a local .env with FRED_API_KEY just works) --------
function loadDotEnv() {
	const envPath = join(ROOT, '.env');
	if (!existsSync(envPath)) return;
	for (const line of readFileSync(envPath, 'utf8').split('\n')) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
}
loadDotEnv();

const API_KEY = (process.env.FRED_API_KEY || '').trim();
const HAS_KEY = /^[a-z0-9]{32}$/.test(API_KEY);
const IF_MISSING = process.argv.includes('--if-missing');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- formatting -------------------------------------------------------------
function formatAccessedDate(d) {
	// "June 8, 2026"
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC'
	});
}

function buildCitation(entry, accessedDate) {
	const url = `https://fred.stlouisfed.org/series/${entry.seriesId}`;
	return `${entry.sourceAgency}, "${entry.fredTitle} [${entry.seriesId}]," retrieved from FRED, Federal Reserve Bank of St. Louis, accessed ${accessedDate}, ${url}.`;
}

// ---- fetching ---------------------------------------------------------------
async function fetchViaApi(seriesId) {
	const base = 'https://api.stlouisfed.org/fred';
	const obsUrl = `${base}/series/observations?series_id=${seriesId}&api_key=${API_KEY}&file_type=json`;
	const metaUrl = `${base}/series?series_id=${seriesId}&api_key=${API_KEY}&file_type=json`;

	const [obsRes, metaRes] = await Promise.all([fetch(obsUrl), fetch(metaUrl)]);
	if (!obsRes.ok) throw new Error(`API observations ${obsRes.status}`);
	const obsJson = await obsRes.json();
	const data = (obsJson.observations || [])
		.filter((o) => o.value !== '.' && o.value !== '')
		.map((o) => ({ date: o.date, value: Number(o.value) }))
		.filter((o) => Number.isFinite(o.value));

	let meta = {};
	if (metaRes.ok) {
		const metaJson = await metaRes.json();
		const s = (metaJson.seriess || [])[0];
		if (s) {
			meta = {
				fredTitle: s.title,
				units: s.units,
				frequency: s.frequency,
				seasonalAdjustment: s.seasonal_adjustment
			};
		}
	}
	return { data, meta };
}

function parseCsv(text) {
	const lines = text.split('\n');
	const out = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const comma = line.indexOf(',');
		if (comma < 0) continue;
		const date = line.slice(0, comma);
		const raw = line.slice(comma + 1).trim();
		if (raw === '.' || raw === '') continue;
		const value = Number(raw);
		if (Number.isFinite(value)) out.push({ date, value });
	}
	return out;
}

async function fetchViaCsv(seriesId) {
	const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
	let lastErr;
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			const res = await fetch(url, { headers: { 'User-Agent': 'inflation-app-build/1.0' } });
			const text = await res.text();
			if (text.includes('observation_date') || /^DATE,/i.test(text)) {
				const data = parseCsv(text);
				if (data.length > 0) return { data, meta: {} };
			}
			lastErr = new Error('empty/ratelimited response');
		} catch (e) {
			lastErr = e;
		}
		// backoff: 6s, 12s, 18s
		await sleep(6000 * (attempt + 1));
	}
	throw lastErr || new Error('csv fetch failed');
}

function readExisting(id) {
	const p = join(DATA_DIR, `${id}.json`);
	if (!existsSync(p)) return null;
	try {
		const json = JSON.parse(readFileSync(p, 'utf8'));
		if (Array.isArray(json.data) && json.data.length > 0) return json.data;
	} catch {
		/* ignore */
	}
	return null;
}

// ---- main -------------------------------------------------------------------
async function main() {
	const indexPath = join(DATA_DIR, 'index.json');

	if (IF_MISSING && existsSync(indexPath)) {
		try {
			const existing = JSON.parse(readFileSync(indexPath, 'utf8'));
			const age = Date.now() - new Date(existing.generatedAt).getTime();
			if (age < 7 * 24 * 60 * 60 * 1000) {
				console.log('[fred] data present and fresh (<7d); skipping fetch (--if-missing).');
				return;
			}
		} catch {
			/* fall through and refetch */
		}
	}

	if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

	const accessedDate = formatAccessedDate(new Date());
	console.log(`[fred] mode: ${HAS_KEY ? 'API (key present)' : 'keyless CSV (throttled)'}`);

	const countries = [];
	let anySuccess = false;

	for (const entry of REGISTRY) {
		process.stdout.write(`[fred] ${entry.id.padEnd(4)} ${entry.seriesId.padEnd(18)} ... `);
		let data = null;
		let meta = {};
		try {
			const result = HAS_KEY ? await fetchViaApi(entry.seriesId) : await fetchViaCsv(entry.seriesId);
			data = result.data;
			meta = result.meta || {};
			anySuccess = true;
			console.log(`ok (${data.length} obs)`);
		} catch (e) {
			const existing = readExisting(entry.id);
			if (existing) {
				data = existing;
				console.log(`FAILED (${e.message}); reused existing (${existing.length} obs)`);
			} else {
				console.log(`FAILED (${e.message}); skipped`);
				continue;
			}
		}

		if (!data || data.length === 0) continue;

		// write per-country series file
		writeFileSync(
			join(DATA_DIR, `${entry.id}.json`),
			JSON.stringify({ id: entry.id, seriesId: entry.seriesId, data }, null, 0)
		);

		const merged = { ...entry, ...meta };
		countries.push({
			id: merged.id,
			name: merged.name,
			flag: merged.flag,
			seriesId: merged.seriesId,
			sourceAgency: merged.sourceAgency,
			fredTitle: merged.fredTitle,
			units: merged.units,
			frequency: merged.frequency,
			seasonalAdjustment: merged.seasonalAdjustment,
			fredUrl: `https://fred.stlouisfed.org/series/${merged.seriesId}`,
			start: data[0].date,
			end: data[data.length - 1].date,
			citation: buildCitation(merged, accessedDate),
			color: merged.color,
			defaultSelected: !!merged.defaultSelected,
			note: merged.note || undefined
		});

		// Throttle keyless requests to avoid rate limiting.
		if (!HAS_KEY) await sleep(5000);
	}

	if (!anySuccess && existsSync(indexPath)) {
		console.error('[fred] all fetches failed; keeping existing index.json untouched.');
		return;
	}

	const index = {
		generatedAt: new Date().toISOString(),
		accessedDate,
		source: 'FRED, Federal Reserve Bank of St. Louis',
		countries
	};
	writeFileSync(indexPath, JSON.stringify(index, null, 2));
	console.log(`[fred] wrote index.json with ${countries.length} countries.`);
}

main().catch((e) => {
	console.error('[fred] fatal:', e);
	process.exit(1);
});
