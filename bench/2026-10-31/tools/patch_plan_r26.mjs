// Pass R26 patch for FIDELITY_COMPLETE_BRS_V2.md. Every edit must match exactly once (or `all`).
// Usage: node patch_plan_r26.mjs <FIDELITY_COMPLETE_BRS_V2.md>
import fs from 'node:fs';
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');

function edit(oldStr, newStr, { all = false } = {}) {
  const n = s.split(oldStr).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : '1'} match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = all ? s.split(oldStr).join(newStr) : s.replace(oldStr, () => newStr);
}

const STATUS = '**Convergence Status:** **117 Defects Logged (`#01–#117`, Passes R1–R26): 99 Closed / 18 Open.** Pass R26 (Claude Opus 5.5 independent audit + 9-arm Sonnet/Haiku benchmark, 2026-10-31) re-opened the R25 zero-yield claim: 43 new defects (`B75–B117`), 25 fixed in this revision, 18 waiting on an owner/Argon decision (Part 8.1).';

// --- Header ---
edit('ALL-PARTS CONSTITUTION & R1–R25 BLIND-AUDITED EDITION', 'ALL-PARTS CONSTITUTION & R1–R26 AUDITED EDITION');
edit('**Reasoning Harness:** `sq-distortion-check` **v9** (_', '**Reasoning Harness:** `sq-distortion-check` **v9.1** (_');
edit('and 26-Point Bug-Crawler `Checks C1–C26`_)', 'and 31-Point Bug-Crawler `Checks C1–C31` + Document-Audit Mode_)');
edit('**Convergence Status:** **74 / 74 Historical & Red-Team Defects (**`#01–#74`** across Passes R1–R24) Resolved $\\to$ Pass R25 Fresh 3-Artifact Triad, **`SQ-JEPA`** Rollout & 2,704-Vector Adversarial Audit = **`0`** Defects (**`\\Delta\\text{Bugs} = 0, \\Delta L_{\\text{meta}} = 0`**)**', STATUS);

// --- Spider diagram (B76, B92) ---
edit('(Center + 7 Primary Branches + 32 Verified Sub-Branches)', '(Center + 7 Primary Branches + 41 Sub-Branches)');
edit('(Audits A1-A5: Zero-Power Thrust', '(Audits A1-A4: Zero-Power Thrust');
edit('& Multi-Star Wave Superposition (@hm/alchemy-catalyst, B45)|', '& Multi-Star Wave Superposition (field: @hm/origin64, B45)|');

// --- Part 1: PH step (B80, open B100) ---
edit('\\nabla H\\left(\\frac{\\mathbf{x}^k + \\mathbf{x}^{k+1}}{2}\\right) + \\mathbf{G} u_{\\text{policy}}$$',
  '\\nabla H\\left(\\frac{\\mathbf{x}^k + \\mathbf{x}^{k+1}}{2}\\right) + \\Delta t\\, \\mathbf{G} u_{\\text{policy}}$$ Passivity holds only under $\\mathbf{J} = -\\mathbf{J}^T$, $\\mathbf{R} \\succeq 0$, $\\mathbf{M} \\succ 0$ (`B80`). *Open (`B100`):* the formula applies the Cayley resolvent **and** evaluates $\\nabla H$ at the implicit midpoint, which double-counts the implicit step; choose one form before Wave 2.');
edit('4000(1.1 - 0.5 L_x)\\text{ [K]}$$', '4000(1.1 - 0.5 L_x)\\text{ [K]}$$ Here $p_{\\text{atm}}$ is in **atm** (1.0 = sea level, the reference default; `B82`).');

