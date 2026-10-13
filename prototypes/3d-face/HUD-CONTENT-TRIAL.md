# Content as a curved HUD surface — disposable trial

Question: can expanded video, audio and text wrap around the Face, keep the holographic transparency, and remain usable without another renderer?

Part of [Choose how HUD panels open and coexist with the face](https://github.com/rrwwee/iron-man-hud/issues/5).

## Try it

Run the existing local viewer and open:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&motion=gentle&revision=curved-content-5

- Watch preloads the single 5-second MDN sample when this route initializes. Clicking Watch starts it automatically from the beginning. Closing pauses the same retained video element; reopening reuses its buffered data. Only this one small demo clip is preloaded, not an arbitrary collection of future videos.
- The curved video's HUD controls provide play/pause, seeking and mute. Clicking elsewhere on the video toggles playback. Corresponding native buttons and a seek slider provide keyboard and accessible semantics.
- Listen starts the original audio sample with a live analyser waveform. Clicking the waveform or activating its keyboard button pauses/replays it.
- Notes lays out the authored HTML fixture using the browser, then draws its words, quotation, list and links into the curved surface. The mouse wheel scrolls; clicking the text focuses its native document for keyboard scrolling. Links remain clickable through raycasting to their laid-out bounds.
- Close with the projected × or Escape. Media stops, transient audio and its audio context are released, and the video remains paused and buffered. The Face and HUD continue following the pointer while content is open.

## Actual curvature

`hud-content-surface.js` now renders a 32-segment cylindrical strip (64 triangles) in the existing Three.js scene. It uses the same 0.225 radius and depth profile as `visor-menu-3d.js`, plus that HUD's world transform. Texture UVs follow the curve, including the text, video, controls and waveform. This replaces the flat CSS3D content plane from the previous iteration.

The visible content remains on the right visor wing, leaving most of the Face exposed. Video is drawn at 34% alpha, screen-blended, with feathered edges. Text and controls keep readable contrast without a solid rectangular backing. Expansion still grows from the selected instrument over 280ms. The preview dial hides while expanded content is open.

Pointer events raycast the curved mesh, then map its UV coordinates to the actual controls, text and links. The same mapping drives wheel scrolling. Hovering content does not stop Face motion. Pointer-down captures the intended control while the HUD continues moving.

## Workload

One canvas texture has fixed GPU storage: 704 × 500 RGBA, **1,408,000 bytes (1.34 MiB)**. Shorter video/audio content uses cropped UVs, so switching content does not resize the GPU allocation. The video image updates at 640 × 360 within that texture. There is one retained decoder, no duplicate video elements, no new model download, library or WebGL renderer.

The existing capped 30 fps loop drives active playback and audio. Text is rasterized only on content/scroll/focus changes; geometry updates contain just 66 vertices. When playback stops and movement settles, content does not demand a continuing frame loop. Normal automatic Face blinks remain.

Expanded content adds one mesh but replaces the hidden preview mesh: measured total remains **7 draw calls / 6,739 triangles**, the same as the closed curved menu. Face assets remain **634,456 bytes / 6,545 triangles**. Video decode and texture uploads are additional work; these geometry counters are not a complete performance measurement.

The sample source advertises CORS access and a cache lifetime, and is approximately 1.08 MiB. Browsers can limit preloading or evict buffers under memory/network pressure. We request preload and keep the player alive, rather than promising an instant cold first visit.

## Verification

- Before opening Watch, the player reached readyState 4 with all **5.055 seconds** buffered.
- Opening and reopening started playback without a second Play click. Closing left exactly one paused video, readyState 4 and the same buffered range; transient audio count returned to zero.
- Pointer play/pause, seek and mute worked on the curved controls. A seek while paused stayed paused and reached 2.414 seconds.
- Pointer motion over content changed Face yaw; it did not freeze the scene.
- Notes wheel scrolling reached **348.5 / 349 pixels**. The projected link opened the expected repository, and Home restored the start.
- Video → text → audio → video switching rendered the right content; audio started on open.
- Browser warning/error logs were empty. JS syntax, model-budget and Git whitespace checks passed.

Current captures: `curved-content-video.png`, `curved-content-text.png`, `curved-content-audio.png`.

## Prototype limits

The HTML is a local authored fixture. This rasterizer handles the demonstrated prose elements, not arbitrary embeds/forms/CSS; visible mouse text selection is not implemented. A production content pipeline still needs an explicit content/sanitization boundary. This is the desktop presentation trial; mobile and release budgets remain separate decisions.

Earlier captures (`hud-*-surface.png`, `integrated-*-surface.png`) document the modal-to-flat-projection iterations. They are not the current implementation. The archived MPFB path still uses its legacy modal.
