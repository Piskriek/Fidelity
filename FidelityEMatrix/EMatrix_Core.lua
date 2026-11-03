-- FidelityEMatrix/EMatrix_Core.lua
-- Single Master Frame, Pre-allocated Texture Pool, 0-GC Scoreboard Wave & Stereoscopic ModelScene
-- Visual Target: 15x9 (135 cells) static twice-folded puffy marshmallow E-cubes with flip-scoreboard transition.

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
local TEX_CLOSED = MEDIA_PATH .. "Marshmallow_E_Closed.tga"
local TEX_WINDOW = MEDIA_PATH .. "Marshmallow_E_Window.tga"

-- SavedVariables defaults
FidelityEMatrix_Config = FidelityEMatrix_Config or {
    scale = 1.0,
    stereoMode = "off", -- "off" (mono parallax), "sbs" (side-by-side), "anaglyph" (red/cyan)
    waveSpeed = 16.0,   -- cells per second
    flipDuration = 0.26 -- flip duration per cell in seconds
}

-- Master Containers
local masterFrame
local sceneContainer
local sceneMain, sceneLeft, sceneRight
local mainActor, leftActor, rightActor
local cells = {} -- Flat pre-allocated 1..135 array

-- Wave State (Zero Per-Frame Garbage)
local waveActive = false
local waveAge = 0.0
local waveOriginCol = 8
local waveOriginRow = 5
local waveTargetState = false -- false = Closed, true = Window

-- Parallax State
local parallaxTime = 0.0

-- Forward declarations
local TriggerScoreboardWave
local CreateStereoModelScenes
local UpdateStereoDisplay

-- ============================================================================
-- 1. Master Frame & Pre-allocated Texture Pool
-- ============================================================================
local function CreateMatrixGrid()
    if masterFrame then return end

    Math = Math or (ns and ns.Math) or _G.EMatrix_Math
    if not Math then return end

    -- Master Frame
    masterFrame = CreateFrame("Frame", "FidelityEMatrixFrame", UIParent)
    masterFrame:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
    masterFrame:SetPoint("CENTER", UIParent, "CENTER", 0, 40)
    masterFrame:SetScale(FidelityEMatrix_Config.scale or 1.0)
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

    -- Flat Pre-allocated Cell Array (Created FIRST so UI is always 100% resilient)
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
                isWindow = false,
                settled = true
            }

            -- Texture 1: slotBg (BACKGROUND, sublevel 1)
            -- Static dark crevice frame where the cube sits (never moves)
            local slotBg = masterFrame:CreateTexture(nil, "BACKGROUND", nil, 1)
            slotBg:SetSize(CELL_SIZE, CELL_SIZE)
            slotBg:SetPoint("CENTER", masterFrame, "TOPLEFT", cx, cy)
            slotBg:SetColorTexture(0.02, 0.02, 0.03, 0.95)
            cell.slotBg = slotBg

            -- Texture 2: flapTex (ARTWORK, sublevel 2)
            -- Vertical flip height squash (32 -> 1 -> 32) anchored at cell CENTER
            local flapTex = masterFrame:CreateTexture(nil, "ARTWORK", nil, 2)
            flapTex:SetSize(CELL_SIZE, CELL_SIZE)
            flapTex:SetPoint("CENTER", masterFrame, "TOPLEFT", cx, cy)
            flapTex:SetTexture(TEX_CLOSED)
            flapTex:SetTexCoord(unpack(uv8))
            cell.flapTex = flapTex

            -- Texture 3: specBar (OVERLAY, sublevel 3)
            -- Thin 32x2 golden-white specular flash bar at cell CENTER
            local specBar = masterFrame:CreateTexture(nil, "OVERLAY", nil, 3)
            specBar:SetSize(CELL_SIZE, 2)
            specBar:SetPoint("CENTER", masterFrame, "TOPLEFT", cx, cy)
            specBar:SetColorTexture(1.0, 0.94, 0.68, 1.0)
            specBar:SetAlpha(0.0)
            cell.specBar = specBar

            cells[idx] = cell
        end
    end

    -- Single Click-Picking Handler on Master Frame (Guarded against exceptions)
    masterFrame:SetScript("OnMouseDown", function(self, button)
        if button == "LeftButton" and not IsShiftKeyDown() then
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
                end
            end)
        end
    end)

    -- 3D ModelScene / PlayerModel Container (Behind cells, non-blocking)
    pcall(function()
        sceneContainer = CreateFrame("Frame", "FidelityEMatrix_SceneContainer", masterFrame)
        sceneContainer:SetAllPoints(masterFrame)
        sceneContainer:EnableMouse(false)
        sceneContainer:SetFrameLevel(math.max(masterFrame:GetFrameLevel() - 1, 1))
        CreateStereoModelScenes()
    end)
