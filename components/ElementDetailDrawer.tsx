"use client";

import {
  panelCalculationBlocks,
  type PanelElementLengths
} from "@/lib/elementLengths";
import {
  formatLength,
  type PanelMemberProfile,
  type UnitSystem
} from "@/lib/tower";
import { checkSlenderness } from "@/lib/slenderness";
import { SlendernessCheck } from "@/components/SlendernessCheck";

interface ElementDetailDrawerProps {
  open: boolean;
  panel: PanelElementLengths | null;
  memberProfile: PanelMemberProfile | null;
  unitSystem: UnitSystem;
  onClose: () => void;
}

function MiniBracingDiagram({
  bracingType
}: {
  bracingType: PanelElementLengths["bracingType"];
}) {
  return (
    <svg viewBox="0 0 120 100" className="h-28 w-full rounded-2xl bg-slate-50">
      <line x1="24" y1="84" x2="24" y2="16" stroke="#11233c" strokeWidth="4" />
      <line x1="96" y1="84" x2="96" y2="16" stroke="#11233c" strokeWidth="4" />
      <line x1="24" y1="84" x2="96" y2="84" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="24" y1="16" x2="96" y2="16" stroke="#cbd5e1" strokeWidth="2" />
      <>
        <line x1="24" y1="84" x2="60" y2="50" stroke="#64748b" strokeWidth="3" />
        <line x1="24" y1="16" x2="60" y2="50" stroke="#64748b" strokeWidth="3" />
        <line x1="96" y1="84" x2="60" y2="50" stroke="#64748b" strokeWidth="3" />
        <line x1="96" y1="16" x2="60" y2="50" stroke="#64748b" strokeWidth="3" />
      </>
    </svg>
  );
}

export function ElementDetailDrawer({
  open,
  panel,
  memberProfile,
  unitSystem,
  onClose
}: ElementDetailDrawerProps) {
  if (!open || !panel || !memberProfile) {
    return null;
  }

  const legCheck = checkSlenderness({
    lengthMeters: panel.legLength,
    sectionLabel: memberProfile.legPropertySection,
    role: "leg"
  });
  const diagonalLength = panel.kBraceDiag;
  const diagonalCheck = diagonalLength
    ? checkSlenderness({
        lengthMeters: diagonalLength,
        sectionLabel: memberProfile.diagonalPropertySection,
        role: "bracing"
      })
    : null;
  const horizontalCheck = checkSlenderness({
    lengthMeters: panel.horizontal,
    sectionLabel: memberProfile.horizontalPropertySection,
    role: "redundant"
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/50">
      <button
        type="button"
        onClick={onClose}
        className="flex-1"
        aria-label="Close panel detail drawer"
      />
      <aside
        className="h-full w-full max-w-2xl overflow-auto bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Panel ${panel.panelIndex} detail`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="micro-label">Panel-click detail overlay</p>
            <h2 className="section-title">
              Panel {panel.panelIndex} | {panel.elevBottom.toFixed(1)}–{panel.elevTop.toFixed(1)} m
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-3 py-2 text-sm text-steel"
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            {panelCalculationBlocks(panel).map((block) => (
              <article
                key={block.title}
                className="rounded-3xl border border-line bg-slate-50 p-5"
              >
                <h3 className="text-sm font-semibold text-navy">{block.title}</h3>
                <div className="mt-3 space-y-2 text-sm leading-6 text-steel">
                  {block.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-5 text-steel">
                  Source: {block.source}
                </p>
              </article>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-line bg-slate-50 p-5">
              <p className="micro-label">Bracing mini-diagram</p>
              <h3 className="mt-2 text-sm font-semibold text-navy">
                K panel
              </h3>
              <div className="mt-4">
                <MiniBracingDiagram bracingType={panel.bracingType} />
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white p-5">
              <p className="micro-label">Panel members</p>
              <dl className="mt-3 grid gap-3 text-sm text-steel">
                <div>
                  <dt className="font-medium text-navy">Leg</dt>
                  <dd>
                    {memberProfile.legSection} | {memberProfile.legSteel}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-navy">Diagonal</dt>
                  <dd>
                    {memberProfile.diagonalSection} | {memberProfile.bracingSteel}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-navy">Horizontal</dt>
                  <dd>
                    {memberProfile.horizontalSection} | {memberProfile.bracingSteel}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-navy">Representative lengths</dt>
                  <dd>
                    Leg {formatLength(panel.legLength, unitSystem)}
                    {diagonalLength
                      ? ` | Diagonal ${formatLength(diagonalLength, unitSystem)}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-navy">Panel solidity / Cf</dt>
                  <dd>
                    ε = {panel.solidityRatio.toFixed(3)} | Cf = {panel.dragCoefficient.toFixed(3)}
                  </dd>
                </div>
              </dl>
            </div>

            <SlendernessCheck result={legCheck} />
            {diagonalCheck ? <SlendernessCheck result={diagonalCheck} /> : null}
            <SlendernessCheck result={horizontalCheck} />
          </div>
        </div>
      </aside>
    </div>
  );
}

