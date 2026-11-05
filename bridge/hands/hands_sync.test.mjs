import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getBridgeRoot } from '../../packages/triad-369/src/bridge_paths.mjs';
import { UsageError, forbiddenRepoSteps, makeTransport, parseArgs, redactSecrets, runCycle } from './hands_sync.mjs';

const tasksText = (tasks = [['H001', 'requested'], ['H002', 'requested']], steps = ['check']) => JSON.stringify({
  schema: 'fidelity-hands-v1',
  from: 'claude@node2',
  updated_at: '2026-11-03T12:50:00Z',
  tasks: tasks.map(([id, status], i) => ({ id, requested_at: '2026-11-03T12:50:00Z', priority: i + 1, title: `task ${id}`, steps, report: ['output'], status })),
}, null, 2) + '\n';

const resultsText = results => JSON.stringify({ schema: 'fidelity-hands-results-v1', from: 'flash@node1', updated_at: '2026-11-03T13:05:00Z', results }, null, 2) + '\n';

/** A temp bridge root, a fake remote folder, options for file:<remote>, one loop state with a fake clock, and log helpers. */
function setup(t, args = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hands-sync-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, 'remote');
  fs.mkdirSync(remote);
  const opts = parseArgs(['--role', 'laptop', '--transport', `file:${remote}`, '--bridge-root', path.join(root, 'bridge'), ...args]);
  const hands = path.join(root, 'bridge', 'hands');
  const state = {};
  const clock = { ms: 0 };
  const cycle = (extra = {}) => runCycle(opts, { echo: () => {}, state, now: () => clock.ms, ...extra });
  const log = () => (fs.existsSync(path.join(hands, 'hands.log')) ? fs.readFileSync(path.join(hands, 'hands.log'), 'utf8') : '');
  const count = text => log().split('\n').filter(line => line.includes(text)).length;
  const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  return { root, remote, hands, opts, state, clock, cycle, log, count, readJson };
}

/** The file transport with one method replaced by a failing one while `box.fail` is true. */
function failing(opts, method, box) {
  const base = makeTransport(opts);
  return { ...base, [method]: bytes => (box.fail ? Promise.reject(new Error('remote closed')) : base[method](bytes)) };
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

test('a local results file is pushed as pretty JSON once, not again while unchanged', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  fs.mkdirSync(s.hands, { recursive: true });
  const first = resultsText([{ id: 'H001', task_requested_at: '2026-11-03T12:50:00Z', status: 'in_progress' }]);
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), first);
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: true });
  assert.equal(fs.readFileSync(path.join(s.remote, 'laptop_results.json'), 'utf8'), first);
  assert.equal(s.count(`results pushed: ${Buffer.byteLength(first)} bytes`), 1);
  assert.equal(s.count('redacted'), 0);
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
  const state = {};
  assert.deepEqual(await runCycle(opts, { echo: () => {}, state }), { pulled: false, pushed: false });
  assert.ok(s.log().includes('pull failed: '));
  await runCycle(opts, { echo: () => {}, state });
  assert.equal(s.count('pull failed:'), 1, 'a repeated failure is logged once');
  assert.equal(s.count('heartbeat failed:'), 1, 'the first heartbeat fails there too, once');
  assert.equal(s.log().trim().split('\n').length, 2);
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

test('a failing push is logged once until it succeeds, then the push line appears', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  fs.mkdirSync(s.hands, { recursive: true });
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), resultsText([{ id: 'H001', status: 'in_progress' }]));
  const box = { fail: true };
  const transport = failing(s.opts, 'push', box);
  for (let i = 0; i < 3; i++) assert.deepEqual(await s.cycle({ transport }), { pulled: true, pushed: false });
  assert.equal(s.count('push failed: remote closed'), 1);
  box.fail = false;
  assert.deepEqual(await s.cycle({ transport }), { pulled: true, pushed: true });
  assert.equal(s.count('results pushed:'), 1);
  box.fail = true;
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), resultsText([{ id: 'H001', status: 'done' }]));
  await s.cycle({ transport });
  assert.equal(s.count('push failed: remote closed'), 2, 'a failure after a success is news again');
});

