// Public profile snapshots and visitor-local telemetry; no credentials or private usage data.
export function cursorTelemetry(x,y,width,height){
  const dx=x-width/2,dy=height/2-y,r=Math.hypot(dx,dy);
  return {x:dx,y:dy,r,theta:r<.001?0:(Math.atan2(dy,dx)*180/Math.PI+360)%360,
    nx:width?x/width:.5,ny:height?1-y/height:.5,nr:Math.hypot(width/2,height/2)?r/Math.hypot(width/2,height/2):0};
}
// Time, rather than pointer events, is the horizontal axis of these plots.
export function createCursorHistory(interval=80,capacity=40){
  const x=[],y=[];let lastAt=-Infinity,total=0;
  return {x,y,windowDuration:interval*capacity,get at(){return lastAt;},get total(){return total;},sample(now,value){
    if(now-lastAt<interval)return false;
    lastAt=now;total++;x.push(value.nx);y.push(value.ny);
    if(x.length>capacity){x.shift();y.shift();}return true;
  },delay(now){return Math.max(1,interval-(now-lastAt));}};
}
export {summarizeActivity,createPublicActivity} from './public-activity.js';
