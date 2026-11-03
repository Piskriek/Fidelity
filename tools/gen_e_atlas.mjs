#!/usr/bin/env node
// tools/gen_e_atlas.mjs
// Zero-dependency Node ESM script to generate uncompressed 32-bit BGRA .tga texture assets
// for the FidelityEMatrix WoW AddOn prototype:
//   1. FidelityEMatrix/Media/Marshmallow_E_Closed.tga (128x128 RGBA, twice-folded puffy golden E-cube, alpha=255)
//   2. FidelityEMatrix/Media/Marshmallow_E_Window.tga (128x128 RGBA, 1 px sun-lit bevel, recess lip, lens glint, 2 px scanlines)
//   2b-2d. Wall_Gradient.tga (64x64), Glass_Sheen.tga (256x128), Reticle.tga (128x128): the depth planes
//   3. FidelityEMatrix/Media/Backplate_Nebula.tga (256x256 RGBA, deep cosmic nebula starfield for 3D depth chamber)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const mediaDir = path.join(projectRoot, 'FidelityEMatrix', 'Media');

if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

/**
 * Creates an uncompressed 32-bit Truevision TGA buffer (BGRA).
 * Header: 18 bytes.
 * Width x Height x 4 bytes.
 */
function createTgaBuffer(pixelData, width, height) {
  const header = Buffer.alloc(18);
  header[0] = 0;                     // ID length
  header[1] = 0;                     // Color map type
  header[2] = 2;                     // Image type: uncompressed true-color
  header[8] = 0;                     // X-origin (LE)
  header[9] = 0;
  header[10] = 0;                    // Y-origin (LE)
  header[11] = 0;
  header[12] = width & 0xff;         // Width LE
  header[13] = (width >> 8) & 0xff;
  header[14] = height & 0xff;        // Height LE
  header[15] = (height >> 8) & 0xff;
  header[16] = 32;                   // 32 bits per pixel
  header[17] = 0x28;                 // 0x20 = top-to-bottom raster order, 0x08 = 8 alpha bits (0x28 total)

  return Buffer.concat([header, pixelData]);
}

/**
 * 2D Signed Distance Function for a rounded rectangle.
 * Centered at (cx, cy) with half-extents (hx, hy) and corner radius r.
 */
