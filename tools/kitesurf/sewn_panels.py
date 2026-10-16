"""Partition an authored continuous garment surface along reference-guided sewn boundaries.
No intact base body survives. Clipping splits actual surface triangles; masks are not decals.
"""
from collections import defaultdict
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

def split(poly,fn,eps=1e-9):
    a=[];b=[]
    for i,p in enumerate(poly):
        q=poly[(i+1)%len(poly)];dp=fn(p);dq=fn(q)
        if dp>=-eps:a.append(p)
        if dp<=eps:b.append(p)
        if (dp>eps and dq<-eps) or (dp<-eps and dq>eps):
            t=dp/(dp-dq);v=tuple(p[j]+t*(q[j]-p[j]) for j in range(3));a.append(v);b.append(v)
    return (a if len(a)>=3 else [],b if len(b)>=3 else [])

def convex_partition(poly,outline):
    area=sum(outline[i][0]*outline[(i+1)%len(outline)][1]-outline[(i+1)%len(outline)][0]*outline[i][1] for i in range(len(outline)))
    if area<0:outline=list(reversed(outline))
    inside=poly;outside=[]
    for i,(x,y) in enumerate(outline):
        xx,yy=outline[(i+1)%len(outline)];inside,out=split(inside,lambda p:(xx-x)*(p[1]-y)-(yy-y)*(p[0]-x))
        if out:outside.append(out)
        if not inside:break
    return inside,outside

OFFSETS={'collar':(0,.065,0),'chest':(0,.008,.080),'back':(0,.008,-.085),'front-yoke':(0,.040,.045),'back-yoke':(0,.040,-.045),'gusset':(0,-.025,.065)}
for side,s in [('left',-1),('right',1)]:
    for face,z in [('front',1),('back',-1)]:
        OFFSETS[f'{side}-sleeve-{face}']=(s*.085,.008,z*.035)
        OFFSETS[f'{side}-side-{face}']=(s*.050,0,z*.033)
        OFFSETS[f'{side}-leg-{face}']=(s*.032,-.020,z*.040)
    OFFSETS[f'{side}-knee']=(s*.036,-.02,.075)
OFFSETS['harness-shell']=(0,0,-.115)
OFFSETS['spreader-front']=(0,0,.120)
OFFSETS['belt-front']=(0,0,.095)

CH=[(-.105,.400),(.105,.400),(.116,.389),(.1091,.34),(.102,.29),(.093,.24),(.083,.19),(.069,.14),(.051,.10),(.029,.077),(0,.066),(-.029,.077),(-.051,.10),(-.069,.14),(-.083,.19),(-.093,.24),(-.102,.29),(-.1091,.34),(-.116,.389)]
BK=[(0,.307),(-.086,.351),(-.104,.334),(-.099,.25),(-.086,.17),(-.063,.116),(0,.075)]
KNEE=[(.054,-.257),(.109,-.274),(.115,-.320),(.093,-.355),(.077,-.368),(.055,-.350)]
GUS=[(-.021,.010),(.021,.010),(.033,-.024),(.026,-.07),(0,-.098),(-.026,-.07),(-.033,-.024)]

def inside_xy(p,outline):
    x,y=p[0],p[1];inside=False;j=len(outline)-1
    for i in range(len(outline)):
        xi,yi=outline[i];xj,yj=outline[j]
        if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:inside=not inside
        j=i
    return inside

def panel_at(p):
    x,y,z=p
    if y>=.487:return 'collar'
    for side,ss in [('left',-1),('right',1)]:
        if ss*x+.12*y>=.199:return side+'-sleeve-'+('front' if z>=.006 else 'back')
    face='front' if z>=0 else 'back'
    if face=='front':
        if inside_xy(p,CH):return 'chest'
        for side,ss in [('left',-1),('right',1)]:
            if inside_xy(p,[(ss*x,y) for x,y in KNEE]):return side+'-knee'
        if inside_xy(p,GUS):return 'gusset'
    elif inside_xy(p,BK) or inside_xy(p,[(-x,y) for x,y in BK]):return 'back'
    if y>=(.399 if face=='front' else .305):return face+'-yoke'
    return ('right' if x>=0 else 'left')+('-side-' if y>=.012 else '-leg-')+face

