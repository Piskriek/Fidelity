#!/usr/bin/env python3
"""Webcam head tracker -> virtual gamepad (+ head.json) for FidelityEMatrix's head-coupled parallax.

The game addon cannot read a camera, but it can read a gamepad (C_GamePad). This script finds your
face in the webcam, turns its position and size into left/right, up/down and distance relative to
your calibrated rest pose, and feeds them to a virtual Xbox 360 pad through the ViGEm driver
(right stick = x/y, left trigger = "closer" depth: it rests at 0, leaning in presses it, sitting
back does nothing). It also writes head.json next to itself for the other Fidelity daemons.
The left stick is never used: with GamePadEnable 1 it walks the character.

    python headtrack.py                      # default camera 0, right stick + left trigger
    python headtrack.py --source 1           # another camera index
    python headtrack.py --source frames:D:\\path\\to\\dir   # newest .jpg/.png written by another daemon
    python headtrack.py --source http://127.0.0.1:8080/stream.mjpg   # an MJPEG stream
    python headtrack.py --source http://192.168.0.20:8080/video --no-gamepad --room   # a phone at the TV (an IP-camera app)
    python headtrack.py --source synthetic --duration 5    # no camera: a moving fake face (for tests)
    python headtrack.py --show               # preview window; press c to recalibrate the rest pose, q to quit
    python headtrack.py --no-gamepad         # head.json only
    python headtrack.py --map triggers       # x/y on the two triggers around TRIGGER_CENTRE, no depth

In the game: /console GamePadEnable 1, /console GamePadCameraYawSpeed 0, /console
GamePadCameraPitchSpeed 0, then /fide eye setup. Requirements: requirements.txt (OpenCV with its
bundled Haar face cascade, vgamepad + the ViGEmBus driver).
"""
from __future__ import annotations

import argparse
import glob
import json
import math
import os
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from headmath import (Smoother, average_rest, face_to_axes, normalize_face, pick_center, pick_tracked, search_scale, search_window,  # noqa: E402
                      size_band, smallest_face,
                      to_depth_trigger, to_trigger)

HERE = os.path.dirname(os.path.abspath(__file__))

# A source returns this when it has nothing new yet (as opposed to None: a frame could not be read).
# The main loop then keeps its last axes: no smoother update, no "lost face", the pad is still fed.
NO_FRAME = object()

# Follow the face nearest to the last one when it moved less than this fraction of the frame width.
TRACK_MAX_JUMP = 0.25


# ---------------------------------------------------------------------------------------------
# Frame sources
# ---------------------------------------------------------------------------------------------
class CameraSource:
    """A camera index or a stream address. A stream (an IP-camera app on a phone) is read by a background thread
    that keeps only the newest picture: a face search slower than the stream then never builds a backlog, which would
    both delay the head and make the app drop the connection. A stream that ends or stalls for `reopen_after` seconds
    is opened again."""

    def __init__(self, spec: str, width: int, height: int, reopen_after: float = 2.0):
        import cv2  # lazy: not needed for synthetic runs or tests
        self.cv2 = cv2
        self.spec, self.width, self.height, self.reopen_after = spec, width, height, reopen_after
        self.index = int(spec) if spec.isdigit() else spec
        self.cap = self._open()
        if not self.cap.isOpened():
            raise RuntimeError(f"could not open camera/stream {spec!r} (is another program holding it? try --source frames:<dir>)")
        self.stream = not isinstance(self.index, int)
        self.received, self.reopened = 0, 0
        self._latest, self._fresh, self._stop = None, False, False
        if self.stream:
            self._lock = threading.Lock()
            self._thread = threading.Thread(target=self._pump, daemon=True)
            self._thread.start()

    def _open(self):
        cv2 = self.cv2
        if isinstance(self.index, int):
            cap = cv2.VideoCapture(self.index, cv2.CAP_DSHOW) if os.name == "nt" else cv2.VideoCapture(self.index)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            return cap
        return cv2.VideoCapture(self.index)

    def _pump(self):
        last_ok = time.time()
        while not self._stop:
            ok, frame = self.cap.read()
            if ok:
                last_ok = time.time()
                with self._lock:
                    self._latest, self._fresh = frame, True
                    self.received += 1
            elif time.time() - last_ok > self.reopen_after:
                self.cap.release()
                time.sleep(0.5)
                self.cap = self._open()
                self.reopened += 1
                last_ok = time.time()
                print(f"headtrack: the stream stopped; opened it again ({self.reopened})", flush=True)
            else:
                time.sleep(0.02)

    def read(self):
        if not self.stream:
            ok, frame = self.cap.read()
            return frame if ok else None
        with self._lock:
            if not self._fresh:
                return NO_FRAME  # nothing newer than the last picture yet
            self._fresh = False
            return self._latest

    def close(self):
        self._stop = True
        if self.stream:
            self._thread.join(timeout=2.0)
        self.cap.release()


