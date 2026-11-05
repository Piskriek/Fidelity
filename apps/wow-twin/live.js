// apps/wow-twin/live.js - the Fidelity Twin's live depth view: a WoW picture (a report's screenshot, a captured window
// or any picture) drawn as a surface you can look into. How far away each pixel is comes from a model running in this
// browser (Depth Anything V2 Small through transformers.js), estimated from the picture alone: the game gives its depth
// to nothing outside it. The head (the tracker's head.json through the server, or the mouse) moves the eye, and the
// screen is a window onto the surface (tools/twin/relief.mjs, tools/twin/camera.mjs windowFrustum).
import * as THREE from 'three';
import { windowFrustum } from '/shared/camera.mjs';
import { reliefPositions, reliefUVs, reliefIndex, sampleBilinear } from '/shared/relief.mjs';
import { patternTile, separation, stereogramInto } from '/shared/stereogram.mjs';

const $ = id => document.getElementById(id);
const OPT = new URLSearchParams(location.search);
const TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
const MODEL = 'onnx-community/depth-anything-v2-small'; // Apache-2.0
const COLS = 192, ROWS = 108;   // the surface's grid; the depth map is read between its pixels
const DEPTH_W = 518;            // the picture is shrunk to this width for the model (its own input size)
const FOV_Y = (Number(OPT.get('fov')) || 57.3) * Math.PI / 180; // the picture's vertical field of view (the addon's saved default, 1 rad)
const HALF_H = Math.tan(FOV_Y / 2);
// the picture is drawn a little larger than the window, so a moved head does not open black wedges at its edges
// (?overscan=0 draws it exactly the window's size: then the resting view is the picture to the pixel)
const OVERSCAN = OPT.has('overscan') ? Math.max(0, Number(OPT.get('overscan')) || 0) : 0.05;

const ui = { source: $('source'), capture: $('capture'), file: $('file'), depthamt: $('depthamt'), focus: $('focus'), headgain: $('headgain'), mousehead: $('mousehead'), magiceye: $('magiceye'), status: $('status') };
const stage = $('stage'), wrap = $('stagewrap'), canvas = $('view'), magicCanvas = $('magic'), magicCtx = magicCanvas.getContext('2d');
if (OPT.get('chrome') === '0') $('panel').style.display = 'none';
for (const [k, el] of [['depth', ui.depthamt], ['focus', ui.focus], ['gain', ui.headgain]]) if (OPT.has(k)) el.value = OPT.get(k);

const state = {
  el: null, fw: 16, fh: 9, label: '', live: false, stream: null, stamp: 0,
  depth: null, dw: 0, dh: 0, stride: 1, depthStamp: 0, est: null, device: '', loading: '', busy: false, ms: 0, frames: 0, error: '', fallbacks: [], breakdown: '',
  head: null, headAt: 0, mouse: { x: 0, y: 0 },
  testHead: OPT.has('head') ? OPT.get('head').split(',').map(Number) : null, // ?head=x,y,z holds the head still (for checks)
};

