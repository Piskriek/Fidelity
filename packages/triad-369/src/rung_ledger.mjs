// rung_ledger.mjs - the recorded reading per rung (council round 2026-11-04-rungs, docs/council/
// 2026-11-04-rungs/STEER.md): the one evaluator that turns the ledger's rows into a verdict per rung
// and a frontier, the next thing to ask the owner for. Pure: no host, no clock of its own, no file.
// The caller passes the rungs (with the values now in use), the rows and the time.
//
// The element the round found missing. Every rung of the terrain overlay already had an input, an
// output and a test. What it lacked was the reading kept as a row: what a witness outside the rung
// read, at a stated operating point, with the artifact and its SHA256, the time and the context it
// was taken in. A rung holds only while such a row, taken at the value now in use, is within
// tolerance and every rung it rests on holds. Climbing a rung adds rows and one declaration, not a
// new mechanism. docs/rungs/ledger.json holds the rows; tools/rung-ledger.test.mjs makes the
// addon's constants answer to them.
//
// The algorithm, each step once per rung, in a topological order:
//   0. validate: every number in a row must be finite, or the row is refused (never coerced);
//   1. order: Kahn's sort of the rests-on graph; a cycle is an error that names its rungs;
//   2. keys: key(r) = hash(r's context, and each direct base's id and key), chained: O(R + E*P);
//   3. admit: a row counts for its rung only if it is measured, by an admissible witness that is
//      not one of the rung's echoes, with its artifact's SHA256 in that report's manifest, taken in
//      the context now in use (the lock), not in the future and not stale. Every refusal keeps its
//      reason. A more precise reading of the same artifact by the same class of witness supersedes;
//   4. decide: blocked if a base does not hold, unmeasured with no admitted row, else 5 and 6;
//   5. estimate: only proposes the next value to try, never decides (for a fit, from its reaches);
//   6. test, on the kept readings at the value now in use: holds if all pass, fails if all fail,
//      contested if they disagree, fitted if none can decide. The owner's readings take precedence;
//   7. frontier: the rungs in use that do not hold while every base does: the next ask.
// A full pass is O(R + E*P + M log M) for R rungs, E edges, P context fields and M rows. A re-check
// after a change repeats steps 4 to 6 for the changed rungs and their descendants only (recheck).
//
// What it refuses to emit: a count, a percentage, a density, an awareness level. The output is a
// verdict per rung and a frontier; whether any count of held rungs may be shown is the owner's call.

export const VERDICTS = Object.freeze(['holds', 'fitted', 'fails', 'contested', 'unmeasured', 'blocked']);
export const REFUSALS = Object.freeze(['rung', 'non-finite', 'kind', 'echo', 'witness', 'manifest', 'key', 'future', 'stale', 'shutter']);
export const VALUE_EPS = 0.005; // a reading counts as taken at the value in use within this (values print with 2 decimals)
export const K_MIN = 0.25, K_MAX = 16.0; // the addon's clamp on a camera factor (EMatrix_Terrain.lua CameraDistanceFor)

const finite = Number.isFinite;
const round2 = v => Math.round(v * 100) / 100;

// ---------------------------------------------------------------------------------------------
// Rung kinds: who may witness each, what never counts, and how one reading passes or fails.
// ---------------------------------------------------------------------------------------------

/** Discrete rungs pass on a stated outcome; fit, projection and height compare a number with tau. */
export const KINDS = Object.freeze({
  // the probe's tile lookup: the map data, and the order UnitPosition's numbers are read in
  map: { witnesses: ['host'], echoes: ['headless'], test: r => (r.observed.tile === 'FOUND' ? pass() : fail(null, 'the tile was ' + r.observed.tile)) },
  axis: { witnesses: ['host'], echoes: ['headless'], test: r => (r.observed.tile === 'FOUND' ? pass() : fail(null, 'the tile was ' + r.observed.tile)) },
  // GetModelFileID answered; 'trust the call' (no GetModelFileID) is an echo
  load: { witnesses: ['host'], echoes: ['headless', 'trust-the-call'], test: r => (r.observed.failed === 0 && r.observed.loaded > 0 ? pass() : fail(null, `${r.observed.failed} failed`)) },
  // the model seen in its frame in a screenshot; IsVisible's 'visible true' is an echo
  frame: { witnesses: ['owner', 'director'], echoes: ['client-visible', 'headless'], test: r => (r.observed.drawn === true ? pass() : fail(null, 'nothing drawn')) },
  // how much of its red-edged test frame the model fills, top to bottom, at the camera factor k
  fit: { witnesses: ['owner', 'director'], echoes: ['headless', 'typed-constant'], atValue: true, test: fitTest, estimate: estimateFit },
  // predicted feet and tops against real ones in an overlay-off twin (no rows yet: the tenth report)
  projection: { witnesses: ['owner', 'director'], echoes: ['probe-print', 'overlay-on', 'headless'], atValue: false, needsPose: true, test: residualTest },
  height: { witnesses: ['owner', 'director'], echoes: ['overlay-on', 'headless'], atValue: false, needsPose: true, test: residualTest },
  // a generic stated outcome, for tests of the evaluator itself
  check: { witnesses: ['host', 'owner', 'director'], echoes: ['headless'], test: r => (r.observed.ok === true ? pass() : fail(null, 'not ok')) },
});