class FramesDirSource:
    """Newest image file in a directory (what a vision daemon that owns the camera can write).

    `read` returns NO_FRAME when there is nothing new: no file, the newest one already read (by
    name and mtime, so a daemon overwriting one file is still followed and an older file is not
    re-read when the newest is deleted), one younger than MIN_FILE_AGE (it may still be being
    written) or one OpenCV cannot decode yet (retried next tick). None of those is a lost face.
    """
    MIN_FILE_AGE = 0.05  # seconds

    def __init__(self, directory: str):
        import cv2
        self.cv2 = cv2
        self.directory = directory
        self.last = ("", 0.0)  # (path, mtime) of the frame read last
        if not os.path.isdir(directory):
            raise RuntimeError(f"frames directory not found: {directory}")

    def read(self):
        files = glob.glob(os.path.join(self.directory, "*.jpg")) + glob.glob(os.path.join(self.directory, "*.png"))
        if not files:
            return NO_FRAME
        try:
            newest = max(files, key=os.path.getmtime)
            mtime = os.path.getmtime(newest)
        except OSError:  # a file vanished between the glob and the stat
            return NO_FRAME
        if (newest, mtime) == self.last or mtime < self.last[1] or time.time() - mtime < self.MIN_FILE_AGE:
            return NO_FRAME
        frame = self.cv2.imread(newest)
        if frame is None:
            return NO_FRAME
        self.last = (newest, mtime)
        return frame

    def close(self):
        pass


