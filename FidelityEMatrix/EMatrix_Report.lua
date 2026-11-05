-- FidelityEMatrix/EMatrix_Report.lua
-- The owner's report panel: buttons that run the diagnostic commands with their chat captured
-- into a SavedVariable, take a screenshot half a second later, run the terrain test variants,
-- and reload to write the file. The laptop (hands task H009) then copies the screenshots and
-- the saved report into the repo, so the director reads the exact lines, not a picture of them.
--
-- Nothing here measures anything: it records what the other modules print and when. At each scene
-- step's shutter it also records, silently, the pose and every drawable placement's prediction
-- (Terrain.Snapshot), and a twin step takes a second screenshot with the overlays' drawings hidden:
-- the director reads the real objects' feet and tops in the twin against that record (council round
-- 2026-11-04-rungs: the camera's first paired reading). The saved overlay choices are never written.
local ADDON_NAME, ns = ...

local Report = {}
ns.Report = Report

local PREFIX = "|cff00ffcc[Fidelity EMatrix]|r "
local SHOT_DELAY = 0.5  -- seconds between a step's commands and its screenshot, so the frame has drawn
local TWIN_HIDE = 0.25  -- after the first shot, before the drawings are hidden (a screenshot is taken at the end of a frame)
local TWIN_DELAY = 0.5  -- after hiding, before the twin's screenshot, and no sooner than the next clock second (below)
local TWIN_SHOW = 0.25  -- after the twin's screenshot, before the drawings come back
-- A screenshot's file is named to the second (WoWScrnShot_MMDDYY_HHMMSS), so two shots in one second
-- write one file: the tenth report's jar step lost its first shot that way (both at 05:29:07). The twin
-- therefore waits until time() has moved past the first shot's second.
local TURNED = 0.05     -- radians: step 11's facing must differ from step 10's by more than this

local panel = nil
local pending = nil -- { rec, twin, phase = "shot" | "hide" | "twin" | "show", t, f0, lo, hi }
local shots = 0

local function Stamp() return (date and date("%Y-%m-%d %H:%M:%S")) or "?" end
local function Clean(line) return (tostring(line):gsub("|c%x%x%x%x%x%x%x%x", ""):gsub("|r", "")) end

local function Store()
    FidelityEMatrix_Report = FidelityEMatrix_Report or {}
    local r = FidelityEMatrix_Report
    r.version = ns.VERSION or "?"
    r.steps = r.steps or {}
    r.at = r.at or Stamp()
    return r
end

