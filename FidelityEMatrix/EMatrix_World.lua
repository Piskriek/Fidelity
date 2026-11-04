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
-- A band change must be seen on BAND_CONFIRM consecutive scans before the copy switches, so a
-- unit hovering at a band edge does not jump in size every scan.
-- Parallax and the anaglyph pair spread use ParallaxShift(eye, z) like everything else.
-- Stereo here is anaglyph only: a side-by-side pair cannot be laid over a single mono world.
-- The copies face the camera and turn only with the eye; they never spin with the window's
-- turntable.

local ADDON_NAME, ns = ...
local Math = ns.Math or _G.EMatrix_Math
local World = {}
ns.World = World

local MAX_ACTORS = 8          -- actors drawn (each is up to 3 model frames)
local REFRESH_INTERVAL = 0.25 -- seconds between nameplate scans (parallax tracks every frame)
local STEREO_REF_Z = 0.5      -- depth at which the pair offset equals stereoPixels
local HEAD_OFFSET = 6         -- pixels from the nameplate's bottom down to the model's top
local FACING_TILT = 0.55      -- radians the copy turns per unit of eye offset (as the window)
local BAND_CONFIRM = 2        -- scans a new band must be seen before the actor switches (hysteresis)
-- Each range band: parallax depth z (the window's scale) and the distance in yards from the
-- player along the view axis that stands for the band (its middle). The copy's height on screen
-- comes from the same camera model the terrain overlay uses: focal * unitHeight / (zoom + depth),
-- so copies shrink with distance like the real units do (v1.6.1 used fixed pixel heights three
-- to four times the real size, the owner's screenshot of 04 Nov).
local BAND = {                -- { z, yards from the player }
    near = { 0.15, 7 },
    mid = { 0.50, 18 },
    far = { 1.20, 45 },
    unknown = { 0.50, 18 },
}
local PLAYER_Z, PLAYER_HEIGHT_YD = 0.15, 2.0
local FRAME_TYPES = {         -- the frame type that takes SetUnit for a copy; /fide world frame switches
    player = { "PlayerModel", "DressUpModel" },   -- the standard for 3D portraits of any unit (default)
    dressup = { "DressUpModel", "PlayerModel" },  -- v1.6.1's choice: textured for the player, white for NPCs in the game
}

local overlay                 -- full-screen frame under the UI
local pool = {}               -- actor slots: { unit, plate, band, mono, left, right, z, h, used }
local generation = 0          -- bumped when the pool is rebuilt (frame names stay unique)
local refreshAge = 0
local enabled = false
local suspended = nil         -- reason text while the overlay stopped itself after errors (saved choice untouched)
local errors = { count = 0, last = nil }
World.errors = errors

local function Cfg(k) return ns.Cfg(k) end

--- The camera's focal length (UI units) and zoom (yards): the size of every copy follows them.
local function CameraScale()
    local sh = GetScreenHeight() or 1080
    local fov = FidelityEMatrix_Config and tonumber(FidelityEMatrix_Config.terrainFovY) or 1.0
    if not fov or fov < 0.1 or fov > 3.0 then fov = 1.0 end
    local zoom = GetCameraZoom and GetCameraZoom() or 8
    if type(zoom) ~= "number" or zoom ~= zoom or zoom < 0.5 then zoom = 8 end
    return (sh * 0.5) / math.tan(fov * 0.5), zoom
end
World.CameraScale = CameraScale

-- ---------------------------------------------------------------------------
-- Actor pool
-- ---------------------------------------------------------------------------
local function NewModel(name)
    local kinds = FRAME_TYPES[Cfg("worldFrameType")] or FRAME_TYPES.player
    for _, kind in ipairs(kinds) do
        local ok, m = pcall(CreateFrame, kind, name, overlay)
        if ok and m then
            m:SetFrameLevel(2)
            m:EnableMouse(false)
            m:Hide()
            return m
        end
    end
    return nil
end

local function GetSlot(i)
    local s = pool[i]
    if s then return s end
    s = { used = false, z = 0.5, h = 150 }
    local tag = generation > 0 and ("G" .. generation .. "_") or ""
    s.mono = NewModel("FidelityEMatrix_World" .. tag .. i)
    s.left = NewModel("FidelityEMatrix_WorldL" .. tag .. i)
    s.right = NewModel("FidelityEMatrix_WorldR" .. tag .. i)
    pool[i] = s
    return s
end

--- A copy lives under its nameplate: the client then scales it with the plate's distance scaling
--- and hides it with the plate. Released copies go back under the overlay.
local function Parent(model, parent)
    if not model or not model.SetParent then return end
    if model.__parent == parent then return end
    pcall(model.SetParent, model, parent)
    model.__parent = parent
    model:SetFrameLevel(2)
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
    model.__anchorPlate = nil -- a new unit is anchored afresh
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
    -- out of range the client answers nil (older clients) or false: both mean "not within"
    if ok3 and ok4 then return "far" end
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
--- Re-anchors only when something changed: ClearAllPoints + SetPoint every frame for every
--- actor is needless layout work while the eye is still.
local function Anchor(model, s, dx, dy)
    local plate = s.plate or UIParent
    if model.__anchorPlate == plate and model.__anchorX == dx and model.__anchorY == dy and model.__anchorH == s.h then return end
    model.__anchorPlate, model.__anchorX, model.__anchorY, model.__anchorH = plate, dx, dy, s.h
    model:ClearAllPoints()
    model:SetSize(s.h * 0.75, s.h)
    if s.plate then
        model:SetPoint("TOP", s.plate, "BOTTOM", dx, dy - HEAD_OFFSET)
    else
        local sw, sh = GetScreenWidth() or 1920, GetScreenHeight() or 1080
        model:SetPoint("BOTTOM", UIParent, "BOTTOMLEFT", sw * 0.5 + dx, sh * 0.12 + dy)
    end
end

function World.Layout(eyeX, eyeY)
    if not overlay then return end
    local anaglyph = Cfg("stereoMode") == "anaglyph"
    local px, delta = Cfg("stereoPixels"), Cfg("stereoDelta")
    local turnSign = Cfg("turnSign")
    local gain = Cfg("worldParallaxPx") * (ns.EyeGain and ns.EyeGain() or 1)
    -- the copy faces the camera and turns with the eye only (the window's turntable is not ours)
    local turn = -turnSign * eyeX * FACING_TILT
    for i = 1, MAX_ACTORS do
        local s = pool[i]
        if s and s.used then
            local shiftX = Math.ParallaxShift(eyeX, s.z) * gain
            local shiftY = Math.ParallaxShift(eyeY, s.z) * gain
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
    s.band = nil
    s.nextBand, s.nextBandSeen = nil, nil
    if s.mono then s.mono:Hide(); s.mono.__anchorPlate = nil; Parent(s.mono, overlay) end
    if s.left then s.left:Hide(); s.left.__anchorPlate = nil; Parent(s.left, overlay) end
    if s.right then s.right:Hide(); s.right.__anchorPlate = nil; Parent(s.right, overlay) end
end

--- The band to use for a slot this scan: a change must be seen BAND_CONFIRM scans in a row.
local function ConfirmBand(s, band)
    if not s.band or s.band == band then
        s.nextBand, s.nextBandSeen = nil, nil
        return band
    end
    if s.nextBand == band then s.nextBandSeen = s.nextBandSeen + 1 else s.nextBand, s.nextBandSeen = band, 1 end
    if s.nextBandSeen >= BAND_CONFIRM then
        s.nextBand, s.nextBandSeen = nil, nil
        return band
    end
    return s.band
end

local refreshCount = 0

local function Refresh()
    refreshCount = refreshCount + 1
    local found = World.Scan()
    local n = math.min(#found, MAX_ACTORS)
    local focal, zoom = CameraScale()
    local unitHeight = Cfg("worldUnitHeight")
    -- Stable slots: a unit keeps its slot while it stays among the nearest, so no SetUnit churn
    -- when the sort order shifts. Slots whose unit left are released (and hidden) first, then the
    -- newcomers take the free slots.
    for i = 1, MAX_ACTORS do
        local s = GetSlot(i)
        if s.used then
            local keep = nil
            for j = 1, n do
                local f = found[j]
                if not f.slot and f.unit == s.unit and f.plate == s.plate then keep = f; break end
            end
            if keep then keep.slot = s else HideSlot(s) end
        end
    end
    for j = 1, n do
        local f = found[j]
        if not f.slot then
            for i = 1, MAX_ACTORS do
                local s = GetSlot(i)
                if not s.used then f.slot = s; break end
            end
        end
        local s = f.slot
        if s then
            if f.band == "player" then
                s.z, s.h, s.band = PLAYER_Z, focal * PLAYER_HEIGHT_YD / zoom, "player"
            else
                local band = ConfirmBand(s, f.band)
                local b = BAND[band] or BAND.unknown
                s.z, s.h, s.band = b[1], focal * unitHeight / (zoom + b[2]), band
            end
            if not s.used then
                s.unit, s.plate = f.unit, f.plate
                Parent(s.mono, f.plate or overlay); Parent(s.left, f.plate or overlay); Parent(s.right, f.plate or overlay)
                local ok = SetUnitOn(s.mono, f.unit)
                if ok and s.left then ok = SetUnitOn(s.left, f.unit) end
                if ok and s.right then ok = SetUnitOn(s.right, f.unit) end
                if ok then
                    s.used = true
                    ns.ApplyLight(s.mono, ns.LIGHTS.mono)
                    ns.ApplyLight(s.left, ns.LIGHTS.red)
                    ns.ApplyLight(s.right, ns.LIGHTS.cyan)
                else
                    -- a copy that could not take the unit must not keep showing the last one
                    HideSlot(s)
                end
            end
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
        local eyeX, eyeY = ns.GetEye()
        World.Layout(eyeX, eyeY)
    end)
    if not ok then
        errors.count = errors.count + 1
        errors.last = tostring(err)
        if errors.count >= 3 then
            World.Suspend(errors.last)
            print("|cffff3333[Fidelity EMatrix]|r World overlay stopped after repeated errors (your saved setting is unchanged; /fide world on retries): " .. errors.last)
        end
    end
end

-- ---------------------------------------------------------------------------
-- Enable / disable / status
-- ---------------------------------------------------------------------------
local function Stop()
    if not overlay then return end
    overlay:SetScript("OnUpdate", nil)
    for i = 1, #pool do HideSlot(pool[i]) end
    overlay:Hide()
end

--- Stops the overlay after errors WITHOUT touching the saved choice, so the next login still
--- starts it and /fide world on retries now.
function World.Suspend(reason)
    enabled = false
    suspended = reason or "unknown error"
    Stop()
end

function World.SetEnabled(on)
    enabled = on and true or false
    suspended = nil
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
    else
        Stop()
    end
end

function World.IsEnabled() return enabled end
function World.IsSuspended() return suspended end

--- Drops every copy and starts a fresh pool (after /fide world frame): frames cannot be destroyed,
--- so the old ones stay hidden under the overlay and the new ones get a new generation tag.
function World.Rebuild()
    local wasOn = enabled
    for i = #pool, 1, -1 do HideSlot(pool[i]); pool[i] = nil end
    generation = generation + 1
    if wasOn then refreshAge = REFRESH_INTERVAL end
end

function World.ActorCount()
    local n = 0
    for i = 1, #pool do if pool[i].used then n = n + 1 end end
    return n
end

function World.Command(args, say)
    local sub = args[2] or "toggle"
    local v = tonumber(args[3])
    if sub == "on" then World.SetEnabled(true)
    elseif sub == "off" then World.SetEnabled(false)
    elseif sub == "toggle" then World.SetEnabled(not enabled)
    elseif sub == "status" then
        local bands = {}
        for i = 1, #pool do local s = pool[i]; if s.used then bands[#bands + 1] = string.format("%s:%s:%.0fpx", tostring(s.unit), tostring(s.band), s.h or 0) end end
        local focal, zoom = CameraScale()
        local kind = pool[1] and pool[1].mono and pool[1].mono.GetObjectType and pool[1].mono:GetObjectType() or "none yet"
        say("World overlay: %s, %d actor(s) [%s], frames %s (%s), unit height %.1f yd, camera focal %.0f zoom %.1f, parallax %d px, stereo %s, errors %d%s",
            enabled and "ON" or (suspended and ("SUSPENDED after errors: " .. suspended) or "off"), World.ActorCount(), table.concat(bands, " "),
            tostring(kind), Cfg("worldFrameType"), Cfg("worldUnitHeight"), focal, zoom, Cfg("worldParallaxPx"),
            Cfg("stereoMode"), errors.count, errors.last and (" (last: " .. errors.last .. ")") or "")
        return
    elseif sub == "frame" and FRAME_TYPES[args[3] or ""] then
        FidelityEMatrix_Config.worldFrameType = args[3]
        World.Rebuild()
        say("World copies use %s frames first (%s). Rebuilt; /fide world status shows the type that took.", FRAME_TYPES[args[3]][1], args[3])
        return
    elseif sub == "parallax" and v and v >= 0 and v <= 400 then
        FidelityEMatrix_Config.worldParallaxPx = math.floor(v)
        say("World parallax: %d px per unit of eye (0 = copies stay on their units)", FidelityEMatrix_Config.worldParallaxPx)
        return
    elseif sub == "height" and v and v >= 0.5 and v <= 5 then
        FidelityEMatrix_Config.worldUnitHeight = v
        say("Nominal unit height: %.1f yd (copies are sized as focal * height / distance)", v)
        return
    else
        say("Usage: /fide world <on|off|toggle|status|frame <player|dressup>|parallax <0..400>|height <0.5..5>>")
        return
    end
    say("World overlay %s: the player and nameplate units re-rendered over the game, anchored to their nameplates, depth from range bands%s. Terrain and scenery cannot be rebuilt here (see /fide terrain).",
        enabled and "ON" or "OFF", Cfg("stereoMode") == "anaglyph" and ", red/cyan pairs" or " (use /fide stereo anaglyph for glasses)")
end

-- Test / dump access
World._pool = pool
World._scratch = scratch
World._overlay = function() return overlay end
World._refreshCount = function() return refreshCount end
World.BAND_CONFIRM = BAND_CONFIRM
