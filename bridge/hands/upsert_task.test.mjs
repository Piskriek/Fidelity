// bridge/hands/upsert_task.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { controlCharacters, parseArgs, pickTask, upsert } from './upsert_task.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = path.join(here, 'upsert_task.mjs');
const task = (id, priority, extra = {}) => ({ id, requested_at: '2026-11-03T12:00:00Z', priority, title: `task ${id}`, steps: ['git -C D:\\fidelity-repo fetch origin'], report: ['x'], status: 'requested', ...extra });
const doc = () => ({ schema: 'fidelity-hands-v1', from: 'claude@node2', updated_at: '2026-11-03T12:00:00Z', tasks: [task('H001', 1), task('H002', 2)] });

test('upsert replaces a task by id, keeps the others, orders by priority and stamps updated_at', () => {
  const next = upsert(doc(), task('H002', 0, { title: 'new H002' }), { at: '2026-11-03T20:00:00Z' });
  assert.deepEqual(next.tasks.map(t => t.id), ['H002', 'H001']);
  assert.equal(next.tasks[0].title, 'new H002');
  assert.equal(next.tasks[0].requested_at, '2026-11-03T12:00:00Z', 'without --now the requested_at of the source is kept');
  assert.equal(next.updated_at, '2026-11-03T20:00:00Z');
  assert.equal(next.schema, 'fidelity-hands-v1');
});

test('--now makes it a new request; a new id is inserted; a wrong schema is refused', () => {
  const next = upsert(doc(), task('H009', 5), { now: true, at: '2026-11-03T20:00:00Z' });
  assert.equal(next.tasks.length, 3);
  assert.equal(next.tasks[2].id, 'H009');
  assert.equal(next.tasks[2].requested_at, '2026-11-03T20:00:00Z');
  assert.throws(() => upsert({ schema: 'other', tasks: [] }, task('H001', 1)), /not a fidelity-hands-v1 file/);
});

test('pickTask takes a bare task or a task from a whole file, and validates the shape', () => {
  assert.equal(pickTask(task('H005', 0)).id, 'H005');
  assert.equal(pickTask(doc(), 'H002').id, 'H002');
  assert.equal(pickTask(doc()).id, 'H001', 'default: the first task');
  assert.throws(() => pickTask(doc(), 'H404'), /no task H404/);
  assert.throws(() => pickTask({ id: 'H1', title: 't' }), /missing "steps"/);
  assert.throws(() => pickTask({ id: 'H1', title: 't', steps: [1], report: [] }), /array of strings/);
});

test('the Windows paths survive the round trip and the tool refuses control characters', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hands-upsert-'));
  const file = path.join(dir, 'laptop_tasks.json');
  const src = path.join(dir, 'h005.json');
  fs.writeFileSync(file, `${JSON.stringify(doc(), null, 2)}\n`);
  const steps = ['Rename D:\\World of Warcraft\\_forever_\\Interface\\AddOns\\FidelityEMatrix (the \\f and \\t here are backslash-letters, not control characters)', 'git -C D:\\fidelity-repo merge --ff-only origin/claude/ematrix-depth'];
  fs.writeFileSync(src, JSON.stringify(task('H005', 0, { steps })));
  const out = execFileSync(process.execPath, [tool, src, '--file', file, '--now'], { encoding: 'utf8' });
  assert.match(out, /H005 written .* 3 task\(s\)/);
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(controlCharacters(text).length, 0);
  const written = JSON.parse(text);
  assert.deepEqual(written.tasks.find(t => t.id === 'H005').steps, steps);
  assert.ok(written.tasks.find(t => t.id === 'H005').requested_at > '2026-11-03T12:00:00Z');
  assert.equal(controlCharacters('a\fb\tc\nd').length, 2, 'form feed and tab are control characters, newline is not');
  assert.deepEqual(parseArgs(['x.json', '--task', 'H005', '--now']), { source: path.resolve('x.json'), task: 'H005', file: path.join(here, 'laptop_tasks.json'), now: true });
  assert.throws(() => parseArgs([]), /missing <source.json>/);
  assert.throws(() => parseArgs(['x.json', '--bogus']), /unknown flag/);
  fs.rmSync(dir, { recursive: true, force: true });
});
