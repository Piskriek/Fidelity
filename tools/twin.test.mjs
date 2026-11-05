// tools/twin.test.mjs - the digital twin (tools/twin, apps/wow-twin): its camera is the addon's own (it
// reproduces every foot the client recorded at the tenth report's shutters, through a three.js camera too),
// its ground is the addon's (the recorded ground height at the pose), and its server serves only what it should.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import * as THREE from 'three';
import { buildCamera, projectPoint, toThree, threeView, cameraAtPose, windowFrustum } from './twin/camera.mjs';
import { readMap, tileFor, groundHeight, nominalHeight, kindOf, ROOT } from './twin/data.mjs';
import { parseSavedVariables, reportSteps, shotNames } from './twin/savedvars.mjs';
import { startTwin, parseArgs, cleanPose, cleanLiveStatus } from './twin/server.mjs';
import { patternTile, separation, stereogramInto } from './twin/stereogram.mjs';
import { distanceOf, sampleBilinear, screenPoint, reliefPositions, reliefIndex, reliefUVs, screenPointFrom } from './twin/relief.mjs';
import { spawn } from 'node:child_process';

const REF = 'origin/owner/reports';
const hasRef = (() => { try { execFileSync('git', ['-C', ROOT, 'rev-parse', '--verify', '--quiet', REF], { stdio: 'ignore' }); return true; } catch { return false; } })();
const tenth = hasRef ? parseSavedVariables(execFileSync('git', ['-C', ROOT, 'show', `${REF}:reports/20261105-0530/FidelityEMatrix.lua`], { encoding: 'utf8', maxBuffer: 64 << 20 })) : null;
const map = readMap('tbc');

test('the map: nine Northshire tiles of 129 x 129 heights, every placement read, every file a known stand-in', () => {
  assert.equal(map.tiles.length, 9);
  assert.equal(map.doodads.length, 5027);
  assert.equal(map.wmos.length, 43);
  for (const t of map.tiles) assert.equal(t.heights.length, 129 * 129);
  const kinds = new Set(['tree', 'bush', 'barrel', 'crate', 'jar', 'tent', 'rock', 'post', 'stump', 'other']);
  for (const d of map.doodads) { assert.ok(kinds.has(d.kind), d.path); assert.equal(d.nominal, nominalHeight(d.path)); }
  assert.equal(kindOf('world/x/elwynntreecanopy02.m2'), 'tree');
  assert.equal(kindOf('world/x/elwynntreestump01.m2'), 'stump');
  assert.equal(nominalHeight('x/westfallbarrel01.m2'), 1.2);
});

test('the camera is the addon\'s: every foot the client recorded at the tenth report\'s scene shutters, through the module and through a three.js camera', { skip: !hasRef && 'origin/owner/reports is not fetched here' }, () => {
  const steps = reportSteps(tenth).filter(s => s.index >= 104 && s.pose);
  let checked = 0;
  for (const s of steps) for (const pose of [s.pose, s.twin && s.twin.pose].filter(Boolean)) {
    const cam = cameraAtPose(pose);
    assert.ok(Math.abs(cam.focal - pose.focal) < 1e-9, 'the focal');
    const tv = threeView(cam);
    const c3 = new THREE.PerspectiveCamera(tv.fovDeg, tv.aspect, 0.1, 5000);
    c3.position.set(...tv.position); c3.up.set(...tv.up); c3.lookAt(...tv.target); c3.updateMatrixWorld(); c3.updateProjectionMatrix();
    for (const p of pose.props) {
      const f = projectPoint(cam, p.x, p.y, p.z);
      assert.ok(Math.abs(f[0] - p.footX) < 1e-9 && Math.abs(f[1] - p.footY) < 1e-9, `${p.file}: the module gives the recorded foot`);
      const v = new THREE.Vector3(...toThree(p.x, p.y, p.z)).project(c3);
      const sx = (v.x + 1) / 2 * pose.w, sy = (v.y + 1) / 2 * pose.h;
      assert.ok(Math.abs(sx - p.footX) < 1e-6 && Math.abs(sy - p.footY) < 1e-6, `${p.file}: the three.js camera gives the recorded foot (${sx}, ${sy} against ${p.footX}, ${p.footY})`);
      checked++;
    }
  }
  assert.equal(checked, 308, 'every recorded foot of the tenth run: 22 shutter poses of 14 placements');
});

test('the ground is the addon\'s: the height under the recorded pose is the recorded ground', { skip: !hasRef && 'origin/owner/reports is not fetched here' }, () => {
  const pose = reportSteps(tenth).find(s => s.index === 104).pose;
  const z = groundHeight(tileFor(map, pose.x, pose.y), pose.x, pose.y);
  assert.ok(Math.abs(z - pose.ground) < 1e-9, `${z} against ${pose.ground}`);
  assert.equal(tileFor(map, pose.x, pose.y).key, pose.tile);
});

