-- FidelityEMatrix/EMatrix_Core.lua
-- Single Master Frame with 3-Layer Sibling Architecture, Zero-GC Scoreboard Wave & 3D Optical Depth Chamber
-- Architecture:
--   L1 (Backplate): Full-grid (480x288) cosmic nebula starfield, no per-cell dark background.
--   L2 (Scene): Multi-plane 3D models (full-grid framing, orbital motion, head/cursor parallax).
--   L3 (Grid): 135 cell textures (flapTex, specBar, temporary creviceTex active only mid-flip).
-- Visual Behavior:
--   - Default state at load: 100% CLOSED (all 135 cells show opaque golden puffy "E" cubes).
--   - Open state: 100% SEAMLESS viewport (flapTex and creviceTex reach alpha = 0, zero cage lines).

local ADDON_NAME, ns = ...
local Math = (ns and ns.Math) or _G.EMatrix_Math

-- Configuration & Constants
local COLS = 15
local ROWS = 9
local TOTAL_CELLS = COLS * ROWS -- 135
local CELL_SIZE = 32
local MATRIX_WIDTH = COLS * CELL_SIZE  -- 480 px
local MATRIX_HEIGHT = ROWS * CELL_SIZE -- 288 px

local MEDIA_PATH = "Interface\\AddOns\\FidelityEMatrix\\Media\\"
local TEX_CLOSED   = MEDIA_PATH .. "Marshmallow_E_Closed.tga"
local TEX_WINDOW   = MEDIA_PATH .. "Marshmallow_E_Window.tga"
local TEX_BACKPLATE = MEDIA_PATH .. "Backplate_Nebula.tga"

-- SavedVariables defaults
FidelityEMatrix_Config = FidelityEMatrix_Config or {
    scale = 1.0,
    stereoMode = "off",     -- "off" (mono), "sbs" (side-by-side), "anaglyph" (red/cyan)
    waveSpeed = 16.0,       -- cells per second
    flipDuration = 0.26,    -- flip duration per cell in seconds
    spinSpeed = 0.50,       -- continuous model rotation speed (0 to disable for 0-CPU idle)
    parallaxStrength = 0.50 -- head/cursor parallax strength (0 to disable for 0-CPU idle)
}

-- Master Containers & Layer References
local masterFrame
local frameBackplate, backplateTex
local frameScene, sceneMain, sceneLeft, sceneRight, sceneSecondary
local frameGrid
local cells = {} -- Flat pre-allocated 1..135 array

-- Wave & Motion State (Zero Per-Frame Garbage)
local waveActive = false
local waveAge = 0.0
local waveOriginCol = 8
local waveOriginRow = 5
local waveTargetState = false -- false = Closed (E-cubes), true = Open (3D Viewport)

-- Parallax & Animation State
local animTime = 0.0
local currentFacing = 0.0
local smoothParallaxX = 0.0
local smoothParallaxY = 0.0
local lastClickTime = 0.0

-- Client Diagnostics Store
local DiagTable = {
    projectID = _G.WOW_PROJECT_ID or "Unknown",
    buildVersion = "Unknown",
    buildNumber = "Unknown",
    buildDate = "Unknown",
    tocVersion = 0,
    frames = {},
    methods = {}
}

