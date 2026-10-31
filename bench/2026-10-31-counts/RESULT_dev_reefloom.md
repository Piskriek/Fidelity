# Held-out evaluation: count & identity audit

Audit: `audit_frozen.mjs`. Corpus: `dev_reefloom`, written by an agent that never saw the audit. Key entries: 69 (35 bound, 34 free).

Clean corpus: passes (no false findings)

| Numbers | Mutants | Caught | Caught at the changed number |
|---|---|---|---|
| bound, ×2 | 32 | 21/32 (66%) | 21/32 (66%) |
| bound, +1 | 32 | 23/32 (72%) | 23/32 (72%) |
| free, ×2 | 34 | 0/34 (0%) | 0/34 (0%) |
| free, +1 | 13 | 0/13 (0%) | 0/13 (0%) |
| free, +10% | 19 | 0/19 (0%) | 0/19 (0%) |
| unlabelled, ×2 | 7 | 0/7 (0%) | 0/7 (0%) |
| unlabelled, +1 | 7 | 0/7 (0%) | 0/7 (0%) |

Bound key entries never mutated (number words, or numbers inside identifiers): 3 of 35 — "24", "48", "73,000".

Bound catches by the rules that fired (letters as in the audit header): F: 21, I: 2, H: 13, EH: 1, EF: 1, G: 6.

Crashes: 0.

## Bound numbers the audit missed

| File | Change | Must agree with |
|---|---|---|
| SQ_D | 131,072 → 262144 (×2) | plan grid cell count (512 x 256) |
| SQ_D | 131,072 → 131073 (+1) | plan grid cell count (512 x 256) |
| SQ_D | 3,145,728 → 6291456 (×2) | plan snapshot size (131,072 x 24) |
| SQ_D | 3,145,728 → 3145729 (+1) | plan snapshot size (131,072 x 24) |
| SQ_D | 32 → 64 (×2) | plan tile count |
| SQ_D | 32 → 33 (+1) | plan tile count |
| SQ_D | 12 → 24 (×2) | plan functional group count |
| SQ_D | 12 → 13 (+1) | plan functional group count |
| FIDE | 2 → 4 (×2) | power-of-two form of 131,072 |
| FIDE | 2 → 3 (+1) | power-of-two form of 131,072 |
| FIDE | 3,145,728 → 6291456 (×2) | 131,072 cells x 24 bytes |
| FIDE | 3 → 6 (×2) | 3,145,728 bytes = 3 x 1,048,576 |
| FIDE | 6,291,456 → 12582912 (×2) | 2 x 3,145,728 (double buffer) |
| FIDE | 6,291,456 → 6291457 (+1) | 2 x 3,145,728 (double buffer) |
| FIDE | 12 → 24 (×2) | number of rows in the group table; checklist restates |
| FIDE | 12 → 13 (+1) | number of rows in the group table; checklist restates |
| FIDE | 4,096 → 8192 (×2) | 131,072 cells / 32 tiles |
| FIDE | 32,768 → 32769 (+1) | 2^15 |
| ARGO | 48 → 96 (×2) | plan total test count (40 + 8) |
| ARGO | 48 → 49 (+1) | plan total test count (40 + 8) |

## Bound numbers caught, with the rules that fired

| File | Change | Rules | At the changed number |
|---|---|---|---|
| FIDE | 512 → 1024 (×2) | F | yes |
| FIDE | 512 → 513 (+1) | F | yes |
| FIDE | 256 → 512 (×2) | F | yes |
| FIDE | 256 → 257 (+1) | F | yes |
| FIDE | 131,072 → 262144 (×2) | I | yes |
| FIDE | 131,072 → 131073 (+1) | I | yes |
| FIDE | 3,145,728 → 3145729 (+1) | F | yes |
| FIDE | 3 → 4 (+1) | F | yes |
| FIDE | 4,096 → 4097 (+1) | F | yes |
| FIDE | 32 → 64 (×2) | F | yes |
| FIDE | 32 → 33 (+1) | F | yes |
| FIDE | 28 → 56 (×2) | H | yes |
| FIDE | 28 → 29 (+1) | H | yes |
| FIDE | 17 → 34 (×2) | H | yes |
| FIDE | 17 → 18 (+1) | H | yes |
| FIDE | 55 → 110 (×2) | EH | yes |
| FIDE | 55 → 56 (+1) | H | yes |
| FIDE | 1,460 → 2920 (×2) | F | yes |
| FIDE | 1,460 → 1461 (+1) | F | yes |
| FIDE | 50 → 100 (×2) | F | yes |
| FIDE | 50 → 51 (+1) | F | yes |
| FIDE | 73,000 → 146000 (×2) | F | yes |
| FIDE | 73,000 → 73001 (+1) | F | yes |
| FIDE | 2 → 4 (×2) | F | yes |
| FIDE | 2 → 3 (+1) | F | yes |
| FIDE | 32,768 → 65536 (×2) | F | yes |
| FIDE | 75 → 150 (×2) | EF | yes |
| FIDE | 75 → 76 (+1) | F | yes |
| FIDE | 24,576 → 49152 (×2) | F | yes |
| FIDE | 24,576 → 24577 (+1) | F | yes |
| FIDE | 20,000 → 40000 (×2) | H | yes |
| FIDE | 20,000 → 20001 (+1) | H | yes |
| FIDE | 9,000 → 18000 (×2) | H | yes |
| FIDE | 9,000 → 9001 (+1) | H | yes |
| FIDE | 3,000 → 6000 (×2) | H | yes |
| FIDE | 3,000 → 3001 (+1) | H | yes |
| FIDE | 8,000 → 16000 (×2) | H | yes |
| FIDE | 8,000 → 8001 (+1) | H | yes |
| FIDE | 40 → 80 (×2) | G | yes |
| FIDE | 40 → 41 (+1) | G | yes |
| FIDE | 8 → 16 (×2) | G | yes |
| FIDE | 8 → 9 (+1) | G | yes |
| FIDE | 48 → 96 (×2) | G | yes |
| FIDE | 48 → 49 (+1) | G | yes |

## Free numbers the audit flagged

| File | Change | Rules |
|---|---|---|
