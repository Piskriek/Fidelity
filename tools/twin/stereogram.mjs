// tools/twin/stereogram.mjs - the Magic Eye picture (a single-image stereogram) of a depth map, for the twin's live
// mode (M) and its test. The algorithm is tools/twin/stereo.py's: the symmetric stereogram of Thimbleby, Inglis and
// Witten (1994). Each point of the depth map links two pixels centred on it, `separation` apart, and linked pixels
// share a colour. The separation shrinks where the scene is near, so two eyes, each fixed on a different repeat of
// the pattern, see that point nearer. No dependencies: it runs in the browser (served at /shared/stereogram.mjs) and
// in Node.

/** A small seeded random generator (mulberry32): the pattern is the same every time, so eyes that have locked onto it
 * stay locked while the picture changes under it. */
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A tile `period` px wide and `height` px tall of bold colour blobs about 3 px across, as RGB bytes (the eyes lock
 * onto it more easily than fine noise). It wraps left to right, so the repeats join without a seam. */
export function patternTile(period, height, seed = 7) {
  const rnd = seeded(seed), cw = Math.max(4, Math.round(period / 3)), ch = Math.ceil(height / 3) + 1;
  const small = new Float32Array(cw * ch * 3);
  for (let i = 0; i < small.length; i++) small[i] = rnd();
  const tile = new Uint8Array(period * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < period; x++) {
    const fx = (x / period) * cw, fy = y / 3;
    const x0 = Math.floor(fx) % cw, x1 = (x0 + 1) % cw, y0 = Math.min(Math.floor(fy), ch - 2), tx = fx - Math.floor(fx), ty = fy - y0;
    for (let c = 0; c < 3; c++) {
      const top = small[(y0 * cw + x0) * 3 + c] * (1 - tx) + small[(y0 * cw + x1) * 3 + c] * tx;
      const bottom = small[((y0 + 1) * cw + x0) * 3 + c] * (1 - tx) + small[((y0 + 1) * cw + x1) * 3 + c] * tx;
      const v = top * (1 - ty) + bottom * ty;
      tile[(y * period + x) * 3 + c] = 25 + Math.round(230 * Math.min(1, Math.max(0, (v - 0.15) / 0.7)));
    }
  }
  return tile;
}

/** The separation in px that shows depth d (0 far, 1 near): nearer is closer together for parallel eyes, further
 * apart for crossed eyes (their lines of sight meet in front of the screen). */
export function separation(d, period, strength, cross) {
  return Math.round(period * (1 - strength * (cross ? 1 - d : d)));
}

/**
 * The stereogram of a depth map, written into `out` (RGBA bytes, w x h, top row first).
 * depth: RGBA bytes whose red channel is the depth, 255 near and 0 far; `bottomUp` when its first row is the
 * picture's bottom row (a WebGL read-back). Each row is first averaged over 2 * smooth + 1 px: fewer echoes at sharp
 * depth edges. tile: patternTile(period, tileH).
 */
export function stereogramInto(depth, w, h, { period, strength = 0.3, cross = false, tile, tileH, bottomUp = false, smooth = 2 }, out) {
  const same = new Int32Array(w), row = new Float32Array(w);
  for (let y = 0; y < h; y++) {
    const src = (bottomUp ? h - 1 - y : y) * w * 4;
    for (let x = 0; x < w; x++) {
      let a = 0, n = 0;
      for (let k = -smooth; k <= smooth; k++) { const xx = x + k; if (xx >= 0 && xx < w) { a += depth[src + xx * 4]; n++; } }
      row[x] = a / (255 * n);
      same[x] = x;
    }
    for (let x = 0; x < w; x++) {
      const s = separation(row[x], period, strength, cross);
      let left = x - (s >> 1), right = left + s;
      if (left < 0 || right >= w) continue;
      let k = same[left];
      while (k !== left && k !== right) { // follow the existing chain, so that no pixel is pulled two ways
        if (k < right) left = k;
        else { const r = right; right = k; left = r; }
        k = same[left];
      }
      same[left] = right;
    }
    const o = y * w * 4, ty = (y % tileH) * period * 3;
    for (let x = w - 1; x >= 0; x--) { // right to left: a linked pixel copies its partner, already set
      const p = o + x * 4;
      if (same[x] === x) { const t = ty + (x % period) * 3; out[p] = tile[t]; out[p + 1] = tile[t + 1]; out[p + 2] = tile[t + 2]; }
      else { const q = o + same[x] * 4; out[p] = out[q]; out[p + 1] = out[q + 1]; out[p + 2] = out[q + 2]; }
      out[p + 3] = 255;
    }
  }
  return out;
}
