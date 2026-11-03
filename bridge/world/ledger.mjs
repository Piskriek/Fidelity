// The World Ledger (Plan proposal B127, used here for the bridge only): genesis seed, preset and code hashes, one
// action byte per tick, and every 256th chain hash. A world is a pure function of (seed, preset, action log), so
// replaying the log must reproduce the chain exactly; a mismatch is bisected to its first tick.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256hex } from './hash.mjs';
import { createWorld, step, actionByte, actionsFromByte } from './valleys.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const CHECKPOINT = 256;
export const codeHash = () => sha256hex(...['hash.mjs', 'valleys.mjs', 'ledger.mjs'].map(f => fs.readFileSync(path.join(here, f))), fs.readFileSync(path.join(here, '..', 'vendor', 'wave0_reference.mjs')));
export const presetHash = P => sha256hex(Buffer.from(JSON.stringify(P)));

export function createLedger(P, seed) {
  return { format: 'fourvalleys-ledger/1', seed: seed | 0, preset: P.name, presetHash: presetHash(P), codeHash: codeHash(), actions: [], checkpoints: [] };
}
// record one tick's actions and, every CHECKPOINT ticks, the chain hash after it
export function record(ledger, w, actions) {
  ledger.actions.push(actionByte(actions));
  if (w.t % CHECKPOINT === 0) ledger.checkpoints.push({ t: w.t, chain: w.chain });
}
// replay: rebuild the world from the seed and the action log; returns the full chain and the first mismatch, if any
export function replay(P, ledger, { upto = ledger.actions.length } = {}) {
  if (presetHash(P) !== ledger.presetHash) return { ok: false, reason: 'preset hash differs' };
  const w = createWorld(P, ledger.seed), chain = [];
  const byT = new Map(ledger.checkpoints.map(c => [c.t, c.chain]));
  for (let t = 0; t < upto; t++) {
    step(w, actionsFromByte(ledger.actions[t], P.valleys));
    chain.push(w.chain);
    if (byT.has(w.t) && byT.get(w.t) !== w.chain) return { ok: false, reason: `checkpoint mismatch at tick ${w.t}`, firstBadCheckpoint: w.t, chain };
  }
  return { ok: true, finalChain: w.chain, chain };
}
export const saveLedger = (file, ledger) => fs.writeFileSync(file, JSON.stringify({ ...ledger, actions: Buffer.from(ledger.actions).toString('base64') }));
export function loadLedger(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { ...j, actions: [...Buffer.from(j.actions, 'base64')] };
}
