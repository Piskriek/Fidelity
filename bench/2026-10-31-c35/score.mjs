// Scores the C35 experiment exactly as PREREGISTRATION.md defines it.
// Usage: node bench/2026-10-31-c35/score.mjs <key.json> <reviewsDir> [--out RESULTS.md]
// Review files are named review_<arm>_<model>_<run>.json, each an array of {report, quote, problem}.
import fs from 'node:fs';
import path from 'node:path';

const [keyPath, dir] = process.argv.slice(2);
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const norm = s => String(s ?? '').replace(/[*_`#>]/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
// A finding counts for a claim when one text contains at least 25 consecutive characters of the other.
const overlaps = (a, b) => {
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  if (s.length < 25) return s.length >= 12 && l.includes(s);
  for (let i = 0; i + 25 <= s.length; i++) if (l.includes(s.slice(i, i + 25))) return true;
  return false;
};
const claims = key.map((k, i) => ({ id: i, report: k.report, kind: k.kind, s: norm(k.sentence) }));
const runs = fs.readdirSync(dir).filter(f => /^review_[AB]_\w+_\d+\.json$/.test(f)).map(f => {
  const [, arm, model, run] = f.match(/^review_([AB])_(\w+)_(\d+)\.json$/);
  let findings = [];
  try { findings = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { console.error(`unreadable: ${f}`); }
  const flagged = new Set();
  let unmatched = 0;
  for (const fd of findings) {
    const q = norm(fd.quote);
    const hits = claims.filter(c => (!fd.report || norm(fd.report).includes(c.report.replace('.md', '')) || norm(fd.report) === norm(c.report)) && overlaps(q, c.s));
    if (!hits.length) unmatched++;
    for (const h of hits) flagged.add(h.id);
  }
  return { file: f, arm, model, run: +run, flagged, findings: findings.length, unmatched };
});

const kinds = ['over-label', 'control', 'distractor'];
const rate = (rs, kind, reports = null) => {
  let hit = 0, n = 0;
  for (const r of rs) for (const c of claims) if (c.kind === kind && (!reports || reports.includes(c.report))) { n++; hit += r.flagged.has(c.id); }
  return { hit, n, p: n ? hit / n : NaN };
};
const pct = x => (Number.isFinite(x) ? `${Math.round(100 * x)}%` : '—');
const reports = [...new Set(claims.map(c => c.report))];

// Bootstrap over reports (clusters) and runs within each arm, for the B − A difference.
let seed = 7;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = a => a[Math.floor(rand() * a.length)];
const boot = (rsA, rsB, kind, B = 2000) => {
  const ds = [];
  for (let b = 0; b < B; b++) {
    const reps = reports.map(() => pick(reports));
    const ra = rsA.map(() => pick(rsA)), rb = rsB.map(() => pick(rsB));
    ds.push(rate(rb, kind, reps).p - rate(ra, kind, reps).p);
  }
  ds.sort((x, y) => x - y);
  return [ds[Math.floor(0.025 * B)], ds[Math.floor(0.975 * B)]];
};

const L = ['# C35 experiment: results', '', `Key: ${claims.length} claims (${kinds.map(k => `${claims.filter(c => c.kind === k).length} ${k}`).join(', ')}) in ${reports.length} reports. Reviews: ${runs.length} (${runs.map(r => `${r.arm}/${r.model}/${r.run}`).join(', ')}).`, ''];
L.push('| Group | Runs | Over-label recall | Control false flags | Distractor recall | Findings (unmatched) |', '|---|---|---|---|---|---|');
const groups = [['A', null], ['B', null], ['A', 'haiku'], ['B', 'haiku'], ['A', 'sonnet'], ['B', 'sonnet']];
for (const [arm, model] of groups) {
  const rs = runs.filter(r => r.arm === arm && (!model || r.model === model));
  if (!rs.length) continue;
  const [o, c, d] = kinds.map(k => rate(rs, k));
  L.push(`| ${arm}${model ? ` (${model})` : ' (all)'} | ${rs.length} | ${o.hit}/${o.n} (${pct(o.p)}) | ${c.hit}/${c.n} (${pct(c.p)}) | ${d.hit}/${d.n} (${pct(d.p)}) | ${rs.reduce((a, r) => a + r.findings, 0)} (${rs.reduce((a, r) => a + r.unmatched, 0)}) |`);
}
const A = runs.filter(r => r.arm === 'A'), Bm = runs.filter(r => r.arm === 'B');
const diff = k => rate(Bm, k).p - rate(A, k).p;
const [dO, dC, dD] = kinds.map(diff);
const [ciO, ciC, ciD] = kinds.map(k => boot(A, Bm, k));
L.push('', '| Difference, B − A (all runs) | Points | Bootstrap 95% interval |', '|---|---|---|');
L.push(`| Over-label recall | ${(100 * dO).toFixed(1)} | ${(100 * ciO[0]).toFixed(1)} to ${(100 * ciO[1]).toFixed(1)} |`);
L.push(`| Control false flags | ${(100 * dC).toFixed(1)} | ${(100 * ciC[0]).toFixed(1)} to ${(100 * ciC[1]).toFixed(1)} |`);
L.push(`| Distractor recall | ${(100 * dD).toFixed(1)} | ${(100 * ciD[0]).toFixed(1)} to ${(100 * ciD[1]).toFixed(1)} |`);
const verdict = dO >= 0.15 && dC <= 0.10 && dD >= -0.10 ? 'HELPS' : dO < 0.05 ? 'DOES NOT HELP' : 'INCONCLUSIVE';
L.push('', `**Verdict by the pre-registered criterion: ${verdict}.** (Helps: over-label recall +15 points or more, control false flags +10 or less, distractor recall −10 or less. Does not help: over-label recall below +5.)`);
L.push('', '## Per-claim flags', '', '| Report | Kind | A flagged | B flagged | Sentence |', '|---|---|---|---|---|');
for (const c of claims) {
  const fa = A.filter(r => r.flagged.has(c.id)).length, fb = Bm.filter(r => r.flagged.has(c.id)).length;
  L.push(`| ${c.report} | ${c.kind} | ${fa}/${A.length} | ${fb}/${Bm.length} | ${key[c.id].sentence.replace(/\|/g, '\\|').slice(0, 110)} |`);
}
const report = L.join('\n') + '\n';
if (out) fs.writeFileSync(out, report);
console.log(report.split('## Per-claim')[0]);
