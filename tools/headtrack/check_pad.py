#!/usr/bin/env python3
"""Proves the virtual gamepad path end to end on this PC: feed known values through ViGEm, read
them back through Windows' own XInput, the same API the game uses. Exit 0 on PASS.

    python check_pad.py
"""
from __future__ import annotations

import ctypes
import sys
import time


class XINPUT_GAMEPAD(ctypes.Structure):
    _fields_ = [("wButtons", ctypes.c_ushort), ("bLeftTrigger", ctypes.c_ubyte), ("bRightTrigger", ctypes.c_ubyte),
                ("sThumbLX", ctypes.c_short), ("sThumbLY", ctypes.c_short), ("sThumbRX", ctypes.c_short), ("sThumbRY", ctypes.c_short)]


class XINPUT_STATE(ctypes.Structure):
    _fields_ = [("dwPacketNumber", ctypes.c_uint), ("Gamepad", XINPUT_GAMEPAD)]


def read_states():
    xinput = None
    for name in ("xinput1_4.dll", "xinput1_3.dll", "xinput9_1_0.dll"):
        try:
            xinput = ctypes.windll.LoadLibrary(name)
            break
        except OSError:
            continue
    if xinput is None:
        raise RuntimeError("no XInput DLL found")
    states = []
    for i in range(4):
        st = XINPUT_STATE()
        if xinput.XInputGetState(i, ctypes.byref(st)) == 0:
            states.append((i, st.Gamepad))
    return states


def main() -> int:
    import vgamepad as vg
    pad = vg.VX360Gamepad()
    cases = [(0.5, -0.25, 0.75), (-0.8, 0.6, 0.0), (0.0, 0.0, 1.0)]
    ok_all = True
    for rx, ry, lt in cases:
        pad.right_joystick_float(x_value_float=rx, y_value_float=ry)
        pad.left_trigger_float(value_float=lt)
        pad.update()
        time.sleep(0.15)
        found = None
        for idx, g in read_states():
            gx, gy, gt = g.sThumbRX / 32767.0, g.sThumbRY / 32767.0, g.bLeftTrigger / 255.0
            if abs(gx - rx) < 0.03 and abs(gy - ry) < 0.03 and abs(gt - lt) < 0.03:
                found = (idx, gx, gy, gt)
                break
        if found:
            print(f"PASS fed right stick ({rx:+.2f}, {ry:+.2f}) trigger {lt:.2f} -> XInput user {found[0]} reads ({found[1]:+.2f}, {found[2]:+.2f}) {found[3]:.2f}")
        else:
            ok_all = False
            seen = ", ".join(f"user {i}: RX {g.sThumbRX / 32767.0:+.2f} RY {g.sThumbRY / 32767.0:+.2f} LT {g.bLeftTrigger / 255.0:.2f}" for i, g in read_states()) or "no XInput devices"
            print(f"FAIL fed ({rx:+.2f}, {ry:+.2f}, {lt:.2f}); seen: {seen}")
    pad.reset()
    pad.update()
    print("virtual gamepad check:", "PASS" if ok_all else "FAIL")
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(main())
