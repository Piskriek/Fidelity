# ReefLoom Handoff Summary

Prepared for whoever picks up the simulation core next. It describes where the work stands, what to do first and what is likely to bite. It deliberately does not repeat the whole design plan; read that first, then come back here.

## Where things stand

- Kernels: benthic growth, the bleaching response, implicit diffusion and the tile scheduler are finished and covered by tests.
- Agents: the fixed-size pool allocator and the movement step are finished. The predation closure is written but has only been exercised on toy inputs.
- Reference run: the baseline scenario now completes the full 73,000-tick experiment and reproduces exactly when the worker count changes.
- Tests: all 48 tests pass on the main branch. The golden files were regenerated once, deliberately, after the tick order was fixed.
- Checkpoint and resume work end to end. A resumed run matches an uninterrupted one at every later checkpoint.

## What I would do first

1. Run the full suite on a clean checkout and confirm that the pass count matches what is written above. If it does not, stop and find out why before touching anything.
2. Read the parameter table in the plan and compare it against the defaults actually compiled into the driver. I found one mismatch during the last cleanup and fixed it, but I did not audit every entry.
3. Rerun the baseline scenario with two different worker counts and diff the final checkpoints byte for byte.
4. Only then start on the urchin and starfish calibration, which needs data we do not yet have.

## Things that will bite

- The occupancy mask has reserved bits. An early prototype wrote stray values there and the checkpoint diff caught it. Keep the zero-fill discipline.
- Cover fields are half precision. Near zero they quantise coarsely, so a cell can appear to recover in one tick and stall in the next. This is a display artefact of the storage type, not a model bug, but it has already confused one person.
- Agents that are rejected at the occupancy cap are counted, not logged individually. If the counter is nonzero in a run, the run is still valid, but the ensemble summary should say so.
- Do not reorder the stages inside a tick to fix a local problem. Every golden file depends on that order.

## Performance notes

The last benchmark gave a mean tick time of 38 ms on 6 worker threads, measured on a cold laptop with nothing else running. I have not repeated it on the reference machine, so treat the figure as indicative. Almost all of the remaining time is in the dispersal pass and in memory traffic between the two state buffers.

## Calibration plan

The next tuning sweep will vary the grazing coefficient by ±20% around its current default and look at coral recovery time after the pulse scenario. The sweep driver exists but has not been run at scale. Please keep every sweep result tagged with the plan revision and the build revision, otherwise nobody will be able to say later which numbers belong together.

## Open questions

- Whether forward Euler will survive a recalibration that raises the growth rates substantially.
- Whether the single-survey weighting for initial coral composition is good enough, or whether a second survey should be requested.
- Who owns the storm calendar going forward. At present it is edited by hand and not versioned.

## Contacts and files

The plan, the distortion checklist and this note live together in the design folder. The scenario files, golden outputs and sweep configurations are in the repository under their usual directories. If something is not where this note says it should be, trust the repository over the note.
