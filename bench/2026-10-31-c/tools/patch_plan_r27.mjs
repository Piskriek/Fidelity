// Pass R27 patch for FIDELITY_COMPLETE_BRS_V2.md: corrections to R26 text found by set-C arms,
// gap-map missing links (B118–B136), and the §8.2 proposals / §8.3 owner questions.
// Usage: node patch_plan_r27.mjs <FIDELITY_COMPLETE_BRS_V2.md>
import fs from 'node:fs';
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');
function edit(oldStr, newStr, { all = false } = {}) {
  const n = s.split(oldStr).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : '1'} match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = all ? s.split(oldStr).join(newStr) : s.replace(oldStr, () => newStr);
}

// --- Status + version ---
edit('**Convergence Status:** **117 Defects Logged (`#01–#117`, Passes R1–R26): 99 Closed / 18 Open.** Pass R26 (Claude Opus 5.5 independent audit + 9-arm Sonnet/Haiku benchmark, 2026-10-31) re-opened the R25 zero-yield claim: 43 new defects (`B75–B117`), 25 fixed in this revision, 18 waiting on an owner/Argon decision (Part 8.1).',
  '**Convergence Status:** **136 Defects Logged (`#01–#136`, Passes R1–R27): 107 Closed / 29 Open.** Pass R26 (Claude Opus 5.5 independent audit + 9 Sonnet/Haiku audit runs) re-opened the R25 zero-yield claim. Pass R27 corrected R26\'s own text, ran the Fractal Gap Map (`spine/`), and proposed fills for the open items (Part 8.2). The owner questions that block progress are in Part 8.3.');
edit('`sq-distortion-check` **v9.1** (_', '`sq-distortion-check` **v9.2** (_');
edit('and 31-Point Bug-Crawler `Checks C1–C31` + Document-Audit Mode_)', 'and 32-Point Bug-Crawler `Checks C1–C32` + Document-Audit Mode + Fractal Gap Map_)');
edit('ALL-PARTS CONSTITUTION & R1–R26 AUDITED EDITION', 'ALL-PARTS CONSTITUTION & R1–R27 AUDITED EDITION');

// --- B119, B120 ---
edit('unconditionally passive Cayley-Padé midpoint resolvent', 'Cayley-Padé midpoint resolvent (passive under the preconditions below; "unconditionally" removed in `B119`)');
edit('via strictly non-negative Kullback-Leibler Variational Free Energy', 'via Kullback-Leibler Variational Free Energy, non-negative for $\\Pi_i, \\Pi_{0,i} > 0$ (floor $10^{-3}$ as in the reference, `B120`),');

// --- B125 units ---
edit('dissipates `-25 J` from `somaticStrainJoules` (`-> 0 J`)', 'dissipates `-25 J` from `somaticStrainJoules` (`-> 0 J`; range $[0, 500]$ J, the reference clamp, `B125`)');

// --- B123 waves ---
edit('**`@hm/origin64`**, **`@hm/rules-litrpg`**, then **`@hm/sq-jepa`**)**:', '**`@hm/origin64`**, **`@hm/rules-litrpg`**, **`@hm/magic-indigo`**, **`@hm/alchemy-catalyst`**, **`@hm/class-forge`**, **`@hm/anim-taste`**, then **`@hm/sq-jepa`**)**:');
edit('- **Wave 5 — Wire **`apps/universe`** 4-Screen State Machine (**`stepUniverseAppStateMachine`** & **`WorkerMessageProtocol`**)**:', '- **Wave 5 — Wire **`apps/universe`** 4-Screen State Machine (**`stepUniverseAppStateMachine`** & **`WorkerMessageProtocol`**) + **`@hm/studio-core`** + **`@hm/governor`** (`hw:` governor in hudlayout, `B123`)**:');

// --- B124 operator homes ---
edit('| `@hm/groundshader` | `packages/groundshader` (Bucket A port) | Port Matrix, Bucket A |',
  '| `@hm/groundshader` | `packages/groundshader` (Bucket A port) | Port Matrix, Bucket A |\n\n**Operator homes (`B124`)**, deduced from what each operator touches: `stepBiologicalCompensatoryVent` → `@hm/somatic` (it drains somatic strain); `enqueueShortTermMemoryBurst` and `flushStmAndVentToLongTermMem` → `@hm/soul` (the flush writes `me` episodes; `preset-memory.ts` is the Bucket A source); `evaluateSimulatedMusicResonance` → `@hm/soul` (it changes a soul\'s excitement and precision), with `@hm/soundlab` supplying the ratios.');

