# Rory's fitted face

Rebuilt 16 October 2026 from the owner's supplied video, with explicit instruction to omit blemishes.

The face uses the owner's local captured surface and licensed FaceBuilder output, fitted against the video's eyes, nose and mouth in multiple views. The 2048px color atlas is projected from the actual footage, with local skin-spot cleanup. No generated portrait or film-character model is included. A separate source frame was retained for comparison after fitting.

Runtime assets: `rory-head.glb`, `rory-head-build.json` and `../face-eye-rig.js`. `../scripts/package_rory_face.py` losslessly removes unused authoring vertex colors from the accepted export; it preserves all positions, texture data and sparse motion targets without decimation. The video, measurements, fitting scripts and editable Blender files remain in the Git-ignored `.private-assets/new-face/` directory. Only the geometry, baked image and placement metadata are served.

The animated derivative separates the captured ocular surfaces and adds local half/full eyelid closures plus bounded gaze targets. Neutral coordinates and atlas UVs match the accepted face; eyebrows, nose and mouth remain fixed. Blink motion extends the lid skin over the eye, while gaze transports the existing single iris texture within the fixed opening. This is not a full anatomical eyeball reconstruction. Gaze is limited to 10° horizontally and 7° vertically, with a smaller diagonal envelope.

The viewer turns the actual mesh, aligns the moving measured pupil to the eyepiece and fades the face boundary. Expression elsewhere remains neutral, with no scalp, back of head or lip-sync rig. Scale is chosen for presentation, not a calibrated physical measurement.

The owner authorized use of their footage and likeness. The active FaceBuilder trial permits generated output; the licence investigation is recorded in `docs/research/automatic-head-fitting-2026-10-15.md`. The original exosuit is separately authored procedural geometry.

## Nose refinement

On 16 October the tip projection and central underside were refined against frontal, side and tilted video frames. The rejected flat underside and separate hanging-tip variants were not retained. A nose-only atlas projection was rebuilt from the original footage. All eye geometry and the twelve blink/gaze position deltas remain unchanged. Source, comparisons and validation are retained privately in `.private-assets/new-face/nose-refinement/`.

The runtime uses soft reflected light and a modest source-color contribution to avoid multiplying already-photographed shadows into a black band. Balanced inspection lighting now illuminates downward-facing surfaces too. These shading adjustments apply to the portrait globally, with no painted-on nose correction.
