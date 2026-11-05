# O1 bridge check: the WoW inputs

**Voice:** O1, opposer. **Thesis defended:** none of the addon's inputs is a named, measured, fresh source fit to open a cell.
**Scope:** `FidelityEMatrix/` and `packages/wow-syntropic/`, read from the code. The HeavyMetal2 repo is not in this checkout; nothing here relies on it. Client-API behaviour is marked **needs in-game verification**; rules of thumb are marked **general knowledge**.

## Thesis

The one input that reaches cell state is the click, and it reaches it as a toggle and an origin, not a value (`FidelityEMatrix/EMatrix_Core.lua:940`, `:543-568`). Every other input moves copies, terrain or the eye, or feeds the FidelityWoW HUD, whose four floats and coherence are literals (`packages/wow-syntropic/Core.lua:35-37`). No WoW input carries an evidence kind: the only match for `measured` in either folder is a comment (`EMatrix_Core.lua:856`), and nothing reads `packages/triad-369/src/evidence.mjs`. The thesis holds for world-state cells. It does not hold for the click as an event, which is conceded below.

## Ranked attacks (most fatal first)

**1. The HUD's floats and coherence are literals shown as readings.** `Core.lua:35` sets coherence 0.99; `Core.lua:37` sets `S = (0.20, 0.50, 0.95, 0.20)`. The rest are reads (`UI.lua:68`, `:73`, `:76`, footer). Nothing writes `fourFloats`. Strain only decrements and is floored at zero (`Core.lua:104`), so "0.00 J" is structural, while `packages/wow-syntropic/README.md:16` says it "measures accumulated neuromuscular strain". *Fails named, measured, fresh and evidence kind.* Check: grep for writers of `fourFloats` and of a positive `strainJoules` (done: none).

**2. The FTLE is a three-constant heuristic, and a map gap trips it.** `Kinematics.lua:58` calls it an "empirical spline prediction heuristic". Instantaneous values are 0.002, 0.050 or 0.080 (`:59`, `:63`, `:67`), blended 0.9/0.1 (`:73`). When `C_Map` returns nothing, `curX` is 0 (`:44-51`), and `lastX` is stored as that 0 (`:93`). The first valid position after a gap is measured from (0,0); if `dt < 0.1` (`:65`), it is flagged as a teleport. From the login seed 0.005, one flagged sample gives 0.9 x 0.005 + 0.1 x 0.080 = 0.0125, above 0.010, so the HUD prints DEVIANT (`UI.lua:80`). "Lyapunov" (`README.md:19`) names a quantity the code does not compute. Check: opt in, cross a zone or instance boundary, read `/fidelity audit`. Whether `C_Map` returns nil in instances: **needs in-game verification**.

**3. Entropy is measured once and never expires, and a seed shows by default.** Opt-in defaults to false (`Core.lua:11`), so the HUD prints `H 2.50` from the seed (`Core.lua:40`, `UI.lua:71`). Once opted in, H comes from up to 30 cast intervals of 200 to 3500 ms (`SomaticFlow.lua:9`, `:89-93`). `ComputeFlowState` returns early only under five intervals (`:106`), so H stays after casting stops. Timer precision (`Core.lua:43-44`): **needs in-game verification**. The 0.80 cut (`SomaticFlow.lua:131`) is a constant. *Fails fresh and evidence kind.*

**4. Range bands are a three-word label, and "far" absorbs failures.** `World.lua:131-139` asks `CheckInteractDistance` at index 3, then 4. "Far" is returned only when both calls answer and both are nil or false (`:138`); otherwise "unknown" (`:139`). The comment's distances (`World.lua:11`, about 10 and 28 yd) are **general knowledge**. Whether nil means out of range in combat or in instances: **needs in-game verification**. Freshness is the 0.25 s scan (`:29`) with two-scan confirmation (`:33`). *Fails measured: it is a label.*

**5. The pad eye has no age and falls back to the cursor silently.** `ReadGamepadEye` returns whatever state the client holds (`EMatrix_Core.lua:744`, `:747`, `:753`) with no timestamp. If the pad stops answering, the eye becomes the cursor (`:841-851`). The tracker's two-second stale rule (`tools/headtrack/headtrack.py:222`, `:251-253`) never reaches the addon. Whether `GetDeviceMappedState` holds its last state: **needs in-game verification**. Lean-in also raises gain to 1.8 (`EMatrix_Core.lua:51-52`, `:145-146`), against the steer's "intensity only goes down". *Fails fresh and evidence kind.*

**6. `GetCameraZoom` falls back to a constant that looks like a reading.** `World.lua:67-68` and `Terrain.lua:168` substitute 8 yd when the call is absent or below 0.5. That 8 sets copy size (`World.lua:286`, `focal * unitHeight / (zoom + depth)`). The yard unit: **needs in-game verification**. *Fails measured.*

