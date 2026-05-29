import { ANGLE_SECTIONS, type PanelMemberProfile } from "@/lib/tower";
import { type PanelElementLengths } from "@/lib/elementLengths";
import { checkSlenderness } from "@/lib/slenderness";

export type SectionBadge = "Literature Baseline" | "Updated after check" | "Derived/Assumed";

export interface DraftPanelRow {
  panelNumber: number;
  elevBottom: number;
  elevTop: number;
  legSection: string;
  legRminMm: number;
  legLength: number;
  klr: number;
  klrLimit: number;
  sigmaCreMpa: number;
  status: "pass" | "close" | "exceeds";
  badge: SectionBadge;
}

export interface DraftDesign {
  rows: DraftPanelRow[];
}

export interface UpdatedPanelRow extends DraftPanelRow {
  originalSection: string;
  upgraded: boolean;
}

export interface UpdatedDesign {
  rows: UpdatedPanelRow[];
}

export interface FinalDesignSummary {
  rows: UpdatedPanelRow[];
  totalSteelMassKg: number;
  passingCount: number;
  failingCount: number;
}

function findSection(label: string) {
  return ANGLE_SECTIONS.find((s) => s.label === label);
}

function nextHeavierSection(currentLabel: string) {
  const idx = ANGLE_SECTIONS.findIndex((s) => s.label === currentLabel);
  if (idx < 0 || idx >= ANGLE_SECTIONS.length - 1) return null;
  return ANGLE_SECTIONS[idx + 1];
}

export function generateDraftDesign(
  panels: PanelElementLengths[],
  memberProfiles: PanelMemberProfile[]
): DraftDesign {
  const rows: DraftPanelRow[] = panels.map((panel) => {
    const profile = memberProfiles.find((p) => p.panelNumber === panel.panelIndex);
    const legSection = profile?.legSection ?? "L100×100×10";
    const propertySection = profile?.legPropertySection ?? legSection;
    const section = findSection(propertySection);
    const legRminMm = section?.r_min_mm ?? 19.5;
    const result = checkSlenderness({
      lengthMeters: panel.legLength,
      sectionLabel: propertySection,
      role: "leg"
    });
    return {
      panelNumber: panel.panelIndex,
      elevBottom: panel.elevBottom,
      elevTop: panel.elevTop,
      legSection,
      legRminMm,
      legLength: panel.legLength,
      klr: result.klr,
      klrLimit: result.limit,
      sigmaCreMpa: result.sigmaCreMpa,
      status: result.status,
      badge: "Literature Baseline"
    };
  });
  return { rows };
}

export function runUpdateLoop(
  draft: DraftDesign,
  endCondition: "pin-pin" | "fixed-free" = "pin-pin"
): UpdatedDesign {
  const rows: UpdatedPanelRow[] = draft.rows.map((row) => {
    let currentSection = row.legSection;
    let upgraded = false;
    let result = checkSlenderness({
      lengthMeters: row.legLength,
      sectionLabel: currentSection,
      role: "leg",
      endCondition
    });

    while (result.status !== "pass") {
      const next = nextHeavierSection(currentSection);
      if (!next) break;
      currentSection = next.label;
      upgraded = true;
      result = checkSlenderness({
        lengthMeters: row.legLength,
        sectionLabel: currentSection,
        role: "leg",
        endCondition
      });
    }

    const updatedSection = findSection(currentSection);
    return {
      ...row,
      legSection: currentSection,
      legRminMm: updatedSection?.r_min_mm ?? row.legRminMm,
      klr: result.klr,
      sigmaCreMpa: result.sigmaCreMpa,
      status: result.status,
      originalSection: row.legSection,
      upgraded,
      badge: upgraded ? "Updated after check" : row.badge
    };
  });
  return { rows };
}

export function buildFinalSummary(
  updated: UpdatedDesign
): FinalDesignSummary {
  let totalSteelMassKg = 0;
  for (const row of updated.rows) {
    const section = findSection(row.legSection);
    const massPerMeter = section?.mass_kg_m ?? 15.1;
    totalSteelMassKg += row.legLength * 4 * massPerMeter;
  }
  return {
    rows: updated.rows,
    totalSteelMassKg,
    passingCount: updated.rows.filter((r) => r.status === "pass").length,
    failingCount: updated.rows.filter((r) => r.status === "exceeds").length
  };
}
