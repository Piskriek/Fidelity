// Scores PREREG_bridge_v1b.md: E2 (L ahead of Y, the yoked arm), with the comparison rule of BRIDGE_DESIGN.md §6.4, v1a's
// margin and v1a's regime checks. L, F and F2 are the v1a records (script 7f814cbf); Y is read from the v1b records. Every Y
// record carries its source lane's NGE: the source is an exact L life on the same model seed and world, so it must equal the
// v1a L record, or the Y record is refused. Adapted from score_bridge_v1a.mjs (the rule code is the same).
//   node mind/score_bridge_v1b.mjs <v1b records dir> <v1a records dir> [--expect <live_y.mjs sha256>]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { makeO, makeT, makeS, makeRND, readouts } from '../run/baselines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const ydir = process.argv[2], dir = process.argv[3], expectAt = process.argv.indexOf('--expect'), expect = expectAt > 0 ? process.argv[expectAt + 1] : null;
const V1A = '7f814cbf959b6e9c885c28b0340b565abf15462f33c643f22532e1dcce9a20bc';
const V1B = '1360ab19561fd26ee9300055f558357a58a11af1a5e00f644ada1421552992ef'; // review fix (Amendment 1): the locked Y runner, always enforced
const SEEDS = [1, 2, 3], WORLDS = [...Array(16).keys()].map(i => 101 + i), ARMS = ['F', 'F2', 'L', 'Y'];
const out = [], say = s => { out.push(s); console.log(s); };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
const f2 = x => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : x.toFixed(2));

// one record per (arm, model seed, world seed); a record with any problem is refused and scored as missing
const rec = {}, problems = [];
for (const arm of ARMS) for (const s of SEEDS) for (const w of WORLDS) {
  const f = path.join(arm === 'Y' ? ydir : dir, `${arm}_s${s}_w${w}.json`);
  if (!fs.existsSync(f)) { problems.push(`missing ${path.basename(f)}`); continue; }
  const r = JSON.parse(fs.readFileSync(f, 'utf8')), before = problems.length;
  if (r.arm !== arm || r.seed !== s || r.worlds[0] !== w || r.worlds[1] !== 1 || r.ticks !== P.lifeTicks) problems.push(`${path.basename(f)}: not the declared run`);
  if (r.k5Mismatches !== 0) problems.push(`${path.basename(f)}: K5 mismatches ${r.k5Mismatches}`);
  if (arm === 'Y' && r.script !== (expect || V1B)) problems.push(`${path.basename(f)}: script ${r.script.slice(0, 8)}, expected ${(expect || V1B).slice(0, 8)}`);
  if (arm === 'Y' && (r.live?.headLr !== 0.002 || r.bus !== false || r.armCfg?.yoke !== '(c + 1) mod 4')) problems.push(`${path.basename(f)}: not the declared yoked arm (head rate, bus or yoke)`);
  if (arm !== 'Y' && r.script !== V1A) problems.push(`${path.basename(f)}: not a v1a record`);
  if (!/W0_s(\d)\.json$/.test(r.trunk) || +r.trunk.match(/W0_s(\d)\.json$/)[1] !== s) problems.push(`${path.basename(f)}: trunk ${r.trunk} is not W0_s${s}`);
  if (arm === 'Y') {
    const lf = path.join(dir, `L_s${s}_w${w}.json`), l = fs.existsSync(lf) ? JSON.parse(fs.readFileSync(lf, 'utf8')).lives[0] : null, src = r.lives[0].source;
    if (!l || !src || src.NGE !== l.NGE || src.collapsesPer10k !== l.collapsesPer10k || src.ceAnswer !== l.ceAnswer || src.k5 !== 0) problems.push(`${path.basename(f)}: its source lane does not reproduce the v1a L life`);
  }
  if (problems.length > before) { problems.push(`${path.basename(f)}: refused, scored as missing`); continue; }
  rec[`${arm}|${s}|${w}`] = r.lives[0];
}
// the references, as in v1a (for the regime checks)
const ref = {};
for (const [name, make] of Object.entries({ O: makeO, T: makeT, S: makeS, RND: makeRND })) for (const w of WORLDS) {
  const m = make();
  ref[`${name}|${w}`] = readouts(runLife(P, { worldSeed: w, minds: [m, m, m, m] }));
}

