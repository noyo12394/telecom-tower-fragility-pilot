"use client";

import { type DesignCheckSummary } from "@/lib/designChecks";
import { formatLengthShort, type UnitSystem } from "@/lib/tower";

interface DesignChecksProps {
  summary: DesignCheckSummary;
  unitSystem: UnitSystem;
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

export function DesignChecks({ summary, unitSystem }: DesignChecksProps) {
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
              This tab gathers the most important preliminary stability checks,
              warnings, and limit-state trends into one place so the review
              workflow is easier than scanning multiple tabs.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Checks run",
              value: `${totalChecks}`,
              note: "Representative member groups"
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
              <th className="border-b border-line px-3 py-3">Section</th>
              <th className="border-b border-line px-3 py-3">Length</th>
              <th className="border-b border-line px-3 py-3">KL/r</th>
              <th className="border-b border-line px-3 py-3">Limit</th>
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
            {worstItem.result.limit}.
          </p>
        ) : null}
      </div>
    </section>
  );
}

