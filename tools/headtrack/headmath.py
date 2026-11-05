"""Pure mapping math for the webcam head tracker (no camera, no gamepad here, so it is testable).

Conventions: the camera image is mirrored like a mirror, so leaning to YOUR left moves the face
to the image's right; `normalize_face` undoes that so x = -1 is your left. y = +1 is up. Depth
z = +1 means you came close (face wider than at rest), -1 means you sat back. x and y are
relative to the calibrated rest pose (`face_to_axes` subtracts rest_x/rest_y), so (0, 0, 0) is
"sitting normally", which is also where `Smoother` drifts back to when the face is lost.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

TRIGGER_CENTRE = 0.5  # trigger value that stands for a bipolar axis at rest (--map triggers only)


def clamp(v: float, lo: float = -1.0, hi: float = 1.0) -> float:
    if v != v:  # NaN
        return 0.0
    return lo if v < lo else hi if v > hi else v


def normalize_face(cx: float, cy: float, frame_w: int, frame_h: int, mirror: bool = True) -> tuple[float, float]:
    """Face centre in pixels -> (x, y) in [-1, 1], x right, y up, mirrored by default."""
    if frame_w <= 0 or frame_h <= 0:
        return 0.0, 0.0
    x = (cx / frame_w - 0.5) * 2.0
    if mirror:
        x = -x
    y = (0.5 - cy / frame_h) * 2.0
    return clamp(x), clamp(y)


def depth_from_width(width: float, rest_width: float, span: float = 0.5) -> float:
    """Face width relative to the calibrated rest width -> z in [-1, 1]; `span` = width change for +-1."""
    if rest_width <= 0 or width <= 0 or span <= 0:
        return 0.0
    return clamp((width / rest_width - 1.0) / span)


def apply_gain_deadzone(v: float, gain: float = 1.0, deadzone: float = 0.02) -> float:
    if abs(v) < deadzone:
        return 0.0
    return clamp(v * gain)


def to_trigger(v: float) -> float:
    """Bipolar [-1, 1] -> trigger [0, 1] with 0 at TRIGGER_CENTRE (--map triggers puts x and y there).

    The trigger rests half-pressed by design; the addon's /fide eye calibrate subtracts that centre.
    """
    v = clamp(v)
    return TRIGGER_CENTRE + v * (TRIGGER_CENTRE if v < 0 else 1.0 - TRIGGER_CENTRE)


def to_depth_trigger(z: float) -> float:
    """Depth z -> left trigger [0, 1]: only coming closer presses it; rest (0) and sitting back give 0."""
    return clamp(z, 0.0, 1.0)


def average_rest(samples) -> tuple[float, float, float]:
    """Mean of (x, y, width) calibration samples -> (rest_x, rest_y, rest_width); zeros when empty."""
    n = len(samples)
    if n == 0:
        return 0.0, 0.0, 0.0
    return (sum(s[0] for s in samples) / n, sum(s[1] for s in samples) / n, sum(s[2] for s in samples) / n)


@dataclass
class Smoother:
    """Exponential smoothing with a time constant, hold-then-decay when the face is lost."""
    tau: float = 0.08          # seconds to reach 63% of a step
    hold: float = 0.5          # seconds to keep the last position after the face is lost
    decay_tau: float = 0.6     # seconds to drift back to rest after the hold
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    lost_for: float = 0.0
    _has_target: bool = field(default=False, repr=False)

    def update(self, dt: float, target: tuple[float, float, float] | None) -> tuple[float, float, float]:
        dt = max(0.0, min(dt, 0.5))
        if target is not None:
            self.lost_for = 0.0
            self._has_target = True
            a = 1.0 - math.exp(-dt / self.tau) if self.tau > 0 else 1.0
            self.x += (target[0] - self.x) * a
            self.y += (target[1] - self.y) * a
            self.z += (target[2] - self.z) * a
        else:
            self.lost_for += dt
            if self.lost_for > self.hold:
                a = 1.0 - math.exp(-dt / self.decay_tau) if self.decay_tau > 0 else 1.0
                self.x -= self.x * a
                self.y -= self.y * a
                self.z -= self.z * a
        return self.x, self.y, self.z


def pick_largest(faces) -> tuple[float, float, float, float] | None:
    """From (x, y, w, h) boxes, the largest by area, or None."""
    best = None
    for f in faces or []:
        x, y, w, h = f[0], f[1], f[2], f[3]
        if w <= 0 or h <= 0:
            continue
        if best is None or w * h > best[2] * best[3]:
            best = (float(x), float(y), float(w), float(h))
    return best


def search_scale(frame_w: float, scale_width: int) -> float:
    """How much a frame is shrunk before the face search: to `scale_width` when it is wider, never when 0."""
    return scale_width / float(frame_w) if 0 < scale_width < frame_w else 1.0


def smallest_face(frame_w: float, scale_width: int, min_face: int) -> float:
    """The narrowest face the search can find, in the camera picture's own pixels (the cascade's window is 24)."""
    return max(24, int(min_face)) / search_scale(frame_w, scale_width)


def search_window(face, frame_w: int, frame_h: int, margin: float = 1.0) -> tuple[int, int, int, int]:
    """Where to look for a face that was at `face` (x, y, w, h) in the last picture: its box grown by `margin` times
    its size on every side, clipped to the picture, as whole pixels (x0, y0, x1, y1). A head moves little between two
    pictures, so searching this small window instead of the whole picture costs a fraction of the time."""
    x, y, w, h = face
    m = margin * max(w, h)
    return (max(0, int(math.floor(x - m))), max(0, int(math.floor(y - m))),
            min(int(frame_w), int(math.ceil(x + w + m))), min(int(frame_h), int(math.ceil(y + h + m))))


def size_band(width: float, lo: float = 0.6, hi: float = 1.6, floor: int = 24) -> tuple[int, int]:
    """The face sizes worth trying near a face `width` px wide: lo to hi times it, never below the cascade's floor."""
    smallest = max(floor, int(width * lo))
    return smallest, max(smallest + 1, int(math.ceil(width * hi)))


