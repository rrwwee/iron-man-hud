# Spherical instruments — disposable HUD trial

Question for #5: does a more strongly wrapped main menu, an annular place selector, and a raised optical instrument give the HUD enough depth while keeping controls usable and the Face visible?

This is a visual/interaction comparison against commit `50f8b32`, not an accepted production design. It supersedes the presentation in `VOLUMETRIC-HUD-TRIAL.md`; source asset provenance remains there.

Run `python3 -m http.server 4188 --directory prototypes/3d-face`, then visit:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&revision=optics-2

## What changed

- Main menu: a 32 × 12 spherical grid, with depth varying vertically and horizontally. A smaller curvature radius wraps it more strongly around the Face. Word counts, format subtitles and repeated instructions are removed from the visible graphics. Native semantic labels remain available.
- Places: a tilted 3D annulus around a slightly smaller, lower globe replaces the text stack. Seven sectors show short place names. Hover highlights a sector; click selects and rotates Earth to its pin; clicking the selected sector or globe opens its story. Scrolling cycles places. Bottom labels remain upright.
- Optic: three rings at different depths, tick marks, physical joining struts and an amber rotor sit in front of the eye. The position and orientation follow the actual head transform. Clicking recenters the gaze and runs a short focusing motion. Motion respects the reduced-motion preference; no independent perpetual rendering loop was added. It hides while content is open.
- Armor: the original geometry still uses one batched line draw. Connected islands within mirrored parts get separate displacement vectors, so paired limbs spread apart without stretching their surfaces. Click the suit or Explode/Assemble; drag to rotate. No additional asset or runtime model was introduced.
- More space between instruments; the globe's top is inside the viewport, and the armor action sits below the expanded feet.

## Verification

- Syntax and whitespace checks; unchanged Face budget audit.
- Direct pointer selection of Galway and St Michaels; clicking the selected St Michaels sector opens the matching in-HUD story. Existing keyboard place actions and Escape close work.
- Pointer optic reset returns yaw to zero. Pointer armor explosion and keyboard reassembly/rotation work.
- Video remains cached and automatically plays in the curved content surface (readyState 4).
- Inspected at 1280 × 720: 14 draw calls, 8,051 triangles, 11,476 line segments, 7 points, 518,400 framebuffer pixels. The 30 fps cap and event-driven settling remain. The extra triangles describe the spherical menu and annulus; the Face mesh and suit asset are unchanged.
- Screenshots: `spherical-hud-preview.png`, `spherical-armor-exploded-preview.png`.

## Decision boundary

These changes test shape, hierarchy and interaction, so they fit the current prototype question. Once the user accepts the cinematic direction, target/motion policy and Panel behavior, resolve #5. Additional styling, suit subsystem controls and final content belong in the build specification/tickets rather than an endless prototype. #6 still covers actual content; #10 covers performance, fallback and release requirements. The Wayfinder handoff is to a spec, then implementation tickets.
