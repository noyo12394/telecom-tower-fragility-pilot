#!/usr/bin/env python3
"""Generate a preliminary telecom tower design workflow from simple inputs."""

from __future__ import annotations

import argparse
import csv
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any


G = 9.80665
MPH_TO_MPS = 0.44704
E_GPA = 200.0
SAFETY_FACTOR = 1.67

ANGLE_SECTIONS = [
    {"label": "L45×45×5", "A_mm2": 430, "r_min_mm": 8.8, "mass_kg_m": 3.4},
    {"label": "L50×50×5", "A_mm2": 480, "r_min_mm": 9.8, "mass_kg_m": 3.77},
    {"label": "L60×60×6", "A_mm2": 691, "r_min_mm": 11.8, "mass_kg_m": 5.42},
    {"label": "L70×70×6", "A_mm2": 826, "r_min_mm": 13.7, "mass_kg_m": 6.5},
    {"label": "L75×75×6", "A_mm2": 877, "r_min_mm": 14.7, "mass_kg_m": 6.87},
    {"label": "L80×80×8", "A_mm2": 1230, "r_min_mm": 15.6, "mass_kg_m": 9.66},
    {"label": "L90×90×7", "A_mm2": 1230, "r_min_mm": 17.7, "mass_kg_m": 9.64},
    {"label": "L100×100×10", "A_mm2": 1920, "r_min_mm": 19.5, "mass_kg_m": 15.1},
    {"label": "L120×120×12", "A_mm2": 2750, "r_min_mm": 23.5, "mass_kg_m": 21.6},
    {"label": "L140×140×13", "A_mm2": 3560, "r_min_mm": 27.5, "mass_kg_m": 27.9},
    {"label": "L160×160×15", "A_mm2": 4680, "r_min_mm": 31.4, "mass_kg_m": 36.8},
]

PROFILE_BY_REF = {
    1: ("L160×160×15", "L100×100×8", "L75×75×6"),
    2: ("L160×160×15", "L100×100×8", "L75×75×6"),
    3: ("L160×160×15", "L90×90×7", "L65×65×5"),
    4: ("L140×140×13", "L90×90×7", "L65×65×5"),
    5: ("L140×140×13", "L80×80×8", "L50×50×5"),
    6: ("L120×120×12", "L70×70×6", "L50×50×5"),
    7: ("L120×120×12", "L70×70×6", "L50×50×5"),
    8: ("L100×100×10", "L60×60×5", "L45×45×5"),
    9: ("L100×100×10", "L60×60×5", "L45×45×5"),
    10: ("L80×80×8", "L45×45×5", "L45×45×5"),
}


@dataclass
class Panel:
    number: int
    elev_bottom: float
    elev_top: float
    w_bottom: float
    w_top: float
    panel_height: float
    average_width: float
    leg_length: float
    k_brace_diag: float
    sub_horizontal: float
    horizontal: float
    hip_brace_diag: float | None
    solidity_ratio: float
    drag_coefficient: float


def section(label: str) -> dict[str, Any]:
    direct = next((item for item in ANGLE_SECTIONS if item["label"] == label), None)
    if direct:
        return direct
    if label == "L100×100×8":
        return section("L100×100×10")
    if label == "L60×60×5":
        return section("L60×60×6")
    if label == "L65×65×5":
        return section("L70×70×6")
    return section("L80×80×8")


def face_width(z: float, height_m: float, base_width_m: float, top_width_m: float) -> float:
    return base_width_m - (base_width_m - top_width_m) * (z / height_m)


def drag_coefficient(solidity_ratio: float) -> float:
    return 4.0 * solidity_ratio**2 - 5.9 * solidity_ratio + 4.0


