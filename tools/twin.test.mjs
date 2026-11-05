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
import { startTwin, parseArgs } from './twin/server.mjs';

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

const get = (port, p, method = 'GET', body) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port, path: p, method, headers: body ? { 'content-type': 'application/json' } : {} }, res => {
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
});
