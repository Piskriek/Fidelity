# STEER: council round 2026-11-04-can, what the bound entity can do

Written 06:05Z by the director (Claude in the cloud). Six voices: B1 the holon on the tiles through a generated file, B2 the eye as a source, B3 the click as an event; O1 what the eight sources add, O2 a file is a snapshot, O3 the click cannot act and the cursor is not an eye. Every claim used below was re-checked against the code; where a claim was landed as a fix, the fix has a test.

Argon's mode for the council, relayed by the owner at 06:02Z (only the header reached this session: Source, Mode; the body did not): a non-coercive prior that steers toward technical closure, does not clamp genuine engineering objections, and flags final rulings for the owner. Applied as written: the opposers' objections stand wherever the code bears them out (six of them were defects, fixed below), and every ruling marked **owner** waits for the owner's word.

## What the entity can do today (from the code and the owner's v1.7.4 screen)

- **One bit per cell from eight unit sources,** re-measured four times a second: a cell opens on `near` or `mid` (the two yes/no range answers), closes on `far`, `not_measured`, the symbolic player and "no source" alike (`EMatrix_Core.lua` `CellOpen`, `ApplyBindings`). O1, O2, O3 and B1 all showed the same thing: the number beside a source (`1.00`, `0.50`, `0.20`) is a table constant per band (`EMatrix_World.lua` `BAND_VALUE`), so it is the source's **label**, not a reading; the reading is the range check's answer. The screen told the owner nothing the nameplates did not, except one bit per slot and a count of up to seven at once (O1's concession).
- **Name every source in text** (`/fide cells`, the login line) with its kind and its age; the age of an actor source is the scan's own moment, so `0.0s` attests that the scan ran, not an answer's age (O1 attack 4).
- **Run a wave from a click.** The click is a measured input (pointer and `GetTime()`), not an event the entity emits: nothing leaves the click path in this repo (O3 attack 1, verified by grep). With the gate on, a clicked cell is overwritten by its source within 0.25 s (O1 attack 6, O3 attack 2): that is the definition working, the source wins.
- **It cannot,** today: show a flow of the holon (no channel reaches a cell between reloads), show a head (the pad carries no age and the tracker has never run in the game, H006), or act on a unit (no targeting call exists; in combat the client forbids it as far as general knowledge goes).

## The three bridges by the definition's test

**1. The holon on the tiles through a generated file (B1 against O2).** O2's attack 1 held against the code as it was: the registry stamped on `GetTime()` with one 2 s window, so a file value closed 2 s after load, and a wall-clock stamp was meaningless against it. B1 found the worse trap: `CellFresh` had no lower bound, so a wall-clock stamp (about 1.7e9) would have read fresh for ever. Both fixed this round (per-source windows, a lower bound). What remains honest for a file: F23 and F32 on free cells as a snapshot "as of the last `/reload`", each aging on a wall clock inside its own 180 s window (the Apex's own threshold) and closing when stale; F31 only as `symbolic` (the Apex's self-report; B1 rank 2). Never faster than `/reload`; never F12, F21 or F13 until their evidence is honest (round 3). Two verifications gate the build: that `time()` returns epoch seconds on the client (B1, needs in-game verification) and which Apex copy the laptop runs (open since round 3). **Owner:** the file is written by the Apex into the live AddOns `Data` folder, not the repo (H005's hash count becomes 16), and the value mapping `1 - age / window` is a design choice to sign.

**2. The eye as a source (B2 against O3, ranked first by O1).** The pointer is a hand, not an eye; the configured source was printed as the one in use even when no pad answered (B2 rank 1, O3 attack 6); a depth left by a pad that stopped answering kept driving `EyeGain()` while the hand drove the eye (B2 rank 2, O3 attack 5). All three verified in the code and fixed. The head is the one input the owner's screen cannot show (O1), so it is the first new source worth binding, but the pad carries no age (B2, O2 attack 4, O3 attack 7): a frozen camera reads as a still head. The next build on this line is B2's heartbeat (the tracker writes a counter on the unwritten right trigger; the addon marks the source `not_measured` after 2 s without a change), after H006 has run the tracker in the game at all. Ruled out: any head-parallax, "3D" or "synced" claim while the login line says the eye is the hand; head-driven stereo (B2 rank 6).

**3. The click as an event (B3 against O3).** Three defects verified and fixed: the handler was wired to both `OnMouseDown` and `OnMouseUp`, so a press held past the 0.15 s debounce ran two waves that cancelled (O3 attack 3); a click off the grid started a wave from an invented origin (8, 5) (B3 rank 2, O2 attack 6); the click never read the registry (B3 rank 1). Now: `OnMouseDown` only, off the grid nothing, and with the gate on one chat line names the clicked cell's source, label, age, window, kind and state. Target or mark on click: out of combat only, opt-in, after identity is checked at click time (B3 rank 3: the record keeps a unit token, which a plate can reassign); **owner:** a raid mark is seen by the group. Not now: the in-combat secure overlay (B3 rank 6).

