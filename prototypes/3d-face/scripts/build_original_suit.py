"""Author a fitted original exosuit from parametric shells and mechanical seams.
All geometry is generated here. No external character mesh is imported.
Set HUD_ORIGINAL_OUT to an assets directory for a separate review build.
"""
import bpy, json, math, os
from pathlib import Path
from mathutils import Vector, Quaternion
ASSETS=Path(os.environ.get('HUD_ORIGINAL_OUT',str(Path(__file__).resolve().parents[1]/'assets')))
ASSETS.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Ceramic, graphite and a restrained copper finish; colour does not carry the design.
colors={'shell':(.67,.72,.74),'joint':(.23,.36,.40),'signal':(.28,.87,.90),'ceramic':(.90,.85,.72),'copper':(.60,.29,.19)}
mats={}
for name,c in colors.items():
 m=bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1)
 bs.inputs['Metallic'].default_value=.68 if name not in ('joint','signal') else .25
 bs.inputs['Roughness'].default_value=.29 if name!='joint' else .6
 m.diffuse_color=(*c,1);mats[name]=m
parts=[]
def emit(name,points,faces,edges,color='shell'):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([(p[0],-p[2],p[1]) for p in points],[],faces);mesh.update()
 ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);mesh.materials.append(mats[color])
 for p in mesh.polygons:p.use_smooth=True
 center=[sum(p[i] for p in points)/len(points) for i in range(3)]
 parts.append({'name':name,'center':center,'color':colors[color],
  'vertices':[[round(v,6) for v in p] for p in points],
  'normals':[[round(v.normal.x,6),round(v.normal.z,6),round(-v.normal.y,6)] for v in mesh.vertices],
  'triangles':[i for f in faces for j in range(1,len(f)-1) for i in (f[0],f[j],f[j+1])],
  'edges':[i for edge in edges for i in edge]})
 return ob

def shell(name,center,rings,angles=(-math.pi,math.pi),steps=20,color='shell',axis=None,ribs=()):
 # Each ring defines y, transverse radius, depth radius, and depth offset.
 points=[];faces=[];edges=[]
 rotation=Vector((0,1,0)).rotation_difference(Vector(axis).normalized()) if axis else Quaternion()
 n=steps+1
 for y,rx,rz,z in rings:
  for j in range(n):
   a=angles[0]+(angles[1]-angles[0])*j/steps
   p=rotation@Vector((rx*math.sin(a),y,rz*math.cos(a)+z))
   points.append(tuple(p[i]+center[i] for i in range(3)))
 for k in range(len(rings)-1):
  for j in range(steps):
   a=k*n+j;faces.append((a,a+1,a+1+n,a+n))
 # Outer boundaries and selected construction seams, not a triangulated cage.
 for k in set([0,len(rings)-1,*ribs]):
  for j in range(steps):edges.append((k*n+j,k*n+j+1))
 for j in set([0,steps//4,steps//2,3*steps//4,steps]):
  for k in range(len(rings)-1):edges.append((k*n+j,(k+1)*n+j))
 return emit(name,points,faces,edges,color)

def spindle(name,start,end,width,depth,color='shell',angles=(-math.pi,math.pi)):
 delta=Vector(end)-Vector(start);length=delta.length;center=(Vector(start)+Vector(end))*.5
 return shell(name,center,[(-length*.5,width*.65,depth*.68,0),(-length*.37,width*.88,depth*.9,0),
  (0,width,depth,0),(length*.34,width*.83,depth*.88,0),(length*.5,width*.58,depth*.6,0)],angles,16,color,axis=delta,ribs=(2,))

def ellipsoid(name,center,radii,color='joint'):
 return shell(name,center,[(radii[1]*math.sin(a),radii[0]*math.cos(a),radii[2]*math.cos(a),0)
  for a in [-1.5,-1.1,-.6,0,.6,1.1,1.5]],steps=20,color=color,ribs=(3,))

def strip(name,points,width=.003,color='signal'):
 # Narrow raised graphic built as actual geometry, not a decal.
 verts=[]
 for p in points:verts.extend([(p[0]-width/2,p[1],p[2]),(p[0]+width/2,p[1],p[2])])
 faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(points)-1)]
 edges=[(i*2,(i+1)*2) for i in range(len(points)-1)]+[(i*2+1,(i+1)*2+1) for i in range(len(points)-1)]
 return emit(name,verts,faces,edges,color)

