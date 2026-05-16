"use client";

import { type PanelElementLengths } from "@/lib/elementLengths";
import { type PanelWindForce } from "@/lib/windForce";
import { type TowerConfig } from "@/lib/tower";

interface IsometricViewProps {
  config: TowerConfig;
  panels: PanelElementLengths[];
  windForces: PanelWindForce[];
  stressMode: boolean;
  onPanelSelect: (panelNumber: number) => void;
}

function yForElevation(elevation: number, towerHeight: number) {
  const topMargin = 46;
  const drawHeight = 520;
  return topMargin + (1 - elevation / towerHeight) * drawHeight;
}

function xForWidth(
  width: number,
  baseWidth: number,
  face: "front-left" | "front-right" | "back-left" | "back-right"
) {
  const centerX = 250;
  const halfSpan = (width / baseWidth) * 90;
  const offset = 46;

  if (face === "front-left") {
    return centerX - halfSpan;
  }

  if (face === "front-right") {
    return centerX + halfSpan;
  }

  if (face === "back-left") {
    return centerX - halfSpan + offset;
  }

  return centerX + halfSpan + offset;
}

export function IsometricView({
  config,
  panels,
  windForces,
  stressMode,
  onPanelSelect
}: IsometricViewProps) {
  return (
    <svg
      viewBox="0 0 560 700"
      className="w-full rounded-[28px] border border-line bg-gradient-to-b from-white to-slate-50"
      role="img"
      aria-label="Isometric telecom tower view"
    >
      <rect x="0" y="0" width="560" height="700" fill="transparent" />

      {panels.map((panel) => {
        const yBottom = yForElevation(panel.elevBottom, config.heightMeters);
        const yTop = yForElevation(panel.elevTop, config.heightMeters);
        const frontLeftBottom = xForWidth(
          panel.wBottom,
          config.bottomWidthMeters,
          "front-left"
        );
        const frontRightBottom = xForWidth(
          panel.wBottom,
          config.bottomWidthMeters,
          "front-right"
        );
        const frontLeftTop = xForWidth(
          panel.wTop,
          config.bottomWidthMeters,
          "front-left"
        );
        const frontRightTop = xForWidth(
          panel.wTop,
          config.bottomWidthMeters,
          "front-right"
        );
        const backLeftBottom = xForWidth(
          panel.wBottom,
          config.bottomWidthMeters,
          "back-left"
        );
        const backRightBottom = xForWidth(
          panel.wBottom,
          config.bottomWidthMeters,
          "back-right"
        );
        const backLeftTop = xForWidth(
          panel.wTop,
          config.bottomWidthMeters,
          "back-left"
        );
        const backRightTop = xForWidth(
          panel.wTop,
          config.bottomWidthMeters,
          "back-right"
        );
        const stressColor =
          windForces.find((row) => row.panelNumber === panel.panelIndex)?.color ??
          "#dbeafe";
        const fill = stressMode ? stressColor : "rgba(148, 163, 184, 0.06)";

        return (
          <g key={panel.panelIndex}>
            <polygon
              points={`${frontLeftBottom},${yBottom} ${frontRightBottom},${yBottom} ${frontRightTop},${yTop} ${frontLeftTop},${yTop}`}
              fill={fill}
              stroke="#cbd5e1"
              strokeWidth="1.25"
              className="cursor-pointer transition-opacity duration-300 hover:opacity-90"
              onClick={() => onPanelSelect(panel.panelIndex)}
            />
            <polygon
              points={`${frontRightBottom},${yBottom} ${backRightBottom},${yBottom - 26} ${backRightTop},${yTop - 26} ${frontRightTop},${yTop}`}
              fill={stressMode ? stressColor : "rgba(148, 163, 184, 0.1)"}
              stroke="#cbd5e1"
              strokeWidth="1.25"
              opacity="0.85"
            />
            <polygon
              points={`${frontLeftTop},${yTop} ${frontRightTop},${yTop} ${backRightTop},${yTop - 26} ${backLeftTop},${yTop - 26}`}
              fill="rgba(14, 165, 233, 0.08)"
              stroke="#cbd5e1"
              strokeWidth="1.25"
            />

            <line
              x1={frontLeftBottom}
              y1={yBottom}
              x2={frontLeftTop}
              y2={yTop}
              stroke="#11233c"
              strokeWidth="4"
            />
            <line
              x1={frontRightBottom}
              y1={yBottom}
              x2={frontRightTop}
              y2={yTop}
              stroke="#11233c"
              strokeWidth="4"
            />
            <line
              x1={backLeftBottom}
              y1={yBottom - 26}
              x2={backLeftTop}
              y2={yTop - 26}
              stroke="#11233c"
              strokeWidth="4"
              opacity="0.8"
            />
            <line
              x1={backRightBottom}
              y1={yBottom - 26}
              x2={backRightTop}
              y2={yTop - 26}
              stroke="#11233c"
              strokeWidth="4"
              opacity="0.8"
            />

            <line
              x1={frontLeftBottom}
              y1={yBottom}
              x2={frontRightTop}
              y2={yTop}
              stroke="#64748b"
              strokeWidth="2.5"
            />
            <line
              x1={frontRightBottom}
              y1={yBottom}
              x2={frontLeftTop}
              y2={yTop}
              stroke="#64748b"
              strokeWidth="2.5"
            />
            <line
              x1={frontRightBottom}
              y1={yBottom}
              x2={backRightTop}
              y2={yTop - 26}
              stroke="#64748b"
              strokeWidth="2"
              opacity="0.85"
            />

            {panel.isHipPanel ? (
              <line
                x1={frontLeftTop}
                y1={yTop}
                x2={backRightTop}
                y2={yTop - 26}
                stroke="#94a3b8"
                strokeDasharray="7 5"
                strokeWidth="2"
              />
            ) : null}

            <text
              x={(frontLeftBottom + frontRightBottom) / 2}
              y={(yBottom + yTop) / 2 + 4}
              textAnchor="middle"
              fontSize="12"
              fill="#11233c"
              fontWeight="700"
            >
              P{panel.panelIndex}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
