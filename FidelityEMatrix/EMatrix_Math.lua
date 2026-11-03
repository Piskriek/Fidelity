-- FidelityEMatrix/EMatrix_Math.lua
-- Pure Math, Wave Distance Metrics & Deterministic Scoreboard Rotation Tables
-- Zero WoW globals inside pure functions. Compatible with WoW Lua, LuaJIT, and Node test harness.

local ADDON_NAME, ns = ...
local EMatrix_Math = {}

-- ============================================================================
-- GUARDRAIL A: Exact 8-Corner SetTexCoord Rotation Table
-- Format: (ULx, ULy, LLx, LLy, URx, URy, LRx, LRy)
-- ============================================================================
local ROT_UV8 = {
    [0] = { 0, 0,  0, 1,  1, 0,  1, 1 }, -- 0 deg (E facing right)
    [1] = { 0, 1,  1, 1,  0, 0,  1, 0 }, -- 90 deg CW (E facing down)
    [2] = { 1, 1,  1, 0,  0, 1,  0, 0 }, -- 180 deg (E facing left)
    [3] = { 1, 0,  0, 0,  1, 1,  0, 1 }, -- 270 deg CW (E facing up)
}

EMatrix_Math.ROT_UV8 = ROT_UV8

--- Deterministically computes the fixed rotation index (0..3) for a cell (col, row).
--- The E-cubes NEVER morph or rotate during flips; their orientation is fixed at birth.
--- @param col number 1-indexed column [1..15]
--- @param row number 1-indexed row [1..9]
--- @return number rotIdx (0, 1, 2, or 3)
--- @return table uv8 table of 8 UV coordinates
function EMatrix_Math.GetCellRotation(col, row)
    if not col or not row or col ~= col or row ~= row then
        return 0, ROT_UV8[0]
    end
    local c = math.floor(col)
    local r = math.floor(row)
    -- Hash constants from spatial hashing / hash primes
    local h = (c * 73856093 + r * 19349663) % 4
    if h < 0 then h = h + 4 end
    return h, ROT_UV8[h]
end

-- ============================================================================
-- GUARDRAIL B: Exact 1 -> 8 -> Circular Wave Distance Metric
-- Guarantees Ring 0 (1 center cell), Ring 1 (all 8 Chebyshev neighbors),
-- smoothly transitioning to Euclidean circular wavefronts by Ring 3.
-- ============================================================================
--- @param x number Cell X coordinate (col)
--- @param y number Cell Y coordinate (row)
--- @param ox number Wave origin X (col)
--- @param oy number Wave origin Y (row)
--- @return number ringDist Monotonic wave propagation distance
function EMatrix_Math.CalculateRingDistance(x, y, ox, oy)
    -- Guard inputs against nil, NaN, and non-finite values
    if not x or not y or not ox or not oy then return 0.0 end
    if x ~= x or y ~= y or ox ~= ox or oy ~= oy then return 0.0 end

    local dx = math.abs(x - ox)
    local dy = math.abs(y - oy)

    if dx ~= dx or dy ~= dy then return 0.0 end

    local cheb = (dx > dy) and dx or dy
    local euclid = math.sqrt(dx * dx + dy * dy)

    -- Blend weight:
    -- At Ring 0 (cheb == 0): w = 0.0 (dist = 0.0, exactly 1 cell)
    -- At Ring 1 (cheb == 1): w = 0.0 (dist = 1.0, exactly 8 cells)
    -- Ring 2 (cheb == 2): w = 0.5 (smooth transition)
    -- Ring 3+ (cheb >= 3): w = 1.0 (pure Euclidean circular ripple)
    local w = math.min(math.max((cheb - 1.0) / 2.0, 0.0), 1.0)
    local ringDist = (1.0 - w) * cheb + w * euclid

    return ringDist
end

-- ============================================================================
-- GUARDRAIL C: Scoreboard Vertical Flip Math (0-GC)
-- Vertical Height squash 32 -> 1 -> 32 anchored at cell CENTER with golden glint
-- ============================================================================
--- Calculates normalized progress u in [0, 1] for a cell given wave age and ring distance.
--- @param waveAge number Elapsed time in seconds since wave trigger
--- @param waveSpeed number Wave propagation speed (cells per second)
--- @param ringDist number Cell distance from wave origin
--- @param flipDuration number Flip duration per cell in seconds
--- @return number u Normalized flip progress clamped in [0, 1]
function EMatrix_Math.CalculateFlipProgress(waveAge, waveSpeed, ringDist, flipDuration)
    if not waveAge or not waveSpeed or not ringDist or not flipDuration then return 0.0 end
    if flipDuration <= 0.0 then return 1.0 end

    local u = (waveAge * waveSpeed - ringDist) / flipDuration
    if u < 0.0 then return 0.0 end
    if u > 1.0 then return 1.0 end
    return u
end

--- Computes visual transform parameters for a cell at flip progress u.
--- @param u number Normalized flip progress in [0, 1]
--- @return number scaleY Height scale in [0.04, 1.0] (never collapses to 0)
--- @return number specAlpha Golden-white specular flash bar alpha in [0, 1]
--- @return boolean isFlipped True if past midpoint (u >= 0.5), showing target texture
function EMatrix_Math.GetFlipVisuals(u)
    if not u or u ~= u or u <= 0.0 then
        return 1.0, 0.0, false
    end
    if u >= 1.0 then
        return 1.0, 0.0, true
    end

    -- Vertical height squash: cos curve from 1 down to ~0.04 at u=0.5, then back to 1
    local scaleY = math.max(math.abs(math.cos(u * math.pi)), 0.04)

    -- Specular flash bar alpha: sin^2 curve peaking sharply at u=0.5
    local s = math.sin(u * math.pi)
    local specAlpha = s * s

    local isFlipped = (u >= 0.5)

    return scaleY, specAlpha, isFlipped
end

EMatrix_Math.EvaluateFlipVisuals = EMatrix_Math.GetFlipVisuals

-- ============================================================================
-- Export to Namespace & Global Environment
-- ============================================================================
if ns then
    ns.Math = EMatrix_Math
end

if _G then
    _G.EMatrix_Math = EMatrix_Math
end

return EMatrix_Math

