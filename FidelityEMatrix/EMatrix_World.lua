-- FidelityEMatrix/EMatrix_World.lua
-- World overlay: the actors of the live scene re-rendered over the game with depth.
--
-- What an addon can and cannot do here (RULES 8a, no claims beyond the API):
--   CAN    draw a model for any unit it has an id for: the player and every unit with a nameplate
--          (players, NPCs, mobs within nameplate range), and ANCHOR that model to the nameplate so
--          the engine places it over the unit.
--   CANNOT read where a nameplate is: the client refuses "Can't measure restricted regions" for
--          GetCenter/GetLeft/... on nameplate frames (seen on TBC Anniversary 2.5.6). So depth is
--          not taken from the screen; it comes from the game's own range checks:
--          CheckInteractDistance(unit, 3) = within about 10 yd, (unit, 4) = within about 28 yd.
--   CANNOT see terrain, trees, buildings or units without nameplates (EMatrix_Terrain draws the
--          map's placements from the game's own tiles instead).
--
-- Depth bands -> z (the same scale as the window): near 0.15, mid 0.5, far 1.2, unknown 0.5.
-- Parallax and the anaglyph pair spread use ParallaxShift(eye, z) like everything else.
-- Stereo here is anaglyph only: a side-by-side pair cannot be laid over a single mono world.

local ADDON_NAME, ns = ...
local Math = ns.Math or _G.EMatrix_Math
local World = {}
ns.World = World

local MAX_ACTORS = 8          -- actors drawn (each is up to 3 model frames)
local REFRESH_INTERVAL = 0.25 -- seconds between nameplate scans (parallax tracks every frame)
local PX_GAIN = 60            -- screen pixels per unit of ParallaxShift (same as the window)
local STEREO_REF_Z = 0.5      -- depth at which the pair offset equals stereoPixels
local HEAD_OFFSET = 6         -- pixels from the nameplate's bottom down to the model's top
local BAND = {                -- { z, model height in pixels }
    near = { 0.15, 230 },
    mid = { 0.50, 150 },
    far = { 1.20, 95 },
    unknown = { 0.50, 150 },
}
local PLAYER_Z, PLAYER_HEIGHT = 0.15, 300

local overlay                 -- full-screen frame under the UI
local pool = {}               -- actor slots: { unit, plate, mono, left, right, z, h, used }
local refreshAge = 0
local enabled = false
local errors = { count = 0, last = nil }
World.errors = errors

local function Cfg(k) return ns.Cfg(k) end

--- A frame's centre in UIParent coordinates. Only for frames an addon may measure (NOT nameplates).
local function CenterInUI(frame)
    if not frame or not frame.GetCenter then return nil end
    local ok, x, y = pcall(frame.GetCenter, frame)
    if not ok or not x or not y then return nil end
    local fs = frame.GetEffectiveScale and frame:GetEffectiveScale() or 1
    local us = UIParent and UIParent.GetEffectiveScale and UIParent:GetEffectiveScale() or 1
    if not fs or fs == 0 or not us or us == 0 then return x, y end
    return x * fs / us, y * fs / us
end
World.CenterInUI = CenterInUI

-- ---------------------------------------------------------------------------
-- Actor pool
-- ---------------------------------------------------------------------------
local function NewModel(name)
    local okDM, m = pcall(CreateFrame, "DressUpModel", name, overlay)
    if not (okDM and m) then
        local okPM, pm = pcall(CreateFrame, "PlayerModel", name, overlay)
        if not (okPM and pm) then return nil end
        m = pm
    end
    m:SetFrameLevel(2)
    m:EnableMouse(false)
    m:Hide()
    return m
end

local function GetSlot(i)
    local s = pool[i]
    if s then return s end
    s = { used = false, z = 0.5, h = 150 }
    s.mono = NewModel("FidelityEMatrix_World" .. i)
    s.left = NewModel("FidelityEMatrix_WorldL" .. i)
    s.right = NewModel("FidelityEMatrix_WorldR" .. i)
    pool[i] = s
    return s
end

local function SetUnitOn(model, unit)
    if not model then return false end
    local ok = pcall(function()
        model:SetUnit(unit)
        if model.SetDefaultModelPosition then model:SetDefaultModelPosition() end
        ns.PlaceModel(model, 0, 0)
        ns.FaceModel(model, 0)
    end)
    -- idle animation (0) so the copy breathes like the original
    pcall(function() if model.SetAnimation then model:SetAnimation(0) elseif model.SetSequence then model:SetSequence(0) end end)
    return ok
