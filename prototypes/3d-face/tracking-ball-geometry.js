const clamp=value=>Math.max(0,Math.min(1,value));

// Keep the same horizontal anchor while making room above the arriving panel.
export function trackingBallPose(progress){
  const t=clamp(progress);
  return {x:.083,y:-.012+.087*t,scale:1-.36*t};
}

export function trackingSpherePoint(x,y,radius=.037){
  const length=Math.hypot(x,y),scale=Math.min(1,radius/Math.max(length,1e-9));
  x*=scale;y*=scale;
  return [x,y,Math.sqrt(Math.max(0,radius*radius-x*x-y*y))];
}

export function trackingSphereLines(radius=.037,steps=96){
  const points=[],tau=Math.PI*2;
  const ring=point=>{
    for(let i=0;i<steps;i++)points.push(...point(i*tau/steps),...point((i+1)*tau/steps));
  };
  for(const latitude of [-60,-30,0,30,60]){
    const a=latitude*Math.PI/180,r=radius*Math.cos(a),y=radius*Math.sin(a);
    ring(t=>[r*Math.cos(t),y,r*Math.sin(t)]);
  }
  for(const longitude of [0,45,90,135]){
    const a=longitude*Math.PI/180;
    ring(t=>[radius*Math.cos(t)*Math.cos(a),radius*Math.sin(t),radius*Math.cos(t)*Math.sin(a)]);
  }
  return points;
}
