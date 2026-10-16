"""Original reference-guided Epic wetsuit + generic Warrior waist harness.
No imported mesh or photo textures. HUD coordinates X right, Y up, Z front.
Blender background --python build_gear.py; all outputs stay beside this file.
"""
import bpy,bmesh,math,json,os
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
SOURCE_DIR=Path(__file__).resolve().parent
import argparse,sys
args=argparse.ArgumentParser()
args.add_argument('--output',type=Path,default=SOURCE_DIR.parents[1]/'.private-assets/kitesurf-build')
options=args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
ROOT=options.output.resolve();ROOT.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
COLORS={'neoprene':(.016,.021,.025),'smoothskin':(.048,.054,.059),'knee':(.022,.027,.030),'seam':(.045,.054,.060),'harness':(.021,.030,.055),'padding':(.030,.041,.065),'mint':(.20,.39,.34),'webbing':(.011,.016,.018),'hardware':(.34,.39,.42),'zip':(.10,.115,.12),'label':(.44,.47,.46)}
MATS={}
for name,col in COLORS.items():
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*col,1);n.inputs['Roughness'].default_value=.82 if name not in ('hardware','smoothskin','zip') else (.25 if name=='hardware' else .47);n.inputs['Metallic'].default_value=.85 if name=='hardware' else 0
 if name in ('neoprene','harness','padding','webbing','knee'):
  noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=650;noise.inputs['Detail'].default_value=2
  bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.0004
  m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],n.inputs['Normal'])
 MATS[name]=m
objects=[];wire={}
def xyz(p):return (p[0],-p[2],p[1])
def hud(p):return (p[0],p[2],-p[1])
def mesh(name,vs,fs,mat='neoprene',edges=None,category='garment'):
 me=bpy.data.meshes.new(name);me.from_pydata([xyz(p) for p in vs],[],fs);me.update()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(MATS[mat]);ob['category']=category;ob['material']=mat
 for p in me.polygons:p.use_smooth=True
 objects.append(ob);wire[name]=edges or []
 return ob

def tube(name,points,r=.001,mat='seam',steps=4,closed=False,category='garment',show=True):
 vs=[];fs=[];n=len(points)
 for i,p in enumerate(points):
  q0=Vector(points[(i-1)%n] if closed or i else points[0]);q1=Vector(points[(i+1)%n] if closed or i<n-1 else points[-1]);t=(q1-q0).normalized();a=t.cross(Vector((0,0,1)))
  if a.length<.01:a=t.cross(Vector((1,0,0)))
  a.normalize();b=t.cross(a).normalized()
  for j in range(steps):vs.append(tuple(Vector(p)+r*(a*math.cos(j*2*math.pi/steps)+b*math.sin(j*2*math.pi/steps))))
 for i in range(n if closed else n-1):
  k=(i+1)%n
  for j in range(steps):fs.append((i*steps+j,i*steps+(j+1)%steps,k*steps+(j+1)%steps,k*steps+j))
 if not closed:fs.extend([tuple(reversed(range(steps))),tuple((n-1)*steps+j for j in range(steps))])
 es=[(i*steps,((i+1)%n)*steps) for i in range(n if closed else n-1)] if show else []
 return mesh(name,vs,fs,mat,es,category)

def smooth_path(points,sub=4):
 out=[];p=[Vector(v) for v in points]
 for i in range(len(p)-1):
  a=p[max(0,i-1)];b=p[i];c=p[i+1];d=p[min(len(p)-1,i+2)]
  for j in range(sub):
   t=j/sub;out.append(tuple(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)))
 out.append(tuple(p[-1]));return out

def loft(name,rings,mat='neoprene',steps=32,cap=True):
 vs=[(x+rx*math.sin(2*math.pi*j/steps),y,z+rz*math.cos(2*math.pi*j/steps)) for x,y,z,rx,rz in rings for j in range(steps)]
 fs=[(k*steps+j,k*steps+(j+1)%steps,(k+1)*steps+(j+1)%steps,(k+1)*steps+j) for k in range(len(rings)-1) for j in range(steps)]
 if cap:fs += [tuple(reversed(range(steps))),tuple((len(rings)-1)*steps+j for j in range(steps))]
 return mesh(name,vs,fs,mat)

