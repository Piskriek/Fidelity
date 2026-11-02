// Track C step 2 (PLAN_FRACTAL.md): headroom probes. For each candidate sense, how much does it tell about the world's next
// ANSWER, measured by an add-0.5 count model on unscored worlds. No neural training. This ranks senses by information in the
// world under the nursery's scripted policy; it does NOT predict what a learner will pick up (the nursery's minds left their
// memory headroom unused: trunk answer CE 0.320-0.343 against the memoryless count model's 0.310).
//
// Built on mind/nursery_refs.mjs: the same world (world/valleys.mjs, run/lockstep.mjs, bridge/tokens.mjs), the same scripted
// nursery policy (nursery.mjs's choose, verbatim), the same smoothing (add-0.5 over the 14 ANSWER tokens) and the same log
// base (natural). Nothing existing is edited.
//
// Order of work:
//   1. SANITY (hard stop): rebuild the nursery's own logs (train 20000-20019, held-out 29000-29001) and check that the base
//      model, ANSWER | (OBS, ACTION), gives refs.json's ansMemoryless to the last digit. The trace probes are also compared
//      with refs.json (ansLastOutcome, ansLastOutcomeFeedForward, ansTableOracle); those are reported, and a miss is shown.
//   2. PROBES: train the count tables on world seeds 40000-40015, test on 40016-40019 (unscored; in no pre-registration).
//   node mind/probe_senses.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { makeTokens } from '../bridge/tokens.mjs';
import { EAT, PASS, REST, seasonTable } from '../world/valleys.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const K = makeTokens(P), T = K.T, V = K.V, Eb = P.observation.Ebands, Hb = P.observation.Hbands;
const NV = P.valleys, TICKS = P.lifeTicks;
const NURSERY = { trainSeed0: 20000, trainLives: 20, validSeed0: 29000, validLives: 2, randomShare: 0.5 }; // as nursery.mjs
const PROBE = { trainSeed0: 40000, trainLives: 16, testSeed0: 40016, testLives: 4 }; // unscored seeds, in no pre-registration
const ALPHA = 0.5; // the base's smoothing, used by every probe
// declared before any probe was run: a probe is called sparse if either of these holds
const SPARSE = { unseenRecordShare: 0.005, gapOverBase: 0.005 }; // test records in contexts never seen in training; (test CE - in-sample CE) above the base's by this much (nats)
const OUT = path.join(here, 'runs', 'probes');

const choose = (tok, u) => { // nursery.mjs's behaviour policy, verbatim (as nursery_refs.mjs)
  if (u < NURSERY.randomShare) return Math.floor((u / NURSERY.randomShare) * 3);
  const o = K.decodeObs(tok);
  if (o.down) return PASS;
  if (o.item && Eb[o.eBand][1] <= 10) return EAT;
  if (Hb[o.hBand][1] <= 10) return REST;
  return PASS;
};
const NONE = 3; // "no item" / "no memory yet" / "none seen" in every feature
const FED = T.ANS0 + 8, PLAIN = T.ANS0 + 9, TOXIC = T.ANS0 + 10; // tokens.mjs's ANS order: FED, PLAIN, TOXIC at 8, 9, 10
const nA = T.TICK - T.ANS0; // 14 ANSWER tokens, the declared target set
const BIGAGE = 0x3fffffff;
const dbg = (...a) => console.error(...a);