end

-- ============================================================================
-- 2. Guardrail D: 3D ModelScene Rig (Retail ModelScene + Classic PlayerModel Fallback)
-- ============================================================================
function CreateStereoModelScenes()
    if not sceneContainer then return end

    local function SetupScene(name, w, h, point, relPoint, x, y)
        local scene, actor

        -- 1. Try Retail ModelScene
        local okMS, ms = pcall(CreateFrame, "ModelScene", name, sceneContainer)
        if okMS and ms and ms.CreateActor then
            scene = ms
            scene:SetSize(w, h)
            scene:SetPoint(point, sceneContainer, relPoint, x, y)
            scene:EnableMouse(false)

            pcall(function()
                actor = scene:CreateActor()
                if actor and actor.SetModelByUnit then
                    actor:SetModelByUnit("player")
                    actor:SetPosition(0, 0, 0)
                    if actor.SetAnimation then actor:SetAnimation(0) end
                end
            end)

            pcall(function()
                local camera = scene:GetActiveCamera()
                if not camera and CreateModelSceneCamera then
                    camera = CreateModelSceneCamera("OrbitCamera")
                    if camera and scene.AddCamera then
                        scene:AddCamera(camera)
                        scene:SetActiveCamera(camera)
                    end
                end
            end)

            return scene, actor
        end

        -- 2. Fallback to Classic / TBC PlayerModel
        local okPM, pm = pcall(CreateFrame, "PlayerModel", name, sceneContainer)
        if okPM and pm then
            scene = pm
            scene:SetSize(w, h)
            scene:SetPoint(point, sceneContainer, relPoint, x, y)
            scene:EnableMouse(false)
            pcall(function()
                pm:SetUnit("player")
                if pm.SetRotation then pm:SetRotation(0) end
                if pm.SetCamera then pm:SetCamera(0) end
            end)
            return scene, nil
        end

        return nil, nil
    end

    -- 1. Main Scene (Mono Parallax - Default)
    sceneMain, mainActor = SetupScene("FidelityEMatrix_SceneMain", MATRIX_WIDTH, MATRIX_HEIGHT, "CENTER", "CENTER", 0, 0)

    -- 2. Left Eye Scene (Stereo SBS / Anaglyph)
    sceneLeft, leftActor = SetupScene("FidelityEMatrix_SceneLeft", MATRIX_WIDTH * 0.5, MATRIX_HEIGHT, "LEFT", "LEFT", 0, 0)

    -- 3. Right Eye Scene (Stereo SBS / Anaglyph)
    sceneRight, rightActor = SetupScene("FidelityEMatrix_SceneRight", MATRIX_WIDTH * 0.5, MATRIX_HEIGHT, "RIGHT", "RIGHT", 0, 0)

    UpdateStereoDisplay()
end

