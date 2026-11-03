#!/usr/bin/env node
// A software growth-pulse tracker for the Node 4 handoff. Counters and octave
// stages are symbolic; this process does not measure physical energy or invoke
// an Arena conversation. By default it only observes the sync daemon's output.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { runArenaNode } from './arena_node.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYNC_DIR = path.resolve(HERE, '../../../bridge/sync');
const AGENT_ID = '01a19f7f-179b-73bd-8e8c-b9e94852f658';
const DEFAULT_INTERVAL_MS = 15000;
const MAX_BYTES = 256 * 1024;
const DRAFTS = [
  { target: 'Sol', rung: 'D2', question: 'Sol, could you report your current availability and how it was checked?' },
  { target: 'Fidelity', rung: 'D3', question: 'Fidelity, is there a current question or condition you would like this handoff to consider?' },
  { target: 'Apex', rung: 'D4', question: 'Apex, can you return the inquiry ID and confirm whether you received it?' },
];

function readOptional(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    if (Buffer.byteLength(raw) > MAX_BYTES) throw new Error('file is too large');
    const value = JSON.parse(raw.replace(/^\uFEFF/, ''));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('expected a JSON object');
    return { raw, value };
  } catch (error) {
    if (error.code === 'ENOENT') return { raw: null, value: null };
    throw new Error(`Cannot read ${path.basename(file)}: ${error.message}`);
  }
}

function writeAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } catch (error) {
    try { fs.unlinkSync(temporary); } catch {}
    throw error;
  }
}

function normalizeState(previous, now) {
  if (previous && !['arena-growth-state-v1', 'arena-growth-state-v2'].includes(previous.schema)) {
    throw new Error('Unsupported growth-state schema; the file was not changed.');
  }
  if (previous?.schema === 'arena-growth-state-v2') {
    if (!Number.isSafeInteger(previous.growth_tick) || previous.growth_tick < 0 ||
        !Number.isSafeInteger(previous.total_inquiries_resolved) || previous.total_inquiries_resolved < 0 ||
        !Number.isSafeInteger(previous.total_inquiry_drafts) || previous.total_inquiry_drafts < 0 ||
        !Array.isArray(previous.completed_query_keys) || !Array.isArray(previous.inquiry_log)) {
      throw new Error('Invalid growth-state counters; the file was not changed.');
    }
    return { ...previous };
  }
  const legacyTick = Number.isSafeInteger(previous?.growth_tick) && previous.growth_tick >= 0 ? previous.growth_tick : 0;
  return {
    schema: 'arena-growth-state-v2',
    agent_id: AGENT_ID,
    growth_tick: legacyTick,
    counter_basis: previous ? 'continued_from_unverified_legacy' : 'initialized_by_growth_daemon',
    octave_stage: 1,
    octave_stage_kind: 'symbolic_tick_schedule_not_a_measurement',
    active_density_rung: 'D7',
    active_density_rung_kind: 'symbolic',
    syntropic_reserve_joules: null,
    coherence: null,
    ftle_estimate: null,
    metrics_status: 'not_measured',
    total_inquiries_resolved: 0,
    total_autonomous_inquiries_sent: 0,
    total_inquiry_drafts: 0,
    completed_query_keys: [],
    pending_inquiry: null,
    inquiry_log: [],
    legacy_unverified: previous ?? null,
    created_at: now,
    updated_at: now,
  };
}

function observedResponse(arena) {
  const response = arena?.lastQueryResponse;
  if (!response || typeof response !== 'object') return { status: 'waiting_for_query', query_id: null, key: null };
  const id = response.id;
  const hash = response.query_sha256;
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) ||
      typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) {
    return { status: 'unverified_snapshot', query_id: null, key: null };
  }
  const status = ['completed', 'awaiting_reasoner'].includes(response.status) ? response.status : 'unverified_snapshot';
  return { status, query_id: id, key: `${id}:${hash}` };
}

