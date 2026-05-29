"use client";

import { useEffect, useMemo, useState } from "react";

import { AssumptionsPanel } from "@/components/AssumptionsPanel";
import { CompareMode } from "@/components/CompareMode";
import { ComparisonPresets } from "@/components/ComparisonPresets";
import { ControlsPanel } from "@/components/ControlsPanel";
import { DesignAdvisor } from "@/components/DesignAdvisor";
import { DesignChecks } from "@/components/DesignChecks";
import { ElementDetailDrawer } from "@/components/ElementDetailDrawer";
import { ElementLengthTable } from "@/components/ElementLengthTable";
import { ExportPanel } from "@/components/ExportPanel";
import { GeometryTable } from "@/components/GeometryTable";
import { MaterialChart } from "@/components/MaterialChart";
import { MemberSizes } from "@/components/MemberSizes";
import { PhysicsEquations } from "@/components/PhysicsEquations";
import { SourceTraceability } from "@/components/SourceTraceability";
import { SavedCasesPanel } from "@/components/SavedCasesPanel";
import { TowerVisualizer } from "@/components/TowerVisualizer";
import { WindCalculator } from "@/components/WindCalculator";
import { WindForceChart } from "@/components/WindForceChart";
import { FragilityCurveChart } from "@/components/FragilityCurveChart";
import { DesignWorkflow } from "@/components/DesignWorkflow";
import { LatticeLab } from "@/components/LatticeLab";
import { calculateDesignChecks } from "@/lib/designChecks";
import { calculateAllPanelLengths } from "@/lib/elementLengths";
import { calculateMaterialEstimate } from "@/lib/materialQuantity";
import { buildTraceabilityRows, SOURCE_DOCUMENTS, tierClasses } from "@/lib/sources";
import {
  buildPanelMemberProfiles,
  COMPARISON_PRESETS,
  DEFAULT_CONFIG,
  generateTowerPanels,
  type BracingOption,
  type ExposureOption,
  type HeightOption,
  type PlanOption,
  type RiskCategoryOption,
  type TowerConfig,
  type UnitSystem
} from "@/lib/tower";
import { calculatePanelWindForces } from "@/lib/windForce";

type DashboardTab =
  | "workflow"
  | "geometry"
  | "lengths"
  | "checks"
  | "wind"
  | "material"
  | "fragility"
  | "sources"
  | "lab";

const TAB_OPTIONS: Array<{
  key: DashboardTab;
  label: string;
  shortcut: string;
}> = [
  { key: "workflow", label: "Design Workflow", shortcut: "1" },
  { key: "geometry", label: "Tower Geometry", shortcut: "2" },
  { key: "lengths", label: "Element Lengths", shortcut: "3" },
  { key: "checks", label: "Design Checks", shortcut: "4" },
  { key: "wind", label: "Wind Loads", shortcut: "5" },
  { key: "material", label: "Material Estimate", shortcut: "6" },
  { key: "fragility", label: "Fragility Curves", shortcut: "7" },
  { key: "sources", label: "Sources", shortcut: "8" },
  { key: "lab", label: "Lattice Design Lab", shortcut: "9" }
];

function inferredPanelCountForHeight(heightMeters: HeightOption) {
  if (heightMeters === 40) {
    return 8;
  }

  if (heightMeters === 80) {
    return 12;
  }

  return 10;
}

function comparisonDefaultRight(): TowerConfig {
  return {
    ...DEFAULT_CONFIG,
    heightMeters: 80,
    panelCount: 12,
    bottomWidthMeters: 8.0,
    topWidthMeters: 1.6,
    bracing: "Double K/K-B"
  };
}

