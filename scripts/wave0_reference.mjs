/**
 * Wave 0 reference implementation (Plan §8.6, `B178`; partly implemented in R38).
 *   Q1 energy:  the discrete-gradient port-Hamiltonian step (Plan Part 1 §1.1) with an energy ledger and declared
 *               ports, toroid relaxation into the thermal sink, and the enclosing-level gateway P = G · C · P_local.
 *   Q2 memory:  `me` retention with episodes pinned while their cause is unresolved.
 *   Q3 soul:    the `ms` line and its two scopes (session save, incarnation transfer).
 * Pure functions on plain float64 arrays; importing this module has no side effects; not yet wired to a kernel.
 * Not implemented: the per-episode update of `arch=`/`pol=` (no rule set, `B179`), the byte-budget eviction order of
 * `B102`, and misuse consequences (no values set). The balance level, gate width, P_local by stage, birth values and the
 * rebirth blend of `s=` were set in R38 (the owner approved Argon's proposals); other choices made here are listed in `B179`.
 * Bridge (end of file, proposed after R38, nothing in it ruled): the gateway composed across levels, with a two-sided
 * source, a helicity ledger, a tower check, a phased port, a split-amplitude check and harvest by merging; plus the D2
 * options on rebirthTransfer and a merge port on the energy ledger. Every bridge option is off unless passed, and with
 * none passed every R38 function gives the same output, bit for bit (tested on a fixed grid of inputs against a frozen copy
 * of the R38 module in scripts/fixtures).
 * Tests: scripts/wave0_reference_test.mjs.
 */

const EPS = Number.EPSILON;
const finiteOr = (v, f) => (Number.isFinite(v) ? v : f);
const clamp = (v, lo, hi, f) => Math.max(lo, Math.min(hi, finiteOr(v, f)));
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const matVec = (A, v) => A.map(row => dot(row, v));
const norm = v => Math.sqrt(dot(v, v));

// Same token rule as the shorthand formatter in adversarial_red_team_v9_audit.mjs.
function sanitizeToken(str, fallback = 'unknown') {
  const s = String(str ?? fallback).trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9:_.-]/g, '');
  return s.length > 0 ? s : fallback;
}

// Compensated (Neumaier) running sum, so long ledgers do not drift.
function runningSum() {
  let s = 0, c = 0;
  return {
    add(x) { const t = s + x; c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s; s = t; },
    get value() { return s + c; },
  };
}

// ============================================================================
// Q1. Energy ledger and declared ports
// ============================================================================
// Energy enters only through these ports (Plan Part 1 §1.1; `ambient` is the regeneration of §8.2 B129). Dissipation
// leaves to the thermal sink, which only receives energy. A port's supply can be negative (energy leaving through it).
export const INFLOW_PORTS = Object.freeze(['stellar', 'ambient', 'gateway']);
export const THERMAL = 'thermal';
// Bridge option: `merge: true` also declares the merge port, through which harvest moves a child up (harvestUp).
export const MERGE_PORT = 'merge';

export function createEnergyLedger(opts = {}) {
  const ports = opts?.merge === true ? [...INFLOW_PORTS, MERGE_PORT] : INFLOW_PORTS;
  const entries = [];
  const inflow = runningSum(), thermal = runningSum(), drawn = new Map();
  let scale = 0;
  return {
    entries,
    post(port, joules, meta = {}) {
      if (port !== THERMAL && !ports.includes(port)) throw new Error(`undeclared energy port: ${port}`);
      if (!Number.isFinite(joules)) throw new Error(`non-finite ledger entry on port ${port}`);
      if (port === THERMAL && joules < 0) throw new Error('the thermal sink only receives energy');
      entries.push({ ...meta, port, joules });
      (port === THERMAL ? thermal : inflow).add(joules);
      scale += Math.abs(joules);
      if (port === 'gateway') {
        if (!drawn.has(meta.entity)) drawn.set(meta.entity, runningSum());
        drawn.get(meta.entity).add(joules);
      }
    },
    inflow: () => inflow.value,
    thermal: () => thermal.value,
    drawnBy: entity => drawn.get(entity)?.value ?? 0,
    magnitude: () => scale,
  };
}

// The free-energy detector (brief T5): the change in stored energy plus heat must equal the declared inflow.
// The tolerance scales with the energies involved, including everything that passed through the ledger.
export function ledgerCloses({ stored0, stored1, ledger, tol = 1e-12 }) {
  const residual = (stored1 + ledger.thermal()) - stored0 - ledger.inflow();
  const scale = Math.max(1, Math.abs(stored0), Math.abs(stored1), ledger.magnitude());
  return { ok: Math.abs(residual) <= tol * scale, residual };
}

