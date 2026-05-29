"use client";

import { useState, useMemo } from "react";
import { type TowerConfig, type PanelMemberProfile, type UnitSystem } from "@/lib/tower";
import { type PanelElementLengths } from "@/lib/elementLengths";
import { type DesignCheckSummary } from "@/lib/designChecks";
import {
  generateDraftDesign,
  runUpdateLoop,
  buildFinalSummary,
  type SectionBadge
} from "@/lib/designGenerator";

interface DesignWorkflowProps {
  config: TowerConfig;
  panels: PanelElementLengths[];
  memberProfiles: PanelMemberProfile[];
  checks: DesignCheckSummary;
  unitSystem: UnitSystem;
}

function badgePill(badge: SectionBadge) {
  if (badge === "Literature Baseline") {
    return (
      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-700">
        Literature Baseline
      </span>
    );
  }
  if (badge === "Updated after check") {
    return (
      <span className="rounded-full border border-verified/30 bg-verified/10 px-2 py-1 text-[11px] font-medium text-verified">
        Updated after check
      </span>
    );
  }
  return (
    <span className="rounded-full border border-literature/30 bg-literature/10 px-2 py-1 text-[11px] font-medium text-literature">
      Derived/Assumed
    </span>
  );
}

function statusPill(status: "pass" | "close" | "exceeds") {
  if (status === "pass") {
    return (
      <span className="rounded-full border border-verified/30 bg-verified/10 px-2 py-1 text-[11px] font-medium text-verified">
        Pass
      </span>
    );
  }
  if (status === "close") {
    return (
      <span className="rounded-full border border-literature/30 bg-literature/10 px-2 py-1 text-[11px] font-medium text-literature">
        Close
      </span>
    );
  }
  return (
    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-700">
      Exceeds
    </span>
  );
}

