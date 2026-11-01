// The live lens: a read-only window onto Four Valleys for the owner (BRIDGE_DESIGN.md §3.8, §5).
// It steps one world with a reference mind in each valley, reads snapshots and step answers, and streams them to the
// page. It never writes the world: it only calls step() with the minds' actions, like the runner. Plain Node.
//   node lens/server.mjs   then open http://localhost:5177
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hash32 } from '../world/hash.mjs';
import { createWorld, step, snapshot, ANSWERS, EAT, PASS, REST, NOURISH, PLAIN, TOXIC } from '../world/valleys.mjs';
import { makeTokens } from '../bridge/tokens.mjs';
import { makeO, makeT, makeS, makeRND } from '../run/baselines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const K = makeTokens(P);
const PORT = +(process.env.LENS_PORT || 5177);
const MINDS = [{ name: 'Oracle', note: 'knows the season (reference)', make: makeO }, { name: 'Learner', note: 'remembers what each fruit did', make: makeT }, { name: 'Eats all', note: 'eats whatever it finds', make: makeS }, { name: 'Random', note: 'acts at random', make: makeRND }];
const EFFECT = ['nourishing', 'plain', 'toxic'];
const KIND = ['', 'a', 'b', 'c'];
const ACT = ['eat', 'pass', 'rest'];

// ---------------------------------------------------------------- the live world
let life = 0, world, minds, stats, tps = 20, paused = false, recent = [];
function newLife() {
  life += 1;
  world = createWorld(P, 1000 + life);
  minds = MINDS.map(m => m.make());
  stats = MINDS.map(() => ({ withItem: 0, nourish: 0, toxic: 0, collapses: 0, history: [] }));
  recent = [];
  pushEvent(`A new life begins (world ${1000 + life}). Season 1.`);
}
const events = [];
// repeated events of the same kind for the same character are grouped with a count, so one restless valley
// does not drown the others
function pushEvent(text, key = text) {
  const t = world ? world.t : 0, last = events[events.length - 1];
  if (last && last.key === key && t - last.t < 400) { last.count += 1; last.t = t; last.text = `${text} (${last.count} times recently)`; return; }
  events.push({ t, life, text, key, count: 1 }); if (events.length > 60) events.shift();
}

function tick() {
  const snap = snapshot(world), table = world.table;
  const obs = snap.valleys.map(b => K.encodeObs(b));
  const acts = obs.map((tok, c) => {
    const u = hash32(1000 + life, 0x55, c, world.t) / 4294967296;
    const m = minds[c];
    const a = m.oracle ? m.choose(c, tok, u, world.t, table) : m.choose(c, tok, u, world.t);
    return K.decodeAction(K.encodeAction(a));
  });
  const items = snap.valleys.map(b => b.item), seasonBefore = world.s, stageBefore = snap.valleys.map(b => b.stage), lb = snap.valleys.map(b => b.loopBreaks);
  const outs = step(world, acts);
  outs.forEach((o, c) => {
    minds[c].feel(c, K.encodeAnswer(o.answer, o.starving), { gain: o.gain, pain: 0 });
    const s = stats[c], item = items[c];
    if (item && !snap.valleys[c].down) {
      s.withItem++;
      const eff = table[c][item - 1];
      if (acts[c] === EAT && eff === NOURISH) s.nourish++;
      if (acts[c] === EAT && eff === TOXIC) s.toxic++;
    }
    if (ANSWERS[o.answer] === 'COLLAPSE') { s.collapses++; pushEvent(`${MINDS[c].name} collapsed from ${o.cause === 'toxin' ? 'toxic fruit' : o.cause} and rests for ${P.collapse.downTicks} ticks`, `collapse-${c}`); }
  });
  const after = snapshot(world);
  after.valleys.forEach((b, c) => {
    if (b.stage > stageBefore[c]) pushEvent(`${MINDS[c].name}'s valley rose to stage ${b.stage}.`);
    if (b.loopBreaks > lb[c]) pushEvent(`Intensity lowered for ${MINDS[c].name}: the same cause collapsed it ${P.loopBreak.collapsesFromOneCause} times.`);
  });
  if (world.s !== seasonBefore) pushEvent(`Season ${world.s + 1} begins. The fruit may have changed; no one is told.`);
  recent.push({ t: world.t, acts, outs: outs.map(o => ({ answer: ANSWERS[o.answer], starving: o.starving })), items });
  if (recent.length > 8) recent.shift();
  if (world.t % 16 === 0) stats.forEach(s => { s.history.push(s.withItem ? (100 * (s.nourish - s.toxic)) / s.withItem : 0); if (s.history.length > 240) s.history.shift(); });
  if (world.t >= P.lifeTicks) newLife();
}

