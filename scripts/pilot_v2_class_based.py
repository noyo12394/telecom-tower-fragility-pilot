"""Pilot V2 class-based fragility analysis for telecom towers under wind.

This script extends the first MVP by adding:
- a small synthetic telecom tower class
- tower-body and antenna wind effects
- wind directions at 0, 22.5, and 45 degrees
- direction-specific collapse fragility fitting
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import norm

# Keep Matplotlib cache repo-local so the script runs cleanly on locked-down systems.
MPLCONFIGDIR = Path(__file__).resolve().parents[1] / "outputs" / "_matplotlib_cache"
MPLCONFIGDIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIGDIR))

# Font libraries also use a cache on some systems; keep that repo-local too.
XDG_CACHE_HOME = Path(__file__).resolve().parents[1] / "outputs" / "_cache"
XDG_CACHE_HOME.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("XDG_CACHE_HOME", str(XDG_CACHE_HOME))

# Use a non-interactive backend so the script saves plots cleanly on any machine.
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# ============================================================
# Global settings
# ============================================================

RANDOM_SEED = 123
rng = np.random.default_rng(RANDOM_SEED)

plt.style.use("seaborn-v0_8-whitegrid")
plt.rcParams["figure.dpi"] = 130
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 160)
pd.set_option("display.float_format", lambda value: f"{value:0.4f}")


# ============================================================
# Assumptions
# ============================================================

STRIPE_START_MPS = 20.0
STRIPE_END_MPS = 50.0
STRIPE_INCREMENT_MPS = 2.5

WIND_SPEED_STRIPES_MPS = np.round(
    np.arange(
        STRIPE_START_MPS,
        STRIPE_END_MPS + 0.5 * STRIPE_INCREMENT_MPS,
        STRIPE_INCREMENT_MPS,
    ),
    2,
).tolist()

ASSUMPTIONS = {
    "project_name": "Pilot V2 class-based telecom tower fragility under wind",
    "tower_class": "self-supporting steel lattice telecommunication tower",
    "baseline_tower": {
        "structural_height_m": 48.0,
        "total_height_including_tip_m": 51.0,
        "lower_inclined_height_m": 24.0,
        "upper_straight_height_m": 24.0,
        "shape": "square lattice",
    },
    "hazard": "wind only",
    "intensity_measure": {
        "name": "10-minute mean wind speed",
        "symbol": "V",
        "units": "m/s",
    },
    "stripe_analysis": {
        "start_wind_speed_mps": STRIPE_START_MPS,
        "end_wind_speed_mps": STRIPE_END_MPS,
        "increment_mps": STRIPE_INCREMENT_MPS,
        "wind_speeds_mps": WIND_SPEED_STRIPES_MPS,
    },
    "wind_directions_deg": [0.0, 22.5, 45.0],
    "class_inventory_size": 80,
    "damage_state": "collapse only",
    "uncertainty_settings": {
        "wind_load_multiplier": {
            "distribution": "lognormal",
            "mean": 1.0,
            "cov": 0.18,
        },
        "antenna_load_multiplier": {
            "distribution": "lognormal",
            "mean": 1.0,
            "cov": 0.12,
        },
        "capacity_multiplier": {
            "distribution": "lognormal",
            "mean": 1.0,
            "cov": 0.15,
        },
    },
    "synthetic_class_ranges": {
        "height_m": [44.0, 52.0],
        "base_width_m": [5.0, 7.5],
        "top_width_m": [1.6, 3.0],
        "lattice_solidity_ratio": [0.16, 0.28],
        "antenna_area_m2": [6.0, 18.0],
        "tower_drag_coefficient": [1.8, 2.1],
        "antenna_drag_coefficient": [1.4, 1.8],
        "baseline_capacity_factor_mean": 1.0,
        "baseline_capacity_factor_cov": 0.10,
    },
    "random_seed": RANDOM_SEED,
}


# ============================================================
# Validation and probability helpers
# ============================================================

def validate_assumptions(assumptions_dict: dict) -> None:
    """Validate main model settings."""
    height = float(assumptions_dict["baseline_tower"]["structural_height_m"])
    lower = float(assumptions_dict["baseline_tower"]["lower_inclined_height_m"])
    upper = float(assumptions_dict["baseline_tower"]["upper_straight_height_m"])

    if height <= 0 or not np.isclose(lower + upper, height):
        raise ValueError("Baseline tower geometry is inconsistent.")
    if assumptions_dict["class_inventory_size"] <= 0:
        raise ValueError("Class inventory size must be positive.")
    if len(assumptions_dict["wind_directions_deg"]) == 0:
        raise ValueError("At least one wind direction is required.")


def lognormal_parameters_from_mean_cov(mean_value: float, cov_value: float) -> tuple[float, float]:
    """Convert target mean and COV to log-space parameters."""
    if mean_value <= 0:
        raise ValueError("Mean must be positive.")
    if cov_value < 0:
        raise ValueError("COV cannot be negative.")

    sigma_ln = np.sqrt(np.log(1.0 + cov_value**2))
    mu_ln = np.log(mean_value) - 0.5 * sigma_ln**2
    return float(mu_ln), float(sigma_ln)


def sample_lognormal(
    mean_value: float,
    cov_value: float,
    sample_size: int,
    random_generator: np.random.Generator,
) -> np.ndarray:
    """Sample from a lognormal distribution using mean and COV inputs."""
    if sample_size <= 0:
        raise ValueError("Sample size must be positive.")
    mu_ln, sigma_ln = lognormal_parameters_from_mean_cov(mean_value, cov_value)
    return np.asarray(random_generator.lognormal(mean=mu_ln, sigma=sigma_ln, size=sample_size), dtype=float)


# ============================================================
# Synthetic telecom tower class
# ============================================================

def generate_synthetic_tower_class(assumptions_dict: dict, random_generator: np.random.Generator) -> pd.DataFrame:
    """Generate a simple synthetic class inventory."""
    class_ranges = assumptions_dict["synthetic_class_ranges"]
    n_towers = int(assumptions_dict["class_inventory_size"])

    heights_m = random_generator.uniform(*class_ranges["height_m"], size=n_towers)
    base_widths_m = random_generator.uniform(*class_ranges["base_width_m"], size=n_towers)
    top_widths_m = random_generator.uniform(*class_ranges["top_width_m"], size=n_towers)
    lattice_solidity = random_generator.uniform(*class_ranges["lattice_solidity_ratio"], size=n_towers)
    antenna_areas_m2 = random_generator.uniform(*class_ranges["antenna_area_m2"], size=n_towers)
    tower_drag_coefficients = random_generator.uniform(*class_ranges["tower_drag_coefficient"], size=n_towers)
    antenna_drag_coefficients = random_generator.uniform(*class_ranges["antenna_drag_coefficient"], size=n_towers)

    baseline_capacity_factors = sample_lognormal(
        mean_value=class_ranges["baseline_capacity_factor_mean"],
        cov_value=class_ranges["baseline_capacity_factor_cov"],
        sample_size=n_towers,
        random_generator=random_generator,
    )

    inventory_df = pd.DataFrame(
        {
            "tower_id": np.arange(1, n_towers + 1, dtype=int),
            "tower_class": assumptions_dict["tower_class"],
            "shape": "square lattice",
            "height_m": heights_m,
            "base_width_m": base_widths_m,
            "top_width_m": top_widths_m,
            "mean_face_width_m": 0.5 * (base_widths_m + top_widths_m),
            "lattice_solidity_ratio": lattice_solidity,
            "antenna_area_m2": antenna_areas_m2,
            "tower_drag_coefficient": tower_drag_coefficients,
            "antenna_drag_coefficient": antenna_drag_coefficients,
            "baseline_capacity_factor": baseline_capacity_factors,
        }
    )

    if (inventory_df["top_width_m"] >= inventory_df["base_width_m"]).any():
        raise ValueError("Top width must remain smaller than base width in this pilot class.")

    return inventory_df


# ============================================================
# Response model
# ============================================================

def compute_direction_factor(direction_deg: float) -> float:
    """Return a simple direction amplification factor for a square lattice tower."""
    return float(1.0 + 0.15 * np.sin(np.deg2rad(2.0 * direction_deg)) ** 2)


def compute_effective_projected_areas(tower_row: pd.Series, direction_deg: float) -> tuple[float, float]:
    """Estimate effective projected areas for the tower body and antennas."""
    height_m = float(tower_row["height_m"])
    mean_face_width_m = float(tower_row["mean_face_width_m"])
    lattice_solidity_ratio = float(tower_row["lattice_solidity_ratio"])
    antenna_area_m2 = float(tower_row["antenna_area_m2"])

    direction_factor = compute_direction_factor(direction_deg)
    tower_body_area_m2 = height_m * mean_face_width_m * lattice_solidity_ratio * direction_factor
    antenna_effective_area_m2 = antenna_area_m2 * (1.0 + 0.10 * (direction_factor - 1.0) / 0.15)

    return float(tower_body_area_m2), float(antenna_effective_area_m2)


def compute_component_capacities(tower_row: pd.Series, capacity_multiplier: float) -> dict:
    """Compute simplified component capacities for the tower."""
    height_m = float(tower_row["height_m"])
    base_width_m = float(tower_row["base_width_m"])
    mean_face_width_m = float(tower_row["mean_face_width_m"])
    baseline_capacity_factor = float(tower_row["baseline_capacity_factor"])

    if capacity_multiplier <= 0:
        raise ValueError("Capacity multiplier must be positive.")

    total_capacity_factor = baseline_capacity_factor * capacity_multiplier

    leg_capacity_kNm = (
        2600.0
        * (base_width_m / 6.0) ** 1.20
        * (48.0 / height_m) ** 0.30
        * total_capacity_factor
    )
    brace_capacity_kN = (
        95.0
        * (mean_face_width_m / 4.0) ** 1.00
        * (48.0 / height_m) ** 0.20
        * total_capacity_factor
    )
    antenna_attachment_capacity_kN = (
        18.0
        * (48.0 / height_m) ** 0.10
        * total_capacity_factor
    )

    return {
        "leg_capacity_kNm": float(leg_capacity_kNm),
        "brace_capacity_kN": float(brace_capacity_kN),
        "antenna_attachment_capacity_kN": float(antenna_attachment_capacity_kN),
    }


def simulate_tower_response(
    tower_row: pd.Series,
    wind_speed_mps: float,
    direction_deg: float,
    uncertainty_settings: dict,
    random_generator: np.random.Generator,
) -> dict:
    """Simulate one tower at one wind speed and one direction."""
    if wind_speed_mps <= 0:
        raise ValueError("Wind speed must be positive.")

    wind_load_multiplier = sample_lognormal(
        uncertainty_settings["wind_load_multiplier"]["mean"],
        uncertainty_settings["wind_load_multiplier"]["cov"],
        1,
        random_generator,
    )[0]
    antenna_load_multiplier = sample_lognormal(
        uncertainty_settings["antenna_load_multiplier"]["mean"],
        uncertainty_settings["antenna_load_multiplier"]["cov"],
        1,
        random_generator,
    )[0]
    capacity_multiplier = sample_lognormal(
        uncertainty_settings["capacity_multiplier"]["mean"],
        uncertainty_settings["capacity_multiplier"]["cov"],
        1,
        random_generator,
    )[0]

    tower_body_area_m2, antenna_effective_area_m2 = compute_effective_projected_areas(tower_row, direction_deg)
    tower_drag_coefficient = float(tower_row["tower_drag_coefficient"])
    antenna_drag_coefficient = float(tower_row["antenna_drag_coefficient"])
    height_m = float(tower_row["height_m"])

    dynamic_pressure_n_per_m2 = 0.613 * wind_speed_mps**2

    tower_body_force_kN = (
        dynamic_pressure_n_per_m2
        * tower_body_area_m2
        * tower_drag_coefficient
        * wind_load_multiplier
        / 1000.0
    )
    antenna_force_kN = (
        dynamic_pressure_n_per_m2
        * antenna_effective_area_m2
        * antenna_drag_coefficient
        * wind_load_multiplier
        * antenna_load_multiplier
        / 1000.0
    )
    total_force_kN = tower_body_force_kN + antenna_force_kN
    overturning_moment_kNm = total_force_kN * 0.60 * height_m

    capacities = compute_component_capacities(tower_row, capacity_multiplier)

    leg_utilization = overturning_moment_kNm / capacities["leg_capacity_kNm"]
    brace_utilization = total_force_kN / capacities["brace_capacity_kN"]
    antenna_utilization = antenna_force_kN / capacities["antenna_attachment_capacity_kN"]

    global_collapse_index = 0.60 * leg_utilization + 0.25 * brace_utilization + 0.15 * antenna_utilization
    component_failures = int(leg_utilization > 1.0) + int(brace_utilization > 1.0) + int(antenna_utilization > 1.0)
    collapse = bool((leg_utilization > 1.05) or (global_collapse_index > 1.0) or (component_failures >= 2))

    return {
        "tower_body_force_kN": float(tower_body_force_kN),
        "antenna_force_kN": float(antenna_force_kN),
        "total_force_kN": float(total_force_kN),
        "overturning_moment_kNm": float(overturning_moment_kNm),
        "leg_utilization": float(leg_utilization),
        "brace_utilization": float(brace_utilization),
        "antenna_utilization": float(antenna_utilization),
        "global_collapse_index": float(global_collapse_index),
        "collapse": collapse,
    }


# ============================================================
# Fragility fitting
# ============================================================

def lognormal_fragility_probability(wind_speed_mps: np.ndarray, theta: float, beta: float) -> np.ndarray:
    """Return fragility probabilities from a lognormal CDF."""
    wind_speed_mps = np.asarray(wind_speed_mps, dtype=float)
    if theta <= 0 or beta <= 0 or np.any(wind_speed_mps <= 0):
        raise ValueError("Theta, beta, and wind speeds must be positive.")

    standardized_value = (np.log(wind_speed_mps) - np.log(theta)) / beta
    return np.clip(norm.cdf(standardized_value), 1e-10, 1.0 - 1e-10)


def negative_log_likelihood(log_parameters: np.ndarray, wind_speeds: np.ndarray, failures: np.ndarray, totals: np.ndarray) -> float:
    """Binomial negative log-likelihood for fragility fitting."""
    theta = np.exp(log_parameters[0])
    beta = np.exp(log_parameters[1])
    probabilities = lognormal_fragility_probability(wind_speeds, theta, beta)
    log_likelihood = failures * np.log(probabilities) + (totals - failures) * np.log(1.0 - probabilities)
    return float(-np.sum(log_likelihood))


def fit_fragility_for_one_direction(direction_df: pd.DataFrame) -> dict:
    """Fit theta and beta for one direction-specific stripe table."""
    wind_speeds = direction_df["wind_speed_mps"].to_numpy(dtype=float)
    failures = direction_df["failure_count"].to_numpy(dtype=float)
    totals = direction_df["simulations_in_stripe"].to_numpy(dtype=float)
    observed_probabilities = direction_df["observed_collapse_probability"].to_numpy(dtype=float)

    crossing_indices = np.where(observed_probabilities >= 0.5)[0]
    theta_initial = float(wind_speeds[crossing_indices[0]]) if crossing_indices.size > 0 else float(np.median(wind_speeds))
    beta_initial = 0.18

    result = minimize(
        fun=negative_log_likelihood,
        x0=np.log([theta_initial, beta_initial]),
        args=(wind_speeds, failures, totals),
        method="L-BFGS-B",
        bounds=[(np.log(1.0), np.log(200.0)), (np.log(0.03), np.log(2.0))],
    )

    if not result.success:
        raise RuntimeError(f"Fragility fitting failed for direction {direction_df['direction_deg'].iloc[0]}: {result.message}")

    return {
        "direction_deg": float(direction_df["direction_deg"].iloc[0]),
        "theta_mps": float(np.exp(result.x[0])),
        "beta": float(np.exp(result.x[1])),
        "negative_log_likelihood": float(result.fun),
        "optimization_success": bool(result.success),
    }


# ============================================================
# Main workflow
# ============================================================

def run_analysis() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Run the synthetic class analysis and fit direction-specific fragilities."""
    validate_assumptions(ASSUMPTIONS)
    tower_class_inventory_df = generate_synthetic_tower_class(ASSUMPTIONS, rng)

    simulation_records = []
    stripe_records = []

    for direction_deg in ASSUMPTIONS["wind_directions_deg"]:
        for wind_speed_mps in ASSUMPTIONS["stripe_analysis"]["wind_speeds_mps"]:
            collapse_flags = []
            leg_utilizations = []
            brace_utilizations = []
            antenna_utilizations = []
            global_indices = []

            for _, tower_row in tower_class_inventory_df.iterrows():
                response = simulate_tower_response(
                    tower_row=tower_row,
                    wind_speed_mps=wind_speed_mps,
                    direction_deg=direction_deg,
                    uncertainty_settings=ASSUMPTIONS["uncertainty_settings"],
                    random_generator=rng,
                )

                collapse_flags.append(int(response["collapse"]))
                leg_utilizations.append(response["leg_utilization"])
                brace_utilizations.append(response["brace_utilization"])
                antenna_utilizations.append(response["antenna_utilization"])
                global_indices.append(response["global_collapse_index"])

                simulation_records.append(
                    {
                        "tower_id": int(tower_row["tower_id"]),
                        "direction_deg": float(direction_deg),
                        "wind_speed_mps": float(wind_speed_mps),
                        "height_m": float(tower_row["height_m"]),
                        "base_width_m": float(tower_row["base_width_m"]),
                        "top_width_m": float(tower_row["top_width_m"]),
                        "antenna_area_m2": float(tower_row["antenna_area_m2"]),
                        "tower_body_force_kN": response["tower_body_force_kN"],
                        "antenna_force_kN": response["antenna_force_kN"],
                        "total_force_kN": response["total_force_kN"],
                        "overturning_moment_kNm": response["overturning_moment_kNm"],
                        "leg_utilization": response["leg_utilization"],
                        "brace_utilization": response["brace_utilization"],
                        "antenna_utilization": response["antenna_utilization"],
                        "global_collapse_index": response["global_collapse_index"],
                        "collapse": int(response["collapse"]),
                    }
                )

            stripe_records.append(
                {
                    "direction_deg": float(direction_deg),
                    "wind_speed_mps": float(wind_speed_mps),
                    "simulations_in_stripe": int(len(collapse_flags)),
                    "failure_count": int(np.sum(collapse_flags)),
                    "observed_collapse_probability": float(np.mean(collapse_flags)),
                    "mean_leg_utilization": float(np.mean(leg_utilizations)),
                    "mean_brace_utilization": float(np.mean(brace_utilizations)),
                    "mean_antenna_utilization": float(np.mean(antenna_utilizations)),
                    "mean_global_collapse_index": float(np.mean(global_indices)),
                }
            )

    simulation_results_df = pd.DataFrame(simulation_records)
    stripe_results_df = pd.DataFrame(stripe_records).sort_values(by=["direction_deg", "wind_speed_mps"]).reset_index(drop=True)

    fragility_fit_records = []
    for direction_deg in ASSUMPTIONS["wind_directions_deg"]:
        direction_df = stripe_results_df[stripe_results_df["direction_deg"] == direction_deg].copy()
        fragility_fit_records.append(fit_fragility_for_one_direction(direction_df))

    fragility_fit_df = pd.DataFrame(fragility_fit_records).sort_values("direction_deg").reset_index(drop=True)

    return tower_class_inventory_df, simulation_results_df, stripe_results_df, fragility_fit_df


