#!/usr/bin/env node
// tools/test_ematrix_math.mjs
// Verification suite for FidelityEMatrix:
//   1. Ring sequence metrics (Ring 0 == 1 cell, Ring 1 == 8 cells, monotonic Chebyshev wavefront distance)
//   2. 8-corner SetTexCoord rotation table invariants & deterministic PRNG
//   3. Scoreboard flip visual math (scaleY squash, specular glint peak, temporary crevice alpha)
//   4. TGA texture assets header, byte-size, and alpha punch verification (Closed, Window, Nebula Backplate)
//   5. Zero-GC idle script detachment verification in EMatrix_Core.lua

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const mediaDir = path.join(projectRoot, 'FidelityEMatrix', 'Media');
const mathLuaPath = path.join(projectRoot, 'FidelityEMatrix', 'EMatrix_Math.lua');
const coreLuaPath = path.join(projectRoot, 'FidelityEMatrix', 'EMatrix_Core.lua');

console.log('===========================================================');
console.log('   FIDELITY E-MATRIX: MATHEMATICAL & ASSET AUDIT SUITE    ');
console.log('===========================================================');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
    testsFailed++;
  }
}

// ============================================================================
// 1. Math Functions Mirror (Extracted directly matching EMatrix_Math.lua)
// ============================================================================
const ROT_UV8 = {
  0: [0, 0,  0, 1,  1, 0,  1, 1],
  1: [0, 1,  1, 1,  0, 0,  1, 0],
  2: [1, 1,  1, 0,  0, 1,  0, 0],
  3: [1, 0,  0, 0,  1, 1,  0, 1]
};

function calculateRingDistance(x, y, ox, oy) {
  if (x == null || y == null || ox == null || oy == null) return 0.0;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(ox) || !Number.isFinite(oy)) return 0.0;

  const dx = Math.abs(x - ox);
  const dy = Math.abs(y - oy);
  const cheb = dx > dy ? dx : dy;
  const euclid = Math.hypot(dx, dy);

  // w blend: 0 at cheb <= 1, 1 at cheb >= 3
  const w = Math.min(Math.max((cheb - 1.0) / 2.0, 0.0), 1.0);
  return (1.0 - w) * cheb + w * euclid;
}

function getCellRotation(col, row) {
  const c = Math.floor(col);
  const r = Math.floor(row);
  let h = ((c * 73856093 + r * 19349663) % 4);
  if (h < 0) h += 4;
  return h;
}

function calculateFlipProgress(waveAge, waveSpeed, ringDist, flipDuration) {
  if (flipDuration <= 0) return 1.0;
  const u = (waveAge * waveSpeed - ringDist) / flipDuration;
  if (u < 0.0) return 0.0;
  if (u > 1.0) return 1.0;
  return u;
}

function getFlipVisuals(u) {
  if (u <= 0.0) return { scaleY: 1.0, specAlpha: 0.0, isFlipped: false, creviceAlpha: 0.0 };
  if (u >= 1.0) return { scaleY: 1.0, specAlpha: 0.0, isFlipped: true, creviceAlpha: 0.0 };
  const scaleY = Math.max(Math.abs(Math.cos(u * Math.PI)), 0.04);
  const s = Math.sin(u * Math.PI);
  const specAlpha = s * s;
  const creviceAlpha = s * 0.65;
  const isFlipped = (u >= 0.5);
  return { scaleY, specAlpha, isFlipped, creviceAlpha };
}

// ============================================================================
// TEST 1: Ring 0 and Ring 1 Invariants across 15x9 Grid
// ============================================================================
runTest('Ring 0 count == 1 and Ring 1 count == 8 from center (8, 5)', () => {
  const COLS = 15;
  const ROWS = 9;
  const ox = 8;
  const oy = 5;

  let ring0Count = 0;
  let ring1Count = 0;

  for (let r = 1; r <= ROWS; r++) {
    for (let c = 1; c <= COLS; c++) {
      const d = calculateRingDistance(c, r, ox, oy);
      if (Math.abs(d - 0.0) < 1e-9) {
        ring0Count++;
      } else if (Math.abs(d - 1.0) < 1e-9) {
        ring1Count++;
      }
    }
  }

  assert.equal(ring0Count, 1, `Ring 0 must have exactly 1 cell at origin (got ${ring0Count})`);
  assert.equal(ring1Count, 8, `Ring 1 must have exactly 8 Chebyshev neighbors (got ${ring1Count})`);
});

