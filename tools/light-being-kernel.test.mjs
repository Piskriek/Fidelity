// tools/light-being-kernel.test.mjs
// The five invariants of Argon's operator as the council reworded them (docs/council/2026-11-04-operator/
// STEER.md), asserted on the pure kernel and, wherever the addon computes the same number, against the
// real Lua (FidelityEMatrix/EMatrix_Math.lua) through fengari.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fengari from 'fengari';
import {
  makeLattice, strike, stepLightBeingLattice, relaxation, cellRotation, ringDistance, flipProgress,
  parallaxShift, stereoPair, alignment, clampSteering,
} from '../packages/triad-369/src/light_being_kernel.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const mathLuaPath = path.join(here, '..', 'FidelityEMatrix', 'EMatrix_Math.lua');

function luaMath() {
  const { lua, lauxlib, lualib, to_luastring } = fengari;
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const src = fs.readFileSync(mathLuaPath, 'utf8');
  if (lauxlib.luaL_loadbuffer(L, to_luastring(src), null, to_luastring('@EMatrix_Math.lua')) !== lua.LUA_OK) throw new Error(lua.lua_tojsstring(L, -1));
  if (lua.lua_pcall(L, 0, 1, 0) !== lua.LUA_OK) throw new Error(lua.lua_tojsstring(L, -1));
  return (name, ...args) => {
    lua.lua_getfield(L, -1, to_luastring(name));
    for (const a of args) lua.lua_pushnumber(L, a);
    if (lua.lua_pcall(L, args.length, 1, 0) !== lua.LUA_OK) throw new Error(lua.lua_tojsstring(L, -1));
    const v = lua.lua_tonumber(L, -1);
    lua.lua_pop(L, 1);
    return v;
  };
}

const FUZZ = [NaN, 0, -0, Infinity, -Infinity, 1e308, -1e308, 1e-308, 0.5, -0.5, 1, -1, 3.7];
function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const shape = state => state.cells.map(c => [c.index, c.col, c.row, c.R]);
const clock = state => JSON.stringify([state.waveAge, state.waveActive, state.cells.map(c => [c.u, c.open])]);

test('invariant 1, topology: R and (col, row) never change through forward and reverse waves, and R is the addon\'s own hash', () => {
  const call = luaMath();
  const state = makeLattice();
  const before = shape(state);
  strike(state, { col: 8, row: 5 });
  for (let i = 0; i < 1000; i++) stepLightBeingLattice(state, { x: 0.3, y: -0.2 }, 1 / 60);
  strike(state, { col: 1, row: 1 }, { radius: 3 });
  for (let i = 0; i < 1000; i++) stepLightBeingLattice(state, null, 1 / 60);
  assert.deepEqual(shape(state), before, 'no wave may move a cell or turn it');
  const counts = [0, 0, 0, 0];
  for (const c of state.cells) {
    assert.equal(c.R, call('GetCellRotation', c.col, c.row), `R of (${c.col}, ${c.row}) must be the Lua's`);
    assert.equal(c.R, cellRotation(c.col, c.row));
    counts[c.R]++;
  }
  assert.deepEqual(counts.slice().sort((a, b) => a - b), [33, 33, 33, 36], 'the four orientations stay balanced');
});

test('invariant 2, ring geometry from (8, 5) on 15 x 9: 1 cell at ring 0, 8 at ring 1, 16 at Chebyshev 2 between the metrics, 110 Euclidean from Chebyshev 3, each equal to the Lua', () => {
  const call = luaMath();
  const state = makeLattice();
  strike(state, { col: 8, row: 5 });
  let r0 = 0, r1 = 0, c2 = 0, c3 = 0;
  for (const c of state.cells) {
    const dx = Math.abs(c.col - 8), dy = Math.abs(c.row - 5), cheb = Math.max(dx, dy), euclid = Math.hypot(dx, dy);
    assert.ok(Math.abs(c.ring - call('CalculateRingDistance', c.col, c.row, 8, 5)) < 1e-12, `ring of (${c.col}, ${c.row}) must be the Lua's`);
    assert.equal(c.ring, ringDistance(c.col, c.row, 8, 5));
    if (c.ring === 0) r0++;
    else if (c.ring === 1) r1++;
    if (cheb === 2) { c2++; assert.ok(c.ring >= cheb - 1e-12 && c.ring <= euclid + 1e-12, 'ring 2 blends the two metrics'); }
    if (cheb >= 3) { c3++; assert.ok(Math.abs(c.ring - euclid) < 1e-9, 'from Chebyshev 3 the front is circular'); }
  }
  assert.deepEqual([r0, r1, c2, c3], [1, 8, 16, 110]);
});

