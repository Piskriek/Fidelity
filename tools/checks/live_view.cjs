#!/usr/bin/env node
// tools/checks/live_view.cjs - the browser check behind the /live page's numbers (apps/wow-twin/README.md):
//   1. at rest, with ?overscan=0, the view is the screenshot (mean difference in 0..255);
//   2. with the head 0.3 to the right and to the left, how far the far, middle and near bands slide (px);
//   3. with the default 5% overscan, how much of the edge a moved head leaves black;
//   4. the Magic Eye of the depth decodes back to the depth (median and 90th percentile error).
// It starts the twin itself, drives headless Chromium with Playwright, saves the pictures, then measures them with
// tools/checks/live_view_measure.py (numpy and Pillow). Needs: Playwright with a Chromium, the reports branch
// (origin/owner/reports) fetched, Python with numpy and Pillow, and network for the depth model (from Hugging Face,
// cached by the browser). The model runs on the processor here (no WebGPU in headless Chromium): minutes, not seconds.
//
//   node tools/checks/live_view.cjs [--out <dir>] [--shot 20261105-0530/WoWScrnShot_110526_052834.jpg] [--python python3]
//
// Exit status: 0 when every measure is within the bounds printed, 1 otherwise.
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', fs.mkdtempSync(path.join(os.tmpdir(), 'live-view-'))));
const SHOT = opt('--shot', '20261105-0530/WoWScrnShot_110526_052834.jpg');
const PY = opt('--python', process.platform === 'win32' ? 'python' : 'python3');

const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { console.error('live_view: needs Playwright (npm i -D playwright, then npx playwright install chromium)'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort();
  const twin = spawn(process.execPath, [path.join(ROOT, 'tools', 'twin', 'server.mjs'), '--port', String(port)], { cwd: ROOT, stdio: 'ignore' });
  const stop = () => { try { twin.kill(); } catch { /* gone */ } };
  process.on('exit', stop);
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 250)); if (await fetch(`http://127.0.0.1:${port}/live`).then(r => r.ok).catch(() => false)) break; }
  // the depth model comes from the internet: use the machine's proxy when there is one (not for the twin itself)
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({ ...(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  const open = async (extra, name) => {
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(`${name}: ${e}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text().slice(0, 300)}`); });
    await page.goto(`http://127.0.0.1:${port}/live?shot=${SHOT}&device=wasm&chrome=0${extra}`);
    await page.waitForFunction(() => window.__depth && window.__depth.frames >= 1, null, { timeout: 600000, polling: 500 });
    await page.waitForTimeout(800);
    return page;
  };
  const grab = async (page, sel, file) => {
    const url = await page.$eval(sel, c => c.toDataURL('image/png'));
    fs.writeFileSync(path.join(OUT, file), Buffer.from(url.split(',')[1], 'base64'));
  };

  let page = await open('&head=0,0,0&overscan=0', 'rest');
  await grab(page, '#view', 'rest.png');
  const depth = await page.evaluate(() => {
    const d = window.__depth; let s = ''; const a = d.depth;
    for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
    return { b64: btoa(s), w: d.dw, h: d.dh, device: d.device };
  });
  fs.writeFileSync(path.join(OUT, 'depth.raw'), Buffer.from(depth.b64, 'base64'));
  fs.writeFileSync(path.join(OUT, 'depth.json'), JSON.stringify({ w: depth.w, h: depth.h, device: depth.device }));
  await page.close();
  for (const [file, extra] of [['head-right.png', '&head=0.3,0,0&overscan=0'], ['head-left.png', '&head=-0.3,0,0&overscan=0'], ['head-right-overscan.png', '&head=0.3,0,0']]) {
    page = await open(extra, file); await grab(page, '#view', file); await page.close();
  }
  page = await open('&magic=1', 'magic');
  await page.waitForTimeout(9500); // the caption fades
  await grab(page, '#magic', 'magic.png');
  await page.close();
  await browser.close();
  stop();

  // the screenshot itself, from the reports branch, to compare the resting view with
  const [stamp, file] = SHOT.split('/');
  const shot = spawnSync('git', ['-C', ROOT, 'show', `origin/owner/reports:reports/${stamp}/${file}`], { maxBuffer: 64 << 20 });
  if (shot.status !== 0) { console.error('live_view: could not read the screenshot from origin/owner/reports (git fetch origin owner/reports)'); process.exit(2); }
  fs.writeFileSync(path.join(OUT, 'shot.jpg'), shot.stdout);
  console.log(`live_view: pictures in ${OUT} (depth on the ${depth.device}); page errors: ${errors.length ? errors.join(' | ') : 'none'}`);
  const m = spawnSync(PY, [path.join(__dirname, 'live_view_measure.py'), OUT], { stdio: 'inherit' });
  process.exit(errors.length ? 1 : (m.status === null ? 1 : m.status));
})().catch(e => { console.error('live_view: failed:', e.message); process.exit(1); });