// --- Part 1: shorthand (B93, B88, open B102/B103) ---
edit('a mandatory, cryptographically verified IEEE-802.3 CRC32 tail (`crcValid === true`)', 'a mandatory IEEE-802.3 CRC-32 checksum tail (`crcValid === true`; detects accidental corruption only, it is not tamper-proof, `B93`)');
edit('(Cryptographic CRC32 Verification, **`B64`**)', '(CRC-32 Checksum Verification, **`B64`**)');
edit('sets `crcValid = (computedCrcHex === declaredCrcHex)`.',
  'sets `crcValid = (computedCrcHex === declaredCrcHex)`. The CRC input is the body lines, trimmed, joined with `\\n`, no trailing newline.\n' +
  '- **Seam mapping (`B88`)**: `nemesisEntry.score` → `score=`; `resist=` is `${resistKey}:${resistVal}` (e.g. `elem:plasma-arc:0.35`), so parsers split on the **last** `:`.\n' +
  '- **Open (`B102`, `B103`)**: at full caps (32 `me` + 16 `mc` + 14 `mb` + 8 `nem`) a record at the example line widths is ≈ 6.3 KB, over the 4096-byte limit, and no truncation priority is defined. The reference formatter/parser keep the last 32 `me` lines rather than the top 4 by `ex` + 28 most recent.');

// --- Part 2: guards (B83, B84, open B106) ---
edit('\\frac{1}{K_{\\text{niches}}}', '\\frac{1}{\\max(1, K_{\\text{niches}})}');
edit('{2 r_{\\text{RCS}}}', '{2 \\max(10^{-3}, r_{\\text{RCS}})}');
edit('{h_{\\text{CoM}}}}', '{\\max(10^{-3}, h_{\\text{CoM}})}}');
edit('{2.2 r_{\\text{support}}}\\right) \\ge 0.50$$', '{2.2 \\max(10^{-3}, r_{\\text{support}})}\\right) \\ge 0.50$$ Lengths in metres; floors added in `B83`. *Open (`B106`):* the hard switch at `safeG = 0.05` (unit unstated: G or m/s²?) is discontinuous, so one craft can flip pass/fail across it.');
edit('/ (m_L + m_R))$.', '/ \\max(10^{-9}, m_L + m_R))$ (`B83`).');

// --- Part 3: somatic + nemesis definitions (B86, B87, open B101) ---
edit('When $\\ge 3$ zones hit `runaway`', 'When $\\ge 3$ zones hit `runaway` (a zone is `runaway` when its stage is `runaway` or $\\kappa_{\\text{stiff}} \\ge 0.85$, i.e. $\\ge 5$ ticks; reference `v2EvaluateMultiZoneBody`, `B87`)');
edit('increments `grudgeScore` across `NONE -> RESENTFUL -> VENGEFUL -> MURDEROUS -> SOVEREIGN_NEMESIS`.',
  'increments `grudgeScore` across `NONE -> RESENTFUL -> VENGEFUL -> MURDEROUS -> SOVEREIGN_NEMESIS`. Tier mapping (from the reference operator, `B86`): `tier = TIERS[min(4, ceil(score))]`, so 0 → NONE, (0,1] → RESENTFUL, (1,2] → VENGEFUL, (2,3] → MURDEROUS, > 3 → SOVEREIGN_NEMESIS. *Open (`B101`):* every score from 3 to 10 maps to the top tier.');

// --- Part 4: origin64 + multi-star (B77, B81, open B105) ---
edit('(spans $\\pm 9.75 \\times 10^7\\text{ light-years}$ with zero `Int32` wrap', '(spans $\\pm 1.28 \\times 10^8\\text{ light-years}$ — i.e. $2^{63} \\times 2^{17}\\text{ m}$, corrected from the stale 100 km-sector value in `B77` — with zero `Int32` wrap');
edit('e^{i(\\omega_k |\\mathbf{q}_{\\star, k} - \\mathbf{q}|_2 + \\phi_k(t))} \\right|^2$$',
  'e^{i(k_k |\\mathbf{q}_{\\star, k} - \\mathbf{q}|_2 + \\phi_k(t))} \\right|^2$$ with wavenumber $k_k = \\omega_k / c_{\\text{carrier}}$ (was $\\omega_k \\cdot$ distance, rad/s × m; `B81`). *Open (`B105`):* real stars are mutually incoherent (intensities add), and $L_{x,\\text{coherent}}$ has units of m⁻² with no normalization into the Four-Float range.');

