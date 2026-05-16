import { computeCf } from "@/lib/wind";

export type PanelBracingFamily = "K" | "X";

export interface PanelElementLengths {
  panelIndex: number;
  elevBottom: number;
  elevTop: number;
  wBottom: number;
  wTop: number;
  panelHeight: number;
  averageWidth: number;
  horizontalOffset: number;
  legLength: number;
  xBraceDiag: number | null;
  kBraceDiag: number | null;
  subHorizontal: number | null;
  horizontal: number;
  hipBraceDiag: number | null;
  bracingType: PanelBracingFamily;
  isHipPanel: boolean;
  solidityRatio: number;
  dragCoefficient: number;
}

export interface CalculationBlock {
  title: string;
  lines: string[];
  source: string;
}

export function faceWidthAtElevation(
  z: number,
  H: number,
  wBase: number,
  wTop: number
): number {
  return wBase - (wBase - wTop) * (z / H);
}

export function legLength(
  panelHeight: number,
  wBottom: number,
  wTop: number
): number {
  const horizontalOffset = (wBottom - wTop) / 2;
  return Math.sqrt(panelHeight ** 2 + horizontalOffset ** 2);
}

export function xBraceDiagonal(panelHeight: number, wBottom: number): number {
  return Math.sqrt(panelHeight ** 2 + wBottom ** 2);
}

export function kBraceDiagonal(
  panelHeight: number,
  wBottom: number,
  wTop: number
): number {
  const halfTop = wTop / 2;
  const halfBottom = wBottom / 2;
  return Math.sqrt(panelHeight ** 2 + (halfBottom - halfTop / 2) ** 2);
}

export function subHorizontal(wBottom: number, wTop: number): number {
  return (wBottom + wTop) / 2;
}

export function horizontalChord(wBottom: number): number {
  return wBottom;
}

export function hipBraceDiagonal(wBottom: number): number {
  return Math.sqrt(2) * wBottom;
}

export function approximateSolidityRatio(
  panelZeroBasedIndex: number,
  panelCount: number
): number {
  return 0.2 + 0.05 * (1 - panelZeroBasedIndex / panelCount);
}

function resolvedPanelBracing(
  bracingType: string,
  panelNumber: number,
  kPanels: number
): PanelBracingFamily {
  if (bracingType === "X") {
    return "X";
  }

  if (bracingType === "Mixed K/X") {
    return panelNumber <= kPanels ? "K" : "X";
  }

  return "K";
}

export function calculateAllPanelLengths(
  H: number,
  nPanels: number,
  wBase: number,
  wTop: number,
  bracingType: string,
  kPanels = 2,
  hipPanels: number[] = [3, 6, 9]
): PanelElementLengths[] {
  const panelHeightValue = H / nPanels;

  return Array.from({ length: nPanels }, (_, zeroBasedIndex) => {
    const panelNumber = zeroBasedIndex + 1;
    const elevBottom = zeroBasedIndex * panelHeightValue;
    const elevTop = (zeroBasedIndex + 1) * panelHeightValue;
    const wBottom = faceWidthAtElevation(elevBottom, H, wBase, wTop);
    const wTopPanel = faceWidthAtElevation(elevTop, H, wBase, wTop);
    const averageWidth = (wBottom + wTopPanel) / 2;
    const horizontalOffset = (wBottom - wTopPanel) / 2;
    const panelBracing = resolvedPanelBracing(bracingType, panelNumber, kPanels);
    const solidityRatio = approximateSolidityRatio(zeroBasedIndex, nPanels);

    return {
      panelIndex: panelNumber,
      elevBottom,
      elevTop,
      wBottom,
      wTop: wTopPanel,
      panelHeight: panelHeightValue,
      averageWidth,
      horizontalOffset,
      legLength: legLength(panelHeightValue, wBottom, wTopPanel),
      xBraceDiag:
        panelBracing === "X" ? xBraceDiagonal(panelHeightValue, wBottom) : null,
      kBraceDiag:
        panelBracing === "K"
          ? kBraceDiagonal(panelHeightValue, wBottom, wTopPanel)
          : null,
      subHorizontal:
        panelBracing === "K" ? subHorizontal(wBottom, wTopPanel) : null,
      horizontal: horizontalChord(wBottom),
      hipBraceDiag: hipPanels.includes(panelNumber)
        ? hipBraceDiagonal(wBottom)
        : null,
      bracingType: panelBracing,
      isHipPanel: hipPanels.includes(panelNumber),
      solidityRatio,
      dragCoefficient: computeCf(solidityRatio)
    };
  });
}

