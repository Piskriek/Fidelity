// apps/wow-twin/main.js - the Fidelity Twin: Northshire outside the game, from the addon's own map data.
// The ground is the map's heights, every placement a stand-in shape (not the game's model), the camera ours:
// the game's camera at a recorded shutter pose (over the real screenshot), a head-coupled window, or a free orbit.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { projectPoint, toThree, threeView, cameraAtPose, windowFrustum } from '/shared/camera.mjs';

const $ = id => document.getElementById(id);
const ui = { report: $('report'), step: $('step'), shot: $('shot'), camera: $('camera'), lens: $('lens'), opacity: $('opacity'), terrain: $('terrain'), props: $('props'), feet: $('feet'), mousehead: $('mousehead'), status: $('status') };
const stage = $('stage'), wrap = $('stagewrap'), canvas = $('view'), overlay = $('overlay'), backdrop = $('backdrop');
const ctx2d = overlay.getContext('2d');

// The scene's origin: the middle of the nine Northshire tiles, so three.js works with small numbers.
const ORIGIN = toThree(-8800, -266.67, 0);
const local = (x, y, z) => { const p = toThree(x, y, z); return new THREE.Vector3(p[0] - ORIGIN[0], p[1] - ORIGIN[1], p[2] - ORIGIN[2]); };
const localDir = (x, y, z) => { const p = toThree(x, y, z); return new THREE.Vector3(p[0], p[1], p[2]); };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x3a3020, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(-300, 600, 200);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(57, 16 / 9, 0.3, 4000);
const SKY = new THREE.Color(0x8fb4d8), HAZE = new THREE.Fog(0x8fb4d8, 250, 1100);
const controls = new OrbitControls(camera, canvas);
controls.enabled = false;

const state = { map: null, cams: null, report: null, step: null, pose: null, live: null, head: null, headAt: 0, mouse: { x: 0, y: 0 } };

// ---------------------------------------------------------------------------------------------
// The world: terrain from the heights, stand-ins at the placements
// ---------------------------------------------------------------------------------------------
const terrainGroup = new THREE.Group(), propGroup = new THREE.Group(), markerGroup = new THREE.Group();
scene.add(terrainGroup, propGroup, markerGroup);
const terrainSolid = new THREE.MeshLambertMaterial({ vertexColors: true });
const terrainWire = new THREE.MeshBasicMaterial({ color: 0x6bd36b, wireframe: true, transparent: true, opacity: 0.25 });

function buildTerrain(tiles) {
  for (const t of tiles) {
    const pos = new Float32Array(129 * 129 * 3), col = new Float32Array(129 * 129 * 3);
    for (let j = 0; j < 129; j++) for (let k = 0; k < 129; k++) {
      const n = j * 129 + k, z = t.heights[n] * 0.1;
      const v = local(t.originX - j * t.unit, t.originY - k * t.unit, z);
      pos.set([v.x, v.y, v.z], n * 3);
      const g = THREE.MathUtils.clamp((z - 40) / 120, 0, 1);
      col.set([0.22 + 0.25 * g, 0.42 + 0.18 * g, 0.16 + 0.12 * g], n * 3);
    }
    const idx = [];
    for (let j = 0; j < 128; j++) for (let k = 0; k < 128; k++) {
      const a = j * 129 + k, b = a + 1, c = a + 129, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, terrainSolid);
    mesh.userData.tile = t.key;
    terrainGroup.add(mesh);
  }
}

