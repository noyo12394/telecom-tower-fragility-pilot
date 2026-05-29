"use client";

import { useMemo, useState } from "react";
import {
  ANTENNA_CONFIGS,
  MEMBER_TABLE,
  runLatticeDesign,
  type AntennaConfig,
  type IterLogEntry,
  type TowerElement,
} from "@/lib/latticeDesign";

// ── helpers ──────────────────────────────────────────────────────────────────

function memberColor(el: TowerElement, allowable: number): string {
  if (!el.passed) return "#EF4444";
  if (el.memberType === "leg") return "#3B82F6";
  if (el.memberType === "horizontal") return "#22C55E";
  return "#F97316";
}

function utilisation(el: TowerElement, allowable: number): number {
  return el.stress / (allowable > 0 ? allowable : 1);
}

// ── Slider sub-component ──────────────────────────────────────────────────────

function LabeledSlider({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-semibold text-cyan-300">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-cyan-400 cursor-pointer"
      />
    </div>
  );
}

// ── SVG Tower Elevation View ──────────────────────────────────────────────────

function TowerElevationSVG({
  elements,
  nodes,
  allowable,
  nPanels,
  height,
}: {
  elements: TowerElement[];
  nodes: { id: number; x: number; z: number }[];
  allowable: number;
  nPanels: number;
  height: number;
}) {
  const W = 340;
  const H = 520;
  const PAD_LEFT = 40;
  const PAD_RIGHT = 16;
  const PAD_TOP = 16;
  const PAD_BOT = 28;
  const drawW = W - PAD_LEFT - PAD_RIGHT;
  const drawH = H - PAD_TOP - PAD_BOT;

  const xMin = Math.min(...nodes.map((n) => n.x));
  const xMax = Math.max(...nodes.map((n) => n.x));
  const xRange = xMax - xMin || 1;

  function toSvgX(x: number) {
    return PAD_LEFT + ((x - xMin) / xRange) * drawW;
  }
  function toSvgY(z: number) {
    return PAD_TOP + (1 - z / height) * drawH;
  }

  const panelHeight = height / nPanels;
  // thin fixed strokes — diagonal stress is naturally high so don't scale too much
  function strokeW(el: TowerElement) {
    const u = Math.min(utilisation(el, allowable), 1.5);
    if (el.memberType === "leg") return 1.2 + u * 1.5;
    if (el.memberType === "horizontal") return 0.8 + u * 0.8;
    return 0.6 + u * 0.6; // diagonals stay thin
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
      {/* background */}
      <rect x={PAD_LEFT} y={PAD_TOP} width={drawW} height={drawH} fill="rgba(255,255,255,0.02)" rx={4} />

      {/* height grid lines + labels */}
      {Array.from({ length: nPanels + 1 }).map((_, i) => {
        const z = i * panelHeight;
        const sy = toSvgY(z);
        return (
          <g key={i}>
            <line x1={PAD_LEFT} y1={sy} x2={PAD_LEFT + drawW} y2={sy} stroke="#1e3a5f" strokeWidth={0.5} />
            <line x1={PAD_LEFT - 5} y1={sy} x2={PAD_LEFT} y2={sy} stroke="#475569" strokeWidth={0.8} />
            <text x={PAD_LEFT - 7} y={sy + 3.5} textAnchor="end" fill="#64748b" fontSize={8}>
              {z.toFixed(0)}m
            </text>
          </g>
        );
      })}

      {/* members — draw legs last so they appear on top */}
      {[
        ...elements.filter((e) => e.memberType === "diagonal"),
        ...elements.filter((e) => e.memberType === "horizontal"),
        ...elements.filter((e) => e.memberType === "leg"),
      ].map((el) => {
        const col = memberColor(el, allowable);
        return (
          <line
            key={el.id}
            x1={toSvgX(el.nodeI.x)}
            y1={toSvgY(el.nodeI.z)}
            x2={toSvgX(el.nodeJ.x)}
            y2={toSvgY(el.nodeJ.z)}
            stroke={col}
            strokeWidth={strokeW(el)}
            strokeLinecap="round"
            opacity={el.memberType === "diagonal" ? 0.6 : 0.9}
          />
        );
      })}

      {/* legend at bottom */}
      {[
        { label: "Leg", color: "#3B82F6" },
        { label: "Horizontal", color: "#22C55E" },
        { label: "Diagonal", color: "#F97316" },
        { label: "Failed", color: "#EF4444" },
      ].map(({ label, color }, i) => (
        <g key={label}>
          <line x1={PAD_LEFT + i * 76} y1={H - 10} x2={PAD_LEFT + i * 76 + 12} y2={H - 10} stroke={color} strokeWidth={2} />
          <text x={PAD_LEFT + i * 76 + 15} y={H - 6} fill="#94a3b8" fontSize={8}>{label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Stress Utilisation Bar Chart ──────────────────────────────────────────────

function UtilisationChart({
  elements,
  allowable,
}: {
  elements: TowerElement[];
  allowable: number;
}) {
  const ordered = [
    ...elements.filter((e) => e.memberType === "leg"),
    ...elements.filter((e) => e.memberType === "horizontal"),
    ...elements.filter((e) => e.memberType === "diagonal"),
  ];

  const barH = 4;
  const labelW = 20;
  const chartW = 440;
  const maxUtil = Math.max(1.2, ...ordered.map((e) => utilisation(e, allowable)));
  const contentH = ordered.length * barH + 4;
  const svgH = contentH + 30; // room for axis label

  return (
    <svg
      viewBox={`0 0 500 ${svgH}`}
      className="w-full"
      style={{ height: Math.min(360, svgH), display: "block" }}
    >
      {/* axis label */}
      <text x={labelW + chartW / 2} y={svgH - 8} textAnchor="middle" fill="#64748b" fontSize={9}>
        σ / σ_allow
      </text>

      {/* red limit line at x=1.0 */}
      {(() => {
        const lx = labelW + (1.0 / maxUtil) * chartW;
        return (
          <line
            x1={lx}
            y1={4}
            x2={lx}
            y2={svgH - 18}
            stroke="#EF4444"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        );
      })()}

      {ordered.map((el, i) => {
        const u = Math.min(utilisation(el, allowable), maxUtil);
        const bw = (u / maxUtil) * chartW;
        const col = memberColor(el, allowable);
        const y = 4 + i * barH;
        return (
          <rect
            key={el.id}
            x={labelW}
            y={y}
            width={bw}
            height={barH - 0.5}
            fill={col}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}

// ── Iteration Log ─────────────────────────────────────────────────────────────

function IterationLog({ log, converged }: { log: IterLogEntry[]; converged: boolean }) {
  const maxFailed = Math.max(...log.map((e) => e.nFailed), 1);
  return (
    <div className="panel-card p-5 space-y-4">
      <div>
        <p className="micro-label">Convergence trace</p>
        <h3 className="section-title text-sm mt-1">Real-time Iteration Log</h3>
        <p className="text-xs text-slate-400 mt-1">
          Each row = one pass of the size-upgrade loop, mirroring the notebook output.
        </p>
      </div>

      <div className="space-y-1.5">
        {log.map((entry) => {
          const isLast = entry === log[log.length - 1];
          const barPct = maxFailed > 0 ? (entry.nFailed / maxFailed) * 100 : 0;
          const done = entry.nFailed === 0;
          return (
            <div key={entry.iter} className={`rounded-xl border px-3 py-2 text-xs flex items-center gap-3 ${
              done
                ? "border-green-500/30 bg-green-500/8"
                : isLast && !converged
                ? "border-red-500/30 bg-red-500/8"
                : "border-white/8 bg-white/4"
            }`}>
              <span className="w-14 shrink-0 font-mono text-slate-400">Iter {entry.iter}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${done ? "bg-green-500" : "bg-orange-400"}`}
                  style={{ width: done ? "0%" : `${barPct}%` }}
                />
              </div>
              {done ? (
                <span className="text-green-400 font-semibold shrink-0">✓ converged</span>
              ) : (
                <>
                  <span className="text-red-400 shrink-0 w-20">{entry.nFailed} failed</span>
                  <span className="text-cyan-300 shrink-0 w-24">{entry.nUpgraded} upgraded</span>
                </>
              )}
            </div>
          );
        })}
        {!converged && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2 text-xs text-red-400">
            ⚠ Did not converge within {log.length} iterations — see advisor below for fixes
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stability Advisor ─────────────────────────────────────────────────────────

interface Tip {
  severity: "critical" | "warning" | "ok";
  title: string;
  detail: string;
  fix: string;
}

function buildTips(inp: {
  height: number;
  baseSize: number;
  topSize: number;
  nPanels: number;
  windSpeed: number;
  endCondition: string;
}, converged: boolean, nFailed: number, allowable: number, elements: TowerElement[]): Tip[] {
  const tips: Tip[] = [];
  const ratio = inp.height / inp.baseSize;
  const recommendedBase = +(inp.height / 10).toFixed(1);
  const recommendedBaseMin = +(inp.height / 8).toFixed(1);
  const panelHeight = inp.height / inp.nPanels;

  // Base width vs height
  if (ratio > 14) {
    tips.push({
      severity: "critical",
      title: "Base too narrow for this height",
      detail: `Height/base = ${ratio.toFixed(1)}× — typical lattice towers use 8–12× (ASCE/TIA guideline). At 1/${ratio.toFixed(0)} your base cannot resist overturning wind moment, which is why members keep failing.`,
      fix: `Increase base width to at least ${recommendedBase} m (H/10) — ideally ${recommendedBaseMin} m (H/8) for this wind speed.`,
    });
  } else if (ratio > 12) {
    tips.push({
      severity: "warning",
      title: "Base width approaching slender limit",
      detail: `Height/base = ${ratio.toFixed(1)}× — slightly above the typical 8–12× band. Leg sections will be larger than necessary.`,
      fix: `Try base width ${recommendedBase} m (H/10) to reduce overturning demand.`,
    });
  } else {
    tips.push({ severity: "ok", title: "Base proportioning — OK", detail: `Height/base = ${ratio.toFixed(1)}× is within the 8–12× design band.`, fix: "No change needed." });
  }

  // Wind speed
  if (inp.windSpeed > 55) {
    tips.push({
      severity: "critical",
      title: "Very high wind speed",
      detail: `${inp.windSpeed} m/s wind creates dynamic pressure q = ${(0.5 * 1.25 * inp.windSpeed ** 2 * 1.3).toFixed(0)} Pa — sections escalate rapidly to L150×150×15. This may exceed the lookup table.`,
      fix: `Try wind speed ≤ 50 m/s, or verify the site Vb. For high-wind sites upgrade to fixed-free end condition and increase panels.`,
    });
  } else if (inp.windSpeed > 45) {
    tips.push({
      severity: "warning",
      title: "Elevated wind speed",
      detail: `${inp.windSpeed} m/s will require heavier base leg sections. Convergence may need more iterations.`,
      fix: `Reducing wind speed to 40 m/s cuts wind pressure by ${(100 * (1 - (40 / inp.windSpeed) ** 2)).toFixed(0)}%.`,
    });
  }

  // Panel count vs height
  const idealPanels = Math.round(inp.height / 5);
  if (panelHeight > 7) {
    tips.push({
      severity: "warning",
      title: "Panels too few — long leg members",
      detail: `Panel height = ${panelHeight.toFixed(1)} m. Long leg members have high slenderness (KL/r), requiring larger sections to satisfy Euler buckling even when stress is low.`,
      fix: `Increase panels to ${idealPanels} (≈ H/5 per panel = ${(inp.height / idealPanels).toFixed(1)} m each). This shortens legs and cuts KL/r significantly.`,
    });
  } else if (panelHeight < 2.5) {
    tips.push({
      severity: "warning",
      title: "Panels very short — may be over-segmented",
      detail: `Panel height = ${panelHeight.toFixed(1)} m. Very short panels add element count without improving stability.`,
      fix: `Try ${Math.max(4, idealPanels)} panels for a ${(inp.height / Math.max(4, idealPanels)).toFixed(1)} m panel height.`,
    });
  }

  // End condition
  if (inp.endCondition === "fixed-free" && converged) {
    tips.push({
      severity: "ok",
      title: "Fixed-free end condition — conservative",
      detail: "Fixed-free (K=2) doubles effective length, doubling KL/r. This is appropriate for flagpole-like towers without cross-bracing at the base.",
      fix: "If the base is properly anchored with bracing, pin-pin (K=1) is more realistic and will reduce section sizes.",
    });
  }

  // Non-convergence root cause
  if (!converged) {
    const failedLegs = elements.filter((e) => e.memberType === "leg" && !e.passed);
    if (failedLegs.length > 0) {
      tips.push({
        severity: "critical",
        title: "Legs exhausted the section table",
        detail: `${failedLegs.length} leg members reached L150×150×15 (largest available) and still fail. The geometry demands forces the lookup table cannot handle.`,
        fix: `Widen the base to ${recommendedBaseMin} m, reduce wind speed below 50 m/s, or increase panels to ${idealPanels}. Any one of these changes should restore convergence.`,
      });
    }
  }

  // All good
  if (converged && nFailed === 0 && ratio <= 12 && inp.windSpeed <= 50) {
    tips.push({ severity: "ok", title: "Design converged — all checks pass", detail: "All members satisfy stress and Euler buckling checks within the lookup table.", fix: "Review the steel section breakdown below for potential optimisation." });
  }

  return tips;
}

function StabilityAdvisor({ inp, converged, nFailed, allowable, elements }: {
  inp: { height: number; baseSize: number; topSize: number; nPanels: number; windSpeed: number; endCondition: string };
  converged: boolean;
  nFailed: number;
  allowable: number;
  elements: TowerElement[];
}) {
  const tips = buildTips(inp, converged, nFailed, allowable, elements);
  const hasCritical = tips.some((t) => t.severity === "critical");

  return (
    <div className="panel-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Intelligent advisor</p>
          <h3 className="section-title text-sm mt-1">What to Change for a Stable Tower</h3>
          <p className="text-xs text-slate-400 mt-1">
            Analysing geometry, wind demand, panel sizing, and section table limits.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${
          hasCritical
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : converged
            ? "border-green-500/40 bg-green-500/10 text-green-400"
            : "border-orange-500/40 bg-orange-500/10 text-orange-400"
        }`}>
          {hasCritical ? "Action required" : converged ? "All clear" : "Review needed"}
        </span>
      </div>

      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className={`rounded-xl border p-4 space-y-2 ${
            tip.severity === "critical"
              ? "border-red-500/30 bg-red-500/8"
              : tip.severity === "warning"
              ? "border-orange-400/30 bg-orange-400/8"
              : "border-green-500/20 bg-green-500/6"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{tip.severity === "critical" ? "🔴" : tip.severity === "warning" ? "🟡" : "🟢"}</span>
              <p className={`text-sm font-semibold ${
                tip.severity === "critical" ? "text-red-400" : tip.severity === "warning" ? "text-orange-300" : "text-green-400"
              }`}>{tip.title}</p>
            </div>
            <p className="text-xs text-slate-300 leading-5">{tip.detail}</p>
            <div className="rounded-lg bg-white/5 px-3 py-2 border border-white/8">
              <span className="text-xs font-semibold text-cyan-400">→ Fix: </span>
              <span className="text-xs text-cyan-200">{tip.fix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LatticeLab() {
  const [height, setHeight] = useState(30);
  const [baseSize, setBaseSize] = useState(3);
  const [topSize, setTopSize] = useState(0.6);
  const [nPanels, setNPanels] = useState(6);
  const [windSpeed, setWindSpeed] = useState(40);
  const [antennaIdx, setAntennaIdx] = useState(0);
  const [endCondition, setEndCondition] = useState<"pin-pin" | "fixed-free">("pin-pin");

  const antenna: AntennaConfig = ANTENNA_CONFIGS[antennaIdx];

  const inp = useMemo(
    () => ({
      height,
      baseSize,
      topSize,
      nPanels,
      windSpeed,
      antennaConfig: antenna,
      E: 210e9,
      allowableStress: 250e6,
      safetyFactor: 1.5,
      endCondition,
      airDensity: 1.25,
      Cd: 1.3,
    }),
    [height, baseSize, topSize, nPanels, windSpeed, antenna, endCondition]
  );

  const result = useMemo(() => runLatticeDesign(inp), [inp]);
  const allowable = inp.allowableStress / inp.safetyFactor;

  // Governing leg section (most common)
  const legSections = result.elements
    .filter((e) => e.memberType === "leg")
    .map((e) => e.size.label);
  const sectionCounts: Record<string, number> = {};
  for (const s of legSections) sectionCounts[s] = (sectionCounts[s] ?? 0) + 1;
  const governingSection =
    Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Steel breakdown
  interface BreakdownRow { label: string; count: number; totalLength: number }
  const breakdown: Record<string, BreakdownRow> = {};
  for (const el of result.elements) {
    const lbl = el.size.label;
    const dx = el.nodeJ.x - el.nodeI.x;
    const dy = el.nodeJ.y - el.nodeI.y;
    const dz = el.nodeJ.z - el.nodeI.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!breakdown[lbl]) breakdown[lbl] = { label: lbl, count: 0, totalLength: 0 };
    breakdown[lbl].count++;
    breakdown[lbl].totalLength += L;
  }
  const breakdownRows = Object.values(breakdown).sort((a, b) => {
    const ia = MEMBER_TABLE.findIndex((m) => m.label === a.label);
    const ib = MEMBER_TABLE.findIndex((m) => m.label === b.label);
    return ia - ib;
  });
  const maxCount = Math.max(...breakdownRows.map((r) => r.count), 1);

  const nodesMapped = result.nodes.map((n) => ({ id: n.id, x: n.x, z: n.z }));

  return (
    <div className="space-y-4">
      {/* disclaimer */}
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-300">
        Preliminary academic tool — approximate statics, not stamped design
      </div>

      <div className="flex gap-4 flex-col xl:flex-row">
        {/* ── Left: controls ── */}
        <div className="w-full xl:w-80 shrink-0 space-y-4 xl:sticky xl:top-5 xl:self-start">
          <div className="panel-card p-5 space-y-5">
            <p className="section-title text-sm">Tower Parameters</p>

            <LabeledSlider label="Height" unit="m" min={10} max={80} step={5} value={height} onChange={setHeight} />
            <LabeledSlider label="Base width" unit="m" min={1} max={10} step={0.5} value={baseSize} onChange={setBaseSize} />
            <LabeledSlider label="Top width" unit="m" min={0.3} max={3} step={0.1} value={topSize} onChange={setTopSize} />
            <LabeledSlider label="Panels" unit="" min={4} max={16} step={1} value={nPanels} onChange={setNPanels} />
            <LabeledSlider label="Wind speed" unit="m/s" min={10} max={70} step={1} value={windSpeed} onChange={setWindSpeed} />

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Antenna config</p>
              <select
                value={antennaIdx}
                onChange={(e) => setAntennaIdx(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                {ANTENNA_CONFIGS.map((a, i) => (
                  <option key={i} value={i} className="bg-[#060e1a]">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">End condition</p>
              <div className="flex gap-2">
                {(["pin-pin", "fixed-free"] as const).map((ec) => (
                  <button
                    key={ec}
                    type="button"
                    onClick={() => setEndCondition(ec)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      endCondition === ec
                        ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {ec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live stats */}
          <div className="panel-card p-5 space-y-3">
            <p className="section-title text-sm">Live Results</p>
            {[
              ["Nodes", result.nodes.length],
              ["Elements", result.elements.length],
              ["Iterations", result.iterations],
              ["Mass", `${result.totalMassKg.toFixed(0)} kg`],
              ["Pass / Fail", `${result.elements.length - result.nFailed} / ${result.nFailed}`],
              ["Converged", result.converged ? "Yes" : "No (max iter)"],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-widest">{label}</span>
                <span className={`text-xs font-semibold ${label === "Pass / Fail" && result.nFailed > 0 ? "text-red-400" : "text-cyan-300"}`}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: visualizations ── */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Panel 1: Tower elevation */}
          <div className="panel-card p-4 overflow-hidden">
            <p className="section-title text-sm mb-3">Tower Elevation (Front View)</p>
            <div className="w-full overflow-hidden" style={{ maxHeight: 500 }}>
              <TowerElevationSVG
                elements={result.elements}
                nodes={nodesMapped}
                allowable={allowable}
                nPanels={nPanels}
                height={height}
              />
            </div>
          </div>

          {/* Panel 2: Stress utilisation */}
          <div className="panel-card p-4">
            <p className="section-title text-sm mb-1">Stress Utilisation (σ / σ_allow)</p>
            <p className="text-xs text-slate-500 mb-3">
              Red line = 1.0 limit · bars grouped: legs → horizontals → diagonals
            </p>
            <UtilisationChart elements={result.elements} allowable={allowable} />
            <div className="mt-2 flex gap-4 flex-wrap">
              {[
                { label: "Leg", color: "#3B82F6" },
                { label: "Horizontal", color: "#22C55E" },
                { label: "Diagonal", color: "#F97316" },
                { label: "Failed", color: "#EF4444" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm" style={{ background: color }} />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3a: Iteration log */}
          <IterationLog log={result.iterLog} converged={result.converged} />

          {/* Panel 3b: Stability advisor */}
          <StabilityAdvisor
            inp={{ height, baseSize, topSize, nPanels, windSpeed, endCondition }}
            converged={result.converged}
            nFailed={result.nFailed}
            allowable={allowable}
            elements={result.elements}
          />

          {/* Panel 4: Summary stats */}
          <div className="panel-card p-4 space-y-4">
            <p className="section-title text-sm">Design Summary</p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Total mass", value: `${result.totalMassKg.toFixed(0)} kg` },
                { label: "Tonnes", value: `${(result.totalMassKg / 1000).toFixed(2)} t` },
                { label: "Iterations", value: `${result.iterations}` },
                { label: "Members pass", value: `${result.elements.length - result.nFailed}` },
                { label: "Members fail", value: `${result.nFailed}` },
                { label: "Governing leg", value: governingSection },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <p className="text-xs text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-300">{value}</p>
                </div>
              ))}
            </div>

            {/* Steel breakdown table */}
            <div>
              <p className="micro-label mb-2">Steel section breakdown</p>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-widest">
                      <th className="px-3 py-2 text-left">Section</th>
                      <th className="px-3 py-2 text-right">Count</th>
                      <th className="px-3 py-2 text-right">Total length (m)</th>
                      <th className="px-3 py-2 text-left w-32">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row) => (
                      <tr key={row.label} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-3 py-1.5 font-medium text-cyan-300">{row.label}</td>
                        <td className="px-3 py-1.5 text-right text-slate-300">{row.count}</td>
                        <td className="px-3 py-1.5 text-right text-slate-300">{row.totalLength.toFixed(1)}</td>
                        <td className="px-3 py-1.5">
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-400/70"
                              style={{ width: `${(row.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