# Anatomical garment form: narrow waist, natural rounded deltoids, no armor anatomy.
raw=[]
raw.append(loft('Body source',[(0,-.09,0,.052,.038),(0,-.05,0,.113,.066),(0,.01,-.005,.125,.074),(0,.10,-.004,.107,.064),(0,.19,0,.109,.067),(0,.29,0,.134,.080),(0,.385,0,.151,.074),(0,.435,0,.150,.062),(0,.462,0,.126,.055),(0,.482,0,.060,.044),(0,.505,0,.041,.038),(0,.540,0,.040,.037)]))
for s in (-1,1):
 tag='Left' if s<0 else 'Right'
 raw.append(loft(tag+' sleeve source',[(s*.138,.450,0,.035,.042),(s*.171,.417,0,.042,.043),(s*.186,.366,0,.039,.040),(s*.207,.289,.001,.036,.036),(s*.223,.225,.006,.030,.032),(s*.233,.174,.008,.031,.034),(s*.245,.110,.009,.028,.031),(s*.254,.050,.011,.023,.025),(s*.259,-.014,.013,.020,.022)]))
 raw.append(loft(tag+' leg source',[(s*.068,.006,-.006,.061,.068),(s*.070,-.080,-.006,.060,.065),(s*.077,-.170,-.005,.051,.052),(s*.083,-.256,.000,.041,.041),(s*.084,-.302,.006,.036,.038),(s*.086,-.355,-.005,.039,.042),(s*.087,-.408,-.010,.040,.042),(s*.089,-.477,-.006,.033,.034),(s*.090,-.552,0,.025,.027),(s*.090,-.628,.004,.023,.025)]))
bpy.ops.object.select_all(action='DESELECT')
for ob in raw:ob.select_set(True)
bpy.context.view_layer.objects.active=raw[0];bpy.ops.object.join();body=bpy.context.object;body.name='Continuous Epic neoprene shell';objects=[body]
rem=body.modifiers.new('Continuous sewn garment volume','REMESH');rem.mode='VOXEL';rem.voxel_size=.006;rem.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('Soft neoprene tailoring','SMOOTH');sm.factor=.65;sm.iterations=7;bpy.ops.object.modifier_apply(modifier=sm.name)
dec=body.modifiers.new('Runtime garment mesh','DECIMATE');dec.ratio=.112;bpy.ops.object.modifier_apply(modifier=dec.name)
# Cut sleeve/ankle/neck openings and add actual inward fabric thickness.
bm=bmesh.new();bm.from_mesh(body.data)
for center,normal,selector in [((0,0,.522),(0,0,1),lambda v:True),((0,0,-.609),(0,0,-1),lambda v:True),((.258,0,.005),(0,0,-1),lambda v:v.co.x>.19),((-.258,0,.005),(0,0,-1),lambda v:v.co.x<-.19)]:
 geom=[v for v in bm.verts if selector(v)]+[e for e in bm.edges if all(selector(v) for v in e.verts)]+[f for f in bm.faces if all(selector(v) for v in f.verts)]
 bmesh.ops.bisect_plane(bm,geom=geom,dist=.000001,plane_co=center,plane_no=normal,clear_outer=True,clear_inner=False)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
exterior_faces=len(body.data.polygons)
sol=body.modifiers.new('Neoprene thickness at cuffs','SOLIDIFY');sol.thickness=.0035;sol.offset=-1;bpy.ops.object.modifier_apply(modifier=sol.name)
# Retain inside cloth only near neck and cuff openings; unseen inner shell is unnecessary.
bm=bmesh.new();bm.from_mesh(body.data);bm.faces.ensure_lookup_table()
todelete=[]
for f in list(bm.faces)[exterior_faces:2*exterior_faces]:
 c=f.calc_center_median();near=(c.z>.481 or c.z<-.566 or (abs(c.x)>.19 and c.z<.047))
 if not near:todelete.append(f)
