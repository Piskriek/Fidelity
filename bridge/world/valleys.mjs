// Four Valleys v1: the engine (BRIDGE_DESIGN.md §2, with critique findings 2a and 11 applied).
// Four valleys, one character each, lockstep logical time, integer state only. The schedule (fruit, seasons) is
// counter-based, so every arm meets the same world. canAct is pure; act re-checks and throws WorldRefusal; the tick
// boundary turns a refusal into a typed answer and never clamps, replaces or drops it. Render is not here: the lens
// reads snapshots and writes nothing.
import { hash32, PURPOSE, chainNext, GENESIS } from './hash.mjs';
import { createEnergyLedger, ledgerCloses } from '../vendor/wave0_reference.mjs';

export const EAT = 0, PASS = 1, REST = 2;
export const NOURISH = 0, PLAIN = 1, TOXIC = 2;
export const ANSWERS = Object.freeze(['FED', 'PLAIN', 'TOXIC', 'OK', 'RESTED', 'ERR_EMPTY', 'ERR_FULL', 'ERR_SPENT', 'ERR_DOWN', 'COLLAPSE']);
export const A = Object.freeze(Object.fromEntries(ANSWERS.map((n, i) => [n, i])));
export const CAUSES = Object.freeze(['hunger', 'toxin', 'other']);

export class WorldRefusal extends Error {
  constructor(code) { super(`refused: ${code}`); this.code = code; }
}

// ---------------------------------------------------------------- the schedule (outside any character's control)
export const itemAt = (seed, v, t) => hash32(seed, PURPOSE.ITEM, v, t) % 4; // 0 none, 1..3 kinds a, b, c
export const seasonLength = (P, seed, s) => P.season.minLength + (hash32(seed, PURPOSE.LEN, s) % P.season.lengthSpan);
// effect table [v][k]; redrawn with r + 1 while any valley has no NOURISH kind
export function seasonTable(P, seed, s) {
  for (let r = 0; ; r++) {
    const tab = [...Array(P.valleys)].map(() => new Array(P.kinds).fill(0));
    for (let k = 0; k < P.kinds; k++) {
      const shared = hash32(seed, PURPOSE.SHARE, s, k, r) & 1;
      for (let v = 0; v < P.valleys; v++) tab[v][k] = hash32(seed, PURPOSE.EFF, s, k, shared ? P.valleys : v, r) % 3;
    }
    if (tab.every(row => row.includes(NOURISH))) return { tab, shared: [...Array(P.kinds).keys()].map(k => hash32(seed, PURPOSE.SHARE, s, k, r) & 1), r };
  }
}

// ---------------------------------------------------------------- state
export function createWorld(P, seed) {
  const n = P.valleys;
  const w = {
    P, seed: seed | 0, t: 0, s: 0, seasonEnd: 0, table: null, shared: null, chain: GENESIS,
    E: new Int32Array(n).fill(P.body.birthE), H: new Int32Array(n).fill(P.body.birthH), down: new Int32Array(n),
    item: new Int32Array(n), stage: new Int32Array(n), ell: new Int32Array(n).fill(P.intensity.default),
    collapsesSeason: new Int32Array(n), causeCount: [...Array(n)].map(() => new Int32Array(CAUSES.length)),
    loopBreaks: new Int32Array(n), books: [...Array(n)].map(() => createEnergyLedger()), stored0: new Int32Array(n).fill(P.body.birthE),
  };
  startSeason(w, 0, 0);
  for (let v = 0; v < n; v++) w.item[v] = itemAt(w.seed, v, 0);
  return w;
}
function startSeason(w, s, t) {
  const { tab, shared } = seasonTable(w.P, w.seed, s);
  w.s = s; w.table = tab; w.shared = shared; w.seasonEnd = t + seasonLength(w.P, w.seed, s);
}

// what a character's body shows before it acts: the warnings (fear) are a pure function of the body
export function warnings(P, E, H) {
  const inR = (x, [a, b]) => x >= a && x <= b;
  return { HUNGRY: inR(E, P.warnings.HUNGRY), STARVING: inR(E, P.warnings.STARVING), WEAK: inR(H, P.warnings.WEAK) };
}