# Slim understructure ties separate shells into an anatomical silhouette.
shell('Flexible thorax',(0,0,0),[(.13,.084,.056,0),(.22,.119,.068,0),(.34,.155,.080,0),(.40,.133,.069,0)],steps=24,color='joint',ribs=(1,2))
shell('Collar bearing',(0,.442,0),[(-.024,.056,.050,0),(0,.047,.043,0),(.022,.041,.037,0)],steps=24,color='ceramic',ribs=(1,))
# Sculpted pectoral wings follow the chest curvature, with a narrow central keel.
for side in [-1,1]:
 tag='Left' if side<0 else 'Right'
 angles=(-1.38,-.06) if side<0 else (.06,1.38)
 shell(tag+' pectoral wing',(0,0,.012),[(.22,.104,.061,0),(.275,.150,.080,0),(.35,.173,.086,0),(.393,.141,.075,0)],angles,14,'copper',ribs=(2,))
 shell(tag+' clavicle',(0,0,.012),[(.382,.135,.072,0),(.417,.127,.050,0)],angles,14,'ceramic')
 shell(tag+' lateral abdominal shell',(0,0,.006),[(.095,.073,.049,0),(.16,.091,.061,0),(.222,.108,.065,0)],(-1.44,-.5) if side<0 else (.5,1.44),10,'shell',ribs=(1,))
 # Offset vertical power bars, instead of a character-specific central reactor.
 strip(tag+' power bar',[(side*.038,.287,.096),(side*.048,.316,.099),(side*.052,.346,.096)],.006)
 for i in range(3):
  shell(tag+' rib lamella '+str(i),(0,.175-i*.023,.007),[(-.010,.093-i*.007,.060,0),(.010,.101-i*.007,.065,0)],angles,12,'ceramic')
shell('Sternal keel',(0,0,.027),[(.221,.019,.047,0),(.31,.024,.071,0),(.384,.021,.054,0)],(-.5,.5),6,'shell')
shell('Pelvic yoke',(0,0,0),[(-.055,.088,.065,0),(.007,.125,.073,0),(.072,.095,.053,0)],steps=24,color='joint',ribs=(1,))
for s in [-1,1]:
 tag='L' if s<0 else 'R'
 # Rounded shoulder cups sit over a smaller ball joint.
 ellipsoid(tag+' shoulder joint',(s*.178,.365,-.004),(.053,.052,.052))
 shell(tag+' shoulder mantle',(s*.180,.371,0),[(-.046,.049,.058,0),(0,.076,.075,0),(.044,.047,.052,0)],steps=20,color='copper',ribs=(1,))
 upper=(s*.193,.323,0);elbow=(s*.226,.170,-.005);wrist=(s*.250,.012,.012)
 spindle(tag+' upper arm',elbow,upper,.047,.049,'shell')
 ellipsoid(tag+' elbow bearing',elbow,(.034,.034,.035),'joint')
 spindle(tag+' forearm vambrace',wrist,(s*.232,.143,0),.044,.052,'copper',angles=(-2.6,2.6))
 spindle(tag+' forearm dorsal rail',(s*.25,.031,.059),(s*.234,.122,.046),.014,.012,'ceramic')
 ellipsoid(tag+' wrist coupling',(s*.251,-.002,.012),(.027,.020,.028),'joint')
 ellipsoid(tag+' gauntlet',(s*.254,-.038,.013),(.030,.047,.032),'shell')
 for f in range(4):
  x=s*(.232+f*.014)
  spindle(tag+' finger '+str(f),(x,-.116+abs(f-1.5)*.007,.028),(x,-.063,.041),.006,.008,'joint')
 spindle(tag+' thumb',(s*.217,-.079,.043),(s*.221,-.034,.030),.010,.009,'joint')
 shell(tag+' hip wing',(s*.074,-.006,.020),[(-.063,.046,.042,0),(0,.068,.065,0),(.045,.044,.040,0)],(-1.85,1.85),16,'copper')
 hip=(s*.075,-.045,0);knee=(s*.081,-.293,.010);ankle=(s*.087,-.536,.006)
 spindle(tag+' thigh shell',knee,hip,.069,.067,'shell',angles=(-2.85,2.85))
 spindle(tag+' outer thigh rail',(s*.133,-.238,.009),(s*.13,-.079,.011),.012,.027,'ceramic')
 ellipsoid(tag+' knee bearing',knee,(.043,.038,.047),'joint')
 shell(tag+' knee shield',(s*.081,-.291,.031),[(-.043,.024,.023,0),(0,.048,.045,0),(.039,.028,.025,0)],(-1.3,1.3),12,'copper',ribs=(1,))
 spindle(tag+' greave',ankle,(s*.083,-.323,.008),.046,.058,'copper',angles=(-2.85,2.85))
 strip(tag+' shin guide',[(s*.085,-.36,.063),(s*.087,-.45,.065),(s*.088,-.51,.044)],.004)
 ellipsoid(tag+' ankle coupling',ankle,(.033,.029,.033),'joint')
 shell(tag+' boot',(s*.088,-.565,.030),[(-.033,.047,.092,.020),(0,.048,.091,.016),(.033,.034,.063,0)],steps=20,color='shell',ribs=(1,))
 # Back assemblies help three-quarter and rotating views read as a complete suit.
 spindle(tag+' dorsal rail',(s*.069,.21,-.068),(s*.061,.392,-.064),.023,.024,'ceramic')
