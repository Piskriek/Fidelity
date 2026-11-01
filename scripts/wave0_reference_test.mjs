#!/usr/bin/env node
/**
 * Tests for scripts/wave0_reference.mjs (`B178`), based on the physics brief's invariants T1–T6
 * (bench/2026-10-31-wave0/vortex_hypothesis.md §5.4) and the §8.6 memory and soul-line rules.
 * T6 checks the stored model results (taylor_relax_results.json), not a fresh run; T2 does not cover merges.
 * The "Bridge" tests cover the bridge section: its default path against a frozen copy of the R38 module, and each option
 * run through the real functions.
 * Usage: node scripts/wave0_reference_test.mjs   (exit code 1 on any failure)
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEnergyLedger, ledgerCloses, checkPreconditions, stepPortHamiltonian, postStep, toroidFloor, toroidCoherence,
  stepToroidRelaxation, gatewayPower, drawGateway, selectEpisodes, ME_SLOTS, ME_PIN_MAX,
  normalizeMs, formatMsLine, parseMsLine, sessionSave, rebirthTransfer, GATE, P_LOCAL_BY_STAGE, BIRTH,
} from './wave0_reference.mjs';
import * as wave0 from './wave0_reference.mjs';
import * as r38 from './fixtures/wave0_reference_r38.mjs';
// Bridge names are read from the namespace, so this file still loads against the R38 module (to record its digest).
const {
  bridgeDraw, towerCheck, harvestUp, createHelicityLedger, threePhaseSequence, portFactor, splitAmplitudeBound,
  splitWithinBound, ANTIDRIVE,
} = wave0;

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

// ============================================================================
// Bridge (the section at the end of wave0_reference.mjs)
// ============================================================================
// Canonical text of a value, every number as its float64 bit pattern (NaN as one token), so equal text means equal bits.
function canon(v) {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    const b = new DataView(new ArrayBuffer(8));
    b.setFloat64(0, v);
    return `n${b.getBigUint64(0).toString(16)}`;
  }
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).map(k => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  return v === undefined ? 'u' : JSON.stringify(v);
}

// The default path: the R38 functions over a fixed grid of inputs (arithmetic and square roots only, so the bits do not
// depend on the platform's sin or pow). A thrown error is recorded by its type, not its message (V8 wording varies).
const Mq = [[2, 0.3, 0], [0.3, 1, 0.1], [0, 0.1, 1.5]];
const drivenMul = {
  ...driven,
  H: x => 0.5 * x.reduce((s, xi, i) => s + xi * Mq[i].reduce((t, m, j) => t + m * x[j], 0), 0) + 0.25 * x[0] * x[0] * x[0] * x[0],
  gradH: x => Mq.map((row, i) => row.reduce((t, m, j) => t + m * x[j], 0) + (i === 0 ? x[0] * x[0] * x[0] : 0)),
};
function defaultPathRuns(W) {
  const out = [];
  const run = f => { try { return f(); } catch (e) { return `throws ${e.constructor.name}`; } };
  const toroids = [toroid0, { ...toroid0, W: 0 }, { ...toroid0, W: 50 }, { ...toroid0, K: 0 }, { ...toroid0, K: -3, W: 30 },
    { ...toroid0, Wmax: undefined }, { ...toroid0, lambdaGeom: NaN }, { ...toroid0, W: 2 }];
  const balances = [-1, 0, 0.5, 0.6, 0.62, 0.81, 0.8100001, 0.83, 0.855, 0.89, 0.9, 1, NaN, undefined, Infinity];
  const supplies = [{ pLocal: 2 }, { stage: 'S3' }, { stage: 'S0a' }, { stage: 'S9' }, { pLocal: NaN }, { pLocal: -1 }, {}];
  const gates = [{}, { setLevel: 0.6, gateWidth: 0.1 }, { gateWidth: 0 }, { setLevel: NaN }];
  for (const t of toroids) for (const balance of balances) for (const s of supplies) for (const g of gates) {
    out.push(run(() => W.gatewayPower({ ...g, ...s, balance, toroid: t })));
  }
  for (const t of toroids) for (const balance of [0.62, 0.72, 0.85, 0.95, NaN]) for (const usePool of [false, true]) {
    const ledger = W.createEnergyLedger();
    const pool = usePool ? { remaining: 0.3 } : null;
    let x = { ...t };
    for (let k = 0; k < 20; k++) {
      x = W.drawGateway(x, 'entity:7', { ...gate, balance }, 0.1, ledger, pool);
      x = W.stepToroidRelaxation(x, 0.1, ledger);
    }
    out.push([x, ledger.entries, ledger.inflow(), ledger.thermal(), ledger.drawnBy('entity:7'), pool, W.ledgerCloses({ stored0: t.W, stored1: x.W, ledger })]);
  }
  for (const dt of [0, -1, NaN, 1e6, 0.05]) {
    const l = W.createEnergyLedger();
    out.push([run(() => W.drawGateway({ ...toroid0, W: 49 }, 'e', { ...gate, balance: 0.9, stage: 'S2', pLocal: undefined }, dt, l)), l.entries]);
  }
  out.push(run(() => W.drawGateway({ ...toroid0, owner: 'a' }, 'b', { ...gate, balance: 0.9 }, 0.1, W.createEnergyLedger())));
  out.push(run(() => W.drawGateway({ ...toroid0 }, '', { ...gate, balance: 0.9 }, 0.1, W.createEnergyLedger())));
  for (const l of [W.createEnergyLedger(), W.createEnergyLedger(null)]) {
    for (const [port, j] of [['stellar', 1.5], ['ambient', -0.25], ['gateway', 2], ['thermal', 0.75], ['merge', 1], ['zero-point', 1], ['thermal', -1], ['gateway', NaN]]) {
      out.push(run(() => { l.post(port, j, { entity: 'e' }); return l.entries.length; }));
    }
    out.push([l.entries, l.inflow(), l.thermal(), l.magnitude(), l.drawnBy('e')]);
  }
  const recs = [record, {}, { ms: { debt: 64, strain: 500, vital: 5, s: [0.9, 0.1, 0.3, 0.7] }, causes: [{ by: 'a', d: 'b', open: true }, { by: 'c', d: 'd', open: 1 }, null] }];
  const opts = [undefined, {}, { vesselTemplate: [1, 0, 0.2, 0.2] }, { vesselWeight: 0.3 }, { vesselWeight: NaN }, { birth: { vital: 50, strain: 7, hp: 0.9, doses: 1 } }, { birth: { strain: '7' } }];
  for (const r of recs) for (const o of opts) out.push(run(() => W.rebirthTransfer(r, o)));
  for (const line of ['ms s=0.1,0.2 vital= strain=abc debt=9.5 hp=0.5 arch=0.5,0.5,0.5 pol=0,0 doses=200', W.formatMsLine(record.ms), '', 'ms', null]) out.push(W.parseMsLine(line));
  for (const ms of [record.ms, {}, { vital: 500, strain: -4, s: [7, NaN], chose: ['a', 'b c', 'd!', 'e', 'f'] }]) out.push([W.normalizeMs(ms), W.formatMsLine(ms)]);
  out.push(W.sessionSave(record));
  out.push(W.selectEpisodes(Array.from({ length: 40 }, (_, t) => (t < 20 ? ep(t, 'heart', 'pride') : ep(t))), [{ by: 'heart', d: 'pride', open: true }]));
  let x = [0.8, -0.4, 0.3];
  const pl = W.createEnergyLedger();
  for (let k = 0; k < 20; k++) {
    const s = W.stepPortHamiltonian(x, { ...drivenMul, u: [0.3], dt: 0.05 });
    W.postStep(pl, s, { step: k });
    out.push([s.x, s.iterations, s.dissipated, s.supplied]);
    x = s.x;
  }
  out.push(pl.entries);
  out.push([W.GATE, W.P_LOCAL_BY_STAGE, W.BIRTH, W.VESSEL_WEIGHT, W.INFLOW_PORTS, W.THERMAL, W.ME_SLOTS, W.ME_PIN_MAX, W.MS_CHOSE_MAX, W.MS_CHOSE_ID_MAX]);
  return out;
}
// The test compares the live module with the frozen R38 copy in scripts/fixtures (commit a1ed9e0), run on the same Node,
// so it does not depend on the Node version. SHA-256 of canon(defaultPathRuns(...)) for R38, as recorded on Node 24; a
// different digest on another Node is reported as a note, not a failure.
const R38_DEFAULT_DIGEST = 'c191d4882d4ce583410962f1f0f471c5863f9222df3c4ee86fafebb60370ea35';

test('Bridge default path (R38 differential)', 'on a fixed grid of inputs, with no bridge option every R38 function gives the same outputs as the frozen R38 module, bit for bit; bridgeDraw with no option is drawGateway; the D2 options at their off values change nothing', () => {
  const now = canon(defaultPathRuns(wave0));
  assert.ok(now === canon(defaultPathRuns(r38)), 'default-path outputs differ from the frozen R38 module');
  const digest = createHash('sha256').update(now).digest('hex');
  if (digest !== R38_DEFAULT_DIGEST) console.log(`note: default-path digest ${digest.slice(0, 8)}… differs from the one recorded on Node 24 (${R38_DEFAULT_DIGEST.slice(0, 8)}…)`);
  const toroids = [toroid0, { ...toroid0, W: 49 }, { ...toroid0, W: 50 }, { ...toroid0, K: 0 }, { ...toroid0, W: NaN }, { ...toroid0, owner: 'other' }];
  let drew = 0;
  for (const t of toroids) for (const balance of [0.5, 0.62, 0.72, 0.95, NaN]) for (const dt of [0.1, 1e6, 0, NaN]) for (const usePool of [false, true]) {
    const la = createEnergyLedger(), lb = createEnergyLedger(), lc = createEnergyLedger();
    const pa = usePool ? { remaining: 0.3 } : null, pb = usePool ? { remaining: 0.3 } : null, pc = usePool ? { remaining: 0.3 } : null;
    let a = { ...t }, b = { ...t }, c = { ...t };
    for (let k = 0; k < 4; k++) {
      a = drawGateway(a, 'e', { ...gate, balance }, dt, la, pa);
      const rb = bridgeDraw(b, 'e', { ...gate, balance }, dt, lb, { pool: pb });
      const rc = usePool ? rb : bridgeDraw(c, 'e', { ...gate, balance }, dt, lc);
      assert.deepEqual([rb.store, rb.dK, rb.factor, rb.tag], [null, 0, 1, null]);
      b = rb.toroid;
      c = usePool ? b : rc.toroid;
    }
    assert.equal(canon([b, lb.entries, pb]), canon([a, la.entries, pa]), `bridgeDraw = drawGateway for ${JSON.stringify({ t, balance, dt, usePool })}`);
    if (!usePool) assert.equal(canon([c, lc.entries]), canon([a, la.entries]));
    drew += la.entries.length;
  }
  assert.ok(drew > 0, 'the comparison includes real draws');
  assert.throws(() => bridgeDraw({ ...toroid0 }, '', { ...gate, balance: 0.9 }, 0.1, createEnergyLedger()), /named entity/);
  const recs = [record, { ...record, ms: { ...record.ms, debt: 64 } }, {}];
  const off = [{}, { reviewShare: 0, reviewed: true }, { reviewShare: 0.5 }, { reviewShare: 0.5, reviewed: 'yes' }, { reviewShare: NaN, reviewed: true },
    { strainPerOpenCause: 0 }, { strainPerOpenCause: NaN }, { strainPerOpenCause: -5 }];
  for (const r of recs) for (const o of off) assert.equal(canon(rebirthTransfer(r, o)), canon(rebirthTransfer(r)), `D2 off: ${JSON.stringify(o)}`);
  assert.throws(() => createEnergyLedger({ merge: false }).post('merge', 1), /undeclared/);
});

const level = (name, merge = false) => ({ name, ledger: createEnergyLedger({ merge }), hledger: createHelicityLedger() });
const params95 = { balance: 0.95, stage: 'S3' };

test('Bridge books', 'a draw from the enclosing level: the child\'s credit and the source\'s debit are the reported E under one tag, on energy and helicity; each store moves by exactly E, dK = sign(K) · E / Λ in the toroid\'s own handedness; the tower check passes', () => {
  for (const K of [2, -2]) {
    const parent = level('planet'), child = level('e1');
    const store0 = { id: 'planet', W: 400, K: 400, lambdaGeom: 4.955 / 3, Wmax: 1500 };
    const t0 = { ...toroid0, K };
    const r = bridgeDraw(t0, 'e1', { balance: 0.95, stage: 'S1' }, 0.1, child.ledger, { source: { ...parent, store: store0 }, lambda: 3, hledger: child.hledger });
    assert.ok(r.E > 0 && r.E === r.requested, `E ${r.E}`);
    assert.ok(near(r.E, gatewayPower({ balance: 0.95, stage: 'S1', toroid: t0 }).P * 0.1), 'the R38 rate law sets E');
    const [ce] = child.ledger.entries, [pe] = parent.ledger.entries;
    assert.deepEqual([ce.port, ce.joules, ce.tag, ce.entity, pe.port, pe.joules, pe.tag], ['gateway', r.E, r.tag, 'e1', 'gateway', -r.E, r.tag]);
    assert.deepEqual([child.ledger.entries.length, parent.ledger.entries.length], [1, 1]);
    assert.ok(typeof r.tag === 'string' && r.tag.startsWith('planet>e1#'));
    assert.equal(r.dK, Math.sign(K) * r.E / 3);
    assert.deepEqual([child.hledger.entries.map(e => [e.dK, e.tag]), parent.hledger.entries.map(e => [e.dK, e.tag])], [[[r.dK, r.tag]], [[-r.dK, r.tag]]]);
    assert.ok(Object.is(r.toroid.W, t0.W + r.E) && Object.is(r.toroid.K, K + r.dK), 'the toroid moves by exactly what was booked');
    assert.ok(Object.is(r.store.W, store0.W - r.E) && Object.is(r.store.K, store0.K - r.dK), 'the store moves by exactly what was booked');
    assert.ok(Math.abs(r.toroid.K) > Math.abs(K), 'charge in the toroid\'s own handedness');
    assert.deepEqual([r.store.id, r.store.Wmax, store0.W], ['planet', 1500, 400], 'the store is returned as a copy; the caller\'s is untouched');
    const chk = towerCheck([
      { ...parent, parent: null, stored0: store0.W, stored1: r.store.W, K0: store0.K, K1: r.store.K },
      { ...child, parent: 'planet', stored0: t0.W, stored1: r.toroid.W, K0: K, K1: r.toroid.K },
    ]);
    assert.ok(chk.ok, chk.problems.join('; '));
  }
  const second = level('p'), c2 = level('c');
  const s1 = bridgeDraw({ ...toroid0 }, 'c', params95, 0.01, c2.ledger, { source: { ...second, store: { W: 400 } } });
  const s2 = bridgeDraw(s1.toroid, 'c', params95, 0.01, c2.ledger, { source: { ...second, store: s1.store } });
  assert.ok(s1.tag !== s2.tag && s1.store.K === undefined, 'tags are unique per draw; without Λ no K is added to the store');
  const stuck = [[{ W: NaN }, {}], [{ W: -1 }, {}], [{ W: 400, K: NaN }, { lambda: 3 }], [{ W: 5 }, { floor: 6 }], [{ W: 5, K: 20, lambdaGeom: 1 }, {}]];
  for (const [store, extra] of stuck) {
    const p = level('p'), c = level('c');
    const r = bridgeDraw({ ...toroid0 }, 'c', params95, 0.01, c.ledger, { source: { ...p, store, floor: extra.floor }, lambda: extra.lambda, hledger: c.hledger });
    assert.ok(Object.is(r.E, 0) && p.ledger.entries.length + c.ledger.entries.length === 0 && r.toroid.W === toroid0.W, `nothing moves from ${JSON.stringify(store)} ${JSON.stringify(extra)}`);
  }
  assert.throws(() => createHelicityLedger().post('zero-point', 1), /undeclared helicity port/);
  assert.throws(() => createHelicityLedger().post('gateway', NaN), /non-finite/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'c', params95, 0.1, createEnergyLedger(), { lambda: 0, hledger: createHelicityLedger() }), /positive finite/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'c', params95, 0.1, createEnergyLedger(), { lambda: 3 }), /helicity ledger/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'c', params95, 0.1, createEnergyLedger(), { source: { name: 'p', ledger: createEnergyLedger(), store: { W: 1 }, floor: NaN } }), /floor/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'c', params95, 0.1, createEnergyLedger(), { source: { ledger: createEnergyLedger(), store: { W: 1 } } }), /needs a name/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'c', params95, 0.1, createEnergyLedger(), { source: { name: 'p', store: { W: 1 } } }), /energy ledger/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'c', params95, 0.1, createEnergyLedger(), { source: { name: 'p', ledger: createEnergyLedger(), store: { W: 1 } }, lambda: 3, hledger: createHelicityLedger() }), /source's helicity ledger/);
});

test('Bridge ladder', 'parent-to-child draws down the stage ladder S6 → S0a: where a source floor binds, the draw stops at it and E / P_local is the same at every rung; with helicity neither side ends below its Taylor floor; a three-level tower with relaxation at every level closes', () => {
  const stages = Object.keys(P_LOCAL_BY_STAGE);
  const rows = [];
  for (let k = 0; k + 1 < stages.length; k++) {
    const up = stages[k + 1], s = P_LOCAL_BY_STAGE[up];
    const params = { balance: 0.95, stage: up };
    const t = { id: stages[k], W: 10 * s, K: 2 * s, lambdaGeom: 4.955, kappa: 0.5, Wmax: 50 * s };
    // (a) a floor given as an option binds
    const pool = { remaining: 10 * s };
    const a = bridgeDraw(t, `e${k}`, params, 1, createEnergyLedger(), { source: { ...level(up), store: { W: 30 * s }, floor: 29.8 * s }, pool });
    assert.ok(a.E > 0 && a.E < a.requested, `rung ${k}: the floor binds (${a.E} of ${a.requested})`);
    assert.ok(a.store.W >= 29.8 * s && a.store.W - 29.8 * s <= 1e-12 * s, `rung ${k}: stops at the floor (${a.store.W - 29.8 * s} above)`);
    assert.ok(Object.is(pool.remaining, 10 * s - a.E), 'the pool is charged what was drawn, not what was asked');
    // (b) the source's own Taylor floor binds, with helicity
    const pb = level(up), cb = level(stages[k]);
    const b = bridgeDraw(t, `e${k}`, params, 1, cb.ledger, { source: { ...pb, store: { W: 30 * s, K: 59.6 * s, lambdaGeom: 1 } }, lambda: 4.955, hledger: cb.hledger });
    assert.ok(b.E > 0 && b.E < b.requested && b.store.W >= toroidFloor(b.store) && b.toroid.W >= toroidFloor(b.toroid), `rung ${k}: Taylor floors hold`);
    assert.ok(b.store.W - toroidFloor(b.store) <= 1e-12 * s, `rung ${k}: the source stops at its Taylor floor`);
    // (c) the child's Taylor floor binds: a charge with too little energy per unit helicity (Λ < λ/2)
    const cc = level(stages[k]);
    const c = bridgeDraw({ ...t, W: 5 * s }, `e${k}`, params, 1, cc.ledger, { lambda: 1, hledger: cc.hledger });
    assert.ok(c.E > 0 && c.E < c.requested && c.toroid.W >= toroidFloor(c.toroid) && c.toroid.W - toroidFloor(c.toroid) <= 1e-12 * s, `rung ${k}: the child stops at its Taylor floor`);
    rows.push([a.E / s, a.requested / s, b.E / s, b.dK / s, c.E / s]);
  }
  for (const row of rows) row.forEach((v, j) => assert.ok(near(v, rows[0][j], 1e-12), `E / P_local differs across rungs in column ${j}: ${v} vs ${rows[0][j]}`));
  assert.ok(near(rows[0][0], 0.2, 1e-12), `the option floor leaves 0.2 · P_local to draw, got ${rows[0][0]}`);

  const names = ['S2', 'S1', 'S0a'];
  const lv = names.map(n => level(n));
  let ts = [{ id: 'S2', W: 300, K: 200, lambdaGeom: 1.2, kappa: 0.05, Wmax: 900 }, { id: 'S1', W: 60, K: 30, lambdaGeom: 2.5, kappa: 0.2, Wmax: 200 }, { ...toroid0, id: 'S0a' }];
  const init = ts.map(t => ({ ...t }));
  for (let k = 0; k < 300; k++) {
    ts[0] = bridgeDraw(ts[0], 'S2', { balance: 0.95, stage: 'S3' }, 0.1, lv[0].ledger, { lambda: 2, hledger: lv[0].hledger }).toroid;
    for (let i = 1; i < 3; i++) {
      const r = bridgeDraw(ts[i], names[i], { balance: [0, 0.9, 0.86][i], stage: names[i - 1] }, 0.1, lv[i].ledger,
        { source: { ...lv[i - 1], store: ts[i - 1] }, lambda: 2, hledger: lv[i].hledger });
      ts[i] = r.toroid;
      ts[i - 1] = r.store;
    }
    ts = ts.map((t, i) => stepToroidRelaxation(t, 0.1, lv[i].ledger));
  }
  const levels = names.map((n, i) => ({ ...lv[i], parent: i === 0 ? null : names[i - 1], stored0: init[i].W, stored1: ts[i].W, K0: init[i].K, K1: ts[i].K }));
  const chk = towerCheck(levels);
  assert.ok(chk.ok, chk.problems.join('; '));
  for (let i = 0; i < 3; i++) {
    assert.ok(lv[i].ledger.entries.some(e => e.port === 'gateway' && e.joules > 0), `${names[i]} drew`);
    assert.ok(lv[i].ledger.thermal() > 0, `${names[i]} booked its dissipation to its own thermal sink`);
    assert.ok(ts[i].W >= toroidFloor(ts[i]) - 1e-12 * ts[i].W, `${names[i]} stays realizable`);
  }
});

test('Bridge gate closed', 'through the composed draw (source, helicity, phased port): at or below 0.81, on a missing or non-finite balance, an unknown stage or no supply, nothing moves either way and nothing is booked on either side', () => {
  const run = (params, port) => {
    const parent = level('p'), child = level('c');
    const store = { W: 400, K: 50, lambdaGeom: 1 };
    const r = bridgeDraw({ ...toroid0, W: 30 }, 'c', params, 0.1, child.ledger, { source: { ...parent, store }, lambda: 3, hledger: child.hledger, port });
    return { r, n: [parent.ledger, child.ledger, parent.hledger, child.hledger].reduce((s, l) => s + l.entries.length, 0), store };
  };
  const tp = (order, antidrive) => ({ type: 'three-phase', order, phase: Math.PI / 2, antidrive });
  for (const port of [null, tp(1, 'reverse'), tp(2, 'reverse')]) {
    const closed = [-1, 0, 0.5, 0.8, 0.81, NaN, -Infinity, undefined].map(balance => ({ balance, stage: 'S3' }))
      .concat([{ stage: 'S3' }, { balance: 0.95, stage: 'S9' }, { balance: 0.95 }, { balance: 0.95, pLocal: NaN }]);
    for (const params of closed) {
      const { r, n, store } = run(params, port);
      assert.ok(Object.is(r.E, 0) && n === 0 && r.tag === null, `moved ${r.E} with ${n} entries at ${JSON.stringify(params)}, port ${port?.order}`);
      assert.deepEqual([r.toroid, r.store], [{ ...toroid0, W: 30 }, store]);
    }
    const open = run(params95, port).r.E;
    assert.ok(port?.order === 2 ? open < 0 : open > 0, `the open gate does move (port ${port?.order}: ${open})`);
  }
});

test('Bridge antidrive', 'the phased port: the antidrive handling must be named; orders 1, 4, 7 drive at sin(phase) > 0, 3, 6, 9 move nothing; antidrive (orders 2, 5, 8, or sin(phase) < 0, both together included) closes the port under \'close\' and runs it backwards under \'reverse\', returning energy and charge to the source, never below the toroid\'s floor, never past K = 0 nor past the source\'s Wmax', () => {
  const tp = (order, phase, antidrive) => ({ type: 'three-phase', order, phase, antidrive });
  assert.throws(() => portFactor({ type: 'three-phase', order: 2, phase: 1 }), /owner's decision/);
  assert.throws(() => bridgeDraw({ ...toroid0 }, 'e', params95, 0.1, createEnergyLedger(), { port: { type: 'three-phase', order: 1, phase: 1 } }), /owner's decision/);
  assert.throws(() => portFactor({ type: 'dc', antidrive: 'close' }), /unknown port type/);
  for (const order of [1.5, -1, NaN, undefined]) assert.throws(() => portFactor(tp(order, 1, 'close')), /whole number/);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(threePhaseSequence), [0, 1, -1, 0, 1, -1, 0, 1, -1, 0]);
  assert.deepEqual(ANTIDRIVE, ['close', 'reverse']);
  const draw = (port, t = toroid0, dt = 0.01) => { const ledger = createEnergyLedger(); const r = bridgeDraw({ ...t }, 'e', params95, dt, ledger, { port }); return { r, ledger }; };
  const full = draw(null).r.E;
  assert.ok(full > 0);
  for (const order of [1, 4, 7]) assert.ok(Object.is(draw(tp(order, Math.PI / 2, 'close')).r.E, full), `order ${order}`);
  assert.ok(near(draw(tp(1, Math.PI / 6, 'close')).r.E, Math.sin(Math.PI / 6) * full, 1e-15), 'sin(phase) scales the draw');
  for (const port of [tp(3, Math.PI / 2, 'close'), tp(6, Math.PI / 2, 'reverse'), tp(9, 1, 'reverse'), tp(3, -Math.PI / 2, 'reverse'), tp(1, 0, 'reverse'), tp(1, NaN, 'reverse'), tp(2, Infinity, 'reverse')]) {
    const { r, ledger } = draw(port);
    assert.ok(Object.is(r.E, 0) && ledger.entries.length === 0 && r.factor === 0, `nothing moves for ${JSON.stringify(port)}`);
  }
  for (const port of [tp(2, Math.PI / 2, 'close'), tp(5, 1, 'close'), tp(8, 1, 'close'), tp(1, -Math.PI / 2, 'close'), tp(4, 4, 'close'),
    tp(2, -Math.PI / 2, 'close'), tp(5, -1, 'close'), tp(8, 4, 'close')]) {
    const { r, ledger } = draw(port, { ...toroid0, W: 30 });
    assert.ok(Object.is(r.E, 0) && ledger.entries.length === 0 && r.factor < 0, `'close' moves nothing for ${JSON.stringify(port)}`);
  }
  assert.deepEqual([portFactor(tp(2, -Math.PI / 2, 'close')), portFactor(tp(5, -1, 'close'))], [-1, -Math.sin(1)], 'a negative sequence at a negative phase is antidrive at |sin(phase)|');
  assert.ok(Object.is(draw(tp(2, -Math.PI / 2, 'reverse'), { ...toroid0, W: 30 }).r.E, draw(tp(2, Math.PI / 2, 'reverse'), { ...toroid0, W: 30 }).r.E), 'both negative reverses like one');
  const parent = level('p'), child = level('c'), pool = { remaining: 0.3 };
  const store = { W: 400, K: 50, lambdaGeom: 1, Wmax: 1000 };
  const t = { ...toroid0, W: 30 };
  const r = bridgeDraw(t, 'c', params95, 0.01, child.ledger, { source: { ...parent, store }, lambda: 3, hledger: child.hledger, port: tp(2, Math.PI / 2, 'reverse'), pool });
  assert.ok(r.E < 0 && r.factor === -1 && near(r.E, -gatewayPower({ ...params95, toroid: t }).P * 0.01, 1e-15), `reversed at the same rate law: ${r.E}`);
  assert.ok(Object.is(r.toroid.W, 30 + r.E) && Object.is(r.store.W, 400 - r.E) && r.store.W > 400, 'the energy returns to the source');
  assert.ok(r.dK < 0 && Math.abs(r.toroid.K) < Math.abs(t.K) && Object.is(r.store.K, 50 - r.dK), 'antidrive takes charge out of the toroid');
  assert.deepEqual([child.ledger.entries[0].joules, parent.ledger.entries[0].joules], [r.E, -r.E]);
  assert.equal(pool.remaining, 0.3, 'a reversed flow leaves the pool untouched');
  assert.ok(near(draw(tp(2, Math.PI / 6, 'reverse'), t).r.E, Math.sin(Math.PI / 6) * r.E, 1e-15), 'a partial factor reverses a partial flow');
  const chk = towerCheck([{ ...parent, parent: null, stored0: 400, stored1: r.store.W, K0: 50, K1: r.store.K }, { ...child, parent: 'p', stored0: 30, stored1: r.toroid.W, K0: t.K, K1: r.toroid.K }]);
  assert.ok(chk.ok, chk.problems.join('; '));
  const big = bridgeDraw(t, 'c', params95, 1e6, createEnergyLedger(), { port: tp(2, Math.PI / 2, 'reverse') });
  assert.ok(big.E < 0 && big.toroid.W >= toroidFloor(big.toroid) && big.toroid.W - toroidFloor(big.toroid) <= 1e-12 * 30, `a huge reversed step stops at the toroid's floor: W ${big.toroid.W}, floor ${toroidFloor(big.toroid)}`);
  // With helicity, a reversed flow returns at most the charge the toroid holds: K stops at 0, never in the other handedness.
  for (const K0 of [2, -2]) for (const lambda of [0.01, 0.1, 3]) for (const dt of [0.01, 0.05, 0.2, 1e6]) {
    const src = { ...level('q'), store: { W: 400, K: 50, lambdaGeom: 1 } }, ch = createHelicityLedger();
    const rv = bridgeDraw({ ...t, K: K0 }, 'c', params95, dt, createEnergyLedger(), { source: src, port: tp(2, Math.PI / 2, 'reverse'), lambda, hledger: ch });
    const K1 = rv.toroid.K;
    assert.ok(rv.E < 0 && Math.sign(K1) !== -Math.sign(K0) && Math.abs(K1) <= Math.abs(K0) && rv.toroid.W >= toroidFloor(rv.toroid), `K ${K0} → ${K1} (Λ ${lambda}, dt ${dt})`);
    assert.ok(Math.abs(src.hledger.total()) <= Math.abs(K0) && Object.is(ch.total(), -src.hledger.total()), `the source receives at most the toroid's charge (Λ ${lambda}, dt ${dt})`);
    if (dt === 1e6) assert.ok(Math.abs(K1) <= 1e-12 * Math.abs(K0) || rv.toroid.W - toroidFloor(rv.toroid) <= 1e-12 * 30, `a huge reversed step stops at K = 0 or the floor (Λ ${lambda}): K ${K1}`);
  }
  const lone = createEnergyLedger();
  const out = bridgeDraw(t, 'c', params95, 0.01, lone, { port: tp(1, -Math.PI / 2, 'reverse') });
  assert.ok(out.E < 0 && lone.drawnBy('c') === out.E && ledgerCloses({ stored0: 30, stored1: out.toroid.W, ledger: lone }).ok, 'without a source the energy leaves through the gateway port, booked');
  const full2 = bridgeDraw(t, 'c', params95, 1e6, createEnergyLedger(), { source: { ...level('q'), store: { W: 999.99, Wmax: 1000 } }, port: tp(2, Math.PI / 2, 'reverse') });
  assert.ok(full2.E < 0 && full2.store.W <= 1000 && 1000 - full2.store.W <= 1e-9, `never past the source's Wmax: ${full2.store.W}`);
});

test('Bridge D2 rebirth', 'D2 options on rebirthTransfer: a review heals the given share of debt only when reviewed is true; each open cause adds the given strain at birth; everything else is the R38 transfer', () => {
  const r64 = { ...record, ms: { ...record.ms, debt: 64 }, causes: [...record.causes, { by: 'a', d: 'b', open: true }, { by: 'c', d: 'd', open: false }] };
  const base = rebirthTransfer(r64);
  assert.deepEqual([base.ms.debt, base.ms.strain, base.causes.length], [64, 0, 2]);
  const debt = o => rebirthTransfer(r64, o).ms.debt;
  assert.deepEqual([debt({ reviewShare: 0.25 }), debt({ reviewShare: 0.25, reviewed: 1 }), debt({ reviewShare: 0.25, reviewed: true })], [64, 64, 48], 'no review, no healing');
  assert.deepEqual([debt({ reviewShare: 0.5, reviewed: true }), debt({ reviewShare: 1, reviewed: true }), debt({ reviewShare: 0, reviewed: true }), debt({ reviewShare: 7, reviewed: true })], [32, 0, 64, 0]);
  assert.equal(rebirthTransfer(record, { reviewShare: 0.5, reviewed: true }).ms.debt, 4, 'debt 9 halved is truncated to 4, like every debt value');
  const strain = (rec, o) => rebirthTransfer(rec, o).ms.strain;
  assert.deepEqual([strain(r64, { strainPerOpenCause: 25 }), strain(record, { strainPerOpenCause: 25 }), strain({ ...record, causes: [] }, { strainPerOpenCause: 25 })], [50, 25, 0], 'strain per open cause, closed causes not counted');
  assert.equal(strain(r64, { strainPerOpenCause: 300 }), 500, 'strain stays within its range');
  assert.equal(strain(r64, { strainPerOpenCause: 25, birth: { ...BIRTH, strain: 7 } }), 57, 'added to the birth strain');
  const both = rebirthTransfer(r64, { reviewShare: 0.5, reviewed: true, strainPerOpenCause: 10 });
  assert.deepEqual({ ...both, ms: { ...both.ms, debt: base.ms.debt, strain: base.ms.strain } }, base, 'nothing else changes');
  assert.deepEqual([both.ms.debt, both.ms.strain], [32, 20]);
});

test('Bridge harvest', 'harvest books nothing by default (merge only when merge is exactly true); merge moves the whole toroid up with mirrored energy and helicity entries and the tower closes; a merge that would leave the parent below its Taylor floor is refused; helicity is booked on both sides or neither; only a ledger built with the merge port takes it', () => {
  const t = { ...toroid0, id: 'e1' };
  const parent = { ...level('planet', true), store: { id: 'planet', W: 400, K: 300, lambdaGeom: 2 } };
  const child = level('e1', true);
  const count = () => [parent.ledger, child.ledger, parent.hledger, child.hledger].reduce((s, l) => s + l.entries.length, 0);
  const ro = harvestUp(t, { child, parent });
  assert.ok(!ro.merged && count() === 0, 'the default books nothing');
  for (const merge of [1, 'yes', {}]) assert.ok(!harvestUp(t, { merge, child, parent }).merged && count() === 0, `merge only on true, not ${JSON.stringify(merge)}`);
  assert.deepEqual([ro.toroid, ro.store, ro.readout], [t, parent.store, { W: 10, K: 2, coherence: toroidCoherence(t) }]);
  const m = harvestUp(t, { merge: true, child, parent });
  assert.ok(m.merged && m.toroid.W === 0 && m.toroid.K === 0 && m.store.W === 410 && m.store.K === 302 && parent.store.W === 400);
  assert.deepEqual([parent.ledger.entries[0].joules, child.ledger.entries[0].joules, parent.hledger.entries[0].dK, child.hledger.entries[0].dK], [10, -10, 2, -2]);
  assert.ok([parent.ledger, child.ledger, parent.hledger, child.hledger].every(l => l.entries[0].tag === m.tag && l.entries[0].port === 'merge'));
  const chk = towerCheck([{ ...parent, parent: null, stored0: 400, stored1: m.store.W, K0: 300, K1: m.store.K }, { ...child, parent: 'planet', stored0: 10, stored1: 0, K0: 2, K1: 0 }]);
  assert.ok(chk.ok, chk.problems.join('; '));
  const tight = { ...level('p', true), store: { W: 301.5, K: 300, lambdaGeom: 2 } }, c2 = level('c', true);
  const refused = harvestUp({ W: 1, K: 10 }, { merge: true, child: c2, parent: tight });
  assert.ok(!refused.merged && refused.refused && tight.ledger.entries.length === 0 && c2.ledger.entries.length === 0, 'refused below the parent\'s floor, nothing booked');
  assert.ok(harvestUp({ W: 1, K: -10 }, { merge: true, child: c2, parent: tight }).merged, 'opposite charge lowers the floor, so it merges');
  const full = { ...level('f', true), store: { W: 45, Wmax: 50 } }, c3 = level('c3', true);
  for (const bad of [{ W: 6 }, { W: NaN }, { W: -1 }, { W: 1, K: NaN }]) {
    const out = harvestUp(bad, { merge: true, child: c3, parent: full });
    assert.ok(!out.merged && out.refused && full.ledger.entries.length + c3.ledger.entries.length === 0, `refused: ${JSON.stringify(bad)}`);
  }
  assert.ok(harvestUp({ W: 5 }, { merge: true, child: c3, parent: full }).merged, 'a merge that exactly fills the parent is allowed');
  assert.throws(() => harvestUp(t, { merge: true, child: { name: 'c', ledger: createEnergyLedger({ merge: true }) }, parent }), /both sides or on neither/);
  assert.throws(() => harvestUp(t, { merge: true, child: { name: 'c', ledger: createEnergyLedger() }, parent: { name: 'p', ledger: createEnergyLedger(), store: { W: 1 } } }), /undeclared energy port: merge/);
});

test('Bridge tower check', 'the tower check passes a correct tower and fails each broken one, each on the check it targets: a one-sided draw below the root, a store not debited, a debit of the wrong size, a reused tag, unclosed helicity (also by 1e-9), helicity mirrored under another tag, siblings sharing a tag, a gateway entry paired with a merge entry, an untagged merge on the root, an unknown parent (also with no draws), a missing parent, a cycle and a level with no energy ledger', () => {
  const build = () => {
    const parent = level('p', true), child = level('c', true);
    const r = bridgeDraw({ ...toroid0 }, 'c', params95, 0.01, child.ledger, { source: { ...parent, store: { W: 400, K: 50, lambdaGeom: 1 } }, lambda: 3, hledger: child.hledger });
    const levels = [{ ...parent, parent: null, stored0: 400, stored1: r.store.W, K0: 50, K1: r.store.K }, { ...child, parent: 'p', stored0: toroid0.W, stored1: r.toroid.W, K0: toroid0.K, K1: r.toroid.K }];
    return { levels, parent, child, r };
  };
  assert.ok(towerCheck(build().levels).ok);
  // Each broken tower must report the problem its check gives. Every other book stays closed, so each fails on that
  // check alone, except the unknown and missing parent cases on the drawn pair, which also break its link.
  const add = (x, name, parent, stored0, stored1, K0 = 0, K1 = 0) => { const l = { ...level(name, true), parent, stored0, stored1, K0, K1 }; x.levels.push(l); return l; };
  const broken = {
    'one-sided draw below the root': [/c: untagged energy entry on port gateway/, x => { x.levels[1].stored1 = drawGateway(x.r.toroid, 'c', params95, 0.01, x.child.ledger).W; }],
    'store not debited': [/p: energy books do not close/, x => { x.levels[0].stored1 = 400; }],
    'debit of the wrong size': [/energy tag .*not one opposite pair/, x => { x.parent.ledger.entries[0].joules *= 2; }],
    'reused tag': [/energy tag .*not one opposite pair/, x => { x.child.ledger.post('gateway', x.r.E, { entity: 'c', tag: x.r.tag }); x.levels[1].stored1 += x.r.E; }],
    'helicity not closed': [/c: helicity books do not close/, x => { x.levels[1].K1 = toroid0.K; }],
    'helicity off by 1e-9': [/c: helicity books do not close/, x => { x.levels[1].K1 += 1e-9; }],
    'helicity mirrored under another tag': [/helicity tag .*not one opposite pair/, x => { x.parent.hledger.entries[0].tag = 'other'; }],
    'siblings share a tag': [/energy tag T: not one opposite pair/, x => {
      add(x, 'a', 'p', 0, 2).ledger.post('gateway', 2, { entity: 'a', tag: 'T' });
      add(x, 'b', 'p', 2, 0).ledger.post('gateway', -2, { entity: 'b', tag: 'T' });
    }],
    'gateway paired with merge': [/energy tag Z: not one opposite pair/, x => {
      x.child.ledger.post('gateway', 2, { entity: 'c', tag: 'Z' }); x.levels[1].stored1 += 2;
      x.parent.ledger.post('merge', -2, { tag: 'Z' }); x.levels[0].stored1 -= 2;
    }],
    'untagged merge on the root': [/p: untagged energy entry on port merge/, x => { x.parent.ledger.post('merge', 5, {}); x.levels[0].stored1 += 5; }],
    'unknown parent': [/c: parent must be a level/, x => { x.levels[1].parent = 'q'; }],
    'unknown parent, no draws': [/z: parent must be a level/, x => { add(x, 'z', 'nowhere', 1, 1); }],
    'missing parent': [/c: parent must be a level/, x => { delete x.levels[1].parent; }],
    'cycle': [/the parent chain has a cycle/, x => { x.levels[0].parent = 'c'; }],
    'repeated level name': [/repeated/, x => { x.levels.push({ ...x.levels[1] }); }],
    'no energy ledger': [/q: no energy ledger/, x => { x.levels.push({ name: 'q', parent: 'p', stored0: 0, stored1: 0 }); }],
  };
  for (const [what, [expected, breakIt]] of Object.entries(broken)) {
    const x = build();
    breakIt(x);
    const chk = towerCheck(x.levels);
    assert.ok(!chk.ok, `the tower check passed a tower with: ${what}`);
    assert.ok(chk.problems.some(p => expected.test(p)), `${what}: expected ${expected}, got ${chk.problems.join('; ')}`);
  }
});

test('Bridge split bound', 'the split bound ½√(1 − c²): 0.5 at c = 0, 0 at c = 1, 0.4 at c = 0.6 and 0.3 at c = 0.8, 0 outside [0, 1]; amplitudes within it pass and beyond it fail (either sign); the helicity ledger sums signed entries and their magnitude', () => {
  assert.deepEqual([splitAmplitudeBound(0), splitAmplitudeBound(1)], [0.5, 0]);
  assert.ok(near(splitAmplitudeBound(0.6), 0.4) && near(splitAmplitudeBound(0.8), 0.3));
  for (const c of [NaN, -0.1, 1.1, Infinity, undefined]) assert.equal(splitAmplitudeBound(c), 0, `c = ${c}`);
  assert.ok(splitWithinBound(0.4, 0.6).ok && splitWithinBound(-0.39, 0.6).ok && splitWithinBound(0, 1).ok);
  for (const [a, c] of [[0.41, 0.6], [-0.41, 0.6], [NaN, 0.6], [0.1, NaN], [0.01, 1], [0.1, 1.2]]) assert.ok(!splitWithinBound(a, c).ok, `a = ${a}, c = ${c}`);
  const hl = createHelicityLedger();
  hl.post('gateway', 2); hl.post('merge', -3);
  assert.deepEqual([hl.total(), hl.magnitude()], [-1, 5], 'the helicity ledger sums signed entries and their magnitude');
});

const failed = results.filter(r => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}\n        ${r.why}${r.ok ? '' : `\n        ${r.error}`}`);
console.log(`\n${results.length - failed.length}/${results.length} Wave 0 reference tests pass`);
if (failed.length) process.exitCode = 1;
