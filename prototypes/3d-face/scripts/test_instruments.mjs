import assert from 'node:assert/strict';
import {cursorTelemetry,summarizeActivity,createCursorHistory} from '../instrument-data.js';

for(const [x,y,theta] of [[1280,360,0],[640,0,90],[0,360,180],[640,720,270]]){
  assert.equal(cursorTelemetry(x,y,1280,720).theta,theta);
}
const origin=cursorTelemetry(640,360,1280,720);
assert.equal(origin.r,0);assert.equal(origin.theta,0);
assert.equal(cursorTelemetry(0,0,0,0).nr,0);
assert.equal(cursorTelemetry(1280,720,1280,720).nr,1);
const dates=[{date:'2026-10-01',count:99},{date:'2026-10-09',count:0},{date:'2026-10-10',count:1},{date:'2026-10-11',count:4},{date:'2026-10-12',count:8},{date:'2026-10-13',count:0}];
assert.equal(summarizeActivity({days:dates}).week,13);
assert.equal(summarizeActivity({days:dates}).streak,3);
assert.equal(summarizeActivity({days:[{date:'2026-10-10',count:1},{date:'2026-10-12',count:3}]}).streak,1);
assert.equal(summarizeActivity({days:[]}).streak,0);
const history=createCursorHistory(80,4);
assert(history.sample(0,{nx:.1,ny:.9}));
assert.equal(history.sample(40,{nx:.5,ny:.5}),false,'Sampling must follow time rather than pointer frequency');
for(let at=80;at<=320;at+=80)assert(history.sample(at,{nx:.5,ny:.5}));
assert.deepEqual(history.x,[.5,.5,.5,.5],'Stationary readings must advance and replace earlier motion');
assert.equal(history.total,5);assert.equal(history.delay(340),60);
console.log('Instrument math: cardinal angles, zero/corner radius, seven-day window, streak and date gaps pass.');
