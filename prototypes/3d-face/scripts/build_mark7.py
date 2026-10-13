"""Extract one low-cost armor wireframe; run Blender with --disable-autoexec."""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
parts=[]; original=0
for ob in list(bpy.data.objects):
 if ob.type!='MESH' or abs(ob.matrix_world.translation.x)>1.5 or not len(ob.data.vertices):continue
 original+=len(ob.data.polygons)
 # Keep mirror geometry, omit subdivision and split normals for the wireframe.
 for m in list(ob.modifiers):
  if m.type!='MIRROR':ob.modifiers.remove(m)
 bpy.context.view_layer.objects.active=ob
 dec=ob.modifiers.new('HUD reduction','DECIMATE');dec.ratio=.025 if len(ob.data.polygons)>1500 else .12 if len(ob.data.polygons)>500 else .35
 mesh=ob.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
 bm=bmesh.new();bm.from_mesh(mesh)
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0005)
 bmesh.ops.dissolve_limit(bm,angle_limit=math.radians(8),verts=list(bm.verts),edges=list(bm.edges),delimit={'MATERIAL'})
 bm.verts.ensure_lookup_table();bm.verts.index_update();bm.edges.ensure_lookup_table();bm.normal_update()
 verts=[ob.matrix_world@v.co for v in bm.verts]
 # Blender is Z-up and the suit faces -Y; convert to browser Y-up, +Z forward.
 normal_matrix=ob.matrix_world.to_3x3().inverted().transposed()
 normals=[(normal_matrix@v.normal).normalized() for v in bm.verts]
 vertices=[[round(v.x/6.63,5),round((v.z+.02)/6.63,5),round(-v.y/6.63,5)] for v in verts]
 edges=[]
 for e in bm.edges:
  if len(e.link_faces)!=2 or e.calc_face_angle(0)>math.radians(25) or e.link_faces[0].material_index!=e.link_faces[1].material_index:
   edges.extend([e.verts[0].index,e.verts[1].index])
 if edges:
  center=[sum(v[i] for v in vertices)/len(vertices) for i in range(3)]
  parts.append({'name':ob.name,'center':center,'vertices':vertices,'normals':[[round(n.x,4),round(n.z,4),round(-n.y,4)] for n in normals],'edges':edges})
 bm.free();ob.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
result={'creator':'2iemniak','source':'https://blendswap.com/blend/6708','parts':parts}
p=ROOT/'assets/mark7-wireframe.json';p.write_text(json.dumps(result,separators=(',',':')))
meta={'source_faces_one_variant':original,'parts':len(parts),'vertices':sum(len(p['vertices']) for p in parts),'line_segments':sum(len(p['edges'])//2 for p in parts),'bytes':p.stat().st_size,'modifications':'central variant; mirror evaluated; subdivision and split normals removed; adaptive decimation; planar dissolve; feature edges >25 degrees; Y-up; normalized height'}
(ROOT/'assets/mark7-build.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