def construct(ns):
    bpy=ns['bpy'];body=ns['body'];objects=ns['objects'];wire=ns['wire'];mesh=ns['mesh'];hud=ns['hud']
    polys=defaultdict(list)
    def add(k,p):
        if len(p)>=3:polys[k].append(p)
    def maskmany(candidates,outline,key):
        if not candidates:return []
        rem=[];xmin=min(x for x,y in outline);xmax=max(x for x,y in outline);ymin=min(y for x,y in outline);ymax=max(y for x,y in outline)
        for p in candidates:
            if max(v[0] for v in p)<xmin or min(v[0] for v in p)>xmax or max(v[1] for v in p)<ymin or min(v[1] for v in p)>ymax:rem.append(p);continue
            ins,out=convex_partition(p,outline)
            if ins:add(key,ins)
            rem.extend(out)
        return rem
    body.data.calc_loop_triangles()
    source_pos=[Vector(hud(v.co)) for v in body.data.vertices]
    source_norm=[Vector(hud(v.normal)) for v in body.data.vertices]
    source_tri=[tuple(t.vertices) for t in body.data.loop_triangles]
    source_tree=BVHTree.FromPolygons(source_pos,source_tri,all_triangles=True)
    ns['normalOverrides']={}
    for tri in body.data.loop_triangles:
        p=[tuple(hud(body.data.vertices[i].co)) for i in tri.vertices]
        collar,p=split(p,lambda p:p[1]-.487)
        add('collar',collar)
        if not p:continue
        for side,s in [('left',-1),('right',1)]:
            arm,p=split(p,lambda p:s*p[0]+.12*p[1]-.199)
            if arm:
                f,b=split(arm,lambda p:p[2]-.006);add(side+'-sleeve-front',f);add(side+'-sleeve-back',b)
            if not p:break
        if not p:continue
        f,b=split(p,lambda p:p[2])
        for face,part in [('front',f),('back',b)]:
            if not part:continue
            pieces=[part]
            if face=='front':
                pieces=maskmany(pieces,CH,'chest')
                for side,s in [('left',-1),('right',1)]:pieces=maskmany(pieces,[(s*x,y) for x,y in KNEE],side+'-knee')
                pieces=maskmany(pieces,GUS,'gusset')
            else:
                pieces=maskmany(pieces,BK,'back');pieces=maskmany(pieces,[(-x,y) for x,y in BK],'back')
            for p in pieces:
                yoke,p=split(p,lambda p:p[1]-(.399 if face=='front' else .305));add(face+'-yoke',yoke)
                if not p:continue
                torso,legs=split(p,lambda p:p[1]-.012)
                for label,part in [('side',torso),('leg',legs)]:
                    if not part:continue
                    right,left=split(part,lambda p:p[0]);add('right-'+label+'-'+face,right);add('left-'+label+'-'+face,left)
    # Remove the whole source body plus former decorative panel overlays and old path seams.
    discard=[body]
    for ob in list(objects):
        if ob==body:continue
        if ob.name in ['Epic smoothskin wind-block chest','Epic smoothskin back panel'] or 'Krypto knee pad' in ob.name or 'raglan and side seam' in ob.name or 'outer leg seam' in ob.name:discard.append(ob)
    for ob in discard:
        if ob in objects:objects.remove(ob)
        bpy.data.objects.remove(ob,do_unlink=True)
    names={'collar':'Epic folded collar','chest':'Epic U-shaped smoothskin chest panel','back':'Epic V-notched smoothskin back panel','front-yoke':'Epic front shoulder and entry yoke','back-yoke':'Epic back shoulder yoke','gusset':'Epic crotch gusset'}
    for key,pp in polys.items():
        vv=[];ff=[];lookup={}
        for p in pp:
            ids=[]
            for v in p:
                h=tuple(round(x,7) for x in v)
                if h not in lookup:lookup[h]=len(vv);vv.append(v)
                ids.append(lookup[h])
            # Fan triangles preserve the planar clipped source face without adding body geometry.
            for j in range(1,len(ids)-1):
                a,b,c=ids[0],ids[j],ids[j+1]
                if len({a,b,c})<3:continue
                if (Vector(vv[b])-Vector(vv[a])).cross(Vector(vv[c])-Vector(vv[a])).length<1e-10:continue
                ff.append((a,b,c))
        ec=defaultdict(int)
        for f in ff:
            for a,b in zip(f,f[1:]+f[:1]):ec[tuple(sorted((a,b)))]+=1
        es=[]
        for e,n in ec.items():
            if n!=1:continue
            a,b=Vector(vv[e[0]]),Vector(vv[e[1]]);mid=(a+b)/2
            loc,normal,idx,dist=source_tree.find_nearest(mid)
            across=(b-a).cross(normal).normalized()*.00004
            opening=abs(mid.y+.609)<.0002 or abs(mid.y-.522)<.0002 or (abs(mid.x)>.19 and abs(mid.y-.005)<.0002)
            if opening or panel_at(mid+across)!=panel_at(mid-across):es.append(e)
        mat='smoothskin' if key in ('chest','back') else ('knee' if key.endswith('-knee') else 'neoprene')
        ob=mesh(names.get(key,'Epic '+key.replace('-',' ')+' sewn panel'),vv,ff,mat,es,'garment')
        ob['explodeGroup']=key;ob['explodeOffset']=OFFSETS[key];ob['sewnPanel']=True
        smooth_norm=[]
        for v in vv:
            loc,nn,idx,dist=source_tree.find_nearest(Vector(v));a,b,c=source_tri[idx]
            n=barycentric_transform(loc,source_pos[a],source_pos[b],source_pos[c],source_norm[a],source_norm[b],source_norm[c]).normalized()
            smooth_norm.append(tuple(n))
        ob.data.normals_split_custom_set_from_vertices([ns['xyz'](n) for n in smooth_norm])
        ns['normalOverrides'][ob.name]=[[round(c,6) for c in n] for n in smooth_norm]
    # Every adornment must follow the surface it is attached to.
    for ob in list(objects):
        if ob.get('sewnPanel'):continue
        name=ob.name;cat=ob.get('category');key=None
        if cat=='garment':
            if 'Neck opening' in name:key='collar'
            elif name=="O'NEILL":key='chest'
            elif name=="O'NEILL back":key='back-yoke'
            elif 'opening binding' in name:
                side='left' if name.startswith('L ') else 'right';limb='sleeve' if 'wrist' in name else 'leg'
                # Cut cuff rings at the same front/back divide as their fabric panels.
                coords=[tuple(hud(v.co)) for v in ob.data.vertices];ob.data.calc_loop_triangles()
                for face,zsign in [('front',1),('back',-1)]:
                    pv=[];pf=[]
                    for t in ob.data.loop_triangles:
                        p=[coords[i] for i in t.vertices];p,_=split(p,lambda q:zsign*(q[2]-(.006 if limb=='sleeve' else 0)))
                        if not p:continue
                        n=len(pv);pv.extend(p)
                        pf.extend((n,n+j,n+j+1) for j in range(1,len(p)-1))
                    oo=mesh(name+' '+face,pv,pf,'neoprene',[],'garment');kk=side+'-'+limb+'-'+face;oo['explodeGroup']=kk;oo['explodeOffset']=OFFSETS[kk]
                objects.remove(ob);bpy.data.objects.remove(ob,do_unlink=True);continue
            else:key='front-yoke'
        else:
            if 'Battle belt' in name:key='belt-front'
            elif any(t in name for t in ['spreader','Spreader','Clicker','Stainless kite','hook','Hook','load plate','Bar ','bar ']):key='spreader-front'
            else:key='harness-shell'
        ob['explodeGroup']=key;ob['explodeOffset']=OFFSETS[key]
    ns['sewnPanelGroups']=list(polys)
    source_area=sum((source_pos[b]-source_pos[a]).cross(source_pos[c]-source_pos[a]).length*.5 for a,b,c in source_tri)
    panel_area=0
    for ob in objects:
        if ob.get('sewnPanel'):
            ob.data.calc_loop_triangles()
            for t in ob.data.loop_triangles:
                a,b,c=[ob.data.vertices[i].co for i in t.vertices];panel_area+=(b-a).cross(c-a).length*.5
    ns['panelPartitionValidation']={'sourceArea':source_area,'panelArea':panel_area,'relativeAreaDifference':abs(source_area-panel_area)/source_area,'sewnGroups':len(polys)}
