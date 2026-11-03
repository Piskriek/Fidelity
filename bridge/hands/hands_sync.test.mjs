import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getBridgeRoot } from '../../packages/triad-369/src/bridge_paths.mjs';
import { UsageError, parseArgs, runCycle } from './hands_sync.mjs';

const tasksText = (tasks = [['H001', 'requested'], ['H002', 'requested']]) => JSON.stringify({
  schema: 'fidelity-hands-v1',
  from: 'claude@node2',
  updated_at: '2026-11-03T12:50:00Z',
  tasks: tasks.map(([id, status], i) => ({ id, requested_at: '2026-11-03T12:50:00Z', priority: i + 1, title: `task ${id}`, steps: ['check'], report: ['output'], status })),
}, null, 2) + '\n';

const resultsText = results => JSON.stringify({ schema: 'fidelity-hands-results-v1', from: 'flash@node1', updated_at: '2026-11-03T13:05:00Z', results }, null, 2) + '\n';

/** A temp bridge root, a fake remote folder, options for file:<remote>, and log helpers. */
function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hands-sync-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, 'remote');
  fs.mkdirSync(remote);
  const opts = parseArgs(['--role', 'laptop', '--transport', `file:${remote}`, '--bridge-root', path.join(root, 'bridge')]);
  const hands = path.join(root, 'bridge', 'hands');
  const cycle = () => runCycle(opts, { echo: () => {} });
  const log = () => (fs.existsSync(path.join(hands, 'hands.log')) ? fs.readFileSync(path.join(hands, 'hands.log'), 'utf8') : '');
  const count = text => log().split('\n').filter(line => line.includes(text)).length;
  return { root, remote, hands, opts, cycle, log, count };
}

test('the first cycle mirrors the requested tasks byte for byte and logs their ids', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: false });
  assert.deepEqual(fs.readFileSync(path.join(s.hands, 'laptop_tasks.json')), fs.readFileSync(path.join(s.remote, 'laptop_tasks.json')));
  assert.ok(s.log().includes('tasks updated: H001, H002'));
});

test('an unchanged task file leaves the mirror alone and adds no tasks line', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  await s.cycle();
  const mirror = path.join(s.hands, 'laptop_tasks.json');
  const old = new Date('2001-01-01T00:00:00Z');
  fs.utimesSync(mirror, old, old);
  await s.cycle();
  assert.equal(fs.statSync(mirror).mtimeMs, old.getTime());
  assert.equal(s.count('tasks updated:'), 1);
});

test('a local results file is pushed byte for byte once, not again while unchanged', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  fs.mkdirSync(s.hands, { recursive: true });
  const first = resultsText([{ id: 'H001', task_requested_at: '2026-11-03T12:50:00Z', status: 'in_progress' }]);
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), first);
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: true });
  assert.equal(fs.readFileSync(path.join(s.remote, 'laptop_results.json'), 'utf8'), first);
  assert.equal(s.count('results pushed:'), 1);
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: false });
  assert.equal(s.count('results pushed:'), 1);
});

test('a changed results file is pushed again', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  fs.mkdirSync(s.hands, { recursive: true });
  const results = path.join(s.hands, 'laptop_results.json');
  fs.writeFileSync(results, resultsText([{ id: 'H001', status: 'in_progress' }]));
  await s.cycle();
  const second = resultsText([{ id: 'H001', status: 'done', output: 'ok' }]);
  fs.writeFileSync(results, second);
  await s.cycle();
  assert.equal(fs.readFileSync(path.join(s.remote, 'laptop_results.json'), 'utf8'), second);
  assert.equal(s.count('results pushed:'), 2);
});

test('a remote file that is not fidelity-hands-v1 is ignored and the mirror is kept', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  await s.cycle();
  const mirror = path.join(s.hands, 'laptop_tasks.json');
  const before = fs.readFileSync(mirror);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), 'not json');
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: false });
  assert.ok(s.log().includes('pull ignored: not a fidelity-hands-v1 file'));
  assert.deepEqual(fs.readFileSync(mirror), before);
});

test('a missing remote folder logs pull failed and the cycle still resolves', async t => {
  const s = setup(t);
  const opts = parseArgs(['--role', 'laptop', '--transport', `file:${path.join(s.root, 'no-such-remote')}`, '--bridge-root', path.join(s.root, 'bridge')]);
  assert.deepEqual(await runCycle(opts, { echo: () => {} }), { pulled: false, pushed: false });
  assert.ok(s.log().includes('pull failed: '));
  await runCycle(opts, { echo: () => {} });
  assert.equal(s.count('pull failed:'), 1, 'a repeated failure is logged once');
});

test('invalid results JSON is reported once for the same content and never pushed', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  fs.mkdirSync(s.hands, { recursive: true });
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), '{ broken');
  await s.cycle();
  await s.cycle();
  assert.equal(s.count('results not pushed: invalid JSON'), 1);
  assert.equal(fs.existsSync(path.join(s.remote, 'laptop_results.json')), false);
});

test('parseArgs applies the defaults and rejects bad command lines', () => {
  const opts = parseArgs(['--role', 'laptop']);
  assert.equal(opts.interval, 20);
  assert.equal(opts.once, false);
  assert.equal(opts.transport, 'ssh');
  assert.equal(opts.bridgeRoot, getBridgeRoot());
  assert.equal(opts.remote, process.env.REMOTE_HOST || 'RAMPAGE@192.168.0.5');
  assert.equal(parseArgs(['--role=laptop', '--interval=5', '--once']).interval, 5);
  assert.throws(() => parseArgs([]), UsageError);
  assert.throws(() => parseArgs(['--role', 'desktop']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--bogus']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--interval', '0']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--transport', 'file:']), UsageError);
});
