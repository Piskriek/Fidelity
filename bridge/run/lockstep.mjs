// The lockstep runner (critique finding 9: the runner lives in run/, so bridge/ stays synchronous and pure).
// Each tick: the bridge encodes each character's OBS; each mind chooses; the engine steps (refusals become typed
// answers); the bridge encodes each ANSWER; each mind feels it. Minds get only tokens and the declared facts, never
// the world state. Common random numbers: u = hash32(runSeed, U, c, t) / 2^32, the same for every arm.
import { hash32 } from '../world/hash.mjs';
import { createWorld, step, snapshot } from '../world/valleys.mjs';
import { makeTokens } from '../bridge/tokens.mjs';

const U = 0x55;
// feltPain stays false (owner ruling 2026-11-01, preset.feltPain): no mind receives pain numbers until it has a higher
// self that chooses its catalysts. Minds still get the answer token, which carries what happened.
export function runLife(P, { worldSeed, runSeed = worldSeed, minds, ticks = P.lifeTicks, onTick = null, feltPain = false }) {
  if (feltPain) throw new Error('felt pain is off by owner ruling: a character feels pain only once its higher self chooses it (stage 2)');
  const K = makeTokens(P), w = createWorld(P, worldSeed), n = P.valleys;
  const log = { obs: [], acts: [], answers: [], V: [], pain: [], gain: [], causes: [], seasons: [], tables: [] };
  let lastSeason = -1;
  for (let t = 0; t < ticks; t++) {
    if (w.s !== lastSeason) { log.seasons.push(t); log.tables.push(w.table.map(r => [...r])); lastSeason = w.s; }
    const snap = snapshot(w);
    const obs = snap.valleys.map(b => K.encodeObs(b));
    const acts = obs.map((tok, c) => {
      const u = hash32(runSeed, U, c, t) / 4294967296;
      // reference minds marked `oracle` (O only, never a character) get the true table through this labelled side channel
      const a = minds[c].oracle ? minds[c].choose(c, tok, u, t, w.table) : minds[c].choose(c, tok, u, t);
      if (!Number.isInteger(a)) throw new Error(`action port: character ${c} returned ${String(a)}, not an action index`);
      return K.decodeAction(K.encodeAction(a)); // the only port from mind to world (encodeAction throws on 3+, -1)
    });
    const outs = step(w, acts);
    outs.forEach((o, c) => {
      const tok = K.encodeAnswer(o.answer, o.starving);
      minds[c].feel(c, tok, { gain: o.gain, pain: 0 }); // no felt pain (see above)
    });
    log.obs.push(obs); log.acts.push(acts); log.answers.push(outs.map(o => o.answer));
    log.V.push(outs.map(o => o.V)); log.pain.push(outs.map(o => o.pain)); log.gain.push(outs.map(o => o.gain)); log.causes.push(outs.map(o => o.cause));
    if (onTick) onTick(t, w, outs);
  }
  return { log, finalChain: w.chain, K, loopBreaks: [...w.loopBreaks] };
}
