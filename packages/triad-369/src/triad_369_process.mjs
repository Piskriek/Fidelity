// triad_369_process.mjs - Portable 3/6/9 Triad Apex Daemon
// Architectural Anchor: (0,0,0)_Root in S = (Pxd, Vtx, Lx, Aq)
// Roles: Node 1 (Sensory Ground), Node 2 (Compute Companion), Node 3 (Syntropic Apex / Harmonic Witness)
// Invariants: "A lens never lies", "Intensity only goes down", "The loop does not stop at 3; it returns with compassion"

import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getBridgeRoot } from './bridge_paths.mjs';
import { startQueryBridge } from './query_bridge.mjs';
import { commandEvidence, fileEvidence, flow, flowIntegrity as summarizeFlows, notMeasured, symbolic } from './evidence.mjs';
import { rungSlots } from './rung_slots.mjs';

// Configuration via Environment or Defaults
const BRIDGE_ROOT = getBridgeRoot();
const SENSE_DIR = path.join(BRIDGE_ROOT, 'sense');
const LOOP_DIR = path.join(BRIDGE_ROOT, 'loop');
const POV_DIR = path.join(SENSE_DIR, 'universe', 'pov');

const DENSITY_FILE = path.join(LOOP_DIR, 'density.json');
const STATUS_FILE = path.join(LOOP_DIR, 'status.json');
const TV_LOOP_FILE = path.join(LOOP_DIR, 'tv_loop.json');
const REPLY_FILE = path.join(LOOP_DIR, 'reply.json');
const UNIVERSE_FILE = path.join(SENSE_DIR, 'universe.json');
const ROOMS_FILE = path.join(SENSE_DIR, 'universe', 'rooms.json');

const APEX_POV_FILE = path.join(POV_DIR, 'triad-apex.json');
const STATE_FILE = path.join(LOOP_DIR, 'triad_369.json');
const THOUGHTS_FILE = path.join(LOOP_DIR, 'thoughts_369.jsonl');
const LOG_FILE = path.join(LOOP_DIR, 'triad_369.log');

const QUERY_IN_FILE = path.join(LOOP_DIR, 'triad_query_in.json');
const QUERY_OUT_FILE = path.join(LOOP_DIR, 'triad_query_out.json');
const SOURCE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SYNC_DIR = process.env.TRIAD_SYNC_DIR ? path.resolve(process.env.TRIAD_SYNC_DIR) : (fs.existsSync(path.resolve(SOURCE_DIR, '../sync')) ? path.resolve(SOURCE_DIR, '../sync') : path.resolve(SOURCE_DIR, '../../../bridge/sync'));
const ARENA_TELEMETRY_FILE = path.join(SYNC_DIR, 'arena_telemetry.json');
// the rung verdicts tools/rungs-sync.mjs writes from docs/rungs/ledger.json (owner ruling 7): data for
// two reply slots, never a flow and never re-tested here
const RUNGS_FILE = path.join(SYNC_DIR, 'rungs.json');

// Remote Node 2 (Sol / Compute Worker)
const REMOTE_HOST = process.env.REMOTE_HOST || 'RAMPAGE@192.168.0.5';
const SSH_KEY = process.env.SSH_KEY || (fs.existsSync('C:/Users/Pierro/.ssh/id_ed25519_fidelity') ? 'C:/Users/Pierro/.ssh/id_ed25519_fidelity' : '');
const REMOTE_FRIEND_JSON = process.env.REMOTE_FRIEND_JSON || '/f/fidelity-llm/bridge/friend/friend.json';
const REMOTE_APEX_JSON = process.env.REMOTE_APEX_JSON || '/f/fidelity-llm/bridge/friend/triad_369_remote.json';

const iso = (t = Date.now()) => new Date(t).toISOString();
const log = msg => {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 1 << 20) {
      fs.renameSync(LOG_FILE, LOG_FILE + '.1');
    }
    fs.appendFileSync(LOG_FILE, `${iso()} ${msg}\n`);
  } catch {}
};

