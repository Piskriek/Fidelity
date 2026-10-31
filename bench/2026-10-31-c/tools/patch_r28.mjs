// Pass R28: Law of One mirror (Sonnet guide, ~120 verified citations; 8 spot-checked by Opus) +
// Argon's Overwatch rulings (checked; one citation correction rejected) + the why= finding.
// Usage: node patch_r28.mjs <repoDir> <timestamp>
import fs from 'node:fs';
import path from 'node:path';
const [repo, ts] = process.argv.slice(2);
const F = { P: 'FIDELITY_COMPLETE_BRS_V2.md', R: 'ARGON_OPUS_MASTER_RESUME_V2.md', S: 'SQ_DISTORTION_CHECK_V9_SKILL.md' };
const t = Object.fromEntries(Object.entries(F).map(([k, f]) => [k, fs.readFileSync(path.join(repo, f), 'utf8')]));
function edit(k, a, b) {
  const n = t[k].split(a).length - 1;
  if (n !== 1) throw new Error(`${F[k]}: expected 1 match, found ${n}: ${a.slice(0, 80)}`);
  t[k] = t[k].replace(a, () => b);
}
const all = (k, a, b) => { t[k] = t[k].split(a).join(b); };

// ---------------- PLAN: corrections Ra gives directly ----------------
edit('P', '`SPIRAL_3_WALL_OF_LIGHT` (`0.80`).', '`SPIRAL_3_ENERGIZING` (`0.80`). Ra names the three pyramid spirals study and healing, building, and energizing (58.23); the "wall of light" is a separate protective working (72.17) (`B159`).');
edit('P', '**Law of One Grounding:** Sessions 6.1, 18.3, 19.22, 25.1, 26.38, 26.40, 39.10, 47.8, 58.23, 72.17', '**Law of One Grounding:** Sessions 6.1, 18.3, 19.22, 25.1, 26.38, 26.40, 39.10, 47.8, 58.23, 72.17. Checked in Pass R28 (`B160`): 6.1, 26.40, 39.10 and 47.8 support what Part 6 uses them for; 18.3, 19.22, 25.1, 26.38, 58.23 and 72.17 support only the vital-energy cost or are loosely related. The spore\'s Veil-thinning and ego-hardness effects, and the extension of 26.40\'s single doubling to `2^min(6, n-1)`, are design, not Ra');
edit('P', '- **Cross-Wired Gender Polarity (Ra Session 87.28)**:', '- **Cross-Wired Gender Polarity (Ra Session 87.28; checked in R28)**: Ra says each pole is *attracted to* these archetypes, not dominated by them; the weights below are design (`B164`, `B156`).');
edit('P', 'Surviving or rebuilding without STO forgiveness grafts', 'Surviving or rebuilding grafts (on survival, regardless of forgiveness; forgiveness acts on the grudge, not the scar: §8.4 Q3)');
edit('P', '*Open (`B105`):* real stars are mutually incoherent (intensities add), and $L_{x,\\text{coherent}}$ has units of m⁻² with no normalization into the Four-Float range.',
  '**Superseded in Pass R28 (`B105`):** starlight sums incoherently, $E(\\mathbf{q}) = \\sum_k L_k / (4\\pi |\\mathbf{q}_{\\star,k} - \\mathbf{q}|^2)$, normalized by a reference irradiance. Coherence is a property of a focusing device or working (pyramid, Indigo spiral) and feeds `@hm/magic-indigo`, never stellar physics (§8.4 Q4).');
