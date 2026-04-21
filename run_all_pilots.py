"""Run every telecom tower fragility pilot script from the repository root.

This file is meant to be the beginner-friendly entry point.

If someone downloads the GitHub repository, opens the folder in VS Code, selects a
working Python interpreter, and presses Run on this file, it will:

1. check that the required scientific Python libraries are installed;
2. run each pilot script in order using the same Python interpreter;
3. write outputs into the local ``outputs/`` folder.

The runner intentionally avoids hard-coded machine-specific paths such as
``/opt/homebrew/bin/python``. It uses ``sys.executable``, which means "the Python
that is currently running this file."
"""

from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
from pathlib import Path


# ============================================================
# Repository paths
# ============================================================

REPO_ROOT = Path(__file__).resolve().parent
MPLCONFIGDIR = REPO_ROOT / "outputs" / "_matplotlib_cache"
XDG_CACHE_HOME = REPO_ROOT / "outputs" / "_cache"

PILOT_SCRIPTS = [
    ("Pilot V1: single 48 m lattice tower", REPO_ROOT / "scripts" / "pilot_v1_single_tower.py"),
    ("Pilot V2: synthetic class-based tower set", REPO_ROOT / "scripts" / "pilot_v2_class_based.py"),
    ("Pilot V3: published Greek telecom tower case", REPO_ROOT / "scripts" / "pilot_v3_published_greece_case.py"),
    ("Pilot V4: literature-backed telecom class library", REPO_ROOT / "scripts" / "pilot_v4_literature_class_library.py"),
]

REQUIRED_PACKAGES = ["numpy", "pandas", "scipy", "matplotlib"]


# ============================================================
# Checks
# ============================================================

def check_python_version() -> None:
    """Require a modern Python version that supports this academic prototype."""
    minimum_version = (3, 9)

    if sys.version_info < minimum_version:
        version_text = ".".join(str(part) for part in minimum_version)
        raise RuntimeError(
            f"Python {version_text} or newer is required. "
            f"You are using Python {sys.version.split()[0]}."
        )


def find_missing_packages() -> list[str]:
    """Return required packages that are not installed in the active interpreter."""
    missing_packages = []

    for package_name in REQUIRED_PACKAGES:
        if importlib.util.find_spec(package_name) is None:
            missing_packages.append(package_name)

    return missing_packages


def check_required_packages() -> None:
    """Stop early with a readable message if scientific packages are missing."""
    missing_packages = find_missing_packages()

    if not missing_packages:
        return

    package_list = ", ".join(missing_packages)
    install_command = f"{sys.executable} -m pip install -r requirements.txt"

    raise RuntimeError(
        "Missing required Python packages: "
        f"{package_list}\n\n"
        "Install them from the repository root with:\n"
        f"    {install_command}\n"
    )


def check_script_files_exist() -> None:
    """Make sure every expected script exists before starting the workflow."""
    missing_scripts = [script_path for _, script_path in PILOT_SCRIPTS if not script_path.exists()]

    if missing_scripts:
        missing_text = "\n".join(f"    - {path}" for path in missing_scripts)
        raise FileNotFoundError(f"These pilot scripts are missing:\n{missing_text}")


# ============================================================
# Runner
# ============================================================

def run_one_script(label: str, script_path: Path) -> None:
    """Run one pilot script with the active Python interpreter."""
    print("", flush=True)
    print("=" * 72, flush=True)
    print(label, flush=True)
    print("=" * 72, flush=True)
    print(f"Script: {script_path.relative_to(REPO_ROOT)}", flush=True)
    print(f"Python: {sys.executable}", flush=True)
    print("", flush=True)

    child_environment = os.environ.copy()
    child_environment.setdefault("MPLCONFIGDIR", str(MPLCONFIGDIR))
    child_environment.setdefault("XDG_CACHE_HOME", str(XDG_CACHE_HOME))
    child_environment.setdefault("PYTHONUNBUFFERED", "1")

    subprocess.run(
        [sys.executable, str(script_path)],
        cwd=REPO_ROOT,
        env=child_environment,
        check=True,
    )


def main() -> None:
    """Run all pilot scripts in a safe, repeatable order."""
    MPLCONFIGDIR.mkdir(parents=True, exist_ok=True)
    XDG_CACHE_HOME.mkdir(parents=True, exist_ok=True)

    print("Telecom tower fragility pilot runner", flush=True)
    print("=" * 72, flush=True)
    print(f"Repository root: {REPO_ROOT}", flush=True)
    print(f"Active Python:   {sys.executable}", flush=True)

    check_python_version()
    check_required_packages()
    check_script_files_exist()

    for label, script_path in PILOT_SCRIPTS:
        run_one_script(label, script_path)

    print("", flush=True)
    print("=" * 72, flush=True)
    print("All pilots completed successfully.", flush=True)
    print(f"Outputs were written under: {REPO_ROOT / 'outputs'}", flush=True)
    print("=" * 72, flush=True)


if __name__ == "__main__":
    main()
