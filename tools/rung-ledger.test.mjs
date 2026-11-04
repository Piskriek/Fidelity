// tools/rung-ledger.test.mjs
// The recorded reading per rung (council round 2026-11-04-rungs): the addon's fits answer to the rows of
// docs/rungs/ledger.json through the one evaluator, packages/triad-369/src/rung_ledger.mjs. A value typed
// into FIT_BY_FILE with no reading behind it fails here; so does a status that says more than the ledger.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  evaluate, recheck, order, rungKeys, descendants, admit, estimateFit, fitTest, readTerrainConstants, terrainRungs,
  VERDICTS, VALUE_EPS, K_MAX,
} from '../packages/triad-369/src/rung_ledger.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const terrainSrc = fs.readFileSync(path.join(root, 'FidelityEMatrix', 'EMatrix_Terrain.lua'), 'utf8');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'rungs', 'ledger.json'), 'utf8'));
const BUILD = '2.5.6.70577';
const NOW = '2026-11-04 17:00:00';
const C = readTerrainConstants(terrainSrc);
const filesWithRows = [...new Set(ledger.rows.filter(r => r.rung.startsWith('fit:')).map(r => r.rung.slice(4)))];
const rungsFor = (c = C, opts = {}) => terrainRungs(c, { build: BUILD, files: filesWithRows, tolerance: ledger.tolerance, ...opts });
const run = (rungs = rungsFor(), rows = ledger.rows) => evaluate(rungs, rows, { now: NOW, manifests: ledger.manifests });

test('traceability: every fit in FIT_BY_FILE is a value a ledger row was read at, or the evaluator\'s proposal from the rows', () => {
  const res = run();
  for (const [file, k] of Object.entries(C.fitByFile)) {
    const rows = ledger.rows.filter(r => r.rung === 'fit:' + file);
    assert.ok(rows.length > 0, `${file}: a fit with no reading behind it`);
    const v = res.verdicts.get('fit:' + file);
    const readAt = v.admitted.some(id => Math.abs(ledger.rows.find(r => r.id === id).value - k) <= VALUE_EPS);
    const proposed = v.estimate && Math.abs(v.estimate.value - k) <= 0.02;
    assert.ok(readAt || proposed, `${file}: x${k} is neither a value read in the ledger (in the context now in use) nor its proposal (${JSON.stringify(v.estimate)})`);
  }
});

test('the fit status the addon prints is the ledger\'s verdict, from the same report', () => {
  const res = run();
  for (const file of Object.keys(C.fitByFile)) {
    const st = C.fitStatus[file];
    const v = res.verdicts.get('fit:' + file);
    assert.ok(st, `${file} has a fit but no FIT_STATUS`);
    assert.equal(st.verdict, v.verdict, `${file}: the addon prints ${st.verdict}, the ledger says ${v.verdict}`);
    assert.equal(st.report, v.report, `${file}: the addon cites ${st.report}, the ledger ${v.report}`);
  }
  for (const file of Object.keys(C.fitStatus)) assert.ok(file in C.fitByFile, `FIT_STATUS names ${file}, which has no fit`);
  assert.doesNotMatch(terrainSrc, /measured from your reports/, 'no fit may print itself as measured');
});

test('the interpolation knots are the fits in use, by nominal height', () => {
  const nominal = file => { for (const [w, h] of C.heightRules) if (file.includes(w)) return h; return C.heightDefault; };
  for (const [h, k] of C.fitKnots) {
    const match = Object.entries(C.fitByFile).find(([file, kk]) => nominal(file) === h && Math.abs(kk - k) < 1e-9);
    assert.ok(match, `knot (${h}, ${k}) is no file's fit in use`);
  }
  for (let i = 1; i < C.fitKnots.length; i++) assert.ok(C.fitKnots[i][0] > C.fitKnots[i - 1][0], 'knots ascend in height');
});