def generate_panels(
    height_m: float,
    panel_count: int,
    base_width_m: float,
    top_width_m: float,
) -> list[Panel]:
    panel_height = height_m / panel_count
    panels: list[Panel] = []
    for index in range(panel_count):
        number = index + 1
        elev_bottom = index * panel_height
        elev_top = (index + 1) * panel_height
        w_bottom = face_width(elev_bottom, height_m, base_width_m, top_width_m)
        w_top = face_width(elev_top, height_m, base_width_m, top_width_m)
        horizontal_offset = (w_bottom - w_top) / 2
        leg = math.sqrt(panel_height**2 + horizontal_offset**2)
        k_horizontal = w_bottom / 2 - w_top / 4
        k_diag = math.sqrt(panel_height**2 + k_horizontal**2)
        solidity = 0.2 + 0.05 * (1 - index / panel_count)
        panels.append(
            Panel(
                number=number,
                elev_bottom=elev_bottom,
                elev_top=elev_top,
                w_bottom=w_bottom,
                w_top=w_top,
                panel_height=panel_height,
                average_width=(w_bottom + w_top) / 2,
                leg_length=leg,
                k_brace_diag=k_diag,
                sub_horizontal=(w_bottom + w_top) / 2,
                horizontal=w_bottom,
                hip_brace_diag=math.sqrt(2) * w_bottom if number in {3, 6, 9} else None,
                solidity_ratio=solidity,
                drag_coefficient=drag_coefficient(solidity),
            )
        )
    return panels


def reference_panel(panel_number: int, panel_count: int) -> int:
    midpoint_ratio = (panel_number - 0.5) / panel_count
    return min(10, max(1, math.ceil(midpoint_ratio * 10)))


def member_profile(panel_number: int, panel_count: int) -> dict[str, str]:
    leg, diagonal, horizontal = PROFILE_BY_REF[reference_panel(panel_number, panel_count)]
    return {"leg": leg, "diagonal": diagonal, "horizontal": horizontal}


def panel_wind_force_n(wind_speed_mph: float, panel: Panel) -> float:
    velocity_mps = wind_speed_mph * MPH_TO_MPS
    q_pa = 0.613 * velocity_mps**2
    projected_area = panel.average_width * panel.panel_height * panel.solidity_ratio
    return q_pa * panel.drag_coefficient * projected_area


def panel_weight_n(panel: Panel, profile: dict[str, str]) -> float:
    leg_mass = section(profile["leg"])["mass_kg_m"]
    diagonal_mass = section(profile["diagonal"])["mass_kg_m"]
    horizontal_mass = section(profile["horizontal"])["mass_kg_m"]
    total_mass = (
        panel.leg_length * 4 * leg_mass
        + panel.k_brace_diag * 8 * diagonal_mass
        + panel.sub_horizontal * 4 * horizontal_mass
        + panel.horizontal * 4 * horizontal_mass
        + (panel.hip_brace_diag or 0) * 2 * diagonal_mass
    )
    return total_mass * G


def leg_sigma_demand(
    panel: Panel,
    panels: list[Panel],
    profiles: dict[int, dict[str, str]],
    wind_speed_mph: float,
) -> float:
    start_index = panel.number - 1
    panels_above = panels[start_index:]
    weight_n = sum(panel_weight_n(candidate, profiles[candidate.number]) for candidate in panels_above)
    moment_nm = sum(
        panel_wind_force_n(wind_speed_mph, candidate)
        * ((candidate.elev_bottom + candidate.elev_top) / 2)
        for candidate in panels_above
    )
    force_n = weight_n / 4 + moment_nm / (2 * max(panel.average_width, 0.25))
    return force_n / section(profiles[panel.number]["leg"])["A_mm2"]


def member_sigma_demand(
    panel: Panel,
    section_label: str,
    wind_speed_mph: float,
    load_share: float,
) -> float:
    return panel_wind_force_n(wind_speed_mph, panel) / load_share / section(section_label)["A_mm2"]


def status(demand: float, capacity: float) -> str:
    if demand > capacity:
        return "exceeds"
    if demand > 0.9 * capacity:
        return "close"
    return "pass"