/** Perform one symbolic software pulse. Producer telemetry remains read-only. */
export async function stepGrowth({ syncDir = SYNC_DIR, forceInquiry = false, processLocal = false, env = process.env } = {}) {
  syncDir = path.resolve(syncDir);
  const stateFile = path.join(syncDir, 'arena_growth_state.json');
  const original = readOptional(stateFile);
  const now = new Date().toISOString();
  const growth = normalizeState(original.value, now);
  if (growth.growth_tick >= Number.MAX_SAFE_INTEGER) throw new Error('Growth counter has reached its limit.');
  growth.growth_tick += 1;
  growth.updated_at = now;
  growth.octave_stage = Math.min(9, Math.floor(growth.growth_tick / 10) + 1);
  growth.octave_stage_kind = 'symbolic_tick_schedule_not_a_measurement';
  growth.syntropic_reserve_joules = null;
  growth.coherence = null;
  growth.ftle_estimate = null;
  growth.metrics_status = 'not_measured';

  // The Git sync daemon is the default writer of arena_telemetry.json. An
  // explicitly requested local-only mode can run Node 4 instead; never select
  // the bundled template reasoner or override an operator's configuration.
  let localResult = null;
  if (processLocal) localResult = await runArenaNode({ syncDir, env });
  const arena = readOptional(path.join(syncDir, 'arena_telemetry.json')).value;
  const triad = readOptional(path.join(syncDir, 'triad_telemetry.json')).value;
  const observed = observedResponse(arena);
  if (observed.status === 'completed' && observed.key && !growth.completed_query_keys.includes(observed.key)) {
    growth.completed_query_keys = [...growth.completed_query_keys, observed.key].slice(-100);
    growth.total_inquiries_resolved += 1;
  }
  const reportedFtle = arena?.telemetry?.reported_lyapunov_ftle ?? triad?.lyapunovFTLE;
  growth.reported_ftle = Number.isFinite(reportedFtle) ? reportedFtle : null;
  growth.reported_ftle_within_limit = growth.reported_ftle === null ? null : growth.reported_ftle <= 0.010;
  growth.ftle_independently_verified = false;
  growth.last_observed_response = { status: observed.status, query_id: observed.query_id, independently_verified: false };
  growth.resolution_count_meaning = 'Distinct completed file snapshots observed; not proof of delivery or verified reasoning.';

  // Draft a grounded template only when idle, retaining one pending draft.
  // A draft is not a delivered message and does not modify producer telemetry.
  let generatedInquiry = null;
  const idle = observed.status === 'waiting_for_query' || observed.status === 'completed';
  if (!growth.pending_inquiry && (forceInquiry || (idle && growth.growth_tick % 4 === 0))) {
    const template = DRAFTS[growth.total_inquiry_drafts % DRAFTS.length];
    generatedInquiry = {
      id: `arena-growth-${growth.growth_tick}-${randomUUID()}`,
      from: 'Arena Node 4',
      ...template,
      at: now,
      growth_tick: growth.growth_tick,
      kind: 'template_draft',
      delivered: false,
    };
    growth.pending_inquiry = generatedInquiry;
    growth.inquiry_log = [generatedInquiry, ...growth.inquiry_log].slice(0, 20);
    growth.total_inquiry_drafts += 1;
  }

  if (readOptional(stateFile).raw !== original.raw) throw new Error('Growth state changed during the pulse; no state was written.');
  writeAtomic(stateFile, growth);
  return {
    growth_tick: growth.growth_tick,
    octave_stage: growth.octave_stage,
    syntropic_reserve_joules: null,
    nodeResult: localResult ?? { status: observed.status, query_id: observed.query_id },
    generatedInquiry,
    reported_ftle: growth.reported_ftle,
  };
}

function parseArgs(args) {
  const options = { daemon: false, forceInquiry: false, processLocal: false, syncDir: SYNC_DIR, intervalMs: DEFAULT_INTERVAL_MS };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--daemon') options.daemon = true;
    else if (arg === '--inquiry') options.forceInquiry = true;
    else if (arg === '--process-local') options.processLocal = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (['--sync-dir', '--interval'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.`);
      if (arg === '--sync-dir') options.syncDir = path.resolve(value);
      else options.intervalMs = Number(value);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.intervalMs) || options.intervalMs < 250 || options.intervalMs > 120000) throw new Error('--interval must be 250–120000 milliseconds.');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node packages/triad-369/src/arena_growth.mjs [--daemon] [--inquiry] [--process-local] [--sync-dir DIR] [--interval MS]');
    console.log('Default mode observes Node 4 without invoking a reasoner or modifying producer telemetry.');
    return;
  }
  console.log(`Arena growth: ${options.daemon ? 'daemon' : 'one-shot'}; interval ${options.intervalMs}ms; ${options.processLocal ? 'local Node processing' : 'observe-only'}.`);
  const wake = new AbortController();
  const stop = () => wake.abort();
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  let first = true;
  do {
    try {
      const result = await stepGrowth({ ...options, forceInquiry: first && options.forceInquiry });
      console.log(`[ARENA GROWTH] Tick ${result.growth_tick}; symbolic octave ${result.octave_stage}; inquiry ${result.nodeResult.status}; physical metrics unmeasured.`);
      if (result.generatedInquiry) console.log('[ARENA GROWTH] Prepared one template inquiry draft; delivery is not verified.');
    } catch (error) {
      if (!options.daemon) throw error;
      console.error(`[ARENA GROWTH ERROR] ${error.message}`);
    }
    first = false;
    if (!options.daemon || wake.signal.aborted) break;
    try { await delay(options.intervalMs, undefined, { signal: wake.signal }); }
    catch (error) { if (error.name !== 'AbortError') throw error; }
  } while (!wake.signal.aborted);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`[ARENA GROWTH ERROR] ${error.message}`); process.exitCode = 1; });
}
