# Three-place check round 2, choice round 3, and the four-place table

The pre-registrations are `PLACES_PREREG_r2.md` (sha 737e6b9e…) and `PLACES_PREREG_r3.md` (sha 36988b07…). Raw output is in `places_r2_raw.json` and `places_r3_raw.json`.

**Round 2 ran with two proposers, not three.** The Opus proposer was stopped by a false-positive safety flag and returned nothing, so Sonnet and Haiku proposed every candidate. All three judges ran.

## The four-place table

| Pair | Surrounding | Inside | Bridge | Choice (round 3) |
|---|---|---|---|---|
| P01 {2,4,6} / {1,3,5} | NONE | NONE | NONE | NONE |
| P02 R/S enantiomers (control) | VARIABLE | FIXED | LAW | SENSITIVE |
| P03 440 / 880 Hz | NONE | NONE | NONE | INVARIANT |
| P04 35 / 12 | FIXED | FIXED | SUBSTITUTABLE | INVARIANT |
| P05 ∅ / {∅} | FIXED | NONE | FIXED | SENSITIVE (2-1) |
| P06 Pt / Ti masses (control) | FIXED | LAW | LAW | SENSITIVE (2-1) |
| P07 N / Z | FIXED | SUBSTITUTABLE | SUBSTITUTABLE | INVARIANT |
| P08 binary 0 / 1 | FIXED | SUBSTITUTABLE | NONE | SENSITIVE |
| P09 path graph / its complement | FIXED | FIXED | NONE | SENSITIVE |
| P10 electron / positron (control) | LAW | NONE | LAW | SENSITIVE |
| P11 2 / 3 | FIXED | NONE | NONE | INVARIANT |
| P12 LP / its dual | FIXED | FIXED | LAW | INVARIANT |

## Against the locked predictions

**Round 2:**
- **R1 (control check): passed.** The three controls got VARIABLE, LAW and LAW.
- **R2 (6–8 of 9 mathematical pairs get a third, not counting SUBSTITUTABLE): passed, 7 of 9.** Two pairs have no third in any of the three places: the sets and 440/880.
- **R3 (8 or 9 of 9 get a third, counting SUBSTITUTABLE): failed, still 7.** My specific guess that ∅/{∅} and 2/3 would come out SUBSTITUTABLE was wrong; both came out FIXED.
- **R4 (at most 2 mathematical pairs get a VARIABLE third): held, with 0.** No mathematical pair got a third that varies.

**Round 3:**
- **R3-0 (judge check): passed.** All 4 decoys got NONE, unanimously.
- **R3-1 (the owner's "everything becomes 4", at least 11 of 12): passed, exactly 11.** Only P01 got no choice.
- **R3-2 (my invariance calls for the mathematical pairs, at least 7 of 9 right): passed, 7 of 9.** Two calls were wrong. P01 came out NONE, not SENSITIVE. P05 came out SENSITIVE, not INVARIANT, and the critic says that grade is wrong.
- **R3-3 (physics against maths):** H-A (all three controls SENSITIVE) held, and H-B (P06 and P10 INVARIANT) failed. The critic, though, would remove the SENSITIVE grades for P06 and P10, which would leave H-B nearer right. The data cannot settle this.

## The critics' corrections, which matter more than the counts

**Round 3's "presence" was nearly free.** Some choice (notation, units, encoding, sign convention) attaches to almost any symbolic statement, so INVARIANT costs little. P01 missed out only because nobody proposed a cheap one; a numeral base of 7 or more would do. So R3-1 passing confirms that "a choice is always present" only in a weak sense.

**What discriminates is SENSITIVE, and it is narrow.** By the critic's reading only P02 (parity violation) and P08 (bit width) earn it cleanly. The others rest on precision beyond the accepted theory (P06), a deprecated convention (P10), relabeling one object (P09), or a mistaken claim about structural set theory (P05).

**There may be a pipeline problem in round 3.** The Haiku judge graded all 22 Haiku-proposed candidates NONE, and only those rows carried a longer pair label. That points to a parsing problem or self-grading bias, and it was not checked.

**Round 2 graded the same shape differently.** A relation's own named system got NONE in P01 but FIXED in P08, P09 and P11. Fixing that inconsistency would move P01 to FIXED, or P08, P09 and P11 to NONE.

**Limits.** All proposers and judges are Claude models, every result comes from one run, and Opus is missing as a proposer in round 2.

## Reading

**Physical pairs:** every place filled, and their thirds vary or are laws.

**Mathematical pairs:** thirds are fixed by definition or interchangeable, never varying.

**Choice:** present almost everywhere, but it only matters in a few places, mostly physics and words with two senses.

**P01**, the original counterexample, has nothing in any of the four places. That holds only under a rule that treats a relation's own named universe as a restatement, and round 2's graders applied that rule to P01 alone. Whether P01 is a true "two" or a grading artefact is a definitional call. It belongs to the owner.
