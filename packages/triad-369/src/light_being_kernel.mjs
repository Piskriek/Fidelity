// light_being_kernel.mjs - The Light Being lattice kernel: Argon's operator T(W, g, s) reduced to
// what this checkout can state honestly (council round 2026-11-04-operator). Pure math: no host,
// no clock of its own, no file.
//
// What it is. The 15 x 9 lattice of FidelityEMatrix as a state machine. Each cell carries a fixed
// orientation R (the same hash the addon draws), a ring distance from the last strike (the
// 1 -> 8 -> circular metric), a flip progress u in [0, 1] (the flip clock, in seconds) and an
// aperture that moves from where it was to its target as u rises. A strike is a click-born wave;
// a step advances the clock. The steering vector s is accepted, clamped to the unit disc and
// recorded; it drives nothing yet, because no named source emits one.
//
// What it refuses to claim. There is no weight block W (R is a hash of the cell's position), no
// gradient g (neither host computes a loss), no precision Pi, no E_psi. The Four Floats it reports
// are labelled evidence (symbolic or not_measured), never readings. Non-finite input is rejected
// and reported, not coerced into a number.
//
// Every formula here mirrors FidelityEMatrix/EMatrix_Math.lua; tools/light-being-kernel.test.mjs
// drives the Lua through fengari and asserts the two agree.
import { symbolic, notMeasured } from './evidence.mjs';

export const COLS = 15;
export const ROWS = 9;
export const WAVE_SPEED = 16.0;     // cells per second (EMatrix_Core DEFAULTS.waveSpeed)
export const FLIP_DURATION = 0.26;  // seconds per cell flip (DEFAULTS.flipDuration)
export const STEREO_REF_Z = 0.5;    // the depth at which the pair offset equals stereoPixels (EMatrix_World)

const finite = Number.isFinite;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** The cell's fixed orientation in {0, 1, 2, 3}: EMatrix_Math.GetCellRotation, computed in doubles. */
export function cellRotation(col, row) {
  if (!finite(col) || !finite(row)) return 0;
  const c = Math.floor(col), r = Math.floor(row);
  const a = (c * 73856093.0) % 1000003;
  let h = ((a * 19349663.0 + r * 83492791.0) % 1000003) % 4;
  if (h < 0) h += 4;
  return h;
}

/** The 1 -> 8 -> circular wave metric: EMatrix_Math.CalculateRingDistance. */
export function ringDistance(x, y, ox, oy) {
  if (![x, y, ox, oy].every(finite)) return 0;
  const dx = Math.abs(x - ox), dy = Math.abs(y - oy);
  const cheb = dx > dy ? dx : dy;
  const euclid = Math.sqrt(dx * dx + dy * dy);
  const w = clamp((cheb - 1.0) / 2.0, 0.0, 1.0);
  return (1.0 - w) * cheb + w * euclid;
}

/** Flip progress u in [0, 1]: EMatrix_Math.CalculateFlipProgress, in seconds. Non-finite input gives 0. */
export function flipProgress(waveAge, waveSpeed, ringDist, flipDuration) {
  if (![waveAge, waveSpeed, ringDist, flipDuration].every(finite)) return 0;
  if (flipDuration <= 0) return 1;
  if (waveSpeed <= 0) return 0;
  const u = (waveAge - ringDist / waveSpeed) / flipDuration;
  return u < 0 ? 0 : u > 1 ? 1 : u;
}

/** Parallax of a plane at depth z for an eye offset: EMatrix_Math.ParallaxShift. Exactly 0 at z = 0. */
export function parallaxShift(eye, z) {
  if (!finite(eye) || !finite(z)) return 0;
  z = clamp(z, -0.9, 4.0);
  return eye * z / (1.0 + z);
}

/** The stereo pair offset of a plane at depth z (EMatrix_World.Layout): 0 at z = 0, px at the reference depth. */
export function stereoPair(px, z, refZ = STEREO_REF_Z) {
  if (!finite(px)) return 0;
  return px * parallaxShift(1, z) / parallaxShift(1, refZ);
}

/** The steering vector clamped to the unit disc. A non-finite component is rejected: treated as 0 and reported. */
export function clampSteering(sVec) {
  const rejected = [];
  const okX = sVec != null && finite(sVec.x), okY = sVec != null && finite(sVec.y);
  if (sVec != null && !(okX && okY)) rejected.push('s');
  let x = okX ? sVec.x : 0, y = okY ? sVec.y : 0;
  const n = Math.hypot(x, y);
  const clamped = n > 1;
  if (clamped) { x /= n; y /= n; }
  return { s: { x, y }, clamped, rejected };
}

