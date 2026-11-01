# Collapse causes in the v1a lives: a post-hoc diagnostic (2026-11-01)

This is not a test. It re-ran 48 of the 192 scored v1a lives:
- arms F and L, model seeds 1–3, worlds 101–108;
- with `live_diag.mjs` (539a05ef): `live.mjs` 7f814cbf plus tallies of collapses by the world's recorded cause, the loop-breaks, and each character's intensity at the end of its life;
- on the run machine, launched at below-normal priority by its WMI launcher (the setting is not in the run log).

It was run after v1a was scored, to look at the seed split in collapses that the v1a write-up reported.

**Reproduction.** All 48 lives match their scored records exactly, in NGE and in collapses per 10k ticks. K5 = 0 in every one. So adding the tallies changed no behaviour, and the runner gives identical lives across versions.

## Collapses by cause (summed over 8 worlds × 4 characters)

| Model seed | F toxin | F hunger | L toxin | L hunger |
|---|---|---|---|---|
| 1 | 6,306 | 7,720 | 5,389 | 5,685 |
| 2 | 4,394 | 4,384 | 5,484 | 5,666 |
| 3 | 4,440 | 4,407 | 5,385 | 5,369 |

The world records only toxin, hunger and other; "other" was 0 throughout.

## What it shows

- **The seed split shows in both causes.**
  - On seed 1, F collapses more than L, mostly from hunger (7,720 against 5,685), and also from toxin.
  - On seeds 2 and 3, L collapses more than F, from toxin (+25% and +21%) and from hunger (+29% and +22%) about equally.
  - The v1a write-up's candidate, untested, is "passing on fruit its heads now predict as toxic leaves it with less energy". It bears on hunger collapses directly. It could also bear on toxin collapses: a toxic meal on a tick with no energy is tagged "toxin" first (`world/valleys.mjs`), and low energy drains health. Why L has more toxin collapses on seeds 2 and 3, while eating toxic fruit less often overall (0.40 against 0.61), is not explained by these readouts.
  - [inference, untested] A character with lower energy and health may be pushed over by fewer toxic meals. Intensity is a confound: a toxic meal costs 2 × ℓ health, so half as much after the loop-break. So the toxin counts can be read only once each character's break tick is known.
- **Every character in every life hit the loop-break.**
  - Each of the 192 characters here (48 lives × 4) has exactly one loop-break and ends its life at intensity 1. The world lowers intensity from 2 to 1 after three collapses from one cause (critique finding 2a).
  - The exact break tick is not recorded, but the per-512-tick scoreboard bounds it. Five collapses force three from one cause, so a character's break is certain by the window in which it reaches five. In these 48 lives every character is certified by tick 1,536 at the latest (median 512), so each ran at intensity 1 for at least 90% of its life. The same bound on all 192 scored v1a lives certifies all 768 characters by tick 4,096 at the latest (median 512), so each ran at intensity 1 for at least 75% of its life.
  - Meanwhile the characters' wants table, which drives the choice rule, assumes intensity 2: TOXIC at −4. At intensity 1 the pain term in the world's value table is 2. It is a preference term, never felt.
  - The v1a amendment's sentence "later parts of a life may run at ℓ = 1" understates this.

## What to do with it

- Before interpreting collapses in any later test, record the tick of each character's loop-break, and report readouts before and after it.
- Whether the choice rule should use the world's current intensity is a design question for the owner. The value table is still pending their review.
- The collapse guardrail the critique proposed (owner decision 17) is still not adopted.
