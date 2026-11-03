#!/usr/bin/env node
// Git-backed state bus. Agent mode reads snapshots from origin/main and publishes
// responses to the current non-main branch; it never switches or pushes main.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { processInboundQuery, runArenaNode } from './arena_node.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../..');
const SYNC_DIR = path.join(REPO_ROOT, 'bridge', 'sync');
const TRIAD_FILE = 'bridge/sync/triad_telemetry.json';
const PENDING_FILE = 'bridge/sync/pending_query.json';
const ARENA_FILE = 'bridge/sync/arena_telemetry.json';
const MAX_GIT_OUTPUT = 1024 * 1024;

function git(args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    execFile('git', args, {
      cwd: REPO_ROOT,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      timeout: 25000,
      maxBuffer: MAX_GIT_OUTPUT,
      encoding: 'utf8',
      shell: false,
    }, (error, stdout = '', stderr = '') => {
      const result = { ok: !error, code: error?.code ?? 0, stdout, stderr };
      if (error && !allowFailure) {
        const detail = stderr.trim().replace(/[\x00-\x1f\x7f]+/g, ' ').slice(0, 500);
        reject(new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ''}`));
      } else resolve(result);
    });
  });
}

function readJsonOptional(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function readBytesOptional(file) {
  try { return fs.readFileSync(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function sameBytes(a, b) {
  return a === null ? b === null : b !== null && a.equals(b);
}

function writeAtomic(file, bytes) {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } catch (error) {
    try { fs.unlinkSync(temporary); } catch {}
    throw error;
  }
}

async function currentBranch() {
  const result = await git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const branch = result.stdout.trim();
  if (!branch) throw new Error('A checked-out branch is required.');
  return branch;
}

async function assertAgentBranch(expectedBranch) {
  let actual;
  try { actual = await currentBranch(); }
  catch {
    const error = new Error('The active branch could not be determined; stopping the agent daemon.');
    error.fatal = true;
    throw error;
  }
  if (actual !== expectedBranch) {
    const error = new Error(`Branch changed from ${expectedBranch} to ${actual}; stopping the agent daemon.`);
    error.fatal = true;
    throw error;
  }
}

async function fetchMain() {
  await git(['fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main']);
  const sha = (await git(['rev-parse', '--verify', 'refs/remotes/origin/main'])).stdout.trim();
  if (!/^[0-9a-f]{40,64}$/.test(sha)) throw new Error('Git did not return a valid main commit.');
  return sha;
}

async function readSnapshot(sha, file) {
  const result = await git(['show', `${sha}:${file}`], { allowFailure: true });
  return result.ok ? result.stdout : null;
}

async function outputFileState() {
  const result = await git(['status', '--porcelain=v1', '--untracked-files=all', '--', ARENA_FILE]);
  const line = result.stdout.split('\n').find(Boolean);
  if (!line) return { modified: false, staged: false };
  // Never replace or commit a staged/untracked output: another actor owns it.
  return { modified: line[1] !== ' ', staged: line[0] !== ' ' };
}

function validateExistingOutput(bytes, queryId) {
  if (!bytes) throw new Error('No response file is available to publish.');
  const output = JSON.parse(bytes.toString('utf8'));
  const response = output?.lastQueryResponse;
  if (!response || response.id !== queryId || typeof response.query !== 'string') throw new Error('The modified output does not match the current inquiry.');
  const hash = createHash('sha256').update(response.query, 'utf8').digest('hex');
  if (response.query_sha256 !== hash) throw new Error('The modified output has an invalid query hash.');
  if (response.status === 'awaiting_reasoner') {
    if (response.answer !== null) throw new Error('An awaiting response cannot contain an answer.');
  } else if (response.status === 'completed') {
    processInboundQuery({ id: response.id, question: response.query }, {
      reflection: {
        query_id: response.id,
        query_sha256: response.query_sha256,
        answer: response.answer,
        density_review: response.density_review,
        four_floats: response.four_floats?.values,
        four_floats_basis: response.four_floats?.basis,
      },
    });
  } else throw new Error('The modified output has an unsupported status.');
}

/** One agent cycle. The producer snapshot is never checked out or merged. */
export async function syncArenaAgent({ branch, state }) {
  await assertAgentBranch(branch);
  const sourceSha = await fetchMain();
  const [triad, pending] = await Promise.all([
    readSnapshot(sourceSha, TRIAD_FILE),
    readSnapshot(sourceSha, PENDING_FILE),
  ]);
  if (triad === null && pending === null) throw new Error('No inquiry files were found on origin/main.');

  const outputFile = path.join(REPO_ROOT, ARENA_FILE);
  const original = readBytesOptional(outputFile);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'arena-git-sync-'));
  let result;
  let generated;
  try {
    if (triad !== null) fs.writeFileSync(path.join(temporary, 'triad_telemetry.json'), triad, { mode: 0o600 });
    if (pending !== null) fs.writeFileSync(path.join(temporary, 'pending_query.json'), pending, { mode: 0o600 });
    if (original !== null) fs.writeFileSync(path.join(temporary, 'arena_telemetry.json'), original, { mode: 0o600 });
    // No built-in adapter is selected: only an explicitly configured reasoner
    // may answer. Otherwise Node 4 records awaiting_reasoner.
    result = await runArenaNode({ syncDir: temporary, env: process.env });
    generated = readBytesOptional(path.join(temporary, 'arena_telemetry.json'));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }

  await assertAgentBranch(branch);
  if (!sameBytes(original, readBytesOptional(outputFile))) throw new Error('The local response changed during processing; it was left untouched.');
  const fileState = await outputFileState();
  if (fileState.staged) throw new Error('The response file is staged or untracked; it was left untouched.');
  if (result.written && fileState.modified) throw new Error('The response file has uncommitted changes; it was left untouched.');

  const hasNewOutput = result.query_id && (result.written || fileState.modified);
  if (hasNewOutput) {
    const candidate = result.written ? generated : original;
    validateExistingOutput(candidate, result.query_id);
    // Do not publish a reflection for an obsolete main snapshot.
    if (await fetchMain() !== sourceSha) throw new Error('origin/main changed during processing; the response was not published.');
    await assertAgentBranch(branch);
    if (!sameBytes(original, readBytesOptional(outputFile))) throw new Error('The local response changed before publication; it was left untouched.');
    const latestState = await outputFileState();
    if (latestState.staged || (result.written && latestState.modified)) throw new Error('The response file changed before publication; it was left untouched.');
    if (result.written) writeAtomic(outputFile, candidate);
    await assertAgentBranch(branch);
    if ((await outputFileState()).staged || !sameBytes(candidate, readBytesOptional(outputFile))) {
      throw new Error('The response file changed before commit; it was left untouched.');
    }
    // --only prevents unrelated staged changes from entering the daemon commit.
    await git(['commit', '--only', '-m', `sync: Node 4 ${result.status} ${result.query_id}`, '--', ARENA_FILE]);
    state.pushPending = true;
    console.log(`[AGENT SYNC] Committed ${result.status} for ${result.query_id} on ${branch}.`);
  }

  if (state.pushPending && Date.now() >= (state.retryPushAt || 0)) {
    await assertAgentBranch(branch);
    try {
      await git(['push', 'origin', `HEAD:refs/heads/${branch}`]);
      state.pushPending = false;
      state.retryPushAt = 0;
      console.log(`[AGENT SYNC] Published to origin/${branch}; origin/main is unchanged.`);
    } catch (error) {
      state.retryPushAt = Date.now() + 60000;
      throw error;
    }
  }
  return result;
}

// Local-host mode retains the original main-branch bus workflow for operators
// on their own machines. Agent mode above does not use this path.
let lastLocalQueryId = null;
async function syncLocalHost() {
  const branch = await currentBranch();
  if (branch !== 'main') throw new Error('Local-host mode requires its own main checkout; use --agent on a session branch.');
  const triad = readJsonOptional(path.join(SYNC_DIR, 'triad_telemetry.json'));
  const pending = readJsonOptional(path.join(SYNC_DIR, 'pending_query.json'));
  const currentQuery = triad?.query || pending;
  const id = currentQuery?.id;
  if (id && id !== lastLocalQueryId) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) throw new Error('Invalid local query ID.');
    const commit = await git(['commit', '--only', '-m', `sync: publish inquiry ${id}`, '--', TRIAD_FILE, PENDING_FILE], { allowFailure: true });
    if (commit.ok) {
      await git(['push', 'origin', 'main']);
      console.log(`[LOCAL SYNC] Published inquiry ${id} to origin/main.`);
    } else if (!/nothing to commit|no changes added to commit/i.test(commit.stdout + commit.stderr)) {
      throw new Error('Could not commit the local inquiry.');
    }
    lastLocalQueryId = id;
  }
  const sourceSha = await fetchMain();
  const diff = await git(['diff', '--quiet', 'HEAD', sourceSha, '--', ARENA_FILE], { allowFailure: true });
  if (!diff.ok && diff.code === 1) {
    await git(['pull', '--ff-only', 'origin', 'main']);
    console.log('[LOCAL SYNC] Updated the Arena response from origin/main.');
  }
}

function parseArgs(args) {
  const options = { agent: false, once: false, interval: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent') options.agent = true;
    else if (args[i] === '--once') options.once = true;
    else if (args[i] === '--interval') options.interval = Number(args[++i]);
    else if (args[i] === '--help' || args[i] === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  if (options.interval === null) options.interval = options.agent ? 12000 : 15000;
  if (!Number.isInteger(options.interval) || options.interval < 1000 || options.interval > 120000) throw new Error('--interval must be 1000–120000 milliseconds.');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node packages/triad-369/src/arena_git_sync.mjs [--agent] [--once] [--interval MS]');
    console.log('Agent mode reads origin/main and publishes only to its current non-main branch.');
    return;
  }
  const branch = await currentBranch();
  if (options.agent && branch === 'main') throw new Error('Agent mode refuses to publish from main; use a separate session branch.');
  if (options.agent && process.env.ARENA_SYNC_BRANCH && process.env.ARENA_SYNC_BRANCH !== branch) throw new Error('ARENA_SYNC_BRANCH does not match the current branch.');
  console.log(`Arena Git sync: ${options.agent ? 'agent' : 'local'} mode; branch ${branch}; interval ${options.interval}ms.`);
  if (options.agent && !process.env.ARENA_REASONER_EXEC) console.log('No reasoner configured; new inquiries will remain awaiting_reasoner.');
  const wake = new AbortController();
  const stop = () => wake.abort();
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  const state = { pushPending: false, retryPushAt: 0 };
  do {
    try {
      if (options.agent) await syncArenaAgent({ branch, state });
      else await syncLocalHost();
    } catch (error) {
      console.error(`[SYNC ERROR] ${error.message}`);
      if (options.once || error.fatal) { process.exitCode = 1; break; }
    }
    if (options.once || wake.signal.aborted) break;
    try { await delay(options.interval, undefined, { signal: wake.signal }); }
    catch (error) { if (error.name !== 'AbortError') throw error; }
  } while (!wake.signal.aborted);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`[SYNC ERROR] ${error.message}`); process.exitCode = 1; });
}
