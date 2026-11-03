# Corvid Shelf Master Handoff

## Where things stand

The design plan for the Corvid Shelf robot fleet is complete for the current revision, and this handoff passes ownership of it to the next engineer. The fleet is 240 robots across North Hall and South Hall. The pilot has run in North Hall with interlocks in test mode and a technician beside each robot. Nothing in South Hall should be energized until the first exit gate has passed.

The plan is the authority for every figure here. If this note disagrees with it, the plan is right, and this note needs fixing.

## Key facts to carry forward

- Each robot carries a battery pack with a nominal energy of 93.6 Wh. The planner uses that figure to decide when a robot must leave the pool for a dock.
- The planner keeps charging below 25 percent of fleet time. Charging stops at 95% because the last few percent cost more in lost pick slots than they return in energy.
- Maximum travel speed in open aisles is 2.2 m/s. Cross-aisles are taken at a walking pace.
- The safety stack has five interlocks. A technician resets them at the console, and a robot never clears its own trip.
- The spare reserve stays in the charging bay and never takes picks unless a carrier fails. It is recomputed whenever the fleet size changes.
- The rollout runs in phases, with an exit gate between each. Gate thresholds live in the rollout notes so they can change without reissuing the plan.

## Decisions already made

Reservations are the main safety mechanism for shared aisles, so the lease and retry logic should not change casually. A grant that is not confirmed is released, and rejected reservations back off exponentially. A change to one of those rules usually needs a change to the others.

Message identifiers use a sequence counter that wraps. The protocol handles the wrap with a timeout rather than a wider counter, and that choice is deliberate. Do not widen the counter without checking the in-flight message window first.

## Open items

- The PID gains were tuned on the pilot floor with a loaded pod. Treat them as provisional until the South Hall floor surface is measured.
- Bridge aisle traffic in the pilot is too thin to decide whether the reservation lease should shrink in South Hall. That waits for the second gate.
- The dock rebalance trigger is described in words only. It needs a threshold in the rollout notes before it can be tested.
- The quarantine log is not yet wired to the nightly export, so repeat offenders are found by hand.

## How to resume

Read the plan from top to bottom, then the review checklist, then this note. When you change a figure, change it in the plan first, then update the checklist and this note in the same sitting. Log the change with its original and corrected values.

Do not promote South Hall until the second gate has passed. Read the pilot interlock results alongside the telemetry loss numbers, because a clean interlock record can hide a sensing problem that only shows up in the loss figures.

## Who to ask

The fleet manager owner signs off on reservation logic. The safety lead signs off on interlocks, the wheel-slip response, and the quarantine rule. The charging lead owns the pre-charge check and the dock thresholds.

## Risks to watch

The largest risk is a quiet mismatch between the plan and a downstream summary. A slightly wrong figure gets copied into a second summary before anyone notices, and then it looks authoritative. Check summaries against the plan every time they change.

The second risk is mixing the halls. North Hall and South Hall have different floor surfaces and picking volumes, so hall-specific values stay hall-specific until a measurement says otherwise. The third is the wheel-slip cap. A cap set too high hides a real traction problem, so escalate any cluster of slip events to the safety lead.

Thanks for picking this up. Most of what remains is measurement and tuning rather than redesign.