/** Alignment of the steering with a cell's orientation: dot(unit s, unit w), w at angle R * pi / 2. 0 without steering. Geometry only; no source is claimed. */
export function alignment(sVec, R) {
  const { s } = clampSteering(sVec);
  const n = Math.hypot(s.x, s.y);
  if (n === 0 || !finite(R)) return 0;
  const angle = (((Math.floor(R) % 4) + 4) % 4) * Math.PI / 2;
  return clamp((s.x * Math.cos(angle) + s.y * Math.sin(angle)) / n, -1, 1);
}

/** A lattice at rest: every cell closed, no wave, no steering. */
export function makeLattice({ cols = COLS, rows = ROWS, waveSpeed = WAVE_SPEED, flipDuration = FLIP_DURATION } = {}) {
  const cells = [];
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      cells.push({ index: (row - 1) * cols + col, col, row, R: cellRotation(col, row), ring: null, inWave: false, u: 0, from: 0, target: 0, open: 0 });
    }
  }
  return { cols, rows, waveSpeed, flipDuration, waveAge: 0, waveActive: false, open: false, origin: null, radius: Infinity, s: { x: 0, y: 0 }, cells };
}

/**
 * A click-born wave from a cell. Every cell within `radius` (ring distance; Infinity = the whole
 * lattice, which is what the addon does today) takes the new target and flips as the front
 * reaches it; the others keep their state. `open` defaults to the opposite of the last strike,
 * the addon's toggle. A bad origin or radius is rejected and changes nothing.
 */
export function strike(state, origin, { radius = Infinity, open } = {}) {
  const ox = origin != null && finite(origin.col) ? Math.round(origin.col) : NaN;
  const oy = origin != null && finite(origin.row) ? Math.round(origin.row) : NaN;
  if (!finite(ox) || !finite(oy) || ox < 1 || ox > state.cols || oy < 1 || oy > state.rows) return { state, rejected: ['origin'] };
  if (Number.isNaN(radius) || radius < 0) return { state, rejected: ['radius'] };
  const target = open === undefined ? !state.open : Boolean(open);
  state.open = target;
  state.origin = { col: ox, row: oy };
  state.radius = radius;
  state.waveAge = 0;
  state.waveActive = true;
  for (const cell of state.cells) {
    cell.ring = ringDistance(cell.col, cell.row, ox, oy);
    if (cell.ring <= radius) {
      cell.inWave = true;
      cell.from = cell.open;
      cell.target = target ? 1 : 0;
      cell.u = 0;
    } else {
      cell.inWave = false;
    }
  }
  return { state, rejected: [] };
}

/** The Four Floats as the lattice can honestly report them: labelled evidence, never readings. */
export function floats(state) {
  return {
    Pxd: symbolic(state.cols * state.rows, 'the lattice size in cells, not a resolution reading'),
    Vtx: symbolic(state.waveAge, 'the wave clock in seconds since the last strike, not a measurement'),
    Lx: notMeasured('no gradient source in this checkout: the glint is a timing term of the flip, not a precision'),
    Aq: notMeasured('no gradient phase: the rainbow is baked from the surface normal in the atlas'),
  };
}

/**
 * One step of the operator. `sVec` is {x, y} or null; `dt` is seconds. The clock advances only
 * while a wave runs, so the age never overflows. A non-finite or negative dt is rejected and the
 * state is left exactly as it was; a non-finite steering component is rejected and read as 0.
 */
export function stepLightBeingLattice(state, sVec, dt) {
  const steer = clampSteering(sVec);
  const rejected = steer.rejected.slice();
  if (!finite(dt) || dt < 0) {
    rejected.push('dt');
    return { state, rejected, floats: floats(state) };
  }
  state.s = steer.s;
  if (state.waveActive) {
    state.waveAge += dt;
    let active = false;
    for (const cell of state.cells) {
      if (!cell.inWave) continue;
      const u = flipProgress(state.waveAge, state.waveSpeed, cell.ring, state.flipDuration);
      cell.u = u;
      cell.open = cell.from + (cell.target - cell.from) * u;
      if (u < 1) active = true;
    }
    state.waveActive = active;
  }
  return { state, rejected, floats: floats(state) };
}

/** V = sum |aperture - target|: 0 when every cell has settled where the last strike sent it. */
export function relaxation(state) {
  let v = 0;
  for (const cell of state.cells) v += Math.abs(cell.open - cell.target);
  return v;
}
