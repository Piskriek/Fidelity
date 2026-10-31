# Audit C_haiku_card_r1: PLAN_C.md (436 lines), card SQ_AUDIT_CARD.md

Scope: the two input files only. Items B75-B117 (plan §8.1) are excluded per the card, including items marked FIXED. Arithmetic checked with `node -e`.

| # | Location (section + line) | Check # | Defect | Evidence (quote or computed value) | Severity H/M/L | Confidence 0-1 |
|---|---|---|---|---|---|---|
| 1 | §1.2, lines 107 and 115 (`#TAIL` / CRC seam) | 9 | The declared CRC is written `0x499A7731` (0x prefix, uppercase), and the parser compares strings (`computedCrcHex === declaredCrcHex`). The plan never fixes the hex format, so a lowercase or prefix-free computed value never matches. | I recomputed CRC-32 over the 5 body lines (no trailing newline): `499A7731`. The example value is correct; the format seam is not specified. | L | 0.5 |
| 2 | §1.2 line 113 (`mb stage=`); Part 3 §2 line 174 (cadences) | 9 | `stage` takes `clear / congested / inflamed / runaway`, but the only stage rule is `runaway` (κ ≥ 0.85). The thresholds for `congested` and `inflamed` are undefined, and the cadence names (DULL_ACHE, SHARP_PAIN, EUREKA) do not map to stages. The example `stage=inflamed ticks=3` gives κ = 0.54, which the stated rules cannot produce. | κ = min(1, 0.18·3) = 0.54 | L | 0.4 |
| 3 | §2.1, lines 120 and 122 (E_Young) | 3, 6 | Mixed units. `E_min = 10^-4 GPa` but `E_max = 1,200 MPa`. The range tops out at 1.2 GPa, so Diamond (E = 1050 GPa, line 120) clamps to 1.2 GPa. That contradicts "zero clamping loss". | Literal ratio 1200/1e-4 = 1.2e7; consistent-GPa ratio 1.2e4; E(P=1) = 1.2 GPa < 1050 GPa | H | 0.9 |
| 4 | §2.1, line 122 (ρ(V_tx) and its stated inverse V_tx(ρ)) | 2 | V_tx(ρ) is not the inverse of ρ(V_tx). The denominator is ln(ρ_max) where the inverse needs ln(ρ_max/ρ_min). The same pattern for E is correct, so this is inconsistent. It also survives the B42 "fix". | V(1000) = 1.5917, clamped to 1, gives ρ(V) = 25000.0 (not 1000). V(0.08988) = 0.6716 gives ρ(V) = 43.66 (not 0.08988). Correct inverse: ln(ρ/ρ_min)/ln(ρ_max/ρ_min) | H | 0.95 |
| 5 | §2.2, line 126 (VSA-4096) | 3, 7 | Storage size does not match the name. `Uint32Array(64)` is 2048 bits = 256 bytes, not "512 bytes". A 4096-bit vector needs 128 words. Similarity normalisation would run over the wrong N. | 64 × 32 = 2048 bits; 64 × 4 = 256 B; 4096 / 32 = 128 words = 512 B | H | 0.9 |
| 6 | Part 2 §2, Gate 2 zero-G branch, line 143 | 8 | The cap "S_stab ≤ 0.50" is not enforced by the expression clamp01(1 − τ/(2·max(1e-3, r_RCS))), which equals 1.0 at τ = 0. The planetary branch writes the same symbol as a pass test ("≥ 0.50"), so the 0.50 role flips between branches. | τ = 0 gives S_stab = 1.00 > 0.50 | M | 0.7 |
| 7 | Part 2 §2, Gate 2 zero-G branch, line 143 | 3 | τ_arm uses a unit axis n̂, but the only guard is \|n\| > 1e-9. No normalisation step is given, so a non-unit axis scales τ linearly. | Formula reads \|(r_CoM − r_thrust) × n̂\| with no normalisation | L | 0.4 |
| 8 | Part 3 §1 table, lines 163 and 164 (Ra Body Complex column) | 1 | Duplicate ID. `#11` appears twice (Station 4 "The Enchantress", Station 5 "The Hanged Man"). The Body column should run #8 to #14, so Station 5 should be #12 and #12 is missing. | Body column reads 8, 9, 10, 11, 11, 13, 14 | M | 0.9 |
| 9 | Part 4 §1.1, lines 203 and 204 (`Float16Array` local position) | 7 (float precision) | Stated precision cannot be met by the type. Float16 spacing for values in [256, 512) is 2^(8-10) = 0.25 m, so local offsets below 1 mm are not representable. The sub-millimetre claim on line 204 is only true for the Float64 path. | IEEE ulp at [256, 512): 0.25 m (Node has no Float16Array, so this is computed from the format) | L | 0.4 |
| 10 | Part 4 §1.2, line 206 (multi-star `g_net`) | 2 | Sign inverted. The numerator is (q − q_k), which points away from each star. Gravitational acceleration needs (q_k − q). The name `g_net` and the "gravity" wording point to acceleration, not a potential gradient. | Star at +x, query at origin: g_x = G·M·(0 − 1)/1³ = −G·M (away from the star) | H | 0.75 |
| 11 | Part 4 §2, line 211 (`maxTierByVram`) | 8 (NaN) | No branch for NaN or undefined VRAM. `<4GB`, `<16GB`, and `>=16GB` all evaluate false for NaN, so the tier is undefined. | NaN < 4, NaN < 16 and NaN >= 16 are all false | L | 0.4 |
| 12 | Part 5 §3 line 222 (`reputationAfter`) | 4 | Reputation rises every day, even when satisfaction is zero. The "+0.5" offset makes the increment 0.3·(S + 0.5), which is at least 0.15. Reputation saturates at 1.0 within about 7 days at S = 0. The neutral point should be S = 0.5 (0.3·(S − 0.5)). | R = 0, S = 0: 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.00 (day 7). Increment is never negative. | H | 0.7 |
| 13 | Part 5 §3 line 224 (6,000 agents in < 0.5 ms); Part 4 line 266 (56 ms/s idle); Part 4 §4.2 line 301 (S0a→S3 in ~10 ms) | 12 | Performance figures are stated as facts. The plan gives no benchmark, harness or reproduction, so they are UNSUPPORTED. | No measurement or reproduction in the plan | L | 0.4 |
| 14 | §4.2 Wave 1–7, lines 298–311 (build order) | 10 | Named packages are never built in any wave: `@hm/anim-taste` (line 285), `@hm/studio-core` (line 286), `@hm/hudlayout` / `@hm/governor` and `@hm/class-forge`. Wave 5 (line 305) mounts STUDIO_SCHEMATIC_2D and `litrpg-hud.tsx` (line 271), which depend on them. | Grep of wave text: none of the four names appears in Waves 1–7 | M | 0.6 |
| 15 | Part 5 §4.2 line 309; line 311 ("n = 1 per arm"); Part 8 row at line 376; §8.1 intro line 380 | 1, 12 | Arm count does not recount. The design is 2 models × 3 conditions (no skill / SQ skill v9 / Reduce skill) = 6 arms, but the plan says "9 audit arms" in three places. | 2 × 3 = 6; plan says 9 (lines 309, 376, 380); n = 1 per arm (line 311) gives 6 runs | M | 0.85 |
| 16 | Part 6 §2, line 320 (`recoveryCyclesDebt` decrement) | 4 | No floor on the debt. Running a rest cycle at debt 0 gives −1, and the `debt == 0` clearance never fires for that run. The horizon K = debt + 4 (line 330) then depends on a negative debt. | debt 0 → −1 after one rest cycle; `== 0` test false | L | 0.4 |
| 17 | Part 7 §1.1, line 326 (L_KL) | 5 | The claim "strictly non-negative" needs Π_i > 0, and there is no guard. ln(Π_i/Π0_i) is +∞ at Π_i = 0 and NaN for Π_i < 0. The PI_* slots (line 94) have no lower bound, and Π0_i appears in a denominator with no guard. | Π_i = 0 gives the term +∞; Π_i < 0 gives NaN | M | 0.6 |
| 18 | Part 7 §4, line 359 (Progress_4D) | 4 | min/max inverted. max(1.0, P + 0.18·ΔH) forces progress to at least 1.0, so the ΔH term has no effect below 1.0, and there is no upper cap. | P = 0.2, ΔH = 0.1 gives 1.0; P = 0, ΔH = 0 gives 1.0 | H | 0.9 |

