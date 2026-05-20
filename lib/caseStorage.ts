import { type TowerConfig, type UnitSystem } from "@/lib/tower";

export type SavedWorkspaceMode = "single" | "compare";

export interface SavedWorkspaceState {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
  mode: SavedWorkspaceMode;
  unitSystem: UnitSystem;
  config?: TowerConfig;
  leftConfig?: TowerConfig;
  rightConfig?: TowerConfig;
}

const STORAGE_KEY = "telecom-tower-design-explorer-cases";

export function loadSavedWorkspaceStates(): SavedWorkspaceState[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedWorkspaceState[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWorkspaceStates(states: SavedWorkspaceState[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

export function createSavedWorkspaceState(input: {
  name: string;
  notes: string;
  mode: SavedWorkspaceMode;
  unitSystem: UnitSystem;
  config?: TowerConfig;
  leftConfig?: TowerConfig;
  rightConfig?: TowerConfig;
}): SavedWorkspaceState {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...input
  };
}

export function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

