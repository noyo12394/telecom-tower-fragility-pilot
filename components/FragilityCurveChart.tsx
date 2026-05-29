"use client";

import { useMemo, useRef, useState } from "react";
import {
  computeFragility,
  fragilityCdf,
  type DamageState,
  type FragilityCurvePoint
} from "@/lib/fragility";
import { type DesignCheckSummary } from "@/lib/designChecks";
import { type TowerConfig, type UnitSystem } from "@/lib/tower";
import { milesPerHourToMetersPerSecond } from "@/lib/wind";

interface FragilityCurveChartProps {
  config: TowerConfig;
  checks: DesignCheckSummary;
  unitSystem: UnitSystem;
}

const W = 700;
const H = 420;
const PAD = { top: 28, right: 32, bottom: 56, left: 64 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function yForProb(p: number) {
  return PAD.top + (1 - p) * PLOT_H;
}

// Dynamic x-scale: auto-fits so all 4 sigmoid curves are always visible.
// Shows 0 → 1.6× the Slight DS median (the lowest threshold), minimum 60 m/s.
function getMaxMps(result: { parameters: Array<{ damageState: DamageState; medianMps: number }> }): number {
  const slightMedian = result.parameters.find((p) => p.damageState === "Slight")?.medianMps ?? 25;
  return Math.max(60, slightMedian * 3.2);
}

function xForSpeed(v: number, maxMps: number, unitSystem: UnitSystem) {
  const max = unitSystem === "imperial" ? maxMps / 0.44704 : maxMps;
  const val = unitSystem === "imperial" ? v : v;
  return PAD.left + (val / max) * PLOT_W;
}

function buildPath(
  points: FragilityCurvePoint[],
  ds: DamageState,
  maxMps: number,
  unitSystem: UnitSystem
): string {
  return points
    .map((pt, i) => {
      const v = unitSystem === "imperial" ? pt.windSpeedMph : pt.windSpeedMps;
      const x = xForSpeed(v, maxMps, unitSystem);
      const y = yForProb(pt.probabilities[ds]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const DS_ORDER: DamageState[] = ["Slight", "Moderate", "Extensive", "Collapse"];

export function FragilityCurveChart({ config, checks, unitSystem }: FragilityCurveChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [showReference, setShowReference] = useState(true);

  const result = useMemo(() => computeFragility(config, checks), [config, checks]);

  const maxMps = useMemo(() => getMaxMps(result), [result]);
  const maxDisplay = unitSystem === "imperial" ? maxMps / 0.44704 : maxMps;

  const designSpeed =
    unitSystem === "imperial"
      ? result.designWindSpeedMph
      : result.designWindSpeedMps;

  const xDesign = xForSpeed(designSpeed, maxMps, unitSystem);

  // Convert hover pixel x to wind speed
  const hoverSpeed = hoverX !== null
    ? ((hoverX - PAD.left) / PLOT_W) * maxDisplay
    : null;

  const hoverProbs = hoverSpeed !== null && hoverSpeed > 0
    ? Object.fromEntries(
        result.parameters.map((p) => [
          p.damageState,
          fragilityCdf(
            unitSystem === "imperial"
              ? hoverSpeed * 0.44704
              : hoverSpeed,
            p.medianMps,
            p.beta
          )
        ])
      ) as Record<DamageState, number>
    : null;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = W / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    if (x >= PAD.left && x <= PAD.left + PLOT_W) {
      setHoverX(x);
    } else {
      setHoverX(null);
    }
  }

  // Grid lines — auto-scale x ticks to maxDisplay
  const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const xTickStep = maxDisplay > 120 ? 20 : maxDisplay > 80 ? 15 : 10;
  const xTickValues: number[] = [];
  for (let v = 0; v <= maxDisplay; v += xTickStep) xTickValues.push(Math.round(v));

  return (
    <section className="panel-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Fragility analysis</p>
          <h2 className="section-title">Wind Fragility Curves</h2>
          <p className="mt-2 text-sm leading-6 text-steel max-w-2xl">
            Lognormal fragility curves derived from Bilionis &amp; Vamvatsikos
            2019 baseline, scaled for this tower&apos;s height, bracing type,
            and worst KL/r utilization. The vertical line marks the current
            design wind speed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowReference((v) => !v)}
          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
            showReference
              ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300"
              : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          {showReference ? "Hide reference" : "Show reference"}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {result.parameters.map((p) => (
          <div key={p.damageState} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-8 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-sm font-medium text-slate-200">{p.damageState}</span>
          </div>
        ))}
        {showReference && (
          <div className="flex items-center gap-2 ml-2 border-l border-line pl-3">
            <span
              className="inline-block h-3 w-8 rounded-full border border-slate-400"
              style={{ background: "repeating-linear-gradient(90deg,#94a3b8 0 6px,transparent 6px 12px)" }}
            />
            <span className="text-sm text-steel">Bilionis 2019 ref.</span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[560px] w-full rounded-[28px] border border-white/10 bg-[#0d1a2d] cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverX(null)}
          role="img"
          aria-label="Wind fragility curves"
        >
          {/* Grid */}
          {yTicks.map((p) => (
            <g key={p}>
              <line
                x1={PAD.left}
                y1={yForProb(p)}
                x2={PAD.left + PLOT_W}
                y2={yForProb(p)}
                stroke="#1e3a5f"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={yForProb(p) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
              >
                {(p * 100).toFixed(0)}%
              </text>
            </g>
          ))}
          {xTickValues.map((v) => (
            <g key={v}>
              <line
                x1={xForSpeed(v, maxMps, unitSystem)}
                y1={PAD.top}
                x2={xForSpeed(v, maxMps, unitSystem)}
                y2={PAD.top + PLOT_H}
                stroke="#1e3a5f"
                strokeWidth="1"
              />
              <text
                x={xForSpeed(v, maxMps, unitSystem)}
                y={PAD.top + PLOT_H + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={PAD.left + PLOT_W / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize="12"
            fill="#94a3b8"
            fontWeight="500"
          >
            Wind Speed ({unitSystem === "imperial" ? "mph" : "m/s"})
          </text>
          <text
            x={16}
            y={PAD.top + PLOT_H / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#94a3b8"
            fontWeight="500"
            transform={`rotate(-90, 16, ${PAD.top + PLOT_H / 2})`}
          >
            P(DS ≥ ds | V)
          </text>

          {/* Reference curves (dashed) */}
          {showReference &&
            result.referenceParameters.map((ref) => {
              const path = buildPath(result.curve, ref.damageState, maxMps, unitSystem);
              return (
                <path
                  key={`ref-${ref.damageState}`}
                  d={path}
                  stroke={ref.color}
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  fill="none"
                  opacity="0.45"
                />
              );
            })}

          {/* Main curves */}
          {result.parameters.map((p) => (
            <path
              key={p.damageState}
              d={buildPath(result.curve, p.damageState, maxMps, unitSystem)}
              stroke={p.color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          ))}

          {/* Design wind speed marker */}
          <line
            x1={xDesign}
            y1={PAD.top}
            x2={xDesign}
            y2={PAD.top + PLOT_H}
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          <text
            x={xDesign + 5}
            y={PAD.top + 16}
            fontSize="11"
            fill="#22d3ee"
            fontWeight="600"
          >
            {unitSystem === "imperial"
              ? `${config.windSpeedMph} mph design`
              : `${result.designWindSpeedMps.toFixed(1)} m/s design`}
          </text>

          {/* Hover vertical line */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1={PAD.top}
              x2={hoverX}
              y2={PAD.top + PLOT_H}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Dots at design speed */}
          {DS_ORDER.map((ds) => {
            const param = result.parameters.find((p) => p.damageState === ds)!;
            const y = yForProb(result.designProbabilities[ds]);
            return (
              <circle
                key={ds}
                cx={xDesign}
                cy={y}
                r="4"
                fill={param.color}
                stroke="white"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Axes borders */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Probability readout table */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {result.parameters.map((p) => {
          const prob = hoverProbs
            ? hoverProbs[p.damageState]
            : result.designProbabilities[p.damageState];
          const label = hoverProbs
            ? `at ${hoverSpeed!.toFixed(unitSystem === "imperial" ? 0 : 1)} ${unitSystem === "imperial" ? "mph" : "m/s"}`
            : `at design wind (${config.windSpeedMph} mph)`;

          return (
            <div
              key={p.damageState}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
              style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-steel">
                {p.damageState}
              </p>
              <p
                className="mt-2 text-3xl font-bold tabular-nums"
                style={{ color: p.color }}
              >
                {(prob * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-steel">{label}</p>
              <p className="mt-2 text-[11px] leading-5 text-steel">
                median {p.medianMps.toFixed(1)} m/s / {(p.medianMps / 0.44704).toFixed(0)} mph
              </p>
            </div>
          );
        })}
      </div>

      {/* Parameters table */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-navy hover:underline">
          Fragility parameters used
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 text-left font-semibold text-navy">Damage state</th>
                <th className="py-2 text-right font-semibold text-navy">Median (m/s)</th>
                <th className="py-2 text-right font-semibold text-navy">Median (mph)</th>
                <th className="py-2 text-right font-semibold text-navy">β (dispersion)</th>
                <th className="py-2 text-left pl-4 font-semibold text-navy">Description</th>
              </tr>
            </thead>
            <tbody>
              {result.parameters.map((p) => (
                <tr key={p.damageState} className="border-b border-line/50">
                  <td className="py-2 font-medium" style={{ color: p.color }}>
                    {p.damageState}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink">
                    {p.medianMps.toFixed(2)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink">
                    {(p.medianMps / 0.44704).toFixed(1)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink">{p.beta.toFixed(2)}</td>
                  <td className="py-2 pl-4 text-steel">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-steel">
          Collapse median derived from Bilionis &amp; Vamvatsikos 2019 (48 m baseline, 42 m/s),
          scaled by tower height (H^{`−0.12`}), bracing efficiency factor, worst KL/r
          utilization, appurtenance loading, and exposure category. Damage state medians are
          fractions of the collapse median: Slight 55%, Moderate 70%, Extensive 87%.
          All parameters are preliminary research estimates — not certified design values.
        </p>
      </details>
    </section>
  );
}
