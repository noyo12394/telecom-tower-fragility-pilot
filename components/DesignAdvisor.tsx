"use client";

import { useMemo, useState } from "react";

import { type DesignCheckSummary } from "@/lib/designChecks";
import {
  computeDesignHealth,
  type AdvisorSeverity
} from "@/lib/designAdvisor";
import { buildDesignNarrative } from "@/lib/designNarrative";
import { computeFragility } from "@/lib/fragility";
import { calculateAllPanelLengths } from "@/lib/elementLengths";
import { calculateMaterialEstimate } from "@/lib/materialQuantity";
import { optimizeDesign, type OptimizationResult } from "@/lib/optimizer";
import {
  computeSensitivity,
  type SensitivityParameter
} from "@/lib/sensitivity";
import { buildPanelMemberProfiles, type TowerConfig } from "@/lib/tower";

interface DesignAdvisorProps {
  config: TowerConfig;
  checks: DesignCheckSummary;
  onApplyConfig: (config: TowerConfig) => void;
}

function severityBadge(severity: AdvisorSeverity) {
  if (severity === "critical") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }
  if (severity === "warning") {
    return "border-amber-400/40 bg-amber-400/10 text-amber-300";
  }
  return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
}

function severityLabel(severity: AdvisorSeverity) {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "Review";
  return "OK";
}

function HealthGauge({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <svg width="144" height="144" className="-rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="12"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}

function Sparkline({
  config
}: {
  config: TowerConfig;
}) {
  const [parameter, setParameter] = useState<SensitivityParameter>("windSpeedMph");
  const result = useMemo(
    () => computeSensitivity(config, parameter),
    [config, parameter]
  );

  const width = 320;
  const height = 90;
  const padX = 8;
  const padY = 10;
  const max = Math.max(...result.points.map((p) => p.collapseProbability), 0.001);

  const bars = result.points.map((point, index) => {
    const barWidth = (width - 2 * padX) / result.points.length;
    const x = padX + index * barWidth;
    const h = (point.collapseProbability / max) * (height - 2 * padY);
    const y = height - padY - h;
    return { ...point, x, y, h, barWidth };
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="micro-label text-cyan-300">What-if: collapse risk vs.</p>
        <div className="flex gap-1">
          {(
            [
              ["windSpeedMph", "Wind"],
              ["bottomWidthMeters", "Base"],
              ["heightMeters", "Height"]
            ] as Array<[SensitivityParameter, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setParameter(key)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                parameter === key
                  ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
        {bars.map((bar) => (
          <g key={bar.value}>
            <rect
              x={bar.x + 2}
              y={bar.y}
              width={bar.barWidth - 4}
              height={Math.max(bar.h, 1)}
              rx="3"
              fill={bar.isCurrent ? "#22d3ee" : "rgba(34,211,238,0.35)"}
            />
            <text
              x={bar.x + bar.barWidth / 2}
              y={height - 1}
              textAnchor="middle"
              className="fill-slate-500"
              style={{ fontSize: 8 }}
            >
              {bar.value}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Bars show estimated collapse probability as {result.parameterLabel.toLowerCase()} varies
        ({result.unit}). The cyan bar is the current setting. Highest:{" "}
        {(Math.max(...result.points.map((p) => p.collapseProbability)) * 100).toFixed(0)}% at{" "}
        {
          result.points.reduce((a, b) =>
            b.collapseProbability > a.collapseProbability ? b : a
          ).value
        }{" "}
        {result.unit}.
      </p>
    </div>
  );
}

export function DesignAdvisor({ config, checks, onApplyConfig }: DesignAdvisorProps) {
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const { health, narrative } = useMemo(() => {
    const panels = calculateAllPanelLengths(
      config.heightMeters,
      config.panelCount,
      config.bottomWidthMeters,
      config.topWidthMeters,
      config.bracing
    );
    const memberProfiles = buildPanelMemberProfiles(config.panelCount);
    const fragility = computeFragility(config, checks);
    const material = calculateMaterialEstimate(panels, memberProfiles);
    return {
      health: computeDesignHealth({ config, checks, fragility, material }),
      narrative: buildDesignNarrative({ config, checks, fragility })
    };
  }, [config, checks]);

  function handleOptimize() {
    setOptimizing(true);
    // Defer so the button can show its busy state before the synchronous sweep.
    setTimeout(() => {
      const result = optimizeDesign(config);
      setOptResult(result);
      setOptimizing(false);
    }, 30);
  }

  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label text-cyan-300">AI Design Advisor</p>
          <h2 className="section-title">Smart Review &amp; Recommendations</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            A rule-based advisor that reads the current configuration, slenderness
            checks, and fragility outlook to produce a health score and prioritized,
            actionable guidance. Research visualization only — not a stamped
            structural design.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <HealthGauge score={health.score} color={health.color} label={health.label} />
          <div className="grid w-full grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <p className="text-slate-500">Pass rate</p>
              <p className="font-semibold text-cyan-300">
                {(health.slendernessPassRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <p className="text-slate-500">Collapse P</p>
              <p className="font-semibold text-cyan-300">
                {(health.collapseProbability * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <p className="text-slate-500">Proportion</p>
              <p className="font-semibold text-cyan-300">
                {(health.proportioningScore * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <p className="text-slate-500">Efficiency</p>
              <p className="font-semibold text-cyan-300">
                {(health.efficiencyScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={optimizing}
            className="w-full rounded-xl border border-cyan-400/60 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/25 disabled:opacity-50"
          >
            {optimizing ? "Optimizing…" : "⚡ Auto-Optimize design"}
          </button>
        </div>

        <div className="space-y-3">
          {health.recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`rounded-2xl border px-4 py-3 ${severityBadge(rec.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{rec.title}</p>
                <span className="shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                  {severityLabel(rec.severity)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-300">{rec.explanation}</p>
              {rec.suggestion ? (
                <p className="mt-1.5 text-xs leading-5 text-slate-200">
                  <span className="font-semibold text-cyan-300">Suggestion: </span>
                  {rec.suggestion}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {optResult ? (
        <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="micro-label text-cyan-300">Auto-Optimize result</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {optResult.improved
                  ? "Found a better-scoring design"
                  : "Current design is already near-optimal"}
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-200">
                {optResult.summary.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">
                Evaluated {optResult.candidatesEvaluated} candidate configurations.
              </p>
            </div>
            {optResult.improved ? (
              <button
                type="button"
                onClick={() => onApplyConfig(optResult.best.config)}
                className="rounded-xl border border-cyan-400/60 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/25"
              >
                Apply optimized design
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="micro-label text-cyan-300">Explain this design</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{narrative}</p>
        </div>
        <Sparkline config={config} />
      </div>
    </section>
  );
}