-- Forward declarations
local TriggerScoreboardWave
local CreateMatrixGrid
local UpdateStereoDisplay
local CheckIdleCondition
local RunDiagnostics

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
-- 1. Master Frame & 3-Layer Sibling Architecture
-- ============================================================================
function CreateMatrixGrid()
    if masterFrame then return end

    Math = Math or (ns and ns.Math) or _G.EMatrix_Math
    if not Math then return end

    -- Run client probe
    RunDiagnostics()

    -- Master Container Frame (Draggable parent for all 3 layers)
    masterFrame = CreateFrame("Frame", "FidelityEMatrixFrame", UIParent)
    masterFrame:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
    masterFrame:SetPoint("CENTER", UIParent, "CENTER", 0, 40)
    masterFrame:SetScale(FidelityEMatrix_Config.scale or 1.0)
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

    -- Sleek Outer Housing Bezel (4px golden frame border enclosing the entire matrix)
    local outerBorder = masterFrame:CreateTexture(nil, "BACKGROUND", nil, -7)
    outerBorder:SetPoint("TOPLEFT", masterFrame, "TOPLEFT", -4, 4)
    outerBorder:SetPoint("BOTTOMRIGHT", masterFrame, "BOTTOMRIGHT", 4, -4)
    outerBorder:SetColorTexture(0.78, 0.65, 0.32, 0.95)

    local outerInner = masterFrame:CreateTexture(nil, "BACKGROUND", nil, -6)
    outerInner:SetPoint("TOPLEFT", masterFrame, "TOPLEFT", -1, 1)
    outerInner:SetPoint("BOTTOMRIGHT", masterFrame, "BOTTOMRIGHT", 1, -1)
    outerInner:SetColorTexture(0.04, 0.04, 0.06, 1.0)

    -- ------------------------------------------------------------------------
    -- LAYER 1: Backplate Frame (FrameLevel 22)
    -- Full-grid-size cosmic nebula starfield. No per-cell dark slotBg!
    -- ------------------------------------------------------------------------
    frameBackplate = CreateFrame("Frame", "FidelityEMatrix_Backplate", masterFrame)
    frameBackplate:SetAllPoints(masterFrame)
    frameBackplate:SetFrameLevel(22)
    frameBackplate:EnableMouse(false)

    backplateTex = frameBackplate:CreateTexture(nil, "BACKGROUND", nil, -4)
    backplateTex:SetAllPoints(frameBackplate)
    backplateTex:SetTexture(TEX_BACKPLATE)
    backplateTex:SetAlpha(0.92)

    -- ------------------------------------------------------------------------
    -- LAYER 2: 3D Scene Frame (FrameLevel 25)
    -- Multi-plane 3D models framed across the full grid rectangle (480x288)
    -- ------------------------------------------------------------------------
    frameScene = CreateFrame("Frame", "FidelityEMatrix_Scene", masterFrame)
    frameScene:SetAllPoints(masterFrame)
    frameScene:SetFrameLevel(25)
    frameScene:EnableMouse(false)

    -- Main 3D Subject Setup
    local function Create3DModel(name, w, h, point, relPoint, x, y)
        local model

        -- 1. Try Classic DressUpModel (Most robust in Classic / TBC with full armor/clothing framing)
        local okDM, dm = pcall(CreateFrame, "DressUpModel", name, frameScene)
        if okDM and dm then
            model = dm
            model:SetSize(w, h)
            model:SetPoint(point, frameScene, relPoint, x, y)
            model:SetFrameLevel(26)
            model:EnableMouse(false)
            pcall(function()
                dm:SetUnit("player")
                if dm.SetDefaultModelPosition then
                    dm:SetDefaultModelPosition()
                end
                if dm.SetFacing then dm:SetFacing(0) end
                -- Warm key light, cool violet fill
                if dm.SetLight then
                    dm:SetLight(true, false, -0.45, -0.55, 0.70, 1.0, 0.95, 0.75, 0.7, 0.20, 0.15, 0.35)
                end
            end)
            return model
        end

        -- 2. Try Retail ModelScene
        local okMS, ms = pcall(CreateFrame, "ModelScene", name, frameScene)
        if okMS and ms and ms.CreateActor then
            model = ms
            model:SetSize(w, h)
            model:SetPoint(point, frameScene, relPoint, x, y)
            model:SetFrameLevel(26)
            model:EnableMouse(false)
            pcall(function()
                local actor = ms:CreateActor()
                if actor and actor.SetModelByUnit then
                    actor:SetModelByUnit("player")
                    actor:SetPosition(0, 0, 0)
                end
                local camera = ms:GetActiveCamera()
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
            return model
        end

        -- 3. Fallback PlayerModel
        local okPM, pm = pcall(CreateFrame, "PlayerModel", name, frameScene)
        if okPM and pm then
            model = pm
            model:SetSize(w, h)
            model:SetPoint(point, frameScene, relPoint, x, y)
            model:SetFrameLevel(26)
            model:EnableMouse(false)
            pcall(function()
                pm:SetUnit("player")
                if pm.SetPosition then pm:SetPosition(0, 0, -0.15) end
                if pm.SetFacing then pm:SetFacing(0) end
            end)
            return model
        end

        return nil
    end

    -- Create Main Subject (Mono Parallax - Default)
    sceneMain = Create3DModel("FidelityEMatrix_SceneMain", MATRIX_WIDTH, MATRIX_HEIGHT, "CENTER", "CENTER", 0, 0)

    -- Create Stereo Dual-Eye Pairs (Left and Right halves)
    sceneLeft = Create3DModel("FidelityEMatrix_SceneLeft", MATRIX_WIDTH * 0.5, MATRIX_HEIGHT, "LEFT", "LEFT", 0, 0)
    sceneRight = Create3DModel("FidelityEMatrix_SceneRight", MATRIX_WIDTH * 0.5, MATRIX_HEIGHT, "RIGHT", "RIGHT", 0, 0)

    UpdateStereoDisplay()

    -- ------------------------------------------------------------------------
    -- LAYER 3: Cell Grid Frame (FrameLevel 30 - Forefront)
    -- 135 pre-allocated cell textures (flapTex, specBar, temporary creviceTex)
    -- ------------------------------------------------------------------------
    frameGrid = CreateFrame("Frame", "FidelityEMatrix_Grid", masterFrame)
    frameGrid:SetAllPoints(masterFrame)
    frameGrid:SetFrameLevel(30)
    frameGrid:EnableMouse(false)

    -- Flat 135 Cell Array
    for r = 1, ROWS do
        for c = 1, COLS do
            local idx = (r - 1) * COLS + c
            local cx = (c - 0.5) * CELL_SIZE
            local cy = -((r - 0.5) * CELL_SIZE)

            local rotIdx, uv8 = Math.GetCellRotation(c, r)

            -- Cell struct (pre-allocated once at startup)
            local cell = {
                col = c,
                row = r,
                cx = cx,
                cy = cy,
                rotIdx = rotIdx,
                uv8 = uv8,
                ringDist = 0.0,
                isWindow = false, -- Default state is CLOSED!
                settled = true
            }

            -- Texture 1: creviceTex (BACKGROUND, sublevel 1)
            -- Temporary dark crevice visible ONLY mid-flip (alpha=0 at u=0 and u=1)
            local creviceTex = frameGrid:CreateTexture(nil, "BACKGROUND", nil, 1)
            creviceTex:SetSize(CELL_SIZE, CELL_SIZE)
            creviceTex:SetPoint("CENTER", frameGrid, "TOPLEFT", cx, cy)
            creviceTex:SetColorTexture(0.02, 0.02, 0.03, 1.0)
            creviceTex:SetAlpha(0.0) -- Zero at load!
            cell.creviceTex = creviceTex

            -- Texture 2: flapTex (ARTWORK, sublevel 2)
            -- Holds the puffy Marshmallow E (Closed) or Window Bezel (Open)
            local flapTex = frameGrid:CreateTexture(nil, "ARTWORK", nil, 2)
            flapTex:SetSize(CELL_SIZE, CELL_SIZE)
            flapTex:SetPoint("CENTER", frameGrid, "TOPLEFT", cx, cy)
            flapTex:SetTexture(TEX_CLOSED) -- Default state: CLOSED!
            flapTex:SetTexCoord(unpack(uv8))
            flapTex:SetAlpha(1.0) -- Fully opaque at load!
            cell.flapTex = flapTex

            -- Texture 3: specBar (OVERLAY, sublevel 3)
            -- Thin 32x2 golden-white specular flash bar at cell CENTER
            local specBar = frameGrid:CreateTexture(nil, "OVERLAY", nil, 3)
            specBar:SetSize(CELL_SIZE, 2)
            specBar:SetPoint("CENTER", frameGrid, "TOPLEFT", cx, cy)
            specBar:SetColorTexture(1.0, 0.94, 0.68, 1.0)
            specBar:SetAlpha(0.0)
            cell.specBar = specBar

            cells[idx] = cell
        end
    end

    -- Click-Picking Handler on Master Frame
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
                local relX = mx - left
                local relY = top - my

                local col = math.floor(relX / CELL_SIZE) + 1
                local row = math.floor(relY / CELL_SIZE) + 1

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

    -- Attach OnUpdate if animation (spin/parallax) is enabled
    CheckIdleCondition()
end

-- ============================================================================
-- 2. Stereo Display Rig
-- ============================================================================
function UpdateStereoDisplay()
    local mode = FidelityEMatrix_Config.stereoMode or "off"

    if mode == "sbs" then
        if sceneMain then sceneMain:Hide() end
        if sceneLeft then
            sceneLeft:Show()
            sceneLeft:ClearAllPoints()
            sceneLeft:SetSize(MATRIX_WIDTH * 0.5, MATRIX_HEIGHT)
            sceneLeft:SetPoint("LEFT", frameScene, "LEFT", 0, 0)
            sceneLeft:SetAlpha(1.0)
        end
        if sceneRight then
            sceneRight:Show()
            sceneRight:ClearAllPoints()
            sceneRight:SetSize(MATRIX_WIDTH * 0.5, MATRIX_HEIGHT)
            sceneRight:SetPoint("RIGHT", frameScene, "RIGHT", 0, 0)
            sceneRight:SetAlpha(1.0)
        end

    elseif mode == "anaglyph" then
        -- Anaglyph: Both scenes full area, blended with complementary lighting/alpha
        if sceneMain then sceneMain:Hide() end
        if sceneLeft then
            sceneLeft:Show()
            sceneLeft:ClearAllPoints()
            sceneLeft:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneLeft:SetPoint("CENTER", frameScene, "CENTER", -3, 0)
            sceneLeft:SetAlpha(0.60)
            if sceneLeft.SetLight then
                sceneLeft:SetLight(true, false, -0.5, -0.5, 0.7, 1.0, 0.2, 0.2, 0.8, 0.2, 0.05, 0.05) -- Red Key
            end
        end
        if sceneRight then
            sceneRight:Show()
            sceneRight:ClearAllPoints()
            sceneRight:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneRight:SetPoint("CENTER", frameScene, "CENTER", 3, 0)
            sceneRight:SetAlpha(0.60)
            if sceneRight.SetLight then
                sceneRight:SetLight(true, false, 0.5, -0.5, 0.7, 0.2, 0.9, 1.0, 0.8, 0.05, 0.2, 0.25) -- Cyan Key
            end
        end

    else
        -- Mono Parallax (Default): Single ModelScene spanning full matrix
        if sceneMain then
            sceneMain:Show()
            sceneMain:ClearAllPoints()
            sceneMain:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneMain:SetPoint("CENTER", frameScene, "CENTER", 0, 0)
            sceneMain:SetAlpha(1.0)
            if sceneMain.SetLight then
                sceneMain:SetLight(true, false, -0.45, -0.55, 0.70, 1.0, 0.95, 0.75, 0.7, 0.20, 0.15, 0.35)
            end
        end
        if sceneLeft then
            sceneLeft:Hide()
            sceneLeft:SetAlpha(0.0)
        end
        if sceneRight then
            sceneRight:Hide()
            sceneRight:SetAlpha(0.0)
        end
    end
end

-- ============================================================================
-- 3. Zero-GC Scoreboard Wave & Motion Driver
-- ============================================================================
local function OnUpdateDriver(self, dt)
    animTime = animTime + dt

    -- 1. Scoreboard Wave Cascade
    if waveActive then
        local speed = FidelityEMatrix_Config.waveSpeed or 16.0
        local dur = FidelityEMatrix_Config.flipDuration or 0.26
        waveAge = waveAge + dt

        local allDone = true
        local opening = waveTargetState -- true if flipping to Open (Window)

        for i = 1, TOTAL_CELLS do
            local cell = cells[i]
            if cell then
                local u = Math.CalculateFlipProgress(waveAge, speed, cell.ringDist, dur)

                if u < 1.0 then
                    allDone = false
                end

                if u > 0.0 and u < 1.0 then
                    cell.settled = false
                    local scaleY, specAlpha, isFlipped, creviceAlpha = Math.GetFlipVisuals(u)

                    -- Vertical squash anchored at cell center
                    cell.flapTex:SetHeight(CELL_SIZE * scaleY)

                    -- Golden specular bar flash at midpoint u=0.5
                    cell.specBar:SetAlpha(specAlpha)

                    -- Dark crevice backing: visible ONLY mid-flip
                    cell.creviceTex:SetAlpha(creviceAlpha)

                    -- Texture swap and aperture merge:
                    if opening then
                        -- Closing -> Opening:
                        if isFlipped then
                            cell.flapTex:SetTexture(TEX_WINDOW)
                            -- Smoothly fade window bezel to 0.0 at u=1 so open viewport has ZERO cage seams!
                            local fade = math.max(0.0, 1.0 - (u - 0.5) * 2.0)
                            cell.flapTex:SetAlpha(fade)
                            cell.isWindow = true
                        else
                            cell.flapTex:SetTexture(TEX_CLOSED)
                            cell.flapTex:SetAlpha(1.0)
                        end
                    else
                        -- Opening -> Closing:
                        if isFlipped then
                            cell.flapTex:SetTexture(TEX_CLOSED)
                            local fadeIn = math.min(1.0, (u - 0.5) * 2.0)
                            cell.flapTex:SetAlpha(fadeIn)
                            cell.isWindow = false
                        else
                            cell.flapTex:SetTexture(TEX_WINDOW)
                            cell.flapTex:SetAlpha(0.0)
                        end
                    end

                elseif u >= 1.0 and not cell.settled then
                    -- Settle into final state
                    cell.flapTex:SetHeight(CELL_SIZE)
                    cell.specBar:SetAlpha(0.0)
                    cell.creviceTex:SetAlpha(0.0) -- ALWAYS zero in settled state!
                    cell.isWindow = opening

                    if opening then
                        -- FULLY OPEN: Alpha = 0.0 for seamless unobstructed 3D view!
                        cell.flapTex:SetTexture(TEX_WINDOW)
                        cell.flapTex:SetAlpha(0.0)
                    else
                        -- FULLY CLOSED: Alpha = 1.0 for solid golden puffy E-wall!
                        cell.flapTex:SetTexture(TEX_CLOSED)
                        cell.flapTex:SetAlpha(1.0)
                    end
                    cell.settled = true
                end
            end
        end

        if allDone then
            waveActive = false
        end
    end

    -- 2. 3D Model Continuous Rotation (Spin)
    local spin = FidelityEMatrix_Config.spinSpeed or 0.50
    if spin > 0.0 then
        currentFacing = currentFacing + dt * spin
        if currentFacing > 6.28318 then currentFacing = currentFacing - 6.28318 end

        if sceneMain and sceneMain:IsShown() then
            if sceneMain.SetFacing then
                sceneMain:SetFacing(currentFacing)
            elseif sceneMain.SetRotation then
                sceneMain:SetRotation(currentFacing)
            end
        end
        if sceneLeft and sceneLeft:IsShown() and sceneLeft.SetFacing then
            sceneLeft:SetFacing(currentFacing)
        end
        if sceneRight and sceneRight:IsShown() and sceneRight.SetFacing then
            sceneRight:SetFacing(currentFacing)
        end
    end

    -- 3. Head / Cursor Parallax Depth Offset
    local pStr = FidelityEMatrix_Config.parallaxStrength or 0.50
    if pStr > 0.0 then
        local mx, my = GetCursorPosition()
        local sw, sh = GetScreenWidth() or 1920, GetScreenHeight() or 1080
        local uis = UIParent:GetEffectiveScale() or 1.0
        mx, my = mx / uis, my / uis

        local fx = masterFrame:GetLeft() or (sw * 0.5)
        local fy = masterFrame:GetBottom() or (sh * 0.5)
        local frameCenterX = fx + MATRIX_WIDTH * 0.5
        local frameCenterY = fy + MATRIX_HEIGHT * 0.5

        local targetX = math.min(math.max((mx - frameCenterX) / (sw * 0.5), -1.0), 1.0) * pStr
        local targetY = math.min(math.max((my - frameCenterY) / (sh * 0.5), -1.0), 1.0) * pStr

        -- Smooth lerp
        smoothParallaxX = smoothParallaxX + (targetX - smoothParallaxX) * math.min(dt * 8.0, 1.0)
        smoothParallaxY = smoothParallaxY + (targetY - smoothParallaxY) * math.min(dt * 8.0, 1.0)

        -- Layer 1: Backplate shifts slowly (deep background: z = 0.20)
        if frameBackplate then
            backplateTex:ClearAllPoints()
            backplateTex:SetPoint("CENTER", frameBackplate, "CENTER", -smoothParallaxX * 10, -smoothParallaxY * 6)
        end

        -- Layer 2: Main Subject shifts at focal plane (z = 0.80)
        if sceneMain and sceneMain:IsShown() and sceneMain.SetPosition then
            sceneMain:SetPosition(smoothParallaxX * 0.12, 0, smoothParallaxY * 0.08)
        end
    end

    -- Check if animation is completely idle to detach OnUpdate
    CheckIdleCondition()
end

--- Detaches OnUpdate when no wave, spin, or parallax is active (0.00 ms idle CPU).
function CheckIdleCondition()
    if not masterFrame then return end

    local spin = FidelityEMatrix_Config.spinSpeed or 0.50
    local pStr = FidelityEMatrix_Config.parallaxStrength or 0.50

    if waveActive or spin > 0.0 or pStr > 0.0 then
        if not masterFrame:GetScript("OnUpdate") then
            masterFrame:SetScript("OnUpdate", OnUpdateDriver)
        end
    else
        if masterFrame:GetScript("OnUpdate") then
            masterFrame:SetScript("OnUpdate", nil) -- ZERO IDLE CPU!
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

    -- Toggle target state: Closed -> Open or Open -> Closed
    waveTargetState = not waveTargetState

    -- Precompute wave distances once at trigger time (0-GC during wave)
    for i = 1, TOTAL_CELLS do
        local cell = cells[i]
        if cell then
            cell.ringDist = Math.CalculateRingDistance(cell.col, cell.row, ox, oy)
            cell.settled = false
        end
    end

    waveActive = true
    if not masterFrame:GetScript("OnUpdate") then
        masterFrame:SetScript("OnUpdate", OnUpdateDriver)
    end
end

-- ============================================================================
-- 4. Slash Commands & AddOn Lifecycle
-- ============================================================================
SLASH_FIDELITYEMATRIX1 = "/fide"
SLASH_FIDELITYEMATRIX2 = "/ematrix"

SlashCmdList["FIDELITYEMATRIX"] = function(msg)
    local ok, err = pcall(function()
        local args = {}
        for word in string.gmatch(msg or "", "%S+") do
            table.insert(args, string.lower(word))
        end

        local cmd = args[1] or "toggle"

        if cmd == "toggle" or cmd == "show" or cmd == "hide" then
            if not masterFrame then CreateMatrixGrid() end
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
            print(string.format("|cff00ffcc[Fidelity EMatrix]|r Ripple triggered from (%d, %d). Target: %s",
                ox, oy, waveTargetState and "|cff00ff00OPEN VIEWPORT|r" or "|cffffcc00CLOSED E-CUBES|r"))

        elseif cmd == "scene" then
            local unit = args[2] or "player"
            if sceneMain and sceneMain.SetUnit then
                pcall(function()
                    sceneMain:SetUnit(unit)
                    if sceneMain.SetDefaultModelPosition then sceneMain:SetDefaultModelPosition() end
                end)
                print(string.format("|cff00ffcc[Fidelity EMatrix]|r Scene model set to unit: |cffffffff%s|r", unit))
            else
                print("|cffff3333[Fidelity EMatrix]|r Model unit swap not supported on this client frame.")
            end

        elseif cmd == "spin" then
            local sp = tonumber(args[2])
            if sp and sp >= 0 and sp <= 2.0 then
                FidelityEMatrix_Config.spinSpeed = sp
                CheckIdleCondition()
                print(string.format("|cff00ffcc[Fidelity EMatrix]|r Spin speed set to: %.2f (0 = 0-CPU idle)", sp))
            else
                print("|cff00ffcc[Fidelity EMatrix]|r Usage: /fide spin <0..2>")
            end

        elseif cmd == "parallax" then
            local pr = tonumber(args[2])
            if pr and pr >= 0 and pr <= 1.0 then
                FidelityEMatrix_Config.parallaxStrength = pr
                CheckIdleCondition()
                print(string.format("|cff00ffcc[Fidelity EMatrix]|r Parallax strength set to: %.2f (0 = 0-CPU idle)", pr))
            else
                print("|cff00ffcc[Fidelity EMatrix]|r Usage: /fide parallax <0..1>")
            end

        elseif cmd == "stereo" then
            local sub = args[2] or "toggle"
            if sub == "sbs" then
                FidelityEMatrix_Config.stereoMode = "sbs"
            elseif sub == "anaglyph" then
                FidelityEMatrix_Config.stereoMode = "anaglyph"
            elseif sub == "off" or sub == "mono" then
                FidelityEMatrix_Config.stereoMode = "off"
            else
                local cur = FidelityEMatrix_Config.stereoMode or "off"
                if cur == "off" then FidelityEMatrix_Config.stereoMode = "sbs"
                elseif cur == "sbs" then FidelityEMatrix_Config.stereoMode = "anaglyph"
                else FidelityEMatrix_Config.stereoMode = "off" end
            end
            UpdateStereoDisplay()
            print(string.format("|cff00ffcc[Fidelity EMatrix]|r Stereo Mode: |cffffffff%s|r", FidelityEMatrix_Config.stereoMode:upper()))

        elseif cmd == "diag" then
            RunDiagnostics()
            print("|cff00ffcc[Fidelity EMatrix Client Diagnostics]|r")
            print(string.format("  Project ID: %s | TOC: %d | Client: %s (%s)",
                tostring(DiagTable.projectID), DiagTable.tocVersion, tostring(DiagTable.buildVersion), tostring(DiagTable.buildNumber)))
            print("  Frame Support:")
            for f, supported in pairs(DiagTable.frames) do
                print(string.format("    - %s: %s", f, supported and "|cff00ff00YES|r" or "|cffff3333NO|r"))
            end
            print("  Key 3D Methods:")
            local methods = { "SetFacing", "SetLight", "SetDefaultModelPosition", "SetCamera", "GetActiveCamera" }
            for _, m in ipairs(methods) do
                print(string.format("    - %s: %s", m, DiagTable.methods[m] and "|cff00ff00YES|r" or "|cffff3333NO|r"))
            end

        elseif cmd == "scale" then
            local sc = tonumber(args[2])
            if sc and sc >= 0.5 and sc <= 2.5 then
                FidelityEMatrix_Config.scale = sc
                if masterFrame then masterFrame:SetScale(sc) end
                print(string.format("|cff00ffcc[Fidelity EMatrix]|r Scale set to: %.2f", sc))
            else
                print("|cff00ffcc[Fidelity EMatrix]|r Usage: /fide scale <0.5..2.5>")
            end

        elseif cmd == "status" then
            print("|cff00ffcc[Fidelity EMatrix Status]|r")
            print(string.format("  Matrix Grid: %d x %d (%d cells)", COLS, ROWS, TOTAL_CELLS))
            print(string.format("  State: %s", waveTargetState and "|cff00ff00OPEN (Seamless Viewport)|r" or "|cffffcc00CLOSED (Puffy E-Cubes)|r"))
            print(string.format("  Stereo Mode: %s", (FidelityEMatrix_Config.stereoMode or "off"):upper()))
            print(string.format("  3D Model Engine: %s", sceneMain and sceneMain:GetObjectType() or "None"))
            print(string.format("  Spin Speed: %.2f | Parallax: %.2f", FidelityEMatrix_Config.spinSpeed or 0, FidelityEMatrix_Config.parallaxStrength or 0))
            print(string.format("  OnUpdate Hook: %s", (masterFrame and masterFrame:GetScript("OnUpdate")) and "|cff00ff00ATTACHED|r" or "|cff888888DETACHED (0.00 ms CPU)|r"))

        else
            print("|cff00ffcc[Fidelity EMatrix Commands]|r")
            print("  |cffffcc00/fide|r (or /fide toggle)         - Show/Hide Matrix Frame (Shift-drag to move)")
            print("  |cffffcc00/fide ripple [x y]|r               - Trigger scoreboard wave from (x, y)")
            print("  |cffffcc00/fide scene <player|target>|r      - Set main 3D subject unit")
            print("  |cffffcc00/fide spin <0..2>|r                - Set model rotation speed (0 = 0-CPU idle)")
            print("  |cffffcc00/fide parallax <0..1>|r            - Set cursor/head parallax (0 = 0-CPU idle)")
            print("  |cffffcc00/fide stereo [off|sbs|anaglyph]|r  - Switch stereoscopic 3D mode")
            print("  |cffffcc00/fide diag|r                       - Print client engine probe table")
            print("  |cffffcc00/fide scale <0.5..2.5>|r           - Uniform UI scale")
            print("  |cffffcc00/fide status|r                     - Display current runtime & idle CPU status")
        end
    end)
    if not ok and err then
        print("|cffff3333[Fidelity EMatrix Error]|r " .. tostring(err))
    end
end

-- ============================================================================
-- 5. AddOn Loaded Event & Cross-Client Lifecycle
-- ============================================================================
local loader = CreateFrame("Frame")
loader:RegisterEvent("ADDON_LOADED")
loader:RegisterEvent("PLAYER_ENTERING_WORLD")
loader:SetScript("OnEvent", function(self, event, addon)
    if event == "ADDON_LOADED" then
        if addon == "FidelityEMatrix" or addon == ADDON_NAME then
            CreateMatrixGrid()
            print("|cff00ffcc[Fidelity EMatrix]|r v1.1.0 initialized (Closed E-Cubes). Click any cell to ripple open, or type |cffffcc00/fide|r.")
            self:UnregisterEvent("ADDON_LOADED")
        end
    elseif event == "PLAYER_ENTERING_WORLD" then
        if not masterFrame then
            CreateMatrixGrid()
            print("|cff00ffcc[Fidelity EMatrix]|r v1.1.0 initialized (Closed E-Cubes). Click any cell to ripple open, or type |cffffcc00/fide|r.")
        end
        self:UnregisterEvent("PLAYER_ENTERING_WORLD")
    end
end)

-- Exports
ns.TriggerScoreboardWave = TriggerScoreboardWave
ns.CreateMatrixGrid = CreateMatrixGrid
ns.cells = cells
ns.DiagTable = DiagTable
