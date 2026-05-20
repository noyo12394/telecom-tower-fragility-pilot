"use client";

import { tierClasses, type TraceabilityRow } from "@/lib/sources";

interface AssumptionsPanelProps {
  rows: TraceabilityRow[];
}

const LIMITATIONS = [
  "The current triangular-plan toggle is still mostly visual. Most calculations remain square-face pilot calculations unless a dedicated triangular formulation is added.",
  "Some angle-section properties use the nearest available comparable AISC angle when an exact lightweight section is not embedded.",
  "Stress visualization and panel wind-force distributions are schematic. They help with qualitative interpretation but do not replace formal structural analysis.",
  "Panel solidity is approximated from member-size trends rather than measured from an exact panel mesh.",
  "Connection design, foundation sizing, serviceability verification, and final member adequacy still require formal code-based structural analysis."
];

export function AssumptionsPanel({ rows }: AssumptionsPanelProps) {
  const grouped = {
    "Code-Verified": rows.filter((row) => row.tier === "Code-Verified"),
    "Literature-Backed": rows.filter((row) => row.tier === "Literature-Backed"),
    "Derived/Assumed": rows.filter((row) => row.tier === "Derived/Assumed")
  };

  return (
    <section className="space-y-6">
      <div className="panel-card p-6">
        <div className="mb-5">
          <p className="micro-label">Assumptions and limitations</p>
          <h2 className="section-title">What Is Exact vs Approximate</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            This panel is here to make the honesty system explicit during a
            professor meeting. It separates exact clauses, literature-backed
            choices, and the pilot assumptions that still need deeper analysis.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {(
            Object.entries(grouped) as Array<
              [keyof typeof grouped, TraceabilityRow[]]
            >
          ).map(([tier, tierRows]) => (
            <div
              key={tier}
              className="rounded-2xl border border-line bg-slate-50 p-4"
            >
              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                  tier
                )}`}
              >
                {tier}
              </span>
              <p className="mt-3 text-2xl font-semibold text-navy">
                {tierRows.length}
              </p>
              <p className="mt-1 text-sm text-steel">Tracked parameters</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-steel">
                {tierRows.slice(0, 5).map((row) => (
                  <li key={`${tier}-${row.parameter}`}>
                    <strong className="text-navy">{row.parameter}:</strong>{" "}
                    {row.value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card p-6">
        <div className="mb-4">
          <p className="micro-label">Still needs structural verification</p>
          <h2 className="section-title">Current model limitations</h2>
        </div>
        <ul className="space-y-3 text-sm leading-6 text-steel">
          {LIMITATIONS.map((limitation) => (
            <li
              key={limitation}
              className="rounded-2xl border border-line bg-slate-50 px-4 py-3"
            >
              {limitation}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

