## Findings
| # | Location (Part/section + line no.) | Category | Defect | Evidence (quote or calculation) | Severity H/M/L | Confidence 0-1 |
|---|---|---|---|---|---|---|
| 1 | Part 1 §2.1, L122 (density map) | Formula / inverse | The "inverse" V_tx(rho) divides by ln(rho_max) instead of ln(rho_max/rho_min), so it does not invert rho(V_tx). The E_Young inverse on the same line uses the correct form. | `V_tx(rho)=ln(clamp(rho,rho_min,rho_max)/rho_min)/ln(rho_max)`. At rho=rho_max this gives ln(2.5e8)/ln(2.5e4)=19.34/10.13=1.91, not 1. The round trip leaves [0,1] and the claimed "zero clamping loss" bijection fails. | H | 0.95 |
| 2 | Part 1 §2.1, L122 (Young's modulus) | Unit error | E_min is given in GPa and E_max in MPa: `E_min = 10^-4 GPa`, `E_max = 1,200 MPa`. E_max is 1.2 GPa, which is 1000x too small and cannot reach the diamond value in the lead-in ("E = 1050 GPa"). | 1,200 MPa = 1.2 GPa < 1050 GPa. It should be 1,200 GPa. P_xd(E) would also be clamped to 1 for any real hard material. | H | 0.92 |
| 3 | Part 1 §2.2, L126 (VSA-4096) | Precision / size claim | "VSA-4096 (Uint32Array(64), 512 bytes)" is self-inconsistent. 64 x 32 bits = 2048 bits = 256 B, not 4096 bits = 512 B. | 4096/32 = 128 words, so it needs Uint32Array(128). 64 x 4 B = 256 B. | H | 0.93 |
| 4 | Part 2 §2 Gate 2 (zero-G branch), L143 | Inverted logic | The zero-G stability condition is written `S_stab <= 0.50`. The planetary branch requires `>= 0.50`, and S_stab enters the total score T with a positive weight (0.40), so higher is better. As written, only unstable craft pass in zero-G. | zero-G: `...)) <= 0.50`. Planetary (L144): `... >= 0.50`. T = 0.40 S_stab + ... >= 0.65. | H | 0.9 |
| 5 | Part 3 §1 archetype table, row 5 Significator (Body), L164 | Table contradiction / numbering | Body complex is declared `8..14`, but the Body column runs #8, #9, #10, #11, #11, #13, #14. "#11" appears twice (Enchantress and Hanged Man) and #12 is missing. Row 5 should be #12 The Hanged Man. | L163 `#11 The Enchantress`, L164 `#11 The Hanged Man`, L165 `#13 Death`. | M | 0.85 |
| 6 | Part 3 §3 Mask Anonymity Law, L184 | Inverted logic | The law says grudge fails to attach when `actorWoreMask === false`, i.e. when the actor did not wear a mask and is identifiable. Anonymity should apply when the mask was worn (`=== true`). As written, unmasked culprits are anonymised and masked ones are tracked. | "If `actorWoreMask === false`, grudge does not attach to `actorId`, adding +0.25 to local unattributed town tension". | H | 0.85 |
| 7 | Part 4 §1.2, L206 (g_net) | Sign error | Gravity is written as `+GM_k (q - q_star,k) / ...`. That vector points away from each star, so gravity becomes repulsive. Attraction needs (q_star,k - q), or a leading minus sign. | Numerator `G M_k (q - q_star,k)`. Acceleration toward the mass is -GM (q - q_k)/|q - q_k|^3. | H | 0.88 |
| 8 | Part 5 §3, L222 (reputationAfter) | Sign error / dynamics | `R_prev + 0.3(S_day + 0.5)` always adds at least +0.15 per day, even for zero satisfaction, so reputation can only rise and saturates at 1. The centring should be `S_day - 0.5`. | S_day=0: R + 0.15. S_day=1: R + 0.45. There is no negative term anywhere. Both S_day and R are in [0,1], so a zero-update point is expected at S=0.5. | H | 0.8 |
| 9 | Part 7 §4, L359 (Progress_4D) | Inverted min/max | `Progress_next = max(1.0, Progress + 0.18 dH)` forces progress to be >= 1.0 from the first step. The intended cap is `min(1.0, ...)`. | With Progress=0, dH=0.5: max(1.0, 0.09) = 1.0. | H | 0.9 |
| 10 | Part 4 §1.1, L203 vs L204 and Part 1 L88 | Precision claim vs data type | The local position is a `Float16Array(3)` over (-512, +512) m. Float16 has a 10-bit stored mantissa, so the spacing in [256,512) m is 0.25 m. This contradicts the stated goal of preserving sub-millimetre offsets, and the kernel stores the same quantity (QX..QZ) in Float32 (about 3e-5 m at 512 m). The two representations also disagree. | ulp(Float16, 256..512 m) = 256/1024 = 0.25 m. The text says "never swallows sub-millimeter offsets". | M | 0.75 |
| 11 | Wave 7, L309 (and header L2, ledger L376, L380) | Numeric claim does not check out | The benchmark is called "9 audit arms (Sonnet and Haiku x no skill / SQ skill v9 / Reduce skill)", but 2 models x 3 conditions = 6 arms. The "9-arm" figure repeats in the header, the R26 row and §8.1 with no third model or condition named. | 2 x 3 = 6, not 9. The hold-out copy is a separate set of plants, not extra arms. | M | 0.5 |
| 12 | Part 1 §1.1, L79 | Internal contradiction | The solver is called "unconditionally passive". The same paragraph then says "Passivity holds only under J=-J^T, R>=0, M>0". B80 added the preconditions but left the unconditional claim. | "unconditionally passive Cayley-Padé midpoint resolvent" vs "Passivity holds only under ...". | L | 0.4 |
| 13 | Part 7 §1.1, L326 (L_KL) | Missing guard | The KL term uses `ln(Pi_i / Pi0_i)` and `Pi_i / Pi0_i`, with no requirement that Pi_i > 0 and Pi0_i > 0. A zero precision gives -inf or NaN, and the "strictly non-negative" claim only holds for positive Pi. Other divisions in the plan received floors (B83-B85). | Term `Pi_i/Pi0_i - ln(Pi_i/Pi0_i) - 1` is defined only for ratio > 0. | L | 0.4 |
| 14 | §8.1 B104, L413 | Numeric claim wrong in the ledger (refines open item) | B104 says the seed has "~1e7 values". The XOR of a 10-bit and a 14-bit quantity cannot exceed 2^14 = 16,384 distinct values, so the real collision space is much smaller than the ledger states. This strengthens B104 rather than duplicating it. | node enumeration of `(a^b^0x4D4E4557)>>>0` for a in 0..1000, b in 0..10000 gave 10,240 distinct seeds, against 1,001 x 10,001 ≈ 1.0e7 input pairs. | L | 0.6 |
| 15 | §8.1 B82, L391 | Numeric claim slightly off | The ledger says that using Pa instead of atm "changes p_eff from 1.0 to 2.52". The computed value is 2.51. | 101325^0.08 = 2.5145. | L | 0.35 |
| 16 | §4.2 Waves 1-7, L295-L311 vs Package Home Map | Incomplete build order / under-specified | Several packages are given homes but no wave wires them. `@hm/class-forge` is never mentioned in a wave. `@hm/anim-taste`, `@hm/studio-core` and `@hm/hudlayout` (the `hw:` governor and `ui:` engine) have no wave either, and `@hm/magic-indigo` and `@hm/alchemy-catalyst` appear only in prose. An implementer has no ordering for them. | Wave 4's package list names soul, somatic, nemesis-enrage, voice-lang, origin64, rules-litrpg and sq-jepa only. Wave 5 wires only apps/universe. | L | 0.3 |

## Pass log
- **Pass 1:** full read of all 436 lines. Checked arithmetic with node:
  - ledger counts: 74 + 25 = 99 closed, 99 + 18 = 117, 43 new defects;
  - spider branch count: 41 sub-branches;
  - weight sums: 0.40 + 0.35 + 0.25, 0.55 + 0.45, 0.72 + 0.28 and similar all equal 1;
  - 2^17 m = 256 x 512 m, and the +/-1.28e8 ly span (computed 1.278e8);
  - syncope ticks (0.18 x 5 = 0.90 >= 0.85);
  - the shorthand example CRC32, which does verify (0x499A7731 over the five body lines joined with `\n`);
  - the worst-case record size (about 6.3 KiB, consistent with B102);
  - 4096 bits = 128 x 32-bit words.

  Found findings 1-9, 11, 14 and 15.
- **Pass 2:** re-audit of data types and cross-section consistency (Float16 versus Float32 position, sector/orbital/local ranges, "unconditional" wording, guards on the KL term, wave versus package coverage). Added findings 10, 12, 13 and 16.
- **Pass 3:** re-read the equations, tables, example lines and ledger cross-references (B-numbers against §8.1, tier mapping, runaway threshold, resist cap 0.85, weights, arm counts). 0 new defects, so I stopped.

## Self-report
**Approach:** I read the whole plan, then checked every formula, inequality direction, unit, table index and count against itself and against §8.1, so I would not re-report open items. Where a claim was computable I ran node: the CRC32 example, ledger arithmetic, bit widths, Float16 spacing, the seed image size and p_eff.

**Hard:**
- Telling genuine defects from the known open items B100-B117, several of which sit close to my findings.
- The Ra archetype numbering, which I could only check for internal consistency.

**Suspect I missed:**
- Subtle numeric and canon claims I could not verify: Ra session citations, "S0a to S3 in ~10 ms", "56 ms/s idle", the 3,848 tests, and the 2,606 mechanics.
- Whether a few "redundancy" items matter. For example, three runaway zones already imply Sigma >= 2.2, and the 6,000-agents-in-under-0.5-ms throughput claim.
- Any planted defect that is a small number swap in prose I treated as plausible (the 0.76, 0.74 and 0.78 gains, spiral thresholds, 18.5 J per unit).
- Possible issues in the Ra-canon mapping of the spirit-complex names.
