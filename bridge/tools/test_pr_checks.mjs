#!/usr/bin/env node
// Tests for the PR loop's tools: node bridge/tools/test_pr_checks.mjs
// Part A-D: the three checkers on small fixtures (positives and negatives). Part E: the gh allow-list.
// Part F: the whole Layer 2 path end to end against a throwaway git "origin" and a stub for gh
// (no network, no real pull request): poll -> prepare -> post --dry-run -> post -> poll again.
// Fixtures that would match the scanner are built from pieces so this file passes its own scan.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { forEachAddedLine, formatHit, scanDiffText, scanFiles, scanLine } from './privacy_scan.mjs';
import { checkReportShape } from './check_report_shape.mjs';
import { classify } from './classify_paths.mjs';
import { composeLanded, composeReview, ghAllowed, validateResult } from './review_prs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let passed = 0, failed = 0;
const t = (name, fn) => { try { fn(); passed++; } catch (e) { failed++; console.log(`FAIL ${name}\n     ${String(e.message).split('\n').join('\n     ')}`); } };
const rules = (s) => scanLine(s).map((h) => h.rule);
const j = (...p) => p.join('');

// ------------------------------------------------------------------ A. privacy scan
const hit = {
  'windows home path': [j('C', ':/', 'Us', 'ers/dev/x.txt'), 'home-path'],
  'windows home path, backslashes': [j('C', ':\\\\', 'Us', 'ers\\\\dev'), 'home-path'],
  'unix home path': [j('see /ho', 'me/dev/notes'), 'home-path'],
  'mac home path': [j('/Us', 'ers/dev/x'), 'home-path'],
  'app data folder': [j('in App', 'Data/Local/x'), 'home-path'],
  'drive letter path': [j('open D', ':/some/folder'), 'drive-path'],
  'private ip': [`host ${[10, 0, 0, 5].join('.')} here`, 'ip-address'],
  'public ip': [`dns ${[8, 8, 4, 4].join('.')}`, 'ip-address'],
  'ipv6': [`addr ${['2001', 'db8', '85a3', '0', '0', '8a2e', '370', '7334'].join(':')} ok`, 'ip-address'],
  'email': [j('mail dev', '@', 'mailhost', '.com'), 'email'],
  'claude artifact link': [j('https://claude.', 'ai/artifact/abc123'), 'claude-link'],
  'claude session link': [j('https://claude.', 'ai/code/session_x'), 'claude-link'],
  'session id': [j('#local_', '9219736b-f091-4762-9d8e-2b432ba39dd0'), 'claude-link'],
  'drive link': [j('https://docs.google', '.com/document/d/1'), 'drive-link'],
  'sk key': [j('key sk-', 'ant-api03-', 'a'.repeat(24)), 'secret'],
  'github token': [j('gh', 'p_', 'a'.repeat(30)), 'secret'],
  'aws key id': [j('AK', 'IA', 'ABCDEFGHIJKLMNOP'), 'secret'],
  'google key': [j('AI', 'za', 'a'.repeat(30)), 'secret'],
  'slack token': [j('xo', 'xb-', '1234567890-abcdef'), 'secret'],
  'bearer': [j('Bearer ', 'abcdefghijklmnopqrstuvwxyz012345'), 'secret'],
  'private key header': [j('-----BEGIN ', 'RSA PRIVATE KEY-----'), 'secret'],
  'private name, spaced': [j('the Capi', 'tal Emp', 'ire game'), 'private-name'],
  'private name, joined': [j('Capital', 'Empire'), 'private-name'],
  'private name, watch': [j('CE', '-watch bunker'), 'private-name'],
};
for (const [name, [text, rule]] of Object.entries(hit)) t(`privacy hits: ${name}`, () => assert.ok(rules(text).includes(rule), `${rule} not found in [${rules(text)}]`));

