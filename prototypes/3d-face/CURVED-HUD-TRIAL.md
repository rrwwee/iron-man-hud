# Curved HUD — disposable depth and interaction trial

Content opening is superseded by the [HUD content surface trial](HUD-CONTENT-TRIAL.md); the modal descriptions below record the preceding experiment.

Question: does a lightweight visor in the Face's 3D scene feel more like the film references while remaining comfortable to point at and click?

Part of [Choose how HUD panels open and coexist with the face](https://github.com/rrwwee/iron-man-hud/issues/5). Visual acceptance remains open.

## Run and compare

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory prototypes/3d-face
```

Open http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved

- **Compare flat HUD** switches to the preceding SVG treatment on the same route. `hudSpace=flat` links directly to it.
- Move over the Face to turn it. The curved menu and preview follow its yaw and pitch. The Subtle setting follows 45% of the Face rotation; Stronger follows 100%; Fixed leaves the visor at rest. These are trial choices, not measured movie ratios.
- Hover a sector: it brightens while the Face and HUD continue following the pointer. Clicking opens that section. The pressed target is retained through small HUD motion until release; dragging does not activate it.
- Scroll over an instrument to cycle through the six sample entries. The right instrument previews and opens the selection. Its rim and the inner left ring select entries directly. The lower-right channel dial selects the next entry of a format; repeat Text to cycle its three entries.
- Keyboard navigation uses the same underlying menu controls. Up/down browse; Tab focuses a sector or preview; Enter/Space opens it. The corresponding 3D sector shows focus. Escape closes a Panel and restores focus.
- H opens Face controls. Ordinary pointer turns default to ±17.5° yaw and ±4.6° pitch. In H controls, Pointer turns switches between Gentle and the earlier ±35° Wide comparison. Turn left/right still holds a ±35° inspection view; Center restores front view. The eye reticle also centers the Face.

## Reference interpretation

The user supplied these animated sources:

- [Blue HUD close-up](https://64.media.tumblr.com/7d65faa1dc45a22f360ccfbae8ae2754/tumblr_n63ohupwKl1qzfxm5o3_500.gifv)
- [Profile-to-front spatial view](https://64.media.tumblr.com/cd5fdf346c6f6991c839f81fcf23739f/tumblr_n63ohupwKl1qzfxm5o1_500.gif)
- [Soft cyan visor close-up](https://i.pinimg.com/originals/2a/d1/af/2ad1afe7652ec941aaca926362f82243.gif)

The browser showed animated frames in all three. The interpretation here is thin, luminous surfaces at different positions around the Face, with strong perspective changes as the viewpoint/head relationship changes. The reference does not establish a numerical tracking ratio. No movie imagery is bundled into the app.

## Construction and budget

`visor-menu-3d.js` creates three cylindrical surface strips, with 32 horizontal segments each. Canvas textures contain the navigation, selected-item preview and format browser, with glow baked only when interaction changes. The material is unlit, transparent and single-pass; geometry and raycast hit areas share the same curved surfaces. Ray hits are mapped from mesh UV coordinates to the sector/preview actions. Existing semantic controls and content Panels are reused.

The Face still uses the accepted geometry, textures, lights and blink/expression controls. A tiny full-screen black vignette is rendered after the Face and before the visor, replacing the CSS darkening in curved mode so edge graphics remain luminous. Flat mode uses its previous CSS vignette.

Measured at the normal 1280×720 viewport:

| Workload | Prior Face | Curved scene total |
| --- | ---: | ---: |
| WebGL draw calls | 3 | 7 |
| Triangles | 6,545 | 6,739 |
| Framebuffer pixels | 460,800 | 460,800 |

The three HUD textures occupy 3,014,656 bytes (2.875 MiB) before driver overhead, without mipmaps. No new renderer, external runtime asset, font, shadow or postprocessing blur pass is added. The existing 30 fps motion cap and hidden-tab pause remain. Hover changes and selections update the textures. Head movement transforms geometry; raycasting refreshes the current hover as a moving control passes under a stationary pointer. Textures are not repainted when the hit target stays the same. No extra animation timer or RAF is used. These are workload measurements, not an FPS guarantee on the user's computer.

## Browser checks

- Native pointer click opened About from the curved sector at rest and at the right-turn extreme.
- Native pointer hover highlights controls without freezing the pose. Video remained hovered while measured head yaw advanced from 26.5° to 28.5°. Dragging does not activate content.
- Mouse-wheel browsing worked at the left-turn extreme; clicking the projected preview there opened Selected work.
- Keyboard down/Enter opened the Video Panel, and Escape restored navigation.
- Both wide turns retained usable projected hit positions. The far instrument becomes narrower, as expected; legibility at the maximum angle is a user judgment still to make.
- Flat/curved switching remains available. The preceding two-surface revision measured three/six draw calls; this richer three-surface revision measures three/seven.
- With auto-blink off, separated idle observations in the rich revision retained frame 99 and texture-paint count 14. Browser warnings/errors were empty.
- Model budget audit, JavaScript syntax and Git whitespace checks pass.

The suit inset remains separate, awaiting the real free mesh identified in [the source research](../../docs/research/free-suit-wireframe-assets.md). This pass does not reintroduce a drawn substitute.

## Richer graphics revision

The user asked for more visual density with every instrument useful, and rejected the previous hover freeze. The new third curved surface is a format browser. Its ring displays the real distribution of the six entries (three Text, one Video, one Audio and one link). Each channel selects/cycles matching entries; its label and ring segment are clickable.

The main dial shows a short text excerpt, a video action, a link destination, or the peak envelope of the actual sample WAV, according to the selected entry. The waveform was extracted offline from `assets/menu-audio-sample.wav`; it is not simulated activity. Metadata connected to each left-hand sector reports its actual word count, media duration or destination. The two index rings provide direct access to all six entries, including the one outside the five-item radial viewport. Keyboard-accessible preview and format controls mirror these targets.

Removed both mechanisms that stopped head movement on hover: the `isHovering` pointer guard and the `hud-hover` handler that set target pose to the current pose. The 3D hit test now runs on pose updates as well as pointer events. A click uses the item captured at pointer-down if the pointer stays within twelve pixels and releases within 1,200 ms, preserving a click while geometry moves under it. Content Panels still retain their existing behavior.

Browser checks in this revision covered native Video/Audio channel selection, audio playback, rim selection without opening a Panel, and keyboard Notes preview. On the narrow active app viewport the scene reported seven draw calls and 6,739 triangles. At 1280×720 the same revision reported seven draw calls, 6,739 triangles and 460,800 framebuffer pixels. `rich-hud-preview.png` records the centered composition. Browser warnings/errors were empty; syntax, the Face budget audit and whitespace checks passed.

## Targeting decision trial

The user found continuous movement hard to click. Default pointer yaw is halved (±17.5°), pitch is reduced, the Subtle HUD rotation follows at 45%, and all three surfaces move inward. No hover freeze or extra animation loop is added. The wider pointer range remains available in H controls and through `motion=wide`; default/shareable targeting mode is `motion=gentle`. The large inspection buttons and replay still test ±35° geometry.

The choice is a usability proposal informed by the close-up GIFs; no exact cinematic angle or universal follow ratio is claimed. Browser checks confirmed a 900 ms held click activated the pressed item while the view moved, format selection still worked, and the hovered Video channel remained active while yaw advanced from 8.2° to 13.1°. The scene still reports seven draw calls, 6,739 triangles and 460,800 framebuffer pixels at 1280×720. Both pointer-range options switch without reloading.
