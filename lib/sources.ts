import {
  buildAdvisorExplanation,
  type BadgeTier,
  type HeightOption,
  type TowerConfig
} from "@/lib/tower";

export interface SourceDocument {
  id: string;
  title: string;
  shortLabel: string;
  url: string;
  category:
    | "Code"
    | "Literature"
    | "Manual"
    | "Advisor Research Group"
    | "Method";
  detail: string;
  clause?: string;
  tier?: BadgeTier;
}

export interface TraceabilityRow {
  parameter: string;
  value: string;
  tier: BadgeTier;
  sourceLabel: string;
  clausePage: string;
  justification: string;
  link: string;
  userEdited?: boolean;
}

export interface SourceHighlight {
  title: string;
  description: string;
  tier: BadgeTier;
  sourceLabel: string;
  clausePage: string;
  link: string;
}

export const SOURCE_DOCUMENTS: SourceDocument[] = [
  {
    id: "asce10",
    title: "ASCE/SEI 10-15 — Design of Latticed Steel Transmission Structures",
    shortLabel: "ASCE/SEI 10-15",
    url: "https://sp360.asce.org/PersonifyEbusiness/Merchandise/Product-Details/productId/233128914",
    category: "Code",
    detail:
      "User-verified clauses and pages supplied for steels, thickness, slenderness, buckling equations, bolts, galvanizing, and foundations.",
    tier: "Code-Verified"
  },
  {
    id: "asce10-geometry",
    title: "ASCE/SEI 10-15 §2.3 — Geometric configurations",
    shortLabel: "ASCE 10-15 §2.3",
    url: "https://ascelibrary.org",
    category: "Code",
    detail:
      "Used for member-length derivation from node geometry and tower configuration logic.",
    clause: "§2.3, p. 3",
    tier: "Code-Verified"
  },
  {
    id: "asce10-slenderness",
    title: "ASCE/SEI 10-15 §3.4 — Slenderness limits",
    shortLabel: "ASCE 10-15 §3.4",
    url: "https://ascelibrary.org",
    category: "Code",
    detail:
      "Legs L/r ≤ 150, bracing KL/r ≤ 200, and redundants KL/r ≤ 250 for preliminary member checks.",
    clause: "§3.4, p. 5",
    tier: "Code-Verified"
  },
  {
    id: "tia222h",
    title:
      "TIA Announces Publication of TIA-222-H Standard for Antennas and the Supporting Structures for Antennas and Small Wind Turbines",
    shortLabel: "ANSI/TIA-222-H",
    url: "https://standards.tiaonline.org/news-media/press-releases/tia-announces-publication-tia-222-h-standard-antennas-and-supporting",
    category: "Code",
    detail:
      "Official TIA announcement plus user-verified clause/page references for wind, exposure, serviceability, and drag equations.",
    tier: "Code-Verified"
  },
  {
    id: "tia222h-standard-page",
    title: "TIA-222 Standard Details",
    shortLabel: "TIA-222 Standard Page",
    url: "https://tiaonline.org/standard/tia-222/",
    category: "Code",
    detail: "Revision H landing page and standard metadata."
  },
  {
    id: "tstower",
    title: "TSTower for Latticed Towers User Manual",
    shortLabel: "TSTower Manual",
    url: "https://www.towersft.com/portals/0/Software/Docs/TSTower%20for%20latticed%20towers%20User%20Manual.pdf?ver=2022-02-08-122209-850",
    category: "Manual",
    detail:
      "Geometry-input workflow reference for self-supporting tower height, widths, section definitions, and bracing inputs.",
    tier: "Literature-Backed"
  },
  {
    id: "rasool",
    title:
      "Rasool et al. 2022 — Communication tower responses under TIA-222-G and TIA-222-H",
    shortLabel: "Rasool et al. 2022",
    url: "https://www.tandfonline.com/doi/pdf/10.1080/13467581.2022.2145203",
    category: "Literature",
    detail:
      "Height comparison study for 40 m, 60 m, and 80 m communication towers.",
    tier: "Literature-Backed"
  },
  {
    id: "bilionis",
    title:
      "Bilionis & Vamvatsikos 2019 — Wind and icing fragility of telecom towers",
    shortLabel: "Bilionis & Vamvatsikos 2019",
    url: "https://files.eccomasproceedia.org/papers/compdyn-2019/19629.pdf?mtime=20191121000158",
    category: "Literature",
    detail:
      "48 m square lattice telecom tower with tapered geometry, platforms, diaphragms, and representative member sizes.",
    tier: "Literature-Backed"
  },
  {
    id: "bracing-study",
    title: "60 m Self-Supported Telecommunication Tower Bracing Study",
    shortLabel: "60 m Bracing Study",
    url: "https://technologyjournal.net/wp-content/uploads/9-JOT1667.pdf",
    category: "Literature",
    detail:
      "Compares Double K/K-B, X-brace, and K-Down performance under wind loading.",
    tier: "Literature-Backed"
  },
  {
    id: "manual52",
    title: "ASCE Manual 52 — Guide for Design of Steel Transmission Towers",
    shortLabel: "ASCE Manual 52",
    url: "https://cedb.asce.org/CEDBsearch/record.jsp?dockey=0058538",
    category: "Literature",
    detail:
      "Reference for truss-type tower design logic, member behavior, and analysis framing.",
    tier: "Literature-Backed"
  },
  {
    id: "khazaali-2024",
    title:
      "Khazaali et al. 2024 — Wind coefficients and tower-antenna interaction",
    shortLabel: "Khazaali et al. 2024",
    url: "https://www.sciencedirect.com/science/article/pii/S2772741624000036",
    category: "Literature",
    detail:
      "CFD-based drag and antenna interference study; used only for antenna coefficient context.",
    tier: "Literature-Backed"
  },
  {
    id: "khazaali-dissertation",
    title:
      "Khazaali Dissertation — Damage and Resilience Assessments of Telecommunication Systems under Hurricanes",
    shortLabel: "Khazaali Dissertation §4.5",
    url: "https://preserve.lehigh.edu/lehigh-scholarship/graduate-publications-theses-dissertations/theses-dissertations/damage",
    category: "Advisor Research Group",
    detail:
      "Advisor research-group context for 10-panel tower configuration and mixed K/X bracing layout.",
    tier: "Literature-Backed"
  },
  {
    id: "pythagoras",
    title: "Pythagorean theorem",
    shortLabel: "Pythagorean Theorem",
    url: "",
    category: "Method",
    detail:
      "Elementary right-triangle geometry used for inclined leg, brace, and hip-brace lengths.",
    clause: "Elementary geometry",
    tier: "Derived/Assumed"
  },
  {
    id: "aisc-manual",
    title: "AISC Steel Construction Manual, 14th Edition",
    shortLabel: "AISC Manual 14th Ed.",
    url: "https://www.aisc.org/publications/steel-construction-manual/",
    category: "Code",
    detail:
      "Used for preliminary angle-section radius of gyration and unit-weight lookups in the slenderness and material tabs.",
    clause: "Part 1 — Dimensions and Properties",
    tier: "Code-Verified"
  },
  {
    id: "baker2015",
    title:
      "Baker 2015 — Efficient Analytical Fragility Function Fitting Using Dynamic Structural Analysis",
    shortLabel: "Baker 2015",
    url: "https://journals.sagepub.com/doi/10.1193/021113EQS025M",
    category: "Method",
    detail:
      "Canonical lognormal fragility fitting form and MLE framing.",
    tier: "Literature-Backed"
  }
];