function UpdateStereoDisplay()
    local mode = FidelityEMatrix_Config.stereoMode or "off"
    local eyeOffset = 0.065 -- Interpupillary lateral offset

    if mode == "sbs" then
        if sceneMain then sceneMain:Hide() end
        if sceneLeft then
            sceneLeft:Show()
            sceneLeft:ClearAllPoints()
            sceneLeft:SetSize(MATRIX_WIDTH * 0.5, MATRIX_HEIGHT)
            sceneLeft:SetPoint("LEFT", sceneContainer, "LEFT", 0, 0)
            local camL = sceneLeft.GetActiveCamera and sceneLeft:GetActiveCamera()
            if camL and camL.SetPosition then
                camL:SetPosition(-eyeOffset * 0.5, -3.2, 1.1)
                if camL.SetTarget then camL:SetTarget(0, 0, 1.1) end
            end
        end
        if sceneRight then
            sceneRight:Show()
            sceneRight:ClearAllPoints()
            sceneRight:SetSize(MATRIX_WIDTH * 0.5, MATRIX_HEIGHT)
            sceneRight:SetPoint("RIGHT", sceneContainer, "RIGHT", 0, 0)
            local camR = sceneRight.GetActiveCamera and sceneRight:GetActiveCamera()
            if camR and camR.SetPosition then
                camR:SetPosition(eyeOffset * 0.5, -3.2, 1.1)
                if camR.SetTarget then camR:SetTarget(0, 0, 1.1) end
            end
        end

    elseif mode == "anaglyph" then
        if sceneMain then sceneMain:Hide() end
        if sceneLeft then
            sceneLeft:Show()
            sceneLeft:ClearAllPoints()
            sceneLeft:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneLeft:SetPoint("CENTER", sceneContainer, "CENTER", 0, 0)
            sceneLeft:SetAlpha(0.65)
        end
        if sceneRight then
            sceneRight:Show()
            sceneRight:ClearAllPoints()
            sceneRight:SetSize(MATRIX_WIDTH, MATRIX_HEIGHT)
            sceneRight:SetPoint("CENTER", sceneContainer, "CENTER", 0, 0)
            sceneRight:SetAlpha(0.65)
        end

    else
        -- Mono Parallax: sceneMain full size
        if sceneMain then sceneMain:Show() end
        if sceneLeft then sceneLeft:Hide() end
        if sceneRight then sceneRight:Hide() end

        if sceneMain and sceneMain.GetActiveCamera then
            local cam = sceneMain:GetActiveCamera()
            if cam and cam.SetPosition then
                cam:SetPosition(0.0, -3.2, 1.1)
                if cam.SetTarget then cam:SetTarget(0, 0, 1.1) end
            end
        end
    end
end

-- ============================================================================
-- 3. Guardrail C: Zero-GC OnUpdate Scoreboard Wave Driver
-- ============================================================================
local function OnUpdateWaveDriver(self, dt)
    if not waveActive then return end

    local speed = FidelityEMatrix_Config.waveSpeed or 16.0
    local dur = FidelityEMatrix_Config.flipDuration or 0.26

    waveAge = waveAge + dt
    parallaxTime = parallaxTime + dt

    local allDone = true
    local targetTex = waveTargetState and TEX_WINDOW or TEX_CLOSED

    for i = 1, TOTAL_CELLS do
        local cell = cells[i]
        if cell then
            local u = Math.CalculateFlipProgress(waveAge, cell.ringDist, speed, dur)

            if u > 0.0 and u < 1.0 then
                allDone = false
                cell.settled = false

                local scaleY, specAlpha, isFlipped = Math.EvaluateFlipVisuals(u)

                -- Vertical squash anchored at cell center
                cell.flapTex:SetHeight(CELL_SIZE * scaleY)

                -- Golden specular bar flash peak at u=0.5
                cell.specBar:SetAlpha(specAlpha)

                -- Swap texture at midpoint
                if isFlipped then
                    if cell.isWindow ~= waveTargetState then
                        cell.flapTex:SetTexture(targetTex)
                        cell.isWindow = waveTargetState
                    end
                else
                    local oldTex = waveTargetState and TEX_CLOSED or TEX_WINDOW
                    if cell.flapTex:GetTexture() ~= oldTex then
                        cell.flapTex:SetTexture(oldTex)
                    end
                end

            elseif u >= 1.0 and not cell.settled then
                -- Settle cell into target state
                cell.flapTex:SetHeight(CELL_SIZE)
                cell.flapTex:SetTexture(targetTex)
                cell.specBar:SetAlpha(0.0)
                cell.isWindow = waveTargetState
                cell.settled = true
            end
        end
    end

    -- Camera Parallax Update (subtle head/orbit motion behind the static grid)
    if sceneMain and sceneMain:IsShown() then
        if sceneMain.GetActiveCamera then
            local cam = sceneMain:GetActiveCamera()
            if cam and cam.SetPosition then
                local facing = (GetPlayerFacing and GetPlayerFacing()) or 0.0
                local orbitX = math.sin(parallaxTime * 0.5) * 0.15 + (facing * 0.1)
                cam:SetPosition(orbitX, -3.2, 1.1)
            end
        elseif sceneMain.SetRotation then
            local facing = (GetPlayerFacing and GetPlayerFacing()) or 0.0
            sceneMain:SetRotation(facing + math.sin(parallaxTime * 0.5) * 0.1)
        end
    end

    -- When all cells have completed their flip, cleanly detach OnUpdate
    if allDone then
        waveActive = false
        masterFrame:SetScript("OnUpdate", nil) -- ZERO IDLE CPU!
    end
end

