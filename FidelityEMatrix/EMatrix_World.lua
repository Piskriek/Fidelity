-- FidelityEMatrix/EMatrix_World.lua
-- World overlay: the actors of the live scene re-rendered over the game with depth.
--
-- What an addon can and cannot do here (RULES 8a, no claims beyond the API):
--   CAN   draw a model for any unit it has an id for: the player and every unit with a nameplate
--         (players, NPCs, mobs within nameplate range), at that nameplate's screen position.
--   CANNOT see terrain, trees, buildings or units without nameplates, or read a unit's distance
--         directly. So the ground and scenery stay the game's own flat picture; the actors float
--         over it with per-depth parallax and red/cyan disparity.
--
-- Depth estimate: for ground units with the camera behind and above the player, a nameplate
-- lower on the screen is nearer. depth z = EMatrix_Math.DepthFromScreenY(plateY, playerY, horizonY):
-- 0.15 at the player's own height, rising toward the horizon. Everything then uses the same
-- ParallaxShift(eye, z) as the window, so near actors move less with the eye than far ones and
-- their anaglyph pair sits further apart the deeper they are.
--
-- Stereo here is anaglyph only: a side-by-side pair cannot be laid over a single mono world.

local ADDON_NAME, ns = ...
local Math = ns.Math or _G.EMatrix_Math
local World = {}
ns.World = World

local MAX_ACTORS = 8          -- nearest actors drawn (each is up to 3 model frames)
local REFRESH_INTERVAL = 0.10 -- seconds between nameplate scans (positions track every frame)
local BASE_HEIGHT = 300       -- model frame height for an actor at depth 0 (pixels at UI scale)
local MIN_HEIGHT = 48
local PX_GAIN = 60            -- screen pixels per unit of ParallaxShift (same as the window)
local STEREO_REF_Z = 0.5      -- depth at which the pair offset equals stereoPixels

local overlay                 -- full-screen frame under the UI
local pool = {}               -- actor slots: { unit, plate, mono, left, right, z, x, y, h, used }
local refreshAge = 0
local enabled = false
local lastEyeX, lastEyeY = 0, 0

local function Cfg(k) return ns.Cfg(k) end

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
    s = { used = false, z = 0.5, x = 0, y = 0, h = BASE_HEIGHT }
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
-- Scan: which units are on screen, and how deep
-- ---------------------------------------------------------------------------
local scratch = {} -- reused: { unit, x, y, z }

--- A frame's centre in UIParent coordinates (nameplates are not children of UIParent).
local function CenterInUI(frame)
    if not frame or not frame.GetCenter then return nil end
    local x, y = frame:GetCenter()
    if not x or not y then return nil end
    local fs = frame.GetEffectiveScale and frame:GetEffectiveScale() or 1
    local us = UIParent and UIParent.GetEffectiveScale and UIParent:GetEffectiveScale() or 1
    if not fs or fs == 0 or not us or us == 0 then return x, y end
    return x * fs / us, y * fs / us
end
World.CenterInUI = CenterInUI

local function PlayerScreenY()
    -- The player's own nameplate when the client shows one, else the usual third-person spot
    local h = (GetScreenHeight() or 1080)
    if C_NamePlate and C_NamePlate.GetNamePlateForUnit then
        local _, y = CenterInUI(C_NamePlate.GetNamePlateForUnit("player"))
        if y then return y end
    end
    return h * 0.40
end

