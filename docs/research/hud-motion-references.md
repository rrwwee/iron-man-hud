# Cinematic HUD motion references

Researched 2026-10-12 for the functional personal-site HUD decision. This note separates evidence from proposed browser behaviour. No film media was downloaded or added to the repository.

## What the primary evidence establishes

Cantina Creative's Stephen Lawes says Robert Downey Jr.'s head movements were tracked and used to shape the graphics' movement. The production used a stereo rig and graphics in three-dimensional space, including miniature suits and holographic helmets. This supports tying some HUD motion to the Face; it does **not** specify a universal percentage, pixel offset, or one rigid transform for the entire HUD. [Maxon interview, Spanish edition, paragraphs on head tracking and stereo workflow](https://www.maxon.net/es/article/cantina-creative-gives-iron-man-3-a-heads-up-with-maxon-cinema-4d).

## Playable references

All three embedded reels below loaded and played in the browser without an account. Timestamps are approximate player times verified by seeking and viewing frames, not timecodes from the original films. Playback was sampled, not exhaustively analysed frame by frame; no head/HUD motion ratio was measured.

| Reference | Useful place to start | What was actually visible | Use for this project |
| --- | --- | --- | --- |
| **Iron Man 3 — John Likens/Cantina HUD + GFX Process Reel**, 2:33. [Studio page](https://www.cantinacreative.com/film/iron-man-3), [direct video](https://vimeo.com/66944464) | **0:14** suit assembly; **0:40** external HUD volume; **1:10** composed Face/HUD shot | A wireframe-like miniature suit assembles; an isolated helmet-shaped display volume is shown; the composed shot has curved lower shelving, a ring near the eye, peripheral readouts, and a small suit on the right. | Strongest overall reference. The miniature suit can be a purposeful status/content indicator. The lower shelf and side instruments give depth while leaving the central Face readable. |
| **Avengers: Age of Ultron — Cantina GFX Reel**, 2:24. [Studio page](https://www.cantinacreative.com/film/avengers-age-ultron), [direct video](https://vimeo.com/148401465) | **0:00** composed Face shot; **0:19** isolated circular instrument; **0:30** isolated curved HUD surface | The opening places a large circular instrument left of the Face and a separate holographic object right of it. The breakdown reveals distinct curved/volumetric elements rather than one flat overlay. | Compare density, peripheral balance, depth and layered movement. The opening is brief; it is not enough by itself to quantify tracking. |
| **Captain America: Civil War — Cantina GFX Reel**, 0:52. [Studio page](https://www.cantinacreative.com/film/civil-war), [direct video](https://vimeo.com/203626314) | **0:11** angled radial/hexagonal selector | Three labelled choices—flight, vitals and weapons—sit inside nested amber polygonal rings, with a soft holographic suit figure nearby. | Especially relevant to the user's functional radial-menu idea: readable categories and a clear selected region can be integrated into cinematic graphics. This sample primarily establishes menu composition, not a measured head-follow rule. |

The first reel is uploaded by its credited artist John Likens; the other two are uploaded by Cantina. The studio project pages identify their HUD work and credit the artists. Likens describes the Iron Man 3 reel as a development/process montage and confirms that the miniature suit and helmet had real 3D depth. [Artist's description](https://vimeo.com/66944464).

## Recommended prototype behaviour — design proposal, not film facts

Use three conceptual layers:

1. **Main radial menu:** a stable peripheral home with mild movement alongside the Face. The choices must remain easy to point at and read. Scrolling rotates/selects menu entries, not the whole website.
2. **Small instruments and suit schematic:** stronger parallax/rotation can sell the helmet illusion without making primary targets wander. A simple SVG suit outline is enough for the first test; no full 3D suit asset is required.
3. **Open Panel:** stop tracking while the visitor reads, watches a video or operates audio controls. Retain a subdued HUD surround and a clear way back to the menu.

The current comparison values—**fixed 0 px, subtle 16 px, stronger 42 px horizontal travel at a full head turn**—are reasonable test settings, not estimates of the movie rig. Start on subtle. Ask the user to compare stronger movement while looking around, then test whether the same effect becomes annoying when aiming at a menu item. Reducing/fixing movement during hover, focus or open content is a usability decision we can test independently.

For performance, transform already-drawn SVG/HTML/canvas layers using the existing Face update loop. Avoid rebuilding the graphics each frame. Stop the animation at rest and respect reduced-motion preferences. The visual references justify layered depth; they do not require another continuously rendered 3D scene.

## Limits and next decision

No reliable single cinematic follow ratio was established. Shots mix camera movement, tracked head motion, independent instrument animation and edits, so a browser-wide gain cannot be read directly from a few screenshots. The next useful decision is which of the three motion strengths feels cinematic **and** leaves the functional menu comfortable to use. Content categories can remain placeholders until that interaction is settled.
