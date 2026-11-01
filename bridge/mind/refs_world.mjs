// Reference minds' readouts on one world seed (run/baselines.mjs minds and readouts), for smoke runs.
//   node mind/refs_world.mjs <worldSeed>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { makeO, makeT, makeS, makeRND, readouts } from '../run/baselines.mjs';
const P = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'preset', 'valleys_v1.json'), 'utf8'));
const w = +process.argv[2], out = {};
for (const [n, mk] of Object.entries({ O: makeO, T: makeT, S: makeS, RND: makeRND })) {
  const m = mk(), r = readouts(runLife(P, { worldSeed: w, minds: [m, m, m, m] }));
  out[n] = { NGE: +r.NGE.toFixed(2), collapsesPer10k: +r.collapsesPer10k.toFixed(1), toxicEatRate: +r.toxicEatRate.toFixed(3), nourishEatRate: +r.nourishEatRate.toFixed(3) };
}
console.log(JSON.stringify(out));
