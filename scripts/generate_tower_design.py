#!/usr/bin/env python3
"""
Telecom Tower Design Generator — Preliminary academic tool.
NOT a stamped structural design. For research and education only.

Mirrors the TypeScript workflow in the Telecom Tower Design Explorer web app.
Ref: Bilionis & Vamvatsikos 2019, ASCE 10-15 §3.4 slenderness limits.
"""
import argparse
import json
import math
import csv
import os
from pathlib import Path

# ── Section table (AISC equal-leg angles) ──────────────────────────────────
ANGLE_SECTIONS = [
    {"label": "L45x45x5",   "A_mm2": 430,  "r_min_mm": 8.8,  "mass_kg_m": 3.4},
    {"label": "L50x50x5",   "A_mm2": 480,  "r_min_mm": 9.8,  "mass_kg_m": 3.77},
    {"label": "L60x60x6",   "A_mm2": 691,  "r_min_mm": 11.8, "mass_kg_m": 5.42},
    {"label": "L70x70x6",   "A_mm2": 826,  "r_min_mm": 13.7, "mass_kg_m": 6.5},
    {"label": "L75x75x6",   "A_mm2": 877,  "r_min_mm": 14.7, "mass_kg_m": 6.87},
    {"label": "L80x80x8",   "A_mm2": 1230, "r_min_mm": 15.6, "mass_kg_m": 9.66},
    {"label": "L90x90x7",   "A_mm2": 1230, "r_min_mm": 17.7, "mass_kg_m": 9.64},
    {"label": "L100x100x10","A_mm2": 1920, "r_min_mm": 19.5, "mass_kg_m": 15.1},
    {"label": "L120x120x12","A_mm2": 2750, "r_min_mm": 23.5, "mass_kg_m": 21.6},
    {"label": "L140x140x13","A_mm2": 3560, "r_min_mm": 27.5, "mass_kg_m": 27.9},
    {"label": "L160x160x15","A_mm2": 4680, "r_min_mm": 31.4, "mass_kg_m": 36.8},
]

# Bilionis baseline: maps 0-indexed panel tier (0=bottom, 9=top) to section label
BILIONIS_BASELINE = {
    0: "L160x160x15", 1: "L160x160x15",
    2: "L160x160x15", 3: "L140x140x13",
    4: "L140x140x13", 5: "L120x120x12",
    6: "L120x120x12", 7: "L100x100x10",
    8: "L100x100x10", 9: "L80x80x8",
}

KLR_LIMITS = {"leg": 150, "bracing": 200, "redundant": 250}
E_STEEL_MPA = 200_000


def section_by_label(label):
    return next((s for s in ANGLE_SECTIONS if s["label"] == label), ANGLE_SECTIONS[7])


def next_heavier(label):
    idx = next((i for i, s in enumerate(ANGLE_SECTIONS) if s["label"] == label), -1)
    if idx < 0 or idx >= len(ANGLE_SECTIONS) - 1:
        return None
    return ANGLE_SECTIONS[idx + 1]


def euler_sigma_cr(klr):
    if klr <= 0:
        return float("inf")
    return E_STEEL_MPA * math.pi**2 / klr**2


def width_at_elevation(base_w, top_w, elev, height):
    return base_w - (base_w - top_w) * (elev / height)


def panel_leg_length(panel_h, width_bot, width_top):
    dw = (width_bot - width_top) / 2
    return math.sqrt(panel_h**2 + dw**2)


def generate_panels(height, base_w, top_w, n_panels):
    ph = height / n_panels
    panels = []
    for i in range(n_panels):
        elev_bot = i * ph
        elev_top = (i + 1) * ph
        w_bot = width_at_elevation(base_w, top_w, elev_bot, height)
        w_top = width_at_elevation(base_w, top_w, elev_top, height)
        leg_len = panel_leg_length(ph, w_bot, w_top)
        tier = min(9, int(i * 10 / n_panels))
        baseline_label = BILIONIS_BASELINE.get(tier, "L100x100x10")
        panels.append({
            "panel": i + 1, "elev_bot": elev_bot, "elev_top": elev_top,
            "w_bot": w_bot, "w_top": w_top, "leg_len": leg_len,
            "baseline_section": baseline_label,
        })
    return panels


def run_check(leg_len_m, section_label, end_condition="pin-pin"):
    sec = section_by_label(section_label)
    klr = (leg_len_m * 1000) / sec["r_min_mm"]
    eff_klr = klr * (2 if end_condition == "fixed-free" else 1)
    limit = KLR_LIMITS["leg"]
    sigma_cr = euler_sigma_cr(eff_klr)
    if eff_klr > limit:
        status = "exceeds"
    elif eff_klr > limit * 0.9:
        status = "close"
    else:
        status = "pass"
    return {"klr": klr, "eff_klr": eff_klr, "limit": limit, "sigma_cr_mpa": sigma_cr, "status": status}


