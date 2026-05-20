import { type DesignCheckSummary } from "@/lib/designChecks";
import { type PanelElementLengths } from "@/lib/elementLengths";
import { type MaterialEstimate } from "@/lib/materialQuantity";
import { buildAdvisorExplanation, type TowerConfig } from "@/lib/tower";
import { type TraceabilityRow } from "@/lib/sources";

export function buildDesignSummary(
  config: TowerConfig,
  rows: TraceabilityRow[],
  checks?: DesignCheckSummary
) {
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

  const checkLines = checks
    ? [
        "Design checks:",
        `- Pass: ${checks.counts.pass}`,
        `- Close: ${checks.counts.close}`,
        `- Exceeds: ${checks.counts.exceeds}`,
        `- Worst KL/r: ${checks.worstKlr.toFixed(1)}`,
        `- Most critical panel: ${checks.worstPanelNumber ?? "n/a"}`,
        ""
      ]
    : [];

  const traceLines = rows.map(
    (row) =>
      `- ${row.parameter}: ${row.value} | ${row.tier} | ${row.sourceLabel} | ${row.clausePage}`
  );

  return [
    ...header,
    ...configurationLines,
    ...checkLines,
    "Traceability:",
    ...traceLines
  ].join("\n");
}

export function buildAnalysisBundle(input: {
  config: TowerConfig;
  rows: TraceabilityRow[];
  checks: DesignCheckSummary;
  material: MaterialEstimate;
  panels: PanelElementLengths[];
}) {
  return {
    generatedAt: new Date().toISOString(),
    config: input.config,
    designChecks: input.checks,
    materialEstimate: input.material,
    elementPanels: input.panels,
    traceability: input.rows,
    advisorExplanation: buildAdvisorExplanation(input.config)
  };
}

export function buildPrintableReportHtml(input: {
  config: TowerConfig;
  rows: TraceabilityRow[];
  checks: DesignCheckSummary;
  material: MaterialEstimate;
  panels: PanelElementLengths[];
}) {
  const { config, rows, checks, material, panels } = input;
  const warnings = checks.warnings
    .map(
      (warning) =>
        `<li><strong>${warning.title}</strong>: ${warning.detail} <em>(${warning.source})</em></li>`
    )
    .join("");
  const traceRows = rows
    .slice(0, 12)
    .map(
      (row) => `
      <tr>
        <td>${row.parameter}</td>
        <td>${row.value}</td>
        <td>${row.tier}</td>
        <td>${row.sourceLabel}</td>
      </tr>`
    )
    .join("");
  const criticalRows = checks.worstItems
    .map(
      (item) => `
      <tr>
        <td>P${item.panelNumber}</td>
        <td>${item.elementType}</td>
        <td>${item.section}</td>
        <td>${item.result.klr.toFixed(1)}</td>
        <td>${item.result.limit}</td>
        <td>${item.result.status}</td>
      </tr>`
    )
    .join("");
  const quantityRows = material.sections
    .slice(0, 10)
    .map(
      (row) => `
      <tr>
        <td>${row.section}</td>
        <td>${row.totalLengthMeters.toFixed(1)}</td>
        <td>${row.unitWeightKgPerM.toFixed(2)}</td>
        <td>${row.totalMassKg.toFixed(1)}</td>
      </tr>`
    )
    .join("");
  const panelRows = panels
    .slice(0, 10)
    .map(
      (panel) => `
      <tr>
        <td>P${panel.panelIndex}</td>
        <td>${panel.elevBottom.toFixed(1)}-${panel.elevTop.toFixed(1)} m</td>
        <td>${panel.wBottom.toFixed(2)}</td>
        <td>${panel.wTop.toFixed(2)}</td>
        <td>${panel.legLength.toFixed(3)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Telecom Tower Design Explorer Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; color: #0f172a; }
      h1, h2 { color: #11233c; }
      p, li { line-height: 1.6; }
      .card { border: 1px solid #dbe3ee; border-radius: 16px; padding: 1rem 1.2rem; margin-bottom: 1rem; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
      th, td { border: 1px solid #dbe3ee; padding: 0.55rem 0.7rem; text-align: left; }
      th { background: #f8fafc; }
      .pill { display: inline-block; border: 1px solid #dbe3ee; border-radius: 999px; padding: 0.2rem 0.6rem; margin-right: 0.35rem; font-size: 0.8rem; }
      @media print { body { margin: 1rem; } .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="no-print" style="margin-bottom: 1rem;">
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
    <h1>Telecom Tower Design Explorer Report</h1>
    <p>Generated ${new Date().toLocaleString()} for a ${config.heightMeters} m pilot tower.</p>
    <p>
      <span class="pill">Bracing: ${config.bracing}</span>
      <span class="pill">Exposure: ${config.exposure}</span>
      <span class="pill">Wind: ${config.windSpeedMph} mph</span>
      <span class="pill">Risk: ${config.riskCategory}</span>
    </p>

    <div class="grid">
      <div class="card">
        <h2>Configuration</h2>
        <p>Height: ${config.heightMeters} m</p>
        <p>Panels: ${config.panelCount}</p>
        <p>Base width: ${config.bottomWidthMeters.toFixed(1)} m</p>
        <p>Top width: ${config.topWidthMeters.toFixed(1)} m</p>
        <p>Plan: ${config.plan}</p>
      </div>
      <div class="card">
        <h2>Design checks summary</h2>
        <p>Pass: ${checks.counts.pass}</p>
        <p>Close: ${checks.counts.close}</p>
        <p>Exceeds: ${checks.counts.exceeds}</p>
        <p>Worst KL/r: ${checks.worstKlr.toFixed(1)}</p>
        <p>Most critical panel: ${checks.worstPanelNumber ?? "n/a"}</p>
      </div>
    </div>

    <div class="card">
      <h2>Warnings and limitations</h2>
      <ul>${warnings || "<li>No active warnings in the current configuration.</li>"}</ul>
      <p><strong>Important:</strong> This report is a preliminary research visualization only. Final design requires full ASCE/SEI 10-15 and ANSI/TIA-222-H verification by a qualified structural engineer.</p>
    </div>

    <div class="card">
      <h2>Representative panel geometry</h2>
      <table>
        <thead>
          <tr><th>Panel</th><th>Elevations</th><th>w(bottom) m</th><th>w(top) m</th><th>Leg length m</th></tr>
        </thead>
        <tbody>${panelRows}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Critical slenderness checks</h2>
      <table>
        <thead>
          <tr><th>Panel</th><th>Element</th><th>Section</th><th>KL/r</th><th>Limit</th><th>Status</th></tr>
        </thead>
        <tbody>${criticalRows}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Material estimate</h2>
      <p>Total estimated steel mass: ${material.totalMassKg.toFixed(1)} kg (${(material.totalMassKg / 1000).toFixed(2)} tonnes)</p>
      <table>
        <thead>
          <tr><th>Section</th><th>Length (m)</th><th>kg/m</th><th>Mass (kg)</th></tr>
        </thead>
        <tbody>${quantityRows}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Traceability snapshot</h2>
      <table>
        <thead>
          <tr><th>Parameter</th><th>Value</th><th>Tier</th><th>Source</th></tr>
        </thead>
        <tbody>${traceRows}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Advisor explanation</h2>
      <p>${buildAdvisorExplanation(config)}</p>
    </div>
  </body>
</html>`;
}

