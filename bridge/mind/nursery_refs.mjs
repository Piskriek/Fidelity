// References for the nursery's held-out readouts (MIND_STEP7.md); they decide nothing. The nursery logs are rebuilt exactly
// as nursery.mjs builds them (checked: the (OBS, ACTION) count model must give nursery.ansCountCE to the last digit), with the
// season tables kept beside the tokens. Each reference is an add-0.5 count model fitted on the training logs, scored on the
// held-out logs:
//   ANSWER | (OBS, ACTION)                       memoryless: what rung 0's own context gives (the nursery's ansCountCE)
//   ANSWER | (OBS, ACTION, last outcome of eating this kind in this life)   a one-fact memory, what a T-like learner keeps
//   ANSWER | (OBS, ACTION, the item's true effect this season)              the table oracle: the most season memory can give
//   OBS    | (ANSWER, TICK)                       memoryless: rung 0's own context at the OBS slot
//   OBS    | (previous OBS, ACTION, ANSWER)       the whole previous tick
//   node mind/nursery_refs.mjs [expectedAnsCountCE]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { makeTokens } from '../bridge/tokens.mjs';
import { EAT, PASS, REST } from '../world/valleys.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const K = makeTokens(P), T = K.T, V = K.V, Eb = P.observation.Ebands, Hb = P.observation.Hbands;
const NURSERY = { trainSeed0: 20000, trainLives: 20, validSeed0: 29000, validLives: 2, randomShare: 0.5 }; // as nursery.mjs
const choose = (tok, u) => { // nursery.mjs's behaviour policy, verbatim
  if (u < NURSERY.randomShare) return Math.floor((u / NURSERY.randomShare) * 3);
  const o = K.decodeObs(tok);
  if (o.down) return PASS;
  if (o.item && Eb[o.eBand][1] <= 10) return EAT;
  if (Hb[o.hBand][1] <= 10) return REST;
  return PASS;
};
const isAnswer = y => y >= T.ANS0 && y < T.TICK;
const NONE = 3; // "no item" / "no memory yet" in the effect and memory features
const FED = T.ANS0 + 8, PLAIN = T.ANS0 + 9, TOXIC = T.ANS0 + 10; // tokens.mjs's ANS order: FED, PLAIN, TOXIC at 8, 9, 10

// per character: the token log and, per tick, the true effect of the item offered and the remembered last outcome
function build(seed0, lives) {
  const logs = [...Array(P.valleys)].map(() => ({ tok: [], eff: [], mem: [], age: [], phase: [] }));
  for (let i = 0; i < lives; i++) {
    const last = [], memory = logs.map(() => [NONE, NONE, NONE]), memT = logs.map(() => [null, null, null]);
    const minds = logs.map(() => ({
      choose(c, tok, u) { const a = choose(tok, u); last[c] = [tok, K.encodeAction(a), a]; return a; },
      feel(c, tok) { logs[c].tok.push(last[c][0], last[c][1], tok, T.TICK); },
    }));
    const res = runLife(P, { worldSeed: seed0 + i, minds, onTick: (t, w) => {
      // after the step: the tick's tokens were pushed in feel; attach the table in force when it acted and the memory before it
    } });
    // the season tables in force at each tick, from the run's own log (as run/baselines.mjs readouts)
    const { seasons, tables } = res.log;
    for (let c = 0; c < P.valleys; c++) {
      const L = logs[c], t0 = L.eff.length;
      let si = 0;
      for (let t = 0; t < res.log.acts.length; t++) {
        while (si + 1 < seasons.length && seasons[si + 1] <= t) si++;
        const obsTok = L.tok[4 * (t0 + t)], d = K.decodeObs(obsTok), ans = L.tok[4 * (t0 + t) + 2];
        const item = d.down ? 0 : d.item;
        L.eff.push(item ? tables[si][c][item - 1] : NONE);
        L.mem.push(item ? memory[c][item - 1] : NONE);
        L.age.push(item && memT[c][item - 1] !== null ? t - memT[c][item - 1] : Infinity); // ticks since that outcome
        L.phase.push(t % 4); // ticks since the last rung-2 refresh (held-out streams start a life at n = 0; lives are 16,384 ticks)
        if (item && res.log.acts[t][c] === EAT && (ans === FED || ans === PLAIN || ans === TOXIC)) { memory[c][item - 1] = ans - FED; memT[c][item - 1] = t; } // 0 fed, 1 plain, 2 toxic
      }
    }
  }
  return logs;
}

