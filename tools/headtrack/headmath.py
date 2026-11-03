"""Pure mapping math for the webcam head tracker (no camera, no gamepad here, so it is testable).

Conventions: the camera image is mirrored like a mirror, so leaning to YOUR left moves the face
to the image's right; `normalize_face` undoes that so x = -1 is your left. y = +1 is up. Depth
z = +1 means you came close (face wider than at rest), -1 means you sat back.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field


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
    """[-1, 1] -> [0, 1] for a trigger axis (centre = 0.5)."""
    return clamp((v + 1.0) * 0.5, 0.0, 1.0)


@dataclass
class Smoother:
    """Exponential smoothing with a time constant, hold-then-decay when the face is lost."""
    tau: float = 0.08          # seconds to reach 63% of a step
    hold: float = 0.5          # seconds to keep the last position after the face is lost
    decay_tau: float = 0.6     # seconds to drift back to centre after the hold
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


def face_to_axes(face, frame_w: int, frame_h: int, rest_width: float, gain: float = 1.0,
                 deadzone: float = 0.02, mirror: bool = True) -> tuple[float, float, float] | None:
    """One detected face box -> (x, y, z) stick values, or None when no face."""
    if face is None:
        return None
    x, y, w, h = face
    nx, ny = normalize_face(x + w * 0.5, y + h * 0.5, frame_w, frame_h, mirror)
    z = depth_from_width(w, rest_width)
    return apply_gain_deadzone(nx, gain, deadzone), apply_gain_deadzone(ny, gain, deadzone), z
