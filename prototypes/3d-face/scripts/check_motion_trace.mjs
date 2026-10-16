// Validate a trace saved from the opt-in ?motionAudit browser check.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {transferDuration} from '../hud-transfer.js';
const traces=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const distance=(a,b)=>Math.max(...Array.from({length:Math.floor(a.length/3)},(_,i)=>Math.hypot(...a.slice(i*3,i*3+3).map((n,j)=>n-b[i*3+j]))));
let checked=0;
for(const trace of traces){
 const {transfer,samples}=trace;
 assert.ok(samples.length>=10,'Too few frames for a useful motion check');
 const first=new Map(samples[0].objects.map(o=>[o.id,o]));
 const last=new Map(samples.at(-1).objects.map(o=>[o.id,o]));
 for(const sample of samples){
  const phase=(sample.at-transfer.at)/transferDuration;
  for(const object of sample.objects){
   if(!object.visible||object.id.startsWith('button:'))continue;
   const travelling=[transfer.moved,transfer.returned].includes(object.id.split(':')[1]);
   const anchor=travelling?(phase<=.20?first.get(object.id):phase>=.80?last.get(object.id):null):null;
   if(anchor?.visible){
    const d=Math.max(distance(object.points,anchor.points),object.points.length===4?Math.abs(object.points[3]-anchor.points[3]):0);
    assert.ok(d<.00025,`${transfer.kind} ${transfer.returned||''} → ${transfer.moved||''}: ${object.id} jumps ${d} during ${phase<=.20?'lift':'landing'}`);
    checked++;
   }
  }
 }
 // Every button must remain on its continuous lift/travel/landing path.
 for(let i=1;i<samples.length;i++){
  const previous=new Map(samples[i-1].objects.map(o=>[o.id,o]));
  for(const object of samples[i].objects){
   const p=previous.get(object.id),start=first.get(object.id),end=last.get(object.id);
   if(!p?.visible||!object.visible||!start?.visible||!end?.visible)continue;
   const elapsed=Math.max(1,samples[i].at-samples[i-1].at)/1000;
   const travel=distance(start.points,end.points);
   const bound=(travel*4/(transferDuration*.6/1000)+.5)*elapsed+.002;
   assert.ok(distance(p.points,object.points)<bound,`${object.id} has an inter-frame discontinuity`);
  }
 }
}
console.log(`Motion audit: ${traces.length} transfers, ${checked} lift/landing pose checks, no discontinuities.`);