// ---------------------------------------------------------------- intensity: it can only be brought down
// Owner ruling (2026-11-01): pain is chosen at the higher-self level, never a setting; higher selves bring it down,
// never push it up. This is the only function that changes intensity during a life, and it can only lower it.
// There is deliberately no function that raises it. Returns true if it lowered.
export function lowerIntensity(w, v, to) {
  const target = Math.max(w.P.intensity.min, to | 0);
  if (target >= w.ell[v]) return false;
  w.ell[v] = target;
  return true;
}

// ---------------------------------------------------------------- the write gate: canAct is pure, act re-checks and throws
export function canAct(w, v, action) {
  if (![EAT, PASS, REST].includes(action)) return { ok: false, code: 'ERR_BAD_ACTION' };
  if (w.down[v] > 0) return { ok: false, code: 'ERR_DOWN' };
  if (action === EAT && w.item[v] === 0) return { ok: false, code: 'ERR_EMPTY' };
  if (action === REST && w.H[v] === w.P.body.Hmax) return { ok: false, code: 'ERR_FULL' }; // precedence over ERR_SPENT
  if (action === REST && w.E[v] === 0) return { ok: false, code: 'ERR_SPENT' };
  return { ok: true, code: null };
}
// applies an accepted action to valley v (no metabolism); returns the answer before metabolism and collapse
function act(w, v, action) {
  const c = canAct(w, v, action);
  if (!c.ok) throw new WorldRefusal(c.code);
  const P = w.P, book = w.books[v];
  if (action === EAT) {
    const eff = w.table[v][w.item[v] - 1], g = eff === NOURISH ? P.eat.NOURISH : eff === PLAIN ? P.eat.PLAIN : P.eat.TOXIC;
    book.post('stellar', g, { t: w.t, v, what: 'eat' });
    const over = Math.max(0, w.E[v] + g - P.body.Emax);
    if (over) book.post('thermal', over, { t: w.t, v, what: 'overflow' });
    w.E[v] = Math.min(P.body.Emax, w.E[v] + g);
    if (eff === TOXIC) { w.H[v] = Math.max(0, w.H[v] - P.eat.toxicHealthLossPerIntensity * w.ell[v]); return A.TOXIC; }
    return eff === NOURISH ? A.FED : A.PLAIN;
  }
  if (action === REST) {
    w.H[v] = Math.min(P.body.Hmax, w.H[v] + P.rest.healthGain);
    w.E[v] -= P.rest.energyCost; book.post('thermal', P.rest.energyCost, { t: w.t, v, what: 'rest' });
    return A.RESTED;
  }
  return A.OK;
}

