-- FidelityEMatrix/EMatrix_Report.lua
-- The owner's report panel: buttons that run the diagnostic commands with their chat captured
-- into a SavedVariable, take a screenshot half a second later, run the terrain test variants,
-- and reload to write the file. The laptop (hands task H009) then copies the screenshots and
-- the saved report into the repo, so the director reads the exact lines, not a picture of them.
--
-- Nothing here measures anything: it records what the other modules print and when.
local ADDON_NAME, ns = ...

local Report = {}
ns.Report = Report

local PREFIX = "|cff00ffcc[Fidelity EMatrix]|r "
local SHOT_DELAY = 0.5 -- seconds between a step's commands and its screenshot, so the frame has drawn

local panel = nil
local pendingShot, pendingRec = nil, nil
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

-- The steps, top to bottom. Each runs its commands, records their chat, and (shot) takes a
-- screenshot half a second later. The terrain test hides the box while it is on.
Report.STEPS = {
    { key = "scene",   label = "1 Overlays on + shot",         cmds = { "terrain on", "world on", "box hide" }, shot = true },
    { key = "checks",  label = "2 Checks + shot",              cmds = { "status", "cells", "bind status", "world status", "terrain status", "terrain probe", "eye probe", "diag" }, shot = true },
    { key = "jar",     label = "3 Jar by its fit + shot",      cmds = { "terrain test own", "terrain test pick jar", "terrain test" }, shot = true },
    { key = "crate",   label = "4 Crate by its fit + shot",    cmds = { "terrain test pick crate", "terrain test" }, shot = true },
    { key = "canopy",  label = "5 Canopy, wide frame + shot",  cmds = { "terrain test pick canopy", "terrain test" }, shot = true },
    { key = "tree",    label = "6 Tree, wide frame + shot",    cmds = { "terrain test pick treemid", "terrain test" }, shot = true },
    { key = "walk",    label = "7 Test off, scene + shot",     cmds = { "terrain test pick any", "terrain test off", "terrain on", "world on", "box hide" }, shot = true },
    { key = "turn",    label = "8 Face a tree, scene + shot",  cmds = { "terrain on", "world on", "box hide" }, shot = true },
    { key = "camp",    label = "9 Face the camp, scene + shot", cmds = { "terrain on", "world on", "box hide" }, shot = true },
    { key = "bound",   label = "10 Box, bind on + shot",       cmds = { "terrain off", "world on", "box show", "bind on", "cells" }, shot = true },
    { key = "save",    label = "Save (reload UI)",             save = true },
    { key = "clear",   label = "Clear report",                 clear = true },
}

function Report.Run(step)
    local r = Store()
    if step.clear then
        r.steps = {}
        r.at = Stamp()
        print(PREFIX .. "Report cleared.")
        return
    end
    if step.save then
        print(PREFIX .. string.format("Saving the report (%d step(s)) by reloading the UI.", #r.steps))
        if ReloadUI then ReloadUI() end
        return
    end
    local rec = { step = step.key, label = step.label, at = Stamp(), lines = {} }
    rec.lines = Capture(function() for _, c in ipairs(step.cmds or {}) do Slash(c) end end)
    rec.screenshot = step.shot and "pending" or "none"
    r.steps[#r.steps + 1] = rec
    if pendingRec then pendingRec.screenshot = "not taken: the next step started within the half second"; pendingRec, pendingShot = nil, nil end
    if step.shot then pendingShot, pendingRec = SHOT_DELAY, rec end
    print(PREFIX .. string.format("Report step %s: %d line(s) captured%s. %d step(s) in the report; press Save (reload UI) to write it.",
        step.label, #rec.lines, step.shot and ", screenshot in half a second" or "", #r.steps))
end

local function OnUpdate(self, dt)
    if not pendingShot then return end
    pendingShot = pendingShot - dt
    if pendingShot > 0 then return end
    pendingShot = nil
    local ok = false
    if Screenshot then ok = pcall(Screenshot) end
    shots = shots + 1
    if pendingRec then pendingRec.screenshot = ok and ("taken at " .. Stamp()) or "Screenshot() failed" end
    pendingRec = nil
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
    if show then p:Show() else p:Hide() end
    if show then
        say("Report panel shown: press the buttons top to bottom (each runs its commands and takes a screenshot half a second later; the terrain test hides the box while it is on), then Save (reload UI). The laptop copies the screenshots and the saved report to the repo (task H009).")
    else
        say("Report panel hidden.")
    end
end

-- Test access
Report._panel = function() return panel end
Report._shots = function() return shots end
