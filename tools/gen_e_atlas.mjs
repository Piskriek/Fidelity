#!/usr/bin/env node
// tools/gen_e_atlas.mjs
// Zero-dependency Node ESM script to generate uncompressed 32-bit BGRA .tga texture assets
// for the FidelityEMatrix WoW AddOn prototype:
//   1. FidelityEMatrix/Media/Marshmallow_E_Closed.tga (128x128 RGBA, twice-folded puffy golden E cube, alpha=255)
//   2. FidelityEMatrix/Media/Marshmallow_E_Window.tga (128x128 RGBA, outer golden bezel + punched alpha=0 window with CRT scanlines)

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

const WIDTH = 128;
const HEIGHT = 128;
const BPP = 32;

/**
 * Creates an uncompressed 32-bit Truevision TGA buffer (BGRA).
 * Header size: 18 bytes.
 * Image data: WIDTH * HEIGHT * 4 bytes.
 * Total size: 65,554 bytes.
 */
function createTgaBuffer(pixelData) {
  const header = Buffer.alloc(18);
  header[0] = 0;          // ID length
  header[1] = 0;          // Color map type
  header[2] = 2;          // Image type: uncompressed true-color
  // Color map spec (bytes 3-7): 0
  header[8] = 0;          // X-origin (LE)
  header[9] = 0;
  header[10] = 0;         // Y-origin (LE)
  header[11] = 0;
  header[12] = WIDTH & 0xff;        // Width LE (128)
  header[13] = (WIDTH >> 8) & 0xff;
  header[14] = HEIGHT & 0xff;       // Height LE (128)
  header[15] = (HEIGHT >> 8) & 0xff;
  header[16] = BPP;       // 32 bits per pixel
  header[17] = 0x28;      // 0x20 = top-to-bottom raster order, 0x08 = 8 alpha bits (0x28 total)

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
 * Outer marshmallow cube boundary.
 * Spans full [0, 128] cell bounds (half-extent 63.5, subtle corner bevel radius 4)
 * so adjacent cells in the 15x9 grid touch 100% seamlessly with zero gaps or seams.
 */
function sdCubeBoundary(x, y) {
  return sdRoundBox(x, y, 64, 64, 63.5, 63.5, 4);
}

/**
 * Height field of the twice-folded "E" marshmallow cube.
 * Produces pillowing curves, distinct horizontal lobes, and vertical spine relief.
 */
function getCubeHeightAndNormal(x, y) {
  const dCube = sdCubeBoundary(x, y);

  if (dCube > 2.0) {
    return { inside: false, h: 0, nx: 0, ny: 0, nz: 1, alpha: 0 };
  }

  // Base pillow height across the entire cube surface
  const edgeDist = Math.max(-dCube, 0);
  const baseH = Math.min(edgeDist / 12.0, 1.0);
  let h = Math.sqrt(Math.max(0, 1.0 - Math.pow(1.0 - baseH, 2.0)));

  // Twice-folded "E" embossing relief:
  // 1. Spine (x from 22 to 46, y from 22 to 106)
  const dSpine = sdRoundBox(x, y, 34, 64, 12, 42, 6);
  // 2. Top bar (y from 22 to 44, x from 22 to 106)
  const dTop = sdRoundBox(x, y, 64, 33, 42, 11, 6);
  // 3. Middle bar (y from 53 to 75, x from 22 to 94)
  const dMid = sdRoundBox(x, y, 58, 64, 36, 11, 6);
  // 4. Bottom bar (y from 84 to 106, x from 22 to 106)
  const dBot = sdRoundBox(x, y, 64, 95, 42, 11, 6);

  // Union distance to E relief skeleton
  const dE = Math.min(dSpine, dTop, dMid, dBot);

  // E fold pillow bump: peaks along the bars of the E
  if (dE < 4.0) {
    const eBump = Math.max(0, (4.0 - dE) / 4.0);
    h = h * 0.7 + eBump * 0.45;
  } else {
    // Cavities/folds between the E bars: slightly recessed crevice folds
    h = h * 0.65;
  }

  // Normal approximation via central differences
  const eps = 1.0;
  const dX = sdCubeBoundary(x + eps, y) - sdCubeBoundary(x - eps, y);
  const dY = sdCubeBoundary(x, y + eps) - sdCubeBoundary(x, y - eps);

  let nx = -dX * (1.2 - h);
  let ny = -dY * (1.2 - h);

  // Add E lobe micro-normals
  const dEx = (Math.min(sdRoundBox(x + eps, y, 34, 64, 12, 42, 6), sdRoundBox(x + eps, y, 64, 33, 42, 11, 6), sdRoundBox(x + eps, y, 58, 64, 36, 11, 6), sdRoundBox(x + eps, y, 64, 95, 42, 11, 6)) -
               Math.min(sdRoundBox(x - eps, y, 34, 64, 12, 42, 6), sdRoundBox(x - eps, y, 64, 33, 42, 11, 6), sdRoundBox(x - eps, y, 58, 64, 36, 11, 6), sdRoundBox(x - eps, y, 64, 95, 42, 11, 6))) / (2 * eps);
  const dEy = (Math.min(sdRoundBox(x, y + eps, 34, 64, 12, 42, 6), sdRoundBox(x, y + eps, 64, 33, 42, 11, 6), sdRoundBox(x, y + eps, 58, 64, 36, 11, 6), sdRoundBox(x, y + eps, 64, 95, 42, 11, 6)) -
               Math.min(sdRoundBox(x, y - eps, 34, 64, 12, 42, 6), sdRoundBox(x, y - eps, 64, 33, 42, 11, 6), sdRoundBox(x, y - eps, 58, 64, 36, 11, 6), sdRoundBox(x, y - eps, 64, 95, 42, 11, 6))) / (2 * eps);

  nx += -dEx * 0.35;
  ny += -dEy * 0.35;

  let nz = Math.max(0.3, 1.0 - Math.hypot(nx, ny));
  const len = Math.hypot(nx, ny, nz) || 1.0;
  nx /= len;
  ny /= len;
  nz /= len;

  const alpha = Math.min(Math.max(1.0 - (dCube / 1.5), 0.0), 1.0);
  return { inside: true, h, nx, ny, nz, alpha };
}

/**
 * Shading helper: computes warm golden specular + pastel rainbow iridescence.
 */
function shadeMarshmallow(x, y, surf) {
  const { nx, ny, nz } = surf;

  // Key light from upper-left-front
  const lx = -0.42;
  const ly = -0.56;
  const lz = 0.71;
  const nDotL = Math.max(nx * lx + ny * ly + nz * lz, 0.0);

  // Half-vector for golden specular highlight
  const hx = lx;
  const hy = ly;
  const hz = lz + 1.0;
  const hLen = Math.hypot(hx, hy, hz) || 1.0;
  const nDotH = Math.max(nx * (hx / hLen) + ny * (hy / hLen) + nz * (hz / hLen), 0.0);
  const spec = Math.pow(nDotH, 20.0);

  // Pastel iridescent rainbow ramp based on surface normal orientation
  const angle = Math.atan2(ny, nx) + Math.PI;
  const hue = ((angle / (2 * Math.PI)) + (surf.h * 0.35) + 0.15) % 1.0;

  // Soft pastel HSV to RGB
  const sat = 0.35;
  const val = 0.88;
  const c = val * sat;
  const xHue = c * (1.0 - Math.abs(((hue * 6.0) % 2.0) - 1.0));
  const m = val - c;
  let rP = 0, gP = 0, bP = 0;

  const hSector = Math.floor(hue * 6.0);
  if (hSector === 0) { rP = c; gP = xHue; bP = 0; }
  else if (hSector === 1) { rP = xHue; gP = c; bP = 0; }
  else if (hSector === 2) { rP = 0; gP = c; bP = xHue; }
  else if (hSector === 3) { rP = 0; gP = xHue; bP = c; }
  else if (hSector === 4) { rP = xHue; gP = 0; bP = c; }
  else { rP = c; gP = 0; bP = xHue; }

  rP += m; gP += m; bP += m;

  // Base warm golden marshmallow tone
  const baseR = 0.94;
  const baseG = 0.82;
  const baseB = 0.52;

  // Blend golden base with pastel iridescent tint
  const diffuseR = (baseR * 0.65 + rP * 0.35) * (0.35 + 0.65 * nDotL);
  const diffuseG = (baseG * 0.65 + gP * 0.35) * (0.35 + 0.65 * nDotL);
  const diffuseB = (baseB * 0.65 + bP * 0.35) * (0.35 + 0.65 * nDotL);

  // Golden-white specular flash
  const specR = 1.00 * spec * 1.5;
  const specG = 0.92 * spec * 1.5;
  const specB = 0.60 * spec * 1.5;

  // Ambient rim glow on top edges
  const rim = Math.pow(1.0 - nz, 2.5) * 0.28;

  const finalR = Math.min(Math.max(diffuseR + specR + rim * 1.0, 0.0), 1.0);
  const finalG = Math.min(Math.max(diffuseG + specG + rim * 0.9, 0.0), 1.0);
  const finalB = Math.min(Math.max(diffuseB + specB + rim * 0.6, 0.0), 1.0);

  return { r: Math.round(finalR * 255), g: Math.round(finalG * 255), b: Math.round(finalB * 255) };
}

/**
 * Generates Marshmallow_E_Closed.tga (128x128 32-bit BGRA)
 * Full marshmallow E cube filling the rounded square with alpha = 255.
 */
function generateClosedTexture() {
  const pixelData = Buffer.alloc(WIDTH * HEIGHT * 4);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 4;
      const surf = getCubeHeightAndNormal(x, y);

      if (!surf.inside || surf.alpha <= 0.01) {
        // Outside rounded cube boundary
        pixelData[idx + 0] = 12; // B
        pixelData[idx + 1] = 10; // G
        pixelData[idx + 2] = 15; // R
        pixelData[idx + 3] = 0;  // A
        continue;
      }

      const color = shadeMarshmallow(x, y, surf);
      const a = Math.round(surf.alpha * 255);

      pixelData[idx + 0] = color.b; // B
      pixelData[idx + 1] = color.g; // G
      pixelData[idx + 2] = color.r; // R
      pixelData[idx + 3] = a;       // A (255 across body)
    }
  }

  return createTgaBuffer(pixelData);
}

