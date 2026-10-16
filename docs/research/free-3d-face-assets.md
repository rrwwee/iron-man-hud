# Free expressive 3D face: asset and authoring routes

Research date: 2026-10-11. Resolves [Find a free expressive 3D face asset or authoring route](https://github.com/rrwwee/iron-man-hud/issues/7). The budget is $0. The desired face remains cinematic Tony Stark, with continuous head turns, independent eyes and expressions; some videogame-like goofiness is acceptable.

## Finding

**A free authoring route is credible; a ready-to-use free Tony likeness with verified facial controls was not established.** Use Blender + MPFB to create the intended male face, then export a rigged GLB. There is a directly downloadable, explicitly CC0 MPFB example whose actual file contains the necessary controls, so a mechanics trial does not require authoring software or a paid avatar service first. However, that example is a generic **female** avatar: it can validate motion and expressions, never Tony likeness. [MPFB with TalkingHead](https://github.com/met4citizen/TalkingHead/blob/2afe6d79779313db8909badebf46f9805a6c7b70/blender/MPFB/MPFB.md), [example asset and license declaration](https://github.com/met4citizen/TalkingHead/blob/2afe6d79779313db8909badebf46f9805a6c7b70/README.md#test-app).

The remaining uncertainty is visual authoring quality: how close a freely authored face can get to Tony at the intended crop, lighting and movement range. No source reviewed establishes that MPFB automatically produces an RDJ likeness. No purchase is justified by this research.

## Shortlist

| Candidate | Cost and access | Controls / format | Appropriate next use |
| --- | --- | --- | --- |
| **TalkingHead's MPFB example** | Direct GitHub download; author explicitly licenses this avatar CC0 | Actual GLB inspected: head, neck, eye and jaw joints; facial morph targets | Best verified mechanics control. Generic female appearance, not a Tony candidate |
| **New male character authored with Blender + MPFB** | Free local authoring; MPFB core graphical assets CC0 | Documented rig, facial units and GLB export route; individual export still needs checking | Best free path to try a recognizable Tony-inspired face; requires modeling and texture work |
| **Nathang30's Tony Stark** | Listed free/downloadable; CC BY-NC-SA 4.0; download API requires an account | 68,484 triangles, zero animation clips in public metadata; bones and morphs unverified | Likeness reference / conditional candidate, not a verified expression-ready asset |

Sources and limits for each row follow below.

## Verified mechanics control: MPFB example

The TalkingHead author identifies `avatars/mpfb.glb` as made using Blender/MPFB and dedicates it to CC0. This is an asset-specific statement, separate from the repository's MIT code license. Other avatars in that repository have different terms; do not extend this permission to all of them. [Pinned license declaration](https://github.com/met4citizen/TalkingHead/blob/2afe6d79779313db8909badebf46f9805a6c7b70/README.md#test-app).

- [Pinned model download](https://raw.githubusercontent.com/met4citizen/TalkingHead/2afe6d79779313db8909badebf46f9805a6c7b70/avatars/mpfb.glb)
- [Author's MPFB preview image](https://github.com/met4citizen/TalkingHead/blob/2afe6d79779313db8909badebf46f9805a6c7b70/images/mpfb.jpg) — an authoring screenshot, not a benchmark or screenshot of our trial.
- [TalkingHead test app](https://met4citizen.github.io/TalkingHead/) — a general upstream demo, not proof of our required pointer behavior.

### Actual file inspection

Downloaded to a temporary research folder and parsed as GLB 2.0 using Python's standard library. No model scripts, Blender add-ons or other third-party code were executed. These findings are measurements of the pinned binary, not marketplace tags:

| Check | Result |
| --- | --- |
| Bytes | 36,815,920 (35.1 MiB) |
| SHA-256 | `63c645a2a863b9972e9a9c2ed576a1de4c390b8475508e1473e69c87a3ee299c` |
| Layout | 76 nodes, one skin, eight meshes, 83,686 indexed triangles |
| Skeleton | Includes `Neck`, `Head`, `LeftEye`, `RightEye`, `Jaw`; both eye joints descend from `Head` |
| Real skin weights | Eye mesh has positive weights to `LeftEye` and `RightEye`; body/head mesh has positive weights to `Head`, `Neck`, `Jaw` and eye joints |
| Face geometry | `base` mesh has 11,779 vertices and 66 named morph targets |
| Needed expressions | `eyeBlinkLeft/Right`, `browInnerUp`, `browOuterUpLeft/Right`, `mouthSmileLeft/Right`, `mouthFrownLeft/Right`, `jawOpen`, directional eye targets and visemes |
| Nonempty deformations | Blink left/right each move 318 base-mesh vertices; smile left/right each 1,877; outer brow left 242; inner brow 428; jaw open 2,395 |
| Related meshes | Eyebrows: 23 targets; eyelashes: 33; eyes: eight; teeth: 12; tongue: 13 |
| Packaging | Seven embedded PNG textures; no external image URIs; no required glTF extensions; zero animation clips |

The absence of clips is acceptable for directly driven head rotations and morph weights. This binary proves that controls and nonempty deformation data exist, **not** that their appearance, combination, eye axes or speed is satisfactory. A renderer must apply shared expression names to the affected eyebrows, eyelashes and mouth meshes as well as the face. Test either eye-bone rotation or the eye-look morphs deliberately; combining both can double the effect. These are implementation implications from the inspected structure.

The file is larger than desirable for a face-only demo. Cropping the view does not reduce its download. Any later removal of body geometry, texture reduction or compression should be measured separately. This research did not render the downloaded GLB, measure browser performance or modify the asset.

## Free likeness-authoring route

MPFB is a Blender extension with no license fees, paid feature tier or email requirement for downloading. Its core meshes, targets and textures use CC0; its code uses GPL. The project's stated output policy permits unrestricted use of the generated asset. Community assets still need their individual terms checked. [Free-access statement](https://static.makehumancommunity.org/mpfb/faq/is_it_really_free.html), [asset/code split and output policy](https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md).

The documented workflow supports adjusting a character's basic parameters and detailed shape, adding a rig and selecting skin, eyes, brows, hair and clothing. For this demo, concentrate effort on a middle-aged male face, hairline, nose/jaw proportions and goatee; judge at the actual HUD crop. Those likeness targets are an artistic plan, not supplied presets or guaranteed results. [MPFB authoring instructions](https://github.com/met4citizen/TalkingHead/blob/2afe6d79779313db8909badebf46f9805a6c7b70/blender/MPFB/MPFB.md).

MPFB's Export Copy can bake modeling changes and add 54 ARKit-style face units plus optional visemes from installed asset packs. The documented propagation option carries relevant deformations onto related meshes. [Export Copy documentation](https://static.makehumancommunity.org/mpfb/docs/exporting/export_copy.html). The TalkingHead workflow supplies a custom rig and describes GLB export, including material preparation and keeping the original design separate from its export copy. This workflow is evidence of a practical free route, not something executed here. [Rig/export procedure](https://github.com/met4citizen/TalkingHead/blob/2afe6d79779313db8909badebf46f9805a6c7b70/blender/MPFB/MPFB.md).

Blender was not available in the inspected environment. Installing it, reviewing/installing MPFB and authoring a male face remain extra work. Do not promise that changing a sample's texture or adding a beard alone achieves the required likeness. No authoring add-on was installed or executed during this investigation.

## Tony likeness leads and why they are not ready selections

**Nathang30's [Tony Stark](https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74):** the author describes the model as Tony/RDJ. The [public listing API](https://api.sketchfab.com/v3/models/86c267264a2e4903b8c2bcc1b972cb74) was read directly: `isDownloadable: true`, `animationCount: 0`, 34,694 vertices and 68,484 faces. It specifies **CC BY-NC-SA 4.0**, requiring attribution, noncommercial use and share-alike for modifications. Zero clips does **not** mean no skeleton, but neither proves a facial rig. Separate eyes, head bones, facial targets, source format and provenance beyond the uploader's statement remain unverified. The binary was not downloaded; [Sketchfab's Download API requires authentication](https://sketchfab.com/developers/download-api). No account was created or used for this research.

**“Tony Stark(Textured)(Rigged)” by 3D MODELS:** the title appears in a [Sketchfab collection](https://sketchfab.com/sonirubal6/collections/characters-bc86657f492b43e39190480ead3dbea6). A model-specific primary page with verifiable license, provenance and facial controls was not established. “Rigged” could mean only a body skeleton. Keep this as an unverified lead, not a recommendation; no file was acquired.

Neither an uploader's Creative Commons declaration nor a tool's output license independently establishes permission from Marvel or the actor. No such permission was found here. These are documented provenance gaps, not a determination about the project's legal status.

## Smallest honest next visual trial

1. **Mechanics control:** use the verified CC0 example at the intended face scale. Drive a slow continuous left/right turn, quick reversal, independent eye aim, blink, brow raise and one-sided smile. Label it “generic rig control.” The question is whether 3D motion/expression feels right, not whether this avatar looks like Tony.
2. **Likeness trial:** author one rough male MPFB head using the same rig and replay the same movement under the HUD lighting. Judge recognizable proportions, goatee, eyes and profile during motion. If only one trial is worth doing, invest in this authored male head; the generic control is optional and cannot resolve likeness.

Keep the visual decision open for the human. Acceptable goofiness permits stylization, but it does not erase the stated Tony target. Do not compare a generic avatar against the generated Tony stills and conclude that either wins on likeness. No subscription, API charge or paid model is needed to test the free route; the cost is authoring time.
