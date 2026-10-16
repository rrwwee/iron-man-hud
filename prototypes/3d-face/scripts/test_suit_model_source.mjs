import assert from 'node:assert/strict';
import {suitModelSource} from '../suit-model-source.js';
for(const hostname of ['example.com','rrwwee.github.io','localhost','127.0.0.1','[::1]'])for(const search of ['', '?suit=iron-man-preview'])assert.equal(suitModelSource({hostname,search}),'./assets/kitesurf-gear.json');
console.log('All hosts use authored kitesurf gear; private character preview is absent.');
