"use client";

import { type MaterialEstimate } from "@/lib/materialQuantity";

interface MaterialChartProps {
  estimate: MaterialEstimate;
}

export function MaterialChart({ estimate }: MaterialChartProps) {
  const total = Math.max(estimate.totalMassKg, 1);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <section className="panel-card p-6">
      <div className="mb-5">
        <p className="micro-label">Material estimate</p>
        <h2 className="section-title">Approximate Steel Quantity</h2>
        <p className="mt-2 text-sm leading-6 text-steel">
          Approximate quantity estimate only — no waste, splices, connections,
          or fabrication allowances included.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-slate-50 p-4">
          <svg viewBox="0 0 220 220" className="h-56 w-56">
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="28"
            />
            {estimate.breakdown
              .filter((item) => item.massKg > 0)
              .map((item) => {
                const fraction = item.massKg / total;
                const dash = `${fraction * circumference} ${circumference}`;
                const segment = (
                  <circle
                    key={item.key}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="28"
                    strokeDasharray={dash}
                    strokeDashoffset={-runningOffset}
                    strokeLinecap="butt"
                    transform="rotate(-90 110 110)"
                  />
                );
                runningOffset += fraction * circumference;
                return segment;
              })}
            <text
              x="110"
              y="102"
              textAnchor="middle"
              className="fill-navy text-[12px] font-medium"
            >
              Total steel
            </text>
            <text
              x="110"
              y="128"
              textAnchor="middle"
              className="fill-navy text-[22px] font-semibold"
            >
              {(estimate.totalMassKg / 1000).toFixed(2)} t
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          {estimate.breakdown.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-navy">{item.label}</p>
                    <p className="text-xs text-steel">
                      {item.lengthMeters.toFixed(1)} linear m
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-navy">
                  {item.massKg.toFixed(1)} kg
                </p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-line bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-navy">Section summary</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-steel">
                  <tr>
                    <th className="pb-2 pr-4">Section</th>
                    <th className="pb-2 pr-4">Comparable lookup</th>
                    <th className="pb-2 pr-4">Length (m)</th>
                    <th className="pb-2 pr-4">kg/m</th>
                    <th className="pb-2">Mass (kg)</th>
                  </tr>
                </thead>
                <tbody className="align-top text-navy">
                  {estimate.sections.map((row) => (
                    <tr key={row.section} className="border-t border-line/70">
                      <td className="py-2 pr-4 font-medium">{row.section}</td>
                      <td className="py-2 pr-4">{row.comparableSection}</td>
                      <td className="py-2 pr-4">{row.totalLengthMeters.toFixed(1)}</td>
                      <td className="py-2 pr-4">{row.unitWeightKgPerM.toFixed(2)}</td>
                      <td className="py-2">{row.totalMassKg.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