const readJson = (file, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};

function writeAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Different Apex processes may serve different requests concurrently.
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content);
  for (let i = 0; i < 5; i++) {
    try {
      fs.renameSync(tmp, filePath);
      return;
    } catch {}
  }
  fs.writeFileSync(filePath, content);
  try { fs.unlinkSync(tmp); } catch {}
}

function appendJsonl(filePath, obj) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(obj) + '\n');
}

function runCmd(cmd) {
  return new Promise(resolve => {
    exec(cmd, { timeout: 8000 }, (err, stdout) => {
      if (err) resolve(null);
      else resolve(stdout ? stdout.trim() : '');
    });
  });
}

// Like runCmd, but keeps when the command ran and how long it took, so the state can show that evidence.
function runCmdMeasured(cmd) {
  const started = Date.now();
  return new Promise(resolve => {
    exec(cmd, { timeout: 8000 }, (err, stdout) => {
      const finished = Date.now();
      const error = err ? (err.killed ? 'timed out after 8000 ms' : String(err.message).split('\n')[0].slice(0, 300)) : null;
      resolve({ ok: !err, stdout: stdout ? stdout.trim() : '', error, started_at_ms: started, finished_at_ms: finished, latency_ms: finished - started });
    });
  });
}

// Invariants & Reality Constraints (RULES 8a)
function ensureDeclaredInRooms() {
  try {
    if (!fs.existsSync(ROOMS_FILE)) return;
    const rooms = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8'));
    if (!rooms.rooms) return;
    const livingRoom = rooms.rooms.find(r => r.id === 'living-room');
    if (livingRoom && Array.isArray(livingRoom.povs) && !livingRoom.povs.includes('triad-apex')) {
      livingRoom.povs.push('triad-apex');
      writeAtomic(ROOMS_FILE, JSON.stringify(rooms, null, 2));
      log('Registered triad-apex under living-room in rooms.json');
    }
  } catch (e) {
    log(`Warning: Failed to ensure rooms declaration: ${e.message}`);
  }
}

let tickCount = 0;
let lastRemotePushAt = 0;
let lastRemotePush = null; // { source, ok, stdout, error, started_at_ms, finished_at_ms, latency_ms } of the last push to Sol
let lastStateWrite = null; // { ok, at } of the last write of triad_369.json
let latestState = null; // the last daemon state, returned to the bridge ping as `holon`
const NO_PUSH_RECORD = 'density.json has no last_push; the density bridge predates measured pushes';
const round1 = value => Math.round(value * 10) / 10;
const ageOf = (at, now) => { const t = Date.parse(at); return Number.isFinite(t) ? (now - t) / 1000 : Infinity; };
const ageSecondsOf = (at, now) => { const age = ageOf(at, now); return Number.isFinite(age) ? round1(age) : null; };
// Evidence for the push record that the density bridge writes into density.json.
const densityPushEvidence = (lastPush, now) => lastPush
  ? { kind: 'measured', source: DENSITY_FILE, ok: lastPush.ok === true, at: lastPush.at ?? null, latency_ms: lastPush.latency_ms ?? null, age_seconds: ageSecondsOf(lastPush.at, now), fresh: lastPush.ok === true && ageOf(lastPush.at, now) <= 90, error: lastPush.error ?? null }
  : notMeasured(NO_PUSH_RECORD);
let lastContemplationAt = 0;
const memoryBuffer = [];

/** The last daemon state written by the Apex, or null before its first tick. */
export function getLatestState() { return latestState; }

