import { type PanelElementLengths } from "@/lib/elementLengths";
import { computeQz } from "@/lib/wind";
import { type TowerConfig } from "@/lib/tower";

export interface PanelWindForce {
  panelNumber: number;
  zMid: number;
  kz: number;
  qz: number;
  solidity: number;
  dragCoefficient: number;
  areaFace: number;
  forceN: number;
  cumulativeBaseShearN: number;
  overturningMomentNm: number;
  demandIndex: number;
  color: string;
}

function demandColor(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  const red = Math.round(46 + 209 * clamped);
  const green = Math.round(204 - 110 * clamped);
  const blue = Math.round(113 - 85 * clamped);
  return `rgb(${red}, ${green}, ${blue})`;
}

export function calculatePanelWindForces(
  config: TowerConfig,
  panels: PanelElementLengths[]
): PanelWindForce[] {
  const forces = panels.map((panel) => {
    const qzResult = computeQz({
      zMeters: (panel.elevBottom + panel.elevTop) / 2,
      windSpeedMph: config.windSpeedMph,
      exposure: config.exposure
    });
    const areaFace = panel.averageWidth * panel.panelHeight * panel.solidityRatio;
    const forceN = qzResult.qz * 0.85 * panel.dragCoefficient * areaFace;

    return {
      panelNumber: panel.panelIndex,
      zMid: (panel.elevBottom + panel.elevTop) / 2,
      kz: qzResult.kz,
      qz: qzResult.qz,
      solidity: panel.solidityRatio,
      dragCoefficient: panel.dragCoefficient,
      areaFace,
      forceN
    };
  });

  const enriched = [...forces]
    .reverse()
    .reduce<Array<PanelWindForce>>((accumulator, force) => {
      const cumulativeBaseShearN =
        force.forceN +
        (accumulator[accumulator.length - 1]?.cumulativeBaseShearN ?? 0);
      const overturningMomentNm =
        force.forceN * force.zMid +
        (accumulator[accumulator.length - 1]?.overturningMomentNm ?? 0);

      accumulator.push({
        ...force,
        cumulativeBaseShearN,
        overturningMomentNm,
        demandIndex: 0,
        color: "rgb(46, 204, 113)"
      });

      return accumulator;
    }, [])
    .reverse();

  const maxMoment = Math.max(
    ...enriched.map((panel) => panel.overturningMomentNm),
    1
  );

  return enriched.map((panel) => {
    const demandIndex = panel.overturningMomentNm / maxMoment;
    return {
      ...panel,
      demandIndex,
      color: demandColor(demandIndex)
    };
  });
}

