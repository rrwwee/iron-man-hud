"""Build an MPFB male bust and facial rig using only free local assets.

Run with Blender 4.5+:
  blender --background --factory-startup --python /private/tmp/mpfb-builder-recipe.py

Set IRONMAN_MPFB_SRC to the directory containing the `mpfb` Python package.
Default: /private/tmp/ironman-3d-tools/mpfb2-2.0.18/src
Place official makehuman_system_assets_cc0.zip and faceunits01.zip in
IRONMAN_PACK_DIR (default /private/tmp/ironman-3d-tools).
No network access or persistent/global Blender install is performed here.
Executed and visually checked with Blender 4.5.3 / MPFB 2.0.18.
"""

import os
import sys
import json
import zipfile
import importlib
import struct
from pathlib import Path

import bpy
bpy.context.preferences.filepaths.save_version = 0

TOOLS = Path(os.environ.get("IRONMAN_TOOLS", "/private/tmp/ironman-3d-tools"))
SOURCE = Path(os.environ.get("IRONMAN_MPFB_SRC", str(TOOLS / "mpfb2-2.0.18/src")))
PACKS = Path(os.environ.get("IRONMAN_PACK_DIR", str(TOOLS)))
USER = TOOLS / "mpfb-isolated-user"
DATA = USER / "data"
OUT = Path(os.environ.get("IRONMAN_FACE_OUT", str(Path(__file__).resolve().parents[1] / "assets")))
DATA.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

# Official pack URLs:
# https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
# https://files.makehumancommunity.org/functional/faceunits01.zip
# Optional CC0 beards: https://files.makehumancommunity.org/asset_packs/bodyparts05/bodyparts05_cc0.zip
# These archives contain data only. Extraction validates all destinations.
for pattern in ("*system*assets*.zip", "*faceunits01*.zip", "*bodyparts05*.zip"):
    candidates = sorted(PACKS.glob(pattern))
    if not candidates:
        raise RuntimeError(f"Required official asset pack missing: {PACKS / pattern}")
    archive = candidates[0]
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            dest = (DATA / info.filename).resolve()
            if not dest.is_relative_to(DATA.resolve()):
                raise RuntimeError(f"Unsafe archive path: {info.filename}")
        z.extractall(DATA)

# MPFB's source distribution can run as package `mpfb`; its location service
# calls an extension-only Blender path API. Redirect that one package's data
# directory in this disposable process, never the user's persistent settings.
sys.path.insert(0, str(SOURCE))
original_extension_path_user = bpy.utils.extension_path_user
def isolated_extension_path_user(package, *args, **kwargs):
    if package == "mpfb":
        path = USER / kwargs.get("path", "")
        if kwargs.get("create", False):
            path.mkdir(parents=True, exist_ok=True)
        return str(path)
    return original_extension_path_user(package, *args, **kwargs)
bpy.utils.extension_path_user = isolated_extension_path_user
addon_entry = bpy.context.preferences.addons.get("mpfb")
if addon_entry is None:
    addon_entry = bpy.context.preferences.addons.new()
    addon_entry.module = "mpfb"
mpfb = importlib.import_module("mpfb")
mpfb.register()

from mpfb.services.humanservice import HumanService
from mpfb.services.targetservice import TargetService
from mpfb.services.faceservice import FaceService
from mpfb.services.exportservice import ExportService
from mpfb.services.assetservice import AssetService
from mpfb.services.objectservice import ObjectService

AssetService.update_all_asset_lists()
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

macro = TargetService.get_default_macro_info_dict()
# Source macro.json maps 0=female, 1=male. The generated API example's comment
# describing 1 as female is wrong; use the source's explicit interpolation.
macro.update(gender=1.0, age=0.65, muscle=0.58, weight=0.45,
             proportions=0.52, height=0.50)
