"use client";

import { type SlendernessResult } from "@/lib/slenderness";

interface SlendernessCheckProps {
  result: SlendernessResult;
  compact?: boolean;
}

function statusClasses(status: SlendernessResult["status"]) {
  if (status === "pass") {
    return "border-verified/30 bg-verified/10 text-verified";
  }

  if (status === "close") {
    return "border-literature/30 bg-literature/10 text-literature";
  }

  return "border-red-500/30 bg-red-500/10 text-red-700";
}

function statusLabel(status: SlendernessResult["status"]) {
  if (status === "pass") {
    return "Pass";
  }

  if (status === "close") {
    return "Close";
  }

  return "Exceeds";
}

export function SlendernessCheck({
  result,
  compact = false
}: SlendernessCheckProps) {
  if (compact) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusClasses(
            result.status
          )}`}
        >
          {result.role === "leg"
            ? `KL/r ${result.klr.toFixed(0)} / ${result.limit} ${statusLabel(
                result.status
              )}`
            : `σ ${result.sigmaDemandMpa.toFixed(1)} / ${result.sigmaAdmissibleMpa.toFixed(
                1
              )} MPa ${statusLabel(result.status)}`}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-navy">Preliminary slenderness</p>
        <span
          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusClasses(
            result.status
          )}`}
        >
          {statusLabel(result.status)}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm text-steel sm:grid-cols-2">
        <div>
          <dt className="font-medium text-navy">KL/r</dt>
          <dd>{result.klr.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">Limit</dt>
          <dd>{result.limit}</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">σ demand</dt>
          <dd>{result.sigmaDemandMpa.toFixed(2)} MPa</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">σ admissible</dt>
          <dd>{result.sigmaAdmissibleMpa.toFixed(1)} MPa</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">σcr Euler</dt>
          <dd>{result.role === "leg" ? `${result.sigmaCreMpa.toFixed(1)} MPa` : "Legs only"}</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">End condition</dt>
          <dd>{result.endCondition === "fixed-free" ? "Fixed-free" : "Pin-pin"}</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">r(min)</dt>
          <dd>{result.radiusMm.toFixed(1)} mm</dd>
        </div>
        <div>
          <dt className="font-medium text-navy">Property basis</dt>
          <dd>{result.propertySection}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-6 text-steel">{result.note}</p>
    </div>
  );
}