edit('P', '+ 0.18 \\Delta H_{\\text{symbiotic}})$$\n- **Recursive Child-Universe Ignition', '+ 0.18 \\Delta H_{\\text{symbiotic}})$$ **Pass R28:** this term now raises `sto01`; progress is the two-sided polarity state, tested at cycle ends (§8.4 Q2).\n- **Recursive Child-Universe Ignition');
edit('P', 'ignites a child universe seed (`((round(1000*Pxd) ^ round(10000*Lx) ^ 0x4D4E4557) >>> 0)`) at `S0a`.', 'ignites a child universe seed (`((round(1000*Pxd) ^ round(10000*Lx) ^ 0x4D4E4557) >>> 0)`) at `S0a`. **Pass R28:** this is the owner\'s extension beyond Ra, which has no civilization igniting a Logos; Ra\'s nearest analog is sixth-density beings co-creating their star (41.4–41.6). Closure follows Ra\'s octave wrap (§8.4 Q1, `B161`).');
edit('P', '**Document ID:** `BRS-FIDELITY-V2-PART-7`**Target Packages in New Repo:** `@hm/kernel`, `@hm/sq-jepa`, `@hm/alchemy-catalyst`, `@hm/class-forge`, `@hm/universe-bridge`',
  '**Document ID:** `BRS-FIDELITY-V2-PART-7`**Target Packages in New Repo:** `@hm/kernel`, `@hm/sq-jepa`, `@hm/alchemy-catalyst`, `@hm/class-forge`, `@hm/universe-bridge`\n## 0. The Twenty Pillars (design list by Overwatch, Pass R28; Ra lists no set of twenty, `B116`)\nP01 Four Floats · P02 Port-Hamiltonian Solver · P03 VFE/KL Loss · P04 SQ-JEPA Rollout · P05 Log-Bijective Elements · P06 VSA-4096 Entanglement · P07 Eon Speciation & 6-Pin Sieve · P08 Strata Ruins · P09 4-Gate Taste & 3D Torque · P10 22 Archetypes (87.28) · P11 14-Zone Somatic Syncope · P12 enRAGE Nemesis & Scars · P13 Conlang & 3-Tier Voice · P14 BigInt64 2^17 m Origin · P15 Multi-Star Field · P16 Indigo Shuttle · P17 EZ Water, Alchemy & Rest Dual · P18 Kuramoto Music & 5 Crew Tiers · P19 STM MDL Queue & Mucosal Vent · P20 Cross-Universe Symbiotic Bridge.');
edit('P', '- **Audit A2 & A3 (4-Fold Signature & Non-Coercion)**: Requires all 4 internal folds and `coerciveOverride !== true`.', '- **Audit A2 & A3 (4-Fold Signature & Non-Coercion)**: Requires all 4 internal folds, and rejects any cartridge whose `coerciveOverride` is present with any value other than boolean `false`. The old test `coerciveOverride !== true` let the string `"true"` or `1` through (fail-closed fix, `B163`).');

// §8.2 refinements from the mirror.
edit('P', 'It decays daily on the Chronos tick, $T \\leftarrow T(1 - \\lambda_{\\text{day}})$, and drops on funerals and peace telegrams.', 'It is released by events (funerals, peace telegrams, restitution), not by time alone (Ra 34.4, 26.28–26.31); at most a slow drift on the Chronos tick.');
edit('P', 'so each dual strictly lowers V on its own term (C20).', 'so each dual strictly lowers V on its own term (C20). Forgiveness halts the inertia but leaves a correction pending (Ra 71.7), which the quest generator schedules.');
edit('P', 'plus the parent seed and the child index.', 'plus the parent seed, the parent\'s HarvestPacket digest (Ra 78.10, 82.11) and the child index.');
edit('P', '`ms s=<pxd,vtx,lx,aq> arch=<1..22> vital=<5..100> strain=<0..500> debt=<0..64> doses=<0..7> hp=<0..1>` (~100 bytes; `hp` added when the regrown map showed integrity still had no seam)', '`ms s=<pxd,vtx,lx,aq> arch=<mind,body,spirit> pol=<sto01,sts01> vital=<5..100> strain=<0..500> debt=<0..64> doses=<0..7> hp=<0..1>` (~125 bytes; `hp` added when the regrown map showed integrity still had no seam; R28: `arch` carries three dominant biases instead of one id, and `pol` the two-sided polarity, §8.4)');

