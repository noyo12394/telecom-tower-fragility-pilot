"use client";

import { useMemo, useState } from "react";

import { IsometricView } from "@/components/IsometricView";
import { Tooltip, type TooltipCardData } from "@/components/Tooltip";
import { type PanelElementLengths } from "@/lib/elementLengths";
import { checkSlenderness, type SlendernessRole } from "@/lib/slenderness";
import {
  formatLength,
  type PanelMemberProfile,
  type TowerConfig,
  type UnitSystem
} from "@/lib/tower";
import { type PanelWindForce } from "@/lib/windForce";

interface TowerVisualizerProps {
  config: TowerConfig;
  panels: PanelElementLengths[];
  memberProfiles: PanelMemberProfile[];
  unitSystem: UnitSystem;
  showStress: boolean;
  show3D: boolean;
  hoverEnabled: boolean;
  windForces: PanelWindForce[];
  onPanelSelect: (panelNumber: number) => void;
  compact?: boolean;
  title?: string;
}

interface LineElement {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  color: string;
  tooltip: TooltipCardData;
}

function stressColor(util: number): string {
  if (util < 0.6) return "#22c55e";
  if (util > 0.9) return "#ef4444";
  const t = (util - 0.6) / 0.3;
  const r = Math.round(34 + (239 - 34) * t);
  const g = Math.round(197 + (68 - 197) * t);
  const b = Math.round(94 + (68 - 94) * t);
  return `rgb(${r},${g},${b})`;
}

function stressWidth(util: number): number {
  return 1.5 + Math.min(util, 1) * 2.0;
}

function yForElevation(elevation: number, towerHeight: number) {
  const topMargin = 68;
  const drawHeight = 600;
  return topMargin + (1 - elevation / towerHeight) * drawHeight;
}

function xForWidth(width: number, baseWidth: number, side: "left" | "right") {
  const centerX = 335;
  const maxHalfSpan = 160;
  const halfSpan = (width / baseWidth) * maxHalfSpan;
  return side === "left" ? centerX - halfSpan : centerX + halfSpan;
}

function elementTooltipData({
  elementType,
  lengthMeters,
  section,
  steel,
  fyMpa,
  role,
  sourceCitation,
  unitSystem
}: {
  elementType: string;
  lengthMeters: number;
  section: string;
  steel: string;
  fyMpa: number;
  role: SlendernessRole;
  sourceCitation: string;
  unitSystem: UnitSystem;
}): TooltipCardData {
  const slenderness = checkSlenderness({
    lengthMeters,
    sectionLabel: section,
    role
  });

  return {
    title: elementType,
    subtitle: `Calculated directly from current tower geometry`,
    fields: [
      {
        label: "Length",
        value: formatLength(lengthMeters, unitSystem)
      },
      {
        label: "Section",
        value: section
      },
      {
        label: "Steel / Fy",
        value: `${steel} | ${fyMpa} MPa`
      },
      {
        label: "KL/r",
        value: `${slenderness.klr.toFixed(0)} / ${slenderness.limit} (${slenderness.status})`
      },
      {
        label: "Source",
        value: sourceCitation
      }
    ],
    footer:
      "KL/r is a preliminary check using approximate radius of gyration values from the AISC manual + Bilionis-based member mapping."
  };
}

function utilisationColor(util: number): string {
  if (util < 0.6) return "#22c55e";
  if (util > 0.9) return "#ef4444";
  const t = (util - 0.6) / 0.3;
  const r = Math.round(34 + (239 - 34) * t);
  const g = Math.round(197 + (68 - 197) * t);
  const b = Math.round(94 + (68 - 94) * t);
  return `rgb(${r},${g},${b})`;
}

function utilisationWidth(util: number): number {
  return 1.5 + Math.min(Math.max(util, 0), 1) * 2.0;
}

