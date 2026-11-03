// tools/ematrix-lua.test.mjs
// Runs the real FidelityEMatrix Lua headless (fengari, Lua 5.3) against a WoW API stub, once as a
// client with the table form of SetLight and once with the positional form. The Lua driver is
// tools/ematrix_headless.lua; each of its checks becomes one subtest here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fengari from 'fengari';

const { lua, lauxlib, lualib, to_luastring } = fengari;
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

function runProfile(profile) {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const setGlobal = (name, value) => {
    lua.lua_pushstring(L, to_luastring(value));
    lua.lua_setglobal(L, to_luastring(name));
  };
  setGlobal('PROFILE', profile);
  setGlobal('MATH_SRC', read('FidelityEMatrix/EMatrix_Math.lua'));
  setGlobal('CORE_SRC', read('FidelityEMatrix/EMatrix_Core.lua'));
  const driver = read('tools/ematrix_headless.lua');
  if (lauxlib.luaL_loadbuffer(L, to_luastring(driver), null, to_luastring('@ematrix_headless.lua')) !== lua.LUA_OK) {
    throw new Error(`driver did not compile: ${lua.lua_tojsstring(L, -1)}`);
  }
  if (lua.lua_pcall(L, 0, 1, 0) !== lua.LUA_OK) {
    throw new Error(`driver crashed: ${lua.lua_tojsstring(L, -1)}`);
  }
  return lua.lua_tojsstring(L, -1).split('\n');
}

for (const profile of ['table', 'positional']) {
  const lines = runProfile(profile);
  const done = lines.find(l => l.startsWith('DONE '));
  test(`EMatrix headless (${profile} SetLight): the driver ran to the end`, () => {
    assert.ok(done, `no DONE line; output:\n${lines.join('\n')}`);
  });
  for (const line of lines) {
    const m = /^(PASS|FAIL) ([^:]+)(?::\s*(.*))?$/s.exec(line);
    if (!m) continue;
    test(`EMatrix headless (${profile} SetLight): ${m[2]}`, () => {
      assert.equal(m[1], 'PASS', m[3] || 'failed');
    });
  }
}