function TabButton({
  active,
  label,
  shortcut,
  onClick
}: {
  active: boolean;
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
      }`}
      aria-pressed={active}
    >
      {label}
      <span className="ml-2 rounded-full border border-current/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
        {shortcut}
      </span>
    </button>
  );
}

export default function Page() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [compareLeftConfig, setCompareLeftConfig] = useState(DEFAULT_CONFIG);
  const [compareRightConfig, setCompareRightConfig] = useState(
    comparisonDefaultRight()
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("geometry");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [darkMode, setDarkMode] = useState(true);
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [stressMode, setStressMode] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const [endCondition, setEndCondition] = useState<"pin-pin" | "fixed-free">("pin-pin");

  const geometryPanels = generateTowerPanels(config);
  const elementPanels = calculateAllPanelLengths(
    config.heightMeters,
    config.panelCount,
    config.bottomWidthMeters,
    config.topWidthMeters,
    config.bracing
  );
  const memberProfiles = buildPanelMemberProfiles(config.panelCount);
  const traceabilityRows = buildTraceabilityRows(config, DEFAULT_CONFIG);
  const materialEstimate = calculateMaterialEstimate(elementPanels, memberProfiles);
  const windForces = calculatePanelWindForces(config, elementPanels);
  const designCheckSummary = calculateDesignChecks({
    config,
    panels: elementPanels,
    memberProfiles,
    endCondition
  });

  const selectedPanelData =
    elementPanels.find((panel) => panel.panelIndex === selectedPanel) ?? null;
  const selectedPanelMember =
    memberProfiles.find((member) => member.panelNumber === selectedPanel) ?? null;

  function updateConfig<K extends keyof TowerConfig>(key: K, value: TowerConfig[K]) {
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

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "1") {
        setActiveTab("workflow");
      }

      if (event.key === "2") {
        setActiveTab("geometry");
      }

      if (event.key === "3") {
        setActiveTab("lengths");
      }

      if (event.key === "4") {
        setActiveTab("checks");
      }

      if (event.key === "5") {
        setActiveTab("wind");
      }

      if (event.key === "6") {
        setActiveTab("material");
      }

      if (event.key === "7") {
        setActiveTab("fragility");
      }

      if (event.key === "8") {
        setActiveTab("sources");
      }

      if (event.key === "9") {
        setActiveTab("lab");
      }

      if (event.key.toLowerCase() === "h") {
        setHoverEnabled((current) => !current);
      }

      if (event.key.toLowerCase() === "s") {
        setStressMode((current) => !current);
      }

      if (event.key === "#" || event.key.toLowerCase() === "v") {
        setShow3D((current) => !current);
      }

      if (event.key.toLowerCase() === "c") {
        setCompareMode((current) => !current);
      }

      if (event.key === "?") {
        setShortcutsOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const tabContent = useMemo(() => {
    if (compareMode) {
      return (
        <div className="space-y-6">
          <CompareMode
            leftConfig={compareLeftConfig}
            rightConfig={compareRightConfig}
            onLeftConfigChange={setCompareLeftConfig}
            onRightConfigChange={setCompareRightConfig}
            unitSystem={unitSystem}
          />
          <SavedCasesPanel
            config={config}
            compareMode={compareMode}
            compareLeftConfig={compareLeftConfig}
            compareRightConfig={compareRightConfig}
            unitSystem={unitSystem}
            onLoadSingle={(loadedConfig, loadedUnitSystem) => {
              setCompareMode(false);
              setConfig(loadedConfig);
              setUnitSystem(loadedUnitSystem);
            }}
            onLoadCompare={(leftConfig, rightConfig, loadedUnitSystem) => {
              setCompareMode(true);
              setCompareLeftConfig(leftConfig);
              setCompareRightConfig(rightConfig);
              setUnitSystem(loadedUnitSystem);
            }}
          />
        </div>
      );
    }

    if (activeTab === "workflow") {
      return (
        <DesignWorkflow
          config={config}
          panels={elementPanels}
          memberProfiles={memberProfiles}
          checks={designCheckSummary}
          unitSystem={unitSystem}
        />
      );
    }

    if (activeTab === "geometry") {
      return (
        <div className="space-y-6">
          <ComparisonPresets
            presets={COMPARISON_PRESETS}
            config={config}
            onLoadPreset={(presetConfig) => setConfig(presetConfig)}
          />
          <GeometryTable config={config} panels={geometryPanels} />
          <MemberSizes />
          <ExportPanel
            config={config}
            rows={traceabilityRows}
            checks={designCheckSummary}
            material={materialEstimate}
            panels={elementPanels}
          />
        </div>
      );
    }

    if (activeTab === "lengths") {
      return (
        <ElementLengthTable
          rows={elementPanels}
          memberProfiles={memberProfiles}
          unitSystem={unitSystem}
          onOpenPanel={setSelectedPanel}
        />
      );
    }

    if (activeTab === "wind") {
      return (
        <div className="space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
            <WindCalculator config={config} panels={geometryPanels} />
            <WindForceChart rows={windForces} />
          </div>
          <PhysicsEquations config={config} />
        </div>
      );
    }

    if (activeTab === "material") {
      return (
        <div className="space-y-6">
          <MaterialChart estimate={materialEstimate} />
          <ExportPanel
            config={config}
            rows={traceabilityRows}
            checks={designCheckSummary}
            material={materialEstimate}
            panels={elementPanels}
          />
        </div>
      );
    }

    if (activeTab === "fragility") {
      return (
        <FragilityCurveChart
          config={config}
          checks={designCheckSummary}
          unitSystem={unitSystem}
        />
      );
    }

    if (activeTab === "checks") {
      return (
        <div className="space-y-6">
          <DesignAdvisor
            config={config}
            checks={designCheckSummary}
            onApplyConfig={setConfig}
          />
          <DesignChecks
            summary={designCheckSummary}
            unitSystem={unitSystem}
            onEndConditionChange={setEndCondition}
          />
          <SavedCasesPanel
            config={config}
            compareMode={compareMode}
            compareLeftConfig={compareLeftConfig}
            compareRightConfig={compareRightConfig}
            unitSystem={unitSystem}
            onLoadSingle={(loadedConfig, loadedUnitSystem) => {
              setCompareMode(false);
              setConfig(loadedConfig);
              setUnitSystem(loadedUnitSystem);
            }}
            onLoadCompare={(leftConfig, rightConfig, loadedUnitSystem) => {
              setCompareMode(true);
              setCompareLeftConfig(leftConfig);
              setCompareRightConfig(rightConfig);
              setUnitSystem(loadedUnitSystem);
            }}
          />
          <AssumptionsPanel rows={traceabilityRows} />
        </div>
      );
    }

    if (activeTab === "lab") {
      return <LatticeLab />;
    }

    return <SourceTraceability rows={traceabilityRows} />;
  }, [
    activeTab,
    compareLeftConfig,
    compareMode,
    compareRightConfig,
    config,
    designCheckSummary,
    elementPanels,
    endCondition,
    geometryPanels,
    materialEstimate,
    memberProfiles,
    traceabilityRows,
    unitSystem,
    windForces
  ]);

  return (
    <main className={`min-h-screen ${darkMode ? "theme-dark" : ""}`}>
      <header className="relative overflow-hidden border-b border-white/8 bg-gradient-to-br from-[#060e1a] via-[#0a1628] to-[#0d1f3c]">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-blue-500/8 blur-3xl" />
        <div className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="micro-label text-cyan-400">⚡ LIVE ANALYSIS ENGINE</p>
              <h1 className="mt-3 bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent text-4xl font-bold tracking-tight sm:text-5xl">
                Telecom Tower Design Explorer
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                Literature-backed preliminary geometry explorer for wind-fragility
                modeling, now extended with element-level length calculations,
                slenderness screening, and qualitative wind/material views.
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

            <div className="flex flex-wrap items-center gap-3">
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
                onClick={() => setDarkMode((current) => !current)}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15"
                aria-pressed={darkMode}
              >
                {darkMode ? "Light mode" : "Dark mode"}
              </button>
              <button
                type="button"
                onClick={() => setCompareMode((current) => !current)}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15"
                aria-pressed={compareMode}
              >
                {compareMode ? "Close comparison" : "Compare two towers"}
              </button>
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15"
                aria-haspopup="dialog"
              >
                ?
              </button>
              <button
                type="button"
                onClick={() => setSourcesOpen(true)}
                className="rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-medium text-navy transition hover:bg-slate-100"
                aria-haspopup="dialog"
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

      <div className="border-b border-white/8 bg-[#060e1a]/90">
        <div className="mx-auto max-w-[1700px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { label: "Tower Height", value: `${config.heightMeters} m` },
              { label: "Wind Speed", value: `${config.windSpeedMph} mph` },
              { label: "Panels", value: `${config.panelCount}` },
            ].map(kpi => (
              <div key={kpi.label} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                <span className="text-sm font-semibold text-cyan-300">{kpi.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Checks</span>
              <span className={`text-sm font-semibold ${designCheckSummary.counts.exceeds > 0 ? "text-red-400" : "text-green-400"}`}>
                {designCheckSummary.counts.pass}✓{designCheckSummary.counts.exceeds > 0 ? ` ${designCheckSummary.counts.exceeds}✗` : ""}
              </span>
            </div>
            {designCheckSummary.counts.exceeds > 0 && (
              <span className="text-xs text-slate-400 border border-white/10 bg-white/5 rounded-full px-3 py-0.5">
                Widen base or reduce wind speed to pass all checks
              </span>
            )}
          </div>
        </div>
      </div>

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
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-navy/10 bg-white px-2 py-1 text-[11px] font-medium text-navy">
                        {source.category}
                      </span>
                      {source.tier ? (
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                            source.tier
                          )}`}
                        >
                          {source.tier}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-6 text-ink">
                    {source.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-steel">
                    {source.detail}
                  </p>
                  {source.clause ? (
                    <p className="mt-2 text-xs leading-5 text-steel">
                      Clause / note: {source.clause}
                    </p>
                  ) : null}
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-medium"
                    >
                      Open source
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {shortcutsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="micro-label">Keyboard shortcuts</p>
                <h2 className="section-title">Fast navigation and view toggles</h2>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="rounded-full border border-line px-3 py-2 text-sm text-steel"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["1", "Design Workflow tab"],
                ["2", "Tower Geometry tab"],
                ["3", "Element Lengths tab"],
                ["4", "Design Checks tab"],
                ["5", "Wind Loads tab"],
                ["6", "Material Estimate tab"],
                ["7", "Fragility Curves tab"],
                ["8", "Sources tab"],
                ["9", "Lattice Design Lab"],
                ["H", "Toggle hover labels"],
                ["S", "Toggle stress visualization"],
                ["V or Shift+3", "Toggle 3D/isometric view"],
                ["C", "Open or close compare mode"],
                ["?", "Open shortcuts help"]
              ].map(([key, meaning]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-line bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-navy">{key}</p>
                  <p className="mt-1 text-sm leading-6 text-steel">{meaning}</p>
                </div>
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

      <div className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.42fr)_minmax(0,0.58fr)]">
          <div className="space-y-6 xl:sticky xl:top-5 xl:self-start">
            <div className="panel-card p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUnitSystem("metric")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    unitSystem === "metric"
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-white text-navy"
                  }`}
                >
                  Metres
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem("imperial")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    unitSystem === "imperial"
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-white text-navy"
                  }`}
                >
                  Feet
                </button>
                <button
                  type="button"
                  onClick={() => setShow3D((current) => !current)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    show3D ? "border-accent bg-accent text-white" : "border-line bg-white text-navy"
                  }`}
                >
                  {show3D ? "3D view on" : "3D view off"}
                </button>
                <button
                  type="button"
                  onClick={() => setStressMode((current) => !current)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    stressMode
                      ? "border-literature bg-literature text-white"
                      : "border-line bg-white text-navy"
                  }`}
                >
                  {stressMode ? "Stress mode on" : "Stress mode off"}
                </button>
                <button
                  type="button"
                  onClick={() => setHoverEnabled((current) => !current)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    hoverEnabled
                      ? "border-verified bg-verified text-white"
                      : "border-line bg-white text-navy"
                  }`}
                >
                  {hoverEnabled ? "Hover labels on" : "Hover labels off"}
                </button>
              </div>
            </div>

            {designCheckSummary.warnings.length ? (
              <div className="panel-card p-4">
                <p className="micro-label">Active review warnings</p>
                <div className="mt-3 space-y-2">
                  {designCheckSummary.warnings.slice(0, 3).map((warning) => (
                    <div
                      key={warning.id}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        warning.severity === "warning"
                          ? "border-red-500/30 bg-red-500/10 text-red-700"
                          : warning.severity === "caution"
                          ? "border-literature/30 bg-literature/10 text-literature"
                          : "border-derived/30 bg-derived/10 text-derived"
                      }`}
                    >
                      <strong>{warning.title}:</strong> {warning.detail}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <TowerVisualizer
              config={config}
              panels={elementPanels}
              memberProfiles={memberProfiles}
              unitSystem={unitSystem}
              showStress={stressMode}
              show3D={show3D}
              hoverEnabled={hoverEnabled}
              windForces={windForces}
              onPanelSelect={setSelectedPanel}
            />

            <div className="hidden xl:block">
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
            {!compareMode ? (
              <div className="panel-card p-4">
                <div className="flex flex-wrap gap-3">
                  {TAB_OPTIONS.map((tab) => (
                    <TabButton
                      key={tab.key}
                      active={activeTab === tab.key}
                      label={tab.label}
                      shortcut={tab.shortcut}
                      onClick={() => setActiveTab(tab.key)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {tabContent}
          </div>
        </div>
      </div>

      <footer className="border-t border-line bg-white/80">
        <div className="mx-auto max-w-[1700px] px-4 py-6 text-sm leading-7 text-steel sm:px-6 lg:px-8">
          Preliminary research visualization only. Final member capacities,
          connection design, foundation sizing, and serviceability checks
          require ASCE/SEI 10-15 and ANSI/TIA-222-H compliance verified by a
          qualified structural engineer.
        </div>
      </footer>

      <ElementDetailDrawer
        open={selectedPanel !== null}
        panel={selectedPanelData}
        memberProfile={selectedPanelMember}
        unitSystem={unitSystem}
        onClose={() => setSelectedPanel(null)}
      />
    </main>
  );
}
