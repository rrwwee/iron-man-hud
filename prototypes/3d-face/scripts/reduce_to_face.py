"""Keep the visible front of the face and the controls this trial uses."""
import bpy
from pathlib import Path

USED_MORPHS = {
    "eyeBlinkLeft", "eyeBlinkRight", "browInnerUp", "browOuterUpLeft",
    "browOuterUpRight", "browDownLeft", "eyeWideLeft", "eyeWideRight",
    "eyeSquintLeft", "jawOpen", "mouthSmileLeft", "mouthSmileRight",
    "mouthDimpleLeft", "mouthPressLeft",
}


def reduce_to_face(root, base):
    # Hair, the collar and tongue are outside this front-only composition.
    for obj in list(root.children_recursive):
        if obj.type == "MESH" and any(word in obj.name.lower() for word in ("short01", "collar", "tongue", "teeth")):
            bpy.data.objects.remove(obj, do_unlink=True)

    # Edit-mode deletion propagates to every shape-key layer. No decimation of
    # eyelids/lips: their authored expression topology stays intact.
    bpy.ops.object.select_all(action="DESELECT")
    base.select_set(True)
    bpy.context.view_layer.objects.active = base
    for vertex in base.data.vertices:
        p = base.matrix_world @ vertex.co
        vertex.select = p.z < 1.495 or p.z > 1.77 or abs(p.x) > 0.073 or p.y > -0.012
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")

    meshes = [obj for obj in root.children_recursive if obj.type == "MESH"]
    for obj in meshes:
        if obj.data.shape_keys:
            for key in list(obj.data.shape_keys.key_blocks)[1:]:
                if key.name not in USED_MORPHS:
                    obj.shape_key_remove(key)
        # Only the head moves as a unit. Expressions come from the retained
        # morphs, so the full body/facial bone hierarchy is unnecessary.
        obj.vertex_groups.clear()
        if "high-poly" in obj.name:
            left = obj.vertex_groups.new(name="eye.L")
            right = obj.vertex_groups.new(name="eye.R")
            for vertex in obj.data.vertices:
                (left if vertex.co.x >= 0 else right).add([vertex.index], 1, "REPLACE")
        else:
            group = obj.vertex_groups.new(name="head")
            group.add(list(range(len(obj.data.vertices))), 1, "REPLACE")

    bpy.context.view_layer.objects.active = root
    bpy.ops.object.mode_set(mode="EDIT")
    keep = {"root", "head", "eye.L", "eye.R"}
    root.data.edit_bones["head"].parent = root.data.edit_bones.get("root")
    for name in ("eye.L", "eye.R"):
        root.data.edit_bones[name].parent = root.data.edit_bones["head"]
    for bone in list(root.data.edit_bones):
        if bone.name not in keep:
            root.data.edit_bones.remove(bone)
    bpy.ops.object.mode_set(mode="OBJECT")

    # The original full-resolution textures remain packed in the editable
    # source. The browser copy uses bounded-size maps.
    texture_dir = Path('/private/tmp/ironman-3d-tools/optimized-textures')
    texture_dir.mkdir(parents=True, exist_ok=True)
    for image in bpy.data.images:
        if image.source != "FILE":
            continue
        # Packed images may be lazily unloaded. Force pixel access rather than
        # skipping them based on has_data, and write a fresh encoded file so
        # glTF cannot reuse the original full-resolution packed bytes.
        _ = image.pixels[0]
        limit = 1024 if "middleage" in image.name.lower() else 256
        width, height = image.size
        if max(width, height) > limit:
            factor = limit / max(width, height)
            image.scale(max(1, round(width * factor)), max(1, round(height * factor)))
            image.filepath_raw = str(texture_dir / (image.name.replace('/', '_') + '.png'))
            image.file_format = 'PNG'
            image.save()
            image.pack()

    # One material per mesh, except where an actually used material differs.
    # Unused undersuit slots are not exported by glTF.
    return meshes