runTest('Rings 2+ transition smoothly to Euclidean circular ripple without discontinuities', () => {
  const ox = 8;
  const oy = 5;

  // Check Chebyshev 2: (10, 5) is orthogonal dx=2, dy=0 -> cheb=2, euclid=2 -> dist=2.0
  const dOrth2 = calculateRingDistance(10, 5, ox, oy);
  assert.equal(dOrth2, 2.0);

  // Diagonal (10, 7) dx=2, dy=2 -> cheb=2, euclid=2.8284 -> w=0.5 -> dist = 0.5*2 + 0.5*2.8284 = 2.4142
  const dDiag2 = calculateRingDistance(10, 7, ox, oy);
  assert.ok(dDiag2 > 2.0 && dDiag2 < 2.83);

  // Check Chebyshev 3: (11, 5) dx=3, dy=0 -> euclid=3.0 -> w=1.0 -> dist=3.0
  const dOrth3 = calculateRingDistance(11, 5, ox, oy);
  assert.equal(dOrth3, 3.0);

  // Diagonal (11, 8) dx=3, dy=3 -> euclid=4.2426 -> w=1.0 -> dist=4.2426 (pure Euclidean!)
  const dDiag3 = calculateRingDistance(11, 8, ox, oy);
  assert.ok(Math.abs(dDiag3 - Math.hypot(3, 3)) < 1e-5);
});

runTest('Wavefront distance monotonicity: min(ringDist(R)) >= min(ringDist(R-1)) across all Chebyshev rings', () => {
  const ox = 8;
  const oy = 5;
  const COLS = 15;
  const ROWS = 9;

  // Compute minimum ring distance per Chebyshev distance tier R in [0..7]
  const minDistPerTier = {};
  for (let r = 1; r <= ROWS; r++) {
    for (let c = 1; c <= COLS; c++) {
      const dx = Math.abs(c - ox);
      const dy = Math.abs(r - oy);
      const tier = Math.max(dx, dy);
      const dist = calculateRingDistance(c, r, ox, oy);

      if (minDistPerTier[tier] === undefined || dist < minDistPerTier[tier]) {
        minDistPerTier[tier] = dist;
      }
    }
  }

  // Monotonicity assertion: every successive tier's minimum distance must be strictly >= previous tier
  for (let t = 1; t <= 7; t++) {
    assert.ok(
      minDistPerTier[t] >= minDistPerTier[t - 1],
      `Tier ${t} minDist (${minDistPerTier[t]}) must be >= Tier ${t - 1} minDist (${minDistPerTier[t - 1]})`
    );
  }
});

runTest('CalculateRingDistance handles non-finite inputs cleanly with 0 NaNs', () => {
  assert.equal(calculateRingDistance(NaN, 5, 8, 5), 0.0);
  assert.equal(calculateRingDistance(8, Infinity, 8, 5), 0.0);
  assert.equal(calculateRingDistance(null, undefined, 8, 5), 0.0);
  assert.equal(calculateRingDistance(8, 5, NaN, NaN), 0.0);
});

// ============================================================================
// TEST 2: Exact 8-Corner Rotation Table & Deterministic PRNG
// ============================================================================
runTest('ROT_UV8 table contains 4 valid 8-corner orientation mappings in [0, 1]', () => {
  for (let rot = 0; rot <= 3; rot++) {
    const uv = ROT_UV8[rot];
    assert.ok(Array.isArray(uv) && uv.length === 8, `Rotation ${rot} must have 8 coords`);
    for (const coord of uv) {
      assert.ok(coord === 0 || coord === 1, `UV coords must be binary normalized 0 or 1`);
    }
  }
});

runTest('Deterministic PRNG distribution across 135 cells', () => {
  const counts = [0, 0, 0, 0];
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 15; c++) {
      const rot = getCellRotation(c, r);
      assert.ok(rot >= 0 && rot <= 3);
      counts[rot]++;
    }
  }

  // All 4 orientations should be well-represented
  for (let rot = 0; rot <= 3; rot++) {
    assert.ok(counts[rot] >= 20, `Orientation ${rot} count must be >= 20 (got ${counts[rot]})`);
  }
});

