# Corvid Shelf Robot Fleet: Design Plan

## Purpose and scope

The Corvid Shelf fleet moves storage pods between racks and picking stations on the Brackwater distribution campus. Each shelf-carrier robot lifts a pod from its rack, drives it to a picking station, and returns it once the picker has finished. The fleet is made up of 240 robots. This plan sets out the hardware envelope, the power and charging model, the navigation and safety stack, the messaging protocol, the utilization targets, and the rollout sequence. Treat the figures here as the design baseline. The review checklist and the handoff summary both restate some of them, and when documents disagree the plan wins.

The fleet is split between North Hall and South Hall. North Hall carries 96 robots and South Hall carries 144. Each hall runs its own fleet manager process, and robots move between halls only through bridge aisles that are reserved in software. The split follows picking volume, which is heavier in South Hall because of the bulk electronics lines.

The design goal is simple to state and hard to meet: keep the picking stations fed without letting robots block each other in the aisles. Most of the complexity in this plan comes from the reservation scheme, which decides who may enter a segment of aisle at a given moment. The rest of the stack is conventional robotics, and wherever an existing component could be reused, it was.

## Power and charging

Each robot carries a battery pack built from four cells in series. Every cell is rated at 3.6 V nominal, so the pack voltage is the series sum of the cell voltages. Pack energy is the product of that voltage and the rated capacity of the cell string:

$$E = V \cdot Q = 14.4\,\text{V} \times 6.5\,\text{Ah} = 93.6\,\text{Wh}$$

Here $V$ is the nominal pack voltage and $Q$ is the cell-string capacity. The planner uses the energy figure to estimate how far a robot can travel before it must charge, so it is also the basis for dock scheduling.

The planner keeps charging below 25 percent of fleet time. When a robot's state of charge falls below 18%, it leaves the pool and heads for the nearest free dock. Charging stops at 95% because the last few percent take disproportionately long in the constant-voltage stage, and that tail time costs more in lost pick slots than it returns in energy. Docks are shared between neighboring aisles, and a dock can be claimed by only one robot at a time.

Each shift also runs a pre-charge check. A robot whose pack voltage sits below the expected discharge curve is sent to maintenance instead of the dock, because a sagging pack usually means a failing cell. The result is written to the robot's health record so that trends can be read across weeks rather than hours.

## Navigation and safety

Robots plan on a grid map and rely on lidar for obstacles that the map does not show. The lidar scans at 20 Hz, and the localization filter updates at 50 Hz. Maximum travel speed in open aisles is 2.2 m/s. Cross-aisles are taken at a walking pace.

When an obstacle enters the stop distance of 0.6 m, the robot brakes along a ramp. Acceleration is ramped at 0.8 m/s² so that loaded pods do not shift on the forks. The collision margin of 0.35 m is added to every planned path clearance, which means the planner never routes a robot closer than that to a fixed obstacle. Moving people are handled separately by the human zone scanner described below.

The safety stack has five interlocks, and a trip on any one of them removes the robot from the pool:

- an emergency stop loop wired to every robot body
- a pod clamp sensor that confirms the load is seated
- a floor-edge detector for dock approaches
- a human zone scanner in the picking lanes
- a watchdog timer on the motion controller

Interlocks are reset by a technician at the console, never by the robot itself. This keeps a single software fault from quietly returning a robot to traffic.

## Control and planning

Wheel speed control uses a PID loop with gains Kp = 0.85, Ki = 0.12, and Kd = 0.04. These values were tuned on the pilot floor with a loaded pod. They are expected to change once the South Hall floor surface has been measured, and the retuning procedure will be recorded in the rollout notes.

Route selection scores each candidate path with a weighted cost, $C = \alpha d + \beta t$, where $d$ is path length and $t$ is expected dwell time at the next station. The current weights are $\alpha = 0.6$ and $\beta = 0.25$, so path length dominates unless a station queue is already long.

Aisle segments are reserved before a robot enters them. A reservation is held under a lease, and the lease lasts 10 seconds unless the robot renews it. A grant that the robot does not confirm within 1,500 ms is released, which frees the segment for the next robot in line. The scheduler that enforces these rules ticks every 100 ms. A rejected reservation is retried with exponential backoff, growing by a factor of 1.5 per attempt, so that a jammed segment does not flood the backbone with requests.

