import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {entries,videos} from '../site-content.js';
assert.deepEqual(videos.map(v=>v.id),['aNNdVZ-mVy4','2gA-3T-95YQ']);
assert.equal(entries.some(e=>e.kind==='Audio'),false);
assert.equal(entries.find(e=>e.id==='video').kind,'Video');
for(const name of ['i-am-iron-man.mp3','i-am-iron-man-still.jpg','nathang30-head.glb','nathang30-atlas.jpg','nathang30-closed-eyes.jpg','tony-head.glb','tony-diffuse.jpg','mark7-wireframe.json']){
 await assert.rejects(fs.access(new URL('../assets/'+name,import.meta.url)),{code:'ENOENT'},name+' must not be served');
}
const index=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
assert.ok(!index.includes("'./viewer.js"),'Old likeness viewer is not selectable');
const viewer=await fs.readFile(new URL('../head-viewer.js',import.meta.url),'utf8');
const modelLoads=[...viewer.matchAll(/loadAsync\(['"]([^'"]+)['"]\)/g)].map(match=>match[1].split('?')[0]);
assert.ok(modelLoads.includes('./assets/rory-head.glb'),'The active portrait must be Rory’s fitted model, with or without a cache version');
assert.ok(!/assets\/(nathang30|tony-head)/.test(viewer));
const volumes=await fs.readFile(new URL('../hud-volumes.js',import.meta.url),'utf8');
assert.ok(!volumes.includes("fetch('./assets/mark7-wireframe.json')"));
await assert.rejects(fs.access(new URL('../assets/IMG_7821.MOV',import.meta.url)),{code:'ENOENT'});
console.log('Publication scope: requested YouTube embeds, no rehosted media, only original character assets, no legacy viewer or suit loads.');