macro["race"] = {"caucasian": 0.90, "asian": 0.05, "african": 0.05}
base = HumanService.create_human(
    mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True,
    feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
base.name = "TonyInspired_Base"

# Modest likeness direction: longer, narrower head, defined pointed chin,
# slightly prominent narrow bridge. These are artistic starting values, not
# a validated RDJ preset; all are bundled MPFB modeling target filenames.
details = {
    "head-scale-vert-incr": 0.05,
    "head-scale-horiz-decr": 0.11,
    "head-rectangular": 0.10,
    "head-fat-decr": 0.07,
    "chin-width-decr": 0.08,
    "chin-triangle": 0.14,
    "chin-prominent-incr": 0.10,
    "nose-scale-depth-incr": 0.14,
    "nose-width1-decr": 0.10,
    "nose-curve-convex": 0.06,
    "mouth-upperlip-height-decr": 0.26,
    "mouth-lowerlip-height-decr": 0.22,
    "mouth-scale-depth-decr": 0.12,
    "eyebrows-angle-down": 0.10,
}
for name, weight in details.items():
    target = TargetService.target_full_path(name)
    if not target:
        raise RuntimeError(f"Expected bundled morphology target missing: {name}")
    TargetService.load_target(base, target, weight=weight)

# The standard rig is bundled and includes head, jaw and independent eye bones.
# No Rigify, Mixamo service or separately installed authoring scripts required.
rig = HumanService.add_builtin_rig(base, "default", import_weights=True)
rig.name = "TonyInspired_Rig"

def locate(name, required=True):
    found = sorted(DATA.rglob(name))
    if not found:
        if required:
            raise RuntimeError(f"Missing asset {name} under {DATA}")
        return None
    return str(found[0])

skin = locate("middleage_caucasian_male.mhmat")
HumanService.set_character_skin(skin, base, skin_type="GAMEENGINE", material_instances=False)

def equip(name, category, required=True):
    path = locate(name, required)
    if not path:
        return None
    obj = HumanService.add_mhclo_asset(
        path, base, asset_type=category, subdiv_levels=0,
        material_type="GAMEENGINE", set_up_rigging=True,
        interpolate_weights=True, import_subrig=True, import_weights=True)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

eyes = equip("high-poly.mhclo", "Eyes")
# Verified from the actual system archive: high-poly.mhclo names
# material ../materials/brown.mhmat (Eye_brown, brown_eye.png).
equip("teeth_base.mhclo", "Teeth", required=False)
equip("tongue01.mhclo", "Tongue", required=False)
equip("eyebrow001.mhclo", "Eyebrows", required=False)
equip("eyelashes01.mhclo", "Eyelashes", required=False)
hair = equip("short01.mhclo", "Hair")
beard = equip("grinsegold_beard_sigmund_wip.mhclo", "Clothes")

def dark_hair_material(obj, image_path, tint):
    # The beard source material says opacity 0.0 and references missing maps.
    # Use its actual diffuse alpha texture in an uncomplicated GLB-safe shader.
    mat = bpy.data.materials.new(obj.name + "_dark_hair")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(image_path, check_existing=True)
    multiply = nodes.new("ShaderNodeMixRGB")
    multiply.blend_type = "MULTIPLY"
    multiply.inputs[0].default_value = 1.0
    multiply.inputs[2].default_value = (*tint, 1.0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.8
    output = nodes.new("ShaderNodeOutputMaterial")
    cutoff = nodes.new("ShaderNodeMath")
    cutoff.operation = "GREATER_THAN"
    cutoff.inputs[1].default_value = 0.35
    links = mat.node_tree.links
    links.new(tex.outputs["Color"], multiply.inputs[1])
    links.new(multiply.outputs[0], bsdf.inputs["Base Color"])
    links.new(tex.outputs["Alpha"], cutoff.inputs[0])
    links.new(cutoff.outputs[0], bsdf.inputs["Alpha"])
    links.new(bsdf.outputs[0], output.inputs["Surface"])
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "DITHERED"
    if hasattr(mat, "blend_method"):
        mat.blend_method = "CLIP"
    mat.use_backface_culling = False
    obj.data.materials.clear()
    obj.data.materials.append(mat)

dark_hair_material(hair, locate("short01_diffuse.png"), (0.28, 0.19, 0.13))
dark_hair_material(beard, locate("Material_Diffuse_Color1_d.png"), (0.12, 0.07, 0.045))

def solid_alpha(node_tree):
    # MPFB game materials connect texture alpha even for opaque skin/eyes.
    # Remove it so Three.js cannot sort teeth or eyes in front of the face.
    for node in node_tree.nodes:
        if node.type == "GROUP" and node.node_tree:
            solid_alpha(node.node_tree)
        if node.type == "BSDF_PRINCIPLED":
            socket = node.inputs.get("Alpha")
            for link in list(socket.links):
                node_tree.links.remove(link)
            socket.default_value = 1.0

for obj in [base, eyes, *rig.children_recursive]:
    if obj.type != "MESH" or any(s in obj.name.lower() for s in ("hair", "short02", "beard", "eyebrow", "eyelash")):
        continue
    for mat in obj.data.materials:
        if mat and mat.use_nodes:
            solid_alpha(mat.node_tree)

for poly in base.data.polygons:
    poly.use_smooth = True

# A dark undersuit keeps the visual trial focused on the face.
undersuit = bpy.data.materials.new("Dark_Undersuit")
undersuit.use_nodes = True
undersuit.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (0.008, 0.017, 0.024, 1)
undersuit.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = 0.85
base.data.materials.append(undersuit)
for poly in base.data.polygons:
    if all((base.matrix_world @ base.data.vertices[i].co).z < 1.43 for i in poly.vertices):
        poly.material_index = len(base.data.materials)-1

# A smooth crew-neck ring covers the deliberately coarse material boundary.
bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=10,
                               major_radius=0.074, minor_radius=0.025,
                               location=(0, 0.018, 1.455))
collar = bpy.context.object
collar.name = "Undersuit_Collar"
collar.data.materials.append(undersuit)
for poly in collar.data.polygons:
    poly.use_smooth = True
collar.parent = rig
bpy.context.view_layer.update()

# Keep the editable modeling targets and original rig in the .blend source.
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "tony-head-source.blend"))

