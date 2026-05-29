import { type PanelElementLengths } from "@/lib/elementLengths";
import {
  checkSlenderness,
  type EndCondition,
  type SlendernessResult,
  type SlendernessStatus
} from "@/lib/slenderness";
import {
  angleSectionForLabel,
  type PanelMemberProfile,
  type TowerConfig
} from "@/lib/tower";

export type CheckSeverity = "info" | "caution" | "warning";

export interface DesignCheckItem {
  id: string;
  panelNumber: number;
  elementType:
    | "Leg"
    | "K-Brace"
    | "Sub-Horizontal"
    | "Horizontal Chord"
    | "Hip Brace";
  section: string;
  lengthMeters: number;
  result: SlendernessResult;
}

export interface ValidationMessage {
  id: string;
  severity: CheckSeverity;
  title: string;
  detail: string;
  source: string;
}

export interface PanelCheckSummary {
  panelNumber: number;
  passCount: number;
  closeCount: number;
  exceedCount: number;
  worstUtilization: number;
}

export interface DesignCheckSummary {
  items: DesignCheckItem[];
  counts: Record<SlendernessStatus, number>;
  worstItems: DesignCheckItem[];
  panels: PanelCheckSummary[];
  warnings: ValidationMessage[];
  worstKlr: number;
  worstPanelNumber: number | null;
  endCondition: EndCondition;
}

function severityRank(severity: CheckSeverity) {
  if (severity === "warning") {
    return 3;
  }

  if (severity === "caution") {
    return 2;
  }

  return 1;
}

function pushCheckItem(
  items: DesignCheckItem[],
  input: Omit<DesignCheckItem, "id">
) {
  items.push({
    ...input,
    id: `${input.panelNumber}-${input.elementType.toLowerCase().replace(/\s+/g, "-")}`
  });
}

function panelWindForceN(config: TowerConfig, panel: PanelElementLengths) {
  const velocityMps = config.windSpeedMph * 0.44704;
  const velocityPressurePa = 0.613 * velocityMps ** 2;
  const projectedAreaM2 =
    panel.averageWidth * panel.panelHeight * panel.solidityRatio;

  return velocityPressurePa * panel.dragCoefficient * projectedAreaM2;
}

function panelWeightN(
  panel: PanelElementLengths,
  memberProfiles: PanelMemberProfile[]
) {
  const member = memberProfiles.find(
    (profile) => profile.panelNumber === panel.panelIndex
  );

  if (!member) {
    return 0;
  }

  const legMass = angleSectionForLabel(member.legPropertySection).mass_kg_m;
  const diagonalMass = angleSectionForLabel(
    member.diagonalPropertySection
  ).mass_kg_m;
  const horizontalMass = angleSectionForLabel(
    member.horizontalPropertySection
  ).mass_kg_m;

  const totalMassKg =
    panel.legLength * 4 * legMass +
    (panel.kBraceDiag ?? 0) * 8 * diagonalMass +
    (panel.subHorizontal ?? 0) * 4 * horizontalMass +
    panel.horizontal * 4 * horizontalMass +
    (panel.hipBraceDiag ?? 0) * 2 * diagonalMass;

  return totalMassKg * 9.80665;
}

function sectionAreaMm2(sectionLabel: string) {
  return angleSectionForLabel(sectionLabel).A_mm2;
}

function estimateLegDemandMpa({
  config,
  panel,
  panels,
  memberProfiles
}: {
  config: TowerConfig;
  panel: PanelElementLengths;
  panels: PanelElementLengths[];
  memberProfiles: PanelMemberProfile[];
}) {
  const panelIndex = panels.findIndex(
    (candidate) => candidate.panelIndex === panel.panelIndex
  );
  const panelsAbove = panels.slice(Math.max(panelIndex, 0));
  const cumulativeWeightN = panelsAbove.reduce(
    (sum, candidate) => sum + panelWeightN(candidate, memberProfiles),
    0
  );
  const overturningMomentNm = panelsAbove.reduce((sum, candidate) => {
    const midpointElevation =
      (candidate.elevBottom + candidate.elevTop) / 2;

    return sum + panelWindForceN(config, candidate) * midpointElevation;
  }, 0);
  const gravityDemandN = cumulativeWeightN / 4;
  const windCoupleDemandN =
    overturningMomentNm / (2 * Math.max(panel.averageWidth, 0.25));
  const member = memberProfiles.find(
    (profile) => profile.panelNumber === panel.panelIndex
  );

  if (!member) {
    return 0;
  }

  return (gravityDemandN + windCoupleDemandN) / sectionAreaMm2(member.legPropertySection);
}

