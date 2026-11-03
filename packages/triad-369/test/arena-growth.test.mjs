import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { stepGrowth } from '../src/arena_growth.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(HERE, '../src/arena_growth.mjs');
const noReasoner = { ...process.env, ARENA_REASONER_EXEC: '', ARENA_REASONER_ARGS: '[]' };
const hash = text => createHash('sha256').update(text).digest('hex');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arena-growth-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function save(dir, name, data) { fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2) + '\n'); }
function load(dir, name) { return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); }
function completed(id = 'q-1', question = 'Hello') {
  return { lastQueryResponse: { id, query: question, query_sha256: hash(question), status: 'completed' }, telemetry: { reported_lyapunov_ftle: 0.012 } };
}

test('growth preserves legacy values as unverified and does not invent measurements', async t => {
  const dir = fixture(t);
  const legacy = { schema: 'arena-growth-state-v1', growth_tick: 3, syntropic_reserve_joules: 5.04, coherence: 0.99, ftle_estimate: 0.01, total_inquiries_resolved: 2, inquiry_log: [] };
  save(dir, 'arena_growth_state.json', legacy);
  save(dir, 'triad_telemetry.json', { lyapunovFTLE: 0.012, query: { id: 'q-1', question: 'Hello' } });
  const triadBefore = fs.readFileSync(path.join(dir, 'triad_telemetry.json'), 'utf8');
  const result = await stepGrowth({ syncDir: dir, env: noReasoner });
  const state = load(dir, 'arena_growth_state.json');
  assert.equal(result.growth_tick, 4);
  assert.equal(state.schema, 'arena-growth-state-v2');
  assert.equal(state.syntropic_reserve_joules, null);
  assert.equal(state.coherence, null);
  assert.equal(state.ftle_estimate, null);
  assert.equal(state.metrics_status, 'not_measured');
  assert.equal(state.reported_ftle, 0.012);
  assert.equal(state.reported_ftle_within_limit, false);
  assert.equal(state.ftle_independently_verified, false);
  assert.deepEqual(state.legacy_unverified, legacy);
  assert.equal(fs.readFileSync(path.join(dir, 'triad_telemetry.json'), 'utf8'), triadBefore);
  assert.ok(!fs.existsSync(path.join(dir, 'arena_telemetry.json')));
});

test('default observe-only mode does not invoke a configured reasoner or change the response', async t => {
  const dir = fixture(t);
  const marker = path.join(dir, 'adapter-invoked');
  const adapter = path.join(dir, 'adapter.mjs');
  fs.writeFileSync(adapter, `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'yes'); process.exit(1);`);
  save(dir, 'triad_telemetry.json', { query: { id: 'q-1', question: 'Hello' } });
  save(dir, 'arena_telemetry.json', { lastQueryResponse: { id: 'q-1', query_sha256: hash('Hello'), status: 'awaiting_reasoner', answer: null } });
  const before = fs.readFileSync(path.join(dir, 'arena_telemetry.json'), 'utf8');
  const result = await stepGrowth({ syncDir: dir, env: { ...process.env, ARENA_REASONER_EXEC: process.execPath, ARENA_REASONER_ARGS: JSON.stringify([adapter]) } });
  assert.equal(result.nodeResult.status, 'awaiting_reasoner');
  assert.equal(fs.readFileSync(path.join(dir, 'arena_telemetry.json'), 'utf8'), before);
  assert.equal(fs.existsSync(marker), false);
});

test('completed snapshots are counted once and drafts are not claimed delivered', async t => {
  const dir = fixture(t);
  save(dir, 'triad_telemetry.json', { query: { id: 'q-1', question: 'Hello' } });
  save(dir, 'arena_telemetry.json', completed());
  const triadBefore = fs.readFileSync(path.join(dir, 'triad_telemetry.json'), 'utf8');
  for (let i = 0; i < 8; i++) await stepGrowth({ syncDir: dir });
  const state = load(dir, 'arena_growth_state.json');
  assert.equal(state.total_inquiries_resolved, 1);
  assert.match(state.resolution_count_meaning, /not proof of delivery/);
  assert.equal(state.total_inquiry_drafts, 1);
  assert.equal(state.total_autonomous_inquiries_sent, 0);
  assert.equal(state.pending_inquiry.kind, 'template_draft');
  assert.equal(state.pending_inquiry.delivered, false);
  assert.equal(fs.readFileSync(path.join(dir, 'triad_telemetry.json'), 'utf8'), triadBefore);
});

test('optional local processing remains awaiting without a reasoner', async t => {
  const dir = fixture(t);
  save(dir, 'triad_telemetry.json', { query: { id: 'q-1', question: 'Hello' } });
  const result = await stepGrowth({ syncDir: dir, processLocal: true, env: noReasoner });
  const output = load(dir, 'arena_telemetry.json');
  assert.equal(result.nodeResult.status, 'awaiting_reasoner');
  assert.equal(output.lastQueryResponse.answer, null);
  assert.equal(load(dir, 'arena_growth_state.json').total_inquiries_resolved, 0);
});

test('invalid state is not silently reset or overwritten', async t => {
  const dir = fixture(t);
  const file = path.join(dir, 'arena_growth_state.json');
  fs.writeFileSync(file, '{ invalid json');
  await assert.rejects(stepGrowth({ syncDir: dir }), /Cannot read arena_growth_state/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{ invalid json');
});

test('growth daemon performs serial pulses and stops cleanly', async t => {
  const dir = fixture(t);
  const child = spawn(process.execPath, [cli, '--daemon', '--sync-dir', dir, '--interval', '250'], { env: noReasoner, stdio: 'ignore' });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exit = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exit;
    }
  });
  const deadline = Date.now() + 5000;
  let state;
  while (Date.now() < deadline) {
    try { state = load(dir, 'arena_growth_state.json'); } catch {}
    if (state?.growth_tick >= 2) break;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  assert.ok(state?.growth_tick >= 2);
  const exit = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  child.kill('SIGTERM');
  assert.deepEqual(await exit, { code: 0, signal: null });
});
