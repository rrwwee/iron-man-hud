// Unit-sphere geometry shared by the renderer and route tests.
export function globePoint(lon,lat,radius=1){
  const p=lat*Math.PI/180,l=lon*Math.PI/180;
  return [Math.cos(p)*Math.sin(l)*radius,Math.sin(p)*radius,Math.cos(p)*Math.cos(l)*radius];
}
export function routeArc(from,to,segments=72){
  const a=globePoint(...from),b=globePoint(...to),dot=Math.max(-1,Math.min(1,a.reduce((v,n,i)=>v+n*b[i],0))),angle=Math.acos(dot);
  if(angle<1e-6)return [];
  // Near-antipodal airports need a stable great-circle plane, too.
  let tangent=b.map((n,i)=>n-dot*a[i]);
  let length=Math.hypot(...tangent);
  if(length<1e-6){const axis=Math.abs(a[1])<.9?[0,1,0]:[1,0,0];const d=axis.reduce((v,n,i)=>v+n*a[i],0);tangent=axis.map((n,i)=>n-d*a[i]);length=Math.hypot(...tangent);}
  tangent=tangent.map(n=>n/length);
  const lift=.06+.22*angle/Math.PI;
  return Array.from({length:segments+1},(_,i)=>{const t=i/segments,r=1.008+Math.sin(Math.PI*t)*lift;return a.map((n,j)=>(n*Math.cos(angle*t)+tangent[j]*Math.sin(angle*t))*r);});
}
export function routeSegments(routes){return routes.flatMap(route=>{const points=routeArc(route.from,route.to);return points.slice(1).flatMap((p,i)=>[...points[i],...p]);});}

// Great-circle route distance, not the actual aircraft track. Repeated flights
// count separately; the public dataset deliberately contains no travel dates.
export function flightSummary(routes){
  const airports=new Set();let miles=0,flights=0;
  for(const route of routes){
    if(!Number.isSafeInteger(route.count)||route.count<1)continue;
    const a=globePoint(...route.from),b=globePoint(...route.to);
    const angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((sum,n,i)=>sum+n*b[i],0))));
    miles+=3958.7613*angle*route.count;flights+=route.count;
    airports.add(route.from.join(','));airports.add(route.to.join(','));
  }
  return {miles:Math.round(miles),flights,airports:airports.size,routes:routes.length};
}
