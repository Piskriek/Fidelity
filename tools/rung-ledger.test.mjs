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
  VERDICTS, REFUSALS, VALUE_EPS, K_MAX, MARGIN,
} from '../packages/triad-369/src/rung_ledger.mjs';
import { buildSnapshot, serialize, RUNGS_FILE } from './rungs-sync.mjs';
const round2 = v => Math.round(v * 100) / 100;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const terrainSrc = fs.readFileSync(path.join(root, 'FidelityEMatrix', 'EMatrix_Terrain.lua'), 'utf8');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'rungs', 'ledger.json'), 'utf8'));
const BUILD = '2.5.6.70577';
const NOW = '2026-11-05 06:00:00'; // after the tenth report (20261105-0530): the state v1.8.9 prints
const NOW9 = '2026-11-04 17:00:00'; // after the ninth report: the tenth report's rows are still in the future
const C = readTerrainConstants(terrainSrc);
// the constants v1.8.8 shipped, for the tests that pin the state through the ninth report
const C188 = {
  ...C,
  fitByFile: { elwynnbush09: 2.44, elwynntreemid01: 5.6, westfallbarrel01: 0.53, jar01: 0.37, westfallcrate: 0.38, elwynntreecanopy04: 5.6 },
  fitKnots: [[0.7, 0.37], [1.0, 0.38], [1.2, 0.53], [2.5, 2.44], [14, 5.6]],
};
const filesWithRows = [...new Set(ledger.rows.filter(r => r.rung.startsWith('fit:')).map(r => r.rung.slice(4)))];
const rungsFor = (c = C, opts = {}) => terrainRungs(c, { build: BUILD, files: filesWithRows, tolerance: ledger.tolerance, ...opts });
const run = (rungs = rungsFor(), rows = ledger.rows, now = NOW) => evaluate(rungs, rows, { now, manifests: ledger.manifests });
const run9 = (rungs = rungsFor(C188), rows = ledger.rows) => run(rungs, rows, NOW9);
const CAM = { pitch: C.camera.pitch, fovY: C.camera.fovY }; // the camera in use is the projection's context
const rowById = new Map(ledger.rows.map(r => [r.id, r]));

test('traceability: every fit in FIT_BY_FILE is a value a ledger row was read at, or the evaluator\'s proposal from the rows', () => {
  const res = run();
  for (const [file, k] of Object.entries(C.fitByFile)) {
    const rows = ledger.rows.filter(r => r.rung === 'fit:' + file);
    assert.ok(rows.length > 0, `${file}: a fit with no reading behind it`);
    const v = res.verdicts.get('fit:' + file);
    const readAt = v.admitted.some(id => Math.abs(rowById.get(id).value - k) <= VALUE_EPS);
    const proposed = v.estimate && Math.abs(v.estimate.value - k) <= 0.02;
    assert.ok(readAt || proposed, `${file}: x${k} is neither a value read in the ledger (in the context now in use) nor its proposal (${JSON.stringify(v.estimate)})`);
  }
});

