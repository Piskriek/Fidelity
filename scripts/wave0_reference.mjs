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

export function createEnergyLedger() {
  const entries = [];
  const inflow = runningSum(), thermal = runningSum(), drawn = new Map();
  let scale = 0;
  return {
    entries,
    post(port, joules, meta = {}) {
      if (port !== THERMAL && !INFLOW_PORTS.includes(port)) throw new Error(`undeclared energy port: ${port}`);
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
export function rebirthTransfer(record = {}, { vesselTemplate = [0.5, 0.5, 0.5, 0.5], vesselWeight = VESSEL_WEIGHT, birth = BIRTH } = {}) {
  const m = normalizeMs(record.ms);
  const tpl = normalizeMs({ s: vesselTemplate }).s;
  const w = clamp(vesselWeight, 0, 1, VESSEL_WEIGHT);
  const s = [w * tpl[0] + (1 - w) * m.s[0], w * tpl[1] + (1 - w) * m.s[1], m.s[2], m.s[3]];
  const born = normalizeMs({ ...birth, s });
  return structuredClone({
    ms: { ...born, arch: m.arch, pol: m.pol, debt: m.debt, chose: m.chose },
    causes: (record.causes ?? []).filter(c => c?.open),
    episodes: [],
  });
}
