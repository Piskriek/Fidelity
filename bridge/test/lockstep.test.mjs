// Runner tests (written after mutant round 1 found the runner untested): the action port, felt pain staying off,
// minds seeing only their tokens, the oracle channel staying with oracles, and common random numbers.
//   node test/lockstep.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLife } from '../run/lockstep.mjs';
import { EAT, PASS, REST } from '../world/valleys.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(here, '..', 'preset', 'valleys_v1.json'), 'utf8'));
let failed = 0;
const check = (id, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? `  ${detail}` : ''}`); if (!ok) failed++; };
const TICKS = 600;

// a probe mind records exactly what it is given
function probe({ oracle = false, policy = (c, tok, u) => Math.min(2, Math.floor(u * 3)) } = {}) {
  const seen = { chooseArgs: [], feelArgs: [], us: [] };
  return {
    seen, oracle,
    choose(...args) { seen.chooseArgs.push(args.length); seen.us.push(args[2]); if (!oracle && args.length > 4 && args[4] !== undefined) seen.leakedTable = true; if (args.some(x => x && typeof x === 'object' && !Array.isArray(x))) seen.gotObject = true; return policy(...args); },
    feel(c, tok, facts) { seen.feelArgs.push(facts); },
  };
}

// R1: the port refuses anything that is not an action index (and the world never sees it)
{
  let threw = 0;
  for (const bad of [undefined, 1.5, '2', 3, -1, null, NaN]) {
    const m = { choose: () => bad, feel() {} };
    // it must be the port that refuses (its own message), not the world crashing on an untyped refusal
    try { runLife(P, { worldSeed: 1, minds: [m, m, m, m], ticks: 3 }); } catch (e) { if (/^action port:|no such action/.test(e.message)) threw++; }
  }
  check('R1 the action port refuses non-actions', threw === 7, `${threw} of 7 refused at the port`);
}

// R2/R3: felt pain stays off: facts carry only { gain, pain } and pain is always 0; feltPain cannot be turned on
{
  const m = probe(); runLife(P, { worldSeed: 2, minds: [m, m, m, m], ticks: TICKS });
  const keysOk = m.seen.feelArgs.every(f => Object.keys(f).sort().join(',') === 'gain,pain');
  const painZero = m.seen.feelArgs.every(f => f.pain === 0);
  let refused = false; try { runLife(P, { worldSeed: 2, minds: [m, m, m, m], ticks: 1, feltPain: true }); } catch { refused = true; }
  check('R2 felt pain is off: minds get { gain, pain: 0 } only, and feltPain cannot be enabled', keysOk && painZero && refused);
}

// R4/R5: a non-oracle mind gets exactly (c, token, u, t) and never the table or a snapshot, even beside an oracle
{
  const o = probe({ oracle: true }), a = probe(), b = probe(), c = probe();
  runLife(P, { worldSeed: 3, minds: [o, a, b, c], ticks: TICKS });
  const clean = [a, b, c].every(m => !m.seen.leakedTable && !m.seen.gotObject && m.seen.chooseArgs.every(n => n === 4)) && o.seen.chooseArgs.every(n => n === 5);
  check('R4/R5 non-oracle minds see only their tokens (no table, no snapshot), even beside an oracle', clean);
}

// R6: common random numbers depend only on (runSeed, character, tick), not on the mind or its history
{
  const a = probe({ policy: () => EAT }), b = probe({ policy: (c, tok) => (tok % 3) });
  runLife(P, { worldSeed: 4, minds: [a, a, a, a], ticks: TICKS });
  runLife(P, { worldSeed: 4, minds: [b, b, b, b], ticks: TICKS });
  const same = a.seen.us.length === b.seen.us.length && a.seen.us.every((u, i) => u === b.seen.us[i]);
  check('R6 common random numbers are the same for every arm', same);
}

// K1: the runner is deterministic: the same seeds and minds give the same final chain and actions
{
  const mk = () => { const m = probe(); return [m, m, m, m]; };
  const r1 = runLife(P, { worldSeed: 5, minds: mk(), ticks: TICKS }), r2 = runLife(P, { worldSeed: 5, minds: mk(), ticks: TICKS });
  check('K1 the runner is deterministic', r1.finalChain === r2.finalChain && JSON.stringify(r1.log.acts) === JSON.stringify(r2.log.acts));
}

if (failed) { console.log(`${failed} test(s) failed`); process.exitCode = 1; } else console.log('all runner tests pass');
