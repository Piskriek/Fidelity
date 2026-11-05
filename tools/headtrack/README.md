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

## A phone as the camera (a TV in the living room)

An old phone (or your own, to try it) can be the camera: it streams its video over Wi-Fi and the tracker reads the
stream. Nothing runs on the phone but a camera app.

1. Install an IP-camera app that serves MJPEG. On Android, "IP Webcam" serves `http://<phone ip>:8080/video`; on an
   iPhone, any IP-camera app with an MJPEG address works the same way.
2. In the app set the video to **1280 x 720**, then start the server. The app shows the phone's address.
3. Stand the phone **centred on the TV** (on top of it or just below it), looking at the sofa, not tilted.
4. On the laptop, once: `python -m venv .venv` and `.venv\Scripts\pip install "opencv-python>=4.8,<5" numpy`. OpenCV 5
   (5.0.0, July 2026) removed the Haar face finder (`cv2.CascadeClassifier` and its cascade files), so the tracker
   needs OpenCV 4; `requirements.txt` pins it, and the tracker says so if it meets OpenCV 5.
   Then: `.venv\Scripts\python tools\headtrack\headtrack.py --source http://<phone ip>:8080/video --no-gamepad --room --show`
   - `--room` searches the full picture for faces from 24 px wide (a face three metres from a phone is about 26 to
     55 px at 1280 x 720) and follows **the person straight ahead**: of several faces it takes the one nearest the
     picture's centre line, then keeps that person (continuity beats size) until they are lost for a moment.
   - Without `--room` the tracker shrinks each frame to 320 px before the search, so a face must be at least 60 px
     wide in a 640 px picture and 120 px in a 1280 px one: right for a webcam at a desk, never from a sofa.
   - It prints, at the start, the smallest face it can find.
5. Sit normally for the 2 s calibration; `head.json` then follows the player, and the twin's `/live` page and its
   head-coupled window read it.

A stream is read in the background, keeping only the newest picture, so a slow face search never builds a
backlog (which delays the head and makes the app hang up), and a stream that stops for 2 s is opened again. Once a
face is found, the next search looks only in a window around it, for sizes close to it; the whole picture is
searched again only when the face is not there. The last lines of a run say where the time went: the stream's
own rate, the times it was reopened, and the search time near the last face and over the whole picture.

DroidCam (Android and iPhone) works the same way: its stream is `http://<phone ip>:4747/video`, or
`/video/force/1280x720` for 720p; it serves one program at a time, so close its page in the browser first.

Checked here (05 Nov) with a 1280 x 720 MJPEG stream served over HTTP the way such an app serves one, a 44 px face
swaying in the middle and a 72 px face still at the side: with `--room` the face was found in all 227 frames
(22.6 a second) and `x` rose and fell with the sway, the middle person's, not the larger one's; with the defaults
none of 228 frames had a face. With the window search: 6 ms a picture against 58 ms for the whole picture, and a
stream that hung up every 4 s was opened again twice with the face found in all 203 pictures.

The first runs with the owner's phone (05 Nov) found his face (46 to 65 px wide) but searched the whole 720p picture
in 3.1 s on the laptop, about fifty times slower than here, and DroidCam hung up on the slow reader; that led to
the background reading, the reopening and the window search.

The phone, the laptop and the TV only need the same Wi-Fi. One camera gives the direction to the head and a rough
distance from the face's size, for one person at a time.

## The tracker on another machine (when WoW needs the laptop's processor)

WoW and the face search compete for the laptop's processor: the owner's runs searched a 720p picture in 3.1 s there,
against 58 ms here. The tracker can run on another machine on the same network, the 3080 PC say, and hand the
head to the laptop's twin over the network:

1. On the other machine (the repo and a `.venv` with OpenCV 4, as above):
   `.venv\Scripts\python tools\headtrack\headtrack.py --source http://<phone ip>:4747/video --no-gamepad --room --serve 5204`.
   It prints the address it serves, such as `http://192.168.0.5:5204/head.json`. Windows asks the first time whether
   Python may use the network: allow it on private networks.
2. On the laptop: `npm run twin -- --head http://192.168.0.5:5204/head.json`. The page's status panel then says
   `head: head tracker` while the other machine tracks you.

The phone must be reachable from that machine, so put it on the same Wi-Fi. The server answers only `GET /head.json`,
with the numbers head.json holds.

Run this way on 05 Nov, with the owner's phone and DroidCam on the home Wi-Fi: the 3080 PC tracked at 26.8 frames a
second with none lost (the laptop beside WoW had managed 1.3), the face 66 px wide near the middle, and the
laptop's `/live` page showed `head: head tracker`, the head coming from the PC.

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

`python -m unittest tools/headtrack/test_headmath.py tools/headtrack/test_headtrack_io.py` (pure math, the head.json
write, which retries a rename Windows refuses while another program has the file open, and the `--serve` server;
no camera). `check_pad.py` needs
the driver; `headtrack.py --source synthetic --duration 3 --no-gamepad` needs only numpy.
