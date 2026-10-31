// Pass R27 (part d): blind-regrower findings B154–B158, appended to §8.1 with counts updated.
// Usage: node patch_plan_r27d.mjs <FIDELITY_COMPLETE_BRS_V2.md>
import fs from 'node:fs';
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');
function edit(oldStr, newStr) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = s.replace(oldStr, () => newStr);
}

const EXTRA = [
  ['B154', 'FIXED', 'C31', 'The rollout stops at E_ψ ≤ 1e-9, below float32 resolution of the `Float32Array` state (r − ln r − 1 rounds to 0 near r = 1), so it could "converge" early; energies are now evaluated in float64.',
    ['\\le 10^{-9}$ (`convergedInOnePass === true`)', '\\le 10^{-9}$, evaluated in float64 because the bound is below float32 resolution (`B154`) (`convergedInOnePass === true`)']],
  ['B155', 'FIXED', 'C31', 'aspectRatio had no orientation convention; the targets {1, √2, φ} are not closed under reciprocal, so a sideways craft scored differently.',
    ['|\\text{aspectRatio} - t|)$', '|\\text{aspectRatio} - t|)$ (aspectRatio = longest / shortest extent, so ≥ 1, `B155`)']],
  ['B156', 'OPEN', 'C7', 'The cross-wired polarity weights (0.72, 0.76, 0.74, 0.78) are consumed by no formula: wire them in or mark them as lore.'],
  ['B157', 'OPEN', 'C6', 'H_circle assumes rays in [0, 1], but `ch` rays are Int8 (±127); the scale map (e.g. clamp01(ch/127)) is unstated.'],
  ['B158', 'FIXED', 'C7', 'The VSA "normalized Hamming similarity in [-1, 1]" had no formula.',
    ['normalized Hamming similarity $s(\\mathbf{A}, \\mathbf{B}) \\in [-1, 1]$', 'normalized Hamming similarity $s(\\mathbf{A}, \\mathbf{B}) = 1 - 2\\, d_H(\\mathbf{A}, \\mathbf{B}) / 4096 \\in [-1, 1]$ (`B158`)']],
];
for (const e of EXTRA) if (e[4]) edit(e[4][0], e[4][1]);
const addFixed = EXTRA.filter(e => e[1] === 'FIXED').length, addOpen = EXTRA.length - addFixed;

// Counts: status line + heading.
const st = s.match(/\*\*(\d+) Defects Logged \(`#01–#(\d+)`, Passes R1–R27\): (\d+) Closed \/ (\d+) Open\.\*\*/);
const [L, C, O] = [+st[1] + EXTRA.length, +st[3] + addFixed, +st[4] + addOpen];
s = s.replace(st[0], `**${L} Defects Logged (\`#01–#${L}\`, Passes R1–R27): ${C} Closed / ${O} Open.**`);
edit(`(\`R1 -> R27\`: ${st[1]} DEFECTS LOGGED — ${st[3]} CLOSED, ${st[4]} OPEN)`, `(\`R1 -> R27\`: ${L} DEFECTS LOGGED — ${C} CLOSED, ${O} OPEN)`);

// The set-C findings row grows to cover the regrower's items.
const row = s.match(/\| \*\*Pass R27 — Set-C Reader Findings\*\* \| `B137–B(\d+)` \((\d+) defects\) \| (.*?): (\d+) fixed, (\d+) open (.*?) \| (\d+) fixed · (\d+) \*\*OPEN\*\* \|/);
if (!row) throw new Error('set-C row not found');
const n = +row[2] + EXTRA.length, f = +row[4] + addFixed, o = +row[5] + addOpen;
s = s.replace(row[0], `| **Pass R27 — Set-C Reader Findings** | \`B137–${EXTRA.at(-1)[0]}\` (${n} defects) | ${row[3].replace('Union of the set-C arms\' non-planted findings', 'Union of the set-C arms\' non-planted findings, including the Reduce v2 blind regrower,')}: ${f} fixed, ${o} open ${row[6]} | ${f} fixed · ${o} **OPEN** |`);

const regEnd = s.indexOf('\n## 8.2');
const before = s.slice(0, regEnd).replace(/\n+$/, '');
s = before + '\n' + EXTRA.map(([id, stt, c, d]) => `| \`${id}\` | **${stt}** | ${c} | ${d} |`).join('\n') + '\n' + s.slice(regEnd);
fs.writeFileSync(file, s);
console.log(JSON.stringify({ logged: L, closed: C, open: O }));
