import { angleSectionForLabel } from "@/lib/tower";

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
export type EndCondition = "pin-pin" | "fixed-free";

const DEFAULT_ELASTIC_MODULUS_GPA = 200;
const DEFAULT_SAFETY_FACTOR = 1.67;

export interface SlendernessResult {
  role: SlendernessRole;
  sectionLabel: string;
  propertySection: string;
  radiusMm: number;
  klr: number;
  limit: number;
  status: SlendernessStatus;
  klrStatus: SlendernessStatus;
  sigmaCreMpa: number;
  sigmaDemandMpa: number;
  sigmaAdmissibleMpa: number;
  stressStatus: SlendernessStatus;
  eulerStatus: SlendernessStatus;
  derivedKlrLimit: number;
  endCondition: EndCondition;
  note: string;
}

function rankStatus(status: SlendernessStatus) {
  if (status === "exceeds") {
    return 3;
  }

  if (status === "close") {
    return 2;
  }

  return 1;
}

function worstStatus(statuses: SlendernessStatus[]) {
  return statuses.reduce((worst, current) =>
    rankStatus(current) > rankStatus(worst) ? current : worst
  );
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

export function computeEulerStress(
  klr: number,
  E_GPa = DEFAULT_ELASTIC_MODULUS_GPA
): number {
  if (klr <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return (E_GPa * 1000 * Math.PI ** 2) / klr ** 2;
}

export function computeAdmissibleStress(
  fyMpa: number,
  safetyFactor = DEFAULT_SAFETY_FACTOR
): number {
  return fyMpa / safetyFactor;
}

export function demandStressStatus(
  sigmaDemandMpa: number,
  sigmaCapacityMpa: number
): SlendernessStatus {
  if (sigmaDemandMpa > sigmaCapacityMpa) {
    return "exceeds";
  }

  if (sigmaDemandMpa > sigmaCapacityMpa * 0.9) {
    return "close";
  }

  return "pass";
}

export function derivedKlrLimitForDemand(
  sigmaDemandMpa: number,
  E_GPa = DEFAULT_ELASTIC_MODULUS_GPA
): number {
  if (sigmaDemandMpa <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt((E_GPa * 1000 * Math.PI ** 2) / sigmaDemandMpa);
}

export function checkSlenderness({
  lengthMeters,
  sectionLabel,
  role,
  endCondition = "pin-pin",
  kFactor,
  fyMpa = role === "leg" ? 345 : 250,
  sigmaDemandMpa = 0
}: {
  lengthMeters: number;
  sectionLabel: string;
  role: SlendernessRole;
  endCondition?: EndCondition;
  kFactor?: number;
  fyMpa?: number;
  sigmaDemandMpa?: number;
}): SlendernessResult {
  const property = resolvePropertySection(sectionLabel);
  const fallbackSection = angleSectionForLabel(property.propertySection);
  const radiusMm = rMin[property.propertySection] ?? fallbackSection.r_min_mm;
  const effectiveKFactor =
    kFactor ?? (endCondition === "fixed-free" ? 2 : 1);
  const klr = (effectiveKFactor * lengthMeters * 1000) / radiusMm;
  const limit = slendernessLimit(role);
  const klrStatus = slendernessStatus(klr, limit);
  const sigmaCreMpa = computeEulerStress(klr);
  const sigmaAdmissibleMpa = computeAdmissibleStress(fyMpa);
  const stressStatus = demandStressStatus(
    sigmaDemandMpa,
    sigmaAdmissibleMpa
  );
  const eulerStatus =
    role === "leg" && sigmaDemandMpa > 0
      ? demandStressStatus(sigmaDemandMpa, sigmaCreMpa)
      : klrStatus;
  const status =
    role === "leg"
      ? worstStatus([klrStatus, stressStatus, eulerStatus])
      : stressStatus;

  return {
    role,
    sectionLabel,
    propertySection: property.propertySection,
    radiusMm,
    klr,
    limit,
    status,
    klrStatus,
    sigmaCreMpa,
    sigmaDemandMpa,
    sigmaAdmissibleMpa,
    stressStatus,
    eulerStatus,
    derivedKlrLimit: derivedKlrLimitForDemand(sigmaDemandMpa),
    endCondition,
    note: property.note
  };
}
