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
-- Strict widget surface (council O1 attack 8, O3 attacks 1 to 3, 04 Nov 2026). A method the stub
-- does not model must be listed here as KNOWN (the client has it; a harmless no-op here) or
-- ABSENT (the owner's Classic client lacks it, per /fide diag, or only a ModelScene has it; nil
-- here, so the addon takes the path the client takes). Any other CamelCase name raises, so a
-- misspelled or invented API call fails the tests instead of passing as a no-op. Lower-case and
-- "__" names are data fields and read as nil, as on any table.
local KNOWN = {}
for name in ([[
    EnableMouse SetFrameStrata GetFrameStrata SetClampedToScreen SetMovable RegisterForDrag StartMoving StopMovingOrSizing
    RegisterEvent UnregisterEvent SetScale GetScale SetModelScale SetCamera SetAnimation SetSequence SetUnit SetModel SetLight
    SetFacing SetPosition SetCamDistanceScale SetPortraitZoom SetCameraPosition SetParent GetParent SetAlpha GetAlpha
    Show Hide IsShown SetScript GetScript SetSize SetWidth SetHeight GetWidth GetHeight SetPoint ClearAllPoints SetAllPoints
    GetEffectiveScale GetCenter GetLeft GetTop GetObjectType CreateTexture SetTexture SetColorTexture SetTexCoord SetBlendMode
    SetVertexColor SetFrameLevel GetFrameLevel GetModelFileID IsVisible GetName SetModelByUnit
    CreateFontString SetText GetText SetJustifyH SetTextColor SetFontObject RegisterForClicks SetNormalFontObject
    SetNormalTexture SetHighlightTexture SetPushedTexture GetFontString
]]):gmatch("%S+") do KNOWN[name] = true end
local ABSENT = {}
for name in ("SetDefaultModelPosition GetActiveCamera CreateActor AddCamera SetActiveCamera SetTarget SetYaw SetZoomDistance SetRotation UnitFrame"):gmatch("%S+") do ABSENT[name] = true end
Region.__index = function(t, k)
    local v = Region[k]
    if v ~= nil then return v end
    if ABSENT[k] then return nil end
    if KNOWN[k] then return function() end end
    if type(k) == "string" and k:match("^[A-Z]") then
        error("unknown widget method '" .. k .. "': the stub allows only methods the client has (add it to KNOWN or ABSENT in tools/ematrix_headless.lua)", 2)
    end
    return nil
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
function Region:SetPoint(p, rel, rp, x, y)
    self.setPointCalls = (rawget(self, "setPointCalls") or 0) + 1 -- the anchor-churn test counts these
    self.points[p] = { rel = rel, rp = rp, x = x or 0, y = y or 0 }
