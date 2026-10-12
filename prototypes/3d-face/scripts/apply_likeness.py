"""Fit a generated diffuse portrait to the animated front-face surface.

The coordinates are neutral-pose anatomical landmarks in Blender metres.
UVs remain attached to vertices, so the image deforms with the facial rig.
This is deliberately a limited-angle projection, not a full head texture.
"""
from pathlib import Path
import bpy


def apply_likeness(root, base, assets):
    portrait = Path(assets) / "tony-diffuse.jpg"
    if not portrait.exists():
        raise RuntimeError(f"Missing generated portrait texture: {portrait}")
    # Fine brows, lashes and goatee are now in the diffuse photograph. Removing
    # their old cards also removes the chunky silhouettes and alpha overdraw.
    for obj in list(root.children_recursive):
        if obj.type == "MESH" and any(s in obj.name.lower() for s in ("beard", "eyebrow", "eyelash")):
            bpy.data.objects.remove(obj, do_unlink=True)

    uv = base.data.uv_layers.active or base.data.uv_layers.new(name="Portrait")
    for loop in base.data.loops:
        p = base.matrix_world @ base.data.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (0.5 + p.x * 4.38, 1 - (0.410 + (1.626 - p.z) * 4.18))

    mat = bpy.data.materials.new("Tony_Portrait_Skin")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    skin = nodes.get("Principled BSDF")
    skin.inputs["Roughness"].default_value = 0.64
    skin.inputs["Specular IOR Level"].default_value = 0.28
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(portrait), check_existing=True)
    texture.image.pack()
    texture.extension = "EXTEND"
    mat.node_tree.links.new(texture.outputs["Color"], skin.inputs["Base Color"])
    base.data.materials.clear()
    base.data.materials.append(mat)
    for polygon in base.data.polygons:
        polygon.material_index = 0

    # Match the photographic iris/sclera to the separate eyeballs. These UVs
    # rotate with the eye bones, preserving independent gaze. The tiny allowed
    # angles hide the projection boundary behind the animated lids.
    for obj in root.children_recursive:
        if obj.type == "MESH" and "high-poly" in obj.name:
            eye_uv = obj.data.uv_layers.active
            for loop in obj.data.loops:
                p = obj.matrix_world @ obj.data.vertices[loop.vertex_index].co
                eye_uv.data[loop.index].uv = (0.5 + p.x * 4.38, 1 - (0.410 + (1.626 - p.z) * 4.18))
            eye_material = mat.copy()
            eye_material.name = "Tony_Brown_Eyes"
            obj.data.materials.clear()
            obj.data.materials.append(eye_material)
            for polygon in obj.data.polygons:
                polygon.material_index = 0