export function panelCalculationBlocks(panel: PanelElementLengths): CalculationBlock[] {
  return [
    {
      title: "Face widths",
      lines: [
        `Face width at z=${panel.elevBottom.toFixed(1)} m: w = ${panel.wBottom.toFixed(
          3
        )} m`,
        `Face width at z=${panel.elevTop.toFixed(1)} m: w = ${panel.wTop.toFixed(
          3
        )} m`,
        `Panel height: h = ${panel.panelHeight.toFixed(3)} m`
      ],
      source:
        "Linear interpolation w(z) = w_base − (w_base − w_top) × (z/H); Bilionis & Vamvatsikos 2019 tapered tower precedent."
    },
    {
      title: "Leg",
      lines: [
        `Horizontal offset per leg = (${panel.wBottom.toFixed(3)} − ${panel.wTop.toFixed(
          3
        )}) / 2 = ${panel.horizontalOffset.toFixed(3)} m`,
        `Leg length = √(${panel.panelHeight.toFixed(3)}² + ${panel.horizontalOffset.toFixed(
          3
        )}²) = ${panel.legLength.toFixed(3)} m`
      ],
      source:
        "Pythagorean theorem; ASCE 10-15 §2.3 geometric analysis framing."
    },
    ...(panel.xBraceDiag
      ? [
          {
            title: "X-brace diagonal",
            lines: [
              `Length = √(${panel.panelHeight.toFixed(3)}² + ${panel.wBottom.toFixed(
                3
              )}²) = ${panel.xBraceDiag.toFixed(3)} m`
            ],
            source:
              "Elementary geometry; Bilionis & Vamvatsikos 2019 panel geometry precedent."
          }
        ]
      : []),
    ...(panel.kBraceDiag
      ? [
          {
            title: "K-brace diagonal",
            lines: [
              `Width reduction = (${panel.wBottom.toFixed(3)} / 2 − ${panel.wTop.toFixed(
                3
              )} / 4) = ${(panel.wBottom / 2 - panel.wTop / 4).toFixed(3)} m`,
              `K-diagonal = √(${panel.panelHeight.toFixed(3)}² + ${(panel.wBottom / 2 - panel.wTop / 4).toFixed(
                3
              )}²) = ${panel.kBraceDiag.toFixed(3)} m`
            ],
            source:
              "Elementary geometry; TSTower/ASCE-style node-coordinate interpretation for K bracing."
          },
          {
            title: "K-brace sub-horizontal",
            lines: [
              `Sub-horizontal = (${panel.wBottom.toFixed(3)} + ${panel.wTop.toFixed(
                3
              )}) / 2 = ${((panel.wBottom + panel.wTop) / 2).toFixed(3)} m`
            ],
            source:
              "Mid-panel face width approximation from the linear taper rule."
          }
        ]
      : []),
    {
      title: "Horizontal chord",
      lines: [
        `Horizontal chord = face width at panel base = ${panel.wBottom.toFixed(3)} m`
      ],
      source:
        "Directly from the interpolated panel geometry, using the bottom face width."
    },
    ...(panel.hipBraceDiag
      ? [
          {
            title: "Hip brace",
            lines: [
              `Hip diagonal = √2 × ${panel.wBottom.toFixed(3)} = ${panel.hipBraceDiag.toFixed(
                3
              )} m`
            ],
            source:
              "Square-plan diagonal from elementary geometry; ASCE 10-15 §2.3 configuration logic."
          }
        ]
      : []),
    {
      title: "Panel aerodynamic approximation",
      lines: [
        `Approximate solidity ratio ε = 0.20 + 0.05 × (1 − i/n) = ${panel.solidityRatio.toFixed(
          3
        )}`,
        `Drag coefficient Cf = 4.0ε² − 5.9ε + 4.0 = ${panel.dragCoefficient.toFixed(
          3
        )}`
      ],
      source:
        "Khazaali et al. 2024 coefficient context with an explicitly approximate panel-solidity model."
    }
  ];
}
