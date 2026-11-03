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
5. Run `tools\headtrack\headtrack.py --show`, sit normally for the 2 s calibration (press `c` to redo).

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

## Tests

`python -m unittest tools/headtrack/test_headmath.py` (pure math, no camera). `check_pad.py` needs
the driver; `headtrack.py --source synthetic --duration 3 --no-gamepad` needs only numpy.
