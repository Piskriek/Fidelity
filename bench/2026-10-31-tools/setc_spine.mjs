// Reproduces the formula spine's result on the set-C plan (bench/2026-10-31-c/): which of the 10 planted
// defects it catches. In-sample: specs F01–F28 were written after these plants were known.
// Usage: node bench/2026-10-31-tools/setc_spine.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'setc-spine-'));
fs.copyFileSync(path.join(ROOT, 'bench/2026-10-31-c/inputs/PLAN_C_seeded.md'), path.join(dir, 'FIDELITY_COMPLETE_BRS_V2.md'));
const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/formula_spine.mjs'), dir, '--quiet'], { encoding: 'utf8' });
fs.rmSync(dir, { recursive: true, force: true });
const flagged = new Set([...r.stdout.matchAll(/(F\d+) FAIL/g)].map(m => m[1]));
// Plant → the spine entry whose formula holds it (answer key: bench/2026-10-31-c/keys/answer_key_C.json).
const PLANTS = { C1: 'F05', C2: 'F09', C3: 'F20', C4: 'F10', C5: 'F08', C6: 'F02', C7: 'F01', C8: 'F19', C9: 'F26', C10: 'F17' };
let caught = 0;
for (const [plant, spec] of Object.entries(PLANTS)) {
  const hit = flagged.has(spec);
  caught += hit;
  console.log(`${hit ? 'caught' : 'MISSED'} ${plant} (${spec})`);
}
console.log(`${caught}/10 set-C plants caught by the formula spine (in-sample)`);
process.exitCode = caught === 10 ? 0 : 1;
