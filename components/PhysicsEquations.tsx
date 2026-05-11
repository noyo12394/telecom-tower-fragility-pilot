import { computeKz, computeQz } from "@/lib/wind";
import type { TowerConfig } from "@/lib/tower";
import { tierClasses } from "@/lib/sources";

interface EquationCard {
  title: string;
  expression: string;
  tier: "Code-Verified" | "Literature-Backed" | "Derived/Assumed";
  source: string;
  clausePage: string;
  note: string;
  example?: string;
}

interface PhysicsEquationsProps {
  config: TowerConfig;
}

function computeCc(fyMpa: number) {
  const eMpa = 200000;
  return Math.PI * Math.sqrt((2 * eMpa) / fyMpa);
}

export function PhysicsEquations({ config }: PhysicsEquationsProps) {
  const a572Cc = computeCc(345);
  const a36Cc = computeCc(250);
  const qzAtThirty = computeQz({
    zMeters: 30,
    windSpeedMph: config.windSpeedMph,
    exposure: config.exposure
  });
  const kzAtThirty = computeKz(30, config.exposure);

  const cards: EquationCard[] = [
    {
      title: "Transition slenderness",
      expression: "Cc = π√(2E/Fy)",
      tier: "Code-Verified",
      source: "ASCE/SEI 10-15",
      clausePage: "Eq. 3.6-3, §3.6, p. 5",
      note: "Computed for the two steel grades used in the pilot dashboard.",
      example: `A572 Gr 50: ${a572Cc.toFixed(0)} | A36: ${a36Cc.toFixed(0)}`
    },
    {
      title: "Inelastic buckling",
      expression: "Fa = [1 − 1/2(KL/r ÷ Cc)²] × Fy",
      tier: "Code-Verified",
      source: "ASCE/SEI 10-15",
      clausePage: "Eq. 3.6-1, §3.6, p. 5",
      note: "Used when the compression member falls in the inelastic range."
    },
    {
      title: "Euler buckling",
      expression: "Fa = π²E/(KL/r)²",
      tier: "Code-Verified",
      source: "ASCE/SEI 10-15",
      clausePage: "Eq. 3.6-2, §3.6, p. 5",
      note: "Used when the member behaves in the elastic buckling range."
    },
    {
      title: "Velocity pressure",
      expression: "qz = 0.613 × Kz × Kzt × Ks × Ke × Kd × V²",
      tier: "Code-Verified",
      source: "ANSI/TIA-222-H",
      clausePage: "§2.6.11.6, p. 2-24",
      note: "The app computes qz live at every panel midpoint.",
      example: `At z = 30 m: qz = ${qzAtThirty.qz.toFixed(1)} N/m²`
    },
    {
      title: "Height factor",
      expression: "Kz = 2.01(z/zg)^(2/α')",
      tier: "Code-Verified",
      source: "ANSI/TIA-222-H",
      clausePage: "§2.6.5.2, p. 2-9",
      note: "Exposure constants are shown transparently in the UI for exploratory switching.",
      example: `At z = 30 m and Exposure ${config.exposure}: Kz = ${kzAtThirty.toFixed(3)}`
    },
    {
      title: "Wind force",
      expression: "FST = qz × Gh × (EPA)S",
      tier: "Code-Verified",
      source: "ANSI/TIA-222-H",
      clausePage: "§2.6.11.1, p. 2-15",
      note: "Shown to connect wind pressure to equivalent projected area force on tower segments."
    },
    {
      title: "Drag coefficient",
      expression: "Cf = 4.0ε² − 5.9ε + 4.0",
      tier: "Code-Verified",
      source: "ANSI/TIA-222-H",
      clausePage: "§2.6.11.1.1, p. 2-15",
      note: "Square lattice tower drag is presented as a function of solidity ratio ε."
    },
    {
      title: "Fragility curve",
      expression: "P(D>ds|IM=v) = Φ[ln(v/θ)/β]",
      tier: "Literature-Backed",
      source: "Baker 2015",
      clausePage: "Lognormal fragility form",
      note: "Included to connect geometry exploration to future wind-fragility modeling."
    }
  ];

  return (
    <section className="panel-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">Physics equations</p>
          <h2 className="section-title">Code and Fragility Equation Cards</h2>
        </div>
        <span className="rounded-full border border-navy/10 bg-slate-100 px-3 py-1 text-xs font-medium text-navy">
          Full notation shown for professor discussion
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-line bg-slate-50 p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-navy">{card.title}</h3>
              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tierClasses(
                  card.tier
                )}`}
              >
                {card.tier}
              </span>
            </div>
            <p className="rounded-2xl bg-navy px-4 py-3 font-mono text-sm leading-7 text-white">
              {card.expression}
            </p>
            <p className="mt-3 text-sm font-medium text-ink">
              {card.source} · {card.clausePage}
            </p>
            <p className="mt-2 text-sm leading-6 text-steel">{card.note}</p>
            {card.example ? (
              <p className="mt-3 rounded-2xl border border-line bg-white px-3 py-2 font-mono text-xs leading-6 text-ink">
                {card.example}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