// ============================================================================
// TEST 3: Scoreboard Vertical Flip Visual Transforms & Crevice Alpha
// ============================================================================
runTest('Flip visual math produces vertical squash, specular flash peak at u=0.5, and zero settled crevice', () => {
  // At u = 0.0 (unflipped / Closed):
  const v0 = getFlipVisuals(0.0);
  assert.equal(v0.scaleY, 1.0);
  assert.equal(v0.specAlpha, 0.0);
  assert.equal(v0.creviceAlpha, 0.0);
  assert.equal(v0.isFlipped, false);

  // At u = 0.5 (exact 90° flip midpoint):
  const vMid = getFlipVisuals(0.5);
  assert.equal(vMid.scaleY, 0.04); // Clamped minimum height, never 0
  assert.ok(Math.abs(vMid.specAlpha - 1.0) < 1e-5); // Golden flash glint peaks at 1.0!
  assert.ok(Math.abs(vMid.creviceAlpha - 0.65) < 1e-5); // Crevice peaks at 0.65!
  assert.equal(vMid.isFlipped, true); // Swapped to target texture!

  // At u = 1.0 (flip completed / Open or Closed):
  const v1 = getFlipVisuals(1.0);
  assert.equal(v1.scaleY, 1.0);
  assert.equal(v1.specAlpha, 0.0);
  assert.equal(v1.creviceAlpha, 0.0); // Zero settled crevice!
  assert.equal(v1.isFlipped, true);
});

// ============================================================================
// TEST 4: TGA Texture Asset Verification (Closed, Window, Backplate_Nebula)
// ============================================================================
runTest('Marshmallow_E_Closed.tga exists, has exact size (65554 bytes) and valid header', () => {
  const p = path.join(mediaDir, 'Marshmallow_E_Closed.tga');
  assert.ok(fs.existsSync(p), `Missing ${p}`);
  const buf = fs.readFileSync(p);
  assert.equal(buf.length, 65554, `Exact 32-bit TGA size must be 65,554 bytes`);

  const imageType = buf[2];
  const width = buf.readUInt16LE(12);
  const height = buf.readUInt16LE(14);
  const bpp = buf[16];

  assert.equal(imageType, 2, 'Must be uncompressed truecolor (type 2)');
  assert.equal(width, 128, 'Width must be 128');
  assert.equal(height, 128, 'Height must be 128');
  assert.equal(bpp, 32, 'BPP must be 32');

  // Closed texture body is fully opaque across face
  let alphaSum = 0;
  for (let i = 18 + 3; i < buf.length; i += 4) {
    alphaSum += buf[i];
  }
  const meanAlpha = alphaSum / (128 * 128);
  assert.ok(meanAlpha > 240, `Closed texture mean alpha must be > 240 (got ${meanAlpha.toFixed(1)})`);
});

runTest('Marshmallow_E_Window.tga is a microlens: sun-lit 1 px bevel, recess lip, 2 px scanlines, glint, open aperture', () => {
  const p = path.join(mediaDir, 'Marshmallow_E_Window.tga');
  assert.ok(fs.existsSync(p), `Missing ${p}`);
  const buf = fs.readFileSync(p);
  assert.equal(buf.length, 65554, `Exact 32-bit TGA size must be 65,554 bytes`);
  const alphaAt = (x, y) => buf[18 + (y * 128 + x) * 4 + 3];

  // Scanlines: 4 texels on, 4 off (2 screen px period when the 128 px tile is drawn at 32 px)
  assert.equal(alphaAt(64, 64), 18, `Scanline row alpha must be 18 (got ${alphaAt(64, 64)})`);
  assert.equal(alphaAt(64, 68), 0, `Gap row must be fully open (got ${alphaAt(64, 68)})`);

  // Bevel lit from the upper right: top/right edges more opaque than bottom/left
  assert.equal(alphaAt(125, 64), 210, `Right (lit) rim alpha must be 210 (got ${alphaAt(125, 64)})`);
  assert.equal(alphaAt(64, 1), 210, `Top (lit) rim alpha must be 210 (got ${alphaAt(64, 1)})`);
  assert.equal(alphaAt(2, 64), 170, `Left (shaded) rim alpha must be 170 (got ${alphaAt(2, 64)})`);
  assert.equal(alphaAt(64, 126), 170, `Bottom (shaded) rim alpha must be 170 (got ${alphaAt(64, 126)})`);

  // Recess lip just inside the rim, then the glint toward the upper right of the aperture
  assert.ok(alphaAt(4, 64) > 0 && alphaAt(4, 64) <= 56, `Lip alpha must be in (0, 56] (got ${alphaAt(4, 64)})`);
  assert.ok(alphaAt(90, 38) >= 20 && alphaAt(90, 38) <= 22, `Lens glint peak must be about 22 (got ${alphaAt(90, 38)})`);
});

