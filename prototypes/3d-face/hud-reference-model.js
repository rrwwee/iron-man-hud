// Reference-space model of the specified Mark VII centre and diagnostic panels.
// Source pixels are authored from Tony's view. The single mapping below mirrors
// them into the visitor's view; content and interaction use exactly this mapping.
export const hudLayout={width:800,height:1024,cx:250,cy:510,scale:1.48,referenceX:374,referenceY:239};
export const diagnosticBounds=[-.140,.007,1.529,1.71716];
export function fromReference(x,y){return {x:hudLayout.cx+(374-x)*hudLayout.scale,y:hudLayout.cy+(y-239)*hudLayout.scale};}
export function canvasToVisor(x,y){return [diagnosticBounds[0]+x/800*.147,diagnosticBounds[3]-y/1024*.18816-1.619];}
export function referenceToVisor(x,y){const p=fromReference(x,y);return canvasToVisor(p.x,p.y);}
export function polarPoint(radius,angle){return {x:hudLayout.cx+Math.cos(angle)*radius,y:hudLayout.cy+Math.sin(angle)*radius};}
export function referencePolygon(points){return points.map(([x,y])=>fromReference(x,y));}
export function ringPoint(r,a){return [374-r*Math.cos(a),239+r*Math.sin(a)];}
export function ringArc(r,a,b,n=Math.max(12,Math.ceil(Math.abs(b-a)*Math.sqrt(r)*3))){return Array.from({length:n+1},(_,i)=>ringPoint(r,a+(b-a)*i/n));}
// Shared circular seam, not two independently fitted curves.
// Outer edges are concentric circular arcs; only the intentional stepped
// transition between the upper and lower radii remains angular.
export const panelSeam={angle:.48,gap:12};
export function seamPoint(radius,offset=0){const a=panelSeam.angle;return [374-radius*Math.cos(a)+offset*Math.sin(a),239+radius*Math.sin(a)+offset*Math.cos(a)];}
export const diagnosticOutline=[...ringArc(118,-.57,panelSeam.angle),...ringArc(326,panelSeam.angle,-.046),...ringArc(338,-.085,-.585)];
export const lowerTopEdge=[seamPoint(128,panelSeam.gap),seamPoint(260,panelSeam.gap)];
export const lowerOutline=[...lowerTopEdge,...ringArc(Math.hypot(260,panelSeam.gap),panelSeam.angle+Math.atan2(panelSeam.gap,260),1.19),...ringArc(Math.hypot(128,panelSeam.gap),1.19,panelSeam.angle+Math.atan2(panelSeam.gap,128))];
export const hubOutline=ringArc(112,0,Math.PI*2,120);
// Long traces follow the shared seam; labels stay horizontal on the canvas.
export const cursorPlots=[{id:'x',points:[seamPoint(148,26),seamPoint(246,26),seamPoint(246,44),seamPoint(148,44)]},{id:'y',points:[seamPoint(148,53),seamPoint(238,53),seamPoint(238,71),seamPoint(148,71)]}];
export const radialMeterLayout={inner:246,outer:252,start:.82,end:1.15};
export const radialMeter=[...ringArc(radialMeterLayout.inner,radialMeterLayout.start,radialMeterLayout.end),...ringArc(radialMeterLayout.outer,radialMeterLayout.end,radialMeterLayout.start)];
export function radialMeterPoint(u,v){const {inner,outer,start,end}=radialMeterLayout;return fromReference(...ringPoint(inner+(outer-inner)*v,start+(end-start)*u));}
export const compass={...fromReference(...seamPoint(185,108)),radius:25*hudLayout.scale};
// Use the original step in the outside edge, without adding a new tab.
export const expandPoint=fromReference(46,210);
export const activityChannels=[{id:'github',inner:263,outer:283,start:-.05,end:.45},{id:'codex',inner:297,outer:315,start:-.04,end:.38}];
export function inPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function inActivity(x,y,ch){const dx=x-hudLayout.cx,dy=y-hudLayout.cy,r=Math.hypot(dx,dy)/hudLayout.scale,a=Math.atan2(dy,dx);return r>=ch.inner&&r<=ch.outer&&a>=ch.start&&a<=ch.end;}
export function quadPoint(points,u,v){const [a,b,c,d]=points;return {x:(1-v)*((1-u)*a.x+u*b.x)+v*((1-u)*d.x+u*c.x),y:(1-v)*((1-u)*a.y+u*b.y)+v*((1-u)*d.y+u*c.y)};}
// Preview content shares one inset and keeps its source aspect ratio.
export function previewHousingPoint(u,v,aspect){const width=Math.min(documentFrame.right-documentFrame.left,(documentFrame.bottom-documentFrame.top)/aspect);return fromReference((documentFrame.left+documentFrame.right)/2+(.5-u)*width,(documentFrame.top+documentFrame.bottom)/2+(v-.5)*width*aspect);}
export function diagnosticDepth(x,y=0){return .175+.22*(Math.sqrt(Math.max(.0001,.19**2-x*x-y*y))-.175);}
export const contentOutline=[...ringArc(128,-.65,.50),...ringArc(259,.36,-.57)];
// A level document frame sits inside the open wing. Only its depth follows the
// shared visor: rows and columns keep the source document's proportions.
export const documentFrame={left:76,right:244,top:164,bottom:297};
export const documentAspect=(documentFrame.bottom-documentFrame.top)/(documentFrame.right-documentFrame.left);
export function documentHousingPoint(u,v){
  return previewHousingPoint(u,v,documentAspect);
}
function quadraticCorner(a,b,c){return Array.from({length:9},(_,i)=>{const t=i/8;return a.map((v,j)=>(1-t)**2*v+2*(1-t)*t*b[j]+t*t*c[j]);});}
// A concentric outside edge and tangent rounded corners make the frame part of
// the housing. The document inside remains a level, undistorted reading area.
const frameArc=ringArc(318,Math.asin((168-239)/318),Math.asin((293-239)/318));
export const documentOutline=[
  [242,156],[76,156],...quadraticCorner([76,156],[66,156],frameArc[0]),
  ...frameArc.slice(1),...quadraticCorner(frameArc.at(-1),[62,305],[76,305]).slice(1),
  [242,305],...quadraticCorner([242,305],[250,305],[250,295]).slice(1),
  [250,167],...quadraticCorner([250,167],[250,160],[242,156]).slice(1)
];
// Reading controls occupy the unused triangular margins, outside the text.
export const documentChapters=[
  {label:'Education',icon:'education'},
  {label:'Experience',icon:'work'},
  {label:'Awards',icon:'award'},
  {label:'Interests',icon:'sail'}
].map((chapter,i)=>({...chapter,key:'cv:chapter:'+i,radius:205+i*38,angle:-.49}));
export function documentChapterPoint(chapter){return polarPoint(chapter.radius*hudLayout.scale,chapter.angle);}
export const documentProgress={inner:186,outer:277,angle:.425};
export function documentProgressPoint(value){const {inner,outer,angle}=documentProgress;return polarPoint((inner+(outer-inner)*value)*hudLayout.scale,angle);}
export function documentProgressAt(x,y){
  const a=documentProgressPoint(0),b=documentProgressPoint(1),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  const along=((x-a.x)*dx+(y-a.y)*dy)/(length*length),across=((x-a.x)*dy-(y-a.y)*dx)/length;
  return Math.abs(across)<=12&&along>=-.04&&along<=1.04?Math.max(0,Math.min(1,along)):null;
}
export const documentActions=[{key:'pdf',label:'Original PDF',point:[88,338],icon:'notes'}];
export const modelRegions=[hubOutline,diagnosticOutline,lowerOutline];
