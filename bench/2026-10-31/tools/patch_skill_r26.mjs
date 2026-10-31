// Pass R26 patch for SQ_DISTORTION_CHECK_V9_SKILL.md -> v9.1 (Document-Audit Mode, C27–C31).
// Usage: node patch_skill_r26.mjs <SQ_DISTORTION_CHECK_V9_SKILL.md>
import fs from 'node:fs';
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');

function edit(oldStr, newStr, { all = false } = {}) {
  const n = s.split(oldStr).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : '1'} match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = all ? s.split(oldStr).join(newStr) : s.replace(oldStr, () => newStr);
}

// --- Frontmatter + title ---
edit('description: Always-on reasoning framework (v9 — SQ-JEPA Latent World-Model Rollout,', 'description: Always-on reasoning framework (v9.1 — Document-Audit Mode, SQ-JEPA Ripple Check,');
edit('Cross-Universe Symbiotic Bridge & 26-Point Lyapunov Edition).', 'Cross-Universe Symbiotic Bridge & 31-Point Lyapunov Edition).');
edit('and 26-Point Recursive Verification Matrix (Checks C1-C26).', 'and 31-Point Recursive Verification Matrix (Checks C1-C31). For auditing prose plans and specs, start with Document-Audit Mode.');
edit('# SQ Distortion Check, SQ-JEPA World-Model Rollout & Symbiotic Cosmogenesis Framework (v9)', [
  '# SQ Distortion Check, SQ-JEPA World-Model Rollout & Symbiotic Cosmogenesis Framework (v9.1)',
  '## Document-Audit Mode (start here when the target is a plan, spec or handoff document)',
  'Measured in Pass R26 (2026-10-31, 9 Sonnet/Haiku arms): on prose, the checks below produced the findings, while the code-only checks and the latent rollout could not be executed and only added tokens. So, for a document:',
  '',
  '1. **Recount** every count, total and ledger line against the list it describes (headings, "N items", defect totals). Use code.',
  '2. **Sum** every weight set that should total 1, and recompute every arithmetic identity the text states.',
  '3. **Units**: write the unit of each term in every sum, min/max and comparison; flag mixed units and unitless thresholds.',
  '4. **Positivity probe**: evaluate every "≥ 0", "decreasing" or "converges" claim at a point below the baseline (e.g. ratio 0.1) and at 0.',
  '5. **Breakers**: for every division, log, root and exponent, name the input that breaks it (0, empty, negative, NaN, huge) and the guard or cap.',
  '6. **Examples vs caps**: check every example value against the plan\'s own ranges and caps.',
  '7. **Budgets**: multiply every cap by the worst-case item size and compare with every byte, time or memory budget.',
  '8. **Boundaries**: for every threshold, test exactly `x = a` and both sides (gaps, overlaps, discontinuities).',
  '9. **Seams**: diff producer field names and types against the consumer grammar, character by character.',
  '10. **Homes and order**: every named package, file and function has a home, and nothing is built before what it calls.',
  '11. **Cross-artifact constants**: every constant stated in more than one artifact has the same value everywhere.',
  '12. **Evidence**: every "verified / benchmarked / 0 defects" claim points to something in the repo that reproduces it; otherwise mark it UNSUPPORTED.',
  '',
  '**Not executable on prose** (mark N/A and list them; do not spend tokens): C1, C2, C10, C13, C14, C16, C18, the fuzz part of C24, the rollout part of C25, C26 benchmarks. The 21 presets are a vocabulary for naming what you found, not a separate pass.',
  '',
  '**Convergence (defines ΔBugs and ΔL_meta):** ΔBugs = new High/Medium findings in the latest pass. ΔL_meta = change in the number of checks you could not execute (it must not grow). Converged = two consecutive passes with **different lenses** give ΔBugs = 0, with the unexecuted list reported. One reader rereading the same text is saturation, not convergence.',
  '',
  '**Ripple Check (the executable meaning of Step 1.6):** before committing an edit, search all 3 artifacts (and code) for every constant, name, count or formula you touched, update every occurrence in the same commit, then run `node scripts/triad_semantic_audit.mjs` and `node scripts/adversarial_red_team_v9_audit.mjs`.',
  '',
].join('\n'));

// --- Workflow / summary ranges ---
edit('the active reasoning and verification harness (`Checks C1–C26`).', 'the active reasoning and verification harness (`Checks C1–C31`).');
edit('- **Co-Evolution Execution Law (**`Checks C23–C26`**)**', '- **Co-Evolution Execution Law (**`Checks C23–C31`**)**');
edit('Independent Audit & 26-Point Verification Matrix (**`Checks C1–C26`**)**', 'Independent Audit & 31-Point Verification Matrix (**`Checks C1–C31`**)**');

// --- C20 strictness (B109) and C24 wording (B93) ---
edit('and verify the **Lyapunov trajectory residual** $V(F_{\\text{dual}}(F(x))) < V(F(x)) \\to 0$.', 'and verify the **Lyapunov trajectory residual** $V(F_{\\text{dual}}(F(x))) < V(F(x))$ whenever $V(F(x)) > 0$ (equality at the fixed point $V = 0$), with $V \\to 0$ over repeated application.');
edit('with verified IEEE-802.3 CRC32 integrity (`Check C24`).', 'with an IEEE-802.3 CRC-32 checksum (`Check C24`; detects corruption, not tampering).');