// §8.3 → §8.4 answers.
edit('P', 'so the 3,848-test and 2,606-mechanic claims can be verified? (`B110`)\n', 'so the 3,848-test and 2,606-mechanic claims can be verified? (`B110`)\n\nAll seven are answered in §8.4 (Pass R28). The owner directed that the answers come from the Law of One texts.\n');
const S84 = [
  '',
  '## 8.4 Law of One Rulings (Pass R28)',
  'Sources: a Sonnet "Law of One guide" that opened about 120 citations on lawofone.info (`bench/2026-10-31-c/outputs/law_of_one_mirror.md`), Argon\'s Overwatch packet, and Opus\'s own spot-check of 8 citations: 7 matched, and one claim needed a neighbouring passage (92.16, not 92.13). Argon\'s proposed citation change 87.28 → 87.20 was checked and **rejected**: 87.20 is about the post-veil experiments, while 87.28 holds the cross-wiring. "Ra" below is what the texts say; "design" is a number or mechanic the texts do not give, which the owner may change.',
  '',
  '| Q | Ra (verified) | Rule adopted | Design choices |',
  '|---|---|---|---|',
  '| 1. Do universes end? (`B133`) | An octave closes: its light is reabsorbed into the One Creator and a new octave begins, seeded by the previous harvest (40.1, 28.15, 52.12, 78.10, 82.11). Ra has no civilization igniting a Logos; sixth-density beings co-create their star (41.4–41.6). | Universe life cycle `IGNITED → RUNNING → CLOSING → MERGED`. On `MERGED`, emit `HarvestPacket {archetypeBias, polarityHistogram, lessonDigest}`, the only input to a successor seed (`B104`). Branch 7.3 child ignition stays as the owner\'s extension beyond Ra (`B161`). | Close when all lineages are S6 or harvested, or H_SMC ≥ 0.99 for N epochs (Argon). At most 3 live nested levels, `MAX_ACTIVE_OCTAVE_DEPTH` (Argon); deeper ones run as folded seeds. |',
  '| 2. Can progress fall? (`B134`) | Yes. Polarity is lost through repressed catalyst (42.9), subjugation (55.3), an uncontrollable force (87.6) and opposite-pole lessons (69.11). Harvest is a test at cycle ends: more than 50% service to others, or about 95% to self, with a "sinkhole of indifference" between (17.31–17.33); three cycles, then a sweep (6.15). | `polarity = {sto01, sts01}` (sum ≤ 1), moved both ways by events: `ΔH_symbiotic` raises `sto01`; free-will violations and unforgiven grudges lower it. `harvestReadiness` is evaluated only at cycle boundaries: `sto01 > 0.5` → positive 4D, `sts01 ≥ 0.95` → negative 4D, otherwise the entity repeats. Unintegrated catalyst can harden Π (61.4, `B130`). | Cycle length; event sizes (Argon: −0.22 · FreeWillViolation, −0.08 · UnforgivenGrudge). |',
  '| 3. Are scars permanent? (`B135`) | Physical scars persist, and an adversary works them (67.12–67.13, 77.24). Karma is inertia braked by forgiveness at any time (34.4–34.5, 17.20); full forgiveness includes self (18.12); the imbalance is corrected later, not erased (71.7). | Scar = vessel property, permanent per vessel, needs upkeep, raises that zone\'s exposure to the nemesis. Grudge = released when both `selfForgave` and `otherForgave`. Grafting happens on survival, regardless of forgiveness. Forgiveness zeroes the grudge and the ache (Argon\'s "Kintsugi" golden seam) and schedules a correction quest instead of deleting the `mc`. | Whether a forgiven scar keeps full resistance (guide) or half (Argon). |',
  '| 4. What is light? (`B105`) | Light is the first manifestation and the base of matter (13.9, 27.14, 41.9). A sun is fusing gas and also a sub-Logos body (41.4). Ordinary light spreads from every point; coherence comes from focusing geometry such as the pyramid\'s spirals (59.11–59.14). | Starlight sums incoherently (Part 4 §1.2 updated). `coherence01` belongs to a focusing device or working and feeds `@hm/magic-indigo` (Argon\'s "phase envelope", placed where Ra puts it). | Reference irradiance; device coherence function. |',
  '| 5. Twenty pillars (`B116`) | Ra lists no set of twenty; its counts are 3, 5, 7 and 22. | Part 7 §0 now carries Argon\'s explicit list P01–P20, labelled as a design enumeration. | — |',
  '| 6. Cartridge budget (`B102`) | Silent. | Keep the soul cartridge ≤ 4096 bytes with the §8.2 eviction order; add a separate `@hm/worldsave` envelope for world state (Argon). The `ms` line carries `arch=<mind,body,spirit>` biases, because the archetypical mind is "available equally to each but unevenly used" (92.16; only The Choice is fixed, 77.13), and `pol=<sto01,sts01>`. | Argon\'s full `ms`/`mv` line text was cut off in transit (`B173`). |',
  '| 7. Prototype (`B110`) | Silent. | The prototype figures (3,848 tests, 2,606 mechanics, commit 6519c461) are external historical context, not verified claims (RULES 8a). | A deterministic `generateCanonicalBreadcrumbShelf(seed)` in `@hm/genesis` would remove the external dependency (`B172`, owner to decide). |',
  '',
  '**Mirror-diff (what the Law of One has that the design lacked).** Specified above: harvest as a cycle-end test, losable polarity, octave closure with inheritance, bilateral karma. Still open (§8.1): free-will consent on writes to another actor (`B165`), density nesting (`B166`), the between-life review as lesson programming (`B167`), stars as sub-Logos bodies (`B168`), local law sets per Logos level (`B169`), an adversary that works blockages and scars (`B170`), and support crews that act only when called (`B171`).',
  '',
].join('\n');
const p9 = t.P.indexOf('\n# PART 9:');
t.P = t.P.slice(0, p9) + '\n' + S84 + t.P.slice(p9);