const yScripts = [...new Set(fs.existsSync(ydir) ? fs.readdirSync(ydir).filter(f => /^Y_.*\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(ydir, f), 'utf8')).script) : [])];
say(`bridge v1b score, ${new Date().toISOString()}, Y records from ${ydir}, v1a records from ${dir}`);
say(`live_y.mjs hashes: ${yScripts.join(', ') || 'none'}; scorer ${crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex')}`);
if (problems.length) { say(`PROBLEMS (${problems.length}):`); problems.slice(0, 40).forEach(p => say(`  ${p}`)); }

const val = (who, key) => SEEDS.flatMap(s => WORLDS.map(w => {
  const r = ARMS.includes(who) ? rec[`${who}|${s}|${w}`] : ref[`${who}|${w}`];
  return r ? r[key] : NaN;
}));
const NGE = who => val(who, 'NGE');
const floor = (() => { const d = NGE('F').map((x, i) => x - NGE('F2')[i]); return d.some(Number.isNaN) ? NaN : sd(d); })();
const m = Math.max(1.0, 3 * floor);
say(`noise floor (v1a): sd(F - F') over 48 pairs = ${f2(floor)}; margin m = max(1.0, 3 sd) = ${f2(m)} NGE`);

// the comparison rule (§6.4), as in v1a
function ahead(X, Y, k = 1) {
  const refOnly = !ARMS.includes(X) && !ARMS.includes(Y);
  const x = NGE(X), y = NGE(Y), d = x.map((v, i) => v - y[i]);
  if (d.some(Number.isNaN) || Number.isNaN(m)) return { ok: false, na: true, text: 'n/a (missing or refused records)' };
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
say(`Regime checks (as in v1a): M1 ${M1.text}; M2 ${M2.text}; M3 ${M3.text}`);
const regime = M1.ok && M2.ok && M3.ok, regimeNA = M1.na || M2.na || M3.na;
const E2 = ahead('L', 'Y');
say('');
say(`E2 (L ahead of Y): ${regimeNA ? `not scored (a regime check could not be computed); for the record: ${E2.text}` : regime ? E2.text : `no test (a regime check failed); for the record: ${E2.text}`}`);
const yf = NGE('Y').map((v, i) => v - NGE('F')[i]);
say(`Y against F (two-sided, reported only): mean ${f2(mean(yf))}; per model seed ${SEEDS.map((_, si) => f2(mean(yf.slice(16 * si, 16 * si + 16)))).join(' ')}; ${yf.filter(v => v > 0).length} of 48 favour Y`);

say('');
say('Secondary readouts (decide nothing): mean per arm');
const KEYS = ['meanV', 'painPer100', 'collapsesPer10k', 'toxicEatRate', 'nourishEatRate', 'NGElast4k', 'ceAnswer', 'ceEatItem'];
const yl = SEEDS.flatMap(s => WORLDS.map(w => rec[`Y|${s}|${w}`])).filter(Boolean);
if (yl.length) { const sum = k => yl.reduce((a, l) => a + (l.collapseCauses?.[k] || 0), 0); say(`  Y collapse causes (sum over its lives): toxin ${sum('toxin')}, hunger ${sum('hunger')}, other ${sum('other')}; loop-breaks per character ${f2(mean(yl.flatMap(l => l.loopBreaks || [])))}; characters ending at intensity 1: ${yl.flatMap(l => l.ellEnd || []).filter(e => e === 1).length} of ${yl.length * 4} (the v1a records do not carry these)`); }
for (const who of ARMS) say(`  ${who.padEnd(4)} ${KEYS.map(k => { const v = val(who, k).filter(x => typeof x === 'number' && !Number.isNaN(x)); return `${k} ${v.length ? f2(mean(v)) : 'n/a'}`; }).join('  ')}`);

say('');
say('Locked predictions (PREREG_bridge_v1b.md):');
const grade = (X, predictedPass) => (X.na ? 'not scored (missing or refused records)' : X.ok === predictedPass ? 'RIGHT' : 'WRONG');
say(`  E2 passes: ${regimeNA ? 'not scored (a regime check could not be computed)' : regime ? grade(E2, true) : 'no test'}`);
say(`  Y ahead of F on mean NGE (mean Y - F > 0): ${yf.some(Number.isNaN) ? 'not scored (missing or refused records)' : mean(yf) > 0 ? 'RIGHT' : 'WRONG'}`); // review fix (Amendment 1)
if (problems.length) say(`  INCOMPLETE: ${problems.length} problem(s) above; refused records were scored as missing`);
fs.writeFileSync(path.join(ydir, 'SCORE_bridge_v1b.txt'), out.join('\n') + '\n');
if (problems.length) process.exitCode = 1;
