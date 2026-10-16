# A permitted human head base and a stronger likeness workflow

Research date: 15 October 2026. Scope: no-cost bases and an expert-style workflow for the owner's likeness. No new assets were downloaded or site files changed for this research.

## Best verified bases

**Blender Studio Human Base Meshes is the strongest alternative to try.** Blender's official download page currently lists **v1.4.1**, approximately 49 MB, under **CC0**, requiring Blender 4.2 LTS or newer. The official download directory also contains that version. The date displayed on the download card is inconsistent with the directory, so use the version identifier, not the card's date, when documenting provenance. [Official download listing](https://www.blender.org/download/demo-files/), [official file directory](https://download.blender.org/demo/asset-bundles/human-base-meshes/).

The bundle includes useful topology rather than a promise of any particular person's likeness. Official release notes document a **Generic Head Topology** asset intended for deformation and sculpting, with sample head shape keys, and a **Planar Head** for reference/sculpting. The first-party asset repository separately names realistic animation and sculpting heads. These are sensible candidates to inspect in Blender before choosing the exact mesh. [Blender 4.0 asset release notes](https://developer.blender.org/docs/release_notes/4.0/asset_bundles/), [first-party asset publication commit](https://projects.staging.blender.org/blender/blender-assets/commit/3acc48c6cac871d4e530cf48fcca642c6aa2d105).

**MakeHuman/MPFB is already a permitted option.** Its official licence says core assets are CC0; exported models may be modified and used commercially without a fee. Optional third-party/community assets require separate checking. Switching away from MPFB can improve the starting anatomy or topology but does not, by itself, solve the failed likeness. [Licence](https://static.makehumancommunity.org/about/license.html), [export FAQ](https://static.makehumancommunity.org/makehuman/faq/can_i_sell_models_created_with_makehuman.html).

Do not confuse the current CC0 bundle with the older **realistic_human_base.blend** linked from a training page: that older download is explicitly **CC-BY**. [Older training base](https://studio.blender.org/training/realistic-human-research/use-of-base-meshes/).

## How an expert would approach this

The central change is **geometry first, judged in multiple views**. A frontal image projected onto a generic face can look convincing from one camera while retaining the wrong skull depth, jaw silhouette, eye sockets or nose profile. A landmark fit is a useful initial constraint, not proof that the volume matches the subject. This is a technical interpretation of the failed method described in the task, rather than a result of inspecting new captures here.

Blender Studio's production guidance starts from a base, establishes proportions before details, uses references and feedback, retains natural facial asymmetry, and approves the design sculpt before downstream work. Its retopology guidance permits a reusable generic human topology and warns that late topology changes create considerable rework. [Design sculpting](https://studio.blender.org/training/realistic-human-research/design-sculpting/), [retopology](https://studio.blender.org/training/realistic-human-research/retopology/).

Recommended no-paid-tools plan:

1. Extract sharp neutral front, profile and three-quarter frames from the existing video. Compare camera perspective and expression rather than treating differently posed frames as orthographic measurements. Use ratios until an actual scale measurement is available; do not claim millimetre accuracy from an uncalibrated video.
2. Inspect the Blender Studio realistic animation head and generic head. Keep a clean original. Fit head width/depth, forehead, cheekbones, jaw/chin, nose profile, eye positions, mouth and ears. Use all reference views, not just frontal landmarks.
3. Produce **untextured clay renders** at front, both profiles and both three-quarter views plus a turntable. Require a recognisable likeness here before adding realistic skin. This prevents a texture from concealing a bad fit.
4. Lock workable animation topology and UVs. If a high-resolution sculpt is used, fit the low-resolution animation mesh to it and bake detail; retaining the base topology can avoid unnecessary full retopology. Blender Studio discusses reusable topology and detail baking in its production workflow. [Workflow overview](https://studio.blender.org/training/realistic-human-research/).
5. Build skin colour from the user's real frames across multiple angles; remove temporary blemishes locally while retaining normal skin texture. Avoid an AI-generated replacement face as the source of identity. Blender supports projection/clone painting, allowing controlled cleanup rather than global blur. [Texture paint tools](https://docs.blender.org/manual/en/5.0/sculpt_paint/texture_paint/brushes.html).
6. Match hairline, hair silhouette, eyebrows and eyeball size/placement as their own geometry/material tasks. Fit blinks and a modest smile to the new eyelids and mouth. Review intermediate animation values and multiple angles; Blender's own facial-shape production notes describe this checking process. [Sintel facial blendshapes](https://durian.blender.org/news/sintel-facial-blendshapes).
7. Export a web-resolution GLB with baked textures and only necessary morph targets, then compare both the neutral and animated face in the actual HUD lighting. Blender's glTF exporter supports meshes, textures, skinning and shape keys. [Official exporter manual](https://docs.blender.org/manual/en/5.1/addons/import_export/scene_gltf2.html).

## Capture alternative and limitations

A proper 3D scan can provide measured surface shape to fit the base onto; it is a different operation from putting a photograph on a mesh. AliceVision describes photogrammetry as recovering geometry from multiple photographs/video through structure-from-motion and multi-view stereo. However, the current Meshroom download page offers Windows/Linux, not a straightforward supported Mac download. It should not be promised as a one-click route on this laptop. [AliceVision pipeline](https://alicevision.org/view/home.html), [Meshroom downloads](https://meshroom.org/download/).

The immediate practical recommendation is therefore **manual multi-view fitting in Blender using the existing footage**, with an early clay-render review. Free tools and CC0 anatomy solve cost and base-asset permission, but the likeness still requires skilled modelling and visual iteration; a single automatic pass should not be advertised as an expert result.
