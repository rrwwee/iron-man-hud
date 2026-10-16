import assert from 'node:assert/strict';
import {Scene,Vector3} from '../vendor/three.module.js';
import {createHUDFaceGlow} from '../hud-face-glow.js';
const scene=new Scene(),glow=createHUDFaceGlow(scene,{capacity:3});
const source=(id,x,strength=1)=>({id,position:new Vector3(x,1.6,.2),color:0xc3e2ff,power:.02,strength});
let sources=[source('selector',-.1),source('panel',-.04)];
for(let i=0;i<150;i++)glow.update(sources,1/60);
assert.equal(scene.children.length,3,'Light budget does not grow');
assert.equal(glow.needsFrame,false,'Settles instead of rendering forever');
assert.equal(glow.sample.find(s=>s.id==='panel').position[0],-.04);
const panelPower=glow.sample.find(s=>s.id==='panel').power;
// Reordering sources does not swap their state, and a moving panel carries its light.
sources=[source('panel',.09),source('selector',-.1)];glow.update(sources,1/60);
assert.equal(glow.sample.find(s=>s.id==='panel').position[0],.09);
assert.equal(glow.sample.find(s=>s.id==='panel').power,panelPower);
// Hidden HUD fades to black and releases its animation demand.
for(let i=0;i<160;i++)glow.update(sources,1/60,false);
assert.equal(glow.sample.length,0);assert.equal(glow.needsFrame,false);
// Crossfade includes both panels without changing the pool or exceeding source strength.
glow.update([source('old',-.04,.5),source('new',.09,.5)],.016);
assert.equal(scene.children.length,3);
assert.ok(glow.sample.every(s=>s.power>0&&s.power<.01&&s.position.every(Number.isFinite)));
console.log('HUD lights follow actual source positions, retain IDs, fade with visibility and return to idle within a fixed budget.');

const warmScene=new Scene(),warm=createHUDFaceGlow(warmScene,{capacity:1,tint:0xff6045,tintMix:1,gain:.4});
for(let i=0;i<150;i++)warm.update([source('panel',.03)],1/60);
assert.ok(Math.abs(warm.sample[0].power-.008)<1e-10);
assert.equal(warmScene.children[0].color.getHex(),0xff6045);
