// Reference minds (BRIDGE_DESIGN.md §6.1; not graded) and the readouts of §6.3, on world seeds 101-116.
//   node run/baselines.mjs [ticks]
// O knows the season's table; T learns a running mean per kind from answers; S eats whatever it finds; RND is random.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLife } from './lockstep.mjs';
import { makeTokens } from '../bridge/tokens.mjs';
import { EAT, PASS, REST, A, NOURISH, TOXIC } from '../world/valleys.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const K = makeTokens(P);
const EPS = 0.1;

// what an OBS token lets a mind know: down, the item, and whether H is full / E is zero (exact band predicates)
const look = tok => { const d = K.decodeObs(tok); if (d.down) return { down: true }; return { down: false, item: d.item, hFull: P.observation.Hbands[d.hBand][0] === P.body.Hmax, eZero: P.observation.Ebands[d.eBand][1] === 0 }; };
const restOr = o => (!o.hFull && !o.eZero ? REST : PASS);

// O: an oracle reads the true table through a side channel the characters do not have (a reference only)
export const makeO = () => ({ oracle: true, choose: (c, tok, u, t, tab) => { const o = look(tok); if (o.down) return PASS; if (o.item && tab[c][o.item - 1] !== TOXIC) return EAT; return restOr(o); }, feel() {} });
export const makeS = () => ({ choose: (c, tok) => { const o = look(tok); if (o.down) return PASS; return o.item ? EAT : restOr(o); }, feel() {} });
export const makeRND = () => ({ choose: (c, tok, u) => Math.min(2, Math.floor(u * 3)), feel() {} });
// T: per character, per kind, a running mean (keep 0.9) of the answer's declared value; epsilon-greedy on u
export function makeT() {
  const mean = [...Array(P.valleys)].map(() => [1, 1, 1]), last = [];
  return {
    choose(c, tok, u) {
      const o = look(tok); last[c] = { o, a: null };
      if (o.down) return (last[c].a = PASS);
      if (o.item && (mean[c][o.item - 1] > 0 || u < EPS)) return (last[c].a = EAT);
      return (last[c].a = restOr(o));
    },
    feel(c, tok) {
      const L = last[c]; if (!L || L.a !== EAT || !L.o.item) return;
      const { name } = K.decodeAnswer(tok);
      const v = name === 'FED' ? 3 : name === 'PLAIN' ? 1 : name === 'TOXIC' ? -4 : null;
      if (v !== null) mean[c][L.o.item - 1] = 0.9 * mean[c][L.o.item - 1] + 0.1 * v;
    },
  };
}

// readouts (§6.3), from the first season boundary to the end of the life
export function readouts(res) {
  const { log } = res, n = P.valleys, t0 = log.seasons[1] ?? 0, T = log.acts.length;
  let withItem = 0, nourish = 0, toxic = 0, Vsum = 0, painSum = 0, collapses = 0, toxicOffered = 0, nourishOffered = 0, toxicEaten = 0, nourishEaten = 0, ticks = 0;
  let si = 0;
  for (let t = t0; t < T; t++) {
    while (si + 1 < log.seasons.length && log.seasons[si + 1] <= t) si++;
    const tab = log.tables[si];
    for (let c = 0; c < n; c++) {
      ticks++; Vsum += log.V[t][c]; painSum += log.pain[t][c];
      if (log.answers[t][c] === A.COLLAPSE) collapses++;
      const d = K.decodeObs(log.obs[t][c]);
      if (d.down || !d.item) continue;
      withItem++;
      const eff = tab[c][d.item - 1], ate = log.acts[t][c] === EAT;
      if (eff === TOXIC) { toxicOffered++; if (ate) { toxicEaten++; toxic++; } }
      if (eff === NOURISH) { nourishOffered++; if (ate) { nourishEaten++; nourish++; } }
    }
  }
  return {
    NGE: (100 * (nourish - toxic)) / Math.max(1, withItem), meanV: Vsum / ticks, painPer100: (100 * painSum) / ticks,
    collapsesPer10k: (1e4 * collapses) / ticks, toxicEatRate: toxicEaten / Math.max(1, toxicOffered), nourishEatRate: nourishEaten / Math.max(1, nourishOffered),
  };
}

if (process.argv[1] && process.argv[1].endsWith('baselines.mjs')) {
  const ticks = +(process.argv[2] || P.lifeTicks), seeds = [...Array(16).keys()].map(i => 101 + i);
  const arms = { O: makeO, T: makeT, S: makeS, RND: makeRND };
  const table = {};
  for (const [name, make] of Object.entries(arms)) {
    const rs = [];
    for (const seed of seeds) {
      const m = make(), minds = [m, m, m, m];
      rs.push(readouts(runLife(P, { worldSeed: seed, minds, ticks })));
    }
    const mean = k => rs.reduce((s, r) => s + r[k], 0) / rs.length;
    table[name] = Object.fromEntries(Object.keys(rs[0]).map(k => [k, +mean(k).toFixed(3)]));
  }
  console.log(`baselines over world seeds 101-116, ${ticks} ticks each (readout from the first season boundary)`);
  for (const [name, r] of Object.entries(table)) console.log(`  ${name.padEnd(4)} ${JSON.stringify(r)}`);
}