test('the module matches the addon\'s clamps, and the window frustum is the screen seen from the head', () => {
  const a = buildCamera(0, 0, 0, 0, 0, 9, 9, -1, 0);
  assert.equal(a.zoom, 8); assert.equal(a.pitch, 1.4); assert.equal(a.fovY, 1.0); assert.equal(a.w, 1920); assert.equal(a.h, 1080);
  assert.equal(buildCamera(NaN, 0, 0, 0), null);
  assert.equal(projectPoint(a, a.cx - a.fx, a.cy - a.fy, a.cz - a.fz), null, 'a point behind the camera');
  const still = windowFrustum({}, { screenDist: 1, halfW: 0.8, halfH: 0.45, near: 0.3 });
  assert.ok(Math.abs(still.left + still.right) < 1e-12 && Math.abs(still.top + still.bottom) < 1e-12, 'at rest the frustum is symmetric');
  const moved = windowFrustum({ ex: 0.2 }, { screenDist: 1, halfW: 0.8, halfH: 0.45, near: 0.3 });
  assert.ok(Math.abs((moved.right - moved.left) - (still.right - still.left)) < 1e-12 && moved.left < still.left, 'a head moved right sees the same window from the right');
  assert.deepEqual(toThree(1, 2, 3), [-2, 3, -1]);
});

test('the live Magic Eye: a raised square comes out nearer for parallel eyes and for crossed eyes, and a WebGL read-back is turned the right way up', () => {
  const w = 400, h = 40, period = 60, strength = 0.4, tileH = 16; // 60 px far, 36 px near: neither a multiple of the other
  const depth = new Uint8Array(w * h * 4); // red channel: 0 far, 255 near; a near square, off the middle row so a flip shows
  for (let y = 8; y < 28; y++) for (let x = 150; x < 250; x++) depth[(y * w + x) * 4] = 255;
  for (let y = 32; y < 36; y++) for (let x = 0; x < w; x++) depth[(y * w + x) * 4] = Math.round(127.5 + 127.5 * Math.sin(x / (7 + y - 32))); // rolling ground: links of every length interleave
  let seed = 11; // and noise: depth that jumps faster than any surface, the only kind that reaches the chain's swap
  for (let y = 36; y < 40; y++) for (let x = 0; x < w; x++) depth[(y * w + x) * 4] = (seed = (seed * 16807) % 2147483647) % 256;
  const tile = patternTile(period, tileH);
  const make = (d, opts) => stereogramInto(d, w, h, { period, strength, tile, tileH, smooth: 0, ...opts }, new Uint8Array(w * h * 4));
  const px = (img, x, y) => { const i = (y * w + x) * 4; return `${img[i]},${img[i + 1]},${img[i + 2]}`; };
  // every point from `from` to `to` (exclusive) links the two pixels centred on it, s apart: they must match
  const repeats = (img, y, s, from, to) => { for (let x = from; x < to; x++) { const l = x - (s >> 1); if (px(img, l, y) !== px(img, l + s, y)) return false; } return true; };
  // the algorithm's invariant: every point's two pixels match, across the whole row, edges included (where two links
  // compete for one pixel, the chain must be followed or one of them breaks)
  const allLinksHold = (img, y, cross) => {
    for (let x = 0; x < w; x++) {
      const s = separation(depth[(y * w + x) * 4] / 255, period, strength, cross), l = x - (s >> 1);
      if (l >= 0 && l + s < w && px(img, l, y) !== px(img, l + s, y)) return false;
    }
    return true;
  };
  assert.equal(separation(0, period, strength, false), 60); assert.equal(separation(1, period, strength, false), 36);
  assert.equal(separation(0, period, strength, true), 36); assert.equal(separation(1, period, strength, true), 60);

  const par = make(depth, {});
  assert.ok(repeats(par, 5, 60, 30, 370), 'parallel: the background repeats every 60 px');
  assert.ok(repeats(par, 20, 36, 165, 235), 'parallel: the square repeats every 36 px (nearer), centred on it');
  assert.ok(!repeats(par, 20, 60, 165, 235), 'and not every 60 px: the square is not on the background');
  assert.ok(new Set(Array.from({ length: w }, (_, x) => px(par, x, 5))).size > 20, 'the pattern is varied, not one colour');
  for (const y of [5, 8, 20, 27, 32, 35, 36, 37, 38, 39]) assert.ok(allLinksHold(par, y, false), `parallel: every link holds on row ${y}`);

  const crs = make(depth, { cross: true });
  assert.ok(repeats(crs, 5, 36, 18, 382), 'crossed: the background repeats at the shorter separation');
  assert.ok(repeats(crs, 20, 60, 160, 240), 'crossed: the square repeats at the longer one (crossed lines of sight meet nearer)');
  assert.ok(!repeats(crs, 20, 36, 160, 240), 'and not at the shorter one');
  for (const y of [5, 8, 20, 27, 32, 35, 36, 37, 38, 39]) assert.ok(allLinksHold(crs, y, true), `crossed: every link holds on row ${y}`);

  const flipped = new Uint8Array(w * h * 4); // the same depth with its rows in WebGL's order (bottom row first)
  for (let y = 0; y < h; y++) flipped.set(depth.subarray(y * w * 4, (y + 1) * w * 4), (h - 1 - y) * w * 4);
  assert.deepEqual(make(flipped, { bottomUp: true }), par);
  assert.notDeepEqual(make(flipped, {}), par, 'reading a WebGL read-back top row first would draw the scene upside down');
  for (let i = 3; i < par.length; i += 4) assert.equal(par[i], 255, 'opaque');
});

