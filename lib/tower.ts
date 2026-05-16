export type BadgeTier =
  | "Code-Verified"
  | "Literature-Backed"
  | "Derived/Assumed";

export type HeightOption = 40 | 48 | 50 | 60 | 80;
export type BracingOption =
  | "Double K/K-B"
  | "X"
  | "K-Down"
  | "Mixed K/X";
export type PlanOption = "Square" | "Triangular";
export type ExposureOption = "B" | "C" | "D";
export type RiskCategoryOption = "I" | "II" | "III" | "IV";
export type UnitSystem = "metric" | "imperial";

export interface TowerConfig {
  heightMeters: HeightOption;
  panelCount: number;
  bottomWidthMeters: number;
  topWidthMeters: number;
  bracing: BracingOption;
  plan: PlanOption;
  appurtenances: boolean;
  windSpeedMph: number;
  exposure: ExposureOption;
  riskCategory: RiskCategoryOption;
}

export interface TowerPanelGeometry {
  panelNumber: number;
  bottomElevationMeters: number;
  topElevationMeters: number;
  midpointElevationMeters: number;
  widthAtBottomMeters: number;
  widthAtTopMeters: number;
  bracingType: BracingOption | "K";
  hipBrace: boolean;
}

export interface TowerPreset {
  key: "40m" | "60m" | "80m";
  label: string;
  summary: string;
  justification: string;
  config: TowerConfig;
}

export interface MemberSizeRow {
  panelLabel: string;
  elevationRange: string;
  leg: string;
  diagonal: string;
  horizontal: string;
}

export interface PanelMemberProfile {
  panelNumber: number;
  referencePanelNumber: number;
  legSection: string;
  legPropertySection: string;
  diagonalSection: string;
  diagonalPropertySection: string;
  horizontalSection: string;
  horizontalPropertySection: string;
  legSteel: string;
  bracingSteel: string;
  legFyMpa: number;
  bracingFyMpa: number;
  basisNote: string;
}

export const DEFAULT_CONFIG: TowerConfig = {
  heightMeters: 60,
  panelCount: 10,
  bottomWidthMeters: 6.0,
  topWidthMeters: 1.2,
  bracing: "Mixed K/X",
  plan: "Square",
  appurtenances: true,
  windSpeedMph: 115,
  exposure: "C",
  riskCategory: "II"
};

export const COMPARISON_PRESETS: TowerPreset[] = [
  {
    key: "40m",
    label: "40 m",
    summary: "8 panels, 4.0 m base, 1.0 m top",
    justification: "Rasool et al. 2022 lower-height comparison case.",
    config: {
      ...DEFAULT_CONFIG,
      heightMeters: 40,
      panelCount: 8,
      bottomWidthMeters: 4.0,
      topWidthMeters: 1.0
    }
  },
  {
    key: "60m",
    label: "60 m",
    summary: "10 panels, 6.0 m base, 1.2 m top",
    justification: "Rasool et al. 2022 mid-height reference and default pilot case.",
    config: {
      ...DEFAULT_CONFIG
    }
  },
  {
    key: "80m",
    label: "80 m",
    summary: "12 panels, 8.0 m base, 1.6 m top",
    justification: "Rasool et al. 2022 upper-height comparison case.",
    config: {
      ...DEFAULT_CONFIG,
      heightMeters: 80,
      panelCount: 12,
      bottomWidthMeters: 8.0,
      topWidthMeters: 1.6
    }
  }
];

export const MEMBER_SIZE_ROWS: MemberSizeRow[] = [
  {
    panelLabel: "1-2",
    elevationRange: "0-12 m",
    leg: "L160×160×15",
    diagonal: "L100×100×8",
    horizontal: "L75×75×6"
  },
  {
    panelLabel: "3-4",
    elevationRange: "12-24 m",
    leg: "L160/L140×13",
    diagonal: "L90×90×7",
    horizontal: "L65×65×5"
  },
  {
    panelLabel: "5-7",
    elevationRange: "24-42 m",
    leg: "L140/L120×12",
    diagonal: "L80/L70×6",
    horizontal: "L50×50×5"
  },
  {
    panelLabel: "8-9",
    elevationRange: "42-54 m",
    leg: "L100×100×10",
    diagonal: "L60×60×5",
    horizontal: "L45×45×5"
  },
  {
    panelLabel: "10",
    elevationRange: "54-60 m",
    leg: "L80×80×8",
    diagonal: "L45×45×5",
    horizontal: "L45×45×5"
  }
];

const PANEL_MEMBER_REFERENCE: Record<
  number,
  Omit<PanelMemberProfile, "panelNumber" | "referencePanelNumber">
