import assert from 'node:assert/strict';
import {createHUDSelection} from '../hud-selection.js';
const ids=['suit','globe','video','cv','about','links'];
const s=createHUDSelection(ids);
assert.equal(s.selected,'suit');assert.equal(s.expanded,null);
s.expand();assert.equal(s.expanded,'suit');assert.equal(s.selected,'globe');assert(!s.available.includes('suit'));assert.equal(s.select('suit'),false);
for(let i=0;i<12;i++){s.browse(1);assert.notEqual(s.selected,s.expanded);}
s.select('video');const swap=s.expand();assert.deepEqual(swap,{moved:'video',returned:'suit'});assert(s.available.includes('suit'));assert(!s.available.includes('video'));assert.equal(s.selected,'suit');
s.close();assert(s.available.includes('video'));assert.equal(s.selected,'video');assert.equal(s.expanded,null);
for(const id of ids){assert(s.select(id));s.expand();assert.equal(s.available.length,ids.length-1);assert(!s.available.includes(id));assert.notEqual(s.selected,id);s.close();assert.equal(s.available.length,ids.length);}
console.log('HUD selection: exclusive slots, replacement, menu exclusion, wraparound and return pass.');