test('the live depth view: from the resting eye the surface is the picture, a moved head slides the far past the near, and the page\'s camera draws the same', () => {
  // distances: inverse distance linear in the depth value, the focus on the glass, the farthest at `far`
  assert.equal(distanceOf(1, { focus: 1, far: 3 }), 1);
  assert.ok(Math.abs(distanceOf(0, { focus: 1, far: 3 }) - 3) < 1e-12);
  assert.ok(Math.abs(distanceOf(0.5, { focus: 0.5, far: 4 }) - 1) < 1e-12, 'the focus depth sits on the glass');
  assert.ok(distanceOf(0.9, { focus: 0.5, far: 4 }) < 1, 'nearer than the focus comes out in front');
  assert.equal(distanceOf(1, { focus: 0.05, far: 4, minZ: 0.35 }), 0.35, 'never nearer than minZ');
  for (let d = 0; d < 0.99; d += 0.05) assert.ok(distanceOf(d) > distanceOf(d + 0.05), 'nearer depth, shorter distance');
  const inv = d => 1 / distanceOf(d, { focus: 1, far: 5 });
  assert.ok(Math.abs((inv(0.75) - inv(0.25)) - 2 * (inv(0.5) - inv(0.25))) < 1e-12, 'inverse distance is linear in d');

  // the sampler: exact at pixel centres, linear between, held at the edges, a channel picked by stride
  const m = Float32Array.from([0, 10, 20, 30]);
  assert.equal(sampleBilinear(m, 2, 2, 0.25, 0.25), 0); assert.equal(sampleBilinear(m, 2, 2, 0.75, 0.75), 30);
  assert.equal(sampleBilinear(m, 2, 2, 0.5, 0.25), 5); assert.equal(sampleBilinear(m, 2, 2, 0, 0), 0);
  assert.equal(sampleBilinear(Float32Array.from([9, 0, 7, 0]), 2, 1, 0.75, 0.5, 2, 0), 7);

  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dw = 64, dh = 36, depth = new Uint8Array(dw * dh).map(() => Math.floor(rnd() * 256));
  const cols = 32, rows = 18, halfW = 0.9, halfH = 0.5, opts = { cols, rows, halfW, halfH, focus: 0.6, far: 4 };
  const P = reliefPositions(depth, dw, dh, opts, new Float32Array((cols + 1) * (rows + 1) * 3));
  const head = { ex: 0.1, ey: -0.05, ez: 0.08 }, near = 0.05;
  const f = windowFrustum(head, { screenDist: 1, halfW, halfH, near });
  const cam = new THREE.PerspectiveCamera();
  cam.position.set(head.ex, head.ey, -head.ez); cam.updateMatrixWorld();
  cam.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, near, 100);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  let onGlass = 0, behind = 0, inFront = 0;
  for (let j = 0, k = 0; j <= rows; j++) for (let i = 0; i <= cols; i++, k += 3) {
    const v = [P[k], P[k + 1], P[k + 2]], Z = -v[2];
    const [sx, sy] = screenPoint(i / cols, j / rows, halfW, halfH);
    const [x0, y0] = screenPointFrom({}, v);
    assert.ok(Math.abs(x0 - sx) < 1e-6 && Math.abs(y0 - sy) < 1e-6, 'from the resting eye every vertex lands on its own pixel');
    // seen from the head, a point Z away shifts by the head's sideways offset times (1 - 1/Z), scaled for the head's
    // distance to the glass: none on the glass, towards the head's side behind it, away in front of it
    const [x1, y1] = screenPointFrom(head, v);
    const t = (1 - head.ez) / (Z - head.ez);
    assert.ok(Math.abs(x1 - (head.ex + t * (v[0] - head.ex))) < 1e-9 && Math.abs(y1 - (head.ey + t * (v[1] - head.ey))) < 1e-9);
    if (Math.abs(Z - 1) < 1e-9) onGlass++; else if (Z > 1) behind++; else inFront++;
    // the page's camera (windowFrustum's off-axis projection from the head) draws the vertex where the line cuts the glass
    const ndc = new THREE.Vector3(...v).project(cam);
    assert.ok(Math.abs(ndc.x * halfW - x1) < 1e-5 && Math.abs(ndc.y * halfH - y1) < 1e-5, 'the three.js camera agrees with the geometry');
  }
  assert.ok(behind > 50 && inFront > 50, 'the random map puts points both behind and in front of the glass');
  // the parallax itself, on three points straight ahead: on the glass, behind it, in front of it
  const shift = Z => screenPointFrom({ ex: 0.1 }, [0, 0, -Z])[0];
  assert.ok(Math.abs(shift(1)) < 1e-12, 'a point on the glass does not move');
  assert.ok(shift(3) > 0 && shift(30) > shift(3), 'behind the glass it moves with the head, the farther the more');
  assert.ok(Math.abs(shift(30) - 0.1 * (1 - 1 / 30)) < 1e-12);
  assert.ok(shift(0.5) < 0, 'in front of the glass it moves against the head');

  // the grid: every vertex used, two triangles per cell facing the eye, texture v up
  const idx = reliefIndex(cols, rows);
  assert.equal(idx.length, cols * rows * 6);
  assert.equal(Math.max(...idx), (cols + 1) * (rows + 1) - 1);
  const flat = reliefPositions(new Uint8Array([255]), 1, 1, { cols, rows, halfW, halfH }, new Float32Array((cols + 1) * (rows + 1) * 3));
  const vtx = n => new THREE.Vector3(flat[n * 3], flat[n * 3 + 1], flat[n * 3 + 2]);
  for (let q = 0; q < idx.length; q += 6 * 37) {
    const a = vtx(idx[q]), b = vtx(idx[q + 1]), c = vtx(idx[q + 2]);
    assert.ok(new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).z > 0, 'counter-clockwise seen from the eye');
  }
  const uv = reliefUVs(cols, rows);
  assert.deepEqual([uv[0], uv[1]], [0, 1]); assert.deepEqual([uv[uv.length - 2], uv[uv.length - 1]], [1, 0]);
});

