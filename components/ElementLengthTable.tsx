"use client";

import { useMemo, useState } from "react";
import { Fragment } from "react";

import {
  panelCalculationBlocks,
  type PanelElementLengths
} from "@/lib/elementLengths";
import {
  formatLength,
  formatLengthShort,
  type PanelMemberProfile,
  type UnitSystem
} from "@/lib/tower";
import { checkSlenderness } from "@/lib/slenderness";
import { tierClasses } from "@/lib/sources";
import { SlendernessCheck } from "@/components/SlendernessCheck";

interface ElementLengthTableProps {
  rows: PanelElementLengths[];
  memberProfiles: PanelMemberProfile[];
  unitSystem: UnitSystem;
  onOpenPanel: (panelNumber: number) => void;
}

function profileForPanel(
  memberProfiles: PanelMemberProfile[],
  panelNumber: number
) {
  return memberProfiles.find((profile) => profile.panelNumber === panelNumber);
}

export function ElementLengthTable({
  rows,
  memberProfiles,
  unitSystem,
  onOpenPanel
}: ElementLengthTableProps) {
  const [expandedPanels, setExpandedPanels] = useState<number[]>([]);

  const oneLegTotal = useMemo(
    () => rows.reduce((sum, row) => sum + row.legLength, 0),
    [rows]
  );
  const totalKBrace = useMemo(
    () =>
      rows.reduce((sum, row) => sum + (row.kBraceDiag ? row.kBraceDiag * 8 : 0), 0),
    [rows]
  );
  const totalHorizontals = useMemo(
    () => rows.reduce((sum, row) => sum + row.horizontal * 4, 0),
    [rows]
  );
  const maxSummary = Math.max(oneLegTotal, totalKBrace, totalHorizontals, 1);

  function togglePanel(panelNumber: number) {
    setExpandedPanels((current) =>
      current.includes(panelNumber)
        ? current.filter((value) => value !== panelNumber)
        : [...current, panelNumber]
    );
  }

  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="micro-label">Element lengths</p>
          <h2 className="section-title">Panel-by-Panel Member Length Calculator</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Every length is derived from tower geometry using linear taper plus
            right-triangle relationships. Click a row to expand the arithmetic
            or open the panel drawer.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tierClasses(
              "Code-Verified"
            )}`}
          >
            ASCE 10-15 §2.3 / §3.4
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tierClasses(
              "Literature-Backed"
            )}`}
          >
            Bilionis geometry precedent
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tierClasses(
              "Derived/Assumed"
            )}`}
          >
            Elementary geometry / preliminary checks
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto rounded-[24px] border border-line">
          <table className="min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-50 text-steel">
              <tr>
                <th className="px-4 py-3">Panel</th>
                <th className="px-4 py-3">Elevations</th>
                <th className="px-4 py-3">w(bottom)</th>
                <th className="px-4 py-3">w(top)</th>
                <th className="px-4 py-3">Leg length</th>
                <th className="px-4 py-3">K-diagonal</th>
                <th className="px-4 py-3">Sub-horizontal</th>
                <th className="px-4 py-3">Horizontal chord</th>
                <th className="px-4 py-3">Hip brace</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {rows.map((row) => {
                const member = profileForPanel(memberProfiles, row.panelIndex);

                if (!member) {
                  return null;
                }

                const legCheck = checkSlenderness({
                  lengthMeters: row.legLength,
                  sectionLabel: member.legPropertySection,
                  role: "leg"
                });
                const kCheck = row.kBraceDiag
                  ? checkSlenderness({
                      lengthMeters: row.kBraceDiag,
                      sectionLabel: member.diagonalPropertySection,
                      role: "bracing"
                    })
                  : null;
                const subHorizontalCheck = row.subHorizontal
                  ? checkSlenderness({
                      lengthMeters: row.subHorizontal,
                      sectionLabel: member.horizontalPropertySection,
                      role: "redundant"
                    })
                  : null;
                const horizontalCheck = checkSlenderness({
                  lengthMeters: row.horizontal,
                  sectionLabel: member.horizontalPropertySection,
                  role: "redundant"
                });
                const hipCheck = row.hipBraceDiag
                  ? checkSlenderness({
                      lengthMeters: row.hipBraceDiag,
                      sectionLabel: member.diagonalPropertySection,
                      role: "redundant"
                    })
                  : null;
                const expanded = expandedPanels.includes(row.panelIndex);

                return (
                  <Fragment key={row.panelIndex}>
                    <tr
                      className="cursor-pointer border-t border-line transition hover:bg-slate-50/80"
                      onClick={() => togglePanel(row.panelIndex)}
                    >
                      <td className="px-4 py-4 font-semibold text-navy">
                        P{row.panelIndex}
                      </td>
                      <td className="px-4 py-4 text-steel">
                        {row.elevBottom.toFixed(1)}–{row.elevTop.toFixed(1)} m
                      </td>
                      <td className="px-4 py-4 text-navy">
                        {formatLengthShort(row.wBottom, unitSystem)}
                      </td>
                      <td className="px-4 py-4 text-navy">
                        {formatLengthShort(row.wTop, unitSystem)}
                      </td>
                      <td className="px-4 py-4 text-navy">
                        <div>{formatLengthShort(row.legLength, unitSystem)}</div>
                        <div className="text-[11px] text-steel">
                          √(h² + Δw²/4)
                        </div>
                        <SlendernessCheck result={legCheck} compact />
                      </td>
                      <td className="px-4 py-4 text-navy">
                        {row.kBraceDiag ? (
                          <>
                            <div>{formatLengthShort(row.kBraceDiag, unitSystem)}</div>
                            <SlendernessCheck result={kCheck!} compact />
                          </>
                        ) : (
                          <span className="text-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-navy">
                        {row.subHorizontal ? (
                          <>
                            <div>
                              {formatLengthShort(row.subHorizontal, unitSystem)}
                            </div>
                            <SlendernessCheck result={subHorizontalCheck!} compact />
                          </>
                        ) : (
                          <span className="text-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-navy">
                        <div>{formatLengthShort(row.horizontal, unitSystem)}</div>
                        <SlendernessCheck result={horizontalCheck} compact />
                      </td>
                      <td className="px-4 py-4 text-navy">
                        {row.hipBraceDiag ? (
                          <>
                            <div>{formatLengthShort(row.hipBraceDiag, unitSystem)}</div>
                            <SlendernessCheck result={hipCheck!} compact />
                          </>
                        ) : (
                          <span className="text-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                            "Code-Verified"
                          )}`}
                        >
                          Geometric + ASCE
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenPanel(row.panelIndex);
                          }}
                          className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-navy"
                          aria-label={`Open detailed panel drawer for panel ${row.panelIndex}`}
                        >
                          Open drawer
                        </button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-t border-line bg-slate-50/70">
                        <td colSpan={11} className="px-4 py-5">
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="rounded-3xl border border-line bg-white p-5">
                              <p className="micro-label">
                                Panel {row.panelIndex} calculation
                              </p>
                              <h3 className="mt-2 text-base font-semibold text-navy">
                                Elevation {row.elevBottom.toFixed(1)}–{row.elevTop.toFixed(1)} m
                              </h3>
                              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                {panelCalculationBlocks(row).map((block) => (
                                  <article
                                    key={`${row.panelIndex}-${block.title}`}
                                    className="rounded-2xl border border-line bg-slate-50 p-4"
                                  >
                                    <h4 className="text-sm font-semibold text-navy">
                                      {block.title}
                                    </h4>
                                    <div className="mt-2 space-y-2 text-sm leading-6 text-steel">
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
                            </div>

                            <div className="space-y-4">
                              <div className="rounded-3xl border border-line bg-white p-5">
                                <p className="micro-label">Panel members</p>
                                <dl className="mt-3 grid gap-3 text-sm text-steel">
                                  <div>
                                    <dt className="font-medium text-navy">Leg</dt>
                                    <dd>
                                      {member.legSection} | {member.legSteel} | Fy{" "}
                                      {member.legFyMpa} MPa
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="font-medium text-navy">Diagonal</dt>
                                    <dd>
                                      {member.diagonalSection} | {member.bracingSteel}
                                      {" | "}Fy {member.bracingFyMpa} MPa
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="font-medium text-navy">Horizontal</dt>
                                    <dd>
                                      {member.horizontalSection} | {member.bracingSteel}
                                      {" | "}Fy {member.bracingFyMpa} MPa
                                    </dd>
                                  </div>
                                </dl>
                              </div>

                              <SlendernessCheck result={legCheck} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-[28px] border border-line bg-slate-50 p-5">
          <p className="micro-label">Summary statistics</p>
          <h3 className="mt-2 text-base font-semibold text-navy">
            Length totals and material drivers
          </h3>
          <div className="mt-4 space-y-4">
            {[
              {
                label: "One leg, full height",
                value: oneLegTotal,
                note: "Sum of all panel leg lengths on a single tower leg.",
                color: "#0f766e"
              },
              {
                label: "All K-brace diagonals",
                value: totalKBrace,
                note: "2 diagonals per face × 4 faces for K-braced panels.",
                color: "#d97706"
              },
              {
                label: "All horizontal chords",
                value: totalHorizontals,
                note: "Approximate full-face panel chords across four faces.",
                color: "#475569"
              }
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-navy">{item.label}</p>
                  <p className="text-sm font-semibold text-navy">
                    {formatLength(item.value, unitSystem)}
                  </p>
                </div>
                <div className="h-3 rounded-full bg-white">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.value / maxSummary) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-steel">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
