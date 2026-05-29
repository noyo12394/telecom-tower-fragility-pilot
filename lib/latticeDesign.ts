// Lattice Tower Design Engine
// Preliminary academic tool — approximate statics, not stamped design

export interface MemberSize {
  label: string;
  area: number;         // m²
  inertia: number;      // m⁴
  radiusGyration: number; // m
  weightPerM: number;   // kg/m
}

export interface TowerNode {
  id: number;
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
}

export type MemberType = "leg" | "horizontal" | "diagonal";

export interface TowerElement {
  id: number;
  nodeI: TowerNode;
  nodeJ: TowerNode;
  memberType: MemberType;
  size: MemberSize;
  axialForce: number; // N, + tension, - compression
  stress: number;     // Pa
  passed: boolean;
}

export interface AntennaConfig {
  name: string;
  massKg: number;
  dragArea: number;   // m²
  heightFrac: number; // 0–1
}

export interface LabInput {
  height: number;
  baseSize: number;
  topSize: number;
  nPanels: number;
  windSpeed: number;       // m/s
  antennaConfig: AntennaConfig;
  E: number;               // Pa
  allowableStress: number; // Pa
  safetyFactor: number;
  endCondition: "pin-pin" | "fixed-free";
  airDensity: number;
  Cd: number;
}

export interface DesignResult {
  nodes: TowerNode[];
  elements: TowerElement[];
  iterations: number;
  converged: boolean;
  totalMassKg: number;
  nFailed: number;
}

export const MEMBER_TABLE: MemberSize[] = [
  { label: "L40×40×4",    area: 2.86e-4,  inertia: 6.39e-8,  radiusGyration: 0.0149, weightPerM: 2.24 },
  { label: "L50×50×5",    area: 4.80e-4,  inertia: 1.66e-7,  radiusGyration: 0.0186, weightPerM: 3.77 },
  { label: "L60×60×6",    area: 6.91e-4,  inertia: 3.44e-7,  radiusGyration: 0.0223, weightPerM: 5.42 },
  { label: "L70×70×7",    area: 9.40e-4,  inertia: 6.14e-7,  radiusGyration: 0.0256, weightPerM: 7.38 },
  { label: "L80×80×8",    area: 12.30e-4, inertia: 9.93e-7,  radiusGyration: 0.0284, weightPerM: 9.66 },
  { label: "L90×90×9",    area: 15.50e-4, inertia: 1.58e-6,  radiusGyration: 0.0319, weightPerM: 12.20 },
  { label: "L100×100×10", area: 19.20e-4, inertia: 2.40e-6,  radiusGyration: 0.0354, weightPerM: 15.10 },
  { label: "L120×120×12", area: 27.50e-4, inertia: 4.93e-6,  radiusGyration: 0.0423, weightPerM: 21.60 },
  { label: "L150×150×15", area: 43.00e-4, inertia: 1.19e-5,  radiusGyration: 0.0527, weightPerM: 33.80 },
];

export const ANTENNA_CONFIGS: AntennaConfig[] = [
  { name: "Config 1 — Light (single dish)",          massKg: 100, dragArea: 0.8, heightFrac: 1.0 },
  { name: "Config 2 — Medium (telecom array)",        massKg: 300, dragArea: 2.0, heightFrac: 1.0 },
  { name: "Config 3 — Heavy (broadcast + mid-panel)", massKg: 600, dragArea: 4.5, heightFrac: 0.85 },
];

// --- Geometry ---

function halfWidthAt(z: number, inp: LabInput): number {
  return 0.5 * (inp.baseSize + (inp.topSize - inp.baseSize) * (z / inp.height));
}

function buildNodes(inp: LabInput): TowerNode[] {
  const nLevels = inp.nPanels + 1;
  const panelHeight = inp.height / inp.nPanels;
  const nodes: TowerNode[] = [];
  const corners: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];

  for (let lev = 0; lev < nLevels; lev++) {
    const z = lev * panelHeight;
    const half = halfWidthAt(z, inp);
    for (let c = 0; c < 4; c++) {
      const [sx, sy] = corners[c];
      nodes.push({ id: lev * 4 + c, x: sx * half, y: sy * half, z, fx: 0, fy: 0, fz: 0 });
    }
  }
  return nodes;
}

