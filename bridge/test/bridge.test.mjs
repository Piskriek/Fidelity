// Bridge tests (BRIDGE_DESIGN.md §3; B6 from critique finding 1).   node test/bridge.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash32 } from '../world/hash.mjs';
import { createWorld, step, snapshot, EAT, PASS, REST } from '../world/valleys.mjs';
import { createEnergyLedger } from '../vendor/wave0_reference.mjs';
import { makeTokens } from '../bridge/tokens.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const K = makeTokens(P);
let failed = 0;
const check = (id, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? `  ${detail}` : ''}`); if (!ok) failed++; };
const setState = (w, v, { E, H, down, item, effect, ell }) => {
  w.E[v] = E; w.H[v] = H; w.down[v] = down; w.item[v] = item; w.ell[v] = ell; w.stored0[v] = E; w.books[v] = createEnergyLedger();
  if (item) w.table[v][item - 1] = effect;
};

// B1: exhaustive. Every reachable (state, action) gives an answer that has exactly one token; every ANSWER token is reached;
// B6: how often the answer is NOT a function of what rung 0 sees at the ANSWER slot (OBS, ACTION) plus the hidden effect and intensity
{
  const reached = new Set(), decide = new Map(); let n = 0, unreachableErr = 0;
  const states = [];
  for (let E = 0; E <= 15; E++) for (let H = 1; H <= 15; H++) for (let item = 0; item < 4; item++) for (const effect of item ? [0, 1, 2] : [0]) for (const ell of [1, 2]) states.push({ E, H, down: 0, item, effect, ell });
  for (let down = 1; down <= 8; down++) for (let item = 0; item < 4; item++) states.push({ E: 5, H: 8 - down, down, item, effect: 0, ell: 2 });
  for (const s of states) for (const a of [EAT, PASS, REST]) {
    const w = createWorld(P, 1); setState(w, 0, s);
    const obsTok = K.encodeObs(s);
    const o = step(w, [a, PASS, PASS, PASS])[0];
    let tok; try { tok = K.encodeAnswer(o.answer, o.starving); } catch { unreachableErr++; continue; }
    reached.add(tok); n++;
    const key = `${obsTok}|${a}|${s.item && a === EAT ? s.effect : '-'}|${s.ell}`;
    if (!decide.has(key)) decide.set(key, new Set());
    decide.get(key).add(tok);
  }
  const allAns = [...Array(K.ANS.length).keys()].map(i => K.T.ANS0 + i);
  const missing = allAns.filter(t => !reached.has(t));
  check('B1 every reachable answer has one token; every ANSWER token is reached', unreachableErr === 0 && missing.length === 0, `${n} (state, action) pairs; ${unreachableErr} without a token; unreached ${missing.map(t => K.ANS[t - K.T.ANS0].join('/')).join(', ') || 'none'}`);
  const coll = [...decide.entries()].filter(([, s]) => s.size > 1);
  const examples = coll.slice(0, 4).map(([k, s]) => { const [obs, a] = k.split('|'); const d = K.decodeObs(+obs); return `E band ${d.eBand} H band ${d.hBand} ${['EAT', 'PASS', 'REST'][+a]} -> ${[...s].map(t => K.ANS[t - K.T.ANS0].join('/')).join(' | ')}`; });
  console.log(`INFO B6 answer not decided by (OBS, ACTION, effect, intensity) in ${coll.length} of ${decide.size} cells (exact E or H inside a band). e.g. ${examples.join('; ')}`);
  check('B6 the residual is only inside-band detail (never the item, the action or a refusal type)', coll.every(([, s]) => [...s].every(t => { const n2 = K.ANS[t - K.T.ANS0][0]; return ['OK', 'RESTED', 'COLLAPSE', 'ERR_EMPTY', 'ERR_FULL', 'TOXIC', 'FED', 'PLAIN', 'ERR_SPENT'].includes(n2); }) && ![...s].some(t => K.ANS[t - K.T.ANS0][0] === 'ERR_DOWN')), `${coll.length} cells`);
}

// B1b: every OBS token decodes back to its own bands (injective), and every warning is an exact predicate of its band
{
  let bad = 0, warnErr = 0;
  for (let tok = K.OBS0; tok < K.OBS0 + K.NOBS; tok++) {
    const d = K.decodeObs(tok);
    const E = P.observation.Ebands[d.eBand][0], H = P.observation.Hbands[d.hBand][0];
    if (K.encodeObs({ E, H, down: 0, item: d.item }) !== tok) bad++;
    try { K.warningsOf(d); } catch { warnErr++; }
  }
  check('B1b OBS tokens are injective; warnings are exact band predicates', bad === 0 && warnErr === 0, `V = ${K.V} tokens`);
}

// B2 (round trip) and B3 (census) on a live run: each tick's tokens read back to the band projection of the true snapshot
{
  const w = createWorld(P, 9); let mismatch = 0, warnWrong = 0; const census = new Map();
  for (let t = 0; t < 20000; t++) {
    const snap = snapshot(w);
    const acts = [...Array(P.valleys)].map((_, v) => hash32(77, v, t) % 3);
    snap.valleys.forEach((b, v) => {
      const tok = K.encodeObs(b), back = K.decodeObs(tok), proj = K.project(b);
      if (JSON.stringify(back) !== JSON.stringify(proj)) mismatch++;
      const claimed = K.warningsOf(back), truth = b.fear;
      if (!back.down && (claimed.HUNGRY !== truth.HUNGRY || claimed.STARVING !== truth.STARVING || claimed.WEAK !== truth.WEAK)) warnWrong++;
      census.set(tok, (census.get(tok) || 0) + 1);
    });
    const outs = step(w, acts);
    outs.forEach(o => { const tok = K.encodeAnswer(o.answer, o.starving); census.set(tok, (census.get(tok) || 0) + 1); });
  }
  check('B2 round trip: every observation reads back to the true band projection', mismatch === 0, `${mismatch} mismatches`);
  check('L1 the warnings a token implies are true of the world (lens truth)', warnWrong === 0, `${warnWrong} false claims`);
  const outOfTable = [...census.keys()].filter(t => !(t >= 0 && t < K.V));
  check('B3 census: every emitted token is in the declared table', outOfTable.length === 0, `${census.size} distinct tokens used of ${K.V}`);
}

// B4: the action port is total and injective; anything else throws, in both directions
{
  const ok = [EAT, PASS, REST].every(a => K.decodeAction(K.encodeAction(a)) === a);
  let threw = 0; for (const tok of [K.T.PAD, K.T.TICK, K.T.DOWN, K.T.ANS0, 999, -1]) { try { K.decodeAction(tok); } catch { threw++; } }
  let threwEnc = 0; for (const a of [3, 4, -1, 1.5, 7]) { try { K.encodeAction(a); } catch { threwEnc++; } }
  check('B4 the action port is total on actions and refuses anything else, both ways', ok && threw === 6 && threwEnc === 5, `${threwEnc} of 5 bad actions refused by encodeAction`);
}

// B7: every token in the table is distinct and the table covers 0..V-1 exactly once (mutant round 1: TICK could collide)
{
  const named = [K.T.PAD, ...[...Array(K.NOBS).keys()].map(i => K.OBS0 + i), K.T.DOWN, K.T.EAT, K.T.PASS, K.T.REST, ...K.ANS.map((_, i) => K.T.ANS0 + i), K.T.TICK];
  const set = new Set(named);
  check('B7 the token table is a bijection onto 0..V-1', set.size === named.length && named.length === K.V && named.every(t => t >= 0 && t < K.V), `${set.size} distinct of ${named.length}, V ${K.V}`);
}

// B8: every ANSWER token decodes back to exactly its own (answer, starving) pair
{
  let bad = 0;
  K.ANS.forEach(([name, s], i) => { const d = K.decodeAnswer(K.T.ANS0 + i); if (d.name !== name || d.starving !== !!s) bad++; });
  check('B8 ANSWER tokens round-trip to their own (answer, starving) pair', bad === 0, `${bad} wrong`);
}

if (failed) { console.log(`${failed} test(s) failed`); process.exitCode = 1; } else console.log('all bridge tests pass');
