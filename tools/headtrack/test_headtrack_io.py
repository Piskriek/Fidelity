"""The tracker's head.json write survives the Windows refusal to replace a file another program has open."""
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # run from anywhere
import headtrack  # noqa: E402  (no camera library is loaded at import)

REAL_REPLACE = os.replace


class WriteJsonTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.path = os.path.join(self.dir, "head.json")

    def refuse(self, times):
        calls = {"n": 0}

        def replace(a, b):
            calls["n"] += 1
            if calls["n"] <= times:
                raise PermissionError(13, "Access is denied")  # what WinError 5 arrives as
            return REAL_REPLACE(a, b)
        return replace, calls

    def test_a_refused_rename_is_retried_and_the_new_copy_lands(self):
        replace, calls = self.refuse(2)
        with mock.patch.object(headtrack.os, "replace", replace), mock.patch.object(headtrack.time, "sleep") as nap:
            headtrack.write_json_atomic(self.path, {"x": 0.25})
        self.assertEqual(calls["n"], 3)
        self.assertEqual(nap.call_count, 2, "a short wait before each retry")
        with open(self.path, encoding="utf-8") as f:
            self.assertEqual(json.load(f), {"x": 0.25})
        self.assertFalse(os.path.exists(self.path + ".tmp"), "the new copy was renamed, not left behind")

    def test_a_rename_refused_every_time_reaches_the_caller(self):
        replace, calls = self.refuse(99)
        with mock.patch.object(headtrack.os, "replace", replace), mock.patch.object(headtrack.time, "sleep"):
            with self.assertRaises(PermissionError):
                headtrack.write_json_atomic(self.path, {"x": 1}, attempts=4)
        self.assertEqual(calls["n"], 4)

    def test_other_errors_are_not_retried(self):
        calls = {"n": 0}

        def replace(a, b):
            calls["n"] += 1
            raise FileNotFoundError(2, "No such file or directory")
        with mock.patch.object(headtrack.os, "replace", replace), mock.patch.object(headtrack.time, "sleep"):
            with self.assertRaises(FileNotFoundError):
                headtrack.write_json_atomic(self.path, {"x": 1})
        self.assertEqual(calls["n"], 1)


if __name__ == "__main__":
    unittest.main()