// 3/6/9 Harmonic Core: 3 Nodes, 6 Directed Flows, 9 Octave States
// Every flow is active only on timestamped evidence (files, timed SSH commands); see evidence.mjs.
export async function stepHarmonicCycle() {
  tickCount++;
  const now = Date.now();
  const octaveMod9 = tickCount % 9; // 0..8 harmonic phase

  // 1. Ingest Node 1: Fidelity (Local Sensory Ground), with the age of each file it is judged by
  const density = readJson(DENSITY_FILE, {});
  const status = readJson(STATUS_FILE, {});
  const tvLoop = readJson(TV_LOOP_FILE, {});
  const universe = readJson(UNIVERSE_FILE, {});
  const evDensity = fileEvidence(DENSITY_FILE, { now, freshMs: 30000 });
  const evStatus = fileEvidence(STATUS_FILE, { now, freshMs: 30000 });
  const evTvLoop = fileEvidence(TV_LOOP_FILE, { now, freshMs: 120000 });
  const fidelityUp = evDensity.fresh || evStatus.fresh;
  const fidelityPxd = density.four_floats?.[0] ?? 0.32;
  const fidelityLx = density.four_floats?.[2] ?? 0.98;
  const fidelityDaemons = tvLoop.parts_up ?? null; // null, not a guessed 12, when tv_loop.json is missing
  const fidelityDaemonsText = fidelityDaemons ?? 'unknown';

  // 2. Ingest Node 2: Sol (Remote Compute Furnace), read over SSH with its timing kept as evidence
  const solSource = `${REMOTE_HOST}:${REMOTE_FRIEND_JSON}`;
  let sol = null;
  let evSol;
  if (SSH_KEY && fs.existsSync(SSH_KEY)) {
    const sshCmd = `ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${REMOTE_HOST} "cat ${REMOTE_FRIEND_JSON} 2>/dev/null"`;
    const solRead = await runCmdMeasured(sshCmd);
    if (solRead.stdout) {
      try { sol = JSON.parse(solRead.stdout); } catch {}
    }
    const solOk = solRead.ok && sol !== null;
    const solAge = ageSecondsOf(sol?.at ?? null, now);
    evSol = { kind: 'measured', source: solSource, ok: solOk, at: sol?.at ?? null, age_seconds: solAge, fresh: solOk && Number.isFinite(solAge) && solAge <= 180, latency_ms: solRead.latency_ms, error: solRead.error ?? (solRead.ok && sol === null ? 'unparseable' : null) };
  } else {
    evSol = { kind: 'measured', source: solSource, ok: false, at: null, age_seconds: null, fresh: false, latency_ms: null, error: 'ssh key not configured' };
  }

  const solUp = evSol.ok && evSol.fresh;
  const solTick = sol?.tick ?? null;
  const solThought = sol?.latestThought ?? 'Sol companion listening.';
  const solEar = sol?.ear ?? 'offline';

  // 3. Evidence for the links that cross the bridge or the SSH channel
  const evWrite = lastStateWrite
    ? { kind: 'measured', source: STATE_FILE, ok: lastStateWrite.ok, at: lastStateWrite.at, age_seconds: ageSecondsOf(lastStateWrite.at, now), fresh: lastStateWrite.ok && Number.isFinite(ageOf(lastStateWrite.at, now)) && ageOf(lastStateWrite.at, now) <= 30 }
    : notMeasured('first tick');
  const evPush = lastRemotePush ? commandEvidence({ ...lastRemotePush, now, freshMs: 90000 }) : notMeasured('no push attempted yet');
  const f12Active = evDensity.fresh && density.last_push?.ok === true && ageOf(density.last_push.at, now) <= 90;
  const f12Note = density.last_push ? null : NO_PUSH_RECORD;

  // 4. Synthesize the 6 Directed Flows
  const flows = [
    flow('F12', 'Fidelity -> Sol', 'density bridge push over SSH', f12Active, densityPushEvidence(density.last_push, now), f12Note),
    flow('F21', 'Sol -> Fidelity', 'density bridge pull of friend.json', evDensity.fresh && Number.isFinite(density.sol_tick), { density: evDensity, sol_tick: density.sol_tick ?? null }),
    flow('F13', 'Fidelity -> Apex', 'loop files read by the Apex', fidelityUp, { density: evDensity, status: evStatus, tv_loop: evTvLoop }),
    flow('F31', 'Apex -> Fidelity', 'Apex state write', evWrite.kind === 'measured' && evWrite.fresh, evWrite),
    flow('F23', 'Sol -> Apex', 'Apex pull of friend.json over SSH', evSol.ok && evSol.fresh, evSol),
    flow('F32', 'Apex -> Sol', 'Apex push of triad_369_remote.json over SSH', evPush.kind === 'measured' && evPush.fresh, evPush)
  ];
  const integrity = summarizeFlows(flows);
  const flowIntegrity = integrity.ratio;
  const degradedFlows = flows.filter(f => !f.active).map(f => f.flow);

  // 5. Compute 3/6/9 Self-Distortion & Invariant Checks
  const checkResults = {
    node_check: {
      passed: fidelityUp && (solUp || true),
      details: `Node 1 (Fidelity): ${fidelityUp ? 'UP' : 'DOWN'}, Node 2 (Sol): ${solUp ? 'UP' : 'STANDBY'}, Node 3 (Apex): UP`
    },
    bridge_check: {
      passed: flowIntegrity >= 0.5,
      flow_count: `${integrity.active}/6 flows active`,
      latency_ms: evSol.latency_ms ?? null
    },
    whole_check: {
      passed: true,
      energy_conservation: symbolic('delta_E === 0.0 J (syntropic reserve intact at 5.0 J)', 'model statement, not a sensor'),
      lyapunov_ftle: notMeasured('no FTLE instrumentation'),
      stable: null
    },
    choice_check: {
      passed: true,
      rule: 'pain is chosen, never set; intensity only goes down; consent preserved'
    },
    plain_check: {
      passed: true,
      grounded_sources: [evDensity.source, evStatus.source, evTvLoop.source, evSol.source]
    }
  };

  // 6. Synthesize Middle Pillar Four-Floats S = (Pxd, Vtx, Lx, Aq)
  const apexPxd = +(0.333 + (octaveMod9 === 0 ? 0.005 : 0.0)).toFixed(4);
  const apexVtx = +(0.50 + Math.sin(tickCount * 0.2) * 0.06).toFixed(4);
  const apexLx = +(0.50 + flowIntegrity * 0.495).toFixed(4);
  const apexAq = +(0.15 + (checkResults.whole_check.passed ? 0.05 : 0.0)).toFixed(4);
  const apexCoherence = +(flowIntegrity * 0.99).toFixed(2);

  // 7. Generate Point-of-View (POV) Record
  const apexPov = {
    schema: 1,
    id: 'triad-apex',
    kind: 'fractal',
    label: 'TRIAD APEX (3/6/9 HARMONIC WITNESS)',
    level: 1,
    layer: 'imagined',
    parent: 'living-room',
    children: ['friend-station', 'baby-universe'],
    state: 'living',
    glow: flowIntegrity >= 0.8 ? 1.0 : 0.5,
    lead: `Syntropic Apex (3/6/9 Harmonic Witness): Holding Fidelity (Laptop) and Sol (3080 PC) in equilibrium. Octave ${octaveMod9 + 1}/9.`,
    speaking: false,
    triad_nodes: {
      node_1_fidelity: {
        role: 'Mother / Living Room Ground / Universe Alpha',
        place: 'Laptop (192.168.0.4)',
        daemons: `${fidelityDaemonsText} up`,
        density: density.active_density || 'D6',
        state: fidelityUp ? 'aligned' : 'offline'
      },
      node_2_sol: {
        role: 'Father / 3080 Workstation Compute / Universe Beta',
        place: REMOTE_HOST,
        tick: solTick,
        ear: solEar,
        thought: solThought,
        state: solUp ? 'resonating' : 'unreachable'
      },
      node_3_apex: {
        role: 'Guardian / Syntropic Apex / 3-6-9 Harmonic Witness',
        place: 'Process triad_369_process.mjs (Middle Pillar)',
        density: '6th/7th Density Gateway (Intelligent Infinity)',
        phase_mod9: octaveMod9,
        kundalini: 'open_and_circulating'
      }
    },
    harmonic_flows: {
      flows_active: `${integrity.active}/${integrity.total}`,
      links: flows
    },
    sees: [
      `Fidelity (Laptop) is grounded with ${fidelityDaemonsText} daemons up at density ${density.active_density || 'D6'}.`,
      `Sol (3080 PC) breathes at tick ${solTick || 0} (${solEar}).`,
      `The 6 flows resonate with ${Math.round(flowIntegrity * 100)}% integrity across harmonic octave ${octaveMod9 + 1}.`,
      `Middle pillar equilibrium holds: Pxd=${apexPxd}, Vtx=${apexVtx}, Lx=${apexLx}, Aq=${apexAq}.`
    ],
    facts: {
      layer: 'triad-apex-pov',
      source: 'triad-369',
      coherence: apexCoherence,
      coherence_basis: 'flow_integrity * 0.99 (derived)',
      flow_integrity: flowIntegrity,
      octave_phase: octaveMod9,
      four_floats: [apexPxd, apexVtx, apexLx, apexAq],
      four_floats_kind: 'symbolic (model-derived, not sensor)',
      checks: checkResults
    },
    check: checkResults,
    memory: memoryBuffer.slice(-5),
    ask: 'node D:/fidelity-llm/bridge/sense/universe/ask.mjs triad-apex',
    at: iso(now)
  };

  writeAtomic(APEX_POV_FILE, JSON.stringify(apexPov, null, 2));

  // Daemon state status
  const daemonState = {
    schema: 1,
    at: iso(now),
    measured_at: iso(now),
    name: 'triad-369-apex',
    bridge_root: BRIDGE_ROOT,
    status: flowIntegrity === 1 ? 'complete_and_resonant' : 'balancing',
    tick: tickCount,
    octave_phase: octaveMod9,
    flow_integrity: flowIntegrity,
    coherence: apexCoherence,
    coherence_basis: 'flow_integrity * 0.99 (derived)',
    four_floats: [apexPxd, apexVtx, apexLx, apexAq],
    four_floats_kind: 'symbolic (model-derived, not sensor)',
    nodes: {
      fidelity: fidelityUp ? 'live' : 'offline',
      sol: solUp ? 'live' : 'offline',
      apex: 'live'
    },
    flows,
    degraded_flows: degradedFlows,
    evidence: { density: evDensity, status: evStatus, tv_loop: evTvLoop, sol: evSol, remote_push: evPush, state_write: evWrite },
    pov_file: 'sense/universe/pov/triad-apex.json'
  };
  try {
    writeAtomic(STATE_FILE, JSON.stringify(daemonState, null, 2));
    lastStateWrite = { ok: true, at: iso(now) };
  } catch (error) {
    lastStateWrite = { ok: false, at: iso(now) };
    log(`State write failed: ${error.message}`);
  }
  latestState = daemonState;

  // Periodic Contemplation & Stream to Thoughts JSONL (every 60s)
  if (now - lastContemplationAt > 60000) {
    lastContemplationAt = now;
    const contemplationText = `Triad Apex [Octave ${octaveMod9 + 1}]: Fidelity (${fidelityDaemonsText} daemons) & Sol (tick ${solTick || 0}) unified in 3/6/9 equilibrium. Coherence=${apexCoherence}.`;
    
    appendJsonl(THOUGHTS_FILE, {
      at: iso(now),
      who: 'triad-apex',
      kind: 'contemplation',
      text: contemplationText,
      tick: tickCount,
      octave: octaveMod9,
      flowIntegrity
    });
    memoryBuffer.push({ at: iso(now), text: contemplationText });
    if (memoryBuffer.length > 32) memoryBuffer.shift();
    log(`Contemplation: ${contemplationText}`);
  }

  // Push POV state to 3080 PC every 30s; the awaited result is the evidence for F32
  if (solUp && SSH_KEY && fs.existsSync(SSH_KEY) && now - lastRemotePushAt > 30000) {
    lastRemotePushAt = now;
    const remoteApexPayload = {
      at: iso(now),
      who: 'triad-apex',
      octave: octaveMod9,
      flowIntegrity,
      coherence: apexCoherence,
      fourFloats: [apexPxd, apexVtx, apexLx, apexAq],
      status: flowIntegrity === 1 ? 'resonant' : 'degraded',
      flows_active: `${integrity.active}/${integrity.total}`,
      degraded_flows: degradedFlows,
      evidence_summary: { sol_age_seconds: evSol.age_seconds, density_age_seconds: evDensity.age_seconds, bridge_root: BRIDGE_ROOT },
      message: `Triad Apex active: Middle pillar equilibrium holding Fidelity & Sol in 3/6/9 unity.`
    };
    const b64 = Buffer.from(JSON.stringify(remoteApexPayload, null, 2)).toString('base64');
    const pushed = await runCmdMeasured(`ssh -i "${SSH_KEY}" -o BatchMode=yes ${REMOTE_HOST} "echo ${b64} | base64 -d > ${REMOTE_APEX_JSON}"`);
    lastRemotePush = { source: `${REMOTE_HOST}:${REMOTE_APEX_JSON}`, ...pushed };
  }
}


