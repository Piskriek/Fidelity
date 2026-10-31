// Pass R28 pre-commit fixes from the fresh diff review (R28_diff_review.md, items 1–30).
// Usage: node patch_r28_review.mjs <repoDir>
import fs from 'node:fs';
import path from 'node:path';
const repo = process.argv[2];
const F = { P: 'FIDELITY_COMPLETE_BRS_V2.md', R: 'ARGON_OPUS_MASTER_RESUME_V2.md', S: 'SQ_DISTORTION_CHECK_V9_SKILL.md' };
const t = Object.fromEntries(Object.entries(F).map(([k, f]) => [k, fs.readFileSync(path.join(repo, f), 'utf8')]));
let n = 0;
function edit(k, a, b, { all = false } = {}) {
  const c = t[k].split(a).length - 1;
  if (all ? c < 1 : c !== 1) throw new Error(`${F[k]}: expected ${all ? '>=1' : '1'} match, found ${c}: ${a.slice(0, 80)}`);
  t[k] = all ? t[k].split(a).join(b) : t[k].replace(a, () => b);
  n++;
}

// 1, 24 — counts that drift every pass become count-free.
edit('R', '`BRS V2` (9/9 Parts; 37 open items in Part 8.1, proposals in 8.2, owner questions in 8.3)', '`BRS V2` (9/9 Parts; open items in Part 8.1, proposals in 8.2, Law of One rulings in 8.4)');
edit('R', '(`Checks C1–C33`, `#01–#173` encoded)', '(`Checks C1–C33`, the Plan\'s ledger encoded)');
edit('S', 'All logged defects (the Plan\'s Part 8 ledger, `#01–#158` as of Pass R27) encoded', 'All logged defects (the Plan\'s Part 8 ledger) encoded');
// 2
edit('S', 're-execute all 32 checks (`Checks C1–C33`;', 're-execute every check (`Checks C1–C33`;');
// 3
edit('R', '  - **Open, needs a decision:** `B100` PH integrator form', '  - **Open, needs a decision** (as of R27; R28 answered and closed `B102`, `B105`, `B110`, `B116`, `B133`, `B134`, `B135`)**:** `B100` PH integrator form');
// 4 — ledger rows show what later passes closed.
edit('P', '| **Pass R26 — Open (Owner/Argon Decision Needed)** | `B100–B117` (18 defects) | Design questions that editing text cannot settle. Detail: §8.1. | **OPEN** |', '| **Pass R26 — Open (Owner/Argon Decision Needed)** | `B100–B117` (18 defects) | Design questions that editing text cannot settle. Detail: §8.1. | 4 closed in R28 · 14 **OPEN** |');
edit('P', 'Proposals in §8.2; owner questions in §8.3. | **OPEN** |', 'Proposals in §8.2; owner questions in §8.3. | 3 closed in R28 · 8 **OPEN** |');
// 5, 6 — B102 is closed by the adopted eviction order; B103 is what still blocks.
edit('P', '- **Open (`B102`, `B103`)**: at full caps', '- **`B102` closed in R28** (eviction order adopted, §8.2 and §8.4 Q6); **`B103` still open**. At full caps');
edit('P', '| `B102` | Keep the 4096-byte limit', '| `B102` | **Adopted in R28 (§8.4 Q6).** Keep the 4096-byte limit');
edit('R', '`B102` (4 KB budget) and `B126` (soul cartridge fields) block Wave 2.', '`B103` (top-4 retention, which the adopted eviction order needs) and `B126` (soul cartridge fields) block Wave 2.');
// 7 — older forgiveness text follows the bilateral rule.
edit('P', 'resets that rival\'s score to 0 and recomputes', 'resets that rival\'s score to 0 (R28: only when both `selfForgave` and `otherForgave`; the `mc` becomes a scheduled correction quest rather than being deleted, §8.4 Q3) and recomputes');
edit('P', 'where choosing forgiveness heals `mc`/`mb`,', 'where forgiveness of self and other releases the grudge and the ache and turns the `mc` into a correction quest (§8.4 Q3),');
// 8, 17, 18 — one polarity rule, Ra's thresholds, FreeWillViolation's dependency.
edit('P', '`ΔH_symbiotic` raises `sto01`; free-will violations and unforgiven grudges lower it. `harvestReadiness` is evaluated only at cycle boundaries: `sto01 > 0.5` → positive 4D, `sts01 ≥ 0.95` → negative 4D, otherwise the entity repeats.',
  '`ΔH_symbiotic` raises `sto01` as `sto01 ← min(1 − sts01, sto01 + 0.18·ΔH)`, so the sum stays ≤ 1; free-will violations and unforgiven grudges lower it. `harvestReadiness` is evaluated only at cycle boundaries: `sto01 > 0.50` → positive 4D (17.31: more than half), `sts01 ≥ 0.95` → negative 4D (17.32: about 95% to self), otherwise the entity repeats. (The guide wrote the negative test as `sto01 ≤ 0.05`; that is the same only when `sto01 + sts01 = 1`.)');
