# Existing projects closest to the Iron Man HUD vision

Research for [Find existing projects closest to the Iron Man HUD vision](https://github.com/rrwwee/iron-man-hud/issues/2), checked October 11, 2026 (Los Angeles).

## Finding

I did not verify an existing project combining all four defining elements: a cinematic Tony Stark face inside the helmet, substantial pointer-driven head turns, animated HUD panels that keep content on site, and enough playful content to explore. This is a bounded search finding, not proof that nobody has built it. Strong precedents exist for each piece separately. The most useful browsing sequence is **Little Guy → Tony Stark portfolio → Devini Iron Man → FacePoke → Bruno Simon**.

Evidence below distinguishes **observed** browser behavior, **source inspected** implementation, and **creator claim**. A reachable page or README is not a verified working interactive demo. Ratings are my comparison with our brief, not the creators’ claims. “Absent” means absent from the inspected evidence, not an exhaustive code audit.

## Closest pieces to browse first

### 1. Little Guy — closest to the footage-angle idea

[Open demo](https://www.angelosgiovanis.com/experimental/little_guy.html) · [Creator’s experiment index](https://www.angelosgiovanis.com/experimental/)

**Observed:** a full-screen furry creature clearly turns its head left and right when the pointer position changes. It is a head turn, not merely eyes sliding over a still face. The demo loaded after an initial loading state; its frame and gaze readouts changed with interaction. It has no helmet HUD or content panels. [Demo](https://www.angelosgiovanis.com/experimental/little_guy.html)

**Source inspected:** the inline script loads 48 JPEG frames, uses horizontal pointer position to select the angle, springs the gaze toward its target, crossfades adjacent frames, and mirrors the image for the opposite side. It also blends the two mirrored views near the center. Vertical pointer position does not control head pitch. The creator describes these as real frames, but this does **not** establish that they are camera-captured rather than rendered/generated imagery. [Demo source, inline `CONFIG`, `setTargetFromPoint`, `paintSide`, and `render`](https://www.angelosgiovanis.com/experimental/little_guy.html)

**Important failure mode:** despite the creator’s “no ghosting” description, I observed doubled eyes in a frontal blend; the source explicitly crossfades whole images. The center transition also blends the background. This is an unusually relevant proof of the interaction concept **and** a concrete warning for our footage experiment. It does not show that unrelated movie shots can be stitched convincingly. [Creator description](https://www.angelosgiovanis.com/experimental/) · [Inspected demo/source](https://www.angelosgiovanis.com/experimental/little_guy.html)

**Try:** compare far left, center, and far right; then move slowly across the center. Judge whether the head feels alive and where the transition stops looking photographic.

### 2. Tony Stark portfolio — closest likeness/theme on a simple website

[Open demo](https://tonystark.runable.site/) · [Creator’s explanation and prompts](https://www.reddit.com/r/runable/comments/1pzlu74/i_made_a_tony_stark_portfolio_page_where_your/)

**Observed:** a large, realistic-looking Tony Stark portrait on white; placing the pointer over it reveals part of an Iron Man helmet through an irregular mask. The face itself stayed fixed. The page has a Projects button and social icons; clicking Projects produced no visible new content during this inspection. [Demo](https://tonystark.runable.site/)

**Creator claim:** the effect uses two aligned generated images and a cursor-following reveal. This is useful evidence of the immediate visual joke/recognition, but it is not a face that turns, a helmet-interior view, or an explorable HUD. [Creator post](https://www.reddit.com/r/runable/comments/1pzlu74/i_made_a_tony_stark_portfolio_page_where_your/)

### 3. Devini’s Iron Man — closest cinematic Iron Man web presentation

[Open demo](https://iron-man-jet.vercel.app/) · [Creator write-up](https://stayahead.space/resources/iron-man) · [Source](https://github.com/devinilabs/iron-man)

**Observed:** the site loaded a large Iron Man suit image, HUD-like framing, telemetry text, overlaid copy, and scroll sections. The canvas needed time to load its imagery. Navigation points to sections within the page. This is a suited exterior presentation, not Tony’s face inside the helmet. [Demo](https://iron-man-jet.vercel.app/)

**Creator claim:** scroll scrubs a pre-rendered frame sequence in a sticky canvas rather than rendering 3D live. The creator supplies the Next.js source and a [YouTube build walkthrough](https://stayahead.space/resources/iron-man) through the resource page. Its key contribution is cinematic presentation on the web; it does not establish pointer-directed gaze or click-to-expand media panels. [Creator write-up](https://stayahead.space/resources/iron-man)

### 4. FacePoke — closest human portrait manipulation

[Repository and examples](https://github.com/jbilcke-hf/FacePoke) · [Demo landing page — paused when checked](https://huggingface.co/spaces/jbilcke-hf/FacePoke)

**Creator claim:** this LivePortrait-based app transforms a supplied portrait in response to clicking/dragging, with a GPU backend; the README warns about shared-demo latency. **Observed service state:** the linked Space redirects to `FacePoke_CLONE-THIS-REPO-TO-USE-IT` and says it is paused. I therefore did not verify a functioning interactive session. The GitHub repo is archived. [README/repository](https://github.com/jbilcke-hf/FacePoke) · [Space status](https://huggingface.co/spaces/jbilcke-hf/FacePoke)

**Source inspected:** `app.tsx` includes “Autotrack eyes” and “Autotrack head” controls, but both are inside a commented block marked “experimental features, not active yet.” Do not mistake this for a verified ready-made gaze-following website. Its shipped interaction and its possible adaptation are separate claims. [Source](https://github.com/jbilcke-hf/FacePoke/blob/main/client/src/app.tsx)

## Partial references worth examining

### 5. Needle Engine’s Look At Cursor — the 3D alternative

[Official sample](https://engine.needle.tools/samples/look-at-cursor-interactive-3d-header/)

**Creator claim:** a 3D character’s head looks at a cursor-following target using `CursorFollow` and `LookAt`; nearby props react too. The official sample offers an interactive embed and download. **Inspection limit:** the surrounding page and preview were visible, but the embedded scene was still loading in the captured check, so head motion here is a documented claim rather than observed behavior. The preview is a stylized character, not a cinematic human likeness. [Official sample and component list](https://engine.needle.tools/samples/look-at-cursor-interactive-3d-header/)

The same creator as Little Guy also offers [Dionysos](https://www.angelosgiovanis.com/experimental/statue.html), described as a real-time 3D marble torso that turns toward the cursor. This is a useful adjacent comparison of frame selection versus live 3D, but I inspected the [creator description](https://www.angelosgiovanis.com/experimental/), not its motion.

### 6. Bruno Simon — the “stay and play” precedent

[Open portfolio](https://bruno-simon.com/) · [Source](https://github.com/brunosimon/folio-2025)

**Creator documentation:** visitors drive around a 3D portfolio, explore secrets, interact, jump, and honk; the site publishes keyboard, touch, and gamepad controls. The repository documents the vehicle/physics game loop, interactive points, environment effects, and source assets. This is the strongest reference here for making exploration itself the website’s substance. It offers neither an Iron Man aesthetic nor a reactive face. Browser gameplay was not exercised in this research pass. [Portfolio and controls](https://bruno-simon.com/) · [Repository](https://github.com/brunosimon/folio-2025)

### 7. Arwes — animated sci-fi interface vocabulary

[Official site](https://arwes.dev/) · [Playground](https://arwes.dev/play) · [Documentation](https://arwes.dev/docs) · [Source](https://github.com/arwes/arwes)

**Creator documentation:** Arwes supplies sci-fi interface primitives for animation, frames, text, backgrounds, and sound, with a playground for experiments. Its docs explicitly call it an alpha project and describe low/medium-level tools rather than a complete ready-made application. This is a panel-motion and visual-language reference, not a complete competing concept. The playground fetch timed out in this pass, so no specific animation or stability claim is based on a live test. [Overview](https://arwes.dev/docs) · [Packages/playground description](https://arwes.dev/docs/develop)

### 8. Alan Torres’s Iron Man 3 work — the original aesthetic benchmark

[Creator’s Iron Man 3 gallery](https://www.tartvfx.com/iron-man-3) · [Jayse Hansen’s related Spider-Man HUD design](https://jayse.io/work/spidey)

**Creator descriptions:** Torres identifies his work on the Mark 42 HUD and additional end-battle HUDs for Cantina Creative. Hansen describes designing Stark’s Spider-Man interfaces and the humorous story beats of overwhelming Peter with them. These are film-design references, not interactive websites. They are useful for judging the desired density, relationship between face and overlays, and how interface behavior can carry a joke. [Torres](https://www.tartvfx.com/iron-man-3) · [Hansen](https://jayse.io/work/spidey)

## Comparison against our brief

All judgments summarize the linked evidence above. “Claimed” and “unverified” are intentional limitations.

| Reference | Cinematic face / likeness | Pointer eye / head response | HUD or panel animation | In-site content / play | Closest contribution |
|---|---|---|---|---|---|
| Little Guy | Creature imagery, not Tony | Horizontal head turns observed; no independent eye control established | No HUD | Pointer toy | Footage/frame-angle approach |
| Tony Stark portfolio | Realistic-looking Tony portrait observed | Reveal mask only; fixed face | No helmet HUD observed | Projects did not visibly open | Recognizable likeness + cursor joke |
| Devini Iron Man | Cinematic suit exterior observed | No pointer head response established | Scroll-driven sequence claimed; HUD framing observed | In-page sections observed | Cinematic fan-site presentation |
| FacePoke | Supplied human portrait, creator demos | Click/drag transformation claimed; auto-follow controls commented out | No HUD | Portrait manipulation tool; hosted demo paused | Human-head synthesis reference |
| Needle Look At Cursor | Stylized 3D preview | Head tracking claimed | No cinematic HUD | Interactive sample claimed | 3D look-at mechanism |
| Bruno Simon | No face | Not applicable | Game interface, not helmet HUD | Extensive exploration documented | Reasons to stay, explore, and share |
| Arwes | No face | Not applicable | Animated sci-fi primitives documented | Framework/playground | Panel motion and sound vocabulary |
| Film designer galleries | Original Iron Man/MCU design work | Authored film animation, no pointer | Original HUD design | Watch/read, not interactive | Aesthetic and comic timing benchmark |

## Additional HUD leads and availability cautions

- [J.A.R.V.I.S. Holographic Interface](https://github.com/LeiQingliang/J.A.R.V.I.S.-Holographic-Interface): the creator documents a camera feed, gesture-controlled 3D globe/terrain, floating information panel, sounds, and LLM/map integration. This is a useful combination reference, but only the README was inspected; the listed file tree alone does not prove every claimed component works. It puts the **visitor’s camera feed** behind the HUD rather than a pointer-reactive Tony. No public deployed demo was established. [Repository](https://github.com/LeiQingliang/J.A.R.V.I.S.-Holographic-Interface)
- [tacmach98’s JARVIS Iron Man HUD](https://github.com/tacmach98/jarvis-iron-man-hud) claims a browser HUD with voice commands, effects, and simulated systems. Its advertised [Vercel demo](https://jarvis-iron-man-hud.vercel.app/) returned `404 DEPLOYMENT_NOT_FOUND` during actual browser inspection. Use the repository as a lead, not as a working demo recommendation.

## What this clears up, and what remains a decision

The footage-angle concept has a direct interactive precedent in Little Guy, but that precedent is one authored turn sequence, horizontal motion, mirrored sides, and visible blending artifacts. It does not validate gathering many unrelated film/blooper shots or delivering independent eye motion. FacePoke and Needle provide distinct synthesis and 3D comparisons, with the availability and verification limits above. [Little Guy/source](https://www.angelosgiovanis.com/experimental/little_guy.html) · [FacePoke](https://github.com/jbilcke-hf/FacePoke) · [Needle](https://engine.needle.tools/samples/look-at-cursor-interactive-3d-header/)

My recommendation for the next human decision is to compare a rough face-turn experiment against Little Guy’s strengths and artifacts, then pick the emotional/comic interaction and first panel content. The research does **not** select the implementation or promise film-level realism. The opportunity in this shortlist is the combination: a convincing reactive face, movie-like panels, and a small reason to keep playing inside the scene.
