-- FidelityEMatrix/EMatrix_Core.lua
-- Single master frame, zero-GC scoreboard wave, and a window into a 3D box.
--
-- Depth planes, back to front (z: 0 = screen, > 0 behind it, < 0 in front of it).
-- Each plane moves by EMatrix_Math.ParallaxShift(eye, z), so the bezel never moves, everything
-- behind it moves with the eye and everything in front moves against it:
--   z =  1.0   Backplate     nebula (or the live game world, or black), slid by texcoords
--   z =  0.5   Subject       3D model: sideways shift (SetPosition y/z) + view-dependent turn
--   z = 0..1   Inner walls   four gradient walls whose visible widths follow the eye
--   z =  0.0   Lens grid     135 microlens cells (1 px sun-lit bevel, scanlines) and housing
--   z = -0.15  Cover glass   ADD-blended sheen
--   z = -0.4   Pop-out       reticle floating in front of the monitor
-- Stereo: "sbs" (parallel free-view), "cross" (cross-eyed), "anaglyph" (red left / cyan right).
-- Each eye's subject is turned by +/- stereoDelta (true view disparity) and offset by
-- stereoPixels; in anaglyph the reticle pair carries crossed disparity so it pops out.
--
-- Classic notes from /fide diag: no SetDefaultModelPosition, no ModelScene camera. Model
-- SetPosition(x, y, z) takes x = toward the camera, y = sideways, z = up.

local ADDON_NAME, ns = ...
local Math = (ns and ns.Math) or _G.EMatrix_Math

local VERSION = "1.5.1"
local CONFIG_VERSION = 2 -- bumped when saved defaults must change for existing installs

-- Configuration & Constants
local COLS = 15
local ROWS = 9
local TOTAL_CELLS = COLS * ROWS -- 135
local CELL_SIZE = 32
local MATRIX_WIDTH = COLS * CELL_SIZE  -- 480 px
local MATRIX_HEIGHT = ROWS * CELL_SIZE -- 288 px

local MEDIA_PATH = "Interface\\AddOns\\FidelityEMatrix\\Media\\"
local TEX_CLOSED    = MEDIA_PATH .. "Marshmallow_E_Closed.tga"
local TEX_WINDOW    = MEDIA_PATH .. "Marshmallow_E_Window.tga"
local TEX_BACKPLATE = MEDIA_PATH .. "Backplate_Nebula.tga"
local TEX_WALL      = MEDIA_PATH .. "Wall_Gradient.tga"
local TEX_SHEEN     = MEDIA_PATH .. "Glass_Sheen.tga"
local TEX_RETICLE   = MEDIA_PATH .. "Reticle.tga"

-- Depth of each plane (see the header)
local Z_BACK, Z_SUBJECT, Z_GLASS, Z_POP = 1.0, 0.5, -0.15, -0.4
local PX_GAIN = 60            -- screen pixels per unit of ParallaxShift
local MODEL_GAIN = 0.45       -- model units per unit of ParallaxShift (sideways and up)
local FACING_TILT = 0.55      -- radians the subject turns per unit of eye offset
local BACKPLATE_ZOOM = 0.86   -- visible fraction of the backplate (room to slide)
local WALL_BASE, WALL_GAIN, WALL_MIN, WALL_MAX = 30, 0.9, 8, 58
local RETICLE_SIZE = 150
local OPEN_RATE = 2.5         -- openAmount per second (walls, glass, reticle fade)

-- SavedVariables defaults (merged into the saved table at ADDON_LOADED)
local DEFAULTS = {
    scale = 1.0,
    stereoMode = "off",       -- "off", "sbs", "cross", "anaglyph"
    waveSpeed = 16.0,         -- cells per second
    flipDuration = 0.26,      -- flip duration per cell in seconds
    spinSpeed = 0.50,         -- continuous model rotation (0 = 0-CPU idle)
    parallaxStrength = 0.50,  -- cursor-as-eye parallax strength (0 = 0-CPU idle)
    lensAlpha = 0.35,         -- open-state microlens bezel alpha (0 = seamless, no lens cue)
    backdrop = "nebula",      -- "nebula", "world" (see the live game through), "black"
    stereoDelta = 0.06,       -- radians each eye's subject is turned (about 3.4 degrees)
    stereoPixels = 4,         -- horizontal eye offset in pixels
    anaglyphMix = 0.50,       -- alpha of the cyan (right-eye) layer over the red one
    -- Sign calibration, settable with /fide calibrate side|turn (cannot be checked headless):
    -- sideSign +1 assumes model space +y is screen right (right-handed, x toward the camera);
    -- turnSign +1 assumes positive facing is counter-clockwise seen from above.
    sideSign = 1,
    turnSign = 1,
    worldOverlay = true,      -- EMatrix_World: live actors re-rendered over the game (the default experience)
    terrainOverlay = true,    -- EMatrix_Terrain: map placements re-rendered with depth (the default experience)
    boxHidden = true,         -- the scoreboard window is a side show: /fide box shows it
    configVersion = 0,
}
FidelityEMatrix_Config = FidelityEMatrix_Config or {}

local function Cfg(key)
    local v = FidelityEMatrix_Config and FidelityEMatrix_Config[key]
    if v == nil then return DEFAULTS[key] end
    return v
end

local function MergeDefaults()
    if type(FidelityEMatrix_Config) ~= "table" then FidelityEMatrix_Config = {} end
    for k, v in pairs(DEFAULTS) do
        if FidelityEMatrix_Config[k] == nil then FidelityEMatrix_Config[k] = v end
    end
    if (tonumber(FidelityEMatrix_Config.configVersion) or 0) < CONFIG_VERSION then
        -- v1.5: the full-screen scene becomes the default for everyone, box hidden
        FidelityEMatrix_Config.worldOverlay = true
        FidelityEMatrix_Config.terrainOverlay = true
        FidelityEMatrix_Config.boxHidden = true
        FidelityEMatrix_Config.configVersion = CONFIG_VERSION
    end
    if FidelityEMatrix_Config.stereoMode == "anaglyph" or FidelityEMatrix_Config.stereoMode == "sbs"
        or FidelityEMatrix_Config.stereoMode == "cross" or FidelityEMatrix_Config.stereoMode == "off" then
        return
    end
    FidelityEMatrix_Config.stereoMode = "off"
end

-- Master Containers & Layer References
local driverFrame -- always shown; owns the OnUpdate so the eye runs even when the box is hidden
local masterFrame, housingFill
local frameBackplate, backplateTex
local frameScene, sceneMain, sceneLeft, sceneRight
local frameDepth, wallL, wallR, wallT, wallB
local frameFront, sheenTex, reticleMono, reticleL, reticleR
local frameGrid
local cells = {} -- Flat pre-allocated 1..135 array

-- Wave & Motion State (Zero Per-Frame Garbage)
local waveActive = false
local waveAge = 0.0
local waveOriginCol = 8
local waveOriginRow = 5
local waveTargetState = false -- false = Closed (E-cubes), true = Open (3D window)
local openAmount = 0.0        -- 0 closed .. 1 open, drives walls / glass / reticle

-- Parallax & Animation State
local animTime = 0.0
local currentFacing = 0.0
local smoothEyeX, smoothEyeY = 0.0, 0.0
local appliedEyeX, appliedEyeY, appliedOpen = nil, nil, nil
local lastClickTime = 0.0