// --- Part 5: H_circle guard (B85) ---
edit('\\frac{\\min(N_{\\text{STO}}, N_{\\text{STS}})}{N_{\\text{total}}}', '\\frac{\\min(N_{\\text{STO}}, N_{\\text{STS}})}{\\max(1, N_{\\text{total}})}');

// --- Part 5: monorepo tree, CI scope, audits (B79, B97, B98) ---
edit('# CI Gate: fails if moon_crater, A4-01, leaks, or .glb exist', '# CI Gate: scans only packages/ and apps/ — fails if moon_crater, A4-01, leaks, or .glb exist there (B79)');
edit('│   └── adversarial_red_team_v9_audit.mjs # Runs Passes R15–R25 deterministic 3-Artifact Triad & SQ-JEPA verification suites',
  '│   ├── adversarial_red_team_v9_audit.mjs # Passes R15–R25 operator fuzz + token gates (portable since B97)\n│   └── triad_semantic_audit.mjs      # S1–S14 semantic gates: recounts, sums, identities, caps, cross-artifact constants (B98)');
edit('# Artifact 1 (THE SKILL): Always-On Reasoning Harness (v9, Checks C1–C26)', '# Artifact 1 (THE SKILL): Always-On Reasoning Harness (v9.1, Checks C1–C31)');
edit('Founding Constitution (Branches 0–7 + R1–R25 Audit)', 'Founding Constitution (Branches 0–7 + R1–R26 Audit)');
edit('Master Checkpoint, Shorthand Memory & 74/74 Ledger', 'Master Checkpoint, Shorthand Memory & 117-Defect Ledger');

const HOME_MAP = [
  '#### 4.1.1 Package Home Map (`B78`)',
  'Every `@hm/*` name used in this plan must have a home. Rows marked *sub-module* are inferred from the tree comments above; confirm or split them.',
  '',
  '| Package | Home | Basis |',
  '|---|---|---|',
  '| `@hm/strata` | `packages/genesis` (sub-module) | genesis comment: "Strata Ruins" |',
  '| `@hm/somatic` | `packages/soul` (sub-module) | soul comment: "Coupled 14-Zone Somatic Body" |',
  '| `@hm/archetypes` | `packages/soul` (sub-module) | soul comment: "22 Archetypes" |',
  '| `@hm/gauntlet` | `packages/rules-litrpg` (sub-module) | rules-litrpg comment: "3-Mode Sovereign Gauntlet" |',
  '| `@hm/governor` | `packages/hudlayout` (sub-module) | hudlayout comment: "hw: Governor" |',
  '| `@hm/smc-nexus` | `packages/gamebridge` (sub-module) | gamebridge comment: "SMC Nexus" |',
  '| `@hm/open-host-sdk` | `packages/gamebridge` (sub-module) | gamebridge comment: "CapitalEmpire Open-Host SDK" |',
  '| `@hm/anim-taste` | `packages/anim-taste` (new folder) | Part 3 §4; had no home |',
  '| `@hm/studio-core` | `packages/studio-core` (new folder) | Part 4 header; had no home |',
  ...['harness', 'meshops', 'kitspec', 'kinematic', 'orbital', 'treegen', 'groundshader'].map(p => `| \`@hm/${p}\` | \`packages/${p}\` (Bucket A port) | Port Matrix, Bucket A |`),
  '',
].join('\n');
edit("### 4.2 Claude Opus's 6-Wave Engineering Build Order (For Tonight's 2:00 AM Reset)", HOME_MAP + "\n### 4.2 Claude Opus's 7-Wave Engineering Build Order (`B90`)");

