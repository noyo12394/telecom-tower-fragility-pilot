"use client";

import { useMemo, useState } from "react";
import {
  ANTENNA_CONFIGS,
  MEMBER_TABLE,
  runLatticeDesign,
  type AntennaConfig,
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
  const W = 400;
  const H = 600;
  const PAD = 36;
  const drawW = W - PAD * 2;
  const drawH = H - PAD * 2;

  // x: world x → svg x; z: world z → svg y (flipped)
  const xMin = Math.min(...nodes.map((n) => n.x));
  const xMax = Math.max(...nodes.map((n) => n.x));
  const xRange = xMax - xMin || 1;
  const zRange = height;

  function toSvgX(x: number) {
    return PAD + ((x - xMin) / xRange) * drawW;
  }
  function toSvgY(z: number) {
    return PAD + (1 - z / zRange) * drawH;
  }

  const panelHeight = height / nPanels;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* height labels */}
      {Array.from({ length: nPanels + 1 }).map((_, i) => {
        const z = i * panelHeight;
        const sy = toSvgY(z);
        return (
          <g key={i}>
            <line x1={PAD - 6} y1={sy} x2={PAD} y2={sy} stroke="#475569" strokeWidth={0.8} />
            <text x={PAD - 8} y={sy + 4} textAnchor="end" fill="#475569" fontSize={9}>
              {z.toFixed(0)}m
            </text>
          </g>
        );
      })}

      {/* members */}
      {elements.map((el) => {
        const nodeIX = el.nodeI.x;
        const nodeIZ = el.nodeI.z;
        const nodeJX = el.nodeJ.x;
        const nodeJZ = el.nodeJ.z;
        const u = utilisation(el, allowable);
        const sw = Math.max(0.5, 1 + u * 3);
        const col = memberColor(el, allowable);
        return (
          <line
            key={el.id}
            x1={toSvgX(nodeIX)}
            y1={toSvgY(nodeIZ)}
            x2={toSvgX(nodeJX)}
            y2={toSvgY(nodeJZ)}
            stroke={col}
            strokeWidth={sw}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}

      {/* legend */}
      {[
        { label: "Leg", color: "#3B82F6" },
        { label: "Horizontal", color: "#22C55E" },
        { label: "Diagonal", color: "#F97316" },
        { label: "Failed", color: "#EF4444" },
      ].map(({ label, color }, i) => (
        <g key={label} transform={`translate(${PAD + 2}, ${H - PAD + 4 + i * 0})`}>
          <line
            x1={PAD + i * 82}
            y1={H - 20}
            x2={PAD + i * 82 + 14}
            y2={H - 20}
            stroke={color}
            strokeWidth={2}
          />
          <text
            x={PAD + i * 82 + 18}
            y={H - 16}
            fill="#94a3b8"
            fontSize={9}
          >
            {label}
          </text>
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

  const barH = 5;
  const labelW = 60;
  const chartW = 420;
  const maxUtil = Math.max(1.2, ...ordered.map((e) => utilisation(e, allowable)));
  const svgH = Math.min(400, ordered.length * barH + 60);

  return (
    <svg
      viewBox={`0 0 500 ${svgH}`}
      className="w-full"
      style={{ maxHeight: 400 }}
    >
      {/* axis label */}
      <text x={labelW + chartW / 2} y={svgH - 6} textAnchor="middle" fill="#64748b" fontSize={9}>
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
          <div className="panel-card p-4">
            <p className="section-title text-sm mb-3">Tower Elevation (Front View)</p>
            <div className="w-full" style={{ maxHeight: 600 }}>
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

          {/* Panel 3: Summary stats */}
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
