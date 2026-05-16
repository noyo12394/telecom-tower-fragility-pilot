"use client";

export interface TooltipField {
  label: string;
  value: string;
}

export interface TooltipCardData {
  title: string;
  subtitle?: string;
  footer?: string;
  fields: TooltipField[];
}

interface TooltipProps {
  x: number;
  y: number;
  data: TooltipCardData | null;
}

export function Tooltip({ x, y, data }: TooltipProps) {
  if (!data) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-50 w-80 rounded-3xl border border-line bg-white/95 p-4 shadow-2xl backdrop-blur"
      style={{
        left: `min(${x + 20}px, calc(100vw - 340px))`,
        top: `max(${y - 12}px, 24px)`
      }}
      role="status"
      aria-live="polite"
    >
      <p className="micro-label">Element inspector</p>
      <h3 className="mt-2 text-sm font-semibold text-navy">{data.title}</h3>
      {data.subtitle ? (
        <p className="mt-1 text-xs leading-5 text-steel">{data.subtitle}</p>
      ) : null}
      <dl className="mt-3 grid gap-2 text-sm text-steel">
        {data.fields.map((field) => (
          <div key={field.label} className="flex items-start justify-between gap-3">
            <dt className="font-medium text-navy">{field.label}</dt>
            <dd className="text-right">{field.value}</dd>
          </div>
        ))}
      </dl>
      {data.footer ? (
        <p className="mt-3 text-[11px] leading-5 text-steel">{data.footer}</p>
      ) : null}
    </div>
  );
}
