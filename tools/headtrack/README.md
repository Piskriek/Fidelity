# Head tracking for FidelityEMatrix

The addon cannot read a camera (WoW addons are sandboxed), but it can read a gamepad through
`C_GamePad`, which the wiki lists for Forever 1.60, Classic Era 1.15 and TBC 2.5. So the webcam
drives a **virtual gamepad**, and the addon reads the pad as its eye:

```
webcam -> headtrack.py (OpenCV Haar face box) -> ViGEm virtual Xbox pad -> C_GamePad -> /fide eye
                     \-> head.json (for the other Fidelity daemons)
```

## Laptop setup (once)

1. Install the ViGEmBus driver (administrator): https://github.com/nefarius/ViGEmBus/releases
2. `python -m venv .venv && .venv\Scripts\pip install -r tools\headtrack\requirements.txt`
3. `.venv\Scripts\python tools\headtrack\check_pad.py` must print `PASS` (feeds the pad, reads it back
   through XInput, the game's own path).
4. If another daemon already holds the camera, point the tracker at what that daemon exposes:
   `--source frames:<dir of jpg/png it writes>` or `--source http://.../stream.mjpg`.
5. Run `tools\headtrack\headtrack.py --show`, sit normally for the 2 s calibration: it averages your
   rest pose (face centre and width), and everything the pad gets is measured from that pose, so
   sitting normally is (0, 0, 0). Press `c` in the preview to redo all three.

## What the pad carries

| `--map` | x (left/right) | y (up/down) | depth |
| :--- | :--- | :--- | :--- |
| `rightstick` (default) | right stick X | right stick Y | left trigger = `clamp(z, 0, 1)`: rests at **0**, leaning in presses it, sitting back does nothing |
| `triggers` | left trigger | right trigger | none |

* Depth on the left trigger carries only "closer": at rest it is 0, so it is never read as a button
  press. Leaning in raises the parallax; sitting back does nothing. (`head.json` keeps the signed
  `z`: -1 sat back, +1 close.)
* `--map triggers` puts two bipolar axes on unipolar triggers, so it needs a centre:
  `TRIGGER_CENTRE = 0.5` in `headmath.py` (`to_trigger`). Both triggers rest half-pressed by
  design and there is no depth; `/fide eye calibrate` subtracts the centre. Use it only when the
  client lacks the camera-speed cvars below.
* The left stick is never driven: with `GamePadEnable 1` it walks the character.

## In the game

```
/console GamePadEnable 1
/console GamePadCameraYawSpeed 0
/console GamePadCameraPitchSpeed 0
/fide eye probe          -- move your head: the stick/axis that moves is the one to use
/fide eye stick 2        -- right stick (default); /fide eye depth 5 for the left trigger if it shows there
/fide eye calibrate      -- sitting normally
/fide eye source gamepad
```

Those two camera speeds keep the right stick from swinging the real camera; if your client lacks
them, run the tracker with `--map triggers` and `/fide eye stick` the axes `/fide eye probe` shows.
`/fide eye invert` flips left/right if leaning left moves the scene the wrong way.

## Behaviour worth knowing

* **Lost face**: the last position is held for 0.5 s, then drifts back to the calibrated rest pose
  (not the image centre), so a loss never settles at a lean.
* **Second face / false positive**: each frame the tracker follows the face nearest to the one it
  had last frame, as long as it moved less than a quarter of the frame width; only after the face
  has been lost for longer than the 0.5 s hold does it pick the largest face again.
* **`--source frames:<dir>`**: a file younger than 50 ms is skipped (it may still be being written),
  a file OpenCV cannot decode is retried next tick, and "no new file yet" keeps the last position
  (the pad is still fed) instead of counting as a lost face, so a daemon writing slower than
  `--fps` does not make the eye drift between its frames. After `--stale-seconds` (2) without a
  new frame the eye drifts back to rest.
* **`head.json`**: written every third tick next to the script (`--out` to move it): `x`, `y`
  (from rest), `z` (signed), `restX`, `restY`, `restWidth`, `frames`, `lost` (ticks without a
  face), `stale`, `jsonErrors`, `fps`, `source`, `map`. A failed write (Windows: a reader holding
  the file; disk full) is counted as `jsonErrors`, warned once on stderr, and never stops the pad
  feed; the count is also in the final summary line.

## Tests

`python -m unittest tools/headtrack/test_headmath.py` (pure math, no camera). `check_pad.py` needs
the driver; `headtrack.py --source synthetic --duration 3 --no-gamepad` needs only numpy.
