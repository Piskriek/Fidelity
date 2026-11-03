// The token table (BRIDGE_DESIGN.md §3.2 with critique finding 1 applied): one tick is the block
//   OBS  ACTION  ANSWER  TICK
// OBS fuses the body bands and the item, so rung 0 at the ACTION slot sees (TICK, OBS) and at the ANSWER slot sees
// (OBS, ACTION). TICK is a fixed separator that keeps the block 4 long (span1 = 4). Each reachable value of the declared
// slice has exactly one token and no token stands for two (test B1). What the view drops is listed in VIEW_KERNEL.
import { ANSWERS, A } from '../world/valleys.mjs';

export function makeTokens(P) {
  const EB = P.observation.Ebands, HB = P.observation.Hbands, NI = 4;
  const band = (x, bands) => bands.findIndex(([a, b]) => x >= a && x <= b);
  const T = { PAD: 0 };
  const OBS0 = 1, NOBS = EB.length * HB.length * NI;
  T.DOWN = OBS0 + NOBS;
  T.EAT = T.DOWN + 1; T.PASS = T.EAT + 1; T.REST = T.PASS + 1;
  // the reachable (answer, starving) pairs; FED, PLAIN and TOXIC are never starving, ERR_SPENT always is
  const ANS = [['OK', 0], ['OK', 1], ['RESTED', 0], ['RESTED', 1], ['ERR_EMPTY', 0], ['ERR_EMPTY', 1], ['ERR_FULL', 0], ['ERR_FULL', 1],
    ['FED', 0], ['PLAIN', 0], ['TOXIC', 0], ['ERR_SPENT', 1], ['COLLAPSE', 0], ['ERR_DOWN', 0]];
  T.ANS0 = T.REST + 1;
  T.TICK = T.ANS0 + ANS.length;
  const V = T.TICK + 1;
  const ansIndex = new Map(ANS.map(([n, s], i) => [`${n}/${s}`, i]));

  const encodeObs = ({ E, H, down, item }) => {
    if (down > 0) return T.DOWN;
    const eb = band(E, EB), hb = band(H, HB);
    if (eb < 0 || hb < 0 || item < 0 || item >= NI) throw new Error(`observation out of range E ${E} H ${H} item ${item}`);
    return OBS0 + (eb * HB.length + hb) * NI + item;
  };
  const decodeObs = tok => {
    if (tok === T.DOWN) return { down: true };
    const i = tok - OBS0;
    if (!(i >= 0 && i < NOBS)) throw new Error(`not an OBS token: ${tok}`);
    return { down: false, eBand: Math.floor(i / (HB.length * NI)), hBand: Math.floor(i / NI) % HB.length, item: i % NI };
  };
  // the band projection of a true body: what the token claims, for the round trip (B2) and the lens (T3)
  const project = ({ E, H, down, item }) => (down > 0 ? { down: true } : { down: false, eBand: band(E, EB), hBand: band(H, HB), item });
  const encodeAnswer = (answer, starving) => {
    // COLLAPSE and ERR_DOWN carry no starving flag
    const name = ANSWERS[answer], s = name === 'COLLAPSE' || name === 'ERR_DOWN' ? 0 : starving ? 1 : 0;
    const i = ansIndex.get(`${name}/${s}`);
    if (i === undefined) throw new Error(`unreachable answer ${name}/${s}`);
    return T.ANS0 + i;
  };
  const decodeAnswer = tok => { const i = tok - T.ANS0; if (!(i >= 0 && i < ANS.length)) throw new Error(`not an ANSWER token: ${tok}`); return { answer: A[ANS[i][0]], name: ANS[i][0], starving: !!ANS[i][1] }; };
  const ACTION_TOKENS = [T.EAT, T.PASS, T.REST];
  const encodeAction = a => { const t = ACTION_TOKENS[a]; if (t === undefined) throw new Error(`no such action ${a}`); return t; };
  // total and injective; an unknown token throws (B4)
  const decodeAction = tok => { const a = ACTION_TOKENS.indexOf(tok); if (a < 0) throw new Error(`not an action token: ${tok}`); return a; };
  // warnings are exact predicates of the bands (the lens may show them; they must be true of the world)
  const warningsOf = obs => {
    if (obs.down) return { HUNGRY: false, STARVING: false, WEAK: false, DOWN: true };
    const [e0, e1] = EB[obs.eBand], [h0, h1] = HB[obs.hBand], inside = (lo, hi, [a, b]) => lo >= a && hi <= b, outside = (lo, hi, [a, b]) => hi < a || lo > b;
    const w = {};
    for (const [name, rng, lo, hi] of [['HUNGRY', P.warnings.HUNGRY, e0, e1], ['STARVING', P.warnings.STARVING, e0, e1], ['WEAK', P.warnings.WEAK, h0, h1]]) {
      if (inside(lo, hi, rng)) w[name] = true; else if (outside(lo, hi, rng)) w[name] = false; else throw new Error(`warning ${name} is not an exact predicate of its band`);
    }
    return w;
  };
  const VIEW_KERNEL = Object.freeze(['the effect table', 'the season index and clock', 'the stage', 'exact E and H inside a band', 'the item while collapsed',
    'other valleys', 'the intensity', 'the fit label', 'the action outcome on a collapse tick']);
  return { T, V, NOBS, OBS0, ANS, encodeObs, decodeObs, project, encodeAnswer, decodeAnswer, encodeAction, decodeAction, warningsOf, VIEW_KERNEL, band };
}
