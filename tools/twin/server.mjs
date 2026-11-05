#!/usr/bin/env node
// tools/twin/server.mjs - the digital twin's local server: the viewer (apps/wow-twin), three.js from
// node_modules, the addon's map data, the owner's reports (read from git, origin/owner/reports), and a live
// event stream (Server-Sent Events) carrying the head tracker's head.json and any pose a telemetry source posts.
//
//   npm run twin                      then open http://127.0.0.1:5203
//   node tools/twin/server.mjs --port 5203 --family tbc --head tools/headtrack/head.json --ref origin/owner/reports
//
// It listens on 127.0.0.1 only, needs no package beyond the repo's, and writes nothing. It reads nothing from
// the game: the map data and the reports are files the addon and the laptop already produce.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readMap, ROOT } from './data.mjs';
import { parseSavedVariables, reportSteps, assignShots } from './savedvars.mjs';
import { readTerrainConstants } from '../../packages/triad-369/src/rung_ledger.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const STAMP = /^\d{8}-\d{4}$/;
const SHOT = /^WoWScrnShot_\d{6}_\d{6}\.jpg$/;
// the director's blind readings of a report's overlay-off twin, where a round committed them
const BLIND = { '20261105-0530': 'docs/council/2026-11-04-rungs/judge/blind10_scene.json' };

export function parseArgs(argv) {
  const o = { port: 5203, family: 'tbc', head: path.join(ROOT, 'tools', 'headtrack', 'head.json'), ref: 'origin/owner/reports', host: '127.0.0.1' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === '--port') { o.port = Number(v); i++; }
    else if (a === '--family') { o.family = v; i++; }
    else if (a === '--head') { o.head = path.resolve(v); i++; }
    else if (a === '--ref') { o.ref = v; i++; }
    else throw new Error(`twin: unknown argument ${a}`);
  }
  if (!Number.isInteger(o.port) || o.port < 0 || o.port > 65535) throw new Error('twin: --port needs a port number');
  if (!/^(tbc|vanilla)$/.test(o.family)) throw new Error('twin: --family is tbc or vanilla');
  if (!/^[\w./-]+$/.test(o.ref)) throw new Error('twin: --ref is a git ref');
  return o;
}

const git = (args, encoding = 'utf8') => execFileSync('git', ['-C', ROOT, ...args], { encoding, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });

/** Starts the server; resolves to { server, port, close() }. */
export function startTwin(opts = {}) {
  const o = { ...parseArgs([]), ...opts };
  let mapJson = null;
  const map = () => (mapJson ??= JSON.stringify(readMap(o.family)));
  const clients = new Set();
  const send = (event, data) => { const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`; for (const res of clients) res.write(line); };
  // the head tracker writes head.json about every three frames: forward each new version
  let headStamp = '';
  const headTimer = setInterval(() => {
    let st;
    try { st = fs.statSync(o.head); } catch { return; }
    const stamp = `${st.mtimeMs}:${st.size}`;
    if (stamp === headStamp) return;
    headStamp = stamp;
    try {
      const h = JSON.parse(fs.readFileSync(o.head, 'utf8'));
      if ([h.x, h.y, h.z].every(Number.isFinite)) send('head', { x: h.x, y: h.y, z: h.z, at: h.at ?? null, fps: h.fps ?? null });
    } catch { /* a half-written file: the next poll reads it whole */ }
  }, 30);
  const keepAlive = setInterval(() => { for (const res of clients) res.write(': keep-alive\n\n'); }, 15000);

  const reply = (res, code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  const json = (res, code, value) => reply(res, code, TYPES['.json'], JSON.stringify(value));
  const file = (res, base, rel) => {
    const p = path.resolve(base, rel);
    if (!p.startsWith(path.resolve(base) + path.sep) && p !== path.resolve(base)) return json(res, 403, { error: 'outside the served folder' });
    fs.readFile(p, (err, buf) => (err ? json(res, 404, { error: 'not found' }) : reply(res, 200, TYPES[path.extname(p)] || 'application/octet-stream', buf)));
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://twin');
    const p = decodeURIComponent(url.pathname);
    try {
      if (req.method === 'POST' && p === '/api/pose') {
        let body = '';
        req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
        req.on('end', () => {
          let pose;
          try { pose = JSON.parse(body); } catch { return json(res, 400, { error: 'not JSON' }); }
          const ok = pose && ['x', 'y', 'facing'].every(k => Number.isFinite(pose[k])) && ['z', 'zoom', 'pitch', 'fovY'].every(k => pose[k] === undefined || Number.isFinite(pose[k]));
          if (!ok) return json(res, 400, { error: 'a pose needs finite x, y and facing (z, zoom, pitch and fovY optional)' });
          const clean = { x: pose.x, y: pose.y, z: pose.z ?? null, facing: pose.facing, zoom: pose.zoom ?? null, pitch: pose.pitch ?? null, fovY: pose.fovY ?? null, source: String(pose.source || 'posted').slice(0, 40) };
          send('pose', clean);
          json(res, 200, { ok: true, listeners: clients.size });
        });
        return;
      }
      if (req.method !== 'GET') return json(res, 405, { error: 'GET or POST /api/pose' });
      if (p === '/' || p === '/index.html') return file(res, path.join(ROOT, 'apps', 'wow-twin'), 'index.html');
      if (p.startsWith('/app/')) return file(res, path.join(ROOT, 'apps', 'wow-twin'), p.slice(5));
      if (p === '/shared/camera.mjs') return file(res, path.join(ROOT, 'tools', 'twin'), 'camera.mjs');
      if (p.startsWith('/vendor/three/')) {
        const rel = p.slice('/vendor/three/'.length);
        if (!/^(build\/three\.module(\.min)?\.js|build\/three\.core(\.min)?\.js|examples\/jsm\/[\w/.-]+\.js)$/.test(rel)) return json(res, 404, { error: 'not served' });
        return file(res, path.join(ROOT, 'node_modules', 'three'), rel);
      }
      if (p === '/api/map') return reply(res, 200, TYPES['.json'], map());
      if (p === '/api/camera') {
        // the camera in use (the addon's saved defaults) and the proposal the ledger holds (not confirmed)
        const c = readTerrainConstants(fs.readFileSync(path.join(ROOT, 'FidelityEMatrix', 'EMatrix_Terrain.lua'), 'utf8'));
        let proposal = null;
        try { proposal = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'rungs', 'ledger.json'), 'utf8')).proposals['projection:abbey-door'] || null; } catch { proposal = null; }
        return json(res, 200, { default: c.camera, proposal: proposal && { pitch: proposal.pitch, fovY: proposal.fovY, report: proposal.report, heldOut: proposal.heldOut && proposal.heldOut.result, status: proposal.status } });
      }
      if (p === '/api/reports') {
        let list = [];
        try { list = git(['ls-tree', '--name-only', o.ref, 'reports/']).split('\n').map(s => s.replace(/^reports\//, '')).filter(s => STAMP.test(s)); } catch { /* the ref is not fetched here */ }
        return json(res, 200, { ref: o.ref, reports: list });
      }
      let m = p.match(/^\/api\/report\/(\d{8}-\d{4})$/);
      if (m) {
        const stamp = m[1];
        let saved, files;
        try {
          saved = parseSavedVariables(git(['show', `${o.ref}:reports/${stamp}/FidelityEMatrix.lua`]));
          files = git(['ls-tree', '--name-only', o.ref, `reports/${stamp}/`]).split('\n').map(s => s.split('/').pop()).filter(s => SHOT.test(s));
        } catch { return json(res, 404, { error: `no report ${stamp} on ${o.ref}` }); }
        // match every shot of the report to its file first (in time order), then keep the steps with a pose
        const steps = assignShots(reportSteps(saved), files).filter(s => s.pose || (s.twin && s.twin.pose));
        let blind = null;
        if (BLIND[stamp]) try { blind = JSON.parse(fs.readFileSync(path.join(ROOT, BLIND[stamp]), 'utf8')); } catch { blind = null; }
        return json(res, 200, { stamp, files, steps, blind });
      }
      m = p.match(/^\/api\/shot\/(\d{8}-\d{4})\/([^/]+)$/);
      if (m && SHOT.test(m[2])) {
        let buf;
        try { buf = git(['show', `${o.ref}:reports/${m[1]}/${m[2]}`], 'buffer'); } catch { return json(res, 404, { error: 'no such shot' }); }
        return reply(res, 200, TYPES['.jpg'], buf);
      }
      if (p === '/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write(`event: hello\ndata: ${JSON.stringify({ head: path.relative(ROOT, o.head), family: o.family })}\n\n`);
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      return json(res, 404, { error: 'not found' });
    } catch (e) {
      return json(res, 500, { error: String(e && e.message || e) });
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(o.port, o.host, () => {
      const port = server.address().port;
      resolve({
        server, port,
        close: () => new Promise(r => { clearInterval(headTimer); clearInterval(keepAlive); for (const c of clients) c.end(); server.close(() => r()); }),
      });
    });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const opts = parseArgs(process.argv.slice(2));
  startTwin(opts).then(({ port }) => {
    console.log(`twin: http://${opts.host}:${port}  (map ${opts.family}, reports from ${opts.ref}, head from ${path.relative(ROOT, opts.head)})`);
  }, e => { console.error(`twin: ${e.message}`); process.exit(1); });
}
