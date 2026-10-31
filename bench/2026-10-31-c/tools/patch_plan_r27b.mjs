// Pass R27 (part b): Reduce v2 reader findings appended after B136. Extend EXTRA for regrower findings.
// Usage: node patch_plan_r27b.mjs <FIDELITY_COMPLETE_BRS_V2.md>
import fs from 'node:fs';
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');
function edit(oldStr, newStr) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = s.replace(oldStr, () => newStr);
}

// [id, status, check, text, optional plan edit [old, new]]
const EXTRA = [
  ['B137', 'FIXED', 'C3/C31', 'B83\'s floor let an empty craft (m_L = m_R = 0) score full lateral symmetry; S_sym is now 0 when there is no mass.',
    ['/ \\max(10^{-9}, m_L + m_R))$ (`B83`).', '/ \\max(10^{-9}, m_L + m_R))$, and $S_{\\text{sym}} = 0$ when $m_L + m_R = 0$: an empty craft earns no symmetry credit (`B83`, `B137`).']],
  ['B138', 'OPEN', 'C6', 'The SQ-JEPA latent carries recovery debt and nemesis grudge, but the 24-slot StateIdx has slots only for strain; debt and grudge have nowhere to live.'],
  ['B139', 'OPEN', 'C31', '14 of the 24 StateIdx slots have no unit or range (XI_X, XI_Z, MU_*, PI_*, A_AWARE, D_DISTORT, LAMBDA_FTLE, H_COHERENCE).'],
  ['B140', 'FIXED', 'C7', 'The B96 note gave the rollout horizon as "≥ debt + 4"; the reference uses max(K_req, ⌈strain/25⌉ + 4, debt + 4, 12), capped at 72.',
    ['Its one-pass convergence holds by construction (horizon ≥ debt + 4).', 'Its one-pass convergence holds by construction: the horizon is $K = \\max(K_{\\text{req}}, \\lceil \\text{strain}/25 \\rceil + 4, \\text{debt} + 4, 12)$, capped at 72 (`B140`).']],
  // Union of set-C arms' non-planted findings, each checked by hand.
  ['B141', 'FIXED', 'C29', 'The KL term was labelled the "LeJEPA anti-collapse regularizer"; LeJEPA\'s regularizer is SIGReg, not a KL divergence.',
    ['### 1.1 KL-Regularized Variational Free Energy (`v2PredictiveLossKL` / `LeJEPA` Anti-Collapse Regularizer)', '### 1.1 KL-Regularized Variational Free Energy (`v2PredictiveLossKL` — KL anti-collapse regularizer; LeJEPA itself uses SIGReg, `B141`)']],
  ['B142', 'FIXED', 'C29', 'The Yang–Mills mass gap was cited as "grounding"; it is an open Millennium Prize problem, so it can inspire but not ground.',
    ['Yang-Mills non-Abelian vortex mass gap.', 'the Yang-Mills mass gap (an open Millennium Prize problem: an inspiration, not a result, `B142`).']],
  ['B143', 'FIXED', 'C8', 'The §4.1 tree lacked folders the plan now cites: `spine/`, `skills/`, `bench/`, `.github/`, and the gap-map and mutation scripts.',
    ['│   └── triad_semantic_audit.mjs      # S1–S14 semantic gates: recounts, sums, identities, caps, cross-artifact constants (B98)', '│   ├── triad_semantic_audit.mjs      # S1–S14 semantic gates: recounts, sums, identities, caps, cross-artifact constants (B98)\n│   ├── mutation_test_audits.mjs      # Plants known defects; the gates must fail (C27)\n│   └── fractal_gap_map.mjs           # Point-cloud gap map over spine/ (C32)\n├── spine/                            # fidelity_point_cloud.json + generated GAP_MAP.md (B143)\n├── skills/                           # reduce/ and sq-audit-card/ skills\n├── bench/                            # Skill benchmarks with inputs, keys and every agent output\n├── .github/workflows/                # triad-gates.yml: every gate on every PR']],
  ['B144', 'FIXED', 'C2/C24', 'The CRC tail format was unstated (hex case, `0x` prefix), so a lowercase implementation fails the plan\'s own example.',
    ['joined with `\\n`, no trailing newline.', 'joined with `\\n`, no trailing newline. The tail is `0x` + 8 uppercase hex digits, compared case-insensitively (`B144`).']],
  ['B145', 'FIXED', 'C21', 'Peace reconciliation reset the tier to NONE but left the score, contradicting tier = f(score) (B86).',
    ["resets `grudgeTier = 'NONE'`, closes `mc open=0`, and unlocks a **Symbiotic Ally**.", "resets that rival's score to 0 and recomputes `grudgeScore`/`grudgeTier` from the remaining rivals (reference `B73`, `B145`), closes `mc open=0`, and unlocks a **Symbiotic Ally**."]],
  ['B146', 'FIXED', 'C6', 'The grudge increment equation was missing; the reference uses Δscore = severity01 × temper multiplier, capped at 10.',
    ['*Open (`B101`):* every score from 3 to 10 maps to the top tier.', 'Increment (reference, `B146`): $\\Delta\\text{grudgeScore} = \\text{severity}_{01} \\times \\text{temper multiplier}$, capped at 10. *Open (`B101`):* every score from 3 to 10 maps to the top tier.']],
  ['B147', 'FIXED', 'C1', 'Breadcrumb excitement can go negative (the cosine term), while `ex` must stay in [0, 1].',
    ['$$E(c, b) = \\left( 0.55', '$$E(c, b) = \\text{clamp}_{01}\\left( 0.55']],
  ['B148', 'FIXED', 'C1', 'The spore\'s active-window shifts (Veil −0.55, Wisdom +0.30, hardness × 0.35) had no clamp.',
    ['boosts Wisdom (`+0.30`)', 'boosts Wisdom (`+0.30`) (all three clamped to [0, 1], `B148`)']],
  ['B149', 'FIXED', 'C3', 'An unknown or NaN VRAM matched no governor tier.',
    ['`>=16GB -> Tier 3`)', '`>=16GB -> Tier 3`; unknown or NaN VRAM → Tier 1, `B149`)']],
  ['B150', 'OPEN', 'C7/C31', 'Two "strain" quantities with no mapping: syncope starts on the dimensionless Σκ ≥ 2.2 and ends on somaticStrainJoules < 20 J; E_vent = 18.5·Σκ J has no stated source or sink.'],
  ['B151', 'OPEN', 'C7', 'Only `runaway` has a threshold; `congested`/`inflamed` thresholds and SHARP_PAIN\'s κ are undefined, and the cadences are not mapped to the `mb` stages.'],
  ['B152', 'OPEN', 'C17', 'Legacy defect references `#06`, `#07`, `#17`, `#35` have no ledger row (prototype numbering; needs the prototype, `B110`).'],
  ['B153', 'OPEN', 'C7', 'Counts with no enumeration: the "6-Theme UI Style Shelf" and "5-Rung ui: engine" (sibling of `B116`).'],
];

