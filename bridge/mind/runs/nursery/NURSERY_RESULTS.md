# The seasonal nursery W0: first results (2026-11-01)

Revised after a fresh number check and claim-strength read (`check_results_raw.json`). Every figure in the tables was right. The changes:
- the trunk's reach is now stated as its feed-forward window, with its recurrent paths;
- "captures none" and "does not use it" are now the CE statements the data support;
- the help-from-another-timeline split is per token;
- the checkpoint, data-order and scramble caveats are added.

**What ran.** `mind/nursery.mjs` (afaa90a8…) `--world --arm RC`, model seeds 1–3, 40,000 steps each, on the 3080 PC.
- **Priority:** below normal, set by the WMI launcher `mind/nursery_start.ps1` and seen as BelowNormal in the PC's process list.
- **Time:** 1,467.5–1,639.4 s per run.
- **Preset:** 2314cbbb….
- **Training logs:** nursery worlds 20000–20019, 327,680 ticks per character. Each run read 320,000 of them in one pass, starting about 4,500 ticks in. The count-model references are fitted on all 327,680.
- **Held-out logs:** worlds 29000–29001, 32,768 ticks per character: 131,072 ANSWER and 131,072 OBS targets.

**The same data on both machines.** The memoryless count model gives 0.3096994566997321 on the PC's runs and on the laptop's smoke run, to the last digit. `mind/nursery_refs.mjs` rebuilds the logs and reproduces it exactly. That is strong evidence the references use the logs the mind saw, though only that one statistic was compared. `mind/memory_age.mjs` rebuilds the held-out lives without that check.

**Status of the readouts.** The per-target CE split and the memoryless count model were declared as readouts in MIND_STEP7.md before the run. The other references and the memory-age readout were added afterwards. None was a locked prediction, and none decides anything.

## Held-out cross-entropy at step 40,000 (nats; lower is better)

| Seed | All scored targets | ANSWER | OBS | TICK | All, without the bus | All, gates scrambled |
|---|---|---|---|---|---|---|
| 1 | 0.6403 | 0.3434 | 1.5775 | 0.0000 | 0.6400 | 0.7553 |
| 2 | 0.6308 | 0.3297 | 1.5627 | 0.0000 | 0.6305 | 0.7317 |
| 3 | 0.6279 | 0.3201 | 1.5636 | 0.0000 | 0.6260 | 0.8045 |

"Without the bus": no help from another timeline on the held-out run. "Gates scrambled": gate values deranged across the four characters.

## References: count models fitted on the training logs, scored on the held-out logs

