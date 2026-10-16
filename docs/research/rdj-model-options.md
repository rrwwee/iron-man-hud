# RDJ / Tony model options after the turn test

Research date: 2026-10-12. Question: can an existing free model replace the generic head, or should the likeness be rebuilt from multiple views? Companion audit: `rdj-model-audit.md` (Nathang30).

## Finding

Free downloadable candidates exist. No candidate's actual facial rig has yet been inspected, so none is a verified replacement. The best advertised technical fit has licensing restrictions for this particular WebGL delivery. A paid sculpt is not automatically an animated face, and a marketplace rendering is not a performance or likeness test.

## Candidates

### Mangorit: Not Robert Downey Jr Low-poly Game-ready

[Primary listing](https://www.turbosquid.com/3d-models/3d-not-robert-downey-jr-lowpoly-gameready-2119042).

The listing currently says **Free**, 36,578 polygons (quads, not a triangle count), Blender 3.4 / FBX / OBJ, and diffuse/normal/roughness maps at 1024, 2048 and 4096. The seller explicitly advertises a skeleton and facial rig. The public preview shows a textured bald head from front, three-quarter and side views. My visual assessment: a more coherent shape candidate than our current generic head plus eye overlays, but it still needs a likeness comparison.

The Download link was tested in the browser and opened the TurboSquid login page. No file was downloaded, no account created, and rig controls/export compatibility are unverified.

**Delivery limitation:** the item is marked Editorial Uses Only. [TurboSquid's license](https://www.turbosquid.com/licensing) restricts editorial uses and prohibits open-format model delivery; its WebGL provisions require approval for other qualifying formats outside the named engine exports. An ordinary downloadable GLB in our Three.js prototype is not an established permitted shipping path. Keep this a conditional candidate requiring clarification, not a cleared web asset. No contact was sent to the seller or platform.

### KwonTony: Robert Downey JR

[Primary listing](https://sketchfab.com/3d-models/robert-downey-jr-003ed1690601450ba525f33dee7977c4).

Listed downloadable under CC Attribution, with about 7,900 triangles and 4,000 vertices. The author describes it as a textured student character based on RDJ, with hair still needing improvement. This is a low-cost geometry candidate, not evidence of high-fidelity likeness or a facial rig. Neither the archive nor the actual controls were inspected. Attribution is required; the uploader's asset license is not a separate clearance from the depicted person or character rights holders.

### Paid references, not purchase recommendations

[Eduardo Ruiz Urrejola's Tony bust](https://www.artstation.com/marketplace/p/e889/robert-downey-jr-tony-stark-iron-man) lists $15, ZTL source with separate hair/eyes/beard/suit and FBX/OBJ/print formats. It does not establish a ready facial rig. [Meta Avatars' rigged character](https://www.artstation.com/marketplace/p/Jpldg/robert-downey-jr-hyper-realistic-full-body-rigged-character) lists $49, separate head files and an advertised facial rig. These are seller claims; neither was acquired or validated. Spending is not justified before the free candidates are tested.

## Recommended evaluation

1. Obtain the license-compatible free candidate through its normal download flow; inspect mesh topology, separate eyes, texture UVs, skeleton and nonempty blink/expression deformations.
2. Before shading, compare its **untextured** head at front, 30°, 60° and profile with the intended film-era face. A frontal photograph should not conceal the shape test.
3. Only if it passes, isolate the visible head, reduce maps/geometry, and test in our lighting with the existing renderer budget. Do not equate the marketplace's complete-body polygon count with the final cropped head cost.

## If we author the likeness

Use consistent film-era frontal, both three-quarter and both profile references, with relaxed expression and similar camera perspective. Fit skull width, orbital depth, nose projection, cheek/jaw contour and chin depth before adding photographic detail. Build the eyelids and seated eyes as a coherent anatomical unit, then verify neutral, blink and smirk in a plain clay material. Use a true wrapped UV texture once the shape works; remove the forward photographic eye plates. This is a proposed workflow, not completed modeling work.

An additional visual reference is [Frank Tzeng and Yibing Jiang's RDJ portrait](https://frank_tzeng.artstation.com/projects/B3bO9), whose author shows lighting and clay studies. That portfolio is reference material, not a downloadable or licensed model source for this project.

The current HUD and model files are unchanged by this research. The decision remains open.
