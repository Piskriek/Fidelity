import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # run from anywhere: python -m unittest tools/headtrack/test_headmath.py
from headmath import (Smoother, apply_gain_deadzone, clamp, depth_from_width, face_to_axes, normalize_face,  # noqa: E402
                      pick_largest, to_trigger)


class HeadMathTests(unittest.TestCase):
    def test_normalize_is_mirrored_and_centred(self):
        self.assertEqual(normalize_face(320, 240, 640, 480), (0.0, 0.0))
        x, y = normalize_face(0, 0, 640, 480)          # image top-left
        self.assertEqual((x, y), (1.0, 1.0))           # mirrored: image left = your right; top = up
        x, y = normalize_face(640, 480, 640, 480, mirror=False)
        self.assertEqual((x, y), (1.0, -1.0))
        self.assertEqual(normalize_face(10, 10, 0, 0), (0.0, 0.0))

    def test_depth_from_width(self):
        self.assertEqual(depth_from_width(100, 100), 0.0)
        self.assertAlmostEqual(depth_from_width(125, 100), 0.5)   # 25% wider = halfway in
        self.assertEqual(depth_from_width(200, 100), 1.0)         # clamped
        self.assertAlmostEqual(depth_from_width(75, 100), -0.5)
        self.assertEqual(depth_from_width(50, 0), 0.0)

    def test_gain_deadzone_and_clamp(self):
        self.assertEqual(apply_gain_deadzone(0.01), 0.0)
        self.assertAlmostEqual(apply_gain_deadzone(0.5, gain=1.5), 0.75)
        self.assertEqual(apply_gain_deadzone(0.9, gain=2.0), 1.0)
        self.assertEqual(clamp(float("nan")), 0.0)
        self.assertEqual(to_trigger(-1), 0.0)
        self.assertEqual(to_trigger(1), 1.0)
        self.assertEqual(to_trigger(0), 0.5)

    def test_smoother_tracks_holds_then_decays(self):
        s = Smoother(tau=0.05, hold=0.2, decay_tau=0.2)
        for _ in range(30):
            x, y, z = s.update(1 / 30, (1.0, -1.0, 0.5))
        self.assertGreater(x, 0.99)
        self.assertLess(y, -0.99)
        s.update(0.1, None)
        self.assertGreater(s.x, 0.99, "within the hold the last position stays")
        for _ in range(60):
            s.update(1 / 30, None)
        self.assertLess(abs(s.x), 0.01, "after the hold it decays to centre")
        self.assertLess(abs(s.z), 0.01)

    def test_pick_largest_and_face_to_axes(self):
        self.assertIsNone(pick_largest([]))
        self.assertEqual(pick_largest([(0, 0, 10, 10), (5, 5, 40, 40), (1, 1, 20, 20)]), (5.0, 5.0, 40.0, 40.0))
        self.assertIsNone(face_to_axes(None, 640, 480, 100))
        # a face centred at image x = 160 (left quarter) and 25% wider than rest: your right, nearer
        x, y, z = face_to_axes((110, 190, 100, 100), 640, 480, 80)
        self.assertAlmostEqual(x, 0.5)
        self.assertAlmostEqual(y, 0.0)
        self.assertAlmostEqual(z, 0.5)


if __name__ == "__main__":
    unittest.main()
