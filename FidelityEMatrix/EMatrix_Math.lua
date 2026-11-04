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
    -- A mixed integer hash. The old (c * 73856093 + r * 19349663) % 4 reduced to (c - r) mod 4,
    -- because the two multipliers are 1 and 3 modulo 4, so the four orientations formed one
    -- diagonal lattice over the 15x9 grid: the first visible repeat (council B1, 04 Nov 2026).
    -- This form fits no (a*c + b*r + k) mod 4 over the grid, is balanced 33/33/33/36 and never
    -- gives a uniform 2x2 block. The literals are floats on purpose: the game's Lua 5.1 computes
    -- in doubles (exact below 2^53, and every intermediate here is), while the fengari harness
    -- (Lua 5.3) has 32-bit integers that would wrap a * 19349663 (council B3, 04 Nov 2026);
    -- float operands keep both in doubles, so the harness computes the numbers the game draws.
    local a = (c * 73856093.0) % 1000003
    local h = ((a * 19349663.0 + r * 83492791.0) % 1000003) % 4
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
    if waveSpeed <= 0.0 then return 0.0 end

    -- The front reaches this cell at ringDist / waveSpeed seconds; the flip then takes
    -- flipDuration SECONDS. (The old form divided cells by seconds, so a flip lasted
    -- flipDuration / waveSpeed = 16 ms, one frame: council B2, 04 Nov 2026.)
    local u = (waveAge - ringDist / waveSpeed) / flipDuration
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

-- ============================================================================
-- GUARDRAIL E: Third-person camera model and world -> screen projection
-- The game exposes the player's world position (UnitPosition, outdoors), facing
-- (GetPlayerFacing) and camera distance (GetCameraZoom) but NOT the camera pitch.
-- The player's own nameplate is one known screen point: with the zoom it fixes the pitch.
-- World axes follow UnitPosition: x north, y west, z up. The camera sits behind the player
-- at `zoom` yards, pitched `pitch` radians above the horizontal, looking at the head.
-- ============================================================================
local HEAD_HEIGHT = 2.0 -- yards above the feet, where the camera aims and the nameplate sits

--- Builds a camera from the player's state. fovY in radians; screen size in pixels.
function EMatrix_Math.BuildCamera(px, py, pz, facing, zoom, pitch, fovY, screenW, screenH)
    if not (finite(px) and finite(py) and finite(pz) and finite(facing)) then return nil end
    zoom = (finite(zoom) and zoom > 0.1) and zoom or 8.0
    pitch = finite(pitch) and clamp(pitch, -1.2, 1.4) or 0.35
    fovY = (finite(fovY) and fovY > 0.1 and fovY < 3.0) and fovY or 1.0
    screenW = (finite(screenW) and screenW > 0) and screenW or 1920
    screenH = (finite(screenH) and screenH > 0) and screenH or 1080
    local cf, sf, cp, sp = math.cos(facing), math.sin(facing), math.cos(pitch), math.sin(pitch)
    -- forward (camera -> target): the facing direction, tilted down by pitch
    local fx, fy, fz = cf * cp, sf * cp, -sp
    -- right: facing rotated 90 degrees clockwise seen from above (x north, y west => right is -y of facing)
    local rx, ry, rz = sf, -cf, 0
    -- up = right x forward
    local ux, uy, uz = ry * fz - rz * fy, rz * fx - rx * fz, rx * fy - ry * fx
    local tx, ty, tz = px, py, pz + HEAD_HEIGHT
    return {
        cx = tx - fx * zoom, cy = ty - fy * zoom, cz = tz - fz * zoom,
        fx = fx, fy = fy, fz = fz, rx = rx, ry = ry, rz = rz, ux = ux, uy = uy, uz = uz,
        focal = (screenH * 0.5) / math.tan(fovY * 0.5), w = screenW, h = screenH, zoom = zoom,
    }
end

--- Projects a world point. Returns screenX, screenY (pixels, origin bottom-left like WoW),
--- distance along the view axis (yards), or nil when the point is behind the camera.
function EMatrix_Math.ProjectPoint(cam, wx, wy, wz)
    if not cam or not (finite(wx) and finite(wy) and finite(wz)) then return nil end
    local dx, dy, dz = wx - cam.cx, wy - cam.cy, wz - cam.cz
    local depth = dx * cam.fx + dy * cam.fy + dz * cam.fz
    if depth <= 0.05 then return nil end
    local sx = cam.w * 0.5 + (dx * cam.rx + dy * cam.ry + dz * cam.rz) / depth * cam.focal
    local sy = cam.h * 0.5 + (dx * cam.ux + dy * cam.uy + dz * cam.uz) / depth * cam.focal
    return sx, sy, depth
end

--- Finds the pitch at which the player's head projects to `headScreenY` (bisection, monotonic).
--- Returns the pitch in radians, or nil when no pitch in range reaches that height.
function EMatrix_Math.SolvePitch(px, py, pz, facing, zoom, fovY, screenW, screenH, headScreenY)
    if not finite(headScreenY) then return nil end
    -- A point above the look-at point projects the same for +pitch and -pitch, so the solve is
    -- only unique on one side. Its screen height is cos(pitch) / (zoom - 0.6 sin(pitch)), which
    -- peaks at pitch = atan(0.6 / zoom) (about 3 degrees) and falls monotonically beyond it. In
    -- play the camera is above the ground looking down, steeper than that, so search [peak, steep].
    zoom = (finite(zoom) and zoom > 0.1) and zoom or 8.0
    local lo, hi = math.atan(0.6 / zoom), 1.4
    -- the head is the look-at point: it always projects to the exact screen centre. The nameplate
    -- hangs a fixed world height above it, so solve for the plate height instead.
    local function plateY(pitch)
        local cam = EMatrix_Math.BuildCamera(px, py, pz, facing, zoom, pitch, fovY, screenW, screenH)
        local _, sy = EMatrix_Math.ProjectPoint(cam, px, py, pz + HEAD_HEIGHT + 0.6)
        return sy
    end
    local yLo, yHi = plateY(lo), plateY(hi)
    if not yLo or not yHi then return nil end
    if (headScreenY - yLo) * (headScreenY - yHi) > 0 then return nil end
    for _ = 1, 40 do
        local mid = (lo + hi) * 0.5
        local y = plateY(mid)
        if not y then return nil end
        if (y - headScreenY) * (yLo - headScreenY) > 0 then lo, yLo = mid, y else hi, yHi = mid, y end
    end
    return (lo + hi) * 0.5
end

--- Parallax depth for an object `distance` yards down the view axis: 0.15 at the player,
--- growing without bound, 1.0 at four times the camera distance. Same scale as the overlay.
function EMatrix_Math.DepthFromDistance(distance, zoom)
    if not finite(distance) or distance < 0 then return 0.5 end
    zoom = (finite(zoom) and zoom > 0.1) and zoom or 8.0
    local ahead = math.max(0, distance - zoom)
    return 0.15 + 0.85 * ahead / (3.0 * zoom)
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

