#!/usr/bin/env node
/**
 * Tests for scripts/wave0_reference.mjs (`B178`), based on the physics brief's invariants T1–T6
 * (bench/2026-10-31-wave0/vortex_hypothesis.md §5.4) and the §8.6 memory and soul-line rules.
 * T6 checks the stored model results (taylor_relax_results.json), not a fresh run; T2 does not cover merges.
 * Usage: node scripts/wave0_reference_test.mjs   (exit code 1 on any failure)
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEnergyLedger, ledgerCloses, checkPreconditions, stepPortHamiltonian, postStep, toroidFloor, toroidCoherence,
  stepToroidRelaxation, gatewayPower, drawGateway, selectEpisodes, ME_SLOTS, ME_PIN_MAX,
  normalizeMs, formatMsLine, parseMsLine, sessionSave, rebirthTransfer, GATE, P_LOCAL_BY_STAGE, BIRTH,
} from './wave0_reference.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
function test(id, why, fn) {
  try { fn(); results.push({ id, ok: true, why }); }
  catch (e) { results.push({ id, ok: false, why, error: e.message }); }
}
const near = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ---- Systems used below ----
const pendulum = {
  H: x => 0.5 * x[1] ** 2 + (1 - Math.cos(x[0])),
  gradH: x => [Math.sin(x[0]), x[1]],
  J: [[0, 1], [-1, 0]],
  R: [[0, 0], [0, 0]],
};
// Three states, a mass matrix, a quartic term, damping on two states and one declared input port.
const M = [[2, 0.3, 0], [0.3, 1, 0.1], [0, 0.1, 1.5]];
const driven = {
  H: x => 0.5 * x.reduce((s, xi, i) => s + xi * M[i].reduce((t, m, j) => t + m * x[j], 0), 0) + 0.25 * x[0] ** 4,
  gradH: x => M.map((row, i) => row.reduce((t, m, j) => t + m * x[j], 0) + (i === 0 ? x[0] ** 3 : 0)),
  J: [[0, 1, -0.5], [-1, 0, 0.7], [0.5, -0.7, 0]],
  R: [[0.2, 0, 0], [0, 0, 0], [0, 0, 0.1]],
  G: [[0], [1], [0]],
  ports: ['stellar'],
};

test('T1 closed system', 'no ports and no dissipation: energy drift below 1e-12 relative over 2000 steps of a non-quadratic system', () => {
  let x = [2.5, 0];
  const H0 = pendulum.H(x);
  for (let k = 0; k < 2000; k++) x = stepPortHamiltonian(x, { ...pendulum, dt: 0.1 }).x;
  const drift = Math.abs(pendulum.H(x) - H0) / H0;
  assert.ok(drift < 1e-12, `relative drift ${drift}`);
});

test('T1b energy identity with ports', 'every step: H(x\') − H(x) = supplied − dissipated, and the ledger closes over the run', () => {
  let x = [0.8, -0.4, 0.3];
  const ledger = createEnergyLedger();
  const stored0 = driven.H(x);
  for (let k = 0; k < 500; k++) {
    const s = stepPortHamiltonian(x, { ...driven, u: [0.3 * Math.sin(0.05 * k)], dt: 0.05 });
    const residual = (s.H1 - s.H0) - (s.supplied.reduce((a, p) => a + p.joules, 0) - s.dissipated);
    assert.ok(Math.abs(residual) <= 1e-12 * Math.max(1, Math.abs(s.H0)), `step ${k} residual ${residual}`);
    assert.ok(s.dissipated >= 0, 'dissipation is never negative');
    postStep(ledger, s, { step: k });
    x = s.x;
  }
  const close = ledgerCloses({ stored0, stored1: driven.H(x), ledger, tol: 1e-11 });
  assert.ok(close.ok, `ledger residual ${close.residual}`);
});

test('T1c robustness', 'long damped and offset runs do not stall the solver (the reviewer\'s failing cases), and energy only falls without ports', () => {
  const damped = { ...pendulum, R: [[0, 0], [0, 0.5]] };
  let x = [2.5, 0], H = damped.H(x);
  for (let k = 0; k < 20000; k++) {
    x = stepPortHamiltonian(x, { ...damped, dt: 0.1 }).x;
    const H1 = damped.H(x);
    assert.ok(H1 <= H + 1e-12, `energy rose at step ${k}`);
    H = H1;
  }
  const offset = { ...damped, H: y => 1000 + damped.H(y) };
  let y = [2.5, 0];
  for (let k = 0; k < 2000; k++) y = stepPortHamiltonian(y, { ...offset, dt: 1e-3 }).x;
});

test('T1d accuracy order', 'the step is second-order accurate on a non-quadratic system (halving dt cuts the error about fourfold)', () => {
  const run = (dt, T) => { let x = [1.2, 0]; for (let k = 0; k < Math.round(T / dt); k++) x = stepPortHamiltonian(x, { ...pendulum, dt }).x; return x; };
  const ref = run(0.002, 2), e1 = run(0.1, 2), e2 = run(0.05, 2);
  const err = x => Math.hypot(x[0] - ref[0], x[1] - ref[1]);
  const ratio = err(e1) / err(e2);
  assert.ok(ratio > 3.5 && ratio < 4.5, `error ratio ${ratio}`);
});

test('T1e preconditions', 'J skew, R symmetric positive semidefinite at any scale, finite and the right size; the step refuses invalid dt, states, systems and non-converging solves', () => {
  assert.deepEqual(checkPreconditions(driven.J, driven.R), []);
  assert.ok(checkPreconditions([[0, 1], [1, 0]], [[0, 0], [0, 0]]).some(e => e.includes('skew')));
  assert.ok(checkPreconditions(pendulum.J, [[1, 2], [2, 1]]).some(e => e.includes('semidefinite')));
  assert.ok(checkPreconditions(pendulum.J, [[NaN, 0], [0, 0]]).some(e => e.includes('finite')));
  assert.ok(checkPreconditions(pendulum.J, [[0]]).some(e => e.includes('square')));
  let seed = 11;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 - 0.5; };
  const zero12 = Array.from({ length: 12 }, () => new Array(12).fill(0));
  for (let trial = 0; trial < 40; trial++) {   // rank 4, entries around 1e4 (the reviewer's false-rejection case)
    const B = Array.from({ length: 4 }, () => Array.from({ length: 12 }, () => 200 * rnd()));
    const Rbig = zero12.map((_, i) => zero12.map((__, j) => B.reduce((s, row) => s + row[i] * row[j], 0)));
    assert.deepEqual(checkPreconditions(zero12, Rbig), [], `rank-deficient PSD at large scale, trial ${trial}`);
  }
  for (const dt of [0, -0.1, NaN]) assert.throws(() => stepPortHamiltonian([1, 0], { ...pendulum, dt }), /dt must be/);
  assert.throws(() => stepPortHamiltonian([NaN, 0], { ...pendulum, dt: 0.1 }), /finite/);
  assert.throws(() => stepPortHamiltonian([1, 0], { ...pendulum, R: [[-0.5, 0], [0, -0.5]], dt: 0.1 }), /semidefinite/);
  assert.throws(() => stepPortHamiltonian([1, 0], { ...pendulum, ports: ['stellar'], dt: 0.1 }), /input matrix/);
  assert.throws(() => stepPortHamiltonian([2.5, 0], { ...pendulum, dt: 50, maxIter: 50 }), /did not converge/);
});

test('T1f two ports', 'each input column is reported against its own declared port, and the identity holds with both', () => {
  const two = { ...driven, G: [[0, 0.5], [1, 0], [0, 1]], ports: ['stellar', 'ambient'] };
  const s = stepPortHamiltonian([0.8, -0.4, 0.3], { ...two, u: [0.3, -0.2], dt: 0.05 });
  assert.deepEqual(s.supplied.map(p => p.port), ['stellar', 'ambient']);
  assert.ok(s.supplied.every(p => p.joules !== 0));
  const residual = (s.H1 - s.H0) - (s.supplied[0].joules + s.supplied[1].joules - s.dissipated);
  assert.ok(Math.abs(residual) <= 1e-12 * Math.max(1, Math.abs(s.H0)), `residual ${residual}`);
});

const toroid0 = { id: 'tor-1', W: 10, K: 2, lambdaGeom: 4.955, kappa: 0.5, Wmax: 50 };

test('T2 relaxation', 'W never rises, never drops below the Taylor floor, K is unchanged, every lost joule is in the thermal sink, and the first step loses exactly kappa · free · dt', () => {
  const ledger = createEnergyLedger();
  const first = stepToroidRelaxation({ ...toroid0 }, 0.1, createEnergyLedger());
  assert.ok(near(first.W, 10 - 0.5 * (10 - 4.955) * 0.1), `first step W = ${first.W}`);
  let t = { ...toroid0 };
  const floor = toroidFloor(t);
  for (let k = 0; k < 200; k++) {
    const next = stepToroidRelaxation(t, 0.1, ledger);
    assert.ok(next.W <= t.W && next.W >= floor - 1e-12 && next.K === t.K, `step ${k}`);
    t = next;
  }
  assert.ok(Math.abs(toroid0.W - t.W - ledger.thermal()) <= 1e-12, 'thermal credit exact');
});

const gate = { setLevel: 0.6, gateWidth: 0.1, pLocal: 2.0 };

test('T3 gate closed', 'at or below the set balance level, on non-finite input, or with a gate width that is not positive, the gateway power is exactly 0', () => {
  for (const balance of [-1, 0, 0.3, 0.5999999, 0.6, NaN, -Infinity, undefined]) {
    assert.ok(Object.is(gatewayPower({ ...gate, balance, toroid: toroid0 }).P, 0), `balance ${balance}`);
  }
  for (const gateWidth of [0, -0.1, NaN]) assert.ok(Object.is(gatewayPower({ ...gate, gateWidth, balance: 0.9, toroid: toroid0 }).P, 0), `width ${gateWidth}`);
  assert.ok(Object.is(gatewayPower({ ...gate, balance: 0.9, toroid: { ...toroid0, W: 50 } }).P, 0), 'no headroom, no draw');
  assert.ok(Object.is(gatewayPower({ ...gate, balance: 0.9, toroid: { ...toroid0, K: 0 } }).P, 0), 'no coherence, no draw');
  assert.ok(Object.is(gatewayPower({ ...gate, balance: 0.9, toroid: toroid0, pLocal: NaN }).P, 0), 'no supply, no draw');
});

test('T3b gate shape and power', 'G follows smoothstep across the gate width, and P = G · (W_min/W) · (1 − W/W_max) · P_local exactly', () => {
  assert.ok(near(gatewayPower({ ...gate, balance: 0.625, toroid: toroid0 }).G, 0.15625), 'smoothstep at a quarter of the width');
  assert.ok(near(gatewayPower({ ...gate, balance: 0.65, toroid: toroid0 }).G, 0.5));
  assert.equal(gatewayPower({ ...gate, balance: 0.75, toroid: toroid0 }).G, 1);
  const c = (4.955 / 10) * (1 - 10 / 50);
  assert.ok(near(toroidCoherence(toroid0), 0.4955));
  const r = gatewayPower({ ...gate, balance: 0.9, toroid: toroid0 });
  assert.ok(near(r.C, c) && near(r.P, c * 2), `C ${r.C}, P ${r.P}`);
});

test('R38 gate values', 'the approved values: closed at or below 0.81, half open at 0.855, fully open from 0.90; P_local = 9 · 3^k by stage', () => {
  assert.deepEqual(GATE, { setLevel: 0.81, gateWidth: 0.09 });
  assert.ok(Object.is(gatewayPower({ balance: 0.81, toroid: toroid0, stage: 'S3' }).P, 0));
  assert.ok(Math.abs(gatewayPower({ balance: 0.855, toroid: toroid0, stage: 'S3' }).G - 0.5) < 1e-9);
  assert.equal(gatewayPower({ balance: 0.9, toroid: toroid0, stage: 'S3' }).G, 1);
  assert.deepEqual(Object.values(P_LOCAL_BY_STAGE), [9, 27, 81, 243, 729, 2187, 6561, 19683]);
  const atS6 = gatewayPower({ balance: 0.95, toroid: toroid0, stage: 'S6' });
  assert.ok(near(atS6.P, atS6.C * 19683), 'stage supplies P_local');
  assert.ok(Object.is(gatewayPower({ balance: 0.95, toroid: toroid0, stage: 'S9' }).P, 0), 'unknown stage, no supply');
});

test('T4 gate open', 'with draws and relaxation together, the change in stored energy plus heat equals the gateway ledger, all of it logged against the entity', () => {
  const ledger = createEnergyLedger();
  let t = { ...toroid0 };
  for (let k = 0; k < 300; k++) {
    t = drawGateway(t, 'entity:7', { ...gate, balance: 0.72 }, 0.1, ledger);
    assert.ok(t.W <= t.Wmax + 1e-12, 'never overfills');
    t = stepToroidRelaxation(t, 0.1, ledger);
  }
  assert.ok(ledger.inflow() > 0, 'the open gate did draw');
  const close = ledgerCloses({ stored0: toroid0.W, stored1: t.W, ledger });
  assert.ok(close.ok, `residual ${close.residual}`);
  assert.ok(Math.abs(ledger.drawnBy('entity:7') - ledger.inflow()) <= 1e-12);
});

test('T4b draw guards', 'a draw needs a named entity and its own toroid, never overfills even with a huge step, does nothing on a damaged toroid, and a shared pool caps all draws together', () => {
  const ledger = createEnergyLedger();
  assert.throws(() => drawGateway({ ...toroid0 }, '', { ...gate, balance: 0.9 }, 0.1, ledger), /named entity/);
  const huge = drawGateway({ ...toroid0, W: 49 }, 'e', { ...gate, balance: 0.9 }, 1e6, ledger);
  assert.ok(huge.W <= huge.Wmax, `W ${huge.W}`);
  for (const bad of [{ Wmax: undefined }, { W: NaN }, { Wmax: 0 }, { W: -1 }]) {
    const before = ledger.entries.length;
    const out = drawGateway({ ...toroid0, ...bad }, 'e', { ...gate, balance: 0.9 }, 0.1, ledger);
    assert.equal(ledger.entries.length, before, `no entry for ${JSON.stringify(bad)}`);
    assert.ok(Object.is(out.W, ({ ...toroid0, ...bad }).W), `W unchanged for ${JSON.stringify(bad)}, got ${out.W}`);
  }
  const owned = { ...toroid0, owner: 'entity:a' };
  assert.equal(drawGateway(owned, 'entity:b', { ...gate, balance: 0.9 }, 0.1, ledger).W, owned.W, 'not the entity\'s toroid');
  const pool = { remaining: 0.05 };
  const l2 = createEnergyLedger();
  drawGateway({ ...toroid0 }, 'e1', { ...gate, balance: 0.9 }, 0.1, l2, pool);
  drawGateway({ ...toroid0 }, 'e2', { ...gate, balance: 0.9 }, 0.1, l2, pool);
  assert.ok(l2.inflow() <= 0.05 + 1e-15 && pool.remaining >= -1e-15, `pooled draws ${l2.inflow()}`);
});

test('T5 free-energy detector', 'energy that appears without a ledger entry fails the balance; undeclared ports, negative heat, non-finite entries and metadata posing as a port are refused', () => {
  const ledger = createEnergyLedger();
  const t = stepToroidRelaxation({ ...toroid0 }, 0.1, ledger);
  assert.equal(ledgerCloses({ stored0: toroid0.W, stored1: t.W, ledger }).ok, true);
  assert.equal(ledgerCloses({ stored0: toroid0.W, stored1: t.W + 1, ledger }).ok, false);
  assert.throws(() => ledger.post('zero-point', 1), /undeclared/);
  assert.throws(() => ledger.post('gateway', NaN), /non-finite/);
  assert.throws(() => ledger.post('thermal', -5), /only receives/);
  ledger.post('gateway', 5, { port: 'zero-point', joules: -5, entity: 'e' });
  const last = ledger.entries.at(-1);
  assert.deepEqual([last.port, last.joules], ['gateway', 5]);
  ledger.post('ambient', 1);
  assert.ok(near(ledger.inflow(), 6));
});

test('T5b long ledger', 'after 300,000 correct entries the ledger still closes (compensated sums, tolerance scaled to what passed through)', () => {
  const ledger = createEnergyLedger();
  for (let k = 0; k < 100000; k++) { ledger.post('gateway', 0.3, { entity: 'e' }); for (let j = 0; j < 2; j++) ledger.post('thermal', 0.15); }
  assert.ok(ledgerCloses({ stored0: 1, stored1: 1, ledger }).ok, `residual ${ledgerCloses({ stored0: 1, stored1: 1, ledger }).residual}`);
  const big = createEnergyLedger();   // a large flow through a small store: rounding scales with the flow, not the store
  big.post('gateway', 1e6 + 0.1, { entity: 'e' });
  big.post('thermal', 1e6 - 0.2);
  const r = ledgerCloses({ stored0: 0.1, stored1: 0.4, ledger: big });
  assert.ok(Math.abs(r.residual) > 1e-12, 'this case does round (about 1e-10)');
  assert.ok(r.ok, `residual ${r.residual}`);
});

test('T6 model regression (data check)', 'the stored model results: release fractions within 2 points of 1 − (λ1/λ2)(1 − b)/(1 + b), and all random starts within 0.2% in λ_eff', () => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'bench', '2026-10-31-wave0', 'code', 'taylor_relax_results.json'), 'utf8'));
  const c3 = j.cases.filter(c => Number.isFinite(c.b));
  assert.equal(c3.length, 5);
  for (const c of c3) {
    const predicted = 1 - (j.lam1_analytic / j.lam2_analytic) * (1 - c.b) / (1 + c.b);
    assert.ok(Math.abs(c.released - predicted) <= 0.02, `b = ${c.b}: ${c.released} vs ${predicted}`);
  }
  const lam = j.cases.filter(c => c.label.startsWith('C4')).map(c => c.lamEff);
  assert.equal(lam.length, 8);
  assert.ok((Math.max(...lam) - Math.min(...lam)) / Math.min(...lam) <= 0.002);
});

const ep = (t, by = 'x', d = 'y') => ({ t, by, d, st: 'S3', cat: 'none', ex: 0.5 });

test('Q2 pinning', 'an unresolved episode outlives the 32-slot window; closing its cause releases it; order is kept', () => {
  const eps = Array.from({ length: 40 }, (_, t) => (t < 3 ? ep(t, 'heart', 'pride') : ep(t)));
  const open = [{ by: 'heart', d: 'pride', open: true }];
  assert.deepEqual(selectEpisodes(eps, open).map(e => e.t), [0, 1, 2, ...Array.from({ length: 29 }, (_, i) => 11 + i)]);
  assert.deepEqual(selectEpisodes(eps, [{ ...open[0], open: false }]).map(e => e.t), Array.from({ length: 32 }, (_, i) => 8 + i));
  assert.deepEqual(selectEpisodes(eps, []).map(e => e.t), eps.slice(-32).map(e => e.t));
});

test('Q2 pin limit', `at most ${ME_PIN_MAX} pinned (the most recent); the window never exceeds ${ME_SLOTS}`, () => {
  const eps = Array.from({ length: 40 }, (_, t) => (t < 20 ? ep(t, 'heart', 'pride') : ep(t)));
  const kept = selectEpisodes(eps, [{ by: 'heart', d: 'pride', open: true }]).map(e => e.t);
  assert.deepEqual(kept, [...Array.from({ length: 16 }, (_, i) => 4 + i), ...Array.from({ length: 16 }, (_, i) => 24 + i)]);
  assert.equal(selectEpisodes(Array.from({ length: 100 }, (_, t) => ep(t, 'a', 'b')), [{ by: 'a', d: 'b', open: true }]).length, ME_SLOTS);
});

test('Q2 pin matching', 'both by and d must match (as sanitized tokens); pinned episodes keep their place in time', () => {
  const eps = Array.from({ length: 40 }, (_, t) => ep(t));
  eps[1] = ep(1, 'heart', 'pride'); eps[2] = ep(2, 'heart', 'other'); eps[3] = ep(3, 'other', 'pride'); eps[30] = ep(30, 'heart', 'pride');
  const kept = selectEpisodes(eps, [{ by: 'heart', d: 'pride', open: true }]).map(e => e.t);
  assert.ok(kept.includes(1) && kept.includes(30) && !kept.includes(2) && !kept.includes(3), `kept ${kept.slice(0, 4)}`);
  assert.deepEqual(kept, [...kept].sort((a, b) => a - b), 'chronological order, with a recent pinned episode among older kept ones');
  const spaced = Array.from({ length: 40 }, (_, t) => (t < 3 ? ep(t, 'heart-humility', 'pride') : ep(t)));
  assert.deepEqual(selectEpisodes(spaced, [{ by: 'heart humility', d: 'pride', open: true }]).slice(0, 3).map(e => e.t), [0, 1, 2], 'raw and sanitized keys agree');
});

test('Q3 ms line', 'the soul line formats to a known string, round-trips, clamps both ends of every range and keeps at most 4 short catalyst ids', () => {
  const ms = { s: [0.1, 0.9, 0.4, 0.6], arch: [0.7, 0.2, 0.9], pol: [0.8, 0.05], vital: 63.5, strain: 120, debt: 9, doses: 3, hp: 0.75, chose: ['cat:grief', 'cat:betrayal'] };
  const line = formatMsLine(ms);
  assert.equal(line, 'ms s=0.10,0.90,0.40,0.60 arch=0.70,0.20,0.90 pol=0.80,0.05 vital=63.5 strain=120.0 debt=9 doses=3 hp=0.75 chose=cat:grief,cat:betrayal');
  assert.equal(formatMsLine(parseMsLine(line)), line);
  assert.deepEqual(parseMsLine(line).invalid, []);
  const hi = normalizeMs({ vital: 500, strain: 900, debt: 99, doses: 12, hp: 2, s: [7, NaN], chose: ['a', 'b c', 'd!', 'e', 'f', 'g'] });
  assert.deepEqual([hi.vital, hi.strain, hi.debt, hi.doses, hi.hp], [100, 500, 64, 7, 1]);
  const lo = normalizeMs({ vital: 1, strain: -4, debt: -3, doses: -3, hp: -2, s: [-1, -1, -1, -1], debt2: 0 });
  assert.deepEqual([lo.vital, lo.strain, lo.debt, lo.doses, lo.hp, lo.s[0]], [5, 0, 0, 0, 0, 0]);
  assert.equal(normalizeMs({ debt: 9.9, doses: 3.9 }).debt, 9, 'debt truncates');
  assert.deepEqual(hi.s, [1, 0.5, 0.5, 0.5]);
  assert.deepEqual(hi.chose, ['a', 'b-c', 'd', 'e']);
  assert.deepEqual(normalizeMs({}).s, [0.5, 0.5, 0.5, 0.5], 'a missing field takes the default, not 0');
  assert.ok(!formatMsLine({}).includes('chose='), 'no empty chose field');
  const long = formatMsLine({ chose: Array.from({ length: 4 }, (_, i) => `cat:${'x'.repeat(100)}${i}`) });
  assert.ok(Buffer.byteLength(long) <= 220, `${Buffer.byteLength(long)} bytes with maximal ids`);
});

test('Q3 damaged line', 'a missing, malformed or out-of-range field is reported, so a caller can refuse defaults that would heal strain or clear debt', () => {
  const p = parseMsLine('ms s=0.1,0.2 vital= strain=abc debt=9.5 hp=0.5 arch=0.5,0.5,0.5 pol=0,0 doses=200');
  assert.deepEqual([...p.invalid].sort(), ['debt', 'doses', 's', 'strain', 'vital']);
  assert.equal(p.vital, 100, 'the default still applies, but it is reported');
});

const record = {
  of: 'preset:test', hard: 0.4, bodies: [{ z: '1:L' }],
  ms: { s: [0.1, 0.9, 0.4, 0.6], arch: [0.7, 0.2, 0.9], pol: [0.8, 0.05], vital: 12, strain: 310, debt: 9, doses: 3, hp: 0.4, chose: ['cat:grief'] },
  episodes: [ep(1), ep(2, 'heart', 'pride')],
  causes: [{ by: 'heart', d: 'pride', n: 3, open: true }, { by: 'x', d: 'y', n: 1, open: false }],
};

test('Q3 session scope', 'a session save keeps the whole record as a deep copy, so logging out heals no strain and clears no debt', () => {
  const saved = sessionSave(record);
  assert.deepEqual(saved.ms, normalizeMs(record.ms));
  assert.deepEqual([saved.of, saved.hard, saved.bodies], [record.of, record.hard, record.bodies]);
  assert.equal(saved.episodes.length, 2);
  assert.equal(saved.causes.length, 2);
  saved.ms.arch[0] = 0; saved.episodes[0].t = 99; saved.causes[0].open = false;
  assert.deepEqual([record.ms.arch[0], record.episodes[0].t, record.causes[0].open], [0.7, 1, true], 'a deep copy');
  assert.equal(sessionSave({ of: 'x' }).ms, undefined, 'no soul line is invented');
});

test('Q3 rebirth scope', 'rebirth carries arch, pol, open causes, debt and chose; vital 90, strain 0, hp 1 and doses 0 at birth; Lx and Aq carry, Pxd and Vtx blend 80% vessel / 20% soul; no episode window', () => {
  const born = rebirthTransfer(record);
  assert.deepEqual([born.ms.arch, born.ms.pol, born.ms.debt, born.ms.chose], [[0.7, 0.2, 0.9], [0.8, 0.05], 9, ['cat:grief']]);
  assert.deepEqual([born.ms.vital, born.ms.strain, born.ms.hp, born.ms.doses], [BIRTH.vital, 0, 1, 0]);
  assert.equal(BIRTH.vital, 90);
  assert.deepEqual(born.causes.map(c => c.by), ['heart']);
  assert.equal(born.episodes.length, 0);
  const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-12);
  assert.ok(close(born.ms.s, [0.8 * 0.5 + 0.2 * 0.1, 0.8 * 0.5 + 0.2 * 0.9, 0.4, 0.6]), `s = ${born.ms.s}`);
  const vessel = rebirthTransfer(record, { vesselTemplate: [1, 0, 0.2, 0.2] });
  assert.ok(close(vessel.ms.s, [0.8 + 0.02, 0.18, 0.4, 0.6]), 'only Pxd and Vtx take from the vessel');
  assert.equal(rebirthTransfer(record, { birth: { vital: 50, strain: 7, hp: 0.9, doses: 1 } }).ms.vital, 50, 'birth values are a parameter');
});

const failed = results.filter(r => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}\n        ${r.why}${r.ok ? '' : `\n        ${r.error}`}`);
console.log(`\n${results.length - failed.length}/${results.length} Wave 0 reference tests pass`);
if (failed.length) process.exitCode = 1;
