# Telecom Tower Design Explorer Guide

This guide explains how to use the dashboard in a simple, practical way.

Live app:

- https://telecom-tower-fragility-pilot.vercel.app

Repository:

- https://github.com/noyo12394/telecom-tower-fragility-pilot

## 1. What This Dashboard Is

The dashboard is a research visualization tool for a preliminary self-supporting lattice telecom tower.

It helps you:

- define a pilot tower geometry
- see how the tower shape changes when you change inputs
- track which values come from standards, literature, or assumptions
- view a simple wind-pressure calculation by elevation
- export a clean design summary for discussion

It is not a final structural design tool.

## 2. The Three Badge Types

Every important value is labeled using one of three honesty badges.

- `Code-Verified`
  - traced to a design standard or verified code clause
- `Literature-Backed`
  - supported by a paper, thesis, or literature source
- `Derived/Assumed`
  - chosen as a preliminary engineering proportion or pilot assumption

Simple rule:

- green = code/standard basis
- yellow = literature basis
- blue = derived pilot choice

When presenting the dashboard, always mention that these badges are there to prevent over-claiming.

## 3. Recommended First Use

When you first open the dashboard:

1. Leave the defaults as they are.
2. Read the title and the disclaimer badges at the top.
3. Open the `Sources` button in the header and scan the embedded references.
4. Look at the tower drawing in the center.
5. Then move left to the controls and change one thing at a time.

This keeps the app easy to understand.

## 4. Main Layout

The dashboard is easiest to understand in this order:

1. Header
2. Controls panel
3. Tower visualization
4. Comparison presets
5. Geometry table
6. Wind calculator
7. Physics equations
8. Member sizes
9. Export panel
10. Source traceability panel

## 5. Header

The header tells you three things right away:

- what the tool is
- that it is for research visualization only
- that it is meant to be understandable even without a civil engineering background

Use the `Sources` button in the top-right to open the source modal.

The source modal contains the embedded papers, standards, and reference links used in the dashboard.

## 6. Controls Panel

The left sidebar is where you change the tower setup.

### Height

Options:

- `40 m`
- `48 m`
- `50 m`
- `60 m`
- `80 m`

Recommended default:

- `60 m`

Why:

- it is the pilot default for this dashboard
- it is a good mid-height case for discussion

### Number of Panels

Use this slider to control how many stacked tower panels are shown.

Default:

- `10`

Simple meaning:

- more panels = more segmentation of the tower
- fewer panels = simpler tower breakdown

### Bottom Width and Top Width

These control tower taper.

Defaults for the 60 m case:

- bottom width = `6.0 m`
- top width = `1.2 m`

Simple meaning:

- larger bottom width makes the base wider
- smaller top width makes the tower taper more sharply

### Bracing

Options:

- `Double K/K-B`
- `X`
- `K-Down`
- `Mixed K/X`

Use this to change the internal diagonal pattern in the tower panels.

Simple meanings:

- `Double K/K-B`: efficient study-backed default option
- `X`: classic cross-bracing pattern
- `K-Down`: alternate K pattern
- `Mixed K/X`: lower K panels with upper X panels

### Plan

Options:

- `Square`
- `Triangular`

This changes the small plan-view thumbnail and the conceptual tower type shown by the app.

### Appurtenances

Turn this on to show representative platforms and antenna/dish items near the upper tower.

This is useful when explaining that telecom towers are not just bare steel frames.

### Wind Speed

Default:

- `115 mph`

Use this to update the wind calculator and live equation substitution.

### Exposure

Options:

- `B`
- `C`
- `D`

Default:

- `C`

This affects the wind-height factor and pressure results in the wind table.

### Risk Category

Options:

- `I`
- `II`
- `III`
- `IV`

Default:

- `II`

## 7. Tower Visualization

This is the main visual centerpiece of the app.

It shows:

- the tapered tower outline
- panel divisions
- panel numbers
- bracing pattern inside each panel
- dashed hip bracing levels
- representative platforms
- representative dishes and panel antennas when appurtenances are on
- width labels at the base, middle, and top
- a small plan-view thumbnail

How to use it:

- change height and watch the tower stretch
- change bottom and top widths and watch taper change
- switch bracing options and compare internal patterns
- toggle appurtenances to show the telecom loading concept visually