--- Triggers an outward scoreboard ripple from cell (ox, oy).
--- @param ox number Origin column [1..15]
--- @param oy number Origin row [1..9]
function TriggerScoreboardWave(ox, oy)
    if not masterFrame then CreateMatrixGrid() end
    if not masterFrame then return end

    Math = Math or (ns and ns.Math) or _G.EMatrix_Math
    if not Math then return end

    if not cells or #cells < TOTAL_CELLS then
        return
    end

    ox = ox or 8
    oy = oy or 5
    ox = math.min(math.max(math.floor(ox), 1), COLS)
    oy = math.min(math.max(math.floor(oy), 1), ROWS)

    waveOriginCol = ox
    waveOriginRow = oy
    waveAge = 0.0

    -- Toggle target state: Closed -> Window or Window -> Closed
    waveTargetState = not waveTargetState

    -- Precompute wave distance for all 135 cells once at trigger time (0-GC during wave)
    for i = 1, TOTAL_CELLS do
        local cell = cells[i]
        if cell then
            cell.ringDist = Math.CalculateRingDistance(cell.col, cell.row, ox, oy)
            cell.settled = false
        end
    end

    waveActive = true
    masterFrame:SetScript("OnUpdate", OnUpdateWaveDriver)
end

-- ============================================================================
-- 4. Slash Commands & AddOn Lifecycle (Taint-Safe pcall Sandbox)
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
                ox, oy, waveTargetState and "|cff00ff00WINDOW|r" or "|cffffcc00CLOSED|r"))

        elseif cmd == "stereo" then
            local sub = args[2] or "toggle"
            if sub == "sbs" then
                FidelityEMatrix_Config.stereoMode = "sbs"
            elseif sub == "anaglyph" then
                FidelityEMatrix_Config.stereoMode = "anaglyph"
            elseif sub == "off" or sub == "mono" then
                FidelityEMatrix_Config.stereoMode = "off"
            else
                -- Cycle modes: off -> sbs -> anaglyph -> off
                local cur = FidelityEMatrix_Config.stereoMode or "off"
                if cur == "off" then FidelityEMatrix_Config.stereoMode = "sbs"
                elseif cur == "sbs" then FidelityEMatrix_Config.stereoMode = "anaglyph"
                else FidelityEMatrix_Config.stereoMode = "off" end
            end
            UpdateStereoDisplay()
            print(string.format("|cff00ffcc[Fidelity EMatrix]|r Stereo Mode: |cffffffff%s|r", FidelityEMatrix_Config.stereoMode:upper()))

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
            print(string.format("  Wave Active: %s (Target: %s)", waveActive and "|cff00ff00YES|r" or "NO", waveTargetState and "Window" or "Closed"))
            print(string.format("  Stereo Mode: %s", (FidelityEMatrix_Config.stereoMode or "off"):upper()))
            print(string.format("  UI Scale: %.2f", FidelityEMatrix_Config.scale or 1.0))
            print(string.format("  OnUpdate Hook: %s", (masterFrame and masterFrame:GetScript("OnUpdate")) and "|cff00ff00ATTACHED|r" or "|cff888888DETACHED (0.00 ms CPU)|r"))

        else
            print("|cff00ffcc[Fidelity EMatrix Commands]|r")
            print("  |cffffcc00/fide|r (or /fide toggle) - Show/Hide Matrix Frame (Shift-drag to move)")
            print("  |cffffcc00/fide ripple [x y]|r       - Trigger scoreboard wave from (x, y) (default: 8 5)")
            print("  |cffffcc00/fide stereo [off|sbs|anaglyph]|r - Switch stereoscopic 3D mode")
            print("  |cffffcc00/fide scale <0.5..2.5>|r   - Uniform UI scale")
            print("  |cffffcc00/fide status|r             - Display current runtime & idle CPU status")
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
            print("|cff00ffcc[Fidelity EMatrix]|r v1.0.0 initialized. Type |cffffcc00/fide|r for options, or click any cell to ripple.")
            self:UnregisterEvent("ADDON_LOADED")
        end
    elseif event == "PLAYER_ENTERING_WORLD" then
        if not masterFrame then
            CreateMatrixGrid()
            print("|cff00ffcc[Fidelity EMatrix]|r v1.0.0 initialized. Type |cffffcc00/fide|r for options, or click any cell to ripple.")
        end
        self:UnregisterEvent("PLAYER_ENTERING_WORLD")
    end
end)

-- Exports
ns.TriggerScoreboardWave = TriggerScoreboardWave
ns.CreateMatrixGrid = CreateMatrixGrid
ns.cells = cells
