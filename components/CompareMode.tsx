"use client";

import { calculateAllPanelLengths } from "@/lib/elementLengths";
import { calculateMaterialEstimate } from "@/lib/materialQuantity";
import { checkSlenderness } from "@/lib/slenderness";
import {
  buildPanelMemberProfiles,
  formatLengthShort,
  type BracingOption,
  type HeightOption,
  type TowerConfig,
  type UnitSystem
} from "@/lib/tower";
import { calculatePanelWindForces } from "@/lib/windForce";
import { TowerVisualizer } from "@/components/TowerVisualizer";

interface CompareModeProps {
  leftConfig: TowerConfig;
  rightConfig: TowerConfig;
  onLeftConfigChange: (config: TowerConfig) => void;
  onRightConfigChange: (config: TowerConfig) => void;
  unitSystem: UnitSystem;
}

const HEIGHTS: HeightOption[] = [40, 48, 50, 60, 80];
const BRACINGS: BracingOption[] = ["Double K/K-B", "K-Down"];

function CompareControlCard({
  title,
  config,
  onChange
}: {
  title: string;
  config: TowerConfig;
  onChange: (config: TowerConfig) => void;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="micro-label">{title}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-navy">
          Height
          <select
            value={config.heightMeters}
            onChange={(event) =>
              onChange({
                ...config,
                heightMeters: Number(event.target.value) as HeightOption,
                bottomWidthMeters: Number(
                  (Number(event.target.value) / 10).toFixed(1)
                ),
                topWidthMeters: Number(
                  (Number(event.target.value) / 50).toFixed(1)
                )
              })
            }
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
          >
            {HEIGHTS.map((height) => (
              <option key={height} value={height}>
                {height} m
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-navy">
          Panels
          <input
            type="number"
            min={6}
            max={16}
            value={config.panelCount}
            onChange={(event) =>
              onChange({ ...config, panelCount: Number(event.target.value) })
            }
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-navy">
          Base width
          <input
            type="number"
            min={2}
            max={12}
            step={0.1}
            value={config.bottomWidthMeters}
            onChange={(event) =>
              onChange({ ...config, bottomWidthMeters: Number(event.target.value) })
            }
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-navy">
          Top width
          <input
            type="number"
            min={0.4}
            max={4}
            step={0.1}
            value={config.topWidthMeters}
            onChange={(event) =>
              onChange({ ...config, topWidthMeters: Number(event.target.value) })
            }
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-navy sm:col-span-2">
          Bracing
          <select
            value={config.bracing}
            onChange={(event) =>
              onChange({
                ...config,
                bracing: event.target.value as BracingOption
              })
            }
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
          >
            {BRACINGS.map((bracing) => (
              <option key={bracing} value={bracing}>
                {bracing}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function CompareMode({
  leftConfig,
  rightConfig,
  onLeftConfigChange,
  onRightConfigChange,
  unitSystem
}: CompareModeProps) {
  const leftPanels = calculateAllPanelLengths(
    leftConfig.heightMeters,
    leftConfig.panelCount,
    leftConfig.bottomWidthMeters,
    leftConfig.topWidthMeters,
    leftConfig.bracing
  );
  const rightPanels = calculateAllPanelLengths(
    rightConfig.heightMeters,
    rightConfig.panelCount,
    rightConfig.bottomWidthMeters,
    rightConfig.topWidthMeters,
    rightConfig.bracing
  );
  const leftMembers = buildPanelMemberProfiles(leftConfig.panelCount);
  const rightMembers = buildPanelMemberProfiles(rightConfig.panelCount);
  const leftMaterial = calculateMaterialEstimate(leftPanels, leftMembers);
  const rightMaterial = calculateMaterialEstimate(rightPanels, rightMembers);
  const leftWind = calculatePanelWindForces(leftConfig, leftPanels);
  const rightWind = calculatePanelWindForces(rightConfig, rightPanels);

  const leftLegTotal = leftPanels.reduce((sum, row) => sum + row.legLength, 0);
  const rightLegTotal = rightPanels.reduce((sum, row) => sum + row.legLength, 0);

  const leftWorstLeg = Math.max(
    ...leftPanels.map((panel) =>
      checkSlenderness({
        lengthMeters: panel.legLength,
        sectionLabel:
          leftMembers.find((member) => member.panelNumber === panel.panelIndex)
            ?.legPropertySection ?? "L80×80×8",
        role: "leg"
      }).klr
    )
  );
  const rightWorstLeg = Math.max(
    ...rightPanels.map((panel) =>
      checkSlenderness({
        lengthMeters: panel.legLength,
        sectionLabel:
          rightMembers.find((member) => member.panelNumber === panel.panelIndex)
            ?.legPropertySection ?? "L80×80×8",
        role: "leg"
      }).klr
    )
  );

  return (
    <section className="space-y-6">
      <div className="panel-card p-6">
        <p className="micro-label">Compare two towers</p>
        <h2 className="section-title">Side-by-Side Comparison Mode</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
          Two tower cases render simultaneously with their own geometry inputs.
          Use this to compare length totals, material demand, base shear, and
          slenderness trends without leaving the dashboard.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <div className="space-y-6">
          <CompareControlCard
            title="Tower A controls"
            config={leftConfig}
            onChange={onLeftConfigChange}
          />
          <TowerVisualizer
            config={leftConfig}
            panels={leftPanels}
            memberProfiles={leftMembers}
            unitSystem={unitSystem}
            showStress={false}
            show3D={false}
            hoverEnabled={false}
            windForces={leftWind}
            onPanelSelect={() => undefined}
            compact
            title="Tower A"
          />
        </div>

        <div className="space-y-6">
          <CompareControlCard
            title="Tower B controls"
            config={rightConfig}
            onChange={onRightConfigChange}
          />
          <TowerVisualizer
            config={rightConfig}
            panels={rightPanels}
            memberProfiles={rightMembers}
            unitSystem={unitSystem}
            showStress={false}
            show3D={false}
            hoverEnabled={false}
            windForces={rightWind}
            onPanelSelect={() => undefined}
            compact
            title="Tower B"
          />
        </div>
      </div>

      <div className="panel-card overflow-x-auto p-6">
        <p className="micro-label">Comparison table</p>
        <h2 className="section-title">Geometry, material, and stability checks</h2>
        <table className="mt-4 min-w-full text-left text-sm">
          <thead className="text-steel">
            <tr>
              <th className="pb-3 pr-6">Metric</th>
              <th className="pb-3 pr-6">Tower A</th>
              <th className="pb-3">Tower B</th>
            </tr>
          </thead>
          <tbody className="align-top text-navy">
            {[
              ["Height", `${leftConfig.heightMeters} m`, `${rightConfig.heightMeters} m`],
              ["Panel count", `${leftConfig.panelCount}`, `${rightConfig.panelCount}`],
              [
                "One-leg total",
                formatLengthShort(leftLegTotal, unitSystem),
                formatLengthShort(rightLegTotal, unitSystem)
              ],
              [
                "Total steel mass",
                `${leftMaterial.totalMassKg.toFixed(0)} kg`,
                `${rightMaterial.totalMassKg.toFixed(0)} kg`
              ],
              [
                "Base shear",
                `${leftWind[0]?.cumulativeBaseShearN.toFixed(0) ?? "0"} N`,
                `${rightWind[0]?.cumulativeBaseShearN.toFixed(0) ?? "0"} N`
              ],
              [
                "Worst leg KL/r",
                `${leftWorstLeg.toFixed(0)}`,
                `${rightWorstLeg.toFixed(0)}`
              ],
              [
                "Bottom width",
                `${leftConfig.bottomWidthMeters.toFixed(1)} m`,
                `${rightConfig.bottomWidthMeters.toFixed(1)} m`
              ],
              [
                "Bracing family",
                leftConfig.bracing,
                rightConfig.bracing
              ]
            ].map(([label, left, right]) => (
              <tr key={label} className="border-t border-line/70">
                <td className="py-3 pr-6 font-medium">{label}</td>
                <td className="py-3 pr-6">{left}</td>
                <td className="py-3">{right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
