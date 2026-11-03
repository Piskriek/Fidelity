// Scores PREREG_bridge_v1a.md: E1 (L ahead of F), the regime checks M1-M3, H1 (LH against L, reported) and T against L
// (reported), with the comparison rule of BRIDGE_DESIGN.md §6.4. The references (O, T, S, RND) are run here, on the same
// world seeds, with run/lockstep.mjs; the neural arms are read from live.mjs records.
//   node mind/score_bridge_v1a.mjs <records dir> [--expect <live.mjs sha256>]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { makeO, makeT, makeS, makeRND, readouts } from '../run/baselines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const dir = process.argv[2], expectAt = process.argv.indexOf('--expect'), expect = expectAt > 0 ? process.argv[expectAt + 1] : null;
const SEEDS = [1, 2, 3], WORLDS = [...Array(16).keys()].map(i => 101 + i), ARMS = ['F', 'F2', 'L', 'LH'];
const out = [], say = s => { out.push(s); console.log(s); };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
const f2 = x => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : x.toFixed(2));

// the neural arms: one record per (arm, model seed, world seed)
const rec = {}, problems = [];
for (const arm of ARMS) for (const s of SEEDS) for (const w of WORLDS) {
  const f = path.join(dir, `${arm}_s${s}_w${w}.json`);
  if (!fs.existsSync(f)) { problems.push(`missing ${path.basename(f)}`); continue; }
  const r = JSON.parse(fs.readFileSync(f, 'utf8')), before = problems.length; // review fix: a record with any problem is refused
  if (r.arm !== arm || r.seed !== s || r.worlds[0] !== w || r.worlds[1] !== 1 || r.ticks !== P.lifeTicks) problems.push(`${path.basename(f)}: not the declared run`);
  if (r.k5Mismatches !== 0) problems.push(`${path.basename(f)}: K5 mismatches ${r.k5Mismatches}`);
  if (expect && r.script !== expect) problems.push(`${path.basename(f)}: script ${r.script.slice(0, 8)}, expected ${expect.slice(0, 8)}`);
  if (!/W0_s(\d)\.json$/.test(r.trunk) || +r.trunk.match(/W0_s(\d)\.json$/)[1] !== s) problems.push(`${path.basename(f)}: trunk ${r.trunk} is not W0_s${s}`);
  if (problems.length > before) { problems.push(`${path.basename(f)}: refused, scored as missing`); continue; }
  rec[`${arm}|${s}|${w}`] = r.lives[0];
}
// the references: one life per world seed, every valley the same reference mind (as run/baselines.mjs)
const ref = {};
for (const [name, make] of Object.entries({ O: makeO, T: makeT, S: makeS, RND: makeRND })) for (const w of WORLDS) {
  const m = make();
  ref[`${name}|${w}`] = readouts(runLife(P, { worldSeed: w, minds: [m, m, m, m] }));
}

const scripts = [...new Set(Object.values(rec).length ? fs.readdirSync(dir).filter(f => /\.json$/.test(f) && !/SCORE/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).script) : [])];
say(`bridge v1a score, ${new Date().toISOString()}, records from ${dir}`);
say(`live.mjs hashes: ${scripts.join(', ') || 'none'}; scorer ${crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex')}`);
if (problems.length) { say(`PROBLEMS (${problems.length}):`); problems.slice(0, 40).forEach(p => say(`  ${p}`)); }

// values for one arm or reference over the 48 (model seed, world seed) pairs; a reference repeats its world value per seed
const val = (who, key) => SEEDS.flatMap(s => WORLDS.map(w => {
  const r = ARMS.includes(who) ? rec[`${who}|${s}|${w}`] : ref[`${who}|${w}`];
  return r ? r[key] : NaN;
}));
const NGE = who => val(who, 'NGE');
const floor = (() => { const d = NGE('F').map((x, i) => x - NGE('F2')[i]); return d.some(Number.isNaN) ? NaN : sd(d); })();
const m = Math.max(1.0, 3 * floor);
say(`noise floor: sd(F - F') over 48 pairs = ${f2(floor)}; margin m = max(1.0, 3 sd) = ${f2(m)} NGE`);