function World.Scan()
    for i = 1, #scratch do scratch[i] = nil end
    if not (C_NamePlate and C_NamePlate.GetNamePlates) then return scratch end
    local plates = C_NamePlate.GetNamePlates()
    if type(plates) ~= "table" then return scratch end
    local sw, sh = GetScreenWidth() or 1920, GetScreenHeight() or 1080
    local playerY = PlayerScreenY()
    local horizonY = sh * 0.72
    for _, plate in ipairs(plates) do
        local unit = plate.namePlateUnitToken or (plate.UnitFrame and plate.UnitFrame.unit)
        if unit and UnitExists and UnitExists(unit) and not (UnitIsUnit and UnitIsUnit(unit, "player")) and plate.GetCenter then
            local x, y = CenterInUI(plate)
            if x and y and x >= 0 and x <= sw and y >= 0 and y <= sh then
                scratch[#scratch + 1] = { unit = unit, x = x, y = y, z = Math.DepthFromScreenY(y, playerY, horizonY) }
            end
        end
    end
    -- the player, at the bottom-centre reference, nearest of all
    scratch[#scratch + 1] = { unit = "player", x = sw * 0.5, y = playerY, z = Math.DepthFromScreenY(playerY, playerY, horizonY) }
    table.sort(scratch, function(a, b) return a.z < b.z end)
    return scratch
end

-- ---------------------------------------------------------------------------
-- Layout: place each actor's frames for the current eye and stereo mode
-- ---------------------------------------------------------------------------
local function Place(model, x, y, h, dxExtra)
    model:ClearAllPoints()
    model:SetSize(h * 0.75, h)
    -- the nameplate sits above the head: anchor the frame's top just above it
    model:SetPoint("TOP", UIParent, "BOTTOMLEFT", x + dxExtra, y + h * 0.08)
end

function World.Layout(eyeX, eyeY, facing)
    if not overlay then return end
    local anaglyph = Cfg("stereoMode") == "anaglyph"
    local px, delta = Cfg("stereoPixels"), Cfg("stereoDelta")
    local sideSign, turnSign = Cfg("sideSign"), Cfg("turnSign")
    for i = 1, MAX_ACTORS do
        local s = pool[i]
        if s and s.used then
            local shiftX = Math.ParallaxShift(eyeX, s.z) * PX_GAIN
            local shiftY = Math.ParallaxShift(eyeY, s.z) * PX_GAIN
            local turn = facing - turnSign * eyeX * 0.55
            -- pair offset grows with depth: an actor at the reference depth gets stereoPixels
            local pair = px * Math.ParallaxShift(1, s.z) / Math.ParallaxShift(1, STEREO_REF_Z)
            if anaglyph then
                if s.mono then s.mono:Hide() end
                if s.left and s.right then
                    Place(s.left, s.x + shiftX, s.y + shiftY, s.h, -pair)
                    Place(s.right, s.x + shiftX, s.y + shiftY, s.h, pair)
                    local fl, fr = Math.StereoFacings(turn, turnSign * delta)
                    ns.FaceModel(s.left, fl); ns.FaceModel(s.right, fr)
                    s.left:SetAlpha(1.0); s.right:SetAlpha(Cfg("anaglyphMix"))
                    s.left:Show(); s.right:Show()
                end
            else
                if s.left then s.left:Hide() end
                if s.right then s.right:Hide() end
                if s.mono then
                    Place(s.mono, s.x + shiftX, s.y + shiftY, s.h, 0)
                    ns.FaceModel(s.mono, turn)
                    s.mono:SetAlpha(1.0)
                    s.mono:Show()
                end
            end
        end
    end
    lastEyeX, lastEyeY = eyeX, eyeY
end

local function Refresh()
    local found = World.Scan()
    local n = math.min(#found, MAX_ACTORS)
    for i = 1, MAX_ACTORS do
        local s = GetSlot(i)
        local f = found[i]
        if i <= n and f then
            local h = math.max(MIN_HEIGHT, BASE_HEIGHT / (1 + f.z * 2.2))
            s.x, s.y, s.z, s.h = f.x, f.y, f.z, h
            if s.unit ~= f.unit or not s.used then
                s.unit = f.unit
                local ok = SetUnitOn(s.mono, f.unit)
                SetUnitOn(s.left, f.unit); SetUnitOn(s.right, f.unit)
                s.used = ok
                ns.ApplyLight(s.mono, ns.LIGHTS.mono)
                ns.ApplyLight(s.left, ns.LIGHTS.red)
                ns.ApplyLight(s.right, ns.LIGHTS.cyan)
            end
        else
            if s.used then
                s.used = false
                s.unit = nil
                if s.mono then s.mono:Hide() end
                if s.left then s.left:Hide() end
                if s.right then s.right:Hide() end
            end
        end
    end
end

local function OnUpdate(self, dt)
    refreshAge = refreshAge + dt
    if refreshAge >= REFRESH_INTERVAL then
        refreshAge = 0
        Refresh()
    end
    local eyeX, eyeY, facing = ns.GetEye()
    World.Layout(eyeX, eyeY, facing)
end

-- ---------------------------------------------------------------------------
-- Enable / disable / status
-- ---------------------------------------------------------------------------
function World.SetEnabled(on)
    enabled = on and true or false
    FidelityEMatrix_Config.worldOverlay = enabled
    if enabled then
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
        Refresh()
        local ex, ey, f = ns.GetEye()
        World.Layout(ex, ey, f)
    elseif overlay then
        overlay:SetScript("OnUpdate", nil)
        for i = 1, #pool do
            local s = pool[i]
            s.used = false; s.unit = nil
            if s.mono then s.mono:Hide() end
            if s.left then s.left:Hide() end
            if s.right then s.right:Hide() end
        end
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
        say("World overlay: %s, %d actor(s) drawn, stereo %s", enabled and "ON" or "off", World.ActorCount(), Cfg("stereoMode"))
        return
    else
        say("Usage: /fide world <on|off|toggle|status>")
        return
    end
    say("World overlay %s: the player and nameplate units re-rendered over the game with depth parallax%s. Terrain and scenery cannot be rebuilt (no API for them).",
        enabled and "ON" or "OFF", Cfg("stereoMode") == "anaglyph" and " and red/cyan disparity" or " (use /fide stereo anaglyph for glasses)")
end

-- Test / dump access
World._pool = pool
World._scratch = scratch
World._overlay = function() return overlay end
