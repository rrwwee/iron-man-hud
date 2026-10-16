import assert from 'node:assert/strict';
import {trackingBallPose,trackingSphereLines,trackingSpherePoint} from '../tracking-ball-geometry.js';
let previousY=-Infinity,previousScale=Infinity;
for(let i=0;i<=100;i++){
  const pose=trackingBallPose(i/100);
  assert.equal(pose.x,.083,'The ball must not slide sideways');
  assert.ok(pose.y>=previousY,'Parking travels upwards');
  assert.ok(pose.scale<=previousScale&&pose.scale>=.64,'Parking remains readable without collapsing');
  previousY=pose.y;previousScale=pose.scale;
}
assert.deepEqual(trackingBallPose(-1),trackingBallPose(0));
assert.deepEqual(trackingBallPose(2),trackingBallPose(1));
const points=trackingSphereLines();
let front=false,back=false;
for(let i=0;i<points.length;i+=3){
  const [x,y,z]=points.slice(i,i+3);
  assert.ok(Math.abs(Math.hypot(x,y,z)-.037)<1e-10,'Grid is genuinely spherical');
  front ||= z>.03;back ||= z<-.03;
}
assert.ok(front&&back,'Grid has front and rear depth');
for(const [x,y] of [[0,0],[.02,.02],[1,1],[-1,1]]){
  const p=trackingSpherePoint(x,y);
  assert.ok(p.every(Number.isFinite)&&p[2]>=0);
  assert.ok(Math.abs(Math.hypot(...p)-.037)<1e-10,'Marker stays on the visible hemisphere');
}
console.log('Tracking sphere: 3D grid, surface markers, vertical parking and readable minimum scale pass.');
