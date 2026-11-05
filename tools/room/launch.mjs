#!/usr/bin/env node
// tools/room/launch.mjs - the 3D in the room, all on one machine (the 3080 PC), with one command:
//
//   node tools/room/launch.mjs --phone 192.168.0.4                 the page runs the depth model itself (WebGPU)
//   node tools/room/launch.mjs --phone 192.168.0.4 --depth local   tools/depthd runs it (DirectML) and the page asks it
//
// It starts the head tracker on the phone's DroidCam stream (tools/headtrack/headtrack.py --room, writing head.json
// here), the depth service when asked (tools/depthd/depthd.py on 127.0.0.1), and the twin (tools/twin/server.mjs,
// reading that head.json), then says every few seconds, in plain words, what each part is doing, the open /live page
// included (it sends the twin its own numbers every 2 s: pictures drawn a second, the captured window's pictures a
// second, the depth's time a picture, the head's updates a second). Ctrl+C stops all.
// Each part's own output goes to tools/room/logs/<part>.log. Options: --phone <address> (required), --depth
// browser|local (default browser), --port <twin port> (5203), --python <python with OpenCV 4> (default: the
// repository's .venv), --stream <path on the phone> (/video/force/1280x720), --seconds <n> (stop after n seconds and
// print a summary, for checks).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOGS = path.join(ROOT, 'tools', 'room', 'logs');
const HEAD = path.join(ROOT, 'tools', 'headtrack', 'head.json');

export function parseArgs(argv) {
  const o = { phone: null, depth: 'browser', port: 5203, python: null, stream: '/video/force/1280x720', seconds: 0, depthPort: 5205, headPort: 5204 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    const take = () => { if (v === undefined || v.startsWith('--')) throw new Error(`room: ${a} needs a value`); i++; return v; };
    if (a === '--phone') o.phone = take();
    else if (a === '--depth') o.depth = take();
    else if (a === '--port') o.port = Number(take());
    else if (a === '--python') o.python = take();
    else if (a === '--stream') o.stream = take();
    else if (a === '--seconds') o.seconds = Number(take());
    else if (a === '--help' || a === '-h') o.help = true;
    else throw new Error(`room: unknown argument ${a}`);
  }
  if (o.help) return o;
  if (!o.phone || !/^[\w.-]+(:\d+)?$/.test(o.phone)) throw new Error('room: --phone is the address DroidCam shows, such as 192.168.0.4 (or 192.168.0.4:4747)');
  if (!['browser', 'local'].includes(o.depth)) throw new Error('room: --depth is browser (the page runs the model) or local (tools/depthd runs it)');
  if (!Number.isInteger(o.port) || o.port < 1 || o.port > 65535) throw new Error('room: --port is a port number');
  if (!/^\/[\w./-]*$/.test(o.stream)) throw new Error('room: --stream is a path such as /video');
  if (!(o.seconds >= 0)) throw new Error('room: --seconds is a number of seconds');
  return o;
}

/** The python with OpenCV 4: --python, else the repository's .venv (Windows or not), else "python". */
export function findPython(given, root = ROOT, exists = fs.existsSync) {
  if (given) return given;
  for (const p of [path.join(root, '.venv', 'Scripts', 'python.exe'), path.join(root, '.venv', 'bin', 'python')]) if (exists(p)) return p;
  return process.platform === 'win32' ? 'python' : 'python3';
}

/** The phone's stream address from what DroidCam shows (an address, with or without its port). */
export function streamUrl(phone, stream) {
  return `http://${/:\d+$/.test(phone) ? phone : `${phone}:4747`}${stream}`;
}

/** Plain words about the head from head.json's payload and its age. */
export function describeHead(head, ageMs) {
  if (!head) return 'head: no head.json yet (the tracker is starting, or waiting for the phone)';
  if (ageMs > 3000) return `head: head.json is ${Math.round(ageMs / 1000)} s old (the tracker stopped?)`;
  if (!(head.restWidth > 0)) return 'head: waiting to see your face (sit as you normally would, facing the phone)';
  const r = `rest x ${Number(head.restX).toFixed(2)} y ${Number(head.restY).toFixed(2)}, face ${Math.round(head.restWidth)} px`;
  const off = Math.abs(head.restX) > 0.6 || Math.abs(head.restY) > 0.6 ? '; your face is near the edge of the phone\'s picture: re-aim it and restart' : '';
  return `head: tracking (${r}), ${Number(head.fps).toFixed(1)} pictures a second, now x ${Number(head.x).toFixed(2)} y ${Number(head.y).toFixed(2)}${off}`;
}

