// The v1a lives (PREREG_bridge_v1a.md): arms F, F2 (F'), L and LH; model seeds 1-3 (trunks W0_s1-3); world seeds 101-116;
// one life of 16,384 ticks per run, 48 runs, at most 20 at a time on the 3080 PC (the owner's twin also works there).
// Each run streams its scoreboard to progress/<run>.jsonl as it goes (live.mjs --progress), for the live board.
//   node F:/fidelity-llm/bridge/mind/run_worker_v1a.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const dir = 'F:/fidelity-llm/bridge', outDir = `${dir}/mind/runs/v1b`, progDir = `${outDir}/progress`, MAX = 20;
fs.mkdirSync(progDir, { recursive: true });
const jobs = [];
for (const world of [...Array(16).keys()].map(i => 101 + i)) for (const seed of [1, 2, 3]) for (const arm of ['Y']) jobs.push({ arm, seed, world });
const name = j => `${j.arm}_s${j.seed}_w${j.world}`;
let next = 0, running = 0, done = 0;
const log = line => { fs.appendFileSync(`${outDir}/RUNLOG.txt`, line); process.stdout.write(line); };
log(`${new Date().toISOString()} [3080 PC] v1b worker (the yoked arm): ${jobs.length} runs, at most ${MAX} at a time\n`);
function launch() {
  while (running < MAX && next < jobs.length) {
    const j = jobs[next++]; running += 1;
    // started at least one second apart: simultaneous opens of one script failed on the exFAT drive in v5
    setTimeout(() => {
      const p = spawn(process.execPath, [`${dir}/mind/live_y.mjs`, '--live', '--arm', j.arm, '--seed', String(j.seed), '--trunk', `${dir}/mind/runs/nursery/W0_s${j.seed}.json`,
        '--worlds', `${j.world},1`, '--out', `${outDir}/${name(j)}.json`, '--progress', `${progDir}/${name(j)}.jsonl`], { stdio: ['ignore', 'pipe', 'pipe'] });
      let text = '';
      p.stdout.on('data', d => { text += d; });
      p.stderr.on('data', d => { text += d; });
      p.on('close', code => {
        running -= 1; done += 1;
        log(`${new Date().toISOString()} [3080 PC] ${name(j)} exit ${code}: ${text.trim().split('\n').pop()}\n`);
        if (done === jobs.length) log('all done\n'); else launch();
      });
    }, next <= MAX ? next * 1000 : 1000);
  }
}
launch();
