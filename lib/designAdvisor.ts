import { type DesignCheckSummary } from "@/lib/designChecks";
import { type FragilityResult } from "@/lib/fragility";
import { type MaterialEstimate } from "@/lib/materialQuantity";
import { ANGLE_SECTIONS, type TowerConfig } from "@/lib/tower";

export type AdvisorSeverity = "critical" | "warning" | "ok";

export interface AdvisorRecommendation {
  id: string;
  severity: AdvisorSeverity;
  title: string;
  explanation: string;
  suggestion?: string;
}

export interface DesignHealth {
  score: number;
  label: string;
  color: string;
  slendernessPassRate: number;
  collapseProbability: number;
  proportioningScore: number;
  efficiencyScore: number;
  recommendations: AdvisorRecommendation[];
}

const LEG_LIMIT = 150;

function severityRank(severity: AdvisorSeverity) {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Strong", color: "#22c55e" };
  if (score >= 60) return { label: "Acceptable", color: "#84cc16" };
  if (score >= 40) return { label: "Marginal", color: "#f59e0b" };
  return { label: "At Risk", color: "#ef4444" };
}

/**
 * Find the next-larger angle section (by r_min) relative to a given r_min,
 * used to suggest concrete upgrades for over-slender members.
 */
function nextLargerSection(currentRminMm: number): string | null {
  const larger = ANGLE_SECTIONS.filter((s) => s.r_min_mm > currentRminMm).sort(
    (a, b) => a.r_min_mm - b.r_min_mm
  )[0];
  return larger ? larger.label : null;
}