function estimateMemberDemandMpa({
  config,
  panel,
  sectionLabel,
  loadShare
}: {
  config: TowerConfig;
  panel: PanelElementLengths;
  sectionLabel: string;
  loadShare: number;
}) {
  const forceN = panelWindForceN(config, panel) / loadShare;

  return forceN / sectionAreaMm2(sectionLabel);
}

function resultUtilization(result: SlendernessResult) {
  const stressUtilization =
    result.sigmaAdmissibleMpa > 0
      ? result.sigmaDemandMpa / result.sigmaAdmissibleMpa
      : 0;
  const eulerUtilization =
    result.role === "leg" && Number.isFinite(result.sigmaCreMpa)
      ? result.sigmaDemandMpa / result.sigmaCreMpa
      : 0;
  const klrUtilization = result.role === "leg" ? result.klr / result.limit : 0;

  return Math.max(stressUtilization, eulerUtilization, klrUtilization);
}

export function calculateDesignChecks({
  config,
  panels,
  memberProfiles,
  endCondition = "pin-pin"
}: {
  config: TowerConfig;
  panels: PanelElementLengths[];
  memberProfiles: PanelMemberProfile[];
  endCondition?: EndCondition;
}): DesignCheckSummary {
  const items: DesignCheckItem[] = [];
  const warnings: ValidationMessage[] = [];

  panels.forEach((panel) => {
    const member = memberProfiles.find(
      (profile) => profile.panelNumber === panel.panelIndex
    );

    if (!member) {
      return;
    }

    pushCheckItem(items, {
      panelNumber: panel.panelIndex,
      elementType: "Leg",
      section: member.legSection,
      lengthMeters: panel.legLength,
      result: checkSlenderness({
        lengthMeters: panel.legLength,
        sectionLabel: member.legPropertySection,
        role: "leg",
        endCondition,
        fyMpa: member.legFyMpa,
        sigmaDemandMpa: estimateLegDemandMpa({
          config,
          panel,
          panels,
          memberProfiles
        })
      })
    });

    if (panel.kBraceDiag) {
      pushCheckItem(items, {
        panelNumber: panel.panelIndex,
        elementType: "K-Brace",
        section: member.diagonalSection,
        lengthMeters: panel.kBraceDiag,
        result: checkSlenderness({
          lengthMeters: panel.kBraceDiag,
          sectionLabel: member.diagonalPropertySection,
          role: "bracing",
          endCondition,
          fyMpa: member.bracingFyMpa,
          sigmaDemandMpa: estimateMemberDemandMpa({
            config,
            panel,
            sectionLabel: member.diagonalPropertySection,
            loadShare: 8
          })
        })
      });
    }

    if (panel.subHorizontal) {
      pushCheckItem(items, {
        panelNumber: panel.panelIndex,
        elementType: "Sub-Horizontal",
        section: member.horizontalSection,
        lengthMeters: panel.subHorizontal,
        result: checkSlenderness({
          lengthMeters: panel.subHorizontal,
          sectionLabel: member.horizontalPropertySection,
          role: "redundant",
          endCondition,
          fyMpa: member.bracingFyMpa,
          sigmaDemandMpa: estimateMemberDemandMpa({
            config,
            panel,
            sectionLabel: member.horizontalPropertySection,
            loadShare: 4
          })
        })
      });
    }

    pushCheckItem(items, {
      panelNumber: panel.panelIndex,
      elementType: "Horizontal Chord",
      section: member.horizontalSection,
      lengthMeters: panel.horizontal,
      result: checkSlenderness({
        lengthMeters: panel.horizontal,
        sectionLabel: member.horizontalPropertySection,
        role: "redundant",
        endCondition,
        fyMpa: member.bracingFyMpa,
        sigmaDemandMpa: estimateMemberDemandMpa({
          config,
          panel,
          sectionLabel: member.horizontalPropertySection,
          loadShare: 4
        })
      })
    });

    if (panel.hipBraceDiag) {
      pushCheckItem(items, {
        panelNumber: panel.panelIndex,
        elementType: "Hip Brace",
        section: member.diagonalSection,
        lengthMeters: panel.hipBraceDiag,
        result: checkSlenderness({
          lengthMeters: panel.hipBraceDiag,
          sectionLabel: member.diagonalPropertySection,
          role: "redundant",
          endCondition,
          fyMpa: member.bracingFyMpa,
          sigmaDemandMpa: estimateMemberDemandMpa({
            config,
            panel,
            sectionLabel: member.diagonalPropertySection,
            loadShare: 2
          })
        })
      });
    }
  });

  const counts: Record<SlendernessStatus, number> = {
    pass: items.filter((item) => item.result.status === "pass").length,
    close: items.filter((item) => item.result.status === "close").length,
    exceeds: items.filter((item) => item.result.status === "exceeds").length
  };

  const panelsSummary = panels.map((panel) => {
    const panelItems = items.filter((item) => item.panelNumber === panel.panelIndex);
    const worstUtilization = Math.max(
      ...panelItems.map((item) => resultUtilization(item.result)),
      0
    );

    return {
      panelNumber: panel.panelIndex,
      passCount: panelItems.filter((item) => item.result.status === "pass").length,
      closeCount: panelItems.filter((item) => item.result.status === "close").length,
      exceedCount: panelItems.filter((item) => item.result.status === "exceeds").length,
      worstUtilization
    };
  });

  if (config.topWidthMeters >= config.bottomWidthMeters) {
    warnings.push({
      id: "top-width",
      severity: "warning",
      title: "Top width is not smaller than base width",
      detail:
        "The current taper no longer narrows upward. This breaks the intended self-supporting tapered pilot geometry.",
      source: "Geometric consistency check"
    });
  }

  if (config.bottomWidthMeters / config.heightMeters < 0.09) {
    warnings.push({
      id: "base-ratio",
      severity: "caution",
      title: "Base width looks narrow relative to height",
      detail:
        "The current base-width-to-height ratio is below the H/11 range. That can push the pilot case toward a more slender overall configuration.",
      source: "Derived proportioning check"
    });
  }

  if (config.topWidthMeters / config.heightMeters < 0.015) {
    warnings.push({
      id: "top-ratio",
      severity: "caution",
      title: "Top width is very small relative to height",
      detail:
        "This creates a sharp taper and may overstate upper-tower slenderness in the pilot geometry.",
      source: "Derived proportioning check"
    });
  }

  if (config.heightMeters / config.panelCount > 8) {
    warnings.push({
      id: "panel-height",
      severity: "caution",
      title: "Panel height is relatively large",
      detail:
        "The selected panel count produces tall panels. That can exaggerate member lengths and reduce geometric resolution.",
      source: "Panelization check"
    });
  }

  if (config.bracing === "K-Down") {
    warnings.push({
      id: "k-down",
      severity: "info",
      title: "K-Down is being used as a comparison option",
      detail:
        "The 60 m bracing study reported higher stress concentration for K-Down than Double K/K-B. Keep it as an exploratory K-bracing option rather than a preferred default.",
      source: "60 m Bracing Study"
    });
  }

  if (config.plan === "Triangular") {
    warnings.push({
      id: "triangular-plan",
      severity: "warning",
      title: "Triangular plan is still only partially represented",
      detail:
        "The current member-length, material, and wind calculations remain square-face pilot calculations with a triangular visual toggle. A full triangular workflow would need dedicated geometry and force formulas.",
      source: "Model limitation / honesty rule"
    });
  }

  if (counts.exceeds > 0) {
    warnings.push({
      id: "slenderness-exceed",
      severity: "warning",
      title: "At least one preliminary design check exceeds its limit",
      detail:
        `${counts.exceeds} member groups currently exceed their preliminary leg buckling or admissible stress screen. These need redesign or deeper structural verification.`,
      source: "ASCE 10-15 §3.4 / §3.6 context"
    });
  } else if (counts.close / Math.max(items.length, 1) > 0.2) {
    warnings.push({
      id: "slenderness-close",
      severity: "caution",
      title: "A significant share of checks are close to limit",
      detail:
        `${counts.close} out of ${items.length} representative member checks are within 10% of their limit. This is acceptable for a pilot, but it deserves review before treating the case as stable.`,
      source: "ASCE 10-15 §3.4 / §3.6 context"
    });
  }

  const worstItems = [...items]
    .sort((left, right) => resultUtilization(right.result) - resultUtilization(left.result))
    .slice(0, 8);

  const mostCriticalPanel = [...panelsSummary].sort((left, right) => {
    if (right.exceedCount !== left.exceedCount) {
      return right.exceedCount - left.exceedCount;
    }

    if (right.closeCount !== left.closeCount) {
      return right.closeCount - left.closeCount;
    }

    return right.worstUtilization - left.worstUtilization;
  })[0];

  const worstKlr = Math.max(...items.map((item) => item.result.klr), 0);

  return {
    items,
    counts,
    worstItems,
    panels: panelsSummary,
    warnings: warnings.sort(
      (left, right) => severityRank(right.severity) - severityRank(left.severity)
    ),
    worstKlr,
    worstPanelNumber: mostCriticalPanel?.panelNumber ?? null,
    endCondition
  };
}
