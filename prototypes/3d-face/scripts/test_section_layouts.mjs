import assert from 'node:assert/strict';
import {sectionLayouts,sectionPreviewPoint} from '../hud-section-layouts.js';
import {inPolygon,referencePolygon,diagnosticOutline} from '../hud-reference-model.js';
const wing=referencePolygon(diagnosticOutline);
for(const [id,layout] of Object.entries(sectionLayouts)){
 for(const node of layout.nodes||[]){
  for(const dx of [-56,56])for(const dy of [-52,52]){
   const p=sectionPreviewPoint(id,(node[0]+dx)/640,(node[1]+dy)/layout.height,layout.height/640);
   assert.ok(inPolygon(p.x,p.y,wing),`${id} link target must fit in its section`);
  }
 }
 const a=sectionPreviewPoint(id,.2,.3,layout.height/640),b=sectionPreviewPoint(id,.8,.3,layout.height/640);
 assert.equal(a.y,b.y,'Text rows must remain horizontal');
}
const {player,height}=sectionLayouts.video;
for(const x of [player.left,player.left+player.width])for(const y of [player.top,player.top+player.height]){
 const p=sectionPreviewPoint('video',x/640,y/height,height/640);assert.ok(inPolygon(p.x,p.y,wing),'Native player must fit in its section');
}
console.log('Open section layouts: icon targets and player fit the wing; text stays level.');
