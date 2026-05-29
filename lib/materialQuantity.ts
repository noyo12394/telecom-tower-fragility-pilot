import { type PanelElementLengths } from "@/lib/elementLengths";
import { type PanelMemberProfile } from "@/lib/tower";
import { resolvePropertySection } from "@/lib/slenderness";

export const unitWeightsKgPerM: Record<string, number> = {
  "L80×80×8": 9.63,
  "L100×100×10": 15.1,
  "L120×120×12": 21.9,
  "L140×140×13": 27.4,
  "L160×160×15": 36.8,
  "L45×45×5": 3.38,
  "L50×50×5": 3.77,
  "L60×60×5": 4.57,
  "L65×65×5": 4.97,
  "L70×70×6": 6.38,
  "L75×75×6": 6.84,
  "L90×90×7": 9.61
};

export interface MaterialBreakdownItem {
  key: string;
  label: string;
  lengthMeters: number;
  massKg: number;
  color: string;
}

export interface SectionQuantityRow {
  section: string;
  comparableSection: string;
  totalLengthMeters: number;
  unitWeightKgPerM: number;
  totalMassKg: number;
}

export interface MaterialEstimate {
  breakdown: MaterialBreakdownItem[];
  sections: SectionQuantityRow[];
  totalLengthMeters: number;
  totalMassKg: number;
}

function unitWeightForSection(sectionLabel: string) {
  if (unitWeightsKgPerM[sectionLabel]) {
    return {
      lookup: sectionLabel,
      weight: unitWeightsKgPerM[sectionLabel]
    };
  }

  const property = resolvePropertySection(sectionLabel);

  return {
    lookup: property.propertySection,
    weight: unitWeightsKgPerM[property.propertySection] ?? unitWeightsKgPerM["L80×80×8"]
  };
}

function addSectionContribution(
  sectionMap: Map<string, SectionQuantityRow>,
  section: string,
  lengthMeters: number
) {
  const unitWeight = unitWeightForSection(section);
  const existing = sectionMap.get(section);

  if (existing) {
    existing.totalLengthMeters += lengthMeters;
    existing.totalMassKg += lengthMeters * unitWeight.weight;
    return;
  }

  sectionMap.set(section, {
    section,
    comparableSection: unitWeight.lookup,
    totalLengthMeters: lengthMeters,
    unitWeightKgPerM: unitWeight.weight,
    totalMassKg: lengthMeters * unitWeight.weight
  });
}

export function calculateMaterialEstimate(
  panels: PanelElementLengths[],
  memberProfiles: PanelMemberProfile[]
): MaterialEstimate {
  const sectionMap = new Map<string, SectionQuantityRow>();

  let legs = 0;
  let kBraces = 0;
  let subHorizontals = 0;
  let horizontals = 0;
  let hipBraces = 0;

  panels.forEach((panel) => {
    const member = memberProfiles.find(
      (profile) => profile.panelNumber === panel.panelIndex
    );

    if (!member) {
      return;
    }

    const legContribution = panel.legLength * 4;
    legs += legContribution;
    addSectionContribution(sectionMap, member.legPropertySection, legContribution);

    const horizontalContribution = panel.horizontal * 4;
    horizontals += horizontalContribution;
    addSectionContribution(
      sectionMap,
      member.horizontalPropertySection,
      horizontalContribution
    );

    if (panel.kBraceDiag) {
      const diagonalContribution = panel.kBraceDiag * 8;
      kBraces += diagonalContribution;
      addSectionContribution(
        sectionMap,
        member.diagonalPropertySection,
        diagonalContribution
      );
    }

    if (panel.subHorizontal) {
      const subHorizontalContribution = panel.subHorizontal * 4;
      subHorizontals += subHorizontalContribution;
      addSectionContribution(
        sectionMap,
        member.horizontalPropertySection,
        subHorizontalContribution
      );
    }

    if (panel.hipBraceDiag) {
      const hipContribution = panel.hipBraceDiag * 2;
      hipBraces += hipContribution;
      addSectionContribution(
        sectionMap,
        member.diagonalPropertySection,
        hipContribution
      );
    }
  });

  const breakdown: MaterialBreakdownItem[] = [
    {
      key: "legs",
      label: "Legs",
      lengthMeters: legs,
      massKg: Array.from(sectionMap.values())
        .filter((row) =>
          memberProfiles.some((member) => member.legPropertySection === row.section)
        )
        .reduce((sum, row) => sum + row.totalMassKg, 0),
      color: "#0f766e"
    },
    {
      key: "k-braces",
      label: "K-brace diagonals",
      lengthMeters: kBraces,
      massKg: kBraces
        ? kBraces *
          unitWeightForSection(
            memberProfiles.find((profile) =>
              panels.some(
                (panel) => panel.panelIndex === profile.panelNumber && panel.kBraceDiag
              )
            )?.diagonalPropertySection ?? "L70×70×6"
          ).weight
        : 0,
      color: "#d97706"
    },
    {
      key: "sub-horizontal",
      label: "K sub-horizontals",
      lengthMeters: subHorizontals,
      massKg: subHorizontals
        ? subHorizontals *
          unitWeightForSection(
            memberProfiles[0]?.horizontalPropertySection ?? "L50×50×5"
          ).weight
        : 0,
      color: "#7c3aed"
    },
    {
      key: "horizontals",
      label: "Horizontal chords",
      lengthMeters: horizontals,
      massKg: horizontals
        ? horizontals *
          unitWeightForSection(
            memberProfiles[0]?.horizontalPropertySection ?? "L50×50×5"
          ).weight
        : 0,
      color: "#475569"
    },
    {
      key: "hip",
      label: "Hip bracing",
      lengthMeters: hipBraces,
      massKg: hipBraces
        ? hipBraces *
          unitWeightForSection(
            memberProfiles.find((profile) =>
              panels.some(
                (panel) =>
                  panel.panelIndex === profile.panelNumber && panel.hipBraceDiag
              )
            )?.diagonalPropertySection ?? "L60×60×5"
          ).weight
        : 0,
      color: "#f59e0b"
    }
  ];

  const sections = Array.from(sectionMap.values()).sort(
    (left, right) => right.totalMassKg - left.totalMassKg
  );

  return {
    breakdown,
    sections,
    totalLengthMeters: breakdown.reduce(
      (sum, item) => sum + item.lengthMeters,
      0
    ),
    totalMassKg: sections.reduce((sum, row) => sum + row.totalMassKg, 0)
  };
}

