"use client";

import { type DesignCheckSummary } from "@/lib/designChecks";
import { type EndCondition } from "@/lib/slenderness";
import { formatLengthShort, type UnitSystem } from "@/lib/tower";

interface DesignChecksProps {
  summary: DesignCheckSummary;
  unitSystem: UnitSystem;
  endCondition: EndCondition;
  onEndConditionChange: (condition: EndCondition) => void;
}

function severityClasses(severity: "info" | "caution" | "warning") {
  if (severity === "warning") {
    return "border-red-500/30 bg-red-500/10 text-red-700";
  }

  if (severity === "caution") {
    return "border-literature/30 bg-literature/10 text-literature";
  }

  return "border-derived/30 bg-derived/10 text-derived";
}

function statusClasses(status: "pass" | "close" | "exceeds") {
  if (status === "pass") {
    return "bg-verified/10 text-verified border-verified/30";
  }

  if (status === "close") {
    return "bg-literature/10 text-literature border-literature/30";
  }

  return "bg-red-500/10 text-red-700 border-red-500/30";
}

function basisLabel(role: string) {
  return role === "leg" ? "Leg buckling + stress" : "Admissible stress only";
}

export function DesignChecks({
  summary,
  unitSystem,
  endCondition,
  onEndConditionChange
}: DesignChecksProps) {
  const totalChecks =
    summary.counts.pass + summary.counts.close + summary.counts.exceeds;
  const worstItem = summary.worstItems[0];

  return (
    <section className="space-y-6">
      <div className="panel-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="micro-label">Design checks</p>
            <h2 className="section-title">Dedicated Review Summary</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
              This tab separates the professor's two screening checks: admissible
              stress for all members and Euler buckling / KL/r for leg members only.
            </p>
          </div>
          <div className="flex rounded-2xl border border-line bg-slate-50 p-1">
            {[
              { key: "pin-pin" as const, label: "Pin-pin (K=1)" },
              { key: "fixed-free" as const, label: "Fixed-free (K=2)" }
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onEndConditionChange(option.key)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                  endCondition === option.key
                    ? "bg-navy text-white"
                    : "text-navy hover:bg-white"
                }`}
                aria-pressed={endCondition === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Checks run",
              value: `${totalChecks}`,
              note: "Stress screens plus leg buckling"
            },
            {
              label: "Pass",
              value: `${summary.counts.pass}`,
              note: "Below preliminary limit"
            },
            {
              label: "Close",
              value: `${summary.counts.close}`,
              note: "Within 10% of limit"
            },
            {
              label: "Exceeds",
              value: `${summary.counts.exceeds}`,
              note: "Needs redesign / verification"
            },
            {
              label: "Worst panel",
              value: summary.worstPanelNumber ? `P${summary.worstPanelNumber}` : "n/a",
              note: `Worst KL/r ${summary.worstKlr.toFixed(1)}`
            }
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-line bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-steel">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-navy">{card.value}</p>
              <p className="mt-1 text-xs leading-5 text-steel">{card.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card p-6">
        <p className="micro-label">Check basis</p>
        <h3 className="section-title">Buckling check scope</h3>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-steel md:grid-cols-3">
          <div className="rounded-2xl border border-verified/30 bg-verified/10 p-4 text-verified">
            <p className="font-semibold">Leg members</p>
            <p>KL/r check + Euler σcr screen applied</p>
          </div>
          <div className="rounded-2xl border border-line bg-slate-50 p-4">
            <p className="font-semibold text-navy">K-brace diagonals</p>
            <p>Admissible stress check only; K topology prevents buckling ambiguity.</p>
          </div>
          <div className="rounded-2xl border border-line bg-slate-50 p-4">
            <p className="font-semibold text-navy">Horizontals</p>
            <p>Admissible stress check only.</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-6 text-steel">
          Basis: ASCE 10-15 §3.4 slenderness and §3.6 compression context.
          Simplified screening only — not stamped code design.
          {endCondition === "fixed-free"
            ? " Fixed-free is a conservative flagpole assumption — Derived/Assumed."
            : ""}
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-card p-6">
          <div className="mb-4">
            <p className="micro-label">Validation engine</p>
            <h3 className="section-title">Active warnings and cautions</h3>
          </div>

          <div className="space-y-3">
            {summary.warnings.length ? (
              summary.warnings.map((warning) => (
                <article
                  key={warning.id}
                  className={`rounded-2xl border p-4 ${severityClasses(
                    warning.severity
                  )}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold">{warning.title}</h4>
                    <span className="rounded-full border border-current/20 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">
                      {warning.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6">{warning.detail}</p>
                  <p className="mt-2 text-[11px] leading-5 opacity-80">
                    Source: {warning.source}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-verified/30 bg-verified/10 p-4 text-sm text-verified">
                No active warnings are triggered for the current configuration.
              </div>
            )}
          </div>
        </div>

        <div className="panel-card p-6">
          <div className="mb-4">
            <p className="micro-label">Panel health</p>
            <h3 className="section-title">Most critical panels</h3>
          </div>

          <div className="space-y-3">
            {summary.panels
              .slice()
              .sort((left, right) => right.worstUtilization - left.worstUtilization)
              .slice(0, 8)
              .map((panel) => {
                const width = `${Math.min(panel.worstUtilization * 100, 100)}%`;
                const status =
                  panel.exceedCount > 0
                    ? "exceeds"
                    : panel.closeCount > 0
                    ? "close"
                    : "pass";

                return (
                  <div
                    key={panel.panelNumber}
                    className="rounded-2xl border border-line bg-slate-50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-navy">
                        Panel {panel.panelNumber}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusClasses(
                          status
                        )}`}
                      >
                        util. {(panel.worstUtilization * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white">
                      <div
                        className={`h-3 rounded-full ${
                          status === "pass"
                            ? "bg-verified"
                            : status === "close"
                            ? "bg-literature"
                            : "bg-red-600"
                        }`}
                        style={{ width }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-steel">
                      Pass {panel.passCount} | Close {panel.closeCount} | Exceeds{" "}
                      {panel.exceedCount}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="panel-card overflow-x-auto p-6">
        <div className="mb-4">
          <p className="micro-label">Worst checks</p>
          <h3 className="section-title">Critical member groups</h3>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="text-steel">
            <tr>
              <th className="border-b border-line px-3 py-3">Panel</th>
              <th className="border-b border-line px-3 py-3">Element</th>
              <th className="border-b border-line px-3 py-3">Basis</th>
              <th className="border-b border-line px-3 py-3">Section</th>
              <th className="border-b border-line px-3 py-3">Length</th>
              <th className="border-b border-line px-3 py-3">KL/r</th>
              <th className="border-b border-line px-3 py-3">Limit</th>
              <th className="border-b border-line px-3 py-3">σ demand</th>
              <th className="border-b border-line px-3 py-3">σ capacity</th>
              <th className="border-b border-line px-3 py-3">σcr</th>
              <th className="border-b border-line px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {summary.worstItems.map((item) => (
              <tr key={item.id}>
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  P{item.panelNumber}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.elementType}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {basisLabel(item.result.role)}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.section}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {formatLengthShort(item.lengthMeters, unitSystem)}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.klr.toFixed(1)}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.limit}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.sigmaDemandMpa.toFixed(2)} MPa
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.sigmaAdmissibleMpa.toFixed(1)} MPa
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {item.result.role === "leg"
                    ? `${item.result.sigmaCreMpa.toFixed(1)} MPa`
                    : "Legs only"}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusClasses(
                      item.result.status
                    )}`}
                  >
                    {item.result.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {worstItem ? (
          <p className="mt-4 text-sm leading-6 text-steel">
            Current governing check: Panel {worstItem.panelNumber},{" "}
            {worstItem.elementType}, section {worstItem.section}, KL/r{" "}
            {worstItem.result.klr.toFixed(1)} against a limit of{" "}
            {worstItem.result.limit}; σ demand{" "}
            {worstItem.result.sigmaDemandMpa.toFixed(2)} MPa.
          </p>
        ) : null}
      </div>
    </section>
  );
}
