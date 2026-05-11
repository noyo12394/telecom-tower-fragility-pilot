import { MEMBER_SIZE_ROWS } from "@/lib/tower";

export function MemberSizes() {
  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Member sizes</p>
          <h2 className="section-title">Literature-Scaled Baseline</h2>
        </div>
        <span className="rounded-full border border-literature/30 bg-literature/10 px-3 py-1 text-xs font-medium text-literature">
          Literature-Backed — Bilionis 2019, scaled
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-literature/20 bg-literature/5 p-4 text-sm leading-6 text-ink">
        <p className="font-semibold text-navy">
          Steel assignments
        </p>
        <p>Legs: ASTM A572 Grade 50</p>
        <p>Bracing and horizontals: ASTM A36</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-steel">
              <th className="border-b border-line px-3 py-3 font-medium">
                Panel
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Elevation
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Leg
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Diagonal
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Horizontal
              </th>
              <th className="border-b border-line px-3 py-3 font-medium">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {MEMBER_SIZE_ROWS.map((row) => (
              <tr key={row.panelLabel} className="align-top">
                <td className="border-b border-line/70 px-3 py-3 font-medium text-navy">
                  {row.panelLabel}
                </td>
                <td className="border-b border-line/70 px-3 py-3 text-steel">
                  {row.elevationRange}
                </td>
                <td className="border-b border-line/70 px-3 py-3 font-mono text-xs">
                  {row.leg}
                </td>
                <td className="border-b border-line/70 px-3 py-3 font-mono text-xs">
                  {row.diagonal}
                </td>
                <td className="border-b border-line/70 px-3 py-3 font-mono text-xs">
                  {row.horizontal}
                </td>
                <td className="border-b border-line/70 px-3 py-3">
                  <span className="rounded-full border border-literature/30 bg-literature/10 px-2 py-1 text-[11px] font-medium text-literature">
                    Bilionis 2019, scaled to 60 m
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm leading-6 text-steel">
        Sizes must be checked against ASCE/SEI 10-15 §3.4 slenderness limits
        and §3.6 compression formulas before any design use.
      </p>
    </section>
  );
}