export const SOURCE_HIGHLIGHTS: SourceHighlight[] = [
  {
    title: "Design Manual Workflow",
    description:
      "TSTower frames self-supporting tower input around total height, top and bottom widths, panelization, and bracing definitions.",
    tier: "Literature-Backed",
    sourceLabel: "TSTower Manual",
    clausePage: "Chapter 2 Input / Geometry Definition",
    link: sourceUrl("tstower")
  },
  {
    title: "Code Basis",
    description:
      "TIA-222-H governs structural design, fabrication, appurtenances, and foundation-related requirements for antenna-supporting structures.",
    tier: "Literature-Backed",
    sourceLabel: "ANSI/TIA-222-H",
    clausePage: "Official announcement + user-verified clauses",
    link: sourceUrl("tia222h")
  },
  {
    title: "Height Selection",
    description:
      "The 40/60/80 m comparison set comes from Rasool et al. 2022, with 60 m used here as the mid-height pilot case.",
    tier: "Literature-Backed",
    sourceLabel: "Rasool et al. 2022",
    clausePage: "40 / 60 / 80 m study set",
    link: sourceUrl("rasool")
  },
  {
    title: "Comparable Fragility Tower",
    description:
      "Bilionis & Vamvatsikos provide a tapered 48 m square lattice telecom tower with platforms, diaphragms, and dish antennas for comparison.",
    tier: "Literature-Backed",
    sourceLabel: "Bilionis & Vamvatsikos 2019",
    clausePage: "Published tower description",
    link: sourceUrl("bilionis")
  },
  {
    title: "Bracing Choice",
    description:
      "The 60 m bracing study found Double K/K-B to be the most efficient pattern, while the advisor-group dissertation motivates a mixed K/X exploratory option.",
    tier: "Literature-Backed",
    sourceLabel: "60 m Bracing Study + Khazaali Dissertation",
    clausePage: "Utilization comparison + §4.5",
    link: sourceUrl("bracing-study")
  },
  {
    title: "Tower Design Logic",
    description:
      "ASCE Manual 52 is used to explain why truss-type towers are organized around members, connection logic, and system behavior rather than copied geometry alone.",
    tier: "Literature-Backed",
    sourceLabel: "ASCE Manual 52",
    clausePage: "Manual overview",
    link: sourceUrl("manual52")
  },
  {
    title: "Antenna / Wind Coefficients",
    description:
      "Khazaali et al. 2024 motivate drag coefficients, interference factors, and representative antenna layouts without driving the default tower geometry.",
    tier: "Literature-Backed",
    sourceLabel: "Khazaali et al. 2024",
    clausePage: "CFD protocol and interaction concepts",
    link: sourceUrl("khazaali-2024")
  },
  {
    title: "Advisor's Research Group",
    description:
      "Mixed lower-panel K and upper-panel X bracing is highlighted because it connects directly to Bocchini Research Group telecom tower work at Lehigh.",
    tier: "Literature-Backed",
    sourceLabel: "Khazaali Dissertation §4.5",
    clausePage: "10-panel configuration and bracing pattern",
    link: sourceUrl("khazaali-dissertation")
  }
];

