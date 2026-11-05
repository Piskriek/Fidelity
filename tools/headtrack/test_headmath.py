import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # run from anywhere: python -m unittest tools/headtrack/test_headmath.py
from headmath import (TRIGGER_CENTRE, Smoother, apply_gain_deadzone, average_rest, clamp, depth_from_width,  # noqa: E402
                      face_to_axes, normalize_face, pick_center, pick_largest, pick_tracked, search_scale, search_window,
                      size_band, smallest_face,
                      to_depth_trigger, to_trigger)


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

    def test_to_trigger_is_centred_for_the_triggers_mapping(self):
        self.assertEqual(TRIGGER_CENTRE, 0.5)
        self.assertEqual(to_trigger(0), TRIGGER_CENTRE)
        self.assertEqual(to_trigger(-1), 0.0)
        self.assertEqual(to_trigger(1), 1.0)
        self.assertAlmostEqual(to_trigger(0.5), 0.75)
        self.assertAlmostEqual(to_trigger(-0.5), 0.25)
        self.assertEqual(to_trigger(3), 1.0)                      # clamped

    def test_depth_trigger_rests_at_zero(self):
        self.assertEqual(to_depth_trigger(0.0), 0.0, "rest must not press the trigger")
        self.assertEqual(to_depth_trigger(-1.0), 0.0, "sitting back does nothing")
        self.assertEqual(to_depth_trigger(-0.3), 0.0)
        self.assertAlmostEqual(to_depth_trigger(0.5), 0.5, msg="leaning in presses it")
        self.assertEqual(to_depth_trigger(1.0), 1.0)
        self.assertEqual(to_depth_trigger(2.0), 1.0)
        self.assertEqual(to_depth_trigger(float("nan")), 0.0)

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
        self.assertLess(abs(s.x), 0.01, "after the hold it decays to rest")
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

    def test_face_to_axes_is_relative_to_the_calibrated_rest(self):
        # rest pose: the face sat off-centre (image x = 160 -> mirrored +0.5, image y = 180 -> +0.25)
        rest = (110, 130, 100, 100)
        rx, ry = normalize_face(rest[0] + 50, rest[1] + 50, 640, 480)
        self.assertAlmostEqual(rx, 0.5)
        self.assertAlmostEqual(ry, 0.25)
        self.assertEqual(face_to_axes(rest, 640, 480, 100, rest_x=rx, rest_y=ry), (0.0, 0.0, 0.0),
                         "the rest pose must give 0 so a lost-face decay to 0 lands on it, not on the image centre")
        # the same face 160 px further toward image right (your left) and 48 px lower: a lean, measured from rest
        x, y, z = face_to_axes((270, 178, 100, 100), 640, 480, 100, rest_x=rx, rest_y=ry)
        self.assertAlmostEqual(x, -0.5)
        self.assertAlmostEqual(y, -0.2)
        self.assertEqual(z, 0.0)
        # gain and deadzone apply to the offset from rest, and the result is still clamped
        x, y, _ = face_to_axes((270, 178, 100, 100), 640, 480, 100, gain=3.0, rest_x=rx, rest_y=ry)
        self.assertEqual(x, -1.0)
        self.assertAlmostEqual(y, -0.6)
        x, _, _ = face_to_axes((108, 130, 100, 100), 640, 480, 100, deadzone=0.02, rest_x=rx, rest_y=ry)
        self.assertEqual(x, 0.0, "a 2 px wobble around rest is inside the deadzone")
        # default rest (0, 0) keeps the old image-centre behaviour
        self.assertEqual(face_to_axes(rest, 640, 480, 100)[:2], (0.5, 0.25))

    def test_average_rest(self):
        self.assertEqual(average_rest([]), (0.0, 0.0, 0.0))
        rx, ry, rw = average_rest([(0.4, 0.2, 90.0), (0.6, 0.3, 110.0)])
        self.assertAlmostEqual(rx, 0.5)
        self.assertAlmostEqual(ry, 0.25)
        self.assertAlmostEqual(rw, 100.0)

    def test_pick_center_follows_the_person_straight_ahead(self):
        side_big = (40, 100, 120, 120)                              # centre x 100: nearer the camera, off to the side
        middle_small = (600, 120, 60, 60)                           # centre x 630: straight ahead in a 1280 px picture
        self.assertEqual(pick_center([side_big, middle_small], 1280), (600.0, 120.0, 60.0, 60.0))
        self.assertEqual(pick_largest([side_big, middle_small]), (40.0, 100.0, 120.0, 120.0), "the old rule takes the near one")
        tie_left, tie_right = (590, 100, 40, 40), (630, 100, 60, 60)  # centres 610 and 660: both 30 / 20 px off 640
        self.assertEqual(pick_center([tie_left, tie_right], 1280), (630.0, 100.0, 60.0, 60.0), "the nearer the centre line wins")
        same_a, same_b = (620, 100, 40, 40), (600, 300, 80, 80)    # both centres at x 640
        self.assertEqual(pick_center([same_a, same_b], 1280), (600.0, 300.0, 80.0, 80.0), "equal distances go to the larger")
        self.assertIsNone(pick_center([], 1280))
        self.assertIsNone(pick_center([(0, 0, 0, 5)], 1280), "degenerate boxes are skipped")

    def test_pick_tracked_acquires_by_the_rule_then_keeps_the_same_person(self):
        center = lambda fs: pick_center(fs, 1280)
        side_big, middle = (40, 100, 120, 120), (600, 120, 60, 60)
        first = pick_tracked([side_big, middle], None, 320.0, center)
        self.assertEqual(first, (600.0, 120.0, 60.0, 60.0), "acquired: the person straight ahead")
        moved = (420, 120, 60, 60)                                  # the player leans 180 px to the left
        self.assertEqual(pick_tracked([side_big, moved], first, 320.0, center), (420.0, 120.0, 60.0, 60.0),
                         "kept: still the same person, though the other face is larger and now as near the centre")
        self.assertEqual(pick_tracked([side_big], first, 320.0, center), (40.0, 100.0, 120.0, 120.0),
                         "lost beyond max_jump: re-acquired by the rule from what is left")

    def test_the_next_search_looks_only_near_the_last_face(self):
        self.assertEqual(search_window((600, 300, 64, 64), 1280, 720), (536, 236, 728, 428), "one face size on every side")
        self.assertEqual(search_window((10, 5, 50, 50), 1280, 720), (0, 0, 110, 105), "clipped at the top left")
        self.assertEqual(search_window((1250, 690, 40, 40), 1280, 720, margin=0.5), (1230, 670, 1280, 720), "and at the bottom right")
        x0, y0, x1, y1 = search_window((600, 300, 64, 64), 1280, 720)
        self.assertLess((x1 - x0) * (y1 - y0), 1280 * 720 / 20, "a twentieth of a 720p picture or less")
        self.assertEqual(size_band(64.5), (38, 104))
        self.assertEqual(size_band(30), (24, 48), "never below the cascade's 24 px")
        self.assertEqual(size_band(10), (24, 25), "a band is never empty")

    def test_the_search_size_decides_how_far_away_a_face_can_be_found(self):
        self.assertEqual(search_scale(640, 320), 0.5)
        self.assertEqual(search_scale(320, 320), 1.0)
        self.assertEqual(search_scale(1280, 0), 1.0, "0 searches the full frame")
        self.assertEqual(smallest_face(640, 320, 30), 60.0, "the default: a desk webcam at 640 px")
        self.assertEqual(smallest_face(1280, 320, 30), 120.0, "the default on a 720p phone stream: a face must be 120 px")
        self.assertEqual(smallest_face(1280, 0, 24), 24.0, "--room: a face three metres from a phone, about 26 px at 1280")
        self.assertEqual(smallest_face(1280, 0, 10), 24.0, "never below the cascade's own 24 px window")

    def test_pick_tracked_prefers_continuity_within_max_jump(self):
        last = (100, 100, 80, 80)                                   # centre (140, 140)
        near_small = (110, 105, 70, 70)                             # centre (145, 140): 5 px away
        far_big = (400, 100, 200, 200)                              # centre (500, 200): a second, bigger face
        self.assertEqual(pick_tracked([far_big, near_small], last, 160.0), (110.0, 105.0, 70.0, 70.0),
                         "the nearer face wins over the larger one while it is within max_jump")
        self.assertEqual(pick_tracked([far_big, near_small], None, 160.0), (400.0, 100.0, 200.0, 200.0),
                         "without a last face the largest wins")
        self.assertEqual(pick_tracked([far_big], last, 160.0), (400.0, 100.0, 200.0, 200.0),
                         "a jump beyond max_jump falls back to the largest")
        self.assertEqual(pick_tracked([far_big, near_small], last, 2.0), (400.0, 100.0, 200.0, 200.0),
                         "even the nearest face is ignored when it moved more than max_jump")
        self.assertIsNone(pick_tracked([], last, 160.0))
        self.assertIsNone(pick_tracked(None, None, 160.0))
        self.assertEqual(pick_tracked([(0, 0, 0, 10), near_small], last, 160.0), (110.0, 105.0, 70.0, 70.0),
                         "degenerate boxes are skipped")
        # among several candidates within max_jump the nearest centre wins, not the biggest
        nearer = (120, 120, 40, 40)                                 # centre (140, 140): 0 px away
        self.assertEqual(pick_tracked([near_small, nearer], last, 160.0), (120.0, 120.0, 40.0, 40.0))


if __name__ == "__main__":
    unittest.main()