// ============================================================================
// Q1. Discrete-gradient port-Hamiltonian step
// ============================================================================
// Passivity preconditions (B80): J skew, R symmetric positive semidefinite (Cholesky with a jitter scaled to the
// matrices), all entries finite, J and R square and the same size.
export function checkPreconditions(J, R, tol = 1e-12) {
  const n = Array.isArray(J) ? J.length : 0;
  const square = M => Array.isArray(M) && M.length === n && M.every(r => Array.isArray(r) && r.length === n);
  if (!n || !square(J) || !square(R)) return ['J and R must be square matrices of the same size'];
  const all = [...J.flat(), ...R.flat()];
  if (!all.every(Number.isFinite)) return ['J and R must be finite'];
  const t = tol * Math.max(1, ...all.map(Math.abs));
  const errors = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!(Math.abs(J[i][j] + J[j][i]) <= t)) errors.push(`J is not skew at (${i},${j})`);
    if (!(Math.abs(R[i][j] - R[j][i]) <= t)) errors.push(`R is not symmetric at (${i},${j})`);
  }
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = R[i][j] + (i === j ? t : 0);
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) {
      if (!(s >= 0)) { errors.push(`R is not positive semidefinite (pivot ${i})`); return errors; }
      L[i][i] = Math.sqrt(s);
    } else L[i][j] = L[j][j] > 0 ? s / L[j][j] : 0;
  }
  return errors;
}

// Gonzalez's midpoint discrete gradient: ḡ = ∇H(m) + [(H(y) − H(x) − ∇H(m)·d) / |d|²] d, with m = (x + y)/2, d = y − x.
// It satisfies H(y) − H(x) = ḡ·(y − x) for any H. When d is tiny, or the bracket is below rounding noise, the
// correction is dropped: the energy error that leaves is of order |d|³, far below the solver tolerance.
export function discreteGradient(H, gradH, x, y) {
  const m = x.map((xi, i) => 0.5 * (xi + y[i]));
  const g = gradH(m);
  const d = y.map((yi, i) => yi - x[i]);
  const dd = dot(d, d);
  if (dd <= 1e-12 * (1 + dot(x, x))) return g;
  const Hx = H(x), Hy = H(y), gd = dot(g, d);
  const bracket = Hy - Hx - gd;
  if (Math.abs(bracket) <= 16 * EPS * (Math.abs(Hx) + Math.abs(Hy) + Math.abs(gd))) return g;
  return g.map((gi, i) => gi + (bracket / dd) * d[i]);
}

// One step x' = x + Δt (J − R) ḡ(x, x') + Δt G u, solved by fixed-point iteration. Each column of G is a declared port.
// Energy identity: H(x') − H(x) = −Δt ḡᵀRḡ + Δt uᵀGᵀḡ. Dissipation is reported for the thermal sink; each port's
// supply is reported separately. The iteration stops at `tol`, or accepts a stalled iterate within 1e-9 relative (the
// rounding floor); otherwise it throws. In floating point the identity holds to that tolerance (Part 1 §1.1).
export function stepPortHamiltonian(x, { H, gradH, J, R, G = null, u = null, ports = [], dt, tol = 1e-15, maxIter = 500 }) {
  if (!(Number.isFinite(dt) && dt > 0)) throw new Error('dt must be a positive finite number');
  if (!Array.isArray(x) || !x.every(Number.isFinite)) throw new Error('the state must be finite');
  const pre = checkPreconditions(J, R);
  if (pre.length) throw new Error(`passivity preconditions fail: ${pre.join('; ')}`);
  const n = x.length;
  if (J.length !== n) throw new Error('J and R must match the state size');
  if (G && (!Array.isArray(u) || u.length !== ports.length || G.length !== n || G.some(r => r.length !== ports.length) || !u.every(Number.isFinite))) {
    throw new Error('each input column needs one declared port and one finite input value');
  }
  if (!G && ports.length) throw new Error('ports were declared without an input matrix G');
  const A = J.map((row, i) => row.map((v, j) => v - R[i][j]));
  const Gu = G ? matVec(G, u) : new Array(n).fill(0);
  let y = x.slice(), delta = Infinity, prev = Infinity, iter = 0, stalled = false;
  while (iter < maxIter) {
    iter++;
    const Ag = matVec(A, discreteGradient(H, gradH, x, y));
    const next = x.map((xi, i) => xi + dt * (Ag[i] + Gu[i]));
    delta = norm(next.map((v, i) => v - y[i]));
    y = next;
    if (delta <= tol * (1 + norm(y))) break;
    if (delta >= prev && delta <= 1e-9 * (1 + norm(y))) { stalled = true; break; }
    prev = delta;
  }
  if (!(delta <= tol * (1 + norm(y))) && !stalled) throw new Error(`implicit solve did not converge in ${maxIter} iterations; reduce dt`);
  if (!y.every(Number.isFinite)) throw new Error('the step produced a non-finite state');
  const g = discreteGradient(H, gradH, x, y);
  const supplied = ports.map((port, j) => ({ port, joules: dt * u[j] * G.reduce((s, row, i) => s + row[j] * g[i], 0) }));
  return { x: y, iterations: iter, stalled, H0: H(x), H1: H(y), dissipated: Math.max(0, dt * dot(g, matVec(R, g))), supplied };
}

