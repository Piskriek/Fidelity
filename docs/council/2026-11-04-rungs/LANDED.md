# LANDED: council round 2026-11-04-rungs

## News back

Status: pending

**What landed** (first committed 17:36Z and revised 19:50Z after the round's review; branch `francois/serene-euler-51wj3e`, addon v1.8.8):
- **The recorded reading per rung**, as one evaluator (`packages/triad-369/src/rung_ledger.mjs`), one ledger of 82 readings (`docs/rungs/ledger.json`) and its test (`tools/rung-ledger.test.mjs`, 16 tests). The addon's fits now answer to the ledger: a value with no reading behind it fails `npm test`, and so does a status that says more than the ledger.
- **The fits, written back from the director's second reading of all 35 camera-distance fit shots:** barrel 0.6 to 0.51, crate 0.42 to 0.37, canopy04 to 5.6 (a trial step). Each one prints its status in place of "measured from your reports", and none is confirmed yet. The bush stays at x2: undecided within its readings' precision, and in need of a vertical offset no camera factor gives.
- **The camera's first paired reading, ready in the client.** Every shot records the pose and every drawable placement's prediction at its shutter, and twin steps take an overlay-off second shot. No saved choice is written.
- **The review:** 34 of 39 findings confirmed by skeptics, all addressed (RESUME §"Council round 2026-11-04-rungs").

**Evidence.**
- `node --test tools/rung-ledger.test.mjs`: 16/16.
- Headless: 68/68 over both SetLight profiles.
- `node tools/test_ematrix_math.mjs`: 14/14.
- `npm test`: 201 tests, 200 pass, 0 fail, 1 skipped (the real-tile case without `EMATRIX_TILES`), at 19:46Z.

**Waiting for:**
- the tenth report: H009, re-requested 17:32Z; H005 deploys v1.8.8;
- the director's reading of its twins into the ledger;
- the owner's word on the eight rulings in `STEER.md`.

**Then this becomes:**
- `used`, if the shots map to rows, the verdicts match the readings, and the projection gets its first verdict;
- `changed`, if the twins show the procedure must change (a turned pose, the chat moved, a closer zoom notch);
- `nofit`, if a twin's pose differs from its first shot's, no named foot can be read, or the held-out residual stays above τ.

The next ASK is in `STEER.md`.
