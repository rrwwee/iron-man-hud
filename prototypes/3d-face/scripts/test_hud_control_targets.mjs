import assert from 'node:assert/strict';
import {targetSize,pickControl,viewportShift,projectControl} from '../hud-control-targets.js';
const spaced=[{key:'a',x:0,y:0},{key:'b',x:52,y:0}];
const targets=spaced.map(t=>({...t,size:targetSize(t,spaced)}));
assert.equal(targets[0].size,44);
assert.equal(pickControl(21,0,targets)?.key,'a');
assert.equal(pickControl(26,0,targets),null,'The gap between controls must not trigger either control');
assert.equal(pickControl(31,0,targets)?.key,'b');
const narrow=[{key:'a',x:0,y:0},{key:'b',x:34,y:0}];
assert.equal(targetSize(narrow[0],narrow),30,'Targets must leave a gap when the layout contracts');
assert.equal(targetSize({key:'only',x:0,y:0}),44);
assert.equal(pickControl(0,0,targets.filter(t=>t.key!=='a')),null,'Unavailable controls must not retain active targets');
assert.deepEqual(viewportShift([{x:710,y:100},{x:810,y:300}],768,1024),{x:-72,y:0});
assert.deepEqual(viewportShift([{x:10,y:10},{x:150,y:200}],768,1024),{x:20,y:20});
assert.deepEqual(viewportShift([{x:50,y:50},{x:200,y:200}],768,1024),{x:0,y:0});
// Expanded panels reserve the measured pitch-tape lane plus a 24px gutter.
for(const [width,height,tapeLeft] of [[1280,720,1130],[768,1024,655]]){
  const panel=[{x:width-450,y:170},{x:width-20,y:Math.min(height-50,600)}];
  const correction=viewportShift(panel,tapeLeft-24+30,height);
  assert.ok(Math.max(...panel.map(p=>p.x+correction.x))<=tapeLeft-24);
  assert.ok(Math.min(...panel.map(p=>p.x+correction.x))>=30);
}
// Moving visual geometry must not move an acquired mouse target away before
// pointer-down. Leaving it, or starting a transfer, releases that acquisition.
const events={},button={textContent:'CV',disabled:false,dataset:{},style:{},classList:{toggle(){}},setAttribute(){},addEventListener(name,fn){events[name]=fn;},getBoundingClientRect(){return {x:78,y:78,width:44,height:44};}};
projectControl(button,{key:'cv',x:100,y:100,size:44});events.pointerenter();
projectControl(button,{key:'cv',x:125,y:110,size:44});
assert.equal(button.style.left,'100px');
events.pointermove({clientX:112,clientY:100});assert.equal(button.style.left,'125px','Intentional pointer travel releases the old hit area immediately');
events.pointerleave();projectControl(button,{key:'cv',x:125,y:110,size:44});
assert.equal(button.style.left,'125px');
events.pointerenter();button.disabled=true;projectControl(button,{key:'cv',x:400,y:300,size:44});
assert.equal(button.style.left,'400px');
console.log('HUD controls: usable target size, separated hit areas and unavailable-control exclusion pass.');
