# Council round 2026-11-04: bridges

Target: Vector steering and bridge checks, given the council's definition of the entity (docs/council/2026-11-04-entity/STEER.md section 2: a field of cells, each honest only when a named, measured, fresh source drives it). Builders steer: how the per-cell binding is built, which channels can carry a source into a cell, and the order of everything on the table. Opposers check the bridges we have: the WoW inputs, the holon's flows, and the chain from this repo to the owner's screen.

| Voice | Side | Lens or thesis | Report |
| :--- | :--- | :--- | :--- |
| B1 | builder | Binding architect | `B1-binding-architect.md` |
| B2 | builder | Channel builder | `B2-channel-builder.md` |
| B3 | builder | Vector steering | `B3-vector-steering.md` |
| O1 | opposer | Bridge check, the WoW inputs: none of the addon's inputs is a named, measured, fresh source fit to open a cell | `O1-bridge-check-the-wow-inputs-none-of-the-.md` |
| O2 | opposer | Bridge check, the holon's flows: the six flows are four views of one SSH link plus two self-checks, so a cell bound to a flow shows a ritual, not a measurement | `O2-bridge-check-the-holon-s-flows-the-six-f.md` |
| O3 | opposer | Bridge check, the chain to the owner: the path from this repo to the owner's screen is broken at the laptop task, the branch and the missing pastes, so nothing landed here is verified | `O3-bridge-check-the-chain-to-the-owner-the-.md` |

Then `STEER.md` (the vector, the first step, what is forbidden until verified, the check that settles it) and `LANDED.md` (the news back: used, changed or nofit, with evidence).

`node tools/council.mjs check <this dir>` reports the round's health.