## Vector

1. **The registry is the entity's rule for any source, not only the eight slots.** A source states its own window; a stamp from the future is not fresh; a recorded source keeps the driver alive while the gate is on, so a stale source closes even when nothing else moves (B3 and O2's freeze trap, verified: `CheckIdleCondition` counted the overlays but not the bindings). Landed.
2. **Honest names wherever the owner reads:** the eye in use, the label beside a source, the click's line. Landed.
3. **The first source not on screen is the head:** H006 (run the tracker on the laptop), `/fide eye probe` with a face in frame, then the heartbeat. Only then may a cell open on `eye:pad`.
4. **The flows as an aging snapshot** on free cells, after the two verifications and the owner's word on the writer.
5. **The click to target,** out of combat, opt-in, after identity. Owner's call.
6. Not on the vector: head stereo, in-combat actions, raid marks before the owner weighs them, widening `FRESH_SECONDS` (it loosens the slots too; a source states its own window instead).

## First step

Landed as v1.7.6 on `francois/serene-euler-51wj3e`, each with a headless test (`tools/ematrix_headless.lua`) or a math test (`tools/test_ematrix_math.mjs`):

- **Registry:** `BindCell(index, source, value, at, kind, window)`; `CellFresh` requires `0 <= age <= window`; a record counts toward `sourceCount`, which `CheckIdleCondition` reads with the gate on; `/fide bind on` re-checks the idle condition; `/fide cells` prints `label` and `of <window>s` instead of `value`, with a header saying the label is the band's constant, not a distance. Tests: a future stamp is recorded but never live; a 10 s source outlives the 2 s ones and stales after its own window; with spin, parallax and both overlays off, a bound stale cell still closes.
- **Eye:** `EyeLabel()` names what drives the eye now (`hand:cursor (no head measured)`, `hand:cursor (pad configured, none answers; no head measured)`, `pad (head; age not measured)`, `none (parallax off)`); the login line and `/fide status` print it beside the configured source; the pointer branch eases a left-over depth to 0 and the parallax-off branch snaps it. Tests: the login line names the hand; the gain returns to 1 after the pad stops; the three labels.
- **Click:** `Math.CellAt(mx, my, left, top, scale, cellSize, cols, rows)` (tested at scale 1 and 1.25, and off the grid); `OnMouseDown` only; no wave off the grid; with the gate on, `Clicked cell N: <source> label L age A of Ws <kind>, open|closed` or `Clicked cell N: no source`. Tests: the wave starts at the clicked cell; a rim click starts none; the two lines.
- Version 1.7.6 in `EMatrix_Core.lua` and the three manifests. H005's gate ("1.7.5 or later") admits it.

## Forbidden until verified

- Any "head parallax", "3D" or "synced" claim while the login line reads `eye hand:cursor`.
- Binding a flow to a cell through a file before `time()` is verified on the client and the owner names the writer and signs the mapping.
- A cell opening on a `symbolic` or `not_measured` source; a glint on an unbound cell; a band's constant printed as a reading anywhere new.
- A click that acts on a unit before identity is checked at click time and the owner says yes; never in combat.
- Changing the overlay defaults, the calm defaults (spin 0, gain cap 1.0: owner's call, O3 attack 8 notes the 1.8 cap is still in the code), or the definition (owner's word); merging to `main` by hand.

## The check that settles it

On v1.7.6 in the game (pull the branch, run H005 or copy the folder, `/reload`), the owner pastes:

1. The login line: it says `v1.7.6` and `eye hand:cursor (no head measured)`.
2. `/fide cells` with the world overlay on: each line reads `label 1.00 age 0.0s of 2s measured` (or `0.50`), not `value`.
3. `/fide bind on`, then click an open cell: one chat line `Clicked cell N: actor:nameplateX:near label 1.00 age 0.0s of 2s measured, open`; click a closed cell with no source: `Clicked cell N: no source`; click the frame's rim outside the grid: no wave.
4. Hold the mouse button down on a cell for half a second: one wave, not two.
5. `/fide status`: the Eye line ends `from hand:cursor (no head measured); configured cursor`.
6. Still owed from earlier rounds: `/fide terrain probe` at the Abbey door on v1.7.5 or later (`tile azeroth:32:48 FOUND`), the FidelityWoW HUD after H008 (`seed` labels), H006 (the tracker), the word on the definition.

Then `LANDED.md` becomes `used`, `changed` or `nofit`.

## Next round's ASK

Opens on the owner's pastes above and on H006's first `/fide eye probe` with a pad read: "The head as the first source not on screen, and the flows as an aging snapshot: the pad heartbeat's shape (which axis, what rate, what the addon marks stale), the file's shape (the stamp, the window, the writer), and which of the two lands first." Builders and opposers, haiku, one file each.
