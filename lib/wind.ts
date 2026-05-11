import type { ExposureOption } from "@/lib/tower";

export interface ExposureConstants {
  alphaPrime: number;
  zgMeters: number;
  note: string;
}

export const EXPOSURE_CONSTANTS: Record<ExposureOption, ExposureConstants> = {
  B: {
    alphaPrime: 7.0,
    zgMeters: 365.76,
    note: "Interactive exposure constants included for exploratory switching; verify against the adopted TIA/ASCE table before design use."
  },
  C: {
    alphaPrime: 9.5,
    zgMeters: 274.32,
    note: "Interactive exposure constants included for exploratory switching; verify against the adopted TIA/ASCE table before design use."
  },
  D: {
    alphaPrime: 11.5,
    zgMeters: 213.36,
    note: "Interactive exposure constants included for exploratory switching; verify against the adopted TIA/ASCE table before design use."
  }
};

export function milesPerHourToMetersPerSecond(mph: number) {
  return mph * 0.44704;
}

export function newtonsPerSquareMeterToPsf(value: number) {
  return value * 0.020885434273039;
}

export function computeKz(zMeters: number, exposure: ExposureOption) {
  const { alphaPrime, zgMeters } = EXPOSURE_CONSTANTS[exposure];
  return 2.01 * (zMeters / zgMeters) ** (2 / alphaPrime);
}

export function computeQz({
  zMeters,
  windSpeedMph,
  exposure,
  kzt = 1.0,
  ks = 1.0,
  ke = 1.0,
  kd = 0.85
}: {
  zMeters: number;
  windSpeedMph: number;
  exposure: ExposureOption;
  kzt?: number;
  ks?: number;
  ke?: number;
  kd?: number;
}) {
  const velocityMps = milesPerHourToMetersPerSecond(windSpeedMph);
  const kz = computeKz(zMeters, exposure);
  const qz = 0.613 * kz * kzt * ks * ke * kd * velocityMps ** 2;

  return {
    kz,
    qz,
    velocityMps,
    kzt,
    ks,
    ke,
    kd
  };
}

export function computeCf(squareSolidityRatio: number) {
  return 4.0 * squareSolidityRatio ** 2 - 5.9 * squareSolidityRatio + 4.0;
}

export function computeFst({
  qz,
  gh = 0.85,
  projectedArea
}: {
  qz: number;
  gh?: number;
  projectedArea: number;
}) {
  return qz * gh * projectedArea;
}

export function formatQzSubstitution({
  zMeters,
  windSpeedMph,
  exposure
}: {
  zMeters: number;
  windSpeedMph: number;
  exposure: ExposureOption;
}) {
  const result = computeQz({ zMeters, windSpeedMph, exposure });

  return `qz = 0.613 × ${result.kz.toFixed(3)} × ${result.kzt.toFixed(
    2
  )} × ${result.ks.toFixed(2)} × ${result.ke.toFixed(
    2
  )} × ${result.kd.toFixed(2)} × ${result.velocityMps.toFixed(
    2
  )}² = ${result.qz.toFixed(1)} N/m²`;
}