test('the fit status the addon prints is the ledger\'s verdict, from the same report, and says where the value came from', () => {
  const res = run();
  for (const file of Object.keys(C.fitByFile)) {
    const st = C.fitStatus[file];
    const v = res.verdicts.get('fit:' + file);
    const k = C.fitByFile[file];
    assert.ok(st, `${file} has a fit but no FIT_STATUS`);
    assert.equal(st.verdict, v.verdict, `${file}: the addon prints ${st.verdict}, the ledger says ${v.verdict}`);
    assert.equal(st.report, v.report, `${file}: the addon cites ${st.report}, the ledger ${v.report}`);
    if (st.verdict === 'fails' && st.how === 'nok') assert.ok(v.estimate && v.estimate.canPass === false, `${file}: 'nok' says no k alone can pass; the estimate must agree (${JSON.stringify(v.estimate)})`);
    if (st.verdict === 'fitted') {
      assert.ok(['estimated', 'read', 'trial'].includes(st.how), `${file}: a fitted value must say where it came from, got ${st.how}`);
      if (st.how === 'estimated') {
        assert.ok(v.estimate && v.estimate.rule === 'the larger reach, a margin inside the frame' && Math.abs(v.estimate.value - k) <= 0.02, `${file}: 'estimated' needs the evaluator's estimate at that value`);
        assert.ok(!v.readAtValue, `${file}: an estimated value has no reading at it yet`);
      }
      if (st.how === 'trial') assert.ok(v.estimate && /^(doubled|a bound)/.test(v.estimate.rule) && Math.abs(v.estimate.value - k) <= 0.02, `${file}: 'trial' needs a doubling step or a step to a bound`);
      if (st.how === 'read') assert.ok(v.readAtValue && v.untestable.length > 0, `${file}: 'read' needs a reading at this value that could not decide`);
    }
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

test('the ledger reads every camera-distance fit shot once per reader, and every row cites its report', () => {
  const second = ledger.rows.filter(r => r.rung.startsWith('fit:') && /second reading/.test(r.reader));
  assert.equal(new Set(second.map(r => r.artifact.file)).size, 35, 'all 35 camera-distance fit shots have a second reading');
  assert.equal(second.length, 35, 'one second reading per shot');
  const ids = ledger.rows.map(r => r.id);
  assert.equal(new Set(ids).size, ids.length, 'row ids are unique');
});

test('verdicts from the rows through the ninth report, at the values v1.8.8 uses', () => {
  const res = run9();
  const v = id => res.verdicts.get(id).verdict;
  for (const id of ['map', 'axis', 'load', 'frame:PlayerModel', 'frame:DressUpModel']) assert.equal(v(id), 'holds', id);
  assert.equal(v('frame:Model'), 'fails', 'a plain Model frame drew nothing in five variants');
  for (const f of ['elwynnbush09', 'westfallbarrel01', 'westfallcrate', 'jar01', 'elwynntreemid01', 'elwynntreecanopy04']) assert.equal(v('fit:' + f), 'fitted', f);
  assert.equal(v('projection:abbey-door'), 'unmeasured');
  for (const f of Object.keys(C188.fitByFile)) assert.equal(v('height:' + f), 'blocked', 'a height rests on the projection and the fit');
  assert.ok(![...res.verdicts.keys()].some(id => /relative|position/.test(id)), 'relative position is not a rung');
  assert.ok(res.frontier.includes('projection:abbey-door'));
  for (const f of Object.keys(C188.fitByFile)) assert.ok(res.frontier.includes('fit:' + f), f + ' is on the frontier');
  assert.ok(!res.frontier.includes('frame:Model'), 'a frame kind not in use is not asked for');
  for (const d of res.verdicts.values()) assert.ok(VERDICTS.includes(d.verdict));
  // the bush moved to its trial: no reading at x2.44 yet
  assert.equal(res.verdicts.get('fit:elwynnbush09').readAtValue, false);
  // the estimates the write-back took
  const est = f => res.verdicts.get('fit:' + f).estimate;
  assert.equal(est('westfallbarrel01').value, 0.53);
  assert.equal(est('westfallbarrel01').canPass, true);
  assert.equal(est('westfallcrate').value, 0.38);
  assert.equal(est('westfallcrate').canPass, false, 'the crate\'s reaches differ too much to pass in any 0.8-wide frame');
  assert.ok(est('westfallcrate').aspectNeeded > 1.7, 'the crate needs a frame about 1.8 as wide as tall');
  assert.equal(est('elwynntreecanopy04').value, 5.6);
  assert.equal(est('elwynntreemid01').value, 5.6, 'the tree ran past the top of its wide frame at x2.8: a doubled trial');
  assert.deepEqual(est('elwynnbush09').reaches, { up: 0.78, downAtLeast: 1.17 }, 'the bush\'s base is only bounded: hidden at x3, touching at x2');
  assert.equal(est('elwynnbush09').value, 2.44, 'its trial puts the bound a margin inside the frame');
  assert.equal(est('elwynnbush09').canPass, false, 'even at its bound no k alone fills its frame (at most 0.83)');
  assert.equal(est('jar01'), null, 'the jar\'s base was hidden: nothing is proposed');
});

test('at the values v1.8.7 used, the barrel, the crate and canopy04 fail and their proposals are the v1.8.8 values', () => {
  const old = { ...C, fitByFile: { elwynnbush09: 2.0, elwynntreemid01: 2.8, westfallbarrel01: 0.6, jar01: 0.37, westfallcrate: 0.42, elwynntreecanopy04: 2.8 } };
  const res = run9(rungsFor(old));
  for (const f of ['westfallbarrel01', 'westfallcrate', 'elwynntreecanopy04', 'elwynntreemid01']) assert.equal(res.verdicts.get('fit:' + f).verdict, 'fails', f);
  const bush = res.verdicts.get('fit:elwynnbush09');
  assert.equal(bush.verdict, 'fitted', 'the bush at x2 is undecided, not failed');
  assert.ok(bush.untestable.length >= 7 && bush.untestable.every(u => /touches/.test(u.reason)), 'its stems touch the frame\'s bottom in every x2 reading, so none can decide: ' + JSON.stringify(bush.untestable));
  const barrel = res.verdicts.get('fit:westfallbarrel01');
  assert.ok(barrel.superseded.some(s => s.id === 'r8-124647-barrel-1' && s.by === 'r8-124647-barrel-2'), 'the grid reading of 124647 supersedes the first reading of the same shot');
  for (const f of ['westfallbarrel01', 'westfallcrate', 'elwynntreecanopy04', 'elwynntreemid01', 'elwynnbush09']) assert.equal(res.verdicts.get('fit:' + f).estimate.value, C188.fitByFile[f], f);
});

test('the tenth report: the barrel holds, the bush and the crate fail where no k passes, the tree doubles, the projection fails at the camera in use', () => {
  const res = run();
  const v = id => res.verdicts.get(id);
  // the twins (round 7): every row of the tenth report is admitted but the wide-frame crate, which counts only at 1.85
  const r10 = ledger.rows.filter(r => r.id.startsWith('r10-'));
  assert.equal(r10.filter(r => r.rung.startsWith('fit:')).length, 6, 'six fit pairs held a model: the jar\'s first shot was overwritten and canopy04 was never drawn');
  assert.equal(r10.filter(r => r.rung === 'projection:abbey-door').length, 5, 'five blind feet matched to placements');
  assert.deepEqual(res.refused.filter(r => r.id.startsWith('r10-')), [{ id: 'r10-052921-crate-twin', rung: 'fit:westfallcrate', reason: 'key' }], 'only the wide crate is refused, by the lock');
  for (const r of r10) {
    assert.equal(r.artifact.report, '20261105-0530');
    assert.equal(ledger.manifests['20261105-0530'][r.artifact.file], r.artifact.sha256, r.id + ': its shot is in the MANIFEST');
    if (r.artifact.twin) assert.equal(ledger.manifests['20261105-0530'][r.artifact.twin.file], r.artifact.twin.sha256, r.id + ': its twin is in the MANIFEST');
  }
  // the barrel at x0.53: the first fit confirmed, by two readings (the canopy04 step drew the barrel)
  assert.equal(v('fit:westfallbarrel01').verdict, 'holds');
  assert.deepEqual(v('fit:westfallbarrel01').deciding.map(d => d.result), ['pass', 'pass']);
  assert.ok(Math.abs(v('fit:westfallbarrel01').residual - 0.069) < 1e-9, 'gaps 0.055 and 0.014');
  // the bush and the crate fail, and the estimate says no camera distance alone can pass either
  for (const f of ['elwynnbush09', 'westfallcrate']) {
    assert.equal(v('fit:' + f).verdict, 'fails', f);
    assert.equal(v('fit:' + f).estimate.canPass, false, f + ': its reaches differ too much');
    assert.ok(v('fit:' + f).estimate.reaches.down > v('fit:' + f).estimate.reaches.up, f + ' reaches further below its middle than above');
  }
  assert.ok(Math.abs(v('fit:elwynnbush09').estimate.fillAt - 0.796) < 0.01, 'the bush fills at most about 0.8 at its best k: ' + JSON.stringify(v('fit:elwynnbush09').estimate));
  // the tree in its 1.5-wide frame reached the top and ran past the bottom at x5.6 and x2.8: v1.8.9 doubles it
  const tree = run(rungsFor(C188)).verdicts.get('fit:elwynntreemid01');
  assert.equal(tree.verdict, 'fails', 'at v1.8.8\'s x5.6 the tree runs past its frame');
  assert.equal(tree.estimate.value, 11.2);
  assert.equal(v('fit:elwynntreemid01').verdict, 'fitted', 'at v1.8.9\'s x11.2 nothing is read yet');
  assert.equal(C.fitByFile.elwynntreemid01, 11.2);
  // the wide crate counts only in a 1.85-wide frame, where it runs past every edge (the wide frame magnifies it)
  const wideCrate = run(rungsFor({ ...C, aspectRules: [...C.aspectRules, ['crate', 1.85]] })).verdicts.get('fit:westfallcrate');
  assert.ok(wideCrate.admitted.includes('r10-052921-crate-twin') && wideCrate.verdict === 'fails', 'in its own aspect the wide crate fails: ' + wideCrate.verdict);
  // the projection at the camera in use fails: every placement stood about 100 px below its prediction
  const proj = v('projection:abbey-door');
  assert.equal(proj.verdict, 'fails');
  assert.equal(proj.deciding.length, 5);
  assert.ok(proj.deciding.every(d => d.result === 'fail'), 'all five feet miss by more than the tolerance plus their precision');
  for (const f of Object.keys(C.fitByFile)) assert.equal(v('height:' + f).verdict, 'blocked', f);
  // the lock on the camera: at the proposed pitch and fovY, readings at the default count for nothing
  const atProposal = run(rungsFor(C, { camera: { pitch: C.cameraProposal.pitch, fovY: C.cameraProposal.fovY } })).verdicts.get('projection:abbey-door');
  assert.equal(atProposal.verdict, 'unmeasured', 'a confirmed new camera starts unmeasured: the next twins test it');
  // the proposal the addon prints is the ledger's, and says it is not confirmed
  const prop = ledger.proposals['projection:abbey-door'];
  assert.deepEqual({ pitch: prop.pitch, fovY: prop.fovY, report: prop.report, heldOut: prop.heldOut.residual }, C.cameraProposal);
  assert.equal(prop.heldOut.result, 'fail');
  assert.ok(prop.heldOut.residual - prop.heldOut.precision > ledger.tolerance, 'the held-out sapling fails by the decisive rule');
  assert.match(terrainSrc, /NOT confirmed/);
  // the frontier: everything but the barrel's fit and the frames already held
  assert.deepEqual([...res.frontier].sort(), ['fit:elwynnbush09', 'fit:elwynntreecanopy04', 'fit:elwynntreemid01', 'fit:jar01', 'fit:westfallcrate', 'projection:abbey-door']);
});

test('the lock: a reading counts only in the context it was taken in; a version bump re-keys nothing; a base change re-keys exactly what rests on it', () => {
  const wide = run();
  const narrow = run(rungsFor({ ...C, aspectRules: [] }));
  const tree = id => narrow.verdicts.get('fit:elwynntreemid01').admitted.includes(id);
  assert.ok(tree('r7-122455-tree-2') && tree('r8-124636-tree-2') && !tree('r9-131714-tree-2'), 'in 0.8-wide frames the narrow readings count and the wide one does not');
  assert.ok(wide.refused.some(r => r.id === 'r7-122455-tree-2' && r.reason === 'key') && !wide.refused.some(r => r.id === 'r9-131714-tree-2'), 'in 1.5-wide frames it is the other way round');
  for (const f of ['elwynnbush09', 'westfallbarrel01', 'jar01', 'westfallcrate']) assert.equal(narrow.verdicts.get('fit:' + f).verdict, wide.verdicts.get('fit:' + f).verdict, f + ' does not change with the trees\' aspect');
  const a = rungsFor(), b = rungsFor().map(r => ({ ...r, version: '1.8.9' }));
  assert.deepEqual([...rungKeys(a)], [...rungKeys(b)], 'a version is no rung\'s context: it changes no key');
  const c = rungsFor().map(r => (r.id === 'frame:PlayerModel' ? { ...r, context: { build: '2.5.6.99999' } } : r));
  const ka = rungKeys(a), kc = rungKeys(c);
  const above = descendants(a, ['frame:PlayerModel']);
  for (const r of a) assert.equal(ka.get(r.id) !== kc.get(r.id), above.has(r.id), r.id + (above.has(r.id) ? ' must' : ' must not') + ' change key');
});

test('precedence: the owner\'s own fit outranks the director\'s reading; disagreeing outside readings are contested', () => {
  const base = rowById.get('r7-122517-barrel-2');
  const at = { ...base, value: 0.53 };
  const shot = (report, file) => ({ report, file, sha256: ledger.manifests[report][file] });
  const dirFail = { ...at, id: 'dir-fail', artifact: shot('20261104-1247', 'WoWScrnShot_110426_124647.jpg'), observed: { top: 0.2, bottom: 0.05 } };
  const dirPass = { ...at, id: 'dir-pass', artifact: shot('20261104-1226', 'WoWScrnShot_110426_122603.jpg'), observed: { top: 0.03, bottom: 0.02 } };
  const owner = { ...at, id: 'owner-fit', witness: 'owner', reader: 'the owner pressed /fide terrain test fit 0.53', observed: { fill: 1 }, precision: 0.1, artifact: { ...shot('20261104-1321', 'FidelityEMatrix.lua'), line: 1 } };
  const v = rows => run9(rungsFor(C188), [...ledger.rows, ...rows]).verdicts.get('fit:westfallbarrel01').verdict;
  assert.equal(v([dirFail]), 'fails');
  assert.equal(v([dirPass]), 'holds');
  assert.equal(v([dirFail, dirPass]), 'contested');
  assert.equal(v([dirFail, owner]), 'holds', 'the owner\'s saved fit ranks first, as CameraDistanceFor ranks it');
});

test('refusals: every reason fires for its defect and keeps its reason; nothing refused changes a verdict', () => {
  const res = run();
  const why = id => (res.refused.find(r => r.id === id) || {}).reason;
  assert.equal(why('r3-visible-echo'), 'echo', "IsVisible's 'visible true' is the frame's own report");
  // the lock: v1.8.7 draws trees in 1.5-wide frames, so the narrow-frame tree readings do not count
  for (const id of ['r7-122455-tree-1', 'r7-122455-tree-2', 'r8-124636-tree-1', 'r8-124636-tree-2', 'r6-120001-tree-2']) assert.equal(why(id), 'key', id);
  const base = rowById.get('r8-124647-barrel-2');
  const synth = [
    { ...base, id: 'nan', observed: { top: NaN, bottom: 0.1 } },
    { ...base, id: 'inf', value: Infinity },
    { ...base, id: 'nullvalue', value: null },
    { ...base, id: 'novalue', value: undefined },
    { ...base, id: 'quoted', value: '0.51' },
    { ...base, id: 'noobs', observed: undefined },
    { ...base, id: 'future', at: '2026-11-05 09:00:00' },
    { ...base, id: 'stub', witness: 'headless' },
    { ...base, id: 'typed', witness: 'typed-constant' },
    { ...base, id: 'hostfit', witness: 'host' },
    { ...base, id: 'symbolic', kind: 'symbolic' },
    { ...base, id: 'badsha', artifact: { ...base.artifact, sha256: '0'.repeat(64) } },
    { ...base, id: 'nosha', artifact: { report: base.artifact.report, file: base.artifact.file } },
    { ...base, id: 'norung', rung: 'fit:nothing-here' },
    { ...base, id: 'badtime', at: 'yesterday' },
    { ...base, id: 'r8-124647-barrel-2' }, // a second row with an id already taken
    { ...rowById.get('20261104-1321-map'), id: 'mapnoobs', observed: null },
    { ...rowById.get('20261104-1321-load'), id: 'loadquoted', observed: { loaded: '45', failed: 0 } },
    { ...rowById.get('20261104-1321-load'), id: 'failquoted', observed: { loaded: 45, failed: '0' } },
    { ...rowById.get('r3-102342-frame'), id: 'drawnword', observed: { drawn: 'yes' } },
    { ...base, id: 'topword', observed: { top: '0.1', bottom: 0.1 } },
    { ...base, id: 'widthword', observed: { top: 0.1, bottom: 0.1, width: 'wide' } },
    { ...base, id: 'noprecision', precision: undefined },
    { ...base, id: 'negprecision', precision: -0.5 },
    { ...base, id: 'textprecision', precision: '0.03' },
    { ...base, id: 'negativegap', observed: { top: -0.15, bottom: 0.2 } },
    { ...base, id: 'gapoverone', observed: { top: 0.1, bottom: 1.4 } },
    { ...base, id: 'boundseen', observed: { top: 0.1, bottom: 0.1, bottomBound: 0.05 } },
  ];
  const r2 = run(rungsFor(), [...ledger.rows, ...synth]);
  const w2 = id => (r2.refused.find(r => r.id === id) || {}).reason;
  for (const id of ['nan', 'inf', 'nullvalue', 'novalue', 'quoted', 'noobs', 'badtime', 'mapnoobs', 'loadquoted', 'failquoted', 'drawnword', 'topword', 'widthword', 'noprecision', 'negprecision', 'textprecision', 'negativegap', 'gapoverone', 'boundseen']) assert.equal(w2(id), 'non-finite', id);
  assert.equal(w2('future'), 'future');
  assert.equal(w2('stub'), 'echo'); assert.equal(w2('typed'), 'echo');
  assert.equal(w2('hostfit'), 'witness', 'no host API reads a fill');
  assert.equal(w2('symbolic'), 'kind');
  assert.equal(w2('badsha'), 'manifest'); assert.equal(w2('nosha'), 'manifest');
  assert.equal(w2('norung'), 'rung');
  assert.equal(r2.refused.filter(r => r.id === 'r8-124647-barrel-2' && r.reason === 'duplicate').length, 1, 'the second row with a taken id is refused, the first kept');
  // the projection's own gates: a pose at the shutter, and an overlay-on shot is an echo; a window ages a row out
  const proj = { id: 'p1', rung: 'projection:abbey-door', kind: 'measured', witness: 'director', at: '2026-11-04 13:16:58', artifact: base.artifact, context: { pose: 'abbey-door', ...CAM }, value: 0.35, observed: { residual: 0.02 }, precision: 0.01 };
  const projRows = [
    { ...proj, id: 'nopose' },
    { ...proj, id: 'turning', pose: { facingSpread: 0.5 } },
    { ...proj, id: 'overlayon', witness: 'overlay-on', pose: { facingSpread: 0 } },
    { ...proj, id: 'still', pose: { facingSpread: 0 } },
  ];
  const r3 = run9(rungsFor(C188), [...ledger.rows, ...projRows]); // through the ninth report, no projection reading yet
  const w3 = id => (r3.refused.find(r => r.id === id) || {}).reason;
  assert.equal(w3('nopose'), 'shutter'); assert.equal(w3('turning'), 'shutter'); assert.equal(w3('overlayon'), 'echo');
  assert.equal(r3.verdicts.get('projection:abbey-door').verdict, 'holds', 'a still, posed reading within tolerance holds the projection');
  const windowed = rungsFor().map(r => (r.id === 'load' ? { ...r, window: 3600 } : r));
  const r4 = run(windowed);
  assert.ok(r4.refused.filter(r => r.rung === 'load').every(r => r.reason === 'stale') && r4.refused.some(r => r.rung === 'load'), 'a seconds window ages old readings out');
  for (const r of [...r2.refused, ...r3.refused, ...r4.refused]) assert.ok(REFUSALS.includes(r.reason), 'every refusal names a known reason: ' + r.reason);
  const seen = new Set([...r2.refused, ...r3.refused, ...r4.refused, ...res.refused].map(r => r.reason));
  for (const reason of REFUSALS) assert.ok(seen.has(reason), `the reason '${reason}' is exercised`);
  // nothing refused changed a verdict
  for (const [id, d] of res.verdicts) assert.equal(r2.verdicts.get(id).verdict, d.verdict, id);
});

test('the refusal order is fixed: a row with two defects is refused for the earlier one, in REFUSALS order', () => {
  const base = rowById.get('r8-124647-barrel-2');
  const proj = { id: 'p', rung: 'projection:abbey-door', kind: 'measured', witness: 'director', at: '2026-11-04 13:16:58', artifact: base.artifact, context: { pose: 'abbey-door', ...CAM }, value: 0.35, observed: { residual: 0.02 }, precision: 0.01 };
  // every adjacent pair of REFUSALS that one row can carry. Every echo witness is also outside its kind's
  // witness list, so echo and witness always co-occur, and the 'stub' row of the refusals test pins that pair;
  // a row cannot be both in the future and stale.
  const adjacent = [
    { ...base, id: 'rung+duplicate', rung: 'fit:nothing-here' }, // takes base.id below: both defects
    { ...base, id: 'duplicate+non-finite', value: NaN },
    { ...base, id: 'non-finite+kind', id2: 1, value: NaN, kind: 'symbolic' },
    { ...base, id: 'kind+echo', kind: 'symbolic', witness: 'headless' },
    { ...base, id: 'witness+manifest', witness: 'host', artifact: { ...base.artifact, sha256: '3'.repeat(64) } },
    { ...base, id: 'manifest+key', id2: 1, artifact: { ...base.artifact, sha256: '4'.repeat(64) }, context: { ...base.context, aspect: 1.5 } },
    { ...base, id: 'key+future', id2: 1, context: { ...base.context, aspect: 1.5 }, at: '2026-11-06 10:00:00' },
    { ...proj, id: 'stale+shutter' },
  ];
  const rows = [base, ...adjacent.map(r => (r.id === 'duplicate+non-finite' || r.id === 'rung+duplicate' ? { ...r, id: base.id, tag: r.id } : r))];
  const windowed = rungsFor().map(r => (r.id === 'projection:abbey-door' ? { ...r, window: 60 } : r));
  const got = admit(rows, windowed, { now: NOW, manifests: ledger.manifests }).refused;
  const reasonOf = id => (got.find(r => r.id === id) || {}).reason;
  for (const r of adjacent) {
    const [a, b] = r.id.split('+');
    assert.ok(REFUSALS.indexOf(a) + 1 === REFUSALS.indexOf(b), `${r.id} is an adjacent pair of REFUSALS`);
    const id = r.id === 'duplicate+non-finite' || r.id === 'rung+duplicate' ? base.id : r.id;
    const reasons = got.filter(x => x.id === id && x.rung === r.rung).map(x => x.reason);
    assert.ok(reasons.includes(a) && !reasons.includes(b), `${r.id}: refused as ${reasons.join(', ')}, expected ${a}`);
  }
  assert.ok(reasonOf('kind+echo') === 'kind');
  // the rung+duplicate row is refused as 'rung', and its duplicate+non-finite twin as 'duplicate': both carry base.id
  const forBase = got.filter(x => x.id === base.id).map(x => x.reason).sort();
  assert.deepEqual(forBase, ['duplicate', 'rung'], 'the two rows reusing base.id: one on no rung, one a duplicate');
  // a row on no rung does not take its id: a later valid row with that id is still admitted
  const stray = { ...base, id: 'shared', rung: 'fit:nothing-here' }, real = { ...base, id: 'shared' };
  const strayFirst = admit([stray, real], rungsFor(), { now: NOW, manifests: ledger.manifests });
  assert.equal(strayFirst.byRung.get('fit:westfallbarrel01').length, 1, 'the valid row keeps the id the stray named');
  assert.deepEqual(strayFirst.refused.map(x => x.reason), ['rung']);
  const two = [
    { ...base, id: 'echo+key', witness: 'headless', context: { ...base.context, aspect: 1.5 } },
    { ...base, id: 'kind+manifest', kind: 'symbolic', artifact: { ...base.artifact, sha256: '1'.repeat(64) } },
    { ...base, id: 'witness+future', witness: 'host', at: '2026-11-06 10:00:00' },
    { ...base, id: 'manifest+key', artifact: { ...base.artifact, sha256: '2'.repeat(64) }, context: { ...base.context, aspect: 1.5 } },
    { ...base, id: 'key+future', context: { ...base.context, aspect: 1.5 }, at: '2026-11-06 10:00:00' },
    { ...base, id: 'nonfinite+echo', value: NaN, witness: 'headless' },
  ];
  const { refused } = admit(two, rungsFor(), { now: NOW, manifests: ledger.manifests });
  const why = id => refused.find(r => r.id === id).reason;
  assert.equal(why('echo+key'), 'echo');
  assert.equal(why('kind+manifest'), 'kind');
  assert.equal(why('witness+future'), 'witness');
  assert.equal(why('manifest+key'), 'manifest');
  assert.equal(why('key+future'), 'key');
  assert.equal(why('nonfinite+echo'), 'non-finite');
  for (const r of refused) {
    const [a, b] = r.id.split('+').map(x => (x === 'nonfinite' ? 'non-finite' : x));
    assert.ok(REFUSALS.indexOf(a) < REFUSALS.indexOf(b), `${r.id}: REFUSALS lists ${a} before ${b}`);
  }
});

test('a reading decides only when it clears the tolerance by its own precision', () => {
  const r = (observed, precision) => ({ value: 1, observed, precision });
  assert.equal(fitTest(r({ top: 0.04, bottom: 0.03 }, 0.03), 0.1).result, 'pass', '0.07 + 0.03 is within 0.1');
  assert.equal(fitTest(r({ top: 0.06, bottom: 0.03 }, 0.03), 0.1).result, 'untestable', '0.09 is within its precision of 0.1');
  assert.equal(fitTest(r({ top: 0.02, bottom: 'touches' }, 0.03), 0.1).result, 'untestable', 'a touching edge may be cut: one seen gap cannot pass (as a gap of 0 this would pass)');
  assert.equal(fitTest(r({ top: 0.16, bottom: 0.0 }, 0.03), 0.1).result, 'fail', '0.16 - 0.03 is outside 0.1');
  assert.equal(fitTest(r({ fill: 1 }, 0.1), 0.1).result, 'pass', 'a first reading of a full frame passes at its own precision');
  assert.equal(fitTest(r({ fill: 0.9 }, 0.1), 0.1).result, 'untestable');
  assert.equal(fitTest(r({ top: 0.27, bottom: 'hidden' }, 0.03), 0.1).result, 'fail', 'one edge alone can fail a reading');
  assert.equal(fitTest(r({ top: 0.02, bottom: 'hidden' }, 0.03), 0.1).result, 'untestable', 'but never pass it');
  assert.equal(fitTest(r({ top: 'clipped', bottom: 0.0 }, 0.03), 0.1).result, 'fail');
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
      for (let k = 0; k < m; k++) rows.push({ id: `x${i}-${k}`, rung: 'r' + i, kind: 'measured', witness: 'director', at: '2026-11-04 12:00:00', artifact: { report: 'rep', file: 'a.jpg', sha256: 'AA', line: k }, observed: { ok: rnd() < 0.7 }, precision: k });
    }
    const res = evaluate(rungs, rows, { now: NOW, manifests });
    for (const r of rungs) {
      if (res.verdicts.get(r.id).verdict === 'holds') for (const b of r.restsOn) assert.equal(res.verdicts.get(b).verdict, 'holds', `${r.id} holds above ${b}`);
      if (r.restsOn.some(b => res.verdicts.get(b).verdict !== 'holds')) assert.equal(res.verdicts.get(r.id).verdict, 'blocked');
    }
    assert.equal(res.decided, n, 'each rung is decided once');
  }
});

test('the re-check gives the same verdicts, frontier and refusals as a fresh pass, over random graphs, rows, reused ids and context changes', () => {
  let seed = 777;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const manifests = { rep: { 'a.jpg': 'AA' } };
  const multiset = refused => refused.map(x => `${x.id}|${x.rung}|${x.reason}`).sort();
  for (let trial = 0; trial < 300; trial++) {
    const n = 3 + Math.floor(rnd() * 20);
    const rungs = [];
    for (let i = 0; i < n; i++) {
      const restsOn = [];
      for (let j = 0; j < i; j++) if (rnd() < 0.25) restsOn.push('r' + j);
      rungs.push({ id: 'r' + i, kind: 'check', restsOn, context: { c: Math.floor(rnd() * 2) } });
    }
    let line = 0;
    const mk = (id, i, c = rungs[i].context.c) => ({ id, rung: 'r' + i, kind: 'measured', witness: 'director', at: '2026-11-04 12:00:00', artifact: { report: 'rep', file: 'a.jpg', sha256: 'AA', line: line++ }, observed: { ok: rnd() < 0.75 }, context: { c } });
    const rows = [];
    for (let i = 0; i < n; i++) if (rnd() < 0.8) rows.push(mk(`a${i}`, i, rnd() < 0.85 ? undefined : 9));
    rows.push({ ...mk('stray0', 0), rung: 'r-none' });
    if (rows.length > 2 && rnd() < 0.5) rows.push({ ...mk(rows[1].id, Math.floor(rnd() * n)) }); // a reused id already in the first pass
    const prev = evaluate(rungs, rows, { now: NOW, manifests });
    // then: new rows (some inserted ahead of existing ones, some reusing a taken id), a stray, a changed context
    const more = [...rows];
    for (let k = 0; k < 3; k++) {
      const i = Math.floor(rnd() * n);
      const row = mk(`b${trial}-${k}`, i);
      if (rnd() < 0.3 && more.length) row.id = more[Math.floor(rnd() * more.length)].id; // reuse an id
      more.splice(Math.floor(rnd() * (more.length + 1)), 0, row); // anywhere, also ahead of the id's first holder
    }
    more.push({ ...mk('stray1', 0), rung: 'r-none' });
    const flip = Math.floor(rnd() * n);
    const rungs2 = rungs.map((r, i) => (i === flip ? { ...r, context: { c: 1 - r.context.c } } : r));
    const fresh = evaluate(rungs2, more, { now: NOW, manifests });
    const inc = recheck(rungs2, more, prev, [], { now: NOW, manifests }); // no hint: it finds the changed rungs itself
    for (const r of rungs2) assert.deepEqual(inc.verdicts.get(r.id), fresh.verdicts.get(r.id), `trial ${trial}: ${r.id}`);
    assert.deepEqual(inc.frontier, fresh.frontier, `trial ${trial}: the frontier`);
    assert.deepEqual(multiset(inc.refused), multiset(fresh.refused), `trial ${trial}: the refusals, as a multiset`);
    assert.ok(inc.decided <= fresh.decided);
  }
});

test('polynomial: forty stacked diamonds (2^40 paths) take 121 decisions; one new row re-decides 92; a failure blocks only what rests on it', () => {
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
  const row = (id, rung, ok, at = '2026-11-04 12:00:00') => ({ id, rung, kind: 'measured', witness: 'host', at, artifact: { report: 'rep', file: 'a.jpg', sha256: 'AA', line: id }, observed: { ok } });
  const rows = rungs.map(r => row('ok-' + r.id, r.id, true));
  const full = evaluate(rungs, rows, { now: NOW, manifests });
  assert.equal(full.decided, 121, 'decideOne is called once per rung, never once per path');
  assert.ok([...full.verdicts.values()].every(v => v.verdict === 'holds'));
  // a new passing row on the middle rung l10: l10, b10 and the thirty diamonds above it are re-decided
  const more = [...rows, row('new-l10', 'l10', true, '2026-11-04 12:00:01')];
  const again = recheck(rungs, more, full, ['l10'], { now: NOW, manifests });
  assert.equal(again.decided, 92, '2 + 3 x 30');
  assert.ok([...again.verdicts.values()].every(v => v.verdict === 'holds'));
  // the same rung failing blocks everything above it, nothing below
  const failing = [...rows.filter(r => r.rung !== 'l10'), row('fail-l10', 'l10', false, '2026-11-04 12:00:02')];
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
  // a cycle is refused, naming the rungs on it and not the ones that only rest on it
  const cyc = [{ id: 'a', kind: 'check', restsOn: ['c'] }, { id: 'b', kind: 'check', restsOn: ['a'] }, { id: 'c', kind: 'check', restsOn: ['b'] }, { id: 'd', kind: 'check', restsOn: [] }, { id: 'e', kind: 'check', restsOn: ['c'] }];
  assert.throws(() => evaluate(cyc, [], {}), err => err.message === 'cycle among rungs: a, b, c');
  assert.throws(() => order([{ id: 'a', restsOn: ['a'] }]), /cycle among rungs: a$/);
  assert.throws(() => order([{ id: 'a', restsOn: ['zz'] }]), /unknown rung zz/);
});

test('the estimate only proposes: reaches and their bounds, doubling inside the clamp, nothing without both edges', () => {
  const rung = { context: { aspect: 0.8 } };
  const r = (value, observed) => ({ value, observed });
  const both = estimateFit([r(0.6, { top: 0.105, bottom: 0.065, width: 0.93 }), r(1.49, { top: 0.345, bottom: 0.335 })], rung, 0.1);
  assert.ok(both.value > 0.5 && both.value < 0.54 && both.canPass, JSON.stringify(both));
  // the proposal leaves MARGIN at the larger reach: the next twin sees that edge as a gap, not a touch
  assert.ok(Math.abs(both.value - round2(both.reaches.down / (0.5 - MARGIN))) < 1e-9, 'k = max(up, down) / (0.5 - MARGIN)');
  // up larger than down: the top edge sets the proposal
  const upper = estimateFit([r(1, { top: 0.0, bottom: 0.3 })], rung, 0.1);
  assert.equal(upper.value, round2(0.5 / (0.5 - MARGIN))); assert.equal(upper.canPass, false);
  // one reach measured and the other bounded from below, the bound the larger: a trial at the bound, judged by its best fill
  const bounded2 = estimateFit([r(3, { top: 0.24, bottom: 'hidden', bottomBound: 0.11 }), r(2, { top: 0.11, bottom: 'touches' })], rung, 0.1);
  assert.equal(bounded2.rule, 'a bound on the larger reach, a margin inside the frame');
  assert.equal(bounded2.value, round2(1.17 / (0.5 - MARGIN))); assert.equal(bounded2.canPass, false, JSON.stringify(bounded2));
  assert.equal(estimateFit([r(3, { top: 0.24, bottom: 'hidden' })], rung, 0.1), null, 'a hidden edge with no bound proposes nothing');
  // a model that reached both edges at every value read: double (a pair of shots cannot tell a touch from a cut)
  assert.equal(estimateFit([r(2.8, { top: 'touches', bottom: 'touches' })], rung, 0.1).value, 5.6);
  assert.equal(fitTest({ value: 1, observed: { top: 'touches', bottom: 'touches' }, precision: 0.005 }, 0.1).result, 'untestable', 'a model touching both edges may be cut: it cannot pass');
  const over = estimateFit([r(2.8, { top: 'clipped', bottom: 'hidden' })], rung, 0.1);
  assert.equal(over.value, 5.6);
  assert.equal(estimateFit([r(12, { top: 'clipped', bottom: 'clipped' })], rung, 0.1).value, K_MAX, 'doubling stops at the clamp');
  assert.equal(estimateFit([r(2, { top: 0.27, bottom: 'hidden' }), r(1, { top: 'clipped', bottom: 'clipped' })], rung, 0.1), null);
  // a touching edge bounds its reach from below: the proposal never clips the edge it touched
  const bounded = estimateFit([r(3, { top: 0.24, bottom: 0.18 }), r(2, { top: 0.11, bottom: 'touches' })], rung, 0.1);
  assert.ok(bounded.reaches.down >= 1.0 && bounded.value >= 2.0, JSON.stringify(bounded));
  // a model far off its frame's centre cannot pass at any k: the estimate says so
  assert.equal(estimateFit([r(1, { top: 0.4, bottom: 0.0 })], rung, 0.1).canPass, false);
  // reaches under the clamp: canPass is judged at the clamped k
  const tiny = estimateFit([r(0.2, { top: 0.0, bottom: 0.0 })], rung, 0.1);
  assert.equal(tiny.value, 0.25); assert.equal(tiny.canPass, false, 'at the clamp the model fills 0.8 of its frame');
  // one reading's test
  assert.equal(fitTest(r(1, { top: 0.04, bottom: 0.03 }), 0.1).result, 'pass');
  assert.equal(fitTest(r(1, { top: 0.27, bottom: 'hidden' }), 0.1).result, 'fail', 'a top gap beyond tau fails whatever the hidden base');
  assert.equal(fitTest(r(1, { top: 0.02, bottom: 'hidden' }), 0.1).result, 'untestable');
  assert.equal(fitTest(r(1, { top: 'clipped', bottom: 0.0 }), 0.1).result, 'fail');
});

test('the output is a verdict list: no awareness, level, density, count or score; the inputs are left as they were', () => {
  const rungs = rungsFor();
  const rows = structuredClone(ledger.rows);
  const before = structuredClone({ rungs, rows });
  const res = run(rungs, rows);
  assert.deepEqual({ rungs, rows }, before, 'evaluate must not change its inputs');
  const keys = new Set();
  const walk = v => {
    if (v instanceof Map) { for (const [k, x] of v) { keys.add(String(k).toLowerCase()); walk(x); } return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { keys.add(k.toLowerCase()); walk(x); }
  };
  walk(res);
  for (const k of keys) assert.ok(!/aware|level|density|percent|coherence|score|count|held/.test(k), `the output carries "${k}"`);
});

test('bridge/sync/rungs.json is the evaluator\'s snapshot of this ledger and these constants (owner ruling 7: the Triad\'s slots read it)', () => {
  const text = fs.readFileSync(RUNGS_FILE, 'utf8');
  assert.equal(text, serialize(buildSnapshot()), 'run node tools/rungs-sync.mjs after changing the ledger or the addon\'s constants');
  const snap = JSON.parse(text);
  const res = run();
  for (const v of snap.verdicts) assert.equal(v.verdict, res.verdicts.get(v.rung).verdict, v.rung + ': the snapshot\'s verdict is the evaluator\'s');
  assert.deepEqual(snap.awareness, snap.verdicts.filter(v => v.verdict === 'holds').map(v => v.rung), 'awareness is the held set, by name');
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

test('every row is counted or refused, once', () => {
  const rungs = rungsFor();
  const { byRung, refused } = admit(ledger.rows, rungs, { now: NOW, manifests: ledger.manifests });
  const counted = [...byRung.values()].reduce((n, rs) => n + rs.length, 0);
  assert.equal(counted + refused.length, ledger.rows.length);
  assert.ok(byRung.get('fit:elwynntreemid01').every(r => r.context.aspect === 1.5));
});
