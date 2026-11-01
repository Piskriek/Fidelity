// Step 5 (D2 on ledgers): write world ledgers here, replay them on another machine, compare final chains.
//   node run/ledger_replay.mjs write <dir>     writes 3 ledgers of 10,000 ticks (random actions) and their final chains
//   node run/ledger_replay.mjs replay <dir>    replays every ledger in <dir> and prints its final chain
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash32 } from '../world/hash.mjs';
import { createWorld, step } from '../world/valleys.mjs';
import { createLedger, record, replay, saveLedger, loadLedger } from '../world/ledger.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
const [mode, dir] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
if (mode === 'write') {
  for (const seed of [201, 202, 203]) {
    const w = createWorld(P, seed), L = createLedger(P, seed);
    for (let t = 0; t < 10000; t++) { const a = [...Array(P.valleys)].map((_, v) => hash32(seed, 9, v, t) % 3); step(w, a); record(L, w, a); }
    saveLedger(path.join(dir, `ledger_${seed}.json`), L);
    console.log(`seed ${seed}: ${w.chain}`);
  }
} else if (mode === 'replay') {
  for (const f of fs.readdirSync(dir).filter(f => f.startsWith('ledger_')).sort()) {
    const L = loadLedger(path.join(dir, f)), r = replay(P, L);
    console.log(`seed ${L.seed}: ${r.ok ? r.finalChain : `FAILED ${r.reason}`}`);
  }
} else throw new Error('mode is write or replay');
