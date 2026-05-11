import {
  generateTowerPanels,
  representativeDishElevations,
  representativePanelAntennaElevations,
  representativePlatformElevations,
  type TowerConfig
} from "@/lib/tower";

interface TowerVisualizerProps {
  config: TowerConfig;
}

function yForElevation(elevation: number, towerHeight: number) {
  const topMargin = 72;
  const drawHeight = 610;
  return topMargin + (1 - elevation / towerHeight) * drawHeight;
}

function xForWidth(width: number, baseWidth: number, side: "left" | "right") {
  const centerX = 335;
  const maxHalfSpan = 170;
  const halfSpan = (width / baseWidth) * maxHalfSpan;
  return side === "left" ? centerX - halfSpan : centerX + halfSpan;
}

function bracingSegments(
  bracingType: string,
  leftBottom: number,
  rightBottom: number,
  leftTop: number,
  rightTop: number,
  yBottom: number,
  yTop: number
) {
  const middleX = (leftBottom + rightBottom) / 2;
  const midY = (yBottom + yTop) / 2;

  if (bracingType === "X") {
    return [
      { x1: leftBottom, y1: yBottom, x2: rightTop, y2: yTop },
      { x1: rightBottom, y1: yBottom, x2: leftTop, y2: yTop }
    ];
  }

  if (bracingType === "Double K/K-B") {
    return [
      { x1: leftBottom, y1: yBottom, x2: middleX, y2: midY },
      { x1: leftTop, y1: yTop, x2: middleX, y2: midY },
      { x1: rightBottom, y1: yBottom, x2: middleX, y2: midY },
      { x1: rightTop, y1: yTop, x2: middleX, y2: midY }
    ];
  }

  if (bracingType === "K-Down") {
    return [
      { x1: leftTop, y1: yTop, x2: middleX, y2: midY + 18 },
      { x1: leftBottom, y1: yBottom, x2: middleX, y2: midY + 18 },
      { x1: rightTop, y1: yTop, x2: middleX, y2: midY + 18 },
      { x1: rightBottom, y1: yBottom, x2: middleX, y2: midY + 18 }
    ];
  }

  return [
    { x1: leftBottom, y1: yBottom, x2: middleX, y2: midY },
    { x1: leftTop, y1: yTop, x2: middleX, y2: midY },
    { x1: rightBottom, y1: yBottom, x2: middleX, y2: midY },
    { x1: rightTop, y1: yTop, x2: middleX, y2: midY }
  ];
}

