import { calculateDesignChecks } from "@/lib/designChecks";
import { computeDesignHealth } from "@/lib/designAdvisor";
import { calculateAllPanelLengths } from "@/lib/elementLengths";
import { computeFragility } from "@/lib/fragility";
import { calculateMaterialEstimate } from "@/lib/materialQuantity";
import { buildPanelMemberProfiles, type TowerConfig } from "@/lib/tower";

export type SensitivityParameter = "windSpeedMph" | "bottomWidthMeters" | "heightMeters";

export interface SensitivityPoint {
  value: number;
  label: string;
  collapseProbability: number;
  healthScore: number;
  isCurrent: boolean;
}

export interface SensitivityResult {
  parameter: SensitivityParameter;
  parameterLabel: string;
  unit: string;
  points: SensitivityPoint[];
}

const PARAM_META: Record<
  SensitivityParameter,
  { label: string; unit: string }
> = {
  windSpeedMph: { label: "Wind speed", unit: "mph" },
  bottomWidthMeters: { label: "Base width", unit: "m" },
  heightMeters: { label: "Height", unit: "m" }
};

function rangeFor(parameter: SensitivityParameter, config: TowerConfig): number[] {
  if (parameter === "windSpeedMph") {
    return [85, 95, 105, 115, 125, 135, 145, 160];
  }
  if (parameter === "bottomWidthMeters") {
    const lo = config.heightMeters / 14;
    const hi = config.heightMeters / 8;
    return Array.from({ length: 8 }, (_, i) =>
      Number((lo + ((hi - lo) * i) / 7).toFixed(1))
    );
  }
  // heightMeters: discrete supported set near the current value
  return [40, 48, 50, 60, 80];
}

function evaluateAt(config: TowerConfig): { collapse: number; health: number } {
  const panels = calculateAllPanelLengths(
    config.heightMeters,
    config.panelCount,
    config.bottomWidthMeters,
    config.topWidthMeters,
    config.bracing
  );
  const memberProfiles = buildPanelMemberProfiles(config.panelCount);
  const checks = calculateDesignChecks({ config, panels, memberProfiles });
  const fragility = computeFragility(config, checks);
  const material = calculateMaterialEstimate(panels, memberProfiles);
  const health = computeDesignHealth({ config, checks, fragility, material });
  return {
    collapse: fragility.designProbabilities.Collapse,
    health: health.score
  };
}

export function computeSensitivity(
  config: TowerConfig,
  parameter: SensitivityParameter
): SensitivityResult {
  const meta = PARAM_META[parameter];
  const values = rangeFor(parameter, config);
  const currentValue = config[parameter] as number;

  const points: SensitivityPoint[] = values.map((value) => {
    const variantConfig: TowerConfig = { ...config, [parameter]: value };
    const { collapse, health } = evaluateAt(variantConfig);
    return {
      value,
      label: `${value}${meta.unit === "mph" ? "" : ""}`,
      collapseProbability: collapse,
      healthScore: health,
      isCurrent: Math.abs(value - currentValue) < 0.05
    };
  });

  return {
    parameter,
    parameterLabel: meta.label,
    unit: meta.unit,
    points
  };
}