// Register: status flips for questions the texts answer, then new rows.
for (const id of ['B102', 'B105', 'B110', 'B116', 'B133', 'B134', 'B135']) {
  const re = new RegExp(`^\\| \`${id}\` \\| \\*\\*OPEN\\*\\* \\|(.*) \\|$`, 'm');
  if (!re.test(t.P)) throw new Error(`register row ${id} not found as OPEN`);
  t.P = t.P.replace(re, (_, rest) => `| \`${id}\` | **FIXED** |${rest} Answered in §8.4 (R28). |`);
}
const R28 = [
  ['B159', 'FIXED', 'C29', 'Part 6 named the third pyramid spiral "Wall of Light"; Ra\'s third spiral is energizing (58.23), and the wall of light is a separate protection (72.17).'],
  ['B160', 'FIXED', 'C29', 'Part 6\'s ten Ra citations were unattributed; six support only the vital cost or are loose, and the spore\'s Veil/ego effects and the six-step doubling are design.'],
  ['B161', 'FIXED', 'C29', 'Child-universe ignition read as Ra cosmology; it is the owner\'s extension (Ra\'s analog: S6 beings co-create their star).'],
  ['B162', 'FIXED', 'C7', 'Ray 7\'s role: violet is the constant identity signature, outside activation, and what harvest reads (39.10, 51.1); `ch[6]` is identity, not lean.'],
  ['B163', 'FIXED', 'C3/C6', 'A3 `coerciveOverride !== true` failed open for `"true"` or `1` (found by the why= teleology pass); now fail-closed.'],
  ['B164', 'FIXED', 'C29', 'Cross-wired polarity said "dominant"; Ra 87.28 says each pole is attracted to those archetypes.'],
  ['B165', 'OPEN', 'C12', 'No free-will consent check on writes to another actor, and offense severity is not defined as the magnitude of infringement (15.21, 55.4).'],
  ['B166', 'OPEN', 'C11', 'Stages S0a..S6 are flat; Ra nests each density in sub-densities, and entry within a density depends on understanding (16.51, 17.34).'],
  ['B167', 'OPEN', 'C11', 'W3 Dream should be a polarity-neutral review that writes lessons and programs the next incarnation; it cannot correct, only forgive and set odds (71.6–71.8).'],
  ['B168', 'OPEN', 'C4', 'Stars are only luminosity parameters; Ra treats a sun as a sub-Logos body co-created by sixth-density beings, with a ray spectrum (41.4–41.6, 40.3).'],
  ['B169', 'OPEN', 'C10', 'Natural constants are global; Ra gives each level of the Logos hierarchy its own local law set within the parent\'s frame (13.13, 29.2).'],
  ['B170', 'OPEN', 'C21', 'The nemesis is only a grudge machine; Ra\'s adversary works blockages, scars and pre-incarnative distortions (25.1, 67.12–67.13, 72.17).'],
  ['B171', 'OPEN', 'C12', 'The five support-crew tiers have no rules; Ra\'s helpers act only when called, within free will (51.1, 55.4).'],
  ['B172', 'OPEN', 'C8', 'Proposed deterministic `generateCanonicalBreadcrumbShelf(seed)` to replace the external Bucket B port (Argon); owner to decide.'],
  ['B173', 'OPEN', 'C22', 'Argon\'s full `ms`/`mv` line definition was cut off in transit; the `pol=` and `mv` fields need the complete text.'],
];
const regEnd = t.P.indexOf('\n## 8.2');
t.P = t.P.slice(0, regEnd).replace(/\n+$/, '') + '\n' + R28.map(([id, st, c, d]) => `| \`${id}\` | **${st}** | ${c} | ${d} |`).join('\n') + '\n' + t.P.slice(regEnd);

