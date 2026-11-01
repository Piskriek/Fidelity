# Three-place check, round 1: results

The pre-registration is `PLACES_PREREG.md` (sha 46d04531…), hashed before any agent ran. Raw output is in `places_r1_raw.json`.

The check searched each pair for a "third" in three places: surrounding, inside and bridge. Sonnet proposed candidates, and Opus, Sonnet and Haiku each graded every candidate VARIABLE, FIXED or NONE. A candidate takes the grade at least two of the three judges gave it.

| Pair | Surrounding | Inside | Bridge | Best |
|---|---|---|---|---|
| P01 {2,4,6} / {1,3,5} | NONE | NONE | NONE | NONE |
| P02 R/S enantiomers (control) | VARIABLE | FIXED | VARIABLE | VARIABLE |
| P03 440 / 880 Hz | NONE | NONE | NONE | NONE |
| P04 35 / 12 | NONE | NONE | NONE | NONE |
| P05 ∅ / {∅} | NONE | NONE | NONE | NONE |
| P06 Pt / Ti masses (control) | VARIABLE | NONE | VARIABLE | VARIABLE |
| P07 N / Z | NONE | FIXED | NONE | FIXED |
| P08 binary 0 / 1 | FIXED | NONE | NONE | FIXED |
| P09 path graph / its complement | NONE | FIXED | NONE | FIXED |
| P10 electron / positron (control) | FIXED | NONE | VARIABLE | VARIABLE |
| P11 2 / 3 (successor) | NONE | NONE | NONE | NONE |
| P12 LP / its dual | NONE | FIXED | FIXED | FIXED |

## Against the locked predictions

- **P1 (control check): passed.** All three physical controls have a VARIABLE third, so the test can see a third where one exists.
- **P2 (the owner's claim): failed as run.** 4 of the 9 mathematical pairs got a third (all FIXED): N/Z, binary 0/1, the graph complement and the LP dual. Five got NONE in every place: the sets, 440/880, 35/12, ∅/{∅} and 2/3.
- **P3 (my "fixed third" hypothesis): met in the count, but only half supported.** None of the 9 got a VARIABLE third. But 5 of them got no third at all, so "the third is there but held fixed" covers only 4 of 9.
- **P4 (search failure): not met.** No mathematical pair got a VARIABLE third.

## The critic's corrections, which weaken these numbers

**The checker missed candidates, so some NONEs are misses, not absences.** 21 of 36 rows had no candidate, and "none" was graded NONE automatically.
- P01 has an obvious universe ({1..6}) and parity (n mod 2).
- P04 has its prime factorizations ({5,7} against {2,3}).
- P09 has the complete graph on four vertices as its universe.

Only one model proposed candidates.

**The rubric graded by subject.** A medium got VARIABLE in physics, while a universe got FIXED in maths, although both pass the same test. P08's width probably should be VARIABLE: in 2-bit words NOT 00 = 11, not 01. Laws of nature and theorems (CPT, strong duality) had no slot in the rubric, and the judges split on them.

**Other problems:**
- The judges did not check whether a candidate is true, or whether it only restates the relation (P06 surrounding).
- The same candidate appeared in several places, so places were double-counted.
- There was one run, with no repeats, and all judges come from one vendor.

## A pattern the checker named

For the hardest pairs, the nearest candidates are real but **interchangeable**:
- 35/12: any Bézout witness (3·12 − 35 = 1, 11·35 − 32·12 = 1, …).
- ∅/{∅}: any set-building operation.
- 2/3: any encoding (von Neumann, Zermelo).

Each carries the relation identically. The grades had no slot for "a conduit exists, but any one of many carries the same signal".

## Reading

Round 1 neither confirms nor refutes the owner's claim. It shows two things:
- The thirds that physical pairs have can be found and can vary.
- In mathematics they are either fixed or interchangeable, and the checker missed some.

Round 2 (`PLACES_PREREG_r2.md`) fixes the method before anything is concluded.