def check_member(
    length_m: float,
    section_label: str,
    role: str,
    sigma_demand_mpa: float,
    fy_mpa: float,
    end_condition: str,
) -> dict[str, Any]:
    props = section(section_label)
    k_factor = 2.0 if end_condition == "fixed-free" else 1.0
    klr = k_factor * length_m * 1000 / props["r_min_mm"]
    limit = 150 if role == "leg" else 200 if role == "bracing" else 250
    sigma_cr = E_GPA * 1000 * math.pi**2 / klr**2
    sigma_adm = fy_mpa / SAFETY_FACTOR
    klr_status = "exceeds" if klr > limit else "close" if klr > 0.9 * limit else "pass"
    stress_status = status(sigma_demand_mpa, sigma_adm)
    euler_status = status(sigma_demand_mpa, sigma_cr) if role == "leg" else klr_status
    combined = max(
        [klr_status, stress_status, euler_status] if role == "leg" else [stress_status],
        key={"pass": 1, "close": 2, "exceeds": 3}.get,
    )
    return {
        "klr": klr,
        "limit": limit,
        "sigma_demand_mpa": sigma_demand_mpa,
        "sigma_admissible_mpa": sigma_adm,
        "sigma_cr_mpa": sigma_cr,
        "status": combined,
    }


