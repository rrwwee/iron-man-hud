# Distinct HUD instruments — disposable trial

Question: can each visible HUD instrument have a different purpose, with responsive animation instead of several menus browsing the same content?

Part of HUD decision #5 and content/payoff decision #6. This remains the existing prototype branch, not a production site.

Run `python3 -m http.server 4188 --directory prototypes/3d-face` from the repo root, then open:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&motion=gentle&revision=purpose-3

## Roles

- **Left radial:** the sole visible content index. Scroll or use Up/Down to choose; click to open. Selection glides into position over 300 ms, with a brief moving arc. Hit testing follows the animated label positions.
- **Upper right:** a rotatable globe with a manually placed San Francisco pin. Drag to rotate, wheel to zoom, click the globe or city label to return to SF. The map action opens OpenStreetMap centered on SF. The displayed clock uses the browser's America/Los_Angeles time zone and refreshes once per minute.
- **Lower right:** actual display settings. Sound mutes the current/future media; Motion switches the existing gentle/wide range; Lighting switches the existing cinematic/inspection lighting. These are not additional content menus. Their hidden native button counterparts expose the same states for keyboard/accessibility.
- **Expanded content:** retains the curved, translucent surface and cached autoplay video. Wheel-driven text scrolling now eases over 180 ms. No hover-based Face freeze is introduced.

The former preview dial, repeated section shortcuts and media-type browser are removed from the visible spatial HUD. Their old implementations remain only where needed for the flat comparison path.

## Globe source and cost

`assets/globe-land.json` is **38,652 bytes**, with 2,592 simplified outline points in 102 rings. Source: Natural Earth 1:110m land, [official project data](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson), fetched 2026-10-12. Every second point is retained and coordinates rounded to two decimals. Natural Earth [places its data in the public domain](https://www.naturalearthdata.com/about/terms-of-use/). No map tiles, account, GPS permission or location service is used.

The sphere is projected mathematically into the existing right HUD canvas, which is itself rendered on the curved 3D surface. It uses no second renderer or WebGL context. Repainting is triggered by dragging, zooming, return-to-SF animation, data arrival or the minute clock. It does not rotate forever at idle.

The HUD texture allocation and baseline scene geometry stay unchanged: 7 draw calls, 6,739 triangles, 460,800 framebuffer pixels at the tested 1280 × 720 desktop viewport. New animation shares the existing 30 fps loop and settles to idle. Reduced-motion preferences skip the selection/globe settling animations and text-scroll interpolation.

## Suit status and proposed role

The free [Mark 7 armor by 2iemniak](https://blendswap.com/blend/6708) still has a [normal account-gated download](https://blendswap.com/blend/6708/download). The current browser is signed out; no full-suit file exists in the repo. Do not reintroduce the rejected drawing or ship an unattributed mesh. Asset acquisition/audit stays under #9.

Next trial once the source is available: replace the lower-right settings instrument with selectable suit regions. A helmet region could control expression, chest region lighting and legs region motion; keep labels/focus clear. This would replace existing controls rather than add another navigation menu. It is a proposal, not an accepted final mapping.

## Verification

- Scroll changes the content selection and reports an active transition, then settles.
- Globe drag changes its yaw/pitch; wheel changes its zoom without changing content selection; SF recenter works. The map action opened the expected SF-centered OpenStreetMap URL.
- Sound changes the retained video's mute state and autoplay still starts while muted.
- Motion and lighting change the actual existing Face settings, not mock readouts.
- The duplicate preview button is hidden in spatial mode.
- Text reaches the existing scroll boundary with interpolation, and the Face keeps moving.
- After interaction settled, the renderer reported `active=false` and menu animation `false`; the scene stayed at 7 draw calls / 6,739 triangles.
- Browser warnings/errors, syntax, Face budget and whitespace checks pass.

Capture: `purpose-hud-preview.png`. The existing content still contains placeholder portfolio material; this trial does not decide the final personal-site content.