// ---------------------------------------------------------------------------------------------------------------------
// build: run full lives and keep, per character, one column per feature (life-major then tick: the order nursery_refs uses)
function build(seed0, lives) {
  const N = lives * TICKS;
  const cols = [...Array(NV)].map(() => ({
    n: N, obs: new Int16Array(N), act: new Int16Array(N), ans: new Int16Array(N), life: new Uint8Array(N),
    item: new Uint8Array(N), down: new Uint8Array(N), eff: new Uint8Array(N), mem: new Uint8Array(N), age: new Int32Array(N), phase: new Uint8Array(N),
    sAge: new Int32Array(N), turn: new Uint8Array(N), wit4: new Uint8Array(N), wit16: new Uint8Array(N),
    dn: new Uint8Array(N), wn: new Uint8Array(N), E: new Int8Array(N), H: new Int8Array(N), shared: new Uint8Array(N),
  }));
  const diag = { bandMismatch: 0, collapseOnEat: 0, eatsWithItem: 0, witnessTies: 0 };
  for (let i = 0; i < lives; i++) {
    const seed = seed0 + i, ansTok = [...Array(NV)].map(() => new Int16Array(TICKS)), nAns = new Int32Array(NV);
    const postE = new Int8Array(TICKS * NV), postH = new Int8Array(TICKS * NV);
    const minds = [...Array(NV)].map(() => ({
      choose(c, tok, u) { return choose(tok, u); },
      feel(c, tok) { ansTok[c][nAns[c]++] = tok; },
    }));
    // onTick runs after the step: the post-tick body is the next tick's pre-action body (the season turn and the next items touch neither E nor H)
    const res = runLife(P, { worldSeed: seed, minds, onTick: (t, w) => { for (let c = 0; c < NV; c++) { postE[t * NV + c] = w.E[c]; postH[t * NV + c] = w.H[c]; } } });
    const { seasons, tables } = res.log;
    const sharedBy = seasons.map((_, s) => seasonTable(P, seed, s).shared); // per season, per kind: do all valleys share the effect?
    const memory = [...Array(NV)].map(() => [NONE, NONE, NONE]), memT = [...Array(NV)].map(() => [-1, -1, -1]);
    const lastT = new Int32Array(3 * NV).fill(-1e9), lastC = new Uint8Array(3 * NV); // per (kind, valley): tick and class of its last eat
    let si = 0;
    for (let t = 0; t < TICKS; t++) {
      while (si + 1 < seasons.length && seasons[si + 1] <= t) si++;
      const sAge = t - seasons[si];
      for (let c = 0; c < NV; c++) {
        const L = cols[c], j = i * TICKS + t, obsTok = res.log.obs[t][c], d = K.decodeObs(obsTok);
        const item = d.down ? 0 : d.item, k = item - 1;
        L.obs[j] = obsTok; L.act[j] = K.encodeAction(res.log.acts[t][c]); L.ans[j] = ansTok[c][t]; L.life[j] = i;
        L.item[j] = item; L.down[j] = d.down ? 1 : 0;
        L.eff[j] = item ? tables[si][c][k] : NONE;
        L.mem[j] = item ? memory[c][k] : NONE;
        L.age[j] = item && memT[c][k] >= 0 ? t - memT[c][k] : BIGAGE;
        L.phase[j] = t % 4;
        L.sAge[j] = sAge; L.turn[j] = sAge === 0 && si > 0 ? 1 : 0;
        L.shared[j] = item ? sharedBy[si][k] : 2;
        // the witness: the most recent eat of this kind by any OTHER valley within the last W ticks (strictly earlier ticks), ties to the lowest valley index
        for (const [W, arr] of [[4, L.wit4], [16, L.wit16]]) {
          let bestT = -1e9, cls = NONE;
          if (item) for (let o = 0; o < NV; o++) if (o !== c) { const tt = lastT[k * NV + o]; if (tt >= t - W && tt > bestT) { bestT = tt; cls = lastC[k * NV + o]; } }
          arr[j] = cls;
        }
        // the group field: the other valleys' tokens this tick (down, and any warning from their bands)
        let dn = 0, wn = 0;
        for (let o = 0; o < NV; o++) if (o !== c) {
          const od = K.decodeObs(res.log.obs[t][o]);
          if (od.down) dn++; else { const w = K.warningsOf(od); if (w.HUNGRY || w.STARVING || w.WEAK) wn++; }
        }
        L.dn[j] = dn; L.wn[j] = wn;
        // the exact body before acting (a collapsed body shows only DOWN, so it carries no E and H here)
        const E = t === 0 ? P.body.birthE : postE[(t - 1) * NV + c], H = t === 0 ? P.body.birthH : postH[(t - 1) * NV + c];
        if (d.down) { L.E[j] = -1; L.H[j] = -1; }
        else {
          L.E[j] = E; L.H[j] = H;
          if (K.band(E, Eb) !== d.eBand || K.band(H, Hb) !== d.hBand) diag.bandMismatch++; // the rebuilt body must project to the logged OBS token
        }
      }
      // after every character's features for this tick: apply this tick's eats (a collapse on an eat carries no class, as in nursery_refs)
      for (let c = 0; c < NV; c++) {
        const obsTok = res.log.obs[t][c], d = K.decodeObs(obsTok), item = d.down ? 0 : d.item, ans = ansTok[c][t];
        if (item && res.log.acts[t][c] === EAT) {
          diag.eatsWithItem++;
          if (ans === FED || ans === PLAIN || ans === TOXIC) { memory[c][item - 1] = ans - FED; memT[c][item - 1] = t; lastT[(item - 1) * NV + c] = t; lastC[(item - 1) * NV + c] = ans - FED; }
          else if (ans === T.ANS0 + 12) diag.collapseOnEat++; // COLLAPSE
        }
      }
    }
  }
  cols.diag = diag;
  return cols;
}