class SyntheticSource:
    """A grey frame with a dark 'face' box swaying left-right and in-out: tests without a camera."""

    def __init__(self, width: int = 640, height: int = 480):
        self.w, self.h, self.t0 = width, height, time.time()

    def read(self):
        import numpy as np
        t = time.time() - self.t0
        frame = np.full((self.h, self.w, 3), 160, dtype=np.uint8)
        fw = int(100 * (1.0 + 0.3 * math.sin(t * 0.7)))
        cx = int(self.w * 0.5 + self.w * 0.25 * math.sin(t * 1.3))
        cy = int(self.h * 0.5)
        frame[max(0, cy - fw // 2):cy + fw // 2, max(0, cx - fw // 2):cx + fw // 2] = 40
        self._box = (cx - fw // 2, cy - fw // 2, fw, fw)
        return frame

    def synthetic_face(self):
        return self._box

    def close(self):
        pass


def open_source(spec: str, width: int, height: int):
    if spec == "synthetic":
        return SyntheticSource(width, height)
    if spec.startswith("frames:"):
        return FramesDirSource(spec[len("frames:"):])
    return CameraSource(spec, width, height)


# ---------------------------------------------------------------------------------------------
# Face detection (OpenCV's bundled Haar cascade: no model download)
# ---------------------------------------------------------------------------------------------
class HaarDetector:
    """scale_width: the frame is shrunk to this width before the search (0 = never shrunk); min_face: the smallest
    face searched for, in the shrunk picture's pixels (the cascade's own window is 24). Shrunk to 320 with 30 px,
    the default, a face must be 60 px wide in a 640 px picture: right for a webcam at a desk, too big for a couch
    three metres from a phone, where a face is 25 to 55 px wide in a 1280 px picture (--room)."""

    def __init__(self, scale_width: int = 320, min_face: int = 30):
        import cv2
        if not hasattr(cv2, "CascadeClassifier"):  # OpenCV 5 removed the Haar face finder and its cascade files
            raise RuntimeError(f"OpenCV {cv2.__version__} has no Haar face finder (OpenCV 5 removed it): "
                               "pip install \"opencv-python>=4.8,<5\"")
        self.cv2 = cv2
        path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        self.cascade = cv2.CascadeClassifier(path)
        if self.cascade.empty():
            raise RuntimeError(f"Haar cascade not found at {path}")
        self.scale_width = scale_width
        self.min_face = max(24, int(min_face))

    def detect(self, frame, near=None):
        """Faces in the picture as (x, y, w, h). With `near` (the last face's box), only a window around it is searched,
        at full resolution and for sizes close to it: a fraction of the work of the whole picture."""
        h, w = frame.shape[:2]
        if near is not None:
            x0, y0, x1, y1 = search_window(near, w, h)
            lo, hi = size_band(max(near[2], near[3]))
            if x1 - x0 >= lo and y1 - y0 >= lo:
                gray = self.cv2.cvtColor(frame[y0:y1, x0:x1], self.cv2.COLOR_BGR2GRAY)
                faces = self.cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(lo, lo), maxSize=(hi, hi))
                return [(x + x0, y + y0, fw, fh) for (x, y, fw, fh) in faces]
            return []
        s = search_scale(w, self.scale_width)
        small = self.cv2.resize(frame, (int(w * s), int(h * s))) if s != 1.0 else frame
        gray = self.cv2.cvtColor(small, self.cv2.COLOR_BGR2GRAY)
        faces = self.cascade.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=4, minSize=(self.min_face, self.min_face))
        return [(x / s, y / s, fw / s, fh / s) for (x, y, fw, fh) in faces]


# ---------------------------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------------------------
class PadOutput:
    """ViGEm virtual Xbox 360 pad.

    rightstick (default): x/y on the right stick, depth on the left trigger as `to_depth_trigger`
    (rest 0, only leaning in presses it). triggers: x on the left and y on the right trigger
    around TRIGGER_CENTRE (both rest half-pressed; the addon's /fide eye calibrate subtracts that),
    no depth. The left stick is never driven: it walks the character.
    """

    def __init__(self, mapping: str):
        import vgamepad as vg  # lazy: needs the ViGEmBus driver
        self.vg = vg
        self.pad = vg.VX360Gamepad()
        self.mapping = mapping

    def write(self, x: float, y: float, z: float):
        if self.mapping == "triggers":
            self.pad.left_trigger_float(value_float=to_trigger(x))
            self.pad.right_trigger_float(value_float=to_trigger(y))
        else:  # rightstick
            self.pad.right_joystick_float(x_value_float=x, y_value_float=y)
            self.pad.left_trigger_float(value_float=to_depth_trigger(z))
        self.pad.update()

    def close(self):
        try:
            self.pad.reset()
            self.pad.update()
        except Exception:
            pass


class HeadServer:
    """The newest head over HTTP (GET /head.json), for a twin on another machine: the tracker can run where there is
    processor to spare (say the 3080 PC, beside the phone's stream) and the laptop's twin reads it with
    `--head http://<this machine>:<port>/head.json`. Read-only; it serves the numbers head.json holds, nothing else."""

    def __init__(self, port: int, host: str = "0.0.0.0"):
        import http.server
        self.body = b"{}"
        outer = self

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path.split("?")[0] != "/head.json":
                    self.send_error(404)
                    return
                body = outer.body
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *a):
                pass

        self.httpd = http.server.ThreadingHTTPServer((host, port), Handler)
        self.httpd.daemon_threads = True
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    def update(self, payload: dict):
        self.body = json.dumps(payload).encode("utf-8")

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()


def lan_address() -> str:
    """This machine's address on its network, as another machine would use it (no packet is sent)."""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("192.0.2.1", 9))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "<this machine>"