// ---------------------------------------------------------------------------------------------
// The surface
// ---------------------------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera();
const positions = new Float32Array((COLS + 1) * (ROWS + 1) * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('uv', new THREE.BufferAttribute(reliefUVs(COLS, ROWS), 2));
geo.setIndex(new THREE.BufferAttribute(reliefIndex(COLS, ROWS), 1));
const still = new THREE.Texture();
still.colorSpace = THREE.SRGBColorSpace; still.minFilter = THREE.LinearFilter; still.generateMipmaps = false;
const mat = new THREE.MeshBasicMaterial({ map: still });
const mesh = new THREE.Mesh(geo, mat);
mesh.frustumCulled = false;
scene.add(mesh);
const FLAT = new Uint8Array([255]); // before the model answers, everything sits on the glass: the flat picture

const halfW = () => HALF_H * (state.fw / state.fh);
function updateSurface() {
  const d = state.depth || FLAT, dw = state.depth ? state.dw : 1, dh = state.depth ? state.dh : 1;
  reliefPositions(d, dw, dh, { cols: COLS, rows: ROWS, halfW: halfW() * (1 + OVERSCAN), halfH: HALF_H * (1 + OVERSCAN), focus: Number(ui.focus.value), far: Number(ui.depthamt.value), stride: state.depth ? state.stride : 1 }, positions);
  geo.attributes.position.needsUpdate = true;
}

function layout() {
  const aspect = state.fw / state.fh, W = wrap.clientWidth, H = wrap.clientHeight;
  let w = W, h = Math.round(W / aspect);
  if (h > H) { h = H; w = Math.round(H * aspect); }
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  renderer.setSize(w, h, false);
  magic.key = '';
}

// ---------------------------------------------------------------------------------------------
// The depth model: loaded on first use, on the graphics card (WebGPU) when there is one, else on the processor
// ---------------------------------------------------------------------------------------------
// ?gpu=low-power asks for the integrated graphics (a laptop's Intel chip, say, while the game has the discrete card);
// the default asks for the most capable card
const GPU_PREF = OPT.get('gpu') === 'low-power' ? 'low-power' : 'high-performance';
async function graphicsCard() {
  if (!navigator.gpu) return null;
  try {
    const a = await navigator.gpu.requestAdapter({ powerPreference: GPU_PREF });
    if (!a) return null;
    const i = a.info || {};
    return { f16: a.features.has('shader-f16'), name: [i.vendor, i.architecture, i.description].filter(Boolean).join(' ') || 'unnamed' };
  } catch { return null; }
}
async function estimator() {
  if (state.est) return state.est;
  state.loading = 'loading the depth model (about 30 to 100 MB, once)';
  const tf = await import(TRANSFORMERS);
  const gpu = (OPT.get('device') || 'webgpu') === 'webgpu' ? await graphicsCard() : null;
  if (gpu && tf.env && tf.env.backends && tf.env.backends.onnx) {
    tf.env.backends.onnx.webgpu = tf.env.backends.onnx.webgpu || {};
    tf.env.backends.onnx.webgpu.powerPreference = GPU_PREF; // the same card the check above found
  }
  // half precision only where the card has it (shader-f16); full precision on any other card; the processor last
  const tries = gpu ? [...(gpu.f16 ? [['webgpu', 'fp16']] : []), ['webgpu', 'fp32'], ['wasm', 'q8']] : [['wasm', 'q8']];
  let last = null;
  for (const [device, dtype] of tries) {
    try {
      const est = await tf.pipeline('depth-estimation', MODEL, {
        device, dtype,
        progress_callback: p => { if (p.status === 'progress' && /\.onnx$/.test(p.file || '')) state.loading = `loading the depth model: ${Math.round(p.progress || 0)}%`; },
      });
      state.est = est;
      state.device = device === 'webgpu'
        ? `graphics card (WebGPU: ${gpu.name}), ${dtype}${gpu.f16 ? '' : ' (this card has no fp16)'}`
        : `processor (WebAssembly), ${dtype}${gpu ? '' : ' (no WebGPU graphics card in this browser)'}`;
      state.loading = '';
      return est;
    } catch (e) {
      last = e;
      state.fallbacks.push(`${device} ${dtype}: ${String(e.message || e).slice(0, 80)}`);
      console.warn(`the depth model did not start on ${device} ${dtype}: ${e.message}`);
    }
  }
  state.loading = '';
  throw last || new Error('the depth model did not start');
}

// A depth service on another machine (tools/depthd, through this twin's --depth): asked once; null when there is none,
// when ?model=local asks for the model in this page, or after it failed (then the page's own model takes over)
let remote;
async function remoteDepth() {
  const t0 = performance.now();
  const blob = await new Promise((ok, fail) => work.toBlob(b => (b ? ok(b) : fail(new Error('the picture could not be encoded'))), 'image/jpeg', 0.85));
  const t1 = performance.now();
  const r = await fetch('/api/depth', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob });
  if (!r.ok) { let m = String(r.status); try { m = (await r.json()).error || m; } catch { /* not JSON */ } throw new Error(m); }
  const width = Number(r.headers.get('x-depth-width')), height = Number(r.headers.get('x-depth-height'));
  const data = new Uint8Array(await r.arrayBuffer());
  const t2 = performance.now();
  if (!(width > 0 && height > 0 && data.length === width * height)) throw new Error('the depth service sent a depth of the wrong size');
  // where the time went: making the picture here, the page to this machine's twin and back, the network, the service
  const num = h => { const v = Number(r.headers.get(h)); return Number.isFinite(v) ? v : null; };
  const relay = num('x-relay-ms'), there = num('x-depth-total-ms'), model = num('x-depth-ms');
  const parts = [`${Math.round(t1 - t0)} ms making the picture`];
  if (relay !== null) parts.push(`${Math.max(0, Math.round(t2 - t1 - relay))} ms on this machine (the page and its twin)`);
  if (relay !== null && there !== null) parts.push(`${Math.max(0, Math.round(relay - there))} ms on the network`);
  if (there !== null) parts.push(`${Math.round(there)} ms on the service's machine${model !== null ? ` (${Math.round(model)} ms of it the model)` : ''}`);
  return { data, width, height, channels: 1, device: r.headers.get('x-depth-device') || 'unknown', breakdown: parts.join(' + ') };
}