function sdRoundBox(px, py, cx, cy, hx, hy, r) {
  const qx = Math.abs(px - cx) - (hx - r);
  const qy = Math.abs(py - cy) - (hy - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const outside = Math.hypot(ox, oy);
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - r;
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 */
function createPrng(seed = 1337) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// 1. Marshmallow_E_Closed.tga (128x128 32-bit BGRA)
// Full-bleed cushion tile (0px black border) with bold 3D twice-folded "E"
// ============================================================================
function getMarshmallowEHeight(u, v) {
  // u, v in [-1, 1]
  // Outer cushion boundary: fills [-1, 1] with soft 0.08 edge bevel
  const dOuter = sdRoundBox(u, v, 0, 0, 0.98, 0.98, 0.08);
  if (dOuter > 0) return 0.0;

  // Base pillow height field
  const cushionH = Math.sqrt(Math.max(0, 1.0 - Math.pow(Math.max(dOuter + 0.12, 0) / 0.12, 2.0)));

  // "E" Anatomy in [-1, 1]:
  // 1. Vertical Spine: x in [-0.85, -0.32], y in [-0.85, 0.85]
  const dSpine = sdRoundBox(u, v, -0.58, 0.0, 0.27, 0.85, 0.12);
  // 2. Top Horizontal Lobe: x in [-0.85, 0.85], y in [-0.85, -0.38]
  const dTop = sdRoundBox(u, v, 0.0, -0.62, 0.85, 0.23, 0.12);
  // 3. Middle Horizontal Lobe: x in [-0.85, 0.65], y in [-0.20, 0.20]
  const dMid = sdRoundBox(u, v, -0.10, 0.0, 0.75, 0.20, 0.12);
  // 4. Bottom Horizontal Lobe: x in [-0.85, 0.85], y in [0.38, 0.85]
  const dBot = sdRoundBox(u, v, 0.0, 0.62, 0.85, 0.23, 0.12);

  const dLobeUnion = Math.min(dSpine, dTop, dMid, dBot);

  // Fold Channel 1 (between top and middle bar): y in [-0.48, -0.25], x > -0.35
  const dFold1 = sdRoundBox(u, v, 0.25, -0.35, 0.60, 0.10, 0.06);
  // Fold Channel 2 (between middle and bottom bar): y in [0.25, 0.48], x > -0.35
  const dFold2 = sdRoundBox(u, v, 0.25, 0.35, 0.60, 0.10, 0.06);

  // Height embossing
  let lobeH = Math.max(0, 1.0 - Math.max(dLobeUnion, 0) / 0.28);
  lobeH = Math.sin(lobeH * Math.PI * 0.5);

  // Deep crease in the two fold channels
  let creaseDepth = 0.0;
  if (dFold1 < 0.05) creaseDepth = Math.max(creaseDepth, (0.05 - dFold1) / 0.10);
  if (dFold2 < 0.05) creaseDepth = Math.max(creaseDepth, (0.05 - dFold2) / 0.10);
  creaseDepth = Math.min(creaseDepth, 1.0);

  const h = Math.max(0.04, cushionH * 0.55 + lobeH * 0.45 - creaseDepth * 0.42);
  return Math.min(Math.max(h, 0.0), 1.0);
}

function generateClosedTexture() {
  const W = 128;
  const H = 128;
  const pixelData = Buffer.alloc(W * H * 4);

  // Key light direction (top-left angled towards viewer)
  const lx = -0.45;
  const ly = -0.55;
  const lz = 0.70;
  const lLen = Math.hypot(lx, ly, lz);
  const nlx = lx / lLen;
  const nly = ly / lLen;
  const nlz = lz / lLen;

  for (let y = 0; y < H; y++) {
    const v = (y / (H - 1)) * 2 - 1; // [-1, 1]
    for (let x = 0; x < W; x++) {
      const u = (x / (W - 1)) * 2 - 1; // [-1, 1]
      const idx = (y * W + x) * 4;

      const h = getMarshmallowEHeight(u, v);

      // Compute normal via central differences
      const eps = 2.0 / 128.0;
      const hR = getMarshmallowEHeight(u + eps, v);
      const hL = getMarshmallowEHeight(u - eps, v);
      const hD = getMarshmallowEHeight(u, v + eps);
      const hU = getMarshmallowEHeight(u, v - eps);

      const dx = (hR - hL) * 2.5;
      const dy = (hD - hU) * 2.5;
      const dz = 1.0;
      const nLen = Math.hypot(dx, dy, dz);
      const nx = -dx / nLen;
      const ny = -dy / nLen;
      const nz = dz / nLen;

      // Diffuse lighting
      const ndotl = Math.max(nx * nlx + ny * nly + nz * nlz, 0.0);

      // Specular highlight (Blinn-Phong)
      const vx = 0.0, vy = 0.0, vz = 1.0;
      const hx = nlx + vx, hy = nly + vy, hz = nlz + vz;
      const hLen = Math.hypot(hx, hy, hz);
      const nhx = hx / hLen, nhy = hy / hLen, nhz = hz / hLen;
      const ndoth = Math.max(nx * nhx + ny * nhy + nz * nhz, 0.0);
      const spec = Math.pow(ndoth, 24.0);

      // Pastel-rainbow iridescent ramp based on surface normal angle
      const iridPhase = (nx * 0.35 + ny * 0.35 + (1.0 - nz) * 0.30) + 0.15;
      const iridR = 0.5 + 0.5 * Math.cos(6.28318 * (iridPhase + 0.00));
      const iridG = 0.5 + 0.5 * Math.cos(6.28318 * (iridPhase + 0.33));
      const iridB = 0.5 + 0.5 * Math.cos(6.28318 * (iridPhase + 0.67));

      // 24k Warm Gold Diffuse Base
      const goldR = 255;
      const goldG = 212;
      const goldB = 115;

      // Fold ambient occlusion: creased regions receive deep warm bronze shadow
      const ao = Math.pow(h, 0.55);

      // Color composition
      const ambientR = goldR * 0.28 * ao;
      const ambientG = goldG * 0.26 * ao;
      const ambientB = goldB * 0.20 * ao;

      const diffFactor = 0.45 * ndotl;
      const iridMixR = (goldR * 0.75 + iridR * 255 * 0.25) * diffFactor;
      const iridMixG = (goldG * 0.75 + iridG * 255 * 0.25) * diffFactor;
      const iridMixB = (goldB * 0.75 + iridB * 255 * 0.25) * diffFactor;

      // Specular highlight: gleaming warm platinum-gold
      const specR = 255 * spec * 0.85;
      const specG = 248 * spec * 0.85;
      const specB = 210 * spec * 0.85;

      // Cushion outer rim bevel glint
      const rim = Math.pow(1.0 - Math.max(nz, 0), 2.5) * 45;

      const finalR = Math.min(255, Math.round(ambientR + iridMixR + specR + rim));
      const finalG = Math.min(255, Math.round(ambientG + iridMixG + specG + rim));
      const finalB = Math.min(255, Math.round(ambientB + iridMixB + specB + rim));

      // Full-bleed alpha: 255 across body, soft 1px contact fade at the very perimeter
      const distFromCenter = Math.max(Math.abs(u), Math.abs(v));
      const alphaVal = distFromCenter > 0.99 ? Math.round((1.0 - distFromCenter) / 0.01 * 255) : 255;

      pixelData[idx + 0] = finalB; // B
      pixelData[idx + 1] = finalG; // G
      pixelData[idx + 2] = finalR; // R
      pixelData[idx + 3] = Math.max(alphaVal, 220); // Always opaque
    }
  }

  return createTgaBuffer(pixelData, W, H);
}

// ============================================================================
// 2. Marshmallow_E_Window.tga (128x128 32-bit BGRA): one microlens of the open array.
// The tile is drawn at 32 px, so 4 texels = 1 screen pixel. Light comes from the UPPER RIGHT
// (the owner's single-sun rule): top and right rim edges are lit gold, bottom and left bronze.
//   rim:        4 texels (1 px) bevel, alpha 210 lit / 170 shaded
//   inner lip:  4 texels (1 px) recess shadow inside the rim, alpha <= 56
//   scanlines:  4 texels on / 4 off (2 px period on screen, survives mipmapping), alpha 18
//   lens glint: soft spot toward the upper right of the aperture, alpha <= 22
//   aperture:   alpha 0 elsewhere (the 3D scene shows through)
// ============================================================================
function generateWindowTexture() {
  const W = 128;
  const H = 128;
  const pixelData = Buffer.alloc(W * H * 4);
  const RIM = 4;
  const LIP = 4;

  const put = (idx, r, g, b, a) => {
    pixelData[idx + 0] = Math.max(0, Math.min(255, Math.round(b)));
    pixelData[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
    pixelData[idx + 2] = Math.max(0, Math.min(255, Math.round(r)));
    pixelData[idx + 3] = Math.max(0, Math.min(255, Math.round(a)));
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const dl = x, dr = W - 1 - x, dt = y, db = H - 1 - y;
      const pxDist = Math.min(dl, dr, dt, db);

      if (pxDist < RIM) {
        // The nearest edge decides lit (top / right) or shaded (bottom / left); ties at the
        // upper-right and lower-left corners go to lit and shaded respectively.
        const lit = Math.min(dt, dr) <= Math.min(dl, db);
        const t = pxDist / RIM;
        const glint = Math.sin(t * Math.PI) * 30;
        if (lit) put(idx, 255, 220 + glint * 0.6, 130 + glint, 210);
        else put(idx, 150, 112, 58, 170);
      } else if (pxDist < RIM + LIP) {
        // Recess shadow just inside the rim: the lens sits below the bezel surface
        const fall = 1 - (pxDist - RIM) / LIP;
        put(idx, 6, 5, 10, 56 * fall);
      } else {
        const scan = (y % 8) < 4 ? 18 : 0;
        const gx = x - 90, gy = y - 38;
        const glintA = 22 * Math.exp(-(gx * gx + gy * gy) / (2 * 9 * 9));
        if (glintA > 1) put(idx, 255, 250, 235, Math.max(scan, glintA));
        else put(idx, 15, 20, 30, scan);
      }
    }
  }

  return createTgaBuffer(pixelData, W, H);
}

// ============================================================================
// 2b. Wall_Gradient.tga (64x64): one inner wall of the depth box, dark at the bezel (x = 0) and
// fading toward the back (x = 63), with cyan depth ribs bunching toward the back like a receding
// holodeck grid. Mid-tone so SetVertexColor can light it: walls facing the upper-right sun bright,
// the others in shade. Rotated per wall with SetTexCoord.
// ============================================================================
function generateWallTexture() {
  const W = 64, H = 64;
  const pixelData = Buffer.alloc(W * H * 4);
  const ribs = [];
  for (let k = 1; k <= 6; k++) ribs.push(63 * (1 - 1 / (1 + 0.45 * k)));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const t = x / (W - 1);
      const shade = 215 * Math.pow(1 - t, 1.4);
      let rib = 0;
      for (const rx of ribs) rib = Math.max(rib, Math.max(0, 1 - Math.abs(x - rx) / 0.9));
      const ribA = rib * 90 * (1 - t * 0.5);
      if (ribA > shade * 0.25) {
        pixelData[idx + 0] = 204; pixelData[idx + 1] = 255; pixelData[idx + 2] = 120;
        pixelData[idx + 3] = Math.round(Math.max(ribA, shade * 0.6));
      } else {
        pixelData[idx + 0] = 150; pixelData[idx + 1] = 120; pixelData[idx + 2] = 105; // mid tone: tinted per wall
        pixelData[idx + 3] = Math.round(shade);
      }
    }
  }
  return createTgaBuffer(pixelData, W, H);
}