test('the report reader: steps, poses, and the two names a shot can have (a file can be named a second late)', { skip: !hasRef && 'origin/owner/reports is not fetched here' }, () => {
  const steps = reportSteps(tenth);
  assert.equal(steps.length, 115);
  const s = steps[103];
  assert.equal(s.label, '1 Scene + twin');
  assert.ok(s.pose && s.twin.pose && s.pose.props.length === 14);
  assert.deepEqual(shotNames('taken at 2026-11-05 05:29:21'), ['WoWScrnShot_110526_052921.jpg', 'WoWScrnShot_110526_052922.jpg']);
  assert.deepEqual(shotNames('taken at 2026-12-31 23:59:59'), ['WoWScrnShot_123126_235959.jpg', 'WoWScrnShot_010127_000000.jpg']);
  assert.deepEqual(shotNames('not taken: the next step started'), []);
  assert.deepEqual(parseSavedVariables('A = { 1, 2, ["k"] = "v\\"x", n = -3.5e1, t = true, z = nil, }'), { A: { 1: 1, 2: 2, k: 'v"x', n: -35, t: true, z: null } });
});

const get = (port, p, method = 'GET', body, headers = {}) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port, path: p, method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers } }, res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body: Buffer.concat(chunks) }));
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

test('the server: the viewer, three.js, the map, the camera, the reports and shots, nothing outside its folders, and live head and pose events', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twin-'));
  const head = path.join(dir, 'head.json');
  const t = await startTwin({ port: 0, head });
  try {
    const page = await get(t.port, '/');
    assert.equal(page.status, 200); assert.match(page.body.toString(), /Fidelity Twin/);
    assert.equal((await get(t.port, '/app/main.js')).status, 200);
    assert.equal((await get(t.port, '/shared/camera.mjs')).status, 200);
    assert.equal((await get(t.port, '/shared/stereogram.mjs')).status, 200);
    assert.equal((await get(t.port, '/shared/relief.mjs')).status, 200);
    const live = await get(t.port, '/live');
    assert.equal(live.status, 200); assert.match(live.body.toString(), /Fidelity Depth/);
    assert.equal((await get(t.port, '/app/live.js')).status, 200);
    assert.equal((await get(t.port, '/shared/server.mjs')).status, 404, 'only the viewer\'s shared modules are served');
    assert.equal((await get(t.port, '/vendor/three/build/three.module.js')).status, 200);
    assert.equal((await get(t.port, '/vendor/three/package.json')).status, 404, 'only three\'s modules are served');
    for (const bad of ['/app/../package.json', '/app/%2e%2e/%2e%2e/package.json', '/app/..%2f..%2fpackage.json']) assert.ok([403, 404].includes((await get(t.port, bad)).status), bad);
    const m = JSON.parse((await get(t.port, '/api/map')).body);
    assert.equal(m.tiles.length, 9); assert.equal(m.doodads.length, 5027);
    const cams = JSON.parse((await get(t.port, '/api/camera')).body);
    assert.deepEqual(cams.default, { pitch: 0.35, fovY: 1 });
    const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'rungs', 'ledger.json'), 'utf8'));
    assert.equal(cams.proposal.pitch, ledger.proposals['projection:abbey-door'].pitch);
    assert.equal(cams.proposal.heldOut, 'undecided');
    if (hasRef) {
      const reps = JSON.parse((await get(t.port, '/api/reports')).body);
      assert.ok(reps.reports.includes('20261105-0530'));
      const r = JSON.parse((await get(t.port, '/api/report/20261105-0530')).body);
      const scene = r.steps.find(s => s.label === '1 Scene + twin');
      assert.equal(scene.shot, 'WoWScrnShot_110526_052833.jpg'); assert.equal(scene.twin.shot, 'WoWScrnShot_110526_052834.jpg');
      const wide = r.steps.find(s => s.label === '8 Crate, wide frame + twin');
      assert.equal(wide.shot, 'WoWScrnShot_110526_052921.jpg');
      assert.equal(wide.twin.shot, 'WoWScrnShot_110526_052922.jpg', 'the twin stamped :21 was named :22');
      const jar = r.steps.find(s => s.label === '6 Jar at its fit + twin');
      assert.equal(jar.twin.shot, 'WoWScrnShot_110526_052907.jpg', 'the twin overwrote the first shot in the same second');
      assert.equal(jar.shot, null); assert.equal(jar.overwritten, true);
      const all = r.steps.flatMap(s => [s.shot, s.twin && s.twin.shot]).filter(Boolean);
      assert.equal(new Set(all).size, all.length, 'no file is given to two shots');
      for (const f of r.files.filter(f => f >= 'WoWScrnShot_110526_052833.jpg')) assert.ok(all.includes(f), f + ' belongs to a shot of the tenth run');
      assert.ok(r.blind && r.blind.objects.length === 13);
      const shot = await get(t.port, '/api/shot/20261105-0530/WoWScrnShot_110526_052834.jpg');
      assert.equal(shot.status, 200); assert.equal(shot.body[0], 0xff); assert.equal(shot.body[1], 0xd8);
    }
    assert.equal((await get(t.port, '/api/report/2026')).status, 404);
    assert.equal((await get(t.port, '/api/shot/20261105-0530/..%2f..%2fpackage.json')).status, 404);
    // the event stream: a posted pose and a new head.json reach a listener
    const events = [];
    const listener = await new Promise(resolve => {
      const req = http.get({ host: '127.0.0.1', port: t.port, path: '/events' }, res => {
        res.setEncoding('utf8');
        res.on('data', c => { events.push(c); });
        resolve(req);
      });
    });
    await new Promise(r => setTimeout(r, 50));
    const bad = await get(t.port, '/api/pose', 'POST', JSON.stringify({ x: 'a', y: 1, facing: 0 }));
    assert.equal(bad.status, 400);
    const ok = await get(t.port, '/api/pose', 'POST', JSON.stringify({ x: -8754.5, y: -102.5, facing: 4.6, source: 'test' }));
    assert.equal(ok.status, 200);
    fs.writeFileSync(head, JSON.stringify({ at: 'now', x: 0.25, y: -0.1, z: 0.3, fps: 30 }));
    for (let i = 0; i < 40 && !events.join('').includes('event: head'); i++) await new Promise(r => setTimeout(r, 25));
    const text = events.join('');
    assert.match(text, /event: hello/);
    assert.match(text, /event: pose\ndata: \{"x":-8754.5,"y":-102.5,"z":null,"facing":4.6/);
    assert.match(text, /event: head\ndata: \{"x":0.25,"y":-0.1,"z":0.3/);
    listener.destroy();
  } finally {
    await t.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  assert.throws(() => parseArgs(['--ref', 'origin/x; rm -rf /']), /git ref/);
  assert.throws(() => parseArgs(['--family', 'wotlk']), /tbc or vanilla/);
  assert.throws(() => parseArgs(['--ref']), /needs a value/, 'an option with no value is refused, not read as "undefined"');
  assert.throws(() => parseArgs(['--ref', '--port']), /needs a value/);
  assert.throws(() => parseArgs(['--ref', '-x']), /git ref/, 'a ref may not look like an option');
});

