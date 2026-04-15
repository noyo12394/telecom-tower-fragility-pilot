# Literature-Grounded Values Used in `pilot_v3_published_greece_case.py`

This note records the exact published values used in the literature-based script so they are easy to audit.

## Primary Source

- Bilionis, D. V., and Vamvatsikos, D. (2022)
  - *Risk assessment of rehabilitation strategies for steel lattice telecommunication towers of Greece under extreme wind hazard*
  - Engineering Structures
  - DOI: `10.1016/j.engstruct.2022.114625`
  - Open PDF used during repo setup:
    - https://www.hyperion-project.eu/wp-content/uploads/2023/02/bilionis-vlachakis-vamva-etal_prEngStr2022_RiskRehabilitationTelecomTowerWindHazard.pdf

## Published Tower Description Used

The paper describes a steel lattice telecommunication tower with:

- structural height: `48 m`
- top-mounted dish antennas between `45 m` and `48 m`
- number of dish antennas: `4`
- dish antenna weight: `2.30 kN` each
- ladder weight: `15.30 kN`
- waveguide rack weight: `14.60 kN`
- cable weight: `0.05 kN/m` per dish
- platform live load: `2.00 kN/m²`
- ladder live load: `5.00 kN`

## Published Wind Model Values Used

The same paper states:

- velocity pressure: `q = 0.5 * rho * u^2`
- air density: `rho = 1.225 kg/m^3`
- power-law wind profile exponent: `alpha = 0.20`
- basic wind speed for most of Greece: `27 m/s`
- basic wind speed within `10 km` of the shoreline: `33 m/s`

These are reported as `10-minute average` basic wind speeds in the paper.

## Published Fragility Parameters Used

The script reproduces the published lognormal fragility form:

- `P(D > C | u, theta) = Phi( ln(u / u50(theta)) / beta(theta) )`

The paper provides `u50` and `beta` for four tower conditions and three wind directions:

### Initial tower

- `0°`: `u50 = 39.11 m/s`, `beta = 0.1895`
- `22.5°`: `u50 = 42.83 m/s`, `beta = 0.1898`
- `45°`: `u50 = 45.94 m/s`, `beta = 0.1908`

### Corroded tower

- `0°`: `u50 = 30.82 m/s`, `beta = 0.1994`
- `22.5°`: `u50 = 33.44 m/s`, `beta = 0.1985`
- `45°`: `u50 = 35.93 m/s`, `beta = 0.1982`

### Strengthened tower

- `0°`: `u50 = 46.03 m/s`, `beta = 0.1637`
- `22.5°`: `u50 = 47.89 m/s`, `beta = 0.1625`
- `45°`: `u50 = 49.27 m/s`, `beta = 0.1631`

### Strengthened tower with HSS bracings

- `0°`: `u50 = 57.96 m/s`, `beta = 0.1379`
- `22.5°`: `u50 = 58.18 m/s`, `beta = 0.1375`
- `45°`: `u50 = 57.13 m/s`, `beta = 0.1340`

## Why This Matters

The first two scripts in this repo are deliberately simple pilot prototypes.
The third script is different:

- it does not invent fragility parameters
- it reproduces published directional fragility data
- it is meant to be a literature-grounded benchmark for future telecom tower work
