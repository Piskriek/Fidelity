# The judge's camera computations, round 2026-11-04-rungs

The round's judge wrote these scripts to check the camera claims in `STEER.md` ("The camera rung") against the code. Each one replicates `EMatrix_Math.BuildCamera` and `ProjectPoint`, and the terrain scan's culling, in plain Python. They read the map data the addon ships, `FidelityEMatrix/Data/EMatrix_Data_Azeroth_tbc.lua`.

The pose is the ninth report's own probe: `reports/20261104-1321/FidelityEMatrix.lua:1386` on `origin/owner/reports`, which reads `pos -8766.5, -98.4`, ground 88.7, facing 4.09 and zoom 4.6. The screen is 1507 x 853 UI units, the saved pitch 0.35 rad and fovY 1.0 rad.

Each command prints one claim's numbers. The scripts need Python 3 and nothing else.

| Command | What it prints | Used for |
| :--- | :--- | :--- |
| `python3 -I r9pose.py` | Every placement within 70 yd at that pose, with its predicted screen point in UI units and in shot pixels | The probe's six printed points reproduced within about 2 UI units; barrel01.m2 and caveminewheelbarrow01.m2 right of centre |
| `python3 -I jac.py` | The cosine and the normalised condition of JᵀJ for yaw, pitch and fovY, first on the four camp props alone, then with the bush and the tree added; the pitch monotonicity of the props' feet | "The four camp props alone cannot (condition about 11,100)"; feet monotone over 0.13 to 1.4 rad; a prop's projected height not monotone |
| `python3 -I jac_all.py` | The same for every on-screen drawable placement, and for the near ones | "condition 1.3 with all twelve on-screen placements" |
| `python3 -I jac_clear.py` | The same for the placements clear of the chat box and the HUD box in the step-1 and step-2 shots | "about 4.4 from the placements clear of the chat and the HUD" |

These are the judge's checks of the model's conditioning, not measurements of the camera. The camera's first reading is the tenth report's twin.