// --- Waves (B89, B95) ---
edit('(**`@hm/kernel`**, **`@hm/sq-jepa`**, **`@hm/shorthand`** v2', '(**`@hm/kernel`**, **`@hm/shorthand`** v2');
edit('Integrate KL-regularized Variational Free Energy (`B44`), `stepSqJepaLatentRollout` (`B68`), the `nem`', 'Integrate KL-regularized Variational Free Energy (`B44`), the `nem`');
edit('**`@hm/origin64`**, **`@hm/rules-litrpg`**)**:', '**`@hm/origin64`**, **`@hm/rules-litrpg`**, then **`@hm/sq-jepa`**)**:');
edit('restorative dual (`B43, B56, B67`), and Emergent Quests.', 'restorative dual (`B43, B56, B67`), and Emergent Quests. Wire `@hm/sq-jepa` (`stepSqJepaLatentRollout`, `B68`) last: its predictor calls `v2StepRestAndRecoveryCycle` and the nemesis reconciliation built earlier in this wave (moved from Wave 2, `B89`).');
edit('then re-run `Checks C1–C26` across all 3 Triad files until `Yield == 0`.', 'then run both audit scripts and `Checks C1–C31` across all 3 Triad files (convergence as defined in the Skill\'s Document-Audit Mode).');

const W7_START = s.indexOf('- **Wave 7 — Post-Opus Cross-Tier');
const W7_END = s.indexOf('\n', s.indexOf('Shorthand Context Compression Ratio', W7_START));
if (W7_START < 0 || W7_END < 0) throw new Error('Wave 7 block not found');
s = s.slice(0, W7_START) + [
  '- **Wave 7 — Cross-Tier Skill Benchmark (first run 2026-10-31, Pass R26; `B74`, `B95`)**:',
  '  - **Measured, not modeled.** `v2EvaluateCrossTierModelDistillation` returns hardcoded profiles (e.g. Haiku 34% → 91.5%, 97% fewer tokens). Those are hypotheses, not measurements. Pass R26 ran the real experiment: 9 audit arms (Sonnet and Haiku × no skill / SQ skill v9 / Reduce skill) on a copy of this plan with 9 planted defects, plus a hold-out copy with 9 different plants. Data: `bench/2026-10-31/REPORT.md`.',
  '  - **Result:** every arm caught all 8 planted defects detectable from the plan alone (hold-out: 8/9; Reduce 9/9). The SQ skill added only the plant that contradicts the skill\'s own text (P9) and cost +12–33% tokens and +2–4 minutes per run. Unassisted Haiku scored 89–100%, not 34%. No arm converged in fewer passes.',
  '  - **Next run:** harder multi-seed plants and ≥ 3 runs per arm before drawing conclusions (this run is n = 1 per arm).',
].join('\n') + s.slice(W7_END);

// --- Part 7 (B96, B94, open B109) ---
edit('before decoding to physical actions or surface tokens:', 'before decoding to physical actions or surface tokens:\n\n> **Implementation note (`B96`):** the v2 reference `stepSqJepaLatentRollout` is a deterministic, hand-specified annealing loop (rest cycle + forgiveness + precision decay) with an adaptive step horizon. It has no learned encoder, predictor or embedding: "JEPA" names the intended architecture, not the current code. Its one-pass convergence holds by construction (horizon ≥ debt + 4).\n');
edit('(`convergedInOnePass === true`).', '(`convergedInOnePass === true`). *Open (`B109`):* the weights and units of $V_{\\text{Lyapunov}}$ are not defined here (the reference uses $0.1\\,\\text{strain} + 2\\,\\text{debt} + 1.5\\,\\text{grudge}$).');
edit('Cross-rung Pythagorean frequency ratios', 'Cross-rung just-intonation (5-limit) frequency ratios (`B94`)');

