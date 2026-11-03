import test from 'node:test';
import assert from 'node:assert/strict';
import { printStatus } from '../src/cli.mjs';

const stamp = '2026-11-03T12:00:00.000Z';
const fileEv = (name, age) => ({ kind: 'measured', source: `/bridge/loop/${name}`, exists: true, at: stamp, age_seconds: age, fresh: age <= 30, fresh_within_seconds: 30 });
const flow = (id, label, active, evidence, note = null) => ({ flow: id, label, channel: 'channel', active, evidence, note });

function holonStatus() {
  const flows = [
    flow('F12', 'Fidelity -> Sol', true, { kind: 'measured', source: '/bridge/loop/density.json', ok: true, at: stamp, latency_ms: 120, age_seconds: 2.1, fresh: true, error: null }),
    flow('F21', 'Sol -> Fidelity', true, { density: fileEv('density.json', 2.1), sol_tick: 15001 }),
    flow('F13', 'Fidelity -> Apex', true, { density: fileEv('density.json', 2.1), status: fileEv('status.json', 4.0), tv_loop: { ...fileEv('tv_loop.json', 0), exists: false, at: null, age_seconds: null, fresh: false } }),
    flow('F31', 'Apex -> Fidelity', true, { kind: 'measured', source: '/bridge/loop/triad_369.json', ok: true, at: stamp, age_seconds: 0.4, fresh: true }),
    flow('F23', 'Sol -> Apex', false, { kind: 'measured', source: 'RAMPAGE@192.168.0.5:/f/friend.json', ok: false, at: null, age_seconds: null, fresh: false, latency_ms: null, error: 'ssh key not configured' }),
    flow('F32', 'Apex -> Sol', false, { kind: 'not_measured', value: null, note: 'no push attempted yet' })
  ];
  return {
    bridge: 'triad-apex', running: true, pid: 4321, started_at: stamp, bridge_root: '/bridge',
    query_mode: 'rule-based keyword routing; no language model connected',
    holon: { schema: 1, measured_at: stamp, bridge_root: '/bridge', flow_integrity: 4 / 6, flows, degraded_flows: ['F23', 'F32'] }
  };
}

function render(status) {
  const chunks = [];
  printStatus({ write: text => chunks.push(text) }, status, false);
  return chunks.join('');
}

test('printStatus lists the holon flows with evidence and keeps every line under 100 characters', () => {
  const text = render(holonStatus());
  assert.match(text, /flows 4\/6 active; degraded: F23, F32/);
  const lines = text.split('\n');
  assert.ok(lines.some(line => line.startsWith('  F23') && line.includes('off')));
  assert.ok(lines.some(line => line.startsWith('  F12') && line.includes('ON')));
  for (const line of lines) assert.ok(line.length < 100, `too long (${line.length}): ${line}`);
});

test('printStatus without a holon prints only the three bridge lines', () => {
  const status = holonStatus();
  delete status.holon;
  const lines = render(status).trimEnd().split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^Triad query bridge: running \(PID 4321\)$/);
});