// what the lens shows: read only from the snapshot and the last answers
function view() {
  const snap = snapshot(world), last = recent[recent.length - 1];
  return {
    life, t: snap.t, season: snap.s + 1, seasonEnd: snap.seasonEnd, tps, paused,
    shared: world.shared.map(x => !!x),
    valleys: snap.valleys.map((b, c) => {
      const tokSees = K.decodeObs(K.encodeObs(b));
      return {
        mind: MINDS[c].name, note: MINDS[c].note,
        E: b.E, H: b.H, down: b.down, stage: b.stage, ell: b.ell,
        fear: b.fear,
        sees: b.down ? 'resting after a collapse' : b.item ? `fruit ${KIND[b.item]}` : 'no fruit',
        truth: b.down || !b.item ? null : EFFECT[world.table[c][b.item - 1]],
        table: world.table[c].map(e => EFFECT[e]),
        lastAct: last ? ACT[last.acts[c]] : null, lastItem: last ? KIND[last.items[c]] : null,
        lastAnswer: last ? last.outs[c].answer : null, starving: last ? last.outs[c].starving : false,
        score: stats[c].withItem ? (100 * (stats[c].nourish - stats[c].toxic)) / stats[c].withItem : 0,
        collapses: stats[c].collapses, history: stats[c].history,
        lensCheck: !tokSees.down ? (K.warningsOf(tokSees).HUNGRY === b.fear.HUNGRY && K.warningsOf(tokSees).WEAK === b.fear.WEAK) : true,
      };
    }),
    events: events.slice(-14).reverse(),
  };
}

// ---------------------------------------------------------------- the PC panel (v6), polled at most every 30 s
let pcCache = { at: 0, data: null };
function pcStatus() {
  if (Date.now() - pcCache.at < 30000 && pcCache.data) return pcCache.data;
  const key = process.env.PC_KEY || path.join(os.homedir(), '.ssh', 'pc_key');
  const r = spawnSync('ssh', ['-o', 'ConnectTimeout=5', '-o', 'BatchMode=yes', '-o', 'LogLevel=ERROR', '-i', key, process.env.PC_HOST || 'user@pc-host',
    'grep -c " exit 0" /f/fidelity-llm/pilot/results_v6/RUNLOG.txt 2>/dev/null; tasklist 2>/dev/null | grep -ci node; head -c 24 /f/fidelity-llm/pilot/results_v6/RUNLOG.txt 2>/dev/null'], { encoding: 'utf8', timeout: 15000 });
  const lines = (r.stdout || '').trim().split('\n');
  const data = r.status === 0 || lines.length >= 2 ? { reachable: true, v6done: +lines[0] || 0, v6total: 18, nodeProcs: +lines[1] || 0 } : { reachable: false };
  pcCache = { at: Date.now(), data };
  return data;
}

// ---------------------------------------------------------------- server
const clients = new Set();
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(fs.readFileSync(path.join(here, 'index.html'))); }
  if (url.pathname === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    clients.add(res); req.on('close', () => clients.delete(res));
    return res.write(`data: ${JSON.stringify(view())}\n\n`);
  }
  if (url.pathname === '/pc') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(pcStatus())); }
  if (url.pathname === '/control' && req.method === 'POST') {
    if (url.searchParams.has('tps')) tps = Math.max(1, Math.min(400, +url.searchParams.get('tps') || 20));
    if (url.searchParams.has('pause')) paused = url.searchParams.get('pause') === '1';
    res.writeHead(204); return res.end();
  }
  res.writeHead(404); res.end();
});

newLife();
let carry = 0;
setInterval(() => {
  if (!paused) { carry += tps / 10; while (carry >= 1) { tick(); carry -= 1; } }
  const msg = `data: ${JSON.stringify(view())}\n\n`;
  for (const c of clients) c.write(msg);
}, 100);
server.listen(PORT, () => console.log(`Four Valleys lens on http://localhost:${PORT}`));
