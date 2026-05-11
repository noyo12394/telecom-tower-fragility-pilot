import { formatQzSubstitution, computeQz, newtonsPerSquareMeterToPsf } from "@/lib/wind";
import type { TowerConfig, TowerPanelGeometry } from "@/lib/tower";

interface WindCalculatorProps {
  config: TowerConfig;
  panels: TowerPanelGeometry[];
}

export function WindCalculator({ config, panels }: WindCalculatorProps) {
  const midTowerSubstitution = formatQzSubstitution({
    zMeters: config.heightMeters / 2,
    windSpeedMph: config.windSpeedMph,
    exposure: config.exposure
  });

  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Wind load calculator</p>
          <h2 className="section-title">Live qz by Panel Elevation</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-verified/30 bg-verified/10 px-3 py-1 text-xs font-medium text-verified">
            Code-Verified qz equation
          </span>
          <span className="rounded-full border border-derived/30 bg-derived/10 px-3 py-1 text-xs font-medium text-derived">
            Exposure constants shown transparently
          </span>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-navy/10 bg-navy px-5 py-4 text-white">
        <p className="micro-label text-slate-300">Current substitution</p>
        <p className="mt-2 font-mono text-sm leading-7">{midTowerSubstitution}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-steel">
              <th className="border-b border-line px-3 py-3 font-medium">
                Panel
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                z midpoint
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Kz
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                qz (N/m²)
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                qz (lb/ft²)
              </th>
            </tr>
          </thead>
          <tbody>
            {panels.map((panel) => {
              const qz = computeQz({
                zMeters: panel.midpointElevationMeters,
                windSpeedMph: config.windSpeedMph,
                exposure: config.exposure
              });

              return (
                <tr key={panel.panelNumber}>
                  <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                    {panel.panelNumber}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">
                    {panel.midpointElevationMeters.toFixed(1)} m
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">
                    {qz.kz.toFixed(3)}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">
                    {qz.qz.toFixed(1)}
                  </td>
                  <td className="border-b border-line/70 px-3 py-3">
                    {newtonsPerSquareMeterToPsf(qz.qz).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm leading-6 text-steel">
        The interactive calculator shows the full TIA qz form and recomputes
        Kz at each panel midpoint. The app keeps these values transparent so the
        student can explain how wind pressure changes with height.
      </p>
    </section>
  );
}
