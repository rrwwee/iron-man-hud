# HUD graphic treatment comparison — disposable

Decision: [Choose how HUD panels open and coexist with the face](https://github.com/rrwwee/iron-man-hud/issues/5).

Three structurally different HUD compositions on the existing face route, selected with `?variant=visor`, `?variant=targeting` or `?variant=diagnostic`. Keep the accepted face, its camera and its lighting fixed. First judge the graphic language; panel interactions are a later step in the same decision.

## Design plan

- **Visor projection:** layered, oblique circular instruments enter from both edges; amber optics on the left, an ice-blue spatial display on the right. Small readouts overlap the cheeks, with the central eyes/nose left clear.
- **Targeting:** deliberate negative space, segmented angular brackets and one ocular reticle; clear white/ice geometry with a few amber alignment marks. Strong hierarchy rather than two large circles.
- **Diagnostic:** horizontal instrument banks, stacked signal traces, a wireframe suit component and a low panoramic scale. Warm coral/amber readouts crossed by fine teal measurement lines.

Palette: black glass `#000000`, ice `#a9edf5`, cyan `#53c8df`, warm amber `#ffb668`, coral `#fa795c`, near-white `#e9f8f4`. Local Arial Narrow/Helvetica Neue for compressed instrument text, monospace only for measured values. The all-capital abbreviations and tiny type are intentionally diegetic movie graphics; the separate comparison controls use legible sentence case.

The three layouts differ in composition and hierarchy, not merely tint. Avoid conventional cards, application navigation and a generic two-ring dashboard. Keep the face as the visual anchor and use the frame edges as the instrument plane. No external fonts, images, 3D assets or dependencies.

## Run

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory prototypes/3d-face
```

Open http://127.0.0.1:4188/?variant=visor. The bottom comparison controls and left/right keys switch treatments without reloading the face. H opens existing face controls. Comparison controls are available on loopback hosts (or explicitly with `?trial=1`); the entire directory remains a throwaway prototype outside production.

The HUD is one capped 2D canvas, drawn on selection, resize or expression change. It has no continuous animation loop. The face retains its existing framebuffer cap, three draw calls and idle pause. A brief CSS reveal is the only new animation and respects reduced-motion preferences.

## Verification

At the normal 1280×720 browser size, both the face and HUD canvases use 460,800 pixels. The face still reports 6,545 triangles and three WebGL draw calls; its 634,456-byte asset budget is unchanged. The two new HUD modules total 14,344 bytes before compression, with no downloaded art, fonts or dependencies. Stroke glow is rasterized into the cached canvas rather than added as a per-frame effect.

All three variants were inspected in the browser and captured in `hud-visor-preview.png`, `hud-targeting-preview.png` and `hud-diagnostic-preview.png`. Button switching and keyboard wraparound update the URL and selected labels without reloading the model. With automatic blinks disabled, two settled observations retained face frame 5 and HUD draw count 4. Browser warnings/errors were empty. JavaScript syntax, the existing model-budget audit and Git whitespace checks pass. These measurements bound the work; they are not device-specific FPS measurements.

The design decision remains open. No visual treatment is accepted yet, and this pass does not implement panel interactions.