test('invariant 3, non-coercion and no NaN: non-finite steering or time is rejected and reported, |s| is clamped to 1, every output stays finite, and the Lua flip clock is finite for a NaN age', () => {
  const call = luaMath();
  assert.equal(call('CalculateFlipProgress', NaN, 16, 0, 0.26), 0, 'the Lua flip clock must not return NaN for a NaN age');
  assert.equal(call('CalculateFlipProgress', 1, 16, NaN, 0.26), 0, 'nor for a NaN ring');
  assert.equal(call('CalculateFlipProgress', Infinity, 16, Infinity, 0.26), 0, 'nor for two infinities');
  for (const v of FUZZ) assert.ok(Number.isFinite(flipProgress(v, 16, 0, 0.26)) && Number.isFinite(flipProgress(0.1, v, 0, 0.26)) && Number.isFinite(flipProgress(0.1, 16, v, 0.26)));
  const rnd = lcg(20261104);
  const pick = () => (rnd() < 0.6 ? FUZZ[Math.floor(rnd() * FUZZ.length)] : (rnd() - 0.5) * 4);
  const state = makeLattice();
  strike(state, { col: 8, row: 5 });
  let rejectedDt = 0, rejectedS = 0;
  for (let i = 0; i < 10000; i++) {
    const s = { x: pick(), y: pick() }, dt = pick();
    const before = clock(state);
    const { rejected } = stepLightBeingLattice(state, s, dt);
    if (!Number.isFinite(dt) || dt < 0) {
      assert.ok(rejected.includes('dt'), `dt ${dt} must be rejected`);
      assert.equal(clock(state), before, 'a rejected dt leaves the state exactly as it was');
      rejectedDt++;
    }
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) { assert.ok(rejected.includes('s'), `s (${s.x}, ${s.y}) must be rejected`); rejectedS++; }
    assert.ok(Math.hypot(state.s.x, state.s.y) <= 1 + 1e-12, 'steering is clamped to the unit disc');
    assert.ok(Number.isFinite(state.waveAge), 'the clock stays finite');
    for (const c of state.cells) assert.ok(Number.isFinite(c.u) && Number.isFinite(c.open) && c.u >= 0 && c.u <= 1, 'every cell stays finite and in range');
    if (i % 500 === 0) strike(state, { col: 1 + Math.floor(rnd() * 15), row: 1 + Math.floor(rnd() * 9) });
  }
  assert.ok(rejectedDt > 100 && rejectedS > 100, `the fuzz must exercise the rejections (${rejectedDt}, ${rejectedS})`);
  for (const v of FUZZ) assert.ok(Number.isFinite(alignment({ x: v, y: 1 }, 2)) && Number.isFinite(alignment({ x: 1, y: 0 }, v)));
  assert.deepEqual(clampSteering({ x: 3, y: 4 }).s, { x: 0.6, y: 0.8 });
  assert.equal(stepLightBeingLattice(state, null, 1).rejected.length, 0, 'no steering is not a rejection');
  assert.deepEqual(strike(makeLattice(), { col: 0, row: 5 }).rejected, ['origin']);
  assert.deepEqual(strike(makeLattice(), { col: 8, row: 5 }, { radius: NaN }).rejected, ['radius']);
});