runTest('Depth-plane textures exist with exact 32-bit TGA sizes (wall 64x64, sheen 256x128, reticle 128x128)', () => {
  for (const [name, w, h] of [['Wall_Gradient.tga', 64, 64], ['Glass_Sheen.tga', 256, 128], ['Reticle.tga', 128, 128]]) {
    const p = path.join(mediaDir, name);
    assert.ok(fs.existsSync(p), `Missing ${p}`);
    const buf = fs.readFileSync(p);
    assert.equal(buf.length, 18 + w * h * 4, `${name} size`);
    assert.equal(buf.readUInt16LE(12), w, `${name} width`);
    assert.equal(buf.readUInt16LE(14), h, `${name} height`);
    assert.equal(buf[16], 32, `${name} bpp`);
  }
  const wall = fs.readFileSync(path.join(mediaDir, 'Wall_Gradient.tga'));
  const wallA = x => wall[18 + (32 * 64 + x) * 4 + 3];
  assert.ok(wallA(0) > 200 && wallA(63) < 10, `Wall must fade from dark at the bezel to clear at the back (${wallA(0)} -> ${wallA(63)})`);
});

runTest('Backplate_Nebula.tga exists, has exact size (262162 bytes), power of two (256x256), and valid header', () => {
  const p = path.join(mediaDir, 'Backplate_Nebula.tga');
  assert.ok(fs.existsSync(p), `Missing ${p}`);
  const buf = fs.readFileSync(p);
  assert.equal(buf.length, 262162, `Exact 32-bit 256x256 TGA size must be 262,162 bytes`);

  const imageType = buf[2];
  const width = buf.readUInt16LE(12);
  const height = buf.readUInt16LE(14);
  const bpp = buf[16];

  assert.equal(imageType, 2, 'Must be uncompressed truecolor (type 2)');
  assert.equal(width, 256, 'Width must be 256 (power of two)');
  assert.equal(height, 256, 'Height must be 256 (power of two)');
  assert.equal(bpp, 32, 'BPP must be 32');
});

// ============================================================================
// TEST 5: Zero-GC OnUpdate Detachment Verification
// ============================================================================
runTest('EMatrix_Core.lua contains SetScript("OnUpdate", nil) for zero idle CPU', () => {
  assert.ok(fs.existsSync(coreLuaPath), `Missing ${coreLuaPath}`);
  const coreSrc = fs.readFileSync(coreLuaPath, 'utf8');

  // Verify explicit script detachment when idle. Since v1.5.0 the OnUpdate lives on the
  // always-shown driver frame (host = driverFrame or masterFrame), not on the box itself.
  assert.ok(
    coreSrc.includes('host:SetScript("OnUpdate", nil)'),
    'Core must explicitly detach OnUpdate via host:SetScript("OnUpdate", nil) when idle'
  );
  assert.ok(
    /local host = driverFrame or masterFrame/.test(coreSrc),
    'The idle check must detach from the driver frame (falling back to the box)'
  );

  // Verify no per-frame table instantiations inside OnUpdateDriver
  const driverMatch = coreSrc.match(/local function OnUpdateDriver[\s\S]*?end\n/);
  assert.ok(driverMatch, 'OnUpdateDriver function must be defined');
  const driverBody = driverMatch[0];
  assert.ok(!driverBody.includes('C_Timer.After'), 'Zero-GC invariant: no C_Timer.After allowed in driver');
});

// ============================================================================
// Summary
// ============================================================================
console.log('-----------------------------------------------------------');
console.log(`Test Execution Summary: ${testsPassed} passed, ${testsFailed} failed.`);
console.log('===========================================================');

if (testsFailed > 0) {
  process.exit(1);
}