const work = document.createElement('canvas'), workCtx = work.getContext('2d', { willReadFrequently: true });
async function estimate() {
  if (state.busy || !state.el) return;
  state.busy = true;
  const stamp = state.stamp;
  try {
    if (remote === undefined) {
      try { remote = OPT.get('model') === 'local' ? null : ((await (await fetch('/api/depth')).json()).remote || null); } catch { remote = null; }
    }
    work.width = DEPTH_W; work.height = Math.max(1, Math.round(DEPTH_W * state.fh / state.fw));
    workCtx.drawImage(state.el, 0, 0, work.width, work.height);
    const t0 = performance.now();
    let d = null;
    if (remote) {
      try {
        d = await remoteDepth();
        state.device = `depth service at ${remote} (${d.device})`;
        state.breakdown = d.breakdown;
      } catch (e) {
        state.fallbacks.push(`the depth service at ${remote}: ${String(e.message || e).slice(0, 80)}`);
        remote = null; // the page's own model from now on
      }
    }
    if (!d) d = (await (await estimator())(work)).depth; // one channel per pixel, near bright, the size of `work`
    state.ms = performance.now() - t0;
    if (stamp !== state.stamp) return; // the picture changed while the model was busy
    state.depth = d.data; state.dw = d.width; state.dh = d.height; state.stride = d.channels || 1;
    state.depthStamp++; state.frames++; state.error = '';
    updateSurface();
    window.__depth = { ms: state.ms, device: state.device, dw: d.width, dh: d.height, frames: state.frames, stride: state.stride, depth: d.data }; // for the browser check
  } catch (e) {
    state.error = e.message;
    console.error(e);
  } finally { state.busy = false; }
}

// ---------------------------------------------------------------------------------------------
// The pictures: a report's screenshot, a captured window (live), or a picture from disk
// ---------------------------------------------------------------------------------------------
function setPicture(el, w, h, label, live) {
  state.el = el; state.fw = w; state.fh = h; state.label = label; state.live = live; state.stamp++;
  state.depth = null; state.frames = 0;
  if (live) { mat.map = new THREE.VideoTexture(el); mat.map.colorSpace = THREE.SRGBColorSpace; }
  else { still.image = el; still.needsUpdate = true; mat.map = still; }
  mat.needsUpdate = true;
  layout(); updateSurface(); estimate();
}
async function useImage(url, label) {
  const img = new Image();
  img.src = url;
  await img.decode();
  stopCapture();
  setPicture(img, img.naturalWidth, img.naturalHeight, label, false);
}
function stopCapture() {
  if (state.stream) for (const t of state.stream.getTracks()) t.stop();
  state.stream = null;
}
async function startCapture() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    await video.play();
    stopCapture();
    state.stream = stream;
    stream.getVideoTracks()[0].addEventListener('ended', () => { if (state.stream === stream) { state.stream = null; state.live = false; } });
    setPicture(video, video.videoWidth || 1920, video.videoHeight || 1080, 'a captured window, live', true);
  } catch (e) { state.error = `no capture: ${e.message}`; }
}
ui.capture.addEventListener('click', startCapture);
ui.file.addEventListener('change', () => { const f = ui.file.files[0]; if (f) useImage(URL.createObjectURL(f), f.name); });
wrap.addEventListener('dragover', e => e.preventDefault());
wrap.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && /^image\//.test(f.type)) useImage(URL.createObjectURL(f), f.name); });
ui.source.addEventListener('change', () => { if (ui.source.value) useImage(`/api/shot/${ui.source.value}`, ui.source.value); });
for (const el of [ui.depthamt, ui.focus]) el.addEventListener('input', () => { updateSurface(); });