// the comparison rule (§6.4): (a) each model seed's mean X - Y over its worlds > 0; (b) at least 36 of 48 pairs favour X;
// (c) mean X - Y >= k * m. Between two references (no model seed) the pairs are the 16 worlds: (a) is dropped, (b) is 12 of 16.
function ahead(X, Y, k = 1) {
  const refOnly = !ARMS.includes(X) && !ARMS.includes(Y);
  const x = NGE(X), y = NGE(Y), d = x.map((v, i) => v - y[i]);
  if (d.some(Number.isNaN) || Number.isNaN(m)) return { ok: false, na: true, text: 'n/a (missing or refused records)' }; // review fix: not scored, never WRONG
  const dd = refOnly ? d.slice(0, 16) : d;
  const perSeed = SEEDS.map((_, si) => mean(d.slice(16 * si, 16 * si + 16)));
  const a = refOnly ? true : perSeed.every(v => v > 0), wins = dd.filter(v => v > 0).length, b = refOnly ? wins >= 12 : wins >= 36, c = mean(dd) >= k * m;
  return { ok: a && b && c, text: `${a && b && c ? 'YES' : 'no'} (mean ${f2(mean(dd))}, need >= ${f2(k * m)}; ${refOnly ? '' : `per model seed ${perSeed.map(f2).join(' ')}; `}${wins} of ${dd.length} pairs favour ${X})` };
}

say('');
say('NGE by arm (mean over its pairs; per model seed):');
for (const who of [...ARMS, 'O', 'T', 'S', 'RND']) {
  const v = NGE(who);
  say(`  ${who.padEnd(4)} ${f2(mean(v))}${ARMS.includes(who) ? `   (${SEEDS.map((_, si) => f2(mean(v.slice(16 * si, 16 * si + 16)))).join(' ')})` : ''}`);
}
const M1 = ahead('S', 'RND'), M2 = ahead('O', 'F', 3), M3 = ahead('T', 'F');
say('');
say(`Regime checks: M1 S ahead of RND: ${M1.text}`);
say(`               M2 O ahead of F by 3m: ${M2.text}`);
say(`               M3 T ahead of F by m: ${M3.text}`);
const regime = M1.ok && M2.ok && M3.ok, regimeNA = M1.na || M2.na || M3.na;
const E1 = ahead('L', 'F');
say('');
say(`E1 (L ahead of F): ${regimeNA ? `not scored (a regime check could not be computed); for the record: ${E1.text}` : regime ? E1.text : `no test (a regime check failed); for the record: ${E1.text}`}`);
const h = NGE('LH').map((v, i) => v - NGE('L')[i]);
say(`H1 (LH against L, two-sided, reported only): mean ${f2(mean(h))}; per model seed ${SEEDS.map((_, si) => f2(mean(h.slice(16 * si, 16 * si + 16)))).join(' ')}; ${h.filter(v => v > 0).length} of 48 favour LH`);
const tl = NGE('T').map((v, i) => v - NGE('L')[i]);
say(`T against L (reported): mean T - L ${f2(mean(tl))}; ${tl.filter(v => v > 0).length} of 48 favour T`);

say('');
say('Secondary readouts (decide nothing): mean per arm');
const KEYS = ['meanV', 'painPer100', 'collapsesPer10k', 'toxicEatRate', 'nourishEatRate', 'NGElast4k', 'ceAnswer', 'ceEatItem'];
for (const who of [...ARMS, 'O', 'T', 'S', 'RND']) say(`  ${who.padEnd(4)} ${KEYS.map(k => { const v = val(who, k).filter(x => typeof x === 'number' && !Number.isNaN(x)); return `${k} ${v.length ? f2(mean(v)) : 'n/a'}`; }).join('  ')}`);

say('');
say('Locked predictions (PREREG_bridge_v1a.md):');
const grade = (X, predictedPass) => (X.na ? 'not scored (missing or refused records)' : X.ok === predictedPass ? 'RIGHT' : 'WRONG');
say(`  M1 passes: ${grade(M1, true)}`);
say(`  M2 passes: ${grade(M2, true)}`);
say(`  M3 passes: ${grade(M3, true)}`);
say(`  E1 fails: ${regimeNA ? 'not scored (a regime check could not be computed)' : regime ? grade(E1, false) : 'no test'}`); // review fix: the prereg predicts E1 fails
say(`  T matches or beats L (mean T - L >= -m): ${Number.isNaN(mean(tl)) || Number.isNaN(m) ? 'not scored (missing or refused records)' : mean(tl) >= -m ? 'RIGHT' : 'WRONG'}`);
if (problems.length) say(`  INCOMPLETE: ${problems.length} problem(s) above; refused records were scored as missing`);
fs.writeFileSync(path.join(dir, 'SCORE_bridge_v1a.txt'), out.join('\n') + '\n');
if (problems.length) process.exitCode = 1;
