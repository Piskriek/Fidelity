// tools/room.test.mjs - the room launcher's own rules (tools/room/launch.mjs): its options, where it finds python,
// the phone's stream address, and the plain words it says about the head.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { parseArgs, findPython, streamUrl, describeHead, describePage } from './room/launch.mjs';

test('the launcher\'s options: the phone is required, the depth is browser or local, every option needs a value', () => {
  const o = parseArgs(['--phone', '192.168.0.4']);
  assert.equal(o.phone, '192.168.0.4'); assert.equal(o.depth, 'browser'); assert.equal(o.port, 5203); assert.equal(o.stream, '/video/force/1280x720');
  assert.equal(parseArgs(['--phone', '192.168.0.4:4848', '--depth', 'local', '--port', '5300']).depth, 'local');
  assert.throws(() => parseArgs([]), /--phone is the address DroidCam shows/);
  assert.throws(() => parseArgs(['--phone', 'http://192.168.0.4/video']), /--phone is the address/, 'an address, not a URL');
  assert.throws(() => parseArgs(['--phone', '192.168.0.4', '--depth', 'gpu']), /--depth is browser/);
  assert.throws(() => parseArgs(['--phone']), /needs a value/);
  assert.throws(() => parseArgs(['--phone', '192.168.0.4', '--port', '99999']), /--port/);
  assert.throws(() => parseArgs(['--phone', '192.168.0.4', '--stream', 'video']), /--stream/);
  assert.throws(() => parseArgs(['--phone', '192.168.0.4', '--whatever', '1']), /unknown argument/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('the launcher finds the repository\'s python on Windows and elsewhere, or takes the one it is given', () => {
  const root = path.join('X', 'repo');
  const win = path.join(root, '.venv', 'Scripts', 'python.exe'), nix = path.join(root, '.venv', 'bin', 'python');
  assert.equal(findPython(null, root, p => p === win), win);
  assert.equal(findPython(null, root, p => p === nix), nix);
  assert.equal(findPython('C:\\py\\python.exe', root, () => true), 'C:\\py\\python.exe');
  assert.match(findPython(null, root, () => false), /^python3?$/);
});

test('the phone\'s stream address: DroidCam\'s port unless one is given', () => {
  assert.equal(streamUrl('192.168.0.4', '/video/force/1280x720'), 'http://192.168.0.4:4747/video/force/1280x720');
  assert.equal(streamUrl('192.168.0.4:4848', '/video'), 'http://192.168.0.4:4848/video');
});

test('the plain words about the head: not yet, stale, waiting for a face, tracking, and a face near the edge', () => {
  assert.match(describeHead(null, Infinity), /no head.json yet/);
  assert.match(describeHead({ restWidth: 60 }, 8000), /8 s old/);
  assert.match(describeHead({ restWidth: 0 }, 100), /waiting to see your face/);
  const ok = describeHead({ restWidth: 61, restX: 0.06, restY: 0.02, fps: 23, x: 0.03, y: 0 }, 100);
  assert.match(ok, /tracking \(rest x 0.06 y 0.02, face 61 px\), 23.0 pictures a second/);
  assert.doesNotMatch(ok, /re-aim/);
  assert.match(describeHead({ restWidth: 53, restX: -0.48, restY: -0.77, fps: 20, x: 0, y: 0 }, 100), /near the edge of the phone's picture: re-aim it/, 'the owner\'s first rest pose (05 Nov) would have been flagged');
});

test('the plain words about the page: not open, gone quiet, a live window with its numbers, a still picture with an error', () => {
  assert.match(describePage(null, null, 5203), /not open yet \(in Chrome on this PC: http:\/\/localhost:5203\/live\)/);
  assert.match(describePage({ renderFps: 60 }, 9000), /no word from it for 9 s \(closed, minimized/);
  assert.match(describePage({ renderFps: 60 }, undefined), /no word from it/, 'no age is no word');
  const live = describePage({ live: true, renderFps: 59.8, captureFps: 29.6, width: 1920, height: 1080, fullscreen: true, depthDevice: 'graphics card (WebGPU: nvidia), fp16', depthMs: 61.2, depthPerSecond: 14.5, head: 'head tracker', headPerSecond: 26.4 }, 500);
  assert.match(live, /^page: drawing 60 pictures a second at 1920 x 1080, full screen; /);
  assert.match(live, /; the window captured at 30 pictures a second; /);
  assert.match(live, /; depth 61 ms a picture on the graphics card \(WebGPU: nvidia\), fp16, 15 a second; /);
  assert.match(live, /; head: head tracker, 26 updates a second$/);
  assert.match(describePage({ live: false, picture: 'shot (1920 x 1080)', renderFps: 4.2, depthError: 'the depth service did not answer', head: 'mouse' }, 100),
    /^page: drawing 4.2 pictures a second; a still picture, shot \(1920 x 1080\); depth: the depth service did not answer; head: mouse$/);
  assert.match(describePage({ live: true, renderFps: 60, captureFps: 0, depthNote: 'loading the depth model: 40%', head: 'head tracker' }, 100), /captured at 0.0 pictures a second; depth: loading the depth model: 40%/);
  assert.match(describePage({ live: true, renderFps: 60, captureFps: 30, depthMs: 189, depthDevice: 'depth service', depthPerSecond: 3, depthBreakdown: '5 ms making the picture + 180 ms on the service\'s machine', head: 'head tracker' }, 100),
    /\n {4}where a depth picture's time goes: 5 ms making the picture \+ 180 ms/);
});
