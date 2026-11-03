import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { commandEvidence, fileEvidence, flow, flowIntegrity, notMeasured, symbolic } from '../src/evidence.mjs';

const now = Date.parse('2026-11-03T12:00:00.000Z');
const iso = t => new Date(t).toISOString();

function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triad-evidence-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('fileEvidence reads the JSON at field when it is a valid date', t => {
  const file = path.join(scratch(t), 'density.json');
  fs.writeFileSync(file, JSON.stringify({ at: iso(now - 5000) }));
  const ev = fileEvidence(file, { now, freshMs: 30000 });
  assert.equal(ev.kind, 'measured');
  assert.equal(ev.source, file);
  assert.equal(ev.exists, true);
  assert.equal(ev.at, iso(now - 5000));
  assert.equal(ev.age_seconds, 5);
  assert.equal(ev.fresh, true);
  assert.equal(ev.fresh_within_seconds, 30);
});

test('fileEvidence marks a file older than its window as stale', t => {
  const file = path.join(scratch(t), 'density.json');
  fs.writeFileSync(file, JSON.stringify({ at: iso(now - 10 * 60 * 1000) }));
  const ev = fileEvidence(file, { now, freshMs: 30000 });
  assert.equal(ev.age_seconds, 600);
  assert.equal(ev.fresh, false);
  assert.equal(ev.exists, true);
});

test('fileEvidence falls back to the file mtime when there is no at field', t => {
  const file = path.join(scratch(t), 'tv_loop.json');
  fs.writeFileSync(file, JSON.stringify({ parts_up: 12 }));
  const mtime = new Date(now - 5000);
  fs.utimesSync(file, mtime, mtime);
  const ev = fileEvidence(file, { now, freshMs: 120000 });
  assert.equal(ev.at, fs.statSync(file).mtime.toISOString());
  assert.equal(ev.fresh, true);
  assert.ok(Math.abs(ev.age_seconds - 5) < 0.2);
});

test('fileEvidence falls back to the mtime for non-JSON files without throwing', t => {
  const file = path.join(scratch(t), 'status.json');
  fs.writeFileSync(file, 'not json {');
  const ev = fileEvidence(file, { now: Date.now(), freshMs: 30000 });
  assert.equal(ev.exists, true);
  assert.equal(ev.at, fs.statSync(file).mtime.toISOString());
});

test('fileEvidence reports a missing file as not fresh with no timestamp', t => {
  const file = path.join(scratch(t), 'absent.json');
  const ev = fileEvidence(file, { now, freshMs: 30000 });
  assert.deepEqual(ev, { kind: 'measured', source: file, exists: false, at: null, age_seconds: null, fresh: false, fresh_within_seconds: 30 });
});

test('commandEvidence keeps latency and timestamp, and is fresh only when it succeeded recently', () => {
  const ok = commandEvidence({ source: 'host:friend.json', ok: true, started_at_ms: now - 150, finished_at_ms: now - 100, now, freshMs: 90000 });
  assert.equal(ok.kind, 'measured');
  assert.equal(ok.ok, true);
  assert.equal(ok.latency_ms, 50);
  assert.equal(ok.at, iso(now - 100));
  assert.equal(ok.age_seconds, 0.1);
  assert.equal(ok.fresh, true);
  assert.equal(ok.error, null);

  const stale = commandEvidence({ source: 'host:friend.json', ok: true, started_at_ms: now - 300000, finished_at_ms: now - 200000, now, freshMs: 90000 });
  assert.equal(stale.fresh, false);

  const failed = commandEvidence({ source: 'host:friend.json', ok: false, started_at_ms: now - 20, finished_at_ms: now - 10, error: 'ssh: connect refused', now, freshMs: 90000 });
  assert.equal(failed.ok, false);
  assert.equal(failed.fresh, false);
  assert.equal(failed.error, 'ssh: connect refused');
});

test('flowIntegrity counts active flows and derives the ratio', () => {
  const make = (n) => Array.from({ length: 6 }, (_, i) => flow(`F${i}`, 'x', 'y', i < n, null));
  assert.deepEqual(flowIntegrity(make(0)), { active: 0, total: 6, ratio: 0 });
  assert.deepEqual(flowIntegrity(make(4)), { active: 4, total: 6, ratio: 4 / 6 });
  assert.deepEqual(flowIntegrity(make(6)), { active: 6, total: 6, ratio: 1 });
  assert.deepEqual(flowIntegrity([]), { active: 0, total: 0, ratio: 0 });
});

test('flow, symbolic and notMeasured keep their labels', () => {
  assert.deepEqual(flow('F32', 'Apex -> Sol', 'push', 0, notMeasured('none yet')), { flow: 'F32', label: 'Apex -> Sol', channel: 'push', active: false, evidence: { kind: 'not_measured', value: null, note: 'none yet' }, note: null });
  assert.deepEqual(symbolic(4, 'model'), { kind: 'symbolic', value: 4, note: 'model' });
});
