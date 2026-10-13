# Icon-led HUD and lower content zone — disposable trial

Question for #5: do persistent spatial instruments, icon navigation and a steady lower reading area make the HUD's placement and behavior coherent?

Run `python3 -m http.server 4188 --directory prototypes/3d-face`, then open:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&revision=icons-3

## Composition and controls

- Kept the globe and armor as persistent instruments, including while text/video is open. The left menu remains the content browser. This is the trial's choice between the user's suggested alternatives, awaiting their verdict.
- The compact eyepiece is now about 27 mm ahead of the source eye surface instead of about 138 mm, with a smaller radius and an axis directed out of that eye region.
- The globe annulus is tangent to the viewing direction from the eye region, angled toward the Face instead of using an arbitrary tilt.
- All place names come from the same `places[].label`: full names on the ring, matching headings in the open details and matching accessible labels. Changing the selected place updates its open details. No added biography facts.
- Map links use the Google Maps search URL with the existing city/campus coordinates.
- Main menu entries use circular vector icons (person, briefcase, play, waveform, document). Their semantic labels and hover titles remain available. The armor has circular rotate-left, explode/assemble and rotate-right controls, with picking priority over the model's broader drag area.
- Armor explosion now uses a continuous depth displacement based on each connected component's Z coordinate. Removing the positive/negative minimum offsets eliminates the large empty center band. No runtime asset change or extra draw is needed.

## Reading behavior

- Expanded content opens across the middle/lower face area; short place details use the same lower zone. Eyes, globe and suit remain visible. Video retains its low opacity and preloaded decoder.
- The reading frame stays steady while content is open. The left menu can still switch content, and the globe can still change places. Closing restores ordinary head/HUD pointer tracking.
- Removed the extra scroll easing. Wheel/trackpad deltas update scroll position directly, scaled to the projected text size and respecting line/page delta modes.
- Cached native text layout once per document rather than measuring every word during every scroll frame. Only visible cached runs are painted. Added a draggable scrollbar with preserved grab position.

## Verification

- Pointer main-menu icon opened About. Another icon replaced an open place Panel without closing first.
- Opened San Francisco, then selected Galway and St Michaels with the globe still visible; heading, selected id and Google Maps coordinates stayed in sync.
- Pointer suit rotate-left changed yaw from -0.55 to -0.95 without exploding; the center icon independently toggled explosion.
- Native wheel scrolling and scrollbar dragging moved through About in both directions; projected Panel targets remained unchanged during scrolling. Thumb dragging reached 187.5 px and reverse wheel scrolling returned toward the start.
- The lower reading surface and close control fit the 1200×780 check, with the globe visible. Temporary viewport override was reset.
- Video opened playing with readyState 4 in the lower zone.
- No inspected browser errors/warnings; JS syntax, whitespace and unchanged Face budget checks passed.
- Baseline scene remains 15 draws / 8,067 triangles / 11,420 line segments / 7 points / 518,400 framebuffer pixels at 1280×720. Open content adds one 64-triangle draw. Existing 30 fps cap remains; the scene settles when idle.

Evidence: `icon-hud-preview.png`, `icon-hud-place-preview.png`, `icon-hud-exploded-preview.png`.

This supersedes the previous trial's placement choices and is still prototype evidence, not a production acceptance or a closed decision.
