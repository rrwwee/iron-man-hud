# Content as a HUD surface — disposable trial

Question: can text and media open as projected HUD content instead of a separate modal window, while retaining normal playback and scrolling?

Part of [Choose how HUD panels open and coexist with the face](https://github.com/rrwwee/iron-man-hud/issues/5).

## Try it

Run the existing local viewer and open:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&motion=gentle&revision=integrated-5

- Click Watch: only the embedded video and a HUD close control appear. Native video controls handle playback, seeking and volume. The same MDN sample is used; the user's video is still to be chosen.
- Click Listen: the audio begins on the triggering click. Its waveform reflects live time-domain samples from a Web Audio analyser. Click the waveform or press Space/Enter to pause/replay; left/right keys seek. There is no explanatory card or caption.
- Open Notes: the local HTML fixture demonstrates headings, paragraphs, a quotation, list, link and native scrolling. This is sample content, not a settled personal-site content plan.
- Close with the HUD × or Escape. Audio/video pause and are removed; the audio context closes. Opening another item also cleans up the previous player.
- Other menu controls stay usable. No full-screen backdrop, modal focus trap or automatic centering/freezing of the Face is applied to this content surface.

## 3D presentation

`hud-content-surface.js` uses the exact camera projection and world matrix of `visor-menu-3d.js`. A native DOM plane grows from the selected instrument to its content position over 280ms. Its CSS `matrix3d` is computed from the camera/viewport transform, including perspective division, so it rotates and moves with the HUD. The browser handles hit testing and scrolling on that transformed plane.

This is a CSS3D content plane, not a video texture or another WebGL mesh. That choice retains native video controls, selectable/scrollable HTML and keyboard accessibility without rasterizing text or adding a second renderer. The original preview instrument hides while its content is expanded and returns when closed.

The older two-dimensional modal remains only for the archived MPFB comparison path; the current Nathang30/3D route uses this surface.

## Workload and checks

No new model, font, library or continuous background animation loop is added. The existing bounded Face loop handles the brief expansion/collapse and the live audio waveform. Native video playback and HTML scrolling use browser composition. Static open text does not require continual Face rendering. The right preview mesh hides while content is expanded, reducing measured WebGL work from seven draw calls / 6,739 triangles to six / 6,675; the native media/compositing work is additional and is not represented by those WebGL counters.

Browser checks verified:

- Video plays with native controls; it reached ready state 4.
- Audio starts without a second Play click and produces a waveform while playing.
- Replacing and closing media leaves no old audio/video elements in the content surface.
- Notes scrolls natively (scrollTop 349, scrollHeight 849, clientHeight 460 in the tested layout).
- A ±35° inspection turn changes the content's projected transform while it remains open; there is no modal backdrop.
- Syntax, Face asset budget and Git whitespace checks pass.

The HTML fixture is locally authored. A later production implementation must define its content source and sanitization boundary; this prototype does not accept arbitrary remote HTML.

With auto-blink temporarily disabled, two separated observations of the settled open Notes surface stayed at Face frame 10 with `active=false`; normal auto-blink was restored afterward. Browser warnings/errors were empty. Screenshots: `hud-video-surface.png`, `hud-audio-surface.png`, `hud-text-surface.png`.


## Integrated projection revision

The central opaque card has been replaced with smaller surfaces on the right visor wing, tilted 0.22 radians into the surrounding instruments. At the centered desktop view the video occupies approximately 423 × 265 screen pixels, versus roughly 745 × 420 previously. The nose, mouth and most of both eyes remain visible. Audio now sits above the format shortcuts rather than crossing their targets.

Video pixels are 34% opaque, screen-blended, and feathered at the edges. There is no solid backing or continuous rectangle around the media. Text keeps a fading local scrim for readability; short open registration marks and a circular close glyph retain the HUD vocabulary. Native video controls also inherit the translucency. The close glyph has an invisible projected hit area of about 55 × 63 pixels at the centered desktop view.

Verified this revision in the browser: video playback reaches ready state 4; pointer clicking the close control succeeds even as the head turns toward it; Notes scrolls to 308.5 of 309 available pixels; a pointer turn changes the open content transform and HUD yaw without closing or freezing it; audio begins playing on open. Closing/replacing content retains the existing cleanup behavior. JS syntax, model-budget and whitespace checks pass.

The change adds CSS compositing (edge masks and screen blend), not a new model, renderer, texture download or render loop. This is a desktop visual trial, not a measured cross-device performance guarantee. Current captures: `integrated-video-surface.png`, `integrated-text-surface.png`, `integrated-audio-surface.png`.
