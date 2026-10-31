# Distortion Check: Review Checklist for the Corvid Shelf Plan

## When to use this checklist

Use this checklist whenever a document in the Corvid Shelf set is revised, and whenever a summary is written from the design plan. It catches distortion, meaning a figure that drifted from its source while being rewritten, summarized, or copied into a table. Most distortions so far have been small: a total not updated after a part changed, shares that stopped adding up, or a count copied from an older draft.

The checklist asks whether a document says what the plan says and whether its number relations still hold. It does not judge the design. Design questions go into the open items log.

## Fleet and zone checks

- [ ] The fleet is stated as 240 robots wherever the fleet count appears, including captions and speaker notes.
- [ ] The North Hall and South Hall counts still sum to the fleet total.
- [ ] The spare reserve reads as 12 robots, which must equal the reserve share applied to the fleet total.
- [ ] A change to the fleet count triggers a recomputation of the reserve in every file that quotes it.

## Power checks

- [ ] Cell count, cell voltage, and pack voltage agree with the series sum in the plan.
- [ ] Pack energy equals pack voltage times cell-string capacity, and the energy value matches the planner text.
- [ ] Battery thresholds are quoted as percentages of state of charge, never as voltages.

## Protocol checks

- [ ] Packet loss tolerance is quoted as 0.5% of backbone traffic.
- [ ] Heartbeat jitter stays under 40 ms in every summary.
- [ ] The scan-gap timer is quoted as 300 ms when it is discussed. The failure table names the timer without a value, so this checklist fixes the value.
- [ ] Frame sizes are checked as element count times element size, never copied from an older budget.

## Failure mode checks

- [ ] The plan names four failure modes, and the failure table has one row for each mode.
- [ ] Each failure mode has a detector and a response in every summary.
- [ ] The wheel-slip response is described as a soft cap, not a stop.

## Utilization checks

- [ ] The utilization table closes at a total of 100%, and each quoted share matches its row.
- [ ] The charging share sits below the limit in the plan. No summary may quote a limit the plan does not contain.
- [ ] Shares are not converted to fractions in one place and to percentages in another.

## Restatement checks

- [ ] Every restated figure matches its first appearance in the plan.
- [ ] Units are preserved, and byte counts are not written in bits.
- [ ] Rounding is not applied to a figure that takes part in a relation, because rounding breaks the sum.

## Common distortions seen so far

- A total updated in the table but not in the prose, or the other way round.
- A reserve figure copied from a draft written before the hall split was settled.
- A failure count left at its old value after a row was added to the table.
- A utilization table edited by hand that no longer closes.
- A timer or speed quoted from the pilot notes rather than from the current plan.

When a reviewer finds one of these, the fix goes into the plan first. The summary is then corrected to match, and the review log records both the original and the corrected value.

## Pass criteria

A document passes when every item is checked, no figure differs from the plan, and every relation closes. A single mismatch is a fail, even when it looks cosmetic. Do not add new figures during review. If a figure is missing from the plan, flag it as an open item rather than filling it in from memory or from a neighboring draft. A pass on one file does not carry over to the others in the set.