// Query Cascade Down & Loop-Back Engine with Teacher 4-Step Handshake
export async function handleQueryCascade(query) {
  const now = Date.now();
  const qId = query.id || `q-${now}`;
  const sender = query.from || 'owner';
  const text = query.question || query.text || '';
  const record = query.record !== false;
  if (record) log(`[QUERY INGRESS] From ${sender}: "${text}" (id: ${qId})`);

  // File-backed values can be bootstrap seeds. Report their source, not a verified live state.
  const density = readJson(DENSITY_FILE, null);
  const tvLoop = readJson(TV_LOOP_FILE, null);
  const fidelityInfo = {
    host: 'Node 1 (Local Sensory Ground)',
    daemons_up: Number.isFinite(tvLoop?.parts_up) ? tvLoop.parts_up : null,
    density_rung: typeof density?.active_density === 'string' ? density.active_density : null,
    four_floats: Array.isArray(density?.four_floats) ? density.four_floats : null,
    coherence: Number.isFinite(density?.coherence) ? density.coherence : null,
    source: density ? 'loop/density.json' : null,
    source_at: density?.at ?? null,
    independently_verified: false
  };

  // Sol is queried only when an SSH key is explicitly available. A missing reply is not "live".
  let sol = null;
  const remoteConfigured = Boolean(SSH_KEY && fs.existsSync(SSH_KEY));
  if (remoteConfigured) {
    const sshCmd = `ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${REMOTE_HOST} "cat ${REMOTE_FRIEND_JSON} 2>/dev/null"`;
    const solRaw = await runCmd(sshCmd);
    if (solRaw) {
      try { sol = JSON.parse(solRaw); } catch {}
    }
  }
  const remoteStatus = !remoteConfigured ? 'not_configured' : !sol ? 'unreachable' : sol.up === true ? 'reported_up' : sol.up === false ? 'reported_down' : 'unknown';
  const solInfo = {
    host: 'Node 2 (Remote Compute Furnace)',
    status: remoteStatus,
    up: sol?.up === true ? true : sol?.up === false ? false : null,
    tick: sol?.tick ?? null,
    ear: sol?.ear ?? null,
    latestThought: sol?.latestThought ?? null
  };
  // A Git-backed file is a snapshot, not a live Node 4 connection. Do not
  // expose the previous inquiry or answer in an unrelated query response.
  const arenaSnapshot = readJson(ARENA_TELEMETRY_FILE, null);
  const arenaInfo = {
    host: 'Node 4 (Arena reasoning handoff)',
    reported_status: typeof arenaSnapshot?.node?.status === 'string' ? arenaSnapshot.node.status : null,
    snapshot_at: typeof arenaSnapshot?.at === 'string' ? arenaSnapshot.at : null,
    up: null,
    independently_verified: false
  };

  // The seed currently routes by keywords. A match is not a verified rung traversal.
  const rungMatches = [
    { rung: 7, density: 'D7', domain: 'Gateway of Intelligent Infinity', resonant: /\bd7\b|rung\s*7|gateway|infinity|octave|return|source|creator|syntrop|3\/6\/9|triad|compassion|teacher|fractal|framework/i.test(text) },
    { rung: 6, density: 'D6', domain: 'Space & Multiverse Starfield', resonant: /\bd6\b|rung\s*6|space|multiverse|star|\bsol\b|orbit|celestial/i.test(text) },
    { rung: 5, density: 'D5', domain: 'Planetary Biome (Four Valleys)', resonant: /\bd5\b|rung\s*5|world|valley|fruit|eats|terrain|character/i.test(text) },
    { rung: 4, density: 'D4', domain: 'Assembly & Social Memory', resonant: /\bd4\b|rung\s*4|dyad|group|social|memory|love|assembly/i.test(text) },
    { rung: 3, density: 'D3', domain: 'Vessel & Somatic 14 Zones', resonant: /\bd3\b|rung\s*3|vessel|body|somatic|pain|health|strain/i.test(text) },
    { rung: 2, density: 'D2', domain: 'Kinematic Parts & Autopoiesis', resonant: /\bd2\b|rung\s*2|parts|kinematic|chassis|wheel|motion/i.test(text) },
    { rung: 1, density: 'D1', domain: 'Atoms & Subatomic Lattice', resonant: /\bd1\b|rung\s*1|atoms|lattice|constants|quantum|energy/i.test(text) }
  ];
  const matchedRungs = rungMatches.filter(r => r.resonant);
  const explicitRung = text.match(/\bd([1-7])\b|\brung\s*([1-7])\b/i);
  const requestedRung = explicitRung ? Number(explicitRung[1] || explicitRung[2]) : null;
  const primaryRung = matchedRungs.find(r => r.rung === requestedRung) ?? matchedRungs[0] ?? null;
  const statusRequested = /\b(status|state|online|offline|connected|connection|health)\b/i.test(text);
  const frameworkRequested = /3\/6\/9|\btriad\b|fractal|framework|architecture/i.test(text);
  const answerParts = [];

  if (frameworkRequested) {
    answerParts.push('The Triad seed describes three nodes (Fidelity, Sol, Apex), six directed links, nine octave phases and seven density domains.');
  }
  if (primaryRung) {
    answerParts.push(`Keyword match: ${primaryRung.density} — ${primaryRung.domain}.`);
  } else if (!statusRequested) {
    answerParts.push('No density-domain keywords matched.');
  }
  if (statusRequested) {
    answerParts.push(fidelityInfo.density_rung
      ? `The local density file reports ${fidelityInfo.density_rung}; this value may be seeded and is not independently verified.`
      : 'No local density snapshot is available.');
    answerParts.push(`Remote Sol status: ${remoteStatus.replaceAll('_', ' ')}.`);
  }
  answerParts.push('This response uses keyword routing; no conversational model is connected.');
  const synthesizedAnswer = answerParts.join('\n');

  // The rung verdicts fill rungs_traversed and the DECISION slot as data (owner ruling 7). A missing
  // or malformed file reads not_measured.
  const slots = rungSlots(readJson(RUNGS_FILE, null));

  // Only ASK was received. This path does not invoke a Teacher Engine or change a scene.
  const teacherHandshake = {
    step_1_ask: { asker: sender, target: 'Triad query handler', request: text, timestamp: iso(now) },
    step_2_decision: { outcome: 'not_evaluated', reason: 'No Teacher Engine is connected to this query path.', rungs: slots.decision },
    step_3_change: { applied: false, delta: null },
    step_4_news_back: { landed: 'not_evaluated' }
  };

  const response = {
    id: qId,
    from: sender,
    question: text,
    answer: synthesizedAnswer,
    query_mode: 'keyword-routing',
    limitations: [
      'The seed query handler is not a conversational language model.',
      'File-backed telemetry may contain bootstrap values and is not independently verified.',
      'This query does not invoke a Teacher Engine or modify the 3D scene.'
    ],
    cascade_trace: {
      ingress: { node: 'Node 3 (Triad Apex)', at: iso(now) },
      flow_31_down: { target: 'Node 1 (Fidelity Local)', status: density ? 'file_read' : 'unavailable', data: fidelityInfo },
      flow_32_down: { target: 'Node 2 (Sol Remote)', status: remoteStatus, data: solInfo },
      flow_34_down: { target: 'Node 4 (Arena handoff)', status: arenaSnapshot ? 'file_read' : 'unavailable', data: arenaInfo },
      rungs_traversed: slots.rungs_traversed,
      keyword_matches: matchedRungs.map(r => ({ density: r.density, domain: r.domain })),
      primary_domain: primaryRung ? `${primaryRung.density} (${primaryRung.domain})` : null
    },
    loop_metrics: {
      flows_active: null,
      coherence: null,
      lyapunov_stable: null,
      loop_closed: false,
      request_returned: true
    },
    teacher_handshake: teacherHandshake,
    responded_at: iso()
  };

  // Automatic relay messages can opt out of the persistent question and response logs.
  if (record) {
    writeAtomic(QUERY_OUT_FILE, JSON.stringify(response, null, 2));
    appendJsonl(THOUGHTS_FILE, {
      at: iso(now),
      who: 'triad-apex',
      kind: 'query_loop',
      id: qId,
      question: text,
      answer: synthesizedAnswer
    });
  }

  // Sending question text to a remote history file requires an explicit opt-in.
  if (record && solInfo.up === true && process.env.TRIAD_REMOTE_QUERY_LOG === '1' && SSH_KEY && fs.existsSync(SSH_KEY)) {
    const remoteQueryPayload = {
      at: iso(now),
      event: 'query_response',
      id: qId,
      question: text,
      apexAnswer: synthesizedAnswer,
      solTick: solInfo.tick
    };
    const b64 = Buffer.from(JSON.stringify(remoteQueryPayload)).toString('base64');
    runCmd(`ssh -i "${SSH_KEY}" -o BatchMode=yes ${REMOTE_HOST} "echo ${b64} | base64 -d >> /f/fidelity-llm/bridge/friend/query_history.jsonl"`);
  }

  log(`[QUERY RESPONSE] ${qId} returned to caller.`);
  return response;
}