function planViewThumbnail(plan: TowerConfig["plan"]) {
  if (plan === "Triangular") {
    return (
      <svg viewBox="0 0 120 90" className="h-20 w-24" aria-hidden="true">
        <polygon
          points="60,12 108,74 12,74"
          fill="rgba(34, 211, 238, 0.08)"
          stroke="#67e8f9"
          strokeWidth="4"
        />
        <line x1="60" y1="12" x2="12" y2="74" stroke="#94a3b8" strokeWidth="3" />
        <line x1="60" y1="12" x2="108" y2="74" stroke="#94a3b8" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 90" className="h-20 w-24" aria-hidden="true">
      <rect
        x="20"
        y="14"
        width="80"
        height="60"
        fill="rgba(34, 211, 238, 0.08)"
        stroke="#67e8f9"
        strokeWidth="4"
      />
      <line x1="20" y1="14" x2="100" y2="74" stroke="#94a3b8" strokeWidth="3" />
      <line x1="100" y1="14" x2="20" y2="74" stroke="#94a3b8" strokeWidth="3" />
    </svg>
  );
}

export function TowerVisualizer({
  config,
  panels,
  memberProfiles,
  unitSystem,
  showStress,
  show3D,
  hoverEnabled,
  windForces,
  onPanelSelect,
  compact = false,
  title = "Persistent Tower Sidebar"
}: TowerVisualizerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipCardData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const midWidth = (config.bottomWidthMeters + config.topWidthMeters) / 2;

  const lineElements = useMemo(() => {
    return panels.flatMap((panel) => {
      const member = memberProfiles.find(
        (profile) => profile.panelNumber === panel.panelIndex
      );

      if (!member) {
        return [];
      }

      const yBottom = yForElevation(panel.elevBottom, config.heightMeters);
      const yTop = yForElevation(panel.elevTop, config.heightMeters);
      const leftBottom = xForWidth(
        panel.wBottom,
        config.bottomWidthMeters,
        "left"
      );
      const rightBottom = xForWidth(
        panel.wBottom,
        config.bottomWidthMeters,
        "right"
      );
      const leftTop = xForWidth(panel.wTop, config.bottomWidthMeters, "left");
      const rightTop = xForWidth(panel.wTop, config.bottomWidthMeters, "right");
      const midTop = (leftTop + rightTop) / 2;
      const midBottom = (leftBottom + rightBottom) / 2;
      const midY = (yBottom + yTop) / 2;
      const midWidthLeft = xForWidth(
        (panel.wBottom + panel.wTop) / 2,
        config.bottomWidthMeters,
        "left"
      );
      const midWidthRight = xForWidth(
        (panel.wBottom + panel.wTop) / 2,
        config.bottomWidthMeters,
        "right"
      );

      const baseElements: LineElement[] = [
        {
          id: `leg-left-${panel.panelIndex}`,
          x1: leftBottom,
          y1: yBottom,
          x2: leftTop,
          y2: yTop,
          strokeWidth: 5,
          color: "#11233c",
          tooltip: elementTooltipData({
            elementType: `Leg segment | Panel ${panel.panelIndex}`,
            lengthMeters: panel.legLength,
            section: member.legSection,
            steel: member.legSteel,
            fyMpa: member.legFyMpa,
            role: "leg",
            sourceCitation: "ASCE 10-15 §2.3 + §3.4",
            unitSystem
          })
        },
        {
          id: `leg-right-${panel.panelIndex}`,
          x1: rightBottom,
          y1: yBottom,
          x2: rightTop,
          y2: yTop,
          strokeWidth: 5,
          color: "#11233c",
          tooltip: elementTooltipData({
            elementType: `Leg segment | Panel ${panel.panelIndex}`,
            lengthMeters: panel.legLength,
            section: member.legSection,
            steel: member.legSteel,
            fyMpa: member.legFyMpa,
            role: "leg",
            sourceCitation: "ASCE 10-15 §2.3 + §3.4",
            unitSystem
          })
        },
        {
          id: `horizontal-${panel.panelIndex}`,
          x1: leftBottom,
          y1: yBottom,
          x2: rightBottom,
          y2: yBottom,
          strokeWidth: 2.5,
          color: "#cbd5e1",
          tooltip: elementTooltipData({
            elementType: `Horizontal chord | Panel ${panel.panelIndex}`,
            lengthMeters: panel.horizontal,
            section: member.horizontalSection,
            steel: member.bracingSteel,
            fyMpa: member.bracingFyMpa,
            role: "redundant",
            sourceCitation: "Linear taper geometry + ASCE 10-15 §3.4",
            unitSystem
          })
        }
      ];

      if (panel.bracingType === "K" && panel.kBraceDiag && panel.subHorizontal) {
        const kTargetY = config.bracing === "K-Down" ? midY + 16 : yTop;
        const kTargetX = config.bracing === "K-Down" ? midBottom : midTop;

        baseElements.push(
          {
            id: `k1-${panel.panelIndex}`,
            x1: leftBottom,
            y1: config.bracing === "K-Down" ? yTop : yBottom,
            x2: kTargetX,
            y2: kTargetY,
            strokeWidth: 3,
            color: "#64748b",
            tooltip: elementTooltipData({
              elementType: `K-brace diagonal | Panel ${panel.panelIndex}`,
              lengthMeters: panel.kBraceDiag,
              section: member.diagonalSection,
              steel: member.bracingSteel,
              fyMpa: member.bracingFyMpa,
              role: "bracing",
              sourceCitation: "Elementary geometry + TSTower/ASCE node logic",
              unitSystem
            })
          },
          {
            id: `k2-${panel.panelIndex}`,
            x1: rightBottom,
            y1: config.bracing === "K-Down" ? yTop : yBottom,
            x2: kTargetX,
            y2: kTargetY,
            strokeWidth: 3,
            color: "#64748b",
            tooltip: elementTooltipData({
              elementType: `K-brace diagonal | Panel ${panel.panelIndex}`,
              lengthMeters: panel.kBraceDiag,
              section: member.diagonalSection,
              steel: member.bracingSteel,
              fyMpa: member.bracingFyMpa,
              role: "bracing",
              sourceCitation: "Elementary geometry + TSTower/ASCE node logic",
              unitSystem
            })
          },
          {
            id: `sub-horizontal-${panel.panelIndex}`,
            x1: midWidthLeft,
            y1: midY,
            x2: midWidthRight,
            y2: midY,
            strokeWidth: 2.5,
            color: "#94a3b8",
            tooltip: elementTooltipData({
              elementType: `K sub-horizontal | Panel ${panel.panelIndex}`,
              lengthMeters: panel.subHorizontal,
              section: member.horizontalSection,
              steel: member.bracingSteel,
              fyMpa: member.bracingFyMpa,
              role: "redundant",
              sourceCitation: "Mid-panel width approximation from linear taper",
              unitSystem
            })
          }
        );
      }

      if (panel.hipBraceDiag) {
        baseElements.push({
          id: `hip-${panel.panelIndex}`,
          x1: leftTop - 18,
          y1: yTop,
          x2: rightTop + 18,
          y2: yTop,
          strokeWidth: 2.5,
          color: "#94a3b8",
          tooltip: elementTooltipData({
            elementType: `Hip-brace line | Panel ${panel.panelIndex}`,
            lengthMeters: panel.hipBraceDiag,
            section: member.diagonalSection,
            steel: member.bracingSteel,
            fyMpa: member.bracingFyMpa,
            role: "redundant",
            sourceCitation: "Square-plan diagonal geometry + ASCE 10-15 §2.3",
            unitSystem
          })
        });
      }

      return baseElements;
    });
  }, [config, memberProfiles, panels, unitSystem]);

  function setHover(data: TooltipCardData, event: React.MouseEvent<SVGLineElement>) {
    if (!hoverEnabled || compact) {
      return;
    }

    setHoveredId((event.currentTarget.dataset.elementId as string) ?? null);
    setTooltip(data);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }

  function clearHover() {
    setHoveredId(null);
    setTooltip(null);
  }

  return (
    <section className={`panel-card overflow-hidden ${compact ? "p-4" : "p-6"}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">
            {compact ? "Compare view tower" : "Persistent tower sidebar"}
          </p>
          <h2 className="section-title">{title}</h2>
          {!compact ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Hover any leg, brace, or chord to inspect its calculated length,
              member section, steel grade, and KL/r status. Click a panel to open
              the full calculation drawer.
            </p>
          ) : null}
        </div>
        {!compact ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-verified/30 bg-verified/10 px-3 py-1 text-xs font-medium text-verified">
              Hover-to-inspect
            </span>
            <span className="rounded-full border border-literature/30 bg-literature/10 px-3 py-1 text-xs font-medium text-literature">
              Click a panel for full arithmetic
            </span>
          </div>
        ) : null}
      </div>

      {show3D ? (
        <div className="space-y-4">
          <IsometricView
            config={config}
            panels={panels}
            windForces={windForces}
            stressMode={showStress}
            onPanelSelect={onPanelSelect}
          />
          <div className="flex items-center justify-between rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-steel">
            <span>Isometric mode shows all four legs and plan bracing context.</span>
            <span>Click any front panel to inspect.</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 670 860"
            className="min-w-[620px] rounded-[28px] border border-line bg-gradient-to-b from-white to-slate-50"
            role="img"
            aria-label="Interactive telecom tower front elevation"
          >
            <defs>
              <marker
                id="width-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#475569" />
              </marker>
            </defs>

            <rect x="0" y="0" width="670" height="860" fill="transparent" />

            <line
              x1="70"
              y1="60"
              x2="70"
              y2="700"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {Array.from({ length: config.panelCount + 1 }, (_, index) => {
              const elevation = (config.heightMeters / config.panelCount) * index;
              const y = yForElevation(elevation, config.heightMeters);

              return (
                <g key={`axis-${elevation}`}>
                  <line x1="64" y1={y} x2="76" y2={y} stroke="#94a3b8" />
                  <text
                    x="12"
                    y={y + 4}
                    fontSize="12"
                    fill="#475569"
                    fontFamily="var(--font-mono)"
                  >
                    {elevation.toFixed(0)} m
                  </text>
                </g>
              );
            })}

            {panels.map((panel, index) => {
              const yBottom = yForElevation(panel.elevBottom, config.heightMeters);
              const yTop = yForElevation(panel.elevTop, config.heightMeters);
              const leftBottom = xForWidth(
                panel.wBottom,
                config.bottomWidthMeters,
                "left"
              );
              const rightBottom = xForWidth(
                panel.wBottom,
                config.bottomWidthMeters,
                "right"
              );
              const leftTop = xForWidth(
                panel.wTop,
                config.bottomWidthMeters,
                "left"
              );
              const rightTop = xForWidth(
                panel.wTop,
                config.bottomWidthMeters,
                "right"
              );
              const windPanel = windForces.find((row) => row.panelNumber === panel.panelIndex);
              const stressColor = windPanel
                ? utilisationColor(windPanel.demandIndex)
                : "rgba(219, 234, 254, 0.35)";

              return (
                <g
                  key={panel.panelIndex}
                  className="tower-panel-animate"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <polygon
                    points={`${leftBottom},${yBottom} ${rightBottom},${yBottom} ${rightTop},${yTop} ${leftTop},${yTop}`}
                    fill={showStress ? stressColor : "rgba(148, 163, 184, 0.05)"}
                    opacity={showStress ? 0.4 : 1}
                    stroke="transparent"
                    className="cursor-pointer transition-opacity duration-300 hover:opacity-90"
                    onClick={() => onPanelSelect(panel.panelIndex)}
                  />
                  <text
                    x={(leftBottom + rightBottom + leftTop + rightTop) / 4}
                    y={(yBottom + yTop) / 2 + 5}
                    textAnchor="middle"
                    fontSize="13"
                    fill="#11233c"
                    fontFamily="var(--font-sans)"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    P{panel.panelIndex}
                  </text>
                </g>
              );
            })}

            {lineElements.map((element) => (
              <line
                key={element.id}
                data-element-id={element.id}
                x1={element.x1}
                y1={element.y1}
                x2={element.x2}
                y2={element.y2}
                stroke={hoveredId === element.id ? "#f59e0b" : element.color}
                strokeWidth={hoveredId === element.id ? element.strokeWidth + 1.4 : element.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={element.id.startsWith("hip-") ? "8 6" : undefined}
                className="transition-all duration-300"
                onMouseEnter={(event) => setHover(element.tooltip, event)}
                onMouseMove={(event) =>
                  hoverEnabled && !compact
                    ? setTooltipPosition({ x: event.clientX, y: event.clientY })
                    : undefined
                }
                onMouseLeave={clearHover}
              />
            ))}

            {config.appurtenances ? (
              <>
                {[0.8, 0.9, 0.97].map((ratio) => {
                  const elevation = ratio * config.heightMeters;
                  const y = yForElevation(elevation, config.heightMeters);
                  const width = xForWidth(midWidth, config.bottomWidthMeters, "right");
                  const left = xForWidth(midWidth, config.bottomWidthMeters, "left");

                  return (
                    <line
                      key={`platform-${ratio}`}
                      x1={left - 24}
                      y1={y}
                      x2={width + 24}
                      y2={y}
                      stroke="#0f766e"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                })}
                {[0.83, 0.93].map((ratio) => {
                  const elevation = ratio * config.heightMeters;
                  const y = yForElevation(elevation, config.heightMeters);
                  const right = xForWidth(midWidth, config.bottomWidthMeters, "right");
                  const left = xForWidth(midWidth, config.bottomWidthMeters, "left");

                  return (
                    <g key={`dish-${ratio}`}>
                      <line
                        x1={left - 8}
                        y1={y}
                        x2={left - 34}
                        y2={y - 10}
                        stroke="#475569"
                        strokeWidth="2"
                      />
                      <line
                        x1={right + 8}
                        y1={y}
                        x2={right + 34}
                        y2={y - 10}
                        stroke="#475569"
                        strokeWidth="2"
                      />
                      <circle cx={left - 38} cy={y - 12} r="10" fill="#f59e0b" />
                      <circle cx={right + 38} cy={y - 12} r="10" fill="#f59e0b" />
                    </g>
                  );
                })}
              </>
            ) : null}

            <g>
              <line
                x1={xForWidth(config.bottomWidthMeters, config.bottomWidthMeters, "left")}
                y1={744}
                x2={xForWidth(config.bottomWidthMeters, config.bottomWidthMeters, "right")}
                y2={744}
                stroke="#475569"
                strokeWidth="1.5"
                markerStart="url(#width-arrow)"
                markerEnd="url(#width-arrow)"
              />
              <text x="335" y="736" textAnchor="middle" fontSize="12" fill="#475569">
                Base {config.bottomWidthMeters.toFixed(1)} m
              </text>

              <line
                x1={xForWidth(midWidth, config.bottomWidthMeters, "left")}
                y1={430}
                x2={xForWidth(midWidth, config.bottomWidthMeters, "right")}
                y2={430}
                stroke="#475569"
                strokeWidth="1.5"
                markerStart="url(#width-arrow)"
                markerEnd="url(#width-arrow)"
              />
              <text x="335" y="422" textAnchor="middle" fontSize="12" fill="#475569">
                Mid {(midWidth).toFixed(1)} m
              </text>

              <line
                x1={xForWidth(config.topWidthMeters, config.bottomWidthMeters, "left")}
                y1={88}
                x2={xForWidth(config.topWidthMeters, config.bottomWidthMeters, "right")}
                y2={88}
                stroke="#475569"
                strokeWidth="1.5"
                markerStart="url(#width-arrow)"
                markerEnd="url(#width-arrow)"
              />
              <text x="335" y="80" textAnchor="middle" fontSize="12" fill="#475569">
                Top {config.topWidthMeters.toFixed(1)} m
              </text>
            </g>

            <g transform="translate(500, 728)">
              <rect
                x="0"
                y="0"
                width="132"
                height="96"
                rx="20"
                fill="#0d1a2d"
                stroke="#1e3a5f"
              />
              <text x="14" y="18" fontSize="11" fill="#94a3b8">
                Plan view
              </text>
              <g transform="translate(12, 18)">{planViewThumbnail(config.plan)}</g>
            </g>
          </svg>
        </div>
      )}

      {showStress ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-steel">
          <span className="font-medium text-navy">
            Stress visualization mode:
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#2ecc71]" />
            Low
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#facc15]" />
            Moderate
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
            High
          </span>
          <span>Schematic only — qualitative load distribution.</span>
        </div>
      ) : null}

      {hoverEnabled && !compact ? (
        <Tooltip x={tooltipPosition.x} y={tooltipPosition.y} data={tooltip} />
      ) : null}
    </section>
  );
}