test('the head from a tracker on another machine (--head http://...): each new head reaches the page, and a tracker that goes away breaks nothing', async () => {
  let body = JSON.stringify({ x: 0.3, y: -0.1, z: 0, at: '2026-11-05T16:00:00', fps: 24, t: 1793894400000, frames: 50, lost: 2 });
  const tracker = http.createServer((req, res) => {
    if (req.url !== '/head.json') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(body);
  });
  await new Promise(r => tracker.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${tracker.address().port}/head.json`;
  assert.equal(parseArgs(['--head', url]).head, url, 'an address is kept as it is, not made a path');
  assert.throws(() => parseArgs(['--head', 'http://user:pw@127.0.0.1:1/head.json']), /no credentials/);
  const t = await startTwin({ port: 0, head: url });
  const events = [];
  const req = http.get({ host: '127.0.0.1', port: t.port, path: '/events' }, res => { res.setEncoding('utf8'); res.on('data', c => events.push(c)); });
  const waitFor = async re => { for (let i = 0; i < 80 && !re.test(events.join('')); i++) await new Promise(r => setTimeout(r, 25)); return events.join(''); };
  try {
    assert.match(await waitFor(/event: hello/), new RegExp(`"head":"${url.replace(/[./]/g, c => '\\' + c)}"`), 'the page is told where the head comes from');
    assert.match(await waitFor(/"x":0\.3/), /event: head\ndata: \{"x":0.3,"y":-0.1,"z":0,"at":"2026-11-05T16:00:00","fps":24,"t":1793894400000,"frames":50,"lost":2\}/,
      'the head, when its picture arrived (t, for the page\'s measure of its age) and the tracker\'s counts');
    const before = events.join('').split('event: head').length;
    await new Promise(r => setTimeout(r, 200));
    assert.equal(events.join('').split('event: head').length, before, 'the same head is not sent twice');
    body = JSON.stringify({ x: -0.2, y: 0, z: 0.1 });
    assert.match(await waitFor(/"x":-0\.2/), /"x":-0.2,"y":0,"z":0.1/, 'a new head is sent');
    await new Promise(r => tracker.close(r)); // the tracker goes away: the twin goes on serving
    tracker.closeAllConnections?.();
    await new Promise(r => setTimeout(r, 200));
    assert.equal((await get(t.port, '/api/camera')).status, 200);
  } finally {
    req.destroy();
    await t.close();
    if (tracker.listening) await new Promise(r => tracker.close(r));
  }
});

test('the depth service on another machine (--depth): the page\'s picture goes there, its depth comes back, and nothing else gets through', async () => {
  assert.throws(() => parseArgs(['--depth', 'http://user:pw@127.0.0.1:5205']), /--depth is http/);
  assert.throws(() => parseArgs(['--depth', 'https://127.0.0.1:5205']), /--depth is http/);
  assert.throws(() => parseArgs(['--depth', 'http://127.0.0.1:5205/elsewhere']), /--depth is http/);
  assert.equal(parseArgs(['--depth', 'http://127.0.0.1:5205/']).depth, 'http://127.0.0.1:5205');
  const plain = await startTwin({ port: 0, head: path.join(os.tmpdir(), 'no-head.json') });
  try {
    assert.deepEqual(JSON.parse((await get(plain.port, '/api/depth')).body), { remote: null }, 'no service: the page uses its own model');
    assert.equal((await get(plain.port, '/api/depth', 'POST', 'x', { 'content-type': 'image/jpeg' })).status, 404);
  } finally { await plain.close(); }

  const seen = [];
  const depthBytes = Buffer.from([0, 64, 128, 255, 10, 20]);
  const service = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, type: req.headers['content-type'], body: Buffer.concat(chunks) });
      res.writeHead(200, { 'content-type': 'application/octet-stream', 'x-depth-width': '3', 'x-depth-height': '2', 'x-depth-ms': '12', 'x-depth-total-ms': '15', 'x-depth-device': 'DirectML, fp16', 'x-other': 'not passed on' });
      res.end(depthBytes);
    });
  });
  await new Promise(r => service.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${service.address().port}`;
  const t = await startTwin({ port: 0, head: path.join(os.tmpdir(), 'no-head.json'), depth: url });
  try {
    assert.deepEqual(JSON.parse((await get(t.port, '/api/depth')).body), { remote: url });
    const picture = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const r = await get(t.port, '/api/depth', 'POST', picture, { 'content-type': 'image/jpeg' });
    assert.equal(r.status, 200);
    assert.deepEqual([...r.body], [...depthBytes], 'the depth comes back unchanged');
    assert.equal(seen.length, 1); assert.equal(seen[0].url, '/depth'); assert.equal(seen[0].type, 'image/jpeg');
    assert.deepEqual([...seen[0].body], [...picture], 'the picture goes there unchanged');
    const h = await new Promise(resolve => http.request({ host: '127.0.0.1', port: t.port, path: '/api/depth', method: 'POST', headers: { 'content-type': 'image/png' } }, res => { res.resume(); res.on('end', () => resolve(res.headers)); }).end(picture));
    assert.equal(h['x-depth-width'], '3'); assert.equal(h['x-depth-height'], '2'); assert.equal(h['x-depth-device'], 'DirectML, fp16');
    assert.equal(h['x-other'], undefined, 'only the depth headers are passed on');
    assert.equal(h['x-depth-total-ms'], '15');
    assert.match(h['x-relay-ms'], /^\d+$/, 'and the time to the service and back, for the page\'s breakdown');
    assert.equal((await get(t.port, '/api/depth', 'POST', picture, { 'content-type': 'text/plain' })).status, 415, 'a form or text post from another page cannot reach it');
    assert.equal((await get(t.port, '/api/depth', 'POST', picture, { 'content-type': 'image/jpeg', origin: 'http://evil.example' })).status, 403);
    assert.equal(seen.length, 2, 'the refused posts never reached the service');
    await new Promise(r => service.close(r));
    service.closeAllConnections?.();
    const gone = await get(t.port, '/api/depth', 'POST', picture, { 'content-type': 'image/jpeg' });
    assert.equal(gone.status, 502, 'a service that went away is a clean error');
    assert.equal((await get(t.port, '/api/camera')).status, 200, 'and the twin goes on');
  } finally {
    await t.close();
    if (service.listening) await new Promise(r => service.close(r));
  }
});

test('the page\'s "set my resting position" reaches the tracker through the twin, and only that way', async () => {
  const asked = [];
  const tracker = http.createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      if (req.url === '/head.json') { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"x":0,"y":0,"z":0}'); return; }
      asked.push(`${req.method} ${req.url} ${req.headers['content-type'] || ''}`);
      if (req.method === 'POST' && req.url === '/calibrate') { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); return; }
      res.writeHead(404); res.end();
    });
  });
  await new Promise(r => tracker.listen(0, '127.0.0.1', r));
  const headUrl = `http://127.0.0.1:${tracker.address().port}/head.json`;
  const plain = await startTwin({ port: 0, head: path.join(os.tmpdir(), 'no-head.json') });
  try {
    const r = await get(plain.port, '/api/recalibrate', 'POST', '{}', { 'content-type': 'application/json' });
    assert.equal(r.status, 404, 'a tracker read from a file cannot be asked');
    assert.match(JSON.parse(r.body).error, /--serve/);
  } finally { await plain.close(); }
  const t = await startTwin({ port: 0, head: headUrl });
  try {
    const r = await get(t.port, '/api/recalibrate', 'POST', '{}', { 'content-type': 'application/json' });
    assert.equal(r.status, 200); assert.deepEqual(JSON.parse(r.body), { ok: true });
    assert.deepEqual(asked, ['POST /calibrate application/json'], 'the tracker was asked once, at /calibrate');
    assert.equal((await get(t.port, '/api/recalibrate', 'POST', '{}', { 'content-type': 'text/plain' })).status, 415, 'a form or text post from another page cannot');
    assert.equal((await get(t.port, '/api/recalibrate', 'POST', '{}', { 'content-type': 'application/json', origin: 'http://evil.example' })).status, 403);
    assert.equal(asked.length, 1, 'the refused posts never reached the tracker');
    await new Promise(r => tracker.close(r));
    tracker.closeAllConnections?.();
    assert.equal((await get(t.port, '/api/recalibrate', 'POST', '{}', { 'content-type': 'application/json' })).status, 502, 'a tracker gone is a clean error');
  } finally {
    await t.close();
    if (tracker.listening) await new Promise(r => tracker.close(r));
  }
});

