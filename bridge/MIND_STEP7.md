# Step 7: the characters' mind, starting with the nursery

This is the build note for BRIDGE_DESIGN.md §4. It records what was fixed in advance, what changed from the design and why, and what is still missing. Nothing here is a result.

## What was fixed in advance, and what it gives

- **Base architecture (§4.1):** if v6's V2 (RC ahead of R9) passed, the base is RC. **V2 passed, so the base is RC**: R9 plus the top and the downward gates feeling the stream's own sting.
- v6 showed that RC lowers CE. It did not show how RC uses the sting (RESULTS_v6.md, revised). The mind therefore records its learned sting weights (ws0, ws1, ws20) in every run record, which v6 did not report.

## Changes from the design, each with its reason

| Design | Built | Why |
|---|---|---|
| Copy v6's operations into `mind/v6_ops.mjs` | `mind/make_nursery.mjs` generates `mind/nursery.mjs` from `levels_v6.mjs` by exact-once patches, after checking the v6 hash (fcec7505…) | The trainer is v6's own code, not a copy that can drift. Every change sits behind `--world`, so check N3 (text mode reproduces v6) holds by construction and is also run. |
| A 5-number sting: pain, fear, surprise, relief, running relief | **3 numbers**: surprise, relief and running relief, the same as v6's RC | The owner's ruling (2026-11-01): pain is chosen, not set, and felt pain is off. The fear term was to go live only after the seat approval, a step the ruling dropped. Fear stays information: it is already in the OBS token. |
| V = 34, BODY and ITEM tokens | V = 120: one block per tick (OBS, ACTION, ANSWER, TICK) | Critique finding 1, already built in step 2 |
| Bus donor per segment by hash (§3.4) | As designed: bridge 2 only, receiver with probability 0.25 per 64-tick segment, one donor per segment by `hash32` | v6 redrew donors on every character and also marked bridges 0 and 1. In the world, help from another timeline is bridge 2 only, and bridges 0 and 1 carry the character's own help. |
| The sting is set after ANSWER | As designed: set after each ANSWER, held otherwise | In v6 it moved on every character |

## The nursery (§4.8), as built

- **Data.** Each character has one token log, made by `runLife` (the same port and validator as every arm):
  - nursery worlds: seeds 20000–20019 (20 lives, 327,680 ticks per character), held out 29000–29001;
  - the policy, which does not know the table: on half the ticks a uniform action, otherwise eat any fruit when E ≤ 10, else REST when H ≤ 10, else PASS. Both are exact predicates of the observation bands.
- **Layout.** The four logs are laid end to end, so v6's four streams are the four characters. They start from one shared offset on a tick boundary, so they stay in lockstep: the same world, the same tick. A guard throws if a stream falls out of tick alignment.
- **Masking.** ACTION targets are masked on every head, so the trunk learns how the world answers, not what the policy does.
- **Readouts (decide nothing):**
  - held-out CE on ANSWER, OBS and TICK targets separately;
  - a count model's ANSWER CE on rung 0's own context (OBS, ACTION). A mind below it is using memory beyond the current tick, such as which fruit has been toxic this season.
- **Not done yet:** the stationary nursery (the E3 control), the fast loop with private heads (§4.6), the choice rule (§4.4), and the live lens on neural minds.

## Checks

| Check | What | Status |
|---|---|---|
| N3 | Text mode reproduces `levels_v6.mjs --arm R9 --seed 1 --steps 300` exactly | **pass**: 0 record differences, weights byte-identical |
| G-w | The gradient check passes in world mode (masked targets, bridge-2-only bus) | **pass**: 2,469 entries, worst 0. A planted 0.1% gradient error was caught on every parameter |
| S-w | A 300-step world-mode RC run trains | **runs**: held-out answer CE 0.716, against the count model's 0.310. 300 steps is far too short to judge; the full nursery is 40,000 steps |
| R-w | Five reviewers, each finding checked by two skeptics | **7 of 14 findings confirmed and fixed** (`mind/runs/review_nursery_raw.json`). The fixes: masked slots kept out of the bridge-2, pure-cell and swap tallies and out of rung 0's measured state; `nlogU` taken over scored targets; the bridge-2 donor's u2 is the value published before the character (§3.4); the gradient and causality checks use the lockstep layout |
| After the fixes | N3, N2-w, G-w, S-w re-run on `nursery.mjs` afaa90a8 | **N3 pass** (weights identical). **N2-w world causality pass**: 7 arms, 3,108 records, 0 changed. **S-w**: the fixed readout sums back to the overall CE exactly (it was ×0.75). **G-w**: every arm passes at h = 1e-5 except S (2.5e-4). S passes at h = 3e-6 and gets worse at 3e-5, which is a ReLU kink, not a tape error. RC passes at every h |

