import { type DesignCheckSummary } from "@/lib/designChecks";
import { type FragilityResult } from "@/lib/fragility";
import { type TowerConfig } from "@/lib/tower";

export function buildDesignNarrative({
  config,
  checks,
  fragility
}: {
  config: TowerConfig;
  checks: DesignCheckSummary;
  fragility: FragilityResult;
}): string {
  const baseRatio = config.heightMeters / config.bottomWidthMeters;
  const collapsePct = (fragility.designProbabilities.Collapse * 100).toFixed(
    fragility.designProbabilities.Collapse < 0.1 ? 1 : 0
  );
  const collapseMedianMph = (
    fragility.parameters.find((p) => p.damageState === "Collapse")?.medianMps ??
    0
  ) / 0.44704;

  const totalChecks =
    checks.counts.pass + checks.counts.close + checks.counts.exceeds;
  const passPct =
    totalChecks > 0 ? Math.round((checks.counts.pass / totalChecks) * 100) : 100;

  const worst = checks.worstItems[0];
  const governing = worst
    ? `The governing check is the ${worst.elementType.toLowerCase()} in panel ${worst.panelNumber} (${worst.section}), at KL/r ≈ ${worst.result.klr.toFixed(
        0
      )} against a limit of ${worst.result.limit}.`
    : "No single member dominates the slenderness picture.";

  const riskOutlook =
    fragility.designProbabilities.Collapse > 0.1
      ? "This is a notable level of risk for a critical communication asset and would warrant strengthening before construction."
      : fragility.designProbabilities.Collapse > 0.03
      ? "This is a modest level of risk that is reasonable for a preliminary study but could be reduced with a wider base."
      : "This is a low level of risk, meaning the tower has comfortable margin above the design wind.";

  return (
    `This is a ${config.heightMeters}-meter tapered, square-plan lattice tower with ${config.panelCount} stacked panels. ` +
    `It widens from a ${config.topWidthMeters.toFixed(1)} m top face to a ${config.bottomWidthMeters.toFixed(
      1
    )} m base — a height-to-base ratio of about ${baseRatio.toFixed(0)} to 1. ` +
    `That taper concentrates structural material low down, where wind forces create the largest overturning effect, which is why lattice towers are shaped this way. ` +
    `The structure uses ${config.bracing} bracing to triangulate each face and carry shear. ` +
    `Against the design wind of ${config.windSpeedMph} mph (Exposure ${config.exposure}, Risk Category ${config.riskCategory}), ` +
    `${passPct}% of the representative member checks pass their slenderness limits. ${governing} ` +
    `The fragility model places the collapse-wind median near ${collapseMedianMph.toFixed(
      0
    )} mph, so the estimated chance of collapse at the design wind is about ${collapsePct}%. ${riskOutlook} ` +
    `These figures are preliminary screening values for research visualization only — not a stamped structural design.`
  );
}
