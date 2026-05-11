import { tierClasses } from "@/lib/sources";
import type { TowerConfig, TowerPanelGeometry } from "@/lib/tower";

interface GeometryTableProps {
  config: TowerConfig;
  panels: TowerPanelGeometry[];
}

function panelBracingBadge(config: TowerConfig) {
  if (config.bracing === "Mixed K/X" || config.bracing === "Double K/K-B") {
    return {
      tier: "Literature-Backed" as const,
      label:
        config.bracing === "Mixed K/X"
          ? "Advisor group default"
          : "Efficient bracing study"
    };
  }

  return {
    tier: "Derived/Assumed" as const,
    label: "Exploratory option"
  };
}

export function GeometryTable({ config, panels }: GeometryTableProps) {
  const bracingBadge = panelBracingBadge(config);

  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Geometry</p>
          <h2 className="section-title">Computed Panel Geometry Table</h2>
        </div>
        <span className="rounded-full border border-derived/30 bg-derived/10 px-3 py-1 text-xs font-medium text-derived">
          Widths are derived by linear taper
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-steel">
              <th className="border-b border-line px-3 py-3 font-medium">
                Panel
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Bottom elev.
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Top elev.
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Width at bottom
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Width at top
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Bracing type
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Source badge
              </th>
            </tr>
          </thead>
          <tbody>
            {panels.map((panel) => (
              <tr key={panel.panelNumber}>
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  {panel.panelNumber}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {panel.bottomElevationMeters.toFixed(1)} m
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {panel.topElevationMeters.toFixed(1)} m
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {panel.widthAtBottomMeters.toFixed(2)} m
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {panel.widthAtTopMeters.toFixed(2)} m
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  {panel.bracingType}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-derived/30 bg-derived/10 px-2 py-1 text-[11px] font-medium text-derived">
                      Derived width rule
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                        bracingBadge.tier
                      )}`}
                    >
                      {bracingBadge.label}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