export function computeDesignHealth({
  config,
  checks,
  fragility,
  material
}: {
  config: TowerConfig;
  checks: DesignCheckSummary;
  fragility: FragilityResult;
  material: MaterialEstimate;
}): DesignHealth {
  const recommendations: AdvisorRecommendation[] = [];

  const totalChecks =
    checks.counts.pass + checks.counts.close + checks.counts.exceeds;
  const slendernessPassRate =
    totalChecks > 0 ? checks.counts.pass / totalChecks : 1;

  const collapseProbability = fragility.designProbabilities.Collapse;

  // Proportioning: base/height should sit in the 1/8 - 1/12 band.
  const baseRatio = config.bottomWidthMeters / config.heightMeters;
  const idealLow = 1 / 12;
  const idealHigh = 1 / 8;
  let proportioningScore = 1;
  if (baseRatio < idealLow) {
    proportioningScore = Math.max(0, baseRatio / idealLow);
  } else if (baseRatio > idealHigh) {
    proportioningScore = Math.max(0, 1 - (baseRatio - idealHigh) / idealHigh);
  }

  // Material efficiency: steel mass per meter of height, lower is leaner.
  // Reference band ~ 250 kg/m for a typical lattice tower of this scale.
  const massPerMeter = material.totalMassKg / config.heightMeters;
  const efficiencyScore = Math.max(
    0,
    Math.min(1, 1 - (massPerMeter - 150) / 350)
  );

  // ---- Recommendation 1: over-slender legs ----
  const worstLeg = checks.items
    .filter((item) => item.elementType === "Leg")
    .sort((a, b) => b.result.klr - a.result.klr)[0];

  if (worstLeg && worstLeg.result.klr > LEG_LIMIT) {
    const upgrade = nextLargerSection(worstLeg.result.radiusMm);
    // Base width needed to bring KL/r under limit, holding r constant:
    // length scales roughly with base width; suggest a wider base.
    const suggestedBase = Number(
      (config.bottomWidthMeters * (LEG_LIMIT / worstLeg.result.klr)).toFixed(1)
    );
    recommendations.push({
      id: "leg-slenderness",
      severity: "critical",
      title: `Panel ${worstLeg.panelNumber} legs are over-slender (KL/r = ${worstLeg.result.klr.toFixed(
        0
      )} > ${LEG_LIMIT})`,
      explanation:
        "Leg slenderness exceeds the ASCE 10-15 §3.4 compression limit of 150, risking buckling under wind load.",
      suggestion: upgrade
        ? `Upgrade the ${worstLeg.section} leg to ${upgrade}, or widen the base toward ${suggestedBase} m to shorten effective lengths.`
        : `Widen the base toward ${suggestedBase} m to bring KL/r under 150.`
    });
  } else if (checks.counts.exceeds > 0) {
    recommendations.push({
      id: "bracing-slenderness",
      severity: "warning",
      title: `${checks.counts.exceeds} member group(s) exceed their slenderness limit`,
      explanation:
        "One or more bracing or horizontal members exceed their KL/r limit. These should be upsized or have intermediate supports added.",
      suggestion: "Upgrade the flagged sections one size larger or add redundant bracing."
    });
  } else {
    recommendations.push({
      id: "slenderness-ok",
      severity: "ok",
      title: "All members pass slenderness screening",
      explanation: `All ${totalChecks} representative member checks are within their ASCE 10-15 §3.4 KL/r limits.`
    });
  }

  // ---- Recommendation 2: collapse risk ----
  if (collapseProbability > 0.1) {
    recommendations.push({
      id: "collapse-risk",
      severity: "critical",
      title: `High collapse risk at design wind (P = ${(collapseProbability * 100).toFixed(
        0
      )}%)`,
      explanation:
        "The probability of collapse at the selected design wind speed exceeds 10%, which is high for a critical communication asset.",
      suggestion:
        "Reduce height, widen the base, or keep the more efficient Double K/K-B bracing to raise the collapse-wind median."
    });
  } else if (collapseProbability > 0.03) {
    recommendations.push({
      id: "collapse-moderate",
      severity: "warning",
      title: `Moderate collapse risk (P = ${(collapseProbability * 100).toFixed(1)}%)`,
      explanation:
        "Collapse probability is non-trivial. Acceptable for a pilot study but worth reducing before finalizing.",
      suggestion: "A modest base-width increase typically lowers this below 3%."
    });
  } else {
    recommendations.push({
      id: "collapse-ok",
      severity: "ok",
      title: `Low collapse risk (P = ${(collapseProbability * 100).toFixed(2)}%)`,
      explanation:
        "The collapse-wind median sits comfortably above the selected design wind speed."
    });
  }

  // ---- Recommendation 3: proportioning ----
  if (proportioningScore < 0.8) {
    const targetBase = Number((config.heightMeters / 10).toFixed(1));
    recommendations.push({
      id: "proportioning",
      severity: baseRatio < idealLow ? "warning" : "ok",
      title:
        baseRatio < idealLow
          ? `Base looks narrow (H/${(1 / baseRatio).toFixed(0)})`
          : `Base looks wide (H/${(1 / baseRatio).toFixed(0)})`,
      explanation:
        "Self-supporting lattice towers typically use a base-to-height ratio between 1/8 and 1/12. The current proportion is outside that band.",
      suggestion: `Consider a base width near ${targetBase} m (about H/10) for balanced stiffness and material use.`
    });
  }

  // ---- Recommendation 4: top width / antenna mounting ----
  if (config.topWidthMeters < 1.0) {
    recommendations.push({
      id: "top-width",
      severity: "warning",
      title: `Top width (${config.topWidthMeters.toFixed(1)} m) is tight for antenna mounting`,
      explanation:
        "A top face narrower than ~1.0 m leaves limited room for mounting panel antennas and dishes with standoff clearance.",
      suggestion: "Increase top width toward 1.0-1.2 m if appurtenance mounting is required."
    });
  }

  // ---- Recommendation 5: material efficiency ----
  if (efficiencyScore < 0.4 && slendernessPassRate >= 0.95) {
    recommendations.push({
      id: "efficiency",
      severity: "ok",
      title: `Design is heavy (${massPerMeter.toFixed(0)} kg/m)`,
      explanation:
        "Members pass comfortably, suggesting there may be room to lighten the structure without compromising safety.",
      suggestion: "Auto-Optimize can search for a leaner base width with equal pass rates."
    });
  }

  // ---- Weighted health score ----
  const score = Math.round(
    100 *
      (0.4 * slendernessPassRate +
        0.35 * (1 - Math.min(1, collapseProbability * 4)) +
        0.15 * proportioningScore +
        0.1 * efficiencyScore)
  );

  const { label, color } = scoreLabel(score);

  return {
    score,
    label,
    color,
    slendernessPassRate,
    collapseProbability,
    proportioningScore,
    efficiencyScore,
    recommendations: recommendations.sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity)
    )
  };
}
