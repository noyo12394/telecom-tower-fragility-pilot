import {
  calculateAllPanelLengths,
  type PanelElementLengths
} from "@/lib/elementLengths";
import {
  checkSlenderness,
  type EndCondition,
  type SlendernessStatus
} from "@/lib/slenderness";
import {
  ANGLE_SECTIONS,
  angleSectionForLabel,
  buildPanelMemberProfiles,
  type PanelMemberProfile,
  type TowerConfig
} from "@/lib/tower";
import { type DesignCheckSummary } from "@/lib/designChecks";

export type WorkflowBadge =
  | "Literature Baseline"
  | "Updated after check"
  | "Derived/Assumed";

export interface DraftDesignRow {
  panelNumber: number;
  legSection: string;
  diagonalSection: string;
  horizontalSection: string;
  legLengthMeters: number;
  diagonalLengthMeters: number;
  horizontalLengthMeters: number;
  badge: WorkflowBadge;
}

export interface DraftDesign {
  config: TowerConfig;
  panels: PanelElementLengths[];
  memberProfiles: PanelMemberProfile[];
  rows: DraftDesignRow[];
}

export interface UpdatedDesignRow extends DraftDesignRow {
  finalLegSection: string;
  status: SlendernessStatus;
}

export interface UpdatedDesign {
  config: TowerConfig;
  rows: UpdatedDesignRow[];
  endCondition: EndCondition;
}

export interface FinalDesignSummary {
  panelCount: number;
  updatedCount: number;
  passCount: number;
  closeCount: number;
  exceedCount: number;
  estimatedSteelKg: number;
  governingPanel: number | null;
}

export function generateDraftDesign(config: TowerConfig): DraftDesign {
  const panels = calculateAllPanelLengths(
    config.heightMeters,
    config.panelCount,
    config.bottomWidthMeters,
    config.topWidthMeters,
    config.bracing
  );
  const memberProfiles = buildPanelMemberProfiles(config.panelCount);

  return {
    config,
    panels,
    memberProfiles,
    rows: panels.map((panel) => {
      const member = memberProfiles.find(
        (profile) => profile.panelNumber === panel.panelIndex
      )!;

      return {
        panelNumber: panel.panelIndex,
        legSection: member.legSection,
        diagonalSection: member.diagonalSection,
        horizontalSection: member.horizontalSection,
        legLengthMeters: panel.legLength,
        diagonalLengthMeters: panel.kBraceDiag ?? 0,
        horizontalLengthMeters: panel.horizontal,
        badge: "Literature Baseline"
      };
    })
  };
}

function sectionOrderIndex(sectionLabel: string) {
  const resolved = angleSectionForLabel(sectionLabel);
  return ANGLE_SECTIONS.findIndex((section) => section.label === resolved.label);
}

function nextPassingLegSection({
  currentSection,
  lengthMeters,
  sigmaDemandMpa,
  endCondition
}: {
  currentSection: string;
  lengthMeters: number;
  sigmaDemandMpa: number;
  endCondition: EndCondition;
}) {
  const startIndex = Math.max(sectionOrderIndex(currentSection), 0);

  for (const section of ANGLE_SECTIONS.slice(startIndex)) {
    const result = checkSlenderness({
      lengthMeters,
      sectionLabel: section.label,
      role: "leg",
      endCondition,
      fyMpa: 345,
      sigmaDemandMpa
    });

    if (result.status === "pass") {
      return section.label;
    }
  }

  return ANGLE_SECTIONS[ANGLE_SECTIONS.length - 1].label;
}

export function runUpdateLoop(
  draft: DraftDesign,
  checks: DesignCheckSummary
): UpdatedDesign {
  const legChecksByPanel = new Map(
    checks.items
      .filter((item) => item.elementType === "Leg")
      .map((item) => [item.panelNumber, item])
  );

  return {
    config: draft.config,
    endCondition: checks.endCondition,
    rows: draft.rows.map((row) => {
      const legCheck = legChecksByPanel.get(row.panelNumber);

      if (!legCheck || legCheck.result.status === "pass") {
        return {
          ...row,
          finalLegSection: row.legSection,
          status: legCheck?.result.status ?? "pass",
          badge: "Literature Baseline"
        };
      }

      const finalLegSection = nextPassingLegSection({
        currentSection: row.legSection,
        lengthMeters: row.legLengthMeters,
        sigmaDemandMpa: legCheck.result.sigmaDemandMpa,
        endCondition: checks.endCondition
      });

      return {
        ...row,
        finalLegSection,
        status:
          finalLegSection === row.legSection ? legCheck.result.status : "pass",
        badge:
          finalLegSection === row.legSection
            ? "Derived/Assumed"
            : "Updated after check"
      };
    })
  };
}

export function buildFinalSummary(updated: UpdatedDesign): FinalDesignSummary {
  const draft = generateDraftDesign(updated.config);
  const rowsByPanel = new Map(
    updated.rows.map((row) => [row.panelNumber, row])
  );
  const estimatedSteelKg = draft.panels.reduce((sum, panel) => {
    const row = rowsByPanel.get(panel.panelIndex);
    const member = draft.memberProfiles.find(
      (profile) => profile.panelNumber === panel.panelIndex
    );

    if (!row || !member) {
      return sum;
    }

    const legMass = angleSectionForLabel(row.finalLegSection).mass_kg_m;
    const diagonalMass = angleSectionForLabel(member.diagonalPropertySection).mass_kg_m;
    const horizontalMass = angleSectionForLabel(
      member.horizontalPropertySection
    ).mass_kg_m;

    return (
      sum +
      panel.legLength * 4 * legMass +
      (panel.kBraceDiag ?? 0) * 8 * diagonalMass +
      (panel.subHorizontal ?? 0) * 4 * horizontalMass +
      panel.horizontal * 4 * horizontalMass +
      (panel.hipBraceDiag ?? 0) * 2 * diagonalMass
    );
  }, 0);

  return {
    panelCount: updated.rows.length,
    updatedCount: updated.rows.filter(
      (row) => row.badge === "Updated after check"
    ).length,
    passCount: updated.rows.filter((row) => row.status === "pass").length,
    closeCount: updated.rows.filter((row) => row.status === "close").length,
    exceedCount: updated.rows.filter((row) => row.status === "exceeds").length,
    estimatedSteelKg,
    governingPanel:
      updated.rows.find((row) => row.status !== "pass")?.panelNumber ?? null
  };
}
