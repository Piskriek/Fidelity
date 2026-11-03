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
const GROWTH_FILE = 'bridge/sync/arena_growth_state.json';
const DEFAULT_GROWTH_PUBLISH_MS = 5 * 60 * 1000;
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
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
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

async function trackedFileState(file = ARENA_FILE) {
  const result = await git(['status', '--porcelain=v1', '--untracked-files=all', '--', file]);
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

async function publishGrowthIfDue(branch, state) {
  if (Date.now() < (state.nextGrowthPublishAt || 0)) return;
  const file = path.join(REPO_ROOT, GROWTH_FILE);
  const original = readBytesOptional(file);
  if (original === null) return;
  const status = await trackedFileState(GROWTH_FILE);
  if (!status.modified || status.staged) return;
  let growth;
  try { growth = JSON.parse(original.toString('utf8')); }
  catch { throw new Error('The growth state is not valid JSON; it was left untouched.'); }
  if (original.length > MAX_GIT_OUTPUT || growth?.schema !== 'arena-growth-state-v2' ||
      !Number.isSafeInteger(growth.growth_tick) || growth.growth_tick < 0 ||
      growth.metrics_status !== 'not_measured' || growth.syntropic_reserve_joules !== null ||
      growth.coherence !== null || growth.ftle_estimate !== null) {
    throw new Error('The growth state is not a valid unmeasured v2 snapshot; it was left untouched.');
  }
  await assertAgentBranch(branch);
  if (!sameBytes(original, readBytesOptional(file)) || (await trackedFileState(GROWTH_FILE)).staged) {
    throw new Error('Growth state changed before commit; it was left untouched.');
  }
  await git(['commit', '--only', '-m', `sync: Node 4 growth pulse ${growth.growth_tick}`, '--', GROWTH_FILE]);
  state.pushPending = true;
  state.nextGrowthPublishAt = Date.now() + DEFAULT_GROWTH_PUBLISH_MS;
  console.log(`[AGENT SYNC] Committed symbolic growth pulse ${growth.growth_tick} on ${branch}.`);
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
  const fileState = await trackedFileState();
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
    const latestState = await trackedFileState();
    if (latestState.staged || (result.written && latestState.modified)) throw new Error('The response file changed before publication; it was left untouched.');
    if (result.written) writeAtomic(outputFile, candidate);
    await assertAgentBranch(branch);
    if ((await trackedFileState()).staged || !sameBytes(candidate, readBytesOptional(outputFile))) {
      throw new Error('The response file changed before commit; it was left untouched.');
    }
    // --only prevents unrelated staged changes from entering the daemon commit.
    await git(['commit', '--only', '-m', `sync: Node 4 ${result.status} ${result.query_id}`, '--', ARENA_FILE]);
    state.pushPending = true;
    console.log(`[AGENT SYNC] Committed ${result.status} for ${result.query_id} on ${branch}.`);
  }

  try { await publishGrowthIfDue(branch, state); }
  catch (error) {
    if (error.fatal) throw error;
    console.error(`[GROWTH SYNC] ${error.message}`);
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

// Local-host mode retains the main-branch bus workflow for operators on their
// own machines. It discovers an agent branch but will not overwrite local edits.
function mirrorSnapshot(filename, incoming, previous) {
  let roots = process.platform === 'win32' ? ['D:/fidelity-llm/bridge/sync', 'C:/MarbleGp/bridge/sync'] : [];
  if (process.env.ARENA_SYNC_MIRROR_DIRS) {
    let configured;
    try { configured = JSON.parse(process.env.ARENA_SYNC_MIRROR_DIRS); }
    catch { console.warn('[LOCAL SYNC] Ignoring invalid ARENA_SYNC_MIRROR_DIRS.'); return; }
    if (!Array.isArray(configured) || configured.length > 8 || configured.some(dir => typeof dir !== 'string' || !path.isAbsolute(dir))) {
      console.warn('[LOCAL SYNC] Ignoring invalid ARENA_SYNC_MIRROR_DIRS.');
      return;
    }
    roots = configured;
  }
  for (const root of new Set(roots)) {
    try {
      const target = path.join(root, filename);
      const current = readBytesOptional(target);
      if (sameBytes(current, incoming)) continue;
      if (current !== null && !sameBytes(current, previous)) {
        console.warn(`[LOCAL SYNC] A mirror of ${filename} has independent changes; it was left untouched.`);
        continue;
      }
      fs.mkdirSync(root, { recursive: true });
      writeAtomic(target, incoming);
    } catch (error) {
      console.warn(`[LOCAL SYNC] Could not update a mirror of ${filename}: ${error.message}`);
    }
  }
}

let lastLocalQueryId = null;
let localPushPending = false;
async function importAgentSnapshots(triad, triadBytes) {
  await git(['fetch', '--no-tags', 'origin', '+refs/heads/arena/*:refs/remotes/origin/arena/*']);
  const list = await git(['for-each-ref', '--sort=-committerdate', '--format=%(refname)', 'refs/remotes/origin/arena/']);
  const refs = list.stdout.split('\n').map(line => line.trim()).filter(line => line.startsWith('refs/remotes/origin/arena/'));
  const requested = process.env.ARENA_SYNC_BRANCH ? `refs/remotes/origin/${process.env.ARENA_SYNC_BRANCH}` : null;
  const ref = requested ? (refs.includes(requested) ? requested : null) : refs[0];
  if (!ref) return;
  const sha = (await git(['rev-parse', '--verify', ref])).stdout.trim();
  if (!/^[a-f0-9]{40,64}$/.test(sha)) throw new Error('Agent branch has an invalid commit ID.');
  const rawResponse = (await readSnapshot(sha, ARENA_FILE))?.replace(/^\uFEFF/, '') ?? null;
  const query = triad?.query;
  if (!rawResponse || !query || typeof query.id !== 'string' || typeof query.question !== 'string') return;
  let response;
  try { response = JSON.parse(rawResponse); }
  catch { throw new Error('The discovered agent response is not valid JSON.'); }
  const expectedHash = createHash('sha256').update(query.question, 'utf8').digest('hex');
  if (response?.lastQueryResponse?.id !== query.id || response?.lastQueryResponse?.query_sha256 !== expectedHash) return;
  if (!sameBytes(triadBytes, readBytesOptional(path.join(REPO_ROOT, TRIAD_FILE)))) throw new Error('The local inquiry changed during branch discovery.');

  const changed = [];
  const mirrors = [];
  for (const file of [ARENA_FILE, GROWTH_FILE]) {
    const incoming = file === ARENA_FILE ? rawResponse : (await readSnapshot(sha, file))?.replace(/^\uFEFF/, '') ?? null;
    if (incoming === null) continue;
    try { JSON.parse(incoming); } catch { throw new Error(`The discovered ${path.basename(file)} is not valid JSON.`); }
    if (!sameBytes(triadBytes, readBytesOptional(path.join(REPO_ROOT, TRIAD_FILE)))) throw new Error('The local inquiry changed during snapshot import.');
    const destination = path.join(REPO_ROOT, file);
    const before = readBytesOptional(destination);
    const bytes = Buffer.from(incoming, 'utf8');
    if (sameBytes(before, bytes)) continue;
    const status = await trackedFileState(file);
    if (status.modified || status.staged) {
      console.warn(`[LOCAL SYNC] Local ${path.basename(file)} has changes; it was left untouched.`);
      continue;
    }
    if (!sameBytes(before, readBytesOptional(destination))) throw new Error(`Local ${path.basename(file)} changed during synchronization.`);
    writeAtomic(destination, bytes);
    mirrors.push({ filename: path.basename(file), incoming: bytes, previous: before });
    changed.push(file);
  }
  if (changed.length) {
    if (await currentBranch() !== 'main') throw new Error('Local branch changed before snapshot commit.');
    if (!sameBytes(triadBytes, readBytesOptional(path.join(REPO_ROOT, TRIAD_FILE)))) throw new Error('The local inquiry changed before snapshot commit.');
    for (const file of changed) if ((await trackedFileState(file)).staged) throw new Error(`Local ${path.basename(file)} was staged during synchronization.`);
    await git(['commit', '--only', '-m', `sync: integrate Arena snapshot from ${ref.slice('refs/remotes/origin/'.length)}`, '--', ...changed]);
    localPushPending = true;
    for (const mirror of mirrors) mirrorSnapshot(mirror.filename, mirror.incoming, mirror.previous);
    console.log(`[LOCAL SYNC] Committed matching Arena snapshots from ${ref.slice('refs/remotes/origin/'.length)}.`);
  }
}

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
      localPushPending = true;
      console.log(`[LOCAL SYNC] Committed inquiry ${id}.`);
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
  } else if (!diff.ok) throw new Error('Could not compare local and remote responses.');
  const currentBytes = readBytesOptional(path.join(REPO_ROOT, TRIAD_FILE));
  const currentTriad = currentBytes ? JSON.parse(currentBytes.toString('utf8').replace(/^\uFEFF/, '')) : null;
  await importAgentSnapshots(currentTriad, currentBytes);
  if (localPushPending) {
    if (await currentBranch() !== 'main') throw new Error('Local branch changed before push.');
    await git(['push', 'origin', 'main']);
    localPushPending = false;
    console.log('[LOCAL SYNC] Published local bus updates to origin/main.');
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
