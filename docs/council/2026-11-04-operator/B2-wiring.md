# B2 wiring: what W, g and s can bind to today

**Thesis.** No real state drives W, g or s on either host today. The only live registry binding is the eight WoW actor slots (`EMatrix_World.lua:150-154`), and it carries a presence reading (the range band), which fits none of the three cleanly; it is honest only if it is named presence. On the Fidelity side the six Triad flows are measured from file reads and timed SSH commands (`triad_369_process.mjs:184-197`, `evidence.mjs:23`), so they could reach cells as an aging snapshot, but no channel reaches a cell between reloads. W is a fixed seed on both hosts (the cell orientation hash, `EMatrix_Math.lua:27`): consistent with dW/dt = 0, and it says nothing about weights. The Four Floats as computed today are seeds, a clock and one derived ratio (`density_bridge.mjs:132-135`, `triad_369_process.mjs:231-235`), so they must be labelled before any binding reads them. The WoW Lua in this repo reads no spell, aura, power, cast, cooldown or spec state; g's cooldown and proc delta and s's cast seed and spec parity need APIs this checkout never names (needs in-game verification).

Absent from this checkout: `apps/universe`, `bridge/roster`, `@hm/sq-jepa`, `@hm/shorthand`, `hm:universe:v2`.
The main manifest declares Retail `120107` (`FidelityEMatrix/FidelityEMatrix.toc:1`); the TBC manifest is `FidelityEMatrix_TBC.toc:1`. From the code.

## Wiring table

Kinds: `measured | symbolic | not_measured` (`evidence.mjs`); "seed" and "derived" are not kinds there.

| Symbol | Host | Real state it could bind to | Source name | Kind | Window | Reaches a cell | Label |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| W | Fidelity holon | Cell orientation hash (`EMatrix_Math.lua:27`) | `seed:cell-rot` | symbolic | none (constant) | built in | seed |
| W | Fidelity hands | None: `laptop_tasks.json` has no weight-like field | none | not_measured | n/a | n/a | not_measured |
| W | WoW 2.5.6 | Spec or talents: no read in repo | none | not_measured | n/a | n/a | needs in-game verification for any API |
| g | Fidelity holon | Flow integrity, six flows (`triad_369_process.mjs:199-200`) | `flow:F12..F32` | measured per flow | F21 30 s (`:151`), F31 30 s (`:184`), F12 90 s (`:187`), F32 90 s (`:186`), F23 180 s (`:172`) | none today; snapshot at `/reload` (proposed) | ratio is derived; F13 and F31 are self-checks |
| g | Fidelity hands | Task status: eight entries, all `requested` (`laptop_tasks.json`); results `in_progress / done / failed / blocked` (`LAPTOP-HANDS.md:71`) | `hands:<id>:status` | measured (file) | `updated_at` age (`laptop_tasks.json:4`) | generated file at `/reload` (proposed) | no stage field; `ask..landed` not in this checkout |
| g | WoW 2.5.6 | Range-band change between scans (`EMatrix_World.lua:133-143`, `BAND_CONFIRM` `:33`) | `presence:<band>` | measured | scan interval 0.25 s (`:29`) | registry, gate on (`EMatrix_Core.lua:164`) | presence change, not flux |
| g | WoW 2.5.6 | Cooldown, resource, proc: not read anywhere in repo | none | not_measured | n/a | n/a | needs an API not seen here; combat rules: general knowledge |
| s | Fidelity holon | No attention input reaches the holon | none | not_measured | n/a | n/a | not_measured |
| s | Fidelity hands | Requested task id (`hands_sync.mjs:196` filters `status === 'requested'`) | `hands:requested` | measured (file) | `updated_at` age | generated file at `/reload` (proposed) | a request, not attention |
| s | WoW 2.5.6 | Cursor eye (`EMatrix_Math.lua:156`); the hand, not an eye (`EMatrix_Core.lua` `EyeLabel`) | `eye:hand:cursor` | measured | frame | eye, not registry | not an eye |
| s | WoW 2.5.6 | Click: `OnMouseDown` with `GetTime()`, 0.15 s debounce (`EMatrix_Core.lua:623-650`) | `click:<cell>` | measured (named input) | one event | read from registry, not written to it | input, not a source |
| s | WoW 2.5.6 | Facing: `GetPlayerFacing` only in `EMatrix_Terrain.lua:171`; the overlay copies face the camera (`EMatrix_World.lua` header) | `heading:player` | measured | frame | not wired | needs in-game verification in the overlay context |
| s | WoW 2.5.6 | Cast seed, head, spec parity: not read; the pad has no age | none | not_measured | n/a | n/a | head: STEER, after H006 |
| Pxd | Fidelity holon | `0.35 - rawLoss` (`density_bridge.mjs:132`), `rawLoss` 0.024 or 0.048 by `solUp` (`:128`) | none | seed | n/a | none | seed |
| Vtx | Fidelity holon | `0.50 + sin(tickCount*0.1)*0.05` (`:133`) | none | clock | n/a | none | clock |
| Lx | Fidelity holon | `0.50 + coherence*0.50` (`:134`), coherence from daemon count (`:129`) | none | derived | n/a | none | derived from counts |
| Aq | Fidelity holon | `0.10 + 0.05` when availability > 0.9 (`:135`) | none | seed | n/a | none | seed |
| Pxd, Vtx, Lx, Aq | Apex | `:231-234`; `Aq` gated on `whole_check.passed`, hard-coded `true` (`:215`) | none | seed, clock, derived, seed | n/a | none | symbolic (`:293`) for all four |
| all four | WoW HUD | Literals `0.20/0.50/0.95/0.20` (`packages/wow-syntropic/Core.lua:37`), coherence 0.99 (`:35`) | none | seed | n/a | none | seed |