-- Client Diagnostics Store
local DiagTable = {
    projectID = _G.WOW_PROJECT_ID or "Unknown",
    buildVersion = "Unknown",
    buildNumber = "Unknown",
    buildDate = "Unknown",
    tocVersion = 0,
    frames = {},
    methods = {},
    lightForm = "untested", -- "table", "positional", "none"
}

-- Forward declarations
local TriggerScoreboardWave
local CreateMatrixGrid
local UpdateStereoDisplay
local CheckIdleCondition
local RunDiagnostics
local ApplyDepthPlanes
local ApplyBackdrop

-- ============================================================================
-- 0. Client Capability Probe (/fide diag)
-- ============================================================================
function RunDiagnostics()
    if GetBuildInfo then
        local v, b, d, t = GetBuildInfo()
        DiagTable.buildVersion = v or "Unknown"
        DiagTable.buildNumber = b or "Unknown"
        DiagTable.buildDate = d or "Unknown"
        DiagTable.tocVersion = t or 0
    end

    local frameTypes = { "DressUpModel", "PlayerModel", "ModelScene", "Model" }
    local methodsToProbe = {
        "SetCamera", "SetPosition", "SetFacing", "SetModel", "SetUnit",
        "SetLight", "SetCamDistanceScale", "SetPortraitZoom", "SetModelScale",
        "SetCameraPosition", "SetDefaultModelPosition", "GetActiveCamera", "CreateActor"
    }

    for _, fType in ipairs(frameTypes) do
        local ok, f = pcall(CreateFrame, fType, nil, UIParent)
        DiagTable.frames[fType] = (ok and f ~= nil)
        if ok and f then
            for _, m in ipairs(methodsToProbe) do
                if type(f[m]) == "function" then
                    DiagTable.methods[m] = true
                elseif DiagTable.methods[m] == nil then
                    DiagTable.methods[m] = false
                end
            end
            f:Hide()
        end
    end
end

-- ============================================================================
-- 0b. Lighting: one call that works on both SetLight signatures
-- Newer engines take SetLight(enabled, { omnidirectional, point, ambientIntensity, ambientColor,
-- diffuseIntensity, diffuseColor }); older ones take 13 positional values. Try the table form,
-- then the positional one, and remember which worked for /fide diag.
-- ============================================================================
--                dirX,  dirY,  dirZ, ambI, ambR, ambG, ambB, difI, difR, difG, difB
local LIGHT_MONO = { -0.45, -0.55, 0.70, 0.55, 0.55, 0.58, 0.75, 0.95, 1.00, 0.90, 0.72 } -- warm key, cool fill
local LIGHT_RED  = { -0.45, -0.55, 0.70, 0.60, 1.00, 0.00, 0.00, 0.90, 1.00, 0.00, 0.00 } -- left eye
local LIGHT_CYAN = { -0.45, -0.55, 0.70, 0.60, 0.00, 1.00, 1.00, 0.90, 0.00, 1.00, 1.00 } -- right eye

local function ApplyLight(model, L)
    if not model or type(model.SetLight) ~= "function" or not L then return false end
    if DiagTable.lightForm ~= "positional" and CreateVector3D and CreateColor then
        local ok = pcall(model.SetLight, model, true, {
            omnidirectional = false,
            point = CreateVector3D(L[1], L[2], L[3]),
            ambientIntensity = L[4],
            ambientColor = CreateColor(L[5], L[6], L[7]),
            diffuseIntensity = L[8],
            diffuseColor = CreateColor(L[9], L[10], L[11]),
        })
        if ok then DiagTable.lightForm = "table"; return true end
    end
    local ok = pcall(model.SetLight, model, true, false, L[1], L[2], L[3], L[4], L[5], L[6], L[7], L[8], L[9], L[10], L[11])
    if ok then DiagTable.lightForm = "positional"; return true end
    DiagTable.lightForm = "none"
    return false
end

-- Model SetPosition: x = depth toward the camera, y = sideways, z = up.
local function PlaceModel(model, side, up)
    if model and type(model.SetPosition) == "function" then
        model:SetPosition(0, side, up)
        model.__ematrixPos = { 0, side, up }
    end
end

local function FaceModel(model, facing)
    if not model then return end
    if type(model.SetFacing) == "function" then
        model:SetFacing(facing)
    elseif type(model.SetRotation) == "function" then
        model:SetRotation(facing)
    end
end

-- Shared with EMatrix_World.lua
ns.Cfg = Cfg
ns.ApplyLight = ApplyLight
ns.PlaceModel = PlaceModel
ns.FaceModel = FaceModel
ns.LIGHTS = { mono = LIGHT_MONO, red = LIGHT_RED, cyan = LIGHT_CYAN }