def write_json_atomic(path: str, payload: dict, attempts: int = 5, wait: float = 0.005):
    """Write a new copy, then rename it over the old one, so a reader never sees half a file. Windows refuses the
    rename (WinError 5, access denied) while another program has the old file open, such as the twin server reading
    it every 30 ms or an antivirus scan of the new copy: the rename is tried again a few milliseconds later, up to
    `attempts` times in all (about 50 ms at most), before the error goes to the caller."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    for i in range(attempts):
        try:
            os.replace(tmp, path)
            return
        except PermissionError:
            if i == attempts - 1:
                raise
            time.sleep(wait * (i + 1))


# ---------------------------------------------------------------------------------------------
def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", default="0", help="camera index, MJPEG url, frames:<dir>, or synthetic")
    ap.add_argument("--width", type=int, default=640)
    ap.add_argument("--height", type=int, default=480)
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--gain", type=float, default=1.0)
    ap.add_argument("--deadzone", type=float, default=0.02)
    ap.add_argument("--map", default="rightstick", choices=["rightstick", "triggers"])
    ap.add_argument("--no-mirror", action="store_true", help="do not mirror left/right")
    ap.add_argument("--no-gamepad", action="store_true", help="write head.json only")
    ap.add_argument("--out", default=os.path.join(HERE, "head.json"))
    ap.add_argument("--show", action="store_true", help="preview window (c = recalibrate the rest pose, q = quit)")
    ap.add_argument("--calibrate-seconds", type=float, default=2.0,
                    help="average the face centre and width (the rest pose) over this long at start")
    ap.add_argument("--stale-seconds", type=float, default=2.0,
                    help="frames:<dir> only: drift back to rest when no new frame has arrived for this long")
    ap.add_argument("--duration", type=float, default=0.0, help="stop after this many seconds (0 = run until quit)")
    ap.add_argument("--pick", default="largest", choices=["largest", "center"],
                    help="whom to follow when there are several faces: the largest (nearest the camera) or the one "
                         "nearest the picture's centre line (straight in front of a camera centred on the screen)")
    ap.add_argument("--detect-width", type=int, default=320,
                    help="shrink each frame to this width before the face search (0 = search the full frame)")
    ap.add_argument("--min-face", type=int, default=30, help="the smallest face searched for, in the searched picture's pixels (at least 24)")
    ap.add_argument("--serve", type=int, default=0, metavar="PORT",
                    help="also serve the newest head at http://<this machine>:PORT/head.json, for a twin on another machine")
    ap.add_argument("--room", action="store_true",
                    help="a camera at a TV, watching a sofa: search the full frame for faces from 24 px and follow the "
                         "person straight ahead (--detect-width 0 --min-face 24 --pick center); stream at 1280x720")
    args = ap.parse_args(argv)
    if args.room:
        args.detect_width, args.min_face, args.pick = 0, 24, "center"

    source = open_source(args.source, args.width, args.height)
    synthetic = isinstance(source, SyntheticSource)
    detector = None if synthetic else HaarDetector(args.detect_width, args.min_face)
    pad = None if args.no_gamepad else PadOutput(args.map)
    served = HeadServer(args.serve) if args.serve else None
    if served is not None:
        print(f"headtrack: serving the head at http://{lan_address()}:{served.port}/head.json "
              f"(on the laptop: npm run twin -- --head http://{lan_address()}:{served.port}/head.json)", flush=True)
    mirror = not args.no_mirror
    smoother = Smoother()
    rest_x, rest_y, rest_width = 0.0, 0.0, 0.0           # calibrated rest pose (normalized centre, px width)
    cal_samples, cal_until = [], time.time() + args.calibrate_seconds
    frame_interval = 1.0 / max(1.0, args.fps)
    started = last = last_frame_at = time.time()
    frames, lost, stale, json_errors = 0, 0, 0, 0
    read_s, search_s, searched = 0.0, 0.0, 0  # where the time goes: waiting for the camera, searching for faces
    full_s, full_searches, ticks = 0.0, 0, 0     # whole-picture searches (no face near the last one); loop turns
    last_face, axes, said_size = None, (0.0, 0.0, 0.0), False
    cv2 = None
    if args.show:
        import cv2 as _cv2
        cv2 = _cv2
    print(f"headtrack: source={args.source} map={args.map} gamepad={'off' if pad is None else 'on'} out={args.out} "
          f"pick={args.pick} search={args.detect_width or 'full frame'} min face={max(24, args.min_face)}px", flush=True)
    try:
        while True:
            now = time.time()
            dt, last = now - last, now
            t_read = time.time()
            frame = source.read()
            read_s += time.time() - t_read
            key = -1
            if frame is NO_FRAME:
                if now - last_frame_at > args.stale_seconds:  # the source went quiet: drift back to rest
                    axes = smoother.update(dt, None)
                    stale += 1
                if cv2 is not None:  # keep the preview window answering q / c between frames
                    key = cv2.waitKey(1) & 0xFF
            elif frame is None:
                axes = smoother.update(dt, None)
                lost += 1
            else:
                last_frame_at = now
                h, w = frame.shape[:2]
                if not said_size:
                    said_size = True
                    print(f"headtrack: {w}x{h} frames; the smallest face it can find is {smallest_face(w, args.detect_width, args.min_face):.0f} px wide", flush=True)
                acquire = (lambda fs, fw=w: pick_center(fs, fw)) if args.pick == "center" else None
                t_search = time.time()
                if synthetic:
                    face = source.synthetic_face()
                else:
                    faces = detector.detect(frame, near=last_face) if last_face is not None else []
                    if not faces:  # no face near the last one (or none yet): search the whole picture
                        t_full = time.time()
                        faces = detector.detect(frame)
                        full_s += time.time() - t_full
                        full_searches += 1
                    face = pick_tracked(faces, last_face, TRACK_MAX_JUMP * w, acquire)
                search_s += time.time() - t_search
                searched += 1
                frames += 1
                if face is not None:
                    last_face = face
                if rest_width <= 0:  # calibrating: average the rest pose, output rest meanwhile
                    if face is not None:
                        cal_samples.append(normalize_face(face[0] + face[2] * 0.5, face[1] + face[3] * 0.5, w, h, mirror) + (face[2],))
                        if now >= cal_until or len(cal_samples) >= 60:
                            rest_x, rest_y, rest_width = average_rest(cal_samples)
                            print(f"headtrack: rest pose x {rest_x:+.2f} y {rest_y:+.2f}, face width {rest_width:.1f}px", flush=True)
                    target = None if face is None else (0.0, 0.0, 0.0)
                else:
                    target = face_to_axes(face, w, h, rest_width, args.gain, args.deadzone, mirror=mirror, rest_x=rest_x, rest_y=rest_y)
                axes = smoother.update(dt, target)
                if target is None:
                    lost += 1
                if cv2 is not None:
                    if face is not None:
                        x, y, fw, fh = (int(v) for v in face)
                        cv2.rectangle(frame, (x, y), (x + fw, y + fh), (0, 255, 200), 2)
                    status = "calibrating" if rest_width <= 0 else f"rest {rest_x:+.2f} {rest_y:+.2f} {rest_width:.0f}px"
                    cv2.putText(frame, f"x {axes[0]:+.2f} y {axes[1]:+.2f} z {axes[2]:+.2f}  {status}", (10, 24),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 200), 2)
                    cv2.imshow("Fidelity head tracker (c = calibrate, q = quit)", frame)
                    key = cv2.waitKey(1) & 0xFF
            if smoother.lost_for > smoother.hold:
                last_face = None  # lost beyond the hold: the next face is picked by the --pick rule again
            if key == ord("q"):
                break
            if key == ord("c"):
                rest_x, rest_y, rest_width = 0.0, 0.0, 0.0
                cal_samples, cal_until = [], time.time() + args.calibrate_seconds
            ticks += 1
            if pad is not None:
                pad.write(*axes)
            if served is not None or ticks % 3 == 0:  # the file every third turn; the network copy every turn
                payload = {"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "x": round(axes[0], 4), "y": round(axes[1], 4), "z": round(axes[2], 4),
                           "restX": round(rest_x, 4), "restY": round(rest_y, 4), "restWidth": round(rest_width, 1),
                           "frames": frames, "lost": lost, "stale": stale, "jsonErrors": json_errors,
                           "fps": round(frames / max(1e-6, time.time() - started), 1), "source": args.source, "map": args.map}
                if served is not None:
                    served.update(payload)
            if ticks % 3 == 0:
                try:
                    write_json_atomic(args.out, payload)
                except OSError as e:  # a reader holding the file (Windows), disk full, folder gone: the pad feed goes on
                    json_errors += 1
                    if json_errors == 1:
                        print(f"headtrack: WARNING cannot write {args.out} ({e}); the pad feed continues, further failures are only counted",
                              file=sys.stderr, flush=True)
            if args.duration and time.time() - started >= args.duration:
                break
            sleep = frame_interval - (time.time() - now)
            if sleep > 0:
                time.sleep(sleep)
    except KeyboardInterrupt:
        pass
    finally:
        source.close()
        if served is not None:
            served.close()
        if pad is not None:
            pad.close()
        if cv2 is not None:
            cv2.destroyAllWindows()
    elapsed = max(1e-6, time.time() - started)
    print(f"headtrack: {frames} frames, {lost} without a face, {stale} stale, {json_errors} head.json write errors, "
          f"{frames / elapsed:.1f} fps", flush=True)
    if getattr(source, "stream", False):
        print(f"headtrack: the stream delivered {source.received} pictures ({source.received / elapsed:.1f} a second) and was "
              f"opened again {source.reopened} times; the tracker used the newest each time", flush=True)
    if searched and detector is not None:  # (a synthetic source hands over its face: nothing is searched)
        print(f"headtrack: per frame, {1000 * read_s / max(1, ticks):.0f} ms waiting for the camera and "
              f"{1000 * search_s / searched:.0f} ms searching for faces; {full_searches} of {searched} searched the whole "
              f"picture ({1000 * full_s / max(1, full_searches):.0f} ms each), the rest only near the last face", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
