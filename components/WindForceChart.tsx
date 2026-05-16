"use client";

import { type PanelWindForce } from "@/lib/windForce";

interface WindForceChartProps {
  rows: PanelWindForce[];
}

export function WindForceChart({ rows }: WindForceChartProps) {
  const maxForce = Math.max(...rows.map((row) => row.forceN), 1);
  const height = rows.length * 34 + 60;
  const centerlineX = 260;

  return (
    <section className="panel-card p-6">
      <div className="mb-5">
        <p className="micro-label">Wind loads</p>
        <h2 className="section-title">Wind Force per Panel</h2>
        <p className="mt-2 text-sm leading-6 text-steel">
          Simplified wind load distribution — schematic only. Formal analysis
          requires ASCE 10-15 §2.4 methods.
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 620 ${height}`}
          className="min-w-[600px] rounded-[28px] border border-line bg-slate-50"
          role="img"
          aria-label="Simplified wind force per panel chart"
        >
          <line
            x1={centerlineX}
            y1="20"
            x2={centerlineX}
            y2={height - 20}
            stroke="#94a3b8"
            strokeDasharray="6 6"
            strokeWidth="2"
          />

          {rows.map((row, index) => {
            const y = 38 + index * 34;
            const width = (row.forceN / maxForce) * 200;

            return (
              <g key={row.panelNumber}>
                <text
                  x="24"
                  y={y + 5}
                  className="fill-slate-600 text-[12px] font-medium"
                >
                  P{row.panelNumber}
                </text>
                <rect
                  x={centerlineX - width}
                  y={y - 10}
                  width={width}
                  height="18"
                  rx="9"
                  fill={row.color}
                />
                <text
                  x={centerlineX + 14}
                  y={y + 4}
                  className="fill-slate-700 text-[12px]"
                >
                  {row.forceN.toFixed(0)} N | cumulative shear{" "}
                  {row.cumulativeBaseShearN.toFixed(0)} N
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