## Ranked list (visible payoff per hour; hour figures are my estimates)

1. **Label the Four Floats (1 to 2 h, low risk).** Claim: `density_bridge.mjs:170,198,213` print the four values unlabelled, and only the Apex says `symbolic (model-derived, not sensor)` (`triad_369_process.mjs:293,318`). First step: add a `four_floats_kind` array to the density output, mapping each float to `symbolic` (the only existing kind; a `seed` kind is a new kind for the owner). Test: a `node:test` asserting each of the four has a kind and that `Vtx` is `symbolic`. Proof: `triad -- status` shows the labels.

2. **Hands task status as an aging snapshot on free cells (3 to 5 h, medium risk).** Claim: the task file is a measured, timestamped source with a truthful age. Evidence: `laptop_tasks.json:4`, `hands_sync.mjs:196`. Risk: `time()` is unverified on the client (needs in-game verification), and the writer question is the owner's (the Apex writes into the live AddOns `Data` folder, `EMatrix_Data_Azeroth_tbc.lua` header). First step: a new generator (proposed `tools/gen_hands_cells.mjs`) writing a Lua table of `{id, status, updated_at}` into `FidelityEMatrix/Data`; `EMatrix_Core.lua` reads it at load and binds with `window = 180` (the flows' window). Test: a headless case where a stamp about 1.7e9 is recorded but not fresh (`CellFresh`, `EMatrix_Core.lua:194-197`). Proof: the owner's `/fide cells` line shows the age and `snapshot`.

3. **Holon flows as the same snapshot (+2 to 3 h after 2).** F23 and F32 are the honest flows (`triad_369_process.mjs:172, 186`); F31 stays `symbolic`. Same test shape as 2.

4. **WoW presence change as g (2 h, low payoff).** Claim: a band change between scans is measured (`EMatrix_World.lua:133-143`). It is a proximity delta, not flux. First step: rename the source prefix `actor:` to `presence:` in `PublishSlot` (`EMatrix_World.lua:150-154`), so `/fide cells` stops implying an actor's intent. Test: a headless assertion on the prefix (near `tools/ematrix_headless.lua:1138`). Proof: the owner's `/fide cells` paste.

5. **Heading as s (3 h, low payoff, needs in-game verification).** `GetPlayerFacing` is read only by the terrain probe (`EMatrix_Terrain.lua:171`); `currentFacing` (`EMatrix_Core.lua:997`) is the spin clock, not facing. Skip unless the owner asks.

6. **Click to target, cooldown, proc, cast seed, spec parity (high effort, rank last).** None has an API seen in this repo. Out-of-combat targeting is the owner's call (`can/STEER.md`). In combat, general knowledge: addons may not act on combat-restricted state, and what can be read varies by client (needs in-game verification).

## What does not help

- More texture before a binding is visible (the same finding as the entity round).
- Per-cell four floats, or any Four Float read as a measurement in a cell.
- Adding `seed` or `derived` to `evidence.mjs` without the owner's sign-off.
- Using `currentFacing` or the cursor as the player's facing or the eye.
- Stage names `ask..landed` for the hands: the task file has no stage field, and the Roster is absent.
- Binding the head, the cast or the cooldown before an age exists (the pad has none).
- A hard-coded `passed: true` (`triad_369_process.mjs:215`) used as a binding.

## Closing table

| Item | Answer |
| :--- | :--- |
| Honest binding today | WoW actor slot as presence (`EMatrix_World.lua:154`), kind `measured` only when the range check answered |
| First step and test for it | Rename to `presence:<band>` (ranked 4); headless assertion on the prefix |
| Proof it works | The owner's `/fide cells` paste on v1.7.6 |
| Symbols that need a label before any binding | Pxd, Vtx, Lx, Aq on both hosts; W as seed |
| Symbols with no source | g (cooldown, proc), s (cast, head, spec), all in-game unverified |

For the LEAD: I would sign the clause that says a cell is bound only to a named source with a measured value and a stated window, and that each Four Float carries a label; I would strike any clause that calls the Four Floats a reading.

Route: Opus (core kernel and spec): the `presence:` rule and the kind of a seed in `evidence.mjs`. Flash (WoW and web scaffolding): the Four Float labels (item 1), the generated Lua file (items 2 and 3), the `presence:` rename (item 4). Argon (blind red-team audit): whether `time()` returns epoch seconds on the client, and whether the hands snapshot can read closed when the laptop is offline.
