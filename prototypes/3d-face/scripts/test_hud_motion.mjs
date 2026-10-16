import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
globalThis.document={body:{dataset:{}}};
let reduced=false;
globalThis.matchMedia=()=>({matches:reduced});
globalThis.fetch=()=>new Promise(()=>{});
globalThis.location={hostname:'localhost',search:''};
let now=0;
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
const {createHUDVolumes}=await import('../hud-volumes.js');
const {transferDuration}=await import('../hud-transfer.js');
function setup(){
 const scene=new THREE.Group(),camera=new THREE.PerspectiveCamera(26,16/9,.01,10);
 camera.position.z=.5;camera.updateMatrixWorld();
 let offset=new THREE.Vector3(-.012,.003,0);
 const stage={dataset:{},addEventListener(){},getBoundingClientRect:()=>({x:0,y:0,width:1280,height:720})};
 const volumes=createHUDVolumes({scene,camera,stage,wake(){},getFrame:()=>scene.matrixWorld,getExpandedOffset:()=>offset});
 const [globe,suit]=scene.children[0].children;
 return {volumes,objects:{globe,suit},setOffset(v){offset=v;}};
}
function snapshot(objects){return Object.fromEntries(Object.entries(objects).map(([id,o])=>[id,{position:o.position.clone(),scale:o.scale.x}]))}
function samePose(objects,before,label){for(const [id,o] of Object.entries(objects)){assert.ok(before[id].position.distanceTo(o.position)<1e-8,`${label}: ${id} jumps at handoff`);assert.ok(Math.abs(before[id].scale-o.scale.x)<1e-8,`${label}: ${id} scale jumps`);}}
for(const id of ['globe','suit'])for(const kind of ['expand','return','swap']){
 now=0;
 const {volumes,objects,setOffset}=setup(),other=id==='globe'?'suit':'globe';
 volumes.setMode(kind==='expand'?id:'cv');volumes.setExpanded(kind!=='expand',id);volumes.tick();
 const before=snapshot(objects),transfer={at:now,kind,moved:kind==='expand'?id:kind==='swap'?other:null,returned:kind==='expand'?null:id};
 volumes.beginTransfer(transfer);
 // Navigation changes ownership before the next frame. The new right-hand
 // panel can have a different fit, or be empty after returning to the left.
 setOffset(kind==='return'?new THREE.Vector3():new THREE.Vector3(-.007,-.002,0));
 volumes.setMode(kind==='return'||kind==='swap'?id:'cv');volumes.setExpanded(kind!=='return',kind==='swap'?other:id);volumes.tick();
 samePose(objects,before,`${id} ${kind}`);
 for(let frame=1;frame<=104;frame++){
  now=frame*10;const previous=snapshot(objects);volumes.tick();
  for(const [key,o] of Object.entries(objects)){
   assert.ok(previous[key].position.distanceTo(o.position)<.008,`${id} ${kind}: position discontinuity at ${now}ms`);
   assert.ok(Math.abs(previous[key].scale-o.scale.x)<.12,`${id} ${kind}: scale discontinuity at ${now}ms`);
  }
 }
 const landed=snapshot(objects);now+=16;volumes.tick();samePose(objects,landed,`${id} ${kind} completion`);
}
reduced=true;now=0;
const {volumes,objects,setOffset}=setup();volumes.setMode('globe');volumes.tick();
volumes.beginTransfer({at:0,kind:'expand',moved:'globe',returned:null});volumes.setExpanded(true,'globe');volumes.tick();
const landed=snapshot(objects);now=16;volumes.tick();samePose(objects,landed,'Reduced-motion immediate landing');
console.log('HUD model motion: expand/return/swap preserve displayed poses, position and scale are continuous, reduced motion lands immediately.');