bmesh.ops.delete(bm,geom=todelete,context='FACES');bm.to_mesh(body.data);bm.free()
for p in body.data.polygons:p.use_smooth=True
body['material']='neoprene';body['category']='garment';wire[body.name]=[]
# Surface queries permit seam and panel geometry to follow the curved fabric exactly.
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();bvh=BVHTree.FromObject(body,deps)
def skin(x,y,front=True,offset=.0025):
 z=2 if front else -2;loc,n,_,_=bvh.ray_cast(Vector(xyz((x,y,z))),Vector(xyz((0,0,-1 if front else 1))))
 if loc is None:loc,n,_,_=bvh.find_nearest(Vector(xyz((x,y,.025 if front else -.025))))
 p=Vector(hud(loc));p+=Vector(hud(n))*offset;return tuple(p)

def patch(name,rows,mat,front=True,cols=18,category='garment'):
 vs=[]
 for y,cx,w in rows:
  for j in range(cols+1):vs.append(skin(cx+w*(2*j/cols-1),y,front))
 fs=[(k*(cols+1)+j,k*(cols+1)+j+1,(k+1)*(cols+1)+j+1,(k+1)*(cols+1)+j) for k in range(len(rows)-1) for j in range(cols)]
 es=[(j,j+1) for j in range(cols)]+[((len(rows)-1)*(cols+1)+j,(len(rows)-1)*(cols+1)+j+1) for j in range(cols)]
 for j in (0,cols):es += [(k*(cols+1)+j,(k+1)*(cols+1)+j) for k in range(len(rows)-1)]
 if not front:fs=[tuple(reversed(f)) for f in fs]
 return mesh(name,vs,fs,mat,es,category)

# The 5370's signature smoothskin chest panel has a rounded U-shaped lower edge.
patch('Epic smoothskin wind-block chest',[(.065,0,.010),(.075,0,.030),(.10,0,.053),(.14,0,.071),(.19,0,.085),(.24,0,.095),(.29,0,.104),(.34,0,.111),(.390,0,.117),(.399,0,.105)],'smoothskin')
# Rear panel shoulder V, narrowing towards lower lumbar area.
patch('Epic smoothskin back panel',[(.073,0,.010),(.09,0,.043),(.12,0,.074),(.18,0,.087),(.24,0,.093),(.30,0,.100),(.345,0,.106)],'smoothskin',False)
# Raised neck binding follows real opening; no head or skin mannequin.
for y in (.514,.521):
 pts=[(0.040*math.sin(a),y,.037*math.cos(a)) for a in [i*2*math.pi/48 for i in range(48)]];tube('Neck opening binding %.3f'%y,pts,.0017,'neoprene',closed=True)
# Broad flexible top flap, short angled F.U.Z.E. zipper and sewn edge.
patch('F.U.Z.E. flexible chest entry flap',[(.401,0,.114),(.423,0,.123),(.445,0,.124),(.464,0,.108)],'neoprene')
for name,coords,mat,r in [('Chest flap lower seam',[(-.118,.401),(-.08,.407),(0,.410),(.08,.407),(.121,.401)],'seam',.0009),('F.U.Z.E. short chest zipper',[(-.108,.453),(-.07,.457),(-.02,.458),(.03,.457),(.08,.456),(.115,.463)],'zip',.0015)]:
 pts=[]
 for a,b in zip(coords[:-1],coords[1:]):
  for i in range(7):t=i/7;pts.append(skin(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,True,.003))
 pts.append(skin(*coords[-1],True,.003));tube(name,pts,r,mat)
# Pull tab and shoulder cord stay modest; they do not read as armor fittings.
tube('Chest zip shoulder pull cord',[skin(.115,.460,True,.004),skin(.117,.468,True,.003),skin(.096,.483,True,.003)],.0019,'zip')
tube('Zipper pull loop',[skin(.114,.448,True,.004),skin(.118,.441,True,.005),skin(.122,.450,True,.006),skin(.115,.458,True,.004)],.0018,'zip',closed=True)
# Raglan seams, side panels and knee pad outlines; no wire grid across cloth.
for s in (-1,1):
 tag='L' if s<0 else 'R'
 for front in (True,False):
  coords=[(.105,.467),(.144,.429),(.151,.390),(.143,.352),(.119,.309),(.109,.253),(.101,.190)]
  pts=[skin(s*x,y,front,.0018) for x,y in coords];tube(tag+(' front' if front else ' back')+' raglan and side seam',pts,.001,'seam')
  coords=[(.124,-.01),(.126,-.075),(.125,-.15),(.119,-.23),(.120,-.31),(.126,-.39),(.121,-.46),(.114,-.53),(.110,-.601)]
  tube(tag+(' front' if front else ' back')+' outer leg seam',[skin(s*x,y,front,.0014) for x,y in coords],.0008,'seam')
 patch(tag+' flexible Krypto knee pad',[(-.362,s*.085,.008),(-.354,s*.085,.021),(-.332,s*.085,.031),(-.302,s*.085,.032),(-.273,s*.084,.033),(-.261,s*.083,.022)],'knee',cols=12)
 # Sewn ankle and wrist bindings are true soft rings, close to fabric.
 for kind,cx,y,rx,rz,zc in [('ankle',s*.090,-.604,.0237,.0253,.004),('wrist',s*.258,.011,.0205,.0222,.013)]:
  pts=[(cx+rx*math.sin(i*2*math.pi/40),y,zc+rz*math.cos(i*2*math.pi/40)) for i in range(40)];tube(tag+' '+kind+' opening binding',pts,.0015,'neoprene',closed=True)