**7. Nameplate tokens are keys; parenting stacks scale.** `World.lua:149-151` reads `namePlateUnitToken`. Copies are parented to the plate (`:290`) and anchored to it (`:179`), and the addon cannot read where a plate sits (`:8-9`). Whether the client's plate scaling multiplies the band-based height (`:286`): **needs in-game verification**. *Named, not measured: an actor key only.*

**8. Map data is static, and its build label is typed, not checked.** `Data/EMatrix_Data_Azeroth_tbc.lua:2` says build 2.5.6.70577, but the generator reads `--build` from the command line, default `'unknown'` (`tools/ematrix_mapdata.mjs:232`). The runtime check is family-level, toc 20000 to 29999 (`Terrain.lua:52-57`), and `BuildLabel` prints the stored string without comparing it to the client (`:64-72`). The ADT inputs are not in this checkout. *No age, so it cannot go stale per second, but a patch can make it stale with no alarm.*

**9. `UnitPosition` is player-only.** The only call is `UnitPosition("player")` (`Terrain.lua:163`); the map lookup returns nil outside the listed instances (`:165-166`). Values: **needs in-game verification**. Nothing in the holon reads them.

**10. The cursor eye is a viewer's pointer.** `EMatrix_Core.lua:851-856`, `EMatrix_Math.lua:156`. It is named, measured in pixels and read per frame, but it moves planes and copies, not cells. *Viewer input, not a source about the world.*

## Concessions (what the evidence forces)

- **The click passes as an event, not a value.** It is named (a user click), measured (pointer, `EMatrix_Core.lua:550`) and fresh by construction. It fails on two counts: the fallback to (8,5) at `:562` is an origin the user never gave, and the toggle at `:940` carries no value in [0, 1]. Minimal honest form: remove `:562`; a click on cell (c, r) opens that cell as "event: click at (c,r)", kind `measured` for the pointer only.
- **The eyes pass as viewer inputs.** Both are the viewer's pose. Each needs an age check and no silent fallback before any "measured" label, and the gain cap should be 1.0 (`:52`).
- **`UnitPosition` and tokens pass for the player and actor slots.** Player position is a measured number, value needs in-game verification. A token plus `UnitExists` is a present-or-absent reading per scan.
- **Map data passes as static geometry,** named by its build string and measured only if the ADT inputs are re-hashed. It has no age to test.
- **Range bands pass only as a label.** Keep "unknown" apart from "far"; grant kind `measured` only after the in-game check.

## Smallest honest first binding (WoW side)

One actor slot per visible unit, keyed by its nameplate token. A slot opens (value 1, age at most 0.25 s, kind `measured`) when `UnitExists` is true on the scan. Its band is text only, kind `not_measured`. Every other cell reads "no source". The click may open one cell as a named event once `:562` is removed. Nothing from the HUD opens a cell: each HUD number is a literal or seed until it has a writer.

## Closing table

| Input (file:line) | Named | Measured | Fresh | Evidence kind | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Click, ripple (`EMatrix_Core.lua:543-568`, `:995-997`) | yes (user) | pointer only | event; 0.15 s debounce (`:546`) | none | conceded as event after `:562` removed |
| Cursor eye (`:851-856`) | yes | yes (px) | per frame | none | viewer input only |
| Pad eye (`:741-754`, `:841-851`) | yes (tracker) | yes (stick values) | no age in addon | none | viewer input, needs age check |
| Range bands (`World.lua:131-139`) | yes (API index) | no (label) | 0.25 s scan | none | label only |
| UnitPosition (`Terrain.lua:163`) | yes (player) | needs in-game verification | per terrain scan | none | player only |
| GetCameraZoom (`World.lua:67-68`, `Terrain.lua:168`) | yes | fallback 8 | per refresh | none | fails: constant fallback |
| Nameplate tokens (`World.lua:149-151`) | yes | no (identifier) | 0.25 s scan | none | actor key only |
| Map data (`Data/...tbc.lua:2`, `Terrain.lua:52-72`) | build typed | ADT not in checkout | static | none | static geometry only |
| S, coherence, strain (`Core.lua:35-40`, `:104`) | no writer | literal | never | none | fails; label "seed" |
| Entropy H (`SomaticFlow.lua:92-93`, `:106`, `:131`) | yes (own casts) | yes; precision needs verification | never decays | none | fails fresh; off by default |
| FTLE (`Kinematics.lua:58-73`) | heuristic | constants | about 0.5 s EWMA | none | fails: not an exponent; false teleport on map gap |

**SQ check (phase 5):** each code claim cites file:line and each number is read from the source or derived by arithmetic (0.0125; the 0.5 s EWMA memory, ten samples at 20 Hz). No run, no network.
