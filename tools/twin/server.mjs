#!/usr/bin/env node
// tools/twin/server.mjs - the digital twin's local server: the viewer (apps/wow-twin), three.js from
// node_modules, the addon's map data, the owner's reports (read from git, origin/owner/reports), and a live
// event stream (Server-Sent Events) carrying the head tracker's head.json and any pose a telemetry source posts.
//
//   npm run twin                      then open http://127.0.0.1:5203
//                                     (or http://127.0.0.1:5203/live: a WoW picture or window you can look into)
//   node tools/twin/server.mjs --port 5203 --family tbc --head tools/headtrack/head.json --ref origin/owner/reports
//   --head http://192.168.0.5:5204/head.json reads the head from a tracker on another machine (headtrack.py --serve 5204)
//   --depth http://192.168.0.5:5205 sends /live's pictures to a depth service on another machine (tools/depthd)
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
  const o = { port: 5203, family: 'tbc', head: path.join(ROOT, 'tools', 'headtrack', 'head.json'), ref: 'origin/owner/reports', host: '127.0.0.1', depth: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (['--port', '--family', '--head', '--ref', '--depth'].includes(a) && (v === undefined || v.startsWith('--'))) throw new Error(`twin: ${a} needs a value`);
    if (a === '--port') { o.port = Number(v); i++; }
    else if (a === '--family') { o.family = v; i++; }
    else if (a === '--head') { o.head = /^http:\/\//i.test(v) ? v : path.resolve(v); i++; } // a file, or another machine's tracker (--serve)
    else if (a === '--ref') { o.ref = v; i++; }
    else if (a === '--depth') { o.depth = v.replace(/\/+$/, ''); i++; } // a depth service on another machine (tools/depthd)
    else throw new Error(`twin: unknown argument ${a}`);
  }
  if (!Number.isInteger(o.port) || o.port < 0 || o.port > 65535) throw new Error('twin: --port needs a port number');
  if (!/^(tbc|vanilla)$/.test(o.family)) throw new Error('twin: --family is tbc or vanilla');
  if (!/^[\w./-]+$/.test(o.ref) || o.ref.startsWith('-')) throw new Error('twin: --ref is a git ref');
  if (o.depth !== null) { let u; try { u = new URL(o.depth); } catch { u = null; } if (!u || u.protocol !== 'http:' || u.username || u.password || (u.pathname !== '/' && u.pathname !== '')) throw new Error('twin: --depth is http://<machine>:<port> of a depth service'); }
  if (/^http:\/\//i.test(o.head)) { let u; try { u = new URL(o.head); } catch { throw new Error('twin: --head is a file or an http:// address'); } if (u.username || u.password) throw new Error('twin: --head takes no credentials'); }
  return o;
}

// a pose's numbers must be finite and in a sane range: UnitPosition's coordinates stay within a few thousand yards
const POSE_RANGE = { x: 20000, y: 20000, z: 4000, facing: 20, zoom: 100, pitch: 2, fovY: 3.2 };
export function cleanPose(pose) {
  if (!pose || typeof pose !== 'object' || Array.isArray(pose)) return null;
  const out = {};
  for (const [k, lim] of Object.entries(POSE_RANGE)) {
    const v = pose[k];
    const required = k === 'x' || k === 'y' || k === 'facing';
    if (v === undefined || v === null) { if (required) return null; out[k] = null; continue; }
    if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > lim) return null;
    out[k] = v;
  }
  out.source = typeof pose.source === 'string' && pose.source.length <= 40 ? pose.source : 'posted';
  return out;
}

const git = (args, encoding = 'utf8') => execFileSync('git', ['-C', ROOT, ...args], { encoding, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });

/** Starts the server; resolves to { server, port, close() }. */
export function startTwin(opts = {}) {
  const o = { ...parseArgs([]), ...opts };
  let mapJson = null;
  const map = () => (mapJson ??= JSON.stringify(readMap(o.family)));
  const clients = new Set();
  const send = (event, data) => { const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`; for (const res of clients) res.write(line); };
  // the head tracker writes head.json about every three frames: forward each new version (the timers start
  // once the server listens, so a failed start leaves nothing running)
  let headStamp = '', headTimer = null, keepAlive = null;
  const forwardHead = text => {
    try {
      const h = JSON.parse(text);
      if ([h.x, h.y, h.z].every(Number.isFinite)) send('head', { x: h.x, y: h.y, z: h.z, at: typeof h.at === 'string' ? h.at.slice(0, 40) : null, fps: Number.isFinite(h.fps) ? h.fps : null });
    } catch { /* a half-written file: the next poll reads it whole */ }
  };
  // or another machine's tracker (headtrack.py --serve): its newest head, fetched one request at a time
  const headUrl = /^http:\/\//i.test(o.head) ? o.head : null;
  const headAgent = headUrl ? new http.Agent({ keepAlive: true, maxSockets: 1 }) : null;
  const depthAgent = o.depth ? new http.Agent({ keepAlive: true, maxSockets: 2 }) : null;
  let headBusy = false;
  const pollHeadUrl = () => {
    if (headBusy) return;
    headBusy = true;
    let done = false;
    const finish = () => { if (!done) { done = true; headBusy = false; } };
    const req = http.get(headUrl, { agent: headAgent, timeout: 500 }, res => {
      if (res.statusCode !== 200) { res.resume(); finish(); return; }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => { if (body.length < 65536) body += c; });
      res.on('end', () => { finish(); if (body !== headStamp) { headStamp = body; forwardHead(body); } });
      res.on('error', finish);
    });
    req.on('timeout', () => req.destroy());
    req.on('error', finish);
    req.on('close', finish);
  };
  const pollHead = () => {
    if (headUrl) return pollHeadUrl();
    let st;
    try { st = fs.statSync(o.head); } catch { return; }
    const stamp = `${st.mtimeMs}:${st.size}`;
    if (stamp === headStamp) return;
    headStamp = stamp;
    try { forwardHead(fs.readFileSync(o.head, 'utf8')); } catch { /* gone between the stat and the read */ }
  };

  const reply = (res, code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  const json = (res, code, value) => reply(res, code, TYPES['.json'], JSON.stringify(value));
  const file = (res, base, rel) => {
    const p = path.resolve(base, rel);
    if (!p.startsWith(path.resolve(base) + path.sep) && p !== path.resolve(base)) return json(res, 403, { error: 'outside the served folder' });
    fs.readFile(p, (err, buf) => (err ? json(res, 404, { error: 'not found' }) : reply(res, 200, TYPES[path.extname(p)] || 'application/octet-stream', buf)));
  };

  let port = 0;
  const local = new Set();
  const server = http.createServer((req, res) => {
    try {
      // only this machine's own names (a foreign Host is DNS rebinding) and no other site's page
      if (!local.has(String(req.headers.host || ''))) return json(res, 403, { error: 'this server answers only 127.0.0.1 and localhost' });
      const origin = req.headers.origin;
      if (origin && !local.has(origin.replace(/^http:\/\//, ''))) return json(res, 403, { error: 'requests from other sites are refused' });
      const url = new URL(req.url, 'http://twin');
      const p = decodeURIComponent(url.pathname);
      if (p.includes('\0')) return json(res, 400, { error: 'bad path' });
      if (req.method === 'POST' && p === '/api/pose') {
        // JSON only: a page elsewhere cannot send it without a preflight this server never grants
        if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return json(res, 415, { error: 'a pose is sent as application/json' });
        let body = '';
        req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
        req.on('end', () => {
          try {
            let pose;
            try { pose = JSON.parse(body); } catch { return json(res, 400, { error: 'not JSON' }); }
            const clean = cleanPose(pose);
            if (!clean) return json(res, 400, { error: 'a pose needs x, y and facing as numbers in range (z, zoom, pitch and fovY optional)' });
            send('pose', clean);
            json(res, 200, { ok: true, listeners: clients.size });
          } catch (e) {
            console.error(`twin: ${e && e.message}`);
            if (!res.headersSent) json(res, 500, { error: 'server error' });
          }
        });
        return;
      }
      if (req.method === 'POST' && p === '/api/depth') {
        // a picture from the page, passed to the depth service and its depth passed back; a picture type only, so a
        // page elsewhere cannot send it without a preflight this server never grants
        if (!o.depth) return json(res, 404, { error: 'no depth service: start the twin with --depth http://<machine>:<port>' });
        const type = String(req.headers['content-type'] || '');
        if (!/^image\/(jpeg|png)\b/i.test(type)) return json(res, 415, { error: 'a picture is sent as image/jpeg or image/png' });
        const chunks = [];
        let size = 0, tooBig = false;
        req.on('data', c => { size += c.length; if (size > (8 << 20)) { tooBig = true; req.destroy(); } else chunks.push(c); });
        req.on('end', () => {
          if (tooBig) return;
          const body = Buffer.concat(chunks);
          const up = http.request(`${o.depth}/depth`, { method: 'POST', agent: depthAgent, timeout: 20000, headers: { 'content-type': type, 'content-length': body.length } }, r => {
            const out = [];
            r.on('data', c => out.push(c));
            r.on('error', () => { if (!res.headersSent) json(res, 502, { error: 'the depth service broke off' }); });
            r.on('end', () => {
              if (res.headersSent) return;
              if (r.statusCode !== 200) return json(res, 502, { error: `the depth service answered ${r.statusCode}` });
              const headers = { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' };
              for (const h of ['content-encoding', 'x-depth-width', 'x-depth-height', 'x-depth-ms', 'x-depth-device']) if (r.headers[h]) headers[h] = String(r.headers[h]).slice(0, 80);
              res.writeHead(200, headers);
              res.end(Buffer.concat(out));
            });
          });
          up.on('timeout', () => up.destroy(new Error('timeout')));
          up.on('error', () => { if (!res.headersSent) json(res, 502, { error: 'the depth service did not answer' }); });
          up.end(body);
        });
        return;
      }
      if (req.method !== 'GET') return json(res, 405, { error: 'GET, or POST /api/pose or /api/depth' });
      if (p === '/api/depth') return json(res, 200, { remote: o.depth });
      if (p === '/' || p === '/index.html') return file(res, path.join(ROOT, 'apps', 'wow-twin'), 'index.html');
      if (p === '/live' || p === '/live.html') return file(res, path.join(ROOT, 'apps', 'wow-twin'), 'live.html');
      if (p.startsWith('/app/')) return file(res, path.join(ROOT, 'apps', 'wow-twin'), p.slice(5));
      if (/^\/shared\/(camera|stereogram|relief)\.mjs$/.test(p)) return file(res, path.join(ROOT, 'tools', 'twin'), p.slice('/shared/'.length));
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
        res.write(`event: hello\ndata: ${JSON.stringify({ head: headUrl || path.relative(ROOT, o.head), family: o.family, depth: o.depth })}\n\n`);
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      return json(res, 404, { error: 'not found' });
    } catch (e) {
      // a malformed request (a bad escape, a bad path) or a fault: a generic answer, the detail only in the console
      console.error(`twin: ${e && e.message}`);
      if (res.headersSent) { res.end(); return; }
      return json(res, e instanceof URIError ? 400 : 500, { error: e instanceof URIError ? 'bad request' : 'server error' });
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(o.port, o.host, () => {
      port = server.address().port;
      for (const name of ['127.0.0.1', 'localhost', '[::1]']) local.add(`${name}:${port}`);
      headTimer = setInterval(pollHead, 30);
      keepAlive = setInterval(() => { for (const res of clients) res.write(': keep-alive\n\n'); }, 15000);
      resolve({
        server, port,
        close: () => new Promise(r => { clearInterval(headTimer); clearInterval(keepAlive); if (headAgent) headAgent.destroy(); if (depthAgent) depthAgent.destroy(); for (const c of clients) c.end(); server.close(() => r()); }),
      });
    });
  });
}

const isEntry = () => { try { return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } };
if (process.argv[1] && isEntry()) {
  const opts = parseArgs(process.argv.slice(2));
  startTwin(opts).then(({ port }) => {
    console.log(`twin: http://${opts.host}:${port}  (map ${opts.family}, reports from ${opts.ref}, head from ${path.relative(ROOT, opts.head)})`);
  }, e => { console.error(`twin: ${e.message}`); process.exit(1); });
}
