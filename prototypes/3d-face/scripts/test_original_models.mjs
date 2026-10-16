import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url=name=>new URL('../assets/'+name,import.meta.url);
const data=await fs.readFile(url('rory-head.glb'));
assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);
assert.equal(data.readUInt32LE(8),data.length);
assert.ok(data.length<19_000_000,'Fitted face stays within its current high-detail asset budget');
const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
assert.ok(gltf.buffers.every(b=>!b.uri),'Self-contained model');
assert.ok(gltf.images.every(i=>i.bufferView!==undefined),'Embedded textures');
const metadata=JSON.parse(await fs.readFile(url('rory-head-build.json'),'utf8'));
assert.ok(metadata.modelScale>0&&metadata.modelScale<1);
assert.ok(metadata.eyeCenter.length===3&&metadata.eyeCenter.every(Number.isFinite));
assert.ok(metadata.rightEye.length===3&&metadata.rightEye.every(Number.isFinite));
assert.equal(metadata.staticExpression,true);
assert.equal(metadata.eyeRig,'eyelid-and-gaze-v1');
assert.equal(metadata.morphs.length,12);
assert.equal(gltf.meshes.length,3);
assert.ok(!gltf.animations?.length,'Eye motion is runtime driven; no canned timeline');
for(const mesh of gltf.meshes) for(const p of mesh.primitives){
  assert.ok(!Object.keys(p.attributes).some(n=>n.startsWith('COLOR_')),'Authoring vertex colors are stripped');
  assert.ok(gltf.accessors[p.indices].count/3<300_000);
}
assert.ok(!JSON.stringify(gltf).match(/Tony|Nathang|Mark.?VII/i),'No old character nodes');
assert.ok(gltf.materials.some(m=>m.name==='Rory source-derived skin'));
for(const a of gltf.accessors){
 assert.ok(a.count>0);for(const value of [...(a.min||[]),...(a.max||[])])assert.ok(Number.isFinite(value));
}
const suit=JSON.parse(await fs.readFile(url('aster-exosuit.json'),'utf8'));
assert.equal(suit.parts.length,73);
let edges=0,triangles=0;
for(const p of suit.parts){
 assert.equal(p.vertices.length,p.normals.length);
 assert.equal(p.edges.length%2,0);assert.equal(p.triangles.length%3,0);
 for(const v of [...p.vertices,...p.normals,p.center,p.color])assert.ok(v.length===3&&v.every(Number.isFinite));
 for(const i of [...p.edges,...p.triangles])assert.ok(Number.isInteger(i)&&i>=0&&i<p.vertices.length);
 edges+=p.edges.length/2;triangles+=p.triangles.length/3;
}
assert.ok(edges<6000,'Batched wireframe stays lightweight');
assert.ok(triangles<15000,'Surface geometry stays within budget');
for(const name of ['Helmet dome','Faceted lower mask','L thigh shell','Right pectoral wing'])assert.ok(suit.parts.some(p=>p.name===name),name);
console.log(`Fitted face and original armour: ${Math.round(data.length/1024)} KiB fitted face with eye rig, ${suit.parts.length} authored suit parts, ${edges} wire segments and ${triangles} triangles verified.`);
