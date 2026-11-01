// World tests (BRIDGE_DESIGN.md §2, §5; ids from the design, W1-W6 defined here per critique finding 10).
//   node test/world.test.mjs            prints one line per test and exits non-zero on any failure
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash32 } from '../world/hash.mjs';
import { createWorld, step, canAct, stateBytes, snapshot, itemAt, seasonTable, lowerIntensity, EAT, PASS, REST, A, ANSWERS } from '../world/valleys.mjs';
import { createLedger, record, replay } from '../world/ledger.mjs';
import { createEnergyLedger } from '../vendor/wave0_reference.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
let failed = 0;
const check = (id, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? `  ${detail}` : ''}`); if (!ok) failed++; };

// scripted policies (deterministic, no Math.random)
const randomPolicy = salt => (w, v) => hash32(0xbeef, salt, v, w.t) % 3;
const greedy = (w, v) => (w.item[v] ? EAT : w.H[v] < P.body.Hmax && w.E[v] > 0 ? REST : PASS);
const run = (seed, policy, ticks, { ledger = null } = {}) => {
  const w = createWorld(P, seed), outs = [];
  for (let t = 0; t < ticks; t++) {
    const acts = [...Array(P.valleys)].map((_, v) => policy(w, v));
    outs.push(step(w, acts));
    if (ledger) record(ledger, w, acts);
  }
  return { w, outs };
};

// D0: the world's code reads no clock, no ambient randomness, no timers, no environment
{
  // mutant round 1: crypto randomness and the runner were outside the scan
  const banned = [/Math\.random/, /\bDate\b/, /performance\./, /process\.hrtime/, /setTimeout|setInterval|setImmediate/, /process\.env/, /\bos\./, /require\(/, /random(Bytes|UUID|Int|Fill)|getRandomValues|crypto\.random/];
  const files = ['world/hash.mjs', 'world/valleys.mjs', 'world/ledger.mjs', 'bridge/tokens.mjs', 'run/lockstep.mjs'];
  const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'); // comments may name what is banned
  const hits = files.flatMap(f => { const src = code(fs.readFileSync(path.join(here, '..', f), 'utf8')); return banned.filter(rx => rx.test(src)).map(rx => `${f}: ${rx}`); });
  check('D0 no clocks, randomness, timers or environment in the world, the tokens or the runner', hits.length === 0, hits.join('; '));
}

// D9: golden chains, so the same seed and actions give the same world in every process and on every machine
// (recorded on the laptop and the PC on 2026-11-01, D2)
{
  const pol = (w, v) => hash32(0xbeef, 1, v, w.t) % 3, w = createWorld(P, 1);
  for (let t = 0; t < 10000; t++) step(w, [...Array(P.valleys)].map((_, v) => pol(w, v)));
  check('D9 golden chain (seed 1, scripted actions, 10,000 ticks)', w.chain === 'ae98c0c366f8d987fcf82e59e0d5db197beb19271c256d5c2ede24b6f22a7bcb', w.chain.slice(0, 16));
}

// D1c: replay refuses a changed preset, even under the same name
{
  const ledger = createLedger(P, 7); run(7, randomPolicy(1), 300, { ledger });
  const P2 = JSON.parse(JSON.stringify(P)); P2.values.gain.FED = 4;
  const r = replay(P2, ledger);
  check('D1c replay refuses a changed preset with the same name', !r.ok && /preset/.test(r.reason || ''), r.reason || 'accepted');
}

// D1: replay from (seed, action log) reproduces the hash chain exactly
{
  const ledger = createLedger(P, 7);
  const a = run(7, randomPolicy(1), 5000, { ledger });
  const r = replay(P, ledger);
  check('D1 replay reproduces the chain', r.ok && r.finalChain === a.w.chain, r.reason || `final ${a.w.chain.slice(0, 12)}`);
  const ledger2 = { ...ledger, actions: [...ledger.actions] }; ledger2.actions[3000] ^= 1;
  const r2 = replay(P, ledger2);
  check('D1b a changed action is caught at the next checkpoint', !r2.ok && r2.firstBadCheckpoint === 3072, r2.reason || 'not caught');
}

// D8: same seed, same actions -> identical chain on two fresh worlds; different seed -> different chain
{
  const a = run(11, greedy, 3000), b = run(11, greedy, 3000), c = run(12, greedy, 3000);
  check('D8 same inputs give the same chain; another seed gives another', a.w.chain === b.w.chain && a.w.chain !== c.w.chain);
}

// W1: every refusal is typed, canAct agrees with what the tick does, nothing is clamped or replaced
{
  const w = createWorld(P, 3); let bad = 0, n = 0;
  for (let t = 0; t < 4000; t++) {
    const acts = [...Array(P.valleys)].map((_, v) => hash32(9, v, t) % 3);
    const pre = acts.map((a, v) => canAct(w, v, a));
    const o = step(w, acts);
    o.forEach((x, v) => {
      n++;
      const name = ANSWERS[x.answer];
      if (!pre[v].ok && name !== pre[v].code && name !== 'COLLAPSE') bad++;      // a refusal must come back as its own code
      if (pre[v].ok && name.startsWith('ERR_')) bad++;                         // an accepted action is never answered as refused
    });
  }
  check('W1 refusals are typed and match canAct', bad === 0, `${bad} mismatches in ${n}`);
  const w2 = createWorld(P, 3); w2.H[0] = P.body.Hmax; w2.E[0] = 0; // canAct only reads; no tick runs on this world
  check('W1b ERR_FULL takes precedence over ERR_SPENT', canAct(w2, 0, REST).code === 'ERR_FULL');
}

// W2: the schedule is outside any character's control: items and seasons do not depend on actions
{
  const a = run(5, randomPolicy(1), 3000), b = run(5, randomPolicy(2), 3000);
  const sameItems = [...Array(P.valleys)].every((_, v) => a.w.item[v] === b.w.item[v]) && itemAt(5, 2, 1234) === itemAt(5, 2, 1234);
  check('W2 items and seasons do not depend on actions', sameItems && a.w.s === b.w.s && a.w.seasonEnd === b.w.seasonEnd && JSON.stringify(a.w.table) === JSON.stringify(b.w.table));
  let noNourish = 0, sharedKinds = 0, kinds = 0;
  for (let s = 0; s < 400; s++) { const st = seasonTable(P, 5, s); if (!st.tab.every(r => r.includes(0))) noNourish++; sharedKinds += st.shared.reduce((x, y) => x + y, 0); kinds += P.kinds; }
  check('W2b every valley has a NOURISH kind every season', noNourish === 0, `shared kinds ${(sharedKinds / kinds).toFixed(2)} (design: about 1/2 before the redraw rule)`);
}

// W3: the energy books close exactly every tick (step throws otherwise); a tampered book is caught
{
  let ok = true; try { run(8, randomPolicy(3), 6000); } catch { ok = false; }
  const w = createWorld(P, 8); w.E[1] += 1; // energy minted outside any port
  let caught = false; try { step(w, [PASS, PASS, PASS, PASS]); } catch (e) { caught = /do not close/.test(e.message); }
  check('W3 energy books close every tick; minted energy is caught', ok && caught);
}

// W3b: energy reconstructs from the books with the preset's birth energy (not the stored opening balance),
// and the opening balance never changes (mutant round 1: a collapse could rewrite it and hide destroyed energy)
{
  const w = createWorld(P, 8); let bad = 0, rebased = 0;
  for (let t = 0; t < 8000; t++) {
    step(w, [...Array(P.valleys)].map((_, v) => hash32(55, v, t) % 3));
    for (let v = 0; v < P.valleys; v++) {
      if (w.stored0[v] !== P.body.birthE) rebased++;
      if (w.E[v] !== P.body.birthE + w.books[v].inflow() - w.books[v].thermal()) bad++;
    }
  }
  check('W3b energy = birth + inflow - heat, and the opening balance never moves', bad === 0 && rebased === 0, `${bad} mismatches, ${rebased} rebases`);
}

// W4: stage only rises, by at most one per season end, never in a season with a collapse
{
  const w = createWorld(P, 21); let fell = false, jumped = false, risenWithCollapse = false;
  let prev = [...w.stage], collapsedThisSeason = new Array(P.valleys).fill(false), s0 = w.s;
  for (let t = 0; t < 20000; t++) {
    const acts = [...Array(P.valleys)].map((_, v) => (v === 3 ? (hash32(4, t) % 3) : greedy(w, v)));
    const o = step(w, acts);
    o.forEach((x, v) => { if (x.answer === A.COLLAPSE) collapsedThisSeason[v] = true; });
    for (let v = 0; v < P.valleys; v++) {
      if (w.stage[v] < prev[v]) fell = true;
      if (w.stage[v] > prev[v] + 1) jumped = true;
      if (w.stage[v] > prev[v] && w.s === s0) jumped = true;
    }
    if (w.s !== s0) {
      for (let v = 0; v < P.valleys; v++) if (collapsedThisSeason[v] && w.stage[v] > prev[v]) risenWithCollapse = true;
      collapsedThisSeason.fill(false); s0 = w.s;
    }
    prev = [...w.stage];
  }
  check('W4 stage only rises, one step per season end, never after a collapse', !fell && !jumped && !risenWithCollapse, `stages ${[...w.stage].join(',')}`);
}

// W5: canAct is pure (the state bytes do not change); snapshots cannot write the world
{
  const w = createWorld(P, 2); for (let t = 0; t < 50; t++) step(w, [EAT, REST, PASS, EAT]);
  const before = stateBytes(w, [0, 0, 0, 0]).toString('hex');
  for (let v = 0; v < P.valleys; v++) for (const a of [EAT, PASS, REST, 7]) canAct(w, v, a);
  const snap = snapshot(w); let wrote = false;
  try { snap.valleys[0].E = 99; } catch { /* frozen */ }
  if (w.E[0] === 99) wrote = true;
  check('W5 canAct is pure and snapshots are read-only', stateBytes(w, [0, 0, 0, 0]).toString('hex') === before && !wrote);
  // W5b: the snapshot carries only the declared fields (no effect table, nothing nested that reaches the world)
  const topKeys = Object.keys(snap).sort().join(','), vKeys = Object.keys(snap.valleys[0]).sort().join(',');
  let nestedWrite = false;
  for (const val of [...Object.values(snap), ...Object.values(snap.valleys[0])]) if (val && typeof val === 'object' && !Object.isFrozen(val) && val !== snap.valleys[0].fear) nestedWrite = true;
  check('W5b the snapshot has only the declared fields and no live nested world state', topKeys === 'chain,s,seasonEnd,t,valleys' && vKeys === 'E,H,down,ell,fear,item,loopBreaks,stage' && !nestedWrite, `${topKeys} | ${vKeys}`);
}

// W6: collapse, protective rest and the loop-break behave as declared
// (setBody re-opens the valley's energy books at the new balance, so the books still close)
const setBody = (w, v, E, H) => { w.E[v] = E; w.H[v] = H; w.stored0[v] = E; w.books[v] = createEnergyLedger(); };
{
  const w = createWorld(P, 31); setBody(w, 0, 0, 1); // starving at H 1: metabolism takes H to 0
  const o = step(w, [PASS, PASS, PASS, PASS]);
  const c1 = o[0].answer === A.COLLAPSE && w.down[0] === P.collapse.downTicks && o[0].pain === P.values.pain.COLLAPSE && o[0].cause === 'hunger';
  let wake = true;
  for (let k = 0; k < P.collapse.downTicks; k++) { const x = step(w, [EAT, PASS, PASS, PASS]); if (x[0].answer !== A.ERR_DOWN) wake = false; }
  const woke = w.down[0] === 0 && w.H[0] === P.collapse.downTicks;
  // the same cause three times in one life lowers intensity once
  const w2 = createWorld(P, 31); let fires = 0;
  for (let i = 0; i < 3; i++) { setBody(w2, 0, 0, 1); w2.down[0] = 0; step(w2, [PASS, PASS, PASS, PASS]); }
  fires = w2.loopBreaks[0];
  check('W6 collapse, protective rest (wakes at H 8) and the loop-break', c1 && wake && woke && fires === 1 && w2.ell[0] === P.loopBreak.intensityAfter, `ell ${w2.ell[0]}, fires ${fires}`);
}

// W7: intensity only goes down within a life (owner ruling: higher selves bring pain down, never push it up)
{
  let rose = false, lowered = 0;
  for (const seed of [41, 42, 43]) {
    const w = createWorld(P, seed); let prev = [...w.ell];
    for (let t = 0; t < 16384; t++) {
      step(w, [...Array(P.valleys)].map((_, v) => hash32(seed, v, t) % 3));
      for (let v = 0; v < P.valleys; v++) { if (w.ell[v] > prev[v]) rose = true; if (w.ell[v] < prev[v]) lowered++; }
      prev = [...w.ell];
    }
  }
  const src = fs.readFileSync(path.join(here, '..', 'world', 'valleys.mjs'), 'utf8').replace(/\/\/.*$/gm, '');
  const writes = (src.match(/\.ell\[[^\]]+\]\s*=(?!=)/g) || []).length; // assignments to ell outside creation
  check('W7 intensity never rises within a life; only lowerIntensity writes it', !rose && writes === 1, `lowered ${lowered} times in 3 random lives; ${writes} assignment(s) in the engine`);
  // W7b: called directly, lowerIntensity refuses to raise or keep, and only lowers (mutant round 1)
  const w = createWorld(P, 44), start = w.ell[0];
  const up = lowerIntensity(w, 0, start + 1), same = lowerIntensity(w, 0, start), afterUp = w.ell[0];
  const down = lowerIntensity(w, 0, start - 1);
  check('W7b lowerIntensity never raises or keeps; it only lowers', up === false && same === false && afterUp === start && down === true && w.ell[0] === start - 1);
}

// speed: scripted minds, a bare world
{
  const t0 = process.hrtime.bigint(); run(1, greedy, 200000); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  check('S1 speed (scripted minds)', ms < 60000, `${(200000 / (ms / 1000)).toFixed(0)} ticks/s`);
}

if (failed) { console.log(`${failed} test(s) failed`); process.exitCode = 1; } else console.log('all world tests pass');
