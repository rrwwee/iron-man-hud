import assert from 'node:assert/strict';
import {hudLayout,fromReference,referenceToVisor,diagnosticOutline,lowerOutline,compass,referencePolygon,inPolygon,previewHousingPoint,documentHousingPoint,documentOutline,documentAspect,documentChapters,documentChapterPoint,documentProgressPoint,documentProgressAt,documentActions,documentProgress,polarPoint,lowerTopEdge,seamPoint,panelSeam,cursorPlots,expandPoint,radialMeterPoint} from '../hud-reference-model.js';
// A single mirrored, isotropic mapping must carry every asset and hit target.
const origin=fromReference(374,239),right=fromReference(384,239),down=fromReference(374,249);
assert.equal(origin.x,hudLayout.cx);assert.equal(origin.y,hudLayout.cy);
assert.ok(right.x<origin.x);assert.ok(Math.abs((origin.x-right.x)-(down.y-origin.y))<1e-10);
const o=referenceToVisor(374,239),x=referenceToVisor(384,239),y=referenceToVisor(374,249);
assert.ok(Math.abs(Math.abs(x[0]-o[0])-Math.abs(y[1]-o[1]))<1e-10);
for(const outline of [diagnosticOutline,lowerOutline])for(const [x,y] of outline)assert.ok(Math.hypot(x-374,y-239)>112,'Panels must clear the centre plate');
const lower=referencePolygon(lowerOutline);
for(let i=0;i<180;i++){const a=i*Math.PI/90;assert.ok(inPolygon(compass.x+Math.cos(a)*compass.radius,compass.y+Math.sin(a)*compass.radius,lower),'Compass must fit inside its panel');}
for(const plot of cursorPlots)for(const p of referencePolygon(plot.points))assert.ok(inPolygon(p.x,p.y,lower),'Both cursor plots must fit inside the lower panel');
for(let i=0;i<=24;i++)for(const v of [0,.5,1]){const p=radialMeterPoint(i/24,v);assert.ok(inPolygon(p.x,p.y,lower),'The curved radius gauge must stay in the lower panel');assert.ok(Math.hypot(p.x-compass.x,p.y-compass.y)>compass.radius+4,'The radius gauge must clear the angle dial');}
const upperEdge=[seamPoint(128),seamPoint(260)],u=upperEdge[1].map((v,i)=>v-upperEdge[0][i]),l=lowerTopEdge[1].map((v,i)=>v-lowerTopEdge[0][i]);
assert.ok(Math.abs(u[0]*l[1]-u[1]*l[0])<1e-8,'Facing panel edges must be parallel');
for(let i=0;i<2;i++)assert.ok(Math.abs(Math.hypot(...lowerTopEdge[i].map((v,j)=>v-upperEdge[i][j]))-panelSeam.gap)<1e-8,'Facing panel edges must have a constant gap');
for(let i=0;i<24;i++){const a=i*Math.PI/12;assert.ok(inPolygon(expandPoint.x+Math.cos(a)*10,expandPoint.y+Math.sin(a)*10,referencePolygon(diagnosticOutline)),'Expand icon must fit fully inside the original edge step');}
for(const aspect of [.6,1,1.2])for(const u of [0,1])for(const v of [0,1]){const p=previewHousingPoint(u,v,aspect);assert.ok(inPolygon(p.x,p.y,referencePolygon(diagnosticOutline)),'Aspect-fitted content must remain inside diagnostic');}
// The document fits the open wing without fanning or stretching its text.
for(let col=0;col<=16;col++)for(let row=0;row<=12;row++){
  const p=documentHousingPoint(col/16,row/12);
  assert.ok(inPolygon(p.x,p.y,referencePolygon(documentOutline)),'CV and gutter must remain inside the reading frame');
  assert.ok(inPolygon(p.x,p.y,referencePolygon(diagnosticOutline)),'CV must remain inside the shared diagnostic wing');
  assert.equal(p.y,documentHousingPoint(0,row/12).y,'Text rows must stay level across the document');
  assert.equal(p.x,documentHousingPoint(col/16,0).x,'Text columns must stay parallel');
}
const tl=documentHousingPoint(0,0),tr=documentHousingPoint(1,0),bl=documentHousingPoint(0,1);
assert.ok(Math.abs((bl.y-tl.y)/(tr.x-tl.x)-documentAspect)<1e-10,'Native layout must use the frame aspect ratio');
for(const p of referencePolygon(documentOutline))assert.ok(inPolygon(p.x,p.y,referencePolygon(diagnosticOutline)),'Document frame must fit inside the wing');
const housing=referencePolygon(diagnosticOutline),frame=referencePolygon(documentOutline);
for(const chapter of documentChapters){const p=documentChapterPoint(chapter);for(const x of [-19,19])for(const y of [-19,19])assert.ok(inPolygon(p.x+x,p.y+y,housing)&&!inPolygon(p.x+x,p.y+y,frame),'Icon chapter controls must fit fully in the free upper margin');}
for(const action of documentActions){const p=fromReference(...action.point);for(let i=0;i<24;i++){const a=i*Math.PI/12;assert.ok(inPolygon(p.x+Math.cos(a)*24,p.y+Math.sin(a)*24,housing),'Circular PDF target must fit fully inside the section');}}
for(const r of [documentProgress.inner,documentProgress.outer]){const p=polarPoint(r*hudLayout.scale,documentProgress.angle);assert.ok(inPolygon(p.x,p.y,housing)&&!inPolygon(p.x,p.y,frame),'Reading progress must remain outside the document');}
console.log('Reference geometry: mirrored isotropic mapping, centre clearance, compass and content containment pass.');

for(const value of [0,.25,.5,.75,1]){const p=documentProgressPoint(value);assert.ok(Math.abs(documentProgressAt(p.x,p.y)-value)<1e-10,'The reading rail must map its full range to the document');}
assert.equal(documentProgressAt(0,0),null,'Off-rail pointer positions must not scroll the CV');