const clean = {
  'loopback': 'listening on 127.0.0.1',
  'unspecified address': 'bind 0.0.0.0',
  'version of four parts': `release v${[1, 2, 3, 4].join('.')}`,
  'section number': `see §${[8, 6, 1, 2].join('.')}`,
  'five-part number': [1, 2, 3, 4, 5].join('.'),
  'time of day': 'at 10:30:15 sharp',
  'url': 'https://example.com/a/b',
  'example email': 'write to user@example.com',
  'noreply email': 'Co-Authored-By: Claude <noreply@anthropic.com>',
  'ssh remote': 'git@github.com:Piskriek/Fidelity.git',
  'package version': 'uses pkg@1.2.3 for tests',
  'handle': 'thanks @Piskriek for the review',
  'hyphenated words': 'a task-based, risk-aware, disk-backed design with sk-less words',
  'placeholder home': j('/Us', 'ers/<name>/x'),
  'plain prose': 'The capital of France is Paris; the empire fell. Face watch.',
  'repo-relative path': 'bridge/tools/privacy_scan.mjs line 12',
};
for (const [name, text] of Object.entries(clean)) t(`privacy clean: ${name}`, () => assert.deepEqual(scanLine(text), [], JSON.stringify(scanLine(text))));

t('privacy: the printed hit never repeats the match', () => {
  const h = scanLine(j('key sk-', 'ant-api03-', 'a'.repeat(24)))[0];
  const line = formatHit({ ...h, file: 'x.md', line: 3, commit: 'abcdef1234' });
  assert.ok(!line.includes(h.text) && !line.includes(h.text.slice(0, 12)), line);
  assert.ok(line.startsWith('x.md:3  [secret]') && line.includes('abcdef1'), line);
});

t('privacy: one string gives one hit even when two rules match it', () => {
  assert.equal(scanLine(j('C', ':/', 'Us', 'ers/dev/x.txt')).length, 1);
});

t('privacy: a very long line without spaces is linear', () => {
  const t0 = Date.now();
  scanLine(`${'a'.repeat(19000)}@`);
  scanLine('a.'.repeat(9000));
  assert.ok(Date.now() - t0 < 1500, 'scan took too long');
});

t('privacy: the owner’s local list is honoured', () => {
  assert.equal(scanLine('my codename is Blue Heron', ['blue heron']).length, 1);
});

// ------------------------------------------------------------------ B. diff parser
const diff = [
  '\x01commit aaaaaaa1111111',
  'diff --git a/x.md b/x.md', '--- a/x.md', '+++ b/x.md', '@@ -3,2 +3,2 @@', '-old one', '-old two', '+++ b/not-a-header', `+${j('see D', ':/work')}`,
  '@@ -10 +20,0 @@', '\\ No newline at end of file',
  '\x01commit bbbbbbb2222222',
  'diff --git a/gone.md b/gone.md', 'deleted file mode 100644', '--- a/gone.md', '+++ /dev/null', '@@ -1,1 +0,0 @@', `-${j('D', ':/old')}`,
  '',
].join('\n');
t('diff: an added line that starts with "++" is content, and line numbers follow the hunk', () => {
  const seen = []; forEachAddedLine(diff, (a) => seen.push(a));
  assert.deepEqual(seen.map((a) => [a.file, a.line, a.text, a.commit]),
    [['x.md', 3, '++ b/not-a-header', 'aaaaaaa1111111'], ['x.md', 4, j('see D', ':/work'), 'aaaaaaa1111111']]);
  const hits = scanDiffText(diff);
  assert.equal(hits.length, 1); assert.equal(hits[0].line, 4); assert.equal(hits[0].commit, 'aaaaaaa1111111');
});