def save_outputs(
    tower_class_inventory_df: pd.DataFrame,
    simulation_results_df: pd.DataFrame,
    stripe_results_df: pd.DataFrame,
    fragility_fit_df: pd.DataFrame,
) -> Path:
    """Save data tables and fragility plots."""
    repo_root = Path(__file__).resolve().parents[1]
    output_folder = repo_root / "outputs" / "v2"
    output_folder.mkdir(parents=True, exist_ok=True)

    with (output_folder / "assumptions.json").open("w", encoding="utf-8") as file:
        json.dump(ASSUMPTIONS, file, indent=4)

    tower_class_inventory_df.to_csv(output_folder / "synthetic_tower_class_inventory.csv", index=False)
    simulation_results_df.to_csv(output_folder / "simulation_results.csv", index=False)

    stripe_results_with_fit = stripe_results_df.copy()
    for _, fit_row in fragility_fit_df.iterrows():
        direction_mask = stripe_results_with_fit["direction_deg"] == fit_row["direction_deg"]
        stripe_results_with_fit.loc[direction_mask, "fitted_collapse_probability"] = lognormal_fragility_probability(
            stripe_results_with_fit.loc[direction_mask, "wind_speed_mps"].to_numpy(dtype=float),
            fit_row["theta_mps"],
            fit_row["beta"],
        )

    stripe_results_with_fit.to_csv(output_folder / "stripe_results.csv", index=False)

    summary_payload = {
        "project_name": ASSUMPTIONS["project_name"],
        "damage_state": ASSUMPTIONS["damage_state"],
        "intensity_measure": ASSUMPTIONS["intensity_measure"]["name"],
        "wind_directions_deg": ASSUMPTIONS["wind_directions_deg"],
        "fragility_fit_summary": [
            {
                "direction_deg": float(row["direction_deg"]),
                "theta_mps": float(row["theta_mps"]),
                "beta": float(row["beta"]),
                "negative_log_likelihood": float(row["negative_log_likelihood"]),
                "optimization_success": bool(row["optimization_success"]),
            }
            for _, row in fragility_fit_df.iterrows()
        ],
    }

    with (output_folder / "fragility_summary.json").open("w", encoding="utf-8") as file:
        json.dump(summary_payload, file, indent=4)

    fig, ax = plt.subplots(figsize=(9, 6))
    direction_colors = {0.0: "tab:blue", 22.5: "tab:orange", 45.0: "tab:red"}
    smooth_wind_speeds_mps = np.linspace(
        float(stripe_results_df["wind_speed_mps"].min()),
        float(stripe_results_df["wind_speed_mps"].max()),
        300,
    )

    for _, fit_row in fragility_fit_df.iterrows():
        direction_deg = float(fit_row["direction_deg"])
        color = direction_colors.get(direction_deg, None)
        direction_stripes = stripe_results_with_fit[stripe_results_with_fit["direction_deg"] == direction_deg]

        ax.scatter(
            direction_stripes["wind_speed_mps"],
            direction_stripes["observed_collapse_probability"],
            color=color,
            s=55,
            alpha=0.85,
            label=f"Observed, {direction_deg:g}°",
        )
        ax.plot(
            smooth_wind_speeds_mps,
            lognormal_fragility_probability(smooth_wind_speeds_mps, fit_row["theta_mps"], fit_row["beta"]),
            color=color,
            linewidth=2.2,
            label=f"Fitted, {direction_deg:g}°",
        )

    ax.set_xlabel("10-minute mean wind speed, V (m/s)")
    ax.set_ylabel("Probability of collapse")
    ax.set_title("Pilot V2 class-based telecom tower fragility under wind")
    ax.set_ylim(-0.02, 1.02)
    ax.legend(ncol=2, fontsize=9)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(output_folder / "fragility_curves.png", bbox_inches="tight")
    plt.close(fig)

    return output_folder


def main() -> None:
    """Run the complete Pilot V2 workflow."""
    tower_class_inventory_df, simulation_results_df, stripe_results_df, fragility_fit_df = run_analysis()
    output_folder = save_outputs(
        tower_class_inventory_df,
        simulation_results_df,
        stripe_results_df,
        fragility_fit_df,
    )

    print("Pilot V2 complete")
    print(f"Outputs saved in: {output_folder}")
    for _, row in fragility_fit_df.iterrows():
        print(f"Direction {row['direction_deg']:g} deg -> theta = {row['theta_mps']:.2f} m/s, beta = {row['beta']:.3f}")


if __name__ == "__main__":
    main()
