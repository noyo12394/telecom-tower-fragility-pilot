"use client";

import {
  type BracingOption,
  type ExposureOption,
  type HeightOption,
  type PlanOption,
  type RiskCategoryOption,
  type TowerConfig
} from "@/lib/tower";
import { tierClasses } from "@/lib/sources";

interface ControlsPanelProps {
  config: TowerConfig;
  defaultConfig: TowerConfig;
  onHeightChange: (height: HeightOption) => void;
  onPanelCountChange: (panelCount: number) => void;
  onBottomWidthChange: (value: number) => void;
  onTopWidthChange: (value: number) => void;
  onBracingChange: (value: BracingOption) => void;
  onPlanChange: (value: PlanOption) => void;
  onAppurtenancesChange: (value: boolean) => void;
  onWindSpeedChange: (value: number) => void;
  onExposureChange: (value: ExposureOption) => void;
  onRiskCategoryChange: (value: RiskCategoryOption) => void;
  onCloseMobile?: () => void;
}

const HEIGHT_OPTIONS: Array<{
  value: HeightOption;
  tier: "Code-Verified" | "Literature-Backed" | "Derived/Assumed";
  note: string;
}> = [
  { value: 40, tier: "Literature-Backed", note: "Rasool et al." },
  { value: 48, tier: "Literature-Backed", note: "Bilionis benchmark" },
  { value: 50, tier: "Derived/Assumed", note: "comparison case" },
  { value: 60, tier: "Literature-Backed", note: "Rasool mid-height default" },
  { value: 80, tier: "Literature-Backed", note: "Rasool upper-height" }
];

const BRACING_OPTIONS: Array<{
  value: BracingOption;
  tier: "Literature-Backed" | "Derived/Assumed";
  note: string;
}> = [
  {
    value: "Double K/K-B",
    tier: "Literature-Backed",
    note: "Most efficient in 60 m study"
  },
  {
    value: "K-Down",
    tier: "Literature-Backed",
    note: "Compared in 60 m bracing study"
  }
];

function EditedPill({
  edited
}: {
  edited: boolean;
}) {
  if (!edited) {
    return null;
  }

  return (
    <span className="rounded-full border border-navy/20 bg-navy/5 px-2 py-1 text-[11px] font-medium text-navy">
      User-edited
    </span>
  );
}