test('verdicts from the rows through the ninth report, at the values v1.8.8 uses', () => {
  const res = run();
  const v = id => res.verdicts.get(id).verdict;
  for (const id of ['map', 'axis', 'load', 'frame:PlayerModel', 'frame:DressUpModel']) assert.equal(v(id), 'holds', id);
  assert.equal(v('frame:Model'), 'fails', 'a plain Model frame drew nothing in five variants');
  assert.equal(v('fit:elwynnbush09'), 'fails', 'the bush\'s top sits a quarter below the frame top at x2');
  for (const f of ['westfallbarrel01', 'westfallcrate', 'jar01', 'elwynntreemid01', 'elwynntreecanopy04']) assert.equal(v('fit:' + f), 'fitted', f);
  assert.equal(v('projection:abbey-door'), 'unmeasured');
  for (const f of Object.keys(C.fitByFile)) assert.equal(v('height:' + f), 'blocked', 'a height rests on the projection and the fit');
  assert.ok(![...res.verdicts.keys()].some(id => /relative|position/.test(id)), 'relative position is not a rung');
  assert.ok(res.frontier.includes('projection:abbey-door'));
  for (const f of Object.keys(C.fitByFile)) assert.ok(res.frontier.includes('fit:' + f), f + ' is on the frontier');
  assert.ok(!res.frontier.includes('frame:Model'), 'a frame kind not in use is not asked for');
  for (const d of res.verdicts.values()) assert.ok(VERDICTS.includes(d.verdict));
  // the estimates the write-back took
  const est = f => res.verdicts.get('fit:' + f).estimate;
  assert.equal(est('westfallbarrel01').value, 0.51);
  assert.equal(est('westfallcrate').value, 0.37);
  assert.ok(est('westfallcrate').aspectNeeded > 1.8, 'the crate needs a frame about 1.85 as wide as tall');
  assert.equal(est('elwynntreecanopy04').value, 5.6);
  assert.equal(est('elwynnbush09'), null, 'the bush\'s base was never seen: nothing is proposed');
  assert.equal(est('jar01'), null, 'the jar\'s base was hidden: nothing is proposed');
});

test('at the values v1.8.7 used, the barrel, the crate and canopy04 fail and their proposals are the v1.8.8 values', () => {
  const old = { ...C, fitByFile: { elwynnbush09: 2.0, elwynntreemid01: 2.8, westfallbarrel01: 0.6, jar01: 0.37, westfallcrate: 0.42, elwynntreecanopy04: 2.8 } };
  const res = run(rungsFor(old));
  for (const f of ['westfallbarrel01', 'westfallcrate', 'elwynntreecanopy04', 'elwynnbush09']) assert.equal(res.verdicts.get('fit:' + f).verdict, 'fails', f);
  const barrel = res.verdicts.get('fit:westfallbarrel01');
  assert.ok(barrel.superseded.some(s => s.id === 'r8-124647-barrel-1' && s.by === 'r8-124647-barrel-2'), 'the grid reading of 124647 supersedes the first reading of the same shot');
  for (const f of ['westfallbarrel01', 'westfallcrate', 'elwynntreecanopy04']) assert.equal(res.verdicts.get('fit:' + f).estimate.value, C.fitByFile[f], f);
});

test('refusals: echoes, the lock, non-finite numbers, the future, a missing manifest entry; every refusal keeps its reason', () => {
  const res = run();
  const why = id => (res.refused.find(r => r.id === id) || {}).reason;
  assert.equal(why('r3-visible-echo'), 'echo', "IsVisible's 'visible true' is the frame's own report");
  // the lock: v1.8.7 draws trees in 1.5-wide frames, so the narrow-frame tree readings do not count
  for (const id of ['r7-122455-tree-1', 'r7-122455-tree-2', 'r8-124636-tree-1', 'r8-124636-tree-2', 'r6-120001-tree-2']) assert.equal(why(id), 'key', id);
  const base = ledger.rows.find(r => r.id === 'r8-124647-barrel-2');
  const synth = [
    { ...base, id: 'nan', observed: { top: NaN, bottom: 0.1 } },
    { ...base, id: 'inf', value: Infinity },
    { ...base, id: 'future', at: '2026-11-05 09:00:00' },
    { ...base, id: 'stub', witness: 'headless' },
    { ...base, id: 'typed', witness: 'typed-constant' },
    { ...base, id: 'hostfit', witness: 'host' },
    { ...base, id: 'symbolic', kind: 'symbolic' },
    { ...base, id: 'badsha', artifact: { ...base.artifact, sha256: '0'.repeat(64) } },
    { ...base, id: 'nosha', artifact: { report: base.artifact.report, file: base.artifact.file } },
    { ...base, id: 'norung', rung: 'fit:nothing-here' },
    { ...base, id: 'badtime', at: 'yesterday' },
  ];
  const r2 = run(rungsFor(), [...ledger.rows, ...synth]);
  const w2 = id => (r2.refused.find(r => r.id === id) || {}).reason;
  assert.equal(w2('nan'), 'non-finite'); assert.equal(w2('inf'), 'non-finite'); assert.equal(w2('badtime'), 'non-finite');
  assert.equal(w2('future'), 'future');
  assert.equal(w2('stub'), 'echo'); assert.equal(w2('typed'), 'echo');
  assert.equal(w2('hostfit'), 'witness', 'no host API reads a fill');
  assert.equal(w2('symbolic'), 'kind');
  assert.equal(w2('badsha'), 'manifest'); assert.equal(w2('nosha'), 'manifest');
  assert.equal(w2('norung'), 'rung');
  for (const r of r2.refused) assert.ok(typeof r.reason === 'string' && r.reason.length, 'every refusal names its reason');
  // nothing refused changed a verdict
  for (const [id, d] of res.verdicts) assert.equal(r2.verdicts.get(id).verdict, d.verdict, id);
});