# Original sealed helmet: teardrop dome, cheek shell, single inset wrap visor.
shell('Helmet dome',(0,.537,0),[(-.074,.042,.045,.010),(-.045,.059,.061,0),(.014,.070,.070,-.004),(.063,.050,.054,-.009),(.082,.014,.025,-.01)],steps=28,color='ceramic',ribs=(2,))
shell('Wrap visor',(0,.549,.009),[(-.019,.062,.064,0),(.002,.067,.069,0),(.021,.059,.061,0)],(-1.10,1.10),20,'joint')
# Three subtle illuminated slits avoid duplicating the film helmet's eye silhouette.
for start,end in [(-.94,-.42),(-.27,.27),(.42,.94)]:
 shell('Visor light '+str(start),(0,.552,.010),[(-.0015,.066,.069,0),(.0015,.066,.069,0)],(start,end),8,'signal')
shell('Jaw guard',(0,.485,.014),[(-.019,.031,.039,0),(0,.047,.050,0),(.017,.053,.056,0)],(-1.3,1.3),14,'shell')
# A faceted removable lower mask contrasts with the rounded crown and wrap visor.
mask=[(-.050,.541,.069),(-.036,.505,.074),(-.023,.478,.057),(.023,.478,.057),(.036,.505,.074),(.050,.541,.069),(.027,.535,.079),(0,.492,.082),(-.027,.535,.079)]
emit('Faceted lower mask',mask,[(0,1,8),(1,2,7,8),(2,3,7),(3,4,6,7),(4,5,6),(5,0,8,6),(6,8,7)],[(0,1),(1,2),(2,3),(3,4),(4,5),(5,0),(8,7),(7,6)],'ceramic')
for side in [-1,1]:
 ellipsoid(('L' if side<0 else 'R')+' helmet comms',(side*.067,.529,-.003),(.008,.022,.024),'joint')
source=ASSETS.parent/'source-assets/original';source.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source/'aster-exosuit.blend'))
(ASSETS/'aster-exosuit.json').write_text(json.dumps({'design':'Aster fitted exosuit','authoring':'Original parametric shell geometry; no imported character assets','parts':parts},separators=(',',':')))
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'aster-exosuit.glb'),export_format='GLB',export_animations=False,export_yup=True)
print('ORIGINAL_SUIT_COMPLETE',len(parts),'parts',sum(len(p['edges'])//2 for p in parts),'segments')
