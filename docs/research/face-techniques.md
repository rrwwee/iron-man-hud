# Cinematic, pointer-reactive face: technical options

Research date: 2026-10-11. Resolves the investigation in [Compare approaches for a cinematic pointer-reactive Tony Stark face](https://github.com/rrwwee/iron-man-hud/issues/3). This report supplies evidence for a later visual decision; it does not select the final method.

## Finding

The three routes are credible experiments, but solve different problems. Rigged 3D gives continuous, independently controlled head and eye motion. Recorded footage preserves the actual photographed performance, but an arbitrary collection of angles does not automatically become continuous motion. Image-driven animation offers a concrete middle ground: **FacePoke already turns a portrait's head and changes its eyes using mouse interaction**, with a GPU backend. The remaining question is whether any candidate looks sufficiently like this particular face at the intended size and range of movement. That needs a small visual comparison, not another architecture decision. [Three.js animation system](https://threejs.org/manual/pages/animation-system.html), [FacePoke](https://github.com/jbilcke-hf/FacePoke), [FacePoke transformation code](https://github.com/jbilcke-hf/FacePoke/blob/main/engine.py).

No approach was executed or benchmarked during this research. Performance statements below distinguish documented behavior from engineering inference.

## Comparison

The judgments in this table are engineering inferences from the implementations discussed below, not measured results for Tony Stark assets.

| Criterion | Rigged 3D | Pose-indexed filmed frames/clips | Image-driven or hybrid |
|---|---|---|---|
| Likeness | Entirely dependent on model, texture and lighting quality | Actual actor in available frames | Preserves source appearance approximately; generation can introduce artifacts |
| Pronounced head turns | Natural geometric control, including newly exposed surfaces | Only angles actually captured; gaps require a transition or synthesis | Controllable, but large turns must invent unseen appearance |
| Eyes independent of head | Possible with separate eye rig and eyelids | Requires extra gaze coverage at each head angle | FacePoke exposes pupil and head-rotation parameters separately |
| Continuity | Continuous transform and animation blending | Discrete selection jumps; crossfade may ghost features | Continuous parameters, but perceptual stability is source-dependent |
| Browser deployment | Local WebGL rendering | Local images/video after preparation | Precomputed output can be local; verified interactive example uses server inference |
| Main authoring cost | Likeness, eyes, skin, rig, believable motion | Finding, matching, aligning and labeling consistent material | Source preparation, output screening, and deployment or precomputation |

### 1. Rigged 3D: best control; likeness is the expensive unknown

Three.js supports skeletal animation, morph targets, transform animation and blended clips, with glTF loading. This covers the necessary mechanisms: turn a head, aim eyes separately, blink, and blend a reaction. It does not supply a convincing actor likeness or a facial rig. [Animation system](https://threejs.org/manual/pages/animation-system.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).

USC/Activision's **Digital Ira** is a useful realism reference: its production used expression scans, multiview performance capture, detailed textures and specialized shading. It demonstrates the feasibility of an expressive real-time digital human; it is not evidence that a downloaded head plus a standard material will match a film close-up. The project's renderer was DirectX11, so its performance is not a browser benchmark. [Digital Ira project](https://vgl.ict.usc.edu/Research/DigitalIra/).

Inference for this demo: a fixed helmet crop and dramatic lighting may reduce the visible work, but the face is central enough that poor eyes, facial proportions or plastic skin will remain conspicuous. Rotating a static head can test head tracking cheaply; it cannot validate lifelike eye movement or expressions.

### 2. A bank of movie/blooper footage: real appearance, difficult continuity

The user's proposal is technically meaningful: annotate frames by yaw/pitch and gaze, then choose the closest match to the pointer target. Face Landmarker can provide landmarks, expression coefficients and transformation matrices as a starting point for indexing; it does not establish that a collection has complete pose coverage or consistent appearance. [Google Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker).

The hard part is matching adjacent choices. Engineering inference: different shots bring changes in crop, focal length, illumination, costume, expression and mouth position. A left-facing frame and a right-facing frame do not contain the intervening turn. A crossfade blends two faces rather than reconstructing that turn. Head orientation is also different from eye gaze: looking left can be achieved by eyes, head, or both.

Disney Research's **FaceDirector** demonstrates image-space performance blending, but requires dense audiovisual synchronization and facial correspondence between takes. Its evidence supports carefully matched footage workflows, not effortless blending of arbitrary film shots. [FaceDirector](https://studios.disneyresearch.com/2015/12/11/facedirector-continuous-control-of-facial-performance-in-video/).

Browser playback is straightforward once assets exist; interactive random access still needs testing. Setting a video's `currentTime` triggers a seek, so it should not be assumed equivalent to displaying an already-decoded frame each pointer update. An extracted, preloaded image bank avoids that specific seek mechanism at the cost of memory and downloads. [MDN currentTime](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime).

For an initial test, choose one coherent shot or take before considering an exhaustive search through movies. This research did not identify a public, pose-complete, consistently lit Tony Stark source dataset or an accessible unedited performance archive. That is an unresolved availability question, not proof that none exists.

### 3. Image-driven and hybrid: a particularly relevant existing experiment

**LivePortrait** animates a source image/video using a driving performance and offers pose editing. Its published generation speed is 12.8 ms on an RTX 4090 with PyTorch; that number is neither browser speed nor end-to-end interaction latency. The supplied workflow uses Python, downloaded weights and a Gradio interface. [Paper](https://arxiv.org/abs/2407.03168), [official implementation](https://github.com/KlingAIResearch/LivePortrait).

**FacePoke** makes the connection to this project unusually direct. Its code exposes yaw, pitch, roll, pupils, eyelids, brows and mouth controls. The server caches source features, transforms them, generates an image, composites it into the source and returns a WebP. Thus it is concrete evidence for mouse-controlled portrait manipulation, while its boundary and image-generation artifacts still need inspection for our face and crop. [Transformation implementation](https://github.com/jbilcke-hf/FacePoke/blob/main/engine.py), [server](https://github.com/jbilcke-hf/FacePoke/blob/main/app.py).

FacePoke's author documents Linux/CUDA testing and warns that the shared demo can have high latency. That establishes a browser frontend with server GPU inference, not an all-browser solution. [Setup and demo](https://github.com/jbilcke-hf/FacePoke#installation), [try the existing demo](https://huggingface.co/spaces/jbilcke-hf/FacePoke).

Two hybrid variants are worth comparing: precompute a bounded pose bank from a single image; or pre-render a good 3D rig into images/clips, then use those locally. Both move generation off the visitor's device, but inherit pose-bank continuity and download constraints. These are proposed experiments, not verified turnkey pipelines. Browser inference is another route: ONNX Runtime Web supports GPU execution, but only subsets of operators on GPU backends. A working, performant port of this particular pipeline remains unverified. [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/).

## Asset and license facts

- **Candidate 3D likeness:** Nathang30's [Tony Stark listing](https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74) reports 68.5k triangles and CC Attribution-NonCommercial-ShareAlike. The search-indexed first-party listing was readable; direct page fetch failed. Rig, separate eyes, blendshapes, current download availability and cinematic suitability were **not verified**. The listing does not establish a separate license from Marvel or the actor; that status is **unknown**.
- **Film, bloopers and unedited footage:** no specific downloadable source set with verified adaptation/redistribution permissions was established. Public viewability should not be recorded as a reuse license. Source availability and permissions remain **unknown** for this route.
- **LivePortrait:** its own code is MIT; the official model card also declares MIT. Its license expressly distinguishes the bundled InsightFace models as non-commercial research only and instructs commercial users to replace those detection models. Record the exact pipeline selected, rather than calling every dependency simply MIT. [License](https://github.com/KlingAIResearch/LivePortrait/blob/main/LICENSE), [model card](https://huggingface.co/KlingTeam/LivePortrait).
- **FacePoke:** its README declares MIT for its code and repeats the InsightFace weight limitation. None of these software licenses supplies rights to an arbitrary source portrait. [FacePoke license notes](https://github.com/jbilcke-hf/FacePoke#license).

## Smallest disposable comparison

Do not build the HUD or search every film first. Prepare one face-only comparison with the same crop, approximate display size and neutral background:

1. **3D:** one candidate head, head rotation, and separate eye aiming only if the asset actually supports it. Label missing rig features rather than hiding them.
2. **Footage:** a 3×3 grid of head directions from one coherent source, with its real gaps visible. Compare nearest-frame selection and a brief blend; record source and permission status.
3. **Image-driven:** one portrait through FacePoke or offline LivePortrait-derived poses, with the same target directions. Start with the existing interactive demo before building an integration.

Replay the same pointer route: center → corners → quick reversal → slow circle → center, then trigger a blink or small reaction if supported. Inspect likeness, turns, gaze accuracy, transitions, exposed cheek/ear detail, edge compositing and response delay. Measure load bytes, memory and actual render/round-trip latency on the intended desktop browser. Proposed initial yaw ±25° and pitch ±15° are comparison settings, not established acceptance criteria.

Ask the human which result remains convincing **while moving**, which failures feel funny in a good way, and how much movement the experience needs. If the best-looking version cannot sustain that range, narrow the range explicitly or investigate another candidate. This comparison would resolve the main uncertainty without committing the demo to 3D, footage or generated portraits.