# Harness shell follows an elliptical waist and grows in height towards the back.
def waist_radii(y):
 profiles=[(-.05,.113,.066),(.01,.125,.074),(.10,.107,.064),(.19,.109,.067),(.29,.134,.080)]
 for i in range(len(profiles)-1):
  ya,xa,za=profiles[i];yb,xb,zb=profiles[i+1]
  if y<=yb:
   t=max(0,min(1,(y-ya)/(yb-ya)))
   return (xa*(1-t)+xb*t,za*(1-t)+zb*t)
 return profiles[-1][1:]
def harness_point(a,t,inflate=0):
 back=(1-math.cos(a))/2;h=.092+.132*back;cy=.095+.012*back
 y=cy+(t-.5)*h;rx,rz=waist_radii(y)
 return ((rx+.002+inflate)*math.sin(a),y,(rz+.002+inflate)*math.cos(a)-.003)
def rear_point(x,y,inflate=.019):
 rx,rz=waist_radii(y);rx+=.002+inflate;rz+=.002+inflate
 x=max(-rx*.97,min(rx*.97,x))
 return (x,y,-rz*math.sqrt(max(.001,1-(x/rx)**2))-.003)
vs=[];fs=[];na=72;nv=8
# Opening at front keeps the foam shell visible to either side of the separate spreader pad.
for k in range(nv+1):
 for j in range(na+1):vs.append(harness_point(.61+(2*math.pi-1.22)*j/na,k/nv,.004*math.sin(math.pi*k/nv)))
for k in range(nv):
 for j in range(na):a=k*(na+1)+j;fs.append((a,a+1,a+1+na+1,a+na+1))
es=[(k*(na+1), (k+1)*(na+1)) for k in range(nv)]+[(k*(na+1)+na,(k+1)*(na+1)+na) for k in range(nv)]
for k in (0,nv):es += [(k*(na+1)+j,k*(na+1)+j+1) for j in range(na)]
harness=mesh('Warrior wraparound anatomical softshell',vs,fs,'harness',es,'harness')
sol=harness.modifiers.new('Soft shell cushioning','SOLIDIFY');sol.thickness=.009;sol.offset=1;bpy.context.view_layer.objects.active=harness;bpy.ops.object.modifier_apply(modifier=sol.name)
# Continuous padded rims define the broad waist shape.
for t in (0,1):tube('Warrior padded '+('upper' if t else 'lower')+' perimeter',[harness_point(.61+(2*math.pi-1.22)*j/72,t,.005) for j in range(73)],.0053,'padding',category='harness')
# Moulded lumbar insert on the rear, gently curved and set within the foam perimeter.
vs=[];fs=[];es=[];N=24;K=7
for k in range(K+1):
 t=.12+.76*k/K; half=.87-.17*abs(2*k/K-1)
 for j in range(N+1):a=math.pi+(2*j/N-1)*half;vs.append(harness_point(a,t,.015))
for k in range(K):
 for j in range(N):a=k*(N+1)+j;fs.append((a,a+1,a+N+2,a+N+1))
