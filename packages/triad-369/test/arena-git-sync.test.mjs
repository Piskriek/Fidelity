import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { processInboundQuery } from '../src/arena_node.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(HERE, '../src');
const BRANCH = 'arena/dfcfb02d-fidelity';
const query = { id: 'new-query-1', from: 'Laptop', question: 'Are the nodes connected?' };
const sha = text => createHash('sha256').update(text).digest('hex');

function fixture(t, { oldOutput, gitStatus = '', branch = BRANCH, remoteChange = false, branchChange = false, pushFail = false, reasoner = false, growthState = null, growthStatus = '', localMode = false, agentSnapshot = null, agentGrowth = null, mirror = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arena-git-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const src = path.join(root, 'packages/triad-369/src');
  const sync = path.join(root, 'bridge/sync');
  const remote = path.join(root, 'remote');
  const remoteAgent = path.join(root, 'remote-agent');
  const mirrorDir = path.join(root, 'mirror');
  const bin = path.join(root, 'bin');
  for (const dir of [src, sync, remote, remoteAgent, mirrorDir, bin]) fs.mkdirSync(dir, { recursive: true });
  for (const file of ['arena_git_sync.mjs', 'arena_node.mjs']) fs.copyFileSync(path.join(SOURCE, file), path.join(src, file));
  const previous = oldOutput ?? { schema: 'arena-telemetry-v2', lastQueryResponse: { id: 'older-query', query_sha256: sha('older') } };
  const output = path.join(sync, 'arena_telemetry.json');
  fs.writeFileSync(output, JSON.stringify(previous, null, 2) + '\n');
  if (mirror === 'same') fs.copyFileSync(output, path.join(mirrorDir, 'arena_telemetry.json'));
  if (mirror === 'independent') fs.writeFileSync(path.join(mirrorDir, 'arena_telemetry.json'), 'independent local content');
  if (growthState) fs.writeFileSync(path.join(sync, 'arena_growth_state.json'), JSON.stringify(growthState, null, 2) + '\n');
  if (localMode) fs.writeFileSync(path.join(sync, 'triad_telemetry.json'), JSON.stringify({ query }, null, 2) + '\n');
  if (agentSnapshot) fs.writeFileSync(path.join(remoteAgent, 'arena_telemetry.json'), JSON.stringify(agentSnapshot, null, 2) + '\n');
  if (agentGrowth) fs.writeFileSync(path.join(remoteAgent, 'arena_growth_state.json'), JSON.stringify(agentGrowth, null, 2) + '\n');
  fs.writeFileSync(path.join(remote, 'triad_telemetry.json'), JSON.stringify({ query, lyapunovFTLE: 0.012 }));
  const fakeGit = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.MOCK_LOG, JSON.stringify(args) + '\\n');
const bump = file => { let n = 0; try { n = Number(fs.readFileSync(file, 'utf8')); } catch {} fs.writeFileSync(file, String(++n)); return n; };
if (args[0] === 'symbolic-ref') {
  const n = bump(process.env.MOCK_BRANCH_COUNT);
  console.log(process.env.MOCK_BRANCH_CHANGE === '1' && n > 1 ? 'unexpected-branch' : process.env.MOCK_BRANCH);
} else if (args[0] === 'fetch') {
  bump(process.env.MOCK_FETCH_COUNT);
} else if (args[0] === 'rev-parse') {
  let n = 0; try { n = Number(fs.readFileSync(process.env.MOCK_FETCH_COUNT, 'utf8')); } catch {}
  const agent = args.at(-1).startsWith('refs/remotes/origin/arena/');
  console.log(agent ? 'c'.repeat(40) : process.env.MOCK_REMOTE_CHANGE === '1' && n > 1 ? 'b'.repeat(40) : 'a'.repeat(40));
} else if (args[0] === 'for-each-ref') {
  if (process.env.MOCK_DISCOVER === '1') console.log('refs/remotes/origin/' + process.env.MOCK_AGENT_BRANCH);
} else if (args[0] === 'show') {
  const file = args[1].split(':')[1];
  const remote = args[1].startsWith('c'.repeat(40) + ':') ? process.env.MOCK_REMOTE_AGENT : process.env.MOCK_REMOTE;
  const target = path.join(remote, path.basename(file));
  if (!fs.existsSync(target)) process.exit(128);
  process.stdout.write(fs.readFileSync(target));
} else if (args[0] === 'diff') {
  process.exit(0);
} else if (args[0] === 'status') {
  const status = args.at(-1).endsWith('arena_growth_state.json') ? process.env.MOCK_GROWTH_STATUS : process.env.MOCK_STATUS;
  if (status) console.log(status);
} else if (args[0] === 'commit') {
  if (process.env.MOCK_LOCAL_MODE === '1' && args.some(a => a.startsWith('sync: publish inquiry'))) { console.log('nothing to commit'); process.exit(1); }
  console.log('committed');
} else if (args[0] === 'push') {
  if (process.env.MOCK_PUSH_FAIL === '1') { console.error('push rejected'); process.exit(1); }
} else {
  console.error('unexpected git command: ' + args[0]); process.exit(2);
}
`;
  const gitPath = path.join(bin, 'git');
  fs.writeFileSync(gitPath, fakeGit, { mode: 0o755 });
  const log = path.join(root, 'git.log');
  const env = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    MOCK_LOG: log,
    MOCK_REMOTE: remote,
    MOCK_REMOTE_AGENT: remoteAgent,
    MOCK_AGENT_BRANCH: BRANCH,
    MOCK_DISCOVER: agentSnapshot ? '1' : '0',
    MOCK_LOCAL_MODE: localMode ? '1' : '0',
    MOCK_BRANCH: branch,
    MOCK_STATUS: gitStatus,
    MOCK_GROWTH_STATUS: growthStatus,
    MOCK_FETCH_COUNT: path.join(root, 'fetch.count'),
    MOCK_BRANCH_COUNT: path.join(root, 'branch.count'),
    MOCK_REMOTE_CHANGE: remoteChange ? '1' : '0',
    MOCK_BRANCH_CHANGE: branchChange ? '1' : '0',
    MOCK_PUSH_FAIL: pushFail ? '1' : '0',
    ARENA_SYNC_BRANCH: localMode ? BRANCH : branch,
    ARENA_SYNC_MIRROR_DIRS: JSON.stringify(mirror ? [mirrorDir] : []),
    ARENA_REASONER_EXEC: '',
    ARENA_REASONER_ARGS: '[]',
  };
  if (reasoner) {
    const adapter = path.join(root, 'reasoner.mjs');
    fs.writeFileSync(adapter, `let input = ''; for await (const c of process.stdin) input += c; const r = JSON.parse(input); process.stdout.write(JSON.stringify({query_id:r.query.id, query_sha256:r.query.sha256, answer:'Grounded answer', density_review:[1,2,3,4,5,6,7].map(n=>({rung:'D'+n, assessment:'Reviewed'})), four_floats:{Pxd:null,Vtx:null,Lx:null,Aq:null}, four_floats_basis:'Unknown'}));`);
    env.ARENA_REASONER_EXEC = process.execPath;
    env.ARENA_REASONER_ARGS = JSON.stringify([adapter]);
  }
  return {
    output,
    mirrorDir,
    run: () => spawnSync(process.execPath, [path.join(src, 'arena_git_sync.mjs'), ...(localMode ? [] : ['--agent']), '--once'], { cwd: root, env, encoding: 'utf8', timeout: 10000 }),
    commands: () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [],
  };
}

function publishedCommands(commands) { return commands.filter(args => args[0] === 'push'); }

test('agent fetches main and publishes only an awaiting response to the session branch', t => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(fs.readFileSync(f.output, 'utf8'));
  assert.equal(output.lastQueryResponse.id, query.id);
  assert.equal(output.lastQueryResponse.status, 'awaiting_reasoner');
  assert.equal(output.lastQueryResponse.answer, null);
  assert.equal(output.telemetry.reported_lyapunov_ftle, 0.012);
  assert.equal(output.telemetry.reported_ftle_within_limit, false);
  const commands = f.commands();
  assert.deepEqual(publishedCommands(commands), [['push', 'origin', `HEAD:refs/heads/${BRANCH}`]]);
  assert.ok(commands.some(args => args[0] === 'commit' && args.includes('--only') && args.at(-1) === 'bridge/sync/arena_telemetry.json'));
  assert.ok(commands.every(args => !['checkout', 'switch', 'pull'].includes(args[0])));
  assert.match(result.stdout, /No reasoner configured/);
});

test('agent may use an explicitly configured reasoner instead of the bundled canned response', t => {
  const f = fixture(t, { reasoner: true });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(fs.readFileSync(f.output, 'utf8'));
  assert.equal(output.lastQueryResponse.status, 'completed');
  assert.equal(output.lastQueryResponse.answer, 'Grounded answer');
  assert.equal(output.lastQueryResponse.provenance.type, 'configured_reasoner_adapter');
  assert.equal(publishedCommands(f.commands()).length, 1);
});

test('a valid interactive reflection can be published without an adapter', t => {
  const reflection = {
    query_id: query.id, query_sha256: sha(query.question), answer: 'An honest response.',
    density_review: [1, 2, 3, 4, 5, 6, 7].map(n => ({ rung: `D${n}`, assessment: 'Reviewed.' })),
    four_floats: { Pxd: null, Vtx: null, Lx: null, Aq: null }, four_floats_basis: 'Unknown.',
  };
  const response = processInboundQuery(query, { reflection, provenance: 'interactive_agent_submission' });
  const f = fixture(t, { oldOutput: { schema: 'arena-telemetry-v2', lastQueryResponse: response }, gitStatus: ' M bridge/sync/arena_telemetry.json' });
  const before = fs.readFileSync(f.output, 'utf8');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(f.output, 'utf8'), before);
  assert.equal(publishedCommands(f.commands()).length, 1);
});

test('agent refuses to overwrite a different uncommitted or staged response', t => {
  for (const status of [' M bridge/sync/arena_telemetry.json', 'M  bridge/sync/arena_telemetry.json']) {
    const f = fixture(t, { gitStatus: status });
    const before = fs.readFileSync(f.output, 'utf8');
    const result = f.run();
    assert.equal(result.status, 1);
    assert.equal(fs.readFileSync(f.output, 'utf8'), before);
    assert.equal(publishedCommands(f.commands()).length, 0);
    assert.equal(f.commands().filter(args => args[0] === 'commit').length, 0);
  }
});

test('agent does not publish a result if main changes during processing', t => {
  const f = fixture(t, { remoteChange: true });
  const before = fs.readFileSync(f.output, 'utf8');
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /origin\/main changed/);
  assert.equal(fs.readFileSync(f.output, 'utf8'), before);
  assert.equal(publishedCommands(f.commands()).length, 0);
});

test('agent refuses main or a changed branch', t => {
  for (const options of [{ branch: 'main' }, { branchChange: true }]) {
    const f = fixture(t, options);
    const result = f.run();
    assert.equal(result.status, 1);
    assert.equal(publishedCommands(f.commands()).length, 0);
    assert.equal(f.commands().filter(args => args[0] === 'commit').length, 0);
  }
});

test('local mode discovers the selected agent branch and imports matching snapshots', t => {
  const agentSnapshot = { schema: 'arena-telemetry-v2', lastQueryResponse: { id: query.id, query_sha256: sha(query.question), status: 'awaiting_reasoner', answer: null } };
  const agentGrowth = { schema: 'arena-growth-state-v2', growth_tick: 7 };
  const f = fixture(t, { localMode: true, branch: 'main', agentSnapshot, agentGrowth, growthState: { schema: 'arena-growth-state-v1', growth_tick: 3 } });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(f.output, 'utf8')).lastQueryResponse.id, query.id);
  assert.ok(f.commands().some(args => args[0] === 'for-each-ref'));
  const commits = f.commands().filter(args => args[0] === 'commit' && args.some(a => a.startsWith('sync: integrate Arena snapshot')));
  assert.equal(commits.length, 1);
  assert.ok(commits[0].includes('--only'));
  assert.ok(commits[0].includes('bridge/sync/arena_telemetry.json'));
  assert.ok(commits[0].includes('bridge/sync/arena_growth_state.json'));
});

test('local mode mirrors synchronized files without overwriting independent mirror edits', t => {
  const agentSnapshot = { schema: 'arena-telemetry-v2', lastQueryResponse: { id: query.id, query_sha256: sha(query.question), status: 'awaiting_reasoner', answer: null } };
  for (const mirror of ['same', 'independent']) {
    const f = fixture(t, { localMode: true, branch: 'main', agentSnapshot, mirror });
    const target = path.join(f.mirrorDir, 'arena_telemetry.json');
    const before = fs.readFileSync(target, 'utf8');
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    if (mirror === 'same') assert.equal(JSON.parse(fs.readFileSync(target, 'utf8')).lastQueryResponse.id, query.id);
    else assert.equal(fs.readFileSync(target, 'utf8'), before);
  }
});

test('local mode skips mismatched or locally modified agent responses', t => {
  const matching = { schema: 'arena-telemetry-v2', lastQueryResponse: { id: query.id, query_sha256: sha(query.question), status: 'awaiting_reasoner', answer: null } };
  const mismatched = { schema: 'arena-telemetry-v2', lastQueryResponse: { id: 'different', query_sha256: sha(query.question), status: 'completed' } };
  for (const options of [{ agentSnapshot: mismatched }, { agentSnapshot: matching, gitStatus: ' M bridge/sync/arena_telemetry.json' }]) {
    const f = fixture(t, { localMode: true, branch: 'main', ...options });
    const before = fs.readFileSync(f.output, 'utf8');
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(f.output, 'utf8'), before);
    assert.equal(f.commands().filter(args => args[0] === 'commit' && args.some(a => a.startsWith('sync: integrate Arena snapshot'))).length, 0);
  }
});

test('agent publishes an unmeasured growth pulse without committing unrelated paths', t => {
  const growthState = { schema: 'arena-growth-state-v2', growth_tick: 4, metrics_status: 'not_measured', syntropic_reserve_joules: null, coherence: null, ftle_estimate: null };
  const f = fixture(t, { growthState, growthStatus: ' M bridge/sync/arena_growth_state.json' });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const commits = f.commands().filter(args => args[0] === 'commit');
  assert.deepEqual(commits.map(args => args.at(-1)), ['bridge/sync/arena_telemetry.json', 'bridge/sync/arena_growth_state.json']);
  assert.ok(commits.every(args => args.includes('--only')));
  assert.deepEqual(publishedCommands(f.commands()), [['push', 'origin', `HEAD:refs/heads/${BRANCH}`]]);
});

test('invalid growth data is not committed and does not block the response push', t => {
  const growthState = { schema: 'arena-growth-state-v2', growth_tick: 4, metrics_status: 'measured', syntropic_reserve_joules: 99 };
  const f = fixture(t, { growthState, growthStatus: ' M bridge/sync/arena_growth_state.json' });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /growth state is not a valid unmeasured/);
  assert.deepEqual(f.commands().filter(args => args[0] === 'commit').map(args => args.at(-1)), ['bridge/sync/arena_telemetry.json']);
  assert.equal(publishedCommands(f.commands()).length, 1);
});

test('failed push is reported instead of claimed successful', t => {
  const f = fixture(t, { pushFail: true });
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /git push failed/);
  assert.doesNotMatch(result.stdout, /Published to origin/);
});