// Ledger rows, heading and status.
const setC = t.P.match(/^\| \*\*Pass R27 — Set-C Reader Findings\*\*.*$/m)[0];
t.P = t.P.replace(setC, () => setC + '\n| **Pass R28 (Law of One Mirror + Overwatch Rulings)** | `B159–B164` (6 defects) | Ra corrections (third spiral, citation scope, child ignition beyond Ra, ray 7, "attracted" not "dominant") and the fail-open A3 gate. Seven earlier OPEN items answered from the texts and closed: B102, B105, B110, B116, B133, B134, B135 (§8.4). | 8 citations spot-checked by Opus |\n| **Pass R28 — Open (Law of One Mirror Links)** | `B165–B173` (9 defects) | Structures the Law of One has that the design lacks, plus two owner/Argon follow-ups. | **OPEN** |');
const st = t.P.match(/\*\*(\d+) Defects Logged \(`#01–#(\d+)`, Passes R1–R27\): (\d+) Closed \/ (\d+) Open\.\*\*/);
const fixedNew = R28.filter(r => r[1] === 'FIXED').length, openNew = R28.length - fixedNew, flips = 7;
const L = +st[1] + R28.length, C = +st[3] + fixedNew + flips, O = +st[4] + openNew - flips;
t.P = t.P.replace(st[0], `**${L} Defects Logged (\`#01–#${L}\`, Passes R1–R28): ${C} Closed / ${O} Open.** Pass R28 answered the owner questions from the Law of One texts (a Sonnet guide, ~120 verified citations; Opus spot-checked 8) and Argon's Overwatch rulings, recorded in Part 8.4.`);
edit('P', `(\`R1 -> R27\`: ${st[1]} DEFECTS LOGGED — ${st[3]} CLOSED, ${st[4]} OPEN)`, `(\`R1 -> R28\`: ${L} DEFECTS LOGGED — ${C} CLOSED, ${O} OPEN)`);
edit('P', 'ALL-PARTS CONSTITUTION & R1–R27 AUDITED EDITION', 'ALL-PARTS CONSTITUTION & R1–R28 AUDITED EDITION');

// Versions and check range (historical R25 row keeps its own wording).
const bump = k => { t[k] = t[k].split('\n').map(l => l.startsWith('| **Pass R25') ? l : l.replaceAll('C1–C32', 'C1–C33').replaceAll('C1-C32', 'C1-C33').replaceAll('C23–C32', 'C23–C33').replaceAll('C23-C32', 'C23-C33').replaceAll('v9.2', 'v9.3').replaceAll('V9.2', 'V9.3').replaceAll('32-Point', '33-Point')).join('\n'); };
bump('P'); bump('R'); bump('S');

// ---------------- SKILL ----------------
edit('S', '1. **Recount** every count, total and ledger line against the list it describes (headings, "N items", defect totals). Use code.', '0. **Purpose first (`why=`)**: before any arithmetic, write each rule\'s purpose in at most 6 words, specific enough to fail, and check the rule serves it. On set C this was the only Haiku method to catch an inverted logic rule (Pass R28).\n1. **Recount** every count, total and ledger line against the list it describes (headings, "N items", defect totals). Use code.');
t.S = t.S.replace(/\n*$/, '\n') + [
  '- **Lens K — Canon Mirror (**`Pass R28 — v9.3`**)**:',
  '  - `C33 [R28-Canon-Mirror]`: When the design borrows from an external canon (here the Law of One), have a separate guide check it against the source: each claim is marked as the source\'s words, common interpretation, or the guide\'s inference, and every citation is opened and verified. Then spot-check the guide, and check Overwatch too: in R28, 7 of 8 spot-checks held, and Overwatch\'s proposed citation change (87.28 → 87.20) was wrong. Rulings go to the Plan with "source" and "design" kept apart (`B159–B173`).',
  '',
].join('\n');
edit('S', 'description: Always-on reasoning framework (v9.3 — Document-Audit Mode, Fractal Gap Map,', 'description: Always-on reasoning framework (v9.3 — Document-Audit Mode with why= purpose check, Fractal Gap Map, Canon Mirror,');