function pass(residual = null) { return { result: 'pass', residual }; }
function fail(residual = null, why = '') { return { result: 'fail', residual, why }; }

/**
 * One fit reading at the value in use. The frame is the test frame /fide terrain test draws, 0.4 of
 * the screen tall; top and bottom are the gaps from its edges to the model, as fractions of its
 * height, or 'clipped' (the model runs past that edge) or 'hidden' (something covers that edge).
 * A reading that recorded only a fill (the first readings, edges not recorded) is tested on it.
 */
export function fitTest(row, tau) {
  const o = row.observed || {};
  const { top, bottom } = o;
  if (top === 'clipped' || bottom === 'clipped') return fail(null, 'the model runs past the frame edge');
  if (typeof top === 'number' && typeof bottom === 'number') {
    const residual = top + bottom; // 1 - fill
    return residual <= tau ? pass(residual) : fail(residual, `fills ${round2(1 - residual)} of its frame`);
  }
  if (typeof top === 'number' && top > tau) return fail(top, `a gap of ${top} at the top alone exceeds the tolerance`);
  if (typeof bottom === 'number' && bottom > tau) return fail(bottom, `a gap of ${bottom} at the bottom alone exceeds the tolerance`);
  if (top === undefined && bottom === undefined && typeof o.fill === 'number') {
    const residual = Math.abs(1 - o.fill);
    return residual <= tau ? pass(residual) : fail(residual, `fills ${o.fill} of its frame`);
  }
  return { result: 'untestable', residual: null, why: 'occluded: an edge of the model was hidden' };
}