// ------------------------------------------------------------------ C. report shape
const GOOD = 'REPORT  codex-demo · 2026-11-02 · to manager\nLEAD  Added bridge/inbox/demo.md and ran the gates; needs the owner: no.\nASKED  add a demo\nINSIGHTS TO ROUTE  none\n';
t('shape: plain template passes', () => assert.ok(checkReportShape(GOOD).ok));
t('shape: inside a code fence passes', () => assert.ok(checkReportShape(`Summary below.\n\n\`\`\`\n${GOOD}\`\`\`\n`).ok));
t('shape: markdown headings pass in any case', () => assert.ok(checkReportShape('## Report\ncodex demo for the manager\n\n## Lead\nAdded the demo file and ran every gate; no owner needed.\n\n**Insights to route**\nnone\n').ok));
t('shape: Windows line endings pass', () => assert.ok(checkReportShape(GOOD.replace(/\n/g, '\r\n')).ok));
t('shape: a sentence is not a heading', () => {
  const r = checkReportShape('The lead time is long and the report is late. Insights to route are below.');
  assert.deepEqual(r.missing, ['REPORT', 'LEAD', 'INSIGHTS TO ROUTE']);
});
t('shape: empty body and null fail', () => { assert.equal(checkReportShape('').ok, false); assert.equal(checkReportShape(null).ok, false); });
t('shape: a heading with nothing under it fails', () => assert.deepEqual(checkReportShape('REPORT  x demo to manager\nLEAD\n\nINSIGHTS TO ROUTE  none\n').empty, ['LEAD']));
t('shape: template placeholders only fail', () => assert.equal(checkReportShape('REPORT  <name> · <date> · to <asker>\nLEAD  <what was done>\nINSIGHTS TO ROUTE  <insight>\n').ok, false));
t('shape: comments are ignored', () => assert.equal(checkReportShape('<!-- REPORT LEAD INSIGHTS TO ROUTE -->\nhello').ok, false));
t('shape: a long lead warns but passes', () => {
  const r = checkReportShape(`REPORT x demo to manager\nLEAD  ${'word '.repeat(120)}\nINSIGHTS TO ROUTE  none\n`);
  assert.ok(r.ok); assert.equal(r.warnings.length, 1);
});

// ------------------------------------------------------------------ D. path classes
t('classify: groups', () => {
  const c = classify([['M', '.github/workflows/outside-agent-checks.yml'], ['M', 'AGENTS.md'], ['M', 'bridge/world/valleys.mjs'], ['A', 'bridge/mind/new_probe.mjs'],
    ['A', 'bridge/inbox/x.md'], ['D', 'bridge/roster/viewpoint.md'], ['M', 'scripts/formula_spine.mjs'], ['A', 'bridge/tools/x.mjs']].map(([status, path]) => ({ status, path })));
  assert.deepEqual(c.checkers.sort(), ['.github/workflows/outside-agent-checks.yml', 'bridge/tools/x.mjs', 'scripts/formula_spine.mjs']);
  assert.deepEqual(c.managerOwned.sort(), ['AGENTS.md', 'bridge/roster/viewpoint.md']);
  assert.deepEqual(c.locked, ['bridge/world/valleys.mjs']);
  assert.deepEqual(c.bridgeCode.sort(), ['bridge/mind/new_probe.mjs', 'bridge/world/valleys.mjs']);
  assert.deepEqual(c.deleted, ['bridge/roster/viewpoint.md']);
  assert.equal(c.engineAuditor, true);
});
t('classify: prose only needs no engine auditor', () => assert.equal(classify([{ status: 'A', path: 'bridge/inbox/x.md' }]).engineAuditor, false));

// ------------------------------------------------------------------ E. gh allow-list
t('gh allow-list: reads and the two comments only', () => {
  for (const ok of [['pr', 'list'], ['pr', 'view', '7'], ['pr', 'diff', '7'], ['pr', 'comment', '7', '--body-file', '-'], ['pr', 'review', '7', '--comment', '--body-file', '-']]) assert.ok(ghAllowed(ok), ok.join(' '));
  for (const no of [['pr', 'merge', '7'], ['pr', 'review', '7', '--approve'], ['pr', 'review', '7', '-a'], ['pr', 'review', '7', '--request-changes'], ['pr', 'review', '7'],
    ['pr', 'review', '7', '--comment', '--approve'], ['pr', 'close', '7'], ['pr', 'edit', '7'], ['pr', 'ready', '7'], ['pr', 'comment', '7', '--edit-last'], ['api', 'user'], ['repo', 'delete'], ['release', 'create']]) assert.ok(!ghAllowed(no), no.join(' '));
});

