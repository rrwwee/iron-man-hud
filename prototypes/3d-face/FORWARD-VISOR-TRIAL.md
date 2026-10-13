# Forward visor — disposable composition and motion trial

Question for #5: can the Face, menu, optic, globe, suit and Panels read as one forward-facing visor, with sufficient framing margin to reach every control?

This supersedes the visual arrangement in `SPHERICAL-HUD-TRIAL.md`. The models remain separate interactive objects in one Three.js scene, sharing one camera and one HUD transform. A shared layout module establishes a single curved visor surface. No heavyweight merged asset or second renderer is required.

Run `python3 -m http.server 4188 --directory prototypes/3d-face`, then visit:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&revision=visor-2

## Changes under comparison

- Camera pulled back from z=0.430 to z=0.550 at 1280×720. It pulls back further for narrower aspect ratios, retaining margins instead of clipping controls. The dark Face-only framing remains.
- `visor-space.js` supplies the shared forward hemisphere. Main menu and content use this depth function; globe, suit and optic are positioned against it. The stronger spherical menu wraps in both axes. Instruments now sit forward of the face rather than beside the temples.
- The optic now inherits the exact same HUD frame as the other instruments. Its axis points outward from the eye region through the visor, correcting the old opposing barrel angle. Segmented rims, stepped rings, chamfered brackets, translucent plates and an amber focus rotor replace the wire cylinder. Clicking still recenters gaze and runs a bounded focus animation.
- Armor explosion moves predominantly along local Z (front/back), with only tiny lateral/vertical separation. It retains the existing single batched draw. Rotate it to inspect the separated shell plates in profile.
- Globe and suit drags record angular velocity. Pointer release produces a damped coast lasting at most 1.1 seconds. Pointer capture keeps the drag consistent when leaving a small target; new grabs stop prior momentum. Reduced-motion mode omits the coast.
- Blink closure now advances a curved upper-lid edge in face coordinates instead of wiping by eye UV direction. Eye and adjacent skin use the same coverage function; complete closure also replaces the bottom rim. Both eyes share timing: roughly 55–65 ms closing, 15 ms closed, and 120–140 ms reopening. Existing geometry and textures remain unchanged.

## Verification

- Main frame at 1280×720: 15 draw calls, 8,067 triangles, 11,420 line segments, 7 points, 518,400 framebuffer pixels. Existing 30 fps cap, no shadows, unchanged Face asset (634,456 bytes / 6,545 triangles), no new downloaded assets.
- Checked 1200×780 (similar aspect to the user's window) and 900×750. All projected main-menu, place, optic, suit and armor-action targets stayed inside the viewport, including the settled maximum gentle turn at 900×750. Camera z was 0.565 and 0.673 respectively. This does not establish a production mobile layout.
- At 1200×780, opened About and pointer-clicked its visible close control at (1030,186). The Panel stayed within the viewport.
- Native globe drag: yaw continued from 3.552 to 3.855 after release, then coast ended. Native suit drag: yaw continued from -1.754 to -2.003, then coast ended.
- Held blink inspected visually; eyes close fully without the leftover open-eye strip. Normal-speed appearance still needs the user's verdict.
- Existing video remains preloaded (readyState 4); opening showed the playing state. No browser warning/error messages in the inspected run.
- JS syntax, whitespace and the unchanged Face budget audit passed. Renderer returns to idle after motion settles, apart from scheduled blinks.

Evidence: `forward-visor-preview.png`, `forward-visor-exploded-preview.png`, `forward-visor-blink-preview.png`.

This remains an unaccepted visual prototype for #5. The user is deciding the composition and interaction; further content/release choices remain #6 and #10.