/** A projection or height reading: observed.residual (normalized by the prop's projected height). */
function residualTest(row, tau) {
  const r = row.observed && row.observed.residual;
  if (typeof r !== 'number') return { result: 'untestable', residual: null, why: 'no residual recorded' };
  return Math.abs(r) <= tau ? pass(Math.abs(r)) : fail(Math.abs(r), 'outside the tolerance');
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/**
 * The fit's estimate: only a proposal. A PlayerModel frame centres the model's bounds on its
 * mid-line and draws it at 1/k (CLAUDE.md section 1), so each file has two reaches at camera x1,
 * in frame heights: up = k (0.5 - top) above the mid-line and down = k (0.5 - bottom) below it.
 * Both are invariant in k (the barrel's three readings, x0.6 to x3, agree within 0.015), as k x fill = up + down
 * is. The proposal is the smallest k at which neither edge is clipped, 2 max(up, down): there the
 * model's base sits at the frame's bottom when down >= up, where the prop's projected foot is
 * anchored. When every reading overflowed, the proposal doubles the largest k read (at most six
 * doublings inside the clamp). With an edge never seen, nothing is proposed: the next reading must
 * see both edges. The width reach gives the frame aspect the model needs at the proposal.
 */
export function estimateFit(rows, rung, tau) {
  const ups = [], downs = [], widths = [], fills = [];
  let clippedK = -Infinity, allClipped = rows.length > 0;
  for (const row of rows) {
    const o = row.observed || {}, k = row.value;
    if (typeof o.top === 'number') ups.push(k * (0.5 - o.top));
    if (typeof o.bottom === 'number') downs.push(k * (0.5 - o.bottom));
    if (typeof o.width === 'number' && finite(rung.context && rung.context.aspect)) widths.push(k * o.width * rung.context.aspect);
    if (o.top === undefined && o.bottom === undefined && typeof o.fill === 'number') fills.push(k * o.fill);
    const clipped = o.top === 'clipped' || o.bottom === 'clipped';
    if (clipped) clippedK = Math.max(clippedK, k); else allClipped = false;
  }
  if (ups.length && downs.length) {
    const up = median(ups), down = median(downs), big = Math.max(up, down);
    const k = Math.min(Math.max(2 * big, K_MIN), K_MAX);
    const fillAt = (up + down) / (2 * big);
    const out = { value: round2(k), rule: 'twice the larger reach', reaches: { up: round3(up), down: round3(down) }, fillAt: round3(fillAt), canPass: fillAt >= 1 - tau };
    if (widths.length) out.aspectNeeded = round3(median(widths) / k);
    return out;
  }
  if (allClipped) return { value: round2(Math.min(2 * clippedK, K_MAX)), rule: 'doubled: it overflowed at every value read' };
  if (fills.length && !ups.length && !downs.length) return { value: round2(median(fills)), rule: 'k x fill (edges not recorded)' };
  return null;
}
const round3 = v => Math.round(v * 1000) / 1000;

// ---------------------------------------------------------------------------------------------
// Order, keys, descendants
// ---------------------------------------------------------------------------------------------

/** Kahn's topological sort of the rests-on graph. Throws on an unknown base or a cycle, naming the rungs. */
export function order(rungs) {
  const byId = new Map();
  for (const r of rungs) {
    if (byId.has(r.id)) throw new Error(`rung ${r.id} is declared twice`);
    byId.set(r.id, r);
  }
  const indeg = new Map(), out = new Map();
  for (const r of rungs) { indeg.set(r.id, 0); out.set(r.id, []); }
  for (const r of rungs) {
    for (const b of r.restsOn || []) {
      if (!byId.has(b)) throw new Error(`rung ${r.id} rests on an unknown rung ${b}`);
      indeg.set(r.id, indeg.get(r.id) + 1);
      out.get(b).push(r.id);
    }
  }
  const queue = rungs.filter(r => indeg.get(r.id) === 0).map(r => r.id);
  const seq = [];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    seq.push(id);
    for (const next of out.get(id)) {
      indeg.set(next, indeg.get(next) - 1);
      if (indeg.get(next) === 0) queue.push(next);
    }
  }
  if (seq.length !== rungs.length) {
    const left = rungs.filter(r => indeg.get(r.id) > 0).map(r => r.id);
    throw new Error(`cycle among rungs: ${left.join(', ')}`);
  }
  return { order: seq, out };
}

/** Out-edge BFS: the given rungs and every rung resting on them, directly or not. */
export function descendants(rungs, ids) {
  const out = new Map(rungs.map(r => [r.id, []]));
  for (const r of rungs) for (const b of r.restsOn || []) if (out.has(b)) out.get(b).push(r.id);
  const seen = new Set();
  const queue = [...ids].filter(id => out.has(id));
  for (const id of queue) seen.add(id);
  for (let i = 0; i < queue.length; i++) {
    for (const next of out.get(queue[i])) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  return seen;
}

function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}

/** FNV-1a, 64 bits: a fixed-size key, so chained keys do not grow with the number of paths below. */
export function hash64(s) {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}

/** key(r) = hash(id, context, value, and each direct base's id and key), in the given order. */
export function rungKeys(rungs, seq = order(rungs).order) {
  const byId = new Map(rungs.map(r => [r.id, r]));
  const keys = new Map();
  for (const id of seq) {
    const r = byId.get(id);
    const bases = (r.restsOn || []).map(b => b + '=' + keys.get(b)).join(',');
    keys.set(id, hash64(id + '|' + canonical(r.context || {}) + '|' + canonical(r.value === undefined ? null : r.value) + '|' + bases));
  }
  return keys;
}

// ---------------------------------------------------------------------------------------------
// Admission
// ---------------------------------------------------------------------------------------------

function numbersIn(v, acc = []) {
  if (typeof v === 'number') acc.push(v);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) numbersIn(x, acc);
  return acc;
}