const rate = v => (Number.isFinite(v) ? (v >= 10 ? String(Math.round(v)) : v.toFixed(1)) : '?');

/** Plain words about the /live page from the newest status it sent the twin (GET /api/live-status) and its age. */
export function describePage(st, ageMs, port = 5203) {
  if (!st) return `page: not open yet (in Chrome on this PC: http://localhost:${port}/live)`;
  if (!(ageMs <= 6000)) return `page: no word from it for ${Math.round(ageMs / 1000)} s (closed, minimized, or behind another tab: Chrome stops drawing a page nobody sees)`;
  const parts = [`drawing ${rate(st.renderFps)} pictures a second${st.width && st.height ? ` at ${st.width} x ${st.height}` : ''}${st.fullscreen ? ', full screen' : ''}${st.magic ? ', the Magic Eye' : ''}`];
  parts.push(st.live ? `the window captured at ${rate(st.captureFps)} pictures a second` : st.picture ? `a still picture, ${st.picture}` : 'no picture yet (click "Capture a window (live)")');
  if (st.depthError) parts.push(`depth: ${st.depthError}`);
  else if (st.depthNote) parts.push(`depth: ${st.depthNote}`);
  else if (Number.isFinite(st.depthMs)) parts.push(`depth ${Math.round(st.depthMs)} ms a picture on the ${st.depthDevice || 'model'}${st.live ? `, ${rate(st.depthPerSecond)} a second` : ''}`);
  else parts.push('depth: waiting for the first picture');
  parts.push(`head: ${st.head || '?'}${st.headPerSecond > 0 ? `, ${rate(st.headPerSecond)} updates a second` : ''}`);
  return `page: ${parts.join('; ')}${st.depthBreakdown ? `\n    where a depth picture's time goes: ${st.depthBreakdown}` : ''}`;
}