test('the page\'s own numbers reach the twin and come back for the room launcher: cleaned, and only from this machine\'s page', async () => {
  assert.equal(cleanLiveStatus([1]), null); assert.equal(cleanLiveStatus('x'), null); assert.equal(cleanLiveStatus(null), null);
  const t = await startTwin({ port: 0, head: path.join(os.tmpdir(), 'no-head.json') });
  try {
    assert.deepEqual(JSON.parse((await get(t.port, '/api/live-status')).body), { status: null }, 'nothing before the page speaks');
    assert.equal((await get(t.port, '/favicon.ico')).status, 204, 'the browser\'s icon request is answered (no 404 in the page\'s console)');
    const sent = { picture: 'a captured window, live (1920 x 1080)', live: true, renderFps: 59.8, captureFps: 29.6, depthDevice: 'graphics card (WebGPU: nvidia ampere), fp16', depthMs: 61, depthFrames: 120, depthPerSecond: 14.5, depthP50: 60, depthP90: 75, worstFrameMs: 21, head: 'head tracker', headPerSecond: 26.4, headAgeMs: 12, headAgeP90: 30, headLost: 3, headFrames: 400, magic: false, fullscreen: true, width: 1920, height: 1080, secret: 'dropped' };
    assert.equal((await get(t.port, '/api/live-status', 'POST', JSON.stringify(sent))).status, 200);
    const back = JSON.parse((await get(t.port, '/api/live-status')).body);
    assert.ok(back.ageMs >= 0 && back.ageMs < 5000, `age ${back.ageMs}`);
    for (const k of Object.keys(sent).filter(k => k !== 'secret')) assert.deepEqual(back.status[k], sent[k], k);
    assert.equal(back.status.secret, undefined, 'unknown fields are dropped');
    // numbers out of range or not numbers become null, long strings are cut short
    assert.equal((await get(t.port, '/api/live-status', 'POST', JSON.stringify({ renderFps: -1, captureFps: 'fast', depthMs: 1e12, head: 'h'.repeat(500), live: 'yes' }))).status, 200);
    const odd = JSON.parse((await get(t.port, '/api/live-status')).body).status;
    assert.equal(odd.renderFps, null); assert.equal(odd.captureFps, null); assert.equal(odd.depthMs, null); assert.equal(odd.head.length, 160); assert.equal(odd.live, false);
    // refused: not an object, not JSON, a text post (another page could send one), another site, too big
    assert.equal((await get(t.port, '/api/live-status', 'POST', '[1,2]')).status, 400);
    assert.equal((await get(t.port, '/api/live-status', 'POST', 'not json')).status, 400);
    assert.equal((await get(t.port, '/api/live-status', 'POST', '{}', { 'content-type': 'text/plain' })).status, 415);
    assert.equal((await get(t.port, '/api/live-status', 'POST', '{}', { origin: 'http://evil.example' })).status, 403);
    await assert.rejects(get(t.port, '/api/live-status', 'POST', JSON.stringify({ picture: 'p'.repeat(5000) })), 'a status over 4 KB is cut off');
    assert.equal(JSON.parse((await get(t.port, '/api/live-status')).body).status.head.length, 160, 'the refused posts left the last good status');
  } finally { await t.close(); }
});