async function listShots() {
  // every report's shots, newest first; the overlay-off twin of each step when there is one (the clean picture)
  const { reports = [] } = await (await fetch('/api/reports')).json();
  ui.source.innerHTML = '';
  for (const stamp of reports.slice().reverse()) {
    let r;
    try { r = await (await fetch(`/api/report/${stamp}`)).json(); } catch { continue; }
    const group = document.createElement('optgroup');
    group.label = `report ${stamp}`;
    for (const st of r.steps || []) {
      const shot = (st.shots || [])[1] || (st.shots || [])[0];
      if (!shot) continue;
      const o = document.createElement('option');
      o.value = `${stamp}/${shot}`; o.textContent = `${st.label || 'step'} (${shot})`;
      group.append(o);
    }
    if (group.children.length) ui.source.append(group);
  }
  if (!ui.source.options.length) ui.source.innerHTML = '<option value="">(no reports here: capture a window or open a picture)</option>';
}

// ---------------------------------------------------------------------------------------------
// The head: the tracker's head.json (through the server's events), the mouse, or ?head= for a check
// ---------------------------------------------------------------------------------------------
function headOffset() {
  if (state.testHead) return { x: state.testHead[0] || 0, y: state.testHead[1] || 0, z: state.testHead[2] || 0, source: 'held still (?head)' };
  if (ui.mousehead.checked) return { x: state.mouse.x, y: state.mouse.y, z: 0, source: 'mouse' };
  if (state.head && performance.now() - state.headAt < 1500) return { ...state.head, source: 'head tracker' };
  return { x: 0, y: 0, z: 0, source: 'none (no head.json in the last 1.5 s: start tools/headtrack/headtrack.py, or tick mouse as head)' };
}
stage.addEventListener('pointermove', e => {
  const b = stage.getBoundingClientRect();
  state.mouse.x = ((e.clientX - b.left) / b.width) * 2 - 1;
  state.mouse.y = -(((e.clientY - b.top) / b.height) * 2 - 1);
});
const events = new EventSource('/events');
events.addEventListener('head', e => { try { state.head = JSON.parse(e.data); state.headAt = performance.now(); } catch { /* a torn write */ } });

function placeEye(h) {
  // head.json's x, y and z are about -1..1 from the rest pose: the same gains as the twin's window, in screen distances
  const g = Number(ui.headgain.value);
  const e = { ex: (h.x || 0) * 0.35 * g, ey: (h.y || 0) * 0.25 * g, ez: (h.z || 0) * 0.3 * g };
  const near = 0.05, f = windowFrustum(e, { screenDist: 1, halfW: halfW(), halfH: HALF_H, near });
  camera.position.set(e.ex, e.ey, -e.ez);
  camera.updateMatrixWorld();
  camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, near, 100);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