test('an unreachable remote with a pending results change logs pull, push and heartbeat failures once each', async t => {
  const s = setup(t);
  fs.mkdirSync(s.hands, { recursive: true });
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), resultsText([{ id: 'H001', status: 'in_progress' }]));
  const down = () => Promise.reject(new Error('No route to host'));
  const transport = { pull: down, push: down, heartbeat: down };
  for (let i = 0; i < 5; i++) { s.clock.ms = i * 20_000; assert.deepEqual(await s.cycle({ transport }), { pulled: false, pushed: false }); }
  assert.deepEqual(s.log().trim().split('\n').map(l => l.slice(25)), ['pull failed: No route to host', 'push failed: No route to host', 'heartbeat failed: No route to host']);
});

test('a heartbeat is pushed on the first cycle, then only after --heartbeat seconds, and is not logged', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  const file = path.join(s.remote, 'laptop_heartbeat.json');
  await s.cycle();
  const first = s.readJson(file);
  assert.deepEqual(first, { schema: 'fidelity-hands-heartbeat-v1', at: '1970-01-01T00:00:00.000Z', host: os.hostname(), interval: 20, heartbeat: 300, lastPullOk: true, lastPullAt: '1970-01-01T00:00:00.000Z', lastPushAt: null });
  s.clock.ms = 299_000;
  await s.cycle();
  assert.deepEqual(s.readJson(file), first);
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), resultsText([{ id: 'H001', status: 'done' }]));
  s.clock.ms = 300_000;
  await s.cycle();
  assert.deepEqual(s.readJson(file), { ...first, at: '1970-01-01T00:05:00.000Z', lastPullAt: '1970-01-01T00:05:00.000Z', lastPushAt: '1970-01-01T00:05:00.000Z' });
  assert.equal(s.count('heartbeat'), 0);
});

test('--heartbeat 0 disables the heartbeat and a shorter value shortens it', async t => {
  const off = setup(t, ['--heartbeat', '0']);
  fs.writeFileSync(path.join(off.remote, 'laptop_tasks.json'), tasksText());
  await off.cycle();
  off.clock.ms = 3_600_000;
  await off.cycle();
  assert.equal(fs.existsSync(path.join(off.remote, 'laptop_heartbeat.json')), false);
  const fast = setup(t, ['--heartbeat=60']);
  fs.writeFileSync(path.join(fast.remote, 'laptop_tasks.json'), tasksText());
  await fast.cycle();
  fast.clock.ms = 60_000;
  await fast.cycle();
  assert.equal(fast.readJson(path.join(fast.remote, 'laptop_heartbeat.json')).at, '1970-01-01T00:01:00.000Z');
});

test('a failing heartbeat is logged once, retried on the next cycle whose pull works, and its recovery logged once', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  const box = { fail: true };
  const transport = failing(s.opts, 'heartbeat', box);
  const file = path.join(s.remote, 'laptop_heartbeat.json');
  await s.cycle({ transport });
  s.clock.ms = 20_000;
  await s.cycle({ transport });
  assert.equal(s.count('heartbeat failed: remote closed'), 1);
  assert.equal(fs.existsSync(file), false);
  box.fail = false;
  s.clock.ms = 40_000;
  await s.cycle({ transport });
  assert.equal(s.count('heartbeat recovered'), 1);
  assert.equal(s.readJson(file).at, '1970-01-01T00:00:40.000Z');
  s.clock.ms = 60_000;
  await s.cycle({ transport });
  assert.equal(s.count('heartbeat'), 2);
  assert.equal(s.readJson(file).at, '1970-01-01T00:00:40.000Z', 'back on the --heartbeat schedule');
});