// ============================================================================
// 2c. Glass_Sheen.tga (256x128): two soft diagonal reflection bands on the cover glass, drawn
// with ADD blend in front of the bezel so the eye registers a pane between it and the scene.
// Black is transparent under ADD; brightness is the sheen.
// ============================================================================
function generateSheenTexture() {
  const W = 256, H = 128;
  const pixelData = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const u = x / (W - 1), v = y / (H - 1);
      const d1 = (u - 0.32) + (v - 0.5) * 0.55;
      const d2 = (u - 0.47) + (v - 0.5) * 0.55;
      const a = 46 * Math.exp(-((d1 / 0.07) ** 2)) + 26 * Math.exp(-((d2 / 0.018) ** 2));
      const edge = Math.min(1, Math.min(u, 1 - u, v, 1 - v) * 8);
      const val = Math.round(Math.min(255, a) * edge);
      pixelData[idx + 0] = val; pixelData[idx + 1] = val; pixelData[idx + 2] = val; pixelData[idx + 3] = 255;
    }
  }
  return createTgaBuffer(pixelData, W, H);
}

// ============================================================================
// 2d. Reticle.tga (128x128): the pop-out plane (z = -0.4): a thin cyan ring, a dashed inner
// ring and four ticks, floating in front of the screen. White, tinted in the client per eye.
// ============================================================================
function generateReticleTexture() {
  const W = 128, H = 128;
  const pixelData = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const u = (x - 63.5) / 63.5, v = (y - 63.5) / 63.5;
      const r = Math.hypot(u, v);
      const ang = Math.atan2(v, u);
      let a = 160 * Math.max(0, 1 - Math.abs(r - 0.86) / 0.018);
      const dash = (Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 24) % 2) === 0;
      if (dash) a = Math.max(a, 90 * Math.max(0, 1 - Math.abs(r - 0.66) / 0.014));
      const onAxis = Math.abs(u) < 0.012 || Math.abs(v) < 0.012;
      if (onAxis && r > 0.74 && r < 0.98) a = Math.max(a, 150);
      pixelData[idx + 0] = 255; pixelData[idx + 1] = 255; pixelData[idx + 2] = 255; // white: tinted per eye with SetVertexColor
      pixelData[idx + 3] = Math.round(a);
    }
  }
  return createTgaBuffer(pixelData, W, H);
}