test('invariant 4, relaxation: with no steering and no new strike, V = sum |aperture - target| never rises, falls while any cell is mid-flip and is 0 by maxRing / speed + flipDuration; u agrees with the Lua at every sample', () => {
  const call = luaMath();
  const state = makeLattice();
  strike(state, { col: 8, row: 5 }, { open: true });
  let v = relaxation(state);
  assert.equal(v, 135, 'every closed cell is one unit from its open target');
  const maxRing = Math.max(...state.cells.map(c => c.ring));
  const bound = maxRing / state.waveSpeed + state.flipDuration;
  const dt = 1 / 60;
  let t = 0;
  while (t < bound + 1) {
    stepLightBeingLattice(state, { x: 0, y: 0 }, dt);
    t += dt;
    const next = relaxation(state);
    assert.ok(next <= v + 1e-9, `V must not rise: ${v} -> ${next} at t = ${t}`);
    if (state.cells.some(c => c.inWave && c.u > 0 && c.u < 1)) assert.ok(next < v - 1e-12, `V must fall while a cell is mid-flip (t = ${t})`);
    for (const c of state.cells) {
      const lu = call('CalculateFlipProgress', state.waveAge, state.waveSpeed, c.ring, state.flipDuration);
      assert.ok(Math.abs(c.u - lu) < 1e-9, `u of (${c.col}, ${c.row}) must be the Lua's at age ${state.waveAge}`);
    }
    v = next;
    if (t > bound) assert.equal(v, 0, `V must be 0 after the bound ${bound} s`);
  }
  assert.equal(state.waveActive, false, 'the wave is over');
  // the reverse wave relaxes the same way, and a radius leaves the cells outside it where they were
  strike(state, { col: 8, row: 5 }, { radius: 2 });
  assert.equal(state.cells.filter(c => !c.inWave).length, 122, 'a ring radius of 2 reaches 13 cells: ring 0, ring 1 and the four orthogonal cells at exactly 2 (the diagonal blend is 2.41)');
  for (let i = 0; i < 120; i++) stepLightBeingLattice(state, null, dt);
  strike(state, { col: 8, row: 5 }, { radius: Math.SQRT2 * 2 + 1e-9, open: false });
  const outside = state.cells.filter(c => !c.inWave).length;
  assert.equal(outside, 110, 'a radius of 2 * sqrt(2) reaches the 25 cells at Chebyshev 2 or less');
  for (let i = 0; i < 120; i++) stepLightBeingLattice(state, null, dt);
  assert.equal(relaxation(state), 0);
  assert.ok(state.cells.filter(c => !c.inWave).every(c => c.open === 1), 'cells outside the radius stay open');
  assert.ok(state.cells.filter(c => c.inWave).every(c => c.open === 0), 'cells inside it closed');
});

test('invariant 5, zero plane: a plane at z = 0 never moves for any eye, and the stereo pair is 0 at z = 0 and stereoPixels at the reference depth, in the kernel and in the Lua', () => {
  const call = luaMath();
  for (const eye of FUZZ) {
    assert.equal(Math.abs(parallaxShift(eye, 0)), 0, `kernel ParallaxShift(${eye}, 0)`);
    assert.equal(Math.abs(call('ParallaxShift', eye, 0)), 0, `Lua ParallaxShift(${eye}, 0)`);
  }
  for (let px = 0; px <= 16; px++) {
    assert.equal(Math.abs(stereoPair(px, 0)), 0, `pair(${px}, 0)`);
    assert.ok(Math.abs(stereoPair(px, 0.5) - px) < 1e-12, 'at the reference depth the pair is stereoPixels');
  }
  assert.ok(stereoPair(4, -0.4) < 0 && stereoPair(4, 1.0) > 0, 'in front of the screen the pair crosses; behind it does not');
  for (const eye of [0.25, -0.25, 1]) for (const z of [0.5, 1.0, -0.4]) assert.ok(Math.abs(parallaxShift(eye, z) - call('ParallaxShift', eye, z)) < 1e-12);
});

test('the Four Floats the kernel reports are labelled evidence, never readings', () => {
  const state = makeLattice();
  const { floats } = stepLightBeingLattice(state, null, 0);
  assert.equal(floats.Lx.kind, 'not_measured');
  assert.equal(floats.Aq.kind, 'not_measured');
  assert.equal(floats.Vtx.kind, 'symbolic');
  assert.equal(floats.Pxd.kind, 'symbolic');
  for (const f of Object.values(floats)) assert.ok(typeof f.note === 'string' && f.note.length > 0, 'every float says what it is');
});
