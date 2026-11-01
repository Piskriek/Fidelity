// D2 probe: prints the world's final chain hash for fixed seeds and scripted action logs, so two machines can be
// compared byte for byte.   node run/chain_probe.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash32 } from '../world/hash.mjs';
import { createWorld, step, EAT, PASS, REST } from '../world/valleys.mjs';
import { codeHash, presetHash } from '../world/ledger.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const policies = {
  random: (w, v) => hash32(0xbeef, 1, v, w.t) % 3,
  greedy: (w, v) => (w.item[v] ? EAT : w.H[v] < P.body.Hmax && w.E[v] > 0 ? REST : PASS),
};
const lines = [`node ${process.version} code ${codeHash().slice(0, 16)} preset ${presetHash(P).slice(0, 16)}`];
for (const seed of [1, 2, 3]) for (const [name, pol] of Object.entries(policies)) {
  const w = createWorld(P, seed);
  for (let t = 0; t < 10000; t++) step(w, [...Array(P.valleys)].map((_, v) => pol(w, v)));
  lines.push(`seed ${seed} ${name} 10000 ticks: ${w.chain}`);
}
console.log(lines.join('\n'));