## From thoughts to dialog and voice (after the fast loop)

The owner pointed out on 2026-11-01 that MarbleGp already has the translation and voice parts, and offered them. Once the minds run live (§4.6), each character gets a **thought record** each tick: declared fields only.

**The fields:**
- the predicted answer for each action (what it expects EAT, PASS and REST to bring);
- the action chosen, and its expected value;
- the sting (surprise, and whether the help helped);
- G20 and the donor (how much it trusts help from another timeline, and from whom).

**From record to voice:**
- The record maps onto MarbleGp's Plan 58 §18 rungs. Its `sem:` roots carry typed slots (for example EXPECT item, effect, p; HELP_TAKEN from, trust; HELP_LANDED relief). Its `emo:` envelope is set from the sting, never from pain, because felt pain is off.
- The pure narrator scheduler (`packages/narrator`) turns those into lines.
- `speakCompanionVoice(text, prosody)` (`apps/web/src/play/companion-chat.tsx:227`, the browser's speech synthesis), or the mentor's RUN.world TTS voice, reads them aloud.

**The rule is lens truth (T3):**
- Every spoken slot must decode back to the record it came from. A line whose slots cannot be filled is dropped, as MarbleGp's System notices already do.
- The harness map found two leaks this must not copy:
  - canned claims ("I read copper and quartz deposits nearby" on any mention of ore);
  - an outside AI able to make the drone say any text (`companion-chat.tsx:886-887`).
- A character speaks only from its own thought record.

## Choice rule and values: waiting on the owner

The choice rule (§4.4) scores each action by the declared value table. The preset holds it as the character's wants, not felt. "What counts as better" and "value by need" are still open owner decisions (§8). The nursery does not need them: it learns the world model only. The fast loop will take the table as a declared input, labelled pending.

## 3/6/9 check (a lens, not a measurement)

- **Node.**
  - Thing: the trunk's world model.
  - Opposite: imitating behaviour, which the mask removes.
  - Test: answer CE against the count model.
  - Around: the engine. Inside: the rungs. Bridge: the token port.
- **Bridge.** Help between characters has the permit (the receiver's gate) and a way back to the receiver (its relief). It has **no ask** and **no way back to the donor**. Both are named, not forced (§3.5, V7 #1 and #2).
- **Whole.** Within one character the triangle closes: rung 0 ↔ rung 2, and the sting goes up. Between characters it does not: help flows one way, and there are no groups larger than one donor and one receiver.
- **Choice.** In the nursery nothing chooses on its predictions: the policy is the designer's. In the live world the character chooses by a declared rule over its own predictions, the receiver chooses whether to take help, and the owner chooses the values.
- **Missing, named.**
  - The ask.
  - Gratitude: the receiver's "your help landed" returning to the donor, felt as information, not as a score to maximise.
  - Groups: a triad or a golf four-ball as one unit that shares.
  - Life seams: the stream does not mark them.

  - Prayer: the ask turned upward, to a higher level (the higher self, or the owner in the seat). The owner proposed intervention by "aliens or gods so they start to pray". In the verified Ra lookup (law_of_one/RA_HARVEST_3.md, item 9), service is scaled to the call, and the call comes first. Ra describes its own appearance, which led to worship, as a confusion (23.6). So help from above answers a prayer, in proportion to it, and does not provoke one. This is a candidate for the owner, not a ruling.

  - Helpers as individuals: help that arrives as a service-to-others being, not a message. The owner asked on 2026-11-01: "help somtimes takes the for of sto individuals, that in there?" It is not built. The nearest named candidate is wanderers (RA_HARVEST_3.md): beings from a later level, born as fresh characters with their memory veiled. Polarity is not modelled yet: the soul line's `pol` stays at its default, because B179 has no update rule.
  - Service-to-self beings as catalyst: the owner clarified, "sts are asked to serve as catalysts". It is not built. Today a character's catalysts come from the world (toxic fruit, seasons, hunger), and `chose=` lists the ones its higher self accepts. A service-to-self character offering catalyst would be one more kind on that list, reaching only a character whose higher self chose it, with intensity that can only go down. That reading fits "asked", but it is my mapping, not a ruling. A verified Ra lookup (law_of_one, lookup 5) is checking it.

  The owner raised the first three on 2026-11-01 ("how do they help each other? how do they do gratitude"). They enter as stage-2 changes, one per arm, with predictions locked first.