## Communication protocol

Robots and fleet managers exchange framed messages over the hall backbone. Telemetry is batched into frames of 64 samples, and each sample is a single 4-byte float. A telemetry frame is therefore 256 bytes of payload before the header, and that is the figure the backbone budget is sized against.

Message identifiers come from a sequence counter that wraps at 2^16, which is 65,536 distinct IDs. A wrap is harmless as long as no message older than one full cycle is still in flight, and the protocol enforces that with a timeout rather than with a longer counter.

The heartbeat is sent every 250 ms. A robot that misses 6 heartbeats in a row is declared lost, and its reservations are released so that other robots can move through its segments. A lost robot that reappears is not trusted until it has passed a self-test and a fresh localization fix.

## Storage and map

Each hall keeps one map on its fleet manager, and every robot holds a local copy for planning between refreshes. The map records occupancy and reservation state. It is rebuilt from the rack inventory at the start of each shift. Robots never write to the shared map directly. They send observations to the manager, which applies them in the order received.

## Rollout

The rollout runs in three phases. The first phase is a supervised pilot in North Hall, with interlocks in test mode and a technician beside every robot. The second phase opens North Hall to full autonomy. The third phase brings South Hall online and opens the bridge aisles.

Each phase has an exit gate. The gate looks at pick success, unacknowledged interlock trips, and telemetry loss, and a phase does not begin until the previous gate has passed. Gate thresholds live in the rollout notes rather than in this plan, so that they can move without a full revision of the design.

## Shift coverage

Operations run three shifts of 8 hours each, so the fleet has 24 hours of coverage per day. Handover between shifts happens while the robots keep executing their current tasks, and the incoming console operator reviews open alarms before taking control. Nothing in the handover should stop a pod that is already in motion.

## Utilization targets

The planner aims for the time split below. Fleet time is the total robot-hours in a shift, divided by state.

| State | Target share |
|---|---|
| Transit | 55% |
| Charging | 20% |
| Idle buffer | 15% |
| Maintenance | 10% |
| Total | 100% |

The charging share must stay under 25 percent, and the table must always close at its full total. Idle time is the buffer that absorbs surges in demand. When idle drops below its target, the planner begins drawing on the spare reserve. When transit runs high for a sustained period, the planner requests a dock rebalance.

## Spare reserve

The spare reserve is 5% of the fleet, which is 12 robots. These robots stay in the charging bay and are never assigned to picks unless a carrier fails. The reserve is recomputed whenever the fleet size changes, so adding robots to a hall adds to the reserve in the same proportion. Spare robots rotate through the charging bay so that no single unit ages faster than the rest.

## Failure modes

The design addresses four failure modes. Each one has a detector, a response, and a log code that appears in the nightly export.

| Failure mode | Detector | Response |
|---|---|---|
| Battery sag under load | Voltage drop against the discharge curve | Route to nearest free dock |
| Lidar dropout | Scan gap timer | Stop and request assistance |
| Localization loss | Residual monitor | Fall back to wheel odometry |
| Wheel slip | Odometry mismatch | Cap speed at 0.5 m/s |

A wheel-slip cap is a soft response. The robot keeps its reservation and finishes the segment at the lower speed, which avoids a stop inside a shared aisle.

## Metrics

The pick success target is 99.7%. That figure is the headline measure for every rollout gate, and it is measured at the station rather than at the robot, so a robot that completes its move but waits in a queue still counts against it.

## Risks and open questions

A robot that reports 3 consecutive faults is quarantined for 45 minutes before it can rejoin the pool. The quarantine is logged so that repeat offenders can be pulled for inspection during the nightly maintenance window.

Every robot is serviced every 500 operating hours. The service interval is also the only time the battery pack is opened, which keeps the cell count and wiring under controlled conditions.

The carrier is rated for 120 kg including the pod. Heavier loads are refused at the rack by a weight check that runs alongside the pod clamp sensor. Whether the reservation lease should shrink in South Hall depends on the bridge traffic seen during the pilot, and that question stays open until the second gate has closed.