export function sourceUrl(id: string) {
  return SOURCE_DOCUMENTS.find((source) => source.id === id)?.url ?? "#";
}

export function tierClasses(tier: BadgeTier) {
  if (tier === "Code-Verified") {
    return "bg-verified/10 text-verified border-verified/30";
  }

  if (tier === "Literature-Backed") {
    return "bg-literature/10 text-literature border-literature/30";
  }

  return "bg-derived/10 text-derived border-derived/30";
}

export function tierLabel(tier: BadgeTier) {
  return tier;
}

function heightOptionSource(height: HeightOption) {
  if (height === 48) {
    return {
      tier: "Literature-Backed" as BadgeTier,
      sourceLabel: "Bilionis & Vamvatsikos 2019",
      clausePage: "Published 48 m tower case",
      justification:
        "Directly tied to the published Greek telecom tower benchmark.",
      link: sourceUrl("bilionis")
    };
  }

  if (height === 40 || height === 60 || height === 80) {
    return {
      tier: "Literature-Backed" as BadgeTier,
      sourceLabel: "Rasool et al. 2022",
      clausePage: "40 / 60 / 80 m study set",
      justification:
        "One of the communication-tower heights explicitly studied under TIA-222-G/H.",
      link: sourceUrl("rasool")
    };
  }

  return {
    tier: "Derived/Assumed" as BadgeTier,
    sourceLabel: "Research comparison option",
    clausePage: "Exploratory",
    justification:
      "Included for interpolation and professor-meeting comparison, not directly cited as a default case.",
    link: sourceUrl("rasool")
  };
}

