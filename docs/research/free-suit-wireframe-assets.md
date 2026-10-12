# Free suit geometry for the HUD inset

Researched 2026-10-12 for the interactive HUD prototype. The target is a small, rotatable suit schematic, with selected body regions opening real controls or content. We need actual licensed mesh data, not a screenshot or a hand-drawn silhouette.

## Recommendation

Use **2iemniak's Iron man Mark 7 armors** as the preferred source if a free BlendSwap login is available. The author describes modeling the armor and links their work-in-progress thread, which gives it stronger provenance than unattributed downloads. For the quickest glTF pipeline, try **arnavkajjewad2008's Iron Man Suit** on Sketchfab. Both have free listings and allow adaptations with attribution; neither source file was acquired in this research pass because its download requires a login.

No directly downloadable, sufficiently attributed full-suit asset was established. Do not substitute a random GitHub GLB merely because it is publicly reachable.

| Candidate | Verified facts | Download/access | Assessment |
| --- | --- | --- | --- |
| [Iron man Mark 7 armors — 2iemniak](https://blendswap.com/blend/6708) | Free, CC-BY, Blender 2.6x, 3.47 MB listing. Three armor variants. Author says it is unrigged and documents creating it. | [Download page](https://blendswap.com/blend/6708/download) requires a free account. Exact internal mesh counts are unverified. | Best provenance. Download the original `.blend`; we can disable script execution, strip lighting/materials/duplicate variants, simplify, and extract useful edges offline. Rig and textures unnecessary for this inset. |
| [Iron Man Suit — arnavkajjewad2008](https://sketchfab.com/3d-models/iron-man-suit-d6b97e705edb4b98a3cdb3856ccfe2d2) | Public API confirms downloadable, 20,810 triangles, 10,468 vertices, zero animation clips, CC BY 4.0. Listing advertises FBX. | Sketchfab login required. Use converted GLB with the smallest texture size, if offered; textures will be discarded. Original FBX also usable. Actual download dialog/formats not inspected after login. | Good small geometry candidate. Creator claims a suit inspired by Marvel; no independent origin proof or rig inspection. Do not describe as a scanned or studio model. |

Sketchfab metadata was saved at `/private/tmp/ironman-suit-candidates/sketchfab-suit-metadata.json`, retrieved from the [official API](https://api.sketchfab.com/v3/models/d6b97e705edb4b98a3cdb3856ccfe2d2). API confirms the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). Credit the creator and source and state modifications; the platform license is not evidence of a separate Marvel endorsement or license.

Suggested credit for the Sketchfab candidate: “Iron Man Suit by arnavkajjewad2008, CC BY 4.0. Modified: materials and textures removed; geometry simplified and converted to a HUD schematic.” Keep the source link with that credit.

## Fallback and exclusions

- [Iron man MK3 — 2iemniak](https://blendswap.com/blend/2465): CC0, 387 KB `.blend`, no rig or textures. A particularly small alternative from the same creator. Its [download page](https://blendswap.com/blend/2465/download) also explicitly requires sign-in. File geometry uninspected.
- [Iron Man Mark 7 — Gource](https://sketchfab.com/3d-models/iron-man-mark-7-0217589c832a4384b2531c0eb69f7ba5): CC-BY, author describes making it, but listing reports 867,300 triangles / 437,000 vertices. Free, yet far more geometry than this inset needs. Offline simplification could make it viable, but no reason to prefer it first.
- [Iron Man blender Rig — JGCruz3d](https://www.patreon.com/jgcruz3d/posts/iron-man-blender-93127790): free `.blend` attachment and high/low resolution variants, but the author explicitly says the base model was found elsewhere and they lost its creator's name. Not a good redistribution source until provenance is resolved.
- [OpenFigure3D's MK3 articulated figure](https://www.printables.com/model/225299-iron-man-mk3-articulated-figure): free printable STL parts, but CC BY-NC-ND and an explicit request not to republish digital files. Avoid for a simplified, redistributed web schematic.
- [DaDave's printable MK6 suit](https://www.thingiverse.com/thing:1779274): many separate cosplay pieces, with upstream sources credited in the description. Thingiverse did not provide inspectable file/license data through the public page in this pass. Its derivative assembly/provenance is more work than either recommended candidate; not acquired.
- Random GitHub HUD projects containing `ironman.glb` often cite only “third-party models.” A repository MIT license does not establish rights to an embedded third-party mesh.

## Downloaded inspection-only example — do not ship

A small GLB is publicly available as an example in the [official Make-It-Animatable research repository](https://github.com/jasongzy/Make-It-Animatable), with data hosted [here](https://huggingface.co/jasongzy/Make-It-Animatable/tree/main/data/examples). It was downloaded only to inspect embedded provenance:

`/private/tmp/ironman-suit-candidates/ironman-research-example.glb` — 993,572 bytes.

The GLB contains one mesh named `Object.1_Material__33mat_0`, generated by Blender's glTF exporter, but **no copyright, author, or source metadata**. The research repo credits Mixamo generally and its model host declares Apache 2.0, while its code is MIT; neither establishes this individual character's creator or redistribution rights. This file has not been copied into the repo, used in the HUD, or approved for redistribution. No downloaded code was run.

## Lightweight conversion once source is supplied

1. Preserve the original archive/file outside the served assets and record creator/license.
2. Import with Blender auto-execution disabled. Keep one assembled suit and apply object transforms.
3. Remove textures, materials, animation, internal geometry, supports, and duplicate variants.
4. Simplify to an inset-appropriate silhouette, retaining faceplate, chest/arc reactor, shoulders, gauntlets, knees, and boots.
5. Export only quantized vertex positions and selected feature-edge pairs. Prefer armor panel boundaries and creases over every triangulation edge, to avoid a noisy triangle cage.
6. Project and draw those edges in the existing 2D HUD canvas. Cache stationary frames and redraw only on interaction; no additional WebGL context needed.
7. Give helmet/chest/arms/legs actual visible selectable regions tied to real functions. No fake diagnostics as filler.

The final byte count, line count, appearance, and cost must be measured after inspecting the actual mesh; the source listing's size alone is not a runtime performance claim.
