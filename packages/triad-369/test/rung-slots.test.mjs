// The rung verdicts in the Triad's reserved slots (owner ruling 7): rungs_traversed lists the rungs that
// hold and step_2_decision.rungs carries every verdict and the frontier, read from bridge/sync/rungs.json.
// A missing, malformed or self-contradicting file reads not_measured; no number stands for the held set
// (owner ruling 3); no flow is added.
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
const NONE = { rungs_traversed: [], decision: { status: 'not_measured', source: RUNGS_SOURCE } };
const withVerdict = (rung, patch) => ({ ...committed, verdicts: committed.verdicts.map(v => (v.rung === rung ? { ...v, ...patch } : v)) });

test('the committed snapshot fills both slots: the rungs that hold, and every verdict with the frontier', () => {
  const slots = rungSlots(committed);
  const held = committed.verdicts.filter(v => v.verdict === 'holds');
  assert.deepEqual(slots.rungs_traversed, held.map(v => `${v.rung}: holds (report ${v.report})`), 'one line per held rung, in order');
  assert.ok(slots.rungs_traversed.includes('fit:westfallbarrel01: holds (report 20261105-0530)'));
  assert.ok(!slots.rungs_traversed.some(s => s.startsWith('projection:')), 'the projection fails: it is not traversed');
  assert.deepEqual(committed.awareness, held.map(v => v.rung), 'awareness is the held set, by name');
  assert.deepEqual(slots.decision, {
    status: 'judged', source: RUNGS_SOURCE, as_of: committed.asOf,
    verdicts: committed.verdicts.map(({ rung, verdict, report }) => ({ rung, verdict, report })),
    frontier: committed.frontier,
  });
});

test('a missing, malformed or self-contradicting snapshot reads not_measured with nothing traversed', () => {
  const projection = committed.verdicts.find(v => v.rung === 'projection:abbey-door');
  const cases = {
    'null': null, 'undefined': undefined, 'text': 'text', 'array': [], 'empty object': {},
    'a stamp that is not a time': { ...committed, asOf: 'yesterday' },
    'a second that does not exist': { ...committed, asOf: '2026-11-05 05:29:93' },
    'a month that does not exist': { ...committed, asOf: '2026-13-05 05:29:30' },
    'no verdicts and no frontier': { ...committed, verdicts: [], frontier: [] },
    'an unknown verdict on a rung off the frontier': withVerdict('map', { verdict: 'awake' }),
    'a rung that is not a name, off the frontier': withVerdict('map', { rung: 7 }),
    'one rung twice with opposite verdicts, off the frontier': { ...committed, verdicts: [...committed.verdicts, { ...committed.verdicts.find(v => v.rung === 'map'), verdict: 'fails' }] },
    'one rung twice with the same verdict': { ...committed, verdicts: [...committed.verdicts, committed.verdicts.find(v => v.rung === 'map')] },
    'a frontier naming a blocked rung': { ...committed, frontier: [...committed.frontier, committed.verdicts.find(v => v.verdict === 'blocked').rung] },
    'a fitted rung with no report': withVerdict('fit:jar01', { report: null }),
    'a contested rung with no report': withVerdict('fit:jar01', { verdict: 'contested', report: null }),
    'an empty report': withVerdict('map', { report: '' }),
    'a blocked rung with a report that is not text': withVerdict(committed.verdicts.find(v => v.verdict === 'blocked').rung, { report: 7 }),
    'a frontier naming a held rung': { ...committed, frontier: [...committed.frontier, 'map'] },
    'a frontier naming no rung': { ...committed, frontier: [...committed.frontier, 'no-such-rung'] },
    'a frontier listing a rung twice': { ...committed, frontier: [...committed.frontier, committed.frontier[0]] },
    'a hold with no report': withVerdict('map', { report: null }),
    'a failure with no report': withVerdict('projection:abbey-door', { report: null }),
    'a report that is not text': withVerdict('map', { report: 20261104 }),
  };
  for (const [name, bad] of Object.entries(cases)) assert.deepEqual(rungSlots(bad), NONE, name);
  // a blocked or unmeasured rung needs no report
  const blocked = committed.verdicts.find(v => v.verdict === 'blocked');
  assert.ok(blocked && blocked.report === null && rungSlots(committed).decision.status === 'judged');
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

test('no seventh flow: the Apex defines its six flows and reads the rungs file only in the query reply', () => {
  const src = fs.readFileSync(path.join(here, '..', 'src', 'triad_369_process.mjs'), 'utf8');
  const flows = [...src.matchAll(/flow\('(F\d\d)'/g)].map(m => m[1]);
  assert.deepEqual(flows, ['F12', 'F21', 'F13', 'F31', 'F23', 'F32'], 'the six directed flows, unchanged');
  const reads = [...src.matchAll(/RUNGS_FILE/g)].length;
  assert.equal(reads, 2, 'declared once and read once');
  const query = src.slice(src.indexOf('export async function handleQueryCascade'), src.indexOf('export function checkQueryInbox'));
  assert.match(query, /rungSlots\(readJson\(RUNGS_FILE, null\)\)/, 'the one read is in the query reply');
});

test('the Apex reply carries the slots from its sync directory, and not_measured without the file; the answer is unchanged', async () => {
  const bridge = fs.mkdtempSync(path.join(os.tmpdir(), 'rung-slots-'));
  const sync = path.join(bridge, 'sync');
  fs.mkdirSync(sync, { recursive: true });
  process.env.BRIDGE_ROOT = bridge;
  process.env.TRIAD_SYNC_DIR = sync;
  process.env.SSH_KEY = path.join(bridge, 'no-key');
  const { handleQueryCascade } = await import('../src/triad_369_process.mjs');
  const without = await handleQueryCascade({ id: 'q1', question: 'status of the rungs', record: false });
  assert.deepEqual(without.cascade_trace.rungs_traversed, []);
  assert.deepEqual(without.teacher_handshake.step_2_decision.rungs, NONE.decision);
  assert.equal(without.teacher_handshake.step_2_decision.outcome, 'not_evaluated', 'the Teacher path is unchanged');
  fs.writeFileSync(path.join(sync, 'rungs.json'), JSON.stringify(committed));
  const withFile = await handleQueryCascade({ id: 'q2', question: 'status of the rungs', record: false });
  const expected = rungSlots(committed);
  assert.deepEqual(withFile.cascade_trace.rungs_traversed, expected.rungs_traversed);
  assert.deepEqual(withFile.teacher_handshake.step_2_decision.rungs, expected.decision);
  assert.equal(withFile.teacher_handshake.step_2_decision.outcome, 'not_evaluated');
  assert.equal(withFile.answer, without.answer, 'the answer text does not change');
  fs.writeFileSync(path.join(sync, 'rungs.json'), '{ not json');
  const broken = await handleQueryCascade({ id: 'q3', question: 'status of the rungs', record: false });
  assert.deepEqual(broken.teacher_handshake.step_2_decision.rungs, NONE.decision, 'an unreadable file reads not_measured');
  fs.rmSync(bridge, { recursive: true, force: true });
});
