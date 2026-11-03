# Held-out evaluation: count & identity audit

Audit: `audit_frozen.mjs`. Corpus: `test_corvid`, written by an agent that never saw the audit. Key entries: 66 (33 bound, 33 free).

Clean corpus: passes (no false findings)

| Numbers | Mutants | Caught | Caught at the changed number |
|---|---|---|---|
| bound, ×2 | 25 | 9/25 (36%) | 9/25 (36%) |
| bound, +1 | 20 | 10/20 (50%) | 9/20 (45%) |
| bound, +10% | 5 | 0/5 (0%) | 0/5 (0%) |
| free, ×2 | 31 | 3/31 (10%) | 3/31 (10%) |
| free, +1 | 19 | 0/19 (0%) | 0/19 (0%) |
| free, +10% | 11 | 1/11 (9%) | 1/11 (9%) |

Bound key entries never mutated (number words, or numbers inside identifiers): 8 of 33 — "four", "4", "three", "three", "four", "five", "four", "five".

Bound catches by the rules that fired (letters as in the audit header): B: 7, E: 5, F: 6, BF: 1.

Crashes: 0.

## Bound numbers the audit missed

| File | Change | Must agree with |
|---|---|---|
| SQ_D | 240 → 480 (×2) | restates fleet total 240 |
| SQ_D | 240 → 241 (+1) | restates fleet total 240 |
| FIDE | 96 → 192 (×2) | hall split sums to fleet total 240 |
| FIDE | 96 → 97 (+1) | hall split sums to fleet total 240 |
| FIDE | 144 → 288 (×2) | hall split sums to fleet total 240 |
| FIDE | 144 → 145 (+1) | hall split sums to fleet total 240 |
| FIDE | 3.6 → 7.2 (×2) | pack voltage 14.4 = 4 cells x 3.6 V |
| FIDE | 3.6 → 4.0 (+10%) | pack voltage 14.4 = 4 cells x 3.6 V |
| FIDE | 14.4 → 28.8 (×2) | 14.4 = 4 x 3.6; 93.6 = 14.4 x 6.5 |
| FIDE | 14.4 → 15.8 (+10%) | 14.4 = 4 x 3.6; 93.6 = 14.4 x 6.5 |
| FIDE | 6.5 → 13.0 (×2) | 93.6 = 14.4 x 6.5 (capacity factor) |
| FIDE | 6.5 → 7.2 (+10%) | 93.6 = 14.4 x 6.5 (capacity factor) |
| FIDE | 93.6 → 187.2 (×2) | pack energy = 14.4 x 6.5; restated in handoff |
| FIDE | 93.6 → 103.0 (+10%) | pack energy = 14.4 x 6.5; restated in handoff |
| FIDE | 256 → 512 (×2) | frame payload = 64 x 4 |
| FIDE | 2 → 4 (×2) | same quantity as 65,536 |
| FIDE | 2 → 3 (+1) | same quantity as 65,536 |
| FIDE | 8 → 16 (×2) | 24 hours = 3 shifts x 8 hours |
| FIDE | 24 → 48 (×2) | 24 = 3 x 8 |
| FIDE | 24 → 25 (+1) | 24 = 3 x 8 |
| FIDE | 55 → 56 (+1) | utilization shares sum to 100% |
| FIDE | 20 → 40 (×2) | utilization shares sum to 100% |
| FIDE | 20 → 21 (+1) | utilization shares sum to 100% |
| FIDE | 15 → 30 (×2) | utilization shares sum to 100% |
| FIDE | 15 → 16 (+1) | utilization shares sum to 100% |
| FIDE | 10 → 20 (×2) | utilization shares sum to 100% |
| FIDE | 10 → 11 (+1) | utilization shares sum to 100% |
| FIDE | 5 → 10 (×2) | 12 robots = 5% of fleet total 240 |
| FIDE | 5 → 6 (+1) | 12 robots = 5% of fleet total 240 |
| ARGO | 93.6 → 187.2 (×2) | restates pack energy 14.4 x 6.5 |
| ARGO | 93.6 → 103.0 (+10%) | restates pack energy 14.4 x 6.5 |

## Bound numbers caught, with the rules that fired

| File | Change | Rules | At the changed number |
|---|---|---|---|
| SQ_D | 12 → 24 (×2) | B | yes |
| SQ_D | 12 → 13 (+1) | B | yes |
| SQ_D | 100 → 200 (×2) | E | yes |
| SQ_D | 100 → 101 (+1) | E | yes |
| FIDE | 240 → 480 (×2) | B | yes |
| FIDE | 240 → 241 (+1) | B | yes |
| FIDE | 64 → 128 (×2) | F | yes |
| FIDE | 64 → 65 (+1) | F | yes |
| FIDE | 256 → 257 (+1) | F | yes |
| FIDE | 65,536 → 131072 (×2) | F | yes |
| FIDE | 65,536 → 65537 (+1) | F | yes |
| FIDE | 8 → 9 (+1) | F | no |
| FIDE | 55 → 110 (×2) | E | yes |
| FIDE | 100 → 200 (×2) | E | yes |
| FIDE | 100 → 101 (+1) | E | yes |
| FIDE | 12 → 24 (×2) | B | yes |
| FIDE | 12 → 13 (+1) | BF | yes |
| ARGO | 240 → 480 (×2) | B | yes |
| ARGO | 240 → 241 (+1) | B | yes |

## Free numbers the audit flagged

| File | Change | Rules |
|---|---|---|
| FIDE | 95 → 190 (×2) | E |
| FIDE | 99.7 → 199.4 (×2) | E |
| FIDE | 99.7 → 109.7 (+10%) | E |
| ARGO | 95 → 190 (×2) | E |
