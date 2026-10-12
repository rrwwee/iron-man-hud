# Disposable face-treatment comparison

Decision ticket: [Choose the face treatment through a visual comparison](https://github.com/rrwwee/iron-man-hud/issues/4).

This is a decision aid, not production code. The user approved generated imagery for these trials. It is isolated on `codex/face-treatment-prototype`; no final treatment has been selected.

## Run

From the repository root:

```sh
python3 -m http.server 4187 --bind 127.0.0.1 --directory prototypes/face-treatment
```

Open http://127.0.0.1:4187/?variant=compare. No dependencies or build step. Opening `index.html` directly also works.

## Compare

- **A / Direct poses:** choose the closest of 15 generated frames. Preserves single-frame detail but exposes pose changes.
- **B / Blended poses:** bilinear pixel blend of up to four adjacent frames. Smoother transitions can produce doubled features. This is not optical-flow interpolation or a live face model.
- **C / Still control:** move a single center portrait slightly. This deliberately does not turn its head; it helps judge how much true pose change matters.

The bottom switcher and left/right arrow keys change `?variant=compare|cut|blend|still`. Both turning methods share one target and one exponential smoothing function. Pointer position across the whole test area maps to direction. Leaving the area returns to center. Replay traverses center, left/right, corners, a reversal, then a slow center crossing. Freeze holds the current target and images; Center resets. Idle adds a small pose sway, without blinking or expressions. Switch the HUD off to inspect the source transitions unobscured. Small range uses the inner half of the same pose bank, not additional images.

## Source and limits

`assets/tony-pose-sheet.png` was created with the built-in imagegen tool from `assets/generation-prompt.txt` on October 11, 2026 (America/Los_Angeles). It contains 5 columns × 3 rows. The columns request left 30°, left 15°, frontal, right 15°, right 30°; rows request up 12°, level, down 12°. These are prompt targets, not measured angles. Some generated adjacent angles are similar and framing/expression vary. The viewer preserves these flaws so they can be assessed.

No movie frames, 3D rig, FacePoke, LivePortrait, independent eye aim, temporal synthesis, or runtime inference are used. This trial can inform likeness, the value of pose changes, and sparse-image transition preferences. It cannot establish the quality or feasibility of those untested pipelines, or establish a public-release asset/license strategy.

The same generated image is sampled by the three treatments. Rendering uses Canvas 2D; no remote requests, accounts, persistence, or analytics. A final verdict must come from the user's live comparison and be recorded on the decision ticket before it is closed.
