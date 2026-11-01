#!/usr/bin/env node
// score_v6.mjs: scores the v6 runs mechanically against PREREG_v6.md.
//   node score_v6.mjs results_v6 results_v5 [--expect <sha256 of levels_v6.mjs>]   (writes results_v6/SCORE_v6.txt)
// A, B and R come from v5. A rule that needs a missing run reads "incomplete"; if v5's regime failed, "no test".
import fs from 'node:fs';
import path from 'node:path';

const dir6 = process.argv[2] || 'results_v6', dir5 = process.argv[3] || 'results_v5';
const expectIdx = process.argv.indexOf('--expect'), expect = expectIdx > 0 ? process.argv[expectIdx + 1] : null;
const SEEDS = [1, 2, 3], PURE_MIN = 1000;
const lines = [];
const say = (...a) => { const t = a.join(' '); lines.push(t); console.log(t); };
const f4 = x => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(4));
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
const load = (d, arm, s) => { const p = path.join(d, `${arm}_s${s}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };

const runs = { A: {}, B: {}, R: {} };
for (const s of [1, 2, 3, 4, 5, 6]) runs.B[s] = load(dir5, 'B', s);
for (const s of SEEDS) { runs.R[s] = load(dir5, 'R', s); runs.A[s] = load(dir5, 'A', s); }
const NEW = ['R9', 'Rskip', 'Rup', 'RC', 'RCtop', 'RCx'];
for (const arm of NEW) { runs[arm] = {}; for (const s of SEEDS) runs[arm][s] = load(dir6, arm, s); }
say(`v6 score, ${new Date().toISOString()}, v6 runs from ${dir6}, A, B and R from ${dir5}`);
const all = Object.entries(runs).flatMap(([arm, o]) => Object.entries(o).map(([s, r]) => ({ arm, s, r })));
const missing = all.filter(x => !x.r).map(x => `${x.arm}_s${x.s}`);
if (missing.length) say(`MISSING runs: ${missing.join(', ')}`);
const v6runs = all.filter(x => x.r && NEW.includes(x.arm));
const scripts = [...new Set(v6runs.map(x => x.r.script))], steps = [...new Set(all.filter(x => x.r).map(x => x.r.steps))];
say(`v6 script hashes: ${scripts.join(', ') || 'none'}; steps (all runs): ${steps.join(', ') || 'none'}`);
if (scripts.length > 1) say('WARNING: the v6 runs come from more than one script.');
if (steps.some(n => n !== 40000)) say('WARNING: some runs are not 40,000 steps.');
if (expect && scripts.some(h => h !== expect)) say(`WARNING: a v6 run's script hash differs from the expected ${expect}.`);

const have = arm => SEEDS.every(s => runs[arm][s]);
const ce = (arm, s) => runs[arm][s].eval.ce;
const bAll = [1, 2, 3, 4, 5, 6].filter(s => runs.B[s]).map(s => ce('B', s));
const m = Math.max(0.014, bAll.length >= 2 ? 3 * sd(bAll) : 0.014);
say(`margin m = ${f4(m)} (v5 B seeds ${bAll.map(f4).join(' ')})`);
const ahead = (X, Y) => {
  if (!have(X) || !have(Y)) return { ok: null };
  const d = SEEDS.map(s => ce(Y, s) - ce(X, s));
  return { ok: d.every(x => x > 0) && mean(d) >= m, d, mean: mean(d) };
};
const show = (X, Y) => { const a = ahead(X, Y); return a.ok === null ? `${X} vs ${Y}: incomplete` : `${X} ahead of ${Y}: ${a.ok ? 'YES' : 'no'} (diffs ${a.d.map(f4).join(' ')}, mean ${f4(a.mean)})`; };

say('\nCE by arm (eval.ce / clean text / scrambled):');
for (const arm of Object.keys(runs)) {
  const ss = Object.keys(runs[arm]).filter(s => runs[arm][s] && (arm !== 'B' || +s <= 3));
  if (ss.length) say(`  ${arm.padEnd(6)} ${ss.map(s => `s${s} ${f4(ce(arm, s))}/${f4(runs[arm][s].evalClean.ce)}/${f4(runs[arm][s].evalShuffled ? runs[arm][s].evalShuffled.ce : null)}`).join('  ')}  mean ${f4(mean(ss.map(s => ce(arm, s))))}`);
}

// regime gate from v5: M1 B ahead of A; M3 B's CE on marked messages above clean, every seed
const M1 = ahead('B', 'A');
const M3 = have('B') ? SEEDS.every(s => runs.B[s].eval.poison.cePois > runs.B[s].eval.poison.ceClean) : null;
const regime = M1.ok === false || M3 === false ? 'no test' : M1.ok === null || M3 === null ? 'incomplete' : 'ok';
say(`\nRegime gate (from v5): M1 ${M1.ok === null ? 'incomplete' : M1.ok ? 'holds' : 'FAILS'}; M3 ${M3 === null ? 'incomplete' : M3 ? 'holds' : 'FAILS'}${regime !== 'ok' ? ` -> V1-V4 read ${regime.toUpperCase()}` : ''}`);

// a rule's result: 'pass' | 'fail' | 'no test' | 'incomplete'
const rule = oks => (regime !== 'ok' ? regime : oks.some(a => a.ok === null) ? 'incomplete' : oks.every(a => a.ok) ? 'pass' : 'fail');
say('\nRules:');
const v1a = ['R', 'Rskip', 'Rup'].map(Y => ahead('R9', Y)), V1 = rule(v1a);
say(`  V1 closed triangle: ${V1}`);
for (const Y of ['R', 'Rskip', 'Rup']) say(`     ${show('R9', Y)}`);
const v2a = ahead('RC', 'R9'), V2 = rule([v2a]);
say(`  V2 compassion: ${V2}  (${show('RC', 'R9')})`);
const v3a = ahead('RCtop', 'R9'), v3b = ahead('RC', 'RCtop'), V3a = rule([v3a]), V3b = rule([v3b]);
say(`  V3 who feels: the top alone helps: ${V3a} (${show('RCtop', 'R9')}); the gates add: ${V3b} (${show('RC', 'RCtop')})`);
const v4a = ahead('RC', 'RCx'), V4 = rule([v4a]);
say(`  V4 whose sting: ${V4}  (${show('RC', 'RCx')})`);

say('\nReadouts (decide nothing):');
// gap0: the pure cell for v6 arms (only bridge 0 differs); v5's R has no bridge 2 or echo, so its v5 cells 0 vs 4 are that group
const gap0 = (arm, r) => {
  if (!NEW.includes(arm)) { const c = r.eval.poison.cells0.g; return { v: c[0] !== null && c[4] !== null ? c[0] - c[4] : null, src: 'v5 cells 0/4' }; }
  const p = r.eval.poison, n = p.pureN || [0, 0];
  if (p.gap0pure === null || p.gap0pure === undefined || n[1] < PURE_MIN) return { v: null, src: `pure cell too small (n ${n.join('/')})` };
  return { v: p.gap0pure, src: `pure cell n ${n.join('/')}` };
};
const gap1 = r => { const c = r.eval.poison.cells1.g; return c[0] !== null && c[2] !== null ? c[0] - c[2] : null; };
for (const arm of Object.keys(runs)) {
  if (arm === 'A' || arm === 'B' || !have(arm)) continue;
  const rs = SEEDS.map(s => runs[arm][s]), p = r => r.eval.poison;
  say(`  ${arm.padEnd(6)} gap0 ${rs.map(r => { const g = gap0(arm, r); return `${f4(g.v)} [${g.src}]`; }).join(' ')} | gap1 ${rs.map(r => f4(gap1(r))).join(' ')}`);
  if (NEW.includes(arm)) say(`         gap2 (all characters) ${rs.map(r => f4(p(r).gap2)).join(' ')} | CE on bridge-2 clean/marked ${rs.map(r => `${f4(p(r).ce2Clean)}/${f4(p(r).ce2Marked)}`).join(' ')} | G02 mean ${rs.map(r => f4(p(r).g02Mean)).join(' ')} sd ${rs.map(r => f4(p(r).g02Sd)).join(' ')}`);
  say(`         scramble cost ${rs.map(r => f4(r.evalShuffled ? r.evalShuffled.ce - r.eval.ce : null)).join(' ')}`);
}
let mech = null;
if (have('RC') && have('R9')) {
  const a = SEEDS.map(s => gap0('RC', runs.RC[s]).v), b = SEEDS.map(s => gap0('R9', runs.R9[s]).v);
  mech = a.concat(b).some(x => x === null) ? null : mean(a) - mean(b);
  say(`  mechanism: RC gap0 - R9 gap0 (pure cell, seed means) = ${mech === null ? 'n/a (pure cell too small or missing)' : f4(mech)}`);
}

say('\nLocked predictions:' + (regime !== 'ok' ? ` (regime ${regime}: predictions not scored)` : ''));
const r = (res, want) => (res === 'pass' ? (want ? 'RIGHT' : 'WRONG') : res === 'fail' ? (want ? 'WRONG' : 'RIGHT') : `n/a (${res})`);
say(`  V1 fails: ${r(V1, false)}`);
say(`  V2 passes: ${r(V2, true)}`);
say(`  V3 RCtop not ahead of R9: ${r(V3a, false)}; RC ahead of RCtop: ${r(V3b, true)}`);
say(`  V4 passes: ${r(V4, true)}`);
say(`  mechanism RC gap0 exceeds R9's by >= 0.05: ${regime !== 'ok' ? `n/a (${regime})` : mech === null ? 'n/a' : mech >= 0.05 ? 'RIGHT' : 'WRONG'}`);

fs.writeFileSync(path.join(dir6, 'SCORE_v6.txt'), lines.join('\n') + '\n');