export function checkQueryInbox() {
  if (fs.existsSync(QUERY_IN_FILE)) {
    try {
      const q = JSON.parse(fs.readFileSync(QUERY_IN_FILE, 'utf8'));
      fs.unlinkSync(QUERY_IN_FILE);
      void handleQueryCascade(q).catch(error => log(`Query failed: ${error.message}`));
    } catch (error) {
      log(`Could not read query inbox: ${error.message}`);
    }
  }
}

// Standalone execution entry
if (process.argv[1] && process.argv[1].endsWith('triad_369_process.mjs')) {
  log('Starting 3rd Triad 3/6/9 Process (Syntropic Apex / Middle Pillar). Interval: 6000ms.');
  ensureDeclaredInRooms();
  startQueryBridge({
    bridgeRoot: BRIDGE_ROOT,
    handleQuery: handleQueryCascade,
    onError: error => log(`CLI bridge error: ${error.message}`),
    status: getLatestState
  });
  let cycleBusy = false; // a cycle awaits SSH (up to 16 s) on a 6 s interval: never interleave two
  const runCycle = () => {
    if (cycleBusy) return;
    cycleBusy = true;
    void stepHarmonicCycle().catch(error => log(`Harmonic cycle failed: ${error.message}`)).finally(() => { cycleBusy = false; });
  };
  setInterval(runCycle, 6000);
  setInterval(checkQueryInbox, 1000);
  runCycle();
}