def next_passing_section(
    current_section: str,
    length_m: float,
    sigma_demand_mpa: float,
    end_condition: str,
) -> str:
    current = section(current_section)["label"]
    start = next(index for index, item in enumerate(ANGLE_SECTIONS) if item["label"] == current)
    for candidate in ANGLE_SECTIONS[start:]:
        result = check_member(
            length_m,
            candidate["label"],
            "leg",
            sigma_demand_mpa,
            345,
            end_condition,
        )
        if result["status"] == "pass":
            return candidate["label"]
    return ANGLE_SECTIONS[-1]["label"]


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def run_workflow(config: dict[str, Any], output_dir: Path) -> dict[str, Any]:
    height_m = float(config["height_m"])
    base_width_m = float(config["base_width_m"])
    top_width_m = float(config["top_width_m"])
    wind_speed_mph = float(config["wind_speed_mph"])
    panel_count = int(config["panel_count"])
    bracing = config.get("bracing", "Double K/K-B")
    end_condition = config.get("end_condition", "pin-pin")

    panels = generate_panels(height_m, panel_count, base_width_m, top_width_m)
    profiles = {panel.number: member_profile(panel.number, panel_count) for panel in panels}

    draft_rows: list[dict[str, Any]] = []
    check_rows: list[dict[str, Any]] = []
    final_rows: list[dict[str, Any]] = []
    counts = {"pass": 0, "close": 0, "exceeds": 0}

    for panel in panels:
        profile = profiles[panel.number]
        draft_rows.append(
            {
                "panel": panel.number,
                "elevation_m": f"{panel.elev_bottom:.1f}-{panel.elev_top:.1f}",
                "w_bottom_m": round(panel.w_bottom, 3),
                "w_top_m": round(panel.w_top, 3),
                "leg_length_m": round(panel.leg_length, 3),
                "k_brace_diag_m": round(panel.k_brace_diag, 3),
                "sub_horizontal_m": round(panel.sub_horizontal, 3),
                "leg_section": profile["leg"],
                "diagonal_section": profile["diagonal"],
                "horizontal_section": profile["horizontal"],
                "badge": "Literature Baseline",
            }
        )

        leg_demand = leg_sigma_demand(panel, panels, profiles, wind_speed_mph)
        elements = [
            ("Leg", profile["leg"], panel.leg_length, "leg", leg_demand, 345, "Leg buckling + stress"),
            (
                "K-Brace",
                profile["diagonal"],
                panel.k_brace_diag,
                "bracing",
                member_sigma_demand(panel, profile["diagonal"], wind_speed_mph, 8),
                250,
                "Admissible stress only",
            ),
            (
                "Sub-Horizontal",
                profile["horizontal"],
                panel.sub_horizontal,
                "redundant",
                member_sigma_demand(panel, profile["horizontal"], wind_speed_mph, 4),
                250,
                "Admissible stress only",
            ),
            (
                "Horizontal Chord",
                profile["horizontal"],
                panel.horizontal,
                "redundant",
                member_sigma_demand(panel, profile["horizontal"], wind_speed_mph, 4),
                250,
                "Admissible stress only",
            ),
        ]
        if panel.hip_brace_diag:
            elements.append(
                (
                    "Hip Brace",
                    profile["diagonal"],
                    panel.hip_brace_diag,
                    "redundant",
                    member_sigma_demand(panel, profile["diagonal"], wind_speed_mph, 2),
                    250,
                    "Admissible stress only",
                )
            )

        leg_result: dict[str, Any] | None = None
        for element, sec, length_m, role, demand, fy, basis in elements:
            result = check_member(length_m, sec, role, demand, fy, end_condition)
            counts[result["status"]] += 1
            if element == "Leg":
                leg_result = result
            check_rows.append(
                {
                    "panel": panel.number,
                    "element": element,
                    "basis": basis,
                    "section": sec,
                    "length_m": round(length_m, 3),
                    "klr": round(result["klr"], 2),
                    "limit": result["limit"],
                    "sigma_demand_mpa": round(result["sigma_demand_mpa"], 3),
                    "sigma_admissible_mpa": round(result["sigma_admissible_mpa"], 2),
                    "sigma_cr_mpa": round(result["sigma_cr_mpa"], 2) if role == "leg" else "legs only",
                    "status": result["status"],
                }
            )

        final_leg = profile["leg"]
        badge = "Literature Baseline"
        final_status = leg_result["status"] if leg_result else "pass"
        if leg_result and leg_result["status"] != "pass":
            final_leg = next_passing_section(profile["leg"], panel.leg_length, leg_demand, end_condition)
            badge = "Updated after check" if final_leg != profile["leg"] else "Derived/Assumed"
            final_status = "pass" if final_leg != profile["leg"] else leg_result["status"]

        final_rows.append(
            {
                "panel": panel.number,
                "draft_leg_section": profile["leg"],
                "final_leg_section": final_leg,
                "diagonal_section": profile["diagonal"],
                "horizontal_section": profile["horizontal"],
                "status": final_status,
                "badge": badge,
            }
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    draft_path = output_dir / "draft_design.csv"
    checks_path = output_dir / "check_results.csv"
    final_path = output_dir / "final_design.csv"
    summary_path = output_dir / "summary.json"
    write_csv(draft_path, draft_rows)
    write_csv(checks_path, check_rows)
    write_csv(final_path, final_rows)

    estimated_steel_kg = 0.0
    for panel, final in zip(panels, final_rows):
        profile = profiles[panel.number]
        estimated_steel_kg += (
            panel.leg_length * 4 * section(final["final_leg_section"])["mass_kg_m"]
            + panel.k_brace_diag * 8 * section(profile["diagonal"])["mass_kg_m"]
            + panel.sub_horizontal * 4 * section(profile["horizontal"])["mass_kg_m"]
            + panel.horizontal * 4 * section(profile["horizontal"])["mass_kg_m"]
            + (panel.hip_brace_diag or 0) * 2 * section(profile["diagonal"])["mass_kg_m"]
        )

    summary = {
        "config": {
            "height_m": height_m,
            "base_width_m": base_width_m,
            "top_width_m": top_width_m,
            "wind_speed_mph": wind_speed_mph,
            "bracing": bracing,
            "panel_count": panel_count,
            "end_condition": end_condition,
        },
        "counts": counts,
        "updated_panels": sum(1 for row in final_rows if row["badge"] == "Updated after check"),
        "estimated_steel_kg": round(estimated_steel_kg, 2),
        "files": {
            "draft_design_csv": str(draft_path),
            "check_results_csv": str(checks_path),
            "final_design_csv": str(final_path),
            "summary_json": str(summary_path),
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-json", type=Path)
    parser.add_argument("--height-m", type=float, default=60)
    parser.add_argument("--base-width-m", type=float, default=6.0)
    parser.add_argument("--top-width-m", type=float, default=1.2)
    parser.add_argument("--wind-speed-mph", type=float, default=115)
    parser.add_argument("--bracing", choices=["Double K/K-B", "K-Down"], default="Double K/K-B")
    parser.add_argument("--panel-count", type=int, default=10)
    parser.add_argument("--end-condition", choices=["pin-pin", "fixed-free"], default="pin-pin")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/design_workflow"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.input_json:
        config = json.loads(args.input_json.read_text(encoding="utf-8"))
    else:
        config = {
            "height_m": args.height_m,
            "base_width_m": args.base_width_m,
            "top_width_m": args.top_width_m,
            "wind_speed_mph": args.wind_speed_mph,
            "bracing": args.bracing,
            "panel_count": args.panel_count,
            "end_condition": args.end_condition,
        }

    summary = run_workflow(config, args.output_dir)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