function probe(url, timeout = 3000) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout }, res => { res.resume(); resolve(res.statusCode); });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}
function getJson(url, timeout = 3000) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout }, res => {
      let body = ''; res.setEncoding('utf8');
      res.on('data', c => { if (body.length < 65536) body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

export async function launch(o, say = console.log) {
  fs.mkdirSync(LOGS, { recursive: true });
  const py = findPython(o.python);
  const url = streamUrl(o.phone, o.stream);
  const parts = [];
  const start = (name, cmd, args) => {
    const log = fs.createWriteStream(path.join(LOGS, `${name}.log`), { flags: 'a' });
    log.write(`\n--- ${new Date().toISOString()} ${cmd} ${args.join(' ')}\n`);
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const part = { name, child, lines: [], exited: null };
    for (const s of [child.stdout, child.stderr]) {
      s.setEncoding('utf8');
      let rest = '';
      s.on('data', d => {
        log.write(d);
        rest += d;
        const lines = rest.split(/\r?\n/); rest = lines.pop();
        for (const l of lines) if (l.trim()) { part.lines.push(l); if (part.lines.length > 50) part.lines.shift(); }
      });
    }
    child.on('error', e => { part.exited = `could not start (${e.message})`; });
    child.on('exit', (code, sig) => { part.exited = `stopped (${sig || `exit ${code}`})`; log.end(); });
    parts.push(part);
    return part;
  };

  say(`room: the phone's stream is ${url}`);
  const phoneAnswers = (await probe(`http://${/:\d+$/.test(o.phone) ? o.phone : `${o.phone}:4747`}/`)) !== null;
  say(phoneAnswers ? 'room: the phone answers' : 'room: the phone does not answer yet: open DroidCam on it, on the same Wi-Fi as this PC, and check the address it shows (the tracker will wait for it)');

  // the tracker serves its head by address too, so the page's "set my resting position" reaches it through the twin
  const tracker = start('headtrack', py, ['-u', path.join('tools', 'headtrack', 'headtrack.py'), '--source', url, '--no-gamepad', '--room', '--serve', String(o.headPort)]);
  let depth = null;
  if (o.depth === 'local') depth = start('depthd', py, ['-u', path.join('tools', 'depthd', 'depthd.py'), '--port', String(o.depthPort), '--host', '127.0.0.1']);
  const twinArgs = [path.join('tools', 'twin', 'server.mjs'), '--port', String(o.port), '--head', `http://127.0.0.1:${o.headPort}/head.json`];
  if (depth) twinArgs.push('--depth', `http://127.0.0.1:${o.depthPort}`);
  const twin = start('twin', process.execPath, twinArgs);

  const stopAll = () => { for (const p of parts) if (!p.exited) p.child.kill(); };
  process.once('SIGINT', () => { say('room: stopping'); stopAll(); setTimeout(() => process.exit(0), 500); });

  const report = async () => {
    const lines = [];
    let head = null, age = Infinity;
    try { const st = fs.statSync(HEAD); age = Date.now() - st.mtimeMs; head = JSON.parse(fs.readFileSync(HEAD, 'utf8')); } catch { /* not yet */ }
    const waiting = tracker.lines.filter(l => /waiting for the stream|still waiting/.test(l)).length;
    const up = tracker.lines.some(l => /the stream is up|frames; the smallest face/.test(l));
    lines.push(tracker.exited ? `tracker: ${tracker.exited}: see tools/room/logs/headtrack.log` : up ? 'phone: streaming' : waiting ? 'phone: the tracker is waiting for the phone\'s stream' : 'phone: connecting');
    if (!tracker.exited) lines.push(describeHead(head, age));
    if (depth) {
      const h = await getJson(`http://127.0.0.1:${o.depthPort}/health`);
      lines.push(depth.exited ? `depth: ${depth.exited}: see tools/room/logs/depthd.log` : h ? `depth: the service runs Depth Anything V2 Small on the ${h.device}` : 'depth: the service is starting (the first start downloads the model, about 50 MB)');
    } else lines.push('depth: the page runs the model itself on this graphics card (WebGPU)');
    const live = await probe(`http://127.0.0.1:${o.port}/live`);
    lines.push(twin.exited ? `twin: ${twin.exited}: see tools/room/logs/twin.log` : live === 200 ? `twin: ready: in Chrome open http://localhost:${o.port}/live, click "Capture a window (live)", pick WoW, press F` : 'twin: starting');
    // the page's own numbers (it sends them to the twin every 2 s)
    const lp = live === 200 ? await getJson(`http://127.0.0.1:${o.port}/api/live-status`) : null;
    if (live === 200) lines.push(describePage(lp && lp.status, lp && lp.ageMs, o.port));
    say(lines.map(l => `  ${l}`).join('\n'));
    const page = lp && lp.status && lp.ageMs <= 6000 ? lp.status : null;
    return { head, age, up, depthUp: depth ? !depth.exited : null, twinUp: live === 200, page, exited: parts.filter(p => p.exited).map(p => `${p.name} ${p.exited}`) };
  };

  return { parts, report, stopAll };
}

async function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  if (o.help) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')); return; }
  const run = await launch(o);
  const t0 = Date.now();
  let last = null;
  for (;;) {
    await new Promise(r => setTimeout(r, 5000));
    console.log(`room: ${Math.round((Date.now() - t0) / 1000)} s`);
    last = await run.report();
    if (o.seconds && Date.now() - t0 >= o.seconds * 1000) break;
  }
  run.stopAll();
  const pg = last.page && { drawn: last.page.renderFps, captured: last.page.captureFps, depthMs: last.page.depthMs, depthPerSecond: last.page.depthPerSecond, headPerSecond: last.page.headPerSecond, head: last.page.head };
  console.log(`room: done after ${o.seconds} s: ${JSON.stringify({ phone: last.up, face: !!(last.head && last.head.restWidth > 0), depth: last.depthUp, twin: last.twinUp, page: pg || null, stopped: last.exited })}`);
  setTimeout(() => process.exit(0), 500);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