test('the lock: a reading counts only in the context it was taken in; a version bump alone unlocks nothing', () => {
  // in v1.8.6's context (tree frames 0.8 wide) the narrow readings count, and the tree at x2.8 fails: the grid
  // reading of 124636 shows the canopy cut at the frame top, superseding the first reading of the same shot
  const narrow = { ...C, aspectRules: [] };
  const res = run(rungsFor(narrow));
  const tree = res.verdicts.get('fit:elwynntreemid01');
  assert.equal(tree.verdict, 'fails');
  assert.ok(tree.admitted.includes('r7-122455-tree-2') && !tree.admitted.includes('r9-131714-tree-2'), 'the wide reading does not count in the narrow context');
  // the bush, barrel, jar and crate do not change with the trees' aspect
  const cur = run();
  for (const f of ['elwynnbush09', 'westfallbarrel01', 'jar01', 'westfallcrate']) assert.equal(res.verdicts.get('fit:' + f).verdict, cur.verdicts.get('fit:' + f).verdict, f);
  // keys: a version is no rung's context, so it changes no key; a base's context changes every key above it
  const a = rungsFor(), b = rungsFor().map(r => ({ ...r, version: '1.8.9' }));
  assert.deepEqual([...rungKeys(a)], [...rungKeys(b)]);
  const c = rungsFor().map(r => (r.id === 'frame:PlayerModel' ? { ...r, context: { build: '2.5.6.99999' } } : r));
  const ka = rungKeys(a), kc = rungKeys(c);
  const above = descendants(a, ['frame:PlayerModel']);
  for (const r of a) assert.equal(ka.get(r.id) !== kc.get(r.id), above.has(r.id), r.id + (above.has(r.id) ? ' must' : ' must not') + ' change key');
});

test('precedence: the owner\'s own fit outranks the director\'s reading; disagreeing outside readings are contested', () => {
  const base = ledger.rows.find(r => r.id === 'r8-124647-barrel-2');
  const at051 = { ...base, value: 0.51 };
  const dirFail = { ...at051, id: 'dir-fail', observed: { top: 0.2, bottom: 0.05 } };
  const dirPass = { ...at051, id: 'dir-pass', artifact: { ...base.artifact, file: 'WoWScrnShot_110426_122517.jpg', sha256: ledger.manifests['20261104-1226']['WoWScrnShot_110426_122517.jpg'], report: '20261104-1226' }, observed: { top: 0.03, bottom: 0.02 } };
  const owner = { ...at051, id: 'owner-fit', witness: 'owner', reader: 'the owner pressed /fide terrain test fit 0.51', observed: { fill: 1 }, artifact: { report: '20261104-1321', file: 'FidelityEMatrix.lua', sha256: ledger.manifests['20261104-1321']['FidelityEMatrix.lua'] } };
  const v = rows => run(rungsFor(), [...ledger.rows, ...rows]).verdicts.get('fit:westfallbarrel01').verdict;
  assert.equal(v([dirFail]), 'fails');
  assert.equal(v([dirFail, dirPass]), 'contested');
  assert.equal(v([dirFail, owner]), 'holds', 'the owner\'s saved fit ranks first, as CameraDistanceFor ranks it');
});