for k in (0,K):es += [(k*(N+1)+j,k*(N+1)+j+1) for j in range(N)]
for j in (0,N):es += [(k*(N+1)+j,(k+1)*(N+1)+j) for k in range(K)]
mesh('Warrior curved lumbar support panel',vs,fs,'padding',es,'harness')
# Battle belt is a low soft overlap under the spreader pad.
def beltpatch(name,xs,y0,y1,z,mat='webbing',category='harness'):
 vs=[];N=24
 for y in (y0,y1):
  for j in range(N+1):x=xs[0]+(xs[1]-xs[0])*j/N;vs.append((x,y,z-.90*x*x))
 fs=[(j,j+1,N+j+2,N+j+1) for j in range(N)]
 es=[(j,j+1) for j in range(N)]+[(N+j+1,N+j+2) for j in range(N)]+[(0,N+1),(N,2*N+1)]
 return mesh(name,vs,fs,mat,es,category)
beltpatch('Battle belt neoprene overlap',(-.097,.097),.035,.151,.091,'webbing')
# Original-style Clickerbar pad and metal load band, following the matched 2021 Warrior photo.
def barplate(name,outline,z,mat,depth=.003):
 n=len(outline);cx=sum(x for x,y in outline)/n;cy=sum(y for x,y in outline)/n
 vs=[(cx,cy,z+.001)]+[(x,y,z-.7*x*x) for x,y in outline]+[(x,y,z-.7*x*x-depth) for x,y in outline]
 fs=[(0,j+1,(j+1)%n+1) for j in range(n)]+[(j+1,n+j+1,n+(j+1)%n+1,(j+1)%n+1) for j in range(n)]
 es=[(j+1,(j+1)%n+1) for j in range(n)]
 return mesh(name,vs,fs,mat,es,'hardware' if mat=='hardware' else 'harness')
barplate('Padded spreader bar bed',[(-.105,.055),(-.105,.120),(-.082,.139),(-.028,.145),(.027,.145),(.081,.138),(.105,.119),(.105,.056),(.081,.038),(.025,.030),(-.026,.030),(-.084,.040)],.096,'webbing',.007)
barplate('Clickerbar stainless load band',[(-.109,.077),(-.108,.105),(-.063,.111),(-.035,.106),(.037,.106),(.072,.111),(.109,.105),(.109,.077),(.069,.081),(.038,.090),(-.036,.090),(-.065,.082)],.109,'hardware',.002)
barplate('Clickerbar black central load plate',[(-.067,.124),(-.045,.130),(.049,.129),(.065,.121),(.057,.104),(.048,.083),(-.047,.081),(-.057,.104)],.115,'webbing',.004)
# Raised shaping on the padded upper and lower edge, with the characteristic curved outline.
for yy in (.047,.132):
 tube('Bar pad embossed seam %.3f'%yy,[(-.083,yy,.105),(-.059,yy+(.006 if yy>.1 else -.004),.111),(0,yy+(.010 if yy>.1 else -.006),.114),(.059,yy+(.006 if yy>.1 else -.004),.111),(.083,yy,.105)],.0012,'harness',category='harness')
for ss in (-1,1):
 barplate(('L' if ss<0 else 'R')+' Clickerbar end buckle',[(ss*x,y) for x,y in [(.092,.048),(.115,.052),(.118,.120),(.094,.127)]],.113,'webbing',.004)
 for yy in (.070,.105):tube(('L' if ss<0 else 'R')+' Clickerbar buckle slot %.3f'%yy,[(ss*.101,yy-.008,.118),(ss*.101,yy+.008,.118)],.0018,'harness',category='harness')
barplate('Clickerbar left quick release lever',[(-.090,.065),(-.079,.063),(-.077,.126),(-.090,.126)],.120,'webbing',.004)
for s in (-1,1):
 # Dual webbing paths travel around the shell to the back, not loose straps.
 for y in (.068,.116):
  aa=[s*(.68+i*1.12/20) for i in range(21)];ww=.012;vs=[]
  for yy in (y-ww/2,y+ww/2):
   for a in aa:back=(1-math.cos(a))/2;h=.092+.132*back;cy=.095+.012*back;vs.append(harness_point(a,(yy-cy)/h+.5,.015))
  fs=[(j,j+1,len(aa)+j+1,len(aa)+j) for j in range(len(aa)-1)];es=[(j,j+1) for j in range(len(aa)-1)]+[(len(aa)+j,len(aa)+j+1) for j in range(len(aa)-1)]
  mesh(('L' if s<0 else 'R')+' tension webbing %.3f'%y,vs,fs,'webbing',es,'harness')
  xx=s*.117;zz=.065
  tube(('L' if s<0 else 'R')+' webbing adjuster %.3f'%y,[(xx-s*.011,y-.010,zz+.014),(xx+s*.006,y-.010,zz-.006),(xx+s*.006,y+.010,zz-.006),(xx-s*.011,y+.010,zz+.014)],.0021,'hardware',closed=True,category='hardware')