export function DesignWorkflow({
  config,
  panels,
  memberProfiles,
  checks
}: DesignWorkflowProps) {
  const [endCondition, setEndCondition] = useState<"pin-pin" | "fixed-free">("pin-pin");

  const draft = useMemo(
    () => generateDraftDesign(panels, memberProfiles),
    [panels, memberProfiles]
  );

  const updated = useMemo(
    () => runUpdateLoop(draft, endCondition),
    [draft, endCondition]
  );

  const summary = useMemo(
    () => buildFinalSummary(updated),
    [updated]
  );

  return (
    <div className="space-y-6">
      {/* Progress row */}
      <div className="panel-card p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-navy">
          <span className="rounded-full border border-navy/20 bg-navy/5 px-3 py-1">① Inputs</span>
          <span className="text-steel">→</span>
          <span className="rounded-full border border-navy/20 bg-navy/5 px-3 py-1">② Draft</span>
          <span className="text-steel">→</span>
          <span className="rounded-full border border-navy/20 bg-navy/5 px-3 py-1">③ Checks</span>
          <span className="text-steel">→</span>
          <span className="rounded-full border border-navy/20 bg-navy/5 px-3 py-1">④ Update</span>
          <span className="text-steel">→</span>
          <span className="rounded-full border border-navy/20 bg-navy/5 px-3 py-1">⑤ Final</span>
        </div>
      </div>

      {/* Step 1 – Inputs */}
      <div className="panel-card p-6">
        <p className="micro-label">Step 1</p>
        <h2 className="section-title">Inputs</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Height", value: `${config.heightMeters} m` },
            { label: "Base width", value: `${config.bottomWidthMeters.toFixed(1)} m` },
            { label: "Top width", value: `${config.topWidthMeters.toFixed(1)} m` },
            { label: "Wind speed", value: `${config.windSpeedMph} mph` },
            { label: "Bracing", value: config.bracing },
            { label: "Panels", value: `${config.panelCount}` },
            { label: "Exposure", value: config.exposure },
            { label: "Risk Category", value: config.riskCategory }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-steel">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-navy">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2 – Draft Design */}
      <div className="panel-card p-6">
        <p className="micro-label">Step 2</p>
        <h2 className="section-title">Draft Design</h2>
        <p className="mt-2 text-sm leading-6 text-steel">
          Literature baseline sections from Bilionis &amp; Vamvatsikos 2019 mapping.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-steel">
              <tr>
                <th className="border-b border-line px-3 py-3">Panel</th>
                <th className="border-b border-line px-3 py-3">Elevation</th>
                <th className="border-b border-line px-3 py-3">Leg Section</th>
                <th className="border-b border-line px-3 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {draft.rows.map((row) => (
                <tr key={row.panelNumber}>
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    P{row.panelNumber}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3 text-steel">
                    {row.elevBottom.toFixed(1)}–{row.elevTop.toFixed(1)} m
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">{row.legSection}</td>
                  <td className="border-b border-line/70 px-3 py-3">{badgePill(row.badge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 3 – Design Checks */}
      <div className="panel-card p-6">
        <p className="micro-label">Step 3</p>
        <h2 className="section-title">Design Checks</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-medium text-navy">End condition:</span>
          <button
            type="button"
            onClick={() => setEndCondition("pin-pin")}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              endCondition === "pin-pin"
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-navy hover:bg-slate-50"
            }`}
          >
            Pin-pin (K=1)
          </button>
          <button
            type="button"
            onClick={() => setEndCondition("fixed-free")}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              endCondition === "fixed-free"
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-navy hover:bg-slate-50"
            }`}
          >
            Fixed-free (K=2, conservative)
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-steel">
              <tr>
                <th className="border-b border-line px-3 py-3">Panel</th>
                <th className="border-b border-line px-3 py-3">KL/r</th>
                <th className="border-b border-line px-3 py-3">Limit</th>
                <th className="border-b border-line px-3 py-3">σ_cr (MPa)</th>
                <th className="border-b border-line px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {draft.rows.map((row) => (
                <tr key={row.panelNumber}>
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    P{row.panelNumber}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">{row.klr.toFixed(1)}</td>
                  <td className="border-b border-line/70 px-3 py-3">{row.klrLimit}</td>
                  <td className="border-b border-line/70 px-3 py-3">
                    {isFinite(row.sigmaCreMpa) ? row.sigmaCreMpa.toFixed(0) + " MPa" : "∞"}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">{statusPill(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-2xl border border-line bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-navy">Design check summary</p>
          <p className="mt-1 text-sm text-steel">
            Pass: {checks.counts.pass} | Close: {checks.counts.close} | Exceeds:{" "}
            {checks.counts.exceeds}
          </p>
        </div>
      </div>

      {/* Step 4 – Updated Design */}
      <div className="panel-card p-6">
        <p className="micro-label">Step 4</p>
        <h2 className="section-title">Updated Design</h2>
        <p className="mt-2 text-sm leading-6 text-steel">
          Sections upgraded where KL/r exceeded the limit for the selected end condition.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-steel">
              <tr>
                <th className="border-b border-line px-3 py-3">Panel</th>
                <th className="border-b border-line px-3 py-3">Original Section</th>
                <th className="border-b border-line px-3 py-3">Final Section</th>
                <th className="border-b border-line px-3 py-3">Status</th>
                <th className="border-b border-line px-3 py-3">Badge</th>
              </tr>
            </thead>
            <tbody>
              {updated.rows.map((row) => (
                <tr
                  key={row.panelNumber}
                  className={row.upgraded ? "bg-verified/5" : ""}
                >
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    P{row.panelNumber}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3 text-steel">
                    {row.originalSection}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    {row.legSection}
                    {row.upgraded ? (
                      <span className="ml-2 text-[11px] font-normal text-verified">↑ upgraded</span>
                    ) : null}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">{statusPill(row.status)}</td>
                  <td className="border-b border-line/70 px-3 py-3">{badgePill(row.badge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 5 – Final Summary */}
      <div className="panel-card p-6">
        <p className="micro-label">Step 5</p>
        <h2 className="section-title">Final Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-verified/30 bg-verified/10 p-4">
            <p className="text-sm font-medium text-steel">Passing panels</p>
            <p className="mt-2 text-3xl font-semibold text-verified">{summary.passingCount}</p>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-steel">Exceeding panels</p>
            <p className="mt-2 text-3xl font-semibold text-red-700">{summary.failingCount}</p>
          </div>
          <div className="rounded-2xl border border-line bg-slate-50 p-4">
            <p className="text-sm font-medium text-steel">Total leg steel mass</p>
            <p className="mt-2 text-2xl font-semibold text-navy">
              {summary.totalSteelMassKg.toFixed(0)} kg
            </p>
            <p className="mt-1 text-xs text-steel">
              {(summary.totalSteelMassKg / 1000).toFixed(2)} t (leg members only, 4 legs)
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-steel">
              <tr>
                <th className="border-b border-line px-3 py-3">Panel</th>
                <th className="border-b border-line px-3 py-3">Elevation</th>
                <th className="border-b border-line px-3 py-3">Original Section</th>
                <th className="border-b border-line px-3 py-3">Final Section</th>
                <th className="border-b border-line px-3 py-3">KL/r</th>
                <th className="border-b border-line px-3 py-3">σ_cr (MPa)</th>
                <th className="border-b border-line px-3 py-3">Status</th>
                <th className="border-b border-line px-3 py-3">Badge</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr key={row.panelNumber} className={row.upgraded ? "bg-verified/5" : ""}>
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    P{row.panelNumber}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3 text-steel">
                    {row.elevBottom.toFixed(1)}–{row.elevTop.toFixed(1)} m
                  </td>
                  <td className="border-b border-line/70 px-3 py-3 text-steel">
                    {row.originalSection}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    {row.legSection}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">{row.klr.toFixed(1)}</td>
                  <td className="border-b border-line/70 px-3 py-3">
                    {isFinite(row.sigmaCreMpa) ? row.sigmaCreMpa.toFixed(0) + " MPa" : "∞"}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">{statusPill(row.status)}</td>
                  <td className="border-b border-line/70 px-3 py-3">{badgePill(row.badge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm leading-6 text-steel">
          Preliminary research screening only. Section selections are not stamped code design.
          End condition: <strong>{endCondition === "pin-pin" ? "Pin-pin (K=1)" : "Fixed-free (K=2)"}</strong>.
        </p>
      </div>
    </div>
  );
}
