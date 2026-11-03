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

    -- Dark crevice alpha: peaks mid-flip (0.65), zero at u=0 and u=1
    local creviceAlpha = s * 0.65

    local isFlipped = (u >= 0.5)

    return scaleY, specAlpha, isFlipped, creviceAlpha
end

EMatrix_Math.EvaluateFlipVisuals = EMatrix_Math.GetFlipVisuals

-- ============================================================================
-- GUARDRAIL D: Off-Axis Multi-Plane Parallax (window into a box)
-- The eye sits 1 depth unit in front of the screen. A point at depth z
-- (z > 0 behind the screen, z < 0 in front of it) seen from an eye displaced
-- by e moves on the screen by e * z / (1 + z):
--   z = 0     the screen plane (bezel, grid) never moves
--   z > 0     moves WITH the eye, less than the eye (background, subject)
--   z < 0     moves AGAINST the eye, more as it nears the viewer (pop-out)
-- ============================================================================
local function finite(x) return type(x) == "number" and x == x and x ~= math.huge and x ~= -math.huge end
local function clamp(x, lo, hi) if x < lo then return lo elseif x > hi then return hi end return x end

--- Screen-space shift factor for a plane at depth z seen from eye offset e (both unitless).
--- @return number shift (multiply by a pixel gain)
function EMatrix_Math.ParallaxShift(eye, z)
    if not finite(eye) or not finite(z) then return 0.0 end
    z = clamp(z, -0.9, 4.0) -- never at or behind the eye
    return eye * z / (1.0 + z)
end

--- Eye offset in [-strength, strength] from the cursor's position relative to the frame centre.
function EMatrix_Math.EyeFromCursor(mx, my, cx, cy, halfW, halfH, strength)
    if not (finite(mx) and finite(my) and finite(cx) and finite(cy)) then return 0.0, 0.0 end
    if not finite(halfW) or halfW <= 0 then halfW = 1 end
    if not finite(halfH) or halfH <= 0 then halfH = 1 end
    if not finite(strength) or strength < 0 then strength = 0 end
    return clamp((mx - cx) / halfW, -1.0, 1.0) * strength, clamp((my - cy) / halfH, -1.0, 1.0) * strength
end

--- Visible widths of the four inner walls of the box. Seen from the right you see more of the
--- LEFT wall; seen from above you see more of the floor (BOTTOM wall).
--- @return number left, right, top, bottom (pixels, clamped to [minW, maxW])
function EMatrix_Math.WallWidths(eyeX, eyeY, base, gain, minW, maxW)
    if not finite(eyeX) then eyeX = 0 end
    if not finite(eyeY) then eyeY = 0 end
    base = finite(base) and base or 0
    gain = finite(gain) and gain or 0
    minW = finite(minW) and minW or 0
    maxW = finite(maxW) and maxW or base
    local l = clamp(base * (1.0 + gain * eyeX), minW, maxW)
    local r = clamp(base * (1.0 - gain * eyeX), minW, maxW)
    local b = clamp(base * (1.0 + gain * eyeY), minW, maxW)
    local t = clamp(base * (1.0 - gain * eyeY), minW, maxW)
    return l, r, t, b
end

--- Texture coordinates of a sliding window of size `zoom` (0..1) over the backplate, centred on
--- (0.5 + shiftU, 0.5 + shiftV) and kept inside [0, 1] so the texture never smears or clips.
--- @return number left, right, top, bottom
function EMatrix_Math.BackplateTexCoords(shiftU, shiftV, zoom)
    if not finite(zoom) or zoom <= 0 or zoom > 1 then zoom = 0.86 end
    local half = zoom * 0.5
    local cu = clamp(0.5 + (finite(shiftU) and shiftU or 0), half, 1 - half)
    local cv = clamp(0.5 + (finite(shiftV) and shiftV or 0), half, 1 - half)
    return cu - half, cu + half, cv - half, cv + half
end

--- Facings for a stereo pair: each eye sees the subject turned by +/- delta (toe-in about the
--- subject). The LEFT eye sits left of centre, which is the subject turned counter-clockwise.
--- @return number leftFacing, rightFacing
function EMatrix_Math.StereoFacings(facing, delta)
    if not finite(facing) then facing = 0 end
    if not finite(delta) then delta = 0 end
    return facing + delta, facing - delta
end

--- Depth of a ground unit from where its nameplate sits on screen, for a camera behind and above
--- the player: at the player's own height z = 0.15, rising to 2.0 at the horizon line.
--- @return number z in [0.15, 2.0]
function EMatrix_Math.DepthFromScreenY(plateY, playerY, horizonY)
    if not (finite(plateY) and finite(playerY) and finite(horizonY)) then return 0.5 end
    local span = horizonY - playerY
    if span <= 1 then return 0.5 end
    local t = clamp((plateY - playerY) / span, 0.0, 1.0)
    return 0.15 + 1.85 * t * t
end

--- Moves `current` toward `target` at `rate` per second without overshoot.
function EMatrix_Math.Approach(current, target, rate, dt)
    if not finite(current) then current = 0 end
    if not finite(target) then return current end
    if not finite(rate) or not finite(dt) or rate <= 0 or dt <= 0 then return current end
    local step = rate * dt
    if current < target then return math.min(current + step, target) end
    return math.max(current - step, target)
end

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

