"use client";

import { useMemo } from "react";

import { type DesignCheckSummary } from "@/lib/designChecks";
import {
  buildFinalSummary,
  generateDraftDesign,
  runUpdateLoop,
  type WorkflowBadge
} from "@/lib/designGenerator";
import { type EndCondition } from "@/lib/slenderness";
import {
  formatLengthShort,
  type TowerConfig,
  type UnitSystem
} from "@/lib/tower";

interface DesignWorkflowProps {
  config: TowerConfig;
  checks: DesignCheckSummary;
  unitSystem: UnitSystem;
  endCondition: EndCondition;
}

function badgeClasses(badge: WorkflowBadge) {
  if (badge === "Updated after check") {
    return "border-literature/30 bg-literature/10 text-literature";
  }

  if (badge === "Literature Baseline") {
    return "border-verified/30 bg-verified/10 text-verified";
  }

  return "border-derived/30 bg-derived/10 text-derived";
}

function Badge({ badge }: { badge: WorkflowBadge }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${badgeClasses(
        badge
      )}`}
    >
      {badge}
    </span>
  );
}

function StepHeader({
  number,
  label
}: {
  number: string;
  label: string;
}) {
  return (
    <div>
      <p className="micro-label">Step {number}</p>
      <h2 className="section-title">{label}</h2>
    </div>
  );
}

export function DesignWorkflow({
  config,
  checks,
  unitSystem,
  endCondition
}: DesignWorkflowProps) {
  const draft = useMemo(() => generateDraftDesign(config), [config]);
  const updated = useMemo(() => runUpdateLoop(draft, checks), [checks, draft]);
  const finalSummary = useMemo(() => buildFinalSummary(updated), [updated]);

  return (
    <section className="space-y-6">
      <div className="panel-card p-6">
        <p className="micro-label">Design workflow</p>
        <h2 className="section-title">Input → Draft Design → Design Checks → Update Design → Final Design</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-navy">
          <span>① Inputs</span>
          <span>→</span>
          <span>② Draft</span>
          <span>→</span>
          <span>③ Checks</span>
          <span>→</span>
          <span>④ Update</span>
          <span>→</span>
          <span>⑤ Final</span>
        </div>
      </div>

      <div className="panel-card p-6">
        <StepHeader number="1" label="Inputs" />
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Height", `${config.heightMeters} m`],
            ["Base", `${config.bottomWidthMeters.toFixed(1)} m`],
            ["Top", `${config.topWidthMeters.toFixed(1)} m`],
            ["Wind", `${config.windSpeedMph} mph`],
            ["Bracing", config.bracing],
            ["Panels", `${config.panelCount}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line bg-slate-50 p-4">
              <p className="text-xs font-medium text-steel">{label}</p>
              <p className="mt-2 text-base font-semibold text-navy">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card overflow-x-auto p-6">
        <StepHeader number="2" label="Draft Design" />
        <table className="mt-4 min-w-full text-left text-sm">
          <thead className="text-steel">
            <tr>
              <th className="border-b border-line px-3 py-3">Panel</th>
              <th className="border-b border-line px-3 py-3">Leg section</th>
              <th className="border-b border-line px-3 py-3">K diagonal</th>
              <th className="border-b border-line px-3 py-3">Horizontal</th>
              <th className="border-b border-line px-3 py-3">Leg length</th>
              <th className="border-b border-line px-3 py-3">Badge</th>
            </tr>
          </thead>
          <tbody>
            {draft.rows.map((row) => (
              <tr key={row.panelNumber}>
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  P{row.panelNumber}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {row.legSection}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {row.diagonalSection}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {row.horizontalSection}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {formatLengthShort(row.legLengthMeters, unitSystem)}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <Badge badge={row.badge} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-card overflow-x-auto p-6">
        <StepHeader number="3" label="Design Checks" />
        <p className="mt-2 text-sm leading-6 text-steel">
          Leg rows use {endCondition === "fixed-free" ? "fixed-free K=2" : "pin-pin K=1"} end conditions.
          Bracing and horizontals are checked by admissible stress only.
        </p>
        <table className="mt-4 min-w-full text-left text-sm">
          <thead className="text-steel">
            <tr>
              <th className="border-b border-line px-3 py-3">Panel</th>
              <th className="border-b border-line px-3 py-3">Element</th>
              <th className="border-b border-line px-3 py-3">Section</th>
              <th className="border-b border-line px-3 py-3">KL/r</th>
              <th className="border-b border-line px-3 py-3">σ demand</th>
              <th className="border-b border-line px-3 py-3">σcr</th>
              <th className="border-b border-line px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.worstItems.map((item) => (
              <tr key={item.id}>
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  P{item.panelNumber}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.elementType}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.section}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.klr.toFixed(1)}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.sigmaDemandMpa.toFixed(2)} MPa
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.role === "leg"
                    ? `${item.result.sigmaCreMpa.toFixed(1)} MPa`
                    : "Stress only"}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-card overflow-x-auto p-6">
        <StepHeader number="4" label="Updated Design" />
        <table className="mt-4 min-w-full text-left text-sm">
          <thead className="text-steel">
            <tr>
              <th className="border-b border-line px-3 py-3">Panel</th>
              <th className="border-b border-line px-3 py-3">Draft leg</th>
              <th className="border-b border-line px-3 py-3">Final leg</th>
              <th className="border-b border-line px-3 py-3">Status</th>
              <th className="border-b border-line px-3 py-3">Badge</th>
            </tr>
          </thead>
          <tbody>
            {updated.rows.map((row) => (
              <tr key={row.panelNumber}>
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  P{row.panelNumber}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {row.legSection}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {row.finalLegSection}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {row.status}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <Badge badge={row.badge} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-card p-6">
        <StepHeader number="5" label="Final Summary" />
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Panels", `${finalSummary.panelCount}`],
            ["Updated legs", `${finalSummary.updatedCount}`],
            ["Pass", `${finalSummary.passCount}`],
            ["Close", `${finalSummary.closeCount}`],
            ["Exceeds", `${finalSummary.exceedCount}`],
            ["Steel", `${(finalSummary.estimatedSteelKg / 1000).toFixed(2)} t`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line bg-slate-50 p-4">
              <p className="text-xs font-medium text-steel">{label}</p>
              <p className="mt-2 text-base font-semibold text-navy">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
