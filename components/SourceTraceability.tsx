import {
  SOURCE_HIGHLIGHTS,
  type TraceabilityRow,
  tierClasses
} from "@/lib/sources";

interface SourceTraceabilityProps {
  rows: TraceabilityRow[];
}

export function SourceTraceability({ rows }: SourceTraceabilityProps) {
  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Traceability</p>
          <h2 className="section-title">Source Traceability Panel</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-verified/30 bg-verified/10 px-3 py-1 text-xs font-medium text-verified">
            Code-Verified
          </span>
          <span className="rounded-full border border-literature/30 bg-literature/10 px-3 py-1 text-xs font-medium text-literature">
            Literature-Backed
          </span>
          <span className="rounded-full border border-derived/30 bg-derived/10 px-3 py-1 text-xs font-medium text-derived">
            Derived/Assumed
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {SOURCE_HIGHLIGHTS.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-2xl border border-line bg-slate-50 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-navy">
                {highlight.title}
              </h3>
              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                  highlight.tier
                )}`}
              >
                {highlight.tier}
              </span>
            </div>
            <p className="text-sm leading-6 text-steel">
              {highlight.description}
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-steel">
              {highlight.sourceLabel}
            </p>
            <p className="mt-1 text-xs text-ink">{highlight.clausePage}</p>
            <a
              href={highlight.link}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-medium"
            >
              Open source
            </a>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-steel">
              <th className="border-b border-line px-3 py-3 font-medium">
                Parameter
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Value
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Badge
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Source
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Clause / page
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Short justification
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.parameter} className="align-top">
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  {row.parameter}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <div className="space-y-2">
                    <p className="leading-6 text-ink">{row.value}</p>
                    {row.userEdited ? (
                      <span className="rounded-full border border-navy/20 bg-navy/5 px-2 py-1 text-[11px] font-medium text-navy">
                        User-edited current state
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                      row.tier
                    )}`}
                  >
                    {row.tier}
                  </span>
                </td>
                <td className="border-b border-line/70 px-3 py-3 text-ink">
                  {row.sourceLabel}
                </td>
                <td className="border-b border-line/70 px-3 py-3 text-steel">
                  {row.clausePage}
                </td>
                <td className="border-b border-line/70 px-3 py-3 text-steel">
                  {row.justification}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <a href={row.link} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