// ---------------------------------------------------------------- the tick
// actions: Int array, one per valley. Returns per valley { answer, starving, cause, gain, pain, V, fear } and advances t.
export function step(w, actions) {
  const P = w.P, n = P.valleys;
  if (!actions || actions.length !== n) throw new Error(`step needs ${n} actions`);
  const out = [];
  for (let v = 0; v < n; v++) {
    const a = actions[v] | 0;
    let answer, starving = false, cause = null, wasToxic = false;
    if (w.down[v] > 0) { // protective rest: any action is refused, H rises, metabolism skipped
      answer = A.ERR_DOWN;
      w.H[v] = Math.min(P.body.Hmax, w.H[v] + 1); w.down[v] -= 1;
    } else {
      try { answer = act(w, v, a); wasToxic = answer === A.TOXIC; } catch (e) {
        if (!(e instanceof WorldRefusal)) throw e;
        answer = A[e.code];
        if (answer === undefined) throw new Error(`untyped refusal ${e.code}`); // never dropped or replaced
      }
      if (w.E[v] > 0) { w.E[v] -= P.metabolism.energyCost; w.books[v].post('thermal', P.metabolism.energyCost, { t: w.t, v, what: 'metabolism' }); }
      else { w.H[v] = Math.max(0, w.H[v] - P.metabolism.starvingHealthLoss); starving = true; }
      if (w.H[v] === 0) {
        cause = wasToxic ? 'toxin' : starving ? 'hunger' : 'other';
        answer = A.COLLAPSE; w.down[v] = P.collapse.downTicks; w.collapsesSeason[v] += 1;
        const ci = CAUSES.indexOf(cause); w.causeCount[v][ci] += 1;
        // loop-break (Plan Rule 2): the same cause N times in one life lowers this character's intensity
        if (w.causeCount[v][ci] === P.loopBreak.collapsesFromOneCause && lowerIntensity(w, v, P.loopBreak.intensityAfter)) w.loopBreaks[v] += 1;
      }
    }
    // values, from the declared table (pain reaches a mind only after the owner's approval; that gate is in the bridge)
    const g = P.values.gain, p = P.values.pain, name = ANSWERS[answer];
    let gain = 0, pain = 0;
    if (answer === A.COLLAPSE) pain = p.COLLAPSE;
    else {
      gain = g[name] ?? 0;
      if (name === 'TOXIC') pain += p.TOXIC_PER_INTENSITY * w.ell[v];
      if (p[name] !== undefined) pain += p[name];
      if (starving) pain += p.STARVING;
    }
    out.push({ answer, starving, cause, gain, pain, V: gain - pain });
  }
  // bookkeeping: books close exactly; season clock and stage; next tick's items; hash chain
  for (let v = 0; v < n; v++) {
    const c = ledgerCloses({ stored0: w.stored0[v], stored1: w.E[v], ledger: w.books[v], tol: 0 });
    if (!c.ok) throw new Error(`energy books do not close in valley ${v} at tick ${w.t}: residual ${c.residual}`);
  }
  w.t += 1;
  if (w.t >= w.seasonEnd) {
    for (let v = 0; v < n; v++) { if (w.collapsesSeason[v] === 0) w.stage[v] = Math.min(P.stage.max, w.stage[v] + 1); w.collapsesSeason[v] = 0; }
    startSeason(w, w.s + 1, w.t);
  }
  for (let v = 0; v < n; v++) w.item[v] = itemAt(w.seed, v, w.t);
  w.chain = chainNext(w.chain, stateBytes(w, actions));
  return out;
}

// canonical little-endian bytes of the state after a tick, plus the action byte (4 x 2 bits)
export function stateBytes(w, actions) {
  const n = w.P.valleys, k = w.P.kinds;
  const ints = [w.t, w.s, w.seasonEnd];
  for (let v = 0; v < n; v++) ints.push(w.E[v], w.H[v], w.down[v], w.item[v], w.stage[v], w.ell[v], w.collapsesSeason[v], ...w.causeCount[v], w.loopBreaks[v]);
  for (let v = 0; v < n; v++) for (let j = 0; j < k; j++) ints.push(w.table[v][j]);
  const buf = Buffer.alloc(ints.length * 4 + 1);
  ints.forEach((x, i) => buf.writeInt32LE(x, i * 4));
  buf.writeUInt8(actionByte(actions), ints.length * 4);
  return buf;
}
export const actionByte = actions => actions.reduce((b, a, v) => b | ((a & 3) << (2 * v)), 0);
export const actionsFromByte = (byte, n) => [...Array(n)].map((_, v) => (byte >> (2 * v)) & 3);

// a read-only snapshot for the lens and the bridge (copies, so nobody can write the world through it)
export function snapshot(w) {
  const n = w.P.valleys;
  return Object.freeze({
    t: w.t, s: w.s, seasonEnd: w.seasonEnd, chain: w.chain,
    valleys: Object.freeze([...Array(n)].map((_, v) => Object.freeze({
      E: w.E[v], H: w.H[v], down: w.down[v], item: w.item[v], stage: w.stage[v], ell: w.ell[v],
      fear: warnings(w.P, w.E[v], w.H[v]), loopBreaks: w.loopBreaks[v],
    }))),
  });
}
