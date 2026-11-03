# Evidence for Skill Step 0.7, the 3/6/9 check (2026-11-01)

Step 0.7 of `SQ_DISTORTION_CHECK_V9_SKILL.md` cites these files. They were run outside this repository and copied here. Except for the three files listed under "Edited for this copy", they are copied byte for byte.

| File | What it is | Strength |
|---|---|---|
| `triad_test/RESULTS.md` | The triad-lens test: a "two things that should be three" prompt against a plain prompt on 24 written systems, with two audit addenda. | In-sample. One reader model, one judge, items written to contain a connecting third. |
| `triad_test/items.json`, `verdicts.json`, `tally.json` | The items, the judge's verdicts and the tally behind `RESULTS.md`. | Raw data. |
| `triad_test/PLACES_PREREG.md`, `PLACES_PREREG_r2.md`, `PLACES_PREREG_r3.md` | Pre-registrations of the three-place check (rounds 1 and 2) and the choice check (round 3). | Written and hashed before each round ran. The SHA-256 of each copy here matches `PLACES_RUNLOG.txt`. |
| `triad_test/PLACES_RUNLOG.txt` | The hashes, and launch times for rounds 1 and 2. | Run record. |
| `triad_test/PLACES_RESULTS.md`, `PLACES_RESULTS_r2r3.md` | Results against the locked predictions, with the critics' corrections. | In-sample, one run per round, all proposers and judges from one vendor. |
| `triad_test/places_r1_raw.json`, `places_r2_raw.json`, `places_r3_raw.json` | Raw workflow output of the three rounds. | Raw data. |
| `law_of_one/RA_DENSITIES_1.md`, `RA_DENSITIES_2.md` | Two verified lookups in the Ra Material: densities, threes, choice, and what each density adds. | Verified against the source by a separate verifier, then read for claim strength (`C33`, `C35`). Claims carry source labels (RA and GUIDE; the second also defines COMMON). |
| `law_of_one/ra_guide_1_raw.json`, `ra_guide_2_raw.json` | Raw output of the guide, verifier and label reader. | Raw data, edited for this copy (below). |

## Edited for this copy

- **`law_of_one/ra_guide_1_raw.json`, `ra_guide_2_raw.json`.** Following this repository's practice of not republishing Ra's words at length (see `bench/2026-11-01-bridge/README.md`), each verbatim Ra quotation in `result.guide.claims[].quote` is replaced by a pointer to its session on lawofone.info. The workflow's prompt and result previews are blanked, and one local file path is removed. A `_public_copy` field at the top of each file records what was changed. The verifier's verbatim checks were run on the unedited quotes, so they cannot be re-run from this copy without the source.
- **`triad_test/RESULTS.md`.** One local folder path is replaced by a description.

## Not included

- `PREREG_v5.md` and `PREREG_v5_upper.md`, which Step 0.7's level table cites. They belong to the v5 experiment, a levels pilot outside this repository whose pre-registration is written but not yet hashed in its run log. They are pending, and will be added once that run log records their hashes.
- The scripts that ran these workflows.