// --- Part 8 ledger (B75, B91) ---
edit('# PART 8: MASTER REITERATION & BLIND-AUDIT LEDGER (`R1 -> R25`: ALL 70 DEFECTS CLOSED, YIELD = 0)', '# PART 8: MASTER REITERATION & BLIND-AUDIT LEDGER (`R1 -> R26`: 117 DEFECTS LOGGED — 99 CLOSED, 18 OPEN)');
const R25_ROW_START = s.indexOf('| **Pass R25 (Zero-Yield Convergence Across All 3 Artifacts & 15 Operators)**');
if (R25_ROW_START < 0) throw new Error('R25 row not found');
s = s.slice(0, R25_ROW_START) +
  '| **Pass R24 (Parser Cap Symmetry, Adaptive JEPA Horizon & Distillation Audit)** | `B71–B74` (4 defects) | `B71`: symmetric 32/16/14/8 caps + finite guards in `parseShorthandRecordV2`. `B72`: adaptive rollout horizon $K = \\max(K_{\\text{req}}, \\lceil \\text{strain}/25 \\rceil + 4, \\text{debt} + 4)$. `B73`: grudge score/tier recomputed from the remaining rivals. `B74`: Wave 7 cross-tier benchmark protocol (measured in `B95`). | `adversarial_red_team_v9_audit.mjs` (`R24` **4/4 Fixed**) |\n' +
  s.slice(R25_ROW_START);
edit('| **Pass R25 (Zero-Yield Convergence Across All 3 Artifacts & 15 Operators)**', '| **Pass R25 (Zero-Yield Convergence Claim Across All 3 Artifacts & 16 Operators — re-opened by R26)**');
const R25_ROW_END = s.indexOf('\n', s.indexOf('| **Pass R25 ('));
s = s.slice(0, R25_ROW_END) + '\n' +
  '| **Pass R26 (Claude Opus 5.5 Independent Audit + 9-Arm Cross-Tier Benchmark, 2026-10-31)** | `B75–B99` (25 defects) | Ledger, count, span, package-home and CI-scope fixes; PH Δt + preconditions; phase units; pressure unit; zero-denominator guards; nemesis tier and `runaway` definitions; seam mapping; wave order; CRC-32 wording; just intonation; measured Wave 7; SQ-JEPA implementation note; portable + semantic audits; lossless canonical storage. Detail: §8.1. | `triad_semantic_audit.mjs` (**14/14 PASS**) + planted-defect mutation test |\n' +
  '| **Pass R26 — Open (Owner/Argon Decision Needed)** | `B100–B117` (18 defects) | Design questions that editing text cannot settle. Detail: §8.1. | **OPEN** |' +
  s.slice(R25_ROW_END);