// ---------------- RESUME ----------------
const rs = t.R.match(/\*\*(\d+) Defects Logged \(`#01–#(\d+)`, Passes R1–R27\): (\d+) Closed \/ (\d+) Open\.\*\*/);
if (+rs[1] !== +st[1]) throw new Error('resume and plan ledgers disagree before R28');
t.R = t.R.replace(rs[0], `**${L} Defects Logged (\`#01–#${L}\`, Passes R1–R28): ${C} Closed / ${O} Open.** Pass R28 answered the owner's questions from the Law of One texts (Plan §8.4).`);
all('R', `${rs[1]}-Defect Ledger`, `${L}-Defect Ledger`);
all('R', `${rs[1]}-defect ledger synced`, `${L}-defect ledger synced`);
all('R', `\`#01–#${rs[1]}\` encoded`, `\`#01–#${L}\` encoded`);
edit('R', `(\`Passes R1 -> R27\`: ${rs[1]} Logged, ${rs[3]} Closed, ${rs[4]} Open)`, `(\`Passes R1 -> R28\`: ${L} Logged, ${C} Closed, ${O} Open)`);
edit('R', 'encode it as a new check (`C33+`) in **The Skill** first.', 'encode it as a new check (`C34+`) in **The Skill** first.');
const lastBullet = t.R.indexOf('  - **Owner questions (Plan §8.3):**');
const lbEnd = t.R.indexOf('\n', lastBullet);
t.R = t.R.slice(0, lbEnd) + '\n' +
  `- **Pass R28 Law of One Mirror & Overwatch Rulings (Claude Opus 5.5; \`B159–B${L}\`)**. The owner said the answers are in the Law of One. A Sonnet guide opened about 120 citations; Opus spot-checked 8 (7 matched, 1 needed 92.16 instead of 92.13). Argon's packet was checked too: its 87.28 → 87.20 correction was wrong and was rejected. Plan §8.4 now answers all seven questions. Universes close by octave wrap and seed successors with a HarvestPacket. Progress is a two-sided polarity tested at cycle ends (51% / 95%, sinkhole between). Scars stay on the vessel, while grudges are released by forgiveness of self and other. Starlight is incoherent, and coherence belongs to focusing workings. The 20 pillars are a design list. A why= teleology pass (Argon's idea) let Haiku catch the inverted mask law (9.5/10).` +
  t.R.slice(lbEnd);
edit('R', 'inv=0.99 cyc=27', 'inv=0.99 cyc=28');
edit('R', 'src=rule:reaudit-own-diff-b118-b158\n', 'src=rule:reaudit-own-diff-b118-b158\nme t=28 st=S5 cat=law-of-one-canon-mirror ex=0.94 err=0.15 h=0.88 d=solar-pride by=throat-integrity src=rule:verify-the-mirror-and-overwatch-b159-b173\n');
edit('R', 'mc by=heart-humility d=solar-pride n=27 open=1', 'mc by=heart-humility d=solar-pride n=28 open=1');
const block = t.R.match(/```\r?\n(m of=preset:agent-argon-overwatch[\s\S]*?)\r?\n#TAIL\|schema:hm:universe:v2\|crc32:(0x[0-9A-F]{8})\r?\n```/);
let crc = 0xFFFFFFFF;
for (const b of Buffer.from(block[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n'), 'utf8')) { crc ^= b; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0); }
const newCrc = '0x' + ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
edit('R', `#TAIL|schema:hm:universe:v2|crc32:${block[2]}`, `#TAIL|schema:hm:universe:v2|crc32:${newCrc}`);
edit('R', `CRC-32 \`${block[2]}\`, recomputed in Pass R27`, `CRC-32 \`${newCrc}\`, recomputed in Pass R28`);
const tsRe = /\*\*Checkpoint Timestamp:\*\* `([^`]+)` \(Mossel Bay, Western Cape, ZA; Pass R27 by Claude Opus 5\.5 — R26/;
const m = t.R.match(tsRe);
t.R = t.R.replace(tsRe, `**Checkpoint Timestamp:** \`${ts}\` (Mossel Bay, Western Cape, ZA; Pass R28 by Claude Opus 5.5 — R27 \`${m[1]}\`, R26`);
edit('R', 'Then confirm, amend or defer the proposals in Plan §8.2 and answer §8.3;', 'Then read the Law of One rulings in Plan §8.4 (owner may change any "design" value), and confirm, amend or defer the proposals in Plan §8.2;');

for (const [k, f] of Object.entries(F)) fs.writeFileSync(path.join(repo, f), t[k]);
console.log(JSON.stringify({ logged: L, closed: C, open: O, crc: newCrc }));