function buildElements(nodes: TowerNode[], inp: LabInput): TowerElement[] {
  const elems: TowerElement[] = [];
  let eid = 0;

  function node(lev: number, c: number): TowerNode {
    return nodes[lev * 4 + c];
  }

  for (let lev = 0; lev < inp.nPanels; lev++) {
    // 4 legs
    for (let c = 0; c < 4; c++) {
      elems.push({ id: eid++, nodeI: node(lev, c), nodeJ: node(lev + 1, c), memberType: "leg", size: MEMBER_TABLE[1], axialForce: 0, stress: 0, passed: true });
    }
    // 4 horizontals at top
    for (let c = 0; c < 4; c++) {
      elems.push({ id: eid++, nodeI: node(lev + 1, c), nodeJ: node(lev + 1, (c + 1) % 4), memberType: "horizontal", size: MEMBER_TABLE[0], axialForce: 0, stress: 0, passed: true });
    }
    // 4 diagonals
    for (let c = 0; c < 4; c++) {
      elems.push({ id: eid++, nodeI: node(lev, c), nodeJ: node(lev + 1, (c + 1) % 4), memberType: "diagonal", size: MEMBER_TABLE[0], axialForce: 0, stress: 0, passed: true });
    }
  }
  return elems;
}

// --- Loads ---

function applyLoads(nodes: TowerNode[], elems: TowerElement[], inp: LabInput): void {
  // Reset forces
  for (const n of nodes) { n.fx = 0; n.fy = 0; n.fz = 0; }

  const panelHeight = inp.height / inp.nPanels;

  // 1. Self-weight
  for (const el of elems) {
    const dx = el.nodeJ.x - el.nodeI.x;
    const dy = el.nodeJ.y - el.nodeI.y;
    const dz = el.nodeJ.z - el.nodeI.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const halfW = -0.5 * el.size.weightPerM * L * 9.81;
    el.nodeI.fz += halfW;
    el.nodeJ.fz += halfW;
  }

  // 2. Wind load
  const q = 0.5 * inp.airDensity * inp.windSpeed * inp.windSpeed * inp.Cd;
  for (let lev = 0; lev < inp.nPanels; lev++) {
    const zMid = (lev + 0.5) * panelHeight;
    const halfW = halfWidthAt(zMid, inp);
    const wf = q * 2 * halfW * panelHeight / 4;
    for (let c = 0; c < 4; c++) {
      nodes[(lev + 1) * 4 + c].fx += wf;
    }
  }

  // 3. Antenna
  const qAnt = 0.5 * inp.airDensity * inp.windSpeed * inp.windSpeed;
  const targetZ = inp.antennaConfig.heightFrac * inp.height;
  let closestLev = 0;
  let closestDist = Infinity;
  for (let lev = 0; lev <= inp.nPanels; lev++) {
    const z = lev * panelHeight;
    const dist = Math.abs(z - targetZ);
    if (dist < closestDist) { closestDist = dist; closestLev = lev; }
  }
  const gravEach = (inp.antennaConfig.massKg * 9.81) / 4;
  const dragEach = (qAnt * inp.antennaConfig.dragArea) / 4;
  for (let c = 0; c < 4; c++) {
    nodes[closestLev * 4 + c].fz -= gravEach;
    nodes[closestLev * 4 + c].fx += dragEach;
  }
}

// --- Force estimation ---