-- ============================================================================
-- 1. Master Frame & Layer Architecture
-- ============================================================================
function CreateMatrixGrid()
    if masterFrame then return end

    Math = Math or (ns and ns.Math) or _G.EMatrix_Math
    if not Math then return end
    MergeDefaults()

    -- Run client probe
    RunDiagnostics()

    driverFrame = CreateFrame("Frame", "FidelityEMatrixDriver", UIParent)
    driverFrame:SetSize(1, 1)
    driverFrame:SetPoint("BOTTOMLEFT", UIParent, "BOTTOMLEFT", -10, -10)
    driverFrame:EnableMouse(false)
    driverFrame:Show()

    -- Master Container Frame (Draggable parent for all layers)
    masterFrame = CreateFrame("Frame", "FidelityEMatrixFrame", UIParent)
    masterFrame:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
    masterFrame:SetPoint("CENTER", UIParent, "CENTER", 0, 40)
    masterFrame:SetScale(Cfg("scale"))
    masterFrame:SetFrameStrata("MEDIUM")
    masterFrame:SetFrameLevel(20)
    masterFrame:SetMovable(true)
    masterFrame:EnableMouse(true)
    masterFrame:SetClampedToScreen(true)
    masterFrame:RegisterForDrag("LeftButton")
    masterFrame:SetScript("OnDragStart", function(self)
        if IsShiftKeyDown() then self:StartMoving() end
    end)
    masterFrame:SetScript("OnDragStop", function(self)
        self:StopMovingOrSizing()
    end)

    -- Outer housing (focal plane z = 0): four 4 px strips OUTSIDE the window, lit gold on the
    -- top and right (sun at the upper right), bronze on the bottom and left. Strips, not a filled
    -- rectangle, so "/fide backdrop world" really shows the game through the window.
    local function Strip(r, g, b, p1, rel1, x1, y1, p2, rel2, x2, y2)
        local t = masterFrame:CreateTexture(nil, "BACKGROUND", nil, -7)
        t:SetPoint(p1, masterFrame, rel1, x1, y1)
        t:SetPoint(p2, masterFrame, rel2, x2, y2)
        t:SetColorTexture(r, g, b, 0.95)
        return t
    end
    Strip(1.00, 0.86, 0.50, "TOPLEFT", "TOPLEFT", -4, 4, "BOTTOMRIGHT", "TOPRIGHT", 4, 0)          -- top (lit)
    Strip(1.00, 0.86, 0.50, "TOPLEFT", "TOPRIGHT", 0, 4, "BOTTOMRIGHT", "BOTTOMRIGHT", 4, -4)      -- right (lit)
    Strip(0.55, 0.41, 0.20, "TOPLEFT", "BOTTOMLEFT", -4, 0, "BOTTOMRIGHT", "BOTTOMRIGHT", 0, -4)   -- bottom
    Strip(0.55, 0.41, 0.20, "TOPLEFT", "TOPLEFT", -4, 4, "BOTTOMRIGHT", "BOTTOMLEFT", 0, -4)       -- left

    -- Dark interior fill behind the backplate (hidden in world mode)
    housingFill = masterFrame:CreateTexture(nil, "BACKGROUND", nil, -5)
    housingFill:SetAllPoints(masterFrame)
    housingFill:SetColorTexture(0.04, 0.04, 0.06, 1.0)

    -- ------------------------------------------------------------------------
    -- LAYER 1: Backplate (FrameLevel 22), z = 1.0. Slides by texcoords only, so it never
    -- leaves the frame and never needs clipping.
    -- ------------------------------------------------------------------------
    frameBackplate = CreateFrame("Frame", "FidelityEMatrix_Backplate", masterFrame)
    frameBackplate:SetAllPoints(masterFrame)
    frameBackplate:SetFrameLevel(22)
    frameBackplate:EnableMouse(false)

    backplateTex = frameBackplate:CreateTexture(nil, "BACKGROUND", nil, -4)
    backplateTex:SetAllPoints(frameBackplate)
    backplateTex:SetTexture(TEX_BACKPLATE)
    backplateTex:SetTexCoord(Math.BackplateTexCoords(0, 0, BACKPLATE_ZOOM))
    backplateTex:SetAlpha(0.92)

    -- ------------------------------------------------------------------------
    -- LAYER 2: 3D Scene (FrameLevel 25), subject at z = 0.5
    -- ------------------------------------------------------------------------
    frameScene = CreateFrame("Frame", "FidelityEMatrix_Scene", masterFrame)
    frameScene:SetAllPoints(masterFrame)
    frameScene:SetFrameLevel(25)
    frameScene:EnableMouse(false)

    local function Create3DModel(name, w, h, point, relPoint, x, y)
        -- 1. DressUpModel (most robust in Classic / TBC, full armour framing)
        local okDM, dm = pcall(CreateFrame, "DressUpModel", name, frameScene)
        if okDM and dm then
            dm:SetSize(w, h)
            dm:SetPoint(point, frameScene, relPoint, x, y)
            dm:SetFrameLevel(26)
            dm:EnableMouse(false)
            local okUnit = pcall(function()
                dm:SetUnit("player")
                if dm.SetDefaultModelPosition then dm:SetDefaultModelPosition() end
                PlaceModel(dm, 0, 0)
                FaceModel(dm, 0)
            end)
            dm.__ematrixUnit = okUnit and "player" or "SetUnit failed"
            ApplyLight(dm, LIGHT_MONO)
            return dm
        end

        -- 2. Retail ModelScene
        local okMS, ms = pcall(CreateFrame, "ModelScene", name, frameScene)
        if okMS and ms and ms.CreateActor then
            ms:SetSize(w, h)
            ms:SetPoint(point, frameScene, relPoint, x, y)
            ms:SetFrameLevel(26)
            ms:EnableMouse(false)
            pcall(function()
                local actor = ms:CreateActor()
                if actor and actor.SetModelByUnit then
                    actor:SetModelByUnit("player")
                    actor:SetPosition(0, 0, 0)
                end
                local camera = ms.GetActiveCamera and ms:GetActiveCamera()
                if not camera and CreateModelSceneCamera then
                    camera = CreateModelSceneCamera("OrbitCamera")
                    if camera and ms.AddCamera then
                        ms:AddCamera(camera)
                        ms:SetActiveCamera(camera)
                    end
                end
                if camera then
                    if camera.SetTarget then camera:SetTarget(0, 0, 0.9) end
                    if camera.SetZoomDistance then camera:SetZoomDistance(2.8) end
                    if camera.SetYaw then camera:SetYaw(0) end
                end
            end)
            return ms
        end

        -- 3. Fallback PlayerModel
        local okPM, pm = pcall(CreateFrame, "PlayerModel", name, frameScene)
        if okPM and pm then
            pm:SetSize(w, h)
            pm:SetPoint(point, frameScene, relPoint, x, y)
            pm:SetFrameLevel(26)
            pm:EnableMouse(false)
            pcall(function()
                pm:SetUnit("player")
                PlaceModel(pm, 0, 0)
                FaceModel(pm, 0)
            end)
            ApplyLight(pm, LIGHT_MONO)
            return pm
        end

        return nil
    end

    sceneMain = Create3DModel("FidelityEMatrix_SceneMain", MATRIX_WIDTH, MATRIX_HEIGHT, "CENTER", "CENTER", 0, 0)
    sceneLeft = Create3DModel("FidelityEMatrix_SceneLeft", MATRIX_WIDTH * 0.5, MATRIX_HEIGHT, "LEFT", "LEFT", 0, 0)
    sceneRight = Create3DModel("FidelityEMatrix_SceneRight", MATRIX_WIDTH * 0.5, MATRIX_HEIGHT, "RIGHT", "RIGHT", 0, 0)

    -- ------------------------------------------------------------------------
    -- LAYER 2b: Inner walls of the box (FrameLevel 27, above the subject so the window edge
    -- occludes it, below the lens grid). Visible widths follow the eye.
    -- ------------------------------------------------------------------------
    frameDepth = CreateFrame("Frame", "FidelityEMatrix_Depth", masterFrame)
    frameDepth:SetAllPoints(masterFrame)
    frameDepth:SetFrameLevel(27)
    frameDepth:EnableMouse(false)

    local function Wall(...)
        local t = frameDepth:CreateTexture(nil, "ARTWORK")
        t:SetTexture(TEX_WALL)
        t:SetTexCoord(...)
        return t
    end
    -- Sun at the upper right: the left wall and the floor face it (lit), the right wall and the
    -- ceiling face away (shade). The texture is mid-tone so these tints read as lit surfaces.
    wallL = Wall(0, 1, 0, 1)                       -- opaque at the left edge
    wallL:SetPoint("TOPLEFT"); wallL:SetPoint("BOTTOMLEFT")
    wallL:SetVertexColor(1.00, 0.92, 0.80)
    wallR = Wall(1, 0, 0, 1)                       -- mirrored: opaque at the right edge
    wallR:SetPoint("TOPRIGHT"); wallR:SetPoint("BOTTOMRIGHT")
    wallR:SetVertexColor(0.30, 0.33, 0.46)
    wallT = Wall(0, 0, 1, 0, 0, 1, 1, 1)           -- rotated: opaque at the top edge
    wallT:SetPoint("TOPLEFT"); wallT:SetPoint("TOPRIGHT")
    wallT:SetVertexColor(0.24, 0.26, 0.38)
    wallB = Wall(1, 0, 0, 0, 1, 1, 0, 1)           -- rotated: opaque at the bottom edge
    wallB:SetPoint("BOTTOMLEFT"); wallB:SetPoint("BOTTOMRIGHT")
    wallB:SetVertexColor(0.85, 0.78, 0.66)

    -- ------------------------------------------------------------------------
    -- LAYER 3: Cell Grid (FrameLevel 30), the lens array at z = 0
    -- ------------------------------------------------------------------------
    frameGrid = CreateFrame("Frame", "FidelityEMatrix_Grid", masterFrame)
    frameGrid:SetAllPoints(masterFrame)
    frameGrid:SetFrameLevel(30)
    frameGrid:EnableMouse(false)

    for r = 1, ROWS do
        for c = 1, COLS do
            local idx = (r - 1) * COLS + c
            local cx = (c - 0.5) * CELL_SIZE
            local cy = -((r - 0.5) * CELL_SIZE)

            local rotIdx, uv8 = Math.GetCellRotation(c, r)

            local cell = {
                col = c,
                row = r,
                cx = cx,
                cy = cy,
                rotIdx = rotIdx,
                uv8 = uv8,
                ringDist = 0.0,
                isWindow = false, -- Default state is CLOSED
                settled = true
            }

            -- creviceTex: dark backing visible ONLY mid-flip
            local creviceTex = frameGrid:CreateTexture(nil, "BACKGROUND", nil, 1)
            creviceTex:SetSize(CELL_SIZE, CELL_SIZE)
            creviceTex:SetPoint("CENTER", frameGrid, "TOPLEFT", cx, cy)
            creviceTex:SetColorTexture(0.02, 0.02, 0.03, 1.0)
            creviceTex:SetAlpha(0.0)
            cell.creviceTex = creviceTex

            -- flapTex: puffy E (closed) or microlens bezel (open)
            local flapTex = frameGrid:CreateTexture(nil, "ARTWORK", nil, 2)
            flapTex:SetSize(CELL_SIZE, CELL_SIZE)
            flapTex:SetPoint("CENTER", frameGrid, "TOPLEFT", cx, cy)
            flapTex:SetTexture(TEX_CLOSED)
            flapTex:SetTexCoord(unpack(uv8))
            flapTex:SetAlpha(1.0)
            cell.flapTex = flapTex

            -- specBar: thin golden-white flash at the flip midpoint
            local specBar = frameGrid:CreateTexture(nil, "OVERLAY", nil, 3)
            specBar:SetSize(CELL_SIZE, 2)
            specBar:SetPoint("CENTER", frameGrid, "TOPLEFT", cx, cy)
            specBar:SetColorTexture(1.0, 0.94, 0.68, 1.0)
            specBar:SetAlpha(0.0)
            cell.specBar = specBar

            cells[idx] = cell
        end
    end

    -- ------------------------------------------------------------------------
    -- LAYER 4: Cover glass (z = -0.15) and pop-out reticle (z = -0.4), FrameLevel 32
    -- ------------------------------------------------------------------------
    frameFront = CreateFrame("Frame", "FidelityEMatrix_Front", masterFrame)
    frameFront:SetAllPoints(masterFrame)
    frameFront:SetFrameLevel(32)
    frameFront:EnableMouse(false)

    sheenTex = frameFront:CreateTexture(nil, "ARTWORK", nil, 1)
    sheenTex:SetTexture(TEX_SHEEN)
    sheenTex:SetBlendMode("ADD")
    sheenTex:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
    sheenTex:SetPoint("CENTER", frameFront, "CENTER", 0, 0)

    local function Reticle(r, g, b)
        local t = frameFront:CreateTexture(nil, "OVERLAY", nil, 2)
        t:SetTexture(TEX_RETICLE)
        t:SetSize(RETICLE_SIZE, RETICLE_SIZE)
        t:SetPoint("CENTER", frameFront, "CENTER", 0, 0)
        t:SetVertexColor(r, g, b)
        return t
    end
    reticleMono = Reticle(0.0, 1.0, 0.8)
    reticleL = Reticle(1.0, 0.0, 0.0)   -- red, left eye
    reticleR = Reticle(0.0, 1.0, 1.0)   -- cyan, right eye
    reticleR:SetBlendMode("ADD")

    -- Click-picking on the master frame
    local function HandleMatrixClick(self, button)
        if button == "LeftButton" and not IsShiftKeyDown() then
            local now = GetTime()
            if (now - lastClickTime) < 0.15 then return end
            lastClickTime = now

            pcall(function()
                local mx, my = GetCursorPosition()
                local s = self:GetEffectiveScale()
                if not s or s == 0 then s = 1.0 end
                mx, my = mx / s, my / s
                local left = self:GetLeft() or 0
                local top = self:GetTop() or 0
                local col = math.floor((mx - left) / CELL_SIZE) + 1
                local row = math.floor((top - my) / CELL_SIZE) + 1

                if col >= 1 and col <= COLS and row >= 1 and row <= ROWS then
                    TriggerScoreboardWave(col, row)
                else
                    TriggerScoreboardWave(8, 5)
                end
            end)
        end
    end

    masterFrame:SetScript("OnMouseDown", HandleMatrixClick)
    masterFrame:SetScript("OnMouseUp", HandleMatrixClick)

    UpdateStereoDisplay()
    CheckIdleCondition()