// --- Step 1.6 operational note (B96) ---
edit('### 1.6 `SQ-JEPA` Latent World-Model Rollout (`@hm/sq-jepa` — Eliminating Multi-Pass Yield Drift, `B67–B70`)',
  '### 1.6 `SQ-JEPA` Latent World-Model Rollout (`@hm/sq-jepa` — Eliminating Multi-Pass Yield Drift, `B67–B70`)\n> **For a language model in a text session (`B96`):** there is no executable latent space, so never report $E_\\psi$ values for a document. The operational form of this step is the **Ripple Check** in Document-Audit Mode. The `@hm/sq-jepa` reference code is a deterministic annealing loop, not a learned JEPA.\n');
edit('Conditioned on the 7 Axes, 21 Antidotes, and Checks `C1–C26`', 'Conditioned on the 7 Axes, 21 Antidotes, and Checks `C1–C31`');

// --- Step 3/4 matrix ---
edit('## Step 3 & Step 4: Independent Audit & 26-Point Verification Matrix (`Checks C1–C26`)', '## Step 3 & Step 4: Independent Audit & 31-Point Verification Matrix (`Checks C1–C31`)');
edit('re-execute all 26 checks (`Checks C1–C26`) fresh across all 3 artifacts until **$\\Delta\\text{Bugs} = 0$** AND **$\\Delta L_{\\text{meta}} \\le 0$**.', 're-execute all 31 checks (`Checks C1–C31`; code-only checks marked N/A for prose) fresh across all 3 artifacts until **$\\Delta\\text{Bugs} = 0$** AND **$\\Delta L_{\\text{meta}} \\le 0$** as defined in Document-Audit Mode.');
edit('`C17 [R13-Bug-to-Skill-Closure]`: All 74 historical defects (`#01–#74`) encoded in `Checks C1–C26`.', '`C17 [R13-Bug-to-Skill-Closure]`: All logged defects (`#01–#117`) encoded in `Checks C1–C31`, with OPEN items tracked in Plan §8.1.');
edit('to prove strict Lyapunov decrease $V(F_{\\text{dual}}(F(x))) < V(F(x)) \\to 0$ across', 'to prove Lyapunov decrease $V(F_{\\text{dual}}(F(x))) < V(F(x))$ whenever $V(F(x)) > 0$ (strict decrease is impossible at the fixed point $V = 0$) across');
edit('declare the exact same cumulative defect count (`74 / 74`, `#01–#74`), and reference `Checks C1–C26` (`B61, B62`).', 'declare the exact same ledger (`117 Defects Logged`, `#01–#117`, same Closed/Open split), and reference `Checks C1–C31` (`B61, B62`). The token presence alone proves nothing: `triad_semantic_audit.mjs` S1 recomputes the totals.');
edit('`C24 [R20-CRC32-Cryptographic-Verification,', '`C24 [R20-CRC32-Checksum-Verification,');
edit('lifts their reasoning accuracy ($\\Delta R_{\\text{lift}} > 0$), reduces passes to zero yield ($N_{\\text{passes}}$), and multiplies token efficiency ($\\eta_{\\text{token}}$).',
  'lifts their reasoning accuracy, reduces passes, and improves token efficiency. These are **hypotheses**: the operator returns hardcoded profiles. First measurement (Pass R26, `bench/2026-10-31/REPORT.md`): no detection lift on this plan beyond the one cross-reference the skill text carries, and +12–33% tokens.');

// --- New lens (C27–C31) ---
s = s.replace(/\n*$/, '\n') + [
  '- **Lens I — Measured Truth, Portable Gates & Lossless Canon (**`Pass R26 — v9.1`**)**:',
  '  - `C27 [R26-Semantic-Gates & Mutation-Test]`: Every automated gate recomputes what the documents claim (counts, sums, identities, caps, cross-artifact constants) instead of testing that tokens are present. Prove each gate by planting a known defect and watching it fail: an audit that passes a known-bad plan is not an audit (`B98`).',
  '  - `C28 [R26-Portable-Reproducible-Gates]`: No sandbox-specific paths. A convergence claim counts only if the gate runs from the repo on the owner\'s machine or CI (`B97`).',
  '  - `C29 [R26-Measured-Not-Modeled]`: Anything that reports a benchmark or metric must consume measured data; hardcoded "expected" profiles are labelled hypotheses, and names must not promise an architecture the code lacks (RULES 8a, `B95`, `B96`).',
  '  - `C30 [R26-Lossless-Canonical-Storage]`: The triad\'s source of truth is plain `.md` in git. Google Docs/Drive conversion drops `_` subscripts, frontmatter and code fences, so never round-trip canonical text through it (`B99`).',
  '  - `C31 [R26-Dimensions, Positivity & Budget Probes]`: Units of every term; every "≥ 0" or "decreasing" claim probed below baseline; every cap × worst-case size compared with every budget; every threshold tested at `x = a` (`B77`, `B80`, `B81`, `B102`, `B106`).',
  '',
].join('\n');

s = s.replaceAll('C1–C26', 'C1–C31').replaceAll('C1-C26', 'C1-C31');
fs.writeFileSync(file, s);
console.log('skill patched to v9.1');
