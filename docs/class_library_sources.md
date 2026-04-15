# Literature Sources Used in `pilot_v4_literature_class_library.py`

This note records the exact literature-backed basis for the telecom class library script.

## Primary Published Idea

The purpose of `pilot_v4_literature_class_library.py` is not to invent a new tower taxonomy.
Instead, it preserves the telecom structural classes already used in Khazaali and Bocchini's portfolio-fragility work.

## Source 1: Official Research Group Summary

- Bocchini Research Group, EMI 2022 summary page:
  - https://www.lehigh.edu/~pab409/20220607emi.html

Relevant statements from the official page:

- The hurricane wind speeds were converted to:
  - `2 min sustained wind at 10 m height`
- The structural classes used for telecom portfolio collapse fragility were:
  - `water tank`
  - `monopole`
  - `guyed`
  - `lattice tower`

This is the exact published portfolio-oriented class list that the `v4` script preserves.

## Source 2: Khazaali Dissertation Summary

- Khazaali, Mohanad. (2022)
  - *Damage and Resilience Assessments of Telecommunication Systems under Hurricanes*
  - Lehigh Preserve summary:
    - https://preserve.lehigh.edu/lehigh-scholarship/graduate-publications-theses-dissertations/theses-dissertations/damage

The preserve summary confirms that:

- the study proposes a structural collapse analysis procedure
- collapse fragility curves for different structural classes were adopted from the literature
- the structural classes include:
  - `water tank`
  - `monopole`
  - `guyed`
  - `lattice towers`

## What the Script Intentionally Does

The script:

- encodes the literature-backed class labels into a reusable class library
- records the literature-backed wind intensity-measure convention
- provides a validation helper and example inventory template

## What the Script Intentionally Does Not Do

The script does **not**:

- invent new telecom structural classes
- assign made-up class fragility parameters
- claim class-specific geometry or resistance values that were not explicitly provided in the cited sources

That separation is intentional: the class library is literature-grounded, while class-specific fragility parameters should only be added when they come from a defensible source.
