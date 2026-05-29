import {
  DEFAULT_CONFIG,
  type BracingOption,
  type ExposureOption,
  type HeightOption,
  type RiskCategoryOption,
  type TowerConfig,
  type UnitSystem,
} from "@/lib/tower";

type DashboardTab =
  | "workflow"
  | "geometry"
  | "lengths"
  | "checks"
  | "wind"
  | "material"
  | "fragility"
  | "sources"
  | "lab";

export interface UrlState {
  tab: DashboardTab;
  config: TowerConfig;
  unitSystem: UnitSystem;
}

const VALID_TABS = new Set<DashboardTab>([
  "workflow", "geometry", "lengths", "checks",
  "wind", "material", "fragility", "sources", "lab",
]);

const VALID_BRACINGS = new Set<BracingOption>(["Double K/K-B", "K-Down"]);
const VALID_EXPOSURES = new Set<ExposureOption>(["B", "C", "D"]);
const VALID_RISKS = new Set<RiskCategoryOption>(["I", "II", "III", "IV"]);
const VALID_HEIGHTS = new Set<HeightOption>([40, 60, 80]);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function encodeUrlState(state: UrlState): string {
  const c = state.config;
  const params = new URLSearchParams({
    tab: state.tab,
    unit: state.unitSystem,
    h: String(c.heightMeters),
    w: String(c.windSpeedMph),
    p: String(c.panelCount),
    bw: String(c.bottomWidthMeters),
    tw: String(c.topWidthMeters),
    br: c.bracing,
    ex: c.exposure,
    rc: c.riskCategory,
    app: c.appurtenances ? "1" : "0",
  });
  return params.toString();
}

export function decodeUrlState(hash: string): Partial<UrlState> {
  try {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(raw);

    const tab = params.get("tab") as DashboardTab | null;
    const unit = params.get("unit");
    const h = params.get("h");
    const w = params.get("w");
    const p = params.get("p");
    const bw = params.get("bw");
    const tw = params.get("tw");
    const br = params.get("br") as BracingOption | null;
    const ex = params.get("ex") as ExposureOption | null;
    const rc = params.get("rc") as RiskCategoryOption | null;
    const app = params.get("app");

    const config: TowerConfig = { ...DEFAULT_CONFIG };

    if (h && VALID_HEIGHTS.has(Number(h) as HeightOption)) {
      config.heightMeters = Number(h) as HeightOption;
    }
    if (w) config.windSpeedMph = clamp(Number(w), 60, 200);
    if (p) config.panelCount = clamp(Math.round(Number(p)), 4, 20);
    if (bw) config.bottomWidthMeters = clamp(Number(bw), 2, 20);
    if (tw) config.topWidthMeters = clamp(Number(tw), 0.5, 5);
    if (br && VALID_BRACINGS.has(br)) config.bracing = br;
    if (ex && VALID_EXPOSURES.has(ex)) config.exposure = ex;
    if (rc && VALID_RISKS.has(rc)) config.riskCategory = rc;
    if (app !== null) config.appurtenances = app === "1";

    return {
      tab: tab && VALID_TABS.has(tab) ? tab : undefined,
      config,
      unitSystem: unit === "imperial" ? "imperial" : "metric",
    };
  } catch {
    return {};
  }
}