| Target | Context | CE |
|---|---|---|
| ANSWER | (OBS, ACTION): rung 0's own context, no memory | 0.3097 |
| ANSWER | (OBS, ACTION, last outcome of eating this kind), kept only when in the trunk's feed-forward reach at that moment | 0.1895 |
| ANSWER | the same, kept only when at most 4 ticks old | 0.1938 |
| ANSWER | the same, kept only when at most 7 ticks old | 0.1421 |
| ANSWER | (OBS, ACTION, last outcome of eating this kind in this life) | 0.0251 |
| ANSWER | (OBS, ACTION, the item's true effect this season): the table oracle | 0.0043 |
| OBS | (ANSWER, TICK): rung 0's own context | 2.9949 |
| OBS | (previous OBS, ACTION, ANSWER), add-0.5 | 1.6934 |
| OBS | the same, add-0.01 | 1.6792 |
| OBS | the same, fitted on the held-out logs themselves: an optimistic floor for any previous-tick predictor | 1.6698 |

The count models are fitted to their target alone, with the exact discrete context. The mind shares its capacity across all targets: ANSWER is about a third of its main loss terms, next to OBS at about 1.57 nats per target. The comparisons are therefore not like for like.

## What the readouts show

1. **Observations: the mind draws on more than the previous tick.** Its OBS CE (1.558–1.578, with or without the bus) is 0.09–0.11 below the best any previous-tick predictor could score here (1.670, fitted on the held-out logs themselves). [inference] It uses older context, such as the recent run of items.
2. **Answers: at step 40,000 the mind does not beat the memoryless count model.** Its ANSWER CE (0.320–0.343) is 0.010–0.034 above that model (0.310). Memory is worth a great deal here:
   - the last outcome of eating each kind brings the count model to 0.025;
   - the true table brings it to 0.004;
   - memory only inside the trunk's feed-forward reach brings it to 0.190.

   No gain from memory shows in the mind's ANSWER CE. That does not show the trunk carries no memory: its ANSWER CE was not broken down by memory age.
3. **Where the useful memory sits.** For held-out eats, the last time the same character ate that kind was a median of 6 ticks back: 37.6% within 4 ticks, 56.4% within 7, 84.6% within 16. The trunk's feed-forward window:
   - u1p holds the last tick;
   - u2, refreshed every 4 ticks, holds the 4 ticks before its refresh;
   - so right after a refresh it covers ages 1–4, and just before the next it covers ages 1 and 4–7, with ticks 2–3 back not covered.
   
   Counting the refresh phase, 40.5% of eats have their last same-kind eat in reach at that moment. Beyond the window, the trunk has recurrent paths with no fixed limit: at each refresh, u2 takes in rung 0's last state, which already carries the old u2 (bridge 0→2, G02 mean 0.59–0.86), and the sting's running means feed u2 and the gates. Training gradients stop at the 32-token step, which is 8 ticks. Season-scale memory is a separate gap, already named in the critique (finding 5: no rung covers a season, and the design leaves season tracking to the live head updates).
4. **Help from another timeline changes little here.** Removing it lowers overall CE on all three seeds, by 0.0003, 0.0002 and 0.0019. No noise floor was computed. G20 averages only 0.15–0.30 on all tokens, so bridge 2 passes little from any source. On the tokens where bridge 2 carried another character's u2 (26.8%), CE with the bus minus without is about +0.001, +0.001 and +0.007. That is derived from the two runs, assuming unmarked tokens are unaffected.
5. **The trunk depends on each character's own gate values.** Deranging all the gates across characters raises CE by 0.115, 0.101 and 0.177 overall: 0.016, 0.011 and 0.022 on ANSWER, and 0.33, 0.28 and 0.51 on OBS. This test does not separate information carried by the gates from disruption by gate values never seen in training. Even the fixed TICK separator gets worse, from about 0 to 0.016. The learned sting weights are non-zero (`ws0`, `ws1` and `ws20` in each record). How the gates use the sting was not read out.
6. **The learning curve ends on a rise, but the seeds share the data order.** The curve is measured on the first 1,280 ticks of held-out world 29000 per character (5,120 tokens, 3,840 scored). It fell from 0.9751, 0.9541 and 1.0206 at step 500 to 0.6195, 0.5969 and 0.6078 at step 30,000, then reached 0.6768, 0.6495 and 0.6335 at step 40,000.
   - The three seeds start within about 60 steps of each other in the same logs, so they meet the same data at the same step.
   - Earlier spikes of similar size line up across the seeds (steps 5,500, 8,500, 12,000, 19,500) and recovered.
   - The final rise starts as training enters the last world (20019, from about step 38,300).
   
   Data order is a candidate cause. Whether the final rise is another transient is not known.

## What it means for the characters

- [inference, untested] A choice rule built on these counterfactuals (§4.4) would probably not choose like a mind that remembers what each fruit did. The nursery measured CE on the behaviour policy's actions, not on choices, so this needs the choice-rule test.
- **The design's own route to season memory is the live loop** (§4.6). The private heads take one Adam step per answer, so they may learn the current table within a life. A 600-tick smoke test on one world showed live heads at answer CE 0.232 against 0.538 frozen. That is too short to call a result. The frozen-against-live test, on full held-out lives, is next.
- **Candidates for a nursery v2**, to be pre-registered before any run:
  - weight answer targets more;
  - give the heads direct access to the rung-1 and rung-2 state;
  - a season-scale node (finding 5);
  - shuffle the life order per seed, and evaluate earlier checkpoints, before training longer.

## Limits

- Three model seeds, which share the training data order (start offsets within about 60 steps).
- One behaviour policy (half random), one preset, two held-out lives.
- Every held-out readout comes from the step-40,000 checkpoint, which sits on the curve's late rise.
- No noise floor was computed, although each record holds block sums for a block bootstrap.
- The references are count models on declared contexts. They are not the best possible models of the world.