// One instanced mesh per stand-in part. Sizes are fractions of the file's nominal height times its scale
// (EMatrix_Terrain.lua's own rule), except the stump, which that rule calls a 14 yd tree.
const PARTS = {
  tree: [{ geo: new THREE.CylinderGeometry(0.03, 0.045, 0.5, 6), at: 0.25, color: 0x6b4a2b }, { geo: new THREE.SphereGeometry(0.27, 10, 8), at: 0.68, color: 0x2f7d32 }],
  bush: [{ geo: new THREE.SphereGeometry(0.45, 10, 8), at: 0.4, color: 0x3c8f3c, squash: 0.8 }],
  barrel: [{ geo: new THREE.CylinderGeometry(0.33, 0.33, 1, 12), at: 0.5, color: 0x8a5a2e }],
  crate: [{ geo: new THREE.BoxGeometry(1, 1, 1), at: 0.5, color: 0xa47a45 }],
  jar: [{ geo: new THREE.CylinderGeometry(0.22, 0.3, 1, 10), at: 0.5, color: 0xb5653b }],
  tent: [{ geo: new THREE.ConeGeometry(0.8, 1, 4), at: 0.5, color: 0xcdb48a }],
  rock: [{ geo: new THREE.DodecahedronGeometry(0.5), at: 0.35, color: 0x8b8b86 }],
  post: [{ geo: new THREE.BoxGeometry(0.12, 1, 0.12), at: 0.5, color: 0x7a5533 }],
  stump: [{ geo: new THREE.CylinderGeometry(0.3, 0.38, 1, 8), at: 0.5, color: 0x6b4a2b, fixed: 0.8 }],
  other: [{ geo: new THREE.BoxGeometry(0.6, 0.6, 0.6), at: 0.3, color: 0x9a9a9a }],
};
function buildProps(doodads) {
  const byKind = {};
  for (const d of doodads) (byKind[d.kind] ||= []).push(d);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), upY = new THREE.Vector3(0, 1, 0);
  for (const [kind, list] of Object.entries(byKind)) {
    for (const part of PARTS[kind] || PARTS.other) {
      const mesh = new THREE.InstancedMesh(part.geo, new THREE.MeshLambertMaterial({ color: part.color }), list.length);
      list.forEach((d, i) => {
        const H = (part.fixed ?? d.nominal) * d.scale;
        const foot = local(d.x, d.y, d.z);
        p.set(foot.x, foot.y + part.at * H, foot.z);
        q.setFromAxisAngle(upY, THREE.MathUtils.degToRad(d.rot));
        s.set(H, H * (part.squash ?? 1), H);
        mesh.setMatrixAt(i, m.compose(p, q, s));
      });
      mesh.instanceMatrix.needsUpdate = true;
      propGroup.add(mesh);
    }
  }
}
function buildBuildings(wmos) {
  // a building (WMO) is not drawn: its placement is marked by a wire column, so it cannot pass for a wall
  const geo = new THREE.BoxGeometry(3, 14, 3), mat = new THREE.MeshBasicMaterial({ color: 0x9fb7ff, wireframe: true, transparent: true, opacity: 0.6 });
  const mesh = new THREE.InstancedMesh(geo, mat, wmos.length), m = new THREE.Matrix4();
  wmos.forEach((w, i) => { const v = local(w.x, w.y, w.z); m.makeTranslation(v.x, v.y + 7, v.z); mesh.setMatrixAt(i, m); });
  mesh.instanceMatrix.needsUpdate = true;
  propGroup.add(mesh);
}

// the player: a column at the feet, a cone along the facing
const player = new THREE.Group();
const playerBody = new THREE.MeshLambertMaterial({ color: 0xe3b341, transparent: true, opacity: 1 });
player.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 10), playerBody));
player.children[0].position.y = 1;
const noseMat = new THREE.MeshLambertMaterial({ color: 0xff7b3d, transparent: true, opacity: 1 });
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 10), noseMat);
nose.rotation.x = -Math.PI / 2;
nose.position.set(0, 1.4, -0.7);
player.add(nose);
markerGroup.add(player);

// ---------------------------------------------------------------------------------------------
// Layout and cameras
// ---------------------------------------------------------------------------------------------
const lensOf = () => (ui.lens.value === 'proposal' && state.cams && state.cams.proposal ? { pitch: state.cams.proposal.pitch, fovY: state.cams.proposal.fovY } : {});
const activePose = () => state.live || state.pose;