copy_root = ExportService.create_character_copy(base, name_suffix="_export")
copy_base = ObjectService.find_object_of_type_amongst_nearest_relatives(copy_root)
# Follow the source of the Export Copy operator in this order.
TargetService.bake_targets(copy_base)
FaceService.load_targets(copy_base, load_microsoft_visemes=False,
                         load_meta_visemes=False, load_arkit_faceunits=True)
FaceService.interpolate_targets(copy_base)
# The system eye asset contains a corneal overlay mapped to the violet,
# transparent corner of brown_eye.png. We use opaque eye rendering, so remove
# only those overlay polygons, keeping the textured eyeball/iris beneath.
# Do this after interpolation so original MHCLO indices remain meaningful.
import bmesh
copy_eyes = bpy.data.objects.get(eyes.name + "_export")
if copy_eyes is None or not copy_eyes.data.uv_layers.active:
    raise RuntimeError("Expected exported eyes and active UV map missing")
ObjectService.activate_blender_object(copy_eyes, deselect_all=True)
bpy.ops.object.mode_set(mode="EDIT")
bm = bmesh.from_edit_mesh(copy_eyes.data)
uv_layer = bm.loops.layers.uv.active
cornea_faces = [face for face in bm.faces
                if all(loop[uv_layer].uv.x > 0.84 and loop[uv_layer].uv.y < 0.18
                       for loop in face.loops)]
print("Removed opaque cornea overlay polygons:", len(cornea_faces))
bmesh.ops.delete(bm, geom=cornea_faces, context="FACES_ONLY")
bmesh.update_edit_mesh(copy_eyes.data)
bpy.ops.object.mode_set(mode="OBJECT")
# Trim the full beard to a central moustache/goatee only AFTER interpolation;
# doing this earlier would invalidate MHCLO vertex correspondence indices.
copy_beard = bpy.data.objects.get(beard.name + "_export")
if copy_beard is None:
    raise RuntimeError("Expected exported beard mesh missing")