test('no rung holds above a base that does not, over random graphs and rows', () => {
  let seed = 12345;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let trial = 0; trial < 200; trial++) {
    const n = 2 + Math.floor(rnd() * 25);
    const rungs = [];
    for (let i = 0; i < n; i++) {
      const restsOn = [];
      for (let j = 0; j < i; j++) if (rnd() < 0.2) restsOn.push('r' + j);
      rungs.push({ id: 'r' + i, kind: 'check', restsOn, context: {} });
    }
    const manifests = { rep: { 'a.jpg': 'AA' } };
    const rows = [];
    for (let i = 0; i < n; i++) {
      const m = Math.floor(rnd() * 3);
      for (let k = 0; k < m; k++) rows.push({ id: `x${i}-${k}`, rung: 'r' + i, kind: 'measured', witness: 'director', at: '2026-11-04 12:00:00', artifact: { report: 'rep', file: 'a.jpg', sha256: 'AA' }, observed: { ok: rnd() < 0.7 }, precision: k });
    }
    const res = evaluate(rungs, rows, { now: NOW, manifests });
    for (const r of rungs) {
      if (res.verdicts.get(r.id).verdict === 'holds') for (const b of r.restsOn) assert.equal(res.verdicts.get(b).verdict, 'holds', `${r.id} holds above ${b}`);
      if (r.restsOn.some(b => res.verdicts.get(b).verdict !== 'holds')) assert.equal(res.verdicts.get(r.id).verdict, 'blocked');
    }
    assert.equal(res.decided, n, 'each rung is decided once');
  }
});

test('polynomial: forty stacked diamonds (2^40 paths) are decided in 121 steps; one new row re-decides 92; a failure blocks only what rests on it', () => {
  const rungs = [{ id: 't0', kind: 'check', restsOn: [], context: {} }];
  for (let d = 1; d <= 40; d++) {
    const top = d === 1 ? 't0' : `b${d - 1}`;
    rungs.push({ id: `l${d}`, kind: 'check', restsOn: [top], context: {} });
    rungs.push({ id: `r${d}`, kind: 'check', restsOn: [top], context: {} });
    rungs.push({ id: `b${d}`, kind: 'check', restsOn: [`l${d}`, `r${d}`], context: {} });
  }
  const edges = rungs.reduce((n, r) => n + r.restsOn.length, 0);
  assert.equal(rungs.length, 121); assert.equal(edges, 160);
  const manifests = { rep: { 'a.jpg': 'AA' } };
  const row = (id, rung, ok, at = '2026-11-04 12:00:00') => ({ id, rung, kind: 'measured', witness: 'host', at, artifact: { report: 'rep', file: 'a.jpg', sha256: 'AA' }, observed: { ok } });
  const rows = rungs.map(r => row('ok-' + r.id, r.id, true));
  const full = evaluate(rungs, rows, { now: NOW, manifests });
  assert.equal(full.decided, 121, 'one decision per rung, never one per path');
  assert.ok([...full.verdicts.values()].every(v => v.verdict === 'holds'));
  // a new passing row on the middle rung l10: l10, b10 and the thirty diamonds above it are re-decided
  const more = [...rows, row('new-l10', 'l10', true, '2026-11-04 12:00:01')];
  const again = recheck(rungs, more, full, ['l10'], { now: NOW, manifests });
  assert.equal(again.decided, 92, '2 + 3 x 30');
  assert.ok([...again.verdicts.values()].every(v => v.verdict === 'holds'));
  // the same rung failing (a later, more precise reading of its own artifact) blocks everything above it, nothing below
  const failing = [...rows.filter(r => r.rung !== 'l10'), { ...row('fail-l10', 'l10', false, '2026-11-04 12:00:02'), precision: 0.01 }];
  const broken = recheck(rungs, failing, full, ['l10'], { now: NOW, manifests });
  assert.equal(broken.decided, 92);
  assert.equal(broken.verdicts.get('l10').verdict, 'fails');
  const above = descendants(rungs, ['l10']);
  for (const r of rungs) {
    const want = r.id === 'l10' ? 'fails' : above.has(r.id) ? 'blocked' : 'holds';
    assert.equal(broken.verdicts.get(r.id).verdict, want, r.id);
  }
  assert.equal([...broken.verdicts.values()].filter(v => v.verdict === 'blocked').length, 91);
  assert.deepEqual(broken.frontier, ['l10'], 'the frontier is the failing rung, not what it blocks');
  // a cycle is refused, with its rungs named
  const cyc = [{ id: 'a', kind: 'check', restsOn: ['c'] }, { id: 'b', kind: 'check', restsOn: ['a'] }, { id: 'c', kind: 'check', restsOn: ['b'] }, { id: 'd', kind: 'check', restsOn: [] }];
  assert.throws(() => evaluate(cyc, [], {}), /cycle among rungs: a, b, c/);
  assert.throws(() => order([{ id: 'a', restsOn: ['zz'] }]), /unknown rung zz/);
});