end

-- ============================================================================
-- 2. Backdrop & Stereo Rig
-- ============================================================================
local function StereoMode() return Cfg("stereoMode") end
local function IsStereo() return StereoMode() ~= "off" end

function ApplyBackdrop()
    if not backplateTex then return end
    -- Any stereo mode needs a black field: a shared flat backdrop has no disparity and fights fusion
    local mode = IsStereo() and "black" or Cfg("backdrop")
    if housingFill then
        if mode == "world" then housingFill:Hide() else housingFill:Show() end
    end
    if mode == "world" then
        backplateTex:Hide()
    elseif mode == "black" then
        backplateTex:Show()
        backplateTex:SetColorTexture(0, 0, 0, 1)
        backplateTex:SetTexCoord(0, 1, 0, 1)
        backplateTex:SetAlpha(1.0)
    else
        backplateTex:Show()
        backplateTex:SetTexture(TEX_BACKPLATE)
        backplateTex:SetTexCoord(Math.BackplateTexCoords(0, 0, BACKPLATE_ZOOM))
        backplateTex:SetAlpha(0.92)
    end
    appliedEyeX = nil -- force the planes to re-apply
end

function UpdateStereoDisplay()
    local mode = StereoMode()

    if (mode == "sbs" or mode == "cross") and sceneLeft and sceneRight then
        -- Halves: parallel viewing puts the left eye's view on the left; cross-eyed swaps them
        if sceneMain then sceneMain:Hide() end
        for _, m in ipairs({ sceneLeft, sceneRight }) do
            m:Show()
            m:ClearAllPoints()
            m:SetSize(MATRIX_WIDTH * 0.5, MATRIX_HEIGHT)
            m:SetAlpha(1.0)
            ApplyLight(m, LIGHT_MONO)
        end
        local leftHalf, rightHalf = sceneLeft, sceneRight
        if mode == "cross" then leftHalf, rightHalf = sceneRight, sceneLeft end
        leftHalf:SetPoint("LEFT", frameScene, "LEFT", 0, 0)
        rightHalf:SetPoint("RIGHT", frameScene, "RIGHT", 0, 0)

    elseif mode == "anaglyph" then
        -- Red left eye under a cyan right eye; uncrossed offset puts the subject behind the screen
        if sceneMain then sceneMain:Hide() end
        local px = Cfg("stereoPixels")
        if sceneLeft then
            sceneLeft:Show()
            sceneLeft:ClearAllPoints()
            sceneLeft:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneLeft:SetPoint("CENTER", frameScene, "CENTER", -px, 0)
            sceneLeft:SetAlpha(1.0)
            ApplyLight(sceneLeft, LIGHT_RED)
        end
        if sceneRight then
            sceneRight:Show()
            sceneRight:ClearAllPoints()
            sceneRight:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneRight:SetPoint("CENTER", frameScene, "CENTER", px, 0)
            sceneRight:SetAlpha(Cfg("anaglyphMix"))
            ApplyLight(sceneRight, LIGHT_CYAN)
        end

    else
        if sceneMain then
            sceneMain:Show()
            sceneMain:ClearAllPoints()
            sceneMain:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneMain:SetPoint("CENTER", frameScene, "CENTER", 0, 0)
            sceneMain:SetAlpha(1.0)
            ApplyLight(sceneMain, LIGHT_MONO)
        end
        if sceneLeft then sceneLeft:Hide() end
        if sceneRight then sceneRight:Hide() end
    end

    ApplyBackdrop()
    ApplyDepthPlanes(smoothEyeX, smoothEyeY)
