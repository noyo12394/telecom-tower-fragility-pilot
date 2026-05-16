export const rMin: Record<string, number> = {
  "L45×45×5": 8.8,
  "L50×50×5": 9.8,
  "L60×60×5": 11.8,
  "L65×65×5": 12.8,
  "L70×70×6": 13.7,
  "L75×75×6": 14.7,
  "L80×80×8": 15.6,
  "L90×90×7": 17.7,
  "L100×100×10": 19.5,
  "L120×120×12": 23.5,
  "L140×140×13": 27.5,
  "L160×160×15": 31.4
};

export type SlendernessRole =
  | "leg"
  | "bracing"
  | "redundant"
  | "horizontal"
  | "hip";

export type SlendernessStatus = "pass" | "close" | "exceeds";

export interface SlendernessResult {
  sectionLabel: string;
  propertySection: string;
  radiusMm: number;
  klr: number;
  limit: number;
  status: SlendernessStatus;
  note: string;
}

export function resolvePropertySection(sectionLabel: string): {
  propertySection: string;
  note: string;
} {
  const directMatch = rMin[sectionLabel];

  if (directMatch) {
    return {
      propertySection: sectionLabel,
      note: "AISC angle property used directly."
    };
  }

  if (sectionLabel === "L100×100×8") {
    return {
      propertySection: "L100×100×10",
      note: "Approximate section property uses comparable L100×100×10."
    };
  }

  return {
    propertySection: "L80×80×8",
    note: "Approximate section property uses the nearest available comparable angle."
  };
}

export function slendernessLimit(role: SlendernessRole) {
  if (role === "leg") {
    return 150;
  }

  if (role === "bracing") {
    return 200;
  }

  return 250;
}

export function slendernessStatus(
  klr: number,
  limit: number
): SlendernessStatus {
  if (klr > limit) {
    return "exceeds";
  }

  if (klr > limit * 0.9) {
    return "close";
  }

  return "pass";
}

export function checkSlenderness({
  lengthMeters,
  sectionLabel,
  role,
  kFactor = 1
}: {
  lengthMeters: number;
  sectionLabel: string;
  role: SlendernessRole;
  kFactor?: number;
}): SlendernessResult {
  const property = resolvePropertySection(sectionLabel);
  const radiusMm = rMin[property.propertySection] ?? rMin["L80×80×8"];
  const klr = (kFactor * lengthMeters * 1000) / radiusMm;
  const limit = slendernessLimit(role);

  return {
    sectionLabel,
    propertySection: property.propertySection,
    radiusMm,
    klr,
    limit,
    status: slendernessStatus(klr, limit),
    note: property.note
  };
}