> = {
  1: {
    legSection: "L160×160×15",
    legPropertySection: "L160×160×15",
    diagonalSection: "L100×100×8",
    diagonalPropertySection: "L100×100×10",
    horizontalSection: "L75×75×6",
    horizontalPropertySection: "L75×75×6",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Diagonal property checks use the nearest comparable AISC angle, L100×100×10, as a preliminary proxy."
  },
  2: {
    legSection: "L160×160×15",
    legPropertySection: "L160×160×15",
    diagonalSection: "L100×100×8",
    diagonalPropertySection: "L100×100×10",
    horizontalSection: "L75×75×6",
    horizontalPropertySection: "L75×75×6",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Diagonal property checks use the nearest comparable AISC angle, L100×100×10, as a preliminary proxy."
  },
  3: {
    legSection: "L160×160×15",
    legPropertySection: "L160×160×15",
    diagonalSection: "L90×90×7",
    diagonalPropertySection: "L90×90×7",
    horizontalSection: "L65×65×5",
    horizontalPropertySection: "L65×65×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  },
  4: {
    legSection: "L140×140×13",
    legPropertySection: "L140×140×13",
    diagonalSection: "L90×90×7",
    diagonalPropertySection: "L90×90×7",
    horizontalSection: "L65×65×5",
    horizontalPropertySection: "L65×65×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  },
  5: {
    legSection: "L140×140×13",
    legPropertySection: "L140×140×13",
    diagonalSection: "L80×80×8",
    diagonalPropertySection: "L80×80×8",
    horizontalSection: "L50×50×5",
    horizontalPropertySection: "L50×50×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Represents the larger end of the Bilionis mid-height diagonal group for a conservative preliminary check."
  },
  6: {
    legSection: "L120×120×12",
    legPropertySection: "L120×120×12",
    diagonalSection: "L70×70×6",
    diagonalPropertySection: "L70×70×6",
    horizontalSection: "L50×50×5",
    horizontalPropertySection: "L50×50×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  },
  7: {
    legSection: "L120×120×12",
    legPropertySection: "L120×120×12",
    diagonalSection: "L70×70×6",
    diagonalPropertySection: "L70×70×6",
    horizontalSection: "L50×50×5",
    horizontalPropertySection: "L50×50×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  },
  8: {
    legSection: "L100×100×10",
    legPropertySection: "L100×100×10",
    diagonalSection: "L60×60×5",
    diagonalPropertySection: "L60×60×5",
    horizontalSection: "L45×45×5",
    horizontalPropertySection: "L45×45×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  },
  9: {
    legSection: "L100×100×10",
    legPropertySection: "L100×100×10",
    diagonalSection: "L60×60×5",
    diagonalPropertySection: "L60×60×5",
    horizontalSection: "L45×45×5",
    horizontalPropertySection: "L45×45×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  },
  10: {
    legSection: "L80×80×8",
    legPropertySection: "L80×80×8",
    diagonalSection: "L45×45×5",
    diagonalPropertySection: "L45×45×5",
    horizontalSection: "L45×45×5",
    horizontalPropertySection: "L45×45×5",
    legSteel: "ASTM A572 Grade 50",
    bracingSteel: "ASTM A36",
    legFyMpa: 345,
    bracingFyMpa: 250,
    basisNote:
      "Mapped from the Bilionis 10-panel member-size baseline and used here as a preliminary section assignment."
  }
};

export function widthAtElevation(
  bottomWidthMeters: number,
  topWidthMeters: number,
  elevationMeters: number,
  heightMeters: number
) {
  return (
    bottomWidthMeters -
    (bottomWidthMeters - topWidthMeters) * (elevationMeters / heightMeters)
  );
}

export function panelHeight(config: TowerConfig) {
  return config.heightMeters / config.panelCount;
}

export function bracingForPanel(
  config: TowerConfig,
  panelNumber: number
): BracingOption | "K" {
  if (config.bracing === "Mixed K/X") {
    return panelNumber <= 2 ? "K" : "X";
  }

  return config.bracing;
}

export function generateTowerPanels(config: TowerConfig): TowerPanelGeometry[] {
  const singlePanelHeight = panelHeight(config);

  return Array.from({ length: config.panelCount }, (_, index) => {
    const panelNumber = index + 1;
    const bottomElevationMeters = index * singlePanelHeight;
    const topElevationMeters = (index + 1) * singlePanelHeight;
    const midpointElevationMeters =
      (bottomElevationMeters + topElevationMeters) / 2;

    return {
      panelNumber,
      bottomElevationMeters,
      topElevationMeters,
      midpointElevationMeters,
      widthAtBottomMeters: widthAtElevation(
        config.bottomWidthMeters,
        config.topWidthMeters,
        bottomElevationMeters,
        config.heightMeters
      ),
      widthAtTopMeters: widthAtElevation(
        config.bottomWidthMeters,
        config.topWidthMeters,
        topElevationMeters,
        config.heightMeters
      ),
      bracingType: bracingForPanel(config, panelNumber),
      hipBrace: [3, 6, 9].includes(panelNumber)
    };
  });
}

export function representativePlatformElevations(heightMeters: number) {
  return [0.8, 0.9, 0.97].map((ratio) => ratio * heightMeters);
}

export function representativeDishElevations(heightMeters: number) {
  return [0.83, 0.93].map((ratio) => ratio * heightMeters);
}

export function representativePanelAntennaElevations(heightMeters: number) {
  return [0.88, 0.92, 0.96].map((ratio) => ratio * heightMeters);
}

export function formatMeters(value: number) {
  return `${value.toFixed(1)} m`;
}

export function metersToFeet(value: number) {
  return value * 3.280839895;
}

export function feetToMeters(value: number) {
  return value / 3.280839895;
}

export function formatLength(valueMeters: number, unitSystem: UnitSystem) {
  if (unitSystem === "imperial") {
    return `${metersToFeet(valueMeters).toFixed(2)} ft`;
  }

  return `${valueMeters.toFixed(3)} m`;
}

export function formatLengthShort(valueMeters: number, unitSystem: UnitSystem) {
  if (unitSystem === "imperial") {
    return `${metersToFeet(valueMeters).toFixed(1)} ft`;
  }

  return `${valueMeters.toFixed(2)} m`;
}

export function formatAngle(value: number) {
  return `${value.toFixed(1)}°`;
}

function referencePanelNumberForActualPanel(
  panelNumber: number,
  panelCount: number
) {
  const midpointRatio = (panelNumber - 0.5) / panelCount;
  return Math.min(10, Math.max(1, Math.ceil(midpointRatio * 10)));
}

export function buildPanelMemberProfiles(panelCount: number): PanelMemberProfile[] {
  return Array.from({ length: panelCount }, (_, index) => {
    const panelNumber = index + 1;
    const referencePanelNumber = referencePanelNumberForActualPanel(
      panelNumber,
      panelCount
    );
    const reference = PANEL_MEMBER_REFERENCE[referencePanelNumber];

    return {
      panelNumber,
      referencePanelNumber,
      ...reference
    };
  });
}

export function panelMemberProfile(panelNumber: number, panelCount: number) {
  return buildPanelMemberProfiles(panelCount).find(
    (profile) => profile.panelNumber === panelNumber
  );
}

export function buildAdvisorExplanation(config: TowerConfig) {
  return `My tower design follows a design-manual workflow rather than copying an existing tower. TSTower's self-supporting tower manual defines geometry through total height, top/bottom face widths, and section height — I adopted this input logic. TIA-222-H provides the structural code basis, including wind loading (§2.6), serviceability (§2.8), and member design references. I selected ${config.heightMeters} m as the representative height based on Rasool et al. 2022, which studies 40/60/80 m towers under TIA-222-H. The tapered square lattice form and member size baseline come from Bilionis & Vamvatsikos 2019. ${
    config.bracing === "Mixed K/X"
      ? "Mixed K/X bracing follows Khazaali dissertation §4.5 and is consistent with the 60 m bracing study showing Double K/K-B as the most efficient pattern."
      : `${config.bracing} is included because the 60 m bracing study explicitly compares this pattern under wind loading.`
  } Member proportioning follows ASCE/SEI 10-15 §3.4 slenderness limits and §3.6 compression formulas. Base width (${config.bottomWidthMeters.toFixed(
    1
  )} m) and top width (${config.topWidthMeters.toFixed(
    1
  )} m) are derived preliminary proportions, not code-mandated values, and will be verified against final load calculations.`;
}

export function buildGeometryCsv(config: TowerConfig) {
  const rows = generateTowerPanels(config);
  const header = [
    "Panel",
    "Bottom Elevation (m)",
    "Top Elevation (m)",
    "Width at Bottom (m)",
    "Width at Top (m)",
    "Bracing Type",
    "Hip Bracing"
  ];

  const body = rows.map((row) =>
    [
      row.panelNumber,
      row.bottomElevationMeters.toFixed(2),
      row.topElevationMeters.toFixed(2),
      row.widthAtBottomMeters.toFixed(2),
      row.widthAtTopMeters.toFixed(2),
      row.bracingType,
      row.hipBrace ? "Yes" : "No"
    ].join(",")
  );

  return [header.join(","), ...body].join("\n");
}
