"use client";

import { useState } from "react";

import { ComparisonPresets } from "@/components/ComparisonPresets";
import { ControlsPanel } from "@/components/ControlsPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { GeometryTable } from "@/components/GeometryTable";
import { MemberSizes } from "@/components/MemberSizes";
import { PhysicsEquations } from "@/components/PhysicsEquations";
import { SourceTraceability } from "@/components/SourceTraceability";
import { TowerVisualizer } from "@/components/TowerVisualizer";
import { WindCalculator } from "@/components/WindCalculator";
import { buildTraceabilityRows, SOURCE_DOCUMENTS, tierClasses } from "@/lib/sources";
import {
  COMPARISON_PRESETS,
  DEFAULT_CONFIG,
  generateTowerPanels,
  type BracingOption,
  type ExposureOption,
  type HeightOption,
  type PlanOption,
  type RiskCategoryOption
} from "@/lib/tower";

function inferredPanelCountForHeight(heightMeters: HeightOption) {
  if (heightMeters === 40) {
    return 8;
  }

  if (heightMeters === 80) {
    return 12;
  }

  return 10;
}

export default function Page() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  const panels = generateTowerPanels(config);
  const traceabilityRows = buildTraceabilityRows(config, DEFAULT_CONFIG);

  function updateConfig<K extends keyof typeof DEFAULT_CONFIG>(
    key: K,
    value: (typeof DEFAULT_CONFIG)[K]
  ) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function handleHeightChange(heightMeters: HeightOption) {
    setConfig((current) => ({
      ...current,
      heightMeters,
      panelCount: inferredPanelCountForHeight(heightMeters),
      bottomWidthMeters: Number((heightMeters / 10).toFixed(1)),
      topWidthMeters: Number((heightMeters / 50).toFixed(1))
    }));
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="micro-label text-slate-300">Research dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Telecom Tower Design Explorer
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                Literature-backed preliminary geometry for wind-fragility pilot
                modeling. Built for a student preparing a professor meeting,
                with source honesty shown for every key value.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium">
                  Research visualization only — not a stamped structural design
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium">
                  No civil engineering background required to use this tool
                </span>
                <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-sm font-medium text-white">
                  Bocchini Research Group, Lehigh University
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setMobileControlsOpen(true)}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 lg:hidden"
                aria-label="Open controls panel"
              >
                Open controls
              </button>
              <button
                type="button"
                onClick={() => setSourcesOpen(true)}
                className="rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-medium text-navy transition hover:bg-slate-100"
                aria-haspopup="dialog"
                aria-expanded={sourcesOpen}
              >
                Sources
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "Code-Verified",
              "Literature-Backed",
              "Derived/Assumed"
            ].map((tier) => (
              <span
                key={tier}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${tierClasses(
                  tier as "Code-Verified" | "Literature-Backed" | "Derived/Assumed"
                )}`}
              >
                {tier}
              </span>
            ))}
          </div>
        </div>
      </header>

      {sourcesOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Sources modal"
        >
          <div className="max-h-[88vh] w-full max-w-6xl overflow-auto rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="micro-label">Sources modal</p>
                <h2 className="section-title">Embedded research and code basis</h2>
              </div>
              <button
                type="button"
                onClick={() => setSourcesOpen(false)}
                className="rounded-full border border-line px-3 py-2 text-sm text-steel"
                aria-label="Close sources modal"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SOURCE_DOCUMENTS.map((source) => (
                <article
                  key={source.id}
                  className="rounded-2xl border border-line bg-slate-50 p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-navy">
                      {source.shortLabel}
                    </h3>
                    <span className="rounded-full border border-navy/10 bg-white px-2 py-1 text-[11px] font-medium text-navy">
                      {source.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-ink">
                    {source.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-steel">
                    {source.detail}
                  </p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-medium"
                  >
                    Open source
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mobileControlsOpen ? (
        <div className="fixed inset-0 z-40 bg-navy/60 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-full max-w-md overflow-auto p-4">
            <ControlsPanel
              config={config}
              defaultConfig={DEFAULT_CONFIG}
              onHeightChange={handleHeightChange}
              onPanelCountChange={(panelCount) =>
                updateConfig("panelCount", panelCount)
              }
              onBottomWidthChange={(value) =>
                updateConfig("bottomWidthMeters", value)
              }
              onTopWidthChange={(value) => updateConfig("topWidthMeters", value)}
              onBracingChange={(value: BracingOption) =>
                updateConfig("bracing", value)
              }
              onPlanChange={(value: PlanOption) => updateConfig("plan", value)}
              onAppurtenancesChange={(value) =>
                updateConfig("appurtenances", value)
              }
              onWindSpeedChange={(value) => updateConfig("windSpeedMph", value)}
              onExposureChange={(value: ExposureOption) =>
                updateConfig("exposure", value)
              }
              onRiskCategoryChange={(value: RiskCategoryOption) =>
                updateConfig("riskCategory", value)
              }
              onCloseMobile={() => setMobileControlsOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="hidden xl:block">
            <div className="sticky top-5">
              <ControlsPanel
                config={config}
                defaultConfig={DEFAULT_CONFIG}
                onHeightChange={handleHeightChange}
                onPanelCountChange={(panelCount) =>
                  updateConfig("panelCount", panelCount)
                }
                onBottomWidthChange={(value) =>
                  updateConfig("bottomWidthMeters", value)
                }
                onTopWidthChange={(value) => updateConfig("topWidthMeters", value)}
                onBracingChange={(value: BracingOption) =>
                  updateConfig("bracing", value)
                }
                onPlanChange={(value: PlanOption) => updateConfig("plan", value)}
                onAppurtenancesChange={(value) =>
                  updateConfig("appurtenances", value)
                }
                onWindSpeedChange={(value) => updateConfig("windSpeedMph", value)}
                onExposureChange={(value: ExposureOption) =>
                  updateConfig("exposure", value)
                }
                onRiskCategoryChange={(value: RiskCategoryOption) =>
                  updateConfig("riskCategory", value)
                }
              />
            </div>
          </div>

          <div className="space-y-6">
            <TowerVisualizer config={config} />

            <ComparisonPresets
              presets={COMPARISON_PRESETS}
              config={config}
              onLoadPreset={(presetConfig) => setConfig(presetConfig)}
            />

            <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
              <GeometryTable config={config} panels={panels} />
              <WindCalculator config={config} panels={panels} />
            </div>

            <PhysicsEquations config={config} />

            <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
              <MemberSizes />
              <ExportPanel config={config} rows={traceabilityRows} />
            </div>

            <SourceTraceability rows={traceabilityRows} />
          </div>
        </div>
      </div>

      <footer className="border-t border-line bg-white/80">
        <div className="mx-auto max-w-[1600px] px-4 py-6 text-sm leading-7 text-steel sm:px-6 lg:px-8">
          Preliminary research visualization only. Final member capacities,
          connection design, foundation sizing, and serviceability checks
          require ASCE/SEI 10-15 and ANSI/TIA-222-H compliance verified by a
          qualified structural engineer.
        </div>
      </footer>
    </main>
  );
}
