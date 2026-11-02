// lens3: the being's-eye lens (LENS_BRIEF.md). A read-only page over the thought recorder's files: it serves the
// picture view (picture.html, at /), the game view (game.html, at /game), the words view (index.html, at /words), the reply
// speaker (reply.html, at /reply, reading lens3/reply.json) and the .jsonl files in mind/runs/thoughts/, nothing else. It never runs a world or a mind. Plain Node.
//   node lens3/server.mjs [--port 5179]   then open http://localhost:5179
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const THOUGHTS = path.join(here, '..', 'mind', 'runs', 'thoughts');
const argPort = process.argv.indexOf('--port');
const PORT = +(argPort > 0 ? process.argv[argPort + 1] : process.env.LENS3_PORT || 5179);
// the page may talk to its own server only
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.end(body);
}

function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, 'text/plain', 'read-only');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/' || url.pathname === '/picture') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(here, 'picture.html')));
  if (url.pathname === '/reply') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(here, 'reply.html')));
  if (url.pathname === '/reply.json') { const f = path.join(here, 'reply.json'); return fs.existsSync(f) ? send(res, 200, 'application/json; charset=utf-8', fs.readFileSync(f)) : send(res, 404, 'text/plain', 'no reply yet'); }
  if (url.pathname === '/game') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(here, 'game.html')));
  if (url.pathname === '/words' || url.pathname === '/index.html') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(here, 'index.html')));
  if (url.pathname === '/thoughts/') {
    const files = fs.readdirSync(THOUGHTS).filter(f => f.endsWith('.jsonl')).sort();
    return send(res, 200, 'application/json', JSON.stringify(files));
  }
  const m = url.pathname.match(/^\/thoughts\/([\w.-]+\.jsonl)$/);
  if (m && fs.existsSync(path.join(THOUGHTS, m[1]))) return send(res, 200, 'application/x-ndjson; charset=utf-8', fs.readFileSync(path.join(THOUGHTS, m[1])));
  send(res, 404, 'text/plain', 'not found');
}

// local only: both loopback addresses, never the network
http.createServer(handler).listen(PORT, '127.0.0.1', () => console.log(`Four Valleys lens3 on http://localhost:${PORT} (files from ${THOUGHTS})`));
http.createServer(handler).listen(PORT, '::1').on('error', () => {});
