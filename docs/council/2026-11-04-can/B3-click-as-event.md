# B3, the click as an event (round 4: what the bound entity can do)

**Thesis.** The click is the bridge the repo has half built, and the half it has built ignores the registry. `HandleMatrixClick` turns the cursor into a cell and starts a wave; it never reads the source records, never prints, and never says which cell or source it resolved (`FidelityEMatrix/EMatrix_Core.lua:604-625`). The honest first move is to make the click name its source from records that already exist (`CellSource`, `EMatrix_Core.lua:179`), showing the band and kind, not a constant. Anything that acts on a unit (target, raid mark) needs an identity checked at click time, which the repo does not store (`EMatrix_World.lua:154` keeps a unit token only). In-combat action is ruled out as far as general knowledge goes; nothing here is verified in game.

## Ranked list (visible payoff per hour, highest first)

**1. The click names its source (same wave, plus one chat line).**
- *Claim:* a left click on a bound cell prints the record that drives it (cell index, source, band, kind, age); an unbound cell prints "no source".
- *Evidence:* the click path never touches the registry (`EMatrix_Core.lua:604-625`; `CellSource` is used only at `:179`, `:316` and in tests). Cells are textures on `frameGrid` (`:555`, `:572`), which has `EnableMouse(false)` (`:524`), so picking is arithmetic on `masterFrame` (`:363`, `:629-630`). Far (0.2) and no source both close: open needs measured and value at least 0.5 (`:183`).
- *Effort:* 1 to 2 h. *Risk:* low. Print the band and kind, never the value (see "ruled out").
- *First step:* extract the mapping at `:611-618` into a pure helper (proposed `CellAt(mx, my, left, top, scale)`); the handler calls it, then `CellSource(index)`, and prints one line. The wave stays.
- *Test:* in `tools/ematrix_headless.lua`, put the cursor at the centre of cell (c, r) at scale 1 and 1.25 and assert the cell. The stub's `GetEffectiveScale` returns 1 (`:90`), so the division at `:612-614` is never exercised; `GetLeft`/`GetTop` are constants (`:92-93`). No harness test calls a mouse script, so call `FidelityEMatrixFrame:GetScript("OnMouseDown")` and assert the captured print (`:18-21`); the `pcall` at `:610` swallows errors.
- *Proof:* in game, `/fide bind on`, click cell k: the chat line names slot k, and the cell that opens is the one named. *Needs in-game verification:* that cursor pixels divided by the frame's effective scale land on `GetLeft`/`GetTop` in UI units.

**2. Remove the silent fallback and say what the toggle does.**
- *Claim:* a click off the grid should emit nothing.
- *Evidence:* an off-grid click starts a wave from (8, 5) (`EMatrix_Core.lua:620-624`), so a miss looks like a pick. Each click flips the global target (`:1013`), but under the gate a settled bound cell takes its face from its source (`:1035-1043`), so the flip shows only during the wave. This is the open item in `docs/council/2026-11-04-bridges/STEER.md`.
- *Effort:* 0.5 h. *Risk:* none visible.
- *First step and test:* the helper returns nil off-grid and the handler returns; headless click at x = 0 expects `ns.State().waveActive == false`.
- *Proof:* in game, a click on the grid's rim starts no wave.

**3. Check identity before any action (prerequisite for 4 and 5).**
- *Claim:* store the unit's GUID with the source record at publish; at click time compare the token's GUID; if different, print "source moved" and do nothing.
- *Evidence:* `PublishSlot` keeps only `s.unit` (`EMatrix_World.lua:150-154`). Slots go to the first free index per scan (`:265-290`), and a nameplate token belongs to whatever plate is current. `UnitGUID` appears in this repo only in a combat-log handler (`packages/wow-syntropic/SomaticFlow.lua:37`), so its use on nameplate tokens is unseen here.
- *Effort:* 2 to 3 h. *Risk:* medium. Whether `UnitGUID` answers for nameplate tokens in this client: *needs in-game verification*.
- *First step and test:* add the GUID as a field of the `BindCell` record (`EMatrix_World.lua:154`, signature at `EMatrix_Core.lua:160`). The stub has no `UnitGUID`; add one with a token-to-GUID table the test can change to simulate a slot reassignment, then assert "source moved".
- *Proof:* in game, with two mobs swapping plates, a click after the swap reports "moved".

