# LANDED: council round 2026-11-04-rungs

## News back

Status: pending

**What landed** (branch `francois/serene-euler-51wj3e`, addon v1.8.8; first committed 17:36Z, revised three times after adversarial review, evidence 22:01Z):
- **The recorded reading per rung**, as one evaluator (`packages/triad-369/src/rung_ledger.mjs`), one ledger of 82 readings (`docs/rungs/ledger.json`) and its test (`tools/rung-ledger.test.mjs`, 18 tests). The addon's fits now answer to the ledger: a value with no reading behind it fails `npm test`, and so does a status that says more than the ledger.
- **The fits, written back from the director's second reading of all 35 camera-distance fit shots:** barrel 0.6 to 0.53 and crate 0.42 to 0.38 (estimates); the tree and canopy04 to 5.6 (trials after both ran past the top edge at x2.8); the bush 2.0 to 2.44 (a trial: at x2 its base touched the frame, so x2 could never be decided). Each one prints its status in place of "measured from your reports", and none is confirmed yet. By its bounds the bush needs a vertical offset no k gives; its x2.44 twin will confirm or refute that.
- **The camera's first paired reading, ready in the client.** Every shot records the pose and every drawable placement's prediction at its shutter, and twin steps take an overlay-off second shot. No saved choice is written.
- **The reviews:** three adversarial passes; every confirmed or demonstrated finding is addressed (RESUME §"Council round 2026-11-04-rungs").

**Evidence (22:01Z).**
- `node --test tools/rung-ledger.test.mjs`: 18/18.
- Headless: 68/68 over both SetLight profiles.
- `node tools/test_ematrix_math.mjs`: 14/14.
- `npm test`: 203 tests, 202 pass, 0 fail, 1 skipped (the real-tile case without `EMATRIX_TILES`).

**Waiting for:**
- the tenth report: H009, re-requested 17:32Z; H005 deploys v1.8.8;
- the director's reading of its twins into the ledger;
- the owner's word on the eight rulings in `STEER.md`.

**Then this becomes:**
- `used`, if the shots map to rows, the verdicts match the readings, and the projection gets its first verdict;
- `changed`, if the twins show the procedure must change (a turned pose, the chat moved, a closer zoom notch);
- `nofit`, if a twin's pose differs from its first shot's, no named foot can be read, or the held-out residual stays above τ.

The next ASK is in `STEER.md`.
