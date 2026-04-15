"""Literature-grounded fragility reproduction for a published Greek telecom tower case.

This script reproduces published lognormal fragility curves from:

Bilionis, D. V., and Vamvatsikos, D. (2022)
"Risk assessment of rehabilitation strategies for steel lattice telecommunication
towers of Greece under extreme wind hazard"
Engineering Structures, 114625
DOI: 10.1016/j.engstruct.2022.114625

Important difference from the earlier repo scripts:
- V1 and V2 are pilot prototype scripts with simplified surrogate assumptions
- V3 uses published directional fragility parameters from the literature

The purpose of this script is to provide a non-hallucinated benchmark case that
is directly tied to a paper and easy to compare against future Wang-style
class-based telecom work.
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd
from scipy.stats import norm

# Use a non-interactive backend so the script runs cleanly in terminal-only environments.
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# ============================================================
# Global plotting settings
# ============================================================

plt.style.use("seaborn-v0_8-whitegrid")
plt.rcParams["figure.dpi"] = 130
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 160)
pd.set_option("display.float_format", lambda value: f"{value:0.4f}")


# ============================================================
# Literature-backed case definition
# ============================================================

LITERATURE_CASE = {
    "project_name": "Published Greece telecom tower fragility reproduction",
    "source": {
        "title": "Risk assessment of rehabilitation strategies for steel lattice telecommunication towers of Greece under extreme wind hazard",
        "authors": ["Dimitrios V. Bilionis", "Dimitrios I. Vamvatsikos"],
        "year": 2022,
        "journal": "Engineering Structures",
        "doi": "10.1016/j.engstruct.2022.114625",
        "url": "https://www.hyperion-project.eu/wp-content/uploads/2023/02/bilionis-vlachakis-vamva-etal_prEngStr2022_RiskRehabilitationTelecomTowerWindHazard.pdf",
        "notes": (
            "Published fragility parameters are reproduced directly here. "
            "This script does not re-fit or re-calibrate the tower."
        ),
    },
    "published_tower_description": {
        "tower_type": "steel lattice telecommunication tower",
        "structural_height_m": 48.0,
        "dish_antennas_count": 4,
        "dish_antenna_mount_elevation_range_m": [45.0, 48.0],
        "dish_antenna_weight_kN_each": 2.30,
        "ladder_weight_kN": 15.30,
        "waveguide_rack_weight_kN": 14.60,
        "cable_weight_kN_per_m_per_dish": 0.05,
        "platform_live_load_kN_per_m2": 2.00,
        "ladder_live_load_kN": 5.00,
    },
    "published_wind_model": {
        "velocity_pressure_formula": "q = 0.5 * rho * u^2",
        "air_density_kg_per_m3": 1.225,
        "power_law_exponent_alpha": 0.20,
        "basic_wind_speed_mps": {
            "most_of_Greece_10min_average": 27.0,
            "within_10km_of_shoreline_10min_average": 33.0,
        },
    },
    "published_fragility_model": {
        "type": "lognormal",
        "formula": "P(D > C | u, theta) = Phi( ln(u / u50(theta)) / beta(theta) )",
        "wind_directions_deg": [0.0, 22.5, 45.0],
        "tower_conditions": [
            "initial_tower",
            "corroded_tower",
            "strengthened_tower",
            "strengthened_tower_with_HSS_bracings",
        ],
    },
}


# Table 4 values from the Bilionis and Vamvatsikos (2022) paper
PUBLISHED_FRAGILITY_PARAMETERS = [
    {"tower_condition": "initial_tower", "direction_deg": 0.0, "u50_mps": 39.11, "beta": 0.1895},
    {"tower_condition": "initial_tower", "direction_deg": 22.5, "u50_mps": 42.83, "beta": 0.1898},
    {"tower_condition": "initial_tower", "direction_deg": 45.0, "u50_mps": 45.94, "beta": 0.1908},
    {"tower_condition": "corroded_tower", "direction_deg": 0.0, "u50_mps": 30.82, "beta": 0.1994},
    {"tower_condition": "corroded_tower", "direction_deg": 22.5, "u50_mps": 33.44, "beta": 0.1985},
    {"tower_condition": "corroded_tower", "direction_deg": 45.0, "u50_mps": 35.93, "beta": 0.1982},
    {"tower_condition": "strengthened_tower", "direction_deg": 0.0, "u50_mps": 46.03, "beta": 0.1637},
    {"tower_condition": "strengthened_tower", "direction_deg": 22.5, "u50_mps": 47.89, "beta": 0.1625},
    {"tower_condition": "strengthened_tower", "direction_deg": 45.0, "u50_mps": 49.27, "beta": 0.1631},
    {"tower_condition": "strengthened_tower_with_HSS_bracings", "direction_deg": 0.0, "u50_mps": 57.96, "beta": 0.1379},
    {"tower_condition": "strengthened_tower_with_HSS_bracings", "direction_deg": 22.5, "u50_mps": 58.18, "beta": 0.1375},
    {"tower_condition": "strengthened_tower_with_HSS_bracings", "direction_deg": 45.0, "u50_mps": 57.13, "beta": 0.1340},
]


def validate_case_definition() -> None:
    """Validate that the literature-backed values are internally consistent."""
    directions = set(LITERATURE_CASE["published_fragility_model"]["wind_directions_deg"])
    conditions = set(LITERATURE_CASE["published_fragility_model"]["tower_conditions"])

    parameter_df = pd.DataFrame(PUBLISHED_FRAGILITY_PARAMETERS)

    if (parameter_df["u50_mps"] <= 0).any():
        raise ValueError("All published u50 values must be positive.")
    if (parameter_df["beta"] <= 0).any():
        raise ValueError("All published beta values must be positive.")
    if set(parameter_df["direction_deg"]) != directions:
        raise ValueError("Published direction set does not match the case metadata.")
    if set(parameter_df["tower_condition"]) != conditions:
        raise ValueError("Published tower conditions do not match the case metadata.")


def lognormal_fragility_probability(wind_speed_mps: np.ndarray, u50_mps: float, beta: float) -> np.ndarray:
    """Compute collapse probability from the published lognormal fragility form."""
    wind_speed_mps = np.asarray(wind_speed_mps, dtype=float)

    if np.any(wind_speed_mps <= 0):
        raise ValueError("Wind speeds must be positive.")
    if u50_mps <= 0:
        raise ValueError("u50 must be positive.")
    if beta <= 0:
        raise ValueError("beta must be positive.")

    standardized_value = np.log(wind_speed_mps / u50_mps) / beta
    return norm.cdf(standardized_value)


def build_fragility_point_table() -> pd.DataFrame:
    """Compute collapse probabilities over a plotting wind-speed range.

    The wind-speed range here is only for visualization and tabulation.
    The literature-backed quantities are the published u50 and beta values.
    """
    wind_speed_grid_mps = np.arange(20.0, 60.0 + 0.5, 0.5)
    records = []

    for parameter_row in PUBLISHED_FRAGILITY_PARAMETERS:
        for wind_speed_mps in wind_speed_grid_mps:
            records.append(
                {
                    "tower_condition": parameter_row["tower_condition"],
                    "direction_deg": parameter_row["direction_deg"],
                    "wind_speed_mps": float(wind_speed_mps),
                    "u50_mps": parameter_row["u50_mps"],
                    "beta": parameter_row["beta"],
                    "collapse_probability": float(
                        lognormal_fragility_probability(
                            np.array([wind_speed_mps]),
                            parameter_row["u50_mps"],
                            parameter_row["beta"],
                        )[0]
                    ),
                }
            )

    return pd.DataFrame(records)


def build_design_speed_probability_table() -> pd.DataFrame:
    """Compute collapse probabilities at the published Greek basic wind speeds."""
    design_speeds = LITERATURE_CASE["published_wind_model"]["basic_wind_speed_mps"]
    records = []

    for parameter_row in PUBLISHED_FRAGILITY_PARAMETERS:
        for design_case_name, design_speed_mps in design_speeds.items():
            probability = float(
                lognormal_fragility_probability(
                    np.array([design_speed_mps]),
                    parameter_row["u50_mps"],
                    parameter_row["beta"],
                )[0]
            )
            records.append(
                {
                    "tower_condition": parameter_row["tower_condition"],
                    "direction_deg": parameter_row["direction_deg"],
                    "design_case": design_case_name,
                    "design_speed_mps": float(design_speed_mps),
                    "u50_mps": parameter_row["u50_mps"],
                    "beta": parameter_row["beta"],
                    "collapse_probability": probability,
                }
            )

    return pd.DataFrame(records)


def plot_fragility_curves(fragility_points_df: pd.DataFrame, output_folder: Path) -> None:
    """Plot published fragility curves by tower condition and wind direction."""
    tower_conditions = LITERATURE_CASE["published_fragility_model"]["tower_conditions"]
    direction_colors = {
        0.0: "tab:blue",
        22.5: "tab:orange",
        45.0: "tab:red",
    }
    title_lookup = {
        "initial_tower": "Initial Tower",
        "corroded_tower": "Corroded Tower",
        "strengthened_tower": "Strengthened Tower",
        "strengthened_tower_with_HSS_bracings": "Strengthened Tower with HSS Bracings",
    }

    fig, axes = plt.subplots(2, 2, figsize=(11, 8), sharex=True, sharey=True)
    axes = axes.flatten()

    for axis, tower_condition in zip(axes, tower_conditions):
        condition_df = fragility_points_df[fragility_points_df["tower_condition"] == tower_condition]

        for direction_deg in sorted(condition_df["direction_deg"].unique()):
            direction_df = condition_df[condition_df["direction_deg"] == direction_deg]
            axis.plot(
                direction_df["wind_speed_mps"],
                direction_df["collapse_probability"],
                color=direction_colors[direction_deg],
                linewidth=2.2,
                label=f"{direction_deg:g} deg",
            )

        axis.set_title(title_lookup[tower_condition])
        axis.set_xlabel("10-minute average wind speed (m/s)")
        axis.set_ylabel("Probability of collapse")
        axis.set_ylim(-0.02, 1.02)
        axis.grid(alpha=0.3)
        axis.legend(fontsize=8)

    fig.suptitle("Published directional fragility curves for a 48 m Greek telecom tower case", fontsize=12)
    fig.tight_layout()
    fig.savefig(output_folder / "published_fragility_curves.png", bbox_inches="tight")
    plt.close(fig)


def plot_design_speed_probabilities(design_speed_df: pd.DataFrame, output_folder: Path) -> None:
    """Plot collapse probabilities at the two published Greek basic wind speeds."""
    title_lookup = {
        "initial_tower": "Initial",
        "corroded_tower": "Corroded",
        "strengthened_tower": "Strengthened",
        "strengthened_tower_with_HSS_bracings": "Strengthened + HSS",
    }
    design_case_lookup = {
        "most_of_Greece_10min_average": "27 m/s",
        "within_10km_of_shoreline_10min_average": "33 m/s",
    }

    summary_df = (
        design_speed_df.assign(
            tower_condition_short=lambda df: df["tower_condition"].map(title_lookup),
            design_case_short=lambda df: df["design_case"].map(design_case_lookup),
        )
        .pivot_table(
            index=["tower_condition_short", "direction_deg"],
            columns="design_case_short",
            values="collapse_probability",
        )
        .reset_index()
    )

    fig, ax = plt.subplots(figsize=(11, 5.5))

    x_positions = np.arange(len(summary_df))
    bar_width = 0.38

    ax.bar(
        x_positions - 0.5 * bar_width,
        summary_df["27 m/s"],
        width=bar_width,
        label="27 m/s",
        color="tab:blue",
    )
    ax.bar(
        x_positions + 0.5 * bar_width,
        summary_df["33 m/s"],
        width=bar_width,
        label="33 m/s",
        color="tab:red",
    )

    x_labels = [
        f"{row['tower_condition_short']}\n{row['direction_deg']:g} deg"
        for _, row in summary_df.iterrows()
    ]

    ax.set_xticks(x_positions)
    ax.set_xticklabels(x_labels, rotation=0, fontsize=8)
    ax.set_ylabel("Probability of collapse")
    ax.set_title("Published collapse probabilities at Greek basic wind speeds")
    ax.set_ylim(0.0, 1.0)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    fig.tight_layout()
    fig.savefig(output_folder / "published_design_speed_probabilities.png", bbox_inches="tight")
    plt.close(fig)


def save_outputs(
    fragility_parameters_df: pd.DataFrame,
    fragility_points_df: pd.DataFrame,
    design_speed_df: pd.DataFrame,
) -> Path:
    """Save tables, metadata, and figures."""
    repo_root = Path(__file__).resolve().parents[1]
    output_folder = repo_root / "outputs" / "v3"
    output_folder.mkdir(parents=True, exist_ok=True)

    with (output_folder / "literature_case_metadata.json").open("w", encoding="utf-8") as file:
        json.dump(LITERATURE_CASE, file, indent=4)

    fragility_parameters_df.to_csv(output_folder / "published_fragility_parameters.csv", index=False)
    fragility_points_df.to_csv(output_folder / "published_fragility_points.csv", index=False)
    design_speed_df.to_csv(output_folder / "published_design_speed_probabilities.csv", index=False)

    plot_fragility_curves(fragility_points_df, output_folder)
    plot_design_speed_probabilities(design_speed_df, output_folder)

    return output_folder


def print_summary(design_speed_df: pd.DataFrame) -> None:
    """Print a short plain-English summary."""
    print("Published Greece telecom tower case")
    print("=" * 60)
    print("Source:")
    print(LITERATURE_CASE["source"]["title"])
    print(f"DOI: {LITERATURE_CASE['source']['doi']}")
    print("")

    for tower_condition in LITERATURE_CASE["published_fragility_model"]["tower_conditions"]:
        condition_df = design_speed_df[design_speed_df["tower_condition"] == tower_condition]
        print(tower_condition)
        for _, row in condition_df.iterrows():
            print(
                f"  direction = {row['direction_deg']:>4.1f} deg, "
                f"design speed = {row['design_speed_mps']:>4.1f} m/s, "
                f"P(collapse) = {row['collapse_probability']:.3f}"
            )
        print("")


def main() -> None:
    """Run the complete literature-grounded fragility reproduction workflow."""
    validate_case_definition()

    fragility_parameters_df = pd.DataFrame(PUBLISHED_FRAGILITY_PARAMETERS)
    fragility_points_df = build_fragility_point_table()
    design_speed_df = build_design_speed_probability_table()

    output_folder = save_outputs(
        fragility_parameters_df=fragility_parameters_df,
        fragility_points_df=fragility_points_df,
        design_speed_df=design_speed_df,
    )

    print_summary(design_speed_df)
    print(f"Outputs saved in: {output_folder}")


if __name__ == "__main__":
    main()