const train = build(NURSERY.trainSeed0, NURSERY.trainLives), valid = build(NURSERY.validSeed0, NURSERY.validLives);
// a count model over keyed contexts, add-0.5 over a declared target set
function countCE(keyOf, targetOf, isTarget, nT, fitLogs, evalLogs, alpha = 0.5) {
  const counts = new Map();
  for (const L of fitLogs) for (let p = 2; p < L.tok.length; p++) if (isTarget(L.tok[p])) {
    const k = keyOf(L, p); let a = counts.get(k); if (!a) counts.set(k, (a = new Float64Array(nT)));
    a[targetOf(L.tok[p])] += 1;
  }
  let ce = 0, n = 0;
  for (const L of evalLogs) for (let p = 2; p < L.tok.length; p++) if (isTarget(L.tok[p])) {
    const a = counts.get(keyOf(L, p)), tot = a ? a.reduce((x, y) => x + y, 0) : 0;
    ce -= Math.log(((a ? a[targetOf(L.tok[p])] : 0) + alpha) / (tot + alpha * nT)); n += 1;
  }
  return { ce: ce / n, n, contexts: counts.size };
}
const nA = T.TICK - T.ANS0, ansIdx = y => y - T.ANS0;
const isObsTok = y => y >= 1 && y <= T.DOWN, nObs = T.DOWN; // OBS tokens 1..DOWN, index y - 1
// The flat reference must use one concatenated sequence, as nursery.mjs does (its context crosses character boundaries at p = 0, 1)
const flat = logs => [{ tok: logs.flatMap(L => L.tok) }];
const refs = {
  ansMemoryless: countCE((L, p) => L.tok[p - 2] * V + L.tok[p - 1], ansIdx, isAnswer, nA, flat(train), flat(valid)),
  ansLastOutcome: countCE((L, p) => (L.tok[p - 2] * V + L.tok[p - 1]) * 4 + L.mem[(p - 2) >> 2], ansIdx, isAnswer, nA, train, valid),
  ansTableOracle: countCE((L, p) => (L.tok[p - 2] * V + L.tok[p - 1]) * 4 + L.eff[(p - 2) >> 2], ansIdx, isAnswer, nA, train, valid),
  // review additions: the last outcome kept only when the trunk's feed-forward window could hold it
  ansLastOutcomeWithin4: countCE((L, p) => { const i = (p - 2) >> 2; return (L.tok[p - 2] * V + L.tok[p - 1]) * 4 + (L.age[i] <= 4 ? L.mem[i] : NONE); }, ansIdx, isAnswer, nA, train, valid),
  ansLastOutcomeWithin7: countCE((L, p) => { const i = (p - 2) >> 2; return (L.tok[p - 2] * V + L.tok[p - 1]) * 4 + (L.age[i] <= 7 ? L.mem[i] : NONE); }, ansIdx, isAnswer, nA, train, valid),
  // in reach at that moment: u1p holds the last tick (age 1); u2, refreshed o = t mod 4 ticks ago, holds ages o+1 .. o+4
  ansLastOutcomeFeedForward: countCE((L, p) => { const i = (p - 2) >> 2, a = L.age[i], o = L.phase[i]; return (L.tok[p - 2] * V + L.tok[p - 1]) * 4 + (a === 1 || (a >= o + 1 && a <= o + 4) ? L.mem[i] : NONE); }, ansIdx, isAnswer, nA, train, valid),
  obsMemoryless: countCE((L, p) => L.tok[p - 2] * V + L.tok[p - 1], y => y - 1, isObsTok, nObs, flat(train), flat(valid)),
  obsPrevTick: countCE((L, p) => (p >= 4 ? (L.tok[p - 4] * V + L.tok[p - 3]) * V + L.tok[p - 2] : -1), y => y - 1, isObsTok, nObs, train, valid),
  obsPrevTickAdd001: countCE((L, p) => (p >= 4 ? (L.tok[p - 4] * V + L.tok[p - 3]) * V + L.tok[p - 2] : -1), y => y - 1, isObsTok, nObs, train, valid, 0.01),
  // an optimistic floor for any previous-tick predictor: fitted on the held-out logs themselves
  obsPrevTickFitOnHeldOut: countCE((L, p) => (p >= 4 ? (L.tok[p - 4] * V + L.tok[p - 3]) * V + L.tok[p - 2] : -1), y => y - 1, isObsTok, nObs, valid, valid, 0.01),
};
const expect = process.argv[2] ? +process.argv[2] : null;
const out = { refs, check: { ansCountCE: refs.ansMemoryless.ce, expected: expect, identical: expect === null ? null : refs.ansMemoryless.ce === expect } };
console.log(JSON.stringify(out, null, 1));
if (expect !== null && !out.check.identical) { console.error('the rebuilt logs differ from the nursery\'s'); process.exitCode = 1; }