function estimateForces(nodes: TowerNode[], elems: TowerElement[], inp: LabInput): void {
  const nLevels = inp.nPanels + 1;
  const panelHeight = inp.height / inp.nPanels;

  // Cumulative vertical and horizontal (top-down)
  const cumV = new Float64Array(nLevels);
  const cumH = new Float64Array(nLevels);

  for (let lev = nLevels - 1; lev >= 0; lev--) {
    let sumFz = 0;
    let sumFx = 0;
    for (let c = 0; c < 4; c++) {
      const n = nodes[lev * 4 + c];
      sumFz += -n.fz; // downward positive
      sumFx += n.fx;
    }
    const above = lev < nLevels - 1 ? lev + 1 : lev;
    cumV[lev] = sumFz + (lev < nLevels - 1 ? cumV[lev + 1] : 0);
    cumH[lev] = sumFx + (lev < nLevels - 1 ? cumH[lev + 1] : 0);
  }

  for (const el of elems) {
    const dx = el.nodeJ.x - el.nodeI.x;
    const dy = el.nodeJ.y - el.nodeI.y;
    const dz = el.nodeJ.z - el.nodeI.z;

    if (el.memberType === "leg") {
      // Determine level of top node (nodeJ)
      const levJ = Math.round(el.nodeJ.z / panelHeight);
      const zLegTop = el.nodeJ.z;
      const halfW = halfWidthAt(zLegTop, inp);

      const Pv = cumV[levJ] / 4;

      // Wind moment: sum (fx * (z - zLegTop)) for all nodes above levJ
      let Mwind = 0;
      for (let lev = levJ; lev < nLevels; lev++) {
        for (let c = 0; c < 4; c++) {
          const n = nodes[lev * 4 + c];
          Mwind += n.fx * (n.z - zLegTop);
        }
      }
      const Pwind = halfW > 0 ? Mwind / (4 * halfW) : 0;
      const sign = el.nodeI.x >= 0 ? 1 : -1;
      el.axialForce = -Pv + Pwind * sign;

    } else if (el.memberType === "diagonal") {
      const panel = Math.round(el.nodeI.z / panelHeight);
      const V = cumH[panel + 1] ?? 0;
      const horiz = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(Math.abs(dz), horiz);
      const sinT = Math.sin(theta);
      el.axialForce = sinT > 1e-9 ? V / (2 * sinT) : 0;

    } else {
      // horizontal
      const panel = Math.round(el.nodeI.z / panelHeight);
      el.axialForce = (cumH[panel] ?? 0) / 4;
    }
  }
}

// --- Design checks ---

function checkElements(elems: TowerElement[], inp: LabInput): void {
  const sigAllow = inp.allowableStress / inp.safetyFactor;

  for (const el of elems) {
    el.stress = Math.abs(el.axialForce) / el.size.area;
    const stressOk = el.stress <= sigAllow;

    let bucklingOk = true;
    if (el.memberType === "leg") {
      const dx = el.nodeJ.x - el.nodeI.x;
      const dy = el.nodeJ.y - el.nodeI.y;
      const dz = el.nodeJ.z - el.nodeI.z;
      const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const r = el.size.radiusGyration;
      const lambda = inp.endCondition === "pin-pin" ? L / r : (2 * L) / r;
      const sigDemand = el.stress > 0 ? el.stress : 1; // avoid /0
      const sigmaCr = (inp.E * Math.PI * Math.PI) / (lambda * lambda);
      const lambdaLimit = Math.sqrt((inp.E * Math.PI * Math.PI) / sigDemand);
      bucklingOk = lambda <= lambdaLimit && sigmaCr >= sigDemand;
    }

    el.passed = stressOk && bucklingOk;
  }
}

// --- Upgrade failed members ---

function upgradeMembers(elems: TowerElement[]): number {
  let upgraded = 0;
  for (const el of elems) {
    if (!el.passed) {
      const idx = MEMBER_TABLE.indexOf(el.size);
      if (idx < MEMBER_TABLE.length - 1) {
        el.size = MEMBER_TABLE[idx + 1];
        upgraded++;
      }
    }
  }
  return upgraded;
}

// --- Main entry point ---

export function runLatticeDesign(inp: LabInput): DesignResult {
  const maxIter = 25;

  const nodes = buildNodes(inp);
  const elements = buildElements(nodes, inp);

  let iter = 0;
  let converged = false;

  for (iter = 1; iter <= maxIter; iter++) {
    applyLoads(nodes, elements, inp);
    estimateForces(nodes, elements, inp);
    checkElements(elements, inp);

    const nFailed = elements.filter((e) => !e.passed).length;
    if (nFailed === 0) {
      converged = true;
      break;
    }
    upgradeMembers(elements);
  }

  const nFailed = elements.filter((e) => !e.passed).length;

  let totalMassKg = 0;
  for (const el of elements) {
    const dx = el.nodeJ.x - el.nodeI.x;
    const dy = el.nodeJ.y - el.nodeI.y;
    const dz = el.nodeJ.z - el.nodeI.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
    totalMassKg += el.size.weightPerM * L;
  }

  return { nodes, elements, iterations: iter, converged, totalMassKg, nFailed };
}
