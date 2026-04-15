"""Pilot V1 fragility analysis for one 48 m telecom lattice tower under wind.

This script is the first MVP version:
- one tower
- one wind direction
- collapse-only damage state
- simple surrogate demand-capacity model
- lognormal fragility fitting
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import norm


# ============================================================
# Global settings
# ============================================================

RANDOM_SEED = 42
rng = np.random.default_rng(RANDOM_SEED)

plt.style.use("seaborn-v0_8-whitegrid")
plt.rcParams["figure.dpi"] = 130
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 140)
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
    "project_name": "Pilot V1 single-tower telecom fragility under wind",
    "tower_class": "self-supporting steel lattice telecommunication tower",
    "structural_height_m": 48.0,
    "total_height_including_tip_m": 51.0,
    "section_split_m": {
        "lower_inclined": 24.0,
        "upper_straight": 24.0,
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
    "wind_directions_deg": [0.0],
    "simulations_per_stripe": 12,
    "damage_state": "collapse only",
    "uncertainty_settings": {
        "wind_load_multiplier": {
            "distribution": "lognormal",
            "mean": 1.0,
            "cov": 0.20,
        },
        "capacity_multiplier": {
            "distribution": "lognormal",
            "mean": 1.0,
            "cov": 0.15,
        },
    },
    "pilot_surrogate_settings": {
        "reference_collapse_speed_mps": 38.0,
        "reference_capacity_index": 1.0,
        "height_demand_exponent": 1.15,
        "height_capacity_exponent": 0.20,
        "future_direction_sensitivity": 0.10,
    },
    "random_seed": RANDOM_SEED,
}


def validate_assumptions(assumptions_dict: dict) -> None:
    """Validate the main model settings."""
    structural_height = float(assumptions_dict["structural_height_m"])
    total_height = float(assumptions_dict["total_height_including_tip_m"])
    lower_height = float(assumptions_dict["section_split_m"]["lower_inclined"])
    upper_height = float(assumptions_dict["section_split_m"]["upper_straight"])
    stripe_speeds = np.asarray(assumptions_dict["stripe_analysis"]["wind_speeds_mps"], dtype=float)

    if structural_height <= 0:
        raise ValueError("Structural height must be positive.")
    if total_height < structural_height:
        raise ValueError("Total height must be at least the structural height.")
    if not np.isclose(lower_height + upper_height, structural_height):
        raise ValueError("Lower and upper heights must sum to the structural height.")
    if stripe_speeds.size == 0 or np.any(stripe_speeds <= 0):
        raise ValueError("Wind-speed stripes must be positive and non-empty.")
    if assumptions_dict["simulations_per_stripe"] <= 0:
        raise ValueError("Simulations per stripe must be positive.")


def lognormal_parameters_from_mean_cov(mean_value: float, cov_value: float) -> tuple[float, float]:
    """Convert target lognormal mean and COV to log-space parameters."""
    if mean_value <= 0:
        raise ValueError("Lognormal mean must be positive.")
    if cov_value < 0:
        raise ValueError("Lognormal COV cannot be negative.")

    sigma_ln = np.sqrt(np.log(1.0 + cov_value**2))
    mu_ln = np.log(mean_value) - 0.5 * sigma_ln**2
    return float(mu_ln), float(sigma_ln)


def sample_lognormal_multiplier(
    mean_value: float,
    cov_value: float,
    sample_size: int,
    random_generator: np.random.Generator,
) -> np.ndarray:
    """Draw positive uncertainty multipliers from a lognormal distribution."""
    if sample_size <= 0:
        raise ValueError("Sample size must be positive.")

    mu_ln, sigma_ln = lognormal_parameters_from_mean_cov(mean_value, cov_value)
    return np.asarray(
        random_generator.lognormal(mean=mu_ln, sigma=sigma_ln, size=sample_size),
        dtype=float,
    )


def compute_direction_factor(direction_deg: float) -> float:
    """Return a small direction modifier for future model expansion."""
    sensitivity = ASSUMPTIONS["pilot_surrogate_settings"]["future_direction_sensitivity"]
    return float(1.0 + sensitivity * np.sin(np.deg2rad(direction_deg)) ** 2)


def compute_base_wind_effect(wind_speed_mps: float, tower_height_m: float, direction_deg: float = 0.0) -> float:
    """Compute a dimensionless wind-demand index."""
    if wind_speed_mps <= 0 or tower_height_m <= 0:
        raise ValueError("Wind speed and tower height must be positive.")

    dynamic_pressure = 0.613 * wind_speed_mps**2
    reference_speed = ASSUMPTIONS["pilot_surrogate_settings"]["reference_collapse_speed_mps"]
    reference_dynamic_pressure = 0.613 * reference_speed**2

    height_factor = (tower_height_m / 48.0) ** ASSUMPTIONS["pilot_surrogate_settings"]["height_demand_exponent"]
    direction_factor = compute_direction_factor(direction_deg)

    return float((dynamic_pressure / reference_dynamic_pressure) * height_factor * direction_factor)


def compute_base_capacity(tower_height_m: float) -> float:
    """Compute a dimensionless capacity index."""
    if tower_height_m <= 0:
        raise ValueError("Tower height must be positive.")

    reference_capacity = ASSUMPTIONS["pilot_surrogate_settings"]["reference_capacity_index"]
    height_capacity_exponent = ASSUMPTIONS["pilot_surrogate_settings"]["height_capacity_exponent"]
    return float(reference_capacity * (48.0 / tower_height_m) ** height_capacity_exponent)


def evaluate_collapse_response(
    wind_speed_mps: float,
    tower_height_m: float,
    wind_multiplier: float,
    capacity_multiplier: float,
    direction_deg: float = 0.0,
) -> dict:
    """Evaluate one demand-capacity simulation."""
    if wind_multiplier <= 0 or capacity_multiplier <= 0:
        raise ValueError("Uncertainty multipliers must be positive.")

    base_wind_effect = compute_base_wind_effect(wind_speed_mps, tower_height_m, direction_deg)
    base_capacity = compute_base_capacity(tower_height_m)
    demand = base_wind_effect * wind_multiplier
    capacity = base_capacity * capacity_multiplier

    return {
        "base_wind_effect": float(base_wind_effect),
        "base_capacity": float(base_capacity),
        "demand": float(demand),
        "capacity": float(capacity),
        "collapse": bool(demand > capacity),
    }


def lognormal_fragility_probability(wind_speed_mps: np.ndarray, theta: float, beta: float) -> np.ndarray:
    """Return fragility probabilities from a lognormal CDF."""
    wind_speed_mps = np.asarray(wind_speed_mps, dtype=float)
    if theta <= 0 or beta <= 0 or np.any(wind_speed_mps <= 0):
        raise ValueError("Theta, beta, and wind speeds must be positive.")

    standardized_value = (np.log(wind_speed_mps) - np.log(theta)) / beta
    return np.clip(norm.cdf(standardized_value), 1e-10, 1.0 - 1e-10)


def negative_log_likelihood(log_parameters: np.ndarray, wind_speeds: np.ndarray, failures: np.ndarray, totals: np.ndarray) -> float:
    """Binomial negative log-likelihood for stripe-based fragility fitting."""
    theta = np.exp(log_parameters[0])
    beta = np.exp(log_parameters[1])
    probabilities = lognormal_fragility_probability(wind_speeds, theta, beta)
    log_likelihood_terms = failures * np.log(probabilities) + (totals - failures) * np.log(1.0 - probabilities)
    return float(-np.sum(log_likelihood_terms))


def run_stripe_analysis() -> tuple[pd.DataFrame, dict]:
    """Run the full stripe analysis and fit one fragility curve."""
    validate_assumptions(ASSUMPTIONS)

    tower_height_m = ASSUMPTIONS["structural_height_m"]
    wind_speeds_mps = ASSUMPTIONS["stripe_analysis"]["wind_speeds_mps"]
    direction_deg = ASSUMPTIONS["wind_directions_deg"][0]
    simulations_per_stripe = ASSUMPTIONS["simulations_per_stripe"]

    stripe_records = []

    for wind_speed_mps in wind_speeds_mps:
        wind_multipliers = sample_lognormal_multiplier(
            ASSUMPTIONS["uncertainty_settings"]["wind_load_multiplier"]["mean"],
            ASSUMPTIONS["uncertainty_settings"]["wind_load_multiplier"]["cov"],
            simulations_per_stripe,
            rng,
        )
        capacity_multipliers = sample_lognormal_multiplier(
            ASSUMPTIONS["uncertainty_settings"]["capacity_multiplier"]["mean"],
            ASSUMPTIONS["uncertainty_settings"]["capacity_multiplier"]["cov"],
            simulations_per_stripe,
            rng,
        )

        demand_values = []
        capacity_values = []
        collapse_flags = []

        for wind_multiplier, capacity_multiplier in zip(wind_multipliers, capacity_multipliers):
            response = evaluate_collapse_response(
                wind_speed_mps,
                tower_height_m,
                wind_multiplier,
                capacity_multiplier,
                direction_deg,
            )
            demand_values.append(response["demand"])
            capacity_values.append(response["capacity"])
            collapse_flags.append(int(response["collapse"]))

        failure_count = int(np.sum(collapse_flags))
        stripe_records.append(
            {
                "direction_deg": float(direction_deg),
                "wind_speed_mps": float(wind_speed_mps),
                "simulations_in_stripe": int(simulations_per_stripe),
                "failure_count": failure_count,
                "observed_collapse_probability": failure_count / simulations_per_stripe,
                "mean_demand": float(np.mean(demand_values)),
                "mean_capacity": float(np.mean(capacity_values)),
            }
        )

    stripe_results_df = pd.DataFrame(stripe_records)

    wind_speeds_for_fit = stripe_results_df["wind_speed_mps"].to_numpy(dtype=float)
    failures_for_fit = stripe_results_df["failure_count"].to_numpy(dtype=float)
    totals_for_fit = stripe_results_df["simulations_in_stripe"].to_numpy(dtype=float)
    observed_probabilities = stripe_results_df["observed_collapse_probability"].to_numpy(dtype=float)

    crossing_indices = np.where(observed_probabilities >= 0.5)[0]
    theta_initial = float(wind_speeds_for_fit[crossing_indices[0]]) if crossing_indices.size > 0 else float(np.median(wind_speeds_for_fit))
    beta_initial = 0.25

    optimization_result = minimize(
        fun=negative_log_likelihood,
        x0=np.log([theta_initial, beta_initial]),
        args=(wind_speeds_for_fit, failures_for_fit, totals_for_fit),
        method="L-BFGS-B",
        bounds=[(np.log(1.0), np.log(200.0)), (np.log(0.05), np.log(2.0))],
    )

    if not optimization_result.success:
        raise RuntimeError(f"Fragility fitting failed: {optimization_result.message}")

    fit_summary = {
        "theta_mps": float(np.exp(optimization_result.x[0])),
        "beta": float(np.exp(optimization_result.x[1])),
        "optimization_success": bool(optimization_result.success),
        "negative_log_likelihood": float(optimization_result.fun),
        "intensity_measure": ASSUMPTIONS["intensity_measure"]["name"],
        "damage_state": ASSUMPTIONS["damage_state"],
    }

    stripe_results_df["fitted_collapse_probability"] = lognormal_fragility_probability(
        stripe_results_df["wind_speed_mps"].to_numpy(dtype=float),
        fit_summary["theta_mps"],
        fit_summary["beta"],
    )

    return stripe_results_df, fit_summary


def save_outputs(stripe_results_df: pd.DataFrame, fit_summary: dict) -> Path:
    """Save CSV, JSON, and plot outputs."""
    repo_root = Path(__file__).resolve().parents[1]
    output_folder = repo_root / "outputs" / "v1"
    output_folder.mkdir(parents=True, exist_ok=True)

    with (output_folder / "assumptions.json").open("w", encoding="utf-8") as file:
        json.dump(ASSUMPTIONS, file, indent=4)
    stripe_results_df.to_csv(output_folder / "stripe_results.csv", index=False)
    with (output_folder / "fragility_summary.json").open("w", encoding="utf-8") as file:
        json.dump(fit_summary, file, indent=4)

    smooth_wind_speeds_mps = np.linspace(
        float(stripe_results_df["wind_speed_mps"].min()),
        float(stripe_results_df["wind_speed_mps"].max()),
        300,
    )
    smooth_fitted_probabilities = lognormal_fragility_probability(
        smooth_wind_speeds_mps,
        fit_summary["theta_mps"],
        fit_summary["beta"],
    )

    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    ax.scatter(
        stripe_results_df["wind_speed_mps"],
        stripe_results_df["observed_collapse_probability"],
        color="black",
        s=65,
        label="Observed stripe collapse probability",
        zorder=3,
    )
    ax.plot(
        smooth_wind_speeds_mps,
        smooth_fitted_probabilities,
        color="tab:red",
        linewidth=2.5,
        label="Fitted lognormal fragility curve",
    )
    ax.axvline(
        fit_summary["theta_mps"],
        color="tab:blue",
        linestyle="--",
        linewidth=1.5,
        label=f"Theta = {fit_summary['theta_mps']:.2f} m/s",
    )
    ax.set_xlabel("10-minute mean wind speed, V (m/s)")
    ax.set_ylabel("Probability of collapse")
    ax.set_title("Pilot V1 fragility curve for a 48 m telecom tower under wind")
    ax.set_ylim(-0.02, 1.02)
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(output_folder / "fragility_curve.png", bbox_inches="tight")
    plt.close(fig)

    return output_folder


def main() -> None:
    """Run the complete Pilot V1 workflow."""
    stripe_results_df, fit_summary = run_stripe_analysis()
    output_folder = save_outputs(stripe_results_df, fit_summary)

    print("Pilot V1 complete")
    print(f"Theta: {fit_summary['theta_mps']:.2f} m/s")
    print(f"Beta: {fit_summary['beta']:.3f}")
    print(f"Outputs saved in: {output_folder}")


if __name__ == "__main__":
    main()
