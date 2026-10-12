# Nathang30 Tony Stark model audit

Research date: 2026-10-12. Question: can this free likeness replace the current Face's generic geometry without losing lightweight turns, eye movement, blinking and expressions?

## Finding

**A credible free geometry candidate, but not a verified drop-in animated Face.** The public preview has recognizable Tony/RDJ facial proportions in front and three-quarter views. Its facial outline and nose keep their volume when the model rotates. The preview still looks like a photographic texture on a relatively simple character, rather than a film-quality facial asset. These are visual judgments from the [author's public viewer](https://sketchfab.com/models/86c267264a2e4903b8c2bcc1b972cb74/embed), not a comparison rendered in our HUD.

The [author's listing](https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74) offers a free download. Clicking its download control during this audit opened a Sketchfab login dialog; no account was created or used, and no model binary was downloaded. The public listing and API do not establish facial rigging, morph targets, independent eyeballs, or useful eyelid topology.

## Verified metadata

Read directly from the [public Sketchfab model API](https://api.sketchfab.com/v3/models/86c267264a2e4903b8c2bcc1b972cb74), on the research date:

| Field | Value |
| --- | --- |
| Author / title | Nathang30 / Tony Stark |
| Downloadable | `true` |
| Faces / vertices | 68,484 / 34,694 (the listing describes faces as triangles) |
| Materials / textures | 4 / 6 |
| Animation clips | 0 |
| Published / last updated | 2021-06-21 / 2023-03-06 |
| License | CC BY-NC-SA 4.0 |

The preview is a full character in a suit. Consequently the total triangle count is not the head-only cost. Removing the body could reduce it, but no head count, texture dimensions, archive bytes or final browser cost was verified. Zero animation clips does **not** imply zero bones or morphs.

## Source and access limits

In a comment on the [same listing](https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74), the author says they built the suit in Blender, used Substance for textures, and used an RDJ picture as both head reference and texture. This supports a photographic authoring route; it does not establish an actor scan, multi-angle capture, or accurate anatomy beneath the texture.

The [official Download API documentation](https://sketchfab.com/developers/download-api) requires a Sketchfab account and describes glTF, GLB and USDZ delivery, rather than original FBX/OBJ files through that API. Those are platform capabilities, not confirmation of this individual model's available files. Its native source format and individual download options remain unknown behind login. The [download procedure](https://sketchfab.com/developers/download-api/downloading-models) requires an authenticated download request before receiving temporary archive links; that boundary was respected.

## License implications for this trial

The model API links **CC BY-NC-SA 4.0**. It permits adapting the asset with creator credit, license link and change notices; use is noncommercial, and distributed adaptations must use the same or a compatible license. This is not a blanket license for unrelated code. See the [license deed and legal-code link](https://creativecommons.org/licenses/by-nc-sa/4.0/). Its notice also states that publicity, privacy and other rights may require additional permission. No independent actor/Marvel or photographic-source permission was verified.

## Recommended next gate

Only promote this candidate after inspecting a legitimately downloaded archive: isolate the head; count head triangles and actual bytes; inspect UVs, texture resolution, eye objects, bones and nonempty morphs; then render a neutral turn and blink under the existing HUD. If it lacks a facial rig, it may still supply a better base shape, but eye/eyelid integration and expression authoring are separate work. Do not promise the existing 0.96 MB budget or natural blinking from the listing alone.

This audit did not change the prototype or publish/download the candidate. Research context: [earlier free asset investigation](free-3d-face-assets.md).
