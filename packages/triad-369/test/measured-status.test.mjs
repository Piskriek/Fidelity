import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The Apex module reads BRIDGE_ROOT and SSH_KEY when it is imported, so set them first.
test('Apex flows, integrity and degraded list come from measured evidence, and go stale', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'triad-measured-status-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  process.env.BRIDGE_ROOT = root;
  process.env.SSH_KEY = path.join(root, 'no-ssh-key');
  const { stepHarmonicCycle } = await import('../src/triad_369_process.mjs');

  const loop = path.join(root, 'loop');
  const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  const seed = (name, value) => { fs.mkdirSync(loop, { recursive: true }); fs.writeFileSync(path.join(loop, name), JSON.stringify(value)); };
  const flowsById = state => Object.fromEntries(state.flows.map(f => [f.flow, f]));
  const hasValue = (value, target) => value === target || (value !== null && typeof value === 'object' && Object.values(value).some(v => hasValue(v, target)));

  const now = new Date().toISOString();
  seed('density.json', { at: now, status: 'synchronized', sol_tick: 15001, last_push: { at: now, ok: true, latency_ms: 120 } });
  seed('status.json', { at: now });
  await stepHarmonicCycle();
  await stepHarmonicCycle();

  const state = readJson(path.join(loop, 'triad_369.json'));
  const flows = flowsById(state);
  assert.equal(state.flows.length, 6);
  for (const id of ['F12', 'F21', 'F13', 'F31']) assert.equal(flows[id].active, true, id);
  assert.equal(flows.F23.active, false);
  assert.equal(flows.F23.evidence.ok, false);
  assert.equal(typeof flows.F23.evidence.error, 'string');
  assert.equal(flows.F32.active, false);
  assert.equal(flows.F32.evidence.kind, 'not_measured');
  assert.equal(state.flow_integrity, 4 / 6);
  assert.deepEqual(state.degraded_flows, ['F23', 'F32']);
  assert.equal(state.evidence.density.fresh, true);

  const check = readJson(path.join(root, 'sense/universe/pov/triad-apex.json')).check;
  assert.equal(hasValue(check.bridge_check, 42), false);
  assert.equal(check.whole_check.lyapunov_ftle.kind, 'not_measured');

  // Both density.json and status.json are aged: F13 is active when either file is fresh.
  const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  seed('density.json', { at: old, status: 'synchronized', sol_tick: 15001, last_push: { at: now, ok: true, latency_ms: 120 } });
  seed('status.json', { at: old });
  await stepHarmonicCycle();

  const stale = readJson(path.join(loop, 'triad_369.json'));
  const staleFlows = flowsById(stale);
  assert.equal(staleFlows.F13.active, false);
  assert.equal(staleFlows.F12.active, false);
  assert.equal(stale.evidence.density.fresh, false);
  assert.equal(stale.flow_integrity, 1 / 6);
});
