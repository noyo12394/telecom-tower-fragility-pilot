"use client";

import { useState } from "react";

import { buildAdvisorExplanation, buildGeometryCsv, type TowerConfig } from "@/lib/tower";
import type { TraceabilityRow } from "@/lib/sources";

interface ExportPanelProps {
  config: TowerConfig;
  rows: TraceabilityRow[];
}

function downloadTextFile(fileName: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildDesignSummary(config: TowerConfig, rows: TraceabilityRow[]) {
  const header = [
    "Telecom Tower Design Explorer",
    "Literature-backed preliminary geometry for wind-fragility pilot modeling",
    ""
  ];

  const configurationLines = [
    `Height: ${config.heightMeters} m`,
    `Panels: ${config.panelCount}`,
    `Base width: ${config.bottomWidthMeters.toFixed(1)} m`,
    `Top width: ${config.topWidthMeters.toFixed(1)} m`,
    `Bracing: ${config.bracing}`,
    `Plan: ${config.plan}`,
    `Wind speed: ${config.windSpeedMph} mph`,
    `Exposure: ${config.exposure}`,
    `Risk Category: ${config.riskCategory}`,
    `Appurtenances: ${config.appurtenances ? "On" : "Off"}`,
    ""
  ];

  const traceLines = rows.map(
    (row) =>
      `- ${row.parameter}: ${row.value} | ${row.tier} | ${row.sourceLabel} | ${row.clausePage}`
  );

  return [...header, ...configurationLines, "Traceability:", ...traceLines].join(
    "\n"
  );
}

function buildPhysicsReferenceHtml(config: TowerConfig) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Telecom Tower Design Explorer — Physics Reference</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; color: #0f172a; }
      h1 { color: #11233c; }
      .card { border: 1px solid #dbe3ee; border-radius: 18px; padding: 1rem; margin-bottom: 1rem; }
      code { display: block; background: #11233c; color: white; padding: 0.75rem; border-radius: 12px; margin-top: 0.5rem; }
      p { line-height: 1.6; }
    </style>
  </head>
  <body>
    <h1>Telecom Tower Design Explorer — Physics Reference Card</h1>
    <p>Generated for a ${config.heightMeters} m pilot tower with ${config.windSpeedMph} mph wind speed, Exposure ${config.exposure}, Risk Category ${config.riskCategory}.</p>
    <div class="card"><strong>Transition slenderness</strong><code>Cc = π√(2E/Fy)</code></div>
    <div class="card"><strong>Inelastic buckling</strong><code>Fa = [1 − 1/2(KL/r ÷ Cc)²] × Fy</code></div>
    <div class="card"><strong>Euler buckling</strong><code>Fa = π²E/(KL/r)²</code></div>
    <div class="card"><strong>Velocity pressure</strong><code>qz = 0.613 × Kz × Kzt × Ks × Ke × Kd × V²</code></div>
    <div class="card"><strong>Height factor</strong><code>Kz = 2.01(z/zg)^(2/α')</code></div>
    <div class="card"><strong>Wind force</strong><code>FST = qz × Gh × (EPA)S</code></div>
    <div class="card"><strong>Drag coefficient</strong><code>Cf = 4.0ε² − 5.9ε + 4.0</code></div>
    <div class="card"><strong>Fragility curve</strong><code>P(D&gt;ds|IM=v) = Φ[ln(v/θ)/β]</code></div>
    <p>Preliminary research visualization only. Final member capacities, connection design, foundation sizing, and serviceability checks require ASCE/SEI 10-15 and ANSI/TIA-222-H compliance verified by a qualified structural engineer.</p>
  </body>
</html>`;
}

export function ExportPanel({ config, rows }: ExportPanelProps) {
  const [message, setMessage] = useState<string>("");

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`${label} copied`);
    window.setTimeout(() => setMessage(""), 2400);
  }

  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Export panel</p>
          <h2 className="section-title">Share the Current Design State</h2>
        </div>
        {message ? (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {message}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              "telecom-tower-geometry.csv",
              buildGeometryCsv(config),
              "text/csv;charset=utf-8"
            )
          }
          className="rounded-2xl border border-line bg-slate-50 px-4 py-4 text-left text-sm font-medium text-navy transition hover:border-accent/40 hover:bg-white"
        >
          Download geometry CSV
        </button>

        <button
          type="button"
          onClick={() => copyText("Design summary", buildDesignSummary(config, rows))}
          className="rounded-2xl border border-line bg-slate-50 px-4 py-4 text-left text-sm font-medium text-navy transition hover:border-accent/40 hover:bg-white"
        >
          Copy design summary
        </button>

        <button
          type="button"
          onClick={() =>
            copyText("Advisor explanation", buildAdvisorExplanation(config))
          }
          className="rounded-2xl border border-line bg-slate-50 px-4 py-4 text-left text-sm font-medium text-navy transition hover:border-accent/40 hover:bg-white"
        >
          Copy advisor explanation
        </button>

        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              "physics-equations-reference.html",
              buildPhysicsReferenceHtml(config),
              "text/html;charset=utf-8"
            )
          }
          className="rounded-2xl border border-line bg-slate-50 px-4 py-4 text-left text-sm font-medium text-navy transition hover:border-accent/40 hover:bg-white"
        >
          Download physics reference HTML
        </button>
      </div>
    </section>
  );
}