edit('P', '(Argon: −0.22 · FreeWillViolation, −0.08 · UnforgivenGrudge). |', '(Argon: −0.22 · FreeWillViolation, −0.08 · UnforgivenGrudge); `FreeWillViolation` needs the consent check of `B165`. |');
edit('R', '(51% / 95%, sinkhole between)', '(> 50% to others or ≈ 95% to self, sinkhole between)');
// 9 — irradiance gets a distance floor and the plan's own symbol.
edit('P', '$E(\\mathbf{q}) = \\sum_k L_k / (4\\pi |\\mathbf{q}_{\\star,k} - \\mathbf{q}|^2)$, normalized by a reference irradiance.', '$E(\\mathbf{q}) = \\sum_k L_{x,k} / (4\\pi \\max(10^{-6}, |\\mathbf{q}_{\\star,k} - \\mathbf{q}|^2))$, normalized by a reference irradiance (design: the irradiance at 1 AU from a solar-luminosity star maps to 1.0).');
// 10 — ripple: wave-superposition wording.
edit('P', '& Multi-Star Wave Superposition (field: @hm/origin64, B45)|', '& Multi-Star Field, incoherent light (@hm/origin64, B45/B105)|');
edit('P', '+ multi-star wave superposition (`B45, B46, B65`)', '+ multi-star field with incoherent light (`B45, B46, B65`, `B105`)');
edit('P', 'Orbital Transfer & Wave Interference', 'Orbital Transfer & Incoherent Starlight');
// 11 — B162 gets its spec text; the H_circle consequence joins B157.
edit('P', 'ch=<r1..r7> inv=<0..1>', 'ch=<r1..r7> inv=<0..1>` (r1–r6: red-to-indigo lean; r7, violet, is the soul\'s constant identity signature, not an activatable lean: Ra 39.10, `B162`) `', );
edit('P', '| `B157` | **OPEN** | C6 | H_circle assumes rays in [0, 1], but `ch` rays are Int8 (±127); the scale map (e.g. clamp01(ch/127)) is unstated. |', '| `B157` | **OPEN** | C6 | H_circle assumes rays in [0, 1], but `ch` rays are Int8 (±127); the scale map (e.g. clamp01(ch/127)) is unstated. Since `B162`, H_circle should average r1–r6 and treat r7 as identity. |');
edit('P', 'weight-to-soul mapping, ray 7 role; S and y_in', 'weight-to-soul mapping; S and y_in');
// 12 — the opening no longer states the prototype figures as fact.
edit('P', 'harvesting **2,606 real mechanics** across 8 games and validating over **3,848 unit tests**.', 'reportedly harvesting **2,606 real mechanics** across 8 games and validating over **3,848 unit tests** (external historical context, not verifiable from this repo: §8.4 Q7).');
// 13, 14, 15, 21 — keep Ra's words apart from inference and design.
edit('P', 'co-created by sixth-density beings, with a ray spectrum (41.4–41.6, 40.3). |', 'co-created by sixth-density beings (41.4–41.6); a per-star ray spectrum is the guide\'s design suggestion, not Ra. |');
edit('P', 'The five support-crew tiers have no rules; Ra\'s helpers act only when called, within free will (51.1, 55.4). |', 'The five support-crew tiers have no rules. Ra describes harvest overseen by Guardians (51.1) and a contact that answers a call (55.4); "helpers act only when called" is an interpretation. |');
edit('P', 'and support crews that act only when called (`B171`)', 'and rules for the support crews (`B171`)');
edit('P', '(40.1, 28.15, 52.12, 78.10, 82.11). Ra has no civilization igniting a Logos; sixth-density beings co-create their star (41.4–41.6). |', '(40.1, 28.15, 52.12, 78.10, 82.11). Sixth-density beings co-create their star (41.4–41.6). |');
edit('P', 'Branch 7.3 child ignition stays as the owner\'s extension beyond Ra (`B161`).', 'Branch 7.3 child ignition stays as a design extension: nothing in Ra has a civilization ignite a Logos (guide\'s inference from the texts, `B161`).');
edit('P', '**Pass R28:** this is the owner\'s extension beyond Ra, which has no civilization igniting a Logos;', '**Pass R28:** this is a design extension beyond Ra (the guide found no passage where a civilization ignites a Logos);');
edit('P', 'not by time alone (Ra 34.4, 26.28–26.31); at most a slow drift on the Chronos tick.', 'not by time alone (design, in the spirit of Ra\'s karma-as-inertia, 34.4; Ra names no time-based release); at most a slow drift on the Chronos tick.');
// 16 — HarvestPacket is the only inherited state, not the only seed input.
edit('P', 'emit `HarvestPacket {archetypeBias, polarityHistogram, lessonDigest}`, the only input to a successor seed (`B104`).', 'emit `HarvestPacket {archetypeBias, polarityHistogram, lessonDigest}`, the only state a successor inherits. Both successor seeds and Branch 7.3 child seeds use the §8.2 `B104` hash (four floats, parent seed, packet digest, index).');
// 19, 20
edit('P', 'Physical scars persist, and an adversary works them (67.12–67.13, 77.24).', 'Physical scars persist and an adversary works existing distortions (67.12–67.13); scars need tending (77.24).');
edit('P', '| Whether a forgiven scar keeps full resistance (guide) or half (Argon). |', '| Whether a forgiven scar keeps full resistance (guide) or half (Argon); upkeep cost and exposure weight. |');
edit('P', 'P10 22 Archetypes (87.28)', 'P10 22 Archetypes (77.12–77.13; cross-wiring 87.28)');
// 22
edit('P', 'Mind Dominant', 'Mind attraction', { all: true });
edit('P', 'Body Dominant', 'Body attraction', { all: true });
// 23, 28
edit('S', '(**`Pass R27 — v9.3`**)', '(**`Pass R27 — v9.2`**)');
edit('S', 'On set C this was the only Haiku method to catch an inverted logic rule (Pass R28).', 'On set C it was the only Haiku method to catch an inverted logic rule (Pass R28, a single run: re-test with ≥ 3 runs before relying on it).');
edit('R', 'catch the inverted mask law (9.5/10).', 'catch the inverted mask law (9.5/10, a single run).');
// 25
edit('P', 'The owner questions that block progress are in Part 8.3.', 'The owner questions of Part 8.3 were answered from the Law of One texts in Part 8.4 (R28).');
edit('R', 'Owner questions that unblock the open items are in Plan §8.3.', 'The owner questions of Plan §8.3 were answered in Plan §8.4 (R28).');
// 26
edit('P', '| `B136` | **OPEN** | C31 | Missing units/ranges: ambient energy, thermal energy, STM capacity, lineage cap, child-universe bound, integrity unit, dose cap, town-tension unit. |', '| `B136` | **OPEN** | C31 | Missing units/ranges: ambient energy, thermal energy, STM capacity, lineage cap, child-universe bound, integrity unit, dose cap, town-tension unit. After R28: ambient, thermal and lineage bounds need design numbers; child-universe depth is bounded by `MAX_ACTIVE_OCTAVE_DEPTH` (§8.4 Q1). |');
// 27
edit('P', '+ **`@hm/studio-core`** + **`@hm/governor`** (`hw:` governor in hudlayout, `B123`)**:', '+ **`@hm/studio-core`** + **`@hm/governor`** (`hw:` governor in hudlayout, `B123`) + **`@hm/worldsave`** (once `B127` is decided)**:');
// 29 — canon-derived rows carry C33.
for (const id of ['B159', 'B160', 'B161', 'B162', 'B164', 'B165', 'B166', 'B167', 'B168', 'B169', 'B170', 'B171']) {
  const re = new RegExp(`^(\\| \`${id}\` \\| \\*\\*(?:FIXED|OPEN)\\*\\* \\| )([^|]+?)( \\|)`, 'm');
  if (!re.test(t.P)) throw new Error(`row ${id}`);
  t.P = t.P.replace(re, (_, a, c, b) => `${a}${c}/C33${b}`);
}
// 30 — the guide's recommendations that were neither adopted nor logged.
const regEnd = t.P.indexOf('\n## 8.2');
t.P = t.P.slice(0, regEnd).replace(/\n+$/, '') + '\n| `B174` | **OPEN** | C33 | Guide recommendations not yet decided: split `childUniverses` into `sunBodies` and `octaveSeeds` (R1.4); stage-dependent harvest thresholds (R2.3); seniority in incarnation (17.43, R2.6); S6 SMCs setting a star\'s `L_x` within bounds (R4.4); a polarized SQ-JEPA fixed point after The Choice instead of neutral Π₀ (77.16, 17.33). |\n' + t.P.slice(regEnd);
const st = t.P.match(/\*\*(\d+) Defects Logged \(`#01–#(\d+)`, Passes R1–R28\): (\d+) Closed \/ (\d+) Open\.\*\*/);
const L = +st[1] + 1, C = +st[3], O = +st[4] + 1;
t.P = t.P.replace(st[0], `**${L} Defects Logged (\`#01–#${L}\`, Passes R1–R28): ${C} Closed / ${O} Open.**`);
edit('P', `(\`R1 -> R28\`: ${st[1]} DEFECTS LOGGED — ${C} CLOSED, ${st[4]} OPEN)`, `(\`R1 -> R28\`: ${L} DEFECTS LOGGED — ${C} CLOSED, ${O} OPEN)`);
edit('P', '| **Pass R28 — Open (Law of One Mirror Links)** | `B165–B173` (9 defects) | Structures the Law of One has that the design lacks, plus two owner/Argon follow-ups. | **OPEN** |', '| **Pass R28 — Open (Law of One Mirror Links)** | `B165–B174` (10 defects) | Structures the Law of One has that the design lacks, two owner/Argon follow-ups, and the guide recommendations not yet decided (found by the R28 diff review). | **OPEN** |');
const rs = t.R.match(/\*\*(\d+) Defects Logged \(`#01–#(\d+)`, Passes R1–R28\): (\d+) Closed \/ (\d+) Open\.\*\*/);
t.R = t.R.replace(rs[0], `**${L} Defects Logged (\`#01–#${L}\`, Passes R1–R28): ${C} Closed / ${O} Open.**`);
edit('R', `(\`Passes R1 -> R28\`: ${rs[1]} Logged, ${rs[3]} Closed, ${rs[4]} Open)`, `(\`Passes R1 -> R28\`: ${L} Logged, ${C} Closed, ${O} Open)`);
t.R = t.R.split(`${rs[1]}-Defect Ledger`).join(`${L}-Defect Ledger`).split(`${rs[1]}-defect ledger synced`).join(`${L}-defect ledger synced`);
t.R = t.R.replace(`(Claude Opus 5.5; \`B159–B${rs[1]}\`)`, `(Claude Opus 5.5; \`B159–B${L}\`)`);

for (const [k, f] of Object.entries(F)) fs.writeFileSync(path.join(repo, f), t[k]);
console.log(`${n} edits; ledger ${L} logged, ${C} closed, ${O} open`);