test('the server survives bad requests, answers only this machine and its own page, and leaks no internals', async () => {
  const t = await startTwin({ port: 0 });
  try {
    const alive = async () => assert.equal((await get(t.port, '/api/camera')).status, 200, 'still serving');
    const bad = await get(t.port, '/app/%E0%A4%A');
    assert.equal(bad.status, 400, 'a malformed escape is a bad request, not a crash'); await alive();
    const nul = await get(t.port, '/app/a%00b');
    assert.equal(nul.status, 400); assert.doesNotMatch(nul.body.toString(), new RegExp(ROOT.replace(/[\\/]/g, '.')), 'no absolute path in the answer'); await alive();
    const obj = await get(t.port, '/api/pose', 'POST', JSON.stringify({ x: 1, y: 2, facing: 0, source: { toString: 1, valueOf: 2 } }));
    assert.equal(obj.status, 200, 'an odd source is replaced, not fatal'); await alive();
    assert.equal((await get(t.port, '/api/pose', 'POST', '{"x":1,"y":2,"facing":0}', { 'content-type': 'text/plain' })).status, 415, 'a cross-site simple POST (text/plain) is refused');
    assert.equal((await get(t.port, '/api/pose', 'POST', '{"x":1,"y":2,"facing":0}', { origin: 'http://evil.example' })).status, 403, 'another site\'s page is refused');
    assert.equal((await get(t.port, '/api/pose', 'POST', '{"x":1,"y":2,"facing":0}', { origin: `http://127.0.0.1:${t.port}` })).status, 200, 'its own page is served');
    assert.equal((await get(t.port, '/api/map', 'GET', null, { host: `attacker.example:${t.port}` })).status, 403, 'a foreign Host (DNS rebinding) is refused');
    assert.equal((await get(t.port, '/api/camera', 'GET', null, { host: `localhost:${t.port}` })).status, 200);
    assert.equal((await get(t.port, '/api/pose', 'POST', JSON.stringify({ x: 1e308, y: 2, facing: 0 }))).status, 400, 'an absurd pose is refused');
    await alive();
  } finally { await t.close(); }
  assert.equal(cleanPose({ x: 1, y: 2, facing: 0, source: { toString: 1 } }).source, 'posted');
  assert.equal(cleanPose({ x: 1, y: 2, facing: 0, zoom: '5' }), null, 'a number must be a number');
  assert.deepEqual(cleanPose({ x: -8754.5, y: -102.5, facing: 4.6, source: 'chat log' }), { x: -8754.5, y: -102.5, z: null, facing: 4.6, zoom: null, pitch: null, fovY: null, source: 'chat log' });
});