// ============================================================================
// 3. Backplate_Nebula.tga (256x256 32-bit BGRA)
// Deep cosmic nebula starfield for 3D multi-plane depth chamber
// ============================================================================
function generateNebulaBackplate() {
  const W = 256;
  const H = 256;
  const pixelData = Buffer.alloc(W * H * 4);
  const prng = createPrng(4242);

  // Pre-generate 120 deterministic stars
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.floor(prng() * W),
      y: Math.floor(prng() * H),
      brightness: 0.4 + prng() * 0.6,
      radius: prng() < 0.2 ? 1.5 : 0.8
    });
  }

  for (let y = 0; y < H; y++) {
    const ny = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const nx = x / (W - 1);
      const idx = (y * W + x) * 4;

      // Base navy-to-violet cosmic gradient
      const gradR = 8 + ny * 22;   // 8..30
      const gradG = 10 + ny * 14;  // 10..24
      const gradB = 28 + ny * 45;  // 28..73

      // Procedural nebula cloud noise (harmonic sine waves)
      const n1 = Math.sin(nx * 6.28 + Math.cos(ny * 5.0) * 1.5) * 0.5 + 0.5;
      const n2 = Math.cos(nx * 12.0 - ny * 8.0) * 0.5 + 0.5;
      const nebula = Math.pow((n1 * 0.6 + n2 * 0.4), 2.2);

      const nebR = nebula * 55;
      const nebG = nebula * 25;
      const nebB = nebula * 75;

      // Radial vignette (darker towards perimeter)
      const cx = nx - 0.5;
      const cy = ny - 0.5;
      const distFromCenter = Math.hypot(cx, cy) / 0.707;
      const vignette = Math.max(0, 1.0 - Math.pow(distFromCenter, 2.0) * 0.55);

      let r = (gradR + nebR) * vignette;
      let g = (gradG + nebG) * vignette;
      let b = (gradB + nebB) * vignette;

      // Starfield contribution
      for (let s = 0; s < stars.length; s++) {
        const star = stars[s];
        const dx = x - star.x;
        const dy = y - star.y;
        const d = Math.hypot(dx, dy);
        if (d < star.radius * 2.0) {
          const starGlint = Math.max(0, 1.0 - d / (star.radius * 2.0)) * star.brightness * 255;
          r += starGlint * 0.9;
          g += starGlint * 0.95;
          b += starGlint * 1.0;
        }
      }

      pixelData[idx + 0] = Math.min(255, Math.round(b)); // B
      pixelData[idx + 1] = Math.min(255, Math.round(g)); // G
      pixelData[idx + 2] = Math.min(255, Math.round(r)); // R
      pixelData[idx + 3] = 255; // Opaque cosmic backdrop
    }
  }

  return createTgaBuffer(pixelData, W, H);
}

