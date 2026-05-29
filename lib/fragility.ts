import { milesPerHourToMetersPerSecond } from "@/lib/wind";
import { type DesignCheckSummary } from "@/lib/designChecks";
import { type TowerConfig } from "@/lib/tower";

export type DamageState = "Slight" | "Moderate" | "Extensive" | "Collapse";

export interface FragilityParameters {
  damageState: DamageState;
  medianMps: number;
  beta: number;
  color: string;
  description: string;
}

export interface FragilityCurvePoint {
  windSpeedMps: number;
  windSpeedMph: number;
  probabilities: Record<DamageState, number>;
}

export interface FragilityResult {
  parameters: FragilityParameters[];
  curve: FragilityCurvePoint[];
  designWindSpeedMps: number;
  designWindSpeedMph: number;
  designProbabilities: Record<DamageState, number>;
  referenceParameters: FragilityParameters[];
}

// Standard normal CDF via abramowitz & stegun approximation
function normalCdf(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.319381530;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;
  const t = 1 / (1 + p * Math.abs(x));
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const pdf = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * poly;
  return x >= 0 ? cdf : 1 - cdf;
}

export function fragilityCdf(windSpeedMps: number, medianMps: number, beta: number): number {
  if (windSpeedMps <= 0) return 0;
  if (medianMps <= 0 || beta <= 0) return 0;
  const z = Math.log(windSpeedMps / medianMps) / beta;
  return normalCdf(z);
}

// Bilionis & Vamvatsikos 2019 baseline: 48 m good-condition tower
// Collapse median ≈ 42 m/s, β ≈ 0.26 (Exposure C, square lattice)
const BASELINE_COLLAPSE_MPS = 42.0;
const BASELINE_HEIGHT_M = 48;

// Bracing efficiency relative modifiers (from Khazaali dissertation §4.5)
const BRACING_FACTOR: Record<string, number> = {
  "Double K/K-B": 1.10,  // most efficient in the bracing study
  "K-Down": 0.90
};

// Relative damage state medians (as fraction of collapse median)
const DS_RATIOS: Record<DamageState, number> = {
  Slight:    0.55,
  Moderate:  0.70,
  Extensive: 0.87,
  Collapse:  1.00
};

const DS_BETAS: Record<DamageState, number> = {
  Slight:    0.35,
  Moderate:  0.30,
  Extensive: 0.27,
  Collapse:  0.25
};

const DS_COLORS: Record<DamageState, string> = {
  Slight:    "#22c55e",
  Moderate:  "#f59e0b",
  Extensive: "#f97316",
  Collapse:  "#ef4444"
};

const DS_DESCRIPTIONS: Record<DamageState, string> = {
  Slight:    "Minor deformation of secondary members, no loss of function",
  Moderate:  "Yielding of primary bracing, significant lateral displacement",
  Extensive: "Partial structural failure, major repairs required",
  Collapse:  "Full or partial tower collapse, total loss of function"
};

function deriveCollapseMedian(config: TowerConfig, checks: DesignCheckSummary): number {
  // Height scaling: taller towers have slightly lower median capacity
  // Based on H^(-0.12) power law consistent with Rasool et al. 2022 height series
  const heightFactor = Math.pow(BASELINE_HEIGHT_M / config.heightMeters, 0.12);

  // Bracing factor from literature
  const bracingFactor = BRACING_FACTOR[config.bracing] ?? 1.0;

  // KL/r penalty: if worst utilization > 0.8 of limit, reduce median
  // This connects the structural slenderness to collapse capacity
  const worstUtil = Math.max(...checks.panels.map(p => p.worstUtilization), 0.1);
  const slendernessFactor = worstUtil > 0.8
    ? Math.max(0.6, 1.0 - 0.15 * Math.min((worstUtil - 0.8) / 0.2, 1)) // up to 15% reduction, floored
    : 1.0 + 0.05 * (0.8 - worstUtil);           // up to 5% bonus for well-proportioned

  // Appurtenances increase wind drag → lower effective capacity
  const appFactor = config.appurtenances ? 0.94 : 1.0;

  // Exposure: open terrain (C/D) sees higher wind pressure → capacity relative to design speed is lower
  const exposureFactor = config.exposure === "D" ? 0.96 : config.exposure === "B" ? 1.04 : 1.0;

  return BASELINE_COLLAPSE_MPS * heightFactor * bracingFactor * slendernessFactor * appFactor * exposureFactor;
}

export function computeFragility(config: TowerConfig, checks: DesignCheckSummary): FragilityResult {
  const collapseMedianMps = deriveCollapseMedian(config, checks);

  const parameters: FragilityParameters[] = (
    ["Slight", "Moderate", "Extensive", "Collapse"] as DamageState[]
  ).map((ds) => ({
    damageState: ds,
    medianMps: collapseMedianMps * DS_RATIOS[ds],
    beta: DS_BETAS[ds],
    color: DS_COLORS[ds],
    description: DS_DESCRIPTIONS[ds]
  }));

  // Reference parameters (Bilionis & Vamvatsikos 2019, 48m good condition)
  const referenceParameters: FragilityParameters[] = (
    ["Slight", "Moderate", "Extensive", "Collapse"] as DamageState[]
  ).map((ds) => ({
    damageState: ds,
    medianMps: BASELINE_COLLAPSE_MPS * DS_RATIOS[ds],
    beta: DS_BETAS[ds],
    color: DS_COLORS[ds],
    description: DS_DESCRIPTIONS[ds]
  }));

  // Build curve: 0 to 80 m/s in 0.5 m/s increments
  const curve: FragilityCurvePoint[] = [];
  for (let vMps = 0; vMps <= 80; vMps += 0.5) {
    const point: FragilityCurvePoint = {
      windSpeedMps: vMps,
      windSpeedMph: vMps / 0.44704,
      probabilities: {} as Record<DamageState, number>
    };
    for (const param of parameters) {
      point.probabilities[param.damageState] = fragilityCdf(vMps, param.medianMps, param.beta);
    }
    curve.push(point);
  }

  const designWindSpeedMps = milesPerHourToMetersPerSecond(config.windSpeedMph);
  const designProbabilities: Record<DamageState, number> = {} as Record<DamageState, number>;
  for (const param of parameters) {
    designProbabilities[param.damageState] = fragilityCdf(designWindSpeedMps, param.medianMps, param.beta);
  }

  return {
    parameters,
    curve,
    designWindSpeedMps,
    designWindSpeedMph: config.windSpeedMph,
    designProbabilities,
    referenceParameters
  };
}