test('a failed start leaves nothing running, and the server starts through a symlinked path', async () => {
  // a second server on a taken port fails; once the first closes, the process must exit on its own
  const script = `import('${path.join(ROOT, 'tools', 'twin', 'server.mjs').replace(/\\/g, '/')}').then(async m => { const a = await m.startTwin({ port: 0 }); try { await m.startTwin({ port: a.port }); } catch { console.log('second start refused'); } await a.close(); })`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', c => { out += c; });
  const code = await new Promise(resolve => { const timer = setTimeout(() => { child.kill(); resolve('hung'); }, 5000); child.on('exit', c => { clearTimeout(timer); resolve(c); }); });
  assert.equal(code, 0, 'the process exits by itself: no timer was left running by the failed start');
  assert.match(out, /second start refused/);
  // through a symlink (a junction on Windows) the entry check still recognises the script
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twin-link-'));
  const link = path.join(dir, 'repo');
  try { fs.symlinkSync(ROOT, link, 'junction'); } catch { fs.rmSync(dir, { recursive: true, force: true }); return; }
  const srv = spawn(process.execPath, [path.join(link, 'tools', 'twin', 'server.mjs'), '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let line = '';
  srv.stdout.on('data', c => { line += c; });
  await new Promise(resolve => { const timer = setTimeout(resolve, 5000); srv.stdout.on('data', () => { if (/twin: http/.test(line)) { clearTimeout(timer); resolve(); } }); srv.on('exit', () => { clearTimeout(timer); resolve(); }); });
  srv.kill();
  fs.rmSync(dir, { recursive: true, force: true });
  assert.match(line, /twin: http:\/\/127\.0\.0\.1:\d+/, 'started through the link');
});