// Generate all textures
const closedTga = generateClosedTexture();
const windowTga = generateWindowTexture();
const nebulaTga = generateNebulaBackplate();
const extraTextures = [
  ['Wall_Gradient.tga', generateWallTexture()],
  ['Glass_Sheen.tga', generateSheenTexture()],
  ['Reticle.tga', generateReticleTexture()],
];

const closedPath = path.join(mediaDir, 'Marshmallow_E_Closed.tga');
const windowPath = path.join(mediaDir, 'Marshmallow_E_Window.tga');
const nebulaPath = path.join(mediaDir, 'Backplate_Nebula.tga');

fs.writeFileSync(closedPath, closedTga);
fs.writeFileSync(windowPath, windowTga);
fs.writeFileSync(nebulaPath, nebulaTga);

console.log(`[gen_e_atlas] Generated: ${closedPath} (${closedTga.length} bytes)`);
console.log(`[gen_e_atlas] Generated: ${windowPath} (${windowTga.length} bytes)`);
console.log(`[gen_e_atlas] Generated: ${nebulaPath} (${nebulaTga.length} bytes)`);
for (const [name, buf] of extraTextures) {
  const p = path.join(mediaDir, name);
  fs.writeFileSync(p, buf);
  console.log(`[gen_e_atlas] Generated: ${p} (${buf.length} bytes)`);
}
