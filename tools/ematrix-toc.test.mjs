// tools/ematrix-toc.test.mjs
// The three manifests of FidelityEMatrix must agree: one version (the one EMatrix_Core.lua
// announces), one module list in one order, and each per-family manifest loads exactly its own
// family's map data (FidelityEMatrix_Vanilla.toc for 1.x clients, FidelityEMatrix_TBC.toc for
// 2.x) while the fallback FidelityEMatrix.toc loads both. Every listed file must exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const addon = path.resolve(here, '..', 'FidelityEMatrix');

function parseToc(name) {
  const text = fs.readFileSync(path.join(addon, name), 'utf8');
  const headers = {};
  const files = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = /^##\s*([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (h) { headers[h[1]] = h[2].trim(); continue; }
    if (line.startsWith('#')) continue;
    files.push(line);
  }
  return { headers, files };
}

const tocs = {
  fallback: parseToc('FidelityEMatrix.toc'),
  vanilla: parseToc('FidelityEMatrix_Vanilla.toc'),
  tbc: parseToc('FidelityEMatrix_TBC.toc'),
};
const isData = f => /^Data\\EMatrix_Data_/.test(f);
const modules = t => t.files.filter(f => !isData(f));
const data = t => t.files.filter(isData);
const interfaces = t => t.headers.Interface.split(',').map(s => Number(s.trim()));

test('the manifests carry the version EMatrix_Core.lua announces', () => {
  const core = fs.readFileSync(path.join(addon, 'EMatrix_Core.lua'), 'utf8');
  const m = /local VERSION = "([^"]+)"/.exec(core);
  assert.ok(m, 'EMatrix_Core.lua must define VERSION');
  for (const [name, t] of Object.entries(tocs)) assert.equal(t.headers.Version, m[1], `${name} manifest version`);
});

test('every listed file exists, and the module list is the same in every manifest', () => {
  for (const [name, t] of Object.entries(tocs)) {
    for (const f of t.files) {
      assert.ok(fs.existsSync(path.join(addon, ...f.split('\\'))), `${name}: missing ${f}`);
    }
    assert.deepEqual(modules(t), ['EMatrix_Math.lua', 'EMatrix_Core.lua', 'EMatrix_World.lua', 'EMatrix_Terrain.lua'], `${name}: module order`);
    assert.equal(t.headers.SavedVariables, 'FidelityEMatrix_Config', `${name}: SavedVariables`);
  }
});

test('each per-family manifest loads only its own map data; the fallback loads both', () => {
  assert.deepEqual(data(tocs.vanilla), ['Data\\EMatrix_Data_Azeroth_vanilla.lua']);
  assert.deepEqual(data(tocs.tbc), ['Data\\EMatrix_Data_Azeroth_tbc.lua']);
  assert.deepEqual(data(tocs.fallback).sort(), ['Data\\EMatrix_Data_Azeroth_tbc.lua', 'Data\\EMatrix_Data_Azeroth_vanilla.lua']);
  // the data must load before the modules that read it at /reload
  for (const [name, t] of Object.entries(tocs)) {
    const lastData = Math.max(...t.files.map((f, i) => (isData(f) ? i : -1)));
    assert.ok(lastData < t.files.indexOf('EMatrix_Core.lua'), `${name}: data files must precede EMatrix_Core.lua`);
  }
});

test('interface numbers match the family (1.x vanilla, 2.x tbc) and the fallback covers both', () => {
  const v = interfaces(tocs.vanilla), t = interfaces(tocs.tbc), f = interfaces(tocs.fallback);
  assert.ok(v.length && v.every(n => n >= 10000 && n < 20000), `vanilla interfaces ${v}`);
  assert.ok(t.length && t.every(n => n >= 20000 && n < 30000), `tbc interfaces ${t}`);
  for (const n of [...v, ...t]) assert.ok(f.includes(n), `fallback must list interface ${n}`);
});
