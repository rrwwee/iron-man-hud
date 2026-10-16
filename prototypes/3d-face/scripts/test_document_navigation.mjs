import assert from 'node:assert/strict';
import {scrollDocumentKey} from '../document-navigation.js';
const article={scrollTop:100,clientHeight:400,scrollHeight:1800};
for(const [key,target] of Object.entries({ArrowDown:148,ArrowUp:52,PageDown:440,PageUp:-240,Home:0,End:1400})){
 let prevented=false,stopped=false,result;
 const handled=scrollDocumentKey({key,preventDefault(){prevented=true;},stopPropagation(){stopped=true;}},article,value=>{result=value;});
 assert.equal(handled,true);assert.equal(result,target);assert.ok(prevented&&stopped,'Document navigation must not reach section shortcuts');
}
for(const event of [{key:'Escape'},{key:'Tab'},{key:'ArrowDown',ctrlKey:true}])assert.equal(scrollDocumentKey(event,article,()=>assert.fail('Unrelated keys should not scroll')),false);
console.log('Focused document keyboard scrolling consumes reading keys and preserves other shortcuts.');
