# Four Valleys bridge: build status

The design is in `BRIDGE_DESIGN.md`, and its 3/6/9 critique in `BRIDGE_CRITIQUE_369.md`. The raw design run is `design_raw.json`. Every check is logged with hashes in `RUNLOG_bridge.txt`.

## Built and passing (2026-11-01)

| Step | What | Checks |
|---|---|---|
| 1 | The world: `world/valleys.mjs`, `world/hash.mjs`, `world/ledger.mjs`, the vendored Plan energy ledger and `preset/valleys_v1.json` | D0, D1, D1b, D8, W1, W1b, W2, W2b, W3, W4, W5, W6, S1 |
| 1 | The same world on every machine | **D2: identical chains on the laptop (Node 24) and the PC (Node 22), 6 worlds × 10,000 ticks** |
| 2 | Tokens: one block per tick (OBS, ACTION, ANSWER, TICK), V = 120 | B1, B1b, B2, B3, B4, B6 (8 of 904 cells undecided, one named case), L1 (lens truth) |
| 3 | The lockstep runner (in `run/`) and the reference minds O, T, S, RND | M1: the world rewards knowing the table (results below) |

M1 results:

| Mind | NGE | Collapses per 10k ticks |
|---|---|---|
| O | 49.6 | 12 |
| T | 41.9 | 127 |
| S | 31.0 | 172 |
| RND | 11.0 | 520 |

## Critique fixes applied so far

- **Finding 1.** The body and the item are fused into one OBS token, so the slot that chooses the action sees the body.
  - Full health (H 15) has its own band.
  - Health bands 1–2 and 3–4 make most collapses decidable.
  - WEAK moved to H 1–4 so that it is an exact predicate of the bands.
  - B6 measures what remains.
- **Finding 2a.** The loop-break acts per character in every arm. It is not just logged.
- **Finding 9.** The runner lives in `run/`, and `bridge/` stays synchronous.
- **Finding 11.** The refusal precedence is declared (ERR_FULL before ERR_SPENT). There are 14 ANSWER tokens, not 13.
- **Owner ruling (2026-11-01): pain is chosen, not set.**
  - Felt pain is off. A character acts on its wants and learns from the world's answers.
  - It feels pain only once it has a higher self that chooses its catalysts (the soul line's `chose=`, stage 2).
  - Within a life, intensity can only go down: `lowerIntensity` is the one writer, and test W7 checks it.
  - The "owner plays a valley and approves the pain table" step is dropped, because there is no bridge for the owner to feel it.

## Next

| Step | What |
|---|---|
| 4 | **The lens and the seat**: the owner can play a valley through the same validator, for the experience and as the owner-to-world bridge, not as a pain approval. The higher self (stage 2) holds the chosen catalysts and can only lower intensity. |
| 5–6 | Replay on the PC, then planted-leak mutants written by a fresh reviewer |
| 7–8 | The mind: v6's model reading these tokens, with private heads per character and the nursery. The gate design comes from the v5/v6 results. |
| 9–10 | Pre-registration, then the runs: frozen against live, yoked, help from another timeline |

## Owner decisions still open

See `BRIDGE_DESIGN.md` §8 and critique findings 5–7. Among them:
- what counts as "better";
- whether value depends on need;
- ERR_DOWN without pain;
- the Rule 1 consent wording;
- WEAK at H 1–4.