# Paired manufacturer-style rails curl down and back; the lower lip sits below the root.
# Verified against the front photo paired with the exact navy/mint Warrior back reference.
for ss in (-1,1):
 tube(('L' if ss<0 else 'R')+' Stainless kite hook rail',smooth_path([(ss*.021,.106,.116),(ss*.022,.102,.136),(ss*.023,.091,.153),(ss*.023,.074,.164),(ss*.022,.060,.160),(ss*.018,.054,.148)]),.0040,'hardware',steps=8,category='hardware')
tube('Stainless kite hook lower lip',[(-.018,.054,.148),(-.012,.053,.146),(0,.053,.145),(.012,.053,.146),(.018,.054,.148)],.0040,'hardware',steps=8,category='hardware')
for ss in (-1,1):tube(('L' if ss<0 else 'R')+' hook mounting strut',[(ss*.032,.107,.114),(ss*.023,.106,.121),(ss*.010,.103,.122)],.0030,'hardware',category='hardware')
# User supplied Warrior: deeply moulded nested chevrons and curved navy/mint edge.
# The groove ribs are entirely original geometry over the continuous curved back.
for i in range(5):
 y=.185-i*.030
 xs=[-.100,-.073,-.038,-.024,.024,.038,.073,.100]
 ys=[y-.033,y-.032,y+.010,y+.013,y+.013,y+.010,y-.032,y-.033]
 pts=[]
 for x,yy in zip(xs,ys):
  pts.append(rear_point(x,yy,.018))
 tube('Warrior moulded chevron %d'%i,pts,.0028,'harness',steps=8,category='harness')
# Deep U surround approaches the lower centre of the anatomical panel.
pts=[]
for x,y in [(-.119,.181),(-.109,.157),(-.094,.116),(-.070,.067),(-.042,.032),(0,.023),(.042,.032),(.070,.067),(.094,.116),(.109,.157),(.119,.181)]:
 pts.append(rear_point(x*.94,y,.019))
tube('Warrior deep U padded back frame',pts,.0048,'padding',steps=8,category='harness')
tube('Warrior mint lower piping',[harness_point(.76+(2*math.pi-1.52)*j/84,.055,.011) for j in range(85)],.0018,'mint',category='harness')
tube('Warrior mint top tab',[(0,.207,-.094),(0,.225,-.094)],.0026,'mint',steps=6,category='harness')

# Small geometric typography is authored, not image texture; marks aid product identification.
def label(text,loc,size,front=True,category='garment'):
 cu=bpy.data.curves.new(text,'FONT');cu.body=text;cu.size=size;cu.align_x='CENTER';cu.extrude=.0001;cu.resolution_u=3
 ob=bpy.data.objects.new(text,cu);bpy.context.collection.objects.link(ob);ob.location=xyz(loc);ob.rotation_euler=(math.pi/2 if front else math.pi/2,0,0 if front else math.pi);ob.data.materials.append(MATS['label']);bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False);ob['material']='label';ob['category']=category;objects.append(ob);wire[ob.name]=[]
 # Apply transform so exported coordinates match Blender.
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);ob.select_set(False)
label("O'NEILL",(-.061,.382,.072),.012)
label("O'NEILL",(0,.421,-.067),.011,False)
bpy.context.view_layer.objects.active.name="O'NEILL back"
label('MYSTIC',rear_point(0,.192,.021),.012,False,'harness')
# Replace the intact construction form with actual reference-guided sewn panels.
import sys
sys.path.insert(0,str(SOURCE_DIR))
from sewn_panels import construct
construct(globals())