def update_section(panel, end_condition="pin-pin"):
    section = panel["baseline_section"]
    upgraded = False
    while True:
        chk = run_check(panel["leg_len"], section, end_condition)
        if chk["status"] == "pass":
            break
        nxt = next_heavier(section)
        if nxt is None:
            break
        section = nxt["label"]
        upgraded = True
    return section, upgraded, run_check(panel["leg_len"], section, end_condition)


def main():
    parser = argparse.ArgumentParser(description="Generate tower design")
    parser.add_argument("--height", type=float, default=60.0)
    parser.add_argument("--base-width", type=float, default=6.0)
    parser.add_argument("--top-width", type=float, default=1.2)
    parser.add_argument("--wind-speed", type=float, default=115.0)
    parser.add_argument("--bracing", default="Double K/K-B")
    parser.add_argument("--panels", type=int, default=10)
    parser.add_argument("--end-condition", choices=["pin-pin", "fixed-free"], default="pin-pin")
    parser.add_argument("--input", type=str, help="JSON input file (overrides other args)")
    args = parser.parse_args()

    if args.input:
        with open(args.input) as f:
            data = json.load(f)
        height = data.get("height_m", args.height)
        base_w = data.get("base_width_m", args.base_width)
        top_w  = data.get("top_width_m", args.top_width)
        wind   = data.get("wind_speed_mph", args.wind_speed)
        bracing= data.get("bracing", args.bracing)
        n_pan  = data.get("panel_count", args.panels)
        end_cond = data.get("end_condition", args.end_condition)
    else:
        height, base_w, top_w = args.height, args.base_width, args.top_width
        wind, bracing, n_pan = args.wind_speed, args.bracing, args.panels
        end_cond = args.end_condition

    panels = generate_panels(height, base_w, top_w, n_pan)

    # Draft
    draft_rows = []
    for p in panels:
        chk = run_check(p["leg_len"], p["baseline_section"], end_cond)
        draft_rows.append({**p, **chk, "badge": "Literature Baseline"})

    # Update loop
    final_rows = []
    for p, d in zip(panels, draft_rows):
        final_sec, upgraded, chk = update_section(p, end_cond)
        badge = "Updated after check" if upgraded else "Literature Baseline"
        final_rows.append({**d, "final_section": final_sec, "upgraded": upgraded,
                           "final_klr": chk["klr"], "final_sigma_cr": chk["sigma_cr_mpa"],
                           "final_status": chk["status"], "badge": badge})

    out = Path("outputs")
    out.mkdir(exist_ok=True)

    # Draft CSV
    with open(out / "design_draft.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["panel","elev_bot","elev_top","leg_len","baseline_section","klr","limit","sigma_cr_mpa","status","badge"])
        w.writeheader()
        for r in draft_rows:
            w.writerow({k: r[k] for k in w.fieldnames if k in r})

    # Checks CSV
    with open(out / "design_checks.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["panel","baseline_section","klr","eff_klr","limit","sigma_cr_mpa","status"])
        w.writeheader()
        for r in draft_rows:
            w.writerow({k: r.get(k,"") for k in w.fieldnames})

    # Final CSV
    with open(out / "design_final.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["panel","elev_bot","elev_top","baseline_section","final_section","upgraded","final_klr","final_sigma_cr","final_status","badge"])
        w.writeheader()
        for r in final_rows:
            w.writerow({k: r.get(k,"") for k in w.fieldnames})

    # Summary JSON
    total_mass = sum(
        r["leg_len"] * 4 * (section_by_label(r["final_section"])["mass_kg_m"])
        for r in final_rows
    )
    summary = {
        "inputs": {"height_m": height, "base_width_m": base_w, "top_width_m": top_w,
                   "wind_speed_mph": wind, "bracing": bracing, "panel_count": n_pan,
                   "end_condition": end_cond},
        "results": {
            "panels_pass": sum(1 for r in final_rows if r["final_status"] == "pass"),
            "panels_close": sum(1 for r in final_rows if r["final_status"] == "close"),
            "panels_exceed": sum(1 for r in final_rows if r["final_status"] == "exceeds"),
            "panels_upgraded": sum(1 for r in final_rows if r["upgraded"]),
            "total_leg_steel_mass_kg": round(total_mass, 1),
        }
    }
    with open(out / "design_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"Done. Outputs written to {out.resolve()}")
    print(json.dumps(summary["results"], indent=2))


if __name__ == "__main__":
    main()