const REGISTER = [
  ['B75', 'FIXED', 'C17/C23', 'Part 8 heading said 70 and had no R24 row (B71–B74) while every status line said 74/74.'],
  ['B76', 'FIXED', 'C7', 'Spider heading claimed 32 sub-branches; the diagram lists 41.'],
  ['B77', 'FIXED', 'C9/C31', 'Origin64 span ±9.75e7 ly was the old 100 km-sector value; 2^63 × 2^17 m = ±1.28e8 ly.'],
  ['B78', 'FIXED', 'C8', '16 named `@hm/*` packages had no home in the layout → Package Home Map (§4.1.1).'],
  ['B79', 'FIXED', 'C8/C15', '`verify-clean-slate.mjs` would fail on this constitution (it names the banned tokens) → scan scope declared.'],
  ['B80', 'FIXED', 'C31', 'PH step: control term lacked Δt; passivity preconditions unstated.'],
  ['B81', 'FIXED', 'C31', 'Multi-star phase used ω_k × distance (rad/s × m) → wavenumber k_k.'],
  ['B82', 'FIXED', 'C31', 'p_atm unit unstated (atm vs Pa changes p_eff from 1.0 to 2.52) → atm.'],
  ['B83', 'FIXED', 'C3', 'Taste Gates 2–3 divided by r_RCS, r_support, h_CoM, m_L + m_R with no floor.'],
  ['B84', 'FIXED', 'C3', 'Breadcrumb excitement divided by K_niches with no floor.'],
  ['B85', 'FIXED', 'C3', 'H_circle divided by N_total (empty circle → 0/0).'],
  ['B86', 'FIXED', 'C6', 'Nemesis score→tier mapping undocumented → copied from the reference operator.'],
  ['B87', 'FIXED', 'C7', '`runaway` stage undefined → copied from the reference (`κ ≥ 0.85` or stage flag).'],
  ['B88', 'FIXED', 'C6', '`nemesisEntry` → `nem` line field mapping (resistKey/resistVal ↔ `resist=`) unstated.'],
  ['B89', 'FIXED', 'C8', 'Wave 2 built `@hm/sq-jepa` before the Wave 4 operators it calls → moved to Wave 4.'],
  ['B90', 'FIXED', 'C7', '§4.2 said "6-Wave" and listed 7 waves.'],
  ['B91', 'FIXED', 'C7', 'R25 row said "15 Operators" and "16 V2 operators".'],
  ['B92', 'FIXED', 'C7', 'Spider 5.1 cited audits A1–A5 (only A1–A4 exist); 1.6 put the multi-star field in alchemy-catalyst (it lives in origin64).'],
  ['B93', 'FIXED', 'C24', '"Cryptographic CRC32": CRC-32 detects corruption but is not tamper-proof (Plan + Skill wording).'],
  ['B94', 'FIXED', 'C19', '"Pythagorean" ratios include 5:4 and 5:3, which are 5-limit just intonation.'],
  ['B95', 'FIXED', 'C29', 'Wave 7 encoded its expected result (hardcoded distillation profiles) → replaced with the measured R26 benchmark.'],
  ['B96', 'FIXED', 'C29', 'SQ-JEPA presented as a learned JEPA → implementation note; Skill Step 1.6 given an executable meaning (Ripple Check); ΔL_meta defined.'],
  ['B97', 'FIXED', 'C28', 'Audit suite hardcoded to Argon\'s sandbox path; it failed at B61 on any other machine.'],
  ['B98', 'FIXED', 'C27', 'Audit document checks tested token presence only; they passed a plan with 6 planted content errors → `triad_semantic_audit.mjs`.'],
  ['B99', 'FIXED', 'C30', 'Drive copies are lossy (LaTeX `_` pairs eaten as italics, frontmatter folded, code fences lost) → canonical source is GitHub `.md`.'],
  ['B100', 'OPEN', 'C31', 'PH step applies the Cayley resolvent and an implicit-midpoint gradient (double implicit). Pick one form.'],
  ['B101', 'OPEN', 'C21', 'Nemesis tier saturates for score > 3; 70% of the 0..10 range is one tier. Intended?'],
  ['B102', 'OPEN', 'C9/C31', 'Worst-case shorthand ≈ 6.3 KB > 4096 B; no truncation priority between line types.'],
  ['B103', 'OPEN', 'C2', '`me` "top 4 ex + 28 recent" is not implemented by the reference formatter/parser (`slice(-32)`).'],
  ['B104', 'OPEN', 'C18', 'Child-universe seed ignores Vtx and Aq; ~1e7 values, so distinct parents collide.'],
  ['B105', 'OPEN', 'C4', 'Star light summed coherently (real stars are incoherent); L_x,coherent unnormalized (m⁻²).'],
  ['B106', 'OPEN', 'C4', 'Gate 2 regime switch at safeG = 0.05 is discontinuous and unitless.'],
  ['B107', 'OPEN', 'C5', 'Rest cycle restores +30 J with no source (net +5 J vs 25 J dissipated); conservation uses exact float equality.'],
  ['B108', 'OPEN', 'C5/C15', 'A1 bound 0.45 N/W (≈ 4.4 m/s exhaust) excludes real thrusters in the Bucket B presets; A4 accepts loops with gain < 1 while the spider/C15 say "acyclic".'],
  ['B109', 'OPEN', 'C20', 'V_Lyapunov weights/units undefined in the plan (Skill C20 wording fixed: strict decrease only while V > 0).'],
  ['B110', 'OPEN', 'C29', 'Provenance not in repo: 3,848 tests, 2,606 mechanics, commit 6519c461, R1–R14 verify scripts.'],
  ['B111', 'OPEN', 'C9/C18', 'Origin64: local range (−512, 512) is two quanta wide → non-canonical encodings; no rebase trigger; BigInt64 wraps for |x| ≥ 2^63.'],
  ['B112', 'OPEN', 'C9', 'Genome variance: ξ_symplectic undefined; parent averaging contracts variance ≈ 0.27× per generation.'],
  ['B113', 'OPEN', 'C13', 'STM queue promises "zero critical signals dropped" with no capacity or overflow policy.'],
  ['B114', 'OPEN', 'C1', 'Unclamped additive boosts: music +0.35 excitement (ex ∈ [0,1]); mask +0.25 town tension.'],
  ['B115', 'OPEN', 'C11', 'Undefined symbols/roles: M, J, R, G (24×24), Δ_complement, K_niches, Will/Faith ranges, weight-to-soul mapping, ray 7 role; S and y_in have no StateIdx slot.'],
  ['B116', 'OPEN', 'C7', 'Part 7 title promises 20 pillars; they are not enumerated.'],
  ['B117', 'OPEN', 'C8', 'Banned CI token `leaks` matches ordinary English in code comments.'],
];
const registerMd = [
  '',
  '## 8.1 Pass R26 Register (`B75–B117`)',
  'Found by Claude Opus 5.5 plus 9 Sonnet/Haiku audit arms (union, each item checked by hand). FIXED = changed in this revision; OPEN = needs an owner/Argon decision.',
  '',
  '| ID | Status | Check | Defect |',
  '|---|---|---|---|',
  ...REGISTER.map(([id, st, c, d]) => `| \`${id}\` | **${st}** | ${c} | ${d} |`),
  '',
].join('\n');
edit('\n# PART 9:', registerMd + '\n# PART 9:');