test('redactSecrets masks every secret shape, keeps names and prefixes, and leaves the rest of the document alone', () => {
  const pem = '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n-----END OPENSSH PRIVATE KEY-----';
  const lines = [
    `key file: ${pem} then more`,
    'openrouter sk-or-v1-0123456789abcdef0123456789abcdef0123456789abcdef',
    'anthropic sk-ant-api03-abcdefghijklmnop_-xyz ok',
    'google AIzaSyA1234567890abcdefghijklmnopqrstuv',
    'github ghp_abcdefghijklmnopqrstuvwxyz0123456789 and github_pat_11ABCDEFG0123456789abcdefghijk',
    'slack xoxb-1234567890-abcdefghijkl',
    'TRIAD_API_TOKEN=abc123 then',
    '"password": "hunter2",',
    "api-key: 'quoted value'",
    'Private_Key = C:\\Users\\Pierro\\.ssh\\id_ed25519_fidelity',
    'passwd:plain;next',
    'the token is stored in .env and the api_key: ""',
  ];
  const doc = { schema: 'fidelity-hands-results-v1', count: 3, ok: true, nothing: null, results: [{ id: 'H001', status: 'done', output: lines.join('\n'), nested: { deeper: ['secret: x', 7, false, { client_secret: 'y' }] } }] };
  const before = JSON.stringify(doc);
  const { value, count } = redactSecrets(doc);
  assert.equal(count, 14);
  assert.deepEqual(value.results[0].output.split('\n'), [
    'key file: [REDACTED] then more',
    'openrouter sk-or-v1-[REDACTED]',
    'anthropic sk-ant-[REDACTED] ok',
    'google AIza[REDACTED]',
    'github ghp_[REDACTED] and github_pat_[REDACTED]',
    'slack xoxb-[REDACTED]',
    'TRIAD_API_TOKEN=[REDACTED] then',
    '"password": "[REDACTED]",',
    "api-key: '[REDACTED]'",
    'Private_Key = [REDACTED]',
    'passwd:[REDACTED];next',
    'the token is stored in .env and the api_key: ""',
  ]);
  assert.deepEqual(value.results[0].nested, { deeper: ['secret: [REDACTED]', 7, false, { client_secret: '[REDACTED]' }] });
  assert.deepEqual({ ...value, results: null }, { schema: 'fidelity-hands-results-v1', count: 3, ok: true, nothing: null, results: null });
  assert.deepEqual(JSON.parse(JSON.stringify(value)), value, 'still plain JSON');
  assert.equal(JSON.stringify(doc), before, 'the input is not mutated');
  assert.equal(redactSecrets(value).count, 0, 'a redacted document has nothing left to redact');
  assert.deepEqual(redactSecrets(42), { value: 42, count: 0 });
  assert.deepEqual(redactSecrets('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), { value: 'ghp_[REDACTED]', count: 1 });
});

test('a results file with secrets is pushed redacted; the local file and the change detection are untouched', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText());
  fs.mkdirSync(s.hands, { recursive: true });
  const local = resultsText([{ id: 'H001', status: 'done', output: 'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz0123456789 and TRIAD_API_TOKEN: deadbeef' }]);
  fs.writeFileSync(path.join(s.hands, 'laptop_results.json'), local);
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: true });
  const remote = fs.readFileSync(path.join(s.remote, 'laptop_results.json'), 'utf8');
  assert.equal(JSON.parse(remote).results[0].output, 'GITHUB_TOKEN=[REDACTED] and TRIAD_API_TOKEN: [REDACTED]');
  assert.equal(remote.includes('ghp_a'), false);
  assert.equal(fs.readFileSync(path.join(s.hands, 'laptop_results.json'), 'utf8'), local);
  assert.equal(s.count(`results pushed: ${Buffer.byteLength(remote)} bytes (2 secrets redacted)`), 1);
  assert.deepEqual(await s.cycle(), { pulled: true, pushed: false });
});

test('forbiddenRepoSteps catches each forbidden git form and allows the fast-forward ones', () => {
  const clean = JSON.parse(tasksText([['H001', 'requested']], [
    'git -C D:\\fidelity-repo fetch origin && git -C D:\\fidelity-repo pull --ff-only origin main (expect main at or after ed2d8fe)',
    'git -C D:\\fidelity-repo merge --ff-only origin/claude/x. If that is not a fast-forward, stop and report blocked with the output of git status; never reset, clean or checkout -f.',
    'git status --short and git log -1 --oneline; git diff; git rev-parse --short HEAD; git show HEAD --stat',
    'git stash list, then git checkout main, then git branch -d merged-branch, then git push origin HEAD:refs/heads/flash/x',
    'node D:\\fidelity-repo\\tools\\x.mjs (the .git folder is not touched)',
  ]));
  assert.deepEqual(forbiddenRepoSteps(clean), []);
  const bad = [
    'git reset --hard origin/main',
    'git -C D:\\fidelity-repo clean -fdx',
    'git checkout -f main',
    'git checkout --force main',
    'git restore .',
    'git stash drop',
    'git push --force origin main',
    'git push -f origin main',
    'git branch -D old',
    'git pull origin main',
    'git -C D:\\fidelity-repo merge origin/main',
    'git fetch origin && git reset --hard origin/main',
    'Then run git pull --rebase origin main.',
  ];
  const hits = forbiddenRepoSteps(JSON.parse(tasksText([['H009', 'requested']], bad)));
  assert.deepEqual(hits.map(h => h.step), bad.map((_, i) => i + 1));
  assert.ok(hits.every(h => h.id === 'H009'));
  assert.equal(hits[0].text, 'git reset --hard origin/main');
  assert.equal(hits[11].text, 'git reset --hard origin/main');
  assert.equal(hits[12].text, 'git pull --rebase origin main.');
  assert.deepEqual(forbiddenRepoSteps({}), []);
  assert.deepEqual(forbiddenRepoSteps({ tasks: [{ id: 'H1', steps: [5, null, 'git status'] }, null, 'x'] }), []);
});