function layout() {
  const pose = activePose();
  const aspect = pose && pose.w && pose.h ? pose.w / pose.h : 16 / 9;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  let w = W, h = Math.round(W / aspect);
  if (h > H) { h = H; w = Math.round(H * aspect); }
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  renderer.setSize(w, h, false);
  overlay.width = w * (window.devicePixelRatio || 1);
  overlay.height = h * (window.devicePixelRatio || 1);
  camera.aspect = aspect;
}

function placePlayer(pose) {
  if (!pose) return;
  const v = local(pose.x, pose.y, pose.ground ?? pose.z ?? 0);
  player.position.copy(v);
  player.rotation.set(0, pose.facing, 0); // WoW facing is counter-clockwise from north; three's -z is north here
}

function gameCamera(pose) {
  const cam = cameraAtPose(pose, lensOf());
  const tv = threeView(cam);
  camera.position.set(tv.position[0] - ORIGIN[0], tv.position[1] - ORIGIN[1], tv.position[2] - ORIGIN[2]);
  camera.up.set(...tv.up);
  camera.lookAt(tv.target[0] - ORIGIN[0], tv.target[1] - ORIGIN[1], tv.target[2] - ORIGIN[2]);
  camera.fov = tv.fovDeg;
  camera.aspect = tv.aspect;
  camera.updateProjectionMatrix();
  return cam;
}

function headOffset() {
  if (ui.mousehead.checked) return { x: state.mouse.x, y: state.mouse.y, z: 0, source: 'mouse' };
  if (state.head && performance.now() - state.headAt < 1500) return { ...state.head, source: 'head tracker' };
  return { x: 0, y: 0, z: 0, source: 'none' };
}

function windowCamera(pose) {
  const cam = gameCamera(pose); // the base eye and basis are the game camera's
  const h = headOffset();
  const near = 0.3, screenDist = 1, halfH = Math.tan(cam.fovY / 2) * screenDist, halfW = halfH * (cam.w / cam.h);
  // head.json's x, y and z are about -1..1 from the rest pose: a gain of 0.35 yd per unit at a 1 yd window
  const f = windowFrustum({ ex: h.x * 0.35, ey: h.y * 0.25, ez: h.z * 0.3 }, { screenDist, halfW, halfH, near });
  const r = localDir(cam.rx, cam.ry, cam.rz), u = localDir(cam.ux, cam.uy, cam.uz), fw = localDir(cam.fx, cam.fy, cam.fz);
  camera.position.addScaledVector(r, f.offset[0]).addScaledVector(u, f.offset[1]).addScaledVector(fw, f.offset[2]);
  camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, near, 4000);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return { cam, head: h };
}