end

-- ---------------------------------------------------------------------------
-- Scan: which units have nameplates, and how far they are (range bands, no measuring)
-- ---------------------------------------------------------------------------
local scratch = {} -- reused: { unit, plate, band }

local function RangeBand(unit)
    if not CheckInteractDistance then return "unknown" end
    local ok3, near = pcall(CheckInteractDistance, unit, 3)
    if ok3 and near then return "near" end
    local ok4, mid = pcall(CheckInteractDistance, unit, 4)
    if ok4 and mid then return "mid" end
    if ok3 and ok4 and near == false and mid == false then return "far" end
    return "unknown"
end
World.RangeBand = RangeBand

function World.Scan()
    for i = #scratch, 1, -1 do scratch[i] = nil end
    if C_NamePlate and C_NamePlate.GetNamePlates then
        local plates = C_NamePlate.GetNamePlates()
        if type(plates) == "table" then
            for _, plate in ipairs(plates) do
                local unit = plate.namePlateUnitToken or (plate.UnitFrame and plate.UnitFrame.unit)
                if unit and UnitExists and UnitExists(unit) and not (UnitIsUnit and UnitIsUnit(unit, "player")) then
                    scratch[#scratch + 1] = { unit = unit, plate = plate, band = RangeBand(unit) }
                end
            end
        end
    end
    local order = { near = 1, mid = 2, unknown = 3, far = 4 }
    table.sort(scratch, function(a, b)
        local oa, ob = order[a.band] or 3, order[b.band] or 3
        if oa ~= ob then return oa < ob end
        return a.unit < b.unit
    end)
    -- the player, anchored at the bottom centre (no nameplate needed), nearest of all
    table.insert(scratch, 1, { unit = "player", plate = nil, band = "player" })
    return scratch
end

-- ---------------------------------------------------------------------------
-- Layout: anchor each actor to its nameplate (or the screen for the player), shifted by parallax
-- ---------------------------------------------------------------------------
local function Anchor(model, s, dx, dy)
    model:ClearAllPoints()
    model:SetSize(s.h * 0.75, s.h)
    if s.plate then
        model:SetPoint("TOP", s.plate, "BOTTOM", dx, dy - HEAD_OFFSET)
    else
        local sw, sh = GetScreenWidth() or 1920, GetScreenHeight() or 1080
        model:SetPoint("BOTTOM", UIParent, "BOTTOMLEFT", sw * 0.5 + dx, sh * 0.12 + dy)
    end
end

function World.Layout(eyeX, eyeY, facing)
    if not overlay then return end
    local anaglyph = Cfg("stereoMode") == "anaglyph"
    local px, delta = Cfg("stereoPixels"), Cfg("stereoDelta")
    local turnSign = Cfg("turnSign")
    for i = 1, MAX_ACTORS do
        local s = pool[i]
        if s and s.used then
            local shiftX = Math.ParallaxShift(eyeX, s.z) * PX_GAIN
            local shiftY = Math.ParallaxShift(eyeY, s.z) * PX_GAIN
            local turn = facing - turnSign * eyeX * 0.55
            local pair = px * Math.ParallaxShift(1, s.z) / Math.ParallaxShift(1, STEREO_REF_Z)
            if anaglyph then
                if s.mono then s.mono:Hide() end
                if s.left and s.right then
                    Anchor(s.left, s, shiftX - pair, shiftY)
                    Anchor(s.right, s, shiftX + pair, shiftY)
                    local fl, fr = Math.StereoFacings(turn, turnSign * delta)
                    ns.FaceModel(s.left, fl); ns.FaceModel(s.right, fr)
                    s.left:SetAlpha(1.0); s.right:SetAlpha(Cfg("anaglyphMix"))
                    s.left:Show(); s.right:Show()
                end
            else
                if s.left then s.left:Hide() end
                if s.right then s.right:Hide() end
                if s.mono then
                    Anchor(s.mono, s, shiftX, shiftY)
                    ns.FaceModel(s.mono, turn)
                    s.mono:SetAlpha(1.0)
                    s.mono:Show()
                end
            end
        end
    end
end

local function HideSlot(s)
    s.used = false
    s.unit = nil
    s.plate = nil
    if s.mono then s.mono:Hide() end
    if s.left then s.left:Hide() end
    if s.right then s.right:Hide() end
end

local function Refresh()
    local found = World.Scan()
    local n = math.min(#found, MAX_ACTORS)
    for i = 1, MAX_ACTORS do
        local s = GetSlot(i)
        local f = found[i]
        if i <= n and f then
            if f.band == "player" then
                s.z, s.h = PLAYER_Z, PLAYER_HEIGHT
            else
                local b = BAND[f.band] or BAND.unknown
                s.z, s.h = b[1], b[2]
            end
            s.band = f.band
            if s.unit ~= f.unit or s.plate ~= f.plate or not s.used then
                s.unit, s.plate = f.unit, f.plate
                local ok = SetUnitOn(s.mono, f.unit)
                SetUnitOn(s.left, f.unit); SetUnitOn(s.right, f.unit)
                s.used = ok
                ns.ApplyLight(s.mono, ns.LIGHTS.mono)
                ns.ApplyLight(s.left, ns.LIGHTS.red)
                ns.ApplyLight(s.right, ns.LIGHTS.cyan)
            end
        elseif s.used then
            HideSlot(s)
        end
    end
end

local function OnUpdate(self, dt)
    local ok, err = pcall(function()
        refreshAge = refreshAge + dt
        if refreshAge >= REFRESH_INTERVAL then
            refreshAge = 0
            Refresh()
        end
        local eyeX, eyeY, facing = ns.GetEye()
        World.Layout(eyeX, eyeY, facing)
    end)
    if not ok then
        errors.count = errors.count + 1
        errors.last = tostring(err)
        if errors.count >= 3 then
            World.SetEnabled(false)
            print("|cffff3333[Fidelity EMatrix]|r World overlay stopped after repeated errors: " .. errors.last)
        end
    end
end

-- ---------------------------------------------------------------------------
-- Enable / disable / status
-- ---------------------------------------------------------------------------
function World.SetEnabled(on)
    enabled = on and true or false
    FidelityEMatrix_Config.worldOverlay = enabled
    if enabled then
        errors.count = 0
        if not overlay then
            overlay = CreateFrame("Frame", "FidelityEMatrix_WorldOverlay", UIParent)
            overlay:SetAllPoints(UIParent)
            overlay:SetFrameStrata("BACKGROUND")
            overlay:SetFrameLevel(1)
            overlay:EnableMouse(false)
        end
        overlay:Show()
        overlay:SetScript("OnUpdate", OnUpdate)
        refreshAge = REFRESH_INTERVAL
        OnUpdate(overlay, 0)
    elseif overlay then
        overlay:SetScript("OnUpdate", nil)
        for i = 1, #pool do HideSlot(pool[i]) end
        overlay:Hide()
    end
end

function World.IsEnabled() return enabled end

function World.ActorCount()
    local n = 0
    for i = 1, #pool do if pool[i].used then n = n + 1 end end
    return n
end

function World.Command(args, say)
    local sub = args[2] or "toggle"
    if sub == "on" then World.SetEnabled(true)
    elseif sub == "off" then World.SetEnabled(false)
    elseif sub == "toggle" then World.SetEnabled(not enabled)
    elseif sub == "status" then
        local bands = {}
        for i = 1, #pool do local s = pool[i]; if s.used then bands[#bands + 1] = tostring(s.unit) .. ":" .. tostring(s.band) end end
        say("World overlay: %s, %d actor(s) [%s], stereo %s, errors %d%s", enabled and "ON" or "off", World.ActorCount(), table.concat(bands, " "),
            Cfg("stereoMode"), errors.count, errors.last and (" (last: " .. errors.last .. ")") or "")
        return
    else
        say("Usage: /fide world <on|off|toggle|status>")
        return
    end
    say("World overlay %s: the player and nameplate units re-rendered over the game, anchored to their nameplates, depth from range bands%s. Terrain and scenery cannot be rebuilt here (see /fide terrain).",
        enabled and "ON" or "OFF", Cfg("stereoMode") == "anaglyph" and ", red/cyan pairs" or " (use /fide stereo anaglyph for glasses)")
end

-- Test / dump access
World._pool = pool
World._scratch = scratch
World._overlay = function() return overlay end