/**
 * Generates Marshmallow_E_Window.tga (128x128 32-bit BGRA)
 * Features outer puffy golden-iridescent cube rim (4px soft bezel, alpha = 255),
 * with the inner face (120x120) punched transparent (alpha = 0)
 * and subtle CRT scanlines (alpha = 28 on even lines) for the 3D ModelScene underneath.
 */
function generateWindowTexture() {
  const pixelData = Buffer.alloc(WIDTH * HEIGHT * 4);

  // The inner window spans [8, 119] in X and Y (centered at 64,64 with half-extent 56, radius 6)
  const BEZEL_INSET = 8.0;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 4;

      const surf = getCubeHeightAndNormal(x, y);
      const dInnerWindow = sdRoundBox(x, y, 64, 64, 63.5 - BEZEL_INSET, 63.5 - BEZEL_INSET, 4);

      if (dInnerWindow <= 0) {
        // INSIDE THE PUNCHED WINDOW (Inner Face):
        // Alpha = 0 transparent to let live ModelScene stream through seamlessly!
        // Subtle CRT scanline grid alpha on alternating rows (alpha = 28)
        const isScanline = (y % 2 === 0);
        const scanlineAlpha = isScanline ? 28 : 0;

        pixelData[idx + 0] = 30; // B
        pixelData[idx + 1] = 18; // G
        pixelData[idx + 2] = 12; // R
        pixelData[idx + 3] = scanlineAlpha; // CRT pixel grid alpha
      } else if (dInnerWindow < 2.0) {
        // Smooth 2px transition between window opening and bezel rim
        const t = dInnerWindow / 2.0;
        const color = surf.inside ? shadeMarshmallow(x, y, surf) : { r: 180, g: 150, b: 80 };
        const a = Math.round(t * (surf.alpha * 255));

        pixelData[idx + 0] = color.b;
        pixelData[idx + 1] = color.g;
        pixelData[idx + 2] = color.r;
        pixelData[idx + 3] = a;
      } else {
        // OUTER BEZEL RIM:
        if (!surf.inside || surf.alpha <= 0.01) {
          pixelData[idx + 0] = 12;
          pixelData[idx + 1] = 10;
          pixelData[idx + 2] = 15;
          pixelData[idx + 3] = 0;
        } else {
          const color = shadeMarshmallow(x, y, surf);
          pixelData[idx + 0] = color.b;
          pixelData[idx + 1] = color.g;
          pixelData[idx + 2] = color.r;
          pixelData[idx + 3] = Math.round(surf.alpha * 255);
        }
      }
    }
  }

  return createTgaBuffer(pixelData);
}

// Generate both textures
const closedTga = generateClosedTexture();
const windowTga = generateWindowTexture();

const closedPath = path.join(mediaDir, 'Marshmallow_E_Closed.tga');
const windowPath = path.join(mediaDir, 'Marshmallow_E_Window.tga');

fs.writeFileSync(closedPath, closedTga);
fs.writeFileSync(windowPath, windowTga);

console.log(`[gen_e_atlas] Generated: ${closedPath} (${closedTga.length} bytes)`);
console.log(`[gen_e_atlas] Generated: ${windowPath} (${windowTga.length} bytes)`);
