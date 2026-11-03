// Step 6: apply each planted-leak mutant to a fresh copy of the bridge and run every test suite. A mutant is caught
// if any suite fails (non-zero exit, a FAIL line, or a crash).
//   node run/mutants.mjs <mutants.json> <out.json>
// mutants.json: [{ id, file, find, replace, leak }], each `find` must occur exactly once in `file` (relative to bridge/).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [mutFile, outFile] = process.argv.slice(2);
const mutants = JSON.parse(fs.readFileSync(mutFile, 'utf8'));
const SUITES = fs.readdirSync(path.join(root, 'test')).filter(f => f.endsWith('.test.mjs')).sort();
const copyTree = (src, dst) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (['ledgers', 'node_modules'].includes(e.name) || e.name.endsWith('_raw.json')) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
};
const results = [];
for (const m of mutants) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fv-mut-'));
  copyTree(root, dir);
  const f = path.join(dir, m.file);
  const src = fs.readFileSync(f, 'utf8'), n = src.split(m.find).length - 1;
  if (n !== 1) { results.push({ id: m.id, status: 'INVALID', reason: `find occurs ${n} times` }); console.log(`INVALID ${m.id}: find occurs ${n} times`); continue; }
  fs.writeFileSync(f, src.replace(m.find, () => m.replace));
  const failedSuites = [];
  for (const s of SUITES) {
    const r = spawnSync(process.execPath, [path.join('test', s)], { cwd: dir, encoding: 'utf8', timeout: 600000 });
    const out = (r.stdout || '') + (r.stderr || '');
    if (r.status !== 0 || /\bFAIL\b/.test(out) || r.error) failedSuites.push({ suite: s, first: (out.split('\n').find(l => /FAIL|Error/.test(l)) || `exit ${r.status}`).slice(0, 160) });
  }
  const status = failedSuites.length ? 'CAUGHT' : 'MISSED';
  results.push({ id: m.id, leak: m.leak, status, by: failedSuites });
  console.log(`${status} ${m.id}: ${m.leak}${failedSuites.length ? `  <- ${failedSuites.map(x => `${x.suite}: ${x.first}`).join(' | ')}` : ''}`);
  fs.rmSync(dir, { recursive: true, force: true });
}
fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
const caught = results.filter(r => r.status === 'CAUGHT').length, valid = results.filter(r => r.status !== 'INVALID').length;
console.log(`caught ${caught} of ${valid} valid mutants`);