end
function Region:SetFrameLevel(l) self.level = l end
function Region:GetFrameLevel() return rawget(self, "level") end
function Region:SetParent(p) self.parent = p end
function Region:GetParent() return rawget(self, "parent") end
function Region:ClearAllPoints() self.points = {} end
function Region:SetAllPoints(rel) self.points = { ALL = { rel = rel } } end
function Region:GetEffectiveScale() return 1 end
function Region:GetCenter() return 960, 540 end
function Region:GetLeft() return 720 end
function Region:GetTop() return 684 end
function Region:GetObjectType() return self.kind end
function Region:CreateTexture() return newRegion("Texture", nil, self) end
function Region:CreateFontString() return newRegion("FontString", nil, self) end
function Region:SetText(s) self.text = s end
function Region:GetText() return rawget(self, "text") end
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
_G.date = os.date
local screenshots, reloads = 0, 0
_G.Screenshot = function() screenshots = screenshots + 1 end
_G.ReloadUI = function() reloads = reloads + 1 end
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
-- Nameplates are restricted regions in the client: measuring them throws. The stub does the
-- same, so any code path that measures a plate fails the tests. The third argument is the
-- unit's distance in yards, for CheckInteractDistance.
local plateDistance = {}
local function addPlate(unit, x, y, distance)
    local p = newRegion("Frame", nil, nil)
    p.namePlateUnitToken = unit
    local refuse = function() error("NamePlate1:GetCenter(): Action[FrameMeasurement] failed because[Can't measure restricted regions]") end
    p.GetCenter, p.GetLeft, p.GetRight, p.GetTop, p.GetBottom, p.GetRect, p.GetWidth, p.GetHeight, p.GetSize = refuse, refuse, refuse, refuse, refuse, refuse, refuse, refuse, refuse
    plateDistance[unit] = distance or 15
    plates[#plates + 1] = p
    return p
end
-- Out of range, newer clients answer false and older ones nil; the tests use both.
local interactNil = false
_G.CheckInteractDistance = function(unit, index)
    local d = plateDistance[unit]
    if not d then return nil end
    local within
    if index == 3 then within = d <= 9.9 elseif index == 4 then within = d <= 28 else return nil end
    if not within and interactNil then return nil end
    return within
end
_G.UnitExists = function(unit) if unit == "player" then return true end for _, p in ipairs(plates) do if p.namePlateUnitToken == unit then return true end end return false end
_G.UnitIsUnit = function(a, b) return a == b end
-- SetUnit succeeds unless the test lists the unit here (a copy that cannot take its unit)
local failUnits = {}
function Region:SetUnit(unit)
    if failUnits[unit] then error("SetUnit refused for " .. tostring(unit)) end
    self.unit = unit
end

-- A gamepad the tests can drive (the head tracker's virtual pad): nil until plugged in
local padState = nil
_G.C_GamePad = {
    GetActiveDeviceID = function() return padState and 1 or nil end,
    GetDeviceMappedState = function(id) return padState end,
}
local function plugPad(rx, ry, lt)
    padState = { name = "Virtual Xbox pad", sticks = { { x = 0, y = 0, len = 0 }, { x = rx, y = ry, len = math.sqrt(rx * rx + ry * ry) } }, axes = { 0, 0, rx, ry, lt or 0, 0 } }
end

-- Player world state for the terrain overlay. UnitPosition returns the north-south coordinate
-- (the map data's x) FIRST, then the west-east one: measured by the owner's probe on 04 Nov 2026
-- (the stub used to return them the other way round, copying the code's wrong belief).
local playerPos = { x = -8897.0, y = -178.3, instance = 0 } -- at the Northshire Abbey door
local playerFacing, cameraZoom = 0.0, 10.0
_G.UnitPosition = function(unit) if unit == "player" then return playerPos.x, playerPos.y, 0, playerPos.instance end return nil end
_G.GetPlayerFacing = function() return playerFacing end
_G.GetCameraZoom = function() return cameraZoom end
function Region:SetModel(asset) if asset == nil then error("Usage: SetModel(asset)") end self.model = asset end
-- A model "loads" (GetModelFileID answers) for any path unless a substring of it is listed in
-- failModels: the client's silent SetModel success without a load.
local failModels = {}
function Region:GetModelFileID()
    if type(self.model) ~= "string" then return nil end
    for pat in pairs(failModels) do if self.model:find(pat, 1, true) then return nil end end
    return 424242
end
function Region:SetAnimation(a) self.animation = a end
function Region:SetModelScale(s) self.modelScale = s end
function Region:SetCamera(c) self.camera = c; self.setCameraCalls = (rawget(self, "setCameraCalls") or 0) + 1 end
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
local terrainChunk = assert(load(TERRAIN_SRC, "@EMatrix_Terrain.lua"))
local reportChunk = assert(load(REPORT_SRC, "@EMatrix_Report.lua"))
mathChunk("FidelityEMatrix", ns)
-- A small synthetic tile stands in for the generated EMatrix_Data: flat ground at z = 80 over
-- Northshire's tile (azeroth:32:48), one tree 20 yd north of the abbey door, one bush 5 yd
-- east, one tree 150 yd away (outside the draw radius), and the abbey as a WMO 28 yd to the
-- west (inside the radius, but beside the player, so off-screen when facing north).
do
    local heights = {}
    for i = 1, 129 * 129 do heights[i] = 800 end
    local vanillaHeights = {}
    for i = 1, 129 * 129 do vanillaHeights[i] = 900 end
    EMatrix_Data = {
        builds = { tbc = { build = "2.5.6.70577", product = "wow_anniversary" }, vanilla = { build = "1.60.1.70753", product = "wowf" } },
        vanilla = {
            ["azeroth:32:48"] = { map = "azeroth", col = 32, row = 48, originX = -8533.333, originY = 0.0, unit = 4.16667, heights = vanillaHeights, doodads = {}, wmos = {} },
        },
        tbc = {
        ["azeroth:32:48"] = {
            map = "azeroth", col = 32, row = 48, originX = -8533.333, originY = 0.0, unit = 4.16667, heights = heights,
            doodads = {
                { 189929, "world/azeroth/elwynn/passivedoodads/trees/elwynntreecanopy03.m2", -8877.0, -178.3, 80.0, 0.0, 1.0 },
                { 0, "world/azeroth/elwynn/passivedoodads/bush/elwynnbush09.m2", -8897.0, -183.3, 80.0, 90.0, 1.0 },
                { 189929, "world/azeroth/elwynn/passivedoodads/trees/elwynntreemid01.m2", -8747.0, -178.3, 80.0, 0.0, 1.0 },
            },
            wmos = { { 0, "world/wmo/azeroth/buildings/nsabbey/nsabbey.wmo", -8897.0, -150.0, 80.1, 0.0, 1.0 } },
        },
        },
    }
end
coreChunk("FidelityEMatrix", ns)
worldChunk("FidelityEMatrix", ns)
terrainChunk("FidelityEMatrix", ns)
reportChunk("FidelityEMatrix", ns)
local M = ns.Math

-- The anonymous loader frame is the one holding an OnEvent script
local loader
for _, r in ipairs(created) do if r.scripts.OnEvent then loader = r end end

local function step(seconds, dt)
    dt = dt or (1 / 60)
    local master = _G.FidelityEMatrixDriver or _G.FidelityEMatrixFrame
    local t = 0
    while t < seconds do
        now = now + dt
        -- the client ticks every shown frame with an OnUpdate: the driver first, then the overlays
        local f = master and master.shown and master:GetScript("OnUpdate")
        if f then f(master, dt) end
        for _, r in ipairs(created) do
            if r ~= master and r.shown and r.scripts.OnUpdate then r.scripts.OnUpdate(r, dt) end
        end
        t = t + dt
    end
end
local function slash(msg) SlashCmdList["FIDELITYEMATRIX"](msg) end
-- Runs single frames until the world overlay has scanned once more (deterministic band tests)
local function stepUntilWorldRefresh()
    local before = ns.World._refreshCount()
    local n = 0
    while ns.World._refreshCount() == before and n < 120 do step(1 / 60); n = n + 1 end
    check(ns.World._refreshCount() == before + 1, "expected exactly one world refresh")
end
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
    -- the login line reports what came up, from runtime state, with the data counts
    local login = printed[#printed] or ""
    check(login:find("world overlay |cff00ff00ON|r", 1, true) and login:find("terrain overlay |cff00ff00ON|r", 1, true), "login line must report the overlays' real state: " .. login)
    check(login:find("1 tile(s), 3 placements, 1 buildings", 1, true), "login line must count the map data: " .. login)
    check(login:find("eye hand:cursor (no head measured)", 1, true), "login line must name the hand as the eye when no head is measured: " .. login)
    check(FidelityEMatrix_Config.lensAlpha == 0.35 and FidelityEMatrix_Config.backdrop == "nebula", "defaults not merged")
    -- v1.5: an old save is migrated to the full-screen scene: overlays on, box hidden, driver running
    check(FidelityEMatrix_Config.worldOverlay == true and FidelityEMatrix_Config.terrainOverlay == true and FidelityEMatrix_Config.boxHidden == true, "v1.5 defaults not applied to the old save")
    check(ns.World.IsEnabled() and ns.Terrain.IsEnabled(), "overlays must be on at load")
    check(not _G.FidelityEMatrixFrame.shown, "the box must start hidden")
    check(_G.FidelityEMatrixDriver and _G.FidelityEMatrixDriver.shown and _G.FidelityEMatrixDriver:GetScript("OnUpdate"), "the driver frame must be shown with OnUpdate attached while overlays run")
    slash("overlay off") -- the window tests below need the box
    check(_G.FidelityEMatrixFrame.shown, "overlay off must show the box")
    check(_G.FidelityEMatrixFrame, "master frame was not created")
    check(#ns.cells == 135, "expected 135 cells, got " .. #ns.cells)
    for i = 1, 135 do
        local c = ns.cells[i]
        check(c.flapTex.alpha == 1 and c.flapTex.texture:find("Closed"), "cell " .. i .. " not closed at load")
    end
    check(#lastErrors() == 0, table.concat(lastErrors(), " | "))
end)

test("cell rotations: balanced, no diagonal lattice, no uniform 2x2 block (the old hash was (c - r) mod 4 in disguise)", function()
    local counts, at = { [0] = 0, 0, 0, 0 }, {}
    for r = 1, 9 do
        for c = 1, 15 do
            local h, uv = M.GetCellRotation(c, r)
            check(h == math.floor(h) and h >= 0 and h <= 3 and uv == M.ROT_UV8[h], "rotation " .. tostring(h) .. " at " .. c .. "," .. r)
            counts[h] = counts[h] + 1
            at[c .. "," .. r] = h
        end
    end
    for h = 0, 3 do check(counts[h] >= 20, "orientation " .. h .. " appears " .. counts[h] .. " times") end
    for a = 0, 3 do for b = 0, 3 do for k = 0, 3 do
        local fits = true
        for r = 1, 9 do for c = 1, 15 do if (a * c + b * r + k) % 4 ~= at[c .. "," .. r] then fits = false end end end
        check(not fits, string.format("rotations follow (%dc + %dr + %d) mod 4: a lattice", a, b, k))
    end end end
    for r = 1, 8 do for c = 1, 14 do
        local h = at[c .. "," .. r]
        check(not (at[(c + 1) .. "," .. r] == h and at[c .. "," .. (r + 1)] == h and at[(c + 1) .. "," .. (r + 1)] == h), "uniform 2x2 block at " .. c .. "," .. r)
    end end
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
    -- a cell's flip lasts flipDuration SECONDS after the front reaches it (council B2: the old form gave 16 ms)
    check(M.CalculateFlipProgress(0.13, 16, 0, 0.26) > 0.49 and M.CalculateFlipProgress(0.13, 16, 0, 0.26) < 0.51, "centre cell half way at 0.13 s")
    check(M.CalculateFlipProgress(0.26, 16, 0, 0.26) == 1, "centre cell done at 0.26 s")
    check(M.CalculateFlipProgress(0.5, 16, 8, 0.26) == 0 and M.CalculateFlipProgress(0.5 + 0.26, 16, 8, 0.26) == 1, "ring 8 starts at 0.5 s and ends 0.26 s later")
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
        -- the lens is never rotated: one sun over the whole array (its lit rim stays upper right)
        local tc = c.flapTex.texcoord
        check(tc and #tc == 4 and tc[1] == 0 and tc[2] == 1 and tc[3] == 0 and tc[4] == 1, "lens cell " .. i .. " must use identity texcoords, got " .. table.concat(tc or {}, ","))
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
    for i = 1, 135 do
        local c = ns.cells[i]
        check(c.flapTex.alpha == 1 and c.flapTex.texture:find("Closed"), "cell " .. i .. " not closed")
        -- the E comes back in the cell's own orientation (its 8-coordinate table)
        local tc = c.flapTex.texcoord
        check(tc and #tc == 8, "closed cell " .. i .. " must use its 8-coordinate rotation, got " .. #(tc or {}))
        for k = 1, 8 do check(tc[k] == c.uv8[k], "closed cell " .. i .. " coordinate " .. k .. " differs from its rotation table") end
    end
    for _, w in ipairs(st.walls) do check(not w.shown, "wall shown while closed") end
    check(not st.reticle.mono.shown and not st.sheen.shown, "front planes shown while closed")
end)

test("idle detaches OnUpdate (0 CPU)", function()
    slash("spin 0")
    slash("parallax 0")
    step(1.0)
    check(_G.FidelityEMatrixDriver:GetScript("OnUpdate") == nil, "OnUpdate still attached when idle")
    slash("spin 0.5")
    check(_G.FidelityEMatrixDriver:GetScript("OnUpdate") ~= nil, "spin did not re-attach OnUpdate")
end)

test("world overlay: nameplate units become actors anchored to their plates, depth from range bands, never measured", function()
    check(ns.World, "EMatrix_World did not export ns.World")
    local p1 = addPlate("nameplate1", 1200, 600, 15) -- mid band
    local p2 = addPlate("nameplate2", 400, 760, 40)  -- far
    local p3 = addPlate("nameplate3", 700, 450, 5)   -- near
    check(M.DepthFromScreenY(432, 432, 777) == 0.15, "DepthFromScreenY still works for callers that have a measurable y")
    check(ns.World.RangeBand("nameplate3") == "near" and ns.World.RangeBand("nameplate1") == "mid" and ns.World.RangeBand("nameplate2") == "far", "range bands from CheckInteractDistance")
    slash("parallax 0.5") -- the idle test above left it at 0
    slash("world on")
    step(0.6)
    check(ns.World.IsEnabled(), "overlay did not enable")
    check(ns.World.errors.count == 0, "the overlay must not touch restricted plate measurements: " .. tostring(ns.World.errors.last))
    check(ns.World.ActorCount() == 4, "expected 4 actors (player + 3 plates), got " .. ns.World.ActorCount())
    local pool = ns.World._pool
    check(pool[1].unit == "player", "slot 1 must be the player, got " .. tostring(pool[1].unit))
    check(pool[2].unit == "nameplate3" and pool[3].unit == "nameplate1" and pool[4].unit == "nameplate2",
        "actors not sorted near to far: " .. tostring(pool[2].unit) .. "," .. tostring(pool[3].unit) .. "," .. tostring(pool[4].unit))
    check(pool[2].h > pool[3].h and pool[3].h > pool[4].h, "nearer actors must be drawn taller")
    check(pool[3].mono.points.TOP and pool[3].mono.points.TOP.rel == p1, "an actor must be anchored to its unit's nameplate")
    check(pool[1].mono.points.BOTTOM and pool[1].mono.points.BOTTOM.rel == _G.UIParent, "the player copy is anchored to the screen")
    check(pool[4].mono.shown and not pool[4].left.shown, "mono mode must show the mono model only")
    check(FidelityEMatrix_Config.worldOverlay == true, "overlay state not saved")
end)

test("world overlay: parallax grows with depth and the anaglyph pair spreads with depth", function()
    cursorX, cursorY = 1440, 540
    step(1.5)
    local pool = ns.World._pool
    local nearX = pool[2].mono.points.TOP.x -- the anchor offset IS the parallax shift
    local farX = pool[4].mono.points.TOP.x
    check(nearX > 0 and farX > nearX, string.format("far actors must move more with the eye (near %.1f, far %.1f)", nearX, farX))
    slash("stereo anaglyph")
    step(0.3)
    check(not pool[2].mono.shown and pool[2].left.shown and pool[2].right.shown, "anaglyph must show the pair")
    local nearPair = pool[2].right.points.TOP.x - pool[2].left.points.TOP.x
    local farPair = pool[4].right.points.TOP.x - pool[4].left.points.TOP.x
    check(nearPair > 0 and farPair > nearPair, string.format("deeper actors need a wider uncrossed pair (near %.1f, far %.1f)", nearPair, farPair))
    check(near(pool[2].left.facing - pool[2].right.facing, 0.12, 1e-9), "pair facings must differ by 2 * delta")
    check(pool[2].left.light.ambient.r == 1 and pool[2].right.light.ambient.b == 1, "pair must be lit red / cyan")
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
    check(_G.FidelityEMatrixDriver:GetScript("OnUpdate") == nil, "OnUpdate must detach once the overlay is off and nothing moves")
    slash("spin 0.5")
    slash("parallax 0.5")
    for i = #plates, 1, -1 do plates[i] = nil end
end)

test("world overlay: copies never spin with the window, nil range answers mean far, bands have hysteresis, slots are stable, failures hide, errors suspend without touching the save", function()
    addPlate("nameplate1", 1200, 600, 15) -- mid
    addPlate("nameplate2", 400, 760, 40)  -- far
    interactNil = true -- older clients answer nil, not false, when out of range
    check(ns.World.RangeBand("nameplate2") == "far", "out of range must be 'far' when CheckInteractDistance answers nil, got " .. ns.World.RangeBand("nameplate2"))
    interactNil = false
    check(ns.World.CenterInUI == nil, "CenterInUI is gone: nameplates cannot be measured, nothing may try")
    cursorX, cursorY = 960, 540
    slash("world on")
    step(0.6)
    local pool = ns.World._pool
    check(ns.World.ActorCount() == 3, "expected 3 actors, got " .. ns.World.ActorCount())
    -- the window's turntable spins (spin 0.5) but the copies must not: they face the camera and turn with the eye only
    local f0 = pool[2].mono.facing
    local windowFacing = ns.State().facing
    step(1.0)
    check(pool[2].mono.facing == f0, "a copy must not spin with the window's turntable")
    check(near(f0, 0, 1e-6), "with the eye centred a copy faces the camera, got " .. tostring(f0))
    check(ns.State().facing ~= windowFacing, "the window itself still spins")
    -- anchor churn: with the eye still, no SetPoint calls across idle frames
    local calls = pool[2].mono.setPointCalls
    step(0.5)
    check(pool[2].mono.setPointCalls == calls, "anchors must not be re-set every frame while nothing changed")
    cursorX = 1440
    step(0.5)
    check(pool[2].mono.setPointCalls > calls, "a moving eye must re-anchor")
    cursorX = 960
    step(0.5)
    -- hysteresis: nameplate1 steps from mid (15 yd) to near (9 yd); one scan keeps mid, the second switches
    local slot
    for i = 1, #pool do if pool[i].unit == "nameplate1" then slot = pool[i] end end
    check(slot and slot.band == "mid", "nameplate1 starts in the mid band")
    plateDistance["nameplate1"] = 9
    stepUntilWorldRefresh()
    check(slot.band == "mid", "a band change must not apply on the first scan it is seen")
    stepUntilWorldRefresh()
    local focal, zoom = ns.World.CameraScale()
    check(slot.band == "near" and near(slot.h, focal * 1.8 / (zoom + 7), 1e-6), "a band change seen twice must apply, got " .. tostring(slot.band) .. " " .. tostring(slot.h))
    check(slot.unit == "nameplate1" and slot.used, "a unit keeps its slot across a band change (no SetUnit churn)")
    -- a copy that cannot take its unit is hidden and holds no slot; it is not an overlay error
    failUnits["nameplate9"] = true
    addPlate("nameplate9", 500, 500, 5)
    step(0.3)
    for i = 1, #pool do check(pool[i].unit ~= "nameplate9", "a unit whose SetUnit failed must not hold a slot") end
    check(ns.World.errors.count == 0, "a SetUnit failure is not an overlay error")
    failUnits["nameplate9"] = nil
    -- error stop: repeated errors suspend the overlay WITHOUT writing the saved choice
    local savedScan = C_NamePlate.GetNamePlates
    C_NamePlate.GetNamePlates = function() error("boom") end
    step(1.5)
    C_NamePlate.GetNamePlates = savedScan
    check(not ns.World.IsEnabled() and ns.World.IsSuspended(), "the overlay must suspend after repeated errors")
    check(FidelityEMatrix_Config.worldOverlay == true, "suspending must not write the saved choice")
    for i = 1, #pool do check(not pool[i].mono.shown and not pool[i].left.shown, "suspending must hide every copy") end
    printed = {}
    slash("world status")
    check(printed[1] and printed[1]:find("SUSPENDED", 1, true), "status must say suspended")
    slash("world on")
    check(ns.World.IsEnabled() and not ns.World.IsSuspended() and ns.World.errors.count == 0, "world on must clear the suspension")
    slash("world off")
    for i = #plates, 1, -1 do plates[i] = nil end
    plateDistance["nameplate1"] = nil
end)

test("world overlay: copies are PlayerModel frames under their plates, sized by the camera, with a tunable parallax", function()
    local p1 = addPlate("nameplate1", 1200, 600, 15) -- mid
    cursorX, cursorY = 960, 540
    slash("world on")
    step(0.6)
    local pool = ns.World._pool
    local focal, zoom = ns.World.CameraScale()
    check(near(focal, 540 / math.tan(0.5), 1e-6) and zoom == 10, "camera scale from the screen height, the fov and GetCameraZoom")
    local function find()
        for i = 1, #ns.World._pool do if ns.World._pool[i].unit == "nameplate1" then return ns.World._pool[i] end end
    end
    local slot = find()
    check(slot and slot.mono.kind == "PlayerModel", "copies are PlayerModel frames by default (DressUpModel drew white NPCs in the game)")
    check(slot.mono.parent == p1 and slot.left.parent == p1 and slot.right.parent == p1, "a copy lives under its nameplate so the client scales and hides it with the plate")
    check(pool[1].mono.parent == ns.World._overlay(), "the player copy has no plate and lives under the overlay")
    check(near(slot.h, focal * 1.8 / (zoom + 18), 1e-6), "a mid copy is focal * 1.8 yd / (zoom + 18 yd) tall, got " .. tostring(slot.h))
    check(near(pool[1].h, focal * 2.0 / zoom, 1e-6), "the player copy is focal * 2 yd / zoom tall, got " .. tostring(pool[1].h))
    check(slot.h < 100 and slot.h > 40, "a mid copy at 1080p must be tens of pixels, not the 150 of v1.6.1: " .. tostring(slot.h))
    cameraZoom = 20
    stepUntilWorldRefresh()
    check(near(slot.h, focal * 1.8 / (20 + 18), 1e-6), "zooming the camera out shrinks the copies")
    cameraZoom = 10
    slash("world height 3.6")
    stepUntilWorldRefresh()
    check(near(slot.h, focal * 3.6 / 28, 1e-6), "the nominal unit height scales the copies")
    slash("world height 1.8")
    stepUntilWorldRefresh()
    -- the parallax gain
    cursorX = 1440
    step(1.5)
    local shift120 = slot.mono.points.TOP.x
    local expected = 120 * M.ParallaxShift(ns.State().eyeX, 0.5)
    check(shift120 > 5 and near(shift120, expected, 1e-3), string.format("a mid copy shifts 120 px * ParallaxShift(eye, 0.5) = %.2f, got %.2f", expected, shift120))
    slash("world parallax 240")
    step(0.5)
    check(near(slot.mono.points.TOP.x, shift120 * 2, 1e-3), "the parallax gain doubles the shift")
    slash("world parallax 120")
    cursorX = 960
    step(1.0)
    -- the frame type switch rebuilds the pool
    slash("world frame dressup")
    step(0.6)
    slot = find()
    check(slot and slot.mono.kind == "DressUpModel", "world frame dressup rebuilds the copies as DressUpModel frames")
    check(FidelityEMatrix_Config.worldFrameType == "dressup", "the frame type is saved")
    slash("world frame player")
    step(0.6)
    slot = find()
    check(slot and slot.mono.kind == "PlayerModel", "world frame player restores PlayerModel")
    printed = {}
    slash("world status")
    check(printed[1] and printed[1]:find("frames PlayerModel (player)", 1, true), "status names the frame type: " .. tostring(printed[1]))
    slash("world bogus")
    slash("world off")
    check(slot.mono.parent == ns.World._overlay(), "a released copy goes back under the overlay")
    for i = #plates, 1, -1 do plates[i] = nil end
end)

test("terrain: tile lookup, ground height and the player state from UnitPosition", function()
    local T = ns.Terrain
    check(T, "EMatrix_Terrain did not export ns.Terrain")
    local col, row, tile = T.TileFor("azeroth", -8897.0, -178.3)
    check(col == 32 and row == 48 and tile, string.format("abbey must be on tile 32,48, got %d,%d", col, row))
    check(near(T.GroundHeight(tile, -8897.0, -178.3), 80.0, 1e-6), "flat synthetic ground must read 80")
    check(T.GroundHeight(tile, -7000, 0) == nil, "a point outside the tile must give nil")
    -- a sloped corner: raise one grid node and check the bilinear blend between it and its neighbour
    tile.heights[1] = 1200 -- node (0,0) at originX, originY: 120 m
    local mid = T.GroundHeight(tile, tile.originX - tile.unit * 0.5, tile.originY)
    check(near(mid, 100.0, 1e-6), "halfway between 120 and 80 must be 100, got " .. tostring(mid))
    tile.heights[1] = 800
    local ps = T.PlayerState()
    check(ps and near(ps.x, -8897.0) and near(ps.y, -178.3) and ps.mapName == "azeroth", "PlayerState must take UnitPosition's first return as x (north-south) and the second as y (west-east)")
    -- the owner's probe numbers (04 Nov 2026): first return -8763.0, second -97.6, must land on tile 32:48
    local savedUP = _G.UnitPosition
    _G.UnitPosition = function() return -8763.0, -97.6, 0, 0 end
    local probe = T.PlayerState()
    local pc, pr, ptile = T.TileFor(probe.mapName, probe.x, probe.y)
    check(pc == 32 and pr == 48 and ptile ~= nil, string.format("the probe's position must be tile 32:48 (Northshire), got %d:%d", pc, pr))
    _G.UnitPosition = savedUP
    -- the client family picks the data set: this stub is a 2.5.6 client (toc 20506) -> tbc
    check(T.Family() == "tbc", "a 2.5.6 client must use the tbc data, got " .. T.Family())
    check(T.BuildLabel():find("2.5.6.70577", 1, true), "build label must name the data build: " .. T.BuildLabel())
    local savedBuildInfo = _G.GetBuildInfo
    _G.GetBuildInfo = function() return "1.60.1", "70753", "Nov 2026", 16001 end
    check(T.Family() == "vanilla", "a 1.60 (WoW Forever) client must use the vanilla data, got " .. T.Family())
    local _, _, vtile = T.TileFor("azeroth", -8897.0, -178.3)
    check(vtile and near(T.GroundHeight(vtile, -8897.0, -178.3), 90.0, 1e-6), "the vanilla family must read its own tile (ground 90)")
    _G.GetBuildInfo = function() return "1.15.9", "70576", "Oct 2026", 11509 end
    check(T.Family() == "vanilla", "Classic Era (1.15) also maps to the vanilla data")
    -- any other family (Wrath, Cataclysm, retail) has no data here and must not borrow another's
    _G.GetBuildInfo = function() return "11.0.7", "58000", "Oct 2026", 110007 end
    check(T.Family() == "unsupported", "a retail client must be 'unsupported', got " .. T.Family())
    check(T.Data() == nil and T.BuildLabel():find("unsupported", 1, true), "an unsupported client has no data and says so: " .. T.BuildLabel())
    slash("terrain status")
    _G.GetBuildInfo = savedBuildInfo
    check(T.Family() == "tbc", "restored client must be tbc again")
end)

test("terrain overlay: nearby placements become props at projected positions; far ones are not drawn", function()
    local T = ns.Terrain
    slash("parallax 0.5")
    slash("terrain on")
    step(0.6)
    check(T.IsEnabled(), "terrain overlay did not enable")
    local info = T.Info()
    check(info.tile == "azeroth:32:48", "tile " .. tostring(info.tile))
    check(info.props == 2, "expected 2 props drawn (tree, bush; the abbey beside the player is off-screen), got " .. tostring(info.props))
    local pool = T._pool
    local byPath = {}
    for i = 1, #pool do if pool[i].used then byPath[pool[i].entry[2]] = pool[i] end end
    local tree = byPath["world/azeroth/elwynn/passivedoodads/trees/elwynntreecanopy03.m2"]
    local bush = byPath["world/azeroth/elwynn/passivedoodads/bush/elwynnbush09.m2"]
    check(tree and bush, "tree and bush must be in the pool")
    check(not byPath["world/azeroth/elwynn/passivedoodads/trees/elwynntreemid01.m2"], "the 150 yd tree must be outside the radius")
    check(tree.mono.model == "world\\azeroth\\elwynn\\passivedoodads\\trees\\elwynntreecanopy03.m2", "model must be loaded by its path (verified), got " .. tostring(tree.mono.model))
    check(tree.mono.animation == 0, "a loaded prop must start its idle animation")
    check(ns.Terrain.loadStats.ok >= 3 and ns.Terrain.loadStats.failed == 0, string.format("load stats ok %d failed %d", ns.Terrain.loadStats.ok, ns.Terrain.loadStats.failed))
    -- facing 0 = looking north: the tree 20 yd ahead sits on the centre line, above the bush
    check(near(tree.mono.points.BOTTOM.x, 960, 1.0), "tree ahead must be on the centre line, x=" .. tostring(tree.mono.points.BOTTOM.x))
    check(tree.mono.points.BOTTOM.y > bush.mono.points.BOTTOM.y, "the far tree's foot must be higher on screen than the near bush's")
    check(tree.mono.h < bush.mono.h * 16 / 2.5, "the tree must not be drawn absurdly large relative to the bush")
    -- the bush is 5 yd to the east (smaller y, since y grows westward): facing north, east is screen right
    check(bush.mono.points.BOTTOM.x > 960, "a bush to the east must sit right of centre, x=" .. tostring(bush.mono.points.BOTTOM.x))
    check(not byPath["world/wmo/azeroth/buildings/nsabbey/nsabbey.wmo"], "a WMO must never be sent to a Model frame (it cannot load there)")
    check(T.Info().buildings == 1, "the abbey must be counted as a building nearby, got " .. tostring(T.Info().buildings))
    local cam = T._lastCam()
    check(cam and near(cam.yaw, 0), "camera yaw must follow the facing")
    check(near(T.Info().pitch, 0.35, 1e-9), "with no measurable nameplate the saved pitch (0.35) is used, got " .. tostring(T.Info().pitch))
end)

test("terrain test: one loaded prop alone at the screen centre with position, camera and scale knobs; off restores the layout", function()
    local T = ns.Terrain
    slash("terrain on")
    step(0.6)
    check(T.Info().props == 2, "two props drawn before the test, got " .. tostring(T.Info().props))
    local pool = T._pool
    local loaded = {}
    for i = 1, #pool do if pool[i].used then loaded[#loaded + 1] = pool[i] end end
    check(#loaded == 2 and loaded[1].mono.position and loaded[1].mono.position[1] == 0, "a loaded prop is settled at its origin: SetPosition(0, 0, 0)")
    check(not rawget(loaded[1].mono, "setCameraCalls"), "no prop gets SetCamera: a doodad has no camera 0 and the call blanked every frame on the owner's client")
    printed = {}
    slash("terrain test")
    check(printed[1] and printed[1]:find("terrain test [", 1, true) and printed[1]:find("432 px tall", 1, true), "the test names the prop and its size: " .. tostring(printed[1]))
    local shown = 0
    for i = 1, #pool do
        local s = pool[i]
        if s.mono and s.mono.shown then shown = shown + 1; check(s.mono.h == 432 and s.mono.points.CENTER, "the test prop is 40% of the screen tall at the centre") end
        check(not (s.left and s.left.shown) and not (s.right and s.right.shown), "no stereo copies during the test")
    end
    check(shown == 1, "exactly one prop is shown during the test, got " .. shown)
    step(1.0)
    check(T.Info().props == 1, "the layout does not run during the test")
    slash("terrain test off"); step(0.6)
    slash("box show")
    check(_G.FidelityEMatrixFrame.shown, "box shown before the test")
    slash("terrain test")
    check(not _G.FidelityEMatrixFrame.shown, "the test hides the box, which sits over the screen centre")
    local m = loaded[1].mono.shown and loaded[1].mono or loaded[2].mono
    check(not rawget(m, "setCameraCalls"), "the default variant makes no camera call")
    check(printed[#printed]:find("terrain test [default (fresh load, no camera call)]", 1, true) and printed[#printed]:find("loaded (file id", 1, true), "the test names its variant and whether the file loaded: " .. tostring(printed[#printed]))
    slash("terrain test cam 0")
    check(m.camera == 0 and m.setCameraCalls == 1, "cam 0 puts the camera call back, once: camera " .. tostring(rawget(m, "camera")) .. " calls " .. tostring(rawget(m, "setCameraCalls")) .. " last line " .. tostring(printed[#printed]))
    slash("terrain test z 2")
    check(m.position[1] == 2, "z 2 moves the model toward the camera: SetPosition(2, 0, 0), got " .. tostring(m.position[1]))
    check(m.setCameraCalls == 1, "a later variant starts fresh: no second camera call")
    slash("terrain test scale 0.2")
    check(m.modelScale == 0.2 and m.position[1] == 0, "scale sets SetModelScale on a fresh load (the z knob is gone), got " .. tostring(m.modelScale) .. " at x " .. tostring(m.position[1]))
    local own = m.model
    slash("terrain test known")
    check(m.model == "interface\\buttons\\talktomequestionmark.m2", "known loads the client's question-mark model, got " .. tostring(m.model))
    slash("terrain test off")
    check(m.model == own, "off reloads the prop's own model, got " .. tostring(m.model))
    check(_G.FidelityEMatrixFrame.shown, "off shows the box again")
    slash("box hide")
    check(m.position[1] == 0 and m.modelScale == 1, "off settles the model back")
    step(0.6)
    check(T.Info().props == 2, "off restores the layout, got " .. tostring(T.Info().props))
    -- the overlay stays on: the tests that follow continue from this state
end)

test("terrain overlay: anaglyph pairs, facing follows the player, off releases everything", function()
    local T = ns.Terrain
    slash("stereo anaglyph")
    step(0.6)
    local pool = T._pool
    local any = false
    for i = 1, #pool do
        local s = pool[i]
        if s.used and (s.left.shown or s.mono.shown) then
            any = true
            check(not s.mono.shown and s.left.shown and s.right.shown, "anaglyph must show the pair, not the mono model")
            check(s.right.points.BOTTOM.x > s.left.points.BOTTOM.x, "uncrossed pair: red left of cyan")
        end
    end
    check(any, "no props drawn in anaglyph")
    slash("stereo off")
    -- turn the player east: the tree that was ahead is now to the left of the view
    playerFacing = -math.pi / 2
    step(0.6)
    local cam = T._lastCam()
    check(cam and near(cam.yaw, -math.pi / 2), "camera yaw must follow a changed facing")
    playerFacing = 0
    slash("terrain off")
    slash("spin 0"); slash("parallax 0")
    step(1.0)
    check(not T.IsEnabled() and T.Info().props == 0 or not T.IsEnabled(), "terrain still enabled")
    for i = 1, #pool do
        local s = pool[i]
        check(not s.mono.shown and not s.left.shown and not s.right.shown, "a prop is still shown with the overlay off")
    end
    check(_G.FidelityEMatrixDriver:GetScript("OnUpdate") == nil, "OnUpdate must detach once the terrain overlay is off")
    slash("spin 0.5"); slash("parallax 0.5")
end)

test("terrain overlay: culling before the cut, failed loads free the slot and retry, props are capped, nearest on top, errors suspend", function()
    local T = ns.Terrain
    local tbc = EMatrix_Data.tbc["azeroth:32:48"]
    local baseCount = #tbc.doodads
    -- 30 props behind the camera (facing north, the camera sits about 9.4 yd south of the player)
    local behind = {}
    for i = 1, 30 do
        behind[i] = { 0, "world/azeroth/elwynn/passivedoodads/rocks/rock" .. i .. ".m2", playerPos.x - 12 - i * 0.5, playerPos.y + (i % 5), 80.0, 0.0, 1.0 }
        tbc.doodads[#tbc.doodads + 1] = behind[i]
    end
    -- one prop half a yard in front of the camera lens
    local cam0 = M.BuildCamera(playerPos.x, playerPos.y, 80, 0, 10, 0.35, 1.0, 1920, 1080)
    local atLens = { 0, "world/azeroth/elwynn/passivedoodads/rocks/lensrock.m2", cam0.cx + cam0.fx * 0.5, cam0.cy + cam0.fy * 0.5, cam0.cz + cam0.fz * 0.5, 0.0, 1.0 }
    tbc.doodads[#tbc.doodads + 1] = atLens
    -- a giant canopy 1.5 yd ahead: its projected height must be capped
    local giant = { 0, "world/azeroth/elwynn/passivedoodads/trees/giantcanopy.m2", playerPos.x + 1.5, playerPos.y + 0.5, 80.0, 0.0, 5.0 }
    tbc.doodads[#tbc.doodads + 1] = giant
    failModels["elwynnbush09"] = true
    slash("terrain on")
    step(0.6)
    local pool = T._pool
    local function used()
        local byPath = {}
        for i = 1, #pool do if pool[i].used then byPath[pool[i].entry[2]] = pool[i] end end
        return byPath
    end
    local byPath = used()
    local treePath = "world/azeroth/elwynn/passivedoodads/trees/elwynntreecanopy03.m2"
    local bushPath = "world/azeroth/elwynn/passivedoodads/bush/elwynnbush09.m2"
    check(byPath[treePath], "the tree ahead must be drawn although 30 nearer props sit behind the camera (culling before the nearest cut)")
    for i = 1, 30 do check(not byPath[behind[i][2]], "a prop behind the camera must not take a slot: " .. behind[i][2]) end
    check(not byPath[atLens[2]], "a prop at the camera lens must not be drawn")
    local g = byPath[giant[2]]
    check(g and g.mono.h <= 1080 * 2 + 1e-6 and g.mono.h > 1000, "a prop near the camera is capped at two screen heights, got " .. tostring(g and g.mono.h))
    -- the failed bush: no slot, nothing shown, remembered, retried after RETRY_AFTER
    check(not byPath[bushPath], "a model that failed to load must not hold a slot")
    check(T.loadStats.failed >= 1, "the failure must be counted")
    local key
    for k in pairs(T._failedAt) do if k:find("elwynnbush09", 1, true) then key = k end end
    check(key, "the failed key must be remembered for the retry timer")
    for i = 1, #pool do local s = pool[i]; if not s.used then check(not s.mono.shown and not s.left.shown and not s.right.shown, "an unused slot must not show a model") end end
    local failedBefore = T.loadStats.failed
    step(T.RETRY_AFTER * 0.5)
    check(not used()[bushPath], "no retry before RETRY_AFTER: the bush must still be out")
    check(T.loadStats.failed == failedBefore, "no retry before RETRY_AFTER: no new load attempt, failures " .. T.loadStats.failed .. " vs " .. failedBefore)
    failModels["elwynnbush09"] = nil
    step(T.RETRY_AFTER * 0.5 + 0.6)
    byPath = used()
    check(byPath[bushPath], "the model must be retried and drawn once it loads")
    -- nearest on top: the bush (5 yd) gets a higher frame level than the tree (20 yd)
    check(byPath[bushPath].mono.level > byPath[treePath].mono.level, string.format("nearer props must have the higher frame level (bush %s, tree %s)", tostring(byPath[bushPath].mono.level), tostring(byPath[treePath].mono.level)))
    -- /fide terrain head is gone (it never did anything) and a typo writes nothing
    slash("terrain head 2")
    check(FidelityEMatrix_Config.terrainHead == nil and FidelityEMatrix_Config.terrainPitchFromPlate == nil, "dead knobs must not be written to the save")
    -- errors: repeated failures suspend the overlay WITHOUT writing the saved choice
    local savedPos = _G.UnitPosition
    _G.UnitPosition = function() error("boom") end
    step(1.5)
    _G.UnitPosition = savedPos
    check(not T.IsEnabled() and T.IsSuspended(), "the overlay must suspend after repeated errors")
    check(FidelityEMatrix_Config.terrainOverlay == true, "suspending must not write the saved choice")
    for i = 1, #pool do check(not pool[i].mono.shown and not pool[i].left.shown, "suspending must hide every prop") end
    printed = {}
    slash("terrain status")
    check(printed[1] and printed[1]:find("SUSPENDED", 1, true), "status must say suspended")
    slash("terrain on")
    check(T.IsEnabled() and not T.IsSuspended() and T.errors.count == 0, "terrain on must clear the suspension")
    slash("terrain off")
    for i = #tbc.doodads, baseCount + 1, -1 do tbc.doodads[i] = nil end
end)

test("terrain overlay: placements just across a tile border are drawn (neighbour tiles)", function()
    local T = ns.Terrain
    local heights = {}
    for i = 1, 129 * 129 do heights[i] = 800 end
    local treePath = "world/azeroth/elwynn/passivedoodads/trees/bordertree.m2"
    -- the player 10 yd east of the border between columns 32 and 31 (y = 0; y grows westward);
    -- a tree 18 yd west of the player, across the border on tile 31, 25 yd ahead
    local savedY = playerPos.y
    playerPos.y = -10
    EMatrix_Data.tbc["azeroth:31:48"] = { map = "azeroth", col = 31, row = 48, originX = -8533.333, originY = 533.333, unit = 4.16667, heights = heights,
        doodads = { { 0, treePath, playerPos.x + 25, 8, 80.0, 0.0, 1.0 } }, wmos = {} }
    slash("terrain on")
    step(0.6)
    check(T.Info().tile == "azeroth:32:48", "the player's own tile is still 32:48, got " .. tostring(T.Info().tile))
    local found
    for i = 1, #T._pool do if T._pool[i].used and T._pool[i].entry[2] == treePath then found = T._pool[i] end end
    check(found and found.mono.shown, "a placement on the neighbouring tile within the radius must be drawn")
    check(found.mono.points.BOTTOM.x < 960, "the tree west of the player must sit left of centre when facing north, x=" .. tostring(found.mono.points.BOTTOM.x))
    slash("terrain off")
    EMatrix_Data.tbc["azeroth:31:48"] = nil
    playerPos.y = savedY
end)

test("/fide overlay on turns both overlays on and hides the box; off restores it", function()
    addPlate("nameplate7", 1100, 600, 12)
    slash("overlay on")
    step(0.6)
    check(ns.World.IsEnabled() and ns.Terrain.IsEnabled(), "both overlays must be on")
    check(not _G.FidelityEMatrixFrame.shown, "the box must be hidden")
    check(FidelityEMatrix_Config.boxHidden == true, "box state must be saved")
    check(ns.World.ActorCount() >= 1 and ns.Terrain.Info().props >= 1, "overlays must draw something")
    cursorX, cursorY = 1440, 540
    step(1.5)
    local st = ns.State()
    check(st.eyeX > 0.2, "the eye must keep following the cursor while the box is hidden, got " .. st.eyeX)
    cursorX, cursorY = 960, 540
    step(1.5)
    slash("overlay off")
    step(0.3)
    check(not ns.World.IsEnabled() and not ns.Terrain.IsEnabled() and _G.FidelityEMatrixFrame.shown, "off must restore the box")
    for i = #plates, 1, -1 do plates[i] = nil end
    slash("spin 0.5"); slash("parallax 0.5")
end)

test("gamepad eye: a stick drives the eye, calibrate zeroes it, no pad falls back to the cursor", function()
    slash("parallax 0.5")
    slash("eye source gamepad")
    cursorX, cursorY = 960, 540
    padState = nil
    step(1.0)
    local st = ns.State()
    check(near(st.eyeX, 0, 1e-3), "with no pad and the cursor centred the eye must rest at 0")
    cursorX = 1440
    step(1.5)
    check(ns.State().eyeX > 0.2, "with no pad the cursor must still drive the eye (fallback)")
    cursorX = 960
    plugPad(0.8, -0.4, 0.3)
    step(1.5)
    st = ns.State()
    check(near(st.eyeX, 0.8 * 0.5, 0.02), "right stick x must drive the eye: " .. st.eyeX)
    check(near(st.eyeY, -0.4 * 0.5, 0.02), "right stick y must drive the eye: " .. st.eyeY)
    local _, _, _, ez = ns.GetEye()
    check(near(ez, 0, 1e-6), "depth axis off must leave z at 0")
    slash("eye depth 5")
    step(1.0)
    _, _, _, ez = ns.GetEye()
    check(near(ez, 0.3, 0.02), "depth axis 5 must drive z: " .. ez)
    -- depth reaches the renderers: leaning in (z > 0) strengthens the parallax of every plane
    check(ns.EyeGain() > 1.1, "the eye gain must rise with depth, got " .. ns.EyeGain())
    local sideWithDepth = ns.State().frames.main.position[2]
    slash("eye depth off")
    step(1.5)
    check(near(ns.EyeGain(), 1, 1e-6), "without a depth axis the gain is 1")
    check(ns.State().frames.main.position[2] < sideWithDepth, "with depth off the subject must slide less for the same stick")
    slash("eye depth 5")
    step(1.0)
    slash("eye calibrate")
    step(1.5)
    st = ns.State()
    _, _, _, ez = ns.GetEye()
    check(near(st.eyeX, 0, 0.02) and near(st.eyeY, 0, 0.02) and near(ez, 0, 0.02), "calibrate must make the current pose the rest pose")
    plugPad(0.8, -0.4, 0.3)
    slash("eye invert")
    plugPad(0.3, -0.4, 0.3) -- rest 0.8 -> delta -0.5, inverted -> +0.5 * gain 1 * pStr 0.5
    step(1.5)
    check(near(ns.State().eyeX, 0.25, 0.02), "invert must flip left/right: " .. ns.State().eyeX)
    slash("eye invert")
    plugPad(0.8, -0.9, 0.3) -- rest y -0.4 -> delta -0.5 -> normal -0.25, inverted +0.25
    step(1.5)
    check(near(ns.State().eyeY, -0.25, 0.02), "up/down follows the stick: " .. ns.State().eyeY)
    slash("eye inverty")
    step(1.5)
    check(near(ns.State().eyeY, 0.25, 0.02), "inverty must flip up/down: " .. ns.State().eyeY)
    slash("eye inverty")
    plugPad(0.8, -0.4, 0.3)
    printed = {}
    slash("eye probe")
    check(#printed >= 3 and printed[1]:find("read: ok", 1, true), "the probe must state every step of the read: " .. tostring(printed[1]))
    slash("eye setup"); slash("eye")
    slash("eye source cursor")
    padState = nil
    FidelityEMatrix_Config.eyeCalX, FidelityEMatrix_Config.eyeCalY, FidelityEMatrix_Config.eyeCalZ = 0, 0, 0
    FidelityEMatrix_Config.eyeDepthAxis = 0
    step(1.0)
    -- a depth left by the pad must not outlive it (round 4, B2 and O3): back on the hand, the gain returns to 1
    slash("eye source gamepad"); slash("eye depth 5"); plugPad(0, 0, 0.3); step(1.0)
    check(ns.EyeGain() > 1.1, "depth drives the gain, got " .. ns.EyeGain())
    slash("eye source cursor"); step(1.5)
    check(near(ns.EyeGain(), 1, 1e-3), "the pointer has no depth: the gain must return to 1 once the pad stops driving, got " .. ns.EyeGain())
    -- the label names what drives the eye, not what is configured
    local function statusHas(s) for _, line in ipairs(printed) do if line:find(s, 1, true) then return true end end return false end
    printed = {}; slash("status")
    check(statusHas("from hand:cursor (no head measured)"), "status must name the hand when the cursor drives the eye")
    slash("eye source gamepad"); padState = nil
    printed = {}; slash("status")
    check(statusHas("from hand:cursor (pad configured, none answers"), "status must say the hand drives the eye when no pad answers")
    plugPad(0, 0, 0)
    printed = {}; slash("status")
    check(statusHas("from pad (head; age not measured)"), "status must name the pad when it answers, with no age")
    padState = nil
    slash("eye depth off"); slash("eye source cursor")
    FidelityEMatrix_Config.eyeDepthAxis = 0
    step(1.0)
end)

test("typos change nothing, help is short, a migration keeps the owner's choices", function()
    slash("stereo off")
    slash("stereo bogus")
    check(FidelityEMatrix_Config.stereoMode == "off", "a stereo typo must not change the saved mode")
    local shown = _G.FidelityEMatrixFrame.shown
    slash("box bogus")
    check(_G.FidelityEMatrixFrame.shown == shown and FidelityEMatrix_Config.boxHidden == (not shown), "a box typo must not toggle the box")
    local w, t = ns.World.IsEnabled(), ns.Terrain.IsEnabled()
    slash("overlay bogus")
    check(ns.World.IsEnabled() == w and ns.Terrain.IsEnabled() == t, "an overlay typo must not toggle the overlays")
    printed = {}
    slash("help")
    check(#printed <= 7, "/fide help must be short, printed " .. #printed .. " lines")
    printed = {}
    slash("help all")
    check(#printed >= 15, "/fide help all must list everything, printed " .. #printed)
    printed = {}
    slash("bogus")
    check(#printed == 1 and printed[1]:find("Unknown command", 1, true), "an unknown command prints one line and changes nothing")
    -- a save from before v1.5 with the overlays deliberately off keeps them off; missing keys get defaults
    local saved = FidelityEMatrix_Config
    FidelityEMatrix_Config = { configVersion = 1, worldOverlay = false, terrainOverlay = false, boxHidden = false, stereoMode = "off" }
    ns.MergeDefaults()
    check(FidelityEMatrix_Config.worldOverlay == false and FidelityEMatrix_Config.terrainOverlay == false and FidelityEMatrix_Config.boxHidden == false, "a migration must not override the owner's choices")
    check(FidelityEMatrix_Config.configVersion == 2 and FidelityEMatrix_Config.lensAlpha == 0.35, "a migration still records its version and adds missing keys")
    FidelityEMatrix_Config = saved
end)

test("binding registry: sources are named, valued, aged and kinded; the draw follows them only behind the gate; the world slots publish themselves", function()
    -- the API
    check(ns.BindCell and ns.ReleaseCell and ns.CellSource and ns.BoundCounts, "the registry API is exported")
    check(not ns.BindCell(0, "x", 1, now, "measured") and not ns.BindCell(136, "x", 1, now, "measured") and not ns.BindCell(3, "", 1, now, "measured"), "bad indexes and empty names are refused")
    check(ns.BindCell(3, "test:fresh", 0.9, now, "measured"), "a bind succeeds")
    check(ns.BindCell(4, "test:symbolic", 0.9, now, "symbolic") and ns.BindCell(5, "test:unknown", 0.9, now, "bogus-kind"), "binds with other kinds succeed")
    check(ns.CellSource(5).kind == "not_measured", "an unknown kind is recorded as not_measured")
    check(ns.CellSource(3).value == 0.9 and ns.CellSource(3).source == "test:fresh", "the record keeps the name and the value")
    check(ns.BindCell(6, "test:clamped", 7, now, "measured") and ns.CellSource(6).value == 1, "values clamp to [0, 1]")
    -- a stamp from the future is not fresh (a wall clock handed to this GetTime() registry would otherwise read fresh for ever: round 4, B1)
    check(ns.BindCell(7, "test:future", 0.9, now + 1000, "measured"), "a future stamp is recorded")
    -- a source may state its own window (the flows' 180 s) without loosening the others
    check(ns.BindCell(8, "test:window", 0.9, now, "measured", 10) and ns.CellSource(8).window == 10, "a source keeps its own window")
    check(ns.CellSource(3).window == ns.FRESH_SECONDS, "the default window is FRESH_SECONDS")
    local recorded, live = ns.BoundCounts()
    check(recorded == 6 and live == 3, string.format("6 recorded, 3 fresh and measured (not the future one), got %d and %d", recorded, live))
    -- freshness: after FRESH_SECONDS the 2 s sources are stale; the 10 s one still counts
    step(ns.FRESH_SECONDS + 0.5)
    recorded, live = ns.BoundCounts()
    check(recorded == 6 and live == 1, "after the default window only the 10 s source is live, got " .. live)
    step(10.0)
    recorded, live = ns.BoundCounts()
    check(live == 0, "after its own window the 10 s source is stale too, got " .. live)
    check(ns.ReleaseCell(3) and ns.CellSource(3) == nil and not ns.ReleaseCell(3), "release clears a cell once")
    for i = 4, 8 do ns.ReleaseCell(i) end
    -- the gate off: a bound cell changes nothing on screen
    slash("bind off")
    slash("ripple 8 5"); step(3.0) -- open the window
    check(ns.State().open, "window open for the gate test")
    ns.BindCell(10, "test:gate", 0.1, now, "measured") -- would close cell 10 if the gate were on
    step(1.0)
    check(ns.cells[10].flapTex.texture:find("Window") and near(ns.cells[10].flapTex.alpha, 0.35), "with the gate off the draw is unchanged")
    -- the gate on: a bound cell follows its source, an unbound cell stays closed ("no source")
    slash("bind on")
    step(0.6)
    check(ns.cells[10].flapTex.texture:find("Closed") and ns.cells[10].flapTex.alpha == 1 and ns.cells[10].face == false, "a bound cell with value 0.1 closes")
    check(ns.cells[11].flapTex.texture:find("Closed") and ns.cells[11].specBar.alpha == 0, "an unbound cell closes with no glint (no source)")
    ns.BindCell(10, "test:gate", 0.9, now, "measured")
    step(0.6)
    check(ns.cells[10].flapTex.texture:find("Window") and near(ns.cells[10].flapTex.alpha, 0.35), "a bound cell with value 0.9 opens")
    ns.BindCell(10, "test:gate", 0.9, now, "symbolic")
    step(0.6)
    check(ns.cells[10].flapTex.texture:find("Closed"), "a symbolic source does not open a cell")
    ns.BindCell(10, "test:gate", 0.9, now, "measured")
    step(ns.FRESH_SECONDS + 1.0)
    check(ns.cells[10].flapTex.texture:find("Closed"), "a stale source closes its cell")
    ns.ReleaseCell(10)
    -- the world overlay's slots publish themselves as sources: slot i -> cell i
    addPlate("nameplate1", 1200, 600, 15) -- mid
    addPlate("nameplate2", 400, 760, 40)  -- far
    slash("world on")
    step(0.6)
    local src1, src2, src3 = ns.CellSource(1), ns.CellSource(2), ns.CellSource(3)
    check(src1 and src1.source == "actor:player:player" and src1.kind == "symbolic", "slot 1 is the player, a symbolic source: " .. tostring(src1 and src1.source))
    check(src2 and src2.source:find("^actor:nameplate%d:mid") and src2.kind == "measured" and src2.value == 0.5, "the mid unit is a measured source at 0.5: " .. tostring(src2 and src2.source))
    check(src3 and src3.source:find(":far$") and src3.value == 0.2, "the far unit is a measured source at 0.2")
    check(ns.cells[2].flapTex.texture:find("Window"), "with the gate on the mid actor's cell opens")
    check(ns.cells[3].flapTex.texture:find("Closed"), "the far actor's cell (0.2) stays closed")
    -- the window's own planes are off while the bound draw is on (no single window to frame)
    local st = ns.State()
    check(not st.reticle.mono.shown and not st.sheen.shown, "reticle and glass must be hidden while the bound draw is on")
    for _, w in ipairs(st.walls) do check(not w.shown, "a wall is shown while the bound draw is on") end
    printed = {}
    slash("cells")
    check(printed[1] and printed[1]:find("have a source", 1, true) and #printed >= 3, "/fide cells lists the sources")
    check(printed[2] and printed[2]:find(" label 1.00 ", 1, true) and printed[2]:find(" of 2s ", 1, true), "/fide cells prints the label and the window, not a value: " .. tostring(printed[2]))
    slash("world off")
    check(ns.CellSource(1) == nil and ns.CellSource(2) == nil, "world off releases the slots' cells")
    slash("bind off")
    for i = #plates, 1, -1 do plates[i] = nil end
    slash("ripple 1 1"); step(3.0) -- close the window again for the tests that follow
end)

test("the binding draw stays alive while the gate is on: a stale source closes with spin, parallax and the overlays off", function()
    slash("world off"); slash("terrain off"); slash("spin 0"); slash("parallax 0")
    step(2.0) -- nothing moves: the driver detaches
    local host = ns.State().frames.driver or ns.State().frames.master
    check(not host:GetScript("OnUpdate"), "the driver must be detached when nothing moves")
    slash("bind on")
    check(ns.BindCell(20, "test:alive", 0.9, now, "measured"), "bind cell 20")
    check(host:GetScript("OnUpdate"), "a recorded source with the gate on must keep the driver attached")
    step(0.6)
    check(ns.cells[20].flapTex.texture:find("Window"), "the bound cell opens")
    step(ns.FRESH_SECONDS + 1.0)
    check(ns.cells[20].flapTex.texture:find("Closed"), "the stale source must close its cell although nothing else moves")
    check(ns.ReleaseCell(20), "release")
    slash("bind off"); step(0.5)
    slash("spin 0.5"); slash("parallax 0.5"); slash("terrain on")
end)

test("a click is an input the entity names: OnMouseDown only, the wave starts at the clicked cell, off the grid nothing happens, with the gate on the line names the source", function()
    local master = ns.State().frames.master
    check(master.scripts.OnMouseDown and not master.scripts.OnMouseUp, "the click must be wired to OnMouseDown only")
    local function click(x, y)
        cursorX, cursorY = x, y
        master.scripts.OnMouseDown(master, "LeftButton")
    end
    -- the stub's frame: left 720, top 684 (UI units), scale 1; cell (col 3, row 2) spans x 784 to 816, y 652 to 620
    local wasOpen = ns.State().open
    step(0.2) -- past the debounce
    click(800, 636)
    local st = ns.State()
    check(st.waveActive and st.open ~= wasOpen, "a click on the grid starts a wave")
    check(ns.cells[(2 - 1) * 15 + 3].ringDist == 0, "the wave starts at the clicked cell (col 3, row 2), ring distance " .. tostring(ns.cells[18].ringDist))
    step(3.0)
    -- off the grid: nothing
    wasOpen = ns.State().open
    click(100, 100)
    st = ns.State()
    check(not st.waveActive and st.open == wasOpen, "a click off the grid must start no wave")
    -- with the gate on, the line names the cell's source
    slash("bind on"); step(0.3)
    check(ns.BindCell(18, "test:click", 0.9, now, "measured"), "bind cell 18")
    printed = {}
    click(800, 636)
    check(printed[#printed] and printed[#printed]:find("Clicked cell 18: test:click label 0.90 age 0.0s of 2s measured, open", 1, true), "the click must name the source: " .. tostring(printed[#printed]))
    step(3.0)
    printed = {}
    click(736, 668) -- col 1, row 1
    check(printed[#printed] and printed[#printed]:find("Clicked cell 1: no source", 1, true), "an unbound cell must say no source: " .. tostring(printed[#printed]))
    step(3.0)
    ns.ReleaseCell(18)
    slash("bind off"); step(0.5)
    cursorX, cursorY = 960, 540
end)

test("report panel: buttons run the checks with their chat captured into the saved report, screenshots follow half a second later, save reloads, clear empties", function()
    local R = ns.Report
    check(R and R.STEPS and #R.STEPS == 12, "the report module loaded with twelve steps")
    local terrainWas = ns.Terrain.IsEnabled()
    FidelityEMatrix_Report = nil
    printed = {}
    slash("report show")
    local p = R._panel()
    check(p and p.shown and _G.FidelityEMatrixReportButton1 and _G.FidelityEMatrixReportButton12, "the panel and its buttons exist and show")
    check(printed[1] and printed[1]:find("Report panel shown", 1, true), "the command says what to do")
    local function click(i) local b = _G["FidelityEMatrixReportButton" .. i]; b.scripts.OnClick(b, "LeftButton") end
    click(1)
    local r = FidelityEMatrix_Report
    check(r and r.version == ns.VERSION and #r.steps == 1 and r.steps[1].step == "checks" and r.at, "one step recorded with the version and a stamp")
    local text = table.concat(r.steps[1].lines, "\n")
    check(text:find("Cells:", 1, true) and text:find("Terrain overlay:", 1, true) and text:find("probe:", 1, true) and text:find("Eye probe", 1, true), "the checks' chat lines are captured: " .. text:sub(1, 160))
    check(not text:find("|cff", 1, true) and not text:find("|r", 1, true), "colour codes are stripped from the saved lines")
    check(r.steps[1].screenshot == "pending" and screenshots == 0, "the screenshot waits half a second")
    step(0.6)
    check(screenshots == 1 and r.steps[1].screenshot:find("taken", 1, true), "the screenshot is taken after the delay: " .. tostring(r.steps[1].screenshot))
    slash("box show")
    click(2) -- terrain on + test
    check(ns.Terrain.IsEnabled() and not _G.FidelityEMatrixFrame.shown, "the terrain test step hides the box")
    click(3) -- cam 0, pressed before the previous shot's half second has passed
    check(r.steps[2].screenshot:find("not taken", 1, true), "a step pressed within the half second supersedes the pending shot: " .. tostring(r.steps[2].screenshot))
    step(0.6)
    check(screenshots == 2, "only the superseding step's own shot is taken, got " .. screenshots)
    click(9) -- test off
    check(_G.FidelityEMatrixFrame.shown, "test off shows the box again")
    check(#r.steps == 4 and r.steps[4].screenshot == "none", "a step without a shot says so")
    click(11) -- save
    check(reloads == 1, "save reloads the UI to write the file")
    click(12) -- clear
    check(#FidelityEMatrix_Report.steps == 0, "clear empties the report")
    printed = {}
    slash("report status")
    check(printed[1] and printed[1]:find("0 step(s)", 1, true) and printed[1]:find("2 screenshot(s)", 1, true), "status counts steps and screenshots: " .. tostring(printed[1]))
    slash("report hide")
    check(not p.shown, "panel hidden")
    slash("box hide")
    if terrainWas then slash("terrain on") else slash("terrain off") end
    step(0.6)
end)

test("every slash command runs without an addon error", function()
    printed = {}
    for _, cmd in ipairs({ "help", "diag", "status", "scene target", "scene player", "spin 1", "parallax 0.5",
        "lens 0.4", "backdrop black", "backdrop nebula", "stereo", "stereo", "stereo", "stereo",
        "stereo delta 0.08", "stereo pixels 6", "stereo mix 0.6", "stereo off", "calibrate", "calibrate side",
        "calibrate side", "calibrate turn", "calibrate turn", "scale 1.2", "scale 1", "toggle", "toggle",
        "world", "world status", "world frame dressup", "world frame player", "world parallax 120", "world height 1.8", "world off", "world bogus",
        "terrain", "terrain status", "terrain fov 60", "terrain head 2", "terrain pitch 30", "terrain autopitch",
        "terrain backdrop dim", "terrain backdrop none", "terrain probe", "report", "report", "report status", "report clear", "report bogus", "terrain loader id", "terrain loader path", "terrain off", "terrain bogus",
        "overlay", "overlay", "overlay on", "overlay off", "full", "full off", "box", "box show", "box hide",
        "eye", "eye setup", "eye probe", "eye stick 2", "eye depth off", "eye gain 1.5", "eye gain 1", "eye calibrate", "eye source gamepad", "eye source cursor",
        "eye invert", "eye invert", "eye inverty", "eye inverty", "stereo bogus", "box bogus", "overlay bogus", "help", "help all",
        "cells", "bind", "bind status", "bind on", "bind off", "bind bogus", "bogus" }) do
        slash(cmd)
        step(0.05)
    end
    check(#lastErrors() == 0, table.concat(lastErrors(), " | "))
end)

out[#out + 1] = string.format("DONE %d %d", pass, fail)
return table.concat(out, "\n")