end

-- ============================================================================
-- 3. Depth Planes (called when the eye or openAmount changes)
-- ============================================================================
function ApplyDepthPlanes(eyeX, eyeY)
    if not masterFrame or not Math then return end
    local mode = StereoMode()
    local split = (mode == "sbs" or mode == "cross")

    -- Backplate (z = 1): slide the texcoord window with the eye
    if backplateTex and backplateTex:IsShown() and Cfg("backdrop") == "nebula" and not IsStereo() then
        local px = Math.ParallaxShift(eyeX, Z_BACK) * PX_GAIN
        local py = Math.ParallaxShift(eyeY, Z_BACK) * PX_GAIN
        -- texcoord v grows downward; a shift up on screen is a smaller v
        backplateTex:SetTexCoord(Math.BackplateTexCoords(-px * BACKPLATE_ZOOM / MATRIX_WIDTH, py * BACKPLATE_ZOOM / MATRIX_HEIGHT, BACKPLATE_ZOOM))
    end

    -- Subject (z = 0.5): sideways/up shift in model units (mono only; stereo pairs stay centred)
    if sceneMain and sceneMain:IsShown() then
        PlaceModel(sceneMain,
            Cfg("sideSign") * Math.ParallaxShift(eyeX, Z_SUBJECT) * MODEL_GAIN,
            Math.ParallaxShift(eyeY, Z_SUBJECT) * MODEL_GAIN)
    end

    -- Inner walls: see more of the far wall's opposite side as the eye moves
    local wallsOn = (not split) and openAmount > 0.001
    if wallL then
        if wallsOn then
            local l, r, t, b = Math.WallWidths(eyeX, eyeY, WALL_BASE, WALL_GAIN, WALL_MIN, WALL_MAX)
            wallL:SetWidth(l); wallR:SetWidth(r); wallT:SetHeight(t); wallB:SetHeight(b)
            wallL:SetAlpha(openAmount); wallR:SetAlpha(openAmount); wallT:SetAlpha(openAmount); wallB:SetAlpha(openAmount)
            wallL:Show(); wallR:Show(); wallT:Show(); wallB:Show()
        else
            wallL:Hide(); wallR:Hide(); wallT:Hide(); wallB:Hide()
        end
    end

    -- Cover glass (z = -0.15) and pop-out reticle (z = -0.4): move against the eye
    local frontOn = (not split) and openAmount > 0.001
    if sheenTex then
        if frontOn and mode ~= "anaglyph" then
            sheenTex:SetPoint("CENTER", frameFront, "CENTER",
                Math.ParallaxShift(eyeX, Z_GLASS) * PX_GAIN, Math.ParallaxShift(eyeY, Z_GLASS) * PX_GAIN)
            sheenTex:SetAlpha(0.9 * openAmount)
            sheenTex:Show()
        else
            sheenTex:Hide()
        end
    end
    if reticleMono then
        local rx = Math.ParallaxShift(eyeX, Z_POP) * PX_GAIN
        local ry = Math.ParallaxShift(eyeY, Z_POP) * PX_GAIN
        if frontOn and mode == "anaglyph" then
            -- Crossed disparity: the left (red) image sits right of the right (cyan) one -> in front
            local d = Cfg("stereoPixels") + 1
            reticleMono:Hide()
            reticleL:SetPoint("CENTER", frameFront, "CENTER", rx + d, ry)
            reticleR:SetPoint("CENTER", frameFront, "CENTER", rx - d, ry)
            reticleL:SetAlpha(0.85 * openAmount); reticleR:SetAlpha(0.85 * openAmount)
            reticleL:Show(); reticleR:Show()
        elseif frontOn then
            reticleL:Hide(); reticleR:Hide()
            reticleMono:SetPoint("CENTER", frameFront, "CENTER", rx, ry)
            reticleMono:SetAlpha(0.85 * openAmount)
            reticleMono:Show()
        else
            reticleMono:Hide(); reticleL:Hide(); reticleR:Hide()
        end
    end

    appliedEyeX, appliedEyeY, appliedOpen = eyeX, eyeY, openAmount
end