## 8. Comparison Presets

These cards let you jump quickly between preset tower cases.

Included presets:

- `40 m`
- `60 m`
- `80 m`

Use these when you want a fast comparison without manually editing all inputs.

Good meeting use:

- click `40 m`, show the smaller case
- click `60 m`, return to your main case
- click `80 m`, show how the proportions scale up

## 9. Computed Geometry Table

This table breaks the tower into panel-by-panel geometry.

Columns include:

- panel number
- bottom elevation
- top elevation
- width at bottom
- width at top
- bracing type
- source badge

Use this when you want to explain:

- how the taper is being computed
- how each panel is defined
- where the geometry is derived rather than directly copied from one paper

## 10. Wind Calculator

This section gives a live panel-by-panel wind calculation summary.

For each panel it shows:

- midpoint elevation `z`
- height factor `Kz`
- velocity pressure `qz` in `N/m^2`
- velocity pressure `qz` in `lb/ft^2`

This updates automatically when you change:

- height
- exposure
- wind speed

Best way to use it:

- keep the default case
- change only `Exposure` from `C` to `D`
- notice how the table values change

That makes the wind-height idea much easier to explain.

## 11. Physics Equations

This panel shows the main equations used in the app as reference cards.

It includes:

- transition slenderness
- inelastic buckling
- Euler buckling
- velocity pressure
- height factor
- wind force
- drag coefficient
- fragility curve form

How to use this section:

- do not try to explain every equation in detail
- use it as a traceability/reference panel
- point out that the app shows both formula form and source basis

If someone asks for a simple interpretation:

- `Kz` tells how wind effect changes with height
- `qz` is wind pressure at elevation
- buckling equations relate slenderness and steel strength
- the fragility equation is the probability model used later in risk work

## 12. Member Sizes Panel

This panel shows the embedded preliminary member-size table.

It is labeled as literature-backed and scaled for the pilot configuration.

Important talking point:

- these sizes are shown as a preliminary literature-based reference table
- they are not final checked design sizes

If asked what to say:

> These are useful pilot sizes for visualization and discussion, but final use would require proper code checks on slenderness, compression, connection design, and serviceability.

## 13. Export Panel

This section is for taking information out of the dashboard.

Buttons:

- `Download geometry CSV`
- `Copy design summary`
- `Copy advisor explanation`
- `Download physics reference`

What each one is for:

- `Download geometry CSV`
  - gives a panel-by-panel geometry file
- `Copy design summary`
  - gives a plain-language summary of the current setup
- `Copy advisor explanation`
  - gives a ready paragraph explaining how the design logic was chosen
- `Download physics reference`
  - gives a printable equation/reference sheet

## 14. Source Traceability Panel

This is one of the most important sections in the app.

It shows, for each major design parameter:

- parameter name
- current value
- honesty badge
- source name
- clause or page
- short justification
- clickable link

Use this section when someone asks:

- "Where did this value come from?"
- "Is this from code or from literature?"
- "What is assumed versus verified?"

This panel is the main defense against accidental over-claiming.

## 15. Best Workflow for a Professor Meeting

A simple presentation flow is:

1. Start at the header and explain the purpose.
2. Open `Sources` and show that the app is traceable.
3. Show the default `60 m` tower visualization.
4. Point to the left controls and explain which values are editable.
5. Show the geometry table to explain taper and panelization.
6. Show the wind calculator to explain live pressure with height.
7. Use the source traceability panel to separate code, literature, and assumptions.
8. Use the export panel if you want to send a clean summary after the meeting.

## 16. What Not to Claim

Do not say:

- this is a final structural design
- all values come directly from code
- the shown member sizes are fully checked design sizes
- the app replaces formal engineering analysis

Safer wording:

- this is a preliminary research/design-exploration dashboard
- it separates code-verified, literature-backed, and derived values
- it helps organize tower geometry and wind-fragility inputs before deeper structural modeling

## 17. Best One-Sentence Summary

If you need one simple sentence:

> The dashboard is a transparent pilot design explorer for telecom tower geometry and wind-fragility inputs, with every important value clearly labeled as code-verified, literature-backed, or derived.