// ---------------------------------------------------------------------------------------------------------------------
// an add-alpha count model over keyed contexts and the declared 14 ANSWER targets; full diagnostics when asked
const eatItem = (L, i) => L.act[i] === T.EAT && L.item[i] > 0; // an eat with an item to eat (the only place the three effects can show)
function fit(keyFn, train) {
  const counts = new Map();
  for (const L of train) for (let i = 0; i < L.n; i++) {
    const k = keyFn(L, i); let a = counts.get(k); if (!a) counts.set(k, (a = new Float64Array(nA)));
    a[L.ans[i] - T.ANS0] += 1;
  }
  for (const a of counts.values()) { let s = 0; for (let y = 0; y < nA; y++) s += a[y]; a.tot = s; }
  return counts;
}
const lossOf = (a, y, alpha = ALPHA) => { const tot = a ? a.tot : 0; return -Math.log(((a ? a[y] : 0) + alpha) / (tot + alpha * nA)); };
function ceBase(counts, keyFn, evalCols) { // the headline number only (summed in nursery_refs's order: character, life, tick)
  let ce = 0, n = 0;
  for (const L of evalCols) for (let i = 0; i < L.n; i++) { ce += lossOf(counts.get(keyFn(L, i)), L.ans[i] - T.ANS0); n++; }
  return ce / n;
}
function evaluate(keyFn, train, test, coverFn) {
  const counts = fit(keyFn, train);
  const nTest = test.reduce((s, L) => s + L.n, 0), nTrain = train.reduce((s, L) => s + L.n, 0);
  let sum = 0, unseenRec = 0, unseenLoss = 0, sumEat = 0, sumOther = 0, nEat = 0, covered = 0, thin = 0;
  const SENS = [0.1, 0.01], sens = SENS.map(() => 0); // the same tables scored at a lighter smoothing: a sensitivity, not the headline
  const testCtx = new Set(), unseenCtx = new Set(), unit = new Float64Array(NV * PROBE.testLives); // loss per (life, character) unit
  const life = new Float64Array(PROBE.testLives);
  test.forEach((L, c) => { for (let i = 0; i < L.n; i++) {
    const k = keyFn(L, i), a = counts.get(k), l = lossOf(a, L.ans[i] - T.ANS0);
    sum += l; unit[L.life[i] * NV + c] += l; life[L.life[i]] += l;
    testCtx.add(k); if (!a || a.tot < 30) thin++; SENS.forEach((al, s) => { sens[s] += lossOf(a, L.ans[i] - T.ANS0, al); });
    if (!a) { unseenRec++; unseenLoss += l; unseenCtx.add(k); }
    if (eatItem(L, i)) { sumEat += l; nEat++; if (coverFn && coverFn(L, i)) covered++; } else sumOther += l;
  } });
  let trainSum = 0; for (const L of train) for (let i = 0; i < L.n; i++) trainSum += lossOf(counts.get(keyFn(L, i)), L.ans[i] - T.ANS0);
  const sizes = [...counts.values()].map(a => a.tot).sort((x, y) => x - y);
  return {
    ce: sum / nTest, n: nTest, ceAlpha0p1: sens[0] / nTest, ceAlpha0p01: sens[1] / nTest, thinRecordShare: thin / nTest, trainCE: trainSum / nTrain, gap: sum / nTest - trainSum / nTrain,
    contexts: counts.size, testContexts: testCtx.size, unseenTestContexts: unseenCtx.size,
    unseenRecords: unseenRec, unseenRecordShare: unseenRec / nTest, unseenCEContribution: unseenLoss / nTest,
    medianTrainCount: sizes[sizes.length >> 1], contextsUnder10: sizes.filter(s => s < 10).length,
    ceFromEatsWithItem: sumEat / nTest, ceFromOther: sumOther / nTest, eatsWithItem: nEat, coverageOfEats: coverFn ? covered / nEat : null,
    perLifeCE: [...life].map(x => x / (NV * TICKS)), perUnitCE: [...unit].map(x => x / TICKS),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// the probes: each maps a record to an integer context (the base's (OBS, ACTION) plus the sense; M is the sense's cardinality)
const bk = (L, i) => L.obs[i] * V + L.act[i];
const reach = (L, i) => { const a = L.age[i], o = L.phase[i]; return a === 1 || (a >= o + 1 && a <= o + 4) ? L.mem[i] : NONE; }; // nursery_refs's ansLastOutcomeFeedForward
const ageBin = s => (s < 32 ? 0 : s < 128 ? 1 : 2);
const bodyObs = (L, i) => (L.down[i] ? 0 : 1 + (L.E[i] * 16 + L.H[i]) * 4 + L.item[i]); // exact E and H (0-15 each) in place of the bands; the item as before
const PROBES = [
  { id: 'base', name: 'base: (OBS, ACTION)', key: (L, i) => bk(L, i), cover: null, view: 'none: the token stream as it is' },
  { id: 'trace_unlimited', name: 'kind trace, unlimited', key: (L, i) => bk(L, i) * 4 + L.mem[i], cover: (L, i) => L.mem[i] !== NONE, view: 'no change to the view; needs memory kept beyond the trunk\'s reach (the trace is a function of the being\'s own past tokens)' },
  { id: 'trace_reach', name: 'kind trace within reach', key: (L, i) => bk(L, i) * 4 + reach(L, i), cover: (L, i) => reach(L, i) !== NONE, view: 'no change to the view; the trace is a function of the being\'s own past tokens inside the trunk\'s feed-forward window' },
  { id: 'witness4', name: 'witness, 4 ticks', key: (L, i) => bk(L, i) * 4 + L.wit4[i], cover: (L, i) => L.wit4[i] !== NONE, view: 'changes the view: it shows other valleys (VIEW_KERNEL: "other valleys")' },
  { id: 'witness16', name: 'witness, 16 ticks', key: (L, i) => bk(L, i) * 4 + L.wit16[i], cover: (L, i) => L.wit16[i] !== NONE, view: 'changes the view: it shows other valleys (VIEW_KERNEL: "other valleys")' },
  { id: 'season_turn', name: 'season turn flag', key: (L, i) => bk(L, i) * 2 + L.turn[i], cover: null, view: 'changes the view: it shows the season clock (VIEW_KERNEL: "the season index and clock")' },
  { id: 'season_age', name: 'season age (0-31, 32-127, 128+)', key: (L, i) => bk(L, i) * 3 + ageBin(L.sAge[i]), cover: null, view: 'changes the view: it shows the season clock (VIEW_KERNEL: "the season index and clock")' },
  { id: 'group', name: 'group field (others down, others warned)', key: (L, i) => bk(L, i) * 16 + L.dn[i] * 4 + L.wn[i], cover: null, view: 'changes the view: it shows other valleys (VIEW_KERNEL: "other valleys")' },
  { id: 'finer_body', name: 'finer body (exact E and H)', key: (L, i) => (bodyObs(L, i) * V + L.act[i]), cover: null, view: 'changes the view: it shows exact E and H inside a band (VIEW_KERNEL), and so changes the OBS token itself' },
  { id: 'trace_witness16', name: 'kind trace + witness 16', key: (L, i) => (bk(L, i) * 4 + L.mem[i]) * 4 + L.wit16[i], cover: (L, i) => L.mem[i] !== NONE || L.wit16[i] !== NONE, view: 'changes the view (the witness half): other valleys' },
  { id: 'trace_season_age', name: 'kind trace + season age', key: (L, i) => (bk(L, i) * 4 + L.mem[i]) * 3 + ageBin(L.sAge[i]), cover: (L, i) => L.mem[i] !== NONE, view: 'changes the view (the season-age half): the season clock' },
];
// a reference ceiling, not a sense: the item's true effect this season (nursery_refs's table oracle)
const ORACLE = { id: 'table_oracle', name: 'reference ceiling: true effect of the item this season (not a sense)', key: (L, i) => bk(L, i) * 4 + L.eff[i], cover: null, view: 'not a sense: a ceiling' };
// extra, not in the brief: how far back must the trace reach? the same trace kept only when the last same-kind eat is at most W ticks old (W = 8, 16, 32)
const EXTRA = [8, 16, 32].map(W => ({ id: `trace_within${W}`, name: `kind trace kept up to ${W} ticks old (extra)`, key: (L, i) => bk(L, i) * 4 + (L.age[i] <= W ? L.mem[i] : NONE), cover: (L, i) => L.age[i] <= W && L.mem[i] !== NONE, view: PROBES[1].view }));
// added after the first report (Track C, WORLD_V2_DESIGN.md): the one combination that report listed as not measured, the trace limited to the trunk's reach together with the witness.
// Appended after the existing rows, so rows 1-11, the reference and the three extras keep their labels and their numbers.
const REACH_WITNESS = [[16, 'wit16'], [4, 'wit4']].map(([W, col]) => ({ id: `trace_reach_witness${W}`, name: `kind trace within reach + witness ${W} (extra, added after the report)`, key: (L, i) => (bk(L, i) * 4 + reach(L, i)) * 4 + L[col][i], cover: (L, i) => reach(L, i) !== NONE || L[col][i] !== NONE, view: 'changes the view (the witness half): other valleys; the trace half needs no change to the view' }));
const ALL = [...PROBES, ORACLE, ...EXTRA, ...REACH_WITNESS];

// ---------------------------------------------------------------------------------------------------------------------
const refs = JSON.parse(fs.readFileSync(path.join(here, 'runs', 'nursery', 'refs.json'), 'utf8')).refs;
const t0 = Date.now();
dbg('building the nursery\'s own logs (train 20000-20019, held-out 29000-29001) ...');
const nTrain = build(NURSERY.trainSeed0, NURSERY.trainLives), nValid = build(NURSERY.validSeed0, NURSERY.validLives);
const sanity = { note: 'rebuilt nursery logs; the base must equal refs.json ansMemoryless', checks: {} };
for (const [id, probe, ref] of [['base', PROBES[0], 'ansMemoryless'], ['trace_unlimited', PROBES[1], 'ansLastOutcome'], ['trace_reach', PROBES[2], 'ansLastOutcomeFeedForward'], ['table_oracle', ORACLE, 'ansTableOracle']]) {
  const ce = ceBase(fit(probe.key, nTrain), probe.key, nValid), exp = refs[ref].ce;
  sanity.checks[id] = { ce, refs: ref, expected: exp, difference: ce - exp, identical: ce === exp, within1e9: Math.abs(ce - exp) < 1e-9 };
}
// the 40.5% stat: the share of eats (with an item) whose last same-kind eat is in reach, on the nursery's held-out worlds
{ let eats = 0, inReach = 0, anyTrace = 0; for (const L of nValid) for (let i = 0; i < L.n; i++) if (eatItem(L, i)) { eats++; if (reach(L, i) !== NONE) inReach++; if (L.mem[i] !== NONE) anyTrace++; }
  sanity.eatsWithItem = eats; sanity.shareLastEatInReach = inReach / eats; sanity.shareAnyEarlierEat = anyTrace / eats; }
sanity.bandMismatch = { train: nTrain.diag.bandMismatch, valid: nValid.diag.bandMismatch };
sanity.baseOk = sanity.checks.base.within1e9;
console.log('SANITY', JSON.stringify(sanity, null, 1));
if (!sanity.baseOk) { console.error('STOP: the base model does not reproduce refs.json\'s memoryless value'); process.exit(1); }
dbg(`sanity ok (${((Date.now() - t0) / 1000).toFixed(0)} s); building the probe worlds (train 40000-40015, test 40016-40019) ...`);

// five blocks of four lives (seeds 40000-40019, all unscored). The headline split is the pre-set one: blocks 0-3 (40000-40015) train, block 4 (40016-40019) test.
// The other four rotations are a robustness check on which worlds happened to be held out; they are not a second headline.
const blocks = [0, 1, 2, 3, 4].map(b => build(PROBE.trainSeed0 + PROBE.testLives * b, PROBE.testLives));
for (const bl of blocks) if (bl.diag.bandMismatch) { console.error('STOP: the rebuilt exact body does not project to the logged OBS tokens', bl.diag); process.exit(1); }
const split = f => ({ train: blocks.filter((_, b) => b !== f).flat(), test: blocks[f] });
const HEAD = blocks.length - 1;
const train = split(HEAD).train, test = split(HEAD).test;
const results = [];
for (const p of ALL) { const r = evaluate(p.key, train, test, p.cover); results.push({ id: p.id, name: p.name, view: p.view, ...r }); dbg(p.id, r.ce.toFixed(4), 'ctx', r.contexts, 'unseen', r.unseenTestContexts); }
const base = results[0];
for (const r of results) {
  r.deltaVsBase = r.ce - base.ce;
  r.perLifeDeltaVsBase = r.perLifeCE.map((x, l) => x - base.perLifeCE[l]);
  r.unitsLowerThanBase = r.perUnitCE.filter((x, u) => x < base.perUnitCE[u]).length; // of 16 (life, character) units
  r.deltaVsBaseAlpha0p01 = r.ceAlpha0p01 - base.ceAlpha0p01;
  r.sparse = r.unseenRecordShare > SPARSE.unseenRecordShare || (r.gap - base.gap) > SPARSE.gapOverBase; // the rule declared before any probe was run
  // added after the first run, because the declared rule missed the cost of many thin contexts: the verdict against the base moves by more than 0.005 nats when the smoothing is lightened from add-0.5 to add-0.01
  r.smoothingLimited = Math.abs(r.deltaVsBase - r.deltaVsBaseAlpha0p01) > 0.005;
}
// rotation folds: held-out block f, the other four train; the same probes and smoothing
const folds = [];
for (let f = 0; f < blocks.length; f++) {
  const { train: tr, test: te } = split(f), row = { fold: f, testSeeds: [PROBE.trainSeed0 + PROBE.testLives * f, PROBE.trainSeed0 + PROBE.testLives * f + PROBE.testLives - 1], probes: {} };
  for (const p of ALL) { const counts = fit(p.key, tr); row.probes[p.id] = { ce: ceBase(counts, p.key, te) }; }
  for (const p of ALL) row.probes[p.id].delta = row.probes[p.id].ce - row.probes.base.ce;
  folds.push(row); dbg('fold', f, 'base', row.probes.base.ce.toFixed(4));
}
for (const r of results) { const d = folds.map(fo => fo.probes[r.id].delta); r.foldDeltas = d; r.foldDeltaMean = d.reduce((x, y) => x + y, 0) / d.length; r.foldDeltaMin = Math.min(...d); r.foldDeltaMax = Math.max(...d); r.foldsBelowBase = d.filter(x => x < 0).length; }

// the test worlds' own facts, for the caveats and the witness story
const D = {};
{ // the witness: how often it is available on an eat, and how often its class equals this character's own outcome, split by whether the kind is shared this season
  const stat = { w4: { avail: 0, match: 0 }, w16: { avail: 0, match: 0 } };
  const split = { w16Shared: { avail: 0, match: 0 }, w16NotShared: { avail: 0, match: 0 } };
  let eats = 0, sharedEats = 0;
  for (const L of test) for (let i = 0; i < L.n; i++) if (eatItem(L, i)) {
    eats++; if (L.shared[i] === 1) sharedEats++;
    for (const [key, col] of [['w4', L.wit4], ['w16', L.wit16]]) if (col[i] !== NONE) { stat[key].avail++; if (col[i] === L.eff[i]) stat[key].match++; }
    if (L.wit16[i] !== NONE) { const s = split[L.shared[i] === 1 ? 'w16Shared' : 'w16NotShared']; s.avail++; if (L.wit16[i] === L.eff[i]) s.match++; }
  }
  D.witness = { eatsWithItem: eats, shareOfEatsWhereKindShared: sharedEats / eats, ...stat, ...split };
  // the share of eats with an item that are on a COLLAPSE (not counted in any trace or witness: the answer carries no class)
  D.collapseOnEat = { test: test.diag.collapseOnEat, eatsWithItem: test.diag.eatsWithItem };
  { // how stale is the unlimited trace? its age, and whether the last same-kind eat was in the current season (age <= ticks since the season began)
    const ages = []; let sameSeason = 0;
    for (const L of test) for (let i = 0; i < L.n; i++) if (eatItem(L, i) && L.mem[i] !== NONE) { ages.push(L.age[i]); if (L.age[i] <= L.sAge[i]) sameSeason++; }
    ages.sort((x, y) => x - y);
    D.traceStaleness = { eatsWithTrace: ages.length, sameSeasonShare: sameSeason / ages.length, medianAge: ages[ages.length >> 1], p90Age: ages[Math.floor(ages.length * 0.9)] };
  }
  D.sharedEatShareByBlock = blocks.map(bl => { let e = 0, sh = 0; for (const L of bl) for (let i = 0; i < L.n; i++) if (eatItem(L, i)) { e++; if (L.shared[i] === 1) sh++; } return sh / e; });
  // the season turn flag: how many ticks carry it
  let turns = 0, n = 0; for (const L of test) for (let i = 0; i < L.n; i++) { n++; turns += L.turn[i]; } D.turnFlagShare = turns / n;
  const bins = [0, 0, 0]; for (const L of test) for (let i = 0; i < L.n; i++) bins[ageBin(L.sAge[i])]++; D.seasonAgeBinShare = bins.map(x => x / n);
  const dnH = Array(4).fill(0), wnH = Array(4).fill(0); for (const L of test) for (let i = 0; i < L.n; i++) { dnH[L.dn[i]]++; wnH[L.wn[i]]++; } D.groupDownShare = dnH.map(x => x / n); D.groupWarnedShare = wnH.map(x => x / n);
  // how many ticks in the held-out worlds have an exact (E, H) that its band could not tell apart (distinct exact pairs per band cell)
  const cells = new Map(); for (const L of test) for (let i = 0; i < L.n; i++) if (!L.down[i]) { const k = L.obs[i]; if (!cells.has(k)) cells.set(k, new Set()); cells.get(k).add(L.E[i] * 16 + L.H[i]); }
  D.exactBodyPairsPerObsToken = { tokens: cells.size, meanPairs: [...cells.values()].reduce((s, x) => s + x.size, 0) / cells.size };
  // added after the first report: where does the witness help beside a reach-limited trace? The held-out CE on eats with an item, split by what the trace has to offer on that eat:
  // 'inReach' (the last same-kind eat is inside the trunk's window), 'outOfReach' (an earlier same-kind eat exists but is outside it), 'noTrace' (this life has no earlier eat of the kind).
  const parts = { inReach: (L, i) => reach(L, i) !== NONE, outOfReach: (L, i) => reach(L, i) === NONE && L.mem[i] !== NONE, noTrace: (L, i) => L.mem[i] === NONE };
  const keys = { base: PROBES[0].key, witness16: PROBES[4].key, traceReach: PROBES[2].key, traceReachWitness16: REACH_WITNESS[0].key, traceReachWitness4: REACH_WITNESS[1].key, traceUnlimited: PROBES[1].key };
  const R = {};
  for (const [kn, keyFn] of Object.entries(keys)) {
    const counts = fit(keyFn, train); R[kn] = {};
    for (const [pn, filt] of Object.entries(parts)) { let s = 0, n = 0; for (const L of test) for (let i = 0; i < L.n; i++) if (eatItem(L, i) && filt(L, i)) { s += lossOf(counts.get(keyFn(L, i)), L.ans[i] - T.ANS0); n++; } R[kn][pn] = { ce: s / n, n }; }
  }
  D.witnessBesideReachTrace = { note: 'held-out CE (add-0.5) on eats with an item only, split by what the trace has on that eat; counts fitted on all training records of the probe', byPart: R };
  // added after the first report: the witness where the fruit's effect is shared by all valleys that season (L.shared = 1) and where it is not (0). Held-out CE (add-0.5) on eats with an item only.
  // This is the information gain the witness predictions rest on; the match rates (99.6% and 35.5%) in D.witness say how often the class agrees, not how much the answer's uncertainty falls.
  const S = {};
  for (const [kn, keyFn] of Object.entries({ base: PROBES[0].key, witness16: PROBES[4].key, witness4: PROBES[3].key, traceReach: PROBES[2].key, traceReachWitness16: REACH_WITNESS[0].key })) {
    const counts = fit(keyFn, train); S[kn] = { shared: { s: 0, n: 0 }, notShared: { s: 0, n: 0 } };
    for (const L of test) for (let i = 0; i < L.n; i++) if (eatItem(L, i)) { const p = S[kn][L.shared[i] === 1 ? 'shared' : 'notShared']; p.s += lossOf(counts.get(keyFn(L, i)), L.ans[i] - T.ANS0); p.n++; }
    for (const p of Object.values(S[kn])) { p.ce = p.s / p.n; delete p.s; }
  }
  D.witnessBySharedKind = { note: 'held-out CE (add-0.5) on eats with an item, split by whether the fruit kind\'s effect was shared by all valleys that season', byShare: S };
}

const f = (x, d = 4) => x.toFixed(d);
const sg = x => (x >= 0 ? '+' : '') + f(x);
const lab = (r, i) => (i < PROBES.length ? String(i + 1) : r.id === 'table_oracle' ? 'ref' : 'extra');
const tableMd = ['| # | probe | held-out ANSWER CE | vs base | distinct contexts (train) | distinct test contexts | test contexts unseen | test records in unseen contexts | sparse (declared rule) | smoothing-limited (added after run 1) |', '|---|---|---|---|---|---|---|---|---|---|'];
results.forEach((r, i) => tableMd.push(`| ${lab(r, i)} | ${r.name} | ${f(r.ce)} | ${sg(r.deltaVsBase)} | ${r.contexts} | ${r.testContexts} | ${r.unseenTestContexts} | ${r.unseenRecords} (${f(100 * r.unseenRecordShare, 2)}%) | ${r.sparse ? 'YES' : 'no'} | ${r.smoothingLimited ? 'YES' : 'no'} |`));
const robustMd = ['| # | probe | CE at add-0.5 | CE at add-0.1 | CE at add-0.01 | vs base at add-0.01 | CE from eats with an item | CE from all other ticks | held-out minus in-sample CE | 5-fold mean vs base | 5-fold range | folds below base | test records in contexts with <30 training records |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
results.forEach((r, i) => robustMd.push(`| ${lab(r, i)} | ${r.name} | ${f(r.ce)} | ${f(r.ceAlpha0p1)} | ${f(r.ceAlpha0p01)} | ${sg(r.deltaVsBaseAlpha0p01)} | ${f(r.ceFromEatsWithItem)} | ${f(r.ceFromOther)} | ${f(r.gap)} | ${sg(r.foldDeltaMean)} | ${sg(r.foldDeltaMin)} to ${sg(r.foldDeltaMax)} | ${r.foldsBelowBase} of 5 | ${f(100 * r.thinRecordShare, 2)}% |`));
const out = { meta: { script: 'mind/probe_senses.mjs', alpha: ALPHA, logBase: 'natural', targets: nA, trainSeeds: [PROBE.trainSeed0, PROBE.trainSeed0 + PROBE.trainLives - 1], testSeeds: [PROBE.testSeed0, PROBE.testSeed0 + PROBE.testLives - 1], lifeTicks: TICKS, sparseRule: SPARSE, policy: 'nursery.mjs scripted behaviour policy (50% uniform random action, else scripted)', seconds: (Date.now() - t0) / 1000 }, sanity, results, folds, diagnostics: D, tableMd: tableMd.join('\n'), robustMd: robustMd.join('\n') };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'probes.json'), JSON.stringify(out, null, 1));
console.log(out.tableMd); console.log(out.robustMd);
console.log(JSON.stringify(D, null, 1));
dbg('done in', ((Date.now() - t0) / 1000).toFixed(0), 's; wrote', path.join(OUT, 'probes.json'));