**4. Click to target, out of combat, opt-in.**
- *Claim:* a left click on a fresh, measured cell with band near or mid targets that unit.
- *Evidence:* no targeting call exists in the repo (no hits for `TargetUnit`, `SetRaidTarget`, `SecureActionButtonTemplate`, `InCombatLockdown`). Out of combat, a target from an insecure click handler is likely allowed; in combat, assume refused. *General knowledge, needs in-game verification.*
- *Effort:* 4 to 6 h with the in-game check. *Risk:* medium to high; a mis-resolved click targets the wrong mob.
- *Rules from the definition:* never on hover or a timer ("nothing moves at rest", `docs/council/2026-11-04-entity/STEER.md` section 2); never on the symbolic player; never on `not_measured` or `far`.
- *First step and test:* a branch in the click handler behind a config key defaulting to off (defaults merged at `EMatrix_Core.lua:98`), gated on items 1 and 3. The stub refuses unknown widget methods (`tools/ematrix_headless.lua:51`), so the targeting call must be added deliberately and marked untested.
- *Proof:* in game, out of combat, the target changes to the unit named in the print. In combat, nothing happens and a refusal is printed (*needs in-game verification*).

**5. Raid mark on click.**
- *Claim:* the same chain as 4 puts a mark on the unit.
- *Evidence:* no mark call in the repo. Mark rights depend on group status (*general knowledge, needs in-game verification*). The group sees a mark; the owner should weigh that.
- *Effort:* 4 to 6 h. *Risk:* high (social, and rights). Ranked below 4 for that reason.
- *Proof:* in a group, a click marks the named unit.

**6. In-combat click actions through a secure button.**
- *Claim:* a secure overlay could act in combat.
- *Evidence:* no secure template in the repo; cells are textures (`EMatrix_Core.lua:555-572`). *General knowledge, needs in-game verification:* protected actions are blocked for insecure code in combat.
- *Effort:* high. *Risk:* very high. *Recommendation:* not now. The honest in-combat version is item 1 only.

## What the definition rules out

- Auto-targeting, or any action without a click, including on hover or a timer.
- Acting on the symbolic player. Cell 1 is the player's slot and stays closed by design (`EMatrix_World.lua:153`, `EMatrix_Core.lua:183`).
- Printing "value 1.00" as a reading. `BAND_VALUE` (`EMatrix_World.lua:149`) is a table constant, so the definition's "a number the host read, not a constant" fails for the value and passes for the band.
- Reading a cell's place as where the unit is. A cell is named by index (`EMatrix_Core.lua:528`) and a slot by first free index (`EMatrix_World.lua:265-290`).

## What does not help

- More wave, squash or a glint for unbound cells; the glint is forbidden (bridges STEER, "Forbidden").
- Treating the cursor as attention. It is the viewer's input and at most a named event, not a measured source.
- Reading a band as yards. The repo's comment says "within about 10 yd" (`EMatrix_World.lua:11`), and the yard figures are a render table (`:39-43`). A band is a label.
- Assuming the driver keeps the bound draw alive. `ApplyBindings` runs only inside `OnUpdateDriver` (`EMatrix_Core.lua:904-908`), and `CheckIdleCondition` (`:975-994`) does not count `bindCells`. With the world overlay off and spin and parallax at zero, the bound draw stops following its sources. *From the code; needs in-game verification.*

## What the eight sources add that the screen did not show

The screen shows open or closed per cell: it cannot tell far from no source (both closed, `:183`), or near from mid (both open). Names, kinds and ages exist only as text (`/fide cells`, `EMatrix_Core.lua:1238-1251`).

## Closing table

| # | Bridge | Channel | Effort | Risk | Test | Proof in game |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Click names its source | chat line from the click handler | 1 to 2 h | low | headless click at cell centres, scale 1 and 1.25 | the named cell is the one that opens |
| 2 | No silent off-grid event | handler returns nothing | 0.5 h | none | click at x = 0, no wave | rim click starts no wave |
| 3 | GUID at click | stored with `BindCell` | 2 to 3 h | medium | stub `UnitGUID`, swap a token, expect "moved" | "moved" after a plate swap |
| 4 | Click to target, out of combat, opt-in | target call, config off | 4 to 6 h | medium to high | stub call only for fresh measured near or mid | target matches the print (combat: refused) |
| 5 | Raid mark on click | mark call, group only | 4 to 6 h | high | as 4 | mark appears in a group |
| 6 | In-combat click action | secure overlay | high | very high | none | not recommended now |

Client claims are "from the code" (file:line) or "needs in-game verification"; rules of thumb are "general knowledge". No measurement or result is claimed. The HeavyMetal2 repo (`hm:universe:v2`, PLAN_FRACTAL.md) is not in this checkout and was not used.
