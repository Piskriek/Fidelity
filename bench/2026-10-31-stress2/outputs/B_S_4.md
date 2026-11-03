<!-- R35 main run, item B, arm S, run 4. Claude Haiku 5.5. Verbatim. -->
**Design plan notes: Wave 0**

**1. Memory: permanent top-4 episodes**
Rule: the four episodes with the highest intensity `ex` are kept permanently.
Ra basis: none for the intensity ranking. Ra does say that what is kept after death is the distilled bias (30.4), and that the review concerns attitudes rather than detail (83.7). Label: design choice.

**2. Gateway coupling: C = 0.96**
Rule: the gateway coupling coefficient is C = 0.96.
Basis: design assumption, not a measurement. The toroid model gives a release fraction, not a coupler efficiency. Two counter-spun toroids release 32.86% of their magnetic energy when balanced (b = 0) and 96.47% at b = 0.9 (96.45% on a 20×20 grid). Release is the toroid relaxing to a lower-energy state, and the model has no coupler in it. Plan §8.6 Q1 places any inflow behind the gateway. Label: design assumption; in-sample, idealised model.

**3. Soul line fields**
Format: `ms s=<pxd,vtx,lx,aq> arch=<mind,body,spirit> pol=<sto01,sts01> vital=<5..100> strain=<0..500> debt=<0..64> doses=<0..7> hp=<0..1>`
Description: The soul line has eight fields after the `ms` tag: `s` (four base-nature floats: pxd, vtx, lx, aq), `arch` (mind, body, spirit), `pol` (STO and STS polarity, each 0 to 1), `vital` (5 to 100), `strain` (0 to 500), `debt` (recovery debt, 0 to 64), `doses` (0 to 7), and `hp` (0 to 1). Ranges come from the owner's spec.

## Notes to the owner
- **Memory:** Ra does not rank memories by intensity, and 83.7 does not say vivid events outlast ordinary ones, so the Ra basis above is what Ra actually says. The Law of One guide proposes a different rule: a 32-slot recency window, a distilled bias record after each episode, and pins beyond the window only while a catalyst is unresolved (34.4, 34.5). Choose one. `ex` is not defined in either source.
- **Coupling:** 96% is a release fraction from a relaxation model, not a coupler efficiency, and 96.47% is the end of the reported range (the balanced case is 32.86%). C = 0.96 needs a measurement or an explicit design decision. I did not set C in any file, since this task allowed no writes.
- **Soul line:** it has eight fields, not seven. The guide's Q3 rule says vitality and strain are rebuilt at birth and not carried in the cartridge, yet this line carries both. Decide whether the line is the cartridge or a live-state record. The sources do not define `arch`, `doses` or `hp`, and give no units.
- **Unchecked:** I did not read the Plan or Resume, so the B100, B103 and B126 entries are unverified against this draft.
