-- tools/ematrix_headless.lua
-- Headless run of the REAL FidelityEMatrix Lua (EMatrix_Math.lua + EMatrix_Core.lua) against a
-- minimal WoW API stub. Driven by tools/test_ematrix_lua.mjs, which passes in:
--   MATH_SRC, CORE_SRC  the two addon files as strings
--   PROFILE             "table" (newer engine: SetLight(enabled, lightTable))
--                       or "positional" (older engine: 13 positional SetLight values)
-- Returns "PASS <name>" / "FAIL <name>: <message>" lines and a final "DONE <pass> <fail>".
-- What this proves: the code paths run without Lua errors and drive the stubbed frames as
-- designed. What it cannot prove: how the client renders them (that needs the game).

local unpack = table.unpack or unpack
_G.unpack = unpack

-- ---------------------------------------------------------------------------
-- WoW API stub
-- ---------------------------------------------------------------------------
local printed = {}
_G.print = function(...)
    local parts = {}
    for i = 1, select("#", ...) do parts[#parts + 1] = tostring(select(i, ...)) end
    printed[#printed + 1] = table.concat(parts, " ")
end

local cursorX, cursorY = 960, 540
local now = 0

local Region = {}
Region.__index = function(t, k)
    local v = Region[k]
    if v ~= nil then return v end
    return function() end -- unknown methods are harmless no-ops
end

local created = {}
local function newRegion(kind, name, parent)
    local r = setmetatable({
        kind = kind, name = name, parent = parent, shown = true, alpha = 1, scripts = {},
        points = {}, w = 0, h = 0, texture = nil, color = nil, texcoord = nil,
        facing = nil, position = nil, light = nil, blend = nil, vertex = nil,
    }, Region)
    if name then _G[name] = r end
    created[#created + 1] = r
    return r
end

function Region:Show() self.shown = true end
function Region:Hide() self.shown = false end
function Region:IsShown() return self.shown end
function Region:SetAlpha(a) self.alpha = a end
function Region:GetAlpha() return self.alpha end
function Region:SetScript(k, f) self.scripts[k] = f end
function Region:GetScript(k) return self.scripts[k] end
function Region:SetSize(w, h) self.w, self.h = w, h end
function Region:SetWidth(w) self.w = w end
function Region:SetHeight(h) self.h = h end
function Region:GetWidth() return self.w end
function Region:GetHeight() return self.h end
function Region:SetPoint(p, rel, rp, x, y) self.points[p] = { rel = rel, rp = rp, x = x or 0, y = y or 0 } end
function Region:ClearAllPoints() self.points = {} end
function Region:SetAllPoints(rel) self.points = { ALL = { rel = rel } } end
function Region:GetEffectiveScale() return 1 end
function Region:GetCenter() return 960, 540 end
function Region:GetLeft() return 720 end
function Region:GetTop() return 684 end
function Region:GetObjectType() return self.kind end
function Region:CreateTexture() return newRegion("Texture", nil, self) end
function Region:SetTexture(p) self.texture = p; self.color = nil end
function Region:SetColorTexture(r, g, b, a) self.color = { r, g, b, a }; self.texture = nil end
function Region:SetTexCoord(...) self.texcoord = { ... } end
function Region:SetBlendMode(m) self.blend = m end
function Region:SetVertexColor(r, g, b) self.vertex = { r, g, b } end
function Region:SetFacing(f) self.facing = f end
function Region:SetPosition(x, y, z) self.position = { x, y, z } end
function Region:SetLight(enabled, a, ...)
    if PROFILE == "table" then
        if type(a) ~= "table" then error("Usage: self:SetLight(enabled, light)") end
        self.light = { form = "table", ambient = a.ambientColor, diffuse = a.diffuseColor }
    else
        if type(a) == "table" then error("bad argument #2 to 'SetLight' (boolean expected)") end
        local v = { ... }
        if #v ~= 11 then error("SetLight expects 13 values, got " .. (#v + 2)) end
        self.light = { form = "positional", ambient = { r = v[5], g = v[6], b = v[7] }, diffuse = { r = v[9], g = v[10], b = v[11] } }
    end
end

_G.UIParent = newRegion("Frame", "UIParent")
_G.CreateFrame = function(kind, name, parent) return newRegion(kind, name, parent) end
_G.GetCursorPosition = function() return cursorX, cursorY end
_G.GetScreenWidth = function() return 1920 end
_G.GetScreenHeight = function() return 1080 end
_G.GetTime = function() return now end
_G.GetBuildInfo = function() return "2.5.6", "70577", "Oct 2026", 20506 end
_G.IsShiftKeyDown = function() return false end
_G.WOW_PROJECT_ID = 5
_G.SlashCmdList = {}

-- Nameplates: a list of fake plates the tests fill in; each is a region with a unit token
local plates = {}
_G.C_NamePlate = {
    GetNamePlates = function() return plates end,
    GetNamePlateForUnit = function(unit) for _, p in ipairs(plates) do if p.namePlateUnitToken == unit then return p end end return nil end,
}
local function addPlate(unit, x, y)
    local p = newRegion("Frame", nil, nil)
    p.namePlateUnitToken = unit
    p.GetCenter = function() return x, y end
    plates[#plates + 1] = p
    return p
end
_G.UnitExists = function(unit) if unit == "player" then return true end for _, p in ipairs(plates) do if p.namePlateUnitToken == unit then return true end end return false end
_G.UnitIsUnit = function(a, b) return a == b end
if PROFILE == "table" then
    _G.CreateVector3D = function(x, y, z) return { x = x, y = y, z = z } end
    _G.CreateColor = function(r, g, b) return { r = r, g = g, b = b } end
end

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------
local pass, fail = 0, 0
local out = {}
local function test(name, fn)
    local ok, err = pcall(fn)
    if ok then pass = pass + 1; out[#out + 1] = "PASS\t" .. name
    else fail = fail + 1; out[#out + 1] = "FAIL\t" .. name .. "\t" .. tostring(err) end
end
local function check(cond, msg) if not cond then error(msg or "check failed", 2) end end
local function near(a, b, eps) return math.abs(a - b) <= (eps or 1e-6) end

-- ---------------------------------------------------------------------------
-- Load the addon exactly as the client would: each file gets (addonName, ns)
-- ---------------------------------------------------------------------------
local ns = {}
local mathChunk = assert(load(MATH_SRC, "@EMatrix_Math.lua"))
local coreChunk = assert(load(CORE_SRC, "@EMatrix_Core.lua"))
local worldChunk = assert(load(WORLD_SRC, "@EMatrix_World.lua"))
mathChunk("FidelityEMatrix", ns)
coreChunk("FidelityEMatrix", ns)
worldChunk("FidelityEMatrix", ns)
local M = ns.Math

-- The anonymous loader frame is the one holding an OnEvent script
local loader
for _, r in ipairs(created) do if r.scripts.OnEvent then loader = r end end

local function step(seconds, dt)
    dt = dt or (1 / 60)
    local master = _G.FidelityEMatrixFrame
    local t = 0
    while t < seconds do
        now = now + dt
        -- the client ticks every shown frame with an OnUpdate: the window first, then the overlay
        local f = master and master:GetScript("OnUpdate")
        if f then f(master, dt) end
        for _, r in ipairs(created) do
            if r ~= master and r.shown and r.scripts.OnUpdate then r.scripts.OnUpdate(r, dt) end
        end
        t = t + dt
    end
end
local function slash(msg) SlashCmdList["FIDELITYEMATRIX"](msg) end
local function lastErrors()
    local errs = {}
    for _, line in ipairs(printed) do if line:find("Fidelity EMatrix Error", 1, true) then errs[#errs + 1] = line end end
    return errs
end

-- Bring the addon up the way the client does: ADDON_LOADED with an older save restored
test("ADDON_LOADED builds the grid closed, with defaults merged into an old save", function()
    check(M and M.ParallaxShift, "EMatrix_Math did not export the new functions")
    check(loader, "no loader frame with an OnEvent script")
    FidelityEMatrix_Config = { scale = 1.0, stereoMode = "off", spinSpeed = 0.5 } -- a v1.1 save
    loader.scripts.OnEvent(loader, "ADDON_LOADED", "FidelityEMatrix")
    check(FidelityEMatrix_Config.lensAlpha == 0.35 and FidelityEMatrix_Config.backdrop == "nebula", "defaults not merged")
    check(_G.FidelityEMatrixFrame, "master frame was not created")
    check(#ns.cells == 135, "expected 135 cells, got " .. #ns.cells)
    for i = 1, 135 do
        local c = ns.cells[i]
        check(c.flapTex.alpha == 1 and c.flapTex.texture:find("Closed"), "cell " .. i .. " not closed at load")
    end
    check(#lastErrors() == 0, table.concat(lastErrors(), " | "))
end)

test("math: parallax keeps the screen plane fixed and splits signs by depth", function()
    check(M.ParallaxShift(0.5, 0) == 0, "z = 0 must not move")
    check(M.ParallaxShift(0.5, 1.0) > 0 and M.ParallaxShift(0.5, 0.5) > 0, "behind the screen moves with the eye")
    check(M.ParallaxShift(0.5, -0.4) < 0, "in front of the screen moves against the eye")
    check(math.abs(M.ParallaxShift(0.5, -0.4)) > math.abs(M.ParallaxShift(0.5, 1.0)), "pop-out moves more than the backplate")
    check(M.ParallaxShift(0 / 0, 1) == 0 and M.ParallaxShift(1, 0 / 0) == 0, "NaN gives 0")
    check(M.ParallaxShift(1, -5) == M.ParallaxShift(1, -0.9), "z clamps before the eye")
    local l, r, t, b = M.BackplateTexCoords(10, -10, 0.86)
    check(l >= 0 and r <= 1 and t >= 0 and b <= 1 and near(r - l, 0.86) and near(b - t, 0.86), "texcoords leave [0,1]")
    local wl, wr = M.WallWidths(1, 0, 30, 0.9, 8, 58)
    check(wl > wr and wl <= 58 and wr >= 8, "walls do not follow the eye")
    local fl, fr = M.StereoFacings(1.0, 0.06)
    check(near(fl - fr, 0.12), "stereo facings must differ by 2 * delta")
    check(M.Approach(0, 1, 2, 0.25) == 0.5 and M.Approach(0.9, 1, 2, 0.25) == 1, "Approach overshoots")
end)

test("camera: projection and pitch solver (world -> screen for the terrain rebuild)", function()
    local px, py, pz, facing, zoom, fov = 1000, -500, 50, 0.7, 10, 1.0
    local cam = M.BuildCamera(px, py, pz, facing, zoom, 0.35, fov, 1920, 1080)
    check(cam, "camera not built")
    -- the look-at point (the head) sits at the screen centre
    local sx, sy, d = M.ProjectPoint(cam, px, py, pz + 2.0)
    check(near(sx, 960, 1e-6) and near(sy, 540, 1e-6) and near(d, zoom, 1e-6), string.format("head at %.1f,%.1f d=%.2f", sx, sy, d))
    -- a point 20 yd ahead along the facing, on the ground: further, higher on screen than the feet, smaller
    local ax, ay = px + 20 * math.cos(facing), py + 20 * math.sin(facing)
    local fsx, fsy, fd = M.ProjectPoint(cam, px, py, pz)
    local asx, asy, ad = M.ProjectPoint(cam, ax, ay, pz)
    check(ad > fd and asy > fsy, "a ground point ahead must be deeper and higher on screen than the feet")
    check(near(asx, 960, 1e-6), "a point straight ahead stays on the centre line")
    -- a point to the player's right (world: facing rotated clockwise) lands right of centre
    local rx, ry = px + 5 * math.sin(facing), py - 5 * math.cos(facing)
    local rsx = M.ProjectPoint(cam, rx, ry, pz + 2)
    check(rsx > 960, "a point to the right must project right of centre")
    -- behind the camera: nil
    local bx, by = px - 30 * math.cos(facing), py - 30 * math.sin(facing)
    check(M.ProjectPoint(cam, bx, by, pz) == nil, "a point behind the camera must not project")
    -- the solver recovers a known pitch from the plate height it produces
    for _, truePitch in ipairs({ 0.1, 0.35, 0.8 }) do
        local c = M.BuildCamera(px, py, pz, facing, zoom, truePitch, fov, 1920, 1080)
        local _, plateY = M.ProjectPoint(c, px, py, pz + 2.6)
        local got = M.SolvePitch(px, py, pz, facing, zoom, fov, 1920, 1080, plateY)
        check(got and near(got, truePitch, 1e-4), string.format("pitch %.2f solved as %s", truePitch, tostring(got)))
    end
    check(M.SolvePitch(px, py, pz, facing, zoom, fov, 1920, 1080, 0 / 0) == nil, "NaN plate height must give nil")
    check(M.BuildCamera(0 / 0, 0, 0, 0, 10, 0.3, 1, 1920, 1080) == nil, "NaN position must give nil")
    check(near(M.DepthFromDistance(zoom, zoom), 0.15) and near(M.DepthFromDistance(4 * zoom, zoom), 1.0), "DepthFromDistance anchors")
end)

test("light form matches the client profile", function()
    local st = ns.State()
    check(ns.DiagTable.lightForm == PROFILE, "lightForm " .. tostring(ns.DiagTable.lightForm) .. " for profile " .. PROFILE)
    check(st.frames.main.light and st.frames.main.light.form == PROFILE, "main model has no light of form " .. PROFILE)
end)

test("opening leaves the microlens array visible at lensAlpha", function()
    slash("ripple 8 5")
    step(3.0)
    local st = ns.State()
    check(st.open and not st.waveActive, "wave did not finish opening")
    for i = 1, 135 do
        local c = ns.cells[i]
        check(c.flapTex.texture:find("Window") and near(c.flapTex.alpha, 0.35), "cell " .. i .. " alpha " .. c.flapTex.alpha .. " (want lens 0.35)")
        check(c.creviceTex.alpha == 0 and c.specBar.alpha == 0, "cell " .. i .. " left a crevice or glint")
    end
    check(near(st.openAmount, 1), "openAmount " .. st.openAmount)
    for _, w in ipairs(st.walls) do check(w.shown and near(w.alpha, 1), "a wall is not shown when open") end
    check(st.reticle.mono.shown and st.sheen.shown and st.sheen.blend == "ADD", "glass and reticle not shown")
end)

test("cursor right: each plane moves the physically correct way", function()
    cursorX, cursorY = 1440, 540 -- right of centre
    step(1.5)
    local st = ns.State()
    check(st.eyeX > 0.2, "eye did not follow the cursor: " .. st.eyeX)
    local tc = st.backplate.texcoord
    local nl = M.BackplateTexCoords(0, 0, 0.86)
    check(tc and tc[1] < nl, "backplate window should slide left so the image moves right")
    check(st.frames.main.position[1] == 0, "subject must not move in depth (x)")
    check(st.frames.main.position[2] > 0, "subject should slide right (model +y)")
    check(st.walls[1].w > st.walls[2].w, "left wall should widen when the eye moves right")
    check(st.reticle.mono.points.CENTER.x < 0, "pop-out reticle should move left (against the eye)")
    check(st.sheen.points.CENTER.x < 0 and st.sheen.points.CENTER.x > st.reticle.mono.points.CENTER.x, "glass moves against the eye, less than the reticle")
    check(near(st.frames.main.facing, st.facing - st.eyeX * 0.55, 1e-9), "subject turn is not view-dependent")
end)

test("cursor up: the floor widens and the subject rises", function()
    cursorX, cursorY = 960, 900
    step(1.5)
    local st = ns.State()
    check(st.eyeY > 0.1, "eyeY " .. st.eyeY)
    check(st.walls[4].h > st.walls[3].h, "bottom wall should be wider than the top when the eye is up")
    check(st.frames.main.position[3] > 0, "subject should rise")
    cursorX, cursorY = 960, 540
    step(1.5)
end)

test("sbs and cross: two eyes, real turn disparity, black field, no shared planes", function()
    slash("stereo sbs")
    step(0.2)
    local st = ns.State()
    check(not st.frames.main.shown and st.frames.left.shown and st.frames.right.shown, "eye frames not shown")
    check(near(st.frames.left.facing - st.frames.right.facing, 0.12, 1e-9), "eye facings differ by " .. (st.frames.left.facing - st.frames.right.facing))
    check(st.frames.left.points.LEFT and st.frames.right.points.RIGHT, "parallel: left eye must be on the left")
    check(st.backplate.color and st.backplate.color[1] == 0, "stereo needs a black field")
    for _, w in ipairs(st.walls) do check(not w.shown, "walls must hide in split stereo") end
    check(not st.reticle.mono.shown and not st.sheen.shown, "front planes must hide in split stereo")
    slash("stereo cross")
    st = ns.State()
    check(st.frames.left.points.RIGHT and st.frames.right.points.LEFT, "cross: the halves must swap")
end)

test("anaglyph: red left behind cyan right, crossed reticle pops out", function()
    slash("stereo anaglyph")
    step(0.2)
    local st = ns.State()
    local la, ra = st.frames.left.light, st.frames.right.light
    check(la and la.ambient.r == 1 and la.ambient.g == 0 and la.ambient.b == 0, "left eye light is not pure red")
    check(ra and ra.ambient.r == 0 and ra.ambient.g == 1 and ra.ambient.b == 1, "right eye light is not pure cyan")
    check(st.frames.left.points.CENTER.x < st.frames.right.points.CENTER.x, "subject needs uncrossed (behind-screen) offset")
    check(near(st.frames.right.alpha, 0.5), "cyan mix")
    check(st.reticle.left.shown and st.reticle.right.shown and not st.reticle.mono.shown, "reticle pair not shown")
    check(st.reticle.left.points.CENTER.x > st.reticle.right.points.CENTER.x, "reticle needs crossed (in-front) disparity")
    check(st.reticle.right.blend == "ADD", "cyan reticle must add over the red one")
    slash("stereo off")
    step(0.2)
    st = ns.State()
    check(st.frames.main.shown and not st.frames.left.shown, "stereo off did not restore mono")
    check(st.frames.main.light.ambient.r < 1 or st.frames.main.light.ambient.g > 0, "mono light not restored")
end)

test("lens 0 restores the seamless window; backdrop world shows the game through", function()
    slash("lens 0")
    for i = 1, 135 do check(ns.cells[i].flapTex.alpha == 0, "cell " .. i .. " still visible at lens 0") end
    slash("lens 0.35")
    slash("backdrop world")
    local st = ns.State()
    check(not st.backplate.shown, "backplate still shown in world mode")
    slash("backdrop nebula")
    st = ns.State()
    check(st.backplate.shown and st.backplate.texture and st.backplate.texture:find("Nebula"), "nebula not restored")
end)

test("closing returns the E-wall and hides the depth planes", function()
    slash("ripple 1 1")
    step(3.0)
    local st = ns.State()
    check(not st.open and near(st.openAmount, 0), "did not close")
    for i = 1, 135 do check(ns.cells[i].flapTex.alpha == 1 and ns.cells[i].flapTex.texture:find("Closed"), "cell " .. i .. " not closed") end
    for _, w in ipairs(st.walls) do check(not w.shown, "wall shown while closed") end
    check(not st.reticle.mono.shown and not st.sheen.shown, "front planes shown while closed")
end)

test("idle detaches OnUpdate (0 CPU)", function()
    slash("spin 0")
    slash("parallax 0")
    step(1.0)
    check(_G.FidelityEMatrixFrame:GetScript("OnUpdate") == nil, "OnUpdate still attached when idle")
    slash("spin 0.5")
    check(_G.FidelityEMatrixFrame:GetScript("OnUpdate") ~= nil, "spin did not re-attach OnUpdate")
end)

test("world overlay: nameplate units become depth-sorted actors, nearest biggest", function()
    check(ns.World, "EMatrix_World did not export ns.World")
    addPlate("nameplate1", 1200, 600) -- mid distance
    addPlate("nameplate2", 400, 760)  -- near the horizon: far
    addPlate("nameplate3", 700, 450)  -- close (near the player's own height, 432)
    check(M.DepthFromScreenY(432, 432, 777) == 0.15, "player's own height must be the nearest depth")
    check(M.DepthFromScreenY(777, 432, 777) == 2.0, "horizon must be the deepest")
    check(M.DepthFromScreenY(0 / 0, 432, 777) == 0.5, "NaN must give the reference depth")
    slash("parallax 0.5") -- the idle test above left it at 0
    slash("world on")
    step(0.3)
    check(ns.World.IsEnabled(), "overlay did not enable")
    check(ns.World.ActorCount() == 4, "expected 4 actors (player + 3 plates), got " .. ns.World.ActorCount())
    local pool = ns.World._pool
    check(pool[1].unit == "player", "slot 1 must be the player (nearest), got " .. tostring(pool[1].unit))
    check(pool[2].unit == "nameplate3" and pool[3].unit == "nameplate1" and pool[4].unit == "nameplate2",
        "actors not sorted near to far: " .. tostring(pool[2].unit) .. "," .. tostring(pool[3].unit) .. "," .. tostring(pool[4].unit))
    check(pool[1].h > pool[2].h and pool[2].h > pool[3].h and pool[3].h > pool[4].h, "nearer actors must be drawn taller")
    check(pool[4].mono.shown and not pool[4].left.shown, "mono mode must show the mono model only")
    check(FidelityEMatrix_Config.worldOverlay == true, "overlay state not saved")
end)

test("world overlay: parallax grows with depth and the anaglyph pair spreads with depth", function()
    cursorX, cursorY = 1440, 540
    step(1.5)
    local pool = ns.World._pool
    local nearX = pool[1].mono.points.TOP.x - pool[1].x
    local farX = pool[4].mono.points.TOP.x - pool[4].x
    check(nearX > 0 and farX > nearX, string.format("far actors must move more with the eye (near %.1f, far %.1f)", nearX, farX))
    slash("stereo anaglyph")
    step(0.3)
    check(not pool[1].mono.shown and pool[1].left.shown and pool[1].right.shown, "anaglyph must show the pair")
    local nearPair = pool[1].right.points.TOP.x - pool[1].left.points.TOP.x
    local farPair = pool[4].right.points.TOP.x - pool[4].left.points.TOP.x
    check(nearPair > 0 and farPair > nearPair, string.format("deeper actors need a wider uncrossed pair (near %.1f, far %.1f)", nearPair, farPair))
    check(near(pool[1].left.facing - pool[1].right.facing, 0.12, 1e-9), "pair facings must differ by 2 * delta")
    check(pool[1].left.light.ambient.r == 1 and pool[1].right.light.ambient.b == 1, "pair must be lit red / cyan")
    slash("stereo off")
    cursorX, cursorY = 960, 540
    step(1.0)
end)

test("world overlay: a plate that leaves releases its slot; off hides everything and idles", function()
    table.remove(plates, 1) -- nameplate1 gone
    step(0.3)
    check(ns.World.ActorCount() == 3, "expected 3 actors after a plate left, got " .. ns.World.ActorCount())
    slash("world off")
    slash("spin 0")
    slash("parallax 0")
    step(1.0)
    check(not ns.World.IsEnabled() and ns.World.ActorCount() == 0, "overlay still has actors when off")
    for i = 1, #ns.World._pool do
        local s = ns.World._pool[i]
        check(not s.mono.shown and not s.left.shown and not s.right.shown, "a model is still shown with the overlay off")
    end
    check(_G.FidelityEMatrixFrame:GetScript("OnUpdate") == nil, "OnUpdate must detach once the overlay is off and nothing moves")
    slash("spin 0.5")
    slash("parallax 0.5")
    for i = #plates, 1, -1 do plates[i] = nil end
end)

test("every slash command runs without an addon error", function()
    printed = {}
    for _, cmd in ipairs({ "help", "diag", "status", "scene target", "scene player", "spin 1", "parallax 0.5",
        "lens 0.4", "backdrop black", "backdrop nebula", "stereo", "stereo", "stereo", "stereo",
        "stereo delta 0.08", "stereo pixels 6", "stereo mix 0.6", "stereo off", "calibrate", "calibrate side",
        "calibrate side", "calibrate turn", "calibrate turn", "scale 1.2", "scale 1", "toggle", "toggle",
        "world", "world status", "world off", "world bogus", "bogus" }) do
        slash(cmd)
        step(0.05)
    end
    check(#lastErrors() == 0, table.concat(lastErrors(), " | "))
end)

out[#out + 1] = string.format("DONE %d %d", pass, fail)
return table.concat(out, "\n")
