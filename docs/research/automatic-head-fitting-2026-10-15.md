# Automatic head fitting: practical options

Checked 15 October 2026 against primary vendor/project sources. No reconstruction software was installed or model altered for this report.

## Recommendation

**KeenTools FaceBuilder for Blender is the strongest practical option for this particular video and a one-off, no-payment head build.** It fits a parametric head jointly to multiple photographs with automatic initial alignment and user-corrected reference pins. Extract sharp, neutral-expression frames from the MOV; fit those views together; inspect projected wireframe overlays and held-out frames before showing another clay turntable. It is semi-automatic fitting, not a faithful laser scan or a guarantee of likeness.

Crucially, this is not merely a research-only free trial: the [current KeenTools EULA](https://keentools.s3.us-east-2.amazonaws.com/web/docs/keentools-eula.pdf), page 2, explicitly includes Trial in the licences permitting commercial use without royalties. Page 3 §2.1.3 permits publishing output. The [product page](https://keentools.io/products/facebuilder-for-blender) states that results belong to the creator, supports Intel/Apple Silicon macOS, offers a 15-day unrestricted trial, and says existing results can still be opened/exported after subscription expiry; further FaceBuilder adjustments require an active licence. The trial is therefore **time-limited software use**, not permanently free software. It must not be reset or bypassed. Check whether a trial was previously consumed before relying on it.

## Alternatives and licence traps

| Option | What it actually does | Licence / practical conclusion |
| --- | --- | --- |
| Apple Object Capture | Actual photogrammetry from overlapping photos, available as native macOS RealityKit API; foreground masks can be supplied. | Promising free local test, especially on this Mac, but not a facial fitting program. Moving face, blinking, hair, limited angular coverage, and changing shadows can defeat correspondence. Mask the head and exclude stationary background/torso. Never present failure or a hole-filled scan as measured likeness. |
| COLMAP + OpenMVS | Feature matching, camera estimation, triangulation, then dense photogrammetry. | COLMAP is BSD (dependencies have separate licences), available via Homebrew on macOS. Official docs say dense COLMAP needs supported GPU acceleration; CPU sparse reconstruction works, and OpenMVS is an external dense option. OpenMVS is AGPL3; running it locally on own photographs does not by itself place the output mesh under AGPL. More engineering than FaceBuilder; same capture limitations. |
| Meshroom / AliceVision | Photogrammetry graph, not face identity fitting. | Open-source, but official binary downloads target Windows/Linux; CUDA-centred dense pipeline is not a straightforward native Apple Silicon solution. Not first recommendation for this laptop. |
| FLAME **2023 Open** | A statistical head model whose shape parameters can be fitted through an objective function across frames. | Important new permitted option: official homepage announces Nov 2025 release under CC-BY4, and model licence explicitly permits commercial adaptation. This exemption applies only to **FLAME 2023 Open**, not old FLAME files or unrelated trained estimators. Download requires registration. It is a base model, not an automatic reconstruction application: building/validating a multiview solver is still custom work. |
| DECA / EMOCA / MICA | Learned monocular face/head prediction, sometimes with detail or identity consistency. | Official licences restrict model/software to noncommercial scientific, educational or artistic use and restrict redistribution. Cannot assume these are cleared for a professional/public portfolio simply because GitHub code is downloadable. FLAME Open does not relicense these predictors. |
| 3DDFA_V2 | Fast dense face alignment and 3D morphable-model parameter prediction; CPU/Mac support. | Code is MIT, **but** its own `bfm/readme.md` explicitly says the bundled modified BFM2009 is academic-only and commercial use requires a separate licence. Do not confuse its MIT code badge with rights to distribute the fitted model. |
| FaceVerse | Learned/statistical face fitting; newer versions include a full head. | Code badge/licence alone insufficient. Official dataset agreement prohibits commercial use and third-party distribution of derived data. No clear end-to-end commercial-use permission established for weights/model, so not a cleared path. |
| Faceform Wrap | Nonrigidly transfers existing topology onto an existing scan. | Paid professional tool, free education licence is noncommercial; does not reconstruct this video by itself. |

## What “deterministic” should mean here

A reproducible solver can optimise one shared identity shape and per-frame pose/camera/expression, with fixed inputs/settings. It can report landmark reprojection errors and silhouette overlap on frames withheld from fitting. That is stronger evidence than subjective screenshots. It does **not** make a monocular video metrically complete: unknown focal length, perspective/shape ambiguities, expression, and invisible anatomy remain uncertain. More points or more iterations do not necessarily improve identity likeness.

For FaceBuilder, compare front, both three-quarter views, chin/nose profiles and eyelid/mouth contours at matched camera poses, then a neutral clay turntable. Do not use generated textures to hide geometric error. The source video does not reveal a complete rear skull; any complete head still has model-prior anatomy there.

## Primary sources

- [FaceBuilder features, system support, trial and result ownership](https://keentools.io/products/facebuilder-for-blender)
- [KeenTools EULA](https://keentools.s3.us-east-2.amazonaws.com/web/docs/keentools-eula.pdf)
- [Apple Object Capture overview](https://developer.apple.com/documentation/realitykit/realitykit-object-capture/)
- [Apple foreground mask API](https://developer.apple.com/documentation/realitykit/photogrammetrysample/objectmask)
- [Apple capture guidance: rigid/deformable objects and lighting](https://developer.apple.com/videos/play/wwdc2023/10191/)
- [COLMAP install](https://colmap.github.io/install.html), [licence](https://github.com/colmap/colmap/blob/main/doc/license.rst), [CPU/GPU limitations](https://github.com/colmap/colmap/blob/main/doc/faq.rst)
- [OpenMVS AGPL licence](https://github.com/cdcseacave/openMVS/blob/master/LICENSE)
- [Meshroom downloads](https://meshroom.org/download/)
- [FLAME release announcement](https://flame.is.tue.mpg.de/), [separate academic and Open model licences](https://flame.is.tue.mpg.de/modellicense.html)
- [DECA licence](https://github.com/yfeng95/DECA/blob/master/LICENSE), [EMOCA licence](https://github.com/radekd91/emoca/blob/release/EMOCA_v2/LICENSE), [MICA licence](https://github.com/Zielon/MICA/blob/master/LICENSE)
- [3DDFA_V2 bundled model restriction](https://github.com/cleardusk/3DDFA_V2/blob/master/bfm/readme.md)
- [FaceVerse dataset agreement](https://github.com/LizhenWangT/FaceVerse-Dataset)
- [Wrap purpose/pricing](https://faceform.com/wraporiginal/)

## Local availability check

A Swift program importing RealityKit and printing `PhotogrammetrySession.isSupported` was run on this Apple Silicon Mac. It returned `false` in the restricted sandbox and `true` outside the sandbox. This verifies engine availability for a permitted local process, not that reconstruction of the supplied clip succeeds. No portrait images were sent to this probe and no reconstruction was run.

The rejected clay model was also compared with three matched-view renders from the supplied clip. The private comparison is `.private-assets/rory-clay/audit/video-versus-clay.jpg`. It confirms eye-opening, nose-tip/nostril and mouth/chin mismatches. The existing fitted-camera estimates were used only to make the comparison; they are not calibrated ground truth.
