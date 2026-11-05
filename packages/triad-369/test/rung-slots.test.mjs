// The rung verdicts in the Triad's reserved slots (owner ruling 7): rungs_traversed lists the rungs that
// hold and step_2_decision.rungs carries every verdict and the frontier, read from bridge/sync/rungs.json.
// A missing or malformed file reads not_measured; no number stands for the held set (owner ruling 3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rungSlots, RUNGS_SOURCE } from '../src/rung_slots.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const committed = JSON.parse(fs.readFileSync(path.join(root, 'bridge', 'sync', 'rungs.json'), 'utf8'));

test('the committed snapshot fills both slots: the rungs that hold, and every verdict with the frontier', () => {
  const slots = rungSlots(committed);
  assert.ok(slots.rungs_traversed.includes('fit:westfallbarrel01: holds (report 20261105-0530)'), slots.rungs_traversed.join(' | '));
  assert.ok(slots.rungs_traversed.includes('map: holds (report 20261104-1321)'));
  assert.ok(!slots.rungs_traversed.some(s => s.startsWith('projection:')), 'the projection fails: it is not traversed');
  assert.equal(slots.rungs_traversed.length, committed.awareness.length, 'the traversed rungs are the held set, one line each');
  assert.equal(slots.decision.status, 'judged');
  assert.equal(slots.decision.source, RUNGS_SOURCE);
  assert.equal(slots.decision.as_of, committed.asOf);
  assert.ok(slots.decision.frontier.includes('projection:abbey-door'));
  assert.deepEqual(slots.decision.verdicts.find(v => v.rung === 'projection:abbey-door'), { rung: 'projection:abbey-door', verdict: 'fails', report: '20261105-0530' });
});

test('a missing, malformed or unknown-verdict snapshot reads not_measured with nothing traversed', () => {
  const none = { rungs_traversed: [], decision: { status: 'not_measured', source: RUNGS_SOURCE } };
  for (const bad of [null, undefined, 'text', [], {}, { ...committed, asOf: 'yesterday' }, { ...committed, verdicts: [] },
    { ...committed, verdicts: [{ rung: 'map', verdict: 'awake', report: null }] }, { ...committed, frontier: ['no-such-rung'] }, { ...committed, verdicts: [{ rung: 7, verdict: 'holds', report: null }] }]) {
    assert.deepEqual(rungSlots(bad), none, JSON.stringify(bad)?.slice(0, 80));
  }
});

test('no number stands for the held set: the slots carry names and verdicts, no score, percentage, level or count', () => {
  const slots = rungSlots(committed);
  const walk = (v, at = '') => {
    if (typeof v === 'number') assert.fail(`a number at ${at}`);
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      assert.doesNotMatch(k, /score|percent|level|count|coherence|density/i, `the key ${at}.${k}`);
      walk(x, `${at}.${k}`);
    }
  };
  walk(slots);
  for (const k of Object.keys(committed)) assert.doesNotMatch(k, /score|percent|level|count/i);
  assert.ok(Array.isArray(committed.awareness) && committed.awareness.every(x => typeof x === 'string'), 'awareness is a list of rung names (owner ruling 3)');
});

test('the Apex reply carries the slots from its sync directory, and not_measured without the file; flows and the answer are unchanged', async () => {
  const bridge = fs.mkdtempSync(path.join(os.tmpdir(), 'rung-slots-'));
  const sync = path.join(bridge, 'sync');
  fs.mkdirSync(sync, { recursive: true });
  process.env.BRIDGE_ROOT = bridge;
  process.env.TRIAD_SYNC_DIR = sync;
  process.env.SSH_KEY = path.join(bridge, 'no-key');
  const { handleQueryCascade } = await import('../src/triad_369_process.mjs');
  const without = await handleQueryCascade({ id: 'q1', question: 'status of the rungs', record: false });
  assert.deepEqual(without.cascade_trace.rungs_traversed, []);
  assert.equal(without.teacher_handshake.step_2_decision.rungs.status, 'not_measured');
  assert.equal(without.teacher_handshake.step_2_decision.outcome, 'not_evaluated', 'the Teacher path is unchanged');
  fs.writeFileSync(path.join(sync, 'rungs.json'), JSON.stringify(committed));
  const withFile = await handleQueryCascade({ id: 'q2', question: 'status of the rungs', record: false });
  assert.deepEqual(withFile.cascade_trace.rungs_traversed, rungSlots(committed).rungs_traversed);
  assert.equal(withFile.teacher_handshake.step_2_decision.rungs.status, 'judged');
  assert.equal(withFile.teacher_handshake.step_2_decision.outcome, 'not_evaluated');
  assert.equal(withFile.loop_metrics.flows_active, without.loop_metrics.flows_active, 'no flow is added');
  assert.equal(withFile.answer, without.answer, 'the answer text does not change');
  fs.rmSync(bridge, { recursive: true, force: true });
});
