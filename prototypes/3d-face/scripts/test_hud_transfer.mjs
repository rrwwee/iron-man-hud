import assert from 'node:assert/strict';
import {transferDuration,transferPhase,flightPoint,rowSlot,instrumentFoldProgress} from '../hud-transfer.js';
const transfer={at:100,kind:'expand'},from=[-.06,-.09,.17],to=[.09,-.08,.16];
assert.deepEqual(flightPoint(from,to,transferPhase(100,transfer)),from);
assert.deepEqual(flightPoint(from,to,transferPhase(100+transferDuration,transfer)),to);
for(const fraction of [.05,.1,.19]){
  const point=flightPoint(from,to,transferPhase(100+transferDuration*fraction,transfer));
  assert.equal(point[0],from[0],'The outgoing button must lift before crossing the row');
  assert.ok(point[1]>from[1]);
}
for(const fraction of [.25,.5,.75]){
  const phase=transferPhase(100+transferDuration*fraction,transfer);
  const point=flightPoint(from,to,phase);
  assert.ok(point[1]>=Math.min(from[1],to[1])+.017,'The travelling button must clear the row');
}
const midpoint=transferPhase(100+transferDuration/2,transfer);
const outbound=flightPoint(from,to,midpoint,.018),inbound=flightPoint(to,from,midpoint,.041);
assert.ok(Math.hypot(...outbound.map((v,i)=>v-inbound[i]))>.022,'Swapping buttons need separate flight lanes');
const returning={at:100,kind:'return'};
assert.ok(transferPhase(100+transferDuration*.8,returning).row===1,'Make the gap before landing');
assert.deepEqual(Array.from({length:5},(_,i)=>rowSlot(i,5)),[.5,1.5,2.5,3.5,4.5]);
assert.deepEqual(Array.from({length:6},(_,i)=>rowSlot(i,6)),[0,1,2,3,4,5]);
assert.ok(transferPhase(Infinity,transfer).done,'Reduced motion must reach the final state immediately');
assert.equal(instrumentFoldProgress(100,100,false),0);
assert.equal(instrumentFoldProgress(100+transferDuration*.45,100,false),1,'The instrument must be stowed before the arriving window docks');
assert.equal(instrumentFoldProgress(100+transferDuration*.5,100,true),0,'Unfolding waits for the returning window to clear');
assert.equal(instrumentFoldProgress(100+transferDuration,100,true),1);
console.log('HUD transfer: lift clearance, shared timing, landing gap and compact row pass.');
