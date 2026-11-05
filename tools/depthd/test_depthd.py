"""The depth service's own sizes and scaling (no model, no network)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import depthd  # noqa: E402


class SizeTests(unittest.TestCase):
    def test_the_model_sees_the_picture_at_the_processors_size(self):
        # DPTImageProcessor, keep_aspect_ratio, 518, multiple of 14: the side scaled least reaches 518
        self.assertEqual(depthd.resize_size(293, 518), (294, 518), "the page's 518 px wide picture: 37 x 21 patches")
        self.assertEqual(depthd.resize_size(1041, 1839), (518, 910), "a full report shot: the height reaches 518")
        self.assertEqual(depthd.resize_size(720, 1280), (518, 924))
        self.assertEqual(depthd.resize_size(518, 518), (518, 518))
        for h, w in ((293, 518), (1041, 1839), (720, 1280), (480, 640), (1080, 1920)):
            nh, nw = depthd.resize_size(h, w)
            self.assertEqual((nh % 14, nw % 14), (0, 0), (h, w))
            self.assertAlmostEqual(nw / nh, w / h, delta=0.05 * w / h, msg="the aspect is kept")

    def test_rounding_to_a_multiple_stays_within_bounds(self):
        self.assertEqual(depthd.constrain_to_multiple_of(20.9), 14)
        self.assertEqual(depthd.constrain_to_multiple_of(21.1), 28)
        self.assertEqual(depthd.constrain_to_multiple_of(27.0, max_val=20), 14)
        self.assertEqual(depthd.constrain_to_multiple_of(3.0, min_val=10), 14)


class BytesTests(unittest.TestCase):
    def test_the_nearest_is_255_and_the_farthest_0(self):
        import numpy as np
        d = depthd.to_bytes(np.array([[0.5, 2.0], [1.25, 3.5]], np.float32), np)
        self.assertEqual(d.dtype, np.uint8)
        self.assertEqual(d.tolist(), [[0, 128], [64, 255]])
        self.assertEqual(depthd.to_bytes(np.full((2, 2), 7.0, np.float32), np).tolist(), [[0, 0], [0, 0]], "a flat map")
        self.assertEqual(depthd.to_bytes(np.array([[np.nan, 1.0]], np.float32), np).tolist(), [[0, 0]], "a broken map")


class AddressTests(unittest.TestCase):
    def test_the_home_network_only(self):
        for a in ("127.0.0.1", "192.168.0.10", "10.146.2.173", "172.16.0.5", "::1"):
            self.assertTrue(depthd.allowed(a), a)
        for a in ("8.8.8.8", "1.1.1.1", "not an address"):
            self.assertFalse(depthd.allowed(a), a)


class ServerTests(unittest.TestCase):
    def test_a_picture_in_its_depth_out_on_one_connection_with_the_times(self):
        import gzip
        import http.client
        import threading
        import numpy as np

        class FakeModel:
            device, kind = "fake, q8", "q8"

            def run(self, picture):
                if picture.startswith(b"bad"):
                    raise ValueError("not a JPEG or PNG picture")
                return np.array([[0, 128, 255], [10, 20, 30]], np.uint8), 7.0

        srv = depthd.make_server(FakeModel(), 0, "127.0.0.1")
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            conn = http.client.HTTPConnection("127.0.0.1", srv.server_address[1], timeout=5)
            for _ in range(2):  # two pictures on one connection: it stays open between them
                conn.request("POST", "/depth", body=b"\xff\xd8picture", headers={"Content-Type": "image/jpeg"})
                r = conn.getresponse()
                body = r.read()
                self.assertEqual(r.status, 200)
                self.assertEqual((r.getheader("X-Depth-Width"), r.getheader("X-Depth-Height")), ("3", "2"))
                self.assertEqual(r.getheader("X-Depth-Ms"), "7")
                self.assertTrue(r.getheader("X-Depth-Total-Ms").isdigit(), "its own total, for the page's breakdown")
                self.assertEqual(r.getheader("X-Depth-Device"), "fake, q8")
                self.assertEqual(list(gzip.decompress(body)), [0, 128, 255, 10, 20, 30])
            conn.request("POST", "/depth", body=b"bad", headers={"Content-Type": "image/jpeg"})
            r = conn.getresponse(); r.read()
            self.assertEqual(r.status, 400)
            conn.close()
            conn = http.client.HTTPConnection("127.0.0.1", srv.server_address[1], timeout=5)
            conn.request("POST", "/depth", body=b"x", headers={"Content-Type": "text/plain"})
            r = conn.getresponse(); r.read()
            self.assertEqual(r.status, 415)
            self.assertEqual(r.getheader("Connection"), "close", "an error closes the connection: its unread body cannot start a next request")
            conn.close()
            conn = http.client.HTTPConnection("127.0.0.1", srv.server_address[1], timeout=5)
            conn.request("POST", "/depth", body=b"\xff\xd8picture", headers={"Content-Type": "image/jpeg"})
            r = conn.getresponse(); r.read()
            self.assertEqual(r.status, 200, "a fresh connection after an error works")
            conn.close()
        finally:
            srv.shutdown()
            srv.server_close()


if __name__ == "__main__":
    unittest.main()
