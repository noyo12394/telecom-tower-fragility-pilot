import { calculateDesignChecks } from "@/lib/designChecks";
import { calculateAllPanelLengths } from "@/lib/elementLengths";
import { computeFragility } from "@/lib/fragility";
import { calculateMaterialEstimate } from "@/lib/materialQuantity";
import {
  buildPanelMemberProfiles,
  type BracingOption,
  type TowerConfig
} from "@/lib/tower";

export interface OptimizationCandidate {
  config: TowerConfig;
  slendernessPassRate: number;
  collapseProbability: number;
  totalMassKg: number;
  score: number;
}

export interface OptimizationResult {
  best: OptimizationCandidate;
  baseline: OptimizationCandidate;
  improved: boolean;
  summary: string[];
  candidatesEvaluated: number;
}

const BRACING_OPTIONS: BracingOption[] = ["Double K/K-B", "K-Down"];

function evaluate(config: TowerConfig): OptimizationCandidate {
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

  const totalChecks =
    checks.counts.pass + checks.counts.close + checks.counts.exceeds;
  const slendernessPassRate =
    totalChecks > 0 ? checks.counts.pass / totalChecks : 1;
  const collapseProbability = fragility.designProbabilities.Collapse;

  // Higher is better. Pass rate and low collapse dominate; mass is a light tiebreak.
  const score =
    100 * slendernessPassRate -
    180 * collapseProbability -
    0.001 * material.totalMassKg;

  return {
    config,
    slendernessPassRate,
    collapseProbability,
    totalMassKg: material.totalMassKg,
    score
  };
}

export function optimizeDesign(current: TowerConfig): OptimizationResult {
  const baseline = evaluate(current);
  let best = baseline;
  let candidatesEvaluated = 1;

  // Sweep base width from H/14 (slender) to H/8 (stocky).
  const minBase = current.heightMeters / 14;
  const maxBase = current.heightMeters / 8;
  const steps = 13;

  for (let i = 0; i <= steps; i += 1) {
    const bottomWidthMeters = Number(
      (minBase + ((maxBase - minBase) * i) / steps).toFixed(1)
    );
    if (bottomWidthMeters <= current.topWidthMeters) continue;

    for (const bracing of BRACING_OPTIONS) {
      const candidateConfig: TowerConfig = {
        ...current,
        bottomWidthMeters,
        bracing
      };
      const candidate = evaluate(candidateConfig);
      candidatesEvaluated += 1;
      if (candidate.score > best.score) {
        best = candidate;
      }
    }
  }

  const improved =
    best.config.bottomWidthMeters !== current.bottomWidthMeters ||
    best.config.bracing !== current.bracing;

  const summary: string[] = [];
  if (best.config.bottomWidthMeters !== current.bottomWidthMeters) {
    summary.push(
      `Base width ${current.bottomWidthMeters.toFixed(1)} → ${best.config.bottomWidthMeters.toFixed(
        1
      )} m`
    );
  }
  if (best.config.bracing !== current.bracing) {
    summary.push(`Bracing ${current.bracing} → ${best.config.bracing}`);
  }
  if (Math.abs(best.collapseProbability - baseline.collapseProbability) > 0.005) {
    summary.push(
      `Collapse risk ${(baseline.collapseProbability * 100).toFixed(0)}% → ${(
        best.collapseProbability * 100
      ).toFixed(0)}%`
    );
  }
  if (best.slendernessPassRate > baseline.slendernessPassRate + 0.001) {
    summary.push(
      `Slenderness pass rate ${(baseline.slendernessPassRate * 100).toFixed(0)}% → ${(
        best.slendernessPassRate * 100
      ).toFixed(0)}%`
    );
    if (best.slendernessPassRate >= 1) {
      summary.push("All panels now pass");
    }
  }
  if (!summary.length) {
    summary.push("Current design is already near-optimal for the swept parameters.");
  }

  return {
    best,
    baseline,
    improved,
    summary,
    candidatesEvaluated
  };
}
