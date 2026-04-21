# Telecom Tower Fragility Pilot

This repository contains readable Jupyter notebooks and optional Python scripts for wind fragility analysis of telecommunication towers.

The repo is designed so a new user can download it, install the listed Python packages, open the notebooks in VS Code or Jupyter, and run the cells without editing machine-specific paths.

## Notebook-First Workflow

The recommended workflow is to use the notebooks in order:

- `notebooks/01_pilot_v1_single_tower.ipynb`
  - First MVP
  - Single 48 m telecom tower
  - Wind-only collapse fragility
  - Shows observed stripe points and fitted lognormal curve inside the notebook

- `notebooks/02_pilot_v2_class_based.ipynb`
  - Synthetic class-based pilot
  - Many slightly different towers
  - Wind directions at 0, 22.5, and 45 degrees
  - Plots one fragility curve per direction

- `notebooks/03_pilot_v3_published_greece_case.ipynb`
  - Literature-grounded reproduction
  - Uses published fragility values from Bilionis and Vamvatsikos
  - Plots published curves and design-speed collapse probabilities

- `notebooks/04_pilot_v4_literature_class_library.ipynb`
  - Literature-grounded telecom tower class library
  - Uses class labels from Khazaali and Bocchini's telecom portfolio work
  - Builds reusable class tables and an example inventory template

## Optional Python Scripts

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
- `ipykernel`

## Quick Start

If you are using VS Code, the easiest route is:

1. Open this repository folder in VS Code.
2. Select a valid Python interpreter with `Python: Select Interpreter`.
3. Install dependencies with `python -m pip install -r requirements.txt`.
4. Open `notebooks/01_pilot_v1_single_tower.ipynb`.
5. Click `Run All` or run the cells one by one.
6. Continue with notebooks `02`, `03`, and `04`.

From a terminal, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Then open the notebooks in VS Code or Jupyter.

To run the optional Python-script version:

```bash
python run_all_pilots.py
python scripts/pilot_v1_single_tower.py
python scripts/pilot_v2_class_based.py
python scripts/pilot_v3_published_greece_case.py
python scripts/pilot_v4_literature_class_library.py
```

If you see an error like `/opt/homebrew/bin/python: no such file or directory`, the issue is the selected VS Code Python interpreter, not the fragility code. Re-select a real interpreter using `Python: Select Interpreter`.

## Outputs

Each script writes results into the repository `outputs/` folder:

- `outputs/v1/`
- `outputs/v2/`
- `outputs/v3/`
- `outputs/v4/`

These include:

- assumptions JSON
- stripe results CSV
- fragility summary JSON
- fragility plot PNG

The exact files vary by pilot version. The `outputs/` folder is ignored by Git because every user can regenerate it locally.

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