--- Runs fn with every print captured (colour codes stripped); an error becomes a line too.
local function Capture(fn)
    local lines = {}
    local orig = _G.print
    _G.print = function(...)
        local parts = {}
        for i = 1, select("#", ...) do parts[#parts + 1] = tostring(select(i, ...)) end
        lines[#lines + 1] = Clean(table.concat(parts, " "))
        orig(...)
    end
    local ok, err = pcall(fn)
    _G.print = orig
    if not ok then lines[#lines + 1] = "ERROR: " .. tostring(err) end
    return lines
end

local function Slash(cmd)
    local f = SlashCmdList and SlashCmdList["FIDELITYEMATRIX"]
    if f then f(cmd) end
end

local function Facing() return GetPlayerFacing and tonumber(GetPlayerFacing()) or nil end

--- The facing's spread since the press: the wrapped difference from the first sample, as its lowest
--- and highest value (two running numbers). Near zero means the character did not turn; it cannot
--- see the camera orbit at rest.
local function TrackFacing(p)
    local f = Facing()
    if not f then return end
    if not p.f0 then p.f0, p.lo, p.hi = f, 0, 0; return end
    local d = (f - p.f0 + math.pi) % (2 * math.pi) - math.pi
    if d < p.lo then p.lo = d end
    if d > p.hi then p.hi = d end
end

local function Pose(p)
    TrackFacing(p)
    local snap = (ns.Terrain and ns.Terrain.Snapshot and ns.Terrain.Snapshot()) or { none = "no terrain module" }
    snap.facingAtPress = p.f0
    snap.facingSpread = p.f0 and (p.hi - p.lo) or nil
    snap.stamp = Stamp()
    return snap
end

--- Hides (or shows again) what the overlays draw, for a twin: the terrain's props or test frame,
--- and the world's copies. Neither saved choice is written.
local function HideDrawings(on)
    if ns.Terrain and ns.Terrain.HideForShot then ns.Terrain.HideForShot(on) end
    if ns.World and ns.World.HideFor then ns.World.HideFor("shot", on) end
end

--- A press, Save, Clear or hiding the panel while a shot or a twin is pending supersedes it: the
--- record says what was not taken and why, and drawings hidden for a twin are shown again at once.
local function Supersede(why)
    local p = pending
    if not p then return end
    pending = nil
    why = why or "the next step started"
    if p.phase == "shot" then
        p.rec.screenshot = "not taken: " .. why .. " within the half second"
        if p.twin then p.rec.twin = { screenshot = "not taken: " .. why } end
    elseif p.twin and not p.rec.twin then
        p.rec.twin = { screenshot = "not taken: " .. why }
    end
    if p.phase == "twin" or p.phase == "show" then HideDrawings(false) end
end

-- The steps, top to bottom. Each runs its commands, records their chat, and (shot) takes a
-- screenshot half a second later; a twin step takes a second one three quarters of a second later,
-- with the overlays' drawings hidden (for a test step: the model's frame and its red marks only).
-- The fit steps draw each measured file at the fit in use, the frontier of docs/rungs/ledger.json.
Report.STEPS = {
    { key = "scene",     label = "1 Scene + twin",              cmds = { "terrain test off", "terrain on", "world on", "box hide" }, shot = true, twin = true },
    { key = "checks",    label = "2 Checks + shot",             cmds = { "status", "cells", "bind status", "world status", "terrain status", "terrain probe", "eye probe", "diag" }, shot = true },
    { key = "bush",      label = "3 Bush at its fit + twin",    cmds = { "terrain test own", "terrain test aspect auto", "terrain test pick bush09", "terrain test" }, shot = true, twin = true },
    { key = "tree",      label = "4 Tree at its fit + twin",    cmds = { "terrain test aspect auto", "terrain test pick treemid", "terrain test" }, shot = true, twin = true },
    { key = "barrel",    label = "5 Barrel at its fit + twin",  cmds = { "terrain test aspect auto", "terrain test pick westfallbarrel", "terrain test" }, shot = true, twin = true },
    { key = "jar",       label = "6 Jar at its fit + twin",     cmds = { "terrain test aspect auto", "terrain test pick jar01", "terrain test" }, shot = true, twin = true },
    { key = "crate",     label = "7 Crate at its fit + twin",   cmds = { "terrain test aspect auto", "terrain test pick westfallcrate", "terrain test" }, shot = true, twin = true },
    { key = "cratewide", label = "8 Crate, wide frame + twin",  cmds = { "terrain test pick westfallcrate", "terrain test aspect 1.85" }, shot = true, twin = true },
    { key = "canopy",    label = "9 Canopy04 at its fit + twin", cmds = { "terrain test aspect auto", "terrain test pick canopy04", "terrain test" }, shot = true, twin = true },
    { key = "walk",      label = "10 Test off, scene + twin",   cmds = { "terrain test pick any", "terrain test off", "terrain on", "world on", "box hide" }, shot = true, twin = true },
    { key = "turn",      label = "11 Turn, scene + twin",       cmds = { "terrain test off", "terrain on", "world on", "box hide" }, shot = true, twin = true, turn = true },
    { key = "bound",     label = "12 Box, bind on + shot",      cmds = { "terrain off", "world on", "box show", "bind on", "cells" }, shot = true },
    { key = "save",      label = "Save (reload UI)",            save = true },
    { key = "clear",     label = "Clear report",                clear = true },
}

function Report.Run(step)
    local r = Store()
    if step.clear then
        Supersede("the report was cleared")
        r.steps = {}
        r.at = Stamp()
        print(PREFIX .. "Report cleared.")
        return
    end
    if step.save then
        Supersede("the report was saved")
        print(PREFIX .. string.format("Saving the report (%d step(s)) by reloading the UI.", #r.steps))
        if ReloadUI then ReloadUI() end
        return
    end
    Supersede()
    local rec = { step = step.key, label = step.label, at = Stamp(), lines = {} }
    local p = step.shot and { rec = rec, twin = step.twin and true or false, phase = "shot", t = SHOT_DELAY } or nil
    if p then TrackFacing(p) end -- the facing at the press
    if step.turn and p and p.f0 then
        -- the turn step needs a pose of its own: the tenth report's step 11 repeated step 10's facing exactly
        local before = nil
        for i = #r.steps, 1, -1 do
            local q = r.steps[i]
            if q.step == "walk" and q.pose and q.pose.facingAtPress then before = q.pose.facingAtPress; break end
        end
        if before then
            local d = math.abs((p.f0 - before + math.pi) % (2 * math.pi) - math.pi)
            rec.turnedBy = d
            if d <= TURNED then
                rec.notTurned = string.format("facing %.3f rad at the press, %.3f at step 10: not turned (needs more than %.2f)", p.f0, before, TURNED)
                print(PREFIX .. "Step 11 needs a turned pose: you face the way you faced at step 10. Turn about 45 degrees, stand still, and press 11 again (this shot repeats step 10's pose).")
            end
        end
    end
    rec.lines = Capture(function() for _, c in ipairs(step.cmds or {}) do Slash(c) end end)
    rec.screenshot = step.shot and "pending" or "none"
    r.steps[#r.steps + 1] = rec
    pending = p
    print(PREFIX .. string.format("Report step %s: %d line(s) captured%s. %d step(s) in the report; press Save (reload UI) to write it.",
        step.label, #rec.lines, step.twin and ", two screenshots within about two seconds, the second with the overlays hidden: stand still" or (step.shot and ", screenshot in half a second" or ""), #r.steps))
end

local function Shoot()
    local ok = false
    if Screenshot then ok = pcall(Screenshot) end
    shots = shots + 1
    return ok
end

local function OnUpdate(self, dt)
    local p = pending
    if not p then return end
    TrackFacing(p)
    p.t = p.t - dt
    if p.t > 0 then return end
    if p.phase == "shot" then
        local ok = Shoot()
        p.second = time and time() or nil -- the first shot's file name second
        p.rec.screenshot = ok and ("taken at " .. Stamp()) or "Screenshot() failed"
        p.rec.pose = Pose(p) -- silently: no line is printed
        if p.twin and ok then p.phase, p.t = "hide", TWIN_HIDE
        else
            if p.twin then p.rec.twin = { screenshot = "not taken: the first screenshot failed" } end
            pending = nil
        end
    elseif p.phase == "hide" then
        HideDrawings(true)
        p.phase, p.t = "twin", TWIN_DELAY
    elseif p.phase == "twin" then
        if p.second and time and time() <= p.second then return end -- the same second would overwrite the first file
        local ok = Shoot()
        p.rec.twin = { screenshot = ok and ("taken at " .. Stamp()) or "Screenshot() failed", pose = Pose(p) }
        p.phase, p.t = "show", TWIN_SHOW
    else
        HideDrawings(false)
        pending = nil
    end
end

local function Build()
    if panel then return panel end
    panel = CreateFrame("Frame", "FidelityEMatrixReportPanel", UIParent)
    panel:SetSize(230, 44 + #Report.STEPS * 26)
    panel:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 20, -140)
    panel:SetFrameStrata("DIALOG")
    panel:EnableMouse(true)
    panel:SetMovable(true)
    panel:RegisterForDrag("LeftButton")
    panel:SetScript("OnDragStart", function(self) self:StartMoving() end)
    panel:SetScript("OnDragStop", function(self) self:StopMovingOrSizing() end)
    local bg = panel:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints(panel)
    bg:SetColorTexture(0, 0, 0, 0.8)
    local title = panel:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    title:SetPoint("TOP", panel, "TOP", 0, -8)
    title:SetText("Fidelity EMatrix report v" .. tostring(ns.VERSION or "?"))
    for i, step in ipairs(Report.STEPS) do
        local name = "FidelityEMatrixReportButton" .. i
        local ok, b = pcall(CreateFrame, "Button", name, panel, "UIPanelButtonTemplate")
        if not (ok and b) then
            -- no template on this client: a plain button with its own face and label
            b = CreateFrame("Button", name, panel)
            local face = b:CreateTexture(nil, "BACKGROUND")
            face:SetAllPoints(b)
            face:SetColorTexture(0.15, 0.15, 0.2, 1)
            local label = b:CreateFontString(nil, "OVERLAY", "GameFontNormal")
            label:SetPoint("CENTER", b, "CENTER", 0, 0)
            b.__ematrixLabel = label
        end
        b:SetSize(210, 22)
        b:SetPoint("TOP", panel, "TOP", 0, -30 - (i - 1) * 26)
        if b.__ematrixLabel then b.__ematrixLabel:SetText(step.label) elseif b.SetText then b:SetText(step.label) end
        b:SetScript("OnClick", function() Report.Run(step) end)
    end
    panel:SetScript("OnUpdate", OnUpdate)
    panel:Hide()
    return panel
end

function Report.Command(args, say)
    local sub = args[2] or "toggle"
    local p = Build()
    if sub == "clear" then Report.Run({ clear = true }); return end
    if sub == "status" then
        local r = Store()
        say("Report: %d step(s) since %s, %d screenshot(s) this session. /fide report shows the panel; Save (reload UI) writes the file.", #r.steps, tostring(r.at), shots)
        return
    end
    if sub ~= "show" and sub ~= "hide" and sub ~= "toggle" then say("Usage: /fide report <show|hide|toggle|clear|status>"); return end
    local show = (sub == "show") or (sub == "toggle" and not p:IsShown())
    -- the panel's OnUpdate drives the shots: hiding it mid-twin would leave the drawings hidden
    if not show then Supersede("the panel was hidden") end
    if show then p:Show() else p:Hide() end
    if show then
        say("Report panel shown: press the buttons top to bottom (each runs its commands and takes a screenshot half a second later; a twin step takes a second one with the overlays hidden, so stand still for about two seconds; before 11, turn about 45 degrees and stand still; the terrain test hides the box while it is on), then Save (reload UI). The laptop copies the screenshots and the saved report to the repo (task H009).")
    else
        say("Report panel hidden.")
    end
end

-- Test access
Report._panel = function() return panel end
Report._shots = function() return shots end
Report._pending = function() return pending end
