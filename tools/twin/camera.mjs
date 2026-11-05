// tools/twin/camera.mjs - the addon's camera, shared by the digital twin's viewer (browser) and its tests (Node).
//
// buildCamera and projectPoint are EMatrix_Math.BuildCamera and ProjectPoint line for line (same clamps,
// same defaults), so the twin's "game camera" sees what the addon's overlay predicts. WoW's world axes
// (UnitPosition and the map data): x north, y west, z up, right-handed. three.js: y up, right-handed. The
// twin maps a WoW point to three.js as (east, up, south) = (-y, z, -x).
export const HEAD_HEIGHT = 2.0; // yards above the feet, where the camera aims

const finite = Number.isFinite;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** EMatrix_Math.BuildCamera: the camera behind the player at `zoom` yards, pitched down by `pitch`, aimed at the head. */
export function buildCamera(px, py, pz, facing, zoom, pitch, fovY, screenW, screenH) {
  if (!(finite(px) && finite(py) && finite(pz) && finite(facing))) return null;
  zoom = finite(zoom) && zoom > 0.1 ? zoom : 8.0;
  pitch = finite(pitch) ? clamp(pitch, -1.2, 1.4) : 0.35;
  fovY = finite(fovY) && fovY > 0.1 && fovY < 3.0 ? fovY : 1.0;
  screenW = finite(screenW) && screenW > 0 ? screenW : 1920;
  screenH = finite(screenH) && screenH > 0 ? screenH : 1080;
  const cf = Math.cos(facing), sf = Math.sin(facing), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const fx = cf * cp, fy = sf * cp, fz = -sp; // forward: the facing, tilted down by pitch
  const rx = sf, ry = -cf, rz = 0; // right
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx; // up = right x forward
  const tx = px, ty = py, tz = pz + HEAD_HEIGHT;
  return {
    cx: tx - fx * zoom, cy: ty - fy * zoom, cz: tz - fz * zoom,
    fx, fy, fz, rx, ry, rz, ux, uy, uz,
    focal: (screenH * 0.5) / Math.tan(fovY * 0.5), w: screenW, h: screenH, zoom, pitch, fovY,
  };
}

/** EMatrix_Math.ProjectPoint: screen x and y (UI units, origin bottom-left like WoW) and depth, or null behind the camera. */
export function projectPoint(cam, wx, wy, wz) {
  if (!cam || !(finite(wx) && finite(wy) && finite(wz))) return null;
  const dx = wx - cam.cx, dy = wy - cam.cy, dz = wz - cam.cz;
  const depth = dx * cam.fx + dy * cam.fy + dz * cam.fz;
  if (depth <= 0.05) return null;
  const sx = cam.w * 0.5 + ((dx * cam.rx + dy * cam.ry + dz * cam.rz) / depth) * cam.focal;
  const sy = cam.h * 0.5 + ((dx * cam.ux + dy * cam.uy + dz * cam.uz) / depth) * cam.focal;
  return [sx, sy, depth];
}

/** A WoW point (x north, y west, z up) in three.js axes (x east, y up, z south). */
export const toThree = (x, y, z) => [-y, z, -x];

/** What a three.js PerspectiveCamera needs to see exactly what buildCamera sees. */
export function threeView(cam) {
  return {
    position: toThree(cam.cx, cam.cy, cam.cz),
    target: toThree(cam.cx + cam.fx, cam.cy + cam.fy, cam.cz + cam.fz),
    up: toThree(cam.ux, cam.uy, cam.uz),
    fovDeg: (2 * Math.atan((cam.h * 0.5) / cam.focal) * 180) / Math.PI,
    aspect: cam.w / cam.h,
  };
}

/** The camera at a recorded pose (a report's shutter pose), with an optional pitch and fovY in place of the pose's. */
export function cameraAtPose(pose, { pitch, fovY } = {}) {
  return buildCamera(pose.x, pose.y, pose.ground ?? 0, pose.facing, pose.zoom, pitch ?? pose.pitch, fovY ?? pose.fovY, pose.w, pose.h);
}

/**
 * Head-coupled ("window") projection: the screen is a fixed window at distance `screenDist` in front of the
 * base eye, `halfW` x `halfH` in world units; the head offset (ex right, ey up, ez toward the screen) moves the
 * eye and skews the frustum so the window stays put. Returns the eye offset and the near-plane bounds.
 */
export function windowFrustum({ ex = 0, ey = 0, ez = 0 }, { screenDist, halfW, halfH, near }) {
  const d = Math.max(screenDist - ez, 1e-3);
  const k = near / d;
  return { offset: [ex, ey, ez], left: (-halfW - ex) * k, right: (halfW - ex) * k, bottom: (-halfH - ey) * k, top: (halfH - ey) * k, near };
}