// --- B118 benchmark wording ---
edit('| **Pass R26 (Claude Opus 5.5 Independent Audit + 9-Arm Cross-Tier Benchmark, 2026-10-31)**', '| **Pass R26 (Claude Opus 5.5 Independent Audit + 9-Run Cross-Tier Benchmark, 2026-10-31)**');
edit('Found by Claude Opus 5.5 plus 9 Sonnet/Haiku audit arms (union, each item checked by hand).', 'Found by Claude Opus 5.5 plus 9 Sonnet/Haiku audit runs (union, each item checked by hand).');
edit('Pass R26 ran the real experiment: 9 audit arms (Sonnet and Haiku × no skill / SQ skill v9 / Reduce skill) on a copy of this plan with 9 planted defects, plus a hold-out copy with 9 different plants.',
  'Pass R26 ran the real experiment: 9 audit runs, i.e. 6 arms (Sonnet and Haiku × no skill / SQ skill v9 / Reduce skill) on a copy of this plan with 9 planted defects, plus 3 Haiku arms on a hold-out copy with 9 different plants (`B118`). Pass R27 repeated it with 10 harder plants (set C): see `bench/2026-10-31-c/`.');

// --- B121, B122: corrections to the R26 register itself ---
edit('| `B82` | **FIXED** | C31 | p_atm unit unstated (atm vs Pa changes p_eff from 1.0 to 2.52) → atm. |', '| `B82` | **FIXED** | C31 | p_atm unit unstated (atm vs Pa changes p_eff from 1.0 to 2.51) → atm. |');
edit('| `B104` | **OPEN** | C18 | Child-universe seed ignores Vtx and Aq; ~1e7 values, so distinct parents collide. |', '| `B104` | **OPEN** | C18 | Child-universe seed ignores Vtx and Aq, and XOR of a ≤10-bit and a ≤14-bit integer yields only 10,240 distinct seeds, so distinct parents collide. |');

// --- Part 8 ledger heading + rows ---
edit('(`R1 -> R26`: 117 DEFECTS LOGGED — 99 CLOSED, 18 OPEN)', '(`R1 -> R27`: 136 DEFECTS LOGGED — 107 CLOSED, 29 OPEN)');
const R26_OPEN_ROW = '| **Pass R26 — Open (Owner/Argon Decision Needed)** | `B100–B117` (18 defects) | Design questions that editing text cannot settle. Detail: §8.1. | **OPEN** |';
edit(R26_OPEN_ROW, R26_OPEN_ROW + '\n' +
  '| **Pass R27 (Self-Correction + Fractal Gap Map + Set-C Benchmark)** | `B118–B125` (8 defects) | Errors in R26\'s own text found by the set-C arms (benchmark arithmetic, "unconditionally passive", seed count, rounding), KL positivity domain, wave naming, operator homes, strain range. | `triad_semantic_audit.mjs` + `fractal_gap_map.mjs --strict` |\n' +
  '| **Pass R27 — Open (Gap Map Missing Links)** | `B126–B136` (11 defects) | Holes the framework\'s own laws expose (save paths, call graph, lateral duals, units). Proposals in §8.2; owner questions in §8.3. | **OPEN** |');

const R27 = [
  ['B118', 'FIXED', 'C7', 'R26 called the benchmark "9 arms (Sonnet and Haiku × 3 methods)", which reads as 6; it was 6 arms on set A + 3 Haiku arms on hold-out set B.'],
  ['B119', 'FIXED', 'C7', '"Unconditionally passive" contradicted the passivity preconditions added in B80.'],
  ['B120', 'FIXED', 'C31', 'KL term is only defined (and ≥ 0) for Π_i, Π_0,i > 0; domain and floor now stated.'],
  ['B121', 'FIXED', 'C31', 'The R26 register said the child seed has ~1e7 values; it has 10,240 (found independently by two set-C arms).'],
  ['B122', 'FIXED', 'C31', 'The R26 register said 101325^0.08 = 2.52; it is 2.51.'],
  ['B123', 'FIXED', 'C8/C23', 'magic-indigo, alchemy-catalyst and class-forge were named in Resume waves but only as prose in the Plan; anim-taste, studio-core and the governor were in no wave.'],
  ['B124', 'FIXED', 'C8', 'Four operators had no home package (vent, STM enqueue/flush, music resonance).'],
  ['B125', 'FIXED', 'C31', 'somaticStrainJoules had no stated range (reference clamps at 500 J).'],
  ['B126', 'OPEN', 'C12/C22', 'The soul cartridge cannot carry the soul: no shorthand line holds the Four Floats, the archetype, or vital/strain/debt/doses, so they are lost between sessions (logging out clears recovery debt).'],
  ['B127', 'OPEN', 'C12', 'No world, player or host save format: town tension, ambient energy, child universes, lineages, pins, 4D progress and reputation have nowhere to persist.'],
  ['B128', 'OPEN', 'C8/C12', 'No call graph or tick order: 15 of 18 packages have no named caller and 17 of 18 no named supplier.'],
  ['B129', 'OPEN', 'C5/C12', 'Ambient energy is drained (Indigo draws 85%) and never regenerated.'],
  ['B130', 'OPEN', 'C12/C20', 'Precision Π can only fall (annealing); nothing raises it, so distortions are cured but never acquired.'],
  ['B131', 'OPEN', 'C12/C20', 'Excitement only rises (breadcrumbs, music) and never decays.'],
  ['B132', 'OPEN', 'C12/C20', 'Town tension only rises; no decay or release.'],
  ['B133', 'OPEN', 'C12/C20', 'Child universes only increase, with no harvest/closure and no depth bound.'],
  ['B134', 'OPEN', 'C20', '4D progress can only rise: confirm whether a player can regress.'],
  ['B135', 'OPEN', 'C20', 'Scar resistance only rises (capped at 0.85): confirm scars are permanent by design.'],
  ['B136', 'OPEN', 'C31', 'Missing units/ranges: ambient energy, thermal energy, STM capacity, lineage cap, child-universe bound, integrity unit, dose cap, town-tension unit.'],
];
const regEnd = s.indexOf('\n\n# PART 9:');
if (regEnd < 0) throw new Error('register end not found');
s = s.slice(0, regEnd) + '\n' + R27.map(([id, st, c, d]) => `| \`${id}\` | **${st}** | ${c} | ${d} |`).join('\n') + s.slice(regEnd);