-- ============================================================================
-- 4. Zero-GC Scoreboard Wave & Motion Driver
-- ============================================================================
local function OnUpdateDriver(self, dt)
    animTime = animTime + dt
    local lens = Cfg("lensAlpha")

    -- 1. Scoreboard wave cascade
    if waveActive then
        local speed = Cfg("waveSpeed")
        local dur = Cfg("flipDuration")
        waveAge = waveAge + dt

        local allDone = true
        local opening = waveTargetState

        for i = 1, TOTAL_CELLS do
            local cell = cells[i]
            if cell then
                local u = Math.CalculateFlipProgress(waveAge, speed, cell.ringDist, dur)

                if u < 1.0 then allDone = false end

                if u > 0.0 and u < 1.0 then
                    cell.settled = false
                    local scaleY, specAlpha, isFlipped, creviceAlpha = Math.GetFlipVisuals(u)

                    cell.flapTex:SetHeight(CELL_SIZE * scaleY)
                    cell.specBar:SetAlpha(specAlpha)
                    cell.creviceTex:SetAlpha(creviceAlpha)

                    if opening then
                        if isFlipped then
                            -- E -> lens: fade from the full bezel down to the lens alpha
                            cell.flapTex:SetTexture(TEX_WINDOW)
                            local k = math.min(1.0, (u - 0.5) * 2.0)
                            cell.flapTex:SetAlpha(1.0 + (lens - 1.0) * k)
                            cell.isWindow = true
                        else
                            cell.flapTex:SetTexture(TEX_CLOSED)
                            cell.flapTex:SetAlpha(1.0)
                        end
                    else
                        if isFlipped then
                            cell.flapTex:SetTexture(TEX_CLOSED)
                            cell.flapTex:SetAlpha(math.min(1.0, (u - 0.5) * 2.0))
                            cell.isWindow = false
                        else
                            cell.flapTex:SetTexture(TEX_WINDOW)
                            cell.flapTex:SetAlpha(lens)
                        end
                    end

                elseif u >= 1.0 and not cell.settled then
                    cell.flapTex:SetHeight(CELL_SIZE)
                    cell.specBar:SetAlpha(0.0)
                    cell.creviceTex:SetAlpha(0.0)
                    cell.isWindow = opening

                    if opening then
                        -- OPEN: the microlens array stays visible at lensAlpha (0 = seamless)
                        cell.flapTex:SetTexture(TEX_WINDOW)
                        cell.flapTex:SetAlpha(lens)
                    else
                        cell.flapTex:SetTexture(TEX_CLOSED)
                        cell.flapTex:SetAlpha(1.0)
                    end
                    cell.settled = true
                end
            end
        end

        if allDone then waveActive = false end
    end

    -- 2. Open amount (walls, glass, reticle) follows the wave target
    local target = waveTargetState and 1.0 or 0.0
    if openAmount ~= target then
        openAmount = Math.Approach(openAmount, target, OPEN_RATE, dt)
    end

    -- 3. Eye from the cursor (raw pixels on both sides of the comparison)
    local pStr = Cfg("parallaxStrength")
    if pStr > 0.0 and GetCursorPosition then
        local mx, my = GetCursorPosition()
        local es = masterFrame:GetEffectiveScale() or 1.0
        local cx, cy = masterFrame:GetCenter()
        if not masterFrame:IsShown() or not cx or not cy then
            -- box hidden: the eye is measured from the screen centre
            es = UIParent:GetEffectiveScale() or 1.0
            cx, cy = (GetScreenWidth() or 1920) * 0.5, (GetScreenHeight() or 1080) * 0.5
        end
        if cx and cy then
            local uis = UIParent:GetEffectiveScale() or 1.0
            local halfW = (GetScreenWidth() or 1920) * uis * 0.5
            local halfH = (GetScreenHeight() or 1080) * uis * 0.5
            local tx, ty = Math.EyeFromCursor(mx, my, cx * es, cy * es, halfW, halfH, pStr)
            local k = math.min(dt * 8.0, 1.0)
            smoothEyeX = smoothEyeX + (tx - smoothEyeX) * k
            smoothEyeY = smoothEyeY + (ty - smoothEyeY) * k
        end
    elseif smoothEyeX ~= 0 or smoothEyeY ~= 0 or appliedEyeX ~= 0 or appliedEyeY ~= 0 then
        -- Parallax off: snap the eye home and force one re-apply at exactly 0, so a residue
        -- below the change threshold cannot keep the idle check from detaching OnUpdate
        smoothEyeX, smoothEyeY = 0.0, 0.0
        appliedEyeX = nil
    end

    if appliedEyeX == nil
        or math.abs(smoothEyeX - appliedEyeX) > 0.0005 or math.abs(smoothEyeY - appliedEyeY) > 0.0005
        or appliedOpen ~= openAmount then
        ApplyDepthPlanes(smoothEyeX, smoothEyeY)
    end

    -- 4. Subject rotation: continuous spin + view-dependent turn + per-eye disparity
    local spin = Cfg("spinSpeed")
    if spin > 0.0 then
        currentFacing = currentFacing + dt * spin
        if currentFacing > 6.28318 then currentFacing = currentFacing - 6.28318 end
    end
    -- Eye to the right orbits the viewer counter-clockwise: the subject turns clockwise (negative)
    local facing = currentFacing - Cfg("turnSign") * smoothEyeX * FACING_TILT
    if sceneMain and sceneMain:IsShown() then FaceModel(sceneMain, facing) end
    if IsStereo() then
        local fl, fr = Math.StereoFacings(facing, Cfg("turnSign") * Cfg("stereoDelta"))
        if sceneLeft and sceneLeft:IsShown() then FaceModel(sceneLeft, fl) end
        if sceneRight and sceneRight:IsShown() then FaceModel(sceneRight, fr) end
    end

    CheckIdleCondition()
end

--- Detaches OnUpdate when nothing moves (0.00 ms idle CPU).
function CheckIdleCondition()
    if not masterFrame then return end

    local spin = Cfg("spinSpeed")
    local pStr = Cfg("parallaxStrength")
    local target = waveTargetState and 1.0 or 0.0
    local settlingEye = (pStr <= 0.0) and (smoothEyeX ~= 0 or smoothEyeY ~= 0 or appliedEyeX ~= 0)
    -- the world overlay reads the eye and facing from here, so keep the driver alive while it runs
    local worldOn = (ns.World and ns.World.IsEnabled()) or (ns.Terrain and ns.Terrain.IsEnabled())

    local host = driverFrame or masterFrame
    if waveActive or spin > 0.0 or pStr > 0.0 or openAmount ~= target or settlingEye or worldOn then
        if not host:GetScript("OnUpdate") then
            host:SetScript("OnUpdate", OnUpdateDriver)
        end
    else
        if host:GetScript("OnUpdate") then
            host:SetScript("OnUpdate", nil) -- ZERO IDLE CPU
        end
    end
end

--- Triggers an outward scoreboard ripple from cell (ox, oy).
function TriggerScoreboardWave(ox, oy)
    if not masterFrame then CreateMatrixGrid() end
    if not masterFrame then return end

    Math = Math or (ns and ns.Math) or _G.EMatrix_Math
    if not Math or not cells or #cells < TOTAL_CELLS then return end

    ox = ox or 8
    oy = oy or 5
    ox = math.min(math.max(math.floor(ox), 1), COLS)
    oy = math.min(math.max(math.floor(oy), 1), ROWS)

    waveOriginCol = ox
    waveOriginRow = oy
    waveAge = 0.0
    waveTargetState = not waveTargetState

    for i = 1, TOTAL_CELLS do
        local cell = cells[i]
        if cell then
            cell.ringDist = Math.CalculateRingDistance(cell.col, cell.row, ox, oy)
            cell.settled = false
        end
    end

    waveActive = true
    local host = driverFrame or masterFrame
    if not host:GetScript("OnUpdate") then
        host:SetScript("OnUpdate", OnUpdateDriver)
    end
end

--- Re-applies the lens alpha to settled open cells (after /fide lens).
local function RefreshOpenCells()
    if waveActive then return end
    local lens = Cfg("lensAlpha")
    for i = 1, TOTAL_CELLS do
        local cell = cells[i]
        if cell and cell.settled and cell.isWindow then cell.flapTex:SetAlpha(lens) end
    end
end

-- ============================================================================
-- 5. Slash Commands & AddOn Lifecycle
-- ============================================================================
local function Say(fmt, ...) print("|cff00ffcc[Fidelity EMatrix]|r " .. string.format(fmt, ...)) end

SLASH_FIDELITYEMATRIX1 = "/fide"
SLASH_FIDELITYEMATRIX2 = "/ematrix"

