# Pre-registration: three-place check, round 2

Written 2026-11-01, after round 1's results (`PLACES_RESULTS.md`) and before any round-2 agent ran. This round is **not blind to round 1**. It fixes the method round 1's critic found broken.

## What changes from round 1

1. **Three proposers, not one.** Opus, Sonnet and Haiku each propose a candidate for every pair in every place, giving 3 × 12 × 3 = 108 candidates. Each proposer gives its strongest candidate *and* its nearest miss. Round 1 had one proposer, which missed obvious candidates.
2. **Two new grades.** The judges had no slot for these in round 1:
   - **LAW:** a law of nature or a theorem that the relation rests on, neither held by definition nor variable in practice (for example CPT, strong duality, the equivalence principle).
   - **SUBSTITUTABLE:** a real conduit that carries the relation, but any of many interchangeable alternatives carries it identically (for example any Bézout witness, any set encoding).
3. **The judges check truth and restatement first.** A false candidate, a circular one, or one equivalent to the stated relation is NONE.
4. **One test for every subject.** VARIABLE means "varied with A and B fixed, the relation changes", whatever the subject. The judges are told not to grade physics and mathematics differently.
5. **Pairs and places are unchanged,** for comparability. For each pair and place, every one of the up-to-6 candidates (3 proposers × strongest and nearest miss) is graded. The cell takes the highest grade a majority of judges gives any one candidate. Every candidate is listed, so double counts can be seen.

## Grades, by rank

Every grade except NONE counts as "a third exists". They are ranked:

VARIABLE > LAW > FIXED > SUBSTITUTABLE > NONE

For each pair, I report P2 (the owner's claim) both with SUBSTITUTABLE counted as a third and without it. That choice is the owner's to make.

## Predictions, locked

- **R1 (control check):** all three physical controls get a VARIABLE or LAW third. Any failure means the test is broken.
- **R2:** with SUBSTITUTABLE excluded, 6 to 8 of the 9 mathematical pairs get a third (VARIABLE, LAW or FIXED). I expect P01 and P04 to gain one: a universe or parity for P01, prime factorizations for P04.
- **R3:** with SUBSTITUTABLE included, 8 or 9 of the 9 get a third. I expect at least P05 (∅/{∅}) and P11 (2/3) to come out SUBSTITUTABLE rather than NONE.
- **R4 (my bridge hypothesis):** at most 2 of the 9 mathematical pairs get a VARIABLE third. If 3 or more do, my "the third in mathematics is fixed or interchangeable" reading fails.

## Limits

- All judges are Claude models from one vendor.
- No planted control has a known *absent* third. That kind of pair is the very thing in question, so none can be planted.
- This is one run. A 2-1 judge split counts as a majority but is flagged.
- SUBSTITUTABLE was added after round 1 suggested it. It is a definitional choice, so its counts are reported apart.
