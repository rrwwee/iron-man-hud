# Radial personal-site navigation — disposable trial

Part of [Choose how HUD panels open and coexist with the face](https://github.com/rrwwee/iron-man-hud/issues/5). The user clarified that the HUD is the functional navigation for a personal website, including mixed text, video, audio and external links. Final content is still undecided.

## Try it

Run the same local server described in the README, then open:

http://127.0.0.1:4188/?variant=visor&mode=menu

- Scroll over the left radial menu, or focus it and use up/down. Click an entry to open it.
- Text and video open in a central Panel. Close with × or Escape; keyboard focus returns to that menu item. Media is paused and removed when its Panel closes.
- Audio opens in a smaller player and leaves navigation usable. It does not play automatically. This trial uses a 1.1-second, original synthesized tone (`assets/menu-audio-sample.wav`, CC0).
- Source code opens this repository in another tab. It is a real external destination; the other entries are explicitly sample content.
- The video is MDN's [HTML video element example](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video), streamed only when played. It is a placeholder for the user's own video and is not downloaded into the repository.
- Click the corner suit schematic to turn its SVG view. It is an original small line drawing, not another 3D model.
- **HUD follow** offers Fixed, Subtle and Stronger. The menu shifts less than the surrounding instruments; the suit shifts less again. The eye ring follows a projected point on the Face, with a variable blend toward its resting position. A central Panel makes the controls stationary and brings the Face back to center. Reduced-motion preferences default tracking to Fixed.
- **Visuals only** returns to the previous A/B/C graphic comparison without reloading the Face. The mode is recorded in the URL.

## Reference-based proposal

See [the motion research](../../docs/research/hud-motion-references.md). Original studio reels show distinct HUD layers, miniature suits and a radial selector. The creator interview confirms tracked head motion, but no single numerical follow ratio was found.

The trial therefore compares deliberately chosen values, not measurements of the films. At a full turn, Subtle moves the instrument plane 16 CSS pixels, the menu 8 and the suit 3; Stronger multiplies these by 2.6. Eye-ring tracking blends 45% toward the projected point in Subtle and fully in Stronger. Fixed uses the resting screen positions. This lets the user judge depth and legibility separately from accuracy to a single movie shot.

All continuous updates reuse the existing Face render loop. Canvas artwork is still cached; only CSS transforms and the tiny SVG reticle position change during a turn. At rest there is no added render timer. The Face assets and three WebGL draw calls are unchanged. Final media is loaded on demand, not with the page.

## Still open

The radial navigation, graphics, tracking strength, opening animation and content categories are proposals. No final interaction choice, site biography, project list or content plan has been accepted. The readable central Panel is a starting point for a more cinematic expansion treatment. This is still a local noncommercial prototype using the attributed Nathang30 Face.

## Verification

Browser checks cover mouse-wheel and up/down browsing, central text/video Panels, compact audio playback, close/Escape with focus restoration, visual-mode switching, suit interaction and stronger layered following. The sample video reached ready state 4 and played to 4.91 seconds of its 5.05-second duration; the original audio sample played through the lightweight custom controls. No media autoplays, and closing a Panel removes its player. With a central Panel open, HUD tracking is zeroed and automatic Face blinks are suspended until it closes.

At the normal 1280×720 viewport, the Face still reports 6,545 triangles, three WebGL draw calls and 460,800 framebuffer pixels. The HUD bitmap stays at 460,800 pixels and is not rerasterized for each head movement. The local 35,244-byte audio sample is loaded on demand. Syntax, model budget and Git whitespace checks pass; screenshots capture the current menu and text Panel. These are workload and behavior checks, not a measured FPS guarantee for the user's computer.

With automatic blinks disabled, two separated observations retained Face frame 20, HUD draw count 3 and motion update count 1. The three idle counters stayed unchanged. The browser reported no warnings or errors. `navigation-preview.png` and `navigation-panel-preview.png` preserve the reviewed composition and text Panel.