ObjectService.activate_blender_object(copy_beard, deselect_all=True)
xs = [abs((copy_beard.matrix_world @ v.co).x) for v in copy_beard.data.vertices]
keep_half_width = max(xs) * 0.48
for vertex, x in zip(copy_beard.data.vertices, xs):
    vertex.select = x > keep_half_width
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.delete(type="VERT")
bpy.ops.object.mode_set(mode="OBJECT")
ExportService.bake_modifiers_remove_helpers(
    copy_base, bake_masks=True, bake_subdiv=False,
    remove_helpers=True, also_proxy=True)

# Optional head/shoulder crop. Blender edit-mode topology deletion propagates
# through the shape-key layers; avoid generic decimation/apply-modifier here.
if os.environ.get("IRONMAN_CROP_BUST", "1") == "1":
    ObjectService.activate_blender_object(copy_base, deselect_all=True)
    vertices = copy_base.data.vertices
    heights = [(copy_base.matrix_world @ v.co).z for v in vertices]
    cut = min(heights) + (max(heights) - min(heights)) * 0.69
    for v, height in zip(vertices, heights):
        v.select = height < cut
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")

copy_root.name = "TonyInspired"
copy_base.name = "TonyInspired_Face"
expected = {"eyeBlinkLeft", "eyeBlinkRight", "mouthSmileLeft", "mouthSmileRight", "browInnerUp"}
names = {k.name for k in copy_base.data.shape_keys.key_blocks}
if not expected.issubset(names):
    raise RuntimeError(f"Missing expression controls: {expected - names}")
objects = [copy_root, *copy_root.children_recursive]
for obj in objects:
    if obj.type == "MESH" and obj.data.shape_keys:
        for key in obj.data.shape_keys.key_blocks:
            key.value = 0.0
bpy.ops.object.select_all(action="DESELECT")
for obj in objects:
    obj.hide_set(False)
    obj.hide_render = False
    obj.select_set(True)
bpy.context.view_layer.objects.active = copy_root
bpy.ops.export_scene.gltf(
    filepath=str(OUT / "tony-head.glb"), export_format="GLB",
    use_selection=True, export_animations=False,
    export_skins=True, export_morph=True, export_morph_normal=True,
    export_yup=True, export_extras=False)

# glTF exports the legacy MixRGB texture but can omit its multiplicative tint.
# Preserve the intended material colour explicitly as standard glTF factors.
glb_path = OUT / "tony-head.glb"
glb = glb_path.read_bytes()
json_len = struct.unpack_from("<I", glb, 12)[0]
gltf = json.loads(glb[20:20 + json_len])
for mat in gltf.get("materials", []):
    label = mat.get("name", "").lower()
    if label.endswith("_dark_hair"):
        tint = [0.12, 0.07, 0.045, 1.0] if "beard" in label else [0.28, 0.19, 0.13, 1.0]
        mat.setdefault("pbrMetallicRoughness", {})["baseColorFactor"] = tint
    elif not any(s in label for s in ("eyebrow", "eyelash")):
        mat["alphaMode"] = "OPAQUE"
        mat.pop("alphaCutoff", None)
encoded = json.dumps(gltf, separators=(",", ":")).encode()
encoded += b" " * (-len(encoded) % 4)
remaining_chunks = glb[20 + json_len:]
total = 12 + 8 + len(encoded) + len(remaining_chunks)
glb_path.write_bytes(struct.pack("<III", 0x46546c67, 2, total) +
                     struct.pack("<II", len(encoded), 0x4e4f534a) + encoded + remaining_chunks)

summary = {
    "source": "MakeHuman MPFB 2.0.18 + MakeHuman system CC0 assets + CC0 faceunits01",
    "description": "Rough authored Tony-inspired head, not a scan or validated actor likeness",
    "macro": macro, "details": details,
    "bones": [bone.name for bone in copy_root.data.bones],
    "morphs": sorted(names - {"Basis"}),
    "meshes": [{"name": obj.name, "vertices": len(obj.data.vertices)}
               for obj in objects if obj.type == "MESH"],
}
(OUT / "tony-head-build.json").write_text(json.dumps(summary, indent=2))
print("IRONMAN_BUILD_COMPLETE", str(OUT / "tony-head.glb"))