// ------------------------------------------------------------------ F. end to end
const sh = (cwd, cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com', ...env } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')}: ${r.stderr}${r.stdout}`);
  return r.stdout;
};
const write = (root, rel, text) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); };

const STUB = `import fs from 'node:fs';
const dir = process.env.STUB_DIR, a = process.argv.slice(2);
const prs = JSON.parse(fs.readFileSync(dir + '/prs.json', 'utf8'));
if (a[0] === 'pr' && a[1] === 'list') console.log(JSON.stringify(prs));
else if (a[0] === 'pr' && a[1] === 'view') { const p = prs.find((x) => x.number === +a[2]); if (!p) { console.error('no such pr'); process.exit(1); } console.log(JSON.stringify(p)); }
else if (a[0] === 'pr' && (a[1] === 'review' || a[1] === 'comment')) fs.appendFileSync(dir + '/calls.jsonl', JSON.stringify({ args: a, stdin: fs.readFileSync(0, 'utf8') }) + '\\n');
else { console.error('stub: unexpected ' + a.join(' ')); process.exit(1); }
`;

t('end to end: poll, prepare, post (dry and real), poll again', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'prloop-'));
  try {
    const seed = join(tmp, 'seed'), bare = join(tmp, 'origin.git'), clone = join(tmp, 'clone'), home = join(tmp, 'home'), stubDir = join(tmp, 'stub');
    mkdirSync(seed); mkdirSync(stubDir);
    writeFileSync(join(stubDir, 'gh_stub.mjs'), STUB);
    sh(tmp, 'git', ['init', '--bare', '-b', 'opus/night-1-skill-benchmark', bare]);
    sh(seed, 'git', ['init', '-b', 'opus/night-1-skill-benchmark']);
    write(seed, 'AGENTS.md', 'rules\n'); write(seed, 'bridge/world/valleys.mjs', 'export const v = 1;\n'); write(seed, 'bridge/HANDOFF.md', 'handoff\n');
    sh(seed, 'git', ['add', '-A']); sh(seed, 'git', ['commit', '-m', 'base']);
    sh(seed, 'git', ['remote', 'add', 'origin', bare]); sh(seed, 'git', ['push', 'origin', 'opus/night-1-skill-benchmark']);

    // PR 7: leaks, fixed in a later commit (history still counts); PR 10: clean, touches a locked file
    sh(seed, 'git', ['checkout', '-b', 'codex/leaky']);
    const leak = j('C', ':/', 'Us', 'ers/dev/leak.txt'), key = j('sk-', 'ant-api03-', 'q'.repeat(26));
    write(seed, 'notes.md', `found at ${leak}\nkey ${key}\n`); sh(seed, 'git', ['add', '-A']); sh(seed, 'git', ['commit', '-m', 'notes']);
    write(seed, 'notes.md', 'fixed\n'); sh(seed, 'git', ['commit', '-am', 'fix']);
    sh(seed, 'git', ['push', 'origin', 'codex/leaky:refs/heads/codex/leaky', 'codex/leaky:refs/pull/7/head']);
    sh(seed, 'git', ['checkout', 'opus/night-1-skill-benchmark']); sh(seed, 'git', ['checkout', '-b', 'argon/clean']);
    write(seed, 'bridge/world/valleys.mjs', 'export const v = 2;\n'); write(seed, 'AGENTS.md', 'rules\nnew rule\n');
    write(seed, 'bridge/inbox/demo.md', '# Demo\n\nThe loop closed in 3 steps, measured once on one world.\n');
    sh(seed, 'git', ['add', '-A']); sh(seed, 'git', ['commit', '-m', 'demo']);
    sh(seed, 'git', ['push', 'origin', 'argon/clean:refs/heads/argon/clean', 'argon/clean:refs/pull/10/head']);
    const sha = (ref) => sh(seed, 'git', ['rev-parse', ref]).trim();
    sh(tmp, 'git', ['clone', bare, clone]);

    const REPORT = 'REPORT  argon-demo · 2026-11-02 · to manager\nLEAD  Added bridge/inbox/demo.md and changed one engine file for the demo; needs the owner: no.\nINSIGHTS TO ROUTE  none\n';
    const pr = (number, headRefName, headRefOid, extra = {}) => ({ number, title: `pr ${number}`, headRefName, headRefOid, baseRefName: 'opus/night-1-skill-benchmark', isDraft: false, isCrossRepository: false,
      url: `https://github.com/x/y/pull/${number}`, author: { login: 'agentbot' }, state: 'OPEN', body: '', reviews: [], ...extra });
    const prs = [pr(1, 'opus/night-1-skill-benchmark', sha('opus/night-1-skill-benchmark'), { baseRefName: 'main' }), pr(7, 'codex/leaky', sha('codex/leaky')),
      pr(8, 'argon/draft', 'd'.repeat(40), { isDraft: true }), pr(9, 'feature/other', 'e'.repeat(40)), pr(10, 'argon/clean', sha('argon/clean'), { body: REPORT })];
    const save = () => writeFileSync(join(stubDir, 'prs.json'), JSON.stringify(prs));
    save();
    const env = { PR_LOOP_GH: join(stubDir, 'gh_stub.mjs'), STUB_DIR: stubDir };
    const loop = (...args) => spawnSync(process.execPath, [join(here, 'review_prs.mjs'), ...args, '--home', home, '--clone', clone], { encoding: 'utf8', env: { ...process.env, ...env } });

    // poll: PR 1, the draft and the other branch are left out
    let r = loop('poll'); assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout).new.map((x) => x.number), [7, 10]);
    r = loop('poll', '--max', '1'); assert.equal(JSON.parse(r.stdout).later, 1);
    r = loop('poll', '--exit-code'); assert.equal(r.status, 10);

    // never PR 1
    r = loop('prepare', '1'); assert.equal(r.status, 1); assert.match(r.stderr, /never touched/);
    r = loop('post', '1', '--result', join(stubDir, 'nope.json')); assert.equal(r.status, 1); assert.match(r.stderr, /never touched/);

    // prepare 7: the leak is found in history, masked, and the agents are not run
    r = loop('prepare', '7'); assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /privacy: FAIL \(2 hit/); assert.match(r.stdout, /report shape: FAIL/); assert.match(r.stdout, /claim-reader no, engine-auditor no/);
    assert.ok(!r.stdout.includes('dev/leak') && !r.stdout.includes('q'.repeat(10)), 'the summary must not repeat the leak');
    const order7 = JSON.parse(readFileSync(/order: (.+)/.exec(r.stdout)[1].trim(), 'utf8'));
    assert.ok(order7.checks.privacy.hits.every((h) => !h.includes('dev/leak') && !h.includes('q'.repeat(10))));

    // prepare 10: clean, locked file touched, engine auditor needed
    r = loop('prepare', '10'); assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /privacy: PASS/); assert.match(r.stdout, /report shape: PASS/); assert.match(r.stdout, /claim-reader yes, engine-auditor yes/);
    const orderPath = /order: (.+)/.exec(r.stdout)[1].trim();
    const order = JSON.parse(readFileSync(orderPath, 'utf8'));
    assert.deepEqual(order.checks.paths.locked, ['bridge/world/valleys.mjs']);
    assert.deepEqual(order.checks.paths.managerOwned, ['AGENTS.md']);
    assert.equal(order.lockedCheck[0].identical, false);
    assert.ok(readFileSync(order.inputs.claims, 'utf8').includes('The loop closed in 3 steps'));
    assert.ok(existsSync(join(order.inputs.files, 'bridge/inbox/demo.md')));
    assert.equal(sh(clone, 'git', ['for-each-ref', 'refs/pr-loop']).trim(), '', 'private refs are removed');
    assert.equal(sh(clone, 'git', ['status', '--porcelain']).trim(), '', 'the clone working tree is untouched');

    // post: dry run first, a bad result, then the real post
    const good = { outcome: 'findings', review: 'The claim "The loop closed in 3 steps" rests on one world; say so. cc @someoneelse', landed: { used: 'the demo file shape', changed: 'one claim needs its world named', didNotFit: 'none', nextAsk: 'name the world' }, lessons: ['claim-reader · 2026-11-02: asked for the world behind each number'] };
    writeFileSync(join(stubDir, 'result.json'), JSON.stringify(good));
    r = loop('post', '10', '--result', join(stubDir, 'result.json'), '--dry-run'); assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /fidelity-pr-loop sha=/); assert.match(r.stdout, /approves nothing and merges nothing/); assert.match(r.stdout, /LANDED  argon\/clean/); assert.match(r.stdout, /to @agentbot/);
    assert.ok(r.stdout.includes('`@someoneelse`'), 'a stray mention is neutralized');
    assert.ok(!existsSync(join(stubDir, 'calls.jsonl')), 'a dry run posts nothing');

    writeFileSync(join(stubDir, 'bad.json'), JSON.stringify({ ...good, review: `it leaks ${j('C', ':/', 'Us', 'ers/dev/x')}` }));
    r = loop('post', '10', '--result', join(stubDir, 'bad.json')); assert.equal(r.status, 1); assert.match(r.stderr, /private string/);
    writeFileSync(join(stubDir, 'bad2.json'), JSON.stringify({ ...good, outcome: 'approved' }));
    r = loop('post', '10', '--result', join(stubDir, 'bad2.json')); assert.equal(r.status, 1); assert.match(r.stderr, /outcome must be/);
    assert.ok(!existsSync(join(stubDir, 'calls.jsonl')));

    r = loop('post', '10', '--result', join(stubDir, 'result.json')); assert.equal(r.status, 0, r.stderr);
    const calls = readFileSync(join(stubDir, 'calls.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].args.slice(0, 2), ['pr', 'review']); assert.ok(calls[0].args.includes('--comment'));
    assert.ok(!calls.some((c) => c.args.some((a) => ['--approve', '-a', '--request-changes', 'merge'].includes(a))));
    assert.deepEqual(calls[1].args.slice(0, 2), ['pr', 'comment']);
    assert.ok(readFileSync(join(home, 'LESSONS_FOR_ROSTER.md'), 'utf8').includes('asked for the world'));

    // poll again: reviewed at this commit, so only PR 7 remains; a new commit brings PR 10 back
    r = loop('poll'); assert.deepEqual(JSON.parse(r.stdout).new.map((x) => x.number), [7]);
    prs[4].headRefOid = 'f'.repeat(40); save();
    r = loop('poll'); const again = JSON.parse(r.stdout).new.find((x) => x.number === 10); assert.match(again.why, /new commits since/);
    prs[4].headRefOid = order.sha; save();

    // the head moved after prepare: nothing is posted
    prs[4].headRefOid = '1'.repeat(40); save();
    rmSync(join(home, 'state.json'));
    r = loop('post', '10', '--result', join(stubDir, 'result.json')); assert.equal(r.status, 1); assert.match(r.stderr, /new commits/);

    // nothing new at all: the case the scheduled run meets almost every time
    prs.length = 0; prs.push(pr(1, 'opus/night-1-skill-benchmark', 'a'.repeat(40), { baseRefName: 'main' })); save();
    r = loop('poll'); assert.equal(r.status, 0); assert.match(r.stdout, /^NOTHING_NEW/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

t('review text and landed note: composed from facts, with the marker and the footer', () => {
  const order = { pr: 3, sha: 'a'.repeat(40), branch: 'codex/x', author: 'bot', checks: { privacy: { pass: true, hits: [], total: 0 }, reportShape: { pass: false, missing: ['LEAD'], empty: [] }, paths: { total: 2, checkers: [], managerOwned: [], locked: [], deleted: [], bridgeCode: [] } }, needs: { claimReader: true, engineAuditor: false }, inputs: { claimsTruncated: false } };
  const rv = composeReview(order, { review: 'body' }, '2026-11-02');
  assert.ok(rv.startsWith(`<!-- fidelity-pr-loop sha=${'a'.repeat(40)}`)); assert.ok(rv.includes('no LEAD')); assert.ok(rv.includes('not executed here'));
  assert.ok(composeLanded(order, { landed: { used: 'u', changed: 'c', didNotFit: 'd', nextAsk: 'n' } }, '2026-11-02').includes('from the PR loop, to @bot'));
  assert.throws(() => validateResult({ outcome: 'findings', landed: { used: 'u' } }), /landed\./);
});

// ------------------------------------------------------------------ G. the loop's own files are clean
t('the loop’s own files pass their own privacy scan', () => {
  const files = readdirSync(here).filter((f) => /\.(mjs|md)$/.test(f)).map((f) => join(here, f));
  for (const extra of [join(here, '..', 'PR_LOOP.md'), join(here, '..', '..', '.github', 'workflows', 'outside-agent-checks.yml')]) if (existsSync(extra)) files.push(extra);
  assert.deepEqual(scanFiles(files).map((h) => `${h.file}:${h.line} ${h.rule}`), []);
});

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
