# Kitesurf equipment

`kitesurf-gear.json` is the default HUD equipment model. Its garment, harness and metal hardware were procedurally authored for this project; it contains no downloaded commercial mesh or product photography textures.

Appearance references:

- Owner's order: 2021 O’Neill Epic 5/4 Chest Zip, medium, Black/Black, item `5370-A00-M`.
- [O’Neill Epic 5370 product page](https://eu.oneill.com/products/epic-5-4mm-chest-zip-full-wetsuit-men-black-black): chest entry, smoothskin panels and knee-pad placement.
- Owner-supplied rear photograph of a navy Mystic Warrior with mint lower piping. The owner wears medium; the pictured item's size and model year are unconfirmed. The model follows the photo's appearance rather than assuming the current Warrior version.
- [Matched Warrior Night Blue photo set](https://kitesurfwarehouse.com/products/mystic-warrior-waist-harness-2021-night-blue): the rear matches the supplied appearance and the paired front guides the original-style spreader, black pad, buckles and downturned twin-rail hook. The owner confirms their original bar. The exact Clickerbar revision remains unconfirmed.

This is a visual approximation, not a manufacturer CAD model or measurement-accurate fit. Brand/product names identify the equipment being depicted and do not imply endorsement.

Editable build scripts are tracked in `tools/kitesurf/`. Blender scene, GLB and review renders are retained locally in the Git-ignored `.private-assets/kitesurf-gear/` folder. Product photos used for reference remain there and are not served by the site.

The runtime batches surfaces and deliberate seam/hardware outlines. Scroll separates the wetsuit into sewn panels; their seam and trim geometry follows the same offsets. The harness back and sides move rearward while its front pad and metal spreader hardware move forward. Both HUD layouts share the same model and preserve the GitHub/Codex activity instruments.

Revision 2 has 20 actual sewn-panel groups, 76 parts and 22,102 triangles. The complete source garment surface is partitioned without an intact duplicate underneath. Interpolated source normals retain smooth assembled shading; hidden pattern boundaries are modelling interpretations rather than manufacturer sewing patterns.