test('the estimate only proposes: reaches, doubling inside the clamp, nothing without both edges', () => {
  const rung = { context: { aspect: 0.8 } };
  const r = (value, observed) => ({ value, observed });
  const both = estimateFit([r(0.6, { top: 0.105, bottom: 0.065, width: 0.93 }), r(1.49, { top: 0.345, bottom: 0.335 })], rung, 0.1);
  assert.ok(both.value > 0.5 && both.value < 0.53 && both.canPass, JSON.stringify(both));
  const over = estimateFit([r(2.8, { top: 'clipped', bottom: 'hidden' })], rung, 0.1);
  assert.equal(over.value, 5.6);
  assert.equal(estimateFit([r(12, { top: 'clipped', bottom: 'clipped' })], rung, 0.1).value, K_MAX, 'doubling stops at the clamp');
  assert.equal(estimateFit([r(2, { top: 0.27, bottom: 'hidden' }), r(1, { top: 'clipped', bottom: 'clipped' })], rung, 0.1), null);
  // a model far off its frame's centre cannot pass at any k: the estimate says so
  const off = estimateFit([r(1, { top: 0.4, bottom: 0.0 })], rung, 0.1);
  assert.equal(off.canPass, false);
  // one reading's test
  assert.equal(fitTest(r(1, { top: 0.04, bottom: 0.03 }), 0.1).result, 'pass');
  assert.equal(fitTest(r(1, { top: 0.27, bottom: 'hidden' }), 0.1).result, 'fail', 'a top gap beyond tau fails whatever the hidden base');
  assert.equal(fitTest(r(1, { top: 0.02, bottom: 'hidden' }), 0.1).result, 'untestable');
  assert.equal(fitTest(r(1, { top: 'clipped', bottom: 0.0 }), 0.1).result, 'fail');
});

test('the output is a verdict list: no awareness, level, density or count; the inputs are left as they were', () => {
  const rungs = rungsFor();
  const rows = structuredClone(ledger.rows);
  const before = structuredClone({ rungs, rows });
  const res = run(rungs, rows);
  assert.deepEqual({ rungs, rows }, before, 'evaluate must not change its inputs');
  const keys = new Set();
  const walk = v => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { keys.add(k.toLowerCase()); walk(x); } };
  walk({ verdicts: [...res.verdicts.values()], frontier: res.frontier, refused: res.refused });
  for (const k of keys) assert.ok(!/aware|level|density|percent|coherence|score/.test(k), `the output carries "${k}"`);
});

test('the rows\' hashes are the reports\' own: each cited file is in its MANIFEST on origin/owner/reports (skipped without that ref)', t => {
  let ok = true;
  try { execFileSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', 'origin/owner/reports'], { stdio: 'ignore' }); } catch { ok = false; }
  if (!ok) { t.skip('origin/owner/reports is not fetched here'); return; }
  for (const [stamp, files] of Object.entries(ledger.manifests)) {
    const text = execFileSync('git', ['-C', root, 'show', `origin/owner/reports:reports/${stamp}/MANIFEST.txt`], { encoding: 'utf8' });
    for (const [file, sha] of Object.entries(files)) {
      const line = text.split(/\r?\n/).find(l => l.startsWith(file + ' |'));
      assert.ok(line && line.includes('SHA256: ' + sha), `${stamp}/${file}: ${sha} is not in that report's MANIFEST`);
    }
  }
  for (const row of ledger.rows) {
    const a = row.artifact;
    assert.equal(ledger.manifests[a.report][a.file], a.sha256, `${row.id} cites a hash the manifests block does not hold`);
  }
});

test('admit refuses before it counts: the refusal order is fixed and a refused row changes no bucket', () => {
  const rungs = rungsFor();
  const { byRung, refused } = admit(ledger.rows, rungs, { now: NOW, manifests: ledger.manifests });
  const counted = [...byRung.values()].reduce((n, rs) => n + rs.length, 0);
  assert.equal(counted + refused.length, ledger.rows.length, 'every row is either counted or refused, once');
  assert.ok(byRung.get('fit:elwynntreemid01').every(r => r.context.aspect === 1.5));
});
