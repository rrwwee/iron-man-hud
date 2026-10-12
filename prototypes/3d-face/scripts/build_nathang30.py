"""Disposable head trial. Run with Blender --background --factory-startup --disable-autoexec.

Reads the user's preserved GLB; never executes content from the download.
Keeps the original UVs and fitted eye surfaces, instead of adding floating plates.
"""
from pathlib import Path
import bpy
import bmesh
import json
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'source-assets/nathang30/tony_stark.glb'))
head = next(o for o in bpy.data.objects if o.type == 'MESH' and len(o.data.vertices) > 20000)
for o in list(bpy.data.objects):
    if o != head and o.type != 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.objects.active = head
head.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
head.parent = None
bm = bmesh.new()
bm.from_mesh(head.data)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00001)
bm.to_mesh(head.data)
bm.free()

# Identify connected anatomy, not spatial slices through the eyeballs.
mesh = head.data
links = [[] for _ in mesh.vertices]
for edge in mesh.edges:
    a, b = edge.vertices
    links[a].append(b)
    links[b].append(a)
unseen = set(range(len(links)))
components = []
while unseen:
    todo = [unseen.pop()]
    component = set()
    while todo:
        i = todo.pop()
        component.add(i)
        for j in links[i]:
            if j in unseen:
                unseen.remove(j)
                todo.append(j)
    components.append(component)
components.sort(key=len, reverse=True)
assert [len(c) for c in components[:3]] == [14850, 422, 422], 'Unexpected source topology'

parts = []
for name, keep in zip(('Face', 'EyeLeft', 'EyeRight'), components[:3]):
    obj = bpy.data.objects.new(name, mesh.copy())
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    remove = [v for v in bm.verts if v.index not in keep]
    bmesh.ops.delete(bm, geom=remove, context='VERTS')
    if name == 'Face':
        # Preserve cheek/temple volume for 35-degree turns; discard ears, neck,
        # rear scalp and the top hair outside the cinematic frame.
        remove = [v for v in bm.verts if v.co.z < .795 or v.co.z > 1.06
                  or v.co.y > .035 or abs(v.co.x) > .092]
        bmesh.ops.delete(bm, geom=remove, context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if name == 'Face':
        decimate = obj.modifiers.new('Preserve silhouette, reduce hidden detail', 'DECIMATE')
        decimate.ratio = .34
        bpy.ops.object.modifier_apply(modifier=decimate.name)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    parts.append(obj)
bpy.data.objects.remove(head, do_unlink=True)

def gaussian(x, z, cx, cz, rx, rz):
    return math.exp(-2 * (((x-cx)/rx)**2 + ((z-cz)/rz)**2))

face = parts[0]
face.shape_key_add(name='Basis')
for eye, cx, side in ((parts[1], -.0345, 'Left'), (parts[2], .0385, 'Right')):
    eye.shape_key_add(name='Basis')
    closed = eye.shape_key_add(name='eyeBlink'+side)
    for vertex, dest in zip(eye.data.vertices, closed.data):
        x, y, z = vertex.co
        if y < -.078:
            # Retract the central dome into the socket as the lid closes.
            # The boundary stays fitted to the surrounding original skin.
            weight = math.exp(-2*(((x-cx)/.014)**2+((z-.925)/.014)**2))
            dest.co.y += .009*weight
targets = ('browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
           'browDownLeft', 'mouthSmileLeft', 'mouthSmileRight', 'jawOpen')
for name in targets:
    key = face.shape_key_add(name=name)
    for v, dest in zip(face.data.vertices, key.data):
        x, y, z = v.co
        front = max(0, min(1, (-y-.015)/.045))
        if name == 'browInnerUp':
            w = gaussian(x, z, 0, .955, .035, .027) * front
            dest.co.z += .008*w
        elif name.startswith('browOuter') or name == 'browDownLeft':
            side = -1 if name.endswith('Left') else 1
            w = gaussian(x, z, side*.039, .958, .025, .022) * front
            dest.co.z += (-.006 if name == 'browDownLeft' else .008)*w
        elif name.startswith('mouthSmile'):
            side = -1 if name.endswith('Left') else 1
            w = gaussian(x, z, side*.026, .854, .027, .027) * front
            dest.co.z += .006*w
            dest.co.x += side*.002*w
        elif name == 'jawOpen':
            w = max(0, min(1, (.857-z)/.029)) * front
            dest.co.z -= .007*w
            dest.co.y += .002*w

# One 2k atlas for skin, hair and both eyes. A separate matched generated
# eyelid strip supplies closed eyes; the unused eye atlas islands are seams.
source_image = next(n.image for n in face.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE')
source_image.scale(2048, 1024)
source_image.file_format = 'JPEG'
source_image.filepath_raw = str(OUT / 'nathang30-atlas.jpg')
source_image.save()
atlas = bpy.data.images.load(str(OUT / 'nathang30-atlas.jpg'), check_existing=False)
material = face.data.materials[0]
material.name = 'Nathang30_Photo_Skin'
for node in material.node_tree.nodes:
    if node.type == 'TEX_IMAGE':
        node.image = atlas
bsdf = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .72
bsdf.inputs['Specular IOR Level'].default_value = .12
material.use_backface_culling = True

# Standardize to the previous viewer's scale and eye height. glTF is Y-up.
for obj in parts:
    if obj.data.shape_keys:
        for key in obj.data.shape_keys.key_blocks:
            for vertex in key.data:
                vertex.co.x *= .78
                vertex.co.y *= .78
                vertex.co.z = (vertex.co.z-.925)*.78 + 1.626
    else:
        for vertex in obj.data.vertices:
            vertex.co.x *= .78
            vertex.co.y *= .78
            vertex.co.z = (vertex.co.z-.925)*.78 + 1.626
    obj['source'] = 'Tony Stark by Nathang30, CC BY-NC-SA 4.0'
    obj['modified'] = 'Head isolated, reduced, custom subtle expression morphs, atlas resized'

bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
atlas.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'source-assets/nathang30/head-trial.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT / 'nathang30-head.glb'), export_format='GLB',
    use_selection=True, export_animations=False, export_morph=True,
    export_image_format='JPEG', export_jpeg_quality=90, export_extras=True)
report = {'source_triangles': 68484, 'source_head_triangles': 43132,
          'license': 'CC-BY-NC-SA-4.0', 'custom_morphs': list(targets),
          'blink_morphs': ['eyeBlinkLeft', 'eyeBlinkRight'],
          'parts': [{'name': o.name, 'vertices': len(o.data.vertices),
                     'triangles': sum(len(p.vertices)-2 for p in o.data.polygons)} for o in parts],
          'atlas': [2048,1024], 'bytes': (OUT/'nathang30-head.glb').stat().st_size}
(OUT/'nathang30-build.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