/** 'YYYY-MM-DD HH:MM:SS' (the client's local clock, as the step stamp prints it) as a comparable number, or null. */
export function stampTime(s) {
  const m = typeof s === 'string' && s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function sameContext(rung, row) {
  const want = rung.context || {};
  const got = row.context || {};
  for (const k of Object.keys(want)) if (canonical(want[k]) !== canonical(got[k])) return false;
  return true;
}

/**
 * Admits or refuses each row for its rung. Returns { byRung: Map id -> rows, refused: [{ id, rung, reason }] }.
 * manifests: { [report stamp]: { [file]: SHA256 } }. now: the caller's clock, in stampTime's convention.
 */
export function admit(rows, rungs, { now, manifests = {} } = {}) {
  const byId = new Map(rungs.map(r => [r.id, r]));
  const byRung = new Map(rungs.map(r => [r.id, []]));
  const refused = [];
  const nowT = typeof now === 'string' ? stampTime(now) : now;
  for (const row of rows) {
    const rung = byId.get(row.rung);
    const why = reason => refused.push({ id: row.id, rung: row.rung, reason });
    if (!rung) { why('rung'); continue; }
    const kind = KINDS[rung.kind] || KINDS.check;
    if (!numbersIn([row.value, row.precision, row.observed, row.context]).every(finite)) { why('non-finite'); continue; }
    const at = stampTime(row.at);
    if (at === null) { why('non-finite'); continue; }
    if (row.kind !== 'measured') { why('kind'); continue; }
    if ((rung.echoes || kind.echoes).includes(row.witness)) { why('echo'); continue; }
    if (!(rung.witnesses || kind.witnesses).includes(row.witness)) { why('witness'); continue; }
    const a = row.artifact || {};
    const listed = manifests[a.report] && manifests[a.report][a.file];
    if (!a.sha256 || !listed || String(listed).toUpperCase() !== String(a.sha256).toUpperCase()) { why('manifest'); continue; }
    if (!sameContext(rung, row)) { why('key'); continue; }
    if (finite(nowT) && at > nowT) { why('future'); continue; }
    if (finite(rung.window) && finite(nowT) && nowT - at > rung.window * 1000) { why('stale'); continue; }
    if (kind.needsPose && !(row.pose && finite(row.pose.facingSpread) && row.pose.facingSpread <= (rung.poseTolerance ?? 0.02))) { why('shutter'); continue; }
    byRung.get(rung.id).push(row);
  }
  return { byRung, refused };
}

/** Within one rung: per artifact and witness class, the most precise reading (ties: the later row) supersedes the others. */
function supersede(rows) {
  const best = new Map();
  const superseded = [];
  rows.forEach((row, i) => {
    const g = `${row.artifact.report}/${row.artifact.file}/${row.witness}`;
    const cur = best.get(g);
    const p = finite(row.precision) ? row.precision : Infinity;
    if (!cur) { best.set(g, { row, i, p }); return; }
    if (p < cur.p || (p === cur.p && i > cur.i)) { superseded.push({ id: cur.row.id, by: row.id }); best.set(g, { row, i, p }); }
    else superseded.push({ id: row.id, by: cur.row.id });
  });
  const gone = new Set(superseded.map(x => x.id)); // a Set, so this stays linear in the rung's rows
  const kept = rows.filter(r => !gone.has(r.id));
  return { kept, superseded };
}

// ---------------------------------------------------------------------------------------------
// Decide
// ---------------------------------------------------------------------------------------------

function decideOne(rung, rows, baseVerdicts) {
  const kind = KINDS[rung.kind] || KINDS.check;
  const tau = finite(rung.tolerance) ? rung.tolerance : 0.1;
  const v = { rung: rung.id, kind: rung.kind, value: rung.value === undefined ? null : rung.value, tolerance: tau, inUse: rung.inUse !== false };
  const notHeld = (rung.restsOn || []).filter(b => baseVerdicts.get(b) !== 'holds');
  if (notHeld.length) return { ...v, verdict: 'blocked', blockedBy: notHeld };
  if (!rows.length) return { ...v, verdict: 'unmeasured' };
  const { kept, superseded } = supersede(rows);
  const atValue = kind.atValue ? kept.filter(r => finite(rung.value) && Math.abs(r.value - rung.value) <= VALUE_EPS) : kept;
  const results = atValue.map(row => ({ id: row.id, witness: row.witness, ...kind.test(row, tau), row }));
  const decisive = results.filter(x => x.result !== 'untestable');
  const estimate = kind.estimate ? kind.estimate(kept, rung, tau) : null;
  const newest = [...kept].sort((a, b) => stampTime(a.at) - stampTime(b.at)).pop();
  const evidence = x => ({ witness: x.witness, reader: x.row.reader, artifact: x.row.artifact, at: x.row.at });
  const base = {
    ...v, admitted: kept.map(r => r.id), superseded,
    untestable: results.filter(x => x.result === 'untestable').map(x => ({ id: x.id, reason: x.why })),
    estimate, report: newest.artifact.report,
  };
  if (!decisive.length) return { ...base, verdict: 'fitted' };
  const owner = decisive.filter(x => x.witness === 'owner'); // the owner's readings take precedence
  const deciding = owner.length ? owner : decisive;
  const passes = deciding.filter(x => x.result === 'pass').length;
  const verdict = passes === deciding.length ? 'holds' : passes === 0 ? 'fails' : 'contested';
  const last = [...deciding].sort((a, b) => stampTime(a.row.at) - stampTime(b.row.at)).pop();
  return {
    ...base, verdict, report: last.row.artifact.report,
    deciding: deciding.map(x => ({ id: x.id, result: x.result, residual: x.residual, why: x.why || '' })),
    residual: last.residual, evidence: evidence(last),
  };
}

/**
 * The full pass. Returns { order, keys, verdicts: Map id -> verdict, frontier: [ids], decided, refused }.
 * opts: { now, manifests }. decided counts the rungs decided in this pass (each exactly once).
 */
export function evaluate(rungs, rows, opts = {}) {
  const { order: seq } = order(rungs);
  const keys = rungKeys(rungs, seq);
  const { byRung, refused } = admit(rows, rungs, opts);
  const byId = new Map(rungs.map(r => [r.id, r]));
  const verdicts = new Map();
  const status = new Map();
  let decided = 0;
  for (const id of seq) {
    const d = decideOne(byId.get(id), byRung.get(id), status);
    decided++;
    d.key = keys.get(id);
    verdicts.set(id, d);
    status.set(id, d.verdict);
  }
  return { order: seq, keys, verdicts, frontier: frontierOf(rungs, verdicts), decided, refused };
}

/**
 * The incremental re-check: after rows were added or a rung's context or value changed, re-decides
 * only the changed rungs, the rungs whose key changed, and their descendants (one BFS); every other
 * verdict is reused from previous. decided counts the rungs re-decided.
 */
export function recheck(rungs, rows, previous, changed, opts = {}) {
  const { order: seq } = order(rungs);
  const keys = rungKeys(rungs, seq);
  const moved = [...changed];
  for (const [id, k] of keys) if (previous.keys.get(id) !== k) moved.push(id);
  const dirty = descendants(rungs, moved);
  const dirtyRungs = rungs.filter(r => dirty.has(r.id));
  const dirtyRows = rows.filter(r => dirty.has(r.rung));
  const { byRung, refused } = admit(dirtyRows, dirtyRungs, opts);
  const byId = new Map(rungs.map(r => [r.id, r]));
  const verdicts = new Map();
  const status = new Map();
  let decided = 0;
  for (const id of seq) {
    let d;
    if (dirty.has(id)) { d = decideOne(byId.get(id), byRung.get(id), status); d.key = keys.get(id); decided++; }
    else d = previous.verdicts.get(id);
    verdicts.set(id, d);
    status.set(id, d.verdict);
  }
  const keptRefusals = previous.refused.filter(x => !dirty.has(x.rung));
  return { order: seq, keys, verdicts, frontier: frontierOf(rungs, verdicts), decided, refused: [...keptRefusals, ...refused] };
}

function frontierOf(rungs, verdicts) {
  return rungs
    .filter(r => r.inUse !== false)
    .filter(r => verdicts.get(r.id).verdict !== 'holds' && verdicts.get(r.id).verdict !== 'blocked')
    .map(r => r.id);
}

// ---------------------------------------------------------------------------------------------
// The terrain overlay's rungs, built from the addon's own constants
// ---------------------------------------------------------------------------------------------

/**
 * The constants of FidelityEMatrix/EMatrix_Terrain.lua the rungs are built from, read from its
 * source text: FIT_BY_FILE, FIT_STATUS, FIT_KNOTS, ASPECT_RULES, HEIGHT_RULES, FRAME_ORDER and the
 * order PlayerState reads UnitPosition's numbers in.
 */
export function readTerrainConstants(src) {
  const block = name => { // the balanced { ... } after "local NAME = "
    const at = src.indexOf(`local ${name} = {`);
    if (at < 0) throw new Error(`EMatrix_Terrain.lua has no ${name}`);
    const start = src.indexOf('{', at);
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    throw new Error(`EMatrix_Terrain.lua: ${name} is not closed`);
  };
  const fitByFile = {};
  for (const m of block('FIT_BY_FILE').matchAll(/([a-z0-9_]+)\s*=\s*([0-9.]+)/g)) fitByFile[m[1]] = Number(m[2]);
  const fitStatus = {};
  for (const m of block('FIT_STATUS').matchAll(/([a-z0-9_]+)\s*=\s*\{\s*"([a-z]+)",\s*"([0-9-]+)"\s*\}/g)) fitStatus[m[1]] = { verdict: m[2], report: m[3] };
  const pairs = text => [...text.matchAll(/\{\s*([0-9.]+),\s*([0-9.]+)\s*\}/g)].map(m => [Number(m[1]), Number(m[2])]);
  const words = text => [...text.matchAll(/\{\s*"([a-z]+)",\s*([0-9.]+)\s*\}/g)].map(m => [m[1], Number(m[2])]);
  const aspectDefault = Number((src.match(/local ASPECT_DEFAULT = ([0-9.]+)/) || [])[1]);
  const heightDefault = Number((src.match(/local HEIGHT_DEFAULT = ([0-9.]+)/) || [])[1]);
  const frameOrder = [...block('FRAME_ORDER').matchAll(/"([A-Za-z]+)"/g)].map(m => m[1]);
  const readOrder = /return \{ x = ux, y = uy,/.test(src) ? 'north-south first' : 'west-east first';
  return {
    fitByFile, fitStatus, fitKnots: pairs(block('FIT_KNOTS')), aspectRules: words(block('ASPECT_RULES')), aspectDefault,
    heightRules: words(block('HEIGHT_RULES')), heightDefault, frameOrder, readOrder,
  };
}

const ruleFor = (rules, dflt, file) => { for (const [word, v] of rules) if (file.includes(word)) return v; return dflt; };

/**
 * The terrain's rung table: map data, axis, load, the frame kinds, one fit per file (the files the
 * addon has a fit for, and any file the ledger has readings of), the projection at the start pose
 * and one height per fitted file. Relative position is not a rung: it is projection, fit and height
 * together, plus the owner's word. ctx: { build, loader, pose }.
 */
export function terrainRungs(c, { build, loader = 'path', pose = 'abbey-door', files = [], tolerance = 0.1 } = {}) {
  const frameKind = c.frameOrder[0];
  const rungs = [
    { id: 'map', kind: 'map', context: { build }, restsOn: [] },
    { id: 'axis', kind: 'axis', context: { readOrder: c.readOrder }, restsOn: ['map'] },
    { id: 'load', kind: 'load', context: { build, loader }, restsOn: ['map'] },
  ];
  for (const k of c.frameOrder) rungs.push({ id: 'frame:' + k, kind: 'frame', context: { build }, restsOn: ['load'], inUse: k === frameKind });
  const all = [...new Set([...Object.keys(c.fitByFile), ...files])].sort();
  for (const file of all) {
    rungs.push({
      id: 'fit:' + file, kind: 'fit', restsOn: ['frame:' + frameKind], tolerance,
      context: { frameKind, aspect: ruleFor(c.aspectRules, c.aspectDefault, file), build },
      value: c.fitByFile[file] === undefined ? null : c.fitByFile[file],
      inUse: c.fitByFile[file] !== undefined,
    });
  }
  rungs.push({ id: 'projection:' + pose, kind: 'projection', restsOn: ['map', 'axis'], tolerance, context: { pose } });
  for (const file of Object.keys(c.fitByFile).sort()) {
    rungs.push({ id: 'height:' + file, kind: 'height', restsOn: ['projection:' + pose, 'fit:' + file], tolerance, context: { pose } });
  }
  return rungs;
}

/** The rows' report manifests as { [stamp]: { [file]: SHA256 } }, from a ledger's manifests block. */
export function manifestsOf(ledger) {
  return ledger.manifests || {};
}
