# Setup and Run Guide

This guide is for someone who downloads the GitHub repository and wants to run the
pilot notebooks locally.

## The Main Thing To Know

If VS Code shows an error like this:

```text
zsh: no such file or directory: /opt/homebrew/bin/python
```

that usually means **VS Code is pointing to a Python interpreter that does not
exist on the computer**. The code did not fail yet. Python failed to start.

## Recommended VS Code Workflow

1. Open the full repository folder in VS Code.
2. Open the Command Palette with `Cmd + Shift + P`.
3. Search for `Python: Select Interpreter`.
4. Pick a real Python environment, such as a conda environment or a `.venv`.
5. Open `notebooks/01_pilot_v1_single_tower.ipynb`.
6. Click `Run All`, or run the cells one by one.
7. Continue with notebooks `02`, `03`, and `04`.

## Recommended Terminal Workflow

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Then open the notebooks in VS Code or Jupyter.

On Windows PowerShell, activation is usually:

```powershell
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Recommended Notebook Order

Run these notebooks in order:

```text
notebooks/01_pilot_v1_single_tower.ipynb
notebooks/02_pilot_v2_class_based.ipynb
notebooks/03_pilot_v3_published_greece_case.ipynb
notebooks/04_pilot_v4_literature_class_library.ipynb
```

## Optional Script Runner

The repository still includes Python scripts for reproducibility. If you want to
run everything from the terminal instead of notebooks:

```bash
python run_all_pilots.py
```

You can also run one script at a time:

```bash
python scripts/pilot_v1_single_tower.py
python scripts/pilot_v2_class_based.py
python scripts/pilot_v3_published_greece_case.py
python scripts/pilot_v4_literature_class_library.py
```

## Where Outputs Go

The scripts write local results into:

```text
outputs/
```

That folder is intentionally ignored by Git because each user can regenerate
their own CSV, JSON, and PNG outputs.