SlashCmdList["FIDELITYEMATRIX"] = function(msg)
    local ok, err = pcall(function()
        local args = {}
        for word in string.gmatch(msg or "", "%S+") do
            table.insert(args, string.lower(word))
        end

        local cmd = args[1] or "toggle"
        if not masterFrame and cmd ~= "help" then CreateMatrixGrid() end

        if cmd == "toggle" or cmd == "show" or cmd == "hide" then
            if not masterFrame then return end
            if cmd == "show" then
                masterFrame:Show()
            elseif cmd == "hide" then
                masterFrame:Hide()
            else
                if masterFrame:IsShown() then masterFrame:Hide() else masterFrame:Show() end
            end

        elseif cmd == "ripple" or cmd == "wave" or cmd == "flip" then
            local ox = tonumber(args[2]) or 8
            local oy = tonumber(args[3]) or 5
            TriggerScoreboardWave(ox, oy)
            Say("Ripple triggered from (%d, %d). Target: %s", ox, oy,
                waveTargetState and "|cff00ff00OPEN WINDOW|r" or "|cffffcc00CLOSED E-CUBES|r")

        elseif cmd == "scene" then
            local unit = args[2] or "player"
            local any = false
            for _, m in ipairs({ sceneMain, sceneLeft, sceneRight }) do
                if m and m.SetUnit then
                    local okU = pcall(function()
                        m:SetUnit(unit)
                        if m.SetDefaultModelPosition then m:SetDefaultModelPosition() end
                    end)
                    any = any or okU
                end
            end
            appliedEyeX = nil
            UpdateStereoDisplay() -- SetUnit resets lighting on some clients
            if any then Say("Scene model set to unit: |cffffffff%s|r", unit)
            else print("|cffff3333[Fidelity EMatrix]|r Model unit swap not supported on this client frame.") end

        elseif cmd == "spin" then
            local sp = tonumber(args[2])
            if sp and sp >= 0 and sp <= 2.0 then
                FidelityEMatrix_Config.spinSpeed = sp
                CheckIdleCondition()
                Say("Spin speed set to: %.2f (0 = 0-CPU idle)", sp)
            else
                Say("Usage: /fide spin <0..2>")
            end

        elseif cmd == "parallax" then
            local pr = tonumber(args[2])
            if pr and pr >= 0 and pr <= 1.0 then
                FidelityEMatrix_Config.parallaxStrength = pr
                CheckIdleCondition()
                Say("Parallax strength set to: %.2f (0 = 0-CPU idle)", pr)
            else
                Say("Usage: /fide parallax <0..1>")
            end

        elseif cmd == "lens" then
            local la = tonumber(args[2])
            if la and la >= 0 and la <= 1.0 then
                FidelityEMatrix_Config.lensAlpha = la
                RefreshOpenCells()
                Say("Open microlens bezel alpha: %.2f (0 = seamless, no lens cue)", la)
            else
                Say("Usage: /fide lens <0..1>")
            end

        elseif cmd == "backdrop" then
            local b = args[2]
            if b == "nebula" or b == "world" or b == "black" then
                FidelityEMatrix_Config.backdrop = b
                ApplyBackdrop()
                ApplyDepthPlanes(smoothEyeX, smoothEyeY)
                Say("Backdrop: |cffffffff%s|r%s", b, IsStereo() and " (stereo modes use black until /fide stereo off)" or "")
            else
                Say("Usage: /fide backdrop <nebula|world|black>")
            end

        elseif cmd == "stereo" then
            local sub = args[2] or "toggle"
            if sub == "sbs" or sub == "cross" or sub == "anaglyph" then
                FidelityEMatrix_Config.stereoMode = sub
            elseif sub == "off" or sub == "mono" then
                FidelityEMatrix_Config.stereoMode = "off"
            elseif sub == "delta" and tonumber(args[3]) then
                FidelityEMatrix_Config.stereoDelta = math.min(math.max(tonumber(args[3]), 0), 0.3)
            elseif sub == "pixels" and tonumber(args[3]) then
                FidelityEMatrix_Config.stereoPixels = math.min(math.max(math.floor(tonumber(args[3])), 0), 16)
            elseif sub == "mix" and tonumber(args[3]) then
                FidelityEMatrix_Config.anaglyphMix = math.min(math.max(tonumber(args[3]), 0.1), 1.0)
            else
                local order = { off = "sbs", sbs = "cross", cross = "anaglyph", anaglyph = "off" }
                FidelityEMatrix_Config.stereoMode = order[StereoMode()] or "off"
            end
            UpdateStereoDisplay()
            CheckIdleCondition()
            Say("Stereo: |cffffffff%s|r (turn %.3f rad, offset %d px, cyan mix %.2f)", StereoMode():upper(),
                Cfg("stereoDelta"), Cfg("stereoPixels"), Cfg("anaglyphMix"))

        elseif cmd == "world" then
            if ns.World then
                ns.World.Command(args, Say)
                CheckIdleCondition()
            else
                Say("EMatrix_World.lua did not load.")
            end

        elseif cmd == "box" then
            local sub = args[2] or "toggle"
            local show = (sub == "show") or (sub == "toggle" and not masterFrame:IsShown())
            if sub == "hide" then show = false end
            if show then masterFrame:Show() else masterFrame:Hide() end
            FidelityEMatrix_Config.boxHidden = not show
            Say("Scoreboard box %s (the full-screen scene is separate: /fide overlay).", show and "shown; click it to ripple it open" or "hidden")

        elseif cmd == "overlay" or cmd == "full" then
            local sub = args[2] or "toggle"
            local anyOn = (ns.World and ns.World.IsEnabled()) or (ns.Terrain and ns.Terrain.IsEnabled())
            local on = (sub == "on") or (sub == "toggle" and not anyOn)
            if sub == "off" then on = false end
            if ns.World then ns.World.SetEnabled(on) end
            if ns.Terrain then ns.Terrain.SetEnabled(on) end
            FidelityEMatrix_Config.boxHidden = on
            if masterFrame then if on then masterFrame:Hide() else masterFrame:Show() end end
            CheckIdleCondition()
            if on then
                Say("Full-screen depth scene ON: units with nameplates and the map's trees, props and buildings near you are re-rendered with depth (box hidden). Put on red/cyan glasses and type /fide stereo anaglyph. /fide overlay off brings the box back.")
            else
                Say("Full-screen depth scene OFF; the box is back. Click it to ripple it open.")
            end

        elseif cmd == "terrain" then
            if ns.Terrain then
                ns.Terrain.Command(args, Say)
                CheckIdleCondition()
            else
                Say("EMatrix_Terrain.lua did not load.")
            end

        elseif cmd == "calibrate" then
            -- Moving the cursor right should slide the character right and turn it so you see
            -- more of its side facing you on the right. If either goes the wrong way, flip it.
            local which = args[2]
            if which == "side" or which == "turn" then
                local key = which .. "Sign"
                FidelityEMatrix_Config[key] = -Cfg(key)
                appliedEyeX = nil
                Say("%s sign is now %d", which, FidelityEMatrix_Config[key])
            else
                Say("Usage: /fide calibrate <side|turn>  (side %d, turn %d)", Cfg("sideSign"), Cfg("turnSign"))
            end

        elseif cmd == "diag" then
            RunDiagnostics()
            print("|cff00ffcc[Fidelity EMatrix Client Diagnostics]|r v" .. VERSION)
            print(string.format("  Project ID: %s | TOC: %d | Client: %s (%s)",
                tostring(DiagTable.projectID), DiagTable.tocVersion, tostring(DiagTable.buildVersion), tostring(DiagTable.buildNumber)))
            print("  Frame Support:")
            for f, supported in pairs(DiagTable.frames) do
                print(string.format("    - %s: %s", f, supported and "|cff00ff00YES|r" or "|cffff3333NO|r"))
            end
            print("  Key 3D Methods:")
            for _, m in ipairs({ "SetFacing", "SetLight", "SetPosition", "SetDefaultModelPosition", "SetCamera", "GetActiveCamera" }) do
                print(string.format("    - %s: %s", m, DiagTable.methods[m] and "|cff00ff00YES|r" or "|cffff3333NO|r"))
            end
            print(string.format("  SetLight form in use: |cffffffff%s|r", DiagTable.lightForm))

        elseif cmd == "scale" then
            local sc = tonumber(args[2])
            if sc and sc >= 0.5 and sc <= 2.5 then
                FidelityEMatrix_Config.scale = sc
                if masterFrame then masterFrame:SetScale(sc) end
                Say("Scale set to: %.2f", sc)
            else
                Say("Usage: /fide scale <0.5..2.5>")
            end

        elseif cmd == "status" then
            print("|cff00ffcc[Fidelity EMatrix Status]|r v" .. VERSION)
            print(string.format("  Matrix Grid: %d x %d (%d cells)", COLS, ROWS, TOTAL_CELLS))
            print(string.format("  State: %s | open %.2f", waveTargetState and "|cff00ff00OPEN (lens window)|r" or "|cffffcc00CLOSED (E-cubes)|r", openAmount))
            print(string.format("  Stereo: %s | Backdrop: %s | Lens: %.2f", StereoMode():upper(), Cfg("backdrop"), Cfg("lensAlpha")))
            print(string.format("  3D Model Engine: %s | Light form: %s", sceneMain and sceneMain:GetObjectType() or "None", DiagTable.lightForm))
            for _, pair in ipairs({ { "main", sceneMain }, { "left", sceneLeft }, { "right", sceneRight } }) do
                local m = pair[2]
                if m then
                    local p = m.__ematrixPos or {}
                    print(string.format("  Scene %s: %s, alpha %.2f, %dx%d, unit %s, pos (%.2f, %.3f, %.3f), level %s",
                        pair[1], m:IsShown() and "shown" or "HIDDEN", m:GetAlpha() or -1, m:GetWidth() or 0, m:GetHeight() or 0,
                        tostring(m.__ematrixUnit), p[1] or 0, p[2] or 0, p[3] or 0, tostring(m.GetFrameLevel and m:GetFrameLevel() or "?")))
                end
            end
            print(string.format("  Spin: %.2f | Parallax: %.2f | Eye: %.2f, %.2f", Cfg("spinSpeed"), Cfg("parallaxStrength"), smoothEyeX, smoothEyeY))
            local host = driverFrame or masterFrame
            print(string.format("  OnUpdate Hook: %s | Box: %s", (host and host:GetScript("OnUpdate")) and "|cff00ff00ATTACHED|r" or "|cff888888DETACHED (0.00 ms CPU)|r", (masterFrame and masterFrame:IsShown()) and "shown" or "hidden"))
            if ns.World then
                print(string.format("  World overlay: %s, %d actor(s)", ns.World.IsEnabled() and "|cff00ff00ON|r" or "off", ns.World.ActorCount()))
            end
            if ns.Terrain then
                local info = ns.Terrain.Info()
                print(string.format("  Terrain overlay: %s, %d prop(s), tile %s", ns.Terrain.IsEnabled() and "|cff00ff00ON|r" or "off", info.props or 0, tostring(info.tile)))
            end

        else
            print("|cff00ffcc[Fidelity EMatrix Commands]|r v" .. VERSION)
            print("  |cffffcc00/fide|r (or /fide toggle)          - Show/Hide (Shift-drag to move)")
            print("  |cffffcc00/fide ripple [x y]|r                - Scoreboard wave from (x, y)")
            print("  |cffffcc00/fide scene <player|target>|r       - Set the 3D subject")
            print("  |cffffcc00/fide spin <0..2>|r                 - Model rotation speed (0 = 0-CPU idle)")
            print("  |cffffcc00/fide parallax <0..1>|r             - Cursor-as-eye parallax (0 = 0-CPU idle)")
            print("  |cffffcc00/fide lens <0..1>|r                 - Open microlens bezel alpha (0 = seamless)")
            print("  |cffffcc00/fide backdrop <nebula|world|black>|r - Deep background")
            print("  |cffffcc00/fide stereo [off|sbs|cross|anaglyph]|r - Stereo 3D (tune: delta, pixels, mix)")
            print("  |cffffcc00/fide overlay <on|off>|r             - FULL-SCREEN depth scene (default): world + terrain overlays")
            print("  |cffffcc00/fide box <show|hide>|r              - The old scoreboard window (click it to ripple it open)")
            print("  |cffffcc00/fide world <on|off|status>|r       - Re-render the live actors over the game with depth (anaglyph with glasses)")
            print("  |cffffcc00/fide terrain <on|off|status|...>|r  - Draw the map's trees, props and buildings near you as depth props")
            print("  |cffffcc00/fide calibrate <side|turn>|r       - Flip a parallax sign if it moves the wrong way")
            print("  |cffffcc00/fide diag|r                        - Client engine probe")
            print("  |cffffcc00/fide scale <0.5..2.5>|r            - Uniform UI scale")
            print("  |cffffcc00/fide status|r                      - Runtime and idle-CPU status")
        end
    end)
    if not ok and err then
        print("|cffff3333[Fidelity EMatrix Error]|r " .. tostring(err))
    end
