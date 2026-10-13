# Curved HUD — disposable depth and interaction trial

Question: does a lightweight visor in the Face's 3D scene feel more like the film references while remaining comfortable to point at and click?

Part of [Choose how HUD panels open and coexist with the face](https://github.com/rrwwee/iron-man-hud/issues/5). Visual acceptance remains open.

## Run and compare

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory prototypes/3d-face
```

Open http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved

- **Compare flat HUD** switches to the preceding SVG treatment on the same route. `hudSpace=flat` links directly to it.
- Move over the Face to turn it. The curved menu and preview follow its yaw and pitch. The Subtle setting follows 65% of the Face rotation; Stronger follows 100%; Fixed leaves the visor at rest. These are trial choices, not measured movie ratios.
- Hover a sector: it brightens and the Face stops chasing the pointer. Clicking opens that section. Dragging does not activate it.
- Scroll over either instrument to cycle through the six sample entries. The right instrument previews and opens the selection.
- Keyboard navigation uses the same underlying menu controls. Up/down browse; Tab focuses a sector or preview; Enter/Space opens it. The corresponding 3D sector shows focus. Escape closes a Panel and restores focus.
- H opens Face controls. Turn left/right holds a ±35° view; Center restores front view. The eye reticle also centers the Face.

## Reference interpretation

The user supplied these animated sources:

- [Blue HUD close-up](https://64.media.tumblr.com/7d65faa1dc45a22f360ccfbae8ae2754/tumblr_n63ohupwKl1qzfxm5o3_500.gifv)
- [Profile-to-front spatial view](https://64.media.tumblr.com/cd5fdf346c6f6991c839f81fcf23739f/tumblr_n63ohupwKl1qzfxm5o1_500.gif)
- [Soft cyan visor close-up](https://i.pinimg.com/originals/2a/d1/af/2ad1afe7652ec941aaca926362f82243.gif)

The browser showed animated frames in all three. The interpretation here is thin, luminous surfaces at different positions around the Face, with strong perspective changes as the viewpoint/head relationship changes. The reference does not establish a numerical tracking ratio. No movie imagery is bundled into the app.

## Construction and budget

`visor-menu-3d.js` creates two cylindrical surface strips, with 32 horizontal segments each. Canvas textures contain the actual navigation and selected-item preview, with glow baked only when interaction changes. The material is unlit, transparent and single-pass; geometry and raycast hit areas share the same curved surfaces. Ray hits are mapped from mesh UV coordinates to the sector/preview actions. Existing semantic controls and content Panels are reused.

The Face still uses the accepted geometry, textures, lights and blink/expression controls. A tiny full-screen black vignette is rendered after the Face and before the visor, replacing the CSS darkening in curved mode so edge graphics remain luminous. Flat mode uses its previous CSS vignette.

Measured at the normal 1280×720 viewport:

| Workload | Prior Face | Curved scene total |
| --- | ---: | ---: |
| WebGL draw calls | 3 | 6 |
| Triangles | 6,545 | 6,675 |
| Framebuffer pixels | 460,800 | 460,800 |

The two HUD textures occupy 2,359,296 bytes (2.25 MiB) before driver overhead, without mipmaps. No new renderer, external runtime asset, font, shadow or postprocessing blur pass is added. The existing 30 fps motion cap and hidden-tab pause remain. A hover/selection updates the textures; head movement transforms geometry without repainting them. No extra animation timer or RAF is used. These are workload measurements, not an FPS guarantee on the user's computer.

## Browser checks

- Native pointer click opened About from the curved sector at rest and at the right-turn extreme.
- Native pointer hover highlighted a sector, held the pose and did not open content; dragging did not activate it.
- Mouse-wheel browsing worked at the left-turn extreme; clicking the projected preview there opened Selected work.
- Keyboard down/Enter opened the Video Panel, and Escape restored navigation.
- Both wide turns retained usable projected hit positions. The far instrument becomes narrower, as expected; legibility at the maximum angle is a user judgment still to make.
- Flat/curved switching returned the scene to three/six draw calls respectively.
- With auto-blink off, separated idle observations retained frame 160 and texture-paint count 24. Browser warnings/errors were empty.
- Model budget audit, JavaScript syntax and Git whitespace checks pass.

The suit inset remains separate, awaiting the real free mesh identified in [the source research](../../docs/research/free-suit-wireframe-assets.md). This pass does not reintroduce a drawn substitute.