function SourcePill({
  label,
  tier
}: {
  label: string;
  tier: "Code-Verified" | "Literature-Backed" | "Derived/Assumed";
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
        tier
      )}`}
    >
      {label}
    </span>
  );
}

export function ControlsPanel({
  config,
  defaultConfig,
  onHeightChange,
  onPanelCountChange,
  onBottomWidthChange,
  onTopWidthChange,
  onBracingChange,
  onPlanChange,
  onAppurtenancesChange,
  onWindSpeedChange,
  onExposureChange,
  onRiskCategoryChange,
  onCloseMobile
}: ControlsPanelProps) {
  return (
    <aside className="panel-card h-fit p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="micro-label">Controls</p>
          <h2 className="section-title">Pilot Design Inputs</h2>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-full border border-line px-3 py-2 text-sm text-steel lg:hidden"
            aria-label="Close controls panel"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="height" className="text-sm font-medium text-navy">
              Height
            </label>
            <EditedPill edited={config.heightMeters !== defaultConfig.heightMeters} />
          </div>
          <select
            id="height"
            aria-label="Select tower height"
            value={config.heightMeters}
            onChange={(event) =>
              onHeightChange(Number(event.target.value) as HeightOption)
            }
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          >
            {HEIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} m — {option.note}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {HEIGHT_OPTIONS.map((option) =>
              option.value === config.heightMeters ? (
                <SourcePill
                  key={option.value}
                  label={option.tier}
                  tier={option.tier}
                />
              ) : null
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="panels" className="text-sm font-medium text-navy">
              Panels
            </label>
            <EditedPill edited={config.panelCount !== defaultConfig.panelCount} />
          </div>
          <input
            id="panels"
            type="range"
            min={6}
            max={16}
            step={1}
            value={config.panelCount}
            onChange={(event) => onPanelCountChange(Number(event.target.value))}
            aria-label="Adjust number of panels"
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-steel">
            <span>6</span>
            <span className="font-medium text-navy">{config.panelCount}</span>
            <span>16</span>
          </div>
          <SourcePill
            label={
              config.panelCount === 10
                ? "Literature-Backed"
                : "Derived/Assumed"
            }
            tier={config.panelCount === 10 ? "Literature-Backed" : "Derived/Assumed"}
          />
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="bottom-width"
                  className="text-sm font-medium text-navy"
                >
                  Base width
                </label>
                <EditedPill
                  edited={
                    config.bottomWidthMeters !== defaultConfig.bottomWidthMeters
                  }
                />
              </div>
              <input
                id="bottom-width"
                type="number"
                min={2}
                max={12}
                step={0.1}
                value={config.bottomWidthMeters}
                onChange={(event) =>
                  onBottomWidthChange(Number(event.target.value))
                }
                aria-label="Edit bottom face width"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              />
              <SourcePill label="Derived/Assumed" tier="Derived/Assumed" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="top-width" className="text-sm font-medium text-navy">
                  Top width
                </label>
                <EditedPill
                  edited={config.topWidthMeters !== defaultConfig.topWidthMeters}
                />
              </div>
              <input
                id="top-width"
                type="number"
                min={0.4}
                max={4}
                step={0.1}
                value={config.topWidthMeters}
                onChange={(event) => onTopWidthChange(Number(event.target.value))}
                aria-label="Edit top face width"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              />
              <SourcePill label="Derived/Assumed" tier="Derived/Assumed" />
            </div>
          </div>
          <p className="text-sm leading-6 text-steel">
            Defaults follow the preliminary proportioning rules H/10 for the
            base and H/50 for the top.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="bracing" className="text-sm font-medium text-navy">
              Bracing
            </label>
            <EditedPill edited={config.bracing !== defaultConfig.bracing} />
          </div>
          <select
            id="bracing"
            aria-label="Select bracing configuration"
            value={config.bracing}
            onChange={(event) =>
              onBracingChange(event.target.value as BracingOption)
            }
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          >
            {BRACING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} — {option.note}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {BRACING_OPTIONS.map((option) =>
              option.value === config.bracing ? (
                <SourcePill
                  key={option.value}
                  label={option.tier}
                  tier={option.tier}
                />
              ) : null
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="plan" className="text-sm font-medium text-navy">
                Plan
              </label>
              <EditedPill edited={config.plan !== defaultConfig.plan} />
            </div>
            <select
              id="plan"
              aria-label="Select tower plan"
              value={config.plan}
              onChange={(event) => onPlanChange(event.target.value as PlanOption)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              <option value="Square">Square</option>
              <option value="Triangular">Triangular</option>
            </select>
            <SourcePill
              label={config.plan === "Square" ? "Literature-Backed" : "Derived/Assumed"}
              tier={config.plan === "Square" ? "Literature-Backed" : "Derived/Assumed"}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-navy">Appurtenances</span>
              <EditedPill edited={config.appurtenances !== defaultConfig.appurtenances} />
            </div>
            <button
              type="button"
              onClick={() => onAppurtenancesChange(!config.appurtenances)}
              aria-pressed={config.appurtenances}
              aria-label="Toggle representative appurtenances"
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                config.appurtenances
                  ? "border-accent/40 bg-accent/10 text-navy"
                  : "border-line bg-white text-steel"
              }`}
            >
              <span>{config.appurtenances ? "On" : "Off"}</span>
              <span className="rounded-full border border-derived/30 bg-derived/10 px-2 py-1 text-[11px] font-medium text-derived">
                Derived/Assumed
              </span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="wind-speed"
                  className="text-sm font-medium text-navy"
                >
                  Wind speed
                </label>
                <EditedPill
                  edited={config.windSpeedMph !== defaultConfig.windSpeedMph}
                />
              </div>
              <input
                id="wind-speed"
                type="number"
                min={70}
                max={200}
                step={1}
                value={config.windSpeedMph}
                onChange={(event) =>
                  onWindSpeedChange(Number(event.target.value))
                }
                aria-label="Edit wind speed in miles per hour"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              />
              <SourcePill label="Derived/Assumed" tier="Derived/Assumed" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="exposure"
                  className="text-sm font-medium text-navy"
                >
                  Exposure
                </label>
                <EditedPill edited={config.exposure !== defaultConfig.exposure} />
              </div>
              <select
                id="exposure"
                aria-label="Select exposure category"
                value={config.exposure}
                onChange={(event) =>
                  onExposureChange(event.target.value as ExposureOption)
                }
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              <SourcePill
                label={config.exposure === "C" ? "Code-Verified" : "Derived/Assumed"}
                tier={config.exposure === "C" ? "Code-Verified" : "Derived/Assumed"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="risk-category"
                className="text-sm font-medium text-navy"
              >
                Risk Category
              </label>
              <EditedPill
                edited={config.riskCategory !== defaultConfig.riskCategory}
              />
            </div>
            <select
              id="risk-category"
              aria-label="Select risk category"
              value={config.riskCategory}
              onChange={(event) =>
                onRiskCategoryChange(event.target.value as RiskCategoryOption)
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
            </select>
            <SourcePill
              label={
                config.riskCategory === "II" ? "Code-Verified" : "Derived/Assumed"
              }
              tier={
                config.riskCategory === "II" ? "Code-Verified" : "Derived/Assumed"
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-slate-50 p-4 text-sm leading-6 text-steel">
          <p className="font-semibold text-navy">Fixed default factors</p>
          <p>Kzt = 1.0, Ke = 1.0, Kd = 0.85, Gh = 0.85</p>
          <p className="mt-2">
            These are surfaced in the traceability table so you can explain which
            ones are code-verified and which remain interactive assumptions.
          </p>
        </section>
      </div>
    </aside>
  );
}