def pick_center(faces, frame_w: float) -> tuple[float, float, float, float] | None:
    """The face whose centre is nearest the picture's vertical centre line: with the camera centred on the
    screen, the person sitting straight in front of it (the player, in a living room). Equal distances go to
    the larger box."""
    best, best_key = None, None
    for f in faces or []:
        x, y, w, h = f[0], f[1], f[2], f[3]
        if w <= 0 or h <= 0:
            continue
        key = (abs(x + w * 0.5 - frame_w * 0.5), -w * h)
        if best_key is None or key < best_key:
            best, best_key = (float(x), float(y), float(w), float(h)), key
    return best


def pick_tracked(faces, last_face, max_jump: float, acquire=None) -> tuple[float, float, float, float] | None:
    """The face to follow: with a `last_face`, the box whose centre is nearest to it when that
    distance is within `max_jump` pixels (continuity beats size, so a second person or a false
    positive nearer the camera cannot hijack the eye); otherwise, or without a last face, the one
    `acquire(faces)` picks: the largest by default, `pick_center` for the person straight ahead."""
    acquire = acquire or pick_largest
    if last_face is None:
        return acquire(faces)
    lcx, lcy = last_face[0] + last_face[2] * 0.5, last_face[1] + last_face[3] * 0.5
    best, best_d = None, 0.0
    for f in faces or []:
        x, y, w, h = f[0], f[1], f[2], f[3]
        if w <= 0 or h <= 0:
            continue
        d = math.hypot(x + w * 0.5 - lcx, y + h * 0.5 - lcy)
        if d <= max_jump and (best is None or d < best_d):
            best, best_d = (float(x), float(y), float(w), float(h)), d
    return best if best is not None else acquire(faces)


def face_to_axes(face, frame_w: int, frame_h: int, rest_width: float, gain: float = 1.0,
                 deadzone: float = 0.02, mirror: bool = True,
                 rest_x: float = 0.0, rest_y: float = 0.0) -> tuple[float, float, float] | None:
    """One detected face box -> (x, y, z) stick values, or None when no face.

    rest_x/rest_y are the calibrated normalized centre of the face at rest (same convention as
    `normalize_face`); they are subtracted before gain and deadzone so the rest pose gives (0, 0, 0).
    """
    if face is None:
        return None
    x, y, w, h = face
    nx, ny = normalize_face(x + w * 0.5, y + h * 0.5, frame_w, frame_h, mirror)
    z = depth_from_width(w, rest_width)
    return apply_gain_deadzone(nx - rest_x, gain, deadzone), apply_gain_deadzone(ny - rest_y, gain, deadzone), z
