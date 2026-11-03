// Check N3 (MIND_STEP7.md): nursery.mjs in text mode must reproduce levels_v6.mjs exactly. Compares two run
// records field by field, ignoring only the script hash and the wall time, and the two weight files byte for byte.
//   node mind/n3_compare.mjs mind/runs/n3/v6_R9_s1.json mind/runs/n3/nursery_R9_s1.json
import fs from 'node:fs';
const [a, b] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(a, 'utf8')), B = JSON.parse(fs.readFileSync(b, 'utf8'));
for (const r of [A, B]) { delete r.script; delete r.seconds; }
const diffs = [];
(function walk(x, y, p) {
  if (typeof x !== typeof y || Array.isArray(x) !== Array.isArray(y) || (x === null) !== (y === null)) { diffs.push(`${p}: type`); return; }
  if (x && typeof x === 'object') {
    const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const k of keys) walk(x[k], y[k], `${p}.${k}`);
  } else if (x !== y) diffs.push(`${p}: ${x} vs ${y}`);
})(A, B, '');
const wa = fs.readFileSync(a.replace(/\.json$/, '.weights.bin')), wb = fs.readFileSync(b.replace(/\.json$/, '.weights.bin'));
const wSame = wa.equals(wb);
console.log(`N3: ${diffs.length} record differences, weights ${wSame ? 'identical' : 'DIFFER'} (${wa.length} bytes)`);
for (const d of diffs.slice(0, 20)) console.log('  ' + d);
process.exit(diffs.length || !wSame ? 1 : 0);