export function postStep(ledger, step, meta = {}) {
  ledger.post(THERMAL, step.dissipated, meta);
  for (const s of step.supplied) ledger.post(s.port, s.joules, meta);
}

// ============================================================================
// Q1. The toroid (ordinary physics) and the gateway (the one declared source)
// ============================================================================
// Taylor floor and coherence (brief §5.1): W_min = λ_geom |K| / 2, coherence c = W_min / W in (0, 1].
export function toroidFloor(t) { return Math.max(0, finiteOr(t.lambdaGeom, 0)) * Math.abs(finiteOr(t.K, 0)) / 2; }
export function toroidCoherence(t) {
  const W = finiteOr(t.W, 0);
  return W > 0 ? clamp(toroidFloor(t) / W, 0, 1, 0) : 0;
}

// Relaxation: the free energy above the Taylor floor decays at rate kappa; what is lost goes to the thermal sink exactly;
// K is unchanged. A non-positive or non-finite dt is no step.
export function stepToroidRelaxation(t, dt, ledger, meta = {}) {
  const free = Math.max(0, finiteOr(t.W, 0) - toroidFloor(t));
  const dW = Math.min(free, Math.max(0, finiteOr(t.kappa, 0)) * free * Math.max(0, finiteOr(dt, 0)));
  ledger.post(THERMAL, dW, { ...meta, source: 'toroid-relaxation' });
  return { ...t, W: t.W - dW };
}

const smoothstep = s => (s <= 0 ? 0 : s >= 1 ? 1 : s * s * (3 - 2 * s));

