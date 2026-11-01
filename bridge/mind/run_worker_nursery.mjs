// The seasonal nursery (MIND_STEP7.md, BRIDGE_DESIGN.md §4.8): RC, model seeds 1-3, 40,000 steps each, all at once on the
// 3080 PC. Each record carries the data's fingerprint (nursery.ansCountCE, H1, ticksPerChar) to compare with the laptop's.
//   node F:/fidelity-llm/bridge/mind/run_worker_nursery.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const dir = 'F:/fidelity-llm/bridge', outDir = `${dir}/mind/runs/nursery`;
const jobs = [1, 2, 3].map(seed => ({ arm: 'RC', seed }));
fs.mkdirSync(outDir, { recursive: true });
let left = jobs.length;
// started one second apart: simultaneous opens of one script failed on the exFAT drive in v5
jobs.forEach(({ arm, seed }, i) => setTimeout(() => {
  const out = `${outDir}/W0_s${seed}.json`;
  // --verbose prints the learning curve every 500 steps; it is appended to a progress file as it comes, for live tracking
  const p = spawn(process.execPath, [`${dir}/mind/nursery.mjs`, '--world', '--arm', arm, '--seed', String(seed), '--steps', '40000', '--out', out, '--verbose'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const progress = out.replace(/\.json$/, '.progress.jsonl');
  fs.writeFileSync(progress, JSON.stringify({ started: new Date().toISOString(), arm, seed, steps: 40000 }) + '\n');
  let text = '';
  p.stdout.on('data', d => { const s = String(d); if (s.trimStart().startsWith('{')) fs.appendFileSync(progress, s); else text += s; });
  p.stderr.on('data', d => { text += d; });
  p.on('close', code => {
    const line = `${new Date().toISOString()} [3080 PC] W0 ${arm} s${seed} exit ${code}: ${text.trim()}\n`;
    fs.appendFileSync(`${outDir}/RUNLOG.txt`, line);
    process.stdout.write(line);
    if (--left === 0) process.stdout.write('all done\n');
  });
}, i * 1000));
