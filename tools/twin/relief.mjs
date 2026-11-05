// tools/twin/relief.mjs - a picture and its depth map turned into a surface you can look into, for the twin's live
// depth view (apps/wow-twin/live.html). Each pixel is pushed back along its own line of sight to the distance its
// depth gives, so from the resting eye the surface looks exactly like the picture, and from anywhere else the near
// parts and the far parts slide apart: parallax. No dependencies, so the test runs it in Node.
//
// Units and axes: the rest eye is at the origin looking down -z; the screen is the rectangle at z = -1 (one screen
// distance away), halfW wide and halfH high on each side. A head offset (ex, ey, ez) is in screen distances, ez
// towards the screen, the convention of tools/twin/camera.mjs windowFrustum.

/**
 * The distance (in screen distances) of a point whose depth value is d. d is relative inverse depth, 1 nearest and
 * 0 farthest (Depth Anything's output, normalised): inverse distance is linear in d, as the model's output is. The
 * depth `focus` sits on the screen (distance 1); d = 0 sits at `far`; anything nearer than focus comes out in front
 * of the screen, but never nearer than `minZ`.
 */
export function distanceOf(d, { focus = 1, far = 3, minZ = 0.35 } = {}) {
  const f = Math.min(1, Math.max(1e-3, focus)), F = Math.max(1.0001, far);
  const inv = 1 / F + ((1 - 1 / F) / f) * Math.min(1, Math.max(0, d));
  return Math.max(minZ, 1 / inv);
}

/** The value at (u, v) in [0, 1]^2 (u right, v down) of a one-channel map w x h (row-major, top row first), read
 * bilinearly between pixel centres, held at the edges. stride and offset pick a channel of an interleaved map. */
export function sampleBilinear(map, w, h, u, v, stride = 1, offset = 0) {
  const x = Math.min(w - 1, Math.max(0, u * w - 0.5)), y = Math.min(h - 1, Math.max(0, v * h - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), tx = x - x0, ty = y - y0;
  const at = (i, j) => map[(j * w + i) * stride + offset];
  return (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) + (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty;
}

/** Where the picture's (u, v) sits on the screen rectangle (u right, v down; the screen's y is up). */
export function screenPoint(u, v, halfW, halfH) {
  return [(u - 0.5) * 2 * halfW, (0.5 - v) * 2 * halfH];
}

/**
 * The surface's vertex positions, into `out` ((cols + 1) * (rows + 1) * 3 floats, row by row from the top).
 * depth: the depth map, dw x dh, values 0..scale (scale 255 for bytes), near high; stride > 1 for interleaved
 * channels (the first is read).
 */
export function reliefPositions(depth, dw, dh, { cols, rows, halfW, halfH, focus = 1, far = 3, minZ = 0.35, scale = 255, stride = 1 }, out) {
  let k = 0;
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= cols; i++) {
      const u = i / cols;
      const z = distanceOf(sampleBilinear(depth, dw, dh, u, v, stride) / scale, { focus, far, minZ });
      const [sx, sy] = screenPoint(u, v, halfW, halfH);
      out[k++] = sx * z; out[k++] = sy * z; out[k++] = -z; // along the line of sight through (sx, sy, -1)
    }
  }
  return out;
}

/** The texture coordinates of the same grid (three.js convention: v up). */
export function reliefUVs(cols, rows) {
  const uv = new Float32Array((cols + 1) * (rows + 1) * 2);
  let k = 0;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { uv[k++] = i / cols; uv[k++] = 1 - j / rows; }
  return uv;
}

/** Two triangles per grid cell, counter-clockwise seen from the eye. */
export function reliefIndex(cols, rows) {
  const idx = new Uint32Array(cols * rows * 6);
  let k = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b;
    idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  return idx;
}

/** Where point P lands on the screen plane (z = -1) seen from the eye at head offset (ex, ey, ez): the line from the
 * eye through P, cut by the screen. This is what windowFrustum's off-axis projection draws. */
export function screenPointFrom({ ex = 0, ey = 0, ez = 0 }, P) {
  const eye = [ex, ey, -ez];
  const t = (-1 - eye[2]) / (P[2] - eye[2]);
  return [eye[0] + t * (P[0] - eye[0]), eye[1] + t * (P[1] - eye[1])];
}
