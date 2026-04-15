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

- `scripts/pilot_v3_published_greece_case.py`
  - Literature-grounded reproduction script
  - Uses published fragility parameters for a 48 m Greek steel lattice telecom tower
  - Computes collapse probability by tower condition and wind direction
  - Uses published values from Bilionis and Vamvatsikos instead of pilot calibration choices

- `scripts/pilot_v4_literature_class_library.py`
  - Literature-grounded telecom class library script
  - Uses the telecom structural classes explicitly listed in Khazaali and Bocchini's EMI 2022 portfolio summary
  - Writes a reusable class catalog, intensity-measure standard note, and example inventory template
  - Avoids inventing new telecom class labels

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
- `outputs/v3/`

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

## Literature Notes

The third script is intentionally different from the first two.
It is a direct literature-backed reproduction script rather than a pilot surrogate.

See:

- `docs/literature_values.md`
- `docs/class_library_sources.md`
