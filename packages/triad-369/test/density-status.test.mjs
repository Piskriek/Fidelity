// packages/triad-369/test/density-status.test.mjs
// The density bridge's status is derived from what it could reach, never the constant
// 'synchronized' it used to write on every tick (council round 2026-11-04-bridges).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'density-status-'));
process.env.BRIDGE_ROOT = root;
process.env.SSH_KEY = path.join(root, 'no-such-key');
const { stepBridge, solIsUp } = await import('../src/density_bridge.mjs');

test('Sol is up only when friend.json says so AND is young: a timer file that outlives Sol does not count', () => {
  const now = Date.parse('2026-11-04T05:00:00Z');
  assert.equal(solIsUp({ up: true, at: '2026-11-04T04:59:00Z' }, now), true, 'one minute old: up');
  assert.equal(solIsUp({ up: true, at: '2026-11-04T04:56:00Z' }, now), false, 'four minutes old: not up');
  assert.equal(solIsUp({ up: true, at: '2026-11-04T05:10:00Z' }, now), false, 'a future stamp (clock skew) does not count');
  assert.equal(solIsUp({ up: true }, now), false, 'no stamp: not up');
  assert.equal(solIsUp({ up: false, at: '2026-11-04T04:59:30Z' }, now), false, 'up:false is down');
  assert.equal(solIsUp(null, now), false);
});

test('without an SSH key the bridge says local_only, and the four floats and daemon count are what it computed', async () => {
  await stepBridge();
  const density = JSON.parse(fs.readFileSync(path.join(root, 'loop', 'density.json'), 'utf8'));
  assert.equal(density.status, 'local_only', `status ${density.status}`);
  assert.notEqual(density.status, 'synchronized');
  assert.equal(density.sol_tick, null, 'no Sol was read');
  assert.equal(density.four_floats_kind, 'symbolic (model-derived, not sensor)', 'the four floats carry their label (council round 2026-11-04-operator)');
  assert.ok(Array.isArray(density.four_floats) && density.four_floats.length === 4);
  assert.equal(density.lyapunovFTLE ?? null, null, 'FTLE is not measured here');
  fs.rmSync(root, { recursive: true, force: true });
});