export function TowerVisualizer({ config }: TowerVisualizerProps) {
  const panels = generateTowerPanels(config);
  const midWidth = (config.bottomWidthMeters + config.topWidthMeters) / 2;

  return (
    <section className="panel-card overflow-hidden p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">SVG visualizer</p>
          <h2 className="section-title">Tapered Front Elevation</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-literature/30 bg-literature/10 px-3 py-1 text-xs font-medium text-literature">
            Source-backed geometry workflow
          </span>
          <span className="rounded-full border border-derived/30 bg-derived/10 px-3 py-1 text-xs font-medium text-derived">
            Representative layout, not stamped design
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 670 860"
          className="min-w-[620px] rounded-[28px] border border-line bg-gradient-to-b from-white to-slate-50"
          role="img"
          aria-label="Telecom tower front elevation visualization"
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
                  fontFamily="var(--font-plex-mono)"
                >
                  {elevation.toFixed(0)} m
                </text>
              </g>
            );
          })}

          {panels.map((panel) => {
            const yBottom = yForElevation(
              panel.bottomElevationMeters,
              config.heightMeters
            );
            const yTop = yForElevation(panel.topElevationMeters, config.heightMeters);
            const leftBottom = xForWidth(
              panel.widthAtBottomMeters,
              config.bottomWidthMeters,
              "left"
            );
            const rightBottom = xForWidth(
              panel.widthAtBottomMeters,
              config.bottomWidthMeters,
              "right"
            );
            const leftTop = xForWidth(
              panel.widthAtTopMeters,
              config.bottomWidthMeters,
              "left"
            );
            const rightTop = xForWidth(
              panel.widthAtTopMeters,
              config.bottomWidthMeters,
              "right"
            );

            const segments = bracingSegments(
              panel.bracingType,
              leftBottom,
              rightBottom,
              leftTop,
              rightTop,
              yBottom,
              yTop
            );

            return (
              <g key={panel.panelNumber}>
                <line
                  x1={leftBottom}
                  y1={yBottom}
                  x2={rightBottom}
                  y2={yBottom}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                {segments.map((segment, index) => (
                  <line
                    key={`${panel.panelNumber}-${index}`}
                    x1={segment.x1}
                    y1={segment.y1}
                    x2={segment.x2}
                    y2={segment.y2}
                    stroke="#64748b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ))}
                {panel.hipBrace ? (
                  <line
                    x1={leftTop - 18}
                    y1={yTop}
                    x2={rightTop + 18}
                    y2={yTop}
                    stroke="#94a3b8"
                    strokeDasharray="8 6"
                    strokeWidth="2.5"
                  />
                ) : null}
                <text
                  x={(leftBottom + rightBottom + leftTop + rightTop) / 4}
                  y={(yBottom + yTop) / 2 + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fill="#11233c"
                  fontFamily="var(--font-space-grotesk)"
                  fontWeight="700"
                >
                  P{panel.panelNumber}
                </text>
              </g>
            );
          })}

          <line
            x1={xForWidth(config.bottomWidthMeters, config.bottomWidthMeters, "left")}
            y1={yForElevation(0, config.heightMeters)}
            x2={xForWidth(config.topWidthMeters, config.bottomWidthMeters, "left")}
            y2={yForElevation(config.heightMeters, config.heightMeters)}
            stroke="#11233c"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1={xForWidth(config.bottomWidthMeters, config.bottomWidthMeters, "right")}
            y1={yForElevation(0, config.heightMeters)}
            x2={xForWidth(config.topWidthMeters, config.bottomWidthMeters, "right")}
            y2={yForElevation(config.heightMeters, config.heightMeters)}
            stroke="#11233c"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {config.appurtenances
            ? representativePlatformElevations(config.heightMeters).map(
                (elevation, index) => {
                  const width = xForWidth(
                    (config.bottomWidthMeters + config.topWidthMeters) / 2,
                    config.bottomWidthMeters,
                    "right"
                  );
                  const y = yForElevation(elevation, config.heightMeters);
                  const left = xForWidth(
                    (config.bottomWidthMeters + config.topWidthMeters) / 2,
                    config.bottomWidthMeters,
                    "left"
                  );

                  return (
                    <g key={`platform-${index}`}>
                      <line
                        x1={left - 22}
                        y1={y}
                        x2={width + 22}
                        y2={y}
                        stroke="#0f766e"
                        strokeWidth="3"
                      />
                      <text
                        x={width + 28}
                        y={y + 4}
                        fontSize="11"
                        fill="#0f766e"
                        fontFamily="var(--font-plex-mono)"
                      >
                        platform
                      </text>
                    </g>
                  );
                }
              )
            : null}

          {config.appurtenances
            ? representativeDishElevations(config.heightMeters).map(
                (elevation, index) => {
                  const y = yForElevation(elevation, config.heightMeters);
                  const rightEdge = xForWidth(
                    elevation > config.heightMeters * 0.9
                      ? config.topWidthMeters * 1.1
                      : midWidth,
                    config.bottomWidthMeters,
                    "right"
                  );
                  const leftEdge = xForWidth(
                    elevation > config.heightMeters * 0.9
                      ? config.topWidthMeters * 1.1
                      : midWidth,
                    config.bottomWidthMeters,
                    "left"
                  );

                  return (
                    <g key={`dish-${index}`}>
                      <line
                        x1={rightEdge}
                        y1={y}
                        x2={rightEdge + 32}
                        y2={y}
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                      <circle
                        cx={rightEdge + 42}
                        cy={y}
                        r="9"
                        fill="#fff7ed"
                        stroke="#d97706"
                        strokeWidth="3"
                      />
                      <line
                        x1={leftEdge}
                        y1={y}
                        x2={leftEdge - 32}
                        y2={y}
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                      <circle
                        cx={leftEdge - 42}
                        cy={y}
                        r="9"
                        fill="#fff7ed"
                        stroke="#d97706"
                        strokeWidth="3"
                      />
                    </g>
                  );
                }
              )
            : null}

          {config.appurtenances
            ? representativePanelAntennaElevations(config.heightMeters).map(
                (elevation, index) => {
                  const y = yForElevation(elevation, config.heightMeters);
                  const right = xForWidth(
                    config.topWidthMeters * 1.05,
                    config.bottomWidthMeters,
                    "right"
                  );

                  return (
                    <g key={`panel-antenna-${index}`}>
                      <rect
                        x={right + 12}
                        y={y - 8}
                        width="12"
                        height="16"
                        rx="3"
                        fill="#eff6ff"
                        stroke="#2563eb"
                        strokeWidth="2"
                      />
                    </g>
                  );
                }
              )
            : null}

          <line
            x1={xForWidth(config.bottomWidthMeters, config.bottomWidthMeters, "left")}
            y1="720"
            x2={xForWidth(config.bottomWidthMeters, config.bottomWidthMeters, "right")}
            y2="720"
            stroke="#475569"
            strokeWidth="1.5"
            markerStart="url(#width-arrow)"
            markerEnd="url(#width-arrow)"
          />
          <text
            x="335"
            y="745"
            textAnchor="middle"
            fontSize="12"
            fill="#475569"
            fontFamily="var(--font-plex-mono)"
          >
            Base width = {config.bottomWidthMeters.toFixed(1)} m
          </text>

          <line
            x1={xForWidth(midWidth, config.bottomWidthMeters, "left")}
            y1="388"
            x2={xForWidth(midWidth, config.bottomWidthMeters, "right")}
            y2="388"
            stroke="#94a3b8"
            strokeWidth="1.2"
            markerStart="url(#width-arrow)"
            markerEnd="url(#width-arrow)"
          />
          <text
            x="335"
            y="380"
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontFamily="var(--font-plex-mono)"
          >
            Mid width ≈ {midWidth.toFixed(1)} m
          </text>

          <line
            x1={xForWidth(config.topWidthMeters, config.bottomWidthMeters, "left")}
            y1="78"
            x2={xForWidth(config.topWidthMeters, config.bottomWidthMeters, "right")}
            y2="78"
            stroke="#94a3b8"
            strokeWidth="1.2"
            markerStart="url(#width-arrow)"
            markerEnd="url(#width-arrow)"
          />
          <text
            x="335"
            y="56"
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontFamily="var(--font-plex-mono)"
          >
            Top width = {config.topWidthMeters.toFixed(1)} m
          </text>

          <g transform="translate(515 640)">
            <rect
              x="0"
              y="0"
              width="110"
              height="110"
              rx="22"
              fill="#f8fafc"
              stroke="#dbe3ee"
            />
            <text
              x="55"
              y="24"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              fontFamily="var(--font-plex-mono)"
            >
              Plan view
            </text>
            {config.plan === "Square" ? (
              <rect
                x="24"
                y="34"
                width="62"
                height="62"
                fill="none"
                stroke="#11233c"
                strokeWidth="3"
              />
            ) : (
              <polygon
                points="55,34 24,90 86,90"
                fill="none"
                stroke="#11233c"
                strokeWidth="3"
              />
            )}
            {config.plan === "Square" ? (
              <>
                {[24, 86].flatMap((x) => [34, 96].map((y) => ({ x, y }))).map(
                  (point, index) => (
                    <circle
                      key={`leg-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#11233c"
                    />
                  )
                )}
              </>
            ) : (
              <>
                <circle cx="55" cy="34" r="5" fill="#11233c" />
                <circle cx="24" cy="90" r="5" fill="#11233c" />
                <circle cx="86" cy="90" r="5" fill="#11233c" />
              </>
            )}
          </g>

          <text
            x="335"
            y="816"
            textAnchor="middle"
            fontSize="12"
            fill="#475569"
            fontFamily="var(--font-plex-mono)"
          >
            Representative upper-tower appurtenances shown when toggle is on.
          </text>
        </svg>
      </div>
    </section>
  );
}