Pass log:
- Pass 1 (section order, full read): 18 new findings (H 6, M 5, L 7).
- Pass 2 (check order 1 to 12 applied to the pass-1 list and the full text): 0 new findings.
- Pass 3 (literal sweep of every numeric constant and exponent): 0 new findings.
- Convergence: passes 2 and 3 used different lenses and added 0 High or Medium findings. This is one reader rereading, so treat it as saturation rather than independent convergence.

Checks I could not run (inputs limited to the two files):
- `scripts/triad_semantic_audit.mjs` and `scripts/adversarial_red_team_v9_audit.mjs`: plan claims 14/14 PASS, unverified.
- `bench/2026-10-31/REPORT.md`: Wave 7 numbers (34% to 91.5%, 89 to 100%, +12 to 33% tokens) unverified (check 12).
- The 3,848 tests, 2,606 mechanics and commit 6519c461 (B110, excluded anyway).
- Float16Array runtime behaviour (computed from the IEEE format, not executed).
- Finding 10 assumes `g` is an acceleration. If the plan means g = −∇Φ, the sign is only a naming issue.
- SQ skill text (C1–C31) and the other two Triad artifacts were not in the input set.

## Self-report on the card

(a) Checks that produced findings: check 1 (#8, #15), check 2 (#4, #10), check 3 (#3, #5, #7), check 4 (#12, #16, #18), check 5 (#11, #17), check 6 (#3), check 7 (#5), check 8 (#6, #11), check 9 (#1, #2), check 10 (#14), check 12 (#13, #15). Check 11 produced nothing (single document in scope).

(b) What the card made me miss or over-report:
- Missed: no explicit precision or exact-equality check. Float precision appears only as a preset name, so #9 came from ad hoc reasoning. I also ran a Float32 reserve residual test for `=== 0` conservation (0 of 257 nonzero, because the draw values are dyadic). That produced no finding, but the card gives no rule for when such a test is worth running.
- Missed: sign conventions. #10 was found by reading, not by a card check. Check 2 says "recompute identities" but gives no reference-point test for a field or force direction.
- Missed: check 4 did not prompt testing update rules at zero or negative inputs (#12, #16, #18 needed reading).
- Over-report risk: checks 9 and 12 invited low-severity items on speculative grounds (#1, #2, #13). I kept them at L and confidence 0.5 or below.
- Undefined: check 11 (cross-document constants) with one document in scope, and the "different lenses" convergence rule, which I had to define myself. One reader rereading is saturation, as the card says.

(c) Concrete edits to the card:
1. Check 2: add an inverse test (evaluate f⁻¹(f(x)) at two interior points and both clamp edges), and a direction test (for each field or force, evaluate at one reference geometry with a known direction). Fixes #4 and #10.
2. Check 7: rename to "Storage and budgets". For each stored field, give the type and width, compute bits or bytes = n × width, and test every stated size, ulp claim and exact-equality (`=== 0`) claim. Fixes #3, #5, #9.
3. Check 1: add a duplicate-ID scan over every enumerated table column. Fixes #8.
4. Check 8: add a cap test. If the text says X ≤ c, evaluate the formula at its maximum and at zero input. Fixes #6.
5. Check 4: require each update rule to be tested at zero and at negative inputs (debt, satisfaction, progress). Fixes #12, #16, #18.
6. Check 12: split UNSUPPORTED (the claim cites something absent from the inputs) from NOT RUN (out of scope). Require any L finding in check 12 to name a concrete inconsistency.
7. Convergence: define the lenses concretely (section order, check order, reverse section order), and require a second reader before calling convergence.
8. Check 11: add "N/A when only one document is in scope, unless the document cites another file's constant."
