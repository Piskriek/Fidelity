# ReefLoom Distortion Check (V9)

Purpose: before a design change, a result or a handoff note is accepted, a reviewer walks this list and confirms that the facts quoted in it still match the design plan. "Distortion" means any silent drift between what the plan says and what a derived document, config file or test quietly assumes. Tick a box only after looking at the source, not after recalling it from memory.

## How to use this list

- Work through the sections in order; the early sections feed the later ones.
- Write down the value you actually found beside each box, not just a tick.
- If two documents disagree, the plan wins until the plan itself is amended, and the amendment goes into the change log.

## Grid and memory

- [ ] The raster contains 131,072 cells, and the width and height in the loader multiply to exactly that figure.
- [ ] The record size equals the sum of its field sizes, and one grid snapshot occupies 3,145,728 bytes in the checkpoint payload.
- [ ] Any figure quoted for resident state is exactly twice the snapshot size, because the solver keeps two buffers.
- [ ] Float16 cover fields are clamped, never rounded, when a value would leave its allowed range.

## Tiling and determinism

- [ ] The raster is divided into 32 tiles, and every cell belongs to exactly one of them.
- [ ] No kernel writes outside its own tile during a tick; halo cells are read-only.
- [ ] A run with one worker and a run with many workers produce byte-identical checkpoints for the same seed.

## Functional groups and agents

- [ ] The group table lists 12 rows, with no identifier reused or skipped, and the class labels match the roles described in the prose.
- [ ] Only the three fish groups are represented as agents; the others exist solely in the cell record.
- [ ] Reserved mask bits are zero in every checkpoint written during the run.
- [ ] The agent pool is never resized, and live agents never exceed the occupancy cap quoted in the plan.
- [ ] The initial agent counts per group add up to the initial population, with nothing left over.
- [ ] Initial cover shares for coral, macroalgae and bare substrate add up to the whole of the substrate, with nothing double counted.

## Time and parameters

- [ ] Checkpoints are written once per simulated year, and the length of a year in ticks is the same in the driver, the loader and every document.
- [ ] The tick length is quoted in the same unit wherever it appears, and the sub-daily order of operations has not been reshuffled.
- [ ] Every coefficient is defined once, in the parameter table. A literal in code or prose that duplicates a coefficient is a defect.

## Tests

- [ ] The test inventory totals 48, and the layers listed in the inventory add up to that total.
- [ ] A golden file is regenerated only when the tick order or a kernel changes on purpose, never to make a failing run pass.

## Operational thresholds

These are reviewer defaults, not part of the model. Adjust them freely, but write down the new value.

- [ ] Raise a warning if the slowest ticks in a window exceed 70 ms for a sustained period during an ensemble run.
- [ ] Raise a warning if total cover in any cell drifts beyond its limit by more than 0.002 after clamping.

## Sign-off

Reviewer name, date, the plan revision checked against, and a list of any boxes left unticked with the reason for each. A review with unticked boxes and no reasons is treated as not done.