// ---------------------------------------------------------------------------------------------
// The Magic Eye (M): the depth map itself, as a single-image stereogram (tools/twin/stereogram.mjs)
// ---------------------------------------------------------------------------------------------
const magic = { on: OPT.get('magic') === '1', cross: OPT.get('cross') === '1', strength: 0.3, key: '', img: null, tile: null, tileH: 128, period: 0, started: 0, w: 0, h: 0 };
function setMagic(on) {
  magic.on = on; ui.magiceye.checked = on;
  magicCanvas.style.display = on ? 'block' : 'none';
  canvas.style.opacity = on ? 0 : 1;
  if (on) { magic.started = performance.now(); magic.key = ''; }
}
function drawMagic() {
  const w = Math.round(stage.clientWidth), h = Math.round(stage.clientHeight);
  if (w < 2 || h < 2 || !state.depth) return;
  if (magic.w !== w || magic.h !== h) {
    magic.w = w; magic.h = h; magicCanvas.width = w; magicCanvas.height = h;
    magic.img = magicCtx.createImageData(w, h);
    magic.period = Math.min(160, Math.max(70, Math.round(w / 10)));
    magic.tile = patternTile(magic.period, magic.tileH);
    magic.key = '';
  }
  const key = `${state.depthStamp},${magic.cross},${w}x${h}`;
  if (key !== magic.key) {
    const d = new Uint8Array(w * h * 4); // the depth map resampled to the picture, near white
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[(y * w + x) * 4] = sampleBilinear(state.depth, state.dw, state.dh, (x + 0.5) / w, (y + 0.5) / h, state.stride);
    stereogramInto(d, w, h, { period: magic.period, strength: magic.strength, cross: magic.cross, tile: magic.tile, tileH: magic.tileH }, magic.img.data);
    magic.key = key;
  }
  magicCtx.putImageData(magic.img, 0, 0);
  const now = performance.now(), sep = separation(0, magic.period, magic.strength, magic.cross), half = (sep / 2) * Math.min(1, (now - magic.started) / 2500);
  for (const x of [w / 2 - half, w / 2 + half]) {
    magicCtx.beginPath(); magicCtx.arc(x, 16, 6, 0, Math.PI * 2);
    magicCtx.fillStyle = '#000'; magicCtx.fill(); magicCtx.lineWidth = 2; magicCtx.strokeStyle = '#fff'; magicCtx.stroke();
  }
  if (now - magic.started < 9000) {
    const t = magic.cross ? 'Cross your eyes slightly until the two dots become three, then hold still.' : 'Face close, look as if far behind the screen, lean back slowly: when the two dots become three, hold still.';
    magicCtx.font = '13px system-ui, sans-serif';
    magicCtx.fillStyle = 'rgba(0,0,0,0.7)'; magicCtx.fillRect(8, 30, Math.min(w - 16, magicCtx.measureText(t).width + 16), 26);
    magicCtx.fillStyle = '#fff'; magicCtx.fillText(t, 16, 48);
  }
}
ui.magiceye.addEventListener('change', () => setMagic(ui.magiceye.checked));
window.addEventListener('keydown', e => {
  const typing = e.target && (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && !/^(checkbox|range|file)$/.test(e.target.type)));
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'm' || e.key === 'M') setMagic(!magic.on);
  else if ((e.key === 'c' || e.key === 'C') && magic.on) { magic.cross = !magic.cross; magic.started = performance.now(); magic.key = ''; }
  else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen?.(); }
});
window.addEventListener('resize', layout);

// ---------------------------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------------------------
function frame() {
  const h = headOffset();
  if (state.live && !state.busy) estimate(); // a live window: the model runs again as soon as it is free
  if (magic.on) drawMagic();
  else { placeEye(h); renderer.render(scene, camera); }
  ui.status.textContent = [
    state.el ? `picture: ${state.label} (${state.fw} x ${state.fh})` : 'no picture yet',
    state.loading || (state.error ? `depth: ${state.error}` : state.device && state.frames ? `depth: estimated by the model on the ${state.device}, ${state.ms.toFixed(0)} ms a picture${state.live ? `, ${state.frames} so far` : ''}` : 'depth: the model starts with the first picture'),
    remote && state.breakdown && state.frames ? `  = ${state.breakdown}` : '',
    state.fallbacks.length && state.device ? `(tried first: ${state.fallbacks.join('; ')})` : '',
    state.depth ? 'the depth is the model\'s estimate from the picture, not the game\'s' : 'flat until the model answers',
    `head: ${h.source}`,
    magic.on ? `Magic Eye, ${magic.cross ? 'crossed' : 'parallel'} eyes (M leaves, C switches); one repeat ${magic.period} px` : 'M: Magic Eye of the depth; F: full screen',
  ].filter(Boolean).join('\n');
  requestAnimationFrame(frame);
}

async function boot() {
  layout(); updateSurface();
  if (magic.on) setMagic(true);
  requestAnimationFrame(frame);
  try { await listShots(); } catch { /* no reports here */ }
  const pick = OPT.get('shot') || (ui.source.options[0] && ui.source.options[0].value) || '';
  if (pick) {
    if ([...ui.source.options].some(o => o.value === pick)) ui.source.value = pick;
    await useImage(`/api/shot/${pick}`, pick);
  }
  document.body.dataset.ready = '1';
}
boot().catch(e => { ui.status.textContent = 'could not start: ' + e.message; });
