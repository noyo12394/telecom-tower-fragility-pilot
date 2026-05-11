"use client";

import type { TowerConfig, TowerPreset } from "@/lib/tower";

interface ComparisonPresetsProps {
  presets: TowerPreset[];
  config: TowerConfig;
  onLoadPreset: (config: TowerConfig) => void;
}

export function ComparisonPresets({
  presets,
  config,
  onLoadPreset
}: ComparisonPresetsProps) {
  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Comparison presets</p>
          <h2 className="section-title">Height Study Cards</h2>
        </div>
        <span className="rounded-full border border-literature/30 bg-literature/10 px-3 py-1 text-xs font-medium text-literature">
          Literature-Backed
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {presets.map((preset) => {
          const selected =
            config.heightMeters === preset.config.heightMeters &&
            config.panelCount === preset.config.panelCount &&
            config.bottomWidthMeters === preset.config.bottomWidthMeters &&
            config.topWidthMeters === preset.config.topWidthMeters;

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onLoadPreset(preset.config)}
              className={`rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-line bg-slate-50 hover:border-accent/50 hover:bg-white"
              }`}
              aria-label={`Load ${preset.label} comparison preset`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-navy">
                  {preset.label}
                </h3>
                <span className="rounded-full border border-derived/30 bg-derived/10 px-2 py-1 text-[11px] font-medium text-derived">
                  H/10 + H/50 derived widths
                </span>
              </div>

              <p className="mb-2 text-sm font-medium text-ink">
                {preset.summary}
              </p>
              <p className="text-sm leading-6 text-steel">
                {preset.justification}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
