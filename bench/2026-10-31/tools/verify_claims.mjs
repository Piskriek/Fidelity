// Independently checks numeric/integrity claims made in the Plan and Resume.
// Usage: node verify_claims.mjs <plan.md> <resume.md>
import fs from 'node:fs';

const [planPath, resumePath] = process.argv.slice(2);
const plan = fs.readFileSync(planPath, 'utf8');
const resume = fs.readFileSync(resumePath, 'utf8');

function crc32Hex(text) {
  const buf = Buffer.from(text, 'utf8');
  let crc = 0xFFFFFFFF;
  for (const b of buf) { crc ^= b; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0); }
  return '0x' + ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}
function shorthandBlock(doc) {
  const lines = doc.split('\n').map(l => l.replace(/[^ -~]/g, '').trim().replace(/^`|`$/g, ''));
  const start = lines.findIndex(l => l.startsWith('m of='));
  const end = lines.findIndex((l, i) => i > start && l.startsWith('#TAIL|'));
  const body = lines.slice(start, end).filter(Boolean);
  const declared = lines[end].match(/crc32:(0x[0-9A-F]+)/i)[1];
  return { body, declared, computed: crc32Hex(body.join('\n')) };
}

const out = {};
for (const [name, doc] of [['plan', plan], ['resume', resume]]) {
  const b = shorthandBlock(doc);
  out[`crc_${name}`] = { declared: b.declared, computed: b.computed, match: b.declared === b.computed, lines: b.body.length };
}

// Sector span claim: "+-9.75e7 light-years"
const LY = 9.4607304725808e15;
out.sectorSpanLy = { claimed: 9.75e7, actual_2pow63_x_131072m: Number((2 ** 63 * 131072 / LY).toExponential(4)), with_100km_sectors: Number((2 ** 63 * 1e5 / LY).toExponential(4)) };

// Spider diagram sub-branch count vs "32 Verified Sub-Branches"
const sub = [...plan.matchAll(/[├└]── (\d)\.(\d+) /g)].map(m => `${m[1]}.${m[2]}`);
out.subBranches = { claimed: 32, counted: new Set(sub).size };

// Ledger: sum of defect counts in Part 8 table vs headline
const part8 = plan.slice(plan.indexOf('# PART 8'));
const counts = [...part8.matchAll(/\((\d+) defects\)/g)].map(m => +m[1]);
out.ledger = { heading: (part8.match(/ALL (\d+) DEFECTS/) || [])[1], rows: counts, sum: counts.reduce((a, b) => a + b, 0), statusLineClaims: '74 / 74', hasR24Row: /Pass R24/.test(part8) };

// p_eff at vacuum and KL term sign check
out.vacuumFloor = { p_eff_at_vacuum: Math.pow(1e-3, 0.08), tMelt_min_K: 50 * Math.pow(1e-3, 0.08) };
const kl = x => x - Math.log(x) - 1;
out.klTerm = { at_0_5: kl(0.5), at_1: kl(1), at_2: kl(2), at_0: kl(0) };

// Packages referenced anywhere vs packages in monorepo tree
const referenced = new Set([...plan.matchAll(/@hm\/([a-z0-9-]+)/g)].map(m => m[1]));
const treeStart = plan.indexOf('fidelity-universe/`');
const tree = plan.slice(treeStart, plan.indexOf('### 4.2'));
const inTree = new Set([...tree.matchAll(/[├└]── ([a-z0-9-]+)\/\s/g)].map(m => m[1]));
out.packages = { referencedCount: referenced.size, inTreeCount: inTree.size, referencedButNotInTree: [...referenced].filter(p => !inTree.has(p)).sort() };

// Banned CI tokens present in the plan itself (verify-clean-slate.mjs would scan the repo root)
out.cleanSlateGateSelfHit = Object.fromEntries(['moon_crater', 'A4-01', 'leaks', '.glb'].map(t => [t, plan.split(t).length - 1]));

console.log(JSON.stringify(out, null, 2));