export function buildTraceabilityRows(
  config: TowerConfig,
  defaultConfig: TowerConfig
): TraceabilityRow[] {
  const heightTrace = heightOptionSource(config.heightMeters);

  return [
    {
      parameter: "Tower type",
      value: "4-legged square self-supporting lattice",
      tier: "Literature-Backed",
      sourceLabel: "TSTower Manual + Bilionis & Vamvatsikos 2019",
      clausePage: "Geometry workflow + published square tower",
      justification:
        "Combines the self-supporting workflow of TSTower with the square tapered telecom tower form used in the published fragility case.",
      link: sourceUrl("tstower")
    },
    {
      parameter: "Height",
      value: `${config.heightMeters} m`,
      tier: heightTrace.tier,
      sourceLabel: heightTrace.sourceLabel,
      clausePage: heightTrace.clausePage,
      justification: heightTrace.justification,
      link: heightTrace.link,
      userEdited: config.heightMeters !== defaultConfig.heightMeters
    },
    {
      parameter: "Panel count",
      value: `${config.panelCount}`,
      tier: config.panelCount === 10 ? "Literature-Backed" : "Derived/Assumed",
      sourceLabel:
        config.panelCount === 10
          ? "Khazaali Dissertation §4.5"
          : "User/derived panelization",
      clausePage: config.panelCount === 10 ? "10-panel configuration" : "Exploratory",
      justification:
        config.panelCount === 10
          ? "Matches the advisor-group tower configuration described in the dissertation."
          : "Slider enables exploratory panelization around the pilot baseline.",
      link: sourceUrl("khazaali-dissertation"),
      userEdited: config.panelCount !== defaultConfig.panelCount
    },
    {
      parameter: "Base width",
      value: `${config.bottomWidthMeters.toFixed(1)} m`,
      tier: "Derived/Assumed",
      sourceLabel: "Preliminary proportion rule",
      clausePage: "H/10 pilot proportion",
      justification:
        "The default 6.0 m value follows a preliminary H/10 proportion for visualization, not a code-mandated tower width.",
      link: sourceUrl("tstower"),
      userEdited: config.bottomWidthMeters !== defaultConfig.bottomWidthMeters
    },
    {
      parameter: "Top width",
      value: `${config.topWidthMeters.toFixed(1)} m`,
      tier: "Derived/Assumed",
      sourceLabel: "Preliminary proportion rule",
      clausePage: "H/50 pilot proportion",
      justification:
        "The default 1.2 m value follows a preliminary H/50 proportion for visualization, not a code-mandated tower width.",
      link: sourceUrl("tstower"),
      userEdited: config.topWidthMeters !== defaultConfig.topWidthMeters
    },
    {
      parameter: "Bracing pattern",
      value: config.bracing,
      tier:
        config.bracing === "Double K/K-B"
          ? "Literature-Backed"
          : "Derived/Assumed",
      sourceLabel:
        config.bracing === "Double K/K-B"
          ? "60 m Bracing Study"
          : "Exploratory pattern",
      clausePage:
        config.bracing === "Double K/K-B"
          ? "Lowest utilization reported"
          : "Exploratory selection",
      justification:
        config.bracing === "Double K/K-B"
          ? "Selected because the 60 m study reported the lowest overall utilization for this pattern."
          : "Included for comparison but not assigned as the default literature-backed pilot arrangement.",
      link: sourceUrl("bracing-study"),
      userEdited: config.bracing !== defaultConfig.bracing
    },
    {
      parameter: "Plan",
      value: config.plan,
      tier: config.plan === "Square" ? "Literature-Backed" : "Derived/Assumed",
      sourceLabel:
        config.plan === "Square"
          ? "Bilionis & Vamvatsikos 2019"
          : "Exploratory comparison",
      clausePage:
        config.plan === "Square" ? "Square cross-section tower" : "Exploratory",
      justification:
        config.plan === "Square"
          ? "The benchmark published fragility case uses a square cross-section."
          : "Triangular plan is included for geometric exploration only.",
      link: sourceUrl("bilionis"),
      userEdited: config.plan !== defaultConfig.plan
    },
    {
      parameter: "Leg steel",
      value: "ASTM A572 Grade 50, Fy = 345 MPa",
      tier: "Code-Verified",
      sourceLabel: "ASCE/SEI 10-15",
      clausePage: "§3.2, p. 5; Eq. 3.6-3 context",
      justification:
        "A572 is one of the approved steels and the Fy value is used in the ASCE compression equations shown in the dashboard.",
      link: sourceUrl("asce10")
    },
    {
      parameter: "Bracing steel",
      value: "ASTM A36, Fy = 250 MPa",
      tier: "Code-Verified",
      sourceLabel: "ASCE/SEI 10-15",
      clausePage: "§3.2, p. 5; Eq. 3.6-3 context",
      justification:
        "A36 is one of the approved steels and is used here for representative bracing member checks.",
      link: sourceUrl("asce10")
    },
    {
      parameter: "Bolts",
      value: "ASTM A394",
      tier: "Code-Verified",
      sourceLabel: "ASCE/SEI 10-15",
      clausePage: "§4.3.1, p. 15",
      justification:
        "Tower-specific bolt designation explicitly traced to the verified clause.",
      link: sourceUrl("asce10")
    },
    {
      parameter: "Galvanizing",
      value: "ASTM A123 / A153 hot-dip",
      tier: "Code-Verified",
      sourceLabel: "ASCE/SEI 10-15",
      clausePage: "§5.2.6, p. 18",
      justification:
        "Hot-dip galvanizing standards explicitly traced to the verified clause.",
      link: sourceUrl("asce10")
    },
    {
      parameter: "Minimum member thickness",
      value: "3 mm",
      tier: "Code-Verified",
      sourceLabel: "ASCE/SEI 10-15",
      clausePage: "§3.3, p. 5",
      justification:
        "Minimum thickness requirement directly traced to the verified clause.",
      link: sourceUrl("asce10")
    },
    {
      parameter: "Wind speed",
      value: `${config.windSpeedMph} mph (3-sec gust)`,
      tier: "Derived/Assumed",
      sourceLabel: "Pilot inland CONUS placeholder",
      clausePage: "Research visualization default",
      justification:
        "Used as a preliminary inland design-speed placeholder for the pilot dashboard, not claimed as site-specific code input.",
      link: sourceUrl("tia222h"),
      userEdited: config.windSpeedMph !== defaultConfig.windSpeedMph
    },
    {
      parameter: "Risk Category",
      value: config.riskCategory,
      tier: config.riskCategory === "II" ? "Code-Verified" : "Derived/Assumed",
      sourceLabel:
        config.riskCategory === "II"
          ? "ANSI/TIA-222-H"
          : "Exploratory category switch",
      clausePage:
        config.riskCategory === "II"
          ? "§2.2.2.1, p. 2-1"
          : "Exploratory",
      justification:
        config.riskCategory === "II"
          ? "Commercial wireless structures are assigned to Risk Category II in the verified clause."
          : "Alternative categories are exposed for comparison only and require project-specific code review.",
      link: sourceUrl("tia222h"),
      userEdited: config.riskCategory !== defaultConfig.riskCategory
    },
    {
      parameter: "Exposure",
      value: config.exposure,
      tier: config.exposure === "C" ? "Code-Verified" : "Derived/Assumed",
      sourceLabel:
        config.exposure === "C"
          ? "ANSI/TIA-222-H"
          : "Exploratory exposure switch",
      clausePage:
        config.exposure === "C"
          ? "§2.6.5.1.2, p. 2-8"
          : "Interactive calculator note",
      justification:
        config.exposure === "C"
          ? "Default exposure class traced directly to the verified TIA clause."
          : "Alternative exposure classes are provided for sensitivity exploration; exposure constants should be checked against the adopted table.",
      link: sourceUrl("tia222h"),
      userEdited: config.exposure !== defaultConfig.exposure
    },
    {
      parameter: "Kzt",
      value: "1.0",
      tier: "Code-Verified",
      sourceLabel: "ANSI/TIA-222-H",
      clausePage: "§2.6.6.2, p. 2-9",
      justification:
        "Flat-terrain topographic factor explicitly verified as 1.0 in the provided clause.",
      link: sourceUrl("tia222h")
    },
    {
      parameter: "Ke",
      value: "1.0",
      tier: "Code-Verified",
      sourceLabel: "ANSI/TIA-222-H",
      clausePage: "§2.6.8, p. 2-12",
      justification:
        "Elevation factor explicitly verified as 1.0 in the provided clause.",
      link: sourceUrl("tia222h")
    },
    {
      parameter: "Kd",
      value: "0.85",
      tier: "Code-Verified",
      sourceLabel: "ANSI/TIA-222-H",
      clausePage: "§2.8.3, p. 2-39",
      justification:
        "The service-load reference includes 60 mph and Kd = 0.85; the dashboard carries 0.85 as the default directional factor placeholder.",
      link: sourceUrl("tia222h")
    },
    {
      parameter: "Gh",
      value: "0.85",
      tier: "Code-Verified",
      sourceLabel: "ANSI/TIA-222-H",
      clausePage: "§2.6.9.1, p. 2-12",
      justification:
        "The verified clause gives Gh = 0.85 for towers under 137 m.",
      link: sourceUrl("tia222h")
    },
    {
      parameter: "Ks",
      value: "1.0",
      tier: "Derived/Assumed",
      sourceLabel: "Interactive qz simplification",
      clausePage: "Calculator assumption",
      justification:
        "Set to 1.0 to keep the live qz calculator transparent because a project-specific site factor was not provided in the verified prompt inputs.",
      link: sourceUrl("tia222h")
    },
    {
      parameter: "Hip bracing locations",
      value: "Panels 3, 6, 9",
      tier: "Code-Verified",
      sourceLabel: "ASCE/SEI 10-15 Commentary",
      clausePage: "Commentary C2.3",
      justification:
        "Commentary reference supplied for diaphragm/hip bracing placement along the tower height.",
      link: sourceUrl("asce10")
    },
    {
      parameter: "Appurtenance layout toggle",
      value: config.appurtenances ? "On" : "Off",
      tier: "Derived/Assumed",
      sourceLabel: "Representative visualization",
      clausePage: "Not source-exact",
      justification:
        "Platforms and dishes are displayed as representative upper-tower loadout markers rather than exact project-specific final appurtenance geometry.",
      link: sourceUrl("khazaali-2024"),
      userEdited: config.appurtenances !== defaultConfig.appurtenances
    },
    {
      parameter: "Advisor explanation",
      value: buildAdvisorExplanation(config),
      tier: "Derived/Assumed",
      sourceLabel: "Synthesized narrative",
      clausePage: "Generated summary",
      justification:
        "The exported advisor explanation combines the cited sources and explicitly flags which geometric values remain preliminary.",
      link: sourceUrl("tstower")
    }
  ];
}
