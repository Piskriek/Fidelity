// Pass R27 (part c): proposal refinements found by regrowing the point cloud.
// Usage: node patch_plan_r27c.mjs <FIDELITY_COMPLETE_BRS_V2.md> <holesBefore> <holesAfter>
import fs from 'node:fs';
const [file, before, after] = process.argv.slice(2);
let s = fs.readFileSync(file, 'utf8');
function edit(oldStr, newStr) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = s.replace(oldStr, () => newStr);
}
edit('`ms s=<pxd,vtx,lx,aq> arch=<1..22> vital=<5..100> strain=<0..500> debt=<0..64> doses=<0..7>` (~90 bytes)', '`ms s=<pxd,vtx,lx,aq> arch=<1..22> vital=<5..100> strain=<0..500> debt=<0..64> doses=<0..7> hp=<0..1>` (~100 bytes; `hp` added when the regrown map showed integrity still had no seam)');
edit('**Session end:** `formatShorthandRecordV2` (with eviction) + World Ledger append.', '**Session end:** `formatShorthandRecordV2` (with eviction) + World Ledger append. Wave 6 extends the tick with the cartridge gate (on import), circle evaluation and the universe bridge, so nothing built in Waves 1–5 calls a Wave 6 package (the regrown map caught this order clash).');
edit('Generated hole list: `spine/GAP_MAP.md` (`node scripts/fractal_gap_map.mjs`).', `Generated hole list: \`spine/GAP_MAP.md\` (\`node scripts/fractal_gap_map.mjs\`). **Regrowth check:** applying these fills to the point cloud (\`--overlay spine/proposed_fills.json\`, output \`spine/GAP_MAP_REGROWN.md\`) takes the map from ${before} holes to ${after}. The ones left are the §8.3 questions and the bounds that depend on them.`);
fs.writeFileSync(file, s);
console.log('plan §8.2 refined from the regrowth');
