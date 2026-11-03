// A compact live summary of one or more run directories, for the live board (lens2). Read-only: it reads the runs' progress
// files, finished records and RUNLOGs, and prints one JSON object. It runs where the runs are (the PC), so only the summary
// crosses the network. Several directories are merged (v1a's finished lives with v1b's live ones).
//   node lens2/pc_summary.mjs <runs dir> [more runs dirs]
import fs from 'node:fs';
import path from 'node:path';
const dirs = process.argv.slice(2);
const ARMS = ['F', 'F2', 'L', 'LH', 'Y'];
const runs = [];
for (const dir of dirs) {
  const prog = path.join(dir, 'progress');
  if (!fs.existsSync(prog)) continue;
  for (const f of fs.readdirSync(prog).filter(f => f.endsWith('.jsonl'))) {
    const m = f.match(/^(\w+)_s(\d+)_w(\d+)\.jsonl$/); if (!m) continue;
    const lines = fs.readFileSync(path.join(prog, f), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    runs.push({ arm: m[1], seed: +m[2], world: +m[3], mtime: fs.statSync(path.join(prog, f)).mtimeMs, lines });
  }
}
// per arm, per tick: the mean over runs and characters of the window's prediction score and good eats
const byArm = {};
for (const arm of ARMS) {
  const acc = new Map();
  for (const r of runs.filter(r => r.arm === arm)) for (const l of r.lines) {
    if (l.t % 512 !== 0) continue; // the closing partial window is left out of the means
    const a = acc.get(l.t) || { score: 0, good: 0, collapses: 0, n: 0 };
    for (const c of l.chars) { a.score += c.score; a.good += c.goodEats; a.collapses += c.collapses; a.n += 1; }
    acc.set(l.t, a);
  }
  byArm[arm] = [...acc].sort((x, y) => x[0] - y[0]).map(([t, a]) => ({ t, score: a.score / a.n, good: a.good / a.n, collapses: a.collapses / a.n, n: a.n }));
}
// now playing: the (seed, world) updated most recently, with each arm's full scoreboard
const latest = runs.slice().sort((a, b) => b.mtime - a.mtime)[0];
const playing = latest ? { seed: latest.seed, world: latest.world, arms: Object.fromEntries(ARMS.map(arm => {
  const r = runs.find(x => x.arm === arm && x.seed === latest.seed && x.world === latest.world);
  return [arm, r ? { seasons: r.lines.map(l => [l.t, l.season]), chars: [0, 1, 2, 3].map(c => r.lines.map(l => ({ t: l.t, ...l.chars[c] }))) } : null];
})) } : null;
// finished runs: their records' readouts
const done = [];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => /^\w+_s\d+_w\d+\.json$/.test(f))) {
    try {
      const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), l = r.lives[0];
      const ws = (l.series || []).flat(), awake = ws.length ? ws.reduce((a, w) => a + w.awake, 0) / ws.length : null;
      done.push({ arm: r.arm, seed: r.seed, world: l.worldSeed, NGE: l.NGE, collapses: l.collapsesPer10k, toxic: l.toxicEatRate, nourish: l.nourishEatRate, ce: l.ceAnswer, awake, k5: r.k5Mismatches });
    } catch { /* a record still being written */ }
  }
}
const runlog = dirs.map(dir => (fs.existsSync(path.join(dir, 'RUNLOG.txt')) ? fs.readFileSync(path.join(dir, 'RUNLOG.txt'), 'utf8') : '')).join('\n');
const total = [...runlog.matchAll(/: (\d+) runs, at most/g)].reduce((a, x) => a + Number(x[1]), 0) || 192;
console.log(JSON.stringify({ at: new Date().toISOString(), total, started: runs.length, finished: (runlog.match(/ exit 0:/g) || []).length || done.length, failed: (runlog.match(/ exit [1-9]\d*:/g) || []).length, byArm, playing, done }));