parts=[]
for ob in objects:
 if ob.name not in bpy.data.objects:continue
 if ob.type!='MESH':continue
 me=ob.data;me.calc_loop_triangles()
 # Refresh normals after all modifiers. Explicit edge pairs stay tied to original front vertices.
 vs=[list(map(lambda n:round(float(n),6),hud(v.co))) for v in me.vertices]
 ns=normalOverrides.get(ob.name,[list(map(lambda n:round(float(n),6),hud(v.normal))) for v in me.vertices])
 c=[sum(p[i] for p in vs)/len(vs) for i in range(3)]
 parts.append({'name':ob.name,'category':ob.get('category','garment'),'explodeGroup':ob.get('explodeGroup'),'explodeOffset':list(ob.get('explodeOffset',(0,0,0))),'sewnPanel':bool(ob.get('sewnPanel',False)),'material':ob.get('material','neoprene'),'center':c,'color':list(COLORS[ob.get('material','neoprene')]),'vertices':vs,'normals':ns,'triangles':[v for t in me.loop_triangles for v in t.vertices],'edges':[v for e in wire.get(ob.name,[]) for v in e]})
meta={'revision':2,'explosion':'Actual sewn panels; harness rearward and original-style spreader forward','id':'kitesurf-gear','publication':'original-geometry','design':"O'Neill Epic 5370 5/4 chest-zip wetsuit with Mystic Warrior waist harness",'authoring':'Original procedural garment and harness geometry, guided by official product photos. No imported third-party meshes or photo textures.','wetsuit':{'brand':"O'Neill",'model':'Epic','item':'5370-A00-M','year':2021,'size':'M','color':'Black/Black'},'harness':{'brand':'Mystic','model':'Warrior','size':'M','year':None,'color':'dark navy with mint piping','referenceNote':'Appearance follows user-supplied harness photograph. Model year not established.'},'parts':parts}
(ROOT/'gear.json').write_text(json.dumps(meta,separators=(',',':')))
# Save clean edit-ready source and GLB before adding proof lighting.
bpy.ops.object.select_all(action='DESELECT')
for ob in objects:
 if ob.name in bpy.data.objects:ob.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'gear.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'gear.glb'),export_format='GLB',use_selection=True,export_animations=False,export_yup=True)
summary={'panelPartition':panelPartitionValidation,'parts':len(parts),'vertices':sum(len(p['vertices']) for p in parts),'triangles':sum(len(p['triangles'])//3 for p in parts),'edges':sum(len(p['edges'])//2 for p in parts),'bounds':[[min(v[i] for p in parts for v in p['vertices']),max(v[i] for p in parts for v in p['vertices'])] for i in range(3)]}
(ROOT/'validation.json').write_text(json.dumps(summary,indent=2));print('GEAR_READY',summary,flush=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20
scene.render.resolution_x=900;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.085,.105,.12,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-1.8
def aim(ob,p):ob.rotation_euler=(Vector(p)-ob.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size in [('Key',(-1.3,-1.8,1.5),260,1.7),('Fill',(1.0,-1.1,.4),110,1.2),('Rim',(.5,1,1.0),370,1.5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);ob=bpy.context.object;ob.name=name;ob.data.energy=power;ob.data.shape='DISK';ob.data.size=size;aim(ob,(0,0,0))
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=1.42;scene.camera=camera
for name,deg in [('front',0),('quarter',35),('back',180)]:
 a=math.radians(deg);camera.location=(2.8*math.sin(a),-2.8*math.cos(a),.16);aim(camera,(0,0,-.035));scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'gear-proof.blend'))
# Exploded proof uses the exact runtime vectors from the geometry file.
for ob in objects:
 off=ob.get('explodeOffset',(0,0,0));ob.location=xyz(off)
camera.data.ortho_scale=1.65;a=math.radians(35);camera.location=(2.8*math.sin(a),-2.8*math.cos(a),.16);aim(camera,(0,0,-.035))
scene.render.filepath=str(ROOT/'exploded.png');bpy.ops.render.render(write_still=True)
for ob in objects:ob.location=(0,0,0)
camera.data.ortho_scale=.32;camera.location=(.7,-1.5,.38);aim(camera,(0,-.11,.095));scene.render.resolution_x=1000;scene.render.resolution_y=700
scene.render.filepath=str(ROOT/'hook-detail.png');bpy.ops.render.render(write_still=True)
print('GEAR_PROOFS_READY',flush=True)
