# Telecom Tower Fragility Pilot

This repository contains two readable pilot scripts for wind fragility analysis of self-supporting steel lattice telecommunication towers.

## Scripts

- `scripts/pilot_v1_single_tower.py`
  - First MVP
  - Single 48 m telecom tower
  - Wind-only hazard
  - Collapse-only damage state
  - Stripe analysis and lognormal fragility fitting

- `scripts/pilot_v2_class_based.py`
  - Next pilot step
  - Small synthetic telecom tower class
  - Direction-dependent wind effects at 0, 22.5, and 45 degrees
  - Collapse fragility fitted separately by direction

## Libraries

The scripts use:

- `numpy`
- `pandas`
- `scipy`
- `matplotlib`
- `pathlib`
- `json`

## Quick Start

Create an environment with the required scientific Python libraries, then run:

```bash
python scripts/pilot_v1_single_tower.py
python scripts/pilot_v2_class_based.py
```

## Outputs

Each script writes results into the repository `outputs/` folder:

- `outputs/v1/`
- `outputs/v2/`

These include:

- assumptions JSON
- stripe results CSV
- fragility summary JSON
- fragility plot PNG

## Scope

This repo is intentionally a pilot prototype before:

- OpenSeesPy structural modeling
- panel-level surrogate calibration
- portfolio expansion using real tower inventory data
- full Wang-style class-based fragility framework development