test('a changed task file with forbidden repo steps logs one line per hit, once', async t => {
  const s = setup(t);
  fs.writeFileSync(path.join(s.remote, 'laptop_tasks.json'), tasksText([['H003', 'requested']], ['git -C D:\\fidelity-repo fetch origin', 'git -C D:\\fidelity-repo reset --hard origin/main', 'git stash drop']));
  await s.cycle();
  assert.ok(s.log().includes('task H003 step 2 contains a forbidden repo command: git -C D:\\fidelity-repo reset --hard origin/main'));
  assert.ok(s.log().includes('task H003 step 3 contains a forbidden repo command: git stash drop'));
  assert.equal(s.count('forbidden repo command'), 2);
  await s.cycle();
  assert.equal(s.count('forbidden repo command'), 2);
});

test('parseArgs applies the defaults and rejects bad command lines', () => {
  const opts = parseArgs(['--role', 'laptop']);
  assert.equal(opts.interval, 20);
  assert.equal(opts.heartbeat, 300);
  assert.equal(opts.once, false);
  assert.equal(opts.transport, 'ssh');
  assert.equal(opts.bridgeRoot, getBridgeRoot());
  assert.equal(opts.remote, process.env.REMOTE_HOST || 'RAMPAGE@192.168.0.5');
  assert.equal(parseArgs(['--role=laptop', '--interval=5', '--once']).interval, 5);
  assert.equal(parseArgs(['--role', 'laptop', '--heartbeat', '0']).heartbeat, 0);
  assert.equal(parseArgs(['--role', 'laptop', '--heartbeat=90']).heartbeat, 90);
  assert.throws(() => parseArgs([]), UsageError);
  assert.throws(() => parseArgs(['--role', 'desktop']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--bogus']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--interval', '0']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--heartbeat', '-1']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--heartbeat', 'soon']), UsageError);
  assert.throws(() => parseArgs(['--role', 'laptop', '--transport', 'file:']), UsageError);
});

test('council O2 gaps: bearer credentials, sk-proj and AWS keys are masked; a push aimed at main is forbidden by any spelling', () => {
  const { value, count } = redactSecrets({
    a: 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz',
    b: 'OPENAI_KEY=sk-proj-abcdefghijklmnopqrstu',
    c: 'aws AKIAIOSFODNN7EXAMPLE in a log line',
    d: 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.e30.abc" https://x',
    e: 'the word Bearer alone, and sk-short, stay',
  });
  assert.equal(value.a, 'Authorization: Bearer [REDACTED]');
  assert.match(value.b, /^OPENAI_KEY=\[REDACTED\]$|^OPENAI_KEY=sk-proj-\[REDACTED\]$/);
  assert.equal(value.c, 'aws AKIA[REDACTED] in a log line');
  assert.equal(value.d, 'curl -H "Authorization: Bearer [REDACTED]" https://x');
  assert.equal(value.e, 'the word Bearer alone, and sk-short, stay');
  assert.ok(count >= 4, `count ${count}`);
  const hits = forbiddenRepoSteps({ tasks: [{ id: 'H', steps: [
    'git push origin main', 'git push origin +HEAD:main', 'git push origin HEAD:refs/heads/main', 'git push --mirror origin',
    'git push origin francois/serene-euler-51wj3e', 'git push -u origin claude/ematrix-depth', 'git -C D:\\fidelity-repo push origin HEAD:maintenance',
  ] }] });
  assert.deepEqual(hits.map(h => h.step), [1, 2, 3, 4], JSON.stringify(hits));
});
