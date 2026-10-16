import {createSelectorControls3D} from './selector-controls-3d.js?v=rory-29f';
import {selectorPrototype,selectorButtons,buttonRowPoint,selectorRegions,updateSelectorTrial} from './selector-prototype.js?v=selector-3';
// Traced diagnostic housings on two shallow sheets of the shared 3D visor.
import {createCodexActivity} from './codex-activity.js?v=rory-29f';
import * as THREE from 'three';
import {drawIcon} from './hud-icons.js?v=rory-29f';
import {visorDepth} from './visor-space.js?v=selector-3';
import {layout} from './hud-layouts.js?v=selector-3';
import {cursorTelemetry,createPublicActivity,createCursorHistory} from './instrument-data.js?v=rory-29f';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
import {targetSize,pickControl} from './hud-control-targets.js?v=rory-29f';
import {createHUDRelief,reliefArc} from './hud-relief.js?v=rory-29f';
import {canvasToVisor,hudLayout,fromReference,polarPoint,diagnosticOutline,lowerOutline,activityChannels,inActivity,cursorPlots,radialMeter,radialMeterPoint,compass,referencePolygon,inPolygon,quadPoint,diagnosticDepth,modelRegions,hubOutline,ringArc,seamPoint,contentOutline,documentOutline,documentChapters,documentChapterPoint,documentProgress,documentProgressPoint,documentProgressAt,documentActions} from './hud-reference-model.js?v=rory-29f';
const W=hudLayout.width,H=hudLayout.height,TAU=Math.PI*2,{cx,cy}=hudLayout;
const S=hudLayout.scale;
export function createMark7Instruments({scene,camera,stage,wake,onChoose,onBrowse,onPreviewScroll}){
  const group=new THREE.Group();scene.add(group);
  const sheets=[],bounds=layout.menuBounds,point=new THREE.Vector3(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const housing=referencePolygon(diagnosticOutline),lower=referencePolygon(lowerOutline);
  const plots=cursorPlots.map(p=>({...p,points:referencePolygon(p.points)})),radial=referencePolygon(radialMeter);
  let previewWeights={suit:1},state=null,hover=null,focused=null,visible=true,enabled=true,dirty=true,painted=0,stamp=0,transition=0;
  let mouse=null,down=null,intent=null,screenButtons=[],scrubbing=null,sampleTimer=null,activeWindow=true;
  let reading=null;
  const chapterPoint=documentChapterPoint;
  const history=createCursorHistory();
  let telemetry=cursorTelemetry(stage.clientWidth/2,stage.clientHeight/2,stage.clientWidth,stage.clientHeight);
  function scheduleSample(){
    clearTimeout(sampleTimer);sampleTimer=null;
    if(!visible||!enabled||!activeWindow||document.hidden)return;
    sampleTimer=setTimeout(()=>{sampleTimer=null;dirty=true;wake();},history.delay(performance.now()));
  }
  window.addEventListener('blur',()=>{activeWindow=false;scheduleSample();});
  window.addEventListener('focus',()=>{activeWindow=true;scheduleSample();wake();});
  document.addEventListener('visibilitychange',()=>{scheduleSample();if(!document.hidden)wake();});
  function sheet(depth){
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
    // The plate is actual cut geometry, rebuilt from the traced contours.
    // Subdivide long triangles before lifting them onto the common visor.
    const p=[],uv=[],indices=[];
    function vertex(q){const [x,y]=canvasToWorld(q);p.push(x,y,diagnosticDepth(x,y)+depth);uv.push(q.x/W,1-q.y/H);indices.push(indices.length);}
    function canvasToWorld(q){return [bounds[0]+q.x/W*(bounds[1]-bounds[0]),bounds[3]-q.y/H*(bounds[3]-bounds[2])-1.619];}
    function triangle(a,b,c,level=0){
      const ab=Math.hypot(a.x-b.x,a.y-b.y),bc=Math.hypot(b.x-c.x,b.y-c.y),ca=Math.hypot(c.x-a.x,c.y-a.y);
      if(Math.max(ab,bc,ca)>72&&level<5){const mid=(u,v)=>({x:(u.x+v.x)/2,y:(u.y+v.y)/2});
        if(ab>=bc&&ab>=ca){const m=mid(a,b);triangle(a,m,c,level+1);triangle(m,b,c,level+1);}
        else if(bc>=ca){const m=mid(b,c);triangle(a,b,m,level+1);triangle(a,m,c,level+1);}
        else{const m=mid(c,a);triangle(a,b,m,level+1);triangle(m,b,c,level+1);}return;}
      vertex(a);vertex(b);vertex(c);
    }
    for(const region of [...modelRegions.map(referencePolygon),...selectorRegions]){const points=region.map(q=>new THREE.Vector2(q.x,q.y));
      for(const [a,b,c] of THREE.ShapeUtils.triangulateShape(points,[]))triangle(points[a],points[b],points[c]);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));
    mesh.renderOrder=100+sheets.length;group.add(mesh);const result={canvas,c:canvas.getContext('2d'),texture,mesh,depth};sheets.push(result);return result;
  }
  const selector3D=selectorButtons?createSelectorControls3D(group):null;
  const back=sheet(-.002),front=sheet(.0015),activity=createPublicActivity(()=>{dirty=true;wake();}),codexActivity=createCodexActivity(()=>{dirty=true;wake();});
  const lift=(x,y,z)=>{const [vx,vy]=canvasToVisor(x,y);return [vx,vy,diagnosticDepth(vx,vy)+.0015+z];};
  const ring=(radius,start,end,width,depth=.0012)=>({points:reliefArc(radius*S,start,end).map(([x,y])=>[cx+x,cy+y]),width:width*S,depth});
  const rim=(points,width=1.6,depth=.0009)=>({points,width:width*S,depth,closed:true});
  // Physical stepped edges carry the silhouette; fine canvas engraving stays
  // underneath. Their shared projection also keeps the parallel seam intact.
  createHUDRelief(group,lift,[
    rim(housing),rim(lower),
    ring(111,0,TAU,1.6),
    ...[[-1.48,1.40],[1.58,4.45]].map(([a,b])=>ring(99,a,b,4.8,.0016)),
    ...[[-1.12,.36],[.49,1.88],[2.01,4.90]].map(([a,b])=>ring(88,a,b,3.2)),
    ...plots.map(plot=>rim(plot.points,1.0,.0006)),
    {points:reliefArc(compass.radius).map(([x,y])=>[compass.x+x,compass.y+y]),width:2.4,depth:.0009,closed:true},
  ]);
  const documentRelief=createHUDRelief(group,lift,[rim(referencePolygon(documentOutline),1.6,.0009)]);
  const chapterRelief=createHUDRelief(group,lift,documentChapters.map(chapter=>{
    const p=documentChapterPoint(chapter);
    return rim(reliefArc(17,Math.PI/6,Math.PI/6+TAU,6).map(([x,y])=>[p.x+x,p.y+y]),1.0,.0007);
  }));
  const polar=(r,a)=>{const p=polarPoint(r,a);return [p.x,p.y];};
  function line(c,p,color=ink.dim,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x??v[0],v.y??v[1]):c.moveTo(v.x??v[0],v.y??v[1]));c.stroke();}
  function arc(c,x,y,r,a=0,b=TAU,color=ink.dim,width=1){c.beginPath();c.arc(x,y,r,a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function polygon(c,points,color=ink.dim,fill=false,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle='rgba(8,10,9,.32)';c.fill();}c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function refLine(c,refs,color=ink.dim,width=1){line(c,referencePolygon(refs),color,width);}
  function path(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function channelPath(c,ch){const a=ch.start,b=ch.end,inner=ch.inner*S,outer=ch.outer*S;c.beginPath();c.moveTo(...polar(inner,a));c.lineTo(...polar(outer,a));c.arc(cx,cy,outer,a,b);c.lineTo(...polar(inner,b));c.arc(cx,cy,inner,b,a,true);c.closePath();}
  function iconButton(c,x,y,icon,key,size=18,active=false){const hot=hover===key||focused===key||reading?.focus===key;c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/6+i*TAU/6,px=x+Math.cos(a)*size,py=y+Math.sin(a)*size;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fillStyle=hot?'#414441d9':'#171b19c9';c.fill();c.strokeStyle=active?ink.white:hot?ink.white:ink.dim;c.lineWidth=active||hot?1.5:1;c.stroke();drawIcon(c,icon,x,y,size*1.2,active||hot?ink.white:ink.dim);if(active)line(c,[[x-size*.48,y+size*.92],[x+size*.48,y+size*.92]],ink.red,2.5);}
  function navPoint(i){if(selectorButtons)return buttonRowPoint(['suit','globe','video','cv','about','links'].indexOf(state.entries[i].id));return polarPoint(101*S,-1.78+i*1.28/Math.max(1,(state?.entries.length||6)-1));}
  function ticks(c,r,a,b,count,length=8){for(let i=0;i<=count;i++){const t=a+(b-a)*i/count;line(c,[polar(r,t),polar(r+(i%5?length*.5:length),t)],i%5?ink.dim:ink.white,i%5?.8:1.3);}}
  function drawBack(){
    const c=back.c;c.clearRect(0,0,W,H);
    const suitWeight=previewWeights.suit||0,suitView=suitWeight>.001;
    documentRelief.mesh.visible=(previewWeights.cv||0)>.001;documentRelief.mesh.material.opacity=previewWeights.cv||0;chapterRelief.mesh.visible=(previewWeights.cv||0)>.001;chapterRelief.mesh.material.opacity=previewWeights.cv||0;
    // Three plates meet the same reference centre. Each contour is drawn once.
    polygon(c,referencePolygon(hubOutline),ink.dim,true);polygon(c,housing,ink.white,true,1.2);polygon(c,lower,ink.white,true,1.2);
    // Reference machining: a second edge, interrupted before each corner.
    c.save();path(c,housing);c.clip();
    arc(c,cx,cy,333*S,-.55,-.12,ink.dim,.8);arc(c,cx,cy,321*S,.12,.45,ink.dim,.8);
    refLine(c,[seamPoint(135, -5),seamPoint(315,-5)],ink.dim,.8);
    refLine(c,[[101,67],[266,174]],ink.dim,.7);c.restore();
    c.save();path(c,lower);c.clip();
    arc(c,cx,cy,257*S,.60,1.15,ink.dim,.8);arc(c,cx,cy,134*S,.64,1.14,ink.dim,.8);
    refLine(c,[seamPoint(143,18),seamPoint(248,18)],ink.dim,.8);c.restore();
    // A three-chamber hub, with clipped radial dividers instead of spokes.
    for(const [r,a,b,w,col] of [[108,0,TAU,1,ink.dim],[99,-1.48,1.40,7,ink.faint],[99,1.58,4.45,7,ink.faint],[94,-.28,.72,2,ink.white],[94,1.84,3.30,2,ink.dim],[88,-1.12,.36,8,ink.dim],[88,.49,1.88,8,ink.faint],[88,2.01,4.90,8,ink.faint],[78,0,TAU,1,ink.white],[75,-.36,.29,2,ink.red],[75,2.55,3.02,2,ink.red],[68,0,TAU,1,ink.dim],[58,0,TAU,1,ink.faint]])arc(c,cx,cy,r*S,a,b,col,w);
    ticks(c,109*S,0,TAU,120,3*S);ticks(c,70*S,0,TAU,72,2*S);
    for(const a of [-1.57,0,1.57,3.14]){line(c,[polar(99*S,a),polar(106*S,a)],ink.white,1.5);arc(c,...polar(84*S,a),2,0,TAU,ink.white,1);}
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+i*TAU/3,b=a+TAU/3;
      const chamber=[polar(13*S,a+.17),polar(36*S,a+.08),polar(42*S,a+.17),...Array.from({length:19},(_,j)=>polar(53*S,a+.17+(b-a-.34)*j/18)),polar(42*S,b-.17),polar(36*S,b-.08),polar(13*S,b-.17)];
      polygon(c,chamber.map(([x,y])=>({x,y})),ink.dim,true,1.3);
      line(c,[polar(9*S,a),polar(36*S,a),polar(42*S,a+.065)],ink.white,1.8);
      const p=polarPoint(61*S,a);c.save();c.translate(p.x,p.y);c.rotate(a);line(c,[[-4,-5],[1,0],[-4,5]],ink.white,1.5);c.restore();
      for(const r of [38,42,46])line(c,[polar(r*S,a+.24),polar(r*S,a+.30)],ink.red,2.4);
    }
    const core=[[-8,-4],[-4,-8],[4,-8],[8,-4],[8,4],[4,8],[-4,8],[-8,4]].map(([x,y])=>({x:cx+x*S,y:cy+y*S}));polygon(c,core,ink.white,true,1.5);
    if(suitView){c.save();c.globalAlpha=suitWeight;
    polygon(c,referencePolygon(contentOutline),ink.dim);
    // Small nested borders and calibration ticks match the machined panel edges.
    refLine(c,[[92,60],[278,179]],ink.dim,.7);refLine(c,[[99,377],[281,290]],ink.dim,.7);
    refLine(c,[[171,138],[266,197]],ink.faint,.8);
    for(let i=0;i<26;i++){const t=i/25;refLine(c,[[104+t*130,373-t*61],[106+t*130,376-t*61]],ink.dim,.7);}
    // Precisely inset outer channels follow the main wing's own circular datum.
    c.save();path(c,housing);c.clip();
    for(const r of [122,128,253,259,287,293,318,323,330])arc(c,cx,cy,r*S,-.64,.60,r===259?ink.dim:ink.faint,r===259?1.3:.8);
    ticks(c,326*S,-.46,.46,62,3*S);
    for(const ch of activityChannels){channelPath(c,ch);c.fillStyle='#04080b75';c.fill();c.strokeStyle=ink.dim;c.lineWidth=.9;c.stroke();}
    // Upper compact rails are discrete measures, not repeated fake waveforms.
    for(const [r,start,end] of [[256,-.48,-.10],[279,-.48,-.10]]){arc(c,cx,cy,r*S,start,end,ink.dim,1);ticks(c,r*S,start,end,22,4*S);}
    c.restore();c.restore();
    }
    if((previewWeights.cv||0)>.001){c.save();c.globalAlpha=previewWeights.cv;
      polygon(c,referencePolygon(documentOutline),ink.dim);
      c.save();path(c,referencePolygon(documentOutline));c.fillStyle='rgba(5,7,6,.48)';c.fill();c.restore();
      // Short mounting seams connect the inset frame to its existing housing.
      refLine(c,[[241,151],[233,156]],ink.dim);refLine(c,[[83,146],[83,156]],ink.dim);
      refLine(c,[[221,305],[213,315]],ink.dim);c.restore();
    }
    for(const plot of plots){
      polygon(c,plot.points,ink.dim);
      // One calibrated trace well per axis, like the reference's lower bank.
      for(let i=0;i<=24;i++){const u=.17+i*.80/24;line(c,[quadPoint(plot.points,u,.90),quadPoint(plot.points,u,i%4?.79:.66)],i%4?ink.faint:ink.dim,.7);}
      line(c,[quadPoint(plot.points,.14,0),quadPoint(plot.points,.14,1)],ink.dim,.8);
    }
    // Engraved scale on the lower plate follows its own outer circular edge.
    ticks(c,241*S,.83,1.14,28,-3*S);
    polygon(c,radial,ink.dim,true);
    back.texture.needsUpdate=true;
  }
  function label(c,text,p,size=13,color=ink.white){c.font=`${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,p.x,p.y);}
  function drawReading(c){
    const percent=Math.round((reading?.progress||0)*100);
    const chapterPoints=documentChapters.map(chapterPoint);
    line(c,chapterPoints,ink.faint,1);
    documentChapters.forEach((chapter,i)=>{
      const p=chapterPoints[i];iconButton(c,p.x,p.y,chapter.icon,chapter.key,17,i===(reading?.chapter??0));
    });
    const {angle}=documentProgress,normal={x:-Math.sin(angle),y:Math.cos(angle)};
    const railPoint=(t,offset)=>{const p=documentProgressPoint(t);return {x:p.x+normal.x*offset,y:p.y+normal.y*offset};};
    for(const side of [-7,7])line(c,[railPoint(0,side),railPoint(1,side)],reading?.focus==='cv:progress'?ink.white:ink.dim,.8);
    for(let i=0;i<36;i++){
      const t=(i+.5)/36;line(c,[railPoint(t,-4),railPoint(t,4)],t<=(reading?.progress||0)?ink.red:ink.faint,2.1);
    }
    line(c,[railPoint(reading?.progress||0,-8),railPoint(reading?.progress||0,8)],ink.gold,2);
    documentActions.forEach(action=>{const p=fromReference(...action.point),key=action.key==='expand'?'expand':'cv:pdf',color=hover===key?ink.white:ink.dim;
      arc(c,p.x,p.y,17,0,TAU,color,1.2);drawIcon(c,action.icon,p.x,p.y,18,color);
    });
    stage.dataset.cvReadingProgress=String(percent);
  }
  function plot(c,shape,samples){
    const q=shape.points;c.save();c.beginPath();q.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
    for(const v of [.2,.5,.8])line(c,[quadPoint(q,0,v),quadPoint(q,1,v)],ink.faint);
    const phase=Number.isFinite(history.at)?history.at/history.windowDuration%1:0;
    for(let i=0;i<4;i++){const u=.20+((i/4-phase+1)%1)*.73;line(c,[quadPoint(q,u,.06),quadPoint(q,u,.92)],ink.faint,.6);}
    const series=samples.length>1?samples:[samples[0]??.5,samples[0]??.5];
    const points=series.map((value,i)=>quadPoint(q,.20+i*.73/Math.max(1,series.length-1),.88-value*.75));line(c,points,ink.white,1.7);
    const end=quadPoint(q,.93,.88-series.at(-1)*.75);arc(c,end.x,end.y,2.5,0,TAU,ink.gold,2);
    c.restore();
    const tag=quadPoint(q,.065,.5);drawIcon(c,shape.id==='x'?'axis-x':'axis-y',tag.x,tag.y,12,ink.dim);
  }
  function drawCompass(c){
    const {x,y,radius:r}=compass;arc(c,x,y,r,0,TAU,ink.white,1.2);arc(c,x,y,r-5,0,TAU,ink.dim);arc(c,x,y,r-10,0,TAU,ink.dim,2);
    for(let i=0;i<60;i++){const a=i*TAU/60;line(c,[[x+Math.cos(a)*(r-7),y+Math.sin(a)*(r-7)],[x+Math.cos(a)*(i%5?r-3:r+1),y+Math.sin(a)*(i%5?r-3:r+1)]],i%5?ink.dim:ink.white);}
    line(c,[[x-r+15,y],[x+r-15,y]],ink.faint);line(c,[[x,y-r+15],[x,y+r-15]],ink.faint);
    const a=-telemetry.theta*Math.PI/180;
    line(c,[[x+Math.cos(a)*9,y+Math.sin(a)*9],[x+Math.cos(a)*(r-14),y+Math.sin(a)*(r-14)]],ink.gold,2);
    arc(c,x,y,7,0,TAU,ink.white);arc(c,x,y,r-13,a-.22,a+.22,ink.red,3);
  }
  function drawActivity(c){
    const d=activity.value,days=(d?.days||[]).slice(-14);
    // Distinct source-backed measures occupy the two short upper rails.
    const measures=[(d?.activeDays14??0)/14,Math.min(30,d?.streak||0)/30];
    measures.forEach((value,i)=>{const r=(256+i*23)*S;for(let j=0;j<22;j++){const a=-.48+(j+.5)*.38/22;line(c,[polar(r-3*S,a),polar(r+3*S,a)],d&&j<value*22?ink.red:ink.faint,2.2);}});
    stage.dataset.githubMeasures=JSON.stringify({activeDays14:d?.activeDays14??null,streak:d?.streak??null});
    for(const [index,ch] of activityChannels.entries()){
      const p=polarPoint((ch.inner+ch.outer)*.5*S,ch.start-.038);drawIcon(c,ch.id,p.x,p.y,18,index?ink.dim:ink.white);
      for(const v of [.25,.5,.75])arc(c,cx,cy,(ch.inner+(ch.outer-ch.inner)*v)*S,ch.start,ch.end,ink.faint);
      const channelDays=ch.id==='github'?days:(codexActivity.value.days||[]).map(d=>({...d,count:d.tokens})),channelPeak=Math.max(1,...channelDays.map(d=>d.count));
      if(channelDays.length){
        const values=channelDays.map((v,i)=>{const span=Math.max(1,(Date.parse(channelDays.at(-1).date)-Date.parse(channelDays[0].date))/86400000),slot=(Date.parse(v.date)-Date.parse(channelDays[0].date))/86400000,a=ch.start+.025+slot*(ch.end-ch.start-.05)/span,r=ch.inner+4+(ch.outer-ch.inner-8)*v.count/channelPeak;line(c,[polar((ch.inner+4)*S,a),polar(r*S,a)],ink.red,3.7);return polarPoint(r*S,a);});line(c,values,ink.gold,1.5);
      }else{const a=(ch.start+ch.end)/2;for(let j=-1;j<=1;j++)line(c,[polar((ch.inner+12)*S,a+j*.018),polar((ch.inner+28)*S,a+j*.018+.012)],ink.dim,1.3);}
    }
    const github=activityChannels.find(ch=>ch.id==='github');
    const datePoint=polarPoint((github.outer-2)*S,(github.start+github.end)/2);
    label(c,d?.throughDate?`${d.throughDate}${d.calendarStatus==='stale'?' · STALE':''}`:'UNAVAILABLE',datePoint,11,d?.calendarStatus==='fresh'?ink.white:ink.gold);
    stage.dataset.githubActivity=JSON.stringify({total:d.total,week:d.week,fetchedAt:d.fetchedAt,throughDate:d.throughDate,calendarStatus:d.calendarStatus});
    stage.setAttribute('aria-description',d.statusLabel);
  }
  function paint(now){
    if(!state||now-stamp<80)return;stamp=now;dirty=false;
    const c=front.c;c.clearRect(0,0,W,H);const item=state.entries[state.selected];
    state.entries.forEach((entry,i)=>{const p=navPoint(i),chosen=i===state.selected,a=-1.78+i*1.28/Math.max(1,state.entries.length-1);
      if(selectorButtons){
        // The controls are real recessed meshes, not circles on this canvas.
      }else{
        arc(c,cx,cy,96*S,a-.075,a+.075,chosen?ink.red:ink.dim,chosen?3:1);
        iconButton(c,p.x,p.y,entry.icon||entry.id,'select:'+entry.id,12);
        if(chosen)arc(c,p.x,p.y,15,0,TAU,ink.red,1.5);
      }
    });
    // The selector already names the Section. Keep the central hub unlabelled.
    // Four channels, in the four different instrument forms shown by the reference.
    plots.forEach(s=>plot(c,s,history[s.id]));
    for(let i=0;i<24;i++){const u=.15+(i+.5)*.83/24;line(c,[radialMeterPoint(u,.12),radialMeterPoint(u,.88)],i<telemetry.nr*24?ink.red:ink.faint,2.1);}
    const radiusTag=radialMeterPoint(.06,.5);drawIcon(c,'radius',radiusTag.x,radiusTag.y,11,ink.white);drawCompass(c);
    if((previewWeights.suit||0)>.001){c.save();c.globalAlpha=previewWeights.suit;drawActivity(c);c.restore();}else stage.removeAttribute('aria-description');
    if((previewWeights.cv||0)>.001){c.save();c.globalAlpha=previewWeights.cv;drawReading(c);c.restore();}
    selector3D?.update(state,hover,focused);
    front.texture.needsUpdate=true;stage.dataset.hudTexturePaints=String(++painted);stage.dataset.cursorTelemetry=JSON.stringify(telemetry);stage.dataset.codexData=codexActivity.value.status;stage.dataset.contentFrame='reference-cut-mesh';stage.dataset.githubMeasure='daily contributions';if(selectorPrototype)stage.dataset.selectorTrial=selectorButtons?'buttons':'arc';
  }
  function project(px,py){const x=THREE.MathUtils.lerp(bounds[0],bounds[1],px/W),y=THREE.MathUtils.lerp(bounds[3],bounds[2],py/H)-1.619;
    point.set(x,y,diagnosticDepth(x,y)+.0015).applyMatrix4(group.matrixWorld).project(camera);const r=stage.getBoundingClientRect();return {x:r.x+(point.x+1)*r.width/2,y:r.y+(1-point.y)*r.height/2};}
  function hitAt(x,y){
    if(!visible||!enabled||!state)return null;
    // Keep small icon targets usable as their shared head pose eases under the
    // pointer. The visible projection supplies a minimum screen-space target.
    const near=pickControl(x,y,screenButtons);
    if(near)return near.key;
    const r=stage.getBoundingClientRect();pointer.set((x-r.x)/r.width*2-1,1-(y-r.y)/r.height*2);ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObject(front.mesh)[0];if(!hit)return null;
    const px=hit.uv.x*W,py=(1-hit.uv.y)*H,d=Math.hypot(px-cx,py-cy);
    if(state.entries[state.selected].id==='cv'){
      const progress=documentProgressAt(px,py);if(progress!==null)return 'cv:progress:'+progress;
      for(const [i,chapter] of documentChapters.entries()){
        const p=chapterPoint(chapter),dx=px-p.x,dy=py-p.y;
        if(Math.abs(dx)<19&&Math.abs(dy)<19)return chapter.key;
      }
      for(const action of documentActions){const p=fromReference(...action.point),dx=px-p.x,dy=py-p.y;
        if(Math.hypot(dx,dy)<24)return 'cv:pdf';
      }
    }
    for(let i=0;i<state.entries.length;i++){const p=navPoint(i);if(Math.hypot(px-p.x,py-p.y)<26)return 'select:'+state.entries[i].id;}
    if(inPolygon(px,py,housing)){
      if(state.entries[state.selected].id==='suit')for(const ch of activityChannels)if(inActivity(px,py,ch))return 'data:'+ch.id;
      return 'preview';
    }
    if(inPolygon(px,py,lower))return null;
    if(d<82)return null;
    if(d<115*S)return 'selector';return null;
  }
  const setHover=key=>{if(key!==hover){hover=key;dirty=true;wake();}};
  stage.addEventListener('pointermove',e=>{
    const r=stage.getBoundingClientRect();telemetry=cursorTelemetry(e.clientX-r.x,e.clientY-r.y,r.width,r.height);dirty=true;wake();
    const now=performance.now();
    mouse=[e.clientX,e.clientY];let candidate=e.hudContentCursor?null:hitAt(...mouse);
    if(scrubbing){
      // Anchor the gesture to the rail at pointer-down. Head motion must not
      // move the input range out from under an active drag.
      const {a,b}=scrubbing,dx=b.x-a.x,dy=b.y-a.y;
      const value=Math.max(0,Math.min(1,((e.clientX-a.x)*dx+(e.clientY-a.y)*dy)/(dx*dx+dy*dy)));
      candidate='cv:progress:'+value;onChoose(candidate);down=null;
    }
    if(candidate)intent={key:candidate,x:e.clientX,y:e.clientY,at:now};else if(e.hudContentCursor||!intent||Math.hypot(e.clientX-intent.x,e.clientY-intent.y)>16)intent=null;setHover(candidate);stage.style.cursor=e.hudContentCursor||(hover?(hover==='preview'?'grab':'pointer'):'');
  });
  stage.addEventListener('pointerleave',()=>{mouse=null;setHover(null);});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('[data-ui]'))return;down={x:e.clientX,y:e.clientY,key:intent&&performance.now()-intent.at<800&&Math.hypot(e.clientX-intent.x,e.clientY-intent.y)<16?intent.key:hitAt(e.clientX,e.clientY)};if(down.key?.startsWith('cv:progress:')){const a=documentProgressPoint(0),b=documentProgressPoint(1);scrubbing={a:project(a.x,a.y),b:project(b.x,b.y)};stage.setPointerCapture(e.pointerId);onChoose(down.key);down=null;}});
  const stopScrubbing=e=>{if(scrubbing&&stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);scrubbing=null;};
  stage.addEventListener('pointerup',stopScrubbing);stage.addEventListener('pointercancel',stopScrubbing);
  stage.addEventListener('click',e=>{if(e.target.closest('[data-ui]'))return;const d=down;down=null;if(d?.key&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<12&&!['selector','preview'].includes(d.key)){e.preventDefault();onChoose(d.key);}});
  stage.addEventListener('wheel',e=>{if(e.target.closest('[data-ui]'))return;const key=hitAt(e.clientX,e.clientY);if(!key)return;e.preventDefault();if(key==='selector'||key.startsWith('select:'))onBrowse(e.deltaY);else if(key==='preview'||key.startsWith('cv:progress:'))onPreviewScroll(e.deltaY);},{passive:false});
  drawBack();
  return {
    get motionSamples(){return selector3D?.centres.map((p,i)=>({id:'button:'+selector3D.ids[i],visible:true,points:p.toArray()}))||[];},
    beginTransfer(value){selector3D?.beginTransfer(value);dirty=true;wake();},setExpandedAnchor(value){selector3D?.setExpandedAnchor(value);},
    update(value){selector3D?.update(value,hover,focused);const previous=state?.entries[state.selected]?.id;if(previous!==value.entries[value.selected]?.id)transition=performance.now()+300;state=value;if(previous!==state.entries[state.selected]?.id)drawBack();updateSelectorTrial(value);dirty=true;wake();},
    setLocationState(){dirty=true;wake();},setExpanded(){dirty=true;wake();},setSuitState(){},setContentOpen(){},
    setPreviewWeights(value){const changed=Object.keys({...previewWeights,...value}).some(id=>Math.abs((previewWeights[id]||0)-(value[id]||0))>.00001);if(changed){previewWeights={...value};drawBack();dirty=true;}},
    setReadingState(value){if(reading?.focus!==value?.focus||reading?.chapter!==value?.chapter||Math.round((reading?.progress??-1)*100)!==Math.round((value?.progress??-1)*100)){reading=value;dirty=true;wake();}},
    focus(value){focused=value;dirty=true;wake();},setEnabled(value){enabled=value;group.visible=visible&&enabled;scheduleSample();},setVisible(value){visible=value;group.visible=visible&&enabled;scheduleSample();},
    setPose(){group.updateWorldMatrix(true,true);camera.updateMatrixWorld();selector3D?.fitTargets(camera,stage);if(mouse)setHover(hitAt(...mouse));const now=performance.now();if(activeWindow&&visible&&enabled&&!document.hidden&&history.sample(now,telemetry)){dirty=true;stage.dataset.cursorSampleCount=String(history.total);stage.dataset.cursorHistory=JSON.stringify({x:history.x,y:history.y});}scheduleSample();if(now<transition)dirty=true;if(dirty)paint(now);selector3D?.tick(now);
      const buttonEntries=state?[...state.entries,...(state.expandedId?[{id:state.expandedId,label:'Return '+state.expandedId+' to the menu'}]:[])]:[];
      const buttons=buttonEntries.map((item,i)=>{let position;if(selector3D){point.copy(selector3D.centres[selector3D.ids.indexOf(item.id)]).applyMatrix4(group.matrixWorld).project(camera);const r=stage.getBoundingClientRect();position={x:r.x+(point.x+1)*r.width/2,y:r.y+(1-point.y)*r.height/2};}else position=project(navPoint(i).x,navPoint(i).y);return {...position,key:'select:'+item.id,label:item.label};});
      const chapters=state?.entries[state.selected].id==='cv'?documentChapters.map(chapter=>({...project(chapterPoint(chapter).x,chapterPoint(chapter).y),key:chapter.key,label:chapter.label})):[];
      const actions=state?.entries[state.selected].id==='cv'?documentActions.map(action=>{const p=fromReference(...action.point);return {...project(p.x,p.y),key:'cv:pdf',label:action.label};}):[];
      screenButtons=[...buttons,...chapters,...actions];
      screenButtons=screenButtons.map(target=>({...target,size:targetSize(target,screenButtons)}));
      stage.dataset.hudTargets=JSON.stringify(screenButtons.filter(t=>t.key.startsWith('select:')));
      stage.dataset.cvTargets=JSON.stringify([...screenButtons.filter(t=>t.key.startsWith('cv:')),...(chapters.length?[0,.5,1].map(value=>{const p=documentProgressPoint(value);return {...project(p.x,p.y),key:'cv:progress:'+value};}):[])]);
      const preview=fromReference(207,238),gh=polarPoint(273*S,.20),codex=polarPoint(306*S,.17);
      stage.dataset.instrumentTargets=JSON.stringify([{...project(preview.x,preview.y),key:'preview'},{...project(cx,cy),key:'hub'},{...project(gh.x,gh.y),key:'data:github'},{...project(codex.x,codex.y),key:'data:codex'},...plots.map(s=>{const p=quadPoint(s.points,.5,.5);return {...project(p.x,p.y),key:'cursor:'+s.id};}),{...project(...Object.values(radialMeterPoint(.5,.5))),key:'cursor:r'},{...project(compass.x,compass.y),key:'cursor:theta'}]);},
    get needsFrame(){return dirty||!!selector3D?.needsFrame||performance.now()<transition;},get frame(){return group.matrixWorld;},get controlTargets(){return screenButtons;},hitTarget:hitAt,
    contentAnchor(){return new THREE.Vector3(...layout.preview.slice(0,2),visorDepth(...layout.preview.slice(0,2)));},
    get hovering(){return !!hover;},get activity(){return {...activity.value,codex:codexActivity.value};},
  };
}
