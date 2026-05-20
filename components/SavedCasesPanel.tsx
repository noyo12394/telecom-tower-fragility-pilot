"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

import {
  createSavedWorkspaceState,
  downloadJson,
  loadSavedWorkspaceStates,
  saveWorkspaceStates,
  type SavedWorkspaceState
} from "@/lib/caseStorage";
import { type TowerConfig, type UnitSystem } from "@/lib/tower";

interface SavedCasesPanelProps {
  config: TowerConfig;
  compareMode: boolean;
  compareLeftConfig: TowerConfig;
  compareRightConfig: TowerConfig;
  unitSystem: UnitSystem;
  onLoadSingle: (config: TowerConfig, unitSystem: UnitSystem) => void;
  onLoadCompare: (
    leftConfig: TowerConfig,
    rightConfig: TowerConfig,
    unitSystem: UnitSystem
  ) => void;
}

export function SavedCasesPanel({
  config,
  compareMode,
  compareLeftConfig,
  compareRightConfig,
  unitSystem,
  onLoadSingle,
  onLoadCompare
}: SavedCasesPanelProps) {
  const [savedCases, setSavedCases] = useState<SavedWorkspaceState[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSavedCases(loadSavedWorkspaceStates());
  }, []);

  useEffect(() => {
    saveWorkspaceStates(savedCases);
  }, [savedCases]);

  function saveCurrentState() {
    const finalName =
      name.trim() ||
      (compareMode
        ? `Comparison ${new Date().toLocaleDateString()}`
        : `${config.heightMeters}m ${config.bracing} ${new Date().toLocaleDateString()}`);

    const newState = compareMode
      ? createSavedWorkspaceState({
          name: finalName,
          notes,
          mode: "compare",
          unitSystem,
          leftConfig: compareLeftConfig,
          rightConfig: compareRightConfig
        })
      : createSavedWorkspaceState({
          name: finalName,
          notes,
          mode: "single",
          unitSystem,
          config
        });

    setSavedCases((current) => [newState, ...current]);
    setName("");
    setNotes("");
    setMessage(compareMode ? "Comparison snapshot saved" : "Design case saved");
    window.setTimeout(() => setMessage(""), 2200);
  }

  function loadState(saved: SavedWorkspaceState) {
    if (saved.mode === "compare" && saved.leftConfig && saved.rightConfig) {
      onLoadCompare(saved.leftConfig, saved.rightConfig, saved.unitSystem);
      return;
    }

    if (saved.config) {
      onLoadSingle(saved.config, saved.unitSystem);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SavedWorkspaceState[];
      if (Array.isArray(parsed)) {
        setSavedCases((current) => [...parsed, ...current]);
        setMessage("Saved cases imported");
        window.setTimeout(() => setMessage(""), 2200);
      }
    } catch {
      setMessage("Import failed");
      window.setTimeout(() => setMessage(""), 2200);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="space-y-6">
      <div className="panel-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="micro-label">Saved cases</p>
            <h2 className="section-title">Save / Load Research Cases</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
              Save the current tower state or comparison snapshot to local
              browser storage, then reload it later or export the saved set as a
              JSON archive.
            </p>
          </div>
          {message ? (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {message}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-navy">
              Case name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  compareMode ? "Comparison snapshot name" : "Tower case name"
                }
                className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-navy">
              Notes
              <input
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional meeting notes"
                className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-normal"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={saveCurrentState}
              className="rounded-2xl border border-navy bg-navy px-4 py-3 text-sm font-medium text-white"
            >
              {compareMode ? "Save comparison snapshot" : "Save current tower case"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadJson("telecom-tower-saved-cases.json", savedCases)
              }
              className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm font-medium text-navy"
            >
              Export saved cases JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm font-medium text-navy"
            >
              Import saved cases JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="panel-card p-6">
        <div className="mb-4">
          <p className="micro-label">Saved workspace history</p>
          <h2 className="section-title">Reload prior cases and snapshots</h2>
        </div>

        <div className="space-y-3">
          {savedCases.length ? (
            savedCases.map((saved) => (
              <article
                key={saved.id}
                className="rounded-2xl border border-line bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-navy">
                      {saved.name}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-steel">
                      {saved.mode === "compare" ? "Comparison snapshot" : "Single design case"}{" "}
                      | saved {new Date(saved.createdAt).toLocaleString()}
                    </p>
                    {saved.notes ? (
                      <p className="mt-2 text-sm leading-6 text-steel">{saved.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadState(saved)}
                      className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-navy"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSavedCases((current) =>
                          current.filter((caseItem) => caseItem.id !== saved.id)
                        )
                      }
                      className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-navy"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-line bg-slate-50 px-4 py-4 text-sm text-steel">
              No saved cases yet. Save your current tower or comparison state to
              start building a reusable study set.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