// Values set in R38: the owner approved Argon's proposals for the open values. Argon proposed a logistic curve of
// width 0.09 around 0.81; here 0.09 is the width of a smoothstep that starts at 0.81, so the gate stays exactly 0 at or
// below the set level, as the brief's T3 requires.
export const GATE = Object.freeze({ setLevel: 0.81, gateWidth: 0.09 });
// P_local by stage (Plan StageId S0a..S6): 9 · 3^k, from 9 at S0a to 19,683 at S6.
export const P_LOCAL_BY_STAGE = Object.freeze(Object.fromEntries(['S0a', 'S0b', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((s, k) => [s, 9 * 3 ** k])));

// The gateway (§8.6 Q1): P = G · C · P_local. G is exactly 0 at or below the set balance level and rises smoothly to 1
// over gateWidth; C = coherence × headroom of the charged toroid; P_local is the enclosing level's local supply, given
// directly or by stage. Non-finite inputs, or a gate width that is not positive, close the gate.
export function gatewayPower({ balance, setLevel = GATE.setLevel, gateWidth = GATE.gateWidth, toroid, pLocal, stage }) {
  const b = Number.isFinite(balance) ? balance : -Infinity;
  const level = Number.isFinite(setLevel) ? setLevel : Infinity;
  const width = Number.isFinite(gateWidth) && gateWidth > 0 ? gateWidth : null;
  const G = b <= level || width === null ? 0 : smoothstep((b - level) / width);
  const Wmax = finiteOr(toroid?.Wmax, 0);
  const W = finiteOr(toroid?.W, NaN);
  const headroom = Wmax > 0 && W >= 0 ? clamp(1 - W / Wmax, 0, 1, 0) : 0;
  const C = toroidCoherence(toroid ?? {}) * headroom;
  const supply = pLocal !== undefined ? pLocal : P_LOCAL_BY_STAGE[stage];
  return { G, C, P: G * C * Math.max(0, finiteOr(supply, 0)) };
}

// One gateway draw by a named entity through a toroid it holds. The energy enters the toroid's field, is logged against
// the entity, and never overfills W_max. A toroid with an `owner` other than the entity does not couple. An optional
// shared `pool` ({ remaining }) caps what all entities draw from the same field in a step; whether P_local is shared
// that way is an owner decision (B179).
export function drawGateway(toroid, entity, params, dt, ledger, pool = null) {
  if (typeof entity !== 'string' || entity.length === 0) throw new Error('a gateway draw needs a named entity');
  if (toroid?.owner !== undefined && toroid.owner !== entity) return { ...toroid };
  if (!(Number.isFinite(toroid?.W) && Number.isFinite(toroid?.Wmax) && toroid.Wmax > 0 && toroid.W >= 0)) return { ...toroid };
  const { P } = gatewayPower({ ...params, toroid });
  let E = Math.min(P * Math.max(0, finiteOr(dt, 0)), Math.max(0, toroid.Wmax - toroid.W));
  if (pool) { E = Math.min(E, Math.max(0, finiteOr(pool.remaining, 0))); pool.remaining -= E; }
  if (E > 0) ledger.post('gateway', E, { entity, obj: toroid.id });
  return { ...toroid, W: toroid.W + E };
}

// ============================================================================
// Q2. `me` retention with pinning
// ============================================================================
// An episode is linked to a cause when its `by` and `d` (as sanitized tokens) match an `mc` line. Episodes whose cause
// is open are pinned, at most 16 (the most recent pinned); the rest of the 32 slots hold the most recent of the others,
// older pinned ones included. Order is kept. Closing the cause (open=0) unpins its episodes on the next selection.
export const ME_SLOTS = 32;
export const ME_PIN_MAX = 16;
const causeKey = (by, d) => `${sanitizeToken(by, 'none')}|${sanitizeToken(d, 'none')}`;
export function selectEpisodes(episodes = [], causes = []) {
  const open = new Set((causes ?? []).filter(c => c?.open).map(c => causeKey(c.by, c.d)));
  const items = (episodes ?? []).map((ep, i) => ({ ep, i, pinned: open.has(causeKey(ep?.by, ep?.d)) }));
  const keep = new Set(items.filter(e => e.pinned).slice(-ME_PIN_MAX).map(e => e.i));
  const rest = items.filter(e => !keep.has(e.i));
  for (const e of rest.slice(Math.max(0, rest.length - (ME_SLOTS - keep.size)))) keep.add(e.i);
  return items.filter(e => keep.has(e.i)).map(e => e.ep);
}

// ============================================================================
// Q3. The `ms` soul line and its two scopes
// ============================================================================
// ms s=<pxd,vtx,lx,aq> arch=<mind,body,spirit> pol=<sto01,sts01> vital=<5..100> strain=<0..500> debt=<0..64>
//    doses=<0..7> hp=<0..1> chose=<up to 4 catalyst ids>   (Plan §8.2 B126, adopted in §8.6 Q3; chose= from §8.5 Rule 1)
// The range of arch= is not stated in the Plan; 0..1 is assumed here, like the other weights. Catalyst ids are capped at
// 24 characters so the never-evicted line stays bounded.
export const MS_CHOSE_MAX = 4;
export const MS_CHOSE_ID_MAX = 24;
// An empty or missing value takes the default (Number('') would otherwise read as 0).
const num = v => (v === '' || v === null || v === undefined ? NaN : Number(v));
const floats = (v, n, f) => {
  const raw = Array.isArray(v) ? v : String(v ?? '').split(',');
  return Array.from({ length: n }, (_, i) => clamp(num(raw[i]), 0, 1, f));
};
export function normalizeMs(ms = {}) {
  const rawChose = Array.isArray(ms?.chose) ? ms.chose : String(ms?.chose ?? '').split(',');
  return {
    s: floats(ms?.s, 4, 0.5),
    arch: floats(ms?.arch, 3, 0.5),
    pol: floats(ms?.pol, 2, 0),
    vital: clamp(num(ms?.vital), 5, 100, 100),
    strain: clamp(num(ms?.strain), 0, 500, 0),
    debt: Math.trunc(clamp(num(ms?.debt), 0, 64, 0)),
    doses: Math.trunc(clamp(num(ms?.doses), 0, 7, 0)),
    hp: clamp(num(ms?.hp), 0, 1, 1),
    chose: rawChose.map(c => sanitizeToken(c, '').slice(0, MS_CHOSE_ID_MAX)).filter(Boolean).slice(0, MS_CHOSE_MAX),
  };
}

export function formatMsLine(ms) {
  const m = normalizeMs(ms);
  const f = a => a.map(v => v.toFixed(2)).join(',');
  return `ms s=${f(m.s)} arch=${f(m.arch)} pol=${f(m.pol)} vital=${m.vital.toFixed(1)} strain=${m.strain.toFixed(1)} debt=${m.debt} doses=${m.doses} hp=${m.hp.toFixed(2)}`
    + (m.chose.length ? ` chose=${m.chose.join(',')}` : '');
}

// Parsing never fails, but it reports every field that was missing, malformed or out of range in `invalid`, so a caller
// can refuse a damaged line instead of accepting the defaults (which would heal strain and clear debt).
export function parseMsLine(line) {
  const kv = {};
  for (const tok of String(line ?? '').trim().split(/\s+/).slice(1)) {
    const i = tok.indexOf('=');
    if (i > 0) kv[tok.slice(0, i)] = tok.slice(i + 1);
  }
  const m = normalizeMs(kv);
  const invalid = [];
  for (const f of ['vital', 'strain', 'debt', 'doses', 'hp']) if (num(kv[f]) !== m[f]) invalid.push(f);
  for (const [f, n] of [['s', 4], ['arch', 3], ['pol', 2]]) {
    const raw = String(kv[f] ?? '').split(',');
    if (raw.length !== n || raw.some((r, i) => num(r) !== m[f][i])) invalid.push(f);
  }
  return { ...m, invalid };
}

// Session save: the whole record is kept (a deep copy of plain data), with the `ms` line normalized if present, so
// logging out heals no strain and clears no debt.
export function sessionSave(record = {}) {
  const copy = structuredClone(record);
  if (record.ms !== undefined) copy.ms = normalizeMs(record.ms);
  return copy;
}

// Values set in R38 (the owner approved Argon's proposals): birth vital 90, strain 0, hp 1 and doses 0; at rebirth the
// shell floats Lx and Aq carry, and the nucleus floats Pxd and Vtx take 80% from the new vessel's template and 20% from
// the prior soul.
export const BIRTH = Object.freeze({ vital: 90, strain: 0, hp: 1, doses: 0 });
export const VESSEL_WEIGHT = 0.8;

// Incarnation transfer: arch, pol, the unresolved-pattern flags (open `mc` lines), debt (as healing time) and chose carry;
// vital, strain, hp and doses are rebuilt at birth; s blends as above (the vessel template defaults to 0.5 throughout);
// the episode window does not carry.
// Bridge options (the D2 proposal, off by default; whether to use them and their values are owner decisions): when
// `reviewed` is true, a between-life review heals `reviewShare` (clamped to 0..1) of the carried debt, truncated like
// every debt value; each open cause adds `strainPerOpenCause` (at least 0) to the strain set at birth. Non-finite values
// have no effect. Turning them on departs from the R34 ruling (§8.6 Q3: debt carries in full, strain is rebuilt at
// birth) and is a variant of Argon's carry proposal, which B179 lists as conflicting with R34.
export function rebirthTransfer(record = {}, { vesselTemplate = [0.5, 0.5, 0.5, 0.5], vesselWeight = VESSEL_WEIGHT, birth = BIRTH,
  reviewShare = 0, reviewed = false, strainPerOpenCause = 0 } = {}) {
  const m = normalizeMs(record.ms);
  const tpl = normalizeMs({ s: vesselTemplate }).s;
  const w = clamp(vesselWeight, 0, 1, VESSEL_WEIGHT);
  const s = [w * tpl[0] + (1 - w) * m.s[0], w * tpl[1] + (1 - w) * m.s[1], m.s[2], m.s[3]];
  const born = normalizeMs({ ...birth, s });
  const causes = (record.causes ?? []).filter(c => c?.open);
  const share = reviewed === true ? clamp(reviewShare, 0, 1, 0) : 0;
  const q = Math.max(0, finiteOr(strainPerOpenCause, 0));
  const debt = share > 0 ? normalizeMs({ debt: m.debt * (1 - share) }).debt : m.debt;
  const strain = q > 0 ? normalizeMs({ strain: born.strain + q * causes.length }).strain : born.strain;
  return structuredClone({
    ms: { ...born, strain, arch: m.arch, pol: m.pol, debt, chose: m.chose },
    causes,
    episodes: [],
  });
}

// ============================================================================
// Bridge: the gateway composed across levels (proposed after R38; every option here is off unless passed)
// ============================================================================
// The fractal principle (§8.6): each level's energy comes from the level that encloses it. These functions let a draw
// take its energy from the enclosing level's store, book both sides under one tag, carry helicity on its own ledger, and
// check that every level's books close. No R38 function calls them. Nothing here is ruled: whether to use each option,
// the port type, what antidrive does, Λ, a source floor, harvest by merging and the D2 options are owner decisions,
// listed in B179 (R39).

// Helicity ledger. K changes only through these ports: relaxation keeps K (stepToroidRelaxation), so a level's change
// in K must equal what its ports booked.
export const HELICITY_PORTS = Object.freeze(['gateway', MERGE_PORT]);
export function createHelicityLedger() {
  const entries = [], total = runningSum();
  let scale = 0;
  return {
    entries,
    post(port, dK, meta = {}) {
      if (!HELICITY_PORTS.includes(port)) throw new Error(`undeclared helicity port: ${port}`);
      if (!Number.isFinite(dK)) throw new Error(`non-finite helicity entry on port ${port}`);
      entries.push({ ...meta, port, dK });
      total.add(dK);
      scale += Math.abs(dK);
    },
    total: () => total.value,
    magnitude: () => scale,
  };
}

// A balanced three-phase set: harmonic k is positive sequence when k ≡ 1 (mod 3), negative sequence when k ≡ 2, and
// zero sequence (no rotating field) when k ≡ 0.
export function threePhaseSequence(order) {
  if (!(Number.isInteger(order) && order >= 0)) throw new Error('a harmonic order must be a whole number >= 0');
  return [0, 1, -1][order % 3];
}

// The phased port, an option: with no port the factor is 1, as in R38. With { type: 'three-phase', order, phase,
// antidrive } the factor is the sequence sign times sin(phase), after oscillating-field current drive on MST, whose
// helicity injection goes as sin δ (McCollam et al., PRL 96, 035003, 2006; cited, not reproduced in this repository);
// using it for the gateway is a design. A non-finite phase
// gives 0. A negative sequence or a negative sin(phase) is antidrive (factor −|sin(phase)|), and what it does is the
// owner's decision, so the port must name it: 'close' moves nothing; 'reverse' runs the port backwards at the same rate
// law, returning energy (and helicity) from the toroid to the enclosing level, never below the toroid's Taylor floor and
// never past K = 0 (driving K through zero into the other handedness is not implemented). Because C carries the headroom
// factor (1 − W/Wmax), a reversed flow also scales with headroom: a full toroid returns nothing, an emptier one returns
// faster. The factor returned is before
// that choice. Two sign conventions here are also owner decisions: a negative sequence at a negative phase is antidrive
// (the two signs do not cancel, as their product would), and the factor is read against the toroid's own handedness
// (bridgeDraw adds helicity of the sign of K), whereas in OFCD the sign of sin δ fixes the sign of the injected helicity.
export const ANTIDRIVE = Object.freeze(['close', 'reverse']);
export function portFactor(port) {
  if (port === null || port === undefined) return 1;
  if (port.type !== 'three-phase') throw new Error(`unknown port type: ${port.type}`);
  if (!ANTIDRIVE.includes(port.antidrive)) throw new Error(`antidrive is the owner's decision: name it ('close' or 'reverse'), got ${port.antidrive}`);
  const seq = threePhaseSequence(port.order), sin = Math.sin(port.phase);
  const f = seq < 0 || sin < 0 ? -Math.abs(seq * sin) : seq * sin;
  return Number.isFinite(f) && f !== 0 ? f : 0;
}

// The split bound, from the review of the bridge proposals after R38 (its derivation, by Cauchy–Schwarz and the
// Rayleigh bound, is not yet in this repository): for an axisymmetric field with ψ = 0 on the wall, in a domain that
// contains the axis, |f_tor − ½| ≤ ½√(1 − c²), where f_tor is the toroidal share of the energy and c the coherence. A
// port that sloshes energy between the poloidal and toroidal parts at amplitude a keeps coherence c only while a is
// within the bound. A check for callers; no draw here calls it. Outside 0 ≤ c ≤ 1 the bound is 0.
export function splitAmplitudeBound(c) {
  return Number.isFinite(c) && c >= 0 && c <= 1 ? 0.5 * Math.sqrt(1 - c * c) : 0;
}
export function splitWithinBound(amplitude, c) {
  const bound = splitAmplitudeBound(c);
  return { ok: Number.isFinite(amplitude) && Number.isFinite(c) && c >= 0 && c <= 1 && Math.abs(amplitude) <= bound, bound };
}

// One gateway draw composed with the enclosing level. With no option it is drawGateway (the tests compare the two bit
// for bit). Options, none with a default value:
//   source  { name, ledger, store, hledger?, floor? }, the enclosing level. What the toroid gains is debited from
//           `store` and posted on both ledgers under one tag. The store is never drawn below its own Taylor floor (0 for
//           a store without K and λ), nor below `floor` when one is passed, nor filled past a finite Wmax.
//   lambda  Λ, energy per unit helicity. Each joule moved carries 1/Λ of helicity in the toroid's own handedness,
//           booked on `hledger` (the toroid's level) and on the source's hledger; neither side may end below its
//           Taylor floor, and the toroid's K never changes sign (a reversed flow stops at K = 0).
//   port    the phased port above. pool  as in drawGateway; a reversed flow leaves it untouched.
// Returns { toroid, store, E, dK, factor, requested, tag }: E is the energy moved into the toroid (negative when the port
// runs backwards), `requested` is E before the source and helicity caps, and `store` is the source's new store (a copy,
// like the toroid; the caller keeps it).
export function bridgeDraw(toroid, entity, params, dt, ledger, { source = null, lambda, hledger = null, port = null, pool = null } = {}) {
  if (typeof entity !== 'string' || entity.length === 0) throw new Error('a gateway draw needs a named entity');
  const factor = portFactor(port);
  const helicity = lambda !== undefined;
  if (helicity && !(Number.isFinite(lambda) && lambda > 0)) throw new Error('lambda must be a positive finite energy per unit helicity');
  if (helicity && typeof hledger?.post !== 'function') throw new Error('a helicity draw needs the helicity ledger of the toroid\'s level');
  if (source !== null) {
    if (typeof source?.name !== 'string' || source.name.length === 0) throw new Error('a source needs a name');
    if (typeof source.ledger?.post !== 'function' || !Array.isArray(source.ledger.entries)) throw new Error('a source needs its energy ledger');
    if (helicity && typeof source.hledger?.post !== 'function') throw new Error('a helicity draw needs the source\'s helicity ledger');
    if (source.floor !== undefined && !(Number.isFinite(source.floor) && source.floor >= 0)) throw new Error('a source floor must be a finite energy >= 0');
  }
  const store = source ? { ...source.store } : null;
  const none = { toroid: { ...toroid }, store, E: 0, dK: 0, factor, requested: 0, tag: null };
  if (toroid?.owner !== undefined && toroid.owner !== entity) return none;
  if (!(Number.isFinite(toroid?.W) && Number.isFinite(toroid?.Wmax) && toroid.Wmax > 0 && toroid.W >= 0)) return none;
  if (helicity && !Number.isFinite(toroid.K)) return none;
  if (source && !(Number.isFinite(store.W) && store.W >= 0)) return none;
  if (helicity && source && store.K !== undefined && !Number.isFinite(store.K)) return none;
  const { P } = gatewayPower({ ...params, toroid });
  const h = Math.max(0, finiteOr(dt, 0));
  const forward = !(factor < 0);
  let E;
  if (forward) {
    E = Math.min((port ? factor * P : P) * h, Math.max(0, toroid.Wmax - toroid.W));
    if (pool) E = Math.min(E, Math.max(0, finiteOr(pool.remaining, 0)));
  } else if (port.antidrive === 'close') E = 0;
  else E = -Math.min(-factor * P * h, Math.max(0, toroid.W - toroidFloor(toroid)));   // never below its own floor
  const requested = E;
  const sigma = helicity ? Math.sign(toroid.K) : 0;
  const Ks = helicity && source ? finiteOr(store.K, 0) : 0;
  // Every constraint is concave in e, so the moves that fit form an interval; bisection keeps the largest fraction of E
  // found to fit, or 0 when none does (as when the source already sits below its floor).
  const fits = e => {
    const dk = helicity ? sigma * e / lambda : 0;
    if (helicity && !(sigma * (toroid.K + dk) >= 0)) return false;   // K never crosses zero (binds only when reversed)
    if ((helicity || e < 0) && !(toroid.W + e >= toroidFloor({ ...toroid, K: toroid.K + dk }))) return false;
    if (!source) return true;
    const s = { ...store, W: store.W - e, ...(helicity ? { K: Ks - dk } : {}) };
    return s.W >= Math.max(toroidFloor(s), finiteOr(source.floor, 0)) && !(Number.isFinite(store.Wmax) && !(s.W <= store.Wmax));
  };
  if ((source || helicity || E < 0) && E !== 0 && !fits(E)) {
    let lo = 0, hi = 1;
    for (let k = 0; k < 64; k++) { const mid = 0.5 * (lo + hi); if (fits(mid * E)) lo = mid; else hi = mid; }
    E = lo * E;
  }
  if (Object.is(E, -0)) E = 0;
  const dK = helicity ? sigma * E / lambda : 0;
  if (pool && forward) pool.remaining -= E;
  const tag = source && E !== 0 ? `${source.name}>${entity}#${source.ledger.entries.length}` : null;
  if (E !== 0) {
    ledger.post('gateway', E, tag ? { entity, obj: toroid.id, tag } : { entity, obj: toroid.id });
    if (source) source.ledger.post('gateway', -E, { entity, obj: toroid.id, tag });
    if (helicity && dK !== 0) {
      hledger.post('gateway', dK, tag ? { entity, tag } : { entity });
      if (source) source.hledger.post('gateway', -dK, { entity, tag });
    }
  }
  return {
    toroid: { ...toroid, W: toroid.W + E, ...(helicity ? { K: toroid.K + dK } : {}) },
    store: source ? { ...store, W: store.W - E, ...(helicity ? { K: Ks - dK } : {}) } : null,
    E, dK, factor, requested, tag,
  };
}

// Harvest up (§8.6: energy flows down the levels, harvest flows up). By default it books nothing and returns a readout
// of the toroid; whether harvest moves energy is the owner's decision (B179). With `merge: true` the whole toroid (W and
// K) joins the parent's store through the merge port, booked on both sides under one tag (helicity on both sides or on
// neither). The merge is refused, and nothing booked, if the parent would end below its Taylor floor or past a finite
// Wmax. child = { name, ledger, hledger? }, parent = { name, ledger, store, hledger? }; their ledgers need the merge
// port (createEnergyLedger({ merge: true })). Without helicity ledgers K still moves with the toroid but is not booked,
// so the tower check cannot see it; pass both helicity ledgers for a booked merge.
export function harvestUp(toroid, { merge = false, child = null, parent = null } = {}) {
  const readout = { W: toroid?.W, K: toroid?.K, coherence: toroidCoherence(toroid ?? {}) };
  const out = { merged: false, toroid: { ...toroid }, store: parent?.store ? { ...parent.store } : null, readout, tag: null };
  if (merge !== true) return out;
  for (const [side, x] of [['child', child], ['parent', parent]]) {
    if (typeof x?.name !== 'string' || x.name.length === 0) throw new Error(`a merge needs the ${side}'s name`);
    if (typeof x.ledger?.post !== 'function' || !Array.isArray(x.ledger.entries)) throw new Error(`a merge needs the ${side}'s energy ledger`);
  }
  const helicity = Boolean(child.hledger) || Boolean(parent.hledger);
  if (helicity && !(typeof child.hledger?.post === 'function' && typeof parent.hledger?.post === 'function')) {
    throw new Error('a merge books helicity on both sides or on neither');
  }
  const st = parent.store ?? {};
  const Kc = toroid?.K === undefined ? 0 : toroid.K, Kp = st.K === undefined ? 0 : st.K;
  if (!(Number.isFinite(toroid?.W) && toroid.W >= 0 && Number.isFinite(Kc) && Number.isFinite(st.W) && st.W >= 0 && Number.isFinite(Kp))) {
    return { ...out, refused: 'damaged toroid or store' };
  }
  const after = { ...st, W: st.W + toroid.W, K: Kp + Kc };
  if (!(after.W >= toroidFloor(after)) || (Number.isFinite(st.Wmax) && !(after.W <= st.Wmax))) {
    return { ...out, refused: 'the parent would end below its Taylor floor or past its Wmax' };
  }
  const tag = `merge:${child.name}>${parent.name}#${parent.ledger.entries.length}`;
  if (toroid.W !== 0) {
    parent.ledger.post(MERGE_PORT, toroid.W, { obj: toroid.id, tag });
    child.ledger.post(MERGE_PORT, -toroid.W, { obj: toroid.id, tag });
  }
  if (helicity && Kc !== 0) {
    parent.hledger.post(MERGE_PORT, Kc, { obj: toroid.id, tag });
    child.hledger.post(MERGE_PORT, -Kc, { obj: toroid.id, tag });
  }
  return { merged: true, toroid: { ...toroid, W: 0, K: 0 }, store: after, readout, tag };
}

// Tower check: every level's books close (energy, and helicity where the level keeps a helicity ledger), and every
// tagged gateway or merge entry has exactly one partner: the opposite value, same port and tag, on its parent or child.
// An untagged gateway entry is allowed only on a root (the tower's own inflow); stellar and ambient stay declared
// inflows and are not paired. levels = [{ name, parent (a level's name, or null for a root), stored0, stored1, ledger,
// K0?, K1?, hledger? }]. Returns { ok, problems }.
export function towerCheck(levels, { tol = 1e-12 } = {}) {
  const problems = [];
  const byName = new Map();
  for (const l of levels ?? []) {
    if (typeof l?.name !== 'string' || byName.has(l.name)) problems.push(`level name missing or repeated: ${l?.name}`);
    else byName.set(l.name, l);
  }
  for (const l of byName.values()) {
    if (l.parent !== null && !byName.has(l.parent)) problems.push(`${l.name}: parent must be a level in the tower or null, got ${l.parent}`);
    let p = l.parent, n = 0;
    while (p !== null && byName.has(p) && n <= byName.size) { p = byName.get(p).parent; n++; }
    if (n > byName.size) problems.push(`${l.name}: the parent chain has a cycle`);
    if (typeof l.ledger?.inflow !== 'function') { problems.push(`${l.name}: no energy ledger`); continue; }
    const c = ledgerCloses({ stored0: l.stored0, stored1: l.stored1, ledger: l.ledger, tol });
    if (!c.ok) problems.push(`${l.name}: energy books do not close (residual ${c.residual})`);
    if (l.hledger) {
      const r = (l.K1 - l.K0) - l.hledger.total();
      const scale = Math.max(1, Math.abs(l.K0), Math.abs(l.K1), l.hledger.magnitude());
      if (!(Math.abs(r) <= tol * scale)) problems.push(`${l.name}: helicity books do not close (residual ${r})`);
    }
  }
  const pair = (booksOf, valueOf, what) => {
    const tags = new Map();
    for (const l of byName.values()) {
      for (const e of booksOf(l)?.entries ?? []) {
        if (e.port !== 'gateway' && e.port !== MERGE_PORT) continue;
        if (e.tag === undefined) {
          if (e.port === MERGE_PORT || l.parent !== null) problems.push(`${l.name}: untagged ${what} entry on port ${e.port}`);
          continue;
        }
        if (!tags.has(e.tag)) tags.set(e.tag, []);
        tags.get(e.tag).push({ l, e });
      }
    }
    for (const [tag, list] of tags) {
      const [a, b] = list;
      const linked = list.length === 2 && a.e.port === b.e.port && (a.l.parent === b.l.name || b.l.parent === a.l.name);
      if (!linked || valueOf(a.e) !== -valueOf(b.e)) problems.push(`${what} tag ${tag}: not one opposite pair on a parent and its child`);
    }
  };
  pair(l => l.ledger, e => e.joules, 'energy');
  pair(l => l.hledger, e => e.dK, 'helicity');
  return { ok: problems.length === 0, problems };
}