const PROPOSALS = [
  '',
  '## 8.2 Missing-Link Proposals (Pass R27 — PROPOSED, owner/Argon to confirm)',
  'Each fill is deduced from parts the plan already has: a hole on one axis is filled from its neighbours on the others. Generated hole list: `spine/GAP_MAP.md` (`node scripts/fractal_gap_map.mjs`).',
  '',
  '| ID | Proposed fill | Deduced from |',
  '|---|---|---|',
  '| `B129` + `B107` | Ambient energy regenerates from stellar flux each tick, $\\dot E_{\\text{ambient}} = \\eta\\, L_{x,\\text{local}} - \\lambda E_{\\text{ambient}}$, capped at $E_{\\text{ambient,max}}$. The rest cycle\'s +30 J is drawn from it (like Indigo\'s 85/15), so conservation closes. | Spider 2.3 "Trophic Stellar-to-Core Energy Cascade" (the supplier below) + `v2MultiStarField` luminosity + the plan\'s own conservation law |',
  '| `B130` | Catalyst surprise raises precision: on prediction error above threshold, $\\Pi \\leftarrow \\min(\\Pi_{\\max}, \\Pi(1 + \\kappa|\\varepsilon|))$; the SQ antidotes anneal it back to $\\Pi_0$. | Skill 1.5 ("distortions are over-clamped precision"), Archetype #3 Catalyst / Left receptive channel |',
  '| `B131` + `B114` | Excitement habituates: `ex` decays toward its baseline with time constant τ_ex; every boost is clamped to [0, 1]. | KL/JEPA framing: excitement tracks surprise, which falls as μ learns |',
  '| `B132` + `B114` | Town tension is a fraction in [0, 1]. It decays daily on the Chronos tick, $T \\leftarrow T(1 - \\lambda_{\\text{day}})$, and drops on funerals and peace telegrams. | Spider 5.3 Chronos Loop (Morning SitRep) + the existing peace-telegram dual for grudges |',
  '| `B126` | Add one shorthand line, `ms s=<pxd,vtx,lx,aq> arch=<1..22> vital=<5..100> strain=<0..500> debt=<0..64> doses=<0..7>` (~90 bytes). It is always kept and never evicted. | Skill C22 ("Four-Float + 22-Archetype soul cartridge"); the shorthand is the only cartridge format |',
  '| `B102` | Keep the 4096-byte limit and add an eviction order when a record is over it: oldest `mc open=0` → oldest non-top-4 `me` → lowest-grudge `nem` → … `m`, `ms`, the top-4 `me` and the tail are never evicted. A4 measures size after eviction. | Axis 2 ("coalescing without dropping critical signals") + the MDL sieve |',
  '| `B127` | World Ledger: `{ genesisSeed, events[], snapshots[] }`. World state is the seed replayed through the event log, with snapshots for speed. Player progress lives in the GameBridge checked profile; reputation lives in the host SDK. | C18 seed-replay invariance already requires determinism, so seed + events is enough; 4.5 Causal Fork / Live Catalyst already treats catalysts as events |',
  '| `B128` | Tick order. **Frame (60 Hz):** input → soul/somatic → nemesis → origin64 + multi-star → taste/render. **Cohort tick:** `stepLodPopulationTick`. **Day (Chronos):** decays, quests, funerals. **Eon (worker):** `runHeadlessEonGenesis` → strata burial. **Session end:** `formatShorthandRecordV2` (with eviction) + World Ledger append. | Wave 5 state machine + `WorkerMessageProtocol` + the existing time gears (2.1) |',
  '| `B104` | Seed = FNV-1a over the four floats quantized to 1e-4, plus the parent seed and the child index. | C18 (distinct seeds must diverge) |',
  '| `B111` | Canonical origin: local ∈ [−256, 256) m. When \\|local\\| ≥ 256, move 512 m into orbital; when \\|orbital\\| ≥ 65,536, carry into the sector. Clamp the sector at ±(2^63 − 1) with an error flag. | The 2^17 / 2^9 commensurate design |',
  '| `B109` | Measure V in rest cycles still needed: $V = \\text{strain}/25\\,\\text{J} + \\text{debt} + \\text{grudge}$. Each rest cycle lowers V by ≥ 1 while V > 0, so C20 is a one-line proof. | The rest-cycle rates (−25 J, −1 debt) |',
  '| `B100` | Use the discrete-gradient implicit midpoint, $x^{k+1} = x^k + \\Delta t\\,(J - R)\\,\\bar\\nabla H(x^k, x^{k+1}) + \\Delta t\\, G u$. Then $H^{k+1} - H^k \\le \\Delta t\\, u^T y$ exactly; the Cayley form is exact only for quadratic H. | Part 1 §1.1 preconditions (B80) |',
  '| `B106` | One regime with a blend: $S = \\text{lerp}(S_{0G}, S_{\\text{planet}}, \\text{smoothstep}(0.02, 0.08, g))$, g in m/s². | Removes the discontinuity without losing either model |',
  '| `B113` | STM capacity 64. Same-catalyst events coalesce (MDL); items with `ex ≥ 0.9` or `mc open=1` are never shed; overflow sheds the lowest `ex`. | Axis 2 + the 0.4 dose governor style |',
  '| `B117` | Scan code identifiers only, with `/\\bmoon_crater\\b|\\bA4-01\\b|\\.glb\\b|\\bleaks?_/`. | Removes the English-word false positives |',
  '| `B136` | town tension ∈ [0, 1]; integrity ∈ [0, 1]; doses capped at 7 (debt saturates at n = 7); STM 64. Ambient, thermal, lineage and child-universe bounds wait on §8.3. | Values already implied by neighbouring formulas |',
  '',
  '## 8.3 Questions for the Owner (the "dark room" — answers unblock the open items)',
  '1. **Do universes end?** Is there a harvest/closure for a child universe, and is nesting depth bounded? (`B133`, also bounds `B136`)',
  '2. **Can a player\'s 4D progress go down?** (`B134`)',
  '3. **Are nemesis scars permanent?** (`B135`)',
  '4. **Starlight:** is "coherent" starlight intended as a magical carrier-wave layer, or should light behave physically (incoherent)? (`B105`)',
  '5. **The 20 Pillars:** which twenty? (`B116`)',
  '6. **Cartridge budget:** keep 4 KB with the §8.2 eviction order, or raise it? (`B102`)',
  '7. **Prototype access:** where is the prototype repo (`feat/studio-polish-claude-cloud`), so the 3,848-test and 2,606-mechanic claims can be verified? (`B110`)',
  '',
].join('\n');
edit('\n\n# PART 9:', PROPOSALS + '\n# PART 9:');

// --- Part 9 + remaining ranges ---
edit('(BRS V2 + SQ-DISTORTION-CHECK V9.1)', '(BRS V2 + SQ-DISTORTION-CHECK V9.2)');
edit('1. Load `sq-distortion-check` v9.1 (Document-Audit Mode,', '1. Load `sq-distortion-check` v9.2 (Document-Audit Mode, Fractal Gap Map,');
edit('and 31-Point Verification Matrix Checks C1-C31).', 'and 32-Point Verification Matrix Checks C1-C32).');
edit('then apply `sq-distortion-check` v9.1 (Checks C1-C31)', 'then `node scripts/fractal_gap_map.mjs --strict`, then apply `sq-distortion-check` v9.2 (Checks C1-C32)');
s = s.split('\n').map(l => l.startsWith('| **Pass R25') ? l : l.replaceAll('Checks C1–C31', 'Checks C1–C32').replaceAll('(v9.1, Checks C1–C32)', '(v9.2, Checks C1–C32)')).join('\n');
fs.writeFileSync(file, s);
console.log('plan patched for Pass R27');