// ---------------------------------------------------------------------------------------------
// The 2D overlay: the director's blind feet and the predicted feet at the chosen camera
// ---------------------------------------------------------------------------------------------
function drawOverlay(cam) {
  ctx2d.setTransform(1, 0, 0, 1, 0, 0);
  ctx2d.clearRect(0, 0, overlay.width, overlay.height);
  const pose = state.pose;
  if (!ui.feet.checked || ui.camera.value !== 'game' || !pose || !cam || state.live) return;
  const sx = overlay.width / pose.w, sy = overlay.height / pose.h; // UI units to overlay pixels
  ctx2d.lineWidth = 2;
  ctx2d.font = `${12 * (window.devicePixelRatio || 1)}px system-ui, sans-serif`;
  for (const pr of pose.props || []) {
    const p = projectPoint(cam, pr.x, pr.y, pr.z);
    if (!p) continue;
    const X = p[0] * sx, Y = overlay.height - p[1] * sy;
    ctx2d.strokeStyle = '#39c5cf';
    ctx2d.beginPath(); ctx2d.moveTo(X - 6, Y); ctx2d.lineTo(X + 6, Y); ctx2d.moveTo(X, Y - 6); ctx2d.lineTo(X, Y + 6); ctx2d.stroke();
  }
  const blind = state.report && state.report.blind;
  if (blind && state.step && state.step.label && /^1 Scene/.test(state.step.label)) {
    const kx = overlay.width / 1839, ky = overlay.height / 1041; // the blind feet were read on the 1839 x 1041 shot
    for (const o of blind.objects || []) {
      const X = o.foot_px[0] * kx, Y = o.foot_px[1] * ky;
      ctx2d.strokeStyle = '#e3b341'; ctx2d.fillStyle = '#e3b341';
      ctx2d.beginPath(); ctx2d.arc(X, Y, 5, 0, Math.PI * 2); ctx2d.stroke();
      ctx2d.fillText(o.label, X + 7, Y - 6);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------------------------
function frame() {
  const pose = activePose();
  terrainGroup.visible = ui.terrain.value !== 'off';
  for (const m of terrainGroup.children) m.material = ui.terrain.value === 'wire' ? terrainWire : terrainSolid;
  propGroup.visible = ui.props.checked;
  const gameView = ui.camera.value !== 'free' && pose;
  const withShot = gameView && ui.shot.value !== 'none' && !state.live;
  backdrop.style.opacity = withShot ? ui.opacity.value : 0;
  scene.background = withShot ? null : SKY;
  scene.fog = withShot ? null : HAZE; // distance haze only where no screenshot sits behind the render
  playerBody.opacity = noseMat.opacity = gameView ? 0.3 : 1; // from the game's camera the player stands right in front of the lens
  controls.enabled = ui.camera.value === 'free';
  let cam = null, head = { source: 'none' };
  if (pose) placePlayer(pose);
  if (ui.camera.value === 'game' && pose) cam = gameCamera(pose);
  else if (ui.camera.value === 'window' && pose) ({ cam, head } = windowCamera(pose));
  else controls.update();
  renderer.render(scene, camera);
  drawOverlay(cam);
  status(head);
  requestAnimationFrame(frame);
}

function status(head) {
  const pose = activePose(), c = state.cams;
  const lens = ui.lens.value === 'proposal' && c && c.proposal
    ? `the proposal from report ${c.proposal.report}: pitch ${(c.proposal.pitch * 180 / Math.PI).toFixed(1)}°, fovY ${(c.proposal.fovY * 180 / Math.PI).toFixed(1)}° (not confirmed: its held-out test was ${c.proposal.heldOut})`
    : pose ? `the pose's own: pitch ${(pose.pitch * 180 / Math.PI).toFixed(1)}°, fovY ${(pose.fovY * 180 / Math.PI).toFixed(1)}° (the saved default, which failed the tenth report's twin)` : '—';
  const lines = [
    state.map ? `${state.map.doodads.length} placements as stand-ins, ${state.map.wmos.length} buildings as markers (not drawn), ${state.map.tiles.length} tiles of ground (${state.map.family} ${state.map.build})` : 'loading the map…',
    state.live ? `live pose from ${state.live.source}` : pose ? `pose: ${pose.x.toFixed(1)}, ${pose.y.toFixed(1)} facing ${pose.facing.toFixed(3)} zoom ${pose.zoom.toFixed(2)}` : 'no pose yet',
    `camera: ${ui.camera.value === 'free' ? 'free orbit' : lens}`,
    ui.camera.value === 'window' ? `head: ${head.source}${head.source !== 'none' ? ` (${head.x.toFixed(2)}, ${head.y.toFixed(2)}, ${head.z.toFixed(2)})` : ''}` : '',
    ui.feet.checked && ui.camera.value === 'game' ? 'cyan +: each placement\'s predicted foot at this camera; yellow o: the director\'s blind feet (step 1 of the tenth report)' : '',
  ];
  ui.status.textContent = lines.filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------------------------
// Data: the map, the reports, live events
// ---------------------------------------------------------------------------------------------
async function loadReport(stamp) {
  const r = await (await fetch(`/api/report/${stamp}`)).json();
  state.report = r;
  ui.step.innerHTML = '';
  for (const s of r.steps) {
    const o = document.createElement('option');
    o.value = String(s.index);
    o.textContent = `${s.label} (${s.at})`;
    ui.step.appendChild(o);
  }
  const first = r.steps.find(s => /^1 Scene/.test(s.label)) || r.steps[0];
  if (first) ui.step.value = String(first.index);
  chooseStep();
}

function chooseStep() {
  const r = state.report;
  if (!r) return;
  const s = r.steps.find(x => String(x.index) === ui.step.value);
  state.step = s;
  const useTwin = ui.shot.value === 'twin' && s && s.twin && s.twin.pose;
  state.pose = s ? (useTwin ? s.twin.pose : s.pose || (s.twin && s.twin.pose)) : null;
  const file = s ? (ui.shot.value === 'first' ? s.shot : (s.twin && s.twin.shot) || s.shot) : null;
  backdrop.src = file && ui.shot.value !== 'none' ? `/api/shot/${r.stamp}/${file}` : '';
  if (state.pose && ui.camera.value === 'free') {
    const v = local(state.pose.x, state.pose.y, state.pose.ground);
    controls.target.copy(v);
    camera.position.copy(v).add(new THREE.Vector3(30, 25, 30));
  }
  layout();
}

async function boot() {
  const [map, cams, reps] = await Promise.all([fetch('/api/map').then(r => r.json()), fetch('/api/camera').then(r => r.json()), fetch('/api/reports').then(r => r.json())]);
  state.map = map;
  state.cams = cams;
  buildTerrain(map.tiles);
  buildProps(map.doodads);
  buildBuildings(map.wmos);
  for (const stamp of reps.reports.slice().reverse()) {
    const o = document.createElement('option');
    o.value = o.textContent = stamp;
    ui.report.appendChild(o);
  }
  const params = new URLSearchParams(location.search);
  for (const [k, el] of Object.entries({ camera: ui.camera, lens: ui.lens, shot: ui.shot, terrain: ui.terrain })) if (params.has(k)) el.value = params.get(k);
  if (params.get('mousehead') === '1') ui.mousehead.checked = true;
  if (params.has('opacity')) ui.opacity.value = params.get('opacity');
  const want = params.get('report') || reps.reports.find(s => s === '20261105-0530') || reps.reports[reps.reports.length - 1];
  if (want) { ui.report.value = want; await loadReport(want); }
  if (params.has('step')) { ui.step.value = params.get('step'); chooseStep(); }
  document.body.dataset.ready = '1';
}

ui.report.addEventListener('change', () => loadReport(ui.report.value));
for (const el of [ui.step, ui.shot]) el.addEventListener('change', chooseStep);
ui.camera.addEventListener('change', chooseStep);
window.addEventListener('resize', layout);
stage.addEventListener('pointermove', e => {
  const b = stage.getBoundingClientRect();
  state.mouse.x = ((e.clientX - b.left) / b.width) * 2 - 1;
  state.mouse.y = -(((e.clientY - b.top) / b.height) * 2 - 1);
});
const events = new EventSource('/events');
events.addEventListener('head', e => { state.head = JSON.parse(e.data); state.headAt = performance.now(); });
events.addEventListener('pose', e => {
  const p = JSON.parse(e.data);
  const base = state.pose || { w: 1507.47, h: 853.33, pitch: 0.35, fovY: 1.0, zoom: 8, ground: 0 };
  state.live = { ...base, x: p.x, y: p.y, facing: p.facing, zoom: p.zoom ?? base.zoom, pitch: p.pitch ?? base.pitch, fovY: p.fovY ?? base.fovY, ground: p.z ?? base.ground, source: p.source, props: [] };
});

boot().then(() => { layout(); requestAnimationFrame(frame); }, e => { ui.status.textContent = 'could not start: ' + e.message; });