const fixed = EXTRA.filter(e => e[1] === 'FIXED').length, open = EXTRA.length - fixed;
const first = EXTRA[0][0], last = EXTRA.at(-1)[0];
for (const e of EXTRA) if (e[4]) edit(e[4][0], e[4][1]);

const logged = 136 + EXTRA.length, closed = 107 + fixed, openTotal = 29 + open;
edit('**136 Defects Logged (`#01–#136`, Passes R1–R27): 107 Closed / 29 Open.**', `**${logged} Defects Logged (\`#01–#${logged}\`, Passes R1–R27): ${closed} Closed / ${openTotal} Open.**`);
edit('(`R1 -> R27`: 136 DEFECTS LOGGED — 107 CLOSED, 29 OPEN)', `(\`R1 -> R27\`: ${logged} DEFECTS LOGGED — ${closed} CLOSED, ${openTotal} OPEN)`);
const OPEN_ROW = '| **Pass R27 — Open (Gap Map Missing Links)** | `B126–B136` (11 defects) | Holes the framework\'s own laws expose (save paths, call graph, lateral duals, units). Proposals in §8.2; owner questions in §8.3. | **OPEN** |';
edit(OPEN_ROW, OPEN_ROW + `\n| **Pass R27 — Set-C Reader Findings** | \`${first}–${last}\` (${EXTRA.length} defects) | Union of the set-C arms' non-planted findings, each checked by hand: ${fixed} fixed, ${open} open (see §8.1). Two were introduced by R26's own fixes (\`B137\`, \`B145\`). | ${fixed} fixed · ${open} **OPEN** |`);
const regEnd = s.indexOf('\n## 8.2');
if (regEnd < 0) throw new Error('§8.2 anchor not found');
s = s.slice(0, regEnd) + '\n' + EXTRA.map(([id, st, c, d]) => `| \`${id}\` | **${st}** | ${c} | ${d} |`).join('\n') + s.slice(regEnd);
fs.writeFileSync(file, s);
console.log(JSON.stringify({ logged, closed, open: openTotal, last }));
