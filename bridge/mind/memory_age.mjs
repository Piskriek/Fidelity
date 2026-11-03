// How far back the useful memory sits: for each held-out ANSWER after eating an item, the ticks since this character last ate
// that kind (in this life). Feed-forward reach (review): u1p holds the last tick (age 1); u2, refreshed o = t mod 4 ticks ago,
// holds ages o+1 .. o+4. So right after a refresh the window is ages 1-4; just before the next it is ages 1 and 4-7.
// Recurrent paths (0 -> 2 -> 0 through x0p, the sting's running means) can carry older context; this measures the window only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { makeTokens } from '../bridge/tokens.mjs';
import { EAT, PASS, REST } from '../world/valleys.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const K = makeTokens(P), Eb = P.observation.Ebands, Hb = P.observation.Hbands;
const choose = (tok, u) => { if (u < 0.5) return Math.floor((u / 0.5) * 3); const o = K.decodeObs(tok); if (o.down) return PASS; if (o.item && Eb[o.eBand][1] <= 10) return EAT; if (Hb[o.hBand][1] <= 10) return REST; return PASS; };
const ages = [], inReach = [];
for (let i = 0; i < 2; i++) {
  const res = runLife(P, { worldSeed: 29000 + i, minds: [0, 1, 2, 3].map(() => ({ choose: (c, tok, u) => choose(tok, u), feel() {} })) });
  for (let c = 0; c < 4; c++) {
    const lastEat = [null, null, null];
    for (let t = 0; t < res.log.acts.length; t++) {
      const d = K.decodeObs(res.log.obs[t][c]);
      if (d.down || !d.item || res.log.acts[t][c] !== EAT) continue;
      const age = lastEat[d.item - 1] === null ? Infinity : t - lastEat[d.item - 1], o = t % 4;
      ages.push(age); inReach.push(age === 1 || (age >= o + 1 && age <= o + 4));
      lastEat[d.item - 1] = t;
    }
  }
}
const n = ages.length, q = f => ages.filter(f).length / n;
const fin = ages.filter(Number.isFinite).sort((a, b) => a - b), med = fin[Math.floor(fin.length / 2)];
console.log(JSON.stringify({ eats: n, withinRung2Window16: +q(a => a <= 16).toFixed(3), within4: +q(a => a <= 4).toFixed(3), within7: +q(a => a <= 7).toFixed(3), within8: +q(a => a <= 8).toFixed(3), inFeedForwardReach: +(inReach.filter(Boolean).length / n).toFixed(3), over64: +q(a => a > 64 && Number.isFinite(a)).toFixed(3), firstOfKind: +q(a => !Number.isFinite(a)).toFixed(4), medianTicks: med }));
