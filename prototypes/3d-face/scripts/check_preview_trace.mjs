import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const traces=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
for(const trace of traces){
 assert.equal(trace.transfer.kind,'preview');
 const {moved,returned}=trace.transfer;
 const last=trace.samples.at(-1).objects;
 const targets=id=>last.filter(o=>o.id===`panel:${id}`||o.id===`model:${id}`);
 assert.ok(targets(moved).some(o=>(o.opacity??0)>.99),`${moved} never fully appeared`);
 assert.ok(targets(returned).every(o=>!o.visible||(o.opacity??0)<.001),`${returned} did not fade away`);
 for(let i=1;i<trace.samples.length;i++){
  const prev=new Map(trace.samples[i-1].objects.map(o=>[o.id,o]));
  const dt=trace.samples[i].at-trace.samples[i-1].at;
  for(const object of trace.samples[i].objects){
   const before=prev.get(object.id);if(before?.opacity===undefined||object.opacity===undefined)continue;
   assert.ok(Math.abs((object.visible?object.opacity:0)-(before.visible?before.opacity:0))<=dt/180+.05,`${object.id} opacity popped`);
  }
 }
}
console.log(`Preview audit: ${traces.length} directed switches fade out/in without opacity jumps.`);
