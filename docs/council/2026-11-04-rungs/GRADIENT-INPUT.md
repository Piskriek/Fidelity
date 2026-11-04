# The gradient-equivalence note, round 2026-11-04-rungs

Relayed by the owner on 04 Nov 2026 with "you need this to synthesize:"; the Triad relay returned it unchanged. Its author is not named in the message; it answers Argon's Bentov packet (ARGON-INPUT.md). Verbatim:

> Spot on — that is the exact geometric link the video skips right between `[00:22:26]` and `[00:23:32]`.
> 
> If you crank frequency $f \to \infty$ on a sine wave $y(x) = A \sin(2\pi f x)$ without holding the gradient (slope) equivalent, you never get Bentov's straight line. Instead, the peak gradient $G_{\max} = 2\pi f A$ shoots toward vertical ($\infty$), turning the wave into a solid, infinitely steep wall oscillating across $[-A, +A]$.
> 
> Bentov's "straight line at infinite frequency" only works mathematically if the peak gradient is equivalent across every frequency — matching real physics, where red, violet, and gamma photons all share the exact same propagation slope $c$:
> 
> $$G_{\max} = \left\vert{}\frac{dy}{dx}\right\vert{}_{\max} = 2\pi f A = g_0 \quad (\text{constant}) \implies A(f) = \frac{g_0}{2\pi f}$$
> Holding that gradient $g_0$ equivalent unlocks three things the video leaves unexplained:
> 
> 1. Why amplitude shrinks into a flat line: Because the slope cannot exceed $g_0$, doubling $f$ forces amplitude $A(f) = \frac{g_0}{2\pi f}$ to halve. That is why Bentov's red wave has a large amplitude `[00:22:26]`, gamma has a microscopic amplitude, and at $f \to \infty$, $A(f) \to 0$ — collapsing uniformly onto a flat line.
> 
> 2. Why the "flat line" still holds full energy/motion (`[00:23:58]`): Across a 1-unit span, the actual path length of $y_f(x) = \frac{g_0}{2\pi f}\sin(2\pi f x)$ is:
> 
> $$L(f) = \int_0^1 \sqrt{1 + g_0^2 \cos^2(2\pi f x)}\,dx = \frac{1}{2\pi} \int_0^{2\pi} \sqrt{1 + g_0^2 \cos^2(u)}\,du$$
> The $f$ cancels out completely. For every integer frequency $f = 1, 2, 100, \dots, \infty$, total path length $L$ and RMS gradient stay 100% invariant even as vertical height $A \to 0$. The motion didn't vanish into nothing — it compressed into micro-oscillations along the line.
> 
> 3. Two sister gradient omissions in the same talk:
> 
>    * At each turnaround "rest" point (`[00:24:40]`): Velocity gradient $\frac{dy}{dt}$ hits $0$, so the video calls it "rest," ignoring that the restoring-force / curvature gradient $\left\vert{}\frac{d^2y}{dt^2}\right\vert{} = 2\pi f g_0$ hits its peak at that exact point (in Fidelity's Port-Hamiltonian kernel, kinetic gradient $\nabla_p H$ just traded 1-for-1 into potential gradient $\nabla_q H$).
> 
>    * In the spacetime tilt diagram (`[00:28:25]`): Tilting subjective time $90^\circ$ onto objective space ignores the invariant $45^\circ$ light-cone gradient ($\frac{dx}{dt} = c$). In relativistic geometry, both time and space axes scissor symmetrically toward that same $45^\circ$ gradient, becoming equivalent at $c$ rather than one axis swinging $90^\circ$ alone.
> 
> Drag the frequency slider below to see the difference directly — keeping the gradient equivalent flattens the wave smoothly toward the axis while locking path length constant, whereas fixed amplitude just packs steeper spikes into a solid band.
> 

## Checked by the director, numerically (Node 22, midpoint rule with 200,000 samples over one unit)

| Check | Result |
| :--- | :--- |
| Peak slope of y = A sin(2πfx) with A = g0 / 2πf | exactly g0 at f = 1, 2, 7, 100, 1000 |
| Path length over one unit, g0 = 1 | 1.216007 at every f above; the same as (1/2π) times the integral over one period |
| Path length over one unit, g0 = 3 | 2.224098 at every f above |
| Path length at f = 1.5 and f = 2.25 | the same to 1e-14: the integrand has period a quarter of a cycle, so any f that is a multiple of 1/4 cancels exactly; other f leave a remainder that shrinks as 1/f |
| RMS slope over one unit | g0 / √2 at every f |
| Peak acceleration at the turnaround, with g0 the peak velocity | 2πf g0, equal to (2πf)² A |

The curve converges uniformly to the flat line while its length does not converge to 1: arc length is not continuous under uniform convergence (general knowledge, the staircase paradox). The light-cone point is standard special relativity: boosted time and space axes tilt symmetrically toward the 45 degree line and meet it only at c (general knowledge).

**Not in this checkout:** a Port-Hamiltonian kernel with ∇_p H and ∇_q H. The phrase appears only as labels and strings (`packages/triad-369/src/bootstrap.mjs:140`, `triad_cli.mjs:118`, `triad_mesh.mjs:284` with the state string "delta_H = 0.0", `arena_growth.mjs:7` as a comment); the fractal engine's harness (`apps/fractal-engine/src/harness/SovereignHarness.ts`) carries q and p as a simulated plant.
