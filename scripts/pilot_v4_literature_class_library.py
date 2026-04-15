"""Literature-grounded telecom tower class library for Wang-style framework building.

This script creates a reusable telecom class catalog based only on class labels and
intensity-measure conventions explicitly referenced in the telecom portfolio fragility
literature associated with Mohanad Khazaali and Paolo Bocchini.

Why this script exists:
- V1 and V2 are pilot prototype fragility scripts
- V3 is a direct published fragility reproduction for one tower case
- V4 provides the literature-backed class vocabulary needed before building a
  Wang-style class-based telecom fragility framework

Important design choice:
- this script does not invent new class labels
- this script does not assign class-specific fragility parameters that are not
  explicitly given in the cited telecom portfolio sources
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


# ============================================================
# Literature-backed class definitions
# ============================================================

CLASS_LIBRARY_METADATA = {
    "project_name": "Literature-grounded telecom tower class library",
    "purpose": (
        "Create a reusable class library for telecom towers using only published "
        "class labels and wind-intensity conventions from the telecom portfolio literature."
    ),
    "primary_sources": [
        {
            "title": "Physics-Based and Data-Driven Portfolio Fragility Curves for Telecommunication Towers Under Hurricanes",
            "authors": ["Mohanad Khazaali", "Paolo Bocchini"],
            "year": 2022,
            "source_type": "official research group summary",
            "url": "https://www.lehigh.edu/~pab409/20220607emi.html",
            "key_points_used": [
                "The recorded wind speeds were converted to 2 min sustained wind at 10 m height.",
                "Fragility curves for different structural classes were adopted for water tank, monopole, guyed and lattice tower classes.",
            ],
        },
        {
            "title": "Damage and Resilience Assessments of Telecommunication Systems under Hurricanes",
            "authors": ["Mohanad Khazaali"],
            "year": 2022,
            "source_type": "dissertation summary",
            "url": "https://preserve.lehigh.edu/lehigh-scholarship/graduate-publications-theses-dissertations/theses-dissertations/damage",
            "key_points_used": [
                "The structural collapse analysis procedure uses collapse fragility curves for different structural classes.",
                "The listed telecom structural classes include water tank, monopole, guyed and lattice towers.",
            ],
        },
    ],
}


INTENSITY_MEASURE_STANDARD = {
    "name": "2 min sustained wind speed at 10 m height",
    "hazard_type": "wind",
    "units": "m/s",
    "source_basis": "Official telecom portfolio fragility summary from Khazaali and Bocchini (EMI 2022).",
    "notes": (
        "This is stored as the internal reference convention for the class library because the "
        "official portfolio summary states that recorded wind speeds were converted to this form."
    ),
}


# Preserve the class labels directly from the telecom portfolio source.
LITERATURE_CLASS_LIBRARY = [
    {
        "class_id": "water_tank",
        "display_label": "water tank",
        "source_label": "water tank",
        "category_type": "telecommunication tower structural class",
        "source_status": "explicitly listed in telecom portfolio fragility summary",
        "notes": "Class label preserved from the Khazaali and Bocchini telecom portfolio source.",
    },
    {
        "class_id": "monopole",
        "display_label": "monopole",
        "source_label": "monopole",
        "category_type": "telecommunication tower structural class",
        "source_status": "explicitly listed in telecom portfolio fragility summary",
        "notes": "Class label preserved from the Khazaali and Bocchini telecom portfolio source.",
    },
    {
        "class_id": "guyed_tower",
        "display_label": "guyed tower",
        "source_label": "guyed",
        "category_type": "telecommunication tower structural class",
        "source_status": "explicitly listed in telecom portfolio fragility summary",
        "notes": "The source uses the word 'guyed'; this script stores the display label as 'guyed tower' for readability.",
    },
    {
        "class_id": "lattice_tower",
        "display_label": "lattice tower",
        "source_label": "lattice tower",
        "category_type": "telecommunication tower structural class",
        "source_status": "explicitly listed in telecom portfolio fragility summary",
        "notes": "Class label preserved from the Khazaali and Bocchini telecom portfolio source.",
    },
]


def build_class_library_df() -> pd.DataFrame:
    """Build the telecom class library as a table."""
    class_library_df = pd.DataFrame(LITERATURE_CLASS_LIBRARY)

    if class_library_df.empty:
        raise ValueError("Class library cannot be empty.")
    if class_library_df["class_id"].duplicated().any():
        raise ValueError("Class IDs must be unique.")
    if class_library_df["display_label"].duplicated().any():
        raise ValueError("Display labels must be unique.")

    return class_library_df


def normalize_literature_class_label(raw_label: str) -> str:
    """Normalize a raw class label into the literature-backed class vocabulary.

    The normalization is intentionally conservative.
    It only supports direct source labels or obvious singular/plural variants of those labels.
    """
    if raw_label is None:
        raise ValueError("Raw class label cannot be None.")

    cleaned = str(raw_label).strip().lower().replace("-", " ")
    cleaned = " ".join(cleaned.split())

    exact_mapping = {
        "water tank": "water tank",
        "monopole": "monopole",
        "guyed": "guyed tower",
        "guyed tower": "guyed tower",
        "lattice": "lattice tower",
        "lattice tower": "lattice tower",
        "lattice towers": "lattice tower",
    }

    if cleaned not in exact_mapping:
        raise ValueError(
            f"Unsupported class label '{raw_label}'. "
            "This script only recognizes the literature-backed telecom class labels."
        )

    return exact_mapping[cleaned]


def build_example_inventory_template() -> pd.DataFrame:
    """Build a minimal example inventory template using only literature-backed classes."""
    template_records = [
        {
            "tower_id": "EX-001",
            "reported_class_label": "water tank",
            "normalized_class_label": normalize_literature_class_label("water tank"),
            "county": "example_county",
            "state": "example_state",
            "data_source_note": "Replace with real inventory source",
        },
        {
            "tower_id": "EX-002",
            "reported_class_label": "monopole",
            "normalized_class_label": normalize_literature_class_label("monopole"),
            "county": "example_county",
            "state": "example_state",
            "data_source_note": "Replace with real inventory source",
        },
        {
            "tower_id": "EX-003",
            "reported_class_label": "guyed",
            "normalized_class_label": normalize_literature_class_label("guyed"),
            "county": "example_county",
            "state": "example_state",
            "data_source_note": "Replace with real inventory source",
        },
        {
            "tower_id": "EX-004",
            "reported_class_label": "lattice tower",
            "normalized_class_label": normalize_literature_class_label("lattice tower"),
            "county": "example_county",
            "state": "example_state",
            "data_source_note": "Replace with real inventory source",
        },
    ]

    return pd.DataFrame(template_records)


def validate_inventory_classes(inventory_df: pd.DataFrame) -> pd.DataFrame:
    """Validate and normalize class labels in a user inventory table."""
    required_columns = ["tower_id", "reported_class_label"]
    missing_columns = [column for column in required_columns if column not in inventory_df.columns]
    if missing_columns:
        raise ValueError(f"Inventory table is missing required columns: {missing_columns}")

    validated_df = inventory_df.copy()
    validated_df["normalized_class_label"] = validated_df["reported_class_label"].apply(normalize_literature_class_label)
    return validated_df


def build_class_summary_table(class_library_df: pd.DataFrame) -> pd.DataFrame:
    """Create a short readable summary table for the literature-backed classes."""
    summary_df = class_library_df[
        ["class_id", "display_label", "source_label", "category_type", "source_status"]
    ].copy()
    return summary_df


def save_outputs(
    class_library_df: pd.DataFrame,
    class_summary_df: pd.DataFrame,
    example_inventory_df: pd.DataFrame,
) -> Path:
    """Save class library outputs to disk."""
    repo_root = Path(__file__).resolve().parents[1]
    output_folder = repo_root / "outputs" / "v4"
    output_folder.mkdir(parents=True, exist_ok=True)

    with (output_folder / "class_library_metadata.json").open("w", encoding="utf-8") as file:
        json.dump(CLASS_LIBRARY_METADATA, file, indent=4)

    with (output_folder / "intensity_measure_standard.json").open("w", encoding="utf-8") as file:
        json.dump(INTENSITY_MEASURE_STANDARD, file, indent=4)

    class_library_df.to_csv(output_folder / "literature_class_library.csv", index=False)
    class_summary_df.to_csv(output_folder / "literature_class_summary.csv", index=False)
    example_inventory_df.to_csv(output_folder / "example_inventory_template.csv", index=False)

    return output_folder


def print_summary(class_summary_df: pd.DataFrame) -> None:
    """Print a short plain-English summary."""
    print("Literature-grounded telecom class library")
    print("=" * 60)
    print(f"Internal wind-speed convention: {INTENSITY_MEASURE_STANDARD['name']}")
    print("")
    print("Published telecom structural classes preserved in this script:")
    for _, row in class_summary_df.iterrows():
        print(f"- {row['display_label']} (source label: {row['source_label']})")
    print("")
    print("This script intentionally stops at class definitions and metadata.")
    print("It does not assign made-up fragility parameters to these classes.")


def main() -> None:
    """Run the complete literature-grounded class library workflow."""
    class_library_df = build_class_library_df()
    class_summary_df = build_class_summary_table(class_library_df)
    example_inventory_df = build_example_inventory_template()

    # Validate the example inventory as a basic run check.
    _ = validate_inventory_classes(example_inventory_df[["tower_id", "reported_class_label"]].copy())

    output_folder = save_outputs(
        class_library_df=class_library_df,
        class_summary_df=class_summary_df,
        example_inventory_df=example_inventory_df,
    )

    print_summary(class_summary_df)
    print(f"Outputs saved in: {output_folder}")


if __name__ == "__main__":
    main()
