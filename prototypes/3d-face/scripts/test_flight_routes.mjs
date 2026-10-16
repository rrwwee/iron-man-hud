import assert from 'node:assert/strict';
import {globePoint,routeArc,routeSegments} from '../flight-routes.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
assert.deepEqual(globePoint(0,0),[0,0,1]);near(globePoint(0,90)[1],1);
for(const [from,to] of [[[179,20],[-179,20]],[[0,0],[180,0]],[[-122,37],[-6,53]]]){
 const arc=routeArc(from,to);assert.equal(arc.length,73);
 arc[0].forEach((x,i)=>near(x,globePoint(...from,1.008)[i]));
 arc.at(-1).forEach((x,i)=>near(x,globePoint(...to,1.008)[i]));
 assert.ok(arc.every(p=>p.every(Number.isFinite)&&Math.hypot(...p)>=1));
 assert.ok(Math.hypot(...arc[36])>1.06,'Routes must visibly rise above the globe');
}
assert.deepEqual(routeArc([0,0],[0,0]),[]);
assert.equal(routeSegments([{from:[0,0],to:[90,0]}]).length,72*6);
console.log('Flight arcs: airport endpoints, date-line crossing, antipodal stability and 3D clearance pass.');