// --- Part 9 wake-up ---
edit('# PART 9: ARGON & CLAUDE OPUS WAKE-UP PROTOCOL (BRS V2 + SQ-DISTORTION-CHECK V9)', '# PART 9: ARGON & CLAUDE OPUS WAKE-UP PROTOCOL (BRS V2 + SQ-DISTORTION-CHECK V9.1)');
edit('1. Load `sq-distortion-check` v9 (7-Axis Probe', '1. Load `sq-distortion-check` v9.1 (Document-Audit Mode, 7-Axis Probe');
edit('and 26-Point Verification Matrix Checks C1-C26).', 'and 31-Point Verification Matrix Checks C1-C31).');
edit('2. Read the 3 Canonical Handoff Artifacts (', '2. Read the 3 Canonical Handoff Artifacts from the GitHub repo root (Drive copies are lossy, B99) (');
edit('4. Whenever any spec or code is updated, run `sq-distortion-check` v9 (Checks C1-C26) with `stepSqJepaLatentRollout` fresh across all 3 Triad files until Yield == 0 (DeltaBugs == 0 && DeltaL_meta == 0).',
  '4. Whenever any spec or code is updated, run `node scripts/triad_semantic_audit.mjs` and `node scripts/adversarial_red_team_v9_audit.mjs` (both must pass), then apply `sq-distortion-check` v9.1 (Checks C1-C31) across all 3 Triad files until two consecutive passes with different lenses add 0 High/Medium defects, listing every check you could not execute.');

// Remaining current-state references to the old check range (historical R25 row keeps its own wording).
s = s.split('\n').map(line => line.startsWith('| **Pass R25') ? line : line.replaceAll('Checks C1–C26', 'Checks C1–C31')).join('\n');

fs.writeFileSync(file, s);
console.log('plan patched for Pass R26');