end

-- ============================================================================
-- 6. AddOn Loaded Event & Cross-Client Lifecycle
-- ============================================================================
local loader = CreateFrame("Frame")
loader:RegisterEvent("ADDON_LOADED")
loader:RegisterEvent("PLAYER_ENTERING_WORLD")
loader:SetScript("OnEvent", function(self, event, addon)
    if event == "ADDON_LOADED" then
        if addon == "FidelityEMatrix" or addon == ADDON_NAME then
            CreateMatrixGrid()
            if masterFrame and Cfg("boxHidden") then masterFrame:Hide() end
            if ns.World and Cfg("worldOverlay") then ns.World.SetEnabled(true) end
            if ns.Terrain and Cfg("terrainOverlay") then ns.Terrain.SetEnabled(true) end
            CheckIdleCondition()
            Say("v%s: full-screen depth scene %s. Move the mouse to lean. |cffffcc00/fide stereo anaglyph|r with glasses, |cffffcc00/fide overlay off|r to stop, |cffffcc00/fide box|r for the old window, |cffffcc00/fide status|r for numbers.", VERSION, (Cfg("worldOverlay") or Cfg("terrainOverlay")) and "|cff00ff00ON|r" or "off")
            self:UnregisterEvent("ADDON_LOADED")
        end
    elseif event == "PLAYER_ENTERING_WORLD" then
        if not masterFrame then
            CreateMatrixGrid()
            if masterFrame and Cfg("boxHidden") then masterFrame:Hide() end
            if ns.World and Cfg("worldOverlay") then ns.World.SetEnabled(true) end
            if ns.Terrain and Cfg("terrainOverlay") then ns.Terrain.SetEnabled(true) end
            CheckIdleCondition()
            Say("v%s: full-screen depth scene on. /fide overlay off to stop, /fide box for the old window.", VERSION)
        end
        self:UnregisterEvent("PLAYER_ENTERING_WORLD")
    end
end)

-- Exports (for /dump and the headless tests)
ns.TriggerScoreboardWave = TriggerScoreboardWave
ns.CreateMatrixGrid = CreateMatrixGrid
ns.UpdateStereoDisplay = UpdateStereoDisplay
ns.ApplyDepthPlanes = ApplyDepthPlanes
ns.cells = cells
ns.DiagTable = DiagTable
ns.GetEye = function() return smoothEyeX, smoothEyeY, currentFacing end
ns.State = function()
    return {
        open = waveTargetState, openAmount = openAmount, waveActive = waveActive,
        eyeX = smoothEyeX, eyeY = smoothEyeY, facing = currentFacing,
        frames = { main = sceneMain, left = sceneLeft, right = sceneRight, master = masterFrame, driver = driverFrame },
        walls = { wallL, wallR, wallT, wallB }, sheen = sheenTex,
        reticle = { mono = reticleMono, left = reticleL, right = reticleR }, backplate = backplateTex,
    }
end
