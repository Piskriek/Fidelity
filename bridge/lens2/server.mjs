// The live board for the v1a lives: a read-only window onto the runs. Every 15 s it asks the PC for a compact summary
// (lens2/pc_summary.mjs, run there over SSH) and serves it to the page. It writes nothing anywhere.
//   node lens2/server.mjs                         the PC's F:/fidelity-llm/bridge/mind/runs/v1a
//   node lens2/server.mjs --source local:<dir>   a run directory on this machine (for a smoke run)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argSource = process.argv.indexOf('--source') > 0 ? process.argv[process.argv.indexOf('--source') + 1] : null;
const PORT = +(process.env.BOARD_PORT || 5178), SOURCE = argSource || process.env.SOURCE || 'pc';
let cache = { at: null, error: 'no summary yet' };

function refresh() {
  const [cmd, args] = SOURCE.startsWith('local:')
    ? [process.execPath, [path.join(here, 'pc_summary.mjs'), SOURCE.slice(6)]]
    : ['ssh', ['-o', 'ConnectTimeout=8', '-o', 'BatchMode=yes', '-o', 'LogLevel=ERROR', '-i', process.env.PC_KEY || path.join(os.homedir(), '.ssh', 'pc_key'), process.env.PC_HOST || 'user@pc-host',
      'node F:/fidelity-llm/bridge/lens2/pc_summary.mjs F:/fidelity-llm/bridge/mind/runs/v1a F:/fidelity-llm/bridge/mind/runs/v1b']];
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  p.stdout.on('data', d => { out += d; });
  p.stderr.on('data', d => { err += d; });
  const timer = setTimeout(() => p.kill(), 60000);
  p.on('close', code => {
    clearTimeout(timer);
    try { cache = { ...JSON.parse(out), source: SOURCE }; } catch { cache = { ...cache, error: `summary failed (exit ${code}): ${err.trim().slice(0, 200)}` }; }
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(fs.readFileSync(path.join(here, 'index.html'))); }
  if (url.pathname === '/data') { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); return res.end(JSON.stringify(cache)); }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Four Valleys live board on http://localhost:${PORT} (${SOURCE})`));
refresh();
setInterval(refresh, 15000);
