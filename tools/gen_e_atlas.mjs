#!/usr/bin/env node
// tools/gen_e_atlas.mjs
// Zero-dependency Node ESM script to generate uncompressed 32-bit BGRA .tga texture assets
// for the FidelityEMatrix WoW AddOn prototype:
//   1. FidelityEMatrix/Media/Marshmallow_E_Closed.tga (128x128 RGBA, twice-folded puffy golden E-cube, alpha=255)
//   2. FidelityEMatrix/Media/Marshmallow_E_Window.tga (128x128 RGBA, outer golden bezel + punched alpha=0 window with CRT scanlines)
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
// 2. Marshmallow_E_Window.tga (128x128 32-bit BGRA)
// Puffy golden bezel rim (4px soft bezel, alpha=255) + inner transparent aperture
// with subtle CRT scanlines (alpha=24 max)
// ============================================================================
function generateWindowTexture() {
  const W = 128;
  const H = 128;
  const pixelData = Buffer.alloc(W * H * 4);

  // Bezel rim width: 4 pixels on 128px tile
  const BEZEL_WIDTH = 4.0;

  for (let y = 0; y < H; y++) {
    const v = (y / (H - 1)) * 2 - 1;
    for (let x = 0; x < W; x++) {
      const u = (x / (W - 1)) * 2 - 1;
      const idx = (y * W + x) * 4;

      // Distance from inner window edge
      const pxDist = Math.min(x, W - 1 - x, y, H - 1 - y);

      if (pxDist < BEZEL_WIDTH) {
        // Outer Puffy Golden Bezel Rim
        const t = pxDist / BEZEL_WIDTH; // 0 at outer edge, 1 at inner aperture
        const goldR = 255;
        const goldG = 215;
        const goldB = 120;

        // Soft iridescent bevel highlight
        const glint = Math.sin(t * Math.PI) * 40;

        pixelData[idx + 0] = Math.min(255, goldB + glint);
        pixelData[idx + 1] = Math.min(255, goldG + glint);
        pixelData[idx + 2] = Math.min(255, goldR + glint);
        pixelData[idx + 3] = 255; // Fully opaque golden bezel
      } else {
        // Inner Transparent Aperture (alpha = 0)
        // Subtle CRT scanline micro-grid for futuristic depth feel
        const isScanline = (y % 2 === 0);
        const scanlineAlpha = isScanline ? 24 : 0;

        pixelData[idx + 0] = 30; // B
        pixelData[idx + 1] = 20; // G
        pixelData[idx + 2] = 15; // R
        pixelData[idx + 3] = scanlineAlpha; // Transparent aperture
      }
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

const closedPath = path.join(mediaDir, 'Marshmallow_E_Closed.tga');
const windowPath = path.join(mediaDir, 'Marshmallow_E_Window.tga');
const nebulaPath = path.join(mediaDir, 'Backplate_Nebula.tga');

fs.writeFileSync(closedPath, closedTga);
fs.writeFileSync(windowPath, windowTga);
fs.writeFileSync(nebulaPath, nebulaTga);

console.log(`[gen_e_atlas] Generated: ${closedPath} (${closedTga.length} bytes)`);
console.log(`[gen_e_atlas] Generated: ${windowPath} (${windowTga.length} bytes)`);
console.log(`[gen_e_atlas] Generated: ${nebulaPath} (${nebulaTga.length} bytes)`);
